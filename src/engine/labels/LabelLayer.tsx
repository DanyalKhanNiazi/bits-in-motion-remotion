/**
 * The label layer (ENGINE.md §12): knockouts under every tag, chip and readout text box (one clip union), then the
 * tags, pills, readouts and the chip. Text is HTML; anchors, leaders and key bars are SVG. Main view only (labels of
 * plates and bands are drawn by them, on their own flat grounds).
 */
import React from 'react';
import {COLOR, LAYOUT} from '../tokens';
import {rectPath} from '../../shared/geom';
import {prog} from '../core/ease';
import type {Cam, Shot} from '../camera/camera';
import {inflate} from '../core/math';
import type {SRect} from '../core/types';
import type {WorldSpec} from '../world/types';
import type {Script} from '../timeline/script';
import {scrimAlpha} from '../panels/Scrim';
import {splitScrimAlpha} from '../panels/Split';
import {Knockout} from './Knockout';
import {isAutoSlot, Tag2, tagAt, tagLand} from './Tag2';
import {cameraAt} from '../camera/camera';
import {Pill2} from './Pill2';
import {Readout2, readoutBox} from './Readout2';
import {Chip2, chipBox} from './Chip2';

export interface LabelLayerProps {
  frame: number;
  script: Readonly<Script>;
  cam: Cam;
  world: WorldSpec;
  refShot?: Shot;
  /** The main view's clip (a contracted window or a split's centre band), for the knockout. */
  within?: SRect | null;
}

export const LabelLayer: React.FC<LabelLayerProps> = ({frame, script, cam, world, refShot, within}) => {
  const tags = script.tags
    .filter((t) => !t.scope || t.scope === 'world')
    .map((t) => ({spec: t, draw: tagAt(frame, t, cam, world, refShot, isAutoSlot(t) ? cameraAt(tagLand(t), script.camera) : undefined)}))
    .filter((x): x is {spec: (typeof script.tags)[number]; draw: NonNullable<ReturnType<typeof tagAt>>} => x.draw !== null);
  const boxes: SRect[] = [];
  for (const t of tags) if (!t.spec.card && (t.draw.textReveal > 0 || t.draw.keyGrow > 0)) boxes.push(t.draw.knockout);
  // round 3: a heading on its own card (deck fill, 2 px structure rule), e.g. "Why different?" under two plates
  const cards = tags.filter((t) => t.spec.card && t.draw.textReveal > 0);
  for (const r of script.readouts) {
    const b = readoutBox(frame, r);
    if (b) boxes.push({...inflate(b, 10), r: 8});
  }
  const cb = chipBox(frame, script.chip);
  if (cb) boxes.push({...inflate(cb.box, 10), r: 8});
  // round 2: the triptych's scrim dims the world under the chip too
  const scrim = Math.max(
    script.scrims.reduce((m, s) => Math.max(m, scrimAlpha(frame, s.at, s.outAt, s.inDur, s.alpha)), 0),
    splitScrimAlpha(frame, script.splits),
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      {boxes.length ? (
        <Knockout world={world} cam={cam} frame={frame} box={boxes} scrim={scrim} script={script} refShot={refShot} within={within} id="labels-ko" />
      ) : null}
      {cards.length ? (
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
          {cards.map((t) => {
            const k = t.draw.knockout;
            const pad = 8;
            return (
              <path
                key={`card-${t.spec.id}`}
                d={rectPath(k.x - pad, k.y - pad, k.w + 2 * pad, k.h + 2 * pad, 12)}
                fill={COLOR.deck}
                stroke={COLOR.structure}
                strokeWidth={2}
                opacity={Math.min(t.draw.opacity, prog(t.draw.textAge, -2, 4, 'arrive'))}
              />
            );
          })}
        </svg>
      ) : null}
      {tags.map((t) => (
        <Tag2 key={t.spec.id} draw={t.draw} spec={t.spec} />
      ))}
      {script.pills
        .filter((p) => !p.scope || p.scope === 'world')
        .map((p) => (
          <Pill2 key={p.id} spec={p} frame={frame} cam={cam} world={world} refShot={refShot} />
        ))}
      {script.readouts.map((r) => (
        <Readout2 key={r.id} spec={r} frame={frame} />
      ))}
      <Chip2 steps={script.chip} frame={frame} />
    </div>
  );
};

/** The chip origin (re-exported for layout checks). */
export const CHIP_ORIGIN = LAYOUT.chipOrigin;
