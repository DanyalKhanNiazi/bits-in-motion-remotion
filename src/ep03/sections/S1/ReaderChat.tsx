/**
 * S1: the chat inside the reader's screen (slot px, 1032×547 for REGIONS.deskScreen).
 * A ≈750-word prompt lands as one wall of text, every word lights at once when it is read, the wall folds away,
 * and the answer trickles out word by word with the Bit as the caret. Generic UI, no brand.
 */
import React from 'react';
import {PAL, Rich, SANS, SPRING, tokenize} from '../../kit';
import {EASE, clamp01, lerp, mixHex, prog, rgba, springAt} from '../../kit';

const PARA = [
  'Summarize this report for me.',
  'The quarterly review covers sales, hiring, customer feedback and the product roadmap.',
  'Overall demand grew in every region, led by strong growth in online orders, while store visits stayed flat.',
  'Costs rose as well, mostly because shipping took longer and several suppliers raised their prices.',
  'The support team answered more requests than ever before, and satisfaction held steady through the busy season.',
  'New products launched on schedule, although one slipped into next quarter after late testing.',
  'Hiring slowed later in the year as the company shifted its focus to training and retention.',
  'Marketing spend moved from print toward video, and early results suggest the change paid off.',
  'The report closes with risks to watch: rising costs, tighter budgets, new competition and slower payments.',
  'Please list the main findings, explain what changed since last quarter, and recommend the next steps.',
];
/** About 750 words: the prompt body repeated, as a long pasted document would be. */
const WALL = (() => {
  const out: string[] = [PARA[0]];
  let i = 1;
  let words = PARA[0].split(' ').length;
  while (words < 750) {
    const p = PARA[1 + ((i - 1) % (PARA.length - 1))];
    out.push(p);
    words += p.split(' ').length;
    i++;
  }
  return out.join(' ');
})();

export const ANSWER =
  "Here's a summary of the report you shared. Demand grew in every region, led by online orders, while costs rose because shipping slowed and suppliers raised prices. Overall, the outlook for next year is good, although the report flags rising costs and new competition as the main risks to watch.";
export const ANSWER_TOKENS = tokenize(ANSWER);

export type ReaderChatProps = {
  frame: number;
  w?: number;
  h?: number;
  wallAt: number;
  readAt: number;
  foldAt: number;
  times: readonly number[];
  fontSize?: number;
};

export const ReaderChat: React.FC<ReaderChatProps> = ({frame: f, w = 1032, h = 547, wallAt, readAt, foldAt, times, fontSize = 26}) => {
  const bar = 46;
  const pad = 36;
  // the wall: lands in 3 frames from below-right with a flash
  const land = prog(f, wallAt - 3, 3, EASE.inCubic);
  const flash = f >= wallAt ? Math.exp(-(f - wallAt) / 3.5) : 0;
  const read = f >= readAt ? 1 : 0;
  const readFlash = f >= readAt ? Math.exp(-(f - readAt) / 6) : 0;
  const fold = prog(f, foldAt, 16, EASE.inOut);
  const wallTop = bar + 20;
  const wallW = w - pad * 2 - 60;
  const fullH = 342;
  const wallH = lerp(fullH, 70, fold);
  const textCol = read ? mixHex('#CDEFFF', '#FFFFFF', readFlash) : '#8193B4';
  const glint = -20 + ((((f - wallAt) % 44) + 44) % 44) * (140 / 44);
  // the answer
  let shown = 0;
  for (let i = 0; i < times.length; i++) if (f >= times[i]) shown = i + 1;
  const lastAt = shown > 0 ? times[shown - 1] : -1e9;
  const streaming = shown > 0 && shown < times.length;
  const caretOn = streaming || Math.floor((f - lastAt) / 9) % 2 === 0;
  const ansTop = wallTop + wallH + 26;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: `linear-gradient(180deg, #0F1729 0%, ${PAL.screen} 60%, #0A101C 100%)`, fontFamily: SANS}}>
      {/* title bar */}
      <div style={{position: 'absolute', left: 0, top: 0, width: w, height: bar, background: '#141E33', borderBottom: `2px solid ${rgba(PAL.structure, 0.18)}`}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: 20 + i * 20, top: bar / 2 - 5, width: 10, height: 10, borderRadius: '50%', background: rgba(PAL.structure, 0.45)}} />
        ))}
        <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAL.muted, fontWeight: 600, fontSize: 19}}>Assistant</div>
      </div>
      {/* the prompt wall */}
      {f >= wallAt - 3 ? (
        <div
          style={{
            position: 'absolute',
            right: pad,
            top: wallTop,
            width: wallW,
            height: wallH,
            borderRadius: 20,
            borderBottomRightRadius: 6,
            background: '#22324F',
            boxShadow: [
              `0 12px 30px rgba(0,0,0,0.4)`,
              flash > 0.02 ? `0 0 ${70 * flash}px ${rgba('#FFFFFF', 0.7 * flash)}` : '',
              read ? `0 0 0 ${2 + 3 * readFlash}px ${rgba(PAL.info, 0.35 + 0.6 * readFlash)}, 0 0 ${40 * readFlash + 12}px ${rgba(PAL.info, 0.25 + 0.5 * readFlash)}` : '',
            ]
              .filter(Boolean)
              .join(', '),
            transform: `translate(${(1 - land) * 140}px, ${(1 - land) * 260}px) scale(${lerp(1.25, 1, land)})`,
            transformOrigin: '100% 0%',
            opacity: clamp01(land * 3),
            overflow: 'hidden',
            filter: flash > 0.02 ? `brightness(${1 + 1.4 * flash})` : undefined,
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 18,
              right: 18,
              top: 12,
              fontSize: 9.6,
              lineHeight: 1.3,
              fontWeight: 600,
              color: textCol,
              textShadow: read ? `0 0 ${2 + 10 * readFlash}px ${rgba(PAL.info, 0.35 + 0.6 * readFlash)}` : undefined,
              textAlign: 'justify',
              opacity: 1 - 0.45 * fold,
            }}
          >
            <span style={{fontSize: 12, color: read ? '#FFFFFF' : '#C9D4E8'}}>{WALL.slice(0, 29)}</span>
            {WALL.slice(29)}
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 40 + 30 * fold, background: `linear-gradient(180deg, rgba(34,50,79,0), #22324F)`}} />
          {/* shimmer: a glint keeps running through the waiting text */}
          {!read && f >= wallAt + 8 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(105deg, rgba(255,255,255,0) ${glint - 14}%, rgba(190,235,255,0.22) ${glint}%, rgba(255,255,255,0) ${glint + 14}%)`,
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
        </div>
      ) : null}
      {/* the answer */}
      {shown > 0 || f >= foldAt ? (
        <div style={{position: 'absolute', left: pad, right: pad + 40, top: ansTop, display: 'flex', gap: fontSize * 0.55}}>
          <div
            style={{
              flex: 'none',
              width: fontSize * 1.15,
              height: fontSize * 1.15,
              borderRadius: fontSize * 0.28,
              background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`,
              boxShadow: `0 0 ${fontSize * 0.7}px ${rgba(PAL.info, 0.5)}`,
              marginTop: fontSize * 0.08,
              opacity: prog(f, foldAt + 4, 8),
            }}
          />
          <div style={{fontSize, lineHeight: 1.34, color: PAL.ink, fontWeight: 600}}>
            {ANSWER_TOKENS.map((tk, i) => {
              const a = times[i] ?? 1e9;
              const age = f - a;
              if (age < 0) {
                const ahead = i - shown;
                const fogA = ahead < 18 ? 0.42 * (1 - ahead / 18) : 0;
                return (
                  <span key={i} style={{whiteSpace: 'pre-wrap', color: 'rgba(0,0,0,0)', textShadow: fogA > 0 ? `0 0 ${fontSize * 0.34}px ${rgba(PAL.annotation, fogA)}` : 'none'}}>
                    {tk}
                  </span>
                );
              }
              const fresh = Math.exp(-age / 7);
              const isNewest = i === shown - 1;
              return (
                <span key={i} style={{position: 'relative', whiteSpace: 'pre-wrap'}}>
                  <span style={{color: mixHex(PAL.ink, '#9FF4FF', fresh), textShadow: fresh > 0.05 ? `0 0 ${16 * fresh}px ${rgba(PAL.info, 0.9 * fresh)}` : undefined, opacity: clamp01(age / 2 + 0.4)}}>
                    <Rich text={tk} weight={600} />
                  </span>
                  {isNewest ? (
                    <span
                      style={{
                        display: 'inline-block',
                        width: fontSize * 0.44,
                        height: fontSize * 0.44,
                        marginLeft: fontSize * 0.16,
                        borderRadius: fontSize * 0.1,
                        background: PAL.info,
                        boxShadow: `0 0 ${fontSize * 0.5}px ${rgba(PAL.info, 0.95)}, 0 0 ${fontSize * 1.3}px ${rgba(PAL.info, 0.5)}`,
                        opacity: caretOn ? 1 : 0.3,
                        transform: `scale(${1 + 0.4 * Math.exp(-age / 3)})`,
                      }}
                    />
                  ) : null}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}
      {/* input bar */}
      <div style={{position: 'absolute', left: pad, right: pad, bottom: 22, height: 40, borderRadius: 20, border: `2px solid ${rgba(PAL.structure, 0.28)}`, background: '#111A2C'}}>
        <div style={{position: 'absolute', right: 7, top: 6, width: 24, height: 24, borderRadius: '50%', background: f >= wallAt - 8 && f < wallAt + 6 ? PAL.info : rgba(PAL.structure, 0.3)}} />
      </div>
      {flash > 0.02 ? <div style={{position: 'absolute', inset: 0, background: rgba('#FFFFFF', 0.4 * flash)}} /> : null}
    </div>
  );
};

/** One springy value reused by the clocks. */
export const pop = (f: number, at: number) => springAt(f, at, SPRING.snap);
