/**
 * ApproxChip (ICONS.md §5.4): the analogy marker. 32 × 28, r 6, `deck` tile with a 2 px `annotation` border and a
 * vector ≈ (two 2 px sine strokes; the font subset has no U+2248). (x, y) is the chip centre. Pops in over 4 frames.
 */
import React from 'react';
import {COLOR, GLYPH2} from '../../engine/tokens';
import {fx, prog, rectD} from '../primitives';

export interface ApproxChipProps {
  x: number;
  y: number;
  frame: number;
  inAt?: number;
  outAt?: number;
  opacity?: number;
  color?: string;
}

export const approxWave = (x0: number, y: number, len: number, amp: number): string => {
  const q = len / 4;
  return `M${fx(x0)} ${fx(y)}Q${fx(x0 + q)} ${fx(y - amp * 2)} ${fx(x0 + 2 * q)} ${fx(y)}T${fx(x0 + 4 * q)} ${fx(y)}`;
};

export const ApproxChip: React.FC<ApproxChipProps> = ({x, y, frame, inAt, outAt, opacity = 1, color = COLOR.annotation}) => {
  const tin = inAt === undefined ? 1 : prog(frame, inAt, 4, 'arrive');
  const tout = outAt === undefined ? 0 : prog(frame, outAt, 6, 'exit');
  const o = opacity * tin * (1 - tout);
  if (o <= 0) return null;
  const {w, h, r, stroke} = GLYPH2.approxChip;
  const sc = 0.8 + 0.2 * tin;
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(sc)})`} opacity={o < 1 ? o : undefined}>
      <path d={rectD({x: -w / 2 + stroke / 2, y: -h / 2 + stroke / 2, w: w - stroke, h: h - stroke}, r)} fill={COLOR.deck} stroke={color} strokeWidth={stroke} />
      <path
        d={approxWave(-9, -3.6, 18, 2.4) + approxWave(-9, 3.6, 18, 2.4)}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};
