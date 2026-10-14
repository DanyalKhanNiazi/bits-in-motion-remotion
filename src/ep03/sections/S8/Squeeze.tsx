// S8 shot C: less to carry across; squeezing too hard costs accuracy. Bridge close on the crates, lever A in front.
import React from 'react';
import {Bridge, EASE, KineticText, PAL, SANS, Stage, clamp01, mixHex, nz, prog, rgba, springAt, type BridgeProps, type Cam3} from '../../kit';
import {W} from './T';
import {Lever} from './Lever';
import {NOTCH} from './Levers';

const c3 = (tx: number, ty: number, tz: number, yaw: number, pitch: number, dist: number): Cam3 => ({tx, ty, tz, yaw, pitch, dist, fov: 30});
const CLUNK = {damping: 10, stiffness: 230, mass: 0.6};

/** Lever A angle: 16 → 8 → 4 → coral → crushed → back to 8. */
export const squeezeAngle = (f: number) =>
  NOTCH.b16 +
  (NOTCH.b8 - NOTCH.b16) * springAt(f, W.less - 1, CLUNK) +
  (NOTCH.b4 - NOTCH.b8) * springAt(f, W.carry, CLUNK) +
  (NOTCH.coral + 2 - NOTCH.b4) * springAt(f, W.squeezing + 2, {damping: 14, stiffness: 120, mass: 0.9}) +
  (NOTCH.crush - NOTCH.coral - 2) * springAt(f, W.tooHard + 2, {damping: 6, stiffness: 260, mass: 0.6}) +
  (NOTCH.b8 - NOTCH.crush) * springAt(f, W.nvidia + 40, {damping: 12, stiffness: 160, mass: 0.7});

const scaleAt = (f: number) =>
  1 +
  (0.72 - 1) * springAt(f, W.less + 1, CLUNK) +
  (0.5 - 0.72) * springAt(f, W.carry + 2, CLUNK) +
  (0.36 - 0.5) * springAt(f, W.squeezing + 4, {damping: 14, stiffness: 120, mass: 0.9}) +
  (0.24 - 0.36) * springAt(f, W.tooHard + 4, {damping: 7, stiffness: 240, mass: 0.6}) +
  (0.72 - 0.24) * springAt(f, W.nvidia + 40, {damping: 12, stiffness: 160, mass: 0.7});

const crushed = (f: number) => clamp01(prog(f, W.squeezing + 4, 14) - prog(f, W.nvidia + 40, 10));

export const squeezeBridge = (f: number): BridgeProps => {
  const lbl = f < W.less + 4 ? '16-bit' : f < W.carry + 4 ? '8-bit' : f < W.squeezing + 4 ? '4-bit' : f < W.nvidia + 40 ? undefined : '8-bit';
  return {
    frame: f,
    view: 'threeQuarter',
    cam: [
      {f: W.andThere - 10, cam: c3(0.9, 2.55, 0.9, 27, 17, 11.5)},
      {f: W.nvidia + 10, cam: c3(-0.1, 2.75, 0.6, 35, 15, 9.6)},
    ],
    bandwidth: 0.8,
    crateRate: 2.2,
    travel: 44,
    flowFrom: 15480,
    crateScale: scaleAt(f),
    crateLabel: lbl,
    mathActivity: 0.8,
    highlight: crushed(f) > 0.3 ? 'crates' : null,
    highlightColor: PAL.wait,
    labelColor: PAL.info,
  };
};

export const SqueezeScene: React.FC<{frame: number}> = ({frame: f}) => {
  const B = squeezeBridge(f);
  const ang = squeezeAngle(f);
  const cr = crushed(f);
  const lit = (a: number) => clamp01(1 - Math.abs(ang - a) / 7);
  const jitter = cr * 6 * nz('sq', f / 3);
  // accuracy meter: full at 16/8, a hair lower at 4, falls when crushed, then recovers
  const acc = clamp01(1 - 0.05 * prog(f, W.carry + 2, 10) - 0.6 * cr + 0.02 * cr * nz('acc', f / 2));
  const accC = mixHex(PAL.wait, PAL.info, clamp01((acc - 0.45) / 0.45));
  const meterIn = prog(f, W.though - 6, 10, EASE.out);
  const hud = (
    <>
      <div style={{position: 'absolute', left: 1320, top: 96, width: 500, opacity: meterIn, transform: `translateY(${(1 - meterIn) * -16}px)`}}>
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 60, color: PAL.ink, marginBottom: 12}}>Accuracy</div>
        <div style={{position: 'relative', height: 26, borderRadius: 13, background: rgba('#050A14', 0.9), border: `2px solid ${rgba(PAL.structure, 0.5)}`, overflow: 'hidden'}}>
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${acc * 100}%`, borderRadius: 13, background: accC, boxShadow: `0 0 22px ${rgba(accC, 0.7)}`}} />
        </div>
      </div>
      <KineticText frame={f} at={W.cost} text="Costs accuracy" x={1290} y={300} size={90} mode="slam" color={PAL.wait} accent={PAL.wait} />
    </>
  );
  return (
    <Stage frame={f} env="none" drift={0} hud={hud} shake={[{at: W.tooHard + 3, strength: 0.9}, {at: W.cost + 2, strength: 0.4}]}>
      <Bridge {...B} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, background: `radial-gradient(ellipse 60% 50% at 50% 48%, rgba(0,0,0,0), ${rgba(PAL.wait, 0.18 * cr)})`}} />
      <Lever
        frame={f}
        x={360 + jitter}
        y={760}
        s={1.3}
        angle={ang}
        on={0.55}
        coralFrom={NOTCH.coral - 3}
        coral={prog(f, W.though - 4, 10)}
        flash={Math.max(Math.exp(-Math.max(0, f - W.less) / 6) * (f >= W.less ? 1 : 0), cr * 0.6)}
        notches={[
          {a: NOTCH.b16, label: '16', lit: lit(NOTCH.b16)},
          {a: NOTCH.b8, label: '8', lit: lit(NOTCH.b8)},
          {a: NOTCH.b4, label: '4', lit: lit(NOTCH.b4)},
        ]}
        accent={cr > 0.5 ? PAL.wait : PAL.info}
      />
    </Stage>
  );
};
