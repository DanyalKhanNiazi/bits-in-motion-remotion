/**
 * Ripple (ICONS.md §5.8): the landing ripple: a square ring 24 → 80 px, stroke 3 → 1.5, opacity 0.9 → 0 over 10 frames
 * from `at` (tokens BIT2.ripple), in `info` by default. (x, y) is the landing point, SCREEN px.
 */
import React from 'react';
import {BIT2, COLOR} from '../../engine/tokens';
import {ease, lerp, rectD} from '../primitives';

export interface RippleProps {
  x: number;
  y: number;
  frame: number;
  at: number;
  color?: string;
}
export const Ripple: React.FC<RippleProps> = ({x, y, frame, at, color = COLOR.info}) => {
  const R = BIT2.ripple;
  const t = (frame - at) / R.frames;
  if (t < 0 || t >= 1) return null;
  const e = ease('arrive')(t);
  const size = lerp(R.from, R.to, e);
  const st = lerp(R.strokeFrom, R.strokeTo, e);
  const o = R.opacityFrom * (1 - t);
  const rad = BIT2.radius * (size / BIT2.size) * 0.6;
  return (
    <path d={rectD({x: x - size / 2, y: y - size / 2, w: size, h: size}, rad)} fill="none" stroke={color} strokeWidth={st} opacity={o} />
  );
};
