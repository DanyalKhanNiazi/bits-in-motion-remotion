/**
 * Ep03 kit: <PowerDial>, the BIM191 power-limit module with an amber energy arc round the knob that drains to a value,
 * and the percentage on its display window.
 *
 *   <PowerDial frame={frame} x={760} y={540} w={560} value={[[f0, 1], [f0 + 40, 0.5]]} enter={{kind: 'pop', at: f0 - 20}} />
 */
import React, {useId} from 'react';
import {MONO, PAL} from './look';
import {DIAL_WINDOW_QUAD, REGIONS} from './assets';
import {Prop, type Enter, type Exit} from './Prop';
import {TAU, clamp01, num, quadMatrix, rgba, safeId, type Num} from './util';

export type PowerDialProps = {
  frame: number;
  x: number;
  y: number;
  /** visible width of the module (default 560) */
  w?: number;
  /** 0..1 (a number or a keyframe track) */
  value: Num;
  readout?: boolean;
  enter?: Enter;
  exit?: Exit;
  tiltY?: Num;
  float?: number;
};

const ARC0 = 135; // degrees, start (lower-left), sweeping clockwise 270°
const SWEEP = 270;

export const PowerDial: React.FC<PowerDialProps> = ({frame: f, x, y, w = 560, value, readout = true, enter, exit, tiltY, float = 4}) => {
  const uid = safeId(useId());
  const v = clamp01(num(value, f, 1));
  const vPrev = clamp01(num(value, f - 1, 1));
  const moving = Math.abs(v - vPrev) > 0.0005;
  const knob = REGIONS.dialKnob;
  if (knob.shape !== 'ellipse') return null;
  const cx = knob.cx;
  const cy = knob.cy;
  const rx = knob.rx + 44;
  const ry = knob.ry + 50;
  const pt = (deg: number): [number, number] => [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)];
  const arc = (a0: number, a1: number): string => {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 3));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const p = pt(a0 + ((a1 - a0) * i) / n);
      d += `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)} `;
    }
    return d;
  };
  const aEnd = ARC0 + SWEEP * v;
  const end = pt(aEnd);
  const pulse = 0.85 + 0.15 * Math.sin((TAU * f) / 36);
  const WQ = 460;
  const HQ = 200;
  return (
    <Prop frame={f} src="BIM191_T03_gpu-power-limit_c" x={x} y={y} w={w} enter={enter} exit={exit} tiltY={tiltY} float={float} rim={{color: PAL.energy, strength: 0.35}} sweep={{every: 160, strength: 0.35}}>
      <svg width={1254} height={1254} viewBox="0 0 1254 1254" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id={`${uid}-g`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={14} />
          </filter>
        </defs>
        <path d={arc(ARC0, ARC0 + SWEEP)} fill="none" stroke="#120C04" strokeOpacity={0.85} strokeWidth={34} strokeLinecap="round" />
        <path d={arc(ARC0, ARC0 + SWEEP)} fill="none" stroke={rgba(PAL.energyDeep, 0.55)} strokeWidth={6} strokeLinecap="round" strokeDasharray="4 16" />
        {v > 0.002 ? (
          <>
            <path d={arc(ARC0, aEnd)} fill="none" stroke={PAL.energy} strokeWidth={30} strokeLinecap="round" filter={`url(#${uid}-g)`} opacity={0.8 * pulse} />
            <path d={arc(ARC0, aEnd)} fill="none" stroke={PAL.energy} strokeWidth={22} strokeLinecap="round" />
            <path d={arc(ARC0, aEnd)} fill="none" stroke={PAL.energyHot} strokeWidth={7} strokeLinecap="round" opacity={0.9} />
            <circle cx={end[0]} cy={end[1]} r={moving ? 26 : 20} fill="#FFF1C9" />
            <circle cx={end[0]} cy={end[1]} r={44} fill={PAL.energy} opacity={0.45} filter={`url(#${uid}-g)`} />
          </>
        ) : null}
      </svg>
      {readout ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: WQ,
            height: HQ,
            transformOrigin: '0 0',
            transform: quadMatrix(WQ, HQ, DIAL_WINDOW_QUAD),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `linear-gradient(180deg, ${rgba('#1A1206', 0.85)}, ${rgba('#0B0803', 0.92)})`,
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: 150,
            color: PAL.energy,
            letterSpacing: '-0.02em',
            textShadow: `0 0 26px ${rgba(PAL.energy, 0.75)}`,
          }}
        >
          {Math.round(v * 100)}%
        </div>
      ) : null}
    </Prop>
  );
};

