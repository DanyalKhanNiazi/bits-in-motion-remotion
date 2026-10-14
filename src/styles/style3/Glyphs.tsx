/**
 * The "?" badge of the hidden processor (brand: 36 px rounded square, 3 px emphasis outline, "?" in sans 700,
 * kit size 30 px; fills with emphasis over 6 frames), in its label slot just outside the chipset, with a short
 * leader to the "?" block. It keeps this slot at every framing (screen-constant size). Unnamed in the intro.
 */
import React from 'react';
import {EASE, GLYPH, SANS, progress, rectPath, type Pt} from '../../shared';
import {T} from './theme';

export interface FillSpan {
  at: number;
  out: number;
}

export const qBadgeFill = (frame: number, spans: FillSpan[]): number => {
  let v = 0;
  for (const s of spans) v = Math.max(v, progress(frame, s.at, GLYPH.qFillFrames, EASE.arrive) * (1 - progress(frame, s.out, GLYPH.qFillFrames, EASE.exit)));
  return v;
};

/** A 6-frame scale accent (1 → 1.12 → 1). */
export const accent = (frame: number, at: number): number => {
  if (frame < at || frame > at + 6) return 1;
  const u = (frame - at) / 6;
  return 1 + 0.12 * Math.sin(Math.PI * u);
};

export const QBadge: React.FC<{c: Pt; leaderTo?: Pt; fill: number; scale?: number; opacity?: number}> = ({c, leaderTo, fill, scale = 1, opacity = 1}) => {
  const b = GLYPH.qBadge * scale;
  const sw = GLYPH.qStroke;
  const box = rectPath(c[0] - b / 2 + sw / 2, c[1] - b / 2 + sw / 2, b - sw, b - sw, GLYPH.qRadius * scale);
  return (
    <g opacity={opacity}>
      {leaderTo ? <path d={`M${c[0] - GLYPH.qBadge / 2} ${c[1]}L${leaderTo[0]} ${leaderTo[1]}`} stroke={T.annotation} strokeWidth={2} fill="none" /> : null}
      <path d={box} fill={T.surface} />
      {fill > 0 ? <path d={box} fill={T.emphasis} fillOpacity={fill} /> : null}
      <path d={box} fill="none" stroke={T.emphasis} strokeWidth={sw} />
      <text
        x={c[0]}
        y={c[1] + 1}
        textAnchor="middle"
        dominantBaseline="central"
        style={{fontFamily: SANS, fontWeight: 700, fontSize: GLYPH.qFont * scale}}
        fill={fill >= 0.5 ? T.surface : T.emphasis}
      >
        ?
      </text>
    </g>
  );
};
