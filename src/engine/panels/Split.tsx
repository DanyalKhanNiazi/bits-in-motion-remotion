/**
 * Split to compare: the triptych (ENGINE.md §10.3, STYLE_BIBLE §9.7).
 *
 * Round 2: the triptych uses the plates' grammar, with no frame ever showing two drawings over each other.
 * Round 4 (judges: the open and the fold passed through blank navy cards for about 0.3 s; at the fold three supplies
 * overlapped and an empty card crossed the world): THE CARRY. The band scene's parts that are the world's own parts
 * (`content.carry`: the socket, the cord, the plug, the supply, the lookout, and the standby line between them) are the
 * card's content from its first frame to its last:
 *   Open (A = at): the centre card appears over its source region as the world itself (the lifted world view, fading out
 *   over A+1..A+5, with the carried parts on top, exactly where the world draws them). Over A..A+12 ('move') the card
 *   grows from the source region to the centre slot while each carried part travels from its place in the world to its
 *   place in the band (the supply shortening as it goes); the world keeps peeled sockets for them. At A+12 the band scene
 *   takes over (it is the same drawing). The side bands slide out from behind the centre over A+8..A+20.
 *   Fold (F = foldAt): the side bands slide back behind the centre and fade (F..F+6). From F+4 the carried parts take
 *   over again and travel home with the card (F+4..F+16, 'settle'); the card's ground, rule and shadow fade as it
 *   arrives (F+12..F+16), the sockets fill (F+16..F+18) and the carried parts fade into the world's own (F+18..F+20).
 * Each side band diverges only on its spoken word (its own scoped states, props and channels). `content` gives every
 * band, the centre included, a RECOMPOSED scene of the cause-to-effect path at a band-sized framing (round 1).
 * Round 4 (judges: the causes were 3–5 px on a phone): a band's `marks` draw its cause at band size (a coral cross on
 * the pulled cord's gap, an ink ring round the flipped rocker), and a band that goes dark dims its drawing to
 * SPLIT.triptych.darkDim, so dark against alive reads at thumbnail size.
 * Atlas draws the main view, then SplitBands (scrim + side bands), then SplitCenterRule (the centre card, its carried
 * parts or its scene, its rule, captions and tags).
 */
import React from 'react';
import {ALPHA, COLOR, PLATE, SPLIT, STROKE, TYPE} from '../tokens';
import {circlePath, rectPath} from '../../shared/geom';
import {prog} from '../core/ease';
import {clamp01, lerp, lerpRect} from '../core/math';
import type {Pt, SRect, WRect} from '../core/types';
import {project, S0, screenRect, viewCam, type Cam, type Shot} from '../camera/camera';
import type {ChannelEvent} from '../energy/ChannelV2';
import type {ChannelSpec, PartSpec, PropEvent, SceneSpec, StateEvent, WorldSpec} from '../world/types';
import {partById} from '../world/states';
import {blockRect, type BlockProp} from '../world/placeholder';
import {View} from '../view/View';
import {Caption2} from '../labels/Caption2';
import {Tag2, tagAt, type TagSpec} from '../labels/Tag2';
import type {Script} from '../timeline/script';

export interface BandSpec {
  side: 'left' | 'right';
  /** Lands on its word (± 3). */
  caption: {text: string; at: number};
  /** Round 3 (judges: the outcome was never named, only a dim box): a short outcome under the band's subject ("Dark"),
   *  centred on a scene point, landing as the outcome happens (with the eye closing). Round 4: from its frame the band's
   *  drawing dims to SPLIT.triptych.darkDim (the words, the eye and the cause marks stay full). */
  outcome?: {text: string; at: number; scenePt: Pt};
  /** Round 4: the cause drawn at band size on its frame: 'cross' (a coral ×, e.g. on the pulled cord's gap) or 'ring' (an
   *  ink ring round a part, e.g. the flipped rocker). Scene px; `size` in scene px. */
  marks?: Array<{kind: 'cross' | 'ring'; at: number; scenePt: Pt; size: number}>;
  /** States, props and channels for this band only (scope {band}). */
  states: StateEvent[];
  props: PropEvent[];
  channels: ChannelEvent[];
}

export interface SplitContent {
  /** The recomposed cause-to-effect scene every band shows (same icons, local world px). */
  scene: SceneSpec;
  /** Its framing for a band-sized viewport (560 × band height). */
  shot: Shot;
  /** Glow holders of the world mapped to the scene's parts (e.g. 'chipset.lookout' → 'lookout'). */
  glow?: Record<string, string>;
  /** Round 2: the world region (world px) the scene stands for: the centre band lifts from it and lands back on it. */
  source?: WRect;
  /** Round 4, the carry: scene parts that ARE world parts (or a block of one), travelling between the world and the
   *  centre band at the open and the fold, so the card is never empty; the world keeps peeled sockets meanwhile. */
  carry?: Array<{scenePart: string; worldPart: string; block?: string}>;
  /** Round 4: scene channels drawn between carried parts (their ends travel with them), and the world channel each is. */
  carryChannels?: Array<{sceneChannel: string; worldChannel: string}>;
}

export interface SplitSpec {
  kind: 'triptych';
  /** The centre band lifts (12 frames); the side bands slide out from behind it from at + 8 (12 frames). */
  at: number;
  /** The side bands slide back behind the centre (6 frames); the centre card carries its parts home (round 4). */
  foldAt: number;
  bands: [BandSpec, BandSpec];
  /** Live-copy bands only: screen y of the side bands' captions (default: inside the band's top). */
  captionY?: number;
  /** Round 1: the recomposed scene in every band (see the file comment). */
  content?: SplitContent;
  /** Round 1: the present's conditions, stacked from the centre band's top, each landing on its word. */
  centerCaptions?: Array<{text: string; at: number}>;
  /** Round 1: keyed tags inside the centre band, anchored on the scene (scene px) with screen slots. */
  centerTags?: TagSpec[];
}

const T = SPLIT.triptych;
const H = T.y1 - T.y0;
export const CENTER_BAND: SRect = {x: T.x0 + T.bandW + T.gutter, y: T.y0, w: T.bandW, h: H, r: PLATE.radius};
const LEFT_SLOT: SRect = {x: T.x0, y: T.y0, w: T.bandW, h: H, r: PLATE.radius};
const RIGHT_SLOT: SRect = {x: T.x0 + 2 * (T.bandW + T.gutter), y: T.y0, w: T.bandW, h: H, r: PLATE.radius};

/** Default caption y (inside a band's top). */
export const BAND_CAPTION_Y = T.y0 + T.captionInset;
const CAPTION_LINE = Math.round(TYPE.caption * TYPE.lineHeight);

/** Caption boxes of a band (screen px) for the budgets: one per line, from the band's top-left. */
export const bandCaptionPlace = (band: SRect, line: number): SRect => ({
  x: band.x + 30,
  y: band.y + T.captionInset + line * (CAPTION_LINE + 4),
  w: band.w - 60,
  h: CAPTION_LINE,
});

/** Round 2: the scrim behind the triptych (the world steps back, as behind the S06 row). */
export const SPLIT_SCRIM = ALPHA.scrim * 0.34;

/** Frames the whole fold takes (the carried parts are home and gone at foldAt + FOLD_END). Round 3: 13; round 4: 20. */
export const FOLD_END = 20;
/** Round 4 timing (frames from `at` / `foldAt`). */
const OPEN = {fly: 12, liftOut: [1, 4] as const, bandsAt: 8, bands: 12, ghostIn: 3} as const;
const FOLD = {bands: 6, carryAt: 4, fly: 12, groundOut: [12, 4] as const, fill: [16, 2] as const, fade: [18, 2] as const} as const;

export interface SplitState {
  /** Side band slide progress 0..1 (from behind the centre card to their slots). */
  t: number;
  /** The centre card's flight 0..1 (source region → centre slot); round 4: also the carried parts' (world → band). */
  c: number;
  /** Lift 0..1 (shadow). */
  lift: number;
  /** Centre card: the recomposed scene's opacity, and the lifted world view's (round 4: the open only). */
  sceneT: number;
  worldT: number;
  /** Scrim alpha 0..1 (× SPLIT_SCRIM). */
  scrim: number;
  center: SRect;
  left: SRect;
  right: SRect;
  /** Kept for the API: the main view is no longer clipped (round 2). */
  clip: SRect | null;
  phase: 'off' | 'opening' | 'open' | 'folding';
  /** Round 4: the carried parts are drawn (instead of the band scene), at this opacity; 0 = not drawn. */
  carry: number;
  /** Round 4: the peeled sockets' strength in the world (0..1). */
  ghost: number;
  /** Round 4: the centre card's ground (fill, side) opacity; and the side bands' opacity (they fade as they fold). */
  ground: number;
  bands: number;
}

/** Band captions and tags are gone by the fold (they fade over 6 frames from foldAt − CAPTION_LEAD). */
export const CAPTION_LEAD = 6;

/** The split's state at a frame. `src` is the centre band's source region on screen (default: the centre slot). */
export const splitAt = (frame: number, s: SplitSpec, src: SRect = CENTER_BAND): SplitState => {
  const off: SplitState = {t: 0, c: 0, lift: 0, sceneT: 0, worldT: 0, scrim: 0, center: CENTER_BAND, left: CENTER_BAND, right: CENTER_BAND, clip: null, phase: 'off', carry: 0, ghost: 0, ground: 0, bands: 0};
  const A = s.at;
  const F = s.foldAt;
  if (frame < A || frame >= F + FOLD_END) return off;
  const carries = !!(s.content && s.content.carry && s.content.carry.length);
  let t: number;
  let c: number;
  let lift: number;
  let sceneT: number;
  let worldT: number;
  let scrim: number;
  let carry = 0;
  let ghost = 0;
  let ground = 1;
  let bands = 1;
  let phase: SplitState['phase'];
  if (frame < A + OPEN.bandsAt + OPEN.bands) {
    c = prog(frame, A, OPEN.fly, 'move');
    lift = prog(frame, A, 4, 'arrive');
    worldT = 1 - prog(frame, A + OPEN.liftOut[0], OPEN.liftOut[1], 'linear');
    if (carries) {
      // round 4: the carried parts are the card's content until the band scene (the same drawing) takes over
      carry = frame < A + OPEN.fly ? 1 : 0;
      sceneT = frame < A + OPEN.fly ? 0 : 1;
      ghost = prog(frame, A, OPEN.ghostIn, 'arrive');
    } else {
      sceneT = prog(frame, A + 4, 6, 'arrive');
    }
    t = prog(frame, A + OPEN.bandsAt, OPEN.bands, 'move');
    scrim = prog(frame, A, 10, 'move');
    phase = 'opening';
  } else if (frame < F) {
    c = 1;
    lift = 1;
    worldT = 0;
    sceneT = 1;
    t = 1;
    scrim = 1;
    ghost = carries ? 1 : 0;
    phase = 'open';
  } else if (carries) {
    // round 4: the fold carries the parts home (see the file comment): never an empty card, never three supplies
    t = 1 - prog(frame, F, FOLD.bands, 'move');
    bands = 1 - prog(frame, F, FOLD.bands, 'exit');
    sceneT = frame < F + FOLD.carryAt ? 1 : 0;
    carry = frame < F + FOLD.carryAt ? 0 : 1 - prog(frame, F + FOLD.fade[0], FOLD.fade[1], 'linear');
    c = 1 - prog(frame, F + FOLD.carryAt, FOLD.fly, 'settle');
    lift = 1 - prog(frame, F + FOLD.groundOut[0], FOLD.groundOut[1], 'linear');
    ground = lift;
    ghost = 1 - prog(frame, F + FOLD.fill[0], FOLD.fill[1], 'arrive');
    worldT = 0;
    scrim = 1 - prog(frame, F + FOLD.carryAt, FOLD.fly, 'settle');
    phase = 'folding';
  } else {
    // round 3's fold (a split with no carried parts): the bands slide back, the scene fades, the card flies home empty
    // and vanishes into the world's truth as it lands
    t = 1 - prog(frame, F, 6, 'move');
    sceneT = 1 - prog(frame, F + 2, 4, 'linear');
    c = 1 - prog(frame, F + 5, 7, 'move');
    worldT = prog(frame, F + 9, 4, 'arrive');
    lift = 1 - prog(frame, F + 9, 4, 'linear');
    ground = lift;
    scrim = 1 - prog(frame, F + 2, 10, 'settle');
    phase = 'folding';
  }
  const center = lerpRect(src, CENTER_BAND, c);
  return {
    t,
    c,
    lift,
    sceneT: s.content ? sceneT : 0,
    // a split without recomposed content keeps the live world in its centre card (and live copies in its bands)
    worldT: s.content ? worldT : 1,
    scrim,
    center,
    left: lerpRect(center, LEFT_SLOT, t),
    right: lerpRect(center, RIGHT_SLOT, t),
    clip: null,
    phase,
    carry,
    ghost,
    ground,
    bands,
  };
};

/** The centre band's source region on screen at this camera (the content's `source`, else the centre slot). */
export const splitSource = (s: SplitSpec, cam: Cam): SRect => (s.content?.source ? {...screenRect(cam, s.content.source), r: PLATE.radius} : CENTER_BAND);

/** Round 4: the world's peeled sockets while a triptych carries its parts ('part' or 'part.block' → 0..1). */
export const splitGhostsAt = (frame: number, splits: ReadonlyArray<SplitSpec>, into?: Map<string, number>): Map<string, number> => {
  const m = into ?? new Map<string, number>();
  for (const s of splits) {
    const carry = s.content?.carry;
    if (!carry || !carry.length) continue;
    const g = splitAt(frame, s).ghost;
    if (g <= 0) continue;
    for (const k of carry) {
      const key = k.block ? `${k.worldPart}.${k.block}` : k.worldPart;
      m.set(key, Math.max(m.get(key) ?? 0, g));
    }
  }
  return m;
};

/** The script a band's scene view reads: the world's glow holders renamed to the scene's parts (memoised). */
const ALIASED = new WeakMap<object, Readonly<Script>>();
const sceneScript = (script: Readonly<Script>, content: SplitContent): Readonly<Script> => {
  if (!content.glow) return script;
  const hit = ALIASED.get(content);
  if (hit) return hit;
  const map = content.glow;
  const out: Readonly<Script> = {...script, glow: script.glow.map((g) => (g.holder && map[g.holder] ? {...g, holder: map[g.holder]} : g))};
  ALIASED.set(content, out);
  return out;
};

const DoubleRule: React.FC<{r: SRect; opacity: number}> = ({r, opacity}) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, opacity}}>
    <path d={rectPath(r.x, r.y, r.w, r.h, PLATE.radius)} fill="none" stroke={COLOR.annotation} strokeWidth={PLATE.rule} />
    <path
      d={rectPath(r.x + PLATE.doubleInset, r.y + PLATE.doubleInset, r.w - 2 * PLATE.doubleInset, r.h - 2 * PLATE.doubleInset, PLATE.radius - 4)}
      fill="none"
      stroke={COLOR.annotation}
      strokeWidth={PLATE.doubleInner}
    />
  </svg>
);

/** A shot fitted to a moving card (zoom scaled with the card's width against the slot). */
const fitShot = (shot: Shot, r: SRect, slot: SRect): Shot => ({center: shot.center, zoom: shot.zoom * (r.w / Math.max(1, slot.w))});

/** Round 3: the screen box of a band's outcome caption (one 44 px line centred under its scene point). */
export const outcomePlace = (o: NonNullable<BandSpec['outcome']>, content: SplitContent, r: SRect, slot: SRect): SRect => {
  const c = project(viewCam(fitShot(content.shot, r, slot), r), o.scenePt);
  const h = Math.round(TYPE.caption * TYPE.lineHeight);
  return {x: c[0] - 200, y: c[1], w: 400, h};
};

/** Round 3: the side band slots (for the budgets). */
export const BAND_SLOTS = {left: LEFT_SLOT, right: RIGHT_SLOT};

/** Round 4: a band's cause marks (screen px of the band's view). */
const BandMarks: React.FC<{band: BandSpec; frame: number; cam: Cam; opacity: number}> = ({band, frame, cam, opacity}) => {
  if (!band.marks || !band.marks.length) return null;
  const els: React.ReactNode[] = [];
  band.marks.forEach((m, i) => {
    if (frame < m.at) return;
    const t = prog(frame, m.at, 6, 'arrive');
    const c = project(cam, m.scenePt);
    const sz = m.size * cam.zoom;
    if (m.kind === 'cross') {
      const h = (sz / 2) * (0.6 + 0.4 * t);
      els.push(
        <g key={i} opacity={t}>
          <path d={`M${c[0] - h} ${c[1] - h}L${c[0] + h} ${c[1] + h}M${c[0] - h} ${c[1] + h}L${c[0] + h} ${c[1] - h}`} stroke={COLOR.deck} strokeWidth={14} strokeLinecap="round" />
          <path d={`M${c[0] - h} ${c[1] - h}L${c[0] + h} ${c[1] + h}M${c[0] - h} ${c[1] + h}L${c[0] + h} ${c[1] - h}`} stroke={COLOR.alert} strokeWidth={7} strokeLinecap="round" />
        </g>,
      );
    } else {
      const r = sz / 2;
      const L = 2 * Math.PI * r;
      els.push(<path key={i} d={circlePath(c[0], c[1], r)} fill="none" stroke={COLOR.ink} strokeWidth={5} strokeDasharray={t < 1 ? `${L * t} ${L}` : undefined} />);
    }
  });
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, opacity}}>
      {els}
    </svg>
  );
};

/** The scrim and the side bands (drawn AFTER the main view, BEFORE the centre card): opaque copies of the recomposed
 *  scene (or live copies of the main view) that slide out from behind the centre card. */
export const SplitBands: React.FC<{spec: SplitSpec; frame: number; mainCam: Cam; world: WorldSpec; script: Readonly<Script>; refShot?: Shot}> = ({
  spec,
  frame,
  mainCam,
  world,
  script,
  refShot,
}) => {
  const st = splitAt(frame, spec, splitSource(spec, mainCam));
  if (st.phase === 'off') return null;
  const content = spec.content;
  return (
    <>
      {st.scrim > 0 ? <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: COLOR.void, opacity: SPLIT_SCRIM * st.scrim}} /> : null}
      {st.t > 0.001 && st.bands > 0.001
        ? spec.bands.map((b) => {
            const r = b.side === 'left' ? st.left : st.right;
            const slot = b.side === 'left' ? LEFT_SLOT : RIGHT_SLOT;
            const id = `band-${b.side}`;
            const bcam = content ? viewCam(fitShot(content.shot, r, slot), r) : null;
            // round 4: a band that has gone dark dims its drawing (never its ground: the band stays an opaque plate)
            const dark = content && b.outcome ? prog(frame, b.outcome.at, 8, 'move') : 0;
            const view =
              content && bcam ? (
                <>
                  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
                    <path d={rectPath(r.x, r.y, r.w, r.h, PLATE.radius)} fill={COLOR.deck} />
                  </svg>
                  <View
                    frame={frame}
                    cam={bcam}
                    clip={r}
                    world={content.scene}
                    scope={{band: b.side}}
                    script={sceneScript(script, content)}
                    id={id}
                    glow
                    opacity={lerp(1, T.darkDim, dark)}
                  />
                </>
              ) : (
                // a live copy of the centre card's world region, translated with its band
                <View
                  frame={frame}
                  cam={{...mainCam, origin: [S0[0] + (r.x - st.center.x), S0[1] + (r.y - st.center.y)]}}
                  clip={r}
                  world={world}
                  scope={{band: b.side}}
                  script={script}
                  id={id}
                  refShot={refShot}
                  background={COLOR.deck}
                />
              );
            const place = content || spec.captionY === undefined ? bandCaptionPlace(r, 0) : {x: r.x + 48, y: spec.captionY, w: r.w - 96, h: 60};
            // round 3: the outcome, under the band's subject ("Dark"), as its eye closes
            let outcome: React.ReactNode = null;
            if (content && b.outcome && frame >= b.outcome.at) {
              const oc = outcomePlace(b.outcome, content, r, slot);
              outcome = <Caption2 spec={{text: b.outcome.text, at: b.outcome.at, exitAt: spec.foldAt - CAPTION_LEAD, place: oc, align: 'center'}} frame={frame} />;
            }
            return (
              <div key={b.side} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: st.bands < 0.999 ? st.bands : undefined}}>
                <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
                  <path d={rectPath(r.x, r.y + PLATE.shadowOffset[1], r.w, r.h, PLATE.radius)} fill={COLOR.void} fillOpacity={0.6 * Math.min(1, st.t * 3)} />
                </svg>
                {view}
                {bcam ? <BandMarks band={b} frame={frame} cam={bcam} opacity={1 - prog(frame, spec.foldAt - CAPTION_LEAD, 6, 'exit')} /> : null}
                <DoubleRule r={r} opacity={Math.min(1, st.t * 2)} />
                <Caption2 spec={{text: b.caption.text, at: b.caption.at, exitAt: spec.foldAt - CAPTION_LEAD, place}} frame={frame} />
                {outcome}
              </div>
            );
          })
        : null}
    </>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Round 4, the carry: the carried parts as one synthetic scene in a virtual space whose zoom eases from the world's to
 * the band's, so strokes, corners and 2.5D sides match both ends exactly
 * ---------------------------------------------------------------------------------------------- */

/** The world rect (world px) of a carried part, and the world part it is. */
const carrySource = (world: WorldSpec, k: {worldPart: string; block?: string}): {rect: WRect; part: PartSpec; blk?: BlockProp} | null => {
  const part = partById(world, k.worldPart);
  if (!part) return null;
  if (!k.block) return {rect: part.rect, part};
  const blk = (part.props?.blocks as BlockProp[] | undefined)?.find((b) => b.key === k.block);
  if (!blk) return null;
  return {rect: blockRect(part.rect, blk.rel), part, blk};
};

/** Screen points of a world part's `points` prop (a cord) or a channel's points. */
const lerpPts = (a: ReadonlyArray<Pt>, b: ReadonlyArray<Pt>, t: number): Pt[] => a.map((p, i) => [lerp(p[0], (b[i] ?? b[b.length - 1])[0], t), lerp(p[1], (b[i] ?? b[b.length - 1])[1], t)] as Pt);

/** The carried scene at progress c, in virtual units of a camera with zoom z (screen = z × virtual). */
const carriedScene = (content: SplitContent, world: WorldSpec, mainCam: Cam, c: number): {scene: SceneSpec; cam: Cam} => {
  const bandCam = viewCam(content.shot, CENTER_BAND);
  const z = lerp(mainCam.zoom, bandCam.zoom, c);
  const toV = (p: Pt): Pt => [p[0] / z, p[1] / z];
  const parts: PartSpec[] = [];
  for (const k of content.carry ?? []) {
    const sp = content.scene.parts.find((p) => p.id === k.scenePart);
    const src = carrySource(world, k);
    if (!sp || !src) continue;
    const ws = screenRect(mainCam, src.rect, src.part.depth ?? 1);
    const bs = screenRect(bandCam, sp.rect);
    const r = lerpRect(ws, bs, c);
    const props: Record<string, unknown> = {...(sp.props ?? {})};
    // a cord's (or any polyline part's) points travel too
    const wp = (src.part.props?.points as Pt[] | undefined) ?? undefined;
    const bp = (sp.props?.points as Pt[] | undefined) ?? undefined;
    if (wp && bp) props.points = lerpPts(wp.map((p) => project(mainCam, p)), bp.map((p) => project(bandCam, p)), c).map(toV);
    // the supply shortens as it travels (0 = the world's full box, 1 = the band's short one)
    if (sp.type === 'psu') props.length = c;
    parts.push({...sp, rect: {x: r.x / z, y: r.y / z, w: r.w / z, h: r.h / z}, props});
  }
  const channels: ChannelSpec[] = [];
  for (const k of content.carryChannels ?? []) {
    const sc = (content.scene.channels ?? []).find((x) => x.id === k.sceneChannel);
    const wc = world.channels.find((x) => x.id === k.worldChannel);
    if (!sc || !wc) continue;
    const a = wc.points.map((p) => project(mainCam, p));
    const b = sc.points.map((p) => project(bandCam, p));
    // the world line has more points than the band's straight run: both are resampled to their ends
    const pa: Pt[] = [a[0], a[a.length - 1]];
    const pb: Pt[] = [b[0], b[b.length - 1]];
    channels.push({...sc, points: lerpPts(pa, pb, c).map(toV)});
  }
  const scene: SceneSpec = {id: `${content.scene.id}-carry`, bounds: {x: 0, y: 0, w: 1920 / z, h: 1080 / z}, parts, channels};
  const cam: Cam = {center: [960 / z, 540 / z], zoom: z, moving: false, keyIndex: -1, t: 1, e: 1};
  return {scene, cam};
};

/** The centre card (drawn after the side bands): shadow, ground, the lifted world (the open), the carried parts or the
 *  recomposed scene, its single rule, the present's captions and tags. */
export const SplitCenterRule: React.FC<{spec: SplitSpec; frame: number; script?: Readonly<Script>; mainCam?: Cam; world?: WorldSpec; refShot?: Shot}> = ({
  spec,
  frame,
  script,
  mainCam,
  world,
  refShot,
}) => {
  const st = splitAt(frame, spec, mainCam ? splitSource(spec, mainCam) : CENTER_BAND);
  if (st.phase === 'off') return null;
  const r = st.center;
  const content = spec.content;
  const carries = !!(content && content.carry && content.carry.length);
  // round 3: on the fold the rule fades with the card, never after it has gone
  const ruleOp = st.phase === 'folding' ? st.lift : Math.min(1, st.lift * 1.5);
  const groundOp = st.phase === 'folding' ? st.ground : carries ? 1 : Math.max(st.lift, st.worldT);
  let carried: React.ReactNode = null;
  if (carries && content && script && mainCam && world && st.carry > 0.001) {
    const cs = carriedScene(content, world, mainCam, st.c);
    carried = (
      <View
        frame={frame}
        cam={cs.cam}
        clip={st.ground > 0.999 ? {...r, r: PLATE.radius} : null}
        world={cs.scene}
        scope={{band: 'center'}}
        script={sceneScript(script, content)}
        id="band-center-carry"
        opacity={st.carry}
        glow
      />
    );
  }
  return (
    <>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        <path d={rectPath(r.x, r.y + PLATE.shadowOffset[1] * st.lift, r.w, r.h, PLATE.radius)} fill={COLOR.void} fillOpacity={0.6 * st.lift * (st.phase === 'folding' ? st.ground : 1)} />
        <path d={rectPath(r.x, r.y + PLATE.thickness * st.lift, r.w, r.h, PLATE.radius)} fill={COLOR.side} opacity={st.lift * (st.phase === 'folding' ? st.ground : 1)} />
        <path d={rectPath(r.x, r.y, r.w, r.h, PLATE.radius)} fill={COLOR.deck} opacity={groundOp} />
      </svg>
      {st.worldT > 0.001 && script && mainCam && world ? (
        // the open: the card first shows the world exactly as it is there (its carried parts peeled, as in the world), so
        // the card appears as the world itself and the rest of the region fades out round the carried parts
        <View
          frame={frame}
          cam={mainCam}
          clip={{...r, r: PLATE.radius}}
          world={world}
          scope="world"
          script={script}
          id="band-center-world"
          refShot={refShot}
          opacity={st.worldT}
          background={st.phase === 'folding' ? undefined : COLOR.deck}
          ghosts={carries ? splitGhostsAt(frame, [spec]) : null}
        />
      ) : null}
      {carried}
      {content && script && st.sceneT > 0.001 ? (
        <View
          frame={frame}
          cam={viewCam(fitShot(content.shot, r, CENTER_BAND), r)}
          clip={{...r, r: PLATE.radius}}
          world={content.scene}
          scope={{band: 'center'}}
          script={sceneScript(script, content)}
          id="band-center"
          background={COLOR.deck}
          opacity={st.sceneT}
          glow
        />
      ) : null}
      {(spec.centerCaptions ?? []).map((c, i) => (
        <Caption2 key={`cc${i}`} spec={{text: c.text, at: c.at, exitAt: spec.foldAt - CAPTION_LEAD, place: bandCaptionPlace(CENTER_BAND, i)}} frame={frame} />
      ))}
      {content && spec.centerTags && st.sceneT > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: st.sceneT < 1 ? st.sceneT : undefined}}>
          {spec.centerTags.map((t) => {
            const d = tagAt(frame, t, viewCam(content.shot, CENTER_BAND), content.scene);
            return d ? <Tag2 key={t.id} draw={d} spec={t} /> : null;
          })}
        </div>
      ) : null}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, opacity: ruleOp}}>
        <path d={rectPath(r.x, r.y, r.w, r.h, PLATE.radius)} fill="none" stroke={COLOR.structure} strokeWidth={STROKE.part} />
      </svg>
    </>
  );
};

/** Kept for the API: the main view is never clipped by the round-2 triptych (always null). */
export const splitClipAt = (_frame: number, _splits: ReadonlyArray<SplitSpec>): SRect | null => null;

/** Kept for the API: the main view stays fully drawn under the scrim (always 1). */
export const splitMainOpacity = (_frame: number, _splits: ReadonlyArray<SplitSpec>): number => 1;

/** The split scrim's alpha at a frame (for the label knockouts). */
export const splitScrimAlpha = (frame: number, splits: ReadonlyArray<SplitSpec>): number => {
  let a = 0;
  for (const s of splits) a = Math.max(a, SPLIT_SCRIM * splitAt(frame, s).scrim);
  return a;
};

/** ENGINE.md §10.3's `Split`: the side bands. Atlas draws them after the main view, then SplitCenterRule. */
export const Split = SplitBands;

/** Clamp helper kept local (round 4). */
export const splitCarryProgress = (frame: number, s: SplitSpec): number => clamp01(splitAt(frame, s).c);
