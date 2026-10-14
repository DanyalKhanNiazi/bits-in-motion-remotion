/**
 * Ep06 UI kit: verdicts, chips and attributed quote strips.
 *
 *   <VerdictCard frame={f} at={a} text="Deleted means unlisted, not erased" accentWord="unlisted" exitAt={b} />
 *   <VerdictChip frame={f} at={a} text="Unlisted" tone="kept" x={500} y={190} />
 *   <QuoteStrip frame={f} at={a} source="Microsoft · Windows File Recovery page" quote="…the file data can still exist and be recovered." />
 *   <QuoteStrip frame={f} at={a} source="Microsoft warns" reported="any use of your computer can create files that overwrite that space" />
 *
 * VerdictCard is a keyword (≥ 64 px), chips are ≥ 40 px, the strip's body ≥ 40 px and its attribution a 32 px footnote.
 * Quote mode adds curly quotes (verbatim text only); reported mode never shows quotation marks.
 */
import React, {useContext} from 'react';
import {EASE, PAL, SANS, SPRING} from '../look';
import {CameraContext, screenScale} from '../camera';
import {kitWarn, useTextCheck} from '../text';
import {Rich} from '../glyphs';
import {clamp01, lerp, prog, rgba, springAt} from '../util';
import {wordCount} from './shared';

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9']/g, '');

/* ---------------------------------------------------------------- VerdictCard */
export type VerdictCardProps = {
  frame: number;
  at: number;
  text: string;
  /** the one word to remember (magenta) */
  accentWord?: string;
  exitAt?: number;
  /** centre y (default 855: SplitCompare's verdict band 790–920) */
  y?: number;
  x?: number;
  size?: number;
  /** a chip above the card, e.g. {text: 'On a hard drive', tone: 'neutral'} */
  chip?: {text: string; tone?: ChipTone; at?: number};
  screen?: boolean | number;
};

export const VerdictCard: React.FC<VerdictCardProps> = ({frame: f, at, text, accentWord, exitAt, y = 855, x = 960, size = 72, chip, screen}) => {
  const inv = screenScale(screen, useContext(CameraContext));
  useTextCheck('keyword', size, screen, `VerdictCard "${text}"`);
  if (wordCount(text) > 12) kitWarn(`VerdictCard "${text}" has ${wordCount(text)} words (max 12 must-read)`);
  const t = f - at;
  if (t < -2) return null;
  const ex = exitAt === undefined ? 0 : prog(f, exitAt, 9, EASE.inCubic);
  if (ex >= 1) return null;
  const open = prog(f, at - 2, 9, EASE.outExpo);
  const sl = springAt(f, at, SPRING.slam);
  const s = lerp(1.22, 1, sl);
  const blur = Math.max(0, 1 - sl) * 8;
  const rule = prog(f, at + 4, 14, EASE.outExpo);
  const acc = accentWord ? norm(accentWord) : '';
  const ws = text.split(/\s+/).filter(Boolean);
  const glow = t >= 2 ? Math.exp(-(t - 2) / 8) : 0;
  return (
    <>
      {chip ? <VerdictChip frame={f} at={chip.at ?? at - 6} text={chip.text} tone={chip.tone ?? 'neutral'} x={x} y={y - size * 1.25 * inv} exitAt={exitAt} screen={screen} /> : null}
      <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${inv})`, transformOrigin: '0 0'}}>
        <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(-50%, -50%) translateY(${ex * 18}px) scaleY(${1 - 0.1 * ex})`, opacity: clamp01((t + 3) / 4) * (1 - ex), whiteSpace: 'nowrap'}}>
          <div style={{position: 'relative', padding: `${size * 0.3}px ${size * 0.62}px ${size * 0.36}px`}}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `scaleX(${0.15 + 0.85 * open})`,
                borderRadius: size * 0.22,
                background: `linear-gradient(180deg, ${rgba('#172038', 0.95)}, ${rgba('#080C16', 0.95)})`,
                border: `2px solid ${rgba(PAL.structure, 0.38)}`,
                boxShadow: `0 ${size * 0.3}px ${size * 0.9}px rgba(0,0,0,0.55), inset 0 2px 0 ${rgba('#FFFFFF', 0.08)}`,
                opacity: open,
              }}
            />
            <div
              style={{
                position: 'relative',
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: size,
                lineHeight: 1.1,
                letterSpacing: '-0.015em',
                color: PAL.ink,
                transform: `scale(${s})`,
                filter: blur > 0.2 ? `blur(${blur}px)` : undefined,
              }}
            >
              {ws.map((w, i) => {
                const isAcc = acc !== '' && norm(w) === acc;
                return (
                  <span
                    key={i}
                    style={{
                      color: isAcc ? PAL.emphasis : undefined,
                      textShadow: isAcc ? `0 0 ${size * (0.25 + 0.5 * glow)}px ${rgba(PAL.emphasis, 0.55 + 0.4 * glow)}` : undefined,
                      marginRight: i < ws.length - 1 ? '0.26em' : 0,
                      display: 'inline-block',
                    }}
                  >
                    <Rich text={w} weight={700} />
                  </span>
                );
              })}
            </div>
            <div
              style={{
                position: 'absolute',
                left: '12%',
                right: '12%',
                bottom: size * 0.12,
                height: Math.max(3, size * 0.05),
                borderRadius: 3,
                transform: `scaleX(${rule})`,
                background: `linear-gradient(90deg, ${rgba(PAL.ink, 0)}, ${rgba(acc ? PAL.emphasis : PAL.ink, 0.8)}, ${rgba(PAL.ink, 0)})`,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------------------------------------------------------------- VerdictChip */
export type ChipTone = 'kept' | 'lost' | 'neutral';
const TONE: Record<ChipTone, {text: string; edge: string; dot: string | null; bg: string}> = {
  kept: {text: PAL.ink, edge: rgba(PAL.ink, 0.75), dot: PAL.ink, bg: rgba('#0B1220', 0.9)},
  lost: {text: PAL.loss, edge: rgba(PAL.loss, 0.85), dot: PAL.loss, bg: rgba('#1A0C12', 0.9)},
  neutral: {text: PAL.annotation, edge: rgba(PAL.structure, 0.55), dot: null, bg: rgba('#0B1220', 0.86)},
};

export type VerdictChipProps = {
  frame: number;
  at: number;
  text: string;
  tone?: ChipTone;
  x: number;
  y: number;
  align?: 'left' | 'center' | 'right';
  exitAt?: number;
  size?: number;
  screen?: boolean | number;
};

export const VerdictChip: React.FC<VerdictChipProps> = ({frame: f, at, text, tone = 'neutral', x, y, align = 'center', exitAt, size = 44, screen}) => {
  const inv = screenScale(screen, useContext(CameraContext));
  useTextCheck('chip', size, screen, `VerdictChip "${text}"`);
  if (wordCount(text) > 6) kitWarn(`VerdictChip "${text}" has ${wordCount(text)} words (max 6)`);
  const sp = springAt(f, at, SPRING.pop);
  if (sp <= 0.001) return null;
  const ex = exitAt === undefined ? 0 : prog(f, exitAt, 8, EASE.inCubic);
  if (ex >= 1) return null;
  const c = TONE[tone];
  const t = f - at;
  const ping = c.dot && t >= 2 && t < 26 ? (t - 2) / 24 : -1;
  const ax = align === 'left' ? '0%' : align === 'right' ? '-100%' : '-50%';
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${inv})`, transformOrigin: '0 0'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(${ax}, -50%) translateY(${-ex * 14}px) scale(${Math.max(0, 0.6 + 0.4 * sp)})`,
          transformOrigin: align === 'left' ? '0% 50%' : align === 'right' ? '100% 50%' : '50% 50%',
          opacity: clamp01(sp * 2.5) * (1 - ex),
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.36,
          padding: `${size * 0.22}px ${size * 0.55}px ${size * 0.24}px ${c.dot ? size * 0.42 : size * 0.55}px`,
          borderRadius: size,
          background: c.bg,
          border: `${Math.max(2, size * 0.055)}px solid ${c.edge}`,
          boxShadow: `0 ${size * 0.25}px ${size * 0.7}px rgba(0,0,0,0.5)${tone === 'lost' ? `, 0 0 ${size * 0.5}px ${rgba(PAL.loss, 0.25)}` : ''}`,
          whiteSpace: 'nowrap',
        }}
      >
        {c.dot ? (
          <div style={{position: 'relative', width: size * 0.36, height: size * 0.36}}>
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: c.dot, boxShadow: `0 0 ${size * 0.3}px ${rgba(c.dot, 0.8)}`}} />
            {ping >= 0 ? (
              <div style={{position: 'absolute', inset: -size * 0.5 * ping, borderRadius: '50%', border: `${size * 0.05}px solid ${rgba(c.dot, 0.8 * (1 - ping))}`}} />
            ) : null}
          </div>
        ) : null}
        <div style={{fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.1, color: c.text}}>
          <Rich text={text} weight={600} />
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- QuoteStrip */
export type QuoteStripProps = {
  frame: number;
  at: number;
  exitAt?: number;
  /** quote mode: the attribution line ("Microsoft · Windows File Recovery page"); reported mode: the lead ("Microsoft warns", "NIST") */
  source: string;
  /** verbatim words only (curly quotes are added; mark omissions with …) */
  quote?: string;
  /** the voice's paraphrase (no quotation marks) */
  reported?: string;
  /** left edge (align left) or centre (align center), parent px */
  x?: number;
  /** bottom edge of the strip (default 928, above the 140 px keep-out) */
  y?: number;
  align?: 'left' | 'center';
  maxWidth?: number;
  size?: number;
  screen?: boolean | number;
};

export const QuoteStrip: React.FC<QuoteStripProps> = ({frame: f, at, exitAt, source, quote, reported, x, y = 928, align = 'left', maxWidth = 1560, size = 46, screen}) => {
  const inv = screenScale(screen, useContext(CameraContext));
  const body = quote ?? reported ?? '';
  useTextCheck('label', size, screen, `QuoteStrip "${body}"`);
  if (wordCount(body) > 12) kitWarn(`QuoteStrip "${body.slice(0, 40)}…" has ${wordCount(body)} words (max 12)`);
  if (quote !== undefined && reported !== undefined) kitWarn('QuoteStrip: give quote OR reported, not both');
  if (reported !== undefined && /["“”]/.test(reported)) kitWarn('QuoteStrip: reported speech must not carry quotation marks');
  const t = f - at;
  if (t < -1) return null;
  const ex = exitAt === undefined ? 0 : prog(f, exitAt, 10, EASE.inCubic);
  if (ex >= 1) return null;
  const xin = prog(f, at, 12, EASE.outExpo);
  const wipe = prog(f, at + 2, 18, EASE.out);
  const bar = prog(f, at, 8, EASE.out);
  const px = x ?? (align === 'center' ? 960 : 96);
  const foot = Math.max(32, Math.round(size * 0.7));
  return (
    <div style={{position: 'absolute', left: px, top: y, width: 0, height: 0, transform: `scale(${inv})`, transformOrigin: '0 0'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          transform: `translate(${align === 'center' ? '-50%' : '0%'}, 0) translateX(${(1 - xin) * -36 - ex * 30}px)`,
          opacity: clamp01(xin * 2) * (1 - ex),
          width: 'max-content',
          maxWidth,
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: `${size * 0.36}px ${size * 0.62}px ${size * 0.4}px ${size * 0.72}px`,
            borderRadius: size * 0.2,
            background: `linear-gradient(90deg, ${rgba('#0A1020', 0.92)}, ${rgba('#0A1020', 0.8)})`,
            border: `1.5px solid ${rgba(PAL.structure, 0.28)}`,
            boxShadow: `0 ${size * 0.3}px ${size * 0.9}px rgba(0,0,0,0.5)`,
          }}
        >
          <div style={{position: 'absolute', left: size * 0.26, top: size * 0.32, bottom: size * 0.32, width: 6, borderRadius: 3, background: PAL.ink, transform: `scaleY(${bar})`, transformOrigin: '50% 0%'}} />
          <div style={{clipPath: `inset(-10% ${(1 - wipe) * 100}% -10% 0)`}}>
            {quote !== undefined ? (
              <>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.22, color: PAL.ink, textIndent: '-0.42em', paddingLeft: '0.42em'}}>
                  <span style={{color: PAL.annotation}}>{'“'}</span>
                  <Rich text={quote} weight={600} />
                  <span style={{color: PAL.annotation}}>{'”'}</span>
                </div>
                <div style={{marginTop: size * 0.18, fontFamily: SANS, fontWeight: 600, fontSize: foot, lineHeight: 1.2, color: PAL.muted, whiteSpace: 'nowrap'}}>
                  {'—'} {source}
                </div>
              </>
            ) : (
              <div style={{fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.22, color: PAL.ink}}>
                <span style={{fontWeight: 700, color: PAL.annotation}}>{source}:</span> <Rich text={reported ?? ''} weight={600} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
