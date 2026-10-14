/**
 * `rj45` (ICONS.md §4.13): a standalone RJ45 jack face (26 × 32, z 12). Passive. (Ep01 draws the RJ45 as a cut-out
 * in `rearIo`.) Base: the housing, the opening with its latch notch and the jack's floor. Detail: 8 contacts.
 * Ports: `face` (centre), `in` (right edge).
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {DetailGroup, Detail, Glow, Outline, Raised, RimLight, Shell, TopFace, basePorts, fx, lineD, raisedHullPath, rectD, resolveBase, type Rect} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

/** The RJ45 opening: a body with a narrower latch notch below (clockwise). */
export const jackOpeningD = (r: Rect, notchW: number, notchH: number, rad: number): string => {
  const bodyH = r.h - notchH;
  const cx = r.x + r.w / 2;
  return (
    `M${fx(r.x + rad)} ${fx(r.y)}H${fx(r.x + r.w - rad)}A${fx(rad)} ${fx(rad)} 0 0 1 ${fx(r.x + r.w)} ${fx(r.y + rad)}` +
    `V${fx(r.y + bodyH)}H${fx(cx + notchW / 2)}V${fx(r.y + r.h)}H${fx(cx - notchW / 2)}V${fx(r.y + bodyH)}H${fx(r.x)}` +
    `V${fx(r.y + rad)}A${fx(rad)} ${fx(rad)} 0 0 1 ${fx(r.x + rad)} ${fx(r.y)}Z`
  );
};

export const Rj45: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, true);
  const kx = b.w / 26;
  const ky = b.h / 32;
  const k = Math.min(kx, ky);
  const r = 3 * k;
  const d = rectD(b.rect, r);
  const open: Rect = {x: b.x + 3.5 * kx, y: b.y + 4 * ky, w: b.w - 7 * kx, h: b.h - 8 * ky};
  const openD = jackOpeningD(open, 8 * kx, 5.5 * ky, 1.2 * k);
  const depth = b.sideK(0.2);
  let contacts = '';
  for (let i = 0; i < 8; i++) {
    const x = open.x + 2.5 * kx + i * ((open.w - 5 * kx) / 7);
    contacts += lineD(x, open.y + 2 * ky, x, open.y + 8 * ky);
  }
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.body} />
      <TopFace d={openD} fill={COLOR.side} />
      <TopFace d={rectD({x: open.x + depth[0], y: open.y + depth[1], w: open.w - depth[0], h: open.h * 0.6}, 1 * k)} fill={COLOR.deck} />
      <DetailGroup b={b}>
        <Detail d={contacts} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Detail d={openD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const rj45Spec: IconSpec<IconBaseProps> = {
  type: 'rj45',
  component: Rj45,
  size: {w: 26, h: 32},
  z: 12,
  passive: true,
  ports: (p): Ports => ({...basePorts(p, true), face: [p.x + p.w / 2, p.y + p.h / 2], in: [p.x + p.w, p.y + p.h / 2]}),
};
