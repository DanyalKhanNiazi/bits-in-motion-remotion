/**
 * A static copy of the Ep01 world (STORYBOARD.md §1) for the icon review sheet only: parts in draw order, the three
 * routes/channels for context, and the bible's camera + 2.5D formulas. The engine owns the real world; this is a
 * look-check harness so icons are judged at their true on-screen sizes.
 */
import {EXTRUDE} from '../engine/tokens';
import type {PartState} from '../engine/tokens';
import type {IconType, Pt} from './types';

export interface SheetPart {
  id: string;
  type: IconType;
  rect: {x: number; y: number; w: number; h: number};
  z: number;
  state?: PartState;
  props?: Record<string, unknown>;
  glow?: boolean | number;
}

const rel = (pkg: {x: number; y: number; w: number; h: number}, r: {x: number; y: number; w: number; h: number}) => ({
  x: (r.x - pkg.x) / pkg.w,
  y: (r.y - pkg.y) / pkg.h,
  w: r.w / pkg.w,
  h: r.h / pkg.h,
});

const CHIPSET = {x: 640, y: 500, w: 260, h: 190};

export const EP01_PARTS: SheetPart[] = [
  {id: 'case', type: 'case', rect: {x: 330, y: 112, w: 1130, h: 816}, z: 0},
  {id: 'cord', type: 'cord', rect: {x: 304, y: 832, w: 42, h: 8}, z: 0, props: {points: [[304, 836], [346, 836]]}},
  {id: 'socket', type: 'wallSocket', rect: {x: 240, y: 790, w: 64, h: 104}, z: 6},
  {id: 'board', type: 'board', rect: {x: 560, y: 150, w: 840, h: 610}, z: 2},
  {id: 'lan', type: 'lanChip', rect: {x: 600, y: 428, w: 34, h: 26}, z: 4, state: 'off'},
  {id: 'm2', type: 'm2', rect: {x: 1080, y: 300, w: 280, h: 34}, z: 4, state: 'off'},
  {id: 'flash', type: 'spiFlash', rect: {x: 914, y: 470, w: 46, h: 28}, z: 4, state: 'off'},
  {id: 'pcie', type: 'pcieSlot', rect: {x: 950, y: 560, w: 410, h: 20}, z: 6},
  {id: 'vrm', type: 'vrmStandby', rect: {x: 664, y: 700, w: 36, h: 26}, z: 6},
  {id: 'fpHeader', type: 'fpHeader', rect: {x: 985, y: 736, w: 50, h: 24}, z: 6},
  {
    id: 'chipset',
    type: 'chipset',
    rect: CHIPSET,
    z: 8,
    props: {
      blocks: [
        {key: 'lookout', shape: 'wide', rel: rel(CHIPSET, {x: 660, y: 630, w: 72, h: 36}), state: 'alwaysOn', glow: true, pip: 'inside-top-right'},
        {key: 'q', shape: 'square', rel: rel(CHIPSET, {x: 816, y: 516, w: 64, h: 64}), state: 'off', badge: 'q'},
      ],
    },
  },
  {id: 'atx24', type: 'atx24', rect: {x: 620, y: 734, w: 132, h: 26}, z: 8},
  {id: 'plug', type: 'iecPlug', rect: {x: 346, y: 818, w: 36, h: 36}, z: 8, props: {seated: 1}},
  {id: 'cpu', type: 'cpuLga', rect: {x: 650, y: 190, w: 260, h: 260}, z: 10, state: 'off'},
  {id: 'dimm1', type: 'dimm', rect: {x: 950, y: 190, w: 14, h: 260}, z: 10, state: 'off'},
  {id: 'dimm2', type: 'dimm', rect: {x: 972, y: 190, w: 14, h: 260}, z: 10, state: 'off'},
  {id: 'dimm3', type: 'dimm', rect: {x: 994, y: 190, w: 14, h: 260}, z: 10, state: 'off'},
  {id: 'dimm4', type: 'dimm', rect: {x: 1016, y: 190, w: 14, h: 260}, z: 10, state: 'off'},
  {id: 'rearIo', type: 'rearIo', rect: {x: 534, y: 250, w: 38, h: 230}, z: 10},
  {id: 'monitor', type: 'monitor', rect: {x: 1490, y: 190, w: 280, h: 170}, z: 10, state: 'off', props: {screen: 'black'}},
  {id: 'front', type: 'frontPanel', rect: {x: 940, y: 800, w: 140, h: 116}, z: 14},
  {id: 'button', type: 'powerButton', rect: {x: 974, y: 830, w: 72, h: 72}, z: 6, props: {press: 0}},
  {id: 'led', type: 'led', rect: {x: 1055, y: 813, w: 10, h: 10}, z: 0, state: 'off', props: {}},
  {id: 'psu', type: 'psu', rect: {x: 400, y: 800, w: 480, h: 116}, z: 22, state: 'off', props: {rocker: 'I'}},
];

export const EP01_ROUTES: Array<{id: string; points: Pt[]}> = [
  {id: 'pwrbtn', points: [[1010, 830], [1010, 748], [1010, 712], [716, 712], [716, 666]]},
];
export const EP01_CHANNELS: Array<{id: string; points: Pt[]; kind: 'main' | 'standby'; full: boolean}> = [
  {id: 'standby', points: [[676, 800], [676, 666]], kind: 'standby', full: true},
  {id: 'main', points: [[730, 800], [730, 760]], kind: 'main', full: false},
];

export interface SheetCam {
  center: Pt;
  zoom: number;
}
export const SHOTS: Record<string, SheetCam> = {
  open: {center: [870, 590], zoom: 1.15},
  power: {center: [780, 720], zoom: 1.42},
  chip: {center: [640, 706], zoom: 1.8},
  board: {center: [900, 566], zoom: 1.1},
  column: {center: [524, 760], zoom: 1.22},
  atlas: {center: [1005, 525], zoom: 0.92},
  monitor: {center: [1560, 360], zoom: 1.5},
  dive: {center: [620, 730], zoom: 2.0},
};

export const project = (cam: SheetCam, p: Pt): Pt => [960 + cam.zoom * (p[0] - cam.center[0]), 540 + cam.zoom * (p[1] - cam.center[1])];

/** Bible §6.4: side (world px) = z × [(0.45, 0.60) + 0.25 × (centre on screen − frame centre) / 1000]. */
export const sideOffset = (cam: SheetCam, r: {x: number; y: number; w: number; h: number}, z: number): [number, number] => {
  const c = project(cam, [r.x + r.w / 2, r.y + r.h / 2]);
  return [
    z * (EXTRUDE.obliqueX + (EXTRUDE.perspective * (c[0] - 960)) / 1000),
    z * (EXTRUDE.obliqueY + (EXTRUDE.perspective * (c[1] - 540)) / 1000),
  ];
};
