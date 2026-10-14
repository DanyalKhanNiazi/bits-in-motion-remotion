// Preview entry for section S8 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S8} from '../ep06/sections/S8';
import {TOTAL} from '../ep06/timing';
const C: React.FC = () => <S8 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S8" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
