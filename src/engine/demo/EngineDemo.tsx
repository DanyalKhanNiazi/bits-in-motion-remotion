/**
 * EngineDemo: the Signal Atlas engine on the Ep01 desktop with placeholder icons (about 10 s). An episode is data:
 * this file is the whole composition.
 */
import React from 'react';
import {Atlas} from '../Atlas';
import {DEMO_WORLD} from './world';
import {DEMO_SCRIPT, DEMO_FRAMES} from './script';

export {DEMO_FRAMES};

export const EngineDemo: React.FC = () => <Atlas world={DEMO_WORLD} script={DEMO_SCRIPT} />;

export const EngineDemoFieldOff: React.FC = () => <Atlas world={DEMO_WORLD} script={DEMO_SCRIPT} debug={{fieldOff: true}} />;
