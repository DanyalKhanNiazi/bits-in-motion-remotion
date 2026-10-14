/**
 * S7, "The three waits" (P16–P18), frames 11907–15091. Three chapters, each opened by a coral number badge that
 * matches S6's three doors: 1 before the first word (data center), 2 long chats (KV tray + Bridge), 3 sharing
 * (batch station). Shots live in ./S7/*; this file sequences them with motivated transitions and holds the
 * cross-cut hud (chapter badges, phrases that span a cut, the light tunnel).
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {FlashCut, KineticText, PAL, Whip, ZoomThrough, clamp, rgba, win, type CamKey} from '../kit';
import {CUT, DIVE, FROM, TO, ChapterBadge, LightTunnel, Words, a17, a18} from './S7/lib';
import {DOOR_CY, Hall} from './S7/hall';
import {Br1Hud, ShotBR1, ShotCW, ShotDC, ShotT1, ShotTH, W1_TITLE} from './S7/w1';
import {GbHud, ShotBR2, ShotBR3, ShotCH, ShotGB, ShotK1} from './S7/w2';
import {BITS_SWAP, ShotBS, ShotBits, ShotGPU, ShotGap, ShotMP, ShotTrade, ShotX60} from './S7/w3';

type R = (f: number) => React.ReactNode;
const r =
  (C: React.FC<{frame: number}>): R =>
  (f) => <C frame={f} />;
const T1 = r(ShotT1);
const DC = r(ShotDC);
const TH = r(ShotTH);
const BR1 = r(ShotBR1);
const CW = r(ShotCW);
const K1 = r(ShotK1);
const BR2 = r(ShotBR2);
const CH = r(ShotCH);
const GB = r(ShotGB);
const BR3 = r(ShotBR3);
const MP = r(ShotMP);
const BS = r(ShotBS);
const GPU = r(ShotGPU);
const BITS = r(ShotBits);
const X60 = r(ShotX60);
const GAP = r(ShotGap);
const TRADE = r(ShotTrade);

const hall2Cam: CamKey[] = [
  {f: CUT.W3, x: 960, y: 520, zoom: 0.92},
  {f: a17('second wait') + 34, x: 960, y: 528, zoom: 1.12, dur: 46},
  {f: CUT.D2, x: 960, y: DOOR_CY, zoom: 1.2, dur: 24},
  {f: CUT.D2 + DIVE, x: 960, y: DOOR_CY, zoom: 7.5, dur: DIVE, ease: 'inExpo'},
];
const hall3Cam: CamKey[] = [
  {f: CUT.W5, x: 960, y: 520, zoom: 0.92},
  {f: a18('third wait') + 6, x: 1080, y: 524, zoom: 1.0, dur: 30},
  {f: CUT.D3, x: 1400, y: DOOR_CY, zoom: 1.3, dur: 26},
  {f: CUT.D3 + DIVE, x: 1400, y: DOOR_CY, zoom: 7.5, dur: DIVE, ease: 'inExpo'},
];
const H2: R = (f) => <Hall frame={f} active={1} openAt={a17('second wait')} cam={hall2Cam} inAt={CUT.W3 - 40} />;
const H3: R = (f) => <Hall frame={f} active={2} openAt={a18('third wait')} cam={hall3Cam} inAt={CUT.W5 - 40} />;

const whip = (f: number, at: number, dir: 'left' | 'right' | 'up' | 'down', a: R, b: R) => <Whip frame={f} at={at} dur={12} dir={dir} a={a} b={b} />;
const flash = (f: number, at: number, a: R, b: R) => <FlashCut frame={f} at={at} a={a} b={b} strength={0.75} />;
/** A hard cut hidden in a short cyan glow (3 frames, peak about 40 %), so the deep blacks survive. */
const soft = (f: number, at: number, a: R, b: R) => {
  const d = f - at;
  const g = d >= 0 && d < 3 ? [0.4, 0.2, 0.08][d] : 0;
  return (
    <AbsoluteFill style={{overflow: 'hidden'}}>
      <AbsoluteFill style={{filter: g > 0 ? `brightness(${1 + 0.5 * g})` : undefined}}>{d < 0 ? a(f) : b(f)}</AbsoluteFill>
      {g > 0 ? <AbsoluteFill style={{background: rgba('#9FF4FF', g), mixBlendMode: 'screen'}} /> : null}
    </AbsoluteFill>
  );
};

const scene = (f: number): React.ReactNode => {
  // wait 1
  if (f < CUT.W1) return T1(f);
  if (f < CUT.W1 + 12) return whip(f, CUT.W1, 'left', T1, DC);
  if (f < CUT.W2) return DC(f);
  if (f < CUT.W2 + 12) return whip(f, CUT.W2, 'right', DC, TH);
  if (f < CUT.Z1) return TH(f);
  if (f < CUT.Z1 + 16) return <ZoomThrough frame={f} at={CUT.Z1} dur={16} cx={960} cy={540} a={TH} b={BR1} />;
  if (f < CUT.F1 - 3) return BR1(f);
  if (f < CUT.F1 + 12) return flash(f, CUT.F1, BR1, CW);
  if (f < CUT.W3) return CW(f);
  if (f < CUT.W3 + 12) return whip(f, CUT.W3, 'up', CW, H2);
  // wait 2
  if (f < CUT.D2 + DIVE) return H2(f);
  if (f < CUT.F2 - 3) return K1(f);
  if (f < CUT.F2 + 12) return soft(f, CUT.F2, K1, BR2);
  if (f < CUT.W4) return BR2(f);
  if (f < CUT.W4 + 12) return whip(f, CUT.W4, 'left', BR2, CH);
  if (f < CUT.Z2) return CH(f);
  if (f < CUT.Z2 + 14) return <ZoomThrough frame={f} at={CUT.Z2} dur={14} cx={960} cy={420} a={CH} b={GB} />;
  if (f < CUT.F3 - 3) return GB(f);
  if (f < CUT.F3 + 12) return soft(f, CUT.F3, GB, BR3);
  if (f < CUT.W5) return BR3(f);
  if (f < CUT.W5 + 12) return whip(f, CUT.W5, 'right', BR3, H3);
  // wait 3
  if (f < CUT.D3 + DIVE) return H3(f);
  if (f < CUT.W6) return MP(f);
  if (f < CUT.W6 + 12) return whip(f, CUT.W6, 'up', MP, BS);
  if (f < CUT.W7) return BS(f);
  if (f < CUT.W7 + 12) return whip(f, CUT.W7, 'left', BS, GPU);
  if (f < BITS_SWAP - 3) return GPU(f);
  if (f < BITS_SWAP + 12) return soft(f, BITS_SWAP, GPU, BITS);
  if (f < CUT.W8) return BITS(f);
  if (f < CUT.W8 + 12) return whip(f, CUT.W8, 'down', BITS, X60);
  if (f < CUT.F5 - 3) return X60(f);
  if (f < CUT.F5 + 12) return soft(f, CUT.F5, X60, GAP);
  if (f < CUT.W9) return GAP(f);
  if (f < CUT.W9 + 12) return whip(f, CUT.W9, 'left', GAP, TRADE);
  return TRADE(f);
};

const W1_END = CUT.W3 + 6;
const W2_IN = CUT.D2 + DIVE;
const W3_IN = CUT.D3 + DIVE;
const hud = (f: number): React.ReactNode => (
  <>
    {/* wait 1 opener: the light-tunnel exit from S6's door 1, then badge "1" and the phrase */}
    <AbsoluteFill style={{background: `linear-gradient(90deg, ${rgba('#03060D', 0.72)} 0%, ${rgba('#03060D', 0.5)} 55%, rgba(3,6,13,0) 85%)`, opacity: win(f, FROM - 4, 12006, 8, 12)}} />
    <LightTunnel frame={f} peak={FROM - 2} pre={14} post={16} />
    <Words frame={f} items={W1_TITLE.words} x={468} y={566} size={104} align="left" exitAt={11998} />
    <ChapterBadge frame={f} n={1} at={W1_TITLE.badgeAt} from={{x: 330, y: 566, r: 104}} flyAt={11996} until={W1_END} />
    {f >= CUT.Z1 && f < CUT.F1 + 24 ? <Br1Hud frame={f} /> : null}
    {/* wait 2 opener */}
    <Words
      frame={f}
      items={[
        {t: 'As', at: a17('as a chat')},
        {t: 'a', at: a17('a chat')},
        {t: 'chat', at: a17('chat gets')},
        {t: 'gets', at: a17('gets longer')},
        {t: 'longer', at: a17('longer')},
      ]}
      x={960}
      y={170}
      size={88}
      exitAt={a17('longer') + 34}
    />
    <LightTunnel frame={f} peak={W2_IN} pre={14} post={14} />
    <ChapterBadge frame={f} n={2} at={W2_IN + 2} until={CUT.W5 + 6} />
    {f >= CUT.Z2 && f < CUT.F3 + 26 ? <GbHud frame={f} /> : null}
    <Words
      frame={f}
      items={[
        {t: 'More', at: a17('more there')},
        {t: 'to', at: a17('to haul')},
        {t: 'haul,', at: a17('haul')},
        {t: 'every', at: a17('every new piece')},
        {t: 'piece', at: a17('piece')},
      ]}
      x={960}
      y={170}
      size={92}
      exitAt={CUT.W5 + 18}
    />
    {/* wait 3 opener */}
    <KineticText frame={f} at={a18('sharing')} text="Sharing" mode="slam" x={960} y={180} size={130} exitAt={a18('sharing') + 34} />
    <LightTunnel frame={f} peak={W3_IN} pre={14} post={14} />
    <ChapterBadge frame={f} n={3} at={W3_IN + 2} until={TO + 40} />
  </>
);

export const S7: React.FC<{frame: number}> = ({frame}) => {
  const f = clamp(frame, FROM - 30, TO + 30);
  return (
    <AbsoluteFill style={{background: PAL.void, overflow: 'hidden'}}>
      {scene(f)}
      {hud(f)}
    </AbsoluteFill>
  );
};
