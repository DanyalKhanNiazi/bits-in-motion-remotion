/**
 * The map's hardware, drawn in world units inside one camera transform. Every stroke is non-scaling
 * (the CAD rule: line weights stay constant on screen at every zoom; only geometry scales).
 *
 *   <MapBase cam={cam} frame={f} />   board, parts, data links (under energy and routes)
 *   <MapOver cam={cam} frame={f} />   connectors and the chipset's two blocks (over energy and routes)
 */
import React from 'react';
import {EASE, clamp01, progress, rectPath, routePath, type Pt} from '../../shared';
import type {Cam} from './camera';
import {FILL, T, W} from './theme';
import {F} from './timeline';
import * as M from './map';

const NS = 'non-scaling-stroke';

const Box: React.FC<{b: M.Rect; fill?: string; stroke?: string; sw?: number; dash?: string; opacity?: number}> = ({b, fill = 'none', stroke = 'none', sw = 0, dash, opacity}) => (
  <rect
    x={b.x}
    y={b.y}
    width={b.w}
    height={b.h}
    rx={b.r ?? 0}
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeDasharray={dash}
    vectorEffect={NS}
    opacity={opacity}
  />
);

const Line: React.FC<{pts: ReadonlyArray<Pt>; stroke: string; sw: number; r?: number; cap?: 'butt' | 'round' | 'square'; opacity?: number}> = ({pts, stroke, sw, r = 8, cap = 'butt', opacity}) => (
  <path d={routePath(pts, r)} fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap={cap} strokeLinejoin="round" vectorEffect={NS} opacity={opacity} />
);

/** Button cap travel: 0 at rest → 1 fully pressed. Only on the two spoken presses (f0, f1837). */
export const capDepth = (frame: number): number => {
  const press = (P: number, contact: number) => {
    if (frame < P) return 0;
    if (frame < P + contact) return EASE.outCubic(clamp01((frame - P) / contact));
    if (frame < P + contact + 3) return 1;
    return 1 - progress(frame, P + contact + 3, 5, EASE.arrive);
  };
  return Math.max(press(F.press, 3), press(F.realPress, 2));
};

/** "?" preview state (S02 flash-forward only): 0 = OFF, 1 = ON, with the flip. */
export const qOn = (frame: number): number => {
  if (frame < F.qWakes || frame >= F.ret + 5) return frame >= F.ret && frame < F.ret + 5 ? 1 - progress(frame, F.ret, 5, EASE.arrive) : 0;
  return progress(frame, F.qWakes, 5, EASE.arrive);
};

export const camTransform = (c: Cam): string => `matrix(${c.s} 0 0 ${c.s} ${c.tx} ${c.ty})`;

/* ------------------------------------------------------------------------------------------------ */

/** IEC 60417-5009 power symbol: an open circle with a stroke through the gap at the top. */
const PowerSymbol: React.FC<{c: Pt; r: number; color: string; sw: number}> = ({c, r, color, sw}) => {
  const a = (38 * Math.PI) / 180;
  const sx = c[0] + r * Math.sin(a);
  const ex = c[0] - r * Math.sin(a);
  const sy = c[1] - r * Math.cos(a);
  return (
    <g>
      <path d={`M${sx} ${sy}A${r} ${r} 0 1 1 ${ex} ${sy}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" vectorEffect={NS} />
      <path d={`M${c[0]} ${c[1] - r * 1.2}V${c[1] - r * 0.2}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" vectorEffect={NS} />
    </g>
  );
};

const Fan: React.FC = () => {
  const [cx, cy] = M.FAN_C;
  const r = M.FAN_R;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={FILL.body} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke={FILL.detail} strokeWidth={W.hair} vectorEffect={NS} />
      {[0, 1, 2, 3, 4].map((k) => {
        const a = (k * 72 * Math.PI) / 180;
        const x0 = cx + Math.cos(a) * r * 0.26;
        const y0 = cy + Math.sin(a) * r * 0.26;
        const x1 = cx + Math.cos(a + 0.55) * r * 0.9;
        const y1 = cy + Math.sin(a + 0.55) * r * 0.9;
        const qx = cx + Math.cos(a + 0.05) * r * 0.75;
        const qy = cy + Math.sin(a + 0.05) * r * 0.75;
        return <path key={k} d={`M${x0} ${y0}Q${qx} ${qy} ${x1} ${y1}`} fill="none" stroke={T.structure} strokeWidth={W.thin} strokeLinecap="round" vectorEffect={NS} />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.24} fill={FILL.bodyDark} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
    </g>
  );
};

const Cpu: React.FC = () => {
  const c = M.CPU;
  const i = M.IHS;
  const nh = 40; // notch height
  const nw = 7;
  const my = i.y + i.h / 2;
  // heat spreader with the LGA1700-style notches on both sides
  const ihs =
    `M${i.x + 8} ${i.y}H${i.x + i.w - 8}Q${i.x + i.w} ${i.y} ${i.x + i.w} ${i.y + 8}` +
    `V${my - nh / 2}H${i.x + i.w - nw}V${my + nh / 2}H${i.x + i.w}` +
    `V${i.y + i.h - 8}Q${i.x + i.w} ${i.y + i.h} ${i.x + i.w - 8} ${i.y + i.h}` +
    `H${i.x + 8}Q${i.x} ${i.y + i.h} ${i.x} ${i.y + i.h - 8}` +
    `V${my + nh / 2}H${i.x + nw}V${my - nh / 2}H${i.x}V${i.y + 8}Q${i.x} ${i.y} ${i.x + 8} ${i.y}Z`;
  return (
    <g>
      <Box b={c} fill={FILL.body} stroke={T.structure} sw={W.inactive} />
      <path d={ihs} fill={FILL.cpuDark} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      {/* pin-1 marker */}
      <path d={`M${c.x + 7} ${c.y + c.h - 7}l14 0l-14 -14z`} fill={T.structure} />
    </g>
  );
};

const Dimm: React.FC<{b: M.Rect}> = ({b}) => (
  <g>
    <rect x={b.x - 1} y={b.y - 9} width={b.w + 2} height={7} rx={2} fill={FILL.detail} />
    <rect x={b.x - 1} y={b.y + b.h + 2} width={b.w + 2} height={7} rx={2} fill={FILL.detail} />
    <Box b={b} fill={FILL.body} stroke={T.structure} sw={W.thin} />
    {[0, 1, 2, 3].map((k) => (
      <rect key={k} x={b.x + 4} y={b.y + 14 + k * 54} width={b.w - 8} height={34} rx={1.5} fill={FILL.detail} />
    ))}
  </g>
);

const M2: React.FC = () => {
  const b = M.M2;
  return (
    <g>
      <Box b={b} fill={FILL.body} stroke={T.structure} sw={W.thin} />
      <rect x={b.x + 30} y={b.y + 7} width={52} height={b.h - 14} rx={2} fill={FILL.detail} />
      <rect x={b.x + 92} y={b.y + 7} width={52} height={b.h - 14} rx={2} fill={FILL.detail} />
      <rect x={b.x + 156} y={b.y + 9} width={26} height={b.h - 18} rx={2} fill={FILL.bodyDark} />
      <circle cx={b.x + b.w - 12} cy={b.y + b.h / 2} r={5} fill={T.panel} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      <path d={`M${b.x + 12} ${b.y}V${b.y + b.h}`} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
    </g>
  );
};

const RearIO: React.FC = () => {
  const b = M.IO;
  return (
    <g>
      <Box b={b} fill={FILL.body} stroke={T.structure} sw={W.thin} />
      {/* USB pairs, a display output, the network jack */}
      {[478, 498, 518].map((y) => (
        <rect key={y} x={b.x + 6} y={y} width={b.w - 12} height={12} rx={1.5} fill="none" stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      ))}
      <path d={`M${b.x + 6} ${540}H${b.x + b.w - 6}V${556}H${b.x + 12}L${b.x + 6} ${550}Z`} fill="none" stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      <Box b={M.RJ45} fill={FILL.bodyDark} stroke={T.structure} sw={W.thin} />
      <rect x={M.RJ45.x + 8} y={M.RJ45.y + M.RJ45.h - 8} width={8} height={6} fill={T.panel} />
    </g>
  );
};

const Psu: React.FC = () => {
  const b = M.PSU;
  return (
    <g>
      <Box b={b} fill={T.panel} stroke={T.structure} sw={W.inactive} />
      <Fan />
      {/* vent slots */}
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={k} x={b.x + 120 + k * 18} y={b.y + 64} width={8} height={26} rx={3} fill={FILL.body} stroke={FILL.detail} strokeWidth={W.hair} vectorEffect={NS} />
      ))}
    </g>
  );
};

const InletPlugRocker: React.FC = () => {
  const p = M.PLUG;
  const r = M.ROCKER;
  return (
    <g>
      {/* cord to the wall socket */}
      <Line pts={M.CORD} stroke={T.ink} sw={W.cord} r={0} />
      {/* IEC inlet on the PSU's rear face, with the plug seated (solid ink) */}
      <Box b={M.INLET} fill={FILL.bodyDark} stroke={T.structure} sw={W.thin} />
      <path
        d={`M${p.x} ${p.y + 4}Q${p.x} ${p.y} ${p.x + 4} ${p.y}H${p.x + p.w}V${p.y + p.h}H${p.x + 4}Q${p.x} ${p.y + p.h} ${p.x} ${p.y + p.h - 4}Z`}
        fill={T.ink}
      />
      {/* rocker switch at "I" (the I side pressed in) */}
      <Box b={r} fill={T.panel} stroke={T.structure} sw={W.thin} />
      <rect x={r.x + 2} y={r.y + 2} width={r.w - 4} height={r.h / 2 - 2} rx={1} fill={T.ink} />
      <path d={`M${r.x + r.w / 2} ${r.y + 5}V${r.y + r.h / 2 - 3}`} stroke={T.panel} strokeWidth={1.6} vectorEffect={NS} />
      <circle cx={r.x + r.w / 2} cy={r.y + r.h * 0.75} r={2.6} fill="none" stroke={T.structure} strokeWidth={1.3} vectorEffect={NS} />
    </g>
  );
};

const WallSocket: React.FC = () => {
  const s = M.SOCKET;
  const cx = s.x + s.w / 2;
  return (
    <g>
      <Box b={s} fill={T.panel} stroke={T.structure} sw={W.inactive} />
      <rect x={cx - 11} y={s.y + 12} width={5} height={14} rx={1.5} fill={T.structure} />
      <rect x={cx + 6} y={s.y + 12} width={5} height={14} rx={1.5} fill={T.structure} />
      <path d={`M${cx - 5} ${s.y + 38}a5 5 0 0 1 10 0z`} fill={T.structure} />
    </g>
  );
};

const FrontPanel: React.FC<{frame: number}> = ({frame}) => {
  const f = M.FRONT;
  const [bx, by] = M.BUTTON_C;
  const d = capDepth(frame);
  const capScale = 1 - 0.1 * d;
  return (
    <g>
      <Box b={f} fill={T.panel} stroke={T.structure} sw={W.inactive} />
      {/* power LED: off for the whole intro */}
      <circle cx={M.LED_C[0]} cy={M.LED_C[1]} r={6} fill={FILL.body} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      {/* bezel + momentary cap */}
      <circle cx={bx} cy={by} r={M.BUTTON_R} fill={FILL.body} stroke={T.ink} strokeWidth={W.inactive} vectorEffect={NS} />
      <g transform={`translate(${bx} ${by + 3 * d}) scale(${capScale}) translate(${-bx} ${-by})`}>
        <circle cx={bx} cy={by} r={M.CAP_R} fill={d > 0.05 ? FILL.body : T.panel} stroke={T.ink} strokeWidth={W.thin} vectorEffect={NS} />
        <PowerSymbol c={[bx, by + 1]} r={8.5} color={T.ink} sw={2.6} />
      </g>
    </g>
  );
};

const Monitor: React.FC = () => {
  const m = M.MONITOR;
  const cx = m.x + m.w / 2;
  return (
    <g>
      <rect x={cx - 11} y={m.y + m.h} width={22} height={34} fill={FILL.body} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      <rect x={cx - 64} y={m.y + m.h + 32} width={128} height={10} rx={5} fill={FILL.body} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
      <Box b={m} fill={FILL.body} stroke={T.structure} sw={W.inactive} />
      <rect x={m.x + 10} y={m.y + 10} width={m.w - 20} height={m.h - 22} rx={4} fill={FILL.screen} />
    </g>
  );
};

/** Board, parts, data links. */
export const MapBase: React.FC<{cam: Cam; frame: number}> = ({cam, frame}) => {
  const B = M.BOARD;
  return (
    <g transform={camTransform(cam)}>
      <WallSocket />
      <Monitor />
      {/* the motherboard: one white plate */}
      <Box b={B} fill={FILL.plate} stroke={FILL.plateEdge} sw={W.thin} />
      {M.HOLES.map(([x, y], k) => (
        <circle key={k} cx={x} cy={y} r={7} fill={T.surface} stroke={FILL.plateEdge} strokeWidth={W.thin} vectorEffect={NS} />
      ))}
      <RearIO />
      <Box b={M.LAN} fill={FILL.bodyDark} stroke={T.structure} sw={W.thin} />
      {M.LINKS.map((pts, k) => (
        <Line key={k} pts={pts} stroke={T.structure} sw={W.route} />
      ))}
      <Cpu />
      {M.DIMMS.map((b, k) => (
        <Dimm key={k} b={b} />
      ))}
      <M2 />
      {/* chipset (PCH) package */}
      <Box b={M.CHIPSET} fill={FILL.body} stroke={T.structure} sw={W.inactive} />
      <Psu />
      <InletPlugRocker />
      <FrontPanel frame={frame} />
    </g>
  );
};

/** Connectors that sit on top of the channels and routes, and the chipset's two blocks. */
export const MapOver: React.FC<{cam: Cam; frame: number; qOverride?: number}> = ({cam, frame, qOverride}) => {
  const a = M.ATX24;
  const h = M.HEADER;
  const q = qOverride ?? qOn(frame);
  const qb = M.QBLOCK;
  const look = M.LOOKOUT;
  const clockIn = progress(frame, F.wake, 8, EASE.arrive);
  return (
    <g transform={camTransform(cam)}>
      {/* 24-pin ATX connector on the board's bottom edge */}
      <Box b={a} fill={FILL.bodyDark} stroke={T.structure} sw={W.thin} />
      {Array.from({length: 12}).map((_, i) => (
        <React.Fragment key={i}>
          <rect x={a.x + 4 + i * 7.83} y={a.y + 4} width={4.6} height={6} rx={1} fill={FILL.body} />
          <rect x={a.x + 4 + i * 7.83} y={a.y + 14} width={4.6} height={6} rx={1} fill={FILL.body} />
        </React.Fragment>
      ))}
      {/* the PSU's cable exit: standby and main leave the same supply side by side */}
      <Box b={M.PSU_EXIT} fill={FILL.bodyDark} stroke={T.structure} sw={W.thin} />
      {/* standby regulators */}
      <Box b={M.REGS} fill={FILL.bodyDark} stroke={T.structure} sw={W.thin} />
      <rect x={M.REGS.x + 5} y={M.REGS.y + 5} width={M.REGS.w - 10} height={M.REGS.h - 10} rx={2} fill={FILL.body} />
      {/* front-panel header */}
      <Box b={h} fill={FILL.bodyDark} stroke={T.structure} sw={W.thin} />
      {Array.from({length: 5}).map((_, i) => (
        <React.Fragment key={i}>
          <rect x={h.x + 4 + i * 8} y={h.y + 3} width={4} height={4} fill={FILL.body} />
          <rect x={h.x + 4 + i * 8} y={h.y + 11} width={4} height={4} fill={FILL.body} />
        </React.Fragment>
      ))}
      {/* the "?" block: OFF (dim) except as a preview state in S02 */}
      <Box b={qb} fill={q > 0 ? T.panel : FILL.bodyDark} stroke={q > 0.5 ? T.ink : T.structure} sw={q > 0.5 ? W.active : W.inactive} />
      {q > 0 ? (
        <rect
          x={qb.x - 6 * q}
          y={qb.y - 6 * q}
          width={qb.w + 12 * q}
          height={qb.h + 12 * q}
          rx={(qb.r ?? 0) + 6 * q}
          fill="none"
          stroke={T.structure}
          strokeWidth={W.inactive}
          vectorEffect={NS}
          opacity={q}
        />
      ) : null}
      {/* the always-on block ("lookout"): ON from frame 0 */}
      <Box b={look} fill={T.panel} stroke={T.ink} sw={W.active} />
      {/* the chipset's RTC alarm, drawn on first use (S11 "reason") */}
      {clockIn > 0 ? (
        <g opacity={clockIn}>
          <circle cx={M.CLOCK[0]} cy={M.CLOCK[1]} r={10} fill={T.panel} stroke={T.structure} strokeWidth={W.thin} vectorEffect={NS} />
          <path d={`M${M.CLOCK[0]} ${M.CLOCK[1] - 6}V${M.CLOCK[1]}H${M.CLOCK[0] + 5}`} fill="none" stroke={T.structure} strokeWidth={W.thin} strokeLinecap="round" vectorEffect={NS} />
        </g>
      ) : null}
    </g>
  );
};

export const boxPath = (b: M.Rect): string => rectPath(b.x, b.y, b.w, b.h, b.r ?? 0);
