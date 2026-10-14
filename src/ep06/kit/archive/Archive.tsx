/**
 * Ep06 kit: <Archive>, the Wall and the Drawer (DIRECTION §2.2). One component draws every state of the story so it
 * looks identical everywhere. It is world content: put it in a <Stage env={{kind: 'archive', light}}> and move the
 * camera with archiveCam(). It draws NO must-read text (box numbers and the card's print are decor).
 *
 *   <Stage frame={f} env={{kind: 'archive', light: 'warm'}} cam={[{f: a, ...archiveCam('wide')}, {f: b, ...archiveCam('drawer')}]}>
 *     <Archive frame={f} state="HDD_SAVED" events={[{at: a + 10, op: 'pour'}, {at: a + 50, op: 'threads'}]} />
 *   </Stage>
 *
 * Performance: no SVG/CSS filters; repeated geometry is <use> of shared symbols; glow comes from shared gradients and
 * the Stage's bloom (on cyan only). ≈ 700–1,300 SVG nodes.
 */
import React, {useContext, useId} from 'react';
import {random} from 'remotion';
import {CameraContext} from '../camera';
import {ARCHIVE_LIGHT} from '../envs';
import {EASE, MONO, PAL} from '../look';
import {assetUrl} from '../assets';
import {TAU, clamp01, lerp, mixHex, num, prog, safeId, smooth, springAt, useFontsReady, win, type Num} from '../util';
import {CardDefs, CardFace, cardPlugs, type CardTimes} from './Card';
import {
  BOX,
  CARD,
  COLS,
  GEOM,
  HEADER,
  N_BOXES,
  PHOTO,
  PITCH,
  REMAP,
  ROWS,
  RUNS,
  SPOT_COLS,
  SSD_MAP,
  boxC,
  boxXY,
  cardH,
  cardK,
  colOf,
  pad3,
  rowOf,
  spotXY,
  wallRenderRect,
} from './geom';
import {NEVER, resolveArchive, type Content, type Lab, type Resolved} from './state';
import {applyM, cardPose, isIdentity, mCss, viewAt, type ArchiveViewProps} from './view';

export type ArchiveProps = ArchiveViewProps & {
  /** the wall flips from the other mode into `mode`, column by column (P10 "the storage wall works very differently") */
  flip?: {at: number; dur?: number};
  /** the card's fields light as spoken: frame each lights */
  cardFields?: CardTimes['fields'];
  /** registered render overlays (opacity, number or track): cluster-wall_b on cols 4–9 × rows 1–5, mft-record_b on the card */
  renders?: {wall?: Num; card?: Num};
  /** visibility multipliers (number or track, default 1): drawer, map, card, threads, ghost wall, actor, platter */
  show?: {drawer?: Num; map?: Num; card?: Num; threads?: Num; ghost?: Num; actor?: Num; platter?: Num};
};

/* ---------------------------------------------------------------- shapes (box-local px, 64×64) */
const rr = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const BIT_XY: Array<[number, number]> = [
  [20, 11],
  [34, 11],
  [20, 25],
  [34, 25],
];
const BITS_D = BIT_XY.map(([x, y]) => rr(x, y, 10, 10, 2)).join('');
const CORES_D = BIT_XY.map(([x, y]) => rr(x + 3, y + 3, 4, 4, 1)).join('');
const PLATE_D = 'M2 40H21Q22 40 22.6 41L25.4 45.6Q26 46.6 27 46.6H37Q38 46.6 38.6 45.6L41.4 41Q42 40 43 40H62V62.6H2Z';
const PLATE_TOP = 'M2.6 40.7H21.2L24.6 46.3Q25.6 47.3 27 47.3H37Q38.4 47.3 39.4 46.3L42.8 40.7H61.4';
const GLYPHS = '#%&@$?*+=<>/{}[]~^ABDEFGHKMNPRSTVXYZ0123456789';
const BIT_CENTER = {x: 32, y: 23};

type Ctx = {f: number; p: string; R: Resolved; zoom: number};

/* ---------------------------------------------------------------- defs */
const Defs: React.FC<{p: string; light: (typeof ARCHIVE_LIGHT)[keyof typeof ARCHIVE_LIGHT]; fog: string}> = ({p, light, fog}) => (
  <defs>
    <CardDefs p={p} />
    <linearGradient id={`${p}-rail`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.steel} />
      <stop offset="0.05" stopColor={PAL.steelLo} />
      <stop offset="0.07" stopColor={PAL.steel} />
      <stop offset="0.92" stopColor={PAL.steel} />
      <stop offset="0.94" stopColor={PAL.steelHi} />
      <stop offset="1" stopColor={PAL.steel} />
    </linearGradient>
    <linearGradient id={`${p}-bin`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.binDeep} />
      <stop offset="0.55" stopColor={PAL.binBack} />
      <stop offset="1" stopColor="#273345" />
    </linearGradient>
    <linearGradient id={`${p}-plate`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.plateHi} />
      <stop offset="0.4" stopColor={PAL.plate} />
      <stop offset="1" stopColor={PAL.plateLo} />
    </linearGradient>
    <linearGradient id={`${p}-cell`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.graphiteHi} />
      <stop offset="0.3" stopColor={PAL.graphite} />
      <stop offset="1" stopColor={PAL.graphiteLo} />
    </linearGradient>
    <linearGradient id={`${p}-ltab`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#C4C8CF" />
      <stop offset="0.5" stopColor="#9A9FA8" />
      <stop offset="1" stopColor="#6B7079" />
    </linearGradient>
    <radialGradient id={`${p}-wash`} cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stopColor={PAL.photo} stopOpacity={0.55} />
      <stop offset="0.55" stopColor={PAL.photo} stopOpacity={0.16} />
      <stop offset="1" stopColor={PAL.photo} stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`${p}-washW`} cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.5} />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`${p}-ember`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={PAL.driveHot} stopOpacity={0.9} />
      <stop offset="0.4" stopColor={PAL.drive} stopOpacity={0.45} />
      <stop offset="1" stopColor={PAL.drive} stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`${p}-amberGlow`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={PAL.drive} stopOpacity={0.55} />
      <stop offset="0.5" stopColor={PAL.drive} stopOpacity={0.14} />
      <stop offset="1" stopColor={PAL.drive} stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`${p}-cyanGlow`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor={PAL.photo} stopOpacity={0.6} />
      <stop offset="0.5" stopColor={PAL.photo} stopOpacity={0.15} />
      <stop offset="1" stopColor={PAL.photo} stopOpacity={0} />
    </radialGradient>
    <radialGradient id={`${p}-ashadow`} cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#000" stopOpacity={0.7} />
      <stop offset="0.6" stopColor="#000" stopOpacity={0.25} />
      <stop offset="1" stopColor="#000" stopOpacity={0} />
    </radialGradient>
    {/* haze on the far wall: each band fades from part-fogged at the core edge to full fog */}
    <linearGradient id={`${p}-hzT`} gradientUnits="userSpaceOnUse" x1={0} y1={GEOM.wall.y - PITCH * 5} x2={0} y2={GEOM.wall.y - 4}>
      <stop offset="0" stopColor={fog} stopOpacity={1} />
      <stop offset="0.45" stopColor={fog} stopOpacity={0.96} />
      <stop offset="0.8" stopColor={fog} stopOpacity={0.7} />
      <stop offset="1" stopColor={fog} stopOpacity={0.38} />
    </linearGradient>
    <linearGradient id={`${p}-hzB`} gradientUnits="userSpaceOnUse" x1={0} y1={GEOM.wall.y + ROWS * PITCH - 4} x2={0} y2={GEOM.wall.y + ROWS * PITCH + PITCH * 4}>
      <stop offset="0" stopColor={fog} stopOpacity={0.4} />
      <stop offset="0.4" stopColor={fog} stopOpacity={0.82} />
      <stop offset="0.75" stopColor={fog} stopOpacity={1} />
    </linearGradient>
    <linearGradient id={`${p}-hzR`} gradientUnits="userSpaceOnUse" x1={GEOM.wall.x + COLS * PITCH - 4} y1={0} x2={GEOM.wall.x + COLS * PITCH + PITCH * 8} y2={0}>
      <stop offset="0" stopColor={fog} stopOpacity={0.4} />
      <stop offset="0.3" stopColor={fog} stopOpacity={0.85} />
      <stop offset="0.6" stopColor={fog} stopOpacity={1} />
    </linearGradient>
    <linearGradient id={`${p}-hzL`} gradientUnits="userSpaceOnUse" x1={GEOM.wall.x - PITCH * 7} y1={0} x2={GEOM.wall.x - 4} y2={0}>
      <stop offset="0" stopColor={fog} stopOpacity={1} />
      <stop offset="0.5" stopColor={fog} stopOpacity={0.86} />
      <stop offset="1" stopColor={fog} stopOpacity={0.45} />
    </linearGradient>
    <radialGradient id={`${p}-key`} gradientUnits="userSpaceOnUse" cx={GEOM.wall.x + 180} cy={GEOM.wall.y - 120} r={1150}>
      <stop offset="0" stopColor={light.key} stopOpacity={0.16} />
      <stop offset="0.5" stopColor={light.key} stopOpacity={0.05} />
      <stop offset="1" stopColor={light.key} stopOpacity={0} />
    </radialGradient>
    <linearGradient id={`${p}-cone`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#EAF0FA" stopOpacity={0.2} />
      <stop offset="1" stopColor="#EAF0FA" stopOpacity={0.03} />
    </linearGradient>
    <linearGradient id={`${p}-toplight`} x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stopColor={light.key} stopOpacity={0.12} />
      <stop offset="0.35" stopColor={light.key} stopOpacity={0.02} />
      <stop offset="0.7" stopColor="#000" stopOpacity={0.1} />
      <stop offset="1" stopColor="#000" stopOpacity={0.38} />
    </linearGradient>
    <linearGradient id={`${p}-spec`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
      <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.16} />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
    </linearGradient>
    <linearGradient id={`${p}-band`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
      <stop offset="0.42" stopColor="#FFFFFF" stopOpacity={0.22} />
      <stop offset="0.5" stopColor="#FFFFFF" stopOpacity={0.6} />
      <stop offset="0.58" stopColor="#FFFFFF" stopOpacity={0.22} />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
    </linearGradient>
    <linearGradient id={`${p}-amberBand`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor={PAL.drive} stopOpacity={0} />
      <stop offset="0.7" stopColor={PAL.drive} stopOpacity={0.35} />
      <stop offset="0.92" stopColor={PAL.driveHot} stopOpacity={0.95} />
      <stop offset="1" stopColor={PAL.driveHot} stopOpacity={0} />
    </linearGradient>
    <linearGradient id={`${p}-drawer`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.drawerHi} />
      <stop offset="0.12" stopColor={PAL.drawer} />
      <stop offset="1" stopColor={PAL.drawerLo} />
    </linearGradient>
    <linearGradient id={`${p}-chip`} x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0" stopColor="#E9EBEE" />
      <stop offset="0.45" stopColor="#B8BDC4" />
      <stop offset="1" stopColor="#7D838C" />
    </linearGradient>
    {/* the hdd bin (cluster-wall_b): navy steel rails, dark interior with lit inner walls, the notched silver plate */}
    <g id={`${p}-box-hdd`}>
      <rect x={-4} y={-4} width={72} height={72} fill={`url(#${p}-rail)`} />
      <rect x={0} y={0} width={64} height={64} rx={2} fill={PAL.steelLo} />
      <rect x={3} y={3} width={58} height={58} fill={`url(#${p}-bin)`} />
      <path d="M3 3L10 10V50L3 58Z" fill={PAL.binSide} />
      <path d="M61 3L54 10V50L61 58Z" fill="#34445B" />
      <path d="M3 3H61L54 10H10Z" fill="#090D14" />
      <rect x={3} y={36} width={58} height={4} fill="#000" opacity={0.4} />
      <path d={PLATE_D} fill={`url(#${p}-plate)`} />
      <path d={PLATE_TOP} stroke="#FFFFFF" strokeOpacity={0.8} strokeWidth={1.1} fill="none" />
      <path d="M2 62.4H62" stroke="#3E3A36" strokeWidth={1.2} />
      <path d="M0.5 0.6H63.5" stroke={PAL.steelHi} strokeWidth={1} opacity={0.7} />
    </g>
    {/* the ssd cell (graphite page in an erase-group tray), with its silver-grey label tab */}
    <g id={`${p}-page`}>
      <rect x={-4} y={-4} width={72} height={72} fill="#0D0E12" />
      <rect x={1} y={1} width={62} height={62} rx={5} fill={`url(#${p}-cell)`} />
      <rect x={2} y={1.6} width={60} height={2.4} rx={1.2} fill="#9A9EA6" opacity={0.5} />
      <rect x={5} y={6} width={54} height={35} rx={3} fill="#111317" />
      <rect x={5} y={6} width={54} height={3} rx={1.5} fill="#000" opacity={0.55} />
      <path d="M10 61.7h3M17 61.7h3M24 61.7h3M37 61.7h3M44 61.7h3M51 61.7h3" stroke={PAL.gold} strokeWidth={1.4} />
    </g>
    <g id={`${p}-box-ssd`}>
      <use href={`#${p}-page`} />
      <rect x={7} y={45} width={50} height={14} rx={2.5} fill={`url(#${p}-ltab)`} />
      <rect x={8} y={45.6} width={48} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.55} />
    </g>
    {/* front-layer labels (split view): the label tab on a thin glass frame */}
    <g id={`${p}-label`}>
      <rect x={0.5} y={0.5} width={63} height={63} rx={5} fill="#C8D2E4" fillOpacity={0.05} stroke={PAL.annotation} strokeOpacity={0.4} strokeWidth={1.4} />
      <rect x={7} y={45} width={50} height={14} rx={2.5} fill={`url(#${p}-ltab)`} />
      <rect x={8} y={45.6} width={48} height={1.6} rx={0.8} fill="#FFFFFF" opacity={0.55} />
    </g>
    <pattern id={`${p}-ghost-hdd`} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse" x={GEOM.wall.x} y={GEOM.wall.y}>
      <use href={`#${p}-box-hdd`} />
    </pattern>
    <pattern id={`${p}-ghost-ssd`} width={PITCH} height={PITCH} patternUnits="userSpaceOnUse" x={GEOM.wall.x} y={GEOM.wall.y}>
      <use href={`#${p}-box-ssd`} />
    </pattern>
    {/* a few other files' Bits scattered through the far wall */}
    <pattern id={`${p}-ghostBits`} width={PITCH * 5} height={PITCH * 3} patternUnits="userSpaceOnUse" x={GEOM.wall.x} y={GEOM.wall.y}>
      {[
        [0, 0],
        [3, 0],
        [1, 1],
        [4, 2],
        [2, 2],
      ].map(([c, r], i) => (
        <path key={i} d={BITS_D} transform={`translate(${c * PITCH} ${r * PITCH})`} fill={PAL.otherBit} opacity={0.75} />
      ))}
    </pattern>
  </defs>
);

/* ---------------------------------------------------------------- content in a box */
const breath = (f: number, ph = 0) => 0.5 + 0.5 * Math.sin(TAU * (f / 90) + ph);
const shown = (l: Lab, f: number): Content => {
  const eff = l.cAt + (l.how === 'overwrite' || l.how === 'remap' ? 6 : 0);
  return f >= eff ? l.c : l.prev;
};

/** Bits (or the erased look) of one content in a box whose top-left is (x, y) */
const BoxContent: React.FC<{c: Content; x: number; y: number; ctx: Ctx; id: number; op?: number; scrambled?: boolean; erasedAt?: number; mode: 'hdd' | 'ssd'}> = ({c, x, y, ctx, id, op = 1, scrambled, erasedAt = -NEVER, mode}) => {
  const {f, p} = ctx;
  if (c === 'empty' || op <= 0.001) return null;
  if (c === 'erased') {
    const em = Math.exp(-Math.max(0, f - erasedAt) / 34);
    return (
      <g transform={`translate(${x} ${y})`} opacity={op}>
        <rect x={mode === 'ssd' ? 5 : 4} y={mode === 'ssd' ? 6 : 4} width={mode === 'ssd' ? 54 : 56} height={mode === 'ssd' ? 35 : 34} rx={3} fill="#05070A" opacity={0.95} />
        <path d={mode === 'ssd' ? 'M6 7.5H58' : 'M5 5.5H59'} stroke={PAL.drive} strokeOpacity={0.35 * em + 0.08} strokeWidth={1.2} />
        {em > 0.02 ? <ellipse cx={32} cy={30} rx={22} ry={9} fill={`url(#${p}-ember)`} opacity={0.9 * em + 0.08} /> : <ellipse cx={32} cy={31} rx={14} ry={5} fill={`url(#${p}-ember)`} opacity={0.1} />}
      </g>
    );
  }
  if (scrambled) return null; // glyphs are drawn per row
  if (c === 'photo') {
    const b = breath(f, (id % 7) * 0.4);
    return (
      <g transform={`translate(${x} ${y})`} opacity={op}>
        <rect x={3} y={3} width={58} height={40} rx={3} fill={`url(#${p}-wash)`} opacity={0.55 + 0.35 * b} />
        <path d={BITS_D} fill={PAL.photo} opacity={0.86 + 0.14 * b} />
        <path d={CORES_D} fill="#E9FDFF" opacity={0.75 + 0.25 * b} />
      </g>
    );
  }
  return (
    <g transform={`translate(${x} ${y})`} opacity={op}>
      <path d={BITS_D} fill={c === 'other' ? PAL.otherBit : PAL.oldBit} />
      <path d={CORES_D} fill={c === 'other' ? '#FFFFFF' : '#A7AFBB'} opacity={c === 'other' ? 0.85 : 0.6} />
    </g>
  );
};

/** glyph rows for scrambled boxes: ONE <text> per box row (positions per glyph); never cyan */
const GlyphRows: React.FC<{items: Array<{x: number; y: number}>; f: number; op?: number}> = ({items, f, op = 1}) => {
  if (!items.length) return null;
  const rows = new Map<number, Array<{x: number; y: number}>>();
  for (const it of items) {
    const k = Math.round(it.y);
    if (!rows.has(k)) rows.set(k, []);
    rows.get(k)?.push(it);
  }
  const seedF = Math.floor(f / 3);
  return (
    <g fontFamily={MONO} fontWeight={500} fontSize={13} fill={PAL.muted} textAnchor="middle" opacity={op}>
      {[...rows.entries()].map(([k, its]) => {
        const xs: number[] = [];
        const ys: number[] = [];
        let s = '';
        its.forEach((it, j) => {
          BIT_XY.forEach(([bx, by], q) => {
            xs.push(+(it.x + bx + 5).toFixed(1));
            ys.push(+(it.y + by + 9.5).toFixed(1));
            s += GLYPHS[Math.floor(random(`scr-${k}-${j}-${q}-${seedF}`) * GLYPHS.length)];
          });
        });
        return (
          <text key={k} x={xs.join(' ')} y={ys.join(' ')}>
            {s}
          </text>
        );
      })}
    </g>
  );
};

const coreY0B = () => GEOM.wall.y + GEOM.wall.h + 6;

/* ---------------------------------------------------------------- the Archive */
export const Archive: React.FC<ArchiveProps> = (props) => {
  useFontsReady();
  const p = `a${safeId(useId())}`;
  const cam = useContext(CameraContext);
  const f = props.frame;
  const R = resolveArchive(props, f);
  const {v, back, front} = viewAt(R, props, f);
  const L = ARCHIVE_LIGHT[R.light];
  const fog = mixHex(L.ground, L.haze, 0.45);
  const cosT = Math.abs(Math.cos((v.theta * Math.PI) / 180));
  const zoom = cam.zoom;
  const pxPerBox = BOX * zoom * cosT;
  const ctx: Ctx = {f, p, R, zoom};
  const sh = (k: keyof NonNullable<ArchiveProps['show']>) => clamp01(num(props.show?.[k], f, 1));
  const ssd = R.mode === 'ssd';
  const s = v.s;
  const s2 = smooth(clamp01((s - 0.25) / 0.75));
  const splitOn = ssd && s > 0.001;
  const backT = isIdentity(back) ? undefined : mCss(back);
  const frontT = mCss(front);
  // the mode flip (hdd ↔ ssd), column by column
  const flipAt = props.flip?.at ?? -NEVER;
  const flipDur = props.flip?.dur ?? 30;
  const flipU = (col: number) => (props.flip ? prog(f, flipAt + (col * Math.max(0, flipDur - 10)) / (COLS - 1), 10, EASE.inOut) : 1);
  const tileOf = (col: number): 'hdd' | 'ssd' => (flipU(col) < 0.5 ? (ssd ? 'hdd' : 'ssd') : R.mode);
  const flipSx = (col: number) => (props.flip ? Math.max(0.02, Math.abs(Math.cos(Math.PI * flipU(col)))) : 1);

  /* ---- content positions (single: the label's box; split: sliding to its physical spot) */
  const labTL = (id: number) => boxXY(id);
  const spotTL = (sidx: number) => spotXY(sidx);
  const posOf = (id: number, sidx: number) => {
    const a = labTL(id);
    if (!splitOn) return a;
    const b = spotTL(sidx);
    return {x: lerp(a.x, b.x, s2), y: lerp(a.y, b.y, s2)};
  };
  const curSpot = (l: Lab) => (ssd ? (l.remapAt <= f ? REMAP[l.id] : SSD_MAP[l.id]) : -1);

  /* ---- sanitize timing for any cell (spots too) */
  const sanAt = (x: number, y: number) => (R.sanitize ? R.sanitize.at + Math.round((Math.hypot(x + 32 - GEOM.actor.x, y + 32 - GEOM.actor.y) / 1500) * R.sanitize.dur) : NEVER);

  /* ---------------- cells (the wall itself) */
  const cells: React.ReactNode[] = [];
  const nCellCols = splitOn ? SPOT_COLS : COLS;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < nCellCols; c++) {
      const id = r * COLS + c + 1;
      const x = GEOM.wall.x + c * PITCH;
      const y = GEOM.wall.y + r * PITCH;
      const spare = c >= COLS;
      const build = spare ? -NEVER : R.labs[id].build;
      if (f < build) continue;
      const bu = build > -NEVER / 2 ? prog(f, build, 10, EASE.out) : 1;
      const bounce = build > -NEVER / 2 && f >= build + 7 ? Math.exp(-(f - build - 7) / 3) * Math.sin((f - build - 7) * 1.4) * 2 : 0;
      const dy = -46 * (1 - bu) + bounce;
      const op = spare ? s : prog(f, build, 4);
      const tile = splitOn ? 'page' : tileOf(c) === 'ssd' ? 'box-ssd' : 'box-hdd';
      const sx = spare ? 1 : flipSx(c);
      const tr = sx !== 1 ? `translate(${x + 32} ${y + dy + 32}) scale(${sx} 1) translate(-32 -32)` : `translate(${x} ${y + dy})`;
      cells.push(<use key={`c${r}-${c}`} href={`#${p}-${tile}`} transform={tr} opacity={op < 1 ? op : undefined} />);
      if (splitOn && R.sanitize) {
        // split view: the sanitize pulse cleans every physical cell, spare columns included
        const t = sanAt(x, y);
        if (f >= t) cells.push(<BoxContent key={`sp${r}-${c}`} c="erased" x={x} y={y} ctx={ctx} id={0} erasedAt={t} mode="ssd" op={spare ? s : 1} />);
      }
    }

  /* ---------------- erase-group trays (ssd) and the spare compartment */
  const trays: React.ReactNode[] = [];
  if (ssd && (!props.flip || f >= flipAt + flipDur)) {
    let d = '';
    for (let r = 0; r < ROWS; r++) for (let g = 0; g < 4; g++) d += rr(GEOM.wall.x + g * 4 * PITCH - 5, GEOM.wall.y + r * PITCH - 5, 4 * PITCH - 8 + 10, BOX + 10, 7);
    trays.push(<path key="tr" d={d} fill="none" stroke="#050608" strokeWidth={4} />);
    trays.push(<path key="trh" d={d} fill="none" stroke="#6A6E77" strokeOpacity={0.55} strokeWidth={1.2} transform="translate(0 0.8)" />);
    if (splitOn) {
      const x0 = GEOM.spare.x - 9;
      trays.push(<path key="sp" d={rr(x0, GEOM.wall.y - 9, 2 * PITCH - 8 + 18, GEOM.wall.h + 18, 10)} fill="none" stroke="#8C7DA8" strokeOpacity={0.55 * s} strokeWidth={3} strokeDasharray="10 6" />);
    }
  }

  /* ---------------- content */
  const contents: React.ReactNode[] = [];
  const glyphs: Array<{x: number; y: number}> = [];
  const overlays: React.ReactNode[] = [];
  const effects: React.ReactNode[] = [];
  for (let id = 1; id <= N_BOXES; id++) {
    const l = R.labs[id];
    if (f < l.build) continue;
    const col = colOf(id);
    const sidx = curSpot(l);
    const pos = posOf(id, sidx);
    let c = shown(l, f);
    // hop: bits leave the source box
    if (l.fx.some((e) => e.k === 'hopOut' && f >= e.at) && c === 'other') c = 'empty';
    const scr = l.scr <= f && l.scrOff > f && (c === 'photo' || c === 'other' || c === 'old');
    const flipOp = props.flip ? (flipU(col) > 0.35 && flipU(col) < 0.65 ? 0 : 1) : 1;
    const bop = (l.build > -NEVER / 2 ? prog(f, l.build + 6, 6) : 1) * flipOp;
    // pour: the photo's Bits fall into the box, one by one, and settle
    if (l.how === 'pour' && f < l.cAt + 14 && f >= l.cAt - 12) {
      const pieces = BIT_XY.map(([bx, by], q) => {
        const t0 = l.cAt - 10 + q * 2;
        const u = prog(f, t0, 9, EASE.inCubic);
        if (f < t0) return null;
        const set = f >= t0 + 9 ? Math.exp(-(f - t0 - 9) / 2.5) * Math.sin((f - t0 - 9) * 1.6) * 3 : 0;
        const yy = lerp(-120, 0, u) - set;
        return <rect key={q} x={pos.x + bx} y={pos.y + by + yy} width={10} height={10} rx={2} fill={PAL.photo} />;
      });
      const streamOp = win(f, l.cAt - 12, l.cAt + 2, 3, 5);
      effects.push(
        <g key={`pour${id}`}>
          <rect x={pos.x + 26} y={pos.y - 140} width={12} height={150} rx={6} fill={`url(#${p}-cyanGlow)`} opacity={0.7 * streamOp} />
          {pieces}
        </g>,
      );
      if (f < l.cAt + 6) c = 'empty';
    }
    if (splitOn && R.sanitize && c === 'erased' && l.how === 'sanitize') c = 'empty'; // drawn per cell
    if (c !== 'empty') {
      if (scr) glyphs.push(pos);
      else contents.push(<BoxContent key={`b${id}`} c={c} x={pos.x} y={pos.y} ctx={ctx} id={id} op={bop} erasedAt={l.cAt} mode={tileOf(col)} />);
    }
    // the header glyph: a bright cyan notch across the top of 021
    if (id === HEADER && c === 'photo' && !scr) {
      const scanLit = R.scans.reduce((m, sc) => Math.max(m, win(f, sc.at + Math.round(sc.dur * 0.32), sc.at + sc.dur + 40, 4, 10)), 0);
      overlays.push(
        <g key="header" opacity={bop}>
          <rect x={pos.x + 12} y={pos.y + 2.5} width={40} height={5} rx={2.5} fill={PAL.photo} />
          <rect x={pos.x + 16} y={pos.y + 3.6} width={32} height={2} rx={1} fill="#EFFFFF" />
          {scanLit > 0 ? <ellipse cx={pos.x + 32} cy={pos.y + 5} rx={46} ry={16} fill={`url(#${p}-cyanGlow)`} opacity={scanLit} /> : null}
        </g>,
      );
    }
    // stale: what the old spot still holds after a remap (split view only: nobody points to it)
    if (splitOn && l.remapAt <= f && l.stale !== 'empty') {
      const so = SSD_MAP[id];
      const sp = posOf(id, so);
      const san = l.staleOff <= f;
      const stC: Content = san ? 'erased' : l.stale;
      const stScr = l.scr <= f && l.scrOff > f && stC !== 'erased';
      if (stScr) glyphs.push(sp);
      else if (!(san && R.sanitize)) contents.push(<BoxContent key={`st${id}`} c={stC} x={sp.x} y={sp.y} ctx={ctx} id={id} erasedAt={l.staleOff} mode="ssd" />);
    }
    // overwrite / remap: the new file's grey Bits slam in, a coral ring flashes
    if ((l.how === 'overwrite' || l.how === 'remap') && f >= l.cAt && f < l.cAt + 16) {
      const t = f - l.cAt;
      if (t < 6) {
        const u = EASE.inCubic(t / 6);
        effects.push(<path key={`ow${id}`} d={BITS_D} transform={`translate(${pos.x} ${pos.y - 110 * (1 - u)})`} fill={PAL.oldBit} />);
      } else {
        const u = (t - 6) / 10;
        effects.push(<rect key={`owr${id}`} x={pos.x - 6 - 12 * u} y={pos.y - 6 - 12 * u} width={76 + 24 * u} height={76 + 24 * u} rx={8 + 6 * u} fill="none" stroke={PAL.loss} strokeWidth={6 * (1 - u) + 1} opacity={1 - u} />);
      }
    }
    // available: dashed outline + hollow corner dot (Bits stay lit)
    if (l.avail <= f && l.availOff > f) {
      const u = prog(f, l.avail, 8, EASE.out);
      overlays.push(
        <g key={`av${id}`}>
          <rect x={pos.x - 3} y={pos.y - 3} width={70} height={70} rx={6} fill="none" stroke={PAL.ink} strokeOpacity={0.9} strokeWidth={2.2} strokeDasharray="7 5" pathLength={276} strokeDashoffset={(1 - u) * 276} />
          <circle cx={pos.x - 3} cy={pos.y - 3} r={5.5 * u} fill="#0A0F18" stroke={PAL.ink} strokeWidth={2.2} />
        </g>,
      );
    }
    // disposable: an amber dashed corner tag that drops in and swings
    if (l.tag <= f && f < l.tagOff + 8) {
      const t = f - l.tag;
      const drop = springAt(f, l.tag, {damping: 9, stiffness: 160, mass: 0.6});
      const sw = 14 * Math.exp(-t / 14) * Math.sin(t * 0.5) + 3 * Math.sin(f / 40);
      const fade = l.tagOff < NEVER ? 1 - prog(f, l.tagOff, 8) : 1;
      overlays.push(
        <g key={`tag${id}`} transform={`translate(${pos.x + 58} ${pos.y - 2 - 30 * (1 - drop)}) rotate(${12 + sw})`} opacity={clamp01(drop * 2) * fade}>
          <path d="M0 0L-7 7" stroke={PAL.drive} strokeWidth={1.6} />
          <path d="M0 -8L9 -14H30V6H9Z" transform="rotate(30)" fill={PAL.drive} fillOpacity={0.25} stroke={PAL.drive} strokeWidth={2} strokeDasharray="4 2.5" strokeLinejoin="round" />
          <circle cx={4} cy={-4} r={2} fill="none" stroke={PAL.driveHot} strokeWidth={1.4} transform="rotate(30)" />
        </g>,
      );
    }
    // fx: refuse (a new Bit bounces off, coral), hops, scan flashes
    for (const e of l.fx) {
      const t = f - e.at;
      if (t < 0 || t > e.dur + 2) continue;
      if (e.k === 'refuse') {
        const hit = Math.round(e.dur * 0.55);
        const yIn = t < hit ? lerp(-150, 2, EASE.inCubic(t / hit)) : lerp(2, -90, EASE.out((t - hit) / (e.dur - hit)));
        const op = t < hit ? 1 : 1 - (t - hit) / (e.dur - hit);
        effects.push(
          <g key={`rf${id}-${e.at}`}>
            <rect x={pos.x + 25} y={pos.y + yIn} width={14} height={14} rx={3} fill={PAL.otherBit} opacity={op} />
            {t >= hit ? <rect x={pos.x - 4 - 2 * (t - hit)} y={pos.y - 4 - 2 * (t - hit)} width={72 + 4 * (t - hit)} height={72 + 4 * (t - hit)} rx={8} fill="none" stroke={PAL.loss} strokeWidth={5} opacity={op} /> : null}
          </g>,
        );
      } else if (e.k === 'hopIn' && e.from) {
        const a = posOf(e.from, curSpot(R.labs[e.from]));
        const u = EASE.inOut(clamp01(t / e.dur));
        const hx = lerp(a.x, pos.x, u);
        const hy = lerp(a.y, pos.y, u) - Math.sin(Math.PI * u) * 70;
        if (t < e.dur) effects.push(<path key={`hop${id}`} d={BITS_D} transform={`translate(${hx} ${hy})`} fill={PAL.otherBit} />);
      }
    }
  }
  // scrambled glyph rows (single + split), never cyan
  const glyphNode = <GlyphRows items={glyphs} f={f} />;

  /* ---------------- box numbers (decor ≤ 24 px on screen; hidden when a box is < 40 px) */
  const numFs = Math.min(11.5, 21 / Math.max(0.01, zoom));
  const numbers = (layerTL: (id: number) => {x: number; y: number}, base: number) => {
    if (pxPerBox < 40) return null;
    const rows: React.ReactNode[] = [];
    for (let r = 0; r < ROWS; r++) {
      const xs: number[] = [];
      const ys: number[] = [];
      let str = '';
      for (let c = 0; c < COLS; c++) {
        const id = r * COLS + c + 1;
        if (f < R.labs[id].build + 8) continue;
        const q = layerTL(id);
        const t = pad3(id);
        for (let k = 0; k < 3; k++) {
          xs.push(+(q.x + 32 + (k - 1) * numFs * 0.62).toFixed(2));
          ys.push(+(q.y + base).toFixed(2));
          str += t[k];
        }
      }
      if (str) rows.push(<text key={r} x={xs.join(' ')} y={ys.join(' ')}>{str}</text>);
    }
    return (
      <g fontFamily={MONO} fontWeight={600} fontSize={numFs} fill={PAL.plateInk} fillOpacity={0.78} textAnchor="middle">
        {rows}
      </g>
    );
  };

  /* ---------------- sweeps (amber edge) */
  const sweepNodes = R.sweeps.map((sw, i) => {
    const t = f - sw.at;
    if (t < -2 || t > sw.dur + 4) return null;
    const a = posOf(sw.ids[0], curSpot(R.labs[sw.ids[0]]));
    const u = clamp01(t / sw.dur);
    const span = 4 * PITCH;
    const bx = a.x - 20 + u * (span + 20);
    return (
      <g key={`sw${i}`} opacity={win(f, sw.at - 2, sw.at + sw.dur + 4, 2, 4) * (sw.skipped ? 0.45 : 1)}>
        <rect x={bx - 70} y={a.y - 8} width={80} height={BOX + 16} fill={`url(#${p}-amberBand)`} />
        {sw.skipped ? <rect x={a.x - 6} y={a.y - 6} width={span + 4} height={BOX + 12} rx={8} fill="none" stroke={PAL.drive} strokeOpacity={0.5} strokeDasharray="5 6" strokeWidth={2} /> : null}
      </g>
    );
  });

  /* ---------------- scans (the scanner's white sweep) */
  const scanNodes = R.scans.map((sc, i) => {
    const t = f - sc.at;
    if (t < 0 || t > sc.dur + 6) return null;
    const u = clamp01(t / sc.dur);
    const x0 = GEOM.wall.x - 140;
    const x1 = GEOM.wall.x + GEOM.wall.w + 140;
    const bx = lerp(x0, x1, EASE.inOut(u));
    const flashes = sc.ids.map((id) => {
      const q = posOf(id, curSpot(R.labs[id]));
      const d = Math.abs(q.x + 32 - bx);
      if (d > 70 || f < R.labs[id].build) return null;
      return <rect key={id} x={q.x + 3} y={q.y + 3} width={58} height={40} rx={3} fill={`url(#${p}-washW)`} opacity={(1 - d / 70) * 0.9} />;
    });
    return (
      <g key={`sc${i}`} opacity={win(f, sc.at, sc.at + sc.dur + 6, 4, 6)}>
        <rect x={bx - 160} y={GEOM.wall.y - 60} width={320} height={GEOM.wall.h + 120} fill={`url(#${p}-band)`} opacity={0.55} />
        <rect x={bx - 4} y={GEOM.wall.y - 70} width={8} height={GEOM.wall.h + 140} rx={4} fill="#FFFFFF" opacity={0.85} />
        {flashes}
      </g>
    );
  });

  /* ---------------- threads: card → the photo's boxes (cyan directions) */
  const cp = cardPose(props, f, {x: cam.x ?? 960, y: cam.y ?? 540});
  const plugs = cardPlugs(cp.x, cp.y, cp.w, cp.rot);
  const labelM = splitOn ? front : back;
  const labPt = (id: number) => {
    const q = boxXY(id);
    return applyM(labelM, q.x + BIT_CENTER.x, q.y + BIT_CENTER.y);
  };
  const thrStart = R.card.threads;
  const thrDraw = thrStart <= -NEVER / 2 ? 1 : prog(f, thrStart, R.card.threadsDur, EASE.out);
  const dashed = f >= R.card.strike;
  const snapU = prog(f, R.card.reuse, 12, EASE.out);
  const thrVis = sh('threads') * (thrStart >= NEVER / 2 ? 0 : 1) * (1 - snapU);
  const threadNodes: React.ReactNode[] = [];
  if (thrDraw > 0 && (thrVis > 0 || (snapU > 0 && snapU < 1))) {
    RUNS.forEach((run, ri) => {
      const P0 = plugs[ri];
      const tgts = run.map(labPt).filter((_, k) => f >= R.labs[run[k]].build);
      if (!tgts.length) return;
      const first = labPt(run[0]);
      const F = {x: first.x - 46, y: first.y - 38};
      const dx = F.x - P0.x;
      const dy = F.y - P0.y;
      // two cubic segments through a waypoint W: on the drawer W sits mid-way (a direct, taut run to the right); on a
      // lifted card W drops past the card's right/bottom corner so the threads never cross the card's face
      const lf = smooth(clamp01((lift - 0.3) / 0.5));
      const ch = cardH(cp.w);
      const W0 = {x: P0.x + dx * 0.5, y: P0.y + dy * 0.5};
      const W1 = {x: cp.x + cp.w / 2 + 40 + ri * 26, y: cp.y + ch / 2 + 34 + ri * 20};
      const Wp = {x: lerp(W0.x, W1.x, lf), y: lerp(W0.y, W1.y, lf)};
      const h1 = {x: lerp(P0.x + Math.max(50, dx * 0.22), P0.x + 70, lf), y: P0.y};
      const h2 = {x: lerp(Wp.x - dx * 0.18, Wp.x, lf), y: lerp(Wp.y - dy * 0.1, Wp.y - 80, lf)};
      const h3 = {x: lerp(Wp.x + dx * 0.18, Wp.x, lf), y: lerp(Wp.y + dy * 0.1, Wp.y + 80, lf)};
      const h4 = {x: lerp(F.x - Math.max(40, dx * 0.2), F.x + 60, lf), y: lerp(F.y, F.y - 90, lf)};
      const n1 = (q: {x: number; y: number}) => `${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
      const main = `M${n1(P0)}C${n1(h1)} ${n1(h2)} ${n1(Wp)}C${n1(h3)} ${n1(h4)} ${n1(F)}`;
      const fans = tgts.map((t) => `M${F.x.toFixed(1)} ${F.y.toFixed(1)}Q${t.x.toFixed(1)} ${F.y.toFixed(1)} ${t.x.toFixed(1)} ${t.y.toFixed(1)}`);
      const drawMain = clamp01(thrDraw * 1.35 - ri * 0.12);
      const drawFan = clamp01((thrDraw - 0.6) / 0.4);
      const glowOp = dashed ? 0.1 : 0.22;
      const ambient = ((f + ri * 37) % 120) / 120;
      // snapping (reused): each thread breaks in the middle and both halves recoil, fading
      const snap = snapU > 0;
      const segs = [main, ...fans];
      threadNodes.push(
        <g key={`th${ri}`} opacity={snap ? 1 - snapU : thrVis} fill="none" strokeLinecap="round">
          {segs.map((d, k) => {
            const dr = k === 0 ? drawMain : drawFan;
            if (dr <= 0) return null;
            const dash = snap ? `${0.5 - 0.45 * snapU} ${0.9 * snapU + 0.001} 1` : `${dr} 1`;
            return (
              <g key={k}>
                <path d={d} stroke={PAL.photo} strokeOpacity={glowOp} strokeWidth={8} pathLength={1} strokeDasharray={dash} />
                {dashed && !snap ? (
                  <path d={d} stroke={PAL.photo} strokeWidth={2.6} strokeDasharray="10 8" opacity={dr >= 1 ? 1 : 0} />
                ) : (
                  <path d={d} stroke={PAL.photo} strokeWidth={2.6} pathLength={1} strokeDasharray={dash} />
                )}
              </g>
            );
          })}
          {!dashed && !snap && drawMain >= 1 ? <path d={main} stroke={PAL.photoPale} strokeWidth={2.4} pathLength={1} strokeDasharray="0.05 1" strokeDashoffset={-ambient * 1.05} /> : null}
          {drawFan >= 1 && !snap
            ? tgts.map((t, k) => <circle key={k} cx={t.x} cy={t.y} r={4.5} fill={dashed ? 'none' : PAL.photo} stroke={PAL.photo} strokeWidth={1.8} />)
            : null}
        </g>,
      );
      // read pulses: card → threads → boxes
      for (const rd of R.reads) {
        const u = (f - rd.at) / (rd.dur * 0.6);
        if (u < 0 || u > 1.15) continue;
        const um = clamp01(u * 1.35);
        const uf = clamp01((u - 0.74) / 0.26);
        threadNodes.push(
          <g key={`rd${ri}-${rd.at}`} fill="none" strokeLinecap="round">
            {um < 1 ? <path d={main} stroke="#FFFFFF" strokeWidth={5} pathLength={1} strokeDasharray="0.07 1" strokeDashoffset={-um + 0.07} /> : null}
            {uf > 0 && uf < 1 ? fans.map((d, k) => <path key={k} d={d} stroke="#FFFFFF" strokeWidth={5} pathLength={1} strokeDasharray="0.2 1" strokeDashoffset={-uf + 0.2} />) : null}
          </g>,
        );
      }
    });
    for (const rd of R.reads) {
      const t = f - (rd.at + rd.dur * 0.6);
      if (t < 0 || t > rd.dur * 0.4 + 6) continue;
      for (const id of PHOTO) {
        const q = posOf(id, curSpot(R.labs[id]));
        threadNodes.push(<rect key={`rf${id}-${rd.at}`} x={q.x + 3} y={q.y + 3} width={58} height={40} rx={3} fill={`url(#${p}-washW)`} opacity={Math.exp(-t / 6)} />);
      }
    }
  }

  /* ---------------- split view: label→spot threads */
  const mapThreads: React.ReactNode[] = [];
  if (splitOn) {
    const shownIds = [...PHOTO, ...[12, 45, 79, 118, 140].filter((id) => R.labs[id].c === 'other')];
    for (const id of shownIds) {
      const l = R.labs[id];
      const isP = PHOTO.includes(id);
      const a = labPt(id);
      const oldS = SSD_MAP[id];
      const newS = REMAP[id];
      const sw = l.remapAt < NEVER ? EASE.inOut(prog(f, l.remapAt, 14)) : 0;
      const pa = posOf(id, oldS);
      const pb = posOf(id, newS);
      const b0 = applyM(back, pa.x + BIT_CENTER.x, pa.y + BIT_CENTER.y);
      const b1 = applyM(back, pb.x + BIT_CENTER.x, pb.y + BIT_CENTER.y);
      const b = {x: lerp(b0.x, b1.x, sw), y: lerp(b0.y, b1.y, sw)};
      const op = clamp01((s - 0.4) / 0.4);
      const mid = {x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 30};
      const d = `M${a.x.toFixed(1)} ${a.y.toFixed(1)}Q${mid.x.toFixed(1)} ${mid.y.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      const col = isP ? (l.remapAt <= f ? PAL.annotation : PAL.photo) : PAL.annotation;
      mapThreads.push(
        <g key={`mt${id}`} opacity={op * (isP ? 1 : 0.4)} fill="none" strokeLinecap="round">
          {isP ? <path d={d} stroke={col} strokeOpacity={0.2} strokeWidth={6} /> : null}
          <path d={d} stroke={col} strokeWidth={isP ? 2 : 1.2} />
          <circle cx={b.x} cy={b.y} r={3.5} fill={col} />
        </g>,
      );
    }
  }

  /* ---------------- split view: Windows' view, a lit cone from the card to the label sheet (spare stays outside) */
  let cone: React.ReactNode = null;
  if (splitOn && sh('drawer') > 0.01) {
    const q = [applyM(front, GEOM.wall.x - 6, GEOM.wall.y - 6), applyM(front, GEOM.wall.x + GEOM.wall.w + 6, GEOM.wall.y - 6), applyM(front, GEOM.wall.x + GEOM.wall.w + 6, coreY0B()), applyM(front, GEOM.wall.x - 6, coreY0B())];
    const o = plugs[1];
    cone = (
      <g opacity={clamp01((s - 0.5) / 0.4) * sh('drawer')}>
        <path d={`M${o.x} ${o.y - 30}L${q[0].x} ${q[0].y}L${q[1].x} ${q[1].y}L${q[2].x} ${q[2].y}L${q[3].x} ${q[3].y}L${o.x} ${o.y + 30}Z`} fill={`url(#${p}-cone)`} />
      </g>
    );
  }

  /* ---------------- copies flying out (scanner copies the Bits out) */
  const copyNodes: React.ReactNode[] = [];
  for (const cpy of R.copies) {
    const n = cpy.ids.length;
    cpy.ids.forEach((id, i) => {
      const t0 = n <= 1 ? cpy.at : cpy.at + Math.round((i * Math.max(0, cpy.dur - 18)) / (n - 1));
      const u = (f - t0) / 18;
      if (u < 0 || u > 1) return;
      const q = posOf(id, curSpot(R.labs[id]));
      const a = applyM(back, q.x, q.y);
      const e = EASE.inOut(u);
      const x = lerp(a.x, cpy.to.x - 32, e);
      const y = lerp(a.y, cpy.to.y - 23, e) - Math.sin(Math.PI * e) * 120;
      const c = shown(R.labs[id], f);
      copyNodes.push(
        <g key={`cp${id}-${cpy.at}`} opacity={1 - Math.max(0, u - 0.85) / 0.15}>
          <line x1={a.x + 32} y1={a.y + 23} x2={x + 32} y2={y + 23} stroke={c === 'photo' ? PAL.photo : PAL.otherBit} strokeOpacity={0.18} strokeWidth={6} />
          <path d={BITS_D} transform={`translate(${x} ${y})`} fill={c === 'photo' ? PAL.photo : c === 'erased' || c === 'empty' ? PAL.oldBit : PAL.otherBit} opacity={0.95} />
        </g>,
      );
    });
  }

  /* ---------------- ghost wall (part of a far bigger wall, fading into haze) */
  const gx0 = GEOM.wall.x - PITCH * Math.round(1 + 6 * smooth(clamp01((cardPose(props, f).u - 0.15) / 0.55)));
  const gx1 = GEOM.wall.x + COLS * PITCH + PITCH * 8;
  const gy0 = GEOM.wall.y - PITCH * 5;
  const gy1 = GEOM.wall.y + ROWS * PITCH + PITCH * 4;
  const ghostOp = sh('ghost') * (1 - s) * (1 - clamp01(Math.abs(v.theta) / 50)) * (R.wallBuild > -NEVER / 2 ? prog(f, R.wallBuild + 20, 30) : 1);
  const coreX1 = GEOM.wall.x + COLS * PITCH;
  const coreY1 = GEOM.wall.y + ROWS * PITCH;
  const ghostFill = `url(#${p}-ghost-${ssd ? 'ssd' : 'hdd'})`;
  const ghost =
    ghostOp > 0.01 ? (
      <g opacity={ghostOp}>
        <rect x={gx0} y={gy0} width={gx1 - gx0} height={GEOM.wall.y - gy0} fill={ghostFill} />
        <rect x={gx0} y={coreY1} width={gx1 - gx0} height={gy1 - coreY1} fill={ghostFill} />
        <rect x={gx0} y={GEOM.wall.y} width={GEOM.wall.x - gx0} height={coreY1 - GEOM.wall.y} fill={ghostFill} />
        <rect x={coreX1} y={GEOM.wall.y} width={gx1 - coreX1} height={coreY1 - GEOM.wall.y} fill={ghostFill} />
        <rect x={gx0} y={gy0} width={gx1 - gx0} height={GEOM.wall.y - gy0} fill={`url(#${p}-ghostBits)`} opacity={0.5} />
        <rect x={coreX1} y={GEOM.wall.y} width={gx1 - coreX1} height={coreY1 - GEOM.wall.y} fill={`url(#${p}-ghostBits)`} opacity={0.5} />
        <rect x={gx0} y={coreY1} width={gx1 - gx0} height={gy1 - coreY1} fill={`url(#${p}-ghostBits)`} opacity={0.5} />
        <rect x={gx0 - 2} y={gy0 - 2} width={gx1 - gx0 + 4} height={GEOM.wall.y - gy0 + 2} fill={`url(#${p}-hzT)`} />
        <rect x={gx0 - 2} y={coreY1} width={gx1 - gx0 + 4} height={gy1 - coreY1 + 2} fill={`url(#${p}-hzB)`} />
        <rect x={coreX1} y={GEOM.wall.y} width={gx1 - coreX1 + 2} height={coreY1 - GEOM.wall.y} fill={`url(#${p}-hzR)`} />
        <rect x={gx0 - 2} y={GEOM.wall.y} width={GEOM.wall.x - gx0 + 2} height={coreY1 - GEOM.wall.y} fill={`url(#${p}-hzL)`} />
      </g>
    ) : null;

  /* ---------------- platter glow (hdd, background only) */
  const platOp = sh('platter') * (ssd ? (props.flip ? 1 - prog(f, flipAt, flipDur) : 0) : props.flip ? prog(f, flipAt, flipDur) : 1) * (1 - s);
  const PL = GEOM.platter;
  const platter =
    platOp > 0.01 ? (
      <g opacity={platOp * (R.wallBuild > -NEVER / 2 ? prog(f, R.wallBuild + 10, 30) : 1)}>
        {[1, 0.86, 0.72, 0.58, 0.44].map((k, i) => (
          <circle key={i} cx={PL.x} cy={PL.y} r={PL.r * k} fill="none" stroke="#9FB6DA" strokeOpacity={0.05 + 0.02 * i} strokeWidth={i === 0 ? 6 : 2} />
        ))}
        <g transform={`rotate(${(f * 0.22) % 360} ${PL.x} ${PL.y})`}>
          <path d={`M${PL.x} ${PL.y}L${PL.x + PL.r} ${PL.y - 120}A${PL.r} ${PL.r} 0 0 1 ${PL.x + PL.r} ${PL.y + 120}Z`} fill="#BFD0EA" opacity={0.07} />
          <path d={`M${PL.x} ${PL.y}L${PL.x - PL.r} ${PL.y + 80}A${PL.r} ${PL.r} 0 0 1 ${PL.x - PL.r} ${PL.y - 80}Z`} fill="#BFD0EA" opacity={0.04} />
        </g>
      </g>
    ) : null;

  /* ---------------- wall light: top light, key pool, a slow specular sweep */
  const specPeriod = 270;
  const specU = ((f % specPeriod) + specPeriod) % specPeriod;
  const specX = lerp(GEOM.wall.x - 500, GEOM.wall.x + GEOM.wall.w + 300, specU / 70);
  const lit = ghostOp > 0.01 ? {x0: gx0, y0: gy0, x1: gx1, y1: gy1} : {x0: GEOM.wall.x - 6, y0: GEOM.wall.y - 6, x1: GEOM.wall.x + (splitOn ? SPOT_COLS : COLS) * PITCH - 2, y1: coreY1 - 2};
  const wallLight = (
    <g>
      <rect x={lit.x0} y={lit.y0} width={lit.x1 - lit.x0} height={lit.y1 - lit.y0} fill={`url(#${p}-toplight)`} />
      <rect x={lit.x0} y={lit.y0} width={lit.x1 - lit.x0} height={lit.y1 - lit.y0} fill={`url(#${p}-key)`} />
      {specU < 70 ? <rect x={specX} y={GEOM.wall.y - 20} width={260} height={GEOM.wall.h + 40} fill={`url(#${p}-spec)`} transform={`skewX(-18)`} opacity={0.9} /> : null}
    </g>
  );

  /* ---------------- drawer, map, card */
  const lift = cp.u;
  const drawerHide = smooth(clamp01((lift - 0.15) / 0.55));
  const drawerBuild = R.drawerBuild > -NEVER / 2 ? springAt(f, R.drawerBuild, {damping: 16, stiffness: 140, mass: 0.9}) : 1;
  const drawerOp = sh('drawer') * (1 - drawerHide) * clamp01(drawerBuild * 1.4);
  const drawerDx = -420 * drawerHide - 300 * (1 - drawerBuild);
  const mapOp = sh('map') * (1 - drawerHide) * (R.mapBuild > -NEVER / 2 ? prog(f, R.mapBuild, 14) : 1);
  const cardBuild = R.card.build > -NEVER / 2 ? springAt(f, R.card.build, {damping: 12, stiffness: 150, mass: 0.7}) : 1;
  const cardOp = sh('card') * clamp01(cardBuild * 1.5);
  const cardTimes: CardTimes = {
    strike: R.card.strike,
    flag: R.card.flag,
    reuse: R.card.reuse,
    fields: props.cardFields,
    plugs: thrStart <= -NEVER / 2 ? -NEVER : thrStart < NEVER / 2 ? thrStart + R.card.threadsDur * 0.5 : NEVER,
  };
  const cardNode =
    cardOp > 0.01 ? (
      <g>
        <CardFace f={f} p={p} x={cp.x} y={cp.y + 70 * (1 - cardBuild)} w={cp.w} rot={cp.rot} t={cardTimes} shadow={1} shadowLift={lift * 260} opacity={cardOp} />
        {renderCard(props, f, p, cp)}
      </g>
    ) : null;
  const cardInDrawer = lift < 0.15;
  const rows: Array<{y: number; x0: number; x1: number; tab: number; th: number; i: number}> = [];
  for (let i = 0; i < 9; i++) rows.push({y: 302 + i * 19, x0: 140 - i * 4, x1: 604 + i * 4, tab: 170 + ((i * 113) % 300), th: 5 + i * 0.5, i});
  const rowNode = (r: (typeof rows)[number]) => {
    const shade = lerp(0.3, 0.92, (r.i / 8) ** 1.4);
    return (
      <g key={`row${r.i}`}>
        <rect x={r.x0} y={r.y + r.th - 1} width={r.x1 - r.x0} height={7} fill="#05070B" opacity={0.55} />
        <path d={`M${r.x0} ${r.y}H${r.tab}l4 -9H${r.tab + 58}l4 9H${r.x1}v${r.th}H${r.x0}Z`} fill={mixHex('#2A2723', PAL.paperMid, shade)} />
        <path d={`M${r.x0} ${r.y + 0.6}H${r.tab}l4 -9H${r.tab + 58}l4 9H${r.x1}`} fill="none" stroke="#FFFFFF" strokeOpacity={0.3 * shade} strokeWidth={1.2} />
      </g>
    );
  };
  const D = GEOM.drawer;
  const drawer =
    drawerOp > 0.01 ? (
      <g transform={`translate(${drawerDx} 0)`} opacity={drawerOp}>
        <ellipse cx={D.x + D.w / 2} cy={D.front.y1 + 6} rx={D.w * 0.56} ry={22} fill={`url(#${p}-ashadow)`} />
        {/* cabinet face with the slot the drawer comes out of */}
        <rect x={D.x + 14} y={D.y} width={D.w - 28} height={66} rx={8} fill={`url(#${p}-drawer)`} />
        <rect x={D.x + 14} y={D.y} width={D.w - 28} height={3} rx={1.5} fill={PAL.steelHi} opacity={0.9} />
        <rect x={D.x + 30} y={D.y + 26} width={D.w - 60} height={40} rx={4} fill="#070A10" />
        {/* drawer sides and floor, in perspective toward the viewer */}
        <path d={`M${D.x + 30} ${D.y + 64}H${D.x + D.w - 30}L${D.x + D.w} ${D.front.y0}H${D.x}Z`} fill="#0B0F17" />
        <path d={`M${D.x + 30} ${D.y + 64}L${D.x} ${D.front.y0}H${D.x + 16}L${D.x + 40} ${D.y + 64}Z`} fill={PAL.drawer} />
        <path d={`M${D.x + D.w - 30} ${D.y + 64}L${D.x + D.w} ${D.front.y0}H${D.x + D.w - 16}L${D.x + D.w - 40} ${D.y + 64}Z`} fill={PAL.drawerHi} opacity={0.8} />
        {/* the cards: tops seen from above, back rows in shadow */}
        {rows.filter((r) => r.i < 7).map(rowNode)}
        {cardInDrawer ? cardNode : null}
        {rows.filter((r) => r.i >= 7).map(rowNode)}
        {/* drawer front: lit bevel, label holder (blank), handle */}
        <rect x={D.x} y={D.front.y0} width={D.w} height={D.front.y1 - D.front.y0} rx={8} fill={`url(#${p}-drawer)`} />
        <rect x={D.x + 2} y={D.front.y0 + 1} width={D.w - 4} height={3} rx={1.5} fill={PAL.steelHi} />
        <rect x={D.x} y={D.front.y1 - 6} width={D.w} height={6} rx={3} fill="#0A0E16" opacity={0.6} />
        <rect x={D.x + D.w / 2 - 74} y={D.front.y0 + 20} width={148} height={42} rx={5} fill={`url(#${p}-plate)`} />
        <rect x={D.x + D.w / 2 - 64} y={D.front.y0 + 27} width={128} height={28} rx={3} fill={PAL.paper} />
        <circle cx={D.x + D.w / 2 - 66} cy={D.front.y0 + 41} r={3} fill="#5F6670" />
        <circle cx={D.x + D.w / 2 + 66} cy={D.front.y0 + 41} r={3} fill="#5F6670" />
        <path d={`M${D.x + D.w / 2 - 62} ${D.front.y0 + 74}V${D.front.y0 + 90}Q${D.x + D.w / 2 - 62} ${D.front.y0 + 98} ${D.x + D.w / 2 - 54} ${D.front.y0 + 98}H${D.x + D.w / 2 + 54}Q${D.x + D.w / 2 + 62} ${D.front.y0 + 98} ${D.x + D.w / 2 + 62} ${D.front.y0 + 90}V${D.front.y0 + 74}`} fill="none" stroke={PAL.plate} strokeWidth={7} strokeLinecap="round" />
        <path d={`M${D.x + D.w / 2 - 54} ${D.front.y0 + 95}H${D.x + D.w / 2 + 54}`} stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={1.4} />
      </g>
    ) : null;

  /* map of taken boxes: a navy plate, 16×9 recessed cells, solid = taken, hollow white = available */
  const M = GEOM.map;
  const mapCells: React.ReactNode[] = [];
  if (mapOp > 0.01) {
    for (let id = 1; id <= N_BOXES; id++) {
      const l = R.labs[id];
      const c = shown(l, f);
      const x = M.x + colOf(id) * M.pitch;
      const y = M.y + rowOf(id) * M.pitch;
      const taken = c === 'photo' || c === 'other' || c === 'old';
      const av = l.avail <= f && l.availOff > f;
      if (!taken && !av) continue;
      const flipU2 = av ? prog(f, l.avail, 8, EASE.inOut) : l.availOff <= f ? 1 - prog(f, l.availOff, 6) : 0;
      const sx = Math.abs(Math.cos(Math.PI * flipU2));
      const hollow = flipU2 > 0.5;
      mapCells.push(
        <g key={`m${id}`} transform={`translate(${x + M.cell / 2} ${y + M.cell / 2}) scale(${Math.max(0.05, sx)} 1)`}>
          {hollow ? (
            <rect x={-7.5} y={-7.5} width={15} height={15} rx={2.5} fill="none" stroke={PAL.ink} strokeWidth={2.4} />
          ) : (
            <>
              <rect x={-8} y={-8} width={16} height={16} rx={2.5} fill={PAL.silver} />
              <rect x={-7} y={-7.4} width={14} height={2.2} rx={1} fill="#FFFFFF" opacity={0.75} />
            </>
          )}
        </g>,
      );
    }
  }
  const mapNode =
    mapOp > 0.01 ? (
      <g transform={`translate(${drawerDx} 0)`} opacity={mapOp}>
        <ellipse cx={(M.plate.x0 + M.plate.x1) / 2} cy={M.plate.y1 + 4} rx={(M.plate.x1 - M.plate.x0) * 0.55} ry={16} fill={`url(#${p}-ashadow)`} />
        <rect x={M.plate.x0} y={M.plate.y0} width={M.plate.x1 - M.plate.x0} height={M.plate.y1 - M.plate.y0} rx={14} fill={`url(#${p}-drawer)`} />
        <rect x={M.plate.x0 + 2} y={M.plate.y0 + 1} width={M.plate.x1 - M.plate.x0 - 4} height={3} rx={1.5} fill={PAL.steelHi} />
        <rect x={M.x - 7} y={M.y - 7} width={COLS * M.pitch + 8} height={ROWS * M.pitch + 8} rx={6} fill="#090D15" />
        <path
          d={Array.from({length: N_BOXES}, (_, i) => rr(M.x + (i % COLS) * M.pitch, M.y + Math.floor(i / COLS) * M.pitch, M.cell, M.cell, 3)).join('')}
          fill="#121A27"
          stroke="#2C3A52"
          strokeWidth={1}
        />
        {[
          [M.plate.x0 + 10, M.plate.y0 + 10],
          [M.plate.x1 - 10, M.plate.y0 + 10],
          [M.plate.x0 + 10, M.plate.y1 - 10],
          [M.plate.x1 - 10, M.plate.y1 - 10],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.2} fill="#7A8496" />
        ))}
        {mapCells}
      </g>
    ) : null;

  /* ---------------- boundary between Windows' side and the drive's side, with the note slot */
  const B = GEOM.boundary;
  const bu = prog(f, R.boundary, 16, EASE.out);
  const boundary =
    bu > 0 ? (
      <g>
        <rect x={B.x - 5} y={B.y0} width={10} height={(B.slotY - B.slotH / 2 - B.y0) * bu} rx={3} fill="#2A374D" />
        <rect x={B.x - 5} y={B.slotY + B.slotH / 2} width={10} height={(B.y1 - B.slotY - B.slotH / 2) * bu} rx={3} fill="#2A374D" />
        <rect x={B.x - 1.5} y={B.y0} width={3} height={(B.y1 - B.y0) * bu} fill={PAL.annotation} opacity={0.55} />
        <rect x={B.x - 40} y={B.y0} width={80} height={(B.y1 - B.y0) * bu} fill={`url(#${p}-band)`} opacity={0.25} />
        {bu >= 1 ? (
          <g>
            <rect x={B.x - 14} y={B.slotY - B.slotH / 2} width={28} height={B.slotH} rx={6} fill="#04060A" stroke={PAL.annotation} strokeWidth={2.4} />
            <rect x={B.x - 9} y={B.slotY - B.slotH / 2 + 6} width={18} height={B.slotH - 12} rx={4} fill="none" stroke="#FFFFFF" strokeOpacity={0.25} strokeWidth={1.4} />
          </g>
        ) : null}
      </g>
    ) : null;

  /* ---------------- the TRIM note through the slot (white card, magenta tab, tiny box numbers; no cyan) */
  let trimNode: React.ReactNode = null;
  if (R.trim && f >= R.trim.at) {
    const t = (f - R.trim.at) / R.trim.dur;
    const start = cardPlugs(GEOM.card.x, GEOM.card.y, GEOM.card.w)[1];
    const slot = {x: B.x, y: B.slotY};
    const to = R.trim.to;
    let x: number;
    let y: number;
    let sy = 1;
    if (t < 0.45) {
      const u = EASE.inOut(t / 0.45);
      x = lerp(start.x - 20, slot.x - 40, u);
      y = lerp(start.y, slot.y, u) - Math.sin(Math.PI * u) * 40;
    } else if (t < 0.6) {
      const u = (t - 0.45) / 0.15;
      x = lerp(slot.x - 40, slot.x + 40, u);
      y = slot.y;
      sy = 1 - 0.35 * Math.sin(Math.PI * u);
    } else {
      const u = EASE.out(clamp01((t - 0.6) / 0.4));
      x = lerp(slot.x + 40, to.x, u);
      y = lerp(slot.y, to.y, u);
    }
    const op = 1 - prog(f, R.trim.at + R.trim.dur + 50, 12);
    trimNode =
      op > 0 ? (
        <g transform={`translate(${x} ${y}) scale(1 ${sy})`} opacity={op}>
          <rect x={-38} y={-24} width={76} height={50} rx={5} fill="#000" opacity={0.3} transform="translate(4 6)" />
          <rect x={-38} y={-24} width={76} height={50} rx={5} fill={PAL.paper} />
          <rect x={-38} y={-24} width={76} height={50} rx={5} fill="none" stroke={PAL.paperShade} strokeWidth={1.2} />
          <path d="M-36 -24V-31Q-36 -34 -33 -34H-12Q-9 -34 -9 -31V-24Z" fill={PAL.emphasis} />
          <g fontFamily={MONO} fontWeight={600} fontSize={8.5} fill={PAL.tileInk} opacity={0.75}>
            <text x={-30} y={-9}>021–023</text>
            <text x={-30} y={4}>058–060</text>
            <text x={-30} y={17}>098–100</text>
          </g>
        </g>
      ) : null;
  }

  /* ---------------- the drive actor (ssd): the chip under the wall's lower-left corner */
  const busy = R.actorBusy.reduce((m, w) => Math.max(m, win(f, w.at - 6, w.at + w.dur + 12, 6, 14)), 0);
  const san = R.sanitize ? win(f, R.sanitize.at - 8, R.sanitize.at + R.sanitize.dur + 10, 6, 12) : 0;
  const actOp = sh('actor') * (ssd ? (props.flip ? prog(f, flipAt + flipDur - 6, 10) : 1) : 0);
  const A = GEOM.actor;
  const idle = 0.35 + 0.15 * Math.sin(TAU * (f / 120));
  const actor =
    actOp > 0.01 ? (
      <g opacity={actOp}>
        <ellipse cx={A.x} cy={A.y + 40} rx={110} ry={14} fill={`url(#${p}-ashadow)`} />
        <ellipse cx={A.x} cy={A.y} rx={150 + 60 * Math.max(busy, san)} ry={90 + 40 * Math.max(busy, san)} fill={`url(#${p}-amberGlow)`} opacity={idle + 0.65 * Math.max(busy, san)} />
        <path d={Array.from({length: 9}, (_, i) => `M${A.x - 48 + i * 12} ${A.y - 34}v-8M${A.x - 48 + i * 12} ${A.y + 34}v8`).join('')} stroke={PAL.silverDark} strokeWidth={3} />
        <rect x={A.x - 62} y={A.y - 36} width={124} height={72} rx={8} fill="#1A1D23" />
        <rect x={A.x - 54} y={A.y - 30} width={108} height={60} rx={6} fill={`url(#${p}-chip)`} />
        <rect x={A.x - 52} y={A.y - 28} width={104} height={3} rx={1.5} fill="#FFFFFF" opacity={0.7} />
        <rect x={A.x - 20} y={A.y - 12} width={40} height={24} rx={4} fill="none" stroke={PAL.drive} strokeWidth={2.5} opacity={0.5 + 0.5 * Math.max(busy, san)} />
        <circle cx={A.x + 40} cy={A.y + 18} r={4} fill={PAL.drive} opacity={0.6 + 0.4 * Math.max(busy, san)} />
      </g>
    ) : null;

  /* ---------------- sanitize: an amber pulse radiating from the chip to every box, spare included */
  let sanNode: React.ReactNode = null;
  if (R.sanitize && f >= R.sanitize.at && f < R.sanitize.at + R.sanitize.dur + 14) {
    const u = (f - R.sanitize.at) / R.sanitize.dur;
    const rad = u * 1500;
    sanNode = (
      <g opacity={1 - clamp01((u - 0.85) / 0.3)} fill="none">
        <circle cx={A.x} cy={A.y} r={rad} stroke={PAL.drive} strokeOpacity={0.22} strokeWidth={46} />
        <circle cx={A.x} cy={A.y} r={rad} stroke={PAL.driveHot} strokeWidth={5} />
        <circle cx={A.x} cy={A.y} r={Math.max(0, rad - 70)} stroke={PAL.drive} strokeOpacity={0.35} strokeWidth={2} />
      </g>
    );
  }

  /* ---------------- haze in front of the wall (depth) */
  const hazeFront = (
    <g opacity={0.9}>
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={GEOM.wall.x + ((f * (0.35 + 0.12 * i) + i * 520) % (GEOM.wall.w + 600)) - 300}
          cy={GEOM.wall.y + 120 + i * 220}
          rx={420}
          ry={90}
          fill={mixHex(L.haze, '#8FA6CC', 0.25)}
          opacity={0.05}
        />
      ))}
    </g>
  );

  /* ---------------- the registered wall render (cluster-wall_b) for render→code swaps */
  const wallRenderOp = clamp01(num(props.renders?.wall, f, 0));
  const wr = wallRenderRect();
  const wallRender = wallRenderOp > 0.001 ? <image href={assetUrl('cluster-wall_b')} x={wr.x} y={wr.y} width={wr.w} height={wr.h} opacity={wallRenderOp} preserveAspectRatio="none" /> : null;

  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <Defs p={p} light={L} fog={fog} />
        <g transform={backT}>
          {ghost}
          {platter}
          {cells}
          {trays}
          {contents}
          {glyphNode}
          {!splitOn ? numbers(labTL, ssd ? 55.5 : 58.6) : null}
          {wallLight}
          {sweepNodes}
          {!splitOn ? overlays : null}
          {effects}
          {scanNodes}
          {wallRender}
        </g>
        {splitOn ? (
          <g transform={frontT} opacity={clamp01(s * 4)}>
            {Array.from({length: N_BOXES}, (_, i) => {
              const q = boxXY(i + 1);
              return <use key={i} href={`#${p}-label`} x={q.x} y={q.y} />;
            })}
            {numbers(labTL, 55.5)}
            {overlays}
          </g>
        ) : null}
        {cone}
        {mapThreads}
        {hazeFront}
        {boundary}
        {actor}
        {sanNode}
        {mapNode}
        {drawer}
        {!cardInDrawer ? cardNode : null}
        {threadNodes}
        {copyNodes}
        {trimNode}
      </svg>
    </div>
  );
};

/** mft-record_b registered onto the vector card (the card's units ARE its native px); LEDs regraded to white */
const renderCard = (props: ArchiveProps, f: number, p: string, cp: {x: number; y: number; w: number; rot: number}) => {
  const op = clamp01(num(props.renders?.card, f, 0));
  if (op <= 0.001) return null;
  const k = cardK(cp.w);
  return (
    <g transform={`translate(${cp.x} ${cp.y}) rotate(${cp.rot}) scale(${k}) translate(${-CARD.cx} ${-CARD.cy})`} opacity={op}>
      <image href={assetUrl('mft-record_b')} x={0} y={0} width={CARD.render.w} height={CARD.render.h} />
      {CARD.leds.map((b, i) => (
        <rect key={i} x={b[0]} y={b[1]} width={b[2] - b[0]} height={b[3] - b[1]} rx={6} fill="#DDE3EC" />
      ))}
    </g>
  );
};

