/**
 * The Living Schematic camera: one continuous camera on one map. It never cuts.
 *
 * A framing is a scale plus a world point held at a screen point (screen = s * world + t).
 * Between framings the scale interpolates in log space with the brand's Move easing and the anchor's screen
 * position eases with it (a pure zoom keeps its focal point fixed on screen).
 * Named framings: System (x1.0), Power path (x1.6, the board region with the plug in view) and Chipset (x3.6,
 * entered by the S12 ride, reached after the intro ends).
 *
 * Intro budget: three 26-frame moves (each starting on a landing or in a pause) and one ride (T2 carry).
 * Zoom is capped at x2.2 per 12 frames: a 26-frame x1.6 move peaks at about x1.86 per 12 frames (checked by
 * camRateReport(), printed by tools through console.warn if a move breaks it).
 */
import {EASE, clamp01, kitWarn, type Pt} from '../../shared';
import {center, LOOKOUT} from './map';
import {F} from './timeline';

export interface Cam {
  s: number;
  tx: number;
  ty: number;
}

export const SYSTEM: Cam = {s: 1, tx: 0, ty: 0};
/** Power path: x1.6, a pure zoom about screen/world point (193, 1046): plug, PSU, chipset and button in one frame. */
export const POWER_FOCUS: Pt = [193, 935];
export const POWER_S = 1.6;
export const POWER: Cam = {s: POWER_S, tx: (1 - POWER_S) * POWER_FOCUS[0], ty: (1 - POWER_S) * POWER_FOCUS[1]};
/** Chipset: x3.6, the lookout held at screen (900, 330) (reached at f1930, after the intro). */
const LOOK_C = center(LOOKOUT);
export const CHIP_SCREEN: Pt = [900, 330];
export const CHIPSET_CAM: Cam = {s: 3.6, tx: CHIP_SCREEN[0] - 3.6 * LOOK_C[0], ty: CHIP_SCREEN[1] - 3.6 * LOOK_C[1]};

export const apply = (c: Cam, p: Pt): Pt => [c.s * p[0] + c.tx, c.s * p[1] + c.ty];
export const unapply = (c: Cam, p: Pt): Pt => [(p[0] - c.tx) / c.s, (p[1] - c.ty) / c.s];

interface Move {
  name: string;
  from: number;
  to: number;
  A: Cam;
  B: Cam;
  /** World anchor whose screen position eases between A(W) and B(W). */
  W: Pt;
}

export const MOVES: Move[] = [
  {name: 'arrival push (S04 landing)', from: F.push, to: F.push + 26, A: SYSTEM, B: POWER, W: POWER_FOCUS},
  {name: 'pull-back (S05–S06 pause)', from: F.pullBack, to: F.pullBack + 26, A: POWER, B: SYSTEM, W: POWER_FOCUS},
  {name: 'glide (pause after "power,")', from: F.glide, to: F.glide + 26, A: SYSTEM, B: POWER, W: POWER_FOCUS},
  {name: 'ride (S12 carry)', from: F.ride, to: F.ride + 80, A: POWER, B: CHIPSET_CAM, W: LOOK_C},
];

const interp = (m: Move, e: number): Cam => {
  const s = Math.exp(Math.log(m.A.s) + (Math.log(m.B.s) - Math.log(m.A.s)) * e);
  const SA = apply(m.A, m.W);
  const SB = apply(m.B, m.W);
  const Sx = SA[0] + (SB[0] - SA[0]) * e;
  const Sy = SA[1] + (SB[1] - SA[1]) * e;
  return {s, tx: Sx - s * m.W[0], ty: Sy - s * m.W[1]};
};

/** Move progress (eased) of a move at a frame. */
export const moveEase = (m: Move, frame: number): number => EASE.move(clamp01((frame - m.from) / (m.to - m.from)));

export const camAt = (frame: number): Cam => {
  let cam = SYSTEM;
  for (const m of MOVES) {
    if (frame < m.from) break;
    cam = frame >= m.to ? m.B : interp(m, moveEase(m, frame));
  }
  return cam;
};

/** 0 at System, 1 at Power path (label slots interpolate with the camera's easing). Stays 1 during the ride. */
export const powerWeight = (frame: number): number => {
  const c = camAt(frame);
  if (frame >= F.ride) return 1;
  return clamp01(Math.log(c.s) / Math.log(POWER.s));
};

/** Instantaneous zoom-rate check (x2.2 per 12 frames = log-rate 0.0657/frame), sampled at 1/8 frame. */
export const camRateReport = (): Array<{name: string; peakPer12: number}> =>
  MOVES.map((m) => {
    let peak = 0;
    const steps = (m.to - m.from) * 8;
    for (let i = 0; i < steps; i++) {
      const f0 = m.from + i / 8;
      const f1 = f0 + 1 / 8;
      const r = Math.abs(Math.log(interp(m, moveEase(m, f1)).s) - Math.log(interp(m, moveEase(m, f0)).s)) * 8;
      peak = Math.max(peak, r);
    }
    return {name: m.name, peakPer12: Math.exp(peak * 12)};
  });

// Warn (once) if a move breaks the x2.2 per 12 frames cap.
for (const r of camRateReport()) if (r.peakPer12 > 2.2 + 1e-3) kitWarn(`style3 camera: ${r.name} peaks at x${r.peakPer12.toFixed(3)} per 12 frames (cap x2.2)`);
