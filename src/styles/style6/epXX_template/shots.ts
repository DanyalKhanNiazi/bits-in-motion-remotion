/**
 * EPISODE TEMPLATE — named framings: a world point held at the frame centre plus a zoom (STYLE_BIBLE §7.1). Name them
 * by what they show; tags may give a slot per shot name and interpolate during moves.
 *
 * Round 2: say WHAT a framing shows and let the engine compute it. `frameParts(WORLD, ids)` fits those parts (their
 * union plus a margin) into the area where meaning may sit at a hold (title-safe, under the chip, above the caption
 * band), so a world change re-frames every shot by itself.
 */
import {frameParts, type Shot} from '../../../engine';
import {WORLD} from './world';

export const SHOTS: Record<string, Shot> = {
  /** The whole machine: the parallax reference (room objects match the deck here). */
  wide: frameParts(WORLD, ['board'], {pad: 60, maxZoom: 1}),
  /** Closer on the button and the receiver it signals. */
  close: frameParts(WORLD, ['button', 'receiver'], {pad: 80, maxZoom: 1.15}),
};
