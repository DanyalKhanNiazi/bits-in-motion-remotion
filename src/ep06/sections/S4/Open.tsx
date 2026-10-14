// S4 shot 1 [from−30, whip1+12): the S3 join. `photoBoxes`, HDD_DELETED, the ghost future write hovering above 059.
// It stretches up into a white light shaft: the recovery scanner's beam entering from ABOVE (the same side), whose
// footprint glides over the photo's boxes. AtlasOpener "Recovery" lands on "recovery".
import React from 'react';
import {Archive, AtlasOpener, EASE, Stage, archiveCam, boxC, lerp, poseAt, prog, type CamKey} from '../../kit';
import {CUT, T} from './t';
import {at} from '../../timing';
import {GhostWrite, LightShaft, Wash} from './fx';

const PB = archiveCam('photoBoxes');
// S3 lands on photoBoxes with a push (inCubic) and expects it to carry on linearly (+8 % over 30 f); keep that, then ease.
export const OPEN_CAM: CamKey[] = [
  {f: T.from, ...PB},
  {f: T.from + 30, ...PB, zoom: PB.zoom * 1.08, ease: (t: number) => t},
  {f: CUT.whip1 + 12, x: PB.x + 24, y: PB.y + 6, zoom: PB.zoom * 1.13, ease: 'out'},
];
/** S3's ghost write appears on "that space" − 4 (its bob phase) */
const GHOST_BORN = at(7, 'that space').start - 4;

/** footprint path over the photo's boxes: 059 → 022 → 099 */
const footAt = (f: number) => {
  const a = boxC(59);
  const b = boxC(22);
  const c = boxC(99);
  const u1 = prog(f, T.from + 14, 30, EASE.inOut);
  const u2 = prog(f, T.from + 46, 28, EASE.inOut);
  return {x: lerp(lerp(a.x, b.x, u1), c.x, u2), y: lerp(lerp(a.y, b.y, u1), c.y, u2)};
};

export const OpenShot: React.FC<{f: number}> = ({f}) => {
  const c = boxC(59);
  const born = T.from + 2;
  const morph = prog(f, born, 16, EASE.inCubic);
  const shaftOp = prog(f, born + 4, 12, EASE.out);
  const ft = footAt(f);
  // the source sits above-right, off frame, and drifts with the footprint like a moving scan head
  const src = {x: lerp(c.x + 300, ft.x + 240, prog(f, born, 70, EASE.inOut)), y: -120};
  const rx = lerp(36, 96, prog(f, born + 4, 20, EASE.out));
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={OPEN_CAM}
      hud={<AtlasOpener frame={f} at={T.recovery - 20} word="Recovery" y={540} />}
    >
      <Archive frame={f} state="HDD_DELETED" light="cool" />
      <GhostWrite f={f} cx={c.x} cy={c.y} bornAt={GHOST_BORN} u={f < born ? 0 : morph} />
      <Wash x={ft.x} y={ft.y} rx={rx * 1.6} ry={rx * 0.9} op={shaftOp} />
      <LightShaft f={f} sx={src.x} sy={src.y} tx={ft.x} ty={ft.y} rx={rx} op={shaftOp} />
    </Stage>
  );
};
export const openPose = (f: number) => poseAt(f, OPEN_CAM);
