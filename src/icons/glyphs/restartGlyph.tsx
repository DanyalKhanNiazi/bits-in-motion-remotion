/**
 * RestartGlyph (ICONS.md §5.12): a 300° clockwise arc with an arrowhead (↻), 3 px `ink`, 32 px by default.
 * `draw` 0..1 draws the arc, then the head. (x, y) is its centre, SCREEN px.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {arcD, clamp01, polar, polyD} from '../primitives';

export interface RestartGlyphProps {
  x: number;
  y: number;
  size?: number;
  stroke?: number;
  color?: string;
  draw?: number;
  opacity?: number;
}
export const RestartGlyph: React.FC<RestartGlyphProps> = ({x, y, size = 32, stroke = 3, color = COLOR.ink, draw = 1, opacity = 1}) => {
  if (draw <= 0 || opacity <= 0) return null;
  const R = (size - stroke) / 2 - size * 0.06;
  const a0 = -50; // 1:20 o'clock
  const a1 = 250; // 11:20 o'clock, travelling clockwise
  const ta = clamp01(draw / 0.85);
  const end = a0 + (a1 - a0) * ta;
  const arc = arcD(x, y, R, a0, end);
  const head = clamp01((draw - 0.75) / 0.25);
  const tip = polar(x, y, R, end);
  // tangent (clockwise travel) at `end`
  const rad = (end * Math.PI) / 180;
  const tx = -Math.sin(rad);
  const ty = Math.cos(rad);
  const nx = Math.cos(rad);
  const ny = Math.sin(rad);
  const hl = size * 0.3 * head;
  const hw = size * 0.2 * head;
  const p0: [number, number] = [tip[0] + tx * hl * 0.55, tip[1] + ty * hl * 0.55];
  const p1: [number, number] = [tip[0] - tx * hl * 0.45 + nx * hw, tip[1] - ty * hl * 0.45 + ny * hw];
  const p2: [number, number] = [tip[0] - tx * hl * 0.45 - nx * hw, tip[1] - ty * hl * 0.45 - ny * hw];
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      <path d={arc} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" />
      {head > 0 ? <path d={polyD([p0, p1, p2])} fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" /> : null}
    </g>
  );
};
