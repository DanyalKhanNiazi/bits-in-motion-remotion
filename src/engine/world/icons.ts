/**
 * The engine's side of the icon contract (ICONS.md §2) and the icon registry.
 *
 * The engine renders parts ONLY through `iconFor(type)`. The icon library (src/icons/, built in parallel) plugs in
 * with one call at module load, before any buildScript():
 *
 *   import {getIcon} from '../../icons';
 *   import {registerIcons} from '../../engine';
 *   registerIcons(getIcon);
 *
 * (or pass `icons={getIcon}` to <Atlas>). Until then, and for any type the registry does not return, the engine draws
 * a placeholder built from the same construction rules (side hull, material top face, rim light, state outline,
 * glow, pip), so a world always renders. The types below mirror ICONS.md §2 verbatim, so the library's
 * `getIcon` is structurally assignable to `registerIcons`.
 */
import type React from 'react';
import type {PartState} from '../tokens';
import type {Pt} from '../core/types';
import {kitWarn} from '../../shared/motion';
import {PlaceholderIcon, placeholderDef, placeholderPorts} from './placeholder';

/** Props every hardware icon accepts. Geometry in WORLD px; the parent <g> applies the camera transform. */
export interface IconBaseProps {
  /** Stable id (unique per view) for clip-path ids. */
  id: string;
  /** Top-face footprint, world px. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** World → screen scale of the view drawing it. Every stroke token is divided by this (non-scaling lines). */
  zoom: number;
  /** Absolute frame (breathing, flips). */
  frame: number;
  /** State now; default 'off'. Passive parts ignore it. */
  state?: PartState;
  /** A state change in progress: the previous state and the frame the 5-frame flip began. */
  flip?: {from: PartState; at: number};
  /** 0..1 opacity of the interior detail group (tokens DETAIL; the view computes it from the on-screen size). Default 1. */
  detail?: number;
  /** Knockout mode (STYLE_BIBLE §10.3): only the side and top-face FILLS (no outline, rim, detail, pip, glow). */
  fillsOnly?: boolean;
  /** 2.5D side offset of the base, world px (the view computes it from EXTRUDE and the camera). [0, 0] = flat. */
  side?: readonly [number, number];
  /** 0..1 tone step of the outline structure → textMuted: "pointed at" (not a state). */
  pointed?: number;
  /** The faked glow: true = ALPHA.glow (0.2); a number = that alpha. Only the ONE narrated powered part. */
  glow?: boolean | number;
  /** Pip dock; default 'top-right' (8 px outside). false = no pip (passive parts). */
  pip?: 'top-right' | 'top-left' | 'inside-top-right' | 'inside-top-left' | false;
  /** Whole-icon opacity 0..1 (plates fading back, morphs). Default 1. */
  opacity?: number;
}

/** Named connection and anchor points, world px, computed from the same props. */
export type Ports = Record<string, Pt>;

export type IconType =
  // Ep01: the PC
  | 'board' | 'case' | 'cpuLga' | 'chipset' | 'logicBlock' | 'dimm' | 'm2' | 'pcieSlot' | 'spiFlash'
  | 'vrmStandby' | 'atx24' | 'fpHeader' | 'rearIo' | 'rj45' | 'lanChip' | 'psu' | 'iecPlug' | 'cord'
  | 'wallSocket' | 'frontPanel' | 'powerButton' | 'led' | 'monitor'
  // Ep01: variants and scene props
  | 'amdPackage' | 'laptopBoard' | 'socPackage' | 'ecChip' | 'battery' | 'signInCard'
  // Planned topics (ICONS.md §6)
  | 'router' | 'antenna' | 'phone' | 'laptopOpen' | 'wallSection' | 'rfChip' | 'accessPoint'
  | 'gpuPackage' | 'hbmStack' | 'gpuCard' | 'serverTray'
  | 'cpuDie' | 'core' | 'cacheBlock'
  | 'videoFrame' | 'codecSlab' | 'hdd' | 'ssd25' | 'nandPackage' | 'nandCell' | 'sataPower'
  | 'displayPanel' | 'subpixelTriad';

export interface IconSpec<P extends IconBaseProps = IconBaseProps> {
  type: IconType;
  component: React.FC<P>;
  /** Default footprint, world px. */
  size: {w: number; h: number};
  /** Height class (tokens EXTRUDE.z) used for the 2.5D side. */
  z: number;
  /** Passive parts (connectors, regulators, cords) have no state and no pip. */
  passive: boolean;
  ports: (p: P) => Ports;
}

/** Ground types: drawn first, under the vias and washes; never counted as "part top faces" by the checks. */
export const GROUND_TYPES: ReadonlySet<string> = new Set(['case', 'board', 'laptopBoard']);

/* ------------------------------------------------------------------------------------------------
 * Registry
 * ---------------------------------------------------------------------------------------------- */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpec = IconSpec<any>;
let LOOKUP: ((type: IconType) => unknown) | null = null;
let VERSION = 0;
const SPECS = new Map<string, AnySpec>();

/** Bumped by every registerIcons(): caches derived from icon specs (ports, draw order) rebuild when it changes. */
export const iconsVersion = (): number => VERSION;

const isSpec = (s: unknown): s is AnySpec =>
  !!s && typeof s === 'object' && typeof (s as AnySpec).component === 'function' && typeof (s as AnySpec).ports === 'function';

/** Plug in the icon library's getIcon (src/icons/registry.ts). Call once at module load, before buildScript(). */
export const registerIcons = (lookup: ((type: IconType) => unknown) | null): void => {
  if (lookup === LOOKUP) return;
  LOOKUP = lookup;
  VERSION++;
  SPECS.clear();
};

export const iconsRegistered = (): boolean => LOOKUP !== null;

const placeholderSpecs = new Map<string, AnySpec>();
/** The engine's placeholder for a type (also used for any type the registry does not return). */
export const placeholderIcon = (type: IconType): AnySpec => {
  const hit = placeholderSpecs.get(type);
  if (hit) return hit;
  const d = placeholderDef(type);
  const spec: AnySpec = {
    type,
    component: PlaceholderIcon(type),
    size: {w: d.w, h: d.h},
    z: d.z,
    passive: d.passive,
    ports: (p: IconBaseProps & Record<string, unknown>) => placeholderPorts(type, p),
  };
  placeholderSpecs.set(type, spec);
  return spec;
};

/** The icon for a type: the registered library's, else the engine placeholder. */
export const iconFor = (type: IconType): AnySpec => {
  const hit = SPECS.get(type);
  if (hit) return hit;
  let spec: AnySpec | null = null;
  if (LOOKUP) {
    try {
      const s = LOOKUP(type);
      if (isSpec(s)) spec = s;
      else kitWarn(`icons: the registry has no icon for "${type}"; drawing the engine placeholder`);
    } catch (e) {
      kitWarn(`icons: getIcon("${type}") threw (${String(e)}); drawing the engine placeholder`);
    }
  }
  const out = spec ?? placeholderIcon(type);
  SPECS.set(type, out);
  return out;
};
