/**
 * S10b–c (page P7): the real standby path as a dedicated 1:1 row, in the style's own grammar: an OUTSIDE view of
 * the power supply's rear (plug in the inlet, rocker at "I": what you see and touch) beside the INSIDE schematic
 * (power supply → empty main channel to a 24-pin stub; thin standby channel through a regulator to the lookout),
 * joined across a port gutter by the mains energy. On "whenever" two identical live copies slide out above and
 * below; "If unplugged" pulls its plug, "If rear switch OFF" flips its rocker; each drains and its lookout goes dark.
 * The real row stays exactly where it is, in the middle (ruled acceptable in Stage A §5.7).
 */
import React from 'react';
import {StatePill, StateGlyph, type Pt} from '../../shared';
import {D, L, TONE, W, circ, poly, vrect, ID, type Box} from './look';
import {Caption, DiagramChip, Fil, PanelClip, Plate, Rules, Stk} from './panel';
import {Channel5} from './devices';
import {Tag5} from './labels';
import {F} from './T';
import {EASE, progress, lerp} from '../../shared';

const H = 290;
export const ROW_Y = {A: 96, B: 410, C: 724} as const;
const OUT_X0 = 96;
const OUT_X1 = 656;
const IN_X0 = 728;
const IN_X1 = 1824;

const outBox = (y0: number): Box => ({x: OUT_X0, y: y0, w: OUT_X1 - OUT_X0, h: H});
const inBox = (y0: number): Box => ({x: IN_X0, y: y0, w: IN_X1 - IN_X0, h: H});

const R = (x: number, y: number, w: number, h: number, r = 0) => vrect(ID, x, y, w, h, r);

interface RowState {
  plug: number; // 0 in, 1 pulled out
  rocker: number; // 0 "I", 1 "O"
  ac: number; // drain 0..1
  stby: number; // drain 0..1
  lookOffAt: number | null;
  shimmer: number;
}

/** The power supply's rear, front elevation (spot black = dark ground). */
const RearArt: React.FC<{y0: number; st: RowState; frame: number}> = ({y0, st}) => {
  const ox = 120;
  const dx = -70 * st.plug;
  const dy = 62 * st.plug;
  const px = 350 + ox + dx;
  const py = y0 + 120 + dy;
  const cord = `M${px} ${py + 30}C${px} ${py + 80} ${px - 60} ${y0 + 252} ${60} ${y0 + 266}`;
  const on = st.rocker < 0.5;
  const rk = {x: 412 + ox, y: y0 + 148, w: 40, h: 62};
  const half = (top: boolean) => (top ? R(rk.x, rk.y, rk.w, rk.h / 2, 6) : R(rk.x, rk.y + rk.h / 2, rk.w, rk.h / 2, 6));
  return (
    <g>
      {/* the rear face */}
      <Fil d={R(290 + ox, y0 + 84, 300, 220, 10)} c={TONE.spot} />
      <Stk d={circ(526 + ox, y0 + 232, 62)} c={D.structure} w={W.detail} />
      <Stk d={circ(526 + ox, y0 + 232, 44)} c={D.structure} w={W.detail} />
      <Stk d={circ(526 + ox, y0 + 232, 26)} c={D.structure} w={W.detail} />
      <Stk d={circ(306 + ox, y0 + 100, 4)} c={D.structure} w={W.detail} />
      <Stk d={circ(306 + ox, y0 + 268, 4)} c={D.structure} w={W.detail} />
      {/* the inlet (IEC C14) with its three pins: visible once the plug is out */}
      <Fil d={R(322 + ox, y0 + 96, 56, 48, 8)} c={TONE.recess} />
      <Stk d={R(322 + ox, y0 + 96, 56, 48, 8)} c={D.structure} w={W.inactive} />
      {(
        [
          [338 + ox, y0 + 108],
          [362 + ox, y0 + 108],
          [350 + ox, y0 + 126],
        ] as Pt[]
      ).map((p, i) => (
        <Fil key={i} d={R(p[0] - 2.5, p[1] - 5, 5, 10, 1)} c={D.ink} />
      ))}
      {/* the rocker, face-on: the raised half catches the light, the pressed half sits in shadow; I (bar) on top, O (ring) below */}
      <Fil d={half(!on)} c={'#3A4356'} />
      <Fil d={half(on)} c={TONE.shadow} />
      <Stk d={R(rk.x, rk.y, rk.w, rk.h, 6)} c={D.structure} w={W.inactive} />
      <Stk d={poly([[rk.x, rk.y + rk.h / 2], [rk.x + rk.w, rk.y + rk.h / 2]])} c={D.structure} w={W.detail} />
      <Stk d={poly([[rk.x + rk.w / 2, rk.y + 8], [rk.x + rk.w / 2, rk.y + 23]])} c={D.ink} w={3} />
      <Stk d={circ(rk.x + rk.w / 2, rk.y + 46, 7)} c={D.ink} w={3} />
      {/* the cord and its plug (C13) */}
      <path d={cord} fill="none" stroke={D.structure} strokeWidth={14} strokeLinecap="round" />
      <path d={cord} fill="none" stroke={TONE.spot} strokeWidth={9} strokeLinecap="round" />
      <Fil d={R(px - 36, py - 30, 72, 60, 10)} c={'#232A39'} />
      <Stk d={R(px - 36, py - 30, 72, 60, 10)} c={D.structure} w={W.inactive} />
      <Stk d={R(px - 22, py - 16, 44, 32, 6)} c={D.structure} w={W.detail} />
    </g>
  );
};

/** The 1:1 standby schematic (inside). */
const SchemArt: React.FC<{y0: number; st: RowState; frame: number}> = ({y0, st, frame}) => {
  const off = st.lookOffAt !== null && frame >= st.lookOffAt;
  const offT = st.lookOffAt !== null ? progress(frame, st.lookOffAt, 5, EASE.arrive) : 0;
  return (
    <g>
      {/* power supply */}
      <Fil d={R(766, y0 + 66, 180, 120, 10)} c={TONE.shadow} />
      <Fil d={R(760, y0 + 60, 180, 120, 10)} c={TONE.body} />
      <Stk d={R(760, y0 + 60, 180, 120, 10)} c={D.structure} w={W.inactive} />
      {[898, 910, 922].map((x) => (
        <Stk key={x} d={poly([[x, y0 + 80], [x, y0 + 160]])} c={D.structure} w={W.detail} />
      ))}
      <Stk d={R(784, y0 + 80, 92, 80, 6)} c={D.structure} w={W.detail} />
      {/* main channel: walls only, empty. It leaves the power supply at y0 + 100 so the "Main rails: OFF" pill sits
          clear above it and right of the power supply (review fix: the pill covered the supply's corner) */}
      <Channel5 pts={[[940, y0 + 100], [1250, y0 + 100]]} kind="main" front={0} frame={frame} />
      <Fil d={R(1250, y0 + 80, 24, 40, 3)} c={TONE.recess} />
      <Stk d={R(1250, y0 + 80, 24, 40, 3)} c={D.structure} w={W.inactive} />
      {[0, 1, 2, 3].map((i) => (
        <React.Fragment key={i}>
          <Fil d={R(1254, y0 + 84.5 + i * 9, 4, 4, 0.5)} c={D.structure} />
          <Fil d={R(1266, y0 + 84.5 + i * 9, 4, 4, 0.5)} c={D.structure} />
        </React.Fragment>
      ))}
      {/* standby channel → regulator → the lookout in its chipset */}
      <Fil d={R(1600, y0 + 86, 160, 120, 10)} c={TONE.body} />
      <Stk d={R(1600, y0 + 86, 160, 120, 10)} c={D.structure} w={W.inactive} />
      <Channel5 pts={[[940, y0 + 146], [1690, y0 + 146]]} kind="standby" front={1} drain={st.stby} shimmer={st.shimmer} frame={frame} />
      <Fil d={R(1340, y0 + 132, 38, 28, 4)} c={TONE.body} />
      <Stk d={R(1340, y0 + 132, 38, 28, 4)} c={D.structure} w={W.detail} />
      <Fil d={R(1690, y0 + 126, 48, 40, 10)} c={off ? TONE.body : D.activeFill} />
      <Stk d={R(1690, y0 + 126, 48, 40, 10)} c={off ? D.structure : D.ink} w={off ? W.inactive : W.active} o={off ? Math.max(0.5, offT) : 1} />
      <StateGlyph
        x={1738}
        y={y0 + 126}
        timeline={st.lookOffAt !== null ? [{at: -1, state: 'ALWAYS_ON'}, {at: st.lookOffAt, state: 'OFF'}] : [{at: -1, state: 'ALWAYS_ON'}]}
      />
    </g>
  );
};

const Row: React.FC<{y0: number; st: RowState; frame: number; actOut: number; actIn: number; caption?: {text: string; t: number}; diagram: number}> = ({
  y0,
  st,
  frame,
  actOut,
  actIn,
  caption,
  diagram,
}) => {
  const ob = outBox(y0);
  const ib = inBox(y0);
  const plateO = actOut > 0.5 ? TONE.plateOut : TONE.plateOutHeld;
  return (
    <g>
      <Plate box={ob} polarity="out" held={1 - actOut} />
      <Plate box={ib} polarity="schem" />
      <PanelClip box={ob}>
        <RearArt y0={y0} st={st} frame={frame} />
      </PanelClip>
      <PanelClip box={ib}>
        <SchemArt y0={y0} st={st} frame={frame} />
      </PanelClip>
      {/* the mains energy: from the inlet, across the port gutter, into the power supply */}
      <Channel5 pts={[[512, y0 + 120], [760, y0 + 120]]} kind="main" front={1} drain={st.ac} frame={frame} />
      <Rules box={ob} plate={plateO} polarity="out" active={actOut} double={0} ports={[{side: 'right', at: y0 + 120, open: 1, len: 34}]} />
      <Rules box={ib} plate={TONE.plateSchem} polarity="schem" active={actIn} double={0} ports={[{side: 'left', at: y0 + 120, open: 1, len: 34}]} />
      <DiagramChip box={ib} opacity={diagram} />
      {caption ? <Caption box={ob} text={caption.text} polarity="out" t={caption.t} inset={48} /> : null}
    </g>
  );
};

export const StandbyPage: React.FC<{frame: number}> = ({frame}) => {
  const contentIn = 1; // a T1 cut lands whole; the focal motion (the lookout breathing, the tag) starts at once
  const split = progress(frame, F.whenever, 12, EASE.move);
  const yA = lerp(ROW_Y.B, ROW_Y.A, split);
  const yC = lerp(ROW_Y.B, ROW_Y.C, split);
  const shimmer = Math.min(progress(frame, F.small, 8), 1 - progress(frame, F.cutS11 - 6, 6));
  const real: RowState = {plug: 0, rocker: 0, ac: 0, stby: 0, lookOffAt: null, shimmer};
  const stA: RowState = {
    plug: progress(frame, F.plugged, 6, EASE.move),
    rocker: 0,
    ac: progress(frame, F.plugged + 2, 8, EASE.exit),
    stby: progress(frame, F.plugged + 6, 8, EASE.exit),
    lookOffAt: F.plugged + 14,
    shimmer: frame < F.plugged + 6 ? shimmer : 0,
  };
  const stC: RowState = {
    plug: 0,
    rocker: progress(frame, F.rear, 3, EASE.linear),
    ac: progress(frame, F.rear + 2, 8, EASE.exit),
    stby: progress(frame, F.rear + 5, 8, EASE.exit),
    lookOffAt: F.rear + 13,
    shimmer: frame < F.rear + 5 ? shimmer : 0,
  };
  // one active panel: the real schematic, then the cause of each copy, then the real row again
  const act = (id: 'B' | 'A' | 'C', side: 'out' | 'in'): number => {
    const sw: Array<[number, string]> = [
      [F.cutStandby, 'Bin'],
      [F.plugged - 6, 'Aout'],
      [F.rear - 6, 'Cout'],
      [F.rear + 21, 'Bin'],
    ];
    let cur = 0;
    for (let i = 0; i < sw.length; i++) if (sw[i][0] <= frame) cur = i;
    const key = `${id}${side}`;
    const t = cur === 0 ? 1 : progress(frame, sw[cur][0], 6, EASE.arrive);
    if (sw[cur][1] === key) return t;
    if (cur > 0 && sw[cur - 1][1] === key) return 1 - t;
    return 0;
  };
  return (
    <g opacity={contentIn}>
      {split > 0 ? (
        <>
          <Row y0={yA} st={stA} frame={frame} actOut={act('A', 'out')} actIn={act('A', 'in')} caption={{text: 'If unplugged', t: progress(frame, F.whenever + 7, 5, EASE.arrive)}} diagram={split} />
          <Row y0={yC} st={stC} frame={frame} actOut={act('C', 'out')} actIn={act('C', 'in')} caption={{text: 'If rear switch OFF', t: progress(frame, F.whenever + 11, 5, EASE.arrive)}} diagram={split} />
        </>
      ) : null}
      <Row y0={ROW_Y.B} st={real} frame={frame} actOut={act('B', 'out')} actIn={act('B', 'in')} diagram={1} />
      {/* row B's labels (they never move) */}
      <Tag5
        frame={frame}
        anchor={[1004, ROW_Y.B + 146]}
        elbow={[1004, ROW_Y.B + 206]}
        end={[1024, ROW_Y.B + 206]}
        text="Standby power"
        secondary="+5VSB · ATX"
        role="standby"
        land={F.cutStandby + 1}
        ground="dark"
        plate={TONE.plateSchem}
      />
      {/* above the empty main channel, 16 px right of the power supply (x 956–~1288, y 422–480) */}
      <StatePill theme={D} x={956} y={ROW_Y.B + 12} dock="none" label="Main rails: OFF" inAt={F.powerSupply} fill={TONE.plateSchem} />
    </g>
  );
};

void L;
