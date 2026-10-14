// S4 section-local effects (world px): the ghost future write (S3 handoff), the scanner's light shaft entering from
// above, a white wash under the beam, and the coral "lost" ring on a box the scanner reaches too late.
import React from 'react';
import {BOX, EASE, PAL, clamp01, lerp, mixHex, prog, rgba, scannerAnchors} from '../../kit';
const lerpHex = (a: string, b: string, t: number) => mixHex(a, b, clamp01(t));

/**
 * The ghost future write, drawn exactly as S3 leaves it (S3/marks GhostWrite at rest: dashed grey block ≈ 113 px above
 * the box centre, a dashed drop line, a target ring on the box, a soft shadow), then dissolving (`u` 0 → 1) upward into
 * the scanner's light: the block whitens, stretches up and fades; the aim marks fade.
 */
export const GhostWrite: React.FC<{f: number; cx: number; cy: number; bornAt: number; u: number}> = ({f, cx, cy, bornAt, u}) => {
  if (u >= 1) return null;
  const dip = 0.45;
  const bob = 5 * Math.sin((f - bornAt) / 13);
  const x = cx;
  const y = cy - 128 + 34 * dip + bob;
  const k = 1 - u;
  const stretch = 1 + 3.5 * u;
  const white = u;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <line x1={x} y1={y + 40} x2={cx} y2={cy - 40} stroke={PAL.ink} strokeOpacity={0.4 * k} strokeWidth={2.5} strokeDasharray="6 7" strokeDashoffset={-f * 0.8} />
      <rect x={cx - 38} y={cy - 38} width={76} height={76} rx={9} fill="none" stroke={PAL.ink} strokeOpacity={(0.35 + 0.15 * Math.sin(f / 9)) * k} strokeWidth={2.5} strokeDasharray="9 6" />
      <ellipse cx={cx} cy={cy - 34} rx={30 + 10 * dip} ry={6} fill="#000" opacity={(0.25 + 0.2 * dip) * k} />
      <g transform={`translate(${x} ${y + 36}) scale(${1 - 0.25 * u} ${stretch}) translate(${-x} ${-(y + 36)})`} opacity={k}>
        <circle cx={x} cy={y} r={70} fill={rgba('#FFFFFF', 0.12 + 0.2 * white)} />
        <rect x={x - 36} y={y - 36} width={72} height={72} rx={10} fill={lerpHex(PAL.oldBit, '#FFFFFF', white)} fillOpacity={0.42} stroke={lerpHex(PAL.otherBit, '#FFFFFF', white)} strokeWidth={3.5} strokeDasharray="11 6" strokeDashoffset={f * 0.9} />
        <rect x={x - 24} y={y - 24} width={48} height={48} rx={7} fill={PAL.otherBit} fillOpacity={0.2 * k} />
      </g>
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
          background: `linear-gradient(180deg, ${rgba('#FFFFFF', 0.04)}, ${rgba('#FFFFFF', 0.32 * op * flick)} 70%, ${rgba('#FFFFFF', 0.46 * op * flick)})`,
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

/** a dark pool behind the foreground scanner (hud px), so it separates from the wall */
export const Ground: React.FC<{s: {x: number; y: number; w: number}; f: number; on: number}> = ({s, on}) =>
  on <= 0.01 ? null : (
    <div style={{position: 'absolute', left: s.x - s.w * 0.78, top: s.y - s.w * 0.62, width: s.w * 1.56, height: s.w * 1.3, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#02040A', 0.62 * on)}, ${rgba('#02040A', 0.3 * on)} 60%, rgba(0,0,0,0))`}} />
  );

/** a bright core line from the scanner's lens to its beam target (hud px) */
export const BeamCore: React.FC<{s: {x: number; y: number; w: number}; tgt: {x: number; y: number}; op: number; f: number}> = ({s, tgt, op, f}) => {
  if (op <= 0.01) return null;
  const a = scannerAnchors(s).lens;
  const fl = 0.85 + 0.15 * Math.sin(f * 1.3);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <line x1={a.x} y1={a.y} x2={tgt.x} y2={tgt.y} stroke={rgba('#FFFFFF', 0.12 * op)} strokeWidth={22} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={tgt.x} y2={tgt.y} stroke={rgba('#FFFFFF', 0.75 * op * fl)} strokeWidth={3} strokeLinecap="round" />
      <circle cx={tgt.x} cy={tgt.y} r={10} fill={rgba('#FFFFFF', 0.8 * op * fl)} />
      <circle cx={a.x} cy={a.y} r={16} fill={rgba('#FFFFFF', 0.5 * op)} />
    </svg>
  );
};

/** a white ring that blooms around the header notch when it is found (world px) */
export const HeaderRing: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  const t = f - at;
  if (t < -2 || t > 30) return null;
  const u = clamp01((t + 2) / 32);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <ellipse cx={x} cy={y} rx={30 + 40 * EASE.out(u)} ry={8 + 14 * EASE.out(u)} fill="none" stroke="#FFFFFF" strokeWidth={lerp(4, 0.8, u)} opacity={1 - EASE.inCubic(u)} />
    </svg>
  );
};
