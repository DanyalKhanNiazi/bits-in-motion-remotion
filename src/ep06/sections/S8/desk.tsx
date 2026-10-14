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
  lerp,
  prog,
  springAt,
  track,
  type KenBurns,
  type Key,
} from '../../kit';
import {at} from '../../timing';
import {CUT, T} from './times';

const EXIT0 = T.to - 40;
const EXIT1 = T.to - 4;

const KB_KEYS: Record<'s' | 'x' | 'y', Key[]> = {
  s: [
    [CUT.desk, 1.14],
    [T.deviceEnc - 14, 1.5, EASE.inOut],
    [T.oneLimit - 2, 1.57],
    [T.oncePc + 18, 1.1, EASE.inOut],
    [T.started + 8, 1.08],
    [T.normally - 10, 1.34, EASE.inOut],
    [EXIT0, 1.38],
  ],
  x: [
    [CUT.desk, 0],
    [T.deviceEnc - 14, 0, EASE.inOut],
    [T.oneLimit - 2, 0],
    [T.oncePc + 18, -150, EASE.inOut],
    [T.started + 8, -160],
    [T.normally - 10, -20, EASE.inOut],
    [EXIT0, -24],
  ],
  y: [
    [CUT.desk, 50],
    [T.deviceEnc - 14, 166, EASE.inOut],
    [T.oneLimit - 2, 180],
    [T.oncePc + 18, -60, EASE.inOut],
    [T.started + 8, -66],
    [T.normally - 10, 118, EASE.inOut],
    [EXIT0, 126],
  ],
};
/**
 * S9 opens on the desk pulling back: its plate Ken Burns eases out from {s 1.2, x −80, y −60} at T.to − 30 to
 * {s 1.06, x −24, y −6} at P21 "back" − 4 (S9/Fork.tsx). From EXIT0 our pull-back blends onto that exact curve, so
 * the cut at T.to lands mid-move with matching position and speed.
 */
const S9_A = {f: T.to - 30, s: 1.2, x: -80, y: -60};
const S9_B = {f: at(21, 'back to the passport').start - 4, s: 1.06, x: -24, y: -6};
const s9Kb = (f: number) => {
  const e = EASE.out(clamp01((f - S9_A.f) / (S9_B.f - S9_A.f)));
  return {s: Math.exp(lerp(Math.log(S9_A.s), Math.log(S9_B.s), e)), x: lerp(S9_A.x, S9_B.x, e), y: lerp(S9_A.y, S9_B.y, e)};
};
export const deskKb = (f: number): KenBurns => {
  const a = {s: track(f, KB_KEYS.s), x: track(f, KB_KEYS.x), y: track(f, KB_KEYS.y)};
  const u = EASE.inOut(clamp01((f - EXIT0) / (EXIT1 - EXIT0)));
  const b = u > 0 ? s9Kb(f) : a;
  const v = {s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), u)), x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u)};
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
