/**
 * The notes page: small numbered, wordless result notes that accumulate in the right-page column and
 * never leave. Inked notes bloom in 8 frames inside pauses; notes 3 and 4 arrive as filed cards
 * (cards.tsx). By f1889 the column is the intro's visual summary.
 *   1  the button's thin line ends in an end-tick, beside an empty double-walled stub (S03)
 *   2  the chain stub: only slot 1 awake, the power segment empty, the "?" outlined, the rest hollow (S06)
 *   3  the promise: Restart vs Shut down (filed card, S08)
 *   4  the stops: AMD and laptops (filed cards, S09)
 *   5  plugged in + rear switch on, each ticked (S10)
 *   6  three wake inputs converging on the lookout (S11, the optional fix)
 */
import React from 'react';
import {EASE, MONO, circlePath, progress, rectPath, squarePath} from '../../shared';
import {F} from './frames';
import * as L from './layout';
import {Bloom, Fl, Marks, S, T, type Mark} from './nib';
import {TH} from './parts';

const INK = TH.ink;
const STR = TH.structure;
const WHITE = '#FFFFFF';

const numeral = (n: number): Mark => {
  const b = L.noteBox(n);
  return T(b.x + 6, b.y + 39, String(n), 30, TH.textMuted, MONO, {weight: 500});
};

const tickSmall = (x: number, y: number): Mark => S(`M${x} ${y + 7}L${x + 5} ${y + 12}L${x + 16} ${y}`, INK, 2.6, {cap: 'round', join: 'round', clean: true});

const n1: Mark[] = (() => {
  const {x, y} = L.noteBox(1);
  return [
    numeral(1),
    // the push button as on the page (cap with its inner line, on a small grey housing), so it never
    // reads as a "0" beside the numeral ("1 0" looked like "10")
    Fl(rectPath(x + 50, y + 12, 14, 16, 2), WHITE, {clean: true}),
    S(rectPath(x + 50, y + 12, 14, 16, 2), STR, 2.2, {clean: true}),
    Fl(rectPath(x + 38, y + 6, 13, 28, 4), WHITE, {clean: true}),
    S(rectPath(x + 38, y + 6, 13, 28, 4), INK, 3, {seed: 'n1:btn'}),
    S(`M${x + 43} ${y + 12}L${x + 43} ${y + 28}`, INK, 1.8, {clean: true, cap: 'round'}),
    S(`M${x + 64} ${y + 20}L${x + 124} ${y + 20}`, STR, 2.5, {seed: 'n1:line'}),
    S(`M${x + 124} ${y + 9}L${x + 124} ${y + 31}`, INK, 3, {clean: true}),
    S(`M${x + 52} ${y + 40}L${x + 196} ${y + 40}`, STR, 2, {seed: 'n1:w1'}),
    S(`M${x + 52} ${y + 52}L${x + 196} ${y + 52}`, STR, 2, {seed: 'n1:w2'}),
  ];
})();

const n2: Mark[] = (() => {
  const {x, y} = L.noteBox(2);
  const out: Mark[] = [numeral(2)];
  const cy = y + 28;
  const xs = [0, 1, 2, 3, 4, 5].map((i) => x + 40 + i * 30);
  for (let i = 0; i < 5; i++) out.push(S(`M${xs[i] + 16} ${cy}L${xs[i + 1]} ${cy}`, STR, 2, {clean: true}));
  // 1: awake (inked, its pip filled)
  out.push(Fl(rectPath(xs[0], cy - 8, 16, 16, 3), WHITE, {clean: true}));
  out.push(S(rectPath(xs[0], cy - 8, 16, 16, 3), INK, 3, {seed: 'n2:1'}));
  out.push(Fl(squarePath(xs[0] + 8, cy, 6, 1), INK, {clean: true}));
  // 2: the power segment, empty (power is off in the present)
  out.push(S(`M${xs[1] - 4} ${cy - 5}L${xs[1] + 20} ${cy - 5}`, STR, 2, {clean: true}));
  out.push(S(`M${xs[1] - 4} ${cy + 5}L${xs[1] + 20} ${cy + 5}`, STR, 2, {clean: true}));
  // 3: the "?" badge, outlined
  out.push(Fl(rectPath(xs[2], cy - 8, 16, 16, 4), WHITE, {clean: true}));
  out.push(S(rectPath(xs[2], cy - 8, 16, 16, 4), TH.emphasis, 2.5, {clean: true}));
  // 4–6: hollow
  for (let i = 3; i < 6; i++) out.push(S(rectPath(xs[i], cy - 8, 16, 16, 3), STR, 2.5, {seed: `n2:${i}`}));
  return out;
})();

const n5: Mark[] = (() => {
  const {x, y} = L.noteBox(5);
  return [
    numeral(5),
    Fl(`M${x + 40} ${y + 10}H${x + 64}V${y + 30}L${x + 58} ${y + 36}H${x + 46}L${x + 40} ${y + 30}Z`, WHITE, {clean: true}),
    S(`M${x + 40} ${y + 10}H${x + 64}V${y + 30}L${x + 58} ${y + 36}H${x + 46}L${x + 40} ${y + 30}Z`, INK, 2.6, {seed: 'n5:plug'}),
    S(`M${x + 52} ${y + 36}L${x + 52} ${y + 52}`, INK, 2.4, {clean: true}),
    tickSmall(x + 72, y + 14),
    Fl(rectPath(x + 116, y + 8, 18, 30, 3), WHITE, {clean: true}),
    S(rectPath(x + 116, y + 8, 18, 30, 3), INK, 2.6, {seed: 'n5:rocker'}),
    S(`M${x + 117} ${y + 23}L${x + 133} ${y + 23}`, INK, 1.6, {clean: true}),
    S(`M${x + 125} ${y + 12}L${x + 125} ${y + 19}`, INK, 2, {clean: true}),
    tickSmall(x + 142, y + 14),
  ];
})();

const n6: Mark[] = (() => {
  const {x, y} = L.noteBox(6);
  const lx = x + 168;
  const ly = y + 18;
  const target = (dy: number) => `${lx} ${ly + 10 + dy}`;
  return [
    numeral(6),
    // the button
    Fl(rectPath(x + 40, y + 4, 10, 16, 2), WHITE, {clean: true}),
    S(rectPath(x + 40, y + 4, 10, 16, 2), INK, 2.4, {clean: true}),
    S(`M${x + 50} ${y + 12}L${target(-5)}`, STR, 2, {clean: true}),
    // the network jack
    S(`M${x + 40} ${y + 24}h14v12h-4v-3h-6v3h-4Z`, STR, 2.2, {clean: true}),
    S(`M${x + 54} ${y + 30}L${target(0)}`, STR, 2, {clean: true}),
    // the clock
    Fl(circlePath(x + 47, y + 48, 7), WHITE, {clean: true}),
    S(circlePath(x + 47, y + 48, 7), STR, 2, {clean: true}),
    S(`M${x + 54} ${y + 48}L${target(5)}`, STR, 2, {clean: true}),
    // the lookout
    Fl(rectPath(lx, ly, 20, 20, 3), WHITE, {clean: true}),
    S(rectPath(lx, ly, 20, 20, 3), INK, 3, {seed: 'n6:look'}),
    Fl(squarePath(lx + 10, ly + 10, 6, 1), INK, {clean: true}),
  ];
})();

/** Notes 1, 2, 5, 6 (inked), plus the numerals of the filed notes 3 and 4. */
export const Notes: React.FC<{frame: number; only?: number[]}> = ({frame, only}) => {
  const show = (n: number) => !only || only.includes(n);
  const p = (at: number) => progress(frame, at, 8, EASE.arrive);
  return (
    <g>
      {show(1) ? <Bloom marks={n1} p={p(F.n1)} seed="n1" frame={frame} /> : null}
      {show(2) ? <Bloom marks={n2} p={p(F.n2)} seed="n2" frame={frame} /> : null}
      {show(3) ? <Bloom marks={[numeral(3)]} p={p(F.card8File + 8)} seed="n3" frame={frame} /> : null}
      {show(4) ? <Bloom marks={[numeral(4)]} p={p(F.stopsFile + 4)} seed="n4" frame={frame} /> : null}
      {show(5) ? <Bloom marks={n5} p={p(F.n5)} seed="n5" frame={frame} /> : null}
      {show(6) ? <Bloom marks={n6} p={p(F.n6)} seed="n6" frame={frame} /> : null}
    </g>
  );
};

/** The right page's ruled lines (for ghosting through the list sheet). */
export const RuledLines: React.FC = () => {
  const ys: number[] = [];
  for (let y = L.RULE.y0; y < 1080; y += L.RULE.pitch) ys.push(y);
  return (
    <g>
      {ys.map((y) => (
        <rect key={y} x={L.SPREAD.rightX0} y={y - L.RULE.w / 2} width={1920 - L.SPREAD.rightX0} height={L.RULE.w} fill={L.RULE.color} />
      ))}
    </g>
  );
};

export {Marks};
