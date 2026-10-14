/**
 * Ep03 kit: <AtlasOpener>, a 1–2 s chapter opener built INTO the content (it never cuts to an empty card).
 * The picture dims, a Signal Atlas route draws in over a pool of grid dots, the Bit runs it lighting each station,
 * and the chapter word slams in where the route ends. Then it all clears.
 *
 *   <AtlasOpener frame={frame} at={P(5).start} word="Scoring" index="03" />
 */
import React, {useId} from 'react';
import {EASE, MONO, PAL, SANS, SPRING, TS} from './look';
import {Bit} from './signals';
import {KineticText} from './text';
import {clamp, clamp01, pathAt, prog, rgba, safeId, samplePath, springAt, textWidth, useFontsReady, win} from './util';

export type AtlasOpenerProps = {
  frame: number;
  at: number;
  word: string;
  /** small chapter index above the word, e.g. "03" */
  index?: string;
  /** total length in frames (default 54) */
  dur?: number;
  /** word centre y (default 520) */
  y?: number;
  size?: number;
  /** how much the picture dims behind (default 0.55) */
  scrim?: number;
  color?: string;
};

export const AtlasOpener: React.FC<AtlasOpenerProps> = ({frame: f, at, word, index, dur = 54, y = 520, size = 132, scrim = 0.55, color = PAL.ink}) => {
  useFontsReady();
  const uid = safeId(useId());
  const t = f - at;
  if (t < 0 || t > dur) return null;
  const w = win(f, at, at + dur, 6, 10);
  const ww = textWidth(word, size, 700, SANS, 0.02);
  const xw = 960 + 70;
  const xL = xw - ww / 2;
  const x1 = clamp(xL - 300, 260, 1400);
  const yb = y + 200;
  const r = 44;
  const d = `M -60 ${yb} H ${x1 - r} Q ${x1} ${yb} ${x1} ${yb - r} V ${y + r} Q ${x1} ${y} ${x1 + r} ${y} H ${xL - 44}`;
  const s = samplePath(d);
  const draw = prog(f, at, 11, EASE.out);
  const bitFrom = at + 4;
  const bitTo = at + 21;
  const bp = prog(f, bitFrom, bitTo - bitFrom, EASE.carry);
  const head = pathAt(s, bp * s.total);
  const stations = [0.3, 0.58, 0.82];
  const exitAt = at + dur - 11;
  const out = prog(f, exitAt, 11, EASE.inCubic);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 70% at 50% ${(y / 1080) * 100}%, ${rgba('#050913', scrim * 0.85 * w)}, ${rgba('#02040A', scrim * w)})`}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <pattern id={`${uid}-dots`} width={48} height={48} patternUnits="userSpaceOnUse" patternTransform={`translate(${(f * 0.25) % 48} 0)`}>
            <rect x={22} y={22} width={4} height={4} fill="#566A92" />
          </pattern>
          <radialGradient id={`${uid}-pool`} cx={head.x} cy={head.y} r={620} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fff" stopOpacity={0.9} />
            <stop offset="0.6" stopColor="#fff" stopOpacity={0.3} />
            <stop offset="1" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <mask id={`${uid}-m`}>
            <rect width={1920} height={1080} fill={`url(#${uid}-pool)`} />
          </mask>
        </defs>
        <rect width={1920} height={1080} fill={`url(#${uid}-dots)`} mask={`url(#${uid}-m)`} opacity={0.75 * w} />
        <path d={d} fill="none" stroke={PAL.structure} strokeOpacity={0.6 * (1 - out)} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        {stations.map((p, i) => {
          const P = pathAt(s, p * s.total);
          const lit = bp >= p ? springAt(f, bitFrom + Math.round(p * (bitTo - bitFrom)) - 1, SPRING.pop) : 0;
          const sz = 22 + 8 * Math.min(1.2, lit);
          return (
            <g key={i} opacity={draw * (1 - out)}>
              {lit > 0 ? <circle cx={P.x} cy={P.y} r={34 * lit} fill={rgba(PAL.info, 0.18)} /> : null}
              <rect x={P.x - sz / 2} y={P.y - sz / 2} width={sz} height={sz} rx={5} fill={lit > 0 ? PAL.info : PAL.deck} stroke={lit > 0 ? PAL.infoPale : PAL.structure} strokeWidth={3} />
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', inset: 0, opacity: 1 - out}}>
        <Bit frame={f} path={d} from={bitFrom} to={bitTo} route="lit" routeWidth={5} size={26} />
      </div>
      {index ? (
        <div
          style={{
            position: 'absolute',
            left: xL,
            top: y - size * 0.62 - 64,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            opacity: clamp01((t - 18) / 5) * (1 - out),
            transform: `translateY(${(1 - clamp01((t - 18) / 6)) * 14 - out * 20}px)`,
          }}
        >
          <span style={{fontFamily: MONO, fontWeight: 500, fontSize: TS.labelMin, color: PAL.info, letterSpacing: '0.08em'}}>{index}</span>
          <span style={{width: 90 * prog(f, at + 19, 10, EASE.out), height: 3, background: rgba(PAL.annotation, 0.8)}} />
        </div>
      ) : null}
      <KineticText frame={f} at={bitTo - 1} text={word} x={xw} y={y} size={size} mode="slam" backing="none" color={color} exitAt={exitAt} tracking={0.02} />
    </div>
  );
};
