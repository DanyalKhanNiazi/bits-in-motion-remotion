/**
 * Powered-domain wash (ENGINE.md §9, STYLE_BIBLE §8.4): `energyWash` fades in over 8 frames under the parts of the
 * domain, clipped to a world polygon. A 3 px `annotation` boundary is added only if the wash would not be >= 1.3:1
 * and lighter than its ground.
 */
import React from 'react';
import {CHANNEL, COLOR, STROKE} from '../tokens';
import {polyPath, rectPath} from '../../shared/geom';
import {contrastRatio, relLuminance} from '../../shared/brand';
import {prog} from '../core/ease';
import type {ViewScope} from '../core/types';
import type {DomainSpec} from '../world/types';

export interface WashEvent {
  domain: string;
  at: number;
  outAt?: number;
  scope?: ViewScope;
  /** 'under' (default): the opaque `energyWash` fill under the parts. 'over': the same tint (energy at
   *  WASH_OVER_ALPHA) laid over the parts inside the polygon, so a domain that lies inside a package (Ep01: the lookout's
   *  corner of the chipset) reads as one warm region instead of a sliver of board between the parts. */
  mode?: 'under' | 'over';
}

/** energy at 16% over `board` is exactly `energyWash` (#3F3D37), so both modes give the board the same tone. */
export const WASH_OVER_ALPHA = 0.16;
/** The soft edge of a blob wash: [outward growth in screen px, extra opacity], drawn under the core. */
export const WASH_SOFT: ReadonlyArray<readonly [number, number]> = [
  [26, 0.035],
  [13, 0.06],
];

/** Shared-rules boundary test: on dark grounds the wash needs >= 1.3:1 and to be lighter, else a boundary is drawn. */
export const washNeedsBoundary = (wash: string, ground: string): boolean =>
  !(relLuminance(wash) > relLuminance(ground) && contrastRatio(wash, ground) >= 1.3);

export const washOpacity = (frame: number, ev: WashEvent): number =>
  prog(frame, ev.at, CHANNEL.washFadeFrames, 'arrive') * (ev.outAt === undefined ? 1 : 1 - prog(frame, ev.outAt, CHANNEL.washFadeFrames, 'exit'));

export const WashV2: React.FC<{domain: DomainSpec; event: WashEvent; frame: number; zoom: number; ground?: string; fillsOnly?: boolean}> = ({
  domain,
  event,
  frame,
  zoom,
  ground = COLOR.board,
  fillsOnly,
}) => {
  const o = washOpacity(frame, event);
  if (o <= 0) return null;
  const d = polyPath(domain.polygon, true);
  if (event.mode === 'over') {
    if (fillsOnly) return null;
    // round 2: holes (a lit part keeps its own look) and a dashed outline along the polygon
    const holes = domain.holes ?? [];
    const clipId = `wash-${domain.id}-holes`;
    const holeClip = holes.length ? (
      <defs>
        <clipPath id={clipId}>
          <path d={`M-100000 -100000H100000V100000H-100000Z${holes.map((hh) => rectPath(hh.x, hh.y, hh.w, hh.h, hh.r ?? 6)).join('')}`} clipRule="evenodd" />
        </clipPath>
      </defs>
    ) : null;
    const outline = domain.outline ? (
      <path
        d={d}
        fill="none"
        stroke={COLOR.energy}
        strokeOpacity={0.85 * o}
        strokeWidth={2 / Math.max(1e-6, zoom)}
        strokeDasharray={`${10 / Math.max(1e-6, zoom)} ${7 / Math.max(1e-6, zoom)}`}
        strokeLinejoin="round"
      />
    ) : null;
    if (domain.blobs && domain.blobs.length) {
      // soft-edged: each band is the union of the blobs (one group, one opacity), widest and faintest first
      const band = (grow: number) =>
        domain.blobs!.map((b) => rectPath(b.x - grow, b.y - grow, b.w + 2 * grow, b.h + 2 * grow, (b.r ?? 8) + grow)).join('');
      return (
        <g>
          {holeClip}
          <g clipPath={holes.length ? `url(#${clipId})` : undefined}>
            {WASH_SOFT.map(([grow, a], i) => (
              <path key={i} d={band(grow / Math.max(1e-6, zoom))} fill={COLOR.energy} fillOpacity={a * o} />
            ))}
            <path d={band(0)} fill={COLOR.energy} fillOpacity={WASH_OVER_ALPHA * o} />
          </g>
          {outline}
        </g>
      );
    }
    return (
      <g>
        {holeClip}
        <path d={d} fill={COLOR.energy} fillOpacity={WASH_OVER_ALPHA * o} clipPath={holes.length ? `url(#${clipId})` : undefined} />
        {outline}
      </g>
    );
  }
  const boundary = !fillsOnly && washNeedsBoundary(COLOR.energyWash, ground);
  return (
    <g opacity={o}>
      <path d={d} fill={COLOR.energyWash} />
      {boundary ? <path d={d} fill="none" stroke={COLOR.annotation} strokeWidth={STROKE.analogy / zoom} /> : null}
    </g>
  );
};
