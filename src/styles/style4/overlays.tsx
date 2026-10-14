/**
 * Signal Score: small devices drawn on the score (stops, fork, sign-in card and arc, the wake join),
 * the analogy eye, the bracket lock-on, the S06 chain Bit, and the Time Lens.
 */
import React from 'react';
import {AnalogyFrame, ApproxChip, Bit, Brackets, EyeBadge, LandingRipple, LensRing, lensState, type LensState} from '../../shared/components';
import {circlePath, rectPath, squarePath} from '../../shared/geom';
import {EASE, progress} from '../../shared/motion';
import {MONO, SANS} from '../../shared/fonts';
import {LENS, mixColor} from '../../shared/brand';
import {GROUND, LENS4, MAP, MARK, SEAT, T, Y} from './layout';
import {F} from './timeline';
import {CHAIN_RUNS, LitBehind, Markers, S04_RUN, ScoreLayer, fadeIn, fadeOut} from './score';
import {pressX} from './timemap';

/* ------------------------------------------------------------------------------------------------
 * S09 stops: small unlit outlines beside the rows they change (no pips: unvisited, not "off")
 * ---------------------------------------------------------------------------------------------- */

const drawOn = (f: number, at: number, n = 8) => progress(f, at, n, EASE.arrive);

const AmdStop: React.FC<{f: number}> = ({f}) => {
  const d = drawOn(f, F.amdDraw);
  const o = d * fadeOut(f, F.stopsOut, 6);
  if (o <= 0) return null;
  const x = 728;
  const y = 344;
  return (
    <g opacity={o}>
      {/* one processor package holding both small blocks (no chipset beside it) */}
      <path d={rectPath(x, y, 132, 92, 10)} fill={GROUND} stroke={T.structure} strokeWidth={3} />
      <path d={rectPath(x + 18, y + 48, 26, 26, 4)} fill="none" stroke={T.structure} strokeWidth={3} />
      <path d={rectPath(x + 62, y + 18, 50, 28, 5)} fill="none" stroke={T.structure} strokeWidth={3} />
    </g>
  );
};

const LaptopStop: React.FC<{f: number}> = ({f}) => {
  const d = drawOn(f, F.laptopDraw);
  const o = d * fadeOut(f, F.stopsOut, 6);
  if (o <= 0) return null;
  const x = 728;
  const y = 588;
  return (
    <g opacity={o}>
      {/* a slim laptop board: the EC as its own small chip, and a battery; no ATX supply */}
      <path d={rectPath(x, y, 132, 56, 8)} fill={GROUND} stroke={T.structure} strokeWidth={3} />
      <path d={rectPath(x + 14, y + 17, 22, 22, 4)} fill="none" stroke={T.structure} strokeWidth={3} />
      <path d={rectPath(x + 58, y + 15, 52, 26, 4)} fill="none" stroke={T.structure} strokeWidth={3} />
      <path d={`M${x + 110} ${y + 23}h6v10h-6`} fill="none" stroke={T.structure} strokeWidth={3} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * S07: the dashed analogy arc from the ghost press to a generic sign-in card after the V
 * ---------------------------------------------------------------------------------------------- */

const CARD = {x: 1520, y: 214, w: 256, h: 74};

const SignIn: React.FC<{f: number}> = ({f}) => {
  if (f < F.arc || f > F.s07Out + 8) return null;
  const P = pressX(f);
  const out = fadeOut(f, F.s07Out, 6);
  const x0 = P + MARK.pulseW / 2;
  const y0 = Y.L1 - MARK.pulseH - 6;
  const x1 = CARD.x - 4;
  const y1 = CARD.y + CARD.h / 2;
  const d = `M${x0} ${y0}C${x0 + 60} ${200} ${x1 - 260} ${198} ${x1} ${y1}`;
  const draw = progress(f, F.arc, 12, EASE.arrive);
  const content = fadeIn(f, F.card + 4, 6);
  return (
    <g opacity={out}>
      <clipPath id="s4-arc-reveal">
        <rect x={x0 - 12} y={150} width={(x1 - x0 + 24) * draw} height={160} />
      </clipPath>
      <path d={d} fill="none" stroke={T.annotation} strokeWidth={3} strokeDasharray="12 8" clipPath="url(#s4-arc-reveal)" />
      {draw >= 0.6 ? <ApproxChip x={(x0 + x1) / 2 + 20} y={204} opacity={progress(f, F.arc + 7, 4)} fill={GROUND} /> : null}
      <AnalogyFrame x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} inAt={F.card} chip={false} />
      <g opacity={content}>
        <circle cx={CARD.x + 40} cy={CARD.y + CARD.h / 2} r={17} fill="none" stroke={T.annotation} strokeWidth={3} />
        <path d={rectPath(CARD.x + 76, CARD.y + CARD.h / 2 - 8, 148, 16, 6)} fill="none" stroke={T.annotation} strokeWidth={2.5} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * S08: a fork in "later" on the top lane: Restart / Shut down, with a plain ink "?" at the split
 * ---------------------------------------------------------------------------------------------- */

const FORK = {x0: 1250, split: 1320, y: 258, chipX: 1360};

const Chip: React.FC<{x: number; cy: number; text: string; w: number; o: number}> = ({x, cy, text, w, o}) =>
  o <= 0 ? null : (
    <g opacity={o}>
      <path d={rectPath(x, cy - 27, w, 54, 8)} fill={GROUND} stroke={T.ink} strokeWidth={3} />
      <text x={x + w / 2} y={cy + 1} textAnchor="middle" dominantBaseline="central" style={{fontFamily: SANS, fontWeight: 600, fontSize: 40}} fill={T.ink}>
        {text}
      </text>
    </g>
  );

const Fork: React.FC<{f: number}> = ({f}) => {
  if (f < F.forkStem || f > F.forkOut + 8) return null;
  const out = fadeOut(f, F.forkOut, 6);
  const stem = progress(f, F.forkStem, 6, EASE.arrive);
  const up = progress(f, F.restart - 6, 6, EASE.arrive);
  const low = progress(f, F.shutDown - 6, 6, EASE.arrive);
  const {x0, split, y, chipX} = FORK;
  const railY = 156;
  const upD = `M${split} ${y}V${railY + 22}L${split + 22} ${railY}H${chipX}`;
  const upL = y - railY - 22 + 31 + (chipX - split - 22);
  const lowD = `M${split} ${y}H${chipX}`;
  const q = progress(f, F.whyDifferent, 5, EASE.arrive);
  return (
    <g opacity={out}>
      <path d={`M${x0} ${y}H${x0 + (split - x0) * stem}`} stroke={T.ink} strokeWidth={3} />
      {up > 0 ? <path d={upD} fill="none" stroke={T.ink} strokeWidth={3} strokeDasharray={`${upL * up} ${upL + 10}`} strokeLinejoin="round" /> : null}
      {low > 0 ? <path d={lowD} fill="none" stroke={T.ink} strokeWidth={3} strokeDasharray={`${(chipX - split) * low} 999`} /> : null}
      <Chip x={chipX} cy={railY} text="Restart" w={182} o={progress(f, F.restart, 4, EASE.arrive)} />
      <Chip x={chipX} cy={y} text="Shut down" w={252} o={progress(f, F.shutDown, 4, EASE.arrive)} />
      {q > 0 ? (
        <text x={1341} y={220} textAnchor="middle" dominantBaseline="central" style={{fontFamily: SANS, fontWeight: 700, fontSize: 44}} fill={T.ink} opacity={q}>
          ?
        </text>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * S11: the wake join: a network jack and a clock either side of the PRESS flag, branching into the
 * same instant (possible causes, one listener). Dim and unlabelled: they depend on settings.
 * ---------------------------------------------------------------------------------------------- */

const Join: React.FC<{f: number}> = ({f}) => {
  if (f < F.notice) return null;
  const P = MAP.M3.press;
  const o = fadeIn(f, F.notice, 6) * fadeOut(f, F.lockOut, 6);
  if (o <= 0) return null;
  const br = progress(f, F.notice + 2, 6, EASE.arrive);
  const jx = P - 62;
  const cx = P + 62;
  const gy = Y.flag;
  const jack = `${rectPath(jx - 14, gy - 14, 28, 28, 3)}M${jx - 7} ${gy + 14}V${gy + 7}H${jx + 7}V${gy + 14}M${jx - 6} ${gy - 8}V${gy - 2}M${jx - 2} ${gy - 8}V${gy - 2}M${jx + 2} ${gy - 8}V${gy - 2}M${jx + 6} ${gy - 8}V${gy - 2}`;
  const clock = `M${cx + 14} ${gy}A14 14 0 1 1 ${cx - 14} ${gy}A14 14 0 1 1 ${cx + 14} ${gy}M${cx} ${gy - 8}V${gy}L${cx + 6} ${gy + 4}`;
  const L = 50;
  return (
    <g opacity={o}>
      <path d={jack} fill="none" stroke={T.structure} strokeWidth={3} />
      <path d={clock} fill="none" stroke={T.structure} strokeWidth={3} strokeLinecap="round" />
      <path d={`M${jx + 14} ${gy + 10}L${P - 4} ${Y.rail - 2}`} stroke={T.structure} strokeWidth={3} strokeDasharray={`${L * br} ${L}`} />
      <path d={`M${cx - 14} ${gy + 10}L${P + 4} ${Y.rail - 2}`} stroke={T.structure} strokeWidth={3} strokeDasharray={`${L * br} ${L}`} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * The score overlays (under the labels)
 * ---------------------------------------------------------------------------------------------- */

export const OverlaysLayer: React.FC<{f: number}> = ({f}) => (
  <g>
    <AmdStop f={f} />
    <LaptopStop f={f} />
    <SignIn f={f} />
    <Fork f={f} />
    <Join f={f} />
    {/* S06: the chain Bit, parked on the lookout's station at "starts", then five hops; parks on Windows */}
    {f >= F.chainBitIn && f < F.lookAheadOut + 8 ? (
      <g opacity={fadeIn(f, F.chainBitIn, 5) * fadeOut(f, F.lookAheadOut, 6)}>
        <Bit runs={CHAIN_RUNS} park restFrom={F.chainBitIn} />
      </g>
    ) : null}
    {/* S05: the lookout as an analogy: a dashed eye with the ≈ chip, beside the real block */}
    {/* (12 px left of the lookout's edge and 4 px lower: the ≈ chip clears the chipset package's corner) */}
    <EyeBadge x={SEAT.lookout.x - 12} y={SEAT.lookout.y + SEAT.lookout.h + 44} width={48} variant="analogy" inAt={F.eyeIn} outAt={F.lookAheadOut} />
    {/* S11: the lock-on, on "like" */}
    <Brackets box={{x: SEAT.button.cx - SEAT.button.r, y: SEAT.button.cy - SEAT.button.r, w: SEAT.button.r * 2, h: SEAT.button.r * 2}} lockAt={F.lock} fadeAt={F.lockOut} />
  </g>
);

/* ------------------------------------------------------------------------------------------------
 * The Time Lens (S04-S05): the brand ring in its time mode. Inside, the same lanes at the same y,
 * with the press instant stretched open (the pulse widens 16 -> 60 px as the Lens opens).
 * D24: ring + ticks fade to a grey rim in the pause after "lookout," (f663-f669); the "?" fills at f671.
 * ---------------------------------------------------------------------------------------------- */

/** The ring alone (the kit's clockwise draw, colour, width, settle and close; no ticks). */
const LensRim: React.FC<{s: LensState}> = ({s}) => {
  const C = 2 * Math.PI * s.r;
  return (
    <g opacity={s.opacity}>
      <path
        d={circlePath(s.cx, s.cy, s.r)}
        fill="none"
        stroke={s.ringColor}
        strokeWidth={s.ringWidth}
        strokeOpacity={s.ringOpacity}
        strokeDasharray={s.draw < 1 ? `${C * s.draw} ${C + 10}` : undefined}
      />
    </g>
  );
};

/** The brand's four inward ticks (12, 3, 6, 9 o'clock; 14 x 4 px), drawn inside the clipped view. */
const LensTicks: React.FC<{s: LensState}> = ({s}) =>
  s.visible && s.ticks > 0 ? (
    <g>
      {[0, 90, 180, 270].map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const len = LENS.tickLength * s.ticks;
        return (
          <path
            key={deg}
            d={`M${s.cx + Math.cos(a) * s.r} ${s.cy + Math.sin(a) * s.r}L${s.cx + Math.cos(a) * (s.r - len)} ${s.cy + Math.sin(a) * (s.r - len)}`}
            stroke={s.ringColor}
            strokeWidth={LENS.tickWidth}
            strokeOpacity={s.ticks * s.ringOpacity}
          />
        );
      })}
    </g>
  ) : null;

export const TimeLens: React.FC<{f: number}> = ({f}) => {
  if (f < F.lensOpen || f > F.lensClose + 8) return null;
  const w = MARK.pulseW + (MARK.pulseLensW - MARK.pulseW) * progress(f, F.lensOpen + 3, 9, EASE.inOutCubic);
  // the Lens is ALWAYS captioned "Not to scale" while its stretched view is open: the chip stays through the
  // D24 grey-rim phase (its text steps down to muted with the rim) and leaves only with the Lens
  const chipO = progress(f, F.lensOpen + 6, 3) * (1 - progress(f, F.lensClose, 4));
  const chipSettle = progress(f, F.lensSettle, 6);
  const chipText = 'Not to scale';
  const chipW = chipText.length * 18 + 22;
  // outside the ring at 1:30, lifted above the top lane's track (4:30 would sit on the lookout's track)
  const ax = LENS4.cx + (LENS4.d / 2) * Math.SQRT1_2 + 14;
  const ay = 250;
  // The S04 landing point (the lookout's track) sits at the ring's 6 o'clock, so the brand's four ticks are
  // drawn INSIDE the clipped view, under the Bit (the kit draws them over it), and the landing ripple is drawn
  // above the ring, unclipped, so the f498 landing reads whole. Ring, tick positions, sizes and timing are the kit's.
  const lensProps = {cx: LENS4.cx, cy: LENS4.cy, d: LENS4.d, openAt: F.lensOpen, settleAt: F.lensSettle, closeAt: F.lensClose, mode: 'time' as const, interior: T.panel};
  const ls = lensState(f, lensProps, T.emphasis, T.structure);
  return (
    <g>
      <LensRing {...lensProps} renderRing={(s) => <LensRim s={s} />}>
        <ScoreLayer f={f} pulseW={w} lens />
        <Markers f={f} />
        <LensTicks s={ls} />
        <LitBehind f={f} runs={[S04_RUN]} />
        {f >= F.s04Depart && f < F.s04Land + 12 ? <Bit runs={S04_RUN} ripple={false} /> : null}
      </LensRing>
      {ls.visible ? <LandingRipple x={S04_RUN.end[0]} y={S04_RUN.end[1]} at={F.s04Land} /> : null}
      {chipO > 0 ? (
        <g opacity={chipO}>
          <path d={rectPath(ax, ay - 42, chipW, 42, 8)} fill={T.panel} stroke={T.structure} strokeWidth={2} />
          <text x={ax + chipW / 2} y={ay - 21} textAnchor="middle" dominantBaseline="central" style={{fontFamily: MONO, fontWeight: 500, fontSize: 30}} fill={mixColor(T.ink, T.textMuted, chipSettle)}>
            {chipText}
          </text>
        </g>
      ) : null}
      {f < 0 ? <path d={squarePath(0, 0, 1)} /> : null}
    </g>
  );
};
