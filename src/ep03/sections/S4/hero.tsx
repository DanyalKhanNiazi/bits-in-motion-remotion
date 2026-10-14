/**
 * S4: the owner's R5 renders (public/ep03/assets/new), placed like kit Props: (x, y) = centre of the visible content,
 * w = visible width. Adds a contact shadow, a rim glow and a specular sweep masked to the image's own alpha.
 */
import React from 'react';
import {Img, staticFile} from 'remotion';
import {PAL, clamp01, lerp, rgba, useImageReady} from '../../kit';

export const R5 = {
  cube: {file: 'R5_math-cube_a', size: 1254, box: [163, 189, 1092, 1129]},
  block: {file: 'R5_math-block_a', size: 1254, box: [183, 220, 1080, 1132]},
  glass: {file: 'R5_hourglass_a', size: 1254, box: [344, 66, 912, 1192]},
} as const;
export type R5Name = keyof typeof R5;

const url = (n: R5Name) => staticFile(`ep03/assets/new/${R5[n].file}.png`);
/** visible height for a visible width */
export const heroH = (n: R5Name, w: number) => {
  const [x0, y0, x1, y1] = R5[n].box;
  return (w * (y1 - y0)) / (x1 - x0);
};

export const Hero: React.FC<{
  name: R5Name;
  x: number;
  y: number;
  w: number;
  rot?: number;
  sx?: number;
  sy?: number;
  opacity?: number;
  bright?: number;
  rim?: {color: string; strength: number};
  /** 0..1 position of a specular sweep (undefined = none) */
  sweep?: number;
  shadow?: number;
  blur?: number;
}> = ({name, x, y, w, rot = 0, sx = 1, sy = 1, opacity = 1, bright = 1, rim, sweep, shadow = 0.6, blur = 0}) => {
  const src = url(name);
  useImageReady(sweep !== undefined ? src : null);
  if (opacity <= 0.001) return null;
  const {size, box} = R5[name];
  const [x0, y0, x1, y1] = box;
  const k = w / (x1 - x0);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const S = size * k;
  const h = (y1 - y0) * k;
  const filter = [
    bright !== 1 ? `brightness(${bright})` : '',
    rim ? `drop-shadow(0 0 2px ${rgba(rim.color, 0.8 * rim.strength)}) drop-shadow(0 0 18px ${rgba(rim.color, 0.45 * rim.strength)})` : '',
    blur > 0.2 ? `blur(${blur}px)` : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity}}>
      {shadow > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: -w * 0.55,
            top: h / 2 - h * 0.06,
            width: w * 1.1,
            height: Math.max(18, w * 0.16),
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.85), rgba(0,0,0,0.3) 55%, rgba(0,0,0,0))',
            filter: 'blur(6px)',
            opacity: shadow,
          }}
        />
      ) : null}
      <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${sx}, ${sy})`, transformOrigin: `0px ${h / 2}px`}}>
        <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${rot}deg)`, transformOrigin: '0px 0px'}}>
        <div style={{position: 'absolute', left: -cx * k, top: -cy * k, width: S, height: S}}>
          <Img src={src} style={{position: 'absolute', left: 0, top: 0, width: S, height: S, filter: filter || undefined}} />
          {sweep !== undefined && sweep > 0 && sweep < 1 ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: S,
                height: S,
                background: `linear-gradient(112deg, rgba(255,255,255,0) ${lerp(-30, 110, sweep) - 12}%, ${rgba('#FFFFFF', 0.5 * Math.sin(Math.PI * clamp01(sweep)))} ${lerp(-30, 110, sweep)}%, rgba(255,255,255,0) ${lerp(-30, 110, sweep) + 12}%)`,
                WebkitMaskImage: `url(${src})`,
                maskImage: `url(${src})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
};

export {PAL};
