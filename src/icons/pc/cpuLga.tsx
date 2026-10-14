/**
 * `cpuLga` (ICONS.md §4.3): a desktop processor in an LGA1700 socket, the "big dark CPU".
 * Base: socket frame (bodyLo, r 8) → package substrate 200 × 240 (body; the real 37.5 × 45 mm ratio) → heat spreader
 * 176 × 204 (bodyHi, r 6) with two notches per long side (the LGA1700 silhouette) standing proud on its own 2.5D lip,
 * pin-1 triangle at the substrate's bottom-left.
 * Detail: SMD capacitor clusters on the substrate's short edges, the retention lever with its hook on the right edge,
 * four load-plate screws.
 * Active region: the heat spreader (never lit in the Ep01 intro).
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
  RimPath,
  Shell,
  StateHatch,
  Stroke,
  TopFace,
  basePorts,
  discD,
  fx,
  mix,
  notchedRectD,
  poweredOf,
  polyD,
  raisedHullPath,
  rectD,
  resolveBase,
  sw,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Pt} from '../types';

export interface CpuLgaProps extends IconBaseProps {
  /** Draw the heat spreader (default true). false = bare substrate with the die. */
  ihs?: boolean;
  /** 'ghost' = a faint dashed outline of a tower cooler's footprint (default 'none': the map shows the bare package). */
  cooler?: 'none' | 'ghost';
}

const W0 = 260;
const H0 = 260;

export const cpuGeometry = (r: {x: number; y: number; w: number; h: number}) => {
  const kx = r.w / W0;
  const ky = r.h / H0;
  const k = Math.min(kx, ky);
  const X = (u: number) => r.x + u * kx;
  const Y = (v: number) => r.y + v * ky;
  const R = (u: number, v: number, w: number, h: number): Rect => ({x: X(u), y: Y(v), w: w * kx, h: h * ky});
  const sub = R(30, 10, 200, 240);
  const ihs = R(42, 28, 176, 204);
  const notchYs = [Y(28 + 204 * 0.215), Y(28 + 204 * 0.785)];
  return {kx, ky, k, X, Y, R, sub, ihs, notchYs};
};

export const CpuLga: React.FC<CpuLgaProps> = (p) => {
  const b = resolveBase(p, false);
  const g = cpuGeometry(b.rect);
  const {k, X, Y, R, sub, ihs, notchYs, kx, ky} = g;
  const frameR = 8 * k;
  const frameD = rectD(b.rect, frameR);
  const subD = rectD(sub, 4 * k);
  const ihsD = notchedRectD(ihs, 6 * k, notchYs, 10 * kx, 24 * ky, 2.5 * k);
  const showIhs = p.ihs !== false;
  const powered = poweredOf(b.state, b.flip, b.frame);
  const edgeCol = mix(COLOR.structure, COLOR.ink, powered);

  // pin-1 triangle in the substrate's bottom-left corner
  const t0: Pt = [X(34), Y(246)];
  const pin1 = polyD([t0, [X(34 + 14), Y(246)], [X(34), Y(246 - 14)]]);

  // the bare die (ihs = false)
  const dieR = R(70, 92, 120, 76);

  // IHS rim: top edge + left edge segments between the notches (inset just inside the 2 px edge)
  const i2 = sw(STROKE.detail, b.zoom); // 2 px edge: rim centre 2 px inside
  const nTop0 = notchYs[0] - 12 * ky;
  const nBot0 = notchYs[0] + 12 * ky;
  const nTop1 = notchYs[1] - 12 * ky;
  const nBot1 = notchYs[1] + 12 * ky;
  const ir = 6 * k - i2;
  const lx = ihs.x + i2;
  const ty = ihs.y + i2;
  const ihsRim =
    `M${fx(lx)} ${fx(ihs.y + ihs.h - 6 * k)}V${fx(nBot1 + 3 * k)}` +
    `M${fx(lx)} ${fx(nTop1 - 3 * k)}V${fx(nBot0 + 3 * k)}` +
    `M${fx(lx)} ${fx(nTop0 - 3 * k)}V${fx(ihs.y + 6 * k)}A${fx(Math.max(ir, 0))} ${fx(Math.max(ir, 0))} 0 0 1 ${fx(ihs.x + 6 * k)} ${fx(ty)}H${fx(ihs.x + ihs.w - 6 * k)}`;

  // detail: capacitor clusters on the short edges (6 × 4 at 8 px pitch), lever, screws
  const caps: string[] = [];
  for (const cx of [84, 130, 176]) {
    for (let j = -1.5; j <= 1.5; j++) {
      const u = cx + j * 8 - 2;
      caps.push(rectD(R(u, 16, 4, 6), 0.8 * k));
      caps.push(rectD(R(u, 238, 4, 6), 0.8 * k));
    }
  }
  const lever = `M${fx(X(249))} ${fx(Y(26))}V${fx(Y(226))}A${fx(10 * k)} ${fx(10 * k)} 0 0 1 ${fx(X(239))} ${fx(Y(236))}H${fx(X(235))}`;
  const leverTab = rectD(R(243, 18, 12, 6), 1.5 * k);
  const screws: Pt[] = [
    [X(14), Y(14)],
    [X(246), Y(14)],
    [X(14), Y(246)],
    [X(246), Y(246)],
  ];

  const ghostR = Math.max(b.w, b.h) * 0.62;
  return (
    <Shell b={b}>
      <Raised d={frameD} hull={raisedHullPath(b.rect, frameR, b.side)} />
      <TopFace d={frameD} fill={COLOR.bodyLo} />
      {/* package substrate, a thin lip above the socket */}
      <Raised d={subD} hull={raisedHullPath(sub, 4 * k, b.sideK(0.16))} />
      <TopFace d={subD} fill={COLOR.body} />
      {showIhs ? (
        <>
          <Raised d={ihsD} side={b.sideK(0.42)} />
          <TopFace d={ihsD} fill={b.act(COLOR.bodyHi)} />
          <StateHatch b={b} clipD={ihsD} rect={ihs} />
        </>
      ) : (
        <>
          <Raised d={rectD(dieR, 2 * k)} hull={raisedHullPath(dieR, 2 * k, b.sideK(0.2))} />
          <TopFace d={rectD(dieR, 2 * k)} fill={b.act(COLOR.bodyHi)} />
        </>
      )}
      <Lines>
        <TopFace d={pin1} fill={COLOR.detail} />
      </Lines>
      <DetailGroup b={b}>
        <Detail d={caps.join('')} zoom={b.zoom} fill />
        <Detail d={lever} zoom={b.zoom} />
        <Detail d={leverTab} zoom={b.zoom} />
        {screws.map(([cx, cy], i) => (
          <g key={i}>
            <Detail d={discD(cx, cy, 5 * k)} zoom={b.zoom} />
            <Detail d={discD(cx, cy, 1.2 * k)} zoom={b.zoom} fill />
          </g>
        ))}
      </DetailGroup>
      <RimLight rect={b.rect} radius={frameR} zoom={b.zoom} />
      {showIhs ? <RimPath d={ihsRim} zoom={b.zoom} /> : null}
      <Lines>
        {showIhs ? (
          <Stroke d={ihsD} zoom={b.zoom} color={edgeCol} width={STROKE.detail} />
        ) : (
          <Stroke d={rectD(dieR, 2 * k)} zoom={b.zoom} color={edgeCol} width={STROKE.detail} />
        )}
        {p.cooler === 'ghost' ? (
          <Stroke
            d={discD(b.x + b.w / 2, b.y + b.h / 2, ghostR)}
            zoom={b.zoom}
            color={COLOR.annotation}
            width={STROKE.detail}
            opacity={0.5}
            dash={STROKE.analogyDash}
          />
        ) : null}
      </Lines>
      <Glow d={frameD} zoom={b.zoom} alpha={b.glow} />
      <Outline d={frameD} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const cpuLgaSpec: IconSpec<CpuLgaProps> = {
  type: 'cpuLga',
  component: CpuLga,
  size: {w: W0, h: H0},
  z: 10,
  passive: false,
  ports: (p) => ({
    ...basePorts(p, false),
    dmiOut: [p.x + p.w / 2, p.y + p.h],
    memRight: [p.x + p.w, p.y + p.h * 0.3],
    tagLeft: [p.x, p.y + p.h * 0.22],
    tagLeft2: [p.x, p.y + p.h * 0.52],
    bitAnchor: [p.x + p.w / 2, p.y + p.h / 2],
  }),
};
