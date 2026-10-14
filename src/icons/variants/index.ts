/* eslint-disable @typescript-eslint/no-explicit-any */
import type {IconSpec, IconType} from '../types';
import {amdPackageSpec} from './amdPackage';
import {laptopBoardSpec} from './laptopBoard';
import {socPackageSpec} from './socPackage';
import {ecChipSpec} from './ecChip';
import {batterySpec} from './battery';

export * from './amdPackage';
export * from './laptopBoard';
export * from './socPackage';
export * from './ecChip';
export * from './battery';

/** Real drawings of the S09 stop variants (ICONS.md §4.19–4.20). */
export const BUILT_VARIANTS: Partial<Record<IconType, IconSpec<any>>> = {
  amdPackage: amdPackageSpec,
  laptopBoard: laptopBoardSpec,
  socPackage: socPackageSpec,
  ecChip: ecChipSpec,
  battery: batterySpec,
};
