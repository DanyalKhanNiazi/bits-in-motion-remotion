/**
 * S8 P18: the strange reversal.
 *   A  the SSD_STALE layers (S7's last framing), "The strange reversal"
 *   B  the coin: face 1 = the SSD wall alone (the drive's sweep destroys the photo you'd like back), a 0→90→124° flip,
 *      face 2 = the split layers (your overwrite lands somewhere fresh, the old cyan stays lit); then it turns
 *      edge-on and the camera sinks to the amber chip that does both
 *   C  verdict on the hardware stage: the chip (ssd-board_c) flares, Windows' card dims
 */
import React from 'react';
import {
  Archive,
  EASE,
  GEOM,
  IndexCard,
  LAYER_VIEW,
  PIVOT,
  applyM,
  layerMatrix,
  KineticText,
  MOVERS,
  PAL,
  Prop,
  Stage,
  VerdictCard,
  VerdictChip,
  archiveCam,
  clamp01,
  lerp,
  poseAt,
  prog,
  rgba,
  toScreen,
  track,
  type ArchiveEvent,
  type CamKey,
} from '../../kit';
import {CUT, T} from './times';

export const LAY = archiveCam('layers');
/** S7 remaps the other files' data at 11202 (kit "keeps moving data around"): repeat it so the join is exact */
export const MOVERS_EV: ArchiveEvent = {at: 11202, op: 'remap', target: MOVERS, dur: 48};

/* ---------------------------------------------------------------- A: the strange reversal */
const CAM_A: CamKey[] = [
  {f: T.from - 30, ...LAY},
  {f: T.from, ...LAY},
  {f: CUT.coin + 4, x: LAY.x + 30, y: LAY.y - 6, zoom: LAY.zoom * 1.07, ease: 'inOut'},
];
export const ShotA: React.FC<{f: number}> = ({f}) => (
  <Stage
    frame={f}
    env={{kind: 'archive', light: 'ssd'}}
    cam={CAM_A}
    hud={<KineticText frame={f} at={T.strange} text="The strange reversal" x={960} y={150} size={104} mode="slam" />}
  >
    <Archive frame={f} state="SSD_STALE" events={[MOVERS_EV]} />
  </Stage>
);

/* ---------------------------------------------------------------- B: the coin */
const FLIP = T.resists; // 0 → 90 over 12 f
const FLIP_MID = FLIP + 12;
const EDGE0 = T.both; // turns toward edge-on
const EDGE1 = CUT.verdict;
/** the coin's orbit (deg): face 1 below 90, face 2 above */
export const orbitAt = (f: number): number =>
  f < FLIP_MID
    ? track(f, [
        [CUT.coin, 0],
        [CUT.coin + 30, 4],
        [CUT.coin + 60, -3],
        [FLIP - 16, 2],
        [FLIP, -9],
        [FLIP_MID, 90, EASE.inCubic],
      ])
    : track(f, [
        [FLIP_MID, 90],
        [FLIP_MID + 14, 131, EASE.out],
        [FLIP_MID + 26, 124],
        [EDGE0, 121],
        [EDGE1 - 6, 94, EASE.out],
      ]);
const F1POSE = {x: 1284, y: 590, zoom: 1.0};
const CAM_B: CamKey[] = [
  {f: CUT.coin, x: F1POSE.x + 70, y: F1POSE.y + 10, zoom: 0.95},
  {f: CUT.coin + 20, ...F1POSE, zoom: 0.98, ease: 'out'},
  {f: FLIP - 2, ...F1POSE, zoom: 1.03},
  {f: FLIP_MID + 22, ...LAY, zoom: LAY.zoom * 1.02, ease: 'inOut'},
  {f: EDGE0, x: LAY.x - 10, y: LAY.y + 6, zoom: LAY.zoom * 1.06},
  {f: EDGE1 - 10, x: 1120, y: 640, zoom: 0.9, ease: 'inOut'},
  {f: EDGE1 + 2, x: 850, y: 925, zoom: 2.1, ease: 'inCubic'},
];
const HIDE = {drawer: 0, map: 0, card: 0, threads: 0};
const F1_EVENTS: ArchiveEvent[] = [{at: T.destroy1 + 3, op: 'sweep', target: 'photo', dur: 36}];
const F2_EVENTS: ArchiveEvent[] = [
  MOVERS_EV,
  {at: T.destroy2 - 6, op: 'overwrite', target: 'photo', dur: 26},
  // the chip wakes as the coin turns edge-on (no box changes: an empty remap only keeps the drive busy)
  {at: EDGE0 + 6, op: 'remap', target: [], dur: 40},
];
/** on-screen width factor of text printed on the coin's face (1 at the face's rest angle) */
const faceScale = (o: number): number => (o < 90 ? Math.cos((o * Math.PI) / 180) : clamp01(Math.cos(((o - 180) * Math.PI) / 180) / Math.cos((56 * Math.PI) / 180)));

export const ShotB: React.FC<{f: number}> = ({f}) => {
  const o = orbitAt(f);
  const face1 = o < 90;
  const sx = Math.max(0.001, faceScale(o));
  const lineY = 540;
  const printed = (node: React.ReactNode) => (
    <div style={{position: 'absolute', inset: 0, transform: `scaleX(${sx.toFixed(4)})`, transformOrigin: `960px ${lineY}px`}}>{node}</div>
  );
  // the chip flares while the coin turns edge-on (hud glow over the actor)
  const pose = poseAt(f, CAM_B);
  const chip = toScreen(pose, 806, 952);
  const flare = prog(f, EDGE0 + 4, EDGE1 - EDGE0 - 4, EASE.inCubic);
  // the edge lights amber and runs down into the chip: what both faces have in common
  let edge: React.ReactNode = null;
  const trace = prog(f, EDGE0 + 10, EDGE1 - EDGE0 - 16, EASE.inOut);
  if (!face1 && trace > 0) {
    const m = layerMatrix({theta: o - 180, phi: LAYER_VIEW.phi, s: 1, gap: LAYER_VIEW.gap}, LAYER_VIEW.gap / 2);
    const a = applyM(m, PIVOT.x, GEOM.wall.y - 10);
    const b = applyM(m, PIVOT.x, GEOM.wall.y + GEOM.wall.h + 10);
    const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}L${b.x.toFixed(1)} ${b.y.toFixed(1)}Q${(b.x - 20).toFixed(1)} 952 ${(GEOM.actor.x + 70).toFixed(1)} 952`;
    edge = (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
        <path d={d} fill="none" stroke={PAL.drive} strokeOpacity={0.28} strokeWidth={26} strokeLinecap="round" pathLength={1} strokeDasharray={`${trace} 1`} />
        <path d={d} fill="none" stroke={PAL.driveHot} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={`${trace} 1`} />
      </svg>
    );
  }
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={CAM_B}
      hud={
        <>
          <KineticText frame={f} at={T.ssdTends + 2} exitAt={EDGE0 - 6} text="The SSD tends to…" x={960} y={96} size={72} mode="rise" />
          {face1 ? printed(<KineticText frame={f} at={T.destroy1} text="destroy files you'd like back" x={960} y={lineY} size={96} mode="slam" />) : null}
          {!face1 ? printed(<KineticText frame={f} at={Math.max(FLIP_MID + 2, T.resists + 13)} exitAt={EDGE0 - 2} text="resist when you destroy them" x={960} y={lineY} size={96} mode="slam" />) : null}
          {flare > 0 ? (
            <div
              style={{
                position: 'absolute',
                left: chip.x - 420,
                top: chip.y - 300,
                width: 840,
                height: 600,
                background: `radial-gradient(closest-side, ${rgba(PAL.driveHot, 0.55 * flare)}, ${rgba(PAL.drive, 0.22 * flare)} 45%, ${rgba(PAL.drive, 0)})`,
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
        </>
      }
    >
      {face1 ? (
        <Archive frame={f} state="SSD_TRIMMED" events={F1_EVENTS} show={HIDE} orbit={o} />
      ) : (
        <Archive frame={f} state="SSD_DELETED" layers="split" events={F2_EVENTS} show={HIDE} orbit={o} />
      )}
      {edge}
    </Stage>
  );
};

/* ---------------------------------------------------------------- C: the verdict on the hardware stage */
const CHIP = {x: 1250, y: 500, w: 880};
const CARD = {x: 520, y: 470, w: 500};
const CAM_C: CamKey[] = [
  {f: CUT.verdict, x: CHIP.x - 30, y: CHIP.y + 40, zoom: 1.42},
  {f: CUT.verdict + 10, x: CHIP.x - 60, y: CHIP.y + 34, zoom: 1.34, ease: 'out'},
  {f: T.onSsd + 26, x: 960, y: 520, zoom: 1.0, ease: 'inOut'},
  {f: CUT.dive, x: 990, y: 516, zoom: 1.07},
];
export const camC = CAM_C;
export const chipScreen = (f: number) => {
  const p = poseAt(f, CAM_C);
  return toScreen(p, CHIP.x, CHIP.y - 20);
};
export const ShotC: React.FC<{f: number}> = ({f}) => {
  const flare = prog(f, T.decides - 4, 14, EASE.out);
  const dim = prog(f, T.notWindows, 22, EASE.inOut);
  const cardIn = prog(f, T.onSsd - 8, 26, EASE.out);
  const rim = 0.55 + 0.25 * prog(f, CUT.verdict, 10) + 0.7 * flare;
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: 1150, floor: 800, warm: 0.45}}
      cam={CAM_C}
      shake={[{at: T.theDrive + 5, strength: 0.35}]}
      hud={
        <>
          {/* the chip leads the verdict (VerdictCard's own chip only shows with the card) */}
          <VerdictChip frame={f} at={T.onSsd + 3} exitAt={CUT.dive - 2} text="On an SSD" tone="neutral" x={960} y={770} size={48} />
          <VerdictCard frame={f} at={T.theDrive + 5} exitAt={CUT.dive - 2} text="The drive, not Windows, decides" accentWord="drive" y={860} />
        </>
      }
    >
      <div
        style={{
          position: 'absolute',
          left: CHIP.x - 620,
          top: CHIP.y - 440,
          width: 1240,
          height: 880,
          background: `radial-gradient(closest-side, ${rgba(PAL.drive, 0.2 + 0.3 * flare)}, ${rgba(PAL.drive, 0.06 + 0.1 * flare)} 50%, ${rgba(PAL.drive, 0)})`,
        }}
      />
      <div style={{position: 'absolute', inset: 0, opacity: lerp(1, 0.3, dim), transform: `translateX(${(1 - cardIn) * -380}px)`}}>
        {cardIn > 0 ? <IndexCard frame={f} x={CARD.x} y={CARD.y} w={CARD.w} state="struck" rot={-3} opacity={clamp01(cardIn * 1.6)} /> : null}
      </div>
      <Prop
        frame={f}
        src="ssd-board_c"
        x={CHIP.x}
        y={CHIP.y}
        w={CHIP.w}
        rim={{color: PAL.drive, strength: rim}}
        sweep={{at: [CUT.verdict + 2, T.decides - 2], dur: 24, color: PAL.driveHot}}
        brightness={1 + 0.18 * flare}
        float={4}
        shadow={0.55}
      />
    </Stage>
  );
};
