/**
 * Entry for Style 3 only: registers ONLY the LivingSchematic composition, so a broken style cannot break
 * another style's bundle. Render with: node tools/stills.mjs src/entries/style3.tsx LivingSchematic out/style3/stills 0,671,1500
 */
import React from 'react';
import {registerRoot} from 'remotion';
import Intro from '../styles/style3/Intro';
import {IntroComposition} from '../shared/IntroComposition';

const Root: React.FC = () => <IntroComposition id="LivingSchematic" component={Intro} />;

registerRoot(Root);
