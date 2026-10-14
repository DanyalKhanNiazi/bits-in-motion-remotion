/**
 * `laptopBoard` (ICONS.md §4.20): a wide, low laptop PCB (600 × 220, z 2). Passive.
 * Base: the board with the laptop's tell-tale fan cut-out (a round bite in the top edge) and stepped corner, and its
 * plated mounting holes. Detail: soldered memory beside the SoC slot, the SoC keep-out ring and the fan keep-out arc.
 * Ports (docking CENTRES): `slot:soc`, `slot:ec`, `batteryConn`, `fan`.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {
  arcD,
  DetailGroup,
  Detail,
  Glow,
  Lines,
  Outline,
  Raised,
  RimLight,
  Shell,
  Stroke,
  TopFace,
  basePorts,
  discD,
  fx,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

export const laptopBoardGeometry = (p: {x: number; y: number; w: number; h: number}) => {
  const kx = p.w / 600;
  const ky = p.h / 220;
  const k = Math.min(kx, ky);
  const X = (u: number) => p.x + u * kx;
  const Y = (v: number) => p.y + v * ky;
  const r = 14 * k;
  // fan cut-out: a round bite in the top edge (centre 500, 0, r 74), and a stepped corner at the bottom-right
  const fr = 74 * k;
  const fcx = X(500);
  const step = {x: X(560), y: Y(170)};
  const d =
    `M${fx(p.x + r)} ${fx(p.y)}H${fx(fcx - fr)}A${fx(fr)} ${fx(fr)} 0 0 0 ${fx(fcx + fr)} ${fx(p.y)}` +
    `H${fx(p.x + p.w - r)}A${fx(r)} ${fx(r)} 0 0 1 ${fx(p.x + p.w)} ${fx(p.y + r)}V${fx(step.y - 8 * k)}` +
    `A${fx(8 * k)} ${fx(8 * k)} 0 0 1 ${fx(p.x + p.w - 8 * k)} ${fx(step.y)}H${fx(step.x + 8 * k)}` +
    `A${fx(8 * k)} ${fx(8 * k)} 0 0 0 ${fx(step.x)} ${fx(step.y + 8 * k)}V${fx(p.y + p.h - r)}` +
    `A${fx(r)} ${fx(r)} 0 0 1 ${fx(step.x - r)} ${fx(p.y + p.h)}H${fx(p.x + r)}A${fx(r)} ${fx(r)} 0 0 1 ${fx(p.x)} ${fx(p.y + p.h - r)}` +
    `V${fx(p.y + r)}A${fx(r)} ${fx(r)} 0 0 1 ${fx(p.x + r)} ${fx(p.y)}Z`;
  const holes: Pt[] = [
    [X(18), Y(18)],
    [X(18), Y(202)],
    [X(400), Y(18)],
    [X(582), Y(152)],
    [X(300), Y(202)],
  ];
  return {k, X, Y, d, holes, fan: {cx: fcx, cy: p.y, r: fr}};
};

export const LaptopBoard: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, true);
  const g = laptopBoardGeometry(b.rect);
  const {k, X, Y} = g;
  const mem: Rect[] = [
    {x: X(250), y: Y(30), w: 36 * k, h: 22 * k},
    {x: X(250), y: Y(60), w: 36 * k, h: 22 * k},
    {x: X(250), y: Y(140), w: 36 * k, h: 22 * k},
    {x: X(250), y: Y(170), w: 36 * k, h: 22 * k},
  ];
  return (
    <Shell b={b}>
      <Raised d={g.d} side={b.side} />
      <TopFace d={g.d} fill={COLOR.board} />
      {g.holes.map(([cx, cy], i) => (
        <g key={i}>
          <TopFace d={discD(cx, cy, 8.5 * k)} fill={COLOR.bodyLo} />
          <TopFace d={discD(cx, cy, 5 * k)} fill={COLOR.side} />
        </g>
      ))}
      <Lines>
        <Stroke d={g.holes.map(([cx, cy]) => discD(cx, cy, 8.5 * k)).join('')} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
      </Lines>
      <DetailGroup b={b}>
        {mem.map((m, i) => (
          <TopFace key={i} d={rectD(m, 1.5 * k)} fill={COLOR.body} />
        ))}
        <Detail d={mem.map((m) => rectD(m, 1.5 * k)).join('')} zoom={b.zoom} />
        <Detail d={rectD({x: X(42), y: Y(22), w: 176 * k, h: 176 * k}, 16 * k)} zoom={b.zoom} opacity={0.45} />
        <Detail d={arcD(g.fan.cx, g.fan.cy, g.fan.r + 10 * k, 0, 180)} zoom={b.zoom} opacity={0.45} />
      </DetailGroup>
      <RimLight rect={{x: b.x, y: b.y, w: g.fan.cx - g.fan.r - b.x, h: b.h}} radius={14 * k} zoom={b.zoom} />
      <Glow d={g.d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={g.d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} width={STROKE.silhouette} />
    </Shell>
  );
};

export const laptopBoardSpec: IconSpec<IconBaseProps> = {
  type: 'laptopBoard',
  component: LaptopBoard,
  size: {w: 600, h: 220},
  z: 2,
  passive: true,
  ports: (p): Ports => {
    const g = laptopBoardGeometry(p);
    return {
      ...basePorts(p, true),
      'slot:soc': [g.X(130), g.Y(110)],
      'slot:ec': [g.X(400), g.Y(120)],
      batteryConn: [g.X(560), g.Y(195)],
      fan: [g.fan.cx, g.fan.cy],
    };
  },
};
