/**
 * The bench drawing (left page): every part of the machine as nib-ink marks.
 *
 * Ink is the machine: idle parts in structure grey (3 px nib), active parts in ink (4–5 px nib),
 * the always-on lookout inked and breathing from f0. Parts are drawn from data in true layout; the
 * chipset scene is transform-aware so the Lens can show the same geometry at ×4 (strokes stay crisp).
 */
import React from 'react';
import {MONO, SANS, THEMES, breathe, circlePath, clamp01, linePath, polyPath, rectPath, routePath, squarePath, type Pt} from '../../shared';
import {Bloom, Fl, Marks, S, T, WickMask, crossedCorner, hatchPath, rectCause, type Mark} from './nib';
import * as L from './layout';

export const TH = THEMES.light;
const INK = TH.ink;
const STR = TH.structure;
const ANN = TH.annotation;
const WHITE = '#FFFFFF';

/* ------------------------------------------------------------------------------------------------
 * Transform (true geometry → screen; identity on the page, ×4 inside the Lens)
 * ---------------------------------------------------------------------------------------------- */
export interface Xf {
  k: number; // geometry scale
  ax: number; // true-space anchor
  ay: number;
  cx: number; // where the anchor lands on screen
  cy: number;
  sw: number; // stroke-width multiplier
}
export const IDENTITY: Xf = {k: 1, ax: 0, ay: 0, cx: 0, cy: 0, sw: 1};
export const xX = (f: Xf, x: number): number => f.cx + (x - f.ax) * f.k;
export const xY = (f: Xf, y: number): number => f.cy + (y - f.ay) * f.k;
export const xPt = (f: Xf, p: Pt): Pt => [xX(f, p[0]), xY(f, p[1])];
export const xBox = (f: Xf, b: L.Box): L.Box => ({x: xX(f, b.x), y: xY(f, b.y), w: b.w * f.k, h: b.h * f.k});
const xRect = (f: Xf, b: L.Box, r: number): string => {
  const t = xBox(f, b);
  return rectPath(t.x, t.y, t.w, t.h, r * f.k);
};

/* ------------------------------------------------------------------------------------------------
 * Small glyphs
 * ---------------------------------------------------------------------------------------------- */

/** The "?" badge (36 px rounded square, 3 px emphasis outline, "?" in Sora 700 30 px); fill 0..1. */
export const qBadgeMarks = (cx: number, cy: number, k: number, fill: number, plate = WHITE): Mark[] => {
  const b = 36 * k;
  const sw = 3 * k;
  const box = rectPath(cx - b / 2 + sw / 2, cy - b / 2 + sw / 2, b - sw, b - sw, 8 * k);
  const out: Mark[] = [Fl(box, plate, {clean: true})];
  if (fill > 0) out.push(Fl(box, TH.emphasis, {o: fill, clean: true}));
  out.push(S(box, TH.emphasis, sw, {role: 'emphasis', seed: `qb:${Math.round(cx)}:${Math.round(cy)}`}));
  out.push(T(cx, cy + 10.8 * k, '?', 30 * k, fill >= 0.5 ? WHITE : TH.emphasis, SANS, {weight: 700, anchor: 'middle'}));
  return out;
};

/** State pips (12 px): OFF hollow, ON filled, ALWAYS_ON breathing. */
export const pipMarks = (cx: number, cy: number, state: 'off' | 'on' | 'always', frame: number, k = 1, o = 1): Mark[] => {
  if (state === 'off') return [S(squarePath(cx, cy, 10 * k, 1.5 * k), STR, 2 * k, {clean: true, o})];
  const op = state === 'always' ? breathe(frame) : 1;
  return [Fl(squarePath(cx, cy, 12 * k, 1.5 * k), INK, {clean: true, o: o * op})];
};

/** The D24 eye badge (almond with a pupil), in pencil: dashed annotation grey; ≈ chip optional. */
export const eyeMarks = (cx: number, cy: number, w: number, k: number, chip: boolean): Mark[] => {
  const h = w * 0.56;
  const d = `M${cx - w / 2} ${cy}Q${cx} ${cy - h} ${cx + w / 2} ${cy}Q${cx} ${cy + h} ${cx - w / 2} ${cy}Z`;
  const pr = h * 0.27;
  const out: Mark[] = [
    Fl(d, WHITE, {clean: true, o: 0.85}),
    S(d, ANN, 3 * k, {dash: [12 * Math.min(1, k * 0.6 + 0.4), 8 * Math.min(1, k * 0.6 + 0.4)], cap: 'round', seed: `eye:${cx}`}),
    Fl(circlePath(cx, cy, pr), ANN, {clean: true}),
  ];
  if (chip) out.push(...approxChipMarks(cx - w / 2 + 2 * k, cy - h / 2 - 8 * k, k));
  return out;
};

/** The ≈ chip as a vector (the font subset has no ≈). */
export const approxChipMarks = (x: number, y: number, k = 1, col = ANN): Mark[] => {
  const W = 32 * k;
  const H = 28 * k;
  const wave = (yy: number) => {
    const x0 = x - 9 * k;
    const a = 2.6 * k;
    return `M${x0} ${yy}Q${x0 + 4.5 * k} ${yy - 2 * a} ${x0 + 9 * k} ${yy}T${x0 + 18 * k} ${yy}`;
  };
  return [
    Fl(rectPath(x - W / 2, y - H / 2, W, H, 6 * k), WHITE, {clean: true}),
    S(rectPath(x - W / 2, y - H / 2, W, H, 6 * k), col, 2 * k, {clean: true}),
    S(wave(y - 3.6 * k), col, 2.4 * k, {clean: true, cap: 'round'}),
    S(wave(y + 3.6 * k), col, 2.4 * k, {clean: true, cap: 'round'}),
  ];
};

/** An ink tick (check mark), 28 px. */
export const tickMarks = (x: number, y: number, k = 1): Mark[] => [
  S(`M${x} ${y + 12 * k}L${x + 9 * k} ${y + 21 * k}L${x + 28 * k} ${y}`, INK, 3.5 * k, {cap: 'round', join: 'round', seed: `tick:${x}`}),
];

/** A small clock face (the chipset's RTC alarm), unlabelled. */
export const clockMarks = (cx: number, cy: number, r: number, k = 1, col = STR): Mark[] => [
  Fl(circlePath(cx, cy, r), WHITE, {clean: true}),
  S(circlePath(cx, cy, r), col, 2.5 * k, {seed: `clock:${cx}`}),
  S(`M${cx} ${cy}L${cx} ${cy - r * 0.62}M${cx} ${cy}L${cx + r * 0.5} ${cy + r * 0.12}`, col, 2.2 * k, {cap: 'round', clean: true}),
];

/* ------------------------------------------------------------------------------------------------
 * Case, board and the idle parts
 * ---------------------------------------------------------------------------------------------- */

export const caseMarks = (): Mark[] => {
  const c = L.CASE;
  return [
    S(rectPath(c.x, c.y, c.w, c.h, 14), STR, 3, {seed: 'case'}),
    S(linePath([L.FRONT_INNER_X, c.y + 6], [L.FRONT_INNER_X, c.y + c.h - 6]), STR, 2.5, {seed: 'front'}),
    ...crossedCorner(c.x, c.y, STR),
    // feet
    S(rectPath(440, 936, 56, 10, 3), STR, 2.5, {seed: 'foot1'}),
    S(rectPath(1150, 936, 56, 10, 3), STR, 2.5, {seed: 'foot2'}),
  ];
};

export const boardMarks = (): Mark[] => {
  const b = L.BOARD;
  return [
    Fl(rectPath(b.x, b.y, b.w, b.h, 10), WHITE, {clean: true}),
    S(rectPath(b.x, b.y, b.w, b.h, 10), STR, 3, {seed: 'board'}),
    ...crossedCorner(b.x, b.y, STR),
    S(circlePath(434, 422, 5), STR, 2, {clean: true}),
    S(circlePath(1006, 422, 5), STR, 2, {clean: true}),
    S(circlePath(434, 890, 5), STR, 2, {clean: true}),
  ];
};

export const dimmMarks = (): Mark[] =>
  L.DIMMS.flatMap((d, i) => [
    S(rectPath(d.x, d.y, d.w, d.h, 3), STR, 2.5, {seed: `dimm${i}`}),
    S(linePath([d.x + d.w / 2, d.y + 12], [d.x + d.w / 2, d.y + d.h - 12]), STR, 1.5, {clean: true}),
    S(rectPath(d.x - 2, d.y - 7, d.w + 4, 7, 2), STR, 2, {clean: true}),
    S(rectPath(d.x - 2, d.y + d.h, d.w + 4, 7, 2), STR, 2, {clean: true}),
    S(linePath([d.x, d.y + 158], [d.x + d.w, d.y + 158]), STR, 2, {clean: true}),
  ]);

export const pcieMarks = (): Mark[] => {
  const p = L.PCIE;
  return [
    S(rectPath(p.x, p.y, p.w, p.h, 3), STR, 2.5, {seed: 'pcie'}),
    S(linePath([p.x + 10, p.y + p.h / 2], [p.x + 62, p.y + p.h / 2]), STR, 1.5, {clean: true}),
    S(linePath([p.x + 76, p.y + p.h / 2], [p.x + p.w - 12, p.y + p.h / 2]), STR, 1.5, {clean: true}),
    S(linePath([p.x + 69, p.y], [p.x + 69, p.y + p.h]), STR, 2, {clean: true}),
    S(rectPath(p.x + p.w, p.y - 4, 10, p.h + 8, 2), STR, 2, {clean: true}),
    ...crossedCorner(p.x, p.y, STR, 1.5),
  ];
};

export const rearIoMarks = (): Mark[] => {
  const r = L.REAR_IO;
  const j = L.RJ45;
  return [
    S(rectPath(r.x, r.y, r.w, r.h, 4), STR, 2.5, {seed: 'rearIo'}),
    S(rectPath(r.x + 5, 438, 30, 16, 2), STR, 1.8, {clean: true}),
    S(rectPath(r.x + 5, 458, 30, 16, 2), STR, 1.8, {clean: true}),
    S(rectPath(r.x + 5, 486, 30, 16, 2), STR, 1.8, {clean: true}),
    S(rectPath(r.x + 5, 506, 30, 16, 2), STR, 1.8, {clean: true}),
    S(circlePath(r.x + 20, 540, 5), STR, 1.8, {clean: true}),
    S(circlePath(r.x + 20, 558, 5), STR, 1.8, {clean: true}),
    // RJ45 with its latch notch
    S(polyPath([[j.x, j.y], [j.x + j.w, j.y], [j.x + j.w, j.y + j.h], [j.x + 21, j.y + j.h], [j.x + 21, j.y + j.h - 6], [j.x + 11, j.y + j.h - 6], [j.x + 11, j.y + j.h], [j.x, j.y + j.h]], true), STR, 2.2, {seed: 'rj45'}),
  ];
};

export const pin24Marks = (): Mark[] => {
  const p = L.PIN24;
  const out: Mark[] = [Fl(rectPath(p.x, p.y, p.w, p.h, 3), WHITE, {clean: true}), S(rectPath(p.x, p.y, p.w, p.h, 3), STR, 2.5, {seed: 'pin24'})];
  for (let r = 0; r < 12; r++) {
    for (let c = 0; c < 2; c++) out.push(S(rectPath(p.x + 6 + c * 12, p.y + 6 + r * 8.6, 8, 5.5, 1), STR, 1.2, {clean: true}));
  }
  return out;
};

export const regMarks = (): Mark[] => {
  const g = L.REG;
  return [
    Fl(rectPath(g.x, g.y, g.w, g.h, 4), WHITE, {clean: true}),
    S(rectPath(g.x, g.y, g.w, g.h, 4), INK, 3.6, {seed: 'reg'}),
    S('M989 624Q993.5 612 998 624Q1002.5 612 1007 624Q1011.5 612 1011 624', INK, 2, {clean: true, cap: 'round'}),
  ];
};

export const headerMarks = (): Mark[] => {
  const h = L.HEADER;
  const out: Mark[] = [Fl(rectPath(h.x, h.y, h.w, h.h, 2), WHITE, {clean: true}), S(rectPath(h.x, h.y, h.w, h.h, 2), STR, 2.5, {seed: 'hdr'})];
  for (let i = 0; i < 5; i++) out.push(Fl(rectPath(h.x + 5 + i * 8, h.y + 4, 5, 6, 1), STR, {clean: true}));
  return out;
};

/* ------------------------------------------------------------------------------------------------
 * The CPU (LGA1700 frame, lever, package lid): grey, hollow pip; its name and readout live on the sheet
 * ---------------------------------------------------------------------------------------------- */

export const cpuMarks = (frame: number): Mark[] => {
  const s = L.SOCKET;
  const i = L.IHS;
  return [
    Fl(rectPath(s.x, s.y, s.w, s.h, 8), WHITE, {clean: true}),
    S(rectPath(s.x, s.y, s.w, s.h, 8), STR, 3, {seed: 'socket'}),
    ...crossedCorner(s.x, s.y, STR),
    // load lever along the top, with its hook
    S(`M${s.x + 10} ${s.y - 10}L${s.x + s.w - 30} ${s.y - 10}`, STR, 2.5, {seed: 'lever', cap: 'round'}),
    S(circlePath(s.x + s.w - 22, s.y - 10, 6), STR, 2, {clean: true}),
    S(`M${s.x + 8} ${s.y - 16}L${s.x + 8} ${s.y - 4}`, STR, 2, {clean: true}),
    // package lid with its side notches
    S(
      polyPath(
        [
          [i.x + 12, i.y],
          [i.x + i.w - 12, i.y],
          [i.x + i.w, i.y + 12],
          [i.x + i.w, i.y + 80],
          [i.x + i.w - 8, i.y + 80],
          [i.x + i.w - 8, i.y + 144],
          [i.x + i.w, i.y + 144],
          [i.x + i.w, i.y + i.h - 12],
          [i.x + i.w - 12, i.y + i.h],
          [i.x + 12, i.y + i.h],
          [i.x, i.y + i.h - 12],
          [i.x, i.y + 144],
          [i.x + 8, i.y + 144],
          [i.x + 8, i.y + 80],
          [i.x, i.y + 80],
          [i.x, i.y + 12],
        ],
        true,
      ),
      STR,
      3,
      {seed: 'ihs'},
    ),
    // OFF pip docked inside the lid's top-right corner (outside the socket it sat on DIMM 1's latch and
    // read as the DIMM's)
    ...pipMarks(i.x + i.w - 18, i.y + 18, 'off', frame),
  ];
};

/** "Main processor" written inside the CPU (sheet only), and the "0 instructions" readout. */
export const cpuTextMarks = (nameOp: number, readoutP: number): Mark[] => {
  const cx = L.IHS.x + L.IHS.w / 2;
  const out: Mark[] = [];
  if (nameOp > 0) {
    out.push(T(cx, 508, 'Main', 44, INK, SANS, {anchor: 'middle', o: nameOp}));
    out.push(T(cx, 556, 'processor', 44, INK, SANS, {anchor: 'middle', o: nameOp}));
  }
  if (readoutP > 0) {
    out.push(T(cx, 624, '0', 64, INK, MONO, {anchor: 'middle', o: readoutP, weight: 500}));
    out.push(T(cx, 664, 'instructions', 34, TH.textMuted, SANS, {anchor: 'middle', o: readoutP}));
  }
  return out;
};

/* ------------------------------------------------------------------------------------------------
 * PSU, its fold-out rear face, the cord and the wall socket
 * ---------------------------------------------------------------------------------------------- */

export const psuMarks = (): Mark[] => {
  const p = L.PSU;
  const out: Mark[] = [
    Fl(rectPath(p.x, p.y, p.w, p.h, 8), WHITE, {clean: true}),
    S(rectPath(p.x, p.y, p.w, p.h, 8), STR, 3, {seed: 'psu'}),
    ...crossedCorner(p.x, p.y, STR),
    // cable grommet on the front side, where the bundle leaves
    S(rectPath(p.x + p.w - 8, 304, 8, 60, 3), STR, 2, {clean: true}),
  ];
  for (let v = 0; v < 4; v++) out.push(S(linePath([p.x + 12 + v * 9, p.y + 22], [p.x + 12 + v * 9, p.y + p.h - 22]), STR, 2, {clean: true, cap: 'round'}));
  return out;
};

export const psuNameMarks = (o: number): Mark[] =>
  o <= 0
    ? []
    : [T(L.PSU.x + 148, 316, 'Power', 44, INK, SANS, {anchor: 'middle', o}), T(L.PSU.x + 148, 364, 'supply', 44, INK, SANS, {anchor: 'middle', o})];

export const flapMarks = (): Mark[] => {
  const f = L.FLAP;
  const pl = L.PLUG;
  const ro = L.ROCKER;
  const out: Mark[] = [
    // the flap is a paper plane: 4 px hard contact shadow
    Fl(rectPath(f.x, f.y + 4, f.w, f.h, 6), L.CARD_SHADOW, {clean: true}),
    Fl(rectPath(f.x, f.y, f.w, f.h, 6), WHITE, {clean: true}),
    S(rectPath(f.x, f.y, f.w, f.h, 6), STR, 3, {seed: 'flap'}),
    // hinge: a solid score line on the PSU's rear edge, two 8 px score ticks (never dashed)
    S(linePath([f.x + f.w, f.y + 6], [f.x + f.w, f.y + f.h - 6]), STR, 3, {clean: true}),
    S(linePath([f.x + f.w - 4, f.y + 34], [f.x + f.w + 4, f.y + 34]), STR, 2, {clean: true}),
    S(linePath([f.x + f.w - 4, f.y + f.h - 34], [f.x + f.w + 4, f.y + f.h - 34]), STR, 2, {clean: true}),
    // IEC C14 inlet bezel (around the plug)
    S(rectPath(186, 284, 60, 66, 6), STR, 2.5, {seed: 'inlet'}),
    // seated C13 plug (chamfered lower corners), ink: it is really in
    Fl(polyPath([[pl.x + 10, pl.y], [pl.x + pl.w - 10, pl.y], [pl.x + pl.w - 10, pl.y + pl.h - 12], [pl.x + pl.w - 22, pl.y + pl.h], [pl.x + 22, pl.y + pl.h], [pl.x + 10, pl.y + pl.h - 12]], true), WHITE, {clean: true}),
    S(polyPath([[pl.x + 10, pl.y], [pl.x + pl.w - 10, pl.y], [pl.x + pl.w - 10, pl.y + pl.h - 12], [pl.x + pl.w - 22, pl.y + pl.h], [pl.x + 22, pl.y + pl.h], [pl.x + 10, pl.y + pl.h - 12]], true), INK, 4, {seed: 'plug'}),
    S(linePath([pl.x + 20, pl.y + 14], [pl.x + pl.w - 20, pl.y + 14]), INK, 2, {clean: true, cap: 'round'}),
    // the mains rocker, at "I" (top half pressed in)
    Fl(rectPath(ro.x, ro.y, ro.w, ro.h, 4), WHITE, {clean: true}),
    Fl(rectPath(ro.x + 3, ro.y + 3, ro.w - 6, ro.h / 2 - 3, 2), '#E6E1D8', {clean: true}),
    S(rectPath(ro.x, ro.y, ro.w, ro.h, 4), INK, 4, {seed: 'rocker'}),
    S(linePath([ro.x + 2, ro.y + ro.h / 2], [ro.x + ro.w - 2, ro.y + ro.h / 2]), INK, 2, {clean: true}),
    S(linePath([ro.x + ro.w / 2, ro.y + 8], [ro.x + ro.w / 2, ro.y + 20]), INK, 3, {clean: true, cap: 'round'}),
    S(circlePath(ro.x + ro.w / 2, ro.y + 40, 5), INK, 2, {clean: true}),
  ];
  // exhaust grille: small honeycomb holes
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 3; c++) {
      const cx = 352 + c * 12 + (r % 2) * 6;
      const cy = 272 + r * 18;
      out.push(S(circlePath(cx, cy, 3.6), STR, 1.4, {clean: true}));
    }
  }
  return out;
};

export const cordMarks = (): Mark[] => {
  const w = L.WALL;
  return [
    S(polyPath(L.CORD), INK, 3, {seed: 'cord', cap: 'round'}),
    Fl(rectPath(w.x, w.y, w.w, w.h, 8), WHITE, {clean: true}),
    S(rectPath(w.x, w.y, w.w, w.h, 8), STR, 3, {seed: 'wall'}),
    S(rectPath(w.x + 18, w.y + 18, 5, 16, 1), STR, 2, {clean: true}),
    S(rectPath(w.x + 44, w.y + 18, 5, 16, 1), STR, 2, {clean: true}),
    S(`M${w.x + 28} ${w.y + 56}A6 6 0 0 1 ${w.x + 40} ${w.y + 56}`, STR, 2, {clean: true}),
    Fl(rectPath(w.x + w.w - 4, 727, 12, 18, 2), INK, {clean: true}),
  ];
};

/* ------------------------------------------------------------------------------------------------
 * The momentary switch (in section), the LED, the lead, the board trace and the end-tick
 * ---------------------------------------------------------------------------------------------- */

/** off: plunger travel in px (0 at rest, 8 fully in). */
export const buttonMarks = (off: number): Mark[] => {
  const h = L.BTN.housing;
  const cap = L.BTN.cap;
  const st = L.BTN.stem;
  const out: Mark[] = [];
  // the housing, cut: top, bottom and back walls hatched
  const walls: L.Box[] = [
    {x: h.x, y: h.y, w: h.w, h: 8},
    {x: h.x, y: h.y + h.h - 8, w: h.w, h: 8},
    {x: h.x, y: h.y + 8, w: 8, h: h.h - 16},
  ];
  for (const w of walls) {
    out.push(Fl(rectPath(w.x, w.y, w.w, w.h, 0), WHITE, {clean: true}));
    out.push(S(hatchPath(w.x, w.y, w.w, w.h, 7), STR, 1.6, {clean: true}));
  }
  out.push(S(polyPath([[h.x + h.w, h.y], [h.x, h.y], [h.x, h.y + h.h], [h.x + h.w, h.y + h.h]]), STR, 3, {seed: 'housing'}));
  out.push(S(polyPath([[h.x + h.w, h.y + 8], [h.x + 8, h.y + 8], [h.x + 8, h.y + h.h - 8], [h.x + h.w, h.y + h.h - 8]]), STR, 2, {clean: true}));
  // the front panel, cut where the switch is mounted (hatched)
  out.push(Fl(rectPath(L.FRONT_INNER_X, h.y, 8, h.h, 0), WHITE, {clean: true}));
  out.push(S(hatchPath(L.FRONT_INNER_X, h.y, 8, st.y - h.y - 2, 6), STR, 1.4, {clean: true}));
  out.push(S(hatchPath(L.FRONT_INNER_X, st.y + st.h + 2, 8, h.y + h.h - st.y - st.h - 2, 6), STR, 1.4, {clean: true}));
  // spring (back wall → plunger)
  const sx0 = h.x + 8;
  const sx1 = st.x - off;
  const n = 6;
  const zig: Pt[] = [[sx0, 620]];
  for (let i = 1; i < n; i++) zig.push([sx0 + ((sx1 - sx0) * i) / n, i % 2 ? 612 : 628]);
  zig.push([sx1, 620]);
  out.push(S(polyPath(zig), STR, 1.8, {clean: true, join: 'round'}));
  // contacts at the back, the plunger's bridge closes them when it is fully in
  out.push(Fl(rectPath(1206, 634, 6, 4, 1), INK, {clean: true}));
  out.push(Fl(rectPath(1206, 640, 6, 4, 1), INK, {clean: true}));
  out.push(Fl(rectPath(st.x - off - 2, 630, 6, 8, 1), INK, {clean: true}));
  // plunger stem through the panel, and the cap outside it
  out.push(Fl(rectPath(st.x - off, st.y, st.w, st.h, 2), WHITE, {clean: true}));
  out.push(S(rectPath(st.x - off, st.y, st.w, st.h, 2), INK, 2.6, {seed: 'stem'}));
  out.push(Fl(rectPath(cap.x - off, cap.y, cap.w, cap.h, 6), WHITE, {clean: true}));
  out.push(S(rectPath(cap.x - off, cap.y, cap.w, cap.h, 6), INK, 4.5, {seed: 'cap'}));
  out.push(S(linePath([cap.x - off + cap.w - 6, cap.y + 10], [cap.x - off + cap.w - 6, cap.y + cap.h - 10]), INK, 2, {clean: true, cap: 'round'}));
  // power LED on the front panel: off (hollow)
  out.push(Fl(circlePath(L.LED.cx, L.LED.cy, L.LED.r), WHITE, {clean: true}));
  out.push(S(circlePath(L.LED.cx, L.LED.cy, L.LED.r), STR, 2.2, {clean: true}));
  return out;
};

export const leadMarks = (): Mark[] => [S(L.LEAD, STR, 4, {role: 'route', seed: 'lead', join: 'round'})];
export const traceMarks = (): Mark[] => [S(L.TRACE, STR, 3, {role: 'route', seed: 'trace', join: 'round'})];
export const endTickMarks = (): Mark[] => [S(L.END_TICK, INK, 4.2, {seed: 'endtick', cap: 'butt'})];

/* ------------------------------------------------------------------------------------------------
 * The chipset with its flap window (transform-aware)
 * ---------------------------------------------------------------------------------------------- */

export interface ChipState {
  frame: number;
  /** "?" block ON: ink outline wick 0..1, white fill 0..1, pip 0..1. */
  qInk: number;
  qFill: number;
  qPip: number;
  /** "?" badge emphasis fill 0..1. */
  badge: number;
  /** Pencil eye on the lookout (0..1 draw), with or without its ≈ chip. */
  eye: number;
  eyeChip?: boolean;
  /** S11 clock (bloom 0..1). */
  clock: number;
}

/** Package, lid, window and both blocks. In the Lens pass xf (×4) and include the stubs of the routes. */
export const ChipsetScene: React.FC<{st: ChipState; xf?: Xf; seed: string; stubs?: boolean; part?: 'all' | 'base' | 'blocks'}> = ({
  st,
  xf = IDENTITY,
  seed,
  stubs,
  part = 'all',
}) => {
  const f = xf;
  const k = f.k;
  const sw = f.sw;
  const frame = st.frame;
  const qb = xBox(f, L.QB);
  const lk = xBox(f, L.LOOK);
  const qPath = rectPath(qb.x, qb.y, qb.w, qb.h, 10 * k);
  const base: Mark[] = [
    // package
    Fl(xRect(f, L.PCH, 8), L.PKG, {clean: true}),
    S(xRect(f, L.PCH, 8), STR, 3 * sw, {seed: `${seed}:pch`}),
    // the window (cut edge), its die
    Fl(xRect(f, L.WIN, 4), L.DIE, {clean: true}),
    // hard contact shadow of the folded-up lid
    Fl(rectPath(xX(f, L.WIN.x), xY(f, L.WIN.y), 4 * k, L.WIN.h * k, 0), L.CARD_SHADOW, {clean: true}),
    S(xRect(f, L.WIN, 4), STR, 2 * sw, {seed: `${seed}:win`}),
    // the lid's blank back, folded up, and its score line with two ticks
    Fl(xRect(f, L.LID, 3), L.LID_BACK, {clean: true}),
    S(xRect(f, L.LID, 3), STR, 2 * sw, {seed: `${seed}:lid`}),
    S(linePath(xPt(f, [L.WIN.x, L.WIN.y + 4]), xPt(f, [L.WIN.x, L.WIN.y + L.WIN.h - 4])), STR, 3 * sw, {clean: true}),
    S(linePath(xPt(f, [L.WIN.x - 4, L.WIN.y + 30]), xPt(f, [L.WIN.x + 4, L.WIN.y + 30])), STR, 2 * sw, {clean: true}),
    S(linePath(xPt(f, [L.WIN.x - 4, L.WIN.y + L.WIN.h - 30]), xPt(f, [L.WIN.x + 4, L.WIN.y + L.WIN.h - 30])), STR, 2 * sw, {clean: true}),
  ];
  const stubMarks: Mark[] = [];
  if (stubs) {
    // the standby channel and the board trace arriving at the lookout (true geometry ×k)
    const sb = [xPt(f, [1000, 760]), xPt(f, [1000, 828]), xPt(f, [950, 828])] as Pt[];
    const sbD = routePath(sb, 10 * k);
    stubMarks.push(S(sbD, TH.energy, 6 * k, {clean: true, role: 'energy'}));
    stubMarks.push(S(routePath([xPt(f, [1004, 760]), xPt(f, [1004, 832]), xPt(f, [950, 832])], 10 * k), STR, 2 * sw, {clean: true}));
    stubMarks.push(S(routePath([xPt(f, [996, 760]), xPt(f, [996, 824]), xPt(f, [950, 824])], 10 * k), STR, 2 * sw, {clean: true}));
    stubMarks.push(S(routePath([xPt(f, [994, 900]), xPt(f, [994, 852]), xPt(f, [950, 852])], 8 * k), STR, 3 * sw, {clean: true}));
  }
  // the "?" block: grey outline, no fill when off
  const qMarks: Mark[] = [S(qPath, STR, 3 * sw, {seed: `${seed}:qb`})];
  const qOn: Mark[] = [S(qPath, INK, 4.5 * sw, {seed: `${seed}:qbOn`})];
  // the lookout: inked, white, its pip breathing from f0 (never wicks, never changes glyph)
  const lkPath = rectPath(lk.x, lk.y, lk.w, lk.h, 8 * k);
  const lookMarks: Mark[] = [
    Fl(lkPath, WHITE, {clean: true}),
    S(lkPath, INK, 4.5 * sw, {seed: `${seed}:look`}),
    ...pipMarks(lk.x + lk.w - 14 * k, lk.y + 14 * k, 'always', frame, k),
  ];
  const badge = xPt(f, L.QBADGE);
  if (part === 'base') return <Marks marks={base} seed={`${seed}:base`} frame={frame} />;
  return (
    <g>
      {part === 'all' ? <Marks marks={base} seed={`${seed}:base`} frame={frame} /> : null}
      {part === 'all' ? <Marks marks={stubMarks} seed={`${seed}:stubs`} frame={frame} /> : null}
      {st.qFill > 0 ? <Marks marks={[Fl(qPath, WHITE, {clean: true, o: st.qFill})]} seed={`${seed}:qfill`} frame={frame} /> : null}
      <Marks marks={qMarks} seed={`${seed}:q`} frame={frame} />
      {st.qInk > 0 ? (
        <WickMask d={qPath} cause={0} p={st.qInk} width={4.5 * sw} seed={`${seed}wick`}>
          <Marks marks={qOn} seed={`${seed}:qon`} frame={frame} />
        </WickMask>
      ) : null}
      {st.qPip > 0 ? <Marks marks={pipMarks(qb.x + qb.w - 14 * k, qb.y + 14 * k, 'on', frame, k, st.qPip)} seed={`${seed}:qpip`} frame={frame} /> : null}
      <Marks marks={qBadgeMarks(badge[0], badge[1], k, st.badge)} seed={`${seed}:badge`} frame={frame} />
      <Marks marks={lookMarks} seed={`${seed}:lk`} frame={frame} />
      {st.clock > 0 ? (
        <Bloom marks={clockMarks(xX(f, L.CLOCK.cx), xY(f, L.CLOCK.cy), L.CLOCK.r * k, k)} p={st.clock} seed={`${seed}clock`} frame={frame} />
      ) : null}
      {st.eye > 0 ? (
        <Bloom marks={eyeMarks(xX(f, L.EYE.x), xY(f, L.EYE.y), L.EYE.w * k, Math.min(k, 2.2), !!st.eyeChip)} p={st.eye} seed={`${seed}eye`} frame={frame} />
      ) : null}
    </g>
  );
};

export const Q_OUTLINE_CAUSE = rectCause(L.QB.w, L.QB.h, 'topLeft');
