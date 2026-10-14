/**
 * S4, "Reading vs writing" (P08–P09). Absolute frames; every timing comes from the word clock (S4/T.ts).
 *   A  reader desk → tape-stop → REWIND to 00:00 → Enter      (ZoomThrough into the question)
 *   B  the question block hops over the LOOP ring               (ZoomThrough into the ring)
 *   C  the writing rail: piece 5 waits for piece 4               (Whip down)
 *   D–J the reading world: already there, ONE run side by side, chunk by chunk, the same run picks the first piece,
 *      one token per run, so many runs, the re-hook question   (Whip up)
 *   K  same wait: ≈1,000 tokens read vs 4 tokens written         (Whip left)
 *   L  math ×1000 vs wait ×4, the verdict, push out
 * Plan: docs/ep03/plans/S4_plan.md.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {PAL, Whip, ZoomThrough, clamp, poseAt, toScreen} from '../kit';
import {FROM, TO, X} from './S4/T';
import {DIVE_POINT, shotA} from './S4/ShotA';
import {CAM_B, RING_B, shotB} from './S4/ShotB';
import {shotC} from './S4/ShotC';
import {readWorld} from './S4/ReadWorld';
import {shotK} from './S4/ShotK';
import {shotL} from './S4/ShotL';

const WHIP = 12;

export const S4: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.round(clamp(frame, FROM - 30, TO + 30));
  let node: React.ReactNode;
  if (f < X.diveAt) node = shotA(f);
  else if (f < X.diveAt + X.diveDur) node = <ZoomThrough frame={f} at={X.diveAt} dur={X.diveDur} cx={DIVE_POINT.x} cy={DIVE_POINT.y} a={shotA} b={shotB} />;
  else if (f < X.ringAt) node = shotB(f);
  else if (f < X.ringAt + X.ringDur) {
    const p = toScreen(poseAt(X.ringAt, CAM_B), RING_B.cx, RING_B.cy);
    node = <ZoomThrough frame={f} at={X.ringAt} dur={X.ringDur} cx={p.x} cy={p.y} a={shotB} b={shotC} />;
  } else if (f < X.whip1) node = shotC(f);
  else if (f < X.whip1 + WHIP) node = <Whip frame={f} at={X.whip1} dur={WHIP} dir="down" a={shotC} b={readWorld} />;
  else if (f < X.whip2) node = readWorld(f);
  else if (f < X.whip2 + WHIP) node = <Whip frame={f} at={X.whip2} dur={WHIP} dir="up" a={readWorld} b={shotK} />;
  else if (f < X.whip3) node = shotK(f);
  else if (f < X.whip3 + WHIP) node = <Whip frame={f} at={X.whip3} dur={WHIP} dir="left" a={shotK} b={shotL} />;
  else node = shotL(f);
  return <AbsoluteFill style={{background: PAL.void}}>{node}</AbsoluteFill>;
};
