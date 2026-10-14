/**
 * S5 · P10–P12 "Weights and the bridge" (the film's centrepiece). Absolute frames; every timing comes from at().
 * Shots live in ./S5/p10, p11, p12; this file only sequences them with motivated transitions.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FlashCut, PAL, Whip, ZoomThrough, clamp} from '../kit';
import {A, B, C, FROM, TO} from './S5/anchors';
import {shBits, shBots, shCallback, shWeights} from './S5/p10';
import {shGpu, shLayers, shMacro, shReveal, shToken} from './S5/p11';
import {shClocks, shExit, shFast, shH100, shWait} from './S5/p12';

type Render = (f: number) => React.ReactNode;
type Dir = 'left' | 'right' | 'up' | 'down';
type Cut = {at: number; dur: number; kind: 'whip' | 'zoom' | 'flash'; dir?: Dir; cx?: number; cy?: number};

const SHOTS: Render[] = [shWeights, shBots, shBits, shCallback, shGpu, shMacro, shReveal, shLayers, shToken, shH100, shFast, shClocks, shWait, shExit];
const CUTS: Cut[] = [
  {at: A.companies - 10, dur: 12, kind: 'whip', dir: 'left'},
  {at: A.each - 14, dur: 16, kind: 'zoom', cx: 960, cy: 560},
  {at: A.our16, dur: 10, kind: 'flash'},
  {at: B.on - 4, dur: 12, kind: 'whip', dir: 'left'},
  {at: B.farTooBig - 16, dur: 18, kind: 'zoom', cx: 960, cy: 545},
  {at: B.picture - 2, dur: 16, kind: 'zoom', cx: 960, cy: 545},
  {at: B.model - 4, dur: 12, kind: 'whip', dir: 'up'},
  {at: B.so2 - 6, dur: 12, kind: 'whip', dir: 'left'},
  {at: C.on - 8, dur: 12, kind: 'whip', dir: 'left'},
  {at: C.bridge - 12, dur: 16, kind: 'zoom', cx: 960, cy: 545},
  {at: C.onPaper - 8, dur: 12, kind: 'whip', dir: 'left'},
  {at: C.so - 6, dur: 16, kind: 'zoom', cx: 560, cy: 590},
  {at: TO - 18, dur: 22, kind: 'whip', dir: 'left'},
];
const win = (c: Cut): [number, number] => (c.kind === 'flash' ? [c.at - 3, c.at + c.dur] : [c.at, c.at + c.dur]);

export const S5: React.FC<{frame: number}> = ({frame}) => {
  const f = clamp(frame, FROM - 30, TO + 30);
  let i = 0;
  while (i < CUTS.length && f >= win(CUTS[i])[1]) i++;
  let node: React.ReactNode;
  if (i >= CUTS.length) node = SHOTS[SHOTS.length - 1](f);
  else {
    const c = CUTS[i];
    const [w0] = win(c);
    const a = SHOTS[i];
    const b = SHOTS[i + 1];
    if (f < w0) node = a(f);
    else if (c.kind === 'whip') node = <Whip frame={f} at={c.at} dur={c.dur} dir={c.dir} a={a} b={b} />;
    else if (c.kind === 'zoom') node = <ZoomThrough frame={f} at={c.at} dur={c.dur} cx={c.cx} cy={c.cy} a={a} b={b} />;
    else node = <FlashCut frame={f} at={c.at} a={a} b={b} strength={0.7} />;
  }
  return <AbsoluteFill style={{background: PAL.void}}>{node}</AbsoluteFill>;
};
