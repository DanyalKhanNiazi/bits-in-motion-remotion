/**
 * S6 P14: the RTX 5090 as a lit hero, which then shrinks into a two-bridge comparison seen from above. The H100's
 * bridge (top) keeps its width; the 5090's (bottom) narrows, through the kit Bridge's own `bandwidth`, to a little over
 * half as wide (deck 1.51 vs 2.82 units = 0.535), and its crates cross at about half the rate. No frames, no boxes:
 * the decks themselves carry the comparison.
 */
import React from 'react';
import {
  Bridge,
  EASE,
  KineticText,
  PAL,
  Prop,
  SANS,
  SET,
  SPRING,
  Stage,
  TAU,
  basis,
  bridgeCam,
  lerp,
  prog,
  project,
  rgba,
  springAt,
  track,
  type BridgeProps,
  type Cam3,
  type CamKey,
  type Key,
} from '../../kit';
import {A, CUT} from './anchors';
import type {Pt} from './common';

const CARD = 'BIM133_T03_home-graphics-card_a' as const;
const GPU = 'BIM129_T03_datacenter-gpu_a' as const;
/** Both bridges share one camera (seen from above), so their widths compare directly. */
const CAM: Cam3 = {tx: -0.35, ty: 2.75, tz: 0, yaw: 0, pitch: 62, dist: 17, fov: 30};
const DECK_X = 1060;
const TOP_Y = 290; // H100 deck centre
const LOW_Y = 790; // RTX 5090 deck centre
const SEAM = 540;
const BW_TOP = 0.76;
const BW_LOW = 0.2125; // deck 1.51 vs 2.82 units: 0.535 of the H100's width
const MORPH = {at: A.littleOver - 15, dur: 24};
const NAME_X = 240;
const GAP_Y = 548; // captions sit between the two bridges, clear of every guide

export const COMPARE_CAM: CamKey[] = [
  {f: CUT.intoCard, zoom: 1.0, x: 960, y: 540},
  {f: MORPH.at, zoom: 1.07, x: 980, y: 548},
  {f: MORPH.at + MORPH.dur, zoom: 1.0, x: 960, y: 540, dur: MORPH.dur},
  {f: CUT.intoDesk + 16, zoom: 1.015, x: 960, y: 548},
];

const lowBW: readonly Key[] = [
  [A.littleOver + 2, BW_TOP],
  [A.littleOver + 30, BW_LOW, EASE.inOut],
];

const bridgeOf = (f: number, low: boolean): BridgeProps => ({
  frame: f,
  view: 'side',
  framing: CAM,
  drift: 0.4,
  bandwidth: low ? lowBW : BW_TOP,
  crateRate: low ? 1.28 : 2.4,
  travel: 30,
  mathActivity: 0.85,
  flowFrom: low ? A.littleOver + 26 : undefined,
});

/** A deck point of a bridge, in screen px (its band places the deck centre at (DECK_X, cy)). */
const deckPt = (props: BridgeProps, f: number, cy: number, x: number, z: number): Pt | null => {
  const q = project(basis(bridgeCam(props, f)), [x, SET.deckY + 0.04, z]);
  return q ? {x: q[0] + DECK_X - 960, y: q[1] + cy - 540} : null;
};

/** A dimension bracket "[" spanning y0..y1 at x. */
const Bracket: React.FC<{x: number; y0: number; y1: number; k: number; dashed?: boolean}> = ({x, y0, y1, k, dashed}) => {
  const m = (y0 + y1) / 2;
  const a = lerp(m, Math.min(y0, y1), k);
  const b = lerp(m, Math.max(y0, y1), k);
  return (
    <g opacity={dashed ? 0.85 : 1}>
      {!dashed ? <path d={`M${x + 20} ${a} H${x} V${b} H${x + 20}`} fill="none" stroke={PAL.info} strokeOpacity={0.45} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" /> : null}
      <path d={`M${x + 20} ${a} H${x} V${b} H${x + 20}`} fill="none" stroke={dashed ? PAL.infoPale : '#F4F7FB'} strokeWidth={dashed ? 4 : 8} strokeDasharray={dashed ? '12 10' : undefined} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** One bridge in its half of the frame, with its width band, guides and bracket. */
const Lane: React.FC<{frame: number; low: boolean}> = ({frame: f, low}) => {
  const enterAt = MORPH.at + (low ? 6 : 2);
  if (f < enterAt) return null;
  const s = springAt(f, enterAt, SPRING.snap);
  const dx = (1 - s) * (low ? 1 : -1) * 1900;
  const cy = low ? LOW_Y : TOP_Y;
  const B = bridgeOf(f, low);
  const half = lerp(1.0, 3.4, low ? track(f, lowBW) : BW_TOP) / 2;
  const hTop = lerp(1.0, 3.4, BW_TOP) / 2;
  const xa = SET.tower.x1 + 0.1;
  const xb = SET.die.x0 - 0.1;
  const P = (x: number, z: number) => deckPt(B, f, cy, x, z);
  const d = [P(xa, -half), P(xb, -half), P(xb, half), P(xa, half)];
  const g = [P(xa, -hTop), P(xb, -hTop), P(xa, hTop), P(xb, hTop)];
  const bandK = prog(f, enterAt + 10, 14, EASE.out) * (0.8 + 0.2 * Math.sin((TAU * f) / 40));
  const ghostK = low ? prog(f, A.littleOver + 4, 10) : 0;
  const brIn = prog(f, low ? A.littleOver + 2 : enterAt + 12, 12, EASE.out);
  const e0 = P(xa, -half);
  const e1 = P(xa, half);
  const brX = e0 && e1 ? Math.min(e0.x, e1.x) - 34 : 0;
  const w0 = P(xa, -hTop);
  const w1 = P(xa, hTop);
  const mask = low
    ? 'linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 12%, #000 100%)'
    : 'linear-gradient(180deg, #000 0%, #000 88%, rgba(0,0,0,0) 100%)';
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateX(${dx}px)`}}>
      <div style={{position: 'absolute', left: 0, top: low ? SEAM - 40 : 0, width: 1920, height: low ? 1080 - SEAM + 40 : SEAM + 40, overflow: 'hidden', WebkitMaskImage: mask, maskImage: mask}}>
        <div style={{position: 'absolute', left: DECK_X - 960, top: cy - 540 - (low ? SEAM - 40 : 0), width: 1920, height: 1080}}>
          <Bridge {...B} />
        </div>
        {/* keep the name column clean */}
        <div style={{position: 'absolute', left: 0, top: 0, width: 520, height: '100%', background: `linear-gradient(90deg, ${rgba('#050A16', 0.96)} 0%, ${rgba('#050A16', 0.9)} 70%, rgba(5,10,22,0))`}} />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {d.every(Boolean) ? (
          <polygon points={d.map((q) => `${q!.x},${q!.y}`).join(' ')} fill={PAL.info} opacity={0.2 * bandK} stroke={PAL.infoPale} strokeOpacity={0.8 * bandK} strokeWidth={3} />
        ) : null}
        {ghostK > 0 && g.every(Boolean) ? (
          <g opacity={ghostK * 0.85}>
            <line x1={g[0]!.x} y1={g[0]!.y} x2={g[1]!.x} y2={g[1]!.y} stroke={PAL.infoPale} strokeWidth={3} strokeDasharray="14 12" />
            <line x1={g[2]!.x} y1={g[2]!.y} x2={g[3]!.x} y2={g[3]!.y} stroke={PAL.infoPale} strokeWidth={3} strokeDasharray="14 12" />
          </g>
        ) : null}
        {e0 && e1 && brIn > 0 ? <Bracket x={brX} y0={e0.y} y1={e1.y} k={brIn} /> : null}
        {low && ghostK > 0 && w0 && w1 ? <Bracket x={brX - 30} y0={w0.y} y1={w1.y} k={ghostK} dashed /> : null}
      </svg>
    </div>
  );
};

export const CompareScene: React.FC<{frame: number}> = ({frame: f}) => {
  // hero card → the lower bridge's name column
  const m = prog(f, MORPH.at, MORPH.dur, EASE.inOut);
  const cardPos = {x: lerp(960, NAME_X, m), y: lerp(568, LOW_Y - 70, m), w: lerp(1000, 250, m)};
  const nameIn = (at: number) => prog(f, at, 10, EASE.out);
  return (
    <Stage
      frame={f}
      env={{kind: 'night', warm: 0.55, dust: 60}}
      cam={COMPARE_CAM}
      hud={
        <>
          <KineticText frame={f} at={A.rtx} text="RTX 5090" x={960} y={150} size={124} mode="slam" exitAt={MORPH.at - 2} />
          <KineticText frame={f} at={A.topGaming} exitAt={MORPH.at - 2} text="Top gaming card" x={960} y={900} size={68} mode="pop" color={PAL.infoPale} screen />
          <KineticText frame={f} at={A.littleOver + 6} exitAt={A.roughlyHalf - 6} text="A little over half as wide" x={1090} y={GAP_Y} size={72} mode="rise" screen />
          <KineticText frame={f} at={A.roughlyHalf} text="≈ ½ the speed, in theory" x={1090} y={GAP_Y} size={76} mode="rise" color={PAL.infoPale} screen />
        </>
      }
    >
      <Lane frame={f} low={false} />
      <Lane frame={f} low={true} />
      <Prop frame={f} src={GPU} x={NAME_X} y={TOP_Y - 70} w={240} enter={{kind: 'pop', at: MORPH.at + 8}} rim={{color: PAL.info, strength: 0.4}} tiltX={6} float={3} />
      <Prop
        frame={f}
        src={CARD}
        x={cardPos.x}
        y={cardPos.y}
        w={cardPos.w}
        tiltY={[
          [CUT.intoCard, -10],
          [MORPH.at, 4],
          [MORPH.at + MORPH.dur, 0],
        ]}
        rim={{color: PAL.info, strength: lerp(0.6, 0.4, m)}}
        sweep={{at: [A.rtx - 2, A.topGaming - 4], dur: 34, strength: 0.55}}
        shadow={{opacity: 0.55 * (1 - m), dy: -6}}
        float={lerp(5, 2, m)}
      />
      {[
        {t: 'H100', at: MORPH.at + 12, y: TOP_Y + 82},
        {t: 'RTX 5090', at: MORPH.at + MORPH.dur, y: LOW_Y + 74},
      ].map((n) =>
        f >= n.at ? (
          <div key={n.t} style={{position: 'absolute', left: NAME_X, top: n.y, transform: `translate(-50%, -50%) translateY(${(1 - nameIn(n.at)) * 16}px)`, opacity: nameIn(n.at), fontFamily: SANS, fontWeight: 700, fontSize: 68, color: PAL.ink, whiteSpace: 'nowrap', textShadow: '0 4px 16px rgba(0,0,0,0.85)'}}>
            {n.t}
          </div>
        ) : null,
      )}
    </Stage>
  );
};
