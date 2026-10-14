/**
 * S5 local prop: the stalled save (`extra-hourglass`, P11 "writes would slow down"). The render is not in the kit's
 * ASSET_INFO, so it is drawn here with the same treatment as a kit Prop: pop-in, float, contact shadow, a soft coral
 * glow, and it turns over (heavy spring) on each `flips` frame. Hud (screen px). No digits.
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {EASE, PAL, SPRING, clamp01, prog, rgba, springAt} from '../../kit';

const SRC = staticFile('ep06/assets/extra-hourglass.png');
// native 1254×1254, alpha bbox 344,66–912,1192
const BB = {x0: 344, y0: 66, x1: 912, y1: 1192};
const BW = BB.x1 - BB.x0;
const BH = BB.y1 - BB.y0;

export const Hourglass: React.FC<{frame: number; x: number; y: number; h: number; at: number; flips: readonly number[]; exitAt: number}> = ({frame: f, x, y, h, at, flips, exitAt}) => {
  const pin = springAt(f, at, SPRING.pop);
  const out = prog(f, exitAt, 10, EASE.inCubic);
  if (pin <= 0.001 || out >= 1) return null;
  const k = h / BH;
  const w = BW * k;
  const rot = flips.reduce((a, t) => a + 180 * springAt(f, t, {damping: 13, stiffness: 140, mass: 1.1}), 0);
  const fl = 5 * Math.sin(f / 19);
  const s = (0.55 + 0.45 * pin) * (1 - 0.25 * out);
  const op = clamp01(pin * 2.5) * (1 - out);
  // the glow pulses while the save waits; brighter right after each turn
  const kick = flips.reduce((m, t) => Math.max(m, f >= t ? Math.exp(-(f - t) / 10) : 0), 0);
  const glow = 0.22 + 0.08 * Math.sin(f / 7) + 0.3 * kick;
  return (
    <div style={{position: 'absolute', left: x, top: y + fl + 40 * out, width: 0, height: 0, opacity: op, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: -w * 0.9, top: -h * 0.62, width: w * 1.8, height: h * 1.24, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#04070D', 0.72)}, ${rgba('#04070D', 0)})`}} />
      <div style={{position: 'absolute', left: -w * 0.8, top: -h * 0.5, width: w * 1.6, height: h, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.loss, glow)}, ${rgba(PAL.loss, 0)})`}} />
      <div style={{position: 'absolute', left: -w * 0.62, top: h * 0.5 - fl + 2, width: w * 1.24, height: h * 0.09, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0))`}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transform: `scale(${s}) rotate(${rot}deg)`}}>
        <Img src={SRC} style={{position: 'absolute', left: -BB.x0 * k - w / 2, top: -BB.y0 * k - h / 2, width: 1254 * k, height: 1254 * k}} />
      </div>
    </div>
  );
};
