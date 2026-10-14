import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Ep03Film} from '../ep03/Film';
import {TOTAL} from '../ep03/timing';
registerRoot(() => <Composition id="Ep03" component={Ep03Film} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
