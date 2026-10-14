/**
 * `battery` (ICONS.md §4.20): a laptop battery pack (220 × 120, z 10): three pouch cells (the active region) and the
 * terminal connector. Unfilled in Ep01: energy is drawn by the engine's channels, not by icons.
 * Detail: the cells' tab welds and the pack's sense wire. Ports: `terminal`.
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
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const batteryGeometry = (p: {x: number; y: number; w: number; h: number}) => {
  const kx = p.w / 220;
  const ky = p.h / 120;
  const k = Math.min(kx, ky);
  const pack: Rect = {x: p.x, y: p.y, w: p.w - 12 * kx, h: p.h};
  const tab: Rect = {x: p.x + p.w - 13 * kx, y: p.y + p.h / 2 - 17 * ky, w: 13 * kx, h: 34 * ky};
  const cellW = (pack.w - 24 * kx) / 3;
  const cells: Rect[] = [0, 1, 2].map((i) => ({x: pack.x + 9 * kx + i * (cellW + 3 * kx), y: pack.y + 9 * ky, w: cellW, h: pack.h - 18 * ky}));
  return {k, kx, ky, pack, tab, cells};
};

export const Battery: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const g = batteryGeometry(b.rect);
  const {k, kx, ky, pack, tab, cells} = g;
  const r = Math.min(10 * k, pack.w / 4);
  const d = rectD(pack, r);
  const tabD = rectD(tab, 2.5 * k);
  const cellsD = cells.map((c) => rectD(c, 6 * k)).join('');
  let contacts = '';
  for (let i = 0; i < 4; i++) {
    const y = tab.y + 7 * ky + i * ((tab.h - 14 * ky) / 3);
    contacts += lineD(tab.x + 4 * kx, y, tab.x + tab.w - 3 * kx, y);
  }
  return (
    <Shell b={b}>
      <Raised d={tabD} hull={raisedHullPath(tab, 2.5 * k, b.sideK(0.5))} />
      <Raised d={d} hull={raisedHullPath(pack, r, b.side)} />
      <TopFace d={tabD} fill={COLOR.bodyLo} />
      <TopFace d={d} fill={b.act(COLOR.body)} />
      <StateHatch b={b} clipD={d} rect={pack} />
      <TopFace d={cellsD} fill={b.act(COLOR.bodyLo)} />
      <Lines>
        <Stroke d={cellsD} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} />
        <Stroke d={contacts} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} cap="butt" />
      </Lines>
      <DetailGroup b={b}>
        {/* tab welds at each cell's terminal end and the pack's sense wire */}
        <Detail d={cells.map((c) => rectD({x: c.x + c.w * 0.3, y: c.y + 6 * ky, w: c.w * 0.4, h: 5 * ky}, 1)).join('')} zoom={b.zoom} fill />
        <Detail d={lineD(pack.x + 12 * kx, pack.y + pack.h - 5 * ky, pack.x + pack.w - 8 * kx, pack.y + pack.h - 5 * ky)} zoom={b.zoom} opacity={0.7} />
      </DetailGroup>
      <RimLight rect={pack} radius={r} zoom={b.zoom} />
      <Lines>
        <Stroke d={tabD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={pack} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const batterySpec: IconSpec<IconBaseProps> = {
  type: 'battery',
  component: Battery,
  size: {w: 220, h: 120},
  z: 10,
  passive: false,
  ports: (p): Ports => {
    const g = batteryGeometry(p);
    return {...basePorts(p, false), terminal: [g.tab.x + g.tab.w, g.tab.y + g.tab.h / 2]};
  },
};
