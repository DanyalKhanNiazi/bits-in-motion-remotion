/**
 * `iecPlug` (ICONS.md §4.15): the IEC C13 cord connector, side elevation, cord exit on the left.
 * Base: strain relief, grip body (bodyLo, r 6) and the narrower front nose that enters the inlet. `seated` 1 = fully
 * in the inlet; 0 = pulled out 40 px left and 16 px down, with its three socket holes on the face AND the inlet's three
 * pins (2 px structure) visible as base features: the pulled plug is the cause in S10's band.
 * Detail: grip ribs. Passive.
 * The inlet's pins are drawn here (under the plug body), at the plug's seated face, so they are hidden while seated
 * and revealed as the plug leaves — whatever the parts' draw order.
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
  clamp01,
  fx,
  lineD,
  polyD,
  rectD,
  resolveBase,
  sweptPath,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

export interface IecPlugProps extends IconBaseProps {
  /** 1 = seated in the inlet (default); 0 = pulled out 40 px left and 16 px down. */
  seated?: number;
  /** Round 3: where a fully pulled plug ends up (world px from its seated place; default [-40, 16]). A compact band
   *  scene drops it down and away instead, so it never runs into the wall socket. */
  pull?: Pt;
}

/** World offset of the plug body for a seated value. */
export const plugOffset = (seated: number | undefined, pull?: Pt): Pt => {
  const s = clamp01(seated ?? 1);
  const [px, py] = pull ?? [-40, 16];
  return [px * (1 - s), py * (1 - s)];
};

const W0 = 36;

export const plugShape = (x: number, y: number, w: number, h: number) => {
  const k = Math.min(w, h) / W0;
  const X = (u: number) => x + u * (w / W0);
  const Y = (v: number) => y + v * (h / W0);
  const grip: Rect = {x: X(7), y: Y(0), w: 21 * (w / W0), h: h};
  const nose: Rect = {x: X(27), y: Y(5), w: 9 * (w / W0), h: 26 * (h / W0)};
  const relief = polyD([
    [X(0), Y(13)],
    [X(7.5), Y(10.5)],
    [X(7.5), Y(25.5)],
    [X(0), Y(23)],
  ]);
  // union silhouette (grip + nose) as one path for the outline
  const r = fx(6 * k);
  const r2 = fx(2.5 * k);
  const R6 = 6 * k;
  const R2 = 2.5 * k;
  const sil =
    `M${fx(grip.x + R6)} ${fx(grip.y)}H${fx(grip.x + grip.w - R6)}A${r} ${r} 0 0 1 ${fx(grip.x + grip.w)} ${fx(grip.y + R6)}` +
    `V${fx(nose.y)}H${fx(nose.x + nose.w - R2)}A${r2} ${r2} 0 0 1 ${fx(nose.x + nose.w)} ${fx(nose.y + R2)}` +
    `V${fx(nose.y + nose.h - R2)}A${r2} ${r2} 0 0 1 ${fx(nose.x + nose.w - R2)} ${fx(nose.y + nose.h)}H${fx(grip.x + grip.w)}` +
    `V${fx(grip.y + grip.h - R6)}A${r} ${r} 0 0 1 ${fx(grip.x + grip.w - R6)} ${fx(grip.y + grip.h)}H${fx(grip.x + R6)}` +
    `A${r} ${r} 0 0 1 ${fx(grip.x)} ${fx(grip.y + grip.h - R6)}V${fx(grip.y + R6)}A${r} ${r} 0 0 1 ${fx(grip.x + R6)} ${fx(grip.y)}Z`;
  const sockets: Pt[] = [Y(11), Y(18), Y(25)].map((yy) => [nose.x + nose.w, yy] as Pt);
  return {k, X, Y, grip, nose, relief, sil, sockets};
};

export const IecPlug: React.FC<IecPlugProps> = (p) => {
  const b = resolveBase(p, true);
  const seated = clamp01(p.seated ?? 1);
  const [ox, oy] = plugOffset(seated, p.pull);
  const s0 = plugShape(b.x, b.y, b.w, b.h); // seated geometry (inlet pins live here)
  const s = plugShape(b.x + ox, b.y + oy, b.w, b.h);
  const k = s.k;
  // inlet pins: three 2 px structure blades sticking out of the inlet mouth (at the seated face)
  const face = s0.nose.x + s0.nose.w;
  const pinLen = 14 * k;
  const pins = s0.sockets.map(([, yy]) => lineD(face + 1 * k, yy, face - pinLen, yy)).join('');
  const out = 1 - seated;
  const ribs = [11.5, 15.5, 19.5, 23.5].map((u) => lineD(s.X(u), s.Y(7), s.X(u), s.Y(29))).join('');
  const socketD = s.sockets.map(([sx, sy]) => rectD({x: sx - 5 * k, y: sy - 1.8 * k, w: 5 * k, h: 3.6 * k}, 0.8 * k)).join('');
  const rect: Rect = {x: s.grip.x, y: s.grip.y, w: s.grip.w, h: s.grip.h};
  return (
    <Shell b={b}>
      {/* the inlet's pins first: hidden under the seated plug, revealed as it leaves */}
      <Lines>
        <Stroke d={pins} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} cap="butt" />
      </Lines>
      <Raised d={s.sil} side={b.side} />
      <Raised d={s.relief} hull={sweptPath(s.relief, b.side)} />
      <TopFace d={s.relief} fill={COLOR.bodyLo} />
      <TopFace d={s.sil} fill={COLOR.bodyLo} />
      <TopFace d={rectD(s.nose, 2.5 * k)} fill={COLOR.body} />
      {out > 0.001 ? (
        <Lines>
          <g opacity={clamp01(out * 3)}>
            <TopFace d={socketD} fill={COLOR.side} />
            <Stroke d={socketD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
          </g>
        </Lines>
      ) : null}
      <DetailGroup b={b}>
        <Detail d={ribs} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={rect} radius={6 * k} zoom={b.zoom} />
      <Lines>
        <Stroke d={s.relief} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      </Lines>
      <Glow d={s.sil} zoom={b.zoom} alpha={b.glow} />
      <Outline d={s.sil} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const iecPlugPorts = (p: IecPlugProps): Ports => {
  const [ox, oy] = plugOffset(p.seated, p.pull);
  const s = plugShape(p.x + ox, p.y + oy, p.w, p.h);
  const ports = basePorts({...p, x: p.x + ox, y: p.y + oy}, true);
  return {
    ...ports,
    cord: [s.X(0), s.Y(18)],
    face: [s.nose.x + s.nose.w, s.Y(18)],
    /** The inlet's face (fixed: where the seated plug's nose ends). */
    inletFace: [p.x + p.w, p.y + p.h / 2],
  };
};

export const iecPlugSpec: IconSpec<IecPlugProps> = {
  type: 'iecPlug',
  component: IecPlug,
  size: {w: 36, h: 36},
  z: 8,
  passive: true,
  ports: iecPlugPorts,
};
