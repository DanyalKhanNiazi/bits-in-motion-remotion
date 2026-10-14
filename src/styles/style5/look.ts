/**
 * Style 5 look: tones, stroke tokens and the panel "view" (camera) helpers.
 *
 * Polarity is fixed per panel: outside panels ("what you see") use the light set on a light plate; inside panels
 * (hardware, schematic) use the dark set on dark plates; the page (margins and gutters) is the dark surface.
 * Spot blacks (case front, screen, PSU rear) are dark ground: anything drawn on them uses dark-set tokens.
 *
 * Views: a panel camera is a uniform scale + translation in page space. Geometry is mapped through the view;
 * stroke widths are NOT scaled (line width = token ÷ panel scale), and text, pips, badges and the Bit are drawn
 * in page space at their brand sizes.
 */
import {THEMES, mixColor, rectPath, type Pt, type Theme} from '../../shared';

/**
 * Brightness fix (A5 floor, mean luma ≥ ~28/255): the three dark GROUNDS are lifted, same blue-grey hue, evenly
 * stepped (Rec.709 luma page 22.7 < inside 27.7 < schematic 32.8; stock 7.2 / 17.8 / 27.7). Every colour role
 * (cyan, amber, magenta, coral, ink, structure grey) is unchanged. Contrast on the lightest ground (#1B2130):
 * inactive #626C81 3.05:1, textMuted 5.2:1, annotation 7.7:1, ink 14.3:1.
 */
export const D: Theme = {...THEMES.dark, surface: '#13171F', panel: '#171C27', board: '#1B2130'};
export const L: Theme = THEMES.light;

export const TONE = {
  page: D.surface, // #13171F margins and gutters (stock #05070F)
  plateIn: D.panel, // #171C27 inside-hardware plate (stock #0E121B)
  plateSchem: D.board, // #1B2130 schematic plate (stock #161C29)
  pcb: D.board, // #161C29 board region
  plateOut: '#FFFFFF', // outside, active
  plateOutHeld: '#F6F2EA', // outside, held
  spot: '#131A2A', // spot black: case front, monitor, PSU rear (= light-set ink)
  screen: '#0B1120', // the monitor's black screen inside its bezel (spot-black family)
  /** the one dark-set shadow tone (flat, offset, never blurred) */
  shadow: '#080A12',
  /** raised package tops (mix of board and structure, no new hue) */
  body: mixColor(D.board, D.structure, 0.1),
  /** recessed parts: sockets, slots, connector housings */
  recess: D.panel,
  /** the one light-set shadow tone */
  shadowL: '#E4E0D8',
  finger: '#737C8E',
  /** dark-set annotation on a spot-black ground */
  annoD: D.annotation,
  annoL: L.annotation,
} as const;

/** Stroke tokens (page px, never scaled). */
export const W = {
  inactive: 3,
  active: 4,
  detail: 2,
  rule: 3,
  rim: 4,
  route: 4,
  leader: 3,
} as const;

/* ------------------------------------------------------------------------------------------------ views */

export interface View {
  s: number;
  tx: number;
  ty: number;
}
export const ID: View = {s: 1, tx: 0, ty: 0};

export const vx = (v: View, x: number): number => v.tx + v.s * x;
export const vy = (v: View, y: number): number => v.ty + v.s * y;
export const vp = (v: View, p: Pt): Pt => [vx(v, p[0]), vy(v, p[1])];
export const vpts = (v: View, pts: ReadonlyArray<Pt>): Pt[] => pts.map((p) => vp(v, p));
/** Apply b, then a. */
export const compose = (a: View, b: View): View => ({s: a.s * b.s, tx: a.tx + a.s * b.tx, ty: a.ty + a.s * b.ty});
/** A view that maps box `src` onto box `dst` (uniform scale from the widths). */
export const fitView = (src: Box, dst: Box): View => {
  const s = dst.w / src.w;
  return {s, tx: dst.x - s * src.x, ty: dst.y - s * src.y};
};
/** Interpolate two views: scale in log space, the fixed point moving linearly. */
export const lerpView = (a: View, b: View, t: number): View => {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t);
  // interpolate the image of a reference point (the page centre) linearly, solve tx/ty from it
  const ref: Pt = [960, 540];
  const pa = vp(a, ref);
  const pb = vp(b, ref);
  const px = pa[0] + (pb[0] - pa[0]) * t;
  const py = pa[1] + (pb[1] - pa[1]) * t;
  return {s, tx: px - s * ref[0], ty: py - s * ref[1]};
};
/** Zoom about a fixed page point (focal) by k. */
export const zoomAbout = (focal: Pt, k: number): View => ({s: k, tx: focal[0] * (1 - k), ty: focal[1] * (1 - k)});

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const vbox = (v: View, b: Box): Box => ({x: vx(v, b.x), y: vy(v, b.y), w: b.w * v.s, h: b.h * v.s});
/** Rounded rect in model space, mapped (radius scales with the view, floored at 1 px). */
export const vrect = (v: View, x: number, y: number, w: number, h: number, r = 0): string =>
  rectPath(vx(v, x), vy(v, y), w * v.s, h * v.s, r > 0 ? Math.max(1, r * v.s) : 0);
export const boxPath = (b: Box, r = 0): string => rectPath(b.x, b.y, b.w, b.h, r);
export const inflate = (b: Box, d: number): Box => ({x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d});
export const lerpBox = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

const f2 = (n: number): string => (Math.round(n * 100) / 100).toString();
/** Polyline (no rounding) in page space. */
export const poly = (pts: ReadonlyArray<Pt>, closed = false): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${f2(p[0])} ${f2(p[1])}`).join('') + (closed ? 'Z' : '');
/** Circle path in page space. */
export const circ = (cx: number, cy: number, r: number): string =>
  `M${f2(cx - r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(cx + r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 0 ${f2(cx - r)} ${f2(cy)}Z`;
