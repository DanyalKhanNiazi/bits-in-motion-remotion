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

/** light: the SSD's (graphite) light; hddLight: the hard-drive face keeps its warmer light, so steel and graphite differ */
export type WallRevealProps = {frame: number; at: number; stagger: number; dur: number; light: ArchiveLight; hddLight?: ArchiveLight; events: ArchiveEvent[]};

export const revealEnd = (p: {at: number; stagger: number; dur: number}): number => p.at + (ROWS - 1) * p.stagger + p.dur;

const clipAbove = (y: number) => `polygon(-4000px -4000px, 6000px -4000px, 6000px ${y}px, -4000px ${y}px)`;
const clipBelow = (y: number) => `polygon(-4000px ${y}px, 6000px ${y}px, 6000px 6000px, -4000px 6000px)`;

export const WallReveal: React.FC<WallRevealProps> = ({frame: f, at, stagger, dur, light, hddLight = light, events}) => {
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
  const hdd = <Archive frame={f} state="SSD_SAVED" light={hddLight} events={events} flip={{at: FAR, dur: 46}} show={{platter: 0}} />;
  const shadows: React.ReactNode[] = [];
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
    const op = 1 - clamp01((u - 0.55) / 0.45) ** 1.4;
    const glow = Math.sin(Math.PI * Math.min(1, u * 1.4));
    // the face first shows the Bits through its boxes (it matches the covered rows), then they stay behind on the graphite
    const bitsOp = 1 - clamp01((u - 0.3) / 0.35);
    shadows.push(<div key={`s${r}`} style={{position: 'absolute', left: x0, top: y0, width: x1 - x0, height: P, background: `linear-gradient(180deg, rgba(0,0,0,${0.6 * (1 - u)}), rgba(0,0,0,${0.15 * (1 - u)}))`}} />);
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
          transform: `perspective(1300px) translateY(${-64 * e}px) translateZ(${170 * e}px) rotateX(${-72 * e}deg)`,
          opacity: op,
          filter: `brightness(${1 + 0.3 * glow})`,
        }}
      >
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: `polygon(${x0}px ${y0}px, ${x1}px ${y0}px, ${x1}px ${y1}px, ${x0}px ${y1}px)`}}>
          <Archive frame={f} state="SSD_SAVED" light={hddLight} boxes={EMPTY} flip={{at: FAR, dur: 46}} show={{drawer: 0, map: 0, card: 0, threads: 0, ghost: 0, actor: 0, platter: 0}} />
          {bitsOp > 0.01 ? (
            <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: bitsOp}}>
              <Archive frame={f} state="SSD_SAVED" light={hddLight} events={events} flip={{at: FAR, dur: 46}} show={{drawer: 0, map: 0, card: 0, threads: 0, ghost: 0, actor: 0, platter: 0}} />
            </div>
          ) : null}
        </div>
      </div>,
    );
  }
  return (
    <>
      {started > 0 ? <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: clipAbove(yCut)}}>{ssd}</div> : null}
      {started > 0 ? <FlashTraces frame={f} maxY={yCut} /> : null}
      {shadows}
      {started < ROWS ? <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, clipPath: clipBelow(yCut)}}>{hdd}</div> : null}
      {panels}
    </>
  );
};
