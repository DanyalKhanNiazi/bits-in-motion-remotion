/**
 * S3 · "the same question twice" (P05 end): two big chat cards on the warm reader desk (shallow depth of field), the
 * same question in both, and two different first words slamming in: "Because" (cyan) and "It" (magenta). ≠ between.
 */
import React from 'react';
import {BitHead, EASE, KineticText, PAL, SANS, SPRING, Stage, clamp01, lerp, prog, rgba, springAt} from '../../kit';
import {A} from './anchors';
import {PROMPT} from './pane';

export const TW = {
  start: A.thatsWhy - 4,
  cardA: A.thatsWhy + 10,
  qA: A.asking - 2,
  cardB: A.sameQ - 10,
  qB: A.sameQ + 2,
  think: A.twice,
  wordA: A.different - 18,
  wordB: A.different - 6,
  neq: A.different,
  push: A.different + 2,
};

const CARD_W = 820;
const CARD_H = 560;
const Card: React.FC<{frame: number; x: number; y: number; at: number; qAt: number; wordAt: number; word: string; color: string; from: 1 | -1; tilt: number}> = ({
  frame: f,
  x,
  y,
  at,
  qAt,
  wordAt,
  word,
  color,
  from,
  tilt,
}) => {
  const sp = springAt(f, at, SPRING.snap);
  if (f < at - 1) return null;
  const q = springAt(f, qAt, SPRING.pop);
  const w = springAt(f, wordAt, SPRING.slam);
  const thinking = f >= TW.think && f < wordAt;
  const wordAge = f - wordAt;
  const flash = wordAge >= 0 ? Math.exp(-wordAge / 6) : 0;
  const bar = 62;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - CARD_W / 2,
        top: y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        transform: `perspective(1600px) translateX(${from * (1 - Math.min(1, sp)) * 700}px) rotateY(${tilt}deg)`,
        opacity: clamp01(sp * 3),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 26,
          overflow: 'hidden',
          background: `linear-gradient(180deg, #111A2E 0%, ${PAL.screen} 70%, #0A101C 100%)`,
          boxShadow: `0 40px 90px rgba(0,0,0,0.6), 0 0 0 2px ${rgba(PAL.structure, 0.35)}, 0 0 ${60 * flash}px ${rgba(color, 0.55 * flash)}`,
          fontFamily: SANS,
        }}
      >
        <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: bar, background: '#141E33', borderBottom: `2px solid ${rgba(PAL.structure, 0.2)}`}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', left: 26 + i * 24, top: bar / 2 - 7, width: 14, height: 14, borderRadius: '50%', background: rgba(PAL.structure, 0.5)}} />
          ))}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: bar, display: 'flex', alignItems: 'center', justifyContent: 'center', color: PAL.muted, fontWeight: 600, fontSize: 28}}>Assistant</div>
        </div>
        {/* the question */}
        <div
          style={{
            position: 'absolute',
            right: 34,
            top: bar + 30,
            width: 724,
            padding: '18px 28px',
            boxSizing: 'border-box',
            borderRadius: 30,
            borderBottomRightRadius: 8,
            background: '#26365A',
            color: PAL.ink,
            fontWeight: 600,
            fontSize: 48,
            lineHeight: 1.22,
            transform: `translateY(${(1 - Math.min(1, q)) * 30}px) scale(${0.85 + 0.15 * Math.min(1.05, q)})`,
            transformOrigin: '100% 0%',
            opacity: clamp01(q * 2.5),
          }}
        >
          {PROMPT}
        </div>
        {/* the answer: avatar, the first word, the caret */}
        <div style={{position: 'absolute', left: 40, top: bar + 250, display: 'flex', alignItems: 'center', gap: 26}}>
          <div style={{width: 58, height: 58, borderRadius: 14, background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`, boxShadow: `0 0 30px ${rgba(PAL.info, 0.45)}`, opacity: f >= TW.think - 6 ? 1 : 0.35}} />
          <div
            style={{
              fontWeight: 700,
              fontSize: 96,
              lineHeight: 1,
              color,
              letterSpacing: '-0.01em',
              transform: `scale(${w > 0 ? lerp(2.1, 1, Math.min(1, w)) : 0.001})`,
              transformOrigin: '0% 60%',
              opacity: clamp01((wordAge + 1) / 2.5),
              filter: w > 0 && w < 0.95 ? `blur(${(1 - w) * 8}px)` : flash > 0.05 ? `brightness(${1 + 0.8 * flash})` : undefined,
              textShadow: `0 0 ${30 * (0.4 + flash)}px ${rgba(color, 0.6)}`,
              display: wordAge >= -1 ? 'block' : 'none',
            }}
          >
            {word}
          </div>
          <svg width={40} height={40} style={{overflow: 'visible', opacity: thinking ? 0.5 + 0.5 * Math.sin(f / 3) : wordAge >= 0 ? (Math.floor(f / 9) % 2 ? 1 : 0.3) : 0}}>
            <BitHead x={20} y={20} size={30} gid={`tw-${word}`} />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const sceneTwice = (f: number): React.ReactNode => {
  const pushT = prog(f, TW.push, 40, EASE.inOut);
  const hud = (
    <>
      <KineticText frame={f} at={TW.neq} text="≠" mode="slam" x={960} y={470} size={170} color={PAL.emphasis} accent={PAL.emphasis} backing="none" />
      <KineticText frame={f} at={TW.neq + 3} text="Different answer" mode="rise" x={960} y={850} size={76} />
    </>
  );
  return (
    <Stage
      frame={f}
      drift={0.7}
      env={{kind: 'photo', plate: 'reader-desk', blur: 16, dim: 0.3, tint: 0.2, kb: {from: {s: 1.12, x: 0, y: 30}, to: {s: 1.2, x: -40, y: 50}, start: TW.start, end: A.p6 + 12}}}
      cam={[
        {f: TW.start, x: 960, y: 520, zoom: 1},
        {f: TW.push, x: 960, y: 515, zoom: 1.02},
        {f: TW.push + 40, x: 960, y: 490, zoom: 1.12},
      ]}
      hud={<div style={{position: 'absolute', inset: 0, transform: `scale(${1 + 0.06 * pushT})`, transformOrigin: '50% 45%'}}>{hud}</div>}
    >
      <Card frame={f} x={505} y={470} at={TW.cardA} qAt={TW.qA} wordAt={TW.wordA} word="Because" color={PAL.info} from={-1} tilt={7} />
      <Card frame={f} x={1415} y={470} at={TW.cardB} qAt={TW.qB} wordAt={TW.wordB} word="It" color={PAL.emphasis} from={1} tilt={-7} />
    </Stage>
  );
};
