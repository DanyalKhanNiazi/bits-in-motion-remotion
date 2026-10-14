/**
 * `rearIo` (ICONS.md §4.13): the I/O shield stack on the board's rear edge (38 × 230, z 10). Passive.
 * Base: the shield (bodyLo, r 3) with its ports as recesses: two USB-A pairs, the HDMI output, the RJ45 jack (the S11
 * network wake source: port `rj45`) and three audio jacks. Detail: the RJ45 contacts and the port rims. (The cut-outs that identify the part are base, not detail,
 * because its shorter side keeps `detail` at 0 in Ep01.) Ports: `rj45` (the jack's centre), `rj45Right`.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
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
  discD,
  fx,
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
  type Vec,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';
import {jackOpeningD} from './rj45';

/** A rectangular port recess: dark walls (top/left), a floor shifted toward the bottom-right. */
const PortRecess: React.FC<{r: Rect; depth: Vec; rad: number; floor?: string}> = ({r, depth, rad, floor}) => (
  <>
    <TopFace d={rectD(r, rad)} fill={COLOR.side} />
    <TopFace
      d={rectD({x: r.x + depth[0], y: r.y + depth[1], w: Math.max(0, r.w - depth[0]), h: Math.max(0, r.h - depth[1])}, rad * 0.8)}
      fill={floor ?? COLOR.deck}
    />
  </>
);

const UsbA: React.FC<{r: Rect; depth: Vec; k: number; tongue: boolean}> = ({r, depth, k, tongue}) => (
  <>
    <PortRecess r={r} depth={depth} rad={1.2 * k} />
    {tongue ? <TopFace d={rectD({x: r.x + 3 * k, y: r.y + 2 * k, w: r.w - 6 * k, h: 3 * k}, 0.6 * k)} fill={COLOR.bodyHi} /> : null}
  </>
);

export const rearIoGeometry = (p: {x: number; y: number; w: number; h: number}) => {
  const kx = p.w / 38;
  const ky = p.h / 230;
  const k = Math.min(kx, ky);
  const R = (u: number, v: number, w: number, h: number): Rect => ({x: p.x + u * kx, y: p.y + v * ky, w: w * kx, h: h * ky});
  return {
    k,
    kx,
    ky,
    R,
    usb: [R(8, 22, 22, 10), R(8, 38, 22, 10)],
    usb2: [R(8, 128, 22, 10), R(8, 144, 22, 10)],
    hdmi: R(8.5, 78, 21, 9),
    rj45: R(6, 170, 26, 32),
    audio: [9, 19, 29].map((u) => ({cx: p.x + u * kx, cy: p.y + 216 * ky, r: 3.8 * k})),
  };
};

export const RearIo: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, true);
  const g = rearIoGeometry(b.rect);
  const {k} = g;
  const r = 3 * k;
  const d = rectD(b.rect, r);
  const depth = b.sideK(0.22);
  const jack = g.rj45;
  const jackD = jackOpeningD(jack, 10 * g.kx, 6 * g.ky, 1.5 * k);
  // hdmi trapezoid
  const h = g.hdmi;
  const hd = `M${fx(h.x)} ${fx(h.y)}H${fx(h.x + h.w)}V${fx(h.y + h.h * 0.55)}L${fx(h.x + h.w - 3 * k)} ${fx(h.y + h.h)}H${fx(h.x + 3 * k)}L${fx(h.x)} ${fx(h.y + h.h * 0.55)}Z`;
  let contacts = '';
  for (let i = 0; i < 8; i++) {
    const x = jack.x + 5 * g.kx + i * ((jack.w - 10 * g.kx) / 7);
    contacts += lineD(x, jack.y + 3 * g.ky, x, jack.y + 9 * g.ky);
  }
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.bodyLo} />
      {[...g.usb, ...g.usb2].map((u, i) => (
        <UsbA key={i} r={u} depth={depth} k={k} tongue />
      ))}
      {/* display output (HDMI trapezoid) */}
      <TopFace d={hd} fill={COLOR.side} />
      {/* RJ45: housing ring + opening with latch notch */}
      <TopFace d={rectD({x: jack.x - 2 * k, y: jack.y - 2 * k, w: jack.w + 4 * k, h: jack.h + 4 * k}, 2.5 * k)} fill={COLOR.body} />
      <TopFace d={jackD} fill={COLOR.side} />
      <TopFace d={rectD({x: jack.x + depth[0] + 2 * k, y: jack.y + depth[1] + 2 * k, w: jack.w - depth[0] - 4 * k, h: jack.h * 0.62}, 1 * k)} fill={COLOR.deck} />
      {g.audio.map((a, i) => (
        <g key={i}>
          <TopFace d={discD(a.cx, a.cy, a.r)} fill={COLOR.body} />
          <TopFace d={discD(a.cx, a.cy, a.r * 0.5)} fill={COLOR.side} />
        </g>
      ))}
      <DetailGroup b={b}>
        <Detail d={hd} zoom={b.zoom} />
        <Detail d={contacts} zoom={b.zoom} />
        <Detail d={g.audio.map((a) => discD(a.cx, a.cy, a.r)).join('')} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Detail d={jackD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const rearIoSpec: IconSpec<IconBaseProps> = {
  type: 'rearIo',
  component: RearIo,
  size: {w: 38, h: 230},
  z: 10,
  passive: true,
  ports: (p): Ports => {
    const g = rearIoGeometry(p);
    return {...basePorts(p, true), rj45: [g.rj45.x + g.rj45.w / 2, g.rj45.y + g.rj45.h / 2], rj45Right: [g.rj45.x + g.rj45.w, g.rj45.y + g.rj45.h / 2 + 5 * g.ky]};
  },
};
