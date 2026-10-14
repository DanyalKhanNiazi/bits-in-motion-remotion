// S8 shot B: one weight stored in 16, 8 or 4 bits (BIM181 quantized-weight trays; each cell is one bit).
import React from 'react';
import {KineticText, Label, MONO, PAL, Prop, Stage, clamp01, poseAt, propPoint, rgba, rnd, springAt, SPRING, toScreen, type CamKey} from '../../kit';
import {W} from './T';
import {CELLS16, CELLS4, CELLS8, centroid, TRAYS} from './geo';

const SRC = 'BIM181_T03_quantized-weight_a' as const;
const PL = {x: 960, y: 548, w: 1700};

export const traysCam: CamKey[] = [
  {f: W.theFirst - 4, x: 600, y: 520, zoom: 1.32},
  {f: W.eachWeight + 10, x: 640, y: 525, zoom: 1.26},
  {f: W.in8 + 2, x: 860, y: 538, zoom: 1.12, dur: 22},
  {f: W.in4 - 6, x: 975, y: 545, zoom: 1.0, dur: 19},
  {f: W.andThere + 4, x: 990, y: 540, zoom: 1.05},
];

type Cell = ReadonlyArray<readonly [number, number]>;
const CellBits: React.FC<{frame: number; cells: readonly Cell[]; start: number; every: number; seed: string}> = ({frame: f, cells, start, every, seed}) => (
  <svg width={2058} height={764} viewBox="0 0 2058 764" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    <defs>
      <filter id={`s8bits-${seed}`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation={9} />
      </filter>
    </defs>
    {cells.map((q, i) => {
      const a = start + i * every;
      if (f < a) return null;
      const sp = springAt(f, a, SPRING.snap);
      const c = centroid(q);
      const pts = q.map((p) => `${c.x + (p[0] - c.x) * 0.86},${c.y + (p[1] - c.y) * 0.86}`).join(' ');
      const bit = rnd(`${seed}-${i}`) > 0.45 ? '1' : '0';
      const flash = Math.exp(-(f - a) / 5);
      const breathe = 0.85 + 0.15 * Math.sin((f + i * 7) / 9);
      const h = Math.abs(q[2][1] - q[0][1]);
      return (
        <g key={i} opacity={clamp01(sp * 1.5)}>
          <polygon points={pts} fill={PAL.info} opacity={0.5 * breathe} filter={`url(#s8bits-${seed})`} />
          <polygon points={pts} fill={rgba(PAL.infoDeep, 0.9)} stroke={PAL.info} strokeWidth={5} strokeLinejoin="round" />
          <polygon points={pts} fill="#FFFFFF" opacity={0.65 * flash} />
          <text
            x={c.x}
            y={c.y + 17 + (1 - Math.min(1, sp)) * 20}
            textAnchor="middle"
            fontFamily={MONO}
            fontWeight={500}
            fontSize={Math.min(54, h * 0.62)}
            fill="#E9FDFF"
          >
            {bit}
          </text>
        </g>
      );
    })}
  </svg>
);

export const TraysScene: React.FC<{frame: number}> = ({frame: f}) => {
  const pose = poseAt(f, traysCam);
  const at = (nx: number, ny: number) => {
    const p = propPoint(SRC, PL, nx, ny);
    return toScreen(pose, p.x, p.y);
  };
  const under = (i: number) => at((TRAYS[i].x0 + TRAYS[i].x1) / 2, TRAYS[i].y1 + 70);
  const lt = at(352, 118);
  const u0 = under(0);
  const u1 = under(1);
  const u2 = under(2);
  const hud = (
    <>
      <Label frame={f} at={W.eachWeight} size={48} text="One weight" x={lt.x + 120} y={Math.max(120, lt.y - 110)} to={{x: lt.x, y: lt.y + 8}} exitAt={W.andThere + 4} />
      <KineticText frame={f} at={W.in8} text="8 bits" x={u1.x} y={Math.min(880, u1.y)} size={88} mode="slam" />
      <KineticText frame={f} at={W.in4} text="4 bits" x={u2.x} y={Math.min(880, u2.y)} size={88} mode="slam" />
      <KineticText frame={f} at={W.of16} text="16 bits" x={u0.x} y={Math.min(880, u0.y)} size={88} mode="slam" />
    </>
  );
  return (
    <Stage frame={f} env={{kind: 'night', dust: 60}} cam={traysCam} hud={hud}>
      <Prop
        frame={f}
        src={SRC}
        x={PL.x}
        y={PL.y}
        w={PL.w}
        tiltX={6}
        rim={{color: PAL.info, strength: 0.45}}
        sweep={{at: [W.store - 6, W.in8 - 4, W.in4 - 4, W.of16 - 6], dur: 30, strength: 0.5}}
        float={4}
        shadow={{opacity: 0.6, dy: -10, w: 0.9}}
      >
        <CellBits frame={f} cells={CELLS16} start={W.store} every={1.4} seed="b16" />
        <CellBits frame={f} cells={CELLS8} start={W.in8 - 2} every={2} seed="b8" />
        <CellBits frame={f} cells={CELLS4} start={W.in4 - 2} every={3} seed="b4" />
      </Prop>
    </Stage>
  );
};

