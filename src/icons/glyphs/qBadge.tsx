/**
 * QBadge (ICONS.md §5.2): the "?" badge on the hidden processor. Screen-constant: 44 px (default), 56 (subject),
 * 72 inside a Lens; r 10 (scaled with the size), 3 px `emphasis` outline on a `deck` tile, "?" in Sora 700 at 0.77 ×
 * the size. Fill (6 frames from `fillAt`): `emphasis` rises from the bottom like liquid and the glyph turns `void`
 * where covered (no low-contrast midpoint). `unfillAt` drains it back. Accent: 1 → 1.12 → 1 over 6 frames.
 * (x, y) is the badge centre.
 */
import React from 'react';
import {COLOR, DUR, GLYPH2, TYPE} from '../../engine/tokens';
import {SANS} from '../../shared/fonts';
import {fx, prog, rectD} from '../primitives';
import {accentScale} from './common';

export interface QBadgeProps {
  x: number;
  y: number;
  frame: number;
  size?: 'default' | 'subject' | 'lens';
  fillAt?: number;
  unfillAt?: number;
  accentAt?: number[];
  fillFrames?: number;
  opacity?: number;
}

export const qBadgePx = (size: QBadgeProps['size']): number =>
  size === 'subject' ? GLYPH2.qBadgeSubject : size === 'lens' ? GLYPH2.qBadgeLens : GLYPH2.qBadge;

export const QBadge: React.FC<QBadgeProps> = ({x, y, frame, size = 'default', fillAt, unfillAt, accentAt, fillFrames = DUR.qFill, opacity = 1}) => {
  if (opacity <= 0) return null;
  const S = qBadgePx(size);
  const k = S / GLYPH2.qBadge;
  const st = GLYPH2.qStroke;
  const r = GLYPH2.qRadius * k;
  const fIn = fillAt === undefined ? 0 : prog(frame, fillAt, fillFrames, 'arrive');
  const fOut = unfillAt === undefined ? 0 : prog(frame, unfillAt, fillFrames, 'arrive');
  const fill = Math.max(0, fIn - fOut);
  const sc = accentScale(frame, accentAt, 1.12, DUR.qAccent);
  const tile = rectD({x: -S / 2 + st / 2, y: -S / 2 + st / 2, w: S - st, h: S - st}, r);
  const fontSize = Math.round(S * 0.77 * 10) / 10;
  // the "?" sits optically centred: Sora's question mark is a cap-height glyph; nudge down 3.5% of the size
  const glyph = (color: string) => (
    <text
      x={0}
      y={S * 0.035}
      fill={color}
      fontFamily={SANS}
      fontWeight={TYPE.weight.glyph}
      fontSize={fontSize}
      textAnchor="middle"
      dominantBaseline="central"
    >
      ?
    </text>
  );
  const level = S / 2 - fill * S; // clip top edge (rising)
  const cid = `qb-${S}-${Math.round(fill * 1000)}`;
  return (
    <g transform={`translate(${fx(x)} ${fx(y)})${sc !== 1 ? ` scale(${fx(sc)})` : ''}`} opacity={opacity < 1 ? opacity : undefined}>
      <path d={tile} fill={COLOR.deck} />
      {glyph(COLOR.emphasis)}
      {fill > 0 ? (
        <>
          <defs>
            <clipPath id={cid}>
              <rect x={-S / 2} y={level} width={S} height={S / 2 - level} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${cid})`}>
            <path d={tile} fill={COLOR.emphasis} />
            {glyph(COLOR.void)}
          </g>
        </>
      ) : null}
      <path d={tile} fill="none" stroke={COLOR.emphasis} strokeWidth={st} />
    </g>
  );
};
