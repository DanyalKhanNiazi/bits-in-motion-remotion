/**
 * Round 3 (production; judges: "every plate is a hand-composed scene", "add scene presets that derive a plate scene from
 * the world", "a chain costs dozens of lines"): reusable DEVICES as one call each. An episode's script names what it
 * shows; the engine lays it out with the grammar's rules (STYLE_BIBLE §9).
 *
 *   sceneFrom(WORLD, ['monitor'], {id: 's06-windows'})                      // a plate scene cut from the world
 *   sceneFrom(WORLD, [{part: 'chipset', block: 'q', id: 'q'}], {id: 's06-q'}) // a block lifted out as its own part
 *   chainRow({id: 'chain', stages, peelAt, backAt, lands, restFrom, firstNameAt}) // plates + rail + the chain Bit
 *
 * Everything here is data in, data out (no React): the result goes into the script like hand-written specs.
 */
import {SPLIT} from '../tokens';
import type {Pt, WRect} from '../core/types';
import type {Shot} from '../camera/camera';
import {partById} from '../world/states';
import {blockRect, type BlockProp} from '../world/placeholder';
import type {ChannelSpec, PartSpec, RouteSpec, SceneSpec, WorldSpec} from '../world/types';
import type {BitSpec} from '../signal/runs';
import type {PlateSpec} from './peel';
import type {PlateRowSpec} from './row';

/* ------------------------------------------------------------------------------------------------
 * sceneFrom: a recomposed plate scene cut from the world
 * ---------------------------------------------------------------------------------------------- */

export interface ScenePick {
  /** A world part id. */
  part: string;
  /** Lift one of its blocks out as a standalone logicBlock part (the lookout, the "?"). */
  block?: string;
  /** The id in the scene (default: the part id, or the block key). Scripts address scene parts by it. */
  id?: string;
  /** Props merged over the world part's props (e.g. a running monitor: {lit: 1, content: 'desktop'}). */
  props?: Record<string, unknown>;
  /** The scene part's initial state (default: the world part's / block's). */
  initial?: PartSpec['initial'];
  /** Scale about the part's own centre (a hero drawn bigger than the world draws it). Default 1. */
  scale?: number;
}

/**
 * The picked parts, in the world's relative layout, moved so the union's top-left sits at `at` (default (pad, pad)),
 * with `pad` of margin in the bounds. Extra parts,
 * routes and channels (already in scene px) may be appended. Blocks become standalone `logicBlock` parts at scale 1,
 * so they keep their true size.
 */
export const sceneFrom = (
  world: WorldSpec,
  picks: ReadonlyArray<string | ScenePick>,
  o: {id: string; pad?: number; at?: Pt; extra?: {parts?: PartSpec[]; routes?: RouteSpec[]; channels?: ChannelSpec[]}},
): SceneSpec => {
  const pad = o.pad ?? 40;
  const at = o.at ?? [pad, pad];
  const items: PartSpec[] = [];
  for (const pk of picks) {
    const p: ScenePick = typeof pk === 'string' ? {part: pk} : pk;
    const src = partById(world, p.part);
    if (!src) throw new Error(`[engine] sceneFrom: no part "${p.part}" in ${world.id}`);
    let part: PartSpec;
    if (p.block) {
      const blk = (src.props?.blocks as BlockProp[] | undefined)?.find((b) => b.key === p.block);
      if (!blk) throw new Error(`[engine] sceneFrom: "${p.part}" has no block "${p.block}"`);
      part = {
        id: p.id ?? p.block,
        type: 'logicBlock',
        rect: blockRect(src.rect, blk.rel),
        initial: p.initial ?? blk.state ?? 'off',
        order: 20,
        props: {shape: blk.shape, pip: blk.pip ?? false, ...(blk.badge === 'q' ? {badge: 'q'} : {}), ...(p.props ?? {})},
      };
    } else {
      part = {...src, id: p.id ?? src.id, depth: undefined, initial: p.initial ?? src.initial, props: {...(src.props ?? {}), ...(p.props ?? {})}};
    }
    const k = p.scale ?? 1;
    if (k !== 1) {
      const r = part.rect;
      part = {...part, rect: {x: r.x + (r.w * (1 - k)) / 2, y: r.y + (r.h * (1 - k)) / 2, w: r.w * k, h: r.h * k}};
    }
    items.push(part);
  }
  const x0 = Math.min(...items.map((p) => p.rect.x));
  const y0 = Math.min(...items.map((p) => p.rect.y));
  const moved = items.map((p) => ({...p, rect: {...p.rect, x: p.rect.x - x0 + at[0], y: p.rect.y - y0 + at[1]}}));
  const x1 = Math.max(...moved.map((p) => p.rect.x + p.rect.w)) + pad;
  const y1 = Math.max(...moved.map((p) => p.rect.y + p.rect.h)) + pad;
  return {
    id: o.id,
    bounds: {x: at[0] - pad, y: at[1] - pad, w: x1 - (at[0] - pad), h: y1 - (at[1] - pad)},
    parts: [...moved, ...(o.extra?.parts ?? [])],
    routes: o.extra?.routes,
    channels: o.extra?.channels,
  };
};

/** A plate shot centred on one scene part, sized so the part is `px` screen px wide (row6 puts the shot centre on the
 *  rail stop; `dy` moves the part up (negative) or down in world px, e.g. to sit a block on the rail). */
export const stageShot = (scene: SceneSpec, id: string, px: number, dy = 0): Shot => {
  const r = scenePartRect(scene, id);
  return {center: [r.x + r.w / 2, r.y + r.h / 2 - dy], zoom: px / r.w};
};

/** The rect of a scene part (throws if it is missing): for shots and anchors computed from a derived scene. */
export const scenePartRect = (scene: SceneSpec, id: string): WRect => {
  const p = scene.parts.find((x) => x.id === id);
  if (!p) throw new Error(`[engine] scene "${scene.id}" has no part "${id}"`);
  return p.rect;
};

/* ------------------------------------------------------------------------------------------------
 * chainRow: a sequence of stages as a row of plates (S06's grammar, §9.3–9.4, §9.8)
 * ---------------------------------------------------------------------------------------------- */

export interface ChainStage {
  /** Where the plate peels from: a world part id or a world rect. */
  source: string | WRect;
  scene: SceneSpec;
  shot: Shot;
  /** The stage's name, inside the plate's name area (≤ 3 words, one '\n' allowed). */
  name: string;
  /** The part the plate is about, carried from the world into its scene (PlateSpec.hero). */
  hero?: PlateSpec['hero'];
  /** The Bit lands on this stage without its glow (a processor in a preview: red line 1). */
  quiet?: boolean;
  /** Half-width of the rail gap round the stop (the rail meets the icon's edges). */
  gap?: number;
}

export interface ChainRowSpec {
  /** Row id (the Bit's scope is {row: id}); plate ids are `${id}${i + 1}` unless `plateId` is given. */
  id: string;
  /** 2–6 stages in narrative order (row6 holds six). */
  stages: ChainStage[];
  /** The first plate peels here; the rest follow `peelStagger` apart (default 5: STYLE_BIBLE §9.3). */
  peelAt: number;
  /** The plates fly home from here, last first, `backStagger` apart (default 3). */
  backAt: number;
  /** The Bit's landings on stages 2…n (n − 1 frames, each a word). */
  lands: number[];
  /** The Bit is born on stage 1 at this frame and stage 1's name brightens on it. */
  restFrom: number;
  /** Frames a hop takes (default 14: depart = land − 14). */
  hopFrames?: number;
  /** Plate ids (default `${id}${i + 1}`, Ep01: p1…p6). */
  plateId?: (i: number) => string;
  peelStagger?: number;
  backStagger?: number;
  /** Round 4: the stage indices in the order they fly home (default: last first). Ep01 flies the "?" home last, on
   *  "hidden", as the subject of the next sentence. */
  backOrder?: number[];
  /** 'notNow' (default: a preview) or 'held'. */
  rule?: PlateSpec['rule'];
}

/**
 * The chain as data: its plates (row6 slots, names that show dimmed as each plate lands and brighten as the Bit lands,
 * the active rim moving with the Bit, heroes carried out of the world), the row and its rail, and the parked chain
 * Bit. Ports are derived later by buildScript.
 */
export const chainRow = (o: ChainRowSpec): {plates: PlateSpec[]; row: PlateRowSpec; bit: BitSpec} => {
  const R = SPLIT.row6;
  const n = o.stages.length;
  if (n < 2 || n > 6) throw new Error(`[engine] chainRow "${o.id}": ${n} stages (2–6)`);
  if (o.lands.length !== n - 1) throw new Error(`[engine] chainRow "${o.id}": ${o.lands.length} landings for ${n} stages`);
  const ps = o.peelStagger ?? 5;
  const bs = o.backStagger ?? 3;
  const id = o.plateId ?? ((i: number) => `${o.id}${i + 1}`);
  const stops: number[] = o.stages.map((_, i) => R.x0 + i * (R.plateW + R.gutter) + R.plateW / 2);
  const on = (i: number) => (i === 0 ? o.restFrom : o.lands[i - 1]);
  const plates: PlateSpec[] = o.stages.map((s, i) => ({
    id: id(i),
    slot: {layout: 'row6', index: i},
    source: s.source,
    content: {kind: 'scene', scene: s.scene, shot: s.shot},
    hero: s.hero,
    rule: o.rule ?? 'notNow',
    peelAt: o.peelAt + ps * i,
    returnAt: o.backAt + bs * (o.backOrder ? Math.max(0, o.backOrder.indexOf(i)) : n - 1 - i),
    caption: {text: s.name, at: on(i), place: 'name', exitAt: o.backAt, ghostAt: o.peelAt + ps * i + 10},
    active: [{at: on(i), on: true}, ...(i < n - 1 ? [{at: o.lands[i], on: false}] : [])],
  }));
  const hop = o.hopFrames ?? 14;
  const bit: BitSpec = {
    id: o.id,
    scope: {row: o.id},
    kind: 'preview',
    restFrom: o.restFrom,
    park: true,
    fadeAt: o.backAt,
    hops: o.lands.map((land, i) => ({route: {row: o.id, from: i, to: i + 1}, depart: land - hop, land, quiet: !!o.stages[i + 1].quiet})),
  };
  const row: PlateRowSpec = {id: o.id, plates: plates.map((p) => p.id), rail: {y: R.railY, stops, gaps: o.stages.map((s) => s.gap ?? 0)}};
  return {plates, row, bit};
};

/** A world point → its rail stop in a row6 layout (for anchoring screen-space glyphs to a stage). */
export const row6Stop = (index: number): Pt => [SPLIT.row6.x0 + index * (SPLIT.row6.plateW + SPLIT.row6.gutter) + SPLIT.row6.plateW / 2, SPLIT.row6.railY];
