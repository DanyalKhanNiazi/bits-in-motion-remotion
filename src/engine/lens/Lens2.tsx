/**
 * The Lens v2 (ENGINE.md §11, STYLE_BIBLE §9.5): a thin `emphasis` ring (4 px, d 400) with four ticks. It opens over
 * 9 frames drawn clockwise from 12 o'clock while the view inside is revealed by a wedge that follows the pen (02's
 * iris, LENS2.wipeLead); the magnified view is the SAME world at ×k relative to the surrounding view; a 3 px leader at
 * 70% runs to a 10 px target (drawn over 8 frames from leaderAt, before the ring); a scale chip sits at 4:30.
 * D24 settle: ring and ticks fade to a 3 px grey rim over 6 frames. Close: 6 frames (radius 100 → 85%, fade).
 * Dive (long-form, T7): the ring grows to cover the frame over 16 frames ('move') while the view inside slides to the
 * frame centre; the main camera cuts to the Lens shot on the last frame (buildScript adds that cut), so the hand-off
 * is seamless. Surface (14 frames) reverses it.
 */
import React from 'react';
import {interpolateColors} from 'remotion';
import {ALPHA, COLOR, DUR, LENS2} from '../tokens';
import {circlePath, linePath} from '../../shared/geom';
import {prog} from '../core/ease';
import {clamp01, f2, lerp} from '../core/math';
import {isPt, type AnchorRef, type Pt, type ViewScope} from '../core/types';
import {cameraAt, project, S0, viewCam, type Cam} from '../camera/camera';
import {resolveAnchor} from '../world/states';
import type {WorldSpec} from '../world/types';
import {View} from '../view/View';
import {ScaleChip2, scaleChipSize} from '../glyphs/draw';
import type {Script} from '../timeline/script';

export interface LensSpec {
  id: string;
  /** Ring centre: {screen: Pt}, or a world point projected at openAt. */
  center: Pt | {screen: Pt};
  /** 400 (300–420). */
  d: number;
  mode: 'magnify' | 'xray';
  /** Magnification relative to the surrounding view (×4–×8). */
  k: number;
  /** The world point shown at the ring centre. */
  focus: AnchorRef;
  /** The 10 px target square the leader runs to (magnify). */
  target?: AnchorRef;
  /** The leader draws from the ring position to the target over 8 frames from here, BEFORE the ring opens. Default openAt. */
  leaderAt?: number;
  /** Ring starts; complete at openAt + 9. */
  openAt: number;
  /** D24: ring and ticks fade to a 3 px grey rim over 6 frames. */
  settleAt?: number;
  /** 6-frame close. */
  closeAt: number;
  /** '×4' */
  chip?: string;
  /** Default {lens: id}. */
  scope?: ViewScope;
  /** Dive into the Lens view (16 frames); the main camera cuts to the Lens shot at diveAt + 16 (added by buildScript). */
  diveAt?: number;
  /** Surface from the Lens view back to the ring (14 frames); buildScript cuts the main camera back at surfaceAt. */
  surfaceAt?: number;
  /** Ring, ticks, leader and target colour. Round 1: magenta ('emphasis', the default) belongs to the "?": a Lens on
   *  anything else uses 'ink' (judges: a magenta ring on the lookout tied it to the "?"). */
  tone?: 'emphasis' | 'ink';
}

export interface LensDraw {
  visible: boolean;
  /** Ring radius now (px). */
  r: number;
  /** Fraction of the ring drawn. */
  draw: number;
  ticks: number;
  contentOpacity: number;
  ringColor: string;
  ringWidth: number;
  chip: number;
  leader: number;
  opacity: number;
  /** 0..1 dive progress (1 = the view fills the frame) and the ring's own opacity during it. */
  dive: number;
  ringOpacity: number;
  /** 0..1 D24 settle. */
  settle: number;
}

const coverRadius = (c: Pt): number => Math.max(Math.hypot(c[0], c[1]), Math.hypot(1920 - c[0], c[1]), Math.hypot(c[0], 1080 - c[1]), Math.hypot(1920 - c[0], 1080 - c[1]));

/** Timing of a Lens at a frame (geometry in px relative to its own radius; `cover` = radius that covers the frame). */
export const lensAt = (frame: number, spec: LensSpec, cover = 2300): LensDraw => {
  const R = spec.d / 2;
  const tone = spec.tone === 'ink' ? COLOR.ink : COLOR.emphasis;
  const st: LensDraw = {
    visible: false,
    r: R,
    draw: 1,
    ticks: 1,
    contentOpacity: 1,
    ringColor: tone,
    ringWidth: LENS2.stroke,
    chip: 1,
    leader: 0,
    opacity: 1,
    dive: 0,
    ringOpacity: 1,
    settle: 0,
  };
  const leaderAt = spec.leaderAt ?? spec.openAt;
  st.leader = prog(frame, leaderAt, 8, 'arrive');
  const startAt = spec.surfaceAt !== undefined && spec.surfaceAt < spec.openAt ? spec.surfaceAt : spec.openAt;
  if (frame < Math.min(startAt, leaderAt)) return st;
  if (frame >= spec.closeAt + DUR.lensClose) return {...st, leader: 0};
  if (spec.diveAt !== undefined && frame >= spec.diveAt + DUR.lensDive) return {...st, leader: 0};
  if (frame < startAt) {
    // only the leader so far
    st.visible = st.leader > 0;
    st.draw = 0;
    st.ticks = 0;
    st.chip = 0;
    st.contentOpacity = 0;
    return st;
  }
  st.visible = true;
  if (spec.surfaceAt !== undefined && frame >= spec.surfaceAt && (spec.diveAt === undefined || spec.surfaceAt > spec.diveAt || frame < spec.diveAt)) {
    const t = prog(frame, spec.surfaceAt, DUR.lensSurface, 'move');
    st.r = lerp(cover, R, t);
    st.dive = 1 - t;
    st.ringOpacity = clamp01((frame - (spec.surfaceAt + DUR.lensSurface - 5)) / 5);
    st.ticks = clamp01((frame - (spec.surfaceAt + DUR.lensSurface - 2)) / 2);
    st.chip = st.ticks;
  } else {
    const t = frame - spec.openAt;
    const e = 1 - Math.pow(1 - clamp01(t / DUR.lensOpen), 3);
    st.r = R * lerp(0.7, 1, e);
    st.draw = e;
    st.ticks = clamp01((t - 6) / 2);
    st.chip = st.ticks;
  }
  if (spec.settleAt !== undefined) {
    const s = prog(frame, spec.settleAt, DUR.lensSettle, 'linear');
    st.settle = s;
    if (s > 0) st.ringColor = interpolateColors(s, [0, 1], [tone, COLOR.structure]);
    st.ringWidth = lerp(LENS2.stroke, LENS2.rimStroke, s);
    st.ticks *= 1 - s;
    // round 2 (judges: the Lens's link to its subject vanished at the settle): the leader stays, greying with the ring
  }
  if (spec.diveAt !== undefined && frame >= spec.diveAt) {
    const t = prog(frame, spec.diveAt, DUR.lensDive, 'move');
    st.dive = t;
    st.r = lerp(st.r, cover, t);
    const early = 1 - prog(frame, spec.diveAt, 4, 'exit');
    st.ticks *= early;
    st.chip *= early;
    st.leader *= early;
    st.ringOpacity = 1 - clamp01((frame - (spec.diveAt + DUR.lensDive - 5)) / 5);
  }
  if (frame >= spec.closeAt) {
    const t = prog(frame, spec.closeAt, DUR.lensClose, 'exit');
    st.r *= lerp(1, 0.85, t);
    st.opacity = 1 - t;
  }
  return st;
};

/** The ring centre in screen px (a world centre is projected with the camera at openAt). */
export const lensCenter = (spec: LensSpec, script: Pick<Script, 'camera'>): Pt => {
  if (!isPt(spec.center)) return (spec.center as {screen: Pt}).screen;
  return project(cameraAt(spec.openAt, script.camera), spec.center as Pt);
};

const wedgePath = (cx: number, cy: number, r: number, frac: number): string => {
  if (frac >= 0.999) return circlePath(cx, cy, r);
  const a = frac * Math.PI * 2 - Math.PI / 2;
  const x = cx + Math.cos(a) * r;
  const y = cy + Math.sin(a) * r;
  return `M${f2(cx)} ${f2(cy)}L${f2(cx)} ${f2(cy - r)}A${f2(r)} ${f2(r)} 0 ${frac > 0.5 ? 1 : 0} 1 ${f2(x)} ${f2(y)}Z`;
};

export const Lens2: React.FC<{spec: LensSpec; frame: number; mainCam: Cam; world: WorldSpec; script: Readonly<Script>}> = ({spec, frame, mainCam, world, script}) => {
  const c0 = lensCenter(spec, script);
  const st = lensAt(frame, spec, coverRadius(c0) + 40);
  if (!st.visible) return null;
  const scope: ViewScope = spec.scope ?? {lens: spec.id};
  // during a dive the view slides from the ring centre to the frame centre
  const vc: Pt = [lerp(c0[0], S0[0], st.dive), lerp(c0[1], S0[1], st.dive)];
  const r = st.r;
  const focusW = resolveAnchor(world, spec.focus);
  const vcam = viewCam({center: focusW, zoom: mainCam.zoom * spec.k}, {x: vc[0] - r, y: vc[1] - r, w: 2 * r, h: 2 * r});
  const clipR = Math.max(0, r - st.ringWidth / 2);
  const reveal = st.dive > 0 ? 1 : Math.min(1, st.draw * LENS2.wipeLead);
  const C = 2 * Math.PI * r;
  const target = spec.target ? project(mainCam, resolveAnchor(world, spec.target)) : null;

  // leader: from the ring's edge toward the target (in the Lens's tone)
  const leaderColor = st.settle > 0 ? st.ringColor : spec.tone === 'ink' ? COLOR.ink : COLOR.emphasis;
  let leader: React.ReactNode = null;
  if (target && st.leader > 0) {
    const dx = target[0] - c0[0];
    const dy = target[1] - c0[1];
    const L = Math.hypot(dx, dy) || 1;
    const R = spec.d / 2;
    const p0: Pt = [c0[0] + (dx / L) * R, c0[1] + (dy / L) * R];
    const p1: Pt = [lerp(p0[0], target[0], st.leader), lerp(p0[1], target[1], st.leader)];
    const ts = LENS2.target;
    leader = (
      <g opacity={st.opacity}>
        <path d={linePath(p0, p1)} stroke={leaderColor} strokeOpacity={ALPHA.lensLeader} strokeWidth={LENS2.leader} />
        {st.leader >= 0.99 ? <rect x={target[0] - ts / 2} y={target[1] - ts / 2} width={ts} height={ts} fill="none" stroke={leaderColor} strokeOpacity={ALPHA.lensLeader} strokeWidth={2} /> : null}
      </g>
    );
  }

  const ticks =
    st.ticks > 0
      ? [0, 90, 180, 270].map((deg) => {
          const a = ((deg - 90) * Math.PI) / 180;
          const len = LENS2.tickLength * st.ticks;
          const p0: Pt = [vc[0] + Math.cos(a) * r, vc[1] + Math.sin(a) * r];
          const p1: Pt = [vc[0] + Math.cos(a) * (r - len), vc[1] + Math.sin(a) * (r - len)];
          return <path key={deg} d={linePath(p0, p1)} stroke={st.ringColor} strokeWidth={LENS2.tickWidth} strokeOpacity={st.ticks} />;
        })
      : null;

  let chip: React.ReactNode = null;
  if (spec.chip && st.chip > 0) {
    const a = ((LENS2.chipAngleDeg - 90) * Math.PI) / 180;
    const sz = scaleChipSize(spec.chip);
    const px = vc[0] + Math.cos(a) * (r + 10);
    const py = vc[1] + Math.sin(a) * (r + 10);
    chip = <ScaleChip2 x={px - (Math.cos(a) < 0 ? sz.w : 0)} y={py - (Math.sin(a) < 0 ? sz.h : 0)} text={spec.chip} opacity={st.chip * st.opacity} />;
  }

  return (
    <>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        {leader}
      </svg>
      {st.draw > 0 || st.dive > 0 ? (
        <View
          frame={frame}
          cam={vcam}
          clip={{path: wedgePath(vc[0], vc[1], clipR, reveal)}}
          world={world}
          scope={scope}
          script={script}
          id={`lens-${spec.id}`}
          background={COLOR.field}
          inLens={1 - st.dive}
          opacity={st.opacity}
        />
      ) : null}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, opacity: st.opacity}}>
        <path
          d={circlePath(vc[0], vc[1], r)}
          fill="none"
          stroke={st.ringColor}
          strokeWidth={st.ringWidth}
          strokeOpacity={st.ringOpacity}
          strokeDasharray={st.draw < 1 && st.dive === 0 ? `${C * st.draw} ${C + 10}` : undefined}
        />
        {ticks}
        {chip}
      </svg>
    </>
  );
};
