/**
 * Ep06 UI kit: <KeyCap>, physical paper-white key caps that press with travel, a squashed skirt, a tightening shadow
 * and a flash. One key ("Delete") or a combo (["Shift", "Delete"] → Shift + Delete; Shift goes down first and holds).
 *
 *   <KeyCap frame={f} keys={['Shift', 'Delete']} x={420} y={820} at={a - 12} pressAt={a} exitAt={a + 60} />
 *
 * (x, y) = centre of the row in parent px. Labels are chips (≥ 40 px on screen): use `screen` inside a zoomed Stage.
 */
import React, {useContext} from 'react';
import {EASE, PAL, SANS, SPRING} from '../look';
import {CameraContext, screenScale} from '../camera';
import {useTextCheck} from '../text';
import {clamp01, prog, rgba, springAt} from '../util';

export type KeyCapProps = {
  frame: number;
  keys: readonly string[];
  x: number;
  y: number;
  /** appear (pop) */
  at?: number;
  /** the press (combo: the first key goes down here, each next one `stagger` frames later) */
  pressAt?: number | readonly number[];
  /** frames held down */
  hold?: number;
  stagger?: number;
  exitAt?: number;
  /** label size in px (default 52) */
  size?: number;
  /** flash colour on the press (default ink) */
  flash?: string;
  screen?: boolean | number;
};

/** Depth 0..1 of a key at a frame for one press at p (fast down, hold, spring up). */
const depthAt = (f: number, p: number, hold: number): number => {
  if (f < p) return 0;
  const t = f - p;
  if (t < 3) return EASE.out(t / 3);
  if (t < 3 + hold) return 1;
  return 1 - springAt(f, p + 3 + hold, SPRING.snap);
};

const Cap: React.FC<{label: string; size: number; depth: number; flash: number; flashColor: string}> = ({label, size, depth: d, flash, flashColor}) => {
  const travel = size * 0.3;
  const skirt = size * 0.42;
  const w = Math.max(size * 4.2, label.length * size * 0.64 + size * 1.7);
  const h = size * 2.6;
  return (
    <div style={{position: 'relative', width: w, height: h + skirt}}>
      <div
        style={{
          position: 'absolute',
          left: size * 0.1 - (1 - d) * size * 0.25,
          right: size * 0.1 - (1 - d) * size * 0.25,
          top: h + skirt * 0.55,
          height: size * 0.6,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0))',
          opacity: 0.85 - 0.35 * d,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: travel * d + size * 0.18,
          width: w,
          height: h + skirt - travel * d - size * 0.18,
          borderRadius: size * 0.42,
          background: `linear-gradient(180deg, ${PAL.tileEdge}, #8D96A7 70%, #6E7788)`,
          boxShadow: `0 ${size * 0.1}px ${size * 0.25}px rgba(0,0,0,0.5)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: size * 0.12,
          top: travel * d,
          width: w - size * 0.24,
          height: h - size * 0.1,
          borderRadius: size * 0.36,
          background: `linear-gradient(170deg, #FFFFFF, ${PAL.tile} 35%, ${PAL.tileMid})`,
          boxShadow: `inset 0 ${-size * 0.08}px ${size * 0.16}px rgba(20,32,58,0.18), inset 0 ${size * 0.05}px 0 rgba(255,255,255,0.9)${
            flash > 0.01 ? `, 0 0 ${size * 1.2 * flash}px ${rgba(flashColor, 0.7 * flash)}` : ''
          }`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: size,
          color: PAL.tileInk,
          letterSpacing: '-0.01em',
          filter: flash > 0.01 ? `brightness(${1 + 0.12 * flash})` : undefined,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const KeyCap: React.FC<KeyCapProps> = ({frame: f, keys, x, y, at, pressAt, hold = 8, stagger = 4, exitAt, size = 52, flash = PAL.ink, screen}) => {
  const inv = screenScale(screen, useContext(CameraContext));
  useTextCheck('chip', size, screen, `KeyCap ${keys.join(' + ')}`);
  const pin = at === undefined ? 1 : springAt(f, at, SPRING.pop);
  const pout = exitAt === undefined ? 0 : prog(f, exitAt, 8, EASE.inCubic);
  if (pin <= 0.001 || pout >= 1) return null;
  const presses = pressAt === undefined ? [] : typeof pressAt === 'number' ? [pressAt] : pressAt;
  const n = keys.length;
  const depthOf = (i: number): number => {
    let d = 0;
    for (const p of presses) d = Math.max(d, depthAt(f, p + i * stagger, hold + (n - 1 - i) * stagger));
    return d;
  };
  const flashOf = (i: number): number => {
    let v = 0;
    for (const p of presses) {
      const t = f - (p + i * stagger) - 2;
      if (t >= 0 && t < 16) v = Math.max(v, Math.exp(-t / 4));
    }
    return v;
  };
  const lastHit = presses.reduce((m, p) => (f >= p + (n - 1) * stagger ? Math.max(m, p + (n - 1) * stagger) : m), -1e9);
  const ringT = f - lastHit - 2;
  const shakeK = ringT >= 0 && ringT < 10 ? Math.exp(-ringT / 3) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${inv})`, transformOrigin: '0 0'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(-50%, -50%) translate(${shakeK * 4 * Math.sin(ringT * 2.7)}px, ${-pout * 30}px) scale(${Math.max(0, pin) * (1 - 0.1 * pout)})`,
          opacity: clamp01(pin * 3) * (1 - pout),
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.45,
        }}
      >
        {ringT >= 0 && ringT < 16 ? (
          <div
            style={{
              position: 'absolute',
              left: '-25%',
              right: '-25%',
              top: '-70%',
              bottom: '-70%',
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${rgba(flash, 0.3 * (1 - ringT / 16))}, ${rgba(flash, 0.08 * (1 - ringT / 16))} 55%, ${rgba(flash, 0)})`,
              transform: `scale(${0.7 + 0.5 * EASE.out(ringT / 16)})`,
            }}
          />
        ) : null}
        {keys.map((k, i) => (
          <React.Fragment key={i}>
            {i > 0 ? <div style={{position: 'relative', fontFamily: SANS, fontWeight: 700, fontSize: size * 1.1, color: PAL.ink, marginTop: -size * 0.3}}>+</div> : null}
            <div style={{position: 'relative'}}>
              <Cap label={k} size={size} depth={depthOf(i)} flash={flashOf(i)} flashColor={flash} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
