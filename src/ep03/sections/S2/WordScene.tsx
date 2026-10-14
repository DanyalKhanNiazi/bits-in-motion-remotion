/**
 * S2 shot D: "Photosynthesis" is chopped where you would not expect ("Photos" + "ynthesis"), then OpenAI's rule of
 * thumb on a steel ruler: ≈4 characters per token, ≈ ¾ of a word. Ends by diving into the token tile.
 */
import React from 'react';
import {
  EASE,
  KineticText,
  Label,
  PAL,
  SANS,
  SPRING,
  Stage,
  clamp01,
  lerp,
  poseAt,
  prog,
  rgba,
  springAt,
  textWidth,
  toScreen,
  useFontsReady,
  win,
  type CamKey,
} from '../../kit';
import {A, TO} from './data';
import {Blade} from './Blade';
import {Chop} from './fx';
import {Tile} from './Tile';
import {tw} from './widths';

const PS = 112;
const PH = PS * 1.5;
const PADP = 46;
const PY = 440;
const GAP = 196;
const CHOP = A.becomes + 6;
// ruler
const O = 560;
const U = 100;
const RY = 640;
const RH = 96;
const CELL = 84;
const CELL_Y = RY - RH / 2 - CELL / 2 - 4;
const TOK = {x: O + 2 * U, y: CELL_Y, w: 4 * U, h: 104};
const BAR_Y = RY + 108;
const BAR_H = 64;
const WORD_U = (4 * U) / 0.75;

const cellDrop = (n: number) => A.four + 4 * n;
const SHAKE = [{at: CHOP, strength: 0.55}];

const camKeys: CamKey[] = [
  {f: A.isnt, x: 960, y: 480, zoom: 1.26},
  {f: A.becomes, x: 960, y: 456, zoom: 1.12, dur: 44},
  {f: A.letter + 10, x: 960, y: 444, zoom: 1.16},
  {f: A.forEnglish + 6, x: 980, y: 612, zoom: 1.3, dur: 26},
  {f: A.thumb, x: 985, y: 630, zoom: 1.45, dur: 50},
  {f: A.four - 2, x: 960, y: 620, zoom: 1.42, dur: 20},
  {f: A.wordEnd - 6, x: 965, y: 627, zoom: 1.5},
  {f: TO, x: TOK.x, y: TOK.y, zoom: 4.0, dur: 20, ease: 'inExpo'},
  {f: TO + 40, x: TOK.x, y: TOK.y, zoom: 5.2},
];

export const WordScene: React.FC<{frame: number}> = ({frame: f}) => {
  useFontsReady();
  const twFull = tw('Photosynthesis', PS, 600);
  const twL = tw('Photos', PS, 600);
  const twR = tw('ynthesis', PS, 600);
  const twGuide = tw('Photo', PS, 600);
  const twS = tw('s', PS, 600);
  const x0 = 960 - twFull / 2;
  const xGuide = x0 + twGuide;
  const xCut = x0 + twL;
  const wL = twL + 2 * PADP;
  const wR = twR + 2 * PADP;
  const total = wL + GAP + wR;
  const cL = 960 - total / 2 + wL / 2;
  const cR = 960 + total / 2 - wR / 2;
  const plateW = twFull + 2 * PADP;
  // hud captions stay where they were when the exit dive starts, so they never ride into the header
  const pose = poseAt(Math.min(f, TO - 20), camKeys, 1, SHAKE);
  const scr = (x: number, y: number) => toScreen(pose, x, y);

  /* ---- the word: plate → cut halves → two tiles */
  // the word tiles recede (shrink and fade in place) before the 'English' chip arrives
  const away = prog(f, A.forEnglish - 7, 11, EASE.inCubic);
  const awayDy = -50 * away;
  const awayOp = 1 - prog(f, A.forEnglish - 7, 10);
  const awaySc = 1 - 0.3 * away;
  const word: React.ReactNode[] = [];
  const slamU = prog(f, A.photosynthesis - 10, 8, EASE.inCubic);
  const slamC = f - (A.photosynthesis - 2);
  const slamSq = slamC >= 0 && slamC < 20 ? 0.1 * Math.exp(-slamC / 3.5) * Math.cos(slamC * 0.85) : 0;
  const sep = springAt(f, CHOP, SPRING.pop);
  const dL = cL - (x0 + twL / 2);
  const dR = cR - (x0 + twL + twR / 2);
  const heal = prog(f, CHOP + 8, 10, EASE.inOut);
  if (f < CHOP) {
    if (f >= A.photosynthesis - 10)
      word.push(
        <div key="plate" style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `960px ${PY}px`, transform: `scale(${lerp(2.4, 1, slamU)})`, opacity: clamp01(slamU * 3), filter: slamU < 1 ? `blur(${(1 - slamU) * 10}px)` : undefined}}>
          <Tile x={960} y={PY} w={plateW} size={PS} text="Photosynthesis" squash={slamSq} click={slamC} glow={win(f, A.photosynthesis - 2, A.photosynthesis + 16, 1, 10) * 0.7} />
        </div>,
      );
  } else if (awayOp > 0) {
    // the two cut halves (straight cut edges), sliding apart
    if (heal < 1) {
      const half = (side: 'L' | 'R') => (
        <div
          key={`half${side}`}
          style={{
            position: 'absolute',
            left: 0,
            top: awayDy,
            width: 1920,
            height: 1080,
            opacity: awayOp,
            transform: `translateX(${(side === 'L' ? dL : dR) * sep}px) rotate(${(side === 'L' ? -1 : 1) * 2.5 * Math.sin(Math.PI * clamp01((f - CHOP) / 14))}deg)`,
            transformOrigin: `${xCut}px ${PY}px`,
            clipPath: side === 'L' ? `inset(0 ${1920 - xCut}px 0 0)` : `inset(0 0 0 ${xCut}px)`,
          }}
        >
          <Tile x={960} y={PY} w={plateW} size={PS} text="Photosynthesis" />
        </div>
      );
      word.push(half('L'), half('R'));
    }
    if (heal > 0) {
      const popL = f >= A.photos ? 1 + 0.12 * Math.exp(-(f - A.photos) / 6) * Math.cos((f - A.photos) * 0.7) : 1;
      const popR = f >= A.synthesis ? 1 + 0.12 * Math.exp(-(f - A.synthesis) / 6) * Math.cos((f - A.synthesis) * 0.7) : 1;
      const sGlow = win(f, A.photos, undefined, 4) * (0.8 + 0.2 * Math.cos((f - A.photos) / 8));
      const faceL = (
        <span style={{fontFamily: SANS, fontWeight: 600, fontSize: PS, color: PAL.tileInk, lineHeight: 1, marginTop: -PS * 0.04, whiteSpace: 'nowrap'}}>
          Photo
          <span style={{color: sGlow > 0.05 ? PAL.infoDeep : PAL.tileInk, textShadow: sGlow > 0.05 ? `0 0 ${18 * sGlow}px ${rgba(PAL.info, 0.9 * sGlow)}` : undefined}}>s</span>
        </span>
      );
      word.push(
        <Tile key="L" x={x0 + twL / 2 + dL * sep} y={PY + awayDy} w={wL} size={PS} face={faceL} opacity={heal * awayOp} scale={popL * awaySc} glow={win(f, A.photos, A.photos + 24, 2, 10)} />,
        <Tile key="R" x={x0 + twL + twR / 2 + dR * sep} y={PY + awayDy} w={wR} size={PS} text="ynthesis" opacity={heal * awayOp} scale={popR * awaySc} glow={win(f, A.synthesis, A.synthesis + 24, 2, 10)} />,
      );
    }
  }

  /* ---- the expected cut (a dashed guide) and the missing letter */
  const guideOn = win(f, A.photosynthesis + 16, CHOP + 6, 8, 8);
  const gx = (cL + wL / 2 + cR - wR / 2) / 2;
  const ghost = win(f, A.without, A.forEnglish + 4, 5, 8) * awayOp;
  const ghostPop = springAt(f, A.without, SPRING.pop);
  const arc = prog(f, A.letter - 4, 14, EASE.out);
  const sX = cL + twL / 2 - twS / 2;
  const arcFrom = {x: gx, y: PY - PH / 2 - 14};
  const arcTo = {x: sX, y: PY - PH / 2 - 10};
  const arcC = {x: (arcFrom.x + arcTo.x) / 2, y: PY - PH / 2 - 150};
  const arcPath = `M ${arcFrom.x} ${arcFrom.y} Q ${arcC.x} ${arcC.y} ${arcTo.x} ${arcTo.y}`;
  const marks = (
    <svg width={10} height={10} style={{position: 'absolute', left: 0, top: awayDy, overflow: 'visible', opacity: awayOp}}>
      {guideOn > 0 ? (
        <line
          x1={xGuide}
          y1={PY - PH / 2 - 40}
          x2={xGuide}
          y2={lerp(PY - PH / 2 - 40, PY + PH / 2 + 40, prog(f, A.photosynthesis + 16, 10, EASE.out))}
          stroke={PAL.infoPale}
          strokeWidth={5}
          strokeDasharray="14 10"
          opacity={0.95 * guideOn}
        />
      ) : null}
      {guideOn > 0 ? (
        <g opacity={guideOn} fill={PAL.infoPale}>
          <path d={`M ${xGuide - 14} ${PY - PH / 2 - 62} L ${xGuide + 14} ${PY - PH / 2 - 62} L ${xGuide} ${PY - PH / 2 - 42} Z`} />
          <path d={`M ${xGuide - 14} ${PY + PH / 2 + 62} L ${xGuide + 14} ${PY + PH / 2 + 62} L ${xGuide} ${PY + PH / 2 + 42} Z`} />
        </g>
      ) : null}
      {ghost > 0 ? (
        <g opacity={ghost} transform={`translate(${gx} ${PY}) scale(${Math.max(0, ghostPop)}) translate(${-gx} ${-PY})`}>
          <rect x={gx - twS / 2 - 16} y={PY - PH / 2 + 6} width={twS + 32} height={PH - 12} rx={18} fill={rgba(PAL.emphasis, 0.08)} stroke={PAL.emphasis} strokeWidth={4} strokeDasharray="14 9" />
          <text x={gx} y={PY + PS * 0.34} textAnchor="middle" fontFamily={SANS} fontWeight={600} fontSize={PS} fill={rgba(PAL.emphasis, 0.5)}>
            s
          </text>
        </g>
      ) : null}
      {arc > 0 && ghost > 0 ? (
        <g opacity={ghost}>
          <path d={arcPath} fill="none" stroke={PAL.info} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - arc} />
          {arc > 0.92 ? <circle cx={arcTo.x} cy={arcTo.y} r={9} fill={PAL.info} /> : null}
        </g>
      ) : null}
    </svg>
  );

  /* ---- blade: hovers on the guide, jinks one letter right, chops */
  const bladeAt = (fr: number) => {
    let x = xGuide;
    let y = PY - PH / 2 - 76;
    let op = prog(fr, A.isnt + 6, 6);
    let tilt = 0;
    if (fr < A.becomes) {
      const u = prog(fr, A.isnt + 6, 30, EASE.outBack);
      y = lerp(-780, PY - PH / 2 - 76, u) + Math.sin(fr / 8) * 4;
      tilt = lerp(-24, 0, prog(fr, A.isnt + 6, 30, EASE.out));
    } else if (fr < CHOP + 1) {
      const jink = prog(fr, A.becomes + 2, 3, EASE.inOut);
      x = lerp(xGuide, xCut, jink);
      y = lerp(PY - PH / 2 - 76, PY + PH / 2 + 30, prog(fr, A.becomes + 3, 3, EASE.inCubic));
      tilt = -6 * Math.sin(Math.PI * jink);
    } else {
      x = xCut;
      y = lerp(PY + PH / 2 + 30, PY - PH / 2 - 130, prog(fr, CHOP + 2, 10, EASE.out)) - 900 * prog(fr, CHOP + 16, 16, EASE.inCubic);
      tilt = -10 * prog(fr, CHOP + 16, 16);
      op = 1 - prog(fr, CHOP + 26, 6);
    }
    return {x, y, op, tilt};
  };
  const bl = bladeAt(f);
  const blP = bladeAt(f - 1);
  const bladeVis = f >= A.isnt + 4 && f < CHOP + 34;

  /* ---- ruler, character cells, token, word bar */
  const rIn = springAt(f, A.forEnglish - 5, {damping: 18, stiffness: 110, mass: 1});
  const rDx = 1500 * (1 - rIn);
  const rulerOp = prog(f, A.forEnglish - 6, 4);
  const exitFade = 1 - prog(f, TO + 4, 10);
  const ruler =
    f >= A.forEnglish - 6 ? (
      <div
        style={{
          position: 'absolute',
          left: rDx,
          top: 0,
          width: 1920,
          height: 1080,
          opacity: rulerOp,
          WebkitMaskImage: 'linear-gradient(90deg, #000 0px, #000 1290px, rgba(0,0,0,0) 1470px)',
          maskImage: 'linear-gradient(90deg, #000 0px, #000 1290px, rgba(0,0,0,0) 1470px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: O - 90,
            top: RY + RH / 2 - 6,
            width: 1000,
            height: 60,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0))',
            filter: 'blur(8px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: O - 70,
            top: RY - RH / 2,
            width: 980,
            height: RH,
            borderRadius: 10,
            background: `repeating-linear-gradient(180deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0) 3px), linear-gradient(180deg, #F1F3F6 0%, #CDD3DB 38%, #AEB6C2 78%, #8D96A4 100%)`,
            boxShadow: `inset 0 2px 0 rgba(255,255,255,0.9), inset 0 -3px 0 rgba(60,70,90,0.5), 0 14px 26px rgba(0,0,0,0.5), 0 0 0 1px ${rgba('#0B1222', 0.6)}`,
          }}
        />
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {Array.from({length: 17}, (_, n) => {
            const x = O + (n * U) / 2;
            const major = n % 2 === 0;
            const tk = prog(f, A.forEnglish + 20 + n * 2.2, 6, EASE.out);
            if (tk <= 0) return null;
            const lit = major && n / 2 < 4 && f >= cellDrop(Math.min(3, n / 2)) + 4;
            const lit2 = major && n / 2 === 4 && f >= cellDrop(3) + 4;
            return (
              <line
                key={n}
                x1={x}
                y1={RY - RH / 2 + 1}
                x2={x}
                y2={RY - RH / 2 + (major ? 38 : 20) * tk}
                stroke={lit || lit2 ? PAL.infoDeep : '#3B4556'}
                strokeWidth={major ? 4 : 2.5}
              />
            );
          })}
          {(() => {
            const sc = prog(f, A.forEnglish + 20, 40, EASE.inOut);
            return sc > 0 && sc < 1 ? <rect x={O - 60 + sc * 980} y={RY - RH / 2 + 2} width={70} height={RH - 4} rx={8} fill={rgba('#FFFFFF', 0.35 * Math.sin(Math.PI * sc))} /> : null;
          })()}
          {[0, 1, 2, 3].map((n) => {
            const on = prog(f, cellDrop(n) + 5, 6, EASE.out);
            return on > 0 ? <rect key={n} x={O + n * U + 6} y={RY - RH / 2 + 50} width={(U - 12) * on} height={10} rx={5} fill={PAL.info} opacity={0.9} /> : null;
          })}
        </svg>
      </div>
    ) : null;
  const cells: React.ReactNode[] = [];
  const fuse = prog(f, A.per, 8, EASE.inOut);
  const tokenIn = prog(f, A.token - 3, 4, EASE.out);
  for (let n = 0; n < 4; n++) {
    const d = cellDrop(n);
    if (f < d || tokenIn >= 1) continue;
    const sp = springAt(f, d, SPRING.snap);
    const c = f - (d + 6);
    cells.push(
      <Tile
        key={`c${n}`}
        x={O + n * U + U / 2}
        y={CELL_Y - 230 * (1 - sp)}
        w={lerp(CELL, U + 2, fuse)}
        h={CELL}
        size={CELL / 1.5}
        face={<div style={{width: 14, height: 14, borderRadius: 7, background: rgba(PAL.tileInk, 0.55)}} />}
        squash={c >= 0 && c < 18 ? 0.08 * Math.exp(-c / 3) * Math.cos(c * 0.9) : 0}
        click={c}
        opacity={clamp01((f - d + 1) / 3) * (1 - tokenIn)}
        glow={win(f, d + 4, d + 14, 1, 8) * 0.8}
      />,
    );
  }
  const tc = f - A.token;
  const token =
    tokenIn > 0 ? (
      <Tile
        x={TOK.x}
        y={TOK.y}
        w={TOK.w}
        h={TOK.h}
        size={66}
        text="token"
        opacity={tokenIn}
        click={tc}
        squash={tc >= 0 && tc < 18 ? 0.07 * Math.exp(-tc / 3) * Math.cos(tc * 0.9) : 0}
        glow={win(f, A.token, A.token + 26, 2, 12)}
      />
    ) : null;
  const barIn = prog(f, A.roughly, 12, EASE.outExpo);
  const fill = prog(f, A.three, 12, EASE.inOut);
  const bar =
    f >= A.roughly ? (
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, opacity: barIn}}>
        <div
          style={{
            position: 'absolute',
            left: O,
            top: BAR_Y - BAR_H / 2,
            width: WORD_U * barIn,
            height: BAR_H,
            borderRadius: 14,
            background: 'linear-gradient(180deg, #1D2D4D 0%, #121D33 100%)',
            boxShadow: `inset 0 2px 0 ${rgba('#6F8FCB', 0.45)}, 0 0 0 2px ${rgba(PAL.annotation, 0.55)}, 0 12px 24px rgba(0,0,0,0.5)`,
            overflow: 'hidden',
          }}
        >
          <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 * U * fill, background: `linear-gradient(90deg, ${rgba(PAL.info, 0.55)}, ${rgba(PAL.info, 0.85)})`, boxShadow: `0 0 26px ${rgba(PAL.info, 0.6)}`}} />
        </div>
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {[O, O + 4 * U].map((x, i) => (
            <line key={i} x1={x} y1={TOK.y + TOK.h / 2 + 8} x2={x} y2={lerp(TOK.y + TOK.h / 2 + 8, BAR_Y - BAR_H / 2, fill)} stroke={PAL.infoPale} strokeWidth={3} strokeDasharray="10 8" opacity={fill > 0 ? 0.9 : 0} />
          ))}
        </svg>
      </div>
    ) : null;

  /* ---- hud */
  const pCh = scr(TOK.x, 444);
  const pWord = scr(O + WORD_U / 2, BAR_Y + BAR_H / 2 + 30);
  const pQ = scr(O + WORD_U + 36, BAR_Y);
  const hudFade = exitFade;
  const hud = (
    <div style={{position: 'absolute', inset: 0, opacity: hudFade}}>
      <KineticText frame={f} at={A.english} text="English" mode="pop" x={110} y={120} size={76} screen align="left" backing="plate" color={PAL.infoPale} />
      <Label frame={f} at={A.openai4} text="OpenAI's rule of thumb" x={110 + tw('English', 76, 700) + 78} y={120} size={76} screen />
      <KineticText frame={f} at={A.four} text="≈4 characters" mode="pop" x={pCh.x} y={pCh.y} size={100} screen />
      {f >= A.roughly + 4 ? <KineticText frame={f} at={A.roughly + 6} text="a word" mode="rise" x={pWord.x} y={pWord.y} size={96} weight={700} color={PAL.ink} backing="scrim" screen /> : null}
      <KineticText frame={f} at={A.three} text="≈ ¾ word" mode="slam" x={pQ.x} y={pQ.y} size={100} align="left" screen />
    </div>
  );

  return (
    <Stage frame={f} env={{kind: 'void', dust: 45}} cam={camKeys} shake={SHAKE} hud={hud}>
      <div
        style={{
          position: 'absolute',
          left: 960 - 1100,
          top: 60,
          width: 2200,
          height: 1100,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${rgba('#1E4A80', 0.42)}, ${rgba('#0B1830', 0.12)} 60%, ${rgba('#0B1830', 0)})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -600,
          top: 820,
          width: 3120,
          height: 700,
          background: `linear-gradient(180deg, ${rgba('#0E1A30', 0)} 0%, ${rgba('#0E1A30', 0.75)} 30%, ${rgba('#060B16', 0.95)} 100%)`,
        }}
      />
      <CuttingMat frame={f} />
      {ruler}
      {bar}
      {cells}
      {token}
      {word}
      {marks}
      <Chop x={xCut} y={PY} h={PH * 0.95} t={f - CHOP} seed="s2photo" scale={1.6} />
      {bladeVis ? <Blade tipX={bl.x} tipY={bl.y} k={0.5} tilt={bl.tilt} opacity={bl.op} vx={bl.x - blP.x} vy={bl.y - blP.y} edge={win(f, A.becomes - 6, CHOP + 10, 4, 8) * 0.8} sweep={f >= A.photosynthesis + 20 && f <= A.photosynthesis + 40 ? (f - A.photosynthesis - 20) / 20 : null} /> : null}
    </Stage>
  );
};

/** A dark cutting mat in perspective: the work surface for the chop and the ruler. */
const CuttingMat: React.FC<{frame: number}> = ({frame}) => {
  const lines: React.ReactNode[] = [];
  for (let i = -14; i <= 14; i++) lines.push(<line key={`v${i}`} x1={1300 + i * 100} y1={0} x2={1300 + i * 100} y2={1400} stroke={rgba('#6F8FCB', i % 5 === 0 ? 0.32 : 0.14)} strokeWidth={i % 5 === 0 ? 3 : 2} />);
  for (let j = 0; j <= 14; j++) lines.push(<line key={`h${j}`} x1={-100} y1={j * 100} x2={2700} y2={j * 100} stroke={rgba('#6F8FCB', j % 5 === 0 ? 0.32 : 0.14)} strokeWidth={j % 5 === 0 ? 3 : 2} />);
  const glow = 0.5 + 0.5 * Math.sin(frame / 50);
  return (
    <div style={{position: 'absolute', left: -600, top: -400, width: 3120, height: 2000, perspective: 1300, perspectiveOrigin: '1560px 640px'}}>
      <div style={{position: 'absolute', left: 1560 - 1300, top: 1580 - 1400, width: 2600, height: 1400, transformOrigin: '50% 100%', transform: 'rotateX(72deg)'}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 40,
            background: `radial-gradient(ellipse 55% 60% at 50% 70%, ${rgba('#1B3A63', 0.95)}, ${rgba('#0D1A30', 0.95)} 60%, ${rgba('#070D19', 0.0)})`,
          }}
        />
        <svg width={2600} height={1400} style={{position: 'absolute', left: 0, top: 0}}>
          {lines}
          <rect x={0} y={1390} width={2600} height={10} fill={rgba(PAL.info, 0.18 + 0.1 * glow)} />
        </svg>
      </div>
    </div>
  );
};
