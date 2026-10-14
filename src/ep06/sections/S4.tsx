// S4, P08–P09 [5104, 6649): why recovery tools work, and why they fail. Plan: docs/ep06/plans/S4_plan.md.
import React from 'react';
import {Whip, ZoomThrough, toScreen} from '../kit';
import {CUT} from './S4/t';
import {OpenShot} from './S4/Open';
import {HeroShot, SlotShot, heroPose, plateCardCentre} from './S4/StageShots';
import {ArchiveShot} from './S4/ArchiveShot';

const open = (f: number) => <OpenShot f={f} />;
const hero = (f: number) => <HeroShot f={f} />;
const arch = (f: number) => <ArchiveShot f={f} />;
const slot = (f: number) => <SlotShot f={f} />;

export const S4: React.FC<{frame: number}> = ({frame: f}) => {
  if (f < CUT.whip1) return open(f);
  if (f < CUT.whip1 + 12) return <Whip frame={f} at={CUT.whip1} dur={12} dir="left" a={open} b={hero} />;
  if (f < CUT.zt) return hero(f);
  if (f < CUT.zt + 16) {
    const c = plateCardCentre();
    const p = toScreen(heroPose(CUT.zt), c.x, c.y);
    return <ZoomThrough frame={f} at={CUT.zt} dur={16} cx={p.x} cy={p.y} a={hero} b={arch} />;
  }
  if (f < CUT.whip2) return arch(f);
  if (f < CUT.whip2 + 12) return <Whip frame={f} at={CUT.whip2} dur={12} dir="right" a={arch} b={slot} />;
  if (f < CUT.whip3) return slot(f);
  if (f < CUT.whip3 + 12) return <Whip frame={f} at={CUT.whip3} dur={12} dir="left" a={slot} b={arch} />;
  return arch(f);
};
