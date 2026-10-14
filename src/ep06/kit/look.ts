/**
 * Ep03 kit: the look. Palette roles (from the engine COLOR), type scale, motion presets and the shared grade.
 * Every section uses these, so the film reads as one piece.
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
} as const;

/** Colour roles by meaning (DIRECTION.md). */
export const ROLE = {data: PAL.info, energy: PAL.energy, wait: PAL.wait, emphasis: PAL.emphasis, text: PAL.ink} as const;

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
  lineHeight: 1.12,
} as const;

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
