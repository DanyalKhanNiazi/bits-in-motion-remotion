// S2 · P03: the reader's screen (desk plate + dark Windows UI) and the bin on the hardware stage.
import React from 'react';
import {
  AtlasOpener,
  BitHead,
  Cursor,
  DESK,
  ExplorerWindow,
  KeyCap,
  KineticText,
  PAL,
  REGIONS,
  RecycleBin,
  ScreenSlot,
  Stage,
  UI_REGIONS,
  WinDesktop,
  binFlyTo,
  deskSlotScale,
  explorerFlight,
  plateToStage,
  poseAt,
  prog,
  propPoint,
  toScreen,
  track,
  EASE,
  type CamKey,
  type ExplorerProps,
  type KenBurns,
  type RecycleBinProps,
} from '../../kit';
import {CardBits} from './fx';
import {K, T} from './t';

/* ---------------------------------------------------------------- the desk camera: slot point at the frame centre + plate scale */
type DK = {f: number; s: number; cx: number; cy: number; ease?: (t: number) => number; dur?: number};
// S1's exit push reaches DESK.kbScreen at the cut and keeps going at +0.04 per second (screen centred: slot 516, 273.5)
const RATE = 0.04 / 30;
const LIN = T.from + 40;
const DKEYS: DK[] = [
  {f: LIN, s: 1.72 + RATE * 40, cx: 516, cy: 273.5},
  {f: T.del, s: 1.8, cx: 508, cy: 272, ease: EASE.out},
  // "doesn't remove anything": lean in on the row that is still there
  {f: T.remove + 20, s: 1.9, cx: 470, cy: 262, dur: 50, ease: EASE.inOut},
  // "moves the photo into the recycle bin": follow the slide to the bin
  {f: K.landed, s: 2.06, cx: 690, cy: 296, dur: K.fly1 + 4, ease: EASE.inOut},
  {f: K.zt1 + 16, s: 2.42, cx: 700, cy: 300, ease: EASE.inExpo},
  // back from the stage, inside the rewind glitch
  {f: K.rwCut, s: 2.02, cx: 640, cy: 286},
  {f: K.restoreAct + 22, s: 1.86, cx: 540, cy: 276, ease: EASE.inOut},
  {f: T.real, s: 1.85, cx: 536, cy: 276},
  {f: K.zt5 + 16, s: 2.5, cx: 700, cy: 300, dur: 30, ease: EASE.inExpo},
  // the whip lands on the folder (the file still in its row)
  {f: K.whip, s: 1.9, cx: 530, cy: 278},
  {f: T.shift + 10, s: 1.86, cx: 536, cy: 276, ease: EASE.inOut},
  {f: K.shiftDelAct + 12, s: 1.92, cx: 520, cy: 272},
  {f: T.p4 + 40, s: 1.06, cx: 516, cy: 372, dur: 46, ease: EASE.inOut},
  {f: K.opener + 54, s: 1.1, cx: 516, cy: 360},
  {f: K.zt2 + 16, s: 2.7, cx: 330, cy: 232, dur: 52, ease: EASE.inExpo},
];
const deskAt = (f: number): {s: number; cx: number; cy: number} => {
  if (f <= LIN) return {s: 1.72 + RATE * (f - T.from), cx: 516, cy: 273.5};
  for (let i = 1; i < DKEYS.length; i++) {
    const b = DKEYS[i];
    if (f < b.f) {
      const a = DKEYS[i - 1];
      const t0 = Math.max(a.f, b.f - (b.dur ?? b.f - a.f));
      const u = (b.ease ?? EASE.cam)(Math.max(0, Math.min(1, (f - t0) / Math.max(1, b.f - t0))));
      return {s: Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * u), cx: a.cx + (b.cx - a.cx) * u, cy: a.cy + (b.cy - a.cy) * u};
    }
  }
  return DKEYS[DKEYS.length - 1];
};
/** drift fades in after the cut (S1 runs the desk with drift 0) */
const driftAt = (f: number) => Math.max(0, Math.min(1, (f - T.from) / 45));
const COVER = 1.1483;
/** the Ken Burns that puts slot point (cx, cy) at the frame centre at plate scale s (a constant kb: full control here) */
export const deskKb = (f: number): KenBurns => {
  const d = deskAt(f);
  const S = COVER * d.s;
  const v = {s: d.s, x: (516 - d.cx) * S, y: (372.5 - d.cy) * S};
  return {from: v, to: v, start: 0, end: 1};
};
/** slot px → screen px at a frame (desk Stage with default drift) */
export const slotToScreen = (f: number, sx: number, sy: number): {x: number; y: number} => {
  const p = plateToStage(f, deskKb(f), DESK.screen[0][0] + sx, DESK.screen[0][1] + sy);
  return toScreen(poseAt(f, undefined, driftAt(f)), p.x, p.y);
};

/* ---------------------------------------------------------------- the screen's contents (slot px, 1032 × 547) */
// S1's layout (the handoff at the cut): Explorer left, the bin right
export const BIN = {x: 872, y: 300, w: 236};
const EX_BASE = {x: 34, y: 30, w: 640, h: 452, fontSize: 36};
/** the file row's top edge in slot px (ExplorerWindow geometry at fontSize 36: title 50 + address 78 + 16) */
const ROW_Y = EX_BASE.y + 50 + 78 + 16;
const explorer = (f: number, scale: number): ExplorerProps => ({
  frame: f,
  ...EX_BASE,
  selectAt: T.from - 40,
  // the first delete is the slow slide ("moves … into the recycle bin"); later flights are quick
  flyDur: f < K.restoreAct ? K.fly1 : f >= K.del3Act && f < K.whip ? K.fly3 : K.flyDur,
  flyTo: binFlyTo(BIN, 62),
  // after the whip ("or skip it") the screen is the other path: the file was restored and is still in its row
  actions:
    f < K.whip
      ? [
          {at: K.delAct, kind: 'delete'},
          {at: K.restoreAct, kind: 'restore'},
          {at: K.del3Act, kind: 'delete'},
        ]
      : [
          {at: K.delAct, kind: 'delete'},
          {at: K.restoreAct, kind: 'restore'},
          {at: K.shiftDelAct, kind: 'shiftDelete'},
        ],
  scale,
});
/** the bin's photo life: first stay (restored by the rewind), the second stay (hover), then empty (the Shift + Delete path) */
const binCfg = (f: number): Partial<RecycleBinProps> =>
  f < T.real - 6 ? {holdsPhoto: K.landed, restoreAt: K.restoreAct} : f < K.whip ? {holdsPhoto: K.landed3} : {};
const binLit = (f: number): {lit: number; wave: number} => {
  const c = binCfg(f);
  const h = c.holdsPhoto ?? 1e9;
  const r = c.restoreAt ?? 1e9;
  return {lit: prog(f, h, 6) * (1 - prog(f, r, 5)), wave: h};
};
const binQuad = (p: {x: number; y: number; w: number}) => {
  const q = UI_REGIONS.binWindow;
  const pt = (i: number) => propPoint('recycle-folder_a', p, q[i][0], q[i][1]);
  return {tl: pt(0), tr: pt(1), bl: pt(3)};
};

const ScreenContents: React.FC<{f: number; scale: number}> = ({f, scale}) => {
  const ex = explorer(f, scale);
  const trail = [3, 6, 9, 12].map((d) => explorerFlight(ex, f - d));
  // "doesn't remove anything": the row (still listed, still selected) pulses once on "remove"
  const pulse = f >= T.remove - 2 && f < K.delAct ? Math.exp(-(f - (T.remove - 2)) / 9) * prog(f, T.remove - 2, 3) : 0;
  const now = explorerFlight(ex, f);
  const bl = binLit(f);
  const q = binQuad(BIN);
  return (
    <WinDesktop frame={f} w={1032} h={547}>
      <RecycleBin frame={f} {...BIN} float={0} shadow={0.6} {...binCfg(f)} screen={scale} />
      <CardBits frame={f} {...q} n={4} lit={bl.lit} waveAt={bl.wave} waveDur={10} inset={0.16} />
      <ExplorerWindow {...ex} />
      <svg width={1032} height={547} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {pulse > 0.01 ? (
          <rect x={EX_BASE.x + 6 - 6 * pulse} y={ROW_Y - 6 * pulse} width={EX_BASE.w - 12 + 12 * pulse} height={84 + 12 * pulse} rx={10} fill={`rgba(255,255,255,${(0.06 * pulse).toFixed(3)})`} stroke={`rgba(255,255,255,${(0.75 * pulse).toFixed(3)})`} strokeWidth={2.5} />
        ) : null}
        {trail.map((p, i) =>
          p && now ? <BitHead key={i} gid={`s2tr${i}`} x={p.x} y={p.y + 8} size={9 - i * 1.3} color={PAL.photo} glow={0.5} opacity={0.95 - i * 0.18} /> : null,
        )}
      </svg>
      <Cursor
        frame={f}
        at={T.from - 30}
        exitAt={T.pressing + 4}
        size={34}
        keys={[
          {f: T.from - 30, x: 336, y: 236},
          {f: T.click - 6, x: 304, y: 221},
          {f: T.click, x: 300, y: 218, click: true},
          {f: T.pressing, x: 330, y: 300},
        ]}
      />
    </WinDesktop>
  );
};

export const deskShot = (f: number): React.ReactElement => {
  const kb = deskKb(f);
  const scale = deskSlotScale(f, kb);
  return (
    <Stage
      frame={f}
      drift={driftAt(f)}
      env={{kind: 'photo', plate: 'reader-desk', kb, children: <ScreenSlot rect={REGIONS.deskScreen}><ScreenContents f={f} scale={scale} /></ScreenSlot>}}
      hud={
        <>
          <KineticText frame={f} at={T.own - 2} exitAt={T.moves} text="On your PC's own drive" x={112} y={866} align="left" size={64} mode="pop" stagger={0} backing="plate" />
          <KeyCap frame={f} keys={['Delete']} x={1584} y={834} at={T.pressing} pressAt={T.del} exitAt={T.del + 40} />
          <KeyCap frame={f} keys={['Delete']} x={1584} y={834} at={K.del3Press - 9} pressAt={K.del3Press} exitAt={K.del3Press + 30} />
          <KeyCap frame={f} keys={['Shift', 'Delete']} x={1440} y={834} at={T.skip + 16} pressAt={T.shift} stagger={T.del2 - T.shift} hold={8} exitAt={T.del2 + 32} />
          <AtlasOpener frame={f} at={K.opener} word="The picture" sub="boxes and cards" />
        </>
      }
    />
  );
};

/** the bin's screen point at a frame (for the ZoomThrough into it) */
export const binScreen = (f: number) => {
  const c = binFlyTo(BIN, 62);
  return slotToScreen(f, c.x, c.y);
};

/* ---------------------------------------------------------------- B: the bin on the hardware stage */
const BIN_STAGE = {x: 960, y: 600, w: 680};
const winC = (() => {
  const q = UI_REGIONS.binWindow;
  return propPoint('recycle-folder_a', BIN_STAGE, (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4);
})();
const B_CAM: CamKey[] = [
  {f: K.zt1, x: winC.x + 10, y: winC.y + 30, zoom: 1.55},
  {f: T.holding + 26, x: 950, y: 560, zoom: 1.03, dur: 30},
  {f: T.every + 4, x: 942, y: 550, zoom: 1.05},
  {f: T.intact + 10, x: winC.x + 40, y: winC.y + 60, zoom: 1.28, dur: 28},
  {f: K.rwCut + 6, x: winC.x + 30, y: winC.y + 40, zoom: 1.36},
];
// the second stay: the photo drops in, the "Empty Recycle Bin" menu, the cursor hovering (held breath)
const B2_CAM: CamKey[] = [
  {f: K.zt5, x: winC.x + 20, y: winC.y + 40, zoom: 1.4},
  {f: K.emptyHover + 4, x: 1090, y: 560, zoom: 1.06, dur: 22},
  {f: K.whip + 6, x: 1060, y: 548, zoom: 1.14, ease: 'linear'},
];
export const binShot = (f: number): React.ReactElement => {
  const q = binQuad(BIN_STAGE);
  const second = f >= K.zt5;
  const hold = second ? K.zt5 - 24 : 0; // the second stay: the photo is already in (it landed on the screen)
  const rest = second ? undefined : K.rw1 + 1;
  const off = rest === undefined ? 1 : 1 - prog(f, rest, 6);
  const lit = second
    ? prog(f, hold, 6) * off
    : off * (0.7 + 0.3 * track(f, [[T.every - 1, 0], [T.every + 10, 1], [T.intact + 30, 0.4]]));
  return (
    <Stage frame={f} env={{kind: 'stage', spot: 900, floor: 830, warm: 0.35}} cam={second ? B2_CAM : B_CAM}>
      <RecycleBin
        frame={f}
        {...BIN_STAGE}
        holdsPhoto={hold}
        restoreAt={rest}
        emptyHoverAt={second ? K.emptyHover : undefined}
        screen
        float={0}
        rim={{color: PAL.structure, strength: 0.5}}
        sweep={{at: second ? [K.emptyHover + 14] : [T.holding], dur: 26, strength: 0.6}}
        shadow={{opacity: 0.65}}
      />
      <CardBits frame={f} {...q} n={6} lit={lit} waveAt={second ? K.zt5 + 8 : T.every} waveDur={second ? 10 : 16} pulseAt={second ? undefined : T.intact} />
    </Stage>
  );
};
