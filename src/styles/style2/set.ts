/**
 * The ep01 set: one canonical depiction of every part, laid out once. Stage-plane parts are in millimetres
 * (X from the rear wall's outer face, Y up from the case floor) and mapped to the master W at 2.3 px/mm.
 * Far-plane objects (wall, socket, desk, monitor) are given directly in W pixels.
 *
 * W is re-framed against Stage A (fix 1): 2.3 px/mm, the tower shifted right so the wall, socket and the
 * whole cord read on the left, and the iris centred ON the chipset (a loupe over the part, no leader).
 */
import type {Pt} from '../../shared';

export const S_W = 2.3; // px per mm in W
export const XR = 570; // W x of the rear wall's outer face (X = 0)
export const Y0 = 1051; // W y of the case floor (Y = 0)

export const wx = (X: number): number => XR + S_W * X;
export const wy = (Y: number): number => Y0 - S_W * Y;
export const wp = (X: number, Y: number): Pt => [wx(X), wy(Y)];

/** A box in mm: x0..x1, y0..y1 (Y up). */
export interface MBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
export const mb = (x0: number, x1: number, y0: number, y1: number): MBox => ({x0, x1, y0, y1});
export const mcx = (b: MBox) => (b.x0 + b.x1) / 2;
export const mcy = (b: MBox) => (b.y0 + b.y1) / 2;

export const SET = {
  caseOuter: mb(0, 380, 0, 468),
  bezel: mb(350, 380, 4, 460), // front bezel (plastic), 30 mm
  caseTopBand: mb(0, 380, 452, 468),
  floorBand: mb(0, 380, 0, 4),
  shroud: mb(2, 190, 100, 104), // PSU cover plate (over the supply only), with grommet A cut into it
  psu: mb(6, 186, 8, 94),
  psuFeet: [mb(16, 30, 4, 8), mb(160, 174, 4, 8)],
  inlet: mb(0, 6, 58, 76), // IEC C14 inlet on the rear face (edge-on)
  plug: mb(-24, 0, 59, 75), // C13 plug seated in the inlet
  rocker: mb(0, 6, 81, 90), // rear rocker at "I"
  grommetA: mb(150, 174, 100, 104),
  board: mb(18, 262, 118, 362),
  ioCluster: [mb(6, 22, 320, 338), mb(6, 20, 296, 314), mb(6, 20, 272, 290), mb(6, 18, 246, 262)],
  cpuPkg: mb(79.25, 116.75, 273.5, 318.5), // LGA1700 package, 37.5 x 45
  cpuIhs: mb(83, 113, 278, 314),
  socket: mb(73, 123, 266, 326),
  cooler: {cx: 98, cy: 296, r: 47.5, hub: 15},
  dimms: [mb(160, 165.5, 228, 361), mb(168, 173.5, 228, 361)],
  dimmSlots: [mb(158.5, 167, 224, 364), mb(166.5, 175, 224, 364)],
  pin24: mb(252, 262, 300, 352),
  grommetB: mb(270, 280, 300, 352),
  regs: [mb(236, 242, 224, 232), mb(244, 250, 224, 232)],
  heatsink: mb(189.5, 234.5, 147.5, 192.5),
  pch: mb(199.5, 224.5, 157.5, 182.5),
  lookout: mb(201, 211, 159, 169),
  qblock: mb(201, 214, 172, 180),
  flash: mb(176, 182, 200, 206),
  header: mb(232, 252, 121, 127),
  x16: mb(30, 119, 205, 212),
  ssd: mb(20, 100, 220, 242),
  ssdCtrl: mb(70, 84, 225, 237),
  holes: [
    [24, 356],
    [24, 124],
    [256, 356],
    [256, 124],
    [140, 356],
  ] as ReadonlyArray<readonly [number, number]>,
  buttonCap: mb(380, 385, 152, 166),
  buttonBody: mb(364, 380, 154, 164),
  wakeJack: mb(174, 188, 165, 179),
  wakeClock: mb(174, 188, 149, 163),
} as const;

/** Chipset centre (the iris point). */
export const PCH_C = {X: mcx(SET.pch), Y: mcy(SET.pch)}; // (212, 170)

/** The button's route (mm): lead from the cap to the header, then the board trace up into the lookout. */
export const ROUTE_MM: ReadonlyArray<readonly [number, number]> = [
  [383, 159],
  [346, 159],
  [346, 110],
  [242, 110],
  [242, 140],
  [206, 140],
  [206, 159],
];
/** Index of the vertex where the lead becomes the board trace (the header). */
export const LEAD_END_MM: readonly [number, number] = [242, 121];
export const LEAD_MM: ReadonlyArray<readonly [number, number]> = [
  [383, 159],
  [346, 159],
  [346, 110],
  [242, 110],
  [242, 121],
];

/** Standby path on the board: out of the 24-pin, through the regulators, into the lookout's right side. */
export const STANDBY_BOARD_MM: ReadonlyArray<readonly [number, number]> = [
  [252, 316],
  [243, 316],
  [243, 164],
  [211, 164],
];
/** Standby + main stubs: PSU top -> grommet A (visible), and grommet B -> 24-pin (visible). */
export const STUB_A = {main: [[155, 94], [155, 104]] as const, standby: [[167, 94], [167, 104]] as const};
export const STUB_B = {main: [[280, 338], [262, 338]] as const, standby: [[280, 316], [262, 316]] as const};
/** Hidden run behind the tray (drawn only where the tray reads as dark glass: E). */
export const STANDBY_HIDDEN_MM: ReadonlyArray<readonly [number, number]> = [
  [167, 94],
  [167, 108],
  [292, 108],
  [292, 316],
  [262, 316],
];

/** Wake-source stub (S11): badges -> lookout's left side. */
export const WAKE_STUB_MM: ReadonlyArray<readonly [number, number]> = [
  [188, 164],
  [201, 164],
];

/* ---------------------------------------------------------------- far plane (W px) */

export const ROOM = {
  monitorScreen: {x: 1640, y: 300, w: 260, h: 146},
  monitorBezel: 8,
  monitorNeck: {x: 1758, y: 454, w: 24, h: 136},
  monitorBase: {x: 1716, y: 590, w: 108, h: 10},
  deskTop: {x: 1500, y: 600, w: 480, h: 18},
  deskLegs: [
    {x: 1770, y: 618, w: 16, h: 372},
    {x: 1900, y: 618, w: 16, h: 372},
  ],
  farFloorY: 990,
  socket: {x: 300, y: 858, w: 64, h: 74},
} as const;

/** Monitor screen centre in W px. */
export const MON_C: Pt = [ROOM.monitorScreen.x + ROOM.monitorScreen.w / 2, ROOM.monitorScreen.y + ROOM.monitorScreen.h / 2];
