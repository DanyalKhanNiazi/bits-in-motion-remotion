/**
 * Ep06 UI kit: <PassportCard>, the fictional passport photo (indistinct silhouette, blank fields; never readable data).
 *   variant 'desk'   fictional-passport_a (three-quarter, on the desk and in the bin)
 *   variant 'screen' fictional-passport_b (frontal, on screen)
 * dissolveAt hides the card (a lift, a brightening and a fade over `dissolveDur`) while PhotoBits takes over from
 * passportAnchors().photo; sinkTo moves it down into a point (e.g. the Wall) shrinking as it goes.
 *
 *   <PassportCard frame={f} variant="desk" x={1500} y={760} w={300} tiltX={8} dissolveAt={a} />
 *   <FictionalNote frame={f} at={a} />   // the footnote "Fictional example" (once, in the hook)
 */
import React from 'react';
import {EASE} from '../look';
import {Prop, propPoint, propScale, type PropProps} from '../Prop';
import {type AssetName} from '../assets';
import {Footnote} from '../text';
import {clamp01, lerp, prog} from '../util';
import {UI_REGIONS} from './regions';

export type PassportCardProps = Omit<PropProps, 'src'> & {
  variant?: 'desk' | 'screen';
  imageSrc?: AssetName;
  dissolveAt?: number;
  dissolveDur?: number;
  sinkTo?: {x: number; y: number; at: number; dur?: number; scale?: number};
};

const srcOf = (variant: 'desk' | 'screen', imageSrc?: AssetName): AssetName => imageSrc ?? (variant === 'desk' ? 'fictional-passport_a' : 'fictional-passport_b');

/** The card and photo quads of a placed passport (parent px, at rest). */
export const passportAnchors = (p: {x: number; y: number; w?: number; h?: number; variant?: 'desk' | 'screen'; imageSrc?: AssetName}) => {
  const variant = p.variant ?? 'desk';
  const src = srcOf(variant, p.imageSrc);
  const card = variant === 'desk' ? UI_REGIONS.passA_card : UI_REGIONS.passB_card;
  const photo = variant === 'desk' ? UI_REGIONS.passA_photo : UI_REGIONS.passB_photo;
  const map = (q: typeof card) => q.map(([x, y]) => {
    const r = propPoint(src, p, x, y);
    return [r.x, r.y] as const;
  });
  const pq = map(photo);
  return {
    card: map(card),
    photo: pq,
    photoCenter: {x: (pq[0][0] + pq[1][0] + pq[2][0] + pq[3][0]) / 4, y: (pq[0][1] + pq[1][1] + pq[2][1] + pq[3][1]) / 4},
    scale: propScale(src, p),
  };
};

export const PassportCard: React.FC<PassportCardProps> = ({variant = 'desk', imageSrc, dissolveAt, dissolveDur = 12, sinkTo, ...pp}) => {
  const f = pp.frame;
  const src = srcOf(variant, imageSrc);
  const d = dissolveAt === undefined ? 0 : prog(f, dissolveAt, dissolveDur, EASE.inCubic);
  if (d >= 1) return null;
  const s = sinkTo ? prog(f, sinkTo.at, sinkTo.dur ?? 24, EASE.inOut) : 0;
  const nudge = {
    ...(pp.nudge ?? {}),
    dx: (pp.nudge?.dx ?? 0) + (sinkTo ? (sinkTo.x - pp.x) * s : 0),
    dy: (pp.nudge?.dy ?? 0) + (sinkTo ? (sinkTo.y - pp.y) * s : 0) - 18 * d,
    s: (pp.nudge?.s ?? 1) * (sinkTo ? lerp(1, sinkTo.scale ?? 0.2, s) : 1) * (1 + 0.04 * d),
    op: (pp.nudge?.op ?? 1) * (1 - d) * (sinkTo ? 1 - prog(f, sinkTo.at + (sinkTo.dur ?? 24) * 0.7, (sinkTo.dur ?? 24) * 0.3) : 1),
    bright: (pp.nudge?.bright ?? 1) * (1 + 0.6 * clamp01(d * 2)),
  };
  return <Prop {...pp} src={src} nudge={nudge} />;
};

/** The once-only safety footnote for the hook. */
export const FictionalNote: React.FC<{frame: number; at: number; exitAt?: number; x?: number; y?: number}> = ({frame, at, exitAt, x, y}) => (
  <Footnote frame={frame} at={at} exitAt={exitAt} text="Fictional example" x={x} y={y} />
);
