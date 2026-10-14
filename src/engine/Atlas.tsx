/**
 * The composition shell (ENGINE.md §17). Reads useCurrentFrame() once and passes absolute frames down.
 * Bottom to top, in one AbsoluteFill on `field`:
 *   1. LivingField (screen): L0–L2, reactions, window dimming.
 *   2. Inside the time-window clip: main View (grounds, vias, wash, parts, channels, routes, Bits, world glyphs; clipped
 *      to the centre band while a split is open) → split side bands (copies sliding out from under the centre band)
 *      → split centre rule → scrims → plates → row bridges and the chain Bit.
 *   3. The window's double rule.  4. Lenses.  5. Labels (knockouts, tags, pills, readouts) and the chip.
 *   6. Brackets on top.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {COLOR} from './tokens';
import {cameraAt, project, referenceShot} from './camera/camera';
import {LivingField} from './field/LivingField';
import {focusAt, pingsAt} from './field/focus';
import {View} from './view/View';
import {Plate} from './panels/Plate';
import {ghostsAt} from './panels/peel';
import {RowLayer} from './panels/RowLayer';
import {Scrim} from './panels/Scrim';
import {SplitBands, SplitCenterRule, splitClipAt, splitGhostsAt, splitMainOpacity} from './panels/Split';
import {TimeWindowClip, TimeWindowFrame, windowAt} from './panels/TimeWindow';
import {Lens2} from './lens/Lens2';
import {LabelLayer} from './labels/LabelLayer';
import {BracketsLayer} from './glyphs/GlyphLayer';
import {registerIcons, type IconType} from './world/icons';
import {portsOf} from './world/states';
import type {WorldSpec} from './world/types';
import type {Script} from './timeline/script';

export interface AtlasDebug {
  /** Flat field only (foreground still-run measurement). */
  fieldOff?: boolean;
  /** Every part's ports as small cyan crosses with names. */
  showPorts?: boolean;
  showSlots?: boolean;
  labelsOff?: boolean;
  checks?: boolean;
}

export interface AtlasProps {
  world: WorldSpec;
  script: Readonly<Script>;
  debug?: AtlasDebug;
  /** The icon library's getIcon (same as calling registerIcons(getIcon) at module load). */
  icons?: (type: IconType) => unknown;
}

export const Atlas: React.FC<AtlasProps> = ({world, script, debug, icons}) => {
  if (icons) registerIcons(icons);
  const frame = useCurrentFrame();
  const cam = cameraAt(frame, script.camera);
  const ref = referenceShot(script.camera);
  const focus = focusAt(frame, script, world);
  // round 4: the focus pings (the subject the voice is about keeps signalling over the board and the grid)
  const pings = debug?.fieldOff ? [] : pingsAt(frame, script, world);
  const win = windowAt(frame, script.windows);
  const splitClip = splitClipAt(frame, script.splits);
  const mainOpacity = splitMainOpacity(frame, script.splits);
  // round 3: hero plates leave a peeled socket in the world while they are out
  // round 4: the triptych's carried parts leave peeled sockets too
  const ghosts = splitGhostsAt(frame, script.splits, ghostsAt(frame, script.plates));
  return (
    <AbsoluteFill style={{background: COLOR.field}}>
      <LivingField frame={frame} cam={cam} refShot={ref} focus={focus} events={script.field} window={win.t > 0 ? win : undefined} seed={world.seed} off={debug?.fieldOff} pings={pings} />
      <TimeWindowClip state={win}>
        <View
          frame={frame}
          cam={cam}
          clip={splitClip}
          world={world}
          scope="world"
          script={script}
          refShot={ref}
          field={{focus, events: script.field, pings}}
          id="main"
          opacity={mainOpacity}
          ghosts={ghosts.size ? ghosts : null}
        />
        {script.splits.map((s, i) => (
          <SplitBands key={`band${i}`} spec={s} frame={frame} mainCam={cam} world={world} script={script} refShot={ref} />
        ))}
        {script.splits.map((s, i) => (
          <SplitCenterRule key={`rule${i}`} spec={s} frame={frame} script={script} mainCam={cam} world={world} refShot={ref} />
        ))}
        {script.scrims.map((s, i) => (
          <Scrim key={`scrim${i}`} frame={frame} at={s.at} outAt={s.outAt} inDur={s.inDur} alpha={s.alpha} />
        ))}
        {script.plates.map((p) => (
          <Plate key={p.id} spec={p} frame={frame} mainCam={cam} world={world} script={script} refShot={ref} />
        ))}
        {script.rows.map((r) => (
          <RowLayer key={r.id} row={r} frame={frame} script={script} world={world} />
        ))}
      </TimeWindowClip>
      <TimeWindowFrame state={win} frame={frame} drawAt={win.spec ? (win.spec.ruleAt ?? win.spec.at + 2) : 0} />
      {script.lenses.map((l) => (
        <Lens2 key={l.id} spec={l} frame={frame} mainCam={cam} world={world} script={script} />
      ))}
      {debug?.labelsOff ? null : <LabelLayer frame={frame} script={script} cam={cam} world={world} refShot={ref} within={splitClip ?? (win.t > 0 ? win.rect : null)} />}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        <BracketsLayer events={script.glyphs} frame={frame} cam={cam} world={world} refShot={ref} />
        {debug?.showPorts
          ? world.parts.flatMap((p) =>
              Object.entries(portsOf(world, p)).map(([name, pt]) => {
                const s = project(cam, pt);
                return (
                  <g key={`${p.id}.${name}`}>
                    <path d={`M${s[0] - 3} ${s[1]}h6M${s[0]} ${s[1] - 3}v6`} stroke={COLOR.info} strokeWidth={2} />
                    <text x={s[0] + 4} y={s[1] - 4} fontSize={11} fill={COLOR.info} style={{fontFamily: 'monospace'}}>
                      {`${p.id}.${name}`}
                    </text>
                  </g>
                );
              }),
            )
          : null}
      </svg>
    </AbsoluteFill>
  );
};
