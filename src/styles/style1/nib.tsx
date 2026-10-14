/**
 * Style 1 nib ink: a variant of the kit's inkSkin (copied here, never edited in src/shared).
 *
 * Differences from the kit skin, per the Bench Notebook proposal (Part 1 §2, "Line treatment"):
 *  - weight variation only ADDS: w(s) = w0 × (1 + 0.25 · n(s)), n in [0, 1] (inactive 3.0–3.75 px,
 *    active 4.0–5.0 px); signal routes are capped at +10%;
 *  - a gentler, longer centre-line wander, so the line reads as a confident pen at 390 px;
 *  - the computed outline is cached per (path, width, seed): the drawing is static, nothing boils.
 *
 * Reveals are masks (never re-jittered geometry): <Wick> (a state flip that spreads both ways round an
 * outline from its cause point), <DryBack> (the reverse) and <Bloom> (outline and fill appear together,
 * every stroke growing from its own start point at once).
 */
import React from 'react';
import {noise2D, noise3D} from '@remotion/noise';
import {
  flattenPath,
  pathLength,
  resample,
  slicePolyline,
  trackFromPoints,
  useSvgId,
  vertexNormals,
  type Pt,
  type Skin,
  type SkinFillArgs,
  type SkinRole,
  type SkinStrokeArgs,
} from '../../shared';
import {EASE, clamp01} from '../../shared';

const SALT = 'bench-notebook';
const AMP = 1.1; // centre-line wander (px)
const WAVELENGTH = 95; // px along the line
const WEIGHT_VAR = 0.25; // only adds
const CLEAN_ROLES = new Set<SkinRole>(['bit', 'halo', 'trail', 'ripple', 'plate', 'leader', 'anchor', 'keybar', 'energy']);

const fmt = (n: number): string => (Math.round(n * 10) / 10).toString();
const polyD = (pts: ReadonlyArray<Pt>, closed: boolean): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${fmt(p[0])} ${fmt(p[1])}`).join('') + (closed ? 'Z' : '');

const lineNoise = (key: string, s: number, L: number, closed: boolean, wavelength: number): number => {
  if (!closed || L <= 0) return noise2D(key, s / wavelength, 0.37);
  const R = L / (2 * Math.PI * wavelength);
  const th = (2 * Math.PI * s) / L;
  return noise3D(key, R * Math.cos(th), R * Math.sin(th), 0.37);
};

const arcLengths = (pts: ReadonlyArray<Pt>): {s: number[]; L: number} => {
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return {s, L: s[s.length - 1] ?? 0};
};

const wobble = (pts: ReadonlyArray<Pt>, closed: boolean, seed: string, a: number): Pt[] => {
  const ns = vertexNormals(pts, closed);
  const {s} = arcLengths(closed ? [...pts, pts[0]] : pts);
  const L = s[s.length - 1] ?? 0;
  return pts.map((p, i) => {
    const k = lineNoise(`${SALT}:${seed}:c`, s[i], L, closed, WAVELENGTH) * a;
    return [p[0] + ns[i][0] * k, p[1] + ns[i][1] * k] as Pt;
  });
};

const OUTLINE_CACHE = new Map<string, string[]>();

/** Variable-width nib outline(s) for a stroke, as filled path data (one per subpath). */
const nibOutlines = (a: SkinStrokeArgs): string[] => {
  const key = `${a.d}|${a.width}|${a.seed}|${a.role}|${a.cap ?? 'butt'}|${a.trim ? a.trim.join(',') : ''}`;
  const hit = OUTLINE_CACHE.get(key);
  if (hit) return hit;
  const out: string[] = [];
  const varCap = a.role === 'route' || a.role === 'info' ? 0.1 : WEIGHT_VAR;
  flattenPath(a.d).forEach((poly, pi) => {
    let pts: Pt[] = poly.pts;
    let closed = poly.closed;
    if (a.trim) {
      if (a.trim[1] <= a.trim[0]) return;
      pts = slicePolyline(closed ? [...pts, pts[0]] : pts, a.trim[0], a.trim[1]);
      closed = false;
    }
    const L = trackFromPoints(closed ? [...pts, pts[0]] : pts).length;
    if (L < 0.5) return;
    const spacing = Math.max(1.5, Math.min(5, L / 10));
    const rs = resample(pts, spacing, closed);
    if (rs.length < 2) return;
    const seed = `${a.seed}:${pi}`;
    const amp = AMP * Math.min(1, Math.max(0.2, L / 180));
    const centre = wobble(rs, closed, seed, amp);
    const ns = vertexNormals(centre, closed);
    const al = arcLengths(closed ? [...centre, centre[0]] : centre);
    const half = centre.map((_, i) => {
      const n01 = 0.5 + 0.5 * lineNoise(`${SALT}:${seed}:w`, al.s[i], al.L, closed, WAVELENGTH * 1.4);
      const w = a.width * (1 + varCap * n01);
      return (w / 2) * ns[i][2];
    });
    const left = centre.map((p, i) => [p[0] + ns[i][0] * half[i], p[1] + ns[i][1] * half[i]] as Pt);
    const right = centre.map((p, i) => [p[0] - ns[i][0] * half[i], p[1] - ns[i][1] * half[i]] as Pt);
    if (closed) {
      out.push(polyD(left, true) + polyD([...right].reverse(), true));
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
      out.push(polyD([...left, ...endCap.reverse(), ...[...right].reverse(), ...startCap.reverse()], true));
    }
  });
  if (OUTLINE_CACHE.size > 6000) OUTLINE_CACHE.clear();
  OUTLINE_CACHE.set(key, out);
  return out;
};

const cleanStroke = (a: SkinStrokeArgs): React.ReactNode => {
  let dashProps: {strokeDasharray?: string; strokeDashoffset?: number} = {};
  if (a.trim) {
    const L = pathLength(a.d);
    if (a.trim[1] <= a.trim[0] || a.trim[1] <= 0) return null;
    const s0 = Math.max(0, Math.min(L, a.trim[0]));
    const s1 = Math.max(s0, Math.min(L, a.trim[1]));
    dashProps = {strokeDasharray: `0 ${s0} ${Math.max(0.0001, s1 - s0)} ${L + 10}`, strokeDashoffset: 0};
  } else if (a.dash && a.dash.length > 0) {
    dashProps = {strokeDasharray: a.dash.join(' '), strokeDashoffset: a.dashOffset ?? 0};
  }
  return (
    <path
      d={a.d}
      fill="none"
      stroke={a.color}
      strokeWidth={a.width}
      strokeOpacity={a.opacity ?? 1}
      strokeLinecap={a.cap ?? 'butt'}
      strokeLinejoin={a.join ?? 'round'}
      strokeMiterlimit={4}
      {...dashProps}
    />
  );
};

const FILL_CACHE = new Map<string, string>();

export const nibSkin: Skin = {
  name: 'nib',
  stroke: (a) => {
    if (CLEAN_ROLES.has(a.role) || (a.dash && a.dash.length > 0)) {
      if (a.dash && a.dash.length > 0 && !CLEAN_ROLES.has(a.role)) {
        // dashed (pencil) line: a gently wandering centre line, dashed by SVG
        const polys = flattenPath(a.d);
        return (
          <>
            {polys.map((poly, pi) => {
              const L = trackFromPoints(poly.closed ? [...poly.pts, poly.pts[0]] : poly.pts).length;
              const rs = resample(poly.pts, Math.max(2, Math.min(6, L / 10)), poly.closed);
              const c = wobble(rs, poly.closed, `${a.seed}:${pi}`, AMP * 0.7 * Math.min(1, L / 180));
              return (
                <path
                  key={pi}
                  d={polyD(c, poly.closed)}
                  fill="none"
                  stroke={a.color}
                  strokeOpacity={a.opacity ?? 1}
                  strokeWidth={a.width}
                  strokeDasharray={(a.dash as number[]).join(' ')}
                  strokeDashoffset={a.dashOffset ?? 0}
                  strokeLinecap={a.cap ?? 'butt'}
                  strokeLinejoin="round"
                />
              );
            })}
          </>
        );
      }
      return cleanStroke(a);
    }
    const outlines = nibOutlines(a);
    return (
      <>
        {outlines.map((d, i) => (
          <path key={i} d={d} fill={a.color} fillOpacity={a.opacity ?? 1} fillRule="evenodd" />
        ))}
      </>
    );
  },
  fill: (a: SkinFillArgs) => {
    if (CLEAN_ROLES.has(a.role)) return <path d={a.d} fill={a.color} fillOpacity={a.opacity ?? 1} fillRule={a.fillRule ?? 'nonzero'} />;
    const key = `${a.d}|${a.seed}`;
    let d = FILL_CACHE.get(key);
    if (!d) {
      d = flattenPath(a.d)
        .map((poly, pi) => {
          const L = trackFromPoints(poly.closed ? [...poly.pts, poly.pts[0]] : poly.pts).length;
          const rs = resample(poly.pts, Math.max(0.5, Math.min(5, L / 24)), poly.closed);
          return polyD(wobble(rs, true, `${a.seed}:f${pi}`, AMP * 0.5 * Math.min(1, Math.max(0.15, L / 200))), true);
        })
        .join('');
      if (FILL_CACHE.size > 4000) FILL_CACHE.clear();
      FILL_CACHE.set(key, d);
    }
    return <path d={d} fill={a.color} fillOpacity={a.opacity ?? 1} fillRule={a.fillRule ?? 'nonzero'} />;
  },
};

/* ------------------------------------------------------------------------------------------------
 * Marks: drawings as data, so the same list can be drawn, ghosted, bloomed or magnified.
 * ---------------------------------------------------------------------------------------------- */

export type Mark =
  | {
      k: 's';
      d: string;
      c: string;
      w: number;
      o?: number;
      dash?: number[];
      dashOffset?: number;
      cap?: 'butt' | 'round' | 'square';
      join?: 'miter' | 'round' | 'bevel';
      role?: SkinRole;
      /** Draw as an exact vector line (no nib). */
      clean?: boolean;
      seed?: string;
    }
  | {k: 'f'; d: string; c: string; o?: number; role?: SkinRole; clean?: boolean; rule?: 'nonzero' | 'evenodd'; seed?: string}
  | {
      k: 't';
      x: number;
      y: number;
      text: string;
      size: number;
      c: string;
      font: string;
      weight?: number;
      anchor?: 'start' | 'middle' | 'end';
      o?: number;
      tracking?: string;
    };

export const S = (d: string, c: string, w: number, extra: Partial<Extract<Mark, {k: 's'}>> = {}): Mark => ({k: 's', d, c, w, ...extra});
export const Fl = (d: string, c: string, extra: Partial<Extract<Mark, {k: 'f'}>> = {}): Mark => ({k: 'f', d, c, ...extra});
export const T = (x: number, y: number, text: string, size: number, c: string, font: string, extra: Partial<Extract<Mark, {k: 't'}>> = {}): Mark => ({
  k: 't',
  x,
  y,
  text,
  size,
  c,
  font,
  ...extra,
});

export const renderMark = (m: Mark, i: number, seed: string, frame: number): React.ReactNode => {
  if (m.k === 't') {
    return (
      <text
        key={i}
        x={m.x}
        y={m.y}
        textAnchor={m.anchor ?? 'start'}
        fill={m.c}
        fillOpacity={m.o ?? 1}
        style={{fontFamily: m.font, fontWeight: m.weight ?? 600, fontSize: m.size, letterSpacing: m.tracking}}
      >
        {m.text}
      </text>
    );
  }
  const sd = m.seed ?? `${seed}:${i}`;
  if (m.k === 'f') {
    if (m.clean) return <path key={i} d={m.d} fill={m.c} fillOpacity={m.o ?? 1} fillRule={m.rule ?? 'nonzero'} />;
    return <React.Fragment key={i}>{nibSkin.fill({d: m.d, color: m.c, opacity: m.o, role: m.role ?? 'part', seed: sd, frame, fillRule: m.rule})}</React.Fragment>;
  }
  if (m.clean) {
    return (
      <React.Fragment key={i}>
        {cleanStroke({d: m.d, color: m.c, width: m.w, opacity: m.o, dash: m.dash, dashOffset: m.dashOffset, cap: m.cap, join: m.join, role: 'other', seed: sd, frame})}
      </React.Fragment>
    );
  }
  return (
    <React.Fragment key={i}>
      {nibSkin.stroke({d: m.d, color: m.c, width: m.w, opacity: m.o, dash: m.dash, dashOffset: m.dashOffset, cap: m.cap, join: m.join, role: m.role ?? 'part', seed: sd, frame})}
    </React.Fragment>
  );
};

/** Draw marks with the nib skin. */
export const Marks: React.FC<{marks: ReadonlyArray<Mark | null | false | undefined>; seed: string; frame: number; opacity?: number}> = ({
  marks,
  seed,
  frame,
  opacity,
}) => (
  <g opacity={opacity ?? 1}>{marks.map((m, i) => (m ? renderMark(m, i, seed, frame) : null))}</g>
);

/* ------------------------------------------------------------------------------------------------
 * Reveals (masks)
 * ---------------------------------------------------------------------------------------------- */

/**
 * Bloom: outline and fill appear together; every stroke grows from its own start point at once
 * (a mask of the same centre lines, normalised dashes), fills and text fade with it.
 * p in 0..1. At p >= 1 the marks are drawn plainly (no mask).
 */
export const Bloom: React.FC<{marks: ReadonlyArray<Mark | null | false | undefined>; p: number; seed: string; frame: number; opacity?: number}> = ({
  marks,
  p,
  seed,
  frame,
  opacity,
}) => {
  const id = useSvgId(`bloom-${seed.replace(/[^a-zA-Z0-9]/g, '')}`);
  if (p <= 0) return null;
  const list = marks.filter(Boolean) as Mark[];
  if (p >= 1) return <Marks marks={list} seed={seed} frame={frame} opacity={opacity} />;
  return (
    <g opacity={opacity ?? 1}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          {list.map((m, i) => {
            if (m.k === 's') {
              return flattenPath(m.d).map((poly, j) => (
                <path
                  key={`${i}:${j}`}
                  d={polyD(poly.pts, poly.closed)}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={m.w + 8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={`${p} 2`}
                />
              ));
            }
            if (m.k === 'f') return <path key={i} d={m.d} fill="#fff" fillOpacity={p} />;
            return null;
          })}
        </mask>
      </defs>
      <g mask={`url(#${id})`}>{list.filter((m) => m.k !== 't').map((m, i) => renderMark(m, i, seed, frame))}</g>
      <g opacity={p}>{list.map((m, i) => (m.k === 't' ? renderMark(m, i, seed, frame) : null))}</g>
    </g>
  );
};

/**
 * Wick: the dash window that shows [c − v/2, c + v/2] of a closed outline of length L (v = L × p),
 * i.e. ink spreading both ways round the outline from the cause point (arc length c), meeting on the
 * far side at p = 1. Children (the inked outline) are drawn through it.
 */
export const WickMask: React.FC<{d: string; cause: number; p: number; width: number; seed: string; children: React.ReactNode}> = ({
  d,
  cause,
  p,
  width,
  seed,
  children,
}) => {
  const id = useSvgId(`wick-${seed.replace(/[^a-zA-Z0-9]/g, '')}`);
  if (p <= 0) return null;
  if (p >= 1) return <>{children}</>;
  const L = pathLength(d);
  const v = L * clamp01(p);
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <path
            d={d}
            fill="none"
            stroke="#fff"
            strokeWidth={width + 10}
            strokeLinecap="butt"
            strokeDasharray={`${v} ${Math.max(0.001, L - v)}`}
            strokeDashoffset={-(cause - v / 2)}
          />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>{children}</g>
    </g>
  );
};

/** Ink-wick progress (0..1) of a flip that starts at `at` and closes at frame 5. Reverse = dry-back. */
export const wickP = (frame: number, at: number, frames = 5): number => EASE.outCubic(clamp01((frame - at) / frames));

/** Point on a rect outline (rectPath starts at the top-left corner going clockwise; r = corner radius). */
export const rectCause = (w: number, h: number, where: 'top' | 'topLeft' | 'right' | 'left' | 'bottom', r = 10): number => {
  const straightW = w - 2 * r;
  const straightH = h - 2 * r;
  const arc = (Math.PI / 2) * r;
  switch (where) {
    case 'topLeft':
      return 0;
    case 'top':
      return straightW / 2;
    case 'right':
      return straightW + arc + straightH / 2;
    case 'bottom':
      return straightW + arc + straightH + arc + straightW / 2;
    case 'left':
      return 2 * straightW + 2 * straightH + 4 * arc - straightH / 2;
    default:
      return 0;
  }
};

/* ------------------------------------------------------------------------------------------------
 * Draughting details
 * ---------------------------------------------------------------------------------------------- */

/** The draughtsman's construction mark: both edges overshoot the top-left corner by 8 px. */
export const crossedCorner = (x: number, y: number, c: string, w = 2): Mark[] => [
  S(`M${x - 8} ${y}L${x + 14} ${y}`, c, w, {clean: true, cap: 'butt'}),
  S(`M${x} ${y - 8}L${x} ${y + 14}`, c, w, {clean: true, cap: 'butt'}),
];

/** Section hatch (2 px at 45°, 10 px pitch) clipped to a box: returns one path of segments. */
export const hatchPath = (x: number, y: number, w: number, h: number, pitch = 10): string => {
  const segs: string[] = [];
  for (let c = -h; c < w; c += pitch) {
    // line from (x + c, y + h) to (x + c + h, y), clipped to the box
    let x0 = x + c;
    let y0 = y + h;
    let x1 = x + c + h;
    let y1 = y;
    if (x0 < x) {
      y0 -= x - x0;
      x0 = x;
    }
    if (x1 > x + w) {
      y1 += x1 - (x + w);
      x1 = x + w;
    }
    if (y0 - y1 > 0.5) segs.push(`M${fmt(x0)} ${fmt(y0)}L${fmt(x1)} ${fmt(y1)}`);
  }
  return segs.join('');
};
