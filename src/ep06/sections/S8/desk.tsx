/**
 * S8 P20 on the reader's desk: device encryption in Settings (state unknown, under a magnifier), then the limit: the
 * key slots in, the PC starts, Windows reads the drive normally and a recovery tool on this PC copies the photo.
 * Exit: pull back to the desk wide (S9 opens there).
 */
import React from 'react';
import {
  DESK,
  EASE,
  ExplorerWindow,
  KeyFixture,
  KineticText,
  PhotoViewer,
  REGIONS,
  ScannerProp,
  ScreenSlot,
  SettingsToggle,
  Stage,
  WinDesktop,
  WinFrame,
  clamp01,
  deskSlotScale,
  prog,
  springAt,
  track,
  type KenBurns,
  type Key,
} from '../../kit';
import {CUT, T} from './times';

const KB_KEYS: Record<'s' | 'x' | 'y', Key[]> = {
  s: [
    [CUT.desk, 1.14],
    [T.deviceEnc - 14, 1.5, EASE.inOut],
    [T.oneLimit - 2, 1.57],
    [T.oncePc + 18, 1.1, EASE.inOut],
    [T.started + 8, 1.08],
    [T.normally - 10, 1.34, EASE.inOut],
    [T.to - 22, 1.38],
    [T.to + 30, 1.05, EASE.inOut],
  ],
  x: [
    [CUT.desk, 0],
    [T.deviceEnc - 14, 0, EASE.inOut],
    [T.oneLimit - 2, 0],
    [T.oncePc + 18, -150, EASE.inOut],
    [T.started + 8, -160],
    [T.normally - 10, -20, EASE.inOut],
    [T.to - 22, -24],
    [T.to + 30, -40, EASE.inOut],
  ],
  y: [
    [CUT.desk, 50],
    [T.deviceEnc - 14, 166, EASE.inOut],
    [T.oneLimit - 2, 180],
    [T.oncePc + 18, -60, EASE.inOut],
    [T.started + 8, -66],
    [T.normally - 10, 118, EASE.inOut],
    [T.to - 22, 126],
    [T.to + 30, 0, EASE.inOut],
  ],
};
export const deskKb = (f: number): KenBurns => {
  const v = {s: track(f, KB_KEYS.s), x: track(f, KB_KEYS.x), y: track(f, KB_KEYS.y)};
  return {from: v, to: v, start: f, end: f + 1};
};

const SET_OPEN = T.manyNewer + 40;
const SET_CLOSE = T.oneLimit + 2;
const SLOT_AT = T.oncePc + 6;
const EX_IN = T.windowsReads - 10;
const SCAN_IN = T.wontStop - 14;

/** the Settings window (slot px) */
const SettingsWin: React.FC<{f: number; scale: number}> = ({f, scale}) => {
  const ein = springAt(f, SET_OPEN, {damping: 15, stiffness: 300, mass: 0.55});
  const eout = prog(f, SET_CLOSE, 10, EASE.inCubic);
  if (ein <= 0.001 || eout >= 1) return null;
  const W = 760;
  const H = 300;
  return (
    <div style={{position: 'absolute', left: (1032 - W) / 2, top: 92, width: W, height: H, opacity: clamp01(ein * 3) * (1 - eout), transform: `scale(${0.92 + 0.08 * Math.min(1.03, ein)}) translateY(${eout * 20}px)`, transformOrigin: '50% 40%'}}>
      <WinFrame w={W} h={H} title={<span>Settings</span>}>
        <SettingsToggle frame={f} x={W / 2} y={118} w={W - 60} title="Device encryption" state="unknown" at={T.deviceEnc} magnifier={{at: T.checking - 2}} scale={scale} />
      </WinFrame>
    </div>
  );
};

export const ShotI: React.FC<{f: number}> = ({f}) => {
  const kb = deskKb(f);
  const sc = deskSlotScale(f, kb);
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: DESK.plate,
        kb,
        children: (
          <>
            <ScreenSlot rect={REGIONS.deskScreen}>
              <WinDesktop frame={f} w={DESK.slotW} h={DESK.slotH}>
                <SettingsWin f={f} scale={sc} />
                <ExplorerWindow frame={f} x={30} y={34} w={480} h={430} rows={2} selectAt={T.windowsReads} enterAt={EX_IN} exitAt={SCAN_IN - 4} scale={sc} />
                <PhotoViewer frame={f} x={528} y={34} w={474} h={430} openAt={T.windowsReads + 8} />
                {f >= SCAN_IN ? (
                  <ScannerProp
                    frame={f}
                    x={262}
                    y={268}
                    w={440}
                    enter={{kind: 'rise', at: SCAN_IN, dur: 16}}
                    beam={{at: SCAN_IN + 12}}
                    scan={{at: SCAN_IN + 16, every: 34}}
                    tray="photo"
                    trayAt={T.recoveryTool}
                    fillDur={40}
                    shadow={0.5}
                  />
                ) : null}
              </WinDesktop>
            </ScreenSlot>
            <KeyFixture frame={f} x={1500} y={842} w={300} slotAt={SLOT_AT} glow={0.5} shadow={0.6} float={1} />
          </>
        ),
      }}
      hud={
        <>
          <KineticText frame={f} at={T.checking + 2} exitAt={T.oneLimit - 2} text="Check whether yours is on" x={960} y={120} size={72} mode="rise" />
          <KineticText frame={f} at={T.wontStop} exitAt={T.to - 12} text="Won't stop a recovery tool" x={960} y={118} size={76} mode="slam" />
        </>
      }
    />
  );
};
