// S4 section-local effects (world px): the ghost future write (S3 handoff), the scanner's light shaft entering from
// above, a white wash under the beam, and the coral "lost" ring on a box the scanner reaches too late.
import React from 'react';
import {BOX, EASE, PAL, clamp01, lerp, prog, rgba} from '../../kit';

/** The ghost future write: a dashed, translucent block hovering above a box, bobbing. */
export const GhostWrite: React.FC<{f: number; x: number; y: number; op: number; stretch?: number}> = ({f, x, y, op, stretch = 0}) => {
  if (op <= 0.01) return null;
  const bob = 4 * Math.sin(f / 14);
  const h = BOX * (1 + stretch * 5);
  const top = y + bob - (h - BOX);
  return (
    <svg width={BOX + 40} height={h + 40} viewBox={`-20 -20 ${BOX + 40} ${h + 40}`} style={{position: 'absolute', left: x - 20, top: top - 20, overflow: 'visible', opacity: op}}>
      <rect x={-10} y={-10} width={BOX + 20} height={h + 20} rx={14} fill={rgba('#DDE6F5', 0.06)} />
      <rect x={0} y={0} width={BOX} height={h} rx={9} fill={rgba('#AEB6C4', 0.16)} stroke={rgba('#E6EDF8', 0.75)} strokeWidth={2.5} strokeDasharray="7 6" strokeDashoffset={-f * 0.6} />
      <rect x={14} y={h - 22} width={36} height={6} rx={3} fill={rgba('#E6EDF8', 0.35)} />
    </svg>
  );
};

/** A white light shaft from a source above (sx, sy) down to an elliptical footprint at (tx, ty). HTML only. */
export const LightShaft: React.FC<{sx: number; sy: number; tx: number; ty: number; rx: number; ry?: number; op: number; f: number}> = ({sx, sy, tx, ty, rx, ry = rx * 0.38, op, f}) => {
  if (op <= 0.01) return null;
  const top = 34;
  const x0 = Math.min(sx - top, tx - rx) - 4;
  const x1 = Math.max(sx + top, tx + rx) + 4;
  const y0 = sy;
  const y1 = ty + ry;
  const W = x1 - x0;
  const H = y1 - y0;
  const px = (x: number) => `${(((x - x0) / W) * 100).toFixed(2)}%`;
  const py = (y: number) => `${(((y - y0) / H) * 100).toFixed(2)}%`;
  const poly = `polygon(${px(sx - top)} ${py(sy)}, ${px(sx + top)} ${py(sy)}, ${px(tx + rx)} ${py(ty)}, ${px(tx)} ${py(ty + ry)}, ${px(tx - rx)} ${py(ty)})`;
  const flick = 0.92 + 0.08 * Math.sin(f * 0.9);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: y0,
          width: W,
          height: H,
          clipPath: poly,
          background: `linear-gradient(180deg, ${rgba('#FFFFFF', 0.04)}, ${rgba('#FFFFFF', 0.2 * op * flick)} 70%, ${rgba('#FFFFFF', 0.3 * op * flick)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: tx - rx * 1.5,
          top: ty - ry * 1.9,
          width: rx * 3,
          height: ry * 3.8,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.42 * op * flick)}, ${rgba('#FFFFFF', 0.12 * op)} 60%, rgba(255,255,255,0))`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: tx - rx,
          top: ty - ry,
          width: rx * 2,
          height: ry * 2,
          borderRadius: '50%',
          border: `2px solid ${rgba('#FFFFFF', 0.55 * op)}`,
        }}
      />
    </>
  );
};

/** Coral ring flash around a box (top-left x, y): the scanner reached it too late. */
export const LostRing: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  const t = f - at;
  if (t < 0 || t > 22) return null;
  const u = t / 22;
  const g = 8 + 26 * EASE.out(u);
  return (
    <svg width={BOX + 2 * g + 20} height={BOX + 2 * g + 20} style={{position: 'absolute', left: x - g - 10, top: y - g - 10, overflow: 'visible'}}>
      <rect x={10} y={10} width={BOX + 2 * g} height={BOX + 2 * g} rx={10 + g * 0.3} fill={rgba(PAL.loss, 0.16 * (1 - u))} stroke={PAL.loss} strokeWidth={lerp(7, 1.5, u)} opacity={1 - EASE.inCubic(u)} />
    </svg>
  );
};

/** Coral impact ring (screen or world px, centre) for the stage writes. */
export const ImpactRing: React.FC<{f: number; at: number; x: number; y: number; r?: number}> = ({f, at, x, y, r = 160}) => {
  const t = f - at;
  if (t < 0 || t > 26) return null;
  const u = clamp01(t / 26);
  const rr = r * (0.35 + 0.9 * EASE.out(u));
  return (
    <div
      style={{
        position: 'absolute',
        left: x - rr,
        top: y - rr * 0.42,
        width: rr * 2,
        height: rr * 0.84,
        borderRadius: '50%',
        border: `${lerp(10, 2, u)}px solid ${rgba(PAL.loss, 1 - EASE.inCubic(u))}`,
        boxShadow: `0 0 ${30 * (1 - u)}px ${rgba(PAL.loss, 0.6 * (1 - u))}`,
      }}
    />
  );
};

/** soft white wash (world px) over boxes under a beam footprint */
export const Wash: React.FC<{x: number; y: number; rx: number; ry: number; op: number}> = ({x, y, rx, ry, op}) =>
  op <= 0.01 ? null : (
    <div style={{position: 'absolute', left: x - rx, top: y - ry, width: rx * 2, height: ry * 2, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.28 * op)}, rgba(255,255,255,0))`}} />
  );

export const fadeIn = (f: number, a: number, d = 8) => prog(f, a, d, EASE.out);
