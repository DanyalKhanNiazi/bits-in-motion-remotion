/**
 * The Lens: a thin ring with 4 inward ticks that opens over 9 frames and clips its children
 * (the same scene's hidden layer, x-ray; or its true geometry at ×4–×8, magnify; or a moment, time mode).
 *
 * Timing (absolute frames):
 *   openAt      ring draws clockwise from 12 o'clock, radius 70 → 100% (cubic ease-out), content fades in
 *               over frames 3–9, ticks pop at 6–8 (scale chip with them)
 *   settleAt    D24 settle / hand-over: ring + ticks fade to a grey rim over `settleFrames` (default 6),
 *               the magnified view stays open. Then fill the "?" (StateGlyph state="UNNAMED" fillAt=671).
 *   diveAt      16-frame dive: radius grows to cover the frame, ring fades over the last 5 frames
 *   surfaceAt   14-frame surface (reverse of a dive) instead of openAt
 *   closeAt     6 frames: radius 100 → 85%, opacity 1 → 0 (ease-in)
 *
 * Usage:
 *   <LensRing cx={1400} cy={420} openAt={197} settleAt={663} closeAt={900} chip="×4"
 *             target={[1100, 640]} zoom={{k: 4, at: [1100, 640]}}>
 *     <MyChipsetInside />   // drawn in frame space; zoom scales it about `at` into the ring
 *   </LensRing>
 */
import React from 'react';
import {interpolateColors} from 'remotion';
import {LENS, TYPE, LAYOUT} from '../brand';
import {useKit, useSvgId, type KitBaseProps} from '../context';
import {MONO, monoWidth} from '../fonts';
import {circlePath, linePath, rectPath, squarePath, type Pt} from '../geom';
import {clamp01, EASE, lerp} from '../motion';

export interface LensState {
  visible: boolean;
  cx: number;
  cy: number;
  /** Current radius (px). */
  r: number;
  /** Clip radius for the content. */
  clipR: number;
  /** Fraction of the ring drawn (clockwise from 12). */
  draw: number;
  ringColor: string;
  ringWidth: number;
  ringOpacity: number;
  ticks: number;
  content: number;
  chip: number;
  leader: number;
  /** 0 → 1 settle progress (D24). */
  settle: number;
  /** Whole-lens opacity (close). */
  opacity: number;
}

export interface LensRingProps extends KitBaseProps {
  cx: number;
  cy: number;
  /** Diameter (default 360; brand range 300–420, at most 40% of frame height). */
  d?: number;
  openAt?: number;
  surfaceAt?: number;
  settleAt?: number;
  settleFrames?: number;
  diveAt?: number;
  closeAt?: number;
  /** 'xray' (same coordinates, no leader), 'magnify' (×4–×8, leader + scale chip), 'time' (Signal Score). */
  mode?: 'xray' | 'magnify' | 'time';
  /** Chip text outside the ring at 4:30, e.g. "×4" or "Not to scale" (mono 30 px). */
  chip?: string;
  /** Magnify: a 3 px leader (emphasis 70%) from the ring to a 10 px target square on the object. */
  target?: Pt;
  /** Scale the children by k about `at` and centre that point in the ring. */
  zoom?: {k: number; at: Pt};
  /** Fill behind the content inside the ring (default: theme.surface; null for none). */
  interior?: string | null;
  /** Ring in neutral ink (colour-physics scenes). */
  neutral?: boolean;
  /** Grey of the settled rim (default theme.structure). */
  rimColor?: string;
  children?: React.ReactNode;
  /** Replace the ring drawing (ring, ticks, chip, leader); the content clip stays the kit's. */
  renderRing?: (s: LensState) => React.ReactNode;
}

const coverRadius = (cx: number, cy: number): number =>
  Math.max(
    Math.hypot(cx, cy),
    Math.hypot(LAYOUT.width - cx, cy),
    Math.hypot(cx, LAYOUT.height - cy),
    Math.hypot(LAYOUT.width - cx, LAYOUT.height - cy),
  );

export const lensState = (frame: number, p: LensRingProps, emphasis: string, rim: string): LensState => {
  const R = (p.d ?? LENS.d) / 2;
  const start = p.openAt ?? p.surfaceAt;
  const st: LensState = {
    visible: false,
    cx: p.cx,
    cy: p.cy,
    r: R,
    clipR: R,
    draw: 1,
    ringColor: emphasis,
    ringWidth: LENS.stroke,
    ringOpacity: 1,
    ticks: 1,
    content: 1,
    chip: 1,
    leader: 1,
    settle: 0,
    opacity: 1,
  };
  if (start === undefined || frame < start) return st;
  st.visible = true;
  const Rc = coverRadius(p.cx, p.cy);
  if (p.openAt !== undefined) {
    const t = frame - p.openAt;
    const e = EASE.outCubic(clamp01(t / LENS.open));
    st.r = R * lerp(LENS.openRadiusFrom, 1, e);
    st.draw = e;
    st.content = clamp01((t - LENS.contentFrom) / (LENS.open - LENS.contentFrom));
    st.ticks = clamp01((t - LENS.ticksFrom) / (LENS.ticksTo - LENS.ticksFrom));
    st.chip = st.ticks;
    st.leader = e;
  } else if (p.surfaceAt !== undefined) {
    const t = frame - p.surfaceAt;
    const e = EASE.move(clamp01(t / LENS.surface));
    st.r = lerp(Rc, R, e);
    st.ringOpacity = clamp01((t - (LENS.surface - 5)) / 5);
    st.ticks = clamp01((t - (LENS.surface - 2)) / 2);
    st.chip = st.ticks;
    st.leader = st.ticks;
  }
  if (p.settleAt !== undefined) {
    const s = clamp01((frame - p.settleAt) / (p.settleFrames ?? LENS.settle));
    st.settle = s;
    st.ringColor = s > 0 ? interpolateColors(s, [0, 1], [emphasis, rim]) : emphasis;
    st.ringWidth = lerp(LENS.stroke, LENS.rimStroke, s);
    st.ticks *= 1 - s;
    st.leader *= 1 - s;
  }
  if (p.diveAt !== undefined && frame >= p.diveAt) {
    const t = frame - p.diveAt;
    const e = EASE.move(clamp01(t / LENS.dive));
    st.r = lerp(R, Rc, e);
    st.ringOpacity *= 1 - clamp01((t - (LENS.dive - 5)) / 5);
    st.ticks *= 1 - clamp01(t / 4);
    st.chip *= 1 - clamp01(t / 4);
    st.leader *= 1 - clamp01(t / 4);
  }
  if (p.closeAt !== undefined && frame >= p.closeAt) {
    const t = frame - p.closeAt;
    if (t >= LENS.close) {
      st.visible = false;
      return st;
    }
    const e = EASE.inCubic(clamp01(t / LENS.close));
    st.r *= lerp(1, LENS.closeRadiusTo, e);
    st.opacity = 1 - e;
  }
  st.clipR = st.r;
  return st;
};

export const LensRing: React.FC<LensRingProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const clipId = useSvgId('lens');
  const emphasis = p.neutral ? theme.ink : theme.emphasis;
  const rim = p.rimColor ?? theme.structure;
  const s = lensState(frame, p, emphasis, rim);
  if (!s.visible) return null;
  const seed = p.seed ?? 'lens';
  const {cx, cy, r} = s;
  const circle = circlePath(cx, cy, r);
  const C = 2 * Math.PI * r;
  const interior = p.interior === undefined ? theme.surface : p.interior;
  const zoomT = p.zoom
    ? `translate(${cx} ${cy}) scale(${p.zoom.k}) translate(${-p.zoom.at[0]} ${-p.zoom.at[1]})`
    : undefined;

  // magnify leader from the ring edge to the target
  let leader: React.ReactNode = null;
  if (p.target && (p.mode ?? (p.zoom ? 'magnify' : 'xray')) === 'magnify' && s.leader > 0) {
    const dx = p.target[0] - cx;
    const dy = p.target[1] - cy;
    const L = Math.hypot(dx, dy);
    if (L > r + LENS.target) {
      const a: Pt = [cx + (dx / L) * r, cy + (dy / L) * r];
      const b: Pt = [p.target[0] - (dx / L) * (LENS.target / 2), p.target[1] - (dy / L) * (LENS.target / 2)];
      const lineD = linePath(a, b);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      leader = (
        <g opacity={s.opacity}>
          {skin.stroke({d: lineD, color: s.ringColor, width: LENS.leader, opacity: LENS.leaderOpacity, trim: [0, len * s.leader], role: 'emphasis', seed: `${seed}:leader`, frame})}
          {s.leader > 0.95
            ? skin.stroke({d: squarePath(p.target[0], p.target[1], LENS.target, 1), color: s.ringColor, width: 2, opacity: LENS.leaderOpacity, role: 'emphasis', seed: `${seed}:target`, frame})
            : null}
        </g>
      );
    }
  }

  // chip at 4:30
  let chip: React.ReactNode = null;
  if (p.chip && s.chip > 0) {
    const ang = ((LENS.chipAngleDeg - 90) * Math.PI) / 180;
    const ax = cx + Math.cos(ang) * (r + 10);
    const ay = cy + Math.sin(ang) * (r + 10);
    const fs = TYPE.chip;
    const w = monoWidth(p.chip, fs) + 20;
    const h = Math.round(fs * 1.15) + 8;
    chip = (
      <g opacity={s.chip * s.opacity}>
        {skin.fill({d: rectPath(ax, ay, w, h, 8), color: theme.panel, role: 'plate', seed: `${seed}:chipbg`, frame})}
        {skin.stroke({d: rectPath(ax, ay, w, h, 8), color: theme.structure, width: 2, role: 'glyph', seed: `${seed}:chip`, frame})}
        <text
          x={ax + w / 2}
          y={ay + h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          style={{fontFamily: MONO, fontWeight: 500, fontSize: fs}}
          fill={theme.ink}
        >
          {p.chip}
        </text>
      </g>
    );
  }

  const ring = p.renderRing ? (
    p.renderRing(s)
  ) : (
    <g opacity={s.opacity}>
      {skin.stroke({
        d: circle,
        color: s.ringColor,
        width: s.ringWidth,
        opacity: s.ringOpacity,
        trim: s.draw < 1 ? [0, C * s.draw] : undefined,
        role: s.settle >= 1 ? 'rim' : 'emphasis',
        seed: `${seed}:ring`,
        frame,
        cap: 'butt',
      })}
      {s.ticks > 0
        ? [0, 90, 180, 270].map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180;
            const len = LENS.tickLength * s.ticks;
            const p0: Pt = [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
            const p1: Pt = [cx + Math.cos(a) * (r - len), cy + Math.sin(a) * (r - len)];
            return (
              <React.Fragment key={deg}>
                {skin.stroke({d: linePath(p0, p1), color: s.ringColor, width: LENS.tickWidth, opacity: s.ticks * s.ringOpacity, role: 'tick', seed: `${seed}:tick${deg}`, frame, cap: 'butt'})}
              </React.Fragment>
            );
          })
        : null}
    </g>
  );

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <circle cx={cx} cy={cy} r={Math.max(0, s.clipR - s.ringWidth / 2)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} opacity={s.content * s.opacity}>
        {interior ? <rect x={cx - s.clipR} y={cy - s.clipR} width={s.clipR * 2} height={s.clipR * 2} fill={interior} /> : null}
        {zoomT ? <g transform={zoomT}>{p.children}</g> : p.children}
      </g>
      {leader}
      {ring}
      {chip}
    </g>
  );
};
