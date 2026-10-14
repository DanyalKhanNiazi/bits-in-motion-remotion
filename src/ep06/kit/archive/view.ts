/**
 * Ep06 kit: <Archive> views. The split-layer projection (SSD label layer in front, physical spot layer behind, seen
 * from an orbit), the card's lift path, the camera framings (archiveCam) and the anchors (archiveAnchors).
 */
import type {Pose} from '../camera';
import {EASE} from '../look';
import {clamp01, lerp, num, prog, smooth, type Num} from '../util';
import {cardPlugs, cardPoint} from './Card';
import {BOX, CARD, cardH, GEOM, N_BOXES, PHOTO, PITCH, REMAP, RUNS, SPOT_COLS, SSD_MAP, boxC, boxXY, colOf, idAt, rowOf, spotXY} from './geom';
import {NEVER, resolveArchive, type ArchiveEvent, type ArchiveLayers, type ArchiveMode, type Content, type PresetName, type Resolved} from './state';
import type {ArchiveLight} from '../envs';

/* ---------------------------------------------------------------- the split-layer projection */
/** full split: orbit (deg about the vertical axis), elevation (deg), layer gap (world px) */
export const LAYER_VIEW = {theta: -56, phi: 14, gap: 600, shiftX: -40, shiftY: 0} as const;
export const PIVOT = {x: GEOM.wall.x + GEOM.wall.w / 2, y: GEOM.wall.y + GEOM.wall.h / 2};
export type LayerView = {theta: number; phi: number; s: number; gap: number};
/** SVG matrix(a b c d e f) of a layer at depth z (z > 0 = toward the viewer) */
export const layerMatrix = (v: LayerView, z: number): [number, number, number, number, number, number] => {
  const th = (v.theta * Math.PI) / 180;
  const ph = (v.phi * Math.PI) / 180;
  const a = Math.cos(th);
  const b = -Math.sin(ph) * Math.sin(th);
  const d = Math.cos(ph);
  const e = PIVOT.x - a * PIVOT.x + z * Math.sin(th) + LAYER_VIEW.shiftX * v.s;
  const f = PIVOT.y - d * PIVOT.y - b * PIVOT.x + Math.sin(ph) * z * Math.cos(th) + LAYER_VIEW.shiftY * v.s;
  return [a, b, 0, d, e, f];
};
export const applyM = (m: readonly number[], x: number, y: number): {x: number; y: number} => ({x: m[0] * x + m[2] * y + m[4], y: m[1] * x + m[3] * y + m[5]});
export const mCss = (m: readonly number[]): string => `matrix(${m.map((v) => +v.toFixed(6)).join(' ')})`;
export const isIdentity = (m: readonly number[]): boolean => Math.abs(m[0] - 1) < 1e-6 && Math.abs(m[1]) < 1e-6 && Math.abs(m[3] - 1) < 1e-6 && Math.abs(m[4]) < 1e-4 && Math.abs(m[5]) < 1e-4;

export type ArchiveViewProps = {
  frame: number;
  state?: PresetName;
  mode?: ArchiveMode;
  layers?: ArchiveLayers;
  light?: ArchiveLight;
  events?: readonly ArchiveEvent[];
  boxes?: Readonly<Record<number, Content>>;
  /** 0..1: the photo's card rises out of the drawer to its spot above the wall's top-left (number or track) */
  lift?: Num;
  /** orbit override in degrees (e.g. P18's coin flip: 0 → 180; past 90° the other face shows, unmirrored) */
  orbit?: Num;
  /** optional 2.5D: tilt the wall in true perspective (deg; numbers or tracks), about the wall's centre. Default flat. */
  tilt?: Tilt;
};
export type Tilt = {x?: Num; y?: Num; perspective?: number};
export type TiltNow = {ax: number; ay: number; P: number};
export const tiltAt = (t: Tilt | undefined, frame: number): TiltNow => ({ax: num(t?.x, frame, 0), ay: num(t?.y, frame, 0), P: t?.perspective ?? 1800});
/** a wall point (world px) seen through the tilt (CSS perspective(P) rotateX(ax) rotateY(ay) about the wall centre) */
export const tiltPoint = (t: TiltNow, x: number, y: number): {x: number; y: number} => {
  if (!t.ax && !t.ay) return {x, y};
  const ay = (t.ay * Math.PI) / 180;
  const ax = (t.ax * Math.PI) / 180;
  const dx = x - PIVOT.x;
  const dy = y - PIVOT.y;
  const x1 = dx * Math.cos(ay);
  const z1 = -dx * Math.sin(ay);
  const y2 = dy * Math.cos(ax) - z1 * Math.sin(ax);
  const z2 = dy * Math.sin(ax) + z1 * Math.cos(ax);
  const w = 1 - z2 / t.P;
  return {x: PIVOT.x + x1 / w, y: PIVOT.y + y2 / w};
};
export const tiltCss = (t: TiltNow): string | undefined => (!t.ax && !t.ay ? undefined : `perspective(${t.P}px) rotateX(${t.ax}deg) rotateY(${t.ay}deg)`);

/** split progress, orbit, elevation and layer depths at a frame */
export const viewAt = (R: Resolved, p: ArchiveViewProps, frame: number): {v: LayerView; back: number[]; front: number[]; face: 1 | 2} => {
  const s = R.split ? (R.split.at <= -NEVER / 2 ? 1 : prog(frame, R.split.at, R.split.dur, EASE.inOut)) : 0;
  let theta = s * LAYER_VIEW.theta;
  let face: 1 | 2 = 1;
  if (p.orbit !== undefined) {
    const o = num(p.orbit, frame, 0);
    const w = ((o % 360) + 360) % 360;
    if (w > 90 && w < 270) {
      theta = w - 180;
      face = 2;
    } else theta = w >= 270 ? w - 360 : w;
  }
  const v = {theta, phi: s * LAYER_VIEW.phi, s, gap: s * LAYER_VIEW.gap};
  return {v, back: layerMatrix(v, -v.gap / 2), front: layerMatrix(v, v.gap / 2), face};
};

/* ---------------------------------------------------------------- the card's place */
/** the card's centre, width and tilt at lift u (0 = raised in the drawer, 1 = lifted above the wall's top-left) */
export const cardAt = (u: number): {x: number; y: number; w: number; rot: number} => {
  const a = GEOM.card;
  const b = GEOM.lift;
  const rise = smooth(clamp01(u / 0.3));
  const arc = EASE.inOut(clamp01((u - 0.22) / 0.78));
  const x = lerp(a.x, b.x, arc);
  const y0 = a.y - 120 * rise;
  const y = lerp(y0, b.y, arc) - Math.sin(Math.PI * arc) * 60;
  return {x, y, w: lerp(a.w, b.w, arc), rot: Math.sin(Math.PI * arc) * -3};
};
/** world offset of the lifted card's parallax layer (camera centre cx, cy): it moves 30 % more than the wall */
export const liftParallax = (u: number, cx?: number, cy?: number): {x: number; y: number} =>
  cx === undefined || cy === undefined ? {x: 0, y: 0} : {x: -(cx - GEOM.liftRef.x) * 0.3 * smooth(u), y: -(cy - GEOM.liftRef.y) * 0.3 * smooth(u)};
/** the card's 2 px ambient float (absolute frame) */
export const cardFloat = (frame: number): number => 2 * Math.sin((frame / 75) * Math.PI);
/** the card's pose; `panel` (0..1) blends it to GEOM.panelCard (inside SplitCompare panels the Archive passes it) */
export const cardPose = (p: ArchiveViewProps, frame: number, pose?: {x: number; y: number; panel?: number}) => {
  const u = clamp01(num(p.lift, frame, 0));
  const c = cardAt(u);
  const par = liftParallax(u, pose?.x, pose?.y);
  const pb = smooth(clamp01(pose?.panel ?? 0));
  const P = GEOM.panelCard;
  return {
    x: lerp(c.x + par.x, P.x, pb),
    y: lerp(c.y + par.y, P.y, pb) + cardFloat(frame),
    w: lerp(c.w, P.w, pb),
    rot: lerp(c.rot, 0, pb),
    u: u * (1 - pb),
    pb,
  };
};

/* ---------------------------------------------------------------- camera framings */
export type Framing = 'wide' | 'wall' | 'drawer' | 'card' | 'photoBoxes' | 'run' | 'header' | 'map' | 'boundary' | 'layers' | 'split' | 'splitBoxes' | 'signature' | 'pullout';
export const FRAMINGS: readonly Framing[] = ['wide', 'wall', 'drawer', 'card', 'photoBoxes', 'run', 'header', 'map', 'boundary', 'layers', 'split', 'splitBoxes', 'signature', 'pullout'];
const fr = (x0: number, y0: number, x1: number, y1: number, fill = 0.86): Pose => ({
  x: (x0 + x1) / 2,
  y: (y0 + y1) / 2,
  zoom: Math.min((1920 * fill) / (x1 - x0), (1080 * fill) / (y1 - y0)),
  rot: 0,
});
/**
 * A Stage pose for a named framing (pass to <Stage cam> keys: {f, ...archiveCam('drawer')}).
 *   wide        drawer + map + wall (zoom 1, world = screen)
 *   wall        the 16×9 wall fills the frame
 *   drawer      the drawer with the photo's card raised
 *   card        the photo's card fills ~70 % (opts.lift = 1: the lifted card)
 *   photoBoxes  the 9 photo boxes (rows 2–7, cols 2–12)
 *   run         one run of 3 boxes, close (opts.run 0..2)
 *   header      box 021 and its cyan header notch
 *   map         the map of taken boxes
 *   boundary    Windows' side | drive's side with the note slot
 *   layers      the SSD split layers (label sheet in front, spots + spare behind)
 *   split       inside a SplitCompare panel: the whole card (at GEOM.panelCard) + the photo's 3 runs, boxes ≥ 40 px
 *   splitBoxes  inside a panel: no card, the 3 runs fill the panel (boxes ≈ 65 px) for sweep / erase / race beats
 *   signature   the lifted card huge in the foreground, threads down to the lit wall
 *   pullout     wider than wide: the wall runs off into haze on every side
 */
export const archiveCam = (framing: Framing, opts: {run?: number; lift?: number; box?: number} = {}): Pose => {
  const W = GEOM.wall;
  switch (framing) {
    case 'wide':
      return {x: 960, y: 540, zoom: 1, rot: 0};
    case 'wall':
      return fr(W.x, W.y, W.x + W.w, W.y + W.h, 0.92);
    case 'drawer':
      return fr(GEOM.drawer.x - 20, 150, GEOM.drawer.x + GEOM.drawer.w + 20, 600, 0.92);
    case 'card': {
      const c = cardAt(opts.lift ?? 0);
      const h = cardH(c.w);
      return fr(c.x - c.w / 2, c.y - h / 2, c.x + c.w / 2, c.y + h / 2, 0.7);
    }
    case 'photoBoxes':
      return fr(W.x + PITCH - 40, W.y + PITCH - 44, W.x + 11 * PITCH + 40, W.y + 7 * PITCH + 30, 0.88);
    case 'run': {
      const r = RUNS[Math.max(0, Math.min(2, opts.run ?? 0))];
      const a = boxXY(r[0]);
      return fr(a.x - 70, a.y - 70, a.x + 2 * PITCH + BOX + 70, a.y + BOX + 70, 0.86);
    }
    case 'header': {
      const a = boxXY(opts.box ?? 21);
      return fr(a.x - 46, a.y - 40, a.x + BOX + 46, a.y + BOX + 40, 0.8);
    }
    case 'map':
      return fr(GEOM.map.plate.x0, GEOM.map.plate.y0, GEOM.map.plate.x1, GEOM.map.plate.y1, 0.86);
    case 'boundary':
      return fr(330, 150, 1080, 770, 0.94);
    case 'layers': {
      const v = {theta: LAYER_VIEW.theta, phi: LAYER_VIEW.phi, s: 1, gap: LAYER_VIEW.gap};
      const b = layerMatrix(v, -v.gap / 2);
      const f = layerMatrix(v, v.gap / 2);
      const pts = [
        applyM(b, W.x, W.y),
        applyM(b, W.x + SPOT_COLS * PITCH, W.y),
        applyM(b, W.x, W.y + W.h),
        applyM(b, W.x + SPOT_COLS * PITCH, W.y + W.h),
        applyM(f, W.x, W.y),
        applyM(f, W.x + W.w, W.y),
        applyM(f, W.x, W.y + W.h),
        applyM(f, W.x + W.w, W.y + W.h),
      ];
      const xs = pts.map((q) => q.x);
      const ys = pts.map((q) => q.y);
      return fr(Math.min(...xs) - 40, Math.min(...ys) - 60, Math.max(...xs) + 40, Math.max(...ys) + 60, 0.92);
    }
    case 'split':
      // panel window 872×540 at 0.5 → world 1395×864 at zoom 1.25: card (295..695 × 165..435) + runs, margins ≥ 32 px
      return {x: 942, y: 532, zoom: 1.25, rot: 0};
    case 'splitBoxes':
      return {x: 1176, y: 520, zoom: 2.05, rot: 0};
    case 'signature':
      return {x: 1210, y: 236, zoom: 0.95, rot: 0};
    case 'pullout':
      return {x: 1010, y: 560, zoom: 0.72, rot: 0};
  }
};

/* ---------------------------------------------------------------- anchors */
type Pt = {x: number; y: number};
export type ArchiveAnchors = {
  /** the photo's card centre, and its fields (name, size, dates, directions) */
  card: Pt;
  field: {name: Pt; size: Pt; dates: Pt; directions: Pt};
  /** the free/unused tab on the card's top edge */
  flag: Pt;
  /** where the 3 threads leave the card */
  plugs: Pt[];
  drawer: Pt;
  /** box centre (single view: the box; split: its label in the front sheet) */
  box: (id: number) => Pt;
  /** where label id's data physically sits now (split view; = box(id) in single view) */
  spot: (id: number) => Pt;
  photo: Pt[];
  runs: Pt[];
  /** the photo's 9 old spots (stale copies after a remap, split view) */
  stale: Pt[];
  header: Pt;
  map: Pt;
  mapCell: (id: number) => Pt;
  slot: Pt;
  actor: Pt;
  spare: Pt;
  platter: Pt;
  /** on-screen px per box at this pose (64 × zoom × |cos orbit|); numbers hide below 40 */
  pxPerBox: number;
  /** 0..1 lift of the card; 1 or 2 = coin face */
  lift: number;
  face: 1 | 2;
};
/**
 * World points of the Archive's parts at a frame (pass the same props as <Archive>). Give `pose` (from poseAt) for
 * the lifted card's exact parallax and a true pxPerBox; then place hud items with toScreen(pose, a.x, a.y).
 */
export const archiveAnchors = (p: ArchiveViewProps, frame: number, pose?: Pose & {scale?: number; panel?: number}): ArchiveAnchors => {
  const R = resolveArchive(p, frame);
  const {back, front, v, face} = viewAt(R, p, frame);
  const c = cardPose(p, frame, pose);
  const cp = (nx: number, ny: number) => cardPoint(c.x, c.y, c.w, nx, ny, c.rot);
  const s2 = smooth(clamp01((v.s - 0.25) / 0.75));
  const labelM = v.s > 0 ? front : back;
  const box = (id: number): Pt => {
    const q = boxC(id);
    return tiltPoint(T, applyM(labelM, q.x, q.y).x, applyM(labelM, q.x, q.y).y);
  };
  const spotPos = (sidx: number, id: number): Pt => {
    const a = boxC(id);
    const b = spotXY(sidx);
    return tp(applyM(back, lerp(a.x, b.x + BOX / 2, s2), lerp(a.y, b.y + BOX / 2, s2)));
  };
  const spot = (id: number): Pt => {
    const l = R.labs[id];
    if (R.mode !== 'ssd') return box(id);
    const sidx = l.remapAt <= frame ? REMAP[id] : SSD_MAP[id];
    return spotPos(sidx, id);
  };
  const mc = (id: number): Pt => ({x: GEOM.map.x + colOf(id) * GEOM.map.pitch + GEOM.map.cell / 2, y: GEOM.map.y + rowOf(id) * GEOM.map.pitch + GEOM.map.cell / 2});
  const zoom = (pose?.zoom ?? 1) * (pose?.scale ?? 1);
  const T = tiltAt(p.tilt, frame);
  const tp = (q: Pt): Pt => tiltPoint(T, q.x, q.y);
  const L = CARD.fields;
  return {
    card: {x: c.x, y: c.y},
    field: {
      name: cp((L.name.bars[0][0] + L.name.bars[0][2]) / 2, (L.name.bars[0][1] + L.name.bars[0][3]) / 2),
      size: cp((L.size.bars[0][0] + L.size.bars[0][2]) / 2, (L.size.bars[0][1] + L.size.bars[0][3]) / 2),
      dates: cp((L.dates.bars[0][0] + L.dates.bars[1][2]) / 2, (L.dates.bars[0][1] + L.dates.bars[1][3]) / 2),
      directions: cp((L.directions.housing[0] + L.directions.housing[2]) / 2, (L.directions.housing[1] + L.directions.housing[3]) / 2),
    },
    flag: cp((CARD.tab[0] + CARD.tab[2]) / 2, CARD.tab[1] + 20),
    plugs: cardPlugs(c.x, c.y, c.w, c.rot),
    drawer: {x: GEOM.drawer.x + GEOM.drawer.w / 2, y: GEOM.drawer.front.y0 + 40},
    box,
    spot,
    photo: PHOTO.map(box),
    runs: RUNS.map((r) => box(r[1])),
    stale: PHOTO.map((id) => spotPos(SSD_MAP[id], id)),
    header: (() => {
      const q = boxXY(21);
      return tp(applyM(labelM, q.x + BOX / 2, q.y + 6));
    })(),
    map: {x: (GEOM.map.plate.x0 + GEOM.map.plate.x1) / 2, y: (GEOM.map.plate.y0 + GEOM.map.plate.y1) / 2},
    mapCell: mc,
    slot: {x: GEOM.boundary.x, y: GEOM.boundary.slotY},
    actor: {x: GEOM.actor.x, y: GEOM.actor.y},
    spare: tp(applyM(back, GEOM.spare.x + PITCH - 4, GEOM.wall.y + GEOM.wall.h / 2)),
    platter: tp({x: GEOM.platter.x, y: GEOM.platter.y}),
    pxPerBox: BOX * zoom * Math.abs(Math.cos((v.theta * Math.PI) / 180)) * Math.cos((T.ay * Math.PI) / 180),
    lift: c.u,
    face,
  };
};
export const ALL_BOX_IDS: readonly number[] = Array.from({length: N_BOXES}, (_, i) => i + 1);
export {idAt};
