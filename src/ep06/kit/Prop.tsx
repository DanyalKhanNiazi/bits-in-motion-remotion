/**
 * Ep03 kit: <Prop>, a hero PNG asset with 2.5D life, and <SwapVariant> (a/b/c/d swaps hidden by a flash or a whip).
 *
 *   <Prop frame={frame} src="BIM129_T03_datacenter-gpu_a" x={960} y={560} w={1100} tiltX={10}
 *         enter={{kind: 'drop', at: 30}} rim={PAL.structure} sweep={{every: 120}} float={6}
 *         highlight={[{region: REGIONS.gpuA_hbm, at: 90}]} />
 *
 * (x, y) is the centre of the asset's VISIBLE content (its alpha box) in the parent's px; w (or h) is the visible
 * content's width (height). Overlays (children, highlight, spotlight) use NATIVE asset px, so measured regions apply.
 */
import React, {useId} from 'react';
import {Img} from 'remotion';
import {EASE, PAL, SPRING} from './look';
import {assetBox, assetUrl, type AssetName, type Region} from './assets';
import {DirBlurFilter, dirBlurStd} from './grade';
import {TAU, clamp01, lerp, num, prog, rgba, rnd, safeId, springAt, useImageReady, win, type Num} from './util';

export type Enter = {kind: 'rise' | 'pop' | 'slide' | 'drop' | 'fade' | 'zoom'; at: number; dur?: number; from?: 'left' | 'right' | 'up' | 'down'; dist?: number};
export type Exit = {kind: 'sink' | 'pop' | 'slide' | 'lift' | 'fade' | 'zoom'; at: number; dur?: number; to?: 'left' | 'right' | 'up' | 'down'; dist?: number};
export type Highlight = {region: Region | readonly Region[]; at: number; until?: number; color?: string; mode?: 'glow' | 'outline'; pulse?: boolean};
export type Spotlight = {region: Region | readonly Region[]; at: number; until?: number; dim?: number};
export type Sweep = {every?: number; at?: readonly number[]; dur?: number; color?: string; strength?: number; angle?: number; offset?: number};
export type Nudge = {dx?: number; dy?: number; s?: number; blurX?: number; blurY?: number; op?: number; bright?: number};

export type PropProps = {
  frame: number;
  src: AssetName;
  x: number;
  y: number;
  /** visible-content width in px (or give h) */
  w?: number;
  h?: number;
  rot?: Num;
  tiltX?: Num;
  tiltY?: Num;
  scale?: Num;
  enter?: Enter;
  exit?: Exit;
  /** contact shadow: opacity, or {opacity, dy, w}, or false */
  shadow?: number | false | {opacity?: number; dy?: number; w?: number};
  sweep?: Sweep | false;
  rim?: string | {color: string; strength?: number};
  /** gentle float amplitude in px */
  float?: number;
  /** depth blur in px */
  blur?: Num;
  brightness?: Num;
  opacity?: Num;
  highlight?: readonly Highlight[];
  spotlight?: Spotlight;
  /** extra offsets (used by SwapVariant; handy for custom moves) */
  nudge?: Nudge;
  /** overlay in native asset px (e.g. <ScreenSlot>) */
  children?: React.ReactNode;
  seed?: string;
  perspective?: number;
};

type XF = {dx: number; dy: number; s: number; sx: number; sy: number; rot: number; op: number; lift: number};
const XF0: XF = {dx: 0, dy: 0, s: 1, sx: 1, sy: 1, rot: 0, op: 1, lift: 0};
const dirSign = (d: string | undefined, dflt: 'left' | 'right' | 'up' | 'down'): [number, number] => {
  switch (d ?? dflt) {
    case 'left':
      return [-1, 0];
    case 'right':
      return [1, 0];
    case 'up':
      return [0, -1];
    default:
      return [0, 1];
  }
};

export const enterXf = (f: number, e?: Enter): XF => {
  if (!e) return XF0;
  const t = f - e.at;
  if (t < 0) return {...XF0, op: 0};
  switch (e.kind) {
    case 'rise': {
      const u = prog(f, e.at, e.dur ?? 24, EASE.arrive);
      return {...XF0, dy: (e.dist ?? 110) * (1 - u), s: 0.94 + 0.06 * u, op: prog(f, e.at, 9)};
    }
    case 'pop': {
      const sp = springAt(f, e.at, SPRING.pop);
      return {...XF0, s: Math.max(0, sp), op: clamp01(sp * 3)};
    }
    case 'slide': {
      const [sx, sy] = dirSign(e.from, 'left');
      const sp = springAt(f, e.at, SPRING.snap);
      const d = (e.dist ?? 900) * (1 - sp);
      return {...XF0, dx: sx * d, dy: sy * d, op: prog(f, e.at, 3)};
    }
    case 'drop': {
      const T = e.dur ?? 14;
      const dist = e.dist ?? 520;
      if (t < T) {
        const u = t / T;
        const dy = -dist * (1 - u * u);
        return {...XF0, dy, op: prog(f, e.at, 3), lift: -dy, sy: 1 + 0.04 * u, sx: 1 - 0.02 * u};
      }
      const tb = t - T;
      const k = Math.exp(-tb / 4) * Math.cos(tb * 0.75);
      const dy = -dist * 0.06 * Math.exp(-tb / 5) * Math.abs(Math.sin((tb * Math.PI) / 7));
      return {...XF0, dy, lift: -dy, sy: 1 - 0.07 * k, sx: 1 + 0.045 * k};
    }
    case 'zoom': {
      const u = prog(f, e.at, e.dur ?? 18, EASE.outExpo);
      return {...XF0, s: lerp(1.35, 1, u), op: prog(f, e.at, 8)};
    }
    default:
      return {...XF0, op: prog(f, e.at, e.dur ?? 12)};
  }
};

export const exitXf = (f: number, e?: Exit): XF => {
  if (!e || f < e.at) return XF0;
  const dur = e.dur ?? 12;
  switch (e.kind) {
    case 'sink': {
      const u = prog(f, e.at, dur, EASE.inCubic);
      return {...XF0, dy: (e.dist ?? 80) * u, op: 1 - u};
    }
    case 'pop': {
      const u = clamp01((f - e.at) / dur);
      const s = u < 0.3 ? 1 + 0.08 * (u / 0.3) : 1.08 * (1 - EASE.inCubic((u - 0.3) / 0.7));
      return {...XF0, s: Math.max(0, s), op: u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1};
    }
    case 'slide': {
      const [sx, sy] = dirSign(e.to, 'right');
      const u = prog(f, e.at, dur, EASE.inExpo);
      const d = (e.dist ?? 1100) * u;
      return {...XF0, dx: sx * d, dy: sy * d, op: 1 - prog(f, e.at + dur * 0.6, dur * 0.4)};
    }
    case 'lift': {
      const u = prog(f, e.at, dur, EASE.inCubic);
      return {...XF0, dy: -(e.dist ?? 140) * u, op: 1 - u, lift: (e.dist ?? 140) * u};
    }
    case 'zoom': {
      const u = prog(f, e.at, dur, EASE.inCubic);
      return {...XF0, s: lerp(1, 1.45, u), op: 1 - u};
    }
    default:
      return {...XF0, op: 1 - prog(f, e.at, dur)};
  }
};

const combine = (a: XF, b: XF): XF => ({
  dx: a.dx + b.dx,
  dy: a.dy + b.dy,
  s: a.s * b.s,
  sx: a.sx * b.sx,
  sy: a.sy * b.sy,
  rot: a.rot + b.rot,
  op: a.op * b.op,
  lift: a.lift + b.lift,
});

/** Placement → stage point for a native asset pixel (ignores rotation, tilt and animation). */
export const propScale = (src: AssetName, p: {w?: number; h?: number}): number => {
  const b = assetBox(src);
  return p.w !== undefined ? p.w / b.cw : p.h !== undefined ? p.h / b.ch : 1;
};
export const propPoint = (src: AssetName, p: {x: number; y: number; w?: number; h?: number}, ax: number, ay: number): {x: number; y: number} => {
  const b = assetBox(src);
  const k = propScale(src, p);
  return {x: p.x + (ax - b.cx) * k, y: p.y + (ay - b.cy) * k};
};
/** Centre of a region (native px). */
export const regionCenter = (r: Region): {x: number; y: number} => {
  if (r.shape === 'rect') return {x: r.x + r.w / 2, y: r.y + r.h / 2};
  if (r.shape === 'ellipse') return {x: r.cx, y: r.cy};
  const n = r.pts.length;
  return {x: r.pts.reduce((s, p) => s + p[0], 0) / n, y: r.pts.reduce((s, p) => s + p[1], 0) / n};
};
/** Visible-content rectangle of a placed prop (stage px). */
export const propRect = (src: AssetName, p: {x: number; y: number; w?: number; h?: number}) => {
  const b = assetBox(src);
  const k = propScale(src, p);
  return {x0: p.x - (b.cw * k) / 2, y0: p.y - (b.ch * k) / 2, x1: p.x + (b.cw * k) / 2, y1: p.y + (b.ch * k) / 2, w: b.cw * k, h: b.ch * k};
};

const asArr = (r: Region | readonly Region[]): readonly Region[] => (Array.isArray(r) ? (r as readonly Region[]) : [r as Region]);
type ShapeAttrs = Omit<React.SVGAttributes<SVGElement>, keyof React.DOMAttributes<SVGElement>>;
export const RegionShape: React.FC<{region: Region} & ShapeAttrs> = ({region: r, ...p}) => {
  if (r.shape === 'rect') return <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={r.r ?? 8} {...p} />;
  if (r.shape === 'ellipse') return <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} {...p} />;
  return <polygon points={r.pts.map((q) => q.join(',')).join(' ')} {...p} />;
};

const sweepPhase = (f: number, sw: Sweep): number | null => {
  const dur = sw.dur ?? 34;
  if (sw.at && sw.at.length) {
    for (const a of sw.at) {
      const p = (f - a) / dur;
      if (p >= 0 && p <= 1) return p;
    }
    return null;
  }
  const every = sw.every ?? 150;
  const p = ((((f - (sw.offset ?? 20)) % every) + every) % every) / dur;
  return p <= 1 ? p : null;
};

export const Prop: React.FC<PropProps> = (props) => {
  const {frame: f, src, x, y, enter, exit, shadow = 0.5, sweep, rim, float = 0, highlight, spotlight, nudge, children, seed = src, perspective = 1800} = props;
  const uid = safeId(useId());
  const url = assetUrl(src);
  useImageReady(sweep ? url : null);
  const b = assetBox(src);
  const k = propScale(src, props);
  const ph = rnd(`float-${seed}`);
  const xfAt = (fr: number): XF => {
    const base = combine(enterXf(fr, enter), exitXf(fr, exit));
    const fl = float ? float * Math.sin(TAU * (fr / 150 + ph)) : 0;
    return {
      ...base,
      dx: base.dx + (nudge?.dx ?? 0),
      dy: base.dy + fl + (nudge?.dy ?? 0),
      s: base.s * num(props.scale, fr, 1) * (nudge?.s ?? 1),
      rot: base.rot + num(props.rot, fr, 0) + (float ? (float / 12) * 0.5 * Math.sin(TAU * (fr / 230 + ph)) : 0),
      op: base.op * num(props.opacity, fr, 1) * (nudge?.op ?? 1),
      lift: base.lift + Math.max(0, -fl) * 0.5,
    };
  };
  const xf = xfAt(f);
  if (xf.op <= 0.001) return null;
  const pv = xfAt(f - 1);
  const std = dirBlurStd((xf.dx - pv.dx) + (nudge?.blurX ?? 0), (xf.dy - pv.dy) + (nudge?.blurY ?? 0), 0.42, 40);
  const depth = num(props.blur, f, 0);
  const tiltX = num(props.tiltX, f, 0);
  const tiltY = num(props.tiltY, f, 0);
  const bright = num(props.brightness, f, 1) * (nudge?.bright ?? 1);
  const W = b.w * k;
  const Hh = b.h * k;
  const rimC = typeof rim === 'string' ? rim : rim?.color;
  const rimS = typeof rim === 'object' ? (rim.strength ?? 1) : 1;
  const spotW = spotlight ? win(f, spotlight.at, spotlight.until, 8, 8) : 0;
  const imgFilter = [
    bright !== 1 || spotW > 0 ? `brightness(${bright * (1 - (spotlight?.dim ?? 0.55) * spotW)})` : '',
    rimC ? `drop-shadow(0 0 ${2}px ${rgba(rimC, 0.85 * rimS)}) drop-shadow(0 0 ${18}px ${rgba(rimC, 0.42 * rimS)})` : '',
  ]
    .filter(Boolean)
    .join(' ');
  const sh = shadow === false ? null : typeof shadow === 'number' ? {opacity: shadow} : shadow;
  const sp = sweep ? sweepPhase(f, sweep) : null;
  const mbId = `${uid}-mb`;
  const clipId = `${uid}-clip`;
  const hlBlurId = `${uid}-hlb`;
  const cssFilter = [depth > 0.05 ? `blur(${depth}px)` : '', std ? `url(#${mbId})` : ''].filter(Boolean).join(' ');
  const shW = b.cw * k * (sh?.w ?? 0.82) * (1 + xf.lift / 900);
  const shH = Math.max(16, b.cw * k * 0.075);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          {std ? <DirBlurFilter id={mbId} std={std} /> : null}
          {spotlight ? (
            <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
              {asArr(spotlight.region).map((r, i) => (
                <RegionShape key={i} region={r} />
              ))}
            </clipPath>
          ) : null}
        </defs>
      </svg>
      {sh ? (
        <div
          style={{
            position: 'absolute',
            left: xf.dx - shW / 2,
            top: (b.y1 - b.cy) * k * xf.s - shH * 0.55 + (sh.dy ?? 0),
            width: shW,
            height: shH,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0.35) 55%, rgba(0,0,0,0))',
            opacity: (sh.opacity ?? 0.5) * xf.op * clamp01(1 - xf.lift / 420),
            filter: 'blur(6px)',
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${xf.dx}px, ${xf.dy}px) rotate(${xf.rot}deg) scale(${xf.s * xf.sx}, ${xf.s * xf.sy})`,
          transformOrigin: `0px ${(b.y1 - b.cy) * k}px`,
          opacity: xf.op,
          filter: cssFilter || undefined,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: -b.cx * k,
            top: -b.cy * k,
            width: W,
            height: Hh,
            transformOrigin: `${b.cx * k}px ${b.cy * k}px`,
            transform: tiltX || tiltY ? `perspective(${perspective}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` : undefined,
          }}
        >
          <Img src={url} style={{position: 'absolute', left: 0, top: 0, width: W, height: Hh, filter: imgFilter || undefined}} />
          {sp !== null && sweep ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: W,
                height: Hh,
                background: `linear-gradient(${sweep.angle ?? 112}deg, rgba(255,255,255,0) ${lerp(-30, 110, sp) - 13}%, ${rgba(sweep.color ?? '#FFFFFF', (sweep.strength ?? 0.6) * Math.sin(Math.PI * sp))} ${lerp(-30, 110, sp)}%, rgba(255,255,255,0) ${lerp(-30, 110, sp) + 13}%)`,
                WebkitMaskImage: `url(${url})`,
                maskImage: `url(${url})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
          <div style={{position: 'absolute', left: 0, top: 0, width: b.w, height: b.h, transform: `scale(${k})`, transformOrigin: '0 0'}}>
            {spotlight && spotW > 0 ? (
              <Img
                src={url}
                style={{position: 'absolute', left: 0, top: 0, width: b.w, height: b.h, clipPath: `url(#${clipId})`, opacity: spotW, filter: `brightness(${1.12 * bright})`}}
              />
            ) : null}
            {children}
            {highlight && highlight.length ? (
              <svg width={b.w} height={b.h} viewBox={`0 0 ${b.w} ${b.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                <defs>
                  <filter id={hlBlurId} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation={7 / k} />
                  </filter>
                </defs>
                {highlight.map((h, i) => {
                  const wv = win(f, h.at, h.until, 6, 8);
                  if (wv <= 0) return null;
                  const c = h.color ?? PAL.structure;
                  const pulse = h.pulse === false ? 1 : 0.72 + 0.28 * Math.cos((TAU * (f - h.at)) / 46);
                  const draw = prog(f, h.at, 14, EASE.out);
                  return (
                    <g key={i} opacity={wv}>
                      {asArr(h.region).map((r, j) => (
                        <g key={j}>
                          {h.mode !== 'outline' ? (
                            <>
                              <RegionShape region={r} fill={rgba(c, 0.2 * pulse)} />
                              <RegionShape region={r} fill="none" stroke={c} strokeOpacity={0.75 * pulse} strokeWidth={12 / k} filter={`url(#${hlBlurId})`} />
                            </>
                          ) : null}
                          <RegionShape
                            region={r}
                            fill="none"
                            stroke={h.mode === 'outline' ? c : PAL.ink}
                            strokeWidth={4}
                            vectorEffect="non-scaling-stroke"
                            strokeLinejoin="round"
                            pathLength={1}
                            strokeDasharray="1 1"
                            strokeDashoffset={1 - draw}
                          />
                        </g>
                      ))}
                    </g>
                  );
                })}
              </svg>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Swap between asset variants (a/b/c/d). Each swap is hidden by a flash (light bloom + scale punch) or a whip
 * (the old variant whips out, the new one whips in from the other side, with motion blur).
 */
export const SwapVariant: React.FC<Omit<PropProps, 'src' | 'nudge'> & {srcs: readonly AssetName[]; swaps: readonly number[]; via?: 'flash' | 'whip'; dir?: 1 | -1}> = ({
  srcs,
  swaps,
  via = 'flash',
  dir = 1,
  ...p
}) => {
  const f = p.frame;
  let i = 0;
  for (const s of swaps) if (f >= s) i++;
  i = Math.min(i, srcs.length - 1);
  const s = swaps.length ? swaps.reduce((best, v) => (Math.abs(v - f) < Math.abs(best - f) ? v : best), swaps[0]) : -1e9;
  const d = f - s;
  const box = propRect(srcs[i], p);
  if (via === 'whip' && Math.abs(d) <= 7) {
    const dist = 1400;
    if (d < 0) {
      const u = EASE.inExpo(clamp01((d + 7) / 7));
      const uP = EASE.inExpo(clamp01((d + 6) / 7));
      return <Prop {...p} src={srcs[Math.max(0, i)]} enter={undefined} nudge={{dx: -dir * dist * u, blurX: -dir * dist * (uP - u)}} />;
    }
    const u = EASE.outExpo(clamp01(d / 7));
    const uP = EASE.outExpo(clamp01((d - 1) / 7));
    return <Prop {...p} src={srcs[i]} enter={undefined} nudge={{dx: dir * dist * (1 - u), blurX: dir * dist * (u - uP)}} />;
  }
  const flash = via === 'flash' && d > -4 && d < 14 ? (d < 0 ? Math.exp(-((d / 2.2) ** 2)) : Math.exp(-d / 3.2)) : 0;
  const punch = via === 'flash' && d >= 0 && d < 20 ? 1 + 0.05 * Math.exp(-d / 4) * Math.cos(d * 0.6) : 1;
  return (
    <>
      <Prop {...p} src={srcs[i]} nudge={{s: punch, bright: 1 + flash * 0.9}} />
      {flash > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: p.x - box.w * 0.75,
            top: p.y - box.h * 0.75,
            width: box.w * 1.5,
            height: box.h * 1.5,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, rgba(255,255,255,${0.95 * flash}), rgba(195,204,221,${0.45 * flash}) 38%, rgba(143,156,181,0) 100%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </>
  );
};
