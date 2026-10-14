// Preview entry for section S7 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S7} from '../ep06/sections/S7';
import {TOTAL} from '../ep06/timing';
const C: React.FC = () => <S7 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S7" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
