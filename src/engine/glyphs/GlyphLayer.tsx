/**
 * Glyph placement (ENGINE.md §13): places the glyphs v2 at projected anchors, in SCREEN px inside a view.
 * The "?" badges of blocks with `badge: 'q'` are drawn here in every view (screen-constant: 44 px, 56 as subject,
 * 72 inside a Lens), so they appear once in the world and once in a Lens. Brackets sit above everything (Atlas draws
 * BracketsLayer last).
 */
import React from 'react';
import {COLOR, DUR, GLYPH2, PARALLAX, STROKE} from '../tokens';
import {circlePath, rectPath} from '../../shared/geom';
import {mixColor} from '../../shared/brand';
import {prog} from '../core/ease';
import {clamp, clamp01, f2, unionRect} from '../core/math';
import {inheritsWorld, isPt, scopeKey, type AnchorRef, type Pt, type ViewScope, type WRect} from '../core/types';
import {layerCam, project, screenRect, type Cam, type Shot, type ViewCam} from '../camera/camera';
import {anchorPart, partById, portsOf, resolveAnchor} from '../world/states';
import type {AnyWorld} from '../world/types';
import {blockRect, type BlockProp} from '../world/placeholder';
import {routeGeom} from '../signal/runs';
import {w as wordFrame, type WordId} from '../timeline/words';
import {ApproxChip2, Brackets2, CommandChip2, commandChipSize, EndTick2, EyeBadge2, Journey2, LoopArrow2, MarkBadge2, PowerRing2, ProblemBadge2, QBadge2, StageMark2, WakeBadge2} from './draw';
import {stateAt} from '../world/states';
import type {StateEvent} from '../world/types';
import type {PartState} from '../tokens';

export type GlyphEvent =
  | {kind: 'qFill'; part: string; block: string; at: number; outAt?: number; size?: 'default' | 'subject'; scope?: ViewScope}
  | {kind: 'qAccent'; part: string; block: string; at: number; scope?: ViewScope}
  /** width = clamp(0.9 × block's on-screen width, 48, 96) (96 inside a Lens). `block` = the block key on the anchor's part.
   *  Round 3: `closeAt` closes the eye (its lookout lost standby power: S10 what-ifs); `look` steps glance the pupil
   *  toward an anchor (null = back to centre): S11, the lookout watching its doors. */
  | {kind: 'eye'; anchor: AnchorRef; block: string; drawAt: number; outAt: number; scope?: ViewScope; closeAt?: number; look?: Array<{at: number; to: AnchorRef | null}>}
  /** Round 3: a small order mark ("First") docked beside a part's anchor (`dx`, `dy` screen px from it to the mark's
   *  top-left), popping in on its word. */
  | {kind: 'mark'; anchor: AnchorRef; text: string; at: number; outAt: number; dx: number; dy: number; scope?: ViewScope; sub?: string; leader?: boolean}
  | {kind: 'visited'; plate: string; at: number}
  | {kind: 'brackets'; part: string; port?: string; lockAt: number; fadeAt: number}
  | {kind: 'endTick'; route: string; at: number; outAt: number}
  /** `pointed` draws it in textMuted; `settleAt` steps it back to structure grey over 6 frames (with its route). */
  | {kind: 'wake'; glyph: 'netJack' | 'clock'; anchor: AnchorRef; at: number; outAt?: number; pointed?: boolean; settleAt?: number}
  /** `spinAt`: the restart glyph turns once (18 frames, 'move') on a word ("fix"): verbs get motion. */
  /** `journey` (round 1): a small path drawn beside the chip on its words, so two commands visibly differ without
   *  showing a mechanism: 'loop' (a closed loop, drawn at at[0]) or 'downUp' (down to a flat "off" step at at[0], back
   *  up at at[1]). `glyph: 'off'` is IEC 60417-5008 (a ring, the rocker's O), distinct from the button's power symbol. */
  | {kind: 'command'; text: 'Restart' | 'Shut down' | string; glyph: 'restart' | 'power' | 'off'; screen: Pt; word: WordId; exitAt: number | 'hold'; land?: number; spinAt?: number; journey?: {kind: 'loop' | 'downUp'; at: number[]}}
  /** node/branches are ROOM-PLANE world px (parallax 0.9). */
  | {kind: 'fork'; from: AnchorRef; node: Pt; branches: Pt[]; drawAt: number[]; pulseAt?: number; outAt: number}
  /** Dashed ≈ analogy arc; its ≈ chip appears at the apex at chipAt. `bend` = the control point's offset as a fraction
   *  of the chord (default 0.32, bowing up the screen; negative bows it down, under labels that sit above the chord). */
  | {kind: 'arc'; from: AnchorRef; to: AnchorRef; drawAt: number; dur: number; chipAt?: number; outAt: number; bend?: number}
  /** signInCard: `rect` in ROOM-PLANE world px. */
  | {kind: 'card'; rect: WRect; drawAt: number; contentAt: number; outAt: number; approx?: boolean}
  /** Round 4: four separate L-brackets (SCOPE_ARM px arms) round the union of `rects` (+ `pad` px, default 16). */
  | {kind: 'scopeLine'; rects: WRect[]; drawAt: number; dur: number; outAt: number; pad?: number}
  /** Round 1, the hook (judges: the f0 press was nearly invisible): two `ink` rings leave the part's outline (a disc for
   *  the round button) and grow PRESS_WAVE.grow px while they fade; the second follows 5 frames later. */
  | {kind: 'pressWave'; part: string; at: number}
  /** Round 2 (S08 twin plates): a big restart loop round an anchor (`r` screen px), swept on over `dur` (14) frames from
   *  drawAt ('move'); one more turn at spinAt (20 frames). */
  | {kind: 'loopArrow'; anchor: AnchorRef; r: number; drawAt: number; dur?: number; spinAt?: number; outAt?: number; scope?: ViewScope}
  /** Round 2 (S08): a big power symbol round an anchor; it steps to grey at offAt and back to ink at onAt (6 frames). */
  | {kind: 'powerRing'; anchor: AnchorRef; r: number; drawAt: number; dur?: number; offAt?: number; onAt?: number; outAt?: number; scope?: ViewScope}
  /** Round 2 (S08): the problem mark (coral "!") at an anchor: pops in at `at`; `clearAt` it shrinks away (fixed); `pulseAt`
   *  it swells and sends a ring (still there). */
  | {kind: 'problem'; anchor: AnchorRef; at: number; clearAt?: number; pulseAt?: number; outAt?: number; size?: number; scope?: ViewScope; hedgeAt?: number; doubtAt?: number}
  /** Round 4, a chain stage's mark (StageMark2: 'code' on the flash, 'file' on the SSD) on `from`, `w` px wide; at `moveAt`
   *  a copy slides into `to` (the processor that runs it) over 10 frames and fades there: the stage visibly loads. */
  | {kind: 'stage'; mark: 'code' | 'file'; from: AnchorRef; to: AnchorRef; w: number; at: number; moveAt?: number; outAt: number; scope?: ViewScope};

/** Round 4: the scope line's bracket arm length (screen px). */
export const SCOPE_ARM = 76;

/** The press wave's rings: growth (px), frames, stroke from → to, peak opacity, the second ring's lag. */
/** Round 2 (judges: two thin rings round the button, not a wave): bigger, longer, thicker (the hook's signature). */
export const PRESS_WAVE = {grow: 190, frames: 24, stroke: [5, 1.5] as const, opacity: 0.9, lag: 5} as const;

const inScope = (s: ViewScope | undefined, view: ViewScope): boolean => {
  const k = scopeKey(s);
  return k === scopeKey(view) || (k === 'world' && inheritsWorld(view));
};

const fadeOut = (frame: number, outAt: number | undefined, frames = 6): number => (outAt === undefined ? 1 : 1 - prog(frame, outAt, frames, 'exit'));

/** Screen point of an anchor in this view (room-plane parts project on their own plane). */
export const anchorScreen = (world: AnyWorld, a: AnchorRef, cam: Cam | ViewCam, refShot?: Shot): Pt => {
  const p = resolveAnchor(world, a);
  const part = anchorPart(world, a);
  const depth = part?.depth ?? 1;
  return project(depth !== 1 && refShot ? layerCam(cam, depth, refShot) : cam, p);
};

const roomPt = (p: Pt, cam: Cam | ViewCam, refShot?: Shot): Pt => project(refShot ? layerCam(cam, PARALLAX.room, refShot) : cam, p);

/** Partial polyline of a sampled curve up to fraction t. */
const partialCurve = (pts: Pt[], t: number): Pt[] => {
  if (t >= 1) return pts;
  const n = Math.max(1, Math.floor((pts.length - 1) * clamp01(t)));
  return pts.slice(0, n + 1);
};
const polyD = (pts: Pt[]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${f2(p[0])} ${f2(p[1])}`).join('');

export interface GlyphLayerProps {
  events: ReadonlyArray<GlyphEvent>;
  frame: number;
  cam: Cam | ViewCam;
  world: AnyWorld;
  scope: ViewScope;
  refShot?: Shot;
  /** Unique per view (clip ids). */
  idPrefix?: string;
  /** Inside a Lens: 1 = "?" badge 72 px and eye 96 px; 0 = normal sizes (a dive blends between them). */
  inLens?: number;
  /** Parts hidden in this view (their badges are not drawn). */
  hide?: string[];
  /** Round 3: the script's states (the "?" badge is dim while its block is unpowered and not pointed at). */
  states?: ReadonlyArray<StateEvent>;
  /** Round 3: peeled sockets (a ghosted block's "?" badge fades with it). */
  ghosts?: ReadonlyMap<string, number> | null;
  /** Round 4: false for a world-scoped view that is not the main view (a hero carried in a plate, a carried scene): it
   *  never draws the main view's own glyphs (arcs, cards, wake badges, scope lines, press waves…). Default true. */
  main?: boolean;
}

const LIT_STATES: ReadonlySet<PartState> = new Set<PartState>(['on', 'alwaysOn', 'reset', 'waiting', 'limit', 'fault']);

export const GlyphLayer: React.FC<GlyphLayerProps> = ({events, frame, cam, world, scope, refShot, idPrefix = 'g', inLens, hide, states, ghosts, main}) => {
  const out: React.ReactNode[] = [];
  const hidden = new Set(hide ?? []);
  const isMain = scopeKey(scope) === 'world' && main !== false;

  // persistent "?" badges on blocks (inside a package's `blocks`, or a standalone logicBlock part with badge 'q')
  for (const part of world.parts) {
    if (hidden.has(part.id)) continue;
    const standalone = part.type === 'logicBlock' && part.props?.badge === 'q';
    const blocks: BlockProp[] | undefined = standalone
      ? [{key: part.id, rel: {x: 0, y: 0, w: 1, h: 1}, badge: 'q'}]
      : (part.props?.blocks as BlockProp[] | undefined);
    if (!Array.isArray(blocks)) continue;
    const partOpacity = typeof part.props?.opacity === 'number' ? (part.props.opacity as number) : 1;
    for (const b of blocks) {
      if (b.badge !== 'q') continue;
      const r = blockRect(part.rect, b.rel);
      const c = project(cam, [r.x + r.w / 2, r.y + r.h / 2]);
      let fill = 0;
      let subject = 0;
      let accent = 1;
      for (const e of events) {
        if (e.kind === 'qFill' && e.part === part.id && (e.block === b.key || standalone) && inScope(e.scope, scope)) {
          const f = prog(frame, e.at, DUR.qFill, 'arrive') * fadeOut(frame, e.outAt, DUR.qFill);
          fill = Math.max(fill, f);
          if (e.size === 'subject') subject = Math.max(subject, f);
        }
        if (e.kind === 'qAccent' && e.part === part.id && (e.block === b.key || standalone) && inScope(e.scope, scope)) {
          if (frame >= e.at && frame < e.at + DUR.qAccent) accent = Math.max(accent, 1 + 0.12 * Math.sin((Math.PI * (frame - e.at)) / DUR.qAccent));
        }
      }
      const normal = GLYPH2.qBadge + (GLYPH2.qBadgeSubject - GLYPH2.qBadge) * subject;
      const size = normal + (GLYPH2.qBadgeLens - normal) * clamp01(inLens ?? 0);
      // round 3 (red line 7): full strength only while the block is powered, pointed at, accented or inside a Lens
      let level = 1;
      if (states) {
        const init = (b as {state?: PartState}).state ?? (standalone ? (part.initial ?? 'off') : 'off');
        const st = stateAt(frame, states, part.id, standalone ? undefined : b.key, scope, init);
        const litNow = LIT_STATES.has(st.state);
        const lit = st.flip ? (litNow ? prog(frame, st.flip.at, DUR.stateFlip, 'arrive') : LIT_STATES.has(st.flip.from) ? 1 - prog(frame, st.flip.at, DUR.stateFlip, 'arrive') : 0) : litNow ? 1 : 0;
        const boost = Math.max(lit, fill, clamp01(inLens ?? 0), clamp01((accent - 1) / 0.12));
        level = GLYPH2.qDim + (1 - GLYPH2.qDim) * boost;
      }
      const gh = ghosts?.get(standalone ? part.id : `${part.id}.${b.key}`) ?? 0;
      // round 4 (judges: a doubled "?" as the chain flew home): while its block is peeled the world's "?" badge is gone
      // (the plate carries the block and its badge); it returns as the socket fills under the landing hero
      const op = partOpacity * (1 - gh);
      if (op > 0.01) out.push(<QBadge2 key={`q-${part.id}-${b.key}`} x={c[0]} y={c[1]} size={size} fill={fill} scale={accent} opacity={op} level={level} />);
    }
  }

  events.forEach((e, i) => {
    const key = `${e.kind}-${i}`;
    switch (e.kind) {
      case 'eye': {
        if (!inScope(e.scope, scope)) return;
        // a recomposed scene (plate) that does not hold the anchor's part shows no eye
        if (!isPt(e.anchor) && !anchorPart(world, e.anchor)) return;
        if (frame < e.drawAt || frame >= e.outAt + 6) return;
        const part = anchorPart(world, e.anchor);
        let bw = 72 * cam.zoom;
        if (part) {
          const ports = portsOf(world, part);
          const l = ports[`block:${e.block}.left`];
          const r = ports[`block:${e.block}.right`];
          if (l && r) bw = Math.abs(r[0] - l[0]) * cam.zoom;
        }
        const w0 = clamp(GLYPH2.eyeScale * bw, GLYPH2.eyeMin, GLYPH2.eyeMax);
        const width = w0 + (GLYPH2.eyeMax - w0) * clamp01(inLens ?? 0);
        const c = anchorScreen(world, e.anchor, cam, refShot);
        const draw = prog(frame, e.drawAt, DUR.eyeDraw, 'arrive');
        const close = e.closeAt !== undefined ? prog(frame, e.closeAt, GLYPH2.eyeCloseFrames, 'move') : 0;
        const ey: Pt = [c[0], c[1] - (width * GLYPH2.eyeAspect) / 2 - 6];
        // round 3: the pupil glances toward the current look target (eased between steps)
        let look: Pt | undefined;
        if (e.look && e.look.length) {
          const dirOf = (to: AnchorRef | null): Pt => {
            if (to === null) return [0, 0];
            const t = anchorScreen(world, to, cam, refShot);
            const dx = t[0] - ey[0];
            const dy = t[1] - ey[1];
            const L = Math.hypot(dx, dy) || 1;
            return [dx / L, dy / L];
          };
          let cur: Pt = [0, 0];
          for (const st of e.look) {
            if (frame < st.at) break;
            const k = prog(frame, st.at, GLYPH2.eyeLookFrames, 'move');
            const nx = dirOf(st.to);
            cur = [cur[0] + (nx[0] - cur[0]) * k, cur[1] + (nx[1] - cur[1]) * k];
          }
          look = cur;
        }
        out.push(
          <EyeBadge2
            key={key}
            x={ey[0]}
            y={ey[1]}
            width={width}
            draw={draw}
            opacity={fadeOut(frame, e.outAt)}
            clipId={`${idPrefix}-eye${i}`}
            close={close}
            look={look}
          />,
        );
        return;
      }
      case 'mark': {
        if (!inScope(e.scope, scope)) return;
        if (!isPt(e.anchor) && !anchorPart(world, e.anchor)) return;
        if (frame < e.at || frame >= e.outAt + 6) return;
        const c = anchorScreen(world, e.anchor, cam, refShot);
        const pop = prog(frame, e.at, 5, 'arrive');
        out.push(
          <MarkBadge2
            key={key}
            x={c[0] + e.dx}
            y={c[1] + e.dy}
            text={e.text}
            opacity={pop * fadeOut(frame, e.outAt)}
            scale={0.8 + 0.2 * pop}
            sub={e.sub}
            subReveal={prog(frame, e.at + 3, 5, 'arrive')}
            leaderTo={e.leader ? c : undefined}
            leaderDraw={prog(frame, e.at - 3, 4, 'arrive')}
          />,
        );
        return;
      }
      case 'endTick': {
        if (!isMain && !inheritsWorld(scope)) return;
        if (frame < e.at || frame >= e.outAt + 6) return;
        const r = (world.routes ?? []).find((x) => x.id === e.route);
        if (!r) return;
        const g = routeGeom(r);
        const s = r.endTickAt ?? g.track.length;
        const p = g.track.at(s);
        const c = project(cam, [p.x, p.y]);
        out.push(<EndTick2 key={key} x={c[0]} y={c[1]} angle={p.angle} draw={prog(frame, e.at, DUR.endTickDraw, 'arrive')} opacity={fadeOut(frame, e.outAt)} />);
        return;
      }
      case 'wake': {
        if (!isMain) return;
        if (frame < e.at || (e.outAt !== undefined && frame >= e.outAt + 6)) return;
        const c = anchorScreen(world, e.anchor, cam, refShot);
        const t = prog(frame, e.at, 6, 'arrive');
        const settle = e.settleAt !== undefined ? prog(frame, e.settleAt, 6, 'settle') : 0;
        const color = e.pointed ? mixColor(COLOR.textMuted, COLOR.structure, settle) : COLOR.structure;
        const s = GLYPH2.wakeGlyph * (0.7 + 0.3 * t);
        // round 2: a badge (rounded-square chip with the glyph inside), never a part on the board. Round 4 (judges: the
        // jack and the clock stayed as bright as the button; they depend on settings): once settled they step down to
        // GLYPH2.wakeDim, so only the button is lit on "like that button"
        const dim = 1 - (1 - GLYPH2.wakeDim) * settle;
        out.push(<WakeBadge2 key={key} cx={c[0]} cy={c[1]} size={s} glyph={e.glyph} color={color} opacity={t * dim * fadeOut(frame, e.outAt)} />);
        return;
      }
      case 'command': {
        if (!isMain) return;
        const land = e.land ?? wordFrame(e.word);
        const exit = typeof e.exitAt === 'number' ? e.exitAt : Number.POSITIVE_INFINITY;
        if (frame < land || frame >= exit + 6) return;
        const t = prog(frame, land, 4, 'arrive');
        out.push(
          <CommandChip2
            key={key}
            x={e.screen[0]}
            y={e.screen[1]}
            text={e.text}
            glyph={e.glyph}
            draw={prog(frame, land, 8, 'arrive')}
            opacity={t * fadeOut(frame, exit)}
            scale={0.94 + 0.06 * t}
            spin={e.spinAt !== undefined ? 360 * prog(frame, e.spinAt, 18, 'move') : 0}
          />,
        );
        if (e.journey) {
          const sz = commandChipSize(e.text);
          out.push(
            <Journey2
              key={`${key}-j`}
              kind={e.journey.kind}
              x={e.screen[0] + sz.w + 20}
              y={e.screen[1] + sz.h / 2}
              frame={frame}
              at={e.journey.at}
              opacity={fadeOut(frame, exit)}
              spin={e.spinAt !== undefined ? 360 * prog(frame, e.spinAt, 18, 'move') : 0}
            />,
          );
        }
        return;
      }
      case 'fork': {
        if (!isMain) return;
        const t0 = e.drawAt[0] ?? 0;
        if (frame < t0 || frame >= e.outAt + 6) return;
        const from = anchorScreen(world, e.from, cam, refShot);
        const node = roomPt(e.node, cam, refShot);
        const op = fadeOut(frame, e.outAt);
        const pulse = e.pulseAt !== undefined ? Math.sin(Math.PI * clamp01((frame - e.pulseAt) / 16)) : 0;
        const col = pulse > 0 ? mixColor(COLOR.structure, COLOR.textMuted, pulse) : COLOR.structure;
        const stem = prog(frame, t0, 6, 'arrive');
        const segs: React.ReactNode[] = [];
        segs.push(<path key="stem" d={polyD([from, [from[0] + (node[0] - from[0]) * stem, from[1] + (node[1] - from[1]) * stem]])} />);
        e.branches.forEach((b, k) => {
          const at = e.drawAt[k + 1];
          if (at === undefined || frame < at) return;
          const bp = roomPt(b, cam, refShot);
          const t = prog(frame, at, 6, 'arrive');
          const mid: Pt = [bp[0], node[1]];
          const pts: Pt[] = [node, mid, bp];
          const full = Math.abs(mid[0] - node[0]) + Math.abs(bp[1] - mid[1]);
          let left = full * t;
          const drawn: Pt[] = [node];
          for (let s = 1; s < pts.length && left > 0; s++) {
            const a = pts[s - 1];
            const c = pts[s];
            const l = Math.hypot(c[0] - a[0], c[1] - a[1]);
            const u = Math.min(1, left / Math.max(1e-6, l));
            drawn.push([a[0] + (c[0] - a[0]) * u, a[1] + (c[1] - a[1]) * u]);
            left -= l;
          }
          segs.push(<path key={`b${k}`} d={polyD(drawn)} />);
        });
        out.push(
          <g key={key} opacity={op} fill="none" stroke={col} strokeWidth={STROKE.route} strokeLinejoin="round">
            {segs}
          </g>,
        );
        return;
      }
      case 'arc': {
        if (!isMain) return;
        if (frame < e.drawAt || frame >= e.outAt + 6) return;
        const a = anchorScreen(world, e.from, cam, refShot);
        const b = anchorScreen(world, e.to, cam, refShot);
        const mid: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const ctrl: Pt = [mid[0], mid[1] - d * (e.bend ?? 0.32)];
        const pts: Pt[] = [];
        for (let k = 0; k <= 40; k++) {
          const t = k / 40;
          pts.push([
            (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * ctrl[0] + t * t * b[0],
            (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * ctrl[1] + t * t * b[1],
          ]);
        }
        const t = prog(frame, e.drawAt, e.dur, 'move');
        const apex = pts[20];
        out.push(
          <g key={key} opacity={fadeOut(frame, e.outAt)}>
            <path d={polyD(partialCurve(pts, t))} fill="none" stroke={COLOR.annotation} strokeWidth={STROKE.analogy} strokeDasharray="12 8" />
            {e.chipAt !== undefined && frame >= e.chipAt ? (
              <ApproxChip2 x={apex[0] - GLYPH2.approxChip.w / 2} y={apex[1] - GLYPH2.approxChip.h - 10} opacity={prog(frame, e.chipAt, 6, 'arrive')} />
            ) : null}
          </g>,
        );
        return;
      }
      case 'card': {
        if (!isMain) return;
        if (frame < e.drawAt || frame >= e.outAt + 6) return;
        const tl = roomPt([e.rect.x, e.rect.y], cam, refShot);
        const br = roomPt([e.rect.x + e.rect.w, e.rect.y + e.rect.h], cam, refShot);
        const w = br[0] - tl[0];
        const h = br[1] - tl[1];
        const per = 2 * (w + h);
        const draw = prog(frame, e.drawAt, 8, 'arrive');
        const content = prog(frame, e.contentAt, 6, 'arrive');
        out.push(
          <g key={key} opacity={fadeOut(frame, e.outAt)}>
            <path d={rectPath(tl[0], tl[1], w, h, 12)} fill={COLOR.deck} fillOpacity={0.7 * draw} />
            <path
              d={rectPath(tl[0], tl[1], w, h, 12)}
              fill="none"
              stroke={COLOR.annotation}
              strokeWidth={STROKE.analogy}
              strokeDasharray={draw < 1 ? `${per * draw} ${per}` : '12 8'}
            />
            <g opacity={content} fill="none" stroke={COLOR.annotation} strokeWidth={3} strokeDasharray="10 7">
              <path d={circlePath(tl[0] + w / 2, tl[1] + h * 0.3, Math.min(w, h) * 0.15)} />
              <path d={rectPath(tl[0] + w * 0.25, tl[1] + h * 0.56, w * 0.5, 4, 2)} />
              <path d={rectPath(tl[0] + w * 0.33, tl[1] + h * 0.7, w * 0.34, h * 0.16, 6)} />
            </g>
            {e.approx ? <ApproxChip2 x={tl[0] - 12} y={tl[1] - 14} opacity={draw} /> : null}
          </g>,
        );
        return;
      }
      case 'pressWave': {
        if (!isMain) return;
        const P = PRESS_WAVE;
        if (frame < e.at || frame >= e.at + P.lag + P.frames) return;
        const part = partById(world, e.part);
        if (!part) return;
        const r = screenRect(cam, part.rect, part.depth ?? 1, refShot);
        const round = Math.min(r.w, r.h) / 2;
        [0, 1].forEach((k) => {
          const t0 = e.at + k * P.lag;
          if (frame < t0 || frame >= t0 + P.frames) return;
          const u = (frame - t0) / P.frames;
          const g = P.grow * (1 - Math.pow(1 - u, 3));
          out.push(
            <path
              key={`${key}-${k}`}
              d={rectPath(r.x - g, r.y - g, r.w + 2 * g, r.h + 2 * g, round + g)}
              fill="none"
              stroke={COLOR.ink}
              strokeWidth={P.stroke[0] + (P.stroke[1] - P.stroke[0]) * u}
              strokeOpacity={P.opacity * (1 - u) * (k === 0 ? 1 : 0.6)}
            />,
          );
        });
        return;
      }
      case 'loopArrow': {
        if (!inScope(e.scope, scope)) return;
        if (frame < e.drawAt || (e.outAt !== undefined && frame >= e.outAt + 6)) return;
        if (!isPt(e.anchor) && !anchorPart(world, e.anchor)) return;
        const c = anchorScreen(world, e.anchor, cam, refShot);
        const draw = prog(frame, e.drawAt, e.dur ?? 14, 'move');
        const spin = e.spinAt !== undefined ? 360 * prog(frame, e.spinAt, 20, 'move') : 0;
        out.push(<LoopArrow2 key={key} cx={c[0]} cy={c[1]} r={e.r} draw={draw} spin={spin} opacity={fadeOut(frame, e.outAt)} />);
        return;
      }
      case 'powerRing': {
        if (!inScope(e.scope, scope)) return;
        if (frame < e.drawAt || (e.outAt !== undefined && frame >= e.outAt + 6)) return;
        if (!isPt(e.anchor) && !anchorPart(world, e.anchor)) return;
        const c = anchorScreen(world, e.anchor, cam, refShot);
        const draw = prog(frame, e.drawAt, e.dur ?? 14, 'move');
        const off = e.offAt !== undefined ? prog(frame, e.offAt, 6, 'arrive') * (e.onAt !== undefined ? 1 - prog(frame, e.onAt, 6, 'arrive') : 1) : 0;
        const color = off > 0 ? mixColor(COLOR.ink, COLOR.structure, off) : COLOR.ink;
        out.push(<PowerRing2 key={key} cx={c[0]} cy={c[1]} r={e.r} draw={draw} color={color} opacity={fadeOut(frame, e.outAt)} />);
        return;
      }
      case 'problem': {
        if (!inScope(e.scope, scope)) return;
        if (frame < e.at || (e.outAt !== undefined && frame >= e.outAt + 6)) return;
        if (e.clearAt !== undefined && frame >= e.clearAt + 8) return;
        if (!isPt(e.anchor) && !anchorPart(world, e.anchor)) return;
        const c = anchorScreen(world, e.anchor, cam, refShot);
        const pop = prog(frame, e.at, 5, 'arrive');
        let scale = 0.6 + 0.4 * pop;
        let op = pop * fadeOut(frame, e.outAt);
        let ring = 0;
        if (e.clearAt !== undefined && frame >= e.clearAt) {
          const t = prog(frame, e.clearAt, 8, 'exit');
          scale *= 1 - 0.6 * t;
          op *= 1 - t;
          ring = 0.15 + 0.85 * clamp01((frame - e.clearAt) / 8);
        }
        if (e.pulseAt !== undefined && frame >= e.pulseAt && frame < e.pulseAt + 16) {
          const u = (frame - e.pulseAt) / 16;
          scale *= 1 + 0.2 * Math.sin(Math.PI * Math.min(1, u * 1.6));
          ring = u;
        }
        // round 4, the hedge mark (a dotted ring = "maybe"): "can fix" fades the "!" to a dashed outline inside it (it may be
        // gone); "might not" keeps the "!" and sends two dotted echoes from it (it may stay)
        const hedge = e.hedgeAt !== undefined ? prog(frame, e.hedgeAt, 8, 'move') : 0;
        const doubt = e.doubtAt !== undefined ? prog(frame, e.doubtAt, 6, 'arrive') : 0;
        const beat = GLYPH2.hedge.beat;
        const echo = e.doubtAt !== undefined && frame >= e.doubtAt ? [0, 1].map((k) => clamp01((frame - e.doubtAt! - k * beat) / (beat * 1.6))) : [];
        if (e.doubtAt !== undefined && frame >= e.doubtAt && frame < e.doubtAt + 2 * beat) scale *= 1 + 0.08 * Math.sin((Math.PI * ((frame - e.doubtAt) % beat)) / beat);
        out.push(<ProblemBadge2 key={key} x={c[0]} y={c[1]} size={e.size ?? GLYPH2.problemSize} scale={scale} opacity={op} ring={ring} hedge={hedge} doubt={doubt} echo={echo} />);
        return;
      }
      case 'stage': {
        if (!inScope(e.scope, scope)) return;
        if (!isPt(e.from) && !anchorPart(world, e.from)) return;
        if (frame < e.at || frame >= e.outAt + 6) return;
        const a = anchorScreen(world, e.from, cam, refShot);
        const pop = prog(frame, e.at, 6, 'arrive');
        const op = pop * fadeOut(frame, e.outAt);
        out.push(<StageMark2 key={key} mark={e.mark} cx={a[0]} cy={a[1]} w={e.w * (0.8 + 0.2 * pop)} opacity={op} />);
        if (e.moveAt !== undefined && frame >= e.moveAt && frame < e.moveAt + 16) {
          const b = anchorScreen(world, e.to, cam, refShot);
          const u = prog(frame, e.moveAt, 10, 'move');
          const fade = 1 - prog(frame, e.moveAt + 10, 6, 'linear');
          out.push(
            <StageMark2 key={`${key}-copy`} mark={e.mark} cx={a[0] + (b[0] - a[0]) * u} cy={a[1] + (b[1] - a[1]) * u} w={e.w * (1 - 0.4 * u)} opacity={op * fade} />,
          );
        }
        return;
      }
      case 'scopeLine': {
        if (!isMain) return;
        if (frame < e.drawAt || frame >= e.outAt + 8) return;
        const r = unionRect(e.rects.map((x) => screenRect(cam, x)));
        const pad = e.pad ?? 16;
        const rr = {x: r.x - pad, y: r.y - pad, w: r.w + 2 * pad, h: r.h + 2 * pad};
        // round 3: four corner brackets that grow together. Round 4 (judges: they still met into a partial rectangle that
        // ran into the chip's scope line): four SEPARATE L-brackets, each arm SCOPE_ARM px, growing out of the corners
        // together over the first third of `dur` and then holding (never joining into a rectangle)
        const t = prog(frame, e.drawAt, Math.max(8, Math.round(e.dur / 3)), 'move');
        const ax = Math.min(rr.w / 2 - 8, SCOPE_ARM) * Math.max(0.12, t);
        const ay = Math.min(rr.h / 2 - 8, SCOPE_ARM) * Math.max(0.12, t);
        const x0 = rr.x;
        const y0 = rr.y;
        const x1 = rr.x + rr.w;
        const y1 = rr.y + rr.h;
        const d =
          `M${f2(x0 + ax)} ${f2(y0)}H${f2(x0)}V${f2(y0 + ay)}` +
          `M${f2(x1 - ax)} ${f2(y0)}H${f2(x1)}V${f2(y0 + ay)}` +
          `M${f2(x1)} ${f2(y1 - ay)}V${f2(y1)}H${f2(x1 - ax)}` +
          `M${f2(x0)} ${f2(y1 - ay)}V${f2(y1)}H${f2(x0 + ax)}`;
        out.push(
          <path
            key={key}
            d={d}
            fill="none"
            stroke={COLOR.annotation}
            strokeWidth={STROKE.analogy}
            strokeLinejoin="round"
            opacity={Math.min(prog(frame, e.drawAt, 4, 'arrive'), fadeOut(frame, e.outAt, 8))}
          />,
        );
        return;
      }
      default:
        return;
    }
  });
  return <g>{out}</g>;
};

/** Brackets lock-on (on top of everything): snap from 24 px outside over 5 frames ending at lockAt ('snap'). */
export const BracketsLayer: React.FC<{events: ReadonlyArray<GlyphEvent>; frame: number; cam: Cam; world: AnyWorld; refShot?: Shot}> = ({
  events,
  frame,
  cam,
  world,
  refShot,
}) => {
  const out: React.ReactNode[] = [];
  events.forEach((e, i) => {
    if (e.kind !== 'brackets') return;
    const B = GLYPH2.brackets;
    const start = e.lockAt - B.snapFrames;
    if (frame < start || frame >= e.fadeAt + B.fadeFrames) return;
    const part = partById(world, e.part);
    if (!part) return;
    let box: {x: number; y: number; w: number; h: number};
    if (e.port) {
      const c = anchorScreen(world, `${e.part}.${e.port}`, cam, refShot);
      box = {x: c[0] - 20, y: c[1] - 20, w: 40, h: 40};
    } else {
      box = screenRect(cam, part.rect, part.depth ?? 1, refShot);
    }
    const t = prog(frame, start, B.snapFrames, 'snap');
    const out0 = B.from * (1 - t);
    const op = Math.min(prog(frame, start, 2, 'arrive'), 1 - prog(frame, e.fadeAt, B.fadeFrames, 'exit'));
    out.push(<Brackets2 key={i} box={box} out={out0} opacity={op} />);
  });
  return <g>{out}</g>;
};

/** For checks: is this glyph event's anchor a block? (eye) */
export const glyphAnchor = (e: GlyphEvent): AnchorRef | null => ('anchor' in e ? e.anchor : null);
