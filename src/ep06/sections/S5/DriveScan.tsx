/**
 * S5 local fx (world px, over the SSD <Archive> with its `boundary`): "The SSD doesn't read the index cards" (P12).
 * The drive actor sends amber scan rings out over its own side; each ring stops dead at the boundary, which lights up
 * as a pane where the ring hits it, and the drawer side (Windows' cards) goes dark from the drive's point of view.
 * HTML layers (cheap under the Stage bloom). `rings` = launch frames; `dim` = [in, out] frames of the drawer-side shade.
 */
import React from 'react';
import {EASE, GEOM, PAL, clamp01, prog, rgba} from '../../kit';

const RING_DUR = 30;
const R_MAX = 980;

export const DriveScan: React.FC<{frame: number; rings: readonly number[]; dim: readonly [number, number]; pane: readonly [number, number]}> = ({frame: f, rings, dim, pane}) => {
  const A = GEOM.actor;
  const B = GEOM.boundary;
  const shade = prog(f, dim[0], 18, EASE.inOut) * (1 - prog(f, dim[1], 16, EASE.inOut));
  const paneOn = prog(f, pane[0], 10, EASE.out) * (1 - prog(f, pane[1], 14, EASE.inOut));
  const nodes: React.ReactNode[] = [];
  let hitGlow = 0;
  for (const r0 of rings) {
    const t = f - r0;
    if (t < 0 || t > RING_DUR) continue;
    const u = EASE.out(t / RING_DUR);
    const R = 40 + (R_MAX - 40) * u;
    const op = 1 - clamp01((t - RING_DUR * 0.6) / (RING_DUR * 0.4));
    const left = A.x - R;
    // the ring is drawn only on the drive's side of the boundary
    const clipL = Math.max(0, B.x + 6 - left);
    nodes.push(
      <div
        key={`r${r0}`}
        style={{
          position: 'absolute',
          left,
          top: A.y - R,
          width: 2 * R,
          height: 2 * R,
          borderRadius: '50%',
          border: `${5 + 5 * (1 - u)}px solid ${rgba(PAL.drive, 0.85 * op)}`,
          boxShadow: `0 0 26px ${rgba(PAL.drive, 0.55 * op)}, inset 0 0 26px ${rgba(PAL.drive, 0.35 * op)}`,
          clipPath: `inset(0 0 0 ${clipL}px)`,
        }}
      />,
    );
    // where the ring meets the boundary: a hot spot that climbs the pane, and stops there
    const dx = A.x - B.x;
    if (R > dx) {
      const yh = A.y - Math.sqrt(R * R - dx * dx);
      if (yh > B.y0 && yh < B.y1) {
        hitGlow = Math.max(hitGlow, op);
        nodes.push(
          <div
            key={`h${r0}`}
            style={{
              position: 'absolute',
              left: B.x - 60,
              top: yh - 70,
              width: 120,
              height: 140,
              borderRadius: '50%',
              background: `radial-gradient(closest-side, ${rgba('#FFF1D6', 0.95 * op)}, ${rgba(PAL.drive, 0.55 * op)} 45%, rgba(0,0,0,0))`,
            }}
          />,
        );
      }
    }
  }
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      {/* Windows' side, seen from the drive: dark */}
      {shade > 0.01 ? (
        <div style={{position: 'absolute', left: -1200, top: -600, width: B.x - 6 + 1200, height: 2400, background: `linear-gradient(90deg, ${rgba('#03050A', 0.62 * shade)} 0%, ${rgba('#03050A', 0.62 * shade)} 82%, ${rgba('#03050A', 0.4 * shade)} 100%)`}} />
      ) : null}
      {/* the boundary as a lit pane on the drive's side */}
      {paneOn > 0.01 ? (
        <>
          <div style={{position: 'absolute', left: B.x + 4, top: B.y0, width: 70, height: B.y1 - B.y0, background: `linear-gradient(90deg, ${rgba(PAL.drive, (0.16 + 0.22 * hitGlow) * paneOn)}, rgba(0,0,0,0))`}} />
          <div style={{position: 'absolute', left: B.x + 2, top: B.y0, width: 3, height: B.y1 - B.y0, background: rgba('#FFE7B8', (0.35 + 0.5 * hitGlow) * paneOn)}} />
        </>
      ) : null}
      {nodes}
    </div>
  );
};
