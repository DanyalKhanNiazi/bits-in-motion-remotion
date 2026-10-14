/**
 * `monitor` (ICONS.md §4.18): the display, a room object (parallax 0.9). The footprint is the BEZEL (280 × 170); the
 * stand (20 × 60) and foot (120 × 10) hang below it at the same scale.
 * Base: bezel (bodyHi, r 10) with its 2.5D side and rim; the screen inset 12 (`screenBlack` in Ep01; 'lit' later);
 * stand and foot (body) with their sides.
 * Detail: the panel's inner edge, the bezel's power LED, the stand's hinge and the foot's front lip.
 * Active region: the bezel (powered); the screen stays what `screen` says.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {
  DetailGroup,
  Detail,
  Glow,
  Lines,
  Outline,
  Pip,
  Raised,
  RimLight,
  Shell,
  StateHatch,
  Stroke,
  TopFace,
  basePorts,
  discD,
  lineD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';
import {mixColor} from '../../shared/brand';

export interface MonitorProps extends IconBaseProps {
  /** 'black' (Ep01) | 'lit' (later: true colours only). */
  screen?: 'black' | 'lit';
  /** Content for a lit screen, drawn clipped to the screen rect (world px). */
  screenContent?: React.ReactNode;
  /** Round 2: 0..1, a screen lighting up in a PREVIEW plate (never the world's monitor in Ep01): the screen fill steps
   *  screenBlack → activeFill and the generic `content` fades in. Tweened by prop events. */
  lit?: number;
  /** Round 2: a stylised generic screen (no logo, no captured UI): 'desktop' (two window outlines and a taskbar strip)
   *  or 'signin' (an avatar circle, one field and one button: the S07 sign-in card, solid). */
  content?: 'desktop' | 'signin';
  /** Round 2: 0..1, the content's own entrance after the screen has lit (default 1). */
  contentIn?: number;
  /** Round 4: 0..1, a power-on SWEEP (S08 "starting again"): while it runs the lit screen is revealed from the top down
   *  behind a bright scan line, instead of fading in. Undefined or 1 = no sweep. */
  sweep?: number;
}

/** Round 2: the generic screen contents, ink lines in world px (strokes ÷ zoom). */
const ScreenContent: React.FC<{kind: 'desktop' | 'signin'; r: Rect; zoom: number; opacity: number}> = ({kind, r, zoom, opacity}) => {
  const sw = 3 / zoom;
  if (kind === 'signin') {
    const cx = r.x + r.w / 2;
    const av = Math.min(r.w, r.h) * 0.14;
    // the centre band stays clear (a parked Bit sits on the screen's centre in the S06 Windows plate)
    return (
      <g opacity={opacity} fill="none" stroke={COLOR.ink} strokeWidth={sw} strokeLinecap="round">
        <path d={discD(cx, r.y + r.h * 0.24, av)} />
        <path d={discD(cx, r.y + r.h * 0.2, av * 0.38)} />
        <path d={rectD({x: cx - r.w * 0.24, y: r.y + r.h * 0.64, w: r.w * 0.48, h: r.h * 0.1}, 3 / zoom)} />
        <path d={rectD({x: cx - r.w * 0.12, y: r.y + r.h * 0.8, w: r.w * 0.24, h: r.h * 0.1}, 3 / zoom)} fill={COLOR.ink} fillOpacity={0.35} />
      </g>
    );
  }
  // desktop: a taskbar strip and two overlapping window outlines with title bars
  const tb = r.h * 0.12;
  const win = (x: number, y: number, w: number, h: number, k: string) => (
    <g key={k}>
      <path d={rectD({x, y, w, h}, 3 / zoom)} fill={COLOR.activeFill} />
      <path d={lineD(x, y + h * 0.2, x + w, y + h * 0.2)} />
    </g>
  );
  return (
    <g opacity={opacity} fill="none" stroke={COLOR.ink} strokeWidth={sw} strokeLinejoin="round">
      {win(r.x + r.w * 0.1, r.y + r.h * 0.12, r.w * 0.5, r.h * 0.48, 'a')}
      {win(r.x + r.w * 0.4, r.y + r.h * 0.3, r.w * 0.48, r.h * 0.44, 'b')}
      <path d={rectD({x: r.x, y: r.y + r.h - tb, w: r.w, h: tb}, 0)} fill={COLOR.ink} fillOpacity={0.18} stroke="none" />
      <path d={lineD(r.x, r.y + r.h - tb, r.x + r.w, r.y + r.h - tb)} />
    </g>
  );
};

export const monitorGeometry = (r: {x: number; y: number; w: number; h: number}) => {
  const k = r.w / 280;
  const ky = r.h / 170;
  const screen: Rect = {x: r.x + 12 * k, y: r.y + 12 * ky, w: r.w - 24 * k, h: r.h - 24 * ky};
  const stand: Rect = {x: r.x + 130 * k, y: r.y + r.h - 1, w: 20 * k, h: 60 * ky + 1};
  const foot: Rect = {x: r.x + 80 * k, y: r.y + r.h + 60 * ky, w: 120 * k, h: 10 * ky};
  return {k, ky, screen, stand, foot};
};

export const Monitor: React.FC<MonitorProps> = (p) => {
  const b = resolveBase(p, false);
  const g = monitorGeometry(b.rect);
  const {k, screen, stand, foot} = g;
  const r = Math.min(10 * k, b.w / 4);
  const d = rectD(b.rect, r);
  const scrD = rectD(screen, 3 * k);
  const standD = rectD(stand, 2 * k);
  const footD = rectD(foot, 4 * k);
  const lit = p.screen === 'lit';
  const litK = typeof p.lit === 'number' ? Math.max(0, Math.min(1, p.lit)) : lit ? 1 : 0;
  const clipId = `${b.id}-scr`;
  return (
    <Shell b={b}>
      {/* stand and foot behind the bezel */}
      <Raised d={footD} hull={raisedHullPath(foot, 4 * k, b.sideK(0.5))} />
      <Raised d={standD} hull={raisedHullPath(stand, 2 * k, b.sideK(0.6))} />
      <TopFace d={standD} fill={COLOR.body} />
      <TopFace d={footD} fill={COLOR.body} />
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.bodyHi)} />
      <StateHatch b={b} clipD={d} />
      {typeof p.sweep === 'number' && p.sweep > 0.001 && p.sweep < 0.999 && !b.fo ? (
        // round 4: the power-on sweep: black below the scan line, the lit screen above it
        <>
          <TopFace d={scrD} fill={COLOR.screenBlack} />
          <defs>
            <clipPath id={`${clipId}-sw`}>
              <rect x={screen.x} y={screen.y} width={screen.w} height={screen.h * p.sweep} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId}-sw)`}>
            <TopFace d={scrD} fill={COLOR.activeFill} />
            {p.content ? <ScreenContent kind={p.content} r={screen} zoom={b.zoom} opacity={1} /> : null}
          </g>
          <path d={lineD(screen.x, screen.y + screen.h * p.sweep, screen.x + screen.w, screen.y + screen.h * p.sweep)} stroke={COLOR.ink} strokeWidth={4 / b.zoom} />
        </>
      ) : (
        <>
          <TopFace d={scrD} fill={litK > 0 && litK < 1 ? mixColor(COLOR.screenBlack, COLOR.activeFill, litK) : litK >= 1 ? COLOR.activeFill : COLOR.screenBlack} />
          {p.content && litK > 0.01 && !b.fo ? <ScreenContent kind={p.content} r={screen} zoom={b.zoom} opacity={litK * Math.max(0, Math.min(1, p.contentIn ?? 1))} /> : null}
        </>
      )}
      {lit && p.screenContent && !b.fo ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <path d={scrD} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>{p.screenContent}</g>
        </>
      ) : null}
      <DetailGroup b={b}>
        <Detail d={rectD({x: screen.x - 3 * k, y: screen.y - 3 * k, w: screen.w + 6 * k, h: screen.h + 6 * k}, 5 * k)} zoom={b.zoom} opacity={0.7} />
        <Detail d={discD(b.x + b.w - 20 * k, b.y + b.h - 6 * k, 1.8 * k)} zoom={b.zoom} fill />
        <Detail d={lineD(stand.x, stand.y + 10 * k, stand.x + stand.w, stand.y + 10 * k)} zoom={b.zoom} />
        <Detail d={lineD(foot.x + 6 * k, foot.y + 3 * k, foot.x + foot.w - 6 * k, foot.y + 3 * k)} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      <RimLight rect={foot} radius={4 * k} zoom={b.zoom} inset={b.s(1.5)} />
      <Lines>
        <Stroke d={standD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        <Stroke d={footD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />
        <Stroke d={scrD} zoom={b.zoom} color={COLOR.side} width={STROKE.detail} />
      </Lines>
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const monitorPorts = (p: MonitorProps): Ports => {
  const g = monitorGeometry(p);
  return {
    ...basePorts(p, false),
    foot: [g.foot.x + g.foot.w / 2, g.foot.y + g.foot.h],
    screenRect: [g.screen.x, g.screen.y],
    screenRectEnd: [g.screen.x + g.screen.w, g.screen.y + g.screen.h],
    screenCenter: [g.screen.x + g.screen.w / 2, g.screen.y + g.screen.h / 2],
  };
};

export const monitorSpec: IconSpec<MonitorProps> = {
  type: 'monitor',
  component: Monitor,
  size: {w: 280, h: 170},
  z: 10,
  passive: false,
  ports: monitorPorts,
};
