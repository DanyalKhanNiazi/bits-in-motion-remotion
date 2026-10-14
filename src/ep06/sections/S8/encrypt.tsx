/**
 * S8 P20, encryption.
 *   E  the key on the hardware stage: "Works before you delete anything", "Encryption", BitLocker; the key slots in
 *   F  back to the save moment: the key already sits in the write path. The photo's Bits sink into the key and only
 *      glyph packets come out and land in the boxes (no plain Bit ever reaches a box; every other block is already
 *      glyphs). The layers split: the copies the drive shuffles into spare are glyphs too.
 *   G  the drive pulled out and read without the key: noise. Destroying the key (shatter) under the right conditions.
 */
import React from 'react';
import {
  Archive,
  EASE,
  Footnote,
  KeyFixture,
  KineticText,
  PAL,
  PHOTO,
  PhotoBits,
  Prop,
  QuoteStrip,
  ScrambleField,
  ScrambleRows,
  Stage,
  VerdictChip,
  boxC,
  clamp01,
  keyFixtureAnchors,
  lerp,
  MOVERS,
  prog,
  rgba,
  track,
  type ArchiveEvent,
  type CamKey,
  type Content,
} from '../../kit';
import {LAY} from './coin';
import {CUT, T} from './times';

/* ---------------------------------------------------------------- E: the key */
const FIX = {x: 1190, y: 625, w: 690};
const CAM_E: CamKey[] = [
  {f: CUT.key, x: 1040, y: 600, zoom: 0.94},
  {f: T.encryption - 2, x: 1020, y: 590, zoom: 1.0, ease: 'inOut'},
  {f: T.encryption + 8, x: 1010, y: 586, zoom: 1.06, ease: 'outExpo'},
  {f: T.encrypts, x: 1060, y: 610, zoom: 1.1},
  {f: CUT.save + 6, x: 1110, y: 630, zoom: 1.14, ease: 'inOut'},
];
const SLOT_AT = T.key1 - 18;
export const ShotE: React.FC<{f: number}> = ({f}) => {
  const glow = prog(f, T.encryption - 2, 10);
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: 1150, floor: 820, warm: 0.5}}
      cam={CAM_E}
      shake={[{at: T.encryption + 3, strength: 0.4}, {at: SLOT_AT + 18, strength: 0.25}]}
      hud={
        <>
          <KineticText frame={f} at={T.worksBefore} exitAt={T.encryption - 6} text="Works before you delete anything" x={960} y={140} size={76} mode="rise" />
          <KineticText frame={f} at={T.encryption} exitAt={CUT.save - 4} text="Encryption" x={960} y={150} size={170} mode="slam" accent={PAL.drive} />
          <VerdictChip frame={f} at={T.bitlocker + 2} exitAt={CUT.save - 4} text="BitLocker" tone="neutral" x={130} y={470} align="left" size={60} />
          <KineticText frame={f} at={T.editions} exitAt={CUT.save - 4} text="In many editions of Windows" x={130} y={560} size={50} align="left" mode="rise" />
        </>
      }
    >
      <KeyFixture
        frame={f}
        x={FIX.x}
        y={FIX.y}
        w={FIX.w}
        enter={{kind: 'rise', at: CUT.key + 4, dur: 26}}
        rim={{color: PAL.structure, strength: 0.5}}
        sweep={{at: [CUT.key + 14, T.encryption, SLOT_AT + 16], dur: 24}}
        float={3}
        shadow={0.6}
        glow={glow}
        slotAt={SLOT_AT}
      />
    </Stage>
  );
};

/* ---------------------------------------------------------------- F: the save moment */
const KEY_W = 650;
const KEY_C = {x: 1215, y: -40}; // the key's centre in the write path (world)
const ka0 = keyFixtureAnchors({x: 0, y: 0, w: KEY_W});
const KEYC0 = {x: (ka0.keyBow.x + ka0.keyTip.x) / 2, y: (ka0.keyBow.y + ka0.keyTip.y) / 2};
const KEY_P = {x: KEY_C.x - KEYC0.x, y: KEY_C.y - KEYC0.y};
const ka = keyFixtureAnchors({...KEY_P, w: KEY_W});
const PASS = {x: 1560, y: -270, w: 176, h: 226};
const DISSOLVE = T.ifOn + 17;
const SINK = DISSOLVE + 18;
const SINK_DUR = 22;
const PACK_DUR = 15;
// glyph packets leave the key's tip in run order and land in the photo's boxes
const PACK_ORDER = [21, 22, 23, 98, 99, 100, 58, 59, 60];
const packStart = (id: number) => SINK + 14 + PACK_ORDER.indexOf(id) * 3;
const landAt = (id: number) => packStart(id) + PACK_DUR;
const SPLIT_AT = T.leftovers + 4;
const F_EVENTS: ArchiveEvent[] = [
  // BitLocker was on before the save: every block on the drive already holds glyphs
  {at: T.from, op: 'scramble', target: 'all'},
  {at: landAt(60) + 6, op: 'threads', dur: 20},
  {at: SPLIT_AT, op: 'splitLayers', dur: 40},
  {at: T.oldCopies - 4, op: 'remap', target: MOVERS, dur: 30},
  {at: T.oldCopies + 10, op: 'remap', target: 'photo', dur: 30},
];
const CAM_F: CamKey[] = [
  {f: CUT.save, x: 1160, y: 206, zoom: 0.88},
  {f: landAt(60), x: 1140, y: 236, zoom: 0.84},
  {f: SPLIT_AT + 44, ...LAY, dur: 50, ease: 'inOut'},
  {f: T.scrambled - 6, ...LAY, zoom: LAY.zoom * 1.05},
  {f: CUT.pulled + 12, x: 1640, y: 610, zoom: LAY.zoom * 1.34, dur: 44, ease: 'inOut'},
];

const Packets: React.FC<{f: number}> = ({f}) => {
  const tip = ka.keyTip;
  const nodes: React.ReactNode[] = [];
  for (const id of PACK_ORDER) {
    const b = boxC(id);
    const t = (f - packStart(id)) / PACK_DUR;
    if (t < 0 || t > 1.7) continue;
    const ctrl = {x: (tip.x + b.x) / 2 + 30, y: Math.min(tip.y, b.y) - 70};
    const pos = (u: number) => {
      const e = EASE.inOut(clamp01(u));
      return {x: (1 - e) * (1 - e) * tip.x + 2 * (1 - e) * e * ctrl.x + e * e * b.x, y: (1 - e) * (1 - e) * tip.y + 2 * (1 - e) * e * ctrl.y + e * e * b.y};
    };
    if (t <= 1) {
      const p = pos(t);
      const tr = [0.08, 0.16, 0.24].map((d) => pos(t - d));
      nodes.push(
        <g key={id}>
          <polyline points={[p, ...tr].map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`).join(' ')} fill="none" stroke={PAL.muted} strokeOpacity={0.35} strokeWidth={6} strokeLinecap="round" />
          <rect x={p.x - 26} y={p.y - 19} width={52} height={38} rx={7} fill="#0A0F18" stroke={rgba(PAL.annotation, 0.7)} strokeWidth={2} />
          <ScrambleRows frame={f} rect={{x: p.x - 21, y: p.y - 17, w: 42, h: 32}} seed={`pk${id}`} size={12} every={2} />
        </g>,
      );
    } else {
      const u = (t - 1) / 0.7;
      nodes.push(<rect key={id} x={b.x - 36 - 14 * u} y={b.y - 36 - 14 * u} width={72 + 28 * u} height={72 + 28 * u} rx={9} fill="none" stroke={PAL.annotation} strokeWidth={4 * (1 - u) + 1} opacity={1 - u} />);
    }
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none'}}>
      {nodes}
    </svg>
  );
};

export const ShotF: React.FC<{f: number}> = ({f}) => {
  const boxes: Record<number, Content> = {};
  for (const id of PHOTO) if (f < landAt(id)) boxes[id] = 'empty';
  const keyGlow = 0.55 + 0.45 * Math.max(prog(f, SINK + 6, 8) * (1 - prog(f, landAt(60), 14)), 0);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={CAM_F}
      hud={
        <>
          <KineticText frame={f} at={T.ifOn + 6} exitAt={SPLIT_AT + 6} text="If it was on when saved" x={96} y={136} size={72} align="left" mode="rise" />
          <Footnote frame={f} at={T.ifOn + 20} exitAt={CUT.pulled - 6} text="Only protects data saved while on" />
        </>
      }
    >
      <Archive frame={f} state="SSD_SAVED" events={F_EVENTS} boxes={boxes} />
      <PhotoBits frame={f} at={DISSOLVE} dur={18} mode="dissolve" from={PASS} image="fictional-passport_b" grid={[10, 13]} />
      <PhotoBits frame={f} at={SINK} dur={SINK_DUR} mode="sink" from={PASS} grid={[10, 13]} to={[ka.keyBow]} />
      <KeyFixture
        frame={f}
        part="key"
        x={KEY_P.x}
        y={KEY_P.y}
        w={KEY_W}
        glow={keyGlow}
        float={3}
        enter={{kind: 'fade', at: CUT.save - 2, dur: 4}}
        exit={{kind: 'fade', at: SPLIT_AT - 2, dur: 16}}
      />
      <Packets f={f} />
    </Stage>
  );
};

/* ---------------------------------------------------------------- G: pulled out, read without the key; the key destroyed */
const BOARD = {x: 820, y: 700, w: 980};
const FIELD = {x: 300, y: 80, w: 1080, h: 300};
const KEY2_W = 900;
const kb0 = keyFixtureAnchors({x: 0, y: 0, w: KEY2_W});
const KEY2_C = {x: 1490, y: 470};
const KEY2_P = {x: KEY2_C.x - (kb0.keyBow.x + kb0.keyTip.x) / 2, y: KEY2_C.y - (kb0.keyBow.y + kb0.keyTip.y) / 2};
const SHATTER = T.destroying + 6;
const CAM_G: CamKey[] = [
  {f: CUT.pulled, x: 860, y: 600, zoom: 0.95},
  {f: T.readsIt, x: 840, y: 560, zoom: 1.02, ease: 'out'},
  {f: T.thatsAlso + 34, x: 1060, y: 540, zoom: 0.98, dur: 40, ease: 'inOut'},
  {f: CUT.objects + 6, x: 1030, y: 548, zoom: 1.04},
];
export const ShotG: React.FC<{f: number}> = ({f}) => {
  const beamU = prog(f, T.readsIt - 2, 28, EASE.inOut);
  const beamOp = f >= T.readsIt - 2 && f < T.readsIt + 30 ? Math.sin(Math.PI * beamU) : 0;
  const fill = track(f, [
    [T.readsIt + 8, 0],
    [T.noise + 6, 1, EASE.out],
  ]);
  const cone = clamp01(prog(f, T.readsIt + 6, 14)) * (0.75 + 0.25 * Math.sin(f / 9));
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: 900, floor: 830, warm: 0.3}}
      cam={CAM_G}
      shake={[{at: T.pulls + 10, strength: 0.4}, {at: SHATTER, strength: 0.8}]}
      hud={
        <>
          <QuoteStrip frame={f} at={T.destroying + 4} exitAt={CUT.objects - 2} source="NIST" reported="destroying the key, a fast way to sanitize" />
          <VerdictChip frame={f} at={T.underRight + 2} exitAt={CUT.objects - 2} text="Under the right conditions" tone="neutral" x={96} y={786} align="left" size={48} />
        </>
      }
    >
      {/* the read: a light cone from the drive up to what it returns: noise */}
      {cone > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <defs>
            <linearGradient id="s8-cone" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#DDE8FF" stopOpacity={0.3} />
              <stop offset="1" stopColor="#DDE8FF" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <path d={`M${BOARD.x - 120} ${BOARD.y - 120}L${BOARD.x + 120} ${BOARD.y - 120}L${FIELD.x + FIELD.w} ${FIELD.y + FIELD.h}L${FIELD.x} ${FIELD.y + FIELD.h}Z`} fill="url(#s8-cone)" opacity={cone} />
          <rect x={FIELD.x - 16} y={FIELD.y - 14} width={FIELD.w + 32} height={FIELD.h + 28} rx={14} fill="#070B13" fillOpacity={0.82 * clamp01(cone * 1.4)} stroke={rgba(PAL.annotation, 0.45 * cone)} strokeWidth={2} />
        </svg>
      ) : null}
      <ScrambleField frame={f} rect={FIELD} at={T.readsIt + 8} seed="s8-noise" size={32} every={f >= T.noise ? 2 : 3} fill={fill} />
      <Prop
        frame={f}
        src="ssd-board_a"
        x={BOARD.x}
        y={BOARD.y}
        w={BOARD.w}
        enter={{kind: 'slide', from: 'down', at: T.pulls - 6, dist: 760}}
        rim={{color: PAL.structure, strength: 0.6}}
        sweep={{at: [T.pulls + 12], dur: 22}}
        float={3}
        shadow={0.6}
      />
      {beamOp > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: BOARD.x - 560,
            top: lerp(BOARD.y - 300, BOARD.y + 220, beamU) - 40,
            width: 1120,
            height: 80,
            background: `linear-gradient(180deg, ${rgba('#FFFFFF', 0)}, ${rgba('#F2F6FF', 0.5 * beamOp)}, ${rgba('#FFFFFF', 0)})`,
            mixBlendMode: 'screen',
          }}
        />
      ) : null}
      <KeyFixture
        frame={f}
        part="key"
        x={KEY2_P.x}
        y={KEY2_P.y}
        w={KEY2_W}
        glow={1}
        float={4}
        enter={{kind: 'slide', from: 'right', at: T.thatsAlso + 4, dist: 900}}
        shatterAt={SHATTER}
      />
    </Stage>
  );
};

/* ---------------------------------------------------------------- J: the limit: once the PC has started, the key is in */
export const SLOT_J = T.oncePc + 6;
const CAM_J: CamKey[] = [
  {f: T.oncePc - 20, x: 980, y: 600, zoom: 1.0},
  {f: T.windowsReads, x: 1010, y: 640, zoom: 1.12, ease: 'inOut'},
];
export const ShotJ: React.FC<{f: number}> = ({f}) => (
  <Stage frame={f} env={{kind: 'stage', spot: 1000, floor: 820, warm: 0.55}} cam={CAM_J} shake={[{at: SLOT_J + 18, strength: 0.35}]}>
    <KeyFixture
      frame={f}
      x={1000}
      y={600}
      w={700}
      rim={{color: PAL.structure, strength: 0.5}}
      sweep={{at: [SLOT_J + 16], dur: 22}}
      float={3}
      shadow={0.6}
      glow={0.8}
      slotAt={SLOT_J}
    />
  </Stage>
);
