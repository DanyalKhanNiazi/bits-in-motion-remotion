/**
 * `phone` (ICONS.md §6, Ep02; round 2 seed): a smartphone face-on (110 × 220, z connector).
 * Base: the body (bodyHi, r 18) with its 2.5D side; the screen inset (screenBlack, or `lit` 0..1 → activeFill); the
 * camera punch-hole; the side buttons. Detail: the screen's inner edge.
 * Active region: the body. Ports: `screenCenter`, `antenna` (top edge), `center`.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {Detail, DetailGroup, Glow, Outline, Pip, Raised, RimLight, Shell, StateHatch, TopFace, basePorts, discD, mix, raisedHullPath, rectD, resolveBase, type Rect} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export interface PhoneProps extends IconBaseProps {
  /** 0..1: the screen lights (true colours come later; here the active fill). */
  lit?: number;
}

export const Phone: React.FC<PhoneProps> = (p) => {
  const b = resolveBase(p, false);
  const kx = b.w / 110;
  const ky = b.h / 220;
  const k = Math.min(kx, ky);
  const r = 18 * k;
  const d = rectD(b.rect, r);
  const scr: Rect = {x: b.x + 7 * kx, y: b.y + 9 * ky, w: b.w - 14 * kx, h: b.h - 18 * ky};
  const lit = Math.max(0, Math.min(1, p.lit ?? 0));
  const btns: Rect[] = [
    {x: b.x + b.w - 1 * kx, y: b.y + 46 * ky, w: 3 * kx, h: 26 * ky},
    {x: b.x + b.w - 1 * kx, y: b.y + 80 * ky, w: 3 * kx, h: 40 * ky},
  ];
  return (
    <Shell b={b}>
      <TopFace d={btns.map((x) => rectD(x, 1.2 * k)).join('')} fill={COLOR.body} />
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.bodyHi)} />
      <StateHatch b={b} clipD={d} />
      <TopFace d={rectD(scr, 12 * k)} fill={lit > 0 ? mix(COLOR.screenBlack, COLOR.activeFill, lit) : COLOR.screenBlack} />
      <TopFace d={discD(b.x + b.w / 2, b.y + 18 * ky, 3.4 * k)} fill={COLOR.side} />
      <DetailGroup b={b}>
        <Detail d={rectD({x: scr.x - 2 * k, y: scr.y - 2 * k, w: scr.w + 4 * k, h: scr.h + 4 * k}, 13 * k)} zoom={b.zoom} opacity={0.7} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const phoneSpec: IconSpec<PhoneProps> = {
  type: 'phone',
  component: Phone,
  size: {w: 110, h: 220},
  z: 6,
  passive: false,
  ports: (p): Ports => ({...basePorts(p, false), screenCenter: [p.x + p.w / 2, p.y + p.h / 2], antenna: [p.x + p.w / 2, p.y]}),
};
