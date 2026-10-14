/**
 * S1 shot 3, the race result. Two glowing lanes on one time scale. The scale opens at 0.03 s (Read fills its lane,
 * Write shoots off the frame), then zooms out to 6.5 s: Read collapses to a sliver against Write. "×200" slams.
 */
import React from 'react';
import {KineticText, PAL, Rich, Stage, type CamKey} from '../../kit';
import {EASE, clamp01, lerp, mixHex, prog, rgba} from '../../kit';
import {A, T} from './anchors';
import {sansStyle} from './fx';

const X0 = 330;
const X1 = 1690;
const L = X1 - X0;
const YR = 500;
const YW = 724;
const READ_S = 0.03;
const WRITE_S = 6.5;

const cam: CamKey[] = [
  {f: T.toRace, x: 960, y: 540, zoom: 1.0},
  {f: T.toStream + 12, x: 980, y: 530, zoom: 1.06},
];

/** The visible span of the time scale (seconds), zooming out in log space. */
const span = (f: number) => {
  const u = prog(f, T.toRace + 10, A.two - 2 - (T.toRace + 10), EASE.inOut);
  return Math.exp(lerp(Math.log(READ_S), Math.log(WRITE_S), u));
};

const Lane: React.FC<{y: number; color: string; w: number; flare: number; label: string}> = ({y, color, w, flare, label}) => {
  const vis = Math.min(w, 1920 - X0 + 40);
  return (
    <>
      <div style={{position: 'absolute', left: X0 - 400, top: y, transform: 'translateY(-50%)', width: 330, textAlign: 'right', ...sansStyle(64, color, 700)}}>{label}</div>
      <div
        style={{
          position: 'absolute',
          left: X0 - 10,
          top: y - 40,
          width: L + 20,
          height: 80,
          borderRadius: 40,
          background: `linear-gradient(180deg, ${rgba('#0E1830', 0.92)}, ${rgba('#060A14', 0.92)})`,
          border: `2px solid ${rgba(PAL.structure, 0.32)}`,
          boxShadow: `inset 0 2px 0 ${rgba('#FFFFFF', 0.06)}, 0 20px 50px rgba(0,0,0,0.5)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: X0,
          top: y - 26,
          width: Math.max(5, vis),
          height: 52,
          borderRadius: 26,
          background: `linear-gradient(180deg, ${lerpColor(color, 0.35)}, ${color} 55%, ${lerpColor(color, -0.25)})`,
          boxShadow: `0 0 ${24 + 50 * flare}px ${rgba(color, 0.55 + 0.4 * flare)}, 0 0 ${8}px ${rgba(color, 0.9)}`,
        }}
      />
      {/* the bar's bright head */}
      {w < 1920 - X0 ? <div style={{position: 'absolute', left: X0 + Math.max(5, vis) - 8, top: y - 30, width: 16, height: 60, borderRadius: 8, background: '#FFFFFF', boxShadow: `0 0 26px ${color}`, opacity: 0.9}} /> : null}
      {/* reflection on the floor */}
      <div
        style={{
          position: 'absolute',
          left: X0,
          top: y + 44,
          width: Math.max(5, vis),
          height: 26,
          borderRadius: 13,
          background: `linear-gradient(180deg, ${rgba(color, 0.22)}, ${rgba(color, 0)})`,
          filter: 'blur(6px)',
        }}
      />
    </>
  );
};
const lerpColor = (hex: string, k: number) => (k >= 0 ? mixHex(hex, '#FFFFFF', k) : mixHex(hex, '#000000', -k));

export const SceneRace: React.FC<{frame: number}> = ({frame: f}) => {
  const S = span(f);
  const rw = (L * READ_S) / S;
  const ww = (L * WRITE_S) / S;
  const flare = f >= A.longer ? Math.exp(-(f - A.longer) / 10) : 0;
  const settled = prog(f, A.two - 4, 10, EASE.out);
  // tick marks on the shared scale (0.01 s, 0.1 s and 1 s families fade by their spacing)
  const ticks: React.ReactNode[] = [];
  [0.01, 0.1, 1].forEach((step, si) => {
    const px = (L * step) / S;
    const a = clamp01((px - 10) / 30) * clamp01((900 - px) / 400);
    if (a <= 0.01) return;
    const n = Math.min(400, Math.floor(S / step));
    for (let i = 1; i <= n; i++) {
      const x = X0 + i * px;
      if (x > 1900) break;
      ticks.push(<line key={`${si}-${i}`} x1={x} y1={YW + 62} x2={x} y2={YW + 62 + 10 + 8 * si} stroke={PAL.structure} strokeOpacity={0.55 * a} strokeWidth={2} />);
    }
  });
  const sliverX = X0 + Math.max(5, rw);
  const lensOn = prog(f, A.hundred, 10, EASE.outBack);
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 60}}
      cam={cam}
      shake={[{at: A.two, strength: 0.9}]}
      hud={
        <>
          <KineticText frame={f} at={A.two - 10} text="over" mode="pop" x={760} y={286} size={84} backing="none" color={PAL.annotation} align="right" />
          <KineticText frame={f} at={A.two} text="×200" mode="slam" x={790} y={274} size={250} backing="none" align="left" accent={PAL.wait} />
        </>
      }
    >
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        <line x1={X0} y1={YW + 62} x2={X1} y2={YW + 62} stroke={PAL.structure} strokeOpacity={0.35} strokeWidth={2} />
        {ticks}
      </svg>
      <Lane y={YR} color={PAL.info} w={rw} flare={0} label="Read" />
      <Lane y={YW} color={PAL.wait} w={ww} flare={flare} label="Write" />
      {/* values */}
      <div style={{position: 'absolute', left: Math.min(sliverX + 70, X1 - 230), top: YR - 124, ...sansStyle(64, PAL.ink, 700), opacity: prog(f, T.toRace + 6, 8)}}>
        <Rich text="0.03 s" weight={700} />
      </div>
      <div style={{position: 'absolute', left: Math.min(X1, X0 + ww), top: YW - 96, transform: 'translateX(-100%)', ...sansStyle(64, PAL.ink, 700), opacity: settled}}>
        <Rich text="≈6.5 s" weight={700} />
      </div>
      {/* the lens on the sliver */}
      {lensOn > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <circle cx={sliverX - 2} cy={YR} r={54 * lensOn} fill={rgba(PAL.info, 0.08)} stroke={PAL.infoPale} strokeWidth={4} />
          <circle cx={sliverX - 2} cy={YR} r={66 * lensOn} fill="none" stroke={PAL.info} strokeOpacity={0.35} strokeWidth={10} />
        </svg>
      ) : null}
    </Stage>
  );
};
