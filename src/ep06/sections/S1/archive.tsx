// S1 Archive shots: C (the wall → the SIGNATURE IMAGE) and D (SplitCompare: hard drive | SSD, "Gone?", the race tease,
// one Bit's route). The left panel continues C's Archive and camera exactly, so the compress at "On an SSD" is seamless.
import React from 'react';
import {
  Archive,
  ClockGlyph,
  EASE,
  Footnote,
  KineticText,
  PAL,
  PhotoBits,
  QuestionCard,
  SPLIT,
  SPRING,
  ScannerProp,
  SplitCompare,
  Stage,
  VerdictChip,
  archiveCam,
  boxC,
  clamp01,
  poseAt,
  prog,
  rgba,
  splitToScreen,
  springAt,
  toScreen,
  type ArchiveEvent,
  type CamKey,
  type Framing,
  type SplitSide,
} from '../../kit';
import {T} from './times';

const K = (f: number, fr: Framing, o: Partial<CamKey> = {}, opt?: {run?: number; lift?: number; box?: number}): CamKey => ({f, ...archiveCam(fr, opt), ...o});
const DRIFT = 0.5;

/* ---------------------------------------------------------------- C: the wall, then the signature */
const LAND = T.hardDrive + 30; // DriveDive: the Archive grows out of the drive from here
const SIG = T.crossed - 3; // the card has settled; the push starts
export const CAM_C: CamKey[] = [
  K(LAND, 'run', {zoom: 4.6}, {run: 1}),
  K(T.every + 40, 'photoBoxes', {dur: 46}),
  K(T.was, 'photoBoxes', {zoom: 2.0, x: 1146}),
  K(SIG, 'signature', {dur: SIG - T.was + 4}),
  K(T.onSsd, 'signature', {x: archiveCam('signature').x - 40, y: archiveCam('signature').y + 10, zoom: archiveCam('signature').zoom * 1.09}),
];
const CAM_L: CamKey[] = [...CAM_C, K(T.onSsd + 20, 'split')];
const LIFT = [
  [T.was + 2, 0],
  [SIG - 4, 1, EASE.inOut],
] as const;
const EV_HDD: ArchiveEvent[] = [
  {at: T.windowsOnly + 5, op: 'threads', dur: 16},
  {at: T.crossed, op: 'strike', dur: 10},
  {at: T.note + 14, op: 'flag', dur: 10},
  {at: T.note + 22, op: 'mapFlip', target: 'photo', dur: 16},
];
const hddProps = (fr: number) => ({frame: fr, state: 'HDD_SAVED' as const, light: 'cool' as const, events: EV_HDD, lift: LIFT});
const PHOTO_IDS = [21, 22, 23, 58, 59, 60, 98, 99, 100];

/** "exactly where it was": corner brackets snap onto the 9 photo boxes (hud) */
const Brackets: React.FC<{f: number}> = ({f}) => {
  const out = prog(f, T.was + 2, 12, EASE.inCubic);
  if (f < T.exactly - 2 || out >= 1) return null;
  const pose = poseAt(f, CAM_C, DRIFT);
  let d = '';
  PHOTO_IDS.forEach((id, i) => {
    const s = springAt(f, T.exactly + i * 2, SPRING.snap);
    if (s <= 0.01) return;
    const c = boxC(id);
    const p = toScreen(pose, c.x, c.y);
    const h = 32 * pose.zoom + 10 + (1 - Math.min(1, s)) * 40;
    const L = Math.max(10, h * 0.42);
    for (const [sx, sy] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]) {
      const x = p.x + sx * h;
      const y = p.y + sy * h;
      d += `M${x - sx * L} ${y}L${x} ${y}L${x} ${y - sy * L}`;
    }
  });
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: 1 - out}}>
      <path d={d} fill="none" stroke={rgba('#03060D', 0.55)} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={PAL.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** the signature texts: "Gone." as a dimming ghost (Windows' view) and "Only the note" (exit with the compress) */
const SigTexts: React.FC<{f: number; exit?: number}> = ({f, exit}) => {
  const ghost = 0.55 - 0.27 * prog(f, T.crossed, 70, EASE.out);
  return (
    <>
      <div style={{position: 'absolute', inset: 0, opacity: ghost}}>
        <KineticText frame={f} at={T.windowsOnly + 2} exitAt={exit} text="Gone." x={1500} y={250} size={190} mode="rise" color={PAL.ink} backing="none" />
      </div>
      <KineticText frame={f} at={T.note} exitAt={exit} text="Only the note" x={1480} y={600} size={96} mode="slam" />
    </>
  );
};

export const WallShot: React.FC<{f: number}> = ({f}) => (
  <Stage frame={f} env={{kind: 'archive', light: 'cool'}} cam={CAM_C} drift={DRIFT} shake={[{at: T.crossed + 1, strength: 0.7}]} hud={<><Brackets f={f} /><SigTexts f={f} /></>}>
    <Archive {...hddProps(f)} />
  </Stage>
);

/* ---------------------------------------------------------------- D: the split */
const SPLIT_AT = T.onSsd;
const PUSH_R = T.notBecause;
const BACK_R = T.theDrive - 6;
const CAM_R: CamKey[] = [
  K(SPLIT_AT, 'split'),
  K(PUSH_R, 'split', {x: 1170}),
  K(T.erasedIt + 4, 'split', {x: 1080, y: 90, zoom: 1.3, dur: T.erasedIt + 4 - PUSH_R}),
  K(BACK_R, 'split', {x: 1090, y: 96, zoom: 1.32}),
  K(T.cleans + 4, 'split', {x: 1190, y: 260, zoom: 1.0}),
  K(T.to, 'split', {x: 1210, y: 262, zoom: 1.04}),
];
const SWEEP = T.cleans;
const ssdProps = (fr: number) => ({frame: fr, state: 'SSD_DELETED' as const, lift: 1, events: [{at: SWEEP, op: 'sweep', target: 'photo', dur: 40}] as ArchiveEvent[]});

const panelOpts = (side: SplitSide) => ({cam: side === 'left' ? CAM_L : CAM_R, drift: DRIFT, at: SPLIT_AT, enter: 'compress' as const});
const boxOnScreen = (side: SplitSide, f: number, id: number) => {
  const c = boxC(id);
  return splitToScreen(side, f, panelOpts(side), c.x, c.y);
};

/** spotlight: dim the panel that is not being spoken about */
const dimOf = (f: number): {l: number; r: number} => {
  const on = (a: number, b: number) => prog(f, a, 8, EASE.inOut) * (1 - prog(f, b, 8, EASE.inOut));
  const l = on(T.onSsdQ - 2, T.lets - 10) + on(T.thenSsd - 2, T.windowsPc + 40);
  const r = on(T.onHdd - 2, T.onSsdQ - 2) + on(T.firstHdd - 2, T.thenSsd - 2);
  return {l: 0.55 * clamp01(l), r: 0.55 * clamp01(r)};
};
const Dim: React.FC<{f: number}> = ({f}) => {
  const d = dimOf(f);
  const box = (side: SplitSide, o: number) =>
    o > 0.01 ? <div style={{position: 'absolute', left: SPLIT[side].x0 - 8, top: SPLIT.content.y0 - 8, width: SPLIT[side].x1 - SPLIT[side].x0 + 16, height: SPLIT.content.y1 - SPLIT.content.y0 + 16, borderRadius: 18, background: rgba('#03050B', o)}} /> : null;
  return (
    <>
      {box('left', d.l)}
      {box('right', d.r)}
    </>
  );
};

/** the race tease: the same recovery scanner drops over each panel; beams start; the trays pulse "?" */
const Scanners: React.FC<{f: number}> = ({f}) => {
  if (f < T.probably - 4 || f > T.follow + 24) return null;
  return (
    <>
      {(['left', 'right'] as const).map((side, i) => {
        const at = T.probably + 2 + i * 6;
        const tgt = boxOnScreen(side, f, 59);
        const cx = (SPLIT[side].x0 + SPLIT[side].x1) / 2;
        return (
          <ScannerProp
            key={side}
            frame={f}
            x={cx + 170}
            y={560}
            w={430}
            float={2}
            shadow={0.5}
            enter={{kind: 'drop', at, dist: 600}}
            exit={{kind: 'lift', at: T.lets + 2 + i * 3, dur: 14}}
            beam={{at: at + 12, until: T.lets + 4}}
            beamTo={{x: tgt.x, y: tgt.y, rx: 120}}
            scan={{at: at + 16, dur: 26, every: 34, until: T.lets}}
            tray="unknown"
            trayAt={at + 20}
          />
        );
      })}
    </>
  );
};

/** one of the photo's Bits, followed: lifts out of the hard drive's 059, hops into the SSD's 059 */
const RouteBit: React.FC<{f: number}> = ({f}) => {
  if (f < T.follow - 2) return null;
  const a = boxOnScreen('left', T.follow, 59);
  const b = boxOnScreen('right', T.thenSsd, 59);
  const from = {x: a.x - 42, y: a.y - 42, w: 84, h: 84};
  const halo = clamp01(prog(f, T.follow + 6, 14)) * (1 - prog(f, T.windowsPc + 10, 10));
  const hop = prog(f, T.thenSsd, 26, EASE.inOut);
  const hx = hop > 0 ? b.x : a.x;
  const hy = hop > 0 ? b.y : a.y - 50;
  const pulse = ((f - T.follow) % 40) / 40;
  return (
    <>
      {halo > 0.01 && (hop <= 0 || hop >= 1) ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, opacity: halo}}>
          <circle cx={hx} cy={hy} r={42 + 34 * pulse} fill="none" stroke={PAL.ink} strokeWidth={4} opacity={0.75 * (1 - pulse)} />
          <circle cx={hx} cy={hy} r={42} fill="none" stroke={rgba(PAL.ink, 0.55)} strokeWidth={3} />
        </svg>
      ) : null}
      {hop <= 0 ? <PhotoBits frame={f} at={T.follow} dur={18} mode="dissolve" from={from} grid={[1, 1]} /> : null}
      {hop > 0 ? <PhotoBits frame={f} at={T.thenSsd} dur={26} mode="sink" from={from} to={[b]} grid={[1, 1]} hold /> : null}
    </>
  );
};

const splitHud = (f: number) => (
  <>
    <SigTexts f={f} exit={SPLIT_AT} />
    <Dim f={f} />
    <KineticText frame={f} at={T.may} exitAt={T.theDrive + 4} text="May disappear soon after" x={(SPLIT.right.x0 + SPLIT.right.x1) / 2} y={846} size={64} mode="rise" />
    <ClockGlyph frame={f} x={1772} y={296} size={96} at={SWEEP - 4} exitAt={T.goneQ - 8} />
    <Footnote frame={f} at={SWEEP} exitAt={T.goneQ - 8} text="Illustrative timing" x={1000} y={1000} />
    <Scanners f={f} />
    <RouteBit f={f} />
    <KineticText frame={f} at={T.thenSsd} exitAt={T.windowsPc + 40} text="→" x={SPLIT.divider} y={SPLIT.header.cy} size={60} mode="pop" backing="none" />
    <QuestionCard frame={f} at={T.goneQ} exitAt={T.notYet - 10} text="Gone?" y={500} size={180} scrim={0.6} />
  </>
);

export const SplitShot: React.FC<{f: number}> = ({f}) => (
  <SplitCompare
    frame={f}
    at={SPLIT_AT}
    enter="compress"
    left={{cam: CAM_L, drift: DRIFT, light: 'cool', render: (fr) => <Archive {...hddProps(fr)} />}}
    right={{cam: CAM_R, drift: DRIFT, light: 'ssd', render: (fr) => <Archive {...ssdProps(fr)} />}}
    leftChip={<VerdictChip frame={f} at={T.notYet} exitAt={T.lets - 6} text="Not yet." tone="kept" x={0} y={0} />}
    rightChip={<VerdictChip frame={f} at={T.probably} exitAt={T.lets - 2} text="Probably, but not certainly." tone="lost" x={0} y={0} />}
    hud={splitHud(f)}
  />
);
