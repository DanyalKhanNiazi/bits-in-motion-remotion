/**
 * S1 shot 2, the reader's desk (reader-desk plate), decluttered: the monitor sits on the left of the frame and the
 * right side fades into clean dark space, where the clocks, their labels and the "under 0.03 s" lockup live. Nothing
 * sits on the text wall. Beats: the Read watch resets; the ≈750-word prompt slams in; the frame blinks (eyelids drawn
 * by the section) and inside the blink the whole prompt is read at once; on "three hundredths" the camera slides the
 * dimmed monitor further left and "under 0.03 s" lands beside the watch; the wall folds and the answer trickles out
 * while the Write watch crawls to ≈6.5 s.
 */
import React from 'react';
import {KineticText, PAL, Prop, REGIONS, Rich, SANS, ScreenSlot, Stage, poseAt, streamTimes, toScreen, type CamKey} from '../../kit';
import {EASE, clamp01, lerp, prog, rgba, springAt, SPRING} from '../../kit';
import {A, T} from './anchors';
import {ANSWER_TOKENS, ReaderChat} from './ReaderChat';
import {Stopwatch} from './Stopwatch';

export const READ_AT = T.blinkShut;
const FOLD_AT = A.then + 2;
const WRITE_START = A.wrote + 2;
const WRITE_DONE = A.half + 2;
export const DESK_TIMES = streamTimes(ANSWER_TOKENS.length, WRITE_START, 8.4, 0.35);
const HERO_IN = A.three - 3;
const HERO_OUT = A.then - 4;
/** the right column of clean space (screen px) */
const PX = 1565;

const cam: CamKey[] = [
  {f: T.toDesk, x: 960, y: 540, zoom: 1.0},
  {f: A.prompt, x: 962, y: 538, zoom: 1.02},
  {f: A.blink, x: 968, y: 532, zoom: 1.05, dur: A.blink - A.n750},
  {f: HERO_IN + 14, x: 1200, y: 540, zoom: 1.04, dur: 16, ease: 'inOut'},
  {f: HERO_OUT, x: 1212, y: 540, zoom: 1.05},
  {f: A.wrote + 8, x: 962, y: 540, zoom: 1.0, dur: 26, ease: 'inOut'},
  {f: T.toRace + 14, x: 970, y: 536, zoom: 1.03},
];
/** the reader's monitor, on the left of the frame */
const MON = {x: 660, y: 440, w: 1100} as const;
const shake = [
  {at: A.prompt, strength: 0.9},
  {at: A.three, strength: 0.45},
];

/** Write clock value: crawls from 0 to 6.5 between "wrote" and "half". */
const writeValue = (f: number) => 6.5 * prog(f, WRITE_START, WRITE_DONE - WRITE_START, (t) => t * (0.85 + 0.15 * t));

const Lbl: React.FC<{x: number; y: number; text: string; color: string; opacity: number}> = ({x, y, text, color, opacity}) =>
  opacity <= 0.01 ? null : (
    <div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', fontFamily: SANS, fontWeight: 600, fontSize: 54, color, opacity, whiteSpace: 'nowrap'}}>{text}</div>
  );

export const SceneDesk: React.FC<{frame: number}> = ({frame: f}) => {
  const heroIn = clamp01(springAt(f, HERO_IN, SPRING.pop));
  const heroOut = prog(f, HERO_OUT, 16, EASE.inOut);
  const hero = heroIn * (1 - heroOut);
  // the Read watch: pre-hero (right column) → hero (above the lockup) → answer phase (top of the right column)
  const pre = {x: PX, y: 500, w: 300};
  const big = {x: 1450, y: 380, w: 320};
  const post = {x: PX, y: 340, w: 230};
  const rp = heroOut > 0 ? {x: lerp(big.x, post.x, heroOut), y: lerp(big.y, post.y, heroOut), w: lerp(big.w, post.w, heroOut)} : {x: lerp(pre.x, big.x, heroIn), y: lerp(pre.y, big.y, heroIn), w: lerp(pre.w, big.w, heroIn)};
  const readOn = prog(f, T.toDesk + 4, 8, EASE.out);
  // the replay is motivated: the Read watch visibly resets (hand sweeps back, 0.03 → 0.00) before the prompt lands
  const RESET0 = T.toDesk + 14;
  const RESET1 = RESET0 + 12;
  const readVal = f >= READ_AT ? 0.03 : f < RESET0 ? 0.03 : 0.03 * (1 - prog(f, RESET0, RESET1 - RESET0, EASE.inOut));
  const writeOn = prog(f, A.then + 2, 10, EASE.out);
  const wv = writeValue(f);
  const approxIn = prog(f, WRITE_DONE, 8, EASE.out);
  const pose = poseAt(f, cam, 0.7, shake);
  // the lockup: "under 0.03 s" on one baseline, slammed as one unit
  const lk = f - A.three;
  const lkS = lk >= 0 ? lerp(1.9, 1, clamp01(springAt(f, A.three, SPRING.slam))) : 0;
  const lkOp = lk >= -1 ? clamp01((lk + 1) / 3) * (1 - prog(f, HERO_OUT, 9, EASE.inCubic)) : 0;
  const lkBright = lk >= 3 ? 1 + 0.6 * Math.exp(-(lk - 3) / 3) : 1;
  return (
    <Stage
      frame={f}
      cam={cam}
      shake={shake}
      drift={0.7}
      env={{kind: 'night', grid: true, dust: 50, warm: 0.8}}
      hud={
        <>
          <KineticText frame={f} at={A.n750} exitAt={A.then - 6} text="≈750 words" mode="slam" x={toScreen(pose, MON.x, 0).x} y={884} size={84} backing="plate" />
          <Lbl x={PX} y={rp.y - rp.w * 0.64 - 46} text="Reading the prompt" color={PAL.info} opacity={readOn * (1 - hero)} />
          <Stopwatch
            frame={f}
            label="Read"
            seconds={readVal}
            decimals={2}
            accent={PAL.info}
            x={rp.x}
            y={rp.y}
            w={rp.w}
            opacity={readOn}
            stopAt={f < READ_AT ? RESET1 : READ_AT}
            showLabel={false}
            digitSize={heroOut > 0 ? 56 : 64}
            readoutOpacity={1 - hero}
          />
          {lkOp > 0.01 ? (
            <div
              style={{
                position: 'absolute',
                left: big.x,
                top: 760,
                transform: `translate(-50%, -50%) scale(${lkS})`,
                opacity: lkOp,
                display: 'flex',
                alignItems: 'baseline',
                gap: 18,
                whiteSpace: 'nowrap',
                filter: [lkS > 1.02 ? `blur(${(lkS - 1) * 8}px)` : '', lkBright > 1.01 ? `brightness(${lkBright})` : ''].filter(Boolean).join(' ') || undefined,
              }}
            >
              <span style={{fontFamily: SANS, fontWeight: 600, fontSize: 70, color: PAL.annotation}}>under</span>
              <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 180, lineHeight: 1, color: PAL.info, textShadow: `0 0 30px ${rgba(PAL.info, 0.45)}`}}>
                <Rich text="0.03 s" weight={700} />
              </span>
            </div>
          ) : null}
          <Lbl x={PX} y={560} text="Writing the answer" color={PAL.wait} opacity={writeOn} />
          <Stopwatch
            frame={f}
            label="Write"
            seconds={wv}
            decimals={1}
            accent={PAL.wait}
            x={PX}
            y={760}
            w={230}
            opacity={writeOn}
            prefix="≈"
            prefixIn={approxIn}
            running={f >= WRITE_START && f < WRITE_DONE}
            stopAt={WRITE_DONE}
            showLabel={false}
            digitSize={56}
          />
        </>
      }
    >
      <Prop frame={f} src="BIM150_T03_reader-monitor_b" {...MON} shadow={0.6} brightness={1 - 0.35 * hero} rim={{color: '#FFB46A', strength: 0.18}} sweep={{at: [A.prompt + 2], dur: 30, strength: 0.3}}>
        <ScreenSlot rect={REGIONS.monitorScreen} glow={1.2 - 0.6 * hero}>
          <div style={{position: 'absolute', inset: 0, filter: `brightness(${(1 - 0.45 * hero).toFixed(3)})`}}>
            <ReaderChat frame={f} w={1260} h={615} wallAt={A.prompt} readAt={READ_AT} foldAt={FOLD_AT} times={DESK_TIMES} fontSize={50} />
          </div>
        </ScreenSlot>
      </Prop>
    </Stage>
  );
};
