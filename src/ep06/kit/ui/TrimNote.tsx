/**
 * Ep06 UI kit: <TrimNote>, "a short note, called TRIM". Two looks, one behaviour:
 *   variant 'render'   trim-notice_b (the hero on the hardware stage), its baked cyan stripe regraded to magenta
 *   variant 'envelope' a code-drawn sleeve of range cards with a magenta tab (small enough to travel through a slot)
 * Both carry the photo's box numbers as decor (MONO, ≤ 24 px on screen) and can travel a path through a slot, or stop.
 *
 *   <TrimNote frame={f} variant="envelope" x={600} y={500} w={300} at={a}
 *     path={{pts: [{x: 600, y: 500}, {x: 1500, y: 520}], at: a + 10, dur: 40}} slot={{x: 1100, y: 510, h: 260}} />
 *   <TrimNote … path={{pts, at, dur, stopAt: 0.62}} />     // halts at 62 % of the path (the multi-drive-array beat)
 */
import React, {useContext} from 'react';
import {EASE, MONO, PAL, SPRING} from '../look';
import {Prop, propScale, type Enter, type Exit, type Sweep} from '../Prop';
import {type AssetName} from '../assets';
import {CameraContext, screenScale} from '../camera';
import {useTextCheck} from '../text';
import {clamp01, prog, rgba, safeId, springAt, type Num} from '../util';
import {UI_REGIONS} from './regions';
import {REGRADE, Regrade} from './shared';

export type TrimPath = {pts: ReadonlyArray<{x: number; y: number}>; at: number; dur: number; stopAt?: number};
export type TrimNoteProps = {
  frame: number;
  variant?: 'render' | 'envelope';
  /** rest centre (parent px) when there is no path */
  x: number;
  y: number;
  /** visible width (render: the asset's alpha box; envelope: the sleeve) */
  w?: number;
  imageSrc?: AssetName;
  at?: number;
  exitAt?: number;
  enter?: Enter;
  exit?: Exit;
  float?: number;
  tiltX?: Num;
  tiltY?: Num;
  rim?: string | {color: string; strength?: number};
  sweep?: Sweep | false;
  path?: TrimPath;
  /** a vertical slit the note passes through (drawn here) */
  slot?: {x: number; y: number; h?: number};
  /** decor box numbers (default the photo's three runs) */
  numbers?: string;
  /** decor size in on-screen px (≤ 24) */
  numberSize?: number;
  screen?: boolean | number;
  /** envelope: w is in on-screen px (counter-scaled like `screen` text), so the note reads at its size in a zoomed-out world */
  wOnScreen?: boolean;
};

const SRC: AssetName = 'trim-notice_b';

/** Position along a polyline at arc length L, plus the total length. */
const along = (pts: ReadonlyArray<{x: number; y: number}>, L: number): {x: number; y: number; total: number} => {
  let total = 0;
  const seg: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    seg.push(d);
    total += d;
  }
  let rem = Math.max(0, Math.min(total, L));
  for (let i = 0; i < seg.length; i++) {
    if (rem <= seg[i] || i === seg.length - 1) {
      const t = seg[i] > 0 ? Math.min(1, rem / seg[i]) : 0;
      return {x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t, total};
    }
    rem -= seg[i];
  }
  return {x: pts[0].x, y: pts[0].y, total};
};

/** Where the note is at a frame (parent px), its speed (px/frame), and whether it has stopped. */
export const trimNotePos = (p: {x: number; y: number; path?: TrimPath}, f: number): {x: number; y: number; vx: number; vy: number; stopped: boolean; hit: number} => {
  if (!p.path || p.path.pts.length < 2) return {x: p.x, y: p.y, vx: 0, vy: 0, stopped: false, hit: -1};
  const {pts, at, dur, stopAt} = p.path;
  const at0 = along(pts, 0);
  const total = at0.total;
  const posAt = (fr: number): number => {
    if (stopAt === undefined) return total * prog(fr, at, dur, EASE.inOut);
    const T = Math.max(1, Math.round(dur * stopAt));
    const t = fr - at;
    if (t <= T) return total * stopAt * prog(fr, at, T, EASE.inCubic);
    const tb = t - T;
    return total * stopAt - 22 * Math.exp(-tb / 4) * Math.abs(Math.sin(tb * 0.55));
  };
  const L = posAt(f);
  const Lp = posAt(f - 1);
  const a = along(pts, L);
  const b = along(pts, Lp);
  const hit = stopAt !== undefined ? at + Math.max(1, Math.round(dur * stopAt)) : -1;
  return {x: a.x, y: a.y, vx: a.x - b.x, vy: a.y - b.y, stopped: stopAt !== undefined && f >= hit, hit};
};

const DEFAULT_NUMBERS = '021–023 · 058–060 · 098–100';

/** The code-drawn paper note: an envelope (paper tone), a magenta index tab, a magenta seal and decor box numbers. Vector, so any w stays sharp. */
const Envelope: React.FC<{w: number; numbers: string; numPx: number; glow: number; uid: string}> = ({w, numbers, numPx: want, glow, uid}) => {
  const W = w;
  const H = w * 0.62;
  const numPx = Math.min(want, (W * 0.84) / Math.max(1, numbers.length * 0.6));
  const r = W * 0.03;
  const tabW = W * 0.2;
  const tabH = H * 0.2;
  return (
    <div style={{position: 'absolute', left: -W / 2, top: -H / 2, width: W, height: H}}>
      <div style={{position: 'absolute', left: W * 0.04, right: W * 0.04, top: H * 0.9, height: H * 0.22, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.55), rgba(0,0,0,0))'}} />
      {/* the index tab, behind the envelope's top edge */}
      <div
        style={{
          position: 'absolute',
          left: W * 0.1,
          top: -tabH * 0.62,
          width: tabW,
          height: tabH,
          borderRadius: `${r * 0.8}px ${r * 0.8}px 0 0`,
          background: `linear-gradient(180deg, #F7A6FF, ${PAL.emphasis} 60%, #B93FCB)`,
          boxShadow: `0 0 ${W * 0.06 * (0.6 + glow)}px ${rgba(PAL.emphasis, 0.55 + 0.3 * glow)}`,
        }}
      />
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`${uid}-pp`} x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#FBF9F5" />
            <stop offset="0.6" stopColor={PAL.paper} />
            <stop offset="1" stopColor={PAL.paperMid} />
          </linearGradient>
          <linearGradient id={`${uid}-fl`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="1" stopColor={PAL.paperMid} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} rx={r} fill={`url(#${uid}-pp)`} stroke={PAL.paperShade} strokeWidth={Math.max(1, W * 0.004)} />
        {/* bottom folds */}
        <path d={`M ${r} ${H - r * 0.4} L ${W * 0.5} ${H * 0.5} L ${W - r} ${H - r * 0.4}`} fill="none" stroke={rgba('#9C958B', 0.45)} strokeWidth={Math.max(1, W * 0.005)} />
        {/* the top flap */}
        <path d={`M ${r * 0.6} ${r * 0.4} L ${W * 0.5} ${H * 0.56} L ${W - r * 0.6} ${r * 0.4} Z`} fill={`url(#${uid}-fl)`} stroke={rgba('#9C958B', 0.55)} strokeWidth={Math.max(1, W * 0.005)} strokeLinejoin="round" />
        <path d={`M ${r * 0.6} ${r * 0.4} L ${W * 0.5} ${H * 0.56} L ${W - r * 0.6} ${r * 0.4}`} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={Math.max(2, W * 0.012)} transform={`translate(0 ${W * 0.008})`} />
        {/* magenta seal where the flap closes */}
        <circle cx={W * 0.5} cy={H * 0.53} r={W * 0.06} fill={PAL.emphasis} />
        <circle cx={W * 0.5} cy={H * 0.53} r={W * 0.06} fill="none" stroke="#F7A6FF" strokeWidth={Math.max(1, W * 0.008)} opacity={0.8} />
        <circle cx={W * 0.485} cy={H * 0.515} r={W * 0.018} fill="#FFFFFF" opacity={0.55} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: H * 0.74,
          textAlign: 'center',
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: numPx,
          color: PAL.plateInk,
          opacity: 0.8,
          whiteSpace: 'nowrap',
          letterSpacing: '0.02em',
        }}
      >
        {numbers}
      </div>
    </div>
  );
};

export const TrimNote: React.FC<TrimNoteProps> = ({
  frame: f,
  variant = 'envelope',
  x,
  y,
  w,
  imageSrc = SRC,
  at,
  exitAt,
  enter,
  exit,
  float = 3,
  tiltX,
  tiltY,
  rim,
  sweep,
  path,
  slot,
  numbers = DEFAULT_NUMBERS,
  numberSize = 20,
  screen,
  wOnScreen,
}) => {
  const uid = safeId(React.useId());
  const cam = useContext(CameraContext);
  const inv = screenScale(screen, cam);
  useTextCheck('decor', numberSize, true, `TrimNote numbers "${numbers}"`);
  const pos = trimNotePos({x, y, path}, f);
  const shake = pos.stopped ? Math.exp(-(f - pos.hit) / 5) : 0;
  const sx = shake * 5 * Math.sin((f - pos.hit) * 2.4);
  // slot crossing flash
  const crossing = slot ? clamp01(1 - Math.abs(pos.x - slot.x) / 90) : 0;
  const slotH = slot?.h ?? 240;
  const slotEl = (front: boolean) => {
    if (!slot) return null;
    const cap = (top: number) => (
      <div style={{position: 'absolute', left: -20, top, width: 40, height: 16, borderRadius: 5, background: 'linear-gradient(180deg, #E3E7ED, #9AA3B0 55%, #6B7482)', boxShadow: '0 4px 10px rgba(0,0,0,0.5)'}} />
    );
    return (
      <div style={{position: 'absolute', left: slot.x, top: slot.y, width: 0, height: 0}}>
        {front ? (
          <>
            {cap(-slotH / 2 - 16)}
            {cap(slotH / 2)}
            <div style={{position: 'absolute', left: 6, top: -slotH / 2, width: 5, height: slotH, borderRadius: 3, background: `linear-gradient(180deg, ${rgba(PAL.ink, 0.15)}, ${rgba(PAL.ink, 0.55)}, ${rgba(PAL.ink, 0.15)})`}} />
            {crossing > 0.01 ? (
              <div style={{position: 'absolute', left: -70, top: -slotH * 0.62, width: 140, height: slotH * 1.24, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.5 * crossing)}, ${rgba(PAL.emphasis, 0.16 * crossing)} 60%, rgba(0,0,0,0))`}} />
            ) : null}
          </>
        ) : (
          <>
            <div style={{position: 'absolute', left: -2, top: -slotH * 1.5, width: 4, height: slotH, background: `linear-gradient(180deg, ${rgba(PAL.structure, 0)}, ${rgba(PAL.structure, 0.6)})`}} />
            <div style={{position: 'absolute', left: -2, top: slotH * 0.5, width: 4, height: slotH, background: `linear-gradient(180deg, ${rgba(PAL.structure, 0.6)}, ${rgba(PAL.structure, 0)})`}} />
            <div style={{position: 'absolute', left: -12, top: -slotH / 2, width: 24, height: slotH, borderRadius: 6, background: 'linear-gradient(90deg, #03050B, #0B111D)', boxShadow: `inset 0 0 14px rgba(0,0,0,0.9)`}} />
          </>
        )}
      </div>
    );
  };
  let body: React.ReactNode;
  if (variant === 'render') {
    const pw = w ?? 640;
    const k = propScale(imageSrc, {w: pw});
    const nat = Math.min(70, (numberSize * inv) / k);
    const box = UI_REGIONS.trimCardFace;
    body = (
      <Prop
        frame={f}
        src={imageSrc}
        x={path ? path.pts[0].x : x}
        y={path ? path.pts[0].y : y}
        w={pw}
        enter={enter}
        exit={exit}
        float={float}
        tiltX={tiltX}
        tiltY={tiltY}
        rim={rim}
        sweep={sweep}
        nudge={{dx: pos.x - (path ? path.pts[0].x : x) + sx, dy: pos.y - (path ? path.pts[0].y : y), blurX: pos.vx, blurY: pos.vy}}
      >
        <Regrade src={imageSrc} boxes={[UI_REGIONS.trimStripe]} filter={REGRADE.magenta} />
        <div
          style={{
            position: 'absolute',
            left: box[0],
            top: box[1],
            width: box[2] - box[0],
            height: box[3] - box[1],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: MONO,
            fontWeight: 500,
            fontSize: nat,
            color: PAL.plateInk,
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          {numbers}
        </div>
      </Prop>
    );
  } else {
    const W = (w ?? 300) * (wOnScreen ? (screen !== undefined ? inv : 1 / Math.max(1e-3, cam.zoom)) : 1);
    const pin = at === undefined ? 1 : springAt(f, at, SPRING.pop);
    const pout = exitAt === undefined ? 0 : prog(f, exitAt, 9, EASE.inCubic);
    if (pin <= 0.001 || pout >= 1) return <>{slotEl(false)}{slotEl(true)}</>;
    const fl = float * Math.sin(f / 24);
    const speed = Math.hypot(pos.vx, pos.vy);
    const tilt = Math.max(-8, Math.min(8, pos.vx * 0.35));
    const glow = 0.5 + 0.5 * Math.sin(f / 9);
    const mk = (dx: number, dy: number, op: number, key: string) => (
      <div key={key} style={{position: 'absolute', left: pos.x + sx + dx, top: pos.y + fl + dy, width: 0, height: 0, opacity: op * clamp01(pin * 3) * (1 - pout), transform: `rotate(${tilt}deg) scale(${Math.max(0, pin) * (1 - 0.15 * pout)})`}}>
        <Envelope w={W} numbers={numbers} numPx={numberSize * inv} glow={glow} uid={uid} />
      </div>
    );
    body = (
      <>
        {speed > 12 ? mk(-pos.vx * 0.9, -pos.vy * 0.9, 0.22, 'g2') : null}
        {speed > 6 ? mk(-pos.vx * 0.45, -pos.vy * 0.45, 0.35, 'g1') : null}
        {mk(0, 0, 1, 'n')}
      </>
    );
  }
  return (
    <>
      {slotEl(false)}
      {body}
      {slotEl(true)}
    </>
  );
};
