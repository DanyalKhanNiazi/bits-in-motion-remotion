/**
 * ClockGlyph (ICONS.md §5.15): wake source "RTC alarm": a 56 px clock face (`deck`) with two hands at 10:10, 3 px
 * `structure` (`pointed` steps it to textMuted). Pops in over 6 frames from `inAt`. (x, y) is its centre, SCREEN px.
 */
import React from 'react';
import {COLOR, GLYPH2} from '../../engine/tokens';
import {clamp01, discD, fx, lineD, mix, polar} from '../primitives';
import {inOut, popScale, type WakeGlyphProps} from './common';

export const ClockGlyph: React.FC<WakeGlyphProps> = ({x, y, frame, inAt, outAt, pointed = 0, size = GLYPH2.wakeGlyph}) => {
  const o = inOut(frame, inAt, 6, outAt, 6);
  if (o <= 0) return null;
  const k = size / 56;
  const col = mix(COLOR.structure, COLOR.textMuted, clamp01(pointed));
  const s = popScale(frame, inAt);
  const R = 25.5 * k;
  const hour = polar(0, 0, R * 0.5, -90 - 60); // 10 o'clock
  const minute = polar(0, 0, R * 0.74, -90 + 60); // 2 o'clock (10 minutes)
  const ticks = [0, 90, 180, 270]
    .map((a) => {
      const p = polar(0, 0, R - 4.5 * k, a);
      const q = polar(0, 0, R - 9 * k, a);
      return lineD(p[0], p[1], q[0], q[1]);
    })
    .join('');
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(s)})`} opacity={o < 1 ? o : undefined}>
      <path d={discD(0, 0, R)} fill={COLOR.deck} stroke={col} strokeWidth={3} />
      <path d={ticks} stroke={col} strokeWidth={2} strokeLinecap="butt" opacity={0.8} />
      <path d={lineD(0, 0, hour[0], hour[1]) + lineD(0, 0, minute[0], minute[1])} stroke={col} strokeWidth={3} strokeLinecap="round" />
      <path d={discD(0, 0, 2.6 * k)} fill={col} />
    </g>
  );
};
