/**
 * S5, P10–P12 [6649, 8404): the turn to the SSD. Plan: docs/ep06/plans/S5_plan.md.
 *   A  the hard-drive verdict on the wall (HDD_RACE_LOST)
 *   B  match cut on "SSD": the same drawer and cards, the same delete; the wall flips into flash; "The SSD"
 *   C  DriveDive into the flash: refused writes, a group erase, a stalled save, housekeeping that skips the photo
 *   D  the catch: boundary, "Still full", the TRIM note through the slot, the NTFS / drive-support chips
 * Every timing comes from at(); frames are absolute.
 */
import React from 'react';
import {
  Archive,
  AtlasOpener,
  ClockGlyph,
  DriveDive,
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
  under: at(10, 'underneath').start,
  // P11
  anSsd: at(11, 'SSD').start,
  flash: at(11, 'flash memory').start,
  writeOver: at(11, 'write over').start,
  oldData: at(11, 'old data').end,
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
  farAs: at(12, 'as far as the drive knows').start,
  stillFull: at(12, 'still full').start,
  wants: at(12, 'someone wants').end,
  sends: at(12, 'windows sends').start,
  shortNote: at(12, 'short note').start,
  trim: at(12, 'trim').start,
  listing: at(12, 'listing').start,
  delete: at(12, 'delete').start,
  byDefault: at(12, 'by default').start,
  forDrives: at(12, 'for drives').start,
};

/* ================================================================ cut points */
const CUT_B = W.ssd; // FlashCut A → B on "SSD"
const DIVE = W.flash - 16; // DriveDive: the explode flash lands on "flash"
const WHIP_D = W.but - 4; // Whip C → D into "But there's a catch"
const FLIP = W.under + 1; // the wall flips into flash
const LIGHT_SWITCH = FLIP + 8; // inside the fast push
const HK = W.housekeeping + 5; // housekeeping sweeps

/* ================================================================ A + B camera (one continuous move across the cut) */
const WALL = archiveCam('wall');
const BOUNDARY = archiveCam('boundary');
const CAM_AB: CamKey[] = [
  {f: FROM, ...WALL},
  {f: W.expect, x: WALL.x + 16, y: WALL.y + 6, zoom: WALL.zoom * 1.05},
  {f: CUT_B + 12, x: 990, y: 540, zoom: 1.0, dur: 36, ease: 'inOut'},
  {f: W.sameWin + 2, x: 800, y: 486, zoom: 1.16, dur: 52},
  {f: W.under - 4, x: 770, y: 492, zoom: 1.22},
  {f: W.under + 22, x: 1284, y: 556, zoom: 1.46, dur: 26, ease: 'inOut'},
  {f: DIVE, x: 1284, y: 548, zoom: 1.56},
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
const shotB = (f: number) => {
  const light: ArchiveLight = f < LIGHT_SWITCH ? 'warm' : 'ssd';
  return (
    <Stage frame={f} env={{kind: 'archive', light}} cam={CAM_AB} hud={<AtlasOpener frame={f} at={W.anSsd - 20} word="The SSD" />}>
      <Archive frame={f} state="SSD_SAVED" light={light} events={B_EVENTS} flip={{at: FLIP, dur: 46}} />
    </Stage>
  );
};

/* ================================================================ C: inside the flash */
/** old grey Bits (data the drive already knows is old); never in the photo's groups */
const OLD: Record<number, Content> = {};
for (const id of [2, 3, 9, 10, 36, 41, 42, 43, 45, 47, 54, 55, 56, 61, 63, 73, 74, 81, 82, 83, 86, 87, 101, 102, 104, 118, 119, 125, 127, 137, 138]) OLD[id] = 'old';
const X = 42; // the refused write, then its group erased
const Y = 55; // the save that has to wait for an erase
const C_EVENTS: ArchiveEvent[] = [
  {at: W.writeOver - 7, op: 'refuse', target: X, dur: 20},
  {at: W.oldData - 14, op: 'refuse', target: X, dur: 20},
  {at: W.erased - 3, op: 'sweep', target: X, dur: 14},
  {at: W.saved - 9, op: 'refuse', target: Y, dur: 20},
  {at: W.saved + 21, op: 'sweep', target: Y, dur: 14},
  {at: W.writes - 11, op: 'refuse', target: 74, dur: 20},
  {at: W.slow - 11, op: 'refuse', target: 36, dur: 20},
  // housekeeping, in the background: three passes; the photo's groups (024 / 057 / 097 are their empty members) are skipped
  {at: HK, op: 'sweep', target: [2, 9, 24, 36, 45], dur: 70},
  {at: HK + 8, op: 'sweep', target: [57, 63, 74, 81, 86], dur: 70},
  {at: HK + 16, op: 'sweep', target: [97, 101, 118, 125, 137], dur: 70},
  {at: W.needed - 6, op: 'sweep', target: [24, 57, 97], dur: 42},
];
const CAM_C: CamKey[] = [
  {f: DIVE + 30, x: 1190, y: 430, zoom: 1.9},
  {f: W.writeOver - 46, x: 1236, y: 422, zoom: 2.0},
  {f: W.writeOver - 4, x: 1392, y: 420, zoom: 3.0, dur: 40},
  {f: W.erased - 6, x: 1386, y: 426, zoom: 3.1},
  {f: W.erased + 20, x: 1404, y: 430, zoom: 2.8, dur: 22},
  {f: W.saved - 2, x: 1160, y: 476, zoom: 2.3, dur: 60},
  {f: W.slow + 16, x: 1170, y: 486, zoom: 2.2},
  {f: W.soDrive + 40, x: 1240, y: 600, zoom: 1.3, dur: 40},
  {f: WHIP_D - 34, x: 1252, y: 594, zoom: 1.34},
  {f: WHIP_D + 12, x: 1430, y: 488, zoom: 1.9, dur: 46, ease: 'inExpo'},
];
const shotC = (f: number) => (
  <Stage
    frame={f}
    env={{kind: 'flash', amber: 1.1}}
    cam={CAM_C}
    hud={
      <>
        <Footnote frame={f} at={W.erased + 4} exitAt={W.soDrive - 6} text="Simplified: flash erases in large groups" />
        <Hourglass frame={f} x={250} y={560} h={380} at={W.saved + 8} flips={[W.saved + 22, W.slow - 2]} exitAt={W.soDrive + 4} />
        <ClockGlyph frame={f} x={170} y={180} size={124} at={HK - 4} exitAt={WHIP_D - 4} />
        <Footnote frame={f} at={HK} exitAt={WHIP_D - 4} text="Illustrative timing" />
      </>
    }
  >
    <Archive frame={f} state="SSD_DELETED" boxes={OLD} show={{drawer: 0, map: 0, card: 0, threads: 0, ghost: 0}} events={C_EVENTS} />
  </Stage>
);

/* ================================================================ D: the catch, the boundary, TRIM */
const D_EVENTS: ArchiveEvent[] = [
  {at: W.doesnt + 2, op: 'boundary'},
  {at: W.farAs + 50, op: 'sweep', target: [24, 57, 97], dur: 50},
];
const NOTE_PATH: TrimPath = {
  pts: [
    {x: 500, y: 300},
    {x: 610, y: 392},
    {x: 680, y: 400},
    {x: 760, y: 398},
    {x: 952, y: 338},
  ],
  at: W.listing + 2,
  dur: 62,
};
const NOTE = {x: NOTE_PATH.pts[0].x, y: NOTE_PATH.pts[0].y, path: NOTE_PATH};
const NOTE_W = 110;
const CAM_D: CamKey[] = [
  {f: WHIP_D, x: 1000, y: 520, zoom: 1.12},
  {f: W.doesnt - 32, x: 982, y: 512, zoom: 1.15},
  {f: W.doesnt + 14, ...BOUNDARY, dur: 46},
  {f: W.farAs - 2, x: BOUNDARY.x + 10, y: BOUNDARY.y - 2, zoom: BOUNDARY.zoom * 1.015},
  {f: W.farAs + 40, x: 1240, y: 610, zoom: 1.3, dur: 42},
  {f: W.sends - 22, x: 1262, y: 600, zoom: 1.36},
  {f: W.sends + 12, x: 540, y: 360, zoom: 2.4, dur: 32},
  {f: W.listing - 4, x: 526, y: 356, zoom: 2.5},
  {f: W.listing + 72, x: 740, y: 430, zoom: 1.42, dur: 76},
  {f: TO - 20, x: 728, y: 442, zoom: 1.46},
  {f: TO + 2, ...BOUNDARY, dur: 22, ease: 'out'},
];
const shotD = (f: number) => {
  const A = {frame: f, state: 'SSD_DELETED' as const, events: D_EVENTS};
  const pose = poseAt(f, CAM_D);
  const an = archiveAnchors(A, f, pose);
  const full = toScreen(pose, an.box(59).x, an.box(59).y - 30);
  const np = trimNotePos(NOTE, f);
  const nt = toScreen(pose, np.x, np.y - 46);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={CAM_D}
      hud={
        <>
          <Label frame={f} at={W.stillFull + 2} exitAt={W.wants + 22} text="Still full" size={56} x={full.x - 40} y={full.y - 170} to={full} side="left" />
          <Label frame={f} at={W.trim + 1} exitAt={W.delete + 26} text="TRIM" size={56} x={nt.x - 60} y={nt.y - 130} to={nt} side="left" accent={PAL.emphasis} />
          <VerdictChip frame={f} at={W.byDefault + 2} text="On NTFS, by default" x={470} y={128} exitAt={TO - 12} />
          <VerdictChip frame={f} at={W.forDrives + 1} text="For drives that support it" x={1430} y={128} exitAt={TO - 10} />
        </>
      }
    >
      <Archive {...A} />
      <TrimNote
        frame={f}
        variant="render"
        {...NOTE}
        w={NOTE_W}
        numberSize={5}
        enter={{kind: 'rise', at: W.shortNote - 6, dur: 16}}
        rim={{color: PAL.structure, strength: 0.55}}
        sweep={{at: [W.trim - 4], dur: 18}}
        float={2}
        slot={{x: 680, y: 400, h: 96}}
      />
    </Stage>
  );
};

/* ================================================================ the section */
export const S5: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(FROM - 30, Math.min(TO + 29, frame));
  if (f < CUT_B + 10) return <FlashCut frame={f} at={CUT_B} a={shotA} b={shotB} strength={0.85} />;
  if (f < DIVE + 42) return <DriveDive frame={f} at={DIVE} drive="ssd-board_a" explode="ssd-board_d" from={{x: 960, y: 560}} a={shotB} b={shotC} />;
  if (f < WHIP_D + 12) return <Whip frame={f} at={WHIP_D} dur={12} dir="right" a={shotC} b={shotD} />;
  return shotD(f);
};
