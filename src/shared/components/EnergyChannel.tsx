/**
 * Energy channel (brand spec §5.2, §6.3): a double-walled channel (structure walls) that fills with amber
 * from its source (path start) to its load (path end) between two frames. Energy never travels as marks:
 * a fill-front with a stepped 24 px soft edge, then steady; optional slow shimmer while the voice talks flow.
 *   main     18 px outer = 2 px walls + 14 px fill (energy)
 *   standby  10 px outer = 2 px walls + 6 px fill (energyStandby: dimmer on dark, thinner on light)
 *
 * Usage:
 *   <EnergyChannel kind="standby" path={[[300, 840], [880, 840], [880, 640]]} full shimmer={{from: 1519, to: 1600}} />
 *   <EnergyChannel kind="main" path={d} fillFrom={810} fillTo={826} />     // ≤ 18 frames, ~50 px/frame
 */
import React from 'react';
import {CHANNEL, STROKE} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {flattenPath, offsetPolyline, polyPath, routePath, type Pt} from '../geom';
import {clamp01, EASE, progress} from '../motion';

export interface EnergyChannelProps extends KitBaseProps {
  /** Centre line from source to load: an SVG path or polyline points (10 px rounded bends). */
  path: string | ReadonlyArray<Pt>;
  kind?: 'main' | 'standby';
  /** Fill-front leaves the source at fillFrom and reaches the load at fillTo (default: 50 px/frame). */
  fillFrom?: number;
  fillTo?: number;
  /** Filled from the start (e.g. standby, live from f0). */
  full?: boolean;
  /** Drain: fade over 8 frames from this frame. */
  drainFrom?: number;
  drainFrames?: number;
  /** Shimmer (long low-contrast dashes drifting source → load) while full, within [from, to). */
  shimmer?: boolean | {from: number; to: number};
  /** Draw the walls (default true). */
  walls?: boolean;
  wallColor?: string;
  fillColor?: string;
  /** Interior colour when empty (default none: the ground shows through). */
  emptyColor?: string | null;
  /** Fade the whole channel in from this frame (6 frames). */
  inAt?: number;
  /** Replace the drawing; geometry and timing stay the kit's (front = filled length in px from the source). */
  render?: (s: {centre: string; left: string; right: string; length: number; front: number; drain: number; shimmerOn: boolean; kind: 'main' | 'standby'; fillWidth: number; wall: number; appear: number}) => React.ReactNode;
}

export const EnergyChannel: React.FC<EnergyChannelProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  if (p.inAt !== undefined && frame < p.inAt) return null;
  const spec = p.kind === 'standby' ? CHANNEL.standby : CHANNEL.main;
  const d = typeof p.path === 'string' ? p.path : routePath(p.path, STROKE.channelBend);
  const poly = flattenPath(d)[0];
  if (!poly) return null;
  const centre = poly.pts;
  let L = 0;
  for (let i = 1; i < centre.length; i++) L += Math.hypot(centre[i][0] - centre[i - 1][0], centre[i][1] - centre[i - 1][1]);
  const seed = p.seed ?? 'channel';
  const wallOff = spec.outer / 2 - spec.wall / 2;
  const left = polyPath(offsetPolyline(centre, wallOff));
  const right = polyPath(offsetPolyline(centre, -wallOff));
  const fillColor = p.fillColor ?? (p.kind === 'standby' ? theme.energyStandby : theme.energy);
  const wallColor = p.wallColor ?? theme.structure;
  const appear = p.inAt !== undefined ? progress(frame, p.inAt, 6, EASE.arrive) : 1;

  // fill front (px from the source)
  let front = 0;
  if (p.full) front = L;
  else if (p.fillFrom !== undefined) {
    const to = p.fillTo ?? p.fillFrom + Math.ceil(L / CHANNEL.frontSpeed);
    front = L * clamp01((frame - p.fillFrom) / Math.max(1, to - p.fillFrom));
  }
  const drain = p.drainFrom !== undefined ? 1 - progress(frame, p.drainFrom, p.drainFrames ?? CHANNEL.drainFrames, EASE.exit) : 1;

  const edge = CHANNEL.frontEdge / 3;
  const edgeSteps = front > 0 && front < L ? [0.6, 0.35, 0.15] : [];

  let shimmerOn = false;
  if (p.shimmer && front >= L) {
    shimmerOn = p.shimmer === true || (frame >= p.shimmer.from && frame < p.shimmer.to);
  }
  const shimmerSpeed = p.kind === 'standby' ? CHANNEL.shimmerSpeedStandby : CHANNEL.shimmerSpeedMain;
  const shimmerFade =
    p.shimmer && typeof p.shimmer === 'object'
      ? Math.min(progress(frame, p.shimmer.from, 8), 1 - progress(frame, p.shimmer.to - 8, 8))
      : 1;

  if (p.render) {
    return <>{p.render({centre: d, left, right, length: L, front, drain, shimmerOn, kind: p.kind ?? 'main', fillWidth: spec.fill, wall: spec.wall, appear})}</>;
  }
  return (
    <g opacity={appear}>
      {p.emptyColor ? skin.stroke({d, color: p.emptyColor, width: spec.fill, role: 'other', seed: `${seed}:empty`, frame}) : null}
      {front > 0 && drain > 0
        ? skin.stroke({d, color: fillColor, width: spec.fill, opacity: drain, trim: front < L ? [0, front] : undefined, role: 'energy', seed: `${seed}:fill`, frame, cap: 'butt'})
        : null}
      {edgeSteps.map((op, i) => (
        <React.Fragment key={i}>
          {skin.stroke({d, color: fillColor, width: spec.fill, opacity: op * drain, trim: [front + edge * i, front + edge * (i + 1)], role: 'energy', seed: `${seed}:edge${i}`, frame, cap: 'butt'})}
        </React.Fragment>
      ))}
      {shimmerOn && drain > 0
        ? skin.stroke({
            d,
            color: theme.isDark ? '#FFFFFF' : '#000000',
            width: spec.fill,
            opacity: (theme.isDark ? 0.14 : 0.1) * shimmerFade * drain,
            dash: CHANNEL.shimmerDash,
            dashOffset: -frame * shimmerSpeed,
            role: 'other',
            seed: `${seed}:shimmer`,
            frame,
            cap: 'butt',
          })
        : null}
      {p.walls !== false ? (
        <>
          {skin.stroke({d: left, color: wallColor, width: spec.wall, role: 'wall', seed: `${seed}:wl`, frame, join: 'round'})}
          {skin.stroke({d: right, color: wallColor, width: spec.wall, role: 'wall', seed: `${seed}:wr`, frame, join: 'round'})}
        </>
      ) : null}
    </g>
  );
};
