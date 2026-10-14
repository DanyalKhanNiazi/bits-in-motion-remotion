/**
 * S9, P21–P22 [14747, 17023): the passport callback, the advice (a section-local fork: "Want it back" | "Want it gone",
 * seven 3–6 s callbacks, one must-read line at a time), "Delete ≠ Erase", SplitCompare one last time, and the final
 * pull-out to the Wall + Drawer under the "Bits in Motion" lockup. Plan: docs/ep06/plans/S9_plan.md.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FlashCut, Whip, ZoomThrough, clamp, plateToStage} from '../kit';
import {CUT, T} from './S9/t';
import {ForkShot, forkStation} from './S9/Fork';
import {MicrosoftStrip, Tip1, Tip2, Tip3, Tip4, Tip5Desk, Tip5Wall, Tip6, Tip7} from './S9/Tips';
import {DeleteShot, FinalShot, SplitShot} from './S9/Close';

const ZT = 16;
const WH = 12;
const fork1 = (fr: number) => <ForkShot f={fr} visit={1} />;
const fork2 = (fr: number) => <ForkShot f={fr} visit={2} />;
const tip1 = (fr: number) => <Tip1 f={fr} />;
const tip2 = (fr: number) => <Tip2 f={fr} />;
const tip3 = (fr: number) => <Tip3 f={fr} />;
const tip4 = (fr: number) => <Tip4 f={fr} />;
const tip5a = (fr: number) => <Tip5Desk f={fr} />;
const tip5b = (fr: number) => <Tip5Wall f={fr} />;
const tip6 = (fr: number) => <Tip6 f={fr} />;
const tip7 = (fr: number) => <Tip7 f={fr} />;
const del = (fr: number) => <DeleteShot f={fr} />;
const split = (fr: number) => <SplitShot f={fr} />;
const fin = (fr: number) => <FinalShot f={fr} />;

/** the Settings toggle on the desk monitor (screen px), where the archive grows out of */
const toggleOnDesk = (f: number) => plateToStage(f, {from: {s: 1.55, x: 0, y: 176}, to: {s: 1.68, x: 0, y: 196}, start: CUT.wh5, end: CUT.zt5 + 16}, 320 + 758, 98 + 319);

export const S9: React.FC<{frame: number}> = ({frame}) => {
  const f = clamp(frame, T.from - 30, T.to + 30);
  return (
    <AbsoluteFill>
      {shotAt(f)}
      <MicrosoftStrip f={f} />
    </AbsoluteFill>
  );
};

const shotAt = (f: number): React.ReactNode => {
  if (f < CUT.zt1) return fork1(f);
  if (f < CUT.zt1 + ZT) {
    const p = forkStation(CUT.zt1, 1, 'left', 0);
    return <ZoomThrough frame={f} at={CUT.zt1} dur={ZT} cx={p.x} cy={p.y} a={fork1} b={tip1} />;
  }
  if (f < CUT.wh2) return tip1(f);
  if (f < CUT.wh2 + WH) return <Whip frame={f} at={CUT.wh2} dur={WH} dir="left" a={tip1} b={tip2} />;
  if (f < CUT.wh3) return tip2(f);
  if (f < CUT.wh3 + WH) return <Whip frame={f} at={CUT.wh3} dur={WH} dir="left" a={tip2} b={tip3} />;
  if (f < CUT.wh4) return tip3(f);
  if (f < CUT.wh4 + WH) return <Whip frame={f} at={CUT.wh4} dur={WH} dir="down" a={tip3} b={fork2} />;
  if (f < CUT.zt4) return fork2(f);
  if (f < CUT.zt4 + ZT) {
    const p = forkStation(CUT.zt4, 2, 'right', 0);
    return <ZoomThrough frame={f} at={CUT.zt4} dur={ZT} cx={p.x} cy={p.y} a={fork2} b={tip4} />;
  }
  if (f < CUT.wh5) return tip4(f);
  if (f < CUT.wh5 + WH) return <Whip frame={f} at={CUT.wh5} dur={WH} dir="left" a={tip4} b={tip5a} />;
  if (f < CUT.zt5) return tip5a(f);
  if (f < CUT.zt5 + ZT) {
    const p = toggleOnDesk(CUT.zt5);
    return <ZoomThrough frame={f} at={CUT.zt5} dur={ZT} cx={p.x} cy={p.y} a={tip5a} b={tip5b} />;
  }
  if (f < CUT.wh6) return tip5b(f);
  if (f < CUT.wh6 + WH) return <Whip frame={f} at={CUT.wh6} dur={WH} dir="left" a={tip5b} b={tip6} />;
  if (f < CUT.wh7) return tip6(f);
  if (f < CUT.wh7 + WH) return <Whip frame={f} at={CUT.wh7} dur={WH} dir="left" a={tip6} b={tip7} />;
  if (f < CUT.p22 - 2) return tip7(f);
  if (f < CUT.p22 + 10) return <FlashCut frame={f} at={CUT.p22} a={tip7} b={del} />;
  if (f < CUT.split) return del(f);
  if (f < CUT.zt10) return split(f);
  if (f < CUT.zt10 + ZT) return <ZoomThrough frame={f} at={CUT.zt10} dur={ZT} cx={960} cy={500} a={split} b={fin} />;
  return fin(f);
};
