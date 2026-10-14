/**
 * S3 · the candidate field: the whole vocabulary as 400 × 500 = 200,000 white token tiles standing on a plane, each
 * with a score bar, receding to a horizon. Drawn on a canvas through the kit's 3D projector (perspective camera), back
 * to front. Near tiles carry their word; far ones melt into a haze. Row 0 (the front row) holds the 6 hero candidates
 * (DOM tiles, laid out by their measured widths) in its middle.
 */
import React, {useLayoutEffect, useRef} from 'react';
import {SANS, basis, clamp01, lerp, tileW, type Cam3} from '../../kit';

export const COLS = 400;
export const ROWS = 500;
export const N_CELLS = COLS * ROWS; // 200,000
export const PITCH_X = 3.2;
export const PITCH_Z = 3.0;
const MID = (COLS - 1) / 2;
export const TILE_W = 2.8;
export const TILE_H = 1.0;
export const BAR_Y0 = 1.12;
export const BAR_MAX = 4.0;
export const FIELD_DEPTH = (ROWS - 1) * PITCH_Z;

/** The 6 hero candidates (left to right) with illustrative odds; the rest of the vocabulary shares 0.10. */
export const HERO = [
  {w: 'The', p: 0.07},
  {w: 'It', p: 0.18},
  {w: 'Because', p: 0.34},
  {w: 'AI', p: 0.13},
  {w: 'Each', p: 0.1},
  {w: 'They', p: 0.08},
] as const;
export const NH = HERO.length;
export const P_MAX = 0.34;
export const heroBarH = (k: number) => (BAR_MAX * HERO[k].p) / P_MAX;
/** px per unit at the opening close-up (hero tiles at 64 px type) */
export const S_REF = 96;
/** hero centres (units), from the tiles' measured widths at 64 px */
export const heroLayout = (): {x: number[]; half: number} => {
  const ws = HERO.map((h) => tileW(h.w, 64) / S_REF);
  const gap = 30 / S_REF;
  const total = ws.reduce((a, b) => a + b, 0) + gap * (NH - 1);
  const x: number[] = [];
  let c = -total / 2;
  for (const w of ws) {
    x.push(c + w / 2);
    c += w + gap;
  }
  return {x, half: total / 2};
};

/* ---------------------------------------------------------------- deterministic per-cell data */
const hash = (a: number, b: number, c: number): number => {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 1274126177)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const WORDS = (
  'the of and to in is it that for on with as was at by be this have from or one had not but what all were when we there can an ' +
  'your which their said if do will each about how up out them then she many some so these would other into has more her two ' +
  'like him see time could no make than first been its who now people my made over did down only way find use may water long ' +
  'little very after words called just where most know get through back much before go good new write our used me man too any ' +
  'day same right look think also around another came come work three word must because does part even place well such here take ' +
  'why things help put years different away again off went old number great tell men say small every found still between name ' +
  'should home big give air line set own under read last never us left end along while might next sound below saw something ' +
  'ing ed ly er tion photo syn thesis token piece answer model ness ment able un re pre ous ive'
).split(' ');
type Cells = {score: Float32Array; phase: Float32Array; bright: Float32Array; word: Uint16Array};
let CELLS: Cells | null = null;
const cells = (): Cells => {
  if (!CELLS) {
    const score = new Float32Array(N_CELLS);
    const phase = new Float32Array(N_CELLS);
    const bright = new Float32Array(N_CELLS);
    const word = new Uint16Array(N_CELLS);
    for (let j = 0; j < ROWS; j++)
      for (let i = 0; i < COLS; i++) {
        const k = j * COLS + i;
        const rare = hash(i, j, 11) < 0.006;
        score[k] = rare ? -(0.25 + 0.3 * hash(i, j, 13)) : 0.04 + 0.22 * Math.pow(hash(i, j, 7), 5); // negative = a sparkle
        phase[k] = hash(i, j, 17) * 6.283;
        bright[k] = 0.72 + 0.28 * hash(i, j, 19);
        word[k] = Math.floor(hash(i, j, 23) * WORDS.length);
      }
    CELLS = {score, phase, bright, word};
  }
  return CELLS;
};

/* ---------------------------------------------------------------- projection */
export type Proj = {x: number; y: number; s: number; z: number} | null;
/** Project a world point with a Cam3 (screen px, px per unit, depth). */
export const projectPt = (cam: Cam3, x: number, y: number, z: number): Proj => {
  const b = basis(cam);
  const dx = x - b.pos[0];
  const dy = y - b.pos[1];
  const dz = z - b.pos[2];
  const cx = dx * b.r[0] + dy * b.r[1] + dz * b.r[2];
  const cy = dx * b.u[0] + dy * b.u[1] + dz * b.u[2];
  const cz = dx * b.f[0] + dy * b.f[1] + dz * b.f[2];
  if (cz < 0.35) return null;
  return {x: b.cx + (b.focal * cx) / cz, y: b.cy - (b.focal * cy) / cz, s: b.focal / cz, z: cz};
};

/* ---------------------------------------------------------------- canvas */
export type FieldOpts = {
  frame: number;
  cam: Cam3;
  /** reveal radius in units (cells beyond it are not there yet) */
  R: number;
  /** overall opacity of the generic cells */
  alpha: number;
  /** draw the heroes in the canvas too (when they are too small for DOM tiles) */
  heroes: number;
  /** radial zoom streak strength 0..1 */
  streak: number;
  /** a scoring sweep: a band of light at depth z (units into the field) lifting the bars, strength 0..1 */
  scan?: {z: number; s: number};
};

const PAD = 60;
const CW = 1920 + PAD * 2;
const CH = 1080 + PAD * 2;
const NB = 4; // brightness buckets

const draw = (cv: HTMLCanvasElement, o: FieldOpts) => {
  const ctx = cv.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, CW, CH);
  if (o.alpha <= 0.002 && o.heroes <= 0.002) return;
  const C = cells();
  const b = basis(o.cam);
  const {pos, r, u, f: fw, focal} = b;
  const ocx = b.cx + PAD;
  const ocy = b.cy + PAD;
  const R = o.R;
  const fr = o.frame;
  const HL = heroLayout();
  const skip = HL.half + 1.9;
  const scanZ = o.scan ? o.scan.z : -1e9;
  const scanS = o.scan ? o.scan.s : 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let j = ROWS - 1; j >= 0; j--) {
    const z = -j * PITCH_Z;
    if (-z > R + 2) continue;
    const dz = z - pos[2];
    const dy0 = -pos[1];
    const cxRow = dy0 * r[1] + dz * r[2];
    const cyRow = dy0 * u[1] + dz * u[2];
    const czRow = dy0 * fw[1] + dz * fw[2];
    if (czRow + 700 * Math.abs(fw[0]) < 0.6) continue;
    const half = Math.sqrt(Math.max(0, (R + 2) * (R + 2) - z * z)) / PITCH_X;
    const i0 = Math.max(0, Math.ceil(MID - half));
    const i1 = Math.min(COLS - 1, Math.floor(MID + half));
    if (i1 < i0) continue;
    // haze: far rows sink into the horizon, crowded rows thin out
    const czC = czRow - pos[0] * fw[0];
    const sC = focal / Math.max(0.6, czC);
    const rowGap = PITCH_Z * Math.abs(u[2]) * sC;
    const dens = clamp01((rowGap - 0.5) / 3.5);
    const fog = 1 - 0.92 * Math.pow(clamp01(-z / FIELD_DEPTH), 0.55);
    const aRow = o.alpha * fog * (0.2 + 0.8 * dens);
    if (aRow <= 0.004) continue;
    const sd = (-z - scanZ) / 14;
    const sweep = scanS * Math.exp(-sd * sd);
    const tiles: Path2D[] = [];
    for (let q = 0; q < NB; q++) tiles[q] = new Path2D();
    const lips = new Path2D();
    const bars = new Path2D();
    const sparks = new Path2D();
    const band = new Path2D();
    const front = new Path2D();
    const texts: number[] = [];
    let anyLip = false;
    let anyBar = false;
    let anySpark = false;
    let anyBand = false;
    let anyFront = false;
    for (let i = i0; i <= i1; i++) {
      const x = (i - MID) * PITCH_X;
      if (j === 0 && Math.abs(x) < skip) continue;
      const d = Math.sqrt(x * x + z * z);
      const pop = clamp01((R - d) / 3);
      if (pop <= 0) continue;
      const dx = x - pos[0];
      const cz = czRow + dx * fw[0];
      if (cz < 0.6) continue;
      const cx = cxRow + dx * r[0];
      const sx = ocx + (focal * cx) / cz;
      const s = focal / cz;
      if (sx < -TILE_W * s || sx > CW + TILE_W * s) continue;
      const cy = cyRow + dx * u[0];
      const sy = ocy - (focal * cy) / cz;
      if (sy < -80 || sy > CH + 400) continue;
      const k = j * COLS + i;
      // the upright tile
      let w = Math.max(0.9, TILE_W * s * pop);
      let h = Math.max(0.9, TILE_H * s * pop * Math.abs(u[1]) + 0.0001);
      let x0 = sx - w / 2;
      let y0 = sy - h;
      if (w < 14) {
        x0 = Math.round(x0);
        y0 = Math.round(y0);
        w = Math.max(1, Math.round(w));
        h = Math.max(1, Math.round(h));
      }
      const lit = 0.55 + 0.45 / (1 + (d / 90) * (d / 90)) + 0.4 * sweep;
      const q = Math.min(NB - 1, Math.floor(Math.min(0.999, C.bright[k] * lit) * NB));
      tiles[q].rect(x0, y0, w, h);
      if (h > 7) {
        lips.rect(x0, y0 + h * 0.86, w, h * 0.14);
        anyLip = true;
      }
      if (h > 15 && pop > 0.95) texts.push(sx, y0 + h * 0.46, h, C.word[k]);
      if (sweep > 0.25) {
        band.rect(x0, y0, w, h);
        anyBand = true;
      }
      if (R - d < 6 && R < FIELD_DEPTH) {
        front.rect(x0 - 1.5, y0 - 1.5, w + 3, h + 3);
        anyFront = true;
      }
      // score bar or sparkle
      const grow = clamp01((R - d - 2) / 8);
      if (grow > 0) {
        const sc = C.score[k];
        const bh = Math.abs(sc) * grow * (0.82 + 0.18 * Math.sin(C.phase[k] + fr * 0.13)) * (1 + 2.5 * sweep);
        const yb0 = BAR_Y0;
        const yb1 = BAR_Y0 + bh;
        const sy0 = ocy - (focal * (cy + yb0 * u[1])) / (cz + yb0 * fw[1]);
        const sy1 = ocy - (focal * (cy + yb1 * u[1])) / (cz + yb1 * fw[1]);
        const hh = sy0 - sy1;
        const bw = Math.max(1, 0.26 * s);
        if (hh >= 0.6) {
          bars.rect(w < 14 ? Math.round(sx - bw / 2) : sx - bw / 2, sy1, bw, hh);
          anyBar = true;
        }
        if (sc < 0) {
          const tw = 0.6 + 0.4 * Math.sin(C.phase[k] * 3 + fr * 0.21);
          const ds = Math.max(2.4, 0.5 * s) * tw;
          sparks.rect(sx - ds / 2, sy1 - ds / 2, ds, ds);
          anySpark = true;
        }
      }
    }
    for (let q = 0; q < NB; q++) {
      const v = (q + 0.5) / NB;
      ctx.fillStyle = `rgba(${Math.round(lerp(150, 246, v))},${Math.round(lerp(160, 248, v))},${Math.round(lerp(182, 251, v))},${(aRow * lerp(0.62, 0.96, v)).toFixed(3)})`;
      ctx.fill(tiles[q]);
    }
    if (anyLip) {
      ctx.fillStyle = `rgba(126,135,152,${(0.9 * aRow).toFixed(3)})`;
      ctx.fill(lips);
    }
    if (anyBand) {
      ctx.fillStyle = `rgba(0,229,255,${(0.38 * sweep * aRow).toFixed(3)})`;
      ctx.fill(band);
    }
    if (anyFront) {
      ctx.fillStyle = `rgba(159,244,255,${(0.65 * aRow).toFixed(3)})`;
      ctx.fill(front);
    }
    if (texts.length) {
      for (let t = 0; t < texts.length; t += 4) {
        const fsz = Math.round(texts[t + 2] * 0.5);
        ctx.font = `600 ${fsz}px ${SANS}`;
        ctx.fillStyle = `rgba(20,32,58,${Math.min(1, aRow * clamp01((texts[t + 2] - 15) / 10)).toFixed(3)})`;
        ctx.fillText(WORDS[texts[t + 3]], texts[t], texts[t + 1]);
      }
    }
    if (anyBar) {
      ctx.fillStyle = `rgba(0,229,255,${Math.min(1, (0.85 + 0.15 * sweep) * aRow).toFixed(3)})`;
      ctx.fill(bars);
    }
    if (anySpark) {
      ctx.fillStyle = `rgba(190,250,255,${Math.min(1, aRow * 1.2 + 0.2 * o.alpha).toFixed(3)})`;
      ctx.fill(sparks);
    }
  }
  // a cool haze on the horizon, once the far edge is in view
  if (R > FIELD_DEPTH * 0.5 && o.alpha > 0.01) {
    const zf = -FIELD_DEPTH;
    const dzf = zf - pos[2];
    const cyF = -pos[1] * u[1] + dzf * u[2] - pos[0] * u[0];
    const czF = -pos[1] * fw[1] + dzf * fw[2] - pos[0] * fw[0];
    if (czF > 1) {
      const hy = ocy - (focal * cyF) / czF;
      const hx = ocx + (focal * (-pos[0] * r[0] + dzf * r[2])) / czF;
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 1100);
      g.addColorStop(0, `rgba(0,170,230,${(0.22 * o.alpha).toFixed(3)})`);
      g.addColorStop(0.5, `rgba(20,90,170,${(0.08 * o.alpha).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(hx, hy);
      ctx.scale(1, 0.14);
      ctx.translate(-hx, -hy);
      ctx.fillStyle = g;
      ctx.fillRect(hx - 1100, hy - 1100, 2200, 2200);
      ctx.restore();
    }
  }
  // heroes drawn small (far views)
  if (o.heroes > 0.002) {
    const czRow = -pos[1] * fw[1] - pos[2] * fw[2];
    const cyRow = -pos[1] * u[1] - pos[2] * u[2];
    const cxRow = -pos[1] * r[1] - pos[2] * r[2];
    for (let k = 0; k < NH; k++) {
      const x = HL.x[k];
      const dx = x - pos[0];
      const cz = czRow + dx * fw[0];
      if (cz < 0.6) continue;
      const cx = cxRow + dx * r[0];
      const cy = cyRow + dx * u[0];
      const sx = ocx + (focal * cx) / cz;
      const sy = ocy - (focal * cy) / cz;
      const s = focal / cz;
      const y1 = BAR_Y0 + heroBarH(k);
      const sy1 = ocy - (focal * (cy + y1 * u[1])) / (cz + y1 * fw[1]);
      const w = Math.max(1.6, 0.34 * s);
      const tw = Math.max(1.6, (tileW(HERO[k].w, 64) / S_REF) * s);
      const th = Math.max(1.4, TILE_H * s);
      const g = ctx.createRadialGradient(sx, sy1, 0, sx, sy1, 18 + 80 * HERO[k].p);
      g.addColorStop(0, `rgba(0,229,255,${(0.7 * o.heroes * Math.sqrt(HERO[k].p / P_MAX)).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,229,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(sx - 70, sy1 - 70, 140, 140);
      ctx.fillStyle = `rgba(246,247,249,${o.heroes.toFixed(3)})`;
      ctx.fillRect(sx - tw / 2, sy - th, tw, th);
      ctx.fillStyle = `rgba(159,244,255,${o.heroes.toFixed(3)})`;
      ctx.fillRect(sx - w / 2, sy1, w, Math.max(1, sy - th - sy1));
    }
  }
  // radial zoom streak (cheap motion blur for the big moves)
  if (o.streak > 0.02) {
    const passes = 3;
    for (let p = 1; p <= passes; p++) {
      const k = 1 + 0.03 * o.streak * p;
      ctx.globalAlpha = 0.3 * o.streak * (1 - p / (passes + 1));
      ctx.drawImage(cv, ocx - ocx * k, ocy - ocy * k, CW * k, CH * k);
    }
    ctx.globalAlpha = 1;
  }
};

export const FieldCanvas: React.FC<FieldOpts> = (o) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = `${o.frame}|${o.cam.tx}|${o.cam.ty}|${o.cam.tz}|${o.cam.yaw}|${o.cam.pitch}|${o.cam.dist}|${o.R}|${o.alpha}|${o.heroes}|${o.streak}|${o.scan?.z}|${o.scan?.s}`;
  useLayoutEffect(() => {
    if (ref.current) draw(ref.current, o);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return <canvas ref={ref} width={CW} height={CH} style={{position: 'absolute', left: -PAD, top: -PAD, width: CW, height: CH}} />;
};

/* ---------------------------------------------------------------- camera path */
const D2R = Math.PI / 180;
/** camera from: elevation e (deg) and distance D seen from the hero row, the hero row's screen y, the fov */
const camOf = (e: number, D: number, yh: number, fov: number, yaw = 0): Cam3 => {
  const focal = 540 / Math.tan((fov / 2) * D2R);
  const pitch = e - Math.atan((yh - 540) / focal) / D2R;
  const py = D * Math.sin(e * D2R);
  const pz = D * Math.cos(e * D2R);
  return {tx: 0, ty: py - D * Math.sin(pitch * D2R), tz: pz - D * Math.cos(pitch * D2R), yaw, pitch, dist: D, fov};
};
const E0 = 7;
const D0 = 21;
const Y0 = 860;
const F0 = 30;
const E1 = 26;
const D1 = 31;
const Y1 = 965;
const F1 = 40;
export const CAM_HERO: Cam3 = camOf(E0, D0, Y0, F0);
/**
 * u = 0 (the 6 candidates at 64 px) … 1 (the field to the horizon). The camera cranes up and back while the hero
 * row slides to the bottom of the frame and the horizon comes into view.
 */
export const camAtU = (u: number, yaw = 0, distK = 1): Cam3 => {
  const v = clamp01(u);
  return camOf(lerp(E0, E1, Math.pow(v, 0.85)), Math.exp(lerp(Math.log(D0), Math.log(D1), v)) * distK, lerp(Y0, Y1, v), lerp(F0, F1, v), yaw);
};
