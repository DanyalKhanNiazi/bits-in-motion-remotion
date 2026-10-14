// S6 · P13: the drive reads the note (Archive, SSD), then the mid-film hero: Hard drive | SSD, both recovery scanners
// launched in exact mirror sync, "Unlisted" vs "Nothing left for a recovery tool".
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  Archive,
  ClockGlyph,
  PHOTO,
  EASE,
  Footnote,
  PAL,
  QuestionCard,
  SPLIT,
  SPRING,
  ScannerProp,
  SplitCompare,
  Stage,
  VerdictCard,
  VerdictChip,
  archiveAnchors,
  archiveCam,
  clamp01,
  lerp,
  poseAt,
  prog,
  rgba,
  scannerAnchors,
  springAt,
  splitToScreen,
  stagePose,
  toScreen,
  type ArchiveEvent,
  type CamKey,
  type Key,
  type TrayMode,
} from '../../kit';
import {T} from './T';

/* ---------------------------------------------------------------- the SSD archive (shot A = the right panel) */
// the TRIM note is just through the slot at the cut (t ≈ 0.62 of its path) and lands by the photo's first run on "note"
const TRIM_DUR = 174;
const TRIM_AT = T.note - TRIM_DUR;
const SSD_EVENTS: ArchiveEvent[] = [
  {at: T.from - 400, op: 'boundary'},
  {at: TRIM_AT, op: 'trim', dur: TRIM_DUR},
  {at: T.disposable, op: 'tag', target: 'photo', dur: 18},
];
const SCAN_AT = T.once + 13;
const RIGHT_EVENTS: ArchiveEvent[] = [...SSD_EVENTS, {at: T.erases, op: 'sweep', target: 'photo', dur: 34}, {at: SCAN_AT, op: 'scan', dur: 45}];

/* ---------------------------------------------------------------- the scanner (identical in both panels) */
const SC = {x: 1700, y: 60, w: 700} as const;
const SA = scannerAnchors(SC);
const BEAM_TO = {x: 1176, y: 520, rx: 420, ry: 230};
const COPY_AT = T.once + 27;
const TRAY_AT = T.once + 31;
const LEFT_EVENTS: ArchiveEvent[] = [
  {at: SCAN_AT, op: 'scan', dur: 45},
  {at: COPY_AT, op: 'copyOut', target: 'photo', dur: 36, to: SA.trayCard},
];

/* ---------------------------------------------------------------- cameras */
const BZ = archiveCam('boundary');
const PB = archiveCam('photoBoxes');
/** the race opens on the photo's 3 runs filling each panel (boxes ≈ 66 px), so the erase reads large */
const SB = archiveCam('splitBoxes');
const B1 = {x: 1417, y: 250, zoom: 1.1};
const B2 = {x: 1850, y: 72, zoom: 2.3};
export const CAM_A: CamKey[] = [
  {f: T.from, ...BZ},
  {f: T.disposable - 14, x: BZ.x + 12, y: BZ.y, zoom: BZ.zoom * 1.05, ease: 'linear'},
  {f: T.disposable + 16, x: PB.x, y: PB.y, zoom: PB.zoom, dur: 30},
  {f: T.prefers + 13, x: PB.x + 8, y: PB.y, zoom: PB.zoom * 1.02, ease: 'linear'},
  {f: T.when, x: SB.x, y: SB.y, zoom: SB.zoom, dur: T.when - T.prefers - 13},
];
const RACE_CAM: CamKey[] = [
  {f: T.when, x: SB.x, y: SB.y, zoom: SB.zoom},
  {f: T.once - 8, x: SB.x + 6, y: SB.y, zoom: SB.zoom * 1.04, ease: 'linear'},
  {f: T.once + 22, ...B1, dur: 30},
  {f: T.once + 54, ...B1, zoom: B1.zoom * 1.03, ease: 'linear'},
  {f: T.once + 90, ...B2, dur: 36},
  {f: T.depends + 4, ...B2, zoom: B2.zoom * 1.07, x: B2.x - 10, ease: 'linear'},
];
// Stage default drift (S5 ends on it); panels use the same so the compress lands exactly
const DRIFT = 1;

/* ---------------------------------------------------------------- shot A: the drive reads the note */
const archA = (f: number) => ({frame: f, state: 'SSD_DELETED' as const, events: SSD_EVENTS});

const Rings: React.FC<{pts: Array<{x: number; y: number; t: number; r: number}>}> = ({pts}) => (
  <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
    {pts.map((p, i) =>
      p.t >= 0 && p.t <= 1 ? (
        <g key={i}>
          <rect x={p.x - p.r * (0.55 + 0.6 * p.t)} y={p.y - p.r * (0.55 + 0.6 * p.t)} width={p.r * (1.1 + 1.2 * p.t)} height={p.r * (1.1 + 1.2 * p.t)} rx={p.r * 0.2} fill="none" stroke={PAL.drive} strokeWidth={4 * (1 - p.t) + 1} opacity={1 - p.t} />
          <rect x={p.x - p.r * 0.5} y={p.y - p.r * 0.5} width={p.r} height={p.r} rx={p.r * 0.14} fill={rgba(PAL.drive, 0.22 * (1 - p.t))} />
        </g>
      ) : null,
    )}
  </svg>
);

export const ShotA: React.FC<{frame: number; grade?: {vignette?: number}}> = ({frame: f, grade}) => {
  const A = archA(f);
  const pose = poseAt(f, CAM_A, DRIFT);
  const an = archiveAnchors(A, f, pose);
  // "prefers to clear space ahead of time": the drive queues the tagged boxes (amber pings in tag order)
  const pings = PHOTO.map((id, i) => {
    const p = toScreen(pose, an.box(id).x, an.box(id).y);
    return {x: p.x, y: p.y, t: (f - (T.clear - 4 + i * 4)) / 16, r: an.pxPerBox};
  });
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={CAM_A}
      drift={DRIFT}
      grade={grade}
      hud={
        <>
          <Rings pts={pings} />
          <QuestionCard frame={f} at={T.think} exitAt={T.disposable - 9} text="What will the drive do?" y={520} scrim={0.45} />
        </>
      }
    >
      <Archive {...A} />
    </Stage>
  );
};

/* ---------------------------------------------------------------- shot B: the race */
const scanner = (fr: number, tray: TrayMode, trayAt: number) => (
  <ScannerProp
    frame={fr}
    {...SC}
    enter={{kind: 'drop', at: T.once, dur: 16}}
    float={2}
    shadow={0.5}
    rim={{color: PAL.structure, strength: 0.45}}
    sweep={{every: 90, offset: 30}}
    beam={{at: T.once + 9}}
    scan={{at: T.once + 13, dur: 26, every: 34, until: T.nothing}}
    beamTo={BEAM_TO}
    tray={tray}
    trayAt={trayAt}
    fillDur={T.unlisted - TRAY_AT}
  />
);
/** the right tray: a pulsing "?" until "nothing", then the empty dashed frame for good (the verdict stays true) */
const rightTray = (f: number): [TrayMode, number] => (f < T.nothing ? ['unknown', TRAY_AT] : ['empty', T.nothing]);

const leftPanel = {
  cam: RACE_CAM,
  drift: DRIFT,
  light: 'cool' as const,
  render: (fr: number) => (
    <>
      <Archive frame={fr} state="HDD_DELETED" lift={1} events={LEFT_EVENTS} />
      {scanner(fr, 'photo', TRAY_AT)}
    </>
  ),
};
const rightPanel = {
  cam: RACE_CAM,
  drift: DRIFT,
  light: 'ssd' as const,
  render: (fr: number) => {
    const [mode, at] = rightTray(fr);
    return (
      <>
        <Archive frame={fr} state="SSD_DELETED" events={RIGHT_EVENTS} />
        {scanner(fr, mode, at)}
      </>
    );
  },
};

/** the right panel's tags pulse faster from "convenient moment" (the riser) until the sweep */
const RiserPings: React.FC<{f: number}> = ({f}) => {
  if (f < T.convenient || f > T.erases + 6) return null;
  const A = {frame: f, state: 'SSD_DELETED' as const, events: RIGHT_EVENTS};
  const an = archiveAnchors(A, f, stagePose(RACE_CAM, f, DRIFT));
  const u = (f - T.convenient) / (T.erases - T.convenient);
  const period = lerp(20, 8, clamp01(u));
  const ph = ((f - T.convenient) % period) / period;
  const pts = PHOTO.map((id) => {
    const b = an.box(id);
    const p = splitToScreen('right', f, {cam: RACE_CAM, drift: DRIFT}, b.x, b.y);
    return {x: p.x, y: p.y, t: f > T.erases ? 1.1 : ph, r: 64 * p.scale};
  });
  return <Rings pts={pts} />;
};

const chipPair = (f: number, a: {text: string; at: number; exitAt: number}, b: {text: string; at: number; tone: 'kept' | 'lost'}) => (
  <>
    <VerdictChip frame={f} at={a.at} text={a.text} tone="neutral" x={0} y={0} exitAt={a.exitAt} />
    <VerdictChip frame={f} at={b.at} text={b.text} tone={b.tone} x={0} y={0} />
  </>
);

/** the clock: pops on "erases them", swells on "How fast" */
const Clock: React.FC<{f: number}> = ({f}) => {
  const sw = springAt(f, T.fast, SPRING.pop);
  const s = lerp(1, 1.7, sw);
  const x = 1786;
  const y = 298;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${x}px ${y}px`, transform: `scale(${s}) translate(${-sw * 30}px, ${sw * 22}px)`}}>
      <ClockGlyph frame={f} x={x} y={y} size={72} at={T.erases} exitAt={T.depends + 2} />
    </div>
  );
};

export const ShotB: React.FC<{frame: number; enterAt?: number}> = ({frame: f}) => (
  <SplitCompare
    frame={f}
    at={T.when}
    enter="slide"
    left={leftPanel}
    right={rightPanel}
    shake={[{at: T.nothing, strength: 0.9}]}
    leftChip={chipPair(f, {text: 'Before any new writes', at: T.when + 16, exitAt: T.unlisted - 6}, {text: 'Unlisted', at: T.unlisted, tone: 'kept'})}
    rightChip={chipPair(f, {text: 'After TRIM and housekeeping', at: T.housekeeping, exitAt: T.gone - 6}, {text: 'Gone', at: T.gone, tone: 'lost'})}
    verdict={<VerdictCard frame={f} at={T.nothing} text="Nothing left for a recovery tool" accentWord="Nothing" exitAt={T.depends - 14} x={0} y={0} />}
    hud={
      <>
        <RiserPings f={f} />
        <Clock f={f} />
        <Footnote frame={f} at={T.erases + 4} text="Illustrative timing" x={1560} y={1010} exitAt={T.depends} />
        <Footnote frame={f} at={T.once + 6} text="Illustration, not a test" x={96} y={1010} exitAt={T.depends} />
      </>
    }
  />
);

/* ---------------------------------------------------------------- A → B: this frame compresses into the SSD panel */
export const Compress: React.FC<{frame: number}> = ({frame: f}) => {
  const t = EASE.inOut(prog(f, T.when, SPLIT.slideIn));
  const R = {x0: SPLIT.right.x0, y0: SPLIT.content.y0, x1: SPLIT.right.x1, y1: SPLIT.content.y1};
  // keep the kit's sliding right panel fully covered: our right edge never passes inside it
  const kitX1 = SPLIT.right.x1 + (1 - t) * 1000;
  const r = {x0: lerp(0, R.x0, t), y0: lerp(0, R.y0, t), x1: Math.min(1920, kitX1), y1: lerp(1080, R.y1, t)};
  const s = lerp(1, SPLIT.scale, t);
  const c = {x: lerp(960, (R.x0 + R.x1) / 2, t), y: lerp(540, (R.y0 + R.y1) / 2, t)};
  const bez = clamp01((t - 0.3) / 0.5);
  return (
    <AbsoluteFill>
      <ShotB frame={f} />
      <div
        style={{
          position: 'absolute',
          left: r.x0 - 8 * bez,
          top: r.y0 - 8 * bez,
          width: r.x1 - r.x0 + 16 * bez,
          height: r.y1 - r.y0 + 16 * bez,
          borderRadius: 18 * bez,
          background: 'linear-gradient(180deg, #33435E 0%, #1A2436 30%, #0D131F 100%)',
          boxShadow: `0 24px 60px ${rgba('#000000', 0.55 * bez)}`,
          opacity: bez,
        }}
      />
      <div style={{position: 'absolute', left: r.x0, top: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0, overflow: 'hidden', borderRadius: 12 * bez}}>
        <div style={{position: 'absolute', left: c.x - 960 * s - r.x0, top: c.y - 540 * s - r.y0, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: '0 0'}}>
          <ShotA frame={f} grade={{vignette: 0.62 * (1 - t)}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
