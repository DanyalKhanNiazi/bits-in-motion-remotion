// S1 desk shots: A (the hook: delete → bin → empty → "Gone."), E/I (the Windows PC; the push into the monitor).
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  Cursor,
  DESK,
  EASE,
  ExplorerWindow,
  FictionalNote,
  KeyCap,
  KineticText,
  Label,
  PAL,
  PassportCard,
  PhotoBits,
  PhotoViewer,
  REGIONS,
  RecycleBin,
  ScreenSlot,
  Stage,
  WinDesktop,
  assetBox,
  binFlyTo,
  clamp01,
  deskScreenRect,
  deskSlotScale,
  lerp,
  plateToStage,
  prog,
  rgba,
  type KenBurns,
} from '../../kit';
import {T} from './times';

/* ---------------------------------------------------------------- layout (slot px of the 1032×547 desk monitor) */
export const SLOT = {x: DESK.screen[0][0], y: DESK.screen[0][1]};
export const BIN = {x: 872, y: 300, w: 236};
export const EXPLORER = {x: 34, y: 30, w: 640, h: 452};
const VIEW = {x: 40, y: 28, w: 640, h: 452, s: 1.4};
/** the passport's visible rect inside the PhotoViewer (same maths as PhotoViewer) */
const PHOTO = (() => {
  const b = assetBox('fictional-passport_b');
  const bodyH = VIEW.h - 50 * VIEW.s;
  const ih = bodyH * 0.9;
  const k = ih / b.ch;
  const cx = VIEW.x + VIEW.w / 2;
  const cy = VIEW.y + 50 * VIEW.s + bodyH / 2;
  return {cx, cy, w: b.cw * k, h: ih, x: cx - (b.cw * k) / 2, y: cy - ih / 2};
})();
const LAND = binFlyTo(BIN);

/* ---------------------------------------------------------------- A: the hook */
export const KB_A: KenBurns = {from: {s: 1.16, x: 30, y: 40}, to: {s: 1.42, x: -40, y: 90}, start: T.from - 30, end: T.hardDrive + 6};
const DEL = T.delete;
const FLY = 18;
const HOLD_AT = DEL + FLY + 1;
const FLUSH = T.empty + 3;
/** the click that empties the bin (the bin's own menu would run off the monitor's edge here) */
const EMPTY_CURSOR = [
  {f: T.empty - 26, x: 640, y: 470},
  {f: T.empty, x: 884, y: 318, click: true},
  {f: T.asFar, x: 930, y: 400},
];

/** slot px → screen px on the desk (no Stage camera) */
export const slotToScreen = (f: number, kb: KenBurns, sx: number, sy: number) => plateToStage(f, kb, SLOT.x + sx, SLOT.y + sy);
/** where the cyan afterimage sits on screen (DriveDive pushes into it) */
export const afterimagePoint = (f: number) => slotToScreen(f, KB_A, PHOTO.cx, PHOTO.cy - 20);

const Flight: React.FC<{f: number}> = ({f}) => {
  const u = prog(f, DEL + 1, FLY, EASE.inOut);
  if (f <= DEL || u >= 1) return null;
  const x = lerp(PHOTO.cx, LAND.x, u);
  const dist = Math.hypot(LAND.x - PHOTO.cx, LAND.y - PHOTO.cy);
  const y = lerp(PHOTO.cy, LAND.y, u) - dist * 0.22 * Math.sin(Math.PI * u);
  const w = lerp(PHOTO.w, 62, EASE.inCubic(u));
  return (
    <PassportCard
      frame={f}
      variant="screen"
      x={x}
      y={y}
      w={w}
      rot={14 * Math.sin(Math.PI * u)}
      shadow={false}
      sweep={false}
      nudge={{op: 1 - prog(f, DEL + FLY - 2, 3), bright: 1 + 0.25 * Math.sin(Math.PI * u)}}
    />
  );
};

/** the faint cyan afterimage of the photo's Bits left on the glass (breathes on the absolute frame) */
const Afterimage: React.FC<{f: number}> = ({f}) => {
  if (f < DEL) return null;
  const settle = prog(f, DEL + 8, 50, EASE.out);
  const breath = 0.5 + 0.5 * Math.sin((f / 90) * Math.PI * 2);
  const flushPulse = f >= FLUSH ? Math.exp(-(f - FLUSH) / 10) : 0;
  const op = lerp(0.8, 0.3 + 0.12 * breath, settle) + 0.3 * flushPulse;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1032, height: 547, opacity: clamp01(op)}}>
      <PhotoBits frame={f} at={DEL + 2} dur={24} mode="dissolve" from={{x: PHOTO.x, y: PHOTO.y + 10, w: PHOTO.w, h: PHOTO.h - 10}} grid={[12, 16]} />
    </div>
  );
};

export const DeskHook: React.FC<{f: number}> = ({f}) => {
  const kb = KB_A;
  const bin = slotToScreen(f, kb, BIN.x, BIN.y);
  return (
    <Stage
      frame={f}
      drift={0}
      shake={[{at: T.goneWord + 3, strength: 0.6}]}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <WinDesktop frame={f} w={1032} h={547}>
              <RecycleBin frame={f} {...BIN} float={1.5} shadow={0.6} holdsPhoto={HOLD_AT} flushAt={FLUSH} />
              <PhotoViewer frame={f} x={VIEW.x} y={VIEW.y} w={VIEW.w} h={VIEW.h} s={VIEW.s} exitAt={DEL + 1} />
              <Afterimage f={f} />
              <Flight f={f} />
              <Cursor frame={f} at={T.empty - 26} exitAt={T.asFar} size={34} keys={EMPTY_CURSOR} />
            </WinDesktop>
          </ScreenSlot>
        ),
      }}
      hud={
        <>
          <FictionalNote frame={f} at={T.from} exitAt={T.hardDrive - 4} />
          <KeyCap frame={f} keys={['Delete']} x={1700} y={846} at={DEL - 8} pressAt={DEL} hold={6} exitAt={DEL + 40} />
          <Label frame={f} at={T.asFar} exitAt={T.goneWord + 14} text="As far as Windows is concerned" x={bin.x - 150} y={170} to={{x: bin.x - 40, y: bin.y - 90}} side="left" size={48} />
          <KineticText frame={f} at={T.goneWord} text="Gone." x={bin.x - 20} y={bin.y + 10} size={220} mode="slam" color={PAL.ink} accent={PAL.ink} />
        </>
      }
    />
  );
};

/* ---------------------------------------------------------------- E / I: the Windows PC (Explorer, empty bin) */
const PULL = T.windowsPc - 4;
export const KB_E1: KenBurns = {from: DESK.kbScreen, to: {s: 1.2, x: 0, y: 46}, start: PULL, end: PULL + 28};
const KB_E2: KenBurns = {from: {s: 1.2, x: 0, y: 46}, to: {s: 1.32, x: 30, y: 74}, start: PULL + 28, end: T.work + 6};
export const EXIT_AT = T.aFile + 7;
const KB_I1: KenBurns = {from: {s: 1.3, x: 20, y: 70}, to: DESK.kbScreen, start: EXIT_AT, end: T.to};
const KB_I2: KenBurns = {from: DESK.kbScreen, to: {s: 1.9, x: 0, y: 232}, start: T.to, end: T.to + 40};
export const kbPc = (f: number): KenBurns => (f < PULL + 28 ? KB_E1 : f < EXIT_AT ? KB_E2 : f < T.to ? KB_I1 : KB_I2);

const SELECT = T.along + 33;
const CURSOR = [
  {f: T.along - 2, x: 980, y: 520},
  {f: SELECT - 1, x: 300, y: 218, click: true},
  {f: SELECT + 40, x: 336, y: 236},
];

export const DeskPc: React.FC<{f: number; overlay?: React.ReactNode}> = ({f, overlay}) => {
  const kb = kbPc(f);
  const k = deskSlotScale(f, kb);
  return (
    <AbsoluteFill>
      <Stage
        frame={f}
        drift={0}
        env={{
          kind: 'photo',
          plate: 'reader-desk',
          kb,
          children: (
            <ScreenSlot rect={REGIONS.deskScreen}>
              <WinDesktop frame={f} w={1032} h={547}>
                <RecycleBin frame={f} {...BIN} float={1.5} shadow={0.6} />
                <ExplorerWindow frame={f} {...EXPLORER} selectAt={SELECT} cursor={CURSOR} scale={k} />
              </WinDesktop>
            </ScreenSlot>
          ),
        }}
      />
      {overlay}
    </AbsoluteFill>
  );
};

/** E: the split (rendered by `split`) pinned into the monitor while the camera pulls back to the desk. */
export const PullBack: React.FC<{f: number; split: (fr: number) => React.ReactNode}> = ({f, split}) => {
  const kb = kbPc(f);
  const r = deskScreenRect(f, kb);
  const s = r.h / 1080;
  const fade = prog(f, PULL + 22, 8, EASE.inOut);
  const flash = Math.exp(-(((f - (PULL + 25)) / 3) ** 2));
  const overlay =
    fade < 1 ? (
      <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, overflow: 'hidden', borderRadius: 4 * r.scale, opacity: 1 - fade}}>
        <div style={{position: 'absolute', left: r.w / 2 - 960 * s, top: 0, width: 1920, height: 1080, transform: `scale(${s})`, transformOrigin: '0 0'}}>{split(f)}</div>
      </div>
    ) : null;
  return (
    <DeskPc
      f={f}
      overlay={
        <>
          {overlay}
          {flash > 0.02 ? <div style={{position: 'absolute', left: r.x, top: r.y, width: r.w, height: r.h, background: rgba('#DDE8FF', 0.35 * flash), mixBlendMode: 'screen'}} /> : null}
        </>
      }
    />
  );
};
