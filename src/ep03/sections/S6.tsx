/**
 * S6 · P13–P15 · "The experiment and bandwidth" (frames 9507–11907). Mid-film hero: the half-power experiment
 * teased in S1 pays off, then bandwidth (the bridge's width), the RTX 5090, and the three-waits re-hook.
 * Plan: docs/ep03/plans/S6_plan.md. Every timing comes from the word clock (S6/anchors.ts).
 */
import React from 'react';
import {FlashCut, Whip, ZoomThrough, poseAt, propPoint, toScreen} from '../kit';
import {A, CUT} from './S6/anchors';
import {HypoScene, ReadingScene, WritingScene} from './S6/Bridges';
import {CompareScene} from './S6/Compare';
import {DeskScene} from './S6/Desk';
import {DoorsScene} from './S6/Doors';
import {INTRO_DIAL, IntroScene} from './S6/Lanes';
import {PAYOFF_ZOOM_AT, PayoffScene} from './S6/Payoff';
import {ServerScene} from './S6/Server';

const intro = (f: number) => <IntroScene frame={f} />;
const hypo = (f: number) => <HypoScene frame={f} />;
const server = (f: number) => <ServerScene frame={f} />;
const lanes = (f: number) => <PayoffScene frame={f} />;
const verdictSplit = (f: number) => <PayoffScene frame={f} verdict />;
const reading = (f: number) => <ReadingScene frame={f} />;
const writing = (f: number) => <WritingScene frame={f} />;
const compare = (f: number) => <CompareScene frame={f} />;
const desk = (f: number) => <DeskScene frame={f} />;
const doors = (f: number) => <DoorsScene frame={f} />;

/** The dial knob on screen at the zoom-through into the bridge. */
const knob = (() => {
  const w = propPoint('BIM191_T03_gpu-power-limit_c', {x: INTRO_DIAL.x, y: INTRO_DIAL.y, w: INTRO_DIAL.w}, 915, 819);
  return toScreen(poseAt(CUT.intoBridge, [{f: CUT.intoBridge, zoom: 1, x: 960, y: 540}]), w.x, w.y);
})();

export const S6: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(A.from - 30, Math.min(A.to + 30, frame));
  if (f < CUT.intoBridge + 16) return <ZoomThrough frame={f} at={CUT.intoBridge} dur={16} cx={knob.x} cy={knob.y} a={intro} b={hypo} />;
  if (f < CUT.intoServer + 12) return <Whip frame={f} at={CUT.intoServer} dur={12} dir="left" a={hypo} b={server} />;
  if (f < CUT.intoLanes + 12) return <Whip frame={f} at={CUT.intoLanes} dur={12} dir="up" a={server} b={lanes} />;
  if (f < CUT.intoReading + 16) return <ZoomThrough frame={f} at={CUT.intoReading} dur={16} cx={PAYOFF_ZOOM_AT.x} cy={PAYOFF_ZOOM_AT.y} a={lanes} b={reading} />;
  if (f < CUT.intoWriting + 12) return <Whip frame={f} at={CUT.intoWriting} dur={12} dir="left" a={reading} b={writing} />;
  if (f < CUT.intoVerdict + 2) return <FlashCut frame={f} at={CUT.intoVerdict} a={writing} b={verdictSplit} />;
  if (f < CUT.outVerdict + 16) return <ZoomThrough frame={f} at={CUT.outVerdict} dur={16} cx={1420} cy={560} a={verdictSplit} b={writing} />;
  if (f < CUT.intoCard + 12) return <Whip frame={f} at={CUT.intoCard} dur={12} dir="right" a={writing} b={compare} />;
  if (f < CUT.intoDesk + 16) return <ZoomThrough frame={f} at={CUT.intoDesk} dur={16} cx={1060} cy={790} a={compare} b={desk} />;
  if (f < CUT.intoDoors + 16) return <ZoomThrough frame={f} at={CUT.intoDoors} dur={16} cx={960} cy={500} a={desk} b={doors} />;
  return doors(f);
};
