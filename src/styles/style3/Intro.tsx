/**
 * Bits in Motion · Episode 01 intro · Style 3: LIVING SCHEMATIC (composition "LivingSchematic").
 *
 * One cool, light system map of a real PC, drawn like a transit map, on screen from frame 0 in the true
 * soft-off state (off, but plugged in). A camera that never cuts moves between named framings (System x1.0,
 * Power path x1.6, the ride toward Chipset x3.6). Everything that changes stays changed. Time is shown in
 * place: "After the press" is the same map inside a dashed preview frame, and the return is a visible rewind.
 *
 * All timing is absolute (timeline.ts); sound cues come from cues.json. See STORYBOARD.md and REPORT.md.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {
  Brackets,
  EASE,
  EnergyChannel,
  EyeBadge,
  KitProvider,
  LensRing,
  PoweredWash,
  SignalRoute,
  StateGlyph,
  StatePill,
  bitRun,
  cleanSkin,
  clamp01,
  lerp,
  minTagExit,
  polyPath,
  progress,
  routePath,
  type BitRun,
  type Pt,
} from '../../shared';
import {BitDraw, RewindBit} from './Bits';
import {POWER, apply, camAt, powerWeight, type Cam} from './camera';
import {ChainPaths, ChainPlates, ChainToken, chainRuns} from './Chain';
import {QBadge, accent, qBadgeFill} from './Glyphs';
import {Fork, FORK_STEM, ScopeLine, SignInArc, Stops} from './Insets';
import {MapBase, MapOver} from './MapDraw';
import * as M from './map';
import {Breadcrumb, HeaderSlot, KeyPlan, PreviewFrame, Readout, type HeaderEntry} from './Overlays';
import {Tag} from './Tag';
import {FILL, T} from './theme';
import {F} from './timeline';

/* ------------------------------------------------------------------------------------------------ constants */
const HEADER: HeaderEntry[] = [
  {at: F.chipIn, label: 'After the press'},
  {at: F.softOff, label: 'Soft-off', shrinkAt: 400},
  {at: F.whenPressed, label: 'When pressed', outAt: F.whenPressedOut},
  {at: F.softOff2, label: 'Soft-off', shrinkAt: F.pullBack},
  {at: F.preview2, label: 'After the press'},
  {at: F.lift + 6, label: 'Soft-off', size: 34, outAt: F.softOffLeave},
  {at: F.intel, label: 'Intel desktop'},
  {at: F.stopsExit, label: 'Soft-off', size: 34},
  {at: F.now, label: 'Now'},
];

const LOOK_C = M.center(M.LOOKOUT);
const Q_C = M.center(M.QBLOCK);

/* ------------------------------------------------------------------------------------------------ pieces */
const DotGrid: React.FC<{cam: Cam}> = ({cam}) => {
  const P = 48 * cam.s;
  const ox = cam.tx - P / 2;
  const oy = cam.ty - P / 2;
  return (
    <>
      <defs>
        <pattern id="s3grid" patternUnits="userSpaceOnUse" x={ox} y={oy} width={P} height={P}>
          <circle cx={P / 2} cy={P / 2} r={1.5} fill={FILL.grid} />
        </pattern>
      </defs>
      <rect x={0} y={0} width={1920} height={1080} fill="url(#s3grid)" />
    </>
  );
};

/** Energy channels: standby live (thin) from f0; main empty for the whole intro. */
const Channels: React.FC<{cam: Cam; shimmer?: boolean}> = ({cam, shimmer}) => {
  const P = (p: Pt) => apply(cam, p);
  return (
    <>
      <EnergyChannel kind="main" path={routePath(M.MAIN_PATH.map(P), 10)} />
      <EnergyChannel kind="standby" path={routePath(M.STANDBY_PATH.map(P), 10)} full shimmer={shimmer ? {from: F.shimmer, to: F.s10Exit} : undefined} />
    </>
  );
};

/** The map seen through a magnify Lens (x4): the same scene, same states, drawn natively at the lens scale. */
const LensView: React.FC<{cam: Cam; frame: number; eyeAt?: number; eyeOut?: number; qScale?: number}> = ({cam, frame, eyeAt, eyeOut, qScale = 1}) => {
  const P = (p: Pt) => apply(cam, p);
  const qTR = P(M.topRight(M.QBLOCK));
  const lTR = P(M.topRight(M.LOOKOUT));
  return (
    <g>
      <MapBase cam={cam} frame={frame} />
      <Channels cam={cam} />
      <SignalRoute path={routePath(M.BUTTON_ROUTE.map(P), 8)} />
      <MapOver cam={cam} frame={frame} />
      <StateGlyph x={lTR[0]} y={lTR[1]} state="ALWAYS_ON" />
      <StateGlyph
        x={qTR[0]}
        y={qTR[1]}
        timeline={[
          {at: -1, state: 'OFF'},
          {at: F.qWakes, state: 'ON'},
          {at: F.ret, state: 'OFF'},
        ]}
      />
      <QBadge c={P(M.QBADGE)} fill={0} scale={qScale} />
      {eyeAt !== undefined ? <EyeBadge x={P([LOOK_C[0], 612])[0]} y={P([LOOK_C[0], 612])[1]} width={56} inAt={eyeAt} outAt={eyeOut} /> : null}
    </g>
  );
};

/** S03 net trace: a 3 px grey line grown BESIDE the lead to an end-tick at the header (no moving head). */
const NetTrace: React.FC<{frame: number; P: (p: Pt) => Pt}> = ({frame, P}) => {
  if (frame < F.netTrace || frame > F.netTick + 30 + 8) return null;
  const x = M.BUTTON_C[0] - 12;
  const y0 = M.BUTTON_C[1] - M.BUTTON_R;
  // the end tick sits just below the header (drawn ON the header's bottom edge it hid under the connector's outline)
  const y1 = M.LEAD_END_Y + 10;
  const g = clamp01((frame - F.netTrace) / (F.netTick - F.netTrace));
  const y = lerp(y0, y1, g);
  const op = 1 - progress(frame, F.netTick + 30, 8, EASE.exit);
  const a = P([x, y0]);
  const b = P([x, y]);
  const tick = g >= 1 ? P([x, y1]) : null;
  return (
    <g opacity={op}>
      <path d={`M${a[0] - 5} ${a[1]}H${a[0] + 5}`} stroke={T.annotation} strokeWidth={3} />
      <path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke={T.annotation} strokeWidth={3} />
      {tick ? <path d={`M${tick[0] - 7} ${tick[1]}H${tick[0] + 7}`} stroke={T.annotation} strokeWidth={4} /> : null}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------ the intro */
const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const P = (p: Pt): Pt => apply(cam, p);
  const w = powerWeight(frame);
  const slot = (sys: Pt, pow: Pt): Pt => [lerp(sys[0], pow[0], w), lerp(sys[1], pow[1], w)];
  /** A text slot at Power path, as an offset from the anchor's Power-path screen position. */
  const pw = (anchorW: Pt, dx: number, dy: number): Pt => {
    const a = apply(POWER, anchorW);
    return [a[0] + dx, a[1] + dy];
  };

  // the press route (lead + header + trace), in screen space for this frame
  const routeD = routePath(M.BUTTON_ROUTE.map(P), 8);
  const runs: BitRun[] = [];
  const inWin = (a: number, b: number) => frame >= a - 4 && frame <= b + 14;
  const ffRun = inWin(F.ffRest, F.ffLand) ? bitRun({path: routeD, depart: F.ffDepart, land: F.ffLand, label: 'flash-forward'}) : null;
  const s04Run = inWin(F.s04Rest, F.s04Land) ? bitRun({path: routeD, depart: F.s04Depart, land: F.s04Land, label: 'S04'}) : null;
  const s12Run = frame >= F.s12Depart - 4 ? bitRun({path: routeD, depart: F.s12Depart, land: F.nextLand, allowLong: true, label: 'S12 (carried by the ride)'}) : null;
  const rewRun = inWin(F.ret, F.rewindLand) ? bitRun({path: routeD, depart: F.ret, land: F.rewindLand, reverse: true, label: 'rewind'}) : null;
  for (const r of [ffRun, s04Run, s12Run]) if (r) runs.push(r);
  const hopRuns = frame >= F.hops[0].depart - 8 && frame <= F.lift + 12 ? chainRuns(P) : null;

  // glyph anchors
  const cpuTR = P(M.topRight(M.CPU));
  const lookTR = P(M.topRight(M.LOOKOUT));
  const qTR = P(M.topRight(M.QBLOCK));
  const dimmTR = P([M.DIMMS[3].x + M.DIMMS[3].w, M.DIMMS[3].y - 8]);
  const m2TR = P(M.topRight(M.M2));
  const qBadgeC = P(M.QBADGE);
  const qFill = qBadgeFill(frame, [
    {at: F.handOver, out: F.lens2Close},
    {at: F.qHidden, out: F.qUnfill},
  ]);
  const qScale = Math.max(accent(frame, F.smaller), accent(frame, F.hops[1].land));

  // lens cameras (x4 of the map, natively drawn)
  // Lens #1 magnifies the "?" block itself: the ring sits right of the board, level with the block, so its leader
  // runs straight across empty board to a target ON the block it shows (review fix: the target used to sit on the
  // chipset's left edge, by the lookout, while the view showed the "?" block at the other corner).
  const L1: Pt = [1392, Q_C[1]];
  const lens1Target: Pt = [M.QBLOCK.x + M.QBLOCK.w, Q_C[1]];
  const lens1Cam: Cam = {s: 4, tx: L1[0] - 4 * Q_C[0], ty: L1[1] - 4 * Q_C[1]};
  // Lens #2 frames "that circuit": the lookout with its two feeds entering from below (the amber standby channel
  // and the button's trace) and the eye badge on its top edge (review fix: it used to show only the block's top edge).
  const L2: Pt = [1560, 480];
  const lens2Focus: Pt = [660, 636];
  const lens2Cam: Cam = {s: 4, tx: L2[0] - 4 * lens2Focus[0], ty: L2[1] - 4 * lens2Focus[1]};

  // "Main rails: OFF" rides with the PSU. After the voice ends it fades as the ride starts (f1856–f1866), so it never
  // pops out in two frames when the camera carries its anchor toward the caption zone; the spatial guard stays.
  const psuBR = P([M.PSU.x + M.PSU.w, M.PSU.y + M.PSU.h]);
  const railsVis = clamp01((948 - psuBR[1]) / 16) * (1 - progress(frame, F.ride + 6, 10, EASE.exit));

  // "Always-on logic": at Power path a 45° leader, with the plate clear of the board's edge; during a move the
  // plate's x lags its y (w^1.5) so it passes below the rear I/O stack instead of grazing it.
  const aolAnchorW: Pt = [M.LOOKOUT.x, LOOK_C[1]];
  const aolSys: Pt = [508, LOOK_C[1]];
  const aolPow: Pt = pw(aolAnchorW, -120, 120);
  const aolEnd: Pt = [lerp(aolSys[0], aolPow[0], Math.pow(w, 1.5)), lerp(aolSys[1], aolPow[1], w)];

  const bracketBox = (() => {
    const c = P(M.BUTTON_C);
    const r = M.BUTTON_R * cam.s;
    return {x: c[0] - r, y: c[1] - r, w: 2 * r, h: 2 * r};
  })();

  return (
    <AbsoluteFill style={{background: T.surface}}>
      <KitProvider theme={T} skin={cleanSkin}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
          <DotGrid cam={cam} />
          {/* hardware (world space, constant line weights) */}
          <MapBase cam={cam} frame={frame} />
          {/* S11: the standby-powered domain (only a small region of the board) */}
          <PoweredWash d={polyPath(M.WASH.map(P), true)} at={F.wash} ground={T.panel} boundary />
          <Channels cam={cam} shimmer />
          {/* routes */}
          <SignalRoute path={routeD} runs={runs} />
          <SignalRoute path={routePath(M.WAKE_NET.map(P), 8)} drawAt={F.wake} drawFrames={8} />
          <SignalRoute path={routePath(M.WAKE_NET2.map(P), 8)} drawAt={F.wake + 4} drawFrames={8} />
          <SignalRoute path={routePath(M.WAKE_CLOCK.map(P), 8)} drawAt={F.wake + 8} drawFrames={8} />
          <NetTrace frame={frame} P={P} />
          {hopRuns ? <ChainPaths frame={frame} P={P} runs={hopRuns} /> : null}
          <MapOver cam={cam} frame={frame} />
          {/* pips and badges */}
          <StateGlyph x={cpuTR[0]} y={cpuTR[1]} state="OFF" />
          <StateGlyph x={dimmTR[0]} y={dimmTR[1]} state="OFF" />
          <StateGlyph x={m2TR[0]} y={m2TR[1]} state="OFF" />
          <StateGlyph x={lookTR[0]} y={lookTR[1]} state="ALWAYS_ON" />
          <StateGlyph
            x={qTR[0]}
            y={qTR[1]}
            timeline={[
              {at: -1, state: 'OFF'},
              {at: F.qWakes, state: 'ON'},
              {at: F.ret, state: 'OFF'},
            ]}
          />
          <QBadge c={qBadgeC} fill={qFill} scale={qScale} />
          {/* Bits */}
          {ffRun ? <BitDraw frame={frame} runs={ffRun} restFrom={F.ffRest} /> : null}
          {rewRun ? <RewindBit frame={frame} run={rewRun} absorbFrames={1} /> : null}
          {s04Run ? <BitDraw frame={frame} runs={s04Run} restFrom={F.s04Rest} /> : null}
          {s12Run ? <BitDraw frame={frame} runs={s12Run} restFrom={F.s12Depart - 1} /> : null}
          {/* analogy: the ≈ eye badge sits ON the real always-on block */}
          <EyeBadge x={P([LOOK_C[0], 612])[0]} y={P([LOOK_C[0], 612])[1]} width={56} inAt={F.eyeBadge} outAt={F.lift} />
          {/* S06 chain (preview layer) */}
          <ChainPlates frame={frame} P={P} qBadge={qBadgeC} />
          {hopRuns ? <ChainToken frame={frame} runs={hopRuns} /> : null}
          {/* S07–S09 */}
          <SignInArc frame={frame} />
          <Fork frame={frame} />
          <ScopeLine frame={frame} />
          <Stops frame={frame} />
          {/* tags */}
          <Tag frame={frame} anchor={P([976, 852])} end={[1042, 852]} text="Power button" land={F.powerButtonTag} exitAt={F.powerButtonExit} minExit={minTagExit(F.powerButtonTag, 'Power button')} />
          <Tag frame={frame} anchor={P([616, 330])} end={[540, 330]} side="left" text="Main processor" land={F.mainProcessorTag} exitAt={F.mainProcExit} minExit={minTagExit(F.mainProcessorTag, 'Main processor')} />
          <Readout frame={frame} x={166} y={372} inAt={F.readout} outAt={F.readoutExit} />
          <Tag frame={frame} anchor={P([976, 852])} end={[1042, 852]} text="Power button" land={F.powerButtonTag2} exitAt={F.s03Exit} minExit={minTagExit(F.powerButtonTag2, 'Power button')} />
          <Tag frame={frame} anchor={P([950, 770])} end={[1042, 770]} text="Signal only" role="info" land={F.signalOnlyTag} exitAt={F.s03Exit} minExit={minTagExit(F.signalOnlyTag, 'Signal only')} />
          <Tag
            frame={frame}
            anchor={P(aolAnchorW)}
            end={aolEnd}
            side="left"
            text={'Always-on\nlogic'}
            land={F.s04Land}
            exitAt={F.lift}
            minExit={minTagExit(F.s04Land, 'Always-on logic')}
          />
          <Tag
            frame={frame}
            anchor={P([640, 718])}
            end={slot([520, 718], pw([640, 718], -168, -16))}
            side="left"
            text="Standby power"
            secondary="+5VSB · ATX"
            secondaryAt={F.standbyTag + 4}
            role="standby"
            land={F.standbyTag}
            exitAt={F.s10Exit}
            minExit={minTagExit(F.standbyTag, 'Standby power')}
          />
          <Tag frame={frame} anchor={P([470, 806])} end={pw([470, 806], -36, -39)} side="left" text="Power supply" land={F.psuTag} exitAt={F.s10Exit} minExit={minTagExit(F.psuTag, 'Power supply')} />
          <Tag frame={frame} anchor={P([404, 842])} end={pw([404, 842], -80, 76)} side="left" text="Plugged in" land={F.plugged} exitAt={F.s10Exit} minExit={minTagExit(F.plugged, 'Plugged in')} />
          <Tag frame={frame} anchor={P([628, 702])} end={pw([628, 702], -149, -5)} side="left" text="Standby-powered" role="standby" land={F.wash} exitAt={F.s11Exit} minExit={minTagExit(F.wash, 'Standby-powered')} />
          <Tag frame={frame} anchor={P([610, 620])} end={pw([610, 620], -160, 39)} side="left" text="Wake sources" role="info" land={F.wake} exitAt={F.s11Exit} minExit={minTagExit(F.wake, 'Wake sources')} />
          <Tag frame={frame} anchor={[1420, 568]} end={[1420, 612]} side="right" text="Sign-in screen" land={F.signIn} exitAt={F.s07Exit} minExit={minTagExit(F.signIn, 'Sign-in screen')} />
          <Tag
            frame={frame}
            anchor={FORK_STEM}
            elbow={[FORK_STEM[0], 898]}
            end={[FORK_STEM[0] + 20, 898]}
            side="right"
            text="Why different?"
            land={F.whyDifferent}
            exitAt={F.forkExit}
            minExit={minTagExit(F.whyDifferent, 'Why different?')}
          />
          {/* state pills */}
          <StatePill x={P([M.PSU.x + M.PSU.w, M.PSU.y])[0]} y={P([M.PSU.x + M.PSU.w, M.PSU.y])[1]} dock="inside-top-right" label="Main power: OFF" inAt={F.mainPowerPill} outAt={F.s03Exit} />
          {railsVis > 0 ? (
            <g opacity={railsVis}>
              <StatePill x={psuBR[0]} y={psuBR[1] - 74} dock="inside-top-right" label="Main rails: OFF" inAt={F.mainRails} />
            </g>
          ) : null}
          <StatePill x={P(M.topRight(M.ROCKER))[0]} y={P(M.topRight(M.ROCKER))[1]} dock="top-right" label="Rear switch: ON" inAt={F.rear} outAt={F.s10Exit} />
          {/* Lenses */}
          <LensRing cx={L1[0]} cy={L1[1]} d={300} openAt={F.lens1Open} closeAt={F.lens1Close} mode="magnify" chip="×4" target={lens1Target}>
            <LensView cam={lens1Cam} frame={frame} qScale={accent(frame, F.smaller)} />
          </LensRing>
          <LensRing cx={L2[0]} cy={L2[1]} d={300} openAt={F.lens2Open} settleAt={F.settle} closeAt={F.lens2Close} mode="magnify" chip="×4" target={P([M.LOOKOUT.x + M.LOOKOUT.w, LOOK_C[1]])}>
            <LensView cam={lens2Cam} frame={frame} eyeAt={F.eyeBadge} />
          </LensRing>
          {/* header zone: key plan (only while zoomed) and the one time/state slot */}
          <KeyPlan frame={frame} cam={cam} />
          <HeaderSlot frame={frame} timeline={HEADER} />
          <Breadcrumb frame={frame} cam={cam} inAt={F.chipIn} />
          {/* brackets lock on the button, on "like" */}
          <Brackets box={bracketBox} lockAt={F.lock} fadeAt={F.bracketsFade} />
          {/* the time marks: the dashed preview frame whenever the map shows a time other than now */}
          <PreviewFrame
            frame={frame}
            spans={[
              {in: F.frameIn, out: F.frameOut, outFrames: 10},
              {in: F.frame2In, out: F.lift + 2, outFrames: 8},
            ]}
          />
        </svg>
      </KitProvider>
    </AbsoluteFill>
  );
};

export default Intro;
