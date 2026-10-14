/**
 * Geometry helpers: SVG path builders, path flattening (cached), arc-length tracks and polyline offsets.
 * Everything is in px in the 1920x1080 frame space. Pure and deterministic.
 */
import {parsePath, reduceInstructions} from '@remotion/paths';

export type Pt = readonly [number, number];
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const f = (n: number): string => (Math.round(n * 100) / 100).toString();

/* ------------------------------------------------------------------------------------------------
 * Path builders
 * ---------------------------------------------------------------------------------------------- */

/** Rounded rectangle (clockwise from the top-left corner). */
export const rectPath = (x: number, y: number, w: number, h: number, r = 0): string => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr === 0) return `M${f(x)} ${f(y)}H${f(x + w)}V${f(y + h)}H${f(x)}Z`;
  return (
    `M${f(x + rr)} ${f(y)}H${f(x + w - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x + w)} ${f(y + rr)}` +
    `V${f(y + h - rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x + w - rr)} ${f(y + h)}` +
    `H${f(x + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x)} ${f(y + h - rr)}` +
    `V${f(y + rr)}A${f(rr)} ${f(rr)} 0 0 1 ${f(x + rr)} ${f(y)}Z`
  );
};

/** Rounded square centred on (cx, cy). */
export const squarePath = (cx: number, cy: number, size: number, r = 0): string =>
  rectPath(cx - size / 2, cy - size / 2, size, size, r);

/** Circle starting at 12 o'clock and running clockwise (so a trimmed draw grows clockwise from 12). */
export const circlePath = (cx: number, cy: number, r: number): string =>
  `M${f(cx)} ${f(cy - r)}A${f(r)} ${f(r)} 0 1 1 ${f(cx)} ${f(cy + r)}A${f(r)} ${f(r)} 0 1 1 ${f(cx)} ${f(cy - r)}Z`;

/** Straight polyline. */
export const polyPath = (pts: ReadonlyArray<Pt>, closed = false): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f(p[0])} ${f(p[1])}`).join('') + (closed ? 'Z' : '');

/** Line segment. */
export const linePath = (a: Pt, b: Pt): string => `M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`;

/**
 * Polyline with rounded bends (default 8 px: the brand's signal-route bend radius; channels use 10).
 * Use the SAME string for drawing the route and for the Bit's track so they coincide.
 */
export const routePath = (pts: ReadonlyArray<Pt>, radius = 8): string => {
  if (pts.length < 3 || radius <= 0) return polyPath(pts);
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    if (l1 < 1e-6 || l2 < 1e-6) continue;
    const r = Math.min(radius, l1 / 2, l2 / 2);
    const a: Pt = [p1[0] - ((p1[0] - p0[0]) / l1) * r, p1[1] - ((p1[1] - p0[1]) / l1) * r];
    const b: Pt = [p1[0] + ((p2[0] - p1[0]) / l2) * r, p1[1] + ((p2[1] - p1[1]) / l2) * r];
    d += `L${f(a[0])} ${f(a[1])}Q${f(p1[0])} ${f(p1[1])} ${f(b[0])} ${f(b[1])}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${f(last[0])} ${f(last[1])}`;
};

/** Almond (eye) outline centred on (cx, cy): width w, visible height h. */
export const almondPath = (cx: number, cy: number, w: number, h: number): string =>
  `M${f(cx - w / 2)} ${f(cy)}Q${f(cx)} ${f(cy - h)} ${f(cx + w / 2)} ${f(cy)}Q${f(cx)} ${f(cy + h)} ${f(cx - w / 2)} ${f(cy)}Z`;

/* ------------------------------------------------------------------------------------------------
 * Flattening (cached by path string)
 * ---------------------------------------------------------------------------------------------- */

export interface Poly {
  pts: Pt[];
  closed: boolean;
}

const FLAT_CACHE = new Map<string, Poly[]>();

const bez = (p0: number, p1: number, p2: number, p3: number, t: number): number => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};

/** Flatten an SVG path into polylines (curves split into ~3 px chords). Cached. */
export const flattenPath = (d: string): Poly[] => {
  const hit = FLAT_CACHE.get(d);
  if (hit) return hit;
  const ins = reduceInstructions(parsePath(d));
  const polys: Poly[] = [];
  let cur: Pt[] | null = null;
  let start: Pt = [0, 0];
  let pos: Pt = [0, 0];
  const flush = (closed: boolean) => {
    if (cur && cur.length > 1) polys.push({pts: cur, closed});
    cur = null;
  };
  for (const i of ins) {
    if (i.type === 'M') {
      flush(false);
      cur = [[i.x, i.y]];
      start = [i.x, i.y];
      pos = start;
    } else if (i.type === 'L') {
      if (!cur) cur = [pos];
      cur.push([i.x, i.y]);
      pos = [i.x, i.y];
    } else if (i.type === 'C') {
      if (!cur) cur = [pos];
      const est =
        Math.hypot(i.cp1x - pos[0], i.cp1y - pos[1]) +
        Math.hypot(i.cp2x - i.cp1x, i.cp2y - i.cp1y) +
        Math.hypot(i.x - i.cp2x, i.y - i.cp2y);
      const n = Math.max(2, Math.min(96, Math.ceil(est / 3)));
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        cur.push([bez(pos[0], i.cp1x, i.cp2x, i.x, t), bez(pos[1], i.cp1y, i.cp2y, i.y, t)]);
      }
      pos = [i.x, i.y];
    } else if (i.type === 'Z') {
      if (cur) {
        const last = cur[cur.length - 1];
        if (Math.hypot(last[0] - start[0], last[1] - start[1]) > 1e-6) cur.push(start);
      }
      flush(true);
      pos = start;
    }
  }
  flush(false);
  if (FLAT_CACHE.size > 2000) FLAT_CACHE.clear();
  FLAT_CACHE.set(d, polys);
  return polys;
};

/* ------------------------------------------------------------------------------------------------
 * Tracks: arc-length parametrised polylines
 * ---------------------------------------------------------------------------------------------- */

export interface Track {
  pts: Pt[];
  /** Cumulative length at each point. */
  cum: number[];
  length: number;
  closed: boolean;
  /** Point, tangent angle (radians) at arc length s (clamped). */
  at: (s: number) => {x: number; y: number; angle: number};
}

const TRACK_CACHE = new Map<string, Track>();

export const trackFromPoints = (input: ReadonlyArray<Pt>, closed = false): Track => {
  const pts: Pt[] = [];
  for (const p of input) {
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(p[0] - last[0], p[1] - last[1]) > 1e-9) pts.push(p);
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const length = cum[cum.length - 1] ?? 0;
  const at = (sIn: number) => {
    if (pts.length === 0) return {x: 0, y: 0, angle: 0};
    if (pts.length === 1) return {x: pts[0][0], y: pts[0][1], angle: 0};
    const s = Math.max(0, Math.min(length, sIn));
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo];
    const t = seg > 0 ? (s - cum[lo]) / seg : 0;
    const a = pts[lo];
    const b = pts[hi];
    return {x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, angle: Math.atan2(b[1] - a[1], b[0] - a[0])};
  };
  return {pts, cum, length, closed, at};
};

/**
 * A track along an SVG path string (first subpath) or a polyline.
 * Polylines get rounded bends (radius `bend`, default 8) so the track matches routePath(points).
 */
export const makeTrack = (path: string | ReadonlyArray<Pt>, bend = 8): Track => {
  const d = typeof path === 'string' ? path : routePath(path, bend);
  const hit = TRACK_CACHE.get(d);
  if (hit) return hit;
  const polys = flattenPath(d);
  const first = polys[0] ?? {pts: [[0, 0]], closed: false};
  const t = trackFromPoints(first.pts, first.closed);
  if (TRACK_CACHE.size > 500) TRACK_CACHE.clear();
  TRACK_CACHE.set(d, t);
  return t;
};

/** Points every `spacing` px along a polyline (both ends included). */
export const resample = (pts: ReadonlyArray<Pt>, spacing: number, closed = false): Pt[] => {
  const src = closed && pts.length > 1 ? [...pts, pts[0]] : [...pts];
  const tr = trackFromPoints(src);
  if (tr.length === 0) return [...src];
  const n = Math.max(1, Math.round(tr.length / spacing));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const p = tr.at((tr.length * i) / n);
    out.push([p.x, p.y]);
  }
  if (closed) out.pop();
  return out;
};

/** The part of a polyline between arc lengths s0 and s1. */
export const slicePolyline = (pts: ReadonlyArray<Pt>, s0: number, s1: number): Pt[] => {
  const tr = trackFromPoints(pts);
  const a = Math.max(0, Math.min(tr.length, s0));
  const b = Math.max(a, Math.min(tr.length, s1));
  const out: Pt[] = [];
  const pa = tr.at(a);
  out.push([pa.x, pa.y]);
  for (let i = 0; i < tr.pts.length; i++) if (tr.cum[i] > a && tr.cum[i] < b) out.push(tr.pts[i]);
  const pb = tr.at(b);
  out.push([pb.x, pb.y]);
  return out;
};

/** Unit normals (left-hand side of travel) at each vertex, averaged at joints. */
export const vertexNormals = (pts: ReadonlyArray<Pt>, closed = false): Array<[number, number, number]> => {
  const n = pts.length;
  const out: Array<[number, number, number]> = [];
  const segN = (i: number, j: number): [number, number] => {
    const dx = pts[j][0] - pts[i][0];
    const dy = pts[j][1] - pts[i][1];
    const l = Math.hypot(dx, dy) || 1;
    return [-dy / l, dx / l];
  };
  for (let i = 0; i < n; i++) {
    const hasPrev = closed || i > 0;
    const hasNext = closed || i < n - 1;
    const prev = hasPrev ? segN((i - 1 + n) % n, i) : null;
    const next = hasNext ? segN(i, (i + 1) % n) : null;
    if (prev && next) {
      let nx = prev[0] + next[0];
      let ny = prev[1] + next[1];
      const l = Math.hypot(nx, ny);
      if (l < 1e-6) {
        out.push([next[0], next[1], 1]);
        continue;
      }
      nx /= l;
      ny /= l;
      // miter factor 1 / cos(half angle), capped
      const cos = nx * next[0] + ny * next[1];
      out.push([nx, ny, Math.min(2, 1 / Math.max(cos, 0.5))]);
    } else {
      const v = (prev ?? next) as [number, number];
      out.push([v[0], v[1], 1]);
    }
  }
  return out;
};

/** Offset a polyline sideways by `dist` (positive = left of travel). */
export const offsetPolyline = (pts: ReadonlyArray<Pt>, dist: number, closed = false): Pt[] => {
  const ns = vertexNormals(pts, closed);
  return pts.map((p, i) => [p[0] + ns[i][0] * dist * ns[i][2], p[1] + ns[i][1] * dist * ns[i][2]] as Pt);
};

/** Total length of a path (all subpaths). */
export const pathLength = (d: string): number =>
  flattenPath(d).reduce((acc, p) => acc + trackFromPoints(p.pts).length, 0);

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
export const dist = (a: Pt, b: Pt): number => Math.hypot(b[0] - a[0], b[1] - a[1]);
