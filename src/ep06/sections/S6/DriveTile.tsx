// S6-local: a small code-drawn, period-neutral drive (graphite slab, a 4×8 window of blocks, the amber chip that runs
// it, a pin edge). Many tiles render into ONE <svg> with merged paths (one path per cell kind), as the kit advises.
import React from 'react';
import {PAL, rgba} from '../../kit';

export const TILE = {w: 76, h: 210, cols: 4, rows: 8, cell: 12, pitch: 16, gx: -30, gy: -92} as const;
export const CELLS = TILE.cols * TILE.rows; // 32

/** local top-left of cell k (k counts bottom-up, left to right) */
export const cellXY = (k: number): {x: number; y: number} => {
  const col = k % TILE.cols;
  const row = TILE.rows - 1 - Math.floor(k / TILE.cols);
  return {x: TILE.gx + col * TILE.pitch, y: TILE.gy + row * TILE.pitch};
};
/** local y of the top edge of the fill when n cells (bottom-up) are lit, for a band or a level */
export const fillTopY = (n: number): number => TILE.gy + TILE.rows * TILE.pitch - Math.ceil(n / TILE.cols) * TILE.pitch;

export type TileSpec = {
  cx: number;
  cy: number;
  s: number;
  op?: number;
  /** lit cells, bottom-up (0..32) */
  lit: number;
  litColor?: string;
  /** cells with index ≥ flashFrom (and < lit) are drawn hot (just recovered) */
  flashFrom?: number;
  /** cleared cells [from, to) glow amber (the drive's housekeeping just erased them) */
  ember?: {from: number; to: number; a: number};
  /** 0..1 amber chip glow */
  chip?: number;
  /** 0..1 white outline flash */
  ring?: number;
  /** explicit extra cells (the array beat: the photo's cyan Bits) */
  extra?: ReadonlyArray<{k: number; color: string; a: number}>;
};

const rectD = (x: number, y: number, w: number, h: number) => `M${x.toFixed(1)} ${y.toFixed(1)}h${w.toFixed(1)}v${h.toFixed(1)}h${(-w).toFixed(1)}Z`;

export const DriveTiles: React.FC<{id: string; tiles: readonly TileSpec[]}> = ({id, tiles}) => {
  const vis = tiles.filter((t) => (t.op ?? 1) > 0.01);
  const unlit: string[] = [];
  const lit = new Map<string, string[]>();
  const glow = new Map<string, string[]>();
  const hot: string[] = [];
  const ember: Array<{d: string; a: number}> = [];
  const extra = new Map<string, Array<{d: string; a: number}>>();
  for (const t of vis) {
    if ((t.op ?? 1) < 0.999) continue; // faded tiles draw their cells in their own group below
    pushCells(t, unlit, lit, glow, hot, ember, extra);
  }
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#434957" />
          <stop offset="0.5" stopColor="#2A2F38" />
          <stop offset="1" stopColor="#1A1D24" />
        </linearGradient>
        <radialGradient id={`${id}-amb`}>
          <stop offset="0" stopColor={PAL.drive} stopOpacity={0.75} />
          <stop offset="1" stopColor={PAL.drive} stopOpacity={0} />
        </radialGradient>
      </defs>
      {vis.map((t, i) => (
        <TileBody key={i} id={id} t={t} />
      ))}
      <path d={unlit.join('')} fill="#1B212B" />
      {[...glow.entries()].map(([c, ds]) => (
        <path key={`g${c}`} d={ds.join('')} fill={rgba(c, 0.2)} />
      ))}
      {[...lit.entries()].map(([c, ds]) => (
        <path key={`l${c}`} d={ds.join('')} fill={c} />
      ))}
      {hot.length ? <path d={hot.join('')} fill="#FFFFFF" /> : null}
      {ember.map((e, i) => (
        <path key={`e${i}`} d={e.d} fill={PAL.drive} opacity={e.a} />
      ))}
      {[...extra.entries()].flatMap(([c, es]) =>
        es.map((e, i) => (
          <g key={`x${c}${i}`} opacity={e.a}>
            <path d={e.d} fill={c} />
          </g>
        )),
      )}
      {vis
        .filter((t) => (t.op ?? 1) < 0.999)
        .map((t, i) => {
          const u: string[] = [];
          const l = new Map<string, string[]>();
          const g = new Map<string, string[]>();
          const h: string[] = [];
          pushCells(t, u, l, g, h, [], new Map());
          return (
            <g key={`f${i}`} opacity={t.op}>
              <path d={u.join('')} fill="#1B212B" />
              {[...l.entries()].map(([c, ds]) => (
                <path key={c} d={ds.join('')} fill={c} />
              ))}
            </g>
          );
        })}
    </g>
  );
};

const pushCells = (
  t: TileSpec,
  unlit: string[],
  lit: Map<string, string[]>,
  glow: Map<string, string[]>,
  hot: string[],
  ember: Array<{d: string; a: number}>,
  extra: Map<string, Array<{d: string; a: number}>>,
) => {
  const s = t.s;
  const c = TILE.cell * s;
  const n = Math.max(0, Math.min(CELLS, Math.round(t.lit)));
  const col = t.litColor ?? PAL.otherBit;
  const ex = new Set((t.extra ?? []).map((e) => e.k));
  const emb: string[] = [];
  for (let k = 0; k < CELLS; k++) {
    const q = cellXY(k);
    const x = t.cx + q.x * s;
    const y = t.cy + q.y * s;
    if (ex.has(k)) continue;
    if (k < n) {
      if (t.flashFrom !== undefined && k >= t.flashFrom) hot.push(rectD(x - s, y - s, c + 2 * s, c + 2 * s));
      else {
        if (!lit.has(col)) lit.set(col, []);
        lit.get(col)!.push(rectD(x, y, c, c));
      }
      if (!glow.has(col)) glow.set(col, []);
      glow.get(col)!.push(rectD(x - 3 * s, y - 3 * s, c + 6 * s, c + 6 * s));
    } else {
      unlit.push(rectD(x, y, c, c));
      if (t.ember && k >= t.ember.from && k < t.ember.to) emb.push(rectD(x, y, c, c));
    }
  }
  if (emb.length && t.ember) ember.push({d: emb.join(''), a: t.ember.a});
  for (const e of t.extra ?? []) {
    const q = cellXY(e.k);
    const x = t.cx + q.x * s;
    const y = t.cy + q.y * s;
    if (!extra.has(e.color)) extra.set(e.color, []);
    extra.get(e.color)!.push({d: rectD(x - 2 * s, y - 2 * s, c + 4 * s, c + 4 * s), a: e.a * 0.25});
    extra.get(e.color)!.push({d: rectD(x, y, c, c), a: e.a});
  }
};

const TileBody: React.FC<{id: string; t: TileSpec}> = ({id, t}) => {
  const s = t.s;
  const W = TILE.w * s;
  const H = TILE.h * s;
  const chip = t.chip ?? 0;
  const ring = t.ring ?? 0;
  const pins = Array.from({length: 8}, (_, i) => rectD(-29 + i * 8, 86, 4, 12)).join('');
  return (
    <g transform={`translate(${t.cx.toFixed(1)} ${t.cy.toFixed(1)})`} opacity={t.op ?? 1}>
      <rect x={-W / 2 + 4 * s} y={H / 2 - 4 * s} width={W - 8 * s} height={10 * s} rx={5 * s} fill="#000" opacity={0.45} />
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={9 * s} fill={`url(#${id}-body)`} stroke={rgba('#9AA6BA', 0.42 + 0.5 * ring)} strokeWidth={1.6 * s + 2 * ring} />
      <rect x={-W / 2 + 3 * s} y={-H / 2 + 2 * s} width={W - 6 * s} height={2 * s} rx={s} fill="#FFFFFF" opacity={0.28} />
      <rect x={-33 * s} y={-96 * s} width={66 * s} height={132 * s} rx={5 * s} fill="#0A0D12" stroke={rgba('#FFFFFF', 0.07)} strokeWidth={s} />
      {chip > 0.02 ? <ellipse cx={0} cy={58 * s} rx={46 * s * (0.8 + 0.4 * chip)} ry={30 * s * (0.8 + 0.4 * chip)} fill={`url(#${id}-amb)`} opacity={chip} /> : null}
      <rect x={-15 * s} y={46 * s} width={30 * s} height={24 * s} rx={3 * s} fill="#14171C" stroke={PAL.drive} strokeOpacity={0.35 + 0.65 * chip} strokeWidth={1.8 * s} />
      <rect x={-8 * s} y={52 * s} width={16 * s} height={12 * s} rx={2 * s} fill={PAL.drive} opacity={0.18 + 0.75 * chip} />
      <path d={pins} transform={`scale(${s})`} fill="#7E8796" />
    </g>
  );
};
