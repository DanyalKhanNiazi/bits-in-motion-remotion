/**
 * S09 stops, composed into E as a side-by-side pair across the empty band above the tower and the desk
 * (fix 2: never a stacked right-hand column). Flat, unlit structure-line diagrams (no contact edges, no
 * floor), each showing its real difference:
 *   AMD: one processor package holding both the always-on logic and the "?" (no chipset);
 *   laptops: a slim board with a processor, its own EC chip and a battery (no ATX supply, rocker or +5VSB).
 * Each is revealed by a vertical mask over 8 frames and exits in the f1505–f1512 pause.
 */
import React from 'react';
import {EASE, progress, rectPath, SANS} from '../../shared';
import {T} from './tones';

const S = 3; // structure line width

export const STOP_AMD = {x: 1070, y: 204, w: 240, h: 116};
export const STOP_LAPTOP = {x: 1384, y: 204, w: 360, h: 116};

const mask = (frame: number, at: number, out: number) => {
  const inP = progress(frame, at, 8, EASE.move);
  const outP = 1 - progress(frame, out, 6, EASE.exit);
  return {inP, op: outP};
};

export const StopAMD: React.FC<{frame: number; at: number; out: number; clipId: string}> = ({frame, at, out, clipId}) => {
  if (frame < at) return null;
  const {inP, op} = mask(frame, at, out);
  if (op <= 0) return null;
  const {x, y, w, h} = STOP_AMD;
  const pkg = {x: x + 50, y: y + 2, w: 130, h: 112};
  return (
    <g opacity={op}>
      <defs>
        <clipPath id={clipId}>
          <rect x={x - 10} y={y - 10} width={w + 20} height={(h + 20) * inP} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} fill="none" stroke={T.structure} strokeWidth={S}>
        {/* processor package: substrate + lid */}
        <path d={rectPath(pkg.x, pkg.y, pkg.w, pkg.h, 10)} />
        <path d={rectPath(pkg.x + 12, pkg.y + 12, pkg.w - 24, pkg.h - 24, 6)} strokeWidth={2} strokeOpacity={0.7} />
        {/* inside the package: the always-on block and the "?" block, both here */}
        <path d={rectPath(pkg.x + 24, pkg.y + 58, 28, 28, 4)} />
        <path d={rectPath(pkg.x + 62, pkg.y + 24, 46, 36, 5)} />
        <text x={pkg.x + 85} y={pkg.y + 43} textAnchor="middle" dominantBaseline="central" fill={T.textMuted} stroke="none" style={{fontFamily: SANS, fontWeight: 700, fontSize: 30}}>
          ?
        </text>
      </g>
    </g>
  );
};

export const StopLaptop: React.FC<{frame: number; at: number; out: number; clipId: string}> = ({frame, at, out, clipId}) => {
  if (frame < at) return null;
  const {inP, op} = mask(frame, at, out);
  if (op <= 0) return null;
  const {x, y, w, h} = STOP_LAPTOP;
  const ch = {x, y: y + 18, w: w - 10, h: 84};
  return (
    <g opacity={op}>
      <defs>
        <clipPath id={clipId}>
          <rect x={x - 10} y={y - 10} width={w + 20} height={(h + 20) * inP} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} fill="none" stroke={T.structure} strokeWidth={S}>
        {/* slim laptop chassis */}
        <path d={rectPath(ch.x, ch.y, ch.w, ch.h, 10)} />
        {/* its board: a processor (no separate chipset) and the EC, the lookout as its own small chip */}
        <path d={rectPath(ch.x + 12, ch.y + 12, 186, 60, 6)} strokeWidth={2} strokeOpacity={0.75} />
        <path d={rectPath(ch.x + 28, ch.y + 20, 66, 44, 5)} />
        <path d={rectPath(ch.x + 128, ch.y + 26, 32, 32, 4)} />
        {/* battery, with its terminal nub */}
        <path d={rectPath(ch.x + 214, ch.y + 16, 118, 52, 6)} />
        <path d={rectPath(ch.x + 332, ch.y + 32, 7, 20, 2)} />
      </g>
    </g>
  );
};
