/**
 * S4 shared drawings: the Enter keycap, padlock, chain link, number badge, word reel tile, iso blocks, the LOOP ring
 * and run pulses. All pure functions of the absolute frame.
 */
import React, {useId} from 'react';
import {Bit, BitHead, EASE, MONO, PAL, SANS, SPRING, clamp01, lerp, prog, rgba, safeId, springAt, tileH, DirBlurFilter, dirBlurStd} from '../../kit';

/* ---------------------------------------------------------------- envelopes */
/** quick attack, exponential decay (0 before `at`) */
export const blip = (f: number, at: number, attack = 3, decay = 10): number => {
  const t = f - at;
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  return Math.exp(-(t - attack) / decay);
};

/* ---------------------------------------------------------------- Enter keycap (HUD) */
export const Keycap: React.FC<{frame: number; x: number; y: number; w?: number; appearAt: number; pressAt: number; exitAt: number}> = ({
  frame: f,
  x,
  y,
  w = 330,
  appearAt,
  pressAt,
  exitAt,
}) => {
  if (f < appearAt - 1) return null;
  const h = w * 0.52;
  const rise = springAt(f, appearAt, SPRING.pop);
  const ex = prog(f, exitAt, 10, EASE.inCubic);
  if (ex >= 1) return null;
  const t = f - pressAt;
  const depth = t < 0 ? 0 : t < 3 ? t / 3 : Math.exp(-(t - 3) / 4);
  const glow = blip(f, pressAt, 2, 9);
  const dy = (1 - rise) * 320 + depth * 13 + ex * 420;
  const ring = t >= 0 && t < 18 ? t / 18 : -1;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(rise * 3) * (1 - ex)}}>
      {/* contact shadow */}
      <div
        style={{
          position: 'absolute',
          left: -w * 0.55,
          top: h * 0.42,
          width: w * 1.1,
          height: h * 0.4,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.65), rgba(0,0,0,0))',
          filter: 'blur(8px)',
          transform: `scale(${1 - depth * 0.08})`,
        }}
      />
      {ring >= 0 ? (
        <div
          style={{
            position: 'absolute',
            left: -w * 0.5,
            top: -h * 0.5,
            width: w,
            height: h,
            borderRadius: h * 0.22,
            border: `4px solid ${rgba(PAL.info, 0.9 * (1 - ring))}`,
            transform: `translateY(${dy}px) scale(${1 + 0.6 * EASE.out(ring)})`,
            boxShadow: `0 0 40px ${rgba(PAL.info, 0.6 * (1 - ring))}`,
          }}
        />
      ) : null}
      <div style={{position: 'absolute', left: -w / 2, top: -h / 2, width: w, height: h, transform: `translateY(${dy}px) scale(${1 + 0.02 * depth}, ${1 - 0.07 * depth})`, transformOrigin: '50% 100%'}}>
        {/* key skirt (thickness) */}
        <div style={{position: 'absolute', left: 0, top: h * 0.14 - depth * 9, width: w, height: h, borderRadius: h * 0.22, background: `linear-gradient(180deg, ${PAL.tileEdge}, #8E97A8)`}} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: h * 0.22,
            background: `linear-gradient(180deg, #FFFFFF 0%, ${PAL.tile} 45%, ${PAL.tileMid} 100%)`,
            boxShadow: [
              'inset 0 3px 0 rgba(255,255,255,0.95)',
              `inset 0 -5px 0 ${rgba(PAL.tileEdge, 0.5)}`,
              glow > 0.01 ? `0 0 0 ${4 + 3 * glow}px ${rgba(PAL.info, 0.95 * glow)}, 0 0 ${60 * glow}px ${rgba(PAL.info, 0.7 * glow)}` : '',
            ]
              .filter(Boolean)
              .join(', '),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: h * 0.12,
          }}
        >
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: h * 0.36, color: PAL.tileInk, letterSpacing: '-0.01em'}}>Enter</span>
          <svg width={h * 0.36} height={h * 0.36} viewBox="0 0 40 40">
            <path d="M32 6 V 22 H 9 M 17 13 L 8 22 L 17 31" fill="none" stroke={PAL.tileInk} strokeWidth={4.4} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- padlock (SVG group, centred on x, y) */
export const Padlock: React.FC<{x: number; y: number; s: number; color?: string; open?: number; drop?: number; glow?: number}> = ({
  x,
  y,
  s,
  color = PAL.wait,
  open = 0,
  drop = 0,
  glow = 0,
}) => {
  if (drop >= 1) return null;
  const bw = s;
  const bh = s * 0.8;
  const sh = s * 0.62;
  const lift = open * s * 0.26;
  const swing = open * -28;
  return (
    <g transform={`translate(${x + drop * s * 0.3}, ${y + drop * drop * s * 2.4}) rotate(${drop * 38})`} opacity={1 - drop}>
      {glow > 0 ? <circle cx={0} cy={0} r={s * 1.25} fill={rgba(color, 0.22 * glow)} /> : null}
      <g transform={`translate(${bw * 0.3}, ${-bh * 0.1 - lift}) rotate(${swing}) translate(${-bw * 0.3}, 0)`}>
        <path
          d={`M ${-bw * 0.3} ${-bh * 0.1} V ${-bh * 0.1 - sh * 0.45} A ${bw * 0.3} ${bw * 0.3} 0 0 1 ${bw * 0.3} ${-bh * 0.1 - sh * 0.45} V ${-bh * 0.1}`}
          fill="none"
          stroke={color}
          strokeWidth={s * 0.15}
          strokeLinecap="round"
        />
      </g>
      <rect x={-bw / 2} y={-bh * 0.15} width={bw} height={bh} rx={s * 0.16} fill={color} />
      <rect x={-bw / 2} y={-bh * 0.15} width={bw} height={bh * 0.32} rx={s * 0.16} fill="#FFFFFF" opacity={0.18} />
      <circle cx={0} cy={bh * 0.2} r={s * 0.1} fill="#3A1410" />
      <rect x={-s * 0.035} y={bh * 0.22} width={s * 0.07} height={s * 0.18} rx={s * 0.03} fill="#3A1410" />
    </g>
  );
};

/* ---------------------------------------------------------------- chain link between two tiles */
export const ChainLink: React.FC<{x: number; y: number; s: number; color: string; glow?: number}> = ({x, y, s, color, glow = 0}) => (
  <g transform={`translate(${x}, ${y})`}>
    {glow > 0 ? <ellipse cx={0} cy={0} rx={s * 1.3} ry={s * 0.7} fill={rgba(color, 0.25 * glow)} /> : null}
    <rect x={-s * 0.95} y={-s * 0.3} width={s * 1.15} height={s * 0.6} rx={s * 0.3} fill="none" stroke={color} strokeWidth={s * 0.16} />
    <rect x={-s * 0.2} y={-s * 0.3} width={s * 1.15} height={s * 0.6} rx={s * 0.3} fill="none" stroke={color} strokeWidth={s * 0.16} />
  </g>
);

/* ---------------------------------------------------------------- round number badge (HTML, world or HUD) */
export const Badge: React.FC<{frame: number; at: number; x: number; y: number; text: string; color: string; size?: number; exitAt?: number}> = ({
  frame: f,
  at,
  x,
  y,
  text,
  color,
  size = 46,
  exitAt,
}) => {
  if (f < at - 1) return null;
  const sp = springAt(f, at, SPRING.pop);
  const ex = exitAt !== undefined ? prog(f, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const r = size * 0.95;
  const ring = f - at;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(sp * 3) * (1 - ex)}}>
      {ring >= 0 && ring < 16 ? (
        <div style={{position: 'absolute', left: -r, top: -r, width: 2 * r, height: 2 * r, borderRadius: '50%', border: `3px solid ${rgba(color, 0.8 * (1 - ring / 16))}`, transform: `scale(${1 + 0.7 * EASE.out(ring / 16)})`}} />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: -r,
          top: -r,
          width: 2 * r,
          height: 2 * r,
          borderRadius: '50%',
          background: `radial-gradient(circle at 40% 35%, ${rgba('#1C2C4C', 0.98)}, ${rgba('#0B1222', 0.98)})`,
          border: `4px solid ${color}`,
          boxShadow: `0 0 26px ${rgba(color, 0.55)}, 0 10px 24px rgba(0,0,0,0.5)`,
          transform: `scale(${Math.max(0, sp)})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: size,
          color: PAL.ink,
          lineHeight: 1,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- a tile whose face is a spinning reel of words */
export const ReelTile: React.FC<{
  frame: number;
  x: number;
  y: number;
  size: number;
  w: number;
  words: readonly string[];
  /** reel position (float index into words) */
  pos: number;
  /** reel speed (words per frame), for blur */
  speed: number;
  glow?: number;
  newest?: number;
  opacity?: number;
}> = ({x, y, size, w, words, pos, speed, glow = 0, newest = 0, opacity = 1}) => {
  const fid = safeId(useId());
  const H = tileH(size);
  const lh = H * 0.86;
  const blur = Math.min(7, Math.abs(speed) * 3.2);
  // one whole word at a time: each tick the next word drops in from above and settles (no half-cut neighbours)
  const k = Math.max(0, Math.min(words.length - 1, Math.round(pos)));
  const into = clamp01((pos - (k - 0.5)) * 2.4);
  const dy = (1 - EASE.out(into)) * -0.34 * H;
  const items: React.ReactNode[] = [
    <div
      key={k}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: H / 2 - size * 0.62 + dy,
        height: size * 1.24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: size,
        color: PAL.tileInk,
        lineHeight: 1,
        opacity: 0.35 + 0.65 * EASE.out(into),
      }}
    >
      {words[k]}
    </div>,
  ];
  const g = clamp01(Math.max(glow, newest));
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: -w * 0.48,
          top: H * 0.42,
          width: w * 0.96,
          height: H * 0.28,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))',
          filter: 'blur(5px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -w / 2,
          top: -H / 2,
          width: w,
          height: H,
          borderRadius: size * 0.24,
          overflow: 'hidden',
          background: `linear-gradient(180deg, #FFFFFF 0%, ${PAL.tile} 40%, ${PAL.tileMid} 100%)`,
          boxShadow: [
            'inset 0 3px 0 rgba(255,255,255,0.95)',
            `inset 0 -4px 0 ${rgba(PAL.tileEdge, 0.45)}`,
            `0 ${size * 0.11}px 0 ${PAL.tileEdge}`,
            `0 ${size * 0.13}px 0 #8E97A8`,
            `0 ${size * 0.4}px ${size * 0.5}px rgba(0,0,0,0.5)`,
            g > 0 ? `0 0 0 ${3 + 2 * g}px ${rgba(PAL.info, 0.95 * g)}, 0 0 ${30 * g}px ${rgba(PAL.info, 0.65 * g)}` : '',
          ]
            .filter(Boolean)
            .join(', '),
        }}
      >
        {blur > 0.3 ? (
          <svg width={0} height={0} style={{position: 'absolute'}}>
            <defs>
              <DirBlurFilter id={`${fid}-rb`} std={[0, blur]} />
            </defs>
          </svg>
        ) : null}
        <div style={{position: 'absolute', inset: 0, filter: blur > 0.3 ? `url(#${fid}-rb)` : undefined}}>{items}</div>
        {/* reel window shading */}
        <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${rgba(PAL.tileMid, 0.7)} 0%, ${rgba(PAL.tile, 0)} 24%, ${rgba(PAL.tile, 0)} 76%, ${rgba('#C9D0DB', 0.7)} 100%)`}} />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- iso blocks */
const C30 = Math.cos(Math.PI / 6);
export type IsoColors = {top: string; left: string; right: string; line: string; edge?: string};
/**
 * A box of a × b × h units drawn in isometric projection, front-bottom vertex at (px, py), unit edge u.
 * a runs back-left, b runs back-right, h runs up. Grid lines mark every unit. Fractional sizes are fine.
 */
export const IsoBox: React.FC<{px: number; py: number; u: number; a: number; b: number; h: number; c: IsoColors; edgeGlow?: number; sweep?: number}> = ({
  px,
  py,
  u,
  a,
  b,
  h,
  c,
  edgeGlow = 0,
  sweep,
}) => {
  if (a <= 0 || b <= 0 || h <= 0) return null;
  const L = (k: number) => ({x: px - k * u * C30, y: py - (k * u) / 2});
  const R = (k: number) => ({x: px + k * u * C30, y: py - (k * u) / 2});
  const up = h * u;
  const P0 = {x: px, y: py};
  const La = L(a);
  const Rb = R(b);
  const Bk = {x: La.x + Rb.x - px, y: La.y + Rb.y - py};
  const pt = (p: {x: number; y: number}, dy = 0) => `${p.x.toFixed(2)},${(p.y - dy).toFixed(2)}`;
  const lines: string[] = [];
  // left face: P0 → La, height up
  for (let i = 1; i < a; i++) {
    const q = L(i);
    lines.push(`M${pt(q)} L${pt(q, up)}`);
  }
  for (let j = 1; j < h; j++) lines.push(`M${pt(P0, j * u)} L${pt(La, j * u)}`);
  // right face
  for (let i = 1; i < b; i++) {
    const q = R(i);
    lines.push(`M${pt(q)} L${pt(q, up)}`);
  }
  for (let j = 1; j < h; j++) lines.push(`M${pt(P0, j * u)} L${pt(Rb, j * u)}`);
  // top face
  for (let i = 1; i < a; i++) {
    const q = L(i);
    lines.push(`M${pt(q, up)} L${pt({x: q.x + Rb.x - px, y: q.y + Rb.y - py}, up)}`);
  }
  for (let i = 1; i < b; i++) {
    const q = R(i);
    lines.push(`M${pt(q, up)} L${pt({x: q.x + La.x - px, y: q.y + La.y - py}, up)}`);
  }
  const lw = Math.max(1, u * 0.07);
  const outline = `M${pt(P0)} L${pt(La)} L${pt(La, up)} L${pt(Bk, up)} L${pt(Rb, up)} L${pt(Rb)} Z M${pt(P0)} L${pt(P0, up)} L${pt(La, up)} M${pt(P0, up)} L${pt(Rb, up)}`;
  return (
    <g>
      <polygon points={`${pt(P0)} ${pt(La)} ${pt(La, up)} ${pt(P0, up)}`} fill={c.left} />
      <polygon points={`${pt(P0)} ${pt(Rb)} ${pt(Rb, up)} ${pt(P0, up)}`} fill={c.right} />
      <polygon points={`${pt(P0, up)} ${pt(La, up)} ${pt(Bk, up)} ${pt(Rb, up)}`} fill={c.top} />
      {sweep !== undefined && sweep > 0 && sweep < 1 ? (
        <polygon points={`${pt(P0)} ${pt(La)} ${pt(La, up)} ${pt(Bk, up)} ${pt(Rb, up)} ${pt(Rb)}`} fill="#FFFFFF" opacity={0.16 * Math.sin(Math.PI * sweep)} />
      ) : null}
      <path d={lines.join(' ')} stroke={c.line} strokeWidth={lw} fill="none" />
      <path d={outline} stroke={c.edge ?? c.line} strokeWidth={lw * 1.6} fill="none" strokeLinejoin="round" opacity={0.9} />
      {edgeGlow > 0 ? <path d={outline} stroke={PAL.info} strokeWidth={lw * 3.2} fill="none" strokeLinejoin="round" opacity={0.55 * edgeGlow} /> : null}
    </g>
  );
};
export const isoHeight = (u: number, a: number, b: number, h: number) => h * u + ((a + b) * u) / 2;

/* ---------------------------------------------------------------- the LOOP ring (S3 motif): track, lap ticks, the Bit */
export const ringPath = (cx: number, cy: number, r: number): string =>
  `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;

export const LoopRing: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  r: number;
  /** laps (continuous); the Bit sits at phase % 1 */
  phase: number;
  /** 0..1 brightness of the track */
  lit?: number;
  ticks?: number;
  tickEvery?: number;
  bitSize?: number;
  dim?: number;
}> = ({frame: f, cx, cy, r, phase, lit = 0.3, ticks = 0, tickEvery = 24, bitSize = 24, dim = 0}) => {
  const id = safeId(useId());
  const d = ringPath(cx, cy, r);
  const tk: React.ReactNode[] = [];
  for (let i = 0; i < Math.min(ticks, 200); i++) {
    const a = (i / tickEvery) * Math.PI * 2 - Math.PI / 2;
    const r0 = r + 16 + Math.floor(i / tickEvery) * 14;
    const r1 = r0 + 12;
    tk.push(
      <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={PAL.info} strokeWidth={4} strokeLinecap="round" opacity={0.85} />,
    );
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, opacity: 1 - dim * 0.55}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <radialGradient id={`${id}-in`}>
            <stop offset="0.55" stopColor={PAL.info} stopOpacity={0} />
            <stop offset="0.92" stopColor={PAL.info} stopOpacity={0.1 + 0.18 * lit} />
            <stop offset="1" stopColor={PAL.info} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r + 26} fill={`url(#${id}-in)`} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={rgba('#03060D', 0.7)} strokeWidth={16} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={PAL.structure} strokeOpacity={0.55} strokeWidth={6} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={PAL.info} strokeOpacity={0.12 + 0.6 * lit} strokeWidth={4} />
        {/* direction chevrons */}
        {[0.125, 0.375, 0.625, 0.875].map((p, i) => {
          const a = p * Math.PI * 2 - Math.PI / 2 + ((f * 0.004) % 1) * 0;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          const deg = (a * 180) / Math.PI + 90;
          return <path key={i} d="M -7 -9 L 4 0 L -7 9" transform={`translate(${x}, ${y}) rotate(${deg})`} fill="none" stroke={PAL.annotation} strokeWidth={3} strokeLinecap="round" opacity={0.55} />;
        })}
        {tk}
      </svg>
      <Bit frame={f} path={d} progress={phase} loop route="none" size={bitSize} />
    </div>
  );
};

/* ---------------------------------------------------------------- an expanding run pulse ring */
export const RunPulse: React.FC<{frame: number; at: number; x: number; y: number; r0: number; r1: number; dur?: number; color?: string; width?: number}> = ({
  frame: f,
  at,
  x,
  y,
  r0,
  r1,
  dur = 22,
  color = PAL.info,
  width = 6,
}) => {
  const t = (f - at) / dur;
  if (t < 0 || t >= 1) return null;
  const r = lerp(r0, r1, EASE.out(t));
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={width * (1 - t) + 1} opacity={0.85 * (1 - t)} />
      <circle cx={x} cy={y} r={r * 0.92} fill="none" stroke={color} strokeWidth={width * 3} opacity={0.18 * (1 - t)} />
    </svg>
  );
};

/* ---------------------------------------------------------------- velocity blur wrapper (for moving groups) */
export const Moving: React.FC<{id: string; vx: number; vy: number; children: React.ReactNode; style?: React.CSSProperties}> = ({id, vx, vy, children, style}) => {
  const std = dirBlurStd(vx, vy, 0.42, 36);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, filter: std ? `url(#${id})` : undefined, ...style}}>
      {std ? (
        <svg width={0} height={0} style={{position: 'absolute'}}>
          <defs>
            <DirBlurFilter id={id} std={std} />
          </defs>
        </svg>
      ) : null}
      {children}
    </div>
  );
};

export {BitHead};
