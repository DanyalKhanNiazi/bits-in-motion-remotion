/**
 * Generic step and eased tracks in absolute frames (ENGINE.md §3).
 */
import {prog, type EaseName} from '../core/ease';
import {lerp} from '../core/math';

export interface Step<T> {
  at: number;
  value: T;
}

const sortedCache = new WeakMap<ReadonlyArray<unknown>, ReadonlyArray<unknown>>();
/** The array sorted by `at` (cached per array; stable). */
export const byAt = <T extends {at: number}>(xs: ReadonlyArray<T>): ReadonlyArray<T> => {
  const hit = sortedCache.get(xs);
  if (hit) return hit as ReadonlyArray<T>;
  let sorted = true;
  for (let i = 1; i < xs.length; i++) if (xs[i].at < xs[i - 1].at) sorted = false;
  const out = sorted ? xs : [...xs].map((x, i) => ({x, i})).sort((a, b) => a.x.at - b.x.at || a.i - b.i).map((e) => e.x);
  sortedCache.set(xs, out);
  return out;
};

/** The value of a step track at a frame: the latest step at or before it (else `initial`). */
export const stepAt = <T>(frame: number, steps: ReadonlyArray<Step<T>>, initial: T): {value: T; since: number; prev: T} => {
  let value = initial;
  let prev = initial;
  let since = Number.NEGATIVE_INFINITY;
  for (const s of byAt(steps)) {
    if (s.at > frame) break;
    prev = value;
    value = s.value;
    since = s.at;
  }
  return {value, since, prev};
};

export interface Key<T> {
  at: number;
  dur: number;
  to: T;
  ease: EaseName;
}

/**
 * A numeric track: starts at `start`; each key eases from the value the track has at the key's start to `to`
 * over [at, at + dur]. Keys may overlap (a later key takes over from wherever the earlier one is).
 */
export const keyedAt = (frame: number, start: number, keys: ReadonlyArray<Key<number>>): number => {
  const ks = byAt(keys);
  // the value each key starts from = the track's value at its start, set by the latest earlier key
  const from: number[] = [];
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    from.push(i === 0 ? start : lerp(from[i - 1], ks[i - 1].to, prog(k.at, ks[i - 1].at, ks[i - 1].dur, ks[i - 1].ease)));
  }
  let v = start;
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    if (k.at > frame) break;
    v = lerp(from[i], k.to, prog(frame, k.at, k.dur, k.ease));
  }
  return v;
};
