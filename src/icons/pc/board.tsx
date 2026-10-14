/**
 * `board` (ICONS.md §4.1): the ATX motherboard PCB. Passive carrier, never lit.
 * Base: board plate (r 14) with its 2.5D pad edge, rim light and six plated mounting holes.
 * Detail: the copper keep-out border just inside the edge and the keep-out ring around the CPU socket.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {
  DetailGroup,
  Detail,
  Lines,
  Outline,
  Raised,
  RimLight,
  Shell,
  Stroke,
  TopFace,
  basePorts,
  discD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Pt} from '../types';

export interface BoardProps extends IconBaseProps {
  /** Mounting holes, relative 0..1 (default: the six ATX positions used by the Ep01 world). */
  holes?: Pt[];
  /** CPU socket keep-out (relative 0..1 rect); default = the Ep01 socket position. null = none. */
  keepOut?: {x: number; y: number; w: number; h: number} | null;
}

/** Corners plus two along the long edges, placed clear of the Ep01 parts. */
export const ATX_HOLES: Pt[] = [
  [0.026, 0.04],
  [0.66, 0.04],
  [0.974, 0.04],
  [0.026, 0.96],
  [0.66, 0.96],
  [0.974, 0.96],
];
/** The Ep01 CPU socket (650, 190, 260, 260) relative to the board (560, 150, 840, 610). */
export const EP01_SOCKET_KEEPOUT = {x: 90 / 840, y: 40 / 610, w: 260 / 840, h: 260 / 610};

const RADIUS_PCB = 14;

/** Board edge point helper: side 'bottom' | 'left' | 'top' | 'right', frac along it. */
export const boardEdge = (p: {x: number; y: number; w: number; h: number}, side: 'top' | 'bottom' | 'left' | 'right', frac: number): Pt => {
  switch (side) {
    case 'top':
      return [p.x + p.w * frac, p.y];
    case 'bottom':
      return [p.x + p.w * frac, p.y + p.h];
    case 'left':
      return [p.x, p.y + p.h * frac];
    case 'right':
    default:
      return [p.x + p.w, p.y + p.h * frac];
  }
};

export const Board: React.FC<BoardProps> = (p) => {
  const b = resolveBase(p, true);
  const r = Math.min(RADIUS_PCB, b.w / 4, b.h / 4);
  const d = rectD(b.rect, r);
  const holes = (p.holes ?? ATX_HOLES).map(([u, v]) => [b.x + u * b.w, b.y + v * b.h] as Pt);
  const ko = p.keepOut === undefined ? EP01_SOCKET_KEEPOUT : p.keepOut;
  const holeR = 6;
  const padR = 9.5;
  const edgeIn = b.s(10);
  const edgeRect: Rect = {x: b.x + edgeIn, y: b.y + edgeIn, w: b.w - 2 * edgeIn, h: b.h - 2 * edgeIn};
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.board} />
      {/* plated mounting holes: annular pad (bodyLo) with the drilled hole (side) */}
      {holes.map(([cx, cy], i) => (
        <g key={i}>
          <TopFace d={discD(cx, cy, padR)} fill={COLOR.bodyLo} />
          <TopFace d={discD(cx, cy, holeR)} fill={COLOR.side} />
        </g>
      ))}
      <Lines>
        {holes.map(([cx, cy], i) => (
          <Stroke key={i} d={discD(cx, cy, padR)} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
        ))}
      </Lines>
      <DetailGroup b={b}>
        {/* copper keep-out border just inside the board edge */}
        <Detail d={rectD(edgeRect, Math.max(0, r - edgeIn))} zoom={b.zoom} opacity={0.55} />
        {ko ? (
          <Detail
            d={rectD(
              {x: b.x + ko.x * b.w - 14, y: b.y + ko.y * b.h - 14, w: ko.w * b.w + 28, h: ko.h * b.h + 28},
              18,
            )}
            zoom={b.zoom}
            opacity={0.45}
          />
        ) : null}
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} width={STROKE.silhouette} />
    </Shell>
  );
};

export const boardSpec: IconSpec<BoardProps> = {
  type: 'board',
  component: Board,
  size: {w: 840, h: 610},
  z: 2,
  passive: true,
  ports: (p) => ({
    ...basePorts(p, true),
    edgeBottom: boardEdge(p, 'bottom', 0.5),
    edgeLeft: boardEdge(p, 'left', 0.5),
  }),
};
