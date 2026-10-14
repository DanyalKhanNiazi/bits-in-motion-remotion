// S8 shot F: speculative decoding. A small, fast model (a mini bridge) drafts four guesses into the draft-target rail
// (BIM186); one trip of the big model checks all four at once (✓ ✓ ✓ ✗); the good ones fly into the answer as a
// bundle, the first miss drops into the bin, and the big model adds its own token: "…the ones before it".
import React from 'react';
import {
  BitHead,
  Bridge,
  EASE,
  KineticText,
  Label,
  PAL,
  Prop,
  SPRING,
  Stage,
  basis,
  bridgeAnchors,
  bridgeCam,
  clamp01,
  lerp,
  lightOf,
  polyD,
  project,
  prog,
  propPoint,
  pxPerUnit,
  rgba,
  shadeHex,
  springAt,
  tileW,
  track,
  useFontsReady,
  visibleFaces,
  type Basis,
  type Box,
  type BridgeProps,
  type Cam3,
  type V3,
} from '../../kit';
import {W} from './T';
import {Mark, MiniTile, arcPt} from './common';
import {BIN, PANES, TARGET} from './geo';

const SRC = 'BIM186_T03_draft-target_b' as const;
const c3 = (tx: number, ty: number, tz: number, yaw: number, pitch: number, dist: number): Cam3 => ({tx, ty, tz, yaw, pitch, dist, fov: 30});

const RAIL3: V3 = [1.2, 0.98, 6.6];
const RAIL_W = 9.4;
const ROW = {z: 6.2, cx: 0.4, font: 0.36, gap: 0.14, y1: 6.2, y2: 5.5};
const CONTEXT = ['Each', 'piece', 'depends', 'on'];
const GUESS = ['the', 'ones', 'before', 'that'];
const OWN = 'it';
const ROW_TOKENS = [...CONTEXT, 'the', 'ones', 'before', OWN];
const TILE_U = 0.35; // draft tile font (world units)

// timings
const LAUNCH = (i: number) => W.guesses - 2 + i * 7; // the guesses race out of the small model
const FLY = 9;
const HERO_AT = W.checks - 8;
const HERO_DUR = 24;
const ARRIVE = HERO_AT + HERO_DUR; // one trip: the crate lands, the scan starts
const TICK = 4; // the scan passes one guess every TICK frames: a tick per check, a hard stop on the miss
const CHECK = (i: number) => ARRIVE + 3 + i * TICK;
const STOP = CHECK(3);
const DELIVER = (i: number) => W.deliver + i * 3;
const DFLY = 14;
const DROP = W.disagrees;
const OWN_POP = W.adds;
const OWN_FLY = W.aToken;
const OWN_LAND = W.own;

const specCam = [
  {f: W.aSmall - 14, cam: c3(-4.5, 1.1, 6.9, 2, 7, 7.0)},
  {f: W.guesses - 6, cam: c3(-4.2, 1.12, 6.9, 3, 7, 7.3)},
  {f: W.ahead + 4, cam: c3(-2.35, 1.4, 6.6, 5, 8, 11.3), dur: W.ahead + 4 - (W.guesses - 6)},
  {f: W.allGuesses, cam: c3(1.4, 2.3, 5.5, 7, 9, 13.2), dur: W.allGuesses - W.bigModel + 6},
  {f: W.so, cam: c3(1.6, 2.3, 5.4, 7, 9, 12.6)},
  // wide answer shot: a flatter pitch keeps the conveyor (and the bin) above the bottom 140 px with the answer still in frame
  {f: W.deliver + 4, cam: c3(0.6, 3.0, 5.0, 6, 6, 16.3), dur: 40},
  {f: W.disagrees - 54, cam: c3(0.7, 3.05, 5.0, 6, 6, 15.9)},
  {f: W.disagrees - 4, cam: c3(1.3, 3.0, 5.2, 7, 6, 15.6), dur: 50},
  {f: W.own + 2, cam: c3(0.9, 3.1, 5.0, 6, 6, 15.8), dur: 40},
  {f: W.when + 10, cam: c3(0.8, 3.12, 5.0, 6, 6, 15.4)},
];

export const specBridge = (f: number): BridgeProps => ({
  frame: f,
  view: 'threeQuarter',
  cam: specCam,
  bandwidth: 0.72,
  crateRate: 1.2,
  travel: 30,
  flowUntil: 15000,
  heroCrate: {at: HERO_AT, dur: HERO_DUR, scale: 2.1},
  mathActivity: track(f, [[ARRIVE - 1, 0.3], [ARRIVE + 3, 1], [ARRIVE + 60, 0.7]]),
  highlight: f >= W.bigModel && f < W.bigModel + 40 ? 'die' : null,
});

type P2 = {x: number; y: number; ppu: number};
const P = (b: Basis, p: V3): P2 => {
  const q = project(b, p);
  return {x: q ? q[0] : -9999, y: q ? q[1] : -9999, ppu: pxPerUnit(b, p)};
};

/* ---------------------------------------------------------------- the small, fast model: a mini bridge in 3D */
const MT: Box = {x0: -7.25, x1: -6.4, y0: 0, y1: 1.8, z0: 6.5, z1: 7.3};
const MD: Box = {x0: -5.45, x1: -4.55, y0: 0, y1: 1.35, z0: 6.45, z1: 7.35};
const MDECK = {y: 1.1, z: 6.9, w: 0.22};
const MINI_TRAVEL = 8;
const miniDepart = (i: number) => LAUNCH(i) - MINI_TRAVEL;
const MiniBridge: React.FC<{b: Basis; f: number}> = ({b, f}) => {
  const box = (bx: Box, base: string, top: string, key: string, op = 1) =>
    visibleFaces(b, bx)
      .filter((fc) => fc.key !== 'ny')
      .map((fc) => <path key={`${key}-${fc.key}`} d={polyD(b, fc.pts)} fill={fc.key === 'py' ? top : shadeHex(base, lightOf(fc.n))} stroke="#04070E" strokeWidth={1} opacity={op} />);
  const quad = (pts: V3[], fill: string, key: string, op = 1) => <path key={key} d={polyD(b, pts)} fill={fill} opacity={op} />;
  const nodes: React.ReactNode[] = [];
  const glowN: React.ReactNode[] = [];
  // floor glow under the deck
  const fg = polyD(b, [[MT.x1 - 0.2, 0.01, MDECK.z - 0.7], [MD.x0 + 0.2, 0.01, MDECK.z - 0.7], [MD.x0 + 0.2, 0.01, MDECK.z + 0.7], [MT.x1 - 0.2, 0.01, MDECK.z + 0.7]]);
  glowN.push(<path key="fg" d={fg} fill={PAL.info} opacity={0.35} />);
  // tower: DRAM slabs with gold TSV dashes and a silver lid
  const SL = 7;
  const sh = (MT.y1 - 0.18) / SL;
  for (let i = 0; i < SL; i++) {
    const y0 = 0.06 + i * sh;
    const sl: Box = {x0: MT.x0, x1: MT.x1, y0, y1: y0 + sh * 0.78, z0: MT.z0, z1: MT.z1};
    nodes.push(...box(sl, '#1A2236', '#2A3550', `sl${i}`));
    for (let k = 0; k < 4; k++) {
      const x = MT.x0 + 0.1 + k * ((MT.x1 - MT.x0 - 0.2) / 3);
      nodes.push(quad([[x - 0.02, y0 + 0.03, MT.z1 + 0.004], [x + 0.02, y0 + 0.03, MT.z1 + 0.004], [x + 0.02, y0 + sh * 0.7, MT.z1 + 0.004], [x - 0.02, y0 + sh * 0.7, MT.z1 + 0.004]], PAL.gold, `tsv${i}-${k}`, 0.85));
    }
  }
  nodes.push(...box({x0: MT.x0 - 0.04, x1: MT.x1 + 0.04, y0: MT.y1 - 0.12, y1: MT.y1, z0: MT.z0 - 0.04, z1: MT.z1 + 0.04}, '#8A93A3', '#D9DEE6', 'lid'));
  // deck: a thin luminous plate with bright rails (a small model's narrow bridge)
  const deck: Box = {x0: MT.x1, x1: MD.x0, y0: MDECK.y - 0.05, y1: MDECK.y, z0: MDECK.z - MDECK.w / 2, z1: MDECK.z + MDECK.w / 2};
  nodes.push(...box(deck, '#0A2234', '#0E4A62', 'md'));
  for (const z of [deck.z0, deck.z1]) {
    const r = polyD(b, [[deck.x0, deck.y1 + 0.005, z - 0.012], [deck.x1, deck.y1 + 0.005, z - 0.012], [deck.x1, deck.y1 + 0.005, z + 0.012], [deck.x0, deck.y1 + 0.005, z + 0.012]]);
    nodes.push(<path key={`r${z}`} d={r} fill="#E4FDFF" />);
    glowN.push(<path key={`rg${z}`} d={r} fill={PAL.info} stroke={PAL.info} strokeWidth={6} />);
  }
  for (const x of [deck.x0 + 0.5, deck.x1 - 0.5]) {
    const sg = polyD(b, [[x - 0.02, 0, MDECK.z], [x + 0.02, 0, MDECK.z], [x + 0.02, deck.y0, MDECK.z], [x - 0.02, deck.y0, MDECK.z]]);
    nodes.push(<path key={`leg${x}`} d={sg} fill={PAL.info} opacity={0.6} />);
  }
  // crates zipping across
  for (let i = 0; i < 4; i++) {
    const t = f - miniDepart(i);
    if (t < 0 || t > MINI_TRAVEL + 3) continue;
    const u = clamp01(t / MINI_TRAVEL);
    const sz = 0.2 * (t > MINI_TRAVEL ? 1 - (t - MINI_TRAVEL) / 3 : 1);
    const x = lerp(deck.x0 + 0.15, deck.x1 - 0.15, u);
    const st = polyD(b, [[x - 0.8, MDECK.y + 0.01, MDECK.z - 0.05], [x - sz / 2, MDECK.y + 0.01, MDECK.z - 0.05], [x - sz / 2, MDECK.y + 0.01, MDECK.z + 0.05], [x - 0.8, MDECK.y + 0.01, MDECK.z + 0.05]]);
    glowN.push(<path key={`st${i}`} d={st} fill={PAL.info} opacity={0.8} />);
    nodes.push(...box({x0: x - sz / 2, x1: x + sz / 2, y0: MDECK.y, y1: MDECK.y + sz * 0.8, z0: MDECK.z - sz / 2, z1: MDECK.z + sz / 2}, '#1C2B4A', '#DCE2EA', `c${i}`));
  }
  // die: navy block, silver frame, a 3×3 grid of math tiles and a gold cache column on its face
  nodes.push(...box(MD, '#18233D', '#2C3A58', 'mdie'));
  const flash = Math.max(0, ...[0, 1, 2, 3].map((i) => {
    const t = f - LAUNCH(i);
    return t >= 0 && t < 10 ? 1 - t / 10 : 0;
  }));
  const zf = MD.z1 + 0.004;
  nodes.push(quad([[MD.x0 + 0.06, 0.12, zf], [MD.x1 - 0.06, 0.12, zf], [MD.x1 - 0.06, MD.y1 - 0.08, zf], [MD.x0 + 0.06, MD.y1 - 0.08, zf]], '#C7CDD6', 'frame', 0.9));
  nodes.push(quad([[MD.x0 + 0.1, 0.16, zf + 0.002], [MD.x1 - 0.1, 0.16, zf + 0.002], [MD.x1 - 0.1, MD.y1 - 0.12, zf + 0.002], [MD.x0 + 0.1, MD.y1 - 0.12, zf + 0.002]], '#0E1830', 'inner'));
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 3; c++) {
      const u0 = MD.x0 + 0.14 + c * 0.2;
      const v0 = 0.22 + r * 0.32;
      const hot = (r * 3 + c + Math.floor(f / 3)) % 4 === 0 ? 0.35 : 0;
      nodes.push(quad([[u0, v0, zf + 0.004], [u0 + 0.16, v0, zf + 0.004], [u0 + 0.16, v0 + 0.26, zf + 0.004], [u0, v0 + 0.26, zf + 0.004]], (r + c) % 2 ? PAL.computeBlueHi : '#86DDF2', `g${r}${c}`, 0.5 + 0.5 * Math.min(1, flash + hot)));
    }
  for (let r = 0; r < 4; r++) {
    const u0 = MD.x1 - 0.24;
    const v0 = 0.24 + r * 0.22;
    nodes.push(quad([[u0, v0, zf + 0.004], [u0 + 0.1, v0, zf + 0.004], [u0 + 0.1, v0 + 0.16, zf + 0.004], [u0, v0 + 0.16, zf + 0.004]], PAL.gold, `ca${r}`, 0.9));
  }
  return (
    <>
      <g filter="url(#s8miniglow)" style={{mixBlendMode: 'screen'}}>
        {glowN}
      </g>
      {nodes}
      <g opacity={0.9}>{glowN}</g>
    </>
  );
};

export const SpecScene: React.FC<{frame: number}> = ({frame: f}) => {
  useFontsReady();
  const B = specBridge(f);
  const cam = bridgeCam(B, f);
  const b = basis(cam);
  const an = bridgeAnchors(B, f);
  // rail placement (a billboard standing on the floor)
  const R = P(b, RAIL3);
  const rail = {x: R.x, y: R.y, w: RAIL_W * R.ppu};
  const paneC = (i: number) => {
    const p = PANES[i];
    return propPoint(SRC, rail, (p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2);
  };
  const tgtC = propPoint(SRC, rail, (TARGET.x0 + TARGET.x1) / 2, (TARGET.y0 + TARGET.y1) / 2);
  const binC = propPoint(SRC, rail, (BIN.x0 + BIN.x1) / 2, BIN.mouthY);
  const tileSize = TILE_U * R.ppu;
  const paneTop = (i: number) => propPoint(SRC, rail, (PANES[i].x0 + PANES[i].x1) / 2, PANES[i].y0 - 70);
  // the answer: two lines of billboard tiles floating above the rail (context, then the new pieces)
  const REF = 100;
  const lineLayout = (toks: readonly string[]) => {
    const wU = toks.map((t) => tileW(t, ROW.font * REF) / REF);
    const total = wU.reduce((a, c) => a + c, 0) + ROW.gap * (wU.length - 1);
    let acc = ROW.cx - total / 2;
    return wU.map((w) => {
      const x = acc + w / 2;
      acc += w + ROW.gap;
      return {x, w};
    });
  };
  const L1 = lineLayout(CONTEXT);
  const L2 = lineLayout(ROW_TOKENS.slice(4));
  const rowP = [...L1.map((q) => ({...q, y: ROW.y1})), ...L2.map((q) => ({...q, y: ROW.y2}))];
  const rowAt = (i: number) => {
    const q = P(b, [rowP[i].x, rowP[i].y, ROW.z]);
    return {...q, w: rowP[i].w * q.ppu, size: ROW.font * q.ppu};
  };
  const miniDie = P(b, [(MD.x0 + MD.x1) / 2, MD.y1 + 0.25, (MD.z0 + MD.z1) / 2]);
  const miniMid = P(b, [(MT.x1 + MD.x0) / 2, MDECK.y + 0.1, MDECK.z]);
  // --- answer row tiles
  const row: React.ReactNode[] = [];
  let newest = 3;
  for (let i = 0; i < ROW_TOKENS.length; i++) {
    const q = rowAt(i);
    const landAt = i < 4 ? -1e9 : i < 7 ? DELIVER(i - 4) + DFLY : OWN_LAND;
    const landed = f >= landAt;
    if (landed) newest = Math.max(newest, i);
    const sweep = f >= OWN_LAND + 4 ? Math.exp(-(((f - (OWN_LAND + 4) - i * 2.5) / 4) ** 2)) : 0;
    if (landed) {
      const t = f - landAt;
      const squash = t >= 0 && t < 14 ? 0.06 * Math.exp(-t / 3) * Math.cos(t * 0.9) : 0;
      row.push(<MiniTile key={`r${i}`} x={q.x} y={q.y} text={ROW_TOKENS[i]} size={q.size} w={q.w} scale={1 + squash} rim={Math.max(i === newest ? 1 : 0, sweep, t < 12 && i >= 4 ? 1 - t / 12 : 0)} />);
    } else {
      row.push(<MiniTile key={`r${i}`} x={q.x} y={q.y} text="" size={q.size} w={q.w} slot opacity={0.8 * prog(f, W.so - 10, 14)} />);
    }
  }
  const nq = rowAt(newest);
  // --- draft tiles: fly in, sit in the panes, get checked, then deliver / drop
  const drafts: React.ReactNode[] = [];
  const streaks: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const L = LAUNCH(i);
    if (f < L) continue;
    const pc = paneC(i);
    const u = clamp01((f - L) / FLY);
    const checked = f >= CHECK(i);
    const ok = i < 3;
    if (ok && f >= DELIVER(i)) {
      // flying to the answer row
      const v = clamp01((f - DELIVER(i)) / DFLY);
      if (v >= 1) continue;
      const dst = rowAt(4 + i);
      const p = arcPt(pc, dst, 140, EASE.inOut(v));
      drafts.push(<MiniTile key={`d${i}`} x={p.x} y={p.y} text={GUESS[i]} size={lerp(tileSize, dst.size, v)} rim={1} rot={Math.sin(v * Math.PI) * -6} />);
      continue;
    }
    if (!ok && f >= DROP) {
      // the first miss: popped out and dropped into the bin
      const v = clamp01((f - DROP) / 14);
      const p = arcPt(pc, {x: binC.x, y: binC.y + 0.1 * R.ppu}, 0.9 * R.ppu, EASE.inCubic(v));
      const tb = f - DROP - 14;
      const hop = tb >= 0 ? -Math.abs(Math.sin(tb * 0.55)) * 0.35 * R.ppu * Math.exp(-tb / 4) : 0;
      const sink = clamp01((f - DROP - 22) / 6);
      if (tb >= 0 && tb < 14) streaks.push(<circle key="puff" cx={binC.x} cy={binC.y} r={0.3 * R.ppu + tb * 0.09 * R.ppu} fill="none" stroke={PAL.wait} strokeWidth={5} opacity={0.8 * (1 - tb / 14)} />);
      if (sink >= 1) continue;
      drafts.push(<MiniTile key={`d${i}`} x={p.x} y={p.y + hop + sink * 0.3 * R.ppu} text={GUESS[i]} size={tileSize} bad={1} rot={v * 140 + (tb >= 0 ? 8 * Math.sin(tb) * Math.exp(-tb / 4) : 0)} scale={1 - 0.6 * sink} opacity={1 - sink} />);
      continue;
    }
    const p = u < 1 ? arcPt(miniDie, pc, 1.0 * R.ppu, EASE.out(u)) : pc;
    if (u > 0 && u < 1) {
      const q = arcPt(miniDie, pc, 1.0 * R.ppu, EASE.out(Math.max(0, u - 0.3)));
      streaks.push(<line key={`st${i}`} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke={PAL.info} strokeWidth={tileSize * 0.9} strokeLinecap="round" opacity={0.35 * (1 - u)} />);
      streaks.push(<line key={`sc${i}`} x1={q.x} y1={q.y} x2={p.x} y2={p.y} stroke="#E9FDFF" strokeWidth={4} strokeLinecap="round" opacity={0.8 * (1 - u)} />);
    }
    const land = f - (L + FLY);
    const bounce = land >= 0 && land < 12 ? 0.07 * Math.exp(-land / 3) * Math.cos(land * 0.9) : 0;
    const solid = ok && checked ? prog(f, CHECK(i), 4) : 0;
    const shake = !ok && f >= W.firstOne && f < DROP ? 4 * Math.sin(f * 1.9) : 0;
    drafts.push(
      <MiniTile
        key={`d${i}`}
        x={p.x + shake}
        y={p.y}
        text={GUESS[i]}
        size={tileSize}
        ghost={solid > 0.5 || (!ok && checked) ? 0 : 1}
        rim={ok && checked ? 1 - 0.5 * prog(f, CHECK(i) + 8, 20) : 0}
        bad={!ok && checked ? 1 : 0}
        scale={u < 1 ? lerp(0.5, 1, u) : 1 + bounce + (checked && f - CHECK(i) < 8 ? 0.1 * Math.exp(-(f - CHECK(i)) / 2.5) : 0)}
        rot={u < 1 ? (1 - u) * -20 : 0}
      />,
    );
  }
  // --- own token "it": appears in the target holder, then flies up
  let own: React.ReactNode = null;
  if (f >= OWN_POP && f < OWN_LAND) {
    const sp = springAt(f, OWN_POP, SPRING.slam);
    const v = clamp01((f - OWN_FLY) / (OWN_LAND - OWN_FLY));
    const dst = rowAt(7);
    const p = f < OWN_FLY ? tgtC : arcPt(tgtC, dst, 160, EASE.inOut(v));
    const t = f - OWN_POP;
    if (t < 16) {
      streaks.push(<circle key="slamring" cx={tgtC.x} cy={tgtC.y} r={0.25 * R.ppu + t * 0.12 * R.ppu} fill="none" stroke="#FFFFFF" strokeWidth={6} opacity={0.9 * (1 - t / 16)} />);
      streaks.push(<circle key="slamglow" cx={tgtC.x} cy={tgtC.y} r={0.9 * R.ppu} fill={PAL.info} opacity={0.35 * Math.exp(-t / 4)} />);
    }
    own = <MiniTile x={p.x} y={p.y} text={OWN} size={f < OWN_FLY ? tileSize * 1.2 : lerp(tileSize * 1.2, dst.size, v)} scale={lerp(2.4, 1, Math.min(1, sp))} opacity={clamp01((t + 1) / 2)} rim={1} />;
  }
  // --- the scan: one trip sweeps every guess with a light bar (a tick per check, a hard stop on the miss), then the four
  //     guesses pulse side by side "the way it reads a prompt"
  const p0 = paneC(0);
  const p3 = paneC(3);
  const pitch = (p3.x - p0.x) / 3;
  const scanOn = f >= ARRIVE - 1 && f < STOP + 30;
  const scanX = f <= STOP ? p0.x - 0.75 * pitch + Math.max(0, f - ARRIVE) * (pitch / TICK) : p3.x;
  const stopped = f >= STOP;
  const scanFade = 1 - prog(f, STOP + 18, 12);
  const scanTop = p0.y - tileSize * 2.4;
  const scanBot = p0.y + tileSize * 1.3;
  const scanCol = stopped ? PAL.wait : PAL.info;
  const pulse2 = f >= W.readsPrompt - 4 && f < W.readsPrompt + 30 ? Math.sin(Math.PI * clamp01((f - W.readsPrompt + 4) / 34)) : 0;
  const beams = (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <filter id="s8beam" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
        <linearGradient id="s8scan" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={scanCol} stopOpacity={0} />
          <stop offset="0.5" stopColor={scanCol} stopOpacity={0.55} />
          <stop offset="1" stopColor={scanCol} stopOpacity={0} />
        </linearGradient>
      </defs>
      {scanOn ? (
        <g opacity={scanFade * clamp01((f - ARRIVE + 2) / 3)}>
          <path d={`M ${an.die.x} ${an.die.y} L ${scanX - 0.12 * pitch} ${scanTop} L ${scanX + 0.12 * pitch} ${scanBot} Z`} fill={scanCol} opacity={0.16} />
          <line x1={an.die.x} y1={an.die.y} x2={scanX} y2={(scanTop + scanBot) / 2} stroke={stopped ? PAL.wait : PAL.infoPale} strokeWidth={4} opacity={0.8} />
          <rect x={scanX - 0.45 * pitch} y={scanTop} width={0.9 * pitch} height={scanBot - scanTop} fill="url(#s8scan)" />
          <rect x={scanX - 5} y={scanTop} width={10} height={scanBot - scanTop} rx={5} fill={stopped ? '#FFD9D2' : '#E9FDFF'} />
          <rect x={scanX - 14} y={scanTop} width={28} height={scanBot - scanTop} rx={14} fill={scanCol} opacity={0.6} filter="url(#s8beam)" />
          {stopped ? <rect x={p3.x - 0.5 * pitch} y={scanTop} width={pitch} height={scanBot - scanTop} rx={18} fill="none" stroke={PAL.wait} strokeWidth={6} opacity={(1 - prog(f, STOP + 6, 14)) * 0.95} /> : null}
        </g>
      ) : null}
      {pulse2 > 0.01
        ? [0, 1, 2, 3].map((i) => {
            const pc = paneC(i);
            return (
              <g key={i} opacity={pulse2 * (0.85 + 0.15 * Math.sin(f * 0.9 + i))}>
                <line x1={an.die.x} y1={an.die.y} x2={pc.x} y2={pc.y - tileSize * 0.8} stroke={PAL.info} strokeWidth={18} opacity={0.45} filter="url(#s8beam)" />
                <line x1={an.die.x} y1={an.die.y} x2={pc.x} y2={pc.y - tileSize * 0.8} stroke={PAL.infoPale} strokeWidth={4} />
                <circle cx={pc.x} cy={pc.y - tileSize * 0.8} r={14} fill="#E9FDFF" />
              </g>
            );
          })
        : null}
    </svg>
  );
  // --- marks over the panes
  const marks = [0, 1, 2, 3].map((i) => {
    const t = paneTop(i);
    return <Mark key={`m${i}`} frame={f} at={CHECK(i)} x={t.x} y={t.y} ok={i < 3} size={Math.max(56, (i < 3 ? 0.44 : 0.52) * R.ppu)} exitAt={i < 3 ? DELIVER(i) - 2 : DROP + 2} />;
  });
  // --- labels
  const keptA = rowAt(4);
  const keptB = rowAt(6);
  const keptIn = prog(f, W.keeps - 2, 10, EASE.out) * (1 - prog(f, W.adds + 4, 8));
  const hud = (
    <>
      <Label frame={f} at={W.small} size={60} text="Small, fast model" x={miniMid.x + 70} y={Math.max(150, miniMid.y - 250)} to={{x: miniMid.x, y: miniMid.y - 10}} exitAt={W.bigModel + 8} />
      <Label frame={f} at={W.bigModel} size={60} text="Big model" x={an.dieTop.x - 60} y={Math.max(120, an.dieTop.y - 80)} to={an.dieTop} side="left" exitAt={W.oneRun - 6} />
      <KineticText frame={f} at={W.oneRun} text="All in one run" x={830} y={168} size={88} mode="slam" exitAt={W.so - 6} />
      <KineticText frame={f} at={W.readsPrompt} text="like reading a prompt" x={830} y={266} size={64} mode="rise" color={PAL.infoPale} exitAt={W.so + 8} />
      <KineticText frame={f} at={W.severalPieces} text="One trip →" x={1575} y={140} size={64} mode="slam" exitAt={W.it + 12} />
      <KineticText frame={f} at={W.severalPieces + 4} text="several pieces" x={1575} y={218} size={64} mode="slam" exitAt={W.it + 12} />
      {keptIn > 0.01 ? (
        <div style={{position: 'absolute', left: keptA.x - keptA.w / 2, top: keptA.y + keptA.size * 1.05, width: keptB.x + keptB.w / 2 - (keptA.x - keptA.w / 2), height: 8, borderRadius: 4, background: PAL.info, boxShadow: `0 0 18px ${rgba(PAL.info, 0.8)}`, transform: `scaleX(${keptIn})`, transformOrigin: '0 50%'}} />
      ) : null}
      <KineticText frame={f} at={W.keeps} text="Kept" x={(keptA.x + keptB.x) / 2} y={keptA.y + keptA.size * 1.05 + 56} size={66} mode="pop" color={PAL.infoPale} exitAt={W.adds + 4} />
      <Label frame={f} at={DROP + 8} size={60} text="Dropped" x={Math.min(binC.x + 40, 1500)} y={binC.y - 1.55 * R.ppu} to={{x: binC.x, y: binC.y}} exitAt={OWN_LAND} />
      <Label frame={f} at={OWN_POP} size={60} text="Its own token" x={tgtC.x - 60} y={tgtC.y - 1.5 * R.ppu} to={{x: tgtC.x, y: tgtC.y - 0.35 * R.ppu}} side="left" />
    </>
  );
  return (
    <Stage frame={f} env="none" drift={0} hud={hud} shake={[{at: ARRIVE + 1, strength: 0.5}, {at: STOP + 1, strength: 0.75}, {at: OWN_POP + 2, strength: 0.55}, {at: OWN_LAND + 1, strength: 0.4}]}>
      <Bridge {...B} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id="s8miniglow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={8} />
          </filter>
        </defs>
        <MiniBridge b={b} f={f} />
      </svg>
      <Prop frame={f} src={SRC} x={rail.x} y={rail.y} w={rail.w} rim={{color: PAL.info, strength: 0.35}} shadow={{opacity: 0.65, w: 0.95}} sweep={{at: [W.readsPrompt - 4], dur: 26, strength: 0.6}} highlight={f >= OWN_POP - 2 ? [{region: {shape: 'rect', x: TARGET.x0, y: TARGET.y0, w: TARGET.x1 - TARGET.x0, h: TARGET.y1 - TARGET.y0, r: 10}, at: OWN_POP - 2, until: OWN_LAND + 6}] : undefined} />
      {beams}
      {row}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {streaks}
      </svg>
      {drafts}
      {own}
      {marks}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <BitHead x={nq.x} y={nq.y - nq.size * 1.25 + Math.sin(f / 7) * 3} size={Math.max(16, nq.size * 0.36)} gid="s8specbit" />
      </svg>
    </Stage>
  );
};
