/**
 * Dot opacity of the living field (STYLE_BIBLE §5.3–5.4): base + the light pool around the focus + the event
 * reactions (press rings and land ripples as expanding SQUARE rings, time breaths). Shared by the atlas grid (L2)
 * and the board vias (L3, FIELD.vias gains).
 */
import {DUR, FIELD} from '../tokens';
import {project, type Cam, type ViewCam} from '../camera/camera';
import type {Pt} from '../core/types';
import type {FieldEvent} from './types';

export interface FieldGains {
  base: number;
  pool: number;
  land: number;
  press: number;
  dip: number;
  /** Round 4: the focus pings (FIELD.ping). */
  ping: number;
  /** Round 4: the light pool holds its peak out to this fraction of its radius before it falls off (0 = a cos² cone). The
   *  board vias use a plateau, so the halftone shows on the bare board round the subject (the subject itself covers the
   *  pool's centre). */
  plateau?: number;
}

/** Round 4: a focus ping in screen px (derived by focus.ts pingsAt): its centre and its age in frames. */
export interface FieldPing {
  cx: number;
  cy: number;
  age: number;
}

export const GRID_GAINS: FieldGains = {
  base: FIELD.grid.baseOpacity,
  pool: FIELD.grid.poolOpacity,
  land: FIELD.grid.landRipple.gain,
  press: FIELD.grid.pressRing.gain,
  dip: FIELD.grid.timeBreath.dip,
  ping: FIELD.ping.gridGain,
};

export const VIA_GAINS: FieldGains = {
  base: FIELD.vias.baseOpacity,
  pool: FIELD.vias.poolOpacity,
  land: FIELD.vias.landGain,
  press: FIELD.vias.pressGain,
  dip: 0,
  ping: FIELD.ping.viaGain,
  plateau: FIELD.vias.poolPlateau,
};

/** An event reaction prepared for one frame (screen px). */
export interface PreparedReaction {
  kind: 'ring' | 'breath';
  cx: number;
  cy: number;
  /** Current ring radius (Chebyshev, so the ring is square) and half-width. */
  r: number;
  half: number;
  /** 'press' | 'land' | 'ping' gain selector, times the fade. */
  which: 'press' | 'land' | 'breath' | 'ping';
  fade: number;
}

const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Active reactions at a frame, projected with `cam` (world events) or taken as screen points. Round 4: `pings` (screen
 *  px, from focus.ts) add the focus pings' soft square rings. */
export const prepareReactions = (frame: number, events: ReadonlyArray<FieldEvent>, cam: Cam | ViewCam, pings: ReadonlyArray<FieldPing> = []): PreparedReaction[] => {
  const out: PreparedReaction[] = [];
  const PG = FIELD.ping;
  for (const p of pings) {
    if (p.age < 0 || p.age >= PG.frames) continue;
    const t = p.age / PG.frames;
    out.push({kind: 'ring', cx: p.cx, cy: p.cy, r: PG.maxRadius * outCubic(t), half: PG.ringWidth / 2, which: 'ping', fade: Math.pow(1 - t, PG.fadePow)});
  }
  for (const e of events) {
    if (e.kind === 'press' || e.kind === 'land') {
      const p = e.kind === 'press' ? FIELD.grid.pressRing : FIELD.grid.landRipple;
      const frames = e.kind === 'press' ? DUR.pressRingField : DUR.landRippleField;
      if (frame < e.at || frame >= e.at + frames) continue;
      const t = (frame - e.at) / frames;
      const s = e.kind === 'land' && e.space === 'screen' ? e.world : project(cam, e.world);
      out.push({kind: 'ring', cx: s[0], cy: s[1], r: p.maxRadius * outCubic(t), half: p.ringWidth / 2, which: e.kind, fade: 1 - t});
      // the press is a two-step pixel wave: an echo ring trails the first at FIELD.grid.pressRing.echo of its radius
      if (e.kind === 'press') {
        const k = FIELD.grid.pressRing.echo;
        out.push({kind: 'ring', cx: s[0], cy: s[1], r: p.maxRadius * k * outCubic(t), half: p.ringWidth / 3, which: e.kind, fade: 0.5 * (1 - t)});
      }
    } else if (e.kind === 'timeBreath') {
      const frames = FIELD.grid.timeBreath.frames;
      if (frame < e.at || frame >= e.at + frames) continue;
      const t = (frame - e.at) / frames;
      out.push({kind: 'breath', cx: 0, cy: 0, r: 0, half: 0, which: 'breath', fade: Math.sin(Math.PI * t)});
    }
  }
  return out;
};

/** Round 2: the light pool's slow breath (FIELD.grid.poolBreath) as a multiplier of the pool term at a frame. */
export const poolBreathAt = (frame: number): number => {
  const B = FIELD.grid.poolBreath;
  return 1 + B.amp * Math.sin((2 * Math.PI * frame) / B.period);
};

/** Round 4: the board vias' breath near the focus, phase-locked to the lookout's breathing (60 frames from f0: brightest
 *  where the pip is brightest), as an extra multiplier of the vias' pool term. */
export const viaBreathAt = (frame: number): number => {
  const B = FIELD.vias.breath;
  return 1 + B.amp * Math.cos((2 * Math.PI * frame) / B.period);
};

/** Opacity at a screen point from prepared reactions (the fast path used per dot). `poolK` scales the light pool
 *  (round 2: poolBreathAt(frame)). */
export const opacityAt = (p: Pt, focus: Pt, reactions: ReadonlyArray<PreparedReaction>, g: FieldGains, poolK = 1): number => {
  let o = g.base;
  const R = FIELD.grid.poolRadius;
  const dx = p[0] - focus[0];
  const dy = p[1] - focus[1];
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < R) {
    const pl = g.plateau ?? 0;
    const u = pl > 0 ? Math.max(0, (d - pl * R) / ((1 - pl) * R)) : d / R;
    const c = Math.cos((Math.PI / 2) * u);
    o += (g.pool - g.base) * c * c * poolK;
  }
  for (const r of reactions) {
    if (r.kind === 'breath') {
      o -= g.dip * r.fade;
      continue;
    }
    const dc = Math.max(Math.abs(p[0] - r.cx), Math.abs(p[1] - r.cy));
    if (Math.abs(dc - r.r) <= r.half) o += (r.which === 'press' ? g.press : r.which === 'ping' ? g.ping : g.land) * r.fade;
  }
  return Math.max(0, Math.min(1, o));
};

/** Round 4: how strongly a focus ping's band covers a screen point (0..1, the band's fade), for the vias' bigger pixels. */
export const pingBandAt = (p: Pt, reactions: ReadonlyArray<PreparedReaction>): number => {
  let m = 0;
  for (const r of reactions) {
    if (r.which !== 'ping') continue;
    const dc = Math.max(Math.abs(p[0] - r.cx), Math.abs(p[1] - r.cy));
    if (Math.abs(dc - r.r) <= r.half) m = Math.max(m, r.fade);
  }
  return m;
};

/** Grid dot opacity at a screen point (base + light pool + active reactions). Vias pass VIA_GAINS. */
export const gridOpacity = (
  frame: number,
  p: Pt,
  focus: Pt,
  events: ReadonlyArray<FieldEvent>,
  cam: Cam | ViewCam,
  gains: FieldGains = GRID_GAINS,
): number => opacityAt(p, focus, prepareReactions(frame, events, cam), gains, poolBreathAt(frame));

/** Quantise to 0.02 steps (so dots group into ~25 paths). */
export const bucket = (o: number): number => Math.round(o * 50) / 50;
