/**
 * `rfChip` (ICONS.md §6, Ep02; round 2 seed): a Wi-Fi radio, QFN package (56 × 56, z chip).
 * Base: the package (body, r 4) with its 2.5D side and a ring of contact pads round the edge; the antenna feed pad
 * (the larger pad on the top edge) and the pin-1 dot. Detail: the exposed thermal pad's outline.
 * Active region: the package (powered). Ports: `feed` (the antenna pad), `center`.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {Detail, DetailGroup, Glow, Lines, Outline, Pip, Raised, RimLight, Shell, StateHatch, TopFace, basePorts, discD, raisedHullPath, rectD, resolveBase} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const RfChip: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const k = Math.min(b.w, b.h) / 56;
  const r = 4 * k;
  const d = rectD(b.rect, r);
  let pads = '';
  for (let i = 0; i < 6; i++) {
    const t = 11 + i * 7;
    pads += rectD({x: b.x + t * k - 1.6 * k, y: b.y + b.h - 4 * k, w: 3.2 * k, h: 3 * k}, 0.6 * k);
    pads += rectD({x: b.x + 1 * k, y: b.y + t * k - 1.6 * k, w: 3 * k, h: 3.2 * k}, 0.6 * k);
    pads += rectD({x: b.x + b.w - 4 * k, y: b.y + t * k - 1.6 * k, w: 3 * k, h: 3.2 * k}, 0.6 * k);
    if (i !== 2 && i !== 3) pads += rectD({x: b.x + t * k - 1.6 * k, y: b.y + 1 * k, w: 3.2 * k, h: 3 * k}, 0.6 * k);
  }
  const feed = rectD({x: b.x + 24 * k, y: b.y + 0.5 * k, w: 8 * k, h: 5 * k}, 1 * k);
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.body)} />
      <StateHatch b={b} clipD={d} />
      <Lines>
        <TopFace d={pads} fill={COLOR.detail} />
        <TopFace d={feed} fill={COLOR.structure} />
        <TopFace d={discD(b.x + 9 * k, b.y + 9 * k, 2 * k)} fill={COLOR.detail} />
      </Lines>
      <DetailGroup b={b}>
        <Detail d={rectD({x: b.x + 16 * k, y: b.y + 16 * k, w: 24 * k, h: 24 * k}, 2 * k)} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const rfChipSpec: IconSpec<IconBaseProps> = {
  type: 'rfChip',
  component: RfChip,
  size: {w: 56, h: 56},
  z: 4,
  passive: false,
  ports: (p): Ports => ({...basePorts(p, false), feed: [p.x + p.w / 2, p.y]}),
};
