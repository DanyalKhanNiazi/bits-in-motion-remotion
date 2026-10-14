/**
 * Ep03 kit: <ChatScreen>, a clean dark chat UI. The prompt lands in a bubble; the answer streams token by token at
 * given frames, the newest piece flashes cyan and carries the caret (the Bit), and the text not yet written is a fog
 * of ghost words (the layout never reflows: unwritten tokens hold their places).
 *
 * Placement: <ScreenSlot rect={REGIONS.monitorScreen}> inside <Prop src="BIM150_T03_reader-monitor_b" …>, or
 * <ScreenSlot rect={REGIONS.deskScreen}> as a child of the photo env (plate px). The slot sizes the screen and adds
 * the glass reflection and emissive spill; give ChatScreen the slot's w/h.
 */
import React from 'react';
import {PAL, SANS, SPRING} from './look';
import {Rich} from './glyphs';
import type {Region} from './assets';
import {clamp01, prog, rgba, springAt} from './util';

/** Split text into stream tokens: each word with its leading space (punctuation rides with its word). */
export const tokenize = (s: string): string[] => s.match(/\s*\S+/g) ?? [];

export type ChatScreenProps = {
  frame: number;
  w: number;
  h: number;
  prompt?: string;
  promptAt?: number;
  /** 'pop' (bubble springs in) or 'slam' (a wall of text lands all at once with a flash) */
  promptMode?: 'pop' | 'slam';
  /** prompt font size (defaults to fontSize; a long "wall" prompt can be smaller) */
  promptSize?: number;
  answer?: string | readonly string[];
  /** frame of each answer token; or answerAt + rate */
  times?: readonly number[];
  answerAt?: number;
  /** tokens per second (default 6) */
  rate?: number;
  fontSize?: number;
  /** ghost tokens shown ahead of the caret (the not-yet-written fog) */
  fog?: number;
  title?: string;
  /** 0..1 screen brightness (power-on) */
  on?: number;
};

export const ChatScreen: React.FC<ChatScreenProps> = ({
  frame,
  w,
  h,
  prompt,
  promptAt = 0,
  promptMode = 'pop',
  promptSize,
  answer,
  times,
  answerAt = 0,
  rate = 6,
  fontSize = 40,
  fog = 14,
  title = 'Assistant',
  on = 1,
}) => {
  const toks = answer === undefined ? [] : typeof answer === 'string' ? tokenize(answer) : answer;
  const tAt = (i: number) => (times ? (times[i] ?? 1e9) : answerAt + Math.round((i * 30) / rate));
  let shown = 0;
  for (let i = 0; i < toks.length; i++) if (frame >= tAt(i)) shown = i + 1;
  const pad = Math.round(h * 0.05);
  const bar = Math.round(h * 0.085);
  const pIn = prompt ? (promptMode === 'slam' ? prog(frame, promptAt, 3) : springAt(frame, promptAt, SPRING.snap)) : 0;
  const slamFlash = prompt && promptMode === 'slam' && frame >= promptAt ? Math.exp(-(frame - promptAt) / 4) : 0;
  const fs = fontSize;
  const ps = promptSize ?? fs * 0.86;
  const streaming = shown > 0 && shown < toks.length;
  const lastAt = shown > 0 ? tAt(shown - 1) : -1e9;
  const caretBlink = streaming || Math.floor((frame - lastAt) / 9) % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        overflow: 'hidden',
        background: `linear-gradient(180deg, #0F1729 0%, ${PAL.screen} 60%, #0A101C 100%)`,
        fontFamily: SANS,
        opacity: on,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: bar, background: '#141E33', borderBottom: `2px solid ${rgba(PAL.structure, 0.18)}`}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: pad * 0.6 + i * bar * 0.42, top: bar / 2 - bar * 0.12, width: bar * 0.24, height: bar * 0.24, borderRadius: '50%', background: rgba(PAL.structure, 0.45)}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAL.muted, fontWeight: 600, fontSize: bar * 0.42}}>
          {title}
        </div>
      </div>
      {prompt ? (
        <div
          style={{
            position: 'absolute',
            right: pad,
            top: bar + pad * 0.8,
            maxWidth: w * 0.72,
            padding: `${ps * 0.45}px ${ps * 0.7}px`,
            borderRadius: ps * 0.7,
            borderBottomRightRadius: ps * 0.18,
            background: '#26365A',
            color: PAL.ink,
            fontWeight: 600,
            fontSize: ps,
            lineHeight: 1.25,
            transform: `translateY(${(1 - Math.min(1, pIn)) * 30}px) scale(${0.9 + 0.1 * pIn})`,
            transformOrigin: '100% 0%',
            opacity: clamp01(pIn * 2),
            boxShadow: slamFlash > 0 ? `0 0 ${60 * slamFlash}px ${rgba('#FFFFFF', 0.6 * slamFlash)}` : `0 10px 30px rgba(0,0,0,0.35)`,
            filter: slamFlash > 0 ? `brightness(${1 + 1.2 * slamFlash})` : undefined,
          }}
        >
          <Rich text={prompt} weight={600} />
        </div>
      ) : null}
      {toks.length ? (
        <div
          style={{
            position: 'absolute',
            left: pad,
            right: pad * 1.4,
            top: bar + pad * 0.8 + (prompt ? ps * 2.6 : 0),
            display: 'flex',
            gap: fs * 0.5,
          }}
        >
          <div
            style={{
              flex: 'none',
              width: fs * 1.1,
              height: fs * 1.1,
              borderRadius: fs * 0.26,
              background: `linear-gradient(135deg, ${PAL.structure}, ${PAL.structure})`,
              boxShadow: `0 0 ${fs * 0.6}px ${rgba(PAL.structure, 0.45)}`,
              marginTop: fs * 0.06,
              opacity: frame >= tAt(0) - 8 ? 1 : 0.3,
            }}
          />
          <div style={{fontSize: fs, lineHeight: 1.32, color: PAL.ink, fontWeight: 600, letterSpacing: '-0.005em'}}>
            {toks.map((tk, i) => {
              const a = tAt(i);
              const age = frame - a;
              if (age >= 0) {
                const fresh = Math.exp(-age / 7);
                const isNewest = i === shown - 1;
                return (
                  <span key={i} style={{position: 'relative', whiteSpace: 'pre-wrap'}}>
                    <span
                      style={{
                        color: fresh > 0.05 ? `rgb(${Math.round(243 - 243 * fresh * 0.7 + 0)}, ${Math.round(242 - 13 * fresh)}, ${Math.round(238 + 17 * fresh)})` : PAL.ink,
                        textShadow: fresh > 0.05 ? `0 0 ${18 * fresh}px ${rgba(PAL.structure, 0.9 * fresh)}` : undefined,
                        opacity: clamp01(age / 2 + 0.4),
                      }}
                    >
                      <Rich text={tk} weight={600} />
                    </span>
                    {isNewest ? (
                      <span
                        style={{
                          display: 'inline-block',
                          width: fs * 0.42,
                          height: fs * 0.42,
                          marginLeft: fs * 0.14,
                          borderRadius: fs * 0.09,
                          background: PAL.structure,
                          verticalAlign: '0.02em',
                          boxShadow: `0 0 ${fs * 0.5}px ${rgba(PAL.structure, 0.9)}, 0 0 ${fs * 1.2}px ${rgba(PAL.structure, 0.45)}`,
                          opacity: caretBlink ? 1 : 0.25,
                          transform: `scale(${1 + 0.35 * Math.exp(-age / 3)})`,
                        }}
                      />
                    ) : null}
                  </span>
                );
              }
              const ahead = i - shown;
              const fogA = ahead < fog ? 0.5 * (1 - ahead / fog) : 0;
              return (
                <span key={i} style={{whiteSpace: 'pre-wrap', color: 'rgba(0,0,0,0)', textShadow: fogA > 0 ? `0 0 ${fs * 0.32}px ${rgba(PAL.annotation, fogA)}` : 'none'}}>
                  {tk}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: pad,
          right: pad,
          bottom: pad * 0.7,
          height: bar * 0.9,
          borderRadius: bar * 0.45,
          border: `2px solid ${rgba(PAL.structure, 0.28)}`,
          background: '#111A2C',
        }}
      >
        <div style={{position: 'absolute', right: bar * 0.18, top: bar * 0.14, width: bar * 0.62, height: bar * 0.62, borderRadius: '50%', background: rgba(PAL.structure, 0.3)}} />
      </div>
      {slamFlash > 0 ? <div style={{position: 'absolute', inset: 0, background: `rgba(255,255,255,${0.55 * slamFlash})`}} /> : null}
    </div>
  );
};

/** Positions children over a screen region (native or plate px), with glass reflection and emissive spill. */
export const ScreenSlot: React.FC<{rect: Region; children?: React.ReactNode; glow?: number; reflection?: number}> = ({rect, children, glow = 1, reflection = 1}) => {
  if (rect.shape !== 'rect') return null;
  return (
    <div style={{position: 'absolute', left: rect.x, top: rect.y, width: rect.w, height: rect.h}}>
      {glow > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: -rect.w * 0.04,
            borderRadius: rect.w * 0.05,
            background: `radial-gradient(closest-side, ${rgba('#5AB8FF', 0.22 * glow)}, rgba(0,0,0,0))`,
            filter: 'blur(20px)',
          }}
        />
      ) : null}
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 4}}>{children}</div>
      {reflection > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(118deg, rgba(255,255,255,${0.1 * reflection}) 0%, rgba(255,255,255,${0.035 * reflection}) 28%, rgba(255,255,255,0) 42%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
};

/** Token frames for an answer streamed at `rate` tokens/s from `start`, with seeded human-like jitter. */
export const streamTimes = (n: number, start: number, rate: number, jitter = 0.25): number[] => {
  const out: number[] = [];
  let f = start;
  for (let i = 0; i < n; i++) {
    out.push(Math.round(f));
    const base = 30 / rate;
    const j = 1 + jitter * Math.sin(i * 2.17 + 0.5) * Math.cos(i * 0.73);
    f += base * j;
  }
  return out;
};
