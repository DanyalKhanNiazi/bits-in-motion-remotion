/**
 * S09–S10a (page P6). One typical desktop seen two ways, aligned like an orthographic drawing:
 *   F  outside: the tower's front (front elevation, light plate; spot-black front panel)
 *   M  inside: the same tower in side elevation (rear on the left): the board you know, the separate power supply in
 *      the basement with its IEC inlet and cord at the rear, the standby and (empty) main channels. M's camera pulls
 *      back right after the cut (the cut's focal motion) to the whole tower.
 * Two unvisited stops, AMD and laptops, in the right column: frame only, no plate, plain structure line art, no
 * state pips, each with its real difference. They hold through S10a and fold in the f1505–f1512 pause.
 */
import React from 'react';
import {StateGlyph, type Pt} from '../../shared';
import {D, TONE, W, lerpView, vp, vpts, vrect, circ, poly, type Box, type View} from './look';
import {Caption, Fil, PanelClip, Plate, Rules, Stk} from './panel';
import {BoardArt} from './hw';
import {Channel5} from './devices';
import {Tag5} from './labels';
import * as G from './geo';
import {F} from './T';
import {EASE, progress, mixColor, SENTENCES} from '../../shared';

export const PF: Box = {x: 96, y: 212, w: 424, h: 814};
export const PM: Box = {x: 544, y: 212, w: 696, h: 814};
export const PA: Box = {x: 1264, y: 212, w: 560, h: 398};
export const PL: Box = {x: 1264, y: 634, w: 560, h: 392};

/* tower model (2 px/mm; the board at its B position) */
const CASE: Box = {x: 484, y: 168, w: 896, h: 1064};
const INNER: Box = {x: 496, y: 180, w: 872, h: 1040};
const PSU_M: Box = {x: 502, y: 1042, w: 300, h: 168};
const CAGE: Box = {x: 1190, y: 1030, w: 168, h: 180};
const STBY_M: Pt[] = [
  [802, 1088],
  [1060, 1088],
  [1060, 450],
  [993, 450],
  [993, 699],
  [919, 699],
];
const MAIN_M: Pt[] = [
  [802, 1150],
  [1096, 1150],
  [1096, 410],
  [1030, 410],
];
const INLET_M: Box = {x: 470, y: 1060, w: 36, h: 44};

/** final framing (×0.68 of 2 px/mm), and the closer opening framing it pulls back from (cord above y 940 in both) */
const V1: View = {s: 0.68, tx: 258, ty: 175.76};
const V0: View = {s: 0.78, tx: 177.2, ty: 100};
export const towerView = (frame: number): View => lerpView(V0, V1, progress(frame, F.cutTower + 3, 16, EASE.move));

const CASE_SHELL = mixColor(D.board, D.structure, 0.22);
const TRAY = mixColor(D.panel, D.board, 0.55);

const TowerSide: React.FC<{v: View}> = ({v}) => {
  const R = (b: Box, r = 0) => vrect(v, b.x, b.y, b.w, b.h, r);
  return (
    <g>
      {/* case shell and its open side (the motherboard tray) */}
      <Fil d={vrect(v, CASE.x + 10, CASE.y + 10, CASE.w, CASE.h, 18)} c={TONE.shadow} />
      <Fil d={R(CASE, 18)} c={CASE_SHELL} />
      <Stk d={R(CASE, 18)} c={D.structure} w={W.inactive} />
      <Fil d={R(INNER, 10)} c={TRAY} />
      <Stk d={R(INNER, 10)} c={D.structure} w={W.detail} />
      {/* rear wall: I/O opening and expansion-slot covers; front edge; feet */}
      <Stk d={vrect(v, 498, 246, 20, 274, 3)} c={D.structure} w={W.detail} />
      {Array.from({length: 7}, (_, i) => 590 + i * 32).map((y) => (
        <Stk key={y} d={vrect(v, 500, y, 22, 22, 2)} c={D.structure} w={W.detail} />
      ))}
      <Fil d={vrect(v, 540, 1232, 80, 16, 4)} c={CASE_SHELL} />
      <Fil d={vrect(v, 1244, 1232, 80, 16, 4)} c={CASE_SHELL} />
      {/* drive cage at the front bottom */}
      <Stk d={R(CAGE, 6)} c={D.structure} w={W.detail} />
      {[0, 1, 2].map((i) => (
        <Stk key={i} d={vrect(v, CAGE.x + 12, CAGE.y + 12 + i * 56, CAGE.w - 24, 44, 4)} c={D.structure} w={W.detail} />
      ))}
      {/* the board you know */}
      <BoardArt v={v} q={0} />
      {/* the power supply in the basement: mains end at the rear (left) */}
      <Fil d={vrect(v, PSU_M.x + 6, PSU_M.y + 6, PSU_M.w, PSU_M.h, 10)} c={TONE.shadow} />
      <Fil d={R(PSU_M, 10)} c={TONE.body} />
      <Stk d={R(PSU_M, 10)} c={D.structure} w={W.inactive} />
      <Stk d={vrect(v, PSU_M.x + 100, PSU_M.y + 24, 150, PSU_M.h - 48, 6)} c={D.structure} w={W.detail} />
      {[0, 1, 2, 3].map((i) => (
        <Stk key={i} d={poly([vp(v, [PSU_M.x + 36 + i * 12, PSU_M.y + 78]), vp(v, [PSU_M.x + 36 + i * 12, PSU_M.y + PSU_M.h - 24])])} c={D.structure} w={W.detail} />
      ))}
      {/* IEC inlet with the plug in it, cord out through the rear */}
      <Fil d={R(INLET_M, 6)} c={TONE.recess} />
      <Stk d={R(INLET_M, 6)} c={D.structure} w={W.inactive} />
      <Stk d={poly([vp(v, [INLET_M.x, INLET_M.y + INLET_M.h / 2]), vp(v, [-300, INLET_M.y + INLET_M.h / 2])])} c={D.structure} w={7} cap="butt" />
    </g>
  );
};

/** The same tower from the front (outside): spot-black front panel; same case as the system page's O. */
const TowerFront: React.FC = () => {
  const x0 = 165;
  const w = 286;
  const y0 = 290;
  const h = 724;
  const cx = x0 + w / 2;
  return (
    <g>
      <Fil d={vrect(ID0, x0, y0, w, h, 12)} c={TONE.spot} />
      <Fil d={vrect(ID0, x0 + 26, y0 + h, 54, 12, 3)} c={TONE.spot} />
      <Fil d={vrect(ID0, x0 + w - 80, y0 + h, 54, 12, 3)} c={TONE.spot} />
      <Stk d={poly([[x0 + 10, y0 + 12], [x0 + w - 10, y0 + 12]])} c={D.structure} w={W.detail} o={0.8} />
      {/* front I/O: button (cap), LED (off), two USB-A, two jacks */}
      <Stk d={circ(cx - 34, y0 + 46, 13)} c={D.structure} w={W.inactive} />
      <Fil d={circ(cx - 34, y0 + 46, 8)} c={'#262E3E'} />
      <Stk d={circ(cx - 34, y0 + 46, 8)} c={D.structure} w={W.detail} />
      <Stk d={circ(cx - 62, y0 + 46, 3.5)} c={D.structure} w={W.detail} />
      {[36, 56].map((dy) => (
        <Stk key={dy} d={vrect(ID0, cx + 4, y0 + dy, 22, 8, 2)} c={D.structure} w={W.detail} />
      ))}
      {[40, 60].map((dy) => (
        <Stk key={dy} d={circ(cx + 42, y0 + dy, 4)} c={D.structure} w={W.detail} />
      ))}
      {/* two bay covers, then the intake */}
      {[104, 146].map((dy) => (
        <Stk key={dy} d={vrect(ID0, x0 + 22, y0 + dy, w - 44, 32, 4)} c={D.structure} w={W.detail} />
      ))}
      {Array.from({length: 22}, (_, i) => y0 + 220 + i * 20).map((y) => (
        <Stk key={y} d={poly([[x0 + 28, y], [x0 + w - 28, y]])} c={D.structure} w={W.detail} o={0.7} />
      ))}
    </g>
  );
};
const ID0: View = {s: 1, tx: 0, ty: 0};

/** AMD stop: one processor package holding both blocks (the lookout's and the "?"'s shapes), no chipset. */
const AmdArt: React.FC<{box: Box}> = ({box}) => {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2 + 30;
  const s = 220;
  const x0 = cx - s / 2;
  const y0 = cy - s / 2;
  return (
    <g>
      <Stk d={vrect(ID0, x0, y0, s, s, 12)} c={D.structure} w={W.inactive} />
      <Stk d={vrect(ID0, x0 + 26, y0 + 26, 70, 46, 4)} c={D.structure} w={W.detail} />
      <Stk d={vrect(ID0, x0 + 124, y0 + 26, 70, 46, 4)} c={D.structure} w={W.detail} />
      <Stk d={vrect(ID0, x0 + 40, y0 + 100, 140, 92, 6)} c={D.structure} w={W.detail} />
      <Stk d={vrect(ID0, x0 + 58, y0 + 120, 52, 36, 3)} c={D.structure} w={W.inactive} />
      <Stk d={vrect(ID0, x0 + 124, y0 + 140, 36, 32, 9)} c={D.structure} w={W.inactive} />
    </g>
  );
};

/** Laptop stop: a laptop board with a processor package, a separate EC chip and a battery; no PSU, no rocker. */
const LaptopArt: React.FC<{box: Box}> = ({box}) => {
  const x0 = box.x + 40;
  const y0 = box.y + 104;
  const d =
    `M${x0} ${y0 + 10}Q${x0} ${y0} ${x0 + 10} ${y0}H${x0 + 300}V${y0 + 70}H${x0 + 360}V${y0}H${x0 + 470}Q${x0 + 480} ${y0} ${x0 + 480} ${y0 + 10}` +
    `V${y0 + 120}Q${x0 + 480} ${y0 + 130} ${x0 + 470} ${y0 + 130}H${x0 + 10}Q${x0} ${y0 + 130} ${x0} ${y0 + 120}Z`;
  return (
    <g>
      <Stk d={d} c={D.structure} w={W.inactive} />
      <Stk d={vrect(ID0, x0 + 60, y0 + 26, 84, 78, 6)} c={D.structure} w={W.inactive} />
      <Stk d={vrect(ID0, x0 + 76, y0 + 42, 52, 46, 4)} c={D.structure} w={W.detail} />
      <Stk d={vrect(ID0, x0 + 386, y0 + 30, 58, 58, 6)} c={D.structure} w={W.inactive} />
      <Stk d={vrect(ID0, x0 + 400, y0 + 44, 30, 28, 8)} c={D.structure} w={W.detail} />
      <Stk d={vrect(ID0, x0 + 20, y0 + 150, 440, 92, 10)} c={D.structure} w={W.inactive} />
      {[0, 1, 2].map((i) => (
        <Stk key={i} d={vrect(ID0, x0 + 36 + i * 142, y0 + 164, 124, 64, 6)} c={D.structure} w={W.detail} />
      ))}
    </g>
  );
};

export const TowerPage: React.FC<{frame: number}> = ({frame}) => {
  const v = towerView(frame);
  const contentIn = 1; // a T1 cut lands whole; the focal motion (the pull-back) starts within 3 frames
  // one active panel: M at the cut, the outside view on "a typical Windows desktop", M on "with an Intel
  // processor", then each stop on its word, then M again on "That lookout"
  const sw: Array<[number, string]> = [
    [F.cutTower, 'M'],
    [F.pullBack, 'F'],
    [F.intel - 17, 'M'],
    [F.amd, 'A'],
    [F.laptops, 'L'],
    [F.thatLookout, 'M'],
  ];
  const act = (id: string): number => {
    let cur = 0;
    for (let i = 0; i < sw.length; i++) if (sw[i][0] <= frame) cur = i;
    const t = cur === 0 ? 1 : progress(frame, sw[cur][0], 6, EASE.arrive);
    if (sw[cur][1] === id) return t;
    if (cur > 0 && sw[cur - 1][1] === id) return 1 - t;
    return 0;
  };
  const aOpen = progress(frame, F.amdFrame, 8, EASE.arrive);
  const lOpen = progress(frame, F.laptopFrame, 8, EASE.arrive);
  const aIn = progress(frame, F.amdFrame + 4, 6, EASE.arrive);
  const lIn = progress(frame, F.laptopFrame + 4, 6, EASE.arrive);
  const fold = progress(frame, F.stopsOut, 6, EASE.exit);
  const fa: Box = {...PA, x: PA.x + PA.w * fold, w: PA.w * (1 - fold)};
  const fl: Box = {...PL, x: PL.x + PL.w * fold, w: PL.w * (1 - fold)};
  const lk = vp(v, [G.LOOK.x + G.LOOK.w, G.LOOK.y]);
  const qb = vp(v, [G.QBLOCK.x + G.QBLOCK.w, G.QBLOCK.y]);
  const cpu = vp(v, [G.CPU.x + G.CPU.w, G.CPU.y]);
  const badge = vp(v, G.QBADGE_1);
  const anchor = vp(V1, [1018, 1088]);
  const plateF = mixColor(TONE.plateOut, TONE.plateOutHeld, 1 - act('F'));
  return (
    <g>
      {/* F: outside, the front */}
      <Plate box={PF} polarity="out" color={plateF} />
      <PanelClip box={PF} opacity={contentIn}>
        <TowerFront />
      </PanelClip>
      <Rules box={PF} plate={plateF} polarity="out" active={act('F')} double={0} />

      {/* M: inside, the side */}
      <Plate box={PM} polarity="in" />
      <PanelClip box={PM} opacity={contentIn}>
        <TowerSide v={v} />
        <Channel5 pts={vpts(v, MAIN_M)} kind="main" s={v.s} front={0} frame={frame} />
        <Channel5 pts={vpts(v, STBY_M)} kind="standby" s={v.s} front={1} frame={frame} />
      </PanelClip>
      <Rules box={PM} plate={TONE.plateIn} polarity="in" active={act('M')} double={0} />
      <g opacity={contentIn}>
        <StateGlyph x={cpu[0]} y={cpu[1]} state="OFF" />
        <StateGlyph x={lk[0]} y={lk[1]} state="ALWAYS_ON" />
        <StateGlyph x={qb[0]} y={qb[1]} state="OFF" />
        <StateGlyph x={badge[0]} y={badge[1]} dock="center" state="UNNAMED" />
      </g>
      <Caption box={PM} text="Intel desktop" polarity="in" t={progress(frame, F.intel, 5, EASE.arrive)} />
      <Tag5
        frame={frame}
        anchor={anchor}
        elbow={[anchor[0], 795]}
        end={[anchor[0] - 14, 795]}
        side="left"
        text="Standby power"
        secondary="+5VSB · ATX"
        role="standby"
        land={F.standby}
        ground="dark"
        plate={TRAY}
        sentenceEnd={SENTENCES.S10.end}
      />

      {/* the stops: frame only, no plate */}
      {aOpen > 0 && fold < 1 ? (
        <>
          <g opacity={aIn * (1 - fold)}>
            <PanelClip box={fa}>
              <AmdArt box={PA} />
            </PanelClip>
          </g>
          <Rules box={fa} polarity="in" active={act('A') * (1 - fold)} double={0} open={aOpen} frameOnly />
          <Caption box={PA} text="Stop: AMD" polarity="in" t={progress(frame, F.amd, 5, EASE.arrive)} out={fold} />
        </>
      ) : null}
      {lOpen > 0 && fold < 1 ? (
        <>
          <g opacity={lIn * (1 - fold)}>
            <PanelClip box={fl}>
              <LaptopArt box={PL} />
            </PanelClip>
          </g>
          <Rules box={fl} polarity="in" active={act('L') * (1 - fold)} double={0} open={lOpen} frameOnly />
          <Caption box={PL} text="Stop: laptops" polarity="in" t={progress(frame, F.laptops, 5, EASE.arrive)} out={fold} />
        </>
      ) : null}
    </g>
  );
};
