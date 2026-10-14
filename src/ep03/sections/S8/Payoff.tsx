// S8 shot G: on the reader's screen, the same answer written two ways: one piece per trip vs speculative bursts.
// ×2–3 faster (Google's original paper, one request at a time), with the same odds as the big model alone.
import React from 'react';
import {ChatScreen, EASE, Footnote, KineticText, PAL, REGIONS, Rich, SANS, ScreenSlot, Stage, prog, rgba, springAt, SPRING, tokenize, type CamKey} from '../../kit';
import {W, TO} from './T';

export const ANSWER = 'Because each piece depends on the ones before it, so the pieces have to come in order.';
const TOKS = tokenize(ANSWER);
const START = W.when - 4;
const TRIP_N = 14; // frames per trip, one piece each
const TRIP_S = 16; // speculative trip (the draft model's guesses take a little time too)
const BURSTS = [3, 2, 4, 3, 2, 3]; // pieces accepted per speculative trip (sums to the token count: 17)

export const normalTimes = TOKS.map((_, i) => START + 2 + i * TRIP_N);
export const specTimes = (() => {
  const out: number[] = [];
  let k = 0;
  BURSTS.forEach((n, j) => {
    for (let i = 0; i < n && k < TOKS.length; i++, k++) out.push(START + 2 + j * TRIP_S + i);
  });
  while (out.length < TOKS.length) out.push(START + 2 + BURSTS.length * TRIP_S);
  return out;
})();
const SPEC_DONE = specTimes[specTimes.length - 1];
const NORM_DONE = normalTimes[normalTimes.length - 1];

const KB = {from: {s: 1.36, x: 10, y: 140}, to: {s: 1.5, x: 0, y: 168}, start: W.when - 10, end: TO};

export const payoffCam: CamKey[] = [
  {f: W.when - 10, x: 930, y: 556, zoom: 1.0},
  {f: TO - 22, x: 1000, y: 524, zoom: 1.12},
  {f: TO + 2, x: 1060, y: 470, zoom: 2.2, dur: 24, ease: 'inExpo'},
];

/** A trip light: flashes once per trip across the bridge (same trip rhythm in both panes). */
const tripFlash = (f: number, period: number, until: number) => {
  if (f < START || f > until + 2) return 0;
  const t = (f - START) % period;
  return Math.exp(-t / 3);
};

const Pane: React.FC<{frame: number; title: string; times: readonly number[]; done: number; period: number; hot?: boolean}> = ({frame: f, title, times, done, period, hot}) => {
  const fl = tripFlash(f, period, done);
  return (
  <div style={{position: 'absolute', inset: 0}}>
    <ChatScreen frame={f} w={510} h={547} title="" answer={ANSWER} times={times} fontSize={31} fog={6} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: SANS, fontWeight: 700, fontSize: 29, color: hot ? PAL.infoPale : PAL.ink}}>
      <span style={{width: 16, height: 16, borderRadius: 4, background: fl > 0.05 ? PAL.info : rgba(PAL.structure, 0.6), boxShadow: fl > 0.05 ? `0 0 ${6 + 16 * fl}px ${PAL.info}` : undefined, transform: `scale(${1 + 0.5 * fl})`}} />
      {title}
    </div>
    {f >= done ? (
      <div style={{position: 'absolute', inset: 0, borderRadius: 4, boxShadow: `inset 0 0 0 ${3}px ${rgba(hot ? PAL.info : PAL.annotation, 0.7 * prog(f, done, 8))}`}} />
    ) : null}
  </div>
  );
};

export const PayoffScene: React.FC<{frame: number}> = ({frame: f}) => {
  const sameIn = prog(f, W.without - 2, 10, EASE.out);
  const screen = (
    <ScreenSlot rect={REGIONS.deskScreen}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1032, height: 547, background: '#0B1220'}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 510, height: 547}}>
        <Pane frame={f} title="Normal" times={normalTimes} done={NORM_DONE} period={TRIP_N} />
      </div>
      <div style={{position: 'absolute', left: 522, top: 0, width: 510, height: 547}}>
        <Pane frame={f} title="Speculative" times={specTimes} done={SPEC_DONE} period={TRIP_S} hot />
      </div>
      <div style={{position: 'absolute', left: 513, top: 20, width: 6, height: 507, borderRadius: 3, background: rgba(PAL.structure, 0.6)}} />
    </ScreenSlot>
  );
  const sp = springAt(f, W.without, SPRING.pop);
  const hud = (
    <>
      <KineticText frame={f} at={W.twoToThree} text="×2–3" x={1290} y={566} size={200} mode="slam" exitAt={TO - 16} />
      <KineticText frame={f} at={W.faster3} text="faster" x={1700} y={604} size={80} mode="pop" exitAt={TO - 16} />
      <KineticText frame={f} at={W.oneRequest} text="One request at a time" x={1410} y={758} size={60} mode="rise" backing="plate" exitAt={W.without + 12} />
      {sameIn > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: 1410,
            top: 868,
            transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * Math.min(1.04, sp)})`,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            padding: '10px 30px 12px',
            borderRadius: 16,
            background: rgba('#070B15', 0.9),
            border: `3px solid ${PAL.info}`,
            boxShadow: `0 0 30px ${rgba(PAL.info, 0.45)}`,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 52,
            color: PAL.ink,
            whiteSpace: 'nowrap',
            opacity: prog(f, W.without, 6) * (1 - prog(f, TO - 14, 8)),
          }}
        >
          <span style={{color: PAL.info}}>
            <Rich text="✓" weight={700} color={PAL.info} />
          </span>
          <span style={{display: 'inline-block', textAlign: 'left', lineHeight: 1.08}}>
            Same odds as
            <br />
            the big model
          </span>
        </div>
      ) : null}
      <Footnote frame={f} at={W.googles} text="Google's original paper" size={40} exitAt={TO - 14} />
      {f >= TO - 7 ? <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 54% 46%, ${rgba('#FFFFFF', 0.85 * prog(f, TO - 7, 7))}, ${rgba(PAL.info, 0.35 * prog(f, TO - 7, 7))} 40%, rgba(0,0,0,0) 75%)`, mixBlendMode: 'screen'}} /> : null}
    </>
  );
  return (
    <Stage frame={f} env={{kind: 'photo', plate: 'reader-desk', kb: KB, dim: 0.1, floor: 0.45, children: screen}} cam={payoffCam} hud={hud} />
  );
};
