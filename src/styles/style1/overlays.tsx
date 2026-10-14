/**
 * Pencil and marker on the page: the S07 analogy (a dashed pencil arc with its ≈ chip, from the button
 * across the fold to a pencil sketch of a generic sign-in card drawn OUTSIDE the black screen), and the
 * S11 powered-domain swipe (three chisel marker strokes in markerEnergy, multiplied under the ink, with
 * the 3 px annotation boundary line), plus the two Lens uses (S02 on the "?", S05 on the lookout).
 */
import React from 'react';
import {EASE, LensRing, clamp01, pathLength, polyPath, progress, rectPath, circlePath, useSvgId} from '../../shared';
import {F} from './frames';
import * as L from './layout';
import {Bloom, Marks, S, nibSkin, type Mark} from './nib';
import {ChipsetScene, TH, approxChipMarks, type Xf} from './parts';
import {pageChip, sheetChip} from './machine';

const ANN = TH.annotation;

/** Pencil register: dashed 12/8, 3 px annotation, with a second graphite tone. */
const pencil = (d: string, seed: string): Mark[] => [
  S(d, ANN, 3, {dash: [12, 8], cap: 'butt', seed: `${seed}:a`}),
  S(d, L.PENCIL_LIGHT, 1.2, {dash: [4, 6, 6, 4], dashOffset: 3, clean: true, o: 0.9}),
];

const ARC = 'M1281 597Q1318 482 1398 462';
const ARC_MID: [number, number] = [1328.5, 506];

const SignInSketch = (): Mark[] => {
  const s = L.SIGNIN;
  return [
    ...pencil(rectPath(s.x, s.y, s.w, s.h, 10), 'card'),
    ...pencil(circlePath(s.x + 38, s.y + 41, 17), 'avatar'),
    ...pencil(rectPath(s.x + 70, s.y + 32, 112, 18, 4), 'field'),
  ];
};

export const SignInAnalogy: React.FC<{frame: number}> = ({frame}) => {
  const id = useSvgId('arcmask');
  if (frame < F.arc) return null;
  const out = 1 - progress(frame, F.s07Out, 6, EASE.exit);
  if (out <= 0) return null;
  const draw = progress(frame, F.arc, 12, EASE.arrive);
  const len = pathLength(ARC);
  const chip = progress(frame, F.arc + 6, 4, EASE.arrive);
  const card = progress(frame, F.signCard, 6, EASE.arrive);
  return (
    <g opacity={out}>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <path d={ARC} fill="none" stroke="#fff" strokeWidth={14} strokeDasharray={`${len * draw} ${len + 10}`} />
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <Marks marks={pencil(ARC, 'arc')} seed="arc" frame={frame} />
      </g>
      {chip > 0 ? <Marks marks={approxChipMarks(ARC_MID[0], ARC_MID[1], 1)} seed="arcchip" frame={frame} opacity={chip} /> : null}
      {card > 0 ? <Bloom marks={SignInSketch()} p={card} seed="signin" frame={frame} /> : null}
    </g>
  );
};

/** S11: "just enough of the motherboard": the standby domain only, the "?" stays outside. */
export const DomainSwipe: React.FC<{frame: number}> = ({frame}) => {
  const clipId = useSvgId('swipeclip');
  if (frame < F.swipe) return null;
  const region = polyPath(L.SWIPE_REGION, true);
  const strokes = [
    {d: 'M997 516L997 884', w: 58, at: F.swipe},
    {d: 'M1026 842L888 842', w: 78, at: F.swipe + 2},
    {d: 'M1026 812L900 812', w: 30, at: F.swipe + 4},
  ];
  const edge = progress(frame, F.swipe + 4, 6, EASE.arrive);
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={region} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} style={{mixBlendMode: 'multiply'}}>
        {strokes.map((s, i) => {
          const p = progress(frame, s.at, 4, EASE.outCubic);
          if (p <= 0) return null;
          const len = pathLength(s.d);
          return (
            <path key={i} d={s.d} fill="none" stroke={TH.markerEnergy} strokeWidth={s.w} strokeLinecap="butt" strokeDasharray={`${len * p} ${len + 10}`} />
          );
        })}
      </g>
      {edge > 0 ? <Bloom marks={[S(region, ANN, 3, {seed: 'swipe:edge', join: 'round'})]} p={edge} seed="swipeedge" frame={frame} /> : null}
    </g>
  );
};

const lensXf = (at: readonly [number, number]): Xf => ({k: L.LENS.k, ax: at[0], ay: at[1], cx: L.LENS.cx, cy: L.LENS.cy, sw: 1.5});

/** The inked Lens, twice: S02 magnifies the "?" ×4 (on the sheet); S05 the lookout ×4, then the D24 hand-over. */
export const Lenses: React.FC<{frame: number}> = ({frame}) => (
  <g>
    {frame >= F.lens1Open && frame < F.lens1Close + 6 ? (
      <LensRing
        cx={L.LENS.cx}
        cy={L.LENS.cy}
        d={L.LENS.d}
        openAt={F.lens1Open}
        closeAt={F.lens1Close}
        mode="magnify"
        chip="×4"
        target={L.Q_TARGET}
        interior="#FFFFFF"
        skin={nibSkin}
        theme={TH}
        seed="lens1"
      >
        <ChipsetScene st={sheetChip(frame)} xf={lensXf(L.Q_CENTRE)} seed="lens1" stubs />
      </LensRing>
    ) : null}
    {frame >= F.lens2Open && frame < F.lens2Close + 6 ? (
      <LensRing
        cx={L.LENS.cx}
        cy={L.LENS.cy}
        d={L.LENS.d}
        openAt={F.lens2Open}
        settleAt={F.settle}
        closeAt={F.lens2Close}
        mode="magnify"
        chip="×4"
        target={L.LOOK_CENTRE}
        interior="#FFFFFF"
        skin={nibSkin}
        theme={TH}
        seed="lens2"
      >
        <ChipsetScene st={pageChip(frame, true)} xf={lensXf(L.LOOK_CENTRE)} seed="lens2" stubs />
      </LensRing>
    ) : null}
  </g>
);

export {clamp01};
