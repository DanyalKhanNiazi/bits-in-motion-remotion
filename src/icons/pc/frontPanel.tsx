/**
 * `frontPanel` (ICONS.md §4.17): the case front I/O strip (140 × 116, z 14). Passive.
 * Base: the panel (body, r 10) with its 2.5D side and rim; the button's machined recess and the LED's lens seat at the
 * docking points (the button and LED are their own parts, drawn on top).
 * Base also: two USB-A ports (recess + tongue). Detail: the ports' rims and two audio jacks.
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
  discD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

export interface FrontPanelProps extends IconBaseProps {
  /** Docking points (relative 0..1). Defaults: the Ep01 button (1010, 866) and LED (1060, 818). */
  buttonDock?: Pt;
  ledDock?: Pt;
  /** Button bezel radius in world px (default 36) for the recess. */
  buttonR?: number;
}

const BTN: Pt = [70 / 140, 66 / 116];
const LED: Pt = [120 / 140, 18 / 116];

export const FrontPanel: React.FC<FrontPanelProps> = (p) => {
  const b = resolveBase(p, true);
  const k = Math.min(b.w / 140, b.h / 116);
  const r = Math.min(10 * k, b.w / 4);
  const d = rectD(b.rect, r);
  const bd = p.buttonDock ?? BTN;
  const ld = p.ledDock ?? LED;
  const bx = b.x + bd[0] * b.w;
  const by = b.y + bd[1] * b.h;
  const lx = b.x + ld[0] * b.w;
  const ly = b.y + ld[1] * b.h;
  const br = (p.buttonR ?? 36) + 3.5;
  const X = (u: number) => b.x + u * (b.w / 140);
  const Y = (v: number) => b.y + v * (b.h / 116);
  const usb: Rect[] = [
    {x: X(12), y: Y(10), w: 26 * k, h: 10 * k},
    {x: X(46), y: Y(10), w: 26 * k, h: 10 * k},
  ];
  const depth = b.sideK(0.18);
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.body} />
      {/* button recess and LED seat */}
      <TopFace d={discD(bx, by, br)} fill={COLOR.side} />
      <TopFace d={discD(lx, ly, 7.5 * k)} fill={COLOR.side} />
      {/* the two USB-A ports are base: they make the strip read as a case front at system size */}
      {usb.map((u, i) => (
        <g key={i}>
          <TopFace d={rectD(u, 1.5 * k)} fill={COLOR.side} />
          <TopFace d={rectD({x: u.x + depth[0], y: u.y + depth[1], w: u.w - depth[0], h: u.h - depth[1]}, 1.2 * k)} fill={COLOR.deck} />
          <TopFace d={rectD({x: u.x + 4 * k, y: u.y + 2.2 * k, w: u.w - 8 * k, h: 2.8 * k}, 0.6 * k)} fill={COLOR.bodyHi} />
        </g>
      ))}
      <DetailGroup b={b}>
        <Detail d={usb.map((u) => rectD(u, 1.5 * k)).join('')} zoom={b.zoom} />
        {[X(12), X(26)].map((ax, i) => (
          <g key={`a${i}`}>
            <TopFace d={discD(ax, Y(102), 4.4 * k)} fill={COLOR.bodyLo} />
            <TopFace d={discD(ax, Y(102), 2.2 * k)} fill={COLOR.side} />
            <Detail d={discD(ax, Y(102), 4.4 * k)} zoom={b.zoom} />
          </g>
        ))}
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <Lines>
        <Stroke d={discD(bx, by, br)} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const frontPanelPorts = (p: FrontPanelProps): Ports => {
  const bd = p.buttonDock ?? BTN;
  const ld = p.ledDock ?? LED;
  return {
    ...basePorts(p, true),
    buttonDock: [p.x + bd[0] * p.w, p.y + bd[1] * p.h],
    ledDock: [p.x + ld[0] * p.w, p.y + ld[1] * p.h],
  };
};

export const frontPanelSpec: IconSpec<FrontPanelProps> = {
  type: 'frontPanel',
  component: FrontPanel,
  size: {w: 140, h: 116},
  z: 14,
  passive: true,
  ports: frontPanelPorts,
};
