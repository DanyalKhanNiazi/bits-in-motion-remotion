/**
 * States, props and anchors (ENGINE.md §4). Pure functions of the frame and the script's event lists.
 *
 * Scopes: events with no scope belong to 'world'. A plate, band or Lens view starts from the world's truth and,
 * once its own scope has an event for a part, follows its own events from then on (preview / what-if overrides).
 */
import {ALPHA, DUR, type PartState} from '../tokens';
import {kitWarn} from '../../shared/motion';
import {prog} from '../core/ease';
import {lerp} from '../core/math';
import {inheritsWorld, isPt, scopeKey, type AnchorRef, type Pt, type ViewScope, type WRect} from '../core/types';
import {byAt} from '../timeline/track';
import {iconFor, iconsVersion} from './icons';
import type {AnyWorld, PartSpec, PropEvent, StateEvent} from './types';

/* ------------------------------------------------------------------------------------------------
 * Parts and anchors
 * ---------------------------------------------------------------------------------------------- */

const PART_INDEX = new WeakMap<AnyWorld, Map<string, PartSpec>>();
export const partsById = (world: AnyWorld): Map<string, PartSpec> => {
  let m = PART_INDEX.get(world);
  if (!m) {
    m = new Map(world.parts.map((p) => [p.id, p]));
    PART_INDEX.set(world, m);
  }
  return m;
};
export const partById = (world: AnyWorld, id: string): PartSpec | undefined => partsById(world).get(id);

/** Icon props for port resolution (zoom 1, frame 0). */
const portProps = (p: PartSpec) => ({id: p.id, x: p.rect.x, y: p.rect.y, w: p.rect.w, h: p.rect.h, zoom: 1, frame: 0, ...(p.props ?? {})});

const PORTS = new WeakMap<AnyWorld, {version: number; map: Map<string, Record<string, Pt>>}>();
/** All ports of a part (memoised per world; rebuilt when the icon registry changes). */
export const portsOf = (world: AnyWorld, part: PartSpec): Record<string, Pt> => {
  let entry = PORTS.get(world);
  if (!entry || entry.version !== iconsVersion()) {
    entry = {version: iconsVersion(), map: new Map()};
    PORTS.set(world, entry);
  }
  const m = entry.map;
  let ports = m.get(part.id);
  if (!ports) {
    try {
      ports = iconFor(part.type).ports(portProps(part)) as Record<string, Pt>;
    } catch (e) {
      kitWarn(`anchors: ports() of "${part.id}" (${part.type}) threw: ${String(e)}`);
      ports = {};
    }
    m.set(part.id, ports);
  }
  return ports;
};

/** Split "partId.port" at the first dot. */
export const splitAnchor = (a: string): {part: string; port: string} => {
  const i = a.indexOf('.');
  return i < 0 ? {part: a, port: 'center'} : {part: a.slice(0, i), port: a.slice(i + 1)};
};

/** Resolve "partId.port" to a world point (through the icon registry's ports()). Literal points pass through. */
export const resolveAnchor = (world: AnyWorld, a: AnchorRef): Pt => {
  if (isPt(a)) return a;
  const {part, port} = splitAnchor(a as string);
  const p = partById(world, part);
  if (!p) {
    kitWarn(`anchors: unknown part "${part}" in anchor "${a}" (world ${world.id})`);
    return [world.bounds.x + world.bounds.w / 2, world.bounds.y + world.bounds.h / 2];
  }
  const ports = portsOf(world, p);
  const pt = ports[port];
  if (!pt) {
    kitWarn(`anchors: "${p.type}" has no port "${port}" (anchor "${a}"); using its centre`);
    return [p.rect.x + p.rect.w / 2, p.rect.y + p.rect.h / 2];
  }
  return pt;
};

/** The part an anchor sits on (undefined for literal points). */
export const anchorPart = (world: AnyWorld, a: AnchorRef): PartSpec | undefined =>
  isPt(a) ? undefined : partById(world, splitAnchor(a as string).part);

export const partRect = (world: AnyWorld, id: string): WRect | undefined => partById(world, id)?.rect;

/* ------------------------------------------------------------------------------------------------
 * States
 * ---------------------------------------------------------------------------------------------- */

const matchesScope = (evScope: ViewScope | undefined, viewKey: string, inherit: boolean): 'own' | 'world' | null => {
  const k = scopeKey(evScope);
  if (k === viewKey) return 'own';
  if (inherit && k === 'world') return 'world';
  return null;
};

/** The state of a part (or one of its blocks) at a frame in a scope, and the flip in progress. */
export const stateAt = (
  frame: number,
  events: ReadonlyArray<StateEvent>,
  part: string,
  block: string | undefined,
  scope: ViewScope,
  initial: PartState,
): {state: PartState; flip?: {from: PartState; at: number}} => {
  const vk = scopeKey(scope);
  const inherit = inheritsWorld(scope);
  let cur = initial;
  let prev = initial;
  let since = Number.NEGATIVE_INFINITY;
  let ownSeen = false;
  for (const ev of byAt(events)) {
    if (ev.at > frame) break;
    if (ev.part !== part || (ev.block ?? undefined) !== block) continue;
    const m = matchesScope(ev.scope, vk, inherit);
    if (m === null) continue;
    if (m === 'world' && ownSeen) continue;
    if (m === 'own') ownSeen = true;
    prev = cur;
    cur = ev.to;
    since = ev.at;
  }
  const flip = frame - since < DUR.stateFlip && prev !== cur ? {from: prev, at: since} : undefined;
  return {state: cur, flip};
};

/* ------------------------------------------------------------------------------------------------
 * Props
 * ---------------------------------------------------------------------------------------------- */

export type PropValue = number | string | {from: string; to: string; at: number};

/**
 * A prop's value at a frame. Numbers ease from `from` to `to` over [at, at + dur] (default 'arrive');
 * strings switch to `to` at `at` (use propValueAt to get the in-progress flip object).
 */
export const propAt = (
  frame: number,
  events: ReadonlyArray<PropEvent>,
  part: string,
  prop: string,
  scope: ViewScope,
  initial: number | string,
): number | string => {
  const v = propValueAt(frame, events, part, prop, scope, initial);
  return typeof v === 'object' ? v.to : v;
};

/** Like propAt, but a string flip in progress is returned as {from, to, at} (the icons' flip form, e.g. the rocker). */
export const propValueAt = (
  frame: number,
  events: ReadonlyArray<PropEvent>,
  part: string,
  prop: string,
  scope: ViewScope,
  initial: number | string,
): PropValue => {
  const vk = scopeKey(scope);
  const inherit = inheritsWorld(scope);
  let v: PropValue = initial;
  let ownSeen = false;
  for (const ev of byAt(events)) {
    if (ev.at > frame) break;
    if (ev.part !== part || ev.prop !== prop) continue;
    const m = matchesScope(ev.scope, vk, inherit);
    if (m === null) continue;
    if (m === 'world' && ownSeen) continue;
    if (m === 'own') ownSeen = true;
    if (typeof ev.to === 'number' && typeof ev.from === 'number') {
      v = lerp(ev.from, ev.to, prog(frame, ev.at, ev.dur, ev.ease ?? 'arrive'));
    } else {
      v = frame >= ev.at + Math.max(0, ev.dur) ? String(ev.to) : {from: String(ev.from), to: String(ev.to), at: ev.at};
    }
  }
  return v;
};

/** Every prop of a part that has events in this scope chain (name → value at the frame). */
export const propsAt = (
  frame: number,
  events: ReadonlyArray<PropEvent>,
  part: string,
  scope: ViewScope,
  initial: Record<string, unknown> | undefined,
): Record<string, PropValue> => {
  const out: Record<string, PropValue> = {};
  const names = new Set<string>();
  // round 2: only props with an event in THIS scope chain (a prop driven in another plate's scope must not reset this
  // view's part to the default 0: S08's monitors lost their screen content to plate 6's `contentIn` event)
  const vk = scopeKey(scope);
  const inherit = inheritsWorld(scope);
  for (const ev of events) if (ev.part === part && matchesScope(ev.scope, vk, inherit) !== null) names.add(ev.prop);
  for (const n of names) {
    const init = initial && (typeof initial[n] === 'number' || typeof initial[n] === 'string') ? (initial[n] as number | string) : n === 'opacity' || n === 'seated' ? 1 : 0;
    out[n] = propValueAt(frame, events, part, n, scope, init);
  }
  return out;
};

/* ------------------------------------------------------------------------------------------------
 * The faked glow (bible §6.6): one holder at a time, 5-frame hand-overs, swells 0.20 → 0.35 → 0.20 over 12 frames
 * ---------------------------------------------------------------------------------------------- */

export interface GlowStep {
  at: number;
  holder: string | null;
  swellAt?: number[];
}

/** Who glows at a frame, with alphas (a hand-over fades the old holder out while the new one fades in). */
export const glowsAt = (frame: number, glow: ReadonlyArray<GlowStep>): Array<{holder: string; alpha: number}> => {
  const steps = byAt(glow);
  let cur: GlowStep | null = null;
  let prev: GlowStep | null = null;
  for (const s of steps) {
    if (s.at > frame) break;
    prev = cur;
    cur = s;
  }
  if (!cur) return [];
  const out: Array<{holder: string; alpha: number}> = [];
  const t = prev ? prog(frame, cur.at, DUR.stateFlip, 'arrive') : 1;
  if (cur.holder) {
    let a = ALPHA.glow * t;
    for (const s of cur.swellAt ?? []) {
      if (frame >= s && frame < s + 12) a += 0.15 * Math.sin((Math.PI * (frame - s)) / 12);
    }
    out.push({holder: cur.holder, alpha: a});
  }
  if (prev && prev.holder && prev.holder !== cur.holder && t < 1) out.push({holder: prev.holder, alpha: ALPHA.glow * (1 - t)});
  return out;
};

/** The single holder with the highest alpha (ENGINE.md's glowAt shape). */
export const glowAt = (frame: number, glow: ReadonlyArray<GlowStep>): {holder: string; alpha: number} | null => {
  const g = glowsAt(frame, glow);
  if (g.length === 0) return null;
  return g.reduce((a, b) => (b.alpha > a.alpha ? b : a));
};
