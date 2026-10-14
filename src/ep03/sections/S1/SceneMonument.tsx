/**
 * S1 shot 7, the escalation: "Almost 16 gigabytes! For one piece!"
 * The owner's crate render (kit <Crate>, hero three-quarter view, "≈16 GB" mapped onto its blank plate) drops and
 * lands on "16" with a heavy hit while the camera holds tight on the plate; a light sweep crosses the crate and the
 * plate flares on "gigabytes". On "For ONE piece!" the camera pulls back: the crate looms on the left, the one tile it
 * produced sits spotlit at its foot (120 px on screen, the Bit on it), and the words slam in one by one, the last with
 * a dolly punch and a shake.
 */
import React from 'react';
import {BitHead, CRATE_RENDERS, Crate, KineticText, PAL, Stage, TokenTile, poseAt, toScreen, type CamKey} from '../../kit';
import {basis, hull, polyD, project, seg, type Basis, type Cam3, type V3} from '../../kit';
import {EASE, TAU, clamp01, lerp, prog, rgba, rr, textWidth, useFontsReady} from '../../kit';
import {A, T} from './anchors';
import {NEXT_WORD} from './SceneMacro';

const LAND = A.sixteen2;
const DROP_AT = A.almost2;
/** kit crate footprint size: long side 1.3 S along x, depth 0.92 S, height 0.62 S */
const S = 5.6;
const LONG = 1.3 * S;
const DEEP = 0.92 * S;
const TALL = 0.62 * S;
const TILE_P: V3 = [7.5, 0.3, 1.5];
const T_SIZE = 80;

const cam3 = (f: number): Cam3 => ({
  tx: 0.9 + 0.2 * Math.sin((TAU * f) / 400),
  ty: 1.8,
  tz: 0,
  yaw: 24 + Math.sin((TAU * f) / 330) + 1.5 * prog(f, A.almost2, 120, EASE.inOut),
  pitch: 16 + 0.5 * Math.sin((TAU * f) / 280),
  dist: 15 - 0.6 * prog(f, A.almost2, 70, EASE.out),
  fov: 38,
});

/** the crate drops on "Almost" and lands on "16" */
const dropY = (f: number) => (f < LAND ? 3.0 * (1 - Math.pow(clamp01((f - DROP_AT) / (LAND - DROP_AT)), 2)) : 0);

/** The plate quad on screen (TL, TR, BR, BL) for the hero render, as the kit Crate maps it. */
const plateQuad = (b: Basis, y: number): Array<[number, number]> | null => {
  const R = CRATE_RENDERS.a;
  const yaw = (Math.atan2(-b.f[0], -b.f[2]) * 180) / Math.PI;
  const mirror = yaw > 0;
  const foot = project(b, [mirror ? LONG / 2 : -LONG / 2, y, DEEP / 2]);
  if (!foot) return null;
  const xs: number[] = [];
  for (const cx of [-LONG / 2, LONG / 2])
    for (const cz of [-DEEP / 2, DEEP / 2])
      for (const cy of [y, y + TALL]) {
        const q = project(b, [cx, cy, cz]);
        if (!q) return null;
        xs.push(q[0]);
      }
  const k = (Math.max(...xs) - Math.min(...xs)) / (R.x1 - R.x0);
  const fx = mirror ? R.w - R.foot[0] : R.foot[0];
  const left = foot[0] - fx * k;
  const top = foot[1] - R.foot[1] * k;
  const P = R.plate.map(([px, py]) => [left + (mirror ? R.w - px : px) * k, top + py * k] as [number, number]);
  return mirror ? [P[1], P[0], P[3], P[2]] : P;
};
const boxPts = (b: Basis, y: number) => {
  const out: Array<[number, number]> = [];
  for (const cx of [-LONG / 2, LONG / 2])
    for (const cz of [-DEEP / 2, DEEP / 2])
      for (const cy of [y, y + TALL]) {
        const q = project(b, [cx, cy, cz]);
        if (q) out.push(q);
      }
  return out;
};
const centre = (q: Array<[number, number]>) => ({x: q.reduce((s, p) => s + p[0], 0) / q.length, y: q.reduce((s, p) => s + p[1], 0) / q.length});

const camKeys = (): CamKey[] => {
  const bL = basis(cam3(LAND + 6));
  const pq = plateQuad(bL, 0);
  const pc = pq ? centre(pq) : {x: 800, y: 580};
  const bO = basis(cam3(A.one));
  const right = Math.max(...boxPts(bO, 0).map((p) => p[0]));
  const tp = project(bO, TILE_P) ?? [1700, 890];
  const Z = 1.3;
  const cx = right - (1150 - 960) / Z;
  const cy = tp[1] - (820 - 540) / Z;
  return [
    {f: DROP_AT, x: pc.x, y: pc.y - 20, zoom: 2.0},
    {f: A.for - 15, x: pc.x + 8, y: pc.y - 10, zoom: 2.12},
    {f: A.for + 1, x: cx, y: cy, zoom: Z, dur: 16, ease: 'inOut'},
    {f: A.pieceBang - 1, x: cx, y: cy, zoom: Z + 0.01},
    {f: A.pieceBang + 4, x: cx + 3, y: cy + 2, zoom: Z + 0.08, dur: 5, ease: 'outExpo'},
    {f: T.toQuestion + 14, x: cx + 8, y: cy - 4, zoom: Z + 0.05},
  ];
};

export const SceneMonument: React.FC<{frame: number}> = ({frame: f}) => {
  useFontsReady();
  const b = basis(cam3(f));
  const dy = dropY(f);
  const D = (pts: readonly V3[]) => polyD(b, pts);
  const nodes: React.ReactNode[] = [];
  let n = 0;
  const K = () => `m${n++}`;
  // floor grid
  for (let i = -14; i <= 14; i++) {
    const s1 = seg(b, [i * 1.6, 0, -24], [i * 1.6, 0, 16]);
    const s2 = seg(b, [-24, 0, i * 1.6], [24, 0, i * 1.6]);
    [s1, s2].forEach((s) => {
      if (s) nodes.push(<line key={K()} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke="#6F8FCB" strokeOpacity={0.13} strokeWidth={1.4} />);
    });
  }
  const landK = f >= LAND ? Math.exp(-(f - LAND) / 10) : 0;
  const pool: V3[] = Array.from({length: 40}, (_, i) => {
    const a = (TAU * i) / 40;
    return [Math.cos(a) * (5.6 + 0.4 * landK), 0.002, Math.sin(a) * (4.4 + 0.4 * landK)];
  });
  nodes.push(<path key={K()} d={D(pool)} fill={rgba(PAL.info, 0.06 + 0.25 * landK)} />);
  nodes.push(
    <path
      key={K()}
      d={D([
        [-LONG / 2 - 0.3, 0.003, -DEEP / 2 - 0.3],
        [LONG / 2 + 0.3, 0.003, -DEEP / 2 - 0.3],
        [LONG / 2 + 0.3, 0.003, DEEP / 2 + 0.3],
        [-LONG / 2 - 0.3, 0.003, DEEP / 2 + 0.3],
      ])}
      fill="#000"
      opacity={0.55 * clamp01(1 - dy / 3)}
    />,
  );
  // shockwave rings on the floor at the landing
  [0, 5].forEach((lag, ri) => {
    const u = clamp01((f - LAND - lag) / 26);
    if (f < LAND + lag || u >= 1) return;
    const r = lerp(4.8, 20, EASE.outExpo(u));
    const ring: V3[] = Array.from({length: 64}, (_, i) => [Math.cos((TAU * i) / 64) * r, 0.01, Math.sin((TAU * i) / 64) * r * 0.85]);
    nodes.push(<path key={K()} d={D(ring)} fill="none" stroke={PAL.info} strokeOpacity={(1 - u) * (ri ? 0.4 : 0.8)} strokeWidth={4 + 10 * (1 - u)} />);
  });
  // streaks above the crate while it falls
  const streaks: React.ReactNode[] = [];
  if (dy > 0.2) {
    for (let i = 0; i < 9; i++) {
      const x = lerp(-LONG / 2, LONG / 2, (i + 0.5) / 9);
      const s = seg(b, [x, TALL + dy + 0.3, DEEP / 2], [x, TALL + dy + 0.3 + 4 * clamp01(dy / 3), DEEP / 2]);
      if (s) streaks.push(<line key={`s${i}`} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} stroke={PAL.infoPale} strokeOpacity={0.35} strokeWidth={3} />);
    }
  }
  // dust thrown out at the landing
  const dust: React.ReactNode[] = [];
  if (f >= LAND && f < LAND + 34) {
    for (let i = 0; i < 46; i++) {
      const a = rr(`md${i}`, 0, TAU);
      const t = f - LAND;
      const r = 4.2 + rr(`ms${i}`, 0.25, 0.7) * t;
      const y = Math.max(0, rr(`mv${i}`, 0.05, 0.22) * t - 0.012 * t * t);
      const p = project(b, [Math.cos(a) * r, y, Math.sin(a) * r * 0.85]);
      if (p) dust.push(<circle key={`d${i}`} cx={p[0]} cy={p[1]} r={rr(`mr${i}`, 2, 5)} fill={i % 3 ? '#BFD6F5' : PAL.info} opacity={0.8 * (1 - t / 34)} />);
    }
  }
  // the light sweep over the crate and the plate flare on "gigabytes"
  const hullD = (() => {
    const h = hull(boxPts(b, dy));
    return h.length > 2 ? `M ${h.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')} Z` : '';
  })();
  const sw = prog(f, A.gigabytes2 - 4, 22, EASE.inOut);
  const swOn = f >= A.gigabytes2 - 4 && sw < 1;
  const pq = plateQuad(b, dy);
  const flare = f >= A.gigabytes2 ? Math.exp(-(f - A.gigabytes2) / 12) : 0;
  const pqD = pq ? `M ${pq.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ')} Z` : '';
  // the tile and its spotlight
  const tp = project(b, TILE_P) ?? [1700, 890];
  const tc = {x: tp[0], y: tp[1]};
  const spot = prog(f, A.for - 6, 14, EASE.out);
  const one = f >= A.one ? Math.exp(-(f - A.one) / 10) : 0;
  const hits = [
    {at: LAND, strength: 2.2},
    {at: A.pieceBang, strength: 1.5},
  ];
  const defocus = 2.4 * spot;
  const cam = camKeys();
  const pose = poseAt(f, cam, 1, hits);
  const ts = toScreen(pose, tc.x, tc.y);
  // "For ONE piece!": three word-locked slams laid out from measured widths, then a punch and a shake on "piece!"
  const cx0 = 1190;
  const wFor = textWidth('For', 110, 700);
  const capOn = prog(f, A.for - 2, 8);
  const pk = f >= A.pieceBang ? f - A.pieceBang : -1;
  const punch = pk >= 0 ? 1 + 0.1 * Math.exp(-pk / 4) * Math.cos(pk * 0.7) : 1;
  const sx = pk >= 0 && pk < 18 ? 16 * Math.exp(-pk / 4) * Math.sin(pk * 2.9) : 0;
  const sy = pk >= 0 && pk < 18 ? 10 * Math.exp(-pk / 4) * Math.cos(pk * 3.7) : 0;
  return (
    <Stage
      frame={f}
      env={{kind: 'void', dust: 40}}
      cam={cam}
      shake={hits}
      hud={
        <>
          {capOn > 0 ? (
            <div style={{position: 'absolute', left: cx0 - 200, top: 120, width: 960, height: 560, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#03060D', 0.74 * capOn)}, ${rgba('#03060D', 0.42 * capOn)} 60%, rgba(3,6,13,0))`}} />
          ) : null}
          {/* the one tile: fixed on-screen size, anchored to its spot on the floor, the Bit on it */}
          <div style={{position: 'absolute', left: ts.x, top: ts.y, width: 0, height: 0}}>
            <TokenTile frame={f} text={NEXT_WORD} x={0} y={0} size={T_SIZE} newest={0.6 + 0.4 * one} />
          </div>
          <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <BitHead x={ts.x} y={ts.y - T_SIZE * 1.25 + 3 * Math.sin((TAU * f) / 36)} size={30} gid="s1mon" />
          </svg>
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translate(${sx}px, ${sy}px) scale(${punch})`, transformOrigin: `${cx0 + 320}px 400px`}}>
            <KineticText frame={f} at={A.for} text="For" mode="slam" x={cx0} y={300} size={110} align="left" backing="none" />
            <KineticText frame={f} at={A.one} text="ONE" mode="slam" x={cx0 + wFor + 40} y={292} size={180} align="left" backing="none" color={PAL.info} />
            <KineticText frame={f} at={A.pieceBang} text="piece!" mode="slam" x={cx0} y={500} size={150} align="left" backing="none" />
          </div>
        </>
      }
    >
      {/* spotlight: everything but the tile dims after "For" */}
      <div style={{position: 'absolute', left: -1200, top: -900, width: 4400, height: 3000, background: `radial-gradient(circle at ${tc.x + 1200}px ${tc.y + 900}px, rgba(2,4,10,0) 150px, rgba(2,4,10,${0.5 * spot}) 560px)`, zIndex: 3, pointerEvents: 'none'}} />
      <div style={{position: 'absolute', left: tc.x - 200, top: tc.y - 10, width: 400, height: 90, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.info, 0.22 * spot + 0.3 * one)}, rgba(0,0,0,0))`}} />
      {[0, 14].map((lag) => {
        if (f < A.for + lag) return null;
        const u = ((f - A.for - lag) % 36) / 36;
        return <div key={lag} style={{position: 'absolute', left: tc.x - 40 - 130 * u, top: tc.y + 16 - 30 * u, width: 80 + 260 * u, height: 22 + 60 * u, borderRadius: '50%', border: `3px solid ${rgba(PAL.infoPale, 0.8 * (1 - u) * spot)}`}} />;
      })}
      <div style={{position: 'absolute', inset: 0, filter: defocus > 0.05 ? `blur(${defocus}px)` : undefined}}>
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <defs>
            <filter id="s1-mon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={10} />
            </filter>
            {hullD ? (
              <clipPath id="s1-mon-hull">
                <path d={hullD} />
              </clipPath>
            ) : null}
          </defs>
          {nodes}
          {streaks}
          <Crate b={b} x={0} z={0} y={dy} s={S} label="≈16 GB" hero glowFilter="s1-mon-glow" />
          {pqD ? (
            <g opacity={0.3 + 0.7 * flare}>
              <path d={pqD} fill="none" stroke={PAL.info} strokeWidth={14} filter="url(#s1-mon-glow)" />
              <path d={pqD} fill="none" stroke={PAL.infoPale} strokeWidth={3} />
            </g>
          ) : null}
          {swOn && hullD ? (
            <g clipPath="url(#s1-mon-hull)" style={{mixBlendMode: 'screen'}}>
              <rect x={lerp(-400, 2200, sw) - 160} y={-200} width={220} height={1500} fill="#FFFFFF" opacity={0.3 * Math.sin(Math.PI * sw)} transform="skewX(-18)" />
            </g>
          ) : null}
          {dust}
        </svg>
      </div>
    </Stage>
  );
};
