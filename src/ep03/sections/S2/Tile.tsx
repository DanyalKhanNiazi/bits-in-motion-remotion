/**
 * S2 tile: the kit TokenTile look (same face, edge, shadow, navy back with the cyan ID), with every parameter driven
 * directly by the caller, so tiles can lose their body (plain text), fly on arcs, click into the bench and flip.
 */
import React from 'react';
import {EASE, MONO, PAL, SANS, mixHex, rgba} from '../../kit';
import {Rich} from '../../kit';

export type TileVis = {
  x: number;
  y: number;
  w: number;
  size: number;
  /** explicit height (default 1.5 × size) */
  h?: number;
  text?: string;
  /** custom face content (overrides text) */
  face?: React.ReactNode;
  id?: string | number;
  /** 0 front … 1 back */
  flip?: number;
  /** kit-style lift (0 … 0.12) */
  lift?: number;
  rot?: number;
  scale?: number;
  /** squash on landing (−0.1 … 0.1) */
  squash?: number;
  /** 0..1 white body (0 = plain text on the dark stage) */
  body?: number;
  /** cyan rim (newest piece) */
  glow?: number;
  /** magenta ring (emphasis) */
  emph?: number;
  /** frames since the click (draws the click ring for 12 frames) */
  click?: number;
  opacity?: number;
  /** extra ground shadow strength 0..1 (default 1) */
  shadow?: number;
  /** text weight */
  weight?: 600 | 700;
  /** id font size factor (× size) */
  idScale?: number;
  /** body slides down by this many px while it fades (the body "drops away") */
  bodyDy?: number;
  /** warm reading glow on the text 0..1 */
  textGlow?: number;
  /** 0..1 a not-yet-real tile: dashed cyan outline, glassy fill, light text (drawn over the body) */
  ghost?: number;
};

export const tileHeight = (size: number) => size * 1.5;

export const Tile: React.FC<TileVis> = ({
  x,
  y,
  w,
  size,
  h,
  text = '',
  face,
  id,
  flip = 0,
  lift = 0,
  rot = 0,
  scale = 1,
  squash = 0,
  body = 1,
  glow = 0,
  emph = 0,
  click,
  opacity = 1,
  shadow = 1,
  weight = 600,
  idScale = 0.8,
  bodyDy = 0,
  textGlow = 0,
  ghost = 0,
}) => {
  if (opacity <= 0.001) return null;
  const H = h ?? tileHeight(size);
  const W = w;
  const ang = 180 * flip;
  const b = Math.max(0, Math.min(1, body));
  const ink = mixHex(PAL.ink, PAL.tileInk, b);
  const faceBase: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: W,
    height: H,
    borderRadius: size * 0.24,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
  };
  const g = Math.max(0, Math.min(1, glow));
  const em = Math.max(0, Math.min(1, emph));
  const sh = shadow * b;
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity}}>
      {sh > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: -W * 0.48,
            top: H * 0.5 - H * 0.08 + lift * H * 0.6,
            width: W * 0.96,
            height: H * 0.28,
            borderRadius: '50%',
            background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))',
            filter: 'blur(5px)',
            opacity: sh * Math.max(0, 1 - lift * 2),
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: -W / 2,
          top: -H / 2,
          width: W,
          height: H,
          perspective: 1100,
          transform: `translateY(${-lift * H * 0.5}px) rotate(${rot}deg) scale(${scale * (1 + lift + squash * 0.5)}, ${scale * (1 + lift - squash)})`,
          transformOrigin: '50% 100%',
        }}
      >
        <div style={{position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateY(${ang}deg)`}}>
          {/* front: body */}
          {b > 0.001 ? (
            <div
              style={{
                ...faceBase,
                opacity: b,
                transform: bodyDy ? `translateY(${bodyDy}px)` : undefined,
                background: `linear-gradient(180deg, #FFFFFF 0%, ${PAL.tile} 40%, ${PAL.tileMid} 100%)`,
                boxShadow: [
                  'inset 0 3px 0 rgba(255,255,255,0.95)',
                  `inset 0 -4px 0 ${rgba(PAL.tileEdge, 0.45)}`,
                  `0 ${size * 0.11}px 0 ${PAL.tileEdge}`,
                  `0 ${size * 0.13}px 0 #8E97A8`,
                  `0 ${size * 0.4}px ${size * 0.5}px rgba(0,0,0,0.5)`,
                  g > 0 ? `0 0 0 ${3 + 2 * g}px ${rgba(PAL.info, 0.95 * g)}, 0 0 ${30 * g}px ${rgba(PAL.info, 0.65 * g)}` : '',
                  em > 0 ? `0 0 0 ${3 + 3 * em}px ${rgba(PAL.emphasis, 0.95 * em)}, 0 0 ${34 * em}px ${rgba(PAL.emphasis, 0.6 * em)}` : '',
                ]
                  .filter(Boolean)
                  .join(', '),
              }}
            />
          ) : null}
          {/* ghost: dashed glass outline */}
          {ghost > 0.001 ? (
            <div
              style={{
                ...faceBase,
                opacity: ghost,
                background: `linear-gradient(180deg, ${rgba('#9FF4FF', 0.16)}, ${rgba('#0A4E63', 0.22)})`,
                border: `3px dashed ${rgba(PAL.infoPale, 0.95)}`,
                boxShadow: `0 0 26px ${rgba(PAL.info, 0.45)}, inset 0 0 18px ${rgba(PAL.info, 0.25)}`,
                boxSizing: 'border-box',
              }}
            />
          ) : null}
          {/* front: text */}
          <div style={{...faceBase, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {face ?? (
              <span
                style={{
                  fontFamily: SANS,
                  fontWeight: weight,
                  fontSize: size,
                  color: ink,
                  lineHeight: 1,
                  marginTop: -size * 0.04,
                  whiteSpace: 'nowrap',
                  textShadow:
                    [
                      b < 0.9 ? `0 0 ${18 * (1 - b)}px ${rgba('#9FD8FF', 0.35 * (1 - b))}` : '',
                      textGlow > 0.01 ? `0 0 ${10 + 16 * textGlow}px ${rgba('#FFE9C8', 0.85 * textGlow)}` : '',
                    ]
                      .filter(Boolean)
                      .join(', ') || undefined,
                }}
              >
                <Rich text={text.trim()} weight={weight} />
              </span>
            )}
          </div>
          {/* back: the ID */}
          {id !== undefined ? (
            <div
              style={{
                ...faceBase,
                transform: 'rotateY(180deg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(180deg, #1C2C4C 0%, ${PAL.deck} 100%)`,
                boxShadow: [
                  `inset 0 2px 0 ${rgba('#6F8FCB', 0.5)}`,
                  `0 ${size * 0.11}px 0 #0B1222`,
                  `0 ${size * 0.4}px ${size * 0.5}px rgba(0,0,0,0.5)`,
                  `0 0 0 2px ${rgba(PAL.info, 0.55 + 0.4 * g)}`,
                  `0 0 ${24 + 20 * g}px ${rgba(PAL.info, 0.35 + 0.35 * g)}`,
                ].join(', '),
              }}
            >
              <span style={{fontFamily: MONO, fontWeight: 500, fontSize: size * idScale, color: PAL.info, lineHeight: 1}}>{id}</span>
            </div>
          ) : null}
        </div>
      </div>
      {click !== undefined && click >= 0 && click < 12 ? (
        <div
          style={{
            position: 'absolute',
            left: -W / 2,
            top: -H / 2,
            width: W,
            height: H,
            borderRadius: size * 0.24,
            border: `3px solid ${rgba('#FFFFFF', 0.8 * (1 - click / 12))}`,
            transform: `rotate(${rot}deg) scale(${1 + 0.28 * EASE.out(click / 12)})`,
          }}
        />
      ) : null}
    </div>
  );
};
