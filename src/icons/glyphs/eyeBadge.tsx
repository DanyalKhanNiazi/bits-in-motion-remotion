/**
 * EyeBadge (ICONS.md §5.3): the analogy "lookout" eye. Width = clamp(0.9 × the block's on-screen width, 48, 96)
 * (96 inside a Lens), aspect 0.56. An almond with a filled pupil (r 0.27 of the height), dashed 3 px `annotation`
 * (12/8) FROM ITS FIRST FRAME (dashed draw-on: 02's solid-then-dashed glitch cannot recur), with the ≈ chip at its left.
 * (x, y) is the DOCK point (the lookout's `top` port): the eye sits above it with a 6 px gap.
 */
import React from 'react';
import {COLOR, DUR, GLYPH2, STROKE} from '../../engine/tokens';
import {almondPath} from '../../shared/geom';
import {clamp, discD, prog} from '../primitives';
import {ApproxChip} from './approxChip';
import {dashedReveal, lengthOf} from './common';

export interface EyeBadgeProps {
  x: number;
  y: number;
  frame: number;
  drawAt?: number;
  drawFrames?: number;
  outAt?: number;
  /** The block's on-screen width (screen px). */
  blockWidthPx?: number;
  /** Inside a Lens: fixed 96 px. */
  lens?: boolean;
  /** Gap between the dock point and the eye's bottom (screen px). */
  gap?: number;
  chip?: boolean;
  opacity?: number;
}

export const eyeWidth = (blockWidthPx: number | undefined, lens?: boolean): number =>
  lens ? GLYPH2.eyeMax : clamp(GLYPH2.eyeScale * (blockWidthPx ?? 72), GLYPH2.eyeMin, GLYPH2.eyeMax);

export const EyeBadge: React.FC<EyeBadgeProps> = ({x, y, frame, drawAt, drawFrames = DUR.eyeDraw, outAt, blockWidthPx, lens, gap = 6, chip = true, opacity = 1}) => {
  if (drawAt !== undefined && frame < drawAt) return null;
  const draw = drawAt === undefined ? 1 : prog(frame, drawAt, drawFrames, 'arrive');
  const out = outAt === undefined ? 0 : prog(frame, outAt, 6, 'exit');
  const o = opacity * (1 - out);
  if (o <= 0) return null;
  const W = eyeWidth(blockWidthPx, lens);
  const H = W * GLYPH2.eyeAspect;
  const cx = x;
  const cy = y - gap - H / 2;
  const d = almondPath(cx, cy, W, H);
  const L = lengthOf(d);
  const pupil = (drawAt === undefined ? 1 : prog(frame, drawAt + drawFrames - 3, 3, 'arrive'));
  const pr = H * 0.27 * (0.6 + 0.4 * pupil);
  return (
    <g opacity={o < 1 ? o : undefined}>
      <path
        d={d}
        fill="none"
        stroke={COLOR.annotation}
        strokeWidth={GLYPH2.eyeStroke}
        strokeDasharray={dashedReveal(L, STROKE.analogyDash, draw)}
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
      {pupil > 0 ? <path d={discD(cx, cy, pr)} fill={COLOR.annotation} opacity={pupil} /> : null}
      {chip ? (
        <ApproxChip x={cx - W / 2 - 8 - GLYPH2.approxChip.w / 2} y={cy} frame={frame} inAt={drawAt === undefined ? undefined : drawAt + 4} />
      ) : null}
    </g>
  );
};
