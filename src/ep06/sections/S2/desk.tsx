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
const DKEYS: DK[] = [
  {f: T.from - 30, s: 1.66, cx: 516, cy: 274},
  {f: T.from, s: 1.72, cx: 516, cy: 274},
  {f: T.from + 60, s: 1.78, cx: 500, cy: 268, ease: EASE.out},
  {f: T.del, s: 1.8, cx: 494, cy: 266},
  {f: T.remove + 24, s: 2.2, cx: 600, cy: 290, dur: 52, ease: EASE.inOut},
  {f: K.zt1 + 16, s: 2.42, cx: 640, cy: 296, ease: EASE.inExpo},
  // back from the stage, inside the rewind glitch
  {f: K.rwCut, s: 2.02, cx: 590, cy: 284},
  {f: K.restoreAct + 22, s: 1.88, cx: 540, cy: 276, ease: EASE.inOut},
  {f: T.real, s: 1.86, cx: 534, cy: 276},
  {f: K.emptyHover + 2, s: 2.0, cx: 612, cy: 300, dur: 30, ease: EASE.inOut},
  {f: T.skip, s: 2.1, cx: 616, cy: 298},
  {f: T.skip + 20, s: 1.86, cx: 530, cy: 276, ease: EASE.inOut},
  {f: K.shiftDelAct + 12, s: 1.92, cx: 506, cy: 270},
  {f: T.p4 + 40, s: 1.06, cx: 516, cy: 372, dur: 46, ease: EASE.inOut},
  {f: K.opener + 54, s: 1.1, cx: 516, cy: 360},
  {f: K.zt2 + 16, s: 2.7, cx: 330, cy: 232, dur: 52, ease: EASE.inExpo},
];
const deskAt = (f: number): {s: number; cx: number; cy: number} => {
  if (f <= DKEYS[0].f) return DKEYS[0];
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
  return toScreen(poseAt(f), p.x, p.y);
};

/* ---------------------------------------------------------------- the screen's contents (slot px, 1032 × 547) */
export const BIN = {x: 712, y: 300, w: 200};
const EX_BASE = {x: 30, y: 30, w: 520, h: 440, fontSize: 36};
const explorer = (f: number, scale: number): ExplorerProps => ({
  frame: f,
  ...EX_BASE,
  selectAt: T.from - 40,
  flyDur: K.flyDur,
  flyTo: binFlyTo(BIN, 62),
  actions: [
    {at: K.delAct, kind: 'delete'},
    {at: K.restoreAct, kind: 'restore'},
    {at: K.del3Act, kind: 'delete'},
    {at: K.restore2Act, kind: 'restore'},
    {at: K.shiftDelAct, kind: 'shiftDelete'},
  ],
  scale,
});
/** the bin's photo life: first stay (restored by the rewind), then the second stay (hover, rewound again) */
const binCfg = (f: number): Partial<RecycleBinProps> =>
  f < T.real - 6
    ? {holdsPhoto: K.landed, restoreAt: K.restoreAct}
    : {holdsPhoto: K.landed3, restoreAt: K.restore2Act, emptyHoverAt: K.emptyHover, emptyUntil: K.restore2Act};
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
  const now = explorerFlight(ex, f);
  const bl = binLit(f);
  const q = binQuad(BIN);
  return (
    <WinDesktop frame={f} w={1032} h={547}>
      <RecycleBin frame={f} {...BIN} float={0} shadow={0.6} {...binCfg(f)} menuSize={42} screen={scale} />
      <CardBits frame={f} {...q} n={4} lit={bl.lit} waveAt={bl.wave} waveDur={10} inset={0.16} />
      <ExplorerWindow {...ex} />
      <svg width={1032} height={547} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {trail.map((p, i) =>
          p && now ? <BitHead key={i} gid={`s2tr${i}`} x={p.x + 6} y={p.y + 30} size={9 - i * 1.3} color={PAL.photo} glow={0.5} opacity={0.95 - i * 0.18} /> : null,
        )}
      </svg>
      <Cursor
        frame={f}
        at={T.from - 30}
        exitAt={T.pressing + 4}
        size={34}
        keys={[
          {f: T.from - 20, x: 470, y: 430},
          {f: T.click - 5, x: 300, y: 226},
          {f: T.click, x: 298, y: 222, click: true},
          {f: T.pressing, x: 320, y: 300},
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
      env={{kind: 'photo', plate: 'reader-desk', kb, children: <ScreenSlot rect={REGIONS.deskScreen}><ScreenContents f={f} scale={scale} /></ScreenSlot>}}
      hud={
        <>
          <KineticText frame={f} at={T.own} exitAt={K.zt1 - 14} text="On your PC's own drive" x={112} y={866} align="left" size={64} mode="rise" backing="plate" />
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
  {f: T.recycleBin, x: winC.x + 20, y: winC.y + 40, zoom: 1.46},
  {f: T.holding + 8, x: 950, y: 560, zoom: 1.02, dur: 36},
  {f: T.every - 2, x: 940, y: 548, zoom: 1.05},
  {f: T.intact + 10, x: winC.x + 40, y: winC.y + 60, zoom: 1.28, dur: 32},
  {f: K.rwCut + 6, x: winC.x + 30, y: winC.y + 40, zoom: 1.36},
];
export const binShot = (f: number): React.ReactElement => {
  const q = binQuad(BIN_STAGE);
  const lit = 0.7 * (1 - prog(f, K.rw1 + 1, 6));
  return (
    <Stage frame={f} env={{kind: 'stage', spot: 900, floor: 830, warm: 0.35}} cam={B_CAM}>
      <RecycleBin
        frame={f}
        {...BIN_STAGE}
        holdsPhoto={0}
        restoreAt={K.rw1 + 1}
        float={0}
        rim={{color: PAL.structure, strength: 0.5}}
        sweep={{at: [T.holding], dur: 26, strength: 0.6}}
        shadow={{opacity: 0.65}}
      />
      <CardBits frame={f} {...q} n={6} lit={lit + 0.3 * track(f, [[T.every - 1, 0], [T.every + 10, 1], [T.intact + 30, 0.4]])} waveAt={T.every} waveDur={16} pulseAt={T.intact} />
    </Stage>
  );
};
