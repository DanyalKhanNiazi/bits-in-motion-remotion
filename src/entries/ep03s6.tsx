// Preview entry for section S6 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S6} from '../ep03/sections/S6';
import {TOTAL} from '../ep03/timing';
const C: React.FC = () => <S6 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S6" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
