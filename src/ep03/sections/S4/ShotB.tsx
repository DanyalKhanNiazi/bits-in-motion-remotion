/**
 * S4 shot B: "Reading your question skips that one-at-a-time loop." The 11 question tiles land at once as one block;
 * the LOOP ring laps beside them; on "skips" the whole block hops over the ring in one bound.
 */
import React from 'react';
import {EASE, KineticText, PAL, Stage, TileRow, clamp01, lerp, prog, rgba, win, type CamKey} from '../../kit';
import {QUESTION, T, X} from './T';
import {LoopRing, Moving, blip} from './parts';

export const RING_B = {cx: 960, cy: 650, r: 150};
const START = {x: 385, y: 560};
const END = {x: 1540, y: 560};
const HOP = 28;
const PEAK = 400;
/** the tiles land (all at once) as the zoom-through opens */
const B0 = X.diveAt + 7;
const LAND = T.skips + HOP;

export const CAM_B: CamKey[] = [
  {f: X.diveAt, x: 960, y: 560, zoom: 1.06},
  {f: T.skips - 2, x: 910, y: 560, zoom: 1.0, ease: 'inOut'},
  {f: LAND + 8, x: 1010, y: 570, zoom: 1.0, ease: 'inOut'},
  {f: X.ringAt + 6, x: 965, y: 620, zoom: 1.05, ease: 'inOut'},
];

const hopAt = (f: number) => {
  const u = clamp01((f - T.skips) / HOP);
  const v = EASE.inOut(u);
  return {x: lerp(START.x, END.x, v), y: START.y - PEAK * 4 * v * (1 - v), u};
};

const trail = (u: number): string => {
  const n = 40;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const v = (u * i) / n;
    pts.push(`${lerp(START.x, END.x, v).toFixed(1)},${(START.y + 140 - PEAK * 4 * v * (1 - v)).toFixed(1)}`);
  }
  return `M ${pts.join(' L ')}`;
};

const ShotB: React.FC<{f: number}> = ({f}) => {
  const p = hopAt(f);
  const q = hopAt(f - 1);
  const crouch = f < T.skips ? prog(f, T.skips - 7, 7, EASE.inOut) : 0;
  const flying = f >= T.skips && f < LAND ? Math.sin(Math.PI * p.u) : 0;
  const l = f - LAND;
  const squash = l >= 0 && l < 24 ? Math.exp(-l / 4) * Math.cos(l * 0.8) : 0;
  const sy = 1 - 0.08 * crouch + 0.06 * flying - 0.12 * squash;
  const sx = 1 + 0.04 * crouch - 0.03 * flying + 0.06 * squash;
  const rot = f >= T.skips && f < LAND ? lerp(-7, 7, p.u) * Math.sin(Math.PI * p.u) : 0;
  const float = f < T.skips - 7 ? 4 * Math.sin((f - B0) / 9) : 0;
  const tu = f >= T.skips ? clamp01((f - T.skips) / HOP) : 0;
  const trailOp = f < T.skips ? 0 : 1 - prog(f, LAND + 4, 22);
  const landFlash = blip(f, LAND, 2, 10);
  const lit = 0.25 + 0.55 * win(f, T.oneAtATime - 4, T.loopEnd + 14, 8, 10);
  return (
    <Stage
      frame={f}
      env={{kind: 'chip', pulses: 0.9}}
      cam={CAM_B}
      shake={[{at: LAND, strength: 0.45}]}
      hud={<KineticText frame={f} at={T.skips + 1} text="Skips the loop" mode="pop" x={960} y={888} size={80} />}
    >
      {/* launch and landing pads */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <ellipse cx={START.x} cy={START.y + 150} rx={300} ry={34} fill={rgba(PAL.structure, 0.16)} stroke={rgba(PAL.structure, 0.4)} strokeWidth={2} />
        <ellipse cx={END.x} cy={END.y + 150} rx={300} ry={34} fill={rgba(PAL.info, 0.08 + 0.3 * landFlash + (f >= LAND ? 0.08 : 0))} stroke={rgba(PAL.info, 0.35 + 0.5 * landFlash)} strokeWidth={3} />
        {landFlash > 0.02 ? <ellipse cx={END.x} cy={END.y + 150} rx={300 + 160 * (1 - landFlash)} ry={34 + 22 * (1 - landFlash)} fill="none" stroke={PAL.info} strokeWidth={3} opacity={landFlash} /> : null}
        {trailOp > 0 ? (
          <>
            <path d={trail(tu)} fill="none" stroke={PAL.info} strokeWidth={16} strokeOpacity={0.14 * trailOp} strokeLinecap="round" />
            <path d={trail(tu)} fill="none" stroke={PAL.info} strokeWidth={4} strokeOpacity={0.85 * trailOp} strokeLinecap="round" strokeDasharray="2 14" />
          </>
        ) : null}
      </svg>
      <LoopRing frame={f} cx={RING_B.cx} cy={RING_B.cy} r={RING_B.r} phase={(f - B0 + 20) / 34 + 0.75} lit={lit} bitSize={26} />
      <Moving id="s4b-mv" vx={(p.x - q.x) * 0.9} vy={(p.y - q.y) * 0.9}>
        <div
          style={{
            position: 'absolute',
            left: p.x,
            top: p.y + float + 12 * crouch,
            width: 0,
            height: 0,
            transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
            transformOrigin: '0px 110px',
          }}
        >
          <TileRow frame={f} tokens={QUESTION} x={0} y={0} size={50} gap={12} wrap maxWidth={600} snapAt={{start: B0, every: 0}} from={{dy: -70, rot: -5}} marker={false} />
        </div>
      </Moving>
    </Stage>
  );
};

export const shotB = (f: number): React.ReactNode => <ShotB f={f} />;
