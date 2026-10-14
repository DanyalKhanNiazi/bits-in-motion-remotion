/**
 * State glyphs (brand spec §5.7), docked top-right of a part, 8 px outside the corner:
 *   OFF        hollow 12 px square, 2 px structure
 *   ON         filled 12 px ink square
 *   ALWAYS_ON  filled square that breathes (opacity 70 ↔ 100% over 60 frames, phase-locked to f0)
 *   RESET      filled square crossed by a 2 px bar extending 6 px each side
 *   WAITING    24 px badge with ‖ in ink (neutral)
 *   LIMIT      24 px badge with ! in alert
 *   FAULT      24 px badge with × in alert
 *   UNNAMED    the "?" badge: 36 px rounded square, 3 px emphasis outline, "?" in sans 700;
 *              it fills with emphasis over 6 frames from `fillAt` (glyph turns surface colour).
 * Glyphs other than "?" are vectors (crisp at 390 px; the font subset has no ≈ anyway).
 * A state change is a 4–6 frame flip that starts on its cause.
 *
 * Usage:
 *   <StateGlyph x={940} y={560} state="ALWAYS_ON" />                         // part's top-right corner
 *   <StateGlyph x={1100} y={560} timeline={[{at: 0, state: 'OFF'}, {at: 294, state: 'ON'}, {at: 330, state: 'OFF'}]} />
 *   <StateGlyph x={1020} y={600} dock="center" state="UNNAMED" fillAt={671} />
 */
import React from 'react';
import {GLYPH} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {SANS} from '../fonts';
import {linePath, polyPath, squarePath, rectPath} from '../geom';
import {breathe, clamp01, EASE, progress} from '../motion';

export type GlyphState = 'OFF' | 'ON' | 'ALWAYS_ON' | 'RESET' | 'WAITING' | 'LIMIT' | 'FAULT' | 'UNNAMED';
export type GlyphDock = 'outside' | 'inside' | 'center';

export const glyphSize = (s: GlyphState): number =>
  s === 'UNNAMED' ? GLYPH.qBadge : s === 'WAITING' || s === 'LIMIT' || s === 'FAULT' ? GLYPH.badge : GLYPH.pip;

/** Centre of a glyph docked to the part corner (x, y). */
export const glyphCenter = (x: number, y: number, size: number, dock: GlyphDock = 'outside'): [number, number] => {
  const g = GLYPH.dock;
  if (dock === 'center') return [x, y];
  if (dock === 'inside') return [x - g - size / 2, y + g + size / 2];
  return [x + g + size / 2, y - g - size / 2];
};

export interface StateGlyphProps extends KitBaseProps {
  /** The part's top-right corner (dock 'outside' / 'inside') or the glyph centre (dock 'center'). */
  x: number;
  y: number;
  dock?: GlyphDock;
  state?: GlyphState;
  /** State changes in time order: [{at, state}]. Before the first entry nothing is drawn. */
  timeline?: ReadonlyArray<{at: number; state: GlyphState}>;
  flipFrames?: number;
  /** "?" badge: fill with emphasis from this frame (6 frames); unfill from `unfillAt`. */
  fillAt?: number;
  unfillAt?: number;
  /** Fade in / out (6 frames). */
  inAt?: number;
  outAt?: number;
  /** Scale the glyph (e.g. inside a magnified Lens); default 1. */
  scale?: number;
  render?: (s: {state: GlyphState; prev: GlyphState | null; p: number; cx: number; cy: number; size: number}) => React.ReactNode;
}

const GlyphShape: React.FC<{
  state: GlyphState;
  cx: number;
  cy: number;
  k: number;
  frame: number;
  fill: number;
  opacity: number;
  seed: string;
  theme: ReturnType<typeof useKit>['theme'];
  skin: ReturnType<typeof useKit>['skin'];
}> = ({state, cx, cy, k, frame, fill, opacity, seed, theme, skin}) => {
  const pip = GLYPH.pip * k;
  const sw = GLYPH.pipStroke * k;
  switch (state) {
    case 'OFF':
      return <g opacity={opacity}>{skin.stroke({d: squarePath(cx, cy, pip - sw, 1), color: theme.structure, width: sw, role: 'glyph', seed, frame})}</g>;
    case 'ON':
      return <g opacity={opacity}>{skin.fill({d: squarePath(cx, cy, pip, 1.5), color: theme.ink, role: 'glyph', seed, frame})}</g>;
    case 'ALWAYS_ON':
      return <g opacity={opacity * breathe(frame)}>{skin.fill({d: squarePath(cx, cy, pip, 1.5), color: theme.ink, role: 'glyph', seed, frame})}</g>;
    case 'RESET': {
      const o = pip / 2 + GLYPH.resetOverhang * k;
      const bar = linePath([cx - o * 0.7071, cy + o * 0.7071], [cx + o * 0.7071, cy - o * 0.7071]);
      return (
        <g opacity={opacity}>
          {skin.fill({d: squarePath(cx, cy, pip, 1.5), color: theme.ink, role: 'glyph', seed, frame})}
          {skin.stroke({d: bar, color: theme.surface, width: GLYPH.resetBar * k + 3, role: 'glyph', seed: `${seed}:u`, frame})}
          {skin.stroke({d: bar, color: theme.ink, width: GLYPH.resetBar * k, role: 'glyph', seed: `${seed}:b`, frame, cap: 'butt'})}
        </g>
      );
    }
    case 'WAITING':
    case 'LIMIT':
    case 'FAULT': {
      const b = GLYPH.badge * k;
      const col = state === 'WAITING' ? theme.ink : theme.alert;
      const border = state === 'WAITING' ? theme.structure : theme.alert;
      const box = rectPath(cx - b / 2, cy - b / 2, b, b, GLYPH.badgeRadius * k);
      let mark: React.ReactNode;
      if (state === 'WAITING') {
        mark = (
          <>
            {skin.stroke({d: linePath([cx - 3 * k, cy - 6 * k], [cx - 3 * k, cy + 6 * k]), color: col, width: 2.5 * k, role: 'glyph', seed: `${seed}:1`, frame})}
            {skin.stroke({d: linePath([cx + 3 * k, cy - 6 * k], [cx + 3 * k, cy + 6 * k]), color: col, width: 2.5 * k, role: 'glyph', seed: `${seed}:2`, frame})}
          </>
        );
      } else if (state === 'LIMIT') {
        mark = (
          <>
            {skin.stroke({d: linePath([cx, cy - 7 * k], [cx, cy + 2.5 * k]), color: col, width: 3 * k, role: 'glyph', seed: `${seed}:1`, frame})}
            {skin.fill({d: squarePath(cx, cy + 6 * k, 3.2 * k, 0.5), color: col, role: 'glyph', seed: `${seed}:2`, frame})}
          </>
        );
      } else {
        mark = (
          <>
            {skin.stroke({d: linePath([cx - 5 * k, cy - 5 * k], [cx + 5 * k, cy + 5 * k]), color: col, width: 2.6 * k, role: 'glyph', seed: `${seed}:1`, frame})}
            {skin.stroke({d: linePath([cx - 5 * k, cy + 5 * k], [cx + 5 * k, cy - 5 * k]), color: col, width: 2.6 * k, role: 'glyph', seed: `${seed}:2`, frame})}
          </>
        );
      }
      return (
        <g opacity={opacity}>
          {skin.fill({d: box, color: theme.panel, role: 'plate', seed: `${seed}:bg`, frame})}
          {skin.stroke({d: box, color: border, width: GLYPH.badgeStroke * k, role: state === 'WAITING' ? 'glyph' : 'alert', seed: `${seed}:box`, frame})}
          {mark}
        </g>
      );
    }
    case 'UNNAMED': {
      const b = GLYPH.qBadge * k;
      const sw2 = GLYPH.qStroke * k;
      const box = rectPath(cx - b / 2 + sw2 / 2, cy - b / 2 + sw2 / 2, b - sw2, b - sw2, GLYPH.qRadius * k);
      return (
        <g opacity={opacity}>
          {skin.fill({d: box, color: theme.surface, role: 'plate', seed: `${seed}:bg`, frame})}
          {fill > 0 ? skin.fill({d: box, color: theme.emphasis, opacity: fill, role: 'emphasis', seed: `${seed}:fill`, frame}) : null}
          {skin.stroke({d: box, color: theme.emphasis, width: sw2, role: 'emphasis', seed: `${seed}:box`, frame})}
          <text
            x={cx}
            y={cy + 1 * k}
            textAnchor="middle"
            dominantBaseline="central"
            style={{fontFamily: SANS, fontWeight: 700, fontSize: GLYPH.qFont * k}}
            fill={fill >= 0.5 ? theme.surface : theme.emphasis}
          >
            ?
          </text>
        </g>
      );
    }
    default:
      return null;
  }
};

export const StateGlyph: React.FC<StateGlyphProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const tl = p.timeline ?? [{at: -Infinity, state: p.state ?? 'OFF'}];
  let cur = -1;
  for (let i = 0; i < tl.length; i++) if (tl[i].at <= frame) cur = i;
  if (cur < 0) return null;
  if (p.inAt !== undefined && frame < p.inAt) return null;
  const vis = (p.inAt !== undefined ? progress(frame, p.inAt, 6, EASE.arrive) : 1) * (p.outAt !== undefined ? 1 - progress(frame, p.outAt, 6, EASE.exit) : 1);
  if (vis <= 0) return null;
  const state = tl[cur].state;
  const prev = cur > 0 ? tl[cur - 1].state : null;
  const ff = p.flipFrames ?? GLYPH.flipFrames;
  const t = prev !== null ? clamp01((frame - tl[cur].at) / ff) : 1;
  const pIn = EASE.arrive(t);
  const k = p.scale ?? 1;
  const dock = p.dock ?? 'outside';
  const [cx, cy] = glyphCenter(p.x, p.y, glyphSize(state) * k, dock);
  if (p.render) return <>{p.render({state, prev, p: pIn, cx, cy, size: glyphSize(state) * k})}</>;
  const fill =
    (p.fillAt !== undefined ? progress(frame, p.fillAt, GLYPH.qFillFrames, EASE.arrive) : 0) *
    (p.unfillAt !== undefined ? 1 - progress(frame, p.unfillAt, GLYPH.qFillFrames, EASE.exit) : 1);
  const seed = p.seed ?? 'glyph';
  const common = {frame, fill, seed, theme, skin};
  if (prev !== null && t < 1) {
    const [pcx, pcy] = glyphCenter(p.x, p.y, glyphSize(prev) * k, dock);
    return (
      <g opacity={vis}>
        <GlyphShape state={prev} cx={pcx} cy={pcy} k={k} opacity={1 - pIn} {...common} />
        <g transform={`translate(${cx} ${cy}) scale(${0.6 + 0.4 * pIn}) translate(${-cx} ${-cy})`}>
          <GlyphShape state={state} cx={cx} cy={cy} k={k} opacity={pIn} {...common} />
        </g>
      </g>
    );
  }
  return (
    <g opacity={vis}>
      <GlyphShape state={state} cx={cx} cy={cy} k={k} opacity={1} {...common} />
    </g>
  );
};

/** Draw the alert hatch (2 px at 45°, 10 px pitch) clipped to a box: for LIMIT / FAULT areas. */
export const AlertHatch: React.FC<KitBaseProps & {x: number; y: number; w: number; h: number; opacity?: number}> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const lines: string[] = [];
  for (let c = -p.h; c < p.w; c += 10) {
    const a: [number, number] = [p.x + c, p.y + p.h];
    const b: [number, number] = [p.x + c + p.h, p.y];
    lines.push(polyPath([a, b]));
  }
  const id = `hatch-${Math.round(p.x)}-${Math.round(p.y)}-${Math.round(p.w)}-${Math.round(p.h)}`;
  return (
    <g opacity={p.opacity ?? 1}>
      <defs>
        <clipPath id={id}>
          <rect x={p.x} y={p.y} width={p.w} height={p.h} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {skin.stroke({d: lines.join(''), color: theme.alertHatch, width: 2, role: 'alert', seed: p.seed ?? id, frame})}
      </g>
    </g>
  );
};
