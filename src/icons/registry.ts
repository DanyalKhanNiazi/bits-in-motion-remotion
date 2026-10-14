/**
 * The icon registry (ICONS.md §1): ICONS[type] → {component, size, z, passive, ports}. The engine renders every part
 * through getIcon(type). Types without a real drawing yet resolve to the placeholder (rounded rect + outline + pip).
 */
import type {IconSpec, IconType} from './types';
import {DEFAULTS, placeholderSpec} from './placeholder';
import {BUILT_PC} from './pc';
import {BUILT_VARIANTS} from './variants';
import {BUILT_SCENE} from './scene';
import {BUILT_TOPICS} from './topics';

/** Every IconType, in catalogue order. */
export const ICON_TYPES = Object.keys(DEFAULTS) as IconType[];

/* eslint-disable @typescript-eslint/no-explicit-any */
const BUILT: Partial<Record<IconType, IconSpec<any>>> = {...BUILT_PC, ...BUILT_VARIANTS, ...BUILT_SCENE, ...BUILT_TOPICS};
/* eslint-enable @typescript-eslint/no-explicit-any */

export const ICONS: Record<IconType, IconSpec> = Object.fromEntries(
  ICON_TYPES.map((t) => [t, (BUILT[t] as IconSpec | undefined) ?? placeholderSpec(t)]),
) as Record<IconType, IconSpec>;

export const getIcon = (type: IconType): IconSpec => ICONS[type] ?? placeholderSpec(type);

/** True when the type still renders as the placeholder. */
export const isPlaceholder = (type: IconType): boolean => !BUILT[type];
