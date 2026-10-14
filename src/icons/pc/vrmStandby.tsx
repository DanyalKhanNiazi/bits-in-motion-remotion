/**
 * `vrmStandby` (ICONS.md §4.10): the standby regulators, 5VSB → 3.3 V / 1.8 V (36 × 26, z 6). Passive: its powered
 * truth is the amber channel through it and the S11 wash.
 * Base: an SMD power inductor (bodyHi rounded square with its winding ring) and two FETs (body) with their tabs.
 * Detail: the winding core. Ports: `in` (bottom centre), `out` (top centre).
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {
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
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const VrmStandby: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, true);
  const kx = b.w / 36;
  const ky = b.h / 26;
  const k = Math.min(kx, ky);
  const ind: Rect = {x: b.x + 1.5 * kx, y: b.y + 3 * ky, w: 20 * k, h: 20 * k};
  const indD = rectD(ind, 3.5 * k);
  const fets: Rect[] = [
    {x: b.x + 26 * kx, y: b.y + 4 * ky, w: 8.5 * kx, h: 7 * ky},
    {x: b.x + 26 * kx, y: b.y + 15 * ky, w: 8.5 * kx, h: 7 * ky},
  ];
  const fetD = fets.map((f) => rectD(f, 1.2 * k)).join('');
  // FET tabs (the drain tab on one side)
  const tabs = fets.map((f) => rectD({x: f.x - 2.2 * kx, y: f.y + 1.5 * ky, w: 2.2 * kx, h: f.h - 3 * ky}, 0.4 * k)).join('');
  const icx = ind.x + ind.w / 2;
  const icy = ind.y + ind.h / 2;
  return (
    <Shell b={b}>
      <TopFace d={tabs} fill={COLOR.detail} />
      <Raised d={indD} hull={raisedHullPath(ind, 3.5 * k, b.side)} />
      {fets.map((f, i) => (
        <Raised key={i} d={rectD(f, 1.2 * k)} hull={raisedHullPath(f, 1.2 * k, b.sideK(0.5))} />
      ))}
      <TopFace d={indD} fill={COLOR.bodyHi} />
      <TopFace d={fetD} fill={COLOR.body} />
      <Lines>
        <Stroke d={discD(icx, icy, 6.6 * k)} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
      </Lines>
      <DetailGroup b={b}>
        <Detail d={discD(icx, icy, 2.2 * k)} zoom={b.zoom} fill />
      </DetailGroup>
      <RimLight rect={ind} radius={3.5 * k} zoom={b.zoom} inset={b.s(2.5)} />
      <Lines>
        <Stroke d={fetD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      </Lines>
      <Glow d={indD} zoom={b.zoom} alpha={b.glow} />
      <Outline d={indD} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const vrmStandbySpec: IconSpec<IconBaseProps> = {
  type: 'vrmStandby',
  component: VrmStandby,
  size: {w: 36, h: 26},
  z: 6,
  passive: true,
  ports: (p): Ports => ({...basePorts(p, true), in: [p.x + p.w / 2, p.y + p.h], out: [p.x + p.w / 2, p.y]}),
};
