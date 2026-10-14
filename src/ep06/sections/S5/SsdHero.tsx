/**
 * S5 local transition + hero (P11 "An SSD stores data in flash memory"): the SSD board's lit hero beat, then the dive.
 *   [at, at+12)        `a` pushes into `from` while ssd-board_a grows out of that point onto the dark hardware stage
 *   [at+12, swapAt)    hero hold: rim light, a light sweep, float, a slow push (the AtlasOpener sits in `hud`)
 *   swapAt             flash swap a → ssd-board_d (a tight flash on the board, no full-frame wash); the parts lift apart
 *   [diveAt, +18)      the camera dives into a NAND package of the exploded board and `b` grows out of it
 * The kit's DriveDive fixes the hold at ≈ 10 f with a full-frame white flash; this keeps its mechanics, stretched.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DIVE_POINTS, EASE, PAL, Prop, Stage, clamp01, lerp, poseAt, prog, propPoint, rgba, toScreen, type CamKey, type Render} from '../../kit';

const A_SRC = 'ssd-board_a' as const;
const D_SRC = 'ssd-board_d' as const;
const BOARD = {x: 975, y: 410, w: 1000};
const IN = 12;
const DIVE = 18;

export type SsdHeroProps = {frame: number; at: number; swapAt: number; diveAt: number; from: {x: number; y: number}; a: Render; b: Render; hud?: (f: number) => React.ReactNode};

export const SsdHero: React.FC<SsdHeroProps> = ({frame: f, at, swapAt, diveAt, from, a, b, hud}) => {
  const t = f - at;
  if (t < 0) return <>{a(f)}</>;
  if (f >= diveAt + DIVE) return <>{b(f)}</>;
  // (1) push into a; the board grows out of `from`
  const uA = clamp01(t / IN);
  const sA = Math.exp(lerp(0, Math.log(2.8), EASE.inExpo(uA)));
  const opA = 1 - clamp01((t - 5) / 6);
  const grow = EASE.outExpo(clamp01((t - 2) / (IN - 2)));
  // hero stage camera: a slow push through the hold
  const cam: CamKey[] = [
    {f: at, x: 960, y: 540, zoom: 1},
    {f: diveAt, x: 960, y: 524, zoom: 1.07},
  ];
  const px = lerp(from.x, BOARD.x, grow);
  const py = lerp(from.y, BOARD.y, grow);
  // (2) the explode: crossfade a → d inside a tight flash, a punch, then the parts keep lifting
  const d = f - swapAt;
  const xf = clamp01((d + 1) / 3);
  const flash = d > -3 && d < 12 ? (d < 0 ? Math.exp(-((d / 1.6) ** 2)) : Math.exp(-d / 2.6)) : 0;
  const punch = d >= 0 && d < 20 ? 1 + 0.06 * Math.exp(-d / 4) * Math.cos(d * 0.6) : 1;
  const lift = prog(f, swapAt, 14, EASE.out);
  // (3) the dive into the exploded board
  const tw = propPoint(D_SRC, {x: BOARD.x, y: BOARD.y - 14 * lift, w: BOARD.w}, DIVE_POINTS[D_SRC]![0], DIVE_POINTS[D_SRC]![1]);
  const tgt = toScreen(poseAt(Math.min(f, diveAt), cam, 0.6), tw.x, tw.y);
  const uD = prog(f, diveAt, 16, EASE.inExpo);
  const sD = Math.exp(lerp(0, Math.log(8), uD));
  const opD = clamp01((t - 3) / 6) * (1 - clamp01((f - diveAt - 12) / 6));
  const uB = clamp01((f - diveAt - 6) / 12);
  const sB = lerp(0.22, 1, EASE.outExpo(uB));
  const opB = clamp01((f - diveAt - 6) / 5);
  const bx = lerp(tgt.x, 960, EASE.outExpo(uB));
  const by = lerp(tgt.y, 540, EASE.outExpo(uB));
  const diveFlash = Math.exp(-(((f - diveAt - 7) / 3) ** 2));
  const prop = (src: typeof A_SRC | typeof D_SRC, op: number, extra: {dy?: number; s?: number} = {}) => (
    <Prop
      frame={f}
      src={src}
      x={px}
      y={py}
      w={BOARD.w}
      scale={lerp(0.12, 1, grow)}
      rot={lerp(-8, 0, grow)}
      tiltX={6}
      rim={{color: PAL.structure, strength: 0.75}}
      sweep={{at: [at + 13, swapAt + 3], dur: 22, strength: 0.75}}
      float={4}
      shadow={{opacity: 0.6 * grow}}
      opacity={op}
      nudge={{s: punch * (extra.s ?? 1), dy: extra.dy ?? 0, bright: 1 + 0.7 * flash}}
    />
  );
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
      {opA > 0.01 ? (
        <AbsoluteFill style={{transformOrigin: `${from.x}px ${from.y}px`, transform: `scale(${sA})`, opacity: opA, filter: uA > 0.1 ? `blur(${uA * 10}px)` : undefined}}>{a(f)}</AbsoluteFill>
      ) : null}
      {opD > 0.01 ? (
        <AbsoluteFill style={{opacity: opD, transformOrigin: `${tgt.x}px ${tgt.y}px`, transform: `scale(${sD})`, filter: uD > 0.15 ? `blur(${uD * 12}px)` : undefined}}>
          <Stage frame={f} env={{kind: 'stage', spot: 960, floor: 772, warm: 0.5}} cam={cam} drift={0.6} hud={hud && uD < 0.05 ? hud(f) : null}>
            {xf < 1 ? prop(A_SRC, 1 - xf) : null}
            {xf > 0 ? prop(D_SRC, xf, {dy: -14 * lift, s: 1 + 0.03 * lift}) : null}
            {flash > 0.02 ? (
              <div
                style={{
                  position: 'absolute',
                  left: BOARD.x - 420,
                  top: BOARD.y - 300,
                  width: 840,
                  height: 600,
                  borderRadius: '50%',
                  background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.9 * flash)}, ${rgba('#DCE4F2', 0.35 * flash)} 45%, rgba(0,0,0,0))`,
                  mixBlendMode: 'screen',
                }}
              />
            ) : null}
          </Stage>
        </AbsoluteFill>
      ) : null}
      {opB > 0.01 ? (
        <AbsoluteFill style={{opacity: opB, filter: uB < 1 ? `blur(${(1 - uB) * 8}px)` : undefined}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${bx - 960 * sB}px, ${by - 540 * sB}px) scale(${sB})`}}>{b(f)}</div>
        </AbsoluteFill>
      ) : null}
      {diveFlash > 0.02 ? (
        <AbsoluteFill style={{background: `radial-gradient(circle at ${tgt.x}px ${tgt.y}px, ${rgba('#FFFFFF', 0.55 * diveFlash)}, ${rgba(PAL.structure, 0.22 * diveFlash)} 28%, rgba(0,0,0,0) 60%)`, mixBlendMode: 'screen'}} />
      ) : null}
    </AbsoluteFill>
  );
};
