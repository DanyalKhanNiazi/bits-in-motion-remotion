/**
 * Ep06 kit: <Archive> geometry and fixed story data (DIRECTION §2.2). FROZEN at the kit gate: box ids, GEOM, the photo's
 * boxes, the occupancy and the SSD map never change, so every section shows the same wall.
 *
 * World px at framing 'wide' (zoom 1 = screen px). Box ids 1..144 are row-major (001 top-left, 016 top-right, 144
 * bottom-right). `col`/`row` are 0-based here; DIRECTION's "cols 1–4" etc. are 1-based.
 */
import {random} from 'remotion';

export const COLS = 16;
export const ROWS = 9;
export const PITCH = 72;
export const BOX = 64;
export const N_BOXES = COLS * ROWS;
/** SSD physical layer: 16 + 2 spare columns. */
export const SPOT_COLS = 18;
export const N_SPOTS = SPOT_COLS * ROWS;

export const GEOM = {
  cols: COLS,
  rows: ROWS,
  pitch: PITCH,
  box: BOX,
  gap: PITCH - BOX,
  /** the wall: top-left of box 001 and the 16×9 extent */
  wall: {x: 712, y: 236, w: COLS * PITCH - (PITCH - BOX), h: ROWS * PITCH - (PITCH - BOX)},
  /** SSD spare columns 17–18 (x of col 17), hidden until P17 */
  spare: {x: 712 + COLS * PITCH, cols: 2},
  /** the drawer assembly (cabinet + open drawer), left of the wall, top-aligned */
  drawer: {x: 96, y: 236, w: 552, h: 352, front: {y0: 470, y1: 588}},
  /** the map of taken boxes: a 16×9 mini-grid under the drawer (cell top-left = x + c·pitch) */
  map: {x: 136, y: 624, pitch: 28, cell: 22, plate: {x0: 116, y0: 604, x1: 604, y1: 896}},
  /** the photo's card at rest (raised in the drawer) and lifted (above the wall's top-left); centre + width */
  card: {x: 372, y: 318, w: 360},
  lift: {x: 1010, y: -40, w: 720},
  /** the boundary between Windows' side (drawer) and the drive's side (wall), with the note slot */
  boundary: {x: 680, y0: 120, y1: 930, slotY: 400, slotH: 96},
  /** SSD: the drive actor (the chip) under the wall's lower-left corner */
  actor: {x: 806, y: 952},
  /** HDD: the platter glow behind the wall (background only) */
  platter: {x: 1284, y: 556, r: 760},
  /** inside a SplitCompare panel the card stands here (whatever `lift`), sized so card + runs fit the `split` framing */
  panelCard: {x: 495, y: 300, w: 400},
  /** the parallax reference: the camera centre at which the lifted card sits exactly at `lift` */
  liftRef: {x: 1270, y: 300},
} as const;

export const colOf = (id: number): number => (id - 1) % COLS;
export const rowOf = (id: number): number => Math.floor((id - 1) / COLS);
export const idAt = (col: number, row: number): number => row * COLS + col + 1;
/** top-left of box `id` (single view) */
export const boxXY = (id: number): {x: number; y: number} => ({x: GEOM.wall.x + colOf(id) * PITCH, y: GEOM.wall.y + rowOf(id) * PITCH});
/** centre of box `id` */
export const boxC = (id: number): {x: number; y: number} => {
  const p = boxXY(id);
  return {x: p.x + BOX / 2, y: p.y + BOX / 2};
};
/** spot index (0-based, 18 per row) → top-left (physical layer, unprojected) */
export const spotXY = (s: number): {x: number; y: number} => ({x: GEOM.wall.x + (s % SPOT_COLS) * PITCH, y: GEOM.wall.y + Math.floor(s / SPOT_COLS) * PITCH});
export const spotOfCell = (col: number, row: number): number => row * SPOT_COLS + col;
export const pad3 = (id: number): string => String(id).padStart(3, '0');
/** erase group of a box (0..3: cols 1–4, 5–8, 9–12, 13–16) and its 4 member ids */
export const groupOf = (id: number): number => Math.floor(colOf(id) / 4);
export const groupIds = (id: number): number[] => {
  const g = groupOf(id);
  const r = rowOf(id);
  return [0, 1, 2, 3].map((k) => idAt(g * 4 + k, r));
};

/* ---------------------------------------------------------------- the photo (never changes) */
export const RUNS: readonly (readonly [number, number, number])[] = [
  [21, 22, 23],
  [58, 59, 60],
  [98, 99, 100],
] as const;
export const PHOTO: readonly number[] = RUNS.flat();
/** the header glyph: a bright cyan notch across the top of 021 */
export const HEADER = 21;
/** erase-group neighbours kept empty, so an SSD group erase never destroys another file */
export const KEEP_EMPTY: readonly number[] = [24, 57, 97];
/** P09 hits */
export const HITS = {download: 59, update: 99, temporary: 22} as const;

/* ---------------------------------------------------------------- other files: one seeded occupancy */
/** true if box `id` holds another file's Bits (seed 'ep06-wall'; ≈ 40 % of the remaining boxes; identical everywhere) */
const OCC: boolean[] = (() => {
  const out: boolean[] = new Array(N_BOXES + 1).fill(false);
  for (let id = 1; id <= N_BOXES; id++) {
    if (PHOTO.includes(id) || KEEP_EMPTY.includes(id)) continue;
    out[id] = random(`ep06-wall-${id}`) < 0.4;
  }
  return out;
})();
export const isOther = (id: number): boolean => OCC[id] === true;
export const OTHERS: readonly number[] = Array.from({length: N_BOXES}, (_, i) => i + 1).filter((id) => OCC[id]);
export const OCCUPANCY = {others: OTHERS, count: OTHERS.length, share: OTHERS.length / (N_BOXES - PHOTO.length - KEEP_EMPTY.length)} as const;

/* ---------------------------------------------------------------- SSD: the fixed seeded label → spot map */
/**
 * SSD_MAP[id] = the physical spot (0-based, 18 per row; cols 16–17 are the spare columns) holding label `id`'s data.
 * The photo's labels: 7 in the main area, 2 (060 and 098) already moved into the spare columns by housekeeping.
 * REMAP[id] = the fresh spot an overwrite of label `id` lands in (never in SSD_MAP's image, so it is truly fresh).
 */
const buildSsd = (): {map: number[]; remap: number[]} => {
  const map: number[] = new Array(N_BOXES + 1).fill(-1);
  const remap: number[] = new Array(N_BOXES + 1).fill(-1);
  const main: number[] = [];
  const spare: number[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < SPOT_COLS; c++) (c < COLS ? main : spare).push(spotOfCell(c, r));
  const shuffle = (a: number[], seed: string) => {
    const b = [...a];
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(random(`${seed}-${i}`) * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const taken = new Set<number>();
  // the photo's fresh spots: 9 main-area spots, spread over the wall (one per row band), seeded
  const fresh = [spotOfCell(13, 0), spotOfCell(2, 2), spotOfCell(14, 4), spotOfCell(6, 5), spotOfCell(11, 7), spotOfCell(1, 8), spotOfCell(7, 8), spotOfCell(15, 6), spotOfCell(4, 3)];
  PHOTO.forEach((id, i) => {
    remap[id] = fresh[i];
    taken.add(fresh[i]);
  });
  // the photo's current (old) spots: 060 and 098 in the spare columns, the rest scattered in the main area
  map[60] = spotOfCell(16, 2);
  map[98] = spotOfCell(17, 6);
  taken.add(map[60]);
  taken.add(map[98]);
  const photoMain = [spotOfCell(9, 1), spotOfCell(3, 0), spotOfCell(12, 3), spotOfCell(5, 4), spotOfCell(0, 6), spotOfCell(10, 6), spotOfCell(8, 3)];
  PHOTO.filter((id) => id !== 60 && id !== 98).forEach((id, i) => {
    map[id] = photoMain[i];
    taken.add(photoMain[i]);
  });
  // everyone else: a seeded shuffle; empty labels fill the spare columns first, so spare reads mostly empty
  const freeMain = shuffle(main.filter((s) => !taken.has(s)), 'ep06-ssd-main');
  const freeSpare = shuffle(spare.filter((s) => !taken.has(s)), 'ep06-ssd-spare');
  const rest = Array.from({length: N_BOXES}, (_, i) => i + 1).filter((id) => map[id] < 0);
  const empties = rest.filter((id) => !OCC[id]);
  const spareTakers = shuffle(empties, 'ep06-ssd-sparetakers').slice(0, 7);
  for (const id of spareTakers) map[id] = freeSpare.shift() as number;
  for (const id of rest) if (map[id] < 0) map[id] = freeMain.shift() as number;
  // fresh spots for 9 other files (remap of others: "keeps moving data around"): the remaining spare spots
  const pool = [...freeSpare];
  for (const id of rest) remap[id] = map[id];
  for (const id of shuffle(rest.filter((i) => OCC[i]), 'ep06-movers')) if (pool.length) remap[id] = pool.shift() as number;
  return {map, remap};
};
const SSD = buildSsd();
export const SSD_MAP: readonly number[] = SSD.map;
export const REMAP: readonly number[] = SSD.remap;
export const isSpareSpot = (s: number): boolean => s % SPOT_COLS >= COLS;
/** other files that `remap` can move (they have a fresh spot): use as `target: MOVERS` for "keeps moving data around" */
export const MOVERS: readonly number[] = OTHERS.filter((id) => REMAP[id] !== SSD_MAP[id]);

/* ---------------------------------------------------------------- the card (layout registered to mft-record_b) */
/**
 * The card's own coordinate frame IS mft-record_b's native px: the card face spans (100, 262)–(1195, 1000); the render
 * drawn with its top-left at (−CARD.cx, −CARD.cy) × k sits exactly on the vector card (one flash swap, then vector).
 */
export const CARD = {
  x0: 100,
  y0: 262,
  x1: 1195,
  y1: 1000,
  cx: 647.5,
  cy: 631,
  w: 1095,
  h: 738,
  r: 44,
  /** native px of mft-record_b (the render is 1254×1254) */
  render: {w: 1254, h: 1254},
  fields: {
    name: {label: [160, 454], bars: [[287, 405, 650, 503]]},
    size: {label: [160, 608], bars: [[258, 575, 650, 642]]},
    dates: {label: [160, 800], bars: [[258, 700, 650, 770], [258, 828, 650, 900]]},
    directions: {label: [700, 372], housing: [685, 396, 1162, 950]},
  },
  sockets: [
    [718, 455, 1118, 597],
    [718, 612, 1118, 754],
    [718, 768, 1118, 910],
  ],
  inserts: [
    [745, 470, 965, 582],
    [745, 628, 965, 740],
    [745, 782, 965, 892],
  ],
  /** where each thread leaves its socket */
  plug: [
    [1100, 526],
    [1100, 683],
    [1100, 839],
  ],
  /** the free/unused tab on the top edge (rises above y0) */
  tab: [760, 196, 1070, 262],
  /** mft-record_b's cyan LEDs (regraded to white when the render is shown) */
  leds: [
    [712, 488, 735, 562],
    [712, 648, 735, 720],
    [712, 800, 735, 872],
  ],
} as const;
export const cardK = (w: number): number => w / CARD.w;
export const cardH = (w: number): number => CARD.h * cardK(w);

/* ---------------------------------------------------------------- cluster-wall_b registration */
/**
 * cluster-wall_b's 6×5 bins (measured: plate columns at x 109 + 176.6·c, bin rows at y 267 + 183.75·r, native px)
 * registered onto code cols 4–9 × rows 1–5 (1-based) = boxes 004–009 … 068–073. Non-uniform scale (≈4 % squash).
 */
export const WALL_REG = {
  src: 'cluster-wall_b' as const,
  pitchX: 176.6,
  pitchY: 183.75,
  col0X: 184.5,
  row0Y: 267,
  /** code cols/rows covered (0-based) */
  col0: 3,
  row0: 0,
  cols: 6,
  rows: 5,
};
/** where to draw cluster-wall_b (world px) so its bins sit on code cols 4–9 × rows 1–5 */
export const wallRenderRect = (): {x: number; y: number; w: number; h: number; sx: number; sy: number} => {
  const sx = PITCH / WALL_REG.pitchX;
  const sy = PITCH / WALL_REG.pitchY;
  const c = boxC(idAt(WALL_REG.col0, WALL_REG.row0));
  return {x: c.x - WALL_REG.col0X * sx, y: c.y - WALL_REG.row0Y * sy, w: 1254 * sx, h: 1254 * sy, sx, sy};
};
