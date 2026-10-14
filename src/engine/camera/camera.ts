/**
 * Camera, parallax and 2.5D (ENGINE.md §5, STYLE_BIBLE §6.4, §7).
 *
 * A shot is a world point held at the frame centre plus a zoom (world → screen scale). Moves interpolate the zoom in
 * log space while a world anchor travels on a straight eased screen path (a pure zoom keeps its anchor fixed).
 * Parallax layers (deep circuit 0.25, grid 0.6, room 0.9) are matched to the deck at the reference shot.
 */
import {EXTRUDE, DUR, type EaseName} from '../tokens';
import {EASE6} from '../core/ease';
import {clamp01, lerp, logLerp} from '../core/math';
import type {Pt, SRect, Vec, WRect} from '../core/types';

export interface Shot {
  /** World point at the frame centre (960, 540). */
  center: Pt;
  /** World → screen scale. */
  zoom: number;
}
export type ShotName = string;

export interface CameraKey {
  /** Absolute start frame. */
  at: number;
  /** Frames (>= tokens DUR.cameraMin); 0 only for a cut in a pause. */
  dur: number;
  to: ShotName | Shot;
  /** 'carry' | 'glide' | 'move' (any token ease is accepted). */
  ease: EaseName;
  /** World point that travels on a straight eased screen path while zoom interpolates in log space (default: to.center). */
  anchor?: Pt;
  /** Links the key to a Bit run (BitSpec id) for bitScreenSpeedReport and the DSL's default carry timing. */
  carry?: string;
  note?: string;
}

export interface CameraTrack {
  start: ShotName | Shot;
  keys: CameraKey[];
  shots: Record<ShotName, Shot>;
  /** The reference shot for parallax (deep circuit, grid and room objects are matched to the deck here). */
  reference: ShotName;
}

export interface Cam {
  center: Pt;
  zoom: number;
  /** A key is in progress. */
  moving: boolean;
  /** The active key (or the last completed one); −1 before any key. Indexes the track's `keys` array. */
  keyIndex: number;
  /** Linear progress of the active key 0..1 (1 at a hold). */
  t: number;
  /** Eased progress of the active key 0..1 (1 at a hold). */
  e?: number;
  /** Named shots the move runs between (at a hold both are the held shot's name, when it has one). */
  from?: ShotName;
  to?: ShotName;
  /** Screen point where `center` lands (default S0; a ViewCam uses its viewport centre). */
  origin?: Pt;
}

/** A camera for a sub-view (plates, bands, Lens): the shot's centre lands at the viewport's centre. */
export interface ViewCam extends Cam {
  viewport: SRect;
}

export const S0: Pt = [960, 540];

export const isViewCam = (c: Cam | ViewCam): c is ViewCam => (c as ViewCam).viewport !== undefined;

/** Screen point where the camera's centre lands. */
export const camOrigin = (cam: Cam | ViewCam): Pt => {
  if (cam.origin) return cam.origin;
  if (isViewCam(cam)) return [cam.viewport.x + cam.viewport.w / 2, cam.viewport.y + cam.viewport.h / 2];
  return S0;
};

/* ------------------------------------------------------------------------------------------------
 * Projection
 * ---------------------------------------------------------------------------------------------- */

/** Deck (factor 1): origin + zoom × (p − center). */
export const project = (cam: Cam | ViewCam, p: Pt): Pt => {
  const o = camOrigin(cam);
  return [o[0] + cam.zoom * (p[0] - cam.center[0]), o[1] + cam.zoom * (p[1] - cam.center[1])];
};

export const unproject = (cam: Cam | ViewCam, s: Pt): Pt => {
  const o = camOrigin(cam);
  return [cam.center[0] + (s[0] - o[0]) / cam.zoom, cam.center[1] + (s[1] - o[1]) / cam.zoom];
};

/** The SVG transform that maps world px into this camera's screen px. */
export const camTransform = (cam: Cam | ViewCam): string => {
  const o = camOrigin(cam);
  const tx = o[0] - cam.zoom * cam.center[0];
  const ty = o[1] - cam.zoom * cam.center[1];
  return `translate(${tx} ${ty}) scale(${cam.zoom})`;
};

/** Zoom of a parallax layer with factor f: ref.zoom × (cam.zoom / ref.zoom)^f. */
export const layerZoom = (cam: Cam, f: number, ref: Shot): number => ref.zoom * Math.pow(cam.zoom / ref.zoom, f);

/**
 * The camera of a parallax layer (or a room object) with factor f, matched to the deck at the reference shot:
 * its centre moves f × the deck's centre motion and its zoom changes by (zoom ratio)^f.
 */
export const layerCam = <C extends Cam | ViewCam>(cam: C, f: number, ref: Shot): C => {
  if (f === 1) return cam;
  return {
    ...cam,
    center: [ref.center[0] + f * (cam.center[0] - ref.center[0]), ref.center[1] + f * (cam.center[1] - ref.center[1])],
    zoom: layerZoom(cam, f, ref),
  };
};

/** A point on a parallax layer or room object with factor f. */
export const projectLayer = (cam: Cam, p: Pt, f: number, ref: Shot): Pt => project(layerCam(cam, f, ref), p);

/**
 * 2.5D side offset (WORLD px) of a raised part: z × [(obliqueX, obliqueY) + perspective × (centreScreen − S0) / 1000].
 * The view's own centre stands in for S0 in sub-views.
 */
export const sideOffset = (cam: Cam | ViewCam, top: WRect, z: number): Vec => {
  if (!(z > 0)) return [0, 0];
  const c = project(cam, [top.x + top.w / 2, top.y + top.h / 2]);
  const o = camOrigin(cam);
  return [
    z * (EXTRUDE.obliqueX + (EXTRUDE.perspective * (c[0] - o[0])) / 1000),
    z * (EXTRUDE.obliqueY + (EXTRUDE.perspective * (c[1] - o[1])) / 1000),
  ];
};

/** Screen-space bounds of a world rect (optionally on a parallax plane `depth`, matched at `ref`). */
export const screenRect = (cam: Cam | ViewCam, r: WRect, depth = 1, ref?: Shot): SRect => {
  const c = depth !== 1 && ref ? layerCam(cam, depth, ref) : cam;
  const a = project(c, [r.x, r.y]);
  return {x: a[0], y: a[1], w: r.w * c.zoom, h: r.h * c.zoom};
};

/** A camera for a sub-view: maps a shot into a screen rect (the shot's centre lands at the viewport centre). */
export const viewCam = (shot: Shot, viewport: SRect): ViewCam => ({
  center: shot.center,
  zoom: shot.zoom,
  moving: false,
  keyIndex: -1,
  t: 1,
  e: 1,
  viewport,
});

/** A fixed camera at a shot (no track). */
export const camAtShot = (shot: Shot, name?: ShotName): Cam => ({
  center: shot.center,
  zoom: shot.zoom,
  moving: false,
  keyIndex: -1,
  t: 1,
  e: 1,
  from: name,
  to: name,
});

/** The identity camera: world px = screen px (rows, screen-space runs). */
export const SCREEN_CAM: Cam = {center: S0, zoom: 1, moving: false, keyIndex: -1, t: 1, e: 1};

/* ------------------------------------------------------------------------------------------------
 * Tracks
 * ---------------------------------------------------------------------------------------------- */

export const resolveShot = (track: Pick<CameraTrack, 'shots'>, s: ShotName | Shot): Shot => {
  if (typeof s !== 'string') return s;
  const shot = track.shots[s];
  if (!shot) throw new Error(`[engine] unknown shot "${s}"`);
  return shot;
};

/**
 * One interpolation step: s(t) = exp(lerp(ln zA, ln zB, e)); the anchor's screen point moves linearly in e;
 * center = anchor − (P − S0) / s.
 */
export const lerpShot = (a: Shot, b: Shot, e: number, anchor?: Pt): Shot => {
  const an = anchor ?? b.center;
  const s = logLerp(a.zoom, b.zoom, e);
  const PA: Pt = [a.zoom * (an[0] - a.center[0]), a.zoom * (an[1] - a.center[1])];
  const PB: Pt = [b.zoom * (an[0] - b.center[0]), b.zoom * (an[1] - b.center[1])];
  const P: Pt = [lerp(PA[0], PB[0], e), lerp(PA[1], PB[1], e)];
  return {center: [an[0] - P[0] / s, an[1] - P[1] / s], zoom: s};
};

interface KeyPlan {
  index: number;
  at: number;
  dur: number;
  ease: EaseName;
  from: Shot;
  to: Shot;
  fromName?: ShotName;
  toName?: ShotName;
  anchor?: Pt;
}

const PLANS = new WeakMap<CameraTrack, {start: Shot; startName?: ShotName; plans: KeyPlan[]}>();

const evalPlans = (plans: KeyPlan[], start: Shot, startName: ShotName | undefined, frame: number): Cam => {
  let cur: KeyPlan | null = null;
  for (const p of plans) {
    if (p.at > frame) break;
    cur = p;
  }
  if (!cur) return {center: start.center, zoom: start.zoom, moving: false, keyIndex: -1, t: 1, e: 1, from: startName, to: startName};
  if (cur.dur <= 0 || frame >= cur.at + cur.dur) {
    return {center: cur.to.center, zoom: cur.to.zoom, moving: false, keyIndex: cur.index, t: 1, e: 1, from: cur.toName, to: cur.toName};
  }
  const t = clamp01((frame - cur.at) / cur.dur);
  const e = EASE6[cur.ease](t);
  const s = lerpShot(cur.from, cur.to, e, cur.anchor);
  return {center: s.center, zoom: s.zoom, moving: true, keyIndex: cur.index, t, e, from: cur.fromName, to: cur.toName};
};

const planOf = (track: CameraTrack): {start: Shot; startName?: ShotName; plans: KeyPlan[]} => {
  const hit = PLANS.get(track);
  if (hit) return hit;
  const start = resolveShot(track, track.start);
  const startName = typeof track.start === 'string' ? track.start : undefined;
  const order = track.keys.map((k, i) => ({k, i})).sort((a, b) => a.k.at - b.k.at || a.i - b.i);
  const plans: KeyPlan[] = [];
  for (const {k, i} of order) {
    const before = evalPlans(plans, start, startName, k.at - 1e-6);
    const prev = plans[plans.length - 1];
    const prevDone = !prev || prev.dur <= 0 || prev.at + prev.dur <= k.at;
    plans.push({
      index: i,
      at: k.at,
      dur: k.dur,
      ease: k.ease,
      from: {center: before.center, zoom: before.zoom},
      to: resolveShot(track, k.to),
      fromName: prevDone ? (prev ? prev.toName : startName) : undefined,
      toName: typeof k.to === 'string' ? k.to : undefined,
      anchor: k.anchor,
    });
  }
  const out = {start, startName, plans};
  PLANS.set(track, out);
  return out;
};

/** The main camera at a frame (fractional frames allowed, for the checks). */
export const cameraAt = (frame: number, track: CameraTrack): Cam => {
  const {start, startName, plans} = planOf(track);
  return evalPlans(plans, start, startName, frame);
};

/** The reference shot of a track. */
export const referenceShot = (track: CameraTrack): Shot => resolveShot(track, track.reference);

/** Frames of the track's keys as [at, end) spans (for checks and the motion audit). */
export const keySpans = (track: CameraTrack): Array<{index: number; at: number; end: number}> =>
  planOf(track).plans.map((p) => ({index: p.index, at: p.at, end: p.at + Math.max(0, p.dur)}));

/** Shortest legal move (tokens DUR.cameraMin); exported for the checks. */
export const CAMERA_MIN_FRAMES = DUR.cameraMin;
