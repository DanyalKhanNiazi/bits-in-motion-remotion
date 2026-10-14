/**
 * Ep06 kit: <SplitCompare>, left "Hard drive" | right "SSD" (used ONLY for hard drive vs SSD: P01 from f472, P02, P13,
 * P15, P22). ONE Stage, two clipped panels. Each panel renders world content (an <Archive>, or anything in 1920×1080
 * world px) under its own camera; the panel scale is multiplied into the camera context, so `screen` text and
 * anchors stay true (use splitToScreen for hud points). Headers, chip slots and a verdict slot sit at SPLIT geometry.
 *
 *   <SplitCompare frame={f} at={472} enter="compress"
 *     left={{cam: archiveCam('split'), render: (fr) => <Archive frame={fr} state="HDD_DELETED" lift={1} />, light: 'cool'}}
 *     right={{cam: archiveCam('split'), render: (fr) => <Archive frame={fr} state="SSD_DELETED" lift={1} />, light: 'ssd'}}
 *     leftChip={<VerdictChip …/>} rightChip={…} verdict={<VerdictCard …/>} />
 */
import React from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {CameraContext, stagePose, type CamInput, type Pose} from './camera';
import {ArchiveEnv, FlashEnv, StageEnv, type ArchiveLight} from './envs';
import {EASE, PAL, SANS} from './look';
import {Stage, type EnvSpec} from './Stage';
import {assetBox, assetUrl, type AssetName} from './assets';
import {checkText} from './text';
import {clamp01, lerp, prog, rgba} from './util';

/** SplitCompare geometry (screen px at 1080p). Frozen at the gate. */
export const SPLIT = {
  left: {x0: 64, x1: 936},
  right: {x0: 984, x1: 1856},
  divider: 960,
  header: {y0: 96, y1: 160, cy: 128, size: 56, icon: 64},
  chipY: 190,
  content: {y0: 230, y1: 770},
  verdict: {x: 960, y0: 790, y1: 920, cy: 855},
  /** frames of the slide-in / compress */
  slideIn: 14,
  /** world→panel scale for 1920×1080 content (cover-fit of the 872×540 window) */
  scale: 0.5,
  headers: {left: 'Hard drive', right: 'SSD'},
  icons: {left: 'hard-drive_b', right: 'ssd-board_b'} as {left: AssetName; right: AssetName},
} as const;

export type SplitSide = 'left' | 'right';
export type SplitEnter = 'compress' | 'slide' | 'none';
export type SplitPanel = {
  /** world content of the panel (1920×1080 world px), e.g. an <Archive> */
  render: (frame: number) => React.ReactNode;
  /** the panel's camera (keys / pose / function), e.g. archiveCam('split') */
  cam?: CamInput;
  drift?: number;
  /** the panel's backdrop: an archive light, 'flash', 'stage' or 'none' (default: archive 'cool' left, 'ssd' right) */
  light?: ArchiveLight | 'flash' | 'stage' | 'none';
  /** header text and icon (default "Hard drive" / "SSD" with hard-drive_b / ssd-board_b) */
  header?: string | false;
  icon?: AssetName | false;
};

/** The panel's window (clip) and content transform at a frame: rect, content centre, content scale k. */
export const splitPanel = (side: SplitSide, frame: number, at = -1e9, enter: SplitEnter = 'none') => {
  const P = SPLIT[side];
  const tgt: {x0: number; y0: number; x1: number; y1: number} = {x0: P.x0, y0: SPLIT.content.y0, x1: P.x1, y1: SPLIT.content.y1};
  const t = enter === 'none' ? 1 : EASE.inOut(prog(frame, at, SPLIT.slideIn));
  let r = tgt;
  let k: number = SPLIT.scale;
  if (enter === 'compress' && side === 'left') {
    r = {x0: lerp(0, tgt.x0, t), y0: lerp(0, tgt.y0, t), x1: lerp(1920, tgt.x1, t), y1: lerp(1080, tgt.y1, t)};
    k = lerp(1, SPLIT.scale, t);
  } else if (enter !== 'none') {
    const dx = (side === 'right' ? 1 : -1) * (1 - t) * 1000;
    r = {x0: tgt.x0 + dx, y0: tgt.y0, x1: tgt.x1 + dx, y1: tgt.y1};
  }
  return {...r, cx: (r.x0 + r.x1) / 2, cy: (r.y0 + r.y1) / 2, k, t};
};

/** World point of a panel's content → screen px (for hud labels/leaders over a panel). */
export const splitToScreen = (
  side: SplitSide,
  frame: number,
  o: {cam?: CamInput; drift?: number; at?: number; enter?: SplitEnter},
  wx: number,
  wy: number,
): {x: number; y: number; scale: number} => {
  const pp = splitPanel(side, frame, o.at, o.enter);
  const pose = stagePose(o.cam, frame, o.drift ?? 0.5);
  const r = (pose.rot * Math.PI) / 180;
  const z = pose.zoom * pp.k;
  const dx = (wx - pose.x) * z;
  const dy = (wy - pose.y) * z;
  return {x: pp.cx + dx * Math.cos(r) - dy * Math.sin(r), y: pp.cy + dx * Math.sin(r) + dy * Math.cos(r), scale: z};
};

const PanelEnv: React.FC<{frame: number; light: SplitPanel['light']; pose: Pose}> = ({frame, light, pose}) => {
  if (light === 'none') return null;
  if (light === 'flash') return <FlashEnv frame={frame} pose={pose} dust={18} />;
  if (light === 'stage') return <StageEnv frame={frame} pose={pose} dust={18} />;
  return <ArchiveEnv frame={frame} pose={pose} light={light ?? 'cool'} dust={18} />;
};

const Panel: React.FC<{side: SplitSide; frame: number; at: number; enter: SplitEnter; p: SplitPanel; outerZoom: number}> = ({side, frame: f, at, enter, p, outerZoom}) => {
  const pp = splitPanel(side, f, at, enter);
  if (pp.x1 < -10 || pp.x0 > 1930) return null;
  const pose = stagePose(p.cam, f, p.drift ?? 0.5);
  const z = pose.zoom * pp.k;
  const w = pp.x1 - pp.x0;
  const h = pp.y1 - pp.y0;
  const frameOp = enter === 'compress' && side === 'left' ? clamp01((pp.t - 0.3) / 0.5) : 1;
  return (
    <>
      {/* bezel: a dark steel frame with a lit top edge and a soft drop shadow */}
      <div
        style={{
          position: 'absolute',
          left: pp.x0 - 8,
          top: pp.y0 - 8,
          width: w + 16,
          height: h + 16,
          borderRadius: 18,
          background: 'linear-gradient(180deg, #33435E 0%, #1A2436 30%, #0D131F 100%)',
          boxShadow: `0 24px 60px ${rgba('#000000', 0.55)}, inset 0 1px 0 ${rgba('#C3CCDD', 0.5)}`,
          opacity: frameOp,
        }}
      />
      <div style={{position: 'absolute', left: pp.x0, top: pp.y0, width: w, height: h, overflow: 'hidden', borderRadius: 12 * frameOp, background: PAL.void}}>
        {/* the panel backdrop: an env seen through the panel's own camera, at panel scale */}
        <div style={{position: 'absolute', left: w / 2 - 960 * pp.k, top: h / 2 - 540 * pp.k, width: 1920, height: 1080, transform: `scale(${pp.k})`, transformOrigin: '0 0'}}>
          <PanelEnv frame={f} light={p.light ?? (side === 'left' ? 'cool' : 'ssd')} pose={pose} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            transformOrigin: '0 0',
            transform: `translate(${w / 2}px, ${h / 2}px) rotate(${pose.rot}deg) scale(${z}) translate(${-pose.x}px, ${-pose.y}px)`,
          }}
        >
          <CameraContext.Provider value={{zoom: z * outerZoom, rot: pose.rot, x: pose.x, y: pose.y, space: 'panel'}}>{p.render(f)}</CameraContext.Provider>
        </div>
        {/* glass: a faint top reflection */}
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(170deg, ${rgba('#FFFFFF', 0.05)} 0%, rgba(255,255,255,0) 30%)`, pointerEvents: 'none'}} />
      </div>
    </>
  );
};

const Header: React.FC<{side: SplitSide; frame: number; at: number; enter: SplitEnter; text: string | false; icon: AssetName | false}> = ({side, frame: f, at, enter, text, icon}) => {
  const P = SPLIT[side];
  const t = enter === 'none' ? 1 : prog(f, at + (side === 'left' ? 4 : 8), 12, EASE.out);
  if (t <= 0 || text === false) return null;
  const size = SPLIT.header.size;
  checkText('label', size, false, {zoom: 1, rot: 0, space: 'screen'}, text);
  const ib = icon ? assetBox(icon) : null;
  const ih = SPLIT.header.icon;
  const iw = ib ? Math.min(132, (ib.cw / ib.ch) * ih) : 0;
  const ihh = ib ? (iw / ib.cw) * ib.ch : 0;
  const k = ib ? iw / ib.cw : 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: (P.x0 + P.x1) / 2,
        top: SPLIT.header.cy,
        transform: `translate(-50%, -50%) translateY(${(1 - t) * 18}px)`,
        opacity: t,
        display: 'flex',
        alignItems: 'center',
        gap: 22,
        whiteSpace: 'nowrap',
      }}
    >
      {ib && icon ? (
        <div style={{position: 'relative', width: iw, height: ihh, overflow: 'visible'}}>
          <Img src={assetUrl(icon)} style={{position: 'absolute', left: -ib.x0 * k, top: -ib.y0 * k, width: ib.w * k, height: ib.h * k}} />
        </div>
      ) : null}
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: size, color: PAL.ink, letterSpacing: '-0.01em', lineHeight: 1}}>{text}</span>
    </div>
  );
};

export type SplitCompareProps = {
  frame: number;
  /** the slide-in starts here (14 f) */
  at?: number;
  /** 'compress': the full frame compresses into the left panel while the SSD panel slides in (P01 f472); 'slide': both
   *  slide in; 'none': already split */
  enter?: SplitEnter;
  left: SplitPanel;
  right: SplitPanel;
  /** chips under the headers (y 190), centred on each panel: any node drawn around (0, 0) */
  leftChip?: React.ReactNode;
  rightChip?: React.ReactNode;
  /** the verdict slot: a node drawn around (0, 0) at x 960, y 855 (790–920) */
  verdict?: React.ReactNode;
  /** extra screen-space overlay (labels at splitToScreen points, footnotes, quotes) */
  hud?: React.ReactNode;
  /** the Stage env behind the panels (default a dark 'void') */
  env?: EnvSpec;
  shake?: Array<{at: number; strength?: number}>;
};

/** Hard drive | SSD, one Stage, two clipped panels. */
export const SplitCompare: React.FC<SplitCompareProps> = ({frame: f, at = -1e9, enter = 'none', left, right, leftChip, rightChip, verdict, hud, env = 'void', shake}) => {
  const t = enter === 'none' ? 1 : prog(f, at, SPLIT.slideIn, EASE.inOut);
  const anchor = (x: number, y: number, node: React.ReactNode) =>
    node ? (
      <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
        <CameraContext.Provider value={{zoom: 1, rot: 0, space: 'screen'}}>{node}</CameraContext.Provider>
      </div>
    ) : null;
  return (
    <Stage
      frame={f}
      env={env}
      drift={0}
      shake={shake}
      hud={
        <>
          <Header side="left" frame={f} at={at} enter={enter} text={left.header ?? SPLIT.headers.left} icon={left.icon ?? SPLIT.icons.left} />
          <Header side="right" frame={f} at={at} enter={enter} text={right.header ?? SPLIT.headers.right} icon={right.icon ?? SPLIT.icons.right} />
          {anchor((SPLIT.left.x0 + SPLIT.left.x1) / 2, SPLIT.chipY, leftChip)}
          {anchor((SPLIT.right.x0 + SPLIT.right.x1) / 2, SPLIT.chipY, rightChip)}
          {anchor(SPLIT.verdict.x, SPLIT.verdict.cy, verdict)}
          {hud}
        </>
      }
    >
      <AbsoluteFill>
        {/* the divider */}
        <div
          style={{
            position: 'absolute',
            left: SPLIT.divider - 1.5,
            top: SPLIT.header.y0 - 10,
            width: 3,
            height: (SPLIT.content.y1 - SPLIT.header.y0 + 20) * clamp01((t - 0.4) / 0.6),
            borderRadius: 2,
            background: `linear-gradient(180deg, ${rgba(PAL.annotation, 0)}, ${rgba(PAL.annotation, 0.55)} 20%, ${rgba(PAL.annotation, 0.55)} 80%, ${rgba(PAL.annotation, 0)})`,
          }}
        />
        <Panel side="left" frame={f} at={at} enter={enter} p={left} outerZoom={1} />
        <Panel side="right" frame={f} at={at} enter={enter} p={right} outerZoom={1} />
      </AbsoluteFill>
    </Stage>
  );
};
