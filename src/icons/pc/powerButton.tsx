/**
 * `powerButton` (ICONS.md §4.17): the case's momentary power button, r 36 (72 × 72), the protagonist of Ep01.
 * Base: machined bezel ring (bodyLo) with its 2.5D side, the dark gap, the cap (bodyHi, r 27) standing proud on its own
 * lip with a rim light, and the IEC 60417-5009 power symbol in 3 px `structure`.
 * `press` 0..1: the cap scales 1 → 0.9, its lip sinks, its symbol and rim dim 20 %, and a 2 px inner side ring appears.
 * Passive (a switch has no powered state); `pointed` and `glow` still apply.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {
  DetailGroup,
  Detail,
  Glow,
  Lines,
  Outline,
  Raised,
  RimArc,
  Shell,
  Stroke,
  TopFace,
  basePorts,
  clamp01,
  discD,
  discHullPath,
  lerp,
  mix,
  resolveBase,
  sw,
} from '../primitives';
import {powerSymbolGeometry} from '../glyphs/powerSymbol';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export interface PowerButtonProps extends IconBaseProps {
  /** 0..1 cap travel (the engine drives contact in 3 frames and release over frames 6–11). */
  press?: number;
}

export const PowerButton: React.FC<PowerButtonProps> = (p) => {
  const b = resolveBase(p, true);
  const press = clamp01(p.press ?? 0);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  const R = Math.min(b.w, b.h) / 2;
  const k = R / 36;
  const bezelD = discD(cx, cy, R);
  const gapR = 30.5 * k;
  const capR = 27 * k * lerp(1, 0.9, press);
  const capSide = b.sideK(0.28 * (1 - press));
  const capD = discD(cx, cy, capR);
  const dim = 1 - 0.2 * press;
  const sym = powerSymbolGeometry(cx, cy, 30 * k * lerp(1, 0.9, press), sw(STROKE.part, b.zoom));
  const symCol = mix(COLOR.structure, COLOR.textMuted, b.pointed);
  return (
    <Shell b={b}>
      <Raised d={bezelD} hull={discHullPath(cx, cy, R, b.side)} />
      <TopFace d={bezelD} fill={COLOR.bodyLo} />
      {/* machined gap between bezel and cap */}
      <TopFace d={discD(cx, cy, gapR)} fill={COLOR.side} />
      <Raised d={capD} hull={discHullPath(cx, cy, capR, capSide)} />
      <TopFace d={capD} fill={COLOR.bodyHi} />
      <DetailGroup b={b}>
        {/* concentric machining rings: one on the bezel, one on the cap's face */}
        <Detail d={discD(cx, cy, 33.4 * k)} zoom={b.zoom} opacity={0.8} />
        <Detail d={discD(cx, cy, capR * 0.86)} zoom={b.zoom} opacity={0.45 * dim} />
      </DetailGroup>
      <RimArc cx={cx} cy={cy} r={R} zoom={b.zoom} />
      <RimArc cx={cx} cy={cy} r={capR} zoom={b.zoom} inset={b.s(1.5)} opacity={dim} />
      <Lines>
        {press > 0 ? <Stroke d={discD(cx, cy, capR + b.s(1))} zoom={b.zoom} color={COLOR.side} width={2} opacity={press} /> : null}
        <Stroke d={capD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} opacity={0.9 * dim} />
        <g opacity={dim}>
          <path d={sym.bar} fill="none" stroke={symCol} strokeWidth={sw(STROKE.part, b.zoom)} strokeLinecap="round" />
          <path d={sym.arc} fill="none" stroke={symCol} strokeWidth={sw(STROKE.part, b.zoom)} strokeLinecap="round" />
        </g>
      </Lines>
      <Glow d={bezelD} zoom={b.zoom} alpha={b.glow} />
      <Outline d={bezelD} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
    </Shell>
  );
};

export const powerButtonPorts = (p: PowerButtonProps): Ports => {
  const cx = p.x + p.w / 2;
  const cy = p.y + p.h / 2;
  const R = Math.min(p.w, p.h) / 2;
  return {
    ...basePorts(p, true),
    center: [cx, cy],
    leadOut: [cx, cy - R],
    /** The rect the brackets lock on (the bezel; the Brackets glyph adds its own 8 px pad). */
    bracketBox: [cx - R, cy - R],
    bracketBoxEnd: [cx + R, cy + R],
  };
};

export const powerButtonSpec: IconSpec<PowerButtonProps> = {
  type: 'powerButton',
  component: PowerButton,
  size: {w: 72, h: 72},
  z: 6,
  passive: true,
  ports: powerButtonPorts,
};
