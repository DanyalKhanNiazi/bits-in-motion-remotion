import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Ep06Film} from '../ep06/Film';
import {TOTAL} from '../ep06/timing';
registerRoot(() => <Composition id="Ep06" component={Ep06Film} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
