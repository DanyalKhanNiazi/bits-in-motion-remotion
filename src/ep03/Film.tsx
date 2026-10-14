import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SECTIONS} from './sections';
import {S1} from './sections/S1';
import {S2} from './sections/S2';
import {S3} from './sections/S3';
import {S4} from './sections/S4';
import {S5} from './sections/S5';
import {S6} from './sections/S6';
import {S7} from './sections/S7';
import {S8} from './sections/S8';
import {S9} from './sections/S9';
const COMP: Record<string, React.FC<{frame: number}>> = {S1, S2, S3, S4, S5, S6, S7, S8, S9};
export const Ep03Film: React.FC = () => {
  const frame = useCurrentFrame();
  const s = SECTIONS.find((x) => frame >= x.from && frame < x.to) ?? SECTIONS[SECTIONS.length - 1];
  const C = COMP[s.id];
  return <AbsoluteFill style={{background: '#070b14'}}><C frame={frame} /></AbsoluteFill>;
};
