/**
 * `hbmStack` (ICONS.md §6, Ep03 AI; round 2 seed): a stacked memory module seen from above (60 × 90, z module): the
 * base die and its stack of DRAM dies, each a stepped top so the stack reads at any size. Active region: the stack.
 * Ports: `phy` (the edge that faces the processor: left), `center`.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {Detail, DetailGroup, Glow, Outline, Pip, Raised, RimLight, Shell, StateHatch, TopFace, basePorts, raisedHullPath, rectD, resolveBase, type Rect} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const HbmStack: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const kx = b.w / 60;
  const ky = b.h / 90;
  const k = Math.min(kx, ky);
  const r = 3 * k;
  const d = rectD(b.rect, r);
  const steps: Rect[] = [0, 1, 2, 3].map((i) => ({x: b.x + (4 + i * 3) * kx, y: b.y + (4 + i * 3) * ky, w: b.w - (8 + i * 6) * kx, h: b.h - (8 + i * 6) * ky}));
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.body)} />
      {steps.map((s, i) => (
        <TopFace key={i} d={rectD(s, 2 * k)} fill={i % 2 ? COLOR.bodyHi : COLOR.body} />
      ))}
      <StateHatch b={b} clipD={d} />
      <DetailGroup b={b}>
        <Detail d={steps.map((s) => rectD(s, 2 * k)).join('')} zoom={b.zoom} opacity={0.8} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const hbmStackSpec: IconSpec<IconBaseProps> = {
  type: 'hbmStack',
  component: HbmStack,
  size: {w: 60, h: 90},
  z: 10,
  passive: false,
  ports: (p): Ports => ({...basePorts(p, false), phy: [p.x, p.y + p.h / 2]}),
};
