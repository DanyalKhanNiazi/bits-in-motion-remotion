/**
 * Ep03 kit: environments. Each is full-bleed, always alive (drifting light, dust, flowing traces) and takes the stage
 * camera pose so its layers parallax behind the world.
 *   night  deep navy, slow light pools, drifting dust, a faint perspective floor grid
 *   chip   a macro circuit world: a receding circuit floor with emissive pulses, horizon haze, bokeh
 *   photo  a plate (reader-desk, server-room, gpu-macro, home-gpu) with Ken Burns, grade, optional depth blur
 *   void   near-black with a breathing centre glow and faint dust
 */
import React, {useMemo} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {PAL} from './look';
import {PLATE_H, PLATE_W, plateUrl, type PlateName} from './assets';
import type {Pose} from './camera';
import {TAU, clamp01, lerp, osc, rgba, rnd, rr} from './util';

/** CSS transform for a full-frame layer that follows the camera by `f` (0 = fixed, 1 = moves with the world). */
export const parallaxCss = (p: Pose, f: number): string => {
  const z = Math.pow(p.zoom, f);
  const cx = 960 + (p.x - 960) * f;
  const cy = 540 + (p.y - 540) * f;
  return `translate(960px, 540px) rotate(${p.rot * f}deg) scale(${z}) translate(${-cx}px, ${-cy}px)`;
};
const Layer: React.FC<{pose: Pose; f: number; children: React.ReactNode; style?: React.CSSProperties}> = ({pose, f, children, style}) => (
  <AbsoluteFill style={{transform: parallaxCss(pose, f), transformOrigin: '0 0', ...style}}>{children}</AbsoluteFill>
);

/* ---------------------------------------------------------------- dust (shared) */
type Mote = {x: number; y: number; d: number; s: number; vx: number; vy: number; ph: number; bokeh: boolean; hue: number};
const motes = (seed: string, n: number, bokehShare = 0.18): Mote[] =>
  Array.from({length: n}, (_, i) => {
    const bokeh = rnd(`${seed}-b-${i}`) < bokehShare;
    return {
      x: rr(`${seed}-x-${i}`, -300, 2220),
      y: rr(`${seed}-y-${i}`, -200, 1280),
      d: rr(`${seed}-d-${i}`, 0.25, 1),
      s: bokeh ? rr(`${seed}-s-${i}`, 10, 30) : rr(`${seed}-s-${i}`, 1.6, 4),
      vx: rr(`${seed}-vx-${i}`, 0.05, 0.32),
      vy: rr(`${seed}-vy-${i}`, -0.28, -0.04),
      ph: rnd(`${seed}-p-${i}`),
      bokeh,
      hue: rnd(`${seed}-h-${i}`),
    };
  });

export const Dust: React.FC<{frame: number; pose: Pose; seed?: string; count?: number; color?: string; opacity?: number; bokeh?: number}> = ({
  frame,
  pose,
  seed = 'dust',
  count = 70,
  color = '#9CC8FF',
  opacity = 1,
  bokeh = 0.18,
}) => {
  const ms = useMemo(() => motes(seed, count, bokeh), [seed, count, bokeh]);
  const W = 2520;
  const H = 1480;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${seed}-bk`}>
          <stop offset="0%" stopColor={color} stopOpacity={0.5} />
          <stop offset="55%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${seed}-bk2`}>
          <stop offset="0%" stopColor={PAL.info} stopOpacity={0.42} />
          <stop offset="60%" stopColor={PAL.info} stopOpacity={0.1} />
          <stop offset="100%" stopColor={PAL.info} stopOpacity={0} />
        </radialGradient>
      </defs>
      {ms.map((m, i) => {
        const z = Math.pow(pose.zoom, m.d);
        const wx = ((((m.x + m.vx * frame + 300) % W) + W) % W) - 300;
        const wy = ((((m.y + m.vy * frame + 200) % H) + H) % H) - 200;
        const sx = 960 + (wx - 960 - (pose.x - 960) * m.d) * z;
        const sy = 540 + (wy - 540 - (pose.y - 540) * m.d) * z;
        const tw = 0.55 + 0.45 * Math.sin(TAU * (frame / (90 + m.ph * 120) + m.ph));
        if (m.bokeh) {
          const r = m.s * (0.7 + m.d * 0.6) * z;
          return <circle key={i} cx={sx} cy={sy} r={r} fill={`url(#${seed}-${m.hue < 0.3 ? 'bk2' : 'bk'})`} opacity={opacity * (0.35 + 0.4 * tw) * m.d} />;
        }
        return <circle key={i} cx={sx} cy={sy} r={m.s * 0.5 * (0.6 + m.d * 0.7)} fill={color} opacity={opacity * (0.25 + 0.55 * tw) * m.d} />;
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- night */
export const NightEnv: React.FC<{frame: number; pose: Pose; grid?: boolean; dust?: number; warm?: number}> = ({frame, pose, grid = true, dust = 70, warm = 0}) => {
  const pools = [
    {x: 960 + 460 * osc(frame, 900, 0.1), y: 420 + 140 * osc(frame, 1100, 0.6), r: 980, c: rgba('#1C6FA8', 0.2)},
    {x: 520 + 300 * osc(frame, 1300, 0.4), y: 300 + 120 * osc(frame, 800, 0.2), r: 820, c: rgba('#2B3F9A', 0.22)},
    {x: 1480 + 260 * osc(frame, 1000, 0.8), y: 640 + 120 * osc(frame, 1200, 0.3), r: 760, c: rgba(warm > 0 ? '#7A4A1C' : '#00A9C8', warm > 0 ? 0.16 * warm : 0.1)},
  ];
  const yh = 640;
  const scroll = (frame * 0.018) % 1;
  const zs: number[] = [];
  for (let k = 0; k < 34; k++) zs.push(1 + k - scroll);
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
      <Layer pose={pose} f={0.06}>
        <div
          style={{
            position: 'absolute',
            left: -400,
            top: -300,
            width: 2720,
            height: 1680,
            background: 'radial-gradient(ellipse 52% 50% at 50% 44%, #15284A 0%, #0E1C36 38%, #091327 66%, #050A15 100%)',
          }}
        />
      </Layer>
      <Layer pose={pose} f={0.16}>
        {pools.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x - p.r,
              top: p.y - p.r * 0.7,
              width: p.r * 2,
              height: p.r * 1.4,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${p.c}, rgba(0,0,0,0))`,
            }}
          />
        ))}
      </Layer>
      {grid ? (
        <Layer pose={pose} f={0.4}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <defs>
              <linearGradient id="night-gridfade" x1="0" y1={yh} x2="0" y2={1300} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#6F8FCB" stopOpacity={0} />
                <stop offset="0.35" stopColor="#6F8FCB" stopOpacity={0.12} />
                <stop offset="1" stopColor="#6F8FCB" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <g stroke="url(#night-gridfade)" strokeWidth={1.6} fill="none">
              {Array.from({length: 41}, (_, i) => {
                const X = (i - 20) * 1.1;
                return <line key={`r${i}`} x1={960 + 900 * X} y1={yh + 560} x2={960} y2={yh} />;
              })}
              {zs.map((z, i) => {
                const y = yh + 560 / z;
                return <line key={`h${i}`} x1={-800} y1={y} x2={2720} y2={y} strokeWidth={lerp(0.8, 2.2, clamp01(1 / z))} />;
              })}
            </g>
            <rect x={-800} y={yh - 70} width={3520} height={140} fill="url(#night-horizon)" />
            <defs>
              <linearGradient id="night-horizon" x1="0" y1={yh - 70} x2="0" y2={yh + 70} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#1A3A66" stopOpacity={0} />
                <stop offset="0.5" stopColor="#24508A" stopOpacity={0.22} />
                <stop offset="1" stopColor="#1A3A66" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        </Layer>
      ) : null}
      {dust > 0 ? <Dust frame={frame} pose={pose} seed="night" count={dust} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- chip */
type Trace = {d: string; pulse: boolean; len: number};
const buildTraces = (seed: string, tw: number, th: number): {traces: Trace[]; pads: Array<[number, number, number]>; blocks: Array<[number, number, number, number]>} => {
  const traces: Trace[] = [];
  const pads: Array<[number, number, number]> = [];
  const blocks: Array<[number, number, number, number]> = [];
  const step = 20;
  for (let i = 0; i < 16; i++) {
    let x = Math.round(rr(`${seed}-x${i}`, 0, tw) / step) * step;
    let y = Math.round(rr(`${seed}-y${i}`, 0, th) / step) * step;
    let d = `M${x} ${y}`;
    let len = 0;
    let dir = rnd(`${seed}-d${i}`) < 0.5 ? 0 : 1;
    const segs = 3 + Math.floor(rnd(`${seed}-n${i}`) * 4);
    pads.push([x, y, 5]);
    for (let s = 0; s < segs; s++) {
      const L = step * (2 + Math.floor(rnd(`${seed}-l${i}-${s}`) * 7));
      const sg = rnd(`${seed}-g${i}-${s}`) < 0.5 ? -1 : 1;
      if (dir === 0) x += L * sg;
      else y += L * sg;
      // a 45° jog sometimes, as on real boards
      if (rnd(`${seed}-j${i}-${s}`) < 0.3) {
        const j = step * sg;
        x += j;
        y += j;
        len += Math.abs(j) * 1.414;
      }
      d += ` L${x} ${y}`;
      len += L;
      dir = 1 - dir;
    }
    pads.push([x, y, 5]);
    traces.push({d, pulse: rnd(`${seed}-p${i}`) < 0.55, len});
  }
  for (let b = 0; b < 3; b++) {
    blocks.push([rr(`${seed}-bx${b}`, 0, tw - 90), rr(`${seed}-by${b}`, 0, th - 60), rr(`${seed}-bw${b}`, 50, 110), rr(`${seed}-bh${b}`, 30, 70)]);
  }
  return {traces, pads, blocks};
};

export const ChipEnv: React.FC<{frame: number; pose: Pose; pulses?: number; dust?: number}> = ({frame, pose, pulses = 1, dust = 40}) => {
  const TW = 400;
  const TH = 300;
  const t = useMemo(() => buildTraces('chipenv', TW, TH), []);
  const scroll = (frame * 0.7) % TH;
  const yh = 330;
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
      <Layer pose={pose} f={0.08}>
        <div
          style={{
            position: 'absolute',
            left: -400,
            top: -300,
            width: 2720,
            height: 1680,
            background: `linear-gradient(180deg, #03060D 0%, #06101F ${(300 + yh) / 16.8}%, #0B1C34 ${(300 + yh + 20) / 16.8}%, #08142A 70%, #050B17 100%)`,
          }}
        />
      </Layer>
      <Layer pose={pose} f={0.45}>
        <div
          style={{
            position: 'absolute',
            left: 960 - 2200,
            top: yh,
            width: 4400,
            height: 920,
            transformOrigin: '50% 0%',
            transform: 'perspective(1000px) rotateX(71deg)',
          }}
        >
          <svg width={4400} height={920} style={{position: 'absolute', left: 0, top: 0}}>
            <defs>
              <pattern id="chip-tile" width={TW} height={TH} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${scroll})`}>
                <rect width={TW} height={TH} fill="#081427" />
                {t.blocks.map(([x, y, w, h], i) => (
                  <g key={`b${i}`}>
                    <rect x={x} y={y} width={w} height={h} rx={4} fill="#0D1D36" stroke="#2A4C7E" strokeWidth={2} />
                    <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} rx={2} fill="none" stroke="#1C3558" strokeWidth={1.5} />
                  </g>
                ))}
                {t.traces.map((tr, i) => (
                  <path key={`t${i}`} d={tr.d} fill="none" stroke="#1E3C68" strokeWidth={3} strokeLinejoin="round" />
                ))}
                {t.traces.map((tr, i) =>
                  tr.pulse && pulses > 0 ? (
                    <g key={`p${i}`}>
                      <path
                        d={tr.d}
                        fill="none"
                        stroke={PAL.info}
                        strokeOpacity={0.22 * pulses}
                        strokeWidth={9}
                        strokeLinecap="round"
                        strokeDasharray={`46 ${tr.len + 200}`}
                        strokeDashoffset={-((frame * 5 + i * 97) % (tr.len + 246))}
                      />
                      <path
                        d={tr.d}
                        fill="none"
                        stroke={PAL.infoPale}
                        strokeOpacity={0.9 * pulses}
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray={`30 ${tr.len + 216}`}
                        strokeDashoffset={-((frame * 5 + i * 97) % (tr.len + 246)) - 8}
                      />
                    </g>
                  ) : null,
                )}
                {t.pads.map(([x, y, r], i) => (
                  <rect key={`d${i}`} x={x - r} y={y - r} width={r * 2} height={r * 2} rx={1.5} fill="#2C5287" />
                ))}
              </pattern>
              <linearGradient id="chip-fog" x1="0" y1="0" x2="0" y2="920" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#0B1C34" stopOpacity={1} />
                <stop offset="0.3" stopColor="#0B1C34" stopOpacity={0.35} />
                <stop offset="0.7" stopColor="#0B1C34" stopOpacity={0} />
              </linearGradient>
            </defs>
            <rect width={4400} height={920} fill="url(#chip-tile)" />
            <rect width={4400} height={920} fill="url(#chip-fog)" />
          </svg>
        </div>
        <div
          style={{
            position: 'absolute',
            left: -400,
            top: yh - 160,
            width: 2720,
            height: 320,
            background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(0,180,230,0.16), rgba(0,0,0,0))',
          }}
        />
      </Layer>
      {dust > 0 ? <Dust frame={frame} pose={pose} seed="chip" count={dust} color="#7FD8FF" bokeh={0.35} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- void */
export const VoidEnv: React.FC<{frame: number; pose: Pose; dust?: number}> = ({frame, pose, dust = 30}) => (
  <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
    <Layer pose={pose} f={0.1}>
      <div
        style={{
          position: 'absolute',
          left: -400,
          top: -300,
          width: 2720,
          height: 1680,
          background: `radial-gradient(ellipse 40% 42% at 50% ${46 + 2 * osc(frame, 300)}%, rgba(20,40,74,${0.75 + 0.15 * osc(frame, 240)}) 0%, rgba(9,16,32,0.6) 50%, rgba(4,7,14,0) 100%)`,
        }}
      />
    </Layer>
    {dust > 0 ? <Dust frame={frame} pose={pose} seed="void" count={dust} opacity={0.7} /> : null}
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- photo */
export type KenBurns = {from?: {s?: number; x?: number; y?: number}; to?: {s?: number; x?: number; y?: number}; start?: number; end?: number};
export type PhotoOpts = {
  plate: PlateName;
  /** Ken Burns in stage px and scale (multiplies the cover fit). Omit for a slow endless drift. */
  kb?: KenBurns;
  /** depth blur in px (background use) */
  blur?: number;
  /** 0..1 darkening (default 0.12) */
  dim?: number;
  /** 0..1 navy tint (default 0.25) */
  tint?: number;
  /** children in PLATE px (1672×941), e.g. <ScreenSlot rect={REGIONS.deskScreen}>…</ScreenSlot> */
  children?: React.ReactNode;
  /** 0..1 bottom gradient for text legibility (default 0.35) */
  floor?: number;
};
export const COVER = Math.max(1920 / PLATE_W, 1080 / PLATE_H);

export const kenBurnsAt = (frame: number, kb?: KenBurns): {s: number; x: number; y: number} => {
  if (!kb) {
    return {s: 1.05 + 0.025 * (0.5 + 0.5 * osc(frame, 700, 0.75)), x: 16 * osc(frame, 900, 0.1), y: 9 * osc(frame, 640, 0.4)};
  }
  const a = {s: 1.04, x: 0, y: 0, ...(kb.from ?? {})};
  const b = {s: 1.12, x: 0, y: 0, ...(kb.to ?? {})};
  const st = kb.start ?? 0;
  const en = kb.end ?? st + 300;
  const t = clamp01((frame - st) / Math.max(1, en - st));
  const e = t * t * (3 - 2 * t) * 0.6 + t * 0.4; // never stops dead
  return {s: lerp(a.s, b.s, e), x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e)};
};

/**
 * Overscan: the smallest extra scale (about the plate point under the frame centre) that keeps the plate covering the
 * whole frame for this camera view, and the matching Ken Burns offset. e = 1 (no change) whenever it already covers.
 */
export const plateCover = (k: {s: number; x: number; y: number}, view?: Pose, blur = 0): {e: number; x: number; y: number} => {
  const v = view ?? {x: 960, y: 540, zoom: 1, rot: 0};
  const S = COVER * k.s;
  const r = (-v.rot * Math.PI) / 180;
  const cs = Math.cos(r);
  const sn = Math.sin(r);
  const toPlate = (sx: number, sy: number) => {
    const dx = (sx - 960) / v.zoom;
    const dy = (sy - 540) / v.zoom;
    const wx = v.x + dx * cs - dy * sn;
    const wy = v.y + dx * sn + dy * cs;
    return {x: PLATE_W / 2 + (wx - 960 - k.x) / S, y: PLATE_H / 2 + (wy - 540 - k.y) / S};
  };
  const m = 8 + blur * 2;
  const q = toPlate(960, 540);
  const q0 = {x: Math.min(PLATE_W * 0.95, Math.max(PLATE_W * 0.05, q.x)), y: Math.min(PLATE_H * 0.95, Math.max(PLATE_H * 0.05, q.y))};
  let e = 1;
  const corners: Array<[number, number]> = [
    [-m, -m],
    [1920 + m, -m],
    [1920 + m, 1080 + m],
    [-m, 1080 + m],
  ];
  for (const [sx, sy] of corners) {
    const c = toPlate(sx, sy);
    if (c.x > PLATE_W) e = Math.max(e, (c.x - q0.x) / (PLATE_W - q0.x));
    if (c.x < 0) e = Math.max(e, (q0.x - c.x) / q0.x);
    if (c.y > PLATE_H) e = Math.max(e, (c.y - q0.y) / (PLATE_H - q0.y));
    if (c.y < 0) e = Math.max(e, (q0.y - c.y) / q0.y);
  }
  return {e, x: k.x + (q0.x - PLATE_W / 2) * S * (1 - e), y: k.y + (q0.y - PLATE_H / 2) * S * (1 - e)};
};

/** Plate px → stage px (before the stage camera) at a frame. Pass the Stage's view (and blur) to match its overscan. */
export const plateToStage = (frame: number, kb: KenBurns | undefined, px: number, py: number, view?: Pose, blur = 0): {x: number; y: number; scale: number} => {
  const k = kenBurnsAt(frame, kb);
  const c = plateCover(k, view, blur);
  const s = COVER * k.s * c.e;
  return {x: 960 + c.x + (px - PLATE_W / 2) * s, y: 540 + c.y + (py - PLATE_H / 2) * s, scale: s};
};

export const PhotoPlate: React.FC<{frame: number; view?: Pose} & PhotoOpts> = ({frame, plate, kb, blur = 0, dim = 0.12, tint = 0.25, children, floor = 0.35, view}) => {
  const k0 = kenBurnsAt(frame, kb);
  const cov = plateCover(k0, view, blur);
  const k = {s: k0.s * cov.e, x: cov.x, y: cov.y};
  const s = COVER * k.s;
  return (
    <AbsoluteFill style={{background: PAL.void}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: PLATE_W,
          height: PLATE_H,
          transformOrigin: '0 0',
          transform: `translate(${960 + k.x}px, ${540 + k.y}px) scale(${s}) translate(${-PLATE_W / 2}px, ${-PLATE_H / 2}px)`,
          filter: blur > 0 ? `blur(${blur / s}px)` : undefined,
        }}
      >
        <Img
          src={plateUrl(plate)}
          style={{position: 'absolute', left: 0, top: 0, width: PLATE_W, height: PLATE_H, filter: `brightness(${1 - dim}) contrast(1.08) saturate(0.94)`}}
        />
        <div style={{position: 'absolute', left: 0, top: 0, width: PLATE_W, height: PLATE_H, background: rgba('#0A1630', tint), mixBlendMode: 'multiply'}} />
        {children}
      </div>
      {floor > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: -2000,
            top: 0,
            width: 5920,
            height: 3080,
            background: `linear-gradient(180deg, rgba(4,7,14,0) 0px, rgba(4,7,14,0) 670px, rgba(4,7,14,${floor}) 1080px, rgba(4,7,14,${floor}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
