/**
 * S9 shot 1 (P21): THE LOOP keeps turning. A true callback: it reuses S3's own loop (<TheLoop>, <Strip>, the pick
 * wheel; imported read-only as S3 offers). The model chip sits at 12 o'clock and flashes as the Bit runs through it,
 * the pick lands at 3, the piece rides down to 6 and clicks onto the answer strip. The two tricks dock onto the ring
 * on their words (shorter laps; three pieces per lap), then dim and fall back: none of them removes the loop.
 */
import React from 'react';
import {EASE, KineticText, PAL, Prop, SPRING, Stage, TokenTile, clamp01, lerp, prog, rgba, springAt, tileW, useFontsReady, type CamKey} from '../../kit';
import {PICK_END, PICK_SLICES, TheLoop, ringPt, type LoopGeo, type StripTok} from '../S3/loop';
import {rotFor} from '../S3/wheel';
import {A} from './anchors';

export const LOOP_F0 = A.from - 30;
const G: LoopGeo = {cx: 960, cy: 446, r: 290};
const STRIP_Y = G.cy + G.r + 60;
const TILE = 54;
const GAP = 14;

/* ---------------------------------------------------------------- the lap clock (S3's convention: p = 0 at 6 o'clock) */
const lapDur = (f: number) => lerp(56, 31, prog(f, A.howLong + 2, 26, EASE.inOut));
/** the clock starts before the section, so the strip already holds the first words at the first frame */
const CLOCK0 = LOOP_F0 - 300;
const N = 760;
const P0 = 0.35;
const PARR: number[] = (() => {
  const a = [P0];
  for (let i = 1; i < N; i++) a.push(a[i - 1] + 1 / lapDur(CLOCK0 + i - 1));
  return a;
})();
const lapsAt = (f: number): number => {
  const u = f - CLOCK0;
  if (u <= 0) return P0 + u / 56;
  const i = Math.min(N - 2, Math.floor(u));
  return lerp(PARR[i], PARR[i + 1], clamp01(u - i));
};
const crossings = (phase: number): number[] => {
  const out: number[] = [];
  for (let i = 1; i < N; i++) if (Math.floor(PARR[i] - phase) > Math.floor(PARR[i - 1] - phase)) out.push(CLOCK0 + i);
  return out;
};
/** 6 o'clock: the piece clicks onto the strip */
const SIX = crossings(0);
/** 12 o'clock: inside the model, one run */
const TWELVE = crossings(0.5);
/** pieces per arrival: three once the second trick is in */
const nOf = (e: number) => (e >= A.pieces21 ? 3 : 1);

/* ---------------------------------------------------------------- the strip: the question, then the answer one piece per run */
const QUESTION = ['Why', 'do', 'AI', 'answers', 'arrive', 'one', 'piece', 'at', 'a', 'time', '?'];
const ANSWER = 'Because each piece depends on the ones before it, the answer is made one piece at a time. For each one, gigabytes of numbers cross a bridge, again and again'.split(' ');
const TOKS: StripTok[] = (() => {
  const out: StripTok[] = QUESTION.map((t) => ({t}));
  let w = 0;
  for (const e of SIX) {
    for (let j = 0; j < nOf(e) && w < ANSWER.length; j++) out.push({t: ANSWER[w++], at: e});
  }
  return out;
})();
/** the words that ride down from the pick on the lap that ends at `e` */
const wordsAt = (e: number): string[] => {
  const k = TOKS.findIndex((t) => t.at === e);
  return k < 0 ? [] : TOKS.slice(k, k + nOf(e)).map((t) => t.t);
};

/* ---------------------------------------------------------------- the pick wheel (lands once per lap at 3 o'clock) */
const LAP_SLICE = [0, 2, 4, 0, 6, 2, 0, 4, 1, 7, 3];
const sliceOf = (k: number) => {
  const s = LAP_SLICE[((k % LAP_SLICE.length) + LAP_SLICE.length) % LAP_SLICE.length];
  return s === PICK_END ? 0 : s;
};
const Lrot = (k: number) => rotFor(sliceOf(k), PICK_SLICES) + 720 * (k + 1);
const pickRot = (f: number) => {
  const p = lapsAt(f);
  const k = Math.floor(p);
  const fr = p - k;
  if (fr < 0.5) return Lrot(k - 1);
  if (fr < 0.75) return lerp(Lrot(k - 1), Lrot(k), 1 - Math.pow(1 - (fr - 0.5) / 0.25, 3));
  return Lrot(k);
};
const pickLit = (f: number) => {
  const fr = lapsAt(f) % 1;
  return fr >= 0.75 ? 1 - clamp01((fr - 0.93) / 0.07) : 0;
};

/* ---------------------------------------------------------------- the answer strip (S3's look, collision-free)
 * Pieces arrive in groups (one per run; three once the second trick is in). The row slides left to make room
 * BEFORE a group lands, and each piece lands in its own final slot, so tiles never stack. The newest piece sits
 * under 6 o'clock; older ones fade out toward the left so the strip ends deliberately, not at the frame edge. */
type Group = {e: number; first: number; n: number};
const GROUPS: Group[] = (() => {
  const out: Group[] = [];
  let k = QUESTION.length;
  for (const e of SIX) {
    const n = Math.min(nOf(e), TOKS.length - k);
    if (n <= 0) break;
    out.push({e, first: k, n});
    k += n;
  }
  return out;
})();
const MAKE_ROOM = 12;
const tokW = (i: number) => tileW(TOKS[i].t, TILE);
/** x of token i at frame f (world px); null when it has not landed yet */
const stripX = (i: number, f: number): number => {
  const gi = GROUPS.findIndex((g) => i >= g.first && i < g.first + g.n);
  let x = G.cx;
  // inside its own group: the tokens to its right
  if (gi >= 0) {
    const g = GROUPS[gi];
    for (let j = g.first + g.n - 1; j > i; j--) x -= (tokW(j) + tokW(j - 1)) / 2 + GAP;
  }
  // every newer group pushes it left (the room is made just before that group lands)
  for (let h = Math.max(0, gi + 1); h < GROUPS.length; h++) {
    const g = GROUPS[h];
    if (g.e - MAKE_ROOM > f) break;
    const lastOld = g.first - 1;
    let w = (tokW(g.first) + tokW(lastOld)) / 2 + GAP;
    for (let j = g.first + 1; j < g.first + g.n; j++) w += (tokW(j) + tokW(j - 1)) / 2 + GAP;
    x -= w * EASE.inOut(prog(f, g.e - MAKE_ROOM, MAKE_ROOM));
  }
  return x;
};
const StripRow: React.FC<{frame: number}> = ({frame: f}) => {
  useFontsReady();
  const nodes: React.ReactNode[] = [];
  const lastG = [...GROUPS].reverse().find((g) => g.e <= f);
  for (let i = QUESTION.length; i < TOKS.length; i++) {
    const at = TOKS[i].at ?? -1e9;
    if (f < at) continue;
    const x = stripX(i, f);
    const fade = clamp01((x - 230) / 260);
    if (fade <= 0.01) continue;
    const fresh = lastG && i >= lastG.first && i < lastG.first + lastG.n ? 1 - prog(f, lastG.e + 12, 12) : 0;
    nodes.push(
      <div key={i} style={{position: 'absolute', left: 0, top: 0, opacity: fade}}>
        <TokenTile frame={f} text={TOKS[i].t} x={x} y={STRIP_Y} size={TILE} snapAt={at} from={{dx: 0, dy: 0, rot: 0}} newest={fresh} />
      </div>,
    );
  }
  return <>{nodes}</>;
};

/**
 * The riding pieces: one run's pieces ride down from the pick (3 o'clock) to 6 o'clock as one little row (one tile,
 * or three once the second trick is in), already in their final order, and drop onto the strip together. The row
 * makes room first, so nothing ever stacks.
 */
const Riders: React.FC<{frame: number}> = ({frame: f}) => {
  const nodes: React.ReactNode[] = [];
  for (const g of GROUPS) {
    const s0 = g.e - 0.25 * lapDur(g.e);
    if (f < s0 || f >= g.e) continue;
    const u = clamp01((f - s0) / Math.max(1, g.e - s0));
    const [rx, ry] = ringPt({...G, r: G.r + 6}, lerp(90, 180, EASE.inOut(clamp01(u / 0.8))));
    const k = EASE.inOut(clamp01((u - 0.8) / 0.2));
    const ax = lerp(rx, G.cx, k);
    const ay = lerp(ry, STRIP_Y, k);
    const right = stripX(g.first + g.n - 1, g.e);
    for (let j = 0; j < g.n; j++) {
      const i = g.first + j;
      const x = ax + (stripX(i, g.e) - right);
      nodes.push(
        <div key={i} style={{position: 'absolute', left: 0, top: 0, opacity: clamp01(u * 8 + 0.2)}}>
          <TokenTile frame={f} text={TOKS[i].t} x={x} y={ay} size={TILE} newest={1} />
        </div>,
      );
    }
  }
  return <>{nodes}</>;
};

/** A bright ring under the strip end when three pieces land from one run. */
const BurstFlash: React.FC<{frame: number}> = ({frame: f}) => {
  const g = [...GROUPS].reverse().find((q) => q.e <= f && f - q.e < 24 && q.n === 3);
  if (!g) return null;
  const u = (f - g.e) / 24;
  const cx = (stripX(g.first, f) + stripX(g.first + g.n - 1, f)) / 2;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={cx} cy={STRIP_Y + 8} rx={230 + 170 * EASE.out(u)} ry={54 + 40 * EASE.out(u)} fill="none" stroke={PAL.info} strokeWidth={5} opacity={0.95 * (1 - u)} />
      <ellipse cx={cx} cy={STRIP_Y + 8} rx={250} ry={70} fill={PAL.info} opacity={0.2 * (1 - u)} />
    </svg>
  );
};

/* ---------------------------------------------------------------- the two tricks, docking onto the ring */
const LEFT = {y: G.cy, w: 400};
const RIGHT = {y: G.cy + 6, w: 420};
const Dock: React.FC<{frame: number; x: number; y: number; at: number}> = ({frame: f, x, y, at}) => {
  const d = f - at;
  if (d < 0) return null;
  const fade = 1 - 0.8 * prog(f, A.none, 14);
  const fl = Math.exp(-d / 6);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={fade}>
      <circle cx={x} cy={y} r={14 + 70 * (1 - fl)} fill="none" stroke={PAL.info} strokeWidth={3} opacity={fl} />
      <circle cx={x} cy={y} r={10} fill={PAL.info} opacity={0.5 + 0.5 * fl} />
      <circle cx={x} cy={y} r={26} fill={rgba(PAL.info, 0.25)} />
    </svg>
  );
};

/* ---------------------------------------------------------------- the shot */
export const LOOP_CAM: CamKey[] = [
  {f: LOOP_F0, x: 960, y: 400, zoom: 1.6, rot: -0.8},
  {f: A.from, x: 960, y: 400, zoom: 1.58, rot: -0.8},
  {f: A.from + 16, x: 952, y: 470, zoom: 1.08, rot: -0.3, ease: 'outExpo'},
  {f: A.tricks - 6, x: 948, y: 470, zoom: 1.07, rot: -0.2, ease: 'inOut'},
  {f: A.howLong + 6, x: 960, y: 466, zoom: 1.05, rot: 0, ease: 'inOut'},
  {f: A.howMany + 4, x: 972, y: 466, zoom: 1.05, rot: 0.15, ease: 'inOut'},
  {f: A.oneAfter - 12, x: 966, y: 462, zoom: 1.08, rot: 0.1, ease: 'inOut'},
  {f: A.loop + 2, x: 960, y: 446, zoom: 1.24, rot: 0.3, ease: 'inOut'},
  {f: A.loop + 40, x: 960, y: 444, zoom: 1.3, rot: 0.4, ease: 'out'},
];

export const LoopShot: React.FC<{frame: number}> = ({frame: f}) => {
  const p = lapsAt(f);
  const pPrev = lapsAt(f - 1);
  const t12 = [...TWELVE].reverse().find((t) => t <= f + 1) ?? -1e9;
  const chipFlash = f >= t12 - 1 ? Math.exp(-Math.max(0, f - t12) / 6) : 0;
  const burstG = [...GROUPS].reverse().find((g) => g.n === 3 && g.e <= f && f - g.e < 16);
  const ignite = Math.max(f >= A.loop ? Math.exp(-(f - A.loop) / 10) : 0, burstG ? 0.45 * Math.exp(-(f - burstG.e) / 5) : 0);
  const spin = 0.32 * prog(f, A.howLong + 4, 20) * (1 - prog(f, A.none, 20));
  // the tricks: slide in on "tricks", dock on their words, dim and fall back on "None"
  const inL = springAt(f, A.tricks - 10, SPRING.soft);
  const dockL = springAt(f, A.howLong, SPRING.snap);
  const inR = springAt(f, A.tricks - 4, SPRING.soft);
  const dockR = springAt(f, A.howMany, SPRING.snap);
  const away = prog(f, A.none, 22, EASE.inOut);
  const nineX = G.cx - G.r - 22;
  const threeX = G.cx + G.r + G.r * 0.25 + 10;
  const xL = lerp(lerp(-400, nineX - 330, Math.min(1.05, inL)), nineX - LEFT.w / 2 - 6, Math.min(1.08, dockL)) - 120 * away;
  const xR = lerp(lerp(2320, threeX + 360, Math.min(1.05, inR)), threeX + RIGHT.w / 2, Math.min(1.08, dockR)) + 120 * away;
  const dimK = 1 - 0.58 * away;
  return (
    <Stage frame={f} env={{kind: 'chip', pulses: 0.55, dust: 40}} cam={LOOP_CAM}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: prog(f, A.from + 8, 14, EASE.out) * (1 - prog(f, A.oneAfter - 16, 22, EASE.inOut))}}>
        <StripRow frame={f} />
        <BurstFlash frame={f} />
      </div>
      <TheLoop frame={f} g={G} p={p} pPrev={pPrev} drawn={1} ignite={ignite} spin={spin} chevrons={0.4} chip={{opacity: 1, flash: chipFlash}} pick={{rot: pickRot(f), rotPrev: pickRot(f - 1), lit: pickLit(f), k: sliceOf(Math.floor(p)), opacity: 1, scale: 1}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - prog(f, A.oneAfter - 16, 22, EASE.inOut)}}>
        <Riders frame={f} />
      </div>
      <Prop
        frame={f}
        src="BIM181_T03_quantized-weight_a"
        x={xL}
        y={LEFT.y}
        w={LEFT.w}
        tiltX={12}
        rim={{color: PAL.info, strength: 0.3 + 0.55 * clamp01(dockL) * (1 - away)}}
        brightness={dimK}
        sweep={{at: [A.howLong - 2], dur: 30, strength: 0.8}}
        float={4}
        shadow={0.45}
      />
      <Prop
        frame={f}
        src="BIM185_T03_draft-target_a"
        x={xR}
        y={RIGHT.y}
        w={RIGHT.w}
        tiltX={10}
        rim={{color: PAL.info, strength: 0.3 + 0.55 * clamp01(dockR) * (1 - away)}}
        brightness={dimK}
        sweep={{at: [A.howMany - 2], dur: 30, strength: 0.8}}
        float={4}
        shadow={0.45}
      />
      <Dock frame={f} x={nineX + 4} y={G.cy} at={A.howLong + 4} />
      <Dock frame={f} x={threeX - 4} y={G.cy} at={A.howMany + 4} />
      <KineticText frame={f} at={A.howLong} exitAt={A.none} text="How long each run takes" mode="rise" size={56} screen maxWidth={440} x={nineX - LEFT.w / 2 - 6} y={G.cy - 186} />
      <KineticText frame={f} at={A.howMany} exitAt={A.none} text="How many pieces per run" mode="rise" size={56} screen maxWidth={520} x={threeX + RIGHT.w / 2} y={G.cy - 196} />
      <KineticText frame={f} at={A.oneAfter} text="One after another" mode="slam" size={94} screen maxWidth={520} x={G.cx - 26} y={G.cy + 8} backing="none" />
    </Stage>
  );
};
