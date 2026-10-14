/**
 * `dimm` (ICONS.md §4.6): one DDR memory slot with its module (14 × 260, z 10).
 * Base: the slot (bodyLo, r 3), latches at both ends (bodyHi), the slot key 40 % from the bottom, and the module's top
 * edge (board) seated in the groove — the active region. Detail: eight DRAM packages (x-ray) and the latch grips.
 * Works vertical or horizontal (the long side sets the axis). `off` in Ep01. Ports: `top`, `bottom`, `center`.
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
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const Dimm: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const vertical = b.h >= b.w;
  // work in a local frame where the long axis is "len" and the short axis "wid"
  const len = vertical ? b.h : b.w;
  const wid = vertical ? b.w : b.h;
  const kl = len / 260;
  const kw = wid / 14;
  const k = Math.min(kl, kw);
  const R = (l0: number, w0: number, l: number, w: number): Rect =>
    vertical ? {x: b.x + w0 * kw, y: b.y + l0 * kl, w: w * kw, h: l * kl} : {x: b.x + l0 * kl, y: b.y + w0 * kw, w: l * kl, h: w * kw};
  const r = 3 * k;
  const d = rectD(b.rect, r);
  const latchA = R(-3, -1, 12, 16);
  const latchB = R(251, -1, 12, 16);
  const keyL = 260 * 0.6; // 40 % from the bottom
  const groove = [R(11, 4.5, keyL - 2.5 - 11, 5), R(keyL + 2.5, 4.5, 249 - keyL - 2.5, 5)];
  const module = [R(11, 5.5, keyL - 3 - 11, 3), R(keyL + 3, 5.5, 249 - keyL - 3, 3)];
  const chips: Rect[] = [];
  for (let i = 0; i < 8; i++) {
    const l0 = 20 + i * 28.5 + (i >= 5 ? 6 : 0);
    if (l0 + 22 > 247) break;
    chips.push(R(l0, 2, 22, 10));
  }
  const moduleD = module.map((m) => rectD(m, 0.8 * k)).join('');
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <Raised d={rectD(latchA, 2 * k)} hull={raisedHullPath(latchA, 2 * k, b.sideK(1.15))} />
      <Raised d={rectD(latchB, 2 * k)} hull={raisedHullPath(latchB, 2 * k, b.sideK(1.15))} />
      <TopFace d={d} fill={COLOR.bodyLo} />
      <TopFace d={groove.map((g) => rectD(g, 1 * k)).join('')} fill={COLOR.side} />
      <TopFace d={moduleD} fill={b.act(COLOR.board)} />
      <TopFace d={rectD(latchA, 2 * k) + rectD(latchB, 2 * k)} fill={COLOR.bodyHi} />
      <StateHatch b={b} clipD={moduleD} />
      <DetailGroup b={b}>
        <TopFace d={chips.map((c) => rectD(c, 1 * k)).join('')} fill={COLOR.body} />
        <Detail d={chips.map((c) => rectD(c, 1 * k)).join('')} zoom={b.zoom} />
        <Detail
          d={[latchA, latchB]
            .map((l) => (vertical ? lineD(l.x + 3 * kw, l.y + l.h / 2, l.x + l.w - 3 * kw, l.y + l.h / 2) : lineD(l.x + l.w / 2, l.y + 3 * kw, l.x + l.w / 2, l.y + l.h - 3 * kw)))
            .join('')}
          zoom={b.zoom}
        />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Lines>
        <Stroke d={rectD(latchA, 2 * k) + rectD(latchB, 2 * k)} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const dimmSpec: IconSpec<IconBaseProps> = {
  type: 'dimm',
  component: Dimm,
  size: {w: 14, h: 260},
  z: 10,
  passive: false,
  ports: (p): Ports => basePorts(p, false),
};
