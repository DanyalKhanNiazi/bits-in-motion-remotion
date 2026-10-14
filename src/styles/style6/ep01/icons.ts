/**
 * Plugs the icon library into the engine at module load (ENGINE_NOTES "Wiring"). Imported first by world.ts, so the
 * dev checks that buildScript runs resolve every anchor through the real icons' ports.
 */
import {getIcon} from '../../../icons';
import {registerIcons} from '../../../engine';

registerIcons(getIcon);

export const ICONS_READY = true;
