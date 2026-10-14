/**
 * S07–S09 on the System map:
 *   S07  a dashed ≈ analogy arc from the button to a dashed generic sign-in card BELOW the black monitor
 *        (never on it); the monitor stays black.
 *   S08  the brand fork: a 4 px structure stem splitting into two identical command chips, "Restart" and
 *        "Shut down", with "Why different?" at its stem (a question, not a result).
 *   S09  a scope line traced once round the desktop (the wall socket stays outside), and the two stops as map
 *        callouts docked beside the parts they change: AMD beside the CPU/chipset (both blocks inside the
 *        processor package), laptops beside the chipset (the lookout is its own EC chip; a battery; no ATX PSU).
 */
import React from 'react';
import {ApproxChip, AnalogyFrame, EASE, LABEL, SANS, TYPE, progress, routePath, trackFromPoints, type Pt} from '../../shared';
import {FILL, T} from './theme';
import {F} from './timeline';
import * as M from './map';

/* ------------------------------------------------------------------------------------------------ helpers */
const quad = (a: Pt, c: Pt, b: Pt, n = 48): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return pts;
};
const trimPts = (pts: Pt[], frac: number): Pt[] => {
  const tr = trackFromPoints(pts);
  const L = tr.length * Math.max(0, Math.min(1, frac));
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < tr.pts.length; i++) {
    if (tr.cum[i] < L) out.push(tr.pts[i]);
    else break;
  }
  const e = tr.at(L);
  out.push([e.x, e.y]);
  return out;
};
const dPts = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');

const Txt: React.FC<{x: number; y: number; text: string; size?: number; opacity?: number; anchor?: 'start' | 'middle'; color?: string; slide?: number}> = ({
  x,
  y,
  text,
  size = TYPE.label,
  opacity = 1,
  anchor = 'start',
  color = T.ink,
  slide = 0,
}) => (
  <text
    x={x - slide}
    y={y}
    textAnchor={anchor}
    dominantBaseline="central"
    style={{fontFamily: SANS, fontWeight: 600, fontSize: size}}
    fill={color}
    opacity={opacity}
  >
    {text}
  </text>
);

/* ------------------------------------------------------------------------------------------------ S07 */
export const CARD = {x: 1408, y: 456, w: 240, h: 112};
const ARC_FROM: Pt = [M.BUTTON_C[0] + 18, M.BUTTON_C[1] - 22];
const ARC_CTRL: Pt = [1250, 470];
const ARC_TO: Pt = [CARD.x - 8, CARD.y + CARD.h / 2 + 10];
const ARC = quad(ARC_FROM, ARC_CTRL, ARC_TO);

export const SignInArc: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.arc || frame >= F.s07Exit + 6) return null;
  const out = 1 - progress(frame, F.s07Exit, 6, EASE.exit);
  const draw = progress(frame, F.arc, 16, EASE.move);
  const pts = trimPts(ARC, draw);
  const apex = ARC[24];
  const chipIn = progress(frame, F.arc + 10, 5, EASE.arrive);
  const contents = progress(frame, F.signIn, 6, EASE.arrive);
  const cx = CARD.x + CARD.w / 2;
  return (
    <g opacity={out}>
      <path d={dPts(pts)} fill="none" stroke={T.annotation} strokeWidth={3} strokeDasharray="12 8" strokeLinecap="butt" />
      {chipIn > 0 ? <ApproxChip x={apex[0]} y={apex[1]} opacity={chipIn} /> : null}
      {frame >= F.card ? (
        <>
          <rect x={CARD.x} y={CARD.y} width={CARD.w} height={CARD.h} rx={10} fill={T.panel} opacity={0.9 * progress(frame, F.card, 8, EASE.arrive)} />
          <AnalogyFrame x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} r={10} inAt={F.card} />
        </>
      ) : null}
      {contents > 0 ? (
        <g opacity={contents}>
          <circle cx={cx} cy={CARD.y + 34} r={16} fill="none" stroke={T.annotation} strokeWidth={2.5} />
          <circle cx={cx} cy={CARD.y + 29} r={5} fill={T.annotation} />
          <path d={`M${cx - 9} ${CARD.y + 44}a9 7 0 0 1 18 0`} fill={T.annotation} />
          <rect x={cx - 70} y={CARD.y + 62} width={140} height={16} rx={8} fill="none" stroke={T.annotation} strokeWidth={2.5} />
          <rect x={cx - 34} y={CARD.y + 86} width={68} height={16} rx={8} fill={T.annotation} />
        </g>
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------ S08 */
const FORK = {x0: 1296, y0: 744, split: 1356, chipX: 1416, upY: 664, dnY: 824};
const CHIP = {w: 253, h: 52};

const Chip: React.FC<{frame: number; at: number; y: number; label: string; out: number}> = ({frame, at, y, label, out}) => {
  if (frame < at) return null;
  const pop = progress(frame, at, 4, EASE.snap);
  const x = FORK.chipX;
  const cx = x + CHIP.w / 2;
  return (
    <g opacity={out * Math.min(1, progress(frame, at, 2))} transform={`translate(${cx} ${y}) scale(${0.85 + 0.15 * pop}) translate(${-cx} ${-y})`}>
      <rect x={x} y={y - CHIP.h / 2} width={CHIP.w} height={CHIP.h} rx={8} fill={T.panel} stroke={T.ink} strokeWidth={3} />
      <Txt x={cx} y={y + 1} text={label} size={TYPE.pill} anchor="middle" />
    </g>
  );
};

export const Fork: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.restart - 6 || frame >= F.forkExit + 6) return null;
  const out = 1 - progress(frame, F.forkExit, 6, EASE.exit);
  const up = progress(frame, F.restart - 6, 6, EASE.arrive);
  const dn = progress(frame, F.shutDown - 6, 6, EASE.arrive);
  const stem: Pt[] = [
    [FORK.x0, FORK.y0],
    [FORK.split, FORK.y0],
  ];
  const upB: Pt[] = [
    [FORK.split, FORK.y0],
    [FORK.split, FORK.upY],
    [FORK.chipX, FORK.upY],
  ];
  const dnB: Pt[] = [
    [FORK.split, FORK.y0],
    [FORK.split, FORK.dnY],
    [FORK.chipX, FORK.dnY],
  ];
  return (
    <g opacity={out}>
      <path d={dPts(trimPts(stem, up))} stroke={T.structure} strokeWidth={4} fill="none" />
      {up > 0.5 ? <path d={dPts(trimPts(upB, (up - 0.5) * 2))} stroke={T.structure} strokeWidth={4} fill="none" strokeLinejoin="round" /> : null}
      {dn > 0 ? <path d={dPts(trimPts(dnB, dn))} stroke={T.structure} strokeWidth={4} fill="none" strokeLinejoin="round" /> : null}
      <Chip frame={frame} at={F.restart} y={FORK.upY} label="Restart" out={1} />
      <Chip frame={frame} at={F.shutDown} y={FORK.dnY} label="Shut down" out={1} />
    </g>
  );
};
export const FORK_STEM: Pt = [FORK.x0, FORK.y0];

/* ------------------------------------------------------------------------------------------------ S09 */
const SCOPE: Pt[] = [
  [512, 210],
  [1760, 210],
  [1760, 466],
  [1240, 466],
  [1240, 778],
  [1024, 778],
  [1024, 934],
  [372, 934],
  [372, 790],
  [512, 790],
  [512, 210],
];
export const ScopeLine: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.scope || frame > F.scope + 50) return null;
  const draw = progress(frame, F.scope, 30, EASE.move);
  const op = 1 - progress(frame, F.scope + 38, 10, EASE.exit);
  const d = routePath(trimPts(SCOPE, draw), 16);
  return <path d={d} fill="none" stroke={T.annotation} strokeWidth={3} opacity={op} strokeLinejoin="round" />;
};

/** A callout: white plate with a 2 px ink frame drawn first, then its contents; a leader to the part it changes. */
const Callout: React.FC<{
  frame: number;
  box: {x: number; y: number; w: number; h: number};
  at: number;
  titleAt: number;
  title: string;
  leader: Pt[];
  outAt: number;
  children: React.ReactNode;
}> = ({frame, box, at, titleAt, title, leader, outAt, children}) => {
  if (frame < at) return null;
  const out = 1 - progress(frame, outAt, 6, EASE.exit);
  if (out <= 0) return null;
  const fr = progress(frame, at, 8, EASE.arrive);
  const per = 2 * (box.w + box.h);
  const contents = progress(frame, at + 8, 4, EASE.arrive);
  const titleIn = progress(frame, titleAt, 5, EASE.arrive);
  const lead = progress(frame, at + 2, 6, EASE.arrive);
  const tr = trackFromPoints(leader);
  return (
    <g opacity={out}>
      <path d={dPts(leader)} fill="none" stroke={T.annotation} strokeWidth={LABEL.leader} strokeDasharray={`${tr.length * lead} ${tr.length + 10}`} />
      <rect x={leader[leader.length - 1][0] - 4} y={leader[leader.length - 1][1] - 4} width={8} height={8} fill={T.ink} opacity={lead} />
      <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={8} fill={T.panel} opacity={0.97 * fr} />
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        rx={8}
        fill="none"
        stroke={T.ink}
        strokeWidth={2}
        strokeDasharray={`${per * fr} ${per + 20}`}
      />
      <g opacity={contents}>{children}</g>
      <Txt x={box.x + 18} y={box.y + 34} text={title} opacity={titleIn} slide={(1 - titleIn) * LABEL.slide} />
    </g>
  );
};

export const AMD_BOX = {x: 160, y: 236, w: 360, h: 220};
export const LAPTOP_BOX = {x: 900, y: 552, w: 364, h: 142};

export const Stops: React.FC<{frame: number}> = ({frame}) => {
  const a = AMD_BOX;
  const l = LAPTOP_BOX;
  // AMD: one processor package holding the cores and an I/O die with BOTH blocks
  const pk = {x: a.x + 30, y: a.y + 76, w: 300, h: 124};
  // laptop: a mainboard with one processor package, its own EC chip, and a battery; no ATX supply
  const lb = {x: l.x + 18, y: l.y + 70, w: 210, h: 56};
  return (
    <g>
      <Callout
        frame={frame}
        box={a}
        at={F.amd - 6}
        titleAt={F.amd}
        title="Stop: AMD"
        outAt={F.stopsExit}
        leader={[
          [a.x + a.w, 360],
          [M.CPU.x, 360],
        ]}
      >
        <rect x={pk.x} y={pk.y} width={pk.w} height={pk.h} rx={10} fill={FILL.body} stroke={T.structure} strokeWidth={3} />
        <rect x={pk.x + 16} y={pk.y + 18} width={104} height={88} rx={6} fill={FILL.bodyDark} stroke={T.structure} strokeWidth={2} />
        <rect x={pk.x + 136} y={pk.y + 14} width={148} height={96} rx={6} fill={FILL.body} stroke={T.structure} strokeWidth={2} />
        <rect x={pk.x + 150} y={pk.y + 64} width={64} height={30} rx={5} fill={T.panel} stroke={T.structure} strokeWidth={2} />
        <rect x={pk.x + 226} y={pk.y + 24} width={46} height={46} rx={5} fill={FILL.bodyDark} stroke={T.structure} strokeWidth={2} />
        <Txt x={pk.x + 249} y={pk.y + 48} text="?" size={30} anchor="middle" color={T.structure} />
      </Callout>
      <Callout
        frame={frame}
        box={l}
        at={F.laptops - 6}
        titleAt={F.laptops}
        title="Stop: laptops"
        outAt={F.stopsExit}
        leader={[
          [l.x, 650],
          [M.CHIPSET.x + M.CHIPSET.w, 650],
        ]}
      >
        <path
          d={`M${lb.x + 8} ${lb.y}H${lb.x + lb.w - 30}L${lb.x + lb.w} ${lb.y + 20}V${lb.y + lb.h - 8}Q${lb.x + lb.w} ${lb.y + lb.h} ${lb.x + lb.w - 8} ${lb.y + lb.h}H${lb.x + 8}Q${lb.x} ${lb.y + lb.h} ${lb.x} ${lb.y + lb.h - 8}V${lb.y + 8}Q${lb.x} ${lb.y} ${lb.x + 8} ${lb.y}Z`}
          fill={FILL.body}
          stroke={T.structure}
          strokeWidth={3}
        />
        <rect x={lb.x + 16} y={lb.y + 10} width={74} height={36} rx={5} fill={FILL.bodyDark} stroke={T.structure} strokeWidth={2} />
        <rect x={lb.x + 112} y={lb.y + 17} width={24} height={24} rx={3} fill={T.panel} stroke={T.structure} strokeWidth={2} />
        {/* battery */}
        <rect x={l.x + 250} y={lb.y + 6} width={86} height={44} rx={6} fill={FILL.body} stroke={T.structure} strokeWidth={3} />
        <rect x={l.x + 336} y={lb.y + 19} width={7} height={18} rx={2} fill={T.structure} />
        {[0, 1, 2].map((k) => (
          <rect key={k} x={l.x + 258 + k * 26} y={lb.y + 14} width={18} height={28} rx={2} fill={FILL.detail} />
        ))}
        <path d={`M${lb.x + lb.w} ${lb.y + 34}H${l.x + 250}`} stroke={T.structure} strokeWidth={2} />
      </Callout>
    </g>
  );
};
