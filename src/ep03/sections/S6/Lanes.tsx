/**
 * S6 lanes: the S1 teaser's two lanes, now labelled. Each pane: a "?" that flips to its label, a track where the Bit
 * runs at the lane's speed (streak length = speed), and a speed gauge whose needle follows it.
 */
import React, {useId} from 'react';
import {AtlasOpener, EASE, Footnote, KineticText, PAL, PowerDial, Rich, SANS, SPRING, Stage, TAU, clamp01, lerp, mixHex, prog, rgba, safeId, springAt, track, type Key} from '../../kit';
import {A, CUT} from './anchors';
import {StreakBit, travelled} from './common';

export type LaneProps = {
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  /** "?" flips to the title here (omit to keep the "?") */
  revealAt?: number;
  /** speed factor (1 = full power) as a keyframe track */
  speed: readonly Key[];
  result?: {text: string; at: number; color: string; accent?: string};
  seed: string;
  /** the pane slides in from this side at this frame */
  enter?: {at: number; from: 1 | -1};
};

const BASE = 30; // px per frame at full speed

export const LanePane: React.FC<LaneProps> = ({frame: f, x, y, w, h, title, revealAt, speed, result, seed, enter}) => {
  const gid = safeId(useId());
  const ent = enter ? springAt(f, enter.at, SPRING.snap) : 1;
  if (enter && f < enter.at) return null;
  const dx = enter ? (1 - ent) * enter.from * 1400 : 0;
  // track geometry
  const tx0 = x + 70;
  const tx1 = x + w - 560;
  const ty = y + h * 0.66;
  const len = tx1 - tx0;
  const v = track(f, speed);
  const d = travelled(f, speed, BASE);
  const bx = tx0 + 30 + ((((d % (len + 160)) + (len + 160)) % (len + 160)) - 60);
  const sp = v * BASE;
  // gauge
  const gx = x + w - 290;
  const gy = y + h * 0.47;
  const R = 128;
  const gv = clamp01(0.84 * v + 0.012 * Math.sin((TAU * f) / 9) * v);
  const ang = (deg: number) => (deg * Math.PI) / 180;
  const arc = (a0: number, a1: number, r: number) => {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 4));
    let s = '';
    for (let i = 0; i <= n; i++) {
      const a = ang(a0 + ((a1 - a0) * i) / n);
      s += `${i ? 'L' : 'M'}${(gx + r * Math.cos(a)).toFixed(1)} ${(gy + r * Math.sin(a)).toFixed(1)} `;
    }
    return s;
  };
  const A0 = 150;
  const SW = 240;
  const needleA = A0 + SW * gv;
  const slow = clamp01((0.5 - gv) / 0.2);
  const fillC = mixHex(PAL.info, PAL.wait, slow);
  // title flip
  const rv = revealAt ?? 1e9;
  const qOut = prog(f, rv - 5, 7, EASE.inCubic);
  const tIn = springAt(f, rv, SPRING.snap);
  const titleY = y + 92;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateX(${dx}px)`}}>
      {/* glass pane */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: 30,
          background: `linear-gradient(180deg, ${rgba('#13213F', 0.88)}, ${rgba('#070D1B', 0.92)})`,
          border: `2px solid ${rgba(PAL.structure, 0.38)}`,
          boxShadow: `0 30px 60px ${rgba('#000000', 0.45)}, inset 0 2px 0 ${rgba('#8FB0E8', 0.18)}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(${rgba(PAL.structure, 0.07)} 2px, transparent 2px), linear-gradient(90deg, ${rgba(PAL.structure, 0.07)} 2px, transparent 2px)`,
            backgroundSize: '64px 64px',
            backgroundPosition: `${-d * 0.08}px 0px`,
          }}
        />
      </div>
      {/* title: "?" → label */}
      {qOut < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: x + 70,
            top: titleY,
            transform: `translateY(-50%) perspective(900px) rotateX(${90 * qOut}deg)`,
            transformOrigin: '50% 50%',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 112,
            lineHeight: 1,
            color: PAL.emphasis,
            textShadow: `0 0 30px ${rgba(PAL.emphasis, 0.55)}`,
            opacity: 1 - qOut * 0.6,
          }}
        >
          ?
        </div>
      ) : null}
      {f >= rv ? (
        <div
          style={{
            position: 'absolute',
            left: x + 70,
            top: titleY,
            transform: `translateY(-50%) perspective(900px) rotateX(${-90 * (1 - Math.min(1, tIn))}deg)`,
            transformOrigin: '50% 50%',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 76,
            lineHeight: 1,
            color: PAL.ink,
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}
        >
          {title}
        </div>
      ) : null}
      {/* track */}
      <div
        style={{
          position: 'absolute',
          left: tx0,
          top: ty - 40,
          width: len,
          height: 80,
          borderRadius: 40,
          background: rgba('#02050B', 0.88),
          border: `2px solid ${rgba(PAL.structure, 0.42)}`,
          boxShadow: `inset 0 6px 18px ${rgba('#000000', 0.6)}`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 38,
            height: 4,
            backgroundImage: `linear-gradient(90deg, ${rgba(PAL.annotation, 0.42)} 0 34px, transparent 34px 80px)`,
            backgroundSize: '80px 4px',
            backgroundPosition: `${d % 80}px 0px`,
          }}
        />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <clipPath id={`${gid}-clip`}>
            <rect x={tx0 + 4} y={ty - 38} width={len - 8} height={76} rx={36} />
          </clipPath>
          <filter id={`${gid}-gl`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={9} />
          </filter>
        </defs>
        <g clipPath={`url(#${gid}-clip)`}>
          <StreakBit x={bx} y={ty} speed={sp} size={30} gid={`${gid}-b`} />
        </g>
        {/* gauge */}
        <circle cx={gx} cy={gy} r={R + 34} fill={rgba('#03060D', 0.72)} stroke={rgba(PAL.structure, 0.4)} strokeWidth={2} />
        <path d={arc(A0, A0 + SW, R)} fill="none" stroke={rgba(PAL.structure, 0.35)} strokeWidth={16} strokeLinecap="round" />
        <path d={arc(A0, A0 + SW * 0.3, R)} fill="none" stroke={rgba(PAL.wait, 0.32)} strokeWidth={16} strokeLinecap="round" />
        {Array.from({length: 11}, (_, i) => {
          const a = ang(A0 + (SW * i) / 10);
          return <line key={i} x1={gx + (R - 30) * Math.cos(a)} y1={gy + (R - 30) * Math.sin(a)} x2={gx + (R - 44) * Math.cos(a)} y2={gy + (R - 44) * Math.sin(a)} stroke={rgba(PAL.annotation, 0.7)} strokeWidth={3} />;
        })}
        <path d={arc(A0, needleA, R)} fill="none" stroke={fillC} strokeWidth={16} strokeLinecap="round" filter={`url(#${gid}-gl)`} opacity={0.8} />
        <path d={arc(A0, needleA, R)} fill="none" stroke={fillC} strokeWidth={12} strokeLinecap="round" />
        <line x1={gx} y1={gy} x2={gx + (R - 10) * Math.cos(ang(needleA))} y2={gy + (R - 10) * Math.sin(ang(needleA))} stroke="#F4F7FB" strokeWidth={7} strokeLinecap="round" />
        <circle cx={gx} cy={gy} r={16} fill="#F4F7FB" />
        <circle cx={gx} cy={gy} r={7} fill={fillC} />
      </svg>
      {result ? (
        <KineticText frame={f} at={result.at} text={result.text} x={gx} y={y + h - 34} size={48} mode="rise" color={result.color} backing="none" />
      ) : null}
    </div>
  );
};

/** The amber "½ power" badge (mini dial + words). */
export const HalfBadge: React.FC<{frame: number; at: number; x: number; y: number; scale?: number}> = ({frame: f, at, x, y, scale = 1}) => {
  if (f < at - 1) return null;
  const s = springAt(f, at, SPRING.pop);
  const lvl = lerp(1, 0.5, prog(f, at + 2, 16, EASE.inOut));
  const pulse = 0.75 + 0.25 * Math.sin((TAU * (f - at)) / 40);
  const r = 20;
  const a0 = 135;
  const a1 = a0 + 270 * lvl;
  const p = (deg: number) => [26 + r * Math.cos((deg * Math.PI) / 180), 32 + r * Math.sin((deg * Math.PI) / 180)];
  const [ex, ey] = p(a1);
  const [sx, sy] = p(a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${Math.max(0, s) * scale})`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 28px 8px 16px',
        borderRadius: 40,
        background: rgba('#1C1205', 0.92),
        border: `3px solid ${rgba(PAL.energy, 0.85)}`,
        boxShadow: `0 0 ${28 * pulse}px ${rgba(PAL.energy, 0.45)}, 0 10px 30px rgba(0,0,0,0.5)`,
        whiteSpace: 'nowrap',
      }}
    >
      <svg width={52} height={64} viewBox="0 0 52 64">
        <circle cx={26} cy={32} r={r} fill="none" stroke={rgba(PAL.energyDeep, 0.8)} strokeWidth={6} />
        <path d={`M${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey}`} fill="none" stroke={PAL.energy} strokeWidth={6} strokeLinecap="round" />
        <circle cx={26} cy={32} r={8} fill={PAL.energyHot} />
      </svg>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 64, color: PAL.energy}}>
        <Rich text="½ power" weight={700} />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- scenes */
const TOP_PANE = {x: 70, y: 78, w: 1780, h: 410};
const LOW_PANE = {x: 70, y: 530, w: 1780, h: 410};

/** Shot 1: the teaser's end state comes back (dial at half, one lane slow, both "?"), under the chapter opener. */
export const IntroScene: React.FC<{frame: number}> = ({frame: f}) => (
  <Stage
    frame={f}
    env={{kind: 'night', grid: true, dust: 60}}
    cam={[
      {f: A.from - 30, zoom: 1.16, x: 1010, y: 560},
      {f: CUT.intoBridge, zoom: 1.0, x: 960, y: 540, ease: 'out'},
    ]}
    hud={<AtlasOpener frame={f} at={A.experiment - 20} word="The experiment" y={150} scrim={0.36} />}
  >
    <PowerDial frame={f} x={INTRO_DIAL.x} y={INTRO_DIAL.y} w={INTRO_DIAL.w} value={0.5} tiltY={[[A.from - 30, 12], [CUT.intoBridge, 4]]} />
    <div style={{position: 'absolute', left: 900, top: 330, width: 1920, height: 1080, transform: 'scale(0.52)', transformOrigin: '0 0'}}>
      <LanePane frame={f} x={0} y={0} w={1780} h={410} title="" speed={[[0, 0.34]]} seed="i1" />
      <LanePane frame={f} x={0} y={452} w={1780} h={410} title="" speed={[[0, 0.94]]} seed="i2" />
    </div>
  </Stage>
);
export const INTRO_DIAL = {x: 430, y: 600, w: 480};

/** Shot 5: the payoff, full-frame split. */
export const LanesScene: React.FC<{frame: number}> = ({frame: f}) => (
  <Stage
    frame={f}
    env={{kind: 'night', grid: true, dust: 50}}
    cam={[
      {f: CUT.intoLanes, zoom: 1.0, x: 960, y: 540},
      {f: CUT.intoReading + 12, zoom: 1.035, x: 950, y: 528},
    ]}
    shake={[{at: A.substantially + 1, strength: 0.45}]}
    hud={<Footnote frame={f} at={A.reading + 4} text="Illustrative; big models on 8 GPUs" />}
  >
    <LanePane
      frame={f}
      {...TOP_PANE}
      title="Reading prompts"
      revealAt={A.reading}
      seed="lr"
      speed={[
        [A.slowed - 2, 1],
        [A.slowed + 16, 0.3, EASE.out],
        [A.substantially + 12, 0.34],
      ]}
      result={{text: 'Slowed down a lot', at: A.substantially, color: PAL.wait}}
    />
    <LanePane
      frame={f}
      {...LOW_PANE}
      title="Writing answers"
      revealAt={A.writing}
      seed="lw"
      speed={[
        [A.slowed - 2, 1],
        [A.slowed + 16, 0.93, EASE.out],
        [A.substantially + 12, 0.94],
      ]}
      result={{text: 'Barely changed ✓', at: A.changed - 2, color: PAL.ink}}
    />
    <HalfBadge frame={f} at={CUT.intoLanes + 8} x={960} y={509} />
  </Stage>
);
/** Screen point the lanes scene zooms through (the reading lane's track). */
export const LANES_ZOOM_AT = {x: TOP_PANE.x + 70 + (TOP_PANE.w - 630) / 2, y: TOP_PANE.y + TOP_PANE.h * 0.66};
