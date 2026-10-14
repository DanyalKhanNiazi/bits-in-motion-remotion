/**
 * System-page geometry (model space = page px at ×1). One model: B (the board, side elevation through the side
 * panel, rear on the left, 2 px/mm), P (the power supply, mains end right, 1.8 px/mm) and O (outside: case front
 * and monitor, front elevation). Other pages reuse it through views.
 */
import {routePath, type Pt} from '../../shared/geom';
import type {Box} from './look';

/* panels (page px) */
export const PB: Box = {x: 96, y: 212, w: 974, h: 814}; // inside hardware: the board
export const PP: Box = {x: 1142, y: 212, w: 682, h: 288}; // inside hardware: the power supply
export const PO: Box = {x: 1142, y: 524, w: 682, h: 502}; // outside: case front + monitor
/** the whole present page (B, P, O and their gutters) */
export const PAGE: Box = {x: 96, y: 212, w: 1728, h: 814};

/* ----------------------------------------------------------------------------- B: the board */
export const BOARD: Box = {x: 542, y: 236, w: 488, h: 610};
export const IO_SHIELD: Box = {x: 542, y: 250, w: 40, h: 266};
export const RJ45: Box = {x: 542, y: 420, w: 34, h: 32};
export const LAN: Box = {x: 590, y: 470, w: 30, h: 30};
export const VRM: Box = {x: 604, y: 300, w: 26, h: 176};
export const COOLER: Box = {x: 642, y: 281, w: 200, h: 210};
export const SOCKET: Box = {x: 695, y: 331, w: 95, h: 110};
export const CPU: Box = {x: 705, y: 341, w: 75, h: 90};
export const DIMM_X = [852, 867, 882, 897] as const;
export const DIMM: Box = {x: 852, y: 276, w: 10, h: 266};
export const PIN24: Box = {x: 1008, y: 386, w: 22, h: 104};
export const REG: Box = {x: 980, y: 520, w: 26, h: 20};
export const HEATSINK: Box = {x: 845, y: 640, w: 94, h: 92};
export const CHIPSET: Box = {x: 865, y: 660, w: 54, h: 52};
/** the hidden processor "?" (wider, small corners) and the lookout (smaller, rounder): different shapes */
export const QBLOCK: Box = {x: 870, y: 665, w: 26, h: 18};
export const QR = 2;
export const LOOK: Box = {x: 896, y: 691, w: 18, h: 16};
export const LR = 5;
export const LOOK_C: Pt = [905, 699];
export const RTC: Box = {x: 836, y: 760, w: 28, h: 14};
export const HEADER: Box = {x: 950, y: 830, w: 30, h: 16};
/** "?" badge label slot at ×1 (left of the chipset heatsink) */
export const QBADGE_1: Pt = [812, 652];

/* ----------------------------------------------------------------------------- P: the power supply */
export const PSU: Box = {x: 1545, y: 340, w: 225, h: 129};
export const PSU_OUT: Box = {x: 1545, y: 392, w: 12, h: 72}; // output (modular) panel at the left end
export const INLET_Y = 418;
export const PLUG: Box = {x: 1770, y: 398, w: 30, h: 40};
export const ROCKER: Box = {x: 1770, y: 350, w: 12, h: 32};

/* ----------------------------------------------------------------------------- O: outside */
export const CASE_FRONT: Box = {x: 1128, y: 600, w: 221, h: 480};
export const BUTTON_C: Pt = [1238, 652];
export const BUTTON_R = 16;
export const LED_C: Pt = [1204, 652];
export const MONITOR: Box = {x: 1394, y: 724, w: 515, h: 290};

/* ----------------------------------------------------------------------------- routes and channels */
/** The button's lead: on the case front (O), across the B|O port gutter at a right angle, along the board's bottom
 *  edge to the front-panel header, then the PWRBTN# trace up to the lookout. Never meets a channel. */
export const BUTTON_PTS: Pt[] = [
  [1238, 652],
  [1238, 839],
  [952, 839],
  [952, 760],
  [905, 713],
  [905, 699],
];
export const BUTTON_D = routePath(BUTTON_PTS, 8);
/** the part of the lead that is drawn while idle: from O's port into B (inside O it shows only when lit/narrated) */
export const LEAD_IDLE_PTS: Pt[] = BUTTON_PTS.slice(1).map((p, i) => (i === 0 ? ([1142, 839] as Pt) : p));
export const LEAD_IDLE_D = routePath(LEAD_IDLE_PTS, 8);
/** S03: the ink part, button → header (ends in an end-tick at the header) */
export const INK_PTS: Pt[] = [
  [1238, 652],
  [1238, 839],
  [965, 839],
];
export const INK_D = routePath(INK_PTS, 8);
export const END_TICK: Pt = [965, 839];

/** Gutter crossings (page space): ports where routes meet panel edges. */
export const PORT_Y_LEAD = 839;
export const PORT_Y_MAIN = 410;
export const PORT_Y_STBY = 450;

/** Main channel (18 px, walls only, always empty): PSU output → B's 24-pin. */
export const MAIN_PTS: Pt[] = [
  [1545, 410],
  [1030, 410],
];
/** Standby channel (10 px, amber): PSU output → 24-pin → regulator → the lookout's side of the chipset. */
export const STBY_PTS: Pt[] = [
  [1545, 450],
  [993, 450],
  [993, 699],
  [919, 699],
];

/** S11 wake routes into the lookout (structure, idle): from the network jack via the LAN chip, and from the clock. */
export const WAKE_LAN_PTS: Pt[] = [
  [576, 436],
  [605, 436],
  [605, 470],
];
export const WAKE_LAN2_PTS: Pt[] = [
  [605, 500],
  [605, 560],
  [838, 560],
  [838, 694],
  [896, 694],
];
export const WAKE_RTC_PTS: Pt[] = [
  [850, 760],
  [850, 724],
  [889, 724],
  [889, 703],
  [896, 703],
];

/** S11 standby domain (24-pin entry, regulator, lookout corner, header and its trace); excludes the CPU, DIMMs,
 *  LAN chip and the "?" (the boundary passes between the lookout and the "?"). */
export const DOMAIN_PTS: Pt[] = [
  [1036, 378],
  [1036, 854],
  [940, 854],
  [940, 770],
  [893, 723],
  [891, 687],
  [976, 687],
  [976, 378],
];
