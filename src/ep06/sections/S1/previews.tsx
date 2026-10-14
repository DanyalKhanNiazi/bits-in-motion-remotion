// S1 micro-previews (P02's promise): three ~1-s crops of later shots, each tagged on its beat word.
import React from 'react';
import {Archive, KineticText, PAL, ScannerProp, Stage, archiveCam, type CamKey, type Framing} from '../../kit';
import {T} from './times';

const K = (f: number, fr: Framing, o: Partial<CamKey> = {}, opt?: {run?: number}): CamKey => ({f, ...archiveCam(fr, opt), ...o});
export const CUT_F = T.work - 3;
export const CUT_G = T.fail - 4;
export const CUT_H = T.erases - 4;

const Tag: React.FC<{f: number; at: number; text: string; exit: number}> = ({f, at, text, exit}) => (
  <KineticText frame={f} at={at} exitAt={exit} text={text} x={120} y={150} align="left" size={72} mode="rise" />
);

/** F: the recovery scanner rebuilds the photo in its tray ("Why recovery tools work") */
export const PreviewScan: React.FC<{f: number}> = ({f}) => (
  <Stage frame={f} env={{kind: 'stage', spot: 900, floor: 800}} cam={[{f: CUT_F, zoom: 1.12, x: 940, y: 560}, {f: CUT_G + 4, zoom: 1.02, x: 960, y: 540}]} hud={<Tag f={f} at={T.work} text="Why recovery tools work" exit={CUT_G - 2} />}>
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
  <Stage frame={f} env={{kind: 'archive', light: 'cool'}} cam={CAM_G} drift={0.6} shake={[{at: T.fail + 1, strength: 0.9}]} hud={<Tag f={f} at={T.fail} text="Why they sometimes fail" exit={CUT_H - 2} />}>
    <Archive frame={f} state="HDD_DELETED" events={[{at: T.fail - 6, op: 'overwrite', target: 59, dur: 12}]} />
  </Stage>
);

/** H: the drive's own erase command, the amber pulse reaching every spot ("What actually erases a file") */
const L = archiveCam('layers');
const CAM_H: CamKey[] = [{f: CUT_H, ...L, zoom: L.zoom * 1.1}, {f: CUT_H + 44, ...L, zoom: L.zoom * 1.0}];
export const PreviewSanitize: React.FC<{f: number; exit: number}> = ({f, exit}) => (
  <Stage frame={f} env={{kind: 'archive', light: 'ssd'}} cam={CAM_H} drift={0.6} hud={<Tag f={f} at={T.erases} text="What actually erases a file" exit={exit - 2} />}>
    <Archive frame={f} state="SSD_STALE" events={[{at: T.erases - 3, op: 'sanitize', dur: 40}]} />
  </Stage>
);
