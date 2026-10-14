/**
 * S2, "Tokens" (P03–P04, frames 1582–2811). Plan: docs/ep03/plans/S2_plan.md.
 *   A  bench set: S1's title tiles are picked up, read as plain words, chopped by the stylus into tokens that click
 *      into the token bench and flip to their IDs           → zoom-through into tile 1
 *   B  the vocabulary drawer: real entries riffle to "Why · 13903", the fixed list      → whip
 *   C  bench set: 10 words + ? → 11 numbers; Meta's Llama, same 11 pieces; every word = one piece → whip
 *   D  Photosynthesis → Photos + ynthesis; the ≈4 characters ≈ ¾ word ruler; dive into the token
 */
import React from 'react';
import {Whip, ZoomThrough, clamp} from '../kit';
import {A, FROM, TO} from './S2/data';
import {BenchScene, useTile0Screen} from './S2/BenchScene';
import {DrawerScene} from './S2/DrawerScene';
import {WordScene} from './S2/WordScene';

const ZT = A.from - 8;
const ZT_DUR = 16;
const WHIP1 = A.with - 6;
const WHIP2 = A.isnt + 2;
const WHIP_DUR = 12;

const bench = (x: number) => <BenchScene frame={x} />;
const drawer = (x: number) => <DrawerScene frame={x} />;
const word = (x: number) => <WordScene frame={x} />;

export const S2: React.FC<{frame: number}> = ({frame}) => {
  const f = clamp(frame, FROM - 30, TO + 30);
  const t0 = useTile0Screen(ZT);
  if (f < ZT) return bench(f);
  if (f < ZT + ZT_DUR) return <ZoomThrough frame={f} at={ZT} dur={ZT_DUR} cx={t0.x} cy={t0.y} a={bench} b={drawer} />;
  if (f < WHIP1) return drawer(f);
  if (f < WHIP1 + WHIP_DUR) return <Whip frame={f} at={WHIP1} dur={WHIP_DUR} dir="right" a={drawer} b={bench} />;
  if (f < WHIP2) return bench(f);
  if (f < WHIP2 + WHIP_DUR) return <Whip frame={f} at={WHIP2} dur={WHIP_DUR} dir="left" a={bench} b={word} />;
  return word(f);
};
