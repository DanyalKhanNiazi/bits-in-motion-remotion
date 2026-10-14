/**
 * Ep03 kit: motivated transitions inside a section. Each takes render functions (frame → node), so both scenes keep
 * animating through the move.
 *   <Whip>        directional-blur slide between two scenes
 *   <ZoomThrough> push through the outgoing scene into the next
 *   <FlashCut>    a hard cut hidden in a light flash
 *   <Rewind>      time scrubs backwards with a tape glitch (P08)
 */
import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, MONO, PAL} from './look';
import {clamp01, lerp, prog, rgba, rnd, safeId, smooth} from './util';
import type {Render} from './LensDive';

type Dir = 'left' | 'right' | 'up' | 'down';
const vec = (d: Dir): [number, number] => (d === 'left' ? [-1, 0] : d === 'right' ? [1, 0] : d === 'up' ? [0, -1] : [0, 1]);

/** Whip pan: the outgoing scene whips off in `dir`, the next one follows it in, with motion blur and streaks. */
export const Whip: React.FC<{frame: number; at: number; dur?: number; dir?: Dir; a: Render; b: Render}> = ({frame: f, at, dur = 12, dir = 'left', a, b}) => {
  const id = safeId(useId());
  const t = (f - at) / dur;
  if (t < 0) return <>{a(f)}</>;
  if (t >= 1) return <>{b(f)}</>;
  const [vx, vy] = vec(dir);
  const span = vx !== 0 ? 1920 : 1080;
  const e = EASE.whip(t);
  const eP = EASE.whip(clamp01(t - 1 / dur));
  const v = (e - eP) * span;
  const std = Math.min(80, v * 0.5);
  const off = e * span;
  const sx = vx !== 0 ? std : 0;
  const sy = vy !== 0 ? std : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: PAL.void}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={`${id}-wb`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={`${sx.toFixed(1)} ${sy.toFixed(1)}`} edgeMode="duplicate" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{transform: `translate(${vx * off}px, ${vy * off}px)`, filter: `url(#${id}-wb)`}}>{a(f)}</AbsoluteFill>
      <AbsoluteFill style={{transform: `translate(${-vx * (span - off)}px, ${-vy * (span - off)}px)`, filter: `url(#${id}-wb)`}}>{b(f)}</AbsoluteFill>
      <AbsoluteFill style={{opacity: clamp01(v / 160) * 0.55, mixBlendMode: 'screen'}}>
        {Array.from({length: 9}, (_, i) => {
          const p = rnd(`whip-${i}`);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: vx !== 0 ? 0 : `${p * 100}%`,
                top: vx !== 0 ? `${p * 100}%` : 0,
                width: vx !== 0 ? '100%' : 3 + p * 4,
                height: vx !== 0 ? 3 + p * 4 : '100%',
                background: `linear-gradient(${vx !== 0 ? 90 : 180}deg, rgba(0,0,0,0), ${rgba(i % 3 ? '#FFFFFF' : PAL.info, 0.7)}, rgba(0,0,0,0))`,
              }}
            />
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Zoom-through: push into (cx, cy) of the outgoing scene; the next scene grows out of that point. */
export const ZoomThrough: React.FC<{frame: number; at: number; dur?: number; cx?: number; cy?: number; a: Render; b: Render}> = ({frame: f, at, dur = 16, cx = 960, cy = 540, a, b}) => {
  const t = (f - at) / dur;
  if (t < 0) return <>{a(f)}</>;
  if (t >= 1) return <>{b(f)}</>;
  const tA = clamp01(t / 0.6);
  const sA = 1 + 5 * EASE.inExpo(tA);
  const opA = 1 - smooth((t - 0.32) / 0.26);
  const tB = clamp01((t - 0.36) / 0.64);
  const sB = lerp(0.3, 1, EASE.outExpo(tB));
  const opB = smooth((t - 0.36) / 0.2);
  const bx = lerp(cx, 960, EASE.outExpo(tB));
  const by = lerp(cy, 540, EASE.outExpo(tB));
  const flash = Math.exp(-(((t - 0.45) / 0.12) ** 2));
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: PAL.void}}>
      {opA > 0.01
        ? [0.82, 0.92, 1].map((k, i) => (
            <AbsoluteFill
              key={i}
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform: `scale(${1 + (sA - 1) * k})`,
                opacity: opA * (i === 2 ? 1 : 0.28),
                filter: `blur(${tA * 14 * (i === 2 ? 1 : 1.6)}px)`,
                mixBlendMode: i === 2 ? undefined : 'screen',
              }}
            >
              {a(f)}
            </AbsoluteFill>
          ))
        : null}
      {opB > 0.01 ? (
        <AbsoluteFill style={{opacity: opB, filter: tB < 1 ? `blur(${(1 - tB) * 10}px)` : undefined}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${bx - 960 * sB}px, ${by - 540 * sB}px) scale(${sB})`}}>
            {b(f)}
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{background: `radial-gradient(circle at ${lerp(cx, 960, 0.5)}px ${lerp(cy, 540, 0.5)}px, ${rgba('#FFFFFF', 0.85 * flash)}, ${rgba(PAL.info, 0.35 * flash)} 30%, rgba(0,0,0,0) 70%)`, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

/** A hard cut at `at`, hidden in a flash (the flash peaks on the cut and decays over ~8 frames). */
export const FlashCut: React.FC<{frame: number; at: number; a: Render; b: Render; color?: string; strength?: number}> = ({frame: f, at, a, b, color = '#FFFFFF', strength = 1}) => {
  const d = f - at;
  const pre = d < 0 && d >= -2 ? (3 + d) / 3 : 0;
  const post = d >= 0 ? Math.exp(-d / 3) : 0;
  const e = Math.max(pre * 0.5, post) * strength;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: e > 0.02 ? `brightness(${1 + 1.2 * e})` : undefined}}>{d < 0 ? a(f) : b(f)}</AbsoluteFill>
      {e > 0.01 ? <AbsoluteFill style={{background: rgba(color, 0.75 * e), mixBlendMode: 'screen'}} /> : null}
    </AbsoluteFill>
  );
};

/**
 * Rewind: over [at, at + dur] the scene's own time runs from `from` back to `to` (render gets the scene frame), with a
 * tape glitch: sliced horizontal displacement, an RGB split, scanlines, a tracking band and a ◀◀ mark.
 */
export const Rewind: React.FC<{frame: number; at: number; dur?: number; from: number; to: number; render: Render; after?: Render}> = ({
  frame: f,
  at,
  dur = 30,
  from,
  to,
  render,
  after,
}) => {
  const id = safeId(useId());
  const t = (f - at) / dur;
  if (t < 0) return <>{render(f)}</>;
  if (t >= 1) return <>{(after ?? render)(f)}</>;
  const sceneF = Math.round(lerp(from, to, EASE.inOut(t)));
  const env = Math.sin(Math.PI * clamp01(t)) ;
  const amp = (18 + 40 * rnd(`rw-a-${f}`)) * (0.4 + 0.6 * env);
  const split = 4 + 8 * env;
  const band = ((f * 37) % 1300) - 110;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: PAL.void}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={`${id}-rw`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.0007 0.055" numOctaves={1} seed={f % 97} result="n" />
            <feComponentTransfer in="n" result="n2">
              <feFuncG type="table" tableValues="0.5 0.5" />
            </feComponentTransfer>
            <feDisplacementMap in="SourceGraphic" in2="n2" scale={amp} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={split} result="ro" />
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
            <feOffset in="gb" dx={-split} result="gbo" />
            <feBlend in="ro" in2="gbo" mode="screen" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id}-rw) saturate(0.85) brightness(1.05)`}}>{render(sceneF)}</AbsoluteFill>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)', opacity: 0.7}} />
      <div style={{position: 'absolute', left: 0, top: band, width: 1920, height: 90, background: `linear-gradient(180deg, rgba(255,255,255,0), ${rgba('#DDEBFF', 0.16)}, rgba(255,255,255,0))`, filter: 'blur(2px)'}} />
      <div style={{position: 'absolute', left: 120, top: 110, display: 'flex', alignItems: 'center', gap: 18, opacity: 0.75 + 0.25 * Math.sin(f * 1.3)}}>
        <svg width={92} height={56} viewBox="0 0 92 56">
          <path d="M44 4 L4 28 L44 52 Z M88 4 L48 28 L88 52 Z" fill={PAL.ink} />
        </svg>
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 44, color: PAL.ink, letterSpacing: '0.08em'}}>
          {`${String(Math.floor(sceneF / 30 / 60)).padStart(2, '0')}:${String(Math.floor((sceneF / 30) % 60)).padStart(2, '0')}`}
        </span>
      </div>
      <div style={{position: 'absolute', left: 120, right: 120, top: 900, height: 6, borderRadius: 3, background: rgba(PAL.structure, 0.35)}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(1 - prog(f, at, dur, EASE.inOut)) * 100}%`, borderRadius: 3, background: PAL.info}} />
      </div>
    </AbsoluteFill>
  );
};
