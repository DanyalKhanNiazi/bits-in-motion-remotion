/* eslint-disable @typescript-eslint/no-explicit-any */
import type {IconSpec, IconType} from '../types';
import {boardSpec} from './board';
import {caseSpec} from './case';
import {cpuLgaSpec} from './cpuLga';
import {chipsetSpec} from './chipset';
import {logicBlockSpec} from './logicBlock';
import {dimmSpec} from './dimm';
import {m2Spec} from './m2';
import {pcieSlotSpec} from './pcieSlot';
import {spiFlashSpec} from './spiFlash';
import {vrmStandbySpec} from './vrmStandby';
import {atx24Spec} from './atx24';
import {fpHeaderSpec} from './fpHeader';
import {rearIoSpec} from './rearIo';
import {rj45Spec} from './rj45';
import {lanChipSpec} from './lanChip';
import {psuSpec} from './psu';
import {iecPlugSpec} from './iecPlug';
import {cordSpec} from './cord';
import {wallSocketSpec} from './wallSocket';
import {frontPanelSpec} from './frontPanel';
import {powerButtonSpec} from './powerButton';
import {ledSpec} from './led';
import {monitorSpec} from './monitor';

export * from './board';
export * from './case';
export * from './cpuLga';
export * from './chipset';
export * from './logicBlock';
export * from './dimm';
export * from './m2';
export * from './pcieSlot';
export * from './spiFlash';
export * from './vrmStandby';
export * from './atx24';
export * from './fpHeader';
export * from './rearIo';
export * from './rj45';
export * from './lanChip';
export * from './psu';
export * from './iecPlug';
export * from './cord';
export * from './wallSocket';
export * from './frontPanel';
export * from './powerButton';
export * from './led';
export * from './monitor';

/** Real drawings of the Ep01 PC parts (ICONS.md §4.1–4.18). */
export const BUILT_PC: Partial<Record<IconType, IconSpec<any>>> = {
  board: boardSpec,
  case: caseSpec,
  cpuLga: cpuLgaSpec,
  chipset: chipsetSpec,
  logicBlock: logicBlockSpec,
  dimm: dimmSpec,
  m2: m2Spec,
  pcieSlot: pcieSlotSpec,
  spiFlash: spiFlashSpec,
  vrmStandby: vrmStandbySpec,
  atx24: atx24Spec,
  fpHeader: fpHeaderSpec,
  rearIo: rearIoSpec,
  rj45: rj45Spec,
  lanChip: lanChipSpec,
  psu: psuSpec,
  iecPlug: iecPlugSpec,
  cord: cordSpec,
  wallSocket: wallSocketSpec,
  frontPanel: frontPanelSpec,
  powerButton: powerButtonSpec,
  led: ledSpec,
  monitor: monitorSpec,
};
