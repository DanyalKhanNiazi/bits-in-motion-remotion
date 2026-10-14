/**
 * `pcieSlot` (ICONS.md §4.8): the empty x16 graphics slot (410 × 20, z 6). Passive, context only.
 * Base: slot body (bodyLo, r 3), the card groove broken by the key at 22 % from the left, the retention latch at the
 * right end. Detail: the contact ticks in the groove and the latch grip.
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
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const PcieSlot: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, true);
  const kx = b.w / 410;
  const ky = b.h / 20;
  const k = Math.min(kx, ky);
  const r = 3 * k;
  const body: Rect = {x: b.x, y: b.y, w: b.w - 14 * kx, h: b.h};
  const d = rectD(body, r);
  const latch: Rect = {x: b.x + b.w - 16 * kx, y: b.y - 2.5 * ky, w: 16 * kx, h: b.h + 5 * ky};
  const latchD = rectD(latch, 2.5 * k);
  const keyX = b.x + b.w * 0.22;
  const gy = b.y + b.h / 2 - 2.5 * ky;
  const gh = 5 * ky;
  const groove = rectD({x: b.x + 6 * kx, y: gy, w: keyX - 3 * kx - (b.x + 6 * kx), h: gh}, 1.5 * k) + rectD({x: keyX + 3 * kx, y: gy, w: body.x + body.w - 6 * kx - (keyX + 3 * kx), h: gh}, 1.5 * k);
  let ticks = '';
  for (let x = b.x + 9 * kx; x < body.x + body.w - 8 * kx; x += 6 * kx) {
    if (Math.abs(x - keyX) < 5 * kx) continue;
    ticks += lineD(x, gy + 1.2 * ky, x, gy + gh - 1.2 * ky);
  }
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(body, r, b.side)} />
      <Raised d={latchD} hull={raisedHullPath(latch, 2.5 * k, b.side)} />
      <TopFace d={d} fill={COLOR.bodyLo} />
      <TopFace d={groove} fill={COLOR.side} />
      <TopFace d={latchD} fill={COLOR.bodyHi} />
      <DetailGroup b={b}>
        <Detail d={ticks} zoom={b.zoom} opacity={0.8} />
        <Detail d={lineD(latch.x + 5 * kx, latch.y + 5 * ky, latch.x + 5 * kx, latch.y + latch.h - 5 * ky)} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={body} radius={r} zoom={b.zoom} />
      <Lines>
        <Stroke d={latchD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const pcieSlotSpec: IconSpec<IconBaseProps> = {
  type: 'pcieSlot',
  component: PcieSlot,
  size: {w: 410, h: 20},
  z: 6,
  passive: true,
  ports: (p): Ports => ({...basePorts(p, true), key: [p.x + p.w * 0.22, p.y + p.h / 2]}),
};
