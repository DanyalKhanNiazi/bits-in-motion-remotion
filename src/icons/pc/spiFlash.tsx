/**
 * `spiFlash` (ICONS.md §4.9): the firmware flash, SOIC-8 (46 × 28, z 4): a 15-high body with four gull-wing legs per
 * long side and the pin-1 dot (legs and dot are base: the shorter side keeps `detail` at 0 in Ep01). `off` in Ep01;
 * the Bit never lands on it (guardrail S06). Ports: `left`, `right`, `center`.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {
  Glow,
  Lines,
  Outline,
  Pip,
  Raised,
  RimLight,
  Shell,
  StateHatch,
  TopFace,
  basePorts,
  discD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const SpiFlash: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const kx = b.w / 46;
  const ky = b.h / 28;
  const k = Math.min(kx, ky);
  const body: Rect = {x: b.x + 3 * kx, y: b.y + 6.5 * ky, w: b.w - 6 * kx, h: 15 * ky};
  const r = 2.5 * k;
  const d = rectD(body, r);
  let legs = '';
  for (const u of [9.5, 18.5, 27.5, 36.5]) {
    legs += rectD({x: b.x + (u - 1.6) * kx, y: b.y + 0.5 * ky, w: 3.2 * kx, h: 6.5 * ky}, 0.6 * k);
    legs += rectD({x: b.x + (u - 1.6) * kx, y: b.y + 21 * ky, w: 3.2 * kx, h: 6.5 * ky}, 0.6 * k);
  }
  return (
    <Shell b={b}>
      <TopFace d={legs} fill={COLOR.detail} />
      <Raised d={d} hull={raisedHullPath(body, r, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.body)} />
      <StateHatch b={b} clipD={d} rect={body} />
      <Lines>
        <TopFace d={discD(body.x + 4.5 * k, body.y + 4 * k, 1.9 * k)} fill={COLOR.detail} />
      </Lines>
      <RimLight rect={body} radius={r} zoom={b.zoom} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const spiFlashSpec: IconSpec<IconBaseProps> = {
  type: 'spiFlash',
  component: SpiFlash,
  size: {w: 46, h: 28},
  z: 4,
  passive: false,
  ports: (p): Ports => basePorts(p, false),
};
