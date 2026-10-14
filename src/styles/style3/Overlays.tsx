/**
 * Screen-space overlays of the Living Schematic:
 *   HeaderSlot   the one time/state slot at the header zone's left end (x 144): "After the press", "Soft-off",
 *                "When pressed", "Intel desktop", "Now" (44 px while it carries the meaning, then 34 px, 2 px rule)
 *   PreviewFrame the 6 px dashed ink frame inset 24 px: "the map is showing a time other than now"
 *   Readout      the "0 instructions" readout (64 px numeral, 38 px unit, mono)
 *   KeyPlan      the text-free drafting key plan with a live hatched viewport box (only while zoomed)
 */
import React from 'react';
import {EASE, LABEL, LAYOUT, MONO, SANS, TYPE, clamp01, lerp, polyPath, progress, trackFromPoints, type Pt} from '../../shared';
import {unapply, type Cam} from './camera';
import * as M from './map';
import {FILL, T} from './theme';

/* ------------------------------------------------------------------------------------------------ header */
export interface HeaderEntry {
  at: number;
  label: string;
  /** Start size (default 44). */
  size?: number;
  shrinkAt?: number;
  /** Exit (6 frames). Omit when the next entry replaces it in place. */
  outAt?: number;
}

export const HeaderSlot: React.FC<{frame: number; timeline: HeaderEntry[]}> = ({frame, timeline}) => {
  let c = -1;
  for (let i = 0; i < timeline.length; i++) if (timeline[i].at <= frame) c = i;
  if (c < 0) return null;
  const cur = timeline[c];
  const prev = c > 0 ? timeline[c - 1] : null;
  const changeMode = prev !== null && (prev.outAt === undefined || prev.outAt >= cur.at);
  const sizeOf = (e: HeaderEntry) => {
    const big = e.size ?? TYPE.headerActive;
    return e.shrinkAt !== undefined ? lerp(big, TYPE.header, progress(frame, e.shrinkAt, 6, EASE.move)) : big;
  };
  let newIn = changeMode ? progress(frame, cur.at + 1, 5, EASE.arrive) : progress(frame, cur.at, 5, EASE.arrive);
  if (cur.outAt !== undefined && frame >= cur.outAt) newIn *= 1 - progress(frame, cur.outAt, 6, EASE.exit);
  const oldOut = changeMode && prev ? 1 - progress(frame, cur.at, 2, EASE.exit) : 0;
  const block = (e: HeaderEntry, opacity: number, dx: number, key: string) =>
    opacity <= 0 ? null : (
      <div key={key} style={{position: 'absolute', left: 0, top: 0, opacity, transform: `translateX(${dx}px)`}}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: sizeOf(e),
            lineHeight: TYPE.lineHeight,
            letterSpacing: TYPE.headerTracking,
            color: T.ink,
            whiteSpace: 'nowrap',
            paddingBottom: LABEL.headerRuleGap,
            borderBottom: `${LABEL.headerRule}px solid ${T.annotation}`,
            display: 'inline-block',
          }}
        >
          {e.label}
        </div>
      </div>
    );
  return (
    <foreignObject x={LAYOUT.header.x0} y={LAYOUT.header.y0} width={800} height={110} style={{overflow: 'visible'}}>
      <div style={{position: 'relative', width: 800, height: 110}}>
        {prev && oldOut > 0 ? block(prev, oldOut, 0, 'old') : null}
        {block(cur, newIn, -(1 - progress(frame, changeMode ? cur.at + 1 : cur.at, 5, EASE.arrive)) * LABEL.slide, 'new')}
      </div>
    </foreignObject>
  );
};

/* ------------------------------------------------------------------------------------------------ preview frame */
const INSET = 24;
const FRAME_PTS: Pt[] = [
  [INSET, INSET],
  [1920 - INSET, INSET],
  [1920 - INSET, 1080 - INSET],
  [INSET, 1080 - INSET],
  [INSET, INSET],
];
const FRAME_TRACK = trackFromPoints(FRAME_PTS);

/** The dashed preview frame: draws clockwise from the top left over 8 frames, un-draws back counter-clockwise. */
export const PreviewFrame: React.FC<{frame: number; spans: Array<{in: number; out: number; outFrames?: number}>}> = ({frame, spans}) => {
  let amount = 0;
  for (const s of spans) {
    if (frame < s.in) continue;
    const a = progress(frame, s.in, 8, EASE.arrive);
    const b = 1 - progress(frame, s.out, s.outFrames ?? 10, EASE.move);
    amount = Math.max(amount, Math.min(a, b));
  }
  if (amount <= 0) return null;
  const L = FRAME_TRACK.length * amount;
  const pts: Pt[] = [FRAME_PTS[0]];
  for (let i = 1; i < FRAME_TRACK.pts.length; i++) {
    if (FRAME_TRACK.cum[i] < L) pts.push(FRAME_TRACK.pts[i]);
    else break;
  }
  const e = FRAME_TRACK.at(L);
  pts.push([e.x, e.y]);
  return <path d={polyPath(pts)} fill="none" stroke={T.ink} strokeWidth={6} strokeDasharray="24 16" strokeLinejoin="miter" />;
};

/* ------------------------------------------------------------------------------------------------ readout */
export const Readout: React.FC<{frame: number; x: number; y: number; inAt: number; outAt: number}> = ({frame, x, y, inAt, outAt}) => {
  if (frame < inAt) return null;
  const op = progress(frame, inAt, 5, EASE.arrive) * (1 - progress(frame, outAt, 6, EASE.exit));
  if (op <= 0) return null;
  return (
    <foreignObject x={x} y={y} width={600} height={100} style={{overflow: 'visible'}}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          gap: 14,
          padding: '2px 10px',
          borderRadius: LABEL.plateRadius,
          background: 'rgba(238, 242, 247, 0.9)',
          opacity: op,
          transform: `translateX(${-(1 - progress(frame, inAt, 5, EASE.arrive)) * LABEL.slide}px)`,
        }}
      >
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: TYPE.readout, lineHeight: 1.05, color: T.ink}}>0</span>
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: TYPE.unit, lineHeight: 1.05, color: T.ink}}>instructions</span>
      </div>
    </foreignObject>
  );
};

/* ------------------------------------------------------------------------------------------------ key plan */
/**
 * Where the key plan sits: under the breadcrumb at the left of the header block ("when", then "where" in words,
 * then "where" as a picture). Review fix: at the header zone's right end (812, 108) it landed on the CPU's corner
 * at Power path and read as a hatched part on the processor; this spot stays clear of the map at Power path, during
 * the push, pull-back and glide, and through the S12 ride.
 */
const KP = {x0: 152, y0: 224, w: 136, h: 68};
const kpScale = Math.min(KP.w / M.MAP_BOX.w, KP.h / M.MAP_BOX.h);
const kp = (p: Pt): Pt => [KP.x0 + (p[0] - M.MAP_BOX.x) * kpScale, KP.y0 + (p[1] - M.MAP_BOX.y) * kpScale];
const kpRect = (b: M.Rect): M.Rect => {
  const [x, y] = kp([b.x, b.y]);
  return {x, y, w: b.w * kpScale, h: b.h * kpScale, r: 1.5};
};

/** The drafting key plan: a text-free silhouette of the map with a live hatched viewport box (only while zoomed). */
export const KeyPlan: React.FC<{frame: number; cam: Cam}> = ({cam}) => {
  // tied to the camera (fades in as the zoom passes x1.2), never to a separate clock
  const vis = clamp01((cam.s - 1.2) / 0.15);
  if (vis <= 0) return null;
  const tl = unapply(cam, [0, 0]);
  const br = unapply(cam, [1920, 1080]);
  const a = kp([Math.max(M.MAP_BOX.x, tl[0]), Math.max(M.MAP_BOX.y, tl[1])]);
  const b = kp([Math.min(M.MAP_BOX.x + M.MAP_BOX.w, br[0]), Math.min(M.MAP_BOX.y + M.MAP_BOX.h, br[1])]);
  const vx = a[0];
  const vy = a[1];
  const vw = Math.max(4, b[0] - a[0]);
  const vh = Math.max(4, b[1] - a[1]);
  const parts = [M.BOARD, M.CPU, M.CHIPSET, M.PSU, M.FRONT, M.MONITOR];
  const hatch: string[] = [];
  for (let c = -vh; c < vw; c += 10) hatch.push(`M${vx + c} ${vy + vh}L${vx + c + vh} ${vy}`);
  return (
    <g opacity={vis}>
      <rect x={KP.x0 - 8} y={KP.y0 - 6} width={KP.w + 16} height={KP.h + 12} rx={6} fill={T.panel} opacity={0.96} />
      {parts.map((p, i) => {
        const r = kpRect(p);
        return <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} rx={1.5} fill="none" stroke={T.ink} strokeWidth={1.5} opacity={i === 0 ? 0.55 : 0.8} />;
      })}
      <clipPath id="kp-view">
        <rect x={vx} y={vy} width={vw} height={vh} />
      </clipPath>
      <g clipPath="url(#kp-view)">
        <path d={hatch.join('')} stroke={T.ink} strokeWidth={1.2} opacity={0.35} />
      </g>
      <rect x={vx} y={vy} width={vw} height={vh} fill="none" stroke={T.ink} strokeWidth={3} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------ breadcrumb */
/**
 * The style's own breadcrumb: the named zoom levels, under the time slot ("where" under "when").
 * 30 px sans, the parent levels in muted grey, the current level in ink, vector chevrons. Each segment is tied
 * to the camera's scale (it appears as the zoom passes into its level), so it never moves on its own.
 */
const LEVELS = [
  {name: 'System', from: 0},
  {name: 'Power path', from: 1.3},
  {name: 'Chipset', from: 2.05},
];
export const Breadcrumb: React.FC<{frame: number; cam: Cam; inAt: number}> = ({frame, cam, inAt}) => {
  const enter = progress(frame, inAt, 5, EASE.arrive);
  if (enter <= 0) return null;
  const seg = LEVELS.map((l, i) => (i === 0 ? 1 : clamp01((cam.s - l.from) / 0.12)));
  let current = 0;
  seg.forEach((v, i) => {
    if (v >= 0.5) current = i;
  });
  const size = TYPE.chip; // 30 px (the floor), supporting text
  return (
    <foreignObject x={LAYOUT.header.x0} y={154} width={900} height={44} style={{overflow: 'visible'}}>
      <div style={{display: 'flex', alignItems: 'center', height: 40, opacity: enter}}>
        {LEVELS.map((l, i) =>
          seg[i] <= 0 ? null : (
            <div key={l.name} style={{display: 'flex', alignItems: 'center', opacity: seg[i], transform: `translateX(${-(1 - seg[i]) * 8}px)`}}>
              {i > 0 ? (
                <svg width={26} height={20} style={{display: 'block', flex: 'none'}}>
                  <path d="M9 4L16 10L9 16" fill="none" stroke={T.structure} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
              <div
                style={{
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: size,
                  lineHeight: 1.15,
                  color: i === current ? T.ink : T.textMuted,
                  whiteSpace: 'nowrap',
                }}
              >
                {l.name}
              </div>
            </div>
          ),
        )}
      </div>
    </foreignObject>
  );
};

export const kpVisible = (cam: Cam): number => clamp01((cam.s - 1.2) / 0.15);
export const FILL_USED = FILL;
