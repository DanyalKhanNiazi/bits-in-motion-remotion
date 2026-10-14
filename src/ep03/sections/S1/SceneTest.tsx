/**
 * S1 shot 1, the cold open on the payoff, then its source. Calm two-column layout, one idea at a time:
 *  1. Left: a ≈750-word prompt slams into the screen and is read at once; its stopwatch freezes and "0.03 s"
 *     lands big under it; the wall then dims into the background.
 *  2. The camera drifts right; the right side powers on.
 *  3. Right: the answer trickles in while the write stopwatch runs and its coral number counts up.
 * On "a small AI model" the camera tilts down to the datacenter GPU feeding both screens; the two stopwatches glide to
 * the frame's sides, the Write one still running.
 */
import React from 'react';
import {KineticText, Label, PAL, Prop, REGIONS, SANS, ScreenSlot, Stage, poseAt, propPoint, propRect, regionCenter, streamTimes, toScreen, type CamKey} from '../../kit';
import {EASE, TAU, clamp01, lerp, pathAt, prog, rgba, samplePath} from '../../kit';
import {A, T} from './anchors';
import {Flash} from './fx';
import {Stopwatch} from './Stopwatch';
import {ANSWER_TOKENS, ReaderChat} from './ReaderChat';

const GPU_SRC = 'BIM129_T03_datacenter-gpu_a' as const;
const MON_SRC = 'BIM150_T03_reader-monitor_b' as const;
/** two columns (world px): screen on top, label, stopwatch, big number */
const COL = [480, 1440] as const;
const MON = {y: 225, w: 470};
const LABEL_Y = 425;
const CLOCK = {y: 605, w: 230};
const NUM_Y = 832;
const GPU = {x: 960, y: 1450, w: 860} as const;
/** left side: the prompt lands on frame 1 and is read at once */
const SLAM = 1;
const READ = 3;
/** right side powers on as the camera drifts over, then the answer starts */
const RIGHT_ON = 24;
const WRITE0 = 34;
const TEASE_TIMES = streamTimes(ANSWER_TOKENS.length, WRITE0, 6.5, 0.4);
/** the race board hands over to the GPU shot */
const OUT = A.small - 6;

const cam: CamKey[] = [
  {f: -12, x: 820, y: 560, zoom: 1.1},
  {f: 16, x: 860, y: 520, zoom: 1.04, ease: 'out'},
  {f: RIGHT_ON + 26, x: 1000, y: 520, zoom: 1.04, dur: 30, ease: 'inOut'},
  {f: OUT, x: 990, y: 524, zoom: 1.03},
  {f: A.model + 12, x: 960, y: 1310, zoom: 0.96, dur: A.model + 18 - A.small, ease: 'cam'},
  {f: T.toDesk + 16, x: 990, y: 1340, zoom: 1.06},
];
const shake = [{at: SLAM, strength: 0.8}];

export const SceneTest: React.FC<{frame: number}> = ({frame: f}) => {
  const pose = poseAt(f, cam, 1, shake);
  const S = (wx: number, wy: number) => toScreen(pose, wx, wy);
  const z = pose.zoom;
  const gbox = propRect(GPU_SRC, GPU);
  const hbm = regionCenter(REGIONS.gpuA_hbm[2]);
  const hbmW = propPoint(GPU_SRC, GPU, hbm.x, hbm.y);
  const hbmS = S(hbmW.x, hbmW.y);
  const leftW = propPoint(GPU_SRC, GPU, 300, 540);
  const leftS = S(leftW.x, leftW.y);
  const load = prog(f, A.model - 8, 30, EASE.out);
  const hl = REGIONS.gpuA_hbm.map((r, i) => ({region: r, at: A.model - 8 + i * 3, color: PAL.info, mode: 'glow' as const}));
  // data traces from the GPU up to each screen: only once the camera heads down to the GPU
  const monL = {x: COL[0], y: MON.y, w: MON.w};
  const monR = {x: COL[1], y: MON.y, w: MON.w};
  const ml = propRect(MON_SRC, monL);
  const mr = propRect(MON_SRC, monR);
  const trL = `M ${GPU.x - 180} ${gbox.y0 + 40} C ${GPU.x - 220} ${gbox.y0 - 160} ${COL[0]} ${ml.y1 + 170} ${COL[0]} ${ml.y1 - 6}`;
  const trR = `M ${GPU.x + 180} ${gbox.y0 + 40} C ${GPU.x + 220} ${gbox.y0 - 160} ${COL[1]} ${mr.y1 + 170} ${COL[1]} ${mr.y1 - 6}`;
  const traceOn = prog(f, OUT, 16);
  const sR = samplePath(trR);
  const pellets: React.ReactNode[] = [];
  if (traceOn > 0)
    for (let k = 0; k < 40; k++) {
      const u = (f - (OUT - 18 + k * 9)) / 18;
      if (u < 0 || u > 1) continue;
      const P = pathAt(sR, sR.total * (1 - u));
      pellets.push(<rect key={`w${k}`} x={P.x - 8} y={P.y - 8} width={16} height={16} rx={3} fill={PAL.info} opacity={traceOn} />);
    }
  // values and visibility
  const readVal = f >= READ ? 0.03 : 0;
  const writeVal = Math.max(0, (f - WRITE0) / 30);
  const leftDim = prog(f, READ + 8, 14, EASE.inOut);
  const rightOn = prog(f, RIGHT_ON, 14, EASE.out);
  const rightDim = prog(f, OUT - 2, 14, EASE.inOut);
  const board = 1 - prog(f, OUT, 12, EASE.inCubic);
  // stopwatches: anchored in their columns, then gliding to the frame's sides for the GPU shot
  const g = prog(f, OUT, 26, EASE.inOut);
  const cL = S(COL[0], CLOCK.y);
  const cR = S(COL[1], CLOCK.y);
  const swL = {x: lerp(cL.x, 200, g), y: lerp(cL.y, 640, g), w: lerp(CLOCK.w * z, 380, g)};
  const swR = {x: lerp(cR.x, 1720, g), y: lerp(cR.y, 640, g), w: lerp(CLOCK.w * z, 380, g)};
  const labL = S(COL[0], LABEL_Y);
  const labR = S(COL[1], LABEL_Y);
  const numL = S(COL[0], NUM_Y);
  const numR = S(COL[1], NUM_Y);
  const tag = S(960, 100);
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 70}}
      cam={cam}
      shake={shake}
      hud={
        <>
          <Stopwatch frame={f} label="Read" seconds={readVal} decimals={2} accent={PAL.info} x={swL.x} y={swL.y} w={swL.w} stopAt={READ} labelSize={48} digitSize={60} readoutOpacity={g} showLabel />
          <Stopwatch frame={f} label="Write" seconds={writeVal} decimals={1} accent={PAL.wait} x={swR.x} y={swR.y} w={swR.w} running={f >= WRITE0} opacity={Math.max(rightOn, g)} labelSize={48} digitSize={60} readoutOpacity={g} showLabel />
          {board > 0.01 ? (
            <>
              <div style={{position: 'absolute', left: labL.x, top: labL.y, transform: 'translate(-50%, -50%)', fontFamily: SANS, fontWeight: 600, fontSize: 56 * z, color: PAL.info, opacity: board * prog(f, -6, 8), whiteSpace: 'nowrap'}}>Reading the prompt</div>
              <div style={{position: 'absolute', left: labR.x, top: labR.y, transform: 'translate(-50%, -50%)', fontFamily: SANS, fontWeight: 600, fontSize: 56 * z, color: PAL.wait, opacity: board * rightOn, whiteSpace: 'nowrap'}}>Writing the answer</div>
              <KineticText frame={f} at={READ} exitAt={OUT} text="0.03 s" mode="slam" x={numL.x} y={numL.y} size={190 * z} color={PAL.info} backing="none" />
              {f >= WRITE0 ? (
                <div
                  style={{
                    position: 'absolute',
                    left: numR.x,
                    top: numR.y,
                    transform: 'translate(-50%, -50%)',
                    fontFamily: SANS,
                    fontWeight: 700,
                    fontSize: 190 * z,
                    lineHeight: 1,
                    color: PAL.wait,
                    opacity: board * prog(f, WRITE0, 6),
                    whiteSpace: 'nowrap',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {writeVal.toFixed(1)}
                  <span style={{fontSize: 120 * z, color: rgba(PAL.wait, 0.85)}}> s</span>
                </div>
              ) : null}
              <div style={{position: 'absolute', left: tag.x, top: tag.y, transform: 'translate(-50%, -50%)', padding: '6px 16px', borderRadius: 10, background: rgba('#05080F', 0.62), fontFamily: SANS, fontWeight: 600, fontSize: 40, color: PAL.muted, opacity: board * prog(f, A.nvidia, 10), whiteSpace: 'nowrap'}}>
                NVIDIA's own test
              </div>
            </>
          ) : null}
          <Label frame={f} at={A.model} text="A small AI model" x={560} y={150} to={hbmS} size={80} screen />
          <Label frame={f} at={A.single} text="A single data-center GPU" x={440} y={886} to={leftS} size={80} screen />
        </>
      }
    >
      {traceOn > 0 ? (
        <svg width={1920} height={2200} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={traceOn}>
          {[trL, trR].map((d, i) => (
            <g key={i}>
              <path d={d} fill="none" stroke={PAL.infoDeep} strokeWidth={14} strokeLinecap="round" opacity={0.7} />
              <path d={d} fill="none" stroke={PAL.info} strokeOpacity={0.35 + 0.15 * Math.sin((TAU * f) / 40 + i)} strokeWidth={4} strokeLinecap="round" />
            </g>
          ))}
          {pellets}
        </svg>
      ) : null}
      {[
        {p: monL, bright: lerp(1, 0.5, leftDim), chat: <ReaderChat frame={f} w={1260} h={615} wallAt={SLAM} readAt={READ} foldAt={1e9} times={[]} />},
        {p: monR, bright: lerp(0.35, 1, rightOn) * lerp(1, 0.55, rightDim), chat: <ReaderChat frame={f} w={1260} h={615} wallAt={-40} readAt={-30} foldAt={-1e9} times={TEASE_TIMES} fontSize={44} />},
      ].map(({p, bright, chat}, i) => (
        <Prop key={i} frame={f} src={MON_SRC} {...p} tiltY={i ? -5 : 5} shadow={0.5} brightness={lerp(0.55, 0.95, bright)} rim={{color: '#7FB8FF', strength: 0.18}}>
          <ScreenSlot rect={REGIONS.monitorScreen} glow={1.1 * bright}>
            <div style={{position: 'absolute', inset: 0, filter: `brightness(${(0.45 + 0.55 * bright).toFixed(3)})`, opacity: 0.55 + 0.45 * bright}}>{chat}</div>
          </ScreenSlot>
        </Prop>
      ))}
      <Flash frame={f} at={SLAM} x={COL[0]} y={MON.y} r={520} dur={9} strength={0.75} />
      <Prop
        frame={f}
        src={GPU_SRC}
        {...GPU}
        tiltX={6}
        rim={{color: PAL.info, strength: 0.35 + 0.5 * load}}
        sweep={{at: [A.model + 4, A.single + 6], dur: 30, strength: 0.7}}
        float={3}
        shadow={{opacity: 0.7, dy: 10}}
        brightness={lerp(0.92, 1.08, load)}
        highlight={hl}
      />
    </Stage>
  );
};
