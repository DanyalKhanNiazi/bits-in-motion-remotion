/**
 * `fpHeader` (ICONS.md §4.12): the Intel 2 × 5 front-panel header (50 × 24, z 6). Passive.
 * Base: housing (bodyLo) and nine pins; pin 10 is missing (the key). Power switch = pins 6 and 8 (port `pwrSw`).
 * Odd pins (1 3 5 7 9) on the bottom row, even pins (2 4 6 8 10) on the top row, pin 1 at the left.
 * S03's end tick is drawn at `bottom`. Detail: the pin-1 mark.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {
  DetailGroup,
  Detail,
  Glow,
  Outline,
  Raised,
  RimLight,
  Shell,
  TopFace,
  basePorts,
  polyD,
  raisedHullPath,
  rectD,
  resolveBase,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const fpHeaderPins = (r: {x: number; y: number; w: number; h: number}) => {
  const pitch = r.w / 5;
  const pin = (n: number): [number, number] => {
    const col = Math.floor((n - 1) / 2);
    const top = n % 2 === 0;
    return [r.x + pitch * (col + 0.5), r.y + r.h * (top ? 0.3 : 0.7)];
  };
  return {pitch, pin};
};

export const FpHeader: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, true);
  const k = Math.min(b.w / 50, b.h / 24);
  const r = 3 * k;
  const d = rectD(b.rect, r);
  const {pitch, pin} = fpHeaderPins(b.rect);
  const s = Math.min(pitch * 0.5, b.h * 0.28);
  let pins = '';
  for (let n = 1; n <= 9; n++) {
    const [cx, cy] = pin(n);
    pins += rectD({x: cx - s / 2, y: cy - s / 2, w: s, h: s}, s * 0.15);
  }
  const [kx, ky] = pin(10);
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.bodyLo} />
      {/* pin wells, then the gold-less pins (bodyHi) */}
      <TopFace d={pins} fill={COLOR.bodyHi} />
      <TopFace d={rectD({x: kx - s * 0.28, y: ky - s * 0.28, w: s * 0.56, h: s * 0.56}, s * 0.1)} fill={COLOR.side} />
      <DetailGroup b={b}>
        <Detail d={polyD([[b.x + 1.5 * k, b.y + b.h - 1.5 * k], [b.x + 6 * k, b.y + b.h - 1.5 * k], [b.x + 1.5 * k, b.y + b.h - 6 * k]])} zoom={b.zoom} fill />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const fpHeaderSpec: IconSpec<IconBaseProps> = {
  type: 'fpHeader',
  component: FpHeader,
  size: {w: 50, h: 24},
  z: 6,
  passive: true,
  ports: (p): Ports => {
    const {pin} = fpHeaderPins(p);
    const a = pin(6);
    const c = pin(8);
    return {...basePorts(p, true), pwrSw: [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2], pin6: a, pin8: c};
  },
};
