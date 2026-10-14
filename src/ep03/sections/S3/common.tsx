/** S3 · shared bits: the question, a token row with per-tile glow, a dashed slot, simple helpers. */
import React, {useId} from 'react';
import {BitHead, EASE, PAL, SANS, TokenTile, clamp01, prog, rgba, safeId, springAt, tileH, tileRowLayout, useFontsReady, type Spring} from '../../kit';

export const QUESTION = ['Why', 'do', 'AI', 'answers', 'arrive', 'one', 'piece', 'at', 'a', 'time', '?'];

/** A row of tiles centred on (x, y) with optional per-tile glow, snap schedule and a slide-in offset. */
export const Row: React.FC<{
  frame: number;
  tokens: readonly string[];
  x: number;
  y: number;
  size: number;
  gap?: number;
  snapAt?: (i: number) => number | undefined;
  from?: {dx?: number; dy?: number; rot?: number};
  glow?: (i: number) => number;
  opacity?: number;
  dx?: number;
  ghostLast?: boolean;
}> = ({frame, tokens, x, y, size, gap = 14, snapAt, from, glow, opacity = 1, dx = 0, ghostLast}) => {
  useFontsReady();
  const L = tileRowLayout(tokens, size, gap);
  if (opacity <= 0.002) return null;
  return (
    <div style={{position: 'absolute', left: x + dx, top: y, width: 0, height: 0, opacity}}>
      {tokens.map((t, i) => (
        <TokenTile
          key={i}
          frame={frame}
          text={t}
          x={L.xs[i]}
          y={L.ys[i]}
          size={size}
          w={L.ws[i]}
          snapAt={snapAt?.(i)}
          from={from}
          newest={glow ? glow(i) : 0}
          ghost={ghostLast && i === tokens.length - 1}
        />
      ))}
    </div>
  );
};

/** Row geometry (stage px) for a row centred on (x, y). */
export const rowGeom = (tokens: readonly string[], size: number, gap: number, x: number, y: number) => {
  const L = tileRowLayout(tokens, size, gap);
  return {
    xs: L.xs.map((v) => x + v),
    ws: L.ws,
    left: x - L.total / 2,
    right: x + L.total / 2,
    top: y - tileH(size) / 2,
    bottom: y + tileH(size) / 2,
    total: L.total,
  };
};

/** A dashed, breathing "next" slot. */
export const Slot: React.FC<{frame: number; x: number; y: number; w: number; h: number; at: number; exitAt?: number; color?: string}> = ({frame, x, y, w, h, at, exitAt, color = PAL.info}) => {
  if (frame < at) return null;
  const sp = springAt(frame, at, {damping: 12, stiffness: 220, mass: 0.6});
  const ex = exitAt !== undefined ? prog(frame, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const br = 0.6 + 0.4 * Math.sin((frame - at) / 5);
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        borderRadius: h * 0.16,
        border: `3px dashed ${rgba(color, 0.55 + 0.35 * br)}`,
        background: rgba(color, 0.06 + 0.05 * br),
        boxShadow: `0 0 ${18 + 10 * br}px ${rgba(color, 0.25 * br)}`,
        transform: `scale(${Math.max(0, sp) * (1 - 0.2 * ex)})`,
        opacity: 1 - ex,
      }}
    />
  );
};

/** The Bit at rest, bobbing (screen px). */
export const RestBit: React.FC<{frame: number; x: number; y: number; size?: number; opacity?: number}> = ({frame, x, y, size = 20, opacity = 1}) => {
  const gid = safeId(useId());
  if (opacity <= 0.01) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <BitHead x={x} y={y + Math.sin(frame / 7.6) * 3} size={size} gid={gid} opacity={opacity} />
    </svg>
  );
};

/** Plain text block (for small UI-ish captions inside props), Sora. */
export const T: React.FC<{x: number; y: number; size: number; color?: string; weight?: number; align?: 'left' | 'center' | 'right'; children: React.ReactNode; opacity?: number; mono?: string}> = ({
  x,
  y,
  size,
  color = PAL.ink,
  weight = 600,
  align = 'left',
  children,
  opacity = 1,
  mono,
}) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(${align === 'left' ? 0 : align === 'right' ? -100 : -50}%, -50%)`,
      fontFamily: mono ?? SANS,
      fontWeight: weight,
      fontSize: size,
      color,
      whiteSpace: 'nowrap',
      opacity,
      lineHeight: 1.1,
    }}
  >
    {children}
  </div>
);

export const sp = (frame: number, at: number, cfg: Spring) => springAt(frame, at, cfg);
export const fade = (frame: number, a: number, b: number) => clamp01((frame - a) / Math.max(1, b - a));
