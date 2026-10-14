/**
 * The film's slate: the time chip / scope header in the header zone (x 144), sans 600, +2% tracking,
 * 2 px annotation rule. 44 px while it carries the meaning, 34 px after (a 34 px header counts 0 words).
 * A change is a vertical masked roll: the old word up and out in 4 frames, the new one in over 5.
 * Night Signal variant of the kit TimeChip (size can step back up, e.g. "Soft-off" on "even while off").
 */
import React from 'react';
import {SANS, EASE, progress, lerp, TYPE, LABEL} from '../../shared';
import {T} from './tones';

export interface SlateKey {
  at: number;
  label: string;
  /** The change happens on a cut: switch with the cut, no roll. */
  cut?: boolean;
}
export interface SizeKey {
  at: number;
  size: number;
  cut?: boolean;
}

/** Top of the slate text: inside the letterbox picture (bars end at y 138), inside the header zone. */
export const SLATE_X = 144;
export const SLATE_Y = 146;

const sizeAt = (frame: number, keys: ReadonlyArray<SizeKey>): number => {
  let cur = keys[0].size;
  let prev = keys[0].size;
  let since = -1e9;
  let cut = false;
  for (const k of keys) {
    if (k.at <= frame) {
      prev = cur;
      cur = k.size;
      since = k.at;
      cut = !!k.cut;
    }
  }
  return cut ? cur : lerp(prev, cur, progress(frame, since, 6, EASE.move));
};

export const Slate: React.FC<{frame: number; labels: ReadonlyArray<SlateKey>; sizes: ReadonlyArray<SizeKey>}> = ({frame, labels, sizes}) => {
  let i = -1;
  for (let j = 0; j < labels.length; j++) if (labels[j].at <= frame) i = j;
  if (i < 0) return null;
  const cur = labels[i];
  const prev = i > 0 ? labels[i - 1] : null;
  const size = sizeAt(frame, sizes);
  const t = frame - cur.at;
  const first = i === 0;
  // masked vertical roll: the old word leaves upward over 3 frames, the new one rises in from below over
  // 5 frames starting a frame later, so two readable labels never share the mask
  const inP = cur.cut ? 1 : progress(frame, cur.at + 1, 5, EASE.arrive);
  const outP = prev && !cur.cut ? progress(frame, cur.at, 3, EASE.exit) : 1;
  const lineH = size * TYPE.lineHeight + LABEL.headerRuleGap + LABEL.headerRule + 2;
  const block = (text: string, dy: number, opacity: number) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: dy,
        opacity,
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: size,
        lineHeight: TYPE.lineHeight,
        letterSpacing: TYPE.headerTracking,
        color: T.ink,
        whiteSpace: 'nowrap',
        paddingBottom: LABEL.headerRuleGap,
        borderBottom: `${LABEL.headerRule}px solid ${T.annotation}`,
      }}
    >
      {text}
    </div>
  );
  return (
    <foreignObject x={SLATE_X} y={SLATE_Y} width={900} height={lineH + 4}>
      <div style={{position: 'relative', width: 900, height: lineH + 2, overflow: 'hidden'}}>
        {prev && !cur.cut && t < 3 ? block(prev.label, -outP * lineH, 1 - outP) : null}
        {first ? block(cur.label, 0, progress(frame, cur.at, 5, EASE.arrive)) : inP > 0 ? block(cur.label, (1 - inP) * lineH, inP) : null}
      </div>
    </foreignObject>
  );
};
