/**
 * Signal routes (ENGINE.md §8, STYLE_BIBLE §8.2): 4 px `structure` while idle; "pointed at" tone steps; the `ink`
 * draw-on of a cable range; held levels in steady `info`; hidden routes drawn on in `textMuted` and settled back to
 * grey; and the route light behind a travelling Bit (info, 10-frame stepped decay). Drawn in WORLD coordinates
 * inside a view's camera transform; widths are screen-constant (÷ zoom).
 */
import React from 'react';
import {BIT2, COLOR, DUR, STROKE} from '../tokens';
import {offsetPolyline, polyPath, rectPath, slicePolyline} from '../../shared/geom';
import {mixColor} from '../../shared/brand';
import {prog} from '../core/ease';
import {inheritsWorld, scopeKey, type ViewScope} from '../core/types';
import type {Cam, ViewCam} from '../camera/camera';
import type {AnyWorld, RouteSpec} from '../world/types';
import {byAt} from '../timeline/track';
import {routeGeom} from './runs';
import type {BitDraw} from './BitV2';

/**
 * point: tone step to textMuted; ink: ink draw-on; hold: steady info; draw: a hidden route draws on (DUR.routeDraw) in
 * textMuted; settle: back to idle structure grey. `range` limits ink/point to [s0, s1] px along the path (S03: the
 * cable, RouteSpec.cable). `to` = the frame the effect ends (fades back over 6 frames). End ticks are GlyphEvents.
 */
export interface RouteEvent {
  route: string;
  kind: 'point' | 'ink' | 'hold' | 'draw' | 'settle';
  at: number;
  to?: number;
  range?: [number, number] | 'cable';
  scope?: ViewScope;
}

export interface RouteLayerProps {
  world: AnyWorld;
  frame: number;
  cam: Cam | ViewCam;
  bits: BitDraw[];
  events: RouteEvent[];
  scope: ViewScope;
}

const inScope = (evScope: ViewScope | undefined, view: ViewScope): boolean => {
  const k = scopeKey(evScope);
  return k === scopeKey(view) || (k === 'world' && inheritsWorld(view));
};

const sliceD = (r: RouteSpec, s0: number, s1: number): string => {
  const g = routeGeom(r);
  if (s0 <= 0.01 && s1 >= g.track.length - 0.01) return g.d;
  return polyPath(slicePolyline(g.track.pts, s0, s1));
};

const rangeOf = (r: RouteSpec, range: RouteEvent['range']): [number, number] => {
  const L = routeGeom(r).track.length;
  if (range === 'cable') return r.cable ?? [0, L];
  return range ?? [0, L];
};

/**
 * Round 2 (judges: the button's lead and the board trace read as one line with no end at the header, probe 4): a route
 * with a `cable` range draws that range as a TWO-WIRE LEAD (two 2.5 px wires 6 px apart) ending in a small connector
 * seated on the header, and the rest as a thinner 3 px board trace. Overlays (pointed, ink) follow the same split.
 */
export const CABLE = {wireGap: 6, wire: 2.5, trace: 3, plug: {w: 16, h: 14}} as const;

const strokeRange = (
  r: RouteSpec,
  s0: number,
  s1: number,
  color: string,
  opacity: number,
  z: number,
  key: string,
  routeW: number,
): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  if (s1 - s0 <= 0.01) return out;
  const g = routeGeom(r);
  const L = g.track.length;
  const cab = r.cable;
  if (!cab) {
    out.push(<path key={key} d={sliceD(r, s0, s1)} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={routeW} strokeLinecap="butt" strokeLinejoin="round" />);
    return out;
  }
  const [c0, c1] = cab;
  // the cable part: two wires
  const a = Math.max(s0, c0);
  const b = Math.min(s1, c1);
  if (b - a > 0.01) {
    const pts = slicePolyline(g.track.pts, a, b);
    const off = CABLE.wireGap / 2 / z;
    for (const sgn of [-1, 1]) {
      out.push(
        <path
          key={`${key}-w${sgn}`}
          d={polyPath(offsetPolyline(pts, sgn * off))}
          fill="none"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={CABLE.wire / z}
          strokeLinecap="butt"
          strokeLinejoin="round"
        />,
      );
    }
  }
  // the board trace: thinner
  const ta = Math.max(s0, c1);
  const tb = Math.min(s1, L);
  if (tb - ta > 0.01)
    out.push(
      <path key={`${key}-t`} d={sliceD(r, ta, tb)} fill="none" stroke={color} strokeOpacity={opacity} strokeWidth={CABLE.trace / z} strokeLinecap="butt" strokeLinejoin="round" />,
    );
  return out;
};

/** The lead's connector, seated on the header at the cable's end (drawn with the route, world px). */
const CablePlug: React.FC<{r: RouteSpec; z: number; color: string}> = ({r, z, color}) => {
  if (!r.cable) return null;
  const g = routeGeom(r);
  const p = g.track.at(r.cable[1]);
  const w = CABLE.plug.w / z;
  const h = CABLE.plug.h / z;
  return (
    <path
      d={rectPath(p.x - w / 2, p.y - h * 0.45, w, h, 2 / z)}
      fill={COLOR.bodyHi}
      stroke={color}
      strokeWidth={2 / z}
    />
  );
};

/** Overlay amount of an effect that starts at `at` (in over `inF`) and ends at `to` (out over 6). */
const span = (frame: number, at: number, to: number | undefined, inF: number): number => {
  const a = prog(frame, at, inF, 'arrive');
  const b = to === undefined ? 0 : prog(frame, to, 6, 'exit');
  return Math.max(0, a * (1 - b));
};

export const RouteLayer: React.FC<RouteLayerProps> = ({world, frame, cam, bits, events, scope}) => {
  const routes = world.routes ?? [];
  if (routes.length === 0) return null;
  const z = cam.zoom;
  const w = STROKE.route / z;
  const evs = byAt(events).filter((e) => inScope(e.scope, scope) && e.at <= frame + 0);
  const out: React.ReactNode[] = [];
  for (const r of routes) {
    const g = routeGeom(r);
    const L = g.track.length;
    const mine = evs.filter((e) => e.route === r.id);
    // visibility of hidden routes: drawn on by a 'draw' event
    let drawn = r.hidden ? 0 : 1;
    let drawnTone = 0; // textMuted amount for drawn routes
    let pointed = 0;
    const overlays: React.ReactNode[] = [];
    for (const e of mine) {
      if (e.kind === 'draw') {
        if (r.hidden) drawn = Math.max(drawn, prog(frame, e.at, DUR.routeDraw, 'arrive'));
        drawnTone = 1;
      } else if (e.kind === 'settle') {
        drawnTone *= 1 - prog(frame, e.at, 6, 'settle');
        pointed *= 1 - prog(frame, e.at, 6, 'settle');
      } else if (e.kind === 'point') {
        const [a, b] = rangeOf(r, e.range);
        const amt = span(frame, e.at, e.to, 4);
        if (a <= 0.01 && b >= L - 0.01) pointed = Math.max(pointed, amt);
        else if (amt > 0) overlays.push(...strokeRange(r, a, b, COLOR.textMuted, amt, z, `p${e.at}`, w));
      } else if (e.kind === 'ink') {
        const [a, b] = rangeOf(r, e.range);
        const amt = e.to === undefined ? 1 : 1 - prog(frame, e.to, 6, 'exit');
        const len = (b - a) * prog(frame, e.at, DUR.routeDraw, 'arrive');
        if (amt > 0 && len > 0.01) overlays.push(...strokeRange(r, a, a + len, COLOR.ink, amt, z, `i${e.at}`, w));
      } else if (e.kind === 'hold') {
        const [a, b] = rangeOf(r, e.range);
        const amt = span(frame, e.at, e.to, 4);
        if (amt > 0)
          overlays.push(
            <path key={`h${e.at}`} d={sliceD(r, a, b)} fill="none" stroke={COLOR.info} strokeOpacity={amt} strokeWidth={w} strokeLinecap="butt" strokeLinejoin="round" />,
          );
      }
    }
    if (drawn <= 0) continue;
    const tone = Math.max(pointed, drawnTone);
    const color = tone > 0 ? mixColor(COLOR.structure, COLOR.textMuted, Math.min(1, tone)) : COLOR.structure;
    if (r.cable) {
      out.push(...strokeRange(r, 0, L * drawn, color, 1, z, `b-${r.id}`, w));
      if (drawn >= 1) out.push(<CablePlug key={`plug-${r.id}`} r={r} z={z} color={color} />);
    } else {
      const base = drawn >= 1 ? g.d : sliceD(r, 0, L * drawn);
      out.push(<path key={`b-${r.id}`} d={base} fill="none" stroke={color} strokeWidth={w} strokeLinecap="butt" strokeLinejoin="round" />);
    }
    out.push(...overlays.map((o, i) => <React.Fragment key={`o-${r.id}-${i}`}>{o}</React.Fragment>));
    // route light behind the Bit: the dim afterglow of the path taken (round 1), a soft underglow, then the lit trail
    bits.forEach((b, bi) => {
      for (const ag of b.afterglows) {
        if (ag.route !== r.id || ag.opacity <= 0.005) continue;
        out.push(
          <path
            key={`ag-${r.id}-${bi}-${ag.hop}`}
            d={sliceD(r, ag.s0, ag.s1)}
            fill="none"
            stroke={COLOR.info}
            strokeOpacity={ag.opacity}
            strokeWidth={w}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />,
        );
      }
      if (!b.lit || b.lit.route !== r.id || !b.litTrail) return;
      const A = BIT2.afterglow;
      // round 2: a second, wider halo step under the lit stretch (the thumbnails' neon lines)
      b.litTrail.forEach((s, i) =>
        out.push(
          <path
            key={`lg2-${r.id}-${bi}-${i}`}
            d={sliceD(r, s.s0, s.s1 + 0.6 / z)}
            fill="none"
            stroke={COLOR.info}
            strokeOpacity={A.glow2Opacity * s.opacity}
            strokeWidth={w * A.glow2Width}
            strokeLinecap="round"
            strokeLinejoin="round"
          />,
        ),
      );
      b.litTrail.forEach((s, i) =>
        out.push(
          <path
            key={`lg-${r.id}-${bi}-${i}`}
            d={sliceD(r, s.s0, s.s1 + 0.6 / z)}
            fill="none"
            stroke={COLOR.info}
            strokeOpacity={A.glowOpacity * s.opacity}
            strokeWidth={w * A.glowWidth}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />,
        ),
      );
      b.litTrail.forEach((s, i) =>
        out.push(
          <path
            key={`l-${r.id}-${bi}-${i}`}
            d={sliceD(r, s.s0, s.s1 + 0.6 / z)}
            fill="none"
            stroke={COLOR.info}
            strokeOpacity={s.opacity}
            strokeWidth={w}
            strokeLinecap="butt"
          />,
        ),
      );
    });
  }
  return <g>{out}</g>;
};
