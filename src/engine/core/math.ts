/**
 * Small math helpers (ENGINE.md §0 core/math.ts). Pure and deterministic.
 */
import {random} from 'remotion';
import type {Pt, SRect, WRect} from './types';

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const clamp01 = (v: number): number => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
/** Interpolate in log space (zoom): equal ratios per equal steps. Falls back to lerp for non-positive values. */
export const logLerp = (a: number, b: number, t: number): number =>
  a > 0 && b > 0 ? Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * t) : lerp(a, b, t);

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const addPt = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
export const subPt = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
export const scalePt = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
export const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);

export const rectCenter = (r: WRect | SRect): Pt => [r.x + r.w / 2, r.y + r.h / 2];

export const unionRect = <R extends WRect | SRect>(rs: ReadonlyArray<R>): SRect => {
  if (rs.length === 0) return {x: 0, y: 0, w: 0, h: 0};
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const r of rs) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
};

export const lerpRect = (a: SRect, b: SRect, t: number): SRect => ({
  x: lerp(a.x, b.x, t),
  y: lerp(a.y, b.y, t),
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  r: a.r !== undefined || b.r !== undefined ? lerp(a.r ?? 0, b.r ?? 0, t) : undefined,
});

export const inflate = (r: SRect, d: number): SRect => ({x: r.x - d, y: r.y - d, w: r.w + 2 * d, h: r.h + 2 * d, r: r.r});

/** Do two rects overlap (or come closer than `gap`)? */
export const rectsOverlap = (a: SRect, b: SRect, gap = 0): boolean =>
  a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap;

export const rectContains = (r: SRect | WRect, p: Pt): boolean => p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;

/** Even-odd ray casting. */
export const polygonContains = (poly: ReadonlyArray<Pt>, p: Pt): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi + 1e-12) + xi) inside = !inside;
  }
  return inside;
};

export const quantize = (v: number, step: number): number => Math.round(v / step) * step;

/** Deterministic hash in [0, 1) (Remotion's seeded random). */
export const hash01 = (seed: string, ...n: number[]): number => random(`${seed}|${n.join(',')}`);

/** Two decimals for SVG strings. */
export const f2 = (n: number): string => (Math.round(n * 100) / 100).toString();

/** Convex hull (monotone chain), counter-clockwise. */
export const convexHull = (input: ReadonlyArray<Pt>): Pt[] => {
  const pts = [...input].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (pts.length < 3) return pts;
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
};
