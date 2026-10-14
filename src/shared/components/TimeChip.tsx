/**
 * Time chip: the shared time grammar "After the press" → "Soft-off" → "When pressed" → "Now".
 * A header in the header zone (top-left, x 144, y 96): sans 600 with +2% tracking and a 2 px rule under it,
 * 44 px while it carries the meaning, then 34 px (`shrinkAt`). Or a pill (variant="pill", 40 px).
 *
 * A value change in place (timeline) takes 6 frames: the old label fades out over 2, the new one arrives from the next frame over 5.
 *
 * Usage:
 *   <TimeChip label="After the press" inAt={2} shrinkAt={60} outAt={327} />        // readable by f7 (< f8)
 *   <TimeChip timeline={[{at: 2, label: 'After the press'}, {at: 328, label: 'Soft-off'}]} />
 *   <TimeChip label="Now" inAt={1830} />
 */
import React from 'react';
import {LABEL, LAYOUT, TYPE, withAlpha} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {SANS} from '../fonts';
import {EASE, fade, lerp, progress} from '../motion';
import {StatePill, labelAt, type LabelChange} from './StatePill';

export const TIME_LABELS = {
  afterPress: 'After the press',
  softOff: 'Soft-off',
  whenPressed: 'When pressed',
  now: 'Now',
} as const;
export type TimeLabel = (typeof TIME_LABELS)[keyof typeof TIME_LABELS];

export interface TimeChipProps extends KitBaseProps {
  /** A fixed label (one of TIME_LABELS, or any short header). */
  label?: TimeLabel | (string & {});
  /** Value changes in place (each change: old fades out over 2 frames; the new arrives from the next frame over 5). */
  timeline?: ReadonlyArray<LabelChange>;
  inAt?: number;
  outAt?: number;
  /** Step down from 44 to 34 px over 6 frames from this frame. */
  shrinkAt?: number;
  /** Start size (default 44: carries the meaning). */
  size?: number;
  /** Top-left of the header text (default: header zone 144, 96). */
  x?: number;
  y?: number;
  variant?: 'header' | 'pill';
  ruleColor?: string;
  color?: string;
  /** Knockout plate behind the header (default none; the header zone is kept clear). */
  plate?: boolean | string;
  /** Replace the drawing (e.g. an inked rule); timing stays the kit's. Draw in frame space (SVG). */
  render?: (s: {label: string; prevLabel: string | null; size: number; opacity: number; labelIn: number; prevOut: number; x: number; y: number}) => React.ReactNode;
}

export const TimeChip: React.FC<TimeChipProps> = (p) => {
  const {theme, frame} = useKit(p);
  const tl: LabelChange[] = p.timeline ? [...p.timeline] : [{at: p.inAt ?? 0, label: p.label ?? ''}];
  const inAt = p.inAt ?? tl[0]?.at ?? 0;
  if (p.variant === 'pill') {
    return (
      <StatePill
        theme={p.theme}
        skin={p.skin}
        frame={p.frame}
        x={p.x ?? LAYOUT.header.x0}
        y={p.y ?? LAYOUT.header.y0}
        dock="none"
        timeline={tl}
        inAt={inAt}
        outAt={p.outAt}
        size={p.size}
        color={p.color}
      />
    );
  }
  const st = labelAt(frame, tl, 3);
  if (!st || frame < inAt) return null;
  const op = fade(frame, inAt, p.outAt, 5, 6);
  if (op <= 0) return null;
  const big = p.size ?? TYPE.headerActive;
  const size = p.shrinkAt !== undefined ? lerp(big, TYPE.header, progress(frame, p.shrinkAt, 6, EASE.move)) : big;
  const x = p.x ?? LAYOUT.header.x0;
  const y = p.y ?? LAYOUT.header.y0;
  const enter = progress(frame, inAt, 5, EASE.arrive);
  // label change, never both readable at once and never blank: the previous label fades out over 2 frames
  // (gone on since+2) while the new one starts from since+1 and arrives over 5 frames with an 8 px slide
  // (6 frames in all, e.g. f327–f333 for "Soft-off")
  const changing = st.prev !== null && frame - st.since < 2;
  const newIn = st.prev !== null ? progress(frame, st.since + 1, 5, EASE.arrive) : enter;
  const oldOut = st.prev !== null ? 1 - progress(frame, st.since, 2, EASE.exit) : 0;
  if (p.render) return <>{p.render({label: st.label, prevLabel: changing ? st.prev : null, size, opacity: op, labelIn: newIn, prevOut: oldOut, x, y})}</>;
  const plate = p.plate ? withAlpha(typeof p.plate === 'string' ? p.plate : theme.surface, LABEL.plateOpacity) : 'transparent';
  const block = (text: string, opacity: number, dx: number) => (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        display: 'inline-block',
        opacity,
        transform: `translateX(${dx}px)`,
        background: plate,
        borderRadius: LABEL.plateRadius,
      }}
    >
      <div
        style={{
          fontFamily: SANS,
          fontWeight: 600,
          fontSize: size,
          lineHeight: TYPE.lineHeight,
          letterSpacing: TYPE.headerTracking,
          color: p.color ?? theme.ink,
          whiteSpace: 'nowrap',
          paddingBottom: LABEL.headerRuleGap,
          borderBottom: `${LABEL.headerRule}px solid ${p.ruleColor ?? theme.annotation}`,
        }}
      >
        {text}
      </div>
    </div>
  );
  return (
    <foreignObject x={x} y={y} width={1200} height={200} style={{overflow: 'visible'}}>
      <div style={{position: 'relative', width: 1200, height: 200, opacity: op}}>
        {changing && st.prev !== null ? block(st.prev, oldOut, 0) : null}
        {block(st.label, newIn, -(1 - newIn) * LABEL.slide)}
      </div>
    </foreignObject>
  );
};

/** The same component used as a scope / lane header ("Intel desktop", "Stop: AMD"): one header zone, one place. */
export const Header = TimeChip;
