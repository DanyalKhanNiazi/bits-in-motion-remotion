/**
 * S1: "less time than a blink". The frame itself blinks: an upper and a lower lid sweep in (arched edges that
 * flatten as they meet), a seam of light leaks between them while shut, and they open again. The prompt is read
 * while the lids are shut.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {PAL} from '../../kit';
import {EASE, clamp01, lerp, rgba} from '../../kit';

/** Openness 1 (open) → 0 (shut) → 1. */
export const lidOpen = (f: number, close: number, shut: number, open: number): number => {
  if (f <= close || f >= open) return 1;
  if (f < shut) return 1 - EASE.inOut(clamp01((f - close) / (shut - close)));
  if (f < shut + 1) return 0;
  return EASE.inOut(clamp01((f - shut - 1) / (open - shut - 1)));
};

export const Eyelids: React.FC<{frame: number; close: number; shut: number; open: number}> = ({frame: f, close, shut, open}) => {
  const k = lidOpen(f, close, shut, open);
  if (k >= 0.999) return null;
  const yT = lerp(540, -14, k);
  const yB = lerp(540, 1094, k);
  const arch = 130 * k;
  const N = 24;
  const edge = (y0: number, dir: 1 | -1) =>
    Array.from({length: N + 1}, (_, i) => {
      const x = -60 + ((1920 + 120) * i) / N;
      const u = (x - 960) / 1100;
      return `${x.toFixed(1)} ${(y0 - dir * arch * (1 - u * u)).toFixed(1)}`;
    });
  const top = `M -60 -60 L ${edge(yT, 1).join(' L ')} L 1980 -60 Z`;
  const bot = `M -60 1140 L ${edge(yB, -1).join(' L ')} L 1980 1140 Z`;
  const seam = 1 - k;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <filter id="s1-lid-soft" x="-5%" y="-20%" width="110%" height="140%">
            <feGaussianBlur stdDeviation={10} />
          </filter>
          <linearGradient id="s1-lid-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#03050A" />
            <stop offset="1" stopColor="#0C1424" />
          </linearGradient>
          <linearGradient id="s1-lid-bot" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#03050A" />
            <stop offset="1" stopColor="#0C1424" />
          </linearGradient>
        </defs>
        <g filter="url(#s1-lid-soft)">
          <path d={top} fill="url(#s1-lid-top)" />
          <path d={bot} fill="url(#s1-lid-bot)" />
        </g>
        {/* the lid rims catch a little light */}
        <path d={`M ${edge(yT, 1).join(' L ')}`} fill="none" stroke={rgba('#9FB7E0', 0.22)} strokeWidth={5} filter="url(#s1-lid-soft)" />
        <path d={`M ${edge(yB, -1).join(' L ')}`} fill="none" stroke={rgba('#9FB7E0', 0.16)} strokeWidth={5} filter="url(#s1-lid-soft)" />
        {/* light leaking through the shut lids */}
        {seam > 0.7 ? (
          <>
            <rect x={0} y={537} width={1920} height={6} fill={rgba(PAL.infoPale, (0.6 * (seam - 0.7)) / 0.3)} filter="url(#s1-lid-soft)" />
            <rect x={300} y={539} width={1320} height={2} fill={rgba('#FFFFFF', (0.75 * (seam - 0.7)) / 0.3)} />
          </>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
