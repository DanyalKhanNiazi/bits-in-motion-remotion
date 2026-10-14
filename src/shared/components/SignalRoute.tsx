/**
 * Signal route (brand spec §5.2): one 4 px line, structure grey while idle. While a Bit travels it, the
 * segment behind the Bit lights in info and decays over 10 frames. A held logic level (only if narrated)
 * is the route lit steady in info.
 *
 * Usage (use the SAME path for the route and the run):
 *   const d = routePath([[300, 506], [480, 506], [480, 590], [775, 590]]);
 *   const run = bitRun({path: d, depart: 472, land: 498});
 *   <SignalRoute path={d} runs={run} />
 *   <Bit runs={run} />
 */
import React from 'react';
import {STROKE} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {pathLength, polyPath, routePath, type Pt} from '../geom';
import {EASE, progress, type BitRun} from '../motion';

export interface SignalRouteProps extends KitBaseProps {
  /** The route: an SVG path or polyline points (8 px rounded bends). */
  path: string | ReadonlyArray<Pt>;
  /** Runs whose Bit lights the route behind it (decaying over `decay` frames). */
  runs?: BitRun | ReadonlyArray<BitRun>;
  decay?: number;
  /** Held logic level: steady info from `from` (4-frame fade in) until `to` (6-frame fade out). */
  held?: {from: number; to?: number};
  width?: number;
  /** Idle colour (default structure) and lit colour (default info). */
  color?: string;
  litColor?: string;
  /** Draw the route on from this frame over `drawFrames` (default 12); omit: always drawn. */
  drawAt?: number;
  drawFrames?: number;
  /** false: draw only the lit parts (no idle line). */
  idle?: boolean;
  role?: 'route' | 'part';
}

export const SignalRoute: React.FC<SignalRouteProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const d = typeof p.path === 'string' ? p.path : routePath(p.path, STROKE.routeBend);
  const L = pathLength(d);
  const width = p.width ?? STROKE.route;
  const lit = p.litColor ?? theme.info;
  const seed = p.seed ?? 'route';
  const decay = p.decay ?? 10;
  if (p.drawAt !== undefined && frame < p.drawAt) return null;
  const draw = p.drawAt !== undefined ? progress(frame, p.drawAt, p.drawFrames ?? 12, EASE.arrive) : 1;
  const runs = p.runs ? ((Array.isArray(p.runs) ? p.runs : [p.runs]) as BitRun[]) : [];
  const segs: React.ReactNode[] = [];
  runs.forEach((r, ri) => {
    if (frame < r.depart || frame > r.land + decay) return;
    const rd = polyPath(r.track.pts);
    const K = 5;
    for (let k = 0; k < K; k++) {
      const s1 = r.sAt(frame - (decay / K) * k);
      const s0 = r.sAt(frame - (decay / K) * (k + 1));
      const a = Math.min(s0, s1);
      const b = Math.max(s0, s1);
      if (b - a < 0.5) continue;
      segs.push(
        <React.Fragment key={`${ri}:${k}`}>
          {skin.stroke({d: rd, color: lit, width, opacity: 1 - k / K, trim: [a, b], role: 'info', seed: `${seed}:lit${ri}`, frame, cap: 'butt', join: 'round'})}
        </React.Fragment>,
      );
    }
  });
  const heldOp = p.held
    ? progress(frame, p.held.from, 4, EASE.arrive) * (p.held.to !== undefined ? 1 - progress(frame, p.held.to, 6, EASE.exit) : 1)
    : 0;
  return (
    <g>
      {p.idle !== false
        ? skin.stroke({
            d,
            color: p.color ?? theme.structure,
            width,
            trim: draw < 1 ? [0, L * draw] : undefined,
            role: p.role ?? 'route',
            seed,
            frame,
            cap: 'butt',
            join: 'round',
          })
        : null}
      {heldOp > 0 ? skin.stroke({d, color: lit, width, opacity: heldOp, role: 'info', seed: `${seed}:held`, frame, cap: 'butt', join: 'round'}) : null}
      {segs}
    </g>
  );
};
