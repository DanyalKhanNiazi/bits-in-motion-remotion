/**
 * Keyed tags v2 (ENGINE.md §12, STYLE_BIBLE §10.2–10.4): an 8 px anchor on the part's top face, a 3 px `annotation`
 * leader with at most one 45° or 90° elbow, a 4 px key bar in the role colour, and 44 px Sora 600 text revealed by a
 * mask sliding out of the key bar (8 px slide) on a ground-aware knockout (drawn by the LabelLayer).
 *
 * Timing from t0 = the word's start: anchor pops t0−6 → t0−2, leader draws t0−5 → t0−1, key bar grows t0−1 → t0+3,
 * text t0 → t0+5 (readable by t0+3), mono secondary from t0+4. Exit (6 frames): the text masks back into the key bar
 * (4), then the leader retracts and the anchor shrinks (2). Tags ride with their anchors; slots interpolate between
 * named shots with the camera key's eased progress.
 */
import React from 'react';
import {COLOR, LABEL2, TYPE} from '../tokens';
import {MONO, SANS} from '../../shared/fonts';
import type {RoleName} from '../../shared/brand';
import {prog} from '../core/ease';
import {f2, lerp} from '../core/math';
import {isPt, type AnchorRef, type Pt, type SRect, type ViewScope} from '../core/types';
import {layerCam, project, type Cam, type Shot, type ShotName} from '../camera/camera';
import {anchorPart, resolveAnchor} from '../world/states';
import type {AnyWorld} from '../world/types';
import {hold, sentenceOfWord, w, type WordId} from '../timeline/words';
import {blockWidth, linesOf, monoTextWidth} from './metrics';
import {RevealText} from './reveal';
import {autoPlacement} from './autoSlot';

export interface TagSpec {
  id: string;
  /** <= 3 words, <= 22 chars per line ('\n' allowed: 2 lines max). */
  text: string;
  /** Mono 34 px (Ep01: only '+5VSB · ATX'). */
  secondary?: string;
  /** Round 1: the frame the secondary line enters (default t0 + LABEL2.secondaryDelay): a technical name may wait for
   *  the words that describe it (Ep01: "+5VSB · ATX" on "a small trickle"). */
  secondaryAt?: number;
  /** Key-bar colour. */
  role: RoleName;
  /** On the part's top face. */
  anchor: AnchorRef;
  /** Round 2: more anchors the same label names (one leader each from the key bar), e.g. "Wake sources" → each source. */
  moreAnchors?: AnchorRef[];
  /** Text block origin (screen px; the key bar's top-left) per shot; between shots it interpolates with the camera key's eased t.
   *  Round 3 (production): optional; omitted = 'auto' (placed from intent at its landing frame, riding with its anchor). */
  slot?: Pt | Record<ShotName, Pt> | 'auto';
  /** Block side relative to the leader end. */
  side?: 'right' | 'left';
  elbow?: 'h' | 'v' | 'none';
  /** The word that names it: land = w(word) (checked ± 3). */
  word: WordId;
  /** Override (rare). */
  land?: number;
  /** 'hold' = hold(land, text, sentence). */
  exitAt: number | 'hold';
  scope?: ViewScope;
  muted?: boolean;
  /** A name inside its part (e.g. "Power supply" in the PSU body). */
  leaderless?: boolean;
  /** Round 1: a documented reason the tag may leave before the hold rule's minimum (e.g. the triptych takes the frame
   *  and its centre band carries the same name on). The tag-sync check reports the reason instead of a violation. */
  holdWaiver?: string;
  /** Round 3 (judges: one small block carried two stacked tags): later names of the SAME thing on the same leader. At
   *  each step the old text fades out (3 frames) and the new one enters word by word; the key bar takes the step's
   *  role; `secondary` becomes the step's subline (e.g. "Always-on logic" → "Lookout" over "always-on logic"). */
  steps?: Array<{at: number; text: string; secondary?: string; role?: RoleName}>;
  /** Round 3: a leaderless heading on its own small opaque card (deck fill, 2 px structure rule) instead of the world
   *  knockout, for a question that heads a pair of plates ("Why different?"). */
  card?: boolean;
}

export interface TagDraw {
  anchor: Pt;
  leader: Pt[];
  /** Round 2: extra anchors and their leaders (moreAnchors). */
  more?: Array<{anchor: Pt; leader: Pt[]}>;
  /** The text block (key bar + text), screen px. */
  box: SRect;
  keyBar: SRect;
  /** Knockout box (grows with the reveal; r 8, LABEL2.platePad). */
  plate: string;
  knockout: SRect;
  textReveal: number;
  leaderDraw: number;
  anchorScale: number;
  opacity: number;
  secondaryReveal: number;
  keyGrow: number;
  textX: number;
  lines: string[];
  /** Width of the text column (the widest line, primary or secondary). */
  textW: number;
  side: 'right' | 'left';
  /** 0..1 exit progress (the group fades and slides toward its key bar). */
  exit?: number;
  /** Round 2: frames since the text started (word-by-word reveal), and since the secondary line started. */
  textAge: number;
  secondaryAge: number;
  /** Round 3 (steps): the current secondary line, the current role, and the previous text fading out. */
  secondary?: string;
  role?: RoleName;
  prev?: {lines: string[]; secondary?: string; opacity: number};
}

export const LINE = TYPE.label * TYPE.lineHeight;
export const SEC_LINE = TYPE.secondary * TYPE.lineHeight;

export const tagLand = (spec: Pick<TagSpec, 'land' | 'word'>): number => spec.land ?? w(spec.word);
/** Round 3: a tag placed from intent (`slot: 'auto'` or no slot at all). */
export const isAutoSlot = (spec: Pick<TagSpec, 'slot'>): boolean => spec.slot === undefined || spec.slot === 'auto';
export const tagExit = (spec: Pick<TagSpec, 'exitAt' | 'land' | 'word' | 'text'>): number =>
  typeof spec.exitAt === 'number' ? spec.exitAt : hold(tagLand(spec), spec.text, sentenceOfWord(spec.word));

/** The tag's slot at this camera (named-shot slots interpolate with the key's eased progress). */
export const slotAt = (slot: TagSpec['slot'], cam: Cam): Pt => {
  if (slot === undefined || slot === 'auto') return [960, 540];
  if (isPt(slot)) return slot;
  const rec = slot as Record<ShotName, Pt>;
  const vals = Object.values(rec);
  const a = cam.from !== undefined ? rec[cam.from] : undefined;
  const b = cam.to !== undefined ? rec[cam.to] : undefined;
  if (cam.moving && a && b) {
    const e = cam.e ?? cam.t;
    return [lerp(a[0], b[0], e), lerp(a[1], b[1], e)];
  }
  return b ?? a ?? vals[0] ?? [960, 540];
};

const leaderPoints = (A: Pt, E: Pt, elbow: TagSpec['elbow']): Pt[] => {
  const dx = E[0] - A[0];
  const dy = E[1] - A[1];
  if (Math.abs(dy) < 3) return [A, E];
  const mode = elbow ?? (Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v');
  if (mode === 'none') return [A, E];
  if (mode === 'h' && Math.abs(dx) > Math.abs(dy)) return [A, [A[0] + Math.sign(dx) * Math.abs(dy), E[1]], E];
  return [A, [A[0], E[1]], E];
};

const polyLen = (pts: Pt[]): number => {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
};

/** Geometry and timing of a tag at a frame (null when not on screen). */
/** `placeCam` (round 2): the camera at the tag's landing frame, for `slot: 'auto'` (default: `cam`). */
export const tagAt = (frame: number, spec: TagSpec, cam: Cam, world: AnyWorld, refShot?: Shot, placeCam?: Cam): TagDraw | null => {
  const t0 = tagLand(spec);
  const ex = tagExit(spec);
  if (frame < t0 + LABEL2.anchorPop[0] || frame >= ex + LABEL2.exitFrames) return null;
  const part = anchorPart(world, spec.anchor);
  const depth = part?.depth ?? 1;
  const ac = depth !== 1 && refShot ? layerCam(cam, depth, refShot) : cam;
  const A = project(ac, resolveAnchor(world, spec.anchor));
  // round 2: an 'auto' slot is an offset from the anchor chosen at the landing frame (autoSlot.ts); it rides with it
  let O = slotAt(spec.slot, cam);
  let autoSide: 'left' | 'right' | undefined;
  if (isAutoSlot(spec)) {
    const pc = placeCam ?? cam;
    const pp = anchorPart(world, spec.anchor);
    const pac = (pp?.depth ?? 1) !== 1 && refShot ? layerCam(pc, pp?.depth ?? 1, refShot) : pc;
    const ap = autoPlacement(spec, project(pac, resolveAnchor(world, spec.anchor)), pc, world, refShot);
    O = [A[0] + ap.dx, A[1] + ap.dy];
    autoSide = ap.side;
  }
  // round 3: the step in effect (a later name of the same thing) and the one it replaced
  type Step = {at: number; text: string; secondary?: string; role?: RoleName};
  const all: Step[] = [{at: t0, text: spec.text, secondary: spec.secondary, role: spec.role}, ...(spec.steps ?? [])];
  let cur = all[0];
  let prevStep: Step | null = null;
  for (const st of all.slice(1)) {
    if (st.at > frame) break;
    prevStep = cur;
    cur = st;
  }
  const stepped = cur !== all[0];
  const lines = linesOf(cur.text);
  const textW0 = blockWidth(cur.text, TYPE.label, 600);
  const secW0 = cur.secondary ? monoTextWidth(cur.secondary, TYPE.secondary) : 0;
  const inStep = stepped && prevStep !== null && frame - cur.at < 6;
  const prevW = inStep && prevStep ? Math.max(blockWidth(prevStep.text, TYPE.label, 600), prevStep.secondary ? monoTextWidth(prevStep.secondary, TYPE.secondary) : 0) : 0;
  const textW = Math.max(textW0, inStep ? prevW : 0);
  const secW = secW0;
  const prevH = inStep && prevStep ? linesOf(prevStep.text).length * LINE + (prevStep.secondary ? SEC_LINE : 0) : 0;
  // a stepped tag keeps one layout height too (its tallest step), so its leader's end never moves
  const textH = Math.max(lines.length * LINE + (cur.secondary ? SEC_LINE : 0), prevH, ...(spec.steps && spec.steps.length ? all.map((st) => linesOf(st.text).length * LINE + (st.secondary ? SEC_LINE : 0)) : []));
  const side = autoSide ?? spec.side ?? 'right';
  // round 3: a stepped tag keeps ONE layout width (its widest step), so its key bar and leader never jump at a step
  const maxW = Math.max(
    textW,
    secW,
    ...(spec.steps ?? []).map((st) => Math.max(blockWidth(st.text, TYPE.label, 600), st.secondary ? monoTextWidth(st.secondary, TYPE.secondary) : 0)),
    spec.steps && spec.steps.length ? blockWidth(spec.text, TYPE.label, 600) : 0,
  );
  const fullW = LABEL2.keyBar + LABEL2.keyGap + maxW;
  // right: [key bar][gap][text]; left (mirrored): [text][gap][key bar], the text revealed leftward out of the bar
  const keyX = side === 'right' ? O[0] : O[0] + maxW + LABEL2.keyGap;
  const textX = side === 'right' ? O[0] + LABEL2.keyBar + LABEL2.keyGap : O[0];
  const E: Pt = side === 'right' ? [keyX, O[1] + textH / 2] : [keyX + LABEL2.keyBar, O[1] + textH / 2];
  const leader = spec.leaderless ? [] : leaderPoints(A, E, spec.elbow);
  const more = (spec.moreAnchors ?? []).map((ma) => {
    const mp = anchorPart(world, ma);
    const mc = (mp?.depth ?? 1) !== 1 && refShot ? layerCam(cam, mp?.depth ?? 1, refShot) : cam;
    const MA = project(mc, resolveAnchor(world, ma));
    return {anchor: MA, leader: leaderPoints(MA, E, spec.elbow)};
  });

  // timing: the group enters as one unit (anchor + leader inside the 4 frames that start the text) and exits as one
  // unit (a fade with a slide toward the key bar: no mask, so no clipped half-words)
  const anchorIn = prog(frame, t0 + LABEL2.anchorPop[0], LABEL2.anchorPop[1] - LABEL2.anchorPop[0], 'arrive');
  const leaderIn = prog(frame, t0 + LABEL2.leaderDraw[0], LABEL2.leaderDraw[1] - LABEL2.leaderDraw[0], 'arrive');
  const keyIn = prog(frame, t0 - 1, 4, 'arrive');
  const textIn = prog(frame, t0 + LABEL2.textIn[0], LABEL2.textIn[1] - LABEL2.textIn[0], 'roll');
  const secStart = stepped ? cur.at + 2 + LABEL2.secondaryDelay : spec.secondaryAt ?? t0 + LABEL2.secondaryDelay;
  const secIn = prog(frame, secStart, 5, 'roll');
  const out = prog(frame, ex, LABEL2.exitFrames, 'exit');
  const keep = 1 - out;
  const reveal = textIn;
  const grow = spec.leaderless ? Math.min(reveal, keep) : Math.min(keyIn, keep);
  const knockW = LABEL2.keyBar + LABEL2.keyGap + Math.max(textW * reveal, secW * secIn);
  const knockX = side === 'right' ? O[0] - LABEL2.platePad : O[0] + fullW + LABEL2.platePad - knockW - 2 * LABEL2.platePad;
  return {
    anchor: A,
    leader,
    more,
    box: {x: O[0], y: O[1], w: fullW, h: textH},
    keyBar: {x: keyX, y: O[1], w: LABEL2.keyBar, h: textH},
    plate: 'knockout',
    knockout: {x: knockX, y: O[1] - LABEL2.platePad, w: knockW + 2 * LABEL2.platePad, h: textH + 2 * LABEL2.platePad, r: 8},
    textReveal: reveal,
    leaderDraw: Math.min(leaderIn, keep),
    anchorScale: Math.min(anchorIn, keep),
    opacity: keep,
    secondaryReveal: secIn,
    keyGrow: grow,
    textX,
    lines,
    textW: maxW,
    side,
    exit: out,
    textAge: stepped ? frame - (cur.at + 2) : frame - (t0 + LABEL2.textIn[0]),
    secondaryAge: frame - secStart,
    secondary: cur.secondary,
    role: cur.role ?? spec.role,
    prev: inStep && prevStep ? {lines: linesOf(prevStep.text), secondary: prevStep.secondary, opacity: 1 - prog(frame, cur.at, 3, 'exit')} : undefined,
  };
};

const textStyle = (muted?: boolean): React.CSSProperties => ({
  position: 'absolute',
  fontFamily: SANS,
  fontWeight: 600,
  fontSize: TYPE.label,
  lineHeight: TYPE.lineHeight,
  color: muted ? COLOR.textMuted : COLOR.ink,
  whiteSpace: 'pre',
});

/** HTML text (absolute divs), SVG anchor / leader / key bar. Draw inside a full-frame container. */
export const roleKeyColor = (role: RoleName | undefined): string =>
  role === 'info' ? COLOR.info : role === 'energy' ? COLOR.energy : role === 'standby' ? COLOR.energyStandby : role === 'emphasis' ? COLOR.emphasis : role === 'muted' ? COLOR.structure : role === 'alert' ? COLOR.alert : role === 'annotation' ? COLOR.annotation : COLOR.ink;

export const Tag2: React.FC<{draw: TagDraw; spec: TagSpec}> = ({draw, spec}) => {
  const d = draw;
  const key = roleKeyColor(d.role ?? spec.role);
  const secondary = d.secondary ?? spec.secondary;
  const L = polyLen(d.leader);
  const a = LABEL2.anchor * (d.exit ? 1 : d.anchorScale);
  const groupOp = d.opacity;
  // exit: the text slides toward its key bar while the whole group fades
  const exitShift = (d.side === 'right' ? -1 : 1) * LABEL2.exitSlide * (d.exit ?? 0);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: groupOp < 1 ? groupOp : undefined}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {d.leader.length > 1 && d.leaderDraw > 0 ? (
          <path
            d={d.leader.map((p, i) => `${i ? 'L' : 'M'}${f2(p[0])} ${f2(p[1])}`).join('')}
            fill="none"
            stroke={COLOR.annotation}
            strokeWidth={LABEL2.leader}
            strokeLinejoin="round"
            strokeDasharray={d.leaderDraw < 1 ? `${L * d.leaderDraw} ${L + 10}` : undefined}
          />
        ) : null}
        {!spec.leaderless && a > 0.2 ? <rect x={d.anchor[0] - a / 2} y={d.anchor[1] - a / 2} width={a} height={a} fill={COLOR.annotation} /> : null}
        {(d.more ?? []).map((m, i) => {
          const ml = polyLen(m.leader);
          return d.leaderDraw > 0 ? (
            <g key={`more${i}`}>
              <path
                d={m.leader.map((p, j) => `${j ? 'L' : 'M'}${f2(p[0])} ${f2(p[1])}`).join('')}
                fill="none"
                stroke={COLOR.annotation}
                strokeWidth={LABEL2.leader}
                strokeLinejoin="round"
                strokeDasharray={d.leaderDraw < 1 ? `${ml * d.leaderDraw} ${ml + 10}` : undefined}
              />
              {a > 0.2 ? <rect x={m.anchor[0] - a / 2} y={m.anchor[1] - a / 2} width={a} height={a} fill={COLOR.annotation} /> : null}
            </g>
          ) : null;
        })}
        {d.keyGrow > 0 ? (
          <rect
            x={d.keyBar.x}
            y={d.keyBar.y + (d.keyBar.h * (1 - d.keyGrow)) / 2}
            width={d.keyBar.w}
            height={d.keyBar.h * d.keyGrow}
            fill={key}
          />
        ) : null}
      </svg>
      {d.prev && d.prev.opacity > 0.01 ? (
        <div
          style={{
            ...textStyle(spec.muted),
            left: d.textX,
            top: d.box.y,
            width: d.textW,
            textAlign: d.side === 'right' ? 'left' : 'right',
            opacity: d.prev.opacity,
          }}
        >
          {d.prev.lines.join('\n')}
        </div>
      ) : null}
      {d.textReveal > 0 ? (
        <div
          style={{
            ...textStyle(spec.muted),
            left: d.textX,
            top: d.box.y,
            width: d.textW,
            textAlign: d.side === 'right' ? 'left' : 'right',
            transform: exitShift ? `translateX(${f2(exitShift)}px)` : undefined,
          }}
        >
          <RevealText text={d.lines.join('\n')} age={d.textAge} />
        </div>
      ) : null}
      {secondary && d.secondaryReveal > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: d.textX,
            top: d.box.y + d.lines.length * LINE,
            width: d.textW,
            textAlign: d.side === 'right' ? 'left' : 'right',
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: TYPE.secondary,
            lineHeight: TYPE.lineHeight,
            color: COLOR.textMuted,
            whiteSpace: 'pre',
            transform: exitShift ? `translateX(${f2(exitShift)}px)` : undefined,
          }}
        >
          <RevealText text={secondary} age={d.secondaryAge} />
        </div>
      ) : null}
    </div>
  );
};
