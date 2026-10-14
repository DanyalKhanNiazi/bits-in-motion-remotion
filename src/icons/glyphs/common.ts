/**
 * Shared helpers for the screen-space glyphs (ICONS.md §5). Glyphs are pure functions of `frame` and their own timing
 * props, drawn in SCREEN px at a projected point (the engine places them; icons place docked ones with AtScreen).
 */
import {pathLength} from '../../shared/geom';
import {clamp01, prog} from '../primitives';

/** Fade-in (arrive) from `inAt` over `dur`, fade-out (exit) from `outAt` over `outDur`. 1 when no timing given. */
export const inOut = (frame: number, inAt?: number, dur = 6, outAt?: number, outDur = 6): number => {
  const a = inAt === undefined ? 1 : prog(frame, inAt, dur, 'arrive');
  const b = outAt === undefined ? 1 : 1 - prog(frame, outAt, outDur, 'exit');
  return clamp01(Math.min(a, b));
};

/**
 * strokeDasharray that shows a DASHED line drawn on to fraction `t` of its length (dashed from the very first frame:
 * no solid-then-dashed switch). `L` = path length, `dash` = [on, off] in the same units.
 */
export const dashedReveal = (L: number, dash: readonly [number, number] | readonly number[], t: number): string | undefined => {
  const shown = L * clamp01(t);
  if (t >= 1) return dash.join(' ');
  const out: number[] = [];
  let acc = 0;
  let on = true;
  let i = 0;
  while (acc < shown - 1e-6 && i < 10000) {
    const seg = Math.min(dash[i % dash.length], shown - acc);
    out.push(seg);
    acc += seg;
    on = !on;
    i++;
  }
  if (out.length === 0) return `0 ${L + 1}`;
  if (on) out.push(0); // ended on a gap: add an empty dash so the big gap stays a gap
  out.push(L + 1);
  return out.map((v) => Math.round(v * 100) / 100).join(' ');
};

/** Solid draw-on dasharray for fraction t of length L. */
export const solidReveal = (L: number, t: number): string => `${Math.round(L * clamp01(t) * 100) / 100} ${Math.round((L + 1) * 100) / 100}`;

export const lengthOf = (d: string): number => pathLength(d);

/** 1 → peak → 1 over `dur` frames from each accent frame (sine bump). */
export const accentScale = (frame: number, ats: readonly number[] | undefined, peak = 1.12, dur = 6): number => {
  if (!ats) return 1;
  let s = 1;
  for (const a of ats) {
    const t = (frame - a) / dur;
    if (t > 0 && t < 1) s = Math.max(s, 1 + (peak - 1) * Math.sin(Math.PI * t));
  }
  return s;
};

/** Props of the wake-source glyphs (NetJackGlyph, ClockGlyph). */
export interface WakeGlyphProps {
  x: number;
  y: number;
  frame: number;
  inAt?: number;
  outAt?: number;
  /** 0..1 tone step structure → textMuted (pointed at). */
  pointed?: number;
  size?: number;
}

/** Wake-glyph pop: scale 0.6 → 1 over 6 frames (arrive) from `inAt`. */
export const popScale = (frame: number, inAt?: number): number => (inAt === undefined ? 1 : 0.6 + 0.4 * prog(frame, inAt, 6, 'arrive'));
