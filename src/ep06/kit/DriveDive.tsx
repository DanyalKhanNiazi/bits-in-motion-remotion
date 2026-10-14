/**
 * Ep06 kit: <DriveDive>, the scale jump from a scene into the drive and into the Archive, in ≤ 42 f:
 *   (1) the outgoing scene `a` pushes into `from` (e.g. the cyan afterimage on the monitor) while the drive render grows
 *       out of that point onto the dark hardware stage; (2) a short rim-lit hold (with `explode`, a flash swaps the
 *       render to its exploded variant: P05 hard-drive_d, P11 ssd-board_d); (3) the camera dives into `target` on the
 *       render and the incoming scene `b` (usually the Archive: give it a build event at the same frame) grows out of it.
 * Never more than two Stages at once (overlaps 6 f and 10 f).
 *
 *   <DriveDive frame={f} at={209} from={{x: 700, y: 380}} a={(fr) => <DeskShot f={fr} />} b={(fr) => <ArchiveShot f={fr} />} />
 *   <DriveDive frame={f} at={a} drive="ssd-board_a" explode="ssd-board_d" a={…} b={(fr) => <Stage env="flash" …/>} />
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, PAL} from './look';
import type {AssetName} from './assets';
import {Prop, propPoint} from './Prop';
import {Stage} from './Stage';
import type {Render} from './LensDive';
import {clamp01, lerp, prog, rgba} from './util';

/** dive points (native px) on the drive renders */
export const DIVE_POINTS: Partial<Record<AssetName, [number, number]>> = {
  'hard-drive_a': [600, 520],
  'hard-drive_b': [627, 560],
  'hard-drive_d': [620, 520],
  'ssd-board_a': [745, 595],
  'ssd-board_d': [700, 640],
};

export type DriveDiveProps = {
  frame: number;
  at: number;
  /** total length (≤ 42 f) */
  dur?: number;
  a: Render;
  b: Render;
  /** the screen point of `a` the camera pushes into (default centre) */
  from?: {x: number; y: number};
  /** the drive render (default hard-drive_a) */
  drive?: AssetName;
  /** swap to this exploded variant under a flash during the hold */
  explode?: AssetName;
  /** native point on the shown render to dive into (default DIVE_POINTS) */
  target?: [number, number];
  /** drive width on the stage (px) */
  w?: number;
};

export const DriveDive: React.FC<DriveDiveProps> = ({frame: f, at, dur = 42, a, b, from = {x: 960, y: 540}, drive = 'hard-drive_a', explode, target, w = 860}) => {
  const t = f - at;
  if (t < 0) return <>{a(f)}</>;
  if (t >= dur) return <>{b(f)}</>;
  const k = dur / 42;
  const T1 = 12 * k;
  const T2 = 26 * k;
  const swapAt = at + Math.round(16 * k);
  const shown: AssetName = explode && f >= swapAt ? explode : drive;
  const P = {x: 960, y: 560, w};
  const tp = target ?? DIVE_POINTS[shown] ?? [627, 627];
  const tgt = propPoint(shown, P, tp[0], tp[1]);
  // (1) push into a
  const uA = clamp01(t / T1);
  const sA = Math.exp(lerp(0, Math.log(2.8), EASE.inExpo(uA)));
  const opA = 1 - clamp01((t - 6 * k) / (6 * k));
  // drive stage: grows from `from`, holds, then dives
  const grow = EASE.outExpo(clamp01((t - 2 * k) / (T1 - 2 * k)));
  const px = lerp(from.x, P.x, grow);
  const py = lerp(from.y, P.y, grow);
  const ps = lerp(0.12, 1, grow);
  const opD = clamp01((t - 4 * k) / (6 * k)) * (1 - clamp01((t - 34 * k) / (6 * k)));
  const uD = prog(f, at + T2, dur - T2, EASE.inExpo);
  const sD = Math.exp(lerp(0, Math.log(8), uD));
  const push = 1 + 0.06 * clamp01((t - T1) / (T2 - T1));
  // (3) b grows out of the target point
  const uB = clamp01((t - 30 * k) / (12 * k));
  const sB = lerp(0.22, 1, EASE.outExpo(uB));
  const opB = clamp01((t - 30 * k) / (6 * k));
  const bx = lerp(tgt.x, 960, EASE.outExpo(uB));
  const by = lerp(tgt.y, 540, EASE.outExpo(uB));
  const flash = explode ? Math.exp(-Math.abs(f - swapAt) / 2.5) : 0;
  const diveFlash = Math.exp(-(((t - 31 * k) / (3 * k)) ** 2));
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
      {opA > 0.01 ? (
        <AbsoluteFill style={{transformOrigin: `${from.x}px ${from.y}px`, transform: `scale(${sA})`, opacity: opA, filter: uA > 0.1 ? `blur(${uA * 10}px)` : undefined}}>{a(f)}</AbsoluteFill>
      ) : null}
      {opD > 0.01 ? (
        <AbsoluteFill style={{opacity: opD, transformOrigin: `${tgt.x}px ${tgt.y}px`, transform: `scale(${sD * push})`, filter: uD > 0.15 ? `blur(${uD * 12}px)` : undefined}}>
          <Stage frame={f} env={{kind: 'stage', spot: 960, floor: 820}} drift={0.6}>
            <Prop
              frame={f}
              src={shown}
              x={px}
              y={py}
              w={w}
              scale={ps}
              rot={lerp(-8, 0, grow)}
              rim={{color: PAL.structure, strength: 0.7}}
              sweep={{at: [at + Math.round(13 * k)], dur: 16, strength: 0.7}}
              shadow={{opacity: 0.6 * grow}}
              nudge={{s: 1 + 0.06 * flash}}
            />
          </Stage>
        </AbsoluteFill>
      ) : null}
      {opB > 0.01 ? (
        <AbsoluteFill style={{opacity: opB, filter: uB < 1 ? `blur(${(1 - uB) * 8}px)` : undefined}}>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${bx - 960 * sB}px, ${by - 540 * sB}px) scale(${sB})`}}>{b(f)}</div>
        </AbsoluteFill>
      ) : null}
      {flash > 0.02 ? <AbsoluteFill style={{background: rgba('#FFFFFF', 0.7 * flash), mixBlendMode: 'screen'}} /> : null}
      {diveFlash > 0.02 ? <AbsoluteFill style={{background: `radial-gradient(circle at ${tgt.x}px ${tgt.y}px, ${rgba('#FFFFFF', 0.6 * diveFlash)}, ${rgba(PAL.structure, 0.25 * diveFlash)} 30%, rgba(0,0,0,0) 65%)`, mixBlendMode: 'screen'}} /> : null}
    </AbsoluteFill>
  );
};
