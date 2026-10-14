/**
 * S6 P14 end + P15: the reader's desk at home. The answer streams on the screen far ahead of a soft reading marker
 * ("one GPU outruns your reading"), then the re-hook question card.
 */
import React from 'react';
import {
  EASE,
  KineticText,
  PAL,
  REGIONS,
  SANS,
  SPRING,
  ScreenSlot,
  Stage,
  TAU,
  clamp01,
  prog,
  rgba,
  rnd,
  rr,
  springAt,
  textWidth,
  useFontsReady,
  type CamKey,
  type KenBurns,
} from '../../kit';
import {A, CUT} from './anchors';
import {StreakBit} from './common';
import {at as atWord} from '../../timing';

const s15 = (phrase: string) => atWord(15, phrase).start;

const SLOT = {w: 1032, h: 547};
const FS = 25;
const LH = FS * 1.36;
const TEXT_X = 74;
const TEXT_Y = 142;
const TEXT_W = 920;
const PROMPT = 'Why do AI answers arrive one piece at a time?';
const ANSWER =
  'Because a model writes one token at a time. Each new piece depends on every piece before it, so the next one cannot start until the last one is done. Your question is read all at once, but the answer is written piece by piece, and every piece needs another trip across the bridge.';

export const DESK_KB: KenBurns = {from: {s: 1.12, x: 0, y: 34}, to: {s: 1.55, x: 0, y: 176}, start: CUT.intoDesk - 6, end: A.p15 + 30};
export const DESK_CAM: CamKey[] = [
  {f: A.p15 + 30, zoom: 1, x: 960, y: 540},
  {f: CUT.intoDoors + 16, zoom: 1.075, x: 960, y: 520},
];

const WRITE_AT = CUT.intoDesk + 12; // first answer token
const WRITE_EVERY = 3.3; // frames per token (fast)
const READ_AT = WRITE_AT + 26;
const READ_EVERY = 7.2; // frames per token (a person reading)

type Tok = {t: string; x: number; y: number; w: number};
const layout = (): Tok[] => {
  const words = ANSWER.split(' ');
  const sp = textWidth(' ', FS, 600, SANS);
  const out: Tok[] = [];
  let x = 0;
  let line = 0;
  for (const w of words) {
    const ww = textWidth(w, FS, 600, SANS);
    if (x > 0 && x + ww > TEXT_W) {
      x = 0;
      line++;
    }
    out.push({t: w, x: TEXT_X + x, y: TEXT_Y + line * LH, w: ww});
    x += ww + sp;
  }
  return out;
};

const writeIdx = (f: number) => Math.floor((f - WRITE_AT) / WRITE_EVERY);
const readPos = (f: number) => (f - READ_AT) / READ_EVERY;

const ChatPane: React.FC<{frame: number; toks: Tok[]}> = ({frame: f, toks}) => {
  const shown = clamp01((writeIdx(f) + 1) / toks.length) * toks.length;
  const n = Math.max(0, Math.min(toks.length, Math.floor(shown)));
  const tex = prog(f, A.oneGpu - 14, 14, EASE.inOut);
  const rp = readPos(f);
  const ri = Math.max(0, Math.min(toks.length - 1, Math.floor(rp)));
  const ru = rp - Math.floor(rp);
  const readOn = prog(f, READ_AT - 4, 8) * (1 - prog(f, A.why - 6, 10));
  const waitK = prog(f, A.waiting - 10, 12);
  const bar = 46;
  const last = toks[Math.max(0, n - 1)];
  const caretX = n > 0 ? last.x + last.w + 6 : TEXT_X;
  const caretY = n > 0 ? last.y : TEXT_Y;
  const blink = n < toks.length ? 1 : 0.35 + 0.65 * (Math.floor(f / 9) % 2);
  const caretC = waitK > 0 ? `rgb(${Math.round(0 + 255 * waitK)}, ${Math.round(229 - 120 * waitK)}, ${Math.round(255 - 160 * waitK)})` : PAL.info;
  const rTok = toks[ri];
  const rNext = toks[Math.min(toks.length - 1, ri + 1)];
  const sameLine = rNext.y === rTok.y;
  const rx = sameLine ? rTok.x + (rNext.x - rTok.x) * EASE.inOut(ru) : rTok.x;
  const rw = sameLine ? rTok.w + (rNext.w - rTok.w) * EASE.inOut(ru) : rTok.w;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: SLOT.w, height: SLOT.h, overflow: 'hidden', background: `linear-gradient(180deg, #0F1729 0%, ${PAL.screen} 60%, #0A101C 100%)`, fontFamily: SANS}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: SLOT.w, height: bar, background: '#141E33', borderBottom: `2px solid ${rgba(PAL.structure, 0.18)}`}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: 16 + i * 20, top: bar / 2 - 6, width: 12, height: 12, borderRadius: 6, background: rgba(PAL.structure, 0.45)}} />
        ))}
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAL.muted, fontWeight: 600, fontSize: 19}}>Assistant</div>
      </div>
      <div style={{position: 'absolute', right: 28, top: bar + 18, padding: '9px 16px', borderRadius: 16, borderBottomRightRadius: 5, background: '#26365A', color: PAL.ink, fontWeight: 600, fontSize: 21, whiteSpace: 'nowrap'}}>{PROMPT}</div>
      <div style={{position: 'absolute', left: 28, top: TEXT_Y + 2, width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`, boxShadow: `0 0 14px ${rgba(PAL.info, 0.45)}`}} />
      {/* reading marker (behind the words) */}
      {readOn > 0 && rp >= 0 ? (
        <>
          <div style={{position: 'absolute', left: rx - 5, top: rTok.y - 3, width: rw + 10, height: LH - 2, borderRadius: 7, background: rgba('#FFFFFF', 0.13 * readOn)}} />
          <div style={{position: 'absolute', left: rx - 2, top: rTok.y + LH - 6, width: rw + 4, height: 4, borderRadius: 2, background: rgba('#FFFFFF', 0.9 * readOn), boxShadow: `0 0 10px ${rgba('#FFFFFF', 0.6 * readOn)}`}} />
        </>
      ) : null}
      <div style={{position: 'absolute', inset: 0, filter: tex > 0.01 ? `blur(${5 * tex}px)` : undefined, opacity: 1 - 0.68 * tex}}>
      {toks.map((t, i) => {
        if (i >= n) {
          const ahead = i - n;
          return ahead < 12 ? (
            <div key={i} style={{position: 'absolute', left: t.x, top: t.y, fontSize: FS, fontWeight: 600, color: 'rgba(0,0,0,0)', textShadow: `0 0 8px ${rgba(PAL.annotation, 0.45 * (1 - ahead / 12))}`, whiteSpace: 'nowrap'}}>
              {t.t}
            </div>
          ) : null;
        }
        const age = f - (WRITE_AT + i * WRITE_EVERY);
        const fresh = Math.exp(-age / 6);
        const read = i < rp ? 1 : 0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: t.x,
              top: t.y,
              fontSize: FS,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: fresh > 0.05 ? `rgb(${Math.round(243 - 170 * fresh)}, ${Math.round(242 - 10 * fresh)}, ${Math.round(238 + 17 * fresh)})` : read ? PAL.ink : rgba(PAL.ink, 0.86),
              textShadow: fresh > 0.05 ? `0 0 ${12 * fresh}px ${rgba(PAL.info, 0.9 * fresh)}` : undefined,
            }}
          >
            {t.t}
          </div>
        );
      })}
      </div>
      {/* the Bit caret */}
      {f >= WRITE_AT - 2 ? (
        <div
          style={{
            position: 'absolute',
            left: caretX,
            top: caretY + LH * 0.3,
            width: 12,
            height: 12,
            borderRadius: 3,
            background: caretC,
            opacity: blink,
            boxShadow: `0 0 12px ${caretC}, 0 0 28px ${caretC}`,
            transform: `scale(${1 + 0.4 * waitK * (0.5 + 0.5 * Math.sin((TAU * f) / 16))})`,
          }}
        />
      ) : null}
      <div style={{position: 'absolute', left: 26, right: 26, bottom: 18, height: 40, borderRadius: 20, border: `2px solid ${rgba(PAL.structure, 0.28)}`, background: '#111A2C'}} />
    </div>
  );
};


export const DeskScene: React.FC<{frame: number}> = ({frame: f}) => {
  useFontsReady();
  const toks = layout();
  const qk = prog(f, A.why - 6, 16, EASE.inOut);
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb: DESK_KB,
        dim: 0.1 + 0.12 * qk,
        blur: 5 * qk,
        floor: 0.45,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <ChatPane frame={f} toks={toks} />
          </ScreenSlot>
        ),
      }}
      cam={DESK_CAM}
      drift={0}
      hud={
        <>
          <KineticText frame={f} at={A.plenty} text="Still plenty for one person" x={960} y={872} size={80} mode="rise" exitAt={A.p15 + 14} screen />
          <Race frame={f} n={toks.length} />
          <KineticText frame={f} at={A.outruns} text="Writing outruns reading" x={960} y={858} size={84} mode="slam" exitAt={A.why + 4} screen />
          <WaitCard frame={f} />
        </>
      }
    />
  );
};

/* ---------------------------------------------------------------- the race (P15): writing far ahead of reading */
const RX0 = 220;
const RX1 = 1700;
const RY = 600;
const Tag2: React.FC<{txt: string; x: number; y: number; s: number; c: string}> = ({txt, x, y, s, c}) =>
  s > 0.001 ? (
    <div
      style={{
        position: 'absolute',
        left: Math.max(170, Math.min(1750, x)),
        top: y,
        transform: `translate(-50%, -50%) scale(${0.85 + 0.15 * Math.min(1.1, s)})`,
        opacity: clamp01(s * 2),
        padding: '4px 22px 8px',
        borderRadius: 14,
        background: rgba('#050912', 0.82),
        border: `2px solid ${rgba(c, 0.5)}`,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 72,
        lineHeight: 1.1,
        color: c,
        whiteSpace: 'nowrap',
      }}
    >
      {txt}
    </div>
  ) : null;

const Race: React.FC<{frame: number; n: number}> = ({frame: f, n}) => {
  const k = prog(f, A.oneGpu - 12, 14, EASE.out) * (1 - prog(f, A.why + 2, 10, EASE.inCubic));
  if (k <= 0.001) return null;
  const wf = clamp01(((f - WRITE_AT) / WRITE_EVERY + 1) / n);
  const rf = clamp01(readPos(f) / n);
  const xw = RX0 + wf * (RX1 - RX0);
  const xr = RX0 + rf * (RX1 - RX0);
  const sp = wf < 1 ? ((RX1 - RX0) / (n * WRITE_EVERY)) * 2.4 : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: k}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: RY - 160, height: 320, background: `linear-gradient(180deg, rgba(5,9,18,0), ${rgba('#050912', 0.74)} 28%, ${rgba('#050912', 0.74)} 72%, rgba(5,9,18,0))`}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <rect x={RX0 - 10} y={RY - 7} width={RX1 - RX0 + 20} height={14} rx={7} fill={rgba(PAL.structure, 0.45)} />
        {Array.from({length: 21}, (_, i) => (
          <rect key={i} x={RX0 + (i * (RX1 - RX0)) / 20 - 1.5} y={RY + 14} width={3} height={i % 5 ? 10 : 18} fill={rgba(PAL.annotation, 0.55)} />
        ))}
        <rect x={xr} y={RY - 11} width={Math.max(0, xw - xr)} height={22} rx={11} fill={PAL.info} opacity={0.28} />
        <rect x={RX0} y={RY - 4} width={Math.max(0, xw - RX0)} height={8} rx={4} fill={PAL.info} opacity={0.85} />
        <rect x={RX0} y={RY - 5} width={Math.max(0, xr - RX0)} height={10} rx={5} fill="#F4F7FB" />
        <rect x={xr - 16} y={RY - 54} width={32} height={108} rx={16} fill="#FFFFFF" opacity={0.12} />
        <rect x={xr - 7} y={RY - 46} width={14} height={92} rx={7} fill="#F4F7FB" />
        <StreakBit x={xw} y={RY} speed={sp} size={38} gid="s6race" />
      </svg>
      <Tag2 txt="Writing" x={xw} y={RY - 98} s={springAt(f, A.oneGpu + 23, SPRING.snap)} c={PAL.info} />
      <Tag2 txt="Reading" x={xr} y={RY + 106} s={springAt(f, A.onePerson, SPRING.snap)} c="#F4F7FB" />
    </div>
  );
};

/* ---------------------------------------------------------------- the re-hook card, built on the voice */
const QWORDS: Array<{t: string; at: number; line: 0 | 1}> = [
  {t: 'So', at: A.why, line: 0},
  {t: 'why', at: A.why + 3, line: 0},
  {t: 'do', at: s15('does'), line: 0},
  {t: 'chatbots', at: s15('chatbot'), line: 0},
  {t: 'keep', at: s15('keep'), line: 1},
  {t: 'you', at: s15('you'), line: 1},
];
const WaitCard: React.FC<{frame: number}> = ({frame: f}) => {
  const t = f - A.why;
  if (t < -4) return null;
  const sIn = prog(f, A.why - 4, 12, EASE.out);
  const push = 1 + 0.06 * clamp01(t / 125);
  const typed = 'waiting'.slice(0, Math.max(0, Math.min(7, Math.floor((f - A.waiting + 1) / 1.4))));
  const qPop = springAt(f, A.waiting + 10, SPRING.pop);
  const under = prog(f, A.waiting + 12, 14, EASE.outExpo);
  const caretOn = f >= A.waiting - 2 && Math.floor((f - A.waiting) / 7) % 2 === 0;
  const dust = Array.from({length: 46}, (_, i) => {
    const x0 = rr(`wd-x${i}`, 0, 1920);
    const y0 = rr(`wd-y${i}`, 0, 1080);
    const v = rr(`wd-v${i}`, 0.4, 1.4);
    const y = ((((y0 - t * v) % 1120) + 1120) % 1120) - 20;
    const x = x0 + 18 * Math.sin(t / 40 + i);
    const r = rr(`wd-r${i}`, 1.5, 4.5);
    return <circle key={i} cx={x} cy={y} r={r} fill={i % 4 ? '#9CC8FF' : PAL.wait} opacity={(0.18 + 0.3 * rnd(`wd-o${i}`)) * sIn} />;
  });
  const line = (ln: 0 | 1) =>
    QWORDS.filter((w) => w.line === ln).map((w, i) => {
      const e = prog(f, w.at, 14, EASE.outExpo);
      return (
        <span key={i} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.1em', marginRight: '0.26em'}}>
          <span style={{display: 'inline-block', transform: `translateY(${(1 - e) * 105}%)`}}>{w.t}</span>
        </span>
      );
    });
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 52% at 50% 50%, ${rgba('#1C3566', 0.34 * sIn)}, ${rgba('#0A1430', 0.3 * sIn)} 55%, ${rgba('#02040A', 0.5 * sIn)})`}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {dust}
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 1290,
          top: 70,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 860,
          lineHeight: 1,
          color: 'rgba(0,0,0,0)',
          WebkitTextStroke: `5px ${rgba(PAL.emphasis, 0.42 * sIn)}`,
          transform: `rotate(${-10 + 14 * clamp01(t / 125)}deg) scale(${0.92 + 0.1 * clamp01(t / 125)})`,
          transformOrigin: '40% 60%',
        }}
      >
        ?
      </div>
      <div style={{position: 'absolute', left: 960, top: 500, width: 1700, transform: `translate(-50%, -50%) scale(${push})`, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 104, lineHeight: 1.12, color: PAL.ink, letterSpacing: '-0.015em', whiteSpace: 'nowrap'}}>
        <div>{line(0)}</div>
        <div>
          {line(1)}
          <span style={{display: 'inline-block', color: PAL.ink}}>{typed}</span>
          {qPop > 0 ? <span style={{display: 'inline-block', color: PAL.emphasis, transform: `scale(${Math.max(0, qPop)})`, transformOrigin: '50% 80%'}}>?</span> : null}
          {f >= A.waiting - 2 ? (
            <span style={{display: 'inline-block', width: '0.34em', height: '0.82em', marginLeft: '0.08em', verticalAlign: '-0.06em', borderRadius: '0.06em', background: PAL.wait, opacity: caretOn ? 1 : 0.2, boxShadow: `0 0 0.3em ${rgba(PAL.wait, 0.8)}`}} />
          ) : null}
        </div>
        <div style={{margin: '0.16em auto 0', height: 8, width: `${40 * under}%`, borderRadius: 4, background: PAL.info, boxShadow: `0 0 24px ${rgba(PAL.info, 0.7)}`}} />
      </div>
      {/* the chatbot keeping you waiting: a pulsing typing indicator */}
      <div style={{position: 'absolute', left: 960, top: 760, transform: `translate(-50%, -50%) scale(${push})`, display: 'flex', gap: 30, padding: '22px 40px', borderRadius: 44, background: rgba('#14203A', 0.78 * sIn), border: `2px solid ${rgba(PAL.wait, 0.45 * sIn)}`, opacity: sIn}}>
        {[0, 1, 2].map((d) => {
          const ph = 0.5 + 0.5 * Math.sin((TAU * (t - d * 5)) / 26);
          return <div key={d} style={{width: 34, height: 34, borderRadius: 17, background: PAL.wait, opacity: 0.35 + 0.65 * ph, transform: `translateY(${-10 * ph}px)`, boxShadow: `0 0 ${18 * ph}px ${rgba(PAL.wait, 0.8)}`}} />;
        })}
      </div>
    </div>
  );
};
