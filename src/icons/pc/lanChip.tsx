/**
 * `lanChip` (ICONS.md §4.13): the Ethernet controller, a QFN package (34 × 26, z 4) with perimeter pads on all four
 * sides and the pin-1 dot (base). Detail: the die outline. `off` in Ep01 (unlabelled).
 * Ports: `in` (left), `out` (right), `center`.
 */
import React from 'react';
import {COLOR} from '../../engine/tokens';
import {
  DetailGroup,
  Detail,
  Glow,
  Lines,
  Outline,
  Pip,
  Raised,
  RimLight,
  Shell,
  StateHatch,
  TopFace,
  basePorts,
  discD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import type {IconBaseProps, IconSpec, Ports} from '../types';

export const LanChip: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, false);
  const k = Math.min(b.w / 34, b.h / 26);
  const body: Rect = {x: b.x + 2.5 * k, y: b.y + 2.5 * k, w: b.w - 5 * k, h: b.h - 5 * k};
  const r = 2 * k;
  const d = rectD(body, r);
  let pads = '';
  const pl = 3.4 * k;
  const pw = 1.6 * k;
  for (let x = body.x + 4 * k; x <= body.x + body.w - 4 * k + 0.01; x += (body.w - 8 * k) / 6) {
    pads += rectD({x: x - pw / 2, y: b.y, w: pw, h: pl}, 0.3 * k);
    pads += rectD({x: x - pw / 2, y: b.y + b.h - pl, w: pw, h: pl}, 0.3 * k);
  }
  for (let y = body.y + 4 * k; y <= body.y + body.h - 4 * k + 0.01; y += (body.h - 8 * k) / 4) {
    pads += rectD({x: b.x, y: y - pw / 2, w: pl, h: pw}, 0.3 * k);
    pads += rectD({x: b.x + b.w - pl, y: y - pw / 2, w: pl, h: pw}, 0.3 * k);
  }
  return (
    <Shell b={b}>
      <TopFace d={pads} fill={COLOR.detail} />
      <Raised d={d} hull={raisedHullPath(body, r, b.side)} />
      <TopFace d={d} fill={b.act(COLOR.body)} />
      <StateHatch b={b} clipD={d} rect={body} />
      <Lines>
        <TopFace d={discD(body.x + 4 * k, body.y + 4 * k, 1.7 * k)} fill={COLOR.detail} />
      </Lines>
      <DetailGroup b={b}>
        <Detail d={rectD({x: body.x + body.w * 0.3, y: body.y + body.h * 0.3, w: body.w * 0.4, h: body.h * 0.4}, 1 * k)} zoom={b.zoom} />
      </DetailGroup>
      <RimLight rect={body} radius={r} zoom={b.zoom} />
      <Glow d={d} zoom={b.zoom} alpha={b.glow} />
      <Outline d={d} state={b.state} flip={b.flip} frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      <Pip rect={b.rect} dock={b.pip} state={b.state} zoom={b.zoom} frame={b.frame} flip={b.flip} />
    </Shell>
  );
};

export const lanChipSpec: IconSpec<IconBaseProps> = {
  type: 'lanChip',
  component: LanChip,
  size: {w: 34, h: 26},
  z: 4,
  passive: false,
  ports: (p): Ports => ({...basePorts(p, false), in: [p.x, p.y + p.h / 2], out: [p.x + p.w, p.y + p.h / 2]}),
};
