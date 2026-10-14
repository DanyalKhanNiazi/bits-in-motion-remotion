/**
 * `wallSocket` (ICONS.md §4.16): a wall outlet (duplex NEMA 5-15, face-on; round 2). Passive.
 * Base: the wall plate (body, r 8) with its 2.5D side; the raised receptacle face (bodyLo) with two vertical slots
 * (the neutral taller) and the D-shaped ground hole as dark recesses.
 * `plugged` (default true: the Ep01 PC is plugged in at the wall): the 5-15P plug sits in the receptacle (raised body,
 * grip ribs at detail, the cord boss) and the cord leaves it toward the plate's right edge (port `face`), where the
 * `cord` part continues — so the cable reads as one object from the wall to the power supply.
 * Detail: the plate's two screws, the plug's grip ribs.
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
  RimArc,
  RimLight,
  Shell,
  Stroke,
  TopFace,
  basePorts,
  discD,
  discHullPath,
  fx,
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  sw,
  useIconEnv,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec} from '../types';

export interface WallSocketProps extends IconBaseProps {
  /** The PC's plug is in the outlet (default true). false = the bare receptacle face. */
  plugged?: boolean;
}

const CordStub: React.FC<{d: string; t: number; zoom: number}> = ({d, t, zoom}) => {
  const {fillsOnly} = useIconEnv();
  const edge = sw(STROKE.detail, zoom);
  return (
    <>
      {!fillsOnly ? <path d={d} fill="none" stroke={COLOR.structure} strokeWidth={t} strokeLinecap="butt" strokeLinejoin="round" /> : null}
      <path d={d} fill="none" stroke={COLOR.side} strokeWidth={fillsOnly ? t : Math.max(t - 2 * edge, t * 0.2)} strokeLinecap="butt" strokeLinejoin="round" />
    </>
  );
};

/** Round 2 (judges: the plugged single outlet read as concentric squares, not a wall outlet): a DUPLEX outlet, the
 *  universal outlet silhouette. Design space 64 × 104: the upper receptacle holds the PC's plug (its cord leaves at
 *  y 46, port `face`); the lower one is empty and shows the two slots and the D-shaped ground hole. */
const H0 = 104;
export const WALL_SOCKET_CORD_Y = 46 / H0;

export const WallSocket: React.FC<WallSocketProps> = (p) => {
  const b = resolveBase(p, true);
  const plugged = p.plugged !== false;
  const k = Math.min(b.w / 64, b.h / H0);
  const X = (u: number) => b.x + u * (b.w / 64);
  const Y = (v: number) => b.y + v * (b.h / H0);
  const r = Math.min(8 * k, b.w / 4);
  const d = rectD(b.rect, r);
  const faceA: Rect = {x: X(14), y: Y(30), w: 36 * k, h: 32 * k};
  const faceB: Rect = {x: X(14), y: Y(68), w: 36 * k, h: 30 * k};
  const faceAD = rectD(faceA, 8 * k);
  const faceBD = rectD(faceB, 8 * k);
  const holesOf = (top: number) => {
    const slotL = {x: X(22.6), y: Y(top + 4), w: 4.2 * k, h: 11.5 * k};
    const slotR = {x: X(37.2), y: Y(top + 4), w: 4.2 * k, h: 9.5 * k};
    const gx = X(32);
    const gy = Y(top + 21);
    const gr = 3.8 * k;
    const ground = `M${fx(gx - gr)} ${fx(gy)}H${fx(gx + gr)}V${fx(gy + 1 * k)}A${fx(gr)} ${fx(gr)} 0 0 1 ${fx(gx - gr)} ${fx(gy + 1 * k)}Z`;
    return rectD(slotL, 1.2 * k) + rectD(slotR, 1.2 * k) + ground;
  };
  // the PC's plug (5-15P seen from behind) in the upper receptacle, its cord leaving to the right edge
  const plug: Rect = {x: X(17), y: Y(32), w: 30 * k, h: 28 * k};
  const plugD = rectD(plug, 7 * k);
  const boss = {cx: X(32), cy: Y(46), r: 6.5 * k};
  const cordD = `M${fx(boss.cx)} ${fx(boss.cy)}H${fx(b.x + b.w)}`;
  const ribs = [plug.x + 4 * k, plug.x + plug.w - 4 * k].map((x) => lineD(x, plug.y + 8 * k, x, plug.y + plug.h - 8 * k)).join('');
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.body} />
      <Raised d={faceAD} hull={raisedHullPath(faceA, 8 * k, b.sideK(0.3))} />
      <TopFace d={faceAD} fill={COLOR.bodyLo} />
      <Raised d={faceBD} hull={raisedHullPath(faceB, 8 * k, b.sideK(0.3))} />
      <TopFace d={faceBD} fill={COLOR.bodyLo} />
      {/* the empty receptacle's slots and ground hole: base identity (they make it an outlet at any size) */}
      <TopFace d={holesOf(68)} fill={COLOR.side} />
      {plugged ? (
        <>
          <Raised d={plugD} hull={raisedHullPath(plug, 7 * k, b.sideK(0.9))} />
          <TopFace d={plugD} fill={COLOR.bodyLo} />
        </>
      ) : (
        <TopFace d={holesOf(30)} fill={COLOR.side} />
      )}
      <DetailGroup b={b}>
        <Detail d={discD(X(32), Y(65), 2.2 * k)} zoom={b.zoom} />
        {plugged ? <Detail d={ribs} zoom={b.zoom} /> : null}
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <RimLight rect={faceB} radius={8 * k} zoom={b.zoom} inset={b.s(2)} />
      {plugged ? <RimLight rect={plug} radius={7 * k} zoom={b.zoom} inset={b.s(2)} /> : <RimLight rect={faceA} radius={8 * k} zoom={b.zoom} inset={b.s(2)} />}
      <Lines>
        <Stroke d={faceAD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} opacity={plugged ? 0.6 : 1} />
        <Stroke d={faceBD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        {plugged ? <Stroke d={plugD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} /> : null}
      </Lines>
      {plugged ? (
        <>
          <CordStub d={cordD} t={8} zoom={b.zoom} />
          <Raised d={discD(boss.cx, boss.cy, boss.r)} hull={discHullPath(boss.cx, boss.cy, boss.r, b.sideK(0.5))} />
          <TopFace d={discD(boss.cx, boss.cy, boss.r)} fill={COLOR.bodyHi} />
          <RimArc cx={boss.cx} cy={boss.cy} r={boss.r} zoom={b.zoom} inset={b.s(2)} />
          <Lines>
            <Stroke d={discD(boss.cx, boss.cy, boss.r)} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
          </Lines>
        </>
      ) : null}
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const wallSocketSpec: IconSpec<WallSocketProps> = {
  type: 'wallSocket',
  component: WallSocket,
  size: {w: 64, h: 104},
  z: 6,
  passive: true,
  ports: (p) => ({...basePorts(p, true), face: [p.x + p.w, p.y + p.h * WALL_SOCKET_CORD_Y]}),
};
