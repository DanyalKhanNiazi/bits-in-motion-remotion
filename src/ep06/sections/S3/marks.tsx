// S3 section-local marks (no wall, card, Bit or Windows UI of their own: those come from the kit).
import React from 'react';
import {Img, staticFile} from 'remotion';
import {CARD, CheckGlyph, EASE, GEOM, PAL, PHOTO, SANS, SPRING, boxXY, cardK, clamp01, lerp, prog, rgba, springAt, useTextCheck} from '../../kit';

/** A rubber-stamp word (screen px, hud) that slams onto the card: coral border, slight tilt, squash and settle. */
export const Stamp: React.FC<{frame: number; at: number; exitAt?: number; text: string; x: number; y: number; size?: number; rot?: number}> = ({
  frame: f,
  at,
  exitAt,
  text,
  x,
  y,
  size = 104,
  rot = -9,
}) => {
  useTextCheck('keyword', size, false, `Stamp "${text}"`);
  const t = f - at;
  if (t < -1) return null;
  const ex = exitAt !== undefined ? prog(f, exitAt, 9, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const sp = springAt(f, at, SPRING.slam);
  const s = lerp(2.4, 1, sp) * (1 - 0.12 * ex);
  const op = clamp01((t + 1) / 2.5) * (1 - ex);
  const ring = t >= 2 && t < 20 ? (t - 2) / 18 : -1;
  const ink = PAL.loss;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: op}}>
      {ring >= 0 ? (
        <div
          style={{
            position: 'absolute',
            left: -size * (1.3 + 0.9 * ring),
            top: -size * (0.75 + 0.6 * ring),
            width: size * 2 * (1.3 + 0.9 * ring),
            height: size * 2 * (0.75 + 0.6 * ring),
            borderRadius: size,
            border: `${3 * (1 - ring) + 1}px solid ${rgba(ink, 0.7 * (1 - ring))}`,
            transform: `rotate(${rot}deg)`,
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
          padding: `${size * 0.08}px ${size * 0.34}px ${size * 0.12}px`,
          border: `${size * 0.07}px solid ${ink}`,
          borderRadius: size * 0.16,
          background: rgba('#2A0E10', 0.55),
          boxShadow: `0 ${size * 0.12}px ${size * 0.4}px rgba(0,0,0,0.45), 0 0 ${size * 0.5}px ${rgba(ink, 0.35)}`,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.05,
          letterSpacing: '0.02em',
          color: ink,
          whiteSpace: 'nowrap',
          filter: t < 4 ? `blur(${Math.max(0, s - 1) * 6}px)` : undefined,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** A quick tick badge (screen px, hud): pops with overshoot, a ring pings out. */
export const TickBadge: React.FC<{frame: number; at: number; exitAt?: number; x: number; y: number; size?: number}> = ({frame: f, at, exitAt, x, y, size = 64}) => {
  const sp = springAt(f, at, SPRING.pop);
  if (sp <= 0.001) return null;
  const ex = exitAt !== undefined ? prog(f, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const t = f - at;
  const ping = t >= 1 && t < 18 ? (t - 1) / 17 : -1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(sp * 2) * (1 - ex)}}>
      {ping >= 0 ? (
        <div style={{position: 'absolute', left: -size * (0.5 + 0.7 * ping), top: -size * (0.5 + 0.7 * ping), width: size * (1 + 1.4 * ping), height: size * (1 + 1.4 * ping), borderRadius: '50%', border: `3px solid ${rgba(PAL.ink, 0.8 * (1 - ping))}`}} />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: -size / 2,
          top: -size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: PAL.ink,
          boxShadow: `0 ${size * 0.12}px ${size * 0.35}px rgba(0,0,0,0.5)`,
          transform: `scale(${Math.max(0, sp) * (1 - 0.3 * ex)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: PAL.tileInk,
          fontSize: size * 0.62,
        }}
      >
        <CheckGlyph color={PAL.tileInk} weight={700} />
      </div>
    </div>
  );
};

/** Centre of a box (world px). */
const bc = (id: number) => {
  const p = boxXY(id);
  return {x: p.x + 32, y: p.y + 32};
};

/** Where the photo's 4 Bits sit inside a box (box px; mirrors the Archive's figure-ground layout, 19 px Bits). */
const PB_XY: Array<[number, number]> = [
  [11, 3],
  [34, 3],
  [11, 26],
  [34, 26],
];

/**
 * "Rewriting every box … would take far longer": a WHAT-IF strip (world px) over the wall's lower rows, never the
 * Archive itself: a dashed, dark plate holding ghost copies of the photo's 9 boxes (their Bits dimmed). Grey Bits pop in
 * one at a time, a numberless bar under them barely moves, and on `stallAt` it all stops: the Bit being written freezes
 * and blinks, the bar greys. It fades at `fadeAt`. The real boxes 021–023 · 058–060 · 098–100 stay cyan throughout.
 */
export const RewriteStream: React.FC<{frame: number; at: number; period: number; stallAt: number; fadeAt: number; strip: {x: number; y: number}}> = ({
  frame: f,
  at,
  period,
  stallAt,
  fadeAt,
  strip,
}) => {
  if (f < at - 8 || f > fadeAt + 22) return null;
  const FL = 10; // frames for one Bit to be written
  const B = 56; // ghost box size
  const PIT = 76;
  const q = B / 64;
  const op = prog(f, at - 8, 8, EASE.out) * (1 - prog(f, fadeAt, 20, EASE.inOut));
  const tf = Math.min(f, stallAt); // the work's own clock stops on the stall
  const stalled = f >= stallAt;
  const boxAt = (i: number) => ({x: strip.x + i * PIT, y: strip.y});
  const slots = PHOTO.flatMap((_, i) => PB_XY.map(([bx, by]) => ({x: boxAt(i).x + bx * q, y: boxAt(i).y + by * q, i})));
  const S = 19 * q;
  const landed: typeof slots = [];
  let writing: {x: number; y: number; i: number; u: number} | null = null;
  for (let k = 0; k < slots.length; k++) {
    const t0 = at + k * period;
    if (tf < t0) break;
    const u = (tf - t0) / FL;
    if (u >= 1) landed.push(slots[k]);
    else writing = {...slots[k], u};
  }
  const done = landed.length + (writing ? writing.u : 0);
  const fill = done / slots.length;
  const headI = (writing ?? landed[landed.length - 1] ?? slots[0]).i;
  const hb = boxAt(headI);
  const flick = stalled ? 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((f - stallAt) * 1.4)) : 1;
  const grey = prog(f, stallAt, 8, EASE.out);
  const rr = (x: number, y: number, s = S) => `M${x + 3} ${y}h${s - 6}q3 0 3 3v${s - 6}q0 3-3 3h-${s - 6}q-3 0-3-3v-${s - 6}q0-3 3-3z`;
  const ghostBits = slots.map((sl) => rr(sl.x, sl.y)).join('');
  const ghostBoxes = PHOTO.map((_, i) => `M${boxAt(i).x} ${boxAt(i).y}h${B}v${B}h-${B}z`).join('');
  const W = 8 * PIT + B;
  const barY = strip.y + B + 26;
  const sp = writing ? Math.min(1, writing.u * 1.6) : 0;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
      {/* the what-if plate: dark, dashed edge */}
      <rect x={strip.x - 22} y={strip.y - 16} width={W + 44} height={B + 72} rx={18} fill="#070B15" fillOpacity={0.9} stroke={PAL.annotation} strokeOpacity={0.55} strokeWidth={2.5} strokeDasharray="10 8" />
      {/* ghost copies of the photo's 9 boxes, Bits dimmed */}
      <path d={ghostBoxes} fill={PAL.structure} fillOpacity={0.14} stroke={PAL.ink} strokeOpacity={0.4} strokeWidth={2} strokeDasharray="6 5" />
      <path d={ghostBits} fill={PAL.photo} fillOpacity={0.32} />
      {/* rewritten Bits (grey), one at a time */}
      {landed.length ? <path d={landed.map((sl) => rr(sl.x, sl.y)).join('')} fill="#C3C9D2" stroke={PAL.tileInk} strokeWidth={1.2} /> : null}
      {writing ? <path d={rr(writing.x + (S * (1 - sp)) / 2, writing.y + (S * (1 - sp)) / 2, Math.max(6.5, S * sp))} fill={PAL.otherBit} opacity={flick} /> : null}
      {/* the write head on the ghost box being rewritten */}
      <rect x={hb.x - 5} y={hb.y - 5} width={B + 10} height={B + 10} rx={9} fill="none" stroke={PAL.ink} strokeWidth={3} strokeDasharray="10 6" strokeDashoffset={-tf * 1.2} opacity={flick} />
      {/* numberless progress bar: the whole rewrite, barely begun */}
      <rect x={strip.x} y={barY - 8} width={W} height={16} rx={8} fill={PAL.structure} fillOpacity={0.35} />
      <rect x={strip.x} y={barY - 8} width={Math.max(16, W * fill)} height={16} rx={8} fill={grey > 0 ? PAL.oldBit : PAL.ink} fillOpacity={1 - 0.35 * grey} />
      <circle cx={strip.x + Math.max(8, W * fill)} cy={barY} r={12} fill={PAL.ink} opacity={0.35 * (1 - grey)} />
    </svg>
  );
};

type FieldKey = 'name' | 'size' | 'dates' | 'directions';
/** the printed field labels on the card (card px = mft-record_b px; mirrors Card.tsx): end-anchored left column, "directions" start-anchored */
const FIELD_LABEL: Record<FieldKey, {x: number; y: number; end: boolean}> = {
  name: {x: 268, y: 466, end: true},
  size: {x: 240, y: 620, end: true},
  dates: {x: 226, y: 812, end: true},
  directions: {x: 700, y: 372, end: false},
};
const fieldBars = (k: FieldKey): ReadonlyArray<readonly number[]> => (k === 'directions' ? [CARD.fields.directions.housing] : CARD.fields[k].bars);
/** Card px → world px for the photo's card at rest in the drawer (centre `card` from archiveAnchors). */
export const cardToWorld = (card: {x: number; y: number}, nx: number, ny: number) => {
  const k = cardK(GEOM.card.w);
  return {x: card.x + k * (nx - CARD.cx), y: card.y + k * (ny - CARD.cy)};
};
/** Where a field's printed label sits (card px), for hud chips. */
export const fieldLabelPt = (k: FieldKey) => ({x: FIELD_LABEL[k].x, y: FIELD_LABEL[k].y - 13});

/** approximate paper tone under each printed label (the card's paper gradient runs light top-left → darker bottom-right) */
const LABEL_PAPER: Record<FieldKey, string> = {name: '#F3F1EC', size: '#EDEAE5', dates: '#E7E3DD', directions: '#EEEBE6'};
/**
 * A field "lights as spoken" (world px, over the Archive): the card's own printed label turns bold ink (a paper-tone
 * halo hides the grey original) with a small pop, and its bar fills with a pale structure tint. The spoken word itself
 * is echoed once, by the hud chip; both go when the next field is spoken.
 */
export const FieldPop: React.FC<{frame: number; at: number; exitAt: number; field: FieldKey; card: {x: number; y: number}}> = ({frame: f, at, exitAt, field, card}) => {
  if (f < at - 1) return null;
  const ex = prog(f, exitAt, 8, EASE.inCubic);
  if (ex >= 1) return null;
  const k = cardK(GEOM.card.w);
  const sp = springAt(f, at, SPRING.pop);
  const op = clamp01(sp * 2) * (1 - ex);
  const fill = prog(f, at, 10, EASE.out);
  const L = FIELD_LABEL[field];
  const tint = field === 'directions' ? 0.14 : 0.3;
  const s = 1 + 0.12 * Math.max(0, sp - 1) * 4; // only the spring's overshoot shows as a pop; settles at 1
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
      <g transform={`translate(${card.x} ${card.y}) scale(${k}) translate(${-CARD.cx} ${-CARD.cy})`}>
        {fieldBars(field).map((b, i) => (
          <rect key={i} x={b[0]} y={b[1]} width={(b[2] - b[0]) * fill} height={b[3] - b[1]} rx={14} fill={PAL.structure} fillOpacity={tint} />
        ))}
        <g transform={`translate(${L.x} ${L.y - 13}) scale(${s}) translate(${-L.x} ${-(L.y - 13)})`}>
          <text
            x={L.x}
            y={L.y}
            textAnchor={L.end ? 'end' : 'start'}
            fontFamily={SANS}
            fontWeight={800}
            fontSize={36}
            fill={PAL.tileInk}
            stroke={LABEL_PAPER[field]}
            strokeWidth={12}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            {field}
          </text>
        </g>
      </g>
    </svg>
  );
};

/** The ghost of a future write (world px): a dashed, half-there block hovering above a box, aimed at it. */
export const GhostWrite: React.FC<{frame: number; at: number; dipAt: number; box: number}> = ({frame: f, at, dipAt, box}) => {
  if (f < at - 1) return null;
  const c = bc(box);
  const inU = springAt(f, at, SPRING.soft);
  const dip = prog(f, dipAt, 10, EASE.out) - 0.55 * prog(f, dipAt + 10, 26, EASE.inOut);
  const bob = 5 * Math.sin((f - at) / 13);
  const y = c.y - 128 - 60 * (1 - inU) + 34 * dip + bob;
  const x = c.x + 22 * (1 - inU);
  const op = clamp01(inU * 1.6);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
      <defs>
        <radialGradient id="s3-ghost-glow">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
      </defs>
      {/* aim: a dashed drop line and a hollow target ring on the box */}
      <line x1={x} y1={y + 40} x2={c.x} y2={c.y - 40} stroke={PAL.ink} strokeOpacity={0.4} strokeWidth={2.5} strokeDasharray="6 7" strokeDashoffset={-f * 0.8} />
      <rect x={c.x - 38} y={c.y - 38} width={76} height={76} rx={9} fill="none" stroke={PAL.ink} strokeOpacity={0.35 + 0.15 * Math.sin(f / 9)} strokeWidth={2.5} strokeDasharray="9 6" />
      {/* soft shadow it would cast */}
      <ellipse cx={c.x} cy={c.y - 34} rx={30 + 10 * dip} ry={6} fill="#000" opacity={0.25 + 0.2 * dip} />
      {/* the block: grey, translucent, dashed: not there yet */}
      <circle cx={x} cy={y} r={70} fill="url(#s3-ghost-glow)" />
      <rect x={x - 36} y={y - 36} width={72} height={72} rx={10} fill={PAL.oldBit} fillOpacity={0.42} stroke={PAL.otherBit} strokeWidth={3.5} strokeDasharray="11 6" strokeDashoffset={f * 0.9} />
      <rect x={x - 24} y={y - 24} width={48} height={48} rx={7} fill={PAL.otherBit} fillOpacity={0.2} />
    </svg>
  );
};

/** extra-hourglass.png (1254 px square; visible content 344,66–912,1192 per ASSET_MAP), allowed in P07 with no digits. */
const HG = {src: 'ep06/assets/extra-hourglass.png', size: 1254, x0: 344, y0: 66, x1: 912, y1: 1192};
/**
 * The slow job's hourglass (world px): pops in beside the rewrite bar, flips over once on `flipAt` ("far longer": the
 * wait starts again), fades with the rewrite. `x, y` = centre of its visible content, `h` = content height.
 */
export const Hourglass: React.FC<{frame: number; at: number; flipAt: number; exitAt: number; x: number; y: number; h: number}> = ({frame: f, at, flipAt, exitAt, x, y, h}) => {
  if (f < at - 1) return null;
  const ex = prog(f, exitAt, 20, EASE.inOut);
  if (ex >= 1) return null;
  const sp = springAt(f, at, SPRING.pop);
  const k = h / (HG.y1 - HG.y0);
  const cx = (HG.x0 + HG.x1) / 2;
  const cy = (HG.y0 + HG.y1) / 2;
  const rot = 180 * prog(f, flipAt, 12, EASE.inOut);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(sp * 2) * (1 - ex), transform: `rotate(${rot}deg) scale(${Math.max(0, sp)})`}}>
      <Img src={staticFile(HG.src)} style={{position: 'absolute', left: -cx * k, top: -cy * k, width: HG.size * k, height: HG.size * k, filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.55))'}} />
    </div>
  );
};
