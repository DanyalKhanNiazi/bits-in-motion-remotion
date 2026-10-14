/**
 * Signal Atlas icon library (style6). Import from here:
 *   import {getIcon, ICONS, type IconType, QBadge, PowerSymbol, blockRectAt} from '../icons';
 * Spec: docs/style6/ICONS.md. Look: docs/style6/STYLE_BIBLE.md §6. Review sheet: src/icons/IconSheet.tsx
 * (composition IconGallery, entry src/entries/icongallery.tsx).
 */
export * from './types';
export * from './primitives';
export {ICONS, ICON_TYPES, getIcon, isPlaceholder} from './registry';
export {placeholderSpec, DEFAULTS as ICON_DEFAULTS} from './placeholder';
export * from './pc';
export * from './variants';
export * from './glyphs';
export {SignInCard, signInCardSpec, type SignInCardProps} from './scene/signInCard';
