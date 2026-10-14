/**
 * S9 shot 6 (P22 close): "you're watching gigabytes of numbers cross a bridge, again and again, piece after piece."
 * One long, grand pull-back. We start INSIDE the reader's screen, close on crates crossing the Bridge, with depth
 * layers of out-of-focus specks rushing past; the Bridge camera cranes back to the whole set, a light sweep crosses the
 * glass as the camera exits through the reader's screen, and the room's light pulses with every crate (the rhythm is
 * locked to "again … and again"). The desk settles into a composed, balanced brand frame that keeps moving.
 */
import React from 'react';
import {Easing} from 'remotion';
import {Bridge, EASE, PAL, REGIONS, SANS, Stage, TAU, clamp01, lerp, poseAt, prog, rgba, rnd, rr, textWidth, useFontsReady, type BridgeProps, type Cam3, type CamKey, type KenBurns, type Region} from '../../kit';
import {A} from './anchors';
import {ReaderChat, type ChatSpec} from './Chat';
import {PROMPT, TIMES, TOKENS} from './Reader';

export const FIN_F0 = A.describes + 4;
const P6 = 13;
const T6 = 30;
/** crates arrive every 13 frames; arrival 20 lands on the spoken "again" (then "and", "again" within ±4 frames) */
const FLOW6 = A.finale[0] - 20 * P6 - T6;
const ARRIVALS: number[] = Array.from({length: 40}, (_, k) => FLOW6 + T6 + k * P6);
const OUT_AT = A.youreWatching - 18;
const SETTLE = A.finale[3] + 12;

const FINAL6: Cam3 = {tx: 0.5, ty: 5.0, tz: 0, yaw: 7, pitch: 12.5, dist: 27, fov: 30};
export const B6: Omit<BridgeProps, 'frame'> = {
  view: 'threeQuarter',
  cam: [
    {f: FIN_F0, cam: 'crates', view: 'threeQuarter'},
    {f: FIN_F0 + 12, cam: 'crates', view: 'threeQuarter'},
    {f: A.youreWatching + 12, cam: FINAL6, view: 'side', dur: A.youreWatching + 12 - (FIN_F0 + 12), ease: EASE.inOut},
  ],
  bandwidth: 0.86,
  crateScale: 1.25,
  crateRate: 30 / P6,
  travel: T6,
  flowFrom: FLOW6,
  mathActivity: 0.62,
};

/** 0..1: a soft pulse on every crate arrival (the rhythm you can see from the far end of the room) */
const beat = (f: number): number => {
  let v = 0;
  for (const a of ARRIVALS) {
    const d = f - a;
    if (d >= 0 && d < 24) v = Math.max(v, Math.exp(-d / 6));
  }
  return v;
};

/* ---------------------------------------------------------------- framing of the desk plate */
const S6 = 1.14;
const COVER = Math.max(1920 / 1672, 1080 / 941);
const PS = COVER * S6;
export const KB6: KenBurns = {from: {s: S6, x: 0, y: 0}, to: {s: S6, x: 0, y: 0}, start: 0, end: 1};
const SLOT = REGIONS.deskScreen as {x: number; y: number; w: number; h: number};
const SLOT_CY = 540 + (SLOT.y + SLOT.h / 2 - 941 / 2) * PS;
const Z0 = (1080 / (SLOT.h * PS)) * 1.035;
const pull = Easing.bezier(0.42, 0, 0.16, 1);
export const CAM6: CamKey[] = [
  {f: FIN_F0 - 20, x: 960, y: SLOT_CY, zoom: Z0},
  {f: OUT_AT, x: 960, y: SLOT_CY, zoom: Z0},
  {f: SETTLE, x: 960, y: 584, zoom: 0.965, ease: pull},
  {f: A.to + 30, x: 960, y: 580, zoom: 0.93, ease: (t: number) => t},
];

/** The bridge, scaled to cover the screen slot (1032×547 slot px). */
const BRIDGE_K = Math.max(SLOT.w / 1920, SLOT.h / 1080);
const BridgeInScreen: React.FC<{frame: number}> = ({frame: f}) => (
  <div style={{position: 'absolute', left: (SLOT.w - 1920 * BRIDGE_K) / 2, top: (SLOT.h - 1080 * BRIDGE_K) / 2, width: 1920, height: 1080, transform: `scale(${BRIDGE_K})`, transformOrigin: '0 0'}}>
    <Bridge frame={f} {...B6} />
  </div>
);

/** The screen's glass: reflection, inner edge shadow, a light sweep as we come out through it, and its light in the room. */
const GlassSlot: React.FC<{frame: number; rect: Region; glass: number; children?: React.ReactNode}> = ({frame: f, rect, glass, children}) => {
  if (rect.shape !== 'rect') return null;
  const b = beat(f);
  const sw = prog(f, OUT_AT - 4, 40, EASE.inOut);
  const swOn = Math.sin(Math.PI * sw);
  const pos = lerp(-35, 135, sw);
  return (
    <>
      {/* the screen's light on the desk below it, pulsing with every crate */}
      <div style={{position: 'absolute', left: rect.x - 160, top: rect.y + rect.h + 40, width: rect.w + 320, height: 240, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#3FB8FF', 0.16 + 0.16 * b)}, rgba(0,0,0,0))`, filter: 'blur(18px)', mixBlendMode: 'screen'}} />
      <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h}}>
        <div style={{position: 'absolute', inset: -rect.w * 0.06, borderRadius: rect.w * 0.07, background: `radial-gradient(closest-side, ${rgba('#3FB8FF', 0.24 + 0.14 * b)}, rgba(0,0,0,0))`, filter: 'blur(26px)'}} />
        <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 4}}>{children}</div>
        <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 ${40 * glass}px ${rgba('#000000', 0.55 * glass)}`, pointerEvents: 'none'}} />
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(118deg, rgba(255,255,255,${0.1 * glass}) 0%, rgba(255,255,255,${0.035 * glass}) 28%, rgba(255,255,255,0) 42%)`, pointerEvents: 'none'}} />
        {swOn > 0.01 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              background: `linear-gradient(112deg, rgba(255,255,255,0) ${pos - 14}%, ${rgba('#E6FBFF', 0.42 * swOn)} ${pos - 3}%, ${rgba('#FFFFFF', 0.62 * swOn)} ${pos}%, ${rgba('#BDF5FF', 0.32 * swOn)} ${pos + 4}%, rgba(255,255,255,0) ${pos + 16}%)`,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
    </>
  );
};

const CHAT6: ChatSpec = {w: 1032, h: 547, fs: 40, prompt: PROMPT, tokens: TOKENS, times: TIMES};
const LIMIT6 = 222;

/* ---------------------------------------------------------------- depth layers (screen space, above the picture) */
const SPECKS = Array.from({length: 22}, (_, i) => ({a: rr(`s9sp-a${i}`, 0, TAU), r: rr(`s9sp-r${i}`, 0.35, 1.25), z: rr(`s9sp-z${i}`, 0.4, 1), s: rr(`s9sp-s${i}`, 10, 34), c: rnd(`s9sp-c${i}`)}));
const BOKEH = Array.from({length: 9}, (_, i) => ({x: rr(`s9bk-x${i}`, -0.1, 1.1), y: rr(`s9bk-y${i}`, 0.05, 0.95), z: rr(`s9bk-z${i}`, 0.5, 1), s: rr(`s9bk-s${i}`, 40, 120), warm: rnd(`s9bk-w${i}`) < 0.45}));
const Depth: React.FC<{frame: number}> = ({frame: f}) => {
  const q = prog(f, FIN_F0, OUT_AT + 30 - FIN_F0, EASE.inOut);
  const inside = clamp01((f - FIN_F0 - 6) / 10) * (1 - prog(f, OUT_AT + 4, 24));
  const pose = poseAt(f, CAM6, 0.5);
  const room = prog(f, OUT_AT + 10, 30) * 0.9;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <defs>
        <filter id="s9-depth-b1" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
        <filter id="s9-depth-b2" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={18} />
        </filter>
      </defs>
      {/* inside the screen: specks rush past and converge as we crane back */}
      {inside > 0.01 ? (
        <g filter="url(#s9-depth-b1)" opacity={inside}>
          {SPECKS.map((p, i) => {
            const k = Math.pow(lerp(2.4, 0.5, q), 0.6 + p.z);
            const x = 960 + Math.cos(p.a + f * 0.002) * p.r * 980 * k;
            const y = 540 + Math.sin(p.a + f * 0.002) * p.r * 560 * k;
            const s = p.s * lerp(1.7, 0.6, q) * (0.7 + 0.6 * p.z);
            return <circle key={i} cx={x} cy={y} r={s} fill={p.c < 0.6 ? PAL.info : PAL.infoPale} opacity={0.18 + 0.22 * p.z} />;
          })}
        </g>
      ) : null}
      {/* in the room: out-of-focus foreground lights, closer than the desk (they shrink faster than it) */}
      {room > 0.01 ? (
        <g filter="url(#s9-depth-b2)" opacity={room}>
          {BOKEH.map((p, i) => {
            const k = Math.pow(pose.zoom, 1.9 * p.z);
            const x = 960 + (p.x * 1920 - 960) * k + 30 * Math.sin(f / 90 + i);
            const y = 540 + (p.y * 1080 - 540) * k + 14 * Math.cos(f / 110 + i * 2);
            return <circle key={i} cx={x} cy={y} r={p.s * k} fill={p.warm ? '#FFB45A' : PAL.info} opacity={(p.warm ? 0.13 : 0.1) * (0.8 + 0.2 * Math.sin(f / 23 + i))} />;
          })}
        </g>
      ) : null}
    </svg>
  );
};

/* ---------------------------------------------------------------- the sign-off: the B monogram, its three pixels, the wordmark */
const SignOff: React.FC<{frame: number; at: number}> = ({frame: f, at}) => {
  useFontsReady();
  const t = f - at;
  if (t < -14) return null;
  const scrim = prog(f, at - 14, 28, EASE.inOut);
  const bSize = 140;
  const wSize = 92;
  const bW = textWidth('B', bSize, 700);
  const ww = textWidth('Bits in Motion', wSize, 600);
  const gap = 118;
  const total = bW + gap + ww;
  const x0 = 960 - total / 2;
  const cy = 838;
  const bIn = prog(f, at, 14, EASE.out);
  const flash = t >= 8 ? Math.exp(-(t - 8) / 6) : 0;
  const breathe = 0.85 + 0.15 * Math.sin((TAU * t) / 70);
  // the three pixels fly in from down-right and lock into the B's lower right (magenta, as on the mark)
  const pix = [
    {s: 22, dx: 15, dy: 13},
    {s: 17, dx: 49, dy: 32},
    {s: 12, dx: 77, dy: 45},
  ];
  const bRight = x0 + bW;
  const bBase = cy + bSize * 0.36;
  const letters = 'Bits in Motion'.split('');
  let cx = 0;
  const lx = letters.map((ch) => {
    const x = cx;
    cx += textWidth(ch, wSize, 600);
    return x;
  });
  const sweep = prog(f, at + 34, 26, EASE.inOut);
  const tag = prog(f, at + 22, 16, EASE.out);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: `linear-gradient(180deg, rgba(3,6,13,0) 0%, ${rgba('#03060D', 0.7 * scrim)} 40%, ${rgba('#02040A', 0.92 * scrim)} 100%)`}} />
      <div style={{position: 'absolute', left: 960 - 700, top: cy - 160, width: 1400, height: 330, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#02040A', 0.6 * scrim)}, rgba(2,4,10,0))`}} />
      {/* a hairline of light under the lockup: the Bit's route, drawn once */}
      <div style={{position: 'absolute', left: 960 - (total / 2) * prog(f, at + 6, 22, EASE.out), top: cy + 58, width: total * prog(f, at + 6, 22, EASE.out), height: 2, background: `linear-gradient(90deg, rgba(0,229,255,0), ${rgba(PAL.info, 0.75)}, rgba(0,229,255,0))`}} />
      {/* B */}
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: cy,
          transform: `translateY(-50%) translateY(${(1 - bIn) * 26}px) scale(${0.94 + 0.06 * bIn})`,
          opacity: bIn,
          filter: bIn < 1 ? `blur(${(1 - bIn) * 8}px)` : undefined,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: bSize,
          lineHeight: 1,
          color: '#EAF7FD',
          textShadow: `0 0 ${10 + 20 * flash}px ${rgba(PAL.info, 0.55 * breathe + 0.4 * flash)}, 0 0 ${34 + 30 * flash}px ${rgba(PAL.info, 0.22 + 0.3 * flash)}`,
        }}
      >
        B
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {pix.map((p, i) => {
          const u = prog(f, at + 4 + i * 2, 11, EASE.out);
          if (u <= 0) return null;
          const tx = bRight + p.dx;
          const ty = bBase + p.dy - bSize * 0.5;
          const x = lerp(tx + 150, tx, u);
          const y = lerp(ty + 90, ty, u);
          const col = u < 0.85 ? PAL.info : PAL.emphasis;
          const tw = 0.8 + 0.2 * Math.sin((TAU * (t + i * 9)) / 40);
          return (
            <g key={i}>
              <rect x={x - p.s * 1.4} y={y - p.s * 1.4} width={p.s * 2.8} height={p.s * 2.8} rx={p.s} fill={col} opacity={0.18 * u * tw} />
              <rect x={x - p.s / 2} y={y - p.s / 2} width={p.s} height={p.s} rx={2} fill={col} opacity={u} />
            </g>
          );
        })}
      </svg>
      {/* wordmark, letter by letter */}
      <div style={{position: 'absolute', left: x0 + bW + gap, top: cy, transform: 'translateY(-50%)', fontFamily: SANS, fontWeight: 600, fontSize: wSize, lineHeight: 1.15, color: PAL.ink, whiteSpace: 'pre', height: wSize * 1.2, width: ww + 10}}>
        {letters.map((ch, i) => {
          const e = prog(f, at + 10 + i * 1.2, 14, EASE.outExpo);
          return (
            <span key={i} style={{position: 'absolute', left: lx[i], top: 0, overflow: 'hidden', height: wSize * 1.25, display: 'inline-block'}}>
              <span style={{display: 'inline-block', transform: `translateY(${(1 - e) * 110}%)`, opacity: clamp01(e * 1.5)}}>{ch}</span>
            </span>
          );
        })}
        {sweep > 0 && sweep < 1 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(105deg, rgba(255,255,255,0) ${lerp(-20, 110, sweep) - 10}%, ${rgba('#C9F7FF', 0.35)} ${lerp(-20, 110, sweep)}%, rgba(255,255,255,0) ${lerp(-20, 110, sweep) + 10}%)`,
              mixBlendMode: 'screen',
            }}
          />
        ) : null}
      </div>
      {/* the channel's promise, small and quiet under the mark */}
      <div style={{position: 'absolute', left: 960, top: cy + 84, transform: `translate(-50%, -50%) translateY(${(1 - tag) * 10}px)`, opacity: tag * 0.92, fontFamily: SANS, fontWeight: 600, fontSize: 40, color: PAL.muted, whiteSpace: 'nowrap', letterSpacing: '0.01em'}}>
        See how technology really works
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- the shot */
export const FinaleShot: React.FC<{frame: number}> = ({frame: f}) => {
  const glass = prog(f, OUT_AT + 4, 34, EASE.inOut);
  const chatOp = prog(f, OUT_AT, 36, EASE.inOut) * (1 - 0.6 * prog(f, A.finale[2], 14, EASE.inOut));
  return (
    <Stage
      frame={f}
      drift={0.5}
      cam={CAM6}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb: KB6,
        floor: 0.3,
        children: (
          <GlassSlot frame={f} rect={REGIONS.deskScreen} glass={glass}>
            <BridgeInScreen frame={f} />
            {chatOp > 0.01 ? <ReaderChat frame={f} {...CHAT6} promptAt={A.allAtOnce} transparent limit={LIMIT6} fog={0} opacity={chatOp} chrome={chatOp} /> : null}
          </GlassSlot>
        ),
      }}
      hud={
        <>
          <Depth frame={f} />
          <SignOff frame={f} at={A.finale[2] - 4} />
        </>
      }
    />
  );
};
