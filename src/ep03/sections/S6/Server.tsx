/**
 * S6 shots 3–4: the data-center plate, the 8-GPU rack as hero. The setup card builds on the words, the eight drawers
 * light up, requests stream in until it is packed; then the power dial drops every GPU to half and the math slows.
 */
import React, {useId} from 'react';
import {
  EASE,
  Footnote,
  KineticText,
  Label,
  PAL,
  PowerDial,
  Prop,
  SANS,
  SPRING,
  Stage,
  TAU,
  clamp01,
  lerp,
  nz,
  poseAt,
  prog,
  propPoint,
  rgba,
  rr,
  safeId,
  springAt,
  toScreen,
  track,
  win,
  type CamKey,
  type Key,
} from '../../kit';
import {A, CUT} from './anchors';
import {Tag, travelled} from './common';

const RACK = 'BIM145_T03_eight-gpu-server_a' as const;
const PLACE = {x: 1460, y: 548, h: 880};
/** Drawer tops in native px (measured), drawer height ≈ 124. */
const TOPS = [180, 313, 445, 577, 709, 842, 974, 1108];
const DH = 124;

export const SERVER_CAM: CamKey[] = [
  {f: CUT.intoServer, zoom: 1.0, x: 1110, y: 540},
  {f: A.packed + 10, zoom: 1.03, x: 1150, y: 546, dur: 120},
  {f: A.capped - 2, zoom: 1.0, x: 960, y: 540, dur: 30},
  {f: CUT.intoLanes + 14, zoom: 1.05, x: 930, y: 536},
];

/** Power level (1 → 0.5), shared by the dial and the drawers. */
export const POWER: readonly Key[] = [
  [A.capped + 2, 1],
  [A.half + 5, 0.5, EASE.inOut],
];

/** LED flicker speed: slows with the power cap. */
const LED_SPEED: readonly Key[] = [
  [A.capped + 2, 1],
  [A.half + 5, 0.28, EASE.inOut],
];

/** Request cards: launch frames, target drawers and paths (pure data). */
const N_REQ = 44;
const REQ = Array.from({length: N_REQ}, (_, j) => {
  const t0 = A.packed - 10 + j * 1.2 + rr(`rq-t-${j}`, -1, 1);
  const d = (j * 5) % 8;
  const sy = rr(`rq-y-${j}`, 160, 940);
  const cy = rr(`rq-c-${j}`, 120, 980);
  return {t0, d, sy, cy, dur: 22 + Math.round(rr(`rq-d-${j}`, 0, 6))};
});

const RequestCard: React.FC<{x: number; y: number; rot: number; s: number; op: number; blur: number}> = ({x, y, rot, s, op, blur}) => (
  <div
    style={{
      position: 'absolute',
      left: x - 42,
      top: y - 28,
      width: 84,
      height: 56,
      borderRadius: 14,
      background: 'linear-gradient(180deg, #FFFFFF, #DCE2EC)',
      boxShadow: `0 8px 18px rgba(0,0,0,0.5), 0 0 0 3px ${rgba(PAL.info, 0.55)}, 0 0 18px ${rgba(PAL.info, 0.45)}`,
      transform: `rotate(${rot}deg) scale(${s})`,
      opacity: op,
      filter: blur > 1.5 ? `blur(${Math.min(2.5, blur - 1.5)}px)` : undefined,
    }}
  >
    <div style={{position: 'absolute', left: 13, top: 15, width: 56, height: 7, borderRadius: 4, background: '#8E99AD'}} />
    <div style={{position: 'absolute', left: 13, top: 32, width: 38, height: 7, borderRadius: 4, background: '#B4BDCC'}} />
  </div>
);

const Icon: React.FC<{kind: 'model' | 'gpu' | 'req'}> = ({kind}) => (
  <svg width={56} height={56} viewBox="0 0 56 56" style={{flex: 'none'}}>
    {kind === 'model' ? (
      <g fill="none" stroke={PAL.info} strokeWidth={4} strokeLinejoin="round">
        <rect x={8} y={30} width={40} height={14} rx={3} />
        <rect x={8} y={14} width={40} height={14} rx={3} opacity={0.7} />
      </g>
    ) : kind === 'gpu' ? (
      <g fill="none" stroke={PAL.info} strokeWidth={4}>
        <rect x={12} y={12} width={32} height={32} rx={4} />
        <rect x={20} y={20} width={16} height={16} rx={2} fill={PAL.info} />
        {[18, 28, 38].map((v) => (
          <g key={v}>
            <line x1={v} y1={4} x2={v} y2={12} />
            <line x1={v} y1={44} x2={v} y2={52} />
          </g>
        ))}
      </g>
    ) : (
      <g fill="none" stroke={PAL.info} strokeWidth={4} strokeLinejoin="round">
        <rect x={6} y={10} width={36} height={24} rx={6} />
        <rect x={14} y={22} width={36} height={24} rx={6} fill="#0B1424" />
      </g>
    )}
  </svg>
);

const SetupCard: React.FC<{frame: number}> = ({frame: f}) => {
  const exitAt = A.capped - 18;
  const ex = prog(f, exitAt, 12, EASE.inCubic);
  if (f < A.researchers - 4 || ex >= 1) return null;
  const rows: Array<{at: number; text: string; icon: 'model' | 'gpu' | 'req'}> = [
    {at: A.bigOpen, text: 'Big open models', icon: 'model'},
    {at: A.gpu8, text: '8 GPUs', icon: 'gpu'},
    {at: A.packed, text: 'Packed with requests', icon: 'req'},
  ];
  const cardIn = prog(f, A.researchers - 4, 12, EASE.out);
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 128,
        width: 860,
        padding: '24px 34px 28px',
        borderRadius: 26,
        background: rgba('#060B16', 0.84),
        border: `2px solid ${rgba(PAL.structure, 0.4)}`,
        boxShadow: `0 24px 60px ${rgba('#000000', 0.55)}`,
        opacity: cardIn * (1 - ex),
        transform: `translateY(${(1 - cardIn) * 24}px) scale(${1 - 0.5 * ex}) translateX(${-200 * ex}px)`,
        transformOrigin: '0% 100%',
      }}
    >
      <div style={{position: 'relative', height: 56}}>
        <Tag frame={f} at={A.researchers} text="THE SETUP" x={-8} y={22} />
      </div>
      {rows.map((r, i) => {
        const s = springAt(f, r.at - 2, SPRING.snap);
        if (f < r.at - 2) return <div key={i} style={{height: 86}} />;
        return (
          <div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, height: 86, opacity: clamp01(s * 2), transform: `translateX(${(1 - Math.min(1, s)) * -40}px)`}}>
            <Icon kind={r.icon} />
            <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 62, color: PAL.ink, whiteSpace: 'nowrap'}}>{r.text}</div>
          </div>
        );
      })}
    </div>
  );
};

/** Overlay on the rack in its native px: drawer outlines, request load, math LEDs and power bars. */
const RackOverlay: React.FC<{frame: number; gid: string}> = ({frame: f, gid}) => {
  const power = track(f, POWER);
  const phase = travelled(f, LED_SPEED, 0.16);
  return (
    <svg width={1145} height={1374} viewBox="0 0 1145 1374" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <filter id={`${gid}-g`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      {TOPS.map((t, i) => {
        // 8 GPUs: cascade outline
        const lit = win(f, A.gpu8 + i * 3, A.capped + 70, 3, 20);
        const flash = Math.exp(-Math.max(0, f - (A.gpu8 + i * 3)) / 6) * (f >= A.gpu8 + i * 3 ? 1 : 0);
        // load from arrived requests
        const mine = REQ.filter((r) => r.d === i);
        const arrived = mine.filter((r) => f >= r.t0 + r.dur).length;
        const load = mine.length ? arrived / mine.length : 0;
        const full = win(f, A.hold, A.capped + 10, 2, 16) * (load > 0.99 ? 1 : 0);
        // math LEDs
        const ledOn = clamp01(prog(f, A.gpu8 + i * 3, 6));
        const leds = Array.from({length: 12}, (_, k) => {
          const v = 0.25 + 0.75 * Math.max(0, nz(`led${i}-${k}`, phase, k * 0.6) * 0.5 + 0.5) ** 1.5;
          return v * lerp(0.45, 1, (power - 0.5) / 0.5);
        });
        // power bar in the display window
        const pIn = springAt(f, A.everyGpu + i * 3, SPRING.snap);
        return (
          <g key={i}>
            {lit > 0 ? (
              <>
                <rect x={376} y={t - 3} width={592} height={DH + 4} rx={8} fill="none" stroke={PAL.info} strokeWidth={10} opacity={(0.35 * lit + 0.6 * flash) * 0.9} filter={`url(#${gid}-g)`} />
                <rect x={376} y={t - 3} width={592} height={DH + 4} rx={8} fill="none" stroke={PAL.infoPale} strokeWidth={3} opacity={0.25 * lit + 0.7 * flash} />
              </>
            ) : null}
            {/* request load: grille glow */}
            {load > 0 ? <rect x={446} y={t + 12} width={300} height={DH - 26} rx={6} fill={PAL.info} opacity={0.1 + 0.22 * load + 0.25 * full} /> : null}
            {/* math LEDs */}
            {ledOn > 0
              ? leds.map((v, k) => {
                  const hh = 14 + 64 * v;
                  return <rect key={k} x={462 + k * 23} y={t + 104 - hh} width={12} height={hh} rx={3} fill={k % 4 === 3 ? PAL.infoPale : PAL.info} opacity={ledOn * (0.35 + 0.55 * v)} />;
                })
              : null}
            {/* power bar */}
            {f >= A.everyGpu + i * 3 - 1 ? (
              <g opacity={clamp01(pIn * 2)}>
                <rect x={812} y={t + 6} width={94} height={40} rx={4} fill="#0B0702" stroke={PAL.energyDeep} strokeWidth={2} />
                <rect x={817} y={t + 11} width={84 * power * Math.min(1, pIn)} height={30} rx={3} fill={PAL.energy} />
                <rect x={817} y={t + 11} width={84 * power * Math.min(1, pIn)} height={30} rx={3} fill={PAL.energy} opacity={0.7} filter={`url(#${gid}-g)`} />
              </g>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

export const ServerScene: React.FC<{frame: number}> = ({frame: f}) => {
  const gid = safeId(useId());
  const pose = poseAt(f, SERVER_CAM);
  const drawerScreen = (i: number) => {
    const w = propPoint(RACK, PLACE, 392, TOPS[i] + DH / 2);
    return toScreen(pose, w.x, w.y);
  };
  const windowScreen = (i: number) => {
    const w = propPoint(RACK, PLACE, 860, TOPS[i] + 26);
    return toScreen(pose, w.x, w.y);
  };
  // requests in flight (world px)
  const cards: React.ReactNode[] = [];
  for (let j = 0; j < N_REQ; j++) {
    const r = REQ[j];
    const u = (f - r.t0) / r.dur;
    if (u < 0 || u > 1.25) continue;
    const tgt = propPoint(RACK, PLACE, 420, TOPS[r.d] + DH / 2);
    const P = (uu: number) => {
      const e = EASE.inOut(clamp01(uu));
      const x0 = -90;
      const y0 = r.sy;
      const cx = 620;
      const cy = r.cy;
      const x = (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * cx + e * e * tgt.x;
      const y = (1 - e) * (1 - e) * y0 + 2 * (1 - e) * e * cy + e * e * tgt.y;
      return {x, y};
    };
    const p = P(u);
    const q = P(u - 0.06);
    const rot = (Math.atan2(p.y - q.y, p.x - q.x) * 180) / Math.PI * 0.35;
    const sp = Math.hypot(p.x - q.x, p.y - q.y);
    const sink = clamp01((u - 1) / 0.25);
    cards.push(<RequestCard key={j} x={p.x} y={p.y} rot={rot} s={1 - 0.55 * sink} op={(1 - sink) * clamp01(u * 6)} blur={sp * 0.08} />);
  }
  const dialW = 470;
  const dialPos = {x: 560, y: 650};
  const dialTop = toScreen(pose, dialPos.x, dialPos.y - 300);
  const lessY = dialTop.y - 190;
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'server-room', dim: 0.4, blur: 2.5, tint: 0.32, kb: {from: {s: 1.04, x: 10}, to: {s: 1.13, x: -50}, start: CUT.intoServer - 20, end: CUT.intoLanes + 20}}}
      cam={SERVER_CAM}
      shake={[{at: A.half + 3, strength: 0.35}]}
      hud={
        <>
          <SetupCard frame={f} />
          <Footnote frame={f} at={A.capped - 8} text="Big open models, 8 GPUs, packed" size={52} screen />
          <Label frame={f} at={A.everyGpu + 2} exitAt={A.lessPower - 4} text="Every GPU" x={drawerScreen(0).x - 50} y={140} to={drawerScreen(0)} side="left" size={64} screen />
          <KineticText frame={f} at={A.half} text="Half power" x={dialTop.x} y={dialTop.y - 95} size={110} mode="slam" color={PAL.energy} accent={PAL.energy} exitAt={A.lessPower - 6} />
          <KineticText frame={f} at={A.lessPower} text="Less power" x={dialTop.x} y={lessY} size={84} mode="rise" color={PAL.energy} />
          <KineticText frame={f} at={A.slowerMath - 2} text="→ slower math" x={dialTop.x} y={lessY + 100} size={84} mode="rise" color={PAL.ink} />
        </>
      }
    >
      {/* faint aisle status lights for life */}
      {Array.from({length: 14}, (_, i) => {
        const x = rr(`sl-x-${i}`, 520, 900);
        const y = rr(`sl-y-${i}`, 260, 700);
        const b = 0.5 + 0.5 * Math.sin((TAU * f) / rr(`sl-p-${i}`, 24, 70) + i);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 6, height: 6, borderRadius: 3, background: i % 3 ? PAL.info : PAL.infoPale, opacity: 0.25 + 0.5 * b, boxShadow: `0 0 10px ${rgba(PAL.info, 0.6)}`}} />;
      })}
      <Prop
        frame={f}
        src={RACK}
        x={PLACE.x}
        y={PLACE.y}
        h={PLACE.h}
        enter={{kind: 'rise', at: CUT.intoServer + 6, dur: 26, dist: 160}}
        rim={{color: PAL.info, strength: 0.45}}
        sweep={{at: [A.gpu8 - 6, A.hold - 4], dur: 30, strength: 0.4}}
        shadow={{opacity: 0.6, dy: -10, w: 0.9}}
        float={2}
      >
        <RackOverlay frame={f} gid={gid} />
      </Prop>
      {cards}
      <PowerDial frame={f} x={dialPos.x} y={dialPos.y} w={dialW} value={POWER} enter={{kind: 'slide', at: A.capped - 16, from: 'left', dist: 900}} tiltY={[[A.capped - 16, 14], [A.half + 20, 4]]} />
      {/* dial pulse rings on the drop */}
      {f >= A.half - 2 && f < A.half + 26 ? (
        <div
          style={{
            position: 'absolute',
            left: dialPos.x + 60 - 260,
            top: dialPos.y + 70 - 260,
            width: 520,
            height: 520,
            borderRadius: '50%',
            border: `4px solid ${rgba(PAL.energy, 0.7 * (1 - (f - A.half + 2) / 28))}`,
            transform: `scale(${0.4 + 0.9 * EASE.out(clamp01((f - A.half + 2) / 28))})`,
          }}
        />
      ) : null}
    </Stage>
  );
};
