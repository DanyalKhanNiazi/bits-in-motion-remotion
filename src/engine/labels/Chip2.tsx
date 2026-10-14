/**
 * The time chip v2 (STYLE_BIBLE §10.5): one chip at (144, 96). A change is a fade with a short slide (round 4: the old
 * word fades out rising 10 px over 3 frames, the new one fades in rising into place over 4 frames from the old one's
 * last frame; no mask, so no glyph is ever cut, and never two readable words); the 2 px rule resizes to the new width
 * in 6 frames ('move'). "Later" chips carry a double underline. 52 px while the chip carries the meaning, then a
 * 6-frame step to 44 px.
 *
 * Round 3 (judges: the chip mixed time and scope, "Intel desktop" replaced "Soft-off", and three phrasings named the
 * press): the chip says TIME only, from a fixed vocabulary ("Soft-off", "After the press", "Now"); a scope ("Windows
 * desktop", "Intel desktop") is a smaller muted SECOND line under the rule that never replaces the time; and a step may
 * `dim` the chip (S08's plates show a later day, not this soft-off machine).
 */
import React from 'react';
import {COLOR, LABEL2, LAYOUT, TYPE} from '../tokens';
import {SANS} from '../../shared/fonts';
import {prog} from '../core/ease';
import {f2, lerp} from '../core/math';
import type {SRect} from '../core/types';
import {byAt} from '../timeline/track';
import {textWidth} from './metrics';
import {RevealText} from './reveal';

export interface ChipStep {
  at: number;
  text: string;
  size: 'active' | 'rest';
  underline: 'single' | 'double';
  /** Round 3: a muted scope line under the rule (TYPE.chipScope); '' or undefined = none. */
  scope?: string;
  /** Round 3: the chip steps down to CHIP_DIM opacity over 8 frames (a beat whose plates are not this time). */
  dim?: boolean;
}

/** Round 3: a dimmed chip's opacity. */
export const CHIP_DIM = 0.4;

const sizePx = (s: ChipStep['size']): number => (s === 'active' ? TYPE.chipActive : TYPE.chipRest);
/** +2% tracking, in em. */
const TRACK = parseFloat(TYPE.chipTracking) || 0.02;
const SCOPE_GAP = 10;
const scopeLineH = TYPE.chipScope * TYPE.lineHeight;

export const chipAt = (frame: number, steps: ReadonlyArray<ChipStep>): {current: ChipStep | null; prev: ChipStep | null; t: number} => {
  let current: ChipStep | null = null;
  let prev: ChipStep | null = null;
  for (const s of byAt(steps)) {
    if (s.at > frame) break;
    prev = current;
    current = s;
  }
  return {current, prev, t: current ? prog(frame, current.at, 6, 'linear') : 0};
};

/** The scope line in effect at a frame, the step it started on, and the one before (for its fade). */
const scopeAt = (frame: number, steps: ReadonlyArray<ChipStep>): {text: string; since: number; prevText: string; prevSince: number} => {
  let text = '';
  let since = Number.NEGATIVE_INFINITY;
  let prevText = '';
  let prevSince = Number.NEGATIVE_INFINITY;
  for (const s of byAt(steps)) {
    if (s.at > frame) break;
    const t = s.scope ?? '';
    if (t !== text) {
      prevText = text;
      prevSince = s.at;
      text = t;
      since = s.at;
    }
  }
  return {text, since, prevText, prevSince};
};

/** 0..1: how dimmed the chip is at a frame (8-frame steps). */
export const chipDimAt = (frame: number, steps: ReadonlyArray<ChipStep>): number => {
  let target = 0;
  let from = 0;
  let changeAt = Number.NEGATIVE_INFINITY;
  const valueAt = (f: number) => (changeAt === Number.NEGATIVE_INFINITY ? target : lerp(from, target, prog(f, changeAt, 8, 'move')));
  for (const s of byAt(steps)) {
    if (s.at > frame) break;
    const next = s.dim ? 1 : 0;
    if (next !== target) {
      from = valueAt(s.at);
      target = next;
      changeAt = s.at;
    }
  }
  return valueAt(frame);
};

/** The chip's geometry at a frame (for the knockout and the budgets). */
export const chipBox = (frame: number, steps: ReadonlyArray<ChipStep>): {box: SRect; size: number; text: string; scope: string} | null => {
  const {current, prev} = chipAt(frame, steps);
  if (!current || current.text === '') return null;
  const sameText = prev && prev.text === current.text;
  const size = sameText && prev ? lerp(sizePx(prev.size), sizePx(current.size), prog(frame, current.at, 6, 'move')) : sizePx(current.size);
  const prevW = prev && prev.text ? textWidth(prev.text, sizePx(prev.size), 600, TRACK) : 0;
  const curW = textWidth(current.text, size, 600, TRACK);
  const w = prev ? lerp(prevW, curW, prog(frame, current.at, 6, 'move')) : curW;
  const lineH = size * TYPE.lineHeight;
  let h = lineH + LABEL2.chipRuleGap + LABEL2.chipRule + LABEL2.chipDoubleGap + LABEL2.chipRule;
  const sc = scopeAt(frame, steps);
  let sw = 0;
  if (sc.text) {
    h += SCOPE_GAP + scopeLineH;
    sw = textWidth(sc.text, TYPE.chipScope, 600, TRACK);
  }
  return {box: {x: LAYOUT.chipOrigin.x, y: LAYOUT.chipOrigin.y, w: Math.max(w, curW, sw), h}, size, text: current.text, scope: sc.text};
};

export const Chip2: React.FC<{steps: ReadonlyArray<ChipStep>; frame: number}> = ({steps, frame}) => {
  const {current, prev} = chipAt(frame, steps);
  if (!current) return null;
  const x = LAYOUT.chipOrigin.x;
  const y = LAYOUT.chipOrigin.y;
  const textChanged = !prev || prev.text !== current.text;
  const curSize = !textChanged && prev ? lerp(sizePx(prev.size), sizePx(current.size), prog(frame, current.at, 6, 'move')) : sizePx(current.size);
  const prevSize = prev ? sizePx(prev.size) : curSize;
  const lineH = Math.max(curSize, prevSize) * TYPE.lineHeight;
  // round 4 (judges: the masked roll clipped the glyphs mid-flip, f520): no mask. The old word fades out while it slides
  // up 10 px (3 frames); the new one fades in while it rises 10 px into place, from the old one's last frame (4 frames,
  // 'arrive': readable from its second frame), so two words are never readable together and no glyph is ever cut
  const outT = textChanged && prev ? prog(frame, current.at, 3, 'exit') : 1;
  const inT = textChanged ? prog(frame, current.at + (prev && prev.text ? 2 : 0), 4, 'arrive') : 1;
  const SLIDE = 10;
  const curW = current.text ? textWidth(current.text, curSize, 600, TRACK) : 0;
  const prevW = prev && prev.text ? textWidth(prev.text, prevSize, 600, TRACK) : 0;
  const ruleW = prev ? lerp(prevW, curW, prog(frame, current.at, 6, 'move')) : curW * prog(frame, current.at, 6, 'move');
  const dbl = (s: ChipStep | null) => (s && s.underline === 'double' ? 1 : 0);
  const dblT = prev ? lerp(dbl(prev), dbl(current), prog(frame, current.at, 6, 'move')) : dbl(current);
  const ruleY = y + curSize * TYPE.lineHeight + LABEL2.chipRuleGap;
  const dim = chipDimAt(frame, steps);
  const groupOpacity = 1 - (1 - CHIP_DIM) * dim;
  const style = (size: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: size,
    lineHeight: TYPE.lineHeight,
    letterSpacing: TYPE.chipTracking,
    color: COLOR.ink,
    whiteSpace: 'pre',
  });
  // round 3: the scope line (muted, under the rule): it reveals word by word on its step and fades out when it clears
  const sc = scopeAt(frame, steps);
  const scopeY = ruleY + LABEL2.chipRule + dblT * (LABEL2.chipDoubleGap + LABEL2.chipRule) + SCOPE_GAP;
  const scopeStyle: React.CSSProperties = {
    position: 'absolute',
    left: x,
    top: f2(scopeY) + 'px',
    fontFamily: SANS,
    fontWeight: 600,
    fontSize: TYPE.chipScope,
    lineHeight: TYPE.lineHeight,
    letterSpacing: TYPE.chipTracking,
    color: COLOR.textMuted,
    whiteSpace: 'pre',
  };
  const oldScopeOut = sc.prevText && frame - sc.prevSince < 6 ? 1 - prog(frame, sc.prevSince, 4, 'exit') : 0;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: groupOpacity < 0.999 ? groupOpacity : undefined}}>
      <div style={{position: 'absolute', left: x, top: y, width: 1000, height: lineH}}>
        {textChanged && prev && prev.text && outT < 1 ? (
          <div style={{...style(prevSize), top: f2(-SLIDE * outT) + 'px', opacity: Math.round((1 - outT) * 1000) / 1000}}>{prev.text}</div>
        ) : null}
        {current.text && inT > 0 ? (
          <div style={{...style(curSize), top: f2(SLIDE * (1 - inT)) + 'px', opacity: textChanged ? Math.round(inT * 1000) / 1000 : 1}}>{current.text}</div>
        ) : null}
      </div>
      {oldScopeOut > 0 ? <div style={{...scopeStyle, opacity: oldScopeOut}}>{sc.prevText}</div> : null}
      {sc.text ? (
        <div style={scopeStyle}>
          <RevealText text={sc.text} age={frame - sc.since - (sc.prevText ? 3 : 0)} />
        </div>
      ) : null}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        {ruleW > 0.5 ? <rect x={x} y={ruleY} width={ruleW} height={LABEL2.chipRule} fill={COLOR.annotation} /> : null}
        {ruleW > 0.5 && dblT > 0.01 ? (
          <rect x={x} y={ruleY + LABEL2.chipRule + LABEL2.chipDoubleGap} width={ruleW} height={LABEL2.chipRule} fill={COLOR.annotation} opacity={dblT} />
        ) : null}
      </svg>
    </div>
  );
};
