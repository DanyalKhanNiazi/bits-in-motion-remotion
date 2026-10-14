/**
 * Keyed tag for the Living Schematic: the brand anatomy and timing of the kit's KeyedTag (square anchor,
 * 3 px annotation leader, key bar in the role colour, 44 px sans primary, optional 34 px mono secondary,
 * knockout plate), copied into this style so that:
 *   - the primary may break onto two lines ("Always-on" / "logic"), as the brand allows (two lines at most);
 *   - the text is in screen space on a world-space anchor: the caller passes screen points computed from the
 *     camera, and the slot for each framing (the block rides with its anchor during a move, never scales).
 * Timing is the kit's tagTiming(): anchor t0−6 → t0−2, leader t0−5 → t0−1, text t0 → t0+5, exit 6 frames.
 */
import React from 'react';
import {LABEL, TYPE, MONO, SANS, polyPath, roleColor, squarePath, tagTiming, withAlpha, kitWarn, countWords, type Pt, type RoleName} from '../../shared';
import {T} from './theme';

export interface TagProps {
  frame: number;
  anchor: Pt;
  /** Where the leader meets the text block (omit for a leaderless name). */
  end?: Pt;
  elbow?: Pt;
  /** Primary text; '\n' breaks it onto two lines. */
  text: string;
  secondary?: string;
  role?: RoleName;
  side?: 'left' | 'right';
  land: number;
  exitAt?: number;
  /** Minimum exit (hold rule), for the console check. */
  minExit?: number;
  secondaryAt?: number;
  plate?: string | false;
  /** Extra opacity (e.g. the anchor leaving the frame). */
  opacity?: number;
}

export const Tag: React.FC<TagProps> = (p) => {
  const t = tagTiming(p.frame, p.land, p.exitAt, p.secondaryAt);
  if (!t.visible) return null;
  const words = countWords(p.text.replace('\n', ' '));
  if (words > 3) kitWarn(`style3 Tag "${p.text}": ${words} words`);
  if (p.exitAt !== undefined && p.minExit !== undefined && p.exitAt < p.minExit) kitWarn(`style3 Tag "${p.text}": exit ${p.exitAt} < hold rule ${p.minExit}`);
  const keyColor = roleColor(T, p.role ?? 'part');
  const end: Pt = p.end ?? p.anchor;
  const side = p.side ?? (end[0] >= p.anchor[0] ? 'right' : 'left');
  const lines = p.text.split('\n');
  const size = TYPE.label;
  const lineH = size * TYPE.lineHeight;
  const pad = LABEL.platePad;
  const Wd = 1200;
  const Hd = 400;
  const blockH = lines.length * lineH + (p.secondary ? TYPE.secondary * TYPE.lineHeight : 0);
  // the leader meets the block at the middle of its first line (one line) or of the whole block (two lines)
  const attachY = lines.length > 1 ? blockH / 2 : lineH / 2;
  const foX = side === 'right' ? end[0] - pad : end[0] - Wd;
  const foY = end[1] - attachY - pad;
  const plate = p.plate === false ? 'transparent' : withAlpha(p.plate ?? T.surface, LABEL.plateOpacity);
  const slide = side === 'right' ? -t.textX : t.textX;
  const op = p.opacity ?? 1;

  const leaderPts: Pt[] = p.end ? (p.elbow ? [p.anchor, p.elbow, p.end] : [p.anchor, p.end]) : [];
  let leaderLen = 0;
  for (let i = 1; i < leaderPts.length; i++) leaderLen += Math.hypot(leaderPts[i][0] - leaderPts[i - 1][0], leaderPts[i][1] - leaderPts[i - 1][1]);
  const trimmed = leaderLen * t.leader;
  // draw-on of the leader via dasharray
  return (
    <g opacity={op}>
      {t.text > 0 ? (
        <foreignObject x={foX} y={foY} width={Wd} height={Hd} style={{overflow: 'visible'}}>
          <div style={{width: Wd, height: Hd, display: 'flex', justifyContent: side === 'right' ? 'flex-start' : 'flex-end', alignItems: 'flex-start'}}>
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                padding: pad,
                borderRadius: LABEL.plateRadius,
                background: plate,
                opacity: t.text,
                transform: `translateX(${slide}px)`,
              }}
            >
              <div style={{width: LABEL.keyBar, background: keyColor, flex: 'none', marginRight: LABEL.keyGap}} />
              <div style={{display: 'flex', flexDirection: 'column'}}>
                {lines.map((l, i) => (
                  <div key={i} style={{fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: TYPE.lineHeight, color: T.ink, whiteSpace: 'nowrap'}}>
                    {l}
                  </div>
                ))}
                {p.secondary ? (
                  <div style={{fontFamily: MONO, fontWeight: 500, fontSize: TYPE.secondary, lineHeight: TYPE.lineHeight, color: T.textMuted, whiteSpace: 'nowrap', opacity: t.secondary}}>
                    {p.secondary}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </foreignObject>
      ) : null}
      {leaderPts.length > 1 && t.leader > 0 ? (
        <path
          d={polyPath(leaderPts)}
          fill="none"
          stroke={T.annotation}
          strokeWidth={LABEL.leader}
          strokeDasharray={`${Math.max(0.01, trimmed)} ${leaderLen + 10}`}
          strokeLinejoin="miter"
        />
      ) : null}
      {p.end && t.anchor > 0 ? <path d={squarePath(p.anchor[0], p.anchor[1], LABEL.anchor * t.anchor, 1)} fill={keyColor} /> : null}
    </g>
  );
};
