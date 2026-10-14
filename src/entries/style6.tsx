/**
 * Entry for Style 6 (Signal Atlas) only: registers SignalAtlas, the dev composition SignalAtlasCues (prints the derived
 * cue list) and SignalAtlasFieldOff (flat field, for the foreground still-run check). Render with:
 *   node tools/stills.mjs src/entries/style6.tsx SignalAtlas out/style6/look 0,671,1500 --phone --luma
 *
 * Round 4, file naming (style guide §13.8): every episode registers `SignalAtlasEpNN` (intro), `SignalAtlasEpNNChK`
 * (chapter K), `SignalAtlasEpNNCues` and `SignalAtlasEpNNFieldOff`. Ep01's intro predates the scheme, so it keeps its
 * first ids (`SignalAtlas`, `SignalAtlasCues`, `SignalAtlasFieldOff`, which the tools and earlier reports use) and also
 * registers the scheme's ids for the same compositions. The template is `SignalAtlasEpXX` (and its old id).
 */
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import Intro, {IntroCues, IntroFieldOff} from '../styles/style6/Intro';
import Template from '../styles/style6/epXX_template/Intro';
import {IntroComposition} from '../shared/IntroComposition';
import {checkCues, type CueFile} from '../engine';
import {SCRIPT} from '../styles/style6/ep01/script';
import CUES from '../styles/style6/cues.json';
import {FPS, HEIGHT, WIDTH} from '../shared/timing';

checkCues(CUES as CueFile, SCRIPT);

/** The scheme's composition ids for an episode (style guide §13.8). */
export const episodeIds = (nn: string) => ({
  intro: `SignalAtlasEp${nn}`,
  chapter: (k: number) => `SignalAtlasEp${nn}Ch${k}`,
  cues: `SignalAtlasEp${nn}Cues`,
  fieldOff: `SignalAtlasEp${nn}FieldOff`,
});
const EP01 = episodeIds('01');

const Root: React.FC = () => (
  <>
    <IntroComposition id="SignalAtlas" component={Intro} />
    <Composition id="SignalAtlasCues" component={IntroCues} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
    <IntroComposition id="SignalAtlasFieldOff" component={IntroFieldOff} />
    {/* round 4: the same compositions under the file-naming scheme's ids */}
    <IntroComposition id={EP01.intro} component={Intro} />
    <Composition id={EP01.cues} component={IntroCues} durationInFrames={1} fps={FPS} width={WIDTH} height={HEIGHT} />
    <IntroComposition id={EP01.fieldOff} component={IntroFieldOff} />
    {/* round 2: the episode template renders as is (frameParts shots, 'auto' tag slots) */}
    <Composition id="SignalAtlasTemplate" component={Template} durationInFrames={240} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="SignalAtlasEpXX" component={Template} durationInFrames={240} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);

registerRoot(Root);
