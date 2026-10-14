/**
 * Ep06 S8, P18–P20 [11976, 14747): the strange reversal, what actually erases, encryption. Plan: docs/ep06/plans/S8_plan.md.
 *   A  SSD_STALE layers: "The strange reversal"            B  the coin: destroy / resist; edge-on = the chip
 *   C  verdict on stage: "The drive, not Windows, decides"  D  P19 in the Archive: ask the drive itself → sanitize
 *   E  the key on stage: Encryption, BitLocker             F  the save moment: glyphs from the first frame
 *   G  pulled out → noise; the key destroyed                H  lost · stolen · decommissioned
 *   I  the desk: device encryption in Settings  ·  J  the limit: the key slots in (stage)  ·  I  Windows reads
 *      normally, a recovery tool copies the photo; pull back (handoff to S9)
 */
import React from 'react';
import {FlashCut, Whip, ZoomThrough} from '../kit';
import {CUT, T} from './S8/times';
import {ShotA, ShotB, ShotC, chipScreen} from './S8/coin';
import {ShotD} from './S8/sanitize';
import {ShotE, ShotF, ShotG, ShotJ} from './S8/encrypt';
import {ShotH} from './S8/objects';
import {J_IN, J_OUT, ShotI} from './S8/desk';

const A = (fr: number) => <ShotA f={fr} />;
const B = (fr: number) => <ShotB f={fr} />;
const C = (fr: number) => <ShotC f={fr} />;
const D = (fr: number) => <ShotD f={fr} />;
const E = (fr: number) => <ShotE f={fr} />;
const F = (fr: number) => <ShotF f={fr} />;
const G = (fr: number) => <ShotG f={fr} />;
const H = (fr: number) => <ShotH f={fr} />;
const I = (fr: number) => <ShotI f={fr} />;
const J = (fr: number) => <ShotJ f={fr} />;
const DIVE_PT = chipScreen(CUT.dive);

export const S8: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(T.from - 30, Math.min(T.to + 29, frame));
  if (f < CUT.coin) return A(f);
  if (f < CUT.coin + 12) return <Whip frame={f} at={CUT.coin} dir="left" a={A} b={B} />;
  if (f < CUT.verdict - 2) return B(f);
  if (f < CUT.verdict + 12) return <FlashCut frame={f} at={CUT.verdict} a={B} b={C} color="#FFD9A0" />;
  if (f < CUT.dive) return C(f);
  if (f < CUT.dive + 16) return <ZoomThrough frame={f} at={CUT.dive} cx={DIVE_PT.x} cy={DIVE_PT.y} a={C} b={D} />;
  if (f < CUT.key) return D(f);
  if (f < CUT.key + 12) return <Whip frame={f} at={CUT.key} dir="left" a={D} b={E} />;
  if (f < CUT.save - 2) return E(f);
  if (f < CUT.save + 12) return <FlashCut frame={f} at={CUT.save} a={E} b={F} strength={0.6} />;
  if (f < CUT.pulled) return F(f);
  if (f < CUT.pulled + 12) return <Whip frame={f} at={CUT.pulled} dir="up" a={F} b={G} />;
  if (f < CUT.objects) return G(f);
  if (f < CUT.objects + 12) return <Whip frame={f} at={CUT.objects} dir="left" a={G} b={H} />;
  if (f < CUT.desk) return H(f);
  if (f < CUT.desk + 12) return <Whip frame={f} at={CUT.desk} dir="left" a={H} b={I} />;
  if (f < J_IN) return I(f);
  if (f < J_IN + 12) return <Whip frame={f} at={J_IN} dir="down" a={I} b={J} />;
  if (f < J_OUT - 2) return J(f);
  if (f < J_OUT + 12) return <FlashCut frame={f} at={J_OUT} a={J} b={I} />;
  return I(f);
};
