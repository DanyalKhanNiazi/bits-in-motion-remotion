/**
 * S1, P01–P02 (frames 0–1582): the cold open. The race (read in a blink, write in seconds, ×200), the reason (each
 * piece depends on the ones before it; ≈16 GB hauled for ONE piece, twice, escalating), the title question on 11
 * tiles, and the experiment tease with its outcome hidden. Every timing comes from the word clock (S1/anchors.ts).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FlashCut, LensDive, PAL, Whip} from '../kit';
import {T} from './S1/anchors';
import {Eyelids} from './S1/Eyelids';
import {SceneTest} from './S1/SceneTest';
import {SceneDesk} from './S1/SceneDesk';
import {SceneRace} from './S1/SceneRace';
import {SceneMacro, ghostScreen} from './S1/SceneMacro';
import {SceneHaul} from './S1/SceneHaul';
import {SceneMonument} from './S1/SceneMonument';
import {SceneQuestion} from './S1/SceneQuestion';

const test = (f: number) => <SceneTest frame={f} />;
const desk = (f: number) => (
  <>
    <SceneDesk frame={f} />
    <Eyelids frame={f} close={T.blinkClose} shut={T.blinkShut} open={T.blinkOpen} />
  </>
);
const race = (f: number) => <SceneRace frame={f} />;
const macro = (f: number) => <SceneMacro frame={f} />;
const haul = (f: number) => <SceneHaul frame={f} />;
const monument = (f: number) => <SceneMonument frame={f} />;
const question = (f: number) => <SceneQuestion frame={f} />;

const DIVE = {open: 10, hold: 10, dive: 16};

export const S1: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(0, frame);
  let node: React.ReactNode;
  if (f < T.toDesk + 12) node = <Whip frame={f} at={T.toDesk} dur={12} dir="left" a={test} b={desk} />;
  else if (f < T.toRace + 12) node = <Whip frame={f} at={T.toRace} dur={12} dir="up" a={desk} b={race} />;
  else if (f < T.toStream + 12) node = <Whip frame={f} at={T.toStream} dur={12} dir="down" a={race} b={macro} />;
  else if (f < T.dive + DIVE.open + DIVE.hold + DIVE.dive) {
    const g = ghostScreen(T.dive);
    node = <LensDive frame={f} at={T.dive} cx={g.x} cy={g.y} r={200} {...DIVE} outer={macro} inner={haul} ring={PAL.info} />;
  } else if (f < T.toQuestion) node = <FlashCut frame={f} at={T.toMonument} a={haul} b={monument} strength={0.55} />;
  else node = <Whip frame={f} at={T.toQuestion} dur={12} dir="down" a={monument} b={question} />;
  return <AbsoluteFill style={{background: PAL.void}}>{node}</AbsoluteFill>;
};
