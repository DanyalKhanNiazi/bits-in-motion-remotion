/**
 * S3 · "Scoring, the loop, streaming" (P05–P07, frames 2811–4897). Plan: docs/ep03/plans/S3_plan.md.
 * Scenes: 1 the candidate field + weighted wheel (P05) → whip → the same question twice (reader desk) → whip →
 * 2 THE LOOP on the package macro plate (P06) → zoom through the ring → 3 the reader's desk, live → whip →
 * 4 streaming vs not → zoom into the screen → 5 the big chat panel → exit whip into S4's own opening shot (exact cut).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Whip, ZoomThrough, poseAt, toScreen} from '../kit';
import {A, S3_FROM, S3_TO} from './S3/anchors';
import {scene1} from './S3/scene1';
import {sceneTwice} from './S3/twice';
import {scene2, ringScreenCenter} from './S3/scene2';
import {SCENE4_LEFT_SCREEN, scene3, scene4, scene5} from './S3/scene3';
import {shotA as s4Opening} from './S4/ShotA';

const W1T = A.thatsWhy - 4; // whip: the wheel → the same question asked twice
const W12 = A.p6 - 2; // whip: the chosen tile drops into the loop
const Z23 = A.p7 - 14; // zoom through the ring into the reader's screen
const W34 = A.streaming - 6; // whip to streaming vs not
const Z45 = A.butYou - 8; // zoom into the streaming screen
const W5X = A.p8 - 11; // exit whip into S4's opening shot (the same desk and chat), so the cut continues one picture

export const S3: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(S3_FROM - 30, Math.min(S3_TO + 30, frame));
  let node: React.ReactNode;
  if (f < W1T + 12) node = <Whip frame={f} at={W1T} dur={12} dir="left" a={scene1} b={sceneTwice} />;
  else if (f < W12 + 12) node = <Whip frame={f} at={W12} dur={12} dir="up" a={sceneTwice} b={scene2} />;
  else if (f < Z23 + 20) {
    const c = ringScreenCenter(Z23);
    node = <ZoomThrough frame={f} at={Z23} dur={20} cx={c.x} cy={c.y} a={scene2} b={scene3} />;
  } else if (f < W34 + 12) node = <Whip frame={f} at={W34} dur={12} dir="left" a={scene3} b={scene4} />;
  else if (f < Z45 + 18) {
    const s = toScreen(poseAt(Z45, [{f: 0, zoom: 1.02, x: 960, y: 540}]), SCENE4_LEFT_SCREEN.x, SCENE4_LEFT_SCREEN.y);
    node = <ZoomThrough frame={f} at={Z45} dur={18} cx={s.x} cy={s.y} a={scene4} b={scene5} />;
  } else node = <Whip frame={f} at={W5X} dur={10} dir="up" a={scene5} b={s4Opening} />;
  return <AbsoluteFill style={{background: '#070b14'}}>{node}</AbsoluteFill>;
};
