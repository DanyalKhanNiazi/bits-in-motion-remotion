/**
 * Night Signal keyed tag: the brand anatomy (8 px anchor, 3 px annotation leader with at most one elbow,
 * 4 px key bar in the role colour, 44 px Sora 600, optional 34 px mono secondary) with this style's
 * masked reveal: the text slides 8 px out from behind its key bar, clipped at the bar's edge.
 * Lines: one or two primary lines (two-line tags where a pocket is narrower than one line; type never shrinks).
 * Left-side tags: the leader meets the text block's right edge at the first line's mid-height (approved).
 */
import React from 'react';
import {SANS, MONO, TYPE, LABEL, tagTiming, polyPath, squarePath, withAlpha, roleColor, type Pt, type RoleName} from '../../shared';
import {T} from './tones';

export interface TagProps {
  frame: number;
  anchor: Pt;
  end?: Pt;
  elbow?: Pt;
  lines: string[];
  secondary?: string;
  role?: RoleName;
  side?: 'left' | 'right';
  land: number;
  exitAt?: number;
  /** Plate tone under the text (the local plane at 90%); false for none. */
  plate?: string | false;
  /** Re-entry without the anchor pop (carried over a cut): show fully from `land`. */
  instant?: boolean;
  /** Move the whole tag (camera-carried). */
  dx?: number;
  dy?: number;
}

export const Tag: React.FC<TagProps> = (p) => {
  let timing = tagTiming(p.frame, p.land, p.exitAt);
  if (p.instant) {
    // carried over a cut: present in full from `land` (no entrance), normal exit
    if (p.frame < p.land) return null;
    if (p.exitAt === undefined || p.frame < p.exitAt) timing = {anchor: 1, leader: 1, text: 1, textX: 0, secondary: 1, visible: true};
  }
  if (!timing.visible) return null;
  const dx = p.dx ?? 0;
  const dy = p.dy ?? 0;
  const A: Pt = [p.anchor[0] + dx, p.anchor[1] + dy];
  const E: Pt = p.end ? [p.end[0] + dx, p.end[1] + dy] : A;
  const B: Pt | undefined = p.elbow ? [p.elbow[0] + dx, p.elbow[1] + dy] : undefined;
  const side = p.side ?? (E[0] >= A[0] ? 'right' : 'left');
  const keyColor = roleColor(T, p.role ?? 'part');
  const size = TYPE.label;
  const lineH = size * TYPE.lineHeight;
  const pad = LABEL.platePad;
  const W = 900;
  const H = 300;
  const foX = side === 'right' ? E[0] - pad : E[0] - W;
  const foY = E[1] - lineH / 2 - pad;
  const plate = p.plate === false ? 'transparent' : withAlpha(p.plate ?? T.surface, LABEL.plateOpacity);
  const pts: Pt[] = p.end ? (B ? [A, B, E] : [A, E]) : [];
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const slide = -timing.textX; // text starts 8 px behind the bar
  return (
    <g>
      {timing.text > 0 ? (
        <foreignObject x={foX} y={foY} width={W} height={H} style={{overflow: 'visible'}}>
          <div style={{width: W, height: H, display: 'flex', justifyContent: side === 'right' ? 'flex-start' : 'flex-end', alignItems: 'flex-start'}}>
            <div style={{display: 'inline-flex', flexDirection: 'row', alignItems: 'stretch', padding: pad, borderRadius: LABEL.plateRadius, background: plate, opacity: Math.min(1, timing.text * 1.4)}}>
              <div style={{width: LABEL.keyBar, background: keyColor, flex: 'none'}} />
              <div style={{overflow: 'hidden', paddingLeft: LABEL.keyGap}}>
                <div style={{display: 'flex', flexDirection: 'column', transform: `translateX(${slide}px)`, opacity: timing.text}}>
                  {p.lines.map((l, i) => (
                    <div key={i} style={{fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: TYPE.lineHeight, color: T.ink, whiteSpace: 'nowrap'}}>
                      {l}
                    </div>
                  ))}
                  {p.secondary ? (
                    <div style={{fontFamily: MONO, fontWeight: 500, fontSize: TYPE.secondary, lineHeight: TYPE.lineHeight, color: T.textMuted, whiteSpace: 'nowrap', opacity: timing.secondary}}>
                      {p.secondary}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </foreignObject>
      ) : null}
      {pts.length > 1 && timing.leader > 0 ? (
        <path
          d={polyPath(pts)}
          fill="none"
          stroke={T.annotation}
          strokeWidth={LABEL.leader}
          strokeDasharray={`${len * timing.leader} ${len + 10}`}
          strokeLinejoin="miter"
        />
      ) : null}
      {p.end && timing.anchor > 0 ? <path d={squarePath(A[0], A[1], LABEL.anchor * timing.anchor, 1)} fill={keyColor} /> : null}
    </g>
  );
};

/** A name inside a part (no leader, no anchor): masked like a tag, centred on (cx, cy). */
export const PartName: React.FC<{frame: number; cx: number; cy: number; lines: string[]; land: number; exitAt?: number; color?: string; instant?: boolean}> = (p) => {
  const t = tagTiming(p.frame, p.land, p.exitAt);
  const vis = p.instant ? (p.frame >= p.land && (p.exitAt === undefined || p.frame < p.exitAt + 6) ? 1 : 0) : t.text;
  const op = p.instant && p.exitAt !== undefined && p.frame >= p.exitAt ? t.text : vis;
  if (op <= 0) return null;
  const lineH = TYPE.label * TYPE.lineHeight;
  const h = lineH * p.lines.length;
  return (
    <foreignObject x={p.cx - 400} y={p.cy - h / 2} width={800} height={h + 4}>
      <div style={{width: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: op, transform: `translateY(${(1 - op) * 6}px)`}}>
        {p.lines.map((l, i) => (
          <div key={i} style={{fontFamily: SANS, fontWeight: 600, fontSize: TYPE.label, lineHeight: TYPE.lineHeight, color: p.color ?? T.ink, whiteSpace: 'nowrap'}}>
            {l}
          </div>
        ))}
      </div>
    </foreignObject>
  );
};
