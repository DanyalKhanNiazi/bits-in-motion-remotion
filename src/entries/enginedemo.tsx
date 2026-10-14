/**
 * Entry for the Signal Atlas engine demo only: registers EngineDemo (about 10 s), EngineDemoFieldOff (the same with a
 * flat field, for foreground still-run measurement) and two verification beds (EngineTestPanels, EngineTestGlyphs).
 *   node tools/stills.mjs src/entries/enginedemo.tsx EngineDemo out/enginedemo/stills 0,59,120,190,250,280 --phone --luma
 *   node tools/render.mjs src/entries/enginedemo.tsx EngineDemo out/enginedemo/enginedemo.mp4
 */
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {EngineDemo, EngineDemoFieldOff, DEMO_FRAMES} from '../engine/demo/EngineDemo';
import {EngineTestGlyphs, EngineTestPanels, GLYPHS_FRAMES, PANELS_FRAMES} from '../engine/demo/tests';
import {FPS, HEIGHT, WIDTH} from '../shared/timing';

const Root: React.FC = () => (
  <>
    <Composition id="EngineDemo" component={EngineDemo} durationInFrames={DEMO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="EngineDemoFieldOff" component={EngineDemoFieldOff} durationInFrames={DEMO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="EngineTestPanels" component={EngineTestPanels} durationInFrames={PANELS_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="EngineTestGlyphs" component={EngineTestGlyphs} durationInFrames={GLYPHS_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);

registerRoot(Root);
