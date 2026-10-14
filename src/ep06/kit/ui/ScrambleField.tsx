/**
 * Ep06 UI kit: <ScrambleField>, unreadable bytes: MONO glyphs in muted ink, reseeded every 3 frames, one <text> per row
 * (never cyan; no digits, so no number ever reads as a claim). <ScrambleRows> is the same inside an existing <svg>.
 *
 *   <ScrambleField frame={f} rect={{x: 1180, y: 300, w: 560, h: 380}} at={a} dur={120} seed="drive" />
 */
import React from 'react';
import {random} from 'remotion';
import {MONO, PAL} from '../look';
import {prog} from '../util';

const GLYPHS = 'ABCDEFGHJKLMNPQRSTUVWXYZ#%&@$*+=<>?/{}[]~^';

export type ScrambleProps = {
  frame: number;
  rect: {x: number; y: number; w: number; h: number};
  at?: number;
  /** visible for dur frames (default: until exitAt or forever) */
  dur?: number;
  exitAt?: number;
  seed?: string;
  /** glyph size in px (row pitch = 1.25 × size) */
  size?: number;
  color?: string;
  /** frames between reseeds (default 3) */
  every?: number;
  /** 0..1 how much of the field is lit (glyphs fade in row by row) */
  fill?: number;
};

const rowText = (seed: string, row: number, tick: number, n: number): string => {
  let s = '';
  for (let i = 0; i < n; i++) s += GLYPHS[Math.floor(random(`${seed}-${row}-${i}-${tick}`) * GLYPHS.length)];
  return s;
};

/** Rows of glyphs as SVG <text> (one per row), for use inside an <svg>. */
export const ScrambleRows: React.FC<ScrambleProps> = ({frame: f, rect, at = -1e9, dur, exitAt, seed = 'scramble', size = 22, color = PAL.muted, every = 3, fill = 1}) => {
  const end = exitAt ?? (dur !== undefined ? at + dur : undefined);
  const vin = prog(f, at, 8);
  const vout = end === undefined ? 1 : 1 - prog(f, end - 6, 6);
  const op = vin * vout;
  if (op <= 0) return null;
  const pitch = size * 1.25;
  const rows = Math.max(1, Math.floor(rect.h / pitch));
  const cols = Math.max(1, Math.floor(rect.w / (size * 0.6)));
  const tick = Math.floor((f - Math.min(f, at)) / every);
  const lit = Math.ceil(rows * fill * vin);
  return (
    <g opacity={op} fontFamily={MONO} fontWeight={500} fontSize={size} fill={color}>
      {Array.from({length: Math.min(rows, lit)}, (_, r) => (
        <text key={r} x={rect.x} y={rect.y + (r + 0.8) * pitch} opacity={0.55 + 0.45 * random(`${seed}-o-${r}-${tick}`)} textLength={cols * size * 0.6} lengthAdjust="spacingAndGlyphs">
          {rowText(seed, r, tick, cols)}
        </text>
      ))}
    </g>
  );
};

/** Standalone field: positions its own <svg> over rect (parent px). */
export const ScrambleField: React.FC<ScrambleProps> = (p) => (
  <svg width={p.rect.w} height={p.rect.h} viewBox={`${p.rect.x} ${p.rect.y} ${p.rect.w} ${p.rect.h}`} style={{position: 'absolute', left: p.rect.x, top: p.rect.y, overflow: 'visible', pointerEvents: 'none'}}>
    <ScrambleRows {...p} />
  </svg>
);
