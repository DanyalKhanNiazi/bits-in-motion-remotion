/** S6 shared bits: a mono tag, a speed-driven Bit with streak, and ray fans. Pure functions of frame. */
import React from 'react';
import {BitHead, EASE, PAL, SANS, SPRING, clamp01, lerp, prog, rgba, springAt, track, type Key} from '../../kit';

export type Pt = {x: number; y: number};

/** Integrated position (px) of something moving at `basePx` × speed(track) per frame, from a fixed origin frame. */
export const travelled = (f: number, keys: readonly Key[], basePx: number, origin = 9380): number => {
  let d = 0;
  const end = Math.floor(f);
  for (let t = origin; t < end; t++) d += track(t, keys) * basePx;
  return d + (f - end) * track(end, keys) * basePx;
};

/** Small uppercase mono tag with a cyan pip; types on. ≥ 40 px. */
export const Tag: React.FC<{frame: number; at: number; text: string; x: number; y: number; color?: string; exitAt?: number; size?: number; align?: 'left' | 'center'}> = ({
  frame,
  at,
  text,
  x,
  y,
  color = PAL.annotation,
  exitAt,
  size = 56,
  align = 'left',
}) => {
  if (frame < at - 2) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const n = Math.min(text.length, Math.max(0, Math.floor((frame - at + 1) * 1.6)));
  const pip = springAt(frame, at - 2, SPRING.pop);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${align === 'center' ? '-50%' : '0'}, -50%) translateY(${-14 * ex}px)`,
        opacity: 1 - ex,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '6px 18px 6px 14px',
        borderRadius: 10,
        background: rgba('#050912', 0.72),
        border: `2px solid ${rgba(color, 0.28)}`,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{width: 16, height: 16, borderRadius: 4, background: PAL.info, transform: `scale(${Math.max(0, pip)})`, boxShadow: `0 0 14px ${rgba(PAL.info, 0.8)}`}} />
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: '0.06em', color: PAL.ink}}>
        {text.slice(0, n)}
        <span style={{opacity: 0}}>{text.slice(n)}</span>
      </div>
    </div>
  );
};

/** The Bit with a speed streak, drawn at a point (svg coordinates of the parent). */
export const StreakBit: React.FC<{x: number; y: number; speed: number; size?: number; color?: string; gid: string; dir?: 1 | -1}> = ({x, y, speed, size = 26, color = PAL.info, gid, dir = 1}) => {
  const L = Math.min(340, speed * 8.5);
  const pix = [30, 56, 80].map((o, i) => ({o: o * clamp01(speed / 14), s: [0.62, 0.46, 0.32][i] * size, a: [0.8, 0.55, 0.32][i]}));
  return (
    <g>
      <defs>
        <linearGradient id={`${gid}-st`} x1={x - dir * L} y1={y} x2={x} y2={y} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} stopOpacity={0} />
          <stop offset="1" stopColor={color} stopOpacity={0.85} />
        </linearGradient>
      </defs>
      {L > 6 ? (
        <>
          <rect x={dir > 0 ? x - L : x} y={y - size * 0.32} width={L} height={size * 0.64} rx={size * 0.3} fill={`url(#${gid}-st)`} opacity={0.55} />
          <rect x={dir > 0 ? x - L : x} y={y - size * 0.12} width={L} height={size * 0.24} rx={size * 0.12} fill={`url(#${gid}-st)`} />
          {pix.map((p, i) => (p.o > 4 ? <rect key={i} x={x - dir * p.o - p.s / 2} y={y - p.s / 2 + (i % 2 ? 1 : -1) * size * 0.45} width={p.s} height={p.s} rx={2} fill={color} opacity={p.a} /> : null))}
        </>
      ) : null}
      <BitHead x={x} y={y} size={size} color={color} gid={gid} />
    </g>
  );
};

/** A fan of rays from one point to many targets: draws in fast, a pulse rides each ray, then fades. */
export const RayFan: React.FC<{frame: number; at: number; from: Pt; to: readonly Pt[]; dur?: number; color?: string; width?: number; strength?: number}> = ({
  frame,
  at,
  from,
  to,
  dur = 18,
  color = PAL.info,
  width = 3,
  strength = 1,
}) => {
  const t = frame - at;
  if (t < 0 || t > dur) return null;
  const draw = prog(frame, at, 6, EASE.out);
  const fade = 1 - prog(frame, at + dur * 0.45, dur * 0.55, EASE.inOut);
  const pulse = prog(frame, at, 9, EASE.inOut);
  return (
    <g opacity={fade * strength}>
      {to.map((p, i) => {
        const x2 = lerp(from.x, p.x, draw);
        const y2 = lerp(from.y, p.y, draw);
        const px = lerp(from.x, p.x, pulse);
        const py = lerp(from.y, p.y, pulse);
        return (
          <g key={i}>
            <line x1={from.x} y1={from.y} x2={x2} y2={y2} stroke={color} strokeOpacity={0.22} strokeWidth={width * 3.2} strokeLinecap="round" />
            <line x1={from.x} y1={from.y} x2={x2} y2={y2} stroke={color} strokeOpacity={0.85} strokeWidth={width} strokeLinecap="round" />
            {pulse < 1 ? <rect x={px - 5} y={py - 5} width={10} height={10} rx={2.5} fill="#E9FDFF" /> : null}
          </g>
        );
      })}
      <circle cx={from.x} cy={from.y} r={lerp(10, 46, draw)} fill="none" stroke={color} strokeWidth={3} opacity={1 - draw * 0.8} />
    </g>
  );
};

/** Flash level of a target hit by a ray fan at `at` (rays land ≈ 7 frames later). */
export const hitGlow = (frame: number, at: number, lag = 7, decay = 9): number => {
  const t = frame - at - lag;
  if (t < -1) return 0;
  return t < 0 ? 0.5 : Math.exp(-t / decay);
};
