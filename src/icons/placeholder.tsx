/**
 * Placeholder icon (ICONS.md §1, critic change C10): a rounded rect with the part's 2.5D side, material fill, outline
 * and pip, so the engine and intro builders are never blocked by a missing icon. Registered for every IconType that has
 * no real drawing yet (the planned-topic icons of §6 until a topic needs them).
 */
import React from 'react';
import {COLOR, EXTRUDE, RADIUS} from '../engine/tokens';
import {Glow, Lines, Outline, Pip, Raised, RimLight, Shell, Stroke, TopFace, basePorts, raisedHullPath, rectD, resolveBase} from './primitives';
import type {IconBaseProps, IconSpec, IconType, Ports, Pt} from './types';

/** Default footprints, height classes and passivity for every type (ICONS.md §4 and §6). */
export const DEFAULTS: Record<IconType, {w: number; h: number; z: number; passive: boolean}> = {
  board: {w: 840, h: 610, z: EXTRUDE.z.pad, passive: true},
  case: {w: 1130, h: 816, z: EXTRUDE.z.flat, passive: true},
  cpuLga: {w: 260, h: 260, z: EXTRUDE.z.module, passive: false},
  chipset: {w: 260, h: 190, z: EXTRUDE.z.package, passive: false},
  logicBlock: {w: 72, h: 36, z: 3, passive: false},
  dimm: {w: 14, h: 260, z: EXTRUDE.z.module, passive: false},
  m2: {w: 280, h: 34, z: EXTRUDE.z.chip, passive: false},
  pcieSlot: {w: 410, h: 20, z: EXTRUDE.z.connector, passive: true},
  spiFlash: {w: 46, h: 28, z: EXTRUDE.z.chip, passive: false},
  vrmStandby: {w: 36, h: 26, z: EXTRUDE.z.connector, passive: true},
  atx24: {w: 132, h: 26, z: EXTRUDE.z.package, passive: true},
  fpHeader: {w: 50, h: 24, z: EXTRUDE.z.connector, passive: true},
  rearIo: {w: 38, h: 230, z: EXTRUDE.z.module, passive: true},
  rj45: {w: 26, h: 32, z: 12, passive: true},
  lanChip: {w: 34, h: 26, z: EXTRUDE.z.chip, passive: false},
  psu: {w: 480, h: 116, z: EXTRUDE.z.box, passive: false},
  iecPlug: {w: 36, h: 36, z: EXTRUDE.z.package, passive: true},
  cord: {w: 42, h: 8, z: EXTRUDE.z.flat, passive: true},
  wallSocket: {w: 64, h: 104, z: EXTRUDE.z.connector, passive: true},
  frontPanel: {w: 140, h: 116, z: EXTRUDE.z.tall, passive: true},
  powerButton: {w: 72, h: 72, z: EXTRUDE.z.connector, passive: true},
  led: {w: 10, h: 10, z: EXTRUDE.z.flat, passive: false},
  monitor: {w: 280, h: 170, z: EXTRUDE.z.module, passive: false},
  amdPackage: {w: 260, h: 260, z: EXTRUDE.z.module, passive: false},
  laptopBoard: {w: 600, h: 220, z: EXTRUDE.z.pad, passive: true},
  socPackage: {w: 150, h: 150, z: EXTRUDE.z.package, passive: false},
  ecChip: {w: 104, h: 72, z: EXTRUDE.z.chip, passive: true},
  battery: {w: 220, h: 120, z: EXTRUDE.z.module, passive: false},
  signInCard: {w: 240, h: 150, z: EXTRUDE.z.flat, passive: true},
  router: {w: 320, h: 90, z: EXTRUDE.z.tall, passive: false},
  antenna: {w: 16, h: 120, z: EXTRUDE.z.connector, passive: false},
  phone: {w: 110, h: 220, z: EXTRUDE.z.connector, passive: false},
  laptopOpen: {w: 360, h: 240, z: EXTRUDE.z.connector, passive: false},
  wallSection: {w: 80, h: 400, z: EXTRUDE.z.flat, passive: true},
  rfChip: {w: 56, h: 56, z: EXTRUDE.z.chip, passive: false},
  accessPoint: {w: 200, h: 200, z: EXTRUDE.z.package, passive: false},
  gpuPackage: {w: 420, h: 320, z: EXTRUDE.z.package, passive: false},
  hbmStack: {w: 60, h: 90, z: EXTRUDE.z.module, passive: false},
  gpuCard: {w: 640, h: 160, z: EXTRUDE.z.tall, passive: false},
  serverTray: {w: 900, h: 120, z: EXTRUDE.z.tall, passive: false},
  cpuDie: {w: 400, h: 300, z: EXTRUDE.z.chip, passive: false},
  core: {w: 60, h: 60, z: 3, passive: false},
  cacheBlock: {w: 120, h: 40, z: 3, passive: false},
  videoFrame: {w: 480, h: 270, z: EXTRUDE.z.pad, passive: true},
  codecSlab: {w: 120, h: 300, z: EXTRUDE.z.tall, passive: false},
  hdd: {w: 300, h: 220, z: EXTRUDE.z.module, passive: false},
  ssd25: {w: 300, h: 200, z: EXTRUDE.z.package, passive: false},
  nandPackage: {w: 80, h: 60, z: EXTRUDE.z.chip, passive: false},
  nandCell: {w: 360, h: 240, z: EXTRUDE.z.flat, passive: true},
  sataPower: {w: 200, h: 40, z: EXTRUDE.z.connector, passive: true},
  displayPanel: {w: 480, h: 300, z: EXTRUDE.z.flat, passive: true},
  subpixelTriad: {w: 90, h: 90, z: EXTRUDE.z.pad, passive: false},
};

const makePlaceholder = (passive: boolean): React.FC<IconBaseProps> => {
  const C: React.FC<IconBaseProps> = (p) => {
    const b = resolveBase(p, passive);
    const r = Math.min(RADIUS.part, b.w / 4, b.h / 4);
    const d = rectD(b.rect, r);
    return (
      <Shell b={b}>
        <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
        <TopFace d={d} fill={b.act(COLOR.body)} />
        <Lines>
          {/* a thin cross marks it as a stand-in (dashes would read as an analogy in this style) */}
          <Stroke
            d={`M${b.x + b.s(10)} ${b.y + b.s(10)}L${b.x + b.w - b.s(10)} ${b.y + b.h - b.s(10)}M${b.x + b.w - b.s(10)} ${b.y + b.s(10)}L${b.x + b.s(10)} ${b.y + b.h - b.s(10)}`}
            zoom={b.zoom}
            color={COLOR.detail}
            width={2}
            opacity={0.6}
          />
        </Lines>
        <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
        <Glow d={d} zoom={b.zoom} alpha={b.glow} />
        <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
        <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
      </Shell>
    );
  };
  return C;
};

const PASSIVE_PH = makePlaceholder(true);
const ACTIVE_PH = makePlaceholder(false);

type P = IconBaseProps & Record<string, unknown>;
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
/** Points spread evenly along a segment (n >= 1), excluding the ends. */
const spread = (n: number, a: Pt, b: Pt): Pt[] =>
  Array.from({length: n}, (_, i) => [a[0] + ((b[0] - a[0]) * (i + 1)) / (n + 1), a[1] + ((b[1] - a[1]) * (i + 1)) / (n + 1)] as Pt);
const indexed = (name: string, pts: Pt[]): Ports => Object.fromEntries(pts.map((pt, i) => [`${name}[${i}]`, pt]));

/**
 * The §6 table's named ports for the planned-topic types, so a topic world can anchor routes and labels before its
 * icons are drawn. The real icons must keep these names (indexed ports are `name[i]`).
 */
const TOPIC_PORTS: Partial<Record<IconType, (p: P) => Ports>> = {
  router: (p) => ({
    ...indexed('antenna', spread(Math.round(num(p.antennas, 3)), [p.x, p.y], [p.x + p.w, p.y])),
    wanIn: [p.x, p.y + p.h / 2],
    lanOut: [p.x + p.w, p.y + p.h / 2],
  }),
  antenna: (p) => ({tip: [p.x + p.w / 2, p.y], base: [p.x + p.w / 2, p.y + p.h]}),
  phone: (p) => ({antenna: [p.x + p.w / 2, p.y], screenRect: [p.x + p.w * 0.08, p.y + p.h * 0.06], screenRectEnd: [p.x + p.w * 0.92, p.y + p.h * 0.94]}),
  laptopOpen: (p) => ({antenna: [p.x + p.w / 2, p.y], screenRect: [p.x + p.w * 0.06, p.y + p.h * 0.05], screenRectEnd: [p.x + p.w * 0.94, p.y + p.h * 0.6]}),
  wallSection: (p) => ({face: [p.x + p.w, p.y + p.h / 2]}),
  rfChip: (p) => ({ant: [p.x + p.w / 2, p.y], bb: [p.x + p.w / 2, p.y + p.h]}),
  accessPoint: (p) => ({antenna: [p.x + p.w / 2, p.y + p.h / 2]}),
  gpuPackage: (p) => {
    const n = Math.round(num(p.stacks, 6));
    const top = Math.ceil(n / 2);
    return {
      ...indexed('hbm', [...spread(top, [p.x, p.y + p.h * 0.12], [p.x + p.w, p.y + p.h * 0.12]), ...spread(n - top, [p.x, p.y + p.h * 0.88], [p.x + p.w, p.y + p.h * 0.88])]),
      die: [p.x + p.w / 2, p.y + p.h / 2],
      pcie: [p.x + p.w / 2, p.y + p.h],
    };
  },
  hbmStack: (p) => ({bus: [p.x + p.w / 2, p.y + p.h]}),
  gpuCard: (p) => ({pcie: [p.x + p.w * 0.3, p.y + p.h], power: [p.x + p.w * 0.85, p.y]}),
  serverTray: (p) => ({...indexed('bay', spread(Math.round(num(p.bays, 4)), [p.x, p.y + p.h / 2], [p.x + p.w, p.y + p.h / 2]))}),
  cpuDie: (p) => {
    const pc = Math.round(num(p.pCores, 6));
    const ec = Math.round(num(p.eCores, 8));
    return {
      ...indexed('core', [...spread(pc, [p.x, p.y + p.h * 0.3], [p.x + p.w, p.y + p.h * 0.3]), ...spread(ec, [p.x, p.y + p.h * 0.55], [p.x + p.w, p.y + p.h * 0.55])]),
      cache: [p.x + p.w / 2, p.y + p.h * 0.85],
    };
  },
  core: (p) => ({in: [p.x, p.y + p.h / 2], out: [p.x + p.w, p.y + p.h / 2]}),
  cacheBlock: (p) => ({in: [p.x, p.y + p.h / 2], out: [p.x + p.w, p.y + p.h / 2]}),
  videoFrame: (p) => ({in: [p.x, p.y + p.h / 2], out: [p.x + p.w, p.y + p.h / 2]}),
  codecSlab: (p) => ({in: [p.x, p.y + p.h / 2], out: [p.x + p.w, p.y + p.h / 2]}),
  hdd: (p) => ({head: [p.x + p.w * 0.62, p.y + p.h * 0.42], sata: [p.x + p.w, p.y + p.h * 0.85]}),
  ssd25: (p) => ({sataData: [p.x + p.w, p.y + p.h * 0.3], sataPower: [p.x + p.w, p.y + p.h * 0.65]}),
  nandPackage: (p) => ({bus: [p.x + p.w / 2, p.y + p.h]}),
  nandCell: (p) => ({gate: [p.x + p.w / 2, p.y + p.h * 0.15], trap: [p.x + p.w / 2, p.y + p.h * 0.45], channel: [p.x + p.w / 2, p.y + p.h * 0.8]}),
  sataPower: (p) => ({...indexed('pin', spread(5, [p.x, p.y + p.h / 2], [p.x + p.w, p.y + p.h / 2]))}),
  displayPanel: (p) => ({...indexed('layer', spread(Math.round(num(p.layers, 5)), [p.x + p.w / 2, p.y], [p.x + p.w / 2, p.y + p.h]))}),
  subpixelTriad: (p) => ({r: [p.x + p.w / 6, p.y + p.h / 2], g: [p.x + p.w / 2, p.y + p.h / 2], b: [p.x + (p.w * 5) / 6, p.y + p.h / 2]}),
};

/** A placeholder spec for any type: the nine standard points + pip, plus the §6 named ports of planned topics. */
export const placeholderSpec = (type: IconType): IconSpec => {
  const dft = DEFAULTS[type];
  const extra = TOPIC_PORTS[type];
  return {
    type,
    component: dft.passive ? PASSIVE_PH : ACTIVE_PH,
    size: {w: dft.w, h: dft.h},
    z: dft.z,
    passive: dft.passive,
    ports: (p) => ({...basePorts(p, dft.passive), ...(extra ? extra(p as P) : {})}),
  };
};
