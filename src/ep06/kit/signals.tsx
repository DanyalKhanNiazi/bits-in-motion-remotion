/**
 * Ep03 kit: signals.
 *   <Bit>        the cyan glowing pellet (the channel's Bit) travelling an SVG path, with a streak and pixel trail
 *   <TokenTile>  a white physical tile: snaps into place with a click, flips to show its ID number
 *   <TileRow>    lays tiles out in a row (measured widths), staggered snaps/flips, the Bit marks the newest tile
 */
import React, {useId, useMemo} from 'react';
import {EASE, MONO, PAL, SANS, SPRING} from './look';
import {Rich} from './glyphs';
import {TAU, clamp01, lerp, pathAt, prog, rgba, safeId, samplePath, springAt, textWidth, useFontsReady, type EaseFn} from './util';

/* ---------------------------------------------------------------- the Bit (shared drawing) */
export const BitHead: React.FC<{x: number; y: number; size?: number; color?: string; glow?: number; opacity?: number; gid: string}> = ({
  x,
  y,
  size = 24,
  color = PAL.info,
  glow = 1,
  opacity = 1,
  gid,
}) => (
  <g opacity={opacity}>
    <defs>
      <radialGradient id={`${gid}-g`}>
        <stop offset="0" stopColor={color} stopOpacity={0.62} />
        <stop offset="0.45" stopColor={color} stopOpacity={0.2} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    {glow > 0 ? (
      <>
        <circle cx={x} cy={y} r={size * 6.2} fill={`url(#${gid}-g)`} opacity={0.22 * glow} />
        <circle cx={x} cy={y} r={size * 2.6} fill={`url(#${gid}-g)`} opacity={0.95 * glow} />
      </>
    ) : null}
    <rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={size * 0.22} fill={color} />
    <rect x={x - size * 0.22} y={y - size * 0.22} width={size * 0.44} height={size * 0.44} rx={size * 0.1} fill="#E9FDFF" opacity={0.9} />
  </g>
);

export type BitProps = {
  frame: number;
  /** SVG path in the parent's px */
  path: string;
  /** travel window (absolute frames) */
  from?: number;
  to?: number;
  ease?: EaseFn;
  /** or drive it directly: 0..1 along the path (any value when loop) */
  progress?: number;
  loop?: boolean;
  size?: number;
  color?: string;
  trail?: boolean;
  /** draw the route: none, only the lit wake, or the full idle route plus the wake */
  route?: 'none' | 'lit' | 'full';
  routeWidth?: number;
  /** landing ripple at the end */
  land?: boolean;
  /** hide the Bit this many frames after it lands (default: stays) */
  hideAfter?: number;
  /** show the head before it departs (resting at the start) */
  rest?: boolean;
};

export const Bit: React.FC<BitProps> = ({
  frame,
  path,
  from = 0,
  to = 30,
  ease = EASE.carry,
  progress,
  loop = false,
  size = 24,
  color = PAL.info,
  trail = true,
  route = 'lit',
  routeWidth = 5,
  land = true,
  hideAfter,
  rest = true,
}) => {
  const gid = safeId(useId());
  const s = useMemo(() => samplePath(path), [path]);
  const pAt = (fr: number) => (progress !== undefined ? progress : prog(fr, from, Math.max(1, to - from), ease));
  if (progress === undefined && (frame < from - (rest ? 6 : 0) || (hideAfter !== undefined && frame > to + hideAfter))) return null;
  const p = pAt(frame);
  const pp = progress !== undefined ? p : pAt(frame - 1);
  const L = loop ? (((p % 1) + 1) % 1) * s.total : clamp01(p) * s.total;
  const Lp = loop ? (((pp % 1) + 1) % 1) * s.total : clamp01(pp) * s.total;
  let speed = Math.abs(L - Lp);
  if (loop && speed > s.total / 2) speed = s.total - speed;
  const head = pathAt(s, L);
  const moving = speed > 0.5;
  const tl = Math.min(300, speed * 7);
  const segs: React.ReactNode[] = [];
  if (trail && moving) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = L - (tl * i) / n;
      const b = L - (tl * (i + 1)) / n;
      const wrapA = loop ? ((a % s.total) + s.total) % s.total : a;
      const wrapB = loop ? ((b % s.total) + s.total) % s.total : b;
      if (!loop && b < 0) break;
      const A = pathAt(s, wrapA);
      const B = pathAt(s, wrapB);
      if (Math.hypot(A.x - B.x, A.y - B.y) > 60) continue;
      const k = 1 - i / n;
      segs.push(<line key={`t${i}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke={color} strokeWidth={size * 0.55 * k + 1} strokeOpacity={0.75 * k * k} strokeLinecap="round" />);
    }
  }
  const pix: React.ReactNode[] = [];
  if (trail && moving) {
    const offs = [30, 54, 74];
    const sizes = [size * 0.62, size * 0.46, size * 0.32];
    offs.forEach((o, i) => {
      const at = loop ? (((L - o) % s.total) + s.total) % s.total : L - o;
      if (!loop && at < 0) return;
      const P = pathAt(s, at);
      const q = 4;
      pix.push(
        <rect
          key={`p${i}`}
          x={Math.round(P.x / q) * q - sizes[i] / 2 + P.ty * size * 0.5}
          y={Math.round(P.y / q) * q - sizes[i] / 2 - P.tx * size * 0.5}
          width={sizes[i]}
          height={sizes[i]}
          rx={2}
          fill={color}
          opacity={[0.8, 0.55, 0.32][i]}
        />,
      );
    });
  }
  const landed = !loop && progress === undefined && frame >= to;
  const rt = frame - to;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {route === 'full' ? <path d={path} fill="none" stroke={PAL.structure} strokeOpacity={0.5} strokeWidth={routeWidth} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {route !== 'none' && !loop ? (
        <>
          <path d={path} fill="none" stroke={color} strokeOpacity={0.16} strokeWidth={routeWidth * 4.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L} ${s.total + 10}`} />
          <path d={path} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={routeWidth} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${L} ${s.total + 10}`} />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={routeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`0 ${Math.max(0, L - 220)} ${Math.min(L, 220)} ${s.total + 10}`}
          />
        </>
      ) : null}
      {segs}
      {pix}
      {land && landed && rt < 16 ? (
        <>
          <rect
            x={head.x - lerp(12, 46, EASE.out(rt / 16))}
            y={head.y - lerp(12, 46, EASE.out(rt / 16))}
            width={lerp(24, 92, EASE.out(rt / 16))}
            height={lerp(24, 92, EASE.out(rt / 16))}
            rx={8}
            fill="none"
            stroke={color}
            strokeWidth={lerp(4, 1.5, rt / 16)}
            opacity={0.9 * (1 - rt / 16)}
          />
          <circle cx={head.x} cy={head.y} r={lerp(20, 130, EASE.out(rt / 16))} fill="none" stroke={color} strokeWidth={2} opacity={0.4 * (1 - rt / 16)} />
        </>
      ) : null}
      <BitHead x={head.x} y={head.y} size={size * (landed && rt < 8 ? 1 + 0.25 * Math.exp(-rt / 3) : 1)} color={color} gid={gid} />
    </svg>
  );
};

/* ---------------------------------------------------------------- TokenTile */
export type TileProps = {
  frame: number;
  text: string;
  /** the ID number on the back */
  id?: string | number;
  x: number;
  y: number;
  size?: number;
  /** explicit width (TileRow passes measured widths) */
  w?: number;
  snapAt?: number;
  from?: {dx?: number; dy?: number; rot?: number};
  flipAt?: number;
  flipBackAt?: number;
  /** 0..1: the newest piece (cyan rim + glow) */
  newest?: number;
  /** a not-yet-real tile (dashed, translucent) */
  ghost?: boolean;
  exitAt?: number;
  dim?: number;
};

export const tileH = (size: number) => size * 1.5;
export const tileW = (text: string, size: number, id?: string | number) =>
  Math.max(size * 1.3, textWidth(text.trim(), size, 600) + size * 0.95, id !== undefined ? String(id).length * size * 0.8 * 0.6 + size * 0.9 : 0);

export const TokenTile: React.FC<TileProps> = ({frame, text, id, x, y, size = 60, w, snapAt, from, flipAt, flipBackAt, newest = 0, ghost = false, exitAt, dim = 0}) => {
  useFontsReady();
  if (snapAt !== undefined && frame < snapAt) return null;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 8, EASE.inCubic) : 0;
  if (ex >= 1) return null;
  const sp = snapAt !== undefined ? springAt(frame, snapAt, SPRING.snap) : 1;
  const dx = (1 - sp) * (from?.dx ?? 0);
  const dy = (1 - sp) * (from?.dy ?? -150);
  const rot = (1 - sp) * (from?.rot ?? -8);
  const op = snapAt !== undefined ? clamp01((frame - snapAt + 1) / 3) : 1;
  const click = snapAt !== undefined ? frame - (snapAt + 6) : 99;
  const squash = click >= 0 && click < 18 ? 0.08 * Math.exp(-click / 3) * Math.cos(click * 0.9) : 0;
  const flip = flipAt !== undefined ? springAt(frame, flipAt, {damping: 14, stiffness: 110, mass: 0.8}) : 0;
  const back = flipBackAt !== undefined ? springAt(frame, flipBackAt, {damping: 14, stiffness: 110, mass: 0.8}) : 0;
  const ang = 180 * (flip - back);
  const lift = Math.sin(Math.PI * clamp01(flip - back)) * 0.12 + (snapAt !== undefined ? (1 - Math.min(1, sp)) * 0.1 : 0);
  const H = tileH(size);
  const Wd = w ?? tileW(text, size, id);
  const face: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: Wd,
    height: H,
    borderRadius: size * 0.24,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const glowN = clamp01(newest);
  return (
    <div style={{position: 'absolute', left: x + dx, top: y + dy, width: 0, height: 0, opacity: op * (1 - ex)}}>
      <div
        style={{
          position: 'absolute',
          left: -Wd * 0.48,
          top: H * 0.5 - H * 0.08 + lift * H * 0.6,
          width: Wd * 0.96,
          height: H * 0.28,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))',
          filter: 'blur(5px)',
          opacity: ghost ? 0.2 : 1 - lift * 2,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: -Wd / 2,
          top: -H / 2,
          width: Wd,
          height: H,
          perspective: 1100,
          transform: `translateY(${-lift * H * 0.5 - ex * 30}px) rotate(${rot}deg) scale(${1 + lift + squash * 0.5}, ${1 + lift - squash})`,
          transformOrigin: '50% 100%',
        }}
      >
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${ang}deg)`}}>
          <div
            style={{
              ...face,
              background: ghost ? rgba(PAL.tile, 0.06) : `linear-gradient(180deg, #FFFFFF 0%, ${PAL.tile} 40%, ${PAL.tileMid} 100%)`,
              border: ghost ? `3px dashed ${rgba(PAL.annotation, 0.55)}` : undefined,
              boxShadow: ghost
                ? undefined
                : [
                    'inset 0 3px 0 rgba(255,255,255,0.95)',
                    `inset 0 -4px 0 ${rgba(PAL.tileEdge, 0.45)}`,
                    `0 ${size * 0.11}px 0 ${PAL.tileEdge}`,
                    `0 ${size * 0.13}px 0 #8E97A8`,
                    `0 ${size * 0.4}px ${size * 0.5}px rgba(0,0,0,0.5)`,
                    glowN > 0 ? `0 0 0 ${3 + 2 * glowN}px ${rgba(PAL.structure, 0.95 * glowN)}, 0 0 ${30 * glowN}px ${rgba(PAL.structure, 0.65 * glowN)}` : '',
                  ]
                    .filter(Boolean)
                    .join(', '),
              filter: dim > 0 ? `brightness(${1 - dim * 0.55})` : undefined,
            }}
          >
            <span style={{fontFamily: SANS, fontWeight: 600, fontSize: size, color: ghost ? rgba(PAL.annotation, 0.6) : PAL.tileInk, lineHeight: 1, marginTop: -size * 0.04}}>
              <Rich text={text.trim()} weight={600} />
            </span>
          </div>
          <div
            style={{
              ...face,
              transform: 'rotateY(180deg)',
              background: `linear-gradient(180deg, #1C2C4C 0%, ${PAL.deck} 100%)`,
              boxShadow: [
                `inset 0 2px 0 ${rgba('#6F8FCB', 0.5)}`,
                `0 ${size * 0.11}px 0 #0B1222`,
                `0 ${size * 0.4}px ${size * 0.5}px rgba(0,0,0,0.5)`,
                `0 0 0 2px ${rgba(PAL.structure, 0.55)}`,
                `0 0 ${24}px ${rgba(PAL.structure, 0.35)}`,
              ].join(', '),
            }}
          >
            <span style={{fontFamily: MONO, fontWeight: 500, fontSize: size * 0.8, color: PAL.ink, lineHeight: 1}}>{id ?? ''}</span>
          </div>
        </div>
      </div>
      {click >= 0 && click < 12 ? (
        <div
          style={{
            position: 'absolute',
            left: -Wd / 2,
            top: -H / 2,
            width: Wd,
            height: H,
            borderRadius: size * 0.24,
            border: `3px solid ${rgba('#FFFFFF', 0.8 * (1 - click / 12))}`,
            transform: `scale(${1 + 0.28 * EASE.out(click / 12)})`,
          }}
        />
      ) : null}
    </div>
  );
};

/* ---------------------------------------------------------------- TileRow */
type Sched = readonly number[] | {start: number; every: number};
const schedAt = (s: Sched | undefined, i: number): number | undefined => (s === undefined ? undefined : Array.isArray(s) ? (s as readonly number[])[i] : (s as {start: number; every: number}).start + i * (s as {start: number; every: number}).every);

export type TileRowProps = {
  frame: number;
  tokens: readonly string[];
  ids?: ReadonlyArray<string | number>;
  /** centre of the row */
  x: number;
  y: number;
  size?: number;
  gap?: number;
  maxWidth?: number;
  snapAt?: Sched;
  flipAt?: Sched;
  from?: {dx?: number; dy?: number; rot?: number};
  /** the Bit marks the newest snapped tile */
  marker?: boolean;
  /** wrap onto several centred lines instead of scaling down to maxWidth */
  wrap?: boolean;
  /** indices drawn as ghost tiles */
  ghosts?: readonly number[];
  exitAt?: number;
};

/**
 * Measured layout of a tile row (centred on 0,0): each tile's centre and width. With `maxWidth`, tiles wrap onto
 * centred lines (greedy); lines are `tileH × 1.55` apart.
 */
export const tileRowLayout = (tokens: readonly string[], size: number, gap: number, ids?: ReadonlyArray<string | number>, maxWidth = Infinity) => {
  const ws = tokens.map((t, i) => tileW(t, size, ids?.[i]));
  const lines: number[][] = [];
  let cur: number[] = [];
  let curW = 0;
  ws.forEach((w, i) => {
    const add = (cur.length ? gap : 0) + w;
    if (cur.length && curW + add > maxWidth) {
      lines.push(cur);
      cur = [i];
      curW = w;
    } else {
      cur.push(i);
      curW += add;
    }
  });
  if (cur.length) lines.push(cur);
  const lh = tileH(size) * 1.55;
  const xs: number[] = new Array(ws.length).fill(0);
  const ys: number[] = new Array(ws.length).fill(0);
  let total = 0;
  lines.forEach((ln, li) => {
    const tw = ln.reduce((a, i) => a + ws[i], 0) + gap * (ln.length - 1);
    total = Math.max(total, tw);
    let cx = -tw / 2;
    ln.forEach((i) => {
      xs[i] = cx + ws[i] / 2;
      ys[i] = (li - (lines.length - 1) / 2) * lh;
      cx += ws[i] + gap;
    });
  });
  return {ws, xs, ys, total, lines: lines.length};
};

export const TileRow: React.FC<TileRowProps> = ({frame, tokens, ids, x, y, size = 60, gap = 16, maxWidth = 1760, wrap = false, snapAt, flipAt, from, marker = true, ghosts, exitAt}) => {
  useFontsReady();
  const gid = safeId(useId());
  const L = tileRowLayout(tokens, size, gap, ids, wrap ? maxWidth : Infinity);
  const sc = Math.min(1, maxWidth / L.total);
  let newest = -1;
  let newestAt = -1;
  tokens.forEach((_, i) => {
    const a = schedAt(snapAt, i);
    if (a === undefined || frame >= a + 6) {
      newest = i;
      newestAt = a ?? -1;
    }
  });
  const prevNewest = newest - 1;
  const mv = newestAt >= 0 ? prog(frame, newestAt + 4, 7, EASE.inOut) : 1;
  const mx = newest >= 0 ? lerp(prevNewest >= 0 ? L.xs[prevNewest] : L.xs[newest], L.xs[newest], mv) : 0;
  const myBase = newest >= 0 ? lerp(prevNewest >= 0 ? L.ys[prevNewest] : L.ys[newest], L.ys[newest], mv) : 0;
  const my = myBase - tileH(size) / 2 - size * 0.55 - Math.sin(Math.PI * mv) * size * 0.6;
  const ex = exitAt !== undefined ? prog(frame, exitAt, 8) : 0;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${sc})`, transformOrigin: '0 0'}}>
      {tokens.map((t, i) => (
        <TokenTile
          key={i}
          frame={frame}
          text={t}
          id={ids?.[i]}
          x={L.xs[i]}
          y={L.ys[i]}
          size={size}
          w={L.ws[i]}
          snapAt={schedAt(snapAt, i)}
          flipAt={schedAt(flipAt, i)}
          from={from}
          ghost={ghosts?.includes(i)}
          newest={marker && i === newest ? 1 - prog(frame, (schedAt(snapAt, i + 1) ?? 1e9) + 6, 4) : 0}
          exitAt={exitAt !== undefined ? exitAt + i : undefined}
        />
      ))}
      {marker && newest >= 0 && ex < 1 ? (
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={1 - ex}>
          <BitHead x={mx} y={my + Math.sin((TAU * frame) / 48) * 3} size={size * 0.34} gid={gid} />
        </svg>
      ) : null}
    </div>
  );
};
