/**
 * S2 shots A and C: the bench set. Shot A (night stage): the title tiles are picked up and become one plain
 * sentence; the stylus chops it into tokens that click into a two-rail token bench and flip to their IDs. Shot C (the
 * reader's desk, defocused): the count to 11, Meta's Llama's identical pieces (the bench orbits), every word = one
 * piece (word cards drop onto their tiles). Everything is a pure function of the absolute frame.
 */
import React, {useId} from 'react';
import {
  EASE,
  Counter,
  KineticText,
  Label,
  PAL,
  SANS,
  SPRING,
  Stage,
  clamp01,
  lerp,
  poseAt,
  prog,
  rgba,
  safeId,
  springAt,
  toScreen,
  track,
  useFontsReady,
  win,
  type CamKey,
  type EnvSpec,
} from '../../kit';
import {A, IDS, TOKENS} from './data';
import {BenchBack, BenchFront, BenchShadow, benchGeo} from './Bench';
import {Blade} from './Blade';
import {BitHops, Chop, WordCard} from './fx';
import {Tile} from './Tile';
import {rowLayout, tileWidth, tw} from './widths';

export const SZ = 72;
const TH = SZ * 1.5;
const PAD = 12;
const YS = 250;
const T1 = 610;
const T2 = 868;
const TITLE_Y = 430;
const N = TOKENS.length;
const SPLIT = 5; // rail 1: Why … arrive; rail 2: one … ?
const FLIP = {damping: 14, stiffness: 110, mass: 0.8};
const BK_BLADE = 0.38;
/** bigger ID digits on the tile backs (the payoff must read on a phone) */
const ID_SCALE = 0.95;
/** the question as its real token pieces (leading spaces belong to the next piece) */
const PARTS = ['Why', ' do', ' AI', ' answers', ' arrive', ' one', ' piece', ' at', ' a', ' time', '?'];
const LABEL = 76;
/** orbit pivot (world) and perspective for the Llama beat */
const ORB = {x: 960, y: 740, d: 2400};

/* ------------------------------------------------------------ layout (measured once fonts are ready) */
export const useBenchLayout = () => {
  useFontsReady();
  const W = TOKENS.map((t, i) => tileWidth(t, SZ, IDS[i], ID_SCALE));
  const inner = W.map((w) => w + 2 * PAD);
  const gA = benchGeo(inner.slice(0, SPLIT), 960, T1);
  const gB = benchGeo(inner.slice(SPLIT), 960, T2);
  const slot = (i: number) => (i < SPLIT ? gA.slots[i] : gB.slots[i - SPLIT]);
  const rowY = (i: number) => (i < SPLIT ? T1 : T2);
  // the plain sentence is ONE string; word positions are measured from its prefixes
  const sW = tw(PARTS.join(''), SZ, 600);
  const x0 = 960 - sW / 2;
  const gs = PARTS.map((p, k) => x0 + tw(PARTS.slice(0, k).join('') + (p.startsWith(' ') ? ' ' : ''), SZ, 600));
  const gw = PARTS.map((p) => tw(p.trim(), SZ, 600));
  const wc = gs.map((g, k) => g + gw[k] / 2);
  const cuts = PARTS.slice(1).map((p, j) => (p.startsWith(' ') ? (gs[j] + gw[j] + gs[j + 1]) / 2 : gs[j + 1] - 1));
  const tl = gw.map((w) => w + 20);
  // the tiles first line up with clear gaps (never touching), then close up into the sentence as their bodies drop
  const lineGap = 24;
  const lineTotal = tl.reduce((a, b) => a + b, 0) + lineGap * (N - 1);
  let lx = 960 - lineTotal / 2;
  const lc = tl.map((w) => {
    const c = lx + w / 2;
    lx += w + lineGap;
    return c;
  });
  const L = rowLayout(TOKENS, SZ, (18 * SZ) / 84, IDS, (1700 * SZ) / 84, ID_SCALE);
  const P = L.xs.map((x, i) => ({x: 960 + x, y: TITLE_Y + L.ys[i]}));
  return {W, inner, gA, gB, slot, rowY, x0, gs, gw, wc, cuts, tl, lc, P, lineR: gs[N - 1] + gw[N - 1]};
};
export type BenchLayout = ReturnType<typeof useBenchLayout>;

/* ------------------------------------------------------------ schedule */
const pickAt = (i: number) => A.first + 2 + i * 1.2;
// the bodies fall away in place (a tile never travels with its body, so tiles can never collide) ...
const bodyAt = (i: number) => A.first + 12 + i * 1.2;
// ... then the bare words glide into one sentence: rail-1 words up-left (leftmost first), rail-2 words right first,
// then up (rightmost first), so no word ever crosses another
const mv1 = (i: number) => A.first + 22 + 1.2 * i;
const MV1 = 18;
const mv2 = (j: number) => A.first + 26 + 1.2 * (N - SPLIT - 1 - j);
const MV2 = 20;
const swapAt = (i: number) => A.words - 2 + 0.5 * i;
export const cutAt = (j: number) => A.chops + j * 5;
const relAt = (i: number) => (i < N - 1 ? cutAt(i) : cutAt(N - 2) + 5);
const FLIGHT = 14;
const landAt = (i: number) => relAt(i) + FLIGHT;
/** Llama's cuts: one laser per slot edge, rail 1 then rail 2; a tile is confirmed when its right edge lands */
const laserAt = (rail: number, k: number) => A.cuts + 2 + (rail === 0 ? 2 * k : 14 + 2 * k);
const checkAt = (i: number) => (i < SPLIT ? laserAt(0, i + 1) : laserAt(1, i - SPLIT + 1)) + 4;
const cardAt = (i: number) => A.everyWord + 2.2 * i;
const flipOf = (f: number, i: number) => {
  const v =
    springAt(f, A.swaps + 3 * i, FLIP) - springAt(f, A.our + 2 * i, FLIP) + springAt(f, A.come + 2 * i, FLIP) - springAt(f, A.llama + 10 + 2 * i, FLIP);
  return Math.max(-0.08, Math.min(1.08, v));
};
const landSquash = (c: number) => (c >= 0 && c < 18 ? 0.08 * Math.exp(-c / 3) * Math.cos(c * 0.9) : 0);

/** the Llama beat orbits the bench about 15° (degrees, negative = right side swings toward us) */
const orbitDeg = (f: number) =>
  track(f, [
    [A.llama - 6, 0],
    [A.llama + 34, -14, EASE.cam],
    [A.same + 24, -17, (t) => t],
    [A.here + 26, 0, EASE.cam],
    [A.isnt + 4, 9, EASE.inOut],
  ]);
/** a world point through the orbit (CSS perspective(d) rotateY(a) about ORB) */
const orbitPt = (f: number, x: number, y: number) => {
  const a = (orbitDeg(f) * Math.PI) / 180;
  if (Math.abs(a) < 1e-4) return {x, y};
  const dx = x - ORB.x;
  const z = -dx * Math.sin(a);
  const s = ORB.d / (ORB.d - z);
  return {x: ORB.x + dx * Math.cos(a) * s, y: ORB.y + (y - ORB.y) * s};
};

/* ------------------------------------------------------------ camera, environment */
export const benchCam = (L: BenchLayout): CamKey[] => {
  const t0 = L.slot(0).cx;
  return [
    {f: A.first, x: 960, y: TITLE_Y, zoom: 84 / 72},
    {f: A.first + 52, x: 960, y: 330, zoom: 0.98, dur: 50},
    {f: A.wayYouDo + 24, x: 960, y: 300, zoom: 1.05},
    {f: A.chops - 2, x: 930, y: 556, zoom: 0.9, dur: 32},
    {f: A.chops + 50, x: 990, y: 562, zoom: 0.9},
    {f: A.tokens + 14, x: 960, y: 650, zoom: 0.98, dur: 26},
    {f: A.swaps + 30, x: 960, y: 668, zoom: 1.02},
    {f: A.id + 6, x: t0 + 250, y: 640, zoom: 1.45, dur: 30},
    {f: A.from + 6, x: t0 + 215, y: 632, zoom: 1.56},
    // shot C, after the drawer: a move per beat
    {f: A.with - 14, x: 960, y: 680, zoom: 0.98, dur: 30},
    {f: A.come + 16, x: 960, y: 690, zoom: 1.03, dur: 140},
    {f: A.numbersEnd + 8, x: 990, y: 682, zoom: 1.1, dur: 40},
    {f: A.llama + 34, x: 930, y: 700, zoom: 0.96, dur: 46},
    {f: A.same + 20, x: 960, y: 690, zoom: 1.0},
    {f: A.everyWord + 4, x: 900, y: 650, zoom: 1.04, dur: 30},
    {f: A.isnt + 4, x: 1040, y: 720, zoom: 1.15},
  ];
};
export const BENCH_SHAKE = [{at: A.eleven, strength: 1.0}];
const envAt = (f: number): EnvSpec =>
  f < A.from
    ? {kind: 'night', dust: 70}
    : {kind: 'photo', plate: 'reader-desk', parallax: 0.25, blur: 16, dim: 0.42, tint: 0.3, floor: 0.45, kb: {from: {s: 1.26, x: 30, y: 30}, to: {s: 1.34, x: -50, y: 10}, start: A.with - 14, end: A.isnt + 14}};

/* ------------------------------------------------------------ the blade's path (shot A) */
const bladeAt = (f: number, L: BenchLayout) => {
  const hoverY = YS - 90;
  const cutY = YS + 70;
  const c0 = cutAt(0);
  const c9 = cutAt(N - 2);
  let x = L.cuts[0];
  let y = hoverY;
  let tilt = 0;
  let op = 1;
  if (f < c0 - 4) {
    const u = prog(f, A.aTok, 26, EASE.outBack);
    const v = prog(f, A.aTok, 26, EASE.out);
    x = lerp(L.cuts[0] + 340, L.cuts[0], v);
    y = lerp(-820, hoverY, u) + Math.sin(f / 9) * 4 * v;
    tilt = lerp(30, 0, v);
    op = prog(f, A.aTok - 2, 6);
  } else if (f <= c9 + 3) {
    let j = 0;
    for (let k = 0; k < N - 1; k++) if (f >= cutAt(k)) j = k;
    const nx = j < N - 2 ? L.cuts[j + 1] : L.cuts[j];
    x = f < c0 ? L.cuts[0] : lerp(L.cuts[j], nx, EASE.inOut(clamp01((f - cutAt(j) - 1) / 3)));
    let pl = 0;
    for (let k = 0; k < N - 1; k++) {
      const d = f - cutAt(k);
      if (d >= -2 && d <= 0) pl = Math.max(pl, EASE.inCubic((d + 2) / 2));
      else if (d > 0 && d <= 3) pl = Math.max(pl, 1 - EASE.out(d / 3));
    }
    y = lerp(hoverY, cutY, pl);
  } else {
    // lifts away, tilting
    const u = prog(f, c9 + 3, 18, EASE.inCubic);
    x = L.cuts[N - 2] + 60 * u;
    y = hoverY - 900 * u;
    tilt = -16 * u;
    op = 1 - prog(f, c9 + 15, 6);
  }
  return {x, y, tilt, op};
};

/* ------------------------------------------------------------ the scene */
export const BenchScene: React.FC<{frame: number}> = ({frame: f}) => {
  const gid = safeId(useId());
  const L = useBenchLayout();
  const {gA, gB, W, wc, tl, lc, P} = L;
  const cam = benchCam(L);
  const pose = poseAt(f, cam, 1, BENCH_SHAKE);
  const scr = (x: number, y: number) => {
    const o = orbitPt(f, x, y);
    return toScreen(pose, o.x, o.y);
  };

  // the two-rail bench rises into place while the tiles are picked up
  const slamT = f - A.eleven;
  const dyR = 700 * (1 - springAt(f, A.first + 16, SPRING.heavy)) + (slamT >= 0 && slamT < 24 ? 10 * Math.exp(-slamT / 3.5) * Math.cos(slamT * 0.9) : 0);
  const opR = prog(f, A.first + 14, 6);

  /* ---- tiles */
  const seatedA: React.ReactNode[] = [];
  const seatedB: React.ReactNode[] = [];
  const flyA: React.ReactNode[] = [];
  const flyB: React.ReactNode[] = [];
  const pre: React.ReactNode[] = [];
  const spanOp: number[] = [];
  const spanDx: number[] = [];
  const spanGlow: number[] = [];
  const readX = lerp(L.x0 - 120, L.lineR + 120, prog(f, A.wayYouDo - 4, 30, EASE.inOut));
  const readOn = win(f, A.wayYouDo - 6, A.youDoEnd + 10, 4, 10);
  for (let i = 0; i < N; i++) {
    const slot = L.slot(i);
    const ry = L.rowY(i);
    let x = P[i].x;
    let y = P[i].y;
    let w = W[i];
    let body = 1;
    let bodyDy = 0;
    let lift = 0;
    let rot = 0;
    let scale = 1;
    let squash = 0;
    let click: number | undefined;
    let glow = 0;
    let emph = 0;
    let flip = 0;
    let op = 1;
    let where: 'pre' | 'fly' | 'seat' | 'none' = 'pre';
    // the plain sentence (one string): this word's span
    let sOp = 0;
    let sDx = 0;
    const b0 = bodyAt(i);
    if (f < relAt(i)) {
      // picked up: the tile lifts, its body falls away in place, and the bare word glides into one sentence line
      const lift0 = 0.1 * Math.min(1.1, springAt(f, pickAt(i), SPRING.snap));
      let u = 0;
      if (i < SPLIT) {
        u = prog(f, mv1(i), MV1, EASE.inOut);
        x = lerp(P[i].x, wc[i], u);
        y = lerp(P[i].y, YS, u);
      } else {
        u = prog(f, mv2(i - SPLIT), MV2);
        x = lerp(P[i].x, wc[i], EASE.out(u));
        y = lerp(P[i].y, YS, EASE.inCubic(u));
      }
      lift = lift0 * (1 - EASE.inOut(u));
      rot = (i % 2 ? 1.2 : -1.2) * clamp01((f - pickAt(i)) / 8) * (1 - prog(f, bodyAt(i), 8));
      body = 1 - prog(f, bodyAt(i), 6);
      bodyDy = 90 * prog(f, bodyAt(i), 6, EASE.inCubic);
      op = f >= swapAt(i) + 1 ? 0 : 1;
      sOp = f >= swapAt(i) ? 1 : 0;
      if (op <= 0.001) where = 'none';
      // recoil of the words still waiting, from the cuts to their left
      for (let j = 0; j < i && j < N - 1; j++) {
        const d = f - cutAt(j);
        if (d >= 0 && d < 14) sDx += (12 * Math.exp(-d / 3) * Math.cos(d * 0.8)) / (1 + (i - j - 1) * 0.8);
      }
    } else if (f < landAt(i)) {
      where = 'fly';
      const t = (f - relAt(i)) / FLIGHT;
      body = prog(f, relAt(i), 4, EASE.out);
      scale = 0.9 + 0.1 * Math.min(1.08, springAt(f, relAt(i), SPRING.pop));
      // a steady fall keeps each piece >= one tile height below the next one released after it
      x = lerp(wc[i], slot.cx, EASE.inOut(clamp01((t - 0.15) / 0.75)));
      y = lerp(YS, ry + dyR, t);
      w = lerp(tl[i], W[i], EASE.inOut(clamp01(t / 0.6)));
      rot = (i % 2 ? 1.5 : -1.5) * Math.sin(Math.PI * t);
    } else {
      where = 'seat';
      x = slot.cx;
      y = ry + dyR;
      click = f - landAt(i);
      squash = landSquash(click);
      // "11 numbers": all eleven tiles rise together, then slam down as one
      if (f >= A.eleven - 9 && f < A.eleven) lift = 0.13 * EASE.out(clamp01((f - (A.eleven - 9)) / 7));
      if (slamT >= 0 && slamT < 18) {
        click = slamT;
        squash = landSquash(slamT) * 1.5;
      }
      // Llama's cut confirms the piece: a short press and a click
      const lk = f - checkAt(i);
      if (lk >= 0 && lk < 18) {
        click = lk;
        squash = landSquash(lk) * 0.9;
      }
      flip = flipOf(f, i);
      glow = i < N - 1 ? win(f, landAt(i), landAt(i + 1) + 6, 1, 8) : win(f, landAt(i), landAt(i) + 34, 1, 12);
      glow += win(f, A.swaps + 3 * i, A.swaps + 3 * i + 14, 2, 8) * 0.8;
      glow += win(f, A.come + 2 * i, A.come + 2 * i + 12, 2, 8) * 0.8;
      if (f >= A.eleven) glow += Math.exp(-(f - A.eleven) / 9);
      if (f >= checkAt(i)) glow += 0.9 * (1 - prog(f, checkAt(i), 18));
      if (f >= cardAt(i) + 8) glow += 0.9 * (1 - prog(f, cardAt(i) + 8, 18));
      if (!(f >= A.eleven - 9 && f < A.eleven)) lift = 0.06 * Math.sin(Math.PI * prog(f, cardAt(i) + 6, 10));
    }
    spanOp.push(sOp);
    spanDx.push(sDx);
    spanGlow.push(readOn * Math.exp(-(((wc[i] - readX) / 120) ** 2)));
    if (i === N - 1) {
      emph = 1 - prog(f, A.first + 4, 26);
      emph += win(f, A.questionMark, A.questionMark + 34, 3, 12);
      if (f >= A.questionMark) scale *= 1 + 0.14 * Math.exp(-(f - A.questionMark) / 6) * Math.cos((f - A.questionMark) * 0.6);
    }
    if (where === 'none') continue;
    const node = (
      <Tile
        key={`t${i}`}
        x={x}
        y={y}
        w={w}
        size={SZ}
        text={TOKENS[i]}
        id={IDS[i]}
        flip={flip}
        lift={lift}
        rot={rot}
        scale={scale}
        squash={squash}
        body={body}
        bodyDy={bodyDy}
        glow={Math.min(1, glow)}
        emph={Math.min(1, emph)}
        click={click}
        opacity={op}
        idScale={ID_SCALE}
      />
    );
    if (where === 'seat') (i < SPLIT ? seatedA : seatedB).push(node);
    else if (where === 'fly') (i < SPLIT ? flyA : flyB).push(node);
    else pre.push(node);
  }

  /* ---- the plain sentence: one string, natural spacing, each piece fades as it is cut off */
  const lineOn = spanOp.some((o) => o > 0.001);
  const line = lineOn ? (
    <div
      style={{
        position: 'absolute',
        left: L.x0,
        top: YS,
        transform: `translateY(calc(-50% - ${SZ * 0.02}px))`,
        whiteSpace: 'pre',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: SZ,
        lineHeight: 1,
        color: PAL.ink,
      }}
    >
      {PARTS.map((p, k) => (
        <span
          key={k}
          style={{
            display: 'inline-block',
            opacity: spanOp[k],
            transform: spanDx[k] ? `translateX(${spanDx[k]}px)` : undefined,
            textShadow: [`0 0 14px ${rgba('#9FD8FF', 0.3)}`, spanGlow[k] > 0.01 ? `0 0 ${10 + 16 * spanGlow[k]}px ${rgba('#FFE9C8', 0.85 * spanGlow[k])}` : ''].filter(Boolean).join(', '),
          }}
        >
          {p}
        </span>
      ))}
    </div>
  ) : null;

  /* ---- Meta's Llama: its cuts drop as lasers exactly on the bench's slot edges (same pieces, nothing stacked) */
  const lasers: React.ReactNode[] = [];
  if (f >= A.cuts && f < A.here + 4) {
    [gA, gB].forEach((g, r) => {
      const ry = r === 0 ? T1 : T2;
      const divW = 31 * g.k;
      const edges = [g.slots[0].x0 - 3, ...g.slots.map((sl, k) => (k < g.slots.length - 1 ? sl.x0 + sl.w + divW / 2 : sl.x0 + sl.w + 3))];
      edges.forEach((ex, k) => {
        const a = laserAt(r, k);
        const grow = prog(f, a, 6, EASE.out);
        if (grow <= 0) return;
        const fade = 1 - prog(f, A.piecesEnd - 4, 16);
        const yTop = ry - TH / 2 - 40 + dyR;
        const yBot = lerp(yTop, ry + TH / 2 + 34 + dyR, grow);
        const flash = Math.exp(-Math.max(0, f - a - 6) / 5);
        lasers.push(
          <g key={`${r}-${k}`} opacity={fade}>
            <line x1={ex} y1={yTop} x2={ex} y2={yBot} stroke={PAL.info} strokeWidth={14} strokeOpacity={0.18 + 0.25 * flash} strokeLinecap="round" />
            <line x1={ex} y1={yTop} x2={ex} y2={yBot} stroke={PAL.infoPale} strokeWidth={3.5} strokeLinecap="round" />
            {grow < 1 ? <circle cx={ex} cy={yBot} r={8} fill="#FFFFFF" /> : null}
          </g>,
        );
      });
    });
  }
  const checks: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const d = f - checkAt(i);
    if (d < 0 || d > 30) continue;
    const s = L.slot(i);
    const y = L.rowY(i) - TH / 2 - 26;
    const sc = Math.min(1.15, springAt(f, checkAt(i), SPRING.pop));
    checks.push(
      <g key={i} opacity={1 - clamp01((d - 16) / 14)} transform={`translate(${s.cx} ${y}) scale(${sc})`}>
        <circle r={22} fill={PAL.info} />
        <path d="M -10 1 L -3 8 L 11 -8" fill="none" stroke="#06202A" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  }

  /* ---- every word = one piece: a word card drops onto each tile */
  const cards: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const a = cardAt(i);
    if (f < a - 1 || f > a + 26) continue;
    const s = L.slot(i);
    const ry = L.rowY(i);
    // the word card stamps down onto its tile (from the camera, no travel across the other rail)
    const fall = prog(f, a, 8, EASE.inCubic);
    const c = f - (a + 8);
    const sc = lerp(1.45, 1, fall);
    cards.push(
      <div key={`w${i}`} style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${s.cx}px ${ry - 6}px`, transform: `scale(${sc})`, filter: fall < 1 ? `blur(${(1 - fall) * 6}px)` : undefined}}>
        <WordCard x={s.cx} y={ry - 6} w={W[i] + 14} h={TH + 12} size={SZ} text={TOKENS[i]} squash={landSquash(c)} opacity={clamp01((f - a + 1) / 4) * (1 - prog(f, a + 12, 12))} />
      </div>,
    );
  }

  /* ---- blade, chops */
  const bl = bladeAt(f, L);
  const blP = bladeAt(f - 1, L);
  const chops: React.ReactNode[] = [];
  for (let j = 0; j < N - 1; j++) {
    const d = f - cutAt(j);
    if (d >= -1 && d <= 16) chops.push(<Chop key={j} x={L.cuts[j]} y={YS + 6} h={TH * 0.95} t={d} seed={`s2cut${j}`} scale={1.25} />);
  }
  const bladeEdge = win(f, A.chops - 6, cutAt(N - 2) + 8, 4, 10) * 0.7;

  /* ---- reading sweep under the plain sentence */
  const sweepBar =
    readOn > 0.01 ? (
      <div
        style={{
          position: 'absolute',
          left: readX - 170,
          top: YS + 58,
          width: 340,
          height: 10,
          borderRadius: 5,
          background: `linear-gradient(90deg, rgba(255,233,200,0), ${rgba('#FFE9C8', 0.85 * readOn)}, rgba(255,233,200,0))`,
          filter: 'blur(1.5px)',
          boxShadow: `0 0 24px ${rgba('#FFD9A0', 0.5 * readOn)}`,
        }}
      />
    ) : null;

  /* ---- Bit hops along the flip waves */
  const tops = TOKENS.map((_, i) => ({x: L.slot(i).cx, y: L.rowY(i) - TH / 2 - 32}));
  const hopsA = TOKENS.map((_, i) => A.swaps + 3 * i);
  const hopsC = TOKENS.map((_, i) => A.come + 2 * i);

  /* ---- light sweeps: along the lips, and a broad band across both rails on "same 11" */
  let sweep: number | null = null;
  for (const s of [A.tokens + 4, A.openai, A.same]) if (f >= s && f <= s + 34) sweep = (f - s) / 34;
  const band = prog(f, A.same - 4, 30, EASE.inOut);
  const bandOn = f >= A.same - 4 && f <= A.same + 26;

  /* ---- hud: the equation 10 words + ? → 11 numbers, centred */
  const EQ_Y = 296;
  const EQ_OUT = A.numbersEnd + 18;
  const fs = 86;
  const fc = 184;
  const fn = 110;
  const wTen = tw('10 words', fs, 700);
  const wPlus = tw('+ ?', fs, 700);
  const wArrow = fs * 0.9;
  const wC = 2 * 0.64 * fc;
  const wNum = tw('numbers', fn, 700);
  const gq = 34;
  const eqTotal = wTen + gq + wPlus + gq * 1.4 + wArrow + gq * 1.4 + wC + 20 + wNum;
  const ex0 = 960 - eqTotal / 2;
  const EQ = {
    ten: ex0 + wTen / 2,
    plus: ex0 + wTen + gq + wPlus / 2,
    arrow: ex0 + wTen + gq + wPlus + gq * 1.4 + wArrow / 2,
    count: ex0 + wTen + gq + wPlus + gq * 2.8 + wArrow + wC / 2,
    num: ex0 + wTen + gq + wPlus + gq * 2.8 + wArrow + wC + 20,
  };
  const slam11 = f >= A.eleven ? 1 + 0.32 * Math.exp(-(f - A.eleven) / 3.2) * Math.cos((f - A.eleven) * 0.75) : 1;
  const g0 = scr(L.slot(0).cx, L.rowY(0) - TH / 2 + dyR);
  // the tokenizer's role label: top-right, its leader to the blade while the blade is left of the box
  const tokW = tw('Tokenizer', LABEL, 600) + 0.84 * LABEL;
  const tokX = 1840 - tokW;
  const bladeTip = scr(bl.x, bl.y - 150);
  const tokTo = bladeTip.x < tokX - 60 && f < cutAt(N - 2) + 6 ? bladeTip : undefined;
  const hud = (
    <>
      {f >= A.tokenizer - 4 && f < A.swaps + 14 ? <Label frame={f} at={A.tokenizer} exitAt={A.swaps + 4} text="Tokenizer" x={tokX} y={112} to={tokTo} side="right" size={LABEL} screen /> : null}
      <KineticText frame={f} at={A.tokens} exitAt={A.tokensEnd + 18} text="tokens" mode="slam" x={960} y={262} size={110} screen />
      {f >= A.with - 10 ? (
        <>
          <Label frame={f} at={A.openai} exitAt={A.numbersEnd + 16} text="OpenAI's open-source tokenizer" x={96} y={116} size={LABEL} screen />
          <KineticText frame={f} at={A.ten} exitAt={EQ_OUT} text="10 words" mode="pop" x={EQ.ten} y={EQ_Y} size={fs} screen />
          <KineticText frame={f} at={A.questionMark} exitAt={EQ_OUT} text="+ ?" mode="slam" x={EQ.plus} y={EQ_Y} size={fs} accent={PAL.emphasis} screen />
          <KineticText frame={f} at={A.come} exitAt={EQ_OUT} text="→" mode="pop" x={EQ.arrow} y={EQ_Y} size={fs} color={PAL.info} backing="none" screen />
          {f >= A.come - 2 && f < EQ_OUT + 12 ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: 1920,
                height: 1080,
                transformOrigin: `${EQ.count}px ${EQ_Y}px`,
                transform: `scale(${slam11})`,
                filter: f >= A.eleven && f < A.eleven + 8 ? `brightness(${1 + 0.9 * Math.exp(-(f - A.eleven) / 2.5)})` : undefined,
              }}
            >
              <Counter frame={f} at={A.come} dur={A.eleven - A.come} from={0} to={11} x={EQ.count} y={EQ_Y - 6} size={fc} exitAt={EQ_OUT} backing="scrim" />
            </div>
          ) : null}
          <KineticText frame={f} at={A.numbers} exitAt={EQ_OUT} text="numbers" mode="slam" x={EQ.num} y={EQ_Y + 18} size={fn} align="left" screen />
          {f >= A.eleven && f < A.eleven + 24 ? (
            <div
              style={{
                position: 'absolute',
                left: EQ.count - 400,
                top: EQ_Y - 400,
                width: 800,
                height: 800,
                borderRadius: '50%',
                background: `radial-gradient(closest-side, ${rgba(PAL.info, 0.4 * (1 - (f - A.eleven) / 24))}, ${rgba(PAL.info, 0)})`,
                transform: `scale(${0.4 + 0.9 * EASE.out((f - A.eleven) / 24)})`,
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
          <Label frame={f} at={A.llama} exitAt={A.piecesEnd + 16} text="Meta's Llama" x={96} y={116} to={g0} side="right" size={LABEL} screen />
          <KineticText frame={f} at={A.same} exitAt={A.piecesEnd + 16} text="Same 11 pieces ✓" mode="slam" x={960} y={262} size={104} screen />
          <KineticText frame={f} at={A.word} exitAt={A.isnt + 2} text="Every word = one piece" mode="pop" x={960} y={262} size={96} screen />
        </>
      ) : null}
    </>
  );

  const deg = orbitDeg(f);
  return (
    <Stage frame={f} env={envAt(f)} cam={cam} shake={BENCH_SHAKE} hud={hud}>
      <div
        style={{
          position: 'absolute',
          left: 960 - 1300,
          top: (T1 + T2) / 2 - 520 + dyR,
          width: 2600,
          height: 1040,
          borderRadius: '50%',
          opacity: opR * (f < A.from ? 1 : 0.7),
          background: `radial-gradient(closest-side, ${rgba('#2A6BB0', 0.34)}, ${rgba('#173A6A', 0.16)} 55%, ${rgba('#0B1830', 0)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: `${ORB.x}px ${ORB.y}px`,
          transform: Math.abs(deg) > 0.01 ? `perspective(${ORB.d}px) rotateY(${deg}deg)` : undefined,
        }}
      >
        <BenchShadow g={gA} dy={dyR} opacity={opR} />
        <BenchBack g={gB} dy={dyR} opacity={opR} light={win(f, A.come, A.numbersEnd, 6, 20) * 0.8} />
        {seatedB}
        {flyB}
        <BenchFront g={gB} dy={dyR} opacity={opR} sweep={sweep} />
        <BenchBack g={gA} dy={dyR} opacity={opR} light={win(f, A.come, A.numbersEnd, 6, 20) * 0.8} shadow={false} />
        {seatedA}
        {flyA}
        <BenchFront g={gA} dy={dyR} opacity={opR} sweep={sweep} />
        {slamT >= 0 && slamT < 16
          ? [gA, gB].map((g, r) => {
              const u = EASE.out(slamT / 16);
              const half = ((g.x1 - g.x0) / 2) * u;
              return (
                <div
                  key={`sh${r}`}
                  style={{
                    position: 'absolute',
                    left: 960 - half,
                    top: g.Y(412) + dyR - 4,
                    width: half * 2,
                    height: 8,
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${rgba(PAL.info, 0)}, ${rgba('#E9FDFF', 0.95 * (1 - u))}, ${rgba(PAL.info, 0)})`,
                    boxShadow: `0 0 ${24 + 30 * (1 - u)}px ${rgba(PAL.info, 0.8 * (1 - u))}`,
                  }}
                />
              );
            })
          : null}
        {cards}
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {lasers}
          {checks}
        </svg>
        {bandOn ? (
          <div
            style={{
              position: 'absolute',
              left: gA.x0 - 80,
              top: T1 - 120,
              width: gA.x1 - gA.x0 + 160,
              height: T2 - T1 + 280,
              background: `linear-gradient(105deg, rgba(255,255,255,0) ${band * 140 - 30}%, ${rgba('#DFFBFF', 0.42 * Math.sin(Math.PI * band))} ${band * 140 - 18}%, rgba(255,255,255,0) ${band * 140 - 6}%)`,
              mixBlendMode: 'screen',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </div>
      {sweepBar}
      {line}
      {pre}
      <BitHops frame={f} times={hopsA} pts={tops} until={A.id + 2} gid={`${gid}a`} />
      <BitHops frame={f} times={hopsC} pts={tops} until={A.numbersEnd + 6} gid={`${gid}c`} />
      {chops}
      {f >= A.aTok - 4 && f < cutAt(N - 2) + 24 ? (
        <Blade
          tipX={bl.x}
          tipY={bl.y}
          k={BK_BLADE}
          tilt={bl.tilt}
          opacity={bl.op}
          vx={bl.x - blP.x}
          vy={bl.y - blP.y}
          sweep={f >= A.tokenizer && f <= A.tokenizer + 22 ? (f - A.tokenizer) / 22 : null}
          edge={bladeEdge}
        />
      ) : null}
    </Stage>
  );
};

/** Screen point of tile 1 ("Why") at a frame, for the zoom-through into the vocabulary. */
export const useTile0Screen = (f: number) => {
  const L = useBenchLayout();
  const pose = poseAt(f, benchCam(L), 1, BENCH_SHAKE);
  return toScreen(pose, L.slot(0).cx, T1);
};
