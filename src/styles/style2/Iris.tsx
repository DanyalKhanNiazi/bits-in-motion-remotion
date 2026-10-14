/**
 * The iris: the brand Lens (thin ring, 4 ticks, 9-frame open, x4 scale chip at 4:30), staged Night Signal's
 * way: its canonical place is ON the chipset (a loupe over the part, so no leader is needed), and its view
 * is revealed by a radial wipe that follows the ring's pen as it draws clockwise from 12 o'clock.
 * D24: settleAt fades ring + ticks to a grey rim (the view stays open) before the "?" fills.
 * Timing and geometry come from the kit's lensState().
 */
import React from 'react';
import {lensState, circlePath, linePath, rectPath, LENS, TYPE, MONO, monoWidth, type Pt} from '../../shared';
import {T} from './tones';

export interface IrisProps {
  frame: number;
  cx: number;
  cy: number;
  d: number;
  openAt: number;
  settleAt?: number;
  closeAt?: number;
  /** Hard end (a cut): not drawn from this frame. */
  endAt?: number;
  chip?: string;
  /** Chip angle, degrees clockwise from 12 o'clock (brand default 135 = 4:30). */
  chipDeg?: number;
  interior: string;
  children?: React.ReactNode;
  clipId: string;
}

const wedge = (cx: number, cy: number, r: number, frac: number): string => {
  if (frac >= 0.999) return circlePath(cx, cy, r);
  const a = frac * Math.PI * 2 - Math.PI / 2;
  const x = cx + Math.cos(a) * r;
  const y = cy + Math.sin(a) * r;
  const large = frac > 0.5 ? 1 : 0;
  return `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${large} 1 ${x} ${y}Z`;
};

export const Iris: React.FC<IrisProps> = (p) => {
  if (p.endAt !== undefined && p.frame >= p.endAt) return null;
  const s = lensState(p.frame, {cx: p.cx, cy: p.cy, d: p.d, openAt: p.openAt, settleAt: p.settleAt, closeAt: p.closeAt}, T.emphasis, T.structure);
  if (!s.visible) return null;
  const {cx, cy, r} = s;
  const C = 2 * Math.PI * r;
  const clipR = Math.max(0, r - s.ringWidth / 2);
  // the view is uncovered by a wedge that follows the pen (slightly ahead of the drawn arc)
  const reveal = Math.min(1, s.draw * 1.02);
  let chip: React.ReactNode = null;
  if (p.chip && s.chip > 0) {
    // brand default 4:30; Night Signal's iris sits on the chipset, where 4:30 would cover the button's
    // lead, so its chip sits at 3:00 (centred on the ring's horizontal)
    const deg = p.chipDeg ?? LENS.chipAngleDeg;
    const ang = ((deg - 90) * Math.PI) / 180;
    const fs = TYPE.chip;
    const w = monoWidth(p.chip, fs) + 20;
    const h = Math.round(fs * 1.15) + 8;
    const ax = cx + Math.cos(ang) * (r + 10);
    const ay = cy + Math.sin(ang) * (r + 10) - (deg === 90 ? h / 2 : 0);
    chip = (
      <g opacity={s.chip * s.opacity}>
        <path d={rectPath(ax, ay, w, h, 8)} fill={T.panel} stroke={T.structure} strokeWidth={2} />
        <text x={ax + w / 2} y={ay + h / 2 + 1} textAnchor="middle" dominantBaseline="central" style={{fontFamily: MONO, fontWeight: 500, fontSize: fs}} fill={T.ink}>
          {p.chip}
        </text>
      </g>
    );
  }
  return (
    <g>
      <defs>
        <clipPath id={p.clipId}>
          <path d={wedge(cx, cy, clipR, reveal)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${p.clipId})`} opacity={s.opacity}>
        <rect x={cx - clipR} y={cy - clipR} width={clipR * 2} height={clipR * 2} fill={p.interior} />
        {p.children}
      </g>
      <g opacity={s.opacity}>
        <path
          d={circlePath(cx, cy, r)}
          fill="none"
          stroke={s.ringColor}
          strokeWidth={s.ringWidth}
          strokeOpacity={s.ringOpacity}
          strokeDasharray={s.draw < 1 ? `${C * s.draw} ${C + 10}` : undefined}
        />
        {s.ticks > 0
          ? [0, 90, 180, 270].map((deg) => {
              const a = ((deg - 90) * Math.PI) / 180;
              const len = LENS.tickLength * s.ticks;
              const p0: Pt = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
              const p1: Pt = [cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len)];
              return <path key={deg} d={linePath(p0, p1)} stroke={s.ringColor} strokeWidth={LENS.tickWidth} strokeOpacity={s.ticks * s.ringOpacity} />;
            })
          : null}
      </g>
      {chip}
    </g>
  );
};
