/**
 * Knockout plates (ENGINE.md §4.2, STYLE_BIBLE §10.3, critic change C8): under each text box the world's FLAT FILLS
 * (field, case tray, board, part top faces and sides, washes) are redrawn at the view's camera, clipped to the rounded
 * box. Exact on any ground (including a box that straddles two grounds), so it never reads as a card; it only removes
 * stray linework (routes, outlines, dots, vias). One clip-path union for every box on screen.
 */
import React from 'react';
import {COLOR, RADIUS} from '../tokens';
import {rectPath} from '../../shared/geom';
import {camTransform, type Cam, type Shot, type ViewCam} from '../camera/camera';
import type {SRect} from '../core/types';
import {WorldLayer} from '../world/WorldLayer';
import type {AnyWorld} from '../world/types';
import {WashV2} from '../energy/WashV2';
import type {Script} from '../timeline/script';

export interface KnockoutProps {
  world: AnyWorld;
  cam: Cam | ViewCam;
  frame: number;
  /** One or more text boxes (screen px). */
  box: SRect | ReadonlyArray<SRect>;
  /** Re-apply a scrim alpha over the world (labels over the S06 scrim). */
  scrim?: number;
  /** States, props and washes, so the fills match the view (lit parts use activeFill). */
  script?: Pick<Script, 'states' | 'props' | 'washes'>;
  refShot?: Shot;
  /** Clip the knockout to this rect too (the main view's clip: a window or a split). */
  within?: SRect | null;
  id?: string;
}

export const Knockout: React.FC<KnockoutProps> = ({world, cam, frame, box, scrim = 0, script, refShot, within, id = 'ko'}) => {
  const boxes = (Array.isArray(box) ? box : [box as SRect]).filter((b) => b.w > 0.5 && b.h > 0.5);
  if (boxes.length === 0) return null;
  const clipId = `${id}-clip`;
  const clip2 = `${id}-within`;
  const domains = 'domains' in world && world.domains ? world.domains : [];
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <clipPath id={clipId}>
          {boxes.map((b, i) => (
            <path key={i} d={rectPath(b.x, b.y, b.w, b.h, b.r ?? RADIUS.tagPlate)} />
          ))}
        </clipPath>
        {within ? (
          <clipPath id={clip2}>
            <path d={rectPath(within.x, within.y, within.w, within.h, within.r ?? 0)} />
          </clipPath>
        ) : null}
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={1920} height={1080} fill={COLOR.field} />
        <g clipPath={within ? `url(#${clip2})` : undefined}>
          <g transform={camTransform(cam)}>
            <WorldLayer
              world={world}
              frame={frame}
              cam={cam}
              scope="world"
              script={script ?? {states: [], props: []}}
              fillsOnly
              refShot={refShot}
              idPrefix={id}
              under={
                script && domains.length
                  ? script.washes.map((e, i) => {
                      const d = domains.find((x) => x.id === e.domain);
                      return d ? <WashV2 key={i} domain={d} event={e} frame={frame} zoom={cam.zoom} fillsOnly /> : null;
                    })
                  : null
              }
            />
          </g>
        </g>
        {scrim > 0 ? <rect x={0} y={0} width={1920} height={1080} fill={COLOR.void} opacity={scrim} /> : null}
      </g>
    </svg>
  );
};
