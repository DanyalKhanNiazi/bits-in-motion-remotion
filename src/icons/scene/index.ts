/* eslint-disable @typescript-eslint/no-explicit-any */
import type {IconSpec, IconType} from '../types';
import {signInCardSpec} from './signInCard';

export * from './signInCard';
export * from './commandChip';

/** Scene props (the analogy card; the command chip is a glyph, exported above). */
export const BUILT_SCENE: Partial<Record<IconType, IconSpec<any>>> = {signInCard: signInCardSpec};
