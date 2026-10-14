/**
 * Plates and the peel (ENGINE.md §10.1, STYLE_BIBLE §9.2–9.3): the signature match move. A plate starts as the exact
 * screen rectangle of its source part, lifts (shadow 0 → 14 px, scale → 1.02 over the first 4 frames) and flies to its
 * slot along a gentle arc (control point 12% of the distance above the chord) in 14 frames ('peel'); it returns in 12
 * ('settle') and vanishes into its source.
 *
 * The 'peel' curve leaves its start very fast (t50 = 0.12); to keep the launch free of a velocity jump, the flight
 * time is remapped with a quadratic ramp over the 4 lift frames (C1-continuous), then follows the curve.
 */
import {DUR, PLATE, SPLIT, TYPE} from '../tokens';
import {EASE6, prog} from '../core/ease';
import {clamp01, lerp, lerpRect} from '../core/math';
import type {Pt, SRect, ViewScope, WRect} from '../core/types';
import type {Shot} from '../camera/camera';
import type {SceneSpec} from '../world/types';
import type {TagSpec} from '../labels/Tag2';

/** The frame kind. "Active" is a status layered on either kind (outer rule → PLATE.rim px `ink`). */
export type PlateRule = 'held' | 'notNow';

export type PlateContent =
  /** The same world through another camera (S06 plates 1 and 3). */
  | {kind: 'world'; shot: Shot; scope?: ViewScope}
  /** A recomposed mini scene (S06 plates 2, 4–6). */
  | {kind: 'scene'; scene: SceneSpec; shot: Shot}
  /** S09 stops (§10.5): a tween between two scenes over [at, at + dur]. */
  | {kind: 'tween'; from: SceneSpec; to: SceneSpec; shot: Shot | [Shot, Shot]; at: number; dur: number};

export interface PlateSpec {
  id: string;
  /** Final screen rect, or a layout slot: SPLIT.row6 index 0–5, SPLIT.pairRight index 0–1, SPLIT.pairWide index 0–1. */
  slot: SRect | {layout: 'row6' | 'pairRight' | 'pairWide'; index: number};
  /** Where it peels from: a part (its screen rect at the current frame) or a world rect. */
  source: string | WRect;
  content: PlateContent;
  /** 'notNow' for previews and what-ifs. */
  rule: PlateRule;
  /** Lift starts (DUR.peel = 14). */
  peelAt: number;
  /** Fly back starts (DUR.plateReturn = 12). */
  returnAt: number;
  /** 'top' = inside the top-left at 24 px inset (S09 stops); 'name' = centred in the plate's name area. */
  caption?: {text: string; at: number; place: 'top' | 'name'; exitAt: number | 'hold'; ghostAt?: number};
  /** Active status steps: exactly one plate in a group is active at a time. */
  active?: Array<{at: number; on: boolean}>;
  /** Port gaps opened around gutter crossings (derived from the row's hops by buildScript). */
  ports?: Array<{side: 'left' | 'right'; y: number; open: number; close: number}>;
  /** Round 2: keyed tags inside the plate, anchored on its scene (scene px) with SCREEN slots, on the plate's flat ground
   *  (S09: "In the processor", "Lookout: own chip"). They fade with the plate's return. */
  tags?: TagSpec[];
  /** Round 3 (judges: the AMD stop lifted carrying a copy of the Intel board for 4 frames): 'card' = the plate leaves
   *  its source as an empty card (no lifted world view); use it whenever the plate shows ANOTHER machine. Default
   *  'world' (the part seems to rise off the board). */
  lift?: 'world' | 'card' | 'slide';
  /** Round 4: the plate enters by sliding out from BEHIND another plate of its group (that plate's slot), its content
   *  drawn from the first frame (S08: "Shut down" slides out from behind "Restart": the same running PC, a copy that
   *  diverges on its words). Draw it before that plate (under it). */
  enterFrom?: string;
  /** Round 4: the plate leaves by sliding back behind another plate (that plate's slot), content intact, and is gone
   *  when it is fully behind it; then only that plate travels home (judges: two monitor plates flew home stacked). */
  returnInto?: string;
  /** Round 3: muted part names inside the plate (supporting text, TYPE.partName), centred on a scene point, entering
   *  word by word on `at` (e.g. "Chipset", "Battery" in the S09 stops). */
  names?: Array<{text: string; at: number; scenePt: Pt; exitAt?: number; tone?: 'muted' | 'ink'}>;
  /** Round 3, the HERO CARRY (judges: plates flew as empty cards; "02-style match moves would carry the subject"): the
   *  part the plate is about travels in the card, from where it sits in the world (`worldPart`, or one of its `block`s)
   *  to where its scene shows it (`scenePart`), growing on the way; the rest of the scene fades in round it on arrival.
   *  While the plate is out, the world keeps a dashed GHOST of the part (a peeled socket), restored as it flies home. */
  hero?: {scenePart: string; worldPart: string; block?: string};
}

/** Round 4 timing (frames). `slideIn` / `slideOut`: another machine's plate (lift 'slide') enters from the frame's
 *  right edge with its content and leaves the same way. `enter` / `into`: a sibling slides out from behind another plate
 *  and back. `heroHome`: a hero plate's return: its scene fades out over frames 0–4 at the slot, uncovering the hero in
 *  the world's state (a preview state eases back to the truth in place); the hero flies home alone over 4–16 ('settle',
 *  a gentle arc) while the card dissolves round it over 4–8, so the card never shows without its hero and the hero has
 *  left its slot before the card is gone; its socket fills over 13–15 and it fades into the world's own part over
 *  15–17. The card never flies. */
export const PLATE4 = {slideIn: 14, slideOut: 10, enter: 12, into: 8, heroHome: 17, heroFly: [4, 12] as const, cardFade: [4, 4] as const, sceneOut: 4} as const;

/** Round 4: a hero plate returns by the hero-home grammar (its hero flies home alone). */
export const isHeroHome = (spec: PlateSpec): boolean => !!spec.hero && spec.content.kind === 'scene' && spec.lift !== 'card' && spec.lift !== 'slide' && !spec.returnInto;

/** Round 4: frames a plate's return takes (hero home 17, slide out 10, slide into a sibling 8, else DUR.plateReturn). */
export const returnFrames = (spec: PlateSpec): number =>
  spec.returnInto ? PLATE4.into : spec.lift === 'slide' ? PLATE4.slideOut : isHeroHome(spec) ? PLATE4.heroHome : DUR.plateReturn;

/** The first frame a plate is gone again. */
export const plateEnd = (spec: PlateSpec): number => spec.returnAt + returnFrames(spec);

/** Round 3: ghost strength 0..1 of a hero's world source at a frame (3-frame steps on the peel; round 4: on the hero-home
 *  return the socket fills over frames 13–15, just before the hero fades into it). */
export const heroGhostAt = (frame: number, spec: PlateSpec): number => {
  if (!spec.hero) return 0;
  const end = plateEnd(spec);
  if (frame < spec.peelAt || frame >= end) return 0;
  const on = prog(frame, spec.peelAt + 1, 3, 'arrive');
  const off = isHeroHome(spec) ? prog(frame, end - 4, 2, 'arrive') : prog(frame, end - 3, 3, 'arrive');
  return Math.min(on, 1 - off);
};

/** Round 3: every hero ghost at a frame, keyed 'part' or 'part.block' (the strongest when two plates share a source). */
export const ghostsAt = (frame: number, plates: ReadonlyArray<PlateSpec>): Map<string, number> => {
  const m = new Map<string, number>();
  for (const p of plates) {
    const g = heroGhostAt(frame, p);
    if (g <= 0 || !p.hero) continue;
    const k = p.hero.block ? `${p.hero.worldPart}.${p.hero.block}` : p.hero.worldPart;
    m.set(k, Math.max(m.get(k) ?? 0, g));
  }
  return m;
};

export interface PeelState {
  phase: 'hidden' | 'lifting' | 'flying' | 'slot' | 'returning';
  rect: SRect;
  /** 0..1: shadow, side thickness and lift scale. */
  lift: number;
  opacity: number;
  /** 0..1: position progress from source to slot (the content camera re-composes with it). */
  contentT: number;
}

/** A plate's slot rect. */
export const slotRect = (slot: PlateSpec['slot']): SRect => {
  if ('w' in slot) return slot;
  if (slot.layout === 'row6') {
    const r = SPLIT.row6;
    return {x: r.x0 + slot.index * (r.plateW + r.gutter), y: r.y0, w: r.plateW, h: r.plateH, r: PLATE.radius};
  }
  if (slot.layout === 'pairWide') {
    const q = SPLIT.pairWide;
    return {x: q.x0 + slot.index * (q.w + q.gap), y: q.y0, w: q.w, h: q.h, r: PLATE.radius};
  }
  const p = SPLIT.pairRight;
  return {x: p.x0, y: p.y0 + slot.index * (p.h + p.gap), w: p.x1 - p.x0, h: p.h, r: PLATE.radius};
};

/** Content area at the slot, relative to the plate rect (fractions). Row6: the top 264 px; a 'top' caption: below it. */
export const contentRel = (spec: PlateSpec, slot: SRect): {x: number; y: number; w: number; h: number} => {
  if ('layout' in spec.slot && spec.slot.layout === 'row6') return {x: 0, y: 0, w: 1, h: (SPLIT.row6.railY - SPLIT.row6.y0) * 2 / slot.h};
  if (spec.caption?.place === 'top') {
    const top = PLATE.captionInset + TYPE.caption * TYPE.lineHeight + 8;
    return {x: PLATE.captionInset / slot.w, y: top / slot.h, w: (slot.w - 2 * PLATE.captionInset) / slot.w, h: (slot.h - top - PLATE.captionInset) / slot.h};
  }
  if (spec.caption?.place === 'name') {
    const lines = spec.caption.text.split('\n').length;
    const nameH = lines * TYPE.caption * TYPE.lineHeight + 36;
    return {x: 0, y: 0, w: 1, h: (slot.h - nameH) / slot.h};
  }
  return {x: 0, y: 0, w: 1, h: 1};
};

/** Smooth launch: quadratic ramp over the lift, then the 'peel' curve (C1-continuous). */
const peelProgress = (u: number): number => {
  const u0 = 4 / DUR.peel;
  const tau = u < u0 ? (u * u) / (2 * u0) : u - u0 / 2;
  return EASE6.peel(clamp01(tau / (1 - u0 / 2)));
};

const arcPoint = (a: Pt, b: Pt, t: number): Pt => {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  // the normal that points up the screen (negative y), 12% of the chord
  let nx = -dy / (d || 1);
  let ny = dx / (d || 1);
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const c: Pt = [mx + nx * 0.12 * d, my + ny * 0.12 * d];
  return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
};

const rectAt = (src: SRect, dst: SRect, p: number): SRect => {
  const c = arcPoint([src.x + src.w / 2, src.y + src.h / 2], [dst.x + dst.w / 2, dst.y + dst.h / 2], p);
  const w = lerp(src.w, dst.w, p);
  const h = lerp(src.h, dst.h, p);
  return {x: c[0] - w / 2, y: c[1] - h / 2, w, h, r: PLATE.radius};
};

/** Geometry at a frame: source rect → slot along the arc, the lift, and the content progress. `sibling` (round 4) is
 *  the slot of the plate named by `enterFrom` / `returnInto`. */
export const peelAt = (frame: number, spec: PlateSpec, sourceRect: SRect, slot: SRect, sibling?: SRect): PeelState => {
  const hidden: PeelState = {phase: 'hidden', rect: sourceRect, lift: 0, opacity: 0, contentT: 0};
  if (frame < spec.peelAt || frame >= plateEnd(spec)) return hidden;
  const scale = (r: SRect, lift: number): SRect => {
    const k = lerp(1, PLATE.liftScale, lift);
    return {x: r.x + (r.w * (1 - k)) / 2, y: r.y + (r.h * (1 - k)) / 2, w: r.w * k, h: r.h * k, r: r.r};
  };
  // round 4: another machine slides in from the frame's right edge, its content drawn from the first frame
  const offRight = 1920 + 40 - slot.x;
  if (spec.lift === 'slide' && frame < spec.peelAt + PLATE4.slideIn) {
    const e = EASE6.arrive(clamp01((frame - spec.peelAt) / PLATE4.slideIn));
    return {phase: 'flying', rect: {...scale(slot, 1), x: scale(slot, 1).x + (1 - e) * offRight}, lift: 1, opacity: 1, contentT: 1};
  }
  // round 4: a sibling slides out from behind another plate (a copy that will diverge), content from the first frame
  if (spec.enterFrom && sibling && frame < spec.peelAt + PLATE4.enter) {
    const e = EASE6.move(clamp01((frame - spec.peelAt) / PLATE4.enter));
    return {phase: 'flying', rect: lerpRect(scale(sibling, 1), scale(slot, 1), e), lift: 1, opacity: 1, contentT: 1};
  }
  if (spec.lift !== 'slide' && !spec.enterFrom && frame < spec.peelAt + DUR.peel) {
    const u = (frame - spec.peelAt) / DUR.peel;
    const p = peelProgress(u);
    const lift = prog(frame, spec.peelAt, 4, 'arrive');
    return {phase: frame < spec.peelAt + 4 ? 'lifting' : 'flying', rect: scale(rectAt(sourceRect, slot, p), lift), lift, opacity: 1, contentT: p};
  }
  if (frame < spec.returnAt) return {phase: 'slot', rect: scale(slot, 1), lift: 1, opacity: 1, contentT: 1};
  if (spec.returnInto && sibling) {
    const e = EASE6.move(clamp01((frame - spec.returnAt) / PLATE4.into));
    return {phase: 'returning', rect: lerpRect(scale(slot, 1), scale(sibling, 1), e), lift: 1, opacity: 1, contentT: 1};
  }
  if (spec.lift === 'slide') {
    const e = EASE6.exit(clamp01((frame - spec.returnAt) / PLATE4.slideOut));
    return {phase: 'returning', rect: {...scale(slot, 1), x: scale(slot, 1).x + e * offRight}, lift: 1, opacity: 1, contentT: 1};
  }
  if (isHeroHome(spec)) {
    // round 4: the card stays at its slot and dissolves round its hero (Plate draws the hero's flight home)
    const lift = 1 - prog(frame, spec.returnAt + PLATE4.cardFade[0], PLATE4.cardFade[1], 'linear');
    return {phase: 'returning', rect: scale(slot, 1), lift, opacity: 1, contentT: 1};
  }
  if (spec.lift === 'card') {
    // round 3: a plate that shows another machine does not fly into this board: once its scene has gone it collapses
    // into its own centre (opaque, so nothing is ever translucent over the world)
    const k = 1 - prog(frame, spec.returnAt + DUR.plateContentOut, DUR.plateReturn - DUR.plateContentOut, 'move');
    const r = scale(slot, 1);
    const w = r.w * Math.max(0.001, k);
    const h = r.h * Math.max(0.001, k);
    return {phase: 'returning', rect: {x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h, r: r.r}, lift: k, opacity: 1, contentT: 1};
  }
  const p = 1 - prog(frame, spec.returnAt, DUR.plateReturn, 'settle');
  const lift = 1 - prog(frame, spec.returnAt + DUR.plateReturn - 4, 4, 'arrive');
  return {phase: 'returning', rect: scale(rectAt(sourceRect, slot, p), lift), lift, opacity: 1, contentT: p};
};
