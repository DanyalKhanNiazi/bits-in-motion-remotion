/**
 * Night Signal plane tones: flat mixes of the dark brand tokens, no new hue (approved, Stage A §5.7).
 * Light is information: only powered parts and signals emit; everything else is a flat plane.
 */
import {THEMES, mixColor} from '../../shared';

export const T = THEMES.dark;

export const TONE = {
  /** Letterbox bars and the monitor's screen only. */
  void: '#000000',
  /** Gaps behind parts; die areas under dark glass. */
  far: '#0A0C15',
  /** Motherboard tray and the case interior (lifted after measuring the H.264 encode; structure 3.19:1). */
  tray: '#181D2A',
  /** Wall, the relay's ground: board + 8% structure (structure 3.02:1). */
  room: mixColor('#161C29', '#626C81', 0.08),
  /** The PCB, where every mechanism happens. */
  stage: '#1A1F2C',
  /** Bodies of unpowered parts (lifted from #0D101B; structure 3.44:1, still the darkest bodies). */
  mass: '#121522',
  /** Near silhouettes and 2 px contact edges. */
  near: '#070911',
  /** Dark glass: mass at 40% over stage. */
  glass: mixColor('#1A1F2C', '#121522', 0.4),
  /** Lit body of a powered part (activeFill). */
  lit: T.activeFill,
  /** S11 powered-domain wash: energy 16% over stage (1.38:1, lighter than the board). */
  wash: mixColor('#1A1F2C', T.energy, 0.16),
  /** Desk, furniture and the floor band (far plane, unlit). */
  desk: '#151A26',
} as const;

/** Stroke widths (constant on screen at every camera scale). */
export const SW = {
  inactive: 3,
  active: 4,
  route: 4,
  leader: 3,
  contact: 2,
  fine: 2,
} as const;

/** The faked glow: a second outline at 3x width, 20% ink (brand: the one allowed glow). */
export const GLOW = {width: 3, opacity: 0.2} as const;
