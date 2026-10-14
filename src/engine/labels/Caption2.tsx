/**
 * Captions v2 (plate names, band captions, "Stop: AMD"): 44 px Sora 600 on the plate's or band's own flat ground (no
 * knockout), revealed word by word (round 2: no mask, so no half-words), faded out over 6 frames. Two lines with "\n".
 */
import React from 'react';
import {COLOR, LABEL2, TYPE} from '../tokens';
import {SANS} from '../../shared/fonts';
import {prog} from '../core/ease';
import type {SRect} from '../core/types';
import {RevealText} from './reveal';

export interface CaptionSpec {
  text: string;
  at: number;
  exitAt?: number;
  place: SRect;
  /** 'left' (default: text from the place's top-left) or 'center' (centred lines, plate names in a row). */
  align?: 'left' | 'center';
  /** Round 2 (S06 reading load): the caption shows dimmed (GHOST_OPACITY) from `ghostAt`, so the whole chain can be read
   *  ahead; on `at` (its word) it steps up to full ink over 4 frames. */
  ghostAt?: number;
  /** Colour (default ink). */
  color?: string;
}

/** A pre-shown ("ghost") caption's opacity before its word. Round 3 (judges: the dim names were low contrast at 390 px):
 *  0.4 → 0.56, ≈ 5.4:1 on the plate's deck ground (WCAG AA for text), still clearly dimmer than a named stage. */
export const GHOST_OPACITY = 0.56;

const startOf = (c: CaptionSpec): number => (c.ghostAt !== undefined && c.ghostAt < c.at ? c.ghostAt : c.at);

/** Visibility 0..1 (entry, then the exit fade). */
export const captionReveal = (frame: number, c: CaptionSpec): number =>
  Math.min(prog(frame, startOf(c), 5, 'roll'), c.exitAt === undefined ? 1 : 1 - prog(frame, c.exitAt, LABEL2.exitFrames, 'exit'));

export const Caption2: React.FC<{spec: CaptionSpec; frame: number; opacity?: number}> = ({spec, frame, opacity: baseOpacity = 1}) => {
  const start = startOf(spec);
  if (frame < start) return null;
  const out = spec.exitAt === undefined ? 1 : 1 - prog(frame, spec.exitAt, LABEL2.exitFrames, 'exit');
  if (out <= 0) return null;
  const level = start < spec.at ? GHOST_OPACITY + (1 - GHOST_OPACITY) * prog(frame, spec.at, 4, 'arrive') : 1;
  const opacity = Math.round(baseOpacity * out * level * 1000) / 1000;
  const center = spec.align === 'center';
  return (
    <div
      style={{
        position: 'absolute',
        left: spec.place.x,
        top: spec.place.y,
        width: spec.place.w,
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: TYPE.caption,
        lineHeight: TYPE.lineHeight,
        color: spec.color ?? COLOR.ink,
        whiteSpace: 'pre',
        textAlign: center ? 'center' : 'left',
        opacity,
      }}
    >
      <RevealText text={spec.text} age={frame - start} />
    </div>
  );
};
