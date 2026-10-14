/**
 * S2 · P03–P05 [1409, 3167): the Recycle Bin is a move, the picture (boxes and cards), the file system / NTFS, the real
 * drive and its clusters. HDD_SAVED. Plan: docs/ep06/plans/S2_plan.md. Every timing comes from the word clock in S2/t.ts.
 */
import React from 'react';
import {Whip, ZoomThrough} from '../kit';
import {T, K} from './S2/t';
import {binScreen, binShot, deskShot} from './S2/desk';
import {archC, archCWallScreen, archE, driveDiveScreen, driveShot} from './S2/archive';
import {TapeFx} from './S2/fx';

export const S2: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(T.from - 30, Math.min(T.to + 29, frame));
  // A → B: the bin on the monitor → the bin on the hardware stage
  if (f < K.rw1) {
    const c = binScreen(K.zt1);
    return <ZoomThrough frame={f} at={K.zt1} dur={16} cx={c.x} cy={c.y} a={deskShot} b={binShot} />;
  }
  // "restore": tape rewind; the cut back to the screen hides inside it
  if (f < K.rw1 + K.rw1Dur) {
    return (
      <TapeFx frame={f} at={K.rw1} dur={K.rw1Dur}>
        {f < K.rwCut ? binShot(f) : deskShot(f)}
      </TapeFx>
    );
  }
  // "The real question": delete again → the bin on the stage, its menu, the cursor hovering
  if (f < K.whip) {
    const c = binScreen(K.zt5);
    return <ZoomThrough frame={f} at={K.zt5} dur={16} cx={c.x} cy={c.y} a={deskShot} b={binShot} />;
  }
  // "or skip it": a whip back to the folder (no rewind: that look belongs to "restore"), then Shift + Delete; the opener
  if (f < K.zt2) return <Whip frame={f} at={K.whip} dur={K.whipDur} dir="right" a={binShot} b={deskShot} />;
  if (f < K.zt3) return <ZoomThrough frame={f} at={K.zt2} dur={16} a={deskShot} b={archC} />;
  if (f < K.zt4) {
    const c = archCWallScreen(K.zt3);
    return <ZoomThrough frame={f} at={K.zt3} dur={16} cx={c.x} cy={c.y} a={archC} b={driveShot} />;
  }
  const d = driveDiveScreen(K.zt4);
  return <ZoomThrough frame={f} at={K.zt4} dur={16} cx={d.x} cy={d.y} a={driveShot} b={archE} />;
};
