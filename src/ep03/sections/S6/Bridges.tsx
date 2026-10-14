/**
 * S6 Bridge shots:
 *   HypoScene     the prediction: the die waits on the bridge; slowing the math "shouldn't matter much"
 *   ReadingScene  one crate's numbers fan out to ALL the prompt's tiles at once; the math stays busy
 *   WritingScene  each crate makes one new tile per conversation; the rack only holds so many; the verdict;
 *                 then P14: bandwidth is the bridge's width, and it matters as much as the math
 */
import React, {useId} from 'react';
import {
  Bridge,
  EASE,
  KineticText,
  Label,
  PAL,
  SANS,
  SET,
  SPRING,
  Stage,
  TAU,
  basis,
  bridgeCam,
  clamp01,
  lerp,
  num,
  prog,
  project,
  rgba,
  rr,
  safeId,
  springAt,
  type BridgeProps,
  type Cam3,
} from '../../kit';
import {A, CUT} from './anchors';
import {RayFan, Tag, hitGlow, type Pt} from './common';

/* ---------------------------------------------------------------- cameras and rhythm */
export const C1A: Cam3 = {tx: 8.3, ty: 2.55, tz: 0.8, yaw: -10, pitch: 13, dist: 20, fov: 30};
export const C1B: Cam3 = {tx: 8.1, ty: 2.55, tz: 0.8, yaw: -13, pitch: 12, dist: 18.6, fov: 30};
const HYP: Cam3 = {tx: 1.0, ty: 3.3, tz: 0.5, yaw: 16, pitch: 10, dist: 19.5, fov: 30};
const VERD: Cam3 = {tx: 0.45, ty: 3.55, tz: 0, yaw: 0, pitch: 16, dist: 23.5, fov: 30};
const C3: Cam3 = {tx: 0.2, ty: 2.8, tz: 0.4, yaw: 28, pitch: 26, dist: 14, fov: 30};
const C3B: Cam3 = {tx: 1.9, ty: 2.9, tz: 0, yaw: 24, pitch: 30, dist: 22.5, fov: 30};

/** One crate every 24 frames, 32 frames to cross: arrivals at 24k + 32 (≡ 8 mod 24), so one lands on "all" (10328). */
const P = 24;
const TRAVEL = 32;
const arrivalsNear = (f: number, back: number): number[] => {
  const out: number[] = [];
  const k1 = Math.floor((f - TRAVEL) / P);
  for (let k = k1; k >= k1 - Math.ceil(back / P) - 1; k--) {
    const a = k * P + TRAVEL;
    if (a <= f && f - a <= back) out.push(a);
  }
  return out;
};
const arrivalsBetween = (a0: number, a1: number): number[] => {
  const out: number[] = [];
  for (let k = Math.ceil((a0 - TRAVEL) / P); k * P + TRAVEL <= a1; k++) out.push(k * P + TRAVEL);
  return out;
};

const emitPoint = (props: Pick<BridgeProps, 'view' | 'framing' | 'cam' | 'drift'>, f: number): Pt => {
  const q = project(basis(bridgeCam(props, f)), [SET.die.x1 + 0.05, 2.55, SET.die.z1 - 0.05]);
  return q ? {x: q[0], y: q[1]} : {x: 1100, y: 560};
};

/* ---------------------------------------------------------------- the prediction */
export const HypoScene: React.FC<{frame: number}> = ({frame: f}) => {
  const B: BridgeProps = {
    frame: f,
    view: 'side',
    cam: [
      {f: CUT.intoBridge - 14, cam: 'wide'},
      {f: CUT.intoServer + 10, cam: HYP, dur: 150},
    ],
    bandwidth: 0.45,
    crateRate: 2,
    travel: 34,
    crateScale: 1.3,
    dof: 1.2,
    mathActivity: 0.25,
    idle: 0.72,
    powerCap: [
      [A.slowing + 4, 1],
      [A.slowing + 14, 0.5],
    ],
    highlight: f >= A.waitingBridge && f < A.slowing + 2 ? 'bridge' : null,
  };
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      hud={
        <>
          <Tag frame={f} at={A.ifWriting} text="PREDICTION" x={110} y={112} />
          <KineticText frame={f} at={A.slowing} text="Slower math" x={1020} y={128} size={92} mode="rise" color={PAL.energy} />
          <KineticText frame={f} at={A.shouldnt} text="shouldn't matter much" x={1020} y={228} size={80} mode="rise" />
        </>
      }
    >
      <Bridge {...B} />
    </Stage>
  );
};

/* ---------------------------------------------------------------- reading: the prompt wall */
const WALL = {x0: 1176, y0: 318, cols: 8, rows: 6, tw: 66, th: 50, gap: 14};
const wallTiles = (): Array<Pt & {i: number}> => {
  const out: Array<Pt & {i: number}> = [];
  for (let r = 0; r < WALL.rows; r++)
    for (let c = 0; c < WALL.cols; c++) out.push({i: r * WALL.cols + c, x: WALL.x0 + c * (WALL.tw + WALL.gap) + WALL.tw / 2, y: WALL.y0 + r * (WALL.th + WALL.gap) + WALL.th / 2});
  return out;
};
const TILES = wallTiles();

export const MiniTile: React.FC<{x: number; y: number; w: number; h: number; glow: number; bar: number; dim?: number; op?: number; s?: number}> = ({x, y, w, h, glow, bar, dim = 0, op = 1, s = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - h / 2,
      width: w,
      height: h,
      borderRadius: 10,
      background: `linear-gradient(180deg, #FFFFFF 0%, ${PAL.tile} 45%, ${PAL.tileMid} 100%)`,
      boxShadow: [
        'inset 0 2px 0 rgba(255,255,255,0.95)',
        `0 4px 0 ${PAL.tileEdge}`,
        `0 10px 16px rgba(0,0,0,0.45)`,
        glow > 0.02 ? `0 0 0 ${2 + 3 * glow}px ${rgba(PAL.info, 0.95 * glow)}, 0 0 ${26 * glow}px ${rgba(PAL.info, 0.7 * glow)}` : '',
      ]
        .filter(Boolean)
        .join(', '),
      filter: dim > 0 ? `brightness(${1 - 0.5 * dim})` : undefined,
      opacity: op,
      transform: `scale(${s})`,
    }}
  >
    <div style={{position: 'absolute', left: w * 0.2, top: h / 2 - 3, width: w * 0.6 * bar, height: 6, borderRadius: 3, background: glow > 0.3 ? rgba(PAL.infoDeep, 0.9) : '#9AA4B5'}} />
  </div>
);

export const ReadingScene: React.FC<{frame: number}> = ({frame: f}) => {
  const B: BridgeProps = {
    frame: f,
    view: 'side',
    cam: [
      {f: CUT.intoReading - 6, cam: C1A},
      {f: CUT.intoWriting + 10, cam: C1B, dur: 250},
    ],
    bandwidth: 0.5,
    crateRate: 30 / P,
    travel: TRAVEL,
    mathActivity: 1,
    idle: 0,
    highlight: f >= A.whenReads + 46 && f < A.all - 2 ? 'crates' : null,
  };
  const from = emitPoint(B, f);
  const recent = arrivalsNear(f, 20);
  const hero = A.all; // the arrival on "all"
  const glowAt = (i: number) => {
    let g = 0;
    for (const a of arrivalsNear(f, 40)) g = Math.max(g, hitGlow(f, a, 7 + (i % WALL.cols) * 0.4, a === hero ? 14 : 9) * (a === hero ? 1 : 0.75));
    return g;
  };
  const wallIn = (i: number) => springAt(f, CUT.intoReading + 8 + (i % WALL.cols) + Math.floor(i / WALL.cols) * 1.5, SPRING.snap);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      hud={
        <>
          <Tag frame={f} at={A.reads - 6} text="READING A PROMPT" x={110} y={112} />
          <KineticText frame={f} at={A.all} text="All at once" x={WALL.x0 + 313} y={WALL.y0 - 92} size={88} mode="slam" color={PAL.info} />
          <KineticText frame={f} at={A.mathBusy + 4} text="Math stays busy" x={960} y={900} size={76} mode="rise" />
        </>
      }
    >
      <Bridge {...B} />
      {TILES.map((t) => {
        const s = wallIn(t.i);
        if (s <= 0.001) return null;
        return <MiniTile key={t.i} x={t.x} y={t.y + (1 - Math.min(1, s)) * -40} w={WALL.tw} h={WALL.th} glow={glowAt(t.i)} bar={0.45 + 0.55 * rr(`wb${t.i}`, 0, 1)} op={clamp01(s * 2)} />;
      })}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {recent.map((a) => (
          <RayFan key={a} frame={f} at={a} from={from} to={TILES} width={a === hero ? 3 : 2} strength={a === hero ? 1 : 0.6} />
        ))}
      </svg>
    </Stage>
  );
};

/* ---------------------------------------------------------------- writing: one tile per conversation */
const ROWS = {n: 8, x0: 1170, y0: 292, rh: 60, tw: 40, th: 46, step: 50, base: [2, 1, 3, 2, 1, 2, 3, 1]};
const rowY = (r: number) => ROWS.y0 + r * ROWS.rh + ROWS.th / 2;
const AV = ['#5B82C9', '#7A6CC4', '#4FA3A0', '#B07AA8', '#6F8FCB', '#C49A5B', '#5FA37A', '#8A93A8'];

const ConvoRows: React.FC<{frame: number; from: Pt; exitAt: number}> = ({frame: f, from, exitAt}) => {
  const gid = safeId(useId());
  const t0 = CUT.intoWriting + 4;
  const steps = arrivalsBetween(t0, f).filter((a) => a + 7 <= f);
  const ex = prog(f, exitAt, 16, EASE.inCubic);
  if (ex >= 1) return null;
  const tipX = (r: number, n: number) => ROWS.x0 + 46 + (ROWS.base[r] + n) * ROWS.step;
  const recent = arrivalsNear(f, 20).filter((a) => a >= t0);
  // the rejected ninth conversation
  const rj = f - A.holds;
  const rejY = rj < 0 ? 980 : rj < 16 ? lerp(980, rowY(8) - 6, EASE.out(rj / 16)) : lerp(rowY(8) - 6, 1010, EASE.inCubic(clamp01((rj - 22) / 18)));
  const bump = rj >= 14 && rj < 30 ? Math.exp(-(rj - 14) / 5) : 0;
  const boxBottom = ROWS.y0 + ROWS.n * ROWS.rh - 4;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - ex, transform: `translateX(${260 * ex}px)`}}>
      {/* capacity box */}
      <div
        style={{
          position: 'absolute',
          left: ROWS.x0 - 26,
          top: ROWS.y0 - 22,
          width: 1856 - ROWS.x0 + 6,
          height: boxBottom - ROWS.y0 + 30,
          borderRadius: 22,
          background: rgba('#060B16', 0.5),
          border: `2px solid ${rgba(PAL.structure, 0.38)}`,
          boxShadow: bump > 0 ? `0 ${8 * bump}px 0 -2px ${rgba(PAL.wait, 0.9 * bump)}, 0 ${10 * bump}px ${30 * bump}px ${rgba(PAL.wait, 0.6 * bump)}` : undefined,
          opacity: prog(f, t0, 10),
        }}
      />
      {Array.from({length: ROWS.n}, (_, r) => {
        const y = rowY(r);
        const rin = springAt(f, t0 + r * 2, SPRING.snap);
        return (
          <div key={r} style={{opacity: clamp01(rin * 2), transform: `translateX(${(1 - Math.min(1, rin)) * 60}px)`}}>
            <div style={{position: 'absolute', left: ROWS.x0 - 4, top: y - 15, width: 30, height: 30, borderRadius: 15, background: AV[r], boxShadow: '0 4px 10px rgba(0,0,0,0.4)'}} />
            {Array.from({length: ROWS.base[r]}, (_, k) => (
              <MiniTile key={`b${k}`} x={ROWS.x0 + 46 + k * ROWS.step + ROWS.tw / 2} y={y} w={ROWS.tw} h={ROWS.th} glow={0} bar={0.6} dim={0.35} />
            ))}
            {steps.map((a, n) => {
              const s = springAt(f, a + 7, SPRING.snap);
              const g = hitGlow(f, a, 7, 10);
              return <MiniTile key={`n${n}`} x={tipX(r, n) + ROWS.tw / 2} y={y + (1 - Math.min(1, s)) * -16} w={ROWS.tw} h={ROWS.th} glow={Math.max(g, n === steps.length - 1 ? 0.45 : 0)} bar={0.6} s={0.7 + 0.3 * Math.min(1.1, s)} />;
            })}
          </div>
        );
      })}
      {/* ninth conversation: no room */}
      {rj >= 0 && rj < 44 ? (
        <div style={{position: 'absolute', left: 0, top: 0, opacity: clamp01(1 - (rj - 30) / 12), transform: `translateX(${bump * 8 * Math.sin(rj * 2.4)}px)`}}>
          <div style={{position: 'absolute', left: ROWS.x0 - 4, top: rejY - 15, width: 30, height: 30, borderRadius: 15, background: PAL.wait, opacity: 0.85}} />
          {[0, 1, 2].map((k) => (
            <div key={k} style={{position: 'absolute', left: ROWS.x0 + 46 + k * ROWS.step, top: rejY - ROWS.th / 2, width: ROWS.tw, height: ROWS.th, borderRadius: 10, border: `3px dashed ${rgba(PAL.wait, 0.85)}`, background: rgba(PAL.wait, 0.08)}} />
          ))}
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id={`${gid}-b`}>
            <feGaussianBlur stdDeviation={6} />
          </filter>
        </defs>
        {recent.map((a) => {
          const n = arrivalsBetween(t0, a).length - 1;
          const to = Array.from({length: ROWS.n}, (_, r) => ({x: tipX(r, n) + ROWS.tw / 2, y: rowY(r)}));
          return <RayFan key={a} frame={f} at={a} from={from} to={to} width={2.5} />;
        })}
      </svg>
    </div>
  );
};

/** The verdict: words land on the voice; "memory" slams in cyan. */
const Verdict: React.FC<{frame: number; exitAt: number}> = ({frame: f, exitAt}) => {
  const ex = prog(f, exitAt, 10, EASE.inCubic);
  if (f < A.verdict - 2 || ex >= 1) return null;
  const words: Array<{t: string; at: number; line: 0 | 1; c?: string; slam?: boolean}> = [
    {t: 'Writing', at: A.verdict, line: 0},
    {t: 'waits', at: A.wWas, line: 0},
    {t: 'on', at: A.wOn - 2, line: 0},
    {t: 'memory,', at: A.memory, line: 0, c: PAL.info, slam: true},
    {t: 'not', at: A.notMath, line: 1},
    {t: 'math.', at: A.wMath, line: 1},
  ];
  const scrim = prog(f, A.verdict - 4, 14, EASE.out);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - ex, transform: `translateY(${-30 * ex}px)`}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 420, background: `linear-gradient(180deg, ${rgba('#02050B', 0.75 * scrim)}, ${rgba('#02050B', 0.55 * scrim)} 60%, rgba(2,5,11,0))`}} />
      {[0, 1].map((ln) => (
        <div key={ln} style={{position: 'absolute', left: 0, width: 1920, top: ln === 0 ? 92 : 214, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: ln === 0 ? 106 : 112, lineHeight: 1.1, color: PAL.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap'}}>
          {words
            .filter((w) => w.line === ln)
            .map((w, i) => {
              const e = prog(f, w.at, 12, EASE.outExpo);
              const sl = w.slam ? springAt(f, w.at, SPRING.slam) : 1;
              const sc = w.slam ? lerp(1.9, 1, sl) : 1;
              const flash = w.slam && f >= w.at + 2 ? Math.exp(-(f - w.at - 2) / 5) : 0;
              return (
                <span key={i} style={{display: 'inline-block', marginRight: '0.24em', overflow: w.slam ? 'visible' : 'hidden', verticalAlign: 'top', paddingBottom: '0.08em'}}>
                  <span
                    style={{
                      display: 'inline-block',
                      transform: w.slam ? `scale(${sc})` : `translateY(${(1 - e) * 105}%)`,
                      opacity: w.slam ? clamp01((f - w.at + 1) / 2.5) : 1,
                      color: w.c ?? PAL.ink,
                      textShadow: w.c ? `0 0 ${24 + 30 * flash}px ${rgba(w.c, 0.55 + 0.4 * flash)}` : undefined,
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

/** Width arrows across the deck (projected) for "bandwidth = the bridge's width". */
const WidthArrows: React.FC<{frame: number; props: BridgeProps; at: number; exitAt: number; x?: number}> = ({frame: f, props, at, exitAt, x = 0.2}) => {
  const k = prog(f, at, 12, EASE.out) * (1 - prog(f, exitAt, 10));
  if (k <= 0) return null;
  const b = basis(bridgeCam(props, f));
  const bw = num(props.bandwidth, f, 0.5);
  const Wd = lerp(1.0, 3.4, bw);
  const y = SET.deckY + 0.06;
  const p0 = project(b, [x, y, -Wd / 2 - 0.2]);
  const p1 = project(b, [x, y, Wd / 2 + 0.2]);
  if (!p0 || !p1) return null;
  const mx = (p0[0] + p1[0]) / 2;
  const my = (p0[1] + p1[1]) / 2;
  const a = {x: lerp(mx, p0[0], k), y: lerp(my, p0[1], k)};
  const c = {x: lerp(mx, p1[0], k), y: lerp(my, p1[1], k)};
  const ang = Math.atan2(c.y - a.y, c.x - a.x);
  const head = (p: Pt, dir: number) => {
    const s = 30;
    const a1 = ang + (dir > 0 ? Math.PI : 0);
    return `M${p.x + s * Math.cos(a1 + 0.5)} ${p.y + s * Math.sin(a1 + 0.5)} L${p.x} ${p.y} L${p.x + s * Math.cos(a1 - 0.5)} ${p.y + s * Math.sin(a1 - 0.5)}`;
  };
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke={PAL.info} strokeOpacity={0.35} strokeWidth={26} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#03060D" strokeOpacity={0.6} strokeWidth={16} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={c.x} y2={c.y} stroke="#F4F7FB" strokeWidth={8} strokeLinecap="round" />
      <path d={head(a, -1)} fill="none" stroke="#F4F7FB" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <path d={head(c, 1)} fill="none" stroke="#F4F7FB" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const widthArrowEnd = (props: BridgeProps, f: number): Pt => {
  const b = basis(bridgeCam(props, f));
  const p = project(b, [0.2, SET.deckY + 0.06, lerp(1.0, 3.4, num(props.bandwidth, f, 0.5)) / 2 + 0.2]);
  return p ? {x: p[0], y: p[1]} : {x: 960, y: 600};
};

export const writingBridge = (f: number): BridgeProps => ({
  frame: f,
  view: 'side',
  cam: [
    {f: CUT.intoWriting - 6, cam: C1A},
    {f: A.verdict + 2, cam: C1B, dur: 240},
    {f: A.memory + 6, cam: VERD, dur: 50},
    {f: A.bandwidth + 2, cam: C3, dur: 54},
    {f: A.itsMath + 6, cam: C3B, dur: 50},
  ],
  bandwidth: [
    [A.bandwidth - 6, 0.5],
    [A.bandwidth + 6, 0.38, EASE.inOut],
    [A.bandwidth + 24, 0.74, EASE.out],
  ],
  dof: 1.4,
  crateRate: 30 / P,
  travel: TRAVEL,
  mathActivity: [
    [CUT.intoWriting, 0.18],
    [A.p14 + 20, 0.18],
    [A.bandwidth + 24, 0.75],
  ],
  idle: [
    [CUT.intoWriting, 0.8],
    [A.p14 + 20, 0.8],
    [A.bandwidth + 24, 0.25],
  ],
  highlight:
    f >= A.writes + 16 && f < A.oneNew - 2
      ? 'crates'
      : f >= A.memory && f < A.p14 + 4
        ? 'tower'
        : f >= A.bandwidth + 8 && f < A.atLeast
          ? 'bridge'
          : f >= A.itsMath
            ? 'die'
            : null,
});

export const WritingScene: React.FC<{frame: number}> = ({frame: f}) => {
  const B = writingBridge(f);
  const from = emitPoint(B, f);
  const gb = widthArrowEnd(B, f);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      shake={[{at: A.memory + 2, strength: 0.4}]}
      hud={
        <>
          <Tag frame={f} at={A.writes - 4} text="WRITING AN ANSWER" x={110} y={112} exitAt={A.verdict - 6} />
          <KineticText frame={f} at={A.oneNew} text="One token per conversation" x={960} y={898} size={76} mode="rise" exitAt={A.holds - 8} screen />
          <KineticText frame={f} at={A.holds} text="Only so many conversations" x={960} y={898} size={76} mode="rise" exitAt={A.verdict + 14} screen />
          <KineticText frame={f} at={A.bandwidth} text="Memory bandwidth" x={1190} y={126} size={100} mode="slam" screen />
          <KineticText frame={f} at={A.bandwidth + 16} text="= the bridge's width" x={1190} y={238} size={76} mode="rise" color={PAL.infoPale} exitAt={A.matters - 4} screen />
          <Label frame={f} at={A.gigabytes} exitAt={A.matters} text="Gigabytes per second" x={1000} y={846} to={gb} size={64} screen />
          <KineticText frame={f} at={A.atLeast} text="At least as much as math" x={1190} y={240} size={76} mode="rise" color={PAL.infoPale} screen />
        </>
      }
    >
      <Bridge {...B} />
      <ConvoRows frame={f} from={from} exitAt={A.verdict} />
      <WidthArrows frame={f} props={B} at={A.bandwidth + 12} exitAt={A.matters + 6} />
      {/* idle die: slow coral "waiting" pulse ring around the emit point while writing */}
      {f < A.verdict ? (
        <div
          style={{
            position: 'absolute',
            left: from.x - 30,
            top: from.y - 30,
            width: 60,
            height: 60,
            borderRadius: 30,
            border: `3px solid ${rgba(PAL.wait, 0.25 + 0.25 * Math.sin((TAU * f) / 50))}`,
            opacity: prog(f, CUT.intoWriting + 10, 12),
          }}
        />
      ) : null}
    </Stage>
  );
};
