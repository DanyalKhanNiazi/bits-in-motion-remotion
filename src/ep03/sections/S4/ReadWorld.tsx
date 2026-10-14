/**
 * S4 shots D–J: the reading world, one continuous set inside the package (chip env).
 *   prompt row (top) → 11 lanes → the compute die (BIM142) → output port → the answer belt (bottom);
 *   the LOOP ring sits beside the die (idle while reading, one lap per written token).
 * D "already there" · E side by side in ONE run · F chunk by chunk · G the same run picks the first piece ·
 * H one token per run · I so many runs · J the re-hook question.
 */
import React from 'react';
import {EASE, KineticText, Label, PAL, Prop, QuestionCard, Stage, TokenTile, clamp01, lerp, poseAt, prog, rgba, rr, smooth, textWidth, tileH, tileRowLayout, tileW, toScreen, tokenize, useFontsReady, win, type CamKey} from '../../kit';
import {ANSWER, QUESTION, T, TO, X} from './T';
import {LoopRing, RunPulse, blip} from './parts';

/* ---------------------------------------------------------------- set geometry (world px) */
const DIE_SRC = 'BIM142_T03_compute-cache_b' as const;
const DIE = {x: 860, y: 600, w: 640};
const K = 640 / 1222;
const nat = (nx: number, ny: number) => ({x: DIE.x + (nx - 770) * K, y: DIE.y + (ny - 510.5) * K});
const COLS = [[341, 436], [447, 550], [560, 663], [673, 777], [787, 890], [899, 985]] as const;
const ROWS = [[239, 316], [341, 421], [447, 528], [555, 637], [664, 749]] as const;
const PORT_NY = 66;
const portNX = (i: number) => 362 + i * 59.6;
const OUT_N = {x: 663, y: 932};
const OUT = nat(OUT_N.x, OUT_N.y);
const ROW_CX = 860;
/** the prompt as a two-line block of big tiles (legible at phone width) */
const PS = 70;
const PY = [-30, 100] as const;
const ROW_Y = PY[0];
const RING = {cx: 1470, cy: 600, r: 160};
const DIE_R = nat(1381, 510.5);
const BELT_Y = 975;
const ANS_SIZE = 52;
const ANS_GAP = 12;
const INS_X = OUT.x;
const ANS = tokenize(ANSWER).map((t) => t.trim());
const QTEXT = 'Why is each writing run so slow?';

/* ---------------------------------------------------------------- timeline */
const READ_START = T.sideBySide + 6;
const READ_HIT = T.singleRun - 2;
const CH = [T.chunk1 + 2, T.chunk2 + 2, T.prompt2 + 1];
const CH_TRAVEL = 6;
const CH_DUR = 10;
const SAME = T.sameRun - 2;
const SAME_HIT = SAME + 12;
const A0 = T.firstPiece - 8;
const H0 = T.writing8 + 2;
const ACC_END = T.manyRuns + 12;

const speedAt = (g: number): number => {
  if (g < H0) return 0;
  if (g < T.so9) return 1 / 24;
  if (g < ACC_END) return lerp(1 / 24, 1 / 6, smooth((g - T.so9) / (ACC_END - T.so9)));
  if (g < T.butWhy) return 1 / 6;
  if (g < T.butWhy + 40) return lerp(1 / 6, 1 / 160, EASE.out((g - T.butWhy) / 40));
  return 1 / 160;
};
let PHASE: number[] | null = null;
let LAPS: number[] | null = null;
const tables = () => {
  if (PHASE && LAPS) return {phase: PHASE, laps: LAPS};
  const ph: number[] = [];
  const laps: number[] = [];
  let acc = 0;
  for (let g = H0; g <= TO + 60; g++) {
    ph.push(acc);
    const nxt = acc + speedAt(g);
    if (Math.floor(nxt + 1e-9) > Math.floor(acc + 1e-9)) laps.push(g + 1);
    acc = nxt;
  }
  PHASE = ph;
  LAPS = laps;
  return {phase: ph, laps};
};
export const phaseAt = (f: number): number => {
  if (f <= H0) return 0;
  const {phase} = tables();
  return phase[Math.min(phase.length - 1, f - H0)];
};
/** frame each answer tile leaves the die (tile 0 comes from the reading run) */
const tileAt = (i: number): number => (i === 0 ? A0 : (tables().laps[i - 1] ?? 1e9));

/* ---------------------------------------------------------------- the answer grid (I–J) */
type Slot = {k: number; g: number; x: number; y: number; w: number; word: string};
let SLOTS: Slot[] | null = null;
/** every lap from "So," on writes the next word into a left-aligned, wrapping grid (reading order) */
const gridSlots = (fontsReady: boolean): Slot[] => {
  if (SLOTS) return SLOTS;
  const out: Slot[] = [];
  let x = GRID.x0;
  let row = 0;
  tables().laps.forEach((g, k) => {
    if (g < T.so9) return;
    const word = ANS[Math.min(ANS.length - 1, k + 1)];
    const w = tileW(word, GRID.size);
    if (x + w > GRID.x1 && x > GRID.x0) {
      x = GRID.x0;
      row++;
    }
    if (row > 6) return;
    out.push({k, g, x: x + w / 2, y: GRID.y0 + row * GRID.pitch, w, word});
    x += w + GRID.gap;
  });
  if (fontsReady) SLOTS = out;
  return out;
};

/* ---------------------------------------------------------------- long prompt wall (F) */
type WallTile = {x: number; w: number; row: number};
let WALL: WallTile[] | null = null;
const wall = (): WallTile[] => {
  if (WALL) return WALL;
  const out: WallTile[] = [];
  for (let r = 1; r <= 8; r++) {
    let x = 130;
    let i = 0;
    while (x < 1590) {
      const w = Math.min(1590 - x, rr(`s4wall-${r}-${i}`, 46, 124));
      if (w < 30) break;
      out.push({x: x + w / 2, w, row: r});
      x += w + 10;
      i++;
    }
  }
  WALL = out;
  return out;
};
const rowY = (r: number) => ROW_Y - r * 92;
/** the token grid the LOOP fills during "so many runs" (world px) */
const GRID = {x0: 1712, x1: 2262, y0: 424, pitch: 70, size: 38, gap: 12};
const chunkOf = (r: number) => (r >= 6 ? 0 : r >= 3 ? 1 : 2);

/* ---------------------------------------------------------------- camera */
export const CAM_RW: CamKey[] = [
  // D: the prompt block, close (the chip is not lit yet)
  {f: X.whip1 + 6, x: 860, y: 60, zoom: 1.12},
  {f: T.already + 6, x: 880, y: 56, zoom: 1.16, ease: 'inOut'},
  // E: crane down to a low hero angle on the lanes (the set also tilts back, see tiltAt)
  {f: T.read + 12, x: 860, y: 392, zoom: 0.98, rot: -2.5, dur: 44, ease: 'cam'},
  {f: READ_HIT - 1, x: 860, y: 404, zoom: 1.04, rot: -1.5, dur: READ_HIT - 1 - T.sideBySide, ease: 'inOut'},
  {f: READ_HIT + 12, x: 860, y: 398, zoom: 0.98, rot: -2, ease: 'out'},
  // F: a high, top-down crane over the very long prompt, swinging round (the whole set in frame)
  {f: T.chunk1 + 4, x: 700, y: -200, zoom: 0.45, rot: 4, dur: 16, ease: 'cam'},
  {f: T.veryLong + 14, x: 690, y: -190, zoom: 0.47, rot: 5, ease: 'inOut'},
  // G: down to the whole chip, the output port and the belt: the first piece drops
  {f: T.sameRun + 6, x: 800, y: 690, zoom: 1.1, rot: 0, dur: 22, ease: 'cam'},
  {f: T.writing8 - 4, x: 800, y: 696, zoom: 1.14, ease: 'inOut'},
  // H: a low angle along the belt (the set tilts back around the belt line): tiles land one per run
  {f: T.writing8 + 20, x: 800, y: 870, zoom: 1.32, rot: -5, dur: 24, ease: 'cam'},
  {f: T.so9 - 2, x: 840, y: 872, zoom: 1.38, rot: -6, ease: 'inOut'},
  // I: the LOOP alone on the left, the answer it writes filling up on the right, in order
  {f: T.so9 + 28, x: 1700, y: 640, zoom: 1.2, rot: 0, dur: 30, ease: 'cam'},
  {f: T.butWhy, x: 1690, y: 632, zoom: 1.24, ease: 'inOut'},
  // J: the loop brakes to a crawl under the card
  {f: X.whip2 + 14, x: 1640, y: 620, zoom: 1.36, ease: 'inOut'},
];
/** E's low hero angle (pivot: the die) and H's low angle along the belt (pivot: the belt line), in degrees */
const tiltAt = (f: number): {deg: number; ox: number; oy: number} => {
  const e = 24 * smooth(prog(f, T.so8 + 4, T.read + 14 - (T.so8 + 4))) * (1 - smooth(prog(f, T.orChunk - 2, T.chunk1 + 4 - (T.orChunk - 2))));
  if (e > 0.01) return {deg: e, ox: DIE.x, oy: DIE.y};
  const h = 34 * smooth(prog(f, T.writing8 - 2, 24)) * (1 - smooth(prog(f, T.so9 - 2, 30)));
  return {deg: h, ox: INS_X, oy: BELT_Y};
};

/* ---------------------------------------------------------------- the die's math tiles (native px overlay) */
type Flash = {at: number; amp: number; decay: number; wave?: number; col?: number};
const flashes = (): Flash[] => {
  const ev: Flash[] = [
    {at: READ_HIT, amp: 1.2, decay: 26, wave: 2},
    ...CH.map((c) => ({at: c + CH_TRAVEL + CH_DUR, amp: 0.9, decay: 10, wave: 1})),
    {at: SAME_HIT, amp: 1, decay: 30, wave: 1},
  ];
  tables().laps.forEach((g, k) => {
    ev.push({at: g, amp: 0.8, decay: 7, col: k % 6});
    ev.push({at: g, amp: 0.14, decay: 6, wave: 0});
  });
  return ev;
};
let FLASHES: Flash[] | null = null;
const cellGlow = (f: number, c: number, r: number): number => {
  if (!FLASHES) FLASHES = flashes();
  let g = 0;
  for (const e of FLASHES) {
    if (e.col !== undefined && e.col !== c) continue;
    const t = f - e.at - (e.wave ?? 0) * r;
    if (t < 0 || t > e.decay * 6) continue;
    g += e.amp * (t < 2 ? t / 2 : Math.exp(-(t - 2) / e.decay));
  }
  const idle = f >= T.butWhy ? 0.4 : 1;
  return clamp01(g) + idle * (0.05 + 0.05 * (0.5 + 0.5 * Math.sin(f / 7 + c * 1.3 + r * 2.1)));
};

const DieOverlay: React.FC<{f: number; laneGlow: number}> = ({f, laneGlow}) => {
  const cells: React.ReactNode[] = [];
  COLS.forEach(([x0, x1], c) =>
    ROWS.forEach(([y0, y1], r) => {
      const g = cellGlow(f, c, r);
      cells.push(
        <g key={`${c}-${r}`}>
          <rect x={x0 - 3} y={y0 - 3} width={x1 - x0 + 6} height={y1 - y0 + 6} rx={6} fill={PAL.info} opacity={0.62 * g} />
          {g > 0.25 ? <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={5} fill="none" stroke={PAL.infoPale} strokeWidth={4} opacity={Math.min(1, g)} /> : null}
        </g>,
      );
    }),
  );
  const out = Math.max(...Array.from({length: 26}, (_, i) => blip(f, tileAt(i) - 2, 2, 7)));
  return (
    <svg width={1536} height={1024} viewBox="0 0 1536 1024" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {cells}
      {/* lane traces crossing the frame into the grid */}
      {Array.from({length: 11}, (_, i) => (
        <line key={i} x1={portNX(i)} y1={PORT_NY} x2={portNX(i)} y2={192} stroke={PAL.info} strokeWidth={6} opacity={0.15 + 0.75 * laneGlow} strokeLinecap="round" />
      ))}
      {/* output port */}
      <rect x={OUT_N.x - 70} y={OUT_N.y - 16} width={140} height={32} rx={10} fill="#0B1222" stroke={PAL.structure} strokeWidth={3} />
      <rect x={OUT_N.x - 62} y={OUT_N.y - 9} width={124} height={18} rx={7} fill={PAL.info} opacity={0.12 + 0.85 * out} />
    </svg>
  );
};

/* ---------------------------------------------------------------- lanes */
const lanePulse = (f: number, start: number, dur: number): number => (f < start || f > start + dur + 4 ? -1 : (f - start) / dur);

const Lanes: React.FC<{f: number; tx: number[]; y0s: number[]}> = ({f, tx, y0s}) => {
  const reveal = prog(f, T.read - 12, 30, EASE.inOut);
  if (reveal <= 0) return null;
  const pulses: number[] = [lanePulse(f, READ_START, READ_HIT - READ_START), ...CH.map((c) => lanePulse(f, c + CH_TRAVEL, CH_DUR)), lanePulse(f, SAME, SAME_HIT - SAME)];
  const after = Math.max(win(f, READ_START, READ_HIT + 26, 2, 22), win(f, SAME, SAME_HIT + 16, 2, 14), ...CH.map((c) => win(f, c + CH_TRAVEL, c + CH_TRAVEL + CH_DUR + 6, 2, 6)));
  // the lit wake follows the pulse head down the lane, then the whole lane stays lit while it decays
  const heads = pulses.filter((u) => u >= 0);
  const wake = heads.length ? clamp01(Math.max(...heads)) : 1;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {tx.map((x, i) => {
        const p = nat(portNX(i), PORT_NY);
        const y0 = y0s[i];
        const d = `M ${x} ${y0} C ${x} ${y0 + 80} ${p.x} ${p.y - 90} ${p.x} ${p.y}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={PAL.info} strokeWidth={14} strokeOpacity={0.05 + 0.16 * after} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reveal} />
            <path d={d} fill="none" stroke={PAL.structure} strokeWidth={4} strokeOpacity={0.55} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reveal} strokeLinecap="round" />
            <path d={d} fill="none" stroke={PAL.info} strokeWidth={4} strokeOpacity={0.7 * after} pathLength={1} strokeDasharray={`${wake} 2`} />
            {pulses.map((u, k) =>
              u >= 0 && u <= 1.15 ? (
                <g key={k}>
                  <path d={d} fill="none" stroke={PAL.info} strokeWidth={16} strokeOpacity={0.35} pathLength={1} strokeDasharray="0.22 2" strokeDashoffset={0.22 - u * 1.22} strokeLinecap="round" />
                  <path d={d} fill="none" stroke={PAL.infoPale} strokeWidth={6} pathLength={1} strokeDasharray="0.16 2" strokeDashoffset={0.16 - u * 1.16} strokeLinecap="round" />
                </g>
              ) : null,
            )}
            <circle cx={p.x} cy={p.y} r={7} fill="#0B1222" stroke={PAL.gold} strokeWidth={3} />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- small check marks ("no such wait") */
const Ready: React.FC<{f: number; xs: number[]; ys: number[]}> = ({f, xs, ys}) => {
  const a = T.noSuchWait + 4;
  const v = win(f, a, T.read, 4, 10);
  if (v <= 0) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {xs.map((x, i) => {
        const s = clamp01(prog(f, a, 8, EASE.outBack) * 1.0);
        return (
          <g key={i} transform={`translate(${x}, ${ys[i]}) scale(${s})`} opacity={v}>
            <circle r={17} fill={rgba(PAL.info, 0.16)} stroke={PAL.info} strokeWidth={2.5} />
            <path d="M -8 0 L -2 6 L 8 -6" fill="none" stroke={PAL.info} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- the reading world */
const ReadWorld: React.FC<{f: number}> = ({f}) => {
  const fontsReady = useFontsReady();
  // prompt block: line 1 "Why do AI answers arrive", line 2 "one piece at a time ?"
  const rs = PS;
  const rth = tileH(rs);
  const qw = QUESTION.map((t) => tileW(t.trim(), rs));
  const tx: number[] = [];
  const ty: number[] = [];
  [[0, 5], [5, 11]].forEach(([a, b], li) => {
    const lw = qw.slice(a, b).reduce((s2, w) => s2 + w, 0) + 16 * (b - a - 1);
    let x = ROW_CX - lw / 2;
    for (let i = a; i < b; i++) {
      tx.push(x + qw[i] / 2);
      ty.push(PY[li]);
      x += qw[i] + 16;
    }
  });
  const y0s = ty.map((y) => y + rth / 2 + 8);
  // prompt tile glow
  const pg = Math.max(
    0.9 * blip(f, T.already + 1, 2, 14),
    win(f, T.sideBySide, READ_HIT + 6, 3, 16),
    0.8 * blip(f, CH[2], 2, 10),
    0.85 * blip(f, SAME, 2, 14),
  );
  // die power: dark in D, alive from "So, the model"
  const power = prog(f, T.so8 + 6, 24, EASE.inOut);
  const idle = prog(f, T.butWhy, 36, EASE.inOut);
  const laneGlow = Math.max(win(f, READ_HIT - 4, READ_HIT + 30, 4, 24), win(f, SAME_HIT - 4, SAME_HIT + 20, 3, 16), ...CH.map((c) => win(f, c + CH_TRAVEL + CH_DUR - 4, c + CH_TRAVEL + CH_DUR + 8, 2, 6)));
  // ring
  const phase = phaseAt(f);
  const laps = Math.floor(phase + 1e-9);
  const ringLit = f < H0 ? 0.1 : 0.55 - 0.3 * idle;
  // answer belt
  const aw = ANS.map((t) => tileW(t, ANS_SIZE));
  const started: number[] = [];
  for (let i = 0; i < ANS.length; i++) if (tileAt(i) <= f + 1) started.push(i);
  const shift = (i: number) => (i === 0 ? 0 : aw[i - 1] / 2 + ANS_GAP + aw[i] / 2);
  const shiftProg = (i: number) => prog(f, tileAt(i) - 1, 6, EASE.inOut);
  const ax = (j: number) => {
    let x = INS_X;
    for (const k of started) if (k > j) x -= shift(k) * shiftProg(k);
    return x;
  };
  let travel = 0;
  for (const k of started) travel += shift(k) * shiftProg(k);
  const ath = tileH(ANS_SIZE);
  // order wave (I)
  const orderGlow = (j: number, x: number) => {
    const t0 = T.order9 + (x + 1400) / 90;
    return 0.8 * blip(f, t0, 2, 8);
  };
  // F wall
  const wallIn = (r: number) => prog(f, T.orChunk + (r - 1) * 1.2, 8, EASE.out) * (1 - prog(f, T.longEnd + 2 + (8 - r), 9, EASE.inCubic));
  const chunkGlow = (c: number) => blip(f, CH[c], 2, 12);
  // HUD helpers
  const pose = poseAt(f, CAM_RW, 1);
  const wallPt = toScreen(pose, 120, rowY(4));
  // what is on set when: the chip lights up in E, the ring and belt join for the writing, the chip leaves for I
  const dieOn = prog(f, T.so8, 20, EASE.inOut) * (1 - prog(f, T.so9 + 2, 18, EASE.inOut));
  const ringOn = prog(f, T.writing8 - 6, 18, EASE.inOut);
  const beltOn = prog(f, T.sameRun - 10, 14, EASE.inOut) * (1 - prog(f, T.so9 + 2, 18, EASE.inOut));
  const gridOn = prog(f, T.so9 + 4, 16, EASE.inOut);
  const g1 = 'Your prompt:';
  const g2 = 'no such wait';
  const gw1 = textWidth(g1, 84, 700);
  const gw2 = textWidth(g2, 84, 700);
  const gx = 960 - (gw1 + 26 + gw2) / 2;
  const qSize = Math.min(100, Math.floor((1480 / textWidth(QTEXT, 100, 700)) * 100));
  const h1 = 'One token per run,';
  const h2 = 'in order';
  const hw1 = textWidth(h1, 76, 700);
  const hw2 = textWidth(h2, 76, 700);
  const hx = 960 - (hw1 + 22 + hw2) / 2;
  const tilt = tiltAt(f);
  const promptOut = 1 - prog(f, T.writing8 - 12, 14, EASE.inOut);
  // I: each lap ends with a token flying out of the ring's junction (down-left, toward the belt)
  const grid = gridSlots(fontsReady);
  return (
    <Stage
      frame={f}
      env={{kind: 'chip', pulses: 0.8}}
      cam={CAM_RW}
      shake={[{at: READ_HIT, strength: 0.6}, {at: SAME_HIT, strength: 0.3}]}
      hud={
        <>
          <KineticText frame={f} at={T.yourPrompt} exitAt={T.already - 6} text={g1} mode="pop" stagger={0} x={gx} y={270} size={84} align="left" />
          <KineticText frame={f} at={T.noSuchWait} exitAt={T.already - 6} text={g2} mode="pop" stagger={0} x={gx + gw1 + 26} y={270} size={84} align="left" color={PAL.infoPale} />
          <KineticText frame={f} at={T.already} exitAt={T.so8 + 6} text="Already there" mode="pop" stagger={0} x={960} y={270} size={96} />
          <KineticText frame={f} at={T.sideBySide} exitAt={T.orChunk + 8} text="Side by side" mode="pop" stagger={0} x={320} y={520} size={84} />
          <KineticText frame={f} at={T.singleRun} exitAt={T.orChunk + 8} text="One run" mode="slam" x={330} y={640} size={116} accent={PAL.info} />
          <KineticText frame={f} at={T.chunk1} exitAt={T.longEnd + 16} text="Chunk by chunk" mode="pop" stagger={0} x={345} y={400} size={72} />
          <Label frame={f} at={T.veryLong} exitAt={T.longEnd + 16} text="Very long prompt" x={590} y={640} side="left" to={wallPt} size={52} />
          <KineticText frame={f} at={T.sameRun + 2} exitAt={T.writing8 + 2} text="Same run" mode="pop" stagger={0} x={96} y={470} size={92} align="left" />
          <KineticText frame={f} at={T.firstPiece} exitAt={T.writing8 + 2} text="→ first piece" mode="pop" stagger={0} x={96} y={578} size={80} align="left" color={PAL.infoPale} />
          <KineticText frame={f} at={T.tokenPerRun - 8} exitAt={T.so9 + 26} text={h1} mode="slam" x={hx} y={900} size={76} align="left" />
          <KineticText frame={f} at={T.inOrder} exitAt={T.so9 + 26} text={h2} mode="pop" stagger={0} x={hx + hw1 + 22} y={900} size={76} align="left" color={PAL.infoPale} />
          <KineticText frame={f} at={T.manyRuns} exitAt={T.whyCard - 2} text="So many runs" mode="pop" stagger={0} x={960} y={150} size={92} />
          <QuestionCard frame={f} at={T.whyCard} exitAt={X.whip2 - 6} text={QTEXT} y={470} size={qSize} />
        </>
      }
    >
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: tilt.deg > 0.05 ? `perspective(1500px) rotateX(${tilt.deg.toFixed(2)}deg)` : undefined, transformOrigin: `${tilt.ox}px ${tilt.oy}px`}}>
      {/* answer belt */}
      <div style={{position: 'absolute', left: 0, top: 0, opacity: beltOn}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <rect x={-2900} y={BELT_Y + ath / 2 + 4} width={4230} height={14} rx={6} fill="#8D97A7" opacity={0.85} />
        <rect x={-2900} y={BELT_Y + ath / 2 + 16} width={4230} height={30} rx={8} fill="#1A212D" />
        {Array.from({length: 110}, (_, i) => {
          const x = -2900 + ((i * 40 - (travel % 40) + 4400) % 4400);
          return x < 1320 ? <rect key={i} x={x} y={BELT_Y + ath / 2 + 20} width={4} height={22} rx={2} fill="#3A4558" /> : null;
        })}
        <rect x={1318} y={BELT_Y + ath / 2 - 2} width={20} height={52} rx={6} fill="#2A3240" stroke="#5B6678" strokeWidth={2} />
        {/* output guide from the die to the belt */}
        <line x1={OUT.x} y1={OUT.y + 16} x2={OUT.x} y2={BELT_Y - ath / 2 - 4} stroke={PAL.structure} strokeWidth={3} strokeDasharray="6 8" opacity={0.6} />
      </svg>
      {started.map((j) => {
        const x = ax(j);
        if (x < -2600 || x > 1400) return null;
        const a = tileAt(j);
        const isNewest = j === started[started.length - 1];
        const nw = Math.max(isNewest ? 1 - prog(f, a + 30, 8) : 0, orderGlow(j, x));
        // older tiles dissolve before they reach the frame's left margin (no clipped words)
        const sp = toScreen(pose, x, BELT_Y);
        const vis = clamp01((sp.x - (aw[j] * pose.zoom) / 2 - 40) / 170);
        if (vis <= 0) return null;
        return (
          <div key={j} style={{position: 'absolute', left: 0, top: 0, opacity: vis}}>
            <TokenTile frame={f} text={ANS[j]} x={x} y={BELT_Y} size={ANS_SIZE} w={aw[j]} snapAt={a} from={{dy: -(BELT_Y - OUT.y - 10), dx: 0, rot: 0}} newest={nw} />
          </div>
        );
      })}
      </div>
      {/* connector die → ring */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: Math.min(dieOn, ringOn)}}>
        <line x1={DIE_R.x - 6} y1={RING.cy} x2={RING.cx - RING.r} y2={RING.cy} stroke="#2A3240" strokeWidth={18} strokeLinecap="round" />
        <line x1={DIE_R.x - 6} y1={RING.cy} x2={RING.cx - RING.r} y2={RING.cy} stroke={PAL.structure} strokeWidth={5} strokeOpacity={0.6} />
        <line
          x1={DIE_R.x - 6}
          y1={RING.cy}
          x2={RING.cx - RING.r}
          y2={RING.cy}
          stroke={PAL.info}
          strokeWidth={6}
          opacity={Math.max(0, ...tables().laps.slice(0, Math.max(0, laps + 1)).slice(-2).map((g) => blip(f, g - 2, 1, 5)))}
        />
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, opacity: ringOn}}>
        <LoopRing frame={f} cx={RING.cx} cy={RING.cy} r={RING.r} phase={phase + 0.75} lit={ringLit} ticks={laps} tickEvery={24} bitSize={26} />
      </div>
      {/* I–J: each lap fires a beam from the ring and its token pops into the answer grid, in order (no flying debris) */}
      {gridOn > 0
        ? grid.map(({k, g, x, y, w, word}) => {
            if (g > f) return null;
            const beam = 1 - clamp01((f - g) / 8);
            const sx = RING.cx + RING.r * 0.92;
            const sy = RING.cy - 20;
            return (
              <div key={k} style={{position: 'absolute', left: 0, top: 0, opacity: gridOn}}>
                {beam > 0 ? (
                  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                    <path d={`M ${sx} ${sy} Q ${(sx + x) / 2} ${Math.min(sy, y) - 80} ${x} ${y}`} fill="none" stroke={PAL.info} strokeWidth={5} opacity={0.85 * beam} strokeLinecap="round" />
                  </svg>
                ) : null}
                <TokenTile frame={f} text={word} x={x} y={y} size={GRID.size} w={w} snapAt={g + 2} from={{dx: 0, dy: -24, rot: 0}} newest={1 - prog(f, g + 10, 14)} />
              </div>
            );
          })
        : null}
      {/* the die */}
      <Prop
        frame={f}
        src={DIE_SRC}
        x={DIE.x}
        y={DIE.y}
        w={DIE.w}
        rim={{color: PAL.info, strength: 0.2 + 0.4 * power * (1 - idle * 0.6)}}
        sweep={{every: 140, offset: 30, strength: 0.4}}
        shadow={0.65}
        brightness={[[T.so8, 0.42], [T.so8 + 30, 1], [T.butWhy, 1], [T.butWhy + 30, 0.72]]}
        opacity={dieOn}
      >
        <DieOverlay f={f} laneGlow={laneGlow} />
      </Prop>
      {/* run pulses */}
      <div style={{position: 'absolute', left: 0, top: 0, opacity: dieOn}}>
      <RunPulse frame={f} at={READ_HIT} x={DIE.x - 60} y={DIE.y - 20} r0={80} r1={620} dur={30} width={8} />
      <RunPulse frame={f} at={SAME_HIT} x={DIE.x - 60} y={DIE.y - 20} r0={70} r1={480} dur={26} />
      {CH.map((c, i) => (
        <RunPulse key={i} frame={f} at={c + CH_TRAVEL + CH_DUR} x={DIE.x - 60} y={DIE.y - 20} r0={60} r1={380} dur={20} />
      ))}
      {tables()
        .laps.filter((g) => g <= f && g > f - 16)
        .map((g) => (
          <RunPulse key={g} frame={f} at={g} x={DIE.x - 60} y={DIE.y - 20} r0={50} r1={260} dur={14} width={4} />
        ))}
      </div>
      {/* lanes, then the prompt row on top of them */}
      {/* the prompt side is done once the first piece is out: it leaves the set (no half-cropped row later) */}
      <div style={{position: 'absolute', left: 0, top: 0, opacity: promptOut}}>
      <Lanes f={f} tx={tx} y0s={y0s} />
      {/* long prompt wall (F) */}
      {f >= T.orChunk - 2 && f <= T.longEnd + 24 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {wall().map((t, i) => {
            const v = wallIn(t.row);
            if (v <= 0) return null;
            const y = rowY(t.row) + (1 - v) * -40;
            const g = chunkGlow(chunkOf(t.row));
            return (
              <g key={i} opacity={v}>
                <rect x={t.x - t.w / 2} y={y - 21} width={t.w} height={46} rx={9} fill="#8E97A8" />
                <rect x={t.x - t.w / 2} y={y - 25} width={t.w} height={44} rx={9} fill={g > 0.05 ? `rgb(${Math.round(246 - 120 * g)},${Math.round(247 - 10 * g)},${Math.round(249)})` : PAL.tile} />
                {g > 0.05 ? <rect x={t.x - t.w / 2 - 2} y={y - 27} width={t.w + 4} height={48} rx={10} fill="none" stroke={PAL.info} strokeWidth={4} opacity={g} /> : null}
              </g>
            );
          })}
          {[0, 1, 2].map((c) => {
            const rows = c === 0 ? [8, 6] : c === 1 ? [5, 3] : [2, 0];
            const yA = rowY(rows[0]) - 40;
            const yB = c === 2 ? PY[1] + 60 : rowY(rows[1]) + 40;
            const v = Math.min(wallIn(rows[0]), 1);
            const g = chunkGlow(c);
            return (
              <g key={c} opacity={v}>
                <path d={`M 1640 ${yA} H 1666 V ${yB} H 1640`} fill="none" stroke={g > 0.05 ? PAL.info : PAL.annotation} strokeWidth={6} strokeLinejoin="round" opacity={0.5 + 0.5 * g} />
                {g > 0.05 ? <path d={`M 1640 ${yA} H 1666 V ${yB} H 1640`} fill="none" stroke={PAL.info} strokeWidth={18} opacity={0.25 * g} /> : null}
              </g>
            );
          })}
        </svg>
      ) : null}
      {QUESTION.map((t, i) => (
        <TokenTile key={i} frame={f} text={t} x={tx[i]} y={ty[i]} size={rs} w={qw[i]} newest={pg} />
      ))}
      <Ready f={f} xs={tx.map((x, i) => x + qw[i] / 2 - 4)} ys={ty.map((y) => y - rth / 2 + 4)} />
      </div>
      {/* "already there": one light sweep across the whole row */}
      {win(f, T.already, T.already + 20, 0, 0) > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: lerp(40, 1700, prog(f, T.already, 20, EASE.inOut)) - 90,
            top: PY[0] - rth,
            width: 180,
            height: PY[1] - PY[0] + rth * 2,
            background: `linear-gradient(100deg, rgba(255,255,255,0), ${rgba('#FFFFFF', 0.5)}, rgba(255,255,255,0))`,
            mixBlendMode: 'screen',
            filter: 'blur(6px)',
          }}
        />
      ) : null}
      </div>
    </Stage>
  );
};

export const readWorld = (f: number): React.ReactNode => <ReadWorld f={f} />;
