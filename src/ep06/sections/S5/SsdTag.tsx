/**
 * S5 local hud tag: the SSD's identity on the match cut (P10 "You might expect an SSD…"). The kit's SplitCompare header
 * look (icon `ssd-board_b` + "SSD", Sora 700 56 px) on a dark pill, so the replayed delete reads as the SSD case.
 * Screen px; (x, y) is the pill's centre. Pops in on `at` (spring), lifts out on `exitAt`.
 */
import React from 'react';
import {Img} from 'remotion';
import {EASE, PAL, SANS, SPRING, assetBox, assetUrl, checkText, clamp01, prog, rgba, springAt, useFontsReady} from '../../kit';

const ICON = 'ssd-board_b' as const;
const SIZE = 56;

export const SsdTag: React.FC<{frame: number; at: number; exitAt: number; x: number; y: number}> = ({frame: f, at, exitAt, x, y}) => {
  useFontsReady();
  const sp = springAt(f, at, SPRING.pop);
  const ex = prog(f, exitAt, 9, EASE.inCubic);
  if (sp <= 0.001 || ex >= 1) return null;
  checkText('label', SIZE, false, {zoom: 1, rot: 0, space: 'screen'}, 'SSD');
  const ib = assetBox(ICON);
  const iw = 150;
  const k = iw / ib.cw;
  const ih = ib.ch * k;
  // a light sweep across the icon right after it lands
  const sw = prog(f, at + 6, 16, EASE.inOut);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(-50%, -50%) translateY(${-ex * 16 + (1 - clamp01(sp)) * 10}px) scale(${0.65 + 0.35 * sp})`,
          opacity: clamp01(sp * 2.5) * (1 - ex),
          display: 'flex',
          alignItems: 'center',
          gap: 22,
          padding: '14px 32px 14px 26px',
          borderRadius: 999,
          background: 'linear-gradient(180deg, rgba(22,28,40,0.94), rgba(12,16,24,0.94))',
          border: `2px solid ${rgba(PAL.ink, 0.28)}`,
          boxShadow: `0 14px 36px rgba(0,0,0,0.55), inset 0 1px 0 ${rgba('#FFFFFF', 0.12)}`,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{position: 'relative', width: iw, height: ih, overflow: 'hidden', borderRadius: 4}}>
          <Img src={assetUrl(ICON)} style={{position: 'absolute', left: -ib.x0 * k, top: -ib.y0 * k, width: ib.w * k, height: ib.h * k}} />
          {sw > 0 && sw < 1 ? (
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: `${-40 + 140 * sw}%`,
                width: '30%',
                background: `linear-gradient(90deg, rgba(255,255,255,0), ${rgba('#FFFFFF', 0.55)}, rgba(255,255,255,0))`,
                mixBlendMode: 'screen',
              }}
            />
          ) : null}
        </div>
        <span style={{fontFamily: SANS, fontWeight: 700, fontSize: SIZE, color: PAL.ink, letterSpacing: '-0.01em', lineHeight: 1}}>SSD</span>
      </div>
    </div>
  );
};
