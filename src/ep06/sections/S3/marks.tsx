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
 * "Rewriting every box … would take far longer" (world px, drawn over the Archive in the same wide frame as the two
 * instant ticks): grey Bits fall one at a time into the photo's 9 boxes (each lands with a small coral write ring), a
 * numberless progress bar under the wall barely moves, and on `stallAt` everything stops: the falling Bit freezes and
 * blinks, the stream dies, the bar greys. It fades at `fadeAt` and the photo's Bits are untouched (it never happens).
 */
export const RewriteStream: React.FC<{frame: number; at: number; period: number; stallAt: number; fadeAt: number; bar: {x: number; y: number; w: number}}> = ({
  frame: f,
  at,
  period,
  stallAt,
  fadeAt,
  bar,
}) => {
  if (f < at - 8 || f > fadeAt + 22) return null;
  const FL = 14; // flight frames per Bit
  const op = prog(f, at - 8, 8, EASE.out) * (1 - prog(f, fadeAt, 20, EASE.inOut));
  const tf = Math.min(f, stallAt); // the work's own clock stops on the stall
  const stalled = f >= stallAt;
  const slots = PHOTO.flatMap((id) => PB_XY.map(([bx, by]) => ({x: boxXY(id).x + bx, y: boxXY(id).y + by, id})));
  const landed: typeof slots = [];
  let flying: {x: number; y: number; u: number; id: number} | null = null;
  for (let k = 0; k < slots.length; k++) {
    const t0 = at + k * period;
    if (tf < t0) break;
    const u = (tf - t0) / FL;
    if (u >= 1) landed.push(slots[k]);
    else flying = {...slots[k], u: EASE.inOut(u), id: slots[k].id};
  }
  const done = landed.length + (flying ? flying.u : 0);
  const fill = done / slots.length;
  const head = flying ?? landed[landed.length - 1] ?? slots[0];
  const hb = boxXY(head.id);
  const flick = stalled ? 0.35 + 0.65 * (0.5 + 0.5 * Math.cos((f - stallAt) * 1.4)) : 1;
  const grey = prog(f, stallAt, 8, EASE.out);
  const rr = (x: number, y: number) => `M${x + 3.5} ${y}h12q3.5 0 3.5 3.5v12q0 3.5-3.5 3.5h-12q-3.5 0-3.5-3.5v-12q0-3.5 3.5-3.5z`;
  const lastLand = landed.length ? at + (landed.length - 1) * period + FL : -1e9;
  const ring = f - lastLand < 7 && landed.length ? (f - lastLand) / 7 : -1;
  const rl = landed[landed.length - 1];
  const bx0 = bar.x;
  const bw = bar.w;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
      <defs>
        <linearGradient id="s3-rw-stream" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={PAL.oldBit} stopOpacity={0} />
          <stop offset="1" stopColor={PAL.otherBit} stopOpacity={0.75} />
        </linearGradient>
      </defs>
      {/* the stream into the box being rewritten, and the head's dashed ring */}
      <rect x={hb.x + 26} y={hb.y - 150} width={12} height={150} rx={6} fill="url(#s3-rw-stream)" opacity={1 - grey} />
      <rect x={hb.x - 6} y={hb.y - 6} width={76} height={76} rx={10} fill="none" stroke={PAL.ink} strokeWidth={3.5} strokeDasharray="12 7" strokeDashoffset={-tf * 1.2} opacity={flick} />
      {/* rewritten Bits (grey) cover the photo's cyan ones, one at a time */}
      {landed.length ? <path d={landed.map((s) => rr(s.x, s.y)).join('')} fill="#C3C9D2" stroke={PAL.tileInk} strokeWidth={1.5} /> : null}
      {flying ? <path d={rr(flying.x, flying.y - 100 * (1 - flying.u))} fill={PAL.otherBit} stroke={PAL.tileInk} strokeWidth={1.5} opacity={flick} /> : null}
      {ring >= 0 && rl ? <rect x={rl.x - 3 - 8 * ring} y={rl.y - 3 - 8 * ring} width={25 + 16 * ring} height={25 + 16 * ring} rx={6} fill="none" stroke={PAL.loss} strokeWidth={3} opacity={1 - ring} /> : null}
      {/* numberless progress bar: the whole rewrite, barely begun */}
      <rect x={bx0 - 18} y={bar.y - 22} width={bw + 36} height={44} rx={22} fill="#070B15" fillOpacity={0.88} stroke={PAL.annotation} strokeOpacity={0.35} strokeWidth={2} />
      <rect x={bx0} y={bar.y - 9} width={bw} height={18} rx={9} fill={PAL.structure} fillOpacity={0.35} />
      <rect x={bx0} y={bar.y - 9} width={Math.max(18, bw * fill)} height={18} rx={9} fill={grey > 0 ? PAL.oldBit : PAL.ink} fillOpacity={1 - 0.35 * grey} />
      <circle cx={bx0 + Math.max(7, bw * fill)} cy={bar.y} r={13} fill={PAL.ink} opacity={0.35 * (1 - grey)} />
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

/**
 * A field "lights as spoken" (world px, over the Archive): its printed label pops to bold ink on a white pill and its
 * bar fills with a pale structure tint; both go when the next field lights.
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
  const p = cardToWorld(card, L.x, L.y - 13);
  const tint = field === 'directions' ? 0.14 : 0.3;
  return (
    <>
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
        {fieldBars(field).map((b, i) => {
          const a = cardToWorld(card, b[0], b[1]);
          return <rect key={i} x={a.x} y={a.y} width={(b[2] - b[0]) * k * fill} height={(b[3] - b[1]) * k} rx={14 * k} fill={PAL.structure} fillOpacity={tint} />;
        })}
      </svg>
      <div style={{position: 'absolute', left: p.x, top: p.y, width: 0, height: 0, transform: `scale(${k * (1 + 0.14 * sp) * (1 - 0.1 * ex)})`, transformOrigin: '0 0', opacity: op}}>
        <div
          style={{
            position: 'absolute',
            [L.end ? 'right' : 'left']: -16,
            top: 0,
            transform: 'translateY(-50%)',
            padding: '1px 16px 5px',
            borderRadius: 999,
            background: '#FFFFFF',
            boxShadow: `0 0 0 3px ${PAL.tileInk}, 0 6px 18px rgba(0,0,0,0.28)`,
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: 42,
            lineHeight: 1.2,
            color: PAL.tileInk,
            whiteSpace: 'nowrap',
          }}
        >
          {field}
        </div>
      </div>
    </>
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
