/**
 * S2 effects in world px: the cut flash and sparks of a chop, and the Bit hopping from tile to tile.
 */
import React from 'react';
import {BitHead, EASE, PAL, SANS, clamp01, lerp, rgba, rr} from '../../kit';

/** A chop: a bright vertical slit plus sparks thrown from the contact point. `t` = frames since the cut. */
export const Chop: React.FC<{x: number; y: number; h: number; t: number; seed: string; scale?: number}> = ({x, y, h, t, seed, scale = 1}) => {
  if (t < -1 || t > 16) return null;
  const flash = t < 0 ? 0.5 : Math.exp(-t / 2.6);
  const sparks: React.ReactNode[] = [];
  if (t >= 0) {
    for (let i = 0; i < 9; i++) {
      const ang = rr(`${seed}-a${i}`, -Math.PI * 0.95, -Math.PI * 0.05) + (i % 2 ? 0 : Math.PI);
      const sp = rr(`${seed}-v${i}`, 7, 17) * scale;
      const vx = Math.cos(ang) * sp;
      const vy = Math.sin(ang) * sp * 0.75 - 3 * scale;
      const px = x + vx * t;
      const py = y + vy * t + 0.9 * scale * t * t;
      const life = clamp01(1 - t / rr(`${seed}-l${i}`, 9, 15));
      if (life <= 0) continue;
      const sz = rr(`${seed}-s${i}`, 3, 6.5) * scale;
      sparks.push(
        <line
          key={i}
          x1={px}
          y1={py}
          x2={px - vx * 0.9}
          y2={py - (vy + 1.8 * scale * t) * 0.9}
          stroke={i % 3 === 0 ? PAL.info : '#FFFFFF'}
          strokeWidth={sz * life}
          strokeLinecap="round"
          opacity={life}
        />,
      );
    }
  }
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <rect x={x - 26 * scale} y={y - h / 2 - 10} width={52 * scale} height={h + 20} rx={26 * scale} fill={rgba(PAL.info, 0.28 * flash)} />
      <rect x={x - 5 * scale} y={y - h / 2} width={10 * scale} height={h} rx={5 * scale} fill={rgba('#FFFFFF', 0.95 * flash)} />
      <circle cx={x} cy={y} r={lerp(10, 70, EASE.out(clamp01(t / 10))) * scale} fill="none" stroke={PAL.info} strokeWidth={3} opacity={t >= 0 ? 0.7 * (1 - clamp01(t / 10)) : 0} />
      {sparks}
    </svg>
  );
};

/** A thin paper word card (the reader's word), dropped onto its token tile. */
export const WordCard: React.FC<{x: number; y: number; w: number; h: number; size: number; text: string; squash?: number; opacity?: number}> = ({
  x,
  y,
  w,
  h,
  size,
  text,
  squash = 0,
  opacity = 1,
}) => {
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity,
        transform: `scale(${1 + squash * 0.5}, ${1 - squash})`,
        transformOrigin: '50% 100%',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #FFFDF8 0%, #F4EFE6 100%)',
        boxShadow: `0 0 0 2px ${rgba('#E7C99A', 0.9)}, 0 14px 26px rgba(0,0,0,0.45), 0 0 26px ${rgba('#FFD9A0', 0.35)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: size,
        color: PAL.tileInk,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

/** The Bit hopping along tile tops: it sits on tile i from times[i] on, hopping in a short arc. */
export const BitHops: React.FC<{frame: number; times: readonly number[]; pts: readonly {x: number; y: number}[]; until?: number; size?: number; gid: string; enter?: number}> = ({
  frame,
  times,
  pts,
  until,
  size = 26,
  gid,
  enter = 8,
}) => {
  if (frame < times[0] - enter || (until !== undefined && frame > until)) return null;
  let i = 0;
  for (let k = 0; k < times.length; k++) if (frame >= times[k]) i = k;
  const hopDur = 4;
  let x = pts[0].x;
  let y = pts[0].y;
  let op = clamp01((frame - (times[0] - enter)) / enter);
  if (frame < times[0]) {
    y = pts[0].y - (1 - op) * 60;
  } else {
    const prev = Math.max(0, i - 1);
    const u = i === 0 ? 1 : clamp01((frame - times[i]) / hopDur);
    const e = EASE.inOut(u);
    x = lerp(pts[prev].x, pts[i].x, e);
    y = lerp(pts[prev].y, pts[i].y, e) - Math.sin(Math.PI * u) * 34;
  }
  if (until !== undefined) op *= clamp01((until - frame) / 8);
  return (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <BitHead x={x} y={y + Math.sin(frame / 7) * 2} size={size} gid={gid} opacity={op} />
    </svg>
  );
};
