/**
 * PowerSymbol (ICONS.md §5.13): IEC 60417-5009, a 300° arc open at 12 o'clock with a vertical bar through the gap.
 * Any size. `draw` 0..1 draws the bar (top → down) then the arc (clockwise from the gap's right end).
 * (x, y) is the symbol centre; `size` its bounding box (stroke included).
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {arcD, clamp01, lineD} from '../primitives';

export interface PowerSymbolProps {
  x: number;
  y: number;
  size?: number;
  stroke?: number;
  color?: string;
  draw?: number;
  opacity?: number;
}

/** Half-angle of the gap at 12 o'clock (degrees). */
const GAP = 32;

export const powerSymbolGeometry = (cx: number, cy: number, size: number, stroke: number) => {
  const R = Math.max(0.5, (size - stroke) / 2);
  const arc = arcD(cx, cy, R, -90 + GAP, 270 - GAP);
  const bar = lineD(cx, cy - R, cx, cy - R * 0.06);
  const arcLen = (2 * Math.PI * R * (360 - 2 * GAP)) / 360;
  const barLen = R * 0.94;
  return {R, arc, bar, arcLen, barLen};
};

export const PowerSymbol: React.FC<PowerSymbolProps> = ({x, y, size = 32, stroke = 3, color = COLOR.structure, draw = 1, opacity = 1}) => {
  if (opacity <= 0 || draw <= 0) return null;
  const g = powerSymbolGeometry(x, y, size, stroke);
  const tb = clamp01(draw / 0.35);
  const ta = clamp01((draw - 0.2) / 0.8);
  const common = {fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const};
  return (
    <g opacity={opacity < 1 ? opacity : undefined}>
      {tb > 0 ? (
        <path d={g.bar} {...common} strokeDasharray={tb < 1 ? `${g.barLen * tb} ${g.barLen + 1}` : undefined} />
      ) : null}
      {ta > 0 ? (
        <path d={g.arc} {...common} strokeDasharray={ta < 1 ? `${g.arcLen * ta} ${g.arcLen + 1}` : undefined} />
      ) : null}
    </g>
  );
};
