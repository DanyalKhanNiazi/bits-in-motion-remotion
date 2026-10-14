/**
 * S3 · P06–P07 [3167, 5104): the Master File Table, and what emptying the bin does. Plan: docs/ep06/plans/S3_plan.md.
 * A drawer → B canyon of cards → C the photo's card (fields, threads, read pulse) → D the monitor reassembles the photo →
 * E the limit (a tiny file on its card) → F the bin is emptied → G the card struck "Free", the map, the escalated
 * signature ("Nothing opens the boxes."), "Unused", quick vs long, the ghost future write (ends HDD_DELETED).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  Archive,
  CARD as CARD_PX,
  EASE,
  FlashCut,
  Footnote,
  IndexCard,
  KineticText,
  Label,
  PAL,
  PhotoBits,
  RecycleBin,
  Stage,
  VerdictChip,
  Whip,
  ZoomThrough,
  archiveAnchors,
  archiveCam,
  poseAt,
  prog,
  recycleBinPoint,
  springAt,
  toScreen,
  type ArchiveEvent,
  type CamKey,
} from '../kit';
import {CanyonShot, canyonPhotoScreen} from './S3/Canyon';
import {DeskShot} from './S3/Desk';
import {FieldPop, GhostWrite, Hourglass, RewriteStream, Stamp, TickBadge, cardToWorld, fieldLabelPt} from './S3/marks';
import {FROM, T, TO} from './S3/t';

const WIDE = archiveCam('wide');
const DRAWER = archiveCam('drawer');
const CARD = archiveCam('card');
const PB = archiveCam('photoBoxes');
const LIN = (t: number) => t;

/* ================================================================ A: S2's push lands on the drawer */
const A_CAM: CamKey[] = [
  {f: FROM - 30, ...WIDE},
  {f: FROM - 17, ...WIDE},
  {f: T.real, ...DRAWER, dur: T.real - (FROM - 17), ease: 'inOut'},
  {f: T.withAt + 6, x: DRAWER.x + 6, y: DRAWER.y - 34, zoom: DRAWER.zoom * 1.1, ease: 'inOut'},
];
const shotA = (f: number) => (
  <Stage frame={f} env={{kind: 'archive', light: 'warm'}} cam={A_CAM}>
    <Archive frame={f} state="HDD_SAVED" />
  </Stage>
);
const W_AB = T.withAt - 9;
/** the card block in the drawer, where the "Master File Table" leader points */
const MFT_PT = {x: 604, y: 400};

/* ================================================================ C: the photo's card; fields; threads; read pulse */
const C_EVENTS: ArchiveEvent[] = [
  {at: T.clusters, op: 'threads', dur: 22},
  {at: T.reads, op: 'readPulse', dur: 36},
];
const C_FIELDS = {name: T.nameW, size: T.size, dates: T.dates, directions: T.directions};
const Z_BC = T.yourEntry + 19;
const C_CAM: CamKey[] = [
  {f: Z_BC, ...CARD, zoom: CARD.zoom * 0.86},
  {f: T.size + 8, ...CARD, zoom: CARD.zoom * 0.98},
  {f: T.directions + 8, x: CARD.x + 36, y: CARD.y + 10, zoom: CARD.zoom * 1.0},
  {f: T.live + 4, x: 780, y: 400, zoom: 1.3, dur: 46},
  {f: T.reads, x: 830, y: 420, zoom: 1.14},
  {f: T.boxes6 + 10, x: 850, y: 400, zoom: 1.22},
];
/** each field lights on its word and goes when the next one lights: a bold-ink label pop on the card + a hud chip */
const FIELD_SEQ = [
  {field: 'name', at: T.nameW, exitAt: T.size},
  {field: 'size', at: T.size, exitAt: T.dates},
  {field: 'dates', at: T.dates, exitAt: T.directions},
  {field: 'directions', at: T.directions, exitAt: T.clusters},
] as const;
const LIFT = {at: T.goes, dur: 20};
const CLOUD = {x: 735, y: 60, w: 230, h: 300};
const shotC = (f: number, render: number) => {
  const A = {frame: f, state: 'HDD_SAVED' as const, events: C_EVENTS, cardFields: C_FIELDS, renders: {card: render}};
  const pose = poseAt(f, C_CAM);
  const an = archiveAnchors(A, f, pose);
  // copies of the photo's Bits lift out of its 9 boxes into a photo-shaped cloud (PhotoBits sink, run backwards)
  const lf = f < LIFT.at ? LIFT.at + LIFT.dur : LIFT.at + LIFT.dur - (f - LIFT.at);
  const sc = (nx: number, ny: number) => {
    const w = cardToWorld(an.card, nx, ny);
    return toScreen(pose, w.x, w.y);
  };
  const chips = FIELD_SEQ.map(({field, at, exitAt}) => {
    const lp = fieldLabelPt(field);
    const right = field === 'directions';
    // left column: chip just off the card's left edge at the label's height; "directions": off the right edge
    const edge = sc(right ? CARD_PX.x1 : CARD_PX.x0, lp.y);
    const to = right ? sc(CARD_PX.fields.directions.housing[2], CARD_PX.fields.directions.housing[1] + 30) : sc(CARD_PX.x0 + 22, lp.y);
    return <Label key={field} frame={f} at={at} exitAt={exitAt} text={field} x={edge.x + (right ? 44 : -44)} y={edge.y} to={to} side={right ? 'right' : 'left'} size={48} role="chip" />;
  });
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'warm'}}
      cam={C_CAM}
      hud={
        <>
          {chips}
          <Footnote frame={f} at={T.directions + 6} exitAt={T.reads - 2} text="Simplified: real cards list ranges" />
        </>
      }
    >
      <Archive {...A} />
      {FIELD_SEQ.map(({field, at, exitAt}) => (
        <FieldPop key={field} frame={f} at={at} exitAt={exitAt} field={field} card={an.card} />
      ))}
      {f >= LIFT.at - 1 ? <PhotoBits frame={lf} at={LIFT.at} dur={LIFT.dur} mode="sink" from={CLOUD} to={an.photo} grid={[12, 16]} /> : null}
    </Stage>
  );
};
// the registered render shows only under the push's own flash (f Z_BC+6..+7), then the vector card
const shotCard = (f: number) => <FlashCut frame={f} at={Z_BC + 8} strength={0.6} a={(x) => shotC(x, 1)} b={(x) => shotC(x, 0)} />;
const Z_CD = T.boxes6 - 6;

/* ================================================================ E: the limit: a tiny file fits on its card */
const W_DE = T.picture + 4; // the whip lands on the drawer 12 f later, before "limit"
const TINY = {x: 286, y: 300, w: 300};
const E_CAM: CamKey[] = [
  {f: W_DE, x: 470, y: 340, zoom: 1.7},
  {f: T.fit + 10, x: 336, y: 318, zoom: 2.3},
  {f: T.yourPhoto + 2, x: 326, y: 316, zoom: 2.42},
  {f: T.small + 12, x: 900, y: 430, zoom: 1.3, dur: 34, ease: 'inCubic'},
];
const shotE = (f: number) => {
  const pose = poseAt(f, E_CAM);
  const rise = springAt(f, T.smallFile - 4, {damping: 14, stiffness: 150, mass: 0.8});
  const sink = prog(f, T.yourPhoto + 4, 14, EASE.inCubic);
  const ty = TINY.y + 250 * (1 - rise) + 250 * sink;
  const bitsPt = toScreen(pose, TINY.x + 76, TINY.y + 3);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'warm'}}
      cam={E_CAM}
      hud={<Label frame={f} at={T.fit} exitAt={T.yourPhoto + 4} text="Fits entirely on its card" x={bitsPt.x - 40} y={Math.max(120, bitsPt.y - 330)} to={bitsPt} side="left" size={52} />}
    >
      <Archive frame={f} state="HDD_SAVED" />
      {/* the tiny file's card rises out of the drawer (clipped at the drawer's front edge) */}
      {rise > 0.001 && sink < 1 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 470, overflow: 'hidden'}}>
          <IndexCard frame={f} x={TINY.x} y={ty} w={TINY.w} variant="tiny" shadow={1.2} />
        </div>
      ) : null}
    </Stage>
  );
};

/* ================================================================ F: the bin is emptied (hardware stage) */
const W_EF = T.small - 4;
const BIN = {x: 900, y: 560, w: 700};
const F_CAM: CamKey[] = [
  {f: W_EF, x: 980, y: 540, zoom: 0.98},
  {f: T.bin + 20, x: 920, y: 560, zoom: 1.1, ease: LIN},
];
const FLUSH = T.empty + 2;
const shotF = (f: number) => (
  <Stage frame={f} env={{kind: 'stage', spot: 900, floor: 800, warm: 0.3}} cam={F_CAM} shake={[{at: FLUSH + 2, strength: 0.35}]}>
    <RecycleBin
      frame={f}
      {...BIN}
      holdsPhoto={0}
      emptyHoverAt={T.now - 8}
      flushAt={FLUSH}
      float={4}
      tiltY={-4}
      rim={{color: PAL.structure, strength: 0.4}}
      sweep={{every: 70, offset: 10}}
      shadow={0.6}
      screen
    />
  </Stage>
);
const Z_FG = T.bin + 3;

/* ================================================================ G: what NTFS actually does (cool light) */
const G_EVENTS: ArchiveEvent[] = [
  {at: T.free - 10, op: 'strike'},
  {at: T.marks2 + 31, op: 'mapFlip', target: 'photo', dur: 16},
  {at: T.flagged + 10, op: 'flag'},
];
const MAPP = {x: 400, y: 700, zoom: 2.1};
const QS = {x: 845, y: 536, zoom: 1.18};
const SIG_END = {x: 1225, y: 588, zoom: 0.9};
const G_CAM: CamKey[] = [
  {f: Z_FG, ...DRAWER, zoom: DRAWER.zoom * 0.94},
  {f: T.marks, x: 372, y: 326, zoom: 2.75},
  {f: T.reuseEnd + 10, x: 378, y: 322, zoom: 2.95},
  {f: T.map, ...MAPP, dur: 38},
  {f: T.available + 6, ...MAPP, zoom: 2.3},
  // the escalated signature: close on the struck card, then the long held-breath pull-back
  {f: T.thats + 8, x: 376, y: 324, zoom: 3.3, dur: 30, ease: 'inOut'},
  {f: T.nothing, x: 376, y: 322, zoom: 3.36},
  {f: T.wereEnd - 10, ...SIG_END, dur: T.wereEnd - 10 - T.nothing, ease: 'inOut'},
  {f: T.theCard + 8, x: SIG_END.x - 6, y: SIG_END.y + 2, zoom: SIG_END.zoom * 1.03},
  {f: T.drawer, x: 380, y: 330, zoom: 2.25, dur: 36},
  {f: T.unusedEnd, x: 376, y: 324, zoom: 2.4},
  // one wide frame for quick vs slow: card + map (the two records) and the photo's 9 boxes + the rewrite bar
  {f: T.couple, ...QS, dur: 30, ease: 'inOut'},
  {f: T.longerEnd + 8, x: QS.x, y: QS.y - 2, zoom: QS.zoom * 1.015},
  {f: T.onHard + 14, ...PB, x: PB.x + 20, zoom: PB.zoom * 0.9, dur: 26},
  {f: TO - 20, ...PB, x: PB.x + 10, zoom: PB.zoom * 0.93},
  {f: TO, ...PB, ease: 'inCubic'},
  {f: TO + 30, ...PB, zoom: PB.zoom * 1.08, ease: LIN},
];
const GHOST_BOX = 59;
const shotG = (f: number) => {
  const A = {frame: f, state: 'HDD_SAVED' as const, light: 'cool' as const, events: G_EVENTS};
  const pose = poseAt(f, G_CAM);
  const an = archiveAnchors(A, f, pose);
  const sc = (p: {x: number; y: number}, dx = 0, dy = 0) => toScreen(pose, p.x + dx, p.y + dy);
  const stamp = sc(an.card, 70, 46);
  const mapTop = sc({x: 360, y: 612});
  const flag = sc(an.flag);
  const cardTick = sc(an.card, 150, -96);
  const mapTick = sc(an.mapCell(59));
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={G_CAM}
      shake={[{at: T.free, strength: 0.45}, {at: T.nothing, strength: 0.6}]}
      hud={
        <>
          <Stamp frame={f} at={T.free} exitAt={T.reuseEnd + 15} text="Free" x={stamp.x} y={stamp.y} />
          <Label frame={f} at={T.map} exitAt={T.availableEnd + 16} text="Map of which boxes are taken" x={Math.max(120, mapTop.x - 520)} y={180} to={mapTop} side="right" size={52} />
          <KineticText frame={f} at={T.nothing} exitAt={T.wereEnd + 6} text="Nothing opens the boxes." x={960} y={872} size={112} mode="slam" backing="plate" />
          <Label frame={f} at={T.unused} exitAt={T.couple - 8} text="Unused" x={flag.x + 200} y={flag.y + 6} to={flag} side="right" size={56} accent={PAL.loss} />
          <TickBadge frame={f} at={T.couple} exitAt={T.longerEnd + 6} x={cardTick.x} y={cardTick.y} />
          <TickBadge frame={f} at={T.records} exitAt={T.longerEnd + 6} x={mapTick.x} y={mapTick.y} />
          <VerdictChip frame={f} at={T.onHard} exitAt={TO - 20} text="On a hard drive" tone="neutral" x={1500} y={128} />
        </>
      }
    >
      <Archive {...A} />
      <RewriteStream frame={f} at={T.rewriting} period={20} stallAt={T.longer} fadeAt={T.longerEnd + 6} bar={{x: 776, y: 806, w: 720}} />
      {/* the slow job's hourglass, in the gap between the map and the wall at the bar's start; it flips over on "longer" */}
      <Hourglass frame={f} at={T.rewriting - 2} flipAt={T.longer} exitAt={T.longerEnd + 6} x={664} y={800} h={130} />
      <GhostWrite frame={f} at={T.space - 4} dipAt={T.written} box={GHOST_BOX} />
    </Stage>
  );
};

/* ================================================================ the section */
export const S3: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(FROM - 30, Math.min(TO + 29, frame));
  let scene: React.ReactNode;
  if (f < W_AB) scene = shotA(f);
  else if (f < W_AB + 12) scene = <Whip frame={f} at={W_AB} dur={12} dir="down" a={shotA} b={(x) => <CanyonShot f={x} />} />;
  else if (f < Z_BC) scene = <CanyonShot f={f} />;
  else if (f < Z_BC + 16) {
    const c = canyonPhotoScreen(Z_BC);
    scene = <ZoomThrough frame={f} at={Z_BC} dur={16} cx={c.x} cy={c.y} a={(x) => <CanyonShot f={x} />} b={shotCard} />;
  } else if (f < Z_CD) scene = shotCard(f);
  else if (f < Z_CD + 14) {
    const c = toScreen(poseAt(Z_CD, C_CAM), CLOUD.x + CLOUD.w / 2, CLOUD.y + CLOUD.h / 2);
    scene = <ZoomThrough frame={f} at={Z_CD} dur={14} cx={c.x} cy={c.y} a={shotCard} b={(x) => <DeskShot f={x} />} />;
  } else if (f < W_DE) scene = <DeskShot f={f} />;
  else if (f < W_DE + 12) scene = <Whip frame={f} at={W_DE} dur={12} dir="left" a={(x) => <DeskShot f={x} />} b={shotE} />;
  else if (f < W_EF) scene = shotE(f);
  else if (f < W_EF + 12) scene = <Whip frame={f} at={W_EF} dur={12} dir="left" a={shotE} b={shotF} />;
  else if (f < Z_FG) scene = shotF(f);
  else if (f < Z_FG + 16) {
    const m = recycleBinPoint(BIN, 'mouth');
    const c = toScreen(poseAt(Z_FG, F_CAM), m.x, m.y);
    scene = <ZoomThrough frame={f} at={Z_FG} dur={16} cx={c.x} cy={c.y} a={shotF} b={shotG} />;
  } else scene = shotG(f);

  // "Master File Table" rides above the crane whip (screen space), its leader only while the drawer is on screen
  const mftTo = f < W_AB + 3 ? toScreen(poseAt(f, A_CAM), MFT_PT.x, MFT_PT.y) : undefined;
  return (
    <AbsoluteFill style={{background: PAL.void}}>
      {scene}
      <Label frame={f} at={T.master} exitAt={T.yourEntry + 12} text="Master File Table" x={1180} y={112} to={mftTo} side="right" size={56} />
    </AbsoluteFill>
  );
};
