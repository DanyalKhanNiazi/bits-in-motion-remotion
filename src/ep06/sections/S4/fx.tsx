// S4 section-local effects (world px): the ghost future write (S3 handoff), the scanner's light shaft entering from
// above, a white wash under the beam, and the coral "lost" ring on a box the scanner reaches too late.
import React from 'react';
import {BOX, EASE, PAL, boxXY, clamp01, lerp, mixHex, prog, rgba, scannerAnchors} from '../../kit';
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

/**
 * A live ghost write landing on a free box (world px): the S3-style dashed grey block drops 140 px into box `box`,
 * a 6 f coral ring flashes on impact, then it sits there as a dashed ghost until `exitAt` (it is an illustration, so it
 * never changes the Archive's state).
 */
export const GhostLand: React.FC<{f: number; at: number; box: number; exitAt: number}> = ({f, at, box, exitAt}) => {
  const t = f - at;
  if (t < -10) return null;
  const p = boxXY(box);
  const cx = p.x + BOX / 2;
  const cy = p.y + BOX / 2;
  const fall = t < 0 ? EASE.inCubic((t + 10) / 10) : 1;
  const y = cy - 140 * (1 - fall);
  const op = clamp01((t + 10) / 4) * (1 - prog(f, exitAt, 14));
  const sq = t >= 0 && t < 8 ? 1 - 0.12 * Math.exp(-t / 2) : 1;
  const ring = t >= 0 && t < 12 ? t / 12 : -1;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
      {t < 0 ? <line x1={cx} y1={y - 60} x2={cx} y2={y - 8} stroke={rgba('#E6EDF8', 0.5)} strokeWidth={6} strokeLinecap="round" /> : null}
      <g transform={`translate(${cx} ${y + 30}) scale(${1 / sq} ${sq}) translate(${-cx} ${-(y + 30)})`}>
        <rect x={cx - 30} y={y - 30} width={60} height={60} rx={9} fill={PAL.oldBit} fillOpacity={0.5} stroke={PAL.otherBit} strokeWidth={3} strokeDasharray="10 6" strokeDashoffset={f * 0.9} />
      </g>
      {ring >= 0 ? (
        <rect x={p.x - 6 - 16 * ring} y={p.y - 6 - 16 * ring} width={BOX + 12 + 32 * ring} height={BOX + 12 + 32 * ring} rx={9 + 6 * ring} fill="none" stroke={PAL.loss} strokeWidth={7 * (1 - ring) + 1} opacity={1 - ring} />
      ) : null}
      {t >= 0 && t < 6 ? <rect x={p.x} y={p.y} width={BOX} height={BOX} rx={8} fill={rgba('#FFFFFF', 0.5 * (1 - t / 6))} /> : null}
    </svg>
  );
};

/**
 * A live ghost threat (world px): the dashed grey write hovers over a still-lit photo box (`target`, coral target ring
 * pulsing) while the scanner races to it; once the beam has copied the box it swerves and slams into the free box
 * next door (`miss`) at `land`: white flash, coral ring. It then sits there as a ghost until `exitAt`.
 */
export const GhostThreat: React.FC<{f: number; appear: number; land: number; target: number; miss: number; exitAt: number}> = ({f, appear, land, target, miss, exitAt}) => {
  if (f < appear) return null;
  const a = boxXY(target);
  const b = boxXY(miss);
  const ac = {x: a.x + BOX / 2, y: a.y + BOX / 2};
  const bc = {x: b.x + BOX / 2, y: b.y + BOX / 2};
  const sw = land - 8;
  const t = f - land;
  const hoverY = ac.y - 120 + 5 * Math.sin((f - appear) / 6);
  const u = prog(f, sw, 8, EASE.inCubic);
  const x = lerp(ac.x, bc.x, EASE.out(clamp01(u * 1.6)));
  const y = f < sw ? hoverY - 40 * (1 - prog(f, appear, 8, EASE.out)) : lerp(hoverY, bc.y, u);
  const op = prog(f, appear, 6) * (1 - prog(f, exitAt, 14));
  const danger = f < land ? 0.55 + 0.45 * Math.sin((f - appear) * 0.9) : 0;
  const sq = t >= 0 && t < 8 ? 1 - 0.12 * Math.exp(-t / 2) : 1;
  const ring = t >= 0 && t < 12 ? t / 12 : -1;
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}} opacity={op}>
      {danger > 0 ? (
        <>
          <line x1={x} y1={y + 34} x2={ac.x} y2={ac.y - 36} stroke={PAL.loss} strokeOpacity={0.55 * danger} strokeWidth={3} strokeDasharray="6 6" strokeDashoffset={-f} />
          <rect x={a.x - 6} y={a.y - 6} width={BOX + 12} height={BOX + 12} rx={9} fill="none" stroke={PAL.loss} strokeOpacity={danger} strokeWidth={3} strokeDasharray="9 6" />
        </>
      ) : null}
      <g transform={`translate(${x} ${y + 30}) scale(${1 / sq} ${sq}) translate(${-x} ${-(y + 30)})`}>
        <circle cx={x} cy={y} r={56} fill={rgba('#FFFFFF', 0.1)} />
        <rect x={x - 30} y={y - 30} width={60} height={60} rx={9} fill={PAL.oldBit} fillOpacity={0.5} stroke={PAL.otherBit} strokeWidth={3} strokeDasharray="10 6" strokeDashoffset={f * 0.9} />
      </g>
      {ring >= 0 ? (
        <rect x={b.x - 6 - 16 * ring} y={b.y - 6 - 16 * ring} width={BOX + 12 + 32 * ring} height={BOX + 12 + 32 * ring} rx={9 + 6 * ring} fill="none" stroke={PAL.loss} strokeWidth={7 * (1 - ring) + 1} opacity={1 - ring} />
      ) : null}
      {t >= 0 && t < 6 ? <rect x={b.x} y={b.y} width={BOX} height={BOX} rx={8} fill={rgba('#FFFFFF', 0.5 * (1 - t / 6))} /> : null}
    </svg>
  );
};
