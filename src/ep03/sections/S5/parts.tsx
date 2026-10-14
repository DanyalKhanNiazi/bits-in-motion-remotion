/**
 * S5 shared parts: a stand-alone 3D crate (same look as the Bridge's crates), words that pop on their own spoken
 * frames, a glass card, flares and speed streaks. Everything is a pure function of the absolute frame.
 */
import React, {useId} from 'react';
import {
  Crate,
  EASE,
  MONO,
  PAL,
  Rich,
  SANS,
  SPRING,
  TAU,
  basis,
  clamp01,
  faceQuad,
  lerp,
  lightOf,
  mixHex,
  polyD,
  polyPts,
  prog,
  quadMatrix,
  rgba,
  rnd,
  safeId,
  shadeHex,
  springAt,
  visibleFaces,
  type Box,
  type Cam3,
  type V3,
} from '../../kit';

/* ---------------------------------------------------------------- Crate3D */
export type Crate3DProps = {
  frame: number;
  /** screen (or parent) px of the crate's centre */
  x: number;
  y: number;
  /** approximate on-screen width in px */
  w: number;
  yaw?: number;
  pitch?: number;
  label?: string;
  labelColor?: string;
  opacity?: number;
  /** 0..1 extra cyan glow on the base strip */
  glow?: number;
  /** coral outline (problem) */
  alert?: number;
};

/** The weights crate: the kit <Crate> (the owner's renders) seen through a local camera, so it matches the Bridge's crates. */
export const Crate3D: React.FC<Crate3DProps> = ({x, y, w, yaw = 32, pitch = 22, label, labelColor = PAL.info, opacity = 1, alert = 0}) => {
  if (opacity <= 0.001 || w < 4) return null;
  const S = Math.round(w * 1.9);
  const cam: Cam3 = {tx: 0, ty: 0.31, tz: 0, yaw, pitch, dist: 6, fov: 26};
  const focal = S / 2 / Math.tan((cam.fov * Math.PI) / 360);
  cam.dist = (focal * 1.6) / w;
  const b = basis(cam, S, S);
  const ring = alert > 0.01 ? `drop-shadow(0 0 4px ${rgba(PAL.wait, alert)}) drop-shadow(0 0 18px ${rgba(PAL.wait, 0.75 * alert)})` : '';
  return (
    <div style={{position: 'absolute', left: x - S / 2, top: y - S / 2, width: S, height: S, opacity, pointerEvents: 'none', filter: ring || undefined}}>
      <svg width={S} height={S} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ellipse cx={S / 2} cy={S / 2 + w * 0.2} rx={w * 0.6} ry={w * 0.12} fill="rgba(0,0,0,0.45)" style={{filter: 'blur(8px)'}} />
        <Crate b={b} x={0} z={0} y={0} s={1} h={0.62} label={label} labelColor={labelColor} hero variant="a" />
      </svg>
    </div>
  );
};

/* ---------------------------------------------------------------- SyncWords */
export type SyncWord = readonly [string, number];
/** A line whose words pop on their own spoken frames (spring pop, slight rise). */
export const SyncWords: React.FC<{
  frame: number;
  words: readonly SyncWord[];
  x: number;
  y: number;
  size?: number;
  color?: string;
  weight?: 600 | 700;
  align?: 'left' | 'center' | 'right';
  exitAt?: number;
  scrim?: number;
  accent?: Record<number, string>;
}> = ({frame, words, x, y, size = 56, color = PAL.ink, weight = 600, align = 'center', exitAt, scrim = 0.7, accent}) => {
  if (words.length === 0 || frame < words[0][1] - 2) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 9, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const ax = align === 'left' ? 0 : align === 'right' ? -100 : -50;
  const sIn = prog(frame, words[0][1] - 2, 8, EASE.out);
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(${ax}%, -50%) translateY(${-18 * ex}px)`, opacity: 1 - ex, whiteSpace: 'nowrap', filter: ex > 0 ? `blur(${ex * 5}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          inset: '-0.5em -0.8em',
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${rgba('#03060D', 0.74 * scrim * sIn)}, ${rgba('#03060D', 0.45 * scrim * sIn)} 60%, rgba(3,6,13,0))`,
        }}
      />
      <div style={{position: 'relative', fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: 1.12, color, letterSpacing: '-0.01em'}}>
        {words.map(([w, at], i) => {
          const sp = springAt(frame, at, SPRING.pop);
          const flash = frame >= at ? Math.exp(-(frame - at) / 5) : 0;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                marginRight: i < words.length - 1 ? '0.26em' : 0,
                transform: `translateY(${(1 - Math.min(1, sp)) * 0.35}em) scale(${Math.max(0, 0.6 + 0.4 * sp)})`,
                opacity: clamp01(sp * 2.2),
                color: accent?.[i] ?? color,
                filter: flash > 0.05 ? `brightness(${1 + 0.8 * flash})` : undefined,
              }}
            >
              <Rich text={w} weight={weight} />
            </span>
          );
        })}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Glass card */
export const Glass: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  accent?: string;
  lit?: number;
  frame: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({x, y, w, h, accent = '#8FB6E8', lit = 0.4, frame, children, style}) => {
  const sweep = ((frame * 0.006) % 1.6) - 0.3;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: 28,
        overflow: 'hidden',
        background: `linear-gradient(160deg, ${rgba('#1A2C4E', 0.78)} 0%, ${rgba('#0B1528', 0.86)} 55%, ${rgba('#070E1C', 0.92)} 100%)`,
        border: `2px solid ${rgba(accent, 0.28 + 0.4 * lit)}`,
        boxShadow: `0 30px 70px rgba(0,0,0,0.55), 0 0 ${30 + 40 * lit}px ${rgba(accent, 0.12 + 0.3 * lit)}, inset 0 1px 0 ${rgba('#FFFFFF', 0.18)}`,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: `${sweep * 100 - 30}%`,
          top: '-20%',
          width: '30%',
          height: '140%',
          transform: 'rotate(18deg)',
          background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.07), rgba(255,255,255,0))',
        }}
      />
      {children}
    </div>
  );
};

/* ---------------------------------------------------------------- flare and streaks */
/** Anamorphic flare: a horizontal light streak with a hot core (screen space). */
export const Flare: React.FC<{x: number; y: number; at: number; frame: number; len?: number; color?: string; dur?: number; strength?: number}> = ({
  x,
  y,
  at,
  frame,
  len = 1500,
  color = PAL.info,
  dur = 26,
  strength = 1,
}) => {
  const t = frame - at;
  if (t < -3 || t > dur) return null;
  const a = (t < 0 ? (t + 3) / 3 : Math.exp(-t / (dur / 3.2))) * strength;
  const L = len * (0.55 + 0.45 * EASE.out(clamp01((t + 3) / 10)));
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <div style={{position: 'absolute', left: x - L / 2, top: y - 5, width: L, height: 10, borderRadius: 5, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(color, 0.9 * a)}, rgba(255,255,255,${0.95 * a}), ${rgba(color, 0.9 * a)}, rgba(0,0,0,0))`, filter: 'blur(1.5px)'}} />
      <div style={{position: 'absolute', left: x - L * 0.35, top: y - 26, width: L * 0.7, height: 52, borderRadius: 26, background: `radial-gradient(closest-side, ${rgba(color, 0.45 * a)}, rgba(0,0,0,0))`}} />
      <div style={{position: 'absolute', left: x - 170, top: y - 170, width: 340, height: 340, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(255,255,255,${0.8 * a}), ${rgba(color, 0.4 * a)} 35%, rgba(0,0,0,0))`}} />
    </div>
  );
};

/** Speed streaks along a screen direction (unit dx, dy), drifting fast; `amount` 0..1. */
export const SpeedStreaks: React.FC<{frame: number; dx: number; dy: number; amount: number; count?: number; seed?: string; speed?: number}> = ({
  frame,
  dx,
  dy,
  amount,
  count = 26,
  seed = 'ss',
  speed = 70,
}) => {
  if (amount <= 0.01) return null;
  const ang = Math.atan2(dy, dx);
  const span = 2600;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden', pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <div style={{position: 'absolute', left: 960, top: 540, width: 0, height: 0, transform: `rotate(${ang}rad)`}}>
        {Array.from({length: count}, (_, i) => {
          const r = rnd(`${seed}-${i}`);
          const r2 = rnd(`${seed}-b${i}`);
          const off = ((frame * speed * (0.7 + 0.6 * r2) + r * span) % span) - span / 2;
          const yy = (rnd(`${seed}-y${i}`) - 0.5) * 1500;
          const len = 160 + 380 * r2;
          const op = amount * (0.25 + 0.5 * r) * (1 - Math.abs(yy) / 900);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: off - len,
                top: yy,
                width: len,
                height: 2 + 3 * r,
                borderRadius: 3,
                background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(i % 3 ? '#BFF7FF' : PAL.info, Math.max(0, op))})`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- small helpers */
/** A step function over a list of [frame, value] pairs (holds the latest value). */
export const stepAt = <T,>(frame: number, steps: ReadonlyArray<readonly [number, T]>, dflt: T): T => {
  let v = dflt;
  for (const [f, x] of steps) if (frame >= f) v = x;
  return v;
};

/** A soft breathing scalar (1 ± amp). */
export const breath = (frame: number, period = 80, amp = 0.03, phase = 0) => 1 + amp * Math.sin(TAU * (frame / period + phase));

/** Mono readout chip (e.g. a footnote-like tag), ≥ 40 px. */
export const Tag: React.FC<{frame: number; at: number; text: string; x: number; y: number; exitAt?: number; color?: string; size?: number; icon?: React.ReactNode}> = ({
  frame,
  at,
  text,
  x,
  y,
  exitAt,
  color = PAL.ink,
  size = 40,
  icon,
}) => {
  if (frame < at - 2) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 8) : 0;
  if (ex >= 1) return null;
  const e = prog(frame, at - 2, 10, EASE.out);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(0, -50%) translateX(${(1 - e) * -16}px)`,
        opacity: e * (1 - ex),
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '8px 22px 8px 16px',
        borderRadius: 12,
        background: rgba('#05080F', 0.72),
        border: `2px solid ${rgba(PAL.annotation, 0.3)}`,
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: size,
        color,
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      <Rich text={text} weight={500} />
    </div>
  );
};

/** ◀◀ glyph (rewind) */
export const RewindGlyph: React.FC<{size?: number; color?: string}> = ({size = 40, color = PAL.ink}) => (
  <svg width={size * 1.4} height={size * 0.9} viewBox="0 0 92 56">
    <path d="M44 4 L4 28 L44 52 Z M88 4 L48 28 L88 52 Z" fill={color} />
  </svg>
);

/** ▶▶ glyph (fast forward) */
export const FastForwardGlyph: React.FC<{size?: number; color?: string}> = ({size = 40, color = PAL.ink}) => (
  <svg width={size * 1.4} height={size * 0.9} viewBox="0 0 92 56">
    <path d="M4 4 L44 28 L4 52 Z M48 4 L88 28 L48 52 Z" fill={color} />
  </svg>
);

export const mix = mixHex;
export {lerp};
