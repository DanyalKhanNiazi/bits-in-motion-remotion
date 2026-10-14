/**
 * State pills v2 (STYLE_BIBLE §10.6): a capsule, 40 px Sora 600, `deck` fill, 2 px `structure` border, docked 8 px
 * outside the part's top-right corner (or inside its body, or at a screen point); a value change is a 4-frame flip.
 * The capsule is its own opaque plate (no knockout needed).
 */
import React from 'react';
import {COLOR, LABEL2, TYPE} from '../tokens';
import {SANS} from '../../shared/fonts';
import {prog} from '../core/ease';
import {f2} from '../core/math';
import {isPt, type Pt, type SRect, type ViewScope} from '../core/types';
import {project, screenRect, type Cam, type Shot} from '../camera/camera';
import {partById} from '../world/states';
import type {AnyWorld} from '../world/types';
import {hold, sentenceOfWord, w, type WordId} from '../timeline/words';
import {byAt} from '../timeline/track';
import {textWidth} from './metrics';
import {RevealText} from './reveal';

export interface PillSpec {
  id: string;
  part: string;
  /** 'top-right' / 'inside' the part; {screen} = a fixed screen point; {world} = the box's top-left at a projected world
   *  point (rides with the camera, e.g. inside the PSU body right of its fan). */
  dock: 'top-right' | 'inside' | {screen: Pt} | {world: Pt};
  text: string;
  word: WordId;
  exitAt: number | 'hold';
  flips?: Array<{at: number; text: string}>;
  scope?: ViewScope;
  /** Override the landing frame (default w(word)). */
  land?: number;
}

export const PILL_H = Math.round(TYPE.pill * TYPE.lineHeight) + 2 * LABEL2.pillPadY;
export const pillLand = (p: PillSpec): number => p.land ?? w(p.word);
export const pillExit = (p: PillSpec): number => (typeof p.exitAt === 'number' ? p.exitAt : hold(pillLand(p), p.text, sentenceOfWord(p.word)));

const textAt = (frame: number, p: PillSpec): {text: string; prev: string | null; since: number} => {
  let text = p.text;
  let prev: string | null = null;
  let since = pillLand(p);
  for (const f of byAt(p.flips ?? [])) {
    if (f.at > frame) break;
    prev = text;
    text = f.text;
    since = f.at;
  }
  return {text, prev, since};
};

/** The pill's screen box at a frame (null when not on screen). */
export const pillBox = (frame: number, p: PillSpec, cam: Cam, world: AnyWorld, refShot?: Shot): SRect | null => {
  const land = pillLand(p);
  const exit = pillExit(p);
  if (frame < land || frame >= exit + LABEL2.exitFrames) return null;
  const {text} = textAt(frame, p);
  const wPx = textWidth(text, TYPE.pill, 600) + 2 * LABEL2.pillPadX + 2 * LABEL2.pillBorder;
  const h = PILL_H;
  if (typeof p.dock === 'object' && 'screen' in p.dock && isPt(p.dock.screen)) return {x: p.dock.screen[0], y: p.dock.screen[1], w: wPx, h, r: h / 2};
  if (typeof p.dock === 'object' && 'world' in p.dock && isPt(p.dock.world)) {
    const s = project(cam, p.dock.world);
    return {x: s[0], y: s[1], w: wPx, h, r: h / 2};
  }
  const part = partById(world, p.part);
  if (!part) return null;
  const r = screenRect(cam, part.rect, part.depth ?? 1, refShot);
  if (p.dock === 'inside') return {x: r.x + r.w - LABEL2.pillDock - wPx, y: r.y + LABEL2.pillDock, w: wPx, h, r: h / 2};
  return {x: r.x + r.w + LABEL2.pillDock, y: r.y - LABEL2.pillDock - h, w: wPx, h, r: h / 2};
};

export const Pill2: React.FC<{spec: PillSpec; frame: number; cam: Cam; world: AnyWorld; refShot?: Shot}> = ({spec, frame, cam, world, refShot}) => {
  const box = pillBox(frame, spec, cam, world, refShot);
  if (!box) return null;
  const land = pillLand(spec);
  const exit = pillExit(spec);
  const inT = prog(frame, land, 5, 'roll');
  const outT = prog(frame, exit, LABEL2.exitFrames, 'exit');
  // enters with a mask from the left; exits with a fade (a closing mask left clipped half-words, round 1)
  const reveal = inT;
  const {text, prev, since} = textAt(frame, spec);
  const flipping = prev !== null && frame - since < 4;
  const oldOut = flipping ? prog(frame, since, 2, 'exit') : 1;
  const newIn = flipping ? prog(frame, since + 1, 3, 'roll') : 1;
  const st: React.CSSProperties = {
    position: 'absolute',
    left: LABEL2.pillPadX,
    top: LABEL2.pillPadY - 1,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: TYPE.pill,
    lineHeight: TYPE.lineHeight,
    color: COLOR.ink,
    whiteSpace: 'pre',
  };
  // round 2: the capsule wipes in; its text enters word by word (no mask crosses a word)
  return (
    <div style={{position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, opacity: reveal > 0 ? 1 - outT : 0}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: box.w,
          height: box.h,
          boxSizing: 'border-box',
          borderRadius: box.h / 2,
          background: COLOR.deck,
          border: `${LABEL2.pillBorder}px solid ${COLOR.structure}`,
          clipPath: reveal < 1 ? `inset(0 ${f2((1 - reveal) * 100)}% 0 0 round ${box.h / 2}px)` : undefined,
        }}
      />
      <div style={{position: 'absolute', left: 0, top: 0, width: box.w, height: box.h, overflow: 'hidden', borderRadius: box.h / 2}}>
        {flipping && prev !== null && oldOut < 1 ? <div style={{...st, opacity: 1 - oldOut, top: (st.top as number) - 10 * oldOut}}>{prev}</div> : null}
        <div style={{...st, opacity: newIn, top: (st.top as number) + 10 * (1 - newIn)}}>
          {flipping ? text : <RevealText text={text} age={frame - land - 1} />}
        </div>
      </div>
    </div>
  );
};
