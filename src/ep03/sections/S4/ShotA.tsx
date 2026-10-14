/**
 * S4 shot A: the reader's desk. The answer streams (S3 plays this same shot for its last seconds, so the hand-off is
 * exact); a tape-stop; the kit Rewind runs the scene clock (frames since Enter) from 6 s back to 00:00 on "hit";
 * it lands (clunk) on the input box and the Enter keycap is pressed on "enter".
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ChatScreen, EASE, MONO, PAL, REGIONS, Rewind, SANS, ScreenSlot, Stage, clamp01, lerp, prog, rgba, smooth, streamTimes, tokenize, type CamKey} from '../../kit';
import {ANSWER, T, X} from './T';
import {Keycap, blip} from './parts';

const TOKS = tokenize(ANSWER);
/** answer token times on the scene clock (frames since Enter) */
const TIMES = streamTimes(TOKS.length, 6, 4.8, 0.3);
const PROMPT = 'Why do AI answers arrive one piece at a time?';
/** scene clock when the rewind starts (≈ 6 s after Enter) */
export const L_RW = 184;

/** Scene clock before the rewind: plays forward, then brakes to a stop on "rewind" (tape-stop). */
export const clockBefore = (f: number): number => {
  const a = X.stopFrom;
  const b = X.rwAt;
  const D = b - a;
  if (f >= b) return L_RW;
  if (f >= a) return L_RW - (b - f) ** 2 / (2 * D);
  return L_RW - D / 2 - (a - f);
};

const kbAt = (L: number) => {
  const u = clamp01(L / 190);
  const e = smooth(u) * 0.7 + u * 0.3;
  return {s: lerp(1.3, 1.47, e), x: lerp(0, -16, e), y: lerp(140, 205, e)};
};
/** after the rewind lands, the plate itself pushes onto the input box (the stage camera must not leave the plate) */
const PUSH = {s: 1.92, x: 301, y: -237};
const kbFor = (f: number, L: number) => {
  const b = kbAt(L);
  const p = prog(f, T.hit - 6, X.press - (T.hit - 6), EASE.cam);
  const p2 = prog(f, X.press, 22, EASE.inOut);
  return {s: lerp(b.s, PUSH.s, p) + 0.07 * p2, x: lerp(b.x, PUSH.x, p), y: lerp(b.y, PUSH.y, p)};
};

/** camera (absolute frames): a slow push into the rewind; zoom stays ≥ 1.03 so drift never shows the plate edge */
const CAM: CamKey[] = [
  {f: X.rwAt - 90, x: 960, y: 540, zoom: 1.03},
  {f: X.rwAt, x: 960, y: 546, zoom: 1.06},
  {f: T.hit - 8, x: 960, y: 544, zoom: 1.03, ease: 'inOut'},
];

/** input box overlay (slot px of the 1032 × 547 desk screen): the typed question, caret, send button */
const InputOverlay: React.FC<{f: number; L: number}> = ({f, L}) => {
  const vis = clamp01((7 - L) / 5);
  if (vis <= 0) return null;
  const press = blip(f, X.press, 1, 6);
  const sent = prog(f, X.press, 4, EASE.out);
  const caretOn = f < X.press && Math.floor(f / 9) % 2 === 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1032, height: 547, opacity: vis}}>
      <div
        style={{
          position: 'absolute',
          left: 50,
          top: 507,
          transform: `translateY(-52%) scale(${1 + 0.04 * press})`,
          transformOrigin: '0% 50%',
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: 24,
          color: PAL.ink,
          whiteSpace: 'nowrap',
          textShadow: sent > 0 ? `0 0 ${14 * sent}px ${rgba(PAL.info, 0.9 * sent)}` : undefined,
          filter: press > 0.02 ? `brightness(${1 + 0.8 * press})` : undefined,
        }}
      >
        {PROMPT}
        <span style={{display: 'inline-block', width: 11, height: 24, marginLeft: 4, verticalAlign: '-4px', background: PAL.info, opacity: caretOn ? 1 : 0.12, boxShadow: `0 0 10px ${rgba(PAL.info, 0.8)}`}} />
      </div>
      {/* send button lights on the press */}
      <div
        style={{
          position: 'absolute',
          left: 982 - 15,
          top: 507 - 15,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: sent > 0 ? PAL.info : rgba(PAL.structure, 0.5),
          boxShadow: sent > 0 ? `0 0 ${24 * (0.4 + press)}px ${rgba(PAL.info, 0.9)}` : undefined,
          transform: `scale(${1 + 0.35 * press})`,
        }}
      />
    </div>
  );
};

/** the reader scene at absolute frame f, with the chat on scene clock L */
const ReaderScene: React.FC<{f: number; L: number}> = ({f, L}) => {
  const kb = kbFor(f, L);
  const post = f >= T.hit;
  const stampOn = post && f < T.hit + 22;
  const stampOp = stampOn ? (f < T.hit + 14 ? (Math.floor((f - T.hit) / 5) % 2 === 0 ? 1 : 0.35) : 1 - (f - T.hit - 14) / 8) : 0;
  const clunk = blip(f, T.hit, 1, 4);
  return (
    <Stage
      frame={f}
      cam={CAM}
      drift={0.7}
      shake={[{at: T.hit, strength: 0.55}, {at: X.press + 1, strength: 0.3}]}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb: {from: kb, to: kb, start: 0, end: 1},
        floor: 0.25,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <ChatScreen frame={L} w={1032} h={547} prompt={PROMPT} promptAt={0} answer={TOKS} times={TIMES} fontSize={34} fog={Math.round(clamp01(L / 32) * 16)} />
            <InputOverlay f={f} L={L} />
          </ScreenSlot>
        ),
      }}
      hud={
        <>
          {stampOp > 0 ? (
            <div style={{position: 'absolute', left: 120, top: 110, display: 'flex', alignItems: 'center', gap: 18, opacity: clamp01(stampOp)}}>
              <svg width={56} height={56} viewBox="0 0 56 56">
                <rect x={8} y={8} width={40} height={40} rx={5} fill={PAL.ink} />
              </svg>
              <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 44, color: PAL.ink, letterSpacing: '0.08em'}}>00:00</span>
            </div>
          ) : null}
          <Keycap frame={f} x={1520} y={858} w={330} appearAt={T.hit - 2} pressAt={X.press} exitAt={X.diveAt + 3} />
          {clunk > 0.01 ? <AbsoluteFill style={{background: rgba('#DDF6FF', 0.4 * clunk), mixBlendMode: 'screen'}} /> : null}
        </>
      }
    />
  );
};

/** a large ◀◀ watermark over the rewind */
const RewindGhost: React.FC<{f: number}> = ({f}) => {
  const t = (f - X.rwAt) / X.rwDur;
  if (t <= 0 || t >= 1) return null;
  const a = Math.pow(Math.sin(Math.PI * t), 0.6);
  const s = 1 + 0.04 * Math.sin(f * 1.7);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'}}>
      <svg width={420} height={240} viewBox="0 0 92 56" style={{transform: `scale(${s})`, opacity: 0.4 * a, filter: `drop-shadow(0 0 18px ${rgba(PAL.info, 0.8)})`}}>
        <path d="M44 4 L4 28 L44 52 Z M88 4 L48 28 L88 52 Z" fill="#EAF6FF" />
      </svg>
    </AbsoluteFill>
  );
};

/** tape-stop wrapper: the picture judders and drains as the stream brakes */
const TapeStop: React.FC<{f: number; children: React.ReactNode}> = ({f, children}) => {
  const k = prog(f, X.stopFrom, X.rwAt - X.stopFrom, EASE.inCubic);
  if (k <= 0) return <>{children}</>;
  const jx = Math.sin(f * 2.3) * 3 * k;
  return (
    <AbsoluteFill style={{transform: `translateX(${jx}px)`, filter: `saturate(${1 - 0.25 * k}) brightness(${1 - 0.08 * k})`}}>
      {children}
      <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)', opacity: 0.5 * k}} />
    </AbsoluteFill>
  );
};

export const shotA = (f: number): React.ReactNode => {
  if (f < X.rwAt) {
    return (
      <TapeStop f={f}>
        <ReaderScene f={f} L={clockBefore(f)} />
      </TapeStop>
    );
  }
  if (f < X.rwAt + X.rwDur) {
    return (
      <AbsoluteFill>
        <Rewind frame={f} at={X.rwAt} dur={X.rwDur} from={L_RW} to={0} render={(sf) => <ReaderScene f={f} L={sf} />} />
        <RewindGhost f={f} />
      </AbsoluteFill>
    );
  }
  return <ReaderScene f={f} L={0} />;
};

/** where the dive starts (screen px): the typed question in the input box after the push */
export const DIVE_POINT = {x: 900, y: 600};
