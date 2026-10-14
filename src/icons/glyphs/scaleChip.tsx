/**
 * ScaleChip (ICONS.md §5.10): the Lens scale chip: mono 30 px text ("×4") on a `deck` tile with a 2 px `structure`
 * border and 10 px padding. Pops in over 4 frames from `inAt`, exits over 6 from `outAt`. (x, y) is its centre.
 */
import React from 'react';
import {COLOR, GLYPH2, TYPE} from '../../engine/tokens';
import {MONO, monoWidth} from '../../shared/fonts';
import {fx, prog, rectD} from '../primitives';
import {inOut} from './common';

export interface ScaleChipProps {
  x: number;
  y: number;
  frame: number;
  text?: string;
  inAt?: number;
  outAt?: number;
}
export const scaleChipSize = (text: string) => {
  const w = monoWidth(text, TYPE.chip) + 2 * GLYPH2.scaleChipPad;
  const h = Math.round(TYPE.chip * 1.15) + 2 * 6;
  return {w, h};
};
export const ScaleChip: React.FC<ScaleChipProps> = ({x, y, frame, text = '×4', inAt, outAt}) => {
  const o = inOut(frame, inAt, 4, outAt, 6);
  if (o <= 0) return null;
  const {w, h} = scaleChipSize(text);
  const s = inAt === undefined ? 1 : 0.85 + 0.15 * prog(frame, inAt, 4, 'arrive');
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(s)})`} opacity={o < 1 ? o : undefined}>
      <path d={rectD({x: -w / 2 + 1, y: -h / 2 + 1, w: w - 2, h: h - 2}, 8)} fill={COLOR.deck} stroke={COLOR.structure} strokeWidth={2} />
      <text x={0} y={1} fill={COLOR.annotation} fontFamily={MONO} fontWeight={TYPE.weight.mono} fontSize={TYPE.chip} textAnchor="middle" dominantBaseline="central">
        {text}
      </text>
    </g>
  );
};
