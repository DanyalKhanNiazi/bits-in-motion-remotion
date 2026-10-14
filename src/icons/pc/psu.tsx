/**
 * `psu` (ICONS.md §4.14): ATX power supply, side elevation, rear face on the left.
 * Base: the box (body, r 10, box-height 2.5D side); on the rear face (left) the IEC C14 inlet housing (20 × 42) with
 * its mouth, and the rocker (26 × 50) with its I bar and O ring as 3 px annotation paths (meaning in S10: never
 * detail); the fan opening (r 44) as a recess with its seven curved blades (2 px `detail`: base, because the PSU's
 * shorter side keeps `detail` near 0 at most Ep01 zooms and a bare ring reads as a disc) and hub; the cable-exit
 * grommet on the top edge.
 * Detail: the fan frame and grille rings, five vent slots, the inlet's mounting screws.
 * The rocker's pressed half sits 3 px lower and its mark steps to textMuted. State: the outline stays `off` in soft-off.
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
  RimArc,
  RimLight,
  RimPath,
  Shell,
  StateHatch,
  Stroke,
  TopFace,
  basePorts,
  clamp01,
  discD,
  discHullPath,
  ease,
  fx,
  lineD,
  mix,
  polar,
  raisedHullPath,
  rectD,
  resolveBase,
  rimRectD,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export type RockerPos = 'I' | 'O';
export interface PsuProps extends IconBaseProps {
  /** Rear switch: 'I' (on) | 'O' | a 3-frame flip. Default 'I' (soft-off: plugged in, switch on). */
  rocker?: RockerPos | {from: RockerPos; to: RockerPos; at: number};
  /** Reserved: a spinning fan comes with main power (after the intro). */
  fanSpin?: 0;
  /** Round 3 (judges: every triptych band cut the power supply through its fan): 'short' draws a recomposed scene's
   *  shortened box, a schematic shortening like a shortened route: the rear face (inlet, rocker), the fan and the cable
   *  exit at their true proportions (uniform scale from the height), the plain body cut short after them. */
  length?: 'full' | 'short' | number;
}

/** Round 4: the shortening as a number, 0 = the full box, 1 = 'short'. A number in between is the S10 triptych's
 *  carry, the world's supply shortening into the band's (uniform scale from the height; the rect's width is the body). */
export const psuShorten = (length: PsuProps['length']): number => (length === 'short' ? 1 : typeof length === 'number' ? clamp01(length) : 0);
const lerpN = (a: number, b: number, t: number): number => a + (b - a) * t;

const W0 = 480;
const H0 = 116;
/** Fill of the rocker's pressed half: body sunk most of the way toward the side tone. Round 2 (judges: the I and O
 *  states differed by a slightly brighter mark): a strong dark/light paddle, the raised half lit. */
const PRESSED = mix(COLOR.body, COLOR.side, 0.85);
const RAISED = mix(COLOR.bodyHi, COLOR.rim, 0.28);

/** 1 when the I half is pressed (switch at I), through a 3-frame flip. */
export const rockerI = (r: PsuProps['rocker'], frame: number): number => {
  if (r === undefined) return 1;
  if (typeof r === 'string') return r === 'I' ? 1 : 0;
  const a = r.from === 'I' ? 1 : 0;
  const b = r.to === 'I' ? 1 : 0;
  const t = ease('arrive')(clamp01((frame - r.at) / 3));
  return a + (b - a) * t;
};

export const psuGeometry = (r: {x: number; y: number; w: number; h: number}, length: PsuProps['length'] = 'full') => {
  const m = psuShorten(length);
  const ky = r.h / H0;
  const kx = length === 'short' || typeof length === 'number' ? ky : r.w / W0;
  const k = Math.min(kx, ky);
  const X = (u: number) => r.x + u * kx;
  const Y = (v: number) => r.y + v * ky;
  const R = (u: number, v: number, w: number, h: number): Rect => ({x: X(u), y: Y(v), w: w * kx, h: h * ky});
  return {
    kx,
    ky,
    k,
    X,
    Y,
    R,
    inlet: R(-20, 15, 20, 42),
    rocker: R(-26, 62, 26, 50),
    fan: {cx: X(80), cy: Y(58), r: 44 * k},
    grommet: R(lerpN(240, 118, m), -5, lerpN(96, 40, m), 12),
    /** Round 4: 0 = full, 1 = short (a number morphs). */
    shorten: m,
    /** The body's length in design units (480 full; shorter for 'short'). */
    span: r.w / kx,
  };
};

export const Psu: React.FC<PsuProps> = (p) => {
  const b = resolveBase(p, false);
  const g = psuGeometry(b.rect, p.length);
  const short = g.shorten >= 0.999;
  const morphing = g.shorten > 0.001 && !short;
  const {k, X, Y, R} = g;
  const r = Math.min(10 * k, b.w / 4, b.h / 4);
  const boxD = rectD(b.rect, r);

  // inlet housing (protrudes from the rear face), mouth on its left face
  const inlet = g.inlet;
  const inletD = rectD(inlet, 3 * k);
  const mouth = R(-20, 21, 5.5, 30);

  // rocker: bezel, dark well, two halves
  const rk = g.rocker;
  const rkD = rectD(rk, 4 * k);
  const well = R(-23, 65, 20, 44);
  const pI = rockerI(p.rocker, b.frame);
  const halfH = 21.5 * g.ky;
  const drop = b.s(3);
  const halves = [
    {key: 'I', rect: {x: well.x, y: well.y, w: well.w, h: halfH} as Rect, pressed: pI},
    {key: 'O', rect: {x: well.x, y: well.y + well.h - halfH, w: well.w, h: halfH} as Rect, pressed: 1 - pI},
  ];

  // fan recess: dark opening, floor (bodyLo) shifted toward the bottom-right, hub, blades
  const fan = g.fan;
  const depth = b.sideK(0.32);
  const fcx = fan.cx + depth[0];
  const fcy = fan.cy + depth[1];
  const clipId = `${b.id}-fan`;
  const blades: string[] = [];
  for (let i = 0; i < 7; i++) {
    const a0 = -90 + (360 / 7) * i;
    const p0 = polar(fcx, fcy, 11 * k, a0);
    const p1 = polar(fcx, fcy, 38 * k, a0 + 38);
    const c = polar(fcx, fcy, 30 * k, a0 - 4);
    blades.push(`M${fx(p0[0])} ${fx(p0[1])}Q${fx(c[0])} ${fx(c[1])} ${fx(p1[0])} ${fx(p1[1])}`);
  }
  // vents
  // round 4: while the supply shortens (the triptych's carry) its vents fade out over the first half and the body's
  // far screws ride its end
  const ventOp = 1 - clamp01(2 * g.shorten);
  const vents: Rect[] = short || ventOp <= 0.01 ? [] : [0, 1, 2, 3, 4].map((i) => R(138 + i * 12, 38, 6, 40));
  const screws: Array<[number, number]> = [
    ...(g.shorten < 0.5 ? [[X(140), Y(104)] as [number, number]] : []),
    [X(g.span - 12), Y(12)],
    [X(g.span - 12), Y(104)],
  ];
  // grommet
  const grom = g.grommet;
  const gromSlot = R(lerpN(247, 122, g.shorten), -1.5, lerpN(82, 32, g.shorten), 5);

  return (
    <Shell b={b}>
      {/* sides: box, inlet housing, rocker bezel */}
      <Raised d={boxD} hull={raisedHullPath(b.rect, r, b.side)} />
      <Raised d={inletD} hull={raisedHullPath(inlet, 3 * k, b.sideK(0.45))} />
      <Raised d={rkD} hull={raisedHullPath(rk, 4 * k, b.sideK(0.45))} />
      {/* top faces */}
      <TopFace d={boxD} fill={b.act(COLOR.body)} />
      <StateHatch b={b} clipD={boxD} />
      <TopFace d={inletD} fill={COLOR.bodyLo} />
      <TopFace d={rectD(mouth, 1.5 * k)} fill={COLOR.side} />
      <TopFace d={rkD} fill={COLOR.bodyLo} />
      <TopFace d={rectD(well, 2 * k)} fill={COLOR.side} />
      {halves.map((hf) => {
        const pr = hf.pressed;
        const rr = {x: hf.rect.x, y: hf.rect.y + drop * pr, w: hf.rect.w, h: hf.rect.h - drop * pr};
        // the pressed half sinks into shadow: a strong two-tone flip that still reads at phone size
        return <TopFace key={hf.key} d={rectD(rr, 2 * k)} fill={mix(RAISED, PRESSED, pr)} />;
      })}
      {/* fan opening */}
      <TopFace d={discD(fan.cx, fan.cy, fan.r)} fill={COLOR.side} />
      <defs>
        <clipPath id={clipId}>
          <path d={discD(fan.cx, fan.cy, fan.r)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <TopFace d={discD(fcx, fcy, fan.r)} fill={COLOR.bodyLo} />
      </g>
      {/* grommet */}
      <TopFace d={rectD(grom, 6 * k)} fill={COLOR.bodyLo} />
      <TopFace d={rectD(gromSlot, 2.5 * k)} fill={COLOR.side} />

      {/* blades are base (a plain ring reads as a disc, not a fan, at system size) */}
      <Lines>
        <g clipPath={`url(#${clipId})`}>
          <Stroke d={blades.join('')} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
        </g>
      </Lines>
      {/* shell screws at the corners (base: they make the box read as a machined metal case) */}
      <Lines>
        <Stroke d={screws.map(([sx, sy]) => discD(sx, sy, 3.2 * k)).join('')} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
      </Lines>
      <DetailGroup b={b}>
        <Detail d={screws.map(([sx, sy]) => lineD(sx - 1.8 * k, sy - 1.8 * k, sx + 1.8 * k, sy + 1.8 * k) + lineD(sx - 1.8 * k, sy + 1.8 * k, sx + 1.8 * k, sy - 1.8 * k)).join('')} zoom={b.zoom} />
        {/* the shell's fold seam below the top edge */}
        <Detail d={lineD(X(132), Y(9), X(g.span - 8), Y(9))} zoom={b.zoom} opacity={0.6} />
        <g clipPath={`url(#${clipId})`}>
          <Detail d={discD(fcx, fcy, 40 * k)} zoom={b.zoom} />
          <Detail d={discD(fcx, fcy, 25 * k)} zoom={b.zoom} opacity={0.6} />
        </g>
        {vents.map((v, i) => (
          <g key={i} opacity={morphing ? ventOp : undefined}>
            <TopFace d={rectD(v, 3 * k)} fill={COLOR.side} />
            <TopFace d={rectD({x: v.x + depth[0] * 0.5, y: v.y + depth[1] * 0.8, w: v.w - depth[0] * 0.5, h: v.h - depth[1] * 0.8}, 2.5 * k)} fill={COLOR.deck} />
          </g>
        ))}
        <Detail d={discD(X(-10), Y(18.5), 1.6 * k) + discD(X(-10), Y(53.5), 1.6 * k)} zoom={b.zoom} fill />
      </DetailGroup>

      {/* hub (base identity) */}
      <Raised d={discD(fcx, fcy, 10 * k)} hull={discHullPath(fcx, fcy, 10 * k, b.sideK(0.12))} />
      <TopFace d={discD(fcx, fcy, 10 * k)} fill={COLOR.bodyHi} />
      {/* rim lights: box, rocker raised half, hub, inlet */}
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <RimLight rect={inlet} radius={3 * k} zoom={b.zoom} inset={b.s(2)} />
      {halves.map((hf) =>
        hf.pressed < 0.999 ? (
          <RimPath
            key={hf.key}
            d={rimRectD({x: hf.rect.x, y: hf.rect.y + drop * hf.pressed, w: hf.rect.w, h: hf.rect.h}, 2 * k, b.s(1.5))}
            zoom={b.zoom}
            opacity={1 - hf.pressed}
          />
        ) : null,
      )}
      <RimArc cx={fcx} cy={fcy} r={10 * k} zoom={b.zoom} inset={b.s(2)} />

      <Lines>
        {/* identity edges: fan opening, hub, inlet, rocker bezel, grommet */}
        <Stroke d={discD(fan.cx, fan.cy, fan.r)} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        <Stroke d={discD(fcx, fcy, 10 * k)} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        <Stroke d={inletD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        <Stroke d={rkD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        <Stroke d={rectD(grom, 6 * k)} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        {/* rocker marks: I bar (top half), O ring (bottom half), 3 px. The pressed half is the switch's state, so its mark
            reads brightest (ink) and the other steps down to structure: a flip I -> O swaps which mark lights (style6
            build: the earlier annotation/textMuted pair differed too little to read as a cause in a 560 px band). */}
        {halves.map((hf) => {
          const cx = hf.rect.x + hf.rect.w / 2;
          const cy = hf.rect.y + hf.rect.h / 2 + drop * hf.pressed;
          const col = mix(COLOR.structure, COLOR.ink, hf.pressed);
          const markH = 11 * g.ky;
          const d = hf.key === 'I' ? lineD(cx, cy - markH / 2, cx, cy + markH / 2) : discD(cx, cy, 4.6 * k);
          return <Stroke key={hf.key} d={d} zoom={b.zoom} color={col} width={3} cap="round" />;
        })}
      </Lines>
      <Glow d={boxD} zoom={b.zoom} alpha={b.glow} />
      <Outline d={boxD} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const psuPorts = (p: PsuProps): Ports => {
  const g = psuGeometry(p, p.length);
  const ns = {x: g.X(206), y: g.Y(14)};
  const m = g.shorten;
  return {
    ...basePorts(p, false),
    inlet: [g.inlet.x + g.inlet.w / 2, g.inlet.y + g.inlet.h / 2],
    inletFace: [g.inlet.x, g.inlet.y + g.inlet.h / 2],
    rocker: [g.rocker.x + g.rocker.w / 2, g.rocker.y + g.rocker.h / 2],
    standbyOut: [g.X(lerpN(276, 138, m)), p.y],
    mainOut: [g.X(lerpN(330, 150, m)), p.y],
    fan: [g.fan.cx, g.fan.cy],
    nameSlot: [ns.x, ns.y],
    nameSlotEnd: [g.X(420), g.Y(102)],
    pillSlot: [g.X(300), g.Y(66)],
    pillSlotEnd: [g.X(470), g.Y(108)],
  };
};

export const psuSpec: IconSpec<PsuProps> = {
  type: 'psu',
  component: Psu,
  size: {w: W0, h: H0},
  z: 22,
  passive: false,
  ports: psuPorts,
};
