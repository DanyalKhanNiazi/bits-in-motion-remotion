/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Planned-topic icons (ICONS.md §6). Round 2 (judges: "src/icons/topics is empty, so every non-PC topic needs new
 * icons"): seeded with the next two scripted episodes' core parts, in the PC parts' construction (resolveBase → Shell →
 * Raised → TopFace → DetailGroup → RimLight → Glow → Outline → Pip; ports from basePorts plus the §6 table's ports):
 *   Ep02 Wi-Fi: router, antenna, phone, rfChip.   Ep03 AI answers: gpuPackage, hbmStack.
 * Every other §6 type still resolves to the registry placeholder with the right default size, height class and
 * passivity (placeholder.tsx DEFAULTS), so a topic world can be laid out today.
 *
 * Adding one: write `topics/<type>.tsx` the same way, export its spec, and add it to BUILT_TOPICS below. The gallery's
 * topic page then shows the real drawing.
 */
import type {IconSpec, IconType} from '../types';
import {routerSpec} from './router';
import {antennaSpec} from './antenna';
import {phoneSpec} from './phone';
import {rfChipSpec} from './rfChip';
import {gpuPackageSpec} from './gpuPackage';
import {hbmStackSpec} from './hbmStack';

export const BUILT_TOPICS: Partial<Record<IconType, IconSpec<any>>> = {
  router: routerSpec,
  antenna: antennaSpec,
  phone: phoneSpec,
  rfChip: rfChipSpec,
  gpuPackage: gpuPackageSpec,
  hbmStack: hbmStackSpec,
};

export * from './router';
export * from './antenna';
export * from './phone';
export * from './rfChip';
export * from './gpuPackage';
export * from './hbmStack';
