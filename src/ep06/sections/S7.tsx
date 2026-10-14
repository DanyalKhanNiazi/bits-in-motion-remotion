/**
 * S7, P15–P17 [9935, 11976): the twist. Overwriting works on a hard drive and misses on an SSD.
 * Plan: docs/ep06/plans/S7_plan.md. Every timing comes from the word clock (at / P).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {at, P} from '../timing';
import {SECTION} from '../sections';
import {
  Archive,
  EASE,
  Footnote,
  Label,
  MOVERS,
  Prop,
  PAL,
  PHOTO,
  QuestionCard,
  RUNS,
  SplitCompare,
  Stage,
  Whip,
  ZoomThrough,
  archiveAnchors,
  archiveCam,
  clamp01,
  lerp,
  poseAt,
  prog,
  rgba,
  rnd,
  toScreen,
  track,
  win,
  type ArchiveEvent,
  type CamKey,
  type Pose,
  type PresetName,
} from '../kit';
import {QuoteStrip} from '../kit/ui';
import {GhostShred, LabLens, Roll, ShredBadge, SlotSwap, Stream, quad, slotMouth, type Pt} from './S7/parts';

const SEC = SECTION('S7');

/* ================================================================ the word clock */
const T = {
  // P15
  start: P(15).start,
  ssd: at(15, 'SSD').start,
  better: at(15, 'better').start,
  shredder: at(15, 'shredder').start,
  heres: at(15, "Here's").start,
  twist: at(15, 'twist').start,
  erase: at(15, 'erase').start,
  ssd2: at(15, 'SSD', 2).start,
  gets: at(15, 'gets').start,
  way: at(15, 'way').end,
  // P16
  p16: P(16).start,
  deliberate: at(16, 'deliberate').start,
  simple: at(16, 'simple').start,
  write: at(16, 'Write').start,
  data: at(16, 'data').start,
  replaced: at(16, 'replaced').start,
  place: at(16, 'place').end,
  nist: at(16, 'NIST').start,
  says: at(16, 'says').start,
  techniques: at(16, 'techniques').end,
  // P17
  p17: P(17).start,
  what: at(17, 'what').start,
  write17: at(17, 'write').start,
  yourself: at(17, 'yourself').end,
  onAnSsd: at(17, 'On an SSD', 2).start,
  windows: at(17, 'Windows').start,
  really: at(17, 'really').start,
  labels: at(17, 'labels').start,
  behind: at(17, 'Behind').start,
  decides: at(17, 'decides').start,
  keeps: at(17, 'keeps moving').start,
  noPart: at(17, 'no part').start,
  first: at(17, 'first').end,
  also: at(17, 'It also').start,
  cantSee: at(17, "can't see").start,
  all: at(17, 'all').end,
  writeOver: at(17, 'write over a file').start,
  land: at(17, 'land').start,
  oldCopies: at(17, 'old copies').start,
  reach1: at(17, 'reach').end,
  nist17: at(17, 'NIST').start,
  userCant: at(17, 'a user').start,
  end: SEC.to,
};

/* ================================================================ shot boundaries */
const ROLL = {at: T.twist - 12, dur: 24};
const W1 = {at: T.p16 - 6, dur: 12}; // whip right (toward the hard-drive side) → the overwrite slot
const Z2 = {at: T.write - 8, dur: 16}; // into the slot's mouth → the wall
const W3 = {at: T.p17 - 2, dur: 12}; // whip left → the SSD

/* ================================================================ P15 A: the better shredder (SplitCompare) */
const K = (f: number, p: Partial<Pose>, o: Partial<CamKey> = {}): CamKey => ({f, ...p, ...o});
const SPLIT_CAM = archiveCam('split');
const camL_A: CamKey[] = [K(T.start - 30, SPLIT_CAM), K(ROLL.at + 24, {...SPLIT_CAM, zoom: SPLIT_CAM.zoom * 1.06})];
const camR_A: CamKey[] = [K(T.start - 30, SPLIT_CAM), K(T.better - 8, {x: 1120, y: 470, zoom: 1.4}, {dur: 50}), K(ROLL.at + 24, {x: 1140, y: 480, zoom: 1.46})];
const EV_SHRED: ArchiveEvent[] = [{at: T.better - 6, op: 'sweep', target: 'photo', dur: 40}];
const shredTargets: Pt[] = (() => {
  const an = archiveAnchors({frame: T.start, state: 'SSD_ERASED'}, T.start);
  return PHOTO.map((id) => an.box(id)).sort((a, b) => a.x - b.x);
})();
const shotA = (f: number) => (
  <SplitCompare
    frame={f}
    left={{cam: camL_A, light: 'cool', render: (fr) => <Archive frame={fr} state="HDD_DELETED" />}}
    right={{
      cam: camR_A,
      light: 'ssd',
      render: (fr) => (
        <>
          <Archive frame={fr} state="SSD_ERASED" events={EV_SHRED} />
          <GhostShred frame={fr} appear={T.ssd - 4} feed={T.better - 4} feedDur={16} fly={T.shredder + 6} cx={1190} bladeY={500} w={360} targets={shredTargets} />
        </>
      ),
    }}
    hud={<ShredBadge frame={f} x={1768} y={316} at={T.shredder + 2} qAt={T.shredder + 13} />}
  />
);

/* ================================================================ P15 B: try to erase on purpose; the SSD gets in your way (full frame) */
const B0 = ROLL.at + Math.round(ROLL.dur / 2);
// a short rewind flick under the roll: the drive's sweep runs backwards, the photo's Bits relight (back to before housekeeping)
const RW = {at: B0, dur: 24};
const RX = B0 - 70;
const EV_RW: ArchiveEvent[] = [
  {at: RX, op: 'tag', target: 'photo', dur: 10},
  {at: RX + 14, op: 'sweep', target: 'photo', dur: 34},
];
const camB: CamKey[] = [K(B0 - 12, {x: 1290, y: 470, zoom: 1.5}), K(T.erase + 26, {x: 1570, y: 450, zoom: 2.05}, {dur: 50}), K(T.p16 + 10, {x: 1600, y: 462, zoom: 2.2})];
const BOX59: Pt = {x: 1464, y: 484};
const BOX63: Pt = {x: 1752, y: 484};
const HIT = T.ssd2 - 2; // the stream reaches 059's label: accepted
const LAND63 = T.gets; // ...but the drive puts the new data in 063 (neutral: nothing is lost)
const S_TOP: Pt = {x: 1464, y: -120};
const S_D: Pt = {x: 1464, y: 372};
const S_A: Pt = {x: 1464, y: 446};
const S_CURVE = quad(S_D, {x: 1560, y: 300}, {x: 1752, y: 446}, 18);
const ring = (c: Pt, u: number, color: string) => (
  <rect x={c.x - 38 - 14 * u} y={c.y - 38 - 14 * u} width={76 + 28 * u} height={76 + 28 * u} rx={10} fill="none" stroke={color} strokeWidth={5 * (1 - u) + 1} opacity={1 - u} />
);
const deflect = (f: number) => {
  const acc = f >= HIT && f < HIT + 16 ? (f - HIT) / 16 : -1;
  const amb = f >= HIT + 1 && f < HIT + 20 ? Math.exp(-(f - HIT - 1) / 6) : 0;
  const land = f >= LAND63 && f < LAND63 + 18 ? (f - LAND63) / 18 : -1;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <Stream frame={f} pts={[S_TOP, S_D]} t0={T.erase} dur={HIT - 6 - T.erase} ease={EASE.out} fadeAt={T.way - 4} width={5} />
      <Stream frame={f} pts={[S_D, S_A]} t0={HIT - 6} dur={6} ease={(t) => t} fadeAt={HIT + 2} width={5} />
      <Stream frame={f} pts={S_CURVE} t0={HIT + 2} dur={LAND63 - 2 - HIT} ease={EASE.inCubic} fadeAt={T.way - 4} width={5} />
      {acc >= 0 ? ring(BOX59, acc, '#FFFFFF') : null}
      {amb > 0.01 ? (
        <g opacity={amb}>
          <ellipse cx={S_A.x + 10} cy={S_A.y - 30} rx={70} ry={34} fill={PAL.drive} opacity={0.35} />
          <path d={`M${S_A.x - 46} ${S_A.y - 8}Q${S_A.x} ${S_A.y - 58} ${S_A.x + 52} ${S_A.y - 22}`} fill="none" stroke={PAL.driveHot} strokeWidth={6} strokeLinecap="round" />
        </g>
      ) : null}
      {land >= 0 ? (
        <>
          <rect x={BOX63.x - 32} y={BOX63.y - 32} width={64} height={64} rx={6} fill="#FFFFFF" opacity={0.45 * (1 - land)} />
          {ring(BOX63, land, PAL.ink)}
        </>
      ) : null}
    </svg>
  );
};
const shotB = (f: number) => {
  const rw = f < RW.at + RW.dur;
  const u = prog(f, RW.at, RW.dur, EASE.inOut);
  const af = rw ? Math.round(lerp(RX + 64, RX - 6, u)) : f;
  const env = rw ? Math.sin(Math.PI * clamp01((f - RW.at) / RW.dur)) : 0;
  const jit = rw ? (rnd(`s7-rw-${f}`) - 0.5) * 22 * env : 0;
  const stage = (
    <Stage frame={f} env={{kind: 'archive', light: 'ssd'}} cam={camB} shake={[{at: LAND63, strength: 0.45}]}>
      <Archive frame={af} state="SSD_DELETED" events={rw ? EV_RW : undefined} boxes={f >= LAND63 ? {63: 'old'} : undefined} />
      {deflect(f)}
    </Stage>
  );
  if (!rw) return stage;
  const band = ((f * 53) % 1300) - 120;
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: PAL.void}}>
      <AbsoluteFill style={{transform: `translateX(${jit.toFixed(1)}px)`, filter: `saturate(${(1 - 0.35 * env).toFixed(2)}) brightness(${(1 + 0.08 * env).toFixed(2)})`}}>{stage}</AbsoluteFill>
      <AbsoluteFill style={{background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.24) 0px, rgba(0,0,0,0.24) 2px, rgba(0,0,0,0) 2px, rgba(0,0,0,0) 5px)', opacity: 0.75 * env}} />
      <div style={{position: 'absolute', left: 0, top: band, width: 1920, height: 80, background: `linear-gradient(180deg, rgba(255,255,255,0), ${rgba('#DDEBFF', 0.18 * env)}, rgba(255,255,255,0))`}} />
      <svg width={92} height={56} viewBox="0 0 92 56" style={{position: 'absolute', left: 120, top: 110, opacity: env}}>
        <path d="M44 4 L4 28 L44 52 Z M88 4 L48 28 L88 52 Z" fill={PAL.ink} />
      </svg>
    </AbsoluteFill>
  );
};

/* ================================================================ P16 D: the overwrite slot on the hardware stage */
const SLOT_P = {x: 960, y: 600, w: 1040};
const slotCam: CamKey[] = [K(T.p16, {x: 960, y: 560, zoom: 0.94}), K(Z2.at + 4, {x: 930, y: 520, zoom: 1.08})];
const MOUTH_W = slotMouth(SLOT_P);
const slotMouthScreen = (f: number) => toScreen(poseAt(f, slotCam), MOUTH_W.x, MOUTH_W.y);
const shotSlot = (f: number) => {
  const m = slotMouthScreen(f);
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: 960, floor: 840, warm: 0.2}}
      cam={slotCam}
      shake={[{at: T.simple, strength: 0.7}]}
      hud={<Label frame={f} at={T.deliberate} exitAt={Z2.at + 2} text="Writing over it" x={m.x + 300} y={m.y - 250} to={{x: m.x + 40, y: m.y - 10}} side="right" size={52} />}
    >
      <SlotSwap frame={f} {...SLOT_P} enterAt={T.p16 + 2} liftAt={T.deliberate + 6} slamAt={T.simple} />
    </Stage>
  );
};

/* ================================================================ P16 E–F: every free box written over; the lab lens */
const WALL_CAM = archiveCam('wall');
const PB_CAM = archiveCam('photoBoxes');
const EV_WIPE: ArchiveEvent[] = [{at: T.data - 3, op: 'overwrite', target: 'free', dur: 84}];
const wallCam: CamKey[] = [
  K(Z2.at, {...WALL_CAM, zoom: WALL_CAM.zoom * 1.1}),
  K(T.data + 36, WALL_CAM),
  K(T.replaced - 4, PB_CAM, {dur: 38}),
  K(T.says, {x: 1210, y: 500, zoom: 1.96}),
  K(T.says + 90, {x: 1120, y: 470, zoom: 2.0}),
  K(T.says + 170, {x: 1010, y: 570, zoom: 1.96}),
  K(T.p17 + 12, {x: 1060, y: 540, zoom: 1.84}),
];
const box = (id: number): Pt => ({x: 712 + ((id - 1) % 16) * 72 + 32, y: 236 + Math.floor((id - 1) / 16) * 72 + 23});
const LENS_IN = T.nist + 6;
const PROBES = [
  {at: T.nist + 44, p: box(59)},
  {at: T.says + 50, p: box(22)},
  {at: T.says + 124, p: box(99)},
];
const lensAt = (f: number): Pt => {
  const keys: Array<[number, Pt]> = [
    [LENS_IN, {x: 1790, y: 150}],
    [PROBES[0].at, PROBES[0].p],
    [PROBES[0].at + 40, PROBES[0].p],
    [PROBES[1].at, PROBES[1].p],
    [PROBES[1].at + 36, PROBES[1].p],
    [PROBES[2].at, PROBES[2].p],
    [PROBES[2].at + 40, PROBES[2].p],
    [T.p17 + 4, {x: 560, y: 260}],
  ];
  const kx = keys.map(([fr, p]) => [fr, p.x] as const);
  const ky = keys.map(([fr, p]) => [fr, p.y] as const);
  return {x: track(f, kx), y: track(f, ky)};
};
const lensScan = (f: number) => {
  for (const pr of PROBES) if (f >= pr.at + 2 && f < pr.at + 34) return (f - pr.at - 2) / 32;
  return 0;
};
const shotWall = (f: number) => {
  const A = {frame: f, state: 'HDD_DELETED' as PresetName, events: EV_WIPE};
  const pose = poseAt(f, wallCam);
  const an = archiveAnchors(A, f, pose);
  const b59 = toScreen(pose, an.box(59).x, an.box(59).y);
  const L = lensAt(f);
  const lensOp = win(f, LENS_IN, T.p17 + 6, 10, 12);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={wallCam}
      shake={[{at: T.data + 4, strength: 0.25}, {at: T.data + 40, strength: 0.25}]}
      hud={
        <>
          <Label frame={f} at={T.replaced} exitAt={LENS_IN + 30} text="Replaced in place" x={b59.x - 110} y={Math.max(150, b59.y - 250)} to={{x: b59.x, y: b59.y - 24}} side="left" size={56} />
          <QuoteStrip frame={f} at={T.says} exitAt={T.p17 + 16} source="NIST, the US standards agency" sourceMode="line" reported="Overwriting typically hinders recovery" />
        </>
      }
    >
      <Archive {...A} />
      <LabLens
        frame={f}
        L={L}
        k={0.55}
        op={lensOp}
        mag={1.9}
        scan={lensScan(f)}
        tilt={1.2 * Math.sin(f / 23)}
        inner={<Archive frame={f} state="HDD_DELETED" events={EV_WIPE} show={{drawer: 0, map: 0, card: 0, threads: 0, ghost: 0, platter: 0}} />}
      />
    </Stage>
  );
};

/* ================================================================ P17: the SSD, behind the wall */
const LAYERS = archiveCam('layers');
const SPLIT_AT = T.labels + 7;
const MOVE_AT = T.keeps + 3;
const MOVE_DUR = 48;
const OW_AT = T.writeOver + 29;
const OW_DUR = 36;
const EV17_BASE: ArchiveEvent[] = [
  {at: T.windows - 2, op: 'readPulse', dur: 30},
  {at: SPLIT_AT, op: 'splitLayers', dur: 56},
  {at: OW_AT, op: 'overwrite', target: 'photo', dur: OW_DUR},
];
const EV17: ArchiveEvent[] = [...EV17_BASE, {at: MOVE_AT, op: 'remap', target: MOVERS, dur: MOVE_DUR}];
const EV17_MOVED: ArchiveEvent[] = [...EV17_BASE, {at: -1e6, op: 'remap', target: MOVERS, dur: 1}];
const EV17_FRESH: ArchiveEvent[] = [...EV17_BASE.filter((e) => e.op !== 'overwrite'), {at: -1e6, op: 'overwrite', target: 'photo', dur: 1}];
const ssdCam: CamKey[] = [
  K(W3.at, {x: 1330, y: 560, zoom: 1.15}),
  K(T.onAnSsd - 8, {x: 1370, y: 548, zoom: 1.2}),
  K(T.windows - 8, {x: 890, y: 485, zoom: 1.24}, {dur: 48}),
  K(T.labels + 6, {x: 1210, y: 470, zoom: 1.55}, {dur: 52}),
  K(SPLIT_AT + 58, LAYERS, {dur: 56}),
  K(T.keeps - 8, {x: 1270, y: 540, zoom: 1.02}),
  K(T.also, {x: 1290, y: 560, zoom: 1.0}),
  K(T.cantSee - 10, {x: 1720, y: 600, zoom: 1.32}, {dur: 56}),
  K(T.all + 8, {x: 1760, y: 610, zoom: 1.38}),
  K(T.writeOver + 20, {x: 1250, y: 540, zoom: 1.0}, {dur: 36}),
  K(T.land + 24, {x: 1300, y: 550, zoom: 1.04}),
  K(T.oldCopies + 40, {x: 1700, y: 600, zoom: 1.7}, {dur: 44}),
  K(T.nist17 + 40, {x: 1740, y: 640, zoom: 1.78}),
  K(T.userCant - 40, {x: 1480, y: 470, zoom: 1.6}, {dur: 80}),
  K(T.userCant + 14, {x: 1330, y: 540, zoom: 1.15}, {dur: 52}),
  K(T.end, LAYERS, {dur: 96}),
];
const PIDX = (id: number) => PHOTO.indexOf(id);
const owT = (id: number) => OW_AT + Math.round((PIDX(id) * (OW_DUR - 12)) / (PHOTO.length - 1));
const mvT = (i: number) => MOVE_AT + Math.round((i * (MOVE_DUR - 16)) / (MOVERS.length - 1));
const SPARE_IN = T.cantSee - 14;
const SPARE_OUT = T.writeOver - 6;
const shotSsd = (f: number) => {
  const A = {frame: f, state: 'SSD_DELETED' as PresetName, events: EV17};
  const pose = poseAt(f, ssdCam);
  const an = archiveAnchors(A, f, pose);
  const anOld = archiveAnchors({...A, events: EV17_BASE}, f, pose);
  const anNew = archiveAnchors({...A, events: EV17_MOVED}, f, pose);
  const anFresh = archiveAnchors({...A, events: EV17_FRESH}, f, pose);
  const sc = (p: Pt) => toScreen(pose, p.x, p.y);
  // the write streams: from above the label sheet down to the photo's labels, then (accepted) on to a fresh spot
  const streams: React.ReactNode[] = [];
  const hover = win(f, T.write17 - 2, T.onAnSsd - 6, 8, 10);
  if (hover > 0)
    RUNS.forEach((r, i) => {
      const c = an.box(r[1]);
      streams.push(<Stream key={`h${i}`} frame={f} pts={[{x: c.x - 40, y: -120}, {x: c.x, y: c.y - 78}]} t0={T.write17 - 2 + i * 3} dur={18} dashed width={4} opacity={hover * (0.75 + 0.25 * Math.sin(f / 4 + i))} />);
    });
  const writeWave = (t0: number, keyPfx: string, tailIn: number | undefined) =>
    PHOTO.forEach((id, i) => {
      const lab = an.box(id);
      const top = {x: lab.x - 150, y: lab.y - 640};
      const s1 = t0 + i * 2;
      const tLab = s1 + 22;
      const ns = anFresh.spot(id);
      const mid = {x: (lab.x + ns.x) / 2, y: Math.min(lab.y, ns.y) - 30};
      streams.push(<Stream key={`${keyPfx}a${id}`} frame={f} pts={quad(top, {x: lab.x - 40, y: lab.y - 260}, lab, 12)} t0={s1} dur={22} tail={tailIn} fadeAt={tailIn ? undefined : T.land + 34} width={3.2} />);
      const t2 = Math.max(tLab, keyPfx === 'w' ? owT(id) - 6 : tLab);
      streams.push(<Stream key={`${keyPfx}b${id}`} frame={f} pts={quad(lab, mid, ns, 14)} t0={t2} dur={12} tail={90} width={3} ease={EASE.inOut} />);
      if (keyPfx === 'u' && f >= t2 + 12 && f < t2 + 28) {
        const u = (f - t2 - 12) / 16;
        streams.push(<circle key={`${keyPfx}r${id}`} cx={ns.x} cy={ns.y} r={10 + 26 * u} fill="none" stroke="#FFFFFF" strokeWidth={3} opacity={0.8 * (1 - u)} />);
      }
    });
  if (f >= T.writeOver - 4 && f < T.land + 50) writeWave(T.writeOver, 'w', undefined);
  if (f >= T.userCant - 4 && f < T.userCant + 70) writeWave(T.userCant, 'u', 150);
  // "keeps moving data around": the drive re-points other files' labels; their data hops to fresh (spare) spots
  const swing: React.ReactNode[] = [];
  const swingOp = win(f, MOVE_AT - 12, T.also + 6, 10, 16);
  if (swingOp > 0)
    MOVERS.forEach((id, i) => {
      const lab = an.box(id);
      const o = anOld.spot(id);
      const n = anNew.spot(id);
      const t = mvT(i);
      const u = EASE.inOut(prog(f, t - 3, 14));
      const e = {x: lerp(o.x, n.x, u), y: lerp(o.y, n.y, u)};
      const mid = {x: (lab.x + e.x) / 2, y: Math.min(lab.y, e.y) - 30};
      swing.push(
        <g key={id} opacity={swingOp} fill="none" strokeLinecap="round">
          <path d={`M${lab.x} ${lab.y}Q${mid.x} ${mid.y} ${e.x} ${e.y}`} stroke={PAL.ink} strokeOpacity={0.22} strokeWidth={7} />
          <path d={`M${lab.x} ${lab.y}Q${mid.x} ${mid.y} ${e.x} ${e.y}`} stroke={PAL.ink} strokeWidth={2.2} />
          <circle cx={e.x} cy={e.y} r={4.5} fill={PAL.ink} />
          <circle cx={lab.x} cy={lab.y} r={3.5} fill={PAL.ink} />
        </g>,
      );
      swing.push(<Stream key={`hop${id}`} frame={f} pts={quad(o, {x: (o.x + n.x) / 2, y: Math.min(o.y, n.y) - 90}, n, 14)} t0={t - 4} dur={14} tail={70} width={3.4} />);
    });
  // the drive decides: an amber ping from the chip
  const ping = (t0: number, r1: number) => {
    if (f < t0 || f > t0 + 28) return null;
    const u = (f - t0) / 28;
    return <circle key={t0} cx={an.actor.x} cy={an.actor.y} r={30 + r1 * EASE.out(u)} fill="none" stroke={PAL.drive} strokeWidth={5 * (1 - u) + 1} opacity={0.9 * (1 - u)} />;
  };
  // labels
  const spareS = sc(an.spare);
  const fresh = sc(anFresh.spot(100));
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={ssdCam}
      hud={
        <>
          <QuestionCard frame={f} at={T.what + 2} exitAt={T.yourself + 15} text="Try the hard-drive method on an SSD?" y={190} scrim={0.4} size={76} />
          <Label frame={f} at={T.keeps} exitAt={T.first + 18} text="Keeps moving data around" x={120} y={102} side="right" size={52} />
          <Label frame={f} at={T.noPart} exitAt={T.first + 18} text="so no part wears out first" x={120} y={174} side="right" size={44} />
          <Label frame={f} at={T.cantSee + 13} exitAt={T.all + 30} text="Spare space Windows can't see" x={Math.min(1040, spareS.x - 60)} y={150} to={spareS} side="left" size={52} />
          <Label frame={f} at={T.land} exitAt={T.reach1 + 7} text="Can land somewhere fresh" x={1792} y={150} to={fresh} side="left" size={52} />
          <Footnote frame={f} at={SPLIT_AT + 44} exitAt={T.end - 26} text="Schematic, not to scale" y={1010} />
          <QuoteStrip frame={f} at={T.nist17 - 12} exitAt={T.end - 30} source="NIST · flash with spare cells" sourceMode="line" reported="Writing over it can't reach every place old data was stored" />
        </>
      }
    >
      <Archive {...A} />
      <SpareFlash frame={f} an={an} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {ping(T.decides - 2, 220)}
        {ping(T.decides + 12, 140)}
        {swing}
        {streams}
      </svg>
    </Stage>
  );
};

/* the spare-flash render slides out of the shadow beside the spare columns, outside Windows' lit cone */
const SpareFlash: React.FC<{frame: number; an: ReturnType<typeof archiveAnchors>}> = ({frame: f, an}) => {
  if (f < SPARE_IN - 2 || f > SPARE_OUT + 24) return null;
  return (
    <Prop
      frame={f}
      src="spare-flash_b"
      x={an.spare.x + 250}
      y={an.spare.y + 40}
      w={400}
      brightness={0.78}
      rim={{color: PAL.drive, strength: 0.35}}
      shadow={0.5}
      float={3}
      enter={{kind: 'slide', at: SPARE_IN, dur: 18, from: 'right', dist: 260}}
      exit={{kind: 'slide', at: SPARE_OUT, dur: 16, to: 'right', dist: 300}}
    />
  );
};

/* ================================================================ the section */
const VOID = () => <AbsoluteFill style={{background: PAL.void}} />;
export const S7: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(SEC.from, Math.min(SEC.to - 1, frame));
  if (f < T.start + 6) return <Whip frame={Math.max(f, T.start)} at={T.start - 6} dur={12} dir="left" a={VOID} b={shotA} />;
  if (f < ROLL.at + ROLL.dur) return <Roll frame={f} at={ROLL.at} dur={ROLL.dur} a={shotA} b={shotB} />;
  if (f < W1.at + W1.dur) return <Whip frame={f} at={W1.at} dur={W1.dur} dir="right" a={shotB} b={shotSlot} />;
  if (f < Z2.at + Z2.dur) {
    const m = slotMouthScreen(Z2.at);
    return <ZoomThrough frame={f} at={Z2.at} dur={Z2.dur} cx={m.x} cy={m.y} a={shotSlot} b={shotWall} />;
  }
  if (f < W3.at + W3.dur) return <Whip frame={f} at={W3.at} dur={W3.dur} dir="left" a={shotWall} b={shotSsd} />;
  return shotSsd(f);
};
