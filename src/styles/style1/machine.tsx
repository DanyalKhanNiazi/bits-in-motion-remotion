/**
 * The bench drawing assembled (left page), and its two states:
 *  - the page: the present, soft-off, never wiped (only notes, ticks and pencil are added to it);
 *  - the traced set: what the flash-forward sheet re-traces, in its "after the press" state.
 */
import React from 'react';
import {
  Bit,
  CHANNEL,
  EASE,
  EnergyChannel,
  STROKE,
  SignalRoute,
  makeTrack,
  pathLength,
  progress,
  routePath,
  type BitPosition,
  type BitRun,
} from '../../shared';
import {F} from './frames';
import * as L from './layout';
import {Bloom, Marks, S, nibSkin, wickP} from './nib';
import {
  ChipsetScene,
  TH,
  boardMarks,
  buttonMarks,
  caseMarks,
  cordMarks,
  cpuMarks,
  cpuTextMarks,
  dimmMarks,
  endTickMarks,
  flapMarks,
  headerMarks,
  leadMarks,
  pcieMarks,
  pin24Marks,
  psuMarks,
  psuNameMarks,
  rearIoMarks,
  regMarks,
  tickMarks,
  traceMarks,
  type ChipState,
} from './parts';

/** Plunger travel (px): only on the two spoken presses. f0 is already mid-travel; return by spring. */
export const capOffset = (frame: number): number => {
  const one = (at: number, ret: number): number => {
    if (frame < at) return 0;
    const pin = progress(frame, at - 1, 3, EASE.outCubic);
    const pout = progress(frame, ret, 4, EASE.outCubic);
    return L.BTN.travel * Math.max(0, pin - pout);
  };
  return Math.max(one(F.press1, F.capReturn1), one(F.press2, F.capReturn2));
};

/** Fill amount of the "?" badge on the page (emphasis, one device at a time). */
const badgeFill = (frame: number): number => {
  const w = (a: number, b: number) => progress(frame, a, 6, EASE.arrive) * (1 - progress(frame, b, 6, EASE.exit));
  return Math.max(w(F.qFill1, F.s05Out), w(F.qFill2, F.s07Out));
};

export const eyeAmount = (frame: number): number =>
  Math.max(
    progress(frame, F.eye1, 8, EASE.arrive) * (1 - progress(frame, F.s05Out, 6, EASE.exit)),
    progress(frame, F.eye2, 8, EASE.arrive) * (1 - progress(frame, F.lockOut, 6, EASE.exit)),
  );

export const pageChip = (frame: number, lens = false): ChipState => ({
  frame,
  qInk: 0,
  qFill: 0,
  qPip: 0,
  badge: badgeFill(frame),
  eye: eyeAmount(frame),
  eyeChip: lens,
  clock: progress(frame, F.wakeClock, 8, EASE.arrive),
});

export const sheetChip = (frame: number): ChipState => ({
  frame,
  qInk: wickP(frame, F.qWake, 5),
  qFill: progress(frame, F.qWake + 3, 2, EASE.arrive),
  qPip: progress(frame, F.qWake + 5, 2, EASE.arrive),
  badge: 0,
  eye: 0,
  clock: 0,
});

/**
 * S10–S11, "a small trickle the power supply keeps flowing": the brand shimmer (slow 90/90 dashes,
 * 1 px/frame, source → load) on both standby runs. The kit draws it as 10% black, which on a 6 px
 * light-theme amber line cannot be seen even at full size (review: the flow read as static), so the
 * style draws it itself as paper-light highlights on the amber fill. The fill stays continuous and
 * nothing travels as a mark: only its brightness drifts, at the brand's standby speed. Each 90 px
 * highlight is three nested dashes (90, 60 and 30 px, centred), so it brightens softly towards its
 * middle and reads as a glint moving along the line, not as a dashed line. It is drawn 1.5 px
 * narrower than the fill so it never lightens the nib walls.
 */
const SHIMMER_LAYERS: Array<{on: number; alpha: number}> = [
  {on: 90, alpha: 0.24},
  {on: 60, alpha: 0.22},
  {on: 30, alpha: 0.2},
];
const SHIMMER_PERIOD = CHANNEL.shimmerDash[0] + CHANNEL.shimmerDash[1]; // 180
const STBY_D = [routePath(L.STBY_CABLE, STROKE.channelBend), routePath(L.STBY_BOARD, STROKE.channelBend)];
const StandbyShimmer: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.shimmerFrom || frame >= F.shimmerTo) return null;
  const fade = Math.min(progress(frame, F.shimmerFrom, 8, EASE.arrive), 1 - progress(frame, F.shimmerTo - 8, 8, EASE.exit));
  if (fade <= 0) return null;
  const base = -frame * CHANNEL.shimmerSpeedStandby; // source → load
  return (
    <g>
      {STBY_D.map((d, i) =>
        SHIMMER_LAYERS.map((l, j) => (
          <path
            key={`${i}:${j}`}
            d={d}
            fill="none"
            stroke="#FFF8EC"
            strokeOpacity={l.alpha * fade}
            strokeWidth={CHANNEL.standby.fill - 1.5}
            strokeDasharray={`${l.on} ${SHIMMER_PERIOD - l.on}`}
            strokeDashoffset={base - (CHANNEL.shimmerDash[0] - l.on) / 2}
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
        )),
      )}
    </g>
  );
};

interface MachineProps {
  frame: number;
  /** 'page' = everything (the present); 'traced' = the flash-forward sheet's traced set. */
  set: 'page' | 'traced';
  chip: ChipState;
  cpuName?: number;
  readout?: number;
  /** Drawn above the wiring, below the chipset's blocks (the lit route). */
  routeLayer?: React.ReactNode;
  /** Drawn above everything in the machine (the Bit and its ripple). */
  bitLayer?: React.ReactNode;
}

/**
 * The machine, bottom to top: case, rear face (flap), PSU, board, idle parts, CPU, chipset base,
 * channels, lead + trace (+ lit route), switch, then the chipset's blocks above their wires.
 */
export const Machine: React.FC<MachineProps> = ({frame, set, chip, cpuName = 0, readout = 0, routeLayer, bitLayer}) => {
  const page = set === 'page';
  const off = capOffset(frame);
  const endTick = page ? progress(frame, F.endTick, 4, EASE.arrive) : 0;
  const psuName = page ? progress(frame, F.psuNameIn, 6, EASE.arrive) : 0;
  const t1 = page ? progress(frame, F.tick1, 5, EASE.arrive) : 0;
  const t2 = page ? progress(frame, F.tick2, 5, EASE.arrive) : 0;
  const lan = page ? progress(frame, F.wakeLan, 8, EASE.arrive) : 0;
  return (
    <g>
      {page ? <Marks marks={[...caseMarks(), ...cordMarks()]} seed="case" frame={frame} /> : null}
      <Marks marks={flapMarks()} seed="flap" frame={frame} />
      {t1 > 0 ? <Bloom marks={tickMarks(258, 296)} p={t1} seed="tick1" frame={frame} /> : null}
      {t2 > 0 ? <Bloom marks={tickMarks(344, 296)} p={t2} seed="tick2" frame={frame} /> : null}
      <Marks marks={psuMarks()} seed="psu" frame={frame} />
      {psuName > 0 ? <Marks marks={psuNameMarks(psuName)} seed="psuname" frame={frame} /> : null}
      {page ? <Marks marks={[...boardMarks(), ...rearIoMarks(), ...pcieMarks(), ...dimmMarks()]} seed="board" frame={frame} /> : null}
      <Marks marks={[...cpuMarks(frame), ...pin24Marks(), ...headerMarks()]} seed="parts" frame={frame} />
      {cpuName > 0 || readout > 0 ? <Marks marks={cpuTextMarks(cpuName, readout)} seed="cputext" frame={frame} /> : null}
      <ChipsetScene st={chip} seed={`chip${set}`} part="base" />
      {page ? <EnergyChannel kind="main" path={L.MAIN_CABLE} skin={nibSkin} theme={TH} seed="main" /> : null}
      <EnergyChannel kind="standby" path={L.STBY_CABLE} full skin={nibSkin} theme={TH} seed="stby1" />
      <EnergyChannel kind="standby" path={L.STBY_BOARD} full skin={nibSkin} theme={TH} seed="stby2" />
      {page ? <StandbyShimmer frame={frame} /> : null}
      <Marks marks={regMarks()} seed="reg" frame={frame} />
      <Marks marks={[...leadMarks(), ...traceMarks()]} seed="lead" frame={frame} />
      {page ? <LeadInk frame={frame} /> : null}
      {endTick > 0 ? <Bloom marks={endTickMarks()} p={endTick} seed="endtick" frame={frame} /> : null}
      {lan > 0 ? <Bloom marks={[S(L.LAN_ROUTE, TH.structure, 3, {role: 'route', seed: 'lan'})]} p={lan} seed="lan" frame={frame} /> : null}
      {chip.clock > 0 ? <Bloom marks={[S(L.CLOCK_ROUTE, TH.structure, 3, {clean: true})]} p={chip.clock} seed="clkroute" frame={frame} /> : null}
      {routeLayer}
      <Marks marks={buttonMarks(off)} seed="button" frame={frame} />
      <ChipsetScene st={chip} seed={`chip${set}`} part="blocks" />
      {bitLayer}
    </g>
  );
};

/**
 * The S12 hand-off run: the brand's 4-frame ease-in, then a linear cruise that would reach the end of
 * `path` at `land`. Its 5-frame ease-out belongs to the next section (the landing is at f1891, outside
 * the intro), so at f1889 the Bit is visibly still travelling (≈ 2 × cruise short of the lookout)
 * instead of creeping the last 1–2 px of an ease-out.
 */
export const cruiseRun = (path: string, depart: number, land: number, label: string): BitRun => {
  const track = makeTrack(path);
  const L = track.length;
  const T = land - depart;
  const a = 4;
  const v = L / (T - a / 2);
  const sAtT = (t: number): number => (t <= 0 ? 0 : t >= T ? L : t <= a ? (v * t * t) / (2 * a) : (v * a) / 2 + v * (t - a));
  const sAt = (f: number): number => sAtT(f - depart);
  const at = (f: number): BitPosition => {
    const s = sAt(f);
    const p = track.at(s);
    return {x: p.x, y: p.y, s, angle: p.angle, phase: f < depart ? 'before' : f >= land ? 'landed' : 'moving'};
  };
  const p0 = track.at(0);
  const p1 = track.at(L);
  return {label, depart, land, frames: T, speed: v, length: L, start: [p0.x, p0.y], end: [p1.x, p1.y], track, reverse: false, warnings: [], sAt, at};
};

/**
 * S03: "the button you pressed…": the switch's lead is named, so it inks on (a 6-frame wick from the
 * switch along the lead to the header, where the end-tick lands on "doesn't"), and dries back to grey
 * after the sentence's hold, before the S04 demonstration.
 */
const LEAD_LEN = pathLength(L.LEAD);
const LeadInk: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.leadInk || frame > F.leadDry + 8) return null;
  const on = progress(frame, F.leadInk, 6, EASE.outCubic);
  const dry = progress(frame, F.leadDry, 6, EASE.inCubic);
  const s1 = LEAD_LEN * on * (1 - dry);
  if (s1 <= 0.5) return null;
  return <>{nibSkin.stroke({d: L.LEAD, color: TH.ink, width: 4.2, trim: [0, s1], role: 'route', seed: 'leadink', frame, join: 'round'})}</>;
};

/** The lit route behind a travelling Bit (info, decaying over 10 frames). */
export const LitRoute: React.FC<{runs: BitRun | BitRun[]}> = ({runs}) => (
  <SignalRoute path={L.BTN_ROUTE} runs={runs} idle={false} skin={nibSkin} theme={TH} seed="lit" />
);

/** The Bit on the button route (absorbed into its ripple: no park). */
export const RouteBit: React.FC<{runs: BitRun | BitRun[]}> = ({runs}) => <Bit runs={runs} skin={nibSkin} theme={TH} />;
