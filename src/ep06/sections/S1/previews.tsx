// S1 micro-previews (P02's promise): three ~1-s crops of later shots, each tag slammed in whole on its beat word.
// No flashes: a zoom-through from the PC into F, whips F → G → H, and a whip back to the PC at EXIT_AT (desk.tsx).
import React from 'react';
import {Archive, KineticText, PAL, ScannerProp, Stage, archiveCam, type CamKey, type Framing} from '../../kit';
import {T} from './times';

const K = (f: number, fr: Framing, o: Partial<CamKey> = {}, opt?: {run?: number}): CamKey => ({f, ...archiveCam(fr, opt), ...o});
/** a slam lands ~3 f after its `at` */
const LAND = 3;
export const ZOOM_DUR = 14;
export const WHIP_DUR = 10;
/** transition starts: each preview is fully in when its tag lands on the word */
export const CUT_F = T.work - LAND - ZOOM_DUR;
export const CUT_G = T.fail - LAND - WHIP_DUR;
export const CUT_H = T.erases - LAND - WHIP_DUR;

/** the tag stays up; the outgoing whip carries it off */
const Tag: React.FC<{f: number; word: number; text: string}> = ({f, word, text}) => (
  <KineticText frame={f} at={word - LAND} text={text} x={120} y={150} align="left" size={72} mode="slam" />
);

/** F: the recovery scanner rebuilds the photo in its tray ("Why recovery tools work") */
export const PreviewScan: React.FC<{f: number}> = ({f}) => (
  <Stage frame={f} env={{kind: 'stage', spot: 900, floor: 800}} cam={[{f: CUT_F, zoom: 1.12, x: 940, y: 560}, {f: CUT_G + 4, zoom: 1.02, x: 960, y: 540}]} hud={<Tag f={f} word={T.work} text="Why recovery tools work" />}>
    <ScannerProp
      frame={f}
      x={960}
      y={560}
      w={900}
      float={3}
      shadow={0.6}
      rim={{color: PAL.structure, strength: 0.5}}
      sweep={{at: [CUT_F + 4], dur: 18}}
      beam={{at: CUT_F - 6}}
      scan={{at: CUT_F - 2, dur: 22, every: 26}}
      tray="photo"
      trayAt={T.work}
      fillDur={30}
    />
  </Stage>
);

/** G: a new file slams into one of the photo's boxes ("Why they sometimes fail") */
const CAM_G: CamKey[] = [K(CUT_G, 'run', {zoom: 3.5}, {run: 1}), K(CUT_H + 4, 'run', {zoom: 3.9}, {run: 1})];
export const PreviewWrite: React.FC<{f: number}> = ({f}) => (
  <Stage frame={f} env={{kind: 'archive', light: 'cool'}} cam={CAM_G} drift={0.6} shake={[{at: T.fail + 1, strength: 0.9}]} hud={<Tag f={f} word={T.fail} text="Why they sometimes fail" />}>
    <Archive frame={f} state="HDD_DELETED" events={[{at: T.fail - 6, op: 'overwrite', target: 59, dur: 12}]} />
  </Stage>
);

/** H: the drive's own erase command, the amber pulse reaching every spot ("What actually erases a file") */
const L = archiveCam('layers');
export const PreviewSanitize: React.FC<{f: number; exit: number}> = ({f, exit}) => (
  <Stage frame={f} env={{kind: 'archive', light: 'ssd'}} cam={[{f: CUT_H, ...L, zoom: L.zoom * 1.1}, {f: exit + WHIP_DUR, ...L, zoom: L.zoom * 1.0}]} drift={0.6} hud={<Tag f={f} word={T.erases} text="What actually erases a file" />}>
    <Archive frame={f} state="SSD_STALE" events={[{at: T.erases - 3, op: 'sanitize', dur: 48}]} />
  </Stage>
);
