// Preview entry for section S5 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S5} from '../ep03/sections/S5';
import {TOTAL} from '../ep03/timing';
const C: React.FC = () => <S5 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S5" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
