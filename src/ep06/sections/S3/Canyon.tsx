// S3 shot B: "at least one entry for every file". The crane rises off the drawer until it is a canyon of blank,
// nameless kit IndexCards receding into haze; on "Your photo's entry" the photo's card rises out of its row.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {EASE, IndexCard, PAL, Stage, clamp01, poseAt, prog, rgba, springAt, toScreen, type CamKey} from '../../kit';
import {T} from './t';

const VP = {x: 960, y: 120};
const Y0 = 930; // card centre of the front row
const W0 = 430;
const ROWS = 9;
const COLS = [-2, -1, 0, 1, 2];
const K = 0.79;
const PHOTO_CELL = {d: 1, c: 0};
const rowK = (d: number) => Math.pow(K, d);
const cellPos = (d: number, c: number) => {
  const k = rowK(d);
  return {x: VP.x + c * 470 * k, y: VP.y + (Y0 - VP.y) * k, w: W0 * k, k};
};

/** where the photo's card is (world = screen at zoom 1 of this shot) and how far it has risen */
export const canyonPhoto = (f: number) => {
  const p = cellPos(PHOTO_CELL.d, PHOTO_CELL.c);
  const r = springAt(f, T.yourEntry, {damping: 16, stiffness: 120, mass: 1});
  return {x: p.x, y: p.y - 190 * r, w: p.w * (1 + 0.22 * r), rise: r};
};

export const CANYON_CAM: CamKey[] = [
  {f: T.withAt - 14, x: 960, y: 760, zoom: 1.7},
  {f: T.driveEnd, x: 960, y: 500, zoom: 0.94, ease: 'inOut'},
  {f: T.yourEntry + 6, x: 960, y: 490, zoom: 0.97},
  {f: T.yourEntry + 34, x: 960, y: 560, zoom: 2.3, ease: 'inCubic'},
];

export const CanyonShot: React.FC<{f: number}> = ({f}) => {
  const ph = canyonPhoto(f);
  const cards: React.ReactNode[] = [];
  for (let d = ROWS - 1; d >= 1; d--) {
    // deeper rows arrive as the crane rises: the drawer keeps going
    const appear = d <= 2 ? 1 : prog(f, T.withAt + (d - 2) * 6, 14, EASE.out);
    if (appear <= 0.01) continue;
    for (const c of COLS) {
      if (d === PHOTO_CELL.d && c === PHOTO_CELL.c) continue;
      const p = cellPos(d, c);
      const haze = 0.18 + 0.82 * Math.pow(p.k, 1.15);
      // edge columns sit a little lower: the canyon walls
      const wall = Math.abs(c) === 2 ? 26 * p.k : 0;
      cards.push(
        <IndexCard key={`${d}:${c}`} frame={f + d * 13 + c * 7} x={p.x} y={p.y + wall + (1 - appear) * 40 * p.k} w={p.w} variant="blank" opacity={haze * appear} shadow={p.k} />,
      );
    }
  }
  const glow = ph.rise;
  return (
    <Stage frame={f} env={{kind: 'archive', light: 'warm'}} cam={CANYON_CAM}>
      <AbsoluteFill>
        {/* haze toward the vanishing point */}
        <div style={{position: 'absolute', left: VP.x - 900, top: VP.y - 420, width: 1800, height: 900, background: `radial-gradient(ellipse 50% 50% at 50% 50%, ${rgba('#B9C6DA', 0.16)}, rgba(0,0,0,0))`}} />
        {cards}
        {/* the photo's card: rises out of its row with a soft white glow behind it */}
        <div
          style={{
            position: 'absolute',
            left: ph.x - ph.w * 0.9,
            top: ph.y - ph.w * 0.75,
            width: ph.w * 1.8,
            height: ph.w * 1.5,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${rgba('#FFFFFF', 0.28 * glow)}, ${rgba(PAL.structure, 0.12 * glow)} 55%, rgba(0,0,0,0))`,
          }}
        />
        <IndexCard frame={f} x={ph.x} y={ph.y} w={ph.w} variant="photo" shadow={1 + glow} opacity={clamp01(0.9 + 0.1 * glow)} />
        {/* front rows in front of the rising card's lower edge */}
        {COLS.map((c) => {
          const p = cellPos(0, c);
          const wall = Math.abs(c) === 2 ? 26 : 0;
          return <IndexCard key={`f${c}`} frame={f + c * 7} x={p.x} y={p.y + wall} w={p.w} variant="blank" shadow={1} />;
        })}
      </AbsoluteFill>
    </Stage>
  );
};

/** the photo card's screen point at a frame (for the ZoomThrough centre) */
export const canyonPhotoScreen = (f: number) => {
  const ph = canyonPhoto(f);
  return toScreen(poseAt(f, CANYON_CAM), ph.x, ph.y);
};
