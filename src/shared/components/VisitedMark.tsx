/**
 * D24 "visited" mark: a 3 px annotation-grey outline with a hollow pip (12 px, docked top-right,
 * 8 px outside). Used for stages that have handed over (S06: "Firmware on CPU", "Loader").
 *
 * Usage:
 *   <VisitedMark x={1180} y={720} w={140} h={80} at={812} />
 */
import React from 'react';
import {GLYPH, STROKE} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {rectPath, squarePath, pathLength} from '../geom';
import {EASE, progress} from '../motion';

export interface VisitedMarkProps extends KitBaseProps {
  /** The part's box. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Corner radius (default 10, the part radius). */
  r?: number;
  /** Grow (+) or shrink (−) the outline around the box. */
  outset?: number;
  /** Draws on over 8 frames from here (omit: always shown). */
  at?: number;
  outAt?: number;
  /** Hide the pip (when the part keeps its own state glyph). */
  pip?: boolean;
  color?: string;
  /** Replace the drawing; geometry and timing stay the kit's. */
  render?: (s: {d: string; draw: number; pipIn: number; opacity: number; pip: [number, number]; color: string}) => React.ReactNode;
}

export const VisitedMark: React.FC<VisitedMarkProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  if (p.at !== undefined && frame < p.at) return null;
  const draw = p.at !== undefined ? progress(frame, p.at, 8, EASE.arrive) : 1;
  const opacity = p.outAt !== undefined ? 1 - progress(frame, p.outAt, 6, EASE.exit) : 1;
  if (opacity <= 0) return null;
  const o = p.outset ?? 0;
  const col = p.color ?? theme.annotation;
  const d = rectPath(p.x - o, p.y - o, p.w + 2 * o, p.h + 2 * o, (p.r ?? STROKE.partRadius) + o);
  const L = pathLength(d);
  const seed = p.seed ?? 'visited';
  const pipIn = p.at !== undefined ? progress(frame, p.at + 4, 4, EASE.arrive) : 1;
  const px = p.x + p.w + o + GLYPH.dock + GLYPH.pip / 2;
  const py = p.y - o - GLYPH.dock - GLYPH.pip / 2;
  if (p.render) return <>{p.render({d, draw, pipIn, opacity, pip: [px, py], color: col})}</>;
  return (
    <g opacity={opacity}>
      {skin.stroke({d, color: col, width: GLYPH.visitedStroke, trim: draw < 1 ? [0, L * draw] : undefined, role: 'annotation', seed: `${seed}:box`, frame, join: 'round'})}
      {p.pip !== false && pipIn > 0
        ? skin.stroke({d: squarePath(px, py, GLYPH.pip - GLYPH.pipStroke, 1), color: col, width: GLYPH.pipStroke, opacity: pipIn, role: 'annotation', seed: `${seed}:pip`, frame})
        : null}
    </g>
  );
};
