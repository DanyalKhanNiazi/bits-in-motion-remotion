// Preview entry for section S4 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S4} from '../ep03/sections/S4';
import {TOTAL} from '../ep03/timing';
const C: React.FC = () => <S4 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S4" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
