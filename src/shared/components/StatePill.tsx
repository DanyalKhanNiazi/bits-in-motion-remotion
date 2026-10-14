/**
 * State pill (brand spec §4.1): a capsule docked 8 px outside the part's top-right corner,
 * sans 600 40 px, value word in caps ("Main power: OFF", "Main rails: OFF", "Soft-off"),
 * panel fill with a 2 px structure border. A value change is a 4-frame flip.
 *
 * Usage:
 *   <StatePill x={1500} y={700} label="Main power: OFF" inAt={410} />            // docked top-right of a part
 *   <StatePill x={1500} y={700} timeline={[{at: 0, label: 'Soft-off'}, {at: 1837, label: 'Now'}]} />
 */
import React from 'react';
import {LABEL, TYPE} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {SANS} from '../fonts';
import {clamp01, fade} from '../motion';

export type PillDock = 'top-right' | 'top-left' | 'inside-top-right' | 'inside-top-left' | 'none';

export interface LabelChange {
  at: number;
  label: string;
}

/** Which label shows at a frame, and the flip phase (0..1) of the latest change. */
export const labelAt = (frame: number, timeline: ReadonlyArray<LabelChange>, flipFrames: number) => {
  let cur = -1;
  for (let i = 0; i < timeline.length; i++) if (timeline[i].at <= frame) cur = i;
  if (cur < 0) return null;
  const prev = cur > 0 ? timeline[cur - 1].label : null;
  const p = cur > 0 ? clamp01((frame - timeline[cur].at) / flipFrames) : 1;
  return {label: timeline[cur].label, prev, p, since: timeline[cur].at, first: timeline[0].at};
};

export interface StatePillProps extends KitBaseProps {
  /** The docking corner of the part (or the pill's top-left when dock = 'none'). */
  x: number;
  y: number;
  dock?: PillDock;
  /** A fixed label (use `timeline` for value changes). */
  label?: string;
  timeline?: ReadonlyArray<LabelChange>;
  /** Entrance (default: the first label's frame, or 0), exit (6 frames). */
  inAt?: number;
  outAt?: number;
  /** Font size (default 40). */
  size?: number;
  /** Text colour (default ink). */
  color?: string;
  borderColor?: string;
  fill?: string;
  /** Replace the drawing; timing and docking stay the kit's. (x, y) = the pill's top-left, w = available width. */
  render?: (s: {text: string; scaleY: number; opacity: number; x: number; y: number; h: number; alignRight: boolean}) => React.ReactNode;
}

export const StatePill: React.FC<StatePillProps> = (p) => {
  const {theme, frame} = useKit(p);
  const tl: LabelChange[] = p.timeline ? [...p.timeline] : [{at: p.inAt ?? 0, label: p.label ?? ''}];
  const inAt = p.inAt ?? tl[0]?.at ?? 0;
  const st = labelAt(frame, tl, LABEL.pillFlip);
  if (!st || frame < inAt) return null;
  const op = fade(frame, inAt, p.outAt, 5, 6);
  if (op <= 0) return null;
  const size = Math.max(TYPE.floor, p.size ?? TYPE.pill);
  const h = Math.round(size * TYPE.lineHeight) + LABEL.pillPadY * 2 + LABEL.pillBorder * 2;
  const W = 1000;
  const dock = p.dock ?? 'top-right';
  const g = LABEL.pillDock;
  let foX = p.x;
  let foY = p.y;
  let justify: 'flex-start' | 'flex-end' = 'flex-start';
  if (dock === 'top-right') {
    foX = p.x + g;
    foY = p.y - g - h;
  } else if (dock === 'top-left') {
    foX = p.x - g - W;
    foY = p.y - g - h;
    justify = 'flex-end';
  } else if (dock === 'inside-top-right') {
    foX = p.x - g - W;
    foY = p.y + g;
    justify = 'flex-end';
  } else if (dock === 'inside-top-left') {
    foX = p.x + g;
    foY = p.y + g;
  }
  // 4-frame flip: first half shows the old value collapsing, second half the new value opening
  const showPrev = st.prev !== null && st.p < 0.5;
  const scaleY = st.prev !== null && st.p < 1 ? Math.abs(1 - 2 * st.p) : 1;
  const text = showPrev ? st.prev : st.label;
  if (p.render) {
    const alignRight = justify === 'flex-end';
    return <>{p.render({text: text ?? '', scaleY, opacity: op, x: alignRight ? foX + W : foX, y: foY, h, alignRight})}</>;
  }
  return (
    <foreignObject x={foX} y={foY} width={W} height={h} style={{overflow: 'visible'}}>
      <div style={{width: W, height: h, display: 'flex', justifyContent: justify, alignItems: 'flex-start'}}>
        <div
          style={{
            height: h,
            boxSizing: 'border-box',
            display: 'inline-flex',
            alignItems: 'center',
            padding: `${LABEL.pillPadY}px ${LABEL.pillPadX}px`,
            borderRadius: h / 2,
            border: `${LABEL.pillBorder}px solid ${p.borderColor ?? theme.structure}`,
            background: p.fill ?? theme.panel,
            opacity: op,
            transform: `scaleY(${scaleY})`,
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: size,
            lineHeight: TYPE.lineHeight,
            color: p.color ?? theme.ink,
            whiteSpace: 'nowrap',
          }}
        >
          {text}
        </div>
      </div>
    </foreignObject>
  );
};
