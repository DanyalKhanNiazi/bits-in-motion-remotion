/**
 * Ep06 UI kit demo (KitUI, 30 s): short realistic shots that use every UI/props component (docs/ep06/KIT_UI.md).
 *   export REMOTION_GL=angle
 *   flock -w 480 /tmp/ep06-render.lock node tools/stills.mjs src/entries/ep06kitui.tsx KitUI out/ep06/kitui/r1 40,130 --concurrency 3
 */
import React from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {
  binFlyTo,
  ClockGlyph,
  CommandWindow,
  DESK,
  ExplorerWindow,
  explorerFlight,
  FictionalNote,
  Footnote,
  KeyCap,
  KeyFixture,
  Label,
  PAL,
  PassportCard,
  PhotoViewer,
  QuoteStrip,
  RecycleBin,
  REGIONS,
  ScannerProp,
  ScrambleField,
  ScreenSlot,
  SettingsToggle,
  Stage,
  TrimNote,
  VerdictCard,
  VerdictChip,
  WinDesktop,
  WinFrame,
  WriteTally,
  deskSlotScale,
  rgba,
  type ExplorerProps,
  type KenBurns,
} from '../ep06/kit';

const DUR = 900;

/* ---------------------------------------------------------------- shot 1: the desk, the photo open */
const Shot1: React.FC<{f: number}> = ({f}) => {
  const kb: KenBurns = {from: {s: 1.04, x: 0, y: 0}, to: {s: 1.3, x: 0, y: 70}, start: 0, end: 90};
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb,
        children: (
          <>
            <PassportCard frame={f} variant="desk" x={1190} y={748} w={220} rot={-12} tiltX={44} float={0} shadow={{opacity: 0.6, dy: -10}} sweep={{every: 120, offset: 30}} />
            <ScreenSlot rect={REGIONS.deskScreen}>
              <WinDesktop frame={f} w={1032} h={547}>
                <PhotoViewer frame={f} x={190} y={34} w={652} h={440} openAt={6} exitAt={66} />
              </WinDesktop>
            </ScreenSlot>
          </>
        ),
      }}
      hud={
        <>
          <FictionalNote frame={f} at={8} />
          <KeyCap frame={f} keys={['Delete']} x={1560} y={850} at={44} pressAt={60} exitAt={84} />
        </>
      }
    />
  );
};

/* ---------------------------------------------------------------- shots 2–3: Explorer, bin, restore, Shift + Delete */
const BIN = {x: 872, y: 300, w: 236};
const explorer = (f: number, shift: boolean): ExplorerProps => ({
  frame: f,
  x: 34,
  y: 30,
  w: 640,
  h: 452,
  selectAt: shift ? 0 : 100,
  actions: shift ? [{at: 238, kind: 'shiftDelete'}] : [{at: 122, kind: 'delete'}, {at: 172, kind: 'restore'}],
  flyTo: binFlyTo(BIN, 62),
  cursor: shift
    ? [{f: 210, x: 560, y: 330}, {f: 226, x: 440, y: 226}]
    : [
        {f: 90, x: 600, y: 440},
        {f: 99, x: 430, y: 222, click: true},
        {f: 160, x: 450, y: 240},
      ],
});

const ScreenShot: React.FC<{f: number; shift: boolean}> = ({f, shift}) => {
  const kb: KenBurns = shift ? {from: {...DESK.kbScreen, s: 1.66}, to: {...DESK.kbScreen, s: 1.74}, start: 210, end: 300} : {from: DESK.kbMonitor, to: {...DESK.kbMonitor, s: 1.62}, start: 90, end: 210};
  const k = deskSlotScale(f, kb);
  const ex = explorer(f, shift);
  // the flight hook: the photo's Bits ride along with the file
  const trail = [2, 5, 8, 11].map((d) => explorerFlight(ex, f - d)).filter(Boolean) as Array<NonNullable<ReturnType<typeof explorerFlight>>>;
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <WinDesktop frame={f} w={1032} h={547}>
              <RecycleBin frame={f} {...BIN} float={1.5} shadow={0.6} holdsPhoto={shift ? undefined : 141} restoreAt={shift ? undefined : 172} />
              <ExplorerWindow {...ex} scale={k} />
              <svg width={1032} height={547} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                {trail.map((p, i) => (
                  <rect key={i} x={p.x - (10 - i * 1.5) / 2} y={p.y - (10 - i * 1.5) / 2 + 26} width={10 - i * 1.5} height={10 - i * 1.5} rx={2} fill={PAL.photo} opacity={0.9 - i * 0.2} />
                ))}
              </svg>
            </WinDesktop>
          </ScreenSlot>
        ),
      }}
      hud={
        shift ? (
          <>
            <KeyCap frame={f} keys={['Shift', 'Delete']} x={1440} y={850} at={214} pressAt={232} exitAt={276} />
            <VerdictChip frame={f} at={252} text="Skips the bin" tone="neutral" x={1490} y={200} exitAt={292} />
          </>
        ) : (
          <KeyCap frame={f} keys={['Delete']} x={1580} y={850} at={104} pressAt={118} exitAt={150} />
        )
      }
    />
  );
};

/* ---------------------------------------------------------------- shot 4: the bin on the hardware stage */
const BinShot: React.FC<{f: number}> = ({f}) => (
  <Stage frame={f} env="stage" cam={[{f: 300, zoom: 1}, {f: 390, zoom: 1.07, x: 930}]}>
    <RecycleBin frame={f} x={820} y={560} w={660} holdsPhoto={0} emptyHoverAt={314} flushAt={346} float={4} tiltY={-4} rim={{color: PAL.structure, strength: 0.4}} sweep={{every: 70, offset: 10}} screen />
  </Stage>
);

/* ---------------------------------------------------------------- shot 5: the scanner rebuilds (partial: the race) */
const ScanShot: React.FC<{f: number}> = ({f}) => (
  <Stage
    frame={f}
    env="stage"
    cam={[{f: 390, zoom: 1.04, x: 940}, {f: 510, zoom: 1.0, x: 960}]}
    hud={
      <>
        <QuoteStrip frame={f} at={398} exitAt={438} source="Microsoft · Windows File Recovery page" quote="…the file data can still exist and be recovered." />
        <WriteTally frame={f} x={1560} y={170} hits={[444, 458, 472]} at={440} size={86} />
        <Footnote frame={f} at={448} text="Illustrative" />
      </>
    }
  >
    <ScannerProp
      frame={f}
      x={900}
      y={470}
      w={900}
      enter={{kind: 'rise', at: 390}}
      float={3}
      sweep={{every: 90, offset: 20}}
      beam={{at: 396}}
      scan={{at: 400, dur: 30, every: 40}}
      tray="partial"
      trayAt={420}
      fillDur={60}
      missing={[
        {at: 444, y0: 0.18, y1: 0.27},
        {at: 458, y0: 0.47, y1: 0.55},
        {at: 472, y0: 0.72, y1: 0.79},
      ]}
    />
  </Stage>
);

/* ---------------------------------------------------------------- shot 6: mirror race, kept vs lost */
const RaceShot: React.FC<{f: number}> = ({f}) => {
  const tray = (r: boolean) => (f < 532 ? 'unknown' : r ? 'empty' : 'photo');
  const common = {frame: f, y: 500, w: 720, float: 2, beam: {at: 512}, scan: {at: 514, dur: 26, every: 34, until: 566}, fillDur: 34} as const;
  return (
    <Stage
      frame={f}
      env="stage"
      cam={[{f: 510, zoom: 1.03}, {f: 600, zoom: 1.0}]}
      hud={
        <>
          <div style={{position: 'absolute', left: 958, top: 60, width: 4, height: 880, background: `linear-gradient(180deg, ${rgba(PAL.structure, 0)}, ${rgba(PAL.structure, 0.5)}, ${rgba(PAL.structure, 0)})`}} />
          <VerdictChip frame={f} at={546} text="Unlisted" tone="kept" x={480} y={110} />
          <VerdictChip frame={f} at={554} text="Gone" tone="lost" x={1440} y={110} />
          <VerdictCard frame={f} at={566} text="Nothing left for a recovery tool" accentWord="Nothing" y={870} />
        </>
      }
    >
      <ScannerProp {...common} x={500} tray={tray(false)} trayAt={f < 532 ? 516 : 532} />
      <ScannerProp {...common} x={1420} tray={tray(true)} trayAt={f < 532 ? 516 : 532} />
    </Stage>
  );
};

/* ---------------------------------------------------------------- shot 7: the TRIM note, its slot, the stop */
const TrimShot: React.FC<{f: number}> = ({f}) => {
  const path = {pts: [{x: 980, y: 640}, {x: 1720, y: 640}], at: 618, dur: 46, stopAt: 0.78};
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true}}
      cam={[{f: 600, zoom: 1.05, x: 900}, {f: 690, zoom: 1.0, x: 960}]}
      hud={
        <>
          <ClockGlyph frame={f} x={1700} y={230} size={150} at={628} />
          <Label frame={f} at={652} text="Certain multi-drive arrays" x={1360} y={420} to={{x: 1690, y: 560}} side="left" />
          <Footnote frame={f} at={640} text="Illustrative timing" />
        </>
      }
    >
      <div style={{position: 'absolute', left: 1620, top: 540, width: 240, height: 210, borderRadius: 18, background: 'linear-gradient(180deg, #2A3650, #141B2A)', border: `2px solid ${rgba(PAL.structure, 0.45)}`, boxShadow: '0 20px 50px rgba(0,0,0,0.6)'}}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{position: 'absolute', left: 22, right: 22, top: 22 + i * 44, height: 30, borderRadius: 6, background: '#0D1320', border: `1px solid ${rgba(PAL.structure, 0.25)}`}} />
        ))}
      </div>
      <TrimNote frame={f} variant="render" x={520} y={520} w={620} enter={{kind: 'rise', at: 600}} float={4} sweep={{every: 80, offset: 8}} />
      <TrimNote frame={f} variant="envelope" x={980} y={640} w={270} at={606} path={path} slot={{x: 1330, y: 640, h: 230}} />
    </Stage>
  );
};

/* ---------------------------------------------------------------- shot 8: the key: slot, pull, shatter; noise without it */
const KeyShot: React.FC<{f: number}> = ({f}) => (
  <Stage
    frame={f}
    env="stage"
    cam={[{f: 690, zoom: 1.06, x: 900}, {f: 775, zoom: 1.0, x: 960}]}
    shake={[{at: 748, strength: 0.6}]}
    hud={
      <>
        <QuoteStrip frame={f} at={750} source="NIST" reported="destroying the key, a fast way to sanitize" />
        <VerdictChip frame={f} at={758} text="Under the right conditions" tone="neutral" x={1490} y={120} />
      </>
    }
  >
    <ScrambleField frame={f} rect={{x: 1240, y: 250, w: 540, h: 400}} at={694} seed="kitui" size={26} />
    <KeyFixture frame={f} x={720} y={520} w={860} float={3} sweep={{every: 90, offset: 12}} glow={0.6} slotAt={698} pullAt={724} shatterAt={748} />
  </Stage>
);

/* ---------------------------------------------------------------- shots 9–11: Settings, the command line, the passport */
const SettingsShot: React.FC<{f: number}> = ({f}) => {
  const kb: KenBurns = {from: DESK.kbMonitor, to: {...DESK.kbMonitor, s: 1.62}, start: 775, end: 830};
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <WinDesktop frame={f} w={1032} h={547}>
              <div style={{position: 'absolute', left: 130, top: 64, width: 772, height: 360}}>
                <WinFrame w={772} h={360} title={<span>Settings</span>}>
                  <SettingsToggle frame={f} x={386} y={150} w={680} size={34} title="Device encryption" state="unknown" at={779} magnifier={{at: 792}} scale={deskSlotScale(f, kb)} />
                </WinFrame>
              </div>
            </WinDesktop>
          </ScreenSlot>
        ),
      }}
    />
  );
};

const CommandShot: React.FC<{f: number}> = ({f}) => {
  const kb: KenBurns = {from: DESK.kbScreen, to: {...DESK.kbScreen, s: 1.78}, start: 830, end: 880};
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <WinDesktop frame={f} w={1032} h={547}>
              <CommandWindow frame={f} x={70} y={80} w={892} h={320} fontSize={34} typeAt={836} rate={0.7} highlight="/w" highlightAt={858} enterAt={830} scale={deskSlotScale(f, kb)} />
            </WinDesktop>
          </ScreenSlot>
        ),
      }}
      hud={<VerdictChip frame={f} at={860} text="cipher /w" tone="neutral" x={1500} y={880} />}
    />
  );
};

const PassportShot: React.FC<{f: number}> = ({f}) => (
  <Stage frame={f} env={{kind: 'night', grid: false}} cam={[{f: 880, zoom: 1.0}, {f: 900, zoom: 1.04}]}>
    <PassportCard frame={f} variant="screen" x={960} y={520} w={420} enter={{kind: 'pop', at: 878}} float={4} tiltY={-8} rim={{color: PAL.structure, strength: 0.4}} sweep={{at: [880], dur: 16}} dissolveAt={890} />
  </Stage>
);

export const KitUI: React.FC = () => {
  const f = useCurrentFrame();
  if (f < 90) return <Shot1 f={f} />;
  if (f < 210) return <ScreenShot f={f} shift={false} />;
  if (f < 300) return <ScreenShot f={f} shift />;
  if (f < 390) return <BinShot f={f} />;
  if (f < 510) return <ScanShot f={f} />;
  if (f < 600) return <RaceShot f={f} />;
  if (f < 690) return <TrimShot f={f} />;
  if (f < 775) return <KeyShot f={f} />;
  if (f < 830) return <SettingsShot f={f} />;
  if (f < 880) return <CommandShot f={f} />;
  return <PassportShot f={f} />;
};

registerRoot(() => <Composition id="KitUI" component={KitUI} durationInFrames={DUR} fps={30} width={1920} height={1080} />);
