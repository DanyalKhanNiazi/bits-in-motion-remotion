/**
 * S7 wait 2 (P17): a chat getting long, the running notes (KV tray), notes riding the Bridge, the whole conversation
 * as the prompt, ≈1 GB per 8,000 tokens (one set per conversation) and the growing haul.
 */
import React from 'react';
import {
  Bridge,
  Counter,
  Crate,
  EASE,
  Footnote,
  KineticText,
  Label,
  PAL,
  Prop,
  REGIONS,
  SET,
  SPRING,
  ScreenSlot,
  Stage,
  basis,
  bridgeAnchors,
  bridgeCam,
  clamp,
  clamp01,
  faceQuad,
  lerp,
  lightOf,
  mixHex,
  osc,
  plateToStage,
  polyD,
  poseAt,
  project,
  prog,
  propPoint,
  rgba,
  rr,
  shadeHex,
  smooth,
  springAt,
  toScreen,
  visibleFaces,
  type BridgeProps,
  type CamKey,
  type KenBurns,
  type V3,
} from '../../kit';
import {ChatChrome, ChatGlyph, CropImg, NoteCard, SafeLabel, Skel, Words, a17, CUT, DIVE, type Pt} from './lib';

/* ================================================================ K1: the chat grows; running notes drop into the KV tray */
const MON = {x: 960, y: 318, w: 880};
const KVT = {x: 960, y: 1000, w: 1100};
const KV_SRC = 'BIM173_T03_kv-tray_a' as const;
const MON_SRC = 'BIM150_T03_reader-monitor_b' as const;
// notes compartment of BIM173 (native px): back-left, back-right, front-right, front-left
const CQ: Array<[number, number]> = [
  [228, 352],
  [560, 240],
  [978, 520],
  [648, 694],
];
const compPt = (u: number, v: number): [number, number] => {
  const a = [lerp(CQ[0][0], CQ[1][0], u), lerp(CQ[0][1], CQ[1][1], u)];
  const b = [lerp(CQ[3][0], CQ[2][0], u), lerp(CQ[3][1], CQ[2][1], u)];
  return [lerp(a[0], b[0], v), lerp(a[1], b[1], v)];
};
const compWorld = (u: number, v: number): Pt => {
  const [nx, ny] = compPt(u, v);
  return propPoint(KV_SRC, KVT, nx, ny);
};
const K1_IN = CUT.D2 + DIVE;
const TILT_AT = a17('to avoid');
const DROP0 = a17('the model keeps') - 4;
const NOTES_AT = a17('running notes');
const NUM_AT = a17('the numbers it');
const COMP_C = compWorld(0.5, 0.5);
export const camK1: CamKey[] = [
  {f: K1_IN, x: 960, y: 330, zoom: 1.3},
  {f: TILT_AT, x: 960, y: 342, zoom: 1.36},
  {f: TILT_AT + 50, x: 960, y: 700, zoom: 0.9, dur: 50},
  {f: NUM_AT - 14, x: 960, y: 740, zoom: 0.98, dur: NUM_AT - 14 - TILT_AT - 50},
  {f: NUM_AT + 18, x: COMP_C.x + 40, y: COMP_C.y - 40, zoom: 1.7, dur: 32},
  {f: CUT.F2 + 2, x: COMP_C.x + 60, y: COMP_C.y - 50, zoom: 1.82, dur: 22},
];

// the chat on the monitor (slot px 1260×615)
const TURN_AT = (i: number) => K1_IN - 30 + i * 5;
const TURNS = Array.from({length: 18}, (_, i) => ({user: i % 2 === 0, lines: i % 2 === 0 ? 1 : 2 + (i % 3), h: i % 2 === 0 ? 60 : 50 + 32 * (2 + (i % 3))}));
const LongChat: React.FC<{frame: number}> = ({frame: f}) => {
  const W = 1260;
  const H = 615;
  const view = H - 52 - 74;
  let y = 16;
  const items: React.ReactNode[] = [];
  let shownBottom = 0;
  TURNS.forEach((t, i) => {
    const a = TURN_AT(i);
    const sp = f >= a ? springAt(f, a, SPRING.snap) : 0;
    if (f >= a - 1) {
      items.push(
        <div key={i} style={{position: 'absolute', left: 0, top: y, width: W, height: t.h, opacity: clamp01(sp * 2), transform: `translateY(${(1 - Math.min(1, sp)) * 24}px)`}}>
          {t.user ? (
            <div style={{position: 'absolute', right: 34, top: 0, width: 360, height: 48, borderRadius: 22, borderBottomRightRadius: 6, background: '#26365A', padding: '16px 22px', boxSizing: 'border-box'}}>
              <Skel seed={`u${i}`} lines={1} width={300} h={14} color={rgba(PAL.ink, 0.6)} last={0.8} />
            </div>
          ) : (
            <>
              <div style={{position: 'absolute', left: 34, top: 2, width: 34, height: 34, borderRadius: 9, background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`}} />
              <div style={{position: 'absolute', left: 90, top: 8}}>
                <Skel seed={`a${i}`} lines={t.lines} width={980} h={15} gap={17} color={rgba(PAL.annotation, 0.5)} />
              </div>
            </>
          )}
        </div>,
      );
      shownBottom = y + t.h;
    }
    y += t.h + 18;
  });
  const scroll = Math.max(0, shownBottom - view + 10);
  const total = y;
  const thumb = clamp(view / Math.max(view, total) * view * 1.4, 60, view);
  return (
    <ChatChrome w={W} h={H}>
      <div style={{position: 'absolute', left: 0, top: 0, width: W, height: view, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, top: -scroll, width: W, height: total}}>{items}</div>
      </div>
      <div style={{position: 'absolute', right: 8, top: 6, width: 8, height: view - 12, borderRadius: 4, background: rgba(PAL.structure, 0.12)}}>
        <div style={{position: 'absolute', left: 0, top: (view - 12 - thumb) * clamp01(scroll / Math.max(1, total - view)), width: 8, height: thumb, borderRadius: 4, background: rgba(PAL.structure, 0.5)}} />
      </div>
    </ChatChrome>
  );
};

// note cards falling from the chat into the tray
const NOTES = Array.from({length: 26}, (_, k) => {
  const sx = rr(`nk-x${k}`, 120, 1140);
  const sy = rr(`nk-y${k}`, 120, 470);
  const u = ((k * 7) % 6 + 0.5) / 6;
  const v = (Math.floor(k / 6) % 4 + 0.5) / 4;
  return {k, sx, sy, u, v, t0: DROP0 + Math.round(k * 2.6), tab: (k % 3 === 1 ? 'magenta' : 'cyan') as 'cyan' | 'magenta'};
});
const NotesFall: React.FC<{frame: number}> = ({frame: f}) => (
  <>
    {NOTES.map((n) => {
      const dur = 18;
      if (f < n.t0 || f > n.t0 + dur + 10) return null;
      const s0 = propPoint(MON_SRC, MON, 138 + n.sx, 91 + n.sy);
      const e = compWorld(n.u, n.v);
      const u = prog(f, n.t0, dur, EASE.inCubic);
      const x = lerp(s0.x, e.x, u) + Math.sin(u * Math.PI) * rr(`nk-c${n.k}`, -60, 60);
      const y = lerp(s0.y, e.y, u);
      const landed = f >= n.t0 + dur;
      const ring = f - n.t0 - dur;
      return (
        <div key={n.k} style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
          {!landed ? (
            <div style={{transform: `rotate(${(1 - u) * rr(`nk-r${n.k}`, -40, 40)}deg) scale(${lerp(0.7, 1, u)})`}}>
              <NoteCard w={30} h={42} tab={n.tab} glow={0.6} />
            </div>
          ) : ring < 10 ? (
            <div style={{position: 'absolute', left: -30, top: -18, width: 60, height: 36, borderRadius: '50%', border: `3px solid ${rgba(n.tab === 'cyan' ? PAL.info : PAL.emphasis, 1 - ring / 10)}`, transform: `scale(${0.6 + 0.8 * (ring / 10)})`}} />
          ) : null}
        </div>
      );
    })}
  </>
);

const LiftCard: React.FC<{frame: number}> = ({frame: f}) => {
  if (f < NUM_AT - 4) return null;
  const u = prog(f, NUM_AT - 4, 20, EASE.outExpo);
  const c = compWorld(0.55, 0.45);
  const x = lerp(c.x, c.x + 260, u);
  const y = lerp(c.y, c.y - 130, u);
  const s = lerp(1, 4.4, u);
  const bars = Array.from({length: 7}, (_, i) => ({w: rr(`lc-${i}`, 0.35, 0.95), c: i % 3 === 2 ? PAL.emphasis : PAL.info}));
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${s}) rotate(${lerp(-12, -4, u)}deg)`}}>
      <NoteCard w={34} h={48} tab="cyan" glow={0.8} />
      <div style={{position: 'absolute', left: -12, top: -10, width: 24, height: 32}}>
        {bars.map((b, i) => (
          <div key={i} style={{position: 'absolute', left: 0, top: i * 4.4, width: 24 * b.w * prog(f, NUM_AT + 6 + i * 2, 8, EASE.out), height: 2.4, borderRadius: 1.2, background: b.c, boxShadow: `0 0 2px ${b.c}`}} />
        ))}
      </div>
    </div>
  );
};

export const ShotK1: React.FC<{frame: number}> = ({frame: f}) => {
  const pose = poseAt(f, camK1);
  const comp = toScreen(pose, COMP_C.x, COMP_C.y - 20);
  const cardS = (() => {
    const c = compWorld(0.55, 0.45);
    return toScreen(pose, c.x + 260, c.y - 130);
  })();
  return (
    <Stage
      frame={f}
      env={{kind: 'night', warm: 0.6, grid: true, dust: 50}}
      cam={camK1}
      hud={
        <>
          <SafeLabel frame={f} at={NOTES_AT} exitAt={NUM_AT - 6} text="Running notes" x={comp.x - 300} y={comp.y - 170} to={comp} side="left" size={64} />
          <SafeLabel frame={f} at={a17('numbers', 1)} text="Numbers already worked out" x={cardS.x - 190} y={cardS.y + 270} to={{x: cardS.x - 60, y: cardS.y + 70}} side="left" size={58} />
        </>
      }
    >
      <Prop frame={f} src={MON_SRC} x={MON.x} y={MON.y} w={MON.w} shadow={0.4}>
        <ScreenSlot rect={REGIONS.monitorScreen}>
          <LongChat frame={f} />
        </ScreenSlot>
      </Prop>
      <Prop
        frame={f}
        src={KV_SRC}
        x={KVT.x}
        y={KVT.y}
        w={KVT.w}
        rim={{color: PAL.info, strength: 0.5}}
        sweep={{every: 120, offset: 10}}
        highlight={[{region: {shape: 'poly', pts: CQ}, at: NOTES_AT - 2, color: PAL.info, mode: 'glow'}]}
      />
      <NotesFall frame={f} />
      <LiftCard frame={f} />
    </Stage>
  );
};

/* ================================================================ the Bridge with note piles riding on the crates */
type CrateS = {k: number; x: number; z: number; s: number; h: number; op: number};
export const crateStates = (p: {crateRate: number; travel: number; bandwidth: number; crateScale?: number}, f: number): CrateS[] => {
  const Wd = lerp(1.0, 3.4, clamp01(p.bandwidth));
  const nL = clamp(Math.floor(Wd / (0.72 * 1.3)), 1, 4);
  const cS = 0.72 * (p.crateScale ?? 1);
  const cH = 0.56 * (p.crateScale ?? 1);
  const laneZ = (l: number) => -Wd / 2 + ((l + 0.5) * Wd) / nL;
  const P = 30 / Math.max(0.2, p.crateRate);
  const xa = SET.tower.x1;
  const xb = SET.die.x0;
  const out: CrateS[] = [];
  const kMin = Math.ceil((f - p.travel - 8) / P) - 1;
  const kMax = Math.floor(f / P);
  for (let k = kMin; k <= kMax; k++) {
    const age = f - k * P;
    if (age < 0) continue;
    const u = age / p.travel;
    const lane = (k * (nL > 2 ? nL - 1 : 1)) % nL;
    const L = ((lane % nL) + nL) % nL;
    if (u <= 1) {
      const eu = 0.82 * u + 0.18 * smooth(u);
      const sc = lerp(0.55, 1, clamp01(age / 5));
      out.push({k, x: xa + 0.32 + cS / 2 + (xb - xa - 0.64 - cS) * eu, z: laneZ(L), s: cS * sc, h: cH * sc, op: clamp01(age / 3)});
    } else if (age - p.travel < 7) {
      const tail = (age - p.travel) / 7;
      out.push({k, x: xb - 0.32 - cS / 2 + tail * 0.35, z: laneZ(L), s: cS * (1 - 0.6 * tail), h: cH * (1 - 0.6 * tail), op: 1 - tail});
    }
  }
  return out;
};

/** Note piles on top of the crates, projected with the Bridge's own camera. n(k) = slabs for crate k. */
type Flow = {crateRate: number; travel: number; bandwidth: number; label?: string};
/** Crates and their note piles, drawn together far → near with the Bridge's own camera (the Bridge's crates are off),
 * so a pile never covers a nearer crate's stamp. n(k) = note slabs on crate k. */
const CratesWithNotes: React.FC<{frame: number; props: BridgeProps; flow: Flow; n: (k: number, f: number) => number}> = ({frame: f, props, flow, n}) => {
  const b = basis(bridgeCam(props, f));
  const cr = crateStates(flow, f);
  const depth = (p: V3) => {
    const d: V3 = [p[0] - b.pos[0], p[1] - b.pos[1], p[2] - b.pos[2]];
    return d[0] * b.f[0] + d[1] * b.f[1] + d[2] * b.f[2];
  };
  const sorted = [...cr].sort((p, q) => depth([q.x, SET.deckY, q.z]) - depth([p.x, SET.deckY, p.z]));
  const nodes: React.ReactNode[] = [];
  for (const c of sorted) {
    nodes.push(<Crate key={`c${c.k}`} b={b} x={c.x} z={c.z} y={SET.deckY} s={c.s} h={c.h} op={c.op} label={flow.label} />);
    const N = n(c.k, f);
    if (N <= 0) continue;
    const t = 0.085 * (c.s / 0.72);
    const half = c.s * 0.42;
    for (let i = 0; i < Math.ceil(N); i++) {
      const grow = clamp01(N - i);
      const y0 = SET.deckY + c.h + 0.02 + i * t;
      const bx = {x0: c.x - half, x1: c.x + half, y0, y1: y0 + t * 0.78 * grow, z0: c.z - half, z1: c.z + half};
      const tab = i % 3 === 1 ? PAL.emphasis : PAL.info;
      for (const fc of visibleFaces(b, bx)) {
        if (fc.key === 'ny') continue;
        const lit = lightOf(fc.n);
        const d = polyD(b, fc.pts);
        if (!d) continue;
        if (fc.key === 'py') {
          nodes.push(<path key={`${c.k}-${i}-t`} d={d} fill={shadeHex('#E9EDF3', lit)} opacity={c.op} />);
        } else {
          nodes.push(<path key={`${c.k}-${i}-${fc.key}`} d={d} fill={shadeHex('#AEB8C8', lit)} opacity={c.op} />);
          const q = polyD(b, faceQuad(fc, 0, t * 0.78 * grow * 0.45, half * 2, t * 0.78 * grow, 0.003));
          if (q) nodes.push(<path key={`${c.k}-${i}-${fc.key}-b`} d={q} fill={tab} opacity={0.95 * c.op} />);
        }
      }
    }
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      {nodes}
    </svg>
  );
};
/** Screen point at the top of the pile of the most central crossing crate. */
const pileTop = (props: BridgeProps, flow: Flow, f: number, n: (k: number, f: number) => number): Pt | null => {
  const b = basis(bridgeCam(props, f));
  const cr = crateStates(flow, f);
  let best: CrateS | null = null;
  for (const c of cr) if (!best || Math.abs(c.x + 0.6) < Math.abs(best.x + 0.6)) best = c;
  if (!best) return null;
  const t = 0.085 * (best.s / 0.72);
  const q = project(b, [best.x, SET.deckY + best.h + n(best.k, f) * t + 0.05, best.z]);
  return q ? {x: q[0], y: q[1]} : null;
};

/* ---------------------------------------------------------------- BR2: notes save math, not travel */
const BR2_PILES_AT = a17('every new token');
const br2 = (f: number): BridgeProps => ({
  frame: f,
  view: 'side',
  cam: [
    {f: CUT.F2, cam: {tx: 0.6, ty: 2.7, tz: 0, yaw: 4, pitch: 15, dist: 21, fov: 30}},
    {f: BR2_PILES_AT - 4, cam: 'wide', dur: 90},
    {f: a17('all of them') + 40, cam: 'crates', view: 'threeQuarter', dur: 70},
  ],
  bandwidth: 0.75,
  flowUntil: -1e9,
  mathActivity: 0.85,
  highlight: f >= a17('save math') && f < a17('not travel') - 2 ? 'die' : f >= a17('not travel') && f < BR2_PILES_AT + 6 ? 'bridge' : null,
  highlightColor: f >= a17('not travel') ? PAL.wait : PAL.ink,
});
const br2N = (k: number, f: number) => {
  const born = k * 15;
  return born < BR2_PILES_AT - 40 ? clamp01((f - BR2_PILES_AT) / 10) * 6 : clamp01((f - Math.max(born, BR2_PILES_AT)) / 10) * 6;
};
const BR2_FLOW: Flow = {crateRate: 2, travel: 40, bandwidth: 0.75, label: 'Weights'};
export const ShotBR2: React.FC<{frame: number}> = ({frame: f}) => {
  const p = br2(f);
  const an = bridgeAnchors(p, f);
  const top = pileTop(p, BR2_FLOW, f, br2N);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      hud={
        <>
          <SafeLabel frame={f} at={a17('math')} exitAt={BR2_PILES_AT + 10} text="Saves math ✓" x={an.die.x - 70} y={an.die.y - 270} to={an.die} side="left" size={68} />
          <SafeLabel frame={f} at={a17('travel')} exitAt={BR2_PILES_AT + 14} text="Not travel ✗" x={an.bridge.x - 250} y={an.bridge.y + 250} to={an.bridgeDeck} side="right" accent={PAL.wait} size={68} />
          {top ? <SafeLabel frame={f} at={a17('all of them')} text="+ all the notes" x={1190} y={250} to={top} side="right" size={64} /> : null}
        </>
      }
    >
      <Bridge {...p} />
      <CratesWithNotes frame={f} props={p} flow={BR2_FLOW} n={br2N} />
    </Stage>
  );
};

/* ---------------------------------------------------------------- BR3: the longer the chat, the more to haul */
const br3 = (f: number): BridgeProps => ({
  frame: f,
  view: 'side',
  cam: [
    {f: CUT.F3, cam: {tx: -0.6, ty: 3.1, tz: 0.4, yaw: -10, pitch: 14, dist: 9.4, fov: 30}},
    {f: CUT.W5 + 12, cam: {tx: 0.2, ty: 3.4, tz: 0.4, yaw: -16, pitch: 15, dist: 12.4, fov: 30}, dur: CUT.W5 + 12 - CUT.F3},
  ],
  bandwidth: 0.8,
  flowUntil: -1e9,
  mathActivity: 0.85,
});
const BR3_FLOW: Flow = {crateRate: 1.8, travel: 44, bandwidth: 0.8, label: 'Weights'};
const BR3_K0 = Math.floor((CUT.F3 - 60) / (30 / 1.8));
const br3N = (k: number) => clamp(3 + (k - BR3_K0) * 2.4, 3, 20);
export const ShotBR3: React.FC<{frame: number}> = ({frame: f}) => {
  const p = br3(f);
  return (
    <Stage frame={f} env="none" drift={0}>
      <Bridge {...p} />
      <CratesWithNotes frame={f} props={p} flow={BR3_FLOW} n={(k) => br3N(k)} />
    </Stage>
  );
};

/* ================================================================ CH: the prompt is the whole conversation */
export const kbCH: KenBurns = {from: {s: 1.5, x: 0, y: 172}, to: {s: 1.6, x: -20, y: 184}, start: CUT.W4, end: CUT.Z2 + 14};
const CW_ = 1032;
const CH_ = 547;
const CONV = [
  {user: true, text: ''},
  {user: false, lines: 3},
  {user: true, text: ''},
  {user: false, lines: 2},
  {user: true, text: ''},
  {user: false, lines: 4},
  {user: true, text: ''},
  {user: false, lines: 2},
  {user: true, text: 'And long chats?'},
] as const;
const PROMPT_AT = a17('the prompt');
const WHOLE_AT = a17('whole conversation');
const convLayout = () => {
  const items: Array<{y: number; h: number; user: boolean; text?: string; lines?: number}> = [];
  let y = 0;
  CONV.forEach((t) => {
    const h = t.user ? 52 : 26 + 30 * ('lines' in t ? t.lines : 2);
    items.push({y, h, user: t.user, text: 'text' in t ? t.text : undefined, lines: 'lines' in t ? t.lines : undefined});
    y += h + 20;
  });
  return {items, total: y - 20};
};
const CONV_L = convLayout();
const ConvPane: React.FC<{frame: number}> = ({frame: f}) => {
  const view = CH_ - 46 - 64;
  const s = lerp(1, 0.5, prog(f, WHOLE_AT - 4, 30, EASE.inOut));
  const last = CONV_L.items[CONV_L.items.length - 1];
  const yBot = CONV_L.total;
  const yTopLatest = last.y;
  const reach = prog(f, WHOLE_AT, 30, EASE.inOut);
  const yTop = lerp(yTopLatest, 0, reach);
  const br = prog(f, PROMPT_AT, 10, EASE.out);
  const latestPulse = f >= a17('not just your') ? Math.exp(-(f - a17('not just your')) / 10) : 0;
  return (
    <ChatChrome w={CW_} h={CH_}>
      <div style={{position: 'absolute', left: 0, top: 0, width: CW_, height: view, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 0, bottom: 12, width: CW_, height: CONV_L.total, transformOrigin: '50% 100%', transform: `scale(${s})`}}>
          {CONV_L.items.map((it, i) => {
            const inc = it.y >= yTop - 4 && br > 0 ? 1 : 0;
            const glow = inc * br;
            const isLast = i === CONV_L.items.length - 1;
            const sp = isLast ? springAt(f, a17('real chat'), SPRING.snap) : 1;
            if (isLast && sp <= 0.001) return null;
            return (
              <div key={i} style={{position: 'absolute', left: 0, top: it.y, width: CW_, height: it.h, opacity: clamp01(sp * 2), transform: `translateY(${(1 - Math.min(1, sp)) * 40}px)`}}>
                {it.user ? (
                  <div
                    style={{
                      position: 'absolute',
                      right: 64,
                      top: 0,
                      height: 52,
                      minWidth: 260,
                      padding: '0 26px',
                      boxSizing: 'border-box',
                      borderRadius: 22,
                      borderBottomRightRadius: 6,
                      background: '#26365A',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: it.text ? 34 : 26,
                      fontWeight: 600,
                      color: PAL.ink,
                      boxShadow: glow > 0 ? `0 0 0 ${2 + 2 * latestPulse}px ${rgba(PAL.info, 0.7 * glow)}, 0 0 ${18 + 30 * latestPulse}px ${rgba(PAL.info, 0.35 * glow)}` : undefined,
                    }}
                  >
                    {it.text ? it.text : <Skel seed={`cu${i}`} lines={1} width={220} h={13} color={rgba(PAL.ink, 0.55)} last={0.9} />}
                  </div>
                ) : (
                  <>
                    <div style={{position: 'absolute', left: 28, top: 0, width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`}} />
                    <div style={{position: 'absolute', left: 74, top: 6, padding: 6, borderRadius: 10, boxShadow: glow > 0 ? `0 0 0 2px ${rgba(PAL.info, 0.55 * glow)}` : undefined}}>
                      <Skel seed={`ca${i}`} lines={it.lines ?? 2} width={760} h={13} gap={17} color={rgba(PAL.annotation, 0.5)} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {br > 0 ? (
            <svg width={60} height={CONV_L.total + 40} style={{position: 'absolute', left: CW_ - 52, top: -20, overflow: 'visible'}}>
              <path d={`M8 ${yTop + 20} H26 V${yBot + 20} H8`} fill="none" stroke={PAL.info} strokeWidth={5 / s} strokeLinecap="round" strokeLinejoin="round" opacity={br} />
              <path d={`M8 ${yTop + 20} H26 V${yBot + 20} H8`} fill="none" stroke={PAL.info} strokeWidth={16 / s} opacity={0.25 * br} />
            </svg>
          ) : null}
        </div>
      </div>
    </ChatChrome>
  );
};
export const ShotCH: React.FC<{frame: number}> = ({frame: f}) => {
  const r = REGIONS.deskScreen;
  const rx = r.shape === 'rect' ? r.x : 0;
  const ry = r.shape === 'rect' ? r.y : 0;
  const pose = poseAt(f);
  const st = plateToStage(f, kbCH, rx + CW_ - 30, ry + 46 + (CH_ - 46 - 64) - 50);
  const brk = toScreen(pose, st.x, st.y);
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'reader-desk', kb: kbCH, children: <ScreenSlot rect={REGIONS.deskScreen}><ConvPane frame={f} /></ScreenSlot>}}
      hud={
        <>
          <SafeLabel frame={f} at={PROMPT_AT} exitAt={WHOLE_AT - 2} text="The prompt" x={brk.x - 110} y={brk.y - 170} to={{x: brk.x - 20, y: brk.y - 20}} side="left" size={64} />
          <Words
            frame={f}
            items={[
              {t: 'The', at: WHOLE_AT - 5},
              {t: 'whole', at: WHOLE_AT},
              {t: 'conversation', at: a17('conversation')},
            ]}
            x={960}
            y={170}
            size={96}
          />
        </>
      }
    />
  );
};

/* ================================================================ GB: ≈1 GB per 8,000 tokens; every conversation gets its own */
const KVB = 'BIM174_T03_kv-tray_b' as const;
const HERO_CROP = {x0: 380, y0: 20, x1: 1450, y1: 1000};
const NOTE_CROP = {x0: 388, y0: 80, x1: 858, y1: 900};
const GK = 0.86;
const HERO_X = 1330;
const HERO_Y = 560;
const ROWS_Y = [240, 333, 434, 530, 629, 730];
const GROUPS: Array<[number, number]> = [
  [432, 600],
  [645, 813],
];
const GB_FILL0 = a17('8') - 2;
const GB_FILL1 = a17('tokens') + 6;
const OWN_AT = a17('and every conversation');
const cellsOverlay = (f: number, fill: (k: number) => number, edge: number) => (
  <svg width={1536} height={1024} viewBox="0 0 1536 1024" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
    {ROWS_Y.flatMap((yc, r) =>
      GROUPS.map(([x0, x1], g) => {
        const k = (ROWS_Y.length - 1 - r) * 2 + g;
        const u = fill(k);
        return (
          <g key={`${r}-${g}`}>
            <rect x={x0 - 6} y={yc - 46} width={x1 - x0 + 12} height={88} rx={10} fill={rgba('#04070E', 0.7 * (1 - u))} />
            {u > 0 ? <rect x={x0 - 6} y={yc - 46} width={x1 - x0 + 12} height={88} rx={10} fill="none" stroke={PAL.info} strokeWidth={5} opacity={0.75 * u * (0.8 + 0.2 * osc(f + k * 9, 40))} /> : null}
          </g>
        );
      }),
    )}
    <rect x={398} y={112} width={452} height={735} rx={18} fill="none" stroke={PAL.info} strokeWidth={6} opacity={edge} />
  </svg>
);
const heroNoteC = () => ({x: HERO_X + ((NOTE_CROP.x0 + NOTE_CROP.x1) / 2 - (HERO_CROP.x0 + HERO_CROP.x1) / 2) * GK, y: HERO_Y});
const EXTRA = [0, 1, 2, 3].map((i) => ({x: heroNoteC().x - (i + 1) * 470, fill: [0.75, 0.4, 1, 0.58][i]}));
export const camGB: CamKey[] = [
  {f: CUT.Z2, x: 1000, y: 560, zoom: 0.97},
  {f: OWN_AT - 2, x: 1000, y: 556, zoom: 1.02},
  {f: OWN_AT + 34, x: 580, y: 600, zoom: 0.6, dur: 36},
  {f: CUT.F3 + 4, x: 560, y: 600, zoom: 0.64, dur: CUT.F3 + 4 - OWN_AT - 34},
];
export const ShotGB: React.FC<{frame: number}> = ({frame: f}) => {
  const fill = (k: number) => prog(f, lerp(GB_FILL0, GB_FILL1, k / 11), 5, EASE.out);
  const edge = prog(f, a17('the notes take') - 2, 10) * (0.55 + 0.45 * Math.exp(-Math.max(0, f - a17('gigabyte')) / 10) * (f >= a17('gigabyte') ? 1 : 0.4)) * (0.85 + 0.15 * osc(f, 24));
  const nc = heroNoteC();
  return (
    <Stage frame={f} env={{kind: 'night', grid: true, dust: 50}} cam={camGB}>
      <CropImg src={KVB} crop={HERO_CROP} x={HERO_X} y={HERO_Y} w={(HERO_CROP.x1 - HERO_CROP.x0) * GK} tiltX={16} rim={PAL.info}>
        {cellsOverlay(f, fill, edge * (1 - prog(f, OWN_AT, 10)))}
      </CropImg>
      {EXTRA.map((e, i) => {
        const a = OWN_AT + 4 + i * 5;
        const sp = springAt(f, a, SPRING.snap);
        if (f < a) return null;
        return (
          <React.Fragment key={i}>
            <CropImg src={KVB} crop={NOTE_CROP} x={e.x - (1 - Math.min(1, sp)) * 260} y={HERO_Y} w={(NOTE_CROP.x1 - NOTE_CROP.x0) * GK} tiltX={16} op={clamp01(sp * 2)} rim={PAL.info}>
              {cellsOverlay(f, (k) => (k < e.fill * 12 ? 1 : 0), 0)}
            </CropImg>
            <div style={{position: 'absolute', left: e.x, top: HERO_Y - 455, width: 0, height: 0, opacity: clamp01(sp * 2), transform: `scale(${Math.max(0, sp)})`}}>
              <ChatGlyph s={92} lines={i % 2 ? 3 : 2} />
            </div>
          </React.Fragment>
        );
      })}
      {f >= OWN_AT ? (
        <div style={{position: 'absolute', left: nc.x, top: HERO_Y - 455, width: 0, height: 0, transform: `scale(${Math.max(0, springAt(f, OWN_AT, SPRING.snap))})`}}>
          <ChatGlyph s={92} fill="#1E3C5E" color={PAL.info} />
        </div>
      ) : null}
    </Stage>
  );
};
export const GbHud: React.FC<{frame: number}> = ({frame: f}) => (
  <>
    <Footnote frame={f} at={a17('for our llama')} exitAt={OWN_AT + 10} text="For our Llama model" />
    <KineticText frame={f} at={a17('gigabyte')} text="≈1 GB" mode="slam" x={420} y={420} size={210} exitAt={OWN_AT + 2} />
    <KineticText frame={f} at={a17('8')} text="per 8,000 tokens" mode="slam" x={420} y={612} size={76} exitAt={OWN_AT + 4} />
    <Words
      frame={f}
      items={[
        {t: 'Every', at: a17('every conversation')},
        {t: 'conversation', at: a17('conversation gets')},
        {t: 'gets', at: a17('gets its')},
        {t: 'its', at: a17('its own')},
        {t: 'own', at: a17('own')},
      ]}
      x={960}
      y={150}
      size={80}
      exitAt={CUT.F3 + 16}
    />
  </>
);
export {mixHex};
