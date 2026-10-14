/**
 * The one composition shape every intro uses: 1920x1080, 30 fps, 1890 frames (f0–f1889).
 */
import React from 'react';
import {Composition} from 'remotion';
import {DURATION, FPS, HEIGHT, WIDTH} from './timing';

export const STYLE_IDS = {
  1: 'BenchNotebook',
  2: 'NightSignal',
  3: 'LivingSchematic',
  4: 'SignalScore',
  5: 'LivePanels',
} as const;

export const IntroComposition: React.FC<{id: string; component: React.ComponentType<Record<string, unknown>>}> = ({id, component}) => (
  <Composition id={id} component={component} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} defaultProps={{}} />
);
