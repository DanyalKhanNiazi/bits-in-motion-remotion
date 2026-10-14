/**
 * Ep06 core kit demo. Compositions:
 *   KitDemo        ≈ 40 s of short realistic shots exercising the kit
 *   ArchiveStates  the 12 Archive presets at a typical framing, one preset per 10 frames (gate contact sheet)
 *   flock -w 480 /tmp/ep06-render.lock node tools/stills.mjs src/entries/ep06kit.tsx ArchiveStates out/ep06/kit/states 5-115:10
 */
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {ARCHIVE_STATES, Archive, PRESET_NAMES, Stage, archiveCam, type Framing, type PresetName} from '../ep06/kit';

const STATE_FRAMING: Record<PresetName, Framing> = {
  HDD_SAVED: 'wide',
  HDD_DELETED: 'wide',
  HDD_REUSED: 'drawer',
  HDD_RACE_LOST: 'wall',
  HDD_WIPED: 'wall',
  SSD_SAVED: 'wide',
  SSD_DELETED: 'signature',
  SSD_TRIMMED: 'photoBoxes',
  SSD_ERASED: 'photoBoxes',
  SSD_STALE: 'layers',
  SSD_SANITIZED: 'layers',
  SSD_ENCRYPTED: 'layers',
};
const StatesComp: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(PRESET_NAMES.length - 1, Math.floor(f / 10));
  const name = PRESET_NAMES[i];
  const fr = STATE_FRAMING[name];
  const lift = fr === 'signature' || fr === 'split' ? 1 : 0;
  return (
    <Stage frame={f} env={{kind: 'archive', light: ARCHIVE_STATES[name].light}} cam={archiveCam(fr)}>
      <Archive frame={f} state={name} lift={lift} />
    </Stage>
  );
};

const Demo: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <Stage frame={f} env={{kind: 'archive', light: 'warm'}} cam={archiveCam('wide')}>
      <Archive frame={f} state="HDD_SAVED" />
    </Stage>
  );
};

registerRoot(() => (
  <>
    <Composition id="KitDemo" component={Demo} durationInFrames={1200} fps={30} width={1920} height={1080} />
    <Composition id="ArchiveStates" component={StatesComp} durationInFrames={PRESET_NAMES.length * 10} fps={30} width={1920} height={1080} />
  </>
));
