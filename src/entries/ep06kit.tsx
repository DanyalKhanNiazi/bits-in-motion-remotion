/**
 * Ep06 core kit demo. Compositions:
 *   KitDemo        40 s of short realistic shots exercising the kit (desk → DriveDive → Archive → signature →
 *                  SplitCompare → SSD stage → flash → boundary/TRIM → split layers → sanitize → encryption → flip → pull-out)
 *   ArchiveStates  the 12 Archive presets at a typical framing, one preset per 10 frames (gate contact sheet)
 *   flock -w 480 /tmp/ep06-render.lock node tools/stills.mjs src/entries/ep06kit.tsx ArchiveStates out/ep06/kit/states 5-115:10
 */
import React, {useEffect, useRef} from 'react';
import {Composition, registerRoot, useCurrentFrame} from 'remotion';
import {
  ARCHIVE_STATES,
  Archive,
  AtlasOpener,
  DESK,
  DriveDive,
  FlashCut,
  IndexCard,
  Footnote,
  KineticText,
  Label,
  PAL,
  PRESET_NAMES,
  PhotoBits,
  Prop,
  QuestionCard,
  SplitCompare,
  Stage,
  Whip,
  archiveAnchors,
  archiveCam,
  plateToStage,
  poseAt,
  toScreen,
  type ArchiveEvent,
  type CamKey,
  type Framing,
  type PresetName,
} from '../ep06/kit';
import {ClockGlyph, VerdictCard, VerdictChip} from '../ep06/kit/ui';

/* ================================================================ ArchiveStates (gate contact) */
const STATE_FRAMING: Record<PresetName, Framing> = {
  HDD_SAVED: 'wide',
  HDD_DELETED: 'wide',
  HDD_REUSED: 'drawer',
  HDD_RACE_LOST: 'wall',
  HDD_WIPED: 'wall',
  SSD_SAVED: 'wide',
  SSD_DELETED: 'signature',
  SSD_TRIMMED: 'photoBoxes',
  SSD_ERASED: 'photoBoxes',
  SSD_STALE: 'layers',
  SSD_SANITIZED: 'layers',
  SSD_ENCRYPTED: 'layers',
};
const StatesComp: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(PRESET_NAMES.length - 1, Math.floor(f / 10));
  const name = PRESET_NAMES[i];
  const fr = STATE_FRAMING[name];
  return (
    <Stage frame={f} env={{kind: 'archive', light: ARCHIVE_STATES[name].light}} cam={archiveCam(fr)}>
      <Archive frame={f} state={name} lift={fr === 'signature' ? 1 : 0} />
    </Stage>
  );
};

/* ================================================================ KitDemo */
const K = (f: number, fr: Framing, o: Partial<CamKey> = {}, opt?: {run?: number; lift?: number; box?: number}): CamKey => ({f, ...archiveCam(fr, opt), ...o});

/* ---- A [0, 60): the reader's desk; the photo on the monitor dissolves into its Bits */
const KB_A = {from: {s: 1.08, x: 0, y: 40}, to: DESK.kbMonitor, start: 0, end: 70};
const PHOTO_PLATE = {x: 706, y: 196, w: 260, h: 350};
const shotDesk = (f: number) => (
  <Stage
    frame={f}
    env={{
      kind: 'photo',
      plate: 'reader-desk',
      kb: KB_A,
      children: (
        <>
          <div style={{position: 'absolute', left: DESK.screen[0][0], top: DESK.screen[0][1], width: DESK.slotW, height: DESK.slotH, background: `linear-gradient(180deg, ${PAL.winBar} 0 34px, ${PAL.winBody} 34px)`}} />
          <PhotoBits frame={f} at={20} dur={26} mode="dissolve" from={PHOTO_PLATE} image="fictional-passport_b" grid={[13, 17]} />
        </>
      ),
    }}
    drift={0.6}
    hud={<Footnote frame={f} at={6} exitAt={56} text="Fictional example" />}
  />
);

/* ---- B [102, 420): the Archive, hard drive: rocket back, drawer, pour, threads, the card, delete, scan, race */
const B_EVENTS: ArchiveEvent[] = [
  {at: 150, op: 'build', target: 'drawer', dur: 30},
  {at: 186, op: 'pour', dur: 36},
  {at: 222, op: 'threads', dur: 20},
  {at: 296, op: 'readPulse', dur: 24},
  {at: 314, op: 'strike'},
  {at: 322, op: 'flag'},
  {at: 334, op: 'mapFlip', target: 'photo', dur: 14},
  {at: 356, op: 'reuse'},
  {at: 368, op: 'scan', dur: 32},
  {at: 380, op: 'copyOut', target: 'photo', dur: 22, to: {x: 1720, y: 120}},
  {at: 396, op: 'overwrite', target: 22},
  {at: 404, op: 'overwrite', target: 59},
  {at: 412, op: 'overwrite', target: 99},
];
const B_CAM: CamKey[] = [
  K(96, 'header', {zoom: 5.2}, {box: 37}),
  K(106, 'header', {zoom: 4.8}, {box: 37}),
  K(130, 'wide', {ease: 'outExpo', dur: 24}),
  K(226, 'wide', {x: 990, zoom: 1.04}),
  K(250, 'drawer', {dur: 24}),
  K(274, 'card', {dur: 22}),
  K(312, 'card', {zoom: 3.35}),
  K(346, 'map', {dur: 26}),
  K(366, 'photoBoxes', {dur: 20}),
  K(420, 'photoBoxes', {zoom: 2.0}),
];
const shotArchiveHdd = (f: number) => {
  const A = {frame: f, state: 'HDD_SAVED' as PresetName, events: B_EVENTS, cardFields: {name: 276, size: 281, dates: 286, directions: 291}, renders: {wall: [[96, 1], [110, 1], [122, 0]] as const}};
  const pose = poseAt(f, B_CAM);
  const an = archiveAnchors(A, f, pose);
  const dr = toScreen(pose, an.drawer.x, an.drawer.y - 140);
  const light = f < 352 ? 'warm' : 'scan';
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light}}
      cam={B_CAM}
      shake={[{at: 402, strength: 0.5}, {at: 410, strength: 0.4}]}
      hud={
        <>
          <AtlasOpener frame={f} at={130} word="The picture" sub="boxes and cards" y={470} />
          <Label frame={f} at={240} exitAt={266} text="Master File Table" x={Math.max(120, dr.x - 470)} y={Math.max(110, dr.y - 260)} to={dr} side="right" />
          <Footnote frame={f} at={292} exitAt={344} text="Simplified: real cards list ranges" />
          <KineticText frame={f} at={396} exitAt={418} text="Recovery is a race" x={960} y={170} size={88} mode="slam" />
        </>
      }
    >
      <Archive {...A} light={light} />
    </Stage>
  );
};

/* ---- C [420, 510): the signature image: the struck card lifted, threads taut to every lit box */
const C_CAM: CamKey[] = [K(420, 'drawer'), K(458, 'signature', {dur: 34}), K(510, 'signature', {zoom: 1.0, x: 1200})];
const shotSignature = (f: number) => {
  const ev: ArchiveEvent[] = [{at: 436, op: 'strike'}];
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool'}}
      cam={C_CAM}
      shake={[{at: 437, strength: 0.6}]}
      hud={
        <>
          <div style={{position: 'absolute', inset: 0, opacity: 0.55}}>
            <KineticText frame={f} at={428} text="Gone." x={760} y={170} size={180} mode="slam" color={PAL.ink} backing="none" />
          </div>
          <KineticText frame={f} at={470} text="Only the note" x={1420} y={930 - 130} size={96} mode="slam" />
        </>
      }
    >
      <Archive frame={f} state="HDD_SAVED" events={ev} lift={[[422, 0], [456, 1]]} />
    </Stage>
  );
};

/* ---- D [510, 600): SplitCompare: the frame compresses into "Hard drive", the SSD slides in; sweep; chips; verdict */
const shotSplit = (f: number) => (
  <SplitCompare
    frame={f}
    at={512}
    enter="compress"
    left={{cam: [K(510, 'signature', {zoom: 1.0, x: 1200}), K(528, 'split')], light: 'cool', render: (fr) => <Archive frame={fr} state="HDD_DELETED" lift={[[512, 1], [530, 0]]} />}}
    right={{
      cam: archiveCam('split'),
      light: 'ssd',
      render: (fr) => <Archive frame={fr} state="SSD_TRIMMED" events={[{at: 540, op: 'sweep', target: 'photo', dur: 30}]} />,
    }}
    leftChip={<VerdictChip frame={f} at={562} text="Unlisted" tone="kept" x={0} y={0} />}
    rightChip={<VerdictChip frame={f} at={572} text="Gone" tone="lost" x={0} y={0} />}
    verdict={<VerdictCard frame={f} at={584} text="Deleted means unlisted, not erased" accentWord="unlisted" x={0} y={0} />}
    hud={
      <>
        <ClockGlyph frame={f} x={1780} y={300} size={64} at={536} exitAt={598} />
        <Footnote frame={f} at={540} exitAt={598} text="Illustrative timing" y={1000} />
      </>
    }
  />
);

/* ---- E [600, 640): the SSD on the hardware stage */
const shotSsdStage = (f: number) => (
  <Stage frame={f} env={{kind: 'stage', spot: 960, floor: 800, warm: 0.6}} cam={[{f: 600, zoom: 1}, {f: 660, zoom: 1.06}]}>
    <Prop frame={f} src="ssd-board_a" x={960} y={560} w={1100} tiltX={6} rim={{color: PAL.structure, strength: 0.6}} sweep={{at: [612], dur: 20}} float={4} shadow={0.6} enter={{kind: 'rise', at: 596}} />
  </Stage>
);

/* ---- F [682, 780): inside the flash: refused writes, housekeeping clears old groups, still-wanted Bits hop first */
const OLD: Record<number, 'old' | 'other'> = {77: 'old', 78: 'old', 79: 'old', 80: 'old', 125: 'old', 126: 'other', 127: 'old', 128: 'old', 41: 'old', 42: 'old'};
const shotFlash = (f: number) => (
  <Stage frame={f} env={{kind: 'flash', amber: 1.2}} cam={[K(670, 'wall', {zoom: 1.5, x: 1500, y: 700}), K(780, 'wall', {zoom: 1.4, x: 1480, y: 690})]}
    hud={<Footnote frame={f} at={712} exitAt={778} text="Simplified: flash erases in large groups" />}>
    <Archive
      frame={f}
      state="SSD_SAVED"
      tilt={{y: [[670, -16], [780, -10]], x: 4}}
      boxes={OLD}
      show={{drawer: 0, map: 0, card: 0, threads: 0, ghost: 0}}
      events={[
        {at: 664, op: 'build', target: 'wall', dur: 30},
        {at: 700, op: 'refuse', target: 78, dur: 20},
        {at: 716, op: 'sweep', target: [77, 125], dur: 46},
      ]}
    />
  </Stage>
);

/* ---- G [780, 900): Windows' side | the drive's side: the boundary, TRIM through the slot, disposable tags, erase */
const G_CAM: CamKey[] = [K(780, 'boundary'), K(840, 'boundary', {zoom: 1.7}), K(866, 'photoBoxes', {dur: 24}), K(900, 'photoBoxes', {zoom: 1.98})];
const shotBoundary = (f: number) => (
  <Stage frame={f} env={{kind: 'archive', light: 'ssd'}} cam={G_CAM}
    hud={<QuestionCard frame={f} at={846} exitAt={880} text="What will the drive do?" y={180} scrim={0.35} size={84} />}>
    <Archive
      frame={f}
      state="SSD_DELETED"
      events={[
        {at: 784, op: 'boundary'},
        {at: 798, op: 'trim', dur: 34},
        {at: 840, op: 'tag', target: 'photo', dur: 14},
        {at: 878, op: 'sweep', target: 'photo', dur: 20},
      ]}
    />
  </Stage>
);

/* ---- H [900, 1050): behind the wall: the layers split; the overwrite lands somewhere fresh; sanitize reaches spare */
const H_CAM: CamKey[] = [K(900, 'wide', {zoom: 1.05}), K(944, 'layers', {dur: 40}), K(1050, 'layers', {zoom: 1.04})];
const shotLayers = (f: number) => {
  const A = {frame: f, state: 'SSD_DELETED' as PresetName, events: [{at: 904, op: 'splitLayers', dur: 40}, {at: 962, op: 'remap', target: 'photo', dur: 22}, {at: 1006, op: 'sanitize', dur: 38}] as ArchiveEvent[]};
  const pose = poseAt(f, H_CAM);
  const an = archiveAnchors(A, f, pose);
  const sp = toScreen(pose, an.spare.x, an.spare.y - 200);
  return (
    <Stage frame={f} env={{kind: 'archive', light: 'ssd'}} cam={H_CAM}
      hud={
        <>
          <Label frame={f} at={970} exitAt={1000} text="Spare space Windows can't see" x={sp.x - 40} y={150} to={sp} side="left" />
          <Footnote frame={f} at={950} exitAt={1046} text="Schematic, not to scale" />
        </>
      }>
      <Archive {...A} />
    </Stage>
  );
};

/* ---- I [1050, 1110): encrypted from the save: glyphs everywhere; the key slots in → Windows reads normally */
const shotEncrypted = (f: number) => (
  <Stage frame={f} env={{kind: 'archive', light: 'ssd'}} cam={[K(1050, 'layers', {zoom: 1.1}), K(1110, 'layers', {zoom: 1.16})]}>
    <Archive frame={f} state="SSD_ENCRYPTED" events={[{at: 1084, op: 'unscramble'}]} />
  </Stage>
);

/* ---- J [1110, 1200): the wall flips to flash, then the pull-out and the title */
const J_CAM: CamKey[] = [K(1110, 'wall'), K(1150, 'wall', {zoom: 1.6}), K(1196, 'pullout', {dur: 46})];
const shotFlip = (f: number) => (
  <Stage frame={f} env={{kind: 'archive', light: f < 1132 ? 'cool' : 'ssd'}} cam={J_CAM}
    hud={<KineticText frame={f} at={1166} text="Delete ≠ Erase" x={960} y={540} size={170} mode="slam" />}>
    <Archive frame={f} state="SSD_DELETED" flip={{at: 1114, dur: 34}} tilt={{y: [[1150, 0], [1196, -14]], x: [[1150, 0], [1196, 6]]}} />
  </Stage>
);

/* ================================================================ KitNodes (debug): SVG node count per Archive */
const NODE_CASES: Array<{state: PresetName; fr: Framing; events?: ArchiveEvent[]}> = [
  {state: 'HDD_SAVED', fr: 'wide', events: [{at: 0, op: 'pour'}, {at: 0, op: 'scan', dur: 40}]},
  {state: 'HDD_WIPED', fr: 'wide'},
  {state: 'SSD_ENCRYPTED', fr: 'layers'},
  {state: 'SSD_SANITIZED', fr: 'layers', events: [{at: 0, op: 'sanitize', dur: 40}]},
];
const NodesComp: React.FC = () => {
  const f = useCurrentFrame();
  const c = NODE_CASES[Math.min(NODE_CASES.length - 1, Math.floor(f / 10))];
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const n = ref.current ? ref.current.querySelectorAll('svg *').length : -1;
    // eslint-disable-next-line no-console
    console.error(`nodes ${c.state} ${c.fr} f${f}: ${n}`);
  });
  return (
    <Stage frame={f} env={{kind: 'archive', light: ARCHIVE_STATES[c.state].light}} cam={archiveCam(c.fr)}>
      <div ref={ref}>
        <Archive frame={f} state={c.state} events={c.events} />
      </div>
    </Stage>
  );
};

/* ================================================================ KitCards: IndexCard variants (a canyon of blank cards + the tiny file) */
const CardsComp: React.FC = () => {
  const f = useCurrentFrame() + 300;
  const rows = Array.from({length: 7}, (_, i) => 6 - i);
  return (
    <Stage frame={f} env={{kind: 'archive', light: 'warm'}} drift={1}>
      {rows.map((d) =>
        [-1, 0, 1].map((c) => {
          const k = Math.pow(0.72, d);
          return <IndexCard key={`${d}-${c}`} frame={f + d * 11 + c * 5} x={960 + c * 520 * k} y={380 - 160 * (1 - k)} w={420 * k} variant="blank" opacity={0.25 + 0.75 * k} shadow={k} />;
        }),
      )}
      <IndexCard frame={f} x={700} y={780} w={520} variant="tiny" />
      <IndexCard frame={f} x={1260} y={780} w={520} variant="photo" state="reused" />
    </Stage>
  );
};

/* ================================================================ KitPerf (debug): cost of the parts */
const OFF = {ghost: 0, wall: 0, drawer: 0, map: 0, card: 0, threads: 0};
const PERF_V: Array<{show?: Record<string, number>; bloom?: number; none?: boolean}> = [
  {none: true},
  {},
  {bloom: 0},
  {show: OFF},
  {show: {...OFF, card: 1}},
  {show: {...OFF, map: 1}},
  {show: {...OFF, drawer: 1}},
  {show: {...OFF, threads: 1}},
  {show: {...OFF, ghost: 1}},
];
const PerfComp: React.FC = () => {
  const f = useCurrentFrame();
  const v = PERF_V[Math.min(PERF_V.length - 1, Math.floor(f / 10))];
  return (
    <Stage frame={f} env={{kind: 'archive', light: 'warm'}} cam={archiveCam('wide')} grade={v.bloom !== undefined ? {bloom: v.bloom} : undefined}>
      {v.none ? null : <Archive frame={f} state="HDD_SAVED" show={v.show} />}
    </Stage>
  );
};

/* ================================================================ KitReg (debug): render registration at 55 % */
const RegComp: React.FC = () => {
  const f = useCurrentFrame();
  const card = f >= 1;
  return (
    <Stage frame={f} env={{kind: 'archive', light: 'warm'}} drift={0} cam={card ? archiveCam('card') : {x: 1180, y: 380, zoom: 2.2, rot: 0}}>
      <Archive frame={f} state="HDD_SAVED" renders={card ? {card: 0.55} : {wall: 0.55}} />
    </Stage>
  );
};

const Demo: React.FC = () => {
  const f = useCurrentFrame();
  const screenPt = plateToStage(60, KB_A, PHOTO_PLATE.x + PHOTO_PLATE.w / 2, PHOTO_PLATE.y + PHOTO_PLATE.h / 2);
  if (f < 102) return <DriveDive frame={f} at={60} from={{x: screenPt.x, y: screenPt.y}} a={shotDesk} b={shotArchiveHdd} />;
  if (f < 420) return shotArchiveHdd(f);
  if (f < 510) return <FlashCut frame={f} at={420} a={shotArchiveHdd} b={shotSignature} />;
  if (f < 594) return shotSplit(f);
  if (f < 640) return <Whip frame={f} at={594} dur={12} dir="left" a={shotSplit} b={shotSsdStage} />;
  if (f < 780) return <DriveDive frame={f} at={640} drive="ssd-board_a" explode="ssd-board_d" a={shotSsdStage} b={shotFlash} />;
  if (f < 900) return <FlashCut frame={f} at={780} a={shotFlash} b={shotBoundary} />;
  if (f < 1050) return <Whip frame={f} at={894} dur={12} dir="up" a={shotBoundary} b={shotLayers} />;
  if (f < 1110) return <FlashCut frame={f} at={1050} a={shotLayers} b={shotEncrypted} />;
  return <FlashCut frame={f} at={1110} a={shotEncrypted} b={shotFlip} />;
};

registerRoot(() => (
  <>
    <Composition id="KitDemo" component={Demo} durationInFrames={1200} fps={30} width={1920} height={1080} />
    <Composition id="ArchiveStates" component={StatesComp} durationInFrames={PRESET_NAMES.length * 10} fps={30} width={1920} height={1080} />
    <Composition id="KitPerf" component={PerfComp} durationInFrames={100} fps={30} width={1920} height={1080} />
    <Composition id="KitCards" component={CardsComp} durationInFrames={2} fps={30} width={1920} height={1080} />
    <Composition id="KitReg" component={RegComp} durationInFrames={2} fps={30} width={1920} height={1080} />
    <Composition id="KitNodes" component={NodesComp} durationInFrames={NODE_CASES.length * 10} fps={30} width={1920} height={1080} />
  </>
));
