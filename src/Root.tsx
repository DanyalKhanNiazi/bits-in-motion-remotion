/**
 * All six intro compositions (plus the kit demo), for Remotion Studio: npm run studio.
 * Each style also has its own isolated entry in src/entries/styleN.tsx; the tools render from those.
 */
import React from 'react';
import {Composition, Folder} from 'remotion';
import Style1 from './styles/style1/Intro';
import Style2 from './styles/style2/Intro';
import Style3 from './styles/style3/Intro';
import Style4 from './styles/style4/Intro';
import Style5 from './styles/style5/Intro';
import Style6 from './styles/style6/Intro';
import {IntroComposition} from './shared/IntroComposition';
import {KitDemo, KITDEMO_DURATION} from './kitdemo/KitDemo';
import {FPS, HEIGHT, WIDTH} from './shared/timing';

export const Root: React.FC = () => (
  <>
    <Folder name="Intros">
      <IntroComposition id="BenchNotebook" component={Style1} />
      <IntroComposition id="NightSignal" component={Style2} />
      <IntroComposition id="LivingSchematic" component={Style3} />
      <IntroComposition id="SignalScore" component={Style4} />
      <IntroComposition id="LivePanels" component={Style5} />
      <IntroComposition id="SignalAtlas" component={Style6} />
    </Folder>
    <Folder name="Kit">
      <Composition id="KitDemo" component={KitDemo} durationInFrames={KITDEMO_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    </Folder>
  </>
);
