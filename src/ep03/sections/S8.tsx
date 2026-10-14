// S8 "The tricks" (P19–P20), frames 15091–17080. Plan: docs/ep03/plans/S8_plan.md.
// Two levers on the Bridge (fewer bytes per token / more tokens per trip), quantised weights (16 → 8 → 4 bits, the
// crates shrink, squeezing too hard costs accuracy), the single-user test (more than 40% faster, not ×2), and
// speculative decoding (draft guesses, one trip checks them all, ✓ ✓ ✓ ✗, keep, add its own; ×2–3, same answer).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Whip, ZoomThrough, bridgeAnchors} from '../kit';
import {W, FROM, TO} from './S8/T';
import {LeversScene, leverBridge} from './S8/Levers';
import {TraysScene} from './S8/Trays';
import {SqueezeScene} from './S8/Squeeze';
import {RaceScene} from './S8/Race';
import {RulerScene} from './S8/Ruler';
import {SpecScene} from './S8/Spec';
import {PayoffScene} from './S8/Payoff';

const levers = (f: number) => <LeversScene frame={f} />;
const trays = (f: number) => <TraysScene frame={f} />;
const squeeze = (f: number) => <SqueezeScene frame={f} />;
const race = (f: number) => <RaceScene frame={f} />;
const ruler = (f: number) => <RulerScene frame={f} />;
const spec = (f: number) => <SpecScene frame={f} />;
const payoff = (f: number) => <PayoffScene frame={f} />;

/** Cut points (each transition starts here). */
export const CUT = {
  ab: W.theFirst - 2,
  bc: W.andThere,
  cd: W.nvidia,
  de: W.another - 8,
  ee: W.andIts - 4,
  ef: W.aSmall - 8,
  fg: W.when - 4,
} as const;

// the dive lands on the bridge deck (where the 8-bit crates are) at the moment of the cut
const DIVE = bridgeAnchors(leverBridge(CUT.ab + 8), CUT.ab + 8).bridge;

export const S8: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(FROM - 30, Math.min(TO + 30, frame));
  let node: React.ReactNode;
  if (f < CUT.bc - 20) node = <ZoomThrough frame={f} at={CUT.ab} dur={16} cx={DIVE.x} cy={DIVE.y} a={levers} b={trays} />;
  else if (f < CUT.cd - 20) node = <Whip frame={f} at={CUT.bc} dur={10} dir="left" a={trays} b={squeeze} />;
  else if (f < CUT.de - 20) node = <Whip frame={f} at={CUT.cd} dur={12} dir="up" a={squeeze} b={race} />;
  else if (f < CUT.ee - 20) node = <Whip frame={f} at={CUT.de} dur={12} dir="right" a={race} b={levers} />;
  else if (f < CUT.ef - 20) node = <Whip frame={f} at={CUT.ee} dur={10} dir="left" a={levers} b={ruler} />;
  else if (f < CUT.fg - 20) node = <Whip frame={f} at={CUT.ef} dur={12} dir="left" a={ruler} b={spec} />;
  else node = <Whip frame={f} at={CUT.fg} dur={12} dir="left" a={spec} b={payoff} />;
  return <AbsoluteFill style={{background: '#070b14'}}>{node}</AbsoluteFill>;
};
