/**
 * `amdPackage` (ICONS.md §4.19): a Ryzen package in an AM5 socket, on the Intel socket's footprint (260 × 260), so the
 * S09 swap reads as "same place, different package". Never a copy of the Intel layout.
 * Base: socket frame (bodyLo) with its load-plate screws at the corners, the square AM5 substrate, the heat spreader
 * drawn X-RAY (2 px `detail` outline only, with the AM5 "octopus" cut-outs, two per side) so the dies show through:
 * two core dies (CCDs, 56 × 84, bodyHi) on the left and one I/O die (100 × 132, bodyHi) on the right, large enough to
 * hold the lookout (72 × 36) and the "?" (64 × 64) at scale 1 (critic change C6).
 * Detail: capacitors in the cut-outs, the CCDs' core grid, the pin-1 triangle.
 * Ports: `iod` (I/O die centre), `iodSlot:lookout` and `iodSlot:q` (CENTRES of the blocks' destination rects; use
 * blockRectAt(center, shape) for the rect), `center`.
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
  lineD,
  polyD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

const S0 = 260;

/** Square with two rectangular cut-outs on every side (AM5 heat-spreader silhouette), clockwise. */
export const octopusD = (r: Rect, depth: number, len: number, at: [number, number] = [0.27, 0.73]): string => {
  const {x, y, w, h} = r;
  const pts: Pt[] = [];
  // top edge, left → right
  pts.push([x, y]);
  for (const f of at) {
    const c = x + w * f;
    pts.push([c - len / 2, y], [c - len / 2, y + depth], [c + len / 2, y + depth], [c + len / 2, y]);
  }
  pts.push([x + w, y]);
  // right edge, top → bottom
  for (const f of at) {
    const c = y + h * f;
    pts.push([x + w, c - len / 2], [x + w - depth, c - len / 2], [x + w - depth, c + len / 2], [x + w, c + len / 2]);
  }
  pts.push([x + w, y + h]);
  // bottom edge, right → left
  for (const f of [...at].reverse()) {
    const c = x + w * f;
    pts.push([c + len / 2, y + h], [c + len / 2, y + h - depth], [c - len / 2, y + h - depth], [c - len / 2, y + h]);
  }
  pts.push([x, y + h]);
  // left edge, bottom → top
  for (const f of [...at].reverse()) {
    const c = y + h * f;
    pts.push([x, c + len / 2], [x + depth, c + len / 2], [x + depth, c - len / 2], [x, c - len / 2]);
  }
  return polyD(pts);
};

export const amdGeometry = (p: {x: number; y: number; w: number; h: number}) => {
  const kx = p.w / S0;
  const ky = p.h / S0;
  const k = Math.min(kx, ky);
  const R = (u: number, v: number, w: number, h: number): Rect => ({x: p.x + u * kx, y: p.y + v * ky, w: w * kx, h: h * ky});
  const sub = R(18, 18, 224, 224);
  const ihs = R(30, 30, 200, 200);
  const ccd = [R(44, 42, 56, 84), R(44, 134, 56, 84)];
  const iod = R(116, 64, 100, 132);
  const slotQ: Pt = [p.x + 166 * kx, p.y + 108 * ky];
  const slotLookout: Pt = [p.x + 166 * kx, p.y + 168 * ky];
  return {kx, ky, k, R, sub, ihs, ccd, iod, slotQ, slotLookout};
};

export const AmdPackage: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const g = amdGeometry(b.rect);
  const {k, R} = g;
  const frameR = 8 * k;
  const frameD = rectD(b.rect, frameR);
  const subD = rectD(g.sub, 4 * k);
  const ihsD = octopusD(g.ihs, 10 * k, 24 * k);
  const diesD = g.ccd.map((c) => rectD(c, 2 * k)).join('') + rectD(g.iod, 4 * k);
  // capacitors inside the cut-outs (detail)
  let caps = '';
  const ats = [0.27, 0.73];
  for (const f of ats) {
    for (let j = -1; j <= 1; j++) {
      const u = 30 + 200 * f + j * 6.5;
      caps += rectD(R(u - 1.6, 33, 3.2, 5), 0.5) + rectD(R(u - 1.6, 222, 3.2, 5), 0.5);
      caps += rectD(R(33, u - 1.6, 5, 3.2), 0.5) + rectD(R(222, u - 1.6, 5, 3.2), 0.5);
    }
  }
  // CCD core grid (2 × 4 cores + the L3 strip)
  let cores = '';
  for (const c of g.ccd) {
    cores += lineD(c.x + c.w / 2, c.y + 6 * k, c.x + c.w / 2, c.y + c.h * 0.7);
    for (let i = 1; i < 4; i++) cores += lineD(c.x + 5 * k, c.y + 6 * k + ((c.h * 0.7 - 6 * k) * i) / 4, c.x + c.w - 5 * k, c.y + 6 * k + ((c.h * 0.7 - 6 * k) * i) / 4);
    cores += rectD({x: c.x + 5 * k, y: c.y + c.h * 0.74, w: c.w - 10 * k, h: c.h * 0.2}, 1);
  }
  const screws: Pt[] = [
    [b.x + 9 * g.kx, b.y + 9 * g.ky],
    [b.x + b.w - 9 * g.kx, b.y + 9 * g.ky],
    [b.x + 9 * g.kx, b.y + b.h - 9 * g.ky],
    [b.x + b.w - 9 * g.kx, b.y + b.h - 9 * g.ky],
  ];
  const pin1 = polyD([
    [g.sub.x + 4 * k, g.sub.y + g.sub.h - 4 * k],
    [g.sub.x + 16 * k, g.sub.y + g.sub.h - 4 * k],
    [g.sub.x + 4 * k, g.sub.y + g.sub.h - 16 * k],
  ]);
  return (
    <Shell b={b}>
      <Raised d={frameD} hull={raisedHullPath(b.rect, frameR, b.side)} />
      <TopFace d={frameD} fill={COLOR.bodyLo} />
      <Raised d={subD} hull={raisedHullPath(g.sub, 4 * k, b.sideK(0.16))} />
      <TopFace d={subD} fill={COLOR.body} />
      {[...g.ccd, g.iod].map((c, i) => (
        <Raised key={i} d={rectD(c, 2 * k)} hull={raisedHullPath(c, i === 2 ? 4 * k : 2 * k, b.sideK(0.22))} />
      ))}
      <TopFace d={diesD} fill={b.act(COLOR.bodyHi)} />
      <StateHatch b={b} clipD={diesD} />
      <Lines>
        <TopFace d={pin1} fill={COLOR.detail} />
        {screws.map(([cx, cy], i) => (
          <Stroke key={i} d={discD(cx, cy, 4.2 * k)} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
        ))}
      </Lines>
      <DetailGroup b={b}>
        <Detail d={caps} zoom={b.zoom} fill />
        <Detail d={cores} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={frameR} zoom={b.zoom} />
      {[...g.ccd, g.iod].map((c, i) => (
        <RimLight key={i} rect={c} radius={i === 2 ? 4 * k : 2 * k} zoom={b.zoom} inset={b.s(2)} />
      ))}
      <Lines>
        <Stroke d={diesD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} opacity={0.9} />
        {/* the x-ray heat spreader: outline only, so the dies show through */}
        <Stroke d={ihsD} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
      </Lines>
      <Glow d={frameD} zoom={b.zoom} alpha={b.glow} />
      <Outline d={frameD} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const amdPackagePorts = (p: IconBaseProps): Ports => {
  const g = amdGeometry(p);
  return {
    ...basePorts(p, false),
    iod: [g.iod.x + g.iod.w / 2, g.iod.y + g.iod.h / 2],
    'iodSlot:lookout': g.slotLookout,
    'iodSlot:q': g.slotQ,
    bitAnchor: g.slotLookout,
  };
};

export const amdPackageSpec: IconSpec<IconBaseProps> = {
  type: 'amdPackage',
  component: AmdPackage,
  size: {w: S0, h: S0},
  z: 10,
  passive: false,
  ports: amdPackagePorts,
};
