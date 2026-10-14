// S6 · P13–P14 [8404, 9935): the drive clears the boxes, the mirror-synced recovery race (mid-film hero), the 2011
// study, and the TRIM note that never gets through. See docs/ep06/plans/S6_plan.md.
import React from 'react';
import {SPLIT, ZoomThrough} from '../kit';
import {T, RANGE} from './S6/T';
import {Compress, ShotA, ShotB} from './S6/Race';
import {Study} from './S6/Study';

const ZOOM_DUR = 16;

export const S6: React.FC<{frame: number}> = ({frame}) => {
  const f = Math.max(RANGE.from, Math.min(RANGE.to, frame));
  if (f < T.when) return <ShotA frame={f} />;
  if (f < T.when + SPLIT.slideIn) return <Compress frame={f} />;
  if (f < T.depends) return <ShotB frame={f} />;
  if (f < T.depends + ZOOM_DUR)
    return <ZoomThrough frame={f} at={T.depends} dur={ZOOM_DUR} cx={(SPLIT.right.x0 + SPLIT.right.x1) / 2} cy={(SPLIT.content.y0 + SPLIT.content.y1) / 2} a={(fr) => <ShotB frame={fr} />} b={(fr) => <Study frame={fr} />} />;
  return <Study frame={f} />;
};
