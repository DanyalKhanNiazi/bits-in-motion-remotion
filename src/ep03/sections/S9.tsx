/**
 * S9, P21–P22: the close. The loop keeps turning → back to our question → each piece depends on the ones before it →
 * the Bridge hero ("it's the trip") → the opening race, on the reader's screen → one long pull-back from crates
 * crossing the bridge, out through the reader's screen, to a calm hold and the sign-off.
 * Shots live in ./S9/*; every frame is a pure function of the absolute film frame.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {LensDive, PAL, Whip, ZoomThrough, clamp} from '../kit';
import {A} from './S9/anchors';
import {LoopShot} from './S9/Loop';
import {QuestionShot, answerTileScreen} from './S9/Question';
import {BridgeHeroShot} from './S9/BridgeHero';
import {ReaderShot, caretScreen5} from './S9/Reader';
import {FinaleShot} from './S9/Finale';

/** cut points (absolute frames), all from the word clock */
export const CUTS = {
  whipUp: A.so - 7,
  lens: A.and - 3,
  whipLeft: A.trip + 30,
  dive: A.describes + 4,
} as const;

const loop = (g: number) => <LoopShot frame={g} />;
const question = (g: number) => <QuestionShot frame={g} />;
const bridge = (g: number) => <BridgeHeroShot frame={g} />;
const reader = (g: number) => <ReaderShot frame={g} />;
const finale = (g: number) => <FinaleShot frame={g} />;

export const S9: React.FC<{frame: number}> = ({frame}) => {
  const f = clamp(frame, A.from - 30, A.to + 30);
  let node: React.ReactNode;
  if (f < CUTS.whipUp + 12) node = <Whip frame={f} at={CUTS.whipUp} dur={12} dir="up" a={loop} b={question} />;
  else if (f < CUTS.lens + 44) {
    const c = answerTileScreen(CUTS.lens);
    node = f <= CUTS.lens ? question(f) : <LensDive frame={f} at={CUTS.lens} cx={c.x} cy={c.y} r={200} open={10} hold={14} dive={20} outer={question} inner={bridge} />;
  } else if (f < CUTS.whipLeft + 12) node = <Whip frame={f} at={CUTS.whipLeft} dur={12} dir="left" a={bridge} b={reader} />;
  else if (f < CUTS.dive + 18) {
    const c = caretScreen5(CUTS.dive);
    node = <ZoomThrough frame={f} at={CUTS.dive} dur={18} cx={c.x} cy={c.y} a={reader} b={finale} />;
  } else node = finale(f);
  return <AbsoluteFill style={{background: PAL.void}}>{node}</AbsoluteFill>;
};
