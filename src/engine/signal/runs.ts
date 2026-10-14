/**
 * Bit runs (ENGINE.md §8): the kit's bitRun profile on world routes (or a plate row's rail in screen px), with a
 * configurable ease-out, plus the on-screen speed check.
 *
 * Profile: 4-frame ease-in, linear cruise, cubic ease-out over `decel` frames (default 5; the S12 tail uses 2 so the
 * carried Bit still cruises at f1889). Distance = v × (T − accel/2 − 2·decel/3).
 */
import {BIT2} from '../tokens';
import {makeTrack, routePath} from '../../shared/geom';
import {kitWarn, type BitPosition, type BitRun} from '../../shared/motion';
import type {Pt, ViewScope} from '../core/types';
import {cameraAt, project, type CameraTrack} from '../camera/camera';
import type {AnyWorld, RouteSpec} from '../world/types';

export type {BitRun};

export interface BitHop {
  /** A route id of the world, literal world points, or a plate row's rail stops (screen px). */
  route: string | Pt[] | {row: string; from: number; to: number};
  depart: number;
  land: number;
  allowLong?: boolean;
  decel?: number;
  /** Round 1: the part (or a block of it) that receives the Bit. Its outline sends the landing ripple (the receiver
   *  visibly "gets" the signal) and, if it holds the glow, the glow swells. No state change unless an event says so. */
  receiver?: {part: string; block?: string};
  /** Round 2: the Bit lands here without its soft glow (the crisp head stays): a processor in a preview plate must not
   *  read as lit (guardrails red line 1). */
  quiet?: boolean;
}

export interface BitSpec {
  /** 'ff', 's04', 'chain', 'real' */
  id: string;
  /** 'world', or {row: 'chain'} for a plate row (hops then name rail stops: §10.6). */
  scope: ViewScope;
  hops: BitHop[];
  /** DRIVING after the last landing (default false: absorbed). */
  park?: boolean;
  /** Visible and breathing on the first start point from this frame. */
  restFrom?: number;
  /** Round 3: how the Bit is born at `restFrom`. 'plain' (default): the monogram's three pixels fly in small. 'signature':
   *  the brand moment for an episode's first press (BIT2.signature): the logo's three magenta pixels at 3.5× hold, then
   *  slide into the head, turning cyan. */
  birth?: 'plain' | 'signature';
  /** Round 4, the bookend: the first hop departs with the B monogram's three pixels as its trail, magenta at the
   *  signature sizes, shrinking and turning cyan over BIT2.signature.depart frames (Ep01: the real press). */
  trailSignature?: boolean;
  /** Sound gain and receiver reactions (demo/preview: ripple only unless an event says otherwise). */
  kind: 'real' | 'preview' | 'demo';
  /** Fade the parked Bit (S06 return) over 4 frames from here. */
  fadeAt?: number;
}

/** Minimal row shape the runs need (the full PlateRowSpec lives in panels/row.ts). */
export interface RowRail {
  id: string;
  rail: {y: number; stops: number[]};
}

/* ------------------------------------------------------------------------------------------------
 * Route geometry (memoised): the SAME path string draws the route and carries the Bit.
 * ---------------------------------------------------------------------------------------------- */

const GEOM = new WeakMap<object, {d: string; track: ReturnType<typeof makeTrack>}>();
export const routeGeom = (route: RouteSpec): {d: string; track: ReturnType<typeof makeTrack>} => {
  let g = GEOM.get(route);
  if (!g) {
    const d = routePath(route.points, route.bend ?? 8);
    g = {d, track: makeTrack(d)};
    GEOM.set(route, g);
  }
  return g;
};

const outCubicInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The kit's bitRun profile on a world route (WORLD px): 4-frame ease-in, linear cruise, cubic ease-out over
 * `decel` frames. Warns (kitWarn) on runs > 30 frames unless allowLong, hops < 10, speed > 36.
 */
export const atlasRun = (
  route: RouteSpec | Pt[],
  depart: number,
  land?: number,
  opts: {reverse?: boolean; allowLong?: boolean; label?: string; decel?: number; bend?: number} = {},
): BitRun => {
  const d = Array.isArray(route) ? routePath(route, opts.bend ?? 8) : routeGeom(route).d;
  const track = makeTrack(d);
  const L = track.length;
  const a = BIT2.accel;
  const b = Math.max(1, opts.decel ?? BIT2.decel);
  const K = a / 2 + (2 * b) / 3;
  const label = opts.label ?? (Array.isArray(route) ? `run@${depart}` : `${route.id}@${depart}`);
  const warnings: string[] = [];
  let T: number;
  let v: number;
  if (land !== undefined) {
    T = land - depart;
    if (T <= 0) throw new Error(`[engine] atlasRun ${label}: land (${land}) must be after depart (${depart})`);
    v = T > a + b ? L / (T - K) : L / T;
  } else {
    T = Math.max(1, Math.ceil(L / BIT2.cruise + K));
    v = L / (T - K);
  }
  if (T > BIT2.maxRun && !opts.allowLong) warnings.push(`atlasRun ${label}: ${T} frames exceeds the ${BIT2.maxRun}-frame run limit (carry with the camera, or pass allowLong for a documented exception)`);
  if (T < BIT2.minHop) warnings.push(`atlasRun ${label}: ${T} frames is shorter than the ${BIT2.minHop}-frame minimum hop`);
  if (v > BIT2.maxWorld + 1e-6) warnings.push(`atlasRun ${label}: cruise ${v.toFixed(1)} px/frame exceeds ${BIT2.maxWorld} (path ${L.toFixed(0)} px in ${T} frames)`);
  for (const w of warnings) kitWarn(w);

  const sAtT = (t: number): number => {
    if (t <= 0) return 0;
    if (t >= T) return L;
    if (T <= a + b) return L * outCubicInOut(t / T);
    const Da = (v * a) / 2;
    const Dc = v * (T - a - b);
    if (t <= a) return (v * t * t) / (2 * a);
    if (t <= T - b) return Da + v * (t - a);
    const u = (t - (T - b)) / b;
    return Da + Dc + ((v * b) / 3) * (1 - Math.pow(1 - u, 3));
  };
  const sAt = (frame: number): number => {
    const s = sAtT(frame - depart);
    return opts.reverse ? L - s : s;
  };
  const at = (frame: number): BitPosition => {
    const s = sAt(frame);
    const p = track.at(s);
    const phase: BitPosition['phase'] = frame < depart ? 'before' : frame >= depart + T ? 'landed' : 'moving';
    return {x: p.x, y: p.y, s, angle: opts.reverse ? p.angle + Math.PI : p.angle, phase};
  };
  const p0 = track.at(opts.reverse ? L : 0);
  const p1 = track.at(opts.reverse ? 0 : L);
  return {
    label,
    depart,
    land: depart + T,
    frames: T,
    speed: v,
    length: L,
    start: [p0.x, p0.y],
    end: [p1.x, p1.y],
    track,
    reverse: !!opts.reverse,
    warnings,
    sAt,
    at,
  };
};

/* ------------------------------------------------------------------------------------------------
 * Runs of a BitSpec (memoised per spec)
 * ---------------------------------------------------------------------------------------------- */

export interface HopInfo {
  run: BitRun;
  /** 'world' runs are in world px; 'screen' runs (plate rows) are in screen px. */
  space: 'world' | 'screen';
  /** The world route the hop travels (for route light), if any. */
  routeId?: string;
  /** The row the hop crosses (screen space), if any. */
  rowId?: string;
}

const RUNS = new WeakMap<BitSpec, HopInfo[]>();

export const hopsFor = (spec: BitSpec, world: AnyWorld, rows: ReadonlyArray<RowRail> = []): HopInfo[] => {
  const hit = RUNS.get(spec);
  if (hit) return hit;
  const out: HopInfo[] = spec.hops.map((h, i) => {
    const label = `${spec.id}#${i + 1}`;
    if (typeof h.route === 'string') {
      const r = (world.routes ?? []).find((x) => x.id === h.route);
      if (!r) {
        kitWarn(`bit ${spec.id}: unknown route "${h.route}"`);
        return {run: atlasRun([[0, 0], [1, 0]], h.depart, h.land, {label}), space: 'world' as const};
      }
      return {run: atlasRun(r, h.depart, h.land, {allowLong: h.allowLong, decel: h.decel, label}), space: 'world' as const, routeId: r.id};
    }
    if (Array.isArray(h.route)) {
      return {run: atlasRun(h.route, h.depart, h.land, {allowLong: h.allowLong, decel: h.decel, label}), space: 'world' as const};
    }
    const rr = h.route;
    const row = rows.find((x) => x.id === rr.row);
    if (!row) {
      kitWarn(`bit ${spec.id}: unknown row "${rr.row}"`);
      return {run: atlasRun([[0, 0], [1, 0]], h.depart, h.land, {label}), space: 'screen' as const, rowId: rr.row};
    }
    const pts: Pt[] = [
      [row.rail.stops[rr.from], row.rail.y],
      [row.rail.stops[rr.to], row.rail.y],
    ];
    return {run: atlasRun(pts, h.depart, h.land, {allowLong: h.allowLong, decel: h.decel, label}), space: 'screen' as const, rowId: rr.row};
  });
  RUNS.set(spec, out);
  return out;
};

export const runsFor = (spec: BitSpec, world: AnyWorld, rows: ReadonlyArray<RowRail> = []): BitRun[] => hopsFor(spec, world, rows).map((h) => h.run);

/**
 * Screen-speed check: the head's speed relative to the frame (camera motion included) <= BIT2.maxScreen.
 * Sampled at 1/4 frame over every hop.
 */
export const bitScreenSpeedReport = (spec: BitSpec, runs: ReadonlyArray<BitRun>, track: CameraTrack): Array<{hop: number; peak: number}> => {
  const screen = typeof spec.scope === 'object' && 'row' in spec.scope;
  return runs.map((run, i) => {
    let peak = 0;
    const step = 0.25;
    const posAt = (f: number): [number, number] => {
      const p = run.at(f);
      if (screen) return [p.x, p.y];
      const s = project(cameraAt(f, track), [p.x, p.y]);
      return [s[0], s[1]];
    };
    for (let f = run.depart; f < run.land; f += step) {
      const a = posAt(f);
      const b = posAt(f + step);
      peak = Math.max(peak, Math.hypot(b[0] - a[0], b[1] - a[1]) / step);
    }
    if (peak > BIT2.maxScreen + 0.5) kitWarn(`bit ${spec.id} hop ${i + 1}: ${peak.toFixed(1)} px/frame on screen exceeds ${BIT2.maxScreen}`);
    return {hop: i, peak};
  });
};
