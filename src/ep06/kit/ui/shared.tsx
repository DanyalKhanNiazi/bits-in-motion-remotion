/**
 * Ep06 UI kit: shared pieces. Windows chrome tokens, the [kit] warning, colour regrades of baked render accents,
 * the generic cursor, and image crops (a region of a render drawn as its own layer).
 */
import React from 'react';
import {PAL} from '../look';
import {assetBox, assetUrl, type AssetName} from '../assets';
import {clamp01, prog, quadMatrix, rgba, springAt, track, useImageReady, type Quad} from '../util';
import {EASE, SPRING} from '../look';
import type {Box} from './regions';
import {kitWarn} from '../text';

/** Dark Windows chrome (DIRECTION §2.5). Selection is structure grey, never cyan. */
export const WIN = {
  desk: '#0A101B',
  deskHi: '#121B2C',
  body: '#161D2B',
  title: '#1E2738',
  field: '#111827',
  console: '#0A0E16',
  line: rgba(PAL.structure, 0.16),
  lineHi: rgba(PAL.structure, 0.32),
  text: PAL.ink,
  muted: PAL.muted,
  dim: '#5D6A84',
  select: PAL.structure,
  blank: '#2A3449',
} as const;

/** Warn when must-read text lands under its floor on screen (size × scale). */
export const floorCheck = (what: string, size: number, scale: number | undefined, floor = 40): void => {
  if (scale !== undefined && size * scale < floor - 0.5) kitWarn(`text below floor: ${what} is ${(size * scale).toFixed(1)}px on screen (floor ${floor})`);
};
export const wordCount = (s: string): number => s.split(/\s+/).filter(Boolean).length;

/** Filters that regrade a baked cyan accent (CSS hue rotation from ≈187°). */
export const REGRADE = {
  white: 'saturate(0) brightness(1.18)',
  magenta: 'hue-rotate(106deg) saturate(1.25) brightness(1.05)',
  amber: 'hue-rotate(-146deg) saturate(1.6) brightness(1.12)',
} as const;

/** Small crops of the render redrawn with a filter (children of a Prop, native px). Each crop filters only its own box. */
export const Regrade: React.FC<{src: AssetName; boxes: readonly Box[]; filter: string; url?: string}> = ({src, boxes, filter, url}) => {
  const b = assetBox(src);
  const u = url ?? assetUrl(src);
  useImageReady(u);
  return (
    <>
      {boxes.map(([x0, y0, x1, y1], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x0,
            top: y0,
            width: x1 - x0,
            height: y1 - y0,
            backgroundImage: `url(${u})`,
            backgroundSize: `${b.w}px ${b.h}px`,
            backgroundPosition: `${-x0}px ${-y0}px`,
            filter,
          }}
        />
      ))}
    </>
  );
};

/** A rectangular crop of an asset drawn into a w×h box (stretch), optionally mapped onto a quad. */
export const Crop: React.FC<{src: AssetName; box: Box; w: number; h: number; quad?: Quad; style?: React.CSSProperties; children?: React.ReactNode}> = ({
  src,
  box,
  w,
  h,
  quad,
  style,
  children,
}) => {
  const b = assetBox(src);
  const url = assetUrl(src);
  useImageReady(url);
  const [x0, y0, x1, y1] = box;
  const sx = w / (x1 - x0);
  const sy = h / (y1 - y0);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        overflow: 'hidden',
        backgroundImage: `url(${url})`,
        backgroundSize: `${b.w * sx}px ${b.h * sy}px`,
        backgroundPosition: `${-x0 * sx}px ${-y0 * sy}px`,
        transformOrigin: '0 0',
        transform: quad ? quadMatrix(w, h, quad) : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** The passport card (fictional-passport_b, card only) as a crop: thumbnails, the viewer, the scanner tray. */
export const PASS_CARD_BOX: Box = [434, 209, 1048, 1113];
export const PASS_PHOTO_BOX: Box = [523, 277, 958, 725];
export const PASS_CARD_ASPECT = (1048 - 434) / (1113 - 209);

/* ---------------------------------------------------------------- cursor */
export type CursorKey = {f: number; x: number; y: number; click?: boolean};
/** Cursor position at a frame (keys eased with EASE.cam; holds outside). */
export const cursorAt = (keys: readonly CursorKey[], f: number): {x: number; y: number} => ({
  x: track(f, keys.map((k) => [k.f, k.x, EASE.cam] as const)),
  y: track(f, keys.map((k) => [k.f, k.y, EASE.cam] as const)),
});

/** A generic arrow pointer (white, dark outline); clicks dip and ring. Keys in parent px. */
export const Cursor: React.FC<{frame: number; keys: readonly CursorKey[]; size?: number; at?: number; exitAt?: number}> = ({frame: f, keys, size = 34, at, exitAt}) => {
  if (!keys.length) return null;
  const op = (at === undefined ? 1 : prog(f, at, 5)) * (exitAt === undefined ? 1 : 1 - prog(f, exitAt, 6));
  if (op <= 0) return null;
  const p = cursorAt(keys, f);
  let press = 0;
  let ring: React.ReactNode = null;
  for (const k of keys) {
    if (!k.click) continue;
    const t = f - k.f;
    if (t >= -2 && t < 4) press = Math.max(press, 1 - Math.abs(t - 1) / 3);
    if (t >= 0 && t < 16) {
      const u = t / 16;
      ring = (
        <div
          style={{
            position: 'absolute',
            left: -size * (0.5 + u * 0.7),
            top: -size * (0.5 + u * 0.7),
            width: size * (1 + u * 1.4),
            height: size * (1 + u * 1.4),
            borderRadius: '50%',
            border: `${Math.max(2, size * 0.07)}px solid ${rgba(PAL.ink, 0.7 * (1 - u))}`,
          }}
        />
      );
    }
  }
  return (
    <div style={{position: 'absolute', left: p.x, top: p.y, width: 0, height: 0, opacity: op, pointerEvents: 'none'}}>
      {ring}
      <svg
        width={size}
        height={size * 1.45}
        viewBox="0 0 20 29"
        style={{position: 'absolute', left: -1, top: -1, overflow: 'visible', transform: `scale(${1 - 0.14 * press})`, transformOrigin: '0 0'}}
      >
        <path d="M1 1 L1 22 L6.2 17.4 L9.6 25.6 L13.2 24.1 L9.8 16.1 L16.6 16.1 Z" fill="rgba(0,0,0,0.45)" transform="translate(1.4 2)" />
        <path d="M1 1 L1 22 L6.2 17.4 L9.6 25.6 L13.2 24.1 L9.8 16.1 L16.6 16.1 Z" fill={PAL.ink} stroke="#05070C" strokeWidth={1.4} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/** 0→1 pop scale for UI pieces that appear on a frame (spring with overshoot). */
export const popIn = (f: number, at: number | undefined): number => (at === undefined ? 1 : springAt(f, at, SPRING.pop));
export const fadeOut = (f: number, exitAt: number | undefined, dur = 8): number => (exitAt === undefined ? 1 : 1 - prog(f, exitAt, dur, EASE.inCubic));
export const seen = (v: number): number => clamp01(v);
