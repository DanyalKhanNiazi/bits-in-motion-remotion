/**
 * Ep03 kit: small pure helpers (math, timing, seeded randomness, colour). Everything is a pure function of frame.
 */
import {useEffect, useState} from 'react';
import {continueRender, delayRender, random, spring, type SpringConfig} from 'remotion';
import {noise2D} from '@remotion/noise';
import {getLength, getPointAtLength} from '@remotion/paths';
import {MONO, SANS} from '../../shared/fonts';

export const TAU = Math.PI * 2;
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v: number): number => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const invLerp = (a: number, b: number, v: number): number => (b === a ? (v >= b ? 1 : 0) : clamp01((v - a) / (b - a)));
export const smooth = (t: number): number => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};

export type EaseFn = (t: number) => number;
export const linear: EaseFn = (t) => t;

/** 0 → 1 over [at, at + dur] with an ease. dur <= 0 is a step. */
export const prog = (frame: number, at: number, dur: number, ease: EaseFn = linear): number => {
  if (dur <= 0) return frame >= at ? 1 : 0;
  const u = clamp01((frame - at) / dur);
  return u <= 0 ? 0 : u >= 1 ? 1 : ease(u);
};

/** Visibility window: fades in over [at, at + fin], out over [until − fout, until]. until undefined = forever. */
export const win = (frame: number, at: number, until?: number, fin = 6, fout = 6): number => {
  if (frame < at) return 0;
  const a = fin > 0 ? clamp01((frame - at) / fin) : 1;
  if (until === undefined) return a;
  if (frame >= until) return 0;
  const b = fout > 0 ? clamp01((until - frame) / fout) : 1;
  return Math.min(a, b);
};

export type Spring = Partial<SpringConfig>;
/** remotion spring that starts at `at` (0 before). Pure. */
export const springAt = (frame: number, at: number, config: Spring, fps = 30): number =>
  frame < at ? 0 : spring({frame: frame - at, fps, config});

export const rnd = (seed: string | number): number => random(seed);
export const rr = (seed: string | number, lo: number, hi: number): number => lo + (hi - lo) * random(seed);
/** Smooth seeded noise in −1..1. */
export const nz = (seed: string, x: number, y = 0): number => noise2D(seed, x, y);
export const osc = (frame: number, period: number, phase = 0): number => Math.sin(TAU * (frame / period + phase));

/** Keyframe track: [[frame, value, ease?], ...]; the ease of key i shapes the segment that ENDS at key i. */
export type Key = readonly [number, number] | readonly [number, number, EaseFn];
export const track = (frame: number, ks: readonly Key[]): number => {
  if (ks.length === 0) return 0;
  if (frame <= ks[0][0]) return ks[0][1];
  for (let i = 1; i < ks.length; i++) {
    const [f1, v1, e] = ks[i] as [number, number, EaseFn | undefined];
    if (frame < f1) {
      const [f0, v0] = ks[i - 1];
      const t = (frame - f0) / Math.max(1e-6, f1 - f0);
      return lerp(v0, v1, (e ?? smooth)(clamp01(t)));
    }
  }
  return ks[ks.length - 1][1];
};

/** A value given either as a number or a keyframe track. */
export type Num = number | readonly Key[];
export const num = (v: Num | undefined, frame: number, dflt = 0): number =>
  v === undefined ? dflt : typeof v === 'number' ? v : track(frame, v);

/* ---------------------------------------------------------------- colour */
export const hex2rgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
};
export const rgba = (h: string, a: number): string => {
  const [r, g, b] = hex2rgb(h);
  return `rgba(${r},${g},${b},${clamp01(a).toFixed(3)})`;
};
const to2 = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
export const mixHex = (a: string, b: string, t: number): string => {
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  const u = clamp01(t);
  return `#${to2(lerp(A[0], B[0], u))}${to2(lerp(A[1], B[1], u))}${to2(lerp(A[2], B[2], u))}`;
};
/** Multiply a colour's brightness (k > 1 lifts toward white). */
export const shadeHex = (h: string, k: number): string => (k <= 1 ? mixHex('#000000', h, k) : mixHex(h, '#ffffff', clamp01(k - 1)));

/** A CSS-safe id from React.useId(). */
export const safeId = (id: string): string => id.replace(/[^a-zA-Z0-9_-]/g, '');

/* ---------------------------------------------------------------- fonts and text measurement */
let fontsReady = false;
let fontsPromise: Promise<void> | null = null;
const loadFonts = (): Promise<void> => {
  if (!fontsPromise) {
    const specs = [`600 40px ${SANS}`, `700 40px ${SANS}`, `500 40px ${MONO}`];
    fontsPromise = Promise.all(specs.map((s) => document.fonts.load(s)))
      .then(() => document.fonts.ready)
      .then(() => {
        fontsReady = true;
      })
      .catch(() => {
        fontsReady = true;
      });
  }
  return fontsPromise;
};

/** true once Sora and JetBrains Mono are usable (holds the render with delayRender until then). */
export const useFontsReady = (): boolean => {
  const [ready, setReady] = useState(fontsReady);
  const [handle] = useState(() => (fontsReady ? null : delayRender('ep03 kit: fonts')));
  useEffect(() => {
    if (fontsReady) {
      if (handle !== null) continueRender(handle);
      return;
    }
    let live = true;
    loadFonts().then(() => {
      if (live) setReady(true);
      if (handle !== null) continueRender(handle);
    });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
};

let ctx: CanvasRenderingContext2D | null = null;
const widthCache = new Map<string, number>();
/** Text advance width in px (canvas measure). Only exact once useFontsReady() is true; approximate before. */
export const textWidth = (text: string, size: number, weight = 600, family: string = SANS, tracking = 0): number => {
  const key = `${fontsReady ? 1 : 0}|${weight}|${size}|${family}|${tracking}|${text}`;
  const hit = widthCache.get(key);
  if (hit !== undefined) return hit;
  if (!ctx && typeof document !== 'undefined') ctx = document.createElement('canvas').getContext('2d');
  let w = text.length * size * 0.6;
  if (ctx) {
    ctx.font = `${weight} ${size}px ${family}`;
    w = ctx.measureText(text).width;
  }
  w += tracking * size * Math.max(0, [...text].length - 1);
  if (fontsReady) widthCache.set(key, w);
  return w;
};

/** Hold the render until an image URL is decoded (used for CSS masks that reuse a PNG's alpha). */
const imgReady = new Set<string>();
export const useImageReady = (src: string | null): void => {
  const [handle] = useState(() => (src && !imgReady.has(src) ? delayRender(`ep03 kit: image ${src}`) : null));
  useEffect(() => {
    if (handle === null || !src) return;
    const img = new Image();
    const done = () => {
      imgReady.add(src);
      continueRender(handle);
    };
    img.onload = () => {
      if (img.decode) img.decode().then(done, done);
      else done();
    };
    img.onerror = done;
    img.src = src;
  }, [handle, src]);
};

/* ---------------------------------------------------------------- geometry */
export type Pt = {x: number; y: number};
export type Quad = readonly [readonly [number, number], readonly [number, number], readonly [number, number], readonly [number, number]];

/**
 * CSS matrix3d that maps a w×h box (origin top-left) onto a quad [TL, TR, BR, BL] (same space as the box's parent).
 * Use with transform-origin: 0 0.
 */
export const quadMatrix = (w: number, h: number, q: Quad): string => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  // square → quad (Heckbert)
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0;
  let hh = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    hh = (dx1 * sy - sx * dy1) / den;
  }
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const c = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  const f = y0;
  // scale the unit square to w×h
  const A = a / w;
  const B = b / h;
  const D = d / w;
  const E = e / h;
  const G = g / w;
  const H = hh / h;
  // column-major matrix3d
  const m = [A, D, 0, G, B, E, 0, H, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((v) => (Math.abs(v) < 1e-12 ? 0 : v).toFixed(10)).join(',')})`;
};

/* 3×3 homographies (row-major), unit square → quad, and quad → quad as a CSS matrix3d. */
type M3 = [number, number, number, number, number, number, number, number, number];
const sqToQuad = (q: Quad): M3 => {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3;
  const sy = y0 - y1 + y2 - y3;
  let g = 0;
  let h = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
  }
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
};
const inv3 = (m: M3): M3 => {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h;
  const B = -(d * i - f * g);
  const C = d * h - e * g;
  const det = a * A + b * B + c * C || 1e-12;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, C / det, -(a * h - b * g) / det, (a * e - b * d) / det];
};
const mul3 = (p: M3, q: M3): M3 => {
  const r = [0, 0, 0, 0, 0, 0, 0, 0, 0] as M3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = p[i * 3] * q[j] + p[i * 3 + 1] * q[3 + j] + p[i * 3 + 2] * q[6 + j];
  return r;
};
/**
 * CSS matrix3d that maps the quad `from` (in an element's own px, e.g. a region of an image) onto the quad `to` (parent
 * px). Corners in the same order on both. Use with transform-origin: 0 0 (and clip-path to `from`).
 */
export const quadToQuadMatrix = (from: Quad, to: Quad): string => {
  const H = mul3(sqToQuad(to), inv3(sqToQuad(from)));
  const k = H[8] || 1;
  const m = [H[0], H[3], 0, H[6], H[1], H[4], 0, H[7], 0, 0, 1, 0, H[2], H[5], 0, H[8]].map((v) => v / k);
  return `matrix3d(${m.map((v) => (Math.abs(v) < 1e-14 ? '0' : v.toPrecision(12))).join(',')})`;
};

/** An SVG path sampled into evenly spaced points (build once with samplePath inside useMemo). */
export type PathSamples = {pts: Pt[]; total: number; step: number};
const sampleCache = new Map<string, PathSamples>();
export const samplePath = (d: string, step = 6): PathSamples => {
  const key = `${step}|${d}`;
  const hit = sampleCache.get(key);
  if (hit) return hit;
  const total = getLength(d);
  const n = Math.max(2, Math.ceil(total / step));
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const p = getPointAtLength(d, (total * i) / n);
    if (p) pts.push({x: p.x, y: p.y});
  }
  const s = {pts, total, step: total / n};
  sampleCache.set(key, s);
  return s;
};
/** Point and unit tangent at arc length L (clamped). */
export const pathAt = (s: PathSamples, L: number): {x: number; y: number; tx: number; ty: number} => {
  const u = clamp(L, 0, s.total) / s.step;
  const i = Math.min(s.pts.length - 2, Math.floor(u));
  const t = u - i;
  const a = s.pts[i];
  const b = s.pts[i + 1];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const m = Math.hypot(dx, dy) || 1;
  return {x: a.x + dx * t, y: a.y + dy * t, tx: dx / m, ty: dy / m};
};
