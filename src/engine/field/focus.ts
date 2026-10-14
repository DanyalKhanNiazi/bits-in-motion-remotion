/**
 * The derived focus track (ENGINE.md §6.1, STYLE_BIBLE §5.3): the light pool's point, in main-view SCREEN px.
 * Priority: a FocusKey override; else the travelling Bit's head; else the Lens centre while a Lens is open; else the
 * anchor of the newest tag, pill, caption or plate name for 45 frames after it lands; else the active plate's centre;
 * else the frame centre. Each new target is approached over DUR.poolFollow frames ('arrive').
 */
import {DUR, FIELD} from '../tokens';
import {EASE6} from '../core/ease';
import {clamp01, lerp, rectCenter} from '../core/math';
import {isPt, type Pt} from '../core/types';
import {cameraAt, project, S0} from '../camera/camera';
import {resolveAnchor} from '../world/states';
import type {WorldSpec} from '../world/types';
import {hopsFor} from '../signal/runs';
import {tagLand} from '../labels/Tag2';
import {pillBox, pillLand} from '../labels/Pill2';
import {readoutLand} from '../labels/Readout2';
import {lensCenter} from '../lens/Lens2';
import {slotRect} from '../panels/peel';
import {stepAt} from '../timeline/track';
import type {Script} from '../timeline/script';
import type {FieldPing} from './opacity';

interface Target {
  id: string;
  at: (f: number) => Pt;
}
interface Seg {
  at: number;
  t: Target;
}

const LABEL_FOCUS = 45;

const buildTargets = (script: Readonly<Script>, world: WorldSpec) => {
  const rails = script.rows.map((r) => ({id: r.id, rail: r.rail}));
  const bits = script.bits.map((b) => ({b, hops: hopsFor(b, world, rails), row: typeof b.scope === 'object' && 'row' in b.scope}));
  const camAt = (f: number) => cameraAt(f, script.camera);
  const labels: Array<{land: number; id: string; at: (f: number) => Pt}> = [];
  for (const t of script.tags) {
    if (t.scope && t.scope !== 'world') continue;
    labels.push({land: tagLand(t), id: `tag:${t.id}`, at: (f) => project(camAt(f), resolveAnchor(world, t.anchor))});
  }
  for (const p of script.pills) {
    labels.push({
      land: pillLand(p),
      id: `pill:${p.id}`,
      at: (f) => {
        const b = pillBox(f, p, camAt(f), world);
        return b ? rectCenter(b) : S0;
      },
    });
  }
  for (const r of script.readouts) labels.push({land: readoutLand(r), id: `readout:${r.id}`, at: () => [r.slot[0] + 60, r.slot[1] + 36]});
  for (const p of script.plates) {
    if (p.caption) labels.push({land: p.caption.at, id: `caption:${p.id}`, at: () => rectCenter(slotRect(p.slot))});
  }
  for (const s of script.splits) {
    for (const b of s.bands) labels.push({land: b.caption.at, id: `band:${b.side}`, at: () => [b.side === 'left' ? 376 : 1544, 540]});
  }
  labels.sort((a, b) => a.land - b.land);

  const targetAt = (f: number): Target => {
    for (const k of script.focus ?? []) {
      const end = k.to ?? k.at + LABEL_FOCUS;
      if (f < k.at || f >= end) continue;
      const tg = k.target;
      if (isPt(tg)) return {id: `key@${k.at}`, at: (g) => project(camAt(g), tg)};
      if (typeof tg === 'string') return {id: `key@${k.at}`, at: (g) => project(camAt(g), resolveAnchor(world, tg))};
      if ('screen' in tg) return {id: `key@${k.at}`, at: () => tg.screen};
      if ('lens' in tg) {
        const l = script.lenses.find((x) => x.id === tg.lens);
        if (l) return {id: `key@${k.at}`, at: () => lensCenter(l, script)};
      }
      if ('bit' in tg) {
        const b = bits.find((x) => x.b.id === tg.bit);
        if (b) return {id: `key@${k.at}`, at: (g) => headOf(b, g)};
      }
    }
    // the travelling Bit (the latest to depart)
    let best: (typeof bits)[number] | null = null;
    let bestDepart = -Infinity;
    for (const b of bits) {
      for (const h of b.hops) {
        if (f >= h.run.depart && f < h.run.land && h.run.depart > bestDepart) {
          best = b;
          bestDepart = h.run.depart;
        }
      }
    }
    if (best) {
      const bb = best;
      return {id: `bit:${bb.b.id}`, at: (g) => headOf(bb, g)};
    }
    for (const l of script.lenses) {
      const end = l.diveAt !== undefined ? l.diveAt + DUR.lensDive : l.closeAt;
      if (f >= l.openAt && f < end) return {id: `lens:${l.id}`, at: () => lensCenter(l, script)};
    }
    let lab: (typeof labels)[number] | null = null;
    for (const x of labels) {
      if (x.land > f) break;
      if (f - x.land < LABEL_FOCUS) lab = x;
    }
    if (lab) return {id: lab.id, at: lab.at};
    for (const p of script.plates) {
      if (!p.active) continue;
      const st = stepAt(f, p.active.map((a) => ({at: a.at, value: a.on})), false);
      if (st.value && f < p.returnAt) {
        const c = rectCenter(slotRect(p.slot));
        return {id: `plate:${p.id}`, at: () => c};
      }
    }
    return {id: 'center', at: () => S0};
  };

  const headOf = (b: (typeof bits)[number], f: number): Pt => {
    let run = b.hops[0]?.run;
    for (const h of b.hops) if (f >= h.run.depart) run = h.run;
    if (!run) return S0;
    const p = run.at(Math.min(f, run.land));
    return b.row ? [p.x, p.y] : project(camAt(f), [p.x, p.y]);
  };

  return targetAt;
};

const CACHE = new WeakMap<object, {segs: Seg[]; starts: Pt[]}>();

const plan = (script: Readonly<Script>, world: WorldSpec): {segs: Seg[]; starts: Pt[]} => {
  const hit = CACHE.get(script);
  if (hit) return hit;
  const targetAt = buildTargets(script, world);
  const last = Math.max(1, Math.ceil(script.lastFrame ?? 1890));
  const segs: Seg[] = [];
  for (let f = 0; f <= last; f++) {
    const t = targetAt(f);
    if (segs.length === 0 || segs[segs.length - 1].t.id !== t.id) segs.push({at: f, t});
  }
  const starts: Pt[] = [];
  segs.forEach((s, k) => {
    if (k === 0) {
      starts.push(s.t.at(s.at));
      return;
    }
    const prev = segs[k - 1];
    const e = EASE6.arrive(clamp01((s.at - prev.at) / DUR.poolFollow));
    const target = prev.t.at(s.at);
    starts.push([lerp(starts[k - 1][0], target[0], e), lerp(starts[k - 1][1], target[1], e)]);
  });
  const out = {segs, starts};
  CACHE.set(script, out);
  return out;
};

/**
 * Round 4, the focus pings (FIELD.ping): every focus segment held by a SUBJECT (a label's anchor, a Lens, an active
 * plate; never a travelling Bit, never the frame centre) sends a soft square ring from that subject `delay` frames after
 * it takes the focus, and again every `period` frames while it keeps it. Returned in main-view screen px with their age;
 * the ring rides with its subject (its centre is the subject's point at this frame).
 */
export const pingsAt = (frame: number, script: Readonly<Script>, world: WorldSpec): FieldPing[] => {
  const {segs} = plan(script, world);
  const P = FIELD.ping;
  const out: FieldPing[] = [];
  const last = Math.max(1, Math.ceil(script.lastFrame ?? 1890));
  for (let k = 0; k < segs.length; k++) {
    const seg = segs[k];
    const end = k + 1 < segs.length ? segs[k + 1].at : last + 1;
    if (seg.at > frame) break;
    if (end + P.frames <= frame - P.period) continue;
    const id = seg.t.id;
    if (id === 'center' || id.startsWith('bit:')) continue;
    if (end - seg.at < P.minHold) continue;
    for (let s = seg.at + P.delay; s < end && s <= frame; s += P.period) {
      const age = frame - s;
      if (age >= P.frames) continue;
      const c = seg.t.at(frame);
      out.push({cx: c[0], cy: c[1], age});
    }
  }
  return out;
};

/** The focus point at a frame, in main-view screen px (eased over DUR.poolFollow). */
export const focusAt = (frame: number, script: Readonly<Script>, world: WorldSpec): Pt => {
  const {segs, starts} = plan(script, world);
  if (segs.length === 0) return S0;
  let lo = 0;
  let hi = segs.length - 1;
  if (frame < segs[0].at) return starts[0];
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segs[mid].at <= frame) lo = mid;
    else hi = mid - 1;
  }
  const s = segs[lo];
  const e = EASE6.arrive(clamp01((frame - s.at) / DUR.poolFollow));
  const target = s.t.at(frame);
  return [lerp(starts[lo][0], target[0], e), lerp(starts[lo][1], target[1], e)];
};
