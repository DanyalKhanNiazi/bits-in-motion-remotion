// S8 shots A and E1: the Bridge with two physical levers on its floor.
//   lever A, "Fewer bytes per token" (quantised weights: the crates shrink)
//   lever B, "More tokens per trip" (batching, then speculative decoding: more tiles out of each arrival)
import React from 'react';
import {
  AtlasOpener,
  Bridge,
  EASE,
  KineticText,
  PAL,
  SANS,
  SPRING,
  Stage,
  basis,
  bridgeAnchors,
  bridgeCam,
  clamp01,
  lerp,
  project,
  prog,
  pxPerUnit,
  rgba,
  springAt,
  track,
  type BridgeProps,
  type Cam3,
  type V3,
} from '../../kit';
import {W} from './T';
import {Lever} from './Lever';
import {MiniTile, arcPt} from './common';

/** Lever A notch angles (also used by shot C) and lever B's two states. */
export const NOTCH = {b16: -24, b8: -6, b4: 12, coral: 21, crush: 31} as const;
export const LEVER_B = {off: -24, on: 22} as const;

const c3 = (tx: number, ty: number, tz: number, yaw: number, pitch: number, dist: number): Cam3 => ({tx, ty, tz, yaw, pitch, dist, fov: 30});

const FLOW0 = 15000;
const RATE = 1.5; // crates per second
const TRAVEL = 30;
const PER = 30 / RATE;
const LA3: V3 = [-3.7, 0, 7.2];
const LB3: V3 = [3.9, 0, 7.2];

const camKeys = (f: number) =>
  f >= W.another - 60
    ? [
        {f: W.another - 40, cam: c3(0.6, 3.4, 3.6, 6, 13, 27)},
        {f: W.andIts + 8, cam: c3(1.1, 3.35, 3.9, 10, 13, 25.2), dur: W.andIts + 8 - (W.another - 40)},
      ]
    : [
        {f: 15040, cam: c3(2.4, 3.9, 0.8, 13, 7, 21.5)},
        {f: W.cheaper, cam: c3(-0.6, 3.85, 0.6, -9, 7, 19.2)},
        {f: W.two + 6, cam: c3(0.1, 2.0, 3.6, -2, 14, 27), dur: W.two + 6 - W.cheaper},
        {f: W.moreTokens - 6, cam: c3(-1.0, 2.0, 3.6, -5, 14, 26.5)},
        {f: W.batching + 24, cam: c3(1.9, 2.3, 3.2, 8, 14, 24)},
        {f: W.eightBit + 4, cam: c3(-1.5, 2.3, 3.0, 2, 14, 22.5)},
        {f: W.theFirst + 16, cam: c3(-1.9, 2.6, 2.2, 5, 13, 18.5), dur: W.theFirst + 16 - (W.eightBit + 10)},
      ];

export const leverBridge = (f: number): BridgeProps => {
  const inE = f >= W.another - 60;
  const shrink = inE ? 0.72 : track(f, [[W.eightBit + 2, 1], [W.eightBit + 16, 0.72, EASE.outBack]]);
  return {
    frame: f,
    view: 'threeQuarter',
    cam: camKeys(f),
    bandwidth: 0.72,
    crateRate: RATE,
    travel: TRAVEL,
    flowFrom: FLOW0,
    crateScale: shrink,
    mathActivity: 0.85,
    highlight: !inE && f >= W.fewerBytes && f < W.moreTokens - 4 ? 'tower' : !inE && f >= W.moreTokens && f < W.batching ? 'die' : null,
  };
};

const proj = (c: Cam3, p: V3) => {
  const b = basis(c);
  const q = project(b, p);
  return {x: q ? q[0] : -999, y: q ? q[1] : -999, ppu: pxPerUnit(b, p)};
};

/** Arrival frames of the crates in the last `back` frames (the Bridge's own schedule). */
const arrivals = (f: number, back: number): number[] => {
  const out: number[] = [];
  const k1 = Math.floor((f - TRAVEL - FLOW0) / PER);
  for (let k = k1; k >= 0 && FLOW0 + k * PER + TRAVEL >= f - back; k--) out.push(FLOW0 + k * PER + TRAVEL);
  return out;
};

/** Answer strips (top right, inside the safe frame): every crate arrival lands one piece in strip 0 (our chat);
 * once batching is on, the same trip also lands a piece in strips 1 and 2 (other chats in the batch). */
const STRIP = {x0: 1392, x1: 1796, y0: 116, dy: 72, pitch: 64, size: 34, w: 50, keep: 6, fly: 16};
const stripArrivals = (j: number, to: number): number[] => {
  const out: number[] = [];
  for (let k = 0; ; k++) {
    const a = FLOW0 + k * PER + TRAVEL;
    if (a > to) break;
    if (j === 0 || a >= W.batching + 8) out.push(a);
  }
  return out;
};

/** Knob centre on screen for a lever drawn at (x, y) top-face centre with scale s. */
const knobAt = (x: number, y: number, s: number, ang: number) => {
  const r = (ang * Math.PI) / 180;
  return {x: x + Math.sin(r) * 236 * s, y: y + (64 - Math.cos(r) * 236) * s};
};

export const LeversScene: React.FC<{frame: number}> = ({frame: f}) => {
  const inA = f < W.another - 60;
  const B = leverBridge(f);
  const cam = bridgeCam(B, f);
  const an = bridgeAnchors(B, f);
  // lever states
  const riseA = inA ? springAt(f, W.two - 2, SPRING.pop) : 1;
  const riseB = inA ? springAt(f, W.two + 2, SPRING.pop) : 1;
  const aOn = inA ? springAt(f, W.eightBit - 2, {damping: 9, stiffness: 190, mass: 0.7}) : 1;
  const bOn = inA ? springAt(f, W.batching - 2, {damping: 9, stiffness: 190, mass: 0.7}) : 1;
  const bKick = inA ? 0 : springAt(f, W.speculative - 2, {damping: 7, stiffness: 220, mass: 0.6}) - springAt(f, W.speculative + 6, {damping: 12, stiffness: 160, mass: 0.7});
  const angA = lerp(NOTCH.b16, NOTCH.b8, aOn);
  const angB = lerp(LEVER_B.off, LEVER_B.on, bOn) + 6 * bKick;
  const LA = proj(cam, LA3);
  const LB = proj(cam, LB3);
  const sA = LA.ppu * 0.0102;
  const sB = LB.ppu * 0.0102;
  const yA = LA.y - 124 * sA;
  const yB = LB.y - 124 * sB;
  const kA = knobAt(LA.x, yA, sA, angA);
  const kB = knobAt(LB.x, yB, sB, angB);
  // cables on the floor: lever → tower base, lever → die base
  const seg = (a3: V3, b3: V3) => ({a: proj(cam, a3), b: proj(cam, b3)});
  const cA = seg([LA3[0], 0.02, LA3[2] - 0.9], [-6.2, 0.02, 1.95]);
  const cB = seg([LB3[0], 0.02, LB3[2] - 0.9], [6.0, 0.02, 2.1]);
  const pulse = (at: number) => (f >= at && f < at + 22 ? prog(f, at, 18, EASE.inOut) : -1);
  const pA = inA ? Math.max(pulse(W.fewerBytes - 2), pulse(W.eightBit)) : -1;
  const pB = inA ? Math.max(pulse(W.moreTokens - 2), pulse(W.batching)) : pulse(W.speculative);
  // pieces out of the die on each arrival, landing in the answer strips (one per trip; three once batching is on)
  const burst: React.ReactNode[] = [];
  const strips: React.ReactNode[] = [];
  if (inA) {
    for (const a of arrivals(f, 10)) {
      const t = f - a;
      if (t >= 0 && t < 8) burst.push(<circle key={`b${a}`} cx={an.dieTop.x} cy={an.dieTop.y} r={30 + t * 9} fill="none" stroke={PAL.infoPale} strokeWidth={4} opacity={0.7 * (1 - t / 8)} />);
    }
    for (let j = 0; j < 3; j++) {
      const sy = STRIP.y0 + j * STRIP.dy;
      const back = j === 0 ? prog(f, W.tricks + 72, 10, EASE.out) : prog(f, W.batching - 2, 10, EASE.out);
      if (back <= 0.01) continue;
      strips.push(
        <div key={`sb${j}`} style={{position: 'absolute', left: STRIP.x0 - 56, top: sy - 36, width: STRIP.x1 - STRIP.x0 + 56 + 46, height: 72, borderRadius: 36, background: rgba('#070B15', 0.72), border: `2px solid ${rgba(PAL.structure, 0.35)}`, opacity: back}}>
          <div style={{position: 'absolute', left: 18, top: 24, width: 22, height: 22, borderRadius: 6, background: j === 0 ? PAL.info : rgba(PAL.annotation, 0.8), boxShadow: j === 0 ? `0 0 14px ${PAL.info}` : undefined}} />
        </div>,
      );
      const L = stripArrivals(j, f);
      L.forEach((a, i) => {
        const land = a + STRIP.fly;
        let rank = 0;
        for (let k = i + 1; k < L.length; k++) rank += prog(f, L[k] + STRIP.fly - 6, 8, EASE.inOut);
        if (rank > STRIP.keep + 0.5) return;
        const slot = {x: STRIP.x1 - rank * STRIP.pitch, y: sy};
        const fade = clamp01(STRIP.keep + 0.5 - rank);
        if (f < land) {
          const u = clamp01((f - a) / STRIP.fly);
          const p = arcPt({x: an.dieTop.x, y: an.dieTop.y - 10}, slot, 70, EASE.inOut(u));
          strips.push(<MiniTile key={`t${j}-${a}`} x={p.x} y={p.y} text="" size={STRIP.size} w={STRIP.w} scale={lerp(0.45, 1, u)} rim={1} opacity={clamp01((f - a) / 3) * back} />);
        } else {
          const t = f - land;
          const squash = t < 12 ? 0.08 * Math.exp(-t / 3) * Math.cos(t * 0.9) : 0;
          strips.push(<MiniTile key={`t${j}-${a}`} x={slot.x} y={slot.y} text="" size={STRIP.size} w={STRIP.w} scale={1 + squash} rim={t < 10 ? 1 - t / 10 : 0} opacity={fade * back} />);
        }
      });
    }
  }
  const pop = (at: number) => Math.max(0, springAt(f, at, SPRING.pop));
  const cable = (c: {a: {x: number; y: number}; b: {x: number; y: number}}, p: number, on: number, key: string) => (
    <g key={key}>
      <line x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y} stroke="#03060D" strokeWidth={14} strokeLinecap="round" opacity={0.9} />
      <line x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y} stroke={PAL.info} strokeWidth={10} strokeLinecap="round" opacity={0.12 + 0.2 * on} />
      <line x1={c.a.x} y1={c.a.y} x2={c.b.x} y2={c.b.y} stroke={PAL.infoPale} strokeWidth={3} strokeLinecap="round" opacity={0.35 + 0.5 * on} />
      {p >= 0 ? (
        <>
          <circle cx={lerp(c.a.x, c.b.x, p)} cy={lerp(c.a.y, c.b.y, p)} r={34} fill={rgba(PAL.info, 0.3)} />
          <circle cx={lerp(c.a.x, c.b.x, p)} cy={lerp(c.a.y, c.b.y, p)} r={10} fill="#E9FDFF" />
        </>
      ) : null}
    </g>
  );
  const plateY = (L: {y: number}, s: number) => L.y + 40 * s;
  const hud = (
    <>
      {inA ? <AtlasOpener frame={f} at={W.tricks - 20} word="The tricks" y={168} size={124} dur={84} /> : null}
      {strips}
      {inA ? <KineticText frame={f} at={W.fewerBytes} text="Fewer bytes per token" x={Math.max(260, Math.min(1470, LA.x))} y={Math.min(856, plateY(LA, sA))} size={60} mode="pop" stagger={2} backing="plate" maxWidth={420} exitAt={W.theFirst + 6} /> : null}
      <KineticText frame={f} at={inA ? W.moreTokens : f - 999} text="More tokens per trip" x={inA ? Math.max(260, Math.min(1470, LB.x)) : Math.min(1470, LB.x + 360 * sB)} y={inA ? Math.min(856, plateY(LB, sB)) : LB.y - 150 * sB} size={60} mode="pop" stagger={2} backing="plate" maxWidth={420} exitAt={inA ? W.theFirst + 6 : W.andIts + 2} />
      {inA && f >= W.batching - 2 ? <TagAt x={Math.min(1540, kB.x + 70 * sB)} y={kB.y - 20} s={inA ? pop(W.batching) : 1} text="Batching" exit={inA ? prog(f, W.theFirst + 6, 8) : prog(f, W.moreOut, 10)} /> : null}
      {!inA ? <KineticText frame={f} at={W.speculative} text="Speculative decoding" x={960} y={150} size={100} mode="slam" exitAt={W.andIts - 2} /> : null}
      {f >= W.eightBit - 2 ? <TagAt x={Math.max(240, kA.x - 70 * sA)} y={kA.y - 20} s={inA ? pop(W.eightBit) : 1} text="8-bit" left exit={inA ? prog(f, W.theFirst + 6, 8) : prog(f, W.another, 10)} /> : null}
    </>
  );
  return (
    <Stage frame={f} env="none" drift={0} hud={hud} shake={inA ? [{at: W.batching + 4, strength: 0.3}, {at: W.eightBit + 4, strength: 0.3}] : [{at: W.speculative + 4, strength: 0.45}]}>
      <Bridge {...B} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {riseA > 0.05 ? cable(cA, pA, aOn, 'ca') : null}
        {riseB > 0.05 ? cable(cB, pB, bOn, 'cb') : null}
        {burst}
      </svg>
      <Lever frame={f} x={LA.x} y={yA} s={sA} angle={angA} on={aOn * 0.55} rise={riseA} flash={pA >= 0 ? 1 - pA : 0} notches={[{a: NOTCH.b16}, {a: NOTCH.b8, lit: aOn}, {a: NOTCH.b4}]} />
      <Lever frame={f} x={LB.x} y={yB} s={sB} angle={angB} on={bOn} rise={riseB} flash={pB >= 0 ? 1 - pB : 0} notches={[{a: LEVER_B.off}, {a: LEVER_B.on, lit: bOn}]} />
    </Stage>
  );
};

/** A stamped tag plate (≥ 44 px) attached at (x, y): to the right of it, or to the left with `left`. */
export const TagAt: React.FC<{x: number; y: number; s: number; text: string; hot?: boolean; left?: boolean; exit?: number}> = ({x, y, s, text, hot, left, exit = 0}) =>
  exit >= 1 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(${left ? -100 : 0}%, -50%) scale(${s})`,
        transformOrigin: left ? '100% 50%' : '0% 50%',
        opacity: 1 - exit,
        padding: '6px 22px 8px',
        borderRadius: 12,
        background: rgba('#070B15', 0.9),
        border: `3px solid ${hot ? PAL.info : rgba(PAL.info, 0.75)}`,
        boxShadow: `0 0 ${hot ? 34 : 18}px ${rgba(PAL.info, hot ? 0.55 : 0.3)}, 0 10px 28px rgba(0,0,0,0.5)`,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 56,
        lineHeight: 1.1,
        color: hot ? PAL.infoPale : PAL.ink,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
