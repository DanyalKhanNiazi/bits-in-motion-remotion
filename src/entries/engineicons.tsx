/**
 * Entry for the engine demo drawn with the REAL icon library (src/icons) instead of the engine placeholders:
 * registers EngineDemoIcons. A separate bundle, so a change in the icon library never breaks EngineDemo.
 *   node tools/stills.mjs src/entries/engineicons.tsx EngineDemoIcons out/enginedemo/icons 0,59,110,190,256,290 --luma
 */
import './engineicons.register';
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {EngineDemo, DEMO_FRAMES} from '../engine/demo/EngineDemo';
import {FPS, HEIGHT, WIDTH} from '../shared/timing';

const Root: React.FC = () => <Composition id="EngineDemoIcons" component={EngineDemo} durationInFrames={DEMO_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />;

registerRoot(Root);
