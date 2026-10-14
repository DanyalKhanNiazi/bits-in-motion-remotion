/**
 * Ep06 kit: <PhotoBits>, the photo's bytes as cyan Bits (the only cyan). Draws in its parent's px (world or hud);
 * when the Archive is in the same Stage world, pass archiveAnchors(...).photo as `to`.
 *   dissolve  the photo (`image`, e.g. fictional-passport_b) breaks into a grid of Bits in a diagonal wave; they lift
 *   sink      the lifted cloud flies into the target boxes (9 photo boxes) and sinks in, each landing with a flash
 *   pour      Bits stream from the source rect's centre in 3 falling streams into the targets (runs) and settle
 * Chain dissolve → sink with the same `from`/`grid`: sink starts exactly where dissolve ends.
 *
 *   <PhotoBits frame={f} at={a} mode="dissolve" from={{x: 760, y: 300, w: 400, h: 500}} image="fictional-passport_b" />
 *   <PhotoBits frame={f} at={a + 24} mode="sink" from={{x: 760, y: 300, w: 400, h: 500}} to={an.photo} />
 */
import React, {useId} from 'react';
import {Img} from 'remotion';
import {EASE, PAL} from './look';
import {assetBox, assetUrl, type AssetName} from './assets';
import {clamp01, lerp, nz, prog, rr, safeId, useImageReady} from './util';

type Rect = {x: number; y: number; w: number; h: number};
type Pt = {x: number; y: number};
export type PhotoBitsProps = {
  frame: number;
  at: number;
  dur?: number;
  mode: 'dissolve' | 'sink' | 'pour';
  /** the photo's rect (top-left x, y and size) in the parent's px */
  from: Rect;
  /** targets (box centres) for sink / pour; default: a point under the rect */
  to?: readonly Pt[];
  /** dissolve: the image that breaks apart (its alpha box is fitted to `from`) */
  image?: AssetName;
  /** grid of Bits (cols × rows), default 12 × 16 */
  grid?: [number, number];
  /** Bit size in px (default: 62 % of a grid cell) */
  size?: number;
  /** keep the Bits visible after landing (sink/pour) — off by default: the Archive's own boxes take over */
  hold?: boolean;
};

const cloudPos = (k: number, cols: number, rows: number, r: Rect, seed: string): Pt => {
  const c = k % cols;
  const rw = Math.floor(k / cols);
  const cw = r.w / cols;
  const ch = r.h / rows;
  return {x: r.x + (c + 0.5) * cw + rr(`${seed}-cx${k}`, -10, 10), y: r.y + (rw + 0.5) * ch - rr(`${seed}-cy${k}`, 30, 70)};
};

export const PhotoBits: React.FC<PhotoBitsProps> = ({frame: f, at, dur, mode, from: r, to, image, grid = [12, 16], size, hold = false}) => {
  const uid = safeId(useId());
  // hold the render until the photo is decoded, so the first dissolve frame never shows a half-drawn image
  useImageReady(image ? assetUrl(image) : null);
  const [cols, rows] = grid;
  const n = cols * rows;
  const cw = r.w / cols;
  const ch = r.h / rows;
  const sz = size ?? Math.min(cw, ch) * 0.56;
  const seed = 'pb';
  const D = dur ?? (mode === 'dissolve' ? 24 : mode === 'sink' ? 30 : 36);
  if (f < at - 1) {
    if (mode === 'dissolve' && image) return <PhotoImage image={image} r={r} clipU={0} uid={uid} />;
    return null;
  }
  const t = f - at;
  const tgts = to && to.length ? to : [{x: r.x + r.w / 2, y: r.y + r.h + 200}];
  const bits: React.ReactNode[] = [];
  if (mode === 'dissolve') {
    // a diagonal wave from top-left: each cell peels off as a Bit and lifts into the cloud position
    const wave = (k: number) => ((k % cols) / cols + Math.floor(k / cols) / rows) / 2;
    const u = clamp01(t / D);
    for (let k = 0; k < n; k++) {
      const s0 = wave(k) * 0.6;
      const v = clamp01((u - s0) / 0.4);
      if (v <= 0) continue;
      const c = k % cols;
      const rw = Math.floor(k / cols);
      const home = {x: r.x + (c + 0.5) * cw, y: r.y + (rw + 0.5) * ch};
      const cl = cloudPos(k, cols, rows, r, seed);
      const e = EASE.out(v);
      const x = lerp(home.x, cl.x, e) + 3 * nz(`${seed}-n${k}`, f / 40);
      const y = lerp(home.y, cl.y, e) + 3 * nz(`${seed}-m${k}`, f / 40);
      const s = lerp(Math.min(cw, ch) * 0.95, sz, e);
      bits.push(<rect key={k} x={x - s / 2} y={y - s / 2} width={s} height={s} rx={s * 0.22} fill={PAL.photo} opacity={lerp(0.5, 1, e)} />);
    }
    const front = u / 0.6; // the wave front for the image wipe (0..~1.7)
    return (
      <>
        {image ? <PhotoImage image={image} r={r} clipU={front} uid={uid} cols={cols} rows={rows} /> : null}
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
          {bits}
        </svg>
      </>
    );
  }
  if (mode === 'sink') {
    for (let k = 0; k < n; k++) {
      const s0 = (k / n) * 0.45;
      const v = clamp01((t / D - s0) / 0.55);
      const cl = cloudPos(k, cols, rows, r, seed);
      const T = tgts[k % tgts.length];
      const tj = {x: T.x + rr(`${seed}-tx${k}`, -14, 14), y: T.y + rr(`${seed}-ty${k}`, -12, 12)};
      if (v >= 1) {
        if (hold) bits.push(<rect key={k} x={tj.x - sz * 0.3} y={tj.y - sz * 0.3} width={sz * 0.6} height={sz * 0.6} rx={2} fill={PAL.photo} />);
        continue;
      }
      const e = EASE.inOut(v);
      const x = lerp(cl.x, tj.x, e) + 3 * nz(`${seed}-n${k}`, f / 40) * (1 - e);
      const y = lerp(cl.y, tj.y, e) - Math.sin(Math.PI * e) * 60;
      const s = lerp(sz, sz * 0.55, e);
      bits.push(<rect key={k} x={x - s / 2} y={y - s / 2} width={s} height={s} rx={s * 0.22} fill={PAL.photo} />);
      if (v > 0.1 && v < 0.98) {
        const pv = Math.max(0, v - 0.08);
        const pe = EASE.inOut(pv);
        bits.push(<line key={`l${k}`} x1={lerp(cl.x, tj.x, pe)} y1={lerp(cl.y, tj.y, pe) - Math.sin(Math.PI * pe) * 60} x2={x} y2={y} stroke={PAL.photo} strokeOpacity={0.35} strokeWidth={s * 0.5} strokeLinecap="round" />);
      }
    }
    // landing flashes on each target
    tgts.forEach((T, i) => {
      const land = at + D * 0.75 + i * 1.5;
      const w2 = clamp01(1 - Math.abs(f - land) / 8);
      if (w2 > 0) bits.push(<circle key={`fl${i}`} cx={T.x} cy={T.y} r={18 + 26 * (1 - w2)} fill="none" stroke={PAL.photoPale} strokeWidth={3} opacity={w2} />);
    });
  } else {
    // pour: three streams from the source into the runs (targets in groups of 3), gravity + settle
    const src = {x: r.x + r.w / 2, y: r.y + r.h / 2};
    const per = Math.max(3, Math.floor(n / Math.max(1, tgts.length)));
    for (let k = 0; k < tgts.length * per; k++) {
      const ti = k % tgts.length;
      const j = Math.floor(k / tgts.length);
      const run = Math.floor(ti / 3);
      const t0 = run * (D / 3) * 0.8 + (j / per) * D * 0.35 + (ti % 3) * 1.5;
      const v = clamp01((t - t0) / 12);
      if (v <= 0 || (v >= 1 && !hold)) continue;
      const T = tgts[ti];
      const x = lerp(src.x + rr(`${seed}-px${k}`, -20, 20), T.x, EASE.out(v));
      const y = lerp(src.y, T.y, v * v);
      bits.push(<rect key={k} x={x - sz / 2} y={y - sz / 2} width={sz} height={sz} rx={sz * 0.22} fill={PAL.photo} opacity={v < 0.9 ? 1 : 1 - (v - 0.9) * 5} />);
    }
  }
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {bits}
    </svg>
  );
};

/** the photo image, wiped away cell by cell along the same diagonal wave */
const PhotoImage: React.FC<{image: AssetName; r: Rect; clipU: number; uid: string; cols?: number; rows?: number}> = ({image, r, clipU, cols = 12, rows = 16}) => {
  const b = assetBox(image);
  const k = Math.min(r.w / b.cw, r.h / b.ch);
  const w = b.w * k;
  const h = b.h * k;
  const ox = r.x + r.w / 2 - b.cx * k;
  const oy = r.y + r.h / 2 - b.cy * k;
  if (clipU <= 0) {
    return <Img src={assetUrl(image)} style={{position: 'absolute', left: ox, top: oy, width: w, height: h, pointerEvents: 'none'}} />;
  }
  // keep only the cells the wave has not reached yet (CSS clip-path in the image's own px; <Img> is awaited by Remotion)
  const cw = r.w / cols;
  const ch = r.h / rows;
  const cells: string[] = [];
  for (let rw = 0; rw < rows; rw++)
    for (let c = 0; c < cols; c++) {
      const wv = ((c / cols + rw / rows) / 2) / 0.6;
      if (wv + 0.05 > clipU) cells.push(`M${(r.x + c * cw - ox).toFixed(1)} ${(r.y + rw * ch - oy).toFixed(1)}h${(cw + 0.5).toFixed(1)}v${(ch + 0.5).toFixed(1)}h${(-cw - 0.5).toFixed(1)}Z`);
    }
  if (!cells.length) return null;
  return <Img src={assetUrl(image)} style={{position: 'absolute', left: ox, top: oy, width: w, height: h, pointerEvents: 'none', clipPath: `path('${cells.join('')}')`}} />;
};

/** progress helper for callers syncing to PhotoBits (0..1 over [at, at + dur]) */
export const photoBitsProgress = (f: number, at: number, dur: number): number => prog(f, at, dur);
