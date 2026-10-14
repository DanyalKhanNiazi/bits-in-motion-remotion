// Preview entry for section S3 only. The composition spans the whole film so frame numbers are ABSOLUTE.
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {S3} from '../ep06/sections/S3';
import {TOTAL} from '../ep06/timing';
const C: React.FC = () => <S3 frame={useCurrentFrame()} />;
registerRoot(() => <Composition id="S3" component={C} durationInFrames={TOTAL} fps={30} width={1920} height={1080} />);
