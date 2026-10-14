/**
 * Live Panels frame grammar (proposal §2.2, Part B):
 *   held        one 3 px structure rule on the page side
 *   active      a 4 px annotation rim (exactly one panel at a time)
 *   other time  double rule: a second 3 px rule 8 px inside the outer one (slides in/out over 6–8 frames)
 *   unvisited   frame only, no plate
 *   ports       40 px gaps in the rules where a literal route crosses a gutter, opened around the crossing
 * Corners are 8 px. Panels open frame-first (the rule draws on), then their contents fade in.
 */
import React from 'react';
import {interpolateColors} from 'remotion';
import {MONO, SANS, TYPE, rectPath, useSvgId, pathLength} from '../../shared';
import {D, L, TONE, W, inflate, type Box} from './look';

/* ------------------------------------------------------------------ primitives */

export const Stk: React.FC<{
  d: string;
  c: string;
  w: number;
  o?: number;
  dash?: string;
  dashOffset?: number;
  cap?: 'butt' | 'round' | 'square';
  join?: 'miter' | 'round' | 'bevel';
}> = ({d, c, w, o, dash, dashOffset, cap, join}) => (
  <path
    d={d}
    fill="none"
    stroke={c}
    strokeWidth={w}
    strokeOpacity={o ?? 1}
    strokeLinecap={cap ?? 'round'}
    strokeLinejoin={join ?? 'round'}
    strokeDasharray={dash}
    strokeDashoffset={dashOffset}
  />
);

export const Fil: React.FC<{d: string; c: string; o?: number; rule?: 'evenodd' | 'nonzero'}> = ({d, c, o, rule}) => (
  <path d={d} fill={c} fillOpacity={o ?? 1} fillRule={rule ?? 'nonzero'} />
);

/** A stroke drawn on along its length: [0, t] of the path (t 0..1). */
export const DrawOn: React.FC<{d: string; c: string; w: number; t: number; o?: number; cap?: 'butt' | 'round' | 'square'}> = ({d, c, w, t, o, cap}) => {
  if (t <= 0) return null;
  if (t >= 1) return <Stk d={d} c={c} w={w} o={o} cap={cap} />;
  const len = pathLength(d);
  return <Stk d={d} c={c} w={w} o={o} cap={cap ?? 'butt'} dash={`${len * t} ${len + 10}`} />;
};

/* ------------------------------------------------------------------ panel frame */

export type Polarity = 'in' | 'out' | 'schem';

export interface Port {
  side: 'left' | 'right' | 'top' | 'bottom';
  /** page coordinate along the side (y for left/right, x for top/bottom) */
  at: number;
  /** 0..1 */
  open: number;
  /** gap length (default 40) */
  len?: number;
}

export interface FrameProps {
  box: Box;
  polarity: Polarity;
  /** 0 held → 1 active rim */
  active: number;
  /** 0 single → 1 double rule */
  double: number;
  ports?: Port[];
  /** 0..1 frame draw-on (frame-first open); default 1 */
  open?: number;
  /** unvisited stop: no plate */
  frameOnly?: boolean;
  opacity?: number;
}

const ruleColor = (active: number): string => (active <= 0 ? D.structure : active >= 1 ? D.annotation : interpolateColors(active, [0, 1], [D.structure, D.annotation]));

/** Plate fill (drawn under the panel's content). */
export const Plate: React.FC<{box: Box; polarity: Polarity; held?: number; color?: string; opacity?: number}> = ({box, polarity, held = 0, color, opacity}) => {
  const c =
    color ??
    (polarity === 'out'
      ? held <= 0
        ? TONE.plateOut
        : held >= 1
          ? TONE.plateOutHeld
          : interpolateColors(held, [0, 1], [TONE.plateOut, TONE.plateOutHeld])
      : polarity === 'schem'
        ? TONE.plateSchem
        : TONE.plateIn);
  return <path d={rectPath(box.x, box.y, box.w, box.h, 8)} fill={c} fillOpacity={opacity ?? 1} />;
};

/** Clip children to the plate. */
export const PanelClip: React.FC<{box: Box; children: React.ReactNode; opacity?: number}> = ({box, children, opacity}) => {
  const id = useSvgId('pclip');
  return (
    <g opacity={opacity ?? 1}>
      <defs>
        <clipPath id={id}>
          <path d={rectPath(box.x, box.y, box.w, box.h, 8)} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
};

/** The rules (outer rule or rim on the page side, plus the inner rule when double), with port gaps. */
export const Rules: React.FC<FrameProps & {plate?: string}> = ({box, polarity, active, double, ports, open = 1, opacity = 1, plate}) => {
  const maskId = useSvgId('ports');
  const ow = W.rule + (W.rim - W.rule) * active;
  const outer = inflate(box, ow / 2);
  const outerD = rectPath(outer.x, outer.y, outer.w, outer.h, 8 + ow / 2);
  // inner rule centre: +1.5 (hidden under the outer) → −9.5 (8 px gap inside the plate edge)
  const innerOff = 1.5 + (-9.5 - 1.5) * double;
  const inner = inflate(box, innerOff);
  const innerD = rectPath(inner.x, inner.y, inner.w, inner.h, Math.max(2, 8 + innerOff));
  const innerC = polarity === 'out' ? L.structure : D.structure;
  const gaps = (ports ?? []).filter((p) => p.open > 0.001);
  const perim = 2 * (outer.w + outer.h);
  const dash = open < 1 ? `${perim * open} ${perim + 20}` : undefined;
  return (
    <g opacity={opacity}>
      {gaps.length > 0 ? (
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse" x={box.x - 40} y={box.y - 40} width={box.w + 80} height={box.h + 80}>
            <rect x={box.x - 40} y={box.y - 40} width={box.w + 80} height={box.h + 80} fill="#fff" />
            {gaps.map((p, i) => {
              const g = (p.len ?? 40) * p.open;
              if (p.side === 'left' || p.side === 'right') {
                const x0 = p.side === 'left' ? box.x - 12 : box.x + box.w - 24;
                return <rect key={i} x={x0} y={p.at - g / 2} width={36} height={g} fill="#000" />;
              }
              const y0 = p.side === 'top' ? box.y - 12 : box.y + box.h - 24;
              return <rect key={i} x={p.at - g / 2} y={y0} width={g} height={36} fill="#000" />;
            })}
          </mask>
        </defs>
      ) : null}
      {double > 0.02 && plate ? (
        <path
          d={rectPath(box.x + (-innerOff - 1.5) / 2, box.y + (-innerOff - 1.5) / 2, box.w - (-innerOff - 1.5), box.h - (-innerOff - 1.5), Math.max(2, 8 - (-innerOff - 1.5) / 2))}
          fill="none"
          stroke={plate}
          strokeWidth={Math.max(0, -innerOff - 1.5)}
        />
      ) : null}
      <g mask={gaps.length > 0 ? `url(#${maskId})` : undefined}>
        {double > 0.02 ? <path d={innerD} fill="none" stroke={innerC} strokeWidth={W.rule} strokeDasharray={dash} /> : null}
        <path d={outerD} fill="none" stroke={ruleColor(active)} strokeWidth={ow} strokeDasharray={dash} />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------------ captions and chips */

/**
 * Panel caption (brand header anatomy): sans 600, 44 px when must-read (else 34), +2% tracking, 2 px rule under.
 * Top-left slot, 16 px inset (or top-right with align="right"). Enters over 5 frames with an 8 px slide (Arrive).
 */
export const Caption: React.FC<{
  box: Box;
  text: string;
  polarity: Polarity;
  /** 0..1 entrance */
  t: number;
  /** 0..1 exit */
  out?: number;
  size?: number;
  align?: 'left' | 'right';
  /** horizontal inset (keep text inside title-safe, x ≥ 144), vertical inset */
  inset?: number;
  insetY?: number;
}> = ({box, text, polarity, t, out = 0, size = 44, align = 'left', inset = 16, insetY = 16}) => {
  const op = Math.min(t, 1 - out);
  if (op <= 0) return null;
  const ink = polarity === 'out' ? L.ink : D.ink;
  const rule = polarity === 'out' ? L.annotation : D.annotation;
  const W0 = 900;
  const x = align === 'left' ? box.x + inset : box.x + box.w - inset - W0;
  const slide = (1 - t) * 8 * (align === 'left' ? -1 : 1);
  return (
    <foreignObject x={x} y={box.y + insetY - 4} width={W0} height={size * 2} style={{overflow: 'visible'}}>
      <div style={{width: W0, display: 'flex', justifyContent: align === 'left' ? 'flex-start' : 'flex-end'}}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: size,
            lineHeight: TYPE.lineHeight,
            letterSpacing: '0.02em',
            color: ink,
            whiteSpace: 'nowrap',
            paddingBottom: 6,
            borderBottom: `2px solid ${rule}`,
            opacity: op,
            transform: `translateX(${slide}px)`,
          }}
        >
          {text}
        </div>
      </div>
    </foreignObject>
  );
};

/** The "Diagram" chip: the one literal-versus-schematic cue (30 px mono, textMuted, 2 px structure capsule). */
export const DiagramChip: React.FC<{box: Box; opacity?: number}> = ({box, opacity = 1}) => {
  const fs = TYPE.chip;
  const w = 7 * fs * 0.6 + 28;
  const h = Math.round(fs * 1.15) + 8;
  // top-right inner corner, kept inside title-safe (x ≤ 1776)
  const x = Math.min(box.x + box.w - 14, 1776) - w;
  const y = box.y + 14;
  return (
    <g opacity={opacity}>
      <path d={rectPath(x, y, w, h, h / 2)} fill={TONE.plateSchem} stroke={D.structure} strokeWidth={2} />
      <text x={x + w / 2} y={y + h / 2 + 1} textAnchor="middle" dominantBaseline="central" style={{fontFamily: MONO, fontWeight: 500, fontSize: fs}} fill={D.textMuted}>
        Diagram
      </text>
    </g>
  );
};
