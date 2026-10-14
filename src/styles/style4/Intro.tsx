/**
 * Style 4: Signal Score (time is the axis). Episode 01 intro, f0-f1889, muted.
 *
 * First the press travels through the PC's real parts (a hardware strip in score order); then the parts
 * slide into a column and each grows a lane, where a narration-locked playhead writes what every part
 * does. See STORYBOARD.md for the beat plan and REPORT.md for what was built and checked.
 *
 * Z-order (brand): ground < score (tracks, channels, events, links) < markers < lane-head hardware
 * < Bits < analogy overlays < tags/pills/headers < Time Lens < brackets.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {KitProvider} from '../../shared/context';
import {cleanSkin} from '../../shared/skin';
import {GROUND, T} from './layout';
import {HeadsLayer} from './heads';
import {Markers, S12Layer, ScoreLayer} from './score';
import {LabelsLayer} from './labels';
import {OverlaysLayer, TimeLens} from './overlays';
import './timemap';

const Intro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: GROUND}}>
      <KitProvider theme={T} skin={cleanSkin}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, overflow: 'hidden'}}>
          <ScoreLayer f={f} />
          <Markers f={f} />
          <S12Layer f={f} />
          <HeadsLayer f={f} />
          <OverlaysLayer f={f} />
          <LabelsLayer f={f} />
          <TimeLens f={f} />
        </svg>
      </KitProvider>
    </AbsoluteFill>
  );
};

export default Intro;
