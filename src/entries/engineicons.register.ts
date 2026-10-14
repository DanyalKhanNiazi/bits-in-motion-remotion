/**
 * Registers the icon library (src/icons) with the engine on import. Import this module BEFORE any module that calls
 * buildScript(), so the dev checks resolve anchors through the real icons' ports.
 */
import {getIcon} from '../icons';
import {registerIcons} from '../engine/world/icons';

registerIcons(getIcon);

export const ICONS_REGISTERED = true;
