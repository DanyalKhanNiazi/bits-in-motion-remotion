/**
 * Signal Score: the score. Lanes, tracks, the nine marks, links with hops, the PRESS marker and the
 * playhead, all placed by the TimeMap (timemap.ts) from the absolute frame.
 *
 * Grammar: ink = happening now or happened; grey (structure) = off or not yet (ghosts are the future);
 * cyan = a signal travelling; amber = energy, only inside double walls; annotation grey = pointers and
 * the "visited" state.
 */
import React from 'react';
import {mixColor} from '../../shared/brand';
import {rectPath, routePath, squarePath, type Pt} from '../../shared/geom';
import {bitRun, breathe, clamp01, EASE, lerp, progress, type BitRun} from '../../shared/motion';
import {AFTER, GROUND, MAP, MARK, SEAT, T, WASH, X, Y, type TrackId} from './layout';
import {F} from './timeline';
import {groupXform} from './parts';
import {MOVES, S12, offsets, playheadBaseX, pressX, stretchK} from './timemap';

/* ================================================================================================
 * Frame helpers
 * ============================================================================================== */

export const fadeIn = (f: number, at: number, n = 6) => progress(f, at, n, EASE.arrive);
export const fadeOut = (f: number, at: number, n = 6) => 1 - progress(f, at, n, EASE.exit);

/** Draw front of a track: starts at x0 at frame `at`, 50 px/frame (the brand's fill-front rate). */
const front = (f: number, at: number, x0: number) => (f < at ? -1 : x0 + 50 * (f - at));
/** Frame at which a front started at (at, x0) reaches x. */
const frontReaches = (at: number, x0: number, x: number) => at + Math.ceil((x - x0) / 50);

/** First frame of the rewind at which the playhead has passed back over x. */
const rewindPass = (x: number): number => {
  for (let f = MOVES.rewind.from; f <= MOVES.rewind.to; f++) if (playheadBaseX(f) <= x) return f;
  return MOVES.rewind.to;
};

/** Fold back (end of S06): look-ahead marks revert to ghosts right-to-left over f914-f926. */
export const foldBackAt = (x: number): number =>
  F.lookAheadOut + Math.round(6 * clamp01((X.right - x) / (X.right - MAP.M2.home)));

/** Written-ness 0..1 of a mark written at `on` and reverted at `off` (n-frame transitions). */
export const written = (f: number, on: number, off = Infinity, n = 3): number =>
  Math.min(progress(f, on, n), 1 - progress(f, off, n));

/* ================================================================================================
 * Geometry builders
 * ============================================================================================== */

export const stepPath = (x: number, y: number, w: number, h: number) => `M${x} ${y}V${y - h}H${x + w}V${y}`;

/** A vertical run at x from y0 to y1 with semicircle hops (bulging to +x) over the given track ys. */
export const dropPath = (x: number, y0: number, y1: number, hops: ReadonlyArray<{y: number; r: number}>): string => {
  const dir = y1 >= y0 ? 1 : -1;
  let d = `M${x} ${y0}`;
  const list = hops.filter((h) => h.r > 0.3).sort((a, b) => (dir === 1 ? a.y - b.y : b.y - a.y));
  for (const h of list) {
    d += `V${h.y - dir * h.r}A${h.r} ${h.r} 0 0 ${dir === 1 ? 1 : 0} ${x} ${h.y + dir * h.r}`;
  }
  return d + `V${y1}`;
};

/** A horizontal line [x0, x1] at y, minus gaps. */
export const gappedH = (x0: number, x1: number, y: number, gaps: ReadonlyArray<readonly [number, number]>): string => {
  if (x1 <= x0) return '';
  const gs = gaps.filter((g) => g[1] > x0 && g[0] < x1).sort((a, b) => a[0] - b[0]);
  let d = '';
  let cur = x0;
  for (const [a, b] of gs) {
    if (a > cur) d += `M${cur} ${y}H${a}`;
    cur = Math.max(cur, b);
  }
  if (x1 > cur) d += `M${cur} ${y}H${x1}`;
  return d;
};

export const BREAK_GAP: readonly [number, number] = [X.break0 + 6, X.break1 - 6];

/** The press link at PRESS x `p`: drop past L2 (and Q once it exists), then 45 deg onto the lookout's tick. */
export const pressLink = (p: number, tickX: number, qHop: number, l2Hop = 1) => {
  const r2 = MARK.hopR * l2Hop;
  const rq = MARK.hopR * qHop;
  const d =
    dropPath(p, Y.L1, S12.dropTo, [
      {y: Y.L2, r: r2},
      {y: Y.Q, r: rq},
    ]) + `L${tickX} ${Y.LK}`;
  const crossings: Array<{track: TrackId; x: number}> = [];
  if (r2 > 0.3) crossings.push({track: 'L2', x: p + r2});
  if (rq > 0.3) crossings.push({track: 'Q', x: p + rq});
  return {d, crossings, end: [tickX, Y.LK] as Pt};
};

/** Polyline of a run's track from arc length 0 to s. */
const trackUpTo = (r: BitRun, s: number): string => {
  const pts = r.track.pts;
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) if (r.track.cum[i] < s) out.push(pts[i]);
  const p = r.track.at(s);
  out.push([p.x, p.y]);
  return out.map((q, i) => `${i ? 'L' : 'M'}${q[0]} ${q[1]}`).join('');
};

/* ================================================================================================
 * Primitive marks
 * ============================================================================================== */

export const AxisBreak: React.FC<{y: number; h?: number}> = ({y, h = 11}) => (
  <path
    d={`M${X.break0 - 1} ${y + h}L${X.break0 + 7} ${y - h}M${X.break1 - 7} ${y + h}L${X.break1 + 1} ${y - h}`}
    stroke={T.structure}
    strokeWidth={3}
  />
);

/** A grand-staff brace joining a package's two tracks where they leave the part. */
const Brace: React.FC<{y0: number; y1: number; draw: number}> = ({y0, y1, draw}) => {
  if (draw <= 0) return null;
  const xr = 358;
  const xm = 351;
  const xt = 345;
  const ym = (y0 + y1) / 2;
  const d =
    `M${xr} ${y0}Q${xm} ${y0} ${xm} ${y0 + 10}V${ym - 10}Q${xm} ${ym} ${xt} ${ym}` +
    `Q${xm} ${ym} ${xm} ${ym + 10}V${y1 - 10}Q${xm} ${y1} ${xr} ${y1}`;
  const L = (y1 - y0) + 40;
  return <path d={d} fill="none" stroke={T.structure} strokeWidth={3} strokeDasharray={`${L * draw} ${L + 10}`} strokeLinejoin="round" />;
};

/** A double-walled channel [x0, x1] at y: walls, empty interior (main: panel), and fills. */
export const Channel: React.FC<{
  y: number;
  x0: number;
  x1: number;
  kind: 'main' | 'standby';
  fills?: ReadonlyArray<{x0: number; x1: number; color: string; opacity?: number}>;
  gaps?: ReadonlyArray<readonly [number, number]>;
  opacity?: number;
}> = ({y, x0, x1, kind, fills = [], gaps = [], opacity = 1}) => {
  if (x1 <= x0 + 0.5) return null;
  const outer = kind === 'main' ? 18 : 10;
  const wall = 2;
  const off = outer / 2 - wall / 2;
  const fillW = outer - 2 * wall;
  return (
    <g opacity={opacity}>
      {kind === 'main' ? <path d={gappedH(x0, x1, y, gaps)} stroke={T.panel} strokeWidth={fillW} /> : null}
      {fills.map((fl, i) => {
        const a = Math.max(x0, fl.x0);
        const b = Math.min(x1, fl.x1);
        if (b <= a) return null;
        return <path key={i} d={gappedH(a, b, y, gaps)} stroke={fl.color} strokeWidth={fillW} strokeOpacity={fl.opacity ?? 1} />;
      })}
      <path d={gappedH(x0, x1, y - off, gaps) + gappedH(x0, x1, y + off, gaps)} stroke={T.structure} strokeWidth={wall} />
    </g>
  );
};

export const Link: React.FC<{d: string; end: Pt; state: number; draw?: number; opacity?: number; terminal?: boolean; length?: number; ground?: string}> = ({
  d,
  end,
  state,
  draw = 1,
  opacity = 1,
  terminal = true,
  length = 900,
  ground = GROUND,
}) => {
  if (opacity <= 0 || draw <= 0) return null;
  // state: 0 = ghost (structure, the future), 1 = written (ink, it happened)
  const col = mixColor(T.structure, T.ink, state);
  const dash = draw < 1 ? {strokeDasharray: `${length * draw} ${length + 10}`} : {};
  return (
    <g opacity={opacity}>
      <path d={d} fill="none" stroke={col} strokeWidth={3} strokeLinejoin="round" {...dash} />
      {terminal && draw >= 1 ? (
        state > 0.5 ? (
          <path d={squarePath(end[0], end[1], MARK.terminal, 1)} fill={col} />
        ) : (
          <path d={squarePath(end[0], end[1], MARK.terminal - 1, 1)} fill={ground} stroke={col} strokeWidth={2} />
        )
      ) : null}
    </g>
  );
};

/** The lit segment behind a travelling Bit (cyan, decaying over 10 frames). */
export const LitBehind: React.FC<{f: number; runs: ReadonlyArray<BitRun>; width?: number}> = ({f, runs, width = 3}) => {
  const segs: React.ReactNode[] = [];
  runs.forEach((r, ri) => {
    if (f < r.depart || f > r.land + 10) return;
    const pts = r.track.pts;
    const K = 5;
    for (let k = 0; k < K; k++) {
      const s1 = r.sAt(f - 2 * k);
      const s0 = r.sAt(f - 2 * (k + 1));
      if (s1 - s0 < 0.5) continue;
      const sub: Pt[] = [];
      const pa = r.track.at(s0);
      sub.push([pa.x, pa.y]);
      for (let i = 0; i < pts.length; i++) if (r.track.cum[i] > s0 && r.track.cum[i] < s1) sub.push(pts[i]);
      const pb = r.track.at(s1);
      sub.push([pb.x, pb.y]);
      segs.push(
        <path
          key={`${ri}-${k}`}
          d={sub.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')}
          fill="none"
          stroke={T.info}
          strokeWidth={width + 1}
          strokeOpacity={1 - k / K}
          strokeLinejoin="round"
        />,
      );
    }
  });
  return <g>{segs}</g>;
};

export const Pulse: React.FC<{x: number; w?: number; state: number; opacity?: number}> = ({x, w = MARK.pulseW, state, opacity = 1}) => (
  <path
    d={stepPath(x, Y.L1, w, MARK.pulseH)}
    fill="none"
    stroke={mixColor(T.structure, T.info, state)}
    strokeWidth={3 + state}
    opacity={opacity}
  />
);

export const Tick: React.FC<{x: number; y: number; state: number; opacity?: number}> = ({x, y, state, opacity = 1}) =>
  opacity <= 0 ? null : (
    <path d={stepPath(x, y, MARK.tickW, MARK.tickH)} fill="none" stroke={mixColor(T.structure, T.ink, state)} strokeWidth={3 + state} opacity={opacity} />
  );

/** A block on a track: ghost (state 0) -> written (state 1, ink + activeFill); `visited` = annotation outline + hollow pip. */
export const Block: React.FC<{x0: number; x1: number; y: number; state: number; visited?: number; opacity?: number; writtenTo?: number; ground?: string}> = ({
  x0,
  x1,
  y,
  state,
  visited = 0,
  opacity = 1,
  writtenTo,
  ground = GROUND,
}) => {
  if (x1 - x0 < 1 || opacity <= 0) return null;
  const h = MARK.blockH;
  const ghostCol = mixColor(T.structure, T.annotation, visited);
  const wTo = writtenTo === undefined ? x1 : Math.min(x1, writtenTo);
  return (
    <g opacity={opacity}>
      <path d={rectPath(x0, y - h, x1 - x0, h, MARK.blockR)} fill={ground} stroke={ghostCol} strokeWidth={3} />
      {state > 0 && wTo > x0 + 1 ? (
        <path
          d={rectPath(x0, y - h, wTo - x0, h, MARK.blockR)}
          fill={T.activeFill}
          fillOpacity={state}
          stroke={T.ink}
          strokeOpacity={state}
          strokeWidth={4}
        />
      ) : null}
      {visited > 0 ? <path d={squarePath(x1 - 13, y - h + 13, 9, 1)} fill="none" stroke={T.annotation} strokeWidth={2} opacity={visited} /> : null}
    </g>
  );
};

/* ================================================================================================
 * Runs: the S04 demonstration, the S06 chain, the S12 drop
 * ============================================================================================== */

const P1 = MAP.M1.press;
const P2 = MAP.M2.press;
const P3 = MAP.M3.press;
const LA = AFTER.la;

export const S04_LINK = pressLink(P1, P1 + AFTER.tick, 1);
export const S04_RUN = bitRun({path: S04_LINK.d, depart: F.s04Depart, land: F.s04Land, label: 'S04 demonstration (Time Lens)'});

export const CHAIN_PTS = {
  st1: [P2 + AFTER.tick, Y.LK] as Pt,
  power: [P2 + LA.powerAnchor[0], Y.MR + LA.powerAnchor[1]] as Pt,
  q: [P2 + LA.q[0], Y.Q] as Pt,
  fw: [P2 + LA.fw[0], Y.L2] as Pt,
  loader: [P2 + LA.loader[0], Y.L2] as Pt,
  win: [P2 + LA.win[0], Y.L2] as Pt,
};

const hop1D = (() => {
  const [x, y] = CHAIN_PTS.st1;
  const [ex, ey] = CHAIN_PTS.power;
  return dropPath(x, y, ey - (ex - x), [{y: Y.SB, r: MARK.hopR}]) + `L${ex} ${ey}`;
})();
const hop2D = (() => {
  const [x, y] = CHAIN_PTS.power;
  const [ex, ey] = CHAIN_PTS.q;
  return (
    dropPath(x, y, ey + (ex - x), [
      {y: Y.SB, r: MARK.hopR},
      {y: Y.LK, r: MARK.hopR},
    ]) + `L${ex} ${ey}`
  );
})();
const hop3D = (() => {
  const [x, y] = CHAIN_PTS.q;
  const [ex, ey] = CHAIN_PTS.fw;
  const run = 24;
  return routePath([
    [x, y],
    [ex - run, y],
    [ex, y - run],
    [ex, ey],
  ]);
})();
const hop4D = routePath([CHAIN_PTS.fw, CHAIN_PTS.loader]);
const hop5D = routePath([CHAIN_PTS.loader, CHAIN_PTS.win]);
export const HOP_DS = [hop1D, hop2D, hop3D, hop4D, hop5D];
/** Index of the first hop that runs along lane 2 itself (Firmware -> Loader -> Windows): never drawn at rest. */
export const LANE2_HOPS_FROM = 3;

export const CHAIN_RUNS: BitRun[] = [
  bitRun({path: hop1D, depart: F.hop1Depart, land: F.chain[0], label: 'S06 hop 1 (power)'}),
  bitRun({path: hop2D, depart: F.hop2Depart, land: F.chain[1], label: 'S06 hop 2 (?)'}),
  bitRun({path: hop3D, depart: F.hop3Depart, land: F.chain[2], label: 'S06 hop 3 (firmware on CPU)'}),
  bitRun({path: hop4D, depart: F.hop4Depart, land: F.chain[3], label: 'S06 hop 4 (loader)'}),
  bitRun({path: hop5D, depart: F.hop5Depart, land: F.chain[4], label: 'S06 hop 5 (Windows)'}),
];

const S12_DROP_D = dropPath(P3, Y.L1, S12.dropTo, [
  {y: Y.L2, r: MARK.hopR},
  {y: Y.Q, r: MARK.hopR},
]);
export const S12_RUN = bitRun({path: S12_DROP_D, depart: F.s12Depart, land: S12.cornerFrame, label: 'S12 drop'});
const DIAG = AFTER.tick * Math.SQRT2;

/** Where the S12 Bit is (screen space): the drop, then a crawl along the stretched diagonal toward the receding tick. */
export const s12Bit = (f: number): {x: number; y: number; s: number} | null => {
  if (f < F.s12Depart) return null;
  if (f < S12.cornerFrame) {
    const pos = S12_RUN.at(f);
    return {x: pos.x, y: pos.y, s: pos.s};
  }
  const k = stretchK(f);
  const u = clamp01((f - S12.cornerFrame) / (F.nextLand - S12.cornerFrame));
  // ease out of the corner (3-frame equivalent), then steady; reaches the tick at f1891
  const q = u < 0.12 ? (u * u) / 0.24 : u - 0.06;
  const qq = clamp01(q / 0.94);
  return {x: P3 + AFTER.tick * qq * k, y: S12.dropTo + AFTER.tick * qq, s: S12_RUN.length + qq * DIAG};
};

/** Playhead x, including M4 where it rides with the Bit. */
export const playheadX = (f: number): number => {
  const b = s12Bit(f);
  if (b && f >= S12.cornerFrame && b.x > P3) return b.x;
  return playheadBaseX(f);
};

/* ================================================================================================
 * Score state at a frame (shared by the main score and the Time Lens interior)
 * ============================================================================================== */

const pressAppear = frontReaches(F.trackDraw, X.headR, P1);
const tickAppear = frontReaches(F.trackDraw, X.headR, P1 + AFTER.tick) + 3;

/** Written-ness of the press (pulse, link, tick) across the film. */
const pressWritten = (f: number, which: 'pulse' | 'link' | 'tick') => {
  const passX = {pulse: P1 + MARK.pulseW, link: P1 + AFTER.tick / 2, tick: P1 + AFTER.tick}[which];
  const on1 = which === 'tick' ? tickAppear : pressAppear;
  const ff = written(f, on1, rewindPass(passX));
  const laOn = F.lookAheadIn + (which === 'pulse' ? 0 : which === 'link' ? 2 : 5);
  const la = written(f, laOn, foldBackAt(P2 + (which === 'tick' ? AFTER.tick : 0)));
  const real = which === 'pulse' ? written(f, F.realPress + 1, Infinity, 3) : 0;
  return Math.max(ff, la, real);
};

export interface ScoreState {
  f: number;
  P: number;
  H: number;
  o: ReturnType<typeof offsets>;
  qHop: number;
  pulse: number;
  link: number;
  linkDraw: number;
  tick: number;
  tickVisible: number;
  pressVisible: boolean;
  look: boolean;
}

const qFrontAtP1 = frontReaches(F.qTrackIn, SEAT.qBlock.x + SEAT.qBlock.w, P1);

export const scoreState = (f: number): ScoreState => ({
  f,
  P: pressX(f),
  H: playheadX(f),
  o: offsets(f),
  qHop: progress(f, qFrontAtP1, 4, EASE.arrive),
  pulse: pressWritten(f, 'pulse'),
  link: pressWritten(f, 'link'),
  linkDraw: progress(f, pressAppear, 6, EASE.arrive),
  tick: pressWritten(f, 'tick'),
  tickVisible: f >= tickAppear ? 1 : 0,
  pressVisible: f >= pressAppear,
  look: f >= F.lookAheadIn && f < F.lookAheadOut + 14,
});

/* ================================================================================================
 * The score layer
 * ============================================================================================== */

/** Left start of each track once seated, and where it leaves the moving part during the fold. */
const trackStart = (id: TrackId, f: number): number => {
  const seated = f >= F.foldEnd;
  const gx = (g: 'row1' | 'cpu' | 'chipset' | 'psu', seatRight: number) => {
    const x = groupXform(g, f);
    const c = g === 'row1' ? 228 : 240;
    return x.cx + (seatRight - c) * x.s;
  };
  switch (id) {
    case 'L1':
      return seated ? 294 : gx('row1', 320);
    case 'L2':
      return gx('cpu', X.headR);
    case 'Q':
      return SEAT.qBlock.x + SEAT.qBlock.w;
    case 'LK':
      return seated ? SEAT.lookout.x + SEAT.lookout.w : gx('chipset', SEAT.chipset.x + SEAT.chipset.w);
    case 'SB':
    case 'MR':
      return gx('psu', SEAT.psu.x + SEAT.psu.w);
  }
};

export const ScoreLayer: React.FC<{f: number; pulseW?: number; lens?: boolean}> = ({f, pulseW = MARK.pulseW, lens = false}) => {
  if (f < F.trackDraw) return null;
  const s = scoreState(f);
  const {P, H, o} = s;
  const gnd = lens ? T.panel : GROUND;
  const fr = front(f, F.trackDraw, X.headR);
  const drawn = (x: number) => Math.min(x, fr, X.right);
  const hair = fadeIn(f, F.trackDraw + 4, 12);
  const brk = fadeIn(f, F.foldEnd, 6);
  const tickX = P + o.tick;

  // ---------- links present at this frame (for hop gaps in the crossed tracks) ----------
  const press = pressLink(P, tickX, s.qHop);
  const hopGap = (x: number): readonly [number, number] => [x + MARK.hopR - MARK.hopGap, x + MARK.hopR + MARK.hopGap];
  const gapsFor = (id: TrackId): Array<readonly [number, number]> => {
    const g: Array<readonly [number, number]> = [];
    if (s.pressVisible) for (const c of press.crossings) if (c.track === id) g.push([c.x - MARK.hopGap, c.x + MARK.hopGap]);
    if (s.look && f >= F.hop1Depart - 1 && f < MOVES.pack.from) {
      if (id === 'SB') g.push(hopGap(CHAIN_PTS.st1[0]));
      if ((id === 'SB' || id === 'LK') && f >= F.hop2Depart - 1) g.push(hopGap(CHAIN_PTS.power[0]));
    }
    return g;
  };

  // ---------- the look-ahead: what never stops is written through it ----------
  const laFront = f >= F.lookAheadIn + 5 ? Math.min(X.right, H + 50 * (f - (F.lookAheadIn + 5))) : H;
  const laOn = s.look ? 1 - progress(f, F.lookAheadOut, 12, EASE.exit) : 0;

  // ---------- tracks ----------
  const l1Gaps = [BREAK_GAP, ...(s.pressVisible ? ([[P + 1.5, P + pulseW - 1.5]] as const) : [])];
  const lkx0 = trackStart('LK', f);
  const qFront = front(f, F.qTrackIn, SEAT.qBlock.x + SEAT.qBlock.w);
  const sbx0 = trackStart('SB', f);
  const mrFront = front(f, F.mainRailsDraw, SEAT.psu.x + SEAT.psu.w);
  // 4b beyond PRESS: walls through the look-ahead, then the packed V's end; gone again in M4
  const extIn = fadeIn(f, F.lookAheadIn + 3, 6) * (f >= MOVES.stretch.from ? fadeOut(f, MOVES.stretch.from, 8) : 1);
  const extEnd = Math.min(X.right, P + o.vEnd);
  const powerX0 = P + o.power;
  const powerFill = f >= F.chain[0] ? Math.min(X.right, powerX0 + 50 * (f - F.chain[0])) : powerX0;
  const powerOn = f >= F.chain[0] ? 1 - progress(f, foldBackAt(powerX0), 6, EASE.exit) : 0;

  // ---------- the "?" block: written by the playhead in the flash-forward, then a ghost; inked in the look-ahead ----------
  const qSpan: [number, number] = [P + o.q[0], P + o.q[1]];
  const ffWriting = f >= F.qWakes && f < MOVES.rewind.to + 3;
  const ffWrittenTo = ffWriting ? Math.min(qSpan[1], f <= F.ffWriteEnd ? H : playheadBaseX(f)) : -1;
  const qShown = f >= F.qWakes;
  const qBlockRight = f >= MOVES.rewind.from ? qSpan[1] : Math.max(qSpan[0], ffWrittenTo);
  const qStation = written(f, F.chain[1], foldBackAt(qSpan[0]), 5);
  const stretchFade = f >= MOVES.stretch.from ? fadeOut(f, MOVES.stretch.from, 8) : 1;

  // S06 stations and their states
  const slots = fadeIn(f, F.lookAheadIn + 3, 6) * stretchFade;
  const showSlots = f >= F.lookAheadIn + 3 && slots > 0;
  const fwVisited = written(f, F.chain[3], foldBackAt(P + o.fw[0]), 5);
  const ldVisited = written(f, F.chain[4], foldBackAt(P + o.loader[0]), 5);
  const qRunFront = f >= F.hop3Depart ? Math.min(X.right, qSpan[1] + 50 * (f - F.hop3Depart)) : -1;
  const qRunOn = f >= F.hop3Depart ? 1 - progress(f, foldBackAt(qSpan[1] + 300), 6, EASE.exit) : 0;

  // annotation pointers at ghosts ("pressed" f356, "one tap" f999) and at the link's end ("doesn't" f365)
  const pointerPress = Math.max(
    progress(f, F.pressedTick, 6) * fadeOut(f, F.powerButton2Out, 6),
    progress(f, F.oneTap, 6) * fadeOut(f, F.s07Out, 6),
  );
  const pointerEnd = progress(f, F.doesnt, 6) * fadeOut(f, F.powerButton2Out, 6);

  // S11 wash bands (behind the lookout's line and the standby channel, axis break -> now)
  const wash = fadeIn(f, F.wash, 8) * fadeOut(f, F.realPress + 13, 8);

  return (
    <g>
      {/* engraved lane hairlines and the time rail (2 px panel: texture only) */}
      <g opacity={hair}>
        {Y.hairlines.map((y) => (
          <path key={y} d={`M${X.hist} ${y}H${X.right}`} stroke={T.panel} strokeWidth={2} />
        ))}
        <path d={`M${X.rail0} ${Y.rail}H${X.right}`} stroke={T.panel} strokeWidth={2} />
      </g>

      {wash > 0 ? (
        <g opacity={wash}>
          <path d={rectPath(X.hist, Y.LK - 15, Math.max(0, H - X.hist), 30, 4)} fill={WASH} />
          <path d={rectPath(X.hist, Y.SB - 16, Math.max(0, H - X.hist), 32, 4)} fill={WASH} />
          <path d={rectPath(X.hist, Y.LK - 15, Math.max(0, H - X.hist), 30, 4)} fill="none" stroke={T.annotation} strokeWidth={2} strokeOpacity={0.55} />
          <path d={rectPath(X.hist, Y.SB - 16, Math.max(0, H - X.hist), 32, 4)} fill="none" stroke={T.annotation} strokeWidth={2} strokeOpacity={0.55} />
        </g>
      ) : null}

      {/* ---------------- tracks ---------------- */}
      <path d={gappedH(trackStart('L1', f), drawn(X.right), Y.L1, l1Gaps)} stroke={T.structure} strokeWidth={3} />
      <path d={gappedH(trackStart('L2', f), drawn(X.right), Y.L2, [BREAK_GAP, ...gapsFor('L2')])} stroke={T.structure} strokeWidth={3} />
      {qFront > 0 ? (
        <path d={gappedH(trackStart('Q', f), Math.min(X.right, qFront), Y.Q, [BREAK_GAP, ...gapsFor('Q')])} stroke={T.structure} strokeWidth={3} />
      ) : null}
      {/* the lookout's line: ink to "now" (write-head), grey guide after it; ink through the look-ahead */}
      <path d={gappedH(Math.max(lkx0, Math.min(H, fr)), drawn(X.right), Y.LK, gapsFor('LK'))} stroke={T.structure} strokeWidth={3} />
      <path d={gappedH(lkx0, drawn(H), Y.LK, gapsFor('LK'))} stroke={T.ink} strokeWidth={4} />
      {laOn > 0 ? <path d={gappedH(H, laFront, Y.LK, gapsFor('LK'))} stroke={T.ink} strokeWidth={4} opacity={laOn} /> : null}
      {/* standby channel: live (amber) to "now" */}
      <Channel
        y={Y.SB}
        x0={sbx0}
        x1={drawn(X.right)}
        kind="standby"
        gaps={gapsFor('SB')}
        fills={[{x0: sbx0, x1: drawn(H), color: T.energyStandby}, ...(laOn > 0 ? [{x0: H, x1: laFront, color: T.energyStandby, opacity: laOn}] : [])]}
      />
      {!lens && f >= F.trickle ? <Shimmer f={f} x0={X.hist} x1={H} y={Y.SB} /> : null}
      {/* main rails: empty, tuned in on "switch", stopping at PRESS until the look-ahead extends it */}
      {mrFront > 0 ? (
        <>
          <Channel y={Y.MR} x0={sbx0} x1={Math.min(mrFront, P)} kind="main" gaps={[BREAK_GAP]} />
          {extIn > 0 ? (
            <Channel
              y={Y.MR}
              x0={P}
              x1={extEnd}
              kind="main"
              opacity={extIn}
              fills={powerOn > 0 ? [{x0: powerX0, x1: powerFill, color: T.energy, opacity: powerOn}] : []}
            />
          ) : null}
          {mrFront >= P ? <path d={`M${P} ${Y.MR - 9}V${Y.MR + 9}`} stroke={T.structure} strokeWidth={2} opacity={1 - extIn} /> : null}
        </>
      ) : null}

      {/* axis break and braces */}
      <g opacity={brk}>
        <AxisBreak y={Y.L1} />
        <AxisBreak y={Y.L2} />
        {qFront > X.break1 + 10 ? <AxisBreak y={Y.Q} /> : null}
        <AxisBreak y={Y.LK} />
        <AxisBreak y={Y.SB} h={13} />
        {mrFront > X.break1 + 10 ? <AxisBreak y={Y.MR} h={15} /> : null}
      </g>
      <Brace y0={Y.Q} y1={Y.LK} draw={progress(f, frontReaches(F.qTrackIn, 294, 360), 6, EASE.arrive)} />
      <Brace y0={Y.SB} y1={Y.MR} draw={progress(f, F.mainRailsDraw + 2, 6, EASE.arrive)} />

      {/* ---------------- events ---------------- */}
      {s.pressVisible ? (
        <g>
          <Pulse x={P} w={pulseW} state={s.pulse} />
          <Link d={press.d} end={press.end} state={s.link} draw={s.linkDraw} length={560} ground={gnd} />
          <Tick x={tickX} y={Y.LK} state={s.tick} opacity={s.tickVisible} />
        </g>
      ) : null}
      {pointerPress > 0 ? <path d={`M${P - 10} ${Y.L1 + 13}H${P - 10 + 36 * pointerPress}`} stroke={T.annotation} strokeWidth={3} /> : null}
      {pointerEnd > 0 ? <path d={`M${tickX - 14} ${Y.LK + 14}H${tickX - 14 + 30 * pointerEnd}`} stroke={T.annotation} strokeWidth={3} /> : null}

      {qShown ? (
        <Block
          x0={qSpan[0]}
          x1={qBlockRight}
          y={Y.Q}
          state={ffWrittenTo > qSpan[0] ? 1 : qStation}
          writtenTo={ffWrittenTo > qSpan[0] ? ffWrittenTo : undefined}
          opacity={stretchFade}
          ground={gnd}
        />
      ) : null}

      {showSlots ? (
        <g opacity={slots}>
          <Block x0={P + o.fw[0]} x1={P + o.fw[1]} y={Y.L2} state={0} visited={fwVisited} />
          <Block x0={P + o.loader[0]} x1={P + o.loader[1]} y={Y.L2} state={0} visited={ldVisited} />
          <Block x0={P + o.win[0]} x1={P + o.win[1]} y={Y.L2} state={0} />
        </g>
      ) : null}
      {qRunFront > 0 && qRunOn > 0 ? (
        <g opacity={qRunOn}>
          <path d={`M${qSpan[1]} ${Y.Q}H${qRunFront}`} stroke={T.ink} strokeWidth={4} />
          <path d={squarePath(qRunFront - 6, Y.Q, 12, 1.5)} fill={T.ink} />
        </g>
      ) : null}
      {/* the V's links: written as the Bit travels them, ghosts after the fold back, gone before the pack.
          Hops 4 and 5 run ALONG the processor's own track: they get no resting line (only the cyan lit trail
          while the Bit travels), so lane 2 is never inked. Its stations are traced: ghost -> parked Bit -> visited. */}
      {s.look
        ? CHAIN_RUNS.map((r, i) =>
            f >= r.land && i < LANE2_HOPS_FROM ? (
              <Link
                key={i}
                d={HOP_DS[i]}
                end={r.end}
                state={1 - progress(f, foldBackAt(r.end[0]), 6, EASE.exit)}
                terminal={i < 3}
                opacity={1 - progress(f, MOVES.pack.from - 3, 3)}
              />
            ) : null,
          )
        : null}
      {!lens ? <LitBehind f={f} runs={CHAIN_RUNS} /> : null}
    </g>
  );
};

/** Standby shimmer: long low-contrast dashes drifting toward the load at 1 px/frame (S10-S11). */
const Shimmer: React.FC<{f: number; x0: number; x1: number; y: number}> = ({f, x0, x1, y}) => {
  const o = Math.min(progress(f, F.trickle, 8), 1 - progress(f, F.lockOut + 22, 8));
  if (x1 <= x0 || o <= 0) return null;
  return <path d={`M${x0} ${y}H${x1}`} stroke="#FFFFFF" strokeOpacity={0.16 * o} strokeWidth={6} strokeDasharray="90 90" strokeDashoffset={-(f - F.trickle)} />;
};

/* ================================================================================================
 * Markers: PRESS (flag + rule) and the playhead (head + rule + write-head)
 * ============================================================================================== */

/** The lookout's pip and its write-head pulse together on "awake" (f539) and on "that lookout" (f1447). */
export const lookoutPulse = (f: number): number => {
  for (const at of [F.awake, F.lookoutPulse]) if (f >= at && f <= at + 8) return Math.sin((Math.PI * (f - at)) / 8);
  return 0;
};

export const powerSym = (cx: number, cy: number, r: number): string => {
  const a0 = (-60 * Math.PI) / 180;
  const a1 = (240 * Math.PI) / 180;
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  return `M${p0[0]} ${p0[1]}A${r} ${r} 0 1 1 ${p1[0]} ${p1[1]}M${cx} ${cy - r * 1.2}V${cy - r * 0.05}`;
};

export const Markers: React.FC<{f: number}> = ({f}) => {
  if (f < F.pressMarkerIn) return null;
  const s = scoreState(f);
  const {P, H} = s;
  const pIn = fadeIn(f, F.pressMarkerIn, 6);
  // the press link runs along the marker from L1 to its 45-degree corner: the marker steps aside there
  const markerD = s.pressVisible
    ? `M${P} ${Y.markerTop}V${Y.L1 - MARK.pulseH - 4}M${P} ${Y.LK + 16}V${Y.markerBottom}`
    : `M${P} ${Y.markerTop}V${Y.markerBottom}`;
  const flagR = 16;
  const hO = fadeIn(f, F.playheadIn, 6);
  const wh = breathe(f);
  return (
    <g>
      <g opacity={pIn}>
        <path d={markerD} stroke={T.annotation} strokeWidth={3} />
        <path d={`M${P} ${Y.flag + flagR}V${Y.rail}`} stroke={T.annotation} strokeWidth={3} />
        <circle cx={P} cy={Y.flag} r={flagR} fill={GROUND} stroke={T.annotation} strokeWidth={3} />
        <path d={powerSym(P, Y.flag + 0.5, 7.5)} fill="none" stroke={T.annotation} strokeWidth={2.6} strokeLinecap="round" />
      </g>
      {f >= F.playheadIn ? (
        <g opacity={hO}>
          <path d={`M${H} ${Y.markerTop}V${Y.markerBottom}`} stroke={T.ink} strokeWidth={4} />
          <path d={`M${H - 11} ${Y.rail - 22}H${H + 11}L${H} ${Y.rail - 4}Z`} fill={T.ink} />
          <path d={squarePath(H, Y.LK, 12 * (1 + 0.3 * lookoutPulse(f)), 1.5)} fill={T.ink} opacity={wh} />
        </g>
      ) : null}
    </g>
  );
};

/* ================================================================================================
 * The S12 press: the link written behind the Bit, lit cyan right behind it, and the Bit itself
 * ============================================================================================== */

export const S12Layer: React.FC<{f: number}> = ({f}) => {
  const b = s12Bit(f);
  if (!b) return null;
  const k = stretchK(f);
  const inDrop = f < S12.cornerFrame;
  const written = inDrop ? trackUpTo(S12_RUN, b.s) : `${S12_DROP_D}L${b.x} ${b.y}`;
  // trail squares behind the Bit, along the current route
  const trail: Array<{x: number; y: number; sz: number; o: number}> = [];
  const sizes = [18, 14, 11, 8];
  const ops = [0.55, 0.38, 0.24, 0.12];
  for (let i = 0; i < 4; i++) {
    const sB = b.s - 30 * (i + 1);
    if (sB < 0) continue;
    let px: number;
    let py: number;
    if (sB <= S12_RUN.length) {
      const p = S12_RUN.track.at(sB);
      px = p.x;
      py = p.y;
    } else {
      const qq = (sB - S12_RUN.length) / DIAG;
      px = P3 + AFTER.tick * qq * k;
      py = S12.dropTo + AFTER.tick * qq;
    }
    trail.push({x: px, y: py, sz: sizes[i], o: ops[i]});
  }
  return (
    <g>
      <path d={written} fill="none" stroke={T.ink} strokeWidth={3} strokeLinejoin="round" />
      {inDrop ? <LitBehind f={f} runs={[S12_RUN]} /> : null}
      {!inDrop ? (
        <path d={`M${lerp(P3, b.x, 0.25)} ${lerp(S12.dropTo, b.y, 0.25)}L${b.x} ${b.y}`} stroke={T.info} strokeWidth={4} fill="none" />
      ) : null}
      {trail.reverse().map((t, i) => (
        <path key={i} d={squarePath(t.x, t.y, t.sz, (5 * t.sz) / 24)} fill={T.info} fillOpacity={t.o} />
      ))}
      <path d={squarePath(b.x, b.y, 64, 8)} fill={T.info} fillOpacity={0.09} />
      <path d={squarePath(b.x, b.y, 40, 7)} fill={T.info} fillOpacity={0.18} />
      <path d={squarePath(b.x, b.y, 24, 5)} fill={T.info} />
    </g>
  );
};
