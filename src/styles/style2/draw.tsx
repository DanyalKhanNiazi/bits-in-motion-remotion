/**
 * Drawing primitives for Night Signal: parts as flat planes with constant on-screen strokes,
 * 2 px contact edges (no shadows), dark glass, and the one allowed faked glow.
 */
import React from 'react';
import {rectPath, routePath, type Pt} from '../../shared';
import {apply, type Cam} from './camera';
import {wp, S_W, type MBox} from './set';
import {TONE, SW, GLOW, T} from './tones';

export interface SRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** A mm box on the stage plane -> screen rect. */
export const srect = (cam: Cam, b: MBox): SRect => {
  const a = apply(cam, wp(b.x0, b.y1));
  const c = apply(cam, wp(b.x1, b.y0));
  return {x: a[0], y: a[1], w: c[0] - a[0], h: c[1] - a[1]};
};
/** A W-px rect on the far plane -> screen rect. */
export const frect = (cam: Cam, r: SRect): SRect => {
  const a = apply(cam, [r.x, r.y]);
  return {x: a[0], y: a[1], w: r.w * cam.k, h: r.h * cam.k};
};
/** mm point -> screen. */
export const sp = (cam: Cam, X: number, Y: number): Pt => apply(cam, wp(X, Y));
/** mm polyline -> screen points. */
export const spts = (cam: Cam, pts: ReadonlyArray<readonly [number, number]>): Pt[] => pts.map(([X, Y]) => sp(cam, X, Y));
/** Physical corner radius (mm) on screen, clamped. */
export const rad = (cam: Cam, mm: number, max = 10): number => Math.max(1.5, Math.min(max, mm * S_W * cam.k));
/** Screen size of 1 mm. */
export const mmpx = (cam: Cam): number => S_W * cam.k;

export const rp = (r: SRect, radius = 0): string => rectPath(r.x, r.y, r.w, r.h, radius);

/** 2 px contact edge along the lower and right edges (a part reads as raised; never a shadow). */
export const Contact: React.FC<{r: SRect; color?: string}> = ({r, color}) => (
  <path
    d={`M${r.x + 3} ${r.y + r.h + 1.5}H${r.x + r.w + 1.5}V${r.y + 3}`}
    fill="none"
    stroke={color ?? TONE.near}
    strokeWidth={SW.contact}
  />
);

export interface PartProps {
  r: SRect;
  radius?: number;
  fill?: string;
  stroke?: string;
  width?: number;
  contact?: boolean;
  opacity?: number;
  dash?: string;
}

/** An unpowered part: mass body, 3 px structure outline, contact edge. */
export const Part: React.FC<PartProps> = ({r, radius = 0, fill = TONE.mass, stroke = T.structure, width = SW.inactive, contact = true, opacity = 1, dash}) => {
  if (r.w < 1 || r.h < 1) return null;
  return (
    <g opacity={opacity}>
      {contact ? <Contact r={r} /> : null}
      <path d={rp(r, radius)} fill={fill} />
      {width > 0 ? (
        <path
          d={rp({x: r.x + width / 2, y: r.y + width / 2, w: r.w - width, h: r.h - width}, Math.max(0, radius - width / 2))}
          fill="none"
          stroke={stroke}
          strokeWidth={width}
          strokeDasharray={dash}
        />
      ) : null}
    </g>
  );
};

/**
 * A lit (powered) part: lit body, 4 px ink outline, and optionally the faked glow (a second outline at
 * 3x width, 20% ink; never blur). `light` 0..1 blends from unlit to lit (a 6-frame flip uses this).
 */
export const LitPart: React.FC<{r: SRect; radius?: number; light: number; glow: number; breath?: number}> = ({r, radius = 3, light, glow, breath = 1}) => {
  const l = Math.max(0, Math.min(1, light));
  const inset = (w: number) => ({x: r.x + w / 2, y: r.y + w / 2, w: r.w - w, h: r.h - w});
  return (
    <g>
      {glow > 0 ? (
        <path d={rp(inset(4), radius)} fill="none" stroke={T.ink} strokeWidth={4 * GLOW.width} strokeOpacity={GLOW.opacity * glow * breath} strokeLinejoin="round" />
      ) : null}
      <path d={rp(r, radius)} fill={l >= 1 ? TONE.lit : TONE.mass} />
      {l > 0 && l < 1 ? <path d={rp(r, radius)} fill={TONE.lit} fillOpacity={l} /> : null}
      {l < 1 ? <path d={rp(inset(3), radius)} fill="none" stroke={T.structure} strokeWidth={3} strokeOpacity={1 - l} /> : null}
      {l > 0 ? <path d={rp(inset(4), radius)} fill="none" stroke={T.ink} strokeWidth={4} strokeOpacity={l * (0.78 + 0.22 * breath)} /> : null}
    </g>
  );
};

/** Dark glass over a covered subject (cooler, heatsink): flat glass tone, structure outline. */
export const Glass: React.FC<{d: string; contact?: SRect}> = ({d, contact}) => (
  <g>
    {contact ? <Contact r={contact} /> : null}
    <path d={d} fill={TONE.glass} />
    <path d={d} fill="none" stroke={T.structure} strokeWidth={SW.inactive} />
  </g>
);

/** A screen-space polyline with rounded bends (constant width). */
export const Line: React.FC<{pts: Pt[]; color: string; width?: number; opacity?: number; dash?: string; bend?: number; cap?: 'butt' | 'round' | 'square'}> = ({
  pts,
  color,
  width = SW.route,
  opacity = 1,
  dash,
  bend = 8,
  cap = 'butt',
}) => (
  <path d={routePath(pts, bend)} fill="none" stroke={color} strokeWidth={width} strokeOpacity={opacity} strokeDasharray={dash} strokeLinejoin="round" strokeLinecap={cap} />
);
