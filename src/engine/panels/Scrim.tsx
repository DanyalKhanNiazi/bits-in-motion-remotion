/**
 * Scrim (ENGINE.md §10.2): flat `void` at ALPHA.scrim over the world behind a plate row, 12-frame fades. The fade-in
 * eases slowly ('move') so the frame darkens as the plates (on `deck`) arrive: start it with the first peel to keep
 * every frame above the luma floor.
 */
import React from 'react';
import {ALPHA, COLOR, DUR} from '../tokens';
import {prog} from '../core/ease';
import type {SRect} from '../core/types';

/** `inDur` (round 1): a slower fade-in, so the world steps back before the plates arrive while every frame stays
 *  above the luma floor (a 12-frame scrim ahead of sequential peels dipped to 27.7). */
export const scrimAlpha = (frame: number, at: number, outAt: number, inDur: number = DUR.scrimIn, alpha: number = ALPHA.scrim): number =>
  alpha * prog(frame, at, inDur, 'move') * (1 - prog(frame, outAt, DUR.scrimIn, 'settle'));

/** `alpha` (round 2): a lighter scrim where the plates cover less of the frame (S08's pair: 0.3), keeping every frame
 *  above the luma floor. */
export const Scrim: React.FC<{frame: number; at: number; outAt: number; inDur?: number; alpha?: number; rect?: SRect}> = ({frame, at, outAt, inDur, alpha, rect}) => {
  const a = scrimAlpha(frame, at, outAt, inDur, alpha);
  if (a <= 0) return null;
  const r = rect ?? {x: 0, y: 0, w: 1920, h: 1080};
  return <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: COLOR.void, opacity: a}} />;
};
