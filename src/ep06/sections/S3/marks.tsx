// S3 section-local marks (no wall, card, Bit or Windows UI of their own: those come from the kit).
import React from 'react';
import {CheckGlyph, EASE, PAL, PHOTO, SANS, SPRING, boxXY, clamp01, lerp, prog, rgba, springAt, useTextCheck} from '../../kit';

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

/**
 * "Rewriting every box … would take far longer": a dashed rewrite head (world px, drawn over the Archive) that crawls
 * along the photo's 9 boxes in order, barely gets past the first box, stalls and fades. Nothing is actually rewritten.
 */
export const RewriteCrawl: React.FC<{frame: number; at: number; stallAt: number; fadeAt: number}> = ({frame: f, at, stallAt, fadeAt}) => {
  if (f < at - 2 || f > fadeAt + 24) return null;
  const pts = PHOTO.map(bc);
  const appear = prog(f, at - 2, 10, EASE.out);
  const fade = 1 - prog(f, fadeAt, 22, EASE.inOut);
  // crawl: slow, stepping (a tiny hitch every box), then stalls at stallAt
  const run = Math.min(f, stallAt) - at;
  const u = Math.max(0, run) / 52; // ≈ 1.6 boxes by the stall
  const pos = u + 0.05 * Math.sin(u * Math.PI * 2);
  const seg = Math.min(pts.length - 2, Math.floor(pos));
  const k = pos - seg;
  const hx = lerp(pts[seg].x, pts[seg + 1].x, k);
  const hy = lerp(pts[seg].y, pts[seg + 1].y, k);
  const stalled = f >= stallAt;
  const flick = stalled ? 0.55 + 0.45 * Math.cos((f - stallAt) * 1.3) : 1;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join('');
  const done = pts.slice(0, seg + 1).map((p) => p);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={appear * fade}>
      {/* the whole job: a faint dashed route through all nine boxes */}
      <path d={d} fill="none" stroke={PAL.ink} strokeOpacity={0.32} strokeWidth={3} strokeDasharray="10 9" strokeDashoffset={-f * 0.6} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <rect key={i} x={p.x - 38} y={p.y - 38} width={76} height={76} rx={9} fill="none" stroke={PAL.ink} strokeOpacity={i <= seg ? 0.0 : 0.22} strokeWidth={2} />
      ))}
      {/* what it has covered so far: a pale veil */}
      {done.map((p, i) => (
        <rect key={`v${i}`} x={p.x - 34} y={p.y - 34} width={i < seg ? 68 : 68 * clamp01(k * 1.2)} height={68} rx={6} fill={PAL.ink} fillOpacity={0.16} />
      ))}
      {/* the head */}
      <g opacity={flick}>
        <rect x={hx - 40} y={hy - 40} width={80} height={80} rx={10} fill={PAL.ink} fillOpacity={0.1} stroke={PAL.ink} strokeWidth={4} strokeDasharray="12 7" strokeDashoffset={f * 1.2} />
        <rect x={hx - 3} y={hy - 46} width={6} height={92} rx={3} fill={PAL.ink} fillOpacity={0.75} />
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
      {/* aim: a dashed drop line and a hollow target ring on the box */}
      <line x1={x} y1={y + 40} x2={c.x} y2={c.y - 40} stroke={PAL.ink} strokeOpacity={0.4} strokeWidth={2.5} strokeDasharray="6 7" strokeDashoffset={-f * 0.8} />
      <rect x={c.x - 38} y={c.y - 38} width={76} height={76} rx={9} fill="none" stroke={PAL.ink} strokeOpacity={0.35 + 0.15 * Math.sin(f / 9)} strokeWidth={2.5} strokeDasharray="9 6" />
      {/* soft shadow it would cast */}
      <ellipse cx={c.x} cy={c.y - 34} rx={30 + 10 * dip} ry={6} fill="#000" opacity={0.25 + 0.2 * dip} />
      {/* the block: grey, translucent, dashed: not there yet */}
      <rect x={x - 34} y={y - 34} width={68} height={68} rx={9} fill={PAL.oldBit} fillOpacity={0.28} stroke={PAL.otherBit} strokeOpacity={0.85} strokeWidth={3} strokeDasharray="10 6" strokeDashoffset={f * 0.9} />
      <rect x={x - 22} y={y - 22} width={44} height={44} rx={6} fill={PAL.otherBit} fillOpacity={0.12} />
    </svg>
  );
};
