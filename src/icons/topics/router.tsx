/**
 * `router` (ICONS.md §6, Ep02 Wi-Fi; round 2 seed): a Wi-Fi router seen from above (320 × 90, z tall).
 * Base: the shell (bodyHi, r 14) with its 2.5D side; three antennas hinged on the rear edge (rounded rods standing
 * proud, bodyLo); the front light strip (a recessed bar). Detail: vent slots across the lid, the hinge pins.
 * Active region: the shell (powered). Ports: `ant0`–`ant2` (antenna tips), `rf` (the radio's place under the lid),
 * `front`, `center`.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {Detail, DetailGroup, Glow, Lines, Outline, Pip, Raised, RimLight, Shell, StateHatch, Stroke, TopFace, basePorts, discD, raisedHullPath, rectD, resolveBase, type Rect} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

const geom = (r: {x: number; y: number; w: number; h: number}) => {
  const kx = r.w / 320;
  const ky = r.h / 90;
  const k = Math.min(kx, ky);
  const shell: Rect = {x: r.x, y: r.y + 30 * ky, w: r.w, h: 60 * ky};
  const ants: Rect[] = [52, 160, 268].map((u) => ({x: r.x + (u - 6) * kx, y: r.y, w: 12 * kx, h: 40 * ky}));
  const strip: Rect = {x: r.x + 40 * kx, y: r.y + 74 * ky, w: 240 * kx, h: 6 * ky};
  return {kx, ky, k, shell, ants, strip};
};

export const Router: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const g = geom(b.rect);
  const {k, kx, ky} = g;
  const r = Math.min(14 * k, g.shell.h / 3);
  const d = rectD(g.shell, r);
  const antD = g.ants.map((a) => rectD(a, a.w / 2)).join('');
  let vents = '';
  for (let i = 0; i < 9; i++) vents += rectD({x: b.x + (70 + i * 20) * kx, y: b.y + 44 * ky, w: 8 * kx, h: 18 * ky}, 2 * k);
  return (
    <Shell b={b}>
      {g.ants.map((a, i) => (
        <Raised key={i} d={rectD(a, a.w / 2)} hull={raisedHullPath(a, a.w / 2, b.sideK(0.5))} />
      ))}
      <TopFace d={antD} fill={COLOR.bodyLo} />
      <Raised d={d} hull={raisedHullPath(g.shell, r, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.bodyHi)} />
      <StateHatch b={b} clipD={d} rect={g.shell} />
      <TopFace d={rectD(g.strip, 3 * k)} fill={COLOR.side} />
      <DetailGroup b={b}>
        <Detail d={vents} zoom={b.zoom} />
        <Detail d={g.ants.map((a) => discD(a.x + a.w / 2, a.y + a.h - 6 * ky, 2.4 * k)).join('')} zoom={b.zoom} fill />
      </DetailGroup>
      <RimLight rect={g.shell} radius={r} zoom={b.zoom} />
      <Lines>
        <Stroke d={antD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={g.shell} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const routerPorts = (p: IconBaseProps): Ports => {
  const g = geom(p);
  return {
    ...basePorts(p, false),
    ant0: [g.ants[0].x + g.ants[0].w / 2, g.ants[0].y],
    ant1: [g.ants[1].x + g.ants[1].w / 2, g.ants[1].y],
    ant2: [g.ants[2].x + g.ants[2].w / 2, g.ants[2].y],
    rf: [p.x + p.w / 2, p.y + 55 * (p.h / 90)],
    front: [p.x + p.w / 2, p.y + p.h],
  };
};

export const routerSpec: IconSpec<IconBaseProps> = {type: 'router', component: Router, size: {w: 320, h: 90}, z: 14, passive: false, ports: routerPorts};
