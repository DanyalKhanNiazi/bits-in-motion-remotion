/**
 * Bits in Motion: brand tokens and constants (provisional brand, Stage A).
 * Source: Motion Brand/stage_a_files/brand_direction_provisional.md (sections 3, 4, 5, 6, 7 and the
 * kit-constants appendix), Stage A §3 and §5.7 (D24), cd_shared_rules_for_the_tests.md.
 *
 * Every value here is in px at 1920x1080 and frames at 30 fps.
 */

/* ------------------------------------------------------------------------------------------------
 * Colour tokens
 * ---------------------------------------------------------------------------------------------- */

export type ThemeName = 'dark' | 'light' | 'lightCool';

export interface Theme {
  name: ThemeName | string;
  isDark: boolean;
  /** Background. Flat, no vignette. */
  surface: string;
  /** Raised plates, schematic plate, lit card. */
  panel: string;
  /** PCB / board regions. (Light sets: derived = surface + 10% structure; not in the brand spec.) */
  board: string;
  /** Inactive outlines, channel walls, idle routes (>= 3:1). */
  structure: string;
  /** Labels of inactive parts, secondary mono lines. */
  textMuted: string;
  /** Annotation grey: leaders, dashed analogy outlines, the ≈ chip, the D24 visited mark. */
  annotation: string;
  /** Primary text and the ACTIVE part outline. */
  ink: string;
  /** Active body fill. */
  activeFill: string;
  /** Information: the Bit, held signals, data. The only colour that travels. */
  info: string;
  /** First trail square of the Bit (info at 55% dark / 70% light, precomposited on surface). */
  infoWake: string;
  /** Bit halo tone (info at 18% on surface). Dark only; light uses a surface keyline instead. */
  infoHalo: string;
  /** Energy: live main rails, heat. Fills double-walled channels, never travels as marks. */
  energy: string;
  /** Standby energy (thin channel). Dark: energy at 62%. Light: same as energy, thinner not fainter. */
  energyStandby: string;
  /** Powered-domain wash (area tint). */
  energyWash: string;
  /** Emphasis: ONLY the Lens ring, the bracket lock-on and the "?" badge, one at a time. */
  emphasis: string;
  /** Problem glyphs (! and ×). Rare. Never a fill or a flow. */
  alert: string;
  /** Hatch lines on the affected area (alert at 70%). */
  alertHatch: string;
  /** Style 1 marker highlights (light sets only). */
  markerInfo?: string;
  markerEnergy?: string;
}

/** Dark-surface tokens (brand spec §3.3). Contrast figures in the spec are against #05070F. */
export const DARK: Theme = {
  name: 'dark',
  isDark: true,
  surface: '#05070F',
  panel: '#0E121B',
  board: '#161C29',
  structure: '#626C81',
  textMuted: '#8A93A6',
  annotation: '#A9B4C9',
  ink: '#F3F2EE',
  activeFill: '#26282E',
  info: '#00E5FF',
  infoWake: '#028193',
  infoHalo: '#042F3A',
  energy: '#FFB000',
  energyStandby: '#A07006',
  energyWash: '#19150E',
  emphasis: '#EA5FFC',
  alert: '#FF5468',
  alertHatch: '#B43D4D',
};

/** Light-surface tokens on warm paper (brand spec §3.4; Style 1). */
export const LIGHT: Theme = {
  name: 'light',
  isDark: false,
  surface: '#F6F2EA',
  panel: '#FFFFFF',
  board: '#E9E6E1', // derived: #F6F2EA + 10% #737C8E (a mix of brand tokens, no new hue)
  structure: '#737C8E',
  textMuted: '#596273',
  annotation: '#596273',
  ink: '#131A2A',
  activeFill: '#FFFFFF',
  info: '#00728C',
  infoWake: '#4A98A8',
  infoHalo: '#CADBD9', // not used for a halo on light (keyline instead); = markerInfo
  energy: '#AD6000',
  energyStandby: '#AD6000',
  energyWash: '#ECDEC9',
  emphasis: '#8F1FC2',
  alert: '#C01F45',
  alertHatch: '#D05E76',
  markerInfo: '#CADBD9',
  markerEnergy: '#E9D8C0',
};

/** Light-surface tokens on the cool surface (Style 3). Only surface, board and wash differ from LIGHT. */
export const LIGHT_COOL: Theme = {
  ...LIGHT,
  name: 'lightCool',
  surface: '#EEF2F7',
  board: '#E2E6ED', // derived: #EEF2F7 + 10% #737C8E
  energyWash: '#E5DED4',
};

export const THEMES: Record<ThemeName, Theme> = {dark: DARK, light: LIGHT, lightCool: LIGHT_COOL};

export type ThemeLike = ThemeName | Theme;

export const resolveTheme = (t: ThemeLike | undefined): Theme => {
  if (!t) return DARK;
  if (typeof t === 'string') {
    const found = THEMES[t as ThemeName];
    if (!found) throw new Error(`[kit] unknown theme "${t}" (use dark | light | lightCool or a Theme object)`);
    return found;
  }
  return t;
};

/** '#RRGGBB' + alpha → 'rgba(r, g, b, a)'. */
export const withAlpha = (hex: string, a: number): string => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

const hexRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Mix two '#RRGGBB' colours: t = 0 → a, t = 1 → b (sRGB, as a renderer composites). */
export const mixColor = (a: string, b: string, t: number): string => {
  const A = hexRgb(a);
  const B = hexRgb(b);
  return (
    '#' +
    A.map((v, i) => Math.round(v + (B[i] - v) * t)
      .toString(16)
      .padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
};

const lin = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};

/** WCAG 2.x relative luminance of '#RRGGBB'. */
export const relLuminance = (hex: string): number => {
  const [r, g, b] = hexRgb(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

/** WCAG 2.x contrast ratio. */
export const contrastRatio = (a: string, b: string): number => {
  const la = relLuminance(a);
  const lb = relLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/** CIE L* (D65) of '#RRGGBB'. */
export const lightnessL = (hex: string): number => {
  const y = relLuminance(hex);
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y;
};

/**
 * Shared rules (powered-domain wash): on dark grounds the wash must be lighter than the ground and at least
 * 1.3:1 against it; on light grounds it needs ΔL* >= 10. Otherwise a 3 px annotation boundary line is required.
 */
export const washNeedsBoundary = (theme: Theme, wash: string, ground: string = theme.surface): boolean =>
  theme.isDark
    ? !(relLuminance(wash) > relLuminance(ground) && contrastRatio(wash, ground) >= 1.3)
    : Math.abs(lightnessL(ground) - lightnessL(wash)) < 10;

/** Style 3 may tint its ink toward blue, no lighter or bluer than this (brand spec §3.4). */
export const STYLE3_INK_LIMIT = '#1B2A44';

/** Role → colour, for key bars, anchors and Bits. */
export type RoleName = 'info' | 'energy' | 'standby' | 'part' | 'muted' | 'emphasis' | 'alert' | 'annotation';
export const roleColor = (theme: Theme, role: RoleName): string => {
  switch (role) {
    case 'info':
      return theme.info;
    case 'energy':
      return theme.energy;
    case 'standby':
      return theme.energyStandby;
    case 'part':
      return theme.ink;
    case 'muted':
      return theme.structure;
    case 'emphasis':
      return theme.emphasis;
    case 'alert':
      return theme.alert;
    case 'annotation':
      return theme.annotation;
    default:
      return theme.ink;
  }
};

/* ------------------------------------------------------------------------------------------------
 * Type scale (brand spec §4.2, §7.2). Families come from fonts.ts.
 * ---------------------------------------------------------------------------------------------- */

export const TYPE = {
  /** Tag primary line / name inside a part: sans 600. Must-read. */
  label: 44,
  /** Tag secondary line (technical name): mono 500. Only "+5VSB · ATX" in the ep01 intro. */
  secondary: 34,
  /** State pill: sans 600, value word in caps. */
  pill: 40,
  /** Header (scope, lane, time) at rest: sans 600, +2% tracking. */
  header: 34,
  /** A time chip while it carries the meaning ("After the press" by f8): 44 px, then 34. */
  headerActive: 44,
  /** Nothing below this, ever. */
  floor: 30,
  /** Hero word or question (3 words or fewer): sans 700, 96–120. */
  hero: [96, 120] as const,
  heroMin: 96,
  heroMax: 120,
  /** Readout numeral / unit (mono), only for numbers the narration says. */
  readout: 64,
  unit: 38,
  /** ≈ chip and scale chip (mono). Non-essential only. */
  chip: 30,
  lineHeight: 1.15,
  weight: {label: 600, pill: 600, header: 600, hero: 700, mono: 500, badge: 700},
  headerTracking: '0.02em',
  /** Max words per label / chars per line, and on-screen budgets (brand spec §4.5). */
  maxWordsPerLabel: 3,
  maxCharsPerLine: 22,
} as const;

/* ------------------------------------------------------------------------------------------------
 * Layout (brand spec §7.1)
 * ---------------------------------------------------------------------------------------------- */

export const LAYOUT = {
  width: 1920,
  height: 1080,
  /** Graphics-safe inset. */
  gfxSafe: {x: 96, y: 54},
  /** Text-safe area: 144 px inset left/right, 96 px from the top, no text below y = 940. */
  textSafe: {left: 144, right: 1776, top: 96, bottom: 940},
  /** Bottom 140 px reserved for captions and the player's controls: no labels or essential marks. */
  captionReserve: {top: 940, height: 140},
  /** Header zone, top-left: scope, lane and time headers, always in the same place. */
  header: {x0: 144, y0: 96, x1: 948, y1: 196},
  /** Keep essential text out of the top-right corner (YouTube card icon). */
  topRightKeepOut: {x0: 1560, y0: 0, x1: 1920, y1: 196},
  /** Stage band for the mechanism, and the core columns for the active path. */
  stage: {y0: 196, y1: 900},
  core: {x0: 534, x1: 1386},
  /** Label rails for dense scenes. */
  railLeft: {x0: 144, x1: 510},
  railRight: {x0: 1410, x1: 1776},
  /** 12 x 122 px columns, 24 px gutters, 96 px margins; parts snap to 8 px. */
  grid: {cols: 12, col: 122, gutter: 24, margin: 96, baseline: 8},
} as const;

/** Left x of grid column k (1..12). Column 12 ends at x = 1824. */
export const colX = (k: number): number => LAYOUT.grid.margin + (LAYOUT.grid.col + LAYOUT.grid.gutter) * (k - 1);
/** Snap to the 8 px grid. */
export const snap8 = (v: number): number => Math.round(v / 8) * 8;

/* ------------------------------------------------------------------------------------------------
 * Strokes and channels (brand spec §5.2)
 * ---------------------------------------------------------------------------------------------- */

export const STROKE = {
  inactive: 3,
  active: 4,
  route: 4,
  leader: 3,
  /** Analogy outline: 3 px annotation, dashed 12 on / 8 off. */
  analogy: 3,
  analogyDash: [12, 8] as const,
  /** Section / alert hatch: 2 px at 45°, 10 px pitch. */
  hatch: 2,
  hatchPitch: 10,
  /** Corner radii: parts 10, tags and plates 8, the Bit 5. */
  partRadius: 10,
  plateRadius: 8,
  routeBend: 8,
  channelBend: 10,
  /** Parallel signal routes and energy channels keep at least this far apart; crossing gap. */
  parallelGap: 16,
  crossGap: 6,
} as const;

export const CHANNEL = {
  /** Main power channel: 18 px outer = two 2 px walls + a 14 px fill. */
  main: {outer: 18, wall: 2, fill: 14},
  /** Standby channel: 10 px outer = two 2 px walls + a 6 px fill. */
  standby: {outer: 10, wall: 2, fill: 6},
  /** Fill-front speed and soft leading edge. */
  frontSpeed: 50,
  frontEdge: 24,
  maxFillFrames: 18,
  /** Shimmer: 90/90 px dashes drifting source → load. */
  shimmerDash: [90, 90] as const,
  shimmerSpeedMain: 2,
  shimmerSpeedStandby: 1,
  drainFrames: 8,
  washFadeFrames: 8,
} as const;

/* ------------------------------------------------------------------------------------------------
 * The Bit (brand spec §6.1; Stage A §3.5, §3.8)
 * ---------------------------------------------------------------------------------------------- */

export const BIT = {
  size: 24,
  radius: 5,
  /** Dark: stepped halo squares [size px, opacity]. Never blur. */
  halo: [
    [40, 0.18],
    [64, 0.09],
  ] as ReadonlyArray<readonly [number, number]>,
  /** Light: no halo; a 2 px surface-colour keyline. */
  keyline: 2,
  trailSizes: [18, 14, 11, 8] as const,
  trailOpacityDark: [0.55, 0.38, 0.24, 0.12] as const,
  trailOpacityLight: [0.7, 0.5, 0.32, 0.18] as const,
  trailPitch: 30,
  trailCollapse: 6,
  /** Speed: cruise 24 px/frame (720 px/s), maximum 36. */
  cruise: 24,
  maxSpeed: 36,
  /** 4-frame ease-in, linear cruise, 5-frame cubic ease-out. */
  accel: 4,
  decel: 5,
  /** Each hop >= 10 frames; a single run <= 30 frames. */
  minHop: 10,
  maxRun: 30,
  /** Landing ripple: square outline 24 → 80 px, stroke 3 → 1.5, opacity 0.9 → 0 over 10 frames. */
  ripple: {from: 24, to: 80, frames: 10, strokeFrom: 3, strokeTo: 1.5, opacityFrom: 0.9},
  /** Parked (DRIVING): scale 1.00 → 1.10 → 1.00 over 48 frames, halo 18 → 28%. */
  breathe: 48,
  breatheScale: 0.1,
  /** Absorbed into the ripple when it does not park (no park at f59). */
  absorbFrames: 3,
  maxOnScreen: 3,
  /** Split / merge children. */
  childSize: 20,
} as const;

/* ------------------------------------------------------------------------------------------------
 * The Lens (brand spec §6.2) and the D24 hand-over (Stage A §5.7)
 * ---------------------------------------------------------------------------------------------- */

export const LENS = {
  d: 360,
  dMin: 300,
  dMax: 420,
  stroke: 4,
  /** 4 inward ticks at 12, 3, 6 and 9 o'clock, 14 x 4 px. */
  ticks: 4,
  tickLength: 14,
  tickWidth: 4,
  /** Open: 9 frames; ring draws clockwise from 12 o'clock, radius 70 → 100% (cubic ease-out),
   *  content fades in over frames 3–9, ticks pop at frames 6–8. */
  open: 9,
  openRadiusFrom: 0.7,
  contentFrom: 3,
  ticksFrom: 6,
  ticksTo: 8,
  /** Close: 6 frames, radius 100 → 85%, opacity 1 → 0, ease-in. */
  close: 6,
  closeRadiusTo: 0.85,
  dive: 16,
  surface: 14,
  minHold: 45,
  magnify: [4, 8] as const,
  /** Magnify leader: 3 px, emphasis at 70%, to a 10 px target square. */
  leader: 3,
  leaderOpacity: 0.7,
  target: 10,
  /** D24 settle / hand-over: ring and ticks fade to a grey rim (default 6 frames), then the "?" fills. */
  settle: 6,
  rimStroke: 3,
  /** Scale chip ("×6", mono 30 px) outside the ring at 4:30. */
  chipAngleDeg: 135,
  /** Max uses (brand rule): one at a time, at most twice a minute. */
  maxPerMinute: 2,
} as const;

/* ------------------------------------------------------------------------------------------------
 * Labels (brand spec §4.1, §4.4, §4.5)
 * ---------------------------------------------------------------------------------------------- */

export const LABEL = {
  anchor: 8,
  leader: 3,
  leaderMin: 40,
  leaderMax: 200,
  keyBar: 4,
  keyGap: 12,
  platePad: 10,
  plateRadius: 8,
  plateOpacity: 0.9,
  /** Timing relative to t0 (the start frame of the word that names the thing). */
  anchorPop: [-6, -2] as const,
  leaderDraw: [-5, -1] as const,
  enter: [0, 5] as const,
  slide: 8,
  secondaryDelay: 4,
  /** Hold: until the sentence ends + 15 frames, and at least 30 + 9 x words frames. */
  holdBase: 30,
  holdPerWord: 9,
  holdAfterSentence: 15,
  exitFrames: 6,
  maxTags: 3,
  maxPills: 2,
  maxHeaders: 1,
  maxWords: 12,
  syncTolerance: 3,
  /** State pill: capsule docked 8 px outside the part's top-right corner, 4-frame flip. */
  pillDock: 8,
  pillBorder: 2,
  pillPadX: 18,
  pillPadY: 4,
  pillFlip: 4,
  /** Header: 2 px rule under it. */
  headerRule: 2,
  headerRuleGap: 6,
} as const;

/* ------------------------------------------------------------------------------------------------
 * Glyphs (brand spec §4.1, §5.7; D24)
 * ---------------------------------------------------------------------------------------------- */

export const GLYPH = {
  /** State pips: OFF hollow / ON filled / ALWAYS-ON breathing / RESET crossed, 12 px squares. */
  pip: 12,
  pipStroke: 2,
  /** Docked 8 px outside the part's top-right corner. */
  dock: 8,
  /** ALWAYS-ON breathing: opacity 70 ↔ 100% over 60 frames. */
  breathePeriod: 60,
  breatheMin: 0.7,
  /** RESET: a 2 px bar that extends 6 px each side. */
  resetBar: 2,
  resetOverhang: 6,
  /** WAITING ‖, LIMIT !, FAULT ×: 24 px rounded badges (glyphs drawn as vectors). */
  badge: 24,
  badgeRadius: 6,
  badgeStroke: 2,
  /** The "?" badge: 36 px rounded square, radius 8, 3 px emphasis outline, "?" in sans 700.
   *  The brand spec says a 28 px "?"; the kit uses 30 px to respect the 30 px floor. */
  qBadge: 36,
  qRadius: 8,
  qStroke: 3,
  qFont: 30,
  qFillFrames: 6,
  /** ≈ chip (vector glyph; the font subset has no U+2248). */
  approxChip: {w: 32, h: 28, r: 6, stroke: 2},
  /** Eye badge (almond with a pupil). */
  eye: {w: 72, aspect: 0.56, stroke: 3, pupil: 0.27},
  /** D24 visited mark: 3 px annotation-grey outline with a hollow pip. */
  visitedStroke: 3,
  /** Flip timing for state changes. */
  flipFrames: 5,
} as const;

/* ------------------------------------------------------------------------------------------------
 * Emphasis lock-on (brand spec §4.1)
 * ---------------------------------------------------------------------------------------------- */

export const BRACKETS = {
  stroke: 4,
  /** The two ticks (serifs) at each end of a bracket. */
  serif: 14,
  pad: 8,
  from: 24,
  snapFrames: 5,
  maxOvershoot: 0.06,
  fadeFrames: 6,
  minGapFrames: 300,
} as const;

/** Easing control points (brand spec §6.3); the functions live in motion.ts. */
export const EASE_POINTS = {
  arrive: [0.16, 1, 0.3, 1] as const,
  move: [0.65, 0, 0.35, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
} as const;

/** Dark styles: mean luma of the picture area at or above about 28/255 (Rec.709 luma). */
export const LUMA_FLOOR = 28;
