/**
 * S2 blade: the token bench's own stylus (cut from BIM154), stood on its tip as the tokenizer's chopper.
 * Placed by its TIP (world px). Rim light, a specular sweep masked to its alpha, and directional motion blur.
 */
import React, {useId} from 'react';
import {Img} from 'remotion';
import {DirBlurFilter, PAL, dirBlurStd, rgba, safeId, useImageReady} from '../../kit';
import bladePng from './blade.png';

const BW = 1329;
const BH = 196;
/** the tip (left end of the steel bar) in the crop's px */
const TIP = {x: 10, y: 125};

export const Blade: React.FC<{
  tipX: number;
  tipY: number;
  /** world px per native px */
  k?: number;
  /** extra tilt (deg) away from vertical */
  tilt?: number;
  opacity?: number;
  /** velocity (world px / frame) for motion blur */
  vx?: number;
  vy?: number;
  /** 0..1 position of a specular sweep, or null */
  sweep?: number | null;
  /** cyan edge glow 0..1 */
  edge?: number;
}> = ({tipX, tipY, k = 0.42, tilt = 0, opacity = 1, vx = 0, vy = 0, sweep = null, edge = 0}) => {
  const id = safeId(useId());
  useImageReady(sweep !== null ? bladePng : null);
  if (opacity <= 0.001) return null;
  const std = dirBlurStd(vx, vy, 0.5, 26);
  const w = BW * k;
  const h = BH * k;
  return (
    <div style={{position: 'absolute', left: tipX, top: tipY, width: 0, height: 0, opacity}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>{std ? <DirBlurFilter id={`${id}-mb`} std={std} /> : null}</defs>
      </svg>
      <div style={{position: 'absolute', left: 0, top: 0, filter: std ? `url(#${id}-mb)` : undefined}}>
        {/* rotate about the tip: the crop's left end points down */}
        <div
          style={{
            position: 'absolute',
            left: -TIP.x * k,
            top: -TIP.y * k,
            width: w,
            height: h,
            transformOrigin: `${TIP.x * k}px ${TIP.y * k}px`,
            transform: `rotate(${-90 + tilt}deg)`,
          }}
        >
          <Img
            src={bladePng}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: w,
              height: h,
              filter: `drop-shadow(0 0 2px ${rgba(PAL.info, 0.55 + 0.4 * edge)}) drop-shadow(0 0 ${14 + 18 * edge}px ${rgba(PAL.info, 0.3 + 0.4 * edge)}) drop-shadow(0 26px 30px rgba(0,0,0,0.55))`,
            }}
          />
          {sweep !== null && sweep >= 0 && sweep <= 1 ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: w,
                height: h,
                background: `linear-gradient(80deg, rgba(255,255,255,0) ${sweep * 140 - 30}%, ${rgba('#FFFFFF', 0.75 * Math.sin(Math.PI * sweep))} ${sweep * 140 - 20}%, rgba(255,255,255,0) ${sweep * 140 - 10}%)`,
                WebkitMaskImage: `url(${bladePng})`,
                maskImage: `url(${bladePng})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
