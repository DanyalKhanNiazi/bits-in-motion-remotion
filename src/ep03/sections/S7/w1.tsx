/**
 * S7 wait 1 (P16): the reader's chat waiting, the trip to the data center and its queue, the hidden reasoning,
 * bigger models on the Bridge, and the chip wall (split across tens of chips, more bridges, chip-to-chip passing).
 */
import React from 'react';
import {Img} from 'remotion';
import {
  Bridge,
  EASE,
  Footnote,
  Label,
  PAL,
  REGIONS,
  SANS,
  SPRING,
  ScreenSlot,
  Stage,
  TS,
  assetBox,
  assetUrl,
  clamp01,
  lerp,
  osc,
  plateToStage,
  poseAt,
  prog,
  rgba,
  rnd,
  rr,
  springAt,
  toScreen,
  type BridgeProps,
  type KenBurns,
} from '../../kit';
import {ChatChrome, FlyBit, SafeLabel, Tile, Words, a16, CUT, FROM, type Pt} from './lib';

/* ================================================================ the reader's chat (T1 and TH) */
const SW = 1032;
const SH = 547;
const FS = 25;
const PADX = 27;
const QUESTION = 'Why do AI answers arrive one piece at a time?';
const ANSWER = ['Because', 'a', 'model', 'writes', 'one', 'piece', 'at', 'a', 'time,'];
/** slot px → screen px for the reader-desk plate */
export const deskSlotToScreen = (f: number, kb: KenBurns, sx: number, sy: number, cam?: Parameters<typeof poseAt>[1]): Pt => {
  const r = REGIONS.deskScreen;
  const sx0 = r.shape === 'rect' ? r.x : 0;
  const sy0 = r.shape === 'rect' ? r.y : 0;
  const s = plateToStage(f, kb, sx0 + sx, sy0 + sy);
  return toScreen(poseAt(f, cam), s.x, s.y);
};
const BUBBLE = {cx: SW - PADX - 400, cy: 46 + 20 + 32, w: 800, h: 64};

const ReplyPane: React.FC<{frame: number; launchAt?: number; think?: number; reason?: number; hide?: number; sum?: number; first?: number; qSize?: number}> = ({frame: f, launchAt, think, reason, hide, sum, first, qSize = FS}) => {
  const lt = launchAt !== undefined ? f - launchAt : -99;
  const flash = lt >= 0 ? Math.exp(-lt / 5) : 0;
  const rowTop = 20 + 54 + 30;
  const av = FS * 1.1;
  const firstOn = first !== undefined && f >= first;
  const ringC = firstOn ? PAL.info : PAL.wait;
  const ringOp = firstOn ? 1 - prog(f, first!, 10) : 1;
  const thinkOn = think !== undefined ? springAt(f, think, SPRING.snap) : 0;
  const pills: Array<{x: number; y: number; w: number; t: number}> = [];
  if (reason !== undefined) {
    let x = 0;
    let y = 0;
    for (let i = 0; i < 78; i++) {
      const w = rr(`rp-${i}`, 22, 84);
      if (x + w > 880) {
        x = 0;
        y += 26;
      }
      pills.push({x, y, w, t: reason + i * 0.7});
      x += w + 9;
    }
  }
  const hideU = hide !== undefined ? prog(f, hide, 14, EASE.out) : 0;
  const sumU = sum !== undefined ? prog(f, sum, 10, EASE.inOut) : 0;
  const shownRows = pills.filter((p) => f >= p.t).reduce((m, p) => Math.max(m, p.y / 26 + 1), 0);
  const panelH = lerp(Math.max(36, shownRows * 26 + 14), 44, sumU);
  return (
    <ChatChrome w={SW} h={SH}>
      {/* the question, sent */}
      <div
        style={{
          position: 'absolute',
          right: PADX,
          top: 20,
          padding: `${qSize * 0.45}px ${qSize * 0.7}px`,
          borderRadius: qSize * 0.7,
          borderBottomRightRadius: qSize * 0.18,
          background: '#26365A',
          color: PAL.ink,
          fontWeight: 600,
          fontSize: qSize,
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
          boxShadow: flash > 0.02 ? `0 0 ${50 * flash}px ${rgba(PAL.info, 0.8 * flash)}, 0 0 0 ${3 * flash}px ${rgba(PAL.info, flash)}` : '0 10px 30px rgba(0,0,0,0.35)',
          filter: flash > 0.02 ? `brightness(${1 + 0.8 * flash})` : undefined,
        }}
      >
        {QUESTION}
      </div>
      {/* assistant row: avatar + waiting ring */}
      <div style={{position: 'absolute', left: PADX, top: rowTop, width: av, height: av, borderRadius: av * 0.26, background: `linear-gradient(135deg, ${PAL.info}, ${PAL.infoWake})`, boxShadow: `0 0 ${av * 0.6}px ${rgba(PAL.info, 0.45)}`}} />
      <svg width={80} height={80} style={{position: 'absolute', left: PADX + av / 2 - 40, top: rowTop + av / 2 - 40, overflow: 'visible', opacity: ringOp}}>
        <circle cx={40} cy={40} r={25} fill="none" stroke={rgba(ringC, 0.25)} strokeWidth={3} />
        <circle cx={40} cy={40} r={25} fill="none" stroke={ringC} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="34 123" strokeDashoffset={-f * 5.5} />
      </svg>
      {think === undefined && first === undefined ? (
        <div style={{position: 'absolute', left: PADX + av + 18, top: rowTop + 2, width: FS * 0.5, height: FS * 1.05, borderRadius: 3, background: PAL.info, opacity: Math.floor(f / 9) % 2 ? 0.2 : 0.95, boxShadow: `0 0 12px ${rgba(PAL.info, 0.8)}`}} />
      ) : null}
      {think !== undefined && thinkOn > 0 ? (
        <div style={{position: 'absolute', left: PADX + av + 18, top: rowTop - 2, fontSize: FS, fontWeight: 600, color: PAL.muted, opacity: clamp01(thinkOn * 2) * (1 - 0.4 * sumU), transform: `translateY(${(1 - Math.min(1, thinkOn)) * 10}px)`, display: 'flex', alignItems: 'center', gap: 8}}>
          <span>Thinking</span>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{display: 'inline-block', width: 7, height: 7, borderRadius: 4, background: PAL.muted, opacity: firstOn ? 0.3 : 0.25 + 0.75 * Math.max(0, Math.sin((f / 22) * Math.PI * 2 - i * 0.7))}} />
          ))}
        </div>
      ) : null}
      {reason !== undefined && f >= reason - 1 ? (
        <div
          style={{
            position: 'absolute',
            left: PADX + av + 18,
            top: rowTop + 42,
            width: 900,
            height: panelH,
            borderRadius: 12,
            overflow: 'hidden',
            background: rgba('#FFFFFF', 0.035),
            border: `1.5px solid ${rgba(PAL.structure, 0.25)}`,
          }}
        >
          <div style={{position: 'absolute', left: 10, top: 9, opacity: (0.75 - 0.4 * hideU) * (1 - prog(f, sum ?? 1e9, 6)), filter: `blur(${1.4 + 4.5 * hideU}px)`}}>
            {pills.map((p, i) =>
              f >= p.t ? <div key={i} style={{position: 'absolute', left: p.x, top: p.y, width: p.w, height: 13, borderRadius: 7, background: rgba(PAL.annotation, 0.62), opacity: clamp01((f - p.t + 1) / 3)}} /> : null,
            )}
          </div>
          {sum !== undefined && f >= sum + 3 ? (
            <div style={{position: 'absolute', left: 10, top: 6, display: 'flex', alignItems: 'center', gap: 10, fontSize: FS * 0.92, fontWeight: 600, color: PAL.annotation, opacity: prog(f, sum + 3, 6)}}>
              <span style={{padding: '2px 14px', borderRadius: 14, background: '#1A2742', border: `1.5px solid ${rgba(PAL.structure, 0.4)}`}}>Summary ›</span>
            </div>
          ) : null}
        </div>
      ) : null}
      {first !== undefined && f >= first ? (
        <div style={{position: 'absolute', left: PADX + av + 18, top: rowTop + 42 + panelH + 16, fontSize: FS, fontWeight: 600, color: PAL.ink, whiteSpace: 'nowrap'}}>
          {ANSWER.map((w, i) => {
            const a = first + i * 4;
            if (f < a) return null;
            const fresh = Math.exp(-(f - a) / 6);
            const newest = i === Math.min(ANSWER.length - 1, Math.floor((f - first) / 4));
            return (
              <span key={i} style={{marginRight: 7, color: fresh > 0.1 ? PAL.infoPale : PAL.ink, textShadow: fresh > 0.05 ? `0 0 ${16 * fresh}px ${rgba(PAL.info, 0.9 * fresh)}` : undefined}}>
                {w}
                {newest ? (
                  <span style={{display: 'inline-block', width: 11, height: 11, marginLeft: 5, borderRadius: 3, background: PAL.info, boxShadow: `0 0 12px ${PAL.info}`}} />
                ) : null}
              </span>
            );
          })}
        </div>
      ) : null}
    </ChatChrome>
  );
};

/* ---------------------------------------------------------------- T1: waiting before the first word; the question travels */
export const kbT1: KenBurns = {from: {s: 1.22, x: 0, y: 96}, to: {s: 1.42, x: -10, y: 128}, start: FROM - 30, end: CUT.W1 + 12};
const launchT1 = a16('travel');
export const ShotT1: React.FC<{frame: number}> = ({frame: f}) => {
  const p0 = deskSlotToScreen(f, kbT1, BUBBLE.cx, BUBBLE.cy);
  const pk = f - launchT1;
  const packet = pk >= 0 && pk < 6 ? 1 - pk / 6 : 0;
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'reader-desk', kb: kbT1, children: <ScreenSlot rect={REGIONS.deskScreen}><ReplyPane frame={f} launchAt={launchT1} qSize={30} /></ScreenSlot>}}
      hud={
        <>
          {packet > 0 ? (
            <div
              style={{
                position: 'absolute',
                left: p0.x,
                top: p0.y,
                width: lerp(36, 1180, packet),
                height: lerp(30, 96, packet),
                transform: 'translate(-50%, -50%)',
                borderRadius: 40,
                background: rgba('#DFFBFF', 0.85),
                boxShadow: `0 0 60px ${rgba(PAL.info, 0.9)}`,
                opacity: 0.4 + 0.6 * packet,
              }}
            />
          ) : null}
          <FlyBit frame={f} from={launchT1 + 3} to={launchT1 + 15} p0={p0} p1={{x: 2120, y: 300}} c={{x: p0.x + 420, y: p0.y - 220}} size={30} ease={EASE.inExpo} />
        </>
      }
    />
  );
};

/* ---------------------------------------------------------------- DC: the data center and its queue */
export const kbDC: KenBurns = {from: {s: 1.12, x: 70, y: 0}, to: {s: 1.5, x: -380, y: 34}, start: CUT.W1, end: CUT.W2 + 14};
const QX = (slot: number) => 1040 - slot * 84;
const QY = 505;
const STEP1 = a16('busy server') + 6;
const STEP2 = a16('wait its turn') + 2;
const ARRIVE = CUT.W1 + 22;
const advance = (f: number) => [STEP1, STEP2].reduce((s, t) => s + Math.min(1, springAt(f, t, SPRING.snap)), 0);
const cardPos = (f: number, j: number) => {
  const slot = j - advance(f);
  const x = slot >= 0 ? QX(slot) : QX(0) + -slot * 130;
  return {x, y: QY + (slot >= 0 ? 3 * Math.sin(f / 17 + j) : 0), op: slot >= 0 ? 1 : clamp01(1 + slot * 1.25), slot};
};

const QueueLayer: React.FC<{frame: number}> = ({frame: f}) => {
  const busy = prog(f, a16('busy server') - 2, 10);
  const cards = [];
  for (let j = 0; j <= 7; j++) {
    const ours = j === 7;
    if (ours && f < ARRIVE) continue;
    const p = cardPos(f, j);
    if (p.op <= 0.01) continue;
    const pop = ours ? springAt(f, ARRIVE, SPRING.pop) : 1;
    const s = 64;
    cards.push(
      <div key={j} style={{position: 'absolute', left: p.x - s / 2, top: p.y - s / 2, width: s, height: s, opacity: p.op, transform: `scale(${Math.max(0, pop)})`}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            background: 'linear-gradient(180deg, #1C2A48, #111A2E)',
            border: `2.5px solid ${ours ? PAL.info : rgba(PAL.structure, 0.6)}`,
            boxShadow: ours ? `0 0 22px ${rgba(PAL.info, 0.85)}, inset 0 0 10px ${rgba(PAL.info, 0.4)}` : '0 8px 16px rgba(0,0,0,0.5)',
          }}
        />
        <div style={{position: 'absolute', left: 12, top: 17, width: 30, height: 5, borderRadius: 3, background: rgba(PAL.ink, 0.8)}} />
        <div style={{position: 'absolute', left: 12, top: 28, width: 19, height: 5, borderRadius: 3, background: rgba(PAL.ink, 0.6)}} />
        {!ours ? (
          <div style={{position: 'absolute', right: 6, top: 6, width: 9, height: 9, borderRadius: 5, background: PAL.wait, opacity: 0.45 + 0.55 * (0.5 + 0.5 * osc(f, 26, j * 0.21)), boxShadow: `0 0 8px ${PAL.wait}`}} />
        ) : (
          <div style={{position: 'absolute', right: 7, top: 7, width: 10, height: 10, borderRadius: 3, background: PAL.info, boxShadow: `0 0 10px ${PAL.info}`}} />
        )}
      </div>,
    );
  }
  // intake flash where a request enters the rack
  const fl = [STEP1, STEP2].reduce((m, t) => Math.max(m, f >= t + 2 ? Math.exp(-(f - t - 2) / 4) : 0), 0);
  const leds = [];
  for (let i = 0; i < 10; i++)
    for (let c = 0; c < 2; c++) {
      const rate = busy > 0.5 ? 2 : 5;
      const on = rnd(`led-${i}-${c}-${Math.floor((f + i * 2) / rate)}`) > 0.42;
      leds.push(
        <div
          key={`${i}-${c}`}
          style={{position: 'absolute', left: 1322 + c * 15, top: 126 + i * 66, width: 6, height: 6, borderRadius: 3, background: c ? '#FFFFFF' : PAL.info, opacity: on ? 0.95 : 0.12, boxShadow: on ? `0 0 10px ${PAL.info}` : undefined}}
        />,
      );
    }
  return (
    <>
      <div style={{position: 'absolute', left: QX(7) - 40, top: QY - 3, width: QX(0) - QX(7) + 80, height: 6, borderRadius: 3, background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(PAL.structure, 0.35)})`}} />
      <div style={{position: 'absolute', left: 1068, top: QY - 40, width: 14, height: 80, borderRadius: 7, background: PAL.info, opacity: 0.35 + 0.6 * fl, boxShadow: `0 0 ${20 + 40 * fl}px ${PAL.info}`}} />
      <div style={{position: 'absolute', left: 1060, top: 70, width: 318, height: 740, borderRadius: 14, border: `4px solid ${PAL.wait}`, opacity: busy * (0.25 + 0.3 * (0.5 + 0.5 * osc(f, 18))), boxShadow: `0 0 30px ${rgba(PAL.wait, 0.5)}`}} />
      {leds}
      {cards}
    </>
  );
};

export const ShotDC: React.FC<{frame: number}> = ({frame: f}) => {
  const pose = poseAt(f);
  const scr = (px: number, py: number): Pt => {
    const s = plateToStage(f, kbDC, px, py);
    return toScreen(pose, s.x, s.y);
  };
  const ours = cardPos(f, 7);
  const oursS = scr(ours.x, ours.y);
  const rackTop = scr(1215, 92);
  const land = scr(QX(7), QY);
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'server-room', kb: kbDC, dim: 0.06, tint: 0.2, children: <QueueLayer frame={f} />}}
      hud={
        <>
          <FlyBit frame={f} from={CUT.W1 + 4} to={ARRIVE} p0={{x: -80, y: 330}} p1={land} c={{x: 520, y: 220}} size={28} ease={EASE.out} hideAfter={0} />
          <SafeLabel frame={f} at={a16('data center')} exitAt={a16('busy server') + 10} text="Data center" x={rackTop.x - 150} y={rackTop.y + 90} to={rackTop} side="left" size={60} />
          <SafeLabel frame={f} at={a16('wait its turn')} text="Waits its turn" x={oursS.x + 60} y={oursS.y - 210} to={{x: oursS.x, y: oursS.y - 56}} side="right" accent={PAL.wait} size={60} />
        </>
      }
    />
  );
};

/* ---------------------------------------------------------------- TH: thinking, hidden reasoning, the first word */
export const kbTH: KenBurns = {from: {s: 1.46, x: 0, y: 200}, to: {s: 1.58, x: 0, y: 222}, start: CUT.W2 - 12, end: CUT.Z1 + 16};
export const TH_FIRST = a16('summarized') + 8;
export const ShotTH: React.FC<{frame: number}> = ({frame: f}) => {
  const panel = deskSlotToScreen(f, kbTH, 27 + 27.5 + 18 + 4, 46 + 104 + 42 + 40);
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb: kbTH,
        children: (
          <ScreenSlot rect={REGIONS.deskScreen}>
            <ReplyPane frame={f} think={a16('thinking')} reason={a16('write reasoning')} hide={a16('hidden')} sum={a16('summarized')} first={TH_FIRST} />
          </ScreenSlot>
        ),
      }}
      hud={
        <>
          <SafeLabel frame={f} at={a16('reasoning tokens')} exitAt={a16('summarized') + 16} text="Reasoning tokens first" x={panel.x + 360} y={panel.y + 260} to={{x: panel.x + 240, y: panel.y + 40}} side="right" size={58} />
          <Words
            frame={f}
            items={[
              {t: 'Hidden', at: a16('hidden')},
              {t: 'or', at: a16('or summarized')},
              {t: 'summarized', at: a16('summarized')},
            ]}
            x={960}
            y={880}
            size={84}
          />
        </>
      }
    />
  );
};

/* ---------------------------------------------------------------- BR1: much bigger models on the Bridge */
const HERO_AT = a16('much bigger') - 8;
const HERO_DUR = 50;
export const HERO_HIT = HERO_AT + HERO_DUR;
const SPLIT_BR = HERO_HIT - 10;
const br1Base = (f: number): BridgeProps => ({
  frame: f,
  view: 'side',
  cam: [
    {f: CUT.Z1, cam: {tx: -0.6, ty: 3.0, tz: 0.5, yaw: -46, pitch: 7, dist: 6.2, fov: 30}},
    {f: HERO_AT - 6, cam: {tx: -0.2, ty: 3.05, tz: 0.5, yaw: -30, pitch: 9, dist: 6.8, fov: 30}, dur: HERO_AT - 6 - CUT.Z1},
    {f: HERO_AT + 22, cam: {tx: 0.4, ty: 3.4, tz: 0.6, yaw: -6, pitch: 12, dist: 9.8, fov: 30}, dur: 26},
    {f: a16('more numbers') + 50, cam: 'wide', view: 'threeQuarter', dur: 66},
  ],
  bandwidth: 0.82,
  travel: 42,
  mathActivity: 0.85,
  heroCrate: {at: HERO_AT, dur: HERO_DUR, scale: 3.3, label: '?'},
});
export const ShotBR1: React.FC<{frame: number}> = ({frame: f}) => {
  const before = f < SPLIT_BR;
  const props: BridgeProps = before
    ? {...br1Base(f), crateRate: 2.6, crateLabel: 'Ours', flowUntil: HERO_AT - 18}
    : {...br1Base(f), crateRate: 1.35, crateLabel: '?', crateScale: 1.85, flowFrom: HERO_HIT + 2};
  return (
    <Stage frame={f} env="none" drift={0} shake={[{at: HERO_HIT, strength: 1.3}]}>
      <Bridge {...props} />
    </Stage>
  );
};
export const Br1Hud: React.FC<{frame: number}> = ({frame: f}) => (
  <>
    <Words
      frame={f}
      items={[
        {t: 'Big', at: a16("big service's")},
        {t: "services'", at: a16("service's")},
        {t: 'models', at: a16("service's models") + 18},
      ]}
      x={960}
      y={170}
      size={92}
      exitAt={a16('much bigger') - 9}
    />
    <Words
      frame={f}
      items={[
        {t: 'Much', at: a16('much bigger')},
        {t: 'bigger', at: a16('bigger')},
        {t: 'models', at: a16('bigger') + 8},
      ]}
      x={960}
      y={170}
      size={100}
      exitAt={a16('more numbers') - 8}
    />
    <Words
      frame={f}
      items={[
        {t: 'More', at: a16('more numbers')},
        {t: 'numbers', at: a16('numbers')},
        {t: 'per', at: a16('for every token')},
        {t: 'token', at: a16('every token') + 10},
      ]}
      x={960}
      y={176}
      size={92}
      exitAt={CUT.F1 - 3}
    />
    <Footnote frame={f} at={a16('than our example')} exitAt={CUT.F1 - 6} text="Real sizes aren't published" />
  </>
);

/* ---------------------------------------------------------------- CW: the chip wall */
const COLS = 8;
const ROWS = 5;
const PX = 236;
const PY = 214;
const CHIP_W = 196;
const CB = assetBox('BIM130_T03_datacenter-gpu_b');
const CK = CHIP_W / CB.cw;
// the hero module sits at the plane origin; the wall spreads around it
const HERO_C = 3;
const HERO_R = 2;
const CHIPS = Array.from({length: COLS * ROWS}, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  const x = (c - HERO_C) * PX;
  const y = (r - HERO_R) * PY;
  return {i, c, r, x, y, d: Math.hypot(x, y), hero: c === HERO_C && r === HERO_R};
});
const WALL_CX = ((COLS - 1) / 2 - HERO_C) * PX;
// the model's weights: a tray bigger than one module, sitting beside it before the split
const TRAY = assetBox('BIM162_T03_weight-field_b');
const TRAY_W = 330;
const TK = TRAY_W / TRAY.cw;
const TRAY_X = -340;
const TRAY_TILES = (() => {
  const xs = [336, 515, 687, 866, 1041];
  const ys = [126, 289, 455, 621, 790];
  const out: Pt[] = [];
  for (const y of ys) for (const x of xs) out.push({x: TRAY_X + (x - TRAY.cx) * TK, y: (y - TRAY.cy) * TK});
  return out;
})();
const SPLIT = a16('split');
const FLIGHTS = (() => {
  const chips = [...CHIPS].sort((a, b) => Math.hypot(a.x - TRAY_X, a.y) - Math.hypot(b.x - TRAY_X, b.y));
  return chips.map((ch, k) => {
    const src = TRAY_TILES[k % 25];
    const t0 = SPLIT + Math.round(k * 0.5 + rr(`fl-${k}`, 0, 3));
    return {chip: ch.i, sx: src.x, sy: src.y, t0, dur: 16 + Math.round(Math.hypot(ch.x - src.x, ch.y - src.y) / 110)};
  });
})();
const landAt = (chip: number) => {
  const fl = FLIGHTS.find((q) => q.chip === chip)!;
  return fl.t0 + fl.dur;
};
// HBM → die bridge bars per chip (native px)
const BARS: Array<[number, number, number, number]> = [
  [591, 185, 591, 301],
  [943, 185, 943, 301],
  [1138, 351, 1004, 351],
  [1138, 612, 1004, 612],
  [944, 763, 944, 673],
  [591, 763, 591, 673],
  [396, 614, 520, 614],
  [397, 351, 520, 351],
];
const BRIDGES_AT = a16('more bridges');
const LINKS_AT = a16('but those chips');
const PASS_AT = a16('passing results');
type Link = {a: number; b: number; x1: number; y1: number; x2: number; y2: number; ph: number};
const LINKS: Link[] = (() => {
  const out: Link[] = [];
  for (const ch of CHIPS) {
    if (ch.c < COLS - 1) out.push({a: ch.i, b: ch.i + 1, x1: ch.x + CHIP_W / 2 - 6, y1: ch.y, x2: ch.x + PX - CHIP_W / 2 + 6, y2: ch.y, ph: rnd(`lk-${ch.i}-h`)});
    if (ch.r < ROWS - 1) out.push({a: ch.i, b: ch.i + COLS, x1: ch.x, y1: ch.y + 72, x2: ch.x, y2: ch.y + PY - 72, ph: rnd(`lk-${ch.i}-v`)});
  }
  return out;
})();

const ChipWallPlane: React.FC<{frame: number}> = ({frame: f}) => {
  const tilt = lerp(16, 50, prog(f, SPLIT + 6, 58, EASE.inOut));
  const spin = lerp(-4, 5, prog(f, SPLIT, CUT.W3 - SPLIT, EASE.inOut));
  const trayOut = prog(f, SPLIT + 2, 14, EASE.inCubic);
  const chipsIn = prog(f, SPLIT - 4, 22, EASE.out);
  const linkDraw = prog(f, LINKS_AT, 22, EASE.out);
  const passing = f >= PASS_AT - 10;
  // which chips are waiting for an incoming result right now
  const waitK = (chip: number) => {
    if (!passing) return 0;
    let w = 0;
    for (const L of LINKS) {
      if (L.b !== chip && L.a !== chip) continue;
      const per = 26;
      const u = ((((f - PASS_AT) / per + L.ph) % 1) + 1) % 1;
      if (u > 0.55) w = Math.max(w, (u - 0.55) / 0.45);
    }
    return w;
  };
  return (
    <div style={{position: 'absolute', left: 960, top: 560, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `perspective(1700px) rotateX(${tilt}deg) rotateZ(${spin}deg)`}}>
      {/* plate under the wall */}
      <div
        style={{
          position: 'absolute',
          left: WALL_CX - COLS * PX * 0.55,
          top: -ROWS * PY * 0.56,
          width: COLS * PX * 1.1,
          height: ROWS * PY * 1.12,
          borderRadius: 30,
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, ${rgba('#13305A', 0.55)}, ${rgba('#0A1426', 0.3)} 70%, rgba(0,0,0,0))`,
          opacity: chipsIn,
        }}
      />
      {/* links */}
      <svg width={10} height={10} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {linkDraw > 0
          ? LINKS.map((L, k) => {
              const len = Math.hypot(L.x2 - L.x1, L.y2 - L.y1);
              const per = 26;
              const u = ((((f - PASS_AT) / per + L.ph) % 1) + 1) % 1;
              const px = lerp(L.x1, L.x2, u);
              const py = lerp(L.y1, L.y2, u);
              return (
                <g key={k}>
                  <line x1={L.x1} y1={L.y1} x2={L.x2} y2={L.y2} stroke={rgba(PAL.info, 0.55)} strokeWidth={5} strokeDasharray={`${len * linkDraw} ${len}`} strokeLinecap="round" />
                  {passing ? <circle cx={px} cy={py} r={7} fill={PAL.infoPale} opacity={prog(f, PASS_AT - 10, 10)} /> : null}
                  {passing ? <circle cx={px} cy={py} r={16} fill={rgba(PAL.info, 0.3)} opacity={prog(f, PASS_AT - 10, 10)} /> : null}
                </g>
              );
            })
          : null}
      </svg>
      {/* chips */}
      {CHIPS.map((ch) => {
        const la = landAt(ch.i);
        const lit = f >= la ? 1 : 0;
        const flash = f >= la ? Math.exp(-(f - la) / 5) : 0;
        const bOn = prog(f, BRIDGES_AT - 8 + ch.d * 0.02, 8, EASE.out);
        const wk = waitK(ch.i);
        const w = CB.w * CK;
        const h = CB.h * CK;
        const op = ch.hero ? 1 : chipsIn * (lit ? 1 : 0.6);
        return (
          <div key={ch.i} style={{position: 'absolute', left: ch.x - CB.cx * CK, top: ch.y - CB.cy * CK, width: w, height: h, opacity: op}}>
            <div style={{position: 'absolute', left: -w * 0.08, top: -h * 0.08, width: w * 1.16, height: h * 1.16, borderRadius: w * 0.12, background: `radial-gradient(closest-side, ${rgba(PAL.info, 0.28 * (lit || ch.hero ? 1 : 0.3))}, rgba(0,0,0,0))`}} />
            <Img src={assetUrl('BIM130_T03_datacenter-gpu_b')} style={{position: 'absolute', left: 0, top: 0, width: w, height: h, filter: `brightness(${0.92 + 0.3 * lit + 0.8 * flash})`}} />
            <svg width={w} height={h} viewBox={`0 0 ${CB.w} ${CB.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
              <rect x={520} y={301} width={484} height={372} rx={10} fill={rgba(PAL.info, 0.16 * lit + 0.5 * flash)} />
              {bOn > 0
                ? BARS.map(([x1, y1, x2, y2], k) => (
                    <g key={k} opacity={bOn}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAL.info} strokeWidth={70} opacity={0.22} strokeLinecap="round" />
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={PAL.infoPale} strokeWidth={26} strokeLinecap="round" strokeDasharray="30 26" strokeDashoffset={-f * 6} />
                    </g>
                  ))
                : null}
              {wk > 0 ? <rect x={250} y={60} width={1040} height={840} rx={40} fill="none" stroke={PAL.wait} strokeWidth={34} opacity={0.75 * wk} /> : null}
            </svg>
          </div>
        );
      })}
      {/* the weight tray that splits */}
      {trayOut < 1 ? (
        <div style={{position: 'absolute', left: TRAY_X - TRAY.cx * TK, top: -TRAY.cy * TK, width: TRAY.w * TK, height: TRAY.h * TK, opacity: 1 - trayOut, transform: `scale(${1 - 0.25 * trayOut})`}}>
          <Img src={assetUrl('BIM162_T03_weight-field_b')} style={{position: 'absolute', left: 0, top: 0, width: TRAY.w * TK, height: TRAY.h * TK, filter: `brightness(${1 + 0.6 * Math.exp(-Math.abs(f - SPLIT) / 4)}) drop-shadow(0 0 18px ${rgba(PAL.info, 0.35)})`}} />
        </div>
      ) : null}
      {/* the split: cyan shards of the model fly to every module */}
      {FLIGHTS.map((fl, k) => {
        if (f < fl.t0 - 1 || f > fl.t0 + fl.dur + 1) return null;
        const ch = CHIPS[fl.chip];
        const u = prog(f, fl.t0, fl.dur, EASE.inOut);
        const x = lerp(fl.sx, ch.x, u);
        const y = lerp(fl.sy, ch.y - 4, u) - Math.sin(Math.PI * u) * 60;
        const s = 30 * (1 + 0.5 * Math.sin(Math.PI * u));
        return (
          <div key={k} style={{position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: s * 0.24, background: PAL.info, boxShadow: `0 0 ${s * 0.9}px ${PAL.info}, inset 0 0 0 ${s * 0.26}px ${rgba('#E9FDFF', 0.9)}`}} />
        );
      })}
    </div>
  );
};

export const camCW = [
  {f: CUT.F1, x: 960 + TRAY_X / 2 - 10, y: 556, zoom: 1.84},
  {f: SPLIT - 2, x: 960 + TRAY_X / 2, y: 556, zoom: 1.98},
  {f: SPLIT + 52, x: 960 + WALL_CX, y: 600, zoom: 0.84, dur: 52},
  {f: CUT.W3 + 12, x: 960 + WALL_CX, y: 610, zoom: 0.98, dur: CUT.W3 + 12 - SPLIT - 52},
];
export const ShotCW: React.FC<{frame: number}> = ({frame: f}) => (
  <Stage
    frame={f}
    env={{kind: 'chip', pulses: 0.7, dust: 36}}
    cam={camCW}
    hud={
      <>
        <Words frame={f} items={[{t: 'Anthropic', at: a16('anthropic') + 6}, {t: 'says', at: a16('says')}]} x={960} y={116} size={76} backing="plate" color={PAL.ink} exitAt={BRIDGES_AT - 12} />
        <Words
          frame={f}
          items={[
            {t: 'Split', at: a16('split')},
            {t: 'across', at: a16('across')},
            {t: 'tens', at: a16('tens')},
            {t: 'of', at: a16('tens of') + 13},
            {t: 'chips', at: a16('chips')},
            {t: 'or', at: a16('or more')},
            {t: 'more', at: a16('more', 2)},
          ]}
          x={960}
          y={258}
          size={92}
          exitAt={BRIDGES_AT - 12}
        />
        <Words frame={f} items={[{t: 'More', at: a16('more bridges')}, {t: 'bridges', at: a16('bridges')}]} x={960} y={176} size={104} exitAt={PASS_AT - 10} />
        <Words
          frame={f}
          items={[
            {t: 'Passing', at: a16('passing')},
            {t: 'results', at: a16('results')},
            {t: 'to', at: a16('to each other')},
            {t: 'each', at: a16('each other')},
            {t: 'other', at: a16('other')},
          ]}
          x={960}
          y={176}
          size={84}
        />
        <Footnote frame={f} at={SPLIT + 30} exitAt={CUT.W3 - 4} text="Illustration, not to scale" />
      </>
    }
  >
    <ChipWallPlane frame={f} />
  </Stage>
);

export const W1_TITLE = {badgeAt: a16('first wait'), words: [
  {t: 'Before', at: a16('before')},
  {t: 'the', at: a16('before the') + 12},
  {t: 'first', at: a16('first word')},
  {t: 'word', at: a16('word')},
]};
export const SansStyle = {fontFamily: SANS, fontSize: TS.label};
