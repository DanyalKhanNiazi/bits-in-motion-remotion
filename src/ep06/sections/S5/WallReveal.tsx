/**
 * S5 local composition (world px, inside the Stage): P10 "But underneath, the storage wall works very differently".
 * The hard-drive face of the wall comes off row by row, top to bottom: each row's steel face (a wall-only, empty
 * <Archive> skin) hinges up toward the camera, brightens as it catches the light and fades, uncovering the SSD's
 * graphite flash cells with their traces. Everything else (drawer, map, card, threads, Bits) is the SAME Archive state
 * drawn twice and split at a horizontal cut line, so only the wall's material changes; the Bits never move.
 *   rows [0, ROWS): row r starts lifting at at + r * stagger and is gone by + dur.
 */
import React from 'react';
import {Archive, EASE, GEOM, N_BOXES, clamp01, type ArchiveEvent, type ArchiveLight, type Content} from '../../kit';
import {FlashTraces} from './FlashTraces';

const ROWS = 9;
const P = 72;
const FAR = 1e6;
const EMPTY: Record<number, Content> = {};
for (let id = 1; id <= N_BOXES; id++) EMPTY[id] = 'empty';

export type WallRevealProps = {frame: number; at: number; stagger: number; dur: number; light: ArchiveLight; events: ArchiveEvent[]};

export const revealEnd = (p: {at: number; stagger: number; dur: number}): number => p.at + (ROWS - 1) * p.stagger + p.dur;

const clipAbove = (y: number) => `polygon(-4000px -4000px, 6000px -4000px, 6000px ${y}px, -4000px ${y}px)`;
const clipBelow = (y: number) => `polygon(-4000px ${y}px, 6000px ${y}px, 6000px 6000px, -4000px 6000px)`;

export const WallReveal: React.FC<WallRevealProps> = ({frame: f, at, stagger, dur, light, events}) => {
  const start = (r: number) => at + r * stagger;
  let started = 0;
  for (let r = 0; r < ROWS; r++) if (f >= start(r)) started++;
  const end = revealEnd({at, stagger, dur});
  // the cut between the revealed (SSD) and the still-covered (hard-drive look) part of the world
  const yCut = started === 0 ? -1e5 : started >= ROWS ? 1e5 : GEOM.wall.y + started * P - 4;
  // SSD under the face: no flip, so trays and graphite cells show; its chip fades in once the face is off
  const ssd = (
    <Archive frame={f} state="SSD_SAVED" light={light} events={events} show={{platter: 0, actor: [[end - 8, 0], [end + 10, 1]]}} />
  );
  // the hard-drive look: the same state with its flip pushed out of reach (hdd tiles, no trays, no chip)
  const hdd = <Archive frame={f} state="SSD_SAVED" light={light} events={events} flip={{at: FAR, dur: 46}} show={{platter: 0}} />;
  const panels: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const t = f - start(r);
    if (t < 0 || t >= dur) continue;
    const u = t / dur;
    const e = EASE.inOut(u);
    const y0 = GEOM.wall.y + r * P - 4;
    const y1 = y0 + P;
    const x0 = GEOM.wall.x - 6;
    const x1 = GEOM.wall.x + 16 * P + 2;
    const cx = (x0 + x1) / 2;
    const op = 1 - clamp01((u - 0.5) / 0.5) ** 1.4;
    const glow = Math.sin(Math.PI * Math.min(1, u * 1.4));
    panels.push(
      <div
        key={r}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1920,
          height: 1080,
          transformOrigin: `${cx}px ${y0}px`,
          transform: `perspective(1300px) translateY(${-30 * e}px) translateZ(${110 * e}px) rotateX(${-82 * e}deg)`,
          opacity: op,
          filter: `brightness(${1 + 0.55 * glow})`,
        }}
      >
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `polygon(${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px)`}}>
          <Archive frame={f} state="SSD_SAVED" light={light} boxes={EMPTY} flip={{at: FAR, dur: 46}} show={{drawer: 0, map: 0, card: 0, threads: 0, ghost: 0, actor: 0, platter: 0}} />
        </div>
        {/* the underside edge catching the light as the face swings up */}
        <div style={{position: 'absolute', left: x0, top: y1 - 3, width: x1 - x0, height: 6, background: `rgba(255,236,200,${0.7 * glow})`, borderRadius: 3}} />
      </div>,
    );
  }
  return (
    <>
      {started > 0 ? <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: clipAbove(yCut)}}>{ssd}</div> : null}
      {started > 0 ? <FlashTraces frame={f} maxY={yCut} /> : null}
      {started < ROWS ? <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: clipBelow(yCut)}}>{hdd}</div> : null}
      {panels}
    </>
  );
};
