/**
 * The Bit: a 24 px rounded square in information cyan that travels a real route, lands with a square
 * ripple (24 → 80 px), and either is absorbed into the ripple (default, e.g. no park at f59) or parks
 * and breathes (DRIVING, e.g. the S06 chain parks on "Windows").
 *
 * Usage (inside an <svg> in frame space):
 *   const run = bitRun({path: routePath([[300, 600], [820, 600]]), depart: 472, land: 498});
 *   <Bit runs={run} />
 *   <Bit runs={[hop1, hop2, hop3]} park />      // a chain: waits (breathing) between hops
 */
import React from 'react';
import {BIT} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {squarePath} from '../geom';
import {breatheScale, ripple as rippleAt, type BitRun, type RippleState} from '../motion';

export interface BitDrawState {
  frame: number;
  /** Core centre and scale/opacity (null when the core is not drawn). */
  core: {x: number; y: number; size: number; scale: number; opacity: number} | null;
  /** Trail squares, nearest first. */
  trail: Array<{x: number; y: number; size: number; opacity: number}>;
  /** Active ripples (one per recent landing). */
  ripples: Array<{x: number; y: number} & RippleState>;
  /** 'hidden' | 'resting' (before departure) | 'moving' | 'waiting' (between hops) | 'parked' | 'absorbed' */
  status: 'hidden' | 'resting' | 'moving' | 'waiting' | 'parked' | 'absorbed';
  color: string;
}

export interface BitProps extends KitBaseProps {
  /** One run or a chain of runs in time order (from bitRun()). */
  runs: BitRun | ReadonlyArray<BitRun>;
  /** Short fading trail while moving (default true). */
  trail?: boolean;
  /** Square ripple on every landing (default true). */
  ripple?: boolean;
  /** Stay on the last landing and breathe (DRIVING). Default false: absorbed into the ripple. */
  park?: boolean;
  /** Show the Bit resting (breathing) at the first start point from this frame until it departs. */
  restFrom?: number;
  /** Stepped halo (dark default true; light never: a surface keyline instead). */
  halo?: boolean;
  /** Override colour (e.g. theme.ink over true-colour visuals). */
  color?: string;
  /** Core size (default 24). */
  size?: number;
  /** Replace the drawing entirely; geometry and timing stay the kit's. */
  render?: (s: BitDrawState) => React.ReactNode;
}

/** Compute what the Bit looks like at a frame (exported for custom renderers). */
export const bitState = (
  frame: number,
  runsIn: BitRun | ReadonlyArray<BitRun>,
  o: {trail?: boolean; ripple?: boolean; park?: boolean; restFrom?: number; size?: number; color: string; isDark: boolean},
): BitDrawState => {
  const runs = (Array.isArray(runsIn) ? runsIn : [runsIn]) as BitRun[];
  const size = o.size ?? BIT.size;
  const st: BitDrawState = {frame, core: null, trail: [], ripples: [], status: 'hidden', color: o.color};
  if (runs.length === 0) return st;

  // ripples
  if (o.ripple !== false) {
    for (const r of runs) {
      const rp = rippleAt(frame, r.land);
      if (rp) st.ripples.push({x: r.end[0], y: r.end[1], ...rp});
    }
  }

  const first = runs[0];
  const last = runs[runs.length - 1];
  const trailOp = o.isDark ? BIT.trailOpacityDark : BIT.trailOpacityLight;
  const pushTrail = (run: BitRun, s: number, collapse: number) => {
    if (o.trail === false) return;
    for (let k = 0; k < BIT.trailSizes.length; k++) {
      const back = BIT.trailPitch * (k + 1) * (1 - collapse);
      const ss = run.reverse ? s + back : s - back;
      const travelled = run.reverse ? run.length - ss : ss;
      if (travelled < 0) continue;
      const p = run.track.at(ss);
      st.trail.push({x: p.x, y: p.y, size: BIT.trailSizes[k] * (size / BIT.size), opacity: trailOp[k] * (1 - collapse)});
    }
  };

  if (frame < first.depart) {
    if (o.restFrom !== undefined && frame >= o.restFrom) {
      st.status = 'resting';
      st.core = {x: first.start[0], y: first.start[1], size, scale: breatheScale(frame, o.restFrom), opacity: 1};
    }
    return st;
  }

  // which run are we in?
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    const next = runs[i + 1];
    if (frame >= r.depart && frame < r.land) {
      const pos = r.at(frame);
      st.status = 'moving';
      st.core = {x: pos.x, y: pos.y, size, scale: 1, opacity: 1};
      pushTrail(r, pos.s, 0);
      return st;
    }
    if (frame >= r.land && (!next || frame < next.depart)) {
      const since = frame - r.land;
      const collapse = Math.min(1, since / BIT.trailCollapse);
      if (since < BIT.trailCollapse) pushTrail(r, r.reverse ? 0 : r.length, collapse);
      if (next) {
        st.status = 'waiting';
        st.core = {x: r.end[0], y: r.end[1], size, scale: breatheScale(frame, r.land), opacity: 1};
      } else if (o.park) {
        st.status = 'parked';
        st.core = {x: last.end[0], y: last.end[1], size, scale: breatheScale(frame, last.land), opacity: 1};
      } else if (since < BIT.absorbFrames) {
        st.status = 'absorbed';
        const k = since / BIT.absorbFrames;
        st.core = {x: last.end[0], y: last.end[1], size, scale: 1 - 0.5 * k, opacity: 1 - k};
      } else {
        st.status = 'absorbed';
      }
      return st;
    }
  }
  return st;
};

export const Bit: React.FC<BitProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const color = p.color ?? theme.info;
  const s = bitState(frame, p.runs, {
    trail: p.trail,
    ripple: p.ripple,
    park: p.park,
    restFrom: p.restFrom,
    size: p.size,
    color,
    isDark: theme.isDark,
  });
  if (p.render) return <>{p.render(s)}</>;
  const seed = p.seed ?? 'bit';
  const halo = (p.halo ?? theme.isDark) && theme.isDark;
  const r = (sz: number) => (BIT.radius * sz) / BIT.size;

  return (
    <g>
      {s.trail
        .slice()
        .reverse()
        .map((t, i) => (
          <React.Fragment key={`t${i}`}>
            {skin.fill({d: squarePath(t.x, t.y, t.size, r(t.size)), color, opacity: t.opacity, role: 'trail', seed, frame})}
          </React.Fragment>
        ))}
      {s.core && halo
        ? BIT.halo
            .slice()
            .reverse()
            .map(([hs, ho], i) => {
              const parkedBoost = s.status === 'parked' || s.status === 'waiting' ? (s.core!.scale - 1) / BIT.breatheScale : 0;
              const op = (ho + (hs === 40 ? 0.1 * parkedBoost : 0)) * s.core!.opacity;
              const size = hs * (s.core!.size / BIT.size) * s.core!.scale;
              return (
                <React.Fragment key={`h${i}`}>
                  {skin.fill({d: squarePath(s.core!.x, s.core!.y, size, r(size) * 1.2), color, opacity: op, role: 'halo', seed, frame})}
                </React.Fragment>
              );
            })
        : null}
      {s.core && !theme.isDark
        ? skin.fill({
            d: squarePath(s.core.x, s.core.y, s.core.size * s.core.scale + BIT.keyline * 2, r(s.core.size) + BIT.keyline),
            color: theme.surface,
            opacity: s.core.opacity,
            role: 'plate',
            seed,
            frame,
          })
        : null}
      {s.core
        ? skin.fill({
            d: squarePath(s.core.x, s.core.y, s.core.size * s.core.scale, r(s.core.size * s.core.scale)),
            color,
            opacity: s.core.opacity,
            role: 'bit',
            seed,
            frame,
          })
        : null}
      {s.ripples.map((rp, i) => (
        <React.Fragment key={`r${i}`}>
          {skin.stroke({
            d: squarePath(rp.x, rp.y, rp.size, r(rp.size)),
            color,
            width: rp.stroke,
            opacity: rp.opacity,
            role: 'ripple',
            seed,
            frame,
            join: 'round',
          })}
        </React.Fragment>
      ))}
    </g>
  );
};

/** A standalone landing ripple (e.g. for a landing drawn by a style's own Bit). */
export const LandingRipple: React.FC<KitBaseProps & {x: number; y: number; at: number; color?: string}> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const rp = rippleAt(frame, p.at);
  if (!rp) return null;
  return (
    <>
      {skin.stroke({
        d: squarePath(p.x, p.y, rp.size, (BIT.radius * rp.size) / BIT.size),
        color: p.color ?? theme.info,
        width: rp.stroke,
        opacity: rp.opacity,
        role: 'ripple',
        seed: p.seed ?? 'ripple',
        frame,
        join: 'round',
      })}
    </>
  );
};
