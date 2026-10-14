/**
 * Cameras on the one set. Every plane maps W pixels to screen by screen = T + k * P (a similarity).
 * A shot is {Fw: focus point in W px, Q: where it lands on screen, k: stage-plane zoom relative to W}.
 * Planes take the zoom at their own rate in log space (far 0.6, stage 1.0): the far plane is "deeper".
 * Moves interpolate log k with Move easing about each plane's fixed point, so a pull-back is a dolly.
 * Rate limit (P1): <= x2.2 per 12 frames at the easing's peak slope, on the stage plane (checked below).
 */
import {EASE, clamp01, type Pt} from '../../shared';
import {wx, wy, MON_C} from './set';
import {F} from './timeline';

export interface Cam {
  k: number;
  T: Pt;
}
export interface ShotCam {
  Fw: Pt;
  Q: Pt;
  k: number;
}
export type Lod = 'W' | 'C' | 'E' | 'K' | 'M';

export const DEPTH = {far: 0.6, stage: 1.0} as const;

export const planeCam = (s: ShotCam, d: number): Cam => {
  const k = Math.pow(s.k, d);
  return {k, T: [s.Q[0] - k * s.Fw[0], s.Q[1] - k * s.Fw[1]]};
};

/** Interpolate two plane cameras in log space about their common fixed point. */
export const lerpCam = (a: Cam, b: Cam, e: number): Cam => {
  const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * e);
  if (Math.abs(a.k - b.k) < 1e-9) {
    return {k, T: [a.T[0] + (b.T[0] - a.T[0]) * e, a.T[1] + (b.T[1] - a.T[1]) * e]};
  }
  // fixed point Z (W px): a.T + a.k Z = b.T + b.k Z
  const Z: Pt = [(b.T[0] - a.T[0]) / (a.k - b.k), (b.T[1] - a.T[1]) / (a.k - b.k)];
  const P: Pt = [a.T[0] + a.k * Z[0], a.T[1] + a.k * Z[1]];
  return {k, T: [P[0] - k * Z[0], P[1] - k * Z[1]]};
};

export const apply = (c: Cam, p: Pt): Pt => [c.T[0] + c.k * p[0], c.T[1] + c.k * p[1]];

const CPU_C: Pt = [wx(98), wy(296)];
const ID: ShotCam = {Fw: [960, 540], Q: [960, 540], k: 1};

export const SHOT_CAMS: Record<'W' | 'C' | 'M' | 'E' | 'K' | 'Wpush', ShotCam> = {
  W: ID,
  /** CPU insert: the package ~375 px wide through the cooler's dark glass (about 10 px/mm). Review fix: centred
   *  at x 910 so the board's left edge (x 111) clears the slate (x 144+) instead of running through "After". */
  C: {Fw: CPU_C, Q: [910, 540], k: 10 / 2.3},
  /** The screen: monitor ~460 px wide (far plane), centred; the tower's front wall a silhouette at the left edge.
   *  Review fix: the bezel's front edge sits at x 110, clear of the slate (it ran through "Soft-off" at x 180). */
  M: {Fw: MON_C, Q: [958, 470], k: 2.6},
  /** Establishing: the whole desktop at 1.61 px/mm on the board plane (floor near the fixed point). */
  E: {Fw: [1100, 1000], Q: [800, 990], k: 0.7},
  /** Plug insert: the supply's rear end at 4.1 px/mm (plug, rocker, stubs). */
  K: {Fw: [wx(84), wy(72)], Q: [840, 680], k: 1.9},
  /** S12 lean-in end: x1.2 about a low point that keeps the cord above y 940. */
  Wpush: {Fw: [900, 860], Q: [900, 860], k: 1.2},
};

interface Move {
  from: number;
  frames: number;
  a: ShotCam;
  b: ShotCam;
  lodA: Lod;
  lodB: Lod;
}

export const MOVES: Move[] = [
  {from: F.pullME, frames: F.pullMEFrames, a: SHOT_CAMS.M, b: SHOT_CAMS.E, lodA: 'E', lodB: 'E'},
  {from: F.pullKW, frames: F.pullKWFrames, a: SHOT_CAMS.K, b: SHOT_CAMS.W, lodA: 'W', lodB: 'W'},
  {from: F.pushStart, frames: F.pushEnd - F.pushStart, a: SHOT_CAMS.W, b: SHOT_CAMS.Wpush, lodA: 'W', lodB: 'W'},
];

export interface CamState {
  stage: Cam;
  far: Cam;
  lod: Lod;
  moving: boolean;
}

const still = (s: ShotCam, lod: Lod): CamState => ({stage: planeCam(s, DEPTH.stage), far: planeCam(s, DEPTH.far), lod, moving: false});

/** Camera for the hardware set at a frame (P, the relay, has its own camera). */
export const cameraAt = (frame: number): CamState => {
  for (const m of MOVES) {
    if (frame >= m.from && frame < m.from + m.frames) {
      const e = EASE.move(clamp01((frame - m.from) / m.frames));
      return {
        stage: lerpCam(planeCam(m.a, DEPTH.stage), planeCam(m.b, DEPTH.stage), e),
        far: lerpCam(planeCam(m.a, DEPTH.far), planeCam(m.b, DEPTH.far), e),
        lod: e < 0.5 ? m.lodA : m.lodB,
        moving: true,
      };
    }
  }
  if (frame >= F.pushStart) return still(SHOT_CAMS.Wpush, 'W');
  if (frame >= F.pullKW + F.pullKWFrames) return still(SHOT_CAMS.W, 'W');
  if (frame >= F.cutK) return still(SHOT_CAMS.K, 'K');
  if (frame >= F.pullME + F.pullMEFrames) return still(SHOT_CAMS.E, 'E');
  if (frame >= F.cutM) return still(SHOT_CAMS.M, 'M');
  if (frame >= F.cutW2) return still(SHOT_CAMS.W, 'W');
  if (frame >= F.cutW1) return still(SHOT_CAMS.W, 'W');
  if (frame >= F.cutC) return still(SHOT_CAMS.C, 'C');
  return still(SHOT_CAMS.W, 'W');
};

/** Peak zoom factor per 12 frames for each move (stage plane), for the report and a console check. */
export const moveRates = (): Array<{from: number; frames: number; peakPer12: number}> =>
  MOVES.map((m) => {
    let peak = 1;
    for (let f = m.from; f < m.from + m.frames; f++) {
      const a = cameraAt(f).stage.k;
      const b = cameraAt(Math.min(f + 12, m.from + m.frames)).stage.k;
      peak = Math.max(peak, Math.max(a / b, b / a));
    }
    return {from: m.from, frames: m.frames, peakPer12: peak};
  });
