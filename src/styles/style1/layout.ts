/**
 * Style 1 (Bench Notebook): Frame S, the one held spread (camera locked at 1.0 for all 1,890 frames).
 * Every position in px at 1920×1080. Derived from the proposal's Frame S table, re-solved so that the
 * button route, the Lens, its ×4 chip and the tag slots never collide (see STORYBOARD.md, "Layout").
 */
import {routePath, type Pt} from '../../shared';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const right = (b: Box): number => b.x + b.w;
export const bottom = (b: Box): number => b.y + b.h;
export const centre = (b: Box): Pt => [b.x + b.w / 2, b.y + b.h / 2];

/* The spread ------------------------------------------------------------------------------------ */
export const SPREAD = {foldX0: 1276, foldX1: 1300, foldLine: 1288, rightX0: 1300};
export const PAPER = '#F6F2EA';
export const FOLD_BAND = '#E9E2D4';
export const FOLD_LINE = '#A7ABB3'; // structure at 60% on the band
export const RULE = {x0: 1300, pitch: 64, y0: 128, color: '#E2DACC', w: 2};
export const SHEET_PLATE = '#FCFAF7';
export const SHEET_EDGE = '#B4B7BC'; // structure at 50%
export const SHEET_SHADOW = '#D2CFCB'; // ink at 16% on paper
export const CARD_SHADOW = '#DBD8D3'; // ink at 12% on paper
export const DIE = '#ECE8E1'; // the chipset window's silicon (paper + a little structure)
export const PKG = '#F8F6F1'; // chipset package body
export const LID_BACK = '#DFDAD1'; // folded-up lid, its blank back
export const PENCIL_LIGHT = '#8E95A1'; // the second graphite tone

/* The machine (left page) --------------------------------------------------------------------- */
export const CASE: Box = {x: 392, y: 236, w: 860, h: 700}; // 392–1252 × 236–936
export const FRONT_INNER_X = 1244; // front panel 1244–1252

export const PSU: Box = {x: 408, y: 252, w: 240, h: 144}; // top-rear, 408–648 × 252–396
export const FLAP: Box = {x: 160, y: 252, w: 232, h: 144}; // rear face folded out, hinge on x 392
export const INLET: Box = {x: 190, y: 296, w: 52, h: 40}; // IEC C14
export const PLUG: Box = {x: 182, y: 290, w: 68, h: 54}; // seated C13 plug, 182–250 × 290–344
export const ROCKER: Box = {x: 298, y: 290, w: 38, h: 54}; // mains rocker at "I", 298–336 × 290–344
export const CORD: Pt[] = [
  [216, 344],
  [216, 736],
  [196, 736],
];
export const WALL: Box = {x: 128, y: 700, w: 68, h: 72}; // wall socket

export const BOARD: Box = {x: 416, y: 404, w: 608, h: 504}; // 416–1024 × 404–908
export const SOCKET: Box = {x: 472, y: 444, w: 312, h: 260}; // LGA1700 frame, 472–784 × 444–704
export const IHS: Box = {x: 488, y: 462, w: 280, h: 224}; // package lid, 488–768 × 462–686
export const DIMMS: Box[] = [
  {x: 798, y: 444, w: 18, h: 260},
  {x: 824, y: 444, w: 18, h: 260},
];
export const PIN24: Box = {x: 984, y: 456, w: 32, h: 112}; // 2 × 12, 984–1016 × 456–568
export const REG: Box = {x: 984, y: 600, w: 32, h: 40}; // standby regulator, 984–1016 × 600–640
export const PCIE: Box = {x: 460, y: 712, w: 288, h: 20}; // x16 slot, 460–748 × 712–732
export const REAR_IO: Box = {x: 420, y: 428, w: 40, h: 196}; // 420–460 × 428–624
export const RJ45: Box = {x: 424, y: 578, w: 32, h: 36};
export const PCH: Box = {x: 784, y: 716, w: 184, h: 168}; // chipset package, 784–968 × 716–884
export const LID: Box = {x: 788, y: 720, w: 30, h: 160}; // the lid's blank back, folded up (left)
export const WIN: Box = {x: 818, y: 726, w: 138, h: 150}; // the window, 818–956 × 726–876
export const QB: Box = {x: 828, y: 738, w: 76, h: 52}; // the "?" block, 828–904 × 738–790
export const QBADGE: Pt = [851, 764]; // centre of its 36 px badge
export const LOOK: Box = {x: 906, y: 820, w: 44, h: 44}; // the lookout, 906–950 × 820–864
export const HEADER: Box = {x: 972, y: 890, w: 44, h: 14}; // front-panel header, 972–1016 × 890–904

/* The momentary switch, in section, on the front wall */
export const BTN = {
  housing: {x: 1196, y: 588, w: 48, h: 64} as Box, // 1196–1244 × 588–652
  cap: {x: 1252, y: 598, w: 22, h: 44} as Box, // outside the front panel, 1252–1274
  stem: {x: 1220, y: 610, w: 34, h: 20} as Box, // through the panel
  travel: 8,
  contacts: [1212, 624] as Pt,
};
export const LED = {cx: 1262, cy: 566, r: 6};

/* Routes and channels (the same string draws a route and carries its Bit) */
export const BTN_ROUTE_PTS: Pt[] = [
  [1212, 624], // the contacts
  [1212, 920], // down the front of the case
  [994, 920], // along the bottom
  [994, 852], // up through the header (lead ends at y 904) and the board trace
  [950, 852], // into the lookout's right side
  [928, 842], // the lookout's centre (hidden under the block)
];
export const BTN_ROUTE = routePath(BTN_ROUTE_PTS, 8);
/** The same wire, ending where the trace meets the lookout's right edge (the S12 run stops short of it). */
export const BTN_ROUTE_TO_EDGE = routePath(BTN_ROUTE_PTS.slice(0, -1), 8);
export const LEAD = routePath(
  [
    [1212, 652],
    [1212, 920],
    [994, 920],
    [994, 904],
  ],
  8,
);
export const TRACE = routePath(
  [
    [994, 890],
    [994, 852],
    [950, 852],
  ],
  8,
);
export const END_TICK = 'M981 909L1007 909';

export const STBY_CABLE: Pt[] = [
  [648, 318],
  [1180, 318],
  [1180, 540],
  [1016, 540],
];
export const MAIN_CABLE: Pt[] = [
  [648, 350],
  [1148, 350],
  [1148, 498],
  [1016, 498],
];
export const STBY_BOARD: Pt[] = [
  [1000, 568],
  [1000, 828],
  [950, 828],
];

/* S11 wake inputs */
export const CLOCK = {cx: 858, cy: 836, r: 13};
export const CLOCK_ROUTE = 'M871 836L906 836';
export const LAN_ROUTE = routePath(
  [
    [440, 614],
    [440, 894],
    [940, 894],
    [940, 864],
  ],
  8,
);
export const SWIPE_REGION: Pt[] = [
  [972, 522],
  [1022, 522],
  [1022, 878],
  [894, 878],
  [894, 806],
  [972, 806],
];

/* The Lens (both uses: S02 on the "?", S05 on the lookout) */
export const LENS = {cx: 1000, cy: 520, d: 380, k: 4};
export const Q_CENTRE = centre(QB); // (866, 764)
/** The S02 Lens leader's target: inside the "?" block, right of its badge (so the badge stays readable). */
export const Q_TARGET: Pt = [886, 774];
export const LOOK_CENTRE = centre(LOOK); // (928, 842)

/* The pencil eye (D24 almond) docked on the lookout's lower-left corner */
export const EYE = {x: 910, y: 864, w: 40};

/* Right page ---------------------------------------------------------------------------------- */
export const SCREEN: Box = {x: 1404, y: 212, w: 300, h: 172};
export const SCREEN_NECK: Box = {x: 1540, y: 384, w: 28, h: 18};
export const SCREEN_FOOT: Box = {x: 1500, y: 402, w: 108, h: 10};

/** Notes area: 3 rows × 2 columns, each 220 × 56. */
export const NOTE_ROWS = [728, 796, 864];
export const NOTE_COLS = [1320, 1556];
export const noteBox = (n: number): Box => ({x: NOTE_COLS[(n - 1) % 2], y: NOTE_ROWS[Math.floor((n - 1) / 2)], w: 220, h: 56});

/** The S06 list sheet over the notes column. */
export const LIST: Box = {x: 1304, y: 424, w: 488, h: 508};
export const LIST_ROWS = [552, 618, 684, 750, 816, 882]; // row centres
export const LIST_SLOT_X = 1318; // 36 px slot boxes, 1318–1354
export const LIST_NAME_X = 1386;

/* The flash-forward tracing sheet over the left page */
export const SHEET: Box = {x: 128, y: 220, w: 1148, h: 712}; // 128–1276 × 220–932 (the whole left page)
export const SHEET_TAB: Box = {x: 144, y: 136, w: 372, h: 86}; // reaches into the header zone

/* Cards (S08, S09) over the left page's CPU region; the chipset, PSU, flap and plug stay clear */
export const CARD8: Box = {x: 412, y: 416, w: 492, h: 290};
export const CARD_A: Box = {x: 412, y: 416, w: 500, h: 136};
export const CARD_L: Box = {x: 432, y: 564, w: 500, h: 136};

/* S07 pencil sketch of a generic sign-in card, outside (below) the black screen */
export const SIGNIN: Box = {x: 1404, y: 418, w: 200, h: 82};
