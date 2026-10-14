/**
 * S3 · StreamPane: the kit's chat look with a measured word layout, so we know where every word, the caret and the
 * unwritten tail are. Extras: dashed "not written yet" fog that can crumble, a reading sweep, bunch brackets, a mini
 * loop badge that laps once per word, waiting dots and an all-at-once landing flash.
 */
import React, {useId} from 'react';
import {BitHead, EASE, PAL, Rich, SANS, SPRING, clamp01, lerp, prog, rgba, safeId, springAt, textWidth, useFontsReady} from '../../kit';
import {ANSWER as ANSWER_S4} from '../S4/T';

/** the answer string is S4's, so the reader's chat reads the same across the S3 → S4 cut */
export const ANSWER_TEXT: string = ANSWER_S4;
export const ANSWER_WORDS = ANSWER_TEXT.split(' ');
export const PROMPT = 'Why do AI answers arrive one piece at a time?';

export type PaneGeo = {
  pad: number;
  bar: number;
  fs: number;
  lh: number;
  left: number;
  right: number;
  top: number;
  words: {x: number; y: number; w: number; line: number}[];
  promptBox: {x: number; y: number; w: number; h: number};
  /** the next free spot after word i (for the caret / fog start) */
  after: (i: number) => {x: number; y: number; line: number};
  lines: number;
};

export const paneGeo = (w: number, h: number, fs: number, words: readonly string[], prompt?: string, promptScale = 0.86): PaneGeo => {
  const pad = Math.round(h * 0.05);
  const bar = Math.round(h * 0.085);
  const ps = fs * promptScale;
  const fullW = prompt ? textWidth(prompt, ps, 600) + ps * 1.4 : 0;
  const pw = prompt ? Math.min(w * 0.72, fullW) : 0;
  const pLines = prompt ? (fullW > pw + 1 ? 2 : 1) : 0;
  const ph = prompt ? ps * 1.25 * pLines + ps * 0.9 : 0;
  const promptBox = {x: w - pad - pw, y: bar + pad * 0.8, w: pw, h: ph};
  const top = bar + pad * 0.8 + (prompt ? ph + pad * 0.9 : 0);
  const left = pad + fs * 1.1 + fs * 0.5;
  const right = w - pad * 1.4;
  const lh = fs * 1.36;
  const sp = textWidth(' ', fs, 600);
  const out: PaneGeo['words'] = [];
  let x = left;
  let line = 0;
  for (const wd of words) {
    const ww = textWidth(wd, fs, 600);
    if (x > left && x + ww > right) {
      x = left;
      line++;
    }
    out.push({x, y: top + line * lh, w: ww, line});
    x += ww + sp;
  }
  const after = (i: number) => {
    if (i < 0) return {x: left, y: top, line: 0};
    const q = out[Math.min(i, out.length - 1)];
    return {x: q.x + q.w + fs * 0.18, y: q.y, line: q.line};
  };
  return {pad, bar, fs, lh, left, right, top, words: out, promptBox, after, lines: line + 1};
};

export type PaneProps = {
  frame: number;
  w: number;
  h: number;
  fontSize: number;
  words?: readonly string[];
  /** arrival frame of each word (Infinity = never) */
  times: readonly number[];
  prompt?: string;
  promptAt?: number;
  /** dashed fog after the caret: how many lines of it, when it crumbles */
  fog?: {lines?: number; crumbleAt?: number; opacity?: number; endTile?: boolean};
  /** reading sweep over words [0, upTo) */
  read?: {upTo: number; at: number; dur: number; until?: number};
  bunches?: boolean;
  badge?: {at: number; until?: number};
  waiting?: {until: number};
  flashAt?: number;
  glowFirst?: {at: number; n: number};
  title?: string;
  /** prompt font as a share of the answer font (default 0.86) */
  promptScale?: number;
  /** scroll up like a real chat when the newest line would sink under the input bar */
  autoScroll?: boolean;
};

const BLOCKW = [3.2, 1.6, 4.4, 2.3, 5.1, 2.8, 1.9, 3.7, 2.4, 4.6, 1.7, 3.1, 2.6, 4.9, 2.1, 3.4];

export const StreamPane: React.FC<PaneProps> = ({
  frame: f,
  w,
  h,
  fontSize: fs,
  words = ANSWER_WORDS,
  times,
  prompt,
  promptAt = -1e9,
  fog,
  read,
  bunches,
  badge,
  waiting,
  flashAt,
  glowFirst,
  title = 'Assistant',
  promptScale = 0.86,
  autoScroll = false,
}) => {
  useFontsReady();
  const uid = safeId(useId());
  const G = paneGeo(w, h, fs, words, prompt, promptScale);
  let shown = 0;
  for (let i = 0; i < words.length; i++) if (f >= times[i]) shown = i + 1;
  const lastAt = shown > 0 ? times[shown - 1] : -1e9;
  const nextAt = shown < words.length ? times[shown] : 1e9;
  const streaming = shown > 0 && shown < words.length && Number.isFinite(nextAt);
  const caretOn = streaming || Math.floor((f - lastAt) / 9) % 2 === 0;
  const caret = G.after(shown - 1);
  const pIn = prompt ? (f - promptAt > 90 ? 1 : springAt(f, promptAt, SPRING.snap)) : 0;
  const flash = flashAt !== undefined && f >= flashAt ? Math.exp(-(f - flashAt) / 5) : 0;
  // fog blocks after the caret
  const fogBlocks: {x: number; y: number; w: number; i: number; d: number}[] = [];
  if (fog && shown < words.length) {
    const maxLines = fog.lines ?? 3;
    let x = caret.x + fs * 0.5;
    let line = caret.line;
    let i = 0;
    let d = 0;
    while (line <= caret.line + maxLines && i < 80) {
      const bw = fs * BLOCKW[(i + shown) % BLOCKW.length] * (1 + 0.12 * Math.sin(f / 11 + i * 1.7));
      if (x + bw > G.right) {
        line++;
        x = G.left;
        if (line > caret.line + maxLines) break;
      }
      fogBlocks.push({x, y: G.top + line * G.lh, w: bw, i, d});
      x += bw + fs * 0.42;
      i++;
      d++;
    }
  }
  const nFog = fogBlocks.length;
  // bunches: groups of words that arrived on the same frame
  const groups: {a: number; b: number; t: number}[] = [];
  if (bunches) {
    let i = 0;
    while (i < shown) {
      let j = i;
      while (j + 1 < shown && times[j + 1] === times[i]) j++;
      if (j > i) groups.push({a: i, b: j, t: times[i]});
      i = j + 1;
    }
  }
  const readPos = read ? prog(f, read.at, read.dur, EASE.inOut) * read.upTo : -1;
  // auto-scroll: keep the newest line above the input bar (eased per new line)
  const inputTop = h - G.pad * 0.7 - G.bar * 0.9 - G.pad * 0.4;
  const scrollFor = (idx: number) => (idx < 0 ? 0 : Math.max(0, G.words[Math.min(idx, G.words.length - 1)].y + G.lh * 1.15 - inputTop));
  let scroll = 0;
  if (autoScroll && shown > 0) {
    const now = scrollFor(shown - 1);
    const before = scrollFor(shown - 2);
    scroll = lerp(before, now, EASE.out(clamp01((f - lastAt) / 7)));
  }
  const readFade = read && read.until !== undefined ? 1 - prog(f, read.until, 12) : 1;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: `linear-gradient(180deg, #0F1729 0%, ${PAL.screen} 60%, #0A101C 100%)`, fontFamily: SANS}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, transform: scroll ? `translateY(${-scroll}px)` : undefined}}>
      {/* prompt bubble */}
      {prompt ? (
        <div
          style={{
            position: 'absolute',
            left: G.promptBox.x,
            top: G.promptBox.y,
            width: G.promptBox.w,
            height: G.promptBox.h,
            boxSizing: 'border-box',
            padding: `${fs * promptScale * 0.45}px ${fs * promptScale * 0.7}px`,
            borderRadius: fs * 0.6,
            borderBottomRightRadius: fs * 0.16,
            background: '#26365A',
            color: PAL.ink,
            fontWeight: 600,
            fontSize: fs * promptScale,
            lineHeight: 1.25,
            whiteSpace: 'normal',
            transform: `translateY(${(1 - Math.min(1, pIn)) * 24}px) scale(${0.9 + 0.1 * Math.min(1, pIn)})`,
            transformOrigin: '100% 0%',
            opacity: clamp01(pIn * 2),
            boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          }}
        >
          {prompt}
        </div>
      ) : null}
      {/* avatar */}
      <div
        style={{
          position: 'absolute',
          left: G.pad,
          top: G.top + fs * 0.12,
          width: fs * 1.1,
          height: fs * 1.1,
          borderRadius: fs * 0.26,
          background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`,
          boxShadow: `0 0 ${fs * 0.6}px ${rgba(PAL.info, 0.45)}`,
          opacity: shown > 0 || waiting ? 1 : 0.35,
        }}
      />
      {/* reading sweep (behind the words) */}
      {read && readPos > 0
        ? G.words.slice(0, Math.min(shown, read.upTo)).map((q, i) => {
            const k = clamp01(readPos - i);
            if (k <= 0) return null;
            return (
              <div key={`r${i}`} style={{position: 'absolute', left: q.x - fs * 0.12, top: q.y + fs * 0.06, width: (q.w + fs * 0.3) * k, height: fs * 1.22, borderRadius: fs * 0.16, background: rgba(PAL.info, 0.24 * readFade), borderBottom: `${Math.max(2, fs * 0.09)}px solid ${rgba(PAL.info, 0.85 * readFade)}`}} />
            );
          })
        : null}
      {/* words */}
      {G.words.map((q, i) => {
        const a = times[i];
        if (!(f >= a)) return null;
        const age = f - a;
        const fresh = Math.exp(-age / 7);
        const g1 = glowFirst && i < glowFirst.n && f >= glowFirst.at ? Math.exp(-(f - glowFirst.at) / 14) * (0.6 + 0.4 * Math.sin((f - glowFirst.at) / 2.5)) : 0;
        const glow = Math.max(fresh, g1);
        const isRead = read && i < read.upTo && readPos - i > 0.5 ? readFade : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: q.x,
              top: q.y,
              fontSize: fs,
              lineHeight: 1.32,
              fontWeight: 600,
              whiteSpace: 'pre',
              color: glow > 0.05 ? `rgb(${Math.round(243 - 160 * glow)}, ${Math.round(242 - 10 * glow)}, ${Math.round(238 + 17 * glow)})` : isRead ? '#FFFFFF' : PAL.ink,
              textShadow: glow > 0.05 ? `0 0 ${18 * glow}px ${rgba(PAL.info, 0.9 * glow)}` : undefined,
              opacity: clamp01(age / 2 + 0.4) * (read && i >= read.upTo && readFade > 0 && f >= read.at ? 0.78 : 1),
            }}
          >
            <Rich text={words[i]} weight={600} />
          </div>
        );
      })}
      {/* bunch brackets */}
      {groups.map((gq, gi) => {
        const age = f - gq.t;
        if (age > 16 || age < 0) return null;
        const A = G.words[gq.a];
        const B = G.words[gq.b];
        if (A.line !== B.line) return null;
        const k = 1 - age / 16;
        return (
          <div
            key={`b${gi}`}
            style={{
              position: 'absolute',
              left: A.x - fs * 0.2,
              top: A.y - fs * 0.02,
              width: B.x + B.w - A.x + fs * 0.4,
              height: fs * 1.42,
              borderRadius: fs * 0.25,
              border: `3px solid ${rgba(PAL.infoPale, 0.9 * k)}`,
              boxShadow: `0 0 ${20 * k}px ${rgba(PAL.info, 0.6 * k)}`,
              transform: `scale(${1 + 0.06 * (1 - k)})`,
            }}
          />
        );
      })}
      {/* dashed fog: the words that do not exist yet */}
      {fog?.crumbleAt !== undefined
        ? fogBlocks.map((b) => {
            const c = prog(f, fog.crumbleAt! + b.d * 0.9, 22, EASE.out);
            if (c <= 0 || c >= 1) return null;
            return [0, 1, 2, 3].map((q) => {
              const sx = b.x + b.w * (0.15 + 0.23 * q);
              const dx = (Math.sin(b.i * 3.1 + q * 1.7) * 0.5) * fs * 1.6 * c;
              const dy = -fs * (0.4 + 0.6 * ((q * 37 + b.i * 11) % 7) / 7) * 2.2 * c;
              const sz = fs * 0.14 * (1 - 0.6 * c);
              return <div key={`d${b.i}-${q}`} style={{position: 'absolute', left: sx + dx, top: b.y + fs * 0.6 + dy, width: sz, height: sz, borderRadius: 2, background: rgba(PAL.annotation, 0.8 * (1 - c))}} />;
            });
          })
        : null}
      {fogBlocks.map((b) => {
        const crumble = fog?.crumbleAt !== undefined ? prog(f, fog.crumbleAt + b.d * 0.9, 12, EASE.inCubic) : 0;
        if (crumble >= 1) return null;
        const dist = b.d / Math.max(1, nFog);
        const a = (fog?.opacity ?? 1) * (0.62 - 0.42 * dist) * (0.75 + 0.25 * Math.sin(f / 5 + b.i * 1.3)) * (1 - crumble);
        return (
          <div
            key={`f${b.i}`}
            style={{
              position: 'absolute',
              left: b.x,
              top: b.y + fs * 0.22 - crumble * fs * 0.8,
              width: b.w * (1 - 0.3 * crumble),
              height: fs * 0.82,
              borderRadius: fs * 0.18,
              border: `2px dashed ${rgba(PAL.annotation, a)}`,
              background: rgba(PAL.annotation, 0.05 * a),
              filter: crumble > 0 ? `blur(${crumble * 4}px)` : undefined,
            }}
          />
        );
      })}
      {fog?.endTile && nFog > 0
        ? (() => {
            const last = fogBlocks[nFog - 1];
            const crumble = fog.crumbleAt !== undefined ? prog(f, fog.crumbleAt + nFog * 0.9 + 4, 14, EASE.inCubic) : 0;
            if (crumble >= 1) return null;
            const x = Math.min(G.right - fs * 2.6, last.x + last.w + fs * 0.6);
            return (
              <div
                style={{
                  position: 'absolute',
                  left: x,
                  top: last.y + fs * 0.05 - crumble * fs,
                  padding: `${fs * 0.08}px ${fs * 0.42}px`,
                  borderRadius: fs * 0.22,
                  border: `2px dashed ${rgba(PAL.annotation, 0.7 * (1 - crumble))}`,
                  fontSize: fs * 0.8,
                  fontWeight: 600,
                  color: rgba(PAL.annotation, 0.7 * (1 - crumble)),
                  filter: crumble > 0 ? `blur(${crumble * 5}px)` : undefined,
                }}
              >
                end
              </div>
            );
          })()
        : null}
      {/* caret = the Bit */}
      {shown > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: caret.x,
            top: caret.y + fs * 0.4,
            width: fs * 0.42,
            height: fs * 0.42,
            borderRadius: fs * 0.09,
            background: PAL.info,
            boxShadow: `0 0 ${fs * 0.5}px ${rgba(PAL.info, 0.9)}, 0 0 ${fs * 1.2}px ${rgba(PAL.info, 0.45)}`,
            opacity: caretOn ? 1 : 0.25,
            transform: `scale(${1 + 0.35 * Math.exp(-(f - lastAt) / 3)})`,
          }}
        />
      ) : null}
      {/* the mini loop over the caret: one lap per word */}
      {badge && f >= badge.at && shown > 0
        ? (() => {
            const inn = springAt(f, badge.at, SPRING.pop);
            const out = badge.until !== undefined ? prog(f, badge.until, 8) : 0;
            if (out >= 1) return null;
            const cx = caret.x + fs * 1.2;
            const cy = caret.y + fs * 2.0;
            const r = fs * 0.62;
            const lap = Number.isFinite(nextAt) ? clamp01((f - lastAt) / Math.max(1, nextAt - lastAt)) : 1;
            const a = Math.PI + lap * Math.PI * 2;
            return (
              <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: (1 - out) * clamp01(inn * 2)}}>
                <g transform={`translate(${cx} ${cy}) scale(${Math.max(0, inn)}) translate(${-cx} ${-cy})`}>
                  <circle cx={cx} cy={cy} r={r} fill={rgba('#0B1530', 0.85)} stroke={rgba(PAL.info, 0.55)} strokeWidth={fs * 0.09} />
                  <path
                    d={`M ${cx} ${cy + r} A ${r} ${r} 0 ${lap > 0.5 ? 1 : 0} 1 ${cx + r * Math.sin(a)} ${cy - r * Math.cos(a)}`}
                    fill="none"
                    stroke={PAL.info}
                    strokeWidth={fs * 0.12}
                    strokeLinecap="round"
                  />
                  <BitHead x={cx + r * Math.sin(a)} y={cy - r * Math.cos(a)} size={fs * 0.26} gid={`${uid}-lb`} />
                </g>
              </svg>
            );
          })()
        : null}
      {/* not streaming: waiting dots */}
      {waiting && f < waiting.until ? (
        <div style={{position: 'absolute', left: G.left, top: G.top + fs * 0.25, display: 'flex', gap: fs * 0.5}}>
          {[0, 1, 2].map((i) => {
            const b = Math.max(0, Math.sin(f / 4 - i * 0.9));
            return <div key={i} style={{width: fs * 0.7, height: fs * 0.7, borderRadius: '50%', background: PAL.wait, opacity: 0.35 + 0.65 * b, transform: `translateY(${-fs * 0.25 * b}px)`, boxShadow: `0 0 ${fs * 0.5 * b}px ${rgba(PAL.wait, 0.6)}`}} />;
          })}
        </div>
      ) : null}
      </div>
      {/* header */}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: G.bar, background: '#141E33', borderBottom: `2px solid ${rgba(PAL.structure, 0.18)}`}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: G.pad * 0.6 + i * G.bar * 0.42, top: G.bar / 2 - G.bar * 0.12, width: G.bar * 0.24, height: G.bar * 0.24, borderRadius: '50%', background: rgba(PAL.structure, 0.45)}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: G.bar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAL.muted, fontWeight: 600, fontSize: G.bar * 0.42}}>{title}</div>
      </div>
      {/* input bar */}
      <div style={{position: 'absolute', left: G.pad, right: G.pad, bottom: G.pad * 0.7, height: G.bar * 0.9, borderRadius: G.bar * 0.45, border: `2px solid ${rgba(PAL.structure, 0.28)}`, background: '#111A2C'}}>
        <div style={{position: 'absolute', right: G.bar * 0.18, top: G.bar * 0.14, width: G.bar * 0.62, height: G.bar * 0.62, borderRadius: '50%', background: rgba(PAL.structure, 0.3)}} />
      </div>
      {flash > 0.01 ? <div style={{position: 'absolute', inset: 0, background: `rgba(255,255,255,${0.5 * flash})`}} /> : null}
    </div>
  );
};

/** Pane px → its slot's parent px helper (for labels): caret and word centres. */
export const paneCaret = (G: PaneGeo, shown: number) => G.after(shown - 1);
export const shownAt = (times: readonly number[], f: number) => {
  let n = 0;
  for (let i = 0; i < times.length; i++) if (f >= times[i]) n = i + 1;
  return n;
};
export const _paneDebug = {lerp};
