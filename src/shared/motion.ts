/**
 * Motion helpers: easing presets, the Bit run (speed rules), ripple, breathe, fades, flips and
 * deterministic jitter. Every function is a pure function of absolute frame numbers.
 */
import {Easing, random} from 'remotion';
import {noise2D} from '@remotion/noise';
import {BIT, GLYPH, LABEL} from './brand';
import {makeTrack, type Pt, type Track} from './geom';

/* ------------------------------------------------------------------------------------------------
 * Easing (brand spec §6.3)
 * ---------------------------------------------------------------------------------------------- */

export type EaseFn = (t: number) => number;

export const EASE = {
  /** Entrances, label settles, landings. cubic-bezier(0.16, 1, 0.3, 1) */
  arrive: Easing.bezier(0.16, 1, 0.3, 1),
  /** Camera and Lens dive. cubic-bezier(0.65, 0, 0.35, 1) */
  move: Easing.bezier(0.65, 0, 0.35, 1),
  /** Exits, 4–6 frames. cubic-bezier(0.4, 0, 1, 1) */
  exit: Easing.bezier(0.4, 0, 1, 1),
  /** Brackets only: ease-out back with 5.7% overshoot (brand max 6%). */
  snap: Easing.out(Easing.back(1.25)),
  outCubic: Easing.out(Easing.cubic),
  inCubic: Easing.in(Easing.cubic),
  inOutCubic: Easing.inOut(Easing.cubic),
  linear: (t: number) => t,
} satisfies Record<string, EaseFn>;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v: number): number => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** 0 → 1 over [start, start + frames], eased. frames <= 0 is a step at `start`. */
export const progress = (frame: number, start: number, frames: number, ease: EaseFn = EASE.linear): number => {
  if (frames <= 0) return frame >= start ? 1 : 0;
  return ease(clamp01((frame - start) / frames));
};

/** Opacity 0 → 1 from `start` over `frames` (Arrive). */
export const fadeIn = (frame: number, start: number, frames = 6, ease: EaseFn = EASE.arrive): number =>
  progress(frame, start, frames, ease);

/** Opacity 1 → 0 from `start` over `frames` (Exit). */
export const fadeOut = (frame: number, start: number, frames = 6, ease: EaseFn = EASE.exit): number =>
  1 - progress(frame, start, frames, ease);

/** In at `inAt`, optionally out at `outAt` (both absolute frames). */
export const fade = (
  frame: number,
  inAt: number,
  outAt?: number,
  inFrames = 6,
  outFrames = 6,
): number => {
  const a = fadeIn(frame, inAt, inFrames);
  const b = outAt === undefined ? 1 : fadeOut(frame, outAt, outFrames);
  return Math.min(a, b);
};

/** A state flip (4–6 frames, Arrive): 0 → 1 starting on its cause. */
export const flip = (frame: number, at: number, frames: number = GLYPH.flipFrames): number =>
  progress(frame, at, frames, EASE.arrive);

/** Is the frame inside [from, to)? */
export const within = (frame: number, from: number, to = Infinity): boolean => frame >= from && frame < to;

/** Path draw-on: returns the drawn length for a path of `length` px. */
export const drawOn = (frame: number, start: number, frames: number, length: number, ease: EaseFn = EASE.arrive): number =>
  length * progress(frame, start, frames, ease);

/* ------------------------------------------------------------------------------------------------
 * Breathing (always-on glyph, parked Bit)
 * ---------------------------------------------------------------------------------------------- */

/** ALWAYS-ON glyph opacity: 1.0 at f0, down to `min` and back over `period` frames (phase-locked to f0). */
export const breathe = (frame: number, period: number = GLYPH.breathePeriod, min: number = GLYPH.breatheMin, max = 1): number =>
  min + (max - min) * (0.5 + 0.5 * Math.cos((2 * Math.PI * frame) / period));

/** Parked-Bit scale: 1.00 → 1.10 → 1.00 over 48 frames, starting at `since` (1.0 on the landing frame). */
export const breatheScale = (frame: number, since = 0, period: number = BIT.breathe, amp: number = BIT.breatheScale): number =>
  1 + (amp / 2) * (1 - Math.cos((2 * Math.PI * Math.max(0, frame - since)) / period));

/* ------------------------------------------------------------------------------------------------
 * Landing ripple
 * ---------------------------------------------------------------------------------------------- */

export interface RippleState {
  /** Outline size (px), 24 → 80. */
  size: number;
  stroke: number;
  opacity: number;
  /** 0..1 progress. */
  t: number;
}

/** The square landing ripple that starts on `at` (the landing frame). Null outside its 10 frames. */
export const ripple = (frame: number, at: number): RippleState | null => {
  const r = BIT.ripple;
  if (frame < at || frame >= at + r.frames) return null;
  // size and stroke ease out (cubic); opacity falls linearly so the ripple stays readable for its 10 frames
  const u = (frame - at) / r.frames;
  const t = EASE.outCubic(u);
  return {
    size: lerp(r.from, r.to, t),
    stroke: lerp(r.strokeFrom, r.strokeTo, t),
    opacity: r.opacityFrom * (1 - u),
    t: u,
  };
};

/* ------------------------------------------------------------------------------------------------
 * Deterministic jitter (never Math.random)
 * ---------------------------------------------------------------------------------------------- */

/** Smooth noise in [-amp, amp] at position x (e.g. arc length / wavelength) and phase y. */
export const jitter = (seed: string | number, x: number, y = 0, amp = 1): number => noise2D(seed, x, y) * amp;

/** A 2D jitter offset for a point index (different seeds per axis). */
export const jitterPt = (seed: string, i: number, phase = 0, amp = 1, freq = 0.37): Pt => [
  noise2D(`${seed}:x`, i * freq, phase) * amp,
  noise2D(`${seed}:y`, i * freq, phase) * amp,
];

/** Uniform random in [0, 1) from a seed (Remotion's random()). */
export const rand = (seed: string | number): number => random(seed);
/** Uniform random in [lo, hi). */
export const randRange = (seed: string | number, lo: number, hi: number): number => lo + (hi - lo) * random(seed);

/**
 * "Boil" phase for hand-drawn lines: changes every `every` frames (0 = never; static jitter).
 * Brand: nothing moves without a reason, so the default is static.
 */
export const boilPhase = (frame: number, every = 0): number => (every > 0 ? Math.floor(frame / every) * 1.73 : 0);

/* ------------------------------------------------------------------------------------------------
 * Warnings (shown once per message; tools/stills.mjs and render.mjs print them from the browser log)
 * ---------------------------------------------------------------------------------------------- */

const WARNED = new Set<string>();
export const kitWarn = (msg: string): void => {
  if (WARNED.has(msg)) return;
  WARNED.add(msg);
  // eslint-disable-next-line no-console
  console.warn(`[kit] ${msg}`);
};

/* ------------------------------------------------------------------------------------------------
 * The Bit run (brand spec §6.1)
 *
 * Profile: 4-frame ease-in (velocity ramps 0 → v), linear cruise at v, 5-frame cubic ease-out into
 * the landing. Distance covered = v x (T − accel/2 − 2·decel/3) = v x (T − 5.33) for T total frames.
 * ---------------------------------------------------------------------------------------------- */

export interface BitRunOptions {
  /** The real route: an SVG path string (first subpath) or polyline points (8 px rounded bends). */
  path: string | ReadonlyArray<Pt>;
  /** Frame the Bit leaves (arc length 0). */
  depart: number;
  /** Frame it lands (arc length L). If given, the cruise speed is solved to land exactly here. */
  land?: number;
  /** Cruise speed in px/frame when `land` is not given (default 24). */
  speed?: number;
  /** Suppress the >30-frame warning for a documented exception (e.g. Style 1's slow S12 run). */
  allowLong?: boolean;
  /** Travel the path backwards (a rewind). */
  reverse?: boolean;
  /** Name used in warnings. */
  label?: string;
  /** Bend radius used when `path` is a polyline (default 8). */
  bend?: number;
}

export interface BitPosition {
  x: number;
  y: number;
  /** Arc length travelled (px). */
  s: number;
  /** Direction of travel (radians). */
  angle: number;
  phase: 'before' | 'moving' | 'landed';
}

export interface BitRun {
  label: string;
  depart: number;
  land: number;
  /** Travel frames (land − depart). */
  frames: number;
  /** Cruise speed (px/frame). */
  speed: number;
  length: number;
  start: Pt;
  end: Pt;
  track: Track;
  reverse: boolean;
  warnings: string[];
  /** Arc length at a frame (0 before departure, L from the landing frame on). */
  sAt: (frame: number) => number;
  at: (frame: number) => BitPosition;
}

/** Fraction of the cruise speed spent in the ease-in/ease-out profile: L = v·(T − K). */
const profileK = (a: number, b: number): number => a / 2 + (2 * b) / 3;

/**
 * Create a Bit run. It obeys the speed rules and warns (console, "[kit]") when:
 * the run is longer than 30 frames (unless allowLong), a hop is shorter than 10 frames,
 * or the solved cruise speed exceeds 36 px/frame.
 */
export const bitRun = (opts: BitRunOptions): BitRun => {
  const track = makeTrack(opts.path, opts.bend ?? 8);
  const L = track.length;
  const a = BIT.accel;
  const b = BIT.decel;
  const K = profileK(a, b);
  const label = opts.label ?? `run@${opts.depart}`;
  const warnings: string[] = [];
  let T: number;
  let v: number;
  if (opts.land !== undefined) {
    T = opts.land - opts.depart;
    if (T <= 0) throw new Error(`[kit] bitRun ${label}: land (${opts.land}) must be after depart (${opts.depart})`);
    v = T > a + b ? L / (T - K) : L / T;
  } else {
    const want = opts.speed ?? BIT.cruise;
    T = Math.max(1, Math.ceil(L / want + K));
    v = L / (T - K);
  }
  if (T > BIT.maxRun && !opts.allowLong) warnings.push(`bitRun ${label}: ${T} frames exceeds the 30-frame run limit (carry with the camera or tighten the view; or pass allowLong for a documented exception)`);
  if (T < BIT.minHop) warnings.push(`bitRun ${label}: ${T} frames is shorter than the 10-frame minimum hop`);
  if (v > BIT.maxSpeed + 1e-6) warnings.push(`bitRun ${label}: cruise ${v.toFixed(1)} px/frame exceeds the 36 px/frame maximum (path ${L.toFixed(0)} px in ${T} frames)`);
  for (const w of warnings) kitWarn(w);

  const sAtT = (t: number): number => {
    if (t <= 0) return 0;
    if (t >= T) return L;
    if (T <= a + b) {
      // too short for the full profile: symmetric ease in-out
      return L * EASE.inOutCubic(t / T);
    }
    const Da = (v * a) / 2;
    const Dc = v * (T - a - b);
    if (t <= a) return (v * t * t) / (2 * a);
    if (t <= T - b) return Da + v * (t - a);
    const u = (t - (T - b)) / b;
    const Dd = (v * b) / 3;
    return Da + Dc + Dd * (1 - Math.pow(1 - u, 3));
  };
  const sAt = (frame: number): number => {
    const s = sAtT(frame - opts.depart);
    return opts.reverse ? L - s : s;
  };
  const at = (frame: number): BitPosition => {
    const s = sAt(frame);
    const p = track.at(s);
    const phase: BitPosition['phase'] = frame < opts.depart ? 'before' : frame >= opts.depart + T ? 'landed' : 'moving';
    return {x: p.x, y: p.y, s, angle: opts.reverse ? p.angle + Math.PI : p.angle, phase};
  };
  const p0 = track.at(opts.reverse ? L : 0);
  const p1 = track.at(opts.reverse ? 0 : L);
  return {
    label,
    depart: opts.depart,
    land: opts.depart + T,
    frames: T,
    speed: v,
    length: L,
    start: [p0.x, p0.y],
    end: [p1.x, p1.y],
    track,
    reverse: !!opts.reverse,
    warnings,
    sAt,
    at,
  };
};

/**
 * A chain of hops (S06): one run per hop, each with its own path, departure and landing frame.
 * Pass the result to <Bit runs={...}/>: between hops the Bit waits (breathing) where it landed.
 */
export const bitChain = (
  hops: ReadonlyArray<{path: string | ReadonlyArray<Pt>; depart: number; land: number; label?: string}>,
): BitRun[] => hops.map((h, i) => bitRun({...h, label: h.label ?? `hop${i + 1}`}));

/* ------------------------------------------------------------------------------------------------
 * Label timing (brand spec §4.4)
 * ---------------------------------------------------------------------------------------------- */

export interface TagTiming {
  anchor: number;
  leader: number;
  text: number;
  textX: number;
  secondary: number;
  /** Visible at all? */
  visible: boolean;
}

/**
 * Keyed-tag entrance/exit progress at `frame` for a tag landing at t0 = `land`:
 * anchor pops t0−6 → t0−2, leader draws t0−5 → t0−1, text t0 → t0+5 (8 px slide), secondary from t0+4.
 * Exit (if `exitAt`): text fades exitAt → +4, leader retracts +2 → +6, anchor shrinks +3 → +6.
 */
export const tagTiming = (frame: number, land: number, exitAt?: number, secondaryAt?: number): TagTiming => {
  const anchorIn = progress(frame, land + LABEL.anchorPop[0], LABEL.anchorPop[1] - LABEL.anchorPop[0], EASE.arrive);
  const leaderIn = progress(frame, land + LABEL.leaderDraw[0], LABEL.leaderDraw[1] - LABEL.leaderDraw[0], EASE.arrive);
  const textIn = progress(frame, land + LABEL.enter[0], LABEL.enter[1] - LABEL.enter[0], EASE.arrive);
  const secAt = secondaryAt ?? land + LABEL.secondaryDelay;
  const secIn = progress(frame, secAt, 5, EASE.arrive);
  let textOut = 1;
  let leaderOut = 1;
  let anchorOut = 1;
  if (exitAt !== undefined) {
    textOut = 1 - progress(frame, exitAt, 4, EASE.exit);
    leaderOut = 1 - progress(frame, exitAt + 2, 4, EASE.exit);
    anchorOut = 1 - progress(frame, exitAt + 3, 3, EASE.exit);
  }
  const visible = frame >= land + LABEL.anchorPop[0] && (exitAt === undefined || frame < exitAt + LABEL.exitFrames);
  return {
    anchor: Math.min(anchorIn, anchorOut),
    leader: Math.min(leaderIn, leaderOut),
    text: Math.min(textIn, textOut),
    textX: (1 - textIn) * LABEL.slide,
    secondary: Math.min(secIn, textOut),
    visible,
  };
};
