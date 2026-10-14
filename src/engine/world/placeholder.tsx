/**
 * Engine placeholder icons: drawn with the "machined line" construction of ICONS.md §3 (2.5D side hull, material
 * top face, rim light, state outline with the 5-frame flip, glow, 14 px pip), plus the few identity features that
 * keep a world readable before the real library lands (the button's power symbol, the PSU's fan ring and inlet,
 * the CPU's heat spreader, a monitor's black screen, a chipset's die window and blocks). Interior detail is one
 * group at the `detail` opacity. These are stand-ins: the icon library (src/icons) replaces them via registerIcons.
 */
import React from 'react';
import {ALPHA, COLOR, GLYPH2, RIM, STROKE, type PartState} from '../tokens';
import {circlePath, rectPath, routePath} from '../../shared/geom';
import {mixColor} from '../../shared/brand';
import {breathe} from '../../shared/motion';
import {prog} from '../core/ease';
import {convexHull, f2} from '../core/math';
import type {Pt} from '../core/types';
import type {IconBaseProps, IconType, Ports} from './icons';

/** Stroke width in world units for a screen-px token. */
export const sw = (px: number, zoom: number): number => px / Math.max(1e-6, zoom);

type Mat = 'board' | 'deck' | 'bodyLo' | 'body' | 'bodyHi';
type Shape = 'rect' | 'circle' | 'cord' | 'button' | 'psu' | 'cpu' | 'package' | 'monitor' | 'plug' | 'card';

export interface PlaceholderDef {
  w: number;
  h: number;
  z: number;
  passive: boolean;
  mat: Mat;
  r: number;
  shape: Shape;
  /** Outline token for passive grounds (case: deckEdge 2 px). */
  edge?: {color: string; width: number};
}

const DEF: Partial<Record<IconType, PlaceholderDef>> = {
  board: {w: 840, h: 610, z: 2, passive: true, mat: 'board', r: 14, shape: 'rect'},
  case: {w: 1130, h: 816, z: 0, passive: true, mat: 'deck', r: 18, shape: 'rect', edge: {color: COLOR.deckEdge, width: 2}},
  cpuLga: {w: 260, h: 260, z: 10, passive: false, mat: 'bodyLo', r: 8, shape: 'cpu'},
  chipset: {w: 260, h: 190, z: 8, passive: false, mat: 'body', r: 10, shape: 'package'},
  logicBlock: {w: 72, h: 36, z: 3, passive: false, mat: 'body', r: 6, shape: 'rect'},
  dimm: {w: 14, h: 260, z: 10, passive: false, mat: 'bodyLo', r: 3, shape: 'rect'},
  m2: {w: 280, h: 34, z: 4, passive: false, mat: 'body', r: 4, shape: 'rect'},
  pcieSlot: {w: 410, h: 20, z: 6, passive: true, mat: 'bodyLo', r: 3, shape: 'rect'},
  spiFlash: {w: 46, h: 28, z: 4, passive: false, mat: 'body', r: 3, shape: 'rect'},
  vrmStandby: {w: 36, h: 26, z: 6, passive: true, mat: 'bodyHi', r: 3, shape: 'rect'},
  atx24: {w: 132, h: 26, z: 8, passive: true, mat: 'bodyLo', r: 3, shape: 'rect'},
  fpHeader: {w: 50, h: 24, z: 6, passive: true, mat: 'bodyLo', r: 3, shape: 'rect'},
  rearIo: {w: 38, h: 230, z: 10, passive: true, mat: 'bodyHi', r: 4, shape: 'rect'},
  rj45: {w: 26, h: 32, z: 12, passive: true, mat: 'bodyLo', r: 3, shape: 'rect'},
  lanChip: {w: 34, h: 26, z: 4, passive: false, mat: 'body', r: 3, shape: 'rect'},
  psu: {w: 480, h: 116, z: 22, passive: false, mat: 'body', r: 10, shape: 'psu'},
  iecPlug: {w: 36, h: 36, z: 8, passive: true, mat: 'bodyLo', r: 6, shape: 'plug'},
  cord: {w: 42, h: 8, z: 0, passive: true, mat: 'bodyLo', r: 0, shape: 'cord'},
  wallSocket: {w: 64, h: 64, z: 6, passive: true, mat: 'body', r: 8, shape: 'rect'},
  frontPanel: {w: 140, h: 116, z: 14, passive: true, mat: 'body', r: 10, shape: 'rect'},
  powerButton: {w: 72, h: 72, z: 6, passive: false, mat: 'bodyHi', r: 36, shape: 'button'},
  led: {w: 10, h: 10, z: 0, passive: false, mat: 'bodyLo', r: 5, shape: 'circle'},
  monitor: {w: 280, h: 170, z: 10, passive: false, mat: 'bodyHi', r: 10, shape: 'monitor'},
  amdPackage: {w: 260, h: 260, z: 10, passive: false, mat: 'body', r: 8, shape: 'package'},
  laptopBoard: {w: 600, h: 220, z: 2, passive: true, mat: 'board', r: 14, shape: 'rect'},
  socPackage: {w: 150, h: 150, z: 8, passive: false, mat: 'body', r: 10, shape: 'package'},
  ecChip: {w: 104, h: 72, z: 4, passive: false, mat: 'body', r: 6, shape: 'package'},
  battery: {w: 220, h: 120, z: 10, passive: false, mat: 'body', r: 10, shape: 'rect'},
  signInCard: {w: 240, h: 150, z: 0, passive: true, mat: 'deck', r: 12, shape: 'card'},
};

export const placeholderDef = (type: IconType): PlaceholderDef =>
  DEF[type] ?? {w: 120, h: 80, z: 6, passive: false, mat: 'body', r: 10, shape: 'rect'};

/* ------------------------------------------------------------------------------------------------
 * Geometry helpers
 * ---------------------------------------------------------------------------------------------- */

const cornerPts = (x: number, y: number, w: number, h: number, r: number): Pt[] => {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  if (rr === 0) return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  const out: Pt[] = [];
  const corners: Array<[number, number, number]> = [
    [x + w - rr, y + rr, -Math.PI / 2],
    [x + w - rr, y + h - rr, 0],
    [x + rr, y + h - rr, Math.PI / 2],
    [x + rr, y + rr, Math.PI],
  ];
  for (const [cx, cy, a0] of corners) {
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (k / 4) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
    }
  }
  return out;
};

const HULLS = new Map<string, string>();
/** The 2.5D side: the convex hull of the top face and its copy translated by `side`. */
export const raisedHullPath = (r: {x: number; y: number; w: number; h: number}, radius: number, side: readonly [number, number]): string => {
  const key = `${f2(r.x)},${f2(r.y)},${f2(r.w)},${f2(r.h)},${f2(radius)},${f2(side[0])},${f2(side[1])}`;
  const hit = HULLS.get(key);
  if (hit) return hit;
  const a = cornerPts(r.x, r.y, r.w, r.h, radius);
  const b = a.map((p) => [p[0] + side[0], p[1] + side[1]] as Pt);
  const hull = convexHull([...a, ...b]);
  const d = hull.map((p, i) => `${i === 0 ? 'M' : 'L'}${f2(p[0])} ${f2(p[1])}`).join('') + 'Z';
  if (HULLS.size > 4000) HULLS.clear();
  HULLS.set(key, d);
  return d;
};

/** Detail opacity from the shorter on-screen side (tokens DETAIL). */
export const detailOfPx = (minSidePx: number, bias = 1, from = 136, to = 176): number =>
  Math.max(0, Math.min(1, (minSidePx * bias - from) / (to - from)));

/* ------------------------------------------------------------------------------------------------
 * State styling (ICONS.md §3.1–3.2)
 * ---------------------------------------------------------------------------------------------- */

const LIT: ReadonlySet<PartState> = new Set<PartState>(['on', 'alwaysOn', 'reset', 'waiting', 'limit', 'fault']);

export const outlineFor = (s: PartState, pointed = 0): {color: string; width: number} => {
  if (LIT.has(s)) return {color: COLOR.ink, width: STROKE.active};
  if (s === 'visited') return {color: COLOR.annotation, width: STROKE.part};
  return {color: pointed > 0 ? mixColor(COLOR.structure, COLOR.textMuted, Math.min(1, pointed)) : COLOR.structure, width: STROKE.part};
};

export const fillFor = (s: PartState, mat: string): string => (LIT.has(s) ? COLOR.activeFill : mat);

/** Outline, fill and pip progress of a 5-frame flip (outline 0–3, fill 1–4, pip 2–5). */
export const flipProgress = (frame: number, flip?: {from: PartState; at: number}): {o: number; f: number; p: number} => {
  if (!flip) return {o: 1, f: 1, p: 1};
  return {o: prog(frame, flip.at, 3, 'arrive'), f: prog(frame, flip.at + 1, 3, 'arrive'), p: prog(frame, flip.at + 2, 3, 'arrive')};
};

export const stateLook = (
  state: PartState,
  frame: number,
  mat: string,
  flip?: {from: PartState; at: number},
  pointed = 0,
): {stroke: string; width: number; fill: string} => {
  const cur = outlineFor(state, pointed);
  const curFill = fillFor(state, mat);
  if (!flip || flip.from === state) return {stroke: cur.color, width: cur.width, fill: curFill};
  const pr = flipProgress(frame, flip);
  const prev = outlineFor(flip.from, pointed);
  return {
    stroke: mixColor(prev.color, cur.color, pr.o),
    width: prev.width + (cur.width - prev.width) * pr.o,
    fill: mixColor(fillFor(flip.from, mat), curFill, pr.f),
  };
};

/* ------------------------------------------------------------------------------------------------
 * Pip (14 px screen square)
 * ---------------------------------------------------------------------------------------------- */

export const pipCenter = (
  x: number,
  y: number,
  w: number,
  zoom: number,
  dock: Exclude<IconBaseProps['pip'], false | undefined> = 'top-right',
): Pt => {
  const g = (GLYPH2.pipDock + GLYPH2.pip / 2) / zoom;
  switch (dock) {
    case 'top-left':
      return [x - g, y - g];
    case 'inside-top-right':
      return [x + w - g, y + g];
    case 'inside-top-left':
      return [x + g, y + g];
    default:
      return [x + w + g, y - g];
  }
};

const PipShape: React.FC<{c: Pt; zoom: number; state: PartState; frame: number; opacity?: number}> = ({c, zoom, state, frame, opacity = 1}) => {
  const s = GLYPH2.pip / zoom;
  const st = GLYPH2.pipStroke / zoom;
  if (state === 'off' || state === 'visited') {
    const col = state === 'visited' ? COLOR.annotation : COLOR.structure;
    return (
      <path
        d={rectPath(c[0] - (s - st) / 2, c[1] - (s - st) / 2, s - st, s - st, 1 / zoom)}
        fill="none"
        stroke={col}
        strokeWidth={st}
        opacity={opacity}
      />
    );
  }
  const op = state === 'alwaysOn' ? breathe(frame, GLYPH2.breathePeriod, GLYPH2.breatheMin) : 1;
  return (
    <g opacity={opacity * op}>
      <path d={rectPath(c[0] - s / 2, c[1] - s / 2, s, s, 1.5 / zoom)} fill={COLOR.ink} />
      {state === 'reset' ? (
        <path
          d={`M${c[0] - s * 0.75} ${c[1] + s * 0.75}L${c[0] + s * 0.75} ${c[1] - s * 0.75}`}
          stroke={COLOR.ink}
          strokeWidth={2 / zoom}
        />
      ) : null}
    </g>
  );
};

export const Pip: React.FC<{
  rect: {x: number; y: number; w: number; h: number};
  dock: IconBaseProps['pip'];
  state: PartState;
  zoom: number;
  frame: number;
  flip?: {from: PartState; at: number};
}> = ({rect, dock, state, zoom, frame, flip}) => {
  if (dock === false) return null;
  const c = pipCenter(rect.x, rect.y, rect.w, zoom, dock ?? 'top-right');
  if (flip && flip.from !== state) {
    const p = flipProgress(frame, flip).p;
    if (p < 1) {
      return (
        <g>
          <PipShape c={c} zoom={zoom} state={flip.from} frame={frame} opacity={1 - p} />
          <PipShape c={c} zoom={zoom} state={state} frame={frame} opacity={p} />
        </g>
      );
    }
  }
  return <PipShape c={c} zoom={zoom} state={state} frame={frame} />;
};

/** Rim light: 2 px `rim` at 30% along the top and left edges of a raised top face (inset 1 px). */
export const RimLight: React.FC<{rect: {x: number; y: number; w: number; h: number}; radius: number; zoom: number}> = ({rect, radius, zoom}) => {
  const i = 1 / zoom;
  const r = Math.max(0, Math.min(radius, rect.w / 2, rect.h / 2));
  const {x, y, w, h} = rect;
  const d =
    r > i
      ? `M${f2(x + i)} ${f2(y + h - r)}L${f2(x + i)} ${f2(y + r)}A${f2(r - i)} ${f2(r - i)} 0 0 1 ${f2(x + r)} ${f2(y + i)}L${f2(x + w - r)} ${f2(y + i)}`
      : `M${f2(x + i)} ${f2(y + h)}L${f2(x + i)} ${f2(y + i)}L${f2(x + w)} ${f2(y + i)}`;
  return <path d={d} fill="none" stroke={COLOR.rim} strokeOpacity={RIM.opacity} strokeWidth={RIM.width / zoom} strokeLinecap="round" />;
};

/* ------------------------------------------------------------------------------------------------
 * Blocks inside packages (chipset, I/O die, SoC, EC)
 * ---------------------------------------------------------------------------------------------- */

export interface BlockProp {
  key: string;
  shape?: 'wide' | 'square';
  rel: {x: number; y: number; w: number; h: number};
  state?: PartState;
  flip?: {from: PartState; at: number};
  badge?: 'q' | null;
  glow?: boolean | number;
  /** Pip dock for this block (the lookout docks 'inside-top-right'). */
  pip?: IconBaseProps['pip'];
}

/** A block's world rect: `rel` as fractions of the part (all values <= 1) or as world-px offsets from its top-left. */
export const blockRect = (part: {x: number; y: number; w: number; h: number}, rel: BlockProp['rel']): {x: number; y: number; w: number; h: number} => {
  const frac = rel.x <= 1.0001 && rel.y <= 1.0001 && rel.w <= 1.0001 && rel.h <= 1.0001;
  return frac
    ? {x: part.x + rel.x * part.w, y: part.y + rel.y * part.h, w: rel.w * part.w, h: rel.h * part.h}
    : {x: part.x + rel.x, y: part.y + rel.y, w: rel.w, h: rel.h};
};

const glowAlpha = (g: boolean | number | undefined): number => (g === true ? ALPHA.glow : typeof g === 'number' ? g : 0);

/* ------------------------------------------------------------------------------------------------
 * Ports
 * ---------------------------------------------------------------------------------------------- */

const edgePorts = (x: number, y: number, w: number, h: number, prefix = ''): Ports => ({
  [`${prefix}center`]: [x + w / 2, y + h / 2],
  [`${prefix}topLeft`]: [x, y],
  [`${prefix}topRight`]: [x + w, y],
  [`${prefix}bottomLeft`]: [x, y + h],
  [`${prefix}bottomRight`]: [x + w, y + h],
  [`${prefix}top`]: [x + w / 2, y],
  [`${prefix}bottom`]: [x + w / 2, y + h],
  [`${prefix}left`]: [x, y + h / 2],
  [`${prefix}right`]: [x + w, y + h / 2],
  [`${prefix}bitAnchor`]: [x + w / 2, y + h / 2],
});

export const placeholderPorts = (type: IconType, p: IconBaseProps & Record<string, unknown>): Ports => {
  const {x, y, w, h} = p;
  const out: Ports = {...edgePorts(x, y, w, h), pip: [x + w + 15, y - 15]};
  const cx = x + w / 2;
  const cy = y + h / 2;
  switch (type) {
    case 'powerButton':
      out.leadOut = [cx, y];
      break;
    case 'psu':
      out.inlet = [x + 22, y + 30];
      out.rocker = [x + 25, y + 80];
      out.fan = [x + 80, cy];
      out.standbyOut = [x + w * 0.57, y];
      out.mainOut = [x + w * 0.69, y];
      out.nameSlot = [x + 140, y + 24];
      out.pillSlot = [x + w * 0.62, y + h * 0.6];
      break;
    case 'iecPlug':
      out.face = [x + w, cy];
      out.cord = [x, cy];
      break;
    case 'wallSocket':
      out.face = [cx, cy];
      break;
    case 'cpuLga':
      out.dmiOut = [cx, y + h];
      out.memRight = [x + w, y + h * 0.3];
      out.tagLeft = [x, y + h * 0.22];
      out.tagLeft2 = [x, y + h * 0.52];
      break;
    case 'chipset':
      out.dmiIn = [cx, y];
      break;
    case 'logicBlock':
      out.in1 = [x + w * 0.22, y + h];
      out.in2 = [x + w * 0.78, y + h];
      break;
    case 'atx24':
      out.pin9 = [x + w * 0.424, y + h / 2];
      out.mainEntry = [x + w * 0.833, y + h / 2];
      break;
    case 'fpHeader':
      out.pwrSw = [cx, cy];
      break;
    case 'vrmStandby':
      out.in = [cx, y + h];
      out.out = [cx, y];
      break;
    case 'monitor':
      out.foot = [cx, y + h + 70];
      break;
    case 'lanChip':
      out.in = [x, cy];
      out.out = [x + w, cy];
      break;
    case 'rearIo':
      out.rj45 = [x + w / 2, y + h * 0.78];
      break;
    default:
      break;
  }
  const blocks = (p as {blocks?: BlockProp[]}).blocks;
  if (Array.isArray(blocks)) {
    for (const b of blocks) {
      const r = blockRect(p, b.rel);
      Object.assign(out, edgePorts(r.x, r.y, r.w, r.h, `block:${b.key}.`));
      out[`block:${b.key}.in1`] = [r.x + r.w * 0.22, r.y + r.h];
      out[`block:${b.key}.in2`] = [r.x + r.w * 0.78, r.y + r.h];
      out[`block:${b.key}.right`] = [r.x + r.w, r.y + r.h / 2];
    }
    if (type === 'chipset') {
      const first = blocks.find((b) => b.shape !== 'square') ?? blocks[0];
      if (first) {
        const r = blockRect(p, first.rel);
        out.standbyIn = [r.x + r.w * 0.22, y + h];
        out.pwrbtnIn = [r.x + r.w * 0.78, y + h];
      }
    }
  }
  const extra = (p as {ports?: Record<string, Pt>}).ports;
  if (extra && typeof extra === 'object') for (const [k, v] of Object.entries(extra)) out[k] = [x + v[0], y + v[1]];
  return out;
};

/* ------------------------------------------------------------------------------------------------
 * The placeholder component
 * ---------------------------------------------------------------------------------------------- */

type PHProps = IconBaseProps & Record<string, unknown>;

const powerSymbol = (cx: number, cy: number, r: number): string => {
  // IEC 60417-5009: a 300° arc open at 12 o'clock + a vertical bar through the gap
  const a0 = (-90 + 30) * (Math.PI / 180);
  const a1 = (-90 - 30) * (Math.PI / 180);
  const p0: Pt = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r];
  const p1: Pt = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
  return `M${f2(p0[0])} ${f2(p0[1])}A${f2(r)} ${f2(r)} 0 1 1 ${f2(p1[0])} ${f2(p1[1])}M${f2(cx)} ${f2(cy - r * 1.18)}L${f2(cx)} ${f2(cy - r * 0.1)}`;
};

const num = (v: unknown, d: number): number => (typeof v === 'number' && isFinite(v) ? v : d);

export const PlaceholderIcon = (type: IconType): React.FC<PHProps> => {
  const def = placeholderDef(type);
  const Comp: React.FC<PHProps> = (p) => {
    const {x, y, w, h, zoom, frame} = p;
    const state: PartState = def.passive ? 'off' : (p.state ?? 'off');
    const side = p.side ?? [0, 0];
    const opacity = p.opacity ?? 1;
    const detail = p.detail ?? 1;
    const matColor = COLOR[def.mat];
    const look = stateLook(state, frame, matColor, def.passive ? undefined : p.flip, p.pointed ?? 0);
    const g = glowAlpha(p.glow);
    const raised = def.z > 0 && (side[0] !== 0 || side[1] !== 0);
    const elems: React.ReactNode[] = [];

    if (def.shape === 'cord') {
      const pts = (p.points as Pt[] | undefined) ?? [
        [x, y + h / 2],
        [x + w, y + h / 2],
      ];
      const d = routePath(pts, 10);
      return (
        <g opacity={opacity}>
          {p.fillsOnly ? null : <path d={d} fill="none" stroke={COLOR.structure} strokeWidth={8 + sw(4, zoom)} strokeLinejoin="round" strokeLinecap="round" />}
          <path d={d} fill="none" stroke={COLOR.side} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      );
    }

    // plug: physically pulled out by `seated` (1 = in the inlet)
    let ox = 0;
    let oy = 0;
    if (def.shape === 'plug') {
      const seated = num(p.seated, 1);
      ox = -40 * (1 - seated);
      oy = 16 * (1 - seated);
    }
    const X = x + ox;
    const Y = y + oy;
    const isRound = def.shape === 'button' || def.shape === 'circle';
    const radius = type === 'logicBlock' && p.shape === 'square' ? 2 : def.r;
    const top = isRound ? circlePath(X + w / 2, Y + h / 2, Math.min(w, h) / 2) : rectPath(X, Y, w, h, radius);
    const rect = {x: X, y: Y, w, h};

    // 1. side hull
    if (raised) elems.push(<path key="side" d={raisedHullPath(rect, isRound ? Math.min(w, h) / 2 : radius, side)} fill={COLOR.side} />);
    // 2. top face
    const faceFill = def.shape === 'button' ? COLOR.bodyLo : look.fill;
    elems.push(<path key="top" d={top} fill={faceFill} />);
    if (def.shape === 'monitor') {
      const i = 12;
      elems.push(<path key="screen" d={rectPath(X + i, Y + i, w - 2 * i, h - 2 * i, 4)} fill={COLOR.screenBlack} />);
      if (!p.fillsOnly) {
        elems.push(<path key="stand" d={rectPath(X + w / 2 - 10, Y + h, 20, 60, 2)} fill={COLOR.body} />);
        elems.push(<path key="foot" d={rectPath(X + w / 2 - 60, Y + h + 60, 120, 10, 3)} fill={COLOR.body} />);
      }
    }
    if (def.shape === 'cpu') {
      const sw2 = w * 0.77;
      const sh2 = h * 0.92;
      elems.push(<path key="sub" d={rectPath(X + (w - sw2) / 2, Y + (h - sh2) / 2, sw2, sh2, 4)} fill={COLOR.body} />);
      const iw = w * 0.68;
      const ih = h * 0.78;
      elems.push(<path key="ihs" d={rectPath(X + (w - iw) / 2, Y + (h - ih) / 2, iw, ih, 6)} fill={look.fill === COLOR.activeFill ? COLOR.activeFill : COLOR.bodyHi} />);
      for (const fy of [0.3, 0.62]) {
        elems.push(<path key={`nl${fy}`} d={rectPath(X + (w - iw) / 2 - 1, Y + h * fy, 10, 24, 2)} fill={COLOR.body} />);
        elems.push(<path key={`nr${fy}`} d={rectPath(X + (w + iw) / 2 - 9, Y + h * fy, 10, 24, 2)} fill={COLOR.body} />);
      }
    }
    if (def.shape === 'package') {
      const ins = Math.min(18, w * 0.08, h * 0.08);
      elems.push(<path key="die" d={rectPath(X + ins, Y + ins, w - 2 * ins, h - 2 * ins, 4)} fill={COLOR.board} />);
    }
    if (def.shape === 'button') {
      const press = num(p.press, 0);
      const rc = (Math.min(w, h) / 2) * 0.75 * (1 - 0.1 * press);
      elems.push(<path key="cap" d={circlePath(X + w / 2, Y + h / 2, rc)} fill={look.fill === COLOR.activeFill ? COLOR.activeFill : COLOR.bodyHi} />);
    }

    if (!p.fillsOnly) {
      // 3. detail group
      if (detail > 0.01 && def.shape === 'rect' && !def.passive && Math.min(w, h) >= 24 && Math.max(w, h) <= 300) {
        const ins = Math.min(w, h) * 0.2;
        elems.push(
          <path
            key="detail"
            d={rectPath(X + ins, Y + ins, w - 2 * ins, h - 2 * ins, 3)}
            fill="none"
            stroke={COLOR.detail}
            strokeWidth={sw(STROKE.detail, zoom)}
            opacity={detail}
          />,
        );
      }
      if (def.shape === 'package') {
        const ins = Math.min(18, w * 0.08, h * 0.08);
        elems.push(
          <path key="dieline" d={rectPath(X + ins, Y + ins, w - 2 * ins, h - 2 * ins, 4)} fill="none" stroke={COLOR.detail} strokeWidth={sw(2, zoom)} />,
        );
      }
      if (def.shape === 'psu') {
        // identity: inlet, rocker with I/O marks, fan ring, cable exit
        const rocker = p.rocker;
        const pos: 'I' | 'O' =
          typeof rocker === 'string' ? (rocker as 'I' | 'O') : rocker && typeof rocker === 'object' ? (frame >= num((rocker as {at: number}).at, 0) + 3 ? (rocker as {to: 'I' | 'O'}).to : (rocker as {from: 'I' | 'O'}).from) : 'I';
        elems.push(<path key="inlet" d={rectPath(X + 12, Y + 10, 20, 42, 3)} fill={COLOR.bodyLo} stroke={COLOR.structure} strokeWidth={sw(2, zoom)} />);
        elems.push(<path key="rocker" d={rectPath(X + 12, Y + 58, 26, 50, 4)} fill={COLOR.bodyLo} stroke={COLOR.structure} strokeWidth={sw(2, zoom)} />);
        const pressedY = pos === 'I' ? Y + 58 : Y + 83;
        elems.push(<path key="rockerP" d={rectPath(X + 14, pressedY + 2, 22, 21, 3)} fill={COLOR.side} />);
        elems.push(<path key="rI" d={`M${X + 25} ${Y + 64}L${X + 25} ${Y + 77}`} stroke={COLOR.annotation} strokeWidth={sw(3, zoom)} />);
        elems.push(<path key="rO" d={circlePath(X + 25, Y + 95, 6)} fill="none" stroke={COLOR.annotation} strokeWidth={sw(3, zoom)} />);
        elems.push(<path key="fan" d={circlePath(X + 80, Y + h / 2, 44)} fill={COLOR.bodyLo} stroke={COLOR.detail} strokeWidth={sw(2, zoom)} />);
        elems.push(<path key="hub" d={circlePath(X + 80, Y + h / 2, 10)} fill={COLOR.body} stroke={COLOR.detail} strokeWidth={sw(2, zoom)} />);
        elems.push(<path key="exit" d={rectPath(X + w * 0.5, Y - 4, 96, 10, 3)} fill={COLOR.bodyLo} />);
        if (detail > 0.01) {
          const vents: React.ReactNode[] = [];
          for (let k = 0; k < 5; k++) vents.push(<path key={k} d={rectPath(X + 150 + k * 14, Y + h / 2 - 20, 6, 40, 2)} fill={COLOR.side} />);
          elems.push(<g key="vents" opacity={detail}>{vents}</g>);
        }
      }
      if (def.shape === 'plug') {
        const seated = num(p.seated, 1);
        if (seated < 0.999) {
          const pins: React.ReactNode[] = [];
          for (let k = 0; k < 3; k++) pins.push(<path key={k} d={`M${X + w + 2} ${Y + 8 + k * 10}L${X + w + 12} ${Y + 8 + k * 10}`} stroke={COLOR.structure} strokeWidth={sw(2, zoom)} />);
          elems.push(<g key="pins" opacity={1 - seated}>{pins}</g>);
        }
      }
      // 4. rim light
      if (def.z > 0 && !isRound) elems.push(<RimLight key="rim" rect={rect} radius={radius} zoom={zoom} />);
      // 6. glow (under the outline)
      if (g > 0 && !def.passive) {
        elems.push(<path key="glow" d={top} fill="none" stroke={COLOR.ink} strokeOpacity={g} strokeWidth={sw(look.width * 3, zoom)} />);
      }
      // 5. outline
      const edge = def.edge;
      elems.push(
        <path
          key="outline"
          d={top}
          fill="none"
          stroke={edge ? edge.color : look.stroke}
          strokeWidth={sw(edge ? edge.width : look.width, zoom)}
          strokeLinejoin="round"
        />,
      );
      if (def.shape === 'button') {
        const press = num(p.press, 0);
        const rc = (Math.min(w, h) / 2) * 0.75 * (1 - 0.1 * press);
        elems.push(
          <path key="capline" d={circlePath(X + w / 2, Y + h / 2, rc)} fill="none" stroke={COLOR.structure} strokeOpacity={0.6} strokeWidth={sw(2, zoom)} />,
        );
        elems.push(
          <path
            key="sym"
            d={powerSymbol(X + w / 2, Y + h / 2 + 2, rc * 0.5)}
            fill="none"
            stroke={look.stroke}
            strokeOpacity={1 - 0.2 * press}
            strokeWidth={sw(3, zoom)}
            strokeLinecap="round"
          />,
        );
      }
      // blocks (chipset & co.): drawn as their own states, outline and pip
      const blocks = p.blocks as BlockProp[] | undefined;
      if (Array.isArray(blocks)) {
        for (const b of blocks) {
          const br = blockRect({x: X, y: Y, w, h}, b.rel);
          const bs: PartState = b.state ?? 'off';
          const bl = stateLook(bs, frame, COLOR.body, b.flip);
          const rr = b.shape === 'square' ? 2 : 6;
          const bd = rectPath(br.x, br.y, br.w, br.h, rr);
          const bg = glowAlpha(b.glow);
          elems.push(<path key={`bf-${b.key}`} d={bd} fill={bl.fill} />);
          if (bg > 0) elems.push(<path key={`bg-${b.key}`} d={bd} fill="none" stroke={COLOR.ink} strokeOpacity={bg} strokeWidth={sw(bl.width * 3, zoom)} />);
          elems.push(<path key={`bo-${b.key}`} d={bd} fill="none" stroke={bl.stroke} strokeWidth={sw(bl.width, zoom)} />);
          elems.push(
            <Pip
              key={`bp-${b.key}`}
              rect={br}
              dock={b.pip ?? (b.shape === 'square' ? 'top-right' : 'inside-top-right')}
              state={bs}
              zoom={zoom}
              frame={frame}
              flip={b.flip}
            />,
          );
        }
      } else if (!p.fillsOnly && def.shape === 'package' && Array.isArray(p.blocks) === false) {
        // a package with no blocks: nothing more
      }
      // 7. pip (non-passive parts without blocks)
      const hasBlocks = Array.isArray(blocks) && blocks.length > 0;
      if (!def.passive && !hasBlocks && def.shape !== 'monitor' && p.pip !== false) {
        elems.push(<Pip key="pip" rect={rect} dock={p.pip ?? 'top-right'} state={state} zoom={zoom} frame={frame} flip={p.flip} />);
      }
    } else if (def.shape === 'package') {
      // knockout: blocks' top faces too
      const blocks = p.blocks as BlockProp[] | undefined;
      if (Array.isArray(blocks)) {
        for (const b of blocks) {
          const br = blockRect({x: X, y: Y, w, h}, b.rel);
          elems.push(<path key={`bf-${b.key}`} d={rectPath(br.x, br.y, br.w, br.h, b.shape === 'square' ? 2 : 6)} fill={fillFor(b.state ?? 'off', COLOR.body)} />);
        }
      }
    }
    return <g opacity={opacity}>{elems}</g>;
  };
  Comp.displayName = `Placeholder(${type})`;
  return Comp;
};
