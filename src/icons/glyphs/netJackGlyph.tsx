/**
 * NetJackGlyph (ICONS.md §5.14): wake source "network": an RJ45 face (opening with the latch notch, 4 contact ticks)
 * on a 56 px `deck` tile, 3 px `structure` (`pointed` steps it to textMuted). Pops in over 6 frames from `inAt`.
 */
import React from 'react';
import {COLOR, GLYPH2} from '../../engine/tokens';
import {clamp01, fx, lineD, mix, polyD, rectD} from '../primitives';
import {inOut, popScale, type WakeGlyphProps} from './common';

export const NetJackGlyph: React.FC<WakeGlyphProps> = ({x, y, frame, inAt, outAt, pointed = 0, size = GLYPH2.wakeGlyph}) => {
  const o = inOut(frame, inAt, 6, outAt, 6);
  if (o <= 0) return null;
  const k = size / 56;
  const col = mix(COLOR.structure, COLOR.textMuted, clamp01(pointed));
  const s = popScale(frame, inAt);
  // jack opening: 36 × 24 body with an 14 × 8 latch notch below
  const pts: Array<[number, number]> = [
    [-18, -14],
    [18, -14],
    [18, 10],
    [7, 10],
    [7, 17],
    [-7, 17],
    [-7, 10],
    [-18, 10],
  ].map(([u, v]) => [u * k, v * k]);
  const ticks = [-10.5, -3.5, 3.5, 10.5].map((u) => lineD(u * k, -9 * k, u * k, -3 * k)).join('');
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(s)})`} opacity={o < 1 ? o : undefined}>
      <path d={rectD({x: -27 * k, y: -27 * k, w: 54 * k, h: 54 * k}, 10 * k)} fill={COLOR.deck} stroke={col} strokeWidth={2} />
      <path d={polyD(pts)} fill={COLOR.side} stroke={col} strokeWidth={3} strokeLinejoin="round" />
      <path d={ticks} stroke={col} strokeWidth={3} strokeLinecap="butt" />
    </g>
  );
};
