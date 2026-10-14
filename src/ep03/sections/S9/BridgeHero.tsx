/**
 * S9 shot 4 (P22): "for a single conversation on a GPU, most of the wait between them isn't the math, it's the trip."
 * The Bridge: crates crawl across while the math units wait (coral breathing, pause mark); each arrival is a single
 * bright blink of math. Then one huge crate thunders across and hits the die on "trip".
 */
import React from 'react';
import {Bridge, Footnote, KineticText, Label, Stage, bridgeAnchors, type BridgeProps, type Cam3, type Key} from '../../kit';
import {A} from './anchors';

const P = 24;
const TRAVEL = 42;
/** phase chosen so that one crate lands exactly on the spoken "math" */
const FLOW_FROM = A.math - TRAVEL - 6 * P;
const FLOW_UNTIL = A.math - TRAVEL + 2;
const HERO_DUR = 40;
const HERO_AT = A.trip - HERO_DUR;
const HERO_HIT = HERO_AT + HERO_DUR;
const ARRIVALS: number[] = [];
for (let s = FLOW_FROM; s <= FLOW_UNTIL; s += P) ARRIVALS.push(s + TRAVEL);

const mathTrack = (): Key[] => {
  const k: Key[] = [[A.and - 60, 0.06]];
  for (const a of ARRIVALS) k.push([a - 1, 0.06], [a + 1, 1], [a + 11, 0.06]);
  k.push([HERO_HIT - 1, 0.06], [HERO_HIT + 1, 1], [HERO_HIT + 30, 0.55]);
  return k;
};
const idleTrack = (): Key[] => {
  const k: Key[] = [[A.and - 60, 0.22]];
  for (const a of ARRIVALS) {
    const base = a < A.most - 10 ? 0.22 : 0.62;
    k.push([a - 1, base], [a + 1, 0], [a + 14, base]);
  }
  k.push([HERO_HIT - 1, 0.62], [HERO_HIT + 1, 0], [HERO_HIT + 40, 0]);
  return k.sort((p, q) => p[0] - q[0]);
};

const CAM_MID: Cam3 = {tx: 0.4, ty: 2.85, tz: 0, yaw: 3, pitch: 14, dist: 20.5, fov: 30};
const CAM_DIE: Cam3 = {tx: 3.9, ty: 3.0, tz: 0.8, yaw: 11, pitch: 9, dist: 13.4, fov: 30};
const CAM_HERO: Cam3 = {tx: 1.3, ty: 2.95, tz: 0.5, yaw: 30, pitch: 13, dist: 11.4, fov: 30};
const CAM_HERO2: Cam3 = {tx: 2.2, ty: 3.0, tz: 0.6, yaw: 26, pitch: 12, dist: 10.2, fov: 30};

export const B4: Omit<BridgeProps, 'frame'> = {
  view: 'side',
  cam: [
    {f: A.and - 10, cam: 'wide'},
    {f: A.most, cam: CAM_MID},
    {f: A.math + 2, cam: CAM_DIE, dur: 46},
    {f: A.trip + 4, cam: CAM_HERO, dur: 30},
    {f: A.trip + 44, cam: CAM_HERO2, dur: 40, ease: (t: number) => t},
  ],
  bandwidth: 0.72,
  crateRate: 30 / P,
  travel: TRAVEL,
  flowFrom: FLOW_FROM,
  flowUntil: FLOW_UNTIL,
  mathActivity: mathTrack(),
  idle: idleTrack(),
  heroCrate: {at: HERO_AT, dur: HERO_DUR, scale: 2.75},
};

export const BridgeHeroShot: React.FC<{frame: number}> = ({frame: f}) => {
  const an = bridgeAnchors(B4, f);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      shake={[{at: HERO_HIT, strength: 1.1}]}
      hud={
        <>
          <Footnote frame={f} at={A.single} exitAt={A.trip + 30} text="A single conversation, on a GPU" size={40} screen />
          <Label frame={f} at={A.math} exitAt={A.itsTheTrip + 2} text="The math" size={56} side="left" x={an.die.x - 330} y={an.die.y - 420} to={an.die} />
          <KineticText frame={f} at={A.itsTheTrip} text="It's the trip." mode="pop" stagger={7} size={128} x={960} y={172} />
        </>
      }
    >
      <Bridge frame={f} {...B4} />
    </Stage>
  );
};

export const HERO_IMPACT = HERO_HIT;
