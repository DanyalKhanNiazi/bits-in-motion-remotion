/**
 * Skins: how a style draws lines and fills without changing geometry or timing.
 *
 * Every kit component builds its geometry as SVG path strings and hands them to `skin.stroke()` /
 * `skin.fill()`. A skin decides the line quality only:
 *   - cleanSkin       exact vector (default)
 *   - clearLineSkin   even outlines, round joins and caps (Live Panels-like clear line)
 *   - inkSkin()       deterministic nib-ink jitter with ±weight variation (Bench Notebook-like)
 *   - litSkin()       clean, plus the brand's one allowed fake glow (3x width, 20%) on role "active" only
 * Text is never skinned (no glow, outline or shadow on text).
 *
 * Write your own: implement {name, stroke, fill}. Keep the geometry: offsets within a couple of px.
 */
import React from 'react';
import {noise2D, noise3D} from '@remotion/noise';
import {flattenPath, resample, slicePolyline, vertexNormals, trackFromPoints, type Pt} from './geom';
import {boilPhase} from './motion';

export type SkinRole =
  | 'part' // a hardware outline drawn by the style
  | 'active' // the one active part the narration is about (glow candidate on lit skins)
  | 'route' // signal route (structure while idle)
  | 'info' // information marks (lit routes)
  | 'energy' // energy fill inside channel walls
  | 'wall' // channel walls
  | 'leader' // tag leaders
  | 'anchor' // tag anchor squares
  | 'keybar'
  | 'emphasis' // Lens ring, brackets, "?" badge outline
  | 'rim' // the settled (grey) Lens rim
  | 'tick' // Lens ticks
  | 'annotation' // dashed analogy outlines, ≈ chip, visited mark
  | 'glyph' // state glyphs and badges
  | 'alert'
  | 'bit' // the Bit core
  | 'halo' // the Bit's stepped halo squares
  | 'trail'
  | 'ripple'
  | 'plate'
  | 'other';

export interface SkinStrokeArgs {
  /** Geometry (px, frame space). */
  d: string;
  color: string;
  width: number;
  opacity?: number;
  /** Dash array in px (e.g. [12, 8] for analogy outlines). */
  dash?: ReadonlyArray<number>;
  dashOffset?: number;
  /** Draw only the part of the path between these arc lengths (px). Used for draw-on and fill fronts. */
  trim?: readonly [number, number];
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
  role: SkinRole;
  /** Deterministic seed for jittering skins. */
  seed: string;
  /** Current frame (for skins that boil). */
  frame: number;
}

export interface SkinFillArgs {
  d: string;
  color: string;
  opacity?: number;
  role: SkinRole;
  seed: string;
  frame: number;
  fillRule?: 'nonzero' | 'evenodd';
}

export interface Skin {
  name: string;
  stroke: (a: SkinStrokeArgs) => React.ReactNode;
  fill: (a: SkinFillArgs) => React.ReactNode;
}

/* ------------------------------------------------------------------------------------------------
 * Clean (exact vector)
 * ---------------------------------------------------------------------------------------------- */

const totalLength = (d: string): number =>
  flattenPath(d).reduce((acc, p) => acc + trackFromPoints(p.pts).length, 0);

/** Dash attributes that show only [s0, s1] of a path of total length L. */
const trimDash = (L: number, s0: number, s1: number): {strokeDasharray: string; strokeDashoffset: number} => {
  const a = Math.max(0, Math.min(L, s0));
  const b = Math.max(a, Math.min(L, s1));
  return {strokeDasharray: `0 ${a} ${Math.max(0.0001, b - a)} ${L + 10}`, strokeDashoffset: 0};
};

const cleanStroke = (a: SkinStrokeArgs, extra?: Partial<SkinStrokeArgs>): React.ReactNode => {
  const p = {...a, ...extra};
  let dashProps: {strokeDasharray?: string; strokeDashoffset?: number} = {};
  if (p.trim) {
    const L = totalLength(p.d);
    if (p.trim[1] <= p.trim[0] || p.trim[1] <= 0) return null;
    dashProps = trimDash(L, p.trim[0], p.trim[1]);
  } else if (p.dash && p.dash.length > 0) {
    dashProps = {strokeDasharray: p.dash.join(' '), strokeDashoffset: p.dashOffset ?? 0};
  }
  return (
    <path
      d={p.d}
      fill="none"
      stroke={p.color}
      strokeWidth={p.width}
      strokeOpacity={p.opacity ?? 1}
      strokeLinecap={p.cap ?? 'butt'}
      strokeLinejoin={p.join ?? 'miter'}
      strokeMiterlimit={4}
      {...dashProps}
    />
  );
};

const cleanFill = (a: SkinFillArgs): React.ReactNode => (
  <path d={a.d} fill={a.color} fillOpacity={a.opacity ?? 1} fillRule={a.fillRule ?? 'nonzero'} />
);

export const cleanSkin: Skin = {
  name: 'clean',
  stroke: (a) => cleanStroke(a),
  fill: cleanFill,
};

/* ------------------------------------------------------------------------------------------------
 * Clear line (even outlines, round joins/caps)
 * ---------------------------------------------------------------------------------------------- */

export const clearLineSkin: Skin = {
  name: 'clearLine',
  stroke: (a) => cleanStroke(a, {join: 'round', cap: a.cap ?? 'round'}),
  fill: cleanFill,
};

/* ------------------------------------------------------------------------------------------------
 * Lit (dark styles): clean + the one allowed fake glow on role "active"
 * ---------------------------------------------------------------------------------------------- */

export interface LitSkinOptions {
  /** Roles that glow. Brand budget: the guide Bit's halo (drawn by <Bit/>) and ONE active part. */
  glowRoles?: ReadonlyArray<SkinRole>;
  /** Glow = a second outline at this multiple of the width, at this opacity (never blur). */
  glowWidth?: number;
  glowOpacity?: number;
}

export const litSkin = (o: LitSkinOptions = {}): Skin => {
  const roles = new Set<SkinRole>(o.glowRoles ?? ['active']);
  const gw = o.glowWidth ?? 3;
  const go = o.glowOpacity ?? 0.2;
  return {
    name: 'lit',
    stroke: (a) =>
      roles.has(a.role) ? (
        <>
          {cleanStroke(a, {width: a.width * gw, opacity: (a.opacity ?? 1) * go, join: 'round', cap: 'round'})}
          {cleanStroke(a)}
        </>
      ) : (
        cleanStroke(a)
      ),
    fill: cleanFill,
  };
};

/* ------------------------------------------------------------------------------------------------
 * Ink (deterministic nib jitter + weight variation, drawn as filled outlines)
 * ---------------------------------------------------------------------------------------------- */

export interface InkSkinOptions {
  /** Centre-line wander (px). Default 1.1. Keep small: geometry must not change. */
  amp?: number;
  /** Wavelength of the wander along the line (px). Default 70. */
  wavelength?: number;
  /** Width variation (± fraction). Brand: ±25%, never below the stroke minimums. Default 0.25. */
  weightVar?: number;
  /** Never thinner than this (px). Default 2. */
  minWidth?: number;
  /** Re-jitter every N frames (0 = static, the default: nothing moves without a reason). */
  boilEvery?: number;
  /** Extra seed salt so two styles don't share the same wobble. */
  salt?: string;
  /** Roles drawn clean (e.g. the Bit, ripples). Default: bit, halo, trail, ripple. */
  cleanRoles?: ReadonlyArray<SkinRole>;
}

const fmt = (n: number): string => (Math.round(n * 10) / 10).toString();

const polyD = (pts: ReadonlyArray<Pt>, closed: boolean): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p[0])} ${fmt(p[1])}`).join('') + (closed ? 'Z' : '');

export const inkSkin = (o: InkSkinOptions = {}): Skin => {
  const amp = o.amp ?? 1.1;
  const wl = o.wavelength ?? 70;
  const wv = o.weightVar ?? 0.25;
  const minW = o.minWidth ?? 2;
  const salt = o.salt ?? 'ink';
  const clean = new Set<SkinRole>(o.cleanRoles ?? ['bit', 'halo', 'trail', 'ripple', 'plate']);

  /** Smooth noise along a line; periodic around closed shapes so there is no seam. */
  const lineNoise = (key: string, s: number, L: number, closed: boolean, phase: number, wavelength: number): number => {
    if (!closed || L <= 0) return noise2D(key, s / wavelength, phase);
    const R = L / (2 * Math.PI * wavelength);
    const th = (2 * Math.PI * s) / L;
    return noise3D(key, R * Math.cos(th), R * Math.sin(th), phase);
  };

  const arcLengths = (pts: ReadonlyArray<Pt>): {s: number[]; L: number} => {
    const s = [0];
    for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return {s, L: s[s.length - 1] ?? 0};
  };

  const wobble = (pts: ReadonlyArray<Pt>, closed: boolean, seed: string, phase: number, a: number): Pt[] => {
    const ns = vertexNormals(pts, closed);
    const {s} = arcLengths(closed ? [...pts, pts[0]] : pts);
    const L = s[s.length - 1] ?? 0;
    return pts.map((p, i) => {
      const k = lineNoise(`${salt}:${seed}:c`, s[i], L, closed, phase, wl) * a;
      return [p[0] + ns[i][0] * k, p[1] + ns[i][1] * k] as Pt;
    });
  };

  const stroke = (a: SkinStrokeArgs): React.ReactNode => {
    if (clean.has(a.role)) return cleanStroke(a);
    const phase = boilPhase(a.frame, o.boilEvery ?? 0);
    const polys = flattenPath(a.d);
    const out: React.ReactNode[] = [];
    polys.forEach((poly, pi) => {
      let pts: Pt[] = poly.pts;
      let closed = poly.closed;
      if (a.trim) {
        if (a.trim[1] <= a.trim[0]) return;
        pts = slicePolyline(closed ? [...pts, pts[0]] : pts, a.trim[0], a.trim[1]);
        closed = false;
      }
      const L = trackFromPoints(closed ? [...pts, pts[0]] : pts).length;
      if (L < 0.5) return;
      const spacing = Math.max(2, Math.min(6, L / 8));
      const rs = resample(pts, spacing, closed);
      if (rs.length < 2) return;
      const seed = `${a.seed}:${pi}`;
      // small marks (pips, badge glyphs) wobble less, so they keep their shape
      const centre = wobble(rs, closed, seed, phase, amp * Math.min(1, Math.max(0.25, L / 160)));
      if (a.dash && a.dash.length > 0) {
        out.push(
          <path
            key={pi}
            d={polyD(centre, closed)}
            fill="none"
            stroke={a.color}
            strokeOpacity={a.opacity ?? 1}
            strokeWidth={a.width}
            strokeDasharray={a.dash.join(' ')}
            strokeDashoffset={a.dashOffset ?? 0}
            strokeLinecap={a.cap ?? 'butt'}
            strokeLinejoin="round"
          />,
        );
        return;
      }
      // variable-width outline
      const ns = vertexNormals(centre, closed);
      const al = arcLengths(closed ? [...centre, centre[0]] : centre);
      const half = centre.map((_, i) => {
        const w = Math.max(minW, a.width * (1 + wv * lineNoise(`${salt}:${seed}:w`, al.s[i], al.L, closed, phase, wl * 1.6)));
        return (w / 2) * ns[i][2];
      });
      const left = centre.map((p, i) => [p[0] + ns[i][0] * half[i], p[1] + ns[i][1] * half[i]] as Pt);
      const right = centre.map((p, i) => [p[0] - ns[i][0] * half[i], p[1] - ns[i][1] * half[i]] as Pt);
      let d: string;
      if (closed) {
        d = polyD(left, true) + polyD([...right].reverse(), true);
      } else {
        const capPts = (c: Pt, n: [number, number, number], r: number, startAngle: number): Pt[] => {
          const res: Pt[] = [];
          const base = Math.atan2(n[1], n[0]);
          for (let k = 1; k < 6; k++) {
            const ang = base + startAngle + (Math.PI * k) / 6;
            res.push([c[0] + Math.cos(ang) * r, c[1] + Math.sin(ang) * r]);
          }
          return res;
        };
        const round = (a.cap ?? 'butt') !== 'butt';
        const end = centre.length - 1;
        const endCap = round ? capPts(centre[end], ns[end], half[end], Math.PI) : [];
        const startCap = round ? capPts(centre[0], ns[0], half[0], 0) : [];
        // left forward, end cap (left → right), right backward, start cap (right → left)
        d = polyD([...left, ...endCap.reverse(), ...[...right].reverse(), ...startCap.reverse()], true);
      }
      out.push(<path key={pi} d={d} fill={a.color} fillOpacity={a.opacity ?? 1} fillRule="evenodd" />);
    });
    return <>{out}</>;
  };

  const fill = (a: SkinFillArgs): React.ReactNode => {
    if (clean.has(a.role)) return cleanFill(a);
    const phase = boilPhase(a.frame, o.boilEvery ?? 0);
    const polys = flattenPath(a.d);
    const d = polys
      .map((poly, pi) => {
        const L = trackFromPoints(poly.closed ? [...poly.pts, poly.pts[0]] : poly.pts).length;
        const rs = resample(poly.pts, Math.max(0.5, Math.min(5, L / 24)), poly.closed);
        return polyD(wobble(rs, true, `${a.seed}:f${pi}`, phase, amp * 0.6 * Math.min(1, Math.max(0.15, L / 200))), true);
      })
      .join('');
    return <path d={d} fill={a.color} fillOpacity={a.opacity ?? 1} fillRule={a.fillRule ?? 'nonzero'} />;
  };

  return {name: 'ink', stroke, fill};
};

/* ------------------------------------------------------------------------------------------------
 * Convenience components for a style's own drawings (so they share the skin)
 * ---------------------------------------------------------------------------------------------- */

export const SkinStroke: React.FC<{skin: Skin} & SkinStrokeArgs> = ({skin, ...a}) => <>{skin.stroke(a)}</>;
export const SkinFill: React.FC<{skin: Skin} & SkinFillArgs> = ({skin, ...a}) => <>{skin.fill(a)}</>;
