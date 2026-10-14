/**
 * `atx24` (ICONS.md §4.11): the 24-pin ATX power connector on the board (132 × 26, z 8). Passive.
 * Base: housing (bodyLo, r 3) with its latch tab on the top edge, the dark mouth and the 2 × 12 pin field (square and
 * rounded-top cavities, as on the real part): the shorter side keeps `detail` at 0 in Ep01, so the pins are base.
 * Detail: the pin-1 mark and the latch grip.
 * Ports: `pin9` / `pin9Top` (x = the standby channel: +5VSB), `mainEntry` / `mainTop` (x = the main channel), `top`, `bottom`.
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
  polyD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export interface Atx24Props extends IconBaseProps {
  /** x of pin 9 (+5VSB, the standby channel) and of the main-rail entry as fractions of the width (Ep01: 676, 730). */
  pin9Frac?: number;
  mainFrac?: number;
}

export const Atx24: React.FC<Atx24Props> = (p) => {
  const b = resolveBase(p, true);
  const kx = b.w / 132;
  const ky = b.h / 26;
  const k = Math.min(kx, ky);
  const r = 3 * k;
  const d = rectD(b.rect, r);
  // latch tab on the top edge (protrudes 5 px)
  const latch: Rect = {x: b.x + 54 * kx, y: b.y - 5 * ky, w: 24 * kx, h: 8 * ky};
  const latchD = rectD(latch, 2 * k);
  // mouth and the 2 × 12 pin field (square pins: in a real 24-pin, alternating square and rounded-top cavities)
  const mouth: Rect = {x: b.x + 4 * kx, y: b.y + 4 * ky, w: b.w - 8 * kx, h: b.h - 8 * ky};
  const pitch = mouth.w / 12;
  let pins = '';
  let roundTops = '';
  for (let i = 0; i < 12; i++) {
    const cx = mouth.x + pitch * (i + 0.5);
    for (const row of [0, 1]) {
      const cy = mouth.y + mouth.h * (row === 0 ? 0.28 : 0.72);
      const s = Math.min(pitch * 0.62, mouth.h * 0.36);
      const keyed = (i + row) % 3 === 0;
      if (keyed) roundTops += polyD([[cx - s / 2, cy + s / 2], [cx - s / 2, cy - s / 6], [cx - s / 6, cy - s / 2], [cx + s / 6, cy - s / 2], [cx + s / 2, cy - s / 6], [cx + s / 2, cy + s / 2]]);
      else pins += rectD({x: cx - s / 2, y: cy - s / 2, w: s, h: s}, s * 0.12);
    }
  }
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <Raised d={latchD} hull={raisedHullPath(latch, 2 * k, b.sideK(0.6))} />
      <TopFace d={latchD} fill={COLOR.bodyLo} />
      <TopFace d={d} fill={COLOR.bodyLo} />
      <TopFace d={rectD(mouth, 1.5 * k)} fill={COLOR.side} />
      <TopFace d={pins + roundTops} fill={COLOR.bodyHi} />
      <DetailGroup b={b}>
        <Detail d={polyD([[mouth.x + 1 * kx, mouth.y + mouth.h - 1 * ky], [mouth.x + 7 * kx, mouth.y + mouth.h - 1 * ky], [mouth.x + 1 * kx, mouth.y + mouth.h - 7 * ky]])} zoom={b.zoom} fill />
        <Detail d={lineD(latch.x + 5 * kx, latch.y + 2.5 * ky, latch.x + latch.w - 5 * kx, latch.y + 2.5 * ky)} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Lines>
        <Stroke d={latchD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const atx24Spec: IconSpec<Atx24Props> = {
  type: 'atx24',
  component: Atx24,
  size: {w: 132, h: 26},
  z: 8,
  passive: true,
  ports: (p): Ports => ({
    ...basePorts(p, true),
    pin9: [p.x + p.w * (p.pin9Frac ?? 56 / 132), p.y + p.h],
    pin9Top: [p.x + p.w * (p.pin9Frac ?? 56 / 132), p.y],
    mainEntry: [p.x + p.w * (p.mainFrac ?? 110 / 132), p.y + p.h],
    mainTop: [p.x + p.w * (p.mainFrac ?? 110 / 132), p.y],
  }),
};
