/**
 * S3 · the weighted wheel: one slice per candidate, slice size = its score, plus a hatched sliver for the rest of the
 * vocabulary. A flapper pointer sits at 3 o'clock. Angles are degrees clockwise from 12 o'clock (screen space).
 * The wheel can grow out of source polygons (the hero score bars) via `morph`.
 */
import React, {useId} from 'react';
import {BitHead, PAL, TokenTile, clamp01, lerp, rgba, safeId} from '../../kit';
import {HERO} from './field';

export type Slice = {w: string; p: number};
export const SLICES: Slice[] = [...HERO.map((h) => ({w: h.w, p: h.p})), {w: '', p: 0.1}];
export const OTHER = SLICES.length - 1;
export const cumOf = (sl: readonly Slice[]): number[] => {
  const out: number[] = [];
  let c = 0;
  for (const s of sl) {
    out.push(c);
    c += s.p;
  }
  return out;
};
export const CUM: number[] = cumOf(SLICES);
export const idxOf = (w: string) => SLICES.findIndex((s) => s.w === w);
/** wheel rotation that puts slice k's centre under the pointer (3 o'clock = 90°) */
export const rotFor = (k: number, sl: readonly Slice[] = SLICES) => 90 - 360 * (cumOf(sl)[k] + sl[k].p / 2);

export type Pt = readonly [number, number];
const polar = (cx: number, cy: number, r: number, deg: number): Pt => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.sin(a), cy - r * Math.cos(a)];
};

const NA = 22; // points per arc
const NS = 4; // points per radial side
/** Slice outline: outer arc a0→a1, radial in at a1, inner arc a1→a0, radial out at a0. */
export const slicePoly = (cx: number, cy: number, R: number, r0: number, a0: number, a1: number): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i < NA; i++) pts.push(polar(cx, cy, R, lerp(a0, a1, i / (NA - 1))));
  for (let i = 1; i <= NS; i++) pts.push(polar(cx, cy, lerp(R, r0, i / (NS + 1)), a1));
  for (let i = 0; i < NA; i++) pts.push(polar(cx, cy, r0, lerp(a1, a0, i / (NA - 1))));
  for (let i = 1; i <= NS; i++) pts.push(polar(cx, cy, lerp(r0, R, i / (NS + 1)), a0));
  return pts;
};
/** A quad [BL, BR, TR, TL] sampled with the same point count as slicePoly (left edge → outer arc, so height → angle). */
export const quadPoly = (q: readonly [Pt, Pt, Pt, Pt]): Pt[] => {
  const [BL, BR, TR, TL] = q;
  const L = (a: Pt, b: Pt, t: number): Pt => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  const pts: Pt[] = [];
  for (let i = 0; i < NA; i++) pts.push(L(BL, TL, i / (NA - 1))); // left edge, bottom → top  (outer arc)
  for (let i = 1; i <= NS; i++) pts.push(L(TL, TR, i / (NS + 1))); // top edge                   (radial in)
  for (let i = 0; i < NA; i++) pts.push(L(TR, BR, i / (NA - 1))); // right edge, top → bottom  (inner arc)
  for (let i = 1; i <= NS; i++) pts.push(L(BR, BL, i / (NS + 1))); // bottom edge                (radial out)
  return pts;
};
const toD = (pts: readonly Pt[]) => `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`;

export type WheelProps = {
  frame: number;
  /** slice set (defaults to the 8 candidates + the rest of the vocabulary) */
  slices?: readonly Slice[];
  cx: number;
  cy: number;
  R: number;
  r0: number;
  /** rotation in degrees */
  rot: number;
  /** 0..1 lit amount of the chosen slice */
  chosen?: {k: number; lit: number};
  /** tiles on the slices with p ≥ this (0 = none) */
  labelMin?: number;
  labelOpacity?: number;
  tileSize?: number;
  /** grow from source polygons: per-slice t (0 = source, 1 = slice) and sources (hero bars) */
  morph?: {t: readonly number[]; from: readonly (Pt[] | null)[]};
  opacity?: number;
  /** flapper deflection is computed from the rotation speed (pass the previous frame's rotation) */
  rotPrev?: number;
  /** a special slice (k) drawn dark and dashed: the hidden end token */
  special?: number;
  pointer?: boolean;
  /** extra glow on the whole ring 0..1 */
  glow?: number;
  /** a slice whose rim tile is hidden (it has been lifted out) */
  hideK?: number;
};

export const Wheel: React.FC<WheelProps> = ({
  frame,
  slices: SL = SLICES,
  cx,
  cy,
  R,
  r0,
  rot,
  chosen,
  labelMin = 0.08,
  labelOpacity = 1,
  tileSize = 38,
  morph,
  opacity = 1,
  rotPrev,
  special,
  pointer = true,
  glow = 0,
  hideK,
}) => {
  const uid = safeId(useId());
  const CU = cumOf(SL);
  const OT = SL === SLICES ? OTHER : -1;
  const mt = (k: number) => (morph ? clamp01(morph.t[k] ?? 1) : 1);
  const ringT = morph ? Math.min(...SL.map((_, k) => mt(k))) : 1;
  // flapper: deflects as slice boundaries pass the pointer
  const speed = rotPrev !== undefined ? rot - rotPrev : 0;
  let flap = 0;
  if (pointer) {
    for (let k = 0; k < SL.length; k++) {
      const b = (((rot + 360 * CU[k] - 90) % 360) + 540) % 360 - 180; // boundary angle relative to the pointer
      const near = Math.abs(b);
      if (near < 9) flap = Math.max(flap, (1 - near / 9) * Math.min(1, Math.abs(speed) / 6 + 0.25));
    }
  }
  const flapDeg = -Math.sign(speed || 1) * 24 * flap;
  const sw = Math.max(1.2, R * 0.006);
  return (
    <>
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity}}>
      <defs>
        <radialGradient id={`${uid}-hub`} cx={cx} cy={cy} r={r0} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#16264A" />
          <stop offset="1" stopColor="#0A1328" />
        </radialGradient>
        <linearGradient id={`${uid}-rim`} x1={cx - R} y1={cy - R} x2={cx + R} y2={cy + R} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#E6EBF2" />
          <stop offset="0.45" stopColor={PAL.silverDark} />
          <stop offset="0.7" stopColor="#DDE3EC" />
          <stop offset="1" stopColor="#6C7586" />
        </linearGradient>
        <pattern id={`${uid}-hatch`} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform={`rotate(${rot + 30})`}>
          <rect width={6} height={6} fill="#0B1428" />
          <line x1={0} y1={0} x2={0} y2={6} stroke={rgba(PAL.annotation, 0.75)} strokeWidth={1.4} />
        </pattern>
        <filter id={`${uid}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(4, R * 0.04)} />
        </filter>
      </defs>
      {/* hub and shadow */}
      <g opacity={ringT}>
        <circle cx={cx} cy={cy + R * 0.06} r={R * 1.04} fill="rgba(0,0,0,0.45)" filter={`url(#${uid}-glow)`} />
        <circle cx={cx} cy={cy} r={r0} fill={`url(#${uid}-hub)`} stroke={rgba(PAL.structure, 0.5)} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r0 * 0.62} fill="none" stroke={rgba(PAL.structure, 0.28)} strokeWidth={sw} strokeDasharray={`${R * 0.02} ${R * 0.03}`} transform={`rotate(${rot} ${cx} ${cy})`} />
        <circle cx={cx} cy={cy} r={r0 * 0.2} fill={PAL.silver} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r0 * 0.08} fill="#0A1328" />
      </g>
      {/* slices */}
      {SL.map((s, k) => {
        const a0 = rot + 360 * CU[k];
        const a1 = a0 + 360 * s.p;
        const target = slicePoly(cx, cy, R, r0, a0, a1);
        const t = mt(k);
        const src = morph?.from[k];
        if (!src && t <= 0) return null;
        const pts = src ? target.map((p, i) => [lerp(src[i][0], p[0], t), lerp(src[i][1], p[1], t)] as Pt) : target;
        const lit = chosen && chosen.k === k ? chosen.lit : 0;
        const isOther = k === OT;
        const isSpecial = special === k;
        const fill = isOther ? `url(#${uid}-hatch)` : isSpecial ? '#060A14' : k % 2 ? '#14244A' : '#1A2F5C';
        const barLike = src && t < 1;
        return (
          <g key={k} opacity={!src && morph ? t : 1}>
            <path d={toD(pts)} fill={barLike ? `rgba(0,229,255,${lerp(0.92, 0.35, t)})` : fill} />
            {lit > 0 ? <path d={toD(pts)} fill={rgba(PAL.info, 0.55 * lit)} /> : null}
            {lit > 0 ? <path d={toD(pts)} fill="none" stroke={PAL.infoPale} strokeWidth={sw * 2.2} opacity={lit} filter={`url(#${uid}-glow)`} /> : null}
            <path
              d={toD(pts)}
              fill="none"
              stroke={isSpecial ? PAL.annotation : lit > 0 ? PAL.infoPale : rgba('#8FA6CF', 0.55)}
              strokeWidth={sw * (isSpecial ? 1.6 : 1)}
              strokeDasharray={isSpecial ? `${sw * 4} ${sw * 3}` : undefined}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
      {/* rim, ticks, glow */}
      <g opacity={ringT}>
        {glow > 0 ? <circle cx={cx} cy={cy} r={R} fill="none" stroke={PAL.info} strokeWidth={R * 0.05} opacity={0.6 * glow} filter={`url(#${uid}-glow)`} /> : null}
        <circle cx={cx} cy={cy} r={R + sw * 2.5} fill="none" stroke={`url(#${uid}-rim)`} strokeWidth={sw * 4} />
        {Array.from({length: 72}, (_, i) => {
          const a = rot + i * 5;
          const p0 = polar(cx, cy, R + sw * 0.5, a);
          const p1 = polar(cx, cy, R - (i % 6 === 0 ? R * 0.06 : R * 0.03), a);
          return <line key={i} x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]} stroke={rgba('#C9D6EA', i % 6 === 0 ? 0.55 : 0.28)} strokeWidth={sw} />;
        })}
        <circle cx={cx} cy={cy} r={r0} fill="none" stroke={rgba('#C9D6EA', 0.35)} strokeWidth={sw * 1.4} />
      </g>
      {/* flapper pointer at 3 o'clock */}
      {pointer ? (
        <g opacity={ringT} transform={`rotate(${flapDeg} ${cx + R + R * 0.16} ${cy})`}>
          <path
            d={`M ${cx + R - R * 0.05} ${cy} L ${cx + R + R * 0.13} ${cy - R * 0.055} L ${cx + R + R * 0.2} ${cy} L ${cx + R + R * 0.13} ${cy + R * 0.055} Z`}
            fill={PAL.info}
            stroke={PAL.infoPale}
            strokeWidth={sw}
          />
          <BitHead x={cx + R + R * 0.16} y={cy} size={Math.max(8, R * 0.07)} gid={`${uid}-bit`} />
        </g>
      ) : null}
    </svg>
      {/* tiles ride the slices, staying upright */}
      {labelMin > 0 && labelOpacity > 0.01 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, opacity: labelOpacity * ringT * opacity}}>
          {SL.map((s, k) => {
            if (k === OT || s.p < labelMin || k === hideK) return null;
            const am = rot + 360 * (CU[k] + s.p / 2);
            const [x, y] = polar(cx, cy, (R + r0) / 2, am);
            const lit = chosen && chosen.k === k ? chosen.lit : 0;
            return <TokenTile key={`t${k}`} frame={frame} text={s.w} x={x} y={y} size={tileSize} newest={lit} />;
          })}
        </div>
      ) : null}
    </>
  );
};

/** Tile centre for slice k at a rotation (used to hand a chosen tile on to the next shot). */
export const sliceTilePos = (cx: number, cy: number, R: number, r0: number, rot: number, k: number): Pt =>
  polar(cx, cy, (R + r0) / 2, rot + 360 * (CUM[k] + SLICES[k].p / 2));
