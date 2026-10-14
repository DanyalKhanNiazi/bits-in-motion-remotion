/**
 * Signal Atlas (style6): the Ep01 intro, "What Happens When You Press Power". The episode is data (ep01/world.ts,
 * ep01/shots.ts, ep01/scenes.ts, ep01/script.ts) on the shared engine (src/engine) and icon library (src/icons).
 */
import React from 'react';
import {Atlas, CuesDump} from '../../engine';
import {WORLD} from './ep01/world';
import {SCRIPT} from './ep01/script';

const Intro: React.FC = () => <Atlas world={WORLD} script={SCRIPT} />;
export default Intro;

/** Dev composition `SignalAtlasCues`: prints the derived cue list (compare with cues.json). */
export const IntroCues: React.FC = () => <CuesDump script={SCRIPT} />;

/** Dev composition: the same intro with a flat field (foreground still-run measurement). */
export const IntroFieldOff: React.FC = () => <Atlas world={WORLD} script={SCRIPT} debug={{fieldOff: true}} />;
