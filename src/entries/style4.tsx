/**
 * Entry for Style 4 only: registers ONLY the SignalScore composition, so a broken style cannot break
 * another style's bundle. Render with: node tools/stills.mjs src/entries/style4.tsx SignalScore out/style4/stills 0,671,1500
 */
import React from 'react';
import {registerRoot} from 'remotion';
import Intro from '../styles/style4/Intro';
import {IntroComposition} from '../shared/IntroComposition';

const Root: React.FC = () => <IntroComposition id="SignalScore" component={Intro} />;

registerRoot(Root);
