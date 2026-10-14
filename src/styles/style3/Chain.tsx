/**
 * S06: the chain of handoffs, run on the map itself under a second preview ("After the press" + dashed frame).
 * The hardware stays in soft-off; only the preview layer carries states:
 *   station 1  the lookout itself ("Always-on logic" + the ≈ eye badge), still breathing after it hands off
 *   station 2  "Power": a plate inside the PSU holding a short main-channel segment that fills (a power phase)
 *   station 3  the "?": a pip slot beside its badge that fills and keeps running; the "?" stays unnamed
 *   stations 4–6  three plates climbing the CPU's left side ("Firmware on CPU", "Loader", "Windows"), all run
 *              on the CPU, so the CPU node itself stays dark
 * Plates appear unnamed; each name lands with its Bit (f748, f781, f808, f832, f860). The token parks on
 * "Windows" (DRIVING). Each hop path draws 6 frames ahead of the token, lights behind it and fades 10 frames
 * after its landing. The whole layer lifts in f900–f912.
 */
import React from 'react';
import {EASE, LABEL, SANS, SignalRoute, TYPE, bitRun, progress, routePath, squarePath, type BitRun, type Pt} from '../../shared';
import {BitDraw} from './Bits';
import * as M from './map';
import {T} from './theme';
import {F} from './timeline';

/** Hop paths in world units (System framing during S06). */
export const HOP_PATHS: Pt[][] = [
  [
    [660, 631],
    [660, 826],
  ],
  [
    [660, 826],
    [774, 826],
    [774, 634],
  ],
  [
    [774, 634],
    [732, 634],
    [732, 515],
    [M.TOKEN_X, 515],
    [M.TOKEN_X, M.TICKS_Y[0]],
  ],
  [
    [M.TOKEN_X, M.TICKS_Y[0]],
    [M.TOKEN_X, M.TICKS_Y[1]],
  ],
  [
    [M.TOKEN_X, M.TICKS_Y[1]],
    [M.TOKEN_X, M.TICKS_Y[2]],
  ],
];

const liftOut = (frame: number, start = F.lift, frames = 6) => 1 - progress(frame, start, frames, EASE.exit);

type PlateState = 'empty' | 'running' | 'visited' | 'power';

const stateOf = (frame: number, states: Array<{at: number; s: PlateState}>): PlateState => {
  let st: PlateState = 'empty';
  for (const s of states) if (frame >= s.at) st = s.s;
  return st;
};
const borderOf = (st: PlateState) =>
  st === 'running' || st === 'power' ? `4px solid ${T.ink}` : st === 'visited' ? `3px solid ${T.annotation}` : `2px solid ${T.structure}`;

/**
 * A station plate (auto-sized from its text, so the empty plate already has its final size).
 * `right` = the plate's right edge (anchor 'right') or left edge (anchor 'left'); `cy` = its vertical centre.
 */
const Plate: React.FC<{
  frame: number;
  edge: number;
  anchor: 'right' | 'left';
  cy: number;
  name: string;
  popAt: number;
  landAt: number;
  states: Array<{at: number; s: PlateState}>;
  lead?: React.ReactNode;
  pip?: boolean;
}> = ({frame, edge, anchor, cy, name, popAt, landAt, states, lead, pip = true}) => {
  if (frame < popAt) return null;
  const pop = progress(frame, popAt, 4, EASE.arrive);
  const out = liftOut(frame);
  if (out <= 0) return null;
  const st = stateOf(frame, states);
  const textIn = progress(frame, landAt, 5, EASE.arrive);
  const W = 900;
  const H = 200;
  const lines = name.split('\n');
  const pipEl = !pip ? null : st === 'running' ? (
    <div style={{width: 12, height: 12, borderRadius: 1.5, background: T.ink, flex: 'none'}} />
  ) : (
    <div style={{width: 12, height: 12, boxSizing: 'border-box', borderRadius: 1.5, border: `2px solid ${st === 'visited' ? T.annotation : T.structure}`, flex: 'none'}} />
  );
  return (
    <foreignObject x={anchor === 'right' ? edge - W : edge} y={cy - H / 2} width={W} height={H} style={{overflow: 'visible'}}>
      <div style={{width: W, height: H, display: 'flex', alignItems: 'center', justifyContent: anchor === 'right' ? 'flex-end' : 'flex-start', opacity: out}}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxSizing: 'border-box',
            padding: '4px 14px 4px 12px',
            borderRadius: LABEL.plateRadius,
            border: borderOf(st),
            background: 'rgba(255,255,255,0.97)',
            opacity: pop,
            transform: `scale(${0.9 + 0.1 * pop})`,
            transformOrigin: anchor === 'right' ? 'right center' : 'left center',
          }}
        >
          {pipEl}
          {lead}
          <div style={{opacity: textIn, transform: `translateX(${-(1 - textIn) * LABEL.slide}px)`}}>
            {lines.map((l, i) => (
              <div key={i} style={{fontFamily: SANS, fontWeight: 600, fontSize: TYPE.label, lineHeight: TYPE.lineHeight, color: T.ink, whiteSpace: 'nowrap'}}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </foreignObject>
  );
};

/** The "Power" plate's short main-channel segment (2 px walls, 14 px fill) that fills on its landing. */
const PowerSegment: React.FC<{fill: number}> = ({fill}) => (
  <svg width={72} height={18} style={{flex: 'none', display: 'block'}}>
    <rect x={0} y={2} width={72 * fill} height={14} fill={T.energy} />
    <path d="M0 1H72M0 17H72" stroke={T.structure} strokeWidth={2} />
  </svg>
);

/** CPU stage plates: right-aligned in the left rail (System framing), one per tick on the CPU's left side. */
const PLATE_RIGHT = 520;
const CPU_PLATES = [
  {name: 'Firmware\non CPU', tick: M.TICKS_Y[0]},
  {name: 'Loader', tick: M.TICKS_Y[1]},
  {name: 'Windows', tick: M.TICKS_Y[2]},
];

export const chainRuns = (P: (p: Pt) => Pt): BitRun[] =>
  HOP_PATHS.map((pts, i) => bitRun({path: routePath(pts.map(P), 8), depart: F.hops[i].depart, land: F.hops[i].land, label: `S06 hop ${i + 1}`}));

/** Hop paths (under the token): drawn ahead, lit behind, faded after landing. */
export const ChainPaths: React.FC<{frame: number; P: (p: Pt) => Pt; runs: BitRun[]}> = ({frame, P, runs}) => {
  if (frame < F.hops[0].depart - 6 || frame > F.lift + 12) return null;
  return (
    <g>
      {HOP_PATHS.map((pts, i) => {
        const h = F.hops[i];
        if (frame < h.depart - 6) return null;
        const op = 1 - progress(frame, h.land, 10, EASE.linear);
        if (op <= 0) return null;
        const d = routePath(pts.map(P), 8);
        return (
          <g key={i} opacity={op}>
            {i === 1 ? (
              // the one crossing: the board trace takes a 6 px gap where hop 2 passes
              <path d={`M${P([774, 694])[0]} ${P([774, 694])[1]}L${P([774, 722])[0]} ${P([774, 722])[1]}`} stroke={T.panel} strokeWidth={16} />
            ) : null}
            <SignalRoute path={d} runs={runs[i]} drawAt={h.depart - 6} drawFrames={6} />
          </g>
        );
      })}
    </g>
  );
};

export const ChainToken: React.FC<{frame: number; runs: BitRun[]}> = ({frame, runs}) => {
  if (frame < F.tokenIn || frame > F.lift + 6) return null;
  return <BitDraw frame={frame} runs={runs} restFrom={F.tokenIn} park fadeOutAt={F.lift} />;
};

export const ChainPlates: React.FC<{frame: number; P: (p: Pt) => Pt; qBadge: Pt}> = ({frame, P, qBadge}) => {
  if (frame < F.platesIn || frame > F.lift + 8) return null;
  const out = liftOut(frame);
  const pp = M.POWER_PLATE;
  const [px] = P([pp.x, pp.y]);
  const pcy = P([pp.x, pp.y + pp.h / 2])[1];
  // the "?" station: a pip slot beside the badge, filled (still running) from its landing
  const slot: Pt = [qBadge[0] + 44, qBadge[1]];
  const slotIn = progress(frame, F.platesIn + 3, 4, EASE.arrive);
  const running = frame >= F.hops[1].land;
  const segFill = progress(frame, F.hops[0].land, 8, EASE.linear);
  return (
    <g>
      {/* station 2: Power (inside the PSU): a power phase, an amber segment, no code */}
      <Plate
        frame={frame}
        edge={px}
        anchor="left"
        cy={pcy}
        name="Power"
        popAt={F.platesIn}
        landAt={F.hops[0].land}
        states={[{at: F.hops[0].land, s: 'power'}]}
        pip={false}
        lead={<PowerSegment fill={segFill} />}
      />
      {/* station 3: the "?" pip slot */}
      {slotIn > 0 ? (
        <g opacity={slotIn * out}>
          {running ? <path d={squarePath(slot[0], slot[1], 12, 1.5)} fill={T.ink} /> : <path d={squarePath(slot[0], slot[1], 10, 1)} fill="none" stroke={T.structure} strokeWidth={2} />}
        </g>
      ) : null}
      {/* stations 4–6: plates on the CPU's left side, ticks and stubs */}
      {CPU_PLATES.map((c, i) => {
        const popAt = F.platesIn + 6 + 3 * i;
        if (frame < popAt) return null;
        const landAt = F.hops[2 + i].land;
        const next = i < 2 ? F.hops[3 + i].land : Infinity;
        const tick = P([M.TICK_X0, c.tick]);
        const tickEnd = P([M.CPU.x, c.tick]);
        return (
          <g key={c.name}>
            <g opacity={out * progress(frame, popAt, 4, EASE.arrive)}>
              <path d={`M${PLATE_RIGHT} ${tick[1]}H${tickEnd[0]}`} stroke={T.structure} strokeWidth={2} />
              <path d={`M${tick[0]} ${tick[1] - 6}V${tick[1] + 6}`} stroke={T.structure} strokeWidth={2} />
            </g>
            <Plate
              frame={frame}
              edge={PLATE_RIGHT}
              anchor="right"
              cy={tick[1]}
              name={c.name}
              popAt={popAt}
              landAt={landAt}
              states={[
                {at: landAt, s: 'running'},
                {at: next, s: 'visited'},
              ]}
            />
          </g>
        );
      })}
    </g>
  );
};
