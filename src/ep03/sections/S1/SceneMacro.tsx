/**
 * S1 shots 4–5, macro of the screen → the chain of pieces.
 * The answer trickles onto the glass a few words at a time (the Bit is the caret, the camera follows it). On
 * "typing effect" every word materialises into a white token tile in place, the glass dissolves into the stage and
 * the tiles settle into one row. On "Each piece depends on the ones before it" cyan arcs from every earlier tile
 * light into each tile in turn; on "to write each piece" an empty next tile appears and every arc converges on it.
 */
import React from 'react';
import {BitHead, PAL, Rich, SANS, Stage, TokenTile, poseAt, tileH, tileRowLayout, toScreen} from '../../kit';
import {EASE, TAU, clamp01, lerp, mixHex, prog, rgba, springAt, SPRING, textWidth, useFontsReady} from '../../kit';
import {A, T} from './anchors';

export const MACRO = ['Overall,', ' the', ' outlook', ' is'];
/** index of the empty next tile in the row */
const G = MACRO.length;
export const NEXT_WORD = 'good';
const FS = 110;
const LINE_Y = 560;
const LINE_X = 170;
const PREV = 'suppliers raised prices.';
/** stream frames: bursts of a few words */
const ST = [A.when + 6, A.trickles - 2, A.trickles + 6, A.trickles + 40];
const TILE = 80;
const ROW_Y = 650;
const ROW_X = 960;
/** each tile "activates" (its arcs light) in turn; the last slot is the empty next piece */
const ACT = [A.piece - 6, A.piece + 4, A.piece + 22, A.piece + 40];
export const GHOST_AT = A.write - 2;
const MORPH = A.typing;

const layoutText = () => {
  const space = textWidth(' ', FS, 600);
  let x = LINE_X;
  return MACRO.map((t) => {
    const w = textWidth(t.trim(), FS, 600);
    const lead = t.startsWith(' ') ? space : 0;
    const c = {x: x + lead + w / 2, w};
    x += lead + w;
    return c;
  });
};
const rowTokens = [...MACRO, ''];
export const rowLayout = () => {
  const L = tileRowLayout(rowTokens, TILE, 20);
  return {xs: L.xs.map((v) => ROW_X + v), ws: L.ws, total: L.total};
};
/** screen point of the empty next tile at rest (for the lens dive) */
export const ghostPoint = () => {
  const R = rowLayout();
  return {x: R.xs[G], y: ROW_Y};
};

const shownAt = (f: number) => {
  let n = 0;
  ST.forEach((s, i) => {
    if (f >= s) n = i + 1;
  });
  return n;
};

/** Camera: follow the caret while the line streams, settle on the row, then push toward the next tile. */
const camAt = (f: number, caretX: (g: number) => number) => {
  const follow = (g: number) => 960 + 0 * caretX(g);
  let fx = 0;
  for (let k = 0; k < 12; k++) fx += follow(f - k * 3) / 12;
  const back = prog(f, MORPH + 4, 30, EASE.inOut);
  const push = prog(f, A.depends, GHOST_AT + 24 - A.depends, EASE.inOut);
  return {
    x: lerp(fx, 960, back),
    y: lerp(lerp(560, 545, prog(f, T.toStream, 90)), 560, back) + 14 * push,
    zoom: lerp(lerp(1.0, 1.03, prog(f, T.toStream, 120)), 1.0, back) * lerp(1, 1.04, push),
  };
};
const DRIFT = 0.6;

/** The glass of the screen at macro distance: subpixels, a soft reflection, scanline shimmer. */
const Glass: React.FC<{frame: number; opacity: number}> = ({frame: f, opacity}) =>
  opacity <= 0.01 ? null : (
    <div style={{position: 'absolute', left: -800, top: -500, width: 3800, height: 2100, opacity}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 50% at 42% 44%, #13203A 0%, #0C1528 55%, #070C17 100%)'}} />
      <svg width={3800} height={2100} style={{position: 'absolute', inset: 0}}>
        <defs>
          <pattern id="s1-px" width={12} height={12} patternUnits="userSpaceOnUse">
            <rect x={1} y={1} width={3} height={10} fill="#FF4060" opacity={0.13} />
            <rect x={5} y={1} width={3} height={10} fill="#40FF90" opacity={0.11} />
            <rect x={9} y={1} width={2.5} height={10} fill="#4080FF" opacity={0.16} />
          </pattern>
        </defs>
        <rect width={3800} height={2100} fill="url(#s1-px)" />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(${112 + 4 * Math.sin((TAU * f) / 300)}deg, rgba(255,255,255,0) 30%, rgba(200,225,255,0.07) 44%, rgba(255,255,255,0) 52%)`,
        }}
      />
    </div>
  );

export const SceneMacro: React.FC<{frame: number}> = ({frame: f}) => {
  useFontsReady();
  const TX = layoutText();
  const R = rowLayout();
  const n = shownAt(f);
  const caretX = (g: number) => {
    const k = shownAt(g);
    return k === 0 ? LINE_X : TX[k - 1].x + TX[k - 1].w / 2;
  };
  const glass = 1 - prog(f, MORPH + 6, 22, EASE.inOut);
  const lastAt = n > 0 ? ST[n - 1] : -1e9;
  const streaming = n > 0 && n < MACRO.length;
  const caretOn = streaming || Math.floor((f - lastAt) / 9) % 2 === 0;
  // which tile is active (arcs into it light up)
  let act = -1;
  ACT.forEach((a, i) => {
    if (f >= a) act = i;
  });
  const ghostIn = springAt(f, GHOST_AT, SPRING.pop);
  const ghostOn = f >= GHOST_AT;
  const tileTop = ROW_Y - tileH(TILE) / 2 - 4;
  const arcs: React.ReactNode[] = [];
  const target = ghostOn ? G : act;
  for (let i = 1; i <= G; i++) {
    const ai = i === G ? GHOST_AT : ACT[i];
    if (f < ai) continue;
    const draw = prog(f, ai, 8, EASE.out);
    const isCur = i === target;
    for (let j = 0; j < i; j++) {
      const x0 = R.xs[j];
      const x1 = R.xs[i];
      const h = 70 + 60 * (i - j);
      const d = `M ${x0} ${tileTop} Q ${(x0 + x1) / 2} ${tileTop - h * 2} ${x1} ${tileTop}`;
      const col = isCur ? PAL.info : PAL.structure;
      const op = isCur ? 0.95 : 0.28;
      arcs.push(
        <g key={`${i}-${j}`}>
          {isCur ? <path d={d} fill="none" stroke={PAL.info} strokeOpacity={0.25} strokeWidth={10} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} /> : null}
          <path d={d} fill="none" stroke={col} strokeOpacity={op} strokeWidth={isCur ? 3.5 : 2.5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
        </g>,
      );
    }
  }
  // the Bit marks the newest (or the next) tile
  const bitI = target;
  const bitPrev = target - 1;
  const bitAt = target === G ? GHOST_AT : target >= 0 ? ACT[target] : 0;
  const hop = prog(f, bitAt, 8, EASE.inOut);
  const bx = target >= 0 ? lerp(R.xs[Math.max(0, bitPrev)], R.xs[bitI], target > 0 ? hop : 1) : R.xs[0];
  const by = tileTop - 34 - Math.sin(Math.PI * hop) * 40 + 3 * Math.sin((TAU * f) / 40);
  const chainOn = prog(f, MORPH + 18, 8);
  const camNow = camAt(f, caretX);
  const tilt = 1 - prog(f, MORPH + 4, 30, EASE.inOut);
  return (
    <Stage frame={f} env={{kind: 'night', grid: true, dust: 50}} cam={(g) => camAt(g, caretX)} drift={DRIFT} motionBlur={0.25}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `perspective(1700px) rotateY(${tilt * -9}deg) rotateX(${tilt * 4}deg)`, transformOrigin: `${camNow.x}px ${LINE_Y}px`}}>
      <Glass frame={f} opacity={glass} />
      {/* the previous line of the answer, out of focus */}
      <div style={{position: 'absolute', left: LINE_X, top: LINE_Y - 1.36 * FS - FS / 2, fontFamily: SANS, fontWeight: 600, fontSize: FS, lineHeight: 1, color: rgba(PAL.ink, 0.55), filter: 'blur(2px)', whiteSpace: 'nowrap', opacity: glass}}>
        <Rich text={PREV} weight={600} />
      </div>
      {/* the line streaming in (text), then each word becomes a tile */}
      {MACRO.map((t, i) => {
        const a = ST[i];
        if (f < a) return null;
        const age = f - a;
        const fresh = Math.exp(-age / 8);
        const m = prog(f, MORPH + i * 2, 4, EASE.out);
        const fly = prog(f, MORPH + 2 + i * 2, 22, EASE.inOut);
        const px = lerp(TX[i].x, R.xs[i], fly);
        const py = lerp(LINE_Y, ROW_Y, fly);
        const sc0 = Math.min(FS / TILE, (TX[i].w + 0.8 * textWidth(' ', FS, 600)) / R.ws[i]);
        const sc = lerp(sc0, 1, fly);
        const textOp = 1 - m;
        return (
          <React.Fragment key={i}>
            {textOp > 0.01 ? (
              <div
                style={{
                  position: 'absolute',
                  left: TX[i].x,
                  top: LINE_Y,
                  transform: `translate(-50%, -50%) scale(${1 + 0.06 * m})`,
                  fontFamily: SANS,
                  fontWeight: 600,
                  fontSize: FS,
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  color: mixHex(PAL.ink, '#9FF4FF', fresh),
                  textShadow: `0 0 ${10 + 26 * fresh}px ${rgba(PAL.info, 0.25 + 0.7 * fresh)}`,
                  opacity: textOp * clamp01(age / 2 + 0.3),
                }}
              >
                <Rich text={t.trim()} weight={600} />
              </div>
            ) : null}
            {m > 0.01 ? (
              <div style={{position: 'absolute', left: px, top: py, width: 0, height: 0, transform: `scale(${sc})`, opacity: m}}>
                <TokenTile frame={f} text={t} x={0} y={0} size={TILE} w={R.ws[i]} newest={i === target ? 1 : 0} />
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      {/* the caret (the Bit) while the line streams */}
      {n > 0 && glass > 0.5 ? (
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={caretOn ? 1 : 0.3}>
          <BitHead x={TX[n - 1].x + TX[n - 1].w / 2 + 34} y={LINE_Y + 8} size={30 * (1 + 0.3 * Math.exp(-(f - lastAt) / 3))} gid="s1macro" />
        </svg>
      ) : null}
      {/* ghost fog: the words that do not exist yet */}
      {glass > 0.05 && n < MACRO.length ? (
        <div style={{position: 'absolute', left: (n > 0 ? TX[n - 1].x + TX[n - 1].w / 2 : LINE_X) + 70, top: LINE_Y - 34, width: 900, height: 70, borderRadius: 35, background: `linear-gradient(90deg, ${rgba(PAL.annotation, 0.1)}, rgba(0,0,0,0))`, filter: 'blur(10px)', opacity: glass}} />
      ) : null}
      {/* dependency arcs */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={chainOn}>
        {arcs}
      </svg>
      {/* the empty next piece */}
      {ghostOn ? (
        <div style={{position: 'absolute', left: R.xs[G], top: ROW_Y, width: 0, height: 0, transform: `scale(${Math.max(0, ghostIn)})`}}>
          <TokenTile frame={f} text="" x={0} y={0} size={TILE} w={R.ws[G]} ghost />
          <div
            style={{
              position: 'absolute',
              left: -R.ws[G] / 2 - 8,
              top: -tileH(TILE) / 2 - 8,
              width: R.ws[G] + 16,
              height: tileH(TILE) + 16,
              borderRadius: 20,
              border: `3px solid ${rgba(PAL.info, 0.5 + 0.4 * Math.sin((TAU * f) / 24))}`,
              boxShadow: `0 0 30px ${rgba(PAL.info, 0.45)}`,
            }}
          />
        </div>
      ) : null}
      {target >= 0 && chainOn > 0.5 ? (
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <BitHead x={bx} y={by} size={22} gid="s1chain" />
        </svg>
      ) : null}
      {/* materialise flashes */}
      {MACRO.map((_, i) => {
        const d = f - (MORPH + i * 2 + 4);
        if (d < 0 || d > 10) return null;
        return (
          <div
            key={`fl${i}`}
            style={{
              position: 'absolute',
              left: TX[i].x - 160,
              top: LINE_Y - 110,
              width: 320,
              height: 220,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.55 * (1 - d / 10))}, ${rgba(PAL.info, 0)})`,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
      </div>
    </Stage>
  );
};

/** Screen point of the empty next tile at a frame (the lens dive centre). */
export const ghostScreen = (f: number) => {
  const g = ghostPoint();
  const p = poseAt(f, (h: number) => camAt(h, () => LINE_X), DRIFT);
  return toScreen(p, g.x, g.y);
};
