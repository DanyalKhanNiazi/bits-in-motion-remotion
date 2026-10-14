/**
 * Ep06 kit: the look. Palette roles (from the engine COLOR), Ep06 materials sampled from the owner's renders, the type
 * scale and text roles, motion presets and the shared grade. Every section uses these, so the film reads as one piece.
 * Colour roles (DIRECTION §2.5): cyan = the photo's data and its directions only; amber = the drive's own action;
 * coral = loss and danger; magenta = emphasis, sparingly; everything else is navy structure and ink.
 */
import {Easing} from 'remotion';
import {COLOR} from '../../engine/tokens';
import {EASE6} from '../../engine/core/ease';
import type {EaseFn, Spring} from './util';
export {SANS, MONO} from '../../shared/fonts';

export const W = 1920;
export const H = 1080;
export const FPS = 30;

/** Palette. Grounds and ink come straight from the Signal Atlas tokens. */
export const PAL = {
  // grounds, deepest first
  void: COLOR.void,
  field: COLOR.field,
  deck: COLOR.deck,
  board: COLOR.board,
  body: COLOR.body,
  bodyHi: COLOR.bodyHi,
  side: COLOR.side,
  night: '#0A1426',
  // lines and text
  ink: COLOR.ink,
  muted: COLOR.textMuted,
  annotation: COLOR.annotation,
  structure: COLOR.structure,
  detail: COLOR.detail,
  rim: COLOR.rim,
  // roles
  /** information and data: the Bit, crates' light, streaming text. The only colour that travels. */
  info: COLOR.info,
  infoWake: COLOR.infoWake,
  infoDeep: '#0A4E63',
  infoPale: '#9FF4FF',
  /** energy and power: the power-cap dial and the die's power. */
  energy: COLOR.energy,
  energyHot: COLOR.energyShimmer,
  energyDeep: COLOR.energyStandby,
  /** problem or wait (coral). */
  wait: COLOR.alert,
  waitDeep: COLOR.alertHatch,
  /** emphasis only, sparingly: the Lens ring, a "?" accent. */
  emphasis: COLOR.emphasis,
  // materials (matched to the T03 renders)
  tile: '#F6F7F9',
  tileMid: '#E3E7EE',
  tileEdge: '#B4BCCA',
  tileInk: '#14203A',
  silver: '#C7CDD6',
  silverDark: '#7E8796',
  gold: '#D6A03E',
  goldDark: '#8A6424',
  computeBlue: '#2C4C86',
  computeBlueHi: '#5B82C9',
  hbmLayer: '#141B29',
  screen: '#0D1422',

  /* ---- Ep06 roles (aliases: say what a colour MEANS) */
  /** the photo's Bits and the card→box directions. NOTHING else is cyan. */
  photo: COLOR.info,
  photoPale: '#9FF4FF',
  photoDeep: '#0A4E63',
  /** the drive's own action: housekeeping sweep, disposable tags, the chip, sanitize pulse, clock, key */
  drive: COLOR.energy,
  driveHot: COLOR.energyShimmer,
  driveDeep: COLOR.energyStandby,
  /** loss and danger: strike-through, unused tab, writes on the photo's boxes, refusals, the write tally */
  loss: COLOR.alert,
  lossDeep: COLOR.alertHatch,
  /** other files' Bits (white/grey) and old grey Bits */
  otherBit: '#E3E7EE',
  oldBit: '#7D8797',

  /* ---- Ep06 materials, sampled from cluster-wall_b / index-drawer_b / mft-record_b / ssd-board_b / erase-block-tray_b */
  /** navy steel of the wall's rails and posts (lit top, mid, shadow) */
  steelHi: '#6A7C93',
  steel: '#3F4E5F',
  steelLo: '#253140',
  /** inside a bin (top in shadow, back wall) */
  binDeep: '#0E141D',
  binBack: '#1C2633',
  binSide: '#2A3646',
  /** the brushed silver inserts (number plates) */
  plateHi: '#E6E3DE',
  plate: '#BFBAB5',
  plateLo: '#8E8A86',
  plateInk: '#2A3140',
  /** SSD graphite cells and the erase-group tray */
  graphiteHi: '#5A5D64',
  graphite: '#3A3D44',
  graphiteLo: '#1C1E23',
  trayEdge: '#0A0C0F',
  /** drawer body (graphite-navy) */
  drawerHi: '#4B5A73',
  drawer: '#2B3649',
  drawerLo: '#161D2A',
  /** index-card paper (lit, mid, shade) and its rules */
  paper: '#F4F2EE',
  paperMid: '#E4E0DA',
  paperShade: '#C9C3BB',
  paperRule: '#B9C4D6',
  /** Windows UI (generic, dark) */
  winBody: '#161D2B',
  winBar: '#1E2738',
} as const;

/** Colour roles by meaning (DIRECTION.md). */
export const ROLE = {data: PAL.photo, photo: PAL.photo, drive: PAL.drive, energy: PAL.energy, loss: PAL.loss, wait: PAL.wait, emphasis: PAL.emphasis, text: PAL.ink, structure: PAL.structure} as const;

/** Type scale at 1080p (hard floors from DIRECTION.md). */
export const TS = {
  /** footnotes: ≥ 30 px, ≤ 6 words */
  footnote: 32,
  /** must-read labels: ≥ 40 */
  labelMin: 40,
  label: 44,
  labelBig: 52,
  /** keywords 64–120 */
  keywordMin: 64,
  keyword: 96,
  keywordMax: 120,
  /** re-hook question cards */
  question: 100,
  /** hero numbers 160–320 */
  heroMin: 160,
  hero: 220,
  heroMax: 320,
  /** chat UI text (screen px) */
  chat: 40,
  /** decor (box numbers, UI chrome): never above 24 px on screen */
  decorMax: 24,
  lineHeight: 1.12,
} as const;

/**
 * Text roles (DIRECTION §5): the on-screen size range at 1080p. The kit multiplies size × camera zoom × panel scale
 * and logs `[kit] text below floor` (or above the ceiling) and `[kit] world text without screen`.
 */
export const TEXT_ROLES = {
  hero: {min: 160, max: 320},
  keyword: {min: 64, max: 120},
  label: {min: 40, max: 96},
  chip: {min: 40, max: 72},
  footnote: {min: 30, max: 36},
  decor: {min: 8, max: 24},
} as const;
export type TextRole = keyof typeof TEXT_ROLES;

/** Safe areas: 64 px margins and the bottom 140 px kept clear of must-read text. */
export const SAFE = {x0: 64, y0: 64, x1: 1856, y1: 940, bottomKeepOut: 140} as const;

/** Easing presets (bezier). The engine's token curves are included. */
export const EASE = {
  ...EASE6,
  /** camera moves between holds */
  cam: Easing.bezier(0.45, 0, 0.2, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  out: Easing.bezier(0.22, 1, 0.36, 1),
  outExpo: Easing.bezier(0.16, 1, 0.3, 1),
  inExpo: Easing.bezier(0.7, 0, 0.84, 0),
  inCubic: Easing.bezier(0.55, 0, 1, 0.45),
  outBack: Easing.bezier(0.34, 1.56, 0.64, 1),
  /** whip pans: violent middle, soft ends */
  whip: Easing.bezier(0.85, 0, 0.15, 1),
} as const satisfies Record<string, EaseFn>;
export type EaseKey = keyof typeof EASE;

/** Spring presets (remotion spring configs). */
export const SPRING = {
  /** pops with a clear overshoot (≈12 %) and settle */
  pop: {damping: 11, stiffness: 170, mass: 0.7},
  /** snap into place: fast, small overshoot (tiles, labels) */
  snap: {damping: 15, stiffness: 300, mass: 0.55},
  /** heavy objects: slower, a thud and a settle */
  heavy: {damping: 14, stiffness: 120, mass: 1.5},
  /** soft follow-through (camera-like) */
  soft: {damping: 22, stiffness: 80, mass: 1},
  /** bouncy (use rarely) */
  bounce: {damping: 7, stiffness: 160, mass: 0.8},
  /** text slam: very fast with an under-shoot squash */
  slam: {damping: 12, stiffness: 340, mass: 0.6},
} as const satisfies Record<string, Spring>;

/** The shared grade: one look across every environment. */
export const GRADE = {
  vignette: 0.62,
  grain: 0.075,
  bloom: 0.75,
  bloomRadius: 9,
} as const;

/** Phone check: a 390 px wide player shows 1920 px at this scale. */
export const PHONE_SCALE = 390 / 1920;
