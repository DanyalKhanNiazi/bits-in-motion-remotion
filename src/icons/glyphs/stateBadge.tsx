/**
 * StateBadge (ICONS.md §5.6): the 28 px, r 6 state badge: ‖ waiting (ink), ! limit and × fault (alert; the part
 * carries the alert hatch). Pops in over 4 frames from `inAt`. (x, y) is the badge centre, SCREEN px.
 */
import React from 'react';
import {BadgeShape, fx, prog} from '../primitives';
import {inOut} from './common';

export interface StateBadgeProps {
  x: number;
  y: number;
  frame: number;
  kind: 'waiting' | 'limit' | 'fault';
  inAt?: number;
  outAt?: number;
}
export const StateBadge: React.FC<StateBadgeProps> = ({x, y, frame, kind, inAt, outAt}) => {
  const o = inOut(frame, inAt, 4, outAt, 6);
  if (o <= 0) return null;
  const s = inAt === undefined ? 1 : 0.7 + 0.3 * prog(frame, inAt, 4, 'arrive');
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(s)})`}>
      <BadgeShape kind={kind} opacity={o} />
    </g>
  );
};
