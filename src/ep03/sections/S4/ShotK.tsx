/**
 * S4 shot K: "In that same test, reading the whole prompt, about a thousand tokens, took about as long as writing
 * four tokens of the answer." Two identical GPU modules (BIM129) on the hardware stage, each on a floor timer ring.
 * Left: a wall of ≈1,000 prompt tiles assembles, then funnels into the die in ONE run (the die blazes: lots of math).
 * Right: four runs, four small pulses, one tile each. Both timer rings close at the same moment: "=".
 */
import React from 'react';
import {EASE, KineticText, PAL, Prop, REGIONS, Stage, TokenTile, clamp01, lerp, prog, propPoint, regionCenter, rgba, rnd, tileW, useFontsReady, type CamKey} from '../../kit';
import {T, X} from './T';
import {blip} from './parts';

const GPU_SRC = 'BIM129_T03_datacenter-gpu_a' as const;
const GL = {x: 540, y: 748, w: 560};
const GR = {x: 1400, y: 748, w: 560};
const DIE_N = regionCenter(REGIONS.gpuA_die);
const DL = propPoint(GPU_SRC, GL, DIE_N.x, DIE_N.y);
const DR = propPoint(GPU_SRC, GR, DIE_N.x, DIE_N.y);
const RACE0 = T.took;
const TIE = T.answer9 + 4;
const RUN = (TIE - RACE0) / 4;
const COLS = 40;
const ROWS = 25;
const CELL = {w: 11, h: 8};
const WALL = {x0: GL.x - (COLS * CELL.w) / 2, y0: 328};
const ASM0 = T.reading9;
const ASM1 = T.thousand1 + 10;
const WORDS = ['Because', 'the', 'model', 'writes'];
const TS = 60;
const ROW_YS = [372, 470] as const;

const CAM_K: CamKey[] = [
  {f: X.whip2, x: 960, y: 540, zoom: 1.0},
  {f: X.whip3 + 12, x: 960, y: 552, zoom: 1.05, ease: 'inOut'},
];

/** a floor timer ring under a GPU: fills clockwise from the front while the race runs */
const TimerRing: React.FC<{cx: number; cy: number; p: number; tie: number}> = ({cx, cy, p, tie}) => {
  const rx = 330;
  const ry = 74;
  const d = `M ${cx} ${cy + ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy - ry} A ${rx} ${ry} 0 1 1 ${cx} ${cy + ry}`;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={rgba('#000000', 0.35)} />
      <path d={d} fill="none" stroke={PAL.structure} strokeOpacity={0.35} strokeWidth={8} />
      {p > 0 ? (
        <>
          <path d={d} fill="none" stroke={PAL.wait} strokeWidth={22} strokeOpacity={0.18} pathLength={1} strokeDasharray={`${p} 2`} />
          <path d={d} fill="none" stroke={PAL.wait} strokeWidth={8} pathLength={1} strokeDasharray={`${p} 2`} strokeLinecap="round" />
        </>
      ) : null}
      {tie > 0.02 ? <path d={d} fill="none" stroke={PAL.infoPale} strokeWidth={10} opacity={tie} /> : null}
    </g>
  );
};

/** the die's glow, drawn in the GPU's native px */
const DieGlow: React.FC<{level: number; f: number}> = ({level, f}) => {
  if (level <= 0.01) return null;
  const pts = (REGIONS.gpuA_die as {shape: 'poly'; pts: ReadonlyArray<readonly [number, number]>}).pts.map((q) => q.join(',')).join(' ');
  const flick = 0.85 + 0.15 * Math.sin(f * 1.7);
  return (
    <svg width={1536} height={1024} viewBox="0 0 1536 1024" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <polygon points={pts} fill={PAL.info} opacity={0.55 * level * flick} />
      <polygon points={pts} fill="none" stroke={PAL.infoPale} strokeWidth={10} opacity={Math.min(1, level * 1.2)} strokeLinejoin="round" />
      {level > 0.5 ? <polygon points={pts} fill="#FFFFFF" opacity={0.35 * (level - 0.5) * flick} /> : null}
    </svg>
  );
};

const ShotK: React.FC<{f: number}> = ({f}) => {
  useFontsReady();
  const race = prog(f, RACE0, TIE - RACE0, (t) => t);
  const tie = blip(f, TIE, 2, 14);
  // reading: one long run, the die blazes the whole time
  const readLevel = f >= RACE0 && f < TIE + 6 ? 0.85 + 0.15 * Math.sin((f - RACE0) / 2) : 0.08;
  // writing: four short runs, four small pulses
  let writeLevel = 0.08;
  for (let k = 0; k < 4; k++) writeLevel = Math.max(writeLevel, 0.5 * blip(f, RACE0 + RUN * (k + 1) - 5, 2, 5));
  // the wall of ≈1,000 prompt tiles: assembles (sweeping in from the left), then funnels into the die in one run
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const hx = WALL.x0 + c * CELL.w + CELL.w / 2;
      const hy = WALL.y0 + r * CELL.h + CELL.h / 2;
      const a0 = ASM0 + ((COLS - 1 - c) / COLS) * (ASM1 - ASM0 - 12) + rnd(`s4k-a${i}`) * 8;
      const ain = prog(f, a0, 12, EASE.out);
      if (ain <= 0) continue;
      const sx = -200 - rnd(`s4k-x${i}`) * 300;
      const sy = hy + (rnd(`s4k-y${i}`) - 0.5) * 500;
      let x = lerp(sx, hx, ain);
      let y = lerp(sy, hy, ain) - Math.sin(Math.PI * ain) * 60;
      // the run: every tile heads into the die together, arriving at the tie
      const u = EASE.inOut(race);
      if (u > 0) {
        x = lerp(x, DL.x + (hx - GL.x) * 0.04, u);
        y = lerp(y, DL.y, u * u);
      }
      const lit = f >= RACE0 ? 0.5 + 0.5 * Math.sin(i * 0.37 + f * 0.5) : 0;
      const sz = 1 - 0.6 * u;
      if (u >= 0.999) continue;
      tiles.push(
        <rect
          key={i}
          x={x - (CELL.w - 2) * sz * 0.5}
          y={y - (CELL.h - 2) * sz * 0.5}
          width={(CELL.w - 2) * sz}
          height={(CELL.h - 2) * sz}
          rx={1.5}
          fill={lit > 0.05 ? `rgb(${Math.round(246 - 150 * lit)},${Math.round(247 - 8 * lit)},255)` : PAL.tile}
          opacity={ain * (1 - prog(u, 0.85, 0.15))}
        />,
      );
    }
  }
  const tws = WORDS.map((w) => tileW(w, TS));
  // two shelves of two tiles each, centred over the right GPU
  const shelf = [
    [0, 1],
    [2, 3],
  ] as const;
  const slots: number[] = [];
  const slotY: number[] = [];
  const shelfW: number[] = [];
  shelf.forEach((idx, si) => {
    const wsum = tws[idx[0]] + tws[idx[1]] + 16;
    shelfW.push(wsum);
    let cx = GR.x - wsum / 2;
    idx.forEach((i) => {
      slots[i] = cx + tws[i] / 2;
      slotY[i] = ROW_YS[si];
      cx += tws[i] + 16;
    });
  });
  return (
    <Stage
      frame={f}
      env={{kind: 'night', dust: 80}}
      cam={CAM_K}
      shake={[{at: TIE, strength: 0.45}]}
      hud={
        <>
          <KineticText frame={f} at={T.test + 2} text="Same test" mode="pop" stagger={0} x={970} y={104} size={72} />
          <KineticText frame={f} at={T.reading9} text="Reading" mode="pop" x={GL.x} y={196} size={84} />
          <KineticText frame={f} at={T.thousand1} text="" mode="count" count={{from: 0, to: 1000, dur: 16, prefix: '≈', suffix: ' tokens'}} x={GL.x} y={278} size={64} color={PAL.infoPale} weight={700} backing="none" />
          <KineticText frame={f} at={T.reading9 + 4} text="Writing" mode="pop" x={GR.x} y={196} size={84} />
          <KineticText frame={f} at={T.four9} text="4 tokens" mode="pop" stagger={0} x={GR.x} y={278} size={64} color={PAL.infoPale} backing="none" />
          <KineticText frame={f} at={TIE} text="=" mode="slam" x={970} y={720} size={160} color={PAL.infoPale} accent={PAL.info} backing="none" />
        </>
      }
    >
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <TimerRing cx={GL.x} cy={924} p={race} tie={tie} />
        <TimerRing cx={GR.x} cy={924} p={race} tie={tie} />
        <line x1={970} y1={330} x2={970} y2={980} stroke={PAL.structure} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="6 12" />
      </svg>
      <Prop frame={f} src={GPU_SRC} {...GL} tiltX={6} rim={{color: PAL.info, strength: 0.25 + 0.5 * readLevel}} sweep={{every: 96, offset: 10}} shadow={0.6} float={3} seed="s4k-l">
        <DieGlow level={readLevel} f={f} />
      </Prop>
      <Prop frame={f} src={GPU_SRC} {...GR} tiltX={6} rim={{color: PAL.info, strength: 0.25 + 0.5 * writeLevel}} sweep={{every: 96, offset: 58}} shadow={0.6} float={3} seed="s4k-r">
        <DieGlow level={writeLevel} f={f} />
      </Prop>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {tiles}
        {/* sparks off the reading die: a lot of math */}
        {f >= RACE0 && f < TIE + 8
          ? Array.from({length: 16}, (_, i) => {
              const t = ((f - RACE0 + i * 5.3) % 18) / 18;
              const ang = rnd(`s4k-sp${i}`) * Math.PI * 2;
              const r = 30 + 150 * EASE.out(t);
              return <circle key={i} cx={DL.x + Math.cos(ang) * r} cy={DL.y + Math.sin(ang) * r * 0.5} r={3.5 * (1 - t) + 1} fill={PAL.infoPale} opacity={0.9 * (1 - t)} />;
            })
          : null}
        {/* the write shelves */}
        {ROW_YS.map((y, si) => (
          <g key={si}>
            <rect x={GR.x - shelfW[si] / 2 - 22} y={y + 48} width={shelfW[si] + 44} height={10} rx={4} fill="#8D97A7" opacity={0.85} />
            <rect x={GR.x - shelfW[si] / 2 - 22} y={y + 56} width={shelfW[si] + 44} height={16} rx={6} fill="#1A212D" />
          </g>
        ))}
      </svg>
      {/* writing: one tile per run, rising out of the die onto the rail */}
      {WORDS.map((w, k) => {
        const land = Math.round(RACE0 + RUN * (k + 1));
        return f < land - 6 ? (
          <div key={k} style={{position: 'absolute', left: 0, top: 0, opacity: 0.45}}>
            <TokenTile frame={f} text="" x={slots[k]} y={slotY[k]} size={TS} w={tws[k]} ghost />
          </div>
        ) : (
          <TokenTile key={k} frame={f} text={w} x={slots[k]} y={slotY[k]} size={TS} w={tws[k]} snapAt={land - 6} from={{dx: DR.x - slots[k], dy: DR.y - slotY[k], rot: 0}} newest={clamp01(1 - (f - land) / 12)} />
        );
      })}
    </Stage>
  );
};

export const shotK = (f: number): React.ReactNode => <ShotK f={f} />;
export const K_TIE = TIE;
