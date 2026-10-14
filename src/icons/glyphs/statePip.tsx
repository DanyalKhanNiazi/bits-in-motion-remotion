/**
 * StatePip (ICONS.md §5.1): the 14 px state square, standalone (plates) — icons use the same shape through `Pip`.
 * OFF hollow / ON filled / ALWAYS-ON breathing (60 frames, phase-locked to f0) / VISITED hollow annotation /
 * RESET filled with a 2 px bar overhanging 6 px / WAITING, LIMIT, FAULT badges. (x, y) is the pip centre.
 */
import React from 'react';
import type {PartState} from '../../engine/tokens';
import {PipShape, STATE_LOOK, flipT, fx} from '../primitives';

export interface StatePipProps {
  x: number;
  y: number;
  frame: number;
  state: PartState;
  flip?: {from: PartState; at: number};
  /** Force breathing on/off (default: by state). */
  breathe?: boolean;
  opacity?: number;
}

export const StatePip: React.FC<StatePipProps> = ({x, y, frame, state, flip, breathe, opacity = 1}) => {
  if (opacity <= 0) return null;
  let kind = STATE_LOOK[state].pip;
  if (breathe === true && (kind === 'filled' || kind === 'breathing')) kind = 'breathing';
  if (breathe === false && kind === 'breathing') kind = 'filled';
  const t = flipT(frame, flip, 2);
  const from = flip ? STATE_LOOK[flip.from].pip : kind;
  return (
    <g transform={`translate(${fx(x)} ${fx(y)})`}>
      {flip && t < 1 && from !== kind ? <PipShape kind={from} frame={frame} opacity={opacity * (1 - t)} /> : null}
      <PipShape kind={kind} frame={frame} opacity={opacity * (flip && from !== kind ? t : 1)} />
    </g>
  );
};
