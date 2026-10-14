/**
 * The "later" window (ENGINE.md §10.4, STYLE_BIBLE §9.6): the frame contracts over 10 frames ('move') to x 48–1872,
 * y 48–932 (r 16) while the not-now double rule draws clockwise from the top-left over 8 frames; outside, only the
 * field shows (grid at 40%). Returning to now: the rule fades and the window expands back in 10 frames ('settle').
 */
import React from 'react';
import {COLOR, DUR, WINDOW} from '../tokens';
import {rectPath} from '../../shared/geom';
import {prog} from '../core/ease';
import {f2, lerp} from '../core/math';
import type {SRect} from '../core/types';

export interface WindowSpec {
  at: number;
  expandAt: number;
  /** Default at + 2. */
  ruleAt?: number;
}

const FULL: SRect = {x: 0, y: 0, w: 1920, h: 1080};
const RECT: SRect = {x: WINDOW.rect.x0, y: WINDOW.rect.y0, w: WINDOW.rect.x1 - WINDOW.rect.x0, h: WINDOW.rect.y1 - WINDOW.rect.y0};

/** t = 1 fully contracted (WINDOW.rect). */
export const windowAt = (frame: number, specs: ReadonlyArray<WindowSpec>): {t: number; rect: SRect; spec: WindowSpec | null} => {
  for (const s of specs) {
    if (frame < s.at || frame >= s.expandAt + DUR.windowExpand) continue;
    const t = frame < s.expandAt ? prog(frame, s.at, DUR.windowContract, 'move') : 1 - prog(frame, s.expandAt, DUR.windowExpand, 'settle');
    return {
      t,
      rect: {x: lerp(FULL.x, RECT.x, t), y: lerp(FULL.y, RECT.y, t), w: lerp(FULL.w, RECT.w, t), h: lerp(FULL.h, RECT.h, t), r: WINDOW.radius * t},
      spec: s,
    };
  }
  return {t: 0, rect: {...FULL, r: 0}, spec: null};
};

/** Clips the world views to the window (a CSS inset clip with rounded corners). */
export const TimeWindowClip: React.FC<{state: {t: number; rect: SRect}; children: React.ReactNode}> = ({state, children}) => {
  if (state.t <= 0) return <>{children}</>;
  const r = state.rect;
  const clip = `inset(${f2(r.y)}px ${f2(1920 - r.x - r.w)}px ${f2(1080 - r.y - r.h)}px ${f2(r.x)}px round ${f2(r.r ?? 0)}px)`;
  return <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: clip}}>{children}</div>;
};

/** The double rule, drawn clockwise from the top-left in DUR.plateFrameDraw frames; fades over 6 at expandAt. */
export const TimeWindowFrame: React.FC<{state: {t: number; rect: SRect; spec?: WindowSpec | null}; frame: number; drawAt: number}> = ({state, frame, drawAt}) => {
  if (state.t <= 0 || !state.spec) return null;
  const r = state.rect;
  const draw = prog(frame, drawAt, DUR.plateFrameDraw, 'arrive');
  const op = 1 - prog(frame, state.spec.expandAt, 6, 'exit');
  if (draw <= 0 || op <= 0) return null;
  const rad = r.r ?? WINDOW.radius;
  const outer = rectPath(r.x, r.y, r.w, r.h, rad);
  const i = WINDOW.inset;
  const inner = rectPath(r.x + i, r.y + i, r.w - 2 * i, r.h - 2 * i, Math.max(2, rad - i / 2));
  const per = 2 * (r.w + r.h);
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, opacity: op}}>
      <path d={outer} fill="none" stroke={COLOR.annotation} strokeWidth={WINDOW.outer} strokeDasharray={`${per * draw} ${per}`} />
      <path d={inner} fill="none" stroke={COLOR.annotation} strokeWidth={WINDOW.inner} strokeDasharray={`${per * draw} ${per}`} />
    </svg>
  );
};
