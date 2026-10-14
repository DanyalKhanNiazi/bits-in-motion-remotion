/**
 * `antenna` (ICONS.md §6, Ep02; round 2 seed): a dipole rod seen from above (16 × 120, z connector).
 * Base: the rod (bodyLo, fully rounded) on its hinge block (body); the radiating element as an inner bar (detail).
 * Active region: the rod (radiating). Ports: `tip`, `base`, `center`.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {Detail, DetailGroup, Glow, Outline, Pip, Raised, RimLight, Shell, StateHatch, TopFace, basePorts, raisedHullPath, rectD, resolveBase, type Rect} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const Antenna: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const kx = b.w / 16;
  const ky = b.h / 120;
  const rod: Rect = {x: b.x, y: b.y, w: b.w, h: 100 * ky};
  const hinge: Rect = {x: b.x - 2 * kx, y: b.y + 98 * ky, w: b.w + 4 * kx, h: 22 * ky};
  const d = rectD(rod, rod.w / 2);
  const hd = rectD(hinge, 3 * kx);
  return (
    <Shell b={b}>
      <Raised d={hd} hull={raisedHullPath(hinge, 3 * kx, b.sideK(0.6))} />
      <TopFace d={hd} fill={COLOR.body} />
      <Raised d={d} hull={raisedHullPath(rod, rod.w / 2, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.bodyLo)} />
      <StateHatch b={b} clipD={d} rect={rod} />
      <DetailGroup b={b}>
        <Detail d={rectD({x: rod.x + rod.w * 0.38, y: rod.y + 12 * ky, w: rod.w * 0.24, h: 70 * ky}, rod.w * 0.12)} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={rod} radius={rod.w / 2} zoom={b.zoom} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={rod} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const antennaSpec: IconSpec<IconBaseProps> = {
  type: 'antenna',
  component: Antenna,
  size: {w: 16, h: 120},
  z: 6,
  passive: false,
  ports: (p): Ports => ({...basePorts(p, false), tip: [p.x + p.w / 2, p.y], base: [p.x + p.w / 2, p.y + p.h]}),
};
