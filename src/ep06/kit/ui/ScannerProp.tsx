/**
 * Ep06 UI kit: <ScannerProp>, the recovery scanner (recovery-scanner_a, cyan knob rings regraded to white) with a white
 * beam, a scan sweep, and a destination tray (a separate unit: "a different drive") that fills with the photo.
 *
 *   <ScannerProp frame={f} x={900} y={560} w={980} beam={{at: a}} scan={{at: a + 6}} tray="photo" trayAt={a + 20} />
 *   <ScannerProp … tray="partial" missing={[{at: w1, y0: 0.2, y1: 0.28}]} />      // grey missing bands
 *   <ScannerProp … tray="empty" />   <ScannerProp … tray="unknown" />            // dashed frame / pulsing "?"
 *   <ScannerProp … beamTo={{x: 1400, y: 300, rx: 120}} />                         // beam aimed at a parent-px point
 *
 * Copy Bits (the photo's own bytes, so cyan) stream from the plate to the tray while it fills. scannerAnchors() gives
 * the lens, plate, tray and tray-card points in parent px.
 */
import React from 'react';
import {EASE, PAL, SANS} from '../look';
import {Prop, propPoint, propScale, type PropProps} from '../Prop';
import {assetBox, type AssetName} from '../assets';
import {clamp01, lerp, prog, quadMatrix, rgba, safeId, win, type Quad} from '../util';
import {UI_REGIONS} from './regions';
import {Crop, REGRADE, Regrade, PASS_CARD_BOX} from './shared';

export type TrayMode = 'none' | 'unknown' | 'photo' | 'empty' | 'partial';
export type ScannerProps = Omit<PropProps, 'src' | 'children'> & {
  /** override the render (keep recovery-scanner_a's framing) */
  imageSrc?: AssetName;
  beam?: {at: number; until?: number};
  /** sweep line(s) across the target: every `every` frames from `at` until `until` (default one pass) */
  scan?: {at: number; dur?: number; every?: number; until?: number};
  /** aim the beam at a parent-px point instead of the plate */
  beamTo?: {x: number; y: number; rx?: number; ry?: number};
  tray?: TrayMode;
  trayAt?: number;
  fillDur?: number;
  /** partial: grey bands (fractions of the card height) that land at frames */
  missing?: ReadonlyArray<{at: number; y0: number; y1: number}>;
  /** cyan copy Bits plate → tray while filling (default on for photo/partial) */
  copyBits?: boolean;
};

const SRC: AssetName = 'recovery-scanner_a';
const R = UI_REGIONS;
const avg = (q: Quad) => ({x: (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, y: (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4});
const lerpPt = (a: readonly [number, number], b: readonly [number, number], t: number): [number, number] => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

/** Points of a placed scanner in parent px (ignores float/tilt). */
export const scannerAnchors = (p: {x: number; y: number; w?: number; h?: number; imageSrc?: AssetName}) => {
  const src = p.imageSrc ?? SRC;
  const pt = (x: number, y: number) => propPoint(src, p, x, y);
  const plate = avg(R.scanPlate);
  const tray = avg(R.scanTray);
  const card = avg(R.scanTrayCard);
  return {
    lens: pt(530, 365),
    beamOrigin: pt(R.scanBeamOrigin[0], R.scanBeamOrigin[1]),
    plate: pt(plate.x, plate.y),
    tray: pt(tray.x, tray.y),
    trayCard: pt(card.x, card.y),
    trayCardTop: pt((R.scanTrayCard[0][0] + R.scanTrayCard[1][0]) / 2, (R.scanTrayCard[0][1] + R.scanTrayCard[1][1]) / 2),
    scale: propScale(src, p),
  };
};

const CARD_W = 300;
const CARD_H = 380;
/** the top 0.79 of the passport card (photo + border) matches the tray card's apparent aspect */
const CARD_CROP: readonly [number, number, number, number] = [PASS_CARD_BOX[0], PASS_CARD_BOX[1], PASS_CARD_BOX[2], PASS_CARD_BOX[1] + (PASS_CARD_BOX[2] - PASS_CARD_BOX[0]) / 0.79];

export const ScannerProp: React.FC<ScannerProps> = ({imageSrc = SRC, beam, scan, beamTo, tray = 'none', trayAt = 0, fillDur = 40, missing, copyBits, ...pp}) => {
  const f = pp.frame;
  const uid = safeId(React.useId());
  const b = assetBox(imageSrc);
  const k = propScale(imageSrc, pp);
  const beamV = beam ? win(f, beam.at, beam.until, 6, 8) * (0.93 + 0.07 * Math.sin(f * 0.9)) : 0;
  const O = R.scanBeamOrigin;
  // target (native px)
  const tgt = beamTo
    ? {x: b.cx + (beamTo.x - pp.x) / k, y: b.cy + (beamTo.y - pp.y) / k, rx: (beamTo.rx ?? 110) / k, ry: (beamTo.ry ?? (beamTo.rx ?? 110) * 0.4) / k}
    : null;
  const P = R.scanPlate;
  const cone = tgt
    ? `${O[0] - 112},${O[1]} ${O[0] + 112},${O[1]} ${tgt.x + tgt.rx},${tgt.y} ${tgt.x},${tgt.y + tgt.ry} ${tgt.x - tgt.rx},${tgt.y}`
    : `${O[0] - 112},${O[1]} ${O[0] + 112},${O[1]} ${P[1][0]},${P[1][1]} ${P[2][0]},${P[2][1]} ${P[3][0]},${P[3][1]}`;
  // sweep
  let sweepP: number | null = null;
  if (scan && beamV > 0) {
    const dur = scan.dur ?? 36;
    const every = scan.every ?? 1e9;
    const t = f - scan.at;
    if (t >= 0 && (scan.until === undefined || f < scan.until)) {
      const ph = every < 1e8 ? t % every : t;
      if (ph <= dur) sweepP = EASE.inOut(ph / dur);
    }
  }
  let sweepLine: React.ReactNode = null;
  if (sweepP !== null) {
    const [ax, ay] = tgt ? [tgt.x - tgt.rx, lerp(tgt.y - tgt.ry, tgt.y + tgt.ry, sweepP)] : lerpPt(P[0], P[3], sweepP);
    const [bx, by] = tgt ? [tgt.x + tgt.rx, lerp(tgt.y - tgt.ry, tgt.y + tgt.ry, sweepP)] : lerpPt(P[1], P[2], sweepP);
    const a = beamV * Math.sin(Math.PI * Math.min(1, sweepP * 1.15 + 0.05));
    sweepLine = (
      <g opacity={a}>
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={rgba('#FFFFFF', 0.25)} strokeWidth={34} strokeLinecap="round" />
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke={rgba('#FFFFFF', 0.5)} strokeWidth={14} strokeLinecap="round" />
        <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
      </g>
    );
  }
  // tray card
  const fillU = tray === 'photo' || tray === 'partial' ? prog(f, trayAt, fillDur, EASE.inOut) : prog(f, trayAt, 18, EASE.out);
  const shown = tray !== 'none' && f >= trayAt - 2;
  const C = R.scanTrayCard;
  const upx = C[0][0] - C[3][0];
  const upy = C[0][1] - C[3][1];
  const ul = Math.hypot(upx, upy);
  const rise = shown ? (1 - prog(f, trayAt - 2, 12, EASE.outExpo)) * 60 : 0;
  const quad = C.map(([x, y]) => [x - (upx / ul) * rise, y - (upy / ul) * rise] as const) as unknown as Quad;
  // clip at the slot line (the card's resting bottom edge), so it rises out of the tray
  const sl = (C[2][1] - C[3][1]) / (C[2][0] - C[3][0]);
  const slotClip = `polygon(0px 0px, ${b.w}px 0px, ${b.w}px ${C[3][1] + (b.w - C[3][0]) * sl}px, 0px ${C[3][1] - C[3][0] * sl}px)`;
  const bands =
    tray === 'partial'
      ? missing ?? [
          {at: trayAt + Math.round(fillDur * 0.3), y0: 0.2, y1: 0.29},
          {at: trayAt + Math.round(fillDur * 0.55), y0: 0.48, y1: 0.56},
          {at: trayAt + Math.round(fillDur * 0.8), y0: 0.74, y1: 0.8},
        ]
      : [];
  const filling = (tray === 'photo' || tray === 'partial') && f >= trayAt && fillU < 1;
  const done = (tray === 'photo' || tray === 'partial') && fillU >= 1;
  const led = filling ? (Math.floor(f / 3) % 2 ? 1 : 0.35) : done ? 0.55 : 0.12;
  const pulse = 0.5 + 0.5 * Math.sin(f / 6);
  let card: React.ReactNode = null;
  if (shown) {
    const dashed = tray === 'empty' || tray === 'unknown';
    card = (
      <div style={{position: 'absolute', left: 0, top: 0, width: b.w, height: b.h, clipPath: slotClip}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: CARD_W, height: CARD_H, transformOrigin: '0 0', transform: quadMatrix(CARD_W, CARD_H, quad), opacity: prog(f, trayAt - 2, 6)}}>
        {dashed ? (
          <>
            <div style={{position: 'absolute', inset: 0, borderRadius: 14, background: rgba('#0A0F1A', 0.55)}} />
            <div style={{position: 'absolute', inset: 6, borderRadius: 12, border: `7px dashed ${rgba(PAL.ink, tray === 'empty' ? 0.7 : 0.55 + 0.3 * pulse)}`}} />
            {tray === 'unknown' ? (
              <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 210, color: PAL.ink, opacity: 0.75 + 0.25 * pulse, transform: `scale(${1 + 0.06 * pulse})`}}>
                ?
              </div>
            ) : null}
            {sweepP !== null || prog(f, trayAt, 18) < 1 ? (
              <div style={{position: 'absolute', left: 0, right: 0, top: `${fillU * 100}%`, height: 6, background: rgba('#FFFFFF', 0.8 * (1 - fillU)), boxShadow: '0 0 20px rgba(255,255,255,0.8)'}} />
            ) : null}
          </>
        ) : (
          <>
            <div style={{position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden', clipPath: `inset(0 0 ${(1 - fillU) * 100}% 0)`, boxShadow: '0 0 0 2px rgba(255,255,255,0.25)'}}>
              <Crop src="fictional-passport_b" box={CARD_CROP} w={CARD_W} h={CARD_H} />
              {bands.map((bd, i) =>
                f >= bd.at ? (
                  <div key={i} style={{position: 'absolute', left: 0, right: 0, top: `${bd.y0 * 100}%`, height: `${(bd.y1 - bd.y0) * 100}%`}}>
                    <div style={{position: 'absolute', inset: 0, background: `repeating-linear-gradient(90deg, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 14px, rgba(20,24,32,0.35) 14px, rgba(20,24,32,0.35) 22px), repeating-linear-gradient(0deg, #4B515D 0px, #4B515D 6px, #3B414C 6px, #3B414C 9px), #4B515D`, boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.12), inset 0 -3px 0 rgba(0,0,0,0.35)'}} />
                    <div style={{position: 'absolute', inset: 0, background: rgba(PAL.loss, 0.85 * Math.exp(-(f - bd.at) / 4))}} />
                  </div>
                ) : null,
              )}
              <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0) 30%, rgba(5,8,14,0) 84%, rgba(5,8,14,0.3))'}} />
            </div>
            {filling ? <div style={{position: 'absolute', left: -6, right: -6, top: `${fillU * 100}%`, height: 6, marginTop: -3, background: '#FFFFFF', boxShadow: '0 0 24px rgba(255,255,255,0.9)'}} /> : null}
          </>
        )}
      </div>
      </div>
    );
  }
  // copy Bits: plate → tray card along an arc
  const bitsOn = (copyBits ?? (tray === 'photo' || tray === 'partial')) && filling;
  const from = avg(R.scanPlate);
  const to = avg(C);
  const ctrl = {x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 190};
  const bits: React.ReactNode[] = [];
  if (bitsOn) {
    for (let i = 0; i < 9; i++) {
      const u = ((f - trayAt) / 16 + i / 9) % 1;
      const fade = Math.sin(Math.PI * u);
      const x = (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * ctrl.x + u * u * to.x;
      const y = (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * ctrl.y + u * u * to.y;
      bits.push(<rect key={i} x={x - 9} y={y - 9} width={18} height={18} rx={3} fill={PAL.photo} opacity={fade} />);
      bits.push(<rect key={`g${i}`} x={x - 20} y={y - 20} width={40} height={40} rx={10} fill={rgba(PAL.photo, 0.22 * fade)} />);
    }
  }
  const trayRim = tray !== 'none' && shown ? 0.3 + (filling ? 0.25 * pulse : 0) : 0;
  return (
    <Prop {...pp} src={imageSrc}>
      <Regrade src={imageSrc} boxes={R.scanCyan} filter={REGRADE.white} />
      {beamV > 0.002 || trayRim > 0 ? (
        <svg width={b.w} height={b.h} viewBox={`0 0 ${b.w} ${b.h}`} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <defs>
            <linearGradient id={`${uid}-cone`} gradientUnits="userSpaceOnUse" x1={O[0]} y1={O[1]} x2={tgt ? tgt.x : avg(P).x} y2={tgt ? tgt.y : avg(P).y}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.34} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.07} />
            </linearGradient>
            <radialGradient id={`${uid}-lens`}>
              <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
              <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </radialGradient>
          </defs>
          {trayRim > 0 ? <polygon points={R.scanTray.map((q) => q.join(',')).join(' ')} fill="none" stroke={rgba(PAL.ink, trayRim)} strokeWidth={4} strokeLinejoin="round" /> : null}
          {beamV > 0.002 ? (
            <g opacity={beamV}>
              <polygon points={cone} fill={`url(#${uid}-cone)`} />
              {tgt ? (
                <ellipse cx={tgt.x} cy={tgt.y} rx={tgt.rx} ry={tgt.ry} fill={rgba('#FFFFFF', 0.14)} stroke={rgba('#FFFFFF', 0.55)} strokeWidth={3 / Math.max(0.2, k)} />
              ) : (
                <polygon points={P.map((q) => q.join(',')).join(' ')} fill={rgba('#FFFFFF', 0.12)} stroke={rgba('#FFFFFF', 0.45)} strokeWidth={3} strokeLinejoin="round" />
              )}
              <ellipse cx={530} cy={368} rx={150} ry={56} fill={`url(#${uid}-lens)`} />
              {sweepLine}
            </g>
          ) : null}
        </svg>
      ) : null}
      {card}
      {shown ? (
        <svg width={b.w} height={b.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <line x1={C[3][0] - 6} y1={C[3][1]} x2={C[2][0] + 6} y2={C[2][1]} stroke="rgba(3,5,10,0.85)" strokeWidth={9} strokeLinecap="round" />
          <line x1={C[3][0] - 6} y1={C[3][1] - 7} x2={C[2][0] + 6} y2={C[2][1] - 7} stroke="rgba(3,5,10,0.3)" strokeWidth={10} strokeLinecap="round" />
        </svg>
      ) : null}
      {bits.length ? (
        <svg width={b.w} height={b.h} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {bits}
        </svg>
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: R.scanTrayLed[0],
          top: R.scanTrayLed[1],
          width: R.scanTrayLed[2] - R.scanTrayLed[0],
          height: R.scanTrayLed[3] - R.scanTrayLed[1],
          borderRadius: 4,
          background: rgba('#FFFFFF', 0.25 + 0.75 * led),
          boxShadow: led > 0.3 ? `0 0 ${18 * led}px ${rgba('#FFFFFF', 0.8 * led)}` : undefined,
          opacity: tray === 'none' ? 0 : clamp01(prog(f, trayAt - 4, 4)),
        }}
      />
    </Prop>
  );
};
