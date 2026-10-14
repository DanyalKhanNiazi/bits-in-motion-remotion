/**
 * S3 · THE LOOP: the film's one-token-per-run diagram.
 *
 * Layout (all relative to the ring centre C and radius r; screen angles clockwise from 12 o'clock):
 *   12 o'clock  the model (compute chip BIM141) — the Bit passes through it: one run
 *    3 o'clock  the pick (a small weighted wheel)
 *    6 o'clock  the end of the answer strip, where each new token is tacked on (strip runs left from here)
 *    9 o'clock  the way back up: all the tokens so far go back into the model
 * The Bit laps clockwise; lap position p: 0 = 6 o'clock, 0.25 = 9, 0.5 = 12, 0.75 = 3, 1 = back at 6.
 *
 * Other sections may import <TheLoop>/<Strip> from here (read-only) to call the motif back.
 */
import React, {useId} from 'react';
import {BitHead, EASE, PAL, Prop, TokenTile, clamp01, lerp, prog, rgba, safeId, springAt, tileH, tileW} from '../../kit';
import {Wheel, type Slice} from './wheel';

export const lapAngle = (p: number) => 180 + 360 * p;
const angDiff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;
export type LoopGeo = {cx: number; cy: number; r: number; bend?: number; bendDir?: number};
export const ringR = (g: LoopGeo, deg: number) => g.r * (1 + 0.42 * (g.bend ?? 0) * Math.exp(-((angDiff(deg, g.bendDir ?? 90) / 52) ** 2)));
export const ringPt = (g: LoopGeo, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  const R = ringR(g, deg);
  return [g.cx + R * Math.sin(a), g.cy - R * Math.cos(a)];
};
export const lapPt = (g: LoopGeo, p: number) => ringPt(g, lapAngle(p));
const arcD = (g: LoopGeo, a0: number, a1: number, n = 72): string => {
  const pts: string[] = [];
  const steps = Math.max(2, Math.ceil((Math.abs(a1 - a0) / 360) * n));
  for (let i = 0; i <= steps; i++) {
    const [x, y] = ringPt(g, lerp(a0, a1, i / steps));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${pts.join('L')}`;
};

/** The pick wheel's slices: unlabeled candidates plus one dark, dashed slice for the hidden end token. */
export const PICK_SLICES: Slice[] = [
  {w: 'a', p: 0.22},
  {w: 'b', p: 0.12},
  {w: 'c', p: 0.17},
  {w: 'd', p: 0.08},
  {w: 'e', p: 0.14},
  {w: 'END', p: 0.07},
  {w: 'f', p: 0.11},
  {w: 'g', p: 0.09},
];
export const PICK_END = 5;

export type LoopProps = {
  frame: number;
  g: LoopGeo;
  /** Bit lap position (and the previous frame's, for the streak) */
  p: number;
  pPrev: number;
  /** route reveal: the arc from lap position `drawFrom` over `drawn` laps (≥ 1 = whole ring) */
  drawFrom?: number;
  drawn?: number;
  /** a bright pulse around the whole ring (0..1) */
  ignite?: number;
  /** dims the lit route and the Bit (the loop stopped) */
  dim?: number;
  showBit?: boolean;
  opacity?: number;
  /** model chip */
  chip?: {opacity: number; flash: number; drop?: number};
  /** pick wheel at 3 o'clock */
  pick?: {rot: number; rotPrev: number; lit: number; k: number; opacity: number; scale?: number};
  /** direction chevrons opacity */
  chevrons?: number;
  /** extra glow when the laps are a blur (0..1) */
  spin?: number;
  /** frames since the ring locked shut (the click): a snap, notches, a shockwave; undefined = none */
  lock?: number;
};

export const TheLoop: React.FC<LoopProps> = ({
  frame: f,
  g,
  p,
  pPrev,
  drawFrom = 0,
  drawn = 1,
  ignite = 0,
  dim = 0,
  showBit = true,
  opacity = 1,
  chip,
  pick,
  chevrons = 0.45,
  spin = 0,
  lock,
}) => {
  const uid = safeId(useId());
  const full = arcD(g, 0, 360, 120) + 'Z';
  const a0 = lapAngle(drawFrom);
  const a1 = a0 + 360 * clamp01(drawn);
  const lit = drawn >= 1 ? full : arcD(g, a0, a1);
  const live = 1 - 0.65 * dim;
  const head = lapPt(g, p);
  const dp = p - pPrev;
  const spd = Math.abs(dp) * 360; // deg per frame
  const trailDeg = Math.min(170, spd * 6.5);
  const hidden = chip && chip.opacity > 0.5 && Math.abs(angDiff(lapAngle(p), 0)) < 9; // inside the model
  const sw = Math.max(3, g.r * 0.018);
  // the lock: the ring snaps (overshoot and settle), notches clamp shut, a shockwave rolls out
  const lk = lock !== undefined && lock >= 0 && lock < 40 ? lock : -1;
  const snap = lk >= 0 ? 0.045 * Math.exp(-lk / 4.5) * Math.cos(lk * 0.95) : 0;
  const chipPt = ringPt(g, 0);
  const pickPt = ringPt(g, 90);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: snap ? `translate(${g.cx}px, ${g.cy}px) scale(${1 + snap}) translate(${-g.cx}px, ${-g.cy}px)` : undefined}}>
        <defs>
          <filter id={`${uid}-gl`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={g.r * 0.035} />
          </filter>
          <radialGradient id={`${uid}-core`} cx={g.cx} cy={g.cy} r={g.r * 0.92} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0E1C38" stopOpacity={0.85} />
            <stop offset="0.75" stopColor="#0A1428" stopOpacity={0.55} />
            <stop offset="1" stopColor="#081022" stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* the inner disc, so the centre reads as a stage */}
        <circle cx={g.cx} cy={g.cy} r={g.r * 0.92} fill={`url(#${uid}-core)`} opacity={clamp01(drawn * drawn * 1.2)} />
        {/* the track: a dark rail with bevel lines, laid down behind the Bit on its first lap */}
        <g opacity={drawn >= 1 ? 1 : 0.999}>
          <path d={drawn >= 1 ? full : arcD(g, a0 - 2, a1 + 4)} fill="none" stroke="#0B1530" strokeWidth={sw * 6.5} strokeLinejoin="round" strokeLinecap="round" opacity={0.92} />
          <path d={drawn >= 1 ? full : arcD(g, a0 - 2, a1 + 4)} fill="none" stroke={rgba('#5E7BB5', 0.35)} strokeWidth={sw * 6.5} strokeLinejoin="round" opacity={0.5} strokeDasharray="2 10" />
          <path d={drawn >= 1 ? arcD(g, 0, 360, 120) : arcD(g, a0, a1)} fill="none" stroke={rgba('#7F98C8', 0.4)} strokeWidth={1.6} transform={`translate(${g.cx} ${g.cy}) scale(1.06) translate(${-g.cx} ${-g.cy})`} />
          <path d={drawn >= 1 ? arcD(g, 0, 360, 120) : arcD(g, a0, a1)} fill="none" stroke={rgba('#7F98C8', 0.32)} strokeWidth={1.6} transform={`translate(${g.cx} ${g.cy}) scale(0.94) translate(${-g.cx} ${-g.cy})`} />
        </g>
        {/* lit route */}
        {drawn > 0.002 ? (
          <g opacity={live}>
            <path d={lit} fill="none" stroke={PAL.info} strokeWidth={sw * 5} strokeLinecap="round" opacity={0.22} filter={`url(#${uid}-gl)`} />
            <path d={lit} fill="none" stroke={PAL.info} strokeWidth={sw * 1.15} strokeLinecap="round" opacity={0.85} />
            <path d={lit} fill="none" stroke={PAL.infoPale} strokeWidth={sw * 0.4} strokeLinecap="round" opacity={0.9} />
          </g>
        ) : null}
        {/* direction chevrons (clockwise) */}
        {chevrons > 0.01 && drawn > 0.2
          ? Array.from({length: 18}, (_, i) => {
              const deg = i * 20 + ((f * 0.9) % 20);
              const rel = (((deg - a0) % 360) + 360) % 360;
              if (drawn < 1 && rel > 360 * drawn) return null;
              const [x, y] = ringPt(g, deg);
              return (
                <path
                  key={i}
                  d={`M ${-sw * 1.4} ${-sw * 1.6} L ${sw * 0.6} 0 L ${-sw * 1.4} ${sw * 1.6}`}
                  transform={`translate(${x} ${y}) rotate(${deg})`}
                  fill="none"
                  stroke={PAL.infoPale}
                  strokeWidth={sw * 0.55}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={chevrons * live}
                />
              );
            })
          : null}
        {/* the lock: notches clamp onto the rail, a shockwave rolls out */}
        {lk >= 0 ? (
          <g>
            {Array.from({length: 24}, (_, i) => {
              const deg = i * 15;
              const k = Math.min(1, lk / 4);
              const [x0, y0] = ringPt({...g, r: g.r * (1.16 - 0.08 * k)}, deg);
              const [x1, y1] = ringPt({...g, r: g.r * (1.08 - 0.03 * k)}, deg);
              return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={PAL.infoPale} strokeWidth={sw * 1.1} strokeLinecap="round" opacity={(lk < 4 ? lk / 4 : 1) * Math.max(0, 1 - (lk - 14) / 20)} />;
            })}
            <circle cx={g.cx} cy={g.cy} r={g.r * (1 + 0.9 * EASE.out(Math.min(1, lk / 22)))} fill="none" stroke={PAL.infoPale} strokeWidth={sw * (2.4 - 2 * Math.min(1, lk / 22))} opacity={Math.max(0, 0.85 * (1 - lk / 22))} />
            <circle cx={g.cx} cy={g.cy} r={g.r * (1 + 0.45 * EASE.out(Math.min(1, lk / 14)))} fill="none" stroke="#FFFFFF" strokeWidth={sw * 1.4} opacity={Math.max(0, 0.7 * (1 - lk / 14))} />
          </g>
        ) : null}
        {/* the first lap leaves sparks along the fresh route */}
        {drawn > 0.02 && drawn < 1
          ? Array.from({length: 16}, (_, i) => {
              const back = (i + 1) * 9;
              const deg = lapAngle(p) - back;
              if (deg < a0) return null;
              const [x, y] = ringPt(g, deg);
              const jx = Math.sin(i * 12.9 + f * 0.7) * sw * 2.2;
              const jy = Math.cos(i * 7.3 + f * 0.9) * sw * 2.2;
              const k = 1 - i / 16;
              return <rect key={i} x={x + jx - sw * 0.6} y={y + jy - sw * 0.6} width={sw * 1.2 * k + 1} height={sw * 1.2 * k + 1} rx={1} fill={PAL.infoPale} opacity={0.85 * k * live} />;
            })
          : null}
        {/* ignite / spin glow */}
        {ignite > 0.01 || spin > 0.01 ? (
          <g>
            <path d={full} fill="none" stroke={PAL.infoPale} strokeWidth={sw * 7} opacity={0.35 * Math.max(ignite, spin * 0.8)} filter={`url(#${uid}-gl)`} />
            <path d={full} fill="none" stroke="#FFFFFF" strokeWidth={sw * 1.4} opacity={0.85 * Math.max(ignite, spin * 0.6)} />
          </g>
        ) : null}
        {/* the Bit's streak along the ring */}
        {showBit && trailDeg > 2 && !hidden
          ? Array.from({length: 14}, (_, i) => {
              const aA = lapAngle(p) - (trailDeg * i) / 14;
              const aB = lapAngle(p) - (trailDeg * (i + 1)) / 14;
              const [x1, y1] = ringPt(g, aA);
              const [x2, y2] = ringPt(g, aB);
              const k = 1 - i / 14;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAL.info} strokeWidth={sw * 2.6 * k + 1} strokeOpacity={0.8 * k * k * live} strokeLinecap="round" />;
            })
          : null}
        {showBit && !hidden ? <BitHead x={head[0]} y={head[1]} size={Math.max(16, g.r * 0.085)} gid={`${uid}-b`} opacity={live} /> : null}
      </svg>
      {/* the pick wheel at 3 o'clock */}
      {pick && pick.opacity > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1920,
            height: 1080,
            opacity: pick.opacity,
            transform: `translate(${pickPt[0]}px, ${pickPt[1]}px) scale(${pick.scale ?? 1}) translate(${-pickPt[0]}px, ${-pickPt[1]}px)`,
          }}
        >
          <Wheel
            frame={f}
            slices={PICK_SLICES}
            cx={pickPt[0]}
            cy={pickPt[1]}
            R={g.r * 0.25}
            r0={g.r * 0.145}
            rot={pick.rot}
            rotPrev={pick.rotPrev}
            chosen={{k: pick.k, lit: pick.lit}}
            labelMin={0}
            special={PICK_END}
          />
        </div>
      ) : null}
      {/* the model at 12 o'clock */}
      {chip && chip.opacity > 0.01 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: chipPt[0] - g.r * 0.75,
              top: chipPt[1] - g.r * 0.55,
              width: g.r * 1.5,
              height: g.r * 1.1,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${rgba(PAL.info, 0.55 * chip.flash)}, ${rgba(PAL.info, 0.12 * chip.flash)} 60%, rgba(0,0,0,0))`,
              opacity: chip.opacity,
            }}
          />
          <Prop
            frame={f}
            src="BIM141_T03_compute-cache_a"
            x={chipPt[0]}
            y={chipPt[1] - g.r * 0.05}
            w={g.r * 1.12}
            opacity={chip.opacity}
            brightness={1 + 0.75 * chip.flash}
            rim={{color: PAL.info, strength: 0.35 + 0.65 * chip.flash}}
            shadow={0.5}
            float={3}
            nudge={{dy: -(chip.drop ?? 0)}}
            sweep={{every: 120, offset: 30, strength: 0.5}}
          />
          {chip.flash > 0.02 ? (
            <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <ellipse cx={chipPt[0]} cy={chipPt[1]} rx={g.r * (0.5 + 0.5 * (1 - chip.flash))} ry={g.r * (0.32 + 0.3 * (1 - chip.flash))} fill="none" stroke={PAL.infoPale} strokeWidth={3} opacity={chip.flash * 0.8} />
            </svg>
          ) : null}
        </>
      ) : null}
    </div>
  );
};

/* ---------------------------------------------------------------- the answer strip */
export type StripTok = {t: string; at?: number};
/**
 * The answer strip: tiles laid out leftwards from endX (the newest sits at endX). A token with `at` snaps in on that
 * frame (from above) and pushes the older tiles left. `read` (0..1) sends a glow wave left → right.
 */
export const Strip: React.FC<{
  frame: number;
  toks: readonly StripTok[];
  endX: number;
  y: number;
  size: number;
  gap?: number;
  read?: number;
  fadeLeft?: number;
  dx?: number;
  dy?: number;
  opacity?: number;
}> = ({frame: f, toks, endX, y, size, gap = 12, read = -1, fadeLeft = 90, dx = 0, dy = 0, opacity = 1}) => {
  const present = toks.filter((t) => t.at === undefined || f >= t.at);
  const n = present.length;
  if (!n || opacity <= 0.002) return null;
  const ws = present.map((t) => tileW(t.t, size));
  // x of each tile: newest at endX; each newer token's snap pushes the older ones left (eased)
  const xs: number[] = new Array(n).fill(endX);
  for (let i = n - 2; i >= 0; i--) {
    const m = i + 1;
    const D = ws[m] / 2 + gap + ws[i] / 2;
    const at = present[m].at;
    const e = at === undefined ? 1 : EASE.out(clamp01((f - at) / 7));
    xs[i] = xs[i + 1] - D * e;
  }
  // the tile that snapped in most recently sits at endX; tiles that have not finished shifting overlap slightly, fine
  const left = xs[0] - ws[0] / 2;
  const waveX = read >= 0 ? lerp(Math.max(left, endX - 1500), endX, read) : -9999;
  return (
    <div style={{position: 'absolute', left: dx, top: dy, width: 0, height: 0, opacity}}>
      {present.map((t, i) => {
        const x = xs[i];
        const fade = clamp01((x - fadeLeft) / 220);
        if (fade <= 0.01) return null;
        const glowW = read >= 0 ? Math.exp(-(((x - waveX) / 90) ** 2)) : 0;
        const isNew = i === n - 1 && t.at !== undefined ? 1 - prog(f, t.at + 10, 10) : 0;
        return (
          <div key={`${t.t}-${i}`} style={{position: 'absolute', left: 0, top: 0, opacity: fade}}>
            <TokenTile frame={f} text={t.t} x={x} y={y} size={size} snapAt={t.at} from={{dy: -70, rot: -4}} newest={Math.max(glowW, isNew)} />
          </div>
        );
      })}
    </div>
  );
};
export const stripTileH = (size: number) => tileH(size);

/** Spring helper for chip flashes: 1 at `at`, decaying. */
export const flashAt = (f: number, at: number, decay = 7) => (f >= at ? Math.exp(-(f - at) / decay) : 0) * (f >= at - 1 ? 1 : 0);
export const popAt = (f: number, at: number) => springAt(f, at, {damping: 12, stiffness: 220, mass: 0.6});
