/**
 * Ep03 kit: <LensDive>. A circular lens opens over a region showing the next scene inside it, holds, then the
 * camera dives through: the lens grows to fill the frame while the old scene zooms past and blurs away.
 *
 *   <LensDive frame={frame} at={at(11, 'memory').start} cx={1210} cy={430} r={210}
 *             outer={(f) => <Stage …/>} inner={(f) => <Stage …/>} />
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, PAL} from './look';
import {TAU, clamp01, lerp, prog, rgba} from './util';

export type Render = (frame: number) => React.ReactNode;

export type LensDiveProps = {
  frame: number;
  at: number;
  /** lens centre over the outer scene (screen px) */
  cx: number;
  cy: number;
  r?: number;
  /** frames: open, hold, dive (defaults 10, 16, 18) */
  open?: number;
  hold?: number;
  dive?: number;
  outer: Render;
  inner: Render;
  /** inner scene scale inside the lens before the dive (default 0.62) */
  innerScale?: number;
  ring?: string;
};

export const LensDive: React.FC<LensDiveProps> = ({frame: f, at, cx, cy, r = 210, open = 10, hold = 16, dive = 18, outer, inner, innerScale = 0.62, ring = PAL.emphasis}) => {
  const t = f - at;
  if (t < 0) return <>{outer(f)}</>;
  const tDive = open + hold;
  if (t >= tDive + dive) return <>{inner(f)}</>;
  const o = EASE.outBack(clamp01(t / open));
  const dv = prog(f, at + tDive, dive, EASE.inOut);
  const rad = lerp(r * o, 1250, Math.pow(dv, 1.6));
  const lx = lerp(cx, 960, dv);
  const ly = lerp(cy, 540, dv);
  const sIn = lerp(innerScale, 1, dv) * (1 + 0.02 * Math.sin((TAU * t) / 40) * (1 - dv));
  const zOut = 1 + 2.6 * Math.pow(dv, 1.4);
  const breathe = 1 + 0.015 * Math.sin((TAU * t) / 30) * (1 - dv);
  const radB = rad * breathe;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          transform: `scale(${zOut})`,
          filter: dv > 0.02 ? `blur(${dv * 12}px) brightness(${1 - 0.5 * dv})` : undefined,
        }}
      >
        {outer(f)}
      </AbsoluteFill>
      <AbsoluteFill style={{background: rgba('#02040A', 0.35 * clamp01(t / open) * (1 - dv))}} />
      <AbsoluteFill style={{clipPath: `circle(${radB}px at ${lx}px ${ly}px)`}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${lx - 960 * sIn}px, ${ly - 540 * sIn}px) scale(${sIn})`}}>
          {inner(f)}
        </div>
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 1 - clamp01((rad - 600) / 400)}}>
        <circle cx={lx} cy={ly} r={radB + 10} fill="none" stroke={rgba(ring, 0.25)} strokeWidth={18} />
        <circle cx={lx} cy={ly} r={radB} fill="none" stroke={ring} strokeWidth={5} />
        <circle cx={lx} cy={ly} r={radB - 7} fill="none" stroke={rgba('#FFFFFF', 0.35)} strokeWidth={2} />
        {[0, 1, 2, 3].map((i) => {
          const a = (TAU * i) / 4 + (t / 60) * 0.6;
          return (
            <line
              key={i}
              x1={lx + Math.cos(a) * (radB + 4)}
              y1={ly + Math.sin(a) * (radB + 4)}
              x2={lx + Math.cos(a) * (radB + 22)}
              y2={ly + Math.sin(a) * (radB + 22)}
              stroke={ring}
              strokeWidth={5}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
