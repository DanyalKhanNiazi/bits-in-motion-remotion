/**
 * The Living Schematic map: one PC, drawn once, in world units (= screen px at the System framing).
 *
 * Layout ("power stack", true relative arrangement of a typical ATX desktop):
 *   rear I/O on the board's left (rear) edge · CPU socket upper left · four DIMMs right of the CPU ·
 *   M.2 SSD below the DIMMs · chipset (PCH) below the CPU holding the always-on block ("lookout") and the "?" ·
 *   standby regulators and the 24-pin under the chipset · ATX PSU in the bottom compartment, its inlet,
 *   plug and rocker on its rear (left) face · front panel (button + LED) at the front, its lead to the
 *   front-panel header on the board's bottom edge · monitor outside the case, top right.
 * Nodes are simplified hardware silhouettes; routes run orthogonal or at 45° (transit grammar).
 */
import type {Pt} from '../../shared';

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
}
export const rect = (x0: number, y0: number, x1: number, y1: number, r = 0): Rect => ({x: x0, y: y0, w: x1 - x0, h: y1 - y0, r});
export const center = (b: Rect): Pt => [b.x + b.w / 2, b.y + b.h / 2];
export const topRight = (b: Rect): Pt => [b.x + b.w, b.y];

/* ---------------------------------------------------------------- the board and its parts */
export const BOARD = rect(548, 222, 1224, 744, 14);
export const HOLES: Pt[] = [
  [574, 246],
  [1198, 246],
  [574, 690],
  [1198, 718],
];

export const CPU = rect(616, 256, 876, 490, 10);
/** Heat spreader (IHS) with the LGA1700-style side notches. */
export const IHS = rect(640, 280, 852, 466, 8);

export const DIMMS: Rect[] = [916, 938, 960, 982].map((x) => rect(x, 262, x + 16, 494, 3));
export const M2 = rect(940, 506, 1172, 536, 4);

export const CHIPSET = rect(604, 540, 844, 690, 10);
/** The always-on power-management block ("lookout"): wide and low, lower left of the chipset. */
export const LOOKOUT = rect(620, 614, 694, 648, 6);
/** The hidden processor ("?"): squarer, upper right of the chipset. Unnamed in the intro. */
export const QBLOCK = rect(748, 566, 800, 618, 6);
/** The "?" badge sits ON the "?" block (screen-constant 36 px), so it reads at every scale and inside the Lens. */
export const QBADGE: Pt = [774, 592];
/** The chipset's RTC alarm (a wake source), drawn on first use in S11. */
export const CLOCK: Pt = [650, 576];

export const REGS = rect(628, 690, 652, 714, 3);
export const ATX24 = rect(628, 726, 724, 750, 3);
export const HEADER = rect(928, 724, 972, 742, 3);

/** Rear I/O stack on the board's left (rear) edge, and the LAN controller. */
export const IO = rect(528, 470, 560, 620, 4);
export const RJ45 = rect(532, 568, 556, 604, 2);
export const LAN = rect(572, 574, 596, 598, 3);

/* ---------------------------------------------------------------- off the board */
export const PSU = rect(440, 806, 840, 924, 10);
/** Where the PSU's 24-pin cable leaves its top face (both channels leave here, side by side). */
export const PSU_EXIT = rect(622, 798, 718, 812, 3);
export const FAN_C: Pt = [512, 865];
export const FAN_R = 40;
export const INLET = rect(426, 824, 440, 860, 2);
export const PLUG = rect(404, 827, 428, 857, 3);
export const ROCKER = rect(426, 872, 440, 904, 2);
export const SOCKET = rect(298, 819, 344, 865, 8);
export const CORD: Pt[] = [
  [404, 842],
  [344, 842],
];

export const FRONT = rect(900, 796, 1010, 900, 12);
export const BUTTON_C: Pt = [950, 852];
export const BUTTON_R = 26;
export const CAP_R = 19;
export const LED_C: Pt = [990, 814];

export const MONITOR = rect(1450, 236, 1740, 404, 10);

/* ---------------------------------------------------------------- routes and channels */
/** The press route: lead (button → front-panel header) + board trace (header → the lookout's underside). 448 px. */
export const BUTTON_ROUTE: Pt[] = [
  [950, 826],
  [950, 708],
  [680, 708],
  [680, 648],
];
/** Split for drawing: the lead (cable) ends at the header's bottom, the trace starts at its top. */
export const LEAD_END_Y = 742;

export const STANDBY_PATH: Pt[] = [
  [640, 806],
  [640, 648],
];
export const MAIN_PATH: Pt[] = [
  [700, 806],
  [700, 750],
];

/** Idle data links (4 px structure): CPU–memory, CPU–M.2, CPU–chipset (DMI). */
export const LINKS: Pt[][] = [
  [
    [876, 300],
    [916, 300],
  ],
  [
    [876, 456],
    [900, 456],
    [900, 521],
    [940, 521],
  ],
  [
    [830, 490],
    [830, 540],
  ],
];

/** S11 wake routes (drawn on first use on "reason"): network jack → LAN chip → lookout; clock → lookout. */
export const WAKE_NET: Pt[] = [
  [556, 586],
  [572, 586],
];
export const WAKE_NET2: Pt[] = [
  [596, 586],
  [610, 586],
  [610, 631],
  [620, 631],
];
export const WAKE_CLOCK: Pt[] = [
  [650, 587],
  [650, 614],
];

/** S11 powered (standby) domain: a patch round the lookout, the corridor to the 24-pin and the regulators. */
export const WASH: Pt[] = [
  [610, 604],
  [706, 604],
  [706, 662],
  [664, 662],
  [664, 754],
  [618, 754],
  [618, 662],
  [610, 662],
];

/* ---------------------------------------------------------------- S06 chain (preview layer) */
/** Station ticks on the CPU's left side (stages that run on the CPU). */
export const TICK_X0 = 604;
export const TICKS_Y = [446, 356, 274] as const;
export const TOKEN_X = 598;
/** "Power" plate inside the PSU (a power phase, no code). */
export const POWER_PLATE = rect(560, 826, 812, 890, 8);

/* ---------------------------------------------------------------- framing reference */
/** Bounding box of the whole map (for the key plan). */
export const MAP_BOX = rect(290, 214, 1760, 934);
