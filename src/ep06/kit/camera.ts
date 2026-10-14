/**
 * Ep03 kit: the 2.5D stage camera. A pose {x, y, zoom, rot} names the WORLD point shown at the frame centre, the
 * zoom and the roll (deg). Keys are pure data; evalCam() is a pure function of frame. An always-on micro drift keeps
 * every hold alive (constant ~0.3 px/frame circular drift plus a slow zoom breath).
 */
import React from 'react';
import {EASE, type EaseKey} from './look';
import {clamp01, lerp, osc, TAU, type EaseFn} from './util';

export type Pose = {x: number; y: number; zoom: number; rot: number};

/**
 * The camera a node renders under (Stage provides it: the pose zoom for world content, 1 for its hud). `zoom` is the
 * TOTAL world→screen scale (camera zoom × any panel scale), `x`/`y` the world point at the frame centre, `space` says
 * whether the node sits in a world (moves with a camera), a SplitCompare panel, or screen space (hud / no Stage).
 */
export type CameraInfo = {zoom: number; rot: number; x?: number; y?: number; space?: 'world' | 'panel' | 'screen'};
export const CameraContext = React.createContext<CameraInfo>({zoom: 1, rot: 0, space: 'screen'});
/**
 * The factor that turns a font size into on-screen px for a `screen` option: true = counter the Stage camera zoom,
 * a number = counter that parent scale too (e.g. a Prop's k or a LensDive inner scale), false/undefined = none.
 */
export const screenScale = (screen: boolean | number | undefined, cam: CameraInfo): number =>
  screen === true ? 1 / Math.max(1e-3, cam.zoom) : typeof screen === 'number' ? 1 / Math.max(1e-3, screen * cam.zoom) : 1;
export const POSE0: Pose = {x: 960, y: 540, zoom: 1, rot: 0};

/**
 * A camera key. The move INTO this key ends at `f` and lasts `dur` frames (default: since the previous key), with
 * `ease` (default EASE.cam). Missing fields keep the previous key's value.
 */
export type CamKey = {f: number; x?: number; y?: number; zoom?: number; rot?: number; dur?: number; ease?: EaseFn | EaseKey};
export type CamInput = Partial<Pose> | CamKey[] | ((frame: number) => Partial<Pose>);

const easeOf = (e: EaseFn | EaseKey | undefined): EaseFn => (typeof e === 'function' ? e : e ? EASE[e] : EASE.cam);

/** Evaluate keys at a frame (pure). */
export const evalKeys = (keys: readonly CamKey[], frame: number, base: Pose = POSE0): Pose => {
  if (keys.length === 0) return base;
  const ks = [...keys].sort((a, b) => a.f - b.f);
  const full: Pose[] = [];
  let cur: Pose = {...base};
  for (const k of ks) {
    cur = {x: k.x ?? cur.x, y: k.y ?? cur.y, zoom: k.zoom ?? cur.zoom, rot: k.rot ?? cur.rot};
    full.push(cur);
  }
  if (frame <= ks[0].f) return full[0];
  for (let i = 1; i < ks.length; i++) {
    const k = ks[i];
    if (frame < k.f) {
      const dur = Math.max(1, k.dur ?? k.f - ks[i - 1].f);
      const t0 = Math.max(ks[i - 1].f, k.f - dur);
      const t = easeOf(k.ease)(clamp01((frame - t0) / Math.max(1, k.f - t0)));
      const a = full[i - 1];
      const b = full[i];
      // zoom interpolates in log space (constant perceived speed)
      return {x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), zoom: Math.exp(lerp(Math.log(a.zoom), Math.log(b.zoom), t)), rot: lerp(a.rot, b.rot, t)};
    }
  }
  return full[full.length - 1];
};

export const evalCam = (cam: CamInput | undefined, frame: number): Pose => {
  if (!cam) return POSE0;
  if (Array.isArray(cam)) return evalKeys(cam, frame);
  if (typeof cam === 'function') return {...POSE0, ...cam(frame)};
  return {...POSE0, ...(cam as Partial<Pose>)};
};

/** Always-on micro drift (world px, at zoom 1): a slow circle (constant speed ≈ 0.31 × amount px/frame) plus breath. */
export const driftOf = (frame: number, amount = 1): Pose => {
  if (amount === 0) return {x: 0, y: 0, zoom: 1, rot: 0};
  const a = TAU * (frame / 240);
  return {
    x: Math.sin(a) * 12 * amount,
    y: Math.cos(a) * 12 * amount * 0.7 + osc(frame, 410, 0.2) * 3 * amount,
    zoom: 1 + 0.006 * amount * osc(frame, 330, 0.1),
    rot: 0.06 * amount * osc(frame, 520, 0.35),
  };
};

/** Impact shake: a decaying, seeded-feeling wobble after each hit (screen px). */
export type Hit = {at: number; strength?: number};
export const shakeOf = (frame: number, hits: readonly Hit[] | undefined): {x: number; y: number; rot: number} => {
  let x = 0;
  let y = 0;
  let rot = 0;
  for (const h of hits ?? []) {
    const t = frame - h.at;
    if (t < 0 || t > 24) continue;
    const s = (h.strength ?? 1) * Math.exp(-t / 5);
    x += 14 * s * Math.sin(t * 2.9 + h.at);
    y += 10 * s * Math.cos(t * 3.7 + h.at * 0.5);
    rot += 0.35 * s * Math.sin(t * 2.3);
  }
  return {x, y, rot};
};

/** The full pose used by <Stage> at a frame: keys + drift + shake. */
export const stagePose = (cam: CamInput | undefined, frame: number, drift = 1, hits?: readonly Hit[]): Pose => {
  const p = evalCam(cam, frame);
  const d = driftOf(frame, drift);
  const s = shakeOf(frame, hits);
  return {x: p.x + d.x - s.x / p.zoom, y: p.y + d.y - s.y / p.zoom, zoom: p.zoom * d.zoom, rot: p.rot + d.rot + s.rot};
};

/** CSS transform for a 1920×1080 world container (transform-origin 0 0). */
export const camCss = (p: Pose, w = 1920, h = 1080): string =>
  `translate(${w / 2}px, ${h / 2}px) rotate(${p.rot}deg) scale(${p.zoom}) translate(${-p.x}px, ${-p.y}px)`;

/** World point → screen point for a pose. */
export const toScreen = (p: Pose, wx: number, wy: number, w = 1920, h = 1080): {x: number; y: number} => {
  const r = (p.rot * Math.PI) / 180;
  const dx = (wx - p.x) * p.zoom;
  const dy = (wy - p.y) * p.zoom;
  return {x: w / 2 + dx * Math.cos(r) - dy * Math.sin(r), y: h / 2 + dx * Math.sin(r) + dy * Math.cos(r)};
};

/**
 * A camera key timed on a spoken word (pass the {start} from at()). align 'end' (default) arrives ON the word;
 * 'mid' centres the move on it; 'start' starts on it.
 */
export const onWord = (
  word: {start: number} | number,
  pose: Partial<Pose>,
  opts: {dur?: number; align?: 'start' | 'mid' | 'end'; ease?: EaseFn | EaseKey; offset?: number} = {},
): CamKey => {
  const w = typeof word === 'number' ? word : word.start;
  const dur = opts.dur ?? 24;
  const f0 = w + (opts.offset ?? 0);
  const f = opts.align === 'start' ? f0 + dur : opts.align === 'mid' ? f0 + Math.round(dur / 2) : f0;
  return {f, dur, ease: opts.ease, ...pose};
};

/** Frame a world rectangle (centre and zoom so it fills `fill` of the frame). */
export const frameRect = (x0: number, y0: number, x1: number, y1: number, fill = 0.8): Partial<Pose> => ({
  x: (x0 + x1) / 2,
  y: (y0 + y1) / 2,
  zoom: Math.min((1920 * fill) / Math.max(1, x1 - x0), (1080 * fill) / Math.max(1, y1 - y0)),
});
