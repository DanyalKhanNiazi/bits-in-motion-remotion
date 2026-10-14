/**
 * S2 shot B: the vocabulary drawer (BIM158, front view) in a void studio. Real o200k entries riffle forward into the
 * tray until the card for "Why", 13903, faces us: the fixed list, the model's vocabulary.
 */
import React from 'react';
import {EASE, KineticText, Label, MONO, PAL, Prop, SANS, Stage, clamp01, poseAt, prog, propPoint, rgba, textWidth, toScreen, type CamKey} from '../../kit';
import {A, RIFFLE} from './data';
import {tw} from './widths';

const SRC = 'BIM158_T03_vocabulary-drawer_b' as const;
const PX = {x: 960, y: 650, h: 960};
/** the front card's face in native px of BIM158 */
const CARD = {x0: 307, y0: 492, x1: 945, y1: 776};

/** card falls: fast at first, slowing onto "Why" */
const FALLS = (() => {
  const gaps = [3, 3, 3, 3, 4, 5, 7];
  const out: number[] = [];
  let t = A.from + 2;
  for (const g of gaps) {
    out.push(t);
    t += g;
  }
  return out;
})();
export const WHY_AT = FALLS[FALLS.length - 1] + 6;

const cam: CamKey[] = [
  {f: A.from - 8, x: 958, y: 632, zoom: 1.5},
  {f: A.fixed - 1, x: 960, y: 560, zoom: 1.0, dur: 22},
  {f: A.with, x: 966, y: 552, zoom: 1.06},
];

const CardFace: React.FC<{word: string; id: number; w: number; h: number; hl?: number}> = ({word, id, w, h, hl = 0}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      borderRadius: h * 0.08,
      background: 'linear-gradient(180deg, #FFFFFF 0%, #F3F4F6 55%, #E6E9EE 100%)',
      boxShadow: [
        'inset 0 2px 0 rgba(255,255,255,0.9)',
        `inset 0 -3px 0 ${rgba(PAL.tileEdge, 0.4)}`,
        hl > 0 ? `0 0 0 ${3 + 2 * hl}px ${rgba(PAL.info, 0.9 * hl)}, 0 0 ${36 * hl}px ${rgba(PAL.info, 0.55 * hl)}` : '',
      ]
        .filter(Boolean)
        .join(', '),
      overflow: 'hidden',
    }}
  >
    <div style={{position: 'absolute', left: w * 0.06, right: w * 0.06, top: h * 0.36, height: 2, background: rgba('#9FB6D8', 0.55)}} />
    <div style={{position: 'absolute', left: w * 0.06, top: h * 0.06, fontFamily: MONO, fontWeight: 500, fontSize: h * 0.25, color: PAL.infoDeep, lineHeight: 1}}>{id}</div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: h * 0.38,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: h * 0.4,
        color: PAL.tileInk,
        lineHeight: 1,
      }}
    >
      {word}
    </div>
  </div>
);

export const DrawerScene: React.FC<{frame: number}> = ({frame: f}) => {
  const tl = propPoint(SRC, PX, CARD.x0, CARD.y0);
  const br = propPoint(SRC, PX, CARD.x1, CARD.y1);
  const cw = br.x - tl.x;
  const ch = br.y - tl.y;
  // which card faces us, which one is falling
  let front = 0;
  for (let k = 0; k < FALLS.length; k++) if (f >= FALLS[k] + 6) front = k + 1;
  const falling = front < FALLS.length && f >= FALLS[front] ? front : -1;
  const fp = falling >= 0 ? prog(f, FALLS[falling], 6, EASE.inCubic) : 0;
  const under = falling >= 0 ? falling + 1 : front;
  const hl = clamp01(prog(f, WHY_AT, 8, EASE.out)) * (0.75 + 0.25 * Math.cos((f - WHY_AT) / 9));
  const thunk = f >= WHY_AT - 2 ? 6 * Math.exp(-(f - WHY_AT + 2) / 4) * Math.cos((f - WHY_AT + 2) * 0.9) : 0;
  const pose = poseAt(f, cam);
  const sp = propPoint(SRC, PX, 640, 205);
  const fixedX = 960 - (tw('The fixed list', 76, 600) + 0.84 * 76) / 2;
  const stack = toScreen(pose, sp.x, sp.y);
  const cardTop = toScreen(pose, tl.x + cw * 0.5, tl.y);
  const cards = (
    <div style={{position: 'absolute', left: tl.x, top: tl.y + thunk * 0.4, width: cw, height: ch, perspective: 900}}>
      <CardFace word={RIFFLE[Math.min(under, RIFFLE.length - 1)][1]} id={RIFFLE[Math.min(under, RIFFLE.length - 1)][0]} w={cw} h={ch} hl={under === RIFFLE.length - 1 ? hl : 0} />
      {falling >= 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '50% 100%',
            transform: `translateY(${fp * ch * 0.35}px) rotateX(${-100 * fp}deg)`,
            backfaceVisibility: 'hidden',
            filter: `brightness(${1 - 0.45 * fp})`,
          }}
        >
          <CardFace word={RIFFLE[falling][1]} id={RIFFLE[falling][0]} w={cw} h={ch} />
        </div>
      ) : null}
    </div>
  );
  const hud = (
    <>
      <Label frame={f} at={A.fixed} exitAt={A.with - 4} text="The fixed list" x={fixedX} y={86} to={stack} side="right" size={76} screen />
      <KineticText frame={f} at={A.vocabulary} exitAt={A.with - 4} text="vocabulary" mode="rise" x={336} y={cardTop.y + 40} size={88} screen />
    </>
  );
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'reader-desk', parallax: 0.25, blur: 12, dim: 0.36, tint: 0.28, floor: 0.4, kb: {from: {s: 1.3, x: -160, y: 50}, to: {s: 1.37, x: -195, y: 38}, start: A.from - 8, end: A.with}}}
      cam={cam}
      hud={hud}
    >
      <div
        style={{
          position: 'absolute',
          left: 960 - 760,
          top: 120,
          width: 1520,
          height: 900,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${rgba('#1B3B66', 0.3)}, ${rgba('#0B1830', 0)})`,
        }}
      />
      <Prop frame={f} src={SRC} x={PX.x} y={PX.y + thunk * 0.3} h={PX.h} rim={{color: PAL.info, strength: 0.55}} sweep={{at: [A.from + 4, WHY_AT, A.vocabulary], dur: 36, strength: 0.4}} shadow={0.6} />
      {cards}
    </Stage>
  );
};
