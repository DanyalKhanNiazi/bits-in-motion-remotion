/**
 * Ep06 UI kit: <RecycleBin>, the recycle-folder_a render. The render's baked photo card is cut out and redrawn as its
 * own layer, so the bin can be truly EMPTY (a reconstructed lid face and dark interior show through), and the card can
 * drop in, drop out and away (flush), or lift out (restore). The passport is composited into the card's window.
 *
 *   <RecycleBin frame={f} x={1380} y={600} w={520} holdsPhoto={a} emptyHoverAt={b} flushAt={c} screen />
 *   <RecycleBin … menuSide="left" />          // the "Empty Recycle Bin" menu opens to the left of the bin
 *
 * holdsPhoto: the card + photo drops into the bin (omit = the bin stays empty; ≤ 0 = already there);
 * flushAt: the card drops out through the bin and is gone; restoreAt: it lifts out (pair with ExplorerWindow 'restore');
 * emptyHoverAt: a generic "Empty Recycle Bin" menu with the cursor hovering it (a chip: ≥ 40 px on screen, pass `screen`).
 * The bin owns its motion (enter, exit, float, tilt are applied to the whole assembly so the cut-out stays registered).
 */
import React, {useContext} from 'react';
import {EASE, PAL, SANS, SPRING} from '../look';
import {Prop, enterXf, exitXf, propPoint, propScale, type PropProps} from '../Prop';
import {assetBox, assetUrl, type AssetName} from '../assets';
import {CameraContext, screenScale} from '../camera';
import {useTextCheck} from '../text';
import {TAU, clamp01, num, prog, rgba, rnd, safeId, springAt, useImageReady, type Quad} from '../util';
import {UI_REGIONS} from './regions';
import {Crop, Cursor, PASS_PHOTO_BOX, WIN} from './shared';

export type RecycleBinProps = Omit<PropProps, 'src' | 'children'> & {
  /** override the render (must keep recycle-folder_a's framing, or pass windowQuad) */
  imageSrc?: AssetName;
  windowQuad?: Quad;
  /** frame the card + photo lands in the bin (omit = never; 0 or less = already there) */
  holdsPhoto?: number;
  flushAt?: number;
  restoreAt?: number;
  emptyHoverAt?: number;
  emptyUntil?: number;
  menuText?: string;
  /** which side of the bin the menu opens on (default right) */
  menuSide?: 'left' | 'right';
  /** menu text size in on-screen px with `screen` (default 44) */
  menuSize?: number;
  screen?: boolean | number;
};

const SRC: AssetName = 'recycle-folder_a';
type P2 = readonly [number, number];
const pts = (a: readonly P2[]) => a.map((p) => `${p[0]}px ${p[1]}px`).join(', ');
/** above the folder's front-wall edge (native px) */
const FRONT: readonly P2[] = [[0, 0], [1254, 0], [1254, 740], [890, 700], [720, 660], [612, 636], [585, 682], [497, 657], [460, 596], [280, 550], [110, 518], [0, 518]];
/** the baked card's visible silhouette (card quad ∩ above the front wall) */
const CARD_VIS: readonly P2[] = [[300, 308], [605, 232], [705, 594], [497, 657], [460, 596], [371, 572]];
/** the hole cut from the base (same, padded 3–4 px) */
const HOLE: readonly P2[] = [[296, 304], [608, 228], [710, 597], [497, 654], [460, 593], [368, 569]];
/** the card's hidden lower-left corner (behind the front wall), redrawn as plain paper */
const CARD_HIDDEN: readonly P2[] = [[369, 566], [462, 590], [499, 652], [401, 679]];
/** reconstruction behind the card: back-left corner P, the lid face and the interior */
const P: P2 = [476, 387];
const LID: readonly P2[] = [[405, 195], [770, 195], [770, 480], [690, 455], P];
const INSIDE: readonly P2[] = [P, [770, 480], [770, 730], [230, 730], [230, 510]];

/** The card window's centre (parent px) and the Explorer `flyTo` that lands a thumbnail of height `thumbH` on it. */
export const binFlyTo = (p: {x: number; y: number; w?: number; h?: number; imageSrc?: AssetName}, thumbH = 62): {x: number; y: number; s: number} => {
  const q = UI_REGIONS.binWindow;
  const src = p.imageSrc ?? SRC;
  const c = propPoint(src, p, (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4);
  const side = 265 * propScale(src, p);
  return {x: c.x, y: c.y, s: (side * 0.95) / thumbH};
};
/** Named points of a placed bin (parent px): window, mouth (folder opening), menu (right or left attach point). */
export const recycleBinPoint = (p: {x: number; y: number; w?: number; h?: number; imageSrc?: AssetName}, which: 'window' | 'mouth' | 'menu' | 'menuLeft'): {x: number; y: number} => {
  const src = p.imageSrc ?? SRC;
  if (which === 'window') return binFlyTo(p);
  if (which === 'mouth') return propPoint(src, p, 640, 520);
  if (which === 'menuLeft') return propPoint(src, p, 90, 640);
  return propPoint(src, p, 1120, 640);
};

export const RecycleBin: React.FC<RecycleBinProps> = ({
  imageSrc = SRC,
  windowQuad = UI_REGIONS.binWindow,
  holdsPhoto,
  flushAt,
  restoreAt,
  emptyHoverAt,
  emptyUntil,
  menuText = 'Empty Recycle Bin',
  menuSide = 'right',
  menuSize = 44,
  screen,
  ...pp
}) => {
  const f = pp.frame;
  const uid = safeId(React.useId());
  const inv = screenScale(screen, useContext(CameraContext));
  useTextCheck('chip', menuSize, screen, menuText);
  const url = assetUrl(imageSrc);
  useImageReady(url);
  const b = assetBox(imageSrc);
  const k = propScale(imageSrc, pp);
  const {float = 0, seed = imageSrc, enter, exit, nudge} = pp;
  const ph = rnd(`float-${seed}`);
  // the assembly's motion (same maths as <Prop>, applied to base + card together)
  const xfAt = (fr: number) => {
    const e = enterXf(fr, enter);
    const x = exitXf(fr, exit);
    const fl = float ? float * Math.sin(TAU * (fr / 150 + ph)) : 0;
    return {
      dx: e.dx + x.dx + (nudge?.dx ?? 0),
      dy: e.dy + x.dy + fl + (nudge?.dy ?? 0),
      s: e.s * x.s * num(pp.scale, fr, 1) * (nudge?.s ?? 1),
      sx: e.sx * x.sx,
      sy: e.sy * x.sy,
      rot: e.rot + x.rot + num(pp.rot, fr, 0) + (float ? (float / 12) * 0.5 * Math.sin(TAU * (fr / 230 + ph)) : 0),
      op: e.op * x.op * num(pp.opacity, fr, 1) * (nudge?.op ?? 1),
    };
  };
  const xf = xfAt(f);
  const pv = xfAt(f - 1);
  // card state
  const has = holdsPhoto !== undefined && f >= holdsPhoto;
  const tIn = has ? f - (holdsPhoto ?? 0) : -1;
  const flushing = has && flushAt !== undefined && flushAt >= (holdsPhoto ?? 0) && f >= flushAt;
  const restoring = has && restoreAt !== undefined && restoreAt >= (holdsPhoto ?? 0) && f >= restoreAt && !(flushing && (flushAt ?? 0) > (restoreAt ?? 0));
  const flushU = flushing ? prog(f, flushAt ?? 0, 14, EASE.inCubic) : 0;
  const restU = restoring ? prog(f, restoreAt ?? 0, 12, EASE.inCubic) : 0;
  const cardOn = has && flushU < 1 && restU < 1;
  const land = has ? prog(tIn, 0, 9, EASE.out) : 0;
  const bump = has && tIn >= 0 && tIn < 22 ? 6 * Math.exp(-tIn / 5) * Math.sin(tIn * 0.9) : 0;
  const flash = has && tIn >= 0 && tIn < 12 ? Math.exp(-tIn / 3) : 0;
  const q = windowQuad;
  const ax = q[3][0] - q[0][0];
  const ay = q[3][1] - q[0][1];
  const al = Math.hypot(ax, ay);
  const slide = (1 - land) * -150 + flushU * 620 - restU * 220;
  const cardRot = flushU * 7 - restU * 4;
  const cardOp = clamp01(land * 1.6) * (1 - restU);
  const gulp = flushing && f < (flushAt ?? 0) + 20 ? Math.sin(Math.PI * clamp01((f - (flushAt ?? 0)) / 20)) : 0;
  // menu
  const menuOn = emptyHoverAt !== undefined && f >= emptyHoverAt - 2;
  const menuEnd = emptyUntil ?? (flushAt !== undefined && flushAt > (emptyHoverAt ?? 0) ? flushAt + 4 : undefined);
  const menuV = menuOn ? springAt(f, emptyHoverAt ?? 0, SPRING.snap) * (menuEnd === undefined ? 1 : 1 - prog(f, menuEnd, 6)) : 0;
  const left = menuSide === 'left';
  const mp = menuOn ? recycleBinPoint({...pp, imageSrc}, left ? 'menuLeft' : 'menu') : {x: 0, y: 0};
  const ms = menuSize * inv;
  const hover = menuOn ? prog(f, (emptyHoverAt ?? 0) + 10, 5) : 0;
  const O = 6000;
  const toLocal = (p: P2) => `${((p[0] - b.cx) * k + O).toFixed(1)} ${((p[1] - b.cy) * k + O).toFixed(1)}`;
  const holePath = `M0 0 H${2 * O} V${2 * O} H0 Z M${HOLE.map(toLocal).join(' L')} Z`;
  const tiltX = num(pp.tiltX, f, 0);
  const tiltY = num(pp.tiltY, f, 0);
  const native = (children: React.ReactNode, style?: React.CSSProperties) => (
    <div style={{position: 'absolute', left: -b.cx * k, top: -b.cy * k, width: b.w, height: b.h, transform: `scale(${k})`, transformOrigin: '0 0', ...style}}>{children}</div>
  );
  return (
    <>
      <div style={{position: 'absolute', left: pp.x, top: pp.y, width: 0, height: 0, opacity: xf.op}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate(${xf.dx}px, ${xf.dy + bump}px) rotate(${xf.rot}deg) scale(${xf.s * xf.sx}, ${xf.s * xf.sy})`,
            transformOrigin: `0px ${(b.y1 - b.cy) * k}px`,
          }}
        >
          <div style={{position: 'absolute', left: 0, top: 0, transform: tiltX || tiltY ? `perspective(${pp.perspective ?? 1800}px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` : undefined}}>
            {/* reconstruction behind the cut-out card: lid face + dark interior */}
            {native(
              <svg width={b.w} height={b.h} style={{position: 'absolute', left: 0, top: 0}}>
                <defs>
                  <linearGradient id={`${uid}-lid`} gradientUnits="userSpaceOnUse" x1={0} y1={200} x2={0} y2={445}>
                    <stop offset="0" stopColor="#22314C" />
                    <stop offset="0.55" stopColor="#14223A" />
                    <stop offset="1" stopColor="#081426" />
                  </linearGradient>
                  <linearGradient id={`${uid}-in`} gradientUnits="userSpaceOnUse" x1={0} y1={400} x2={0} y2={680}>
                    <stop offset="0" stopColor="#111B2B" />
                    <stop offset="0.4" stopColor="#060C17" />
                    <stop offset="1" stopColor="#03070E" />
                  </linearGradient>
                </defs>
                <polygon points={LID.map((p) => p.join(',')).join(' ')} fill={`url(#${uid}-lid)`} />
                <polygon points={INSIDE.map((p) => p.join(',')).join(' ')} fill={`url(#${uid}-in)`} />
                <line x1={405} y1={195} x2={P[0]} y2={P[1]} stroke="rgba(120,134,160,0.7)" strokeWidth={4} />
                <line x1={261} y1={495} x2={P[0]} y2={P[1]} stroke="rgba(196,204,218,0.9)" strokeWidth={4} />
                <line x1={P[0]} y1={P[1]} x2={700} y2={458} stroke="rgba(62,74,98,0.95)" strokeWidth={5} />
                {gulp > 0 ? <polygon points={INSIDE.map((p) => p.join(',')).join(' ')} fill={rgba('#000000', 0.35 * gulp)} /> : null}
              </svg>,
            )}
            {/* the render with the baked card cut out */}
            <div style={{position: 'absolute', left: -O, top: -O, width: 2 * O, height: 2 * O, clipPath: `path(evenodd, '${holePath}')`}}>
              <div style={{position: 'absolute', left: O, top: O, width: 0, height: 0}}>
                <Prop
                  frame={f}
                  src={imageSrc}
                  x={0}
                  y={0}
                  w={pp.w}
                  h={pp.h}
                  shadow={pp.shadow}
                  sweep={pp.sweep}
                  rim={pp.rim}
                  blur={pp.blur}
                  brightness={pp.brightness}
                  highlight={pp.highlight}
                  spotlight={pp.spotlight}
                  nudge={{blurX: xf.dx - pv.dx + (nudge?.blurX ?? 0), blurY: xf.dy - pv.dy + (nudge?.blurY ?? 0)}}
                />
              </div>
            </div>
            {/* the card (+ photo) as its own layer; it sinks behind the front wall */}
            {cardOn
              ? native(
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: b.w,
                      height: b.h,
                      opacity: cardOp,
                      transformOrigin: `${(q[0][0] + q[2][0]) / 2}px ${(q[0][1] + q[2][1]) / 2}px`,
                      transform: `translate(${(ax / al) * slide}px, ${(ay / al) * slide}px) rotate(${cardRot}deg)`,
                    }}
                  >
                    <svg width={b.w} height={b.h} style={{position: 'absolute', left: 0, top: 0}}>
                      <defs>
                        <linearGradient id={`${uid}-paper`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0" stopColor="#E7E4DF" />
                          <stop offset="1" stopColor="#D2CEC8" />
                        </linearGradient>
                      </defs>
                      <polygon points={CARD_HIDDEN.map((p) => p.join(',')).join(' ')} fill={`url(#${uid}-paper)`} />
                    </svg>
                    <div style={{position: 'absolute', left: 0, top: 0, width: b.w, height: b.h, backgroundImage: `url(${url})`, backgroundSize: `${b.w}px ${b.h}px`, clipPath: `polygon(${pts(CARD_VIS)})`}} />
                    <Crop src="fictional-passport_b" box={PASS_PHOTO_BOX} w={435} h={448} quad={q} style={{filter: `brightness(${0.94 + 0.5 * flash}) contrast(1.04)`}}>
                      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 40%, rgba(10,16,30,0.22))'}} />
                    </Crop>
                    {flash > 0.02 ? (
                      <svg width={b.w} height={b.h} style={{position: 'absolute', left: 0, top: 0}}>
                        <polygon points={q.map((p) => p.join(',')).join(' ')} fill={rgba('#FFFFFF', 0.45 * flash)} />
                      </svg>
                    ) : null}
                  </div>,
                  {clipPath: `polygon(${pts(FRONT)})`},
                )
              : null}
          </div>
        </div>
      </div>
      {menuV > 0.01 ? (
        <div style={{position: 'absolute', left: mp.x, top: mp.y, width: 0, height: 0, opacity: clamp01(menuV * 2), transform: `scale(${0.9 + 0.1 * Math.min(1.05, menuV)})`, transformOrigin: '0 0'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: left ? 'translateX(-100%)' : undefined,
              padding: `${ms * 0.32}px ${ms * 0.4}px`,
              borderRadius: ms * 0.28,
              background: WIN.body,
              border: `${Math.max(1.5, ms * 0.04)}px solid ${WIN.lineHi}`,
              boxShadow: `0 ${ms * 0.4}px ${ms * 1.1}px rgba(0,0,0,0.55)`,
              whiteSpace: 'nowrap',
            }}
          >
            <div style={{padding: `${ms * 0.2}px ${ms * 0.45}px`, borderRadius: ms * 0.18, background: rgba(WIN.select, 0.26 * hover), fontFamily: SANS, fontWeight: 600, fontSize: ms, lineHeight: 1.1, color: PAL.ink}}>
              {menuText}
            </div>
          </div>
          <Cursor
            frame={f}
            size={ms * 0.8}
            keys={[
              {f: (emptyHoverAt ?? 0) - 2, x: left ? -ms * 1.5 : ms * 9, y: ms * 3.2},
              {f: (emptyHoverAt ?? 0) + 10, x: left ? -ms * 1.6 : ms * 8.6, y: ms * 1.25},
              {f: (flushAt ?? (emptyHoverAt ?? 0) + 60) - 2, x: left ? -ms * 1.7 : ms * 8.5, y: ms * 1.2, click: flushAt !== undefined},
            ]}
          />
        </div>
      ) : null}
    </>
  );
};
