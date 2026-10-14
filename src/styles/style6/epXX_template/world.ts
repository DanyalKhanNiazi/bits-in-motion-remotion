/**
 * EPISODE TEMPLATE (round 1) — copy `epXX_template/` to `epNN/` and replace this world with the topic's machine.
 * One world per topic, in true topology (STYLE_BIBLE §6.1): parts come from the icon registry (src/icons), world px =
 * screen px at zoom 1. Keep the ids stable: scripts, scenes and tags refer to parts by id ("button.right").
 */
import {getIcon} from '../../../icons';
import {registerIcons, type WorldSpec} from '../../../engine';

// plug the icon library in before any buildScript (ENGINE_NOTES "Wiring")
registerIcons(getIcon);

/** Parts whose state the narration never mentions carry no pip (STYLE_BIBLE §6.5). */
const QUIET = {pip: false} as const;

export const WORLD: WorldSpec = {
  id: 'epXX-template',
  seed: 'bits-in-motion-epXX',
  bounds: {x: 0, y: 0, w: 1400, h: 800},
  parts: [
    {id: 'board', type: 'board', rect: {x: 200, y: 150, w: 900, h: 500}},
    {id: 'button', type: 'powerButton', rect: {x: 300, y: 520, w: 72, h: 72}, order: 30},
    {id: 'receiver', type: 'logicBlock', rect: {x: 760, y: 300, w: 72, h: 36}, initial: 'alwaysOn', props: {shape: 'wide', pip: 'inside-top-right'}},
    {id: 'flash', type: 'spiFlash', rect: {x: 900, y: 420, w: 46, h: 28}, props: QUIET},
  ],
  routes: [
    // the same points draw the route and carry the Bit (8 px bends, orthogonal)
    {id: 'link', points: [[336, 520], [336, 318], [760, 318]]},
  ],
  channels: [],
  domains: [],
};
