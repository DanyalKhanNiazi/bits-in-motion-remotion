/**
 * Style 5 versions of two brand devices, so they work through panel views:
 *   Channel5  the double-walled energy channel (main 18 px = 2+14+2, standby 10 px = 2+6+2), fill-front from the
 *             source, drain, slow shimmer; widths scale with the view but walls stay 2 px
 *   Lens5     the brand Lens opening a round ×4 inset panel: leader to a 10 px target first, ring draws clockwise
 *             from 12 o'clock (radius 70→100%, 9 frames), ticks at 6–8, scale chip at 4:30, a 6 px knockout
 *             border in the page colour; D24 settle: ring + ticks fade to a 3 px grey rim while the view stays open
 */
import React from 'react';
import {LENS, MONO, TYPE, flattenPath, lensState, linePath, monoWidth, offsetPolyline, pathLength, rectPath, routePath, squarePath, useSvgId, type Pt} from '../../shared';
import {D, TONE, circ, poly} from './look';

const SPEC = {
  main: {outer: 18, wall: 2, fill: 14, shimmer: 2},
  standby: {outer: 10, wall: 2, fill: 6, shimmer: 1},
} as const;

export const Channel5: React.FC<{
  pts: ReadonlyArray<Pt>;
  kind: 'main' | 'standby';
  s?: number;
  /** filled fraction from the source (0 empty, 1 full) */
  front?: number;
  /** 0..1 drained */
  drain?: number;
  /** 0..1 shimmer visibility */
  shimmer?: number;
  frame: number;
  fillColor?: string;
  wallColor?: string;
  opacity?: number;
}> = ({pts, kind, s = 1, front = 0, drain = 0, shimmer = 0, frame, fillColor, wallColor, opacity = 1}) => {
  const sp = SPEC[kind];
  const d = routePath(pts, 10 * s);
  const poly0 = flattenPath(d)[0];
  if (!poly0) return null;
  const centre = poly0.pts;
  const off = Math.max(1, (sp.outer * s) / 2 - sp.wall / 2);
  const left = poly(offsetPolyline(centre, off));
  const right = poly(offsetPolyline(centre, -off));
  const fw = Math.max(1.5, sp.outer * s - 2 * sp.wall);
  const Lh = pathLength(d);
  const fc = fillColor ?? (kind === 'standby' ? D.energyStandby : D.energy);
  const fillOp = 1 - drain;
  const f = Math.max(0, Math.min(1, front)) * Lh;
  const edge = 8;
  return (
    <g opacity={opacity}>
      {f > 0 && fillOp > 0 ? (
        <path d={d} fill="none" stroke={fc} strokeWidth={fw} strokeOpacity={fillOp} strokeLinejoin="round" strokeDasharray={f < Lh ? `${f} ${Lh + 50}` : undefined} />
      ) : null}
      {f > 0 && f < Lh && fillOp > 0
        ? [0.6, 0.35, 0.15].map((o, i) => (
            <path key={i} d={d} fill="none" stroke={fc} strokeWidth={fw} strokeOpacity={o * fillOp} strokeDasharray={`0 ${f + edge * i} ${edge} ${Lh + 60}`} />
          ))
        : null}
      {shimmer > 0 && f >= Lh && fillOp > 0 ? (
        <path
          d={d}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={fw}
          strokeOpacity={0.14 * shimmer * fillOp}
          strokeDasharray="90 90"
          strokeDashoffset={-frame * sp.shimmer}
        />
      ) : null}
      <path d={left} fill="none" stroke={wallColor ?? D.structure} strokeWidth={sp.wall} strokeLinejoin="round" />
      <path d={right} fill="none" stroke={wallColor ?? D.structure} strokeWidth={sp.wall} strokeLinejoin="round" />
    </g>
  );
};

export const Lens5: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  d?: number;
  openAt: number;
  leaderAt: number;
  closeAt?: number;
  settleAt?: number;
  target: Pt;
  chip?: string;
  interior?: string;
  children?: React.ReactNode;
}> = ({frame, cx, cy, d = 300, openAt, leaderAt, closeAt, settleAt, target, chip = '×4', interior = TONE.pcb, children}) => {
  const clipId = useSvgId('lens5');
  if (frame < leaderAt) return null;
  const st = lensState(frame, {cx, cy, d, openAt, closeAt, settleAt}, D.emphasis, D.annotation);
  const R = d / 2;
  // leader: drawn from the ring's edge to the target before the ring opens, then held; fades with the settle/close
  const dx = target[0] - cx;
  const dy = target[1] - cy;
  const Ld = Math.hypot(dx, dy);
  const a: Pt = [cx + (dx / Ld) * (R + 2), cy + (dy / Ld) * (R + 2)];
  const b: Pt = [target[0] - (dx / Ld) * 5, target[1] - (dy / Ld) * 5];
  const span = Math.max(1, openAt - leaderAt);
  const lt = Math.min(1, (frame - leaderAt + 1) / span);
  const leaderOp = (1 - st.settle) * (st.visible ? st.opacity : frame < openAt ? 1 : 0);
  const llen = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const leader =
    leaderOp > 0 ? (
      <g opacity={leaderOp}>
        <path d={linePath(a, b)} stroke={D.emphasis} strokeOpacity={LENS.leaderOpacity} strokeWidth={LENS.leader} fill="none" strokeDasharray={`${llen * lt} ${llen + 10}`} />
        {lt >= 1 ? <path d={squarePath(target[0], target[1], LENS.target, 1)} fill="none" stroke={D.emphasis} strokeOpacity={LENS.leaderOpacity} strokeWidth={2} /> : null}
      </g>
    ) : null;
  if (!st.visible) return leader;
  const r = st.r;
  const C = 2 * Math.PI * r;
  const ring = circ(cx, cy, r);
  const ringStart = `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}`;
  let chipEl: React.ReactNode = null;
  if (chip && st.chip > 0) {
    const ang = ((LENS.chipAngleDeg - 90) * Math.PI) / 180;
    const ax = cx + Math.cos(ang) * (r + 12);
    const ay = cy + Math.sin(ang) * (r + 12);
    const fs = TYPE.chip;
    const w = monoWidth(chip, fs) + 20;
    const h = Math.round(fs * 1.15) + 8;
    chipEl = (
      <g opacity={st.chip * st.opacity}>
        <path d={rectPath(ax, ay, w, h, 8)} fill={D.panel} stroke={D.structure} strokeWidth={2} />
        <text x={ax + w / 2} y={ay + h / 2 + 1} textAnchor="middle" dominantBaseline="central" style={{fontFamily: MONO, fontWeight: 500, fontSize: fs}} fill={D.ink}>
          {chip}
        </text>
      </g>
    );
  }
  return (
    <g>
      {leader}
      <g opacity={st.opacity}>
        {/* knockout border in the page colour, so the inset separates from its parent */}
        <path d={ring} fill="none" stroke={TONE.page} strokeWidth={6} strokeOpacity={Math.min(1, st.draw * 1.5)} transform={`translate(${cx} ${cy}) scale(${(r + st.ringWidth / 2 + 3) / r}) translate(${-cx} ${-cy})`} />
        <defs>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={Math.max(0, r - st.ringWidth / 2)} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`} opacity={st.content}>
          <rect x={cx - r} y={cy - r} width={2 * r} height={2 * r} fill={interior} />
          {children}
        </g>
        <path
          d={ringStart}
          fill="none"
          stroke={st.ringColor}
          strokeWidth={st.ringWidth}
          strokeOpacity={st.ringOpacity}
          strokeDasharray={st.draw < 1 ? `${C * st.draw} ${C + 10}` : undefined}
        />
        {st.ticks > 0
          ? [0, 90, 180, 270].map((deg) => {
              const an = ((deg - 90) * Math.PI) / 180;
              const len = LENS.tickLength * st.ticks;
              const p0: Pt = [cx + Math.cos(an) * r, cy + Math.sin(an) * r];
              const p1: Pt = [cx + Math.cos(an) * (r - len), cy + Math.sin(an) * (r - len)];
              return <path key={deg} d={linePath(p0, p1)} stroke={st.ringColor} strokeWidth={LENS.tickWidth} strokeOpacity={st.ticks * st.ringOpacity} />;
            })
          : null}
      </g>
      {chipEl}
    </g>
  );
};
