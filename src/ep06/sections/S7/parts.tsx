/**
 * S7 section-local parts (composed from the kit; no wall, card, Bit, split screen or Windows UI of our own):
 *   Roll          the 180° "twist" camera roll between two scenes (out 0→90°, in −90°→0°)
 *   GhostShred    a ghost of the passport photo card fed through the drive's amber blade into strips
 *   ShredBadge    the section-local shredder badge with a magenta "?"
 *   Stream        a white write stream along a polyline (draws on, flows, fades)
 *   SlotSwap      overwrite-slot_a with its replacement insert sliding into the bay (two clipped layers of one render)
 *   LabLens       recovery-scanner_c cropped to its arm and lens, with a magnified view of the Archive in the glass
 */
import React, {useContext} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {
  CameraContext,
  EASE,
  PAL,
  Prop,
  SANS,
  SPRING,
  assetBox,
  assetUrl,
  checkText,
  clamp01,
  lerp,
  prog,
  propPoint,
  rgba,
  rnd,
  springAt,
  win,
  type AssetName,
} from '../../kit';
import {REGRADE, Regrade} from '../../kit/ui';

export type Pt = {x: number; y: number};
export type Render = (f: number) => React.ReactNode;

/* ---------------------------------------------------------------- geometry helpers */
export const quad = (a: Pt, c: Pt, b: Pt, n = 16): Pt[] =>
  Array.from({length: n + 1}, (_, i) => {
    const t = i / n;
    return {x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y};
  });
const cum = (pts: Pt[]): number[] => {
  const out = [0];
  for (let i = 1; i < pts.length; i++) out.push(out[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return out;
};
/** the sub-polyline between arc lengths a and b */
export const subPath = (pts: Pt[], a: number, b: number): Pt[] => {
  const L = cum(pts);
  const at = (s: number): Pt => {
    for (let i = 1; i < pts.length; i++)
      if (s <= L[i]) {
        const u = (s - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
        return {x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u)};
      }
    return pts[pts.length - 1];
  };
  const lo = Math.max(0, a);
  const hi = Math.min(L[L.length - 1], b);
  if (hi <= lo) return [];
  const out = [at(lo)];
  for (let i = 1; i < pts.length - 1; i++) if (L[i] > lo && L[i] < hi) out.push(pts[i]);
  out.push(at(hi));
  return out;
};
export const pathLen = (pts: Pt[]): number => cum(pts)[pts.length - 1];
const dOf = (pts: Pt[]): string => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');

/* ---------------------------------------------------------------- Roll: the twist */
export const Roll: React.FC<{frame: number; at: number; dur: number; a: Render; b: Render}> = ({frame: f, at, dur, a, b}) => {
  const t = (f - at) / dur;
  if (t < 0) return <>{a(f)}</>;
  if (t >= 1) return <>{b(f)}</>;
  const e = EASE.inOut(t);
  const vel = 180 * (EASE.inOut(clamp01(t + 1 / dur)) - e);
  const ang = 180 * e;
  const first = ang < 90;
  const rot = first ? ang : ang - 180;
  const s = 1 - 0.22 * Math.sin(Math.PI * t);
  const blur = Math.min(12, vel * 0.6);
  const flash = Math.exp(-(((t - 0.5) / 0.09) ** 2));
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: PAL.void}}>
      <AbsoluteFill style={{transform: `rotate(${rot.toFixed(2)}deg) scale(${s.toFixed(4)})`, filter: blur > 0.4 ? `blur(${blur.toFixed(1)}px)` : undefined}}>{first ? a(f) : b(f)}</AbsoluteFill>
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, ${rgba('#FFFFFF', 0.5 * flash)}, ${rgba(PAL.structure, 0.18 * flash)} 45%, rgba(0,0,0,0) 75%)`, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- GhostShred (world px of its parent) */
const PASS: AssetName = 'fictional-passport_b';
export const GhostShred: React.FC<{frame: number; appear: number; feed: number; feedDur: number; fly: number; cx: number; bladeY: number; w: number; targets: Pt[]}> = ({
  frame: f,
  appear,
  feed,
  feedDur,
  fly,
  cx,
  bladeY,
  w,
  targets,
}) => {
  const b = assetBox(PASS);
  const k = w / b.cw;
  const H = b.ch * k;
  const N = targets.length;
  const sw = w / N;
  const op = 0.62 * prog(f, appear, 16, EASE.out);
  if (op <= 0) return null;
  const d = H * prog(f, feed, feedDur, EASE.inOut);
  const hover = (1 - prog(f, feed - 6, 8)) * 5 * Math.sin((f - appear) / 11);
  const top = bladeY - H + d + hover;
  const left = cx - w / 2;
  const url = assetUrl(PASS);
  const look = 'grayscale(1) brightness(1.3) contrast(0.82)';
  const img = (dx: number, dy: number) => (
    <Img src={url} style={{position: 'absolute', left: -b.x0 * k - dx, top: -b.y0 * k - dy, width: b.w * k, height: b.h * k, filter: look, maxWidth: 'none'}} />
  );
  const gap = 8 * prog(f, feed + 2, 12, EASE.out);
  const strips: React.ReactNode[] = [];
  const embers: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const sh = Math.max(0, top + H - Math.max(bladeY, top));
    if (sh <= 0.5) continue;
    const off = (i - (N - 1) / 2) * gap;
    const curl = (i - (N - 1) / 2) * 1.4 * prog(f, feed + 4, 14, EASE.out);
    const sx = left + i * sw + off;
    const sy = Math.max(bladeY, top);
    const t0 = fly + Math.round(Math.abs(i - (N - 1) / 2) * 1.5) + i;
    const u = prog(f, t0, 17, EASE.inCubic);
    const tgt = targets[i];
    const c0 = {x: sx + sw / 2, y: sy + sh / 2};
    const px = lerp(c0.x, tgt.x, u);
    const py = lerp(c0.y, tgt.y, u) - Math.sin(Math.PI * u) * 70;
    const sc = lerp(1, 0.12, u);
    const fade = 1 - clamp01((u - 0.78) / 0.22);
    if (fade > 0)
      strips.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: px - sw / 2,
            top: py - sh / 2,
            width: sw,
            height: sh,
            overflow: 'hidden',
            transformOrigin: '50% 0%',
            transform: `rotate(${(curl + u * (rnd(`s7-strip-${i}`) - 0.5) * 50).toFixed(2)}deg) scale(${sc.toFixed(3)})`,
            opacity: fade,
          }}
        >
          {img(i * sw, sy - top)}
        </div>,
      );
    const land = t0 + 17;
    if (f >= land && f < land + 18) {
      const e = Math.exp(-(f - land) / 5);
      embers.push(<circle key={i} cx={tgt.x} cy={tgt.y} r={14 + 26 * (1 - e)} fill={PAL.drive} opacity={0.55 * e} />);
    }
  }
  const above = Math.max(0, bladeY - top);
  const blade = win(f, feed - 8, feed + feedDur + 10, 6, 8);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', inset: 0, opacity: op}}>
        {above > 0.5 ? (
          <div style={{position: 'absolute', left, top, width: w, height: Math.min(H, above), overflow: 'hidden'}}>{img(0, 0)}</div>
        ) : null}
        {strips}
      </div>
      {blade > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: left - 46,
            top: bladeY - 4,
            width: w + 92,
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${rgba(PAL.drive, 0)}, ${PAL.driveHot} 12%, #FFF4DA 50%, ${PAL.driveHot} 88%, ${rgba(PAL.drive, 0)})`,
            boxShadow: `0 0 22px 6px ${rgba(PAL.drive, 0.55)}`,
            opacity: blade,
          }}
        />
      ) : null}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {embers}
      </svg>
    </div>
  );
};

/* ---------------------------------------------------------------- ShredBadge (screen px) */
export const ShredBadge: React.FC<{frame: number; x: number; y: number; at: number; qAt: number}> = ({frame: f, x, y, at, qAt}) => {
  const s = springAt(f, at, SPRING.pop);
  if (s <= 0.001) return null;
  const q = springAt(f, qAt, SPRING.pop);
  checkText('label', 40, false, {zoom: 1, rot: 0, space: 'screen'}, '?');
  const wob = (i: number) => 2.2 * Math.sin(f / 5 + i * 1.3);
  const feedY = 6 * ((f % 30) / 30);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
      <div style={{position: 'absolute', left: -80, top: -80, width: 160, height: 160, transform: `scale(${s})`}}>
        <svg width={160} height={160} viewBox="-80 -80 160 160" style={{overflow: 'visible'}}>
          <circle r={58} fill={rgba('#0A1020', 0.9)} stroke={rgba(PAL.drive, 0.75)} strokeWidth={3} />
          <circle r={50} fill="none" stroke={rgba(PAL.drive, 0.2)} strokeWidth={6} />
          <rect x={-30} y={-32} width={60} height={22} rx={6} fill={rgba(PAL.drive, 0.18)} stroke={PAL.drive} strokeWidth={3} />
          <rect x={-22} y={-50 + feedY} width={44} height={20} rx={2} fill={rgba(PAL.ink, 0.85)} />
          <rect x={-30} y={-32} width={60} height={10} fill={rgba('#0A1020', 1)} />
          <rect x={-30} y={-32} width={60} height={22} rx={6} fill="none" stroke={PAL.drive} strokeWidth={3} />
          <line x1={-24} y1={-13} x2={24} y2={-13} stroke={PAL.driveHot} strokeWidth={3} strokeLinecap="round" />
          {[-16, -8, 0, 8, 16].map((sx, i) => (
            <path key={i} d={`M${sx} -6 Q${sx + wob(i)} 8 ${sx - wob(i) * 0.6} ${22 + (i % 2) * 6}`} fill="none" stroke={PAL.ink} strokeOpacity={0.85} strokeWidth={4} strokeLinecap="round" />
          ))}
        </svg>
        {q > 0.001 ? (
          <div
            style={{
              position: 'absolute',
              left: 120 - 28,
              top: 34 - 28,
              width: 56,
              height: 56,
              borderRadius: 28,
              background: PAL.emphasis,
              boxShadow: `0 6px 18px ${rgba('#000000', 0.5)}, 0 0 18px ${rgba(PAL.emphasis, 0.5)}`,
              transform: `scale(${q}) rotate(${(1 - Math.min(1, q)) * -40}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 40,
              lineHeight: 1,
              color: '#FFFFFF',
            }}
          >
            ?
          </div>
        ) : null}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Stream: a white write stream (world px of its parent) */
export const Stream: React.FC<{
  pts: Pt[];
  frame: number;
  t0: number;
  dur: number;
  /** comet mode: only the last `tail` px behind the head show */
  tail?: number;
  fadeAt?: number;
  width?: number;
  color?: string;
  dashed?: boolean;
  head?: boolean;
  opacity?: number;
  ease?: (t: number) => number;
}> = ({pts, frame: f, t0, dur, tail, fadeAt, width = 4, color = '#FFFFFF', dashed, head = true, opacity = 1, ease = EASE.inOut}) => {
  if (f < t0 || pts.length < 2) return null;
  const L = pathLen(pts);
  const p = prog(f, t0, dur, ease);
  const s = L * p;
  const vis = subPath(pts, tail !== undefined ? s - tail : 0, s);
  const fade = fadeAt !== undefined ? 1 - prog(f, fadeAt, 10) : 1;
  const op = fade * opacity * (tail !== undefined ? 1 - clamp01((p - 0.92) / 0.08) : 1);
  if (op <= 0.01 || vis.length < 2) return null;
  const d = dOf(vis);
  const h = vis[vis.length - 1];
  return (
    <g opacity={op} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={color} strokeOpacity={0.16} strokeWidth={width * 5} />
      <path d={d} stroke={color} strokeOpacity={dashed ? 0.35 : 0.85} strokeWidth={width} />
      <path d={d} stroke="#FFFFFF" strokeWidth={width * 1.25} strokeDasharray="8 22" strokeDashoffset={-(f - t0) * 7} />
      {head && p < 1 ? (
        <>
          <circle cx={h.x} cy={h.y} r={width * 4} fill={color} opacity={0.22} />
          <circle cx={h.x} cy={h.y} r={width * 1.6} fill="#FFFFFF" />
        </>
      ) : null}
    </g>
  );
};

/* ---------------------------------------------------------------- SlotSwap: overwrite-slot_a, the insert replaced in place */
const SLOT: AssetName = 'overwrite-slot_a';
type NP = readonly [number, number];
/** native px: the line between the bay (above) and the loose replacement insert (below) */
const SPLIT_LINE: [NP, NP] = [
  [0, 930],
  [1254, 554],
];
/** the mouth of the bay (TL, TR, BR, BL) and the direction out of it (toward the viewer) */
const MOUTH: NP[] = [
  [317, 597],
  [944, 437],
  [949, 600],
  [320, 771],
];
const OUT = {x: 0.86, y: 0.51};
/** matching corners: the loose insert's front-left-bottom corner → the old insert's, and their widths' ratio */
const N0 = {x: 607, y: 1020};
const O0 = {x: 400, y: 747};
const FIT = 0.857;
export const slotPoint = (p: {x: number; y: number; w: number}, nx: number, ny: number) => propPoint(SLOT, p, nx, ny);
export const SlotSwap: React.FC<{frame: number; x: number; y: number; w: number; liftAt: number; slamAt: number; enterAt: number}> = ({frame: f, x, y, w, liftAt, slamAt, enterAt}) => {
  const P = {x, y, w};
  const wp = (nx: number, ny: number) => propPoint(SLOT, P, nx, ny);
  const poly = (pts: Pt[]) => `polygon(${pts.map((q) => `${q.x.toFixed(1)}px ${q.y.toFixed(1)}px`).join(', ')})`;
  const BIG = 6000;
  const l0 = wp(...SPLIT_LINE[0]);
  const l1 = wp(...SPLIT_LINE[1]);
  const dx = l1.x - l0.x;
  const dy = l1.y - l0.y;
  const ext = (q: Pt, t: number) => ({x: q.x + dx * t, y: q.y + dy * t});
  const a0 = ext(l0, -3);
  const a1 = ext(l1, 3);
  const baseClip = poly([a0, a1, {x: a1.x, y: a1.y - BIG}, {x: a0.x, y: a0.y - BIG}]);
  const insClip = poly([a0, a1, {x: a1.x, y: a1.y + BIG}, {x: a0.x, y: a0.y + BIG}]);
  const m = MOUTH.map((q) => wp(q[0], q[1]));
  const k = w / assetBox(SLOT).cw;
  const V = {x: OUT.x * 2200 * k, y: OUT.y * 2200 * k};
  const hullClip = poly([m[0], m[1], {x: m[1].x + V.x, y: m[1].y + V.y}, {x: m[2].x + V.x, y: m[2].y + V.y}, {x: m[3].x + V.x, y: m[3].y + V.y}, m[3]]);
  const wn = wp(N0.x, N0.y);
  const wo = wp(O0.x, O0.y);
  const pre = {x: wo.x + OUT.x * 320 * k, y: wo.y + OUT.y * 320 * k};
  // phase 1: lift and align (anchor N0 → pre-entry, scale 1 → FIT); phase 2: slide into the bay (pre → O0)
  const u1 = prog(f, liftAt, slamAt - 12 - liftAt, EASE.inOut);
  const u2 = prog(f, slamAt - 10, 10, EASE.inCubic);
  const anc = u2 > 0 ? {x: lerp(pre.x, wo.x, u2), y: lerp(pre.y, wo.y, u2)} : {x: lerp(wn.x, pre.x, u1), y: lerp(wn.y, pre.y, u1) - Math.sin(Math.PI * u1) * 70 * k};
  const sc = lerp(1, FIT, u1);
  const tilt = Math.sin(Math.PI * u1) * -4;
  const insOp = 1 - prog(f, slamAt + 1, 4);
  const entering = u2 > 0;
  const enter = prog(f, enterAt, 18, EASE.out);
  const rise = (1 - enter) * 60;
  const settle = f >= slamAt ? Math.exp(-(f - slamAt) / 4) * Math.sin((f - slamAt) * 1.7) * 5 * k : 0;
  const common = {frame: f, src: SLOT, x, y: y + rise + settle, w, shadow: false as const, rim: {color: PAL.structure, strength: 0.55}, sweep: {at: [enterAt + 6, slamAt - 2], dur: 26}};
  const flash = f >= slamAt - 1 ? Math.exp(-(f - slamAt + 1) / 4) : 0;
  const mc = {x: (m[0].x + m[1].x + m[2].x + m[3].x) / 4, y: (m[0].y + m[1].y + m[2].y + m[3].y) / 4 + rise};
  const dust: React.ReactNode[] = [];
  if (f >= slamAt && f < slamAt + 26) {
    const t = f - slamAt;
    for (let i = 0; i < 14; i++) {
      const r0 = rnd(`s7-dust-${i}`);
      const r1 = rnd(`s7-dust-b-${i}`);
      const base = {x: lerp(m[3].x, m[2].x, r0), y: lerp(m[3].y, m[2].y, r0) + rise};
      const vx = (OUT.x * 3 + (r1 - 0.5) * 4) * k * 2.2;
      const vy = (OUT.y * 3 - 1.5 - r0 * 2) * k * 2.2;
      dust.push(<circle key={i} cx={base.x + vx * t} cy={base.y + vy * t + 0.09 * t * t} r={(2 + r1 * 3) * (1 + t / 14)} fill="#C9D2E0" opacity={0.5 * Math.exp(-t / 9)} />);
    }
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: clamp01(enter * 1.6)}}>
      <div style={{position: 'absolute', left: x - w * 0.55, top: y + w * 0.25 + rise, width: w * 1.1, height: w * 0.16, borderRadius: '50%', background: `radial-gradient(ellipse at 50% 50%, ${rgba('#000000', 0.55)}, rgba(0,0,0,0) 70%)`}} />
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: baseClip}}>
        <Prop {...common} />
      </div>
      {insOp > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: entering ? hullClip : undefined, opacity: insOp}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: 1920,
              height: 1080,
              transformOrigin: '0 0',
              transform: `translate(${anc.x}px, ${anc.y + rise}px) rotate(${tilt}deg) scale(${sc}) translate(${-wn.x}px, ${-wn.y - rise}px)`,
            }}
          >
            <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: insClip}}>
              <Prop {...common} sweep={{at: [liftAt + 4, slamAt - 2], dur: 22}} />
            </div>
          </div>
        </div>
      ) : null}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {dust}
      </svg>
      {flash > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: mc.x - 520 * k,
            top: mc.y - 300 * k,
            width: 1040 * k,
            height: 600 * k,
            borderRadius: '50%',
            background: `radial-gradient(ellipse at 50% 50%, ${rgba('#FFFFFF', 0.7 * flash)}, ${rgba('#DCE8FF', 0.25 * flash)} 35%, rgba(255,255,255,0) 70%)`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
    </div>
  );
};
/** the mouth centre of a placed slot (world px), for labels and the zoom-through */
export const slotMouth = (p: {x: number; y: number; w: number}): Pt => {
  const m = MOUTH.map((q) => propPoint(SLOT, p, q[0], q[1]));
  return {x: (m[0].x + m[1].x + m[2].x + m[3].x) / 4, y: (m[0].y + m[1].y + m[2].y + m[3].y) / 4};
};

/* ---------------------------------------------------------------- LabLens: arm + lens of recovery-scanner_c, magnifying */
const LENS: AssetName = 'recovery-scanner_c';
const GLASS = {cx: 543, cy: 367, rx: 160, ry: 58};
const CROP = {x0: 120, y0: 40, x1: 880, y1: 505};
const KNOB_RING: [number, number, number, number] = [772, 276, 815, 392];
/** world placement of the lens prop so its glass centre sits at L, at native→world scale k */
export const lensProp = (L: Pt, k: number) => {
  const b = assetBox(LENS);
  return {x: L.x - (GLASS.cx - b.cx) * k, y: L.y - (GLASS.cy - b.cy) * k, w: b.cw * k};
};
const MagCtx: React.FC<{m: number; children: React.ReactNode}> = ({m, children}) => {
  const cam = useContext(CameraContext);
  return <CameraContext.Provider value={{...cam, zoom: cam.zoom * m}}>{children}</CameraContext.Provider>;
};
export const LabLens: React.FC<{frame: number; L: Pt; k: number; op: number; mag: number; inner: React.ReactNode; scan: number; tilt?: number}> = ({frame: f, L, k, op, mag, inner, scan, tilt = 0}) => {
  if (op <= 0.01) return null;
  const P = lensProp(L, k);
  const wp = (nx: number, ny: number) => propPoint(LENS, P, nx, ny);
  const c0 = wp(CROP.x0, CROP.y0);
  const c1 = wp(CROP.x1, CROP.y1);
  const mc = wp(520, 300);
  const rx = GLASS.rx * k * 0.93;
  const ry = GLASS.ry * k * 0.93;
  const mask = `radial-gradient(ellipse ${(500 * k).toFixed(1)}px ${(300 * k).toFixed(1)}px at ${mc.x.toFixed(1)}px ${mc.y.toFixed(1)}px, #000 70%, rgba(0,0,0,0) 100%)`;
  const scanY = L.y - ry + 2 * ry * scan;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: op, transformOrigin: `${L.x}px ${L.y}px`, transform: tilt ? `rotate(${tilt}deg)` : undefined}}>
      {/* the glass: a dark well with the wall magnified inside */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `ellipse(${rx.toFixed(1)}px ${ry.toFixed(1)}px at ${L.x.toFixed(1)}px ${L.y.toFixed(1)}px)`}}>
        <div style={{position: 'absolute', left: L.x - rx, top: L.y - ry, width: rx * 2, height: ry * 2, background: '#0A0F18'}} />
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: '0 0', transform: `translate(${L.x}px, ${L.y}px) scale(${mag}) translate(${-L.x}px, ${-L.y}px)`}}>
          <MagCtx m={mag}>{inner}</MagCtx>
        </div>
        <div style={{position: 'absolute', left: L.x - rx, top: L.y - ry, width: rx * 2, height: ry * 2, background: `linear-gradient(160deg, ${rgba('#FFFFFF', 0.22)} 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 70%, ${rgba('#BFD4F0', 0.12)} 100%)`}} />
        {scan > 0 && scan < 1 ? <div style={{position: 'absolute', left: L.x - rx, top: scanY - 2, width: rx * 2, height: 4, background: rgba('#FFFFFF', 0.75), boxShadow: `0 0 12px 3px ${rgba('#FFFFFF', 0.4)}`}} /> : null}
      </div>
      {/* the arm and the lens ring (the glass itself is cut out so the magnified view shows) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          clipPath: `polygon(evenodd, ${c0.x}px ${c0.y}px, ${c1.x}px ${c0.y}px, ${c1.x}px ${c1.y}px, ${c0.x}px ${c1.y}px, ${c0.x}px ${c0.y}px, ${L.x + rx}px ${L.y}px, ${ellipsePts(L, rx, ry)})`,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      >
        <Prop frame={f} src={LENS} x={P.x} y={P.y} w={P.w} shadow={false} rim={{color: PAL.structure, strength: 0.5}}>
          <Regrade src={LENS} boxes={[KNOB_RING]} filter={REGRADE.white} />
        </Prop>
      </div>
    </div>
  );
};
const ellipsePts = (c: Pt, rx: number, ry: number): string =>
  Array.from({length: 33}, (_, i) => {
    const a = (i / 32) * Math.PI * 2;
    return `${(c.x + rx * Math.cos(a)).toFixed(1)}px ${(c.y + ry * Math.sin(a)).toFixed(1)}px`;
  }).join(', ');
