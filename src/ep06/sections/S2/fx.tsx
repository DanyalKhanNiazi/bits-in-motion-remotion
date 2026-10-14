// S2 local effects, composed from kit pieces (no kit edits): tape scrub, bracket, nameplate, box glints,
// spotlight, the photo's Bits riding on a card quad, extra leaders.
import React, {useId} from 'react';
import {AbsoluteFill} from 'remotion';
import {
  BitHead,
  BOX,
  COLS,
  EASE,
  KineticText,
  PAL,
  PITCH,
  ROWS,
  SANS,
  SPRING,
  boxXY,
  clamp01,
  lerp,
  prog,
  rgba,
  rnd,
  safeId,
  springAt,
  textWidth,
  useTextCheck,
} from '../../kit';

type Pt = {x: number; y: number};

/**
 * A literal tape scrub over a scene (the kit's Rewind look without its timecode: DIRECTION §1.1 bans digits on any
 * timer). Sliced displacement, RGB split, scanlines, a tracking band and a ◀◀ (or ▶▶) mark; strength rises and falls.
 */
export const TapeFx: React.FC<{frame: number; at: number; dur: number; dir?: 'back' | 'fwd'; children: React.ReactNode}> = ({frame: f, at, dur, dir = 'back', children}) => {
  const id = safeId(useId());
  const t = (f - at) / dur;
  if (t < 0 || t >= 1) return <>{children}</>;
  const env = Math.sin(Math.PI * clamp01(t));
  const amp = (16 + 36 * rnd(`s2-rw-${f}`)) * (0.35 + 0.65 * env);
  const split = 3 + 8 * env;
  const band = ((f * 41) % 1300) - 110;
  const arrow = dir === 'back' ? 'M44 4 L4 28 L44 52 Z M88 4 L48 28 L88 52 Z' : 'M4 4 L44 28 L4 52 Z M48 4 L88 28 L48 52 Z';
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: PAL.void}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={`${id}-rw`} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.0007 0.055" numOctaves={1} seed={f % 97} result="n" />
            <feComponentTransfer in="n" result="n2">
              <feFuncG type="table" tableValues="0.5 0.5" />
            </feComponentTransfer>
            <feDisplacementMap in="SourceGraphic" in2="n2" scale={amp} xChannelSelector="R" yChannelSelector="G" result="d" />
            <feColorMatrix in="d" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={split} result="ro" />
            <feColorMatrix in="d" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
            <feOffset in="gb" dx={-split} result="gbo" />
            <feBlend in="ro" in2="gbo" mode="screen" />
          </filter>
        </defs>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id}-rw) saturate(0.85) brightness(1.06)`}}>{children}</AbsoluteFill>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)', opacity: 0.6 * env + 0.15}} />
      <div style={{position: 'absolute', left: 0, top: band, width: 1920, height: 90, background: `linear-gradient(180deg, rgba(255,255,255,0), ${rgba('#DDEBFF', 0.16)}, rgba(255,255,255,0))`}} />
      <div style={{position: 'absolute', left: 120, top: 110, opacity: (0.7 + 0.3 * Math.sin(f * 1.3)) * clamp01(env * 3)}}>
        <svg width={92} height={56} viewBox="0 0 92 56">
          <path d={arrow} fill={PAL.ink} />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/** A dark-backed bracket in screen space: a bar over [x0, x1] at y with end ticks hanging down; draws out from the centre. */
export const Bracket: React.FC<{frame: number; at: number; exitAt?: number; x0: number; x1: number; y: number; tick?: number}> = ({frame: f, at, exitAt, x0, x1, y, tick = 30}) => {
  const d = prog(f, at, 12, EASE.out);
  if (d <= 0) return null;
  const ex = exitAt !== undefined ? prog(f, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const cx = (x0 + x1) / 2;
  const a = lerp(cx, x0, d);
  const b = lerp(cx, x1, d);
  const tk = tick * prog(f, at + 8, 8, EASE.out);
  const path = `M${a} ${y + tk} V${y} H${b} V${y + tk}`;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - ex, overflow: 'visible'}}>
      <path d={path} fill="none" stroke={rgba('#03060D', 0.6)} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      <path d={path} fill="none" stroke={rgba(PAL.ink, 0.9)} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      {[a, b].map((x, i) => (
        <circle key={i} cx={x} cy={y + tk} r={6 * prog(f, at + 12, 6)} fill={PAL.ink} />
      ))}
    </svg>
  );
};

/**
 * The file-system nameplate (screen space): a brushed-steel plate drops onto the bracket with "File system"; on `ntfsAt`
 * "NTFS" stamps onto it and the plate grows, "File system" becoming its header line.
 */
export const Nameplate: React.FC<{frame: number; x: number; y: number; fsAt: number; ntfsAt: number; exitAt?: number}> = ({frame: f, x, y, fsAt, ntfsAt, exitAt}) => {
  const u = f >= ntfsAt ? clamp01(springAt(f, ntfsAt, SPRING.slam)) : 0;
  const fsSize = lerp(76, 52, u);
  useTextCheck('keyword', 64, undefined, 'Nameplate File system');
  const drop = springAt(f, fsAt - 2, SPRING.heavy);
  if (f < fsAt - 3) return null;
  const ex = exitAt !== undefined ? prog(f, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const ntfsSize = 168;
  const wFs = textWidth('File system', fsSize, 700, SANS);
  const wN = textWidth('NTFS', ntfsSize, 700, SANS, 0.04);
  const padX = 64;
  const w = Math.max(wFs, lerp(wFs, wN, u)) + padX * 2;
  const h = lerp(fsSize * 1.12 + 56, 52 * 1.12 + ntfsSize * 1.02 + 70, u);
  const top = y - h + 18; // the plate's bottom edge sits on the bracket
  const dy = (1 - Math.min(1, drop)) * -70;
  const hit = f >= ntfsAt ? Math.exp(-(f - ntfsAt) / 5) : 0;
  const sheen = ((f - fsAt) % 150) / 150;
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: top + dy - 14 * ex, width: w, height: h, opacity: clamp01(drop * 2.5) * (1 - ex)}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 18,
          background: 'linear-gradient(180deg, #DDE2E9 0%, #C2C9D3 46%, #A9B1BE 100%)',
          boxShadow: `0 22px 50px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.85), inset 0 -3px 0 rgba(40,50,70,0.35), 0 0 ${60 * hit}px ${rgba('#FFFFFF', 0.5 * hit)}`,
          overflow: 'hidden',
        }}
      >
        <div style={{position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 2px, rgba(0,0,0,0.03) 2px 5px)'}} />
        <div style={{position: 'absolute', top: 0, bottom: 0, left: `${-30 + sheen * 160}%`, width: '22%', background: 'linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.35), rgba(255,255,255,0))'}} />
        {[
          [16, 16],
          [w - 16, 16],
          [16, h - 16],
          [w - 16, h - 16],
        ].map(([sx, sy], i) => (
          <div key={i} style={{position: 'absolute', left: sx - 6, top: sy - 6, width: 12, height: 12, borderRadius: 6, background: 'radial-gradient(circle at 35% 35%, #F4F6F9, #7E8796)', boxShadow: 'inset 0 -1px 1px rgba(0,0,0,0.4)'}} />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: lerp(28, 22, u),
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: fsSize,
          lineHeight: 1.12,
          color: u > 0.5 ? '#3A4560' : PAL.tileInk,
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
          textShadow: '0 1px 0 rgba(255,255,255,0.6)',
        }}
      >
        File system
      </div>
      {f >= ntfsAt - 1 ? (
        <KineticText frame={f} at={ntfsAt} text="NTFS" x={w / 2} y={22 + 52 * 1.12 + 10 + ntfsSize * 0.5} size={ntfsSize} mode="slam" backing="none" color={PAL.tileInk} accent={PAL.ink} tracking={0.04} role="hero" />
      ) : null}
    </div>
  );
};

/** World-space glints over the wall's boxes: a diagonal outline wave ('wave') or a cursor stepping in number order ('order'). */
export const BoxGlints: React.FC<{frame: number; at: number; dur: number; mode: 'wave' | 'order'}> = ({frame: f, at, dur, mode}) => {
  const t = (f - at) / dur;
  if (t < 0 || t > 1.15) return null;
  const buckets: string[][] = [[], [], [], []];
  const N = COLS * ROWS;
  for (let id = 1; id <= N; id++) {
    const c = (id - 1) % COLS;
    const r = Math.floor((id - 1) / COLS);
    let v = 0;
    if (mode === 'wave') {
      const ph = (c + r * 1.4) / (COLS - 1 + (ROWS - 1) * 1.4);
      v = Math.exp(-(((t * 1.25 - 0.1 - ph) / 0.07) ** 2));
    } else {
      const head = t * (N + 10);
      const k = head - (id - 1);
      v = k >= 0 && k < 10 ? 1 - k / 10 : 0;
    }
    if (v < 0.08) continue;
    const b = v > 0.75 ? 0 : v > 0.5 ? 1 : v > 0.28 ? 2 : 3;
    const q = boxXY(id);
    buckets[b].push(`M${q.x - 1} ${q.y - 1}h${BOX + 2}v${BOX + 2}h${-BOX - 2}Z`);
  }
  const ops = [0.95, 0.7, 0.45, 0.22];
  const fade = 1 - clamp01((t - 1) / 0.15);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {buckets.map((ds, i) =>
        ds.length ? <path key={i} d={ds.join('')} fill={rgba(PAL.ink, 0.06 * ops[i])} stroke={PAL.ink} strokeOpacity={ops[i] * fade} strokeWidth={mode === 'order' ? 3 : 2.2} /> : null,
      )}
    </svg>
  );
};

/** One box outline flash (world px): "one box". */
export const BoxFlash: React.FC<{frame: number; at: number; id: number; until?: number}> = ({frame: f, at, id, until}) => {
  if (f < at) return null;
  const end = until ?? at + 40;
  const op = prog(f, at, 4) * (1 - prog(f, end, 8));
  if (op <= 0) return null;
  const q = boxXY(id);
  const pulse = 0.65 + 0.35 * Math.cos((f - at) * 0.35);
  const pad = 4 + 6 * Math.exp(-(f - at) / 5);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <rect x={q.x - pad} y={q.y - pad} width={BOX + pad * 2} height={BOX + pad * 2} rx={8} fill="none" stroke={rgba('#03060D', 0.6)} strokeWidth={8} opacity={op} />
      <rect x={q.x - pad} y={q.y - pad} width={BOX + pad * 2} height={BOX + pad * 2} rx={8} fill={rgba(PAL.ink, 0.06)} stroke={PAL.ink} strokeWidth={3.5} opacity={op * pulse} />
    </svg>
  );
};

/** Screen-space spotlight: everything darkens except a soft pool around (x, y). */
export const Spotlight: React.FC<{x: number; y: number; r: number; amount: number}> = ({x, y, r, amount}) =>
  amount <= 0.01 ? null : (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle ${r * 2.2}px at ${x}px ${y}px, rgba(2,4,10,0) 0%, rgba(2,4,10,0) 22%, ${rgba('#02040A', 0.62 * amount)} 46%, ${rgba('#02040A', 0.93 * amount)} 100%)`,
        pointerEvents: 'none',
      }}
    />
  );

/**
 * The photo's cyan Bits riding on a (tilted) card face: an n×n grid of kit BitHeads mapped onto the parallelogram
 * TL, TR, BL (parent px). `lit` 0..1 global level; `waveAt` sweeps a diagonal pop across them; `pulseAt` brightens all.
 */
export const CardBits: React.FC<{frame: number; tl: Pt; tr: Pt; bl: Pt; n?: number; lit: number; waveAt?: number; waveDur?: number; pulseAt?: number; inset?: number}> = ({
  frame: f,
  tl,
  tr,
  bl,
  n = 6,
  lit,
  waveAt,
  waveDur = 16,
  pulseAt,
  inset = 0.12,
}) => {
  const gid = safeId(useId());
  if (lit <= 0.01) return null;
  const W = 100;
  const ux = {x: (tr.x - tl.x) / W, y: (tr.y - tl.y) / W};
  const vy = {x: (bl.x - tl.x) / W, y: (bl.y - tl.y) / W};
  const m = `matrix(${ux.x} ${ux.y} ${vy.x} ${vy.y} ${tl.x} ${tl.y})`;
  const step = (W * (1 - 2 * inset)) / n;
  const sz = step * 0.56;
  const pulse = pulseAt !== undefined && f >= pulseAt ? Math.exp(-(f - pulseAt) / 7) : 0;
  const heads: React.ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const k = r * n + c;
      let pop = 1;
      let flash = 0;
      if (waveAt !== undefined) {
        const s0 = waveAt + ((c + r) / (2 * (n - 1))) * waveDur;
        pop = f < s0 ? 0.55 : Math.min(1.25, springAt(f, s0, SPRING.pop) * 0.45 + 0.55);
        flash = f >= s0 ? Math.exp(-(f - s0) / 4) : 0;
      }
      const breath = 0.85 + 0.15 * Math.sin((f / 90) * Math.PI * 2 + k * 0.4);
      const x = W * inset + (c + 0.5) * step;
      const y = W * inset + (r + 0.5) * step;
      heads.push(
        <BitHead key={k} gid={`${gid}-${k}`} x={x} y={y} size={sz * pop} color={PAL.photo} glow={0.25 + 0.6 * flash + 0.5 * pulse} opacity={clamp01(lit * (0.55 + 0.45 * breath) + flash * 0.5 + pulse * 0.4)} />,
      );
    }
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      <g transform={m}>{heads}</g>
    </svg>
  );
};

/** Extra leader lines in the Label's style (screen px), drawing out from `from` to each target. */
export const Leaders: React.FC<{frame: number; at: number; exitAt?: number; from: Pt; to: readonly Pt[]}> = ({frame: f, at, exitAt, from, to}) => {
  const ex = exitAt !== undefined ? prog(f, exitAt, 7, EASE.exit) : 0;
  if (f < at - 3 || ex >= 1) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 1 - ex}}>
      {to.map((p, i) => {
        const d = prog(f, at - 3 + i * 3, 8, EASE.out);
        const pop = springAt(f, at + i * 3, SPRING.snap);
        const x2 = lerp(p.x, from.x, d);
        const y2 = lerp(p.y, from.y, d);
        return (
          <g key={i}>
            <line x1={p.x} y1={p.y} x2={x2} y2={y2} stroke={rgba('#03060D', 0.6)} strokeWidth={8} strokeLinecap="round" />
            <line x1={p.x} y1={p.y} x2={x2} y2={y2} stroke={PAL.annotation} strokeWidth={3} strokeLinecap="round" />
            <circle cx={p.x} cy={p.y} r={22} fill={rgba(PAL.structure, 0.18 * pop)} />
            <circle cx={p.x} cy={p.y} r={10 * pop} fill="none" stroke={PAL.structure} strokeWidth={3} />
            <circle cx={p.x} cy={p.y} r={4.5 * pop} fill={PAL.structure} />
          </g>
        );
      })}
    </svg>
  );
};

export {PITCH};
