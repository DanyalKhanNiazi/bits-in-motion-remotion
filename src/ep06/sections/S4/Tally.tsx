// The coral write tally (hud, screen px): one notch per write, no digits. Shared by the archive and the slot shots.
import React from 'react';
import {WriteTally, prog, rgba, PAL} from '../../kit';
import {T} from './t';
import {LIVE} from './live';

export const TALLY = {x: 1612, y: 150, size: 70} as const;
export const TALLY_AT = T.download - 10;
export const TALLY_EXIT = T.to - 22;
const HITS = [T.download + 1, T.update + 1, T.temp + 1, T.create + 4, T.overwrite + 2, ...LIVE.map((w) => w.at)];

export const Tally: React.FC<{f: number}> = ({f}) => {
  if (f < TALLY_AT - 1) return null;
  // "every write": the full group pulses once
  const pulse = LIVE.reduce((m, w) => Math.max(m, f >= w.at && f < w.at + 20 ? Math.sin(((f - w.at) / 20) * Math.PI) : 0), 0);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: TALLY.x - 110,
          top: TALLY.y - 70,
          width: 300,
          height: 140,
          borderRadius: 70,
          background: `radial-gradient(closest-side, ${rgba('#05080F', 0.55 * prog(f, TALLY_AT, 8) * (1 - prog(f, TALLY_EXIT, 8)))}, rgba(0,0,0,0))`,
        }}
      />
      {pulse > 0 ? (
        <div style={{position: 'absolute', left: TALLY.x - 90, top: TALLY.y - 80, width: 260, height: 160, borderRadius: 80, background: `radial-gradient(closest-side, ${rgba(PAL.loss, 0.35 * pulse)}, rgba(0,0,0,0))`}} />
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 0, transform: pulse > 0 ? `translate(${TALLY.x}px, ${TALLY.y}px) scale(${1 + 0.12 * pulse}) translate(${-TALLY.x}px, ${-TALLY.y}px)` : undefined}}>
        <WriteTally frame={f} x={TALLY.x} y={TALLY.y} hits={HITS} size={TALLY.size} at={TALLY_AT} exitAt={TALLY_EXIT} />
      </div>
    </>
  );
};
