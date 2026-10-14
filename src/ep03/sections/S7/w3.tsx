/**
 * S7 wait 3 (P18): many people at once, the batch station (one trip → a token for every chat), our answer as one of
 * many, the benchmark (8 bits per weight, short prompts), ×60 tokens a second, ×3 further apart, the tradeoff.
 */
import React from 'react';
import {Img} from 'remotion';
import {
  BitHead,
  ChatScreen,
  Counter,
  EASE,
  KineticText,
  Label,
  PAL,
  Prop,
  REGIONS,
  SPRING,
  ScreenSlot,
  Stage,
  TileRow,
  TokenTile,
  assetBox,
  assetUrl,
  clamp01,
  lerp,
  osc,
  poseAt,
  prog,
  propPoint,
  regionCenter,
  rgba,
  rnd,
  rr,
  springAt,
  toScreen,
  tokenize,
  type CamKey,
  type KenBurns,
} from '../../kit';
import {ChatChrome, ChatGlyph, CropImg, IsoCrate, SafeLabel, Skel, Words, a18, CUT, DIVE, type Pt} from './lib';

/* ================================================================ MP: many people at once */
const MPC = 7;
const MPR = 4;
const WW = 300;
const WH = 196;
const MPX = 334;
const MPY = 230;
const OUR = {c: 3, r: 1};
const MP_IN = CUT.D3 + DIVE;
const winPos = (c: number, r: number) => ({x: (c - (MPC - 1) / 2) * MPX, y: (r - (MPR - 1) / 2) * MPY});
const MiniChat: React.FC<{frame: number; seed: string; ours: boolean}> = ({frame: f, seed, ours}) => {
  const ph = rnd(`${seed}-ph`);
  const per = 70 + 50 * rnd(`${seed}-per`);
  const rev = (((f / per + ph) % 1) + 1) % 1;
  return (
    <div
      style={{
        position: 'absolute',
        left: -WW / 2,
        top: -WH / 2,
        width: WW,
        height: WH,
        borderRadius: 12,
        overflow: 'hidden',
        background: `linear-gradient(180deg, #1B2A4A, #111B30)`,
        border: `2px solid ${ours ? PAL.info : rgba(PAL.structure, 0.6)}`,
        boxShadow: ours ? `0 0 34px ${rgba(PAL.info, 0.8)}` : `0 16px 30px rgba(0,0,0,0.5), 0 0 18px ${rgba('#6F8FCB', 0.18)}`,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, width: WW, height: 22, background: '#22325A'}}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{position: 'absolute', left: 10 + i * 12, top: 8, width: 6, height: 6, borderRadius: 3, background: rgba(PAL.structure, 0.7)}} />
        ))}
      </div>
      <svg width={30} height={30} viewBox="0 0 30 30" style={{position: 'absolute', right: 140, top: 28}}>
        <circle cx={15} cy={10} r={6} fill={PAL.annotation} />
        <path d="M3 28 Q15 12 27 28 Z" fill={PAL.annotation} />
      </svg>
      <div style={{position: 'absolute', right: 12, top: 32, width: 120, height: 22, borderRadius: 10, background: '#34497A'}} />
      <div style={{position: 'absolute', left: 12, top: 66, width: 14, height: 14, borderRadius: 4, background: PAL.info, boxShadow: `0 0 10px ${PAL.info}`}} />
      <div style={{position: 'absolute', left: 34, top: 68}}>
        <Skel seed={seed} lines={4} width={250} h={9} gap={10} reveal={rev} color={rgba(PAL.annotation, 0.75)} />
      </div>
      <div style={{position: 'absolute', left: 34 + 240 * ((rev * 4) % 1), top: 66 + Math.min(3, Math.floor(rev * 4)) * 19, width: 10, height: 13, borderRadius: 2, background: PAL.info, opacity: 0.6 + 0.4 * Math.sin(f / 3), boxShadow: `0 0 10px ${PAL.info}`}} />
    </div>
  );
};
export const camMP: CamKey[] = [
  {f: MP_IN, x: 960 + winPos(OUR.c, OUR.r).x, y: 540 + winPos(OUR.c, OUR.r).y, zoom: 2.3},
  {f: MP_IN + 8, x: 960 + winPos(OUR.c, OUR.r).x, y: 540 + winPos(OUR.c, OUR.r).y, zoom: 2.2},
  {f: a18('people') + 18, x: 960, y: 560, zoom: 0.82, dur: 60},
  {f: CUT.W6 + 12, x: 960, y: 560, zoom: 0.76, dur: 40},
];
export const ShotMP: React.FC<{frame: number}> = ({frame: f}) => (
  <Stage
    frame={f}
    env={{kind: 'chip', pulses: 0.8, dust: 40}}
    cam={camMP}
    hud={
      <Words
        frame={f}
        items={[
          {t: 'Many', at: a18('many people')},
          {t: 'people', at: a18('people')},
          {t: 'at', at: a18('at once')},
          {t: 'once', at: a18('once')},
        ]}
        x={960}
        y={160}
        size={96}
      />
    }
  >
    <div style={{position: 'absolute', left: 960, top: 540, width: 0, height: 0, transform: `perspective(2200px) rotateX(10deg) rotateY(${lerp(-16, -8, prog(f, MP_IN, 90, EASE.inOut))}deg)`, transformStyle: 'preserve-3d'}}>
      {Array.from({length: MPC * MPR}, (_, i) => {
        const c = i % MPC;
        const r = Math.floor(i / MPC);
        const p = winPos(c, r);
        const ours = c === OUR.c && r === OUR.r;
        return (
          <div key={i} style={{position: 'absolute', left: p.x, top: p.y + 4 * Math.sin(f / 30 + i)}}>
            <MiniChat frame={f} seed={`mp${i}`} ours={ours} />
          </div>
        );
      })}
    </div>
  </Stage>
);

/* ================================================================ BS + FIELD: the batch station */
const BSRC = 'BIM177_T03_batch-station_a' as const;
const BW = 1180;
const HERO = {x: 960, y: 600, w: BW};
const SPX = 1560;
const SPY = 1150;
const STATIONS = Array.from({length: 15}, (_, i) => {
  const c = (i % 5) - 2;
  const r = Math.floor(i / 5) - 1;
  return {i, c, r, x: 960 + c * SPX, y: 600 + r * SPY, hero: c === 0 && r === 0};
});
const BINS = [
  [287, 784],
  [633, 799],
  [980, 822],
] as const;
const binW = (sx: number, sy: number, b: number): Pt => {
  const p = propPoint(BSRC, {x: 0, y: 0, w: BW}, BINS[b][0], BINS[b][1]);
  return {x: sx + p.x, y: sy + p.y};
};
const TRAY_POLY: Array<[number, number]> = [
  [262, 98],
  [1332, 112],
  [1272, 350],
  [236, 322],
];
const trayLeft = propPoint(BSRC, HERO, 250, 215);
const DECK0: Pt = {x: trayLeft.x - 760, y: trayLeft.y - 150};
const TRIP0 = a18('one trip') - 4;
const TRIP1 = a18('the bridge', 1) + 2;
const NEXT_AT = a18('next token');
const GROUP_AT = a18('a group');
const BATCH_AT = a18('batch');
const BUSY_AT = a18('on a busy');
const OUR_AT = a18('our answer');
const JUST_AT = a18('just one');
const PULL0 = BUSY_AT - 2;
const PULL1 = OUR_AT + 22;
export const camBS: CamKey[] = [
  {f: CUT.W6, x: 760, y: 330, zoom: 1.16},
  {f: TRIP1 + 6, x: 820, y: 360, zoom: 1.12},
  {f: NEXT_AT + 8, x: 700, y: 660, zoom: 0.9, dur: 34},
  {f: BATCH_AT, x: 690, y: 680, zoom: 0.93, dur: 60},
  {f: PULL0, x: 690, y: 680, zoom: 0.94, dur: 20},
  {f: PULL1, x: 960, y: 640, zoom: 0.26, dur: PULL1 - PULL0},
  {f: CUT.W7 + 12, x: 960, y: 620, zoom: 0.235, dur: CUT.W7 + 12 - PULL1},
];
const WORDS3 = ['sky', 'so', 'and'];
const FieldTiles: React.FC<{frame: number}> = ({frame: f}) => {
  if (f < BUSY_AT - 10) return null;
  const nodes: React.ReactNode[] = [];
  STATIONS.forEach((s) => {
    for (let b = 0; b < 3; b++) {
      const per = 22 + Math.round(rr(`ft-p${s.i}-${b}`, 0, 10));
      const ph = Math.round(rr(`ft-o${s.i}-${b}`, 0, per));
      const t = (((f - BUSY_AT - ph) % per) + per) % per;
      const pt = binW(s.x, s.y, b);
      const u = clamp01(t / 10);
      const op = prog(f, BUSY_AT - 10, 20);
      if (t < 14)
        nodes.push(
          <div key={`${s.i}-${b}`} style={{position: 'absolute', left: pt.x - 30, top: lerp(pt.y - 260, pt.y - 20, u * u) - 30, width: 60, height: 60, borderRadius: 14, background: PAL.tile, opacity: op * (t < 10 ? 1 : 1 - (t - 10) / 4), boxShadow: `0 0 ${t >= 9 ? 50 : 0}px ${PAL.info}`}} />,
        );
    }
  });
  return <>{nodes}</>;
};
export const ShotBS: React.FC<{frame: number}> = ({frame: f}) => {
  const pose = poseAt(f, camBS);
  const ourBin = binW(HERO.x, HERO.y, 1);
  const ourS = toScreen(pose, ourBin.x, ourBin.y - 70);
  const field = prog(f, PULL0 + 4, 30, EASE.out);
  const crateU = prog(f, TRIP0, TRIP1 - TRIP0, EASE.inOut);
  const crateP = {x: lerp(DECK0.x, trayLeft.x + 30, crateU), y: lerp(DECK0.y, trayLeft.y - 10, crateU)};
  const dock = f >= TRIP1 ? Math.exp(-(f - TRIP1) / 8) : 0;
  const deckOp = 1 - prog(f, PULL0, 16);
  const bracket = prog(f, GROUP_AT, 14, EASE.out);
  return (
    <Stage
      frame={f}
      env={{kind: 'chip', pulses: 0.6, dust: 40}}
      cam={camBS}
      hud={
        <>
          <Words frame={f} items={[{t: 'Next', at: NEXT_AT - 4}, {t: 'token', at: a18('token for')}]} x={84} y={410} size={76} align="left" exitAt={BATCH_AT - 12} />
          <Words frame={f} items={[{t: 'for', at: a18('for every')}, {t: 'every', at: a18('every conversation')}]} x={84} y={500} size={76} align="left" exitAt={BATCH_AT - 12} />
          <Words frame={f} items={[{t: 'conversation', at: a18('conversation')}]} x={84} y={590} size={76} align="left" color={PAL.infoPale} exitAt={BATCH_AT - 12} />
          <KineticText frame={f} at={BATCH_AT} text="Batch" mode="slam" align="left" x={84} y={500} size={150} exitAt={BUSY_AT + 6} />
          <SafeLabel frame={f} at={OUR_AT} text="Our answer" x={ourS.x + 120} y={ourS.y - 170} to={ourS} side="right" size={64} />
          <Words
            frame={f}
            items={[
              {t: 'Just', at: JUST_AT},
              {t: 'one', at: a18('one of them')},
              {t: 'of', at: a18('of them')},
              {t: 'them', at: a18('them')},
            ]}
            x={960}
            y={160}
            size={92}
          />
        </>
      }
    >
      {/* the whole field of stations */}
      {STATIONS.map((s) =>
        s.hero ? null : (
          <div key={s.i} style={{position: 'absolute', left: 0, top: 0, opacity: field}}>
            <Prop frame={f} src={BSRC} x={s.x} y={s.y} w={BW} brightness={0.8} shadow={0.4} />
          </div>
        ),
      )}
      {/* the bridge deck into the hero tray */}
      {deckOp > 0.01 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: deckOp}}>
          <defs>
            <linearGradient id="bs-deck" x1={DECK0.x} y1={DECK0.y} x2={trayLeft.x} y2={trayLeft.y} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor={PAL.info} stopOpacity={0} />
              <stop offset="0.3" stopColor={PAL.info} stopOpacity={0.5} />
              <stop offset="1" stopColor={PAL.infoPale} stopOpacity={0.95} />
            </linearGradient>
          </defs>
          <path d={`M${DECK0.x} ${DECK0.y - 30} L${trayLeft.x} ${trayLeft.y - 30} L${trayLeft.x} ${trayLeft.y + 34} L${DECK0.x} ${DECK0.y + 34} Z`} fill={rgba('#0A4E63', 0.55)} />
          <line x1={DECK0.x} y1={DECK0.y - 30} x2={trayLeft.x} y2={trayLeft.y - 30} stroke="url(#bs-deck)" strokeWidth={6} />
          <line x1={DECK0.x} y1={DECK0.y + 34} x2={trayLeft.x} y2={trayLeft.y + 34} stroke="url(#bs-deck)" strokeWidth={6} />
          {Array.from({length: 7}, (_, i) => {
            const u = ((f * 0.03 + i / 7) % 1 + 1) % 1;
            return <circle key={i} cx={lerp(DECK0.x, trayLeft.x, u)} cy={lerp(DECK0.y, trayLeft.y, u)} r={5} fill={PAL.infoPale} opacity={0.8 * Math.sin(Math.PI * u)} />;
          })}
          {f >= TRIP0 - 2 && f < TRIP1 + 6 ? (
            <g transform={`translate(${crateP.x} ${crateP.y}) scale(${f >= TRIP1 ? 1 - prog(f, TRIP1, 6) : 1})`}>
              <IsoCrate s={150} />
            </g>
          ) : null}
        </svg>
      ) : null}
      <Prop
        frame={f}
        src={BSRC}
        x={HERO.x}
        y={HERO.y}
        w={BW}
        rim={{color: PAL.info, strength: 0.6}}
        sweep={{every: 130, offset: 30}}
        shadow={0.5}
        highlight={[
          {region: {shape: 'poly', pts: TRAY_POLY}, at: TRIP1, until: TRIP1 + 40, color: PAL.info, mode: 'glow'},
        ]}
      >
        {dock > 0.02 ? (
          <svg width={1448} height={1086} style={{position: 'absolute', left: 0, top: 0}}>
            <polygon points={TRAY_POLY.map((p) => p.join(',')).join(' ')} fill={rgba('#FFFFFF', 0.45 * dock)} />
          </svg>
        ) : null}
      </Prop>
      {/* one trip → the next token for every conversation */}
      {WORDS3.map((w, b) => {
        const p = binW(HERO.x, HERO.y, b);
        return <TokenTile key={b} frame={f} text={w} x={p.x} y={p.y - 30} size={50} snapAt={NEXT_AT + 4} from={{dy: -300, rot: -10 + b * 8}} newest={b === 1 ? 1 : 0} />;
      })}
      {BINS.map((_, b) => {
        const p = binW(HERO.x, HERO.y, b);
        const a = NEXT_AT + 16 + b * 3;
        if (f < a) return null;
        return (
          <div key={`g${b}`} style={{position: 'absolute', left: p.x, top: p.y + 150, width: 0, height: 0, transform: `scale(${Math.max(0, springAt(f, a, SPRING.pop))})`}}>
            <ChatGlyph s={70} lines={b + 1} fill={b === 1 ? '#1E3C5E' : '#26365A'} color={b === 1 ? PAL.info : PAL.ink} />
          </div>
        );
      })}
      {bracket > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: 1 - prog(f, PULL0, 12)}}>
          {(() => {
            const a = binW(HERO.x, HERO.y, 0);
            const c = binW(HERO.x, HERO.y, 2);
            const y = Math.max(a.y, c.y) + 230;
            const x0 = a.x - 150;
            const x1 = lerp(x0, c.x + 150, bracket);
            return (
              <g>
                <path d={`M${x0} ${y - 26} V${y} H${x1} V${y - 26}`} fill="none" stroke={PAL.info} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                <path d={`M${x0} ${y - 26} V${y} H${x1} V${y - 26}`} fill="none" stroke={PAL.info} strokeWidth={22} opacity={0.25} />
              </g>
            );
          })()}
        </svg>
      ) : null}
      <FieldTiles frame={f} />
      {f >= OUR_AT - 6 ? (
        <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <BitHead x={ourBin.x} y={ourBin.y - 150 + 8 * Math.sin(f / 7)} size={60} gid="s7-ourbit" />
        </svg>
      ) : null}
    </Stage>
  );
};

/* ================================================================ BITS: NVIDIA's benchmark, 8 bits per weight, short prompts */
const GPU = 'BIM129_T03_datacenter-gpu_a' as const;
const HOLD = 'BIM166_T03_bf16-holder_b' as const;
export const BITS_SWAP = a18('take a version');
const dieC = (() => {
  const r = REGIONS.gpuA_die;
  return regionCenter(r);
})();
export const ShotGPU: React.FC<{frame: number}> = ({frame: f}) => {
  const P = {x: 960, y: 580, w: 1040};
  const cam: CamKey[] = [
    {f: CUT.W7, x: 960, y: 560, zoom: 1.0},
    {f: BITS_SWAP + 4, x: 990, y: 540, zoom: 1.12},
  ];
  const d = propPoint(GPU, P, dieC.x, dieC.y);
  const ds = toScreen(poseAt(f, cam), d.x, d.y);
  return (
    <Stage frame={f} env={{kind: 'night', grid: true, dust: 50}} cam={cam} hud={<SafeLabel frame={f} at={a18("nvidia's")} text="NVIDIA's benchmark" x={ds.x + 220} y={ds.y - 300} to={ds} side="right" size={76} />}>
      <Prop frame={f} src={GPU} x={P.x} y={P.y} w={P.w} tiltX={7} rim={{color: PAL.info, strength: 0.6}} sweep={{every: 60, offset: 4}} float={4} />
    </Stage>
  );
};
const HB = assetBox(HOLD);
const HK = 1300 / HB.cw;
const HY = 690;
const SLOT_X = [299, 462, 625, 795, 965, 1128, 1294, 1470];
const RAIL_Y = [240, 610];
const BITS8 = a18('8 bits');
const DROP = a18('bits per') + 8;
const ShortTiles = ['Name', 'a', 'color'];
export const ShotBits: React.FC<{frame: number}> = ({frame: f}) => {
  const cam: CamKey[] = [
    {f: BITS_SWAP - 2, x: 960, y: 560, zoom: 1.06},
    {f: CUT.W8 + 12, x: 940, y: 600, zoom: 1.14},
  ];
  const lights = (rail: number) => (
    <svg width={HB.w} height={HB.h} viewBox={`0 0 ${HB.w} ${HB.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {SLOT_X.map((x, i) => {
        const on = prog(f, BITS_SWAP + 2 + rail * 10 + i * 2, 5, EASE.out) * (rail === 1 ? 1 - prog(f, BITS8 + 2, 6) : 1);
        return (
          <g key={i} opacity={on}>
            <rect x={x - 58} y={RAIL_Y[rail] - 72} width={116} height={144} rx={12} fill={rgba(PAL.info, 0.35)} />
            <rect x={x - 26} y={RAIL_Y[rail] - 40} width={52} height={80} rx={8} fill={PAL.infoPale} opacity={0.9} />
          </g>
        );
      })}
    </svg>
  );
  const dropU = prog(f, DROP, 22, EASE.inCubic);
  const cx = 960 + (887 - HB.cx) * HK;
  const topY = HY + (215 - HB.cy) * HK;
  const botY = HY + (658.5 - HB.cy) * HK;
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 50}}
      cam={cam}
      hud={
        <>
          <Words
            frame={f}
            items={[
              {t: 'A', at: a18('a version')},
              {t: 'version', at: a18('version')},
              {t: 'of', at: a18('of the model')},
              {t: 'the', at: a18('the model')},
              {t: 'model', at: a18('model stored')},
            ]}
            x={960}
            y={150}
            size={92}
            exitAt={BITS8 - 9}
          />
          <Words
            frame={f}
            items={[
              {t: '8', at: BITS8},
              {t: 'bits', at: a18('bits')},
              {t: 'per', at: a18('per wait')},
              {t: 'weight', at: a18('wait', 2)},
            ]}
            x={960}
            y={150}
            size={100}
          />
          <Words
            frame={f}
            items={[
              {t: 'instead', at: a18('instead')},
              {t: 'of', at: a18('of 16')},
              {t: '16', at: a18('16')},
            ]}
            x={960}
            y={266}
            size={68}
            color={PAL.wait}
          />
          <Words frame={f} items={[{t: 'Short', at: a18('short prompts')}, {t: 'prompts', at: a18('prompts')}]} x={1070} y={850} size={72} align="left" />
        </>
      }
    >
      <CropImg src={HOLD} crop={{x0: 0, y0: 0, x1: 1774, y1: 430}} x={cx} y={topY} w={1774 * HK} rim={PAL.info}>
        {lights(0)}
      </CropImg>
      {dropU < 1 ? (
        <CropImg src={HOLD} crop={{x0: 0, y0: 430, x1: 1774, y1: 887}} x={cx} y={botY} w={1774 * HK} dy={dropU * 420} op={1 - dropU}>
          {lights(1)}
        </CropImg>
      ) : null}
      <TileRow frame={f} tokens={ShortTiles} x={700} y={850} size={58} snapAt={{start: a18('short prompts') - 6, every: 4}} marker={false} />
    </Stage>
  );
};

/* ================================================================ X60: 1 request vs 200 requests */
const X60_IN = CUT.W8 + 12;
const SINGLE = 'BIM179_T03_batch-station_c' as const;
const SBIN = {x: 470, y: 600, w: 420};
const SBIN_IN = propPoint(SINGLE, SBIN, 600, 470);
const MINI = Array.from({length: 200}, (_, i) => ({i, c: i % 20, r: Math.floor(i / 20), per: 14 + Math.round(rr(`mb-p${i}`, 0, 6)), ph: Math.round(rr(`mb-o${i}`, 0, 20))}));
const MB = assetBox(SINGLE);
export const ShotX60: React.FC<{frame: number}> = ({frame: f}) => {
  const t1 = ((f % 6) + 6) % 6;
  const drop = clamp01(t1 / 5);
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: false, dust: 40}}
      hud={
        <>
          <Words frame={f} items={[{t: '1', at: a18('200') - 2}, {t: 'request', at: a18('200') + 1}]} x={470} y={165} size={72} />
          <Words frame={f} items={[{t: '200', at: a18('200')}, {t: 'requests', at: a18('requests')}]} x={1440} y={165} size={72} />
          <KineticText frame={f} at={a18('60 times')} text="×60" mode="slam" x={1440} y={330} size={230} />
          <Words
            frame={f}
            items={[
              {t: 'tokens', at: a18('tokens a second')},
              {t: 'a', at: a18('a second')},
              {t: 'second', at: a18('second')},
            ]}
            x={1440}
            y={482}
            size={56}
          />
        </>
      }
    >
      {/* divider */}
      <div style={{position: 'absolute', left: 958, top: 60, width: 4, height: 960, borderRadius: 2, background: `linear-gradient(180deg, rgba(0,0,0,0), ${rgba(PAL.structure, 0.6)}, rgba(0,0,0,0))`}} />
      {/* left: one request */}
      <Prop frame={f} src={SINGLE} x={SBIN.x} y={SBIN.y} w={SBIN.w} rim={{color: PAL.info, strength: 0.5}} sweep={{every: 90}} shadow={0.5} />
      <div style={{position: 'absolute', left: SBIN_IN.x, top: lerp(SBIN_IN.y - 300, SBIN_IN.y, drop * drop), width: 0, height: 0, opacity: t1 < 5 ? 1 : 0}}>
        <TokenTile frame={f} text="" x={0} y={0} size={34} w={44} />
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {Array.from({length: 16}, (_, k) => {
          const x = 90 + ((f * 8 + k * 48) % 780);
          return <rect key={k} x={x} y={905} width={20} height={20} rx={5} fill={PAL.tile} opacity={0.9} />;
        })}
      </svg>
      {/* right: 200 requests, a 2.5D crowd of real bins (back rows smaller), every bin fed in turn */}
      {MINI.map((m) => {
        const depth = m.r / 9;
        const s = lerp(0.62, 1.12, depth);
        const bw = 40 * s;
        const rowY = 560 + lerp(0, 300, Math.pow(depth, 1.15));
        const x = 1440 + (m.c - 9.5) * 45 * s;
        const t = (((f - m.ph) % m.per) + m.per) % m.per;
        const hit = t < 5 ? 1 - t / 5 : 0;
        const k = bw / MB.cw;
        return (
          <div key={m.i} style={{position: 'absolute', left: x - MB.cx * k, top: rowY - MB.cy * k, width: MB.w * k, height: MB.h * k, filter: `brightness(${0.62 + 0.38 * depth + 0.9 * hit})`}}>
            <Img src={assetUrl(SINGLE)} style={{position: 'absolute', left: 0, top: 0, width: MB.w * k, height: MB.h * k}} />
            {t < 6 ? <div style={{position: 'absolute', left: (600 - 30) * k * 1.0, top: (430 - 140 * (1 - t / 6)) * k, width: 150 * k, height: 150 * k, borderRadius: 30 * k, background: PAL.tile, boxShadow: `0 0 ${60 * k}px ${PAL.info}`}} /> : null}
          </div>
        );
      })}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
        {[0, 1, 2].flatMap((row) =>
          Array.from({length: 58}, (_, k) => {
            const x = 1010 + ((f * 9 + k * 15 + row * 6) % 870);
            return <rect key={`${row}-${k}`} x={x} y={890 + row * 14} width={11} height={10} rx={3} fill={(k + row) % 9 === 0 ? PAL.info : PAL.tile} opacity={0.9 - row * 0.15} />;
          }),
        )}
      </svg>
    </Stage>
  );
};

/* ================================================================ GAP: each person's tokens almost ×3 further apart */
const GAP_IN = CUT.F5;
const LANES = [
  {y: 395, every: 10, label: '1 request', c: PAL.info},
  {y: 735, every: 27, label: '200 requests', c: PAL.wait},
];
const SPEED = 10;
const EMIT_X = 1760;
export const ShotGap: React.FC<{frame: number}> = ({frame: f}) => {
  const cam: CamKey[] = [
    {f: GAP_IN - 12, x: 960, y: 560, zoom: 1.0},
    {f: CUT.W9 + 12, x: 1010, y: 580, zoom: 1.08},
  ];
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 50}}
      cam={cam}
      hud={
        <Words
          frame={f}
          items={[
            {t: 'almost', at: a18('almost')},
            {t: '×3', at: a18('three times'), color: PAL.wait},
            {t: 'further', at: a18('further')},
            {t: 'apart', at: a18('apart')},
          ]}
          x={960}
          y={556}
          size={104}
        />
      }
    >
      {LANES.map((L, li) => {
        const nodes: React.ReactNode[] = [];
        const t0 = GAP_IN - 400;
        const nMax = Math.floor((f - t0) / L.every);
        const xs: number[] = [];
        for (let n = nMax; n >= 0; n--) {
          const e = t0 + n * L.every;
          const x = EMIT_X - (f - e) * SPEED;
          if (x < 560) break;
          xs.push(x);
          const age = f - e;
          const pop = age < 8 ? springAt(f, e, SPRING.pop) : 1;
          nodes.push(
            <div key={n} style={{position: 'absolute', left: x, top: L.y, width: 0, height: 0, transform: `scale(${Math.max(0, pop)})`}}>
              <TokenTile frame={f} text="" x={0} y={0} size={58} w={76} newest={age < 6 ? 1 - age / 6 : 0} />
            </div>,
          );
        }
        const lastE = t0 + nMax * L.every;
        const pulse = Math.exp(-(f - lastE) / 4);
        return (
          <React.Fragment key={li}>
            <div style={{position: 'absolute', left: 560, top: L.y + 56, width: EMIT_X - 560, height: 6, borderRadius: 3, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(PAL.structure, 0.6)})`}} />
            {nodes}
            <div style={{position: 'absolute', left: 120, top: L.y - 6, transform: 'translateY(-50%)', fontFamily: 'inherit'}}>
              <Words frame={f} items={[{t: L.label, at: GAP_IN - 20}]} x={0} y={0} size={56} align="left" backing="none" color={PAL.annotation} weight={600} />
            </div>
            <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              {xs.slice(0, -1).map((x, k) => {
                const x2 = xs[k + 1];
                if (x2 === undefined) return null;
                const yb = L.y - 80;
                return <path key={k} d={`M${x} ${yb + 14} V${yb} H${x2} V${yb + 14}`} fill="none" stroke={L.c} strokeWidth={5} opacity={0.85} strokeLinejoin="round" strokeLinecap="round" />;
              })}
              <BitHead x={EMIT_X + 80} y={L.y} size={36 * (1 + 0.35 * pulse)} gid={`s7-gap-${li}`} />
            </svg>
          </React.Fragment>
        );
      })}
    </Stage>
  );
};

/* ================================================================ TRADE: the tradeoff you can feel */
// Two sides of one batch. Left, the server: a batch station raining tokens into every bin while its throughput bar
// fills to ×60 ("each token: cheaper"). Right, you: your own tokens travel a lane to you, and as the batch grows the
// gaps between them stretch ×3 ("your stream: slower"). Keywords slam in on their words; everything keeps moving.
const SLOW_AT = a18('but they') - 2;
const BIG_AT = a18('bigger batches');
const TR_STATION = {x: 468, y: 760, w: 720};
const LANE = {x0: 1000, x1: 1630, y: 690, v: 11};
/** spawn times of YOUR tokens: every 8 f, stretching to every 24 f (×3) once the batch grows */
const YOUR_T = (() => {
  const out: number[] = [];
  let t = CUT.W9 - 140;
  while (t < 15160) {
    out.push(Math.round(t));
    t += t < SLOW_AT ? 8 : lerp(8, 24, clamp01((t - SLOW_AT) / 62));
  }
  return out;
})();
/** drop times into each bin of the server: every 7 f, speeding to every 3 f as the batch grows */
const RAIN_T = [0, 1, 2].map((b) => {
  const out: number[] = [];
  let t = CUT.W9 - 60 + b * 3;
  while (t < 15160) {
    out.push(Math.round(t));
    t += lerp(7, 3, clamp01((t - BIG_AT) / 49));
  }
  return out;
});
const PersonGlyph: React.FC<{x: number; y: number; s: number; wait: number}> = ({x, y, s, wait}) => (
  <svg width={s * 2} height={s * 2} viewBox="-50 -50 100 100" style={{position: 'absolute', left: x - s, top: y - s, overflow: 'visible'}}>
    <circle cx={0} cy={0} r={46} fill={rgba('#0A1426', 0.85)} stroke={rgba(PAL.structure, 0.6)} strokeWidth={3} />
    <circle cx={0} cy={-12} r={14} fill={PAL.ink} />
    <path d="M-26 30 Q0 2 26 30 Z" fill={PAL.ink} />
    {wait > 0 ? <circle cx={0} cy={0} r={46} fill="none" stroke={PAL.wait} strokeWidth={6} strokeDasharray={`${289 * wait} 290`} transform="rotate(-90)" strokeLinecap="round" /> : null}
  </svg>
);
export const camTR: CamKey[] = [
  {f: CUT.W9, x: 960, y: 540, zoom: 1},
  {f: 15071, x: 985, y: 548, zoom: 1.045},
  {f: 15091, x: 1420, y: 690, zoom: 2.0, dur: 20, ease: 'inCubic'},
  {f: 15121, x: 1500, y: 690, zoom: 4.2, dur: 30, ease: 'linear'},
];
export const ShotTrade: React.FC<{frame: number}> = ({frame: f}) => {
  const fill = lerp(1 / 60, 1, prog(f, BIG_AT, 49, EASE.out));
  // the waiting ring on "you": how far through the current gap
  let last = YOUR_T[0];
  let next = YOUR_T[1];
  for (let i = 0; i < YOUR_T.length - 1; i++) {
    const arrive = YOUR_T[i] + (LANE.x1 - LANE.x0) / LANE.v;
    const arriveN = YOUR_T[i + 1] + (LANE.x1 - LANE.x0) / LANE.v;
    if (f >= arrive && f < arriveN) {
      last = arrive;
      next = arriveN;
      break;
    }
  }
  const wait = next - last > 12 ? clamp01((f - last) / Math.max(1, next - last)) : 0;
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 50}}
      cam={camTR}
      hud={
        <>
          <KineticText frame={f} at={a18('the tradeoff')} text="The tradeoff" mode="slam" x={960} y={190} size={120} exitAt={a18('each token') - 12} />
          <KineticText frame={f} at={a18('each token')} text="Each token:" mode="slam" x={505} y={138} size={76} backing="none" />
          <KineticText frame={f} at={a18('cheaper')} text="cheaper ✓" mode="slam" x={505} y={240} size={112} color={PAL.infoPale} backing="none" />
          <KineticText frame={f} at={a18('your own')} text="Your stream:" mode="slam" x={1420} y={138} size={76} backing="none" accent={PAL.wait} />
          <KineticText frame={f} at={a18('slower')} text="slower" mode="slam" x={1420} y={240} size={112} color={PAL.wait} backing="none" accent={PAL.wait} />
          <KineticText frame={f} at={a18('cheaper') - 2} text="×60" mode="slam" align="left" x={700} y={392} size={128} color={PAL.infoPale} backing="none" />
          <KineticText frame={f} at={a18('slower') + 2} text="×3" mode="slam" x={1310} y={468} size={128} color={PAL.wait} backing="none" accent={PAL.wait} />
        </>
      }
    >
      {/* divider */}
      <div style={{position: 'absolute', left: 957, top: 330, width: 6, height: 640, borderRadius: 3, background: `linear-gradient(180deg, rgba(0,0,0,0), ${rgba(PAL.structure, 0.55)}, rgba(0,0,0,0))`}} />
      {/* LEFT: the server's throughput */}
      <div style={{position: 'absolute', left: 96, top: 370, width: 584, height: 46, borderRadius: 23, background: rgba('#0A1426', 0.9), border: `3px solid ${rgba(PAL.structure, 0.55)}`}}>
        <div style={{position: 'absolute', left: 4, top: 4, height: 32, width: Math.max(16, 570 * fill), borderRadius: 16, background: `linear-gradient(90deg, ${PAL.infoWake}, ${PAL.info})`, boxShadow: `0 0 26px ${rgba(PAL.info, 0.85)}`}} />
        <div style={{position: 'absolute', left: Math.max(16, 570 * fill) - 10, top: -8, width: 20, height: 56, borderRadius: 8, background: PAL.infoPale, opacity: 0.6 + 0.4 * Math.sin(f / 3), boxShadow: `0 0 20px ${PAL.info}`}} />
      </div>
      <Prop frame={f} src={BSRC} x={TR_STATION.x} y={TR_STATION.y} w={TR_STATION.w} rim={{color: PAL.info, strength: 0.6}} sweep={{every: 70, offset: 20}} shadow={0.5} />
      {RAIN_T.map((ts, b) => {
        const bin = propPoint(BSRC, TR_STATION, BINS[b][0], BINS[b][1]);
        return ts.map((t, k) => {
          const age = f - t;
          if (age < 0 || age > 12) return null;
          const u = clamp01(age / 9);
          const y = lerp(bin.y - 200, bin.y - 18, u * u);
          return <div key={`${b}-${k}`} style={{position: 'absolute', left: bin.x + 10, top: y - 18, width: 36, height: 36, borderRadius: 8, background: PAL.tile, opacity: age < 9 ? 1 : 1 - (age - 9) / 3, boxShadow: age >= 8 ? `0 0 30px ${PAL.info}` : '0 8px 12px rgba(0,0,0,0.5)'}} />;
        });
      })}
      {/* the route from our bin to your lane: a pulse rides it for each of your tokens */}
      {(() => {
        const ob = propPoint(BSRC, TR_STATION, BINS[1][0], BINS[1][1]);
        const d = `M${ob.x} ${ob.y - 40} C ${ob.x + 260} ${ob.y - 260}, ${LANE.x0 - 300} ${LANE.y + 10}, ${LANE.x0 - 24} ${LANE.y}`;
        const pts = YOUR_T.filter((t) => f >= t - 14 && f < t);
        return (
          <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
            <path d={d} fill="none" stroke={rgba(PAL.info, 0.35)} strokeWidth={4} strokeDasharray="10 12" strokeDashoffset={-f * 2} />
            {pts.map((t) => {
              const u = clamp01((f - (t - 14)) / 14);
              const P0 = {x: ob.x, y: ob.y - 40};
              const C1 = {x: ob.x + 260, y: ob.y - 260};
              const C2 = {x: LANE.x0 - 300, y: LANE.y + 10};
              const P3 = {x: LANE.x0 - 24, y: LANE.y};
              const m = 1 - u;
              const x = m * m * m * P0.x + 3 * m * m * u * C1.x + 3 * m * u * u * C2.x + u * u * u * P3.x;
              const y = m * m * m * P0.y + 3 * m * m * u * C1.y + 3 * m * u * u * C2.y + u * u * u * P3.y;
              return <circle key={t} cx={x} cy={y} r={9} fill={PAL.infoPale} style={{filter: `drop-shadow(0 0 8px ${PAL.info})`}} />;
            })}
            <circle cx={ob.x} cy={ob.y - 40} r={14} fill="none" stroke={PAL.info} strokeWidth={4} opacity={0.6 + 0.4 * Math.sin(f / 5)} />
          </svg>
        );
      })()}
      {/* RIGHT: your stream */}
      <div style={{position: 'absolute', left: LANE.x0 - 20, top: LANE.y + 80, width: LANE.x1 - LANE.x0 + 40, height: 8, borderRadius: 4, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(PAL.structure, 0.65)})`}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {(() => {
          const xs: number[] = [];
          YOUR_T.forEach((t) => {
            const x = LANE.x0 + (f - t) * LANE.v;
            if (f >= t && x <= LANE.x1) xs.push(x);
          });
          xs.sort((a, b) => a - b);
          return xs.slice(1).map((x, k) => {
            const x0 = xs[k];
            if (x - x0 < 130) return null;
            return <path key={k} d={`M${x0} ${LANE.y - 90} V${LANE.y - 116} H${x} V${LANE.y - 90}`} fill="none" stroke={PAL.wait} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />;
          });
        })()}
      </svg>
      {YOUR_T.map((t, k) => {
        if (f < t) return null;
        const x = LANE.x0 + (f - t) * LANE.v;
        if (x > LANE.x1 + 30) return null;
        const pop = Math.min(1, springAt(f, t, SPRING.snap));
        const late = t >= SLOW_AT;
        return (
          <div key={k} style={{position: 'absolute', left: x, top: LANE.y, width: 0, height: 0, opacity: x > LANE.x1 ? 1 - (x - LANE.x1) / 30 : 1, transform: `scale(${0.4 + 0.6 * pop})`}}>
            <TokenTile frame={f} text="" x={0} y={0} size={86} w={78} newest={late ? 0 : 0.35} />
          </div>
        );
      })}
      <PersonGlyph x={1758} y={LANE.y} s={98} wait={wait} />
    </Stage>
  );
};
export {osc, Img, assetUrl};
