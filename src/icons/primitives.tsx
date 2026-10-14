/**
 * Signal Atlas icon primitives (ICONS.md §3.6). Every hardware icon is built from these, so stroke, corner, light and
 * state language stay identical across the library.
 *
 *   draw order inside an icon: Raised (2.5D side) → TopFace (material fill) → Detail group (opacity `detail`)
 *   → RimLight → Glow → Outline → Pip.
 *
 * Geometry is WORLD px; every stroke is a SCREEN px token divided by `zoom` (`sw`), so lines keep their on-screen
 * weight at any camera zoom. Pure functions of props: no frame reads, no randomness, no filters, gradients or blur.
 * In `fillsOnly` mode (label knockout) every primitive except Raised and TopFace returns null (via IconEnv context).
 */
import React, {createContext, useContext} from 'react';
import {
  ALPHA,
  COLOR,
  DETAIL,
  EASE_BEZIER,
  GLYPH2,
  RIM,
  STROKE,
  type EaseName,
  type PartState,
} from '../engine/tokens';
import {circlePath, flattenPath, polyPath, rectPath} from '../shared/geom';
import type {IconBaseProps, Ports, Pt} from './types';

export type Vec = readonly [number, number];
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/* ------------------------------------------------------------------------------------------------
 * Numbers, colour, easing
 * ---------------------------------------------------------------------------------------------- */

/** Path-number formatting (2 decimals). */
export const fx = (n: number): string => (Math.round(n * 100) / 100).toString();
export const clamp01 = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t);
export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Stroke width in world units for a screen-px token. */
export const sw = (px: number, zoom: number): number => px / Math.max(zoom, 1e-6);

const hex2rgb = (h: string): [number, number, number] => {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.replace(/(.)/g, '$1$1') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgb2hex = (r: number, g: number, b: number): string =>
  '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();

/** sRGB mix of two hex colours (flat composite, the way a half-transparent fill would land). */
export const mix = (a: string, b: string, t: number): string => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t));
};

/** Cubic-bezier easing (CSS semantics), Newton + bisection. */
export const cubicBezier = (x1: number, y1: number, x2: number, y2: number) => {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const X = (t: number) => ((ax * t + bx) * t + cx) * t;
  const Y = (t: number) => ((ay * t + by) * t + cy) * t;
  const dX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = X(t) - x;
      if (Math.abs(e) < 1e-6) return Y(t);
      const d = dX(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = X(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return Y(t);
  };
};

const EASE_CACHE = new Map<EaseName, (t: number) => number>();
export const ease = (name: EaseName): ((t: number) => number) => {
  let fn = EASE_CACHE.get(name);
  if (!fn) {
    const [a, b, c, d] = EASE_BEZIER[name];
    fn = cubicBezier(a, b, c, d);
    EASE_CACHE.set(name, fn);
  }
  return fn;
};

/** 0 → 1 over [at, at + dur] with an ease (dur <= 0 is a step). */
export const prog = (frame: number, at: number, dur: number, e: EaseName = 'arrive'): number => {
  if (dur <= 0) return frame >= at ? 1 : 0;
  return ease(e)(clamp01((frame - at) / dur));
};

/** Always-on pip breathing: 1.0 → 0.7 → 1.0 over 60 frames, phase-locked to f0. */
export const breathe = (frame: number): number => {
  const k = (1 - Math.cos((2 * Math.PI * frame) / GLYPH2.breathePeriod)) / 2;
  return 1 - (1 - GLYPH2.breatheMin) * k;
};

/** Detail opacity from the icon's shorter on-screen side (tokens DETAIL; plates and Lens views pass bias 1.15). */
export const detailOf = (minSidePx: number, bias = 1): number =>
  clamp01((minSidePx * bias - DETAIL.fadeFrom) / (DETAIL.fadeTo - DETAIL.fadeFrom));

/* ------------------------------------------------------------------------------------------------
 * Path builders (world px)
 * ---------------------------------------------------------------------------------------------- */

export const rectD = (r: Rect, radius = 0): string => rectPath(r.x, r.y, r.w, r.h, radius);
export const discD = (cx: number, cy: number, r: number): string => circlePath(cx, cy, r);
export const lineD = (x1: number, y1: number, x2: number, y2: number): string => `M${fx(x1)} ${fx(y1)}L${fx(x2)} ${fx(y2)}`;
export const polyD = (pts: ReadonlyArray<Pt>, closed = true): string => polyPath(pts, closed);

/** Point on a circle; angle in degrees, 0 = +x (3 o'clock), clockwise positive (SVG y-down). */
export const polar = (cx: number, cy: number, r: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/** Open arc from a0 to a1 degrees (clockwise when a1 > a0). */
export const arcD = (cx: number, cy: number, r: number, a0: number, a1: number): string => {
  const span = a1 - a0;
  if (Math.abs(span) >= 359.99) return circlePath(cx, cy, r);
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  const large = Math.abs(span) > 180 ? 1 : 0;
  const sweep = span > 0 ? 1 : 0;
  return `M${fx(p0[0])} ${fx(p0[1])}A${fx(r)} ${fx(r)} 0 ${large} ${sweep} ${fx(p1[0])} ${fx(p1[1])}`;
};

/** Annulus (ring) as one even-odd path: use with fillRule="evenodd". */
export const ringD = (cx: number, cy: number, rOuter: number, rInner: number): string =>
  circlePath(cx, cy, rOuter) + circlePath(cx, cy, rInner);

/**
 * Rounded rectangle with rectangular notches cut into its left and right edges (the LGA1700 heat-spreader
 * silhouette). `notches` are centre y values (absolute); each notch is `depth` deep and `len` tall, corner radius
 * `nr`. Clockwise from the top-left.
 */
export const notchedRectD = (r: Rect, radius: number, notchYs: number[], depth: number, len: number, nr = 2): string => {
  const {x, y, w, h} = r;
  const R = Math.min(radius, w / 2, h / 2);
  const ys = [...notchYs].sort((a, b) => a - b);
  let d = `M${fx(x + R)} ${fx(y)}H${fx(x + w - R)}A${fx(R)} ${fx(R)} 0 0 1 ${fx(x + w)} ${fx(y + R)}`;
  // right edge, top → bottom
  for (const ny of ys) {
    const a = ny - len / 2;
    const b = ny + len / 2;
    d +=
      `V${fx(a - nr)}A${fx(nr)} ${fx(nr)} 0 0 1 ${fx(x + w - nr)} ${fx(a)}H${fx(x + w - depth + nr)}` +
      `A${fx(nr)} ${fx(nr)} 0 0 0 ${fx(x + w - depth)} ${fx(a + nr)}V${fx(b - nr)}` +
      `A${fx(nr)} ${fx(nr)} 0 0 0 ${fx(x + w - depth + nr)} ${fx(b)}H${fx(x + w - nr)}A${fx(nr)} ${fx(nr)} 0 0 1 ${fx(x + w)} ${fx(b + nr)}`;
  }
  d += `V${fx(y + h - R)}A${fx(R)} ${fx(R)} 0 0 1 ${fx(x + w - R)} ${fx(y + h)}H${fx(x + R)}A${fx(R)} ${fx(R)} 0 0 1 ${fx(x)} ${fx(y + h - R)}`;
  // left edge, bottom → top
  for (const ny of [...ys].reverse()) {
    const a = ny + len / 2;
    const b = ny - len / 2;
    d +=
      `V${fx(a + nr)}A${fx(nr)} ${fx(nr)} 0 0 1 ${fx(x + nr)} ${fx(a)}H${fx(x + depth - nr)}` +
      `A${fx(nr)} ${fx(nr)} 0 0 0 ${fx(x + depth)} ${fx(a - nr)}V${fx(b + nr)}` +
      `A${fx(nr)} ${fx(nr)} 0 0 0 ${fx(x + depth - nr)} ${fx(b)}H${fx(x + nr)}A${fx(nr)} ${fx(nr)} 0 0 1 ${fx(x)} ${fx(b - nr)}`;
  }
  d += `V${fx(y + R)}A${fx(R)} ${fx(R)} 0 0 1 ${fx(x + R)} ${fx(y)}Z`;
  return d;
};

/* ------------------------------------------------------------------------------------------------
 * 2.5D sides
 * ---------------------------------------------------------------------------------------------- */

const isZero = (v?: Vec): boolean => !v || (Math.abs(v[0]) < 1e-4 && Math.abs(v[1]) < 1e-4);
export const scaleVec = (v: Vec | undefined, k: number): Vec => (v ? [v[0] * k, v[1] * k] : [0, 0]);

const cross = (o: Pt, a: Pt, b: Pt): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Convex hull (Andrew), returned clockwise in SVG's y-down space. */
export const convexHull = (input: ReadonlyArray<Pt>): Pt[] => {
  const pts = [...input].sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (pts.length < 3) return pts;
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
  // Andrew's chain is counter-clockwise in y-up maths, i.e. clockwise on screen (y-down).
  return lower.concat(upper);
};

/**
 * The 2.5D side of a rounded rectangle: the convex hull of the top face and its copy translated by `side`
 * (exact: hull of the 8 corner centres, offset by the radius with arcs). Clockwise.
 */
export const raisedHullPath = (r: Rect, radius: number, side: Vec): string => {
  const R = Math.max(0, Math.min(radius, r.w / 2, r.h / 2));
  if (isZero(side)) return rectPath(r.x, r.y, r.w, r.h, R);
  const cs: Pt[] = [
    [r.x + R, r.y + R],
    [r.x + r.w - R, r.y + R],
    [r.x + r.w - R, r.y + r.h - R],
    [r.x + R, r.y + r.h - R],
  ];
  const all: Pt[] = [...cs, ...cs.map((c) => [c[0] + side[0], c[1] + side[1]] as Pt)];
  const hull = convexHull(all);
  if (R < 1e-6) return polyPath(hull, true);
  const n = hull.length;
  const normal = (a: Pt, b: Pt): Pt => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    return [dy / l, -dx / l];
  };
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = hull[i];
    const b = hull[(i + 1) % n];
    const c = hull[(i + 2) % n];
    const n1 = normal(a, b);
    const n2 = normal(b, c);
    const s: Pt = [a[0] + n1[0] * R, a[1] + n1[1] * R];
    const e: Pt = [b[0] + n1[0] * R, b[1] + n1[1] * R];
    const e2: Pt = [b[0] + n2[0] * R, b[1] + n2[1] * R];
    if (i === 0) d += `M${fx(s[0])} ${fx(s[1])}`;
    d += `L${fx(e[0])} ${fx(e[1])}A${fx(R)} ${fx(R)} 0 0 1 ${fx(e2[0])} ${fx(e2[1])}`;
  }
  return d + 'Z';
};

/** The 2.5D side of a disc: a capsule along `side`. */
export const discHullPath = (cx: number, cy: number, r: number, side: Vec): string =>
  raisedHullPath({x: cx - r, y: cy - r, w: 2 * r, h: 2 * r}, r, side);

const signedArea = (pts: ReadonlyArray<Pt>): number => {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
};
const oriented = (pts: Pt[]): Pt[] => (signedArea(pts) < 0 ? [...pts].reverse() : pts);

/**
 * The 2.5D side of ANY silhouette (notched, concave): the region swept by the outline translated by 0..side.
 * Built as the translated copy plus one quad per edge, all wound the same way, so nonzero fill unions them.
 */
export const sweptPath = (d: string, side: Vec): string => {
  if (isZero(side)) return '';
  const polys = flattenPath(d);
  let out = '';
  for (const poly of polys) {
    const pts = poly.pts;
    if (pts.length < 2) continue;
    const moved = pts.map((p) => [p[0] + side[0], p[1] + side[1]] as Pt);
    out += polyPath(oriented(moved), true);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 1e-6) continue;
      out += polyPath(oriented([a, b, moved[i + 1], moved[i]]), true);
    }
  }
  return out;
};

/* ------------------------------------------------------------------------------------------------
 * State looks and flips (ICONS.md §3.1–3.2, STYLE_BIBLE §6.6)
 * ---------------------------------------------------------------------------------------------- */

export type PipKind = 'hollow' | 'filled' | 'breathing' | 'visited' | 'reset' | 'waiting' | 'limit' | 'fault';
export interface StateLook {
  stroke: string;
  width: number;
  /** The active region takes activeFill. */
  active: boolean;
  pip: PipKind;
  /** Alert hatch over the active region. */
  hatch: boolean;
}

export const STATE_LOOK: Record<PartState, StateLook> = {
  off: {stroke: COLOR.structure, width: STROKE.part, active: false, pip: 'hollow', hatch: false},
  on: {stroke: COLOR.ink, width: STROKE.active, active: true, pip: 'filled', hatch: false},
  alwaysOn: {stroke: COLOR.ink, width: STROKE.active, active: true, pip: 'breathing', hatch: false},
  visited: {stroke: COLOR.annotation, width: GLYPH2.visitedStroke, active: false, pip: 'visited', hatch: false},
  reset: {stroke: COLOR.ink, width: STROKE.active, active: true, pip: 'reset', hatch: false},
  waiting: {stroke: COLOR.ink, width: STROKE.part, active: false, pip: 'waiting', hatch: false},
  limit: {stroke: COLOR.ink, width: STROKE.active, active: true, pip: 'limit', hatch: true},
  fault: {stroke: COLOR.structure, width: STROKE.part, active: false, pip: 'fault', hatch: true},
};

/** Flip progress for one channel: 0 outline (frames 0–3), 1 fill (1–4), 2 pip (2–5). 1 when no flip. */
export const flipT = (frame: number, flip: {from: PartState; at: number} | undefined, phase: 0 | 1 | 2): number =>
  flip ? ease('arrive')(clamp01((frame - flip.at - phase) / 3)) : 1;

const strokeOf = (look: StateLook, pointed: number): string =>
  look.stroke === COLOR.structure && pointed > 0 ? mix(COLOR.structure, COLOR.textMuted, clamp01(pointed)) : look.stroke;

/** Outline colour and width (screen px) for a state, through a flip, with the "pointed at" tone step. */
export const outlineLook = (
  state: PartState,
  flip: {from: PartState; at: number} | undefined,
  frame: number,
  pointed = 0,
): {color: string; width: number} => {
  const to = STATE_LOOK[state];
  if (!flip) return {color: strokeOf(to, pointed), width: to.width};
  const from = STATE_LOOK[flip.from];
  const t = flipT(frame, flip, 0);
  return {color: mix(strokeOf(from, pointed), strokeOf(to, pointed), t), width: lerp(from.width, to.width, t)};
};

/** Fill of the part's active region through a flip (material when unpowered, activeFill when powered). */
export const activeFillOf = (
  state: PartState,
  flip: {from: PartState; at: number} | undefined,
  frame: number,
  material: string,
): string => {
  const f1 = STATE_LOOK[state].active ? COLOR.activeFill : material;
  if (!flip) return f1;
  const f0 = STATE_LOOK[flip.from].active ? COLOR.activeFill : material;
  return mix(f0, f1, flipT(frame, flip, 1));
};

/** 0..1: how "powered" the part reads now (active fill weight), through a flip. */
export const poweredOf = (state: PartState, flip: {from: PartState; at: number} | undefined, frame: number): number => {
  const a1 = STATE_LOOK[state].active ? 1 : 0;
  if (!flip) return a1;
  const a0 = STATE_LOOK[flip.from].active ? 1 : 0;
  return lerp(a0, a1, flipT(frame, flip, 1));
};

/* ------------------------------------------------------------------------------------------------
 * Icon environment (fillsOnly), the resolved base and the shell
 * ---------------------------------------------------------------------------------------------- */

export interface IconEnv {
  fillsOnly: boolean;
}
const IconEnvCtx = createContext<IconEnv>({fillsOnly: false});
export const useIconEnv = (): IconEnv => useContext(IconEnvCtx);

/** Everything an icon needs, with defaults applied. */
export interface Base {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zoom: number;
  frame: number;
  state: PartState;
  flip?: {from: PartState; at: number};
  detail: number;
  fo: boolean;
  side: Vec;
  pointed: number;
  glow: number;
  pip: IconBaseProps['pip'];
  opacity: number;
  passive: boolean;
  /** Screen px → world px at this zoom. */
  s: (px: number) => number;
  rect: Rect;
  outline: {color: string; width: number};
  /** Resolve the active-region fill for a material. */
  act: (material: string) => string;
  /** Inner element side: the part's side scaled by k (relative height of the inner raise). */
  sideK: (k: number) => Vec;
}

export const resolveBase = (p: IconBaseProps, passive: boolean): Base => {
  const zoom = p.zoom > 0 ? p.zoom : 1;
  const state: PartState = passive ? 'off' : p.state ?? 'off';
  const flip = passive ? undefined : p.flip;
  const pointed = clamp01(p.pointed ?? 0);
  const side: Vec = p.side ?? [0, 0];
  const glow = p.glow === true ? ALPHA.glow : typeof p.glow === 'number' ? clamp01(p.glow) : 0;
  return {
    id: p.id,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    zoom,
    frame: p.frame,
    state,
    flip,
    detail: clamp01(p.detail ?? 1),
    fo: !!p.fillsOnly,
    side,
    pointed,
    glow,
    pip: passive ? false : p.pip === undefined ? 'top-right' : p.pip,
    opacity: clamp01(p.opacity ?? 1),
    passive,
    s: (px: number) => px / zoom,
    rect: {x: p.x, y: p.y, w: p.w, h: p.h},
    outline: outlineLook(state, flip, p.frame, pointed),
    act: (material: string) => activeFillOf(state, flip, p.frame, material),
    sideK: (k: number) => [side[0] * k, side[1] * k],
  };
};

/** Wraps an icon: whole-icon opacity and the fillsOnly environment for the primitives. */
export const Shell: React.FC<{b: Base; children: React.ReactNode}> = ({b, children}) => {
  if (b.opacity <= 0) return null;
  return (
    <IconEnvCtx.Provider value={{fillsOnly: b.fo}}>
      <g opacity={b.opacity < 1 ? b.opacity : undefined}>{children}</g>
    </IconEnvCtx.Provider>
  );
};

/** The interior detail group (§3.3): drawn at opacity `detail`; skipped at 0 and in fillsOnly mode. */
export const DetailGroup: React.FC<{b: Base; children: React.ReactNode}> = ({b, children}) => {
  if (b.fo || b.detail <= 0.001) return null;
  return <g opacity={b.detail < 1 ? b.detail : undefined}>{children}</g>;
};

/** Strokes and marks that are base (identity) but not fills: hidden in fillsOnly mode. */
export const Lines: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly) return null;
  return <>{children}</>;
};

/* ------------------------------------------------------------------------------------------------
 * The primitives of ICONS.md §3.6
 * ---------------------------------------------------------------------------------------------- */

/** Side fill under the top face: `hull` if given, else the swept region of `d` along `side`. */
export const Raised: React.FC<{d: string; side?: Vec; hull?: string; color?: string}> = ({d, side, hull, color}) => {
  const path = hull ?? (side ? sweptPath(d, side) : '');
  if (!path) return null;
  return <path d={path} fill={color ?? COLOR.side} />;
};

export const TopFace: React.FC<{d: string; fill: string; fillRule?: 'nonzero' | 'evenodd'}> = ({d, fill, fillRule}) => (
  <path d={d} fill={fill} fillRule={fillRule} />
);

/** Inset of the rim line's centre from the silhouette, screen px: it sits just inside the (thickest) outline. */
export const RIM_INSET = STROKE.active / 2 + RIM.width / 2;

/** The rim path of a rounded rect: left edge (bottom → top), top-left corner, top edge. World px. */
export const rimRectD = (rect: Rect, radius: number, inset: number): string => {
  const x = rect.x + inset;
  const y = rect.y + inset;
  const w = rect.w - 2 * inset;
  const h = rect.h - 2 * inset;
  if (w <= 0 || h <= 0) return '';
  const r = Math.max(0, Math.min(radius - inset, w / 2, h / 2));
  return `M${fx(x)} ${fx(y + h - r)}V${fx(y + r)}${r > 0 ? `A${fx(r)} ${fx(r)} 0 0 1 ${fx(x + r)} ${fx(y)}` : ''}H${fx(x + w - r)}`;
};

/** Rim light: 2 px `rim` at 30% on the top and left edges of a raised top face (material, never power). */
export const RimLight: React.FC<{rect: Rect; radius: number; zoom: number; inset?: number; opacity?: number}> = ({
  rect,
  radius,
  zoom,
  inset,
  opacity,
}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly) return null;
  const d = rimRectD(rect, radius, inset ?? sw(RIM_INSET, zoom));
  if (!d) return null;
  return (
    <path d={d} fill="none" stroke={COLOR.rim} strokeOpacity={RIM.opacity * (opacity ?? 1)} strokeWidth={sw(RIM.width, zoom)} strokeLinecap="butt" />
  );
};

/** Rim light along an arbitrary open path (already inset by the caller). */
export const RimPath: React.FC<{d: string; zoom: number; opacity?: number}> = ({d, zoom, opacity}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly || !d) return null;
  return (
    <path d={d} fill="none" stroke={COLOR.rim} strokeOpacity={RIM.opacity * (opacity ?? 1)} strokeWidth={sw(RIM.width, zoom)} strokeLinecap="butt" strokeLinejoin="round" />
  );
};

/** Rim light on a disc: the arc facing the top-left key light (8 o'clock → 1 o'clock). */
export const RimArc: React.FC<{cx: number; cy: number; r: number; zoom: number; inset?: number; opacity?: number}> = ({
  cx,
  cy,
  r,
  zoom,
  inset,
  opacity,
}) => {
  const rr = r - (inset ?? sw(RIM_INSET, zoom));
  if (rr <= 0) return null;
  return <RimPath d={arcD(cx, cy, rr, 150, 300)} zoom={zoom} opacity={opacity} />;
};

/** Outline: 3 px structure (off), 4 px ink (on), 3 px annotation (visited); pointed → textMuted. */
export const Outline: React.FC<{
  d: string;
  state: PartState;
  zoom: number;
  pointed?: number;
  flip?: {from: PartState; at: number};
  frame: number;
  /** Overrides (e.g. passive parts with a different stroke token). */
  color?: string;
  width?: number;
}> = ({d, state, zoom, pointed, flip, frame, color, width}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly) return null;
  const look = outlineLook(state, flip, frame, pointed ?? 0);
  return (
    <path
      d={d}
      fill="none"
      stroke={color ?? look.color}
      strokeWidth={sw(width ?? look.width, zoom)}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
};

/** The faked glow: the outline again at 3x the active width, `ink` at `alpha` (0 = off). Drawn under the outline. */
export const Glow: React.FC<{d: string; zoom: number; alpha?: number; on?: boolean; width?: number}> = ({d, zoom, alpha, on, width}) => {
  const {fillsOnly} = useIconEnv();
  const a = alpha ?? (on ? ALPHA.glow : 0);
  if (fillsOnly || a <= 0) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={COLOR.ink}
      strokeOpacity={a}
      strokeWidth={sw((width ?? STROKE.active) * 3, zoom)}
      strokeLinejoin="round"
    />
  );
};

/** Interior detail line (2 px `detail`) or small detail fill. Never carries meaning. */
export const Detail: React.FC<{d: string; zoom: number; fill?: boolean; opacity?: number; color?: string; width?: number; cap?: 'butt' | 'round'}> = ({
  d,
  zoom,
  fill,
  opacity,
  color,
  width,
  cap,
}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly) return null;
  const c = color ?? COLOR.detail;
  return fill ? (
    <path d={d} fill={c} opacity={opacity} />
  ) : (
    <path d={d} fill="none" stroke={c} strokeWidth={sw(width ?? STROKE.detail, zoom)} opacity={opacity} strokeLinecap={cap ?? 'round'} strokeLinejoin="round" />
  );
};

/** A base (identity) line in a given colour and screen width. Hidden in fillsOnly mode. */
export const Stroke: React.FC<{
  d: string;
  zoom: number;
  color?: string;
  width?: number;
  opacity?: number;
  cap?: 'butt' | 'round' | 'square';
  dash?: readonly number[];
  dashOffset?: number;
}> = ({d, zoom, color, width, opacity, cap, dash, dashOffset}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly || !d) return null;
  return (
    <path
      d={d}
      fill="none"
      stroke={color ?? COLOR.structure}
      strokeWidth={sw(width ?? STROKE.detail, zoom)}
      strokeOpacity={opacity}
      strokeLinecap={cap ?? 'round'}
      strokeLinejoin="round"
      strokeDasharray={dash ? dash.map((v) => fx(sw(v, zoom))).join(' ') : undefined}
      strokeDashoffset={dashOffset !== undefined ? fx(sw(dashOffset, zoom)) : undefined}
    />
  );
};

/* ------------------------------------------------------------------------------------------------
 * Pip (state glyph docked to the part, screen-constant)
 * ---------------------------------------------------------------------------------------------- */

export type PipDock = Exclude<IconBaseProps['pip'], false | undefined>;

/** Centre of a docked square glyph of `sizePx` (screen px) at a part rect, in world px. */
export const dockCenter = (rect: Rect, dock: PipDock, zoom: number, sizePx: number = GLYPH2.pip): Pt => {
  const s = sizePx / zoom;
  const g = GLYPH2.pipDock / zoom;
  switch (dock) {
    case 'top-left':
      return [rect.x - g - s / 2, rect.y - g - s / 2];
    case 'inside-top-right':
      return [rect.x + rect.w - g - s / 2, rect.y + g + s / 2];
    case 'inside-top-left':
      return [rect.x + g + s / 2, rect.y + g + s / 2];
    case 'top-right':
    default:
      return [rect.x + rect.w + g + s / 2, rect.y - g - s / 2];
  }
};

const sq = (cx: number, cy: number, size: number, r = 0): string => rectPath(cx - size / 2, cy - size / 2, size, size, r);

/** One pip / badge shape in SCREEN px centred on (0, 0). */
export const PipShape: React.FC<{kind: PipKind; frame: number; opacity?: number; ground?: string}> = ({kind, frame, opacity = 1, ground}) => {
  const P = GLYPH2.pip;
  const st = GLYPH2.pipStroke;
  if (opacity <= 0) return null;
  switch (kind) {
    case 'hollow':
    case 'visited':
      return (
        <path
          d={sq(0, 0, P - st, 1)}
          fill="none"
          stroke={kind === 'visited' ? COLOR.annotation : COLOR.structure}
          strokeWidth={st}
          opacity={opacity}
        />
      );
    case 'filled':
      return <path d={sq(0, 0, P, 1.5)} fill={COLOR.ink} opacity={opacity} />;
    case 'breathing':
      return <path d={sq(0, 0, P, 1.5)} fill={COLOR.ink} opacity={opacity * breathe(frame)} />;
    case 'reset': {
      const o = (P / 2 + 6) * Math.SQRT1_2;
      const bar = lineD(-o, o, o, -o);
      return (
        <g opacity={opacity}>
          <path d={sq(0, 0, P, 1.5)} fill={COLOR.ink} />
          <path d={bar} stroke={ground ?? COLOR.side} strokeWidth={2 + 3} strokeLinecap="butt" />
          <path d={bar} stroke={COLOR.ink} strokeWidth={2} strokeLinecap="butt" />
        </g>
      );
    }
    case 'waiting':
    case 'limit':
    case 'fault':
      return <BadgeShape kind={kind} opacity={opacity} />;
    default:
      return null;
  }
};

/** The 28 px state badge (‖ waiting in ink; ! limit and × fault in alert), SCREEN px centred on (0, 0). */
export const BadgeShape: React.FC<{kind: 'waiting' | 'limit' | 'fault'; opacity?: number; scale?: number}> = ({kind, opacity = 1, scale = 1}) => {
  const B = GLYPH2.badge * scale;
  const k = scale;
  const alert = kind !== 'waiting';
  const col = alert ? COLOR.alert : COLOR.ink;
  return (
    <g opacity={opacity}>
      <path d={sq(0, 0, B - 3 * k, 6 * k)} fill={COLOR.deck} stroke={alert ? COLOR.alert : COLOR.structure} strokeWidth={3 * k} />
      {kind === 'waiting' ? (
        <path d={`${lineD(-3.5 * k, -6.5 * k, -3.5 * k, 6.5 * k)}${lineD(3.5 * k, -6.5 * k, 3.5 * k, 6.5 * k)}`} stroke={col} strokeWidth={3 * k} strokeLinecap="round" />
      ) : kind === 'limit' ? (
        <>
          <path d={lineD(0, -7 * k, 0, 2.5 * k)} stroke={col} strokeWidth={3.2 * k} strokeLinecap="round" />
          <path d={sq(0, 6.6 * k, 3.4 * k, 0.8 * k)} fill={col} />
        </>
      ) : (
        <path d={`${lineD(-5 * k, -5 * k, 5 * k, 5 * k)}${lineD(-5 * k, 5 * k, 5 * k, -5 * k)}`} stroke={col} strokeWidth={3 * k} strokeLinecap="round" />
      )}
    </g>
  );
};

/** A screen-constant glyph placed at a world point: children are drawn in SCREEN px around (0, 0). */
export const AtScreen: React.FC<{x: number; y: number; zoom: number; scale?: number; children: React.ReactNode}> = ({x, y, zoom, scale, children}) => (
  <g transform={`translate(${fx(x)} ${fx(y)}) scale(${(Math.round(((scale ?? 1) / zoom) * 100000) / 100000).toString()})`}>{children}</g>
);

/** State pip docked to the part (§3.1 step 7), with the 5-frame flip's pip channel (frames 2–5). */
export const Pip: React.FC<{
  rect: Rect;
  dock: IconBaseProps['pip'];
  state: PartState;
  zoom: number;
  frame: number;
  flip?: {from: PartState; at: number};
}> = ({rect, dock, state, zoom, frame, flip}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly || !dock) return null;
  const kindTo = STATE_LOOK[state].pip;
  const isBadge = (k: PipKind) => k === 'waiting' || k === 'limit' || k === 'fault';
  const t = flipT(frame, flip, 2);
  const kindFrom = flip ? STATE_LOOK[flip.from].pip : kindTo;
  const draw = (kind: PipKind, op: number) => {
    const c = dockCenter(rect, dock, zoom, isBadge(kind) ? GLYPH2.badge : GLYPH2.pip);
    return (
      <AtScreen key={kind + op} x={c[0]} y={c[1]} zoom={zoom}>
        <PipShape kind={kind} frame={frame} opacity={op} />
      </AtScreen>
    );
  };
  if (!flip || t >= 1 || kindFrom === kindTo) return draw(kindTo, 1);
  return (
    <>
      {draw(kindFrom, 1 - t)}
      {draw(kindTo, t)}
    </>
  );
};

/** 45° alert hatch (2 px, 10 px pitch, screen px) clipped to `clipD`. */
export const Hatch: React.FC<{id: string; clipD: string; rect: Rect; zoom: number; color?: string; opacity?: number}> = ({
  id,
  clipD,
  rect,
  zoom,
  color,
  opacity,
}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly || (opacity ?? 1) <= 0) return null;
  const pitch = sw(STROKE.hatchPitch, zoom) * Math.SQRT2;
  let d = '';
  const x0 = rect.x - rect.h;
  for (let x = x0; x <= rect.x + rect.w; x += pitch) d += lineD(x, rect.y + rect.h, x + rect.h, rect.y);
  const cid = `${id}-hatch`;
  return (
    <g opacity={opacity}>
      <defs>
        <clipPath id={cid}>
          <path d={clipD} />
        </clipPath>
      </defs>
      <path d={d} clipPath={`url(#${cid})`} stroke={color ?? COLOR.alertHatch} strokeWidth={sw(STROKE.hatch, zoom)} />
    </g>
  );
};

/** Alert hatch for limit/fault states (fades with the flip's fill channel). */
export const StateHatch: React.FC<{b: Base; clipD: string; rect?: Rect}> = ({b, clipD, rect}) => {
  const to = STATE_LOOK[b.state].hatch ? 1 : 0;
  const from = b.flip ? (STATE_LOOK[b.flip.from].hatch ? 1 : 0) : to;
  const a = lerp(from, to, flipT(b.frame, b.flip, 1));
  if (a <= 0) return null;
  return <Hatch id={b.id} clipD={clipD} rect={rect ?? b.rect} zoom={b.zoom} opacity={a} />;
};

/* ------------------------------------------------------------------------------------------------
 * Recesses (holes, slots, port openings): light from the top-left, so a recess shows a dark wall band on its
 * top and left inside edges and a slightly lighter floor shifted toward the bottom-right.
 * ---------------------------------------------------------------------------------------------- */

/** A rectangular recess. `depth` in world px (the floor shift); `floor` is the visible floor colour. */
export const Recess: React.FC<{
  id: string;
  rect: Rect;
  radius?: number;
  depth: Vec;
  wall?: string;
  floor?: string;
  rim?: string;
  zoom: number;
  rimWidth?: number;
}> = ({id, rect, radius = 0, depth, wall, floor, rim, zoom, rimWidth}) => {
  const d = rectD(rect, radius);
  const floorRect = {x: rect.x + depth[0], y: rect.y + depth[1], w: rect.w, h: rect.h};
  const cid = `${id}-rc`;
  return (
    <g>
      <path d={d} fill={wall ?? COLOR.side} />
      {floor ? (
        <>
          <defs>
            <clipPath id={cid}>
              <path d={d} />
            </clipPath>
          </defs>
          <path d={rectD(floorRect, radius)} fill={floor} clipPath={`url(#${cid})`} />
        </>
      ) : null}
      {rim ? <Stroke d={d} zoom={zoom} color={rim} width={rimWidth ?? STROKE.detail} /> : null}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Ports
 * ---------------------------------------------------------------------------------------------- */

/** The nine standard anchor points of a footprint (+ the pip centre for non-passive parts). */
export const basePorts = (p: IconBaseProps, passive: boolean): Ports => {
  const {x, y, w, h} = p;
  const ports: Ports = {
    center: [x + w / 2, y + h / 2],
    topLeft: [x, y],
    topRight: [x + w, y],
    bottomLeft: [x, y + h],
    bottomRight: [x + w, y + h],
    top: [x + w / 2, y],
    bottom: [x + w / 2, y + h],
    left: [x, y + h / 2],
    right: [x + w, y + h / 2],
  };
  if (!passive && p.pip !== false) ports.pip = dockCenter({x, y, w, h}, p.pip ?? 'top-right', p.zoom > 0 ? p.zoom : 1);
  return ports;
};

/** Point at fractions of a rect. */
export const at = (r: Rect, fxr: number, fyr: number): Pt => [r.x + r.w * fxr, r.y + r.h * fyr];
