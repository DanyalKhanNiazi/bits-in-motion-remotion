/**
 * Easing (ENGINE.md §2): one function per token curve (tokens EASE_BEZIER), built with Remotion's Easing.bezier.
 */
import {Easing} from 'remotion';
import {EASE_BEZIER, type EaseName} from '../tokens';
import {clamp01} from './math';

export type EaseFn = (t: number) => number;
export type {EaseName};

const build = (name: EaseName): EaseFn => {
  if (name === 'linear') return (t: number) => t;
  const [a, b, c, d] = EASE_BEZIER[name];
  return Easing.bezier(a, b, c, d);
};

/** Functions for every token curve. */
export const EASE6 = Object.fromEntries((Object.keys(EASE_BEZIER) as EaseName[]).map((k) => [k, build(k)])) as Record<
  EaseName,
  EaseFn
>;

/** 0 → 1 over [at, at + dur] with an ease; dur <= 0 is a step at `at`. */
export const prog = (frame: number, at: number, dur: number, ease: EaseName = 'linear'): number => {
  if (dur <= 0) return frame >= at ? 1 : 0;
  const u = clamp01((frame - at) / dur);
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return EASE6[ease](u);
};

/**
 * 1 while at <= frame < to. With `fade`, it eases in over [at, at + fade] ('arrive') and out over [to − fade, to]
 * ('exit'), so it is still 0 from `to` on.
 */
export const between = (frame: number, at: number, to: number, fade = 0): number => {
  if (frame < at || frame >= to) return 0;
  if (fade <= 0) return 1;
  return Math.min(prog(frame, at, fade, 'arrive'), 1 - prog(frame, to - fade, fade, 'exit'));
};

export {logLerp} from './math';
