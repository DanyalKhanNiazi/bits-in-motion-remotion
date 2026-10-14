/**
 * Signal Atlas (style6): design tokens.
 *
 * The single source of numbers for src/engine/, src/icons/ and src/styles/style6/. The spec that explains every
 * value is docs/style6/STYLE_BIBLE.md (section numbers in the comments, e.g. "§4.2").
 *
 * Units: px at 1920x1080 SCREEN space unless a name says "world" (world px = screen px at camera zoom 1).
 * Time: absolute frames at 30 fps. Plain constants only: no imports, no side effects, no functions.
 * Contrast figures are WCAG 2.x ratios; "luma" is Rec.709 luma (0-255) of the sRGB value, as tools/stills.mjs measures.
 */

/* ------------------------------------------------------------------------------------------------
 * 1. Identity and frame (§1, §13)
 * ---------------------------------------------------------------------------------------------- */

export const STYLE_ID = 'SignalAtlas' as const;
export const STYLE_NUMBER = 6 as const;
export const STYLE_NAME = 'Signal Atlas' as const;

export const FRAME = {
  fps: 30,
  width: 1920,
  height: 1080,
  /** The Ep01 intro: f0-f1889. */
  introFrames: 1890,
  /** YouTube portrait player width used for every legibility check (§13). */
  phoneWidth: 390,
  /** 390 / 1920 */
  phoneScale: 0.203125,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 2. Palette: one dark set, matched to the thumbnails' navy-black ground (§4)
 *    Contrast notes are against `board` (#1A2742) unless stated.
 * ---------------------------------------------------------------------------------------------- */

export const COLOR = {
  // Grounds, deepest to highest. Luma in brackets.
  /** Outside the "later" window, scrims, plate shadows. (10.9) */
  void: '#070B15',
  /** Living-field base: everything beyond the world. (22.6) */
  field: '#0F1729',
  /** Case interior / tray, and the ground of plates and bands. (31.5) */
  deck: '#15203A',
  /** PCB. (38.2) */
  board: '#1A2742',
  /** Plastic tops: slots, connectors, headers, sockets. (43.3) */
  bodyLo: '#1F2C48',
  /** Package and box tops (unpowered): chipset, PSU, front panel. (51.0) 1.19:1 on board. */
  body: '#26344F',
  /** Metal tops: CPU heat spreader, button cap, monitor bezel. (61.0) 1.39:1 on board. */
  bodyHi: '#2F3E5C',
  /** 2.5D extrusion side faces (§6.4). (15.6) */
  side: '#0A101C',
  /** Case outline: structure that carries no meaning. 1.63:1. */
  deckEdge: '#3A4866',

  // Lines and text.
  /** Inactive outlines, channel walls, idle routes. 5.37:1 on board, 6.46 on field, 4.50 on body. */
  structure: '#8F9CB5',
  /** Labels of inactive parts, secondary mono lines, "pointed at" outlines. 7.44:1. */
  textMuted: '#AEB8CB',
  /** Leaders, dashed analogy outlines, the ≈ chip, the visited mark, plate double rules. 9.20:1. */
  annotation: '#C3CCDD',
  /** Primary text and the ACTIVE part outline. 13.27:1 (14.42 on deck, 17.56 on void). */
  ink: '#F3F2EE',
  /** Non-meaningful interior detail (pins, chips on a DIMM, fan blades): 2.11:1 on body. */
  detail: '#53648A',
  /** Top-edge rim light, drawn at RIM.opacity (§6.4). Material, never "power". */
  rim: '#B4C5E0',

  // Roles.
  /** Active (powered, running) body fill. 1.63:1 against body. */
  activeFill: '#41537A',
  /** Information: the Bit, held signal levels, data. The only colour that travels. 9.66:1. */
  info: '#00E5FF',
  /** First trail square / route-light tail (info 55% over board). */
  infoWake: '#0C90AA',
  /** Bit halo steps: info 18% and 9% over board (flat squares, never blur). */
  infoHalo1: '#154964',
  infoHalo2: '#183853',
  /** Energy: live main rails. Fills double-walled channels, never travels as marks. 8.11:1. */
  energy: '#FFB000',
  /** Standby trickle (thin channel). 4.34:1. */
  energyStandby: '#B8800A',
  /** Standby shimmer dash. Round 1: #DC9805 (ΔL* 10.1) → #EEAA16 (ΔL* 16.6 against energyStandby): the standby line
   *  must read as live on a phone, at its idle level too (§8.3). */
  standbyShimmer: '#EEAA16',
  /** Main-rail shimmer dash over `energy` (not used in the Ep01 intro: main rails stay empty). */
  energyShimmer: '#FFC94D',
  /** Powered-domain wash: board + 16% energy. 1.37:1 and lighter than board: no boundary needed. */
  energyWash: '#3F3D37',
  /** Emphasis: ONLY the Lens ring, the bracket lock-on and the "?" badge, one at a time. 5.34:1. */
  emphasis: '#EA5FFC',
  /** Problem glyphs (! ×). Rare. Never a fill or a flow. 4.76:1. */
  alert: '#FF5468',
  alertHatch: '#B43D4D',

  // Living field (§5).
  /** Atlas grid dots (opacity from FIELD.grid). 3.30:1 on field at full opacity. */
  gridDot: '#566A92',
  /** Deep-circuit traces on the far layer. Round 1: #1C2842 (1.22:1) vanished at 480p; 1.33:1 on field. Round 3
   *  (judges: the field still vanished on a phone): #24345A, 1.5:1 on field. */
  deepTrace: '#24345A',
  /** "Current" pulses running along the deep-circuit traces (round 1: the field's visible life). A cool steel blue,
   *  never cyan (cyan is information and travels only as the Bit) and never amber (energy never marks the field).
   *  Round 3: #6A8CC8 → #7C9FDA (the heads read at 390 px). */
  fieldPulse: '#7C9FDA',
  /** Round 3, the trickle (S10 "a small trickle … keeps flowing"): the narrated standby flow's sparse dashes, a pale
   *  amber inside the thin standby fill (never wider than the fill: the line stays thin and dim, red line 8). */
  standbyTrickle: '#FFD27A',

  // True colours (§4.5).
  /** A monitor screen that is off. Always this in Ep01. */
  screenBlack: '#04060B',
} as const;

export type ColorName = keyof typeof COLOR;

/** Opacities used with the palette (flat composites, never blur). */
export const ALPHA = {
  /** Faked glow on the ONE narrated active part: a second outline at 3x width (§6.6). */
  glow: 0.2,
  /** Rim light on top-left edges of raised parts. */
  rim: 0.3,
  /** Scrim over the world behind a plate row (S06). Critic: 0.55 mocked at 26.4 mean luma in S06 (under the floor);
   *  0.45 with the taller row6 plates mocks at 30.6. Never lighten the plates' grounds instead. */
  scrim: 0.45,
  /** Flat plate shadow. */
  shadow: 0.6,
  /** Label knockout (§10.3): the world's flat fills redrawn under the text box, so it is exact and opaque. */
  plate: 1,
  /** Lens leader. */
  lensLeader: 0.7,
  /** Grid outside the "later" window (relative to inside). */
  outsideWindowGrid: 0.4,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 3. Type (§10). Families come from src/shared/fonts.ts (Sora 600/700, JetBrains Mono 500).
 * ---------------------------------------------------------------------------------------------- */

export const TYPE = {
  /** Tag primary line / name inside a part or plate. Must-read. Sora 600. */
  label: 44,
  /** Technical secondary line (mono 500): a technical name under a beginner name ("always-on logic" under "Lookout").
   *  Round 4 (judges: 6–7 px on a 390 px phone): 34 → 40, the supporting-text floor (8.1 px on a phone). */
  secondary: 40,
  /** State pill (Sora 600, value in caps). Round 3 (judges: 8 px on a phone): 40 → 44, the must-read size. */
  pill: 44,
  /** Round 3: the chip's scope line ("Intel desktop") under the time chip: supporting text, never replacing the time.
   *  Round 4: 36 → 40 (the supporting-text floor). */
  chipScope: 40,
  /** Round 3: a part name inside a plate ("Chipset", "Battery"). Round 4 (style guide §12, answer text is must-read: the
   *  names carry half of probe 5's answer): 36 → 44, the must-read size. */
  partName: 44,
  /** Time/scope chip while it carries the meaning, then at rest. Round 1 (phone): 44/34 read as 8.9/6.9 px on a 390 px
   *  player; 52/44 keep the time grammar readable on a phone (10.6/8.9 px). */
  chipActive: 52,
  chipRest: 44,
  /** Plate / band captions (Sora 600). */
  caption: 44,
  /** Readout numeral and unit (mono). Round 1: the unit 38 → 44 (7.7 px on a phone was below must-read). */
  readout: 64,
  unit: 44,
  /** Scale chip (mono). Supporting only. Round 2: 30 → 36 (6 px on a phone). Round 4: 36 → 40 (supporting floor). */
  chip: 40,
  /** "?" glyph inside the badge (Sora 700). */
  qGlyph: 34,
  qGlyphSubject: 44,
  /** Hero words (≤ 3 words, Sora 700). Not used in the Ep01 intro. */
  heroMin: 96,
  heroMax: 120,
  /** Nothing below this, ever. */
  floor: 30,
  /** Round 4 (judges: sublines, "Chipset", "Battery" and the scope line were 6–7 px on a phone): any text meant to be
   *  read is at least this (8.1 px on a 390 px phone); answer text is TYPE.label (44). */
  supportingMin: 40,
  lineHeight: 1.15,
  weight: {label: 600, pill: 600, chip: 600, caption: 600, hero: 700, glyph: 700, mono: 500},
  chipTracking: '0.02em',
  maxWordsPerLabel: 3,
  maxCharsPerLine: 22,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 4. Layout and safe areas (§13)
 * ---------------------------------------------------------------------------------------------- */

export const LAYOUT = {
  gfxSafe: {x0: 96, y0: 54, x1: 1824, y1: 1026},
  textSafe: {x0: 144, y0: 96, x1: 1776, y1: 940},
  /** Bottom 140 px: captions and player controls. At a hold only grounds (field, case tray, board) and the dark 2.5D
   *  side faces may appear here: no label, Bit, route, channel, plate or part top face (§13.1, critic change C3). */
  captionBand: {y0: 940, y1: 1080},
  /** Last screen y for any label, Bit, route, channel, plate or part TOP FACE at a hold. */
  meaningBottom: 932,
  /** Header zone: the time/scope chip lives at (144, 96), always. */
  header: {x0: 144, y0: 96, x1: 948, y1: 196},
  chipOrigin: {x: 144, y: 96},
  topRightKeepOut: {x0: 1560, y0: 0, x1: 1920, y1: 196},
  railLeft: {x0: 144, x1: 510},
  railRight: {x0: 1410, x1: 1776},
  grid8: 8,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 5. Strokes, radii, channels (§6, §8). Screen px: the engine divides by camera zoom (non-scaling).
 * ---------------------------------------------------------------------------------------------- */

export const STROKE = {
  /** Inactive part outline. */
  part: 3,
  /** Board, PSU, case front, monitor silhouettes at zoom < 1.2. */
  silhouette: 3,
  /** Active (powered) part outline. */
  active: 4,
  /** Non-meaningful interior detail. Never carries meaning. */
  detail: 2,
  /** Signal route (idle structure grey, lit info behind the Bit). */
  route: 4,
  leader: 3,
  /** Analogy outline: dashed 12 / 8. */
  analogy: 3,
  analogyDash: [12, 8] as const,
  /** Plate rule (held), active rim, double-rule inner line. */
  plateRule: 3,
  plateRim: 4,
  plateInner: 2,
  /** Rim light line. */
  rim: 2,
  /** End tick at a wire's end (03's net trace). */
  endTick: 3,
  endTickLength: 14,
  hatch: 2,
  hatchPitch: 10,
} as const;

export const RADIUS = {
  /** Part corners in world px (scale with zoom). */
  part: 10,
  block: 6,
  /** Screen px. */
  plate: 12,
  tagPlate: 8,
  bit: 5,
  pill: 999,
  window: 16,
} as const;

export const CHANNEL = {
  /** Main rail: 18 px outer = 2 + 14 + 2. */
  main: {outer: 18, wall: 2, fill: 14},
  /** Standby: 10 px outer = 2 + 6 + 2. Thin by rule (guardrails). */
  standby: {outer: 10, wall: 2, fill: 6},
  /** Bend radius (world px). */
  bend: 10,
  /** Fill-front: px/frame and a 3-step leading edge (no gradients). */
  frontSpeed: 50,
  frontSteps: [0.66, 0.33, 0.1] as const,
  frontStepPx: 8,
  maxFillFrames: 18,
  /** Shimmer v2 (§8.3): dashes and speed (px/frame) toward the load. Only while the voice talks about flow. */
  shimmerDash: [48, 48] as const,
  shimmerSpeedStandby: 1.5,
  shimmerSpeedMain: 3,
  /** Round 1: a full standby channel always shimmers at this level (it IS live in soft-off: a sign of standby life on
   *  the board during holds); a narrated-flow shimmer event raises it to 1. */
  shimmerIdleStandby: 0.5,
  /** Round 3 (judges: on "a small trickle" nothing visibly flowed): a narrated standby flow can run as a TRICKLE: sparse
   *  short dashes of `standbyTrickle` (dash, gap px) at `trickleSpeed` px/frame toward the load, over the idle shimmer,
   *  inside the 6 px fill (the line never widens or brightens as a whole). */
  trickleDash: [16, 56] as const,
  trickleSpeed: 2.6,
  /** Drain: retreat to the source at this speed, or an 8-frame fade. */
  drainSpeed: 50,
  drainFrames: 8,
  washFadeFrames: 8,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 6. Easing (§11.1). Cubic-bezier control points [x1, y1, x2, y2]; the engine builds the functions.
 *    Peak slope and overshoot were measured numerically.
 * ---------------------------------------------------------------------------------------------- */

export const EASE_BEZIER = {
  /** Entrances, landings, label settles. t50 = 0.10, t90 = 0.33. (brand) */
  arrive: [0.16, 1, 0.3, 1],
  /** Symmetric camera moves between holds; Lens dive; split slides. Peak slope 2.86. (brand) */
  move: [0.65, 0, 0.35, 1],
  /** Exits, 4-6 frames. (brand) */
  exit: [0.4, 0, 1, 1],
  /** Camera that follows a Bit: soft start, long settle. t50 = 0.35. */
  carry: [0.45, 0, 0.15, 1],
  /** Pause glides between framings: quick start, long tail. t50 = 0.29. */
  glide: [0.33, 0, 0.12, 1],
  /** Plate lift-and-fly (peel). t50 = 0.12. */
  peel: [0.2, 0.9, 0.25, 1],
  /** Plate return / fold / window expand. t50 = 0.39. */
  settle: [0.5, 0, 0.2, 1],
  /** Brackets ONLY: 4.1% overshoot (brand cap 6%). */
  snap: [0.3, 1.35, 0.55, 1],
  /** Chip text roll and label mask reveal. */
  roll: [0.25, 0.8, 0.3, 1],
  linear: [0, 0, 1, 1],
} as const;

export type EaseName = keyof typeof EASE_BEZIER;

/* ------------------------------------------------------------------------------------------------
 * 7. Durations (frames) and stagger (§11.2)
 * ---------------------------------------------------------------------------------------------- */

export const DUR = {
  stateFlip: 5,
  pillFlip: 4,
  tagAnchor: 4, // t0-6 → t0-2
  tagLeader: 4, // t0-5 → t0-1
  tagText: 6, // t0 → t0+5, readable by t0+3
  tagExit: 6,
  chipRoll: 6,
  chipResize: 6,
  qFill: 6,
  qAccent: 6,
  eyeDraw: 8,
  routeDraw: 10,
  endTickDraw: 4,
  lensOpen: 9,
  lensClose: 6,
  lensSettle: 6,
  lensDive: 16,
  lensSurface: 14,
  lensMinHold: 45,
  plateFrameDraw: 8,
  /** Round 2, fade-through-ground (judges: cross-dissolves between two drawings double-exposed): the content a plate
   *  lifts with fades out over `plateContentOut` frames from peel +1, the plate flies as an empty card, and its new
   *  content fades in over `plateContentIn` from peel +7. The return mirrors it. Two drawings never overlap. */
  plateContentIn: 6,
  plateContentOut: 4,
  peel: 14,
  plateReturn: 12,
  morph: 16,
  splitSlide: 12,
  windowContract: 10,
  windowExpand: 10,
  scrimIn: 12,
  bracketSnap: 5,
  bracketFade: 6,
  washFade: 8,
  rippleSquare: 10,
  trailCollapse: 6,
  /** Camera: shortest allowed move; typical range 24-46. */
  cameraMin: 16,
  /** A carry starts this many frames before the Bit departs and settles this many after it lands. */
  carryLead: 2,
  carrySettle: 12,
  /** Living-field reactions. */
  poolFollow: 18,
  landRippleField: 30,
  pressRingField: 34,
  timeBreath: 10,
} as const;

export const STAGGER = {
  /** Sibling plates / bands. */
  plates: 3,
  /** Plates flying back. */
  platesReturn: 2,
  /** Wake routes and other small sets. */
  small: 4,
  /** Never more than this between siblings. */
  max: 5,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 8. Camera, parallax and 2.5D (§6, §7)
 * ---------------------------------------------------------------------------------------------- */

export const CAMERA = {
  /** Zoom-rate cap: at most x1.8 per 12 frames at the easing's peak slope (stricter than the brand's x2.2). */
  maxZoomPer12: 1.8,
  /** Pan cap at the frame centre, screen px/frame, at the easing's peak. */
  maxPanPerFrame: 48,
  /** Zoom range for the Ep01 world (world → screen scale). */
  zoomMin: 0.85,
  zoomMax: 2.4,
  /** At most one move per clause and two per sentence (a carry counts). */
  maxMovesPerSentence: 2,
  /** Proof of power (§7.7) during a camera move: the plug may leave the frame at most this many frames before the
   *  lookout does (computed for Ep01: K7 12 frames, K8 11). Holds and subject frames allow 0. */
  proofOfPowerMoveGrace: 12,
  /** Never: roll, tilt, shake, whip, idle drift of the deck. */
  roll: 0,
  tilt: 0,
} as const;

/** Parallax factor per layer: screen motion = factor × deck motion; zoom = zoom^factor (§7.3). */
export const PARALLAX = {
  deepCircuit: 0.25,
  atlasGrid: 0.6,
  deck: 1,
  /** Objects outside the case (monitor, wall socket) in the Ep01 world. */
  room: 0.9,
} as const;

/** 2.5D extrusion of raised parts (§6.4): side offset (world px) = z × (oblique + perspective term). */
export const EXTRUDE = {
  /** Constant oblique component per world px of height: shows bottom-right sides (key light from top-left). */
  obliqueX: 0.45,
  obliqueY: 0.6,
  /** Perspective component: per world px of height, per 1000 screen px from the frame centre. Critic: 0.5 made sides
   *  vanish at the left edge and double at the right during pans (a "swing"); 0.25 keeps a depth cue, never flips. */
  perspective: 0.25,
  /** Height classes in world px. */
  z: {flat: 0, trace: 0, pad: 2, chip: 4, connector: 6, package: 8, module: 10, tall: 14, box: 22},
} as const;

/** Rim light: 2 px line on the top and left edges of a raised part's top face (§6.4). */
export const RIM = {width: 2, opacity: 0.3, edges: ['top', 'left'] as const} as const;

/* ------------------------------------------------------------------------------------------------
 * 9. Living field (§5)
 * ---------------------------------------------------------------------------------------------- */

export const FIELD = {
  /** L1 deep circuit: faint orthogonal traces on the far layer. */
  deep: {
    stroke: 2,
    opacity: 1,
    /** Generated once per episode from a seed; cell pitch of the trace lattice (layer px). */
    pitch: 96,
    /** Fraction of lattice edges drawn. */
    density: 0.22,
    /** Layer px per frame, +x (left to right), always on. Applied in whole-pixel steps (stepFrames). Round 1: 0.1 →
     *  0.25 (judges: the field read as static). */
    drift: 0.25,
    /** The layer advances 1 px every this many frames (integer steps: crisp, encoder-friendly, pixel-like). */
    stepFrames: 4,
    /** Round 1: "current" pulses along the traces. Idle: each walk carries one pulse every period frames (seeded
     *  between periodMin and periodMax, a seeded phase), `length` layer px long, `speed` layer px/frame. Events: every
     *  press and landing launches a wave of brighter pulses outward along the walks within `reach` screen px, each
     *  starting when the wave front (waveSpeed px/frame) reaches the walk's nearer end. */
    /** Round 2 (the owner: "the background is very static"; judges: 150–400 px changing per frame): brighter, longer,
     *  more frequent idle pulses (0.62 → 0.9, 72 → 120 px, periods 110–210 → 80–150 frames) and stronger event waves. */
    /** Round 3 (judges: the field was still invisible on a 390 px phone; 3.5 px pulses became 0.7 px): wider heads
     *  (6 px, a 4 px tail), a longer tail, 8 px/frame, a shorter period (52–100 frames) so several pulses always cross the
     *  margins. */
    pulse: {
      width: 4,
      headWidth: 6,
      headLength: 26,
      length: 150,
      speed: 8,
      periodMin: 52,
      periodMax: 100,
      /** Share of the period a walk is idle-lit at most (keeps the field calm: few pulses at once). */
      duty: 0.75,
      opacity: 0.9,
      tailOpacity: 0.42,
      eventOpacity: 1,
      eventSpeed: 11,
      eventLength: 150,
      reach: 1100,
      waveSpeed: 40,
    },
  },
  /** L2 atlas grid: 4 px square dots (3 px vanished in the 480p test encode). */
  grid: {
    dot: 4,
    pitch: 48,
    /** Round 1: 0.22 → 0.30 and the pool 0.62 → 0.80 (the grid vanished at 480p and on a phone). */
    baseOpacity: 0.3,
    /** Light pool around the focus point (§5.3): peak opacity and radius (screen px). */
    poolOpacity: 0.8,
    poolRadius: 600,
    drift: 0.25,
    /** 1 px every 4 frames (= 0.25 px/frame). */
    stepFrames: 4,
    /** Event reactions add opacity on an expanding square ring. Build values (10 Oct 2026, STYLE_BIBLE §5.4): land 0.25 →
     *  0.45, press 0.35 → 0.55; the critic's values were invisible at full size. Round 1: bigger, longer rings that cross
     *  the frame (the press is a two-step pixel wave: an echo ring follows at `echo` of the radius with half the gain). */
    /** Round 2: landings send a frame-crossing wave too (560 → 1000 px, 64 → 96 px band, gain 0.6 → 0.75). */
    landRipple: {maxRadius: 1000, ringWidth: 96, gain: 0.75, frames: 30},
    pressRing: {maxRadius: 1500, ringWidth: 112, gain: 0.9, frames: 34, echo: 0.62},
    /** Round 2: the light pool breathes slowly (± amp over `period` frames), so a hold is never a frozen frame. Round 3
     *  (judges: the breathing could not be seen): ± 0.12 → ± 0.3 over 9 s, a visible halftone swell at the focus. */
    poolBreath: {amp: 0.3, period: 270},
    /** Return to "now": every dot dips then recovers. */
    timeBreath: {dip: 0.2, frames: 10},
  },
  /** Round 4 (the owner: "the background is very static"; judges: the field lived only in the margins, 44–62 % of the
   *  frames changed under 0.5 % of their pixels): FOCUS PINGS. When the focus settles on a new subject (a label lands,
   *  a Lens opens, a plate turns active) a soft square ring leaves that subject over the board vias and the grid after
   *  `delay` frames; while the subject keeps the focus it repeats every `period` frames (the thing the voice is about
   *  keeps signalling), so a hold is never still on the board itself. Never from a travelling Bit (it has its own
   *  landing ripple), never from the frame centre (no subject). Screen px. */
  ping: {frames: 54, maxRadius: 900, ringWidth: 96, viaGain: 0.55, gridGain: 0.35, period: 60, delay: 4, minHold: 14, fadePow: 0.45},
  /** L3 board vias (critic change C5): the same reactions shown ON the board, where the viewer looks. 4 px squares
   *  on a world lattice (parallax 1, no drift), under the parts. Invisible at rest; lit only by the pool and events. */
  vias: {
    dot: 4,
    /** World px. Build value (STYLE_BIBLE §5.1): 48 → 24, with land 0.30 → 0.55 and press 0.35 → 0.65, so the press
     *  ring reads as a pixel wave on the board instead of a few faint dots 55–86 px apart. */
    pitch: 24,
    baseOpacity: 0,
    /** Round 1: 0.30 → 0.45, land 0.55 → 0.70, press 0.65 → 0.80 (the pool and rings now read on a phone). */
    poolOpacity: 0.45,
    /** Round 4: the vias' pool holds its peak to 45 % of its radius (FieldGains.plateau). */
    poolPlateau: 0.45,
    /** Round 4: a via inside a focus ping's band is drawn this size (px), so the ping reads as a pixel wave. */
    pingDot: 7,
    landGain: 0.85,
    pressGain: 0.9,
    /** Round 4 (judges: "let the board vias near the focus breathe"): the pool's vias breathe ±`amp` (relative) with the
     *  lookout's own breathing (60 frames, phase-locked to f0): the always-on heartbeat shows on the board. */
    breath: {amp: 0.3, period: 60},
  },
  /** Field-on check: no run of identical consecutive frames longer than this (integer steps make short runs normal). */
  maxIdenticalRun: 6,
  /** Mean-luma contribution of the whole field above flat `field`, measured target. */
  lumaLift: {min: 0.4, max: 1.5},
} as const;

/* ------------------------------------------------------------------------------------------------
 * 10. The Bit v2 (§8.1)
 * ---------------------------------------------------------------------------------------------- */

export const BIT2 = {
  size: 24,
  radius: 5,
  /** Stepped halo squares [px, opacity]. */
  halo: [
    [40, 0.18],
    [64, 0.09],
  ] as ReadonlyArray<readonly [number, number]>,
  /** Round 1 (judges: the stepped square halo read as a UI selection box, not light): a soft round glow made of a
   *  radial falloff (two pre-baked radial gradients, no blur filter) around the crisp square head. */
  /** Round 3 (judges: the thumbnails are glow-lit, the intro read flat): a third, wide bloom step (r 150 at 7%), the
   *  Bit's own light (the glow budget: the guide Bit's halo and one narrated part). */
  glow: {r: 46, opacity: 0.6, outerR: 96, outerOpacity: 0.18, bloomR: 150, bloomOpacity: 0.07},
  /** Pixel trail: three squares, echoing the B monogram's three shedding pixels (§8.1). Round 1: 14/10/6 → 16/12/8
   *  (the trail was invisible on a phone). */
  trail: {
    sizes: [16, 12, 8] as const,
    /** Distance behind the head along the route (screen px): gaps 28, 22, 18. */
    offsets: [28, 50, 68] as const,
    opacities: [0.8, 0.55, 0.32] as const,
    /** Trail squares snap to this screen grid: they step like pixels. */
    snap: 4,
    /** Squares shed from the head over the first frames of a run. */
    shedFrames: 4,
  },
  /** Route light behind the head decays over this many frames. */
  routeDecay: 10,
  /** Speeds in WORLD px/frame (kit bitRun) and the on-screen cap. */
  cruise: 24,
  maxWorld: 36,
  maxScreen: 36,
  accel: 4,
  decel: 5,
  minHop: 10,
  maxRun: 30,
  /** Landing ripple (square): 24 → 80 px, 10 frames. */
  ripple: {from: 24, to: 80, frames: 10, strokeFrom: 3, strokeTo: 1.5, opacityFrom: 0.9},
  /** Round 1, the signature landing ("the receiver got it"): when a hop names its receiver, a rounded ripple leaves the
   *  receiver's own outline (grows `grow` px, 3 → 1 px, 0.95 → 0, `frames`), and the Bit sheds its three trail pixels
   *  as the B monogram's burst: three squares thrown down-right of the landing point, `sizes` px at `offsets`, drifting
   *  `drift` px further while they fade over `frames`. */
  /** Round 2 (judges: the signature was not identifiable at phone or sheet scale): grow 34 → 52 px over 22 frames. */
  receiverRipple: {grow: 52, frames: 22, strokeFrom: 4, strokeTo: 1, opacityFrom: 0.95},
  /** Round 2: the burst 1.5× (30/21/14 px) with a 20-frame fade, so the B monogram's pixels read on a phone. */
  burst: {
    sizes: [30, 21, 14] as const,
    offsets: [
      [36, 18],
      [72, 39],
      [102, 54],
    ] as ReadonlyArray<readonly [number, number]>,
    frames: 20,
    drift: 16,
    stagger: 2,
  },
  /** Round 2, the Bit's birth (the brand's identity moment): wherever a Bit appears at rest (`restFrom`), the B
   *  monogram's three pixels fly in from down-right (`spread` × the burst offsets) and merge into the head over `frames`;
   *  a square ripple marks the assembly. The landing burst is the same three pixels thrown back out. */
  form: {frames: 10, spread: 1.4},
  /** Round 3, the SIGNATURE birth (judges: the monogram's pixels were a few px, "nothing at phone size says Bits in
   *  Motion"): at an episode's first press the B monogram's three pixels appear at 3.5× the trail size in the logo's
   *  magenta with their own neon, laid out as in the logo (down-right of the head, shrinking), hold, then slide into
   *  the head, turning cyan as they merge: the logo's pixels become the signal. Screen px; frames from `restFrom`. */
  signature: {
    sizes: [56, 44, 32] as const,
    /** Round 4: a shallower trail (the hook now shows the whole system and the cap sits low in the frame: the third
     *  pixel stays above the caption band). Was (66, 40), (146, 84), (212, 120). */
    offsets: [
      [68, 26],
      [148, 52],
      [214, 74],
    ] as ReadonlyArray<readonly [number, number]>,
    /** Each pixel pops in over `pop` frames, `stagger` apart; all hold until `mergeAt`; each merges over `merge`. */
    pop: 3,
    stagger: 1,
    mergeAt: 8,
    merge: 8,
    /** Neon around each pixel: a radial falloff `glow` × its size, peak opacity `glowOpacity`. */
    glow: 1.35,
    glowOpacity: 0.42,
    /** Round 4, the bookend (judges: the signature appeared once, at the open): on the episode's real press the Bit
     *  departs with the monogram's three pixels re-formed BEHIND it as its trail at the signature sizes, magenta,
     *  shrinking to the trail's sizes and turning cyan over `depart` frames. */
    depart: 16,
  },
  /** Round 1: the route keeps a dim afterglow of the path the Bit took (thumbnail rhyme: glowing cyan paths), fading
   *  over `frames` after the landing; the lit stretch behind the head gets a soft underglow `glowWidth`× wide. */
  afterglow: {opacity: 0.3, frames: 54, glowWidth: 3.2, glowOpacity: 0.22, glow2Width: 7.5, glow2Opacity: 0.08},
  /** Parked (DRIVING): scale 1.00 → 1.10 → 1.00 over 48 frames. */
  breathe: 48,
  breatheScale: 0.1,
  absorbFrames: 3,
  maxOnScreen: 3,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 11. Lens (§9.5, brand §6.2)
 * ---------------------------------------------------------------------------------------------- */

export const LENS2 = {
  d: 400,
  dMin: 300,
  dMax: 420,
  stroke: 4,
  ticks: 4,
  tickLength: 14,
  tickWidth: 4,
  /** Magnification relative to the surrounding view (what the viewer sees), not to the world. */
  magnify: [4, 8] as const,
  leader: 3,
  target: 10,
  /** Scale chip at 4:30 (degrees clockwise from 12 o'clock). */
  chipAngleDeg: 135,
  rimStroke: 3,
  maxPerMinute: 2,
  /** Opening wipe follows the pen (02's iris). */
  wipeLead: 1.02,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 12. Panels: plates, splits, the "later" window (§9)
 * ---------------------------------------------------------------------------------------------- */

export const PLATE = {
  radius: 12,
  /** Held: one 3 px structure rule. Active: the outer rule steps to PLATE.rim px `ink` (exactly one). Not-now: double rule. */
  rule: 3,
  /** Active plate: its outer rule steps to this width in `ink` (an annotation rim on an annotation double rule was
   *  indistinguishable). Exactly one plate per group. */
  rim: 4,
  doubleInset: 8,
  doubleInner: 2,
  /** 2.5D: side thickness (screen px) and flat shadow offset while lifted. */
  thickness: 6,
  shadowOffset: [0, 14] as const,
  liftScale: 1.02,
  captionInset: 24,
  captionGapBelow: 12,
  /** Every gutter is 24 px; a gutter a route crosses carries a 4 px bridge and opens ports (no wider "port gutter"). */
  gutter: 24,
  /** Ports: gaps in the rule where a literal route crosses a gutter. */
  portLength: 40,
  portOpenLead: 4,
  portCloseLag: 6,
  maxInRow: 6,
  maxOtherwise: 3,
} as const;

/** The "later" window: the frame contracts to a double-ruled window while we look ahead in time (§9.6). */
export const WINDOW = {
  rect: {x0: 48, y0: 48, x1: 1872, y1: 932},
  radius: 16,
  outer: 3,
  inner: 2,
  inset: 8,
} as const;

export const SPLIT = {
  /** Triptych bands (S10): 3 × 560 + 2 × 24 = 1728 = the graphics-safe width. Round 1: the top moves 140 → 184 so the
   *  time chip stays on screen above the bands (tense never disappears); captions sit 22 px inside each band's top. */
  triptych: {bandW: 560, gutter: 24, x0: 96, y0: 184, y1: 920, captionInset: 22, darkDim: 0.55},
  /** Row of six plates (S06): 6 × 268 + 5 × 24 = 1728 (x 96–1824), y 352–744. Content above, the rail through the
   *  content's centre (y 484), the name INSIDE the plate (two 44 px lines from y 628), as in 05's readable chain. */
  row6: {plateW: 268, plateH: 392, gutter: 24, x0: 96, y0: 352, railY: 484, nameTop: 628},
  /** Pair of stacked plates on the right (S09 stops). */
  pairRight: {x0: 1100, x1: 1776, y0: 150, h: 360, gap: 24},
  /** Round 2: a pair of plates side by side (S08 "Restart" | "Shut down"): 2 × 800 + 24 = 1624 px, centred. */
  pairWide: {x0: 148, y0: 198, w: 800, h: 548, gap: 24},
} as const;

/* ------------------------------------------------------------------------------------------------
 * 13. Labels v2 (§10)
 * ---------------------------------------------------------------------------------------------- */

export const LABEL2 = {
  anchor: 8,
  leader: 3,
  leaderMin: 40,
  leaderMax: 240,
  keyBar: 4,
  keyGap: 12,
  platePad: 10,
  /** Timing relative to t0 = start frame of the word that names the thing. Round 1 (judges: leader stubs and lone
   *  anchors showed for up to 6 frames before the text): the whole group enters as one unit, anchor and leader inside
   *  the same 4 frames that start the text. */
  anchorPop: [-3, 0] as const,
  leaderDraw: [-3, 1] as const,
  textIn: [0, 5] as const,
  readableBy: 3,
  slide: 8,
  secondaryDelay: 3,
  /** Round 2: text enters word by word in reading order (each word fades in and rises `wordRise` px over `wordFrames`,
   *  `wordStagger` frames apart): no mask crosses a word, so no frame shows a half-word. */
  wordFrames: 4,
  wordStagger: 1,
  wordRise: 6,
  /** Exit (round 1): the group fades out as one unit over exitFrames with this slide toward the key bar; nothing is
   *  clipped, so no half-word ("essor", "irst") is ever readable. */
  exitSlide: 12,
  /** Hold: until the sentence ends + 15 frames and at least 30 + 9 × words frames. */
  holdBase: 30,
  holdPerWord: 9,
  holdAfterSentence: 15,
  exitFrames: 6,
  syncTolerance: 3,
  /** Tags ride rigidly with their anchors during camera moves; slots interpolate with the move's easing. */
  rideWithCamera: true,
  pillDock: 8,
  pillBorder: 2,
  pillPadX: 18,
  pillPadY: 4,
  chipRuleGap: 6,
  chipRule: 2,
  /** "Later" chips carry a double underline (rule + 2 px rule 4 px below). */
  chipDoubleGap: 4,
} as const;

export const BUDGET = {
  tags: 3,
  pills: 2,
  headers: 1,
  readouts: 1,
  mustReadWords: 12,
  emphasisDevices: 1,
  glowingParts: 1,
  bits: 3,
  /** Primary motion: one thing the voice is about. Secondary: follow-through (ripple, tag entrance). */
  primaryMotions: 1,
  secondaryMotions: 2,
  /** No two sound cues closer than this. */
  cueGap: 6,
  /** Max primary camera/panel moves in one second-long window (busy-ness guard for the congested windows). */
  maxPrimaryPerSecond: 2,
  /** Foreground (field excluded) may not stay unchanged longer than this under speech. */
  maxForegroundStill: 45,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 14. Glyphs v2 (§6.7)
 * ---------------------------------------------------------------------------------------------- */

export const GLYPH2 = {
  /** State pips: OFF hollow / ON filled / ALWAYS-ON breathing / RESET crossed. Docked 8 px outside top-right. */
  pip: 14,
  pipStroke: 2,
  pipDock: 8,
  breathePeriod: 60,
  breatheMin: 0.7,
  /** "?" badge: default and subject sizes (screen px, constant at every zoom), and its size inside a Lens view. */
  qBadge: 52,
  qBadgeSubject: 60,
  qBadgeLens: 72,
  qRadius: 10,
  qStroke: 3,
  /** Round 1: the soft-off pointer fill (D24 f671, S07 f950) was a dim tint. Round 2 (judges: the tinted "?" was the
   *  most saturated object on screen in soft-off, read as "awake", red line 7): no tint at all; in soft-off the badge
   *  stays an outline on its dark ground and the pointer is the dashed ring alone. */
  qFillTint: 0,
  /** Round 3 (judges: in soft-off the full-saturation "?" was among the brightest marks on screen, red line 7): an
   *  unpowered, un-pointed "?" badge is drawn at this level; it is full strength only while its block is powered (the
   *  flash-forward, chain plate 3), inside a Lens, while pointed at ("hidden") or accented. */
  qDim: 0.58,
  /** The dashed pointer ring that opens round a "pointed" "?": gap → gap + open px outside the badge. */
  qPointer: {gap: 6, open: 10, stroke: 3, dash: [7, 5] as const},
  /** Eye badge (analogy): width = clamp(eyeScale × the block's on-screen width, eyeMin, eyeMax); 96 inside a Lens. */
  eyeScale: 0.9,
  eyeMin: 48,
  eyeMax: 96,
  eyeAspect: 0.56,
  eyeStroke: 3,
  /** Round 2 (judges: 6 px on a phone, unexplained): 32 × 28 → 44 × 36, and only on the eye (A6: the lookout is an
   *  analogy). The sign-in card and the arc are dashed; they no longer carry it. */
  approxChip: {w: 44, h: 36, r: 8, stroke: 2.5},
  /** Round 3 (judges: the boxed ≈ chip read as a second unknown icon beside the lookout): the eye carries its ≈ as two
   *  unboxed waves at its upper left, part of the one dashed badge (A6: "the dashed ≈ eye badge"). Width as a fraction
   *  of the eye's width (clamped), 3 px annotation. */
  eyeApprox: {scale: 0.34, min: 22, max: 34, stroke: 3},
  /** Round 3: the eye closes (the almond flattens to a dashed lid line, the pupil shrinks away) over `closeFrames` when
   *  its lookout loses standby power (S10 what-ifs); the pupil glances toward a point (S11 wake sources, the button)
   *  by up to `lookMax` × the eye's width over `lookFrames`. */
  eyeCloseFrames: 6,
  eyeLookMax: 0.2,
  eyeLookFrames: 6,
  /** Round 3: a small order mark docked by a part ("First" on the lookout on "first"): a capsule, `deck` fill, 3 px ink
   *  outline, Sora 700. Round 4 (judges: 7 px on a phone, on a block not yet named): 44 px text (must-read: it answers
   *  probe 1), a mono subline that names the block (TYPE.secondary), and a 3 px leader to its part. */
  mark: {font: 44, padX: 18, h: 62, stroke: 3, subGap: 4},
  /** Round 4, the S08 hedge mark (judges: a grey "?" reused the series' "?" and was 3–6 px on a phone): a DOTTED ring
   *  round the problem mark means "maybe". "Can fix": the "!" fades to a dashed outline inside the dotted ring (it may
   *  be gone); "might not": the "!" stays and the dotted ring pulses out twice (it may stay). `gap` px outside the mark,
   *  `dot` px dots `pitch` px apart, `pulseGrow` px per beat over `beat` frames. */
  hedge: {gap: 14, dot: 7, pitch: 16, stroke: 7, pulseGrow: 44, beat: 14},
  /** Round 4: the S08 problem mark, 64 → 84 px (its "!" read at 6 px on a phone). */
  problemSize: 84,
  /** WAITING ‖, LIMIT !, FAULT ×. */
  badge: 28,
  visitedStroke: 3,
  /** Round 2 (judges: small, inside the button's box): 5 px, 18 px serifs, 18 px outside the part. */
  brackets: {stroke: 5, serif: 18, pad: 18, from: 28, snapFrames: 5, maxOvershoot: 0.06, fadeFrames: 6, minGapFrames: 300},
  /** Wake-source glyphs (network jack, clock) when introduced. Round 1: 56 → 80 (11 px on a phone was unreadable).
   *  Round 2: drawn as BADGES (a rounded-square chip with the glyph inside, never a part on the board), 96 px. */
  wakeGlyph: 96,
  /** Round 4: a wake badge's level once it has settled (settings-dependent sources stay dim). */
  wakeDim: 0.56,
  scaleChipPad: 10,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 15. Icon detail and part states (ICONS.md §2, §3.3)
 * ---------------------------------------------------------------------------------------------- */

/** Critic change C9: no discrete levels, hysteresis or crossfades. Every icon draws its base (silhouette + identity
 *  features) always, and its interior detail group at opacity detail = clamp01((shorterSidePx − fadeFrom) / (fadeTo −
 *  fadeFrom)). A pure function of the current frame: detail fades in and out smoothly as the camera zooms. */
export const DETAIL = {
  fadeFrom: 136,
  fadeTo: 176,
  /** Plates and Lens views multiply the on-screen size by this before computing `detail`. */
  plateBias: 1.15,
} as const;

export const PART_STATES = [
  'off', // unpowered: structure outline 3 px, body fill, hollow pip
  'on', // powered and running: ink outline 4 px, activeFill, filled pip
  'alwaysOn', // on + breathing pip (the lookout)
  'visited', // D24: annotation outline 3 px, hollow pip
  'reset', // powered, held: on + reset bar on the pip
  'waiting', // ‖ badge
  'limit', // ! badge + hatch
  'fault', // × badge + hatch
] as const;
export type PartState = (typeof PART_STATES)[number];

/* ------------------------------------------------------------------------------------------------
 * 16. Phone legibility (§13). Screen px at 1920 wide.
 * ---------------------------------------------------------------------------------------------- */

export const PHONE = {
  scale: 0.203125,
  /** Must-read text; supporting text (round 4: 34 → 40); floor. */
  mustReadText: 44,
  supportingText: 40,
  floorText: 30,
  /** A part the voice names or acts on: shorter side on screen, unless it is shown in a Lens or plate. */
  subjectMin: 80,
  /** In a Lens or plate the subject is at least this. */
  subjectInLensMin: 160,
  /** Context parts. */
  contextMin: 30,
  /** Meaningful strokes and their contrast at the master (≥ 3:1 survives a 480p encode). */
  meaningfulStroke: 3,
  lineContrastMin: 5,
  textContrastMin: 7,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 17. Luma budget (§5.5)
 * ---------------------------------------------------------------------------------------------- */

export const LUMA = {
  /** Mean Rec.709 luma of every frame (whole frame; the "later" margins included). */
  floor: 28,
  target: [31, 42] as const,
  /** The world (deck + board + parts) should cover at least this share of the frame at any hold. */
  worldCoverMin: 0.42,
} as const;

/* ------------------------------------------------------------------------------------------------
 * 18. Sound (§12). Cue names are the A7 set; levels are dB relative to the narration peaks nearby.
 * ---------------------------------------------------------------------------------------------- */

export const SOUND = {
  landNotes: ['A', 'C', 'D', 'E', 'G'] as const,
  landHz: {A: 440, C: 523.25, D: 587.33, E: 659.25, G: 783.99} as const,
  /** Previews ("After the press") and described events ("When pressed") play this much quieter. */
  previewGainDb: -4,
  levelsDb: {land: -12, lens: -13, lock: -15, button: -10, buttonReal: -9, standby: -26},
  musicUnderVoiceLu: 19.5,
  minCueGapFrames: 6,
} as const;
