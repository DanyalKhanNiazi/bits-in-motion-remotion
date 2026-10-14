/**
 * D24 eye badge: an almond with a pupil. The analogy variant ("lookout") is dashed (12 on / 8 off, 3 px,
 * annotation grey) with a ≈ chip at its top-left, and sits ON the real part, never in place of it.
 * Also exports ApproxChip, the ≈ chip on its own (a vector glyph: the font subset has no U+2248), and
 * AnalogyFrame, the analogy-tag outline: dashed 3 px annotation (12 on / 8 off) with the ≈ chip at its
 * top-left (e.g. the S07 sign-in card, outside the monitor).
 *
 * Usage:
 *   <EyeBadge x={880} y={520} variant="analogy" inAt={650} outAt={712} />
 *   <EyeBadge x={300} y={200} variant="solid" />
 */
import React from 'react';
import {GLYPH, STROKE} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {almondPath, rectPath, pathLength} from '../geom';
import {EASE, progress} from '../motion';

export interface ApproxChipProps extends KitBaseProps {
  /** Chip centre. */
  x: number;
  y: number;
  opacity?: number;
  scale?: number;
  color?: string;
  fill?: string;
}

/** The ≈ chip (analogy marker): a small rounded box with two wavy strokes. */
export const ApproxChip: React.FC<ApproxChipProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const k = p.scale ?? 1;
  const {w, h, r, stroke} = GLYPH.approxChip;
  const W = w * k;
  const H = h * k;
  const col = p.color ?? theme.annotation;
  const seed = p.seed ?? 'approx';
  const wave = (yy: number) => {
    const x0 = p.x - 9 * k;
    const a = 2.6 * k;
    return `M${x0} ${yy}Q${x0 + 4.5 * k} ${yy - 2 * a} ${x0 + 9 * k} ${yy}T${x0 + 18 * k} ${yy}`;
  };
  return (
    <g opacity={p.opacity ?? 1}>
      {skin.fill({d: rectPath(p.x - W / 2, p.y - H / 2, W, H, r * k), color: p.fill ?? theme.panel, role: 'plate', seed: `${seed}:bg`, frame})}
      {skin.stroke({d: rectPath(p.x - W / 2, p.y - H / 2, W, H, r * k), color: col, width: stroke * k, role: 'annotation', seed: `${seed}:box`, frame})}
      {skin.stroke({d: wave(p.y - 3.6 * k), color: col, width: 2.4 * k, role: 'annotation', seed: `${seed}:w1`, frame, cap: 'round', join: 'round'})}
      {skin.stroke({d: wave(p.y + 3.6 * k), color: col, width: 2.4 * k, role: 'annotation', seed: `${seed}:w2`, frame, cap: 'round', join: 'round'})}
    </g>
  );
};

export interface EyeBadgeProps extends KitBaseProps {
  /** Centre of the almond. */
  x: number;
  y: number;
  /** Almond width (default 72); height = width x 0.56. */
  width?: number;
  /** 'analogy' (dashed + ≈ chip, annotation grey; the default) or 'solid'. */
  variant?: 'analogy' | 'solid';
  /** Draw-on over 8 frames from here; chip pops at the end. */
  inAt?: number;
  /** Fade out over 6 frames. */
  outAt?: number;
  color?: string;
  /** Hide the ≈ chip on the analogy variant (e.g. a style that places its own). */
  chip?: boolean;
  render?: (s: {x: number; y: number; w: number; h: number; draw: number; opacity: number}) => React.ReactNode;
}

export const EyeBadge: React.FC<EyeBadgeProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  if (p.inAt !== undefined && frame < p.inAt) return null;
  const draw = p.inAt !== undefined ? progress(frame, p.inAt, 8, EASE.arrive) : 1;
  const opacity = p.outAt !== undefined ? 1 - progress(frame, p.outAt, 6, EASE.exit) : 1;
  if (opacity <= 0) return null;
  const w = p.width ?? GLYPH.eye.w;
  const h = w * GLYPH.eye.aspect;
  if (p.render) return <>{p.render({x: p.x, y: p.y, w, h, draw, opacity})}</>;
  const analogy = (p.variant ?? 'analogy') === 'analogy';
  const col = p.color ?? (analogy ? theme.annotation : theme.ink);
  const d = almondPath(p.x, p.y, w, h);
  const L = pathLength(d);
  const seed = p.seed ?? 'eye';
  const pupilR = h * GLYPH.eye.pupil;
  const chipIn = progress(frame, (p.inAt ?? -100) + 5, 4, EASE.arrive);
  return (
    <g opacity={opacity}>
      {skin.stroke({
        d,
        color: col,
        width: GLYPH.eye.stroke,
        dash: analogy && draw >= 1 ? STROKE.analogyDash : undefined,
        trim: draw < 1 ? [0, L * draw] : undefined,
        role: 'annotation',
        seed: `${seed}:almond`,
        frame,
        join: 'round',
        cap: 'round',
      })}
      {skin.fill({
        d: `M${p.x - pupilR} ${p.y}A${pupilR} ${pupilR} 0 1 0 ${p.x + pupilR} ${p.y}A${pupilR} ${pupilR} 0 1 0 ${p.x - pupilR} ${p.y}Z`,
        color: col,
        opacity: draw,
        role: 'annotation',
        seed: `${seed}:pupil`,
        frame,
      })}
      {analogy && p.chip !== false && chipIn > 0 ? (
        <ApproxChip theme={theme} skin={skin} frame={frame} x={p.x - w / 2 + 2} y={p.y - h / 2 - 8} opacity={chipIn} seed={`${seed}:chip`} />
      ) : null}
    </g>
  );
};

export interface AnalogyFrameProps extends KitBaseProps {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
  /** Draw-on over 8 frames from here; the chip pops at the end. */
  inAt?: number;
  outAt?: number;
  chip?: boolean;
  color?: string;
}

/** Dashed analogy outline + ≈ chip. It sits ON or beside the real part, never in place of it. */
export const AnalogyFrame: React.FC<AnalogyFrameProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  if (p.inAt !== undefined && frame < p.inAt) return null;
  const draw = p.inAt !== undefined ? progress(frame, p.inAt, 8, EASE.arrive) : 1;
  const opacity = p.outAt !== undefined ? 1 - progress(frame, p.outAt, 6, EASE.exit) : 1;
  if (opacity <= 0) return null;
  const d = rectPath(p.x, p.y, p.w, p.h, p.r ?? 10);
  const L = pathLength(d);
  const seed = p.seed ?? 'analogy';
  const chipIn = p.inAt !== undefined ? progress(frame, p.inAt + 5, 4, EASE.arrive) : 1;
  return (
    <g opacity={opacity}>
      {skin.stroke({
        d,
        color: p.color ?? theme.annotation,
        width: STROKE.analogy,
        dash: draw >= 1 ? STROKE.analogyDash : undefined,
        trim: draw < 1 ? [0, L * draw] : undefined,
        role: 'annotation',
        seed: `${seed}:frame`,
        frame,
        join: 'round',
      })}
      {p.chip !== false && chipIn > 0 ? (
        <ApproxChip theme={theme} skin={skin} frame={frame} x={p.x + 6} y={p.y - 2} opacity={chipIn} color={p.color} seed={`${seed}:chip`} />
      ) : null}
    </g>
  );
};
