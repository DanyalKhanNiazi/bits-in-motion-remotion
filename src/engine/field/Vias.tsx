/**
 * Board vias (L3, critic change C5; ENGINE.md §6.2): 4 px squares on a 48-world-px lattice on each board's top face,
 * under the parts. Invisible at rest; the light pool (up to 30%), land ripples (+30%) and press rings (+35%) light them,
 * so the field's reactions show where the viewer looks. They never drift (parallax 1, part of the deck).
 * Drawn in WORLD coordinates inside the view's camera transform, snapped to whole screen pixels.
 */
import React from 'react';
import {COLOR, FIELD} from '../tokens';
import {camOrigin, project, type Cam, type ViewCam} from '../camera/camera';
import type {Pt, WRect} from '../core/types';
import {bucket, opacityAt, pingBandAt, poolBreathAt, prepareReactions, VIA_GAINS, viaBreathAt, type FieldPing} from './opacity';
import type {FieldEvent} from './types';

export interface ViasProps {
  boards: ReadonlyArray<WRect>;
  cam: Cam | ViewCam;
  frame: number;
  /** The field's focus point and events, in this view's screen space. */
  focus: Pt;
  events: ReadonlyArray<FieldEvent>;
  /** Round 4: focus pings (screen px of this view). */
  pings?: ReadonlyArray<FieldPing>;
}

export const Vias: React.FC<ViasProps> = ({boards, cam, frame, focus, events, pings}) => {
  if (boards.length === 0) return null;
  const z = cam.zoom;
  const o = camOrigin(cam);
  const tx = o[0] - z * cam.center[0];
  const ty = o[1] - z * cam.center[1];
  const reactions = prepareReactions(frame, events, cam, pings);
  // round 4: the vias near the focus breathe with the lookout (a 2 s swell on the board itself)
  const poolK = poolBreathAt(frame) * viaBreathAt(frame);
  const P = FIELD.vias.pitch;
  // round 4: the vias a focus ping crosses step up to FIELD.vias.pingDot px (a pixel wave that reads at sheet size)
  const sizes = [FIELD.vias.dot, FIELD.vias.pingDot];
  const buckets = new Map<string, string[]>();
  for (const b of boards) {
    const inset = P / 2;
    for (let y = b.y + inset; y <= b.y + b.h - inset + 0.01; y += P) {
      for (let x = b.x + inset; x <= b.x + b.w - inset + 0.01; x += P) {
        const sp = project(cam, [x, y]);
        if (sp[0] < -8 || sp[0] > 1928 || sp[1] < -8 || sp[1] > 1088) continue;
        const sx = Math.round(sp[0]);
        const sy = Math.round(sp[1]);
        const op = bucket(opacityAt([sx, sy], focus, reactions, VIA_GAINS, poolK));
        if (op <= 0) continue;
        const big = pingBandAt([sx, sy], reactions) > 0.25 ? 1 : 0;
        const dot = sizes[big];
        const s = dot / z;
        const wx = (sx - dot / 2 - tx) / z;
        const wy = (sy - dot / 2 - ty) / z;
        const key = `${op}|${big}`;
        let arr = buckets.get(key);
        if (!arr) {
          arr = [];
          buckets.set(key, arr);
        }
        arr.push(`M${wx} ${wy}h${s}v${s}h${-s}Z`);
      }
    }
  }
  if (buckets.size === 0) return null;
  return (
    <g>
      {[...buckets.entries()]
        .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))
        .map(([key, parts]) => (
          <path key={key} d={parts.join('')} fill={COLOR.gridDot} fillOpacity={parseFloat(key)} />
        ))}
    </g>
  );
};
