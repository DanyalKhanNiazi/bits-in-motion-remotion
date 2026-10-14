/**
 * Powered-domain wash (brand spec §6.3; shared rules): an energyWash tint over ONLY the standby-powered
 * region, fading in over 8 frames on "just enough of the motherboard" (WORD_CUES.justEnoughOfTheMotherboard).
 * The shared rules require the wash to be lighter than the ground and >= 1.3:1 on dark grounds, or
 * ΔL* >= 10 on light grounds; otherwise a 3 px annotation boundary line. boundary="auto" applies that test.
 * With the stock tokens the test always fails (the dark wash is about 1.1:1 against the surface and darker
 * than the board; the light washes are ΔL* ≈ 6), so the boundary line is drawn unless you pass a lighter wash.
 *
 * Usage:
 *   <PoweredWash box={{x: 700, y: 560, w: 200, h: 140, r: 12}} at={WORD_CUES.justEnoughOfTheMotherboard} ground={theme.board} />
 *   <PoweredWash d={regionPath} at={1695} color={mixColor(theme.board, theme.energy, 0.16)} ground={theme.board} />
 */
import React from 'react';
import {CHANNEL, STROKE, washNeedsBoundary} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {rectPath} from '../geom';
import {EASE, progress} from '../motion';

export interface PoweredWashProps extends KitBaseProps {
  /** The region: a closed SVG path, or a box. */
  d?: string;
  box?: {x: number; y: number; w: number; h: number; r?: number};
  /** Fade in over 8 frames from here. */
  at: number;
  outAt?: number;
  /** Wash colour (default theme.energyWash). */
  color?: string;
  /** What the wash sits on (default theme.surface), for the boundary test. */
  ground?: string;
  /** 'auto' (default): add the 3 px annotation boundary when the contrast rule fails. */
  boundary?: boolean | 'auto';
  boundaryColor?: string;
}

export const PoweredWash: React.FC<PoweredWashProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  if (frame < p.at) return null;
  const d = p.d ?? (p.box ? rectPath(p.box.x, p.box.y, p.box.w, p.box.h, p.box.r ?? STROKE.partRadius) : '');
  if (!d) return null;
  const op =
    progress(frame, p.at, CHANNEL.washFadeFrames, EASE.arrive) * (p.outAt !== undefined ? 1 - progress(frame, p.outAt, 6, EASE.exit) : 1);
  if (op <= 0) return null;
  const color = p.color ?? theme.energyWash;
  const boundary =
    p.boundary === undefined || p.boundary === 'auto' ? washNeedsBoundary(theme, color, p.ground ?? theme.surface) : p.boundary;
  const seed = p.seed ?? 'wash';
  return (
    <g opacity={op}>
      {skin.fill({d, color, role: 'energy', seed: `${seed}:fill`, frame})}
      {boundary
        ? skin.stroke({d, color: p.boundaryColor ?? theme.annotation, width: 3, role: 'annotation', seed: `${seed}:edge`, frame, join: 'round'})
        : null}
    </g>
  );
};
