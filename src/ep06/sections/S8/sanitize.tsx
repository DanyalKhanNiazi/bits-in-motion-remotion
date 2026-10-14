/**
 * S8 P19: ask the drive itself. One Archive (SSD_STALE, split layers): the camera sinks to the drive's chip, the
 * built-in erase command goes in, the chip fires the sanitize pulse across every box (spare columns last), and a ✓
 * comes back out while "You're trusting the manufacturer" is on screen.
 */
import React from 'react';
import {
  Archive,
  AtlasOpener,
  EASE,
  Footnote,
  KineticText,
  Label,
  PAL,
  QuoteStrip,
  Rich,
  Stage,
  VerdictChip,
  clamp01,
  poseAt,
  prog,
  rgba,
  springAt,
  toScreen,
  type ArchiveEvent,
  type CamKey,
} from '../../kit';
import {LAY, MOVERS_EV} from './coin';
import {CUT, T} from './times';

export const SAN_AT = T.dedicated + 10;
const SAN_DUR = 230;
const CHECK_AT = SAN_AT + SAN_DUR - 4;
const ACTOR = {x: 806, y: 952};
const EVENTS: ArchiveEvent[] = [
  MOVERS_EV,
  // the chip listens from the moment the erase command arrives (an empty remap keeps the drive actor busy)
  {at: T.eraseCmd + 2, op: 'remap', target: [], dur: SAN_AT - T.eraseCmd - 8},
  {at: SAN_AT, op: 'sanitize', dur: SAN_DUR},
];
const CAM_D: CamKey[] = [
  {f: CUT.dive, ...LAY, zoom: LAY.zoom * 1.12},
  {f: T.askDrive - 4, x: LAY.x - 10, y: LAY.y + 8, zoom: LAY.zoom * 1.03, ease: 'out'},
  {f: T.makers - 4, x: 880, y: 820, zoom: 1.58, dur: 52, ease: 'inOut'},
  {f: T.sanitizeFn - 6, x: 860, y: 838, zoom: 1.7},
  {f: SAN_AT + 6, ...LAY, zoom: LAY.zoom * 0.98, dur: 84, ease: 'inOut'},
  {f: T.though - 6, x: LAY.x + 150, y: LAY.y + 14, zoom: LAY.zoom * 1.1, dur: 150},
  {f: CUT.key + 12, x: LAY.x + 70, y: LAY.y + 10, zoom: LAY.zoom * 1.02, dur: 80},
];

/** an amber command pulse converging into the chip (hud px) */
const Converge: React.FC<{f: number; at: number; x: number; y: number; dur?: number}> = ({f, at, x, y, dur = 18}) => {
  const t = (f - at) / dur;
  if (t < 0 || t > 1.4) return null;
  const u = EASE.inCubic(clamp01(t));
  const r = 280 * (1 - u) + 8;
  const flash = t > 1 ? Math.exp(-(t - 1) * 10) : 0;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      {t <= 1 ? (
        <>
          <circle cx={x} cy={y} r={r} fill="none" stroke={PAL.drive} strokeOpacity={0.25 * (0.3 + u)} strokeWidth={30} />
          <circle cx={x} cy={y} r={r} fill="none" stroke={PAL.driveHot} strokeWidth={4} opacity={0.4 + 0.6 * u} />
        </>
      ) : null}
      {flash > 0.01 ? <circle cx={x} cy={y} r={90} fill={rgba(PAL.driveHot, 0.45 * flash)} /> : null}
    </svg>
  );
};

/** the drive's answer: a ✓ that rises out of the chip */
const Check: React.FC<{f: number; at: number; x: number; y: number}> = ({f, at, x, y}) => {
  if (f < at) return null;
  const sp = springAt(f, at, {damping: 12, stiffness: 160, mass: 0.7});
  const rise = 150 * EASE.out(prog(f, at, 22));
  const d = 84;
  return (
    <div style={{position: 'absolute', left: x - d / 2, top: y - d / 2 - rise, width: d, height: d, transform: `scale(${sp})`, opacity: clamp01(sp * 2)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: rgba('#0B1220', 0.92), border: `3px solid ${PAL.ink}`, boxShadow: `0 0 34px ${rgba(PAL.driveHot, 0.45)}`}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: PAL.ink, lineHeight: 1}}>
        <Rich text="✓" weight={700} />
      </div>
    </div>
  );
};

export const ShotD: React.FC<{f: number}> = ({f}) => {
  const pose = poseAt(f, CAM_D);
  const chip = toScreen(pose, ACTOR.x, ACTOR.y);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={CAM_D}
      shake={[{at: SAN_AT, strength: 0.4}]}
      hud={
        <>
          <AtlasOpener frame={f} at={T.so + 2} word="What actually erases" y={470} />
          <VerdictChip frame={f} at={T.makers + 2} exitAt={T.nist - 10} text="Drive makers ship tools" tone="neutral" x={960} y={118} size={50} />
          <Label frame={f} at={T.builtIn + 2} exitAt={T.crucial - 4} text="Built-in erase command" x={chip.x + 150} y={chip.y - 210} to={{x: chip.x + 10, y: chip.y - 30}} side="right" size={52} />
          <KineticText frame={f} at={T.crucial + 3} exitAt={T.nist - 10} text="Example: Crucial Storage Executive → Sanitize Drive" x={960} y={206} size={50} mode="rise" stagger={2} />
          <Converge f={f} at={T.eraseCmd} x={chip.x} y={chip.y} />
          <Converge f={f} at={T.sanitizeFn + 4} x={chip.x} y={chip.y} dur={22} />
          <QuoteStrip frame={f} at={T.nist + 2} exitAt={T.though - 4} source="NIST" reported="sanitize commands reach all storage areas more effectively than overwriting" />
          <VerdictChip frame={f} at={T.trusting - 3} exitAt={CUT.key + 2} text="You're trusting the manufacturer" tone="neutral" x={960} y={118} size={54} />
          <Check f={f} at={CHECK_AT} x={chip.x} y={chip.y - 40} />
          <Footnote frame={f} at={T.so + 50} exitAt={CUT.key + 4} text="Schematic, not to scale" x={1420} y={1006} />
        </>
      }
    >
      <Archive frame={f} state="SSD_STALE" events={EVENTS} />
    </Stage>
  );
};
