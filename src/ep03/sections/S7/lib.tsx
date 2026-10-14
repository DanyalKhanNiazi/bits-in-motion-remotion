/**
 * S7 shared parts: anchors and cut frames, words on cue, coral chapter badges, the light tunnel, chat chrome,
 * note cards, tiles, an isometric crate, a flying Bit and a cropped asset image. Pure functions of frame.
 */
import React, {useId} from 'react';
import {Img} from 'remotion';
import {
  BackingLayer,
  BitHead,
  EASE,
  Label,
  PAL,
  Rich,
  SANS,
  SPRING,
  TS,
  assetBox,
  assetUrl,
  clamp01,
  lerp,
  mixHex,
  prog,
  rgba,
  rnd,
  rr,
  safeId,
  springAt,
  type AssetName,
  type EaseFn,
} from '../../kit';
import {at, P} from '../../timing';

/* ---------------------------------------------------------------- anchors */
export const a16 = (ph: string, n = 1) => at(16, ph, n).start;
export const a17 = (ph: string, n = 1) => at(17, ph, n).start;
export const a18 = (ph: string, n = 1) => at(18, ph, n).start;
export const FROM = P(16).start;
export const TO = P(19).start;

/** Cut frames (each transition starts here). */
export const CUT = {
  W1: a16('travel') + 8, // whip T1 → data center
  W2: a16('turn') + 30, // whip data center → thinking
  Z1: a16('on top of that') - 4, // zoom through the screen → bridge
  F1: a16('anthropic'), // flash bridge → chip wall
  W3: a17('the second wait') - 7, // whip chip wall → hall 2
  D2: a17('as a chat') + 8, // push through door 2 (20 f)
  F2: a17('those notes'), // flash KV tray → bridge
  W4: a17('and in a real chat') - 4, // whip bridge → chat
  Z2: a17('for our llama') - 8, // zoom through → GB
  F3: a17('the longer the chat'), // flash GB → bridge
  W5: a17('piece') + 16, // whip bridge → hall 3 (holds the tall pile past 'piece')
  D3: a18('sharing') - 2, // push through door 3 (20 f)
  W6: a18('and one trip') - 6, // whip many people → batch
  W7: a18('back in') - 4, // whip field → benchmark
  W8: a18('serving 200') - 6, // whip bits → ×60
  F5: a18('but each') - 4, // flash ×60 → gaps
  W9: a18("that's the tradeoff") - 4, // whip gaps → tradeoff
} as const;
export const DIVE = 20;

/* ---------------------------------------------------------------- words on cue */
export type Cue = {t: string; at: number; color?: string};
export const Words: React.FC<{
  frame: number;
  items: readonly Cue[];
  x: number;
  y: number;
  size?: number;
  align?: 'left' | 'center' | 'right';
  exitAt?: number;
  backing?: 'scrim' | 'plate' | 'none';
  color?: string;
  weight?: 600 | 700;
}> = ({frame: f, items, x, y, size = TS.keyword, align = 'center', exitAt, backing = 'scrim', color = PAL.ink, weight = 700}) => {
  const first = items[0].at;
  if (f < first - 2) return null;
  const ex = exitAt !== undefined ? prog(f, exitAt, 9, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const ax = align === 'left' ? 0 : align === 'right' ? -100 : -50;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${ax}%, -50%) translateY(${-24 * ex}px)`,
        opacity: 1 - ex,
        filter: ex > 0 ? `blur(${ex * 6}px)` : undefined,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{position: 'relative', fontSize: size}}>
        <BackingLayer kind={backing} opacity={clamp01((f - first + 2) / 6)} />
        <div style={{position: 'relative', fontFamily: SANS, fontWeight: weight, fontSize: size, lineHeight: TS.lineHeight, letterSpacing: '-0.01em', color}}>
          {items.map((it, i) => {
            // no overshoot in scale: a word never grows past its laid-out box, so the gaps never collapse
            const e = clamp01(springAt(f, it.at, SPRING.snap));
            const flash = f >= it.at ? Math.exp(-(f - it.at) / 5) : 0;
            return (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  marginRight: i < items.length - 1 ? '0.3em' : 0,
                  transform: `translateY(${(1 - e) * 0.34}em) scale(${0.84 + 0.16 * e})`,
                  transformOrigin: '50% 80%',
                  opacity: clamp01(e * 1.8),
                  color: it.color ?? color,
                  textShadow: flash > 0.05 ? `0 0 ${0.3 * flash}em ${rgba(PAL.info, 0.7 * flash)}` : undefined,
                }}
              >
                <Rich text={it.t} weight={weight} />
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- a kit Label kept inside the safe frame */
/** Kit Label with an explicit size (≥ 52) and its box clamped inside the 64 px margins, clear of the corner badge
 * and above the bottom 140 px. Width is estimated from the text. */
export const SafeLabel: React.FC<{
  frame: number;
  at: number;
  text: string;
  x: number;
  y: number;
  to?: {x: number; y: number};
  side?: 'left' | 'right';
  size?: number;
  accent?: string;
  exitAt?: number;
}> = ({frame, at: a, text, x, y, to, side = 'right', size = 56, accent, exitAt}) => {
  const w = [...text].length * size * 0.56 + size * 0.9;
  const h = size * 1.5;
  let bx = side === 'right' ? Math.min(x, 1856 - w) : Math.max(x, 64 + w);
  const left = side === 'right' ? bx : bx - w;
  let by = Math.min(Math.max(y, 64 + h / 2), 940 - h / 2);
  // keep clear of the corner chapter badge (top-left)
  if (left < CORNER.x + CORNER.r + 30 && by - h / 2 < CORNER.y + CORNER.r + 24) by = CORNER.y + CORNER.r + 24 + h / 2;
  bx = Math.round(bx);
  by = Math.round(by);
  return <Label frame={frame} at={a} text={text} x={bx} y={by} to={to} side={side} size={size} accent={accent} exitAt={exitAt} screen />;
};

/* ---------------------------------------------------------------- coral number badge (matches S6's doors) */
export const Badge: React.FC<{n: number | string; r: number; dim?: number; glow?: number}> = ({n, r, dim = 0, glow = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: -r,
      top: -r,
      width: 2 * r,
      height: 2 * r,
      borderRadius: '50%',
      background: `radial-gradient(circle at 34% 28%, ${mixHex(PAL.wait, '#FFFFFF', 0.28)}, ${PAL.wait} 52%, ${PAL.waitDeep} 100%)`,
      boxShadow: `0 0 ${r * 0.6 * glow}px ${rgba(PAL.wait, 0.5 * glow * (1 - dim))}, inset 0 ${r * 0.07}px 0 rgba(255,255,255,0.4), inset 0 ${-r * 0.08}px 0 rgba(0,0,0,0.25), 0 ${r * 0.14}px ${r * 0.34}px rgba(0,0,0,0.55)`,
      border: `${Math.max(2, r * 0.05)}px solid ${rgba('#FFFFFF', 0.28)}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      filter: dim > 0 ? `saturate(${1 - 0.8 * dim}) brightness(${1 - 0.45 * dim})` : undefined,
    }}
  >
    <span style={{fontFamily: SANS, fontWeight: 700, fontSize: r * 1.22, color: '#FFFFFF', lineHeight: 1, marginTop: -r * 0.08, textShadow: '0 3px 10px rgba(0,0,0,0.35)'}}>{n}</span>
  </div>
);

export const CORNER = {x: 150, y: 138, r: 50} as const;
/** The chapter badge: pops (optionally big at `from`), flies to the corner at `flyAt`, stays until `until`. */
export const ChapterBadge: React.FC<{frame: number; n: number; at: number; from?: {x: number; y: number; r: number}; flyAt?: number; until?: number}> = ({frame: f, n, at: a, from, flyAt, until}) => {
  if (f < a - 1) return null;
  const ex = until !== undefined ? prog(f, until, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const sp = springAt(f, a, SPRING.pop);
  let x: number = CORNER.x;
  let y: number = CORNER.y;
  let r: number = CORNER.r;
  if (from) {
    const u = flyAt !== undefined ? prog(f, flyAt, 18, EASE.inOut) : 0;
    const arc = Math.sin(Math.PI * u) * 60;
    x = lerp(from.x, CORNER.x, u);
    y = lerp(from.y, CORNER.y, u) - arc;
    r = lerp(from.r, CORNER.r, u);
  }
  const ring = f - a;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${Math.max(0, sp) * (1 - ex)})`, opacity: clamp01(sp * 3) * (1 - ex)}}>
      {ring >= 0 && ring < 22 ? (
        <div
          style={{
            position: 'absolute',
            left: -r * 1.9,
            top: -r * 1.9,
            width: r * 3.8,
            height: r * 3.8,
            borderRadius: '50%',
            border: `3px solid ${rgba(PAL.wait, 0.8 * (1 - ring / 22))}`,
            transform: `scale(${0.55 + 0.45 * EASE.out(ring / 22)})`,
          }}
        />
      ) : null}
      <Badge n={n} r={r} />
    </div>
  );
};

/* ---------------------------------------------------------------- light tunnel (push through a door) */
export const tunnelI = (f: number, peak: number, pre = 14, post = 14): number =>
  f < peak ? EASE.inExpo(clamp01((f - (peak - pre)) / pre)) : Math.exp(-(f - peak) / Math.max(1, post / 3));
export const LightTunnel: React.FC<{frame: number; peak: number; pre?: number; post?: number; cx?: number; cy?: number}> = ({frame: f, peak, pre = 14, post = 14, cx = 960, cy = 540}) => {
  const I = tunnelI(f, peak, pre, post);
  if (I < 0.01) return null;
  const streaks = Array.from({length: 46}, (_, i) => {
    const th = rr(`lt-a${i}`, 0, Math.PI * 2);
    const sp = rr(`lt-s${i}`, 26, 60);
    const r0 = (rr(`lt-r${i}`, 0, 1400) + (f - peak + 40) * sp) % 1400;
    const len = 60 + 360 * I * rnd(`lt-l${i}`);
    const w = rr(`lt-w${i}`, 1.5, 5);
    return {x1: cx + Math.cos(th) * r0, y1: cy + Math.sin(th) * r0, x2: cx + Math.cos(th) * (r0 + len), y2: cy + Math.sin(th) * (r0 + len), w, c: i % 4 === 0 ? PAL.info : '#FFFFFF'};
  });
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at ${cx}px ${cy}px, ${rgba('#FFFFFF', 0.88 * I)} 0%, ${rgba('#A9F6FF', 0.6 * I)} 16%, ${rgba(PAL.info, 0.22 * I)} 40%, rgba(0,0,0,0) 72%)`,
          mixBlendMode: 'screen',
        }}
      />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, mixBlendMode: 'screen'}}>
        {streaks.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.c} strokeWidth={s.w} strokeLinecap="round" opacity={0.75 * I} />
        ))}
      </svg>
    </div>
  );
};

/* ---------------------------------------------------------------- chat chrome (matches the kit ChatScreen look) */
export const ChatChrome: React.FC<{w: number; h: number; title?: string; children?: React.ReactNode; tint?: number}> = ({w, h, title = 'Assistant', children}) => {
  const pad = Math.round(h * 0.05);
  const bar = Math.round(h * 0.085);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: `linear-gradient(180deg, #0F1729 0%, ${PAL.screen} 60%, #0A101C 100%)`, fontFamily: SANS}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: bar, background: '#141E33', borderBottom: `2px solid ${rgba(PAL.structure, 0.18)}`, zIndex: 2}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: pad * 0.6 + i * bar * 0.42, top: bar / 2 - bar * 0.12, width: bar * 0.24, height: bar * 0.24, borderRadius: '50%', background: rgba(PAL.structure, 0.45)}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAL.muted, fontWeight: 600, fontSize: bar * 0.42}}>{title}</div>
      </div>
      <div style={{position: 'absolute', left: 0, top: bar, width: w, height: h - bar}}>{children}</div>
      <div style={{position: 'absolute', left: pad, right: pad, bottom: pad * 0.7, height: bar * 0.9, borderRadius: bar * 0.45, border: `2px solid ${rgba(PAL.structure, 0.28)}`, background: '#111A2C', zIndex: 2}}>
        <div style={{position: 'absolute', right: bar * 0.18, top: bar * 0.14, width: bar * 0.62, height: bar * 0.62, borderRadius: '50%', background: rgba(PAL.structure, 0.3)}} />
      </div>
    </div>
  );
};

/** Skeleton text: rounded bars standing for words (texture, not must-read). */
export const Skel: React.FC<{seed: string; lines: number; width: number; h?: number; gap?: number; color?: string; last?: number; reveal?: number}> = ({seed, lines, width, h = 14, gap = 12, color = rgba(PAL.annotation, 0.5), last = 0.6, reveal = 1}) => {
  const rows: React.ReactNode[] = [];
  let total = 0;
  const all: Array<{x: number; y: number; w: number}> = [];
  for (let l = 0; l < lines; l++) {
    const lw = l === lines - 1 ? width * last : width;
    let x = 0;
    let k = 0;
    while (x < lw - 20) {
      const ww = Math.min(lw - x, rr(`${seed}-${l}-${k}`, 26, 92));
      all.push({x, y: l * (h + gap), w: ww});
      x += ww + 9;
      k++;
    }
  }
  total = all.length;
  const shown = Math.floor(total * clamp01(reveal));
  all.forEach((b, i) => {
    if (i < shown) rows.push(<div key={i} style={{position: 'absolute', left: b.x, top: b.y, width: b.w, height: h, borderRadius: h / 2, background: color}} />);
  });
  return <div style={{position: 'relative', width, height: lines * (h + gap) - gap}}>{rows}</div>;
};

/* ---------------------------------------------------------------- note card and tile */
export const NoteCard: React.FC<{w: number; h: number; tab: 'cyan' | 'magenta'; glow?: number; style?: React.CSSProperties}> = ({w, h, tab, glow = 0, style}) => {
  const c = tab === 'cyan' ? PAL.info : PAL.emphasis;
  return (
    <div
      style={{
        position: 'absolute',
        left: -w / 2,
        top: -h / 2,
        width: w,
        height: h,
        borderRadius: w * 0.14,
        background: `linear-gradient(180deg, #F4F6FA 0%, ${PAL.tileMid} 100%)`,
        boxShadow: `inset 0 2px 0 rgba(255,255,255,0.9), 0 ${h * 0.06}px 0 ${PAL.tileEdge}, 0 ${h * 0.22}px ${h * 0.3}px rgba(0,0,0,0.45)${glow > 0 ? `, 0 0 ${18 * glow}px ${rgba(c, 0.8 * glow)}` : ''}`,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h * 0.2, background: c, boxShadow: `0 0 ${w * 0.3}px ${rgba(c, 0.8)}`}} />
    </div>
  );
};

export const Tile: React.FC<{s: number; glow?: number; text?: string; op?: number}> = ({s, glow = 0, text, op = 1}) => (
  <div
    style={{
      position: 'absolute',
      left: -s / 2,
      top: -s / 2,
      width: s,
      height: s,
      borderRadius: s * 0.22,
      opacity: op,
      background: `linear-gradient(180deg, #FFFFFF 0%, ${PAL.tile} 45%, ${PAL.tileMid} 100%)`,
      boxShadow: `inset 0 2px 0 rgba(255,255,255,0.95), 0 ${s * 0.1}px 0 ${PAL.tileEdge}, 0 ${s * 0.3}px ${s * 0.4}px rgba(0,0,0,0.5)${glow > 0 ? `, 0 0 0 ${2 + 2 * glow}px ${rgba(PAL.info, 0.9 * glow)}, 0 0 ${24 * glow}px ${rgba(PAL.info, 0.6 * glow)}` : ''}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: SANS,
      fontWeight: 600,
      fontSize: s * 0.42,
      color: PAL.tileInk,
    }}
  >
    {text ?? null}
  </div>
);

/* ---------------------------------------------------------------- an isometric crate (SVG, centred on 0,0) */
export const IsoCrate: React.FC<{s: number; glow?: number; label?: string}> = ({s, glow = 1, label}) => {
  const a = s * 0.5; // half width along each iso axis
  const h = s * 0.42;
  const top = `M0 ${-a * 0.5 - h} L${a} ${-h} L0 ${a * 0.5 - h} L${-a} ${-h} Z`;
  const left = `M${-a} ${-h} L0 ${a * 0.5 - h} L0 ${a * 0.5} L${-a} 0 Z`;
  const right = `M${a} ${-h} L0 ${a * 0.5 - h} L0 ${a * 0.5} L${a} 0 Z`;
  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) {
      const u0 = i / 3 + 0.04;
      const u1 = (i + 1) / 3 - 0.04;
      const v0 = j / 3 + 0.04;
      const v1 = (j + 1) / 3 - 0.04;
      const pt = (u: number, v: number) => `${(u - v) * a} ${-a * 0.5 - h + (u + v) * a * 0.5}`;
      tiles.push(<path key={`${i}${j}`} d={`M${pt(u0, v0)} L${pt(u1, v0)} L${pt(u1, v1)} L${pt(u0, v1)} Z`} fill={(i + j) % 2 ? '#DCE2EA' : '#C3CCD8'} />);
    }
  const slabs: React.ReactNode[] = [];
  for (let k = 0; k < 3; k++) {
    const y0 = -h * (0.18 + k * 0.27);
    const y1 = y0 - h * 0.2;
    slabs.push(<path key={`l${k}`} d={`M${-a * 0.92} ${y0 + 0.04 * a} L${-a * 0.08} ${y0 + a * 0.46} L${-a * 0.08} ${y1 + a * 0.46} L${-a * 0.92} ${y1 + 0.04 * a} Z`} fill={k === 2 ? '#C9D1DC' : '#9AA5B6'} />);
    slabs.push(<path key={`r${k}`} d={`M${a * 0.92} ${y0 + 0.04 * a} L${a * 0.08} ${y0 + a * 0.46} L${a * 0.08} ${y1 + a * 0.46} L${a * 0.92} ${y1 + 0.04 * a} Z`} fill={k === 2 ? '#E1E6EE' : '#B4BECC'} />);
  }
  return (
    <g>
      <ellipse cx={0} cy={a * 0.52} rx={a * 1.15} ry={a * 0.32} fill="rgba(0,0,0,0.5)" />
      <path d={left} fill="#1A2846" />
      <path d={right} fill="#22345A" />
      {slabs}
      <path d={top} fill="#15233F" />
      {tiles}
      <path d={`M${-a} 0 L0 ${a * 0.5} L${a} 0`} fill="none" stroke={PAL.info} strokeWidth={Math.max(2, s * 0.035)} opacity={0.95} />
      {glow > 0 ? <path d={`M${-a} 0 L0 ${a * 0.5} L${a} 0`} fill="none" stroke={PAL.info} strokeWidth={s * 0.12} opacity={0.25 * glow} /> : null}
      {label ? (
        <text x={0} y={-h * 0.45} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={s * 0.2} fill={PAL.info}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

/* ---------------------------------------------------------------- a flying Bit with a pixel trail */
export type Pt = {x: number; y: number};
const bez = (p0: Pt, c: Pt, p1: Pt, t: number): Pt => ({x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * c.x + t * t * p1.x, y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * c.y + t * t * p1.y});
export const bitPos = (f: number, from: number, to: number, p0: Pt, p1: Pt, c?: Pt, ease: EaseFn = EASE.inOut): Pt =>
  bez(p0, c ?? {x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2}, p1, ease(clamp01((f - from) / Math.max(1, to - from))));
export const FlyBit: React.FC<{frame: number; from: number; to: number; p0: Pt; p1: Pt; c?: Pt; size?: number; ease?: EaseFn; hideAfter?: number; color?: string}> = ({
  frame: f,
  from,
  to,
  p0,
  p1,
  c,
  size = 26,
  ease = EASE.inOut,
  hideAfter,
  color = PAL.info,
}) => {
  const gid = safeId(useId());
  if (f < from - 4) return null;
  if (hideAfter !== undefined && f > to + hideAfter) return null;
  const p = bitPos(f, from, to, p0, p1, c, ease);
  const segs: React.ReactNode[] = [];
  for (let k = 1; k <= 8; k++) {
    const a = bitPos(f - k + 1, from, to, p0, p1, c, ease);
    const b = bitPos(f - k, from, to, p0, p1, c, ease);
    if (Math.hypot(a.x - b.x, a.y - b.y) < 0.5) continue;
    const q = 1 - k / 9;
    segs.push(<line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={size * 0.6 * q + 1} strokeOpacity={0.8 * q * q} strokeLinecap="round" />);
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {segs}
      <BitHead x={p.x} y={p.y} size={size} color={color} gid={gid} />
    </svg>
  );
};

/* ---------------------------------------------------------------- a cropped asset image (native-px crop box) */
export const CropImg: React.FC<{
  src: AssetName;
  crop: {x0: number; y0: number; x1: number; y1: number};
  x: number;
  y: number;
  w: number;
  tiltX?: number;
  tiltY?: number;
  rim?: string;
  op?: number;
  dy?: number;
  bright?: number;
  children?: React.ReactNode;
}> = ({src, crop, x, y, w, tiltX = 0, tiltY = 0, rim, op = 1, dy = 0, bright = 1, children}) => {
  const b = assetBox(src);
  const k = w / (crop.x1 - crop.x0);
  const cw = (crop.x1 - crop.x0) * k;
  const ch = (crop.y1 - crop.y0) * k;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - cw / 2,
        top: y - ch / 2 + dy,
        width: cw,
        height: ch,
        opacity: op,
        transform: tiltX || tiltY ? `perspective(1800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` : undefined,
        filter: [rim ? `drop-shadow(0 0 2px ${rgba(rim, 0.8)}) drop-shadow(0 0 16px ${rgba(rim, 0.35)})` : '', bright !== 1 ? `brightness(${bright})` : ''].filter(Boolean).join(' ') || undefined,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, width: cw, height: ch, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -crop.x0 * k, top: -crop.y0 * k, width: b.w * k, height: b.h * k}}>
          <Img src={assetUrl(src)} style={{position: 'absolute', left: 0, top: 0, width: b.w * k, height: b.h * k}} />
          <div style={{position: 'absolute', left: 0, top: 0, width: b.w, height: b.h, transform: `scale(${k})`, transformOrigin: '0 0'}}>{children}</div>
        </div>
      </div>
    </div>
  );
};

/** A small chat-bubble glyph (conversation marker). */
export const ChatGlyph: React.FC<{s: number; color?: string; fill?: string; lines?: number}> = ({s, color = PAL.ink, fill = '#26365A', lines = 2}) => (
  <svg width={s * 1.3} height={s} viewBox="0 0 130 100" style={{position: 'absolute', left: -s * 0.65, top: -s / 2, overflow: 'visible'}}>
    <path d="M14 6 H116 Q126 6 126 16 V62 Q126 72 116 72 H52 L30 92 L32 72 H14 Q4 72 4 62 V16 Q4 6 14 6 Z" fill={fill} stroke={color} strokeWidth={5} strokeLinejoin="round" />
    {Array.from({length: lines}, (_, i) => (
      <rect key={i} x={22} y={22 + i * 18} width={i === lines - 1 ? 52 : 86} height={9} rx={4.5} fill={rgba(color, 0.75)} />
    ))}
  </svg>
);
