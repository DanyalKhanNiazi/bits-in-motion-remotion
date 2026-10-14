/**
 * S5 · the Bridge set built from the real renders: the HBM stack (BIM139) is the memory bank, the compute die
 * (BIM141, the same macro as "the math happens here") is the far bank, and a glass-and-steel deck with emissive
 * lanes joins them. Crates of weights (Crate3D) cross the deck. Everything is in world px inside a <Stage>.
 */
import React, {useId} from 'react';
import {Img} from 'remotion';
import {EASE, PAL, Prop, TAU, assetUrl, clamp01, lerp, mixHex, num, nz, prog, propPoint, quadMatrix, rgba, rnd, safeId, smooth, type Num} from '../../kit';
import {Crate3D} from './parts';

/* ---------------------------------------------------------------- layout (world px) */
export const STACK_SRC = 'BIM139_T03_hbm-stack_c' as const;
export const DIE_SRC = 'BIM141_T03_compute-cache_a' as const;
export const STACK = {x: 470, y: 585, w: 600};
export const DIE = {x: 1440, y: 700, w: 800};
const sp = (nx: number, ny: number) => propPoint(STACK_SRC, STACK, nx, ny);
const dp = (nx: number, ny: number) => propPoint(DIE_SRC, DIE, nx, ny);
/** deck ends: the stack's front-right face and the die's left frame */
export const DA = {x: 646, y: 628};
export const DB = {x: 1156, y: 724};
/** width axis (screen), matches the renders' receding axis (−30°) */
const VX = Math.cos((-30 * Math.PI) / 180);
const VY = Math.sin((-30 * Math.PI) / 180);
export const ANCH = {
  memTop: sp(625, 426),
  memFace: sp(960, 700),
  mathC: dp(657, 491),
  dieTop: dp(805, 120),
  deckMid: {x: (DA.x + DB.x) / 2, y: (DA.y + DB.y) / 2},
};
export const deckAt = (t: number) => ({x: lerp(DA.x, DB.x, t), y: lerp(DA.y, DB.y, t)});
/** compute grid on the die (native px) */
export const COMPUTE_Q = [
  [268, 330],
  [848, 188],
  [1072, 640],
  [440, 805],
] as const;
const quadM = (w: number, h: number, q: readonly (readonly [number, number])[]) => quadMatrix(w, h, q as unknown as Parameters<typeof quadMatrix>[2]);

/* ---------------------------------------------------------------- math cells on a die quad */
export const MathCells: React.FC<{frame: number; quad?: readonly (readonly [number, number])[]; on: number; rush?: number; idle?: number; waves?: readonly number[]; from?: number}> = ({
  frame,
  quad = COMPUTE_Q,
  on,
  rush = 0,
  idle = 0,
  waves = [],
  from = 0,
}) => {
  if (on <= 0.01) return null;
  const cols = 9;
  const rows = 6;
  const BW = 900;
  const BH = 600;
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const v = Math.max(0, nz(`mc${i}`, frame * (0.06 + 0.2 * rush), i * 0.3)) * 1.3;
      let wv = 0;
      for (const a of waves) {
        const age = frame - a;
        if (age < 0 || age > 50) continue;
        const front = age * 0.5;
        const d = c - front + (r % 2) * 0.3;
        wv += Math.exp(-(d * d) / 1.6) * Math.exp(-age / 26);
      }
      const ambient = Math.exp(-(((c - ((frame - from) * 0.35) % 14) + 2) ** 2) / 3) * 0.6;
      let b = (0.15 + 0.85 * v + ambient) * on + rush * 0.5 + 1.1 * wv;
      b *= 1 - 0.85 * idle;
      if (idle > 0 && (i === 13 || i === 40)) b += idle * 0.35 * Math.max(0, Math.sin((TAU * (frame + i * 13)) / 70));
      b = clamp01(b);
      cells.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (c * BW) / cols + 6,
            top: (r * BH) / rows + 6,
            width: BW / cols - 12,
            height: BH / rows - 12,
            borderRadius: 6,
            background: rgba(mixHex(PAL.info, '#FFFFFF', 0.3 * b), 0.1 + 0.62 * b),
            boxShadow: `0 0 ${10 + 22 * b}px ${rgba(PAL.info, 0.6 * b)}`,
          }}
        />,
      );
    }
  const br = 0.45 + 0.35 * Math.sin((TAU * frame) / 60);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: BW, height: BH, transformOrigin: '0 0', transform: quadM(BW, BH, quad), mixBlendMode: 'screen'}}>
      {cells}
      {idle > 0.02 ? <div style={{position: 'absolute', inset: -14, borderRadius: 14, border: `8px solid ${rgba(PAL.wait, idle * br)}`, boxShadow: `0 0 30px ${rgba(PAL.wait, 0.6 * idle * br)}`}} /> : null}
    </div>
  );
};

/** Soft light shafts (screen blend, low alpha). */
export const GodRays: React.FC<{frame: number; x: number; y: number; on: number; reach?: number}> = ({frame, x, y, on, reach = 900}) => {
  if (on <= 0.01) return null;
  const rot = 168 + 6 * Math.sin(frame / 90);
  const cx = x + 400;
  const cy = y + 300;
  const mask = `radial-gradient(ellipse ${reach}px ${Math.round(reach * 0.85)}px at ${cx}px ${cy + reach * 0.5}px, rgba(0,0,0,1), rgba(0,0,0,0) 75%)`;
  return (
    <div
      style={{
        position: 'absolute',
        left: -400,
        top: -300,
        width: 2720,
        height: 1680,
        opacity: 0.6 * on,
        mixBlendMode: 'screen',
        background: `repeating-conic-gradient(from ${rot}deg at ${cx}px ${cy}px, rgba(156,200,255,0) 0deg, rgba(156,200,255,0.17) 3deg, rgba(156,200,255,0) 7deg, rgba(156,200,255,0) 13deg)`,
        WebkitMaskImage: mask,
        maskImage: mask,
        filter: 'blur(10px)',
      }}
    />
  );
};

/* ---------------------------------------------------------------- the set */
export type ABProps = {
  frame: number;
  /** the deck draws itself over [at, at + dur] (rails, glass, lanes) */
  build?: {at: number; dur: number};
  /** the banks fade up from the haze (0..1 tracks) */
  stackIn?: Num;
  dieIn?: Num;
  /** deck width 0..1 (1 = wide, 0.3 = narrow) */
  bw?: Num;
  rate?: number;
  travel?: number;
  flowFrom?: number;
  flowUntil?: number;
  /** a big stamped crate */
  hero?: {at: number; dur?: number; label?: string};
  /** hero crate size relative to a regular crate */
  heroScale?: number;
  stamp?: string;
  math?: Num;
  idle?: Num;
  /** streak speed multiplier */
  speed?: number;
  rays?: Num;
  /** camera-like tilt of the whole set (deg) for crane moves */
  tilt?: Num;
  /** extra glow on the stack (memory) / die (math) */
  memGlow?: Num;
};

type CrateDraw = {t: number; w: number; op: number; hero: boolean; flash: number};

export const crateSchedule = (p: ABProps, f: number) => {
  const crates: CrateDraw[] = [];
  const arrivals: number[] = [];
  const travel = p.travel ?? 34;
  if (p.rate && p.flowFrom !== undefined) {
    const P = 30 / p.rate;
    const kMin = Math.max(0, Math.floor((f - travel - 10 - p.flowFrom) / P));
    const kMax = Math.floor((f - p.flowFrom) / P);
    for (let k = kMin; k <= kMax; k++) {
      const s0 = p.flowFrom + k * P;
      if (s0 > (p.flowUntil ?? 1e12)) break;
      const age = f - s0;
      if (age < 0) continue;
      const u = age / travel;
      if (u <= 1.12) crates.push({t: Math.min(1, 0.85 * u + 0.15 * smooth(u)), w: 1, op: clamp01(age / 4) * (u > 1 ? 1 - (u - 1) / 0.12 : 1), hero: false, flash: u > 0.96 ? Math.max(0, 1 - Math.abs(u - 1.02) / 0.08) : 0});
    }
    for (let k = Math.max(0, Math.floor((f - 60 - travel - p.flowFrom) / P)); k <= kMax; k++) {
      const a = p.flowFrom + k * P + travel;
      if (p.flowFrom + k * P <= (p.flowUntil ?? 1e12) && a <= f) arrivals.push(a);
    }
  }
  if (p.hero) {
    const dur = p.hero.dur ?? 44;
    const age = f - p.hero.at;
    const u = age / dur;
    if (u >= 0 && u <= 1.15) crates.push({t: Math.min(1, Math.pow(Math.min(1, u), 1.6)), w: p.heroScale ?? 2.05, op: clamp01(age / 4) * (u > 1 ? 1 - (u - 1) / 0.15 : 1), hero: true, flash: u > 0.95 ? Math.max(0, 1 - Math.abs(u - 1.02) / 0.1) : 0});
    if (f >= p.hero.at + dur) arrivals.push(p.hero.at + dur);
  }
  return {crates, arrivals};
};

export const AssetBridge: React.FC<ABProps> = (p) => {
  const f = p.frame;
  const uid = safeId(useId());
  const bw = clamp01(num(p.bw, f, 1));
  const B = p.build ? prog(f, p.build.at, p.build.dur) : 1;
  const rails = EASE.inOut(clamp01((B - 0.08) / 0.62));
  const glass = EASE.out(clamp01((B - 0.4) / 0.5));
  const lanesOn = clamp01((B - 0.82) / 0.18);
  const stackIn = clamp01(num(p.stackIn, f, 1));
  const dieIn = clamp01(num(p.dieIn, f, 1));
  const math = clamp01(num(p.math, f, 0.75));
  const idle = clamp01(num(p.idle, f, 0));
  const rays = clamp01(num(p.rays, f, 0));
  const tilt = num(p.tilt, f, 0);
  const memGlow = clamp01(num(p.memGlow, f, 0));
  const hwA = lerp(18, 50, bw);
  const hwB = hwA * 1.22;
  const nL = bw > 0.62 ? 3 : bw > 0.36 ? 2 : 1;
  const {crates, arrivals} = crateSchedule(p, f);
  // deck geometry
  const at = (t: number, s: number) => {
    const c = deckAt(t);
    const hw = lerp(hwA, hwB, t);
    return {x: c.x + VX * hw * s, y: c.y + VY * hw * s};
  };
  const xr = Math.max(0.0001, rails);
  const pts = (t0: number, t1: number, s0: number, s1: number) => {
    const a = at(t0, s0);
    const b = at(t1, s0);
    const c = at(t1, s1);
    const d = at(t0, s1);
    return `M${a.x} ${a.y} L${b.x} ${b.y} L${c.x} ${c.y} L${d.x} ${d.y} Z`;
  };
  const line = (t0: number, t1: number, s: number) => {
    const a = at(t0, s);
    const b = at(t1, s);
    return {x1: a.x, y1: a.y, x2: b.x, y2: b.y};
  };
  const dockPulse = (() => {
    let v = 0;
    if (p.rate && p.flowFrom !== undefined) {
      const P = 30 / p.rate;
      const k = Math.floor((f - p.flowFrom) / P);
      for (const kk of [k, k + 1]) {
        const s0 = p.flowFrom + kk * P;
        if (kk < 0 || s0 > (p.flowUntil ?? 1e12)) continue;
        v += Math.exp(-((f - s0) ** 2) / 20);
      }
    }
    if (p.hero) v += Math.exp(-((f - p.hero.at) ** 2) / 30) * 1.5;
    return clamp01(v);
  })();
  const arrFlash = arrivals.reduce((m, a) => Math.max(m, f >= a ? Math.exp(-(f - a) / 6) : 0), 0);
  const glowK = 0.5 + 0.5 * bw;
  // streaks
  const streaks: React.ReactNode[] = [];
  if (lanesOn > 0) {
    for (let l = 0; l < nL; l++) {
      const s = nL === 1 ? 0 : lerp(-0.62, 0.62, l / (nL - 1));
      for (let j = 0; j < 5; j++) {
        const ph = rnd(`ab-st-${l}-${j}`);
        const t0 = (((f * 0.024 * (p.speed ?? 1) * (0.8 + 0.4 * ph) + ph * 3 + j * 0.21) % 1) + 1) % 1;
        const t1 = Math.min(1, t0 + 0.09);
        const L = line(t0, t1, s);
        streaks.push(<line key={`${l}-${j}`} {...L} stroke={PAL.infoPale} strokeWidth={3} strokeLinecap="round" opacity={(0.35 + 0.45 * ph) * lanesOn} />);
      }
    }
  }
  // pylons (under the near edge)
  const pylon = (t: number, len: number) => {
    const top = at(t, -0.9);
    return (
      <g key={`py${t}`} opacity={rails}>
        <rect x={top.x - 9} y={top.y + 10} width={18} height={len} fill="#141D30" />
        <rect x={top.x - 2} y={top.y + 18} width={4} height={len - 16} fill={PAL.info} opacity={0.75} />
        <ellipse cx={top.x} cy={top.y + 10 + len} rx={46} ry={11} fill={PAL.info} opacity={0.22} />
      </g>
    );
  };
  const sorted = [...crates].sort((a, b) => a.t - b.t);
  const stackRead = clamp01(dockPulse * 0.8 + memGlow);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '960px 640px', transform: tilt ? `perspective(2400px) rotateX(${tilt}deg)` : undefined}}>
      {/* back light and horizon haze */}
      <div style={{position: 'absolute', left: -500, top: -300, width: 2920, height: 1500, background: `radial-gradient(ellipse 900px 520px at 1400px 720px, ${rgba('#1E5A9C', 0.42)}, ${rgba('#163C70', 0.18)} 50%, rgba(10,24,48,0))`}} />
      <div style={{position: 'absolute', left: -600, top: 420, width: 3120, height: 360, background: `linear-gradient(180deg, rgba(10,24,48,0), ${rgba('#123060', 0.45)} 45%, rgba(10,24,48,0))`}} />
      {/* far banks in the haze */}
      {[
        {x: 70, y: 600, w: 170, s: STACK_SRC},
        {x: 860, y: 560, w: 120, s: STACK_SRC},
        {x: 1180, y: 552, w: 105, s: DIE_SRC},
        {x: 1880, y: 590, w: 190, s: STACK_SRC},
        {x: -300, y: 570, w: 140, s: DIE_SRC},
      ].map((g, i) => (
        <Img
          key={i}
          src={assetUrl(g.s)}
          style={{position: 'absolute', left: g.x - g.w * 0.62, top: g.y - g.w * 0.5, width: g.w * 1.24, opacity: 0.34, filter: `brightness(0.4) saturate(0.6) blur(${3.5 + (i % 2)}px)`}}
        />
      ))}
      {/* floor underglow below the deck */}
      <div style={{position: 'absolute', left: 560, top: 800, width: 760, height: 170, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.info, 0.22 * glowK * rails)}, rgba(0,0,0,0))`, filter: 'blur(6px)'}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {pylon(0.3, 200)}
        {pylon(0.68, 232)}
      </svg>
      {/* the banks */}
      <Prop
        frame={f}
        src={STACK_SRC}
        {...STACK}
        brightness={lerp(0.25, 1, stackIn) * (1 + 0.25 * stackRead)}
        opacity={stackIn > 0 ? 1 : 0}
        rim={{color: PAL.info, strength: 0.35 + 0.4 * stackRead}}
        shadow={0.65}
        sweep={{every: 150, offset: 40, dur: 34, strength: 0.5}}
      >
        {/* memory read: a scan band down the front-right face */}
        {stackRead > 0.02 ? (
          <svg width={1254} height={1254} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', mixBlendMode: 'screen'}}>
            {(() => {
              const s = ((f * 0.02) % 1) * 0.8 + 0.1;
              const top = (q: number) => [lerp(736, 1184, q), lerp(lerp(640, 1060, s - 0.08), lerp(384, 780, s - 0.08), q)];
              const bot = (q: number) => [lerp(736, 1184, q), lerp(lerp(640, 1060, s + 0.08), lerp(384, 780, s + 0.08), q)];
              const d = `M${top(0).join(' ')} L${top(1).join(' ')} L${bot(1).join(' ')} L${bot(0).join(' ')} Z`;
              return <path d={d} fill={PAL.info} opacity={0.32 * stackRead} />;
            })()}
          </svg>
        ) : null}
      </Prop>
      <Prop frame={f} src={DIE_SRC} {...DIE} brightness={lerp(0.25, 1, dieIn) * (1 + 0.15 * arrFlash)} opacity={dieIn > 0 ? 1 : 0} rim={{color: '#9CC8FF', strength: 0.3}} shadow={0.6} sweep={{every: 170, offset: 90, dur: 34, strength: 0.45}}>
        <MathCells frame={f} on={math * dieIn} idle={idle} waves={arrivals} />
      </Prop>
      {/* the deck */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`${uid}-gl`} gradientUnits="userSpaceOnUse" x1={at(0.5, -1).x} y1={at(0.5, -1).y} x2={at(0.5, 1).x} y2={at(0.5, 1).y}>
            <stop offset="0" stopColor={PAL.info} stopOpacity={0.42} />
            <stop offset="0.5" stopColor="#0B3A55" stopOpacity={0.55} />
            <stop offset="1" stopColor={PAL.info} stopOpacity={0.3} />
          </linearGradient>
          <linearGradient id={`${uid}-st`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8E9AAE" />
            <stop offset="0.35" stopColor="#3A475F" />
            <stop offset="1" stopColor="#121A2B" />
          </linearGradient>
          <filter id={`${uid}-bl`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={7} />
          </filter>
        </defs>
        {/* far rail */}
        <line {...line(0, xr, 1)} stroke="#E4FDFF" strokeWidth={2.5} strokeLinecap="round" opacity={rails} />
        <line {...line(0, xr, 1)} stroke={PAL.info} strokeWidth={10} strokeLinecap="round" opacity={0.55 * glowK * rails} filter={`url(#${uid}-bl)`} />
        {/* glass deck and its underglow */}
        {glass > 0 ? (
          <>
            <path d={pts(0, glass * xr, -1, 1)} fill={`url(#${uid}-gl)`} opacity={0.95} />
            <path d={pts(0, glass * xr, -1, 1)} fill={PAL.info} opacity={0.18 * glowK} filter={`url(#${uid}-bl)`} />
            {/* sheen travelling along the glass */}
            {(() => {
              const s0 = ((f * 0.012) % 1.4) - 0.2;
              return s0 > 0 && s0 < glass ? <path d={pts(Math.max(0, s0 - 0.05), Math.min(glass, s0 + 0.05), -1, 1)} fill="#FFFFFF" opacity={0.12} /> : null;
            })()}
          </>
        ) : null}
        {/* lane dividers */}
        {lanesOn > 0 && nL > 1
          ? Array.from({length: nL - 1}, (_, i) => {
              const s = lerp(-1, 1, (i + 1) / nL);
              return <line key={i} {...line(0, 1, s)} stroke={PAL.info} strokeWidth={2} strokeDasharray="14 12" strokeDashoffset={-f * 3 * (p.speed ?? 1)} opacity={0.55 * lanesOn} />;
            })
          : null}
        <g>{streaks}</g>
      </svg>
      {/* crates, far (dock) to near (die) */}
      {sorted.map((c, i) => {
        const pos = deckAt(c.t);
        const w = lerp(90, 114, c.t) * c.w * lerp(0.6, 1, bw);
        const s = c.t > 0.96 ? lerp(1, 0.55, (c.t - 0.96) / 0.04) : 1;
        return (
          <React.Fragment key={i}>
            <Crate3D frame={f} x={pos.x + VX * 2} y={pos.y - 0.27 * w * s} w={w * s} label={c.hero ? (p.hero?.label ?? p.stamp) : p.stamp} opacity={c.op} glow={0.8} />
            {c.flash > 0.02 ? <div style={{position: 'absolute', left: pos.x - 90, top: pos.y - 90, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(255,255,255,${0.8 * c.flash}), ${rgba(PAL.info, 0.5 * c.flash)} 45%, rgba(0,0,0,0))`, mixBlendMode: 'screen'}} /> : null}
          </React.Fragment>
        );
      })}
      {/* near rail and the steel edge */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {rails > 0 ? (
          <>
            <path
              d={(() => {
                const a = at(0, -1);
                const b = at(xr, -1);
                return `M${a.x} ${a.y} L${b.x} ${b.y} L${b.x} ${b.y + 15} L${a.x} ${a.y + 13} Z`;
              })()}
              fill={`url(#${uid}-st)`}
            />
            <line {...line(0, xr, -1)} stroke={PAL.info} strokeWidth={14} strokeLinecap="round" opacity={0.75 * glowK} filter={`url(#${uid}-bl)`} />
            <line {...line(0, xr, -1)} stroke="#F2FEFF" strokeWidth={3.5} strokeLinecap="round" />
            {/* the leading spark while the deck draws */}
            {rails < 1 ? (
              <circle cx={at(xr, 0).x} cy={at(xr, 0).y} r={26} fill="#FFFFFF" opacity={0.85} filter={`url(#${uid}-bl)`} />
            ) : null}
          </>
        ) : null}
        {/* the dock on the memory face */}
        <ellipse cx={DA.x} cy={DA.y} rx={hwA * 1.6} ry={hwA * 1.1} fill={PAL.info} opacity={(0.18 + 0.55 * dockPulse) * stackIn} filter={`url(#${uid}-bl)`} />
      </svg>
      <GodRays frame={f} x={1000} y={-160} on={rays} reach={1000} />
    </div>
  );
};

/** World anchors for labels at a given bandwidth (deck edge points). */
export const deckEdge = (t: number, s: number, bw = 1) => {
  const hwA = lerp(18, 50, clamp01(bw));
  const hw = lerp(hwA, hwA * 1.22, t);
  const c = deckAt(t);
  return {x: c.x + VX * hw * s, y: c.y + VY * hw * s};
};
