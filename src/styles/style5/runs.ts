/**
 * Every Bit run in Live Panels, built from the same frame constants (T.ts) and routes (geo.ts) the picture uses.
 * Pure module (no React), so check/check5.mjs can evaluate it in Node.
 */
import {bitChain, bitRun} from '../../shared/motion';
import type {Pt} from '../../shared/geom';
import * as G from './geo';
import {F} from './T';

/* ------------------------------------------------------------------ the button's lead (S01, S04, S12) */
export const RUN_FF = bitRun({path: G.BUTTON_D, depart: F.ffDepart, land: F.ffLand, label: 'S01 flash-forward'});
export const RUN_S04 = bitRun({path: G.BUTTON_D, depart: F.s04Depart, land: F.s04Land, label: 'S04 described'});
/** S12: the real press. 51 frames (lands f1891, outside the intro): the documented long run (see REPORT). */
export const RUN_S12 = bitRun({path: G.BUTTON_D, depart: F.s12Depart, land: F.nextLand, allowLong: true, label: 'S12 real press'});
export const LEAD_RUNS = [RUN_FF, RUN_S04, RUN_S12];

/* ------------------------------------------------------------------ S06: the row of six views */
export const T_TOP = 545;
export const T_BOT = 940;
export const RY = 676; // the route
export const XS: Array<[number, number]> = [
  [120, 420],
  [444, 694],
  [718, 968],
  [992, 1242],
  [1266, 1516],
  [1540, 1790],
];
/** view centres: every station name is centred here, inside title-safe (x 144–1776) */
export const CX: number[] = XS.map(([a, b]) => (a + b) / 2);
export const P_LOOK: Pt = [CX[0] + 31, RY];
export const P_PSU: Pt = [CX[1] - 63, RY];
export const P_Q: Pt = [CX[2], RY];
export const P_CPU4: Pt = [CX[3] + 15, RY];
export const P_CPU5: Pt = [CX[4], RY];
export const P_CPU6: Pt = [CX[5] - 27, RY];
export const STOPS: Pt[] = [P_LOOK, P_PSU, P_Q, P_CPU4, P_CPU5, P_CPU6];

export const HOPS = bitChain(
  F.hopDepart.map((dep, i) => ({path: [STOPS[i], STOPS[i + 1]] as Pt[], depart: dep, land: F.chain[i], label: `S06 hop ${i + 1}`})),
);
