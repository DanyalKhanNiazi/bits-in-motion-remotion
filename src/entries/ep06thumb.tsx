/**
 * Ep06 thumbnail candidate: the signature image (the struck card lifted above the wall, its threads still running to
 * every lit byte) with the 3-word overlay "Delete ≠ Erase". Rendered at 1920×1080 and downscaled to 1280×720:
 *   node tools/stills.mjs src/entries/ep06thumb.tsx Thumb out/ep06/thumb 60
 */
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {Archive, KineticText, PAL, Stage, archiveCam} from '../ep06/kit';

const SIG = archiveCam('signature');

const Thumb: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: PAL.void}}>
      <Stage
        frame={f}
        env={{kind: 'archive', light: 'cool'}}
        drift={0}
        cam={{...SIG, y: SIG.y + 150, zoom: SIG.zoom * 0.8}}
        hud={<KineticText frame={f} at={0} text="Delete ≠ Erase" x={960} y={968} size={168} mode="pop" />}
      >
        <Archive frame={f} state="HDD_DELETED" mode="hdd" lift={1} />
      </Stage>
    </AbsoluteFill>
  );
};

registerRoot(() => <Composition id="Thumb" component={Thumb} durationInFrames={90} fps={30} width={1920} height={1080} />);
