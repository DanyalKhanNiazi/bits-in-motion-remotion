/**
 * Signal Score: the lane-head parts. Flat, orthographic, plain rounded shapes with their true features.
 * One drawing and one orientation per part, used at strip scale (f0-f142) and in its seat.
 * Every drawing is in SEAT coordinates; <Fold> applies the strip -> seat transform, and strokes are
 * divided by the scale so line weights stay at the brand's px on screen.
 */
import React from 'react';
import {breathe, clamp01, EASE, lerp, progress} from '../../shared/motion';
import {rectPath, squarePath} from '../../shared/geom';
import {mixColor} from '../../shared/brand';
import {SANS} from '../../shared/fonts';
import {CAP_PRESSED, GROUND, SEAT, SEAT_CENTRE, STRIP, T, WASH, type GroupId} from './layout';

/** Unpowered parts read as solid, dark bodies on the graphite face (the lit lookout stands out). */
const BODY = T.panel;
import {trap} from './timemap';
import {F} from './timeline';

/** Fold progress 0 (strip) -> 1 (seat), f142-f172, trapezoid with 6-frame ramps. */
export const foldT = (f: number): number => trap(f, F.foldStart, F.foldEnd, 6);

/** Current centre and scale of a group. */
export const groupXform = (g: GroupId, f: number): {cx: number; cy: number; s: number} => {
  const t = foldT(f);
  const st = STRIP[g];
  const c = SEAT_CENTRE[g];
  return {cx: lerp(st.cx, c[0], t), cy: lerp(st.cy, c[1], t), s: lerp(st.s, 1, t)};
};

/** Map a seat point through the group's current transform. */
export const groupPoint = (g: GroupId, f: number, p: readonly [number, number]): [number, number] => {
  const x = groupXform(g, f);
  const c = SEAT_CENTRE[g];
  return [x.cx + (p[0] - c[0]) * x.s, x.cy + (p[1] - c[1]) * x.s];
};

export const Fold: React.FC<{g: GroupId; f: number; children: (s: number) => React.ReactNode}> = ({g, f, children}) => {
  const x = groupXform(g, f);
  const c = SEAT_CENTRE[g];
  return <g transform={`translate(${x.cx} ${x.cy}) scale(${x.s}) translate(${-c[0]} ${-c[1]})`}>{children(x.s)}</g>;
};

/* ------------------------------------------------------------------------------------------------
 * Small helpers
 * ---------------------------------------------------------------------------------------------- */

type Accent = number; // 0..1 outline accent (3 -> 4 px, structure -> annotation)

const partStroke = (accent: Accent) => ({
  color: accent > 0 ? mixColor(T.structure, T.annotation, accent) : T.structure,
  w: 3 + accent,
});

/** The IEC 60417 power symbol (a broken circle and a bar), centred on (cx, cy), radius r. */
export const powerSymbol = (cx: number, cy: number, r: number): string => {
  const a0 = (-60 * Math.PI) / 180;
  const a1 = (240 * Math.PI) / 180;
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)];
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)];
  return `M${p0[0]} ${p0[1]}A${r} ${r} 0 1 1 ${p1[0]} ${p1[1]}M${cx} ${cy - r * 1.18}V${cy - r * 0.05}`;
};

/** Cap travel: f0 ("Press") and f1837 ("press."): contact over 3 frames, spring-back 6-10 frames later. */
export const capPress = (f: number): number => {
  const one = (at: number, holdTo: number) => {
    if (f < at - 1 || f > holdTo + 5) return 0;
    const down = progress(f, at - 1, 2, EASE.outCubic);
    const up = progress(f, holdTo, 5, EASE.inOutCubic);
    return down * (1 - up);
  };
  return Math.max(one(F.press + 1, F.press + 6), one(F.realPress + 1, F.realPress + 10));
};

/* ------------------------------------------------------------------------------------------------
 * Row 1: case front (button, LED) and the monitor
 * ---------------------------------------------------------------------------------------------- */

export const CaseFront: React.FC<{f: number; s: number; accent?: Accent}> = ({f, s, accent = 0}) => {
  const b = SEAT.caseFront;
  const st = partStroke(accent);
  const press = capPress(f);
  const bt = SEAT.button;
  const capR = (bt.r - 4) * (1 - 0.12 * press);
  const capFill = mixColor('#2B3346', CAP_PRESSED, press);
  return (
    <g>
      <path d={rectPath(b.x, b.y, b.w, b.h, 10)} fill={BODY} stroke={st.color} strokeWidth={st.w / s} />
      {/* button bezel and cap */}
      <circle cx={bt.cx} cy={bt.cy} r={bt.r} fill={BODY} stroke={st.color} strokeWidth={2.5 / s} />
      <circle cx={bt.cx} cy={bt.cy} r={capR} fill={capFill} />
      <path d={powerSymbol(bt.cx, bt.cy + 0.5, capR * 0.55)} fill="none" stroke={T.annotation} strokeWidth={2.2 / s} strokeLinecap="round" />
      {/* power LED: off */}
      <circle cx={SEAT.led.cx} cy={SEAT.led.cy} r={SEAT.led.r} fill="none" stroke={T.structure} strokeWidth={2 / s} />
      {/* vents */}
      {[274, 283, 292].map((y) => (
        <path key={y} d={`M${b.x + 16} ${y}H${b.x + b.w - 16}`} stroke={T.structure} strokeWidth={2 / s} />
      ))}
    </g>
  );
};

export const Monitor: React.FC<{s: number; accent?: Accent}> = ({s, accent = 0}) => {
  const m = SEAT.monitor;
  const st = partStroke(accent);
  const cx = m.x + m.w / 2;
  return (
    <g>
      <path d={`M${cx} ${m.y + m.h}V${300}M${cx - 22} ${300}H${cx + 26}`} stroke={st.color} strokeWidth={st.w / s} fill="none" />
      <path d={rectPath(m.x, m.y, m.w, m.h, 6)} fill={T.surface} stroke={st.color} strokeWidth={st.w / s} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Lane 2: the main processor (LGA-style package with its heat spreader). Always OFF in the intro.
 * ---------------------------------------------------------------------------------------------- */

export const Cpu: React.FC<{s: number; accent?: Accent}> = ({s, accent = 0}) => {
  const c = SEAT.cpu;
  const st = partStroke(accent);
  // heat spreader with the side notches of a desktop package
  const ix0 = c.x + 26;
  const ix1 = c.x + c.w - 26;
  const iy0 = c.y + 22;
  const iy1 = c.y + c.h - 22;
  const nY0 = c.y + c.h / 2 - 22;
  const nY1 = c.y + c.h / 2 + 22;
  const n = 12;
  const ihs =
    `M${ix0 + 8} ${iy0}H${ix1 - 8}Q${ix1} ${iy0} ${ix1} ${iy0 + 8}V${nY0}H${ix1 - n}V${nY1}H${ix1}V${iy1 - 8}Q${ix1} ${iy1} ${ix1 - 8} ${iy1}` +
    `H${ix0 + 8}Q${ix0} ${iy1} ${ix0} ${iy1 - 8}V${nY1}H${ix0 + n}V${nY0}H${ix0}V${iy0 + 8}Q${ix0} ${iy0} ${ix0 + 8} ${iy0}Z`;
  return (
    <g>
      <path d={rectPath(c.x, c.y, c.w, c.h, 10)} fill={BODY} stroke={st.color} strokeWidth={st.w / s} />
      <path d={ihs} fill="none" stroke={st.color} strokeWidth={st.w / s} strokeLinejoin="round" />
      {/* OFF pip, docked inside the top-right corner */}
      <path d={squarePath(c.x + c.w - 15, c.y + 15, 10, 1)} fill="none" stroke={T.structure} strokeWidth={2 / s} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Lane 3: the chipset package, with the lookout (lower left, always on) and the "?" (upper right)
 * ---------------------------------------------------------------------------------------------- */

export interface ChipsetState {
  /** "?" block ON (flash-forward), 0..1. */
  qOn: number;
  /** "?" badge emphasis fill 0..1. */
  qFill: number;
  /** "?" badge scale accent. */
  qBadgeScale: number;
  /** Lookout pip scale accent ("awake", "that lookout"). */
  lookoutPulse: number;
  accent?: Accent;
  /** Draw-on 0..1 of the lookout's line inside the package (from the block to the package wall). */
  lkStub?: number;
  /** The "?" track's stub inside the package (0..1), once the track has tuned in. */
  qStub?: number;
  /** S11 powered-domain wash around the lookout block (0..1). */
  wash?: number;
}

export const QBadge: React.FC<{cx: number; cy: number; fill: number; k?: number; s?: number}> = ({cx, cy, fill, k = 1, s = 1}) => {
  const b = 36 * k;
  const sw = 3 / s;
  return (
    <g>
      <path d={rectPath(cx - b / 2 + sw / 2, cy - b / 2 + sw / 2, b - sw, b - sw, 8 * k)} fill={fill > 0 ? mixColor(GROUND, T.emphasis, fill) : GROUND} stroke={T.emphasis} strokeWidth={sw} />
      <text
        x={cx}
        y={cy + 1.5 * k}
        textAnchor="middle"
        dominantBaseline="central"
        style={{fontFamily: SANS, fontWeight: 700, fontSize: 30 * k}}
        fill={fill >= 0.5 ? T.surface : T.emphasis}
      >
        ?
      </text>
    </g>
  );
};

export const Chipset: React.FC<{f: number; s: number; st: ChipsetState}> = ({f, s, st}) => {
  const c = SEAT.chipset;
  const q = SEAT.qBlock;
  const lk = SEAT.lookout;
  const ps = partStroke(st.accent ?? 0);
  const qCol = mixColor(T.structure, T.ink, st.qOn);
  const qW = 3 + st.qOn;
  const pipBreath = breathe(f);
  const pulse = st.lookoutPulse;
  const lkPip = 12 * (1 + 0.3 * pulse);
  return (
    <g>
      <path d={rectPath(c.x, c.y, c.w, c.h, 10)} fill={BODY} stroke={ps.color} strokeWidth={ps.w / s} />
      {/* S11: the powered domain inside the package is only the lookout (the "?" stays outside) */}
      {(st.wash ?? 0) > 0 ? (
        <path
          d={rectPath(lk.x - 8, lk.y - 9, lk.w + 16, c.y + c.h - lk.y + 9 - 3, 6)}
          fill={WASH}
          stroke={T.annotation}
          strokeOpacity={0.55}
          strokeWidth={2 / s}
          opacity={st.wash}
        />
      ) : null}
      {/* the tracks leave their own blocks: the lookout's line (ink) and the "?" stub (grey) inside the package */}
      {(st.lkStub ?? 0) > 0 ? (
        <path d={`M${lk.x + lk.w} ${lk.y + lk.h / 2}H${lk.x + lk.w + (c.x + c.w - lk.x - lk.w) * (st.lkStub ?? 0)}`} stroke={T.ink} strokeWidth={4 / s} />
      ) : null}
      {(st.qStub ?? 0) > 0 ? (
        <path d={`M${q.x + q.w} ${q.y + q.h / 2}H${q.x + q.w + (c.x + c.w - q.x - q.w) * (st.qStub ?? 0)}`} stroke={T.structure} strokeWidth={3 / s} />
      ) : null}
      {/* the "?" block: OFF (hollow pip), ON only in the flash-forward */}
      <path d={rectPath(q.x, q.y, q.w, q.h, 6)} fill={mixColor(BODY, T.activeFill, st.qOn)} stroke={qCol} strokeWidth={qW / s} />
      {st.qOn > 0.5 ? (
        <path d={squarePath(q.x + q.w - 13, q.y + 13, 10, 1.5)} fill={T.ink} />
      ) : (
        <path d={squarePath(q.x + q.w - 13, q.y + 13, 9, 1)} fill="none" stroke={T.structure} strokeWidth={2 / s} />
      )}
      {/* the lookout: always on, breathing pip (never changes glyph on a landing) */}
      <path d={rectPath(lk.x, lk.y, lk.w, lk.h, 6)} fill={T.activeFill} stroke={T.ink} strokeWidth={4 / s} />
      <path d={squarePath(lk.x + lk.w - 13, lk.y + 13, lkPip, 1.5)} fill={T.ink} opacity={pipBreath} />
      {/* the "?" badge, in the label slot above the "?" block */}
      <g transform={`translate(${SEAT.qBadge.cx} ${SEAT.qBadge.cy}) scale(${st.qBadgeScale}) translate(${-SEAT.qBadge.cx} ${-SEAT.qBadge.cy})`}>
        <QBadge cx={SEAT.qBadge.cx} cy={SEAT.qBadge.cy} fill={st.qFill} s={s} />
      </g>
    </g>
  );
};

/** Front-panel header block on the board edge, where the button's lead ends. */
export const HeaderBlock: React.FC<{s: number; endTick: number}> = ({s, endTick}) => {
  const h = SEAT.header;
  const pins: React.ReactNode[] = [];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) pins.push(<rect key={`${i}${j}`} x={h.x + 7 + i * 8} y={h.y + 6 + j * 8} width={4} height={4} fill={T.structure} />);
  return (
    <g>
      <path d={rectPath(h.x, h.y, h.w, h.h, 3)} fill={BODY} stroke={T.structure} strokeWidth={2.5 / s} />
      {pins}
      {/* the lead's end-tick at the header (brightens to ink on "doesn't") */}
      <path d={`M${h.x - 2} ${h.y - 6}V${h.y + h.h + 6}`} stroke={mixColor(T.annotation, T.ink, endTick)} strokeWidth={(3 + endTick) / s} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Lane 4: the power supply, rear view (fan grille, rocker at "I", IEC inlet with the cord seated)
 * ---------------------------------------------------------------------------------------------- */

export const Psu: React.FC<{s: number; accent?: Accent; wash?: number; sbX?: number}> = ({s, accent = 0, wash = 0, sbX = 226}) => {
  const p = SEAT.psu;
  const st = partStroke(accent);
  const fan = SEAT.fan;
  const rk = SEAT.rocker;
  const inl = SEAT.inlet;
  const ch = 8; // inlet chamfer
  const inletPath = `M${inl.x + ch} ${inl.y}H${inl.x + inl.w - ch}L${inl.x + inl.w} ${inl.y + ch}V${inl.y + inl.h}H${inl.x}V${inl.y + ch}Z`;
  const plugX = inl.x + inl.w / 2;
  return (
    <g>
      <path d={rectPath(p.x, p.y, p.w, p.h, 10)} fill={BODY} stroke={st.color} strokeWidth={st.w / s} />
      {/* S11: the supply's standby output (where the thin link leaves) is inside the powered domain */}
      {wash > 0 ? (
        <path d={rectPath(sbX - 16, p.y + 3, 32, 20, 4)} fill={WASH} stroke={T.annotation} strokeOpacity={0.55} strokeWidth={2 / s} opacity={wash} />
      ) : null}
      {/* fan grille */}
      <circle cx={fan.cx} cy={fan.cy} r={fan.r} fill="none" stroke={T.structure} strokeWidth={3 / s} />
      <circle cx={fan.cx} cy={fan.cy} r={fan.r * 0.66} fill="none" stroke={T.structure} strokeWidth={2 / s} />
      <circle cx={fan.cx} cy={fan.cy} r={fan.r * 0.33} fill="none" stroke={T.structure} strokeWidth={2 / s} />
      <path
        d={`M${fan.cx - fan.r} ${fan.cy}H${fan.cx + fan.r}M${fan.cx} ${fan.cy - fan.r}V${fan.cy + fan.r}`}
        stroke={T.structure}
        strokeWidth={2 / s}
      />
      {/* rocker switch, at "I" (the I half is pressed in) */}
      <path d={rectPath(rk.x, rk.y, rk.w, rk.h, 4)} fill={BODY} stroke={T.structure} strokeWidth={2.5 / s} />
      <path d={rectPath(rk.x + 5, rk.y + 5, rk.w - 10, rk.h / 2 - 5, 2)} fill={mixColor(BODY, T.annotation, 0.35)} />
      <path d={`M${rk.x + rk.w / 2} ${rk.y + 9}V${rk.y + rk.h / 2 - 3}`} stroke={T.ink} strokeWidth={2.5 / s} />
      <circle cx={rk.x + rk.w / 2} cy={rk.y + rk.h * 0.74} r={4.2} fill="none" stroke={T.structure} strokeWidth={2 / s} />
      {/* IEC inlet with the cord's plug seated */}
      <path d={inletPath} fill={BODY} stroke={T.structure} strokeWidth={2.5 / s} strokeLinejoin="round" />
      <path d={rectPath(inl.x + 5, inl.y + 7, inl.w - 10, inl.h - 9, 3)} fill="#2E3648" stroke={T.textMuted} strokeWidth={2 / s} />
      {[inl.x + 12, plugX, inl.x + inl.w - 12].map((x, i) => (
        <rect key={i} x={x - 2} y={inl.y + (i === 1 ? 12 : 16)} width={4} height={i === 1 ? 7 : 8} fill={T.structure} />
      ))}
    </g>
  );
};

/** The AC cord: from the plug in the inlet, down below the supply and curling away (graphics only). */
export const Cord: React.FC<{s: number}> = ({s}) => {
  const inl = SEAT.inlet;
  const x = inl.x + inl.w / 2;
  const y0 = inl.y + inl.h;
  // the curl stays above y 1012 (strokes included) so the caption reserve (y >= 940) only holds a short cord tail,
  // within the proposal's "graphics may reach 1026" (it used to reach y 1046)
  const d = `M${x} ${y0}V${y0 + 30}C${x} ${y0 + 58} ${x - 40} ${y0 + 56} ${x - 70} ${y0 + 78}S${x - 120} ${y0 + 116} ${x - 150} ${y0 + 122}`;
  return (
    <g>
      <path d={rectPath(x - 9, y0 - 2, 18, 14, 3)} fill="#2E3648" stroke={T.textMuted} strokeWidth={2 / s} />
      <path d={d} fill="none" stroke="#3A4356" strokeWidth={7 / s} strokeLinecap="round" />
    </g>
  );
};

/** Clamp helper for accents: a 6-frame 0 -> 1 -> 0 bump starting at `at`. */
export const bump = (f: number, at: number, frames = 6): number => {
  if (f < at || f > at + frames) return 0;
  const t = (f - at) / frames;
  return clamp01(Math.sin(Math.PI * t));
};
