/**
 * The far layer of the living field (L1, STYLE_BIBLE §5.1): faint orthogonal circuit traces on a 96 px lattice,
 * seeded and generated per 8 × 8-cell chunk (64 cells per SVG path), memoised, so the layer is infinite and
 * deterministic. Traces are short walks along lattice edges (about 22% of edges), with 8 px rounded bends and a
 * small square pad at each end.
 *
 * Round 1: each walk is also kept as a polyline (layer px) so the field can run "current" pulses along it (idle pulses
 * every few seconds, and a wave of pulses outward from every press and landing; LivingField).
 */
import {FIELD} from '../tokens';
import {routePath} from '../../shared/geom';
import {hash01} from '../core/math';
import type {Pt, SRect} from '../core/types';

export const DEEP_CHUNK_CELLS = 8;

export interface DeepWalk {
  /** Lattice points (layer px). */
  pts: Pt[];
  /** The walk's path (rounded bends), the same string the layer draws. */
  d: string;
  /** Polyline length (layer px). */
  length: number;
  /** Stable per-walk random in 0..1 (pulse period and phase). */
  r: number;
  r2: number;
}

interface Chunk {
  d: string;
  walks: DeepWalk[];
}

const CACHE = new Map<string, Chunk>();

const chunk = (seed: string, ci: number, cj: number): Chunk => {
  const key = `${seed}|${ci}|${cj}`;
  const hit = CACHE.get(key);
  if (hit !== undefined) return hit;
  const P = FIELD.deep.pitch;
  const N = DEEP_CHUNK_CELLS;
  // about density × (2 edges per cell) edges in walks of 2–6 edges
  const targetEdges = Math.round(2 * N * N * FIELD.deep.density);
  let edges = 0;
  let wIdx = 0;
  let d = '';
  const walks: DeepWalk[] = [];
  const dirs: Pt[] = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ];
  while (edges < targetEdges && wIdx < 40) {
    const r = (k: number) => hash01(seed, ci, cj, wIdx, k);
    let i = ci * N + Math.floor(r(0) * N);
    let j = cj * N + Math.floor(r(1) * N);
    let dir = Math.floor(r(2) * 4);
    const len = 2 + Math.floor(r(3) * 5);
    const pts: Pt[] = [[i * P, j * P]];
    for (let s = 0; s < len; s++) {
      if (s > 0) {
        const q = r(10 + s);
        if (q < 0.18) dir = (dir + 1) % 4;
        else if (q < 0.36) dir = (dir + 3) % 4;
      }
      i += dirs[dir][0];
      j += dirs[dir][1];
      pts.push([i * P, j * P]);
    }
    edges += len;
    const wd = routePath(pts, 8);
    walks.push({pts, d: wd, length: len * P, r: r(30), r2: r(31)});
    wIdx++;
    d += wd;
    // square pads at both ends (6 px)
    for (const p of [pts[0], pts[pts.length - 1]]) d += `M${p[0] - 3} ${p[1] - 3}h6v6h-6Z`;
  }
  const out = {d, walks};
  if (CACHE.size > 4000) CACHE.clear();
  CACHE.set(key, out);
  return out;
};

/** One chunk's traces (layer px). */
export const deepChunkPath = (seed: string, ci: number, cj: number): string => chunk(seed, ci, cj).d;

/** One chunk's walks (layer px), for the pulses. */
export const deepChunkWalks = (seed: string, ci: number, cj: number): DeepWalk[] => chunk(seed, ci, cj).walks;

/** Chunk index range covering a layer-px rect. */
export const deepChunksFor = (area: SRect): Array<[number, number]> => {
  const span = FIELD.deep.pitch * DEEP_CHUNK_CELLS;
  const out: Array<[number, number]> = [];
  const i0 = Math.floor(area.x / span) - 1;
  const i1 = Math.floor((area.x + area.w) / span) + 1;
  const j0 = Math.floor(area.y / span) - 1;
  const j1 = Math.floor((area.y + area.h) / span) + 1;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) out.push([i, j]);
  return out;
};

/**
 * The far layer's paths over an area (layer px): one SVG path per 64 cells. Generated once per seed and chunk,
 * memoised. Drift is applied by the field in WHOLE pixels (offset = floor(frame / FIELD.deep.stepFrames)).
 */
export const deepCircuitPaths = (seed: string, area: SRect): string[] => deepChunksFor(area).map(([i, j]) => deepChunkPath(seed, i, j));
