/**
 * `m2` (ICONS.md §4.7): an M.2 2280 NVMe SSD (280 × 34, z 4).
 * Base: the PCB (board) with the M-key notch in its edge connector on the left, the controller (34 × 26) and two NAND
 * packages (64 × 26) standing proud, the half-moon screw notch at the right end. Detail: the gold fingers, SMD
 * passives and package pin-1 dots. Active region: the controller and NAND packages.
 * Ports: `connector` (left end), `center`, `bitAnchor` (controller centre), `screw`.
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
  discD,
  fx,
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const m2Shape = (r: Rect) => {
  const kx = r.w / 280;
  const ky = r.h / 34;
  const k = Math.min(kx, ky);
  const X = (u: number) => r.x + u * kx;
  const Y = (v: number) => r.y + v * ky;
  const rr = 3 * k;
  const nr = 5.2 * k; // screw notch radius
  const ny = r.y + r.h / 2;
  // key notch on the left edge (M key, ~ 30 % from the top)
  const k0 = Y(8.5);
  const k1 = Y(12.5);
  const kd = 4.5 * kx;
  const pcb =
    `M${fx(r.x + rr)} ${fx(r.y)}H${fx(r.x + r.w - rr)}A${fx(rr)} ${fx(rr)} 0 0 1 ${fx(r.x + r.w)} ${fx(r.y + rr)}` +
    `V${fx(ny - nr)}A${fx(nr)} ${fx(nr)} 0 0 0 ${fx(r.x + r.w)} ${fx(ny + nr)}` +
    `V${fx(r.y + r.h - rr)}A${fx(rr)} ${fx(rr)} 0 0 1 ${fx(r.x + r.w - rr)} ${fx(r.y + r.h)}H${fx(r.x + rr)}` +
    `A${fx(rr)} ${fx(rr)} 0 0 1 ${fx(r.x)} ${fx(r.y + r.h - rr)}V${fx(k1)}H${fx(r.x + kd)}V${fx(k0)}H${fx(r.x)}` +
    `V${fx(r.y + rr)}A${fx(rr)} ${fx(rr)} 0 0 1 ${fx(r.x + rr)} ${fx(r.y)}Z`;
  const ctrl: Rect = {x: X(24), y: Y(4), w: 34 * kx, h: 26 * ky};
  const nand: Rect[] = [
    {x: X(72), y: Y(4), w: 64 * kx, h: 26 * ky},
    {x: X(148), y: Y(4), w: 64 * kx, h: 26 * ky},
  ];
  const fingers: Rect = {x: r.x + 0.5 * kx, y: r.y + 2 * ky, w: 9 * kx, h: r.h - 4 * ky};
  return {kx, ky, k, X, Y, pcb, ctrl, nand, fingers, k0, k1, kd, screw: {cx: r.x + r.w, cy: ny, r: nr}};
};

export const M2: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const s = m2Shape(b.rect);
  const {k, X, Y} = s;
  const chipsD = rectD(s.ctrl, 1.5 * k) + s.nand.map((n) => rectD(n, 1.5 * k)).join('');
  // contact fingers (gold edge), split by the key notch
  let fingers = '';
  for (let v = 3.5; v <= 31; v += 3.6) {
    const yy = Y(v);
    if (yy > s.k0 - 1 * k && yy < s.k1 + 1 * k) continue;
    fingers += lineD(b.x + s.kd + 1 * k, yy, X(9.5), yy);
  }
  const passives = [
    [62, 7],
    [62, 13],
    [62, 22],
    [140, 9],
    [140, 25],
    [218, 8],
    [218, 16],
    [226, 12],
    [226, 24],
  ]
    .map(([u, v]) => rectD({x: X(u), y: Y(v), w: 4 * s.kx, h: 2.8 * s.ky}, 0.4 * k))
    .join('');
  return (
    <Shell b={b}>
      <Raised d={s.pcb} side={b.side} />
      <TopFace d={s.pcb} fill={COLOR.board} />
      <TopFace
        d={rectD({x: X(1), y: Y(1.5), w: 9 * s.kx, h: s.k0 - Y(1.5) - 1 * k}, 1 * k) + rectD({x: X(1), y: s.k1 + 1 * k, w: 9 * s.kx, h: Y(32.5) - s.k1 - 1 * k}, 1 * k)}
        fill={COLOR.bodyLo}
      />
      {[s.ctrl, ...s.nand].map((c, i) => (
        <Raised key={i} d={rectD(c, 1.5 * k)} hull={raisedHullPath(c, 1.5 * k, b.sideK(0.5))} />
      ))}
      <TopFace d={chipsD} fill={b.act(COLOR.body)} />
      <StateHatch b={b} clipD={chipsD} />
      <DetailGroup b={b}>
        <Detail d={fingers} zoom={b.zoom} />
        <Detail d={passives} zoom={b.zoom} fill />
        <Detail d={[s.ctrl, ...s.nand].map((c) => discD(c.x + 3.2 * k, c.y + 3.2 * k, 1.2 * k)).join('')} zoom={b.zoom} fill />
      </DetailGroup>
      <RimLight rect={b.rect} radius={3 * k} zoom={b.zoom} />
      {[s.ctrl, ...s.nand].map((c, i) => (
        <RimLight key={i} rect={c} radius={1.5 * k} zoom={b.zoom} inset={b.s(2)} />
      ))}
      <Lines>
        <Stroke d={chipsD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} opacity={0.85} />
      </Lines>
      <Glow d={s.pcb} zoom={b.zoom} alpha={b.glow} />
      <Outline d={s.pcb} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const m2Spec: IconSpec<IconBaseProps> = {
  type: 'm2',
  component: M2,
  size: {w: 280, h: 34},
  z: 4,
  passive: false,
  ports: (p): Ports => {
    const s = m2Shape(p);
    return {
      ...basePorts(p, false),
      connector: [p.x, p.y + p.h / 2],
      bitAnchor: [s.ctrl.x + s.ctrl.w / 2, s.ctrl.y + s.ctrl.h / 2],
      screw: [s.screw.cx, s.screw.cy],
    };
  },
};
