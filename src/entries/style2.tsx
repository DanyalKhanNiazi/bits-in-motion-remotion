/**
 * Entry for Style 2 only: registers ONLY the NightSignal composition, so a broken style cannot break
 * another style's bundle. Render with: node tools/stills.mjs src/entries/style2.tsx NightSignal out/style2/stills 0,671,1500
 */
import React from 'react';
import {registerRoot} from 'remotion';
import Intro from '../styles/style2/Intro';
import {IntroComposition} from '../shared/IntroComposition';

const Root: React.FC = () => <IntroComposition id="NightSignal" component={Intro} />;

registerRoot(Root);
