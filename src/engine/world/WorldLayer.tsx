/**
 * Draws a world (or a scene) through the icon registry (ENGINE.md §4.1), in WORLD coordinates inside the view's
 * camera transform. Order: grounds (case, board) → board vias → `under` (washes) → parts by order / z.
 * Each part gets: zoom (its plane's), its 2.5D side for this camera, the detail opacity for its on-screen size, its
 * state and flip in this view's scope, its props (from PropEvents), the glow, and its blocks' states.
 * Room objects (depth ≠ 1) are drawn on their own parallax plane, matched to the deck at the reference shot.
 */
import React from 'react';
import {COLOR, DETAIL, type PartState} from '../tokens';
import {rectPath} from '../../shared/geom';
import {layerCam, sideOffset, type Cam, type Shot, type ViewCam} from '../camera/camera';
import type {Pt, ViewScope} from '../core/types';
import {Vias} from '../field/Vias';
import type {FieldEvent} from '../field/types';
import type {FieldPing} from '../field/opacity';
import {GROUND_TYPES, iconFor, iconsVersion} from './icons';
import {detailOfPx, type BlockProp} from './placeholder';
import {propsAt, stateAt} from './states';
import type {AnyWorld, PartSpec, PropEvent, StateEvent} from './types';

export interface WorldLayerProps {
  world: AnyWorld;
  frame: number;
  /** The view's camera (the deck plane). */
  cam: Cam | ViewCam;
  scope: ViewScope;
  script: {states: ReadonlyArray<StateEvent>; props: ReadonlyArray<PropEvent>};
  /** Parts to hide in this view. */
  hide?: string[];
  /** Glow holder(s) at this frame ("part" or "part.block") and alpha (script glowsAt()). */
  glow?: {holder: string; alpha: number} | ReadonlyArray<{holder: string; alpha: number}> | null;
  /** Multiply on-screen size before computing `detail` (plates and Lens: DETAIL.plateBias). */
  detailBias?: number;
  /** Knockout render: grounds and top-face fills only. */
  fillsOnly?: boolean;
  /** Board vias (field L3) for this view: the field's focus point and events, in this view's screen space. */
  vias?: {focus: Pt; events: ReadonlyArray<FieldEvent>; pings?: ReadonlyArray<FieldPing>} | null;
  /** Parallax reference shot (room objects). */
  refShot?: Shot;
  /** Prefix for icon ids (unique per view). */
  idPrefix?: string;
  /** Drawn after grounds and vias, under the parts (the powered-domain washes). */
  under?: React.ReactNode;
  /** Round 3: peeled sockets: parts ('part') or blocks ('part.block') whose plate is out, 0..1 (a dimmed part with a
   *  dashed outline: the plate carries the part, the world keeps where it came from). */
  ghosts?: ReadonlyMap<string, number> | null;
}

/** Round 3: how much a ghosted part keeps of itself, and its dashed socket outline. */
export const GHOST_KEEP = 0.22;
export const GhostOutline: React.FC<{x: number; y: number; w: number; h: number; r: number; zoom: number; amount: number}> = ({x, y, w, h, r, zoom, amount}) => (
  <path
    d={rectPath(x, y, w, h, r)}
    fill="none"
    stroke={COLOR.annotation}
    strokeOpacity={0.85 * amount}
    strokeWidth={2.5 / zoom}
    strokeDasharray={`${10 / zoom} ${7 / zoom}`}
  />
);

const SORTED = new WeakMap<AnyWorld, {grounds: PartSpec[]; parts: PartSpec[]; version: number}>();
export const sortedParts = (world: AnyWorld): {grounds: PartSpec[]; parts: PartSpec[]} => {
  let s = SORTED.get(world);
  if (!s || s.version !== iconsVersion()) {
    const grounds = world.parts.filter((p) => GROUND_TYPES.has(p.type));
    const rest = world.parts
      .map((p, i) => ({p, i}))
      .filter(({p}) => !GROUND_TYPES.has(p.type))
      .sort((a, b) => {
        const oa = a.p.order ?? a.p.z ?? iconFor(a.p.type).z;
        const ob = b.p.order ?? b.p.z ?? iconFor(b.p.type).z;
        return oa - ob || a.i - b.i;
      })
      .map(({p}) => p);
    s = {grounds, parts: rest, version: iconsVersion()};
    SORTED.set(world, s);
  }
  return s;
};

const glowList = (g: WorldLayerProps['glow']): ReadonlyArray<{holder: string; alpha: number}> =>
  !g ? [] : Array.isArray(g) ? (g as ReadonlyArray<{holder: string; alpha: number}>) : [g as {holder: string; alpha: number}];

/** Inner transform that moves a part from the deck plane onto its own parallax plane. */
const planeTransform = (deck: Cam | ViewCam, plane: Cam | ViewCam): string => {
  const k = plane.zoom / deck.zoom;
  const tx = deck.center[0] - k * plane.center[0];
  const ty = deck.center[1] - k * plane.center[1];
  return `translate(${tx} ${ty}) scale(${k})`;
};

export const PartView: React.FC<{
  part: PartSpec;
  frame: number;
  cam: Cam | ViewCam;
  scope: ViewScope;
  script: WorldLayerProps['script'];
  glows: ReadonlyArray<{holder: string; alpha: number}>;
  detailBias: number;
  fillsOnly: boolean;
  refShot?: Shot;
  idPrefix: string;
  ghosts?: ReadonlyMap<string, number> | null;
}> = ({part, frame, cam, scope, script, glows, detailBias, fillsOnly, refShot, idPrefix, ghosts}) => {
  const spec = iconFor(part.type);
  const depth = part.depth ?? 1;
  const pc = depth !== 1 && refShot ? layerCam(cam, depth, refShot) : cam;
  const z = part.z ?? spec.z;
  const side = sideOffset(pc, part.rect, z);
  const st = spec.passive ? {state: 'off' as PartState, flip: undefined} : stateAt(frame, script.states, part.id, undefined, scope, part.initial ?? 'off');
  const pv = propsAt(frame, script.props, part.id, scope, part.props);
  const {pointed, opacity, ...rest} = pv;
  const g = glows.find((x) => x.holder === part.id);
  const extra: Record<string, unknown> = {...(part.props ?? {}), ...rest};
  // the "?" badge is a screen-constant glyph drawn by the engine's GlyphLayer in every view (so it is drawn once per
  // view at that view's projection, 72 px inside a Lens): icons never draw it themselves
  if (extra.badge === 'q') extra.badge = null;
  const blocks = (part.props?.blocks as BlockProp[] | undefined) ?? undefined;
  if (Array.isArray(blocks)) {
    extra.blocks = blocks.map((b) => {
      const bs = stateAt(frame, script.states, part.id, b.key, scope, b.state ?? 'off');
      const bg = glows.find((x) => x.holder === `${part.id}.${b.key}`);
      // the "?" badge is a screen-constant glyph drawn by the engine's GlyphLayer in every view
      return {...b, state: bs.state, flip: bs.flip, badge: null, glow: bg ? bg.alpha : undefined, ghost: ghosts?.get(`${part.id}.${b.key}`) ?? 0};
    });
  }
  const ghost = ghosts?.get(part.id) ?? 0;
  const Comp = spec.component;
  const el = (
    <Comp
      {...extra}
      id={`${idPrefix}-${part.id}`}
      x={part.rect.x}
      y={part.rect.y}
      w={part.rect.w}
      h={part.rect.h}
      zoom={pc.zoom}
      frame={frame}
      state={st.state}
      flip={st.flip}
      detail={detailOfPx(Math.min(part.rect.w, part.rect.h) * pc.zoom, detailBias, DETAIL.fadeFrom, DETAIL.fadeTo)}
      fillsOnly={fillsOnly}
      side={side}
      pointed={typeof pointed === 'number' ? pointed : 0}
      glow={g ? g.alpha : undefined}
      opacity={(typeof opacity === 'number' ? opacity : 1) * (typeof part.props?.opacity === 'number' ? (part.props.opacity as number) : 1) * (1 - (1 - GHOST_KEEP) * ghost)}
    />
  );
  const out =
    // round 4: a cord (a thin passive line) keeps no dashed socket outline
    ghost > 0.001 && !fillsOnly && part.type !== 'cord' ? (
      <>
        {el}
        <GhostOutline x={part.rect.x} y={part.rect.y} w={part.rect.w} h={part.rect.h} r={10} zoom={pc.zoom} amount={ghost} />
      </>
    ) : (
      el
    );
  if (pc === cam) return out;
  return <g transform={planeTransform(cam, pc)}>{out}</g>;
};

export const WorldLayer: React.FC<WorldLayerProps> = ({
  world,
  frame,
  cam,
  scope,
  script,
  hide,
  glow,
  detailBias = 1,
  fillsOnly = false,
  vias,
  refShot,
  idPrefix = 'w',
  under,
  ghosts,
}) => {
  const {grounds, parts} = sortedParts(world);
  const glows = glowList(glow);
  const hidden = hide && hide.length ? new Set(hide) : null;
  const common = {frame, cam, scope, script, glows, detailBias, fillsOnly, refShot, idPrefix, ghosts};
  return (
    <g>
      {grounds.map((p) => (hidden?.has(p.id) ? null : <PartView key={p.id} part={p} {...common} />))}
      {vias && !fillsOnly ? (
        <Vias boards={grounds.filter((p) => p.type !== 'case').map((p) => p.rect)} cam={cam} frame={frame} focus={vias.focus} events={vias.events} pings={vias.pings} />
      ) : null}
      {under}
      {parts.map((p) => (hidden?.has(p.id) ? null : <PartView key={p.id} part={p} {...common} />))}
    </g>
  );
};
