/**
 * Emphasis lock-on (brand spec §4.1): two square brackets in emphasis, 4 px stroke, each with two 14 px
 * serif ticks. They snap from 24 px outside the target to 8 px padding in 5 frames (≤ 6% overshoot),
 * hold, then fade over 6 frames. At most once per 10 s; one emphasis device at a time.
 *
 * `lockAt` is the frame the snap COMPLETES (the lock anchor and the Lock cue): it starts 5 frames earlier.
 *
 * Usage:
 *   <Brackets box={{x: 180, y: 560, w: 120, h: 80}} lockAt={ANCHORS.lock} fadeAt={1829} />
 */
import React from 'react';
import {BRACKETS} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {polyPath, type Box} from '../geom';
import {EASE, progress} from '../motion';

export interface BracketsProps extends KitBaseProps {
  /** Target bounds (the brackets end up `pad` px outside). */
  box: Box;
  /** Frame the snap completes (lock). */
  lockAt: number;
  /** Fade start (6 frames). */
  fadeAt?: number;
  pad?: number;
  from?: number;
  serif?: number;
  /** Ink instead of emphasis (colour-physics scenes). */
  neutral?: boolean;
  color?: string;
  render?: (s: {x0: number; y0: number; x1: number; y1: number; opacity: number; offset: number}) => React.ReactNode;
}

export const Brackets: React.FC<BracketsProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const start = p.lockAt - BRACKETS.snapFrames;
  if (frame < start) return null;
  const opacity = Math.min(progress(frame, start, 2), p.fadeAt !== undefined ? 1 - progress(frame, p.fadeAt, BRACKETS.fadeFrames, EASE.exit) : 1);
  if (opacity <= 0) return null;
  const snap = progress(frame, start, BRACKETS.snapFrames, EASE.snap);
  const off = (p.from ?? BRACKETS.from) * (1 - snap);
  const pad = p.pad ?? BRACKETS.pad;
  const x0 = p.box.x - pad - off;
  const x1 = p.box.x + p.box.w + pad + off;
  const y0 = p.box.y - pad - off;
  const y1 = p.box.y + p.box.h + pad + off;
  if (p.render) return <>{p.render({x0, y0, x1, y1, opacity, offset: off})}</>;
  const s = p.serif ?? BRACKETS.serif;
  const col = p.color ?? (p.neutral ? theme.ink : theme.emphasis);
  const seed = p.seed ?? 'brackets';
  const left = polyPath([
    [x0 + s, y0],
    [x0, y0],
    [x0, y1],
    [x0 + s, y1],
  ]);
  const right = polyPath([
    [x1 - s, y0],
    [x1, y0],
    [x1, y1],
    [x1 - s, y1],
  ]);
  return (
    <g opacity={opacity}>
      {skin.stroke({d: left, color: col, width: BRACKETS.stroke, role: 'emphasis', seed: `${seed}:l`, frame, join: 'miter', cap: 'square'})}
      {skin.stroke({d: right, color: col, width: BRACKETS.stroke, role: 'emphasis', seed: `${seed}:r`, frame, join: 'miter', cap: 'square'})}
    </g>
  );
};
