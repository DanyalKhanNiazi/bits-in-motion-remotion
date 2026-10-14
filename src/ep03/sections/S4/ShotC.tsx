/**
 * S4 shot C: "When the model writes, it can't start on piece 5 until it has picked piece 4."
 * A steel rail of answer tiles: three written, slot 4 spinning through candidate words, slot 5 a ghost padlocked
 * to it. Piece 4 lands, the chain turns cyan, the lock falls, piece 5 starts.
 */
import React from 'react';
import {BitHead, EASE, KineticText, PAL, Stage, TokenTile, clamp01, lerp, prog, rgba, tileH, tileW, useFontsReady, win, type CamKey} from '../../kit';
import {T, X} from './T';
import {Badge, ChainLink, Padlock, ReelTile, blip} from './parts';

const SIZE = 72;
const TH = tileH(SIZE);
const RAIL_Y = 652;
const TILE_Y = RAIL_Y - TH / 2 - 8;
const GAP = 34;
const LINK_GAP = 84;
const DONE = ['Because', 'the', 'model'];
const REEL4 = ['makes', 'types', 'picks', 'writes', 'finds', 'adds', 'sends', 'makes', 'types', 'picks', 'writes'];
const REEL5 = ['one', 'each', 'the', 'a', 'its', 'one', 'each', 'the', 'a', 'its', 'one', 'each', 'the', 'a', 'its'];

/** shot C becomes visible as the ring zoom-through opens */
const C0 = X.ringAt + Math.round(X.ringDur / 2);
/** piece 4 lands on "picked piece" */
const LAND4 = T.picked + 8;
const UNLOCK = T.four + 2;
const START5 = T.four + 8;

const reel4 = (f: number) => {
  const a = C0 - 14;
  const N = REEL4.length - 1;
  if (f < LAND4) {
    const u = clamp01((f - a) / (LAND4 - a));
    return N * (1 - Math.pow(1 - u, 2.4));
  }
  const t = f - LAND4;
  return N + 0.16 * Math.exp(-t / 3) * Math.sin(t * 1.3);
};
const reel5 = (f: number) => {
  if (f < START5) return 0;
  const t = f - START5;
  return Math.min(REEL5.length - 1.01, 0.04 * t * t + 0.2 * t);
};

const layout = () => {
  const ws = [...DONE.map((w) => tileW(w, SIZE)), Math.max(...REEL4.map((w) => tileW(w, SIZE))), Math.max(...REEL5.slice(0, 5).map((w) => tileW(w, SIZE))), tileW('token', SIZE), tileW('at', SIZE)];
  const xs: number[] = [];
  let x = 150;
  ws.forEach((w, i) => {
    xs.push(x + w / 2);
    x += w + (i === 3 ? LINK_GAP : GAP);
  });
  return {ws, xs, end: x};
};

const Rail: React.FC<{x0: number; x1: number; slots: Array<{x: number; w: number}>}> = ({x0, x1, slots}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <defs>
      <linearGradient id="s4c-top" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#DCE2EA" />
        <stop offset="1" stopColor="#8D97A7" />
      </linearGradient>
      <linearGradient id="s4c-front" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3B4556" />
        <stop offset="0.5" stopColor="#222A37" />
        <stop offset="1" stopColor="#141922" />
      </linearGradient>
      <radialGradient id="s4c-floor">
        <stop offset="0" stopColor="#000000" stopOpacity={0.7} />
        <stop offset="1" stopColor="#000000" stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={(x0 + x1) / 2} cy={RAIL_Y + 92} rx={(x1 - x0) * 0.56} ry={40} fill="url(#s4c-floor)" />
    <rect x={x0} y={RAIL_Y} width={x1 - x0} height={16} rx={6} fill="url(#s4c-top)" />
    <rect x={x0} y={RAIL_Y + 14} width={x1 - x0} height={52} rx={8} fill="url(#s4c-front)" />
    <rect x={x0 + 8} y={RAIL_Y + 38} width={x1 - x0 - 16} height={3} rx={1.5} fill={PAL.info} opacity={0.32} />
    {slots.map((s, i) => (
      <g key={i}>
        <rect x={s.x - s.w / 2 + 6} y={RAIL_Y + 2} width={s.w - 12} height={8} rx={4} fill="#5F6979" opacity={0.85} />
        <circle cx={s.x} cy={RAIL_Y + 54} r={4} fill="#596273" />
      </g>
    ))}
    <rect x={x0 - 14} y={RAIL_Y - 6} width={22} height={78} rx={6} fill="#2A3240" stroke="#5B6678" strokeWidth={2} />
    <rect x={x1 - 8} y={RAIL_Y - 6} width={22} height={78} rx={6} fill="#2A3240" stroke="#5B6678" strokeWidth={2} />
  </svg>
);

const ShotC: React.FC<{f: number}> = ({f}) => {
  useFontsReady();
  const L = layout();
  const [x1, x2, x3, x4, x5, x6, x7] = L.xs;
  const w4 = L.ws[3];
  const w5 = L.ws[4];
  const cam: CamKey[] = [
    {f: C0 - 10, x: (x1 + x5) / 2 + 40, y: 566, zoom: 1.03},
    {f: T.five - 4, x: (x3 + x5) / 2 + 30, y: 548, zoom: 1.22, ease: 'inOut'},
    {f: T.four + 16, x: (x4 + x5) / 2 + 30, y: 548, zoom: 1.3, ease: 'inOut'},
  ];
  const p4 = reel4(f);
  const s4 = p4 - reel4(f - 1);
  const p5 = reel5(f);
  const s5 = p5 - reel5(f - 1);
  const landed = f >= LAND4;
  const chainCyan = f >= T.four + 2;
  const chainFlash = blip(f, T.four + 2, 2, 8);
  const lockOpen = prog(f, UNLOCK, 6, EASE.outBack);
  const lockDrop = prog(f, UNLOCK + 6, 12, EASE.inCubic);
  const waitPulse = f < UNLOCK ? 0.5 + 0.5 * Math.sin((f - C0) / 6) : 0;
  const ghostOp = 1 - prog(f, START5 - 2, 5);
  const reel5Op = prog(f, START5 - 2, 5);
  // the Bit: hovers over slot 4 while it spins, drops onto it, then hops toward slot 5
  const hop = prog(f, START5 - 4, 10, EASE.inOut);
  const drop = prog(f, LAND4 - 2, 4, EASE.inCubic);
  const bitX = lerp(x4, x5, hop);
  const bitY = TILE_Y - TH / 2 - lerp(56, 26, drop) - Math.sin(Math.PI * hop) * 60 + (landed ? 0 : 5 * Math.sin(f / 4));
  const linkX = x4 + w4 / 2 + LINK_GAP / 2;
  return (
    <Stage
      frame={f}
      env={{kind: 'void', dust: 40}}
      cam={cam}
      shake={[{at: LAND4, strength: 0.35}]}
      hud={<KineticText frame={f} at={T.five + 2} text="Piece 5 waits for piece 4" mode="pop" x={960} y={196} size={80} />}
    >
      {/* key light pool */}
      <div style={{position: 'absolute', left: x4 - 900, top: RAIL_Y - 520, width: 1800, height: 900, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#2B4A7A', 0.35)}, rgba(0,0,0,0))`}} />
      <Rail x0={60} x1={L.end + 260} slots={L.xs.map((x, i) => ({x, w: L.ws[i]}))} />
      {DONE.map((w, i) => (
        <TokenTile key={w} frame={f} text={w} x={L.xs[i]} y={TILE_Y} size={SIZE} w={L.ws[i]} />
      ))}
      <ReelTile frame={f} x={x4} y={TILE_Y} size={SIZE} w={w4} words={REEL4} pos={p4} speed={s4} glow={landed ? 0 : 0.45 + 0.25 * Math.sin(f / 3)} newest={landed ? 1 - prog(f, START5 + 6, 10) : 0} />
      {/* slot 5: ghost + padlock, then its own reel */}
      {ghostOp > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 0, opacity: ghostOp}}>
          {waitPulse > 0 ? <div style={{position: 'absolute', left: x5 - w5, top: TILE_Y - TH, width: w5 * 2, height: TH * 2, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.wait, 0.22 + 0.18 * waitPulse)}, rgba(0,0,0,0))`}} /> : null}
          <TokenTile frame={f} text="" x={x5} y={TILE_Y} size={SIZE} w={w5} ghost />
        </div>
      ) : null}
      {reel5Op > 0 ? <ReelTile frame={f} x={x5} y={TILE_Y} size={SIZE} w={w5} words={REEL5} pos={p5} speed={s5} glow={0.6 + 0.3 * Math.sin(f / 3)} opacity={reel5Op} /> : null}
      {/* far ghost slots: the chain goes on */}
      {[x6, x7].map((x, i) => (
        <div key={i} style={{position: 'absolute', left: 0, top: 0, opacity: 0.45 - i * 0.15}}>
          <TokenTile frame={f} text="" x={x} y={TILE_Y} size={SIZE} w={L.ws[5 + i]} ghost />
        </div>
      ))}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ChainLink x={linkX} y={TILE_Y} s={46} color={chainCyan ? PAL.info : PAL.wait} glow={chainCyan ? 0.4 + chainFlash : 0.3 * waitPulse} />
        <Padlock x={x5} y={TILE_Y + 4} s={58} open={lockOpen} drop={lockDrop} glow={waitPulse} />
        <BitHead x={bitX} y={bitY} size={26} gid="s4c-bit" />
      </svg>
      <Badge frame={f} at={T.five} x={x5} y={TILE_Y - TH / 2 - 128} text="5" color={PAL.wait} />
      <Badge frame={f} at={T.four} x={x4} y={TILE_Y - TH / 2 - 128} text="4" color={PAL.info} />
      {/* the moment piece 4 lands: a click ring on the rail */}
      {win(f, LAND4, LAND4 + 14, 0, 6) > 0 ? (
        <div style={{position: 'absolute', left: x4 - w4 / 2 - 10, top: TILE_Y - TH / 2 - 10, width: w4 + 20, height: TH + 20, borderRadius: SIZE * 0.3, border: `3px solid ${rgba('#FFFFFF', 0.8 * (1 - (f - LAND4) / 14))}`, transform: `scale(${1 + 0.25 * EASE.out((f - LAND4) / 14)})`}} />
      ) : null}
    </Stage>
  );
};

export const shotC = (f: number): React.ReactNode => <ShotC f={f} />;
