/**
 * EndTick (ICONS.md §5.9): the 3 × 14 px bar across a wire's true end (S03: the button lead ends at the header). It
 * draws out from its centre over 4 frames from `at`; `angle` is the wire's direction (degrees, 0 = +x, 90 = +y) and the
 * tick is perpendicular to it. SCREEN px.
 */
import React from 'react';
import {COLOR, DUR, STROKE} from '../../engine/tokens';
import {lineD, prog} from '../primitives';
import {inOut} from './common';

export interface EndTickProps {
  x: number;
  y: number;
  frame: number;
  at?: number;
  outAt?: number;
  /** Direction of the wire at its end, degrees (0 = toward +x, 90 = toward +y). The tick is perpendicular. */
  angle?: number;
  color?: string;
}
export const EndTick: React.FC<EndTickProps> = ({x, y, frame, at, outAt, angle = 90, color = COLOR.ink}) => {
  if (at !== undefined && frame < at) return null;
  const t = at === undefined ? 1 : prog(frame, at, DUR.endTickDraw, 'arrive');
  const o = inOut(frame, undefined, 1, outAt, 6);
  if (o <= 0 || t <= 0) return null;
  const a = ((angle + 90) * Math.PI) / 180;
  const half = (STROKE.endTickLength / 2) * t;
  const dx = Math.cos(a) * half;
  const dy = Math.sin(a) * half;
  return (
    <path d={lineD(x - dx, y - dy, x + dx, y + dy)} stroke={color} strokeWidth={STROKE.endTick} strokeLinecap="butt" opacity={o < 1 ? o : undefined} />
  );
};
