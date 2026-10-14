/**
 * Ep03 visual kit demo (≈25 s). Exercises every kit component.
 *   node tools/stills.mjs src/entries/ep03kit.tsx KitDemo out/ep03/kit 30,64,92,140 --phone
 */
import React from 'react';
import {AbsoluteFill, Composition, registerRoot, useCurrentFrame} from 'remotion';
import {
  AtlasOpener,
  Bit,
  Bridge,
  ChatScreen,
  Counter,
  FlashCut,
  Footnote,
  KineticText,
  Label,
  LensDive,
  PAL,
  PowerDial,
  Prop,
  QuestionCard,
  REGIONS,
  Rewind,
  ScreenSlot,
  Stage,
  SwapVariant,
  TileRow,
  Whip,
  ZoomThrough,
  bridgeAnchors,
  poseAt,
  propPoint,
  regionCenter,
  streamTimes,
  tokenize,
  toScreen,
  type BridgeProps,
  type CamKey,
} from '../ep03/kit';

const DURATION = 750;
const QUESTION = ['Why', ' do', ' AI', ' answers', ' arrive', ' one', ' piece', ' at', ' a', ' time', '?'];
const IDS = [10445, 656, 15592, 11503, 15603, 832, 6710, 520, 264, 892, 30];
const ANSWER =
  'Because a model writes one token at a time. Each new piece depends on every piece before it, so the next one cannot start until the last one is done.';

/* ---------------------------------------------------------------- A: hardware stage (opener, swap, highlight, labels) */
const camA: CamKey[] = [
  {f: 0, x: 960, y: 540, zoom: 1},
  {f: 108, x: 990, y: 530, zoom: 1.08},
];
const GPU = {x: 960, y: 570, w: 900};
const sceneA = (f: number) => {
  const pose = poseAt(f, camA);
  const hbm = regionCenter(REGIONS.gpuA_hbm[3]);
  const hbmW = propPoint('BIM129_T03_datacenter-gpu_a', GPU, hbm.x, hbm.y);
  const hbmS = toScreen(pose, hbmW.x, hbmW.y);
  const die = regionCenter(REGIONS.gpuB_die);
  const dieW = propPoint('BIM130_T03_datacenter-gpu_b', GPU, die.x, die.y);
  const dieS = toScreen(pose, dieW.x, dieW.y);
  return (
    <Stage
      frame={f}
      env="night"
      cam={camA}
      hud={
        <>
          <Label frame={f} at={58} exitAt={84} text="The card's own memory" x={1290} y={190} to={hbmS} />
          <Label frame={f} at={93} exitAt={104} text="The math units" x={1290} y={190} to={dieS} />
          <Footnote frame={f} at={60} exitAt={100} text="Illustration, not to scale" />
          <AtlasOpener frame={f} at={0} word="The bridge" index="05" />
        </>
      }
    >
      <SwapVariant
        frame={f}
        srcs={['BIM129_T03_datacenter-gpu_a', 'BIM130_T03_datacenter-gpu_b']}
        swaps={[86]}
        via="flash"
        {...GPU}
        enter={{kind: 'drop', at: 12, dist: 620}}
        tiltX={4}
        rim={{color: PAL.info, strength: 0.45}}
        sweep={{every: 70, offset: 34}}
        float={5}
        shadow={0.6}
        highlight={[{region: REGIONS.gpuA_hbm, at: 56, until: 84}]}
        spotlight={{region: REGIONS.gpuB_die, at: 92, dim: 0.6}}
      />
    </Stage>
  );
};

/* ---------------------------------------------------------------- C: the reader's desk, chat streaming on the plate */
const answerToks = tokenize(ANSWER);
const answerTimes = streamTimes(answerToks.length, 128, 7);
const sceneC = (f: number) => (
  <Stage
    frame={f}
    drift={0.6}
    env={{
      kind: 'photo',
      plate: 'reader-desk',
      kb: {from: {s: 1.02, x: 0, y: 0}, to: {s: 1.24, x: 0, y: 70}, start: 96, end: 236},
      children: (
        <ScreenSlot rect={REGIONS.deskScreen}>
          <ChatScreen frame={f} w={1032} h={547} prompt="Why do AI answers arrive one piece at a time?" promptAt={112} answer={answerToks} times={answerTimes} fontSize={36} />
        </ScreenSlot>
      ),
    }}
    hud={
      <>
        <KineticText frame={f} at={118} exitAt={172} text="0.03 s" mode="slam" x={1580} y={850} size={120} />
        <Counter frame={f} at={176} dur={50} from={0} to={6.5} decimals={1} suffix=" s" x={1580} y={850} size={120} />
      </>
    }
  />
);

/* ---------------------------------------------------------------- E: the Bridge (6 s hero) */
const bridgeE: Omit<BridgeProps, 'frame'> = {
  view: 'side',
  build: {at: 232, dur: 54},
  cam: [
    {f: 232, cam: 'wide'},
    {f: 326, cam: 'wide'},
    {f: 378, cam: 'crates', view: 'threeQuarter', dur: 52},
  ],
  bandwidth: 0.75,
  crateRate: 3,
  crateLabel: '≈16 GB',
  mathActivity: 0.85,
  flowUntil: 346,
  heroCrate: {at: 352, dur: 44, scale: 2.3},
};
const sceneE = (f: number) => {
  const a = bridgeAnchors(bridgeE, f);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      hud={
        <>
          <Label frame={f} at={292} exitAt={330} text="Memory" x={a.towerTop.x + 60} y={a.towerTop.y - 110} to={a.towerTop} />
          <Label frame={f} at={298} exitAt={330} text="Math" x={a.dieTop.x + 80} y={a.dieTop.y - 120} to={a.die} />
          <Footnote frame={f} at={372} exitAt={406} text="Crates: the model's weights" />
        </>
      }
    >
      <Bridge frame={f} {...bridgeE} />
    </Stage>
  );
};

/* ---------------------------------------------------------------- F: token tiles on the chip world */
const sceneF = (f: number) => (
  <Stage
    frame={f}
    env="chip"
    cam={[
      {f: 404, zoom: 1},
      {f: 500, zoom: 1.06, y: 560},
    ]}
    hud={<KineticText frame={f} at={474} text="" mode="count" count={{from: 0, to: 11, dur: 16, suffix: ' numbers'}} x={960} y={250} size={96} />}
  >
    <TileRow frame={f} tokens={QUESTION} ids={IDS} x={960} y={600} size={84} gap={18} wrap maxWidth={1700} snapAt={{start: 414, every: 4}} flipAt={{start: 470, every: 2}} />
  </Stage>
);

/* ---------------------------------------------------------------- G: the power dial */
const sceneG = (f: number) => (
  <Stage frame={f} env={{kind: 'night', warm: 0.8}} hud={<KineticText frame={f} at={566} text="Half power" mode="slam" x={1370} y={500} size={110} color={PAL.energy} />}>
    <PowerDial frame={f} x={720} y={560} w={540} value={[[528, 1], [568, 0.5]]} enter={{kind: 'slide', at: 506, from: 'left'}} />
  </Stage>
);

/* ---------------------------------------------------------------- H1: the monitor prop with the chat UI; H2: the idle die */
const MON = {x: 960, y: 560, w: 1240};
const monToks = tokenize('Each piece is a token. The model picks one, adds it to the end, and runs again for the next.');
const sceneH1 = (f: number) => (
  <Stage frame={f} env="night" cam={[{f: 580, zoom: 1}, {f: 650, zoom: 1.08, y: 520}]}>
    <Prop frame={f} src="BIM150_T03_reader-monitor_b" {...MON} enter={{kind: 'rise', at: 580}} shadow={0.55} sweep={{at: [596]}} rim={{color: '#7FB8FF', strength: 0.25}}>
      <ScreenSlot rect={REGIONS.monitorScreen}>
        <ChatScreen frame={f} w={1260} h={615} prompt="What is a token?" promptAt={586} answer={monToks} times={streamTimes(monToks.length, 594, 9)} fontSize={46} />
      </ScreenSlot>
    </Prop>
  </Stage>
);
const bridgeH: Omit<BridgeProps, 'frame'> = {view: 'threeQuarter', framing: 'die', bandwidth: 0.3, crateRate: 0.8, mathActivity: 0.1, idle: [[640, 0.2], [672, 1]], powerCap: 1};
const sceneH2 = (f: number) => (
  <Stage frame={f} env="none" drift={0} hud={<QuestionCard frame={f} at={654} text="So why is each run so slow?" />}>
    <Bridge frame={f} {...bridgeH} />
  </Stage>
);

/* ---------------------------------------------------------------- I: the loop */
const LOOP = 'M 960 300 C 1200 300 1300 420 1300 540 C 1300 660 1200 780 960 780 C 720 780 620 660 620 540 C 620 420 720 300 960 300 Z';
const sceneI = (f: number) => (
  <Stage frame={f} env="void" hud={<KineticText frame={f} at={728} text="" mode="count" count={{from: 0, to: 150, dur: 20, suffix: ' tokens/s'}} x={960} y={540} size={84} backing="none" />}>
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <path d={LOOP} fill="none" stroke={PAL.structure} strokeOpacity={0.45} strokeWidth={5} />
    </svg>
    <Bit frame={f} path={LOOP} progress={(f - 720) / 40} loop route="none" size={30} />
  </Stage>
);

/* ---------------------------------------------------------------- the reel */
const KitDemo: React.FC = () => {
  const f = useCurrentFrame();
  let node: React.ReactNode;
  if (f < 236) node = <Whip frame={f} at={96} dur={12} dir="left" a={sceneA} b={(g) => <FlashCut frame={g} at={230} a={sceneC} b={sceneE} />} />;
  else if (f < 404) node = <FlashCut frame={f} at={230} a={sceneC} b={sceneE} />;
  else if (f < 494) node = <ZoomThrough frame={f} at={404} dur={16} a={sceneE} b={sceneF} cx={960} cy={560} />;
  else if (f < 580) node = <Whip frame={f} at={494} dur={12} dir="up" a={sceneF} b={sceneG} />;
  else if (f < 700) node = <FlashCut frame={f} at={580} a={sceneG} b={(g) => <LensDive frame={g} at={612} cx={960} cy={430} r={230} hold={10} dive={16} outer={sceneH1} inner={sceneH2} />} />;
  else node = <FlashCut frame={f} at={726} a={(g) => <Rewind frame={g} at={700} dur={26} from={700} to={652} render={sceneH2} />} b={sceneI} />;
  return <AbsoluteFill style={{background: PAL.void}}>{node}</AbsoluteFill>;
};

/* ---------------------------------------------------------------- regression check: word spacing + plate overscan */
const KitFix: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= 60)
    return (
      <Stage frame={f} env="night" cam={{x: 960, y: 540, zoom: 0.5}}>
        <Label frame={f} at={62} text="screen: 44 px on screen" x={1010} y={330} to={{x: 900, y: 420}} screen />
        <Label frame={f} at={62} text="default: shrinks with zoom" x={1010} y={760} to={{x: 900, y: 680}} />
        <KineticText frame={f} at={62} text="screen 96 px" x={960} y={540} size={96} screen />
        <Footnote frame={f} at={62} text="Footnote, screen 32 px" x={300} y={980} screen />
      </Stage>
    );
  if (f < 30)
    return (
      <Stage frame={f} env="night" hud={<><KineticText frame={f} at={4} text="Barely noticed" mode="pop" x={960} y={420} size={120} /><Label frame={f} at={6} text="Writing waits on memory" x={560} y={700} /></>} />
    );
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'reader-desk', kb: {from: {s: 1.0}, to: {s: 1.0}, start: 30, end: 60}}}
      cam={[{f: 30, x: 960, y: 540, zoom: 1}, {f: 58, x: 1350, y: 360, zoom: 0.86, rot: 1.5}]}
      shake={[{at: 50, strength: 1.5}]}
    />
  );
};

/* ---------------------------------------------------------------- Bridge check: every framing, both views */
const BR_SHOTS: Array<Omit<BridgeProps, 'frame'>> = [
  {view: 'side', framing: 'wide', crateLabel: '≈16 GB'},
  {view: 'side', framing: 'crates', crateLabel: '≈16 GB'},
  {view: 'side', framing: 'die', powerCap: 0.55, mathActivity: 0.9},
  {view: 'side', framing: 'tower', highlight: 'tower'},
  {view: 'threeQuarter', framing: 'wide', crateLabel: '≈16 GB', bandwidth: 0.9},
  {view: 'threeQuarter', framing: 'crates', crateLabel: '≈16 GB', heroCrate: {at: 296, dur: 40, scale: 2.4}},
  {view: 'threeQuarter', framing: 'die', idle: 1, mathActivity: 0.1, crateRate: 0.8},
  {view: 'threeQuarter', framing: 'tower', bandwidth: 0.3},
];
const KitBridge: React.FC = () => {
  const f = useCurrentFrame();
  const i = Math.min(BR_SHOTS.length - 1, Math.floor(f / 10));
  const t = 300 + (f % 10);
  return (
    <Stage frame={t} env="none" drift={0}>
      <Bridge frame={t} {...BR_SHOTS[i]} />
    </Stage>
  );
};

registerRoot(() => (
  <>
    <Composition id="KitBridge" component={KitBridge} durationInFrames={80} fps={30} width={1920} height={1080} />
    <Composition id="KitDemo" component={KitDemo} durationInFrames={DURATION} fps={30} width={1920} height={1080} />
    <Composition id="KitFix" component={KitFix} durationInFrames={90} fps={30} width={1920} height={1080} />
  </>
));
