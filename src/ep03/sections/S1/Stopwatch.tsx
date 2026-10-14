/**
 * S1: the owner's stopwatch render (N08, 2048², chrome case, navy dial, no hands) as the Read / Write clocks.
 * Hands and readouts are drawn in code. Measured on the PNG: dial centre (1022, 1191), dial radius 503, visible
 * box 421..1624 × 253..1793. One revolution of the hand is 10 s, so 0.03 s barely moves it and 6.5 s sweeps most
 * of the dial. Text sizes are fixed on-screen px (≥ 40) whatever the stopwatch's size.
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {MONO, PAL, Rich, SANS} from '../../kit';
import {clamp01, rgba} from '../../kit';

const SRC = staticFile('ep03/assets/new/N08_stopwatch_a.png');
const IMG = 2048;
const BOX = {cx: (421 + 1624) / 2, cy: (253 + 1793) / 2, w: 1624 - 421};
const DIAL = {cx: 1022, cy: 1191, r: 503};
const REV = 10;

export type StopwatchProps = {
  frame: number;
  /** centre of the visible stopwatch (screen px) and its visible width */
  x: number;
  y: number;
  w: number;
  seconds: number;
  label: string;
  accent: string;
  decimals: number;
  prefix?: string;
  prefixIn?: number;
  running?: boolean;
  stopAt?: number;
  labelSize?: number;
  digitSize?: number;
  opacity?: number;
  /** the label inside the dial (off when the label is set outside, large) */
  showLabel?: boolean;
  /** 0..1 visibility of the readout plate (the hero caption can take over) */
  readoutOpacity?: number;
};

export const Stopwatch: React.FC<StopwatchProps> = ({
  frame: f,
  x,
  y,
  w,
  seconds,
  label,
  accent,
  decimals,
  prefix,
  prefixIn = 0,
  running = false,
  stopAt,
  labelSize = 44,
  digitSize = 60,
  opacity = 1,
  showLabel = true,
  readoutOpacity = 1,
}) => {
  if (opacity <= 0.01) return null;
  const k = w / BOX.w;
  const left = x - BOX.cx * k;
  const top = y - BOX.cy * k;
  const cx = x + (DIAL.cx - BOX.cx) * k;
  const cy = y + (DIAL.cy - BOX.cy) * k;
  const R = DIAL.r * k;
  const ang = (360 * seconds) / REV;
  const a = ((ang - 90) * Math.PI) / 180;
  const L = R * 0.8;
  const tail = R * 0.2;
  const st = stopAt !== undefined && f >= stopAt ? Math.exp(-(f - stopAt) / 5) : 0;
  const pulse = running ? 0.5 + 0.5 * Math.sin(f * 0.6) : 0;
  const hx = cx + Math.cos(a) * L;
  const hy = cy + Math.sin(a) * L;
  const tx = cx - Math.cos(a) * tail;
  const ty = cy - Math.sin(a) * tail;
  // swept arc from 12 o'clock to the hand
  const arcEnd = Math.min(ang, 359.9);
  const ar = R * 0.9;
  const ex = cx + Math.cos(((arcEnd - 90) * Math.PI) / 180) * ar;
  const ey = cy + Math.sin(((arcEnd - 90) * Math.PI) / 180) * ar;
  const arc = arcEnd > 0.5 ? `M ${cx} ${cy - ar} A ${ar} ${ar} 0 ${arcEnd > 180 ? 1 : 0} 1 ${ex} ${ey}` : '';
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity, pointerEvents: 'none'}}>
      <Img src={SRC} style={{position: 'absolute', left, top, width: IMG * k, height: IMG * k, filter: `drop-shadow(0 ${18 * k * 4}px ${40 * k * 4}px rgba(0,0,0,0.55))`}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {/* the elapsed sweep */}
        {arc ? <path d={arc} fill="none" stroke={accent} strokeOpacity={0.55} strokeWidth={Math.max(4, R * 0.05)} strokeLinecap="round" /> : null}
        {/* the hand, its glow and the centre cap */}
        <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={accent} strokeOpacity={0.35} strokeWidth={Math.max(8, R * 0.06)} strokeLinecap="round" />
        <line x1={tx} y1={ty} x2={hx} y2={hy} stroke={st > 0.05 ? '#FFFFFF' : accent} strokeWidth={Math.max(3.5, R * 0.022)} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={Math.max(7, R * 0.055)} fill="#D9DEE6" stroke={accent} strokeWidth={3} />
        {st > 0.02 ? <circle cx={cx} cy={cy} r={R * (1.02 + 0.25 * (1 - st))} fill="none" stroke={accent} strokeOpacity={0.8 * st} strokeWidth={6} /> : null}
      </svg>
      {/* readout in the lower half of the dial: label, then the time */}
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy + R * 0.2,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          padding: '4px 16px 6px',
          borderRadius: 14,
          background: rgba('#070B15', 0.72),
          whiteSpace: 'nowrap',
          opacity: readoutOpacity,
        }}
      >
        <div style={{display: showLabel ? 'flex' : 'none', alignItems: 'center', gap: 10}}>
          <span style={{fontFamily: SANS, fontWeight: 600, fontSize: labelSize, color: PAL.annotation, lineHeight: 1.05}}>{label}</span>
          <span style={{width: 12, height: 12, borderRadius: 6, background: accent, opacity: running ? 0.4 + 0.6 * pulse : 0.9, boxShadow: `0 0 10px ${accent}`}} />
        </div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 8}}>
          {prefix ? (
            <span style={{fontFamily: SANS, fontWeight: 700, fontSize: digitSize * 0.62, color: accent, opacity: clamp01(prefixIn)}}>
              <Rich text={prefix} weight={700} />
            </span>
          ) : null}
          <span
            style={{
              fontFamily: MONO,
              fontWeight: 500,
              fontSize: digitSize,
              lineHeight: 1,
              color: st > 0.05 ? '#FFFFFF' : PAL.ink,
              fontVariantNumeric: 'tabular-nums',
              textShadow: st > 0.02 ? `0 0 ${24 * st}px ${accent}` : `0 0 14px ${rgba(accent, 0.3)}`,
            }}
          >
            {seconds.toFixed(decimals)}
          </span>
          <span style={{fontFamily: SANS, fontWeight: 600, fontSize: digitSize * 0.62, color: PAL.muted}}>s</span>
        </div>
      </div>
    </div>
  );
};
