/**
 * Ep06 UI kit: measured regions for the render-based props (NATIVE asset px, the PNG's own grid; measured with PIL on
 * gridded crops and colour masks, 14 Oct 2026), plus the desk-monitor slot scale.
 * Quads are [TL, TR, BR, BL]. Use with propPoint() / quadMatrix(), or the *Anchors() helpers of each component.
 */
import type {Quad} from '../util';
import type {Region} from '../assets';

export type Box = readonly [number, number, number, number];
const ell = (cx: number, cy: number, rx: number, ry: number): Region => ({shape: 'ellipse', cx, cy, rx, ry});
const quadPoly = (q: Quad): Region => ({shape: 'poly', pts: q.map((p) => [p[0], p[1]] as const)});

export const UI_REGIONS = {
  /* recycle-folder_a (1254²) */
  /** the photo card standing in the folder (outer edge; its lower-left corner hides behind the front wall) */
  binCard: [[302, 308], [600, 234], [705, 598], [398, 580]] as Quad,
  /** the card's light window, where the passport thumbnail is composited (square, ≈ 265 px a side) */
  binWindow: [[330, 323], [587, 260], [660, 513], [403, 576]] as Quad,
  /** the folder's front-wall top edge (left part), for clipping things that drop into the folder */
  binFrontEdge: [[110, 518], [460, 598], [505, 655], [600, 680]] as ReadonlyArray<readonly [number, number]>,

  /* recovery-scanner_a (1254²) */
  scanLens: ell(530, 365, 140, 46),
  scanLensRing: ell(528, 378, 168, 76),
  /** where the beam leaves the lens (underside of the ring) */
  scanBeamOrigin: [528, 436] as const,
  /** the blank record plate under the lens */
  scanPlate: [[400, 550], [718, 632], [593, 762], [275, 680]] as Quad,
  /** the destination tray's rim (a separate unit: the "other drive") */
  scanTray: [[955, 645], [1230, 715], [1000, 1050], [695, 950]] as Quad,
  /** a card standing in the tray's middle slot (parallel to the dividers) */
  scanTrayCard: [[842, 520], [1072, 602], [1072, 912], [842, 830]] as Quad,
  /** status LED slit on the tray's silver front plate */
  scanTrayLed: [716, 1084, 786, 1094] as Box,
  /** baked cyan knob rings, regraded to white (x0, y0, x1, y1) */
  scanCyan: [
    [111, 329, 162, 445],
    [171, 663, 230, 711],
    [559, 801, 620, 850],
    [722, 301, 757, 379],
  ] as readonly Box[],

  /* trim-notice_b (1254²) */
  /** baked cyan stripe on the sleeve's left edge, regraded to magenta */
  trimStripe: [90, 455, 119, 624] as Box,
  /** the baked magenta tab at the board's lower edge */
  trimTab: [830, 1068, 988, 1092] as Box,
  /** front card's visible face above the sleeve lip (decor box numbers go here) */
  trimCardFace: [222, 384, 1030, 512] as Box,

  /* encryption-key_a (1254²) */
  /** the loose key, padded (only transparent px around it) */
  keyPoly: [
    [1040, 372], [1160, 372], [1222, 420], [1222, 480], [1205, 525], [1180, 560], [1140, 575], [1060, 575], [1010, 590],
    [965, 625], [910, 650], [880, 668], [820, 684], [770, 668], [765, 630], [780, 595], [815, 570], [860, 540], [900, 512],
    [940, 480], [960, 440], [990, 400],
  ] as ReadonlyArray<readonly [number, number]>,
  keyBox: [765, 372, 1222, 684] as Box,
  /** blade tip (enters the slot first) and bow centre */
  keyTip: [784, 648] as const,
  keyBow: [1120, 470] as const,
  /** default slot: the long groove beside the data tray's tiles (the blade lies along it, rotated −7°) */
  keySlot: [900, 960] as const,
  keySlotRot: -7,
  /** the 8-tile data tray's tile field */
  keyTiles: [[470, 698], [1010, 835], [760, 1020], [318, 810]] as Quad,
  /** baked cyan LEDs (case latch, key), regraded to amber */
  keyCyan: [
    [502, 557, 553, 589],
    [969, 478, 1024, 517],
  ] as readonly Box[],

  /* fictional-passport_a (desk, 3/4) and _b (screen, frontal) */
  passA_card: [[348, 305], [865, 168], [1198, 890], [605, 1078]] as Quad,
  passA_photo: [[443, 322], [823, 236], [997, 630], [595, 745]] as Quad,
  passB_card: [[434, 209], [1048, 209], [1048, 1113], [434, 1113]] as Quad,
  passB_photo: [[523, 277], [958, 277], [958, 725], [523, 725]] as Quad,
} as const;

export const quadRegion = quadPoly;
