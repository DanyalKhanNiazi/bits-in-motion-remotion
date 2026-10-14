/**
 * Ep06 UI kit: <ClockGlyph> (amber, no numerals, a hand that sweeps and never points at a time: "on its own schedule")
 * and <WriteTally> (coral notches, one per write, no digits).
 *
 *   <ClockGlyph frame={f} x={1640} y={220} size={140} at={a} exitAt={b} />
 *   <WriteTally frame={f} x={1500} y={200} hits={[w1, w2, w3]} />
 */
import React from 'react';
import {EASE, PAL, SPRING} from '../look';
import {clamp01, prog, rgba, springAt} from '../util';

export const ClockGlyph: React.FC<{frame: number; x: number; y: number; size?: number; at?: number; exitAt?: number; /** frames per turn */ period?: number; color?: string}> = ({
  frame: f,
  x,
  y,
  size = 140,
  at,
  exitAt,
  period = 75,
  color = PAL.drive,
}) => {
  const pin = at === undefined ? 1 : springAt(f, at, SPRING.pop);
  const pout = exitAt === undefined ? 0 : prog(f, exitAt, 8, EASE.inCubic);
  if (pin <= 0.001 || pout >= 1) return null;
  const r = 50;
  const ang = (((f - (at ?? 0)) / period) * 360 + 200) % 360;
  const wedge = 70;
  const pt = (a: number, rr: number) => {
    const t = ((a - 90) * Math.PI) / 180;
    return [rr * Math.cos(t), rr * Math.sin(t)];
  };
  const steps = 7;
  const segs: React.ReactNode[] = [];
  for (let i = 0; i < steps; i++) {
    const a0 = ang - wedge * ((i + 1) / steps);
    const a1 = ang - wedge * (i / steps);
    const [x0, y0] = pt(a0, r * 0.84);
    const [x1, y1] = pt(a1, r * 0.84);
    segs.push(<path key={i} d={`M0 0 L${x0} ${y0} A${r * 0.84} ${r * 0.84} 0 0 1 ${x1} ${y1} Z`} fill={rgba(color, 0.32 * (1 - i / steps))} />);
  }
  const [hx, hy] = pt(ang, r * 0.74);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(pin * 3) * (1 - pout)}}>
      <svg width={size} height={size} viewBox="-60 -60 120 120" style={{position: 'absolute', left: -size / 2, top: -size / 2, overflow: 'visible', transform: `scale(${Math.max(0, pin)})`}}>
        <circle r={r + 6} fill={rgba('#0A0E16', 0.75)} />
        <circle r={r} fill={rgba(color, 0.07)} stroke={rgba(color, 0.25)} strokeWidth={10} />
        <circle r={r} fill="none" stroke={color} strokeWidth={4.5} />
        {Array.from({length: 12}, (_, i) => {
          const [ax, ay] = pt(i * 30, r * (i % 3 === 0 ? 0.68 : 0.76));
          const [bx, by] = pt(i * 30, r * 0.88);
          return <line key={i} x1={ax} y1={ay} x2={bx} y2={by} stroke={color} strokeWidth={i % 3 === 0 ? 4 : 2.4} strokeLinecap="round" opacity={i % 3 === 0 ? 1 : 0.7} />;
        })}
        {segs}
        <line x1={0} y1={0} x2={hx} y2={hy} stroke={rgba(color, 0.35)} strokeWidth={10} strokeLinecap="round" />
        <line x1={0} y1={0} x2={hx} y2={hy} stroke={PAL.driveHot} strokeWidth={4.5} strokeLinecap="round" />
        <circle r={6} fill={PAL.driveHot} />
      </svg>
    </div>
  );
};

/** Coral notches, one per write, grouped in fives (four upright + one slash). No digits. */
export const WriteTally: React.FC<{frame: number; x: number; y: number; hits: readonly number[]; size?: number; at?: number; exitAt?: number; color?: string}> = ({
  frame: f,
  x,
  y,
  hits,
  size = 64,
  at,
  exitAt,
  color = PAL.loss,
}) => {
  const vis = (at === undefined ? 1 : prog(f, at, 8)) * (exitAt === undefined ? 1 : 1 - prog(f, exitAt, 8, EASE.inCubic));
  if (vis <= 0) return null;
  const gap = size * 0.28;
  const groupGap = size * 0.5;
  const nodes: React.ReactNode[] = [];
  let cx = 0;
  const slots = Math.max(hits.length, 1);
  const positions: Array<{x: number; slash: boolean; group: number}> = [];
  for (let i = 0; i < slots; i++) {
    const inGroup = i % 5;
    if (i > 0 && inGroup === 0) cx += groupGap;
    if (inGroup === 4) positions.push({x: cx - gap * 2.5, slash: true, group: Math.floor(i / 5)});
    else {
      positions.push({x: cx, slash: false, group: Math.floor(i / 5)});
      cx += gap;
    }
  }
  const totalW = cx;
  hits.forEach((h, i) => {
    const t = f - h;
    const p = positions[i];
    // empty socket
    if (!p.slash) nodes.push(<rect key={`s${i}`} x={p.x - size * 0.05} y={-size / 2} width={size * 0.1} height={size} rx={size * 0.05} fill={rgba(color, 0.12)} />);
    if (t < 0) return;
    const sp = springAt(f, h, SPRING.slam);
    const drop = (1 - Math.min(1, sp)) * -size * 0.7;
    const flash = t < 14 ? Math.exp(-t / 3.5) : 0;
    if (p.slash) {
      const x0 = p.x - gap * 1.9;
      const x1 = p.x + gap * 1.9;
      nodes.push(
        <g key={`n${i}`} opacity={clamp01(sp * 3)}>
          <line x1={x0} y1={size * 0.42} x2={x1} y2={-size * 0.42} stroke={rgba(color, 0.35 + 0.4 * flash)} strokeWidth={size * 0.26} strokeLinecap="round" />
          <line x1={x0} y1={size * 0.42} x2={x1} y2={-size * 0.42} stroke={color} strokeWidth={size * 0.11} strokeLinecap="round" />
        </g>,
      );
    } else {
      nodes.push(
        <g key={`n${i}`} transform={`translate(0 ${drop})`} opacity={clamp01(sp * 3)}>
          <rect x={p.x - size * 0.14} y={-size / 2 - size * 0.08} width={size * 0.28} height={size * 1.16} rx={size * 0.14} fill={rgba(color, 0.25 + 0.5 * flash)} />
          <rect x={p.x - size * 0.06} y={-size / 2} width={size * 0.12} height={size} rx={size * 0.06} fill={flash > 0.3 ? '#FFD3D8' : color} />
        </g>,
      );
      if (t < 16) {
        const u = t / 16;
        nodes.push(<circle key={`r${i}`} cx={p.x} cy={size * 0.5} r={size * (0.15 + 0.7 * u)} fill="none" stroke={rgba(color, 0.7 * (1 - u))} strokeWidth={size * 0.05} />);
      }
    }
  });
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: vis}}>
      <svg width={totalW + size * 2} height={size * 2.4} viewBox={`${-size} ${-size * 1.2} ${totalW + size * 2} ${size * 2.4}`} style={{position: 'absolute', left: -size, top: -size * 1.2, overflow: 'visible'}}>
        {nodes}
      </svg>
    </div>
  );
};
