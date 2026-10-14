/**
 * The script (ENGINE.md §14): an episode is data. Every track is in absolute frames, authored from word IDs with the
 * DSL below; buildScript() resolves the derived parts (hold exits, carry timing, Lens dive cuts, plate-row ports, the
 * field's press/land events), sorts the tracks, runs every dev check once (printed with kitWarn) and freezes it.
 */
import {DUR, type EaseName, type PartState} from '../tokens';
import {kitWarn} from '../../shared/motion';
import type {Pt, ViewScope} from '../core/types';
import {cameraAt, type CameraKey, type CameraTrack, type ShotName} from '../camera/camera';
import type {PropEvent, StateEvent, WorldSpec} from '../world/types';
import {partById, resolveAnchor, type GlowStep} from '../world/states';
import {hopsFor, type BitSpec} from '../signal/runs';
import type {RouteEvent} from '../signal/routes';
import type {ChannelEvent} from '../energy/ChannelV2';
import type {WashEvent} from '../energy/WashV2';
import {tagExit, tagLand, type TagSpec} from '../labels/Tag2';
import {pillExit, type PillSpec} from '../labels/Pill2';
import {readoutExit, type ReadoutSpec} from '../labels/Readout2';
import type {ChipStep} from '../labels/Chip2';
import type {GlyphEvent} from '../glyphs/GlyphLayer';
import type {LensSpec} from '../lens/Lens2';
import type {WindowSpec} from '../panels/TimeWindow';
import {plateEnd, type PlateSpec} from '../panels/peel';
import {derivePorts, type PlateRowSpec} from '../panels/row';
import type {SplitSpec} from '../panels/Split';
import type {FieldEvent, FocusKey} from '../field/types';
import {hold, w} from './words';
import {runAllChecks} from '../checks/devChecks';

export interface Script {
  camera: CameraTrack;
  states: StateEvent[];
  props: PropEvent[];
  bits: BitSpec[];
  routes: RouteEvent[];
  channels: ChannelEvent[];
  washes: WashEvent[];
  tags: TagSpec[];
  pills: PillSpec[];
  readouts: ReadoutSpec[];
  chip: ChipStep[];
  glyphs: GlyphEvent[];
  lenses: LensSpec[];
  windows: WindowSpec[];
  scrims: Array<{at: number; outAt: number; inDur?: number; alpha?: number}>;
  plates: PlateSpec[];
  /** S06: one row ('chain'). */
  rows: PlateRowSpec[];
  splits: SplitSpec[];
  /** Optional overrides; the track is derived (§6.1). */
  focus?: FocusKey[];
  /** Extra events; press/land are derived. */
  field: FieldEvent[];
  /** Who holds the faked glow (one part[.block] at a time); `swellAt` frames raise its alpha 0.20 → 0.35 → 0.20 over 12 frames. */
  glow: GlowStep[];
  /** Per-event overrides; the rest is derived (§15). Keys: "button@0", "land@59"… */
  cues?: {gainDb?: Record<string, number>};
  /** The standby cue span, if any (cues export). */
  standby?: {start: number; end: number};
  /** The composition's last frame (checks, focus). Default: the latest event + 45. */
  lastFrame?: number;
}

/** What an author writes: everything but the camera is optional. */
export type ScriptInput = Partial<Script> & {camera: CameraTrack};

/* ------------------------------------------------------------------------------------------------
 * DSL helpers (each returns a fully-typed spec; frames come from w(), wEnd(), pauseAfter())
 * ---------------------------------------------------------------------------------------------- */

/**
 * A camera key. For a carry (`carry: bitId`), `at` and `dur` may be omitted: buildScript sets at = depart − DUR.carryLead
 * and dur = run frames + DUR.carryLead + DUR.carrySettle. Explicit values always win.
 */
export const cam = (to: ShotName | {center: Pt; zoom: number}, o: {at?: number; dur?: number; ease: EaseName; anchor?: Pt; carry?: string; note?: string}): CameraKey => ({
  at: o.at ?? Number.NaN,
  dur: o.dur ?? Number.NaN,
  to,
  ease: o.ease,
  anchor: o.anchor,
  carry: o.carry,
  note: o.note,
});

export const bit = (id: string, o: Omit<BitSpec, 'id'>): BitSpec => ({id, ...o});
export const tag = (id: string, text: string, o: Omit<TagSpec, 'id' | 'text'>): TagSpec => ({id, text, ...o});
export const pill = (id: string, text: string, o: Omit<PillSpec, 'id' | 'text'>): PillSpec => ({id, text, ...o});
export const flipTo = (part: string, to: PartState, at: number, o: {block?: string; scope?: ViewScope} = {}): StateEvent => ({part, to, at, ...o});
export const prop = (
  part: string,
  p: PropEvent['prop'],
  at: number,
  dur: number,
  from: number | string,
  to: number | string,
  o: {ease?: EaseName; scope?: ViewScope} = {},
): PropEvent => ({part, prop: p, at, dur, from, to, ...o});

/** A button press: contact over 3 frames from `at` ('arrive'), release over frames at+6 → at+11 ('settle'). */
export const press = (part: string, at: number, scope?: ViewScope): PropEvent[] => [
  {part, prop: 'press', at, dur: 3, from: 0, to: 1, ease: 'arrive', scope},
  {part, prop: 'press', at: at + 6, dur: 5, from: 1, to: 0, ease: 'settle', scope},
];

/** "Pointed at": the outline steps structure → textMuted over 4 frames at `at`, back over 6 frames at `to`. */
export const point = (part: string, at: number, to: number, scope?: ViewScope): PropEvent[] => [
  {part, prop: 'pointed', at, dur: 4, from: 0, to: 1, ease: 'arrive', scope},
  {part, prop: 'pointed', at: to, dur: 6, from: 1, to: 0, ease: 'exit', scope},
];

/* ------------------------------------------------------------------------------------------------
 * buildScript
 * ---------------------------------------------------------------------------------------------- */

const sortAt = <T extends {at: number}>(xs: T[]): T[] => xs.map((x, i) => ({x, i})).sort((a, b) => a.x.at - b.x.at || a.i - b.i).map((e) => e.x);

/** The latest frame any event in the script touches. */
export const scriptEnd = (s: Script): number => {
  let m = 0;
  const bump = (v: number | undefined) => {
    if (typeof v === 'number' && isFinite(v)) m = Math.max(m, v);
  };
  for (const k of s.camera.keys) bump(k.at + Math.max(0, k.dur));
  for (const b of s.bits) for (const h of b.hops) bump(h.land);
  for (const t of s.tags) bump(typeof t.exitAt === 'number' ? t.exitAt : tagLand(t));
  for (const l of s.lenses) bump(l.closeAt);
  for (const p of s.plates) bump(plateEnd(p));
  for (const x of [...s.states, ...s.props, ...s.routes, ...s.channels, ...s.chip]) bump(x.at);
  return m;
};

/** Validate and freeze a script: resolves 'hold' exits, derives ports, field press/land events and Lens dive cuts,
 *  sorts tracks, and runs every dev check once (camera rates, Bit speeds, budgets, anchors, proof of power). */
export const buildScript = (input: ScriptInput, world: WorldSpec): Readonly<Script> => {
  const s: Script = {
    camera: input.camera,
    states: [...(input.states ?? [])],
    props: [...(input.props ?? [])],
    bits: [...(input.bits ?? [])],
    routes: [...(input.routes ?? [])],
    channels: [...(input.channels ?? [])],
    washes: [...(input.washes ?? [])],
    tags: [...(input.tags ?? [])],
    pills: [...(input.pills ?? [])],
    readouts: [...(input.readouts ?? [])],
    chip: [...(input.chip ?? [])],
    glyphs: [...(input.glyphs ?? [])],
    lenses: [...(input.lenses ?? [])],
    windows: [...(input.windows ?? [])],
    scrims: [...(input.scrims ?? [])],
    plates: [...(input.plates ?? [])],
    rows: [...(input.rows ?? [])],
    splits: [...(input.splits ?? [])],
    focus: input.focus ? [...input.focus] : undefined,
    field: [...(input.field ?? [])],
    glow: [...(input.glow ?? [])],
    cues: input.cues,
    standby: input.standby,
    lastFrame: input.lastFrame,
  };

  // band events → script tracks, scoped to their band
  for (const sp of s.splits) {
    for (const b of sp.bands) {
      const scope: ViewScope = {band: b.side};
      s.states.push(...b.states.map((e) => ({...e, scope: e.scope ?? scope})));
      s.props.push(...b.props.map((e) => ({...e, scope: e.scope ?? scope})));
      s.channels.push(...b.channels.map((e) => ({...e, scope: e.scope ?? scope})));
    }
  }

  // camera: carry timing defaults, Lens dive / surface cuts
  const rails = s.rows.map((r) => ({id: r.id, rail: r.rail}));
  let keys = s.camera.keys.map((k) => {
    if ((isNaN(k.at) || isNaN(k.dur)) && k.carry) {
      const b = s.bits.find((x) => x.id === k.carry);
      if (!b) {
        kitWarn(`camera: carry key names an unknown Bit "${k.carry}"`);
        return {...k, at: isNaN(k.at) ? 0 : k.at, dur: isNaN(k.dur) ? DUR.cameraMin : k.dur};
      }
      const run = hopsFor(b, world, rails)[0].run;
      const at = isNaN(k.at) ? run.depart - DUR.carryLead : k.at;
      const dur = isNaN(k.dur) ? run.frames + DUR.carryLead + DUR.carrySettle : k.dur;
      return {...k, at, dur};
    }
    if (isNaN(k.at) || isNaN(k.dur)) {
      kitWarn(`camera: a key to "${typeof k.to === 'string' ? k.to : 'shot'}" has no at/dur and no carry`);
      return {...k, at: isNaN(k.at) ? 0 : k.at, dur: isNaN(k.dur) ? DUR.cameraMin : k.dur};
    }
    return k;
  });
  let track: CameraTrack = {...s.camera, keys};
  for (const l of s.lenses) {
    if (l.diveAt === undefined) continue;
    const before = cameraAt(l.diveAt, track);
    const focus = resolveAnchor(world, l.focus);
    const cut = l.diveAt + DUR.lensDive;
    if (!keys.some((k) => k.at === cut && k.dur <= 0)) {
      keys = [...keys, {at: cut, dur: 0, to: {center: focus, zoom: before.zoom * l.k}, ease: 'move', note: `lens ${l.id} dive`}];
    }
    if (l.surfaceAt !== undefined && !keys.some((k) => k.at === l.surfaceAt && k.dur <= 0)) {
      keys = [...keys, {at: l.surfaceAt, dur: 0, to: {center: before.center, zoom: before.zoom}, ease: 'move', note: `lens ${l.id} surface`}];
    }
    track = {...s.camera, keys};
  }
  s.camera = track;

  // 'hold' exits → frames
  s.tags = s.tags.map((t) => ({...t, exitAt: tagExit(t)}));
  s.pills = s.pills.map((p) => ({...p, exitAt: pillExit(p)}));
  s.readouts = s.readouts.map((r) => ({...r, exitAt: readoutExit(r)}));
  s.plates = s.plates.map((p) =>
    p.caption && p.caption.exitAt === 'hold' ? {...p, caption: {...p.caption, exitAt: hold(p.caption.at, p.caption.text)}} : p,
  );
  s.glyphs = s.glyphs.map((g) => (g.kind === 'command' && g.exitAt === 'hold' ? {...g, exitAt: hold(g.land ?? w(g.word), g.text)} : g));

  // plate-row ports from the row Bits' hops
  for (const row of s.rows) {
    const hops = s.bits
      .filter((b) => typeof b.scope === 'object' && 'row' in b.scope && b.scope.row === row.id)
      .flatMap((b) => hopsFor(b, world, rails));
    const ports = derivePorts(row, s.plates, hops);
    s.plates = s.plates.map((p) => (ports[p.id] && !p.ports ? {...p, ports: ports[p.id]} : p));
  }

  // derived field events: presses, landings, time breaths when a window expands
  const derived: FieldEvent[] = [];
  for (const e of s.props) {
    if (e.prop !== 'press' || typeof e.from !== 'number' || typeof e.to !== 'number' || e.to <= e.from) continue;
    if (e.scope && e.scope !== 'world') continue;
    const p = partById(world, e.part);
    if (p) derived.push({kind: 'press', at: e.at, world: [p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h / 2]});
  }
  for (const b of s.bits) {
    const hops = hopsFor(b, world, rails);
    const isRow = typeof b.scope === 'object' && 'row' in b.scope;
    const isWorld = b.scope === 'world';
    if (!isRow && !isWorld) continue;
    for (const h of hops) derived.push({kind: 'land', at: h.run.land, world: h.run.end, space: isRow ? 'screen' : 'world'});
  }
  for (const win of s.windows) derived.push({kind: 'timeBreath', at: win.expandAt});
  s.field = [...s.field, ...derived];

  // sort every track
  s.states = sortAt(s.states);
  s.props = sortAt(s.props);
  s.routes = sortAt(s.routes);
  s.channels = sortAt(s.channels);
  s.washes = sortAt(s.washes);
  s.chip = sortAt(s.chip);
  s.glow = sortAt(s.glow);
  s.field = sortAt(s.field);
  s.scrims = sortAt(s.scrims);
  if (s.lastFrame === undefined) s.lastFrame = scriptEnd(s) + 45;

  runAllChecks(s, world);
  return Object.freeze(s);
};
