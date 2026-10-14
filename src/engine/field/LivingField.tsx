/**
 * The living field (ENGINE.md §6, STYLE_BIBLE §5): the background that is alive but never busy.
 *   L0  flat `field`
 *   L1  deep circuit: faint orthogonal traces, parallax 0.25, drifting 1 px every 10 frames (whole pixels)
 *   L2  atlas grid: 4 px square dots at 48 px pitch, parallax 0.6, drifting 1 px every 6 frames (whole pixels);
 *       opacity = base 22% + the light pool on the focus (up to 62%) + square press rings / land ripples + time breaths;
 *       outside the "later" window the dots drop to 40%.
 * Screen space, one <svg>. No gradients, filters or blur; dots grouped into one path per 0.02 opacity bucket.
 */
import React from 'react';
import {ALPHA, COLOR, FIELD, PARALLAX} from '../tokens';
import {layerCam, project, type Cam, type Shot} from '../camera/camera';
import {f2, lerp} from '../core/math';
import type {Pt, SRect} from '../core/types';
import {deepChunkPath, deepChunksFor, deepChunkWalks} from './deepCircuit';
import {bucket, GRID_GAINS, opacityAt, poolBreathAt, prepareReactions, type FieldPing} from './opacity';
import type {FieldEvent} from './types';

export interface LivingFieldProps {
  frame: number;
  cam: Cam;
  /** The reference shot for parallax (ENGINE.md calls it `ref`; React reserves that prop name). */
  refShot: Shot;
  /** SCREEN point from focusAt() (eased over 18 frames, 'arrive'). */
  focus: Pt;
  /** Press and land events are derived from the script automatically. */
  events: ReadonlyArray<FieldEvent>;
  /** The later window, t = 0..1 contracted (dims the grid outside to 40%). */
  window?: {rect: SRect; t: number};
  seed: string;
  /** Debug: render flat `field` only (for foreground still-run measurement). */
  off?: boolean;
  /** Round 4: focus pings (screen px), from focus.ts pingsAt. */
  pings?: ReadonlyArray<FieldPing>;
}

const W = 1920;
const H = 1080;

interface Pulse {
  d: string;
  /** Dash start along the walk (layer px), dash length and the walk's length. */
  s0: number;
  len: number;
  total: number;
  opacity: number;
  width: number;
}

/** Point at arc length s along a lattice polyline (layer px). */
const alongWalk = (pts: ReadonlyArray<Pt>, s: number): Pt => {
  let left = Math.max(0, s);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (left <= l) {
      const u = l > 0 ? left / l : 0;
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    }
    left -= l;
  }
  return pts[pts.length - 1];
};

/**
 * Round 1 (the owner's "the background is very static"): "current" pulses along the deep-circuit walks.
 *  - Idle: each walk carries one pulse per seeded period (110–210 frames), so a few pulses always cross the margins.
 *  - Events: every press and landing sends a wave outward; each walk within `reach` fires a brighter pulse from its
 *    nearer end when the wave front reaches it, so a landing visibly ripples out into the field.
 * Steel blue (`fieldPulse`), never cyan or amber; dimmed outside the "later" window like the grid.
 */
const deepPulses = (
  frame: number,
  seed: string,
  chunks: ReadonlyArray<[number, number]>,
  tx: number,
  ty: number,
  z: number,
  cam: Cam,
  events: ReadonlyArray<FieldEvent>,
  win?: {rect: SRect; t: number},
): Pulse[] => {
  const P = FIELD.deep.pulse;
  const out: Pulse[] = [];
  const toScreen = (p: Pt): Pt => [tx + z * p[0], ty + z * p[1]];
  const onScreen = (p: Pt) => p[0] > -120 && p[0] < W + 120 && p[1] > -120 && p[1] < H + 120;
  const dimAt = (p: Pt): number => {
    if (!win) return 1;
    const r = win.rect;
    const inside = p[0] >= r.x && p[0] <= r.x + r.w && p[1] >= r.y && p[1] <= r.y + r.h;
    return inside ? 1 : lerp(1, ALPHA.outsideWindowGrid, win.t);
  };
  // events that can still be travelling: their screen points
  const evs: Array<{at: number; p: Pt; gain: number}> = [];
  const horizon = P.reach / P.waveSpeed + (6 * FIELD.deep.pitch + P.eventLength) / P.eventSpeed;
  for (const e of events) {
    if (e.kind !== 'press' && e.kind !== 'land') continue;
    if (frame < e.at || frame > e.at + horizon) continue;
    const sp = e.kind === 'land' && e.space === 'screen' ? e.world : project(cam, e.world);
    evs.push({at: e.at, p: sp, gain: e.kind === 'press' ? 1 : 0.85});
  }
  for (const [ci, cj] of chunks) {
    for (const wk of deepChunkWalks(seed, ci, cj)) {
      const a = toScreen(wk.pts[0]);
      const b = toScreen(wk.pts[wk.pts.length - 1]);
      if (!onScreen(a) && !onScreen(b)) continue;
      const L = wk.length;
      // idle pulse (round 3: a long walk stretches its own period instead of going dark, so every walk carries pulses)
      const travel = (L + P.length) / P.speed;
      const period = Math.max(Math.round(P.periodMin + wk.r * (P.periodMax - P.periodMin)), Math.ceil(travel / P.duty));
      {
        const u = (((frame + Math.floor(wk.r2 * period)) % period) + period) % period;
        if (u < travel) {
          const s = u * P.speed;
          const head = toScreen(alongWalk(wk.pts, s));
          const dim = dimAt(head);
          // a soft tail and a bright, wider head (round 3: the head reads at 390 px)
          out.push({d: wk.d, s0: s - P.length, len: P.length, total: L, opacity: P.tailOpacity * P.opacity * dim, width: P.width});
          out.push({d: wk.d, s0: s - P.headLength, len: P.headLength, total: L, opacity: P.opacity * dim, width: P.headWidth});
        }
      }
      // event waves
      for (const ev of evs) {
        const da = Math.hypot(a[0] - ev.p[0], a[1] - ev.p[1]);
        const db = Math.hypot(b[0] - ev.p[0], b[1] - ev.p[1]);
        const d = Math.min(da, db);
        if (d > P.reach) continue;
        const t0 = ev.at + d / P.waveSpeed;
        if (frame < t0) continue;
        const s = (frame - t0) * P.eventSpeed;
        if (s > L + P.eventLength) continue;
        const fwd = da <= db;
        const k = (1 - d / P.reach) * ev.gain;
        const headS = fwd ? s : L - s;
        const head = toScreen(alongWalk(wk.pts, Math.max(0, Math.min(L, headS))));
        const dim = dimAt(head);
        const op = P.eventOpacity * k * dim;
        if (op < 0.02) continue;
        if (fwd) {
          out.push({d: wk.d, s0: s - P.eventLength, len: P.eventLength, total: L, opacity: P.tailOpacity * op, width: P.width});
          out.push({d: wk.d, s0: s - P.headLength, len: P.headLength, total: L, opacity: op, width: P.headWidth});
        } else {
          out.push({d: wk.d, s0: L - s, len: P.eventLength, total: L, opacity: P.tailOpacity * op, width: P.width});
          out.push({d: wk.d, s0: L - s, len: P.headLength, total: L, opacity: op, width: P.headWidth});
        }
      }
    }
  }
  return out;
};

export const LivingField: React.FC<LivingFieldProps> = ({frame, cam, refShot, focus, events, window: win, seed, off, pings}) => {
  const base = <rect x={0} y={0} width={W} height={H} fill={COLOR.field} />;
  if (off) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
        {base}
      </svg>
    );
  }
  const snapPx = !cam.moving;

  // L1: deep circuit
  const c1 = layerCam(cam, PARALLAX.deepCircuit, refShot);
  const z1 = c1.zoom;
  let tx1 = 960 - z1 * c1.center[0] + Math.floor(frame / FIELD.deep.stepFrames);
  let ty1 = 540 - z1 * c1.center[1];
  if (snapPx) {
    tx1 = Math.round(tx1);
    ty1 = Math.round(ty1);
  }
  const chunks = deepChunksFor({x: -tx1 / z1, y: -ty1 / z1, w: W / z1, h: H / z1});
  const deepD = chunks.map(([i, j]) => deepChunkPath(seed, i, j)).join('');
  const pulses = deepPulses(frame, seed, chunks, tx1, ty1, z1, cam, events, win && win.t > 0 ? win : undefined);

  // L2: atlas grid
  const c2 = layerCam(cam, PARALLAX.atlasGrid, refShot);
  const z2 = c2.zoom;
  const pitch = FIELD.grid.pitch * z2;
  const tx2 = 960 - z2 * c2.center[0] + Math.floor(frame / FIELD.grid.stepFrames);
  const ty2 = 540 - z2 * c2.center[1];
  const i0 = Math.floor(-tx2 / pitch) - 1;
  const i1 = Math.ceil((W - tx2) / pitch) + 1;
  const j0 = Math.floor(-ty2 / pitch) - 1;
  const j1 = Math.ceil((H - ty2) / pitch) + 1;
  const reactions = prepareReactions(frame, events, cam, pings);
  const poolK = poolBreathAt(frame);
  const dimOutside = win && win.t > 0 ? lerp(1, ALPHA.outsideWindowGrid, win.t) : 1;
  const buckets = new Map<number, string[]>();
  const half = FIELD.grid.dot / 2;
  for (let j = j0; j <= j1; j++) {
    const sy = Math.round(ty2 + j * pitch);
    if (sy < -half || sy > H + half) continue;
    for (let i = i0; i <= i1; i++) {
      const sx = Math.round(tx2 + i * pitch);
      if (sx < -half || sx > W + half) continue;
      let o = opacityAt([sx, sy], focus, reactions, GRID_GAINS, poolK);
      if (dimOutside < 1 && win) {
        const r = win.rect;
        if (sx < r.x || sx > r.x + r.w || sy < r.y || sy > r.y + r.h) o *= dimOutside;
      }
      const b = bucket(o);
      if (b <= 0) continue;
      let arr = buckets.get(b);
      if (!arr) {
        arr = [];
        buckets.set(b, arr);
      }
      arr.push(`M${sx - half} ${sy - half}h${FIELD.grid.dot}v${FIELD.grid.dot}h${-FIELD.grid.dot}Z`);
    }
  }
  const dots = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([b, parts]) => <path key={b} d={parts.join('')} fill={COLOR.gridDot} fillOpacity={b} shapeRendering="crispEdges" />);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0}}>
      {base}
      <g transform={`translate(${tx1} ${ty1}) scale(${z1})`}>
        <path d={deepD} fill="none" stroke={COLOR.deepTrace} strokeWidth={FIELD.deep.stroke / z1} strokeOpacity={FIELD.deep.opacity} strokeLinejoin="round" />
        {pulses.map((p, i) => (
          <path
            key={i}
            d={p.d}
            fill="none"
            stroke={COLOR.fieldPulse}
            strokeOpacity={p.opacity}
            strokeWidth={p.width / z1}
            strokeLinecap="butt"
            strokeLinejoin="round"
            strokeDasharray={`${f2(p.len)} ${f2(p.total + p.len + 10)}`}
            strokeDashoffset={f2(-p.s0)}
          />
        ))}
      </g>
      {dots}
    </svg>
  );
};
