/**
 * S5 · P10 shots: weights (a field of numbers), the chatbots' unknown sizes, Llama 3.1 with 8 billion weights,
 * 16 bits = 2 bytes, the ≈16 GB equation and the callback to the opening crate.
 */
import React from 'react';
import {Img} from 'remotion';
import {
  Bridge,
  EASE,
  Footnote,
  KineticText,
  MONO,
  PAL,
  Prop,
  Rich,
  SANS,
  SPRING,
  Stage,
  TokenTile,
  assetUrl,
  clamp01,
  lerp,
  nz,
  prog,
  quadMatrix,
  rgba,
  rnd,
  springAt,
  track,
  type BridgeProps,
  type CamKey,
} from '../../kit';
import {A} from './anchors';
import {Crate3D, Glass, RewindGlyph, SyncWords, Tag} from './parts';

type Quad4 = readonly [readonly [number, number], readonly [number, number], readonly [number, number], readonly [number, number]];

/** Text printed on a face of an asset, in native px (TL, TR, BR, BL). */
const FaceText: React.FC<{quad: Quad4; bw: number; bh: number; text: string; size: number; color?: string; glow?: number; opacity?: number}> = ({
  quad,
  bw,
  bh,
  text,
  size,
  color = PAL.info,
  glow = 1,
  opacity = 1,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: bw,
      height: bh,
      transformOrigin: '0 0',
      transform: quadMatrix(bw, bh, quad as unknown as Parameters<typeof quadMatrix>[2]),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: MONO,
      fontWeight: 500,
      fontSize: size,
      color,
      opacity,
      textShadow: `0 0 ${18 * glow}px ${rgba(color, 0.9 * glow)}, 0 0 ${46 * glow}px ${rgba(color, 0.5 * glow)}`,
      whiteSpace: 'nowrap',
    }}
  >
    {text}
  </div>
);

/** Digits that roll from noise to a final value (a weight "learned in training"). */
const rollDigits = (frame: number, at: number, dur: number, final: string, seed: string): string => {
  const t = clamp01((frame - at) / dur);
  return final
    .split('')
    .map((ch, i) => {
      if (!/[0-9]/.test(ch)) return ch;
      const lock = 0.35 + (i / final.length) * 0.6;
      if (t >= lock) return ch;
      return String(Math.floor(rnd(`${seed}-${i}-${Math.floor(frame / 2)}`) * 10));
    })
    .join('');
};

/* ================================================================ SH1 · weights, billions of numbers */
const TRAY = 'BIM161_T03_weight-field_a' as const;
const TRAY_POS = {x: 960, y: 640, w: 1150};
/** the loose weight in its own holder (front right of the tray), native px: left, top, right, bottom corners */
const LOOSE_FACE: Quad4 = [
  [890, 780],
  [1045, 686],
  [1162, 775],
  [1017, 862],
];
const looseCentre = {x: (890 + 1045 + 1162 + 1017) / 4, y: (780 + 686 + 775 + 862) / 4};
const TRAY_INFO = {w: 1536, h: 1024, x0: 70, y0: 51, x1: 1498, y1: 966};
const trayK = TRAY_POS.w / (TRAY_INFO.x1 - TRAY_INFO.x0);
const trayPt = (nx: number, ny: number) => ({
  x: TRAY_POS.x + (nx - (TRAY_INFO.x0 + TRAY_INFO.x1) / 2) * trayK,
  y: TRAY_POS.y + (ny - (TRAY_INFO.y0 + TRAY_INFO.y1) / 2) * trayK,
});
const LOOSE = trayPt(looseCentre.x, looseCentre.y);

const camWeights = (): CamKey[] => [
  {f: A.pick - 40, x: 930, y: 250, zoom: 1.5, rot: -3},
  {f: A.token + 6, x: 960, y: 330, zoom: 1.16, rot: 0, dur: A.token + 6 - (A.pick - 40), ease: 'out'},
  {f: A.weights + 4, x: 960, y: 560, zoom: 1.0, dur: 56},
  {f: A.parameters + 26, x: LOOSE.x, y: LOOSE.y - 6, zoom: 3.1, dur: 40},
  {f: A.billions + 14, x: 960, y: 260, zoom: 0.34, dur: 18, ease: 'inOut'},
  {f: A.trainingEnd + 30, x: 980, y: 210, zoom: 0.37, dur: 60, ease: 'out'},
];

/** Billboard copies of the tray on a receding floor (the hero tray is row 0, column 0). */
const FieldOfTrays: React.FC<{frame: number}> = ({frame}) => {
  const show = prog(frame, A.billions - 4, 8);
  if (show <= 0) return null;
  const url = assetUrl(TRAY);
  const Yh = -1700;
  const nodes: React.ReactNode[] = [];
  const wave = lerp(-1.5, 9, prog(frame, A.learned - 2, 32, EASE.inOut));
  const waveOn = frame >= A.learned - 2 && frame <= A.trainingEnd + 30 ? 1 : 0;
  for (let r = 8; r >= -1; r--) {
    const z = 1 + 0.42 * r;
    const s = 1 / z;
    const y = Yh + (TRAY_POS.y - Yh) * s;
    const span = 1300 * s;
    const cols = Math.ceil(3200 / span);
    for (let c = -cols; c <= cols; c++) {
      if (r === 0 && c === 0) continue;
      const x = 960 + c * span;
      const w = TRAY_POS.w * s;
      if (Math.abs(x - 980) - w * 0.6 > 3000) continue;
      const h = (w * (TRAY_INFO.y1 - TRAY_INFO.y0)) / (TRAY_INFO.x1 - TRAY_INFO.x0);
      const fullW = (TRAY_INFO.w / (TRAY_INFO.x1 - TRAY_INFO.x0)) * w;
      const fullH = (TRAY_INFO.h / (TRAY_INFO.y1 - TRAY_INFO.y0)) * h;
      const left = x - fullW / 2 - ((TRAY_INFO.x0 + TRAY_INFO.x1) / 2 - TRAY_INFO.w / 2) * (w / (TRAY_INFO.x1 - TRAY_INFO.x0));
      const top = y - fullH / 2 - ((TRAY_INFO.y0 + TRAY_INFO.y1) / 2 - TRAY_INFO.h / 2) * (h / (TRAY_INFO.y1 - TRAY_INFO.y0));
      const fog = clamp01((r - 0.5) / 7.5);
      const wv = waveOn * Math.exp(-((r - wave) ** 2) / 1.2);
      const bright = (1 - 0.72 * fog) * (1 + 0.9 * wv);
      nodes.push(
        <Img
          key={`${r}_${c}`}
          src={url}
          style={{
            position: 'absolute',
            left,
            top,
            width: fullW,
            height: fullH,
            opacity: show,
            filter: `brightness(${bright.toFixed(3)}) saturate(${(1 - 0.4 * fog).toFixed(3)})${r >= 4 ? ` blur(${((r - 3) * 0.9).toFixed(1)}px)` : ''}`,
          }}
        />,
      );
      // number glints: tiny cyan sparks that blink on the trays (the numbers)
      for (let g = 0; g < 3; g++) {
        const ph = rnd(`gl-${r}-${c}-${g}`);
        const blink = Math.max(0, Math.sin((frame / (9 + 7 * ph) + ph * 6.28) * 1.0));
        const gx = x + (rnd(`glx-${r}-${c}-${g}`) - 0.5) * w * 0.7;
        const gy = y + (rnd(`gly-${r}-${c}-${g}`) - 0.6) * h * 0.55;
        const gs = Math.max(4, 22 * s);
        nodes.push(
          <div
            key={`g${r}_${c}_${g}`}
            style={{
              position: 'absolute',
              left: gx - gs / 2,
              top: gy - gs / 2,
              width: gs,
              height: gs,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, rgba(255,255,255,${0.9 * blink * show}), ${rgba(PAL.info, 0.7 * blink * show)} 45%, rgba(0,0,0,0))`,
            }}
          />,
        );
      }
    }
  }
  return <>{nodes}</>;
};

export const shWeights = (f: number) => {
  const cam = camWeights();
  const numStr = rollDigits(f, A.parameters - 4, 16, '0.0212', 'w0');
  const numOp = prog(f, A.parameters - 6, 10);
  const learn = f >= A.learned - 2 && f <= A.trainingEnd + 24 ? Math.exp(-((f - (A.learned + 10)) ** 2) / 120) : 0;
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 60}}
      cam={cam}
      hud={
        <>
          <KineticText frame={f} at={A.weights} exitAt={A.trainingEnd + 18} text="Weights" mode="slam" x={960} y={150} size={120} />
          <KineticText frame={f} at={A.also} exitAt={A.billions - 6} text="also called parameters" mode="pop" stagger={8} x={960} y={262} size={60} color={PAL.ink} backing="plate" />
          <KineticText frame={f} at={A.billions} exitAt={A.trainingEnd + 20} text="Billions of numbers" mode="slam" x={960} y={292} size={96} color={PAL.info} backing="plate" />
          <Footnote frame={f} at={A.parameters + 2} exitAt={A.billions - 4} text="Example value" size={40} />
        </>
      }
    >
      <FieldOfTrays frame={f} />
      <Prop
        frame={f}
        src={TRAY}
        {...TRAY_POS}
        rot={[
          [A.pick - 40, -3],
          [A.weights + 20, 0, EASE.out],
        ]}
        scale={[
          [A.pick - 40, 0.94],
          [A.weights + 10, 1, EASE.out],
        ]}
        rim={{color: PAL.info, strength: 0.35 + 0.65 * learn}}
        sweep={{at: [A.pick - 24, A.weights - 2, A.learned + 2], dur: 26, strength: 1}}
        shadow={0.6}
        float={3}
        brightness={(f < A.weights - 6 ? lerp(0.6, 0.66, prog(f, A.pick - 40, 100)) : lerp(0.66, 1, prog(f, A.weights - 6, 12, EASE.out))) * (1 + 0.6 * learn)}
      >
        <FaceText quad={LOOSE_FACE} bw={181} bh={147} text={numStr} size={44} opacity={numOp} />
      </Prop>
      <TokenTile frame={f} text="?" x={960} y={205} size={118} snapAt={A.pick - 42} from={{dy: -260, rot: -12}} ghost={f < A.token} newest={f >= A.token ? 1 : 0.4} exitAt={A.weights + 6} />
      {/* the pick: a beam from the tray to the token on "weights" */}
      {f >= A.weights - 4 && f < A.weights + 14 ? (
        <div
          style={{
            position: 'absolute',
            left: 940,
            top: 250,
            width: 40,
            height: 260,
            borderRadius: 20,
            background: `linear-gradient(0deg, ${rgba(PAL.info, 0)}, ${rgba(PAL.info, 0.85 * Math.exp(-((f - A.weights) ** 2) / 30))}, ${rgba('#FFFFFF', 0)})`,
            filter: 'blur(3px)',
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
    </Stage>
  );
};

/* ================================================================ SH2–3 · chatbots' sizes are "?", Llama 3.1 is open */
const BOTS = [
  {name: 'ChatGPT', at: A.chatgpt, x: 400, q: A.dont + 4, ry: 14, rise: A.companies - 10},
  {name: 'Claude', at: A.claude, x: 830, q: A.dont + 10, ry: 0, rise: A.companies - 5},
  {name: 'Gemini', at: A.gemini, x: 1260, q: A.big, ry: -14, rise: A.companies},
] as const;
const CARD = {w: 390, h: 500, y: 600};
const LLAMA = {x: 1700, y: 585, w: 430, h: 540};

const HiddenTray: React.FC<{frame: number; w: number; reveal: number; seed: string}> = ({frame, w, reveal, seed}) => {
  const h = w * 0.66;
  return (
    <div style={{position: 'absolute', left: '50%', top: '50%', width: w, height: h, transform: 'translate(-50%, -50%)'}}>
      <Img
        src={assetUrl('BIM162_T03_weight-field_b')}
        style={{
          position: 'absolute',
          left: -w * 0.06,
          top: -h * 0.18,
          width: w * 1.12,
          height: h * 1.4,
          objectFit: 'contain',
          opacity: 0.5 + 0.5 * reveal,
          filter: `blur(${(1 - reveal) * 5}px) brightness(${0.75 + 0.45 * reveal})`,
        }}
      />
      {/* a slow scan across the hidden model */}
      <div style={{position: 'absolute', left: `${((frame * 1.3) % 160) - 30}%`, top: -20, width: '18%', height: h + 40, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(PAL.info, 0.22 * (1 - reveal))}, rgba(0,0,0,0))`}} />
      {/* fog */}
      <div
        style={{
          position: 'absolute',
          inset: -20,
          opacity: 1 - reveal,
          background: `radial-gradient(ellipse 60% 55% at ${50 + 8 * nz(seed, frame / 90)}% ${48 + 6 * nz(seed + 'y', frame / 110)}%, rgba(130,150,190,0.38), rgba(40,55,90,0.7) 70%, rgba(14,22,40,0.9))`,
        }}
      />
    </div>
  );
};

const BotCard: React.FC<{frame: number; name: string; at: number; q: number; x: number; ry: number; rise: number; dim: number}> = ({frame, name, at, q, x, ry, rise, dim}) => {
  const e = springAt(frame, rise, SPRING.soft);
  if (e <= 0.001) return null;
  const qs = springAt(frame, q, SPRING.slam);
  const qFlash = frame >= q ? Math.exp(-(frame - q) / 5) : 0;
  const nameE = prog(frame, at - 1, 8, EASE.out);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 1920,
        height: 1080,
        transformOrigin: `${x}px ${CARD.y}px`,
        transform: `perspective(1600px) translateY(${(1 - Math.min(1, e)) * 90}px) rotateY(${ry * (0.6 + 0.4 * Math.min(1, e)) + 4.5 * Math.sin((frame + x) / 64)}deg) translateY(${10 * Math.sin((frame + x * 0.7) / 52)}px) scale(${1 - 0.08 * dim})`,
        opacity: clamp01(e * 1.5) * (1 - 0.82 * dim),
        filter: dim > 0.01 ? `blur(${dim * 2.5}px)` : undefined,
      }}
    >
      <Glass frame={frame + x} x={x} y={CARD.y} w={CARD.w} h={CARD.h} lit={0.25 + 0.5 * qFlash}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 60, color: PAL.ink, opacity: nameE, transform: `translateY(${(1 - nameE) * 14}px)`}}>
          {name}
        </div>
        <div style={{position: 'absolute', left: 24, right: 24, top: 116, bottom: 26, borderRadius: 18, overflow: 'hidden', background: rgba('#050A16', 0.8), border: `1px solid ${rgba('#7F9BC8', 0.25)}`}}>
          <HiddenTray frame={frame} w={300} reveal={0} seed={name} />
          {frame >= q - 1 ? (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -54%) scale(${Math.max(0, lerp(2.2, 1, Math.min(1.2, qs))) * (1 + 0.06 * Math.sin((frame - q) / 6))})`,
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 240,
                lineHeight: 1,
                color: PAL.emphasis,
                opacity: clamp01((frame - q + 1) / 3),
                textShadow: `0 0 ${30 + 40 * qFlash}px ${rgba(PAL.emphasis, 0.6)}`,
              }}
            >
              ?
            </div>
          ) : null}
        </div>
      </Glass>
    </div>
  );
};

const camBots = (): CamKey[] => [
  {f: A.companies - 8, x: 560, y: 590, zoom: 1.24},
  {f: A.claude + 6, x: 720, y: 576, zoom: 1.12, dur: A.claude + 14 - A.companies, ease: 'inOut'},
  {f: A.big + 6, x: 850, y: 562, zoom: 1.0, dur: A.big - A.claude, ease: 'inOut'},
  {f: A.so + 4, x: 820, y: 548, zoom: 1.12, dur: A.so - A.big},
  {f: A.llama - 6, x: 1330, y: 556, zoom: 1.02, dur: 70},
  {f: A.eightB + 10, x: 1370, y: 548, zoom: 1.06, dur: 76},
  {f: A.each - 4, x: LLAMA.x, y: LLAMA.y - 10, zoom: 1.5, dur: 26, ease: 'inExpo'},
];

export const shBots = (f: number) => {
  const dim = prog(f, A.so + 10, 26, EASE.inOut);
  const lIn = springAt(f, A.open - 12, SPRING.soft);
  const lidOpen = prog(f, A.open + 2, 22, EASE.inOut);
  const lit = prog(f, A.open + 2, 20);
  const nameE = prog(f, A.llama - 1, 8, EASE.out);
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', parallax: 0.3, plate: 'server-room', kb: {from: {s: 1.2, x: 30, y: 0}, to: {s: 1.32, x: -90, y: -16}, start: A.companies - 10, end: A.each}, dim: 0.18, blur: 2.5, tint: 0.3, floor: 0.5}}
      cam={camBots()}
      hud={
        <>
          <KineticText frame={f} at={A.big - 4} exitAt={A.so + 14} text="Model size?" mode="pop" x={890} y={150} size={84} />
          <KineticText frame={f} at={A.eightB} exitAt={A.each + 4} text="8 billion" mode="slam" x={600} y={470} size={170} backing="plate" />
          <KineticText frame={f} at={A.weights2} exitAt={A.each + 4} text="weights" mode="rise" x={600} y={600} size={84} color={PAL.info} backing="none" />
        </>
      }
    >
      {BOTS.map((b) => (
        <BotCard key={b.name} frame={f} name={b.name} at={b.at} q={b.q} x={b.x} ry={b.ry} rise={b.rise} dim={dim} />
      ))}
      {lIn > 0.001 ? (
        <div style={{position: 'absolute', left: 0, top: 0, transform: `translateX(${(1 - Math.min(1, lIn)) * 700}px)`, opacity: clamp01(lIn * 1.4)}}>
          <Glass frame={f} x={LLAMA.x} y={LLAMA.y} w={LLAMA.w} h={LLAMA.h} accent={PAL.info} lit={0.3 + 0.7 * lit}>
            <div style={{position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', fontFamily: SANS, fontWeight: 600, fontSize: 58, color: PAL.ink, opacity: nameE, transform: `translateY(${(1 - nameE) * 14}px)`}}>
              Llama 3.1
            </div>
            <div style={{position: 'absolute', left: 26, right: 26, top: 122, bottom: 28, borderRadius: 18, overflow: 'hidden', background: rgba('#050A16', 0.8), border: `1px solid ${rgba(PAL.info, 0.25 + 0.4 * lit)}`}}>
              <HiddenTray frame={f} w={340} reveal={lidOpen} seed="llama" />
              {/* the lid slides up: an open model */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '100%',
                  transform: `translateY(${-lidOpen * 104}%)`,
                  background: `linear-gradient(180deg, #2A3A5C, #121B30)`,
                  borderBottom: `4px solid ${rgba(PAL.info, 0.8)}`,
                  boxShadow: `0 10px 30px ${rgba(PAL.info, 0.3 * lidOpen)}`,
                }}
              >
                <div style={{position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: 90, height: 14, borderRadius: 7, background: '#7F8BA2'}} />
              </div>
              <div style={{position: 'absolute', inset: 0, boxShadow: `inset 0 0 60px ${rgba(PAL.info, 0.35 * lit)}`}} />
            </div>
          </Glass>
        </div>
      ) : null}
    </Stage>
  );
};

/* ================================================================ SH4–5 · 16 bits = 2 bytes, then 8 billion × 2 bytes ≈ 16 GB */
const ONE = 'BIM163_T03_weight-field_c' as const;
const ONE_POS = {x: 420, y: 560, w: 480};
const ONE_START = {x: 960, y: 540, w: 560};
const ONE_FACE: Quad4 = [
  [196, 470],
  [627, 240],
  [1073, 607],
  [533, 800],
];
const ONE_INFO = {x0: 78, y0: 188, x1: 1197, y1: 1107};
const oneK = ONE_POS.w / (ONE_INFO.x1 - ONE_INFO.x0);
const onePt = (nx: number, ny: number) => ({x: ONE_POS.x + (nx - (ONE_INFO.x0 + ONE_INFO.x1) / 2) * oneK, y: ONE_POS.y + (ny - (ONE_INFO.y0 + ONE_INFO.y1) / 2) * oneK});
const ONE_FACE_C = onePt(607, 529);

const HOLD = 'BIM166_T03_bf16-holder_b' as const;
const HOLD_POS = {x: 1210, y: 560, w: 1150};
const HOLD_INFO = {x0: 115, y0: 110, x1: 1661, y1: 811};
const holdK = HOLD_POS.w / (HOLD_INFO.x1 - HOLD_INFO.x0);
const holdPt = (nx: number, ny: number) => ({x: HOLD_POS.x + (nx - (HOLD_INFO.x0 + HOLD_INFO.x1) / 2) * holdK, y: HOLD_POS.y + (ny - (HOLD_INFO.y0 + HOLD_INFO.y1) / 2) * holdK});
const SLOT_X = [298, 461, 628, 796, 965, 1133, 1302, 1469];
const SLOT_Y = [237, 605];
/** bf16 of 0.0212: sign 0, exponent 01111001, fraction 0101110 */
const BITS = '0011110010101110';

const BitTile: React.FC<{frame: number; i: number; at: number}> = ({frame, i, at}) => {
  if (frame < at) return null;
  const row = i < 8 ? 0 : 1;
  const slot = holdPt(SLOT_X[i % 8], SLOT_Y[row]);
  const from = ONE_FACE_C;
  const t = prog(frame, at, 11, EASE.inOut);
  const land = springAt(frame, at + 10, SPRING.snap);
  const x = lerp(from.x, slot.x, t);
  const y = lerp(from.y, slot.y, t) - Math.sin(Math.PI * t) * 160;
  const s = t < 1 ? lerp(0.5, 1, t) : 0.9 + 0.1 * Math.min(1.1, land);
  const one = BITS[i] === '1';
  const tw = 92;
  const th = 112;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - tw / 2,
        top: y - th / 2,
        width: tw,
        height: th,
        borderRadius: 16,
        transform: `scale(${s})`,
        background: one ? `linear-gradient(180deg, #FFFFFF, ${PAL.tile} 45%, ${PAL.tileMid})` : `linear-gradient(180deg, #2A3756, #18223A)`,
        boxShadow: one ? `0 8px 0 ${PAL.tileEdge}, 0 0 26px ${rgba(PAL.info, 0.55)}` : `0 8px 0 #0B1222, 0 0 0 2px ${rgba('#8FA6CC', 0.35)} inset`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
        fontWeight: 500,
        fontSize: 72,
        color: one ? PAL.tileInk : '#9FB0CC',
      }}
    >
      {BITS[i]}
    </div>
  );
};

const Brace: React.FC<{frame: number; at: number; x: number; y0: number; y1: number; text: string}> = ({frame, at, x, y0, y1, text}) => {
  const e = prog(frame, at - 2, 10, EASE.out);
  if (e <= 0) return null;
  const ym = (y0 + y1) / 2;
  const L = (y1 - y0) * e;
  return (
    <>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path
          d={`M ${x + 22} ${ym - L / 2} Q ${x} ${ym - L / 2} ${x} ${ym - L / 4} L ${x} ${ym - 12} L ${x - 16} ${ym} L ${x} ${ym + 12} L ${x} ${ym + L / 4} Q ${x} ${ym + L / 2} ${x + 22} ${ym + L / 2}`}
          fill="none"
          stroke={PAL.info}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div style={{position: 'absolute', left: x - 34, top: ym, transform: `translate(-100%, -50%) translateX(${(1 - e) * 20}px)`, opacity: e, fontFamily: SANS, fontWeight: 600, fontSize: 66, color: PAL.ink, whiteSpace: 'nowrap'}}>
        {text}
      </div>
    </>
  );
};

export const shBits = (f: number) => {
  const oneOut = A.twoBytes - 16;
  const slide = prog(f, A.stored - 6, 18, EASE.inOut);
  const valX = lerp(ONE_START.x, ONE_POS.x, slide);
  const valY = lerp(ONE_START.y - 300, ONE_POS.y - 270, slide);
  const topRail = holdPt(880, SLOT_Y[0]);
  const botRail = holdPt(880, SLOT_Y[1]);
  const railX = holdPt(205, 0).x;
  // equation phase: the holder shrinks to the right, a weight tray rises on the left, both merge into the crate
  const toEq = prog(f, A.eightB2 - 14, 18, EASE.inOut);
  const merge = prog(f, A.about, 14, EASE.inCubic);
  const crateAt = A.gb16 + 4;
  const HOLD_EQ = {x: 1340, y: 500, w: 560};
  const CRATE = {x: 600, y: 650};
  const hx = lerp(lerp(HOLD_POS.x, HOLD_EQ.x, toEq), CRATE.x, merge);
  const hy = lerp(lerp(HOLD_POS.y, HOLD_EQ.y, toEq), CRATE.y, merge);
  const hs = lerp(lerp(1, HOLD_EQ.w / HOLD_POS.w, toEq), 0.12, merge);
  const tray = springAt(f, A.eightB2 - 4, SPRING.soft);
  const tx = lerp(600, CRATE.x, merge);
  const ty = lerp(500, CRATE.y, merge) + (1 - Math.min(1, tray)) * 420;
  const ts = lerp(1, 0.12, merge);
  const crateIn = springAt(f, crateAt, SPRING.heavy);
  const crateY = lerp(CRATE.y - 520, CRATE.y, Math.min(1.04, crateIn));
  const push = prog(f, A.theres, A.our16 - A.theres + 4, EASE.inExpo);
  const burst = f >= crateAt + 6 ? Math.exp(-(f - crateAt - 6) / 7) : 0;
  const cam: CamKey[] = [
    {f: A.each - 12, x: 960, y: 540, zoom: 1.06},
    {f: A.twoBytes, x: 980, y: 540, zoom: 1.0, dur: 90},
    {f: A.gb16, x: 960, y: 530, zoom: 1.02, dur: 60},
    {f: A.theres, x: 960, y: 530, zoom: 1.05, dur: 40},
    {f: A.our16 + 2, x: CRATE.x, y: CRATE.y, zoom: 2.3, dur: A.our16 + 2 - A.theres, ease: 'inExpo'},
  ];
  // the bits and braces ride with the holder (same centre/scale transform)
  const k = hs;
  const groupXf = `translate(${hx - HOLD_POS.x * k}px, ${hy - HOLD_POS.y * k}px) scale(${k})`;
  return (
    <Stage
      frame={f}
      env={{kind: 'void', dust: 40}}
      cam={cam}
      shake={[{at: crateAt + 6, strength: 0.9}]}
      hud={
        <>
          {f < A.bit16 + 16 ? (
            <div style={{position: 'absolute', left: 0, top: 0, opacity: prog(f, A.each, 10, EASE.out) * (1 - prog(f, A.bit16 + 4, 10))}}>
              <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
                <line x1={valX} y1={valY + 52} x2={valX} y2={valY + 128} stroke={PAL.annotation} strokeWidth={3} />
                <circle cx={valX} cy={valY + 132} r={7} fill={PAL.info} />
              </svg>
              <div style={{position: 'absolute', left: valX, top: valY, transform: 'translate(-50%, -50%)', padding: '6px 26px', borderRadius: 14, background: rgba('#070B15', 0.86), border: `2px solid ${rgba(PAL.info, 0.6)}`, fontFamily: MONO, fontWeight: 500, fontSize: 84, color: PAL.info, textShadow: `0 0 18px ${rgba(PAL.info, 0.7)}`}}>
                {rollDigits(f, A.each, 22, '0.0212', 'w1')}
              </div>
            </div>
          ) : null}
          <KineticText frame={f} at={A.bit16 + 6} exitAt={A.eightB2 + 2} text="16 bits" mode="pop" x={HOLD_POS.x} y={196} size={96} />
          <KineticText frame={f} at={A.twoBytes} exitAt={A.eightB2 + 2} text="= 2 bytes" mode="slam" x={HOLD_POS.x} y={872} size={84} color={PAL.info} />
          {/* the equation */}
          <KineticText frame={f} at={A.eightB2} exitAt={A.our16 + 4} text="8 billion weights" mode="slam" x={600} y={225} size={86} />
          <KineticText frame={f} at={A.bytesEach} exitAt={A.our16 + 4} text="×" mode="slam" x={1095} y={225} size={96} color={PAL.info} backing="none" />
          <KineticText frame={f} at={A.twoBytes2} exitAt={A.our16 + 4} text="2 bytes" mode="slam" x={1360} y={225} size={86} />
          <KineticText frame={f} at={A.about} exitAt={A.our16 + 4} text="≈" mode="slam" x={960} y={652} size={190} color={PAL.info} backing="none" />
          <KineticText frame={f} at={A.gb16} exitAt={A.our16 + 4} text="16 GB" mode="slam" x={1390} y={650} size={210} color={PAL.info} />
        </>
      }
    >
      <Prop
        frame={f}
        src={ONE}
        x={lerp(ONE_START.x, ONE_POS.x, slide)}
        y={lerp(ONE_START.y, ONE_POS.y, slide)}
        w={lerp(ONE_START.w, ONE_POS.w, slide)}
        enter={{kind: 'zoom', at: A.each - 14, dur: 18}}
        exit={{kind: 'slide', at: oneOut, dur: 14, to: 'left'}}
        rim={{color: PAL.info, strength: 0.5}}
        sweep={{at: [A.each + 2], dur: 24}}
        shadow={0.55}
        float={4}
      />
      {tray > 0.001 && merge < 1 ? (
        <Prop frame={f} src={TRAY} x={tx} y={ty} w={620 * ts} rim={{color: PAL.info, strength: 0.4}} sweep={{at: [A.eightB2 + 4], dur: 26}} shadow={0.5 * (1 - merge)} opacity={1 - merge} float={3} />
      ) : null}
      {merge < 1 ? (
        <Prop
          frame={f}
          src={HOLD}
          x={hx}
          y={hy}
          w={HOLD_POS.w * hs}
          enter={{kind: 'slide', at: A.stored - 6, dur: 18, from: 'right', dist: 900}}
          rim={{color: '#9CC8FF', strength: 0.3}}
          sweep={{at: [A.bit16 + 20, A.twoBytes + 2, A.twoBytes2 + 2], dur: 24}}
          shadow={0.45 * (1 - merge)}
          opacity={1 - merge}
        />
      ) : null}
      {merge < 1 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: groupXf, opacity: 1 - merge}}>
          {Array.from({length: 16}, (_, i) => (
            <BitTile key={i} frame={f} i={i} at={A.bit16 - 2 + Math.round(i * 1.15)} />
          ))}
          <div style={{opacity: 1 - prog(f, A.eightB2 - 16, 8)}}>
            <Brace frame={f} at={A.twoBytes} x={railX - 10} y0={topRail.y - 70} y1={topRail.y + 70} text="1 byte" />
            <Brace frame={f} at={A.twoBytes + 4} x={railX - 10} y0={botRail.y - 70} y1={botRail.y + 70} text="1 byte" />
          </div>
        </div>
      ) : null}
      {merge > 0 && f < crateAt + 8 ? (
        <div style={{position: 'absolute', left: CRATE.x - 200, top: CRATE.y - 200, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.5 * merge)}, ${rgba(PAL.info, 0.45 * merge)} 40%, rgba(0,0,0,0))`, mixBlendMode: 'screen', transform: `scale(${0.6 + 0.4 * Math.sin(f / 3) ** 2})`}} />
      ) : null}
      {/* the result: the ≈16 GB crate (the opening's crate) */}
      {f >= crateAt - 2 ? (
        <>
          <Crate3D frame={f} x={CRATE.x} y={crateY} w={440 * (1 + 0.03 * Math.sin((f - crateAt) / 9))} yaw={34 + 6 * push} pitch={20} label="≈16 GB" glow={0.7 + 0.3 * push} />
          {burst > 0.02 ? (
            <div style={{position: 'absolute', left: CRATE.x - 420, top: CRATE.y - 300, width: 840, height: 600, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.55 * burst)}, ${rgba(PAL.info, 0.35 * burst)} 40%, rgba(0,0,0,0))`, mixBlendMode: 'screen'}} />
          ) : null}
        </>
      ) : null}
    </Stage>
  );
};

/* ================================================================ SH6 · callback: the opening's crate thunders across */
export const CALLBACK_AT = A.our16;
const bridgeCallback: Omit<BridgeProps, 'frame'> = {
  view: 'threeQuarter',
  cam: [
    {f: CALLBACK_AT, cam: {tx: -1.2, ty: 3.0, tz: 0.4, yaw: 30, pitch: 14, dist: 10.5, fov: 30}},
    {f: CALLBACK_AT + 50, cam: {tx: 1.6, ty: 3.0, tz: 0.4, yaw: 40, pitch: 15, dist: 9.6, fov: 30}, dur: 50, ease: EASE.inOut},
  ],
  bandwidth: 0.75,
  flowFrom: 1e9,
  heroCrate: {at: CALLBACK_AT - 4, dur: 40, scale: 2.4, label: '≈16 GB'},
  mathActivity: 0.7,
  drift: 0.6,
};
export const shCallback = (f: number) => {
  const t = f - CALLBACK_AT;
  const chroma = t >= 0 && t < 8 ? (8 - t) / 8 : 0;
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      shake={[{at: CALLBACK_AT + 36, strength: 0.8}]}
      hud={
        <>
          <Tag frame={f} at={A.fromStart - 2} text="From the start" size={72} x={100} y={146} icon={<RewindGlyph size={58} />} />
          {/* a thin "memory" frame */}
          <div style={{position: 'absolute', inset: 28, borderRadius: 26, border: `3px solid ${rgba('#DDEBFF', 0.28 + 0.4 * chroma)}`, boxShadow: `inset 0 0 120px rgba(0,0,0,0.55)`}} />
        </>
      }
    >
      <div style={{position: 'absolute', inset: 0, filter: `saturate(${0.82 + 0.18 * (1 - chroma)}) contrast(1.05)`}}>
        <Bridge frame={f} {...bridgeCallback} />
      </div>
      {chroma > 0.02 ? (
        <div style={{position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.5 * chroma, transform: `translateX(${10 * chroma}px)`, filter: 'hue-rotate(160deg) blur(1px)'}}>
          <Bridge frame={f} {...bridgeCallback} />
        </div>
      ) : null}
    </Stage>
  );
};

export {Rich};
void track;
