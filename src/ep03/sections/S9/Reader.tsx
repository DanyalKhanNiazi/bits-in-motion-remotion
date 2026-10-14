/**
 * S9 shot 5 (P22): "Our question went in almost all at once, and its answer comes out exactly the way it describes."
 * The callback to the opening race, on the reader's own screen: the 11 question tiles fly in from the camera ALL AT
 * ONCE and slam into the prompt (flash); the "In" lane fills instantly. Then the answer trickles out one piece at a
 * time ("Out" crawls), and its own words "one piece at a time" are underlined as the voice says "describes".
 */
import React, {useId} from 'react';
import {EASE, PAL, REGIONS, SANS, ScreenSlot, Stage, TAU, TokenTile, BitHead, clamp01, lerp, plateToStage, poseAt, prog, rgba, safeId, tokenize, toScreen, type CamKey, type KenBurns} from '../../kit';
import {A} from './anchors';
import {ReaderChat, caretAt, chatLayout, type ChatSpec} from './Chat';

export const PROMPT = 'Why do AI answers arrive one piece at a time?';
/** the line break before "again" is deliberate: the last line starts on the spoken "again", so nothing reflows after it */
export const ANSWER = 'Because each piece depends on the ones before it, the answer is made one piece at a time. For each one, gigabytes of numbers cross a bridge,\nagain and again, piece after piece.';
export const TOKENS = tokenize(ANSWER);
/** index range of "one piece at a time." (the answer describing itself) */
export const SELF = {from: 13, to: 17};
const N_E = 18;

/** Token frames: the first 18 stream on "its answer comes out … describes"; the rest ride the finale (spoken words). */
const crateArr = (k: number) => A.finale[0] - 20 * 13 + k * 13;
export const TIMES: number[] = (() => {
  const t0 = A.itsAnswer + 4;
  const t1 = A.describes;
  const out: number[] = [];
  for (let i = 0; i < N_E; i++) out.push(Math.round(lerp(t0, t1, i / (N_E - 1)) + 0.8 * Math.sin(i * 2.3)));
  // "For each one," on three crate arrivals, then the spoken words
  out.push(crateArr(11), crateArr(12), crateArr(13));
  out.push(A.gigabytes, A.gigabytes + 15, A.numbers, A.cross, A.cross + 11, A.bridge);
  out.push(...A.finale);
  return out;
})();

/* ---------------------------------------------------------------- framing */
const S5 = 1.3;
const COVER = Math.max(1920 / 1672, 1080 / 941);
const Y5 = -20 + (470.5 - (98 + 547 / 2)) * COVER * S5;
export const KB5: KenBurns = {from: {s: S5, x: 0, y: Y5}, to: {s: S5, x: 0, y: Y5}, start: 0, end: 1};
export const CAM5: CamKey[] = [
  {f: A.trip - 20, x: 960, y: 540, zoom: 1.0},
  {f: A.describes + 6, x: 960, y: 522, zoom: 1.055, ease: 'inOut'},
];
export const CHAT5: ChatSpec = {w: 1032, h: 547, fs: 32, prompt: PROMPT, tokens: TOKENS, times: TIMES};
const SLOT = REGIONS.deskScreen as {x: number; y: number; w: number; h: number};

/** slot px → screen px in this shot */
export const slotToScreen5 = (f: number, sx: number, sy: number) => {
  const st = plateToStage(f, KB5, SLOT.x + sx, SLOT.y + sy);
  return toScreen(poseAt(f, CAM5), st.x, st.y);
};
export const caretScreen5 = (f: number) => {
  const L = chatLayout(CHAT5);
  const c = caretAt(L, TIMES, f);
  return slotToScreen5(f, c.x, c.y);
};

/* ---------------------------------------------------------------- the volley: 11 tiles fly in from the camera */
const QW = ['Why', 'do', 'AI', 'answers', 'arrive', 'one', 'piece', 'at', 'a', 'time', '?'];
const Volley: React.FC<{frame: number}> = ({frame: f}) => {
  const t0 = A.our + 3;
  const t1 = A.allAtOnce;
  if (f < t0 - 2 || f > t1 + 2) return null;
  const L = chatLayout(CHAT5);
  const target = slotToScreen5(f, L.bubble.x + L.bubble.w / 2, L.bubble.y + L.bubble.h / 2);
  return (
    <>
      {QW.map((w, i) => {
        const a = (TAU * i) / QW.length + 0.35;
        const sx = 960 + 880 * Math.cos(a);
        const sy = 540 + 500 * Math.sin(a);
        const st = t0 + (i % 3);
        const u = clamp01((f - st) / (t1 - st));
        // drift in slowly, then rush into the screen together
        const e = 0.18 * EASE.out(clamp01(u / 0.55)) + 0.82 * EASE.inExpo(clamp01((u - 0.45) / 0.55));
        const x = lerp(sx, target.x + (i - 5) * 6, e);
        const y = lerp(sy, target.y, e);
        const s = lerp(2.3, 0.3, EASE.inCubic(u));
        const blur = 9 * (1 - u) + 6 * Math.max(0, u - 0.7);
        const op = clamp01(u * 5) * (1 - prog(f, t1 - 1, 2));
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${s}) rotate(${(1 - e) * (i % 2 ? 18 : -18)}deg)`, filter: `blur(${blur}px)`, opacity: op}}>
            <TokenTile frame={f} text={w} x={0} y={0} size={60} newest={0.6} />
          </div>
        );
      })}
    </>
  );
};

/* ---------------------------------------------------------------- the race lanes (no numbers: in vs out) */
const Lanes: React.FC<{frame: number}> = ({frame: f}) => {
  const gid = safeId(useId());
  const app = prog(f, A.went - 6, 14, EASE.out);
  if (app <= 0) return null;
  const x0 = 560;
  const x1 = 1440;
  const W = x1 - x0;
  const inFill = prog(f, A.allAtOnce, 3, EASE.out);
  const inFlash = f >= A.allAtOnce ? Math.exp(-(f - A.allAtOnce) / 5) : 0;
  let shown = 0;
  TIMES.forEach((t, i) => {
    if (f >= t) shown = i + 1;
  });
  const step = (i: number) => (i <= 0 ? 0 : prog(f, TIMES[i - 1], 4, EASE.out));
  let outW = 0;
  for (let i = 1; i <= shown; i++) outW += step(i) * (W / TOKENS.length);
  const lane = (y: number, label: string, w: number, flash: number, bit: boolean) => (
    <div style={{position: 'absolute', left: 0, top: y, width: 1920, height: 0, opacity: app, transform: `translateY(${(1 - app) * 16}px)`}}>
      <div style={{position: 'absolute', left: x0 - 230, top: -46, width: 1140, height: 92, borderRadius: 18, background: rgba('#060A14', 0.72), border: `2px solid ${rgba(PAL.structure, 0.28)}`}} />
      <div style={{position: 'absolute', left: x0 - 206, top: -33, fontFamily: SANS, fontWeight: 600, fontSize: 56, lineHeight: '66px', color: PAL.ink}}>{label}</div>
      <div style={{position: 'absolute', left: x0, top: -8, width: W, height: 16, borderRadius: 8, background: rgba(PAL.structure, 0.35)}} />
      <div style={{position: 'absolute', left: x0, top: -8, width: w, height: 16, borderRadius: 8, background: PAL.info, boxShadow: `0 0 ${16 + 40 * flash}px ${rgba(PAL.info, 0.6 + 0.4 * flash)}`}} />
      {bit && w > 2 ? (
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <BitHead x={x0 + w} y={0} size={20} gid={gid} />
        </svg>
      ) : null}
    </div>
  );
  return (
    <>
      {lane(700, 'Read', W * inFill, inFlash, false)}
      {lane(806, 'Write', outW, 0, true)}
    </>
  );
};

/* ---------------------------------------------------------------- the shot */
export const ReaderShot: React.FC<{frame: number}> = ({frame: f}) => (
  <Stage
    frame={f}
    drift={0.6}
    cam={CAM5}
    env={{
      kind: 'photo',
      plate: 'reader-desk',
      kb: KB5,
      floor: 0.2,
      children: (
        <ScreenSlot rect={REGIONS.deskScreen}>
          <ReaderChat frame={f} {...CHAT5} promptAt={A.allAtOnce} slam fog={10} underline={{...SELF, at: Math.max(A.describes, TIMES[SELF.to]) + 1}} />
        </ScreenSlot>
      ),
    }}
    hud={
      <>
        <Lanes frame={f} />
        <Volley frame={f} />
      </>
    }
  />
);

