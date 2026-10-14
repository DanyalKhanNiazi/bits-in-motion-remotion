/**
 * Ep03 kit: text. Every piece lands on a word frame (`at`), stays readable (sizes from TS) and carries its own
 * backing when it sits over a busy picture.
 *   <KineticText>  words or numbers that slam, pop, rise, type on or count up
 *   <Label>        a must-read tag with a leader line to a point
 *   <Footnote>     ≤ 6 words, ≥ 30 px, bottom-left above the caption band
 *   <QuestionCard> the big re-hook question
 *   <Counter>      an odometer number (mono digits that roll)
 */
import React, {useContext} from 'react';
import {EASE, MONO, PAL, SANS, SPRING, TS} from './look';
import {CameraContext, screenScale} from './camera';
import {Rich} from './glyphs';
import {TAU, clamp, clamp01, lerp, prog, rgba, springAt} from './util';

export type Align = 'left' | 'center' | 'right';
export type Backing = 'scrim' | 'plate' | 'none';

const warned = new Set<string>();
const warn = (msg: string) => {
  if (warned.has(msg)) return;
  warned.add(msg);
  // eslint-disable-next-line no-console
  console.warn(`[kit] ${msg}`);
};
const words = (s: string) => s.split(/\s+/).filter(Boolean);

/** Soft dark scrim or a knockout plate behind text (sized by the text box itself). */
export const BackingLayer: React.FC<{kind: Backing; opacity?: number}> = ({kind, opacity = 1}) => {
  if (kind === 'none') return null;
  if (kind === 'plate')
    return (
      <div
        style={{
          position: 'absolute',
          inset: '-0.16em -0.36em',
          borderRadius: '0.2em',
          background: rgba('#070B15', 0.84 * opacity),
          border: `2px solid ${rgba(PAL.structure, 0.32 * opacity)}`,
          boxShadow: `0 12px 40px ${rgba('#000000', 0.45 * opacity)}`,
        }}
      />
    );
  return (
    <div
      style={{
        position: 'absolute',
        inset: '-0.55em -0.9em',
        borderRadius: '50%',
        background: `radial-gradient(closest-side, ${rgba('#03060D', 0.78 * opacity)}, ${rgba('#03060D', 0.5 * opacity)} 55%, rgba(3,6,13,0))`,
      }}
    />
  );
};

const fmt = (v: number, decimals: number, sep: boolean): string => {
  const s = v.toFixed(decimals);
  if (!sep) return s;
  const [i, d] = s.split('.');
  const neg = i.startsWith('-');
  const ii = (neg ? i.slice(1) : i).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}${ii}${d !== undefined ? `.${d}` : ''}`;
};

export type KineticProps = {
  frame: number;
  /** the word frame it lands on */
  at: number;
  text: string;
  x: number;
  y: number;
  align?: Align;
  size?: number;
  weight?: 600 | 700;
  color?: string;
  font?: 'sans' | 'mono';
  mode?: 'slam' | 'pop' | 'rise' | 'type' | 'count';
  /** for mode 'count': numbers; the text prop is ignored */
  count?: {from: number; to: number; dur?: number; decimals?: number; prefix?: string; suffix?: string; sep?: boolean};
  /** frames between words (pop, rise) */
  stagger?: number;
  exitAt?: number;
  backing?: Backing;
  /** impact ring colour for 'slam' */
  accent?: string;
  tracking?: number;
  maxWidth?: number;
  /** characters per frame for 'type' */
  rate?: number;
  /** on-screen size: true counter-scales by the Stage camera zoom (font size = screen px); a number also counters that parent scale */
  screen?: boolean | number;
};

export const KineticText: React.FC<KineticProps> = ({
  frame,
  at,
  text,
  x,
  y,
  align = 'center',
  size = TS.keyword,
  weight = 700,
  color = PAL.ink,
  font = 'sans',
  mode = 'pop',
  count,
  stagger = 3,
  exitAt,
  backing = 'scrim',
  accent = PAL.info,
  tracking = -0.01,
  maxWidth,
  rate = 1.1,
  screen,
}) => {
  const inv = screenScale(screen, useContext(CameraContext));
  const t = frame - at;
  if (t < -1) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 9, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  if (size < 30) warn(`KineticText "${text}" is ${size}px (floor 30)`);
  const ax = align === 'left' ? 0 : align === 'right' ? -100 : -50;
  const fam = font === 'mono' ? MONO : SANS;
  const wgt = font === 'mono' ? 500 : weight;
  let body: React.ReactNode = null;
  let s = 1;
  let blur = 0;
  let op = 1;
  let dx = 0;
  let dy = 0;
  let bright = 1;
  let ring: React.ReactNode = null;
  if (mode === 'slam') {
    const sp = springAt(frame, at, SPRING.slam);
    s = lerp(2.3, 1, sp);
    op = clamp01((t + 1) / 2.5);
    blur = Math.max(0, s - 1) * 9;
    if (t >= 4) {
      const k = Math.exp(-(t - 4) / 4);
      dx = 7 * k * Math.sin((t - 4) * 2.6);
      dy = 4 * k * Math.cos((t - 4) * 3.1);
    }
    if (t >= 3) bright = 1 + 0.7 * Math.exp(-(t - 3) / 3);
    if (t >= 3 && t < 24) {
      const u = (t - 3) / 21;
      ring = (
        <>
          <div
            style={{
              position: 'absolute',
              inset: '-0.7em -0.9em',
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${rgba(accent, 0.42 * (1 - u))}, ${rgba(accent, 0.12 * (1 - u))} 55%, ${rgba(accent, 0)})`,
              transform: `scale(${0.55 + 0.75 * EASE.out(u)}, ${0.5 + 0.5 * EASE.out(u)})`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '-0.6em',
              right: '-0.6em',
              top: '104%',
              height: Math.max(3, size * 0.035),
              borderRadius: 4,
              background: `linear-gradient(90deg, ${rgba(accent, 0)}, ${rgba(accent, 0.85 * (1 - u))}, ${rgba(accent, 0)})`,
              transform: `scaleX(${0.4 + 1.1 * EASE.out(u)})`,
            }}
          />
        </>
      );
    }
    body = <Rich text={text} weight={wgt} />;
  } else if (mode === 'count' && count) {
    const dur = count.dur ?? 30;
    const v = lerp(count.from, count.to, prog(frame, at, dur, EASE.out));
    op = clamp01((t + 1) / 4);
    if (t >= dur) s = 1 + 0.06 * Math.exp(-(t - dur) / 4) * Math.cos((t - dur) * 0.7);
    body = (
      <>
        {count.prefix ? <Rich text={count.prefix} weight={wgt} /> : null}
        <span style={{fontVariantNumeric: 'tabular-nums'}}>{fmt(v, count.decimals ?? 0, count.sep ?? true)}</span>
        {count.suffix ? <Rich text={count.suffix} weight={wgt} /> : null}
      </>
    );
  } else if (mode === 'type') {
    const n = clamp(Math.floor((t + 1) * rate), 0, text.length);
    const typing = n < text.length;
    const caretOn = typing || Math.floor((t - text.length / rate) / 8) % 2 === 0;
    body = (
      <>
        <Rich text={text.slice(0, n)} weight={wgt} />
        <span
          style={{
            display: 'inline-block',
            width: '0.42em',
            height: '0.9em',
            marginLeft: '0.06em',
            verticalAlign: '-0.08em',
            background: PAL.info,
            borderRadius: '0.06em',
            opacity: caretOn ? 1 : 0.15,
            boxShadow: `0 0 0.3em ${rgba(PAL.info, 0.8)}`,
          }}
        />
      </>
    );
  } else {
    const ws = words(text);
    if (ws.length > 6 && size >= TS.keywordMin) warn(`KineticText "${text}" has ${ws.length} words (keywords: keep it short)`);
    body = ws.map((w, i) => {
      const a = at + i * stagger;
      if (mode === 'rise') {
        const e = prog(frame, a, 16, EASE.outExpo);
        return (
          <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginRight: i < ws.length - 1 ? '0.26em' : 0}}>
            <span style={{display: 'inline-block', transform: `translateY(${(1 - e) * 105}%)`, filter: e < 1 ? `blur(${(1 - e) * 6}px)` : undefined}}>
              <Rich text={w} weight={wgt} />
            </span>
          </span>
        );
      }
      const sp = springAt(frame, a, SPRING.pop);
      const over = Math.max(0, sp - 1);
      return (
        <span key={i} style={{display: 'inline-block', marginRight: i < ws.length - 1 ? '0.26em' : 0}}>
          <span
            style={{
              display: 'inline-block',
              transformOrigin: '50% 85%',
              transform: `translateY(${(1 - sp) * 0.45}em) scale(${clamp(sp, 0, 1)}) scaleY(${1 + over * 0.6})`,
              opacity: clamp01(sp * 2.5),
            }}
          >
            <Rich text={w} weight={wgt} />
          </span>
        </span>
      );
    });
  }
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: inv !== 1 ? `scale(${inv})` : undefined, transformOrigin: '0 0'}}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(${ax}%, -50%) translate(${dx}px, ${dy - 26 * ex}px)`,
        opacity: op * (1 - ex),
        filter: ex > 0 ? `blur(${ex * 6}px)` : undefined,
        whiteSpace: maxWidth ? 'normal' : 'nowrap',
        maxWidth,
        width: 'max-content',
        textAlign: align,
      }}
    >
      <div style={{position: 'relative', fontSize: size}}>
        <BackingLayer kind={backing} opacity={clamp01((t + 2) / 6)} />
        {ring}
        <div
          style={{
            position: 'relative',
            fontFamily: fam,
            fontWeight: wgt,
            fontSize: size,
            lineHeight: TS.lineHeight,
            letterSpacing: `${tracking}em`,
            color,
            transform: `scale(${s})`,
            transformOrigin: `${align === 'left' ? '0%' : align === 'right' ? '100%' : '50%'} 55%`,
            filter: [blur > 0.2 ? `blur(${blur}px)` : '', bright > 1.01 ? `brightness(${bright})` : ''].filter(Boolean).join(' ') || undefined,
          }}
        >
          {body}
        </div>
      </div>
    </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Label */
export type LabelProps = {
  frame: number;
  at: number;
  text: string;
  /** where the label box attaches (the leader ends here) */
  x: number;
  y: number;
  /** the point the leader points at */
  to?: {x: number; y: number};
  /** which side of (x, y) the box sits on */
  side?: 'left' | 'right';
  size?: number;
  color?: string;
  accent?: string;
  exitAt?: number;
  /** optional mono line under the text (≥ 40 px) */
  sub?: string;
  /** on-screen size: true counter-scales the box, leader and anchor by the Stage camera zoom; a number also counters that parent scale */
  screen?: boolean | number;
};

export const Label: React.FC<LabelProps> = ({frame, at, text, x, y, to, side = 'right', size = TS.label, color = PAL.ink, accent = PAL.info, exitAt, sub, screen}) => {
  const inv = screenScale(screen, useContext(CameraContext));
  if (frame < at - 4) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 7, EASE.exit) : 0;
  if (ex >= 1) return null;
  if (size < TS.labelMin) warn(`Label "${text}" is ${size}px (must-read floor ${TS.labelMin})`);
  const ws = words(text);
  if (ws.length > 6) warn(`Label "${text}" has ${ws.length} words (max 6)`);
  const draw = prog(frame, at - 3, 7, EASE.out);
  const pop = springAt(frame, at - 3, SPRING.snap);
  const dirx = side === 'right' ? 1 : -1;
  const slide = -dirx * 12 * ex;
  const pulse = to ? ((frame - at) % 60) / 60 : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - ex, pointerEvents: 'none'}}>
      {to ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <line
            x1={to.x}
            y1={to.y}
            x2={lerp(to.x, x + slide, draw)}
            y2={lerp(to.y, y, draw)}
            stroke={rgba('#03060D', 0.6)}
            strokeWidth={8 * inv}
            strokeLinecap="round"
          />
          <line x1={to.x} y1={to.y} x2={lerp(to.x, x + slide, draw)} y2={lerp(to.y, y, draw)} stroke={PAL.annotation} strokeWidth={3 * inv} strokeLinecap="round" />
          <circle cx={to.x} cy={to.y} r={22 * inv} fill={rgba(accent, 0.18 * pop)} />
          <circle cx={to.x} cy={to.y} r={10 * pop * inv} fill="none" stroke={accent} strokeWidth={3 * inv} />
          <circle cx={to.x} cy={to.y} r={4.5 * pop * inv} fill={accent} />
          {frame >= at ? <circle cx={to.x} cy={to.y} r={(10 + 30 * pulse) * inv} fill="none" stroke={accent} strokeWidth={2 * inv} opacity={0.55 * (1 - pulse)} /> : null}
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: x + slide, top: y, width: 0, height: 0, transform: inv !== 1 ? `scale(${inv})` : undefined, transformOrigin: '0 0'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 'max-content',
          transform: `translate(${side === 'right' ? 0 : -100}%, -50%)`,
          padding: `${size * 0.2}px ${size * 0.42}px`,
          borderRadius: 12,
          background: rgba('#070B15', 0.86),
          border: `2px solid ${rgba(PAL.annotation, 0.3)}`,
          boxShadow: `0 14px 34px ${rgba('#000000', 0.5)}`,
          opacity: prog(frame, at - 1, 4, EASE.out),
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 10,
            bottom: 10,
            [side === 'right' ? 'left' : 'right']: 0,
            width: 4,
            borderRadius: 2,
            background: accent,
          }}
        />
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.1, color}}>
          {ws.map((w, i) => {
            const e = prog(frame, at - 1 + i, 4, EASE.out);
            return (
              <span key={i} style={{display: 'inline-block', marginRight: i < ws.length - 1 ? '0.26em' : 0}}>
                <span style={{display: 'inline-block', opacity: e, transform: `translateY(${(1 - e) * 6}px)`}}>
                  <Rich text={w} weight={600} />
                </span>
              </span>
            );
          })}
        </div>
        {sub ? (
          <div style={{fontFamily: MONO, fontWeight: 500, fontSize: Math.max(40, size * 0.8), color: PAL.muted, marginTop: 4, opacity: prog(frame, at + 3, 5)}}>
            <Rich text={sub} weight={500} />
          </div>
        ) : null}
      </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Footnote */
export const Footnote: React.FC<{frame: number; at: number; text: string; exitAt?: number; x?: number; y?: number; size?: number; screen?: boolean | number}> = ({
  frame,
  at,
  text,
  exitAt,
  x = 96,
  y = 912,
  size = TS.footnote,
  screen,
}) => {
  const inv = screenScale(screen, useContext(CameraContext));
  if (frame < at) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 8) : 0;
  if (ex >= 1) return null;
  if (words(text).length > 6) warn(`Footnote "${text}" has more than 6 words`);
  if (size < 30) warn(`Footnote "${text}" is ${size}px (floor 30)`);
  const e = prog(frame, at, 10, EASE.out);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: inv !== 1 ? `scale(${inv})` : undefined, transformOrigin: '0 0'}}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 'max-content',
        transform: `translateY(${-100 + (1 - e) * 10}%)`,
        opacity: e * (1 - ex),
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '6px 16px 6px 12px',
        borderRadius: 10,
        background: rgba('#05080F', 0.62),
      }}
    >
      <div style={{width: 6, height: size * 0.9, borderRadius: 3, background: rgba(PAL.annotation, 0.7)}} />
      <div style={{fontFamily: SANS, fontWeight: 600, fontSize: size, color: PAL.muted, whiteSpace: 'nowrap'}}>
        <Rich text={text} weight={600} />
      </div>
    </div>
    </div>
  );
};

/* ---------------------------------------------------------------- QuestionCard */
export const QuestionCard: React.FC<{frame: number; at: number; text: string; exitAt?: number; size?: number; y?: number; accent?: string; scrim?: number}> = ({
  frame,
  at,
  text,
  exitAt,
  size = TS.question,
  y = 500,
  accent = PAL.emphasis,
  scrim = 0.72,
}) => {
  const t = frame - at;
  if (t < -2) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 10, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const ws = words(text);
  if (ws.length > 12) warn(`QuestionCard has ${ws.length} words (max 12 must-read)`);
  const sIn = prog(frame, at - 2, 12, EASE.out);
  const push = 1 + 0.04 * clamp01(t / 150) + 0.08 * ex;
  const under = prog(frame, at + 6 + ws.length * 2, 14, EASE.outExpo);
  const qSpin = -8 + 12 * clamp01(t / 160);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none', opacity: 1 - ex}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 70% 62% at 50% ${(y / 1080) * 100}%, ${rgba('#050913', scrim * 0.78 * sIn)}, ${rgba('#02040A', scrim * sIn)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 1250,
          top: y - 420,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 880,
          lineHeight: 1,
          color: 'rgba(0,0,0,0)',
          WebkitTextStroke: `4px ${rgba(accent, 0.22 * sIn)}`,
          transform: `rotate(${qSpin}deg) scale(${0.92 + 0.1 * clamp01(t / 160)})`,
          transformOrigin: '40% 60%',
        }}
      >
        ?
      </div>
      <div
        style={{
          position: 'absolute',
          left: 960,
          top: y,
          width: 1560,
          transform: `translate(-50%, -50%) scale(${push})`,
          textAlign: 'center',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: size,
          lineHeight: 1.1,
          color: PAL.ink,
          letterSpacing: '-0.015em',
        }}
      >
        {ws.map((w, i) => {
          const a = at + i * 2;
          const e = prog(frame, a, 15, EASE.outExpo);
          const isQ = i === ws.length - 1 && w.endsWith('?');
          const base = isQ ? w.slice(0, -1) : w;
          const qp = springAt(frame, a + 4, SPRING.pop);
          return (
            <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.1em', marginRight: i < ws.length - 1 ? '0.25em' : 0}}>
              <span style={{display: 'inline-block', transform: `translateY(${(1 - e) * 105}%)`}}>
                <Rich text={base} weight={700} />
                {isQ ? <span style={{display: 'inline-block', color: accent, transform: `translateY(${(1 - qp) * 0.3}em) scale(${clamp(qp, 0, 1)})`, transformOrigin: '50% 80%'}}>?</span> : null}
              </span>
            </span>
          );
        })}
        <div style={{margin: '0.18em auto 0', height: 8, width: `${42 * under}%`, borderRadius: 4, background: PAL.info, boxShadow: `0 0 24px ${rgba(PAL.info, 0.7)}`}} />
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Counter (odometer) */
export type CounterProps = {
  frame: number;
  at: number;
  dur?: number;
  from?: number;
  to: number;
  x: number;
  y: number;
  size?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  sep?: boolean;
  color?: string;
  align?: Align;
  caption?: string;
  exitAt?: number;
  backing?: Backing;
  font?: 'sans' | 'mono';
};

export const Counter: React.FC<CounterProps> = ({
  frame,
  at,
  dur = 36,
  from = 0,
  to,
  x,
  y,
  size = TS.hero,
  decimals = 0,
  prefix,
  suffix,
  sep = true,
  color = PAL.ink,
  align = 'center',
  caption,
  exitAt,
  backing = 'scrim',
  font = 'sans',
}) => {
  const t = frame - at;
  if (t < -2) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 9, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const u = prog(frame, at, dur, EASE.out);
  const uP = prog(frame - 1, at, dur, EASE.out);
  const v = lerp(from, to, u);
  const speed = Math.abs(lerp(from, to, u) - lerp(from, to, uP)) * Math.pow(10, decimals);
  const V = Math.abs(v) * Math.pow(10, decimals);
  const maxV = Math.max(Math.abs(from), Math.abs(to)) * Math.pow(10, decimals);
  const nInt = Math.max(1, Math.floor(Math.max(Math.abs(from), Math.abs(to))).toString().length);
  const cols = nInt + decimals;
  const settle = t >= dur ? 1 + 0.05 * Math.exp(-(t - dur) / 4) * Math.cos((t - dur) * 0.7) : 1;
  const fam = font === 'mono' ? MONO : SANS;
  const items: React.ReactNode[] = [];
  for (let k = cols - 1; k >= 0; k--) {
    const c = V / Math.pow(10, k);
    const digit = Math.floor(c) % 10;
    const lower = V % Math.pow(10, k);
    const roll = k === 0 ? c - Math.floor(c) : clamp(lower - (Math.pow(10, k) - 1), 0, 1);
    const isLeading = k >= decimals && k > decimals && V < Math.pow(10, k) && maxV >= Math.pow(10, k);
    if (isLeading && Math.floor(V / Math.pow(10, k)) === 0 && roll < 0.01) {
      continue;
    }
    const intPos = k - decimals;
    items.push(
      <span key={`d${k}`} style={{display: 'inline-block', height: '1.1em', overflow: 'hidden', verticalAlign: 'top', width: font === 'mono' ? '0.6em' : '0.64em', textAlign: 'center'}}>
        <span
          style={{
            display: 'inline-block',
            transform: `translateY(${-roll * 1.1}em)`,
            filter: speed > 20 && k < 2 ? `blur(${Math.min(3, speed / 60)}px)` : undefined,
          }}
        >
          <span style={{display: 'block', height: '1.1em'}}>{digit}</span>
          <span style={{display: 'block', height: '1.1em'}}>{(digit + 1) % 10}</span>
        </span>
      </span>,
    );
    if (k === decimals && decimals > 0) items.push(<span key="dot">.</span>);
    else if (sep && intPos > 0 && intPos % 3 === 0) items.push(<span key={`s${k}`}>,</span>);
  }
  const ax = align === 'left' ? 0 : align === 'right' ? -100 : -50;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${ax}%, -50%) translateY(${-24 * ex}px) scale(${settle})`,
        opacity: clamp01((t + 2) / 4) * (1 - ex),
        textAlign: align,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{position: 'relative', fontSize: size}}>
        <BackingLayer kind={backing} />
        <div style={{position: 'relative', fontFamily: fam, fontWeight: font === 'mono' ? 500 : 700, fontSize: size, lineHeight: 1.1, color, letterSpacing: '-0.02em'}}>
          {prefix ? <Rich text={prefix} weight={700} /> : null}
          {v < 0 ? '-' : null}
          {items}
          {suffix ? <Rich text={suffix} weight={700} /> : null}
        </div>
      </div>
      {caption ? (
        <div style={{position: 'relative', fontFamily: SANS, fontWeight: 600, fontSize: TS.label, color: PAL.muted, marginTop: 6}}>
          <Rich text={caption} weight={600} />
        </div>
      ) : null}
    </div>
  );
};

/** A breathing value for "never static" holds: returns 1 ± amp. */
export const breathe = (frame: number, period = 90, amp = 0.02): number => 1 + amp * Math.sin((TAU * frame) / period);
