// S8: a physical control lever (navy housing, brushed-silver bevel, cyan trims, a steel arm with a ball knob).
// Drawn in SVG in screen px around its pivot so it can sit on the Bridge's floor (scaled by perspective).
import React, {useId} from 'react';
import {PAL, SANS, TAU, clamp01, lerp, rgba, safeId} from '../../kit';

export type Notch = {a: number; label?: string; lit?: number};

export type LeverProps = {
  /** screen position of the housing's top-face centre */
  x: number;
  y: number;
  /** px per design unit (1 = a 300 px wide housing) */
  s: number;
  /** arm angle in degrees (negative = leaning left) */
  angle: number;
  /** 0..1 LED and knob ring (engaged) */
  on?: number;
  notches?: readonly Notch[];
  /** angle where the coral (too far) zone starts, and its visibility 0..1 */
  coralFrom?: number;
  coral?: number;
  /** 0..1 rise from the floor (scale + slide) */
  rise?: number;
  /** extra glow on the knob 0..1 (a pull flash) */
  flash?: number;
  /** 0..1 visibility of the gate scale (numbers on an arc) */
  scale?: number;
  frame: number;
  accent?: string;
  /** 0..1 drawn opacity */
  opacity?: number;
};

const ARM = 236; // pivot → knob centre
const PIV = 64; // pivot depth below the top face

/** Where the knob centre sits for an angle (screen px, relative to the lever's x, y). */
export const knobOffset = (angle: number, s: number) => {
  const r = (angle * Math.PI) / 180;
  return {x: Math.sin(r) * ARM * s, y: (PIV - Math.cos(r) * ARM) * s};
};
/** An arc around the pivot from angle a0 to a1 (deg) at radius R. */
const arcD = (a0: number, a1: number, R: number) => {
  const p = (a: number) => {
    const r = (a * Math.PI) / 180;
    return `${(Math.sin(r) * R).toFixed(1)} ${(PIV - Math.cos(r) * R).toFixed(1)}`;
  };
  return `M ${p(a0)} A ${R} ${R} 0 0 1 ${p(a1)}`;
};
/** x on the slot (design units) for an angle: where the arm crosses the top face. */
const slotX = (angle: number) => Math.tan((angle * Math.PI) / 180) * PIV;

export const Lever: React.FC<LeverProps> = ({x, y, s, angle, on = 0, notches = [], coralFrom, coral = 0, rise = 1, flash = 0, frame, accent = PAL.info, opacity = 1, scale = 1}) => {
  const id = safeId(useId());
  if (rise <= 0.001 || opacity <= 0.001) return null;
  const rs = lerp(0.6, 1, clamp01(rise));
  const dy = (1 - clamp01(rise)) * 160;
  const breathe = 0.85 + 0.15 * Math.sin((TAU * frame) / 70);
  const ledW = 228;
  const tc = (a: number) => slotX(a);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: opacity * clamp01(rise * 1.6)}}>
      <defs>
        <linearGradient id={`${id}-front`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22345A" />
          <stop offset="0.55" stopColor="#152340" />
          <stop offset="1" stopColor="#0A1226" />
        </linearGradient>
        <linearGradient id={`${id}-top`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2A49" />
          <stop offset="1" stopColor="#30436B" />
        </linearGradient>
        <linearGradient id={`${id}-bevel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7E8796" />
          <stop offset="0.25" stopColor="#E8ECF2" />
          <stop offset="0.5" stopColor="#B9C1CD" />
          <stop offset="0.78" stopColor="#F4F6F9" />
          <stop offset="1" stopColor="#868F9E" />
        </linearGradient>
        <linearGradient id={`${id}-arm`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6C7584" />
          <stop offset="0.35" stopColor="#F2F5F9" />
          <stop offset="0.6" stopColor="#AEB6C3" />
          <stop offset="1" stopColor="#4F5767" />
        </linearGradient>
        <radialGradient id={`${id}-knob`} cx="0.36" cy="0.32" r="0.75">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.28" stopColor="#E3E8EF" />
          <stop offset="0.7" stopColor="#8D96A6" />
          <stop offset="1" stopColor="#3C4454" />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor={accent} stopOpacity={0.55} />
          <stop offset="1" stopColor={accent} stopOpacity={0} />
        </radialGradient>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={5} />
        </filter>
        <clipPath id={`${id}-above`}>
          <rect x={-400} y={-600} width={800} height={601} />
        </clipPath>
      </defs>
      <g transform={`translate(${x}, ${y + dy * s}) scale(${s * rs})`}>
        {/* contact shadow on the floor */}
        <ellipse cx={0} cy={128} rx={200} ry={30} fill="#000" opacity={0.6} filter={`url(#${id}-soft)`} />
        {/* top face */}
        <path d="M -150 20 L 150 20 L 128 -22 L -128 -22 Z" fill={`url(#${id}-top)`} />
        {/* slot */}
        <rect x={-116} y={-9} width={232} height={16} rx={8} fill="#03070F" />
        <rect x={-116} y={-9} width={232} height={5} rx={3} fill="#000" opacity={0.6} />
        {/* coral zone at the far end of the slot */}

        {/* notches: ticks on the slot's front lip, optional numbers below on the bevel */}
        {notches.map((n, i) => {
          const nx = tc(n.a);
          const lit = clamp01(n.lit ?? 0);
          return (
            <g key={i}>
              <rect x={nx - 3} y={6} width={6} height={12} rx={2} fill={lit > 0 ? PAL.infoPale : '#C7CDD6'} />
              {lit > 0 ? <rect x={nx - 6} y={4} width={12} height={16} rx={4} fill={accent} opacity={0.6 * lit} filter={`url(#${id}-glow)`} /> : null}
            </g>
          );
        })}
        {/* the arm, clipped above the slot so it emerges from it */}
        <g clipPath={`url(#${id}-above)`}>
          <g transform={`rotate(${angle} 0 ${PIV})`}>
            <rect x={-11} y={PIV - ARM + 18} width={22} height={ARM - 18} rx={11} fill={`url(#${id}-arm)`} />
            <rect x={-11} y={-14} width={22} height={18} rx={6} fill="#0B1222" opacity={0.75} />
          </g>
        </g>
        {/* bevel lip (brushed silver) and front face */}
        <path d="M -150 20 L 150 20 L 150 30 L -150 30 Z" fill={`url(#${id}-bevel)`} />
        <path d="M -150 30 L 150 30 L 150 104 Q 150 122 132 122 L -132 122 Q -150 122 -150 104 Z" fill={`url(#${id}-front)`} />
        <path d="M -150 30 L 150 30" stroke="#000" strokeOpacity={0.35} strokeWidth={2} />
        {/* cyan corner trims (like the T03 renders) */}
        {[-139, 133].map((tx) => (
          <g key={tx}>
            <rect x={tx} y={46} width={6} height={52} rx={3} fill={accent} opacity={0.55 + 0.45 * breathe} />
            <rect x={tx - 3} y={44} width={12} height={56} rx={6} fill={accent} opacity={0.35 * breathe} filter={`url(#${id}-glow)`} />
          </g>
        ))}
        {/* LED bar: fills with "on" */}
        <rect x={-ledW / 2} y={66} width={ledW} height={12} rx={6} fill="#050A14" />
        {on > 0.01 ? (
          <>
            <rect x={-ledW / 2} y={66} width={ledW * clamp01(on)} height={12} rx={6} fill={accent} />
            <rect x={-ledW / 2} y={62} width={ledW * clamp01(on)} height={20} rx={10} fill={accent} opacity={0.55} filter={`url(#${id}-glow)`} />
          </>
        ) : null}
        {/* knob */}
        <g transform={`rotate(${angle} 0 ${PIV})`}>
          {on > 0.01 || flash > 0.01 ? <circle cx={0} cy={PIV - ARM} r={88} fill={`url(#${id}-halo)`} opacity={clamp01(on * 0.7 * breathe + flash)} /> : null}
          <circle cx={0} cy={PIV - ARM + 6} r={36} fill="#000" opacity={0.35} filter={`url(#${id}-glow)`} />
          <circle cx={0} cy={PIV - ARM} r={34} fill={`url(#${id}-knob)`} />
          {on > 0.01 ? <circle cx={0} cy={PIV - ARM} r={36} fill="none" stroke={accent} strokeWidth={4} opacity={clamp01(on)} /> : null}
          <ellipse cx={-10} cy={PIV - ARM - 13} rx={11} ry={7} fill="#FFFFFF" opacity={0.85} />
        </g>
        {/* gate scale: an arc behind the knob's path with the notch numbers on it */}
        {scale > 0 && notches.some((n) => n.label) ? (
          <g opacity={scale}>
            <path d={arcD(notches[0].a - 6, (coralFrom !== undefined ? Math.max(coralFrom + 12, notches[notches.length - 1].a + 6) : notches[notches.length - 1].a + 6), ARM + 44)} fill="none" stroke={rgba(PAL.annotation, 0.55)} strokeWidth={4} strokeLinecap="round" />
            {coralFrom !== undefined && coral > 0 ? <path d={arcD(coralFrom, coralFrom + 12, ARM + 44)} fill="none" stroke={PAL.wait} strokeWidth={10} strokeLinecap="round" opacity={coral} /> : null}
            {notches.map((n, i) => {
              const r = (n.a * Math.PI) / 180;
              const R1 = ARM + 36;
              const R2 = ARM + 54;
              const RL = ARM + 96;
              const lit = clamp01(n.lit ?? 0);
              return (
                <g key={`t${i}`}>
                  <line x1={Math.sin(r) * R1} y1={PIV - Math.cos(r) * R1} x2={Math.sin(r) * R2} y2={PIV - Math.cos(r) * R2} stroke={lit > 0.5 ? PAL.infoPale : '#AEB8C8'} strokeWidth={5} strokeLinecap="round" />
                  {n.label ? (
                    <text x={Math.sin(r) * RL} y={PIV - Math.cos(r) * RL + 16} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={46} fill={lit > 0.5 ? PAL.infoPale : '#AEB8C8'}>
                      {n.label}
                    </text>
                  ) : null}
                  {n.label && lit > 0 ? <circle cx={Math.sin(r) * RL} cy={PIV - Math.cos(r) * RL} r={40} fill={accent} opacity={0.22 * lit} filter={`url(#${id}-glow)`} /> : null}
                </g>
              );
            })}
          </g>
        ) : null}
      </g>
    </svg>
  );
};
