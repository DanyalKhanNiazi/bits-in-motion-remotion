/**
 * S6 shot 5, the mid-film payoff (10044–10200): a clean full-frame split screen, one owner gauge per lane.
 *   left   "Reading prompts": the math die works behind; at half power its needle falls into coral
 *   right  "Writing answers": crates keep crossing behind; at half power its needle barely moves
 * One rule for both dials: the needle is speed, and a dashed ghost needle marks the full-power speed.
 */
import React, {useId} from 'react';
import {Img, staticFile} from 'remotion';
import {
  Bridge,
  EASE,
  Footnote,
  KineticText,
  PAL,
  Rich,
  SANS,
  SPRING,
  Stage,
  TAU,
  clamp01,
  mixHex,
  prog,
  rgba,
  safeId,
  springAt,
  type BridgeProps,
  type Cam3,
} from '../../kit';
import {A, CUT} from './anchors';

/* ---------------------------------------------------------------- timing */
const CAP = A.reading + 4; // 10062: the cap bites on both lanes at once
const DROP = A.slowed - 2; // the needles react on "slowed"
const FULL = 0.82; // full-power speed sits at 82 % of the dial
const READ_TO = 0.32; // reading falls to about a third
const WRITE_TO = 0.95; // writing barely moves
const BEAT = 12;
const B0 = A.reading - 8;
const TRAVEL = 24 + (((B0 % BEAT) + BEAT) % BEAT); // crates land on a steady beat

const needleV = (f: number, to: number, jitter: number) => {
  const s = f < DROP ? 0 : springAt(f, DROP, {damping: 9, stiffness: 120, mass: 0.9});
  const v = FULL * (1 - (1 - to) * s);
  const j = f > DROP + 16 ? jitter * (Math.sin(f * 1.9) * 0.6 + Math.sin(f * 0.83 + 1) * 0.4) : 0;
  return clamp01(v + j);
};

/* ---------------------------------------------------------------- layout */
const LANE = [
  {x0: 64, x1: 936, cx: 500},
  {x0: 984, x1: 1856, cx: 1420},
] as const;
const Y0 = 64;
const Y1 = 1016;
const GY = 458; // gauge face centre
const GW = 520; // gauge visible width
const TITLE_Y = 140;
const CAPTION_Y = 800;

/* ---------------------------------------------------------------- the owner's gauge render (N10) */
const GAUGE_SRC = staticFile('ep03/assets/new/N10_gauge_a.png');
/** Measured on the 2048² render: face centre, visible width, the dark arc track (r 455–495) and the tick ring (r ≈ 425). */
const GM = {size: 2048, cx: 1025, cy: 1004, vis: 1534, track: 475, trackW: 36, needle: 395};
const GA0 = 133;
const GSW = 274;

const Gauge: React.FC<{x: number; y: number; w: number; v: number; ghost: number; gid: string}> = ({x, y, w, v, ghost, gid}) => {
  const k = w / GM.vis;
  const R = GM.track * k;
  const rad = (d: number) => (d * Math.PI) / 180;
  const arc = (a0: number, a1: number, r: number) => {
    const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / 3));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = rad(a0 + ((a1 - a0) * i) / n);
      d += `${i ? 'L' : 'M'}${(x + r * Math.cos(a)).toFixed(1)} ${(y + r * Math.sin(a)).toFixed(1)} `;
    }
    return d;
  };
  const aN = GA0 + GSW * clamp01(v);
  const aG = GA0 + GSW * FULL;
  const slow = clamp01((0.55 - v) / 0.25);
  const col = mixHex(PAL.info, PAL.wait, slow);
  const nl = GM.needle * k;
  const tip = (a: number, r: number) => ({x: x + r * Math.cos(rad(a)), y: y + r * Math.sin(rad(a))});
  const nTip = tip(aN, nl);
  const nTail = tip(aN + 180, nl * 0.18);
  const gTip = tip(aG, nl);
  return (
    <>
      <Img src={GAUGE_SRC} style={{position: 'absolute', left: x - GM.cx * k, top: y - GM.cy * k, width: GM.size * k, height: GM.size * k}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id={`${gid}-g`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={9} />
          </filter>
        </defs>
        {/* the slow zone, faint coral on the track */}
        <path d={arc(GA0, GA0 + GSW * 0.42, R)} fill="none" stroke={PAL.wait} strokeOpacity={0.28} strokeWidth={GM.trackW * k} strokeLinecap="round" />
        {/* live fill */}
        <path d={arc(GA0, aN, R)} fill="none" stroke={col} strokeWidth={GM.trackW * k * 1.7} strokeLinecap="round" opacity={0.65} filter={`url(#${gid}-g)`} />
        <path d={arc(GA0, aN, R)} fill="none" stroke={col} strokeWidth={GM.trackW * k} strokeLinecap="round" />
        {/* ghost: where the needle sat at full power */}
        {ghost > 0 ? (
          <g opacity={ghost}>
            <line x1={x} y1={y} x2={gTip.x} y2={gTip.y} stroke="#F4F7FB" strokeOpacity={0.55} strokeWidth={4} strokeDasharray="10 9" strokeLinecap="round" />
            <circle cx={tip(aG, R).x} cy={tip(aG, R).y} r={9} fill="#F4F7FB" opacity={0.85} />
          </g>
        ) : null}
        {/* the needle */}
        <line x1={nTail.x} y1={nTail.y} x2={nTip.x} y2={nTip.y} stroke="#03060D" strokeOpacity={0.6} strokeWidth={15} strokeLinecap="round" />
        <line x1={nTail.x} y1={nTail.y} x2={nTip.x} y2={nTip.y} stroke="#F4F7FB" strokeWidth={8} strokeLinecap="round" />
        <circle cx={nTip.x} cy={nTip.y} r={7} fill={col} />
        <circle cx={x} cy={y} r={20} fill="#C7CDD6" stroke="#5E6878" strokeWidth={3} />
        <circle cx={x} cy={y} r={9} fill={col} />
      </svg>
      <div style={{position: 'absolute', left: x, top: y + 92, transform: 'translate(-50%, -50%)', fontFamily: SANS, fontWeight: 600, fontSize: 42, color: PAL.muted, letterSpacing: '0.04em'}}>speed</div>
    </>
  );
};

/* ---------------------------------------------------------------- lane chrome */
const Title: React.FC<{frame: number; at: number; text: string; x: number}> = ({frame: f, at, text, x}) => {
  const qOut = prog(f, at - 4, 6, EASE.inCubic);
  const tIn = springAt(f, at - 2, SPRING.snap);
  return (
    <>
      {qOut < 1 ? (
        <div style={{position: 'absolute', left: x, top: TITLE_Y, transform: `translate(-50%, -50%) perspective(900px) rotateX(${90 * qOut}deg)`, fontFamily: SANS, fontWeight: 700, fontSize: 120, lineHeight: 1, color: PAL.emphasis, textShadow: `0 0 34px ${rgba(PAL.emphasis, 0.6)}`}}>?</div>
      ) : null}
      {f >= at - 2 ? (
        <div style={{position: 'absolute', left: x, top: TITLE_Y, transform: `translate(-50%, -50%) perspective(900px) rotateX(${-90 * (1 - Math.min(1, tIn))}deg)`, fontFamily: SANS, fontWeight: 700, fontSize: 80, lineHeight: 1, color: PAL.ink, whiteSpace: 'nowrap', textShadow: '0 4px 20px rgba(0,0,0,0.9)'}}>
          {text}
        </div>
      ) : null}
    </>
  );
};

const PowerPill: React.FC<{frame: number; at: number}> = ({frame: f, at}) => {
  if (f < at - 1) return null;
  const s = springAt(f, at, SPRING.pop);
  const pulse = 0.75 + 0.25 * Math.sin((TAU * (f - at)) / 40);
  return (
    <div
      style={{
        position: 'absolute',
        left: 960,
        top: GY,
        transform: `translate(-50%, -50%) scale(${Math.max(0, s)})`,
        padding: '10px 34px 16px',
        borderRadius: 48,
        background: rgba('#1C1205', 0.94),
        border: `4px solid ${rgba(PAL.energy, 0.9)}`,
        boxShadow: `0 0 ${36 * pulse}px ${rgba(PAL.energy, 0.5)}, 0 14px 40px rgba(0,0,0,0.6)`,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 76,
        lineHeight: 1.05,
        color: PAL.energy,
        whiteSpace: 'nowrap',
        textAlign: 'center',
      }}
    >
      <Rich text="½ power" weight={700} />
    </div>
  );
};

/* ---------------------------------------------------------------- the verdict, back on the experiment's two dials */
const VWORDS: Array<{t: string; at: number; line: 0 | 1; c?: string; slam?: boolean}> = [
  {t: 'Writing', at: A.verdict, line: 0},
  {t: 'waits', at: A.wWas, line: 0},
  {t: 'on', at: A.wOn - 2, line: 0},
  {t: 'memory,', at: A.memory, line: 0, c: PAL.info, slam: true},
  {t: 'not', at: A.notMath, line: 1},
  {t: 'math.', at: A.wMath, line: 1},
];
const VerdictCard: React.FC<{frame: number}> = ({frame: f}) => {
  const scrim = prog(f, A.verdict - 6, 12, EASE.out);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 690, height: 300, background: `linear-gradient(180deg, rgba(2,5,11,0), ${rgba('#02050B', 0.86 * scrim)} 28%, ${rgba('#02050B', 0.9 * scrim)})`}} />
      {[0, 1].map((ln) => (
        <div key={ln} style={{position: 'absolute', left: 0, width: 1920, top: ln === 0 ? 742 : 846, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: ln === 0 ? 92 : 96, lineHeight: 1.05, color: PAL.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap'}}>
          {VWORDS.filter((w) => w.line === ln).map((w, i) => {
            const e = prog(f, w.at, 12, EASE.outExpo);
            const sl = w.slam ? springAt(f, w.at, SPRING.slam) : 1;
            const sc = w.slam ? 1.9 - 0.9 * sl : 1;
            const flash = w.slam && f >= w.at + 2 ? Math.exp(-(f - w.at - 2) / 5) : 0;
            return (
              <span key={i} style={{display: 'inline-block', marginRight: '0.24em', overflow: w.slam ? 'visible' : 'hidden', verticalAlign: 'top', paddingBottom: '0.08em'}}>
                <span
                  style={{
                    display: 'inline-block',
                    transform: w.slam ? `scale(${sc})` : `translateY(${(1 - e) * 105}%)`,
                    opacity: w.slam ? clamp01((f - w.at + 1) / 2.5) : 1,
                    color: w.c ?? PAL.ink,
                    textShadow: w.c ? `0 0 ${24 + 30 * flash}px ${rgba(w.c, 0.55 + 0.4 * flash)}` : '0 4px 18px rgba(0,0,0,0.85)',
                    filter: w.slam && sc > 1.02 ? `blur(${(sc - 1) * 6}px)` : undefined,
                  }}
                >
                  {w.t}
                </span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
/** On "memory" the writing lane (the bridge) lights up; on "not math" the reading lane's die dims. */
const VerdictGlow: React.FC<{frame: number}> = ({frame: f}) => {
  const m = prog(f, A.memory, 10, EASE.out);
  const n = prog(f, A.notMath, 10, EASE.out);
  const pulse = 0.8 + 0.2 * Math.sin((TAU * f) / 30);
  return (
    <>
      <div style={{position: 'absolute', left: LANE[1].x0, top: Y0, width: LANE[1].x1 - LANE[1].x0, height: Y1 - Y0, borderRadius: 34, border: `4px solid ${rgba(PAL.info, 0.85 * m * pulse)}`, boxShadow: `0 0 ${70 * m}px ${rgba(PAL.info, 0.45 * m)}, inset 0 0 ${90 * m}px ${rgba(PAL.info, 0.2 * m)}`}} />
      <div style={{position: 'absolute', left: LANE[0].x0, top: Y0, width: LANE[0].x1 - LANE[0].x0, height: Y1 - Y0, borderRadius: 34, background: rgba('#02050B', 0.45 * n)}} />
    </>
  );
};

/* ---------------------------------------------------------------- the scene */
const CAM_DIE: Cam3 = {tx: 6.6, ty: 2.4, tz: 2.0, yaw: -6, pitch: 4, dist: 15.5, fov: 30};
const CAM_DECK: Cam3 = {tx: -0.6, ty: 2.9, tz: 0.6, yaw: 26, pitch: 17, dist: 12, fov: 30};

export const PayoffScene: React.FC<{frame: number; verdict?: boolean}> = ({frame: f, verdict = false}) => {
  const gid = safeId(useId());
  const cap: BridgeProps['powerCap'] = [
    [CAP - 6, 1],
    [CAP + 6, 0.5],
  ];
  const die: BridgeProps = {frame: f, view: 'side', framing: CAM_DIE, drift: 0.5, bandwidth: 0.5, flowFrom: 1e9, mathActivity: 1, powerCap: cap};
  const deck: BridgeProps = {frame: f, view: 'side', framing: CAM_DECK, drift: 0.5, bandwidth: 0.55, crateRate: 30 / BEAT, travel: TRAVEL, crateScale: 1.15, mathActivity: 0.3, idle: 0.5, powerCap: cap};
  const vR = needleV(f, READ_TO, 0.012);
  const vW = needleV(f, WRITE_TO, 0.004);
  const ghost = prog(f, CAP - 4, 10, EASE.out);
  const hit = f >= DROP + 2 ? Math.exp(-(f - DROP - 2) / 7) : 0;
  const lane = (i: 0 | 1, bridge: BridgeProps, tint: string) => {
    const L = LANE[i];
    const w = L.x1 - L.x0;
    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: L.x0,
          top: Y0,
          width: w,
          height: Y1 - Y0,
          borderRadius: 34,
          overflow: 'hidden',
          border: `3px solid ${i === 0 && hit > 0.02 ? rgba(PAL.wait, 0.4 + 0.6 * hit) : rgba('#9FC2FF', 0.24)}`,
          boxShadow: `0 30px 70px rgba(0,0,0,0.55)${i === 0 && hit > 0.02 ? `, 0 0 ${60 * hit}px ${rgba(PAL.wait, 0.6 * hit)}` : ''}`,
        }}
      >
        <div style={{position: 'absolute', left: L.cx - L.x0 - 960, top: 540 - Y0 - 540 + 30, width: 1920, height: 1080, filter: 'blur(3.5px) brightness(0.8) saturate(1.1)'}}>
          <Bridge {...bridge} />
        </div>
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 62% 48% at 50% 44%, ${rgba('#050A16', 0.1)}, ${rgba('#050A16', 0.58)} 75%), linear-gradient(180deg, ${rgba(tint, 0.1)}, rgba(0,0,0,0) 40%)`}} />
      </div>
    );
  };
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 40}}
      cam={[
        {f: CUT.intoLanes, zoom: 1.0, x: 960, y: 540},
        {f: A.changed, zoom: 1.015, x: 960, y: 540},
        {f: CUT.intoReading + 16, zoom: 1.08, x: 960, y: 530, dur: 38},
      ]}
      shake={[{at: DROP + 2, strength: 0.9}]}
      hud={
        <>
          <Title frame={f} at={A.reading} text="Reading prompts" x={LANE[0].cx} />
          <Title frame={f} at={A.writing} text="Writing answers" x={LANE[1].cx} />
          {!verdict ? (
            <>
              <KineticText frame={f} at={A.substantially} text="Slowed a lot" x={LANE[0].cx} y={CAPTION_Y} size={96} mode="slam" color={PAL.wait} accent={PAL.wait} backing="none" screen />
              <KineticText frame={f} at={A.barely} text="Barely changed ✓" x={LANE[1].cx} y={CAPTION_Y} size={88} mode="slam" color={PAL.ink} backing="none" screen />
              <Footnote frame={f} at={A.reading + 4} text="Illustrative; big models, 8 GPUs" x={1012} y={934} size={46} screen />
            </>
          ) : (
            <VerdictCard frame={f} />
          )}
          <PowerPill frame={f} at={CAP - 6} />
        </>
      }
    >
      {lane(0, die, PAL.wait)}
      {lane(1, deck, PAL.info)}
      {verdict ? <VerdictGlow frame={f} /> : null}
      <Gauge x={LANE[0].cx} y={GY} w={GW} v={vR} ghost={ghost} gid={`${gid}-r`} />
      <Gauge x={LANE[1].cx} y={GY} w={GW} v={vW} ghost={ghost} gid={`${gid}-w`} />
    </Stage>
  );
};

/** Where the payoff zooms through into the reading close-up (the reading gauge). */
export const PAYOFF_ZOOM_AT = {x: LANE[0].cx, y: GY};
