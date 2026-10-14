/**
 * Bits for the Living Schematic. Geometry and timing come from the kit (bitRun, bitState): a 24 px rounded
 * square in information cyan, 4-frame ease-in, linear cruise, 5-frame ease-out, a 4-square trail, the square
 * landing ripple (24 → 80 px), absorbed after its last landing unless parked. Light-theme drawing: a 2 px
 * surface keyline instead of a halo.
 *
 * Style additions:
 *   - formation: a resting Bit scales in over 3 frames at the button's output (it "forms"), no cap travel;
 *   - the rewind variant (f327–f345): drawn hollow, with its trail LEADING it and the lit route segment
 *     ahead of it retracting as it passes (the time-reversal of a forward run), so it never reads as a
 *     present-time signal travelling back to the button.
 */
import React from 'react';
import {BIT, EASE, bitState, clamp01, lerp, progress, squarePath, type BitRun} from '../../shared';
import {T} from './theme';

const r = (sz: number) => (BIT.radius * sz) / BIT.size;

export const BitDraw: React.FC<{frame: number; runs: BitRun | BitRun[]; restFrom?: number; park?: boolean; fadeOutAt?: number}> = ({frame, runs, restFrom, park, fadeOutAt}) => {
  const s = bitState(frame, runs, {trail: true, ripple: true, park, restFrom, color: T.info, isDark: false});
  const fade = fadeOutAt !== undefined ? 1 - progress(frame, fadeOutAt, 4, EASE.exit) : 1;
  if (fade <= 0) return null;
  const form = s.status === 'resting' && restFrom !== undefined ? progress(frame, restFrom, 3, EASE.arrive) : 1;
  return (
    <g opacity={fade}>
      {s.trail
        .slice()
        .reverse()
        .map((t, i) => (
          <path key={`t${i}`} d={squarePath(t.x, t.y, t.size, r(t.size))} fill={T.info} fillOpacity={t.opacity} />
        ))}
      {s.core ? (
        <g opacity={s.core.opacity}>
          <path d={squarePath(s.core.x, s.core.y, (s.core.size * s.core.scale + BIT.keyline * 2) * form, r(s.core.size) + BIT.keyline)} fill={T.surface} />
          <path d={squarePath(s.core.x, s.core.y, s.core.size * s.core.scale * form, r(s.core.size * s.core.scale))} fill={T.info} />
        </g>
      ) : null}
      {s.ripples.map((rp, i) => (
        <path key={`r${i}`} d={squarePath(rp.x, rp.y, rp.size, r(rp.size))} fill="none" stroke={T.info} strokeWidth={rp.stroke} strokeOpacity={rp.opacity} strokeLinejoin="round" />
      ))}
    </g>
  );
};

/** The rewind: a hollow Bit running back along its own route, trail leading, lit segment retracting ahead. */
export const RewindBit: React.FC<{frame: number; run: BitRun; absorbFrames?: number}> = ({frame, run, absorbFrames = 3}) => {
  if (frame < run.depart || frame >= run.land + absorbFrames) return null;
  const out: React.ReactNode[] = [];
  // reverse ripple on the lookout (80 → 24 px) as the Bit reappears
  const ru = clamp01((frame - run.depart) / 4);
  if (ru < 1) {
    const size = lerp(BIT.ripple.to, BIT.ripple.from, EASE.inCubic(ru));
    out.push(<path key="rr" d={squarePath(run.start[0], run.start[1], size, r(size))} fill="none" stroke={T.info} strokeWidth={lerp(1.5, 3, ru)} strokeOpacity={0.9 * ru} strokeLinejoin="round" />);
  }
  const moving = frame < run.land;
  const s = run.sAt(frame);
  // lit route segment AHEAD of the Bit (toward the button), brightest at the Bit, retracting as it passes
  if (moving) {
    const K = 5;
    for (let k = 0; k < K; k++) {
      const a = run.sAt(frame + 2 * k);
      const b = run.sAt(frame + 2 * (k + 1));
      const lo = Math.min(a, b);
      const hi = Math.max(a, b);
      if (hi - lo < 0.5) continue;
      const p0 = run.track.at(lo);
      const pts: Array<[number, number]> = [[p0.x, p0.y]];
      for (let i = 0; i < run.track.pts.length; i++) if (run.track.cum[i] > lo && run.track.cum[i] < hi) pts.push(run.track.pts[i] as [number, number]);
      const p1 = run.track.at(hi);
      pts.push([p1.x, p1.y]);
      out.push(<path key={`l${k}`} d={pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('')} fill="none" stroke={T.info} strokeWidth={4} strokeOpacity={0.85 * (1 - k / K)} strokeLinejoin="round" />);
    }
    // trail squares lead (time reversed)
    BIT.trailSizes.forEach((sz, k) => {
      const ss = s - BIT.trailPitch * (k + 1);
      if (ss < 0) return;
      const p = run.track.at(ss);
      out.push(<path key={`t${k}`} d={squarePath(p.x, p.y, sz, r(sz))} fill="none" stroke={T.info} strokeWidth={2} strokeOpacity={BIT.trailOpacityLight[k]} />);
    });
  }
  const pos = run.track.at(s);
  const k = moving ? 1 : 1 - clamp01((frame - run.land) / absorbFrames);
  const size = BIT.size * (moving ? 1 : 1 - 0.5 * (1 - k));
  out.push(
    <g key="core" opacity={moving ? 1 : k}>
      <path d={squarePath(pos.x, pos.y, size + 4, r(size) + 2)} fill={T.surface} />
      <path d={squarePath(pos.x, pos.y, size - 3, r(size))} fill={T.surface} stroke={T.info} strokeWidth={3} />
    </g>,
  );
  return <g>{out}</g>;
};
