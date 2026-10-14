/**
 * Signal Score: the TimeMap. One pure function of the absolute frame places PRESS, the playhead ("now")
 * and every event right of PRESS. The axis is ordinal ("Not to scale"): order is true, spacing is not.
 *
 *   M1   f172-f712   PRESS 1180, home 1000  (flash-forward arrival at 1280, writes to 1340, rewind f327-f345)
 *   T1   f713-f725   re-spacing M1 -> M2a   (in the pause after "processor.")
 *   M2a  f725-f926   PRESS 920, home 870    look-ahead layout
 *   pack f926-f944   the ghost V packs into PRESS..PRESS+300 (M2b)
 *   T3   f1257-f1277 M2b -> M3: PRESS 1400, home 1300
 *   S12  f1817-f1837 the playhead steps onto PRESS; from f1839 it rides with the Bit
 *   M4   f1844-      only the region after PRESS stretches x1 -> x6 (log space)
 *
 * Invariants are checked once at load and printed as [kit] warnings by the tools.
 */
import {clamp01, EASE, kitWarn, lerp} from '../../shared/motion';
import {AFTER, MAP} from './layout';
import {F} from './timeline';

/** 0 -> 1 over [f0, f1] with linear velocity ramps of `ramp` frames (trapezoid profile). */
export const trap = (f: number, f0: number, f1: number, ramp = 3): number => {
  const T = f1 - f0;
  if (T <= 0) return f >= f1 ? 1 : 0;
  const t = f - f0;
  if (t <= 0) return 0;
  if (t >= T) return 1;
  const r = Math.min(ramp, T / 2);
  const v = 1 / (T - r);
  if (t < r) return (v * t * t) / (2 * r);
  if (t <= T - r) return (v * r) / 2 + v * (t - r);
  const u = T - t;
  return 1 - (v * u * u) / (2 * r);
};

export const MOVES = {
  ffWrite: {from: F.qWakes, to: F.ffWriteEnd},
  rewind: {from: F.returnStart, to: F.returnEnd},
  t1: {from: 713, to: 725},
  pack: {from: 926, to: 946},
  t3: {from: 1257, to: 1277},
  approach: {from: F.approach, to: F.realPress},
  stretch: {from: F.stretch, to: 1890},
} as const;

const between = (f: number, m: {from: number; to: number}) => f >= m.from && f < m.to;

/** PRESS marker x. */
export const pressX = (f: number): number => {
  if (f < MOVES.t1.from) return MAP.M1.press;
  if (f < MOVES.t1.to) return lerp(MAP.M1.press, MAP.M2.press, trap(f, MOVES.t1.from, MOVES.t1.to));
  if (f < MOVES.t3.from) return MAP.M2.press;
  if (f < MOVES.t3.to) return lerp(MAP.M2.press, MAP.M3.press, trap(f, MOVES.t3.from, MOVES.t3.to));
  return MAP.M3.press;
};

/** "Now" when the playhead is home (present tense). */
export const homeX = (f: number): number => {
  if (f < MOVES.t1.from) return MAP.M1.home;
  if (f < MOVES.t1.to) return lerp(MAP.M1.home, MAP.M2.home, trap(f, MOVES.t1.from, MOVES.t1.to));
  if (f < MOVES.t3.from) return MAP.M2.home;
  if (f < MOVES.t3.to) return lerp(MAP.M2.home, MAP.M3.home, trap(f, MOVES.t3.from, MOVES.t3.to));
  return MAP.M3.home;
};

/* ------------------------------------------------------------------------------------------------
 * M4: the stretch after the real press
 * ---------------------------------------------------------------------------------------------- */

/** Stretch factor of the after-PRESS region: 1 until f1844, then x1 -> x6 eased in log space. */
export const stretchK = (f: number): number => {
  if (f <= MOVES.stretch.from) return 1;
  const t = clamp01((f - MOVES.stretch.from) / (MOVES.stretch.to - MOVES.stretch.from));
  return Math.exp(Math.log(6) * EASE.inOutCubic(t));
};

/** Base (unstretched) S12 route, relative to PRESS at x 1400: drop at PRESS, then 45 deg onto the lookout's tick. */
export const S12 = {
  dropTo: 620, // y where the 45-degree segment starts
  cornerFrame: 1862, // the drop (with its hops) reaches the corner
};

/* ------------------------------------------------------------------------------------------------
 * The playhead
 * ---------------------------------------------------------------------------------------------- */

/** Playhead x while it is drawn (f >= 160). In M4 it rides with the Bit (see s12Bit in score.tsx). */
export const playheadBaseX = (f: number): number => {
  const {M1} = MAP;
  if (f < F.qWakes) return M1.ffArrive;
  if (f <= F.ffWriteEnd) return lerp(M1.ffArrive, M1.ffEnd, clamp01((f - F.qWakes) / (F.ffWriteEnd - F.qWakes)));
  if (f < MOVES.rewind.to) return lerp(M1.ffEnd, M1.home, trap(f, MOVES.rewind.from, MOVES.rewind.to));
  if (f < MOVES.approach.from) return homeX(f);
  if (f < MOVES.approach.to) return lerp(MAP.M3.home, MAP.M3.press, trap(f, MOVES.approach.from, MOVES.approach.to));
  return MAP.M3.press;
};

/** Is the playhead past PRESS (the flash-forward arrival, before the rewind crosses it)? */
export const inFlashForward = (f: number): boolean => f >= F.playheadIn && f < F.returnStart;

/* ------------------------------------------------------------------------------------------------
 * After-PRESS offsets: M1 (flash-forward ghosts), LA (look-ahead slots), P (packed V)
 * ---------------------------------------------------------------------------------------------- */

export type Span = readonly [number, number];

const mixSpan = (a: Span, b: Span, t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** 0 = M1 layout, 1 = look-ahead layout, 2 = packed. Fractional during T1 and the pack. */
export const layoutPhase = (f: number): number => {
  if (f < MOVES.t1.from) return 0;
  if (f < MOVES.t1.to) return trap(f, MOVES.t1.from, MOVES.t1.to);
  if (f < MOVES.pack.from) return 1;
  if (f < MOVES.pack.to) return 1 + trap(f, MOVES.pack.from, MOVES.pack.to);
  return 2;
};

const phaseSpan = (f: number, m1: Span, la: Span, p: Span): [number, number] => {
  const ph = layoutPhase(f);
  const k = stretchK(f);
  const s = ph <= 1 ? mixSpan(m1, la, ph) : mixSpan(la, p, ph - 1);
  return [s[0] * k, s[1] * k];
};

/** Offsets (px from PRESS) of every after-PRESS event at frame f. */
export const offsets = (f: number) => {
  const k = stretchK(f);
  const {la, packed} = AFTER;
  const ph = layoutPhase(f);
  const power = (ph <= 1 ? la.power : lerp(la.power, packed.power, ph - 1)) * k;
  return {
    pulse: 0,
    tick: AFTER.tick * k,
    q: phaseSpan(f, AFTER.ffQ, la.q, packed.q),
    power,
    fw: phaseSpan(f, la.fw, la.fw, packed.fw),
    loader: phaseSpan(f, la.loader, la.loader, packed.loader),
    win: phaseSpan(f, la.win, la.win, packed.win),
    /** Right end of the packed V (the 4b ghost segment ends here once packed). */
    vEnd: (ph <= 1 ? 2000 : lerp(2000, packed.win[1], ph - 1)) * k,
  };
};

/* ------------------------------------------------------------------------------------------------
 * Invariants (Part 1 §2.6 of the proposal), checked over every frame
 * ---------------------------------------------------------------------------------------------- */

const checkInvariants = () => {
  const bad: string[] = [];
  let prevP = pressX(0);
  let prevH = playheadBaseX(F.playheadIn);
  for (let f = 0; f < 1890; f++) {
    const p = pressX(f);
    const h = playheadBaseX(f);
    if (f >= F.playheadIn) {
      if (h - 384 < 100) bad.push(`f${f}: less than 100 px of history left of now (${h.toFixed(0)})`);
      if (f >= F.returnEnd && f <= F.realPress - 1 && !(h < p)) bad.push(`f${f}: playhead ${h.toFixed(1)} not before PRESS ${p.toFixed(1)}`);
      if (f > F.playheadIn && Math.abs(h - prevH) > 36) bad.push(`f${f}: playhead moves ${Math.abs(h - prevH).toFixed(1)} px/frame`);
    }
    if (Math.abs(p - prevP) > 36) bad.push(`f${f}: PRESS moves ${Math.abs(p - prevP).toFixed(1)} px/frame`);
    const o = offsets(f);
    const seq = [o.pulse, o.tick, o.q[0], o.q[1], o.fw[0], o.fw[1], o.loader[0], o.loader[1], o.win[0], o.win[1]];
    if (f >= MOVES.t1.to && seq.some((v, i) => i > 0 && v < seq[i - 1])) bad.push(`f${f}: after-PRESS order broken`);
    const of = offsets(f - 1);
    const moved = Math.max(Math.abs(o.win[1] - of.win[1]) + Math.abs(p - prevP), Math.abs(o.q[1] - of.q[1]) + Math.abs(p - prevP));
    if (f > 1 && f < MOVES.stretch.from && moved > 36) bad.push(`f${f}: a ghost moves ${moved.toFixed(1)} px/frame`);
    prevP = p;
    prevH = h;
  }
  if (playheadBaseX(F.realPress) !== pressX(F.realPress)) bad.push('f1837: the playhead does not reach PRESS');
  for (const b of bad.slice(0, 12)) kitWarn(`style4 TimeMap invariant: ${b}`);
  if (bad.length === 0) kitWarn('style4 TimeMap: all invariants hold (no warning means nothing was checked)');
};
checkInvariants();
