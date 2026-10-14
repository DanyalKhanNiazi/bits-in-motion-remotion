/**
 * Tracing paper: the only time device. A sheet lays down already in register (6 frames: its shadow
 * shrinks 14 → 6 px, two ⊕ registration marks snap on, untraced parts of the page ghost to 35%),
 * carries its time chip at 44 px, re-traces only its traced set, and slides off in 10 frames (Move)
 * inside a narration pause, so the unchanged present is visibly underneath.
 */
import React from 'react';
import {EASE, SANS, lerp, progress, useSvgId} from '../../shared';
import * as L from './layout';
import {TH} from './parts';

export interface TracingSheetProps {
  frame: number;
  box: L.Box;
  /** Optional tab reaching up from the sheet's top edge (the flash-forward's time chip). */
  tab?: L.Box;
  tabLabel?: string;
  inAt: number;
  outAt?: number;
  /** Slide-off direction and distance. */
  out: {dx: number; dy: number};
  /** The page as it is, seen through the sheet at 35%. */
  ghost: React.ReactNode;
  /** The traced set and everything written on the sheet (moves with it). */
  children: React.ReactNode;
  /** Where the two ⊕ registration marks go: opposite corners (default) or the right-hand corners. */
  regs?: 'diagonal' | 'right';
}

const outline = (b: L.Box, tab?: L.Box): string => {
  if (!tab) return `M${b.x} ${b.y}H${b.x + b.w}V${b.y + b.h}H${b.x}Z`;
  const r = 8;
  return (
    `M${b.x} ${b.y}H${tab.x}V${tab.y + r}Q${tab.x} ${tab.y} ${tab.x + r} ${tab.y}H${tab.x + tab.w - r}` +
    `Q${tab.x + tab.w} ${tab.y} ${tab.x + tab.w} ${tab.y + r}V${b.y}H${b.x + b.w}V${b.y + b.h}H${b.x}Z`
  );
};

const RegMark: React.FC<{x: number; y: number; p: number}> = ({x, y, p}) => {
  if (p <= 0) return null;
  const s = lerp(1.4, 1, EASE.arrive(p));
  return (
    <g opacity={p} transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx={0} cy={0} r={9} fill="none" stroke={TH.structure} strokeWidth={2} />
      <path d="M-14 0H14M0 -14V14" stroke={TH.structure} strokeWidth={2} />
    </g>
  );
};

export const TracingSheet: React.FC<TracingSheetProps> = ({frame, box, tab, tabLabel, inAt, outAt, out, ghost, children, regs = 'diagonal'}) => {
  const clipId = useSvgId('sheetclip');
  if (frame < inAt) return null;
  const slide = outAt !== undefined ? progress(frame, outAt, 10, EASE.move) : 0;
  if (slide >= 1) return null;
  // lays down in 6 frames; while sliding off, its last frames also fade so no stray piece (the tab)
  // is left hanging at the frame edge
  const lay = progress(frame, inAt, 6, EASE.arrive) * (outAt !== undefined ? 1 - progress(frame, outAt + 4, 4, EASE.exit) : 1);
  const dx = out.dx * slide;
  const dy = out.dy * slide;
  const shadow = lerp(14, 6, lay);
  const d = outline(box, tab);
  const regP = progress(frame, inAt + 4, 2, EASE.arrive);
  // the time chip leaves with its sheet, but stops being readable before it crosses the caption band
  const tabText = outAt !== undefined ? 1 - progress(frame, outAt + 2, 4, EASE.exit) : 1;
  return (
    <g opacity={lay}>
      <defs>
        <clipPath id={clipId}>
          <path d={d} transform={`translate(${dx} ${dy})`} />
        </clipPath>
      </defs>
      <path d={d} transform={`translate(${dx + shadow} ${dy + shadow})`} fill={L.SHEET_SHADOW} />
      <path d={d} transform={`translate(${dx} ${dy})`} fill={L.SHEET_PLATE} />
      <g clipPath={`url(#${clipId})`}>
        <g opacity={0.35}>{ghost}</g>
      </g>
      <path d={d} transform={`translate(${dx} ${dy})`} fill="none" stroke={L.SHEET_EDGE} strokeWidth={3} strokeLinejoin="round" />
      <g transform={`translate(${dx} ${dy})`}>
        {children}
        <RegMark x={box.x + box.w - 30} y={box.y + 30} p={regP} />
        {regs === 'right' ? <RegMark x={box.x + box.w - 30} y={box.y + box.h - 30} p={regP} /> : <RegMark x={box.x + 30} y={box.y + box.h - 30} p={regP} />}
        {tab && tabLabel ? (
          <foreignObject x={tab.x + 18} y={tab.y + 12} width={tab.w + 400} height={tab.h} style={{overflow: 'visible'}}>
            <div
              style={{
                display: 'inline-block',
                opacity: tabText,
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: 44,
                lineHeight: 1.15,
                letterSpacing: '0.02em',
                color: TH.ink,
                whiteSpace: 'nowrap',
                paddingBottom: 6,
                borderBottom: `2px solid ${TH.annotation}`,
              }}
            >
              {tabLabel}
            </div>
          </foreignObject>
        ) : null}
      </g>
    </g>
  );
};
