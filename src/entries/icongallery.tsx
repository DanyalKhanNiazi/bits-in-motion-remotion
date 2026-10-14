/**
 * Entry for the Signal Atlas icon review sheet only: registers ONLY the IconGallery composition (1920 × 1080, 30 fps,
 * one 60-frame page per review sheet; see src/icons/IconSheet.tsx for the page list).
 *   node tools/stills.mjs src/entries/icongallery.tsx IconGallery out/icons/look 30,90,150 --phone
 */
import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {FRAME} from '../engine/tokens';
import {IconSheet, ICON_SHEET_FRAMES} from '../icons/IconSheet';

const Root: React.FC = () => (
  <Composition
    id="IconGallery"
    component={IconSheet}
    durationInFrames={ICON_SHEET_FRAMES}
    fps={FRAME.fps}
    width={FRAME.width}
    height={FRAME.height}
  />
);

registerRoot(Root);
