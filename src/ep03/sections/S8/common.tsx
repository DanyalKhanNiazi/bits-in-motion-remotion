// S8 shared bits: mini tiles, glyph marks, small helpers.
import React from 'react';
import {EASE, PAL, Rich, SANS, SPRING, clamp01, lerp, prog, rgba, springAt} from '../../kit';

/** A small white answer tile (the TokenTile look, light enough to draw dozens per frame). */
export const MiniTile: React.FC<{
  x: number;
  y: number;
  text: string;
  size: number;
  w?: number;
  rot?: number;
  opacity?: number;
  scale?: number;
  /** 0..1 cyan rim (newest / kept) */
  rim?: number;
  /** 0..1 coral tint (rejected) */
  bad?: number;
  /** a dashed guess (not yet confirmed) */
  ghost?: number;
  /** an empty dashed place (no text) */
  slot?: boolean;
  textColor?: string;
}> = ({x, y, text, size, w, rot = 0, opacity = 1, scale = 1, rim = 0, bad = 0, ghost = 0, slot = false, textColor}) => {
  if (opacity <= 0.002 || scale <= 0.002) return null;
  const H = size * 1.5;
  const Wd = w ?? Math.max(size * 1.3, text.length * size * 0.6 + size * 0.95);
  const g = clamp01(ghost);
  const solidBg = `linear-gradient(180deg, #FFFFFF 0%, ${PAL.tile} 40%, ${PAL.tileMid} 100%)`;
  const r = clamp01(rim);
  const b = clamp01(bad);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: -Wd / 2,
          top: -H / 2,
          width: Wd,
          height: H,
          transform: `rotate(${rot}deg) scale(${scale})`,
          borderRadius: size * 0.24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: slot ? rgba('#DDE8FF', 0.06) : g > 0.5 ? rgba('#F4F8FF', 0.9) : solidBg,
          border: slot ? `${Math.max(2, size * 0.06)}px dashed ${rgba(PAL.annotation, 0.6)}` : g > 0.5 ? `${Math.max(3, size * 0.08)}px dashed ${PAL.info}` : undefined,
          boxShadow:
            slot
              ? undefined
              : g > 0.5
              ? `0 0 ${size * 0.5}px ${rgba(PAL.info, 0.45)}, 0 ${size * 0.3}px ${size * 0.4}px rgba(0,0,0,0.4)`
              : [
                  'inset 0 2px 0 rgba(255,255,255,0.95)',
                  `0 ${size * 0.11}px 0 ${PAL.tileEdge}`,
                  `0 ${size * 0.13}px 0 #8E97A8`,
                  `0 ${size * 0.4}px ${size * 0.5}px rgba(0,0,0,0.5)`,
                  r > 0 ? `0 0 0 ${3 + 2 * r}px ${rgba(PAL.info, 0.95 * r)}, 0 0 ${30 * r}px ${rgba(PAL.info, 0.65 * r)}` : '',
                  b > 0 ? `0 0 0 ${3 + 2 * b}px ${rgba(PAL.wait, 0.95 * b)}, 0 0 ${26 * b}px ${rgba(PAL.wait, 0.6 * b)}` : '',
                ]
                  .filter(Boolean)
                  .join(', '),
        }}
      >
        {b > 0 ? <div style={{position: 'absolute', inset: 0, borderRadius: size * 0.24, background: rgba(PAL.wait, 0.32 * b)}} /> : null}
        <span
          style={{
            position: 'relative',
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: size,
            lineHeight: 1,
            marginTop: -size * 0.04,
            color: textColor ?? (b > 0.5 ? '#5A1E1E' : g > 0.5 ? '#1B3A66' : PAL.tileInk),
            fontStyle: g > 0.5 && b <= 0.5 ? 'italic' : undefined,
            whiteSpace: 'nowrap',
          }}
        >
          <Rich text={text} weight={600} />
        </span>
      </div>
    </div>
  );
};

/** A ✓ or ✗ stamp that pops with overshoot and a ring. */
export const Mark: React.FC<{frame: number; at: number; x: number; y: number; ok: boolean; size?: number; exitAt?: number}> = ({frame, at, x, y, ok, size = 92, exitAt}) => {
  if (frame < at) return null;
  const sp = springAt(frame, at, SPRING.pop);
  const ex = exitAt !== undefined ? prog(frame, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const c = ok ? PAL.info : PAL.wait;
  const t = frame - at;
  const ring = t < 18 ? t / 18 : 1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: 1 - ex}}>
      {t < 18 ? (
        <div
          style={{
            position: 'absolute',
            left: -size * 0.9,
            top: -size * 0.9,
            width: size * 1.8,
            height: size * 1.8,
            borderRadius: '50%',
            border: `3px solid ${rgba(c, 0.8 * (1 - ring))}`,
            transform: `scale(${0.5 + 0.8 * EASE.out(ring)})`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: -size * 0.62,
          top: -size * 0.62,
          width: size * 1.24,
          height: size * 1.24,
          borderRadius: '50%',
          background: rgba('#070B15', 0.86),
          border: `4px solid ${c}`,
          boxShadow: `0 0 ${size * 0.35}px ${rgba(c, 0.55)}`,
          transform: `scale(${Math.max(0, sp)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: c,
          fontSize: size * 0.82,
          lineHeight: 1,
        }}
      >
        <span style={{marginTop: size * 0.08}}>
          <Rich text={ok ? '✓' : '✗'} weight={700} color={c} />
        </span>
      </div>
    </div>
  );
};

/** Quadratic arc between two points with a lift (screen px), 0..1. */
export const arcPt = (a: {x: number; y: number}, b: {x: number; y: number}, lift: number, u: number) => {
  const mx = (a.x + b.x) / 2;
  const my = Math.min(a.y, b.y) - lift;
  const x = (1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * mx + u * u * b.x;
  const y = (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * my + u * u * b.y;
  return {x, y};
};

export const ease = EASE;
export {lerp};
