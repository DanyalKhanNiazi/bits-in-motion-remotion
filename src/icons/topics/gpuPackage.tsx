/**
 * `gpuPackage` (ICONS.md §6, Ep03 AI; round 2 seed): a GPU package with on-package memory (420 × 320, z package).
 * Base: the substrate (bodyLo, r 10) with its 2.5D side; the interposer (body); the GPU die (bodyHi) in the centre and
 * four memory stacks (stepped tops) on its long sides. Detail: the substrate's capacitor row, the die's edge seal and
 * the stacks' layer lines. Active region: the die.
 * Ports: `die` (centre), `hbm0`–`hbm3` (stack centres), `phy0`–`phy3` (the die edge facing each stack), `center`.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {Detail, DetailGroup, Glow, Lines, Outline, Pip, Raised, RimLight, Shell, StateHatch, Stroke, TopFace, basePorts, raisedHullPath, rectD, resolveBase, type Rect} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

export const gpuGeometry = (r: {x: number; y: number; w: number; h: number}) => {
  const kx = r.w / 420;
  const ky = r.h / 320;
  const k = Math.min(kx, ky);
  const R = (u: number, v: number, w: number, h: number): Rect => ({x: r.x + u * kx, y: r.y + v * ky, w: w * kx, h: h * ky});
  const interposer = R(40, 40, 340, 240);
  const die = R(150, 70, 120, 180);
  const hbm = [R(64, 70, 66, 84), R(64, 166, 66, 84), R(290, 70, 66, 84), R(290, 166, 66, 84)];
  return {k, kx, ky, R, interposer, die, hbm};
};

export const GpuPackage: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const g = gpuGeometry(b.rect);
  const {k} = g;
  const r = 10 * k;
  const d = rectD(b.rect, r);
  const dieD = rectD(g.die, 4 * k);
  let caps = '';
  for (let i = 0; i < 12; i++) caps += rectD({x: b.x + (30 + i * 30) * g.kx, y: b.y + 296 * g.ky, w: 6 * g.kx, h: 10 * g.ky}, 1 * k);
  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.bodyLo} />
      <TopFace d={rectD(g.interposer, 6 * k)} fill={COLOR.body} />
      {g.hbm.map((h, i) => (
        <g key={i}>
          <Raised d={rectD(h, 3 * k)} hull={raisedHullPath(h, 3 * k, b.sideK(0.7))} />
          <TopFace d={rectD(h, 3 * k)} fill={COLOR.bodyHi} />
        </g>
      ))}
      <Raised d={dieD} hull={raisedHullPath(g.die, 4 * k, b.sideK(0.5))} />
      <TopFace d={dieD} fill={b.act(COLOR.bodyHi)} />
      <StateHatch b={b} clipD={dieD} rect={g.die} />
      <DetailGroup b={b}>
        <Detail d={caps} zoom={b.zoom} fill />
        <Detail d={rectD({x: g.die.x + 8 * k, y: g.die.y + 8 * k, w: g.die.w - 16 * k, h: g.die.h - 16 * k}, 2 * k)} zoom={b.zoom} opacity={0.7} />
        {g.hbm.map((h, i) => (
          <Detail key={i} d={[1, 2, 3].map((j) => `M${h.x + 6 * k} ${h.y + (h.h * j) / 4}H${h.x + h.w - 6 * k}`).join('')} zoom={b.zoom} />
        ))}
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <RimLight rect={g.die} radius={4 * k} zoom={b.zoom} inset={b.s(2)} />
      <Lines>
        {g.hbm.map((h, i) => (
          <Stroke key={i} d={rectD(h, 3 * k)} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        ))}
      </Lines>
      <Glow d={dieD} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Outline d={dieD} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} />
      <Pip rect={g.die} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const gpuPackagePorts = (p: IconBaseProps): Ports => {
  const g = gpuGeometry(p);
  const c = (r: Rect): Pt => [r.x + r.w / 2, r.y + r.h / 2];
  const ports: Ports = {...basePorts(p, false), die: c(g.die)};
  g.hbm.forEach((h, i) => {
    ports[`hbm${i}`] = c(h);
    ports[`phy${i}`] = [i < 2 ? g.die.x : g.die.x + g.die.w, h.y + h.h / 2];
  });
  return ports;
};

export const gpuPackageSpec: IconSpec<IconBaseProps> = {type: 'gpuPackage', component: GpuPackage, size: {w: 420, h: 320}, z: 8, passive: false, ports: gpuPackagePorts};
