/**
 * Ep06 S1, P01–P02 [0, 1409): the hook (a flash-forward). Plan: docs/ep06/plans/S1_plan.md.
 *   A desk: delete → bin → empty → "Gone."  ·  B DriveDive through the cyan afterimage  ·  C the wall → SIGNATURE
 *   D SplitCompare (compress): May disappear soon after, the drive's sweep, "Gone?", the race tease, one Bit's route
 *   E pull back to the Windows PC  ·  F–H micro-previews  ·  I push into the monitor (handoff to S2)
 */
import React from 'react';
import {DriveDive, FlashCut} from '../kit';
import {T} from './S1/times';
import {DeskHook, DeskPc, EXIT_AT, PullBack, afterimagePoint} from './S1/desk';
import {SplitShot, WallShot} from './S1/archive';
import {CUT_F, CUT_G, CUT_H, PreviewSanitize, PreviewScan, PreviewWrite} from './S1/previews';

const DIVE = T.hardDrive;
const PULL = T.windowsPc - 4;
const PULL_END = PULL + 31;

const split = (fr: number) => <SplitShot f={fr} />;

export const S1: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(T.from - 30, Math.min(T.to + 29, frame));
  if (f < DIVE) return <DeskHook f={f} />;
  if (f < DIVE + 42) return <DriveDive frame={f} at={DIVE} from={afterimagePoint(DIVE)} a={(fr) => <DeskHook f={fr} />} b={(fr) => <WallShot f={fr} />} />;
  if (f < T.onSsd) return <WallShot f={f} />;
  if (f < PULL) return <SplitShot f={f} />;
  if (f < PULL_END) return <PullBack f={f} split={split} />;
  if (f < CUT_F - 2) return <DeskPc f={f} />;
  if (f < CUT_G - 2) return <FlashCut frame={f} at={CUT_F} a={(fr) => <DeskPc f={fr} />} b={(fr) => <PreviewScan f={fr} />} />;
  if (f < CUT_H - 2) return <FlashCut frame={f} at={CUT_G} a={(fr) => <PreviewScan f={fr} />} b={(fr) => <PreviewWrite f={fr} />} />;
  if (f < EXIT_AT - 2) return <FlashCut frame={f} at={CUT_H} a={(fr) => <PreviewWrite f={fr} />} b={(fr) => <PreviewSanitize f={fr} exit={EXIT_AT} />} />;
  return <FlashCut frame={f} at={EXIT_AT} a={(fr) => <PreviewSanitize f={fr} exit={EXIT_AT} />} b={(fr) => <DeskPc f={fr} />} />;
};
