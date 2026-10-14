import type React from 'react';
import type {PartState} from '../engine/tokens';

export type Pt = readonly [number, number];

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
  /** 0..1 opacity of the interior detail group (tokens DETAIL; the view computes it from the on-screen size).
   *  Default 1. The base (silhouette + identity features) is always drawn. */
  detail?: number;
  /** Knockout mode (STYLE_BIBLE §10.3): draw only the side and top-face FILLS (no outline, rim, detail, pip, glow).
   *  The label layer redraws the world this way, clipped to each text box, so labels never read as cards. */
  fillsOnly?: boolean;
  /** 2.5D side offset of the base, world px (the view computes it from EXTRUDE and the camera). [0, 0] = flat. */
  side?: readonly [number, number];
  /** 0..1 tone step of the outline structure → textMuted: "pointed at" (not a state). */
  pointed?: number;
  /** The faked glow: second outline at 3x width in ink. true = ALPHA.glow (0.2); a number = that alpha (the S10
   *  "lookout" swell peaks at 0.35). Only the ONE narrated powered part. */
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
  // Planned topics (§6)
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
