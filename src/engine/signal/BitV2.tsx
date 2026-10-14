/**
 * The Bit v2 (ENGINE.md §8, STYLE_BIBLE §8.1): a 24 px rounded square in `info` with a soft round glow (two radial
 * falloffs, round 1: the stepped square halo read as a UI selection box), a three-square pixel trail (16/12/8 px at
 * 28/50/68 px behind the head along the route, snapped to a 4 px screen grid, echoing the B monogram's shedding
 * pixels), the landing (a square ripple, or the receiver's own outline rippling outward, plus the monogram burst: the
 * three trail pixels thrown down-right of the landing point), and the route light behind it (10-frame decay, a soft
 * underglow and a dim afterglow of the path taken).
 */
import React from 'react';
import {BIT2, COLOR, DUR} from '../tokens';
import {rectPath} from '../../shared/geom';
import {mixColor} from '../../shared/brand';
import {breatheScale} from '../../shared/motion';
import {clamp01, lerp} from '../core/math';
import {EASE6, prog} from '../core/ease';
import {project, type Cam, type ViewCam} from '../camera/camera';
import type {SRect, WRect} from '../core/types';
import type {BitRun, BitSpec} from './runs';

/** Where the Bit is and what it looks like at a frame, in SCREEN px for a view. */
export interface BitDraw {
  status: 'hidden' | 'resting' | 'moving' | 'waiting' | 'parked' | 'absorbed';
  /** `glow` (round 2) scales the soft glow only: 0 while the Bit sits on a "quiet" receiver (a processor in a preview
   *  plate must not read as lit, red line 1); the crisp head stays. */
  head: {x: number; y: number; scale: number; opacity: number; glow?: number} | null;
  /** Pixel trail (BIT2.trail): 3 squares, nearest first, snapped to a 4 px grid. */
  trail: Array<{x: number; y: number; size: number; opacity: number}>;
  ripples: Array<{x: number; y: number; size: number; stroke: number; opacity: number}>;
  /** Receiver ripples: the receiver's screen rect grown outward (round 1). */
  rings: Array<SRect & {r: number; stroke: number; opacity: number}>;
  /** The monogram burst at a landing (round 1). Round 3: a pixel may carry its own colour (the signature birth's magenta
   *  → cyan) and a neon falloff (`glow`, 0..1). */
  burst: Array<{x: number; y: number; size: number; opacity: number; color?: string; glow?: number}>;
  /** Route-light: the lit length window [s0, s1] along the current route (world px), for RouteLayer. */
  lit: {route: string; s0: number; s1: number; age: number} | null;
  /** The route light as stepped segments (world px along the route), newest first: 10 frames of decay. */
  litTrail?: Array<{s0: number; s1: number; opacity: number}>;
  /** Dim afterglows of the travelled stretches [s0, s1] (world px along each hop's route) and their opacity. */
  afterglows: Array<{route?: string; hop: number; s0: number; s1: number; opacity: number}>;
  /** Index of the hop the light belongs to (for rows: the rail segment). */
  hop?: number;
}

const snap4 = (v: number): number => Math.round(v / BIT2.trail.snap) * BIT2.trail.snap;

/** Ripple: square 24 → 80 px, stroke 3 → 1.5, opacity 0.9 → 0 over 10 frames (sizes ease out, opacity linear). */
const rippleAt = (frame: number, at: number): {size: number; stroke: number; opacity: number} | null => {
  const r = BIT2.ripple;
  if (frame < at || frame >= at + r.frames) return null;
  const u = (frame - at) / r.frames;
  const t = 1 - Math.pow(1 - u, 3);
  return {size: lerp(r.from, r.to, t), stroke: lerp(r.strokeFrom, r.strokeTo, t), opacity: r.opacityFrom * (1 - u)};
};

/** The monogram burst at a landing point (screen px): three squares thrown down-right, fading. */
const burstAt = (frame: number, at: number, x: number, y: number, fade: number): BitDraw['burst'] => {
  const B = BIT2.burst;
  const out: BitDraw['burst'] = [];
  B.sizes.forEach((size, k) => {
    const t0 = at + k * B.stagger;
    if (frame < t0 || frame >= t0 + B.frames) return;
    const u = (frame - t0) / B.frames;
    const e = 1 - Math.pow(1 - u, 3);
    const [ox, oy] = B.offsets[k];
    const len = Math.hypot(ox, oy) || 1;
    const push = B.drift * e;
    const pop = prog(frame, t0, 3, 'arrive');
    out.push({
      x: snap4(x + ox * lerp(0.45, 1, pop) + (ox / len) * push),
      y: snap4(y + oy * lerp(0.45, 1, pop) + (oy / len) * push),
      size: size * lerp(0.6, 1, pop),
      opacity: (1 - u) * fade,
    });
  });
  return out;
};

/**
 * The Bit at a frame. `cam` maps the runs' space to the view's screen (pass the identity SCREEN_CAM for runs that are
 * already in screen px, e.g. a plate row). `routeIds` names each hop's world route for the route light; `receivers`
 * gives each hop's receiver rect (world px), or null.
 */
export const bitDraw = (
  frame: number,
  spec: Pick<BitSpec, 'park' | 'restFrom' | 'fadeAt' | 'id' | 'birth' | 'trailSignature'> & {hops?: ReadonlyArray<{quiet?: boolean}>},
  runs: ReadonlyArray<BitRun>,
  cam: Cam | ViewCam,
  routeIds: ReadonlyArray<string | undefined> = [],
  receivers: ReadonlyArray<(WRect & {r?: number}) | null | undefined> = [],
): BitDraw => {
  const quiet = (i: number): boolean => !!spec.hops?.[i]?.quiet;
  const st: BitDraw = {status: 'hidden', head: null, trail: [], ripples: [], rings: [], burst: [], lit: null, afterglows: []};
  if (runs.length === 0) return st;
  const z = cam.zoom;
  const scr = (x: number, y: number) => project(cam, [x, y]);
  const fade = spec.fadeAt !== undefined ? 1 - prog(frame, spec.fadeAt, 4, 'exit') : 1;
  if (fade <= 0) return st;

  runs.forEach((r, i) => {
    const rec = receivers[i];
    const p = scr(r.end[0], r.end[1]);
    if (rec) {
      const R = BIT2.receiverRipple;
      if (frame >= r.land && frame < r.land + R.frames) {
        const u = (frame - r.land) / R.frames;
        const t = 1 - Math.pow(1 - u, 3);
        const a = project(cam, [rec.x, rec.y]);
        const w = rec.w * z;
        const h = rec.h * z;
        const g = R.grow * t;
        st.rings.push({
          x: a[0] - g,
          y: a[1] - g,
          w: w + 2 * g,
          h: h + 2 * g,
          r: (rec.r ?? 6) * z + g,
          stroke: lerp(R.strokeFrom, R.strokeTo, t),
          opacity: R.opacityFrom * (1 - u) * fade,
        });
      }
      st.burst.push(...burstAt(frame, r.land, a0(rec, cam)[0], a0(rec, cam)[1], fade));
    } else {
      const rp = rippleAt(frame, r.land);
      if (rp) st.ripples.push({x: p[0], y: p[1], ...rp, opacity: rp.opacity * fade});
      st.burst.push(...burstAt(frame, r.land, p[0], p[1], fade));
    }
  });

  const pushTrail = (run: BitRun, s: number, spread: number, op: number) => {
    const {sizes, offsets, opacities} = BIT2.trail;
    for (let k = 0; k < sizes.length; k++) {
      const back = (offsets[k] * spread) / z;
      const ss = run.reverse ? Math.min(run.length, s + back) : Math.max(0, s - back);
      const p = run.track.at(ss);
      const q = scr(p.x, p.y);
      st.trail.push({x: snap4(q[0]), y: snap4(q[1]), size: sizes[k], opacity: opacities[k] * op * fade});
    }
  };

  // afterglows: every hop's travelled stretch, dim, fading out after its landing
  runs.forEach((run, i) => {
    const A = BIT2.afterglow;
    if (frame < run.depart || frame >= run.land + A.frames) return;
    const sNow = run.sAt(Math.min(frame, run.land));
    const s0 = run.reverse ? sNow : 0;
    const s1 = run.reverse ? run.length : sNow;
    const k = frame < run.land ? prog(frame, run.depart, 6, 'arrive') : 1 - (frame - run.land) / A.frames;
    if (s1 - s0 > 0.5 && k > 0) st.afterglows.push({route: routeIds[i], hop: i, s0, s1, opacity: A.opacity * k * fade});
  });

  const light = (run: BitRun, i: number) => {
    const id = routeIds[i];
    if (frame < run.depart || frame >= run.land + BIT2.routeDecay) return;
    const segs: Array<{s0: number; s1: number; opacity: number}> = [];
    for (let k = 0; k < BIT2.routeDecay; k++) {
      const f1 = frame - k;
      const f0 = f1 - 1;
      if (f1 <= run.depart) break;
      const a = run.sAt(Math.max(f0, run.depart));
      const b = run.sAt(Math.min(f1, run.land));
      const s0 = Math.min(a, b);
      const s1 = Math.max(a, b);
      if (s1 - s0 > 0.01) segs.push({s0, s1, opacity: 1 - k / BIT2.routeDecay});
    }
    if (segs.length === 0) return;
    st.litTrail = segs;
    st.hop = i;
    const s0 = Math.min(...segs.map((x) => x.s0));
    const s1 = Math.max(...segs.map((x) => x.s1));
    if (id) st.lit = {route: id, s0, s1, age: Math.max(0, frame - run.land)};
  };

  const first = runs[0];
  const last = runs[runs.length - 1];
  if (frame < first.depart) {
    if (spec.restFrom !== undefined && frame >= spec.restFrom && spec.birth === 'signature') {
      // round 3, the SIGNATURE birth (an episode's first press): the logo's three magenta pixels at 3.5× pop in down-right
      // of the head (as in the B monogram), hold, then slide into the head one after another, turning cyan as they merge
      const p = scr(first.start[0], first.start[1]);
      st.status = 'resting';
      const S = BIT2.signature;
      const r0 = spec.restFrom;
      const lastMerge = r0 + S.mergeAt + (S.sizes.length - 1) * S.stagger + S.merge;
      S.sizes.forEach((size, k) => {
        const t0 = r0 + k * S.stagger;
        if (frame < t0) return;
        const pop = prog(frame, t0, S.pop, 'arrive');
        const m0 = r0 + S.mergeAt + k * S.stagger;
        const u = clamp01((frame - m0) / S.merge);
        if (u >= 1) return;
        const e = EASE6.move(u);
        const [ox, oy] = S.offsets[k];
        st.burst.push({
          x: snap4(p[0] + ox * (1 - e)),
          y: snap4(p[1] + oy * (1 - e)),
          size: lerp(size * lerp(0.55, 1, pop), BIT2.size * 0.7, e),
          opacity: fade * pop * (u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1),
          color: mixColor(COLOR.emphasis, COLOR.info, clamp01(e * 1.25)),
          glow: pop * (1 - e * 0.6),
        });
      });
      // the head assembles as the pixels arrive (grows 0.3 → 1), then rests and breathes
      const grow = prog(frame, r0 + S.mergeAt + 2, lastMerge - (r0 + S.mergeAt + 2), 'arrive');
      if (frame >= r0 + S.mergeAt + 2) {
        st.head = {
          x: p[0],
          y: p[1],
          scale: lerp(0.3, 1, grow) * breatheScale(frame, lastMerge, BIT2.breathe, BIT2.breatheScale),
          opacity: fade * prog(frame, r0 + S.mergeAt + 2, 4, 'arrive'),
          glow: grow,
        };
      }
      const rp = rippleAt(frame, lastMerge - 2);
      if (rp) st.ripples.push({x: p[0], y: p[1], ...rp, opacity: rp.opacity * fade});
      return st;
    }
    if (spec.restFrom !== undefined && frame >= spec.restFrom) {
      const p = scr(first.start[0], first.start[1]);
      st.status = 'resting';
      // round 2, the birth: the B monogram's three pixels fly in from down-right and merge into the head
      const F = BIT2.form;
      const u = clamp01((frame - spec.restFrom) / F.frames);
      const grow = 1 - Math.pow(1 - u, 3);
      st.head = {
        x: p[0],
        y: p[1],
        scale: lerp(0.3, 1, grow) * breatheScale(frame, spec.restFrom, BIT2.breathe, BIT2.breatheScale),
        opacity: fade * prog(frame, spec.restFrom + 2, 4, 'arrive'),
        glow: grow,
      };
      const B = BIT2.burst;
      B.sizes.forEach((size, k) => {
        const t0 = spec.restFrom! + k;
        const v = clamp01((frame - t0) / (F.frames - 2 - k));
        if (frame < t0 || v >= 1) return;
        const e = 1 - Math.pow(1 - v, 3);
        const [ox, oy] = B.offsets[k];
        st.burst.push({
          x: snap4(p[0] + ox * F.spread * (1 - e)),
          y: snap4(p[1] + oy * F.spread * (1 - e)),
          size: lerp(size, BIT2.size * 0.5, e),
          opacity: fade * prog(frame, t0, 2, 'arrive') * (1 - Math.pow(v, 4)),
        });
      });
      const rp = rippleAt(frame, spec.restFrom + F.frames - 2);
      if (rp) st.ripples.push({x: p[0], y: p[1], ...rp, opacity: rp.opacity * fade});
    }
    return st;
  }
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    const next = runs[i + 1];
    if (frame >= r.depart && frame < r.land) {
      const pos = r.at(frame);
      const p = scr(pos.x, pos.y);
      st.status = 'moving';
      // quiet stops: the glow fades as the Bit arrives on one and returns as it leaves it
      let g = 1;
      if (i > 0 && quiet(i - 1)) g = Math.min(g, prog(frame, r.depart, 4, 'arrive'));
      if (quiet(i)) g = Math.min(g, 1 - prog(frame, r.land - 4, 4, 'linear'));
      st.head = {x: p[0], y: p[1], scale: 1, opacity: fade, glow: g};
      const S = BIT2.signature;
      if (i === 0 && spec.trailSignature && frame < r.depart + S.depart) {
        // round 4, the bookend: the monogram's three pixels re-form behind the departing Bit (magenta, signature sizes),
        // then shrink into its ordinary trail and turn cyan
        // the pixels pop in the logo's layout (down-right of the cap, as at the episode's first press) and converge onto
        // the trail's places behind the climbing head
        const e = EASE6.move(clamp01((frame - r.depart) / S.depart));
        const pop = prog(frame, r.depart - 1, 3, 'arrive');
        const o = scr(r.start[0], r.start[1]);
        const n0 = st.trail.length;
        pushTrail(r, pos.s, 1, 1);
        const tr = st.trail.splice(n0);
        tr.forEach((t, k) => {
          const [ox, oy] = S.offsets[k];
          st.burst.push({
            x: snap4(lerp(o[0] + ox, t.x, e)),
            y: snap4(lerp(o[1] + oy, t.y, e)),
            size: lerp(S.sizes[k], BIT2.trail.sizes[k], e) * lerp(0.55, 1, pop),
            opacity: fade * pop * lerp(1, BIT2.trail.opacities[k], e),
            color: mixColor(COLOR.emphasis, COLOR.info, clamp01(e * 1.2)),
            glow: pop * (1 - e),
          });
        });
      } else pushTrail(r, pos.s, clamp01((frame - r.depart) / BIT2.trail.shedFrames), 1);
      light(r, i);
      return st;
    }
    if (frame >= r.land && (!next || frame < next.depart)) {
      const since = frame - r.land;
      light(r, i);
      if (since < DUR.trailCollapse) {
        const k = 1 - since / DUR.trailCollapse;
        pushTrail(r, r.reverse ? 0 : r.length, k, k);
      }
      const p = scr(r.end[0], r.end[1]);
      const g = quiet(i) ? 0 : 1;
      if (next) {
        st.status = 'waiting';
        st.head = {x: p[0], y: p[1], scale: breatheScale(frame, r.land, BIT2.breathe, BIT2.breatheScale), opacity: fade, glow: g};
      } else if (spec.park) {
        st.status = 'parked';
        st.head = {x: p[0], y: p[1], scale: breatheScale(frame, last.land, BIT2.breathe, BIT2.breatheScale), opacity: fade, glow: g};
      } else {
        st.status = 'absorbed';
        if (since < BIT2.absorbFrames) {
          const k = since / BIT2.absorbFrames;
          st.head = {x: p[0], y: p[1], scale: 1 - 0.5 * k, opacity: (1 - k) * fade};
        }
      }
      return st;
    }
  }
  return st;
};

/** The burst's origin for a receiver: its bottom-right corner (the B monogram's pixels leave the letter there). */
const a0 = (rec: WRect, cam: Cam | ViewCam) => project(cam, [rec.x + rec.w, rec.y + rec.h]);

/** Glow, trail, head, ripples, receiver rings and the burst (screen px). `gid` makes the gradient ids unique per view. */
export const BitV2: React.FC<{draw: BitDraw; color?: string; gid?: string}> = ({draw, color = COLOR.info, gid = 'bit'}) => {
  const els: React.ReactNode[] = [];
  const g1 = `${gid}-g1`;
  const g2 = `${gid}-g2`;
  draw.ripples.forEach((r, i) => {
    const s = r.size;
    els.push(
      <path
        key={`r${i}`}
        d={rectPath(r.x - s / 2, r.y - s / 2, s, s, Math.max(2, s * 0.12))}
        fill="none"
        stroke={color}
        strokeWidth={r.stroke}
        strokeOpacity={r.opacity}
      />,
    );
  });
  draw.rings.forEach((r, i) => {
    els.push(<path key={`ring${i}`} d={rectPath(r.x, r.y, r.w, r.h, Math.max(2, r.r))} fill="none" stroke={color} strokeWidth={r.stroke} strokeOpacity={r.opacity} />);
  });
  const neon: React.ReactNode[] = [];
  draw.burst.forEach((b, i) => {
    const c = b.color ?? color;
    // round 3: the signature birth's pixels carry their own neon (a radial falloff in their colour, the logo's glow)
    if (b.glow && b.glow > 0.01) {
      const gid2 = `${gid}-n${i}`;
      neon.push(
        <radialGradient key={`ng${i}`} id={gid2}>
          <stop offset="0%" stopColor={c} stopOpacity={BIT2.signature.glowOpacity} />
          <stop offset="55%" stopColor={c} stopOpacity={BIT2.signature.glowOpacity * 0.35} />
          <stop offset="100%" stopColor={c} stopOpacity={0} />
        </radialGradient>,
      );
      els.push(<circle key={`bn${i}`} cx={b.x} cy={b.y} r={b.size * BIT2.signature.glow} fill={`url(#${gid2})`} opacity={b.glow * b.opacity} />);
    }
    els.push(<path key={`b${i}`} d={rectPath(b.x - b.size / 2, b.y - b.size / 2, b.size, b.size, Math.max(2, b.size * 0.08))} fill={c} fillOpacity={b.opacity} />);
  });
  const h = draw.head;
  const G = BIT2.glow;
  const g3 = `${gid}-g3`;
  // trail: farthest first so the nearest square sits on top
  for (let i = draw.trail.length - 1; i >= 0; i--) {
    const t = draw.trail[i];
    els.push(<path key={`t${i}`} d={rectPath(t.x - t.size / 2, t.y - t.size / 2, t.size, t.size, 2)} fill={color} fillOpacity={t.opacity} />);
  }
  if (h && h.opacity > 0) {
    const k = h.scale;
    const gk = h.glow ?? 1;
    if (gk > 0.01) {
      els.push(<circle key="g3" cx={h.x} cy={h.y} r={G.bloomR * k} fill={`url(#${g3})`} opacity={h.opacity * gk} />);
      els.push(<circle key="g2" cx={h.x} cy={h.y} r={G.outerR * k} fill={`url(#${g2})`} opacity={h.opacity * gk} />);
      els.push(<circle key="g1" cx={h.x} cy={h.y} r={G.r * k} fill={`url(#${g1})`} opacity={h.opacity * gk} />);
    }
    const s = BIT2.size * k;
    els.push(<path key="core" d={rectPath(h.x - s / 2, h.y - s / 2, s, s, BIT2.radius * k)} fill={color} fillOpacity={h.opacity} />);
  }
  if (els.length === 0) return null;
  return (
    <g>
      {(h && h.opacity > 0) || neon.length ? (
        <defs>
          <radialGradient id={g1}>
            <stop offset="0%" stopColor={color} stopOpacity={G.opacity} />
            <stop offset="45%" stopColor={color} stopOpacity={G.opacity * 0.42} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={g2}>
            <stop offset="0%" stopColor={color} stopOpacity={G.outerOpacity} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={g3}>
            <stop offset="0%" stopColor={color} stopOpacity={G.bloomOpacity} />
            <stop offset="60%" stopColor={color} stopOpacity={G.bloomOpacity * 0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </radialGradient>
          {neon}
        </defs>
      ) : null}
      {els}
    </g>
  );
};
