// S6 · P14: the 2011 study row (16 code-drawn drives, TRIM off vs TRIM on), the snapshot stamp, and the TRIM note that
// never gets through a multi-drive array. One Stage on the hardware stage; exits with a whip left (S6→S7 handoff).
import React from 'react';
import {
  EASE,
  Footnote,
  KineticText,
  Label,
  PAL,
  SANS,
  SPRING,
  Stage,
  TrimNote,
  checkText,
  clamp01,
  lerp,
  poseAt,
  prog,
  rgba,
  springAt,
  textWidth,
  toScreen,
  type CamKey,
} from '../../kit';
import {T} from './T';
import {CELLS, DriveTiles, TILE, fillTopY, type TileSpec} from './DriveTile';

/* ---------------------------------------------------------------- fixed illustrative values (DIRECTION §8 S6) */
/** TRIM off: 0.92–1.0 per drive (as cells of 32: 30–32) */
const OFF = [32, 31, 32, 30, 32, 31, 30, 32, 31, 32, 30, 31, 32, 32, 30, 31];
/** TRIM on: all ≤ 0.25 (≤ 8 of 32), five at 0 */
const ON = [0, 8, 2, 0, 5, 3, 0, 7, 4, 0, 8, 1, 3, 0, 6, 2];
const N = 16;
const PITCH = 92;
const X0 = 412;
const cx = (i: number) => X0 + i * PITCH;
const ROW1 = {single: 560, top: 345};
const ROW2 = 665;
/** the study frame (world) */
const F = {x0: 84, y0: 196, x1: 1852, y1: 884};
/** the array beat lives to the right of the study (world x offset) */
const OX = 2200;
const CAGE = {x0: OX + 1080, y0: 330, x1: OX + 1680, y1: 790};
const NOTE = {x: OX + 560, y: 560, w: 230};
/** the array set's framing: note on the left, the array filling the right (lands as the pan ends) */
const AX = OX + 1000;
const AY = 560;
const AZ = 1.16;
const NOTE_STOP_X = CAGE.x0 + 26 - NOTE.w / 2 - 6;
const PATH_DUR = 70;
const NOTE_PATH = {pts: [{x: NOTE.x, y: NOTE.y}, {x: OX + 1500, y: NOTE.y}], at: 0, dur: PATH_DUR, stopAt: 0};
{
  const total = OX + 1500 - NOTE.x;
  NOTE_PATH.stopAt = (NOTE_STOP_X - NOTE.x) / total;
  NOTE_PATH.at = T.never - Math.round(PATH_DUR * NOTE_PATH.stopAt);
}
const HIT = T.never;

/* ---------------------------------------------------------------- timing */
/** the drive comes out of the zoom at hero size and multiplies at once; the 16 land as "drive" (9084) is spoken */
const MULT = T.depends + 5;
const HERO_S = 3.1;
const RISE = 9268; // the title shrinks into the tag, the row rises (between "SSDs" and "With trim off")
const SCAN1 = T.trimOff + 3; // the recovery scan crosses the TRIM off row
const COPY = T.trimOn - 2; // the row copies down
const SWEEP = T.on + 1; // amber housekeeping clears the copies
const BAND = T.atMost + 2;
const PUSH0 = T.depending - 22;
const PULL = T.drivesChanged;
const PRINT = T.soTreat;
const STAMP = T.snapshot;
const PAN = T.andTrim;
/** the note launches from the frame's left edge on "trim" */
const NOTE_IN = T.trim2;
/** "Some setups": the array's front gate drops into place (the drives behind stay lit) */
const GATE = T.someSetups;
const WHIP = T.to - 6;

export const STUDY_CAM: CamKey[] = [
  {f: T.depends, x: 960, y: 540, zoom: 1.04},
  {f: PUSH0, x: 960, y: 540, zoom: 1.0, ease: 'linear'},
  {f: PUSH0 + 28, x: 1350, y: 650, zoom: 1.55},
  {f: PULL, x: 1320, y: 645, zoom: 1.62, ease: 'linear'},
  {f: PULL + 36, x: 960, y: 540, zoom: 1.0},
  {f: PAN, x: 960, y: 540, zoom: 0.98, ease: 'linear'},
  {f: PAN + 28, x: AX, y: AY, zoom: AZ},
  {f: WHIP, x: AX + 24, y: AY, zoom: AZ * 1.05, ease: 'linear'},
  {f: T.to, x: AX + 1500, y: AY, zoom: AZ * 1.05, ease: 'inExpo'},
  {f: T.to + 40, x: AX + 1800, y: AY, zoom: AZ * 1.05, ease: 'out'},
];

/* ---------------------------------------------------------------- the 16-drive row */
const rowTiles = (f: number): TileSpec[] => {
  const tiles: TileSpec[] = [];
  // multiply: before MULT one big drive at centre; then each flies to its slot (centre ones first)
  const order = Array.from({length: N}, (_, i) => i).sort((a, b) => Math.abs(a - 7.5) - Math.abs(b - 7.5));
  const rank = (i: number) => order.indexOf(i);
  const r = EASE.inOut(prog(f, RISE, 20));
  for (let i = 0; i < N; i++) {
    const sp = f < MULT ? 0 : springAt(f, MULT + rank(i) * 1.1, SPRING.snap);
    if (f < MULT && i > 0) continue;
    const bigS = HERO_S;
    const slotX = lerp(960 + (i - 7.5) * 104, cx(i), r);
    const slotS = lerp(1.22, 1, r);
    const x = lerp(960, slotX, sp);
    const y = lerp(ROW1.single, ROW1.top, r);
    const s = lerp(bigS, slotS, Math.min(1, sp));
    // ripple on "16"
    const rp = Math.max(0, Math.sin(Math.PI * clamp01((f - (T.sixteen + i * 1.4)) / 10)));
    // TRIM off recovery scan: fill bottom-up as the scan line passes
    const ti = SCAN1 + ((cx(i) - 360) / 1490) * 26;
    const u = prog(f, ti, 12, EASE.out);
    const n = Math.round(OFF[i] * u);
    const nPrev = Math.round(OFF[i] * prog(f - 3, ti, 12, EASE.out));
    tiles.push({
      cx: x,
      cy: f < MULT ? ROW1.single : y,
      s,
      lit: n,
      flashFrom: n > nPrev ? nPrev : undefined,
      ring: rp,
      chip: chipGlow(f, i, 0),
    });
  }
  return tiles;
};

const chipGlow = (f: number, i: number, row: number): number => {
  const t0 = T.chip + i * 1.6 + row * 3;
  const pulse = f >= t0 ? Math.exp(-(f - t0) / 8) : 0;
  const steady = prog(f, t0, 10) * (1 - prog(f, PULL + 30, 30)) * 0.55;
  return clamp01(Math.max(pulse, steady));
};

const onTiles = (f: number): TileSpec[] => {
  if (f < COPY) return [];
  const tiles: TileSpec[] = [];
  const slide = springAt(f, COPY, SPRING.snap);
  for (let i = 0; i < N; i++) {
    const t0 = SWEEP + i * 1.1;
    const u = prog(f, t0, 7, EASE.inCubic);
    const n = lerp(OFF[i], ON[i], u);
    const emberA = f >= t0 ? Math.exp(-Math.max(0, f - t0 - 7) / 7) * 0.85 : 0;
    const busy = f >= t0 - 2 && f < t0 + 12 ? 0.9 * Math.sin(Math.PI * clamp01((f - t0 + 2) / 14)) : 0;
    tiles.push({
      cx: cx(i),
      cy: lerp(ROW1.top, ROW2, slide),
      s: 1,
      op: clamp01((f - COPY) / 4),
      lit: n,
      ember: emberA > 0.02 ? {from: Math.round(n), to: OFF[i], a: emberA} : undefined,
      chip: Math.max(busy, chipGlow(f, i, 1)),
    });
  }
  return tiles;
};

/* ---------------------------------------------------------------- the array (TRIM never gets through) */
const ARRAY_X = [OX + 1220, OX + 1330, OX + 1440, OX + 1550];
const PHOTO_CELLS: number[][] = [[3, 9, 14], [5, 6], [11, 20], [2, 17]];
const OTHER_N = [12, 9, 14, 10];
const arrayTiles = (f: number): TileSpec[] => {
  const breathe = 0.82 + 0.18 * Math.sin((2 * Math.PI * f) / 90);
  return ARRAY_X.map((x, i) => {
    // "Some setups": a status ripple through the bays as the gate lands
    const blink = f >= GATE + 4 + i * 3 ? Math.exp(-(f - GATE - 4 - i * 3) / 7) : 0;
    return {
      cx: x,
      cy: 575,
      s: 1.18,
      lit: OTHER_N[i],
      extra: PHOTO_CELLS[i].map((k) => ({k, color: PAL.photo, a: breathe})),
      chip: 0.25 + 0.6 * blink,
    };
  });
};

/* ---------------------------------------------------------------- scene */
export const Study: React.FC<{frame: number}> = ({frame: f}) => {
  const SHAKE = [{at: STAMP, strength: 0.5}, {at: GATE + 6, strength: 0.25}, {at: HIT, strength: 0.6}];
  const pose = poseAt(f, STUDY_CAM, 0.6, SHAKE);
  const z = pose.zoom;
  const inv = 1 / z;
  // snapshot print: tilt + paper border
  const pr = EASE.inOut(prog(f, PRINT, 26));
  const tilt = -2.2 * pr;
  const shrink = 1 - 0.05 * pr;
  const frameOn = prog(f, T.study - 2, 16, EASE.out);
  const all = [...rowTiles(f), ...onTiles(f)];
  // TRIM on band at ¼ height
  const bandA = prog(f, BAND - 4, 12, EASE.out) * (f < COPY ? 0 : 1);
  const bandY = ROW2 + fillTopY(8) - 2;
  // scan line (white, recovery) across the TRIM off row
  const scanT = (f - SCAN1) / 26;
  const scanX = lerp(360, 1850, clamp01(scanT));
  const sweepT = (f - SWEEP) / 18;
  const sweepX = lerp(360, 1850, clamp01(sweepT));
  const groupT = `translate(960px, 540px) rotate(${tilt}deg) scale(${shrink}) translate(-960px, -540px)`;
  const hud = <StudyHud f={f} pose={pose} />;
  return (
    <Stage frame={f} env={{kind: 'stage', spot: 960, floor: 860, warm: 0.25, parallax: 0.18}} cam={STUDY_CAM} drift={0.6} shake={SHAKE} hud={hud}>
      {/* the study (a photo print once it becomes a snapshot) */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: groupT, transformOrigin: '0 0'}}>
        {pr > 0.01 ? (
          <div
            style={{
              position: 'absolute',
              left: F.x0 - 18,
              top: F.y0 - 18,
              width: F.x1 - F.x0 + 36,
              height: F.y1 - F.y0 + 36,
              borderRadius: 6,
              border: `${16 * pr}px solid ${rgba(PAL.paper, 0.92 * pr)}`,
              boxShadow: `0 30px 80px ${rgba('#000000', 0.6 * pr)}`,
            }}
          />
        ) : null}
        {frameOn > 0 ? (
          <div
            style={{
              position: 'absolute',
              left: F.x0,
              top: F.y0,
              width: F.x1 - F.x0,
              height: F.y1 - F.y0,
              borderRadius: 14,
              background: `linear-gradient(180deg, ${rgba('#121A2A', 0.55 * frameOn)}, ${rgba('#0A0F18', 0.7 * frameOn)})`,
              boxShadow: `inset 0 1px 0 ${rgba('#C3CCDD', 0.18 * frameOn)}`,
            }}
          />
        ) : null}
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Brackets f={f} u={frameOn} />
          {/* recovery scan line */}
          {scanT > -0.05 && scanT < 1.15 ? (
            <g opacity={Math.sin(Math.PI * clamp01(scanT * 0.9 + 0.05))}>
              <rect x={scanX - 22} y={ROW1.top - 125} width={44} height={250} fill={rgba('#FFFFFF', 0.12)} rx={20} />
              <rect x={scanX - 3} y={ROW1.top - 125} width={6} height={250} fill="#FFFFFF" rx={3} />
            </g>
          ) : null}
          <DriveTiles id="s6row" tiles={all} />
          {/* amber housekeeping sweep across the copies */}
          {sweepT > -0.05 && sweepT < 1.2 ? (
            <g opacity={Math.sin(Math.PI * clamp01(sweepT * 0.85 + 0.08))}>
              <rect x={sweepX - 26} y={ROW2 - 125} width={52} height={250} fill={rgba(PAL.drive, 0.16)} rx={22} />
              <rect x={sweepX - 3} y={ROW2 - 125} width={6} height={250} fill={PAL.driveHot} rx={3} />
            </g>
          ) : null}
        </svg>
        {/* the soft ¼ band (no hard line) */}
        {bandA > 0.01 ? (
          <div
            style={{
              position: 'absolute',
              left: 350 + (1 - bandA) * 700,
              width: (1850 - 350) * bandA,
              top: bandY - 22,
              height: 44,
              background: `linear-gradient(180deg, ${rgba(PAL.ink, 0)}, ${rgba(PAL.ink, 0.2)} 50%, ${rgba(PAL.ink, 0)})`,
              opacity: (1 - prog(f, STAMP - 4, 10)) * 0.9 + 0.1,
              borderRadius: 22,
            }}
          />
        ) : null}
        {/* world labels (counter-scaled so they stay screen-size through the push) */}
        <KineticText frame={f} at={T.trimOff} text="TRIM off" x={96} y={ROW1.top} align="left" size={56} weight={700} mode="slam" screen exitAt={PAN + 6} />
        <KineticText frame={f} at={T.nearlyAll} text="Nearly all recoverable" x={X0 - 38} y={ROW1.top + 150} align="left" size={44} weight={600} mode="rise" screen exitAt={COPY + 14} />
        <KineticText frame={f} at={T.trimOn} text="TRIM on" x={96} y={ROW2} align="left" size={56} weight={700} mode="slam" screen exitAt={PAN + 6} />
        <BandLabel f={f} inv={inv} />
        <Stamp f={f} inv={inv} />
      </div>
      {/* the array beat */}
      {f >= PAN - 4 ? <ArrayScene f={f} pose={pose} /> : null}
    </Stage>
  );
};

const Brackets: React.FC<{f: number; u: number}> = ({u}) => {
  if (u <= 0) return null;
  const L = 70 * u;
  const c = rgba(PAL.structure, 0.85);
  const d = [
    `M${F.x0} ${F.y0 + L}V${F.y0}H${F.x0 + L}`,
    `M${F.x1 - L} ${F.y0}H${F.x1}V${F.y0 + L}`,
    `M${F.x1} ${F.y1 - L}V${F.y1}H${F.x1 - L}`,
    `M${F.x0 + L} ${F.y1}H${F.x0}V${F.y1 - L}`,
  ].join('');
  return <path d={d} fill="none" stroke={c} strokeWidth={4} strokeLinecap="round" />;
};

/** "At most about a quarter" with a swatch of the soft band (legend style), under the TRIM on row's right end */
const BandLabel: React.FC<{f: number; inv: number}> = ({f, inv}) => {
  if (f < BAND - 2) return null;
  const size = 48;
  const text = 'At most about a quarter';
  checkText('label', size, true, {zoom: 1, rot: 0, space: 'screen'}, text);
  const e = prog(f, BAND, 12, EASE.outExpo);
  const ex = prog(f, STAMP - 16, 8, EASE.inCubic);
  if (ex >= 1) return null;
  const w = textWidth(text, size, 700) + 96;
  return (
    <div style={{position: 'absolute', left: 1838, top: ROW2 + 162, width: 0, height: 0, transform: `scale(${inv})`, transformOrigin: '0 0'}}>
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: w,
          transform: `translateY(-50%) translateY(${(1 - e) * 24}px)`,
          opacity: e * (1 - ex),
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '8px 18px',
          borderRadius: 14,
          background: rgba('#070B14', 0.72),
          boxSizing: 'border-box',
        }}
      >
        <div style={{width: 58, height: 26, borderRadius: 13, background: `linear-gradient(180deg, ${rgba(PAL.ink, 0)}, ${rgba(PAL.ink, 0.6)} 50%, ${rgba(PAL.ink, 0)})`}} />
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: size, color: PAL.ink, whiteSpace: 'nowrap', letterSpacing: '-0.01em'}}>{text}</div>
      </div>
    </div>
  );
};

/** "A snapshot, not a rule": a stamp that slams onto the print */
const Stamp: React.FC<{f: number; inv: number}> = ({f, inv}) => {
  if (f < STAMP - 2) return null;
  const size = 88;
  const text = 'A snapshot, not a rule';
  checkText('keyword', size, true, {zoom: 1, rot: 0, space: 'screen'}, text);
  const sl = springAt(f, STAMP, SPRING.slam);
  const s = lerp(1.5, 1, sl);
  const op = clamp01((f - STAMP + 2) / 3);
  const ink = Math.exp(-Math.max(0, f - STAMP) / 6);
  return (
    <div style={{position: 'absolute', left: 960, top: 520, width: 0, height: 0, transform: `scale(${inv})`, transformOrigin: '0 0'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(-50%, -50%) rotate(-5deg) scale(${s})`,
          opacity: op,
          padding: '18px 44px 24px',
          borderRadius: 18,
          border: `6px solid ${PAL.ink}`,
          outline: `2px solid ${rgba(PAL.ink, 0.5)}`,
          outlineOffset: 8,
          background: rgba('#070B14', 0.82),
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 ${40 * ink}px ${rgba(PAL.ink, 0.5 * ink)}`,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: size,
          color: PAL.ink,
          whiteSpace: 'nowrap',
          letterSpacing: '-0.015em',
          lineHeight: 1.05,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** title pieces as spoken, then a decor tag on the frame's top-left */
const TITLE = [
  {t: 'Carnegie Mellon ', at: T.carnegie},
  {t: 'study', at: T.study},
  {t: ' · ', at: T.y2011},
  {t: '2011', at: T.y2011},
  {t: ' · ', at: T.sixteen},
  {t: '16 SSDs', at: T.sixteen},
];
const TITLE_SIZE = 72;
const TAG_SIZE = 22;
const Title: React.FC<{f: number; pose: {x: number; y: number; zoom: number; rot: number}}> = ({f, pose}) => {
  if (f < T.study - 2) return null;
  const full = TITLE.map((p) => p.t).join('');
  const W = textWidth(full, TITLE_SIZE, 700);
  const sh = EASE.inOut(prog(f, RISE - 2, 18));
  const k = lerp(1, TAG_SIZE / TITLE_SIZE, sh);
  // the tag rides with the world (the print), so place it through the camera
  const tagW = toScreen(pose, F.x0 + 26, F.y0);
  const cxp = lerp(960, tagW.x + (W * TAG_SIZE) / TITLE_SIZE / 2 + 14, sh);
  const cyp = lerp(300, tagW.y, sh);
  if (sh <= 0) checkText('keyword', TITLE_SIZE, true, {zoom: 1, rot: 0, space: 'screen'}, full);
  if (sh >= 1) checkText('decor', TAG_SIZE, true, {zoom: 1, rot: 0, space: 'screen'}, full);
  const exit = prog(f, PAN + 4, 10);
  if (exit >= 1) return null;
  const tilt = -2.2 * EASE.inOut(prog(f, PRINT, 26));
  return (
    <div style={{position: 'absolute', left: cxp, top: cyp, width: 0, height: 0, opacity: 1 - exit}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${k})`,
          whiteSpace: 'nowrap',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: TITLE_SIZE,
          letterSpacing: '-0.01em',
          color: sh > 0.5 ? PAL.muted : PAL.ink,
          padding: `${6 + 10 * sh}px ${20 + 30 * sh}px`,
          borderRadius: 14 + 20 * sh,
          background: rgba('#070B14', 0.85 * sh),
        }}
      >
        {TITLE.map((p, i) => {
          const e = prog(f, p.at, 12, EASE.outExpo);
          return (
            <span key={i} style={{display: 'inline-block', whiteSpace: 'pre', opacity: e, transform: `translateY(${(1 - e) * 40}%)`}}>
              {p.t}
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** "Depends on who made" + "the chip", laid out as one centred line */
const CAP = (() => {
  const size = 60;
  const a = 'Depends on who made';
  const b = 'the chip';
  const gap = 0.26 * size;
  const w1 = textWidth(a, size, 700);
  const W = w1 + gap + textWidth(b, size, 700);
  const x1 = 960 - W / 2;
  return {size, a, b, x1, x2: x1 + w1 + gap};
})();

const StudyHud: React.FC<{f: number; pose: {x: number; y: number; zoom: number; rot: number}}> = ({f, pose}) => {
  // the array label leader points at the cage's top-left corner
  const cageTL = toScreen(pose, CAGE.x0 + 60, CAGE.y0 + 4);
  // whip streaks
  const wv = clamp01((f - WHIP) / 6);
  const whipA = f >= WHIP ? Math.sin(Math.PI * clamp01(wv * 0.9 + 0.1)) : 0;
  return (
    <>
      <Title f={f} pose={pose} />
      <KineticText frame={f} at={T.depending} text={CAP.a} x={CAP.x1} y={300} align="left" size={CAP.size} weight={700} mode="rise" stagger={7} exitAt={PULL + 8} />
      <KineticText frame={f} at={T.chip} text={CAP.b} x={CAP.x2} y={300} align="left" size={CAP.size} weight={700} mode="slam" accent={PAL.drive} exitAt={PULL + 8} />
      <Footnote frame={f} at={T.nearlyAll} exitAt={PAN + 4} text="Illustrative spread, not per-drive data" y={1010} />
      <Label frame={f} at={T.certain} text="Certain multi-drive arrays" x={cageTL.x - 40} y={cageTL.y - 96} to={cageTL} side="right" size={52} exitAt={T.to + 4} />
      {whipA > 0.01 ? (
        <div style={{position: 'absolute', inset: 0, opacity: whipA * 0.6, mixBlendMode: 'screen'}}>
          {Array.from({length: 9}, (_, i) => {
            const p = ((i * 0.618) % 1) * 0.9 + 0.05;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: `${p * 100}%`,
                  width: '100%',
                  height: 3 + (i % 3) * 2,
                  background: `linear-gradient(90deg, rgba(0,0,0,0), ${rgba(i % 3 ? '#FFFFFF' : PAL.structure, 0.7)}, rgba(0,0,0,0))`,
                }}
              />
            );
          })}
        </div>
      ) : null}
    </>
  );
};

/* ---------------------------------------------------------------- the array scene (world, right of the study) */
const ArrayScene: React.FC<{f: number; pose: {x: number; y: number; zoom: number; rot: number}}> = ({f, pose}) => {
  // the array set is already standing when the pan lands
  const cageOp = 1;
  const dy = 0;
  // the gate drops into place on "Some setups"
  const g = springAt(f, GATE, SPRING.heavy);
  const gateY = -(1 - g) * 640;
  const gateOp = clamp01(g * 3);
  // the note slides in from the frame's left edge on "trim" (screen-relative, so it reads even while the pan lands)
  const glide = EASE.out(prog(f, NOTE_IN, 30));
  const startX = pose.x + (-260 - 960) / pose.zoom;
  const noteDX = (1 - glide) * (startX - NOTE.x);
  const guide = prog(f, NOTE_IN + 30, 24, EASE.out) * (1 - prog(f, HIT - 6, 6));
  const hit = f >= HIT ? f - HIT : -1;
  const ring = hit >= 0 && hit < 18 ? hit / 18 : -1;
  const gateFlash = hit >= 0 ? Math.exp(-hit / 6) : 0;
  const W = CAGE.x1 - CAGE.x0;
  const H = CAGE.y1 - CAGE.y0;
  return (
    <>
      {/* guide: where the note wants to go */}
      {guide > 0.01 ? (
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <line x1={NOTE.x + 140} y1={NOTE.y} x2={lerp(NOTE.x + 140, CAGE.x0 + 250, guide)} y2={NOTE.y} stroke={rgba(PAL.structure, 0.55)} strokeWidth={4} strokeDasharray="14 14" strokeDashoffset={-f * 1.5} />
        </svg>
      ) : null}
      {/* the cage */}
      {cageOp > 0.01 ? (
        <div style={{position: 'absolute', left: CAGE.x0, top: CAGE.y0 + dy, width: W, height: H, opacity: cageOp}}>
          <div style={{position: 'absolute', left: 20, right: 20, bottom: -22, height: 40, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0))'}} />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 22,
              background: 'linear-gradient(180deg, #2C3850 0%, #182132 40%, #0D131F 100%)',
              border: `2px solid ${rgba(PAL.structure, 0.5)}`,
              boxShadow: `0 30px 70px rgba(0,0,0,0.6), inset 0 2px 0 ${rgba('#C3CCDD', 0.35)}`,
            }}
          />
          <div style={{position: 'absolute', left: 64, right: 22, top: 22, bottom: 22, borderRadius: 14, background: '#070A10', boxShadow: 'inset 0 6px 20px rgba(0,0,0,0.8)'}} />
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{position: 'absolute', left: W - 30, top: 34 + i * 18, width: 8, height: 8, borderRadius: 4, background: rgba('#FFFFFF', 0.25 + 0.5 * ((Math.floor(f / 6) + i * 3) % 5 === 0 ? 1 : 0))}} />
          ))}
        </div>
      ) : null}
      {cageOp > 0.01 ? (
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: dy, overflow: 'visible'}}>
          <DriveTiles id="s6arr" tiles={arrayTiles(f)} />
        </svg>
      ) : null}
      {/* the gate: the array's front panel that never passes the note on */}
      {gateOp > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: CAGE.x0 - 4,
            top: CAGE.y0 + dy - 10 + gateY,
            width: 58,
            height: H + 20,
            borderRadius: 14,
            opacity: gateOp,
            background: `linear-gradient(90deg, #5E6E86, #36445A 40%, #1D2636)`,
            border: `2px solid ${rgba(gateFlash > 0.05 ? PAL.loss : PAL.structure, 0.6 + 0.4 * gateFlash)}`,
            boxShadow: `0 0 ${50 * gateFlash}px ${rgba(PAL.loss, 0.7 * gateFlash)}, inset 0 2px 0 rgba(255,255,255,0.3)`,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{position: 'absolute', left: 16, right: 16, top: 70 + i * 120, height: 90, borderRadius: 8, background: 'linear-gradient(180deg, #121925, #0A0F17)', border: `1px solid ${rgba('#FFFFFF', 0.12)}`}} />
          ))}
        </div>
      ) : null}
      {ring >= 0 ? (
        <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <circle cx={CAGE.x0} cy={NOTE.y} r={30 + 150 * EASE.out(ring)} fill="none" stroke={PAL.loss} strokeWidth={10 * (1 - ring)} opacity={1 - ring} />
        </svg>
      ) : null}
      <div style={{position: 'absolute', left: noteDX, top: 0, width: 0, height: 0}}>
        <TrimNote frame={f} variant="envelope" x={NOTE.x} y={NOTE.y} w={NOTE.w} at={NOTE_IN} path={NOTE_PATH} float={4} numberSize={18} />
      </div>
    </>
  );
};

export const STUDY_SPANS = {MULT, RISE, SCAN1, COPY, SWEEP, BAND, PUSH0, PULL, PRINT, STAMP, PAN, NOTE_IN, GATE, HIT, WHIP, CELLS, TILE};
