// S8 shot E2: "the trick that bends the one-at-a-time rule" (S3's teaser, called back). A steel ruler engraved
// ONE AT A TIME flexes into an arc on "bends", with overshoot and settle.
import React, {useId} from 'react';
import {KineticText, PAL, SANS, Stage, clamp01, lerp, nz, rgba, safeId, springAt, type CamKey} from '../../kit';
import {W} from './T';

const X0 = 250;
const X1 = 1670;
const YC = 610;
const H = 150;
const N = 72;

export const rulerCam: CamKey[] = [
  {f: W.andIts - 10, x: 960, y: 560, zoom: 1.0},
  {f: W.aSmall + 4, x: 960, y: 540, zoom: 1.1},
];

/** Centreline of the ruler for bend b (px of sagitta, positive bows upward). */
const centre = (u: number, b: number) => {
  const x = lerp(X0, X1, u);
  const y = YC - b * (1 - (2 * u - 1) ** 2);
  // derivative for the normal
  const dydx = (-b * -4 * (2 * u - 1)) / (X1 - X0);
  const n = Math.hypot(1, dydx);
  return {x, y, nx: dydx / n, ny: -1 / n};
};

export const RulerScene: React.FC<{frame: number}> = ({frame: f}) => {
  const id = safeId(useId());
  const b = 170 * springAt(f, W.bends - 2, {damping: 6, stiffness: 120, mass: 0.85}) + 3 * nz('rl', f / 8);
  const enter = springAt(f, W.andIts - 8, {damping: 14, stiffness: 140, mass: 0.9});
  const strain = clamp01(springAt(f, W.bends - 2, {damping: 6, stiffness: 120, mass: 0.85}));
  // body as slices along the curve
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= N; i++) {
    const c = centre(i / N, b);
    top.push(`${(c.x + c.nx * (H / 2)).toFixed(1)},${(c.y + c.ny * (H / 2)).toFixed(1)}`);
    bot.push(`${(c.x - c.nx * (H / 2)).toFixed(1)},${(c.y - c.ny * (H / 2)).toFixed(1)}`);
  }
  const body = `M ${top.join(' L ')} L ${[...bot].reverse().join(' L ')} Z`;
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= 56; i++) {
    const u = 0.02 + (0.96 * i) / 56;
    const c = centre(u, b);
    const len = i % 4 === 0 ? 34 : i % 2 === 0 ? 22 : 14;
    const ax = c.x + c.nx * (H / 2 - 4);
    const ay = c.y + c.ny * (H / 2 - 4);
    ticks.push(<line key={i} x1={ax} y1={ay} x2={ax - c.nx * len} y2={ay - c.ny * len} stroke="#2A3550" strokeWidth={i % 4 === 0 ? 4 : 3} strokeLinecap="round" />);
  }
  // text path: the centreline, a little below the middle
  const tp: string[] = [];
  for (let i = 0; i <= N; i++) {
    const c = centre(i / N, b);
    tp.push(`${(c.x - c.nx * 32).toFixed(1)},${(c.y - c.ny * 32).toFixed(1)}`);
  }
  const textPath = `M ${tp.join(' L ')}`;
  const glow = clamp01(strain) * (0.75 + 0.25 * Math.sin(f / 4));
  const hud = (
    <KineticText frame={f} at={W.trick - 5} text="The trick that bends the rule" x={960} y={236} size={84} mode="rise" stagger={3} exitAt={W.aSmall - 6} />
  );
  return (
    <Stage frame={f} env={{kind: 'night', dust: 70}} cam={rulerCam} hud={hud} shake={[{at: W.bends + 2, strength: 0.6}]}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: clamp01(enter * 1.4), transform: `translateY(${(1 - Math.min(1, enter)) * 80}px)`}}>
        <defs>
          <linearGradient id={`${id}-steel`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.18" stopColor="#E6EAF0" />
            <stop offset="0.55" stopColor="#C3CAD5" />
            <stop offset="0.85" stopColor="#9CA5B4" />
            <stop offset="1" stopColor="#6F7889" />
          </linearGradient>
          <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="0">
            <stop offset={lerp(-0.3, 1.0, ((f % 90) / 90))} stopColor="#FFFFFF" stopOpacity={0} />
            <stop offset={lerp(-0.2, 1.1, ((f % 90) / 90))} stopColor="#FFFFFF" stopOpacity={0.45} />
            <stop offset={lerp(-0.1, 1.2, ((f % 90) / 90))} stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
          <filter id={`${id}-glow`} x="-10%" y="-40%" width="120%" height="180%">
            <feGaussianBlur stdDeviation={16} />
          </filter>
          <filter id={`${id}-sh`} x="-10%" y="-40%" width="120%" height="200%">
            <feGaussianBlur stdDeviation={22} />
          </filter>
          <path id={`${id}-tp`} d={textPath} />
        </defs>
        {/* floor shadow */}
        <ellipse cx={960} cy={YC + 250} rx={760} ry={40} fill="#000" opacity={0.55} filter={`url(#${id}-sh)`} />
        {/* cyan strain glow behind */}
        <path d={body} fill={PAL.info} opacity={0.55 * glow} filter={`url(#${id}-glow)`} />
        <path d={body} fill={`url(#${id}-steel)`} stroke="#5D6676" strokeWidth={3} />
        <path d={body} fill={`url(#${id}-sheen)`} />
        {ticks}
        <text fontFamily={SANS} fontWeight={700} fontSize={92} letterSpacing="0.1em" fill="#1E2942">
          <textPath href={`#${id}-tp`} startOffset="50%" textAnchor="middle">
            ONE AT A TIME
          </textPath>
        </text>
        <path d={body} fill="none" stroke={PAL.info} strokeWidth={4} opacity={0.9 * glow} />
        <path d={body} fill="none" stroke={rgba('#FFFFFF', 0.6)} strokeWidth={1.5} />
      </svg>
    </Stage>
  );
};
