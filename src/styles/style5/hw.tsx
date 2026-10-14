/**
 * Clear-line hardware for the system page (B, P, O), drawn through a View so the same model renders at ×1, in the
 * ×4 Lens inset, and in the S06 thumbnail. Even outlines at token widths (3 px inactive, 4 px active, 2 px detail),
 * flat fills, one shadow tone per polarity. No text here: labels, pips and badges live in the page-space layer.
 */
import React from 'react';
import {mixColor, type Pt} from '../../shared';
import {D, L, TONE, W, vp, vpts, vrect, vx, vy, circ, poly, type Box, type View} from './look';
import {Fil, Stk} from './panel';
import * as G from './geo';

const R = (v: View, b: Box, r = 0, dx = 0, dy = 0): string => vrect(v, b.x + dx, b.y + dy, b.w, b.h, r);

/** A part: optional shadow, flat fill, even outline. */
const Part: React.FC<{v: View; b: Box; r?: number; fill?: string; stroke?: string; w?: number; shadow?: number}> = ({
  v,
  b,
  r = 10,
  fill,
  stroke = D.structure,
  w = W.inactive,
  shadow = 0,
}) => (
  <>
    {shadow > 0 ? <Fil d={R(v, b, r, shadow, shadow)} c={TONE.shadow} /> : null}
    {fill ? <Fil d={R(v, b, r)} c={fill} /> : null}
    <Stk d={R(v, b, r)} c={stroke} w={w} />
  </>
);

const hline = (v: View, x0: number, x1: number, y: number): string => poly([vp(v, [x0, y]), vp(v, [x1, y])]);
const vline = (v: View, x: number, y0: number, y1: number): string => poly([vp(v, [x, y0]), vp(v, [x, y1])]);

/* =========================================================================================== B: board */

export interface BoardState {
  /** "?" ON level 0..1 (only in the flash-forward and the S06 preview) */
  q: number;
  /** emphasis glow on the "?" (the glow budget's one active part) */
  qGlow?: number;
  /** S11 powered-domain wash (0..1), drawn on the board under the parts */
  wash?: number;
}

export const WASH = mixColor(D.board, D.energy, 0.16);

export const BoardArt: React.FC<{v: View} & BoardState> = ({v, q, qGlow = 0, wash = 0}) => {
  const B = G.BOARD;
  const holes: Pt[] = [
    [556, 252],
    [556, 560],
    [556, 830],
    [812, 252],
    [812, 830],
    [1014, 252],
    [1014, 560],
    [1014, 830],
    [690, 600],
  ];
  const usb = [272, 306, 340];
  return (
    <g>
      {/* the board */}
      <Fil d={R(v, B, 10, 7, 7)} c={TONE.shadow} />
      <Fil d={R(v, B, 10)} c={TONE.pcb} />
      {wash > 0 ? <Fil d={poly(vpts(v, G.DOMAIN_PTS), true)} c={WASH} o={wash} /> : null}
      <Stk d={R(v, B, 10)} c={D.structure} w={W.inactive} />
      {holes.map((h, i) => (
        <Stk key={i} d={circ(vx(v, h[0]), vy(v, h[1]), Math.max(1.5, 4.5 * v.s))} c={D.structure} w={W.detail} />
      ))}

      {/* rear I/O column: shield, USB stacks, network jack, audio */}
      <Stk d={R(v, G.IO_SHIELD, 4)} c={D.structure} w={W.detail} />
      {usb.map((y) => (
        <React.Fragment key={y}>
          <Fil d={vrect(v, 546, y, 30, 22, 3)} c={TONE.recess} />
          <Stk d={vrect(v, 546, y, 30, 22, 3)} c={D.structure} w={W.detail} />
          <Stk d={hline(v, 551, 571, y + 11)} c={D.structure} w={W.detail} />
        </React.Fragment>
      ))}
      <Part v={v} b={G.RJ45} r={3} fill={TONE.recess} />
      <Stk d={vrect(v, 551, 428, 16, 9, 1)} c={D.structure} w={W.detail} />
      {[470, 490].map((y) => (
        <Stk key={y} d={circ(vx(v, 559), vy(v, y), Math.max(1.5, 6 * v.s))} c={D.structure} w={W.detail} />
      ))}
      <Part v={v} b={G.LAN} r={3} fill={TONE.body} />

      {/* expansion slots and an M.2 slot (real features, detail weight) */}
      {(
        [
          [566, 588, 236, 16],
          [566, 652, 84, 14],
          [566, 700, 236, 16],
        ] as Array<[number, number, number, number]>
      ).map(([x, y, w, h], i) => (
        <React.Fragment key={i}>
          <Fil d={vrect(v, x, y, w, h, 3)} c={TONE.recess} />
          <Stk d={vrect(v, x, y, w, h, 3)} c={D.structure} w={W.detail} />
          <Stk d={hline(v, x + 10, x + w - 10, y + h / 2)} c={D.structure} w={W.detail} o={0.6} />
        </React.Fragment>
      ))}
      <Stk d={vrect(v, 620, 750, 170, 22, 3)} c={D.structure} w={W.detail} />
      <Stk d={circ(vx(v, 806), vy(v, 761), Math.max(1.5, 4 * v.s))} c={D.structure} w={W.detail} />

      {/* VRM heatsink left of the socket */}
      <Fil d={R(v, G.VRM, 4, 4, 4)} c={TONE.shadow} />
      <Fil d={R(v, G.VRM, 4)} c={TONE.body} />
      <Stk d={R(v, G.VRM, 4)} c={D.structure} w={W.detail} />
      {Array.from({length: 9}, (_, i) => 314 + i * 18).map((y) => (
        <Stk key={y} d={hline(v, 608, 626, y)} c={D.structure} w={W.detail} />
      ))}

      {/* CPU: the big dark cooler footprint, socket, package (inactive, never lit) */}
      <Fil d={R(v, G.COOLER, 16, 6, 6)} c={TONE.shadow} />
      <Fil d={R(v, G.COOLER, 16)} c={TONE.shadow} />
      <Stk d={R(v, G.COOLER, 16)} c={D.structure} w={W.inactive} />
      {[296, 308, 320, 452, 464, 476].map((y) => (
        <Stk key={y} d={hline(v, 660, 824, y)} c={D.structure} w={W.detail} o={0.75} />
      ))}
      <Fil d={R(v, G.SOCKET, 6)} c={TONE.recess} />
      <Stk d={R(v, G.SOCKET, 6)} c={D.structure} w={W.detail} />
      <Stk d={poly([vp(v, [796, 336]), vp(v, [796, 436]), vp(v, [790, 442])])} c={D.structure} w={W.detail} />
      <Part v={v} b={G.CPU} r={6} fill={TONE.body} />
      <Stk d={vrect(v, 714, 352, 57, 68, 4)} c={D.structure} w={W.detail} />

      {/* memory slots (2 of 4 filled) */}
      {G.DIMM_X.map((x, i) => (
        <React.Fragment key={x}>
          <Fil d={vrect(v, x, G.DIMM.y, G.DIMM.w, G.DIMM.h, 2)} c={i % 2 === 1 ? TONE.body : TONE.recess} />
          <Stk d={vrect(v, x, G.DIMM.y, G.DIMM.w, G.DIMM.h, 2)} c={D.structure} w={W.detail} />
          <Stk d={hline(v, x, x + G.DIMM.w, G.DIMM.y + 14)} c={D.structure} w={W.detail} />
          <Stk d={hline(v, x, x + G.DIMM.w, G.DIMM.y + G.DIMM.h - 14)} c={D.structure} w={W.detail} />
        </React.Fragment>
      ))}

      {/* 24-pin power connector (front edge) */}
      <Part v={v} b={G.PIN24} r={3} fill={TONE.recess} />
      {Array.from({length: 12}, (_, i) => G.PIN24.y + 8 + i * 8).map((y) => (
        <React.Fragment key={y}>
          <Fil d={vrect(v, 1012, y - 2, 4, 4, 0.5)} c={D.structure} />
          <Fil d={vrect(v, 1022, y - 2, 4, 4, 0.5)} c={D.structure} />
        </React.Fragment>
      ))}

      {/* standby regulator */}
      <Fil d={R(v, G.REG, 3)} c={TONE.body} />
      <Stk d={R(v, G.REG, 3)} c={D.structure} w={W.detail} />

      {/* chipset: heatsink footprint, package, the two blocks */}
      <Fil d={R(v, G.HEATSINK, 8, 5, 5)} c={TONE.shadow} />
      <Fil d={R(v, G.HEATSINK, 8)} c={TONE.shadow} />
      <Stk d={R(v, G.HEATSINK, 8)} c={D.structure} w={W.detail} />
      <ChipsetCore v={v} q={q} qGlow={qGlow} />

      {/* clock crystal, front-panel header */}
      <Part v={v} b={G.RTC} r={7} fill={TONE.body} />
      <Part v={v} b={G.HEADER} r={2} fill={TONE.recess} />
      {[956, 962, 968, 974].map((x) => (
        <React.Fragment key={x}>
          <Fil d={vrect(v, x - 1.5, 834, 3, 3, 0)} c={D.structure} />
          <Fil d={vrect(v, x - 1.5, 840, 3, 3, 0)} c={D.structure} />
        </React.Fragment>
      ))}
    </g>
  );
};

/** The chipset package and its two blocks: the lookout (ON, always) and the "?" (OFF, or ON in the preview). */
export const ChipsetCore: React.FC<{v: View; q: number; qGlow?: number}> = ({v, q, qGlow = 0}) => {
  const qc = q >= 1 ? D.ink : q <= 0 ? D.structure : mix(D.structure, D.ink, q);
  const qw = W.inactive + (W.active - W.inactive) * q;
  return (
    <g>
      <Fil d={R(v, G.CHIPSET, 4)} c={TONE.body} />
      <Stk d={R(v, G.CHIPSET, 4)} c={D.structure} w={W.inactive} />
      {/* the "?" block */}
      {qGlow > 0 ? <Stk d={R(v, G.QBLOCK, G.QR)} c={D.ink} w={qw * 3} o={0.2 * qGlow} /> : null}
      <Fil d={R(v, G.QBLOCK, G.QR)} c={q > 0 ? mix(TONE.body, D.activeFill, q) : TONE.body} />
      <Stk d={R(v, G.QBLOCK, G.QR)} c={qc} w={qw} />
      {/* the lookout: always awake */}
      <Fil d={R(v, G.LOOK, G.LR)} c={D.activeFill} />
      <Stk d={R(v, G.LOOK, G.LR)} c={D.ink} w={W.active} />
    </g>
  );
};

const mix = (a: string, b: string, t: number): string => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((x, i) => Math.round(x + (pb[i] - x) * t).toString(16).padStart(2, '0')).join('');
};

/* =========================================================================================== P: power supply */

export const PsuArt: React.FC<{v: View}> = ({v}) => {
  const P = G.PSU;
  const x0 = P.x;
  const x1 = P.x + P.w;
  const y0 = P.y;
  const y1 = P.y + P.h;
  return (
    <g>
      <Fil d={R(v, P, 10, 7, 7)} c={TONE.shadow} />
      <Fil d={R(v, P, 10)} c={TONE.body} />
      <Stk d={R(v, P, 10)} c={D.structure} w={W.inactive} />
      {/* side label panel and screws */}
      <Stk d={vrect(v, x0 + 30, y0 + 18, 118, P.h - 36, 6)} c={D.structure} w={W.detail} />
      {(
        [
          [x0 + 14, y0 + 13],
          [x1 - 14, y0 + 13],
          [x0 + 14, y1 - 13],
          [x1 - 14, y1 - 13],
        ] as Pt[]
      ).map((p, i) => (
        <Stk key={i} d={circ(vx(v, p[0]), vy(v, p[1]), Math.max(1.5, 4 * v.s))} c={D.structure} w={W.detail} />
      ))}
      {/* vents at the mains (rear) end */}
      {[0, 1, 2, 3].map((i) => (
        <Stk key={i} d={vline(v, x1 - 56 + i * 10, y0 + 22, y1 - 22)} c={D.structure} w={W.detail} />
      ))}
      {/* modular output panel where the channels leave */}
      <Fil d={R(v, G.PSU_OUT, 3)} c={TONE.recess} />
      <Stk d={R(v, G.PSU_OUT, 3)} c={D.structure} w={W.detail} />
      {/* rear face: inlet with the plug in it, cord leaving to the right; rocker at "I" in profile */}
      <Fil d={R(v, G.PLUG, 6)} c={TONE.recess} />
      <Stk d={R(v, G.PLUG, 6)} c={D.structure} w={W.inactive} />
      <Stk d={hline(v, G.PLUG.x + G.PLUG.w, 1840, G.INLET_Y)} c={D.structure} w={7} cap="butt" />
      <Fil d={R(v, G.ROCKER, 3)} c={TONE.recess} />
      <Stk d={R(v, G.ROCKER, 3)} c={D.structure} w={W.detail} />
      {/* the cap rocked to "I": its upper end flush, its lower end proud of the face */}
      <Fil
        d={poly(
          [
            vp(v, [G.ROCKER.x + 12, G.ROCKER.y + 2]),
            vp(v, [G.ROCKER.x + 15, G.ROCKER.y + 2]),
            vp(v, [G.ROCKER.x + 22, G.ROCKER.y + G.ROCKER.h - 2]),
            vp(v, [G.ROCKER.x + 12, G.ROCKER.y + G.ROCKER.h - 2]),
          ],
          true,
        )}
        c={D.structure}
      />
      {/* the 30 px "I" chip: the rocker is at "I" (on) */}
      <path d={vrect(v, 1726, 300, 38, 40, 10)} fill={TONE.recess} stroke={D.structure} strokeWidth={2} />
      <path d={poly([vp(v, [1745, 309]), vp(v, [1745, 331])])} stroke={D.ink} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/* =========================================================================================== O: outside */

export interface OutsideState {
  /** cap compression 0..1 (inner disc −12%) */
  cap: number;
  /** fingertip: 0 hidden; position of the tip relative to its resting point (px, + = down) */
  finger: {show: number; dy: number} | null;
  /** plate tone handled by the panel; this is the art only */
}

export const OutsideArt: React.FC<{v: View} & OutsideState> = ({v, cap, finger}) => {
  const C = G.CASE_FRONT;
  const M = G.MONITOR;
  const [bx, by] = G.BUTTON_C;
  const k = v.s;
  return (
    <g>
      {/* the case front: spot black (dark ground: everything on it uses dark-set tokens) */}
      <Fil d={R(v, C, 14)} c={TONE.spot} />
      <Stk d={hline(v, C.x + 10, C.x + C.w - 10, C.y + 14)} c={D.structure} w={W.detail} o={0.8} />
      {/* front I/O: two USB-A, two audio jacks */}
      {[634, 660].map((y) => (
        <Stk key={y} d={vrect(v, 1278, y, 26, 10, 2)} c={D.structure} w={W.detail} />
      ))}
      {[639, 665].map((y) => (
        <Stk key={y} d={circ(vx(v, 1322), vy(v, y), Math.max(1.5, 5 * k))} c={D.structure} w={W.detail} />
      ))}
      {/* drive-bay covers and the lower intake */}
      {[724, 772].map((y) => (
        <React.Fragment key={y}>
          <Stk d={vrect(v, 1160, y, 172, 38, 4)} c={D.structure} w={W.detail} />
          <Stk d={hline(v, 1300, 1320, y + 27)} c={D.structure} w={W.detail} />
        </React.Fragment>
      ))}
      {Array.from({length: 7}, (_, i) => 880 + i * 18).map((y) => (
        <Stk key={y} d={hline(v, 1166, 1326, y)} c={D.structure} w={W.detail} o={0.7} />
      ))}
      {/* the power button: bezel ring, cap (inner disc compresses 12% when pressed), power mark */}
      <Stk d={circ(vx(v, bx), vy(v, by), G.BUTTON_R * k)} c={D.structure} w={W.inactive} />
      <Fil d={circ(vx(v, bx), vy(v, by), 11 * k * (1 - 0.12 * cap))} c={cap > 0.5 ? TONE.recess : '#262E3E'} />
      <Stk d={circ(vx(v, bx), vy(v, by), 11 * k * (1 - 0.12 * cap))} c={D.structure} w={W.detail} />
      <PowerMark v={v} c={[bx, by]} r={5.2 * (1 - 0.12 * cap)} />
      {/* LED: off for the whole intro */}
      <Stk d={circ(vx(v, G.LED_C[0]), vy(v, G.LED_C[1]), Math.max(1.5, 4 * k))} c={D.structure} w={W.detail} />

      {/* the monitor: spot-black bezel, black screen, neck */}
      <Fil d={vrect(v, 1631, M.y + M.h - 6, 40, 40, 0)} c={TONE.spot} />
      <Fil d={R(v, M, 14)} c={TONE.spot} />
      <Fil d={vrect(v, M.x + 12, M.y + 12, M.w - 24, M.h - 36, 5)} c={TONE.screen} />
      <Stk d={vrect(v, M.x + 12, M.y + 12, M.w - 24, M.h - 36, 5)} c={'#283044'} w={W.detail} />

      {/* the fingertip: one flat rounded path, no outline, no nail; it only presses */}
      {finger && finger.show > 0 ? <Fingertip v={v} dy={finger.dy} opacity={finger.show} /> : null}
    </g>
  );
};

const PowerMark: React.FC<{v: View; c: Pt; r: number}> = ({v, c, r}) => {
  const [x, y] = vp(v, c);
  const rr = r * v.s;
  const a0 = (-60 * Math.PI) / 180;
  const a1 = (240 * Math.PI) / 180;
  const p0: Pt = [x + rr * Math.sin(a0), y - rr * Math.cos(a0)];
  const p1: Pt = [x + rr * Math.sin(a1), y - rr * Math.cos(a1)];
  return (
    <g>
      <path d={`M${p0[0]} ${p0[1]}A${rr} ${rr} 0 1 1 ${p1[0]} ${p1[1]}`} fill="none" stroke={D.structure} strokeWidth={1.8} strokeLinecap="round" />
      <path d={poly([[x, y - rr * 1.25], [x, y - rr * 0.2]])} stroke={D.structure} strokeWidth={1.8} strokeLinecap="round" />
    </g>
  );
};

/** Fingertip, entering from O's top edge; the tip rests 4 px above the cap and presses 12 px onto it (dy = 12). */
export const Fingertip: React.FC<{v: View; dy: number; opacity?: number}> = ({v, dy, opacity = 1}) => {
  const [bx, by] = G.BUTTON_C;
  const tipY = by - G.BUTTON_R - 8 + dy; // rest 4 px above the bezel's top (the pad reaches 4 px below tipY)
  const w = 46;
  const top = tipY - 280;
  // one rounded path: slightly wider at the knuckle side, a full round pad at the tip
  const d =
    `M${bx - w / 2 - 3} ${top}` +
    `L${bx - w / 2} ${tipY - w * 0.55}` +
    `C${bx - w / 2} ${tipY - 2} ${bx - w * 0.3} ${tipY + 4} ${bx} ${tipY + 4}` +
    `C${bx + w * 0.3} ${tipY + 4} ${bx + w / 2} ${tipY - 2} ${bx + w / 2} ${tipY - w * 0.55}` +
    `L${bx + w / 2 + 3} ${top}Z`;
  // map through the view
  const mapped = d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, a, b) => `${vx(v, Number(a))} ${vy(v, Number(b))}`);
  return <path d={mapped} fill={TONE.finger} fillOpacity={opacity} />;
};

export {L};
