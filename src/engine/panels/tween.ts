/**
 * Scene tweens (ENGINE.md §10.5, critic change C6): any "stop" (vendor, form factor, generation) is two SceneSpecs.
 * At t (0..1 raw, eased 'move' here): parts with the same id lerp their rect and numeric props (blocks by key) and
 * take `to`'s state and type at t >= 0.5; parts only in `from` fade out over t 0–0.5; parts only in `to` fade in over
 * t 0.5–1 (same-rect swaps, e.g. cpuLga → amdPackage, therefore cross over at the midpoint).
 */
import {EASE6} from '../core/ease';
import {clamp01, lerp} from '../core/math';
import type {PartSpec, SceneSpec} from '../world/types';

const lerpVal = (a: unknown, b: unknown, t: number): unknown => {
  if (typeof a === 'number' && typeof b === 'number') return lerp(a, b, t);
  if (Array.isArray(a) && Array.isArray(b)) {
    const keyed = a.every((x) => x && typeof x === 'object' && 'key' in x) && b.every((x) => x && typeof x === 'object' && 'key' in x);
    if (keyed) {
      const out: unknown[] = [];
      const bm = new Map(b.map((x) => [(x as {key: string}).key, x]));
      for (const x of a) {
        const y = bm.get((x as {key: string}).key);
        if (y) out.push(lerpVal(x, y, t));
        else if (t < 0.5) out.push(x);
      }
      const am = new Set(a.map((x) => (x as {key: string}).key));
      for (const y of b) if (!am.has((y as {key: string}).key) && t >= 0.5) out.push(y);
      return out;
    }
    return t < 0.5 ? a : b;
  }
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) {
    const o: Record<string, unknown> = {};
    for (const k of new Set([...Object.keys(a as object), ...Object.keys(b as object)])) {
      o[k] = lerpVal((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], t);
    }
    return o;
  }
  return t < 0.5 ? (a ?? b) : (b ?? a);
};

const withOpacity = (p: PartSpec, k: number): PartSpec => ({
  ...p,
  props: {...(p.props ?? {}), opacity: (typeof p.props?.opacity === 'number' ? (p.props.opacity as number) : 1) * k},
});

/** Parts only in `from` fade out over t 0–0.6 and parts only in `to` fade in over t 0.4–1: the windows overlap, so a
 *  swap (Intel → AMD package, PSU → battery) never dips through an empty plate (style6 build: with 0–0.5 / 0.5–1 the
 *  laptop plate showed only the two moving blocks for about 4 frames). */
const FADE_OUT_END = 0.6;
const FADE_IN_START = 0.4;

export const tweenScene = (from: SceneSpec, to: SceneSpec, tRaw: number): SceneSpec => {
  const t = EASE6.move(clamp01(tRaw));
  if (t <= 0) return from;
  if (t >= 1) return to;
  const toById = new Map(to.parts.map((p) => [p.id, p]));
  const fromIds = new Set(from.parts.map((p) => p.id));
  const parts: PartSpec[] = [];
  for (const p of from.parts) {
    const q = toById.get(p.id);
    if (q) {
      parts.push({
        ...(t >= 0.5 ? q : p),
        rect: {x: lerp(p.rect.x, q.rect.x, t), y: lerp(p.rect.y, q.rect.y, t), w: lerp(p.rect.w, q.rect.w, t), h: lerp(p.rect.h, q.rect.h, t)},
        props: lerpVal(p.props ?? {}, q.props ?? {}, t) as Record<string, unknown>,
      });
    } else {
      parts.push(withOpacity(p, 1 - clamp01(t / FADE_OUT_END)));
    }
  }
  for (const q of to.parts) if (!fromIds.has(q.id)) parts.push(withOpacity(q, clamp01((t - FADE_IN_START) / (1 - FADE_IN_START))));
  return {
    id: `${from.id}→${to.id}`,
    bounds: {x: lerp(from.bounds.x, to.bounds.x, t), y: lerp(from.bounds.y, to.bounds.y, t), w: lerp(from.bounds.w, to.bounds.w, t), h: lerp(from.bounds.h, to.bounds.h, t)},
    parts,
    routes: t < 0.5 ? from.routes : to.routes,
    channels: t < 0.5 ? from.channels : to.channels,
    domains: t < 0.5 ? from.domains : to.domains,
  };
};
