/**
 * S5 local fx (world px, over the <Archive>): the refused write on a box full of old data, big enough to read in a close
 * shot (P11 "It can't simply write over old data"). A new white Bit (the kit's BitHead, never cyan) drops onto the box,
 * squashes on impact under a coral flash and ring, bounces up and off, and falls away out of frame. `hit` = impact frame.
 */
import React from 'react';
import {BitHead, EASE, PAL, boxXY, clamp01, lerp, rgba, safeId} from '../../kit';

const APPROACH = 18;
const BOUNCE = 11;
const FALL = 30;
const SIZE = 22;

export const Refusal: React.FC<{frame: number; box: number; hit: number; from?: -1 | 1}> = ({frame: f, box, hit, from = -1}) => {
  const gid = safeId(React.useId());
  const t = f - hit;
  if (t < -APPROACH || t > BOUNCE + FALL) return null;
  const b = boxXY(box);
  const cx = b.x + 32;
  const top = b.y + 8;
  let x: number;
  let y: number;
  let sx = 1;
  let sy = 1;
  let rot = 0;
  let op = 1;
  if (t < 0) {
    const u = EASE.inCubic(clamp01((t + APPROACH) / APPROACH));
    x = lerp(cx + from * 80, cx, u);
    y = lerp(b.y - 220, top, u);
    sy = 1 + 0.25 * u;
    sx = 1 - 0.12 * u;
  } else if (t < BOUNCE) {
    const u = t / BOUNCE;
    x = lerp(cx, cx - from * 52, u);
    y = lerp(top, b.y - 92, EASE.out(u));
    const sq = t < 4 ? 1 - t / 4 : 0;
    sx = 1 + 0.45 * sq;
    sy = 1 - 0.38 * sq;
    rot = -from * 40 * u;
  } else {
    const u = t - BOUNCE;
    x = cx - from * (52 + 2.4 * u);
    y = b.y - 92 + 0.62 * u * u - 1.5 * u;
    rot = -from * (40 + 14 * u);
    op = 1 - clamp01((u - FALL + 8) / 8);
  }
  // ghosts trail the fast drop
  const ghosts =
    t < 0 && t > -APPROACH + 4
      ? [3, 6].map((d, i) => {
          const u = EASE.inCubic(clamp01((t - d + APPROACH) / APPROACH));
          return <rect key={i} x={lerp(cx + from * 80, cx, u) - SIZE / 2} y={lerp(b.y - 220, top, u) - SIZE / 2} width={SIZE} height={SIZE} rx={5} fill="#E8EDF5" opacity={0.28 - 0.1 * i} />;
        })
      : null;
  // coral flash on the box face, an expanding ring and sparks
  const fl = t >= 0 ? Math.exp(-t / 5) : 0;
  const ring = t >= 0 && t < 18 ? t / 18 : -1;
  const sparks =
    t >= 0 && t < 9
      ? Array.from({length: 7}, (_, i) => {
          const a = -Math.PI * (0.08 + (0.84 * i) / 6);
          const r0 = 16 + t * 5;
          const r1 = r0 + 14 * (1 - t / 9);
          return `M${cx + Math.cos(a) * r0} ${top + Math.sin(a) * r0}L${cx + Math.cos(a) * r1} ${top + Math.sin(a) * r1}`;
        }).join('')
      : '';
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {fl > 0.02 ? <rect x={b.x + 3} y={b.y + 3} width={58} height={58} rx={4} fill={PAL.loss} opacity={0.5 * fl} /> : null}
      {ring >= 0 ? (
        <rect x={b.x - 4 - 16 * ring} y={b.y - 4 - 16 * ring} width={72 + 32 * ring} height={72 + 32 * ring} rx={8 + 6 * ring} fill="none" stroke={PAL.loss} strokeWidth={7 * (1 - ring) + 1.2} opacity={1 - ring} />
      ) : null}
      {sparks ? <path d={sparks} stroke={rgba(PAL.loss, 0.95)} strokeWidth={2.6} strokeLinecap="round" fill="none" /> : null}
      {ghosts}
      <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`} opacity={op}>
        <BitHead x={0} y={0} size={SIZE} color="#DDE3EC" glow={0.55} gid={gid} />
      </g>
    </svg>
  );
};
