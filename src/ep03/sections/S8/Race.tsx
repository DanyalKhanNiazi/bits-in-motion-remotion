// S8 shot D: NVIDIA's single-user test. Two lanes write the same answer: 16-bit vs 8-bit weights.
// Each run is a big glass capsule: a cyan segment (moving the weights) and a silver segment (other work).
// 8-bit halves the cyan segment only, so its runs are 1.44× as frequent: more than 40% faster, not ×2.
import React, {useId} from 'react';
import {BitHead, EASE, Footnote, KineticText, Label, PAL, Rich, SANS, SPRING, Stage, clamp01, lerp, poseAt, prog, rgba, safeId, springAt, toScreen, type CamKey} from '../../kit';
import {W} from './T';
import {MiniTile, arcPt} from './common';

const X0 = 330;
const CAP_H = 120;
const CYAN16 = 560;
const SILVER = 356; // (C + S) / (C/2 + S) = 1.44
const CYAN8 = CYAN16 / 2;
const RUN16 = 12; // frames per run (16-bit)
const V = (CYAN16 + SILVER) / RUN16; // the Bit's speed through a capsule (px/frame), the same in both lanes
const RUN8 = (CYAN8 + SILVER) / V;
const T0 = W.singleUser; // race start
const T1 = T0 + 90; // no more pieces after this (16-bit: 7, 8-bit: 10)
const RX = 96; // rows start at the left margin
const PITCH = 78;
const TILE_W = 64;
const TILE_S = 40;
const N_MAX = 14;

export const LANES = [
  {key: '16', label: '16-bit', y: 300, cyan: CYAN16, run: RUN16},
  {key: '8', label: '8-bit', y: 610, cyan: CYAN8, run: RUN8},
] as const;
const ROW_DY = 132;

export const raceCam: CamKey[] = [
  {f: W.nvidia - 6, x: 960, y: 560, zoom: 1.04},
  {f: W.notTwice + 30, x: 985, y: 548, zoom: 1.0},
  {f: W.moving + 6, x: 820, y: 470, zoom: 1.14, dur: W.moving + 6 - W.partly},
  {f: W.runEnd + 14, x: 800, y: 470, zoom: 1.18},
];

const Capsule: React.FC<{frame: number; y: number; cyan: number; run: number; seed: string; glowCyan: number; glowSilver: number; draw: number}> = ({frame: f, y, cyan, run, seed, glowCyan, glowSilver, draw}) => {
  const id = safeId(useId());
  const len = cyan + SILVER;
  const t = f - T0;
  const pos = t >= 0 ? (((t % run) + run) % run) * V : 0;
  const inCyan = pos < cyan;
  const r = 30;
  const wDraw = len * clamp01(draw);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}-c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8DF8FF" />
          <stop offset="0.45" stopColor={PAL.info} />
          <stop offset="1" stopColor="#0A6E86" />
        </linearGradient>
        <linearGradient id={`${id}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F1F4F8" />
          <stop offset="0.5" stopColor="#B4BCC9" />
          <stop offset="1" stopColor="#6E7787" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x={X0} y={y - CAP_H / 2} width={wDraw} height={CAP_H} rx={r} />
        </clipPath>
        <filter id={`${id}-g`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>
      <rect x={X0} y={y + CAP_H / 2 + 6} width={wDraw} height={18} rx={9} fill="#000" opacity={0.45} filter={`url(#${id}-g)`} />
      <g clipPath={`url(#${id}-clip)`}>
        <rect x={X0} y={y - CAP_H / 2} width={len} height={CAP_H} rx={r} fill="#08101F" />
        {/* cyan segment: moving the weights */}
        <rect x={X0 + 8} y={y - CAP_H / 2 + 8} width={cyan - 12} height={CAP_H - 16} rx={r - 8} fill={`url(#${id}-c)`} opacity={0.55 + 0.35 * (t >= 0 && inCyan ? 1 : 0) + 0.1 * glowCyan} />
        <rect x={X0 + 8} y={y - CAP_H / 2 + 8} width={cyan - 12} height={CAP_H - 16} rx={r - 8} fill={PAL.info} opacity={0.45 * glowCyan} filter={`url(#${id}-g)`} />
        {/* silver segment: other work */}
        <rect x={X0 + cyan + 4} y={y - CAP_H / 2 + 8} width={SILVER - 12} height={CAP_H - 16} rx={r - 8} fill={`url(#${id}-s)`} opacity={0.62 + 0.3 * (t >= 0 && !inCyan ? 1 : 0)} />
        <rect x={X0 + cyan + 4} y={y - CAP_H / 2 + 3} width={SILVER - 12} height={CAP_H - 6} rx={r - 3} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.8 * glowSilver} />
        {/* glass highlight */}
        <rect x={X0 + 18} y={y - CAP_H / 2 + 10} width={len - 36} height={10} rx={5} fill="#FFFFFF" opacity={0.26} />
      </g>
      <rect x={X0} y={y - CAP_H / 2} width={wDraw} height={CAP_H} rx={r} fill="none" stroke={rgba(PAL.annotation, 0.8)} strokeWidth={3} />
      {t >= 0 ? (
        <>
          <rect x={X0 + 8 + pos * ((len - 16) / len) - 3} y={y - CAP_H / 2 + 6} width={6} height={CAP_H - 12} rx={3} fill="#FFFFFF" opacity={0.85} />
          <BitHead x={X0 + 8 + pos * ((len - 16) / len)} y={y} size={34} gid={`${id}-bit-${seed}`} />
        </>
      ) : null}
    </svg>
  );
};

/** Frame at which piece i of a lane drops (or 1e9 when after the race end). */
const dropAt = (run: number, i: number) => {
  const a = T0 + (i + 1) * run;
  return a < T1 ? a : 1e9;
};

/** The bench is tilted back a little (a physical test bench): CSS perspective(TP) rotateX(TILT) about (TOX, TOY). */
const TP = 2400;
const TILT = 9;
const TOX = 960;
const TOY = 560;
const tiltPt = (x: number, y: number) => {
  const a = (TILT * Math.PI) / 180;
  const dy = y - TOY;
  const z = dy * Math.sin(a);
  const k = TP / (TP - z);
  return {x: TOX + (x - TOX) * k, y: TOY + dy * Math.cos(a) * k};
};

export const RaceScene: React.FC<{frame: number}> = ({frame: f}) => {
  const pose = poseAt(f, raceCam);
  const S = (x: number, y: number) => {
    const t = tiltPt(x, y);
    return toScreen(pose, t.x, t.y);
  };
  const enter = prog(f, W.nvidia - 6, 22, EASE.out);
  const glowCyan = prog(f, W.moving - 4, 10) * (0.75 + 0.25 * Math.sin(f / 5));
  const glowSilver = prog(f, W.work - 6, 10) * (0.75 + 0.25 * Math.sin(f / 5));
  const lanes = LANES.map((L) => {
    const tiles: React.ReactNode[] = [];
    const end = X0 + L.cyan + SILVER;
    let n = 0;
    for (let i = 0; i < N_MAX; i++) {
      const a = dropAt(L.run, i);
      if (f < a) break;
      n = i + 1;
      const u = clamp01((f - a) / 9);
      const dst = {x: RX + TILE_W / 2 + i * PITCH, y: L.y + ROW_DY};
      const p = u < 1 ? arcPt({x: end - 20, y: L.y + CAP_H / 2}, dst, 30, EASE.inOut(u)) : dst;
      tiles.push(<MiniTile key={i} x={p.x} y={p.y} text="" size={TILE_S} w={TILE_W} scale={lerp(0.5, 1, EASE.outBack(u))} rim={f - a < 14 ? 1 - (f - a) / 14 : 0} />);
    }
    return {L, tiles, n};
  });
  // ×2: where an 8-bit row twice as fast as the 16-bit row would reach (empty dashed places)
  const n16 = lanes[0].n;
  const n8 = lanes[1].n;
  const ghostIn = prog(f, W.notTwice - 4, 12, EASE.out);
  const ghosts: React.ReactNode[] = [];
  for (let i = n8; i < Math.min(N_MAX, n16 * 2); i++) {
    const k = clamp01(ghostIn * (n16 * 2 - n8) - (i - n8));
    ghosts.push(<MiniTile key={`g${i}`} x={RX + TILE_W / 2 + i * PITCH} y={LANES[1].y + ROW_DY} text="" size={TILE_S} w={TILE_W} slot opacity={k} />);
  }
  const x2x = RX + n16 * 2 * PITCH - 8;
  const strike = prog(f, W.notTwice + 8, 8, EASE.out);
  const cy1 = S(X0 + CYAN16 / 2, LANES[0].y - CAP_H / 2);
  const sv1 = S(X0 + CYAN16 + SILVER / 2, LANES[0].y - CAP_H / 2);
  const not2 = S(x2x + 40, LANES[1].y + ROW_DY);
  const hud = (
    <>
      <KineticText frame={f} at={W.singleUser - 12} text="NVIDIA's single-user test" x={96} y={116} size={64} align="left" mode="rise" backing="none" color={PAL.ink} exitAt={W.partly - 4} />
      <KineticText frame={f} at={W.moreThan} text="More than" x={1440} y={440} size={60} mode="pop" exitAt={W.partly + 6} />
      <KineticText frame={f} at={W.forty} text="40% faster" x={1440} y={540} size={128} mode="pop" stagger={4} exitAt={W.partly + 6} />
      <KineticText frame={f} at={W.notTwice} text="not ×2" x={Math.min(1700, not2.x)} y={Math.min(880, not2.y)} size={76} mode="pop" align="left" color={PAL.wait} accent={PAL.wait} exitAt={W.partly + 12} />
      <Label frame={f} at={W.moving} text="Moving the weights" x={cy1.x - 40} y={cy1.y - 96} to={{x: cy1.x, y: cy1.y + 4}} side="left" size={56} />
      <Label frame={f} at={W.work - 2} text="Other work" x={sv1.x + 40} y={sv1.y - 96} to={{x: sv1.x, y: sv1.y + 4}} side="right" size={56} />
      <Footnote frame={f} at={W.moving + 6} text="Split of each run: illustrative" x={1230} y={650} size={40} exitAt={W.runEnd + 10} />
    </>
  );
  return (
    <Stage frame={f} env={{kind: 'night', dust: 50}} cam={raceCam} hud={hud}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `perspective(${TP}px) rotateX(${TILT}deg)`, transformOrigin: `${TOX}px ${TOY}px`}}>
        {LANES.map((L) => (
          <div key={`spot${L.key}`} style={{position: 'absolute', left: 60, top: L.y - 150, width: 1400, height: 420, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#1E4C8A', 0.34 * enter)}, rgba(0,0,0,0))`}} />
        ))}
        {lanes.map(({L, tiles}, li) => {
          const a = springAt(f, W.nvidia - 4 + li * 5, SPRING.snap);
          return (
            <React.Fragment key={L.key}>
              <div style={{position: 'absolute', left: 96, top: L.y, transform: `translate(${(1 - Math.min(1, a)) * -40}px, -50%)`, opacity: clamp01(a * 2), fontFamily: SANS, fontWeight: 700, fontSize: 64, color: PAL.ink, whiteSpace: 'nowrap'}}>
                {L.label}
              </div>
              <Capsule frame={f} y={L.y} cyan={L.cyan} run={L.run} seed={L.key} glowCyan={glowCyan} glowSilver={glowSilver} draw={prog(f, W.nvidia - 2 + li * 5, 18, EASE.out)} />
              <div style={{position: 'absolute', left: RX - 14, top: L.y + ROW_DY - 46, width: (li === 0 ? 8 : N_MAX) * PITCH + 18, height: 92, borderRadius: 20, background: `linear-gradient(180deg, ${rgba('#13254A', 0.75)}, ${rgba('#0A1430', 0.6)})`, border: `2px solid ${rgba(PAL.structure, 0.32)}`, boxShadow: `0 18px 40px rgba(0,0,0,0.45), inset 0 2px 0 ${rgba('#9FB3C8', 0.12)}`, opacity: enter}} />
              {tiles}
            </React.Fragment>
          );
        })}
        {ghosts}
        {ghostIn > 0.01 ? (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <line x1={x2x} y1={LANES[1].y + ROW_DY - 64} x2={x2x} y2={LANES[1].y + ROW_DY + 56} stroke={PAL.infoPale} strokeWidth={4} strokeDasharray="12 10" opacity={ghostIn} />
          </svg>
        ) : null}
        {ghostIn > 0.01 ? (
          <div style={{position: 'absolute', left: x2x, top: LANES[1].y + ROW_DY - 100, transform: 'translate(-50%, -50%)', opacity: ghostIn, fontFamily: SANS, fontWeight: 700, fontSize: 64, color: strike > 0 ? PAL.muted : PAL.infoPale}}>
            <Rich text="×2" weight={700} />
            <div style={{position: 'absolute', left: -12, right: -12, top: '52%', height: 8, borderRadius: 4, background: PAL.wait, transform: `scaleX(${strike}) rotate(-8deg)`, transformOrigin: '0 50%', boxShadow: `0 0 14px ${rgba(PAL.wait, 0.7)}`}} />
          </div>
        ) : null}
        {(() => {
          // a slow light sweep across the bench
          const ph = ((f - 15740) % 150) / 150;
          return <div style={{position: 'absolute', left: lerp(-600, 2200, ph), top: 160, width: 360, height: 760, transform: 'skewX(-18deg)', background: `linear-gradient(90deg, rgba(255,255,255,0), ${rgba('#BFE9FF', 0.07)}, rgba(255,255,255,0))`, pointerEvents: 'none'}} />;
        })()}
      </div>
    </Stage>
  );
};
