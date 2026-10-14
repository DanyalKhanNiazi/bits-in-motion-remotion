/**
 * S3 · Scene 1 (P05): the question → 6 scored candidates (64 px tiles) → the whole 200,000-token field to the horizon
 * → the weighted wheel picks "Because". The "same question twice" beat is its own scene (twice.tsx).
 */
import React, {useId} from 'react';
import {
  AtlasOpener,
  BackingLayer,
  Bit,
  EASE,
  Footnote,
  KineticText,
  PAL,
  Rich,
  SANS,
  SPRING,
  Stage,
  TokenTile,
  clamp01,
  lerp,
  linear,
  prog,
  rgba,
  safeId,
  springAt,
  tileH,
  tileRowLayout,
} from '../../kit';
import {A} from './anchors';
import {BAR_Y0, FieldCanvas, HERO, NH, TILE_H, camAtU, heroBarH, heroLayout, projectPt} from './field';
import {SLICES, Wheel, idxOf, quadPoly, rotFor, sliceTilePos, type Pt} from './wheel';
import {QUESTION, RestBit, Slot} from './common';

/* ---------------------------------------------------------------- timeline */
export const T1 = {
  rowSnap0: A.p5 - 30,
  bit0: A.given + 4,
  bit1: A.soFar + 10,
  lift0: A.soFar + 14,
  lift1: A.scores + 6,
  slotAt: A.soFar + 10,
  heroSnap0: A.scores - 2,
  bar0: A.howLikely - 2,
  rowExit: A.vocabulary + 18,
  R0: A.vocabulary - 2,
  R1: A.openai + 30,
  pull0: A.vocabulary + 4,
  pull1: A.n000 + 2,
  cnt0: A.openai - 2,
  cntLand: A.n200 + 16,
  approx: A.n000,
  textOut: A.then - 2,
  dive0: A.then + 1,
  dive1: A.picked + 2,
  morph0: A.picked - 8,
  morph1: A.usually + 6,
  spin0: A.picked - 2,
  land: A.likelyOne,
  lift: A.likelyOne + 14,
  dashKey: A.dash - 5,
};

/* ---------------------------------------------------------------- field camera */
const pullU = (f: number): number => {
  if (f <= T1.pull0) return 0;
  if (f < T1.pull1) {
    const t = (f - T1.pull0) / (T1.pull1 - T1.pull0);
    return (1 - Math.cos(Math.PI * Math.pow(t, 1.25))) / 2;
  }
  if (f < T1.dive0) return 1;
  if (f < T1.dive1) return 1 - EASE.inOut((f - T1.dive0) / (T1.dive1 - T1.dive0));
  return 0;
};
export const fieldCam = (f: number) => {
  const hold = 1 + 0.07 * prog(f, T1.pull1, 60, EASE.out) * (1 - prog(f, T1.dive0, T1.dive1 - T1.dive0, EASE.inOut));
  return camAtU(pullU(f), 0.8 * Math.sin((2 * Math.PI * f) / 260), hold);
};
const revealR = (f: number): number => {
  if (f < T1.R0) return 0;
  const t = clamp01((f - T1.R0) / (T1.R1 - T1.R0));
  return t >= 1 ? 2000 : 3 * Math.pow(2000 / 3, Math.pow(t, 1.3));
};
/** the odometer: races in log space from the first thousands to 200,000 */
const countAt = (f: number): number => {
  const t = clamp01((f - T1.cnt0) / (T1.cntLand - T1.cnt0));
  const e = t < 1 ? (1 - Math.cos(Math.PI * Math.pow(t, 1.2))) / 2 : 1;
  return Math.pow(10, lerp(Math.log10(1400), Math.log10(200000), e));
};

/* ---------------------------------------------------------------- the wheel's motion */
const W_CX = 880;
const W_CY = 572;
const W_R = 334;
const W_R0 = 196;
export const K_BEC = idxOf('Because');
const ROT_END = rotFor(K_BEC);
const wheelRot = (f: number): number => {
  const t = clamp01((f - T1.spin0) / (T1.land - T1.spin0));
  const base = ROT_END - 360 * 2.35 * Math.pow(1 - t, 3);
  const after = f > T1.land ? 15 * Math.exp(-(f - T1.land) / 5) * Math.sin((f - T1.land) * 0.5) : 0;
  return base + after;
};

/* ---------------------------------------------------------------- the big counter */
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
const FieldCounter: React.FC<{frame: number}> = ({frame: f}) => {
  if (f < T1.cnt0 - 1 || f > T1.textOut + 10) return null;
  const v = f >= T1.cntLand ? 200000 : Math.min(199999, countAt(f));
  const ap = springAt(f, T1.approx, SPRING.slam);
  const ex = prog(f, T1.textOut, 9, EASE.inCubic);
  const inn = clamp01((f - T1.cnt0 + 1) / 5);
  const settle = f >= T1.approx ? 1 + 0.06 * Math.exp(-(f - T1.approx) / 4) * Math.cos((f - T1.approx) * 0.8) : 1;
  const oIn = springAt(f, A.options, SPRING.pop);
  const flash = f >= T1.approx ? Math.exp(-(f - T1.approx) / 5) : 0;
  const optW = 330;
  const shift = clamp01(oIn) * (optW + 26) * 0.5;
  return (
    <div style={{position: 'absolute', left: 960 - shift, top: 268, transform: `translate(-50%, -50%) translateY(${-24 * ex}px) scale(${settle})`, opacity: inn * (1 - ex), whiteSpace: 'nowrap'}}>
      <div style={{position: 'relative', fontSize: 184}}>
        <BackingLayer kind="scrim" />
        <div
          style={{
            position: 'relative',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 184,
            lineHeight: 1.05,
            color: PAL.ink,
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums',
            filter: flash > 0.02 ? `brightness(${1 + 0.8 * flash}) drop-shadow(0 0 ${30 * flash}px ${rgba(PAL.info, 0.8)})` : undefined,
          }}
        >
          <span style={{display: 'inline-block', width: `${0.64 * Math.min(1, ap)}em`, overflow: 'hidden', verticalAlign: 'bottom', opacity: clamp01(ap * 2)}}>
            <Rich text="≈" weight={700} />
          </span>
          {fmt(v)}
        </div>
        <div
          style={{
            position: 'absolute',
            left: '100%',
            bottom: '0.16em',
            marginLeft: 26,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 84,
            lineHeight: 1,
            color: PAL.ink,
            padding: '4px 22px 10px',
            borderRadius: 16,
            background: rgba('#050A14', 0.82),
            borderBottom: `5px solid ${PAL.info}`,
            opacity: clamp01(oIn * 2),
            transform: `translateY(${(1 - Math.min(1, oIn)) * 30}px) scale(${0.7 + 0.3 * Math.min(1.1, oIn)})`,
            transformOrigin: '0% 80%',
          }}
        >
          options
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- hero bars, tiles, fan lines and the morph */
type HeroGeo = {tile: {x: number; y: number; size: number} | null; bar: [Pt, Pt, Pt, Pt] | null; s: number};
const heroGeo = (f: number, k: number, grow: number): HeroGeo => {
  const cam = fieldCam(f);
  const x = heroLayout().x[k];
  const c = projectPt(cam, x, TILE_H / 2, 0);
  const h = Math.max(0.001, heroBarH(k) * grow);
  const bw = 0.2;
  const BL = projectPt(cam, x - bw, BAR_Y0, 0);
  const BR = projectPt(cam, x + bw, BAR_Y0, 0);
  const TR = projectPt(cam, x + bw, BAR_Y0 + h, 0);
  const TL = projectPt(cam, x - bw, BAR_Y0 + h, 0);
  return {
    tile: c ? {x: c.x, y: c.y, size: (TILE_H * c.s) / 1.5} : null,
    bar: BL && BR && TR && TL ? [[BL.x, BL.y], [BR.x, BR.y], [TR.x, TR.y], [TL.x, TL.y]] : null,
    s: c ? c.s : 0,
  };
};
const barGrow = (f: number, k: number) => springAt(f, T1.bar0 + 3 * k, SPRING.pop) * (1 + 0.025 * Math.sin(f / 9 + k));

const HeroBars: React.FC<{frame: number; vis: number}> = ({frame: f, vis}) => {
  const uid = safeId(useId());
  if (vis <= 0.01) return null;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: vis}}>
      <defs>
        <linearGradient id={`${uid}-g`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={PAL.infoDeep} />
          <stop offset="0.55" stopColor={PAL.info} />
          <stop offset="1" stopColor={PAL.infoPale} />
        </linearGradient>
        <filter id={`${uid}-b`} x="-60%" y="-20%" width="220%" height="140%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
      </defs>
      {HERO.map((_, k) => {
        const g = heroGeo(f, k, barGrow(f, k));
        if (!g.bar || barGrow(f, k) <= 0.01) return null;
        const d = `M${g.bar.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('L')}Z`;
        const topY = g.bar[3][1];
        const cx = (g.bar[2][0] + g.bar[3][0]) / 2;
        const bw = g.bar[2][0] - g.bar[3][0];
        return (
          <g key={k}>
            <path d={d} fill={PAL.info} opacity={0.5} filter={`url(#${uid}-b)`} />
            <path d={d} fill={`url(#${uid}-g)`} />
            <rect x={cx - bw * 0.9} y={topY - 3} width={bw * 1.8} height={6} rx={3} fill="#FFFFFF" opacity={0.85} />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- scene */
export const scene1 = (f: number): React.ReactNode => {
  // question row: below the opener, then lifted to the top as the candidates arrive
  const lift = prog(f, T1.lift0, T1.lift1 - T1.lift0, EASE.inOut);
  const qExit = prog(f, T1.rowExit, 16, EASE.inCubic);
  // the question: two big lines (64 px) while the Bit reads it, then one 48 px strip across the top
  const L2 = tileRowLayout(QUESTION, 76, 18, undefined, 1660);
  const L1 = tileRowLayout(QUESTION, 60, 14, undefined, 1480);
  const c2 = {x: 960, y: 650};
  const c1 = {x: 900, y: 192};
  const qTile = (i: number) => ({
    x: lerp(c2.x + L2.xs[i], c1.x + L1.xs[i], lift),
    y: lerp(c2.y + L2.ys[i], c1.y + L1.ys[i], lift),
    w: lerp(L2.ws[i], L1.ws[i], lift),
  });
  const qSize = lerp(76, 60, lift);
  const last = qTile(QUESTION.length - 1);
  const slotX = last.x + last.w / 2 + lerp(16, 12, lift) + qSize * 0.65;
  const slotY = last.y;
  const floorY = c2.y + L2.ys[QUESTION.length - 1] + tileH(76) / 2 + 4;
  const qBottom = lerp(c2.y + L2.ys[QUESTION.length - 1], c1.y + L1.ys[QUESTION.length - 1], lift) + tileH(qSize) / 2;
  // the Bit hops tile to tile along the question
  const tops = QUESTION.map((_, i) => {
    const t = qTile(i);
    return [t.x, t.y - tileH(qSize) / 2 - 24] as const;
  });
  const bq = clamp01((f - T1.bit0) / (T1.bit1 - T1.bit0)) * (QUESTION.length - 1);
  const bi = Math.min(QUESTION.length - 2, Math.floor(bq));
  const glow = (i: number) => {
    if (f < T1.bit0) return 0;
    const on = clamp01(1 - Math.abs(bq - i) * 1.4);
    const after = bq > i ? 0.22 * (1 - prog(f, T1.rowExit - 10, 10)) : 0;
    return Math.max(on, after);
  };
  // field
  const cam = fieldCam(f);
  const R = revealR(f);
  const heroP = projectPt(cam, 0, TILE_H / 2, 0);
  const heroS = heroP ? heroP.s : 0;
  const bigHero = clamp01((heroS - 26) / 12);
  const domVis = bigHero * (1 - prog(f, T1.morph1 - 2, 4));
  const genericA = f < T1.dive0 ? 1 : 1 - prog(f, T1.dive1 - 14, 12);
  const speed = Math.abs(Math.log(camAtU(pullU(f)).dist / camAtU(pullU(f - 1)).dist)) + Math.abs(camAtU(pullU(f)).pitch - camAtU(pullU(f - 1)).pitch) * 0.02;
  const streak = clamp01(speed * 9);
  const showField = f < T1.morph1 + 2;
  // morph to the wheel
  const mT = (k: number) => EASE.inOut(clamp01((f - T1.morph0 - 1.5 * k) / (T1.morph1 - T1.morph0 - 8)));
  const morphing = f >= T1.morph0;
  const rot = wheelRot(f);
  const landLit = clamp01(springAt(f, T1.land + 1, SPRING.pop));
  // the chosen tile leaves the wheel to the right and grows
  const [btx, bty] = sliceTilePos(W_CX, W_CY, W_R, W_R0, wheelRot(T1.lift), K_BEC);
  const lt = prog(f, T1.lift, 18, EASE.out);
  const chosenX = lerp(btx, 1520, lt);
  const chosenY = lerp(bty, W_CY, lt);
  const chosenSize = lerp(56, 76, lt);

  const world = (
    <>
      {showField ? (
        <FieldCanvas
          frame={f}
          cam={cam}
          R={R}
          alpha={genericA}
          heroes={1 - bigHero}
          streak={streak}
          scan={f > T1.R1 ? {z: (((f - T1.R1) * 22) % 1700) - 40, s: clamp01((f - T1.R1) / 12) * (1 - prog(f, T1.dive0, 10))} : undefined}
        />
      ) : null}
      {/* fan of score lines from the next slot down to the candidates */}
      {f >= T1.heroSnap0 - 4 && f < T1.rowExit + 16 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {HERO.map((_, k) => {
            const g = heroGeo(f, k, 1);
            if (!g.tile) return null;
            const a = prog(f, T1.heroSnap0 - 4 + 2 * k, 10, EASE.out) * (1 - qExit);
            const x0 = slotX;
            const y0 = qBottom + 8;
            const x1 = g.tile.x;
            const y1 = g.tile.y - g.tile.size * 0.8;
            return (
              <g key={k} opacity={0.55 * a}>
                <line x1={x0} y1={y0} x2={lerp(x0, x1, a)} y2={lerp(y0, y1, a)} stroke={PAL.info} strokeWidth={2.5} strokeDasharray="10 12" strokeDashoffset={-f * 2.2} />
              </g>
            );
          })}
        </svg>
      ) : null}
      {showField ? <HeroBars frame={f} vis={domVis > 0 && !morphing ? 1 : domVis > 0 ? 1 - prog(f, T1.morph0, 3) : 0} /> : null}
      {/* hero tiles (DOM while large) */}
      {showField && domVis > 0.01 ? (
        <div style={{position: 'absolute', left: 0, top: 0, opacity: domVis}}>
          {HERO.map((h, k) => {
            const g = heroGeo(f, k, 1);
            if (!g.tile) return null;
            let {x, y, size} = g.tile;
            let op = 1;
            if (morphing) {
              const t = mT(k);
              const [tx, ty] = sliceTilePos(W_CX, W_CY, W_R, W_R0, rot, k);
              x = lerp(x, tx, t);
              y = lerp(y, ty, t);
              size = lerp(size, 56, t);
              op = HERO[k].p >= 0.1 ? 1 - prog(f, T1.morph1 - 3, 3) : 1 - t;
            }
            return (
              <div key={k} style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
                <TokenTile frame={f} text={h.w} x={x} y={y} size={size} snapAt={T1.heroSnap0 + 3 * k} from={{dy: -80, rot: -5}} />
              </div>
            );
          })}
        </div>
      ) : null}
      {/* the wheel (morphs out of the hero bars) */}
      {morphing ? (
        <Wheel
          frame={f}
          cx={W_CX}
          cy={W_CY}
          R={W_R}
          r0={W_R0}
          rot={rot}
          rotPrev={wheelRot(f - 1)}
          chosen={{k: K_BEC, lit: landLit}}
          labelMin={0.1}
          labelOpacity={prog(f, T1.morph1 - 3, 3)}
          tileSize={56}
          morph={
            f < T1.morph1 + 1
              ? {
                  t: SLICES.map((_, k) => (k < NH ? mT(k) : mT(NH - 1))),
                  from: SLICES.map((_, k) => {
                    if (k >= NH) return null;
                    const g = heroGeo(f, k, barGrow(f, k));
                    return g.bar ? quadPoly(g.bar) : null;
                  }),
                }
              : undefined
          }
          glow={0.6 * Math.exp(-Math.max(0, f - T1.land) / 8) * (f >= T1.land ? 1 : 0)}
          hideK={f >= T1.lift ? K_BEC : undefined}
        />
      ) : null}
      {/* question row, the Bit and the next slot */}
      {qExit < 1 && lift < 1 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - lift}}>
          <div style={{position: 'absolute', left: 960 - 900, top: floorY - 120, width: 1800, height: 420, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#2A5B9A', 0.42)}, ${rgba('#173360', 0.18)} 55%, rgba(0,0,0,0))`}} />
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateY(${2 * floorY}px) scaleY(-1)`, transformOrigin: '0 0', opacity: 0.2, WebkitMaskImage: `linear-gradient(180deg, rgba(0,0,0,0) ${((floorY - 96) / 1080) * 100}%, rgba(0,0,0,1) ${(floorY / 1080) * 100}%)`}}>
            {QUESTION.map((t, i) => {
              const q = qTile(i);
              if (q.y < c2.y) return null;
              return <TokenTile key={i} frame={f} text={t} x={q.x} y={q.y} size={qSize} w={q.w} snapAt={T1.rowSnap0 + 2 * i} from={{dx: 120, dy: -40, rot: 6}} />;
            })}
          </div>
        </div>
      ) : null}
      {qExit < 1 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateY(${-140 * qExit}px)`, opacity: 1 - qExit}}>
          {QUESTION.map((t, i) => {
            const q = qTile(i);
            return <TokenTile key={i} frame={f} text={t} x={q.x} y={q.y} size={qSize} w={q.w} snapAt={T1.rowSnap0 + 2 * i} from={{dx: 120, dy: -40, rot: 6}} newest={glow(i)} />;
          })}
          <Slot frame={f} x={slotX} y={slotY} w={qSize * 1.3} h={tileH(qSize)} at={T1.slotAt} />
          {f >= T1.bit0 - 2 && f < T1.bit1 + 8 ? (
            <RestBit frame={f} x={lerp(tops[bi][0], tops[bi + 1][0], EASE.inOut(bq - bi))} y={lerp(tops[bi][1], tops[bi + 1][1], EASE.inOut(bq - bi)) - 30 * Math.sin(Math.PI * (bq - bi))} size={22} />
          ) : null}
          {f >= T1.bit1 + 8 ? <RestBit frame={f} x={slotX} y={slotY - tileH(qSize) / 2 - 26} size={22} /> : null}
        </div>
      ) : null}
      {f >= T1.lift ? <TokenTile frame={f} text="Because" x={chosenX} y={chosenY} size={chosenSize} newest={1} /> : null}
    </>
  );

  const hud = (
    <>
      <AtlasOpener frame={f} at={A.p5} word="The model's job" index="03" y={330} />
      <Footnote frame={f} at={T1.heroSnap0 + 24} exitAt={A.openai - 8} text="Odds: illustrative" size={56} y={936} />
      <KineticText frame={f} at={A.openai} exitAt={T1.textOut} text="OpenAI's tokenizer" mode="rise" x={960} y={92} size={72} weight={600} color={PAL.ink} backing="scrim" />
      <FieldCounter frame={f} />
      <KineticText frame={f} at={T1.dashKey} exitAt={A.randomnessEnd + 18} text="A dash of randomness" mode="rise" x={960} y={124} size={84} />
    </>
  );

  return (
    <Stage frame={f} env={{kind: 'void', dust: 40}} hud={hud}>
      {world}
    </Stage>
  );
};
