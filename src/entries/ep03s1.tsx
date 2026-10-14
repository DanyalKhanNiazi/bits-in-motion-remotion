// Preview entry for section S1 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S1} from '../ep03/sections/S1';
import {TOTAL} from '../ep03/timing';
const C: React.FC = () => <S1 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S1" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
