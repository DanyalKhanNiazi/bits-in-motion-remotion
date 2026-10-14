/**
 * S5 · P11 shots: the GPU's own memory (VRAM), the tiny on-chip storage, the math on the chip, THE BRIDGE reveal,
 * 32 layers, and ≈16 GB crossing for every token.
 */
import React from 'react';
import {
  Bridge,
  SET,
  bridgeCam,
  faceQuad,
  DirBlurFilter,
  EASE,
  KineticText,
  Label,
  MONO,
  PAL,
  Prop,
  REGIONS,
  SPRING,
  Stage,
  TAU,
  TokenTile,
  tileW,
  basis,
  bridgeAnchors,
  clamp,
  clamp01,
  dirBlurStd,
  lerp,
  lightOf,
  mixHex,
  nz,
  poseAt,
  polyD,
  project,
  propPoint,
  prog,
  quadMatrix,
  regionCenter,
  rgba,
  rnd,
  safeId,
  shadeHex,
  springAt,
  toCam,
  toScreen,
  visibleFaces,
  type Box,
  type BridgeProps,
  type Cam3,
  type CamKey,
  type Region,
  type V3,
} from '../../kit';
import {B} from './anchors';
import {Crate3D, Flare, stepAt} from './parts';
import {MathCells} from './assetBridge';

/* ================================================================ SH7 · the GPU: weights sit in the card's own memory */
const GPU_SRC = 'BIM129_T03_datacenter-gpu_a' as const;
const GPU = {x: 960, y: 590, w: 1000};
const DIE_C = regionCenter(REGIONS.gpuA_die);
const gpuDie = propPoint(GPU_SRC, GPU, DIE_C.x, DIE_C.y);
const hbmPts = REGIONS.gpuA_hbm.map((r) => {
  const c = regionCenter(r);
  return propPoint(GPU_SRC, GPU, c.x, c.y);
});
export const camGpu = (): CamKey[] => [
  {f: B.on - 8, x: 960, y: 560, zoom: 1.0},
  {f: B.because - 4, x: 975, y: 548, zoom: 1.06, dur: 150},
  {f: B.farTooBig - 4, x: gpuDie.x, y: gpuDie.y, zoom: 2.3, dur: 22, ease: 'inExpo'},
];
export const GPU_DIE_WORLD = gpuDie;

export const shGpu = (f: number) => {
  const cam = camGpu();
  const pose = poseAt(f, cam);
  const target = toScreen(pose, hbmPts[2].x, hbmPts[2].y);
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 60}}
      cam={cam}
      shake={[{at: B.gpu + 1, strength: 0.7}]}
      hud={
        <>
          <Label frame={f} at={B.cards} exitAt={B.because + 2} text="The card's own memory" size={64} screen x={1010} y={176} to={target} />
          <KineticText frame={f} at={B.vram} exitAt={B.because + 4} text="VRAM" mode="slam" x={1560} y={300} size={110} color={PAL.info} />
        </>
      }
    >
      <Prop
        frame={f}
        src={GPU_SRC}
        {...GPU}
        tiltX={6}
        enter={{kind: 'drop', at: B.on - 8, dur: 22, dist: 700}}
        rim={{color: PAL.info, strength: 0.4}}
        sweep={{at: [B.gpu + 4, B.cards - 2], dur: 28}}
        shadow={0.65}
        float={3}
        highlight={[{region: REGIONS.gpuA_hbm, at: B.sit + 2, until: B.because + 8}]}
      />
      {/* the weights drop into the eight memory stacks */}
      {hbmPts.map((p, i) => {
        const t0 = B.weights - 6 + i * 2;
        const t = prog(f, t0, 14, EASE.inCubic);
        if (f < t0 || f > t0 + 40) return null;
        const land = f - (t0 + 14);
        const y = lerp(p.y - 520, p.y, t);
        const op = land < 0 ? clamp01((f - t0) / 4) : Math.exp(-land / 6);
        const s = 34;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: p.x - s / 2,
                top: y - s / 2,
                width: s,
                height: s,
                borderRadius: 7,
                background: `linear-gradient(180deg, #FFFFFF, ${PAL.infoPale})`,
                boxShadow: `0 0 22px ${rgba(PAL.info, 0.9)}, 0 ${-60 * (1 - t)}px 40px ${rgba(PAL.info, 0.35)}`,
                opacity: op,
              }}
            />
            {land >= 0 && land < 18 ? (
              <div
                style={{
                  position: 'absolute',
                  left: p.x - 60 - land * 3,
                  top: p.y - 30 - land * 1.5,
                  width: 120 + land * 6,
                  height: 60 + land * 3,
                  borderRadius: '50%',
                  border: `3px solid ${rgba(PAL.info, 0.8 * (1 - land / 18))}`,
                }}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </Stage>
  );
};

/* ================================================================ SH8–9 · inside the chip: tiny storage, the math */
const MAC_SRC = 'BIM141_T03_compute-cache_a' as const;
const MAC = {x: 960, y: 575, w: 1250};
const CACHE: Region = {
  shape: 'poly',
  pts: [
    [960, 330],
    [1098, 298],
    [1213, 512],
    [1057, 550],
  ],
};
const COMPUTE_Q = [
  [268, 330],
  [848, 188],
  [1072, 640],
  [440, 805],
] as const;
const COMPUTE: Region = {shape: 'poly', pts: COMPUTE_Q};
const cacheW = (() => {
  const c = regionCenter(CACHE);
  return propPoint(MAC_SRC, MAC, c.x, c.y);
})();
const computeW = (() => {
  const c = regionCenter(COMPUTE);
  return propPoint(MAC_SRC, MAC, c.x, c.y);
})();
export const COMPUTE_WORLD = computeW;

export const camMacro = (): CamKey[] => [
  {f: B.farTooBig - 6, x: 980, y: 520, zoom: 0.98},
  {f: B.tiny + 10, x: 1020, y: 500, zoom: 0.92, dur: 40},
  {f: B.but + 6, x: 1060, y: 520, zoom: 1.0, dur: 44},
  {f: B.so, x: computeW.x + 40, y: computeW.y, zoom: 1.12, dur: 60},
  {f: B.picture + 4, x: computeW.x, y: computeW.y, zoom: 2.6, dur: B.picture + 4 - B.so + 8, ease: 'inCubic'},
];

const quadM = (w: number, h: number, q: readonly (readonly [number, number])[]) => quadMatrix(w, h, q as unknown as Parameters<typeof quadMatrix>[2]);

export const shMacro = (f: number) => {
  const cam = camMacro();
  const pose = poseAt(f, cam);
  const cacheS = toScreen(pose, cacheW.x, cacheW.y);
  const compS = toScreen(pose, computeW.x, computeW.y);
  // the crate: drops in on "far too big", tries the cache, bounces, lifts away on "but"
  const drop = springAt(f, B.farTooBig, SPRING.heavy);
  const tryIn = prog(f, B.storage + 4, 12, EASE.inCubic) * (1 - prog(f, B.storage + 16, 10, EASE.out));
  const lift = prog(f, B.but - 2, 18, EASE.inCubic);
  const crateX = cacheW.x + 120;
  const crateY = lerp(-420, cacheW.y - 300, Math.min(1.05, drop)) + 70 * tryIn - 900 * lift;
  const alert = clamp01(prog(f, B.storage + 14, 6) - prog(f, B.but, 10)) * (0.7 + 0.3 * Math.sin((TAU * f) / 14));
  const mathOn = prog(f, B.math - 4, 14);
  const rush = prog(f, B.so - 4, B.picture + 4 - B.so, EASE.inCubic);
  return (
    <Stage
      frame={f}
      env={{kind: 'chip', pulses: 1 + rush, dust: 50}}
      cam={cam}
      shake={[{at: B.farTooBig + 10, strength: 0.9}]}
      hud={
        <>
          <KineticText frame={f} at={B.farTooBig + 2} exitAt={B.but + 4} text="Far too big" mode="slam" x={470} y={170} size={96} color={PAL.wait} accent={PAL.wait} />
          <Label frame={f} at={B.tiny} exitAt={B.but + 4} text="Tiny on-chip storage" size={64} screen x={cacheS.x - 40} y={866} to={{x: cacheS.x, y: cacheS.y + 40}} side="left" />
          <Label frame={f} at={B.math} exitAt={B.so + 6} text="The math happens here" size={64} screen x={Math.min(compS.x + 140, 1040)} y={866} to={compS} />
          {/* build-up light: the chip floods with light toward the reveal */}
          {rush > 0.01 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at ${compS.x}px ${compS.y}px, ${rgba('#FFFFFF', 0.5 * rush * rush)}, ${rgba(PAL.info, 0.35 * rush)} 22%, rgba(0,0,0,0) 62%)`,
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
        </>
      }
    >
      <Prop
        frame={f}
        src={MAC_SRC}
        {...MAC}
        tiltX={5}
        rim={{color: '#9CC8FF', strength: 0.35}}
        sweep={{at: [B.farTooBig + 6, B.math + 2], dur: 30}}
        shadow={0.5}
        highlight={[
          {region: CACHE, at: B.tiny, until: B.but + 6},
          {region: COMPUTE, at: B.math, until: B.picture + 10, mode: 'outline'},
        ]}
      >
        <MathCells frame={f} on={mathOn} rush={rush} from={B.math} />
      </Prop>
      {f >= B.farTooBig - 2 && lift < 1 ? (
        <Crate3D frame={f} x={crateX} y={crateY} w={600} yaw={30} pitch={24} label="≈16 GB" alert={alert} glow={0.8} />
      ) : null}
    </Stage>
  );
};

/* ================================================================ SH10 · THE BRIDGE: a true crane-up from below the deck */
const REVEAL = {build: B.picture - 2, dur: 76};
export const REVEAL_CONNECT = REVEAL.build + Math.round(REVEAL.dur * 0.8);
const flowStart = B.weightsW;
const revealCam: BridgeProps['cam'] = [
  {f: B.picture - 4, cam: {tx: -0.2, ty: 2.3, tz: 0.6, yaw: 8, pitch: -9, dist: 10.5, fov: 40}},
  {f: REVEAL_CONNECT, cam: {tx: 0.0, ty: 2.45, tz: 0.4, yaw: 15, pitch: -1.5, dist: 15, fov: 36}, dur: REVEAL_CONNECT - (B.picture - 4), ease: EASE.inOut},
  {f: B.memoryWord + 6, cam: {tx: 0.4, ty: 2.6, tz: 0.2, yaw: 25, pitch: 13, dist: 20, fov: 32}, dur: B.memoryWord + 6 - REVEAL_CONNECT, ease: EASE.inOut},
  {f: B.theWeights, cam: {tx: 0.45, ty: 2.5, tz: 0, yaw: 32, pitch: 19, dist: 22, fov: 30}, dur: B.theWeights - B.memoryWord - 6},
  {f: B.reachEnd + 14, cam: {tx: -0.6, ty: 2.85, tz: 0.3, yaw: 38, pitch: 16, dist: 11.5, fov: 30}, dur: 50},
  {f: B.model + 20, cam: {tx: 0.2, ty: 2.95, tz: 0.3, yaw: 41, pitch: 15, dist: 10, fov: 30}, dur: 30},
];
const REV_BW = 0.8;
export const revealProps = (f: number): Omit<BridgeProps, 'frame'> =>
  f < flowStart - 10
    ? {view: 'threeQuarter', cam: revealCam, build: {at: REVEAL.build, dur: REVEAL.dur}, flowUntil: REVEAL.build - 10, bandwidth: REV_BW, mathActivity: 0.85, crateScale: 1.6, rays: [[REVEAL_CONNECT - 12, 0.2], [REVEAL_CONNECT + 24, 1]]}
    : {view: 'threeQuarter', cam: revealCam, flowFrom: flowStart, bandwidth: REV_BW, crateRate: 2.2, travel: 38, mathActivity: 0.85, crateScale: 1.6, rays: 0.9};

/**
 * A substantial deck: a steel box girder under the glass, its underside (seen while the camera is below the deck)
 * and two heavy pylons, projected with the Bridge's own camera so they sit exactly under the kit deck.
 */
const DeckStructure: React.FC<{frame: number; props: Omit<BridgeProps, 'frame'>; bw: number; build?: {at: number; dur: number}}> = ({frame: f, props, bw, build}) => {
  const uid = safeId(React.useId());
  const Bp = build ? prog(f, build.at, build.dur) : 1;
  const bDeck = EASE.inOut(clamp01((Bp - 0.52) / 0.28));
  if (bDeck <= 0.01) return null;
  const b = basis(bridgeCam(props, f));
  const xa = SET.tower.x1;
  const xb = SET.die.x0;
  const xbDeck = lerp(xa, xb, bDeck);
  const Wd = lerp(1.0, 3.4, bw);
  const top = SET.deckY - SET.deckT;
  const G = 0.5;
  const D = (pts: readonly V3[]) => polyD(b, pts);
  const nodes: React.ReactNode[] = [];
  const glow: React.ReactNode[] = [];
  let k = 0;
  const below = b.pos[1] < top - 0.02;
  // pylons: heavy steel casings around the kit's stick legs
  for (const px of [-1.7, 1.2]) {
    if (px > xbDeck - 0.2) continue;
    const box: Box = {x0: px - 0.34, x1: px + 0.34, y0: 0, y1: top - G, z0: -0.34, z1: 0.34};
    for (const fc of visibleFaces(b, box)) {
      if (fc.key === 'ny' || fc.key === 'py') continue;
      const L = lightOf(fc.n);
      nodes.push(<path key={k++} d={D(fc.pts)} fill={shadeHex('#1B2638', L)} stroke="#4A5B78" strokeWidth={1} strokeOpacity={0.5} />);
      if (fc.key === 'pz' || fc.key === 'px') {
        const q = faceQuad(fc, 0.3, 0.25, 0.38, top - G - 0.25, 0.01);
        nodes.push(<path key={k++} d={D(q)} fill={PAL.info} opacity={0.85} />);
        glow.push(<path key={k++} d={D(q)} fill={PAL.info} opacity={0.7} />);
      }
    }
  }
  // the box girder (flush with the deck's edges), stopping short of the die
  const gx1 = Math.min(xbDeck, xb - 0.55);
  if (gx1 > xa + 0.3) {
    const girder: Box = {x0: xa + 0.15, x1: gx1, y0: top - G, y1: top, z0: -Wd / 2, z1: Wd / 2};
    for (const fc of visibleFaces(b, girder)) {
      if (fc.key === 'py') continue;
      const L = lightOf(fc.n);
      if (fc.key === 'ny') {
        // the underside: dark steel with ribs and a lit spine
        nodes.push(<path key={k++} d={D(fc.pts)} fill={shadeHex('#121A2A', L)} />);
        for (let x = xa + 0.6; x < gx1 - 0.2; x += 0.55) {
          const r: V3[] = [
            [x, top - G - 0.004, -Wd / 2],
            [x + 0.06, top - G - 0.004, -Wd / 2],
            [x + 0.06, top - G - 0.004, Wd / 2],
            [x, top - G - 0.004, Wd / 2],
          ];
          nodes.push(<path key={k++} d={D(r)} fill="#2E3B52" />);
        }
        const sp: V3[] = [
          [xa + 0.3, top - G - 0.006, -0.08],
          [gx1 - 0.1, top - G - 0.006, -0.08],
          [gx1 - 0.1, top - G - 0.006, 0.08],
          [xa + 0.3, top - G - 0.006, 0.08],
        ];
        nodes.push(<path key={k++} d={D(sp)} fill={PAL.info} opacity={0.9} />);
        glow.push(<path key={k++} d={D(sp)} fill={PAL.info} opacity={0.8} />);
        continue;
      }
      const grad = `${uid}-st${k}`;
      nodes.push(
        <React.Fragment key={k++}>
          <defs>
            {(() => {
              const pts = fc.pts.map((v) => project(b, v)).filter((q): q is [number, number] => q !== null);
              const ys = pts.map((q) => q[1]);
              const xs = pts.map((q) => q[0]);
              const mx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
              return (
                <linearGradient id={grad} gradientUnits="userSpaceOnUse" x1={mx} y1={ys.length ? Math.min(...ys) : 0} x2={mx} y2={ys.length ? Math.max(...ys) : 1}>
                  <stop offset="0" stopColor={shadeHex('#8E9AAE', L)} />
                  <stop offset="0.3" stopColor={shadeHex('#3A475F', L)} />
                  <stop offset="1" stopColor={shadeHex('#121A2B', L)} />
                </linearGradient>
              );
            })()}
          </defs>
          <path d={D(fc.pts)} fill={`url(#${grad})`} />
        </React.Fragment>,
      );
      if (fc.key === 'pz' || fc.key === 'nz') {
        const len = gx1 - xa - 0.15;
        const q = faceQuad(fc, 0.15, G * 0.42, len - 0.15, G * 0.52, 0.01);
        nodes.push(<path key={k++} d={D(q)} fill={PAL.info} opacity={0.9} />);
        glow.push(<path key={k++} d={D(q)} fill={PAL.info} opacity={0.75} />);
      }
    }
  }
  // the glass deck's own underside while the camera is below it
  if (below) {
    const u: V3[] = [
      [xa, top - 0.003, -Wd / 2],
      [xbDeck, top - 0.003, -Wd / 2],
      [xbDeck, top - 0.003, Wd / 2],
      [xa, top - 0.003, Wd / 2],
    ];
    nodes.unshift(<path key="under" d={D(u)} fill="#0A1626" opacity={0.92} />);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <filter id={`${uid}-g`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      {nodes}
      <g filter={`url(#${uid}-g)`} style={{mixBlendMode: 'screen'}}>
        {glow}
      </g>
    </svg>
  );
};

/** Foreground depth: haze and big soft motes that slide down past the lens as the camera cranes up. */
const Foreground: React.FC<{frame: number; rise: number; on: number}> = ({frame, rise, on}) => {
  if (on <= 0.01) return null;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', opacity: on, overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: -200, right: -200, top: 560 + 700 * rise, height: 640, background: `linear-gradient(180deg, rgba(10,24,48,0), ${rgba('#1A3E6E', 0.55)} 40%, ${rgba('#0A1830', 0.85)})`, filter: 'blur(10px)'}} />
      {Array.from({length: 12}, (_, i) => {
        const r = rnd(`fgm2-${i}`);
        const x = ((r * 2300 + frame * (0.8 + 1.2 * r)) % 2400) - 240;
        const y = 120 + rnd(`fgm2-y-${i}`) * 900 + 1500 * rise - 600;
        const sz = 90 + 200 * rnd(`fgm2-s-${i}`);
        const c = i % 3 === 0 ? PAL.info : '#BFD8FF';
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(c, 0.32)}, ${rgba(c, 0.12)} 60%, rgba(0,0,0,0))`, filter: 'blur(5px)'}} />;
      })}
    </div>
  );
};

export const shReveal = (f: number) => {
  const P = revealProps(f);
  const an = bridgeAnchors(P, f);
  const rise = prog(f, B.picture - 4, B.memoryWord + 6 - (B.picture - 4), EASE.inOut);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      shake={[{at: REVEAL_CONNECT, strength: 0.6}]}
      hud={
        <>
          <Foreground frame={f} rise={rise} on={1 - prog(f, B.theWeights, 30)} />
          <KineticText frame={f} at={B.bridge + 1} exitAt={B.theWeights + 4} text="The bridge" mode="slam" x={1380} y={140} size={118} />
          <Label frame={f} at={B.memoryWord} exitAt={B.theWeights - 4} text="Memory" size={64} screen x={clamp(an.towerTop.x - 40, 420, 900)} y={clamp(an.towerTop.y - 110, 300, 840)} to={an.towerTop} side="left" />
          <Label frame={f} at={B.mathWord} exitAt={B.theWeights - 4} text="Math units" size={64} screen x={clamp(an.dieTop.x + 60, 300, 1400)} y={clamp(an.dieTop.y - 130, 300, 840)} to={an.dieTop} />
          <Label frame={f} at={B.weightsW} exitAt={B.model - 6} text="The weights" size={64} screen x={clamp(an.bridge.x + 60, 300, 1360)} y={clamp(an.bridge.y - 230, 300, 840)} to={an.bridge} />
          <Flare frame={f} at={REVEAL_CONNECT} x={an.bridgeDeck.x} y={an.bridgeDeck.y} len={1900} />
        </>
      }
    >
      <Bridge frame={f} {...P} />
      <DeckStructure frame={f} props={P} bw={REV_BW} build={f < flowStart - 10 ? {at: REVEAL.build, dur: REVEAL.dur} : undefined} />
    </Stage>
  );
};

/* ================================================================ SH11 · 32 layers, the token passes through all of them */
const NL = 32;
const GAP = 0.95;
const PLATE = {z: 1.8, y0: 0.2, y1: 3.8, t: 0.14};
const CELL = 0.56;
const CGAP = 0.1;
const MARG = 0.2;
const layerCam = (f: number): Cam3 => {
  const pass = prog(f, B.newToken, B.allEnd - B.newToken, EASE.inOut);
  const base: Cam3 = {tx: 13.5, ty: 2.0, tz: 0, yaw: -30, pitch: 12, dist: 29, fov: 32};
  const intro = prog(f, B.model - 4, 70, EASE.out);
  return {
    ...base,
    tx: lerp(12.5, 13.8, intro) + lerp(0, 2.2, pass),
    yaw: lerp(-40, -30, intro) + lerp(0, 5, pass) + 1.2 * Math.sin((TAU * f) / 300),
    pitch: lerp(17, 12, intro) + 0.6 * Math.sin((TAU * f) / 240),
    dist: lerp(33, 29, intro) * (1 - 0.05 * pass),
  };
};
const tokenX = (f: number) => lerp(-2.8, NL * GAP + 1.5, prog(f, B.newToken, B.allEnd - B.newToken - 2, (t) => t * t * (3 - 2 * t) * 0.5 + t * 0.5));

const LayerStack: React.FC<{frame: number}> = ({frame: f}) => {
  const uid = safeId(React.useId());
  const cam = layerCam(f);
  const b = basis(cam);
  const D = (pts: readonly V3[]) => polyD(b, pts);
  const tx = tokenX(f);
  const tokenOn = f >= B.every - 2;
  const plates: Array<{dep: number; nodes: React.ReactNode[]; glow: React.ReactNode[]}> = [];
  for (let i = 0; i < NL; i++) {
    const x0 = i * GAP;
    const appear = springAt(f, B.model + 6 + Math.round(i * 1.15), SPRING.snap);
    if (appear <= 0.001) continue;
    const dropY = (1 - Math.min(1, appear)) * -4.5;
    const fill = prog(f, B.eachHolding + 2 + i * 1.3, 8, EASE.out);
    const passed = tokenOn ? tx - x0 : -99;
    const hit = passed > -0.3 && passed < 3 ? Math.exp(-((passed - 0.2) ** 2) / 0.6) : 0;
    const lit = clamp01(hit + (passed > 0 ? 0.25 : 0));
    const nodes: React.ReactNode[] = [];
    const glow: React.ReactNode[] = [];
    let k = 0;
    const box: Box = {x0, x1: x0 + PLATE.t, y0: PLATE.y0 + dropY, y1: PLATE.y1 + dropY, z0: -PLATE.z, z1: PLATE.z};
    const dep = toCam(b, [x0, 2, 0])[2];
    for (const fc of visibleFaces(b, box)) {
      const L = lightOf(fc.n);
      if (fc.key === 'nx' || fc.key === 'px') nodes.push(<path key={k++} d={D(fc.pts)} fill={mixHex(shadeHex('#16233E', L), '#1E4E7A', 0.5 * lit)} stroke={mixHex('#5F7FB0', PAL.info, lit)} strokeWidth={1.5} strokeOpacity={0.7} />);
      else nodes.push(<path key={k++} d={D(fc.pts)} fill={shadeHex('#AEB7C6', L)} />);
    }
    // the cells: a 5×5 grid of weight tiles with the centre left open (the token's way through)
    const face = (fc: 'nx' | 'px') => (fc === 'nx' ? x0 - 0.002 : x0 + PLATE.t + 0.002);
    const fx = b.pos[0] < x0 ? face('nx') : face('px');
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 5; c++) {
        const y0 = PLATE.y0 + dropY + MARG + r * (CELL + CGAP);
        const z0 = -PLATE.z + MARG + c * (CELL + CGAP);
        const q: V3[] = [
          [fx, y0, z0],
          [fx, y0, z0 + CELL],
          [fx, y0 + CELL, z0 + CELL],
          [fx, y0 + CELL, z0],
        ];
        if (r === 2 && c === 2) {
          nodes.push(<path key={k++} d={D(q)} fill={mixHex('#02050B', '#0B3D52', 0.6 + 0.4 * lit)} stroke={PAL.info} strokeWidth={3.5} strokeOpacity={0.75 + 0.25 * lit} />);
          glow.push(<path key={k++} d={D(q)} fill="none" stroke={PAL.info} strokeWidth={8} opacity={0.55 + 0.45 * lit} />);
          continue;
        }
        if (fill <= 0.01) continue;
        const s = fill;
        const cy = y0 + CELL / 2;
        const cz = z0 + CELL / 2;
        const h = (CELL / 2) * s;
        const qq: V3[] = [
          [fx, cy - h, cz - h],
          [fx, cy - h, cz + h],
          [fx, cy + h, cz + h],
          [fx, cy + h, cz - h],
        ];
        const shimmer = 0.5 + 0.5 * Math.sin(f / 7 + r * 1.3 + c * 0.7 + i);
        nodes.push(<path key={k++} d={D(qq)} fill={mixHex((r + c) % 2 ? '#AEB8C7' : '#C3CBD7', '#E8FDFF', 0.6 * lit)} />);
        const bev: V3[] = [
          [fx, cy + h * 0.72, cz - h],
          [fx, cy + h * 0.72, cz + h],
          [fx, cy + h, cz + h],
          [fx, cy + h, cz - h],
        ];
        nodes.push(<path key={k++} d={D(bev)} fill={mixHex('#F2F5F9', '#FFFFFF', lit)} opacity={0.95} />);
        if (lit > 0.05) glow.push(<path key={k++} d={D(qq)} fill={PAL.info} opacity={0.7 * lit * (0.6 + 0.4 * shimmer)} />);
      }
    // cyan edge strip at the base
    const strip: V3[] = [
      [fx, PLATE.y0 + dropY, -PLATE.z],
      [fx, PLATE.y0 + dropY, PLATE.z],
      [fx, PLATE.y0 + dropY + 0.05, PLATE.z],
      [fx, PLATE.y0 + dropY + 0.05, -PLATE.z],
    ];
    nodes.push(<path key={k++} d={D(strip)} fill={PAL.info} opacity={0.8} />);
    glow.push(<path key={k++} d={D(strip)} fill={PAL.info} opacity={0.6} />);
    plates.push({dep, nodes, glow});
  }
  plates.sort((p, q) => q.dep - p.dep);
  // the token: a white tile (with the Bit) travelling through the open centres
  const tok: React.ReactNode[] = [];
  if (tokenOn) {
    const p = project(b, [tx, 2.01, 0]);
    const p2 = project(b, [tx - 0.6, 2.01, 0]);
    const pp = project(b, [tx + 0.3, 2.01, 0]);
    const ppu = pp && p ? Math.hypot(pp[0] - p[0], pp[1] - p[1]) / 0.3 : 60;
    if (p && p2) {
      const s = clamp(ppu * 0.9, 44, 120);
      const a = Math.atan2(p[1] - p2[1], p[0] - p2[0]);
      const tail = clamp(Math.hypot(p[0] - p2[0], p[1] - p2[1]) * 4, 0, 520) * (f >= B.newToken ? 1 : 0.1);
      tok.push(
        <g key="tok">
          <circle cx={p[0]} cy={p[1]} r={s * 1.6} fill={PAL.info} opacity={0.22} />
          <line x1={p[0]} y1={p[1]} x2={p[0] - Math.cos(a) * tail} y2={p[1] - Math.sin(a) * tail} stroke={PAL.info} strokeWidth={s * 0.55} strokeLinecap="round" opacity={0.6} />
          <rect x={p[0] - s / 2} y={p[1] - s * 0.62} width={s} height={s * 1.24} rx={s * 0.22} fill="#F6F7F9" stroke={PAL.info} strokeWidth={3} />
          <circle cx={p[0]} cy={p[1] - s * 1.05} r={s * 0.2} fill={PAL.info} />
        </g>,
      );
    }
  }
  const speed = f >= B.newToken && f <= B.allEnd ? 1 : 0;
  const pv = project(basis(layerCam(f - 1)), [tokenX(f - 1), 2.01, 0]);
  const pc = project(b, [tx, 2.01, 0]);
  const std = speed && pv && pc ? dirBlurStd((pc[0] - pv[0]) * 0.5, (pc[1] - pv[1]) * 0.5, 0.25, 8) : null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <defs>
          <filter id={`${uid}-g`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={6} />
          </filter>
          {std ? <DirBlurFilter id={`${uid}-mb`} std={std} /> : null}
          <radialGradient id={`${uid}-pool`}>
            <stop offset="0" stopColor="#1C6E9C" stopOpacity={0.45} />
            <stop offset="1" stopColor="#1C6E9C" stopOpacity={0} />
          </radialGradient>
        </defs>
        {(() => {
          const c0 = project(b, [NL * GAP * 0.5, 0, 0]);
          return c0 ? <ellipse cx={c0[0]} cy={c0[1]} rx={1100} ry={260} fill={`url(#${uid}-pool)`} /> : null;
        })()}
        <g filter={std ? `url(#${uid}-mb)` : undefined}>
          {plates.map((p, i) => (
            <g key={i}>
              {p.nodes}
              <g filter={`url(#${uid}-g)`} style={{mixBlendMode: 'screen'}}>
                {p.glow}
              </g>
            </g>
          ))}
        </g>
        <g filter={`url(#${uid}-g)`} style={{mixBlendMode: 'screen'}} opacity={0.8}>
          {tok}
        </g>
        {tok}
      </svg>
    </div>
  );
};

/** which layer the token is passing (0 before, 1..32) */
const passedCount = (f: number) => {
  if (f < B.newToken) return 0;
  const tx = tokenX(f);
  return clamp(Math.floor(tx / GAP + 0.85), 0, NL);
};

export const shLayers = (f: number) => {
  const n = passedCount(f);
  return (
    <Stage
      frame={f}
      env={{kind: 'void', dust: 50}}
      drift={0.5}
      hud={
        <>
          <KineticText frame={f} at={B.model + 6} exitAt={B.so2 + 8} text="" mode="count" count={{from: 1, to: 32, dur: B.l32 - B.model - 4, suffix: ' layers'}} x={960} y={150} size={104} />
          <KineticText frame={f} at={B.share - 4} exitAt={B.every - 2} text="Each holds a share" mode="rise" x={960} y={876} size={64} color={PAL.muted} backing="scrim" />
          <KineticText frame={f} at={B.every} exitAt={B.all - 14} text="Every new token" mode="pop" x={960} y={872} size={72} />
          {f >= B.newToken - 2 ? (
            <div
              style={{
                position: 'absolute',
                right: 110,
                top: 150,
                transform: 'translateY(-50%)',
                fontFamily: MONO,
                fontWeight: 500,
                fontSize: 96,
                color: n >= NL ? PAL.info : PAL.ink,
                opacity: prog(f, B.newToken - 2, 6),
                textShadow: n >= NL ? `0 0 24px ${rgba(PAL.info, 0.8)}` : undefined,
              }}
            >
              {String(n).padStart(2, '0')}
              <span style={{color: PAL.muted}}> / 32</span>
            </div>
          ) : null}
          {f >= B.all - 2 ? (
            <KineticText frame={f} at={B.all} exitAt={B.so2 + 8} text="All of them" mode="slam" x={960} y={872} size={84} color={PAL.info} />
          ) : null}
        </>
      }
    >
      <LayerStack frame={f} />
    </Stage>
  );
};

/* ================================================================ SH12 · ≈16 GB crosses for every token */
const HERO = [B.so2 + 16, B.almost + 3, B.everyToken - 32] as const;
const HERO_DUR = 44;
const ANSWER = ['Because', 'a', 'model', 'writes', 'one', 'token'];
const ROW_SIZE = 52;
const ROW_GAP = 14;
export const tokenProps = (f: number): Omit<BridgeProps, 'frame'> => ({
  view: 'threeQuarter',
  cam: [
    {f: B.so2, cam: {tx: 1.6, ty: 2.95, tz: 0.4, yaw: 28, pitch: 16, dist: 13.4, fov: 30}},
    {f: B.tokenEnd + 20, cam: {tx: 2.5, ty: 2.95, tz: 0.4, yaw: 33, pitch: 15, dist: 12.2, fov: 30}, dur: B.tokenEnd + 20 - B.so2, ease: EASE.inOut},
  ],
  bandwidth: 0.8,
  flowFrom: 1e9,
  heroCrate: {at: stepAt(f, HERO.map((h) => [h, h] as const), HERO[0]), dur: HERO_DUR, scale: 2.4, label: '≈16 GB'},
  mathActivity: 0.6,
  rays: 0.5,
});

export const shToken = (f: number) => {
  const P = tokenProps(f);
  const an = bridgeAnchors(P, f);
  const rowY = 236;
  const ws = ANSWER.map((t) => tileW(t, ROW_SIZE));
  const total = ws.reduce((x, y) => x + y, 0) + ROW_GAP * (ws.length - 1);
  const x0 = 1800 - total;
  const xs = ws.map((w, i) => x0 + ws.slice(0, i).reduce((x, y) => x + y + ROW_GAP, 0) + w / 2);
  const arrivals = HERO.map((h) => h + HERO_DUR);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      shake={arrivals.map((a) => ({at: a, strength: 0.5}))}
      hud={
        <>
          <KineticText frame={f} at={B.single} exitAt={B.everyToken - 8} text="One conversation" mode="pop" x={110} y={866} size={72} align="left" backing="plate" />
          <KineticText frame={f} at={B.everyToken} exitAt={B.tokenEnd + 40} text="Every token" mode="slam" x={110} y={858} size={96} align="left" color={PAL.info} backing="plate" />
          {ANSWER.map((t, i) => {
            const isNew = i >= 3;
            const land = isNew ? arrivals[i - 3] + 6 : B.so2 + 2 + i * 3;
            if (f < land - (isNew ? 10 : 0)) return null;
            if (isNew) {
              const u = prog(f, land - 10, 10, EASE.out);
              const x = lerp(an.die.x, xs[i], u);
              const y = lerp(an.die.y, rowY, u) - Math.sin(Math.PI * u) * 80;
              const next = i < ANSWER.length - 1 ? arrivals[i - 2] + 6 : 1e9;
              return <TokenTile key={i} frame={f} text={t} x={x} y={y} size={ROW_SIZE} w={ws[i]} snapAt={land - 10} newest={f < next ? 1 : 0} />;
            }
            return <TokenTile key={i} frame={f} text={t} x={xs[i]} y={rowY} size={ROW_SIZE} w={ws[i]} snapAt={land} />;
          })}
        </>
      }
    >
      <Bridge frame={f} {...P} />
    </Stage>
  );
};
