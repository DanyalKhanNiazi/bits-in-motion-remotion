/**
 * `cord` (ICONS.md §4.15): a physical cable (never an energy channel). `points` (world px), 8 px world thick,
 * `side` fill between two 2 px `structure` edges, 10 px bends. Passive. When the plug is pulled, pass points that end
 * at the plug's `cord` port (it moves with `seated`).
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {routePath} from '../../shared/geom';
import {Shell, basePorts, resolveBase, sw, useIconEnv} from '../primitives';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';
import {plugOffset} from './iecPlug';

export interface CordProps extends IconBaseProps {
  points?: Pt[];
  /** Cable thickness, world px (default 8). */
  thickness?: number;
  /** Bend radius, world px (default 10). */
  bend?: number;
  /** Follows the IEC plug at the cord's END: 1 = seated (default), 0 = pulled (the end moves by plugOffset). Animate it
   *  with the same PropEvent as the plug's `seated`, so the cable stays attached to the plug's `cord` port. */
  seated?: number;
  /** Round 3: the plug's pull offset (iecPlug `pull`), so the cord's end follows a pulled plug exactly. */
  pull?: Pt;
}

/** The cord's points with its end moved to follow a pulled plug. */
export const cordPoints = (p: Pick<CordProps, 'points' | 'x' | 'y' | 'w' | 'h' | 'seated' | 'pull'>): Pt[] => {
  const pts = p.points && p.points.length >= 2 ? p.points : ([[p.x, p.y + p.h / 2], [p.x + p.w, p.y + p.h / 2]] as Pt[]);
  if (p.seated === undefined || p.seated >= 1) return pts;
  const [dx, dy] = plugOffset(p.seated, p.pull);
  const end = pts[pts.length - 1];
  return [...pts.slice(0, -1), [end[0] + dx, end[1] + dy]];
};

const CordBody: React.FC<{d: string; t: number; zoom: number}> = ({d, t, zoom}) => {
  const {fillsOnly} = useIconEnv();
  const edge = sw(STROKE.detail, zoom);
  return (
    <>
      {!fillsOnly ? <path d={d} fill="none" stroke={COLOR.structure} strokeWidth={t} strokeLinecap="butt" strokeLinejoin="round" /> : null}
      <path d={d} fill="none" stroke={COLOR.side} strokeWidth={fillsOnly ? t : Math.max(t - 2 * edge, t * 0.2)} strokeLinecap="butt" strokeLinejoin="round" />
    </>
  );
};

export const Cord: React.FC<CordProps> = (p) => {
  const b = resolveBase(p, true);
  const pts = cordPoints({...p, x: b.x, y: b.y, w: b.w, h: b.h});
  const d = routePath(pts, p.bend ?? 10);
  return (
    <Shell b={b}>
      <CordBody d={d} t={p.thickness ?? 8} zoom={b.zoom} />
    </Shell>
  );
};

export const cordSpec: IconSpec<CordProps> = {
  type: 'cord',
  component: Cord,
  size: {w: 42, h: 8},
  z: 0,
  passive: true,
  ports: (p): Ports => {
    const pts = cordPoints(p);
    return {...basePorts(p, true), start: pts[0], end: pts[pts.length - 1]};
  },
};
