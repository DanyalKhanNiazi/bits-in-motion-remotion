/**
 * Ep06 kit: environments. Each is full-bleed, always alive (drifting light, dust, flowing traces) and takes the stage
 * camera pose so its layers parallax behind the world. All sit under the one grade.
 *   night    deep navy, slow light pools, drifting dust, a faint perspective floor grid
 *   stage    the hardware stage: dark studio, top spot, softbox glows, reflective floor, haze (rim-lit renders)
 *   archive  the room behind the Wall, light state warm | cool | scan | ssd
 *   flash    inside the SSD: graphite cells in erase groups, white and amber traces ('chip' is an alias)
 *   photo    a plate (reader-desk, …) with Ken Burns, grade, optional depth blur (DESK has the monitor's screen)
 *   void     near-black with a breathing centre glow and faint dust
 */
import React, {useMemo} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {PAL} from './look';
import {PLATE_H, PLATE_W, plateUrl, type PlateName} from './assets';
import type {Pose} from './camera';
import {TAU, clamp01, lerp, mixHex, osc, rgba, rnd, rr} from './util';

/** CSS transform for a full-frame layer that follows the camera by `f` (0 = fixed, 1 = moves with the world). */
export const parallaxCss = (p: Pose, f: number): string => {
  const z = Math.pow(p.zoom, f);
  const cx = 960 + (p.x - 960) * f;
  const cy = 540 + (p.y - 540) * f;
  return `translate(960px, 540px) rotate(${p.rot * f}deg) scale(${z}) translate(${-cx}px, ${-cy}px)`;
};
const Layer: React.FC<{pose: Pose; f: number; children: React.ReactNode; style?: React.CSSProperties}> = ({pose, f, children, style}) => (
  <AbsoluteFill style={{transform: parallaxCss(pose, f), transformOrigin: '0 0', ...style}}>{children}</AbsoluteFill>
);

/* ---------------------------------------------------------------- dust (shared) */
type Mote = {x: number; y: number; d: number; s: number; vx: number; vy: number; ph: number; bokeh: boolean; hue: number};
const motes = (seed: string, n: number, bokehShare = 0.18): Mote[] =>
  Array.from({length: n}, (_, i) => {
    const bokeh = rnd(`${seed}-b-${i}`) < bokehShare;
    return {
      x: rr(`${seed}-x-${i}`, -300, 2220),
      y: rr(`${seed}-y-${i}`, -200, 1280),
      d: rr(`${seed}-d-${i}`, 0.25, 1),
      s: bokeh ? rr(`${seed}-s-${i}`, 10, 30) : rr(`${seed}-s-${i}`, 1.6, 4),
      vx: rr(`${seed}-vx-${i}`, 0.05, 0.32),
      vy: rr(`${seed}-vy-${i}`, -0.28, -0.04),
      ph: rnd(`${seed}-p-${i}`),
      bokeh,
      hue: rnd(`${seed}-h-${i}`),
    };
  });

export const Dust: React.FC<{frame: number; pose: Pose; seed?: string; count?: number; color?: string; opacity?: number; bokeh?: number}> = ({
  frame,
  pose,
  seed = 'dust',
  count = 70,
  color = '#9CC8FF',
  opacity = 1,
  bokeh = 0.18,
}) => {
  const ms = useMemo(() => motes(seed, count, bokeh), [seed, count, bokeh]);
  const W = 2520;
  const H = 1480;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <radialGradient id={`${seed}-bk`}>
          <stop offset="0%" stopColor={color} stopOpacity={0.5} />
          <stop offset="55%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${seed}-bk2`}>
          <stop offset="0%" stopColor={PAL.structure} stopOpacity={0.36} />
          <stop offset="60%" stopColor={PAL.structure} stopOpacity={0.09} />
          <stop offset="100%" stopColor={PAL.structure} stopOpacity={0} />
        </radialGradient>
      </defs>
      {ms.map((m, i) => {
        const z = Math.pow(pose.zoom, m.d);
        const wx = ((((m.x + m.vx * frame + 300) % W) + W) % W) - 300;
        const wy = ((((m.y + m.vy * frame + 200) % H) + H) % H) - 200;
        const sx = 960 + (wx - 960 - (pose.x - 960) * m.d) * z;
        const sy = 540 + (wy - 540 - (pose.y - 540) * m.d) * z;
        const tw = 0.55 + 0.45 * Math.sin(TAU * (frame / (90 + m.ph * 120) + m.ph));
        if (m.bokeh) {
          const r = m.s * (0.7 + m.d * 0.6) * z;
          return <circle key={i} cx={sx} cy={sy} r={r} fill={`url(#${seed}-${m.hue < 0.3 ? 'bk2' : 'bk'})`} opacity={opacity * (0.35 + 0.4 * tw) * m.d} />;
        }
        return <circle key={i} cx={sx} cy={sy} r={m.s * 0.5 * (0.6 + m.d * 0.7)} fill={color} opacity={opacity * (0.25 + 0.55 * tw) * m.d} />;
      })}
    </svg>
  );
};

/* ---------------------------------------------------------------- night */
export const NightEnv: React.FC<{frame: number; pose: Pose; grid?: boolean; dust?: number; warm?: number}> = ({frame, pose, grid = true, dust = 70, warm = 0}) => {
  const pools = [
    {x: 960 + 460 * osc(frame, 900, 0.1), y: 420 + 140 * osc(frame, 1100, 0.6), r: 980, c: rgba('#1C6FA8', 0.2)},
    {x: 520 + 300 * osc(frame, 1300, 0.4), y: 300 + 120 * osc(frame, 800, 0.2), r: 820, c: rgba('#2B3F9A', 0.22)},
    {x: 1480 + 260 * osc(frame, 1000, 0.8), y: 640 + 120 * osc(frame, 1200, 0.3), r: 760, c: rgba(warm > 0 ? '#7A4A1C' : '#3A6AA8', warm > 0 ? 0.16 * warm : 0.1)},
  ];
  const yh = 640;
  const scroll = (frame * 0.018) % 1;
  const zs: number[] = [];
  for (let k = 0; k < 34; k++) zs.push(1 + k - scroll);
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
      <Layer pose={pose} f={0.06}>
        <div
          style={{
            position: 'absolute',
            left: -400,
            top: -300,
            width: 2720,
            height: 1680,
            background: 'radial-gradient(ellipse 52% 50% at 50% 44%, #15284A 0%, #0E1C36 38%, #091327 66%, #050A15 100%)',
          }}
        />
      </Layer>
      <Layer pose={pose} f={0.16}>
        {pools.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x - p.r,
              top: p.y - p.r * 0.7,
              width: p.r * 2,
              height: p.r * 1.4,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${p.c}, rgba(0,0,0,0))`,
            }}
          />
        ))}
      </Layer>
      {grid ? (
        <Layer pose={pose} f={0.4}>
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <defs>
              <linearGradient id="night-gridfade" x1="0" y1={yh} x2="0" y2={1300} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#6F8FCB" stopOpacity={0} />
                <stop offset="0.35" stopColor="#6F8FCB" stopOpacity={0.12} />
                <stop offset="1" stopColor="#6F8FCB" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <g stroke="url(#night-gridfade)" strokeWidth={1.6} fill="none">
              {Array.from({length: 41}, (_, i) => {
                const X = (i - 20) * 1.1;
                return <line key={`r${i}`} x1={960 + 900 * X} y1={yh + 560} x2={960} y2={yh} />;
              })}
              {zs.map((z, i) => {
                const y = yh + 560 / z;
                return <line key={`h${i}`} x1={-800} y1={y} x2={2720} y2={y} strokeWidth={lerp(0.8, 2.2, clamp01(1 / z))} />;
              })}
            </g>
            <rect x={-800} y={yh - 70} width={3520} height={140} fill="url(#night-horizon)" />
            <defs>
              <linearGradient id="night-horizon" x1="0" y1={yh - 70} x2="0" y2={yh + 70} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#1A3A66" stopOpacity={0} />
                <stop offset="0.5" stopColor="#24508A" stopOpacity={0.22} />
                <stop offset="1" stopColor="#1A3A66" stopOpacity={0} />
              </linearGradient>
            </defs>
          </svg>
        </Layer>
      ) : null}
      {dust > 0 ? <Dust frame={frame} pose={pose} seed="night" count={dust} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- flash (inside the SSD; replaces Ep03's ChipEnv) */
/**
 * Inside the flash: a receding floor of graphite cells laid out in erase groups, with white and amber traces running
 * the gaps (white = data moving, amber = the drive's own housekeeping). No cyan: the photo's Bits stay the only cyan.
 */
export const FlashEnv: React.FC<{frame: number; pose: Pose; pulses?: number; dust?: number; amber?: number}> = ({frame, pose, pulses = 1, dust = 40, amber = 1}) => {
  const TW = 352;
  const TH = 176;
  const yh = 330;
  const scroll = (frame * 0.6) % TH;
  // a tile = one erase group of 4 cells (2 page rows), traces along the gaps
  const cells: Array<[number, number, number, number]> = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) cells.push([14 + c * 82, 14 + r * 76, 72, 64]);
  const tr = [
    {d: `M0 ${TH - 8} H${TW}`, len: TW, c: 'w', ph: 0},
    {d: `M${TW - 9} 0 V${TH}`, len: TH, c: 'a', ph: 0.4},
    {d: `M0 84 H${TW}`, len: TW, c: 'w', ph: 0.7},
  ];
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
      <Layer pose={pose} f={0.08}>
        <div
          style={{
            position: 'absolute',
            left: -400,
            top: -300,
            width: 2720,
            height: 1680,
            background: `linear-gradient(180deg, #050608 0%, #0B0D12 ${(300 + yh) / 16.8}%, #1A1C22 ${(300 + yh + 20) / 16.8}%, #111318 70%, #08090C 100%)`,
          }}
        />
      </Layer>
      <Layer pose={pose} f={0.45}>
        <div style={{position: 'absolute', left: 960 - 2200, top: yh, width: 4400, height: 920, transformOrigin: '50% 0%', transform: 'perspective(1000px) rotateX(71deg)'}}>
          <svg width={4400} height={920} style={{position: 'absolute', left: 0, top: 0}}>
            <defs>
              <linearGradient id="flash-cell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={PAL.graphiteHi} />
                <stop offset="0.35" stopColor={PAL.graphite} />
                <stop offset="1" stopColor={PAL.graphiteLo} />
              </linearGradient>
              <pattern id="flash-tile" width={TW} height={TH} patternUnits="userSpaceOnUse" patternTransform={`translate(0 ${scroll})`}>
                <rect width={TW} height={TH} fill={PAL.trayEdge} />
                <rect x={5} y={5} width={TW - 14} height={TH - 18} rx={6} fill="#14161B" stroke="#2C2F36" strokeWidth={3} />
                {cells.map(([x, y, w, h], i) => (
                  <g key={i}>
                    <rect x={x} y={y} width={w} height={h} rx={3} fill="url(#flash-cell)" />
                    <rect x={x + 3} y={y + 3} width={w - 6} height={4} rx={2} fill="#7A7E88" opacity={0.5} />
                  </g>
                ))}
                {tr.map((t, i) => (
                  <path key={`b${i}`} d={t.d} stroke="#2A2D34" strokeWidth={4} fill="none" />
                ))}
                {pulses > 0
                  ? tr.map((t, i) => {
                      const col = t.c === 'a' ? PAL.drive : '#E8EDF5';
                      const per = t.len + 220;
                      const off = -((frame * (t.c === 'a' ? 4 : 6) + t.ph * per) % per);
                      return (
                        <g key={`p${i}`} opacity={(t.c === 'a' ? amber : 1) * pulses}>
                          <path d={t.d} fill="none" stroke={col} strokeOpacity={0.25} strokeWidth={10} strokeLinecap="round" strokeDasharray={`60 ${per - 60}`} strokeDashoffset={off} />
                          <path d={t.d} fill="none" stroke={col} strokeOpacity={0.95} strokeWidth={3} strokeLinecap="round" strokeDasharray={`36 ${per - 36}`} strokeDashoffset={off - 12} />
                        </g>
                      );
                    })
                  : null}
              </pattern>
              <linearGradient id="flash-fog" x1="0" y1="0" x2="0" y2="920" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#15171C" stopOpacity={1} />
                <stop offset="0.3" stopColor="#15171C" stopOpacity={0.4} />
                <stop offset="0.7" stopColor="#15171C" stopOpacity={0} />
              </linearGradient>
            </defs>
            <rect width={4400} height={920} fill="url(#flash-tile)" />
            <rect width={4400} height={920} fill="url(#flash-fog)" />
          </svg>
        </div>
        <div style={{position: 'absolute', left: -400, top: yh - 170, width: 2720, height: 340, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${rgba(PAL.drive, 0.1 * amber)}, rgba(0,0,0,0))`}} />
        <div style={{position: 'absolute', left: -400, top: yh - 90, width: 2720, height: 180, background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(220,228,240,0.10), rgba(0,0,0,0))'}} />
      </Layer>
      {dust > 0 ? <Dust frame={frame} pose={pose} seed="flash" count={dust} color="#E6D8BC" bokeh={0.3} /> : null}
    </AbsoluteFill>
  );
};
/** @deprecated Ep03 name: the Ep06 macro world is the flash (`env: 'flash'`). */
export const ChipEnv = FlashEnv;

/* ---------------------------------------------------------------- hardware stage */
/**
 * The hardware stage: a dark studio for rim-lit renders. A soft top spot (x = `spot`), two tall softbox glows behind,
 * a dark reflective floor from y = `floor`, a haze band on the floor and dust. `warm` (0..1) warms the key light.
 */
export const StageEnv: React.FC<{frame: number; pose: Pose; spot?: number; floor?: number; warm?: number; dust?: number}> = ({frame, pose, spot = 960, floor = 780, warm = 0.3, dust = 50}) => {
  const key = warm > 0.5 ? '#E8C9A0' : warm > 0 ? '#C9D3E6' : '#9FB6DA';
  const breathe = 0.9 + 0.1 * osc(frame, 260, 0.2);
  return (
    <AbsoluteFill style={{background: '#04060B', overflow: 'hidden'}}>
      <Layer pose={pose} f={0.05}>
        <div style={{position: 'absolute', left: -400, top: -300, width: 2720, height: 1680, background: 'radial-gradient(ellipse 60% 55% at 50% 40%, #121C30 0%, #0A101D 45%, #05070D 100%)'}} />
        {[-1, 1].map((sd) => (
          <div
            key={sd}
            style={{
              position: 'absolute',
              left: 960 + sd * 640 - 120,
              top: -60,
              width: 240,
              height: floor + 80,
              background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${rgba('#6F8FC4', 0.16 * breathe)}, rgba(0,0,0,0))`,
            }}
          />
        ))}
      </Layer>
      <Layer pose={pose} f={0.25}>
        <div
          style={{
            position: 'absolute',
            left: spot - 760 + 40 * osc(frame, 700, 0.1),
            top: -260,
            width: 1520,
            height: floor + 300,
            background: `radial-gradient(ellipse 42% 62% at 50% 22%, ${rgba(key, 0.2 * breathe)}, ${rgba(key, 0.06)} 55%, rgba(0,0,0,0) 80%)`,
          }}
        />
      </Layer>
      <Layer pose={pose} f={0.6}>
        <div style={{position: 'absolute', left: -1200, top: floor, width: 4320, height: 1400, background: 'linear-gradient(180deg, #0D1424 0%, #070A12 22%, #04060B 60%)'}} />
        <div style={{position: 'absolute', left: -1200, top: floor - 2, width: 4320, height: 3, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba('#8FA6CC', 0.22)}, rgba(0,0,0,0))`}} />
        <div
          style={{
            position: 'absolute',
            left: spot - 700,
            top: floor - 10,
            width: 1400,
            height: 260,
            background: `radial-gradient(ellipse 50% 40% at 50% 20%, ${rgba(key, 0.13 * breathe)}, rgba(0,0,0,0))`,
          }}
        />
        <div style={{position: 'absolute', left: -1200, top: floor - 90, width: 4320, height: 200, background: `linear-gradient(180deg, rgba(0,0,0,0), ${rgba('#22324F', 0.22)}, rgba(0,0,0,0))`}} />
      </Layer>
      {dust > 0 ? <Dust frame={frame} pose={pose} seed="stage" count={dust} color="#C8D4EA" opacity={0.8} bokeh={0.2} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- the archive room (light states per chapter) */
export type ArchiveLight = 'warm' | 'cool' | 'scan' | 'ssd';
/** Key/fill/haze colours of the archive's light states (DIRECTION §3c); <Archive light> uses the same table. */
export const ARCHIVE_LIGHT: Record<ArchiveLight, {key: string; fill: string; haze: string; ground: string; keyAmt: number}> = {
  /** before the delete: warm-neutral key from the upper left */
  warm: {key: '#E9CFA6', fill: '#2A4470', haze: '#1B2944', ground: '#0B1220', keyAmt: 0.2},
  /** after "empty the bin": cooler, thinner */
  cool: {key: '#A9C2E8', fill: '#1E3A6A', haze: '#16233B', ground: '#08101D', keyAmt: 0.17},
  /** S4: the scanner's white light */
  scan: {key: '#F2F5FA', fill: '#26385A', haze: '#1A2438', ground: '#090F1B', keyAmt: 0.22},
  /** SSD: graphite + amber */
  ssd: {key: '#D9D2C4', fill: '#3A3226', haze: '#1C1C20', ground: '#0B0C0F', keyAmt: 0.15},
};
/**
 * The archive room behind the Wall: a deep ground, a key-light pool from the upper left, a low fill, slow haze banks
 * and dust. The wall itself (and its haze-faded continuation) is drawn by <Archive>.
 */
export const ArchiveEnv: React.FC<{frame: number; pose: Pose; light?: ArchiveLight; dust?: number}> = ({frame, pose, light = 'warm', dust = 46}) => {
  const L = ARCHIVE_LIGHT[light];
  const br = 0.92 + 0.08 * osc(frame, 300, 0.3);
  return (
    <AbsoluteFill style={{background: L.ground, overflow: 'hidden'}}>
      <Layer pose={pose} f={0.08}>
        <div style={{position: 'absolute', left: -500, top: -400, width: 2920, height: 1880, background: `radial-gradient(ellipse 55% 50% at 55% 45%, ${mixHex(L.ground, L.fill, 0.55)} 0%, ${L.ground} 62%, #03050A 100%)`}} />
        <div
          style={{
            position: 'absolute',
            left: -300 + 60 * osc(frame, 900, 0.1),
            top: -420,
            width: 1800,
            height: 1300,
            background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${rgba(L.key, L.keyAmt * br)}, ${rgba(L.key, L.keyAmt * 0.3)} 45%, rgba(0,0,0,0) 75%)`,
          }}
        />
        {light === 'ssd' ? (
          <div style={{position: 'absolute', left: 300, top: 700, width: 1100, height: 700, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${rgba(PAL.drive, 0.09 * br)}, rgba(0,0,0,0) 70%)`}} />
        ) : null}
      </Layer>
      <Layer pose={pose} f={0.3}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -900 + ((frame * (0.25 + 0.1 * i) + i * 700) % 1400) - 300,
              top: 260 + i * 260,
              width: 2600,
              height: 240,
              background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${rgba(L.haze, 0.55)}, rgba(0,0,0,0))`,
              opacity: 0.8,
            }}
          />
        ))}
      </Layer>
      {dust > 0 ? <Dust frame={frame} pose={pose} seed={`arch-${light}`} count={dust} color={light === 'ssd' ? '#E6D8BC' : '#B8C8E6'} opacity={0.75} bokeh={0.22} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- the reader's desk (Ep03 plate) */
/**
 * The reader-desk plate (public/ep03/assets/reader-desk.png, 1672×941 plate px). The monitor faces the camera, so its
 * active screen is a rectangle: DESK.screen (plate px). A UI made for a `DESK.slotW × DESK.slotH` slot goes in
 * `<ScreenSlot rect={REGIONS.deskScreen}>` inside the photo env's `children`. On screen 1 slot px = COVER × kb.s px
 * (≈ 1.148 × s; default drift ≈ 1.19; DESK.kbMonitor 1.78; DESK.kbScreen 1.98): use deskSlotScale().
 */
export const DESK = {
  plate: 'reader-desk' as PlateName,
  /** monitor active screen in plate px: TL, TR, BR, BL (flat, front-on) */
  screen: [
    [320, 98],
    [1352, 98],
    [1352, 645],
    [320, 645],
  ] as const,
  /** the glass edge (bezel inside) in plate px */
  glass: [314, 92, 1356, 647] as const,
  slotW: 1032,
  slotH: 547,
  /** Ken Burns where the screen's active area fills the frame (the S1→S2 handoff push ends here): ky = 99 × 1.1483 × s */
  kbScreen: {s: 1.72, x: 0, y: 196},
  /** the screen almost fills the frame with the bezel showing (Ep03's chat framing) */
  kbMonitor: {s: 1.55, x: 0, y: 176},
  /** a gentle wide on the desk (lamp top-right) */
  kbWide: {s: 1.04, x: 0, y: 0},
} as const;
/** Screen px per slot px on the desk plate at a frame (pass the same kb as the Stage env). */
export const deskSlotScale = (frame: number, kb?: KenBurns, view?: Pose): number => plateToStage(frame, kb, 0, 0, view).scale;
/** The monitor screen's rectangle in stage px at a frame: {x, y, w, h, scale}. */
export const deskScreenRect = (frame: number, kb?: KenBurns, view?: Pose): {x: number; y: number; w: number; h: number; scale: number} => {
  const a = plateToStage(frame, kb, DESK.screen[0][0], DESK.screen[0][1], view);
  const b = plateToStage(frame, kb, DESK.screen[2][0], DESK.screen[2][1], view);
  return {x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y, scale: a.scale};
};

/* ---------------------------------------------------------------- void */
export const VoidEnv: React.FC<{frame: number; pose: Pose; dust?: number}> = ({frame, pose, dust = 30}) => (
  <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
    <Layer pose={pose} f={0.1}>
      <div
        style={{
          position: 'absolute',
          left: -400,
          top: -300,
          width: 2720,
          height: 1680,
          background: `radial-gradient(ellipse 40% 42% at 50% ${46 + 2 * osc(frame, 300)}%, rgba(20,40,74,${0.75 + 0.15 * osc(frame, 240)}) 0%, rgba(9,16,32,0.6) 50%, rgba(4,7,14,0) 100%)`,
        }}
      />
    </Layer>
    {dust > 0 ? <Dust frame={frame} pose={pose} seed="void" count={dust} opacity={0.7} /> : null}
  </AbsoluteFill>
);

/* ---------------------------------------------------------------- photo */
export type KenBurns = {from?: {s?: number; x?: number; y?: number}; to?: {s?: number; x?: number; y?: number}; start?: number; end?: number};
export type PhotoOpts = {
  plate: PlateName;
  /** Ken Burns in stage px and scale (multiplies the cover fit). Omit for a slow endless drift. */
  kb?: KenBurns;
  /** depth blur in px (background use) */
  blur?: number;
  /** 0..1 darkening (default 0.12) */
  dim?: number;
  /** 0..1 navy tint (default 0.25) */
  tint?: number;
  /** children in PLATE px (1672×941), e.g. <ScreenSlot rect={REGIONS.deskScreen}>…</ScreenSlot> */
  children?: React.ReactNode;
  /** 0..1 bottom gradient for text legibility (default 0.35) */
  floor?: number;
};
export const COVER = Math.max(1920 / PLATE_W, 1080 / PLATE_H);

export const kenBurnsAt = (frame: number, kb?: KenBurns): {s: number; x: number; y: number} => {
  if (!kb) {
    return {s: 1.05 + 0.025 * (0.5 + 0.5 * osc(frame, 700, 0.75)), x: 16 * osc(frame, 900, 0.1), y: 9 * osc(frame, 640, 0.4)};
  }
  const a = {s: 1.04, x: 0, y: 0, ...(kb.from ?? {})};
  const b = {s: 1.12, x: 0, y: 0, ...(kb.to ?? {})};
  const st = kb.start ?? 0;
  const en = kb.end ?? st + 300;
  const t = clamp01((frame - st) / Math.max(1, en - st));
  const e = t * t * (3 - 2 * t) * 0.6 + t * 0.4; // never stops dead
  return {s: lerp(a.s, b.s, e), x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e)};
};

/**
 * Overscan: the smallest extra scale (about the plate point under the frame centre) that keeps the plate covering the
 * whole frame for this camera view, and the matching Ken Burns offset. e = 1 (no change) whenever it already covers.
 */
export const plateCover = (k: {s: number; x: number; y: number}, view?: Pose, blur = 0): {e: number; x: number; y: number} => {
  const v = view ?? {x: 960, y: 540, zoom: 1, rot: 0};
  const S = COVER * k.s;
  const r = (-v.rot * Math.PI) / 180;
  const cs = Math.cos(r);
  const sn = Math.sin(r);
  const toPlate = (sx: number, sy: number) => {
    const dx = (sx - 960) / v.zoom;
    const dy = (sy - 540) / v.zoom;
    const wx = v.x + dx * cs - dy * sn;
    const wy = v.y + dx * sn + dy * cs;
    return {x: PLATE_W / 2 + (wx - 960 - k.x) / S, y: PLATE_H / 2 + (wy - 540 - k.y) / S};
  };
  const m = 8 + blur * 2;
  const q = toPlate(960, 540);
  const q0 = {x: Math.min(PLATE_W * 0.95, Math.max(PLATE_W * 0.05, q.x)), y: Math.min(PLATE_H * 0.95, Math.max(PLATE_H * 0.05, q.y))};
  let e = 1;
  const corners: Array<[number, number]> = [
    [-m, -m],
    [1920 + m, -m],
    [1920 + m, 1080 + m],
    [-m, 1080 + m],
  ];
  for (const [sx, sy] of corners) {
    const c = toPlate(sx, sy);
    if (c.x > PLATE_W) e = Math.max(e, (c.x - q0.x) / (PLATE_W - q0.x));
    if (c.x < 0) e = Math.max(e, (q0.x - c.x) / q0.x);
    if (c.y > PLATE_H) e = Math.max(e, (c.y - q0.y) / (PLATE_H - q0.y));
    if (c.y < 0) e = Math.max(e, (q0.y - c.y) / q0.y);
  }
  return {e, x: k.x + (q0.x - PLATE_W / 2) * S * (1 - e), y: k.y + (q0.y - PLATE_H / 2) * S * (1 - e)};
};

/** Plate px → stage px (before the stage camera) at a frame. Pass the Stage's view (and blur) to match its overscan. */
export const plateToStage = (frame: number, kb: KenBurns | undefined, px: number, py: number, view?: Pose, blur = 0): {x: number; y: number; scale: number} => {
  const k = kenBurnsAt(frame, kb);
  const c = plateCover(k, view, blur);
  const s = COVER * k.s * c.e;
  return {x: 960 + c.x + (px - PLATE_W / 2) * s, y: 540 + c.y + (py - PLATE_H / 2) * s, scale: s};
};

export const PhotoPlate: React.FC<{frame: number; view?: Pose} & PhotoOpts> = ({frame, plate, kb, blur = 0, dim = 0.12, tint = 0.25, children, floor = 0.35, view}) => {
  const k0 = kenBurnsAt(frame, kb);
  const cov = plateCover(k0, view, blur);
  const k = {s: k0.s * cov.e, x: cov.x, y: cov.y};
  const s = COVER * k.s;
  return (
    <AbsoluteFill style={{background: PAL.void}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: PLATE_W,
          height: PLATE_H,
          transformOrigin: '0 0',
          transform: `translate(${960 + k.x}px, ${540 + k.y}px) scale(${s}) translate(${-PLATE_W / 2}px, ${-PLATE_H / 2}px)`,
          filter: blur > 0 ? `blur(${blur / s}px)` : undefined,
        }}
      >
        <Img
          src={plateUrl(plate)}
          style={{position: 'absolute', left: 0, top: 0, width: PLATE_W, height: PLATE_H, filter: `brightness(${1 - dim}) contrast(1.08) saturate(0.94)`}}
        />
        <div style={{position: 'absolute', left: 0, top: 0, width: PLATE_W, height: PLATE_H, background: rgba('#0A1630', tint), mixBlendMode: 'multiply'}} />
        {children}
      </div>
      {floor > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: -2000,
            top: 0,
            width: 5920,
            height: 3080,
            background: `linear-gradient(180deg, rgba(4,7,14,0) 0px, rgba(4,7,14,0) 670px, rgba(4,7,14,${floor}) 1080px, rgba(4,7,14,${floor}) 100%)`,
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
