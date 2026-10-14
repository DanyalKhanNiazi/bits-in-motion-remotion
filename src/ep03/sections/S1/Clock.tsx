/**
 * S1: the race clocks ("Read" and "Write"). A dark glass stopwatch with mono digits; it can run, freeze with a
 * flash, carry a spoken prefix ("under", "≈") and fly between a corner chip and a hero size.
 */
import React from 'react';
import {PAL, Rich} from '../../kit';
import {TAU, clamp01, rgba} from '../../kit';
import {GlassPlate, monoStyle, sansStyle} from './fx';

export type ClockProps = {
  frame: number;
  label: string;
  value: number;
  decimals: number;
  accent: string;
  /** centre (screen px) and scale */
  x: number;
  y: number;
  scale: number;
  opacity: number;
  prefix?: string;
  /** 0..1 prefix visibility */
  prefixIn?: number;
  running?: boolean;
  /** frame the clock stopped (flash) */
  stopAt?: number;
};

export const CLOCK_W = 520;
export const CLOCK_H = 196;

export const Clock: React.FC<ClockProps> = ({frame: f, label, value, decimals, accent, x, y, scale, opacity, prefix, prefixIn = 0, running = false, stopAt}) => {
  if (opacity <= 0.01) return null;
  const st = stopAt !== undefined && f >= stopAt ? Math.exp(-(f - stopAt) / 5) : 0;
  const digits = value.toFixed(decimals);
  const blink = running ? 0.5 + 0.5 * Math.sin((TAU * f) / 10) : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity}}>
      <div style={{position: 'absolute', left: -CLOCK_W / 2, top: -CLOCK_H / 2, transform: `scale(${scale})`, transformOrigin: '50% 50%'}}>
        <GlassPlate w={CLOCK_W} h={CLOCK_H} accent={accent} glow={0.35 + 0.9 * st}>
          <div style={{position: 'absolute', left: 34, top: 14, display: 'flex', alignItems: 'center', gap: 14}}>
            <span style={sansStyle(56, PAL.annotation, 600)}>{label}</span>
            <span style={{width: 14, height: 14, borderRadius: 7, background: accent, opacity: running ? blink : 0.85, boxShadow: `0 0 12px ${rgba(accent, 0.9)}`}} />
          </div>
          <div style={{position: 'absolute', right: 30, bottom: 16, display: 'flex', alignItems: 'baseline', gap: 10}}>
            {prefix ? (
              <span style={{...sansStyle(56, accent, 700), opacity: clamp01(prefixIn), transform: `translateX(${(1 - clamp01(prefixIn)) * 20}px)`, display: 'inline-block'}}>
                <Rich text={prefix} weight={700} />
              </span>
            ) : null}
            <span style={{...monoStyle(104, st > 0.05 ? '#FFFFFF' : PAL.ink), textShadow: st > 0.02 ? `0 0 ${30 * st}px ${rgba(accent, 0.95)}` : `0 0 18px ${rgba(accent, 0.25)}`}}>{digits}</span>
            <span style={sansStyle(58, PAL.muted, 600)}>s</span>
          </div>
          {st > 0.02 ? <div style={{position: 'absolute', inset: 0, background: rgba('#FFFFFF', 0.28 * st)}} /> : null}
        </GlassPlate>
      </div>
    </div>
  );
};
