/**
 * Entry for Style 1 only: registers ONLY the BenchNotebook composition, so a broken style cannot break
 * another style's bundle. Render with: node tools/stills.mjs src/entries/style1.tsx BenchNotebook out/style1/stills 0,671,1500
 */
import React from 'react';
import {registerRoot} from 'remotion';
import Intro from '../styles/style1/Intro';
import {IntroComposition} from '../shared/IntroComposition';

const Root: React.FC = () => <IntroComposition id="BenchNotebook" component={Intro} />;

registerRoot(Root);
