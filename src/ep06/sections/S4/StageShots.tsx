// S4 hardware-stage shots: the recovery scanner hero (P08) and the overwrite slot under the Microsoft warning (P09).
import React from 'react';
import {
  EASE,
  IndexCard,
  KineticText,
  PAL,
  Prop,
  QuoteStrip,
  ScannerProp,
  Stage,
  UI_REGIONS,
  cardH,
  clamp01,
  lerp,
  poseAt,
  prog,
  propPoint,
  quadMatrix,
  rgba,
  toScreen,
  type CamKey,
  type Quad,
} from '../../kit';
import {CUT, T} from './t';
import {ImpactRing} from './fx';
import {Tally} from './Tally';

/* ---------------------------------------------------------------- the scanner hero */
const SC = {x: 960, y: 548, w: 860} as const;
export const HERO_CAM: CamKey[] = [
  {f: CUT.whip1, x: 900, y: 520, zoom: 0.96},
  {f: T.theSpace, x: 940, y: 540, zoom: 1.04, ease: 'inOut'},
  {f: CUT.zt + 8, x: 905, y: 590, zoom: 1.22, ease: 'inOut'},
];
const CW = 360;
const CH = cardH(CW);
/** the photo's card lying on the scanner's plate (world quad), lifted by `lift` world px */
const plateQuad = (lift: number): Quad => {
  const P = UI_REGIONS.scanPlate;
  const cx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4;
  const cy = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4;
  const k = 0.84;
  return P.map(([x, y]) => {
    const q = propPoint('recovery-scanner_a', SC, cx + (x - cx) * k, cy + (y - cy) * k);
    return [q.x, q.y - lift] as const;
  }) as unknown as Quad;
};
export const plateCardCentre = (): {x: number; y: number} => {
  const q = plateQuad(0);
  return {x: (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, y: (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4};
};
export const heroPose = (f: number) => poseAt(f, HERO_CAM);

export const HeroShot: React.FC<{f: number}> = ({f}) => {
  const land = T.deleted;
  const fall = prog(f, land - 13, 13, EASE.inCubic);
  const bounce = f >= land ? 26 * Math.exp(-(f - land) / 3.2) * Math.abs(Math.sin((f - land) * 0.55)) : 0;
  const lift = (1 - fall) * 360 + bounce;
  const cardOp = prog(f, land - 13, 5);
  return (
    <Stage frame={f} env={{kind: 'stage', floor: 800, warm: 0.15, spot: 940}} cam={HERO_CAM} shake={[{at: T.microsoft, strength: 0.55}, {at: land, strength: 0.2}]}>
      <ScannerProp
        frame={f}
        {...SC}
        enter={{kind: 'drop', at: T.microsoft - 14, dist: 620}}
        shadow={{opacity: 0.7, dy: 6}}
        rim={{color: '#DCE6F7', strength: 0.7}}
        sweep={{at: [T.plainly - 6, T.marked + 20], dur: 34, strength: 0.9}}
        beam={{at: T.recPage}}
        scan={{at: T.recPage + 6, dur: 30, every: 56}}
      />
      {cardOp > 0 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: CW, height: CH, transformOrigin: '0 0', transform: quadMatrix(CW, CH, plateQuad(lift)), opacity: cardOp}}>
          <IndexCard frame={f} x={CW / 2} y={CH / 2} w={CW} state="struck" flagAt={T.marked + 6} float={false} shadow={0.7} />
        </div>
      ) : null}
    </Stage>
  );
};

/* ---------------------------------------------------------------- the overwrite slot (P09 warning) */
const OS = {x: 960, y: 610, w: 940} as const;
export const SLOT_CAM: CamKey[] = [
  {f: CUT.whip2, x: 930, y: 560, zoom: 0.95},
  {f: T.create, x: 950, y: 560, zoom: 1.02, ease: 'inOut'},
  {f: CUT.whip3 + 12, x: 990, y: 548, zoom: 1.1, ease: 'inOut'},
];
const STAGE_WRITES = [T.create + 4, T.overwrite + 2];
export const TALLY_HITS = [T.download + 1, T.update + 1, T.temp + 1, ...STAGE_WRITES];

export const SlotShot: React.FC<{f: number}> = ({f}) => {
  const sw = STAGE_WRITES[1];
  const after = f >= sw;
  const mouth = propPoint('overwrite-slot_a', OS, 640, 560);
  const flash = f >= sw - 2 && f < sw + 14 ? (f < sw ? 0.5 : Math.exp(-(f - sw) / 3.2)) : 0;
  const punch = f >= sw && f < sw + 20 ? 1 + 0.05 * Math.exp(-(f - sw) / 4) * Math.cos((f - sw) * 0.6) : 1;
  const nudge1 = f >= STAGE_WRITES[0] && f < STAGE_WRITES[0] + 16 ? 1 + 0.025 * Math.exp(-(f - STAGE_WRITES[0]) / 4) * Math.cos((f - STAGE_WRITES[0]) * 0.7) : 1;
  const pose = poseAt(f, SLOT_CAM);
  const m = toScreen(pose, mouth.x, mouth.y);
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', floor: 820, warm: 0.1, spot: 980}}
      cam={SLOT_CAM}
      shake={STAGE_WRITES.map((a, i) => ({at: a, strength: i ? 0.8 : 0.45}))}
      hud={
        <>
          <ImpactRing f={f} at={STAGE_WRITES[0]} x={m.x} y={m.y} r={150} />
          <ImpactRing f={f} at={STAGE_WRITES[1]} x={m.x} y={m.y} r={230} />
          <QuoteStrip frame={f} at={T.warns} exitAt={T.anyTime - 6} source="Microsoft warns" reported="any use of your computer can create files that overwrite that space" />
          <KineticText frame={f} at={T.anyTime} text="any time" x={960} y={196} size={120} mode="slam" accent={PAL.loss} role="keyword" />
          <Tally f={f} />
        </>
      }
    >
      <Prop
        frame={f}
        src={after ? 'overwrite-slot_a' : 'overwrite-slot_d'}
        {...OS}
        enter={{kind: 'rise', at: CUT.whip2 - 2, dur: 20, dist: 80}}
        float={3}
        shadow={{opacity: 0.65, dy: 4}}
        rim={{color: '#DCE6F7', strength: 0.6}}
        sweep={{at: [T.anyUse - 4, T.anyTime - 8], dur: 30, strength: 0.8}}
        nudge={{s: punch * nudge1, bright: 1 + flash * 0.9}}
      />
      {flash > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: mouth.x - 520,
            top: mouth.y - 300,
            width: 1040,
            height: 600,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.9 * flash)}, ${rgba('#FFD9DD', 0.35 * flash)} 40%, rgba(255,255,255,0))`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
      <div style={{position: 'absolute', left: mouth.x - 300, top: mouth.y - 120, width: 600, height: 240, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.loss, 0.22 * clamp01(lerp(0, 1, prog(f, sw, 6)) * (1 - prog(f, sw + 30, 40))))}, rgba(0,0,0,0))`}} />
    </Stage>
  );
};
export const slotPose = (f: number) => poseAt(f, SLOT_CAM);
