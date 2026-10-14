/**
 * `ecChip` (ICONS.md §4.20): the embedded controller (104 × 72, z 4), a QFP with gull-wing legs on four sides and an
 * x-ray window that holds the lookout (72 × 36) at scale 1. Passive like the chipset: the package never lights; the
 * lookout block it holds carries the state (alwaysOn, breathing).
 * Ports: `slot:lookout` (the window CENTRE: blockRectAt(port, 'wide')), `center`.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {
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
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

export const ecGeometry = (p: {x: number; y: number; w: number; h: number}) => {
  const kx = p.w / 104;
  const ky = p.h / 72;
  const k = Math.min(kx, ky);
  const body: Rect = {x: p.x + 8 * kx, y: p.y + 8 * ky, w: p.w - 16 * kx, h: p.h - 16 * ky};
  const win: Rect = {x: p.x + 11 * kx, y: p.y + 13 * ky, w: 82 * kx, h: 46 * ky};
  const slot: Pt = [win.x + win.w / 2, win.y + win.h / 2];
  return {k, kx, ky, body, win, slot};
};

export const EcChip: React.FC<IconBaseProps> = (p) => {
  // passive like the chipset: the package never lights; the lookout block it holds carries the state
  const b = resolveBase(p, true);
  const g = ecGeometry(b.rect);
  const {k, kx, ky, body} = g;
  const r = 3 * k;
  const d = rectD(body, r);
  let legs = '';
  const lw = 2.4 * k;
  const ll = 7.5 * k;
  const nH = 15;
  const nV = 9;
  for (let i = 0; i < nH; i++) {
    const x = body.x + 5 * kx + ((body.w - 10 * kx) * i) / (nH - 1);
    legs += rectD({x: x - lw / 2, y: b.y + 0.5 * ky, w: lw, h: ll}, 0.3 * k);
    legs += rectD({x: x - lw / 2, y: b.y + b.h - 0.5 * ky - ll, w: lw, h: ll}, 0.3 * k);
  }
  for (let i = 0; i < nV; i++) {
    const y = body.y + 5 * ky + ((body.h - 10 * ky) * i) / (nV - 1);
    legs += rectD({x: b.x + 0.5 * kx, y: y - lw / 2, w: ll, h: lw}, 0.3 * k);
    legs += rectD({x: b.x + b.w - 0.5 * kx - ll, y: y - lw / 2, w: ll, h: lw}, 0.3 * k);
  }
  const winD = rectD(g.win, 3 * k);
  return (
    <Shell b={b}>
      <TopFace d={legs} fill={COLOR.detail} />
      <Raised d={d} hull={raisedHullPath(body, r, b.side)} />
      <TopFace d={d} fill={COLOR.body} />
      <TopFace d={winD} fill={COLOR.board} />
      <Lines>
        <TopFace d={discD(body.x + 3.6 * k, body.y + 3 * k, 1.6 * k)} fill={COLOR.detail} />
      </Lines>
      <RimLight rect={body} radius={r} zoom={b.zoom} />
      <Lines>
        <Stroke d={winD} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const ecChipSpec: IconSpec<IconBaseProps> = {
  type: 'ecChip',
  component: EcChip,
  size: {w: 104, h: 72},
  z: 4,
  passive: true,
  ports: (p): Ports => ({...basePorts(p, true), 'slot:lookout': ecGeometry(p).slot}),
};
