/**
 * S5 local overlay (world px, drawn over an SSD <Archive> wall): the flash look of `env: 'flash'` carried onto the wall
 * itself. White traces (data moving) run the seams between rows; amber traces (the drive's housekeeping) run the seams
 * between erase groups. With `flip`, the traces appear column by column as the kit's wall flip turns each column, and
 * each turning column catches a bright edge glint (P10 "the storage wall works very differently"). No cyan.
 */
import React from 'react';
import {EASE, GEOM, PAL, prog, safeId} from '../../kit';

const P = 72;
const COLS = 16;
const ROWS = 9;
const X0 = GEOM.wall.x;
const Y0 = GEOM.wall.y;
const W = COLS * P;
const H = ROWS * P;
const WHITE = '#E8EDF5';

type Seam = {d: string; len: number; amber: boolean; ph: number; x: number};
const SEAMS: Seam[] = [];
for (let r = 0; r <= ROWS; r++) {
  const y = Y0 + r * P - 4;
  SEAMS.push({d: `M${X0 - 6} ${y}H${X0 + W + 2}`, len: W + 8, amber: false, ph: (r * 0.37) % 1, x: X0 - 6});
}
for (let g = 0; g <= 4; g++) {
  const x = X0 + g * 4 * P - 4;
  SEAMS.push({d: `M${x} ${Y0 - 6}V${Y0 + H + 2}`, len: H + 8, amber: true, ph: (g * 0.53 + 0.2) % 1, x});
}

/** the kit's per-column flip progress (Archive.tsx flipU), mirrored so the overlay follows the wall exactly */
export const flipColU = (f: number, at: number, dur: number, col: number): number => prog(f, at + (col * Math.max(0, dur - 10)) / (COLS - 1), 10, EASE.inOut);

export const FlashTraces: React.FC<{frame: number; opacity?: number; flip?: {at: number; dur: number}}> = ({frame: f, opacity = 1, flip}) => {
  const cid = `${safeId(React.useId())}-reveal`;
  if (opacity <= 0.001) return null;
  // revealed width (flip): up to the right edge of the last column that has turned past half way
  let revealX = X0 + W + 10;
  const glints: Array<{x: number; k: number}> = [];
  if (flip) {
    let last = -1;
    for (let c = 0; c < COLS; c++) {
      const u = flipColU(f, flip.at, flip.dur, c);
      if (u >= 0.5) last = c;
      if (u > 0.04 && u < 0.96) glints.push({x: X0 + c * P + 32, k: Math.sin(Math.PI * u)});
    }
    revealX = last < 0 ? X0 - 10 : X0 + (last + 1) * P + 2;
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={opacity}>
      <defs>
        <clipPath id={cid}>
          <rect x={X0 - 20} y={Y0 - 20} width={Math.max(0, revealX - X0 + 20)} height={H + 40} />
        </clipPath>
      </defs>
      <g clipPath={flip ? `url(#${cid})` : undefined}>
        {/* faint static traces so the seams read between pulses */}
        <path d={SEAMS.filter((s) => !s.amber).map((s) => s.d).join('')} stroke={WHITE} strokeOpacity={0.1} strokeWidth={1.6} fill="none" />
        <path d={SEAMS.filter((s) => s.amber).map((s) => s.d).join('')} stroke={PAL.drive} strokeOpacity={0.16} strokeWidth={1.8} fill="none" />
        {SEAMS.map((s, i) => {
          const col = s.amber ? PAL.drive : WHITE;
          const per = s.len + 260;
          const off = -((f * (s.amber ? 4 : 6) + s.ph * per) % per);
          return (
            <g key={i}>
              <path d={s.d} fill="none" stroke={col} strokeOpacity={0.22} strokeWidth={9} strokeLinecap="round" strokeDasharray={`64 ${per - 64}`} strokeDashoffset={off} />
              <path d={s.d} fill="none" stroke={col} strokeOpacity={0.95} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={`40 ${per - 40}`} strokeDashoffset={off - 12} />
            </g>
          );
        })}
      </g>
      {glints.map((g) => (
        <g key={g.x} opacity={g.k}>
          <rect x={g.x - 13} y={Y0 - 10} width={26} height={H + 16} fill={PAL.drive} opacity={0.3} />
          <rect x={g.x - 2} y={Y0 - 10} width={4} height={H + 16} rx={2} fill="#FFF4DE" opacity={0.9} />
        </g>
      ))}
    </svg>
  );
};
