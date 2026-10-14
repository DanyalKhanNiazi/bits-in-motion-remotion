/**
 * S1 shot 6, the haul (inside the package). ONE giant crate stamped ≈16 GB leaves memory on "hauls" and thunders
 * across the bridge, accelerating; the camera tracks it. It hits the math units on "happens" (flash, shake, the
 * math tiles ripple) and one tiny token tile pops out: the next piece.
 */
import React from 'react';
import {Bridge, Footnote, Label, PAL, Stage, TokenTile, bridgeAnchors, type BridgeProps} from '../../kit';
import {EASE, TAU, clamp01, lerp, prog, springAt, SPRING} from '../../kit';
import {A, T} from './anchors';
import {Flash} from './fx';
import {NEXT_WORD} from './SceneMacro';

const HERO_AT = A.hauls + 2;
const HIT = A.happens;

export const HAUL: Omit<BridgeProps, 'frame'> = {
  view: 'threeQuarter',
  cam: [
    {f: T.dive, cam: {tx: -4.4, ty: 3.4, tz: 0.6, yaw: 31, pitch: 10, dist: 8.6, fov: 30}},
    {f: HERO_AT + 8, cam: {tx: -3.5, ty: 3.3, tz: 0.5, yaw: 30, pitch: 8, dist: 7.7, fov: 30}},
    {f: HIT - 4, cam: {tx: 2.4, ty: 3.1, tz: 0.5, yaw: 20, pitch: 6, dist: 8.3, fov: 30}, dur: HIT - 4 - (HERO_AT + 8)},
    {f: T.toMonument + 20, cam: {tx: 4.2, ty: 3.0, tz: 0.9, yaw: 18, pitch: 6, dist: 8.9, fov: 30}},
  ],
  bandwidth: 0.78,
  flowFrom: 1e9,
  heroCrate: {at: HERO_AT, dur: HIT - HERO_AT, scale: 3.0, label: '≈16 GB'},
  mathActivity: [
    [T.dive, 0.22],
    [HIT - 1, 0.25],
    [HIT + 4, 1],
    [HIT + 40, 0.55],
  ],
};

/** the crate rumbles the camera as it accelerates, then the hit */
const RUMBLE = [...Array.from({length: 9}, (_, i) => ({at: HERO_AT + 26 + i * 8, strength: 0.08 + 0.05 * i})), {at: HIT, strength: 1.5}];

export const SceneHaul: React.FC<{frame: number}> = ({frame: f}) => {
  const an = bridgeAnchors(HAUL, f);
  const die = an.die;
  // the tiny tile: pops out of the math units and drops in front of them
  const popAt = HIT + 8;
  const sp = springAt(f, popAt, SPRING.pop);
  const u = prog(f, popAt, 14, EASE.inOut);
  const tx = lerp(die.x - 30, die.x - 430, u);
  const ty = lerp(die.y, die.y + 200, u) - Math.sin(Math.PI * u) * 150;
  const ring = f >= popAt + 14 ? (f - popAt - 14) / 18 : -1;
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      shake={RUMBLE}
      hud={
        <>
          <Label frame={f} at={A.where} text="Where the math happens" x={740} y={150} to={die} size={80} screen />
          <Footnote frame={f} at={A.almost} text="That model, one conversation" size={72} screen />
          <Flash frame={f} at={HIT} x={die.x} y={die.y} r={760} dur={10} />
          {f >= popAt ? (
            <div style={{position: 'absolute', left: tx, top: ty, width: 0, height: 0, transform: `scale(${Math.max(0, sp)})`}}>
              {ring >= 0 && ring < 1 ? (
                <div style={{position: 'absolute', left: -80 - 130 * ring, top: -30 - 50 * ring, width: 160 + 260 * ring, height: 60 + 100 * ring, borderRadius: '50%', border: `3px solid rgba(159,244,255,${0.9 * (1 - ring)})`}} />
              ) : null}
              <TokenTile frame={f} text={NEXT_WORD} x={0} y={0} size={34} newest={1} />
              <div
                style={{
                  position: 'absolute',
                  left: -40,
                  top: -78 + 3 * Math.sin((TAU * f) / 30),
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: `radial-gradient(closest-side, rgba(0,229,255,${0.5 * clamp01(sp)}), rgba(0,229,255,0))`,
                }}
              />
            </div>
          ) : null}
        </>
      }
    >
      <Bridge frame={f} {...HAUL} />
    </Stage>
  );
};
