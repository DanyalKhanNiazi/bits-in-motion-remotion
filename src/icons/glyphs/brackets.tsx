/**
 * Brackets (ICONS.md §5.7): four corner serifs (4 px, 14 px long) around `box` + 8 px, snapping in from 24 px outside
 * over 5 frames with the `snap` ease (4.1 % overshoot, the only overshoot in the style) and completing on `lockAt`.
 * Emphasis magenta; `ink` over true-colour visuals (bible §4.5). Fades over 6 frames from `fadeAt`. SCREEN px.
 */
import React from 'react';
import {COLOR, GLYPH2} from '../../engine/tokens';
import {clamp01, ease, fx, prog, type Rect} from '../primitives';

export interface BracketsProps {
  box: Rect;
  frame: number;
  lockAt: number;
  fadeAt?: number;
  /** Over true-colour visuals the brackets turn ink (bible §4.5). */
  ink?: boolean;
}
export const Brackets: React.FC<BracketsProps> = ({box, frame, lockAt, fadeAt, ink}) => {
  const {stroke, serif, pad, from, snapFrames, fadeFrames} = GLYPH2.brackets;
  const start = lockAt - snapFrames;
  if (frame < start) return null;
  const t = clamp01((frame - start) / snapFrames);
  const e = ease('snap')(t);
  const off = from * (1 - e);
  const fade = fadeAt === undefined ? 0 : prog(frame, fadeAt, fadeFrames, 'exit');
  const o = clamp01(t * 2.5) * (1 - fade);
  if (o <= 0) return null;
  const x0 = box.x - pad - off;
  const y0 = box.y - pad - off;
  const x1 = box.x + box.w + pad + off;
  const y1 = box.y + box.h + pad + off;
  const d =
    `M${fx(x0)} ${fx(y0 + serif)}V${fx(y0)}H${fx(x0 + serif)}` +
    `M${fx(x1 - serif)} ${fx(y0)}H${fx(x1)}V${fx(y0 + serif)}` +
    `M${fx(x1)} ${fx(y1 - serif)}V${fx(y1)}H${fx(x1 - serif)}` +
    `M${fx(x0 + serif)} ${fx(y1)}H${fx(x0)}V${fx(y1 - serif)}`;
  return <path d={d} fill="none" stroke={ink ? COLOR.ink : COLOR.emphasis} strokeWidth={stroke} strokeLinecap="square" strokeLinejoin="miter" opacity={o < 1 ? o : undefined} />;
};
