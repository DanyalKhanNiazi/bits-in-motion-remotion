/**
 * `led` (ICONS.md §4.17): the case power LED, r 5. Off = dark lens in a 2 px `structure` ring (the whole Ep01 intro).
 * On = a lit lens (`ink`, neutral white: the one emissive LED). Its state reads by itself, so the pip defaults off.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {Glow, Lines, Pip, Shell, Stroke, TopFace, basePorts, discD, mix, poweredOf, resolveBase} from '../primitives';
import type {IconBaseProps, IconSpec} from '../types';

export const Led: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase({...p, pip: p.pip ?? false}, false);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const r = Math.min(b.w, b.h) / 2;
  const lit = poweredOf(b.state, b.flip, b.frame);
  const d = discD(cx, cy, r);
  return (
    <Shell b={b}>
      <TopFace d={discD(cx, cy, r + b.s(1.5))} fill={COLOR.side} />
      <TopFace d={d} fill={mix(COLOR.side, COLOR.ink, lit)} />
      <Lines>
        <Stroke d={d} zoom={b.zoom} color={mix(mix(COLOR.structure, COLOR.textMuted, b.pointed), COLOR.ink, lit)} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} width={STROKE.detail} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const ledSpec: IconSpec<IconBaseProps> = {
  type: 'led',
  component: Led,
  size: {w: 10, h: 10},
  z: 0,
  passive: false,
  ports: (p) => basePorts({...p, pip: p.pip ?? false}, false),
};
