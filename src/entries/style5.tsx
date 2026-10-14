/**
 * Entry for Style 5 only: registers ONLY the LivePanels composition, so a broken style cannot break
 * another style's bundle. Render with: node tools/stills.mjs src/entries/style5.tsx LivePanels out/style5/stills 0,671,1500
 */
import React from 'react';
import {registerRoot} from 'remotion';
import Intro from '../styles/style5/Intro';
import {IntroComposition} from '../shared/IntroComposition';

const Root: React.FC = () => <IntroComposition id="LivePanels" component={Intro} />;

registerRoot(Root);
