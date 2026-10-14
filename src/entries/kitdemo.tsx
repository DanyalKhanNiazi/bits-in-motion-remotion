/**
 * Entry for the kit demo only: registers the KitDemo composition (every kit component on dark and light grounds).
 *   node tools/stills.mjs src/entries/kitdemo.tsx KitDemo out/kitdemo 100,250,400,550 --phone
 */
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {KitDemo, KITDEMO_DURATION} from '../kitdemo/KitDemo';
import {FPS, HEIGHT, WIDTH} from '../shared/timing';

const Root: React.FC = () => (
  <Composition id="KitDemo" component={KitDemo} durationInFrames={KITDEMO_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);

registerRoot(Root);
