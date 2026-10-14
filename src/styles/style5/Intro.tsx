/**
 * Style 5 · Live Panels (LivePanels): the Bits in Motion ep01 intro, 63 s, 1,890 frames, 1920×1080, 30 fps.
 * A living page of clear-line panels on a dark page; each panel is a live view of the same PC (outside and
 * inside, now and later), and the explanation is what crosses, or never crosses, the gutters between them.
 *
 * Pages (absolute frames; every page change sits inside a narration pause):
 *   P1–P2  f0–f708     system page: B board, P power supply, O case front + monitor (S01–S05)
 *   P3     f709–f925   the present page steps back to a held thumbnail; T, a row of six views (S06)
 *   P4     f926–f1071  system page (S07)
 *   P5     f1072–f1242 B and P fold, O glides; O and its copy O′ with "Why different?" (S08)
 *   P6     f1243–f1511 M, the whole tower; two unvisited stops (S09–S10a)
 *   P7     f1512–f1679 the standby path: outside rear + inside schematic, real row and two "If…" copies (S10)
 *   P8–P9  f1680–f1889 system page (S11–S12)
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KitProvider, KitLayer, EASE, progress, rectPath} from '../../shared';
import {D, TONE, ID, fitView, lerpView, vbox} from './look';
import {Lenses, SystemPage} from './system';
import {TRow} from './chain';
import {PairPage} from './pair';
import {TowerPage} from './tower';
import {StandbyPage} from './standby';
import {Header5} from './labels';
import * as G from './geo';
import {F} from './T';

/** S06: the whole present page held small (×0.38), centred above the row of views. */
const THUMB = fitView(G.PAGE, {x: 960 - (G.PAGE.w * 0.38) / 2, y: 212, w: G.PAGE.w * 0.38, h: G.PAGE.h * 0.38});
const BACK_AT = F.s06Out; // T folds, the page grows back

const StepBackPage: React.FC<{frame: number}> = ({frame}) => {
  const out = progress(frame, F.stepBack, 12, EASE.move);
  const back = progress(frame, BACK_AT, 14, EASE.move);
  const view = back > 0 ? lerpView(THUMB, ID, back) : lerpView(ID, THUMB, out);
  // the page is a sheet ABOVE the row: an opaque page-tone backing under its panels hides whatever part of T it still
  // covers while it steps back (and while it grows back over the folding row), so the two layouts never cut each other
  const sheet = vbox(view, G.PAGE);
  return (
    <g>
      <TRow frame={frame} open={progress(frame, F.tOpen, 8, EASE.arrive)} fold={progress(frame, BACK_AT, 8, EASE.exit)} />
      <path d={rectPath(sheet.x - 4, sheet.y - 4, sheet.w + 8, sheet.h + 8, 10)} fill={TONE.page} />
      <SystemPage frame={frame} view={view} thumb labels />
      {/* the S05 inset completes its close (f705–f711) riding the step-back's view */}
      {frame < F.s05Out + 8 ? (
        <g transform={`matrix(${view.s} 0 0 ${view.s} ${view.tx} ${view.ty})`}>
          <Lenses frame={frame} />
        </g>
      ) : null}
      <Header5 frame={frame} text="After the press" inAt={F.afterIn2} shrinkAt={F.afterShrink2} outAt={F.s06Out} double />
    </g>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  let page: React.ReactNode;
  if (frame < F.stepBack) page = <SystemPage frame={frame} />;
  else if (frame < BACK_AT + 14) page = <StepBackPage frame={frame} />;
  else if (frame < F.glide) page = <SystemPage frame={frame} />;
  else if (frame < F.cutTower) page = <PairPage frame={frame} />;
  else if (frame < F.cutStandby) page = <TowerPage frame={frame} />;
  else if (frame < F.cutS11) page = <StandbyPage frame={frame} />;
  else page = <SystemPage frame={frame} />;
  return (
    <AbsoluteFill style={{background: TONE.page}}>
      <KitProvider theme={D}>
        <KitLayer>{page}</KitLayer>
      </KitProvider>
    </AbsoluteFill>
  );
};

export default Intro;
