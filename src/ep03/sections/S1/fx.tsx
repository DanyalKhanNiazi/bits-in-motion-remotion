/**
 * S1 effects: speed lines, impact flash, floor shockwave, sparks, lock-on brackets, glass instrument plates.
 * Pure functions of the absolute frame; seeded randomness only.
 */
import React from 'react';
import {EASE, MONO, PAL, SANS, SPRING} from '../../kit';
import {TAU, clamp01, lerp, prog, rgba, rr, springAt} from '../../kit';

/** Radial streaks rushing past the lens (a zoom rush). Strength fades over [from, to]. */
export const SpeedLines: React.FC<{frame: number; from: number; to: number; cx?: number; cy?: number; n?: number; seed?: string}> = ({
  frame: f,
  from,
  to,
  cx = 960,
  cy = 540,
  n = 46,
  seed = 'sl',
}) => {
  if (f < from - 1 || f > to) return null;
  const k = 1 - prog(f, from, to - from, EASE.out);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      {Array.from({length: n}, (_, i) => {
        const a = rr(`${seed}a${i}`, 0, TAU);
        const r0 = rr(`${seed}r${i}`, 260, 900) + (f - from) * rr(`${seed}v${i}`, 40, 90);
        const len = rr(`${seed}l${i}`, 120, 420) * k;
        const x0 = cx + Math.cos(a) * r0;
        const y0 = cy + Math.sin(a) * r0 * 0.75;
        const x1 = cx + Math.cos(a) * (r0 + len);
        const y1 = cy + Math.sin(a) * (r0 + len) * 0.75;
        return (
          <line
            key={i}
            x1={x0}
            y1={y0}
            x2={x1}
            y2={y1}
            stroke={i % 4 === 0 ? PAL.info : '#DDEBFF'}
            strokeOpacity={0.55 * k * rr(`${seed}o${i}`, 0.35, 1)}
            strokeWidth={rr(`${seed}w${i}`, 1.5, 4)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** A light burst at (x, y) that peaks at `at` and decays. */
export const Flash: React.FC<{frame: number; at: number; x: number; y: number; r?: number; color?: string; dur?: number; strength?: number}> = ({
  frame: f,
  at,
  x,
  y,
  r = 700,
  color = PAL.info,
  dur = 10,
  strength = 1,
}) => {
  const d = f - at;
  if (d < -1 || d > dur * 2.5) return null;
  const e = d < 0 ? 0.4 : Math.exp(-d / (dur / 2.4));
  const s = strength * e;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: '50%',
        background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.9 * s)}, ${rgba(color, 0.45 * s)} 32%, ${rgba(color, 0)} 100%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  );
};

/** An expanding ring on the floor (an ellipse) after an impact. */
export const Shockwave: React.FC<{frame: number; at: number; x: number; y: number; r0?: number; r1?: number; dur?: number; flat?: number; color?: string; rings?: number}> = ({
  frame: f,
  at,
  x,
  y,
  r0 = 120,
  r1 = 1100,
  dur = 26,
  flat = 0.2,
  color = PAL.info,
  rings = 2,
}) => {
  const d = f - at;
  if (d < 0 || d > dur + 10) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {Array.from({length: rings}, (_, i) => {
        const u = clamp01((d - i * 4) / dur);
        if (u <= 0 || u >= 1) return null;
        const r = lerp(r0, r1, EASE.outExpo(u));
        const o = (1 - u) * (i === 0 ? 1 : 0.55);
        return (
          <g key={i}>
            <ellipse cx={x} cy={y} rx={r} ry={r * flat} fill="none" stroke={color} strokeOpacity={0.35 * o} strokeWidth={22 * (1 - u) + 4} />
            <ellipse cx={x} cy={y} rx={r} ry={r * flat} fill="none" stroke="#E9FDFF" strokeOpacity={0.8 * o} strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
};

/** Sparks and dust thrown out along a floor line from (x, y). */
export const Sparks: React.FC<{frame: number; at: number; x: number; y: number; n?: number; spread?: number; seed?: string; color?: string; dur?: number}> = ({
  frame: f,
  at,
  x,
  y,
  n = 40,
  spread = 520,
  seed = 'sp',
  color = PAL.info,
  dur = 26,
}) => {
  const d = f - at;
  if (d < 0 || d > dur) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {Array.from({length: n}, (_, i) => {
        const side = i % 2 ? 1 : -1;
        const vx = side * rr(`${seed}x${i}`, 4, 26);
        const vy = -rr(`${seed}y${i}`, 3, 17);
        const g = 0.9;
        const t = d * rr(`${seed}t${i}`, 0.8, 1.15);
        const px = x + side * rr(`${seed}o${i}`, 0, spread * 0.35) + vx * t;
        const py = y + vy * t + 0.5 * g * t * t;
        const life = 1 - clamp01(t / (dur * rr(`${seed}L${i}`, 0.5, 1)));
        if (life <= 0 || py > y + 30) return null;
        const len = Math.hypot(vx, vy + g * t) * 1.6;
        const ang = Math.atan2(vy + g * t, vx);
        return (
          <line
            key={i}
            x1={px}
            y1={py}
            x2={px - Math.cos(ang) * len}
            y2={py - Math.sin(ang) * len}
            stroke={i % 3 === 0 ? '#FFFFFF' : color}
            strokeOpacity={0.9 * life}
            strokeWidth={rr(`${seed}w${i}`, 2, 4.5)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

/** Lock-on corner brackets around a rectangle: they snap in from larger, then breathe. */
export const Brackets: React.FC<{frame: number; at: number; x0: number; y0: number; x1: number; y1: number; color?: string; until?: number; arm?: number}> = ({
  frame: f,
  at,
  x0,
  y0,
  x1,
  y1,
  color = PAL.info,
  until,
  arm = 70,
}) => {
  if (f < at) return null;
  const sp = springAt(f, at, SPRING.snap);
  const out = until !== undefined ? prog(f, until, 8, EASE.inCubic) : 0;
  if (out >= 1) return null;
  const grow = lerp(1.32, 1, Math.min(1.05, sp)) * (1 + 0.006 * Math.sin((TAU * (f - at)) / 50));
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const hw = ((x1 - x0) / 2) * grow;
  const hh = ((y1 - y0) / 2) * grow;
  const op = clamp01((f - at) / 4) * (1 - out);
  const corners: Array<[number, number, number, number]> = [
    [cx - hw, cy - hh, 1, 1],
    [cx + hw, cy - hh, -1, 1],
    [cx + hw, cy + hh, -1, -1],
    [cx - hw, cy + hh, 1, -1],
  ];
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={op}>
      {corners.map(([x, y, sx, sy], i) => (
        <g key={i}>
          <path d={`M ${x} ${y + sy * arm} L ${x} ${y} L ${x + sx * arm} ${y}`} fill="none" stroke={color} strokeOpacity={0.3} strokeWidth={12} strokeLinecap="round" />
          <path d={`M ${x} ${y + sy * arm} L ${x} ${y} L ${x + sx * arm} ${y}`} fill="none" stroke="#E9FDFF" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* tick marks along the top and bottom edges */}
      {Array.from({length: 9}, (_, i) => {
        const x = cx - hw * 0.6 + (hw * 1.2 * i) / 8;
        return <line key={i} x1={x} y1={cy - hh} x2={x} y2={cy - hh + (i % 4 === 0 ? 16 : 9)} stroke={color} strokeOpacity={0.55} strokeWidth={2} />;
      })}
    </svg>
  );
};

/** A dark glass instrument plate (rounded, inner rim, soft shadow). Children are centred. */
export const GlassPlate: React.FC<{w: number; h: number; accent?: string; glow?: number; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  w,
  h,
  accent = PAL.info,
  glow = 0,
  children,
  style,
}) => (
  <div
    style={{
      position: 'relative',
      width: w,
      height: h,
      borderRadius: Math.min(h * 0.32, 34),
      background: `linear-gradient(180deg, ${rgba('#121C33', 0.94)}, ${rgba('#070B15', 0.94)})`,
      border: `2px solid ${rgba(PAL.structure, 0.35)}`,
      boxShadow: [`inset 0 2px 0 ${rgba('#FFFFFF', 0.08)}`, `0 18px 50px ${rgba('#000000', 0.55)}`, glow > 0 ? `0 0 ${50 * glow}px ${rgba(accent, 0.45 * glow)}` : ''].filter(Boolean).join(', '),
      overflow: 'hidden',
      ...style,
    }}
  >
    <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: accent, boxShadow: `0 0 18px ${rgba(accent, 0.8)}`}} />
    {children}
  </div>
);

export const monoStyle = (size: number, color: string = PAL.ink): React.CSSProperties => ({
  fontFamily: MONO,
  fontWeight: 500,
  fontSize: size,
  color,
  fontVariantNumeric: 'tabular-nums',
  letterSpacing: '-0.02em',
  lineHeight: 1,
});
export const sansStyle = (size: number, color: string = PAL.ink, weight: 600 | 700 = 700): React.CSSProperties => ({
  fontFamily: SANS,
  fontWeight: weight,
  fontSize: size,
  color,
  lineHeight: 1.05,
  letterSpacing: '-0.01em',
  whiteSpace: 'nowrap',
});
