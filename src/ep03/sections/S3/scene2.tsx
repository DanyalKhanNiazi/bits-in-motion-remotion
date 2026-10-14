/**
 * S3 · Scene 2 (P06): the chosen token is tacked on, the model runs again, THE LOOP closes; laps accelerate until the
 * hidden end token; 100 tokens = 100 runs; mainstream vs a few experimental models; the teaser.
 */
import React from 'react';
import {EASE, KineticText, Label, MONO, PAL, Prop, Rich, SANS, SPRING, Stage, TokenTile, clamp01, lerp, poseAt, prog, rgba, springAt, tileW, toScreen} from '../../kit';
import {A} from './anchors';
import {QUESTION} from './common';
import {PICK_END, PICK_SLICES, Strip, TheLoop, lapPt, ringPt, type LoopGeo, type StripTok} from './loop';
import {rotFor} from './wheel';

/* ---------------------------------------------------------------- timeline */
export const T2 = {
  fall0: A.p6 + 8,
  snapBecause: A.end1,
  bitIn: A.end1 + 6,
  top1: A.runs,
  pick1: A.pick,
  pick1Land: A.oneEnd - 6,
  loop: A.loop,
  endPick: A.end2,
  halt: A.end2 + 16,
  vanish: A.neverSee,
  move0: A.without,
  move1: A.without + 34,
  laps0: A.n100a + 4,
  laps1: A.oneAfter + 34,
  mainstream: A.mainstream,
  few: A.few,
  differently: A.differently,
  tease0: A.later - 6,
  trick: A.trick,
  bends: A.bends,
  out: A.ruleEnd + 3,
};

const ANSWER = ['Because', 'the', 'model', 'writes', 'one', 'token', 'at', 'a', 'time'];
const LAP_SLICE = [0, 2, 4, 0, 6, 2, 0, 4, PICK_END]; // which pick slice each lap lands on (the last: the end token)

/* ---------------------------------------------------------------- the Bit's lap position P(f) */
// laps 1 → 9 accelerate (integrated speed profile, scaled so the end-token pick lands on the word "end")
const LAP_TABLE: number[] = (() => {
  const f0 = T2.loop;
  const fEnd = T2.endPick;
  const v = (f: number) => {
    const t = clamp01((f - f0) / 80);
    const ramp = lerp(1 / 26, 1 / 9, t * t * (3 - 2 * t));
    const slow = clamp01((f - (fEnd - 14)) / 14);
    return lerp(ramp, 1 / 20, slow * slow);
  };
  const raw: number[] = [0];
  for (let f = f0; f < fEnd; f++) raw.push(raw[raw.length - 1] + v(f));
  const k = 7.75 / raw[raw.length - 1];
  return raw.map((x) => 1 + x * k); // P at f0 + i
})();
/** the 100-run schedule: lap k of the 100 finishes at RUN_T[k-1] */
const RUN_T: number[] = (() => {
  const out: number[] = [];
  let t = T2.laps0;
  for (let k = 0; k < 100; k++) {
    t += Math.max(0.42, 12 * Math.pow(0.88, k));
    out.push(t);
  }
  const span = out[99] - T2.laps0;
  const want = T2.laps1 - T2.laps0;
  return out.map((x) => T2.laps0 + ((x - T2.laps0) * want) / span);
})();
const runsDone = (f: number) => {
  let n = 0;
  while (n < 100 && RUN_T[n] <= f) n++;
  return n;
};
const P = (f: number): number => {
  if (f < T2.bitIn) return 0;
  if (f < T2.top1) return 0.5 * EASE.inOut((f - T2.bitIn) / (T2.top1 - T2.bitIn));
  if (f < T2.top1 + 8) return 0.5 + 0.02 * ((f - T2.top1) / 8);
  if (f < T2.pick1) return 0.52 + 0.23 * EASE.out((f - T2.top1 - 8) / (T2.pick1 - T2.top1 - 8));
  if (f < T2.pick1Land) return 0.75;
  if (f < T2.loop) return 0.75 + 0.25 * EASE.inOut((f - T2.pick1Land) / (T2.loop - T2.pick1Land));
  if (f < T2.endPick) {
    const i = f - T2.loop;
    const a = LAP_TABLE[Math.floor(i)];
    const b = LAP_TABLE[Math.min(LAP_TABLE.length - 1, Math.floor(i) + 1)];
    return lerp(a, b, i - Math.floor(i));
  }
  if (f < T2.halt) return 8.75 + 0.25 * EASE.out((f - T2.endPick) / (T2.halt - T2.endPick));
  if (f < T2.laps0) return 9;
  if (f < RUN_T[99]) {
    // 100 laps: interpolate between lap completions
    let k = 0;
    while (k < 100 && RUN_T[k] <= f) k++;
    const t0 = k === 0 ? T2.laps0 : RUN_T[k - 1];
    const t1 = RUN_T[k];
    return 9 + k + (f - t0) / (t1 - t0);
  }
  // after the hundred: spin down to a steady lap every 24 frames
  const d = f - RUN_T[99];
  return 109 + d / 24 + 1.6 * (1 - Math.exp(-d / 5));
};
/** frame when P first reaches x (search; P is monotonic) */
const whenP = (x: number, lo = T2.bitIn - 2, hi = T2.out + 40): number => {
  let a = lo;
  let b = hi;
  if (P(b) < x) return 1e9;
  while (b - a > 0.25) {
    const m = (a + b) / 2;
    if (P(m) >= x) b = m;
    else a = m;
  }
  return Math.ceil(b);
};
const SNAP: number[] = ANSWER.map((_, i) => (i === 0 ? T2.snapBecause : whenP(i))); // "the" at P=1 … "time" at P=8
const TOP: number[] = Array.from({length: 9}, (_, k) => whenP(k + 0.5));

/* ---------------------------------------------------------------- geometry over time */
type Geo = {g: LoopGeo; stripY: number};
const geoAt = (f: number): Geo => {
  const m = prog(f, T2.move0, T2.move1 - T2.move0, EASE.inOut);
  const i = prog(f, T2.mainstream + 6, 30, EASE.inOut);
  const j = prog(f, T2.tease0, 34, EASE.inOut);
  let cx = lerp(760, 1350, m);
  let cy = lerp(470, 470, m);
  let r = lerp(285, 228, m);
  cx = lerp(cx, 690, i);
  r = lerp(r, 240, i);
  cx = lerp(cx, 820, j);
  cy = lerp(cy, 462, j);
  r = lerp(r, 262, j);
  const bendS = springAt(T2.bends + 40 > f ? f : T2.bends + 40, T2.bends, {damping: 9, stiffness: 140, mass: 0.8});
  const relax = prog(f, A.rule + 4, 22, EASE.inOut);
  const bend = f >= T2.bends ? bendS * (1 - relax) + (relax > 0 ? 0.08 * Math.sin((f - A.rule) / 2.2) * (1 - relax) : 0) : 0;
  return {g: {cx, cy, r, bend, bendDir: 90}, stripY: cy + r + 80};
};

/* ---------------------------------------------------------------- pick wheel rotation */
const L = (k: number) => rotFor(LAP_SLICE[Math.max(0, Math.min(8, k))], PICK_SLICES) + 720 * (k + 1);
const pickRot = (f: number): number => {
  if (f < T2.pick1) return L(0) - 720;
  if (f < T2.pick1Land) {
    const t = (f - T2.pick1) / (T2.pick1Land - T2.pick1);
    return lerp(L(0) - 720, L(0), 1 - Math.pow(1 - t, 3));
  }
  const p = P(f);
  if (p < 1) return L(0);
  if (p <= 9) {
    const k = Math.floor(p - 0.0001);
    const fr = p - k;
    if (fr < 0.5) return L(k - 1);
    if (fr < 0.75) return lerp(L(k - 1), L(k), 1 - Math.pow(1 - (fr - 0.5) / 0.25, 3));
    return L(k);
  }
  return L(8) + 430 * (p - 9);
};
const pickLit = (f: number): number => {
  const p = P(f);
  if (f >= T2.pick1Land && f < T2.loop) return clamp01((f - T2.pick1Land) / 3);
  if (p < 1 || p >= 9) return 0;
  const fr = p - Math.floor(p);
  return fr >= 0.75 ? 1 - clamp01((fr - 0.9) / 0.1) : 0;
};
const pickK = (f: number): number => {
  const p = P(f);
  if (p < 1) return LAP_SLICE[0];
  return LAP_SLICE[Math.min(8, Math.floor(p))];
};
const chipFlash = (f: number): number => {
  let best = 0;
  for (const t of TOP) if (f >= t - 1 && f - t < 30) best = Math.max(best, Math.exp(-(f - t) / 6));
  if (f >= T2.laps0 && f < RUN_T[99] + 20) {
    const n = runsDone(f);
    best = Math.max(best, n > 0 && n < 100 ? 0.55 + 0.25 * Math.sin(f * 1.7) : n >= 100 ? Math.exp(-(f - RUN_T[99]) / 8) : 0);
  }
  if (f >= RUN_T[99] + 10) {
    const p = P(f);
    const fr = p - Math.floor(p);
    best = Math.max(best, Math.exp(-Math.abs(fr - 0.5) * 9) * 0.8);
  }
  return best;
};

/* ---------------------------------------------------------------- the riding tile (pick → strip end) */
const RideTile: React.FC<{frame: number; geo: Geo}> = ({frame: f, geo}) => {
  const p = P(f);
  let k: number;
  let fr: number;
  if (f >= T2.pick1Land && f < T2.loop) {
    k = 0;
    fr = p;
  } else if (p >= 1 && p < 9.0001) {
    k = Math.floor(p);
    fr = p - k;
    if (k >= 9) {
      k = 8;
      fr = 1;
    }
  } else return null;
  if (fr < 0.75) return null;
  const isEnd = k === 8;
  const word = isEnd ? 'end' : ANSWER[k + 1];
  const u = clamp01((fr - 0.75) / 0.25);
  const [bx, by] = lapPt(geo.g, Math.floor(p >= 9 ? 8 : p) + fr);
  // outward offset that closes as it reaches the strip
  const a = ((180 + 360 * fr) * Math.PI) / 180;
  const off = 58 * (1 - u * u);
  let x = bx + Math.sin(a) * off;
  let y = by - Math.cos(a) * off;
  const size = 36;
  let op = 1;
  if (isEnd) {
    // the hidden end token: a clear beat (1.5× pop, dashed, "end" at 48 px), it never clicks on, then it ghosts away
    const hov = prog(f, T2.halt - 2, 14, EASE.out);
    const lastW = tileW(ANSWER[8], 40);
    const fsz = 64;
    const tw = tileW('end', fsz);
    x = lerp(x, geo.g.cx + lastW / 2 + 20 + tw / 2, hov);
    y = lerp(y, geo.stripY - 8, hov) + Math.sin(f / 6) * 3 * hov;
    const t = f - A.end2;
    if (t < 0) return null;
    const sc = t < 5 ? lerp(0.2, 1.5, EASE.out(t / 5)) : 1 + 0.5 * Math.exp(-(t - 5) / 4);
    const ghost = prog(f, A.neverSee, 10, EASE.inOut);
    const gone = prog(f, A.neverSee + 12, 12, EASE.inCubic);
    if (gone >= 1) return null;
    const th = fsz * 1.5;
    return (
      <div style={{position: 'absolute', left: 0, top: 0, opacity: (1 - 0.7 * ghost) * (1 - gone), filter: gone > 0 ? `blur(${gone * 8}px)` : undefined}}>
        <div style={{position: 'absolute', left: x - tw * 1.1, top: y - th * 1.3, width: tw * 2.2, height: th * 2.6, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.info, 0.38 * (1 - ghost))}, rgba(0,0,0,0))`}} />
        <div
          style={{
            position: 'absolute',
            left: x - tw / 2,
            top: y - th / 2,
            width: tw,
            height: th,
            boxSizing: 'border-box',
            borderRadius: fsz * 0.24,
            border: `4px dashed ${rgba(lerp(1, 0, ghost) > 0.5 ? '#EAF4FF' : PAL.annotation, lerp(0.95, 0.6, ghost))}`,
            background: rgba('#0A1630', 0.55),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${sc})`,
            boxShadow: `0 0 ${30 * (1 - ghost)}px ${rgba(PAL.info, 0.6 * (1 - ghost))}`,
          }}
        >
          <span style={{fontFamily: SANS, fontWeight: 600, fontSize: fsz, lineHeight: 1, color: ghost > 0.5 ? PAL.annotation : PAL.infoPale, marginTop: -fsz * 0.06}}>end</span>
        </div>
      </div>
    );
  }
  if (k === 0 && f >= T2.loop - 1) return null;
  if (k > 0 && f >= SNAP[k + 1] - 1) return null;
  return <TokenTile frame={f} text={word} x={x} y={y - u * 10} size={size} newest={0.8} />;
};

/* ---------------------------------------------------------------- 10 × 10 grid of the hundred tokens */
const GRID = {cx: 560, cy: 520, cell: 52};
const Grid: React.FC<{frame: number}> = ({frame: f}) => {
  const a = prog(f, T2.move0 + 6, 18, EASE.out);
  const out = prog(f, T2.mainstream + 4, 16, EASE.inCubic);
  if (a <= 0 || out >= 1) return null;
  const n = runsDone(f);
  const s = GRID.cell;
  const x0 = GRID.cx - 5 * s;
  const y0 = GRID.cy - 5 * s;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: (1 - out) * a}}>
      <defs>
        <linearGradient id="s3grid-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor={PAL.tile} />
          <stop offset="1" stopColor={PAL.tileMid} />
        </linearGradient>
      </defs>
      <rect x={x0 - 16} y={y0 - 16} width={s * 10 + 32} height={s * 10 + 32} rx={18} fill={rgba('#0B1530', 0.75)} stroke={rgba(PAL.structure, 0.45)} strokeWidth={2} />
      {Array.from({length: 100}, (_, i) => {
        const cx = x0 + (i % 10) * s + s / 2;
        const cy = y0 + Math.floor(i / 10) * s + s / 2;
        const drawIn = prog(f, T2.move0 + 6 + ((i % 10) + Math.floor(i / 10)) * 0.8, 8, EASE.out);
        const filled = i < n;
        const age = filled ? f - RUN_T[i] : -1;
        const sp = filled ? Math.min(1.12, springAt(f, RUN_T[i], SPRING.snap)) : 0;
        const w = (s - 12) * (filled ? sp : 1);
        return (
          <g key={i} opacity={drawIn}>
            {!filled ? <rect x={cx - (s - 12) / 2} y={cy - (s - 12) / 2} width={s - 12} height={s - 12} rx={7} fill="none" stroke={rgba(PAL.annotation, 0.45)} strokeWidth={2} strokeDasharray="5 5" /> : null}
            {filled ? (
              <>
                <rect x={cx - w / 2} y={cy - w / 2 + 3} width={w} height={w} rx={7} fill="#7E8798" />
                <rect x={cx - w / 2} y={cy - w / 2} width={w} height={w} rx={7} fill="url(#s3grid-tile)" />
                {age < 10 ? <rect x={cx - w / 2 - 3} y={cy - w / 2 - 3} width={w + 6} height={w + 6} rx={9} fill="none" stroke={PAL.info} strokeWidth={3} opacity={1 - age / 10} /> : null}
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- a few models work differently */
const BLOCK_WORDS = ['All', 'words', 'appear', 'at', 'once,', 'then', 'sharpen', 'into', 'place'];
/** a different kind of model: the whole block is there at once, out of focus, and sharpens together */
const Block: React.FC<{frame: number; x: number; y: number}> = ({frame: f, x, y}) => {
  const a = prog(f, T2.few - 4, 16, EASE.out);
  const out = prog(f, T2.tease0, 14, EASE.inCubic);
  if (a <= 0 || out >= 1) return null;
  const sharp = prog(f, T2.differently - 30, 30, EASE.inOut);
  const settled = f >= T2.differently;
  const flash = settled ? Math.exp(-(f - T2.differently) / 6) : 0;
  const cols = 3;
  const rows = 3;
  const pitchX = 236;
  const pitchY = 100;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: a * (1 - out), transform: `translateX(${(1 - a) * 80}px)`}}>
      <div
        style={{
          position: 'absolute',
          left: x - (cols * pitchX) / 2 - 28,
          top: y - (rows * pitchY) / 2 - 28,
          width: cols * pitchX + 56,
          height: rows * pitchY + 56,
          borderRadius: 22,
          border: `2px dashed ${rgba(PAL.annotation, 0.5)}`,
          background: rgba('#0B1530', 0.66),
          boxShadow: flash > 0 ? `0 0 ${60 * flash}px ${rgba(PAL.infoPale, 0.5 * flash)}` : undefined,
        }}
      />
      {Array.from({length: cols * rows}, (_, i) => {
        const cx = x + ((i % cols) - (cols - 1) / 2) * pitchX;
        const cy = y + (Math.floor(i / cols) - (rows - 1) / 2) * pitchY;
        const wob = (1 - sharp) * 3 * Math.sin(f / 3 + i * 1.7);
        return (
          <div key={i} style={{position: 'absolute', left: 0, top: 0, opacity: 0.55 + 0.45 * sharp, filter: sharp < 0.99 ? `blur(${(1 - sharp) * 9}px)` : undefined, transform: `translate(${wob}px, ${-wob * 0.6}px)`}}>
            <TokenTile frame={f} text={BLOCK_WORDS[i]} x={cx} y={cy} size={44} dim={0.35 * (1 - sharp)} newest={flash} />
          </div>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- the run counter (ring centre) */
const RunCounter: React.FC<{frame: number; x: number; y: number}> = ({frame: f, x, y}) => {
  const a = prog(f, T2.laps0 - 10, 10, EASE.out);
  const out = prog(f, T2.mainstream + 8, 10, EASE.inCubic);
  if (a <= 0 || out >= 1) return null;
  const n = runsDone(f);
  const done = n >= 100 ? springAt(f, RUN_T[99], SPRING.pop) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${1 + 0.08 * Math.max(0, done - 1) + (n >= 100 ? 0.04 * Math.exp(-(f - RUN_T[99]) / 6) : 0)})`, opacity: a * (1 - out), textAlign: 'center'}}>
      <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 150, lineHeight: 1, color: n >= 100 ? PAL.infoPale : PAL.ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em'}}>{n}</div>
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 52, color: PAL.muted, marginTop: 4}}>runs</div>
    </div>
  );
};

/* ---------------------------------------------------------------- scene */
const CAM = [
  {f: T2.fall0 - 12, x: 640, y: 690, zoom: 1.22},
  {f: T2.snapBecause, x: 650, y: 680, zoom: 1.2},
  {f: T2.top1 + 8, x: 960, y: 520, zoom: 1.0, dur: T2.top1 + 8 - T2.snapBecause},
  {f: T2.loop + 6, x: 960, y: 520, zoom: 1.035, dur: 8, ease: 'out' as const},
  {f: T2.loop + 40, x: 960, y: 525, zoom: 1.0},
  {f: T2.endPick - 4, x: 905, y: 545, zoom: 1.03},
  {f: T2.vanish + 22, x: 900, y: 548, zoom: 1.035},
  {f: T2.move1, x: 960, y: 530, zoom: 1.0, dur: 34},
  {f: T2.tease0 + 34, x: 950, y: 520, zoom: 1.0},
  {f: T2.out + 20, x: 900, y: 500, zoom: 1.07},
];

export const scene2 = (f: number): React.ReactNode => {
  const geo = geoAt(f);
  const g = geo.g;
  const p = P(f);
  const pPrev = P(f - 1);
  // route reveal: the Bit draws the ring on its first lap (from 6 o'clock), then it stays
  const drawn = f < T2.bitIn ? 0 : Math.min(1, p);
  const ignite = f >= T2.loop ? Math.exp(-(f - T2.loop) / 10) : 0;
  const dim = clamp01(prog(f, T2.halt, 10) - prog(f, T2.laps0 - 8, 8));
  const spin = clamp01((Math.abs(p - pPrev) - 0.35) / 0.6);
  const chipIn = springAt(f, T2.bitIn + 2, SPRING.heavy);
  const pickIn = springAt(f, T2.top1 + 10, SPRING.pop);
  // strip: question + answer tokens
  const toks: StripTok[] = [...QUESTION.map((t) => ({t})), ...ANSWER.map((t, i) => ({t, at: SNAP[i]}))];
  const stripOut = prog(f, T2.move0, 22, EASE.inCubic);
  // the strip "reads" (glow wave) at each slow lap start
  let read = -1;
  for (let k = 0; k < SNAP.length; k++) {
    const t = SNAP[k];
    if (f >= t + 1 && f < t + 13 && (k === 0 || SNAP[k] - SNAP[k - 1] > 14 || k === 1)) read = (f - t - 1) / 12;
  }
  // the falling "Because" (before it clicks on)
  const fallT = prog(f, T2.fall0, T2.snapBecause - T2.fall0, EASE.inOut);
  const fallX = lerp(g.cx + 330, g.cx, EASE.out(clamp01((f - T2.fall0) / (T2.snapBecause - T2.fall0))));
  const fallY = lerp(330, geo.stripY - 70, fallT);
  // centre text: "The loop" title, later the run counter
  const chipPt = ringPt(g, 0);
  const pickPt = ringPt(g, 90);
  const stripEnd = {x: g.cx, y: geo.stripY};
  const pose0 = poseAt(f, CAM);
  const leftW = pose0.x - 960 / pose0.zoom;

  const world = (
    <>
      <Grid frame={f} />
      {f >= T2.move0 && f < T2.mainstream + 14 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <path
            d={`M ${g.cx - g.r * 0.2} ${g.cy + g.r * 0.98} C ${g.cx - g.r * 0.9} ${g.cy + g.r * 1.45}, ${GRID.cx + 420} ${GRID.cy + 260}, ${GRID.cx + 5 * GRID.cell + 22} ${GRID.cy + 40}`}
            fill="none"
            stroke={PAL.info}
            strokeWidth={4}
            strokeDasharray="4 14"
            strokeDashoffset={-f * (3 + 9 * clamp01(Math.abs(p - pPrev)))}
            opacity={0.6 * prog(f, T2.move0 + 14, 10) * (1 - prog(f, T2.mainstream, 12))}
            strokeLinecap="round"
          />
        </svg>
      ) : null}
      <Strip frame={f} toks={toks} endX={stripEnd.x} y={stripEnd.y} size={40} gap={12} read={read} dx={-520 * stripOut} opacity={1 - stripOut} fadeLeft={leftW + 40} />
      <TheLoop
        frame={f}
        g={g}
        p={p}
        pPrev={pPrev}
        drawFrom={0}
        drawn={drawn}
        ignite={ignite}
        dim={dim}
        showBit={f >= T2.bitIn - 1}
        chip={{opacity: clamp01(chipIn * 2), flash: chipFlash(f), drop: (1 - Math.min(1, chipIn)) * 160}}
        pick={{rot: pickRot(f), rotPrev: pickRot(f - 1), lit: pickLit(f), k: pickK(f), opacity: clamp01(pickIn * 2), scale: Math.max(0.01, Math.min(1.1, pickIn))}}
        chevrons={0.4}
        spin={spin}
        lock={f >= T2.loop ? f - T2.loop : undefined}
      />
      <RideTile frame={f} geo={geo} />
      {f >= T2.fall0 && f < T2.snapBecause ? <TokenTile frame={f} text="Because" x={fallX} y={fallY} size={40} newest={1} /> : null}
      <Block frame={f} x={1440} y={470} />
      {/* the teaser: the draft-target rig glimpsed in the dark */}
      {f >= T2.trick - 8 ? (
        <Prop
          frame={f}
          src="BIM185_T03_draft-target_a"
          x={1650}
          y={500}
          w={700}
          enter={{kind: 'slide', at: T2.trick - 6, from: 'right', dist: 600}}
          brightness={[[T2.trick, 0.35], [T2.bends, 0.75], [T2.out, 0.55]]}
          rim={{color: PAL.emphasis, strength: 0.75}}
          sweep={{at: [T2.bends - 2], dur: 26, strength: 0.7}}
          float={4}
          shadow={0.4}
        />
      ) : null}
      {/* three tiles out of one trip */}
      {f >= T2.bends
        ? ['one', 'trip', 'three'].map((t, i) => {
            const s = springAt(f, T2.bends + i * 2, SPRING.pop);
            const back = prog(f, A.rule + 6, 16, EASE.inOut);
            const x = lerp(pickPt[0], pickPt[0] + 150 + i * 30, Math.min(1, s)) - back * 40;
            const y = lerp(pickPt[1], pickPt[1] - 150 + i * 110, Math.min(1, s));
            return (
              <div key={t} style={{position: 'absolute', left: 0, top: 0, opacity: clamp01(s * 3) * (1 - back)}}>
                <TokenTile frame={f} text="" x={x} y={y} size={34} newest={1} />
              </div>
            );
          })
        : null}
    </>
  );

  // hud anchors: world points mapped through the stage camera
  const pose = poseAt(f, CAM);
  const W = (x: number, y: number) => toScreen(pose, x, y);
  const zS = pose.zoom;
  const cS = W(g.cx, g.cy);
  const ringBottom = W(g.cx, g.cy + g.r);
  const stripS = W(stripEnd.x, geo.stripY);
  const chipS = W(chipPt[0], chipPt[1]);
  const pickS = W(pickPt[0], pickPt[1]);
  const gridTop = W(GRID.cx, GRID.cy - 5 * GRID.cell);
  const gridRight = W(GRID.cx + 5 * GRID.cell, GRID.cy);
  const ringLeft = W(g.cx - g.r, g.cy);
  const blockS = W(1440, g.cy + g.r);
  const hud = (
    <>
      <KineticText frame={f} at={T2.loop} exitAt={T2.endPick - 16} text="THE LOOP" mode="slam" x={1490} y={cS.y - 6} size={140} tracking={0.04} maxWidth={470} accent={PAL.info} />
      <Label frame={f} at={T2.snapBecause} exitAt={T2.endPick - 22} text="Tack onto end" size={62} x={stripS.x + 150} y={stripS.y + 50} to={{x: stripS.x + 40 * zS, y: stripS.y + 26 * zS}} />
      <Label frame={f} at={T2.top1} exitAt={T2.endPick - 22} text="Model runs" size={62} x={chipS.x + 230} y={chipS.y - 90} to={{x: chipS.x + 110 * zS, y: chipS.y - 40 * zS}} />
      <Label frame={f} at={T2.pick1} exitAt={T2.endPick - 22} text="Pick one" size={62} x={pickS.x + 30} y={pickS.y + 205} to={{x: pickS.x + 10 * zS, y: pickS.y + 74 * zS}} />
      <RunCounter frame={f} x={cS.x} y={cS.y + 16} />
      <KineticText frame={f} at={A.n100a} exitAt={T2.mainstream + 8} text="100 tokens" mode="slam" x={gridTop.x} y={gridTop.y - 74} size={96} />
      <KineticText frame={f} at={A.n100b} exitAt={T2.mainstream + 8} text="=" mode="slam" x={(gridRight.x + ringLeft.x) / 2} y={gridRight.y} size={120} backing="none" color={PAL.info} />
      <KineticText frame={f} at={A.mainstream} exitAt={T2.tease0} text="Mainstream chatbots ✓" mode="pop" x={ringBottom.x} y={ringBottom.y + 112} size={62} />
      <KineticText frame={f} at={A.few + 14} exitAt={T2.tease0} text="Mostly experimental" mode="rise" x={blockS.x} y={ringBottom.y + 112} size={62} color={PAL.muted} />
      <KineticText frame={f} at={A.later} text="LATER" mode="pop" x={ringBottom.x - 500} y={ringBottom.y + 118} size={64} color={PAL.info} backing="none" align="right" />
      <KineticText frame={f} at={T2.trick - 4} text="A trick that bends the rule" mode="pop" x={ringBottom.x - 470} y={ringBottom.y + 118} size={64} align="left" />
    </>
  );

  return (
    <Stage frame={f} env={{kind: 'photo', plate: 'gpu-macro', blur: 9, dim: 0.42, tint: 0.3, floor: 0.45, kb: {from: {s: 1.18, x: 0, y: 0}, to: {s: 1.3, x: -40, y: 20}, start: A.p6 - 10, end: A.p7}}} cam={CAM} shake={[{at: T2.loop, strength: 0.75}, {at: T2.snapBecause, strength: 0.25}]} hud={hud}>
      {world}
    </Stage>
  );
};

export const ringScreenCenter = (f: number) => {
  const g = geoAt(f).g;
  return toScreen(poseAt(f, CAM), g.cx, g.cy);
};
export const _s2 = {P, SNAP, TOP, RUN_T, MONO, Rich, rgba};
