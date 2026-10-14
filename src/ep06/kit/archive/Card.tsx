/**
 * Ep06 kit: the index card. ONE renderer (<CardFace>) draws the photo's card in the Archive's drawer, lifted over the
 * wall, in close-ups and as <IndexCard>. Layout registered to mft-record_b (its native px are the card's own units):
 * fields name (passport.jpg) · size · dates (blank bars) · directions (3 numberless sockets). Paper PAL.paper, ink
 * PAL.tileInk. States: active · struck (coral scratch over 10 f) · free/unused (coral tab on the top edge) · reused
 * (grey scribble over the name). Variants: 'photo' · 'blank' (ruled, nameless) · 'tiny' (a tiny file: grey Bits on the card).
 */
import React, {useId} from 'react';
import {EASE, MONO, PAL, SANS} from '../look';
import {clamp01, lerp, prog, rgba, safeId, useFontsReady, win} from '../util';
import {CARD, cardH, cardK} from './geom';

export type CardVariant = 'photo' | 'blank' | 'tiny';
export type CardTimes = {
  /** coral scratch across the name (10 f) */
  strike?: number;
  /** coral free/unused tab rises on the top edge */
  flag?: number;
  /** grey scribble over the name; the sockets go dark */
  reuse?: number;
  /** fields light (as spoken): frame each one lights */
  fields?: {name?: number; size?: number; dates?: number; directions?: number};
  /** socket plugs glow cyan (threads attached) from this frame; NEVER-like big number = never */
  plugs?: number;
  /** a read pulse leaves the sockets at this frame */
  read?: number;
};
const NEVER = 1e9;

/** Shared <defs> for cards (gradients), one per SVG. `p` = id prefix. */
export const CardDefs: React.FC<{p: string}> = ({p}) => (
  <>
    <linearGradient id={`${p}-paper`} x1="0" y1="0" x2="0.55" y2="1">
      <stop offset="0" stopColor="#FFFFFF" />
      <stop offset="0.22" stopColor={PAL.paper} />
      <stop offset="0.75" stopColor={PAL.paperMid} />
      <stop offset="1" stopColor="#D3CDC4" />
    </linearGradient>
    <linearGradient id={`${p}-edge`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#BDB5AA" />
      <stop offset="1" stopColor="#8E867B" />
    </linearGradient>
    <linearGradient id={`${p}-sheen`} x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.55} />
      <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0} />
    </linearGradient>
    <linearGradient id={`${p}-bar`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#CFC9C0" />
      <stop offset="0.16" stopColor="#E3DFD8" />
      <stop offset="1" stopColor="#ECE9E4" />
    </linearGradient>
    <linearGradient id={`${p}-sock`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#3B4A60" />
      <stop offset="0.25" stopColor="#273346" />
      <stop offset="1" stopColor="#161E2B" />
    </linearGradient>
    <linearGradient id={`${p}-silver`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.plateHi} />
      <stop offset="0.45" stopColor={PAL.plate} />
      <stop offset="1" stopColor={PAL.plateLo} />
    </linearGradient>
    <linearGradient id={`${p}-tab`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#FF8A78" />
      <stop offset="0.5" stopColor={PAL.loss} />
      <stop offset="1" stopColor={PAL.lossDeep} />
    </linearGradient>
    <radialGradient id={`${p}-shadow`}>
      <stop offset="0" stopColor="#000" stopOpacity={0.55} />
      <stop offset="0.6" stopColor="#000" stopOpacity={0.22} />
      <stop offset="1" stopColor="#000" stopOpacity={0} />
    </radialGradient>
  </>
);

const R = (b: readonly number[], rx: number, fill: string, extra?: React.SVGProps<SVGRectElement>) => (
  <rect x={b[0]} y={b[1]} width={b[2] - b[0]} height={b[3] - b[1]} rx={rx} fill={fill} {...extra} />
);

/** a hand-drawn scratch across the name field, drawn over 10 f (pathLength-normalised) */
const SCRATCH = 'M 136 470 C 230 440, 330 466, 430 446 S 600 452, 668 432';
const SCRATCH2 = 'M 150 452 C 260 468, 380 436, 470 458 S 610 440, 660 456';
const SCRIBBLE = 'M 290 420 L 330 492 L 360 414 L 392 494 L 424 416 L 454 494 L 488 414 L 518 492 L 550 418 L 582 490 L 612 420 L 640 486';

/**
 * The card face in its own units (mft-record_b native px), drawn into the current SVG at centre (x, y), width w.
 * `f` is the absolute frame. Put <CardDefs p> in the same SVG.
 */
export const CardFace: React.FC<{
  f: number;
  p: string;
  x: number;
  y: number;
  w: number;
  rot?: number;
  variant?: CardVariant;
  t?: CardTimes;
  /** contact/drop shadow strength (0 = none) */
  shadow?: number;
  /** extra lift of the shadow (px, card units) — a lifted card casts a softer, farther shadow */
  shadowLift?: number;
  opacity?: number;
}> = ({f, p, x, y, w, rot = 0, variant = 'photo', t = {}, shadow = 1, shadowLift = 0, opacity = 1}) => {
  const k = cardK(w);
  const strike = prog(f, t.strike ?? NEVER, 10, EASE.out);
  const strike2 = prog(f, (t.strike ?? NEVER) + 4, 8, EASE.out);
  const flag = prog(f, t.flag ?? NEVER, 12, EASE.outBack);
  const reuse = prog(f, t.reuse ?? NEVER, 14, EASE.out);
  const plugs = f >= (t.plugs ?? NEVER) ? 1 : 0;
  const fl = (key: keyof NonNullable<CardTimes['fields']>) => {
    const a = t.fields?.[key];
    return a === undefined ? 0 : win(f, a, undefined, 8);
  };
  const ink = PAL.tileInk;
  const named = variant === 'photo';
  const L = CARD.fields;
  const fieldGlow = (b: readonly number[], v: number, key: string) =>
    v > 0 ? (
      <g key={key} opacity={v}>
        <rect x={b[0] - 14} y={b[1] - 14} width={b[2] - b[0] + 28} height={b[3] - b[1] + 28} rx={26} fill="none" stroke={PAL.structure} strokeOpacity={0.35} strokeWidth={22} />
        <rect x={b[0] - 8} y={b[1] - 8} width={b[2] - b[0] + 16} height={b[3] - b[1] + 16} rx={20} fill="none" stroke={PAL.tileInk} strokeWidth={6} />
      </g>
    ) : null;
  const sl = shadowLift;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k}) translate(${-CARD.cx} ${-CARD.cy})`} opacity={opacity}>
      {shadow > 0 ? (
        <>
          <ellipse cx={CARD.cx + 30 + sl * 0.3} cy={CARD.y1 + 20 + sl * 0.8} rx={CARD.w * (0.6 + sl / 2200)} ry={90 + sl * 0.3} fill={`url(#${p}-shadow)`} opacity={shadow * (1 - Math.min(0.5, sl / 1100))} />
          {sl < 40 ? <rect x={CARD.x0 + 10} y={CARD.y0 + 22} width={CARD.w} height={CARD.h} rx={CARD.r} fill="#000" opacity={0.28 * shadow * (1 - sl / 40)} /> : null}
        </>
      ) : null}
      {/* free / unused tab: rises from behind the top edge */}
      {flag > 0 ? (
        <g transform={`translate(0 ${(1 - flag) * 70})`}>
          <path d={`M ${CARD.tab[0]} ${CARD.tab[3] + 20} V ${CARD.tab[1] + 18} Q ${CARD.tab[0]} ${CARD.tab[1]} ${CARD.tab[0] + 18} ${CARD.tab[1]} H ${CARD.tab[2] - 18} Q ${CARD.tab[2]} ${CARD.tab[1]} ${CARD.tab[2]} ${CARD.tab[1] + 18} V ${CARD.tab[3] + 20} Z`} fill={`url(#${p}-tab)`} />
          <rect x={CARD.tab[0] + 16} y={CARD.tab[1] + 6} width={CARD.tab[2] - CARD.tab[0] - 32} height={5} rx={2.5} fill="#FFFFFF" opacity={0.45} />
        </g>
      ) : null}
      {/* card thickness, face, sheen */}
      <rect x={CARD.x0 + 4} y={CARD.y0 + 12} width={CARD.w} height={CARD.h} rx={CARD.r} fill={`url(#${p}-edge)`} />
      <rect x={CARD.x0} y={CARD.y0} width={CARD.w} height={CARD.h} rx={CARD.r} fill={`url(#${p}-paper)`} />
      <rect x={CARD.x0} y={CARD.y0} width={CARD.w} height={CARD.h} rx={CARD.r} fill="none" stroke="#A39B90" strokeWidth={3} strokeOpacity={0.7} />
      <path
        d={Array.from({length: 13}, (_, i) => `M ${CARD.x0 + 26} ${392 + i * 46} H ${CARD.x1 - 26}`).join(' ')}
        stroke={PAL.paperRule}
        strokeOpacity={variant === 'blank' ? 0.75 : 0.32}
        strokeWidth={2.4}
      />
      <path d={`M ${CARD.x0 + 26} 346 H ${CARD.x1 - 26}`} stroke={PAL.paperRule} strokeWidth={4} strokeOpacity={0.9} />
      <rect x={CARD.x0} y={CARD.y0} width={CARD.w} height={CARD.h} rx={CARD.r} fill={`url(#${p}-sheen)`} />
      <rect x={CARD.x0 + 1.5} y={CARD.y0 + 1.5} width={CARD.w - 3} height={CARD.h - 3} rx={CARD.r - 1} fill="none" stroke="#FFFFFF" strokeOpacity={0.7} strokeWidth={3} />
      {variant !== 'blank' ? (
        <>
          {/* left fields */}
          {fieldGlow(L.name.bars[0], fl('name'), 'gn')}
          {fieldGlow(L.size.bars[0], fl('size'), 'gs')}
          {fieldGlow([L.dates.bars[0][0], L.dates.bars[0][1], L.dates.bars[1][2], L.dates.bars[1][3]], fl('dates'), 'gd')}
          {[L.name.bars[0], L.size.bars[0], ...L.dates.bars].map((b, i) => (
            <g key={i}>
              {R(b, 14, `url(#${p}-bar)`)}
              <rect x={b[0]} y={b[1]} width={b[2] - b[0]} height={b[3] - b[1]} rx={14} fill="none" stroke="#B9B2A8" strokeWidth={2.5} />
            </g>
          ))}
          <path d={`M 236 712 H 248 V 888 H 236`} fill="none" stroke={rgba(ink, 0.35)} strokeWidth={4} strokeLinejoin="round" />
          <g fontFamily={SANS} fontWeight={600} fontSize={36} fill={rgba(ink, 0.62)} textAnchor="end">
            <text x={268} y={466}>
              name
            </text>
            <text x={240} y={620}>
              size
            </text>
            <text x={226} y={812}>
              dates
            </text>
          </g>
          {named ? (
            <text x={300} y={470} fontFamily={MONO} fontWeight={500} fontSize={45} fill={ink} letterSpacing={-0.5}>
              passport.jpg
            </text>
          ) : null}
          {/* directions: the socket housing */}
          {fieldGlow(L.directions.housing, fl('directions'), 'gr')}
          {R(L.directions.housing, 30, '#E9E5DF', {stroke: '#CCC5BB', strokeWidth: 3})}
          <text x={L.directions.label[0]} y={L.directions.label[1]} fontFamily={SANS} fontWeight={600} fontSize={36} fill={rgba(ink, 0.62)}>
            directions
          </text>
          {variant === 'tiny' ? (
            // a tiny file lives entirely on its card: grey Bits in the housing instead of sockets
            <g>
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const bx = 760 + (i % 3) * 120;
                const by = 520 + Math.floor(i / 3) * 150;
                return (
                  <g key={i}>
                    <rect x={bx} y={by} width={92} height={92} rx={16} fill={PAL.oldBit} />
                    <rect x={bx + 26} y={by + 26} width={40} height={40} rx={8} fill="#B7BEC9" />
                  </g>
                );
              })}
            </g>
          ) : (
            CARD.sockets.map((s, i) => {
              const ins = CARD.inserts[i];
              const pl = CARD.plug[i];
              const lit = plugs * (1 - reuse);
              return (
                <g key={i}>
                  {R(s, 18, `url(#${p}-sock)`)}
                  <rect x={s[0] + 2} y={s[1] + 2} width={s[2] - s[0] - 4} height={4} rx={2} fill="#7C8BA3" opacity={0.6} />
                  {R(ins, 8, `url(#${p}-silver)`)}
                  <rect x={ins[0] + 6} y={ins[1] + 4} width={ins[2] - ins[0] - 12} height={3} rx={1.5} fill="#FFFFFF" opacity={0.7} />
                  <path d={`M 996 ${pl[1] - 22} v 44 M 1012 ${pl[1] - 22} v 44 M 1028 ${pl[1] - 22} v 44`} stroke="#0C121C" strokeWidth={8} strokeLinecap="round" />
                  <circle cx={pl[0] - 22} cy={pl[1]} r={20} fill="#0D141F" stroke="#8C96A8" strokeWidth={4} />
                  {lit > 0 ? (
                    <>
                      <circle cx={pl[0] - 22} cy={pl[1]} r={34} fill={PAL.photo} opacity={0.22 * lit} />
                      <circle cx={pl[0] - 22} cy={pl[1]} r={11} fill={PAL.photo} opacity={lit} />
                      <circle cx={pl[0] - 22} cy={pl[1]} r={5} fill={PAL.photoPale} opacity={lit} />
                    </>
                  ) : null}
                </g>
              );
            })
          )}
          {/* struck: an 8 px (on screen) coral scratch across the name, drawn over 10 f, a second pass after */}
          {strike > 0 ? (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={SCRATCH} stroke={PAL.lossDeep} strokeWidth={8 / k + 6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - strike} opacity={0.45} transform="translate(4 6)" />
              <path d={SCRATCH} stroke={PAL.loss} strokeWidth={8 / k} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - strike} />
              <path d={SCRATCH2} stroke={PAL.loss} strokeWidth={5 / k} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - strike2} opacity={0.85} />
            </g>
          ) : null}
          {/* reused: a grey scribble over the name, nothing readable */}
          {reuse > 0 ? (
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <rect x={L.name.bars[0][0] + 4} y={L.name.bars[0][1] + 4} width={(L.name.bars[0][2] - L.name.bars[0][0] - 8) * reuse} height={L.name.bars[0][3] - L.name.bars[0][1] - 8} rx={10} fill="#C9C4BC" opacity={0.92} />
              <path d={SCRIBBLE} stroke="#6E7480" strokeWidth={9} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reuse} />
              <path d={SCRIBBLE} stroke="#8A909B" strokeWidth={6} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - reuse} transform="translate(10 -14)" />
            </g>
          ) : null}
        </>
      ) : null}
    </g>
  );
};

/** The 3 plug points (where the threads leave the card) for a card at centre (x, y), width w, rotation rot (deg). */
export const cardPlugs = (x: number, y: number, w: number, rot = 0): Array<{x: number; y: number}> => {
  const k = cardK(w);
  const r = (rot * Math.PI) / 180;
  return CARD.plug.map(([px, py]) => {
    const dx = (px - CARD.cx) * k;
    const dy = (py - CARD.cy) * k;
    return {x: x + dx * Math.cos(r) - dy * Math.sin(r), y: y + dx * Math.sin(r) + dy * Math.cos(r)};
  });
};
/** A point of the card (native mft px) in the card's parent space. */
export const cardPoint = (x: number, y: number, w: number, nx: number, ny: number, rot = 0): {x: number; y: number} => {
  const k = cardK(w);
  const r = (rot * Math.PI) / 180;
  const dx = (nx - CARD.cx) * k;
  const dy = (ny - CARD.cy) * k;
  return {x: x + dx * Math.cos(r) - dy * Math.sin(r), y: y + dx * Math.sin(r) + dy * Math.cos(r)};
};

export type IndexCardProps = {
  frame: number;
  /** centre and width (px of the parent: world or hud) */
  x: number;
  y: number;
  w: number;
  variant?: CardVariant;
  rot?: number;
  /** 'active' | 'struck' | 'free' | 'reused' as a static state (events below animate instead) */
  state?: 'active' | 'struck' | 'free' | 'reused';
  strikeAt?: number;
  flagAt?: number;
  reuseAt?: number;
  fields?: CardTimes['fields'];
  /** plug lights on (threads attached) */
  plugs?: boolean;
  /** 2 px float (default on) */
  float?: boolean;
  shadow?: number;
  opacity?: number;
};

/** A standalone index card (same renderer as the Archive's card). Sits in its parent's px (world or hud). */
export const IndexCard: React.FC<IndexCardProps> = ({frame: f, x, y, w, variant = 'photo', rot = 0, state = 'active', strikeAt, flagAt, reuseAt, fields, plugs = false, float = true, shadow = 1, opacity = 1}) => {
  useFontsReady();
  const p = safeId(useId());
  const st = state;
  const t: CardTimes = {
    strike: strikeAt ?? (st === 'struck' || st === 'free' ? -NEVER : undefined),
    flag: flagAt ?? (st === 'free' ? -NEVER : undefined),
    reuse: reuseAt ?? (st === 'reused' ? -NEVER : undefined),
    fields,
    plugs: plugs ? -NEVER : NEVER,
  };
  const h = cardH(w);
  const fy = float ? 2 * Math.sin((f / 75) * Math.PI) : 0;
  const pad = Math.max(w, h) * 0.6;
  return (
    <svg
      width={w + pad * 2}
      height={h + pad * 2}
      viewBox={`${x - w / 2 - pad} ${y - h / 2 - pad} ${w + pad * 2} ${h + pad * 2}`}
      style={{position: 'absolute', left: x - w / 2 - pad, top: y - h / 2 - pad, overflow: 'visible', pointerEvents: 'none'}}
    >
      <defs>
        <CardDefs p={p} />
      </defs>
      <CardFace f={f} p={p} x={x} y={y + fy} w={w} rot={rot} variant={variant} t={t} shadow={shadow} opacity={opacity} />
    </svg>
  );
};

/** the 0..1 visibility of a card element with an enter frame, for callers composing their own cards */
export const cardEnter = (f: number, at: number, dur = 12): number => clamp01(lerp(0, 1, prog(f, at, dur, EASE.out)));
