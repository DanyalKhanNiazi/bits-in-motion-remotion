// S4 shot 1 [from−30, whip1+12): the S3 join. `photoBoxes`, HDD_DELETED, the ghost future write hovering above 059.
// It stretches up into a white light shaft: the recovery scanner's beam entering from ABOVE (the same side), whose
// footprint glides over the photo's boxes. AtlasOpener "Recovery" lands on "recovery".
import React from 'react';
import {Archive, AtlasOpener, EASE, Stage, archiveCam, boxC, boxXY, clamp01, lerp, poseAt, prog, smooth, type CamKey} from '../../kit';
import {CUT, T} from './t';
import {GhostWrite, LightShaft, Wash} from './fx';

const PB = archiveCam('photoBoxes');
export const OPEN_CAM: CamKey[] = [
  {f: T.from, ...PB},
  {f: CUT.whip1 + 12, x: PB.x + 26, y: PB.y + 8, zoom: PB.zoom * 1.07, ease: 'inOut'},
];

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
  const g = boxXY(59);
  const born = T.from + 2;
  const morph = prog(f, born, 14, EASE.inCubic);
  const ghostOp = 1 - smooth(clamp01((f - born - 6) / 10));
  const shaftOp = prog(f, born + 6, 10, EASE.out);
  const ft = footAt(f);
  const src = {x: lerp(boxC(59).x + 40, ft.x + 90, prog(f, born, 70, EASE.inOut)), y: 40};
  const rx = lerp(40, 92, prog(f, born + 6, 18, EASE.out));
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={OPEN_CAM}
      hud={<AtlasOpener frame={f} at={T.recovery - 20} word="Recovery" y={540} />}
    >
      <Archive frame={f} state="HDD_DELETED" light="cool" />
      <GhostWrite f={f} x={g.x} y={g.y - 96} op={f < born ? 1 : ghostOp} stretch={morph} />
      <Wash x={ft.x} y={ft.y} rx={rx * 1.6} ry={rx * 0.9} op={shaftOp} />
      <LightShaft f={f} sx={src.x} sy={src.y} tx={ft.x} ty={ft.y} rx={rx} op={shaftOp} />
    </Stage>
  );
};
export const openPose = (f: number) => poseAt(f, OPEN_CAM);
