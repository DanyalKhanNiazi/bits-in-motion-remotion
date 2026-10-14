/**
 * Plate rows and the rail (ENGINE.md §10.6, STYLE_BIBLE §9.4): a 4 px `structure` rail through each plate's content
 * plus a 4 px bridge across each 24 px gutter. A chain Bit in scope {row} hops between rail stops in screen px; the
 * plate rules open a 40 px port PLATE.portOpenLead frames before the Bit reaches a plate edge and close
 * PLATE.portCloseLag frames after it leaves (derived here); the bridge lights behind the Bit like any route.
 */
import {PLATE} from '../tokens';
import type {BitRun} from '../signal/runs';
import {slotRect, type PlateSpec} from './peel';

export interface PlateRowSpec {
  /** 'chain' */
  id: string;
  /** PlateSpec ids in narrative order. */
  plates: string[];
  /** Screen y of the rail (SPLIT.row6.railY) and each plate's rail stop x (its content's anchor). `gaps` (optional,
   *  screen px) is the half-width around each stop where the rail is not drawn, so it meets the icon's edges instead
   *  of crossing the icon (0 = through). */
  rail: {y: number; stops: number[]; gaps?: number[]};
}

/** First frame at which a run's x passes `x` (sampled at 1/4 frame), or null. */
const crossFrame = (run: BitRun, x: number): number | null => {
  const dir = run.end[0] >= run.start[0] ? 1 : -1;
  for (let f = run.depart; f <= run.land; f += 0.25) {
    const px = run.at(f).x;
    if ((dir > 0 && px >= x) || (dir < 0 && px <= x)) return f;
  }
  return null;
};

/**
 * Ports for every plate edge a row hop crosses: open = (reaches the edge) − portOpenLead, close = (leaves it) +
 * portCloseLag. Returns plate id → ports.
 */
export const derivePorts = (
  row: PlateRowSpec,
  plates: ReadonlyArray<PlateSpec>,
  hops: ReadonlyArray<{run: BitRun}>,
): Record<string, NonNullable<PlateSpec['ports']>> => {
  const out: Record<string, NonNullable<PlateSpec['ports']>> = {};
  const rects = row.plates.map((id) => {
    const p = plates.find((x) => x.id === id);
    return p ? {id, r: slotRect(p.slot)} : null;
  });
  for (const h of hops) {
    const x0 = h.run.start[0];
    const x1 = h.run.end[0];
    const lo = Math.min(x0, x1);
    const hi = Math.max(x0, x1);
    for (const pr of rects) {
      if (!pr) continue;
      const edges: Array<{side: 'left' | 'right'; x: number}> = [
        {side: 'left', x: pr.r.x},
        {side: 'right', x: pr.r.x + pr.r.w},
      ];
      for (const e of edges) {
        if (e.x <= lo || e.x >= hi) continue;
        const f = crossFrame(h.run, e.x);
        if (f === null) continue;
        (out[pr.id] ??= []).push({
          side: e.side,
          y: row.rail.y,
          open: Math.floor(f) - PLATE.portOpenLead,
          close: Math.ceil(f) + PLATE.portCloseLag,
        });
      }
    }
  }
  return out;
};

/** The rail's drawn x-intervals inside one plate rect (the plate's stop gap removed). */
export const railSpans = (row: PlateRowSpec, plateId: string, x0: number, x1: number): Array<[number, number]> => {
  const i = row.plates.indexOf(plateId);
  const g = i >= 0 ? row.rail.gaps?.[i] ?? 0 : 0;
  if (i < 0 || g <= 0) return [[x0, x1]];
  const s = row.rail.stops[i];
  return [
    [x0, Math.max(x0, s - g)],
    [Math.min(x1, s + g), x1],
  ].filter(([a, b]) => b - a > 0.5) as Array<[number, number]>;
};

/** Remove every plate's stop gap from a screen x-interval (for the rail light behind the Bit). */
export const minusGaps = (row: PlateRowSpec, a: number, b: number): Array<[number, number]> => {
  let out: Array<[number, number]> = [[Math.min(a, b), Math.max(a, b)]];
  row.rail.stops.forEach((s, i) => {
    const g = row.rail.gaps?.[i] ?? 0;
    if (g <= 0) return;
    const next: Array<[number, number]> = [];
    for (const [p, q] of out) {
      if (q <= s - g || p >= s + g) next.push([p, q]);
      else {
        if (p < s - g) next.push([p, s - g]);
        if (q > s + g) next.push([s + g, q]);
      }
    }
    out = next;
  });
  return out;
};
