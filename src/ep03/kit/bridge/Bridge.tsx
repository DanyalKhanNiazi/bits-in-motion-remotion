/**
 * Ep03 kit: <Bridge>, the film's governing metaphor. An HBM memory tower (left) joined to the compute die's math
 * units (right) by a glass bridge; crates of weights (small stacks of weight tiles) cross it for every token.
 * The look is S5's real-asset set: the tower is textured from the HBM-stack render (BIM139), the die face is the
 * compute-cache render (BIM142), the deck is glass and steel, with far banks in the haze and god rays. The geometry is
 * true 3D (own projector), so 'threeQuarter' has real depth and the camera can orbit and push.
 *
 *   <Stage frame={frame} env="none" drift={0}>
 *     <Bridge frame={frame} view="side" framing="wide" bandwidth={0.8} crateRate={3} crateLabel="≈16 GB" mathActivity={0.9} />
 *   </Stage>
 *
 * Animate the camera with cam={[{f: 0, cam: 'wide'}, {f: 90, cam: 'crates', dur: 40}]} (presets per view, or a Cam3).
 * bridgeAnchors() gives screen points (tower, dock, bridge, die, cache, power) for <Label to={…}>.
 */
import React, {useId} from 'react';
import {Img} from 'remotion';
import {noise2D} from '@remotion/noise';
import {EASE, PAL, SANS} from '../look';
import {Rich} from '../glyphs';
import {ASSET_INFO, assetBox, assetUrl, type AssetName} from '../assets';
import {Crate} from './Crate';
import {TAU, clamp, clamp01, lerp, mixHex, num, prog, quadToQuadMatrix, rgba, rnd, rr, safeId, shadeHex, smooth, type EaseFn, type Num} from '../util';
import {
  basis,
  boxCorners,
  facePoint,
  faceQuad,
  hull,
  lerpCam,
  lightOf,
  polyD,
  polyPts,
  project,
  pxPerUnit,
  seg,
  toCam,
  visibleFaces,
  type Basis,
  type Box,
  type Cam3,
  type Face,
  type V3,
} from './geom';

/* ---------------------------------------------------------------- the set */
export const SET = {
  tower: {x0: -8.3, x1: -4.7, z0: -1.8, z1: 1.8, base: 0.42, layers: 8, layerH: 0.54, gap: 0.1, lid: 0.36},
  die: {x0: 4.0, x1: 9.2, z0: -2.0, z1: 2.0, h: 4.75},
  deckY: 2.75,
  deckT: 0.16,
} as const;
const T = SET.tower;
const TOWER_H = T.base + T.layers * T.layerH + (T.layers - 1) * T.gap + T.lid;
const TX = (T.x0 + T.x1) / 2;
const DIEX = SET.die;
/**
 * Die-face layout (face u from the die's left edge, v up from the floor; [u0, v0, u1, v1]). The BIM142 die render
 * fills `tex`; `grid` and `cache` are its compute tiles (6 × 5) and gold cache measured on the render; the amber power
 * gauge sits on the plinth below the die.
 */
const FACE = {
  tex: [0, 0.85, 5.2, 4.7],
  frame: [0.23, 1.07, 4.95, 4.52],
  grid: [0.73, 1.65, 3.52, 4.17],
  cols: 6,
  rows: 5,
  cache: [3.7, 2.01, 4.37, 3.21],
  power: [0.75, 0.16, 4.75, 0.46],
} as const;

export type BridgeView = 'side' | 'threeQuarter';
export type BridgeFraming = 'wide' | 'crates' | 'die' | 'tower';
export const BRIDGE_CAMS: Record<BridgeView, Record<BridgeFraming, Cam3>> = {
  side: {
    wide: {tx: 0.45, ty: 2.8, tz: 0, yaw: 0, pitch: 16, dist: 23.5, fov: 30},
    crates: {tx: -0.2, ty: 3.0, tz: 0.4, yaw: -10, pitch: 15, dist: 8.6, fov: 30},
    die: {tx: 6.4, ty: 2.7, tz: 1.8, yaw: 9, pitch: 5, dist: 9.6, fov: 30},
    tower: {tx: -5.6, ty: 3.0, tz: 1.0, yaw: -12, pitch: 8, dist: 10, fov: 30},
  },
  threeQuarter: {
    wide: {tx: 0.4, ty: 2.5, tz: 0, yaw: 33, pitch: 21, dist: 22.5, fov: 30},
    crates: {tx: -0.4, ty: 2.95, tz: 0.3, yaw: 38, pitch: 16, dist: 8.8, fov: 30},
    die: {tx: 6.0, ty: 2.7, tz: 1.8, yaw: 24, pitch: 9, dist: 10, fov: 30},
    tower: {tx: -5.4, ty: 3.1, tz: 0.6, yaw: 28, pitch: 12, dist: 10.5, fov: 30},
  },
};

export type Cam3Key = {f: number; cam: Cam3 | BridgeFraming; view?: BridgeView; dur?: number; ease?: EaseFn};
export type BridgeHighlight = 'tower' | 'bridge' | 'die' | 'crates' | 'cache' | 'power' | null;

export type BridgeProps = {
  frame: number;
  view?: BridgeView;
  framing?: BridgeFraming | Cam3;
  /** animated camera (overrides framing) */
  cam?: readonly Cam3Key[];
  /** 0..1: deck width, lanes and glow (default 0.7) */
  bandwidth?: Num;
  /** crates per second (default 3) */
  crateRate?: number;
  /** frames for a crate to cross (default 30: fast) */
  travel?: number;
  /** stamped on crates (close-ups) and shown as a tag over the bridge (wide) */
  crateLabel?: string;
  crateScale?: Num;
  /** 0..1: the math units flicker and work (default 0.8) */
  mathActivity?: Num;
  /** 0..1: amber energy level; math visibly slower. Omit to hide the power meter. */
  powerCap?: Num;
  /** 0..1: the math units wait (dim, slow coral breathing, a pause mark) */
  idle?: Num;
  highlight?: BridgeHighlight;
  highlightColor?: string;
  /** the set builds itself over [at, at + dur] (crates start at the end) */
  build?: {at: number; dur?: number};
  /** one huge crate thundering across (S1/S5) */
  heroCrate?: {at: number; dur?: number; scale?: number; label?: string};
  /** crates start flowing at this frame (default: always flowing) */
  flowFrom?: number;
  /** stop spawning crates at this frame */
  flowUntil?: number;
  /** camera micro drift (default 1) */
  drift?: number;
  /** depth-of-field strength multiplier (default 1; auto from the camera distance) */
  dof?: number;
  /** label stamp/tag colour */
  labelColor?: string;
  /** god rays from above, 0..1 (default 0.4) */
  rays?: Num;
  /** draw the old vector crates instead of the crate renders (fallback) */
  drawnCrates?: boolean;
};

/* ---------------------------------------------------------------- camera */
const resolveCam = (c: Cam3 | BridgeFraming, view: BridgeView): Cam3 => (typeof c === 'string' ? BRIDGE_CAMS[view][c] : c);
export const bridgeCam = (p: Pick<BridgeProps, 'view' | 'framing' | 'cam' | 'drift'>, frame: number): Cam3 => {
  const view = p.view ?? 'side';
  let c: Cam3;
  if (p.cam && p.cam.length) {
    const ks = [...p.cam].sort((a, b) => a.f - b.f);
    const cams = ks.map((k) => resolveCam(k.cam, k.view ?? view));
    c = cams[cams.length - 1];
    if (frame <= ks[0].f) c = cams[0];
    else
      for (let i = 1; i < ks.length; i++) {
        if (frame < ks[i].f) {
          const dur = Math.max(1, ks[i].dur ?? ks[i].f - ks[i - 1].f);
          const t0 = Math.max(ks[i - 1].f, ks[i].f - dur);
          const t = (ks[i].ease ?? EASE.cam)(clamp01((frame - t0) / Math.max(1, ks[i].f - t0)));
          c = lerpCam(cams[i - 1], cams[i], t);
          break;
        }
      }
  } else c = typeof p.framing === 'object' ? p.framing : BRIDGE_CAMS[view][p.framing ?? 'wide'];
  const d = p.drift ?? 1;
  return {
    ...c,
    yaw: c.yaw + d * 1.4 * Math.sin((TAU * frame) / 420),
    pitch: c.pitch + d * 0.6 * Math.sin((TAU * frame) / 310 + 1),
    dist: c.dist * (1 + d * 0.014 * Math.sin((TAU * frame) / 370 + 2)),
    ty: c.ty + d * 0.05 * Math.sin((TAU * frame) / 260),
  };
};

/** Screen anchors (px) for labels, at a frame. */
export const bridgeAnchors = (p: Pick<BridgeProps, 'view' | 'framing' | 'cam' | 'drift' | 'bandwidth'>, frame: number) => {
  const b = basis(bridgeCam(p, frame));
  const P = (v: V3) => {
    const q = project(b, v);
    return q ? {x: q[0], y: q[1]} : {x: -9999, y: -9999};
  };
  const dz = DIEX.z1;
  return {
    towerTop: P([TX, TOWER_H + 0.1, 0]),
    tower: P([TX, TOWER_H * 0.62, T.z1]),
    dock: P([T.x1, SET.deckY + 0.3, 0]),
    bridge: P([(T.x1 + DIEX.x0) / 2, SET.deckY + 0.55, 0]),
    bridgeDeck: P([(T.x1 + DIEX.x0) / 2, SET.deckY, 0]),
    die: P([DIEX.x0 + (FACE.grid[0] + FACE.grid[2]) / 2, (FACE.grid[1] + FACE.grid[3]) / 2, dz]),
    dieTop: P([(DIEX.x0 + DIEX.x1) / 2, DIEX.h + 0.1, 0]),
    cache: P([DIEX.x0 + (FACE.cache[0] + FACE.cache[2]) / 2, (FACE.cache[1] + FACE.cache[3]) / 2, dz]),
    power: P([DIEX.x0 + (FACE.power[0] + FACE.power[2]) / 2, (FACE.power[1] + FACE.power[3]) / 2, dz]),
    pxPerUnit: pxPerUnit(b, [0, SET.deckY, 0]),
  };
};

/* ---------------------------------------------------------------- drawing helpers */
const FOG = '#0A1830';
const fogged = (c: string, depth: number, start = 18, end = 70, max = 0.88) => mixHex(c, FOG, clamp01((depth - start) / (end - start)) * max);

type Ctx = {b: Basis; uid: string; n: number; defs: React.ReactNode[]};
const gid = (c: Ctx, p: string) => `${c.uid}${p}${c.n++}`;
/** Vertical gradient across a projected face (top colour → bottom colour). */
const vGrad = (c: Ctx, f: Face, top: string, bottom: string, topOp = 1, botOp = 1): string => {
  const pts = polyPts(c.b, f.pts);
  if (pts.length < 3) return top;
  const ys = pts.map((p) => p[1]);
  const xs = pts.map((p) => p[0]);
  const id = gid(c, 'g');
  const mx = (Math.min(...xs) + Math.max(...xs)) / 2;
  c.defs.push(
    <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={mx} y1={Math.min(...ys)} x2={mx} y2={Math.max(...ys)}>
      <stop offset="0" stopColor={top} stopOpacity={topOp} />
      <stop offset="1" stopColor={bottom} stopOpacity={botOp} />
    </linearGradient>,
  );
  return `url(#${id})`;
};
const lineGrad = (c: Ctx, a: [number, number], z: [number, number], col: string, opA: number, opZ: number): string => {
  const id = gid(c, 'l');
  c.defs.push(
    <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={a[0]} y1={a[1]} x2={z[0]} y2={z[1]}>
      <stop offset="0" stopColor={col} stopOpacity={opA} />
      <stop offset="1" stopColor={col} stopOpacity={opZ} />
    </linearGradient>,
  );
  return `url(#${id})`;
};
const Poly: React.FC<{d: string; fill: string; stroke?: string; sw?: number; op?: number; so?: number}> = ({d, fill, stroke, sw = 1.5, op = 1, so = 1}) =>
  d ? <path d={d} fill={fill} stroke={stroke} strokeWidth={stroke ? sw : undefined} strokeOpacity={so} opacity={op} strokeLinejoin="round" /> : null;

/* ---------------------------------------------------------------- real-asset textures (the S5 look) */
/** The memory bank is textured from BIM139 (HBM stack), the die face from BIM142 (compute-cache, top view). */
const HBM = 'BIM139_T03_hbm-stack_c' as const;
const DIE = 'BIM142_T03_compute-cache_b' as const;
type Q4 = [[number, number], [number, number], [number, number], [number, number]];
/** BIM139 native quads, corners: top-left, top-right, bottom-right, bottom-left of each face as the kit maps it. */
const HBM_FRONT: Q4 = [
  [72, 494],
  [700, 726],
  [700, 1018],
  [72, 782],
];
const HBM_SIDE: Q4 = [
  [700, 726],
  [1190, 492],
  [1190, 772],
  [700, 1018],
];
/** lid top: front-left, front-right, back-right, back-left */
const HBM_LID: Q4 = [
  [80, 460],
  [703, 690],
  [1184, 384],
  [525, 214],
];
const DIE_Q: Q4 = [
  [159, 58],
  [1381, 58],
  [1381, 963],
  [159, 963],
];
/** HBM texture tiles stacked up the tower body (4 layers each → 12 visible DRAM layers). */
const TILES = 3;

const Tex: React.FC<{src: AssetName; from: Q4; to: Array<[number, number]>; bright?: number; op?: number}> = ({src, from, to, bright = 1, op = 1}) => {
  if (to.length !== 4 || op <= 0.001) return null;
  const [W, H] = ASSET_INFO[src];
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: '0 0',
        transform: quadToQuadMatrix(from, to as unknown as Q4),
        clipPath: `polygon(${from.map((p) => `${p[0]}px ${p[1]}px`).join(', ')})`,
        opacity: op,
      }}
    >
      <Img src={assetUrl(src)} style={{position: 'absolute', left: 0, top: 0, width: W, height: H, filter: bright !== 1 ? `brightness(${bright})` : undefined}} />
    </div>
  );
};

/** Soft light shafts from above (screen blend), as in S5. */
export const GodRays: React.FC<{frame: number; x: number; y: number; on: number; reach?: number}> = ({frame, x, y, on, reach = 1000}) => {
  if (on <= 0.01) return null;
  const rot = 168 + 6 * Math.sin(frame / 90);
  const mask = `radial-gradient(ellipse ${reach}px ${Math.round(reach * 0.85)}px at ${x}px ${y + reach * 0.5}px, rgba(0,0,0,1), rgba(0,0,0,0) 75%)`;
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
        background: `repeating-conic-gradient(from ${rot}deg at ${x + 400}px ${y + 300}px, rgba(156,200,255,0) 0deg, rgba(156,200,255,0.17) 3deg, rgba(156,200,255,0) 7deg, rgba(156,200,255,0) 13deg)`,
        WebkitMaskImage: mask,
        maskImage: mask,
        filter: 'blur(10px)',
        pointerEvents: 'none',
      }}
    />
  );
};

/** Two blurred copies (tight and wide) of emissive shapes, screened over what is already drawn in the group. */
const GlowPair: React.FC<{uid: string; items: React.ReactNode[]}> = ({uid, items}) =>
  items.length ? (
    <>
      <g filter={`url(#${uid}-gB)`} opacity={0.75} style={{mixBlendMode: 'screen'}}>
        {items}
      </g>
      <g filter={`url(#${uid}-gA)`} opacity={0.9} style={{mixBlendMode: 'screen'}}>
        {items}
      </g>
    </>
  ) : null;

/** A group drawn as base SVG → HTML textures → overlay SVG (with its glows), blurred as one for depth of field. */
type Group = {id: string; base: React.ReactNode[]; html: React.ReactNode[]; over: React.ReactNode[]; glow: React.ReactNode[]; blur: number};
const newGroup = (id: string): Group => ({id, base: [], html: [], over: [], glow: [], blur: 0});

/* ---------------------------------------------------------------- component */
export const Bridge: React.FC<BridgeProps> = (props) => {
  const {frame: f, crateRate = 3, travel = 30, crateLabel, highlight = null, highlightColor = PAL.ink, labelColor = PAL.info} = props;
  const uid = safeId(useId());
  const cam = bridgeCam(props, f);
  const b = basis(cam);
  const c: Ctx = {b, uid, n: 0, defs: []};
  const depth = (p: V3) => toCam(b, p)[2];
  const D = (pts: readonly V3[]) => polyD(b, pts);
  /** projected corners of a world quad, or [] when any corner is behind the camera */
  const P4 = (pts: readonly V3[]): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (const p of pts) {
      const q = project(b, p);
      if (!q) return [];
      out.push(q);
    }
    return out;
  };

  // ---------- state
  const bw = clamp01(num(props.bandwidth, f, 0.7));
  const Wd = lerp(1.0, 3.4, bw);
  const cS = 0.72 * num(props.crateScale, f, 1);
  const cH = 0.56 * num(props.crateScale, f, 1);
  const nL = clamp(Math.floor(Wd / (0.72 * 1.3)), 1, 4);
  const act = clamp01(num(props.mathActivity, f, 0.8));
  const powerShown = props.powerCap !== undefined;
  const power = clamp01(num(props.powerCap, f, 1));
  const idle = clamp01(num(props.idle, f, 0));
  const rays = clamp01(num(props.rays, f, 0.4));
  const glowK = 0.45 + 0.55 * bw;
  const B = props.build ? prog(f, props.build.at, props.build.dur ?? 60) : 1;
  const bFloor = smooth(B / 0.1);
  const bTower = EASE.out(clamp01((B - 0.04) / 0.42));
  const bDie = EASE.out(clamp01((B - 0.22) / 0.38));
  const bDeck = EASE.inOut(clamp01((B - 0.52) / 0.28));
  const bRail = clamp01((B - 0.72) / 0.14);
  const flowFrom = props.build ? props.build.at + (props.build.dur ?? 60) * 0.86 : (props.flowFrom ?? -1e9);
  const flowUntil = props.flowUntil ?? 1e12;
  const xa = T.x1;
  const xb = DIEX.x0;
  const xbDeck = lerp(xa, xb, bDeck);
  const deckY = SET.deckY;
  const laneZ = (l: number) => -Wd / 2 + ((l + 0.5) * Wd) / nL;
  const P = 30 / Math.max(0.2, crateRate);
  const phase = flowFrom > -1e8 ? flowFrom : 0;
  const speedK = lerp(0.35, 1, power);

  // ---------- crates
  type Crate = {k: number; x: number; z: number; s: number; h: number; op: number; u: number; hero: boolean};
  const crates: Crate[] = [];
  const arrivals: Array<{a: number; w: number}> = [];
  const kMin = Math.ceil((f - travel - 8 - phase) / P) - 1;
  const kMax = Math.floor((f - phase) / P);
  for (let k = kMin; k <= kMax; k++) {
    const s0 = phase + k * P;
    if (s0 < flowFrom || s0 > flowUntil) continue;
    const age = f - s0;
    if (age < 0) continue;
    const u = age / travel;
    const lane = (k * (nL > 2 ? nL - 1 : 1)) % nL;
    const L = ((lane % nL) + nL) % nL;
    if (u <= 1) {
      const eu = 0.82 * u + 0.18 * smooth(u);
      const sc = lerp(0.55, 1, clamp01(age / 5));
      crates.push({k, x: xa + 0.32 + cS / 2 + (xb - xa - 0.64 - cS) * eu, z: laneZ(L), s: cS * sc, h: cH * sc, op: clamp01(age / 3), u, hero: false});
    } else if (age - travel < 7) {
      const tail = (age - travel) / 7;
      crates.push({k, x: xb - 0.32 - cS / 2 + tail * 0.35, z: laneZ(L), s: cS * (1 - 0.6 * tail), h: cH * (1 - 0.6 * tail), op: 1 - tail, u, hero: false});
    }
  }
  for (let k = Math.floor((f - 60 - travel - phase) / P); k <= kMax; k++) {
    const s0 = phase + k * P;
    if (s0 < flowFrom || s0 > flowUntil) continue;
    const a = s0 + travel;
    if (a <= f && f - a < 60) arrivals.push({a, w: 1});
  }
  const hero = props.heroCrate;
  if (hero) {
    const dur = hero.dur ?? 42;
    const age = f - hero.at;
    const u = age / dur;
    const hs = cS * (hero.scale ?? 2.4);
    const hh = cH * (hero.scale ?? 2.4) * 0.92;
    if (u >= 0 && u <= 1) {
      const e = Math.pow(u, 1.7);
      crates.push({k: -999, x: xa + 0.2 + hs / 2 + (xb - xa - 0.5 - hs) * e, z: 0, s: hs * lerp(0.7, 1, clamp01(age / 6)), h: hh * lerp(0.7, 1, clamp01(age / 6)), op: clamp01(age / 3), u, hero: true});
    } else if (u > 1 && age - dur < 8) {
      const tail = (age - dur) / 8;
      crates.push({k: -999, x: xb - 0.3 - hs / 2 + tail * 0.6, z: 0, s: hs * (1 - 0.7 * tail), h: hh * (1 - 0.7 * tail), op: 1 - tail, u, hero: true});
    }
    const a = hero.at + dur;
    if (f >= a && f - a < 60) arrivals.push({a, w: 2.4});
  }
  const arrFlash = arrivals.reduce((m, a) => Math.max(m, f >= a.a ? Math.exp(-(f - a.a) / 6) * Math.min(1, a.w) : 0), 0);
  const spawnPulse = (() => {
    let v = 0;
    for (const kk of [kMax, kMax + 1]) {
      const s0 = phase + kk * P;
      if (s0 < flowFrom || s0 > flowUntil) continue;
      v += Math.exp(-((f - s0) ** 2) / 20);
    }
    if (hero) v += Math.exp(-((f - hero.at) ** 2) / 30) * 1.5;
    return clamp01(v);
  })();

  // ---------- layers
  const bg: React.ReactNode[] = [];
  const bgGlow: React.ReactNode[] = [];
  const banks: React.ReactNode[] = [];
  const haze: React.ReactNode[] = [];
  const tower = newGroup('tower');
  const bridge = newGroup('bridge');
  const die = newGroup('die');
  const gBehind: React.ReactNode[] = []; // bridge glows that crates occlude
  const html: React.ReactNode[] = [];
  let key = 0;
  const K = () => key++;

  // sky and horizon (the night-env palette)
  const hz = project(b, [cam.tx, 0, cam.tz - 400]);
  const yh = hz ? clamp(hz[1], -200, 1300) : 300;
  const skyId = gid(c, 'sky');
  c.defs.push(
    <linearGradient key={skyId} id={skyId} x1="0" y1="0" x2="0" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#03060E" />
      <stop offset={clamp01((yh - 60) / 1080)} stopColor="#0A1630" />
      <stop offset={clamp01(yh / 1080)} stopColor="#112748" />
      <stop offset={clamp01((yh + 40) / 1080)} stopColor="#0B1A36" />
      <stop offset="1" stopColor="#050A15" />
    </linearGradient>,
  );
  bg.push(<rect key={K()} x={-50} y={-50} width={2020} height={1180} fill={`url(#${skyId})`} />);
  // back-light: a soft glow in the air behind the set (figure-ground separation), as in S5
  const blp = project(b, [(xa + xb) / 2 + 2.5, 3.2, -9]);
  if (blp) {
    const bl = gid(c, 'bl');
    c.defs.push(
      <radialGradient key={bl} id={bl} cx={blp[0]} cy={blp[1]} r={1100} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#1E5A9C" stopOpacity={0.46} />
        <stop offset="0.45" stopColor="#163C70" stopOpacity={0.2} />
        <stop offset="1" stopColor="#0A1830" stopOpacity={0} />
      </radialGradient>,
    );
    bg.push(<rect key={K()} x={-50} y={-50} width={2020} height={1180} fill={`url(#${bl})`} />);
  }
  // floor
  const floorD = D([
    [-60, 0, 22],
    [60, 0, 22],
    [60, 0, -90],
    [-60, 0, -90],
  ]);
  const flId = gid(c, 'fl');
  c.defs.push(
    <linearGradient key={flId} id={flId} x1="0" y1={yh} x2="0" y2="1080" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#0C1C38" />
      <stop offset="0.3" stopColor="#081428" />
      <stop offset="1" stopColor="#050A15" />
    </linearGradient>,
  );
  bg.push(<Poly key={K()} d={floorD} fill={`url(#${flId})`} op={bFloor} />);
  // faint perspective grid (the night env's floor)
  const gl: React.ReactNode[] = [];
  for (let gx = -28; gx <= 28; gx += 1.6) {
    const s = seg(b, [gx, 0, 16], [gx, 0, -70]);
    if (s) gl.push(<line key={`gx${gx}`} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />);
  }
  for (let gz = 14; gz >= -70; gz -= 1.6) {
    const s = seg(b, [-40, 0, gz], [40, 0, gz]);
    if (s) gl.push(<line key={`gz${gz}`} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />);
  }
  bg.push(
    <g key={K()} stroke="#2A4170" strokeWidth={1.3} opacity={0.42 * bFloor}>
      {gl}
    </g>,
  );
  // floor traces with travelling pulses
  const traces: V3[][] = [
    [[-6.2, 0.01, 1.9], [-6.2, 0.01, 5], [-12, 0.01, 5], [-12, 0.01, 9]],
    [[-8.3, 0.01, -0.5], [-14, 0.01, -0.5], [-14, 0.01, -6], [-22, 0.01, -6]],
    [[-5, 0.01, -1.9], [-5, 0.01, -8], [0, 0.01, -8], [0, 0.01, -16]],
    [[9.2, 0.01, -0.8], [15, 0.01, -0.8], [15, 0.01, -9], [24, 0.01, -9]],
    [[6.5, 0.01, 2.1], [6.5, 0.01, 6], [12, 0.01, 6], [12, 0.01, 12]],
    [[2, 0.01, -2], [2, 0.01, -5], [8, 0.01, -5], [8, 0.01, -14]],
  ];
  traces.forEach((tr, i) => {
    const pts = tr.map((p) => project(b, p)).filter((q): q is [number, number] => q !== null);
    if (pts.length < 2) return;
    const d = `M${pts.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join(' L')}`;
    bg.push(<path key={K()} d={d} fill="none" stroke="#0E4058" strokeWidth={3} opacity={bFloor} strokeLinejoin="round" />);
    const len = pts.reduce((s, q, j) => (j ? s + Math.hypot(q[0] - pts[j - 1][0], q[1] - pts[j - 1][1]) : 0), 0);
    bgGlow.push(
      <path
        key={K()}
        d={d}
        fill="none"
        stroke={PAL.info}
        strokeWidth={4}
        strokeLinecap="round"
        strokeDasharray={`60 ${len + 400}`}
        strokeDashoffset={-(((f * 9 + i * 211) % (len + 460)) - 60)}
        opacity={0.8 * bFloor}
      />,
    );
  });
  // light pools on the floor
  const pool = (cx: number, cz: number, r: number, col: string, op: number) => {
    const pts: V3[] = Array.from({length: 28}, (_, i) => [cx + r * Math.cos((TAU * i) / 28), 0.005, cz + r * Math.sin((TAU * i) / 28)] as V3);
    const d = D(pts);
    if (!d) return;
    const id = gid(c, 'pool');
    c.defs.push(
      <radialGradient key={id} id={id}>
        <stop offset="0" stopColor={col} stopOpacity={op} />
        <stop offset="0.6" stopColor={col} stopOpacity={op * 0.35} />
        <stop offset="1" stopColor={col} stopOpacity={0} />
      </radialGradient>,
    );
    bg.push(<path key={K()} d={d} fill={`url(#${id})`} />);
  };
  pool(TX, 0, 4.8, '#1C6E9C', 0.5 * bTower);
  pool((DIEX.x0 + DIEX.x1) / 2, 0, 5.4, '#2A4FA0', 0.45 * bDie);
  pool((xa + xb) / 2, 0, 5.5, PAL.info, 0.2 * glowK * bRail);

  // far banks in the haze: dim, blurred copies of the real renders (as in S5)
  const BANKS: Array<{x: number; z: number; w: number; s: AssetName}> = [
    {x: -22, z: -24, w: 7.5, s: HBM},
    {x: -12, z: -31, w: 9, s: 'BIM141_T03_compute-cache_a'},
    {x: -2.5, z: -28, w: 6.5, s: HBM},
    {x: 10.5, z: -30, w: 9.5, s: HBM},
    {x: 20.5, z: -23, w: 8.5, s: 'BIM141_T03_compute-cache_a'},
    {x: 30, z: -34, w: 8.5, s: HBM},
  ];
  for (const bk of BANKS) {
    const q = project(b, [bk.x, 0, bk.z]);
    if (!q) continue;
    const box = assetBox(bk.s);
    const kk = (bk.w * pxPerUnit(b, [bk.x, 0, bk.z])) / box.cw;
    if (kk * box.cw < 12) continue;
    banks.push(
      <Img
        key={K()}
        src={assetUrl(bk.s)}
        style={{
          position: 'absolute',
          left: q[0] - box.cx * kk,
          top: q[1] - box.y1 * kk,
          width: box.w * kk,
          height: box.h * kk,
          opacity: 0.34 * bFloor,
          filter: `brightness(0.42) saturate(0.6) blur(${(3.5 * Math.min(1, kk * 4)).toFixed(1)}px)`,
        }}
      />,
    );
  }
  // haze band over the horizon (in front of the far banks)
  const hzId = gid(c, 'hz');
  c.defs.push(
    <linearGradient key={hzId} id={hzId} x1="0" y1={yh - 180} x2="0" y2={yh + 320} gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor={FOG} stopOpacity={0} />
      <stop offset="0.42" stopColor="#123060" stopOpacity={0.5} />
      <stop offset="1" stopColor={FOG} stopOpacity={0} />
    </linearGradient>,
  );
  haze.push(<rect key={K()} x={-50} y={yh - 180} width={2020} height={500} fill={`url(#${hzId})`} />);

  // ---------- memory: an HBM stack textured from the BIM139 render
  const tH = T.base + (TOWER_H - T.base - T.lid) * bTower;
  const bodyH = TOWER_H - T.base - T.lid;
  const towerBody: Box = {x0: T.x0, x1: T.x1, y0: T.base, y1: tH, z0: T.z0, z1: T.z1};
  const towerDep = depth([TX, TOWER_H / 2, 0]);
  const towerBright = 1 + 0.18 * spawnPulse;
  const nLayers = TILES * 4;
  const scanAt = (layer: number): number => {
    // memory "read": the layer that holds the departing crate lights up just before it leaves
    let v = 0;
    for (let k = kMax - 2; k <= kMax + 2; k++) {
      const s0 = phase + k * P;
      if (s0 < flowFrom || s0 > flowUntil) continue;
      if (((((nLayers - 1 - (k % nLayers)) % nLayers) + nLayers) % nLayers) !== layer) continue;
      const t = f - (s0 - 5);
      v += Math.exp(-(t * t) / 14);
    }
    return clamp01(v) * (0.5 + 0.5 * bw);
  };
  if (bTower > 0) {
    // base die with its gold ball grid
    const baseBox: Box = {x0: T.x0 - 0.1, x1: T.x1 + 0.1, y0: 0, y1: T.base, z0: T.z0 - 0.1, z1: T.z1 + 0.1};
    for (const fc of visibleFaces(b, baseBox)) {
      if (fc.key === 'ny') continue;
      tower.base.push(<Poly key={K()} d={D(fc.pts)} fill={fogged(shadeHex('#1B2436', lightOf(fc.n)), towerDep)} stroke="#C79A3E" sw={1.2} so={0.6} />);
      if (fc.key !== 'py') {
        const wF = fc.key === 'pz' || fc.key === 'nz' ? baseBox.x1 - baseBox.x0 : baseBox.z1 - baseBox.z0;
        for (let i = 0; i < 16; i++) {
          const q = project(b, facePoint(fc, ((i + 0.5) * wF) / 16, 0.12));
          const r = pxPerUnit(b, facePoint(fc, ((i + 0.5) * wF) / 16, 0.12)) * 0.085;
          if (q && r > 0.6) tower.over.push(<circle key={K()} cx={q[0]} cy={q[1]} r={r} fill={`url(#${uid}-ball)`} />);
        }
      }
    }
    // body: base fills (hide texture seams), then the texture tiles, then read scans and a specular sweep
    for (const fc of visibleFaces(b, towerBody)) {
      if (fc.key === 'ny') continue;
      const lit = lightOf(fc.n);
      if (fc.key === 'py') {
        tower.base.push(<Poly key={K()} d={D(fc.pts)} fill={fogged(shadeHex('#2A3550', lit), towerDep)} />);
        continue;
      }
      tower.base.push(<Poly key={K()} d={D(fc.pts)} fill={fogged(shadeHex('#161E2E', lit), towerDep)} />);
      if (fc.key === 'nz') continue;
      const wF = fc.key === 'pz' ? T.x1 - T.x0 : T.z1 - T.z0;
      const src: Q4 = fc.key === 'pz' ? HBM_FRONT : fc.key === 'px' ? HBM_SIDE : [HBM_SIDE[1], HBM_SIDE[0], HBM_SIDE[3], HBM_SIDE[2]];
      const tileH = bodyH / TILES;
      const shown = tH - T.base;
      for (let t = 0; t < TILES; t++) {
        const v0 = t * tileH;
        if (v0 >= shown) break;
        const v1 = Math.min(shown, v0 + tileH);
        const frac = (v1 - v0) / tileH;
        // partial tile while building: keep the bottom part of the texture
        const s: Q4 =
          frac >= 0.999
            ? src
            : [
                [lerp(src[3][0], src[0][0], frac), lerp(src[3][1], src[0][1], frac)],
                [lerp(src[2][0], src[1][0], frac), lerp(src[2][1], src[1][1], frac)],
                src[2],
                src[3],
              ];
        const to = P4([facePoint(fc, 0, v1), facePoint(fc, wF, v1), facePoint(fc, wF, v0), facePoint(fc, 0, v0)]);
        tower.html.push(<Tex key={K()} src={HBM} from={s} to={to} bright={(fc.key === 'pz' ? 1.02 : 0.92) * towerBright} />);
      }
      for (let i = 0; i < nLayers; i++) {
        const sc = scanAt(i);
        if (sc <= 0.02) continue;
        const v0 = (i / nLayers) * bodyH + 0.05;
        const v1 = ((i + 1) / nLayers) * bodyH - 0.07;
        if (v1 > shown) continue;
        const band = faceQuad(fc, 0.04, v0, wF - 0.04, v1, 0.008);
        tower.over.push(<Poly key={K()} d={D(band)} fill={PAL.info} op={0.3 * sc} />);
        tower.glow.push(<Poly key={K()} d={D(band)} fill={PAL.info} op={0.8 * sc} />);
      }
      // specular sweep across the face (the S5 Prop sweep)
      const sw = ((((f + (fc.key === 'pz' ? 0 : 18)) * 0.024) % 1.8) - 0.4) * wF;
      if (sw > -0.4 && sw < wF + 0.4) {
        const q = faceQuad(fc, Math.max(0, sw - 0.35), 0, Math.min(wF, sw + 0.35), shown, 0.01);
        tower.over.push(<Poly key={K()} d={D(q)} fill="#FFFFFF" op={0.1} />);
      }
    }
    // rim light along the front-right edge
    const rimS = seg(b, [T.x1, T.base, T.z1], [T.x1, tH, T.z1]);
    if (rimS) {
      tower.over.push(<line key={K()} x1={rimS[0]} y1={rimS[1]} x2={rimS[2]} y2={rimS[3]} stroke="#DDF6FF" strokeWidth={2} opacity={0.7} />);
      tower.glow.push(<line key={K()} x1={rimS[0]} y1={rimS[1]} x2={rimS[2]} y2={rimS[3]} stroke={PAL.info} strokeWidth={8} opacity={0.35 + 0.35 * spawnPulse} />);
    }
    // the dock on the +x face
    const dockF = visibleFaces(b, towerBody).find((x) => x.key === 'px');
    if (dockF && bDeck > 0) {
      const u0 = T.z1 - Wd / 2 + 0.05;
      const u1 = T.z1 + Wd / 2 - 0.05;
      const q = faceQuad(dockF, Math.max(0.1, u0), deckY - T.base - 0.04, Math.min(T.z1 - T.z0 - 0.1, u1), deckY - T.base + cH + 0.22, 0.014);
      tower.over.push(<Poly key={K()} d={D(q)} fill="#03050A" op={0.92} />);
      tower.over.push(<Poly key={K()} d={D(q)} fill="none" stroke={PAL.info} sw={3} op={0.6 + 0.4 * spawnPulse} />);
      tower.glow.push(<Poly key={K()} d={D(q)} fill={PAL.info} op={(0.25 + 0.5 * spawnPulse) * glowK} />);
    }
    // lid: brushed-steel top from the render, steel sides
    if (bTower >= 0.999) {
      const lid: Box = {x0: T.x0 - 0.06, x1: T.x1 + 0.06, y0: tH, y1: tH + T.lid, z0: T.z0 - 0.06, z1: T.z1 + 0.06};
      for (const fc of visibleFaces(b, lid)) {
        if (fc.key === 'ny') continue;
        const lit = lightOf(fc.n);
        if (fc.key === 'py') {
          tower.base.push(<Poly key={K()} d={D(fc.pts)} fill={fogged('#AEB6C2', towerDep)} />);
          tower.html.push(<Tex key={K()} src={HBM} from={HBM_LID} to={P4(fc.pts)} bright={1.04} />);
          tower.over.push(<Poly key={K()} d={D(fc.pts)} fill="none" stroke="#F4F6F9" sw={1.6} so={0.55} />);
        } else tower.over.push(<Poly key={K()} d={D(fc.pts)} fill={vGrad(c, fc, fogged(shadeHex('#C2C9D3', lit), towerDep), fogged(shadeHex('#6F7888', lit), towerDep))} stroke="#E4E8EE" sw={1} so={0.5} />);
      }
    } else {
      const q = faceQuad({key: 'py', pts: [[T.x0, tH, T.z1], [T.x1, tH, T.z1], [T.x1, tH, T.z0], [T.x0, tH, T.z0]], n: [0, 1, 0], c: [TX, tH, 0]}, 0, 0, T.x1 - T.x0, T.z1 - T.z0, 0.01);
      tower.over.push(<Poly key={K()} d={D(q)} fill={PAL.infoPale} op={0.7} />);
      tower.glow.push(<Poly key={K()} d={D(q)} fill={PAL.info} op={1} />);
    }
  }

  // ---------- math: the compute die (BIM142) on its block
  const dH = DIEX.h * bDie;
  const dieDep = depth([(DIEX.x0 + DIEX.x1) / 2, DIEX.h / 2, 0]);
  if (bDie > 0.01) {
    const box: Box = {x0: DIEX.x0, x1: DIEX.x1, y0: 0, y1: dH, z0: DIEX.z0, z1: DIEX.z1};
    const vS = dH / DIEX.h;
    const V = (v: number) => v * vS;
    for (const fc of visibleFaces(b, box)) {
      if (fc.key === 'ny') continue;
      const lit = lightOf(fc.n);
      if (fc.key === 'py') {
        die.base.push(<Poly key={K()} d={D(fc.pts)} fill={fogged(shadeHex('#1B2742', lit), dieDep)} stroke="#B9C2CF" sw={1.4} so={0.55} />);
        continue;
      }
      die.base.push(<Poly key={K()} d={D(fc.pts)} fill={vGrad(c, fc, fogged(shadeHex('#1A2742', lit), dieDep), fogged(shadeHex('#0A111E', lit), dieDep))} />);
      if (fc.key !== 'pz') {
        // gold pads along the top of the substrate sides
        const wF = fc.key === 'nz' ? DIEX.x1 - DIEX.x0 : DIEX.z1 - DIEX.z0;
        for (let i = 0; i < 12; i++) {
          const u = 0.25 + (i * (wF - 0.5)) / 11;
          die.base.push(<Poly key={K()} d={D(faceQuad(fc, u - 0.05, V(FACE.tex[1]) + 0.08, u + 0.05, V(FACE.tex[1]) + 0.2, 0.01))} fill={PAL.gold} op={0.75} />);
        }
        if (fc.key === 'nx' && bDeck > 0) {
          const q = faceQuad(fc, Math.max(0.1, -Wd / 2 - DIEX.z0 + 0.05), deckY - 0.04, Math.min(DIEX.z1 - DIEX.z0 - 0.1, Wd / 2 - DIEX.z0 - 0.05), deckY + cH + 0.22, 0.012);
          die.over.push(<Poly key={K()} d={D(q)} fill="#03050A" stroke={PAL.info} sw={3} />);
        }
        continue;
      }
      // the die texture on the front face
      const tq = FACE.tex;
      const to = P4([facePoint(fc, tq[0], V(tq[3])), facePoint(fc, tq[2], V(tq[3])), facePoint(fc, tq[2], V(tq[1])), facePoint(fc, tq[0], V(tq[1]))]);
      die.html.push(<Tex key={K()} src={DIE} from={DIE_Q} to={to} bright={1 + 0.22 * arrFlash} op={clamp01(bDie * 1.4)} />);
      // gold pins on the plinth under the die
      for (let i = 0; i < 18; i++) {
        const u = 0.35 + (i * 4.5) / 17;
        die.base.push(<Poly key={K()} d={D(faceQuad(fc, u - 0.06, V(0.62), u + 0.06, V(0.74), 0.01))} fill={PAL.gold} op={0.85} />);
      }
      // math activity on the compute tiles (flicker slows with less power; each arrival sends a wave)
      const g = FACE.grid;
      const tw = (g[2] - g[0]) / FACE.cols;
      const th = (g[3] - g[1]) / FACE.rows;
      for (let r = 0; r < FACE.rows; r++) {
        for (let cI = 0; cI < FACE.cols; cI++) {
          const i = r * FACE.cols + cI;
          const flick = Math.max(0, noise2D(`mt${i}`, f * 0.075 * speedK, i * 0.37)) * 1.25;
          let wv = 0;
          for (const ar of arrivals) {
            const age = f - ar.a;
            const front = age * 0.42 * speedK;
            const dc = cI - front + (r % 2) * 0.3;
            wv += ar.w * Math.exp(-(dc * dc) / 1.4) * Math.exp(-age / (20 / speedK));
          }
          let bv = act * (0.1 + 0.55 * flick) + (0.25 + 0.75 * act) * 0.85 * wv;
          bv *= lerp(0.55, 1, power);
          bv *= 1 - 0.9 * idle;
          if (idle > 0 && (i === 9 || i === 20)) bv += idle * 0.35 * Math.max(0, Math.sin((TAU * (f + i * 13)) / 70));
          bv = clamp01(bv) * bDie;
          if (bv < 0.03) continue;
          const q = faceQuad(fc, g[0] + cI * tw + 0.03, V(g[1] + r * th + 0.03), g[0] + (cI + 1) * tw - 0.03, V(g[1] + (r + 1) * th - 0.03), 0.02);
          die.over.push(<Poly key={K()} d={D(q)} fill={mixHex(PAL.info, '#FFFFFF', 0.3 * bv)} op={0.12 + 0.6 * bv} />);
          die.glow.push(<Poly key={K()} d={D(q)} fill={PAL.info} op={0.9 * bv} />);
        }
      }
      // power: an amber gauge on the plinth
      if (powerShown) {
        const pw = FACE.power;
        die.over.push(<Poly key={K()} d={D(faceQuad(fc, pw[0], V(pw[1]), pw[2], V(pw[3]), 0.016))} fill="#07090F" stroke={PAL.energyDeep} sw={2} />);
        const lvl = pw[0] + 0.05 + (pw[2] - pw[0] - 0.1) * power;
        const fq = faceQuad(fc, pw[0] + 0.05, V(pw[1] + 0.05), lvl, V(pw[3] - 0.05), 0.02);
        die.over.push(<Poly key={K()} d={D(fq)} fill={PAL.energy} />);
        die.glow.push(<Poly key={K()} d={D(fq)} fill={PAL.energy} op={0.8} />);
        const bc = project(b, facePoint(fc, pw[0] - 0.28, V((pw[1] + pw[3]) / 2)));
        const ppu = pxPerUnit(b, facePoint(fc, pw[0], V(pw[1])));
        if (bc) {
          const s = ppu * 0.17;
          die.over.push(
            <path
              key={K()}
              d={`M${bc[0] + s * 0.2} ${bc[1] - s} L${bc[0] - s * 0.55} ${bc[1] + s * 0.15} L${bc[0] - 0.02 * s} ${bc[1] + s * 0.15} L${bc[0] - s * 0.2} ${bc[1] + s} L${bc[0] + s * 0.55} ${bc[1] - s * 0.15} L${bc[0] + 0.02 * s} ${bc[1] - s * 0.15} Z`}
              fill={PAL.energy}
            />,
          );
        }
      }
      // idle: coral breathing frame round the compute tiles
      if (idle > 0.02) {
        const br = 0.45 + 0.35 * Math.sin((TAU * f) / 60);
        const q = faceQuad(fc, g[0] - 0.08, V(g[1] - 0.08), g[2] + 0.08, V(g[3] + 0.08), 0.03);
        die.over.push(<Poly key={K()} d={D(q)} fill="none" stroke={PAL.wait} sw={4} op={idle * br} />);
        die.glow.push(<Poly key={K()} d={D(q)} fill="none" stroke={PAL.wait} sw={8} op={idle * br * 0.8} />);
      }
      // arrival sheen across the die
      if (arrFlash > 0.02) {
        const q = faceQuad(fc, FACE.tex[0], V(FACE.tex[1]), FACE.tex[2], V(FACE.tex[3]), 0.025);
        die.glow.push(<Poly key={K()} d={D(q)} fill={PAL.info} op={0.18 * arrFlash} />);
      }
    }
    // pause mark above the die when idle
    if (idle > 0.3) {
      const pc = project(b, [(DIEX.x0 + DIEX.x1) / 2 - 0.4, DIEX.h + 0.85, DIEX.z1 - 0.4]);
      const ppu = pxPerUnit(b, [(DIEX.x0 + DIEX.x1) / 2, DIEX.h, 0]);
      if (pc) {
        const s = ppu * 0.32 * (0.96 + 0.04 * Math.sin((TAU * f) / 60));
        const op = clamp01((idle - 0.3) / 0.3);
        die.over.push(<rect key={K()} x={pc[0] - s * 0.55} y={pc[1] - s} width={s * 0.36} height={s * 2} rx={s * 0.1} fill={PAL.wait} opacity={op} />);
        die.over.push(<rect key={K()} x={pc[0] + s * 0.19} y={pc[1] - s} width={s * 0.36} height={s * 2} rx={s * 0.1} fill={PAL.wait} opacity={op} />);
      }
    }
    // power conduit on the floor (amber, flowing toward the die)
    if (powerShown) {
      const a3: V3 = [DIEX.x1 + 0.05, 0.012, 0.9];
      const z3: V3 = [DIEX.x1 + 14, 0.012, 0.9];
      const q: V3[] = [
        [a3[0], 0.012, 0.65],
        [z3[0], 0.012, 0.65],
        [z3[0], 0.012, 1.15],
        [a3[0], 0.012, 1.15],
      ];
      bg.push(<Poly key={K()} d={D(q)} fill="#2A1C06" op={0.9} />);
      const s = seg(b, a3, z3);
      if (s) {
        bg.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={PAL.energy} strokeWidth={3} opacity={0.4 + 0.6 * power} />);
        bgGlow.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={PAL.energy} strokeWidth={5} opacity={0.35 + 0.5 * power} />);
        bgGlow.push(
          <line key={K()} x1={s[2]} y1={s[3]} x2={s[0]} y2={s[1]} stroke={PAL.energyHot} strokeWidth={7} strokeDasharray="40 90" strokeDashoffset={-((f * 6 * speedK) % 130)} opacity={power} />,
        );
      }
    }
  }

  // ---------- the deck: glass and steel, emissive lanes (as in S5)
  const deckBox: Box = {x0: xa, x1: xbDeck, y0: deckY - SET.deckT, y1: deckY, z0: -Wd / 2, z1: Wd / 2};
  const bridgeDep = depth([(xa + xb) / 2, deckY, 0]);
  const nearZ = b.pos[2] >= 0 ? Wd / 2 : -Wd / 2;
  if (bDeck > 0.01) {
    // pylons with light strips and floor glows
    for (const px of [-1.7, 1.2]) {
      if (px > xbDeck) continue;
      const pb: Box = {x0: px - 0.16, x1: px + 0.16, y0: 0, y1: deckY - SET.deckT, z0: -0.16, z1: 0.16};
      for (const fc of visibleFaces(b, pb)) {
        if (fc.key === 'ny' || fc.key === 'py') continue;
        bridge.base.push(<Poly key={K()} d={D(fc.pts)} fill={fogged(shadeHex('#141D30', lightOf(fc.n)), bridgeDep)} />);
        if (fc.key === 'pz') {
          const q = faceQuad(fc, 0.13, 0.1, 0.19, deckY - SET.deckT - 0.1, 0.01);
          bridge.base.push(<Poly key={K()} d={D(q)} fill={PAL.info} op={0.75 * bRail} />);
          gBehind.push(<Poly key={K()} d={D(q)} fill={PAL.info} op={0.6 * bRail} />);
        }
      }
      const ring: V3[] = Array.from({length: 20}, (_, i) => [px + 0.9 * Math.cos((TAU * i) / 20), 0.01, 0.6 * Math.sin((TAU * i) / 20)] as V3);
      bgGlow.push(<Poly key={K()} d={D(ring)} fill={PAL.info} op={0.22 * bRail} />);
    }
    // underglow on the floor
    const ug: V3[] = [
      [xa, 0.01, -Wd / 2 - 0.9],
      [xbDeck, 0.01, -Wd / 2 - 0.9],
      [xbDeck, 0.01, Wd / 2 + 0.9],
      [xa, 0.01, Wd / 2 + 0.9],
    ];
    gBehind.push(<Poly key={K()} d={D(ug)} fill={PAL.info} op={0.16 * glowK * bRail} />);
    for (const fc of visibleFaces(b, deckBox)) {
      if (fc.key === 'ny') continue;
      if (fc.key === 'py') {
        // glass: cyan at both edges, deep teal in the middle, across the deck's width
        const pf = project(b, [(xa + xbDeck) / 2, deckY, -nearZ]);
        const pn = project(b, [(xa + xbDeck) / 2, deckY, nearZ]);
        let fill = '#0B3A55';
        if (pf && pn) {
          const id = gid(c, 'glass');
          c.defs.push(
            <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={pf[0]} y1={pf[1]} x2={pn[0]} y2={pn[1]}>
              <stop offset="0" stopColor={PAL.info} stopOpacity={0.42} />
              <stop offset="0.5" stopColor="#0B3A55" stopOpacity={0.6} />
              <stop offset="1" stopColor={PAL.info} stopOpacity={0.32} />
            </linearGradient>,
          );
          fill = `url(#${id})`;
        }
        bridge.base.push(<Poly key={K()} d={D(fc.pts)} fill="#06121E" op={0.85} />);
        bridge.base.push(<Poly key={K()} d={D(fc.pts)} fill={fill} />);
        gBehind.push(<Poly key={K()} d={D(fc.pts)} fill={PAL.info} op={0.14 * glowK} />);
        // a sheen travelling along the glass
        const s0 = (((f * 0.012) % 1.4) - 0.2) * (xbDeck - xa);
        if (s0 > 0 && s0 < xbDeck - xa) {
          const sh: V3[] = [
            [xa + Math.max(0, s0 - 0.45), deckY + 0.004, -Wd / 2],
            [xa + Math.min(xbDeck - xa, s0 + 0.45), deckY + 0.004, -Wd / 2],
            [xa + Math.min(xbDeck - xa, s0 + 0.45), deckY + 0.004, Wd / 2],
            [xa + Math.max(0, s0 - 0.45), deckY + 0.004, Wd / 2],
          ];
          bridge.base.push(<Poly key={K()} d={D(sh)} fill="#FFFFFF" op={0.12} />);
        }
      } else if (fc.key === 'pz' || fc.key === 'nz') {
        // the steel edge
        bridge.base.push(<Poly key={K()} d={D(fc.pts)} fill={vGrad(c, fc, '#8E9AAE', '#121A2B')} />);
      } else bridge.base.push(<Poly key={K()} d={D(fc.pts)} fill={fogged(shadeHex('#1A2436', lightOf(fc.n)), bridgeDep)} />);
    }
    // lane dividers (dashes flowing toward the die) and streaks
    for (let l = 1; l < nL; l++) {
      const z = -Wd / 2 + (l * Wd) / nL;
      const s = seg(b, [xa, deckY + 0.003, z], [xbDeck, deckY + 0.003, z]);
      if (s) bridge.base.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={PAL.info} strokeOpacity={0.55 * bRail} strokeWidth={2} strokeDasharray="14 12" strokeDashoffset={-f * 3 * speedK} />);
    }
    const span = xbDeck - xa;
    const sp = (span / travel) * 1.15;
    for (let l = 0; l < nL; l++) {
      const z = laneZ(l);
      for (let j = 0; j < 5; j++) {
        const ph = rnd(`streak-${l}-${j}`);
        const x0 = xa + ((((f * sp + ph * span * 3 + j * span * 0.21) % span) + span) % span);
        const x1s = Math.min(xbDeck, x0 + 0.55);
        const s = seg(b, [x0, deckY + 0.005, z + (ph - 0.5) * (Wd / nL) * 0.5], [x1s, deckY + 0.005, z + (ph - 0.5) * (Wd / nL) * 0.5]);
        if (s) {
          const o = 0.35 + 0.4 * ph;
          bridge.base.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={PAL.infoPale} strokeOpacity={o * bRail} strokeWidth={2.5} strokeLinecap="round" />);
          gBehind.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={PAL.info} strokeOpacity={o * bRail} strokeWidth={6} strokeLinecap="round" />);
        }
      }
    }
    // dock glow where the deck meets the memory face
    const dk = project(b, [xa, deckY + 0.25, 0]);
    if (dk) {
      const r = pxPerUnit(b, [xa, deckY, 0]) * (Wd / 2 + 0.2);
      gBehind.push(<ellipse key={K()} cx={dk[0]} cy={dk[1]} rx={r * 0.55} ry={r * 0.42} fill={PAL.info} opacity={(0.2 + 0.55 * spawnPulse) * bTower} />);
    }
    // the leading spark while the deck draws
    if (bDeck < 1) {
      const sk = project(b, [xbDeck, deckY + 0.05, 0]);
      if (sk) gBehind.push(<circle key={K()} cx={sk[0]} cy={sk[1]} r={26} fill="#FFFFFF" opacity={0.85} />);
    }
  }
  // rails: far one before the crates, near one (bright, with the steel edge) after
  const rail = (z: number, into: React.ReactNode[], gl: React.ReactNode[], near: boolean) => {
    if (bDeck <= 0.01) return;
    const s = seg(b, [xa, deckY + 0.04, z], [lerp(xa, xbDeck, Math.max(bRail, 0.0001)), deckY + 0.04, z]);
    if (!s) return;
    into.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={near ? '#F2FEFF' : '#E4FDFF'} strokeWidth={near ? 3.5 : 2.5} strokeLinecap="round" opacity={bRail} />);
    gl.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={PAL.info} strokeWidth={(near ? 14 : 10) + 6 * bw} strokeLinecap="round" opacity={(near ? 0.75 : 0.55) * glowK * bRail} />);
  };
  rail(-nearZ, bridge.base, gBehind, false);
  bridge.base.push(<GlowPair key="gbh" uid={uid} items={gBehind} />);
  // crates, far to near
  const sorted = [...crates].sort((p, q) => depth([q.x, deckY, q.z]) - depth([p.x, deckY, p.z]));
  for (const cr of sorted) {
    const bx: Box = {x0: cr.x - cr.s / 2, x1: cr.x + cr.s / 2, y0: deckY, y1: deckY + cr.h, z0: cr.z - cr.s / 2, z1: cr.z + cr.s / 2};
    const dep = depth([cr.x, deckY, cr.z]);
    const sl = cr.hero ? 3.2 : 1.6;
    const st: V3[] = [
      [bx.x0 - sl, deckY + 0.006, cr.z - cr.s * 0.32],
      [bx.x0, deckY + 0.006, cr.z - cr.s * 0.32],
      [bx.x0, deckY + 0.006, cr.z + cr.s * 0.32],
      [bx.x0 - sl, deckY + 0.006, cr.z + cr.s * 0.32],
    ];
    const pa = project(b, [bx.x0, deckY, cr.z]);
    const pz = project(b, [bx.x0 - sl, deckY, cr.z]);
    if (pa && pz && cr.u <= 1) {
      const gr = lineGrad(c, pa, pz, PAL.info, 0.8 * cr.op, 0);
      bridge.base.push(<Poly key={K()} d={D(st)} fill={gr} />);
    }
    const lbl = cr.hero ? (props.heroCrate?.label ?? crateLabel) : crateLabel;
    bridge.base.push(
      <Crate key={K()} b={b} x={cr.x} z={cr.z} y={deckY} s={cr.s} h={cr.h} op={cr.op} label={lbl} labelColor={labelColor} hero={cr.hero} drawn={props.drawnCrates} glowFilter={`${uid}-gA`} tint={(col) => fogged(col, dep)} />,
    );
    // the arrival flash at the die
    if (cr.u > 0.96 && cr.u < 1.15) {
      const fl = Math.max(0, 1 - Math.abs(cr.u - 1.02) / 0.08);
      const q = project(b, [xb - 0.2, deckY + cr.h * 0.5, cr.z]);
      if (q && fl > 0.02) {
        const r = Math.min(110, pxPerUnit(b, [xb, deckY, cr.z]) * cr.s * 0.7);
        bridge.glow.push(<circle key={K()} cx={q[0]} cy={q[1]} r={r} fill="#E8FDFF" opacity={0.5 * fl} />);
      }
    }
  }
  rail(nearZ, bridge.over, bridge.glow, true);

  // floating tag over the bridge (wide shots, when crates are small)
  if (crateLabel && bDeck >= 1) {
    const ppu = pxPerUnit(b, [(xa + xb) / 2, deckY, 0]);
    const crPx = ppu * cS;
    const tagOp = clamp01((140 - crPx) / 30) * bRail;
    if (tagOp > 0.01) {
      const tip = project(b, [(xa + xb) / 2, deckY + cH + 0.15, 0]);
      if (tip) {
        const ty = tip[1] - 110;
        bridge.over.push(<line key={K()} x1={tip[0]} y1={tip[1]} x2={tip[0]} y2={ty + 30} stroke={PAL.annotation} strokeWidth={3} opacity={tagOp} />);
        bridge.over.push(<circle key={K()} cx={tip[0]} cy={tip[1]} r={6} fill={PAL.info} opacity={tagOp} />);
        html.push(
          <div
            key={K()}
            style={{
              position: 'absolute',
              left: tip[0],
              top: ty,
              transform: 'translate(-50%, -50%)',
              padding: '8px 26px',
              borderRadius: 16,
              background: 'rgba(7,11,21,0.9)',
              border: `3px solid ${rgba(labelColor, 0.85)}`,
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1.1,
              color: labelColor,
              whiteSpace: 'nowrap',
              opacity: tagOp,
              boxShadow: `0 0 26px ${rgba(labelColor, 0.35)}, 0 12px 30px rgba(0,0,0,0.5)`,
            }}
          >
            <Rich text={crateLabel} weight={700} />
          </div>,
        );
      }
    }
  }

  // ---------- highlight
  if (highlight) {
    const boxes: Box[] =
      highlight === 'tower'
        ? [{x0: T.x0 - 0.15, x1: T.x1 + 0.15, y0: 0, y1: TOWER_H + 0.1, z0: T.z0 - 0.15, z1: T.z1 + 0.15}]
        : highlight === 'die'
          ? [{x0: DIEX.x0 - 0.1, x1: DIEX.x1 + 0.1, y0: 0, y1: DIEX.h + 0.1, z0: DIEX.z0 - 0.1, z1: DIEX.z1 + 0.1}]
          : highlight === 'bridge'
            ? [{x0: xa, x1: xb, y0: deckY - 0.25, y1: deckY + 0.6, z0: -Wd / 2 - 0.15, z1: Wd / 2 + 0.15}]
            : highlight === 'crates'
              ? crates.filter((q) => q.u < 1).map((q) => ({x0: q.x - q.s / 2 - 0.08, x1: q.x + q.s / 2 + 0.08, y0: deckY, y1: deckY + q.h + 0.08, z0: q.z - q.s / 2 - 0.08, z1: q.z + q.s / 2 + 0.08}))
              : highlight === 'cache'
                ? [{x0: DIEX.x0 + FACE.cache[0] - 0.1, x1: DIEX.x0 + FACE.cache[2] + 0.1, y0: FACE.cache[1] - 0.1, y1: FACE.cache[3] + 0.1, z0: DIEX.z1, z1: DIEX.z1 + 0.05}]
                : [{x0: DIEX.x0 + FACE.power[0] - 0.35, x1: DIEX.x0 + FACE.power[2] + 0.12, y0: FACE.power[1] - 0.12, y1: FACE.power[3] + 0.12, z0: DIEX.z1, z1: DIEX.z1 + 0.05}];
    const pulse = 0.7 + 0.3 * Math.sin((TAU * f) / 40);
    for (const bx of boxes) {
      const pts = boxCorners(bx)
        .map((p) => project(b, p))
        .filter((q): q is [number, number] => q !== null);
      if (pts.length < 3) continue;
      const h = hull(pts);
      const d = `M${h.map((q) => q.map((v) => v.toFixed(1)).join(' ')).join(' L')} Z`;
      const g = highlight === 'tower' ? tower : highlight === 'bridge' || highlight === 'crates' ? bridge : die;
      g.over.push(<path key={K()} d={d} fill="none" stroke={highlightColor} strokeWidth={4} strokeLinejoin="round" opacity={pulse} />);
      g.glow.push(<path key={K()} d={d} fill="none" stroke={highlightColor === PAL.ink ? PAL.info : highlightColor} strokeWidth={12} opacity={0.7 * pulse} />);
    }
  }

  // ---------- dust in the volume
  const dust: React.ReactNode[] = [];
  for (let i = 0; i < 46; i++) {
    const p0: V3 = [rr(`bd-x${i}`, -16, 16), rr(`bd-y${i}`, 0.4, 8), rr(`bd-z${i}`, -14, 7)];
    const p: V3 = [((p0[0] + f * 0.006 * (1 + rnd(`bd-v${i}`)) + 16) % 32) - 16, p0[1] + 0.25 * Math.sin((TAU * f) / (200 + i * 7) + i), p0[2]];
    const q = project(b, p);
    if (!q) continue;
    const z = depth(p);
    const r = clamp((b.focal / z) * 0.022, 0.8, 7);
    dust.push(<circle key={K()} cx={q[0]} cy={q[1]} r={r} fill="#9CC8FF" opacity={clamp(0.5 - z / 80, 0.08, 0.45) * (0.6 + 0.4 * Math.sin(f / 23 + i))} />);
  }

  // ---------- depth of field and painter's order
  const dofK = clamp01((20 - cam.dist) / 12) * (props.dof ?? 1);
  const blurFor = (dep: number) => Math.round(clamp(dofK * Math.abs(1 - dep / cam.dist) * 10, 0, 6) * 2) / 2;
  tower.blur = blurFor(towerDep);
  bridge.blur = blurFor(bridgeDep);
  die.blur = blurFor(dieDep);
  const order = cam.yaw >= 0 ? [tower, bridge, die] : [die, bridge, tower];
  const bgBlur = Math.round(Math.max(0.5, dofK * 3) * 2) / 2;
  const rayP = project(b, [(xa + xb) / 2 + 3, 9, -4]);
  const Defs = (
    <defs>
      <filter id={`${uid}-gA`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={5} />
      </filter>
      <filter id={`${uid}-gB`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={18} />
      </filter>
      <radialGradient id={`${uid}-ball`} cx="0.35" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#FFF3C8" />
        <stop offset="0.45" stopColor="#D9A441" />
        <stop offset="1" stopColor="#6B4A16" />
      </radialGradient>
    </defs>
  );
  const svgStyle: React.CSSProperties = {position: 'absolute', left: 0, top: 0, overflow: 'visible'};
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, overflow: 'hidden'}}>
      <div style={{position: 'absolute', inset: 0, filter: bgBlur > 0 ? `blur(${bgBlur}px)` : undefined}}>
        <svg width={1920} height={1080} style={svgStyle}>
          {Defs}
          <defs>{c.defs}</defs>
          {bg}
          <GlowPair uid={uid} items={bgGlow} />
        </svg>
        {banks}
        <svg width={1920} height={1080} style={svgStyle}>
          {haze}
        </svg>
      </div>
      {order.map((g) => (
        <div key={g.id} style={{position: 'absolute', inset: 0, filter: g.blur > 0 ? `blur(${g.blur}px)` : undefined}}>
          <svg width={1920} height={1080} style={svgStyle}>
            {Defs}
            {g.base}
          </svg>
          {g.html}
          <svg width={1920} height={1080} style={svgStyle}>
            {Defs}
            {g.over}
            <GlowPair uid={uid} items={g.glow} />
          </svg>
        </div>
      ))}
      <svg width={1920} height={1080} style={svgStyle}>
        {dust}
      </svg>
      {rayP ? <GodRays frame={f} x={rayP[0]} y={rayP[1] - 200} on={rays} reach={1000} /> : null}
      {html}
    </div>
  );
};

export {TOWER_H};
