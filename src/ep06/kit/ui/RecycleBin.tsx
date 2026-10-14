/**
 * Ep06 UI kit: <RecycleBin>, the recycle-folder_a render with the passport composited into its card window.
 *
 *   <RecycleBin frame={f} x={1380} y={600} w={520} holdsPhoto={a} emptyHoverAt={b} flushAt={c} screen />
 *
 * holdsPhoto: the photo drops into the card; restoreAt: it lifts out (pair with ExplorerWindow 'restore');
 * emptyHoverAt: a generic "Empty Recycle Bin" menu with the cursor hovering it; flushAt: the photo sinks into the
 * folder and is gone (the card is blank again). The menu text is a chip (≥ 40 px on screen; pass `screen`).
 */
import React, {useContext} from 'react';
import {EASE, PAL, SANS, SPRING} from '../look';
import {Prop, propPoint, propScale, type PropProps} from '../Prop';
import {type AssetName} from '../assets';
import {CameraContext, screenScale} from '../camera';
import {useTextCheck} from '../text';
import {clamp01, prog, rgba, springAt, type Quad} from '../util';
import {UI_REGIONS} from './regions';
import {Crop, Cursor, PASS_PHOTO_BOX, WIN} from './shared';

export type RecycleBinProps = Omit<PropProps, 'src' | 'children'> & {
  /** override the render (must keep recycle-folder_a's framing, or pass windowQuad) */
  imageSrc?: AssetName;
  windowQuad?: Quad;
  /** frame the photo lands in the bin (omit = never; 0 or less = already there) */
  holdsPhoto?: number;
  flushAt?: number;
  restoreAt?: number;
  emptyHoverAt?: number;
  emptyUntil?: number;
  menuText?: string;
  /** menu text size in on-screen px with `screen` (default 44) */
  menuSize?: number;
  screen?: boolean | number;
};

const SRC: AssetName = 'recycle-folder_a';
const CLIP_ABOVE_FRONT = 'polygon(0px 0px, 1254px 0px, 1254px 740px, 890px 700px, 720px 660px, 612px 636px, 585px 682px, 497px 657px, 460px 596px, 280px 550px, 110px 518px, 0px 518px)';

/** The card window's centre (parent px) and the Explorer `flyTo` that lands a thumbnail of height `thumbH` on it. */
export const binFlyTo = (p: {x: number; y: number; w?: number; h?: number; imageSrc?: AssetName}, thumbH = 62): {x: number; y: number; s: number} => {
  const q = UI_REGIONS.binWindow;
  const src = p.imageSrc ?? SRC;
  const c = propPoint(src, p, (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4);
  const side = 265 * propScale(src, p);
  return {x: c.x, y: c.y, s: (side * 0.95) / thumbH};
};
/** Named points of a placed bin (parent px): window, mouth (folder opening), menu (where the menu attaches). */
export const recycleBinPoint = (p: {x: number; y: number; w?: number; h?: number; imageSrc?: AssetName}, which: 'window' | 'mouth' | 'menu'): {x: number; y: number} => {
  const src = p.imageSrc ?? SRC;
  if (which === 'window') return binFlyTo(p);
  if (which === 'mouth') return propPoint(src, p, 640, 520);
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
  menuSize = 44,
  screen,
  ...pp
}) => {
  const f = pp.frame;
  const inv = screenScale(screen, useContext(CameraContext));
  useTextCheck('chip', menuSize, screen, menuText);
  // photo state
  const has = holdsPhoto !== undefined && f >= holdsPhoto;
  const flushing = has && flushAt !== undefined && flushAt >= (holdsPhoto ?? 0) && f >= flushAt;
  const restoring = has && restoreAt !== undefined && restoreAt >= (holdsPhoto ?? 0) && f >= restoreAt && !(flushing && (flushAt ?? 0) > (restoreAt ?? 0));
  const tIn = has ? f - (holdsPhoto ?? 0) : -1;
  const land = has ? prog(tIn, 0, 8, EASE.out) : 0;
  const bump = has && tIn >= 0 && tIn < 22 ? -10 * Math.exp(-tIn / 5) * Math.sin(tIn * 0.9) : 0;
  const flushU = flushing ? prog(f, flushAt ?? 0, 12, EASE.inCubic) : 0;
  const restU = restoring ? prog(f, restoreAt ?? 0, 10, EASE.inCubic) : 0;
  // card axis (down = TL→BL) in native px
  const q = windowQuad;
  const dx = q[3][0] - q[0][0];
  const dy = q[3][1] - q[0][1];
  const dl = Math.hypot(dx, dy);
  const ux = dx / dl;
  const uy = dy / dl;
  const slide = (1 - land) * -70 + flushU * 330 - restU * 150;
  const op = land * (1 - (flushing ? prog(f, (flushAt ?? 0) + 4, 8) : 0)) * (1 - restU);
  const flash = has && tIn >= 0 && tIn < 12 ? Math.exp(-tIn / 3) : 0;
  const shifted = q.map(([x, y]) => [x + ux * slide, y + uy * slide] as const) as unknown as Quad;
  const menuOn = emptyHoverAt !== undefined && f >= emptyHoverAt - 2;
  const menuEnd = emptyUntil ?? (flushAt !== undefined && flushAt > (emptyHoverAt ?? 0) ? flushAt + 4 : undefined);
  const menuV = menuOn ? springAt(f, emptyHoverAt ?? 0, SPRING.snap) * (menuEnd === undefined ? 1 : 1 - prog(f, menuEnd, 6)) : 0;
  const mp = menuOn ? recycleBinPoint({...pp, imageSrc}, 'menu') : {x: 0, y: 0};
  const ms = menuSize * inv;
  const hover = menuOn ? prog(f, (emptyHoverAt ?? 0) + 10, 5) : 0;
  return (
    <>
      <Prop {...pp} src={imageSrc} nudge={{...(pp.nudge ?? {}), dy: (pp.nudge?.dy ?? 0) + bump}}>
        {op > 0.002 ? (
          <div style={{position: 'absolute', left: 0, top: 0, width: 1254, height: 1254, clipPath: CLIP_ABOVE_FRONT}}>
            <Crop src="fictional-passport_b" box={PASS_PHOTO_BOX} w={435} h={448} quad={shifted} style={{opacity: op, filter: `brightness(${0.94 + 0.5 * flash}) contrast(1.04)`}}>
              <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0) 40%, rgba(10,16,30,0.22))'}} />
            </Crop>
          </div>
        ) : null}
        {flash > 0.02 ? (
          <svg width={1254} height={1254} style={{position: 'absolute', left: 0, top: 0}}>
            <polygon points={q.map((p) => p.join(',')).join(' ')} fill={rgba('#FFFFFF', 0.45 * flash)} />
          </svg>
        ) : null}
      </Prop>
      {menuV > 0.01 ? (
        <div style={{position: 'absolute', left: mp.x, top: mp.y, width: 0, height: 0, opacity: clamp01(menuV * 2), transform: `scale(${0.9 + 0.1 * Math.min(1.05, menuV)})`, transformOrigin: '0 0'}}>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              padding: `${ms * 0.32}px ${ms * 0.4}px`,
              borderRadius: ms * 0.28,
              background: WIN.body,
              border: `${Math.max(1.5, ms * 0.04)}px solid ${WIN.lineHi}`,
              boxShadow: `0 ${ms * 0.4}px ${ms * 1.1}px rgba(0,0,0,0.55)`,
              whiteSpace: 'nowrap',
            }}
          >
            <div
              style={{
                padding: `${ms * 0.2}px ${ms * 0.45}px`,
                borderRadius: ms * 0.18,
                background: rgba(WIN.select, 0.26 * hover),
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: ms,
                lineHeight: 1.1,
                color: PAL.ink,
              }}
            >
              {menuText}
            </div>
          </div>
          <Cursor
            frame={f}
            size={ms * 0.8}
            keys={[
              {f: (emptyHoverAt ?? 0) - 2, x: ms * 9, y: ms * 3.2},
              {f: (emptyHoverAt ?? 0) + 10, x: ms * 8.6, y: ms * 1.25},
              {f: (flushAt ?? (emptyHoverAt ?? 0) + 60) - 2, x: ms * 8.5, y: ms * 1.2, click: flushAt !== undefined},
            ]}
          />
        </div>
      ) : null}
    </>
  );
};
