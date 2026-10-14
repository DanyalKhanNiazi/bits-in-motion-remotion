/**
 * S08 (page P5): B and P fold; O (outside) glides left at ×1; an identical copy O′ slides out from under it.
 * Captions name only the variable ("Restart", "Shut down"); the one text set on the page itself, "Why different?",
 * sits unboxed at the top of the 364 px relationship gutter with two short leaders. No mechanism is shown.
 */
import React from 'react';
import {TONE, lerpBox, type Box} from './look';
import {Caption, PanelClip, Plate, Rules} from './panel';
import {OutsideArt} from './hw';
import {RelLabel} from './labels';
import {SystemPage} from './system';
import * as G from './geo';
import {F} from './T';
import {EASE, progress, mixColor} from '../../shared';

const Y0 = 289;
export const O_PAIR: Box = {x: 96, y: Y0, w: G.PO.w, h: G.PO.h};
export const O2_PAIR: Box = {x: 1142, y: Y0, w: G.PO.w, h: G.PO.h};
/** While O is alone (f1086–f1154) it holds centred; on the split O moves left as its copy O′ slides out from under it
 *  to the right (review fix: alone, O hugged the left edge with the right half of the page empty). */
export const O_MID: Box = {x: 960 - G.PO.w / 2, y: Y0, w: G.PO.w, h: G.PO.h};

const OPanel: React.FC<{box: Box; active: number; caption?: {text: string; t: number; align: 'left' | 'right'}}> = ({box, active, caption}) => {
  const plate = mixColor(TONE.plateOut, TONE.plateOutHeld, 1 - active);
  return (
    <g>
      <Plate box={box} polarity="out" color={plate} />
      <PanelClip box={box}>
        <OutsideArt v={{s: 1, tx: box.x - G.PO.x, ty: box.y - G.PO.y}} cap={0} finger={null} />
      </PanelClip>
      <Rules box={box} plate={plate} polarity="out" active={active} double={0} />
      {caption ? <Caption box={box} text={caption.text} polarity="out" t={caption.t} align={caption.align} /> : null}
    </g>
  );
};

export const PairPage: React.FC<{frame: number}> = ({frame}) => {
  const fold = progress(frame, F.glide, 8, EASE.exit);
  const glide = progress(frame, F.glide, 14, EASE.move);
  const dup = progress(frame, F.dup, 12, EASE.move);
  const oBox = dup > 0 ? lerpBox(O_MID, O_PAIR, dup) : lerpBox(G.PO, O_MID, glide);
  const o2Box = lerpBox(O_MID, O2_PAIR, dup);
  const actO = Math.min(progress(frame, F.glide + 14, 6), 1 - progress(frame, F.shutDown, 6));
  const actO2 = progress(frame, F.shutDown, 6);
  const capL = O_PAIR.x + O_PAIR.w;
  return (
    <g>
      {fold < 1 ? <SystemPage frame={frame} fold={fold} hideO /> : null}
      {dup > 0 ? <OPanel box={o2Box} active={actO2} caption={{text: 'Shut down', t: progress(frame, F.shutDown, 5, EASE.arrive), align: 'left'}} /> : null}
      <OPanel box={oBox} active={actO} caption={{text: 'Restart', t: progress(frame, F.restart, 5, EASE.arrive), align: 'right'}} />
      <RelLabel
        frame={frame}
        cx={960}
        y={Y0 + 6}
        lines={['Why', 'different?']}
        inAt={F.why}
        leaders={[
          [
            [904, Y0 + 36],
            [capL + 14, Y0 + 36],
          ],
          [
            [1016, Y0 + 36],
            [O2_PAIR.x - 14, Y0 + 36],
          ],
        ]}
      />
    </g>
  );
};
