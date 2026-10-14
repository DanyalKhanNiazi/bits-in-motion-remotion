/**
 * S9 tips 1–7 (P21): each a 3–6 s callback to an image the film already built, one must-read line at a time.
 */
import React from 'react';
import {
  Archive,
  ClockGlyph,
  CommandWindow,
  DESK,
  EASE,
  Footnote,
  KeyFixture,
  KineticText,
  PAL,
  PassportCard,
  Prop,
  QuoteStrip,
  REGIONS,
  RecycleBin,
  ScannerProp,
  ScreenSlot,
  SettingsToggle,
  Stage,
  VerdictChip,
  WinDesktop,
  WinFrame,
  archiveAnchors,
  archiveCam,
  clamp01,
  deskSlotScale,
  keyFixtureAnchors,
  lerp,
  poseAt,
  prog,
  propPoint,
  propRect,
  recycleBinPoint,
  rgba,
  scannerAnchors,
  springAt,
  SPRING,
  toScreen,
  type ArchiveEvent,
  type CamKey,
  type Content,
  type KenBurns,
  HITS,
  N_BOXES,
  PHOTO,
  boxC,
} from '../../kit';
import {CUT, T} from './t';
import {PalmGlyph, RewindArc, Safe, SHIP_BOX, ShipBox, ShipBoxDefs, TickStub, TipLine, Wash, WriteBlock, WriteDefs, washX} from './marks';

const LX = 110; // tip lines: left edge
const HEAD_Y = 116; // header chip row
const L1 = 214; // first line row
const L2 = 300; // second line row (the first has collapsed to a tick + stub above it)
const HEAD_SIZE = 64; // scope headers read at label size (caps ≈ 45 px), with the tip line one row lower
const L1H = L1 + 14; // the line row under a scope header

/* ================================================================ tip 1: the bin opens and rewinds */
const BIN = {x: 980, y: 610, w: 640};
export const Tip1: React.FC<{f: number}> = ({f}) => {
  const cam: CamKey[] = [
    {f: CUT.zt1, x: 1000, y: 580, zoom: 1.12},
    {f: CUT.wh2 + 12, x: 960, y: 540, zoom: 1.0},
  ];
  const pose = poseAt(f, cam);
  const win = recycleBinPoint(BIN, 'window');
  const ws = toScreen(pose, win.x, win.y);
  // the photo rises back out of the bin along the arc it fell in (rewind), and settles upright, lit
  const r0 = T.bin + 2;
  const u = prog(f, r0, 22, EASE.out);
  const px = lerp(win.x, 520, u);
  const py = lerp(win.y, 470, u) - Math.sin(Math.PI * u) * 120;
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: 960, floor: 820, warm: 0.45}}
      cam={cam}
      hud={
        <>
          <TipLine frame={f} at={T.recycle - 3} text="First: Recycle Bin and backups" x={LX} y={L1 - 30} exitAt={CUT.wh2 + 2} />
          <RewindArc frame={f} at={T.bin - 2} x={ws.x} y={ws.y + 10} r={190 * pose.zoom} dur={24} />
        </>
      }
    >
      <RecycleBin frame={f} {...BIN} holdsPhoto={0} restoreAt={T.bin} float={4} tiltY={-4} rim={{color: PAL.structure, strength: 0.4}} sweep={{every: 70, offset: 10}} shadow={0.6} screen />
      {f >= r0 ? (
        <PassportCard frame={f} variant="desk" x={px} y={py} w={lerp(150, 330, u)} rot={lerp(-20, -6, u)} tiltX={lerp(30, 8, u)} float={3 * u} shadow={false} rim={{color: PAL.ink, strength: 0.5}} sweep={{at: [r0 + 18], dur: 18}} />
      ) : null}
    </Stage>
  );
};

/* ================================================================ tip 2: stop using that drive · recover onto a different drive */
const SCAN = {x: 1690, y: 800, w: 560};
const TIP2_EVENTS: ArchiveEvent[] = [{at: T.recover + 16, op: 'copyOut', target: 'photo', dur: 40, to: scannerAnchors(SCAN).trayCard}];
const WRITES = [HITS.temporary, HITS.download, HITS.update];
export const Tip2: React.FC<{f: number}> = ({f}) => {
  const cam: CamKey[] = [
    {f: CUT.wh2, x: 1180, y: 455, zoom: 1.45},
    {f: T.stop + 30, x: 1170, y: 460, zoom: 1.52},
    {f: T.recover + 24, x: 1290, y: 470, zoom: 1.02, dur: 30},
    {f: T.land + 6, x: 1180, y: 440, zoom: 1.25, dur: 50},
    {f: CUT.wh3 + 12, x: 1170, y: 436, zoom: 1.3},
  ];
  const A = {frame: f, state: 'HDD_DELETED' as const, events: TIP2_EVENTS};
  const tray = scannerAnchors(SCAN).trayCard;
  const beamTarget = boxC(PHOTO[4]);
  const freeze = T.stop + 2;
  const ring = clamp01(1 - Math.abs(((f - (T.land - 4)) % 30) - 8) / 14) * (f >= T.land - 6 && f < CUT.wh3 ? 1 : 0);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={cam}
      motionBlur={0.45}
      shake={[{at: freeze, strength: 0.45}]}
      hud={
        <>
          {/* the swap lands on "recover" (the pop shows a word ~3 f after `at`) */}
          <TipLine frame={f} at={T.stop} text="Stop using that drive" x={LX} y={L1 - 30} collapseAt={T.recover - 8} exitAt={CUT.wh3 + 2} />
          <TipLine frame={f} at={T.recover - 4} text="Recover onto a different drive" x={LX} y={L2 - 46} exitAt={CUT.wh3 + 2} />
          <PalmGlyph frame={f} at={T.stop - 1} x={1660} y={770} size={200} exitAt={T.recover - 6} />
        </>
      }
    >
      <Archive {...A} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <WriteDefs />
        {WRITES.map((id, i) => {
          const c = boxC(id);
          return (
            <g key={id}>
              {ring > 0 ? <rect x={c.x - 38} y={c.y - 38} width={76} height={76} rx={8} fill="none" stroke={PAL.loss} strokeWidth={3} strokeDasharray="8 7" opacity={0.9 * ring} /> : null}
              <WriteBlock frame={f} at={CUT.wh2 + 2 + i * 5} x={c.x} y={c.y - 64} freezeAt={freeze} fall={300} seed={i} />
            </g>
          );
        })}
      </svg>
      <ScannerProp
        frame={f}
        {...SCAN}
        enter={{kind: 'rise', at: T.recover - 6, dur: 16}}
        float={2}
        sweep={{every: 90, offset: 30}}
        rim={{color: PAL.structure, strength: 0.4}}
        beam={{at: T.recover + 10}}
        beamTo={{x: beamTarget.x, y: beamTarget.y, rx: 150, ry: 60}}
        scan={{at: T.recover + 12, dur: 30, every: 44}}
        tray="photo"
        trayAt={T.recover + 30}
        fillDur={44}
      />
      {/* the tray is a separate unit: a soft halo marks the destination drive while it fills */}
      <div style={{position: 'absolute', left: tray.x - 160, top: tray.y - 140, width: 320, height: 280, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#DCE8FF', 0.12 * prog(f, T.recover + 30, 20))}, rgba(0,0,0,0))`}} />
    </Stage>
  );
};

/* ================================================================ tip 3: an SSD with TRIM: the boxes already swept */
export const Tip3: React.FC<{f: number}> = ({f}) => {
  const pb = archiveCam('photoBoxes');
  const cam: CamKey[] = [
    {f: CUT.wh3, ...pb, zoom: pb.zoom * 0.94},
    {f: CUT.wh4 + 12, ...pb, x: pb.x + 20, zoom: pb.zoom * 1.06},
  ];
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={cam}
      motionBlur={0.45}
      hud={
        <>
          <VerdictChip frame={f} at={T.onSsd + 10} text="SSD with TRIM" tone="neutral" x={LX} y={HEAD_Y} align="left" exitAt={CUT.wh4 + 2} size={HEAD_SIZE} />
          <TipLine frame={f} at={T.prepared} text="Be prepared for it to be gone" x={LX} y={L1H} size={62} exitAt={CUT.wh4 + 2} />
          <ClockGlyph frame={f} x={1760} y={170} size={110} at={T.onSsd + 6} exitAt={CUT.wh4} />
          <Footnote frame={f} at={T.onSsd + 12} exitAt={CUT.wh4} text="Illustrative timing" />
        </>
      }
    >
      <Archive frame={f} state="SSD_TRIMMED" events={[{at: T.onSsd + 8, op: 'sweep', target: 'photo', dur: 40}]} />
    </Stage>
  );
};

/* ================================================================ tip 4: hard drive, gone for good: cipher /w */
export const Tip4: React.FC<{f: number}> = ({f}) => {
  const wall = archiveCam('wall');
  const cam: CamKey[] = [
    {f: CUT.zt4, ...wall, zoom: wall.zoom * 0.84},
    {f: T.does, ...wall, x: wall.x - 20, zoom: wall.zoom * 0.9},
    {f: CUT.wh5 + 12, ...wall, zoom: wall.zoom * 1.0, dur: 50},
  ];
  const events: ArchiveEvent[] = [
    {at: T.freeSpace, op: 'mapFlip', target: 'free', dur: 24},
    {at: T.does + 2, op: 'overwrite', target: 'free', dur: 40},
  ];
  const clear = T.before - 22; // every item-4 string is gone before item 5 starts
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={cam}
      motionBlur={0.45}
      shake={[{at: T.slash, strength: 0.4}]}
      hud={
        <>
          <VerdictChip frame={f} at={T.hardDrive} text="Hard drive: gone for good" tone="neutral" x={LX} y={HEAD_Y} align="left" exitAt={clear} size={HEAD_SIZE} />
          <CommandWindow
            frame={f}
            x={LX - 10}
            y={190}
            w={980}
            h={200}
            fontSize={46}
            enterAt={T.cipher - 16}
            typeAt={T.cipher}
            rate={0.3}
            highlight="/w"
            highlightAt={T.slash}
            exitAt={T.does - 2}
            scale={1}
          />
          <VerdictChip frame={f} at={T.slash} text="cipher /w" tone="neutral" x={LX + 980 - 10} y={430} align="right" exitAt={T.does} size={52} />
          <Footnote frame={f} at={T.cipher + 12} exitAt={clear} text="Use the hard drive's letter" />
        </>
      }
    >
      <Archive frame={f} state="HDD_DELETED" events={events} />
    </Stage>
  );
};

/* ================================================================ tip 5: selling or giving away a PC */
const KB5: KenBurns = {from: {...DESK.kbMonitor}, to: {...DESK.kbMonitor, s: 1.68, y: 196}, start: CUT.wh5, end: CUT.zt5 + 16};
export const Tip5Desk: React.FC<{f: number}> = ({f}) => {
  const k = deskSlotScale(f, KB5);
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb: KB5,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <WinDesktop frame={f} w={DESK.slotW} h={DESK.slotH}>
              <div style={{position: 'absolute', left: 196, top: 196, width: 640, height: 210}}>
                <WinFrame w={640} h={210} s={0.9} title={<span>Settings</span>}>
                  <SettingsToggle frame={f} x={320} y={78} w={590} size={30} title="Clean data" icon="reset" state="off" scale={k} />
                </WinFrame>
              </div>
            </WinDesktop>
          </ScreenSlot>
        ),
      }}
      hud={<KineticText frame={f} at={T.sell - 3} text="Selling or giving away a PC" x={960} y={170} size={84} mode="pop" exitAt={CUT.zt5 - 10} />}
    />
  );
};

const WASH = {at: T.turnedOn + 12, dur: 52, x0: 70, x1: 1880, y0: 190, y1: 920};
const WIN5 = {x: 110, y: 70, w: 660, h: 210};
export const Tip5Wall: React.FC<{f: number}> = ({f}) => {
  const cam: CamKey[] = [
    {f: CUT.zt5, x: 960, y: 450, zoom: 1.0},
    {f: CUT.wh6 + 12, x: 1000, y: 470, zoom: 1.07},
  ];
  // behind the wash front the files are gone (boxes empty, the card and its threads cleared)
  const wx = washX(f, WASH.at, WASH.dur, WASH.x0, WASH.x1);
  const boxes: Record<number, Content> = {};
  if (f >= WASH.at) for (let id = 1; id <= N_BOXES; id++) if (boxC(id).x < wx) boxes[id] = 'empty';
  const cardGone = clamp01((wx - 300) / 160);
  const toggleAt = T.turnedOn + 8;
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={cam}
      motionBlur={0.45}
      hud={
        <>
          <div style={{position: 'absolute', left: WIN5.x, top: WIN5.y, width: WIN5.w, height: WIN5.h, transform: `scale(${0.96 + 0.04 * clamp01(springAt(f, CUT.zt5 + 6, SPRING.snap))})`, transformOrigin: '0 0'}}>
            <WinFrame w={WIN5.w} h={WIN5.h} s={0.9} title={<span>Settings</span>}>
              <SettingsToggle frame={f} x={WIN5.w / 2} y={78} w={WIN5.w - 50} size={44} title="Clean data" icon="reset" state="off" flipAt={toggleAt} flipTo="on" scale={1} />
            </WinFrame>
          </div>
          <TickStub frame={f} at={T.isnt + 2} x={96} y={890} len={200} exitAt={CUT.wh6 + 2} />
          <VerdictChip frame={f} at={T.isnt + 2} text="Not built to government erasure standards" tone="neutral" x={WIN5.x} y={WIN5.y + WIN5.h + 64} align="left" exitAt={CUT.wh6 + 2} size={46} />
        </>
      }
    >
      <Archive frame={f} state="HDD_SAVED" boxes={boxes} show={{card: 1 - cardGone, threads: 1 - clamp01((wx - 260) / 120)}} />
      <Wash frame={f} {...WASH} />
    </Stage>
  );
};

/**
 * "Microsoft recommends …": one strip from the word "Microsoft" (on the desk shot) through the zoom-through into the
 * wall, so S9.tsx draws it over both shots (screen space) instead of inside either Stage.
 */
export const MicrosoftStrip: React.FC<{f: number}> = ({f}) =>
  f >= T.microsoft - 1 && f < T.isnt + 8 ? <QuoteStrip frame={f} at={T.microsoft} exitAt={T.isnt - 4} source="Microsoft recommends" reported="Reset this PC · Clean data on" /> : null;

/* ================================================================ tip 6: a whole SSD, before it leaves your hands */
const SSD = {x: 900, y: 600, w: 1000};
const SSD_H = propRect('ssd-board_a', SSD).h;
/**
 * The hand-off (under the sanitize pulse): a shipping box rises in at the lower right; once sealed, the board arcs into
 * it shrinking, the flaps fold shut, a tape strip runs along the seam and the box slides out of frame right before the
 * whip to item 7. The board never leaves the box once it is in.
 */
const H6 = {boxIn: T.use + 16, go: T.tool - 9, goDur: 12, drop: 6, close: T.tool + 4, closeDur: 6, tape: T.tool + 9, out: T.tool + 11, outDur: 12};
/** the box leaves on a quadratic ease-in: fully out of frame before the whip to item 7 */
const boxDx = (f: number) => 1400 * prog(f, H6.out, H6.outDur) ** 2;
const boxDy = (f: number) => 320 * (1 - prog(f, H6.boxIn, 16, EASE.outExpo));
export const Tip6: React.FC<{f: number}> = ({f}) => {
  const cam: CamKey[] = [
    {f: CUT.wh6, x: 940, y: 560, zoom: 1.08},
    {f: CUT.wh7 + 12, x: 980, y: 540, zoom: 1.0},
  ];
  const ctl = propPoint('ssd-board_a', SSD, 380, 800);
  const p0 = T.sanitize - 2;
  const sealed = prog(f, p0 + 6, 10);
  const rings = [0, 7, 14].map((d, i) => {
    const u = prog(f, p0 + d, 26, EASE.out);
    if (u <= 0 || u >= 1) return null;
    const r = 60 + 900 * u;
    return <ellipse key={i} cx={ctl.x} cy={ctl.y} rx={r} ry={r * 0.42} fill="none" stroke={PAL.drive} strokeWidth={10 * (1 - u) + 2} opacity={0.85 * (1 - u)} transform={`rotate(-24 ${ctl.x} ${ctl.y})`} />;
  });
  // the board into the box: arc + shrink to the mouth, then a short drop inside (the box's front face covers it)
  const mouth = {x: (SHIP_BOX.x0 + SHIP_BOX.x1) / 2, y: SHIP_BOX.y0 - SHIP_BOX.depth / 2};
  const g = prog(f, H6.go, H6.goDur, EASE.inOut);
  const sink = prog(f, H6.go + H6.goDur - 2, H6.drop, EASE.inCubic);
  const bx = lerp(SSD.x, mouth.x, g) + boxDx(f) * (g > 0 ? 1 : 0);
  const bs = lerp(1, 0.3, g);
  // Prop scales about the bottom of its visible content: lift the centre back by half the height lost
  const by = lerp(SSD.y, mouth.y - 40, g) - Math.sin(Math.PI * g) * 140 + 110 * sink + boxDy(f) - (SSD_H / 2) * (1 - bs);
  const close = prog(f, H6.close, H6.closeDur);
  const tape = prog(f, H6.tape, 6, EASE.out);
  const showBox = f >= H6.boxIn - 1;
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: 960, floor: 800, warm: 0.5}}
      cam={cam}
      hud={
        <>
          <VerdictChip frame={f} at={T.beforeHands} text="Before it leaves your hands" tone="neutral" x={LX} y={HEAD_Y} align="left" exitAt={CUT.wh7 + 2} size={HEAD_SIZE} />
          <TipLine frame={f} at={T.use} text="Whole SSD: drive maker's sanitize tool" x={LX} y={L1H} size={72} exitAt={CUT.wh7 + 2} />
        </>
      }
    >
      <div style={{position: 'absolute', left: ctl.x - 600, top: ctl.y - 300, width: 1200, height: 600, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba(PAL.drive, 0.3 * prog(f, p0, 10) * (1 - prog(f, p0 + 30, 20)))}, rgba(0,0,0,0))`}} />
      {showBox ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <ShipBoxDefs />
          <g transform={`translate(${boxDx(f)} ${boxDy(f)})`}>
            <ShipBox part="back" close={close} tape={tape} />
          </g>
        </svg>
      ) : null}
      <Prop
        frame={f}
        src="ssd-board_a"
        {...SSD}
        tiltX={6}
        float={3 * (1 - g)}
        shadow={g > 0 ? false : 0.6}
        rim={{color: sealed > 0 ? PAL.drive : PAL.structure, strength: 0.4 + 0.5 * sealed}}
        sweep={{at: [CUT.wh6 + 18, p0 + 4], dur: 22, color: f > p0 - 4 ? PAL.drive : undefined}}
        enter={{kind: 'rise', at: CUT.wh6, dur: 18}}
        nudge={{dx: bx - SSD.x, dy: by - SSD.y, s: bs}}
      />
      {showBox ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <ShipBoxDefs />
          <g transform={`translate(${boxDx(f)} ${boxDy(f)})`}>
            <ShipBox part="front" close={close} tape={tape} />
          </g>
        </svg>
      ) : null}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {rings}
      </svg>
    </Stage>
  );
};

/* ================================================================ tip 7: encryption from day one; the recovery key in a safe */
const KEY = {x: 690, y: 610, w: 820};
const SAFE = {x: 1490, y: 600, w: 380};
export const Tip7: React.FC<{f: number}> = ({f}) => {
  const cam: CamKey[] = [
    {f: CUT.wh7, x: 900, y: 560, zoom: 1.08},
    {f: CUT.p22 + 4, x: 1000, y: 540, zoom: 1.0},
  ];
  const slotAt = T.encryption - 6;
  const ka = keyFixtureAnchors(KEY);
  // the slotted key's centre ≈ halfway from the slot (blade tip) toward the bow, shifted as slotted
  const kc = {x: ka.slot.x + (ka.keyBow.x - ka.keyTip.x) * 0.5, y: ka.slot.y + (ka.keyBow.y - ka.keyTip.y) * 0.5};
  const c0 = T.recoveryKey - 6;
  const mv = prog(f, c0 + 6, 30, EASE.inOut);
  const appear = prog(f, c0, 8, EASE.out);
  const dx = (SAFE.x - kc.x) * mv;
  const dy = (SAFE.y - 10 - kc.y) * mv - Math.sin(Math.PI * mv) * 120;
  const s = lerp(1, 0.42, mv);
  const inside = f >= T.safe - 8 + 4;
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: 1000, floor: 820, warm: 0.4}}
      cam={cam}
      shake={[{at: T.safe + 1, strength: 0.35}]}
      hud={
        <>
          <TipLine frame={f} at={T.encryption} text="Encryption on from day one" x={LX} y={L1 - 30} collapseAt={T.recoveryKey - 4} exitAt={CUT.p22 - 4} />
          <TipLine frame={f} at={T.recoveryKey} text="Recovery key saved somewhere safe" x={LX} y={L2 - 46} exitAt={CUT.p22 - 4} />
        </>
      }
    >
      <KeyFixture frame={f} {...KEY} float={3} sweep={{every: 90, offset: 12}} glow={0.6} slotAt={slotAt} enter={{kind: 'rise', at: CUT.wh7, dur: 16}} />
      <Safe frame={f} x={SAFE.x} y={SAFE.y} w={SAFE.w} enterAt={CUT.wh7 + 8} closeAt={T.safe - 8} />
      {f >= c0 && !inside ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${kc.x}px ${kc.y}px`, transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: appear, filter: `brightness(${1.35}) drop-shadow(0 0 14px ${rgba('#FFFFFF', 0.55)})`}}>
          <KeyFixture frame={f} {...KEY} part="key" slotAt={slotAt} glow={0.4} />
        </div>
      ) : null}
    </Stage>
  );
};
