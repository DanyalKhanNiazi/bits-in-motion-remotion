/**
 * Ep03 kit: the shared grade. Bloom on emissive cyan (an SVG filter that keys cyan, blurs it and screens it back),
 * a gentle vignette and a very light, per-frame film grain. Plus a directional-blur filter for fast moves.
 */
import React, {useMemo} from 'react';
import {AbsoluteFill, random} from 'remotion';
import {GRADE} from './look';
import {clamp, useImageReady} from './util';

/** SVG <filter> keyed on cyan: alpha = k·(−1.6R + G + 0.9B − 0.55); blurred twice; screened over the source. */
export const BloomFilter: React.FC<{id: string; strength?: number; radius?: number}> = ({id, strength = GRADE.bloom, radius = GRADE.bloomRadius}) => (
  <filter id={id} x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -2.4 1.5 1.35 0 -0.82" result="key" />
    <feGaussianBlur in="key" stdDeviation={radius} result="b1" />
    <feGaussianBlur in="key" stdDeviation={radius * 3.2} result="b2" />
    <feMerge result="glow">
      <feMergeNode in="b1" />
      <feMergeNode in="b2" />
    </feMerge>
    <feComponentTransfer in="glow" result="glowS">
      <feFuncA type="linear" slope={strength} />
    </feComponentTransfer>
    <feBlend in="SourceGraphic" in2="glowS" mode="screen" />
  </filter>
);

/** Directional blur (screen px of motion per frame → stdDeviation). Returns null when the motion is slow. */
export const dirBlurStd = (vx: number, vy: number, k = 0.38, cap = 30): [number, number] | null => {
  const sx = clamp(Math.abs(vx) * k, 0, cap);
  const sy = clamp(Math.abs(vy) * k, 0, cap);
  return sx < 0.6 && sy < 0.6 ? null : [sx, sy];
};
export const DirBlurFilter: React.FC<{id: string; std: [number, number]}> = ({id, std}) => (
  <filter id={id} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation={`${std[0].toFixed(2)} ${std[1].toFixed(2)}`} edgeMode="duplicate" />
  </filter>
);

/* ---------------------------------------------------------------- grain */
let grainUrl: string | null = null;
const GRAIN = 256;
const makeGrain = (): string => {
  if (grainUrl) return grainUrl;
  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = GRAIN;
  c.height = GRAIN;
  const g = c.getContext('2d');
  if (!g) return '';
  const img = g.createImageData(GRAIN, GRAIN);
  for (let i = 0; i < GRAIN * GRAIN; i++) {
    // two-tap noise: fine grain with a little clumping
    const v = 128 + (random(`grain-${i}`) - 0.5) * 150 + (random(`grain-b-${i >> 1}`) - 0.5) * 60;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainUrl = c.toDataURL('image/png');
  return grainUrl;
};

export const Grain: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = GRADE.grain}) => {
  const url = useMemo(() => makeGrain(), []);
  useImageReady(url || null);
  if (!url || opacity <= 0) return null;
  const ox = Math.floor(random(`gx-${frame}`) * GRAIN);
  const oy = Math.floor(random(`gy-${frame}`) * GRAIN);
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url(${url})`,
        backgroundSize: `${GRAIN}px ${GRAIN}px`,
        backgroundPosition: `${ox}px ${oy}px`,
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Vignette: React.FC<{strength?: number}> = ({strength = GRADE.vignette}) =>
  strength <= 0 ? null : (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 78% 74% at 50% 47%, rgba(2,4,10,0) 52%, rgba(2,4,10,${(strength * 0.55).toFixed(3)}) 80%, rgba(1,2,6,${strength.toFixed(3)}) 100%)`,
        pointerEvents: 'none',
      }}
    />
  );

export type GradeOpts = {vignette: number; grain: number; bloom: number; bloomRadius: number};
export const gradeOpts = (g: Partial<GradeOpts> | false | undefined): GradeOpts =>
  g === false ? {vignette: 0, grain: 0, bloom: 0, bloomRadius: GRADE.bloomRadius} : {...GRADE, ...(g ?? {})};
