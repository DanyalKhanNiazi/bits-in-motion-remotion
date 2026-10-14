/**
 * Energy v2 (ENGINE.md §9, STYLE_BIBLE §8.3): double-walled channels with a stepped fill-front (no gradients), a
 * visible shimmer (48/48 px dashes, ΔL* 10, 1.5 px/frame standby / 3 main, toward the load) only while the voice
 * talks about flow, a drain that follows a visible cause, and "pointed at" walls. Energy never travels as marks.
 * Drawn in WORLD coordinates inside a view's camera transform; every width is screen-constant (÷ zoom).
 */
import React from 'react';
import {CHANNEL, COLOR} from '../tokens';
import {makeTrack, offsetPolyline, polyPath, routePath, slicePolyline} from '../../shared/geom';
import {mixColor} from '../../shared/brand';
import {prog} from '../core/ease';
import {clamp01} from '../core/math';
import {inheritsWorld, scopeKey, type Pt, type ViewScope} from '../core/types';
import {byAt} from '../timeline/track';
import type {ChannelSpec} from '../world/types';

export type ChannelEvent =
  /** Fill-front from the source end (speed px/frame, default 50). */
  | {channel: string; kind: 'fill'; at: number; speed?: number; scope?: ViewScope}
  /** Retreat to the source (speed px/frame, default CHANNEL.drainSpeed) or an 8-frame fade. */
  | {channel: string; kind: 'drain'; at: number; mode?: 'retreat' | 'fade'; speed?: number; scope?: ViewScope}
  /** Only while the voice talks about flow. Round 3: `style: 'trickle'` adds the sparse pale dashes of a narrated
   *  standby trickle (CHANNEL.trickleDash) over the shimmer. */
  | {channel: string; kind: 'shimmer'; at: number; to: number; style?: 'trickle'; scope?: ViewScope}
  /** Walls step to textMuted. */
  | {channel: string; kind: 'point'; at: number; to: number; scope?: ViewScope};

export interface ChannelState {
  /** 0..1 filled fraction from the source end. */
  front: number;
  draining: boolean;
  /** 0..1 shimmer fade. */
  shimmer: number;
  pointed: number;
  /** Fill opacity (a 'fade' drain). */
  opacity: number;
  /** Frame the current shimmer started (dash phase). */
  shimmerAt: number;
  /** The front is moving (a fill or a retreat in progress): the stepped leading edge shows. */
  moving: boolean;
  /** Round 3: 0..1 strength of a narrated trickle (sparse pale dashes toward the load). */
  trickle: number;
}

const GEOM = new WeakMap<ChannelSpec, {d: string; pts: Pt[]; length: number}>();
export const channelGeom = (ch: ChannelSpec): {d: string; pts: Pt[]; length: number} => {
  let g = GEOM.get(ch);
  if (!g) {
    const d = routePath(ch.points, CHANNEL.bend);
    const t = makeTrack(d);
    g = {d, pts: t.pts, length: t.length};
    GEOM.set(ch, g);
  }
  return g;
};

const inScope = (evScope: ViewScope | undefined, view: ViewScope): boolean => {
  const k = scopeKey(evScope);
  return k === scopeKey(view) || (k === 'world' && inheritsWorld(view));
};

type Seg = {kind: 'const'; v: number} | {kind: 'fill'; at: number; from: number; speed: number} | {kind: 'retreat'; at: number; from: number; speed: number} | {kind: 'fade'; at: number; from: number};

const evalSeg = (s: Seg, f: number, L: number): {front: number; opacity: number; moving: boolean} => {
  switch (s.kind) {
    case 'const':
      return {front: s.v, opacity: 1, moving: false};
    case 'fill': {
      const v = Math.min(1, s.from + (s.speed * Math.max(0, f - s.at)) / Math.max(1, L));
      return {front: v, opacity: 1, moving: v < 1};
    }
    case 'retreat': {
      const v = Math.max(0, s.from - (s.speed * Math.max(0, f - s.at)) / Math.max(1, L));
      return {front: v, opacity: 1, moving: v > 0};
    }
    case 'fade': {
      const o = 1 - prog(f, s.at, CHANNEL.drainFrames, 'exit');
      return o > 0 ? {front: s.from, opacity: o, moving: false} : {front: 0, opacity: 1, moving: false};
    }
  }
};

export const channelAt = (frame: number, ch: ChannelSpec, events: ReadonlyArray<ChannelEvent>, scope: ViewScope): ChannelState => {
  const L = channelGeom(ch).length;
  let seg: Seg = {kind: 'const', v: ch.initial === 'full' ? 1 : 0};
  let shimmer = 0;
  let trickle = 0;
  const shimmerAt = 0;
  let pointed = 0;
  for (const e of byAt(events)) {
    if (e.at > frame) break;
    if (e.channel !== ch.id || !inScope(e.scope, scope)) continue;
    if (e.kind === 'fill') {
      const cur: number = evalSeg(seg, e.at, L).front;
      seg = {kind: 'fill', at: e.at, from: cur, speed: e.speed ?? CHANNEL.frontSpeed};
    } else if (e.kind === 'drain') {
      const cur: number = evalSeg(seg, e.at, L).front;
      seg = e.mode === 'fade' ? {kind: 'fade', at: e.at, from: cur} : {kind: 'retreat', at: e.at, from: cur, speed: e.speed ?? CHANNEL.drainSpeed};
    } else if (e.kind === 'shimmer') {
      const a = prog(frame, e.at, 6, 'arrive') * (1 - prog(frame, e.to, 6, 'exit'));
      // the dash phase stays locked to f0 (round 1: the idle shimmer runs throughout, so a narrated shimmer only
      // raises its strength and never jumps the dashes)
      if (a > shimmer) shimmer = a;
      if (e.style === 'trickle') trickle = Math.max(trickle, prog(frame, e.at, 10, 'arrive') * (1 - prog(frame, e.to, 8, 'exit')));
    } else if (e.kind === 'point') {
      pointed = Math.max(pointed, prog(frame, e.at, 4, 'arrive') * (1 - prog(frame, e.to, 6, 'exit')));
    }
  }
  const s = evalSeg(seg, frame, L);
  // round 1: a live standby channel always shimmers a little (narrated flow raises it to 1)
  if (ch.kind === 'standby' && CHANNEL.shimmerIdleStandby > shimmer) shimmer = CHANNEL.shimmerIdleStandby;
  return {
    front: clamp01(s.front),
    draining: seg.kind === 'retreat' || seg.kind === 'fade' ? s.front > 0 : false,
    shimmer,
    pointed,
    opacity: s.opacity,
    shimmerAt,
    moving: s.moving,
    trickle,
  };
};

export const ChannelV2: React.FC<{spec: ChannelSpec; state: ChannelState; frame: number; zoom: number; fillsOnly?: boolean}> = ({
  spec,
  state,
  frame,
  zoom,
  fillsOnly,
}) => {
  const g = channelGeom(spec);
  const dims = spec.kind === 'main' ? CHANNEL.main : CHANNEL.standby;
  const z = Math.max(1e-6, zoom);
  const fillW = dims.fill / z;
  const wallW = dims.wall / z;
  const off = (dims.outer / 2 - dims.wall / 2) / z;
  const fillColor = spec.kind === 'main' ? COLOR.energy : COLOR.energyStandby;
  const shimColor = spec.kind === 'main' ? COLOR.energyShimmer : COLOR.standbyShimmer;
  const L = g.length;
  const out: React.ReactNode[] = [];

  // fill (the solid part, then three 8 px steps at the leading edge while the front moves)
  const frontLen = state.front * L;
  if (frontLen > 0.01 && state.opacity > 0) {
    const step = CHANNEL.frontStepPx / z;
    const edge = state.moving ? Math.min(frontLen, step * CHANNEL.frontSteps.length) : 0;
    const solidEnd = frontLen - edge;
    if (solidEnd > 0.01) {
      out.push(
        <path
          key="fill"
          d={solidEnd >= L - 0.01 ? g.d : polyPath(slicePolyline(g.pts, 0, solidEnd))}
          fill="none"
          stroke={fillColor}
          strokeOpacity={state.opacity}
          strokeWidth={fillW}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />,
      );
    }
    if (edge > 0.01) {
      CHANNEL.frontSteps.forEach((op, k) => {
        const a = solidEnd + k * step;
        const b = Math.min(frontLen, a + step);
        if (b - a > 0.01)
          out.push(
            <path
              key={`edge${k}`}
              d={polyPath(slicePolyline(g.pts, a, b))}
              fill="none"
              stroke={fillColor}
              strokeOpacity={op * state.opacity}
              strokeWidth={fillW}
              strokeLinecap="butt"
            />,
          );
      });
    }
    // shimmer v2: dashes toward the load over the filled part
    if (!fillsOnly && state.shimmer > 0.001) {
      const [dash, gap] = CHANNEL.shimmerDash;
      const speed = spec.kind === 'main' ? CHANNEL.shimmerSpeedMain : CHANNEL.shimmerSpeedStandby;
      out.push(
        <path
          key="shimmer"
          d={frontLen >= L - 0.01 ? g.d : polyPath(slicePolyline(g.pts, 0, frontLen))}
          fill="none"
          stroke={shimColor}
          strokeOpacity={state.shimmer * state.opacity}
          strokeWidth={fillW}
          strokeDasharray={`${dash / z} ${gap / z}`}
          strokeDashoffset={(-speed * (frame - state.shimmerAt)) / z}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />,
      );
    }
    // round 3, the narrated trickle: sparse short pale dashes running to the load inside the thin fill (it never widens)
    if (!fillsOnly && state.trickle > 0.001 && spec.kind === 'standby') {
      const [dash, gap] = CHANNEL.trickleDash;
      out.push(
        <path
          key="trickle"
          d={frontLen >= L - 0.01 ? g.d : polyPath(slicePolyline(g.pts, 0, frontLen))}
          fill="none"
          stroke={COLOR.standbyTrickle}
          strokeOpacity={state.trickle * state.opacity}
          strokeWidth={fillW}
          strokeDasharray={`${dash / z} ${gap / z}`}
          strokeDashoffset={(-CHANNEL.trickleSpeed * frame) / z}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />,
      );
    }
  }
  if (fillsOnly) return <g>{out}</g>;
  // walls (screen-constant offsets of the centreline)
  const wallColor = state.pointed > 0 ? mixColor(COLOR.structure, COLOR.textMuted, Math.min(1, state.pointed)) : COLOR.structure;
  for (const s of [1, -1]) {
    out.push(
      <path
        key={`wall${s}`}
        d={polyPath(offsetPolyline(g.pts, s * off))}
        fill="none"
        stroke={wallColor}
        strokeWidth={wallW}
        strokeLinejoin="round"
        strokeLinecap="butt"
      />,
    );
  }
  return <g>{out}</g>;
};
