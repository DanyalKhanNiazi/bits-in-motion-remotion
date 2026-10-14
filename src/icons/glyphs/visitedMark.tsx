/**
 * VisitedMark (ICONS.md §5.5): D24 "visited": a 3 px `annotation` outline of a rect (SCREEN px) that draws on over
 * 8 frames from `at`, with a hollow `annotation` pip docked 8 px outside its top-right corner. Fades from `outAt`.
 */
import React from 'react';
import {COLOR, DUR, GLYPH2} from '../../engine/tokens';
import {prog, rectD, type Rect} from '../primitives';
import {inOut, lengthOf, solidReveal} from './common';

export interface VisitedMarkProps {
  rect: Rect;
  frame: number;
  at?: number;
  outAt?: number;
  r?: number;
  pip?: boolean;
}
export const VisitedMark: React.FC<VisitedMarkProps> = ({rect, frame, at, outAt, r = 8, pip = true}) => {
  if (at !== undefined && frame < at) return null;
  const draw = at === undefined ? 1 : prog(frame, at, DUR.plateFrameDraw, 'arrive');
  const o = inOut(frame, undefined, 6, outAt, 6);
  if (o <= 0) return null;
  const d = rectD(rect, r);
  const L = lengthOf(d);
  const pipIn = at === undefined ? 1 : prog(frame, at + 5, 4, 'arrive');
  const P = GLYPH2.pip;
  const pcx = rect.x + rect.w + GLYPH2.pipDock + P / 2;
  const pcy = rect.y - GLYPH2.pipDock - P / 2;
  return (
    <g opacity={o < 1 ? o : undefined}>
      <path d={d} fill="none" stroke={COLOR.annotation} strokeWidth={GLYPH2.visitedStroke} strokeDasharray={draw < 1 ? solidReveal(L, draw) : undefined} strokeLinejoin="round" />
      {pip && pipIn > 0 ? (
        <path
          d={rectD({x: pcx - (P - 2) / 2, y: pcy - (P - 2) / 2, w: P - 2, h: P - 2}, 1)}
          fill="none"
          stroke={COLOR.annotation}
          strokeWidth={GLYPH2.pipStroke}
          opacity={pipIn}
        />
      ) : null}
    </g>
  );
};
