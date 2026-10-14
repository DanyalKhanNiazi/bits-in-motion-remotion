// S2 · P04–P05: the picture (the Wall and the Drawer), the file system / NTFS, the drive, clusters.
import React from 'react';
import {
  Archive,
  BOX,
  DIVE_POINTS,
  Footnote,
  GEOM,
  Label,
  PAL,
  PassportCard,
  PhotoBits,
  Stage,
  SwapVariant,
  archiveAnchors,
  archiveCam,
  boxC,
  boxXY,
  poseAt,
  propPoint,
  propRect,
  springAt,
  toScreen,
  track,
  EASE,
  SPRING,
  type ArchiveEvent,
  type CamKey,
  type PresetName,
} from '../../kit';
import {BoxFlash, BoxGlints, Bracket, Leaders, Nameplate, Spotlight} from './fx';
import {K, T} from './t';

const STATE: PresetName = 'HDD_SAVED';
const LIGHT = 'warm' as const;

/* ---------------------------------------------------------------- C: "Imagine" → the huge wall → drawer → pour → threads → NTFS */
const HERO_BOX = 38; // a bin under the registered cluster-wall_b render (code cols 4–9 × rows 1–5)
const hb = boxC(HERO_BOX);
const WALL_C = {x: GEOM.wall.x + GEOM.wall.w / 2, y: GEOM.wall.y + GEOM.wall.h / 2};
const C_EVENTS: ArchiveEvent[] = [
  {at: T.drawer - 8, op: 'build', target: 'drawer', dur: 30},
  {at: T.drawer + 16, op: 'build', target: 'map', dur: 30},
  {at: T.boxesHold, op: 'pour', dur: 36},
  {at: T.whichBoxes + 6, op: 'threads', dur: 18},
];
const C_CAM: CamKey[] = [
  {f: K.zt2, x: hb.x, y: hb.y, zoom: 3.02},
  {f: T.huge - 2, x: hb.x, y: hb.y, zoom: 3.16},
  {f: T.huge + 24, x: WALL_C.x, y: WALL_C.y, zoom: 1.75, dur: 26, ease: 'outExpo'},
  {f: T.next - 4, x: 1236, y: 566, zoom: 1.6},
  {f: T.drawer + 6, ...archiveCam('wide'), dur: 42},
  {f: T.cardsSay, x: 990, y: 548, zoom: 1.05},
  {f: T.p5 - 2, x: 950, y: 540, zoom: 1.07},
  {f: T.fileSystem - 2, x: 976, y: 432, zoom: 0.78, dur: 40},
  {f: T.modern, x: 996, y: 440, zoom: 0.8},
  {f: T.ntfs - 4, x: 980, y: 436, zoom: 0.84},
  {f: K.zt3 + 16, x: 1120, y: 500, zoom: 1.02, ease: 'inCubic', dur: 30},
];
const cProps = (f: number) => ({
  frame: f,
  state: STATE,
  light: LIGHT,
  events: C_EVENTS,
  show: {
    wall: [[T.huge + 1, 0], [T.huge + 13, 1]] as const,
    ghost: [[T.huge + 4, 0], [T.huge + 18, 1]] as const,
  },
  renders: {wall: [[T.huge + 1, 1], [T.huge + 15, 0]] as const},
});

export const archC = (f: number): React.ReactElement => {
  const A = cProps(f);
  const pose = poseAt(f, C_CAM);
  const hp = toScreen(pose, hb.x, hb.y);
  const spot = track(f, [[T.huge, 1], [T.huge + 12, 0]]);
  // the file-system bracket spans the drawer and the wall
  const bl = toScreen(pose, GEOM.drawer.x - 12, 196);
  const br = toScreen(pose, GEOM.wall.x + GEOM.wall.w + 12, 196);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: LIGHT}}
      cam={C_CAM}
      shake={[{at: T.ntfs + 2, strength: 0.55}]}
      hud={
        <>
          <Spotlight x={hp.x} y={hp.y} r={BOX * pose.zoom} amount={spot} />
          <Bracket frame={f} at={T.fileSystem - 2} exitAt={K.zt3 + 2} x0={bl.x} x1={br.x} y={bl.y} tick={26} />
          <Nameplate frame={f} x={(bl.x + br.x) / 2} y={bl.y} fsAt={T.fileSystem} ntfsAt={T.ntfs} exitAt={K.zt3 + 2} />
        </>
      }
    >
      <Archive {...A} />
      <BoxGlints frame={f} at={T.same + 2} dur={34} mode="wave" />
      <BoxGlints frame={f} at={T.rules - 10} dur={72} mode="order" />
    </Stage>
  );
};
/** the wall centre on screen (ZoomThrough C → D) */
export const archCWallScreen = (f: number) => toScreen(poseAt(f, C_CAM), WALL_C.x, WALL_C.y);

/* ---------------------------------------------------------------- D: the real drive on the hardware stage; it explodes on "divides" */
const DRIVE = {x: 960, y: 566, w: 940};
const D_CAM: CamKey[] = [
  {f: K.zt3, x: 960, y: 540, zoom: 1.0},
  {f: K.swap, x: 966, y: 542, zoom: 1.07},
  {f: K.zt4 + 16, x: 980, y: 548, zoom: 1.16, ease: 'inCubic'},
];
export const driveShot = (f: number): React.ReactElement => (
  <Stage frame={f} env={{kind: 'stage', spot: 960, floor: 820, warm: 0.25}} cam={D_CAM} shake={[{at: K.swap, strength: 0.5}]}>
    <SwapVariant
      frame={f}
      srcs={['hard-drive_a', 'hard-drive_d']}
      swaps={[K.swap]}
      via="flash"
      {...DRIVE}
      rot={[[K.zt3, -4], [K.swap, 0, EASE.inOut]] as const}
      rim={{color: PAL.structure, strength: 0.7}}
      sweep={{at: [T.realWord - 4, K.swap + 4], dur: 18, strength: 0.7}}
      shadow={{opacity: 0.6}}
      float={3}
    />
  </Stage>
);
/** the dive point on the exploded drive, on screen */
export const driveDiveScreen = (f: number) => {
  const d = DIVE_POINTS['hard-drive_d'] ?? [620, 520];
  const p = propPoint('hard-drive_d', DRIVE, d[0], d[1]);
  return toScreen(poseAt(f, D_CAM), p.x, p.y);
};

/**
 * The photo's wipe for the kit PhotoBits dissolve (same diagonal wave, same grid), as a CSS clip on the load-gated
 * PassportCard. Workaround: the kit's own wipe draws the image as an SVG <image>, which is not delayRender-gated and
 * rendered a half-decoded sliver on the first dissolve frame (3101 in r2). Returns undefined (no clip) before `at`.
 */
const dissolveClip = (f: number, at: number, dur: number, r: {x: number; y: number; w: number; h: number}, cols: number, rows: number): string | undefined => {
  if (f <= at) return undefined;
  const front = Math.min(1, Math.max(0, (f - at) / dur)) / 0.6;
  const cw = r.w / cols;
  const ch = r.h / rows;
  const pad = 80; // rim, sleeve edge and contact shadow outside the photo's rect
  const parts: string[] = [];
  for (let rw = 0; rw < rows; rw++) {
    let c0 = cols;
    for (let c = 0; c < cols; c++)
      if ((c / cols + rw / rows) / 2 / 0.6 + 0.05 > front) {
        c0 = c;
        break;
      }
    if (c0 >= cols) continue;
    const x0 = c0 === 0 ? r.x - pad : r.x + c0 * cw;
    const y0 = rw === 0 ? r.y - pad : r.y + rw * ch;
    const y1 = rw === rows - 1 ? r.y + r.h + pad : r.y + (rw + 1) * ch + 0.5;
    const x1 = r.x + r.w + pad;
    parts.push(`M${x0.toFixed(1)} ${y0.toFixed(1)}H${x1.toFixed(1)}V${y1.toFixed(1)}H${x0.toFixed(1)}Z`);
  }
  return parts.length ? `path('${parts.join('')}')` : `path('M0 0Z')`;
};

/* ---------------------------------------------------------------- E: the real wall: rows thunk in, clusters, the photo is too big, its bytes spread */
const E_EVENTS: ArchiveEvent[] = [
  {at: K.zt4 + 4, op: 'build', target: 'wall', dur: 52},
  {at: K.pourE, op: 'pour', dur: 18},
  {at: T.clusters2 - 12, op: 'threads', dur: 16},
];
const B24 = boxXY(24); // kept empty (an erase-group neighbour): the "one box"
const PH_W = 190;
const PH_X = B24.x + BOX / 2;
const PH_REST = (() => {
  const r = propRect('fictional-passport_b', {x: 0, y: 0, w: PH_W});
  return B24.y - r.h / 2 - 3;
})();
const wide = archiveCam('wide');
const drw = archiveCam('drawer');
const towardDrawer = (u: number) => ({x: wide.x + (drw.x - wide.x) * u, y: wide.y + (drw.y - wide.y) * u, zoom: Math.exp(Math.log(drw.zoom) * u)});
const E_CAM: CamKey[] = [
  {f: K.zt4, x: WALL_C.x, y: WALL_C.y, zoom: 1.5},
  {f: T.clusters - 4, x: WALL_C.x, y: 572, zoom: 1.6},
  {f: T.yourPhoto + 20, x: PH_X - 14, y: 262, zoom: 2.0, dur: 40},
  {f: T.soIts + 6, x: PH_X - 8, y: 258, zoom: 2.08},
  {f: T.clusters2 - 14, ...wide, dur: 36},
  {f: T.to - 18, x: 956, y: 538, zoom: 1.005},
  {f: T.to + 2, ...towardDrawer(0.2), ease: 'inCubic'},
  {f: T.to + 40, ...towardDrawer(0.75), ease: 'linear'},
];
export const archE = (f: number): React.ReactElement => {
  const A = {frame: f, state: STATE, light: LIGHT, events: E_EVENTS};
  const pose = poseAt(f, E_CAM);
  const an = archiveAnchors(A, f, pose);
  // the photo: drops in over box 024, settles on it on "one box" (far too big), dissolves into its Bits on "so its bytes"
  const drop = springAt(f, T.oneBox - 2, SPRING.heavy);
  const y = PH_REST - 70 * (1 - Math.min(1.08, drop)) - 3 * Math.sin(f / 13) * (1 - Math.min(1, drop));
  const sinkFrom = (() => {
    const r = propRect('fictional-passport_b', {x: PH_X, y: PH_REST, w: PH_W});
    return {x: r.x0, y: r.y0, w: r.w, h: r.h};
  })();
  const lab = {x: 760, y: 150};
  const tgt = [an.box(40), an.box(37), an.box(71)].map((p) => toScreen(pose, p.x, p.y));
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: LIGHT}}
      cam={E_CAM}
      shake={[{at: T.oneBox + 4, strength: 0.25}]}
      hud={
        <>
          <Footnote frame={f} at={K.zt4 + 14} exitAt={T.yourPhoto - 2} text="Simplified: grid, not platter layout" />
          <Label frame={f} at={T.clusters} exitAt={T.yourPhoto - 2} text="clusters" x={lab.x} y={lab.y} to={tgt[0]} side="right" size={72} />
          <Leaders frame={f} at={T.clusters + 4} exitAt={T.yourPhoto - 2} from={{x: lab.x, y: lab.y}} to={[tgt[1], tgt[2]]} />
        </>
      }
    >
      <Archive {...A} />
      <BoxFlash frame={f} at={T.oneBox} id={24} until={T.soIts + 2} />
      {f < T.soIts + 14 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, overflow: 'visible', clipPath: dissolveClip(f, T.soIts, 14, sinkFrom, 10, 13)}}>
          <PassportCard
            frame={f}
            variant="screen"
            x={PH_X}
            y={y}
            w={PH_W}
            enter={{kind: 'drop', at: T.yourPhoto - 2}}
            rim={{color: PAL.structure, strength: 0.45}}
            sweep={{at: [T.yourPhoto + 10], dur: 16}}
            shadow={{opacity: 0.5, dy: 14}}
          />
        </div>
      ) : null}
      {f >= T.soIts - 1 && f < T.soIts + 14 ? <PhotoBits frame={f} at={T.soIts} dur={14} mode="dissolve" from={sinkFrom} grid={[10, 13]} /> : null}
      <PhotoBits frame={f} at={T.soIts + 14} dur={30} mode="sink" from={sinkFrom} to={an.photo} grid={[10, 13]} />
    </Stage>
  );
};
