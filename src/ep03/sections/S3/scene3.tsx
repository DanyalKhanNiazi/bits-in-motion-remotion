/**
 * S3 · P07 scenes, all in the warm reader world.
 *   3  the reader's desk: the answer streams live, a mini loop laps once per word
 *   4  streaming vs not streaming on the (defocused) desk: both done at 10 s
 *   5  one big chat panel: "You read this" over the first half, "Not written yet" over the dashed tail; small bunches;
 *      the camera tracks the Bit (the caret)
 *      then the first words glow and the dashed tail crumbles: "Doesn't exist yet".
 * S4 opens on this same scene5 (read-only import of `scene5` and `_s3.TIMES5`): keep those exports stable.
 */
import React from 'react';
import {EASE, KineticText, Label, MONO, PAL, Prop, REGIONS, Rich, SANS, SPRING, ScreenSlot, Stage, clamp01, lerp, plateToStage, poseAt, prog, rgba, springAt, toScreen, type CamKey, type KenBurns} from '../../kit';
import {A} from './anchors';
import {ANSWER_WORDS, PROMPT, StreamPane, paneGeo, shownAt} from './pane';

const N = ANSWER_WORDS.length;
const SLOT = REGIONS.deskScreen as {shape: 'rect'; x: number; y: number; w: number; h: number};

/* ================================================================= scene 3: the desk, live */
export const T3 = {start: A.p7 - 14, ans0: A.streams + 2, badge: A.thatLoop, out: A.streaming - 6};
const KB3: KenBurns = {from: {s: 1.16, x: 0, y: 60}, to: {s: 1.5, x: 0, y: 170}, start: A.p7 - 14, end: A.streaming + 6};
const FS3 = 30;
const TIMES3: number[] = ANSWER_WORDS.map((_, i) => Math.round(T3.ans0 + i * 4.6 + 1.6 * Math.sin(i * 2.1) * Math.cos(i * 0.7)));
const G3 = paneGeo(SLOT.w, SLOT.h, FS3, ANSWER_WORDS, PROMPT);

export const scene3 = (f: number): React.ReactNode => {
  const shown = shownAt(TIMES3, f);
  const caret = G3.after(shown - 1);
  const b = plateToStage(f, KB3, SLOT.x + caret.x + FS3 * 1.2, SLOT.y + caret.y + FS3 * 2.0);
  const pose = poseAt(f, undefined, 0.8);
  const bs = toScreen(pose, b.x, b.y);
  const hud = <Label frame={f} at={T3.badge + 3} text="The loop" size={62} x={Math.min(1500, bs.x + 120)} y={Math.min(870, bs.y + 130)} to={{x: bs.x + 12, y: bs.y + 30}} />;
  return (
    <Stage
      frame={f}
      drift={0.8}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb: KB3,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <StreamPane frame={f} w={SLOT.w} h={SLOT.h} fontSize={FS3} times={TIMES3} prompt={PROMPT} promptAt={A.p7 - 40} badge={{at: T3.badge}} fog={{lines: 1, opacity: 0.7}} />
          </ScreenSlot>
        ),
      }}
      hud={hud}
    />
  );
};

/* ================================================================= scene 4: streaming vs not, on the desk */
export const T4 = {start: A.streaming - 10, clk0: A.sooner - 12, clk1: A.ten2, done: A.eitherWay, out: A.butYou};
const MON_L = {x: 486, y: 470, w: 880};
const MON_R = {x: 1434, y: 470, w: 880};
const FS4 = 76;
const TIMES4_S: number[] = ANSWER_WORDS.map((_, i) => Math.round(T4.clk0 + ((T4.clk1 - T4.clk0) * (i + 1)) / N));
const TIMES4_N: number[] = ANSWER_WORDS.map(() => T4.clk1);

const Clock: React.FC<{frame: number; x: number; y: number; delay?: number}> = ({frame: f, x, y, delay = 0}) => {
  const inn = prog(f, T4.start + 8 + delay, 12, EASE.out);
  if (inn <= 0) return null;
  const t = clamp01((f - T4.clk0) / (T4.clk1 - T4.clk0));
  const done = f >= T4.clk1;
  const pop = done ? springAt(f, T4.clk1, SPRING.slam) : 0;
  const ok = springAt(f, T4.done + delay, SPRING.pop);
  const W = 560;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: inn, transform: `translateY(${(1 - inn) * 20}px)`}}>
      <div style={{position: 'absolute', left: x - W / 2, top: y + 56, width: W, height: 8, borderRadius: 4, background: rgba(PAL.structure, 0.35)}}>
        <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${t * 100}%`, borderRadius: 4, background: done ? PAL.infoPale : PAL.info, boxShadow: `0 0 14px ${rgba(PAL.info, 0.7)}`}} />
        <div style={{position: 'absolute', left: `calc(${t * 100}% - 9px)`, top: -5, width: 18, height: 18, borderRadius: 4, background: PAL.infoPale, boxShadow: `0 0 18px ${rgba(PAL.info, 0.9)}`}} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(-50%, -50%) scale(${done ? lerp(1.5, 1, Math.min(1, pop)) + 0.06 * Math.max(0, pop - 1) : 1})`,
          fontFamily: done ? SANS : MONO,
          fontWeight: done ? 700 : 500,
          fontSize: done ? 92 : 72,
          color: done ? PAL.infoPale : PAL.ink,
          whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
          textShadow: done ? `0 0 ${24 * Math.exp(-(f - T4.clk1) / 8)}px ${rgba(PAL.info, 0.9)}` : '0 2px 16px rgba(0,0,0,0.8)',
        }}
      >
        {done ? '10 s' : `${(t * 10).toFixed(1)} s`}
        {ok > 0 ? (
          <span style={{display: 'inline-block', marginLeft: 22, transform: `scale(${Math.max(0, ok)})`, color: PAL.info}}>
            <Rich text="✓" weight={700} />
          </span>
        ) : null}
      </div>
    </div>
  );
};

export const scene4 = (f: number): React.ReactNode => {
  const hud = (
    <>
      <KineticText frame={f} at={A.streaming} exitAt={T4.out + 10} text="Streaming" mode="pop" x={MON_L.x} y={100} size={72} color={PAL.info} />
      <KineticText frame={f} at={A.streaming + 12} exitAt={T4.out + 10} text="Not streaming" mode="pop" x={MON_R.x} y={100} size={72} color={PAL.ink} />
      <Clock frame={f} x={MON_L.x} y={826} />
      <Clock frame={f} x={MON_R.x} y={826} delay={3} />
    </>
  );
  const mon = (m: typeof MON_L, times: number[], streaming: boolean, i: number) => (
    <Prop
      frame={f}
      src="BIM150_T03_reader-monitor_b"
      x={m.x}
      y={m.y}
      w={m.w}
      enter={{kind: 'rise', at: T4.start + i * 4, dur: 20, dist: 60}}
      shadow={0.55}
      rim={{color: '#FFC98A', strength: 0.22}}
      sweep={{at: [T4.start + 14 + i * 6, T4.clk1 + 2], dur: 30, strength: 0.35}}
    >
      <ScreenSlot rect={REGIONS.monitorScreen}>
        <StreamPane
          frame={f}
          w={1260}
          h={615}
          fontSize={FS4}
          times={times}
          autoScroll
          waiting={streaming ? undefined : {until: T4.clk1}}
          flashAt={streaming ? undefined : T4.clk1}
          fog={streaming ? {lines: 1, opacity: 0.6} : undefined}
        />
      </ScreenSlot>
    </Prop>
  );
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'reader-desk', blur: 18, dim: 0.42, tint: 0.18, kb: {from: {s: 1.14, x: 40, y: 20}, to: {s: 1.2, x: -20, y: 30}, start: T4.start, end: T4.out + 20}}}
      cam={[
        {f: T4.start, zoom: 1.02, x: 960, y: 540},
        {f: T4.out + 20, zoom: 1.06, x: 960, y: 524},
      ]}
      hud={hud}
    >
      {mon(MON_L, TIMES4_S, true, 0)}
      {mon(MON_R, TIMES4_N, false, 1)}
    </Stage>
  );
};
/** where the zoom-through into the left screen should aim (stage px) */
export const SCENE4_LEFT_SCREEN = {x: MON_L.x, y: MON_L.y - 60};

/* ================================================================= scene 5: one big chat panel */
export const T5 = {
  start: A.butYou - 12,
  read: A.read,
  firstHalf: A.firstHalf,
  second: A.secondHalf,
  bunch0: A.some + 8,
  out: A.butFor,
};
const HALF = 18; // "…every token before it," closes the first half
const PW = 1000;
const PH = 820;
const PX0 = 80;
const PY0 = 140;
const FS5 = 48;
const COLX = 1112; // the callout column, right of the panel (world px)
const TIMES5: number[] = (() => {
  const t: number[] = [];
  for (let i = 0; i < N; i++) {
    if (i < 13) t.push(T5.start - 200 + i * 8);
    else if (i < HALF) t.push(Math.round(A.butYou + 2 + ((i - 13) * (T5.firstHalf - A.butYou - 4)) / 4));
    else if (i < 22) t.push(Math.round(A.secondHalf - 8 + (i - HALF) * 12));
    else if (i < 29) {
      const groups = [[22, 24], [25, 26], [27, 28]];
      const gi = groups.findIndex(([a, b]) => i >= a && i <= b);
      t.push(T5.bunch0 + gi * 26);
    } else t.push(Infinity);
  }
  return t;
})();
const G5 = paneGeo(PW, PH, FS5, ANSWER_WORDS, PROMPT);
const wPt = (px: number, py: number) => ({x: PX0 + px, y: PY0 + py});
const CARET_BUNCH = G5.after(23);
const TAIL = G5.after(28);
/**
 * The camera tells the beat: arrive wide → drift up onto the first half ("read") → down onto the caret and the dashed
 * tail ("still being written") → a close push on the Bit for the bunches → back out wide for "the first words" →
 * the payoff: a long push into the empty tail where the end does not exist yet.
 */
const CAM5: CamKey[] = [
  {f: T5.start, x: 960, y: 540, zoom: 1.0},
  {f: A.read + 4, x: 950, y: 530, zoom: 1.0},
  {f: A.firstHalf + 18, x: 880, y: 470, zoom: 1.08, dur: 34},
  {f: A.secondHalf + 28, x: 870, y: 600, zoom: 1.1, dur: 34},
  {f: A.some - 2, x: 872, y: 604, zoom: 1.1},
  {f: A.bunches - 6, ...wPt(CARET_BUNCH.x - 60, CARET_BUNCH.y + 70), zoom: 1.42, dur: 40},
  {f: A.butFor + 2, ...wPt(CARET_BUNCH.x - 40, CARET_BUNCH.y + 74), zoom: 1.45},
  {f: A.firstWords + 6, x: 900, y: 470, zoom: 1.0, dur: 40},
  {f: A.theEnd - 2, x: 905, y: 476, zoom: 1.01},
  {f: A.doesnt + 8, ...wPt(TAIL.x - 60, TAIL.y + G5.lh * 3.1), zoom: 1.68, dur: 28},
  {f: A.p8 + 40, ...wPt(TAIL.x - 40, TAIL.y + G5.lh * 3.3), zoom: 1.78},
];

/** a must-read callout pill (64 px) with an optional glyph and a leader to a target point (screen px) */
const Pill: React.FC<{frame: number; at: number; exitAt?: number; x: number; y: number; text: string; glyph?: 'eye' | 'dash'; color?: string; to?: {x: number; y: number}; size?: number}> = ({
  frame: f,
  at,
  exitAt,
  x,
  y,
  text,
  glyph,
  color = PAL.info,
  to,
  size = 64,
}) => {
  if (f < at - 1) return null;
  const sp = springAt(f, at, SPRING.pop);
  const ex = exitAt !== undefined ? prog(f, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const draw = prog(f, at - 2, 8, EASE.out);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: (1 - ex) * clamp01(sp * 2.5)}}>
      {to ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <line x1={x} y1={y} x2={lerp(x, to.x, draw)} y2={lerp(y, to.y, draw)} stroke={rgba('#03060D', 0.7)} strokeWidth={9} strokeLinecap="round" />
          <line x1={x} y1={y} x2={lerp(x, to.x, draw)} y2={lerp(y, to.y, draw)} stroke={glyph === 'dash' ? PAL.annotation : color} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={glyph === 'dash' ? '10 8' : undefined} />
          <circle cx={to.x} cy={to.y} r={9 * draw} fill={glyph === 'dash' ? PAL.annotation : color} />
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: `translate(0, -50%) scale(${Math.max(0, sp)}) translateY(${-16 * ex}px)`,
          transformOrigin: '0% 50%',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '8px 26px 10px 20px',
          borderRadius: 18,
          background: rgba('#06101F', 0.92),
          border: glyph === 'dash' ? `3px dashed ${rgba(PAL.annotation, 0.95)}` : `3px solid ${rgba(color, 0.9)}`,
          boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 30px ${rgba(color, 0.25)}`,
          whiteSpace: 'nowrap',
        }}
      >
        {glyph === 'eye' ? (
          <svg width={size} height={size * 0.62} viewBox="0 0 64 40">
            <path d="M3 20 C 14 4, 50 4, 61 20 C 50 36, 14 36, 3 20 Z" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
            <circle cx={32} cy={20} r={9} fill={color} />
            <circle cx={35} cy={17} r={3} fill="#FFFFFF" />
          </svg>
        ) : null}
        <span style={{fontFamily: SANS, fontWeight: 700, fontSize: size, lineHeight: 1.08, color: glyph === 'dash' ? PAL.ink : color}}>{text}</span>
      </div>
    </div>
  );
};
const pillW = (text: string, size = 64, glyph = false) => text.length * size * 0.6 + 56 + (glyph ? size + 16 : 0);
const keepOn = (x: number, w: number) => Math.max(72, Math.min(1848 - w, x));

/** the payoff: the tail is gone, and the line says so, big */
const Payoff: React.FC<{frame: number}> = ({frame: f}) => {
  const t = f - A.doesnt;
  if (t < -1) return null;
  const sp = springAt(f, A.doesnt, SPRING.slam);
  const s = lerp(2.2, 1, Math.min(1, sp));
  const glow = Math.exp(-Math.max(0, t) / 10);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 60% at 50% 56%, rgba(3,6,13,0) 30%, rgba(3,6,13,${0.55 * clamp01(t / 12)}) 100%)`}} />
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: 640,
          transform: `translate(-50%, -50%) scale(${s})`,
          opacity: clamp01((t + 1) / 3),
          filter: s > 1.02 ? `blur(${(s - 1) * 7}px)` : undefined,
          textAlign: 'center',
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{position: 'absolute', inset: '-0.4em -0.6em', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(3,6,13,0.85), rgba(3,6,13,0.55) 60%, rgba(3,6,13,0))'}} />
        <div style={{position: 'relative', fontFamily: SANS, fontWeight: 700, fontSize: 132, lineHeight: 1.05, color: PAL.ink, letterSpacing: '-0.01em', textShadow: `0 0 ${40 * glow}px ${rgba(PAL.infoPale, 0.7 * glow)}`}}>
          {"Doesn't exist "}
          <span style={{display: 'inline-block', padding: '0 0.18em', border: `0.045em dashed ${rgba(PAL.annotation, 0.95)}`, borderRadius: '0.14em', color: PAL.annotation}}>yet</span>
        </div>
      </div>
    </div>
  );
};

export const scene5 = (f: number): React.ReactNode => {
  const pose = poseAt(f, CAM5, 0.5);
  const W = (px: number, py: number) => toScreen(pose, PX0 + px, PY0 + py);
  const n = shownAt(TIMES5, f);
  const caret = G5.after(n - 1);
  const caretS = W(caret.x + FS5 * 0.2, caret.y + FS5 * 0.65);
  const midLine = G5.words[9].line;
  let rx = 0;
  for (let i = 0; i < HALF; i++) if (G5.words[i].line === midLine) rx = Math.max(rx, G5.words[i].x + G5.words[i].w);
  const readS = W(rx + 8, G5.top + midLine * G5.lh + FS5 * 0.7);
  const fogS = W(Math.min(G5.right - 40, G5.after(n).x + 130), caret.y + G5.lh * 1.6);
  const firstS = W(G5.words[3].x + G5.words[3].w + 10, G5.words[3].y + FS5 * 0.62);
  const colX = toScreen(pose, COLX, 0).x;
  const tRead = 'You read this';
  const tNot = 'Not written yet';
  const tBun = 'Small bunches';
  const tFirst = 'First words';
  const hud = (
    <>
      <Pill frame={f} at={A.read + 4} exitAt={A.some + 14} x={keepOn(colX, pillW(tRead, 64, true))} y={readS.y - 34} to={readS} text={tRead} glyph="eye" />
      <Pill frame={f} at={A.secondHalf + 2} exitAt={A.some + 14} x={keepOn(colX, pillW(tNot))} y={Math.min(860, fogS.y + 70)} to={fogS} text={tNot} glyph="dash" />
      <Pill frame={f} at={A.bunches - 4} exitAt={A.butFor + 16} x={keepOn(caretS.x - 520, pillW(tBun))} y={Math.min(860, caretS.y + 170)} to={{x: caretS.x, y: caretS.y + 26}} text={tBun} />
      <Pill frame={f} at={A.firstWords} exitAt={A.theEnd + 4} x={keepOn(colX, pillW(tFirst))} y={Math.max(160, firstS.y)} to={firstS} text={tFirst} />
      <Payoff frame={f} />
    </>
  );
  return (
    <Stage frame={f} drift={0.5} motionBlur={0.5} cam={CAM5} env={{kind: 'photo', plate: 'reader-desk', blur: 20, dim: 0.5, tint: 0.2, kb: {from: {s: 1.2, x: 0, y: 60}, to: {s: 1.32, x: -40, y: 70}, start: T5.start, end: A.p8 + 30}}} hud={hud}>
      <div
        style={{
          position: 'absolute',
          left: PX0,
          top: PY0,
          width: PW,
          height: PH,
          borderRadius: 28,
          overflow: 'hidden',
          boxShadow: `0 50px 120px rgba(0,0,0,0.65), 0 0 0 2px ${rgba(PAL.structure, 0.35)}, 0 0 80px ${rgba('#5AB8FF', 0.12)}`,
        }}
      >
        <StreamPane
          frame={f}
          w={PW}
          h={PH}
          fontSize={FS5}
          times={TIMES5}
          prompt={PROMPT}
          promptAt={-1e9}
          fog={{lines: 1, opacity: 1, crumbleAt: A.doesnt - 4, endTile: true}}
          read={{upTo: HALF, at: A.read, dur: 30, until: A.some + 10}}
          bunches
          glowFirst={{at: A.firstWords, n: 4}}
        />
      </div>
    </Stage>
  );
};

export const _s3 = {TIMES3, TIMES5, G5};
