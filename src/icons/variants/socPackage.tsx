/**
 * `socPackage` (ICONS.md §4.20): one laptop processor package (150 × 150, z 8): a closed compute tile (bodyHi, the
 * active region) and an x-ray die window (like the chipset's) that holds the "?" block at scale 1. No separate chipset
 * is drawn on a laptop, so the "?" lives here, dim with its badge. `off`.
 * Ports: `slot:q` (the window CENTRE: blockRectAt(port, 'square') gives the block's rect), `tile`.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {
  DetailGroup,
  Detail,
  Glow,
  Lines,
  Outline,
  Pip,
  Raised,
  RimLight,
  Shell,
  StateHatch,
  Stroke,
  TopFace,
  basePorts,
  discD,
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

export const socGeometry = (p: {x: number; y: number; w: number; h: number}) => {
  const kx = p.w / 150;
  const ky = p.h / 150;
  const k = Math.min(kx, ky);
  const R = (u: number, v: number, w: number, h: number): Rect => ({x: p.x + u * kx, y: p.y + v * ky, w: w * kx, h: h * ky});
  const win = R(60, 31, 80, 88);
  const tile = R(12, 22, 40, 106);
  const slotQ: Pt = [win.x + win.w / 2, win.y + win.h / 2];
  return {k, R, win, tile, slotQ};
};

export const SocPackage: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const g = socGeometry(b.rect);
  const {k, R} = g;
  const r = Math.min(8 * k, b.w / 4);
  const d = rectD(b.rect, r);
  const tileD = rectD(g.tile, 3 * k);
  const winD = rectD(g.win, 4 * k);
  let caps = '';
  for (const u of [30, 75, 120]) for (let j = -1; j <= 1; j++) caps += rectD(R(u + j * 7 - 1.8, 138, 3.6, 6), 0.5);
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.body} />
      <Raised d={tileD} hull={raisedHullPath(g.tile, 3 * k, b.sideK(0.3))} />
      <TopFace d={tileD} fill={b.act(COLOR.bodyHi)} />
      <StateHatch b={b} clipD={tileD} rect={g.tile} />
      <TopFace d={winD} fill={COLOR.board} />
      <Lines>
        <TopFace d={discD(b.x + 7 * k, b.y + 7 * k, 2.4 * k)} fill={COLOR.detail} />
      </Lines>
      <DetailGroup b={b}>
        <Detail d={caps} zoom={b.zoom} fill />
        <Detail d={rectD({x: g.win.x + 5 * k, y: g.win.y + 5 * k, w: g.win.w - 10 * k, h: g.win.h - 10 * k}, 2 * k)} zoom={b.zoom} opacity={0.75} />
        <Detail
          d={[0.25, 0.5, 0.75].map((f) => lineD(g.tile.x + 5 * k, g.tile.y + g.tile.h * f, g.tile.x + g.tile.w - 5 * k, g.tile.y + g.tile.h * f)).join('')}
          zoom={b.zoom}
        />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <RimLight rect={g.tile} radius={3 * k} zoom={b.zoom} inset={b.s(2)} />
      <Lines>
        <Stroke d={tileD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        <Stroke d={winD} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const socPackageSpec: IconSpec<IconBaseProps> = {
  type: 'socPackage',
  component: SocPackage,
  size: {w: 150, h: 150},
  z: 8,
  passive: false,
  ports: (p): Ports => {
    const g = socGeometry(p);
    return {...basePorts(p, false), 'slot:q': g.slotQ, tile: [g.tile.x + g.tile.w / 2, g.tile.y + g.tile.h / 2]};
  },
};
