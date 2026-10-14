/**
 * Cutout cards (alternatives and promises) with identical base geometry, laid over the left page's CPU
 * region: they slide in for 12 frames (Move) and land as their contact shadow grows 2 → 4 px, then
 * leave by being FILED: slide to their note slot while shrinking to note size (words fade in the first
 * 4 frames). After filing they stay on the notes page as notes 3 and 4.
 */
import React from 'react';
import {EASE, SANS, clamp01, lerp, progress, rectPath, circlePath} from '../../shared';
import {F} from './frames';
import * as L from './layout';
import {Bloom, Marks, S, Fl, T, type Mark} from './nib';
import {TH} from './parts';

const WHITE = '#FFFFFF';
const INK = TH.ink;
const STR = TH.structure;

interface CardMotion {
  /** Card box at rest (full size). */
  box: L.Box;
  inAt: number;
  fileAt: number;
  fileFrames: number;
  /** Where its top-left lands on the notes page, and the note scale. */
  to: {x: number; y: number; s: number};
}

const motion = (frame: number, m: CardMotion) => {
  const inP = progress(frame, m.inAt, 12, EASE.move);
  const fileP = progress(frame, m.fileAt, m.fileFrames, EASE.move);
  const x0 = lerp(-m.box.w - 60, m.box.x, inP);
  const x = lerp(x0, m.to.x, fileP);
  const y = lerp(m.box.y, m.to.y, fileP);
  const s = lerp(1, m.to.s, fileP);
  const shadow = lerp(2, 4, clamp01((frame - (m.inAt + 9)) / 3));
  const words = 1 - progress(frame, m.fileAt, 4, EASE.exit);
  return {x, y, s, shadow, words, visible: frame >= m.inAt};
};

const Plate: React.FC<{w: number; h: number; shadow: number; frame: number; seed: string}> = ({w, h, shadow, frame, seed}) => (
  <Marks
    seed={seed}
    frame={frame}
    marks={[
      Fl(rectPath(0, shadow, w, h, 8), L.CARD_SHADOW, {clean: true}),
      Fl(rectPath(0, 0, w, h, 8), WHITE, {clean: true}),
      S(rectPath(0, 0, w, h, 8), STR, 2.5, {seed: `${seed}:edge`}),
    ]}
  />
);

/* ------------------------------------------------------------------------------------------------
 * S08: the promise card (a fork with a plain "?", Restart and Shut down), filed as note 3
 * ---------------------------------------------------------------------------------------------- */

const CARD8_MOTION: CardMotion = {
  box: L.CARD8,
  inAt: F.card8In,
  fileAt: F.card8File,
  fileFrames: 12,
  to: {x: L.NOTE_COLS[0] + 34, y: L.NOTE_ROWS[1], s: 56 / L.CARD8.h},
};

const restartGlyph = (cx: number, cy: number): Mark[] => {
  const r = 13;
  const a0 = (-60 * Math.PI) / 180;
  const a1 = (250 * Math.PI) / 180;
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  return [
    S(`M${p0[0]} ${p0[1]}A${r} ${r} 0 1 1 ${p1[0]} ${p1[1]}`, INK, 3, {cap: 'round', clean: true}),
    Fl(`M${p0[0] + 7} ${p0[1] - 6}L${p0[0] - 3} ${p0[1] - 9}L${p0[0] + 1} ${p0[1] + 2}Z`, INK, {clean: true}),
  ];
};

const powerGlyph = (cx: number, cy: number): Mark[] => {
  const r = 13;
  const a0 = (-55 * Math.PI) / 180;
  const a1 = (235 * Math.PI) / 180;
  return [
    S(`M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)}A${r} ${r} 0 1 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`, INK, 3, {cap: 'round', clean: true}),
    S(`M${cx} ${cy - 17}L${cx} ${cy - 2}`, INK, 3, {cap: 'round', clean: true}),
  ];
};

const forkMarks: Mark[] = [
  S('M28 174L90 174', INK, 3.5, {seed: 'fork:stem', cap: 'round'}),
  T(112, 191, '?', 44, INK, SANS, {weight: 700, anchor: 'middle'}),
  S('M132 174L132 132Q132 124 140 124L148 124', INK, 3.5, {seed: 'fork:up', cap: 'round'}),
  S('M132 174L132 216Q132 224 140 224L148 224', INK, 3.5, {seed: 'fork:down', cap: 'round'}),
];
const restartMarks: Mark[] = [
  Fl(rectPath(148, 96, 250, 56, 12), WHITE, {clean: true}),
  S(rectPath(148, 96, 250, 56, 12), INK, 3.5, {seed: 'btn:restart'}),
  ...restartGlyph(178, 124),
  T(204, 140, 'Restart', 44, INK, SANS),
];
const shutMarks: Mark[] = [
  Fl(rectPath(148, 196, 323, 56, 12), WHITE, {clean: true}),
  S(rectPath(148, 196, 323, 56, 12), INK, 3.5, {seed: 'btn:shut'}),
  ...powerGlyph(178, 226),
  T(204, 240, 'Shut down', 44, INK, SANS),
];

const PromiseCard: React.FC<{frame: number}> = ({frame}) => {
  const m = motion(frame, CARD8_MOTION);
  if (!m.visible) return null;
  const fork = progress(frame, F.fork, 7, EASE.arrive);
  const restart = progress(frame, F.restart - 6, 6, EASE.arrive);
  const shut = progress(frame, F.shutDown - 6, 6, EASE.arrive);
  const why = progress(frame, F.whyDifferent, 5, EASE.arrive);
  const textOp = m.words;
  // words fade while filing; the drawing stays (the note is the mini card)
  const strip = (marks: Mark[]): Mark[] => marks.map((mk) => (mk.k === 't' ? {...mk, o: (mk.o ?? 1) * textOp} : mk));
  return (
    <g transform={`translate(${m.x} ${m.y}) scale(${m.s})`}>
      <Plate w={L.CARD8.w} h={L.CARD8.h} shadow={m.shadow} frame={frame} seed="card8" />
      {why > 0 ? (
        <Marks marks={[T(24 - (1 - why) * 8, 56, 'Why different?', 44, INK, SANS, {o: why * textOp})]} seed="why" frame={frame} />
      ) : null}
      <Bloom marks={strip(forkMarks)} p={fork} seed="fork" frame={frame} />
      <Bloom marks={strip(restartMarks)} p={restart} seed="restart" frame={frame} />
      <Bloom marks={strip(shutMarks)} p={shut} seed="shut" frame={frame} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * S09: the stops (unlit outlines of the real difference), filed together as note 4
 * ---------------------------------------------------------------------------------------------- */

const CARD_A_MOTION: CardMotion = {
  box: L.CARD_A,
  inAt: F.cardAIn,
  fileAt: F.stopsFile,
  fileFrames: 8,
  to: {x: L.NOTE_COLS[1] + 34, y: L.NOTE_ROWS[1], s: 26 / L.CARD_A.h},
};
const CARD_L_MOTION: CardMotion = {
  box: L.CARD_L,
  inAt: F.cardLIn,
  fileAt: F.stopsFile,
  fileFrames: 8,
  to: {x: L.NOTE_COLS[1] + 34, y: L.NOTE_ROWS[1] + 30, s: 26 / L.CARD_L.h},
};

const greyBadge = (cx: number, cy: number): Mark[] => [
  S(rectPath(cx - 17, cy - 17, 34, 34, 7), STR, 2.5, {clean: true}),
  T(cx, cy + 10.5, '?', 30, STR, SANS, {weight: 700, anchor: 'middle'}),
];

/** AMD: one processor package holding both blocks (the always-on logic and the "?"); the chipset is empty. */
const amdMarks: Mark[] = [
  S(rectPath(280, 14, 140, 108, 10), STR, 3, {seed: 'amd:pkg'}),
  S(rectPath(294, 28, 70, 48, 8), STR, 2.5, {seed: 'amd:q'}),
  ...greyBadge(329, 52),
  S(rectPath(378, 84, 28, 28, 5), STR, 2.5, {seed: 'amd:look'}),
  S(rectPath(436, 40, 46, 46, 6), STR, 2.5, {seed: 'amd:fch'}),
];
/** Laptops: the EC as its own chip, and a battery; no ATX supply, no rocker, no +5VSB. */
const laptopMarks: Mark[] = [
  S(rectPath(334, 16, 152, 104, 12), STR, 3, {seed: 'lap:board'}),
  S(rectPath(348, 30, 28, 28, 4), STR, 2.5, {seed: 'lap:ec'}),
  S(rectPath(390, 28, 52, 40, 6), STR, 2.5, {seed: 'lap:soc'}),
  S(rectPath(348, 80, 118, 28, 6), STR, 2.5, {seed: 'lap:bat'}),
  S(rectPath(466, 87, 8, 14, 2), STR, 2, {clean: true}),
];

const StopCard: React.FC<{frame: number; m: CardMotion; title: string; drawing: Mark[]; seed: string}> = ({frame, m: mm, title, drawing, seed}) => {
  const m = motion(frame, mm);
  if (!m.visible) return null;
  return (
    <g transform={`translate(${m.x} ${m.y}) scale(${m.s})`}>
      <Plate w={mm.box.w} h={mm.box.h} shadow={m.shadow} frame={frame} seed={seed} />
      <Marks
        marks={[T(24, 86, title, 44, INK, SANS, {o: m.words}), ...drawing.map((mk) => (mk.k === 't' ? {...mk, o: (mk.o ?? 1) * m.words} : mk))]}
        seed={`${seed}:c`}
        frame={frame}
      />
    </g>
  );
};

export const Cards: React.FC<{frame: number}> = ({frame}) => (
  <g>
    <PromiseCard frame={frame} />
    <StopCard frame={frame} m={CARD_A_MOTION} title="Stop: AMD" drawing={amdMarks} seed="cardA" />
    <StopCard frame={frame} m={CARD_L_MOTION} title="Stop: laptops" drawing={laptopMarks} seed="cardL" />
  </g>
);

export {circlePath};
