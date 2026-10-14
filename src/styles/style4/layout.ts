/**
 * Signal Score: the instrument face. Every position in px at 1920x1080.
 *
 *   header zone   x 144-520,  y 96-168     one header at a time
 *   time rail     y 112-196                playhead head, PRESS flag, moment labels, "Not to scale"
 *   lane heads    x 112-344                the real parts, stacked in depth order (+ the button's lead at x 112)
 *   braces        x 346-358                one curly brace per two-track package
 *   axis break    x 362-382                "//": earlier, compressed
 *   score field   x 384-1824 (text <= 1776), y 204-936
 *
 * Four lanes ordered by depth, six tracks (two braced pairs):
 *   1 What you see      L1 300
 *   2 Main processor    L2 464
 *   3 Chipset           Q 568 (the "?")  LK 664 (the lookout)
 *   4 Power supply      SB 800 (standby) MR 904 (main rails)
 */
import {THEMES, mixColor} from '../../shared/brand';

export const T = THEMES.dark;
/** The flat graphite instrument face: `board` edge to edge. */
export const GROUND = T.board;

export const X = {
  margin: 112, // the button's two-wire lead runs down here
  headL: 136,
  headR: 344,
  brace: 352,
  break0: 362,
  break1: 382,
  hist: 384, // the written history starts here (name slots too)
  right: 1824, // tracks end
  textR: 1776,
  rail0: 384,
} as const;

export const Y = {
  rail: 196, // the engraved time-rail hairline
  flag: 150, // PRESS flag (button glyph) centre
  L1: 300,
  L2: 464,
  Q: 568,
  LK: 664,
  SB: 800,
  MR: 904,
  markerTop: 198,
  markerBottom: 928,
  /** Engraved lane hairlines (2 px panel) between the lanes, in the score field only. */
  hairlines: [316, 482, 682] as const,
} as const;

export type TrackId = 'L1' | 'L2' | 'Q' | 'LK' | 'SB' | 'MR';
export const TRACK_Y: Record<TrackId, number> = {L1: Y.L1, L2: Y.L2, Q: Y.Q, LK: Y.LK, SB: Y.SB, MR: Y.MR};

/* ------------------------------------------------------------------------------------------------
 * Lane-head parts, in their SEAT positions (one drawing, one orientation per part).
 * ---------------------------------------------------------------------------------------------- */

export const SEAT = {
  caseFront: {x: 136, y: 200, w: 64, h: 104},
  button: {cx: 168, cy: 224, r: 15},
  led: {cx: 168, cy: 252, r: 5},
  monitor: {x: 216, y: 246, w: 104, h: 42}, // bezel; stand below to y 300
  cpu: {x: 136, y: 320, w: 208, h: 152},
  chipset: {x: 172, y: 530, w: 136, h: 168},
  qBlock: {x: 238, y: 550, w: 56, h: 36},
  lookout: {x: 186, y: 642, w: 44, h: 44},
  qBadge: {cx: 276, cy: 508},
  header: {x: 120, y: 652, w: 32, h: 24},
  psu: {x: 148, y: 772, w: 184, h: 144},
  fan: {cx: 214, cy: 846, r: 50},
  rocker: {x: 284, y: 786, w: 32, h: 40},
  inlet: {x: 278, y: 850, w: 40, h: 34},
} as const;

/** Group centres used by the fold (seat coordinates). */
export const SEAT_CENTRE = {
  row1: [228, 252] as const, // case front + monitor
  cpu: [240, 396] as const,
  chipset: [240, 614] as const, // + header block and "?" badge
  psu: [240, 844] as const,
} as const;

export type GroupId = keyof typeof SEAT_CENTRE;

/** The f0-f142 stage strip, in score order (what you see, processor, chipset, power): centre and scale. */
export const STRIP: Record<GroupId, {cx: number; cy: number; s: number}> = {
  // the processor dominates the hook (x1.8): "a big dark CPU, a small lit block"
  cpu: {cx: 850, cy: 365, s: 1.8},
  // case front 18 px right of the lead's margin (which runs 26 px left of the CPU), 16 px above the CPU
  row1: {cx: 747, cy: 160, s: 1},
  // header block 8 px right of the margin, the "?" badge 16 px under the CPU
  chipset: {cx: 767, cy: 642, s: 1},
  // standby link at the same x as in the seats (seat x 222), 40 px under the chipset
  psu: {cx: 767, cy: 838, s: 1},
};

/** Where a seat point lands in the strip (for links drawn in strip space). */
export const toStrip = (g: GroupId, p: readonly [number, number]): [number, number] => {
  const c = SEAT_CENTRE[g];
  const st = STRIP[g];
  return [st.cx + (p[0] - c[0]) * st.s, st.cy + (p[1] - c[1]) * st.s];
};

/* ------------------------------------------------------------------------------------------------
 * Score geometry
 * ---------------------------------------------------------------------------------------------- */

/** Mark sizes (brand: pulse 16 x 34, tick 16 x 24, block 32 tall radius 6). */
export const MARK = {
  pulseW: 16,
  pulseH: 34,
  pulseLensW: 60,
  tickW: 16,
  tickH: 24,
  blockH: 32,
  blockR: 6,
  hopR: 14,
  hopGap: 8, // half-width of the gap cut into a crossed track
  terminal: 8,
} as const;

/** The packed / normal after-PRESS offsets (px from PRESS), per mapping. */
export const AFTER = {
  tick: 44, // the lookout's reception tick (all mappings)
  /** Flash-forward "?" block (M1): written by the playhead from its arrival (1260) to 1380. */
  ffQ: [80, 200] as const,
  /** Look-ahead stations (M2a): the V, spaced so every hop and name has room. */
  la: {
    power: 100, // 4b Power segment start (fills to the right edge)
    powerAnchor: [100, -20] as const, // control anchor relative to (PRESS, MR)
    q: [128, 162] as const,
    fw: [178, 405] as const,
    loader: [429, 602] as const,
    win: [626, 856] as const,
  },
  /** The same V packed into PRESS..PRESS+300 (M2b, M3). */
  packed: {
    power: 76,
    q: [96, 120] as const,
    fw: [136, 186] as const,
    loader: [200, 240] as const,
    win: [254, 300] as const,
  },
} as const;

/** Mappings: PRESS x and "now" (home) x. */
export const MAP = {
  M1: {press: 1180, home: 1000, ffArrive: 1260, ffEnd: 1380},
  M2: {press: 920, home: 870},
  M3: {press: 1400, home: 1300},
} as const;

/** The Time Lens (S04-S05): d 420, clear of the playhead (x 1000) and of the standby channel. */
export const LENS4 = {cx: 1222, cy: 466, d: 420} as const;

/** Powered-domain wash colour: energy 16% over the board (1.38:1, lighter than the ground). */
export const WASH = mixColor(T.board, T.energy, 0.16);

/** A tone one step darker than structure (pressed cap). */
export const CAP_PRESSED = mixColor(T.structure, T.board, 0.45);
