/**
 * S2 token bench: BIM154 (token bench, front view) cut into slices and rebuilt with one slot per token, each slot as
 * wide as its tile. Drawn in two layers so tiles sit between them: <BenchBack> (top rail, empty slot interiors) and
 * <BenchFront> (the notched steel lip, dividers, end caps). Slices were cut from the asset by a script and live here.
 */
import React from 'react';
import {Img} from 'remotion';
import {rgba} from '../../kit';
import capL from './cap_l.png';
import capR from './cap_r.png';
import divider from './divider.png';
import topbar from './topbar.png';
import lipL from './lip_l.png';
import lipN from './lip_n.png';
import lipR from './lip_r.png';

/** native → world scale of the bench */
export const BK = 0.44;
const NATIVE = {capL: 82, capR: 83, div: 31, notch: 76, y0: 186, capH: 474, divH: 420, topH: 25, lipY: 380, lipH: 226};

export type BenchGeo = {
  k: number;
  y: number;
  x0: number;
  x1: number;
  /** slot centres and inner widths */
  slots: {cx: number; w: number; x0: number}[];
  /** native y → world y */
  Y: (ny: number) => number;
};

/** Geometry of a bench whose tile centre line is y, centred on cx, with the given inner slot widths (world px). */
export const benchGeo = (inner: readonly number[], cx: number, y: number, k = BK): BenchGeo => {
  const capLW = NATIVE.capL * k;
  const capRW = NATIVE.capR * k;
  const divW = NATIVE.div * k;
  const total = capLW + inner.reduce((a, b) => a + b, 0) + divW * (inner.length - 1) + capRW;
  const x0 = cx - total / 2;
  let x = x0 + capLW;
  const slots = inner.map((w, i) => {
    const s = {cx: x + w / 2, w, x0: x};
    x += w + (i < inner.length - 1 ? divW : 0);
    return s;
  });
  // the lip's top edge (native 406) sits 32 px below the tile centre, so a 108-px tile shows ≈ 80 % above it
  const Y = (ny: number) => y + 32 + (ny - 406) * k;
  return {k, y, x0, x1: x0 + total, slots, Y};
};

const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({position: 'absolute', left, top, width, height});

/** Behind the tiles: the top rail and the dark, empty slot interiors, plus the bench's contact shadow. */
export const BenchShadow: React.FC<{g: BenchGeo; dy?: number; opacity?: number}> = ({g, dy = 0, opacity = 1}) => (
  <div
    style={{
      ...abs(g.x0 - 40, g.Y(560) + dy, g.x1 - g.x0 + 80, 150 * g.k + 60),
      opacity,
      borderRadius: '50%',
      background: 'radial-gradient(closest-side, rgba(0,0,0,0.72), rgba(0,0,0,0.3) 60%, rgba(0,0,0,0))',
      filter: 'blur(10px)',
    }}
  />
);

export const BenchBack: React.FC<{g: BenchGeo; dy?: number; opacity?: number; light?: number; shadow?: boolean}> = ({g, dy = 0, opacity = 1, light = 0, shadow = true}) => {
  const {k, Y} = g;
  return (
    <div style={{position: 'absolute', left: 0, top: dy, width: 0, height: 0, opacity}}>
      {shadow ? (
        <div
          style={{
            ...abs(g.x0 - 40, Y(560), g.x1 - g.x0 + 80, 150 * k + 60),
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.72), rgba(0,0,0,0.3) 60%, rgba(0,0,0,0))',
            filter: 'blur(10px)',
          }}
        />
      ) : null}
      {g.slots.map((s, i) => (
        <React.Fragment key={i}>
          <Img src={topbar} style={abs(s.x0 - 0.5, Y(NATIVE.y0), s.w + 1, NATIVE.topH * k)} />
          <div
            style={{
              ...abs(s.x0 - 0.5, Y(211) - 0.5, s.w + 1, (446 - 211) * k),
              background: `linear-gradient(180deg, #070B13 0%, #0E1522 22%, #152036 70%, ${rgba('#1E2C46', 1)} 100%)`,
              boxShadow: `inset 0 ${10 * k + 4}px ${16 * k + 6}px rgba(0,0,0,0.75), inset ${6}px 0 ${10}px rgba(0,0,0,0.45), inset ${-6}px 0 ${10}px rgba(0,0,0,0.45)`,
            }}
          />
          {light > 0 ? (
            <div
              style={{
                ...abs(s.x0, Y(330), s.w, (446 - 330) * k),
                background: `linear-gradient(180deg, ${rgba('#2E6FA8', 0)} 0%, ${rgba('#2E9FD8', 0.22 * light)} 100%)`,
              }}
            />
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
};

/** In front of the tiles: the notched steel lip under every slot, the dividers and both end caps. */
export const BenchFront: React.FC<{g: BenchGeo; dy?: number; opacity?: number; sweep?: number | null}> = ({g, dy = 0, opacity = 1, sweep = null}) => {
  const {k, Y} = g;
  const lipTop = Y(NATIVE.lipY);
  const lipH = NATIVE.lipH * k;
  const nW = NATIVE.notch * k;
  return (
    <div style={{position: 'absolute', left: 0, top: dy, width: 0, height: 0, opacity}}>
      {g.slots.map((s, i) => {
        const side = Math.max(1, (s.w - nW) / 2);
        return (
          <React.Fragment key={i}>
            <Img src={lipL} style={abs(s.x0 - 0.5, lipTop, side + 1, lipH)} />
            <Img src={lipN} style={abs(s.x0 + side, lipTop, nW, lipH)} />
            <Img src={lipR} style={abs(s.x0 + side + nW - 0.5, lipTop, s.w - side - nW + 1, lipH)} />
            {i < g.slots.length - 1 ? <Img src={divider} style={abs(s.x0 + s.w, Y(NATIVE.y0), NATIVE.div * k, NATIVE.divH * k)} /> : null}
          </React.Fragment>
        );
      })}
      <Img src={capL} style={abs(g.x0, Y(NATIVE.y0), NATIVE.capL * k, NATIVE.capH * k)} />
      <Img src={capR} style={abs(g.x1 - NATIVE.capR * k, Y(NATIVE.y0), NATIVE.capR * k, NATIVE.capH * k)} />
      {sweep !== null && sweep >= 0 && sweep <= 1 ? (
        <div
          style={{
            ...abs(g.x0, Y(410), g.x1 - g.x0, (490 - 410) * k),
            background: `linear-gradient(100deg, rgba(255,255,255,0) ${sweep * 130 - 22}%, ${rgba('#FFFFFF', 0.32 * Math.sin(Math.PI * sweep))} ${sweep * 130 - 15}%, rgba(255,255,255,0) ${sweep * 130 - 8}%)`,
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
};
