// Preview entry for section S9 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S9} from '../ep06/sections/S9';
import {TOTAL} from '../ep06/timing';
const C: React.FC = () => <S9 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S9" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
