/**
 * S9 reader chat: the kit ChatScreen look (same chrome, bubble, avatar, fresh-cyan tokens, the Bit as caret), but with
 * a MEASURED layout so the section knows where the prompt bubble and the caret are (for the volley, the dive and the
 * underline), a transparent mode (over the Bridge in the finale) and a smooth auto-scroll.
 */
import React from 'react';
import {EASE, PAL, SANS, clamp01, prog, rgba, textWidth, useFontsReady} from '../../kit';

export type ChatSpec = {
  w: number;
  h: number;
  fs: number;
  prompt: string;
  tokens: readonly string[];
  times: readonly number[];
};

export type ChatLayout = {
  bar: number;
  pad: number;
  ps: number;
  bubble: {x: number; y: number; w: number; h: number; lines: string[]};
  left: number;
  top: number;
  LH: number;
  toks: Array<{x: number; w: number; line: number; word: string}>;
  lineStart: number[];
};

const wrapWords = (text: string, size: number, maxW: number): string[] => {
  const ws = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of ws) {
    const t = cur ? `${cur} ${w}` : w;
    if (cur && textWidth(t, size, 600) > maxW) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  if (cur) lines.push(cur);
  return lines;
};

export const chatLayout = (s: ChatSpec): ChatLayout => {
  const bar = Math.round(s.h * 0.085);
  const pad = Math.round(s.h * 0.05);
  const ps = s.fs * 0.86;
  const padX = ps * 0.7;
  const padY = ps * 0.45;
  const lines = wrapWords(s.prompt, ps, s.w * 0.72 - 2 * padX);
  const bw = Math.max(...lines.map((l) => textWidth(l, ps, 600))) + 2 * padX;
  const bh = lines.length * ps * 1.25 + 2 * padY;
  const bubble = {x: s.w - pad - bw, y: bar + pad * 0.8, w: bw, h: bh, lines};
  const left = pad + s.fs * 1.1 + s.fs * 0.5;
  const top = bubble.y + bh + s.fs * 0.85;
  const maxW = s.w - left - pad * 1.4;
  const LH = s.fs * 1.32;
  const sp = textWidth(' ', s.fs, 600);
  const toks: ChatLayout['toks'] = [];
  const lineStart: number[] = [0];
  let x = 0;
  let line = 0;
  s.tokens.forEach((t, i) => {
    const word = t.trimStart();
    const lead = t.length > word.length && x > 0 ? sp : 0;
    const w = textWidth(word, s.fs, 600);
    const forced = t.slice(0, t.length - word.length).includes('\n');
    if (x > 0 && (forced || x + lead + w > maxW)) {
      line += 1;
      x = 0;
      lineStart.push(i);
      toks.push({x: 0, w, line, word});
      x = w;
    } else {
      toks.push({x: x + lead, w, line, word});
      x += lead + w;
    }
  });
  return {bar, pad, ps, bubble, left, top, LH, toks, lineStart};
};

/** Auto-scroll (content px) so the newest line's bottom stays above `limit`. */
export const chatScroll = (L: ChatLayout, times: readonly number[], limit: number, f: number): number => {
  let prevR = 0;
  let s = 0;
  L.lineStart.forEach((ti, j) => {
    const R = Math.max(prevR, L.top + (j + 1) * L.LH + L.LH * 0.2 - limit);
    if (R > prevR) s += (R - prevR) * prog(f, times[ti] ?? 1e9, 12, EASE.inOut);
    prevR = R;
  });
  return s;
};

/** Slot-px position of the caret (the Bit) after the newest token. */
export const caretAt = (L: ChatLayout, times: readonly number[], f: number, scroll = 0): {x: number; y: number; i: number} => {
  let n = -1;
  times.forEach((t, i) => {
    if (f >= t) n = i;
  });
  if (n < 0) return {x: L.left, y: L.top + L.LH * 0.5 - scroll, i: -1};
  const t = L.toks[n];
  return {x: L.left + t.x + t.w + 12, y: L.top + t.line * L.LH + L.LH * 0.5 - scroll, i: n};
};

export type ReaderChatProps = ChatSpec & {
  frame: number;
  promptAt: number;
  /** a slam (wall + flash) instead of a soft pop */
  slam?: boolean;
  transparent?: boolean;
  /** keep the newest line above this slot y (auto-scroll); default: no scroll */
  limit?: number;
  fog?: number;
  underline?: {from: number; to: number; at: number};
  /** overall text opacity (fade the overlay in) */
  opacity?: number;
  chrome?: number;
};

export const ReaderChat: React.FC<ReaderChatProps> = (p) => {
  useFontsReady();
  const {frame: f, w, h, fs, tokens, times, transparent = false, fog = 12, underline, opacity = 1, chrome = 1} = p;
  const L = chatLayout(p);
  const scroll = p.limit !== undefined ? chatScroll(L, times, p.limit, f) : 0;
  let shown = 0;
  times.forEach((t, i) => {
    if (f >= t) shown = i + 1;
  });
  const pIn = p.slam ? prog(f, p.promptAt, 3) : prog(f, p.promptAt, 10, EASE.outBack);
  const flash = p.slam && f >= p.promptAt ? Math.exp(-(f - p.promptAt) / 4) : 0;
  const lastAt = shown > 0 ? times[shown - 1] : -1e9;
  const streaming = shown > 0 && shown < tokens.length;
  const blink = streaming || Math.floor((f - lastAt) / 9) % 2 === 0;
  const clipTop = L.bar + 4;
  const clipBottom = h - L.pad * 0.7 - L.bar * 0.9 - 8;
  const ul = underline ? prog(f, underline.at, 12, EASE.out) : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', fontFamily: SANS}}>
      {!transparent ? <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, #0F1729 0%, ${PAL.screen} 60%, #0A101C 100%)`}} /> : null}
      {transparent ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: w, height: (p.limit ?? h * 0.4) + L.LH * 0.9, background: `linear-gradient(180deg, ${rgba('#070D1A', 0.92 * opacity)} 0%, ${rgba('#070D1A', 0.78 * opacity)} 62%, rgba(7,13,26,0) 100%)`}} />
      ) : null}
      {/* title bar */}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: L.bar, background: transparent ? rgba('#141E33', 0.9) : '#141E33', borderBottom: `2px solid ${rgba(PAL.structure, 0.18)}`, opacity: chrome}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: L.pad * 0.6 + i * L.bar * 0.42, top: L.bar / 2 - L.bar * 0.12, width: L.bar * 0.24, height: L.bar * 0.24, borderRadius: '50%', background: rgba(PAL.structure, 0.45)}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: L.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAL.muted, fontWeight: 600, fontSize: L.bar * 0.42}}>Assistant</div>
      </div>
      {/* scrolling content */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: clipTop,
          width: w,
          height: clipBottom - clipTop,
          overflow: 'hidden',
          opacity,
          WebkitMaskImage: p.limit !== undefined ? `linear-gradient(180deg, rgba(0,0,0,0) 0px, #000 ${L.LH * 0.9}px, #000 100%)` : undefined,
          maskImage: p.limit !== undefined ? `linear-gradient(180deg, rgba(0,0,0,0) 0px, #000 ${L.LH * 0.9}px, #000 100%)` : undefined,
        }}
      >
        <div style={{position: 'absolute', left: 0, top: -clipTop - scroll, width: w, height: h * 3}}>
          {/* prompt bubble */}
          {pIn > 0 ? (
            <div
              style={{
                position: 'absolute',
                left: L.bubble.x,
                top: L.bubble.y,
                width: L.bubble.w,
                height: L.bubble.h,
                padding: `${L.ps * 0.45}px ${L.ps * 0.7}px`,
                boxSizing: 'border-box',
                borderRadius: L.ps * 0.7,
                borderBottomRightRadius: L.ps * 0.18,
                background: '#26365A',
                color: PAL.ink,
                fontWeight: 600,
                fontSize: L.ps,
                lineHeight: 1.25,
                transform: `translateY(${(1 - Math.min(1, pIn)) * 24}px) scale(${0.92 + 0.08 * pIn})`,
                transformOrigin: '100% 0%',
                opacity: clamp01(pIn * 2),
                boxShadow: flash > 0 ? `0 0 ${70 * flash}px ${rgba('#FFFFFF', 0.65 * flash)}` : '0 10px 30px rgba(0,0,0,0.35)',
                filter: flash > 0.02 ? `brightness(${1 + 1.3 * flash})` : undefined,
                whiteSpace: 'nowrap',
              }}
            >
              {L.bubble.lines.map((l, i) => (
                <div key={i}>{l}</div>
              ))}
            </div>
          ) : null}
          {/* avatar */}
          <div
            style={{
              position: 'absolute',
              left: L.pad,
              top: L.top + fs * 0.08,
              width: fs * 1.1,
              height: fs * 1.1,
              borderRadius: fs * 0.26,
              background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`,
              boxShadow: `0 0 ${fs * 0.6}px ${rgba(PAL.info, 0.45)}`,
              opacity: shown > 0 || f >= (times[0] ?? 1e9) - 10 ? 1 : 0.3,
            }}
          />
          {/* answer tokens */}
          {L.toks.map((t, i) => {
            const a = times[i] ?? 1e9;
            const age = f - a;
            const top = L.top + t.line * L.LH;
            if (age >= 0) {
              const fresh = Math.exp(-age / 7);
              return (
                <span
                  key={i}
                  style={{
                    position: 'absolute',
                    left: L.left + t.x,
                    top,
                    fontSize: fs,
                    fontWeight: 600,
                    lineHeight: `${L.LH}px`,
                    whiteSpace: 'pre',
                    color: fresh > 0.05 ? `rgb(${Math.round(243 - 170 * fresh)}, ${Math.round(242 - 13 * fresh)}, ${Math.round(238 + 17 * fresh)})` : PAL.ink,
                    textShadow: fresh > 0.05 ? `0 0 ${18 * fresh}px ${rgba(PAL.info, 0.9 * fresh)}` : transparent ? `0 2px 10px ${rgba('#000000', 0.8)}` : undefined,
                    opacity: clamp01(age / 2 + 0.4),
                  }}
                >
                  {t.word}
                </span>
              );
            }
            const ahead = i - shown;
            const fa = ahead < fog && f >= (times[0] ?? 1e9) - 6 ? 0.5 * (1 - ahead / fog) * prog(f, (times[0] ?? 1e9) - 6, 8) : 0;
            if (fa <= 0) return null;
            return (
              <span key={i} style={{position: 'absolute', left: L.left + t.x, top, fontSize: fs, fontWeight: 600, lineHeight: `${L.LH}px`, whiteSpace: 'pre', color: 'rgba(0,0,0,0)', textShadow: `0 0 ${fs * 0.32}px ${rgba(PAL.annotation, fa)}`}}>
                {t.word}
              </span>
            );
          })}
          {/* the caret: the Bit */}
          {shown > 0 ? (
            (() => {
              const t = L.toks[shown - 1];
              const age = f - lastAt;
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: L.left + t.x + t.w + fs * 0.16,
                    top: L.top + t.line * L.LH + (L.LH - fs * 0.42) / 2 + fs * 0.06,
                    width: fs * 0.42,
                    height: fs * 0.42,
                    borderRadius: fs * 0.09,
                    background: PAL.info,
                    boxShadow: `0 0 ${fs * 0.5}px ${rgba(PAL.info, 0.9)}, 0 0 ${fs * 1.2}px ${rgba(PAL.info, 0.45)}`,
                    opacity: blink ? 1 : 0.25,
                    transform: `scale(${1 + 0.35 * Math.exp(-age / 3)})`,
                  }}
                />
              );
            })()
          ) : null}
          {/* underline: the answer describes itself */}
          {underline && ul > 0
            ? (() => {
                const segs: React.ReactNode[] = [];
                const a = L.toks[underline.from];
                const b = L.toks[underline.to];
                for (let line = a.line; line <= b.line; line++) {
                  const x0 = line === a.line ? a.x : 0;
                  const lastOnLine = L.toks.reduce((m, q, k) => (q.line === line && k <= underline.to ? k : m), underline.from);
                  const x1 = line === b.line ? b.x + b.w : L.toks[lastOnLine].x + L.toks[lastOnLine].w;
                  segs.push(
                    <div
                      key={line}
                      style={{
                        position: 'absolute',
                        left: L.left + x0,
                        top: L.top + line * L.LH + L.LH * 0.9,
                        width: (x1 - x0) * ul,
                        height: Math.max(4, fs * 0.12),
                        borderRadius: 3,
                        background: PAL.info,
                        boxShadow: `0 0 ${fs * 0.5}px ${rgba(PAL.info, 0.8)}`,
                      }}
                    />,
                  );
                }
                return segs;
              })()
            : null}
        </div>
      </div>
      {/* input bar */}
      <div
        style={{
          position: 'absolute',
          left: L.pad,
          right: L.pad,
          bottom: L.pad * 0.7,
          height: L.bar * 0.9,
          borderRadius: L.bar * 0.45,
          border: `2px solid ${rgba(PAL.structure, 0.28)}`,
          background: transparent ? rgba('#111A2C', 0.82) : '#111A2C',
          opacity: chrome,
        }}
      >
        <div style={{position: 'absolute', right: L.bar * 0.18, top: L.bar * 0.14, width: L.bar * 0.62, height: L.bar * 0.62, borderRadius: '50%', background: rgba(PAL.structure, 0.3)}} />
      </div>
      {flash > 0.01 ? <div style={{position: 'absolute', inset: 0, background: `rgba(255,255,255,${0.5 * flash})`}} /> : null}
    </div>
  );
};
