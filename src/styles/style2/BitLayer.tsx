/**
 * The Bit and the route light behind it, computed by the kit (bitRun / bitState) in W pixels and drawn
 * through the current camera at constant on-screen sizes (24 px core, stepped halo, 4-square trail,
 * 24 -> 80 px square ripple). The route segment behind a travelling Bit lights in info and decays over
 * 10 frames: a pulse, not a beam.
 */
import React from 'react';
import {bitState, squarePath, slicePolyline, polyPath, BIT, type BitRun, type Pt} from '../../shared';
import {apply, type Cam} from './camera';
import {T} from './tones';

const r5 = (sz: number) => (BIT.radius * sz) / BIT.size;

export const CamBit: React.FC<{frame: number; cam: Cam; runs: BitRun | BitRun[]; park?: boolean; restFrom?: number; opacity?: number}> = ({frame, cam, runs, park, restFrom, opacity = 1}) => {
  const s = bitState(frame, runs, {park, restFrom, color: T.info, isDark: true});
  const m = (x: number, y: number): Pt => apply(cam, [x, y]);
  return (
    <g opacity={opacity}>
      {s.trail
        .slice()
        .reverse()
        .map((t, i) => {
          const p = m(t.x, t.y);
          return <path key={`t${i}`} d={squarePath(p[0], p[1], t.size, r5(t.size))} fill={T.info} fillOpacity={t.opacity} />;
        })}
      {s.core
        ? BIT.halo
            .slice()
            .reverse()
            .map(([hs, ho], i) => {
              const p = m(s.core!.x, s.core!.y);
              const parked = s.status === 'parked' || s.status === 'waiting' ? (s.core!.scale - 1) / BIT.breatheScale : 0;
              const op = (ho + (hs === 40 ? 0.1 * parked : 0)) * s.core!.opacity;
              const size = hs * s.core!.scale;
              return <path key={`h${i}`} d={squarePath(p[0], p[1], size, r5(size) * 1.2)} fill={T.info} fillOpacity={op} />;
            })
        : null}
      {s.core
        ? (() => {
            const p = m(s.core.x, s.core.y);
            const size = s.core.size * s.core.scale;
            return <path d={squarePath(p[0], p[1], size, r5(size))} fill={T.info} fillOpacity={s.core.opacity} />;
          })()
        : null}
      {s.ripples.map((rp, i) => {
        const p = m(rp.x, rp.y);
        return <path key={`r${i}`} d={squarePath(p[0], p[1], rp.size, r5(rp.size))} fill="none" stroke={T.info} strokeWidth={rp.stroke} strokeOpacity={rp.opacity} strokeLinejoin="round" />;
      })}
    </g>
  );
};

/** The lit segment behind each travelling Bit (info, 4 px), decaying over `decay` frames. */
export const CamRouteLight: React.FC<{frame: number; cam: Cam; runs: BitRun[]; decay?: number; width?: number}> = ({frame, cam, runs, decay = 10, width = 4}) => {
  const out: React.ReactNode[] = [];
  runs.forEach((r, ri) => {
    if (frame < r.depart || frame > r.land + decay) return;
    const K = 5;
    for (let k = 0; k < K; k++) {
      const s1 = r.sAt(frame - (decay / K) * k);
      const s0 = r.sAt(frame - (decay / K) * (k + 1));
      const a = Math.min(s0, s1);
      const b = Math.max(s0, s1);
      if (b - a < 0.5) continue;
      const pts = slicePolyline(r.track.pts, a, b).map((p) => apply(cam, p));
      out.push(<path key={`${ri}:${k}`} d={polyPath(pts)} fill="none" stroke={T.info} strokeWidth={width} strokeOpacity={1 - k / K} strokeLinejoin="round" />);
    }
  });
  return <g>{out}</g>;
};
