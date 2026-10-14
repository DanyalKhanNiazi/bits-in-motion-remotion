/**
 * S5, P10–P12 [6649, 8404): the turn to the SSD. Plan: docs/ep06/plans/S5_plan.md.
 *   A  the hard-drive verdict on the wall (HDD_RACE_LOST)
 *   B  match cut on "SSD": the same drawer and cards under an "SSD" tag, the same delete; the wall's hard-drive face
 *      comes off row by row and uncovers the graphite flash underneath
 *   C0 the SSD board's hero beat on the hardware stage + "The SSD"; explode on "flash", dive on "memory"
 *   C  inside the flash (env 'flash' floor, flash traces on the wall): refused writes, a group erase, a stalled save,
 *      housekeeping that skips the photo
 *   D  the catch: boundary (the drive's scan stops there), "Still full", the TRIM note through the slot, the chips
 * Every timing comes from at(); frames are absolute.
 */
import React from 'react';
import {
  Archive,
  AtlasOpener,
  EASE,
  GEOM,
  ClockGlyph,
  FlashCut,
  Footnote,
  Label,
  PAL,
  Stage,
  TrimNote,
  VerdictCard,
  VerdictChip,
  Whip,
  archiveAnchors,
  archiveCam,
  cardPlugs,
  groupIds,
  prog,
  poseAt,
  toScreen,
  trimNotePos,
  type ArchiveEvent,
  type ArchiveLight,
  type CamKey,
  type Content,
  type TrimPath,
} from '../kit';
import {at} from '../timing';
import {SECTION} from '../sections';
import {Hourglass} from './S5/Hourglass';
import {FlashTraces} from './S5/FlashTraces';
import {WallReveal} from './S5/WallReveal';
import {SsdTag} from './S5/SsdTag';
import {SsdHero} from './S5/SsdHero';
import {Refusal} from './S5/Refusal';
import {DriveScan} from './S5/DriveScan';
import {DELIVERY_W, TrimDelivery} from './S5/TrimDelivery';

const {from: FROM, to: TO} = SECTION('S5');

/* ================================================================ word clock */
const W = {
  // P10
  hardDrive: at(10, 'hard drive').start,
  deleted: at(10, 'deleted means').start,
  erasedEnd: at(10, 'not erased').end,
  expect: at(10, 'you might expect').start,
  ssd: at(10, 'SSD').start,
  sameWin: at(10, 'same windows').end,
  sameFs: at(10, 'file system').end,
  sameCards: at(10, 'index cards').start,
  but10: at(10, 'but underneath').start,
  under: at(10, 'underneath').start,
  // P11
  anSsd: at(11, 'SSD').start,
  flash: at(11, 'flash memory').start,
  memory: at(11, 'memory').start,
  writeOver: at(11, 'write over').start,
  oldData: at(11, 'data', 2).start,
  erased: at(11, 'erased').start,
  saved: at(11, 'saved something').start,
  writes: at(11, 'writes would').start,
  slow: at(11, 'slow down').start,
  soDrive: at(11, 'so the drive').start,
  housekeeping: at(11, 'housekeeping').start,
  needed: at(11, 'needed').start,
  // P12
  but: at(12, "but there's a catch").start,
  doesnt: at(12, "doesn't read").start,
  read: at(12, 'read').start,
  farAs: at(12, 'as far as the drive knows').start,
  stillFull: at(12, 'still full').start,
  wants: at(12, 'someone wants').end,
  sends: at(12, 'windows sends').start,
  shortNote: at(12, 'short note').start,
  trim: at(12, 'trim').start,
  listing: at(12, 'listing').start,
  clusters: at(12, 'clusters').start,
  delete: at(12, 'delete').start,
  byDefault: at(12, 'by default').start,
  forDrives: at(12, 'for drives').start,
};

/* ================================================================ cut points */
const CUT_B = W.ssd; // FlashCut A → B on "SSD"
const REVEAL = {at: W.under + 7, stagger: 6, dur: 18}; // the hard-drive face lifts off row by row; the last row is gone on "differently"
const LIGHT_SWITCH = W.but10 + 8; // inside the fast push to the wall
const HERO_AT = W.anSsd - 24; // B pushes into the SSD board's hero beat
const SWAP = W.flash; // ssd-board_a → _d under a flash
const DIVE = W.memory; // dive into the flash
const WHIP_D = W.but - 4; // Whip C → D into "But there's a catch"
const HK = W.housekeeping + 5; // housekeeping sweeps

/* ================================================================ A + B camera (one continuous move across the cut) */
const WALL = archiveCam('wall');
const BOUNDARY = archiveCam('boundary');
const CAM_AB: CamKey[] = [
  {f: FROM, ...WALL},
  {f: W.expect, x: WALL.x + 16, y: WALL.y + 6, zoom: WALL.zoom * 1.05},
  {f: CUT_B + 12, x: 990, y: 540, zoom: 1.0, dur: 36, ease: 'inOut'},
  {f: W.sameWin + 2, x: 800, y: 486, zoom: 1.16, dur: 52},
  {f: W.but10 - 2, x: 780, y: 490, zoom: 1.2},
  // "But underneath": a fast push until the wall fills the frame, then the camera tilts down with the rows coming off
  {f: W.under + 12, x: 1288, y: 548, zoom: 1.8, dur: 17, ease: 'inOut'},
  {f: REVEAL.at + 8 * REVEAL.stagger + REVEAL.dur, x: 1296, y: 574, zoom: 1.9},
  {f: HERO_AT + 12, x: 1300, y: 568, zoom: 1.96},
];

const shotA = (f: number) => (
  <Stage
    frame={f}
    env={{kind: 'archive', light: 'scan'}}
    cam={CAM_AB}
    hud={
      <>
        {/* the chip lands on "hard drive", before the card (VerdictCard draws its own chip only from its at) */}
        <VerdictChip frame={f} at={W.hardDrive - 1} text="On a hard drive" tone="neutral" x={960} y={855 - 72 * 1.25} exitAt={W.erasedEnd + 18} />
        <VerdictCard frame={f} at={W.deleted} text="Deleted means unlisted, not erased" accentWord="unlisted" exitAt={W.erasedEnd + 18} />
      </>
    }
  >
    <Archive frame={f} state="HDD_RACE_LOST" />
  </Stage>
);

const B_EVENTS: ArchiveEvent[] = [
  {at: W.sameWin - 12, op: 'strike'},
  {at: W.sameFs - 14, op: 'mapFlip', target: 'photo', dur: 16},
  {at: W.sameCards + 12, op: 'flag'},
];
/** the SSD tag hangs above the wall (world anchor), so it rides the camera with the wall it names */
const TAG_ANCHOR = {x: 1110, y: 158};
const shotB = (f: number) => {
  const light: ArchiveLight = f < LIGHT_SWITCH ? 'warm' : 'ssd';
  const tag = toScreen(poseAt(f, CAM_AB), TAG_ANCHOR.x, TAG_ANCHOR.y);
  return (
    <Stage frame={f} env={{kind: 'archive', light}} cam={CAM_AB} hud={<SsdTag frame={f} at={CUT_B + 3} exitAt={W.but10 + 2} x={tag.x} y={Math.max(104, tag.y)} />}>
      <WallReveal frame={f} {...REVEAL} light={light} hddLight="warm" events={B_EVENTS} />
    </Stage>
  );
};

/* ================================================================ C: inside the flash */
/** old grey Bits (data the drive already knows is old); never in the photo's groups */
const OLD: Record<number, Content> = {};
const OLD_IDS = [2, 3, 9, 10, 18, 19, 27, 31, 36, 41, 42, 43, 45, 47, 51, 54, 55, 56, 61, 63, 73, 74, 81, 82, 83, 86, 87, 101, 102, 104, 105, 110, 118, 119, 125, 127, 137, 138];
for (const id of OLD_IDS) OLD[id] = 'old';
const X = 42; // the refused write, then its group erased
const Y = 55; // the save that has to wait for an erase
const ON_DEMAND = new Set([...groupIds(X), ...groupIds(Y)]);
/** housekeeping: one band across the wall clears every old group ahead of time; the photo's groups survive it */
const HK_TARGET = OLD_IDS.filter((id) => !ON_DEMAND.has(id));
const REFUSE_X = [W.writeOver + 5, W.oldData]; // impact frames of the two big refused writes on 042
const C_EVENTS: ArchiveEvent[] = [
  // the band reaches 041–044 on "erased"
  {at: W.erased - 22, op: 'sweep', target: X, dur: 30},
  // the stalled save: refused on "saved", its group cleared on demand while more saves bounce
  {at: W.saved - 14, op: 'refuse', target: Y, dur: 26},
  {at: W.saved + 3, op: 'sweep', target: Y, dur: 30},
  {at: W.writes - 14, op: 'refuse', target: 74, dur: 26},
  {at: W.slow - 14, op: 'refuse', target: 36, dur: 26},
  {at: HK, op: 'sweep', target: HK_TARGET, dur: 88},
];
/** every key keeps the wall's top edge above the frame (no empty band over the wall); the landing shows the flash floor */
const CAM_C: CamKey[] = [
  {f: DIVE + 6, x: 1290, y: 745, zoom: 1.74},
  {f: W.writeOver - 38, x: 1330, y: 560, zoom: 1.85, dur: 77},
  {f: W.writeOver - 2, x: 1392, y: 422, zoom: 3.3, dur: 34, ease: 'inOut'},
  {f: W.oldData + 22, x: 1396, y: 426, zoom: 3.38},
  {f: W.erased - 4, x: 1428, y: 462, zoom: 2.6, dur: 28},
  {f: W.saved - 22, x: 1424, y: 468, zoom: 2.5},
  {f: W.saved - 2, x: 1160, y: 490, zoom: 2.3, dur: 50},
  {f: W.slow + 16, x: 1170, y: 500, zoom: 2.2},
  // all three runs as the band enters (098–100 skipped ≈ 7686), then closer on 021–023 and 058–060 as it parts around them
  {f: HK + 22, x: 1212, y: 528, zoom: 2.0, dur: 50},
  {f: HK + 38, x: 1270, y: 490, zoom: 2.3, dur: 16},
  {f: HK + 66, x: 1290, y: 494, zoom: 2.34},
  {f: HK + 96, x: 1340, y: 500, zoom: 2.5, dur: 30},
  {f: WHIP_D - 2, x: 1344, y: 500, zoom: 2.52},
  {f: WHIP_D + 12, x: 1340, y: 530, zoom: 1.95, dur: 14, ease: 'inExpo'},
];
const shotC = (f: number) => (
  <Stage
    frame={f}
    env={{kind: 'flash', amber: 1.2}}
    cam={CAM_C}
    hud={
      <>
        <Footnote frame={f} at={W.erased + 4} exitAt={W.soDrive - 6} text="Simplified: flash erases in large groups" />
        <Hourglass frame={f} x={250} y={560} h={380} at={W.saved + 8} flips={[W.saved + 22, W.slow - 2]} exitAt={W.soDrive + 4} />
        <ClockGlyph frame={f} x={140} y={100} size={100} at={HK - 4} exitAt={WHIP_D - 4} />
        <Footnote frame={f} at={HK} exitAt={WHIP_D - 4} text="Illustrative timing" x={1440} />
      </>
    }
  >
    <Archive frame={f} state="SSD_DELETED" boxes={OLD} show={{drawer: 0, map: 0, card: 0, threads: 0, ghost: 0}} events={C_EVENTS} />
    <FlashTraces frame={f} opacity={0.85} />
    {REFUSE_X.map((h) => (
      <Refusal key={h} frame={f} box={X} hit={h} />
    ))}
  </Stage>
);

/* ================================================================ C0: the SSD hero (inside SsdHero) + "The SSD" */
const heroHud = (f: number) => <AtlasOpener frame={f} at={W.anSsd - 20} word="The SSD" y={866} scrim={0.12} />;

/* ================================================================ D: the catch, the boundary, TRIM */
/**
 * HANDOFF to S6: the Archive's own TRIM note, event {at: TRIM_AT, op: 'trim', dur: TRIM_DUR} (default `to`): it leaves
 * the card's middle plug after the hero note shrinks into it, squeezes through the slot over the last ~30 f and is just
 * through at the cut (t ≈ 0.62 at 8404); it lands beside 021 on P13's "note" (8470). S6 repeats the same event.
 */
const TRIM_LAND = at(13, 'note').start;
const TRIM_DUR = 174;
const TRIM_AT = TRIM_LAND - TRIM_DUR;
const D_EVENTS: ArchiveEvent[] = [
  {at: W.doesnt + 2, op: 'boundary'},
  {at: W.farAs + 50, op: 'sweep', target: [24, 57, 97], dur: 50},
  {at: W.clusters - 2, op: 'readPulse', dur: 34},
  {at: TRIM_AT, op: 'trim', dur: TRIM_DUR},
];
/**
 * the hero note (the kit's paper envelope, on-screen width HERO_W) rises above the card, then flies into the card's
 * middle plug and shrinks to the delivery envelope (TrimDelivery, same look) that rides the Archive's trim note
 */
const PLUG = cardPlugs(GEOM.card.x, GEOM.card.y, GEOM.card.w)[1];
const HERO_W = 460;
const HERO_PATH: TrimPath = {
  pts: [
    {x: 420, y: 142},
    {x: 470, y: 250},
    {x: PLUG.x - 20, y: PLUG.y},
  ],
  at: TRIM_AT - 26,
  dur: 26,
};
const HERO = {x: HERO_PATH.pts[0].x, y: HERO_PATH.pts[0].y, path: HERO_PATH};
const CAM_D: CamKey[] = [
  {f: WHIP_D, x: 1000, y: 520, zoom: 1.12},
  {f: W.doesnt - 32, x: 982, y: 512, zoom: 1.15},
  {f: W.doesnt + 14, ...BOUNDARY, dur: 46},
  {f: W.farAs - 2, x: BOUNDARY.x + 10, y: BOUNDARY.y - 2, zoom: BOUNDARY.zoom * 1.015},
  {f: W.farAs + 40, x: 1240, y: 610, zoom: 1.3, dur: 42},
  {f: W.sends - 22, x: 1262, y: 600, zoom: 1.36},
  {f: W.sends + 12, x: 440, y: 282, zoom: 2.0, dur: 34},
  {f: W.listing - 4, x: 432, y: 278, zoom: 2.08},
  {f: W.listing + 62, x: 690, y: 420, zoom: 1.45, dur: 66},
  {f: W.byDefault - 12, x: 700, y: 440, zoom: 1.5},
  // the note through the slot is the subject: settle into `boundary` (the S6 framing) before it reaches the slot
  {f: TRIM_AT + 76, x: BOUNDARY.x - 8, y: BOUNDARY.y + 6, zoom: BOUNDARY.zoom * 0.985, dur: 50},
  {f: TO, ...BOUNDARY},
];
/** the two chips sit level on each side of the boundary, below the drawer's handle (dark ground; world anchors) */
const NTFS_AT = {x: 372, y: 583};
const DRIVES_AT = {x: 1010, y: 583};
const shotD = (f: number) => {
  const A = {frame: f, state: 'SSD_DELETED' as const, events: D_EVENTS};
  const pose = poseAt(f, CAM_D);
  const an = archiveAnchors(A, f, pose);
  const full = toScreen(pose, an.box(59).x, an.box(59).y - 30);
  const hp = trimNotePos(HERO, f);
  const hw = HERO_W + (DELIVERY_W - HERO_W) * prog(f, HERO_PATH.at, HERO_PATH.dur, EASE.inOut);
  const hc = toScreen(pose, hp.x, hp.y - 4);
  const nt = {x: hc.x + hw / 2, y: hc.y};
  const ntfs = toScreen(pose, NTFS_AT.x, NTFS_AT.y);
  const drives = toScreen(pose, DRIVES_AT.x, DRIVES_AT.y);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={CAM_D}
      hud={
        <>
          <Label frame={f} at={W.stillFull + 2} exitAt={W.wants + 22} text="Still full" size={56} x={full.x - 40} y={full.y - 170} to={full} side="left" />
          <Label frame={f} at={W.trim + 1} exitAt={W.delete + 26} text="TRIM" size={56} x={nt.x + 48} y={nt.y - 40} to={nt} side="right" accent={PAL.emphasis} />
          <VerdictChip frame={f} at={W.byDefault + 2} text="On NTFS, by default" x={ntfs.x} y={ntfs.y} size={40} exitAt={TO - 12} />
          <VerdictChip frame={f} at={W.forDrives + 1} text="For drives that support it" x={drives.x} y={drives.y} size={40} exitAt={TO - 10} />
        </>
      }
    >
      <Archive {...A} />
      <DriveScan frame={f} rings={[W.read - 4, W.read + 10]} dim={[W.read, W.sends - 22]} pane={[W.doesnt + 10, W.sends - 22]} />
      {f < TRIM_AT ? <TrimNote frame={f} variant="envelope" x={HERO.x} y={HERO.y - 4} path={{...HERO_PATH, pts: HERO_PATH.pts.map((q) => ({x: q.x, y: q.y - 4}))}} w={hw} wOnScreen numberSize={10} at={W.shortNote - 6} float={3} /> : null}
      <TrimDelivery frame={f} at={TRIM_AT} dur={TRIM_DUR} />
    </Stage>
  );
};

/* ================================================================ the section */
export const S5: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(FROM - 30, Math.min(TO + 29, frame));
  if (f < CUT_B + 10) return <FlashCut frame={f} at={CUT_B} a={shotA} b={shotB} strength={0.85} />;
  if (f < WHIP_D) return <SsdHero frame={f} at={HERO_AT} swapAt={SWAP} diveAt={DIVE} from={{x: 960, y: 600}} a={shotB} b={shotC} hud={heroHud} />;
  if (f < WHIP_D + 12) return <Whip frame={f} at={WHIP_D} dur={12} dir="right" a={shotC} b={shotD} />;
  return shotD(f);
};
