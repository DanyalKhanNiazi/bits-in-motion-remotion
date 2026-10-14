/**
 * IconGallery / IconSheet (ICONS.md §7): the review composition for the Signal Atlas icon library.
 * One page per 60 frames (breathing and flips are live; stills are taken at page start + 30):
 *  - World pages: the Ep01 desktop at its storyboard shots (true on-screen sizes; 2.5D sides and `detail` from the
 *    bible's formulas; the standby/main channels and the button route drawn for context only).
 *  - State pages: every stateful icon in every state (off, pointed, on, alwaysOn, glow, visited, reset, waiting,
 *    limit, fault, mid-flip) at detail 0 (on `board`) and detail 1 (on `deck`).
 *  - Passive pages: connectors, power path props (rocker, plug, press), chipset x-ray, boards, scene props.
 *  - Glyph pages: every §5 glyph at its size, with its animation phases.
 *  - Knockout page: every icon in `fillsOnly` mode with its ports as 6 px `info` crosses. Topic placeholders.
 * Render: node tools/stills.mjs src/entries/icongallery.tsx IconGallery out/icons/look 30,90,150 --phone
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {CHANNEL, COLOR, STROKE, type PartState} from '../engine/tokens';
import {MONO} from '../shared/fonts';
import {routePath} from '../shared/geom';
import {detailOf, fx, sw} from './primitives';
import {ICON_TYPES, getIcon, isPlaceholder} from './registry';
import {EP01_CHANNELS, EP01_PARTS, EP01_ROUTES, SHOTS, sideOffset, type SheetCam, type SheetPart} from './sheetWorld';
import type {IconType} from './types';
import {StatePip} from './glyphs/statePip';
import {QBadge} from './glyphs/qBadge';
import {ApproxChip} from './glyphs/approxChip';
import {EyeBadge} from './glyphs/eyeBadge';
import {Brackets} from './glyphs/brackets';
import {EndTick} from './glyphs/endTick';
import {Ripple} from './glyphs/ripple';
import {ScaleChip} from './glyphs/scaleChip';
import {StateBadge} from './glyphs/stateBadge';
import {VisitedMark} from './glyphs/visitedMark';
import {PowerSymbol} from './glyphs/powerSymbol';
import {ClockGlyph} from './glyphs/clockGlyph';
import {NetJackGlyph} from './glyphs/netJackGlyph';
import {RestartGlyph} from './glyphs/restartGlyph';
import {CommandChip} from './scene/commandChip';
import {relOf} from './pc/chipset';

export const PAGE_FRAMES = 60;
const HEADER_Y = 30;

type PageProps = {frame: number; pageStart: number; index: number};

/* ------------------------------------------------------------------------------------------------
 * Shared pieces
 * ---------------------------------------------------------------------------------------------- */

const Caption: React.FC<{text: string; sub?: string}> = ({text, sub}) => (
  <div style={{position: 'absolute', left: 40, top: HEADER_Y - 8, fontFamily: MONO, fontSize: 24, color: COLOR.textMuted, letterSpacing: '0.02em', whiteSpace: 'nowrap'}}>
    {text}
    {sub ? <span style={{color: COLOR.detail, marginLeft: 18}}>{sub}</span> : null}
  </div>
);

const Label: React.FC<{x: number; y: number; text: string; color?: string; size?: number}> = ({x, y, text, color, size = 17}) => (
  <text x={x} y={y} fill={color ?? COLOR.textMuted} fontFamily={MONO} fontSize={size} textAnchor="middle">
    {text}
  </text>
);

export interface CellSpec {
  type: IconType;
  label: string;
  state?: PartState;
  props?: Record<string, unknown>;
  detail: number;
  zoom: number;
  size?: {w: number; h: number};
  glow?: boolean | number;
  pointed?: number;
  flipFrom?: PartState;
  fillsOnly?: boolean;
  ports?: boolean;
  /** Props computed from the page start (for mid-animation samples). */
  dyn?: (pageStart: number) => Record<string, unknown>;
  /** Extra parts drawn first, in the same cell coordinates (world offsets from the icon's top-left). */
  context?: Array<{type: IconType; dx: number; dy: number; props?: Record<string, unknown>; size?: {w: number; h: number}; above?: boolean; state?: PartState; glow?: boolean}>;
}

/** One icon centred at (cx, cy), with a 2.5D side from the plain oblique term (perspective 0). */
const IconCell: React.FC<{c: CellSpec; cx: number; cy: number; frame: number; pageStart: number; id: string}> = ({c, cx, cy, frame, pageStart, id}) => {
  const spec = getIcon(c.type);
  const C = spec.component;
  const size = c.size ?? spec.size;
  const z = c.zoom;
  const rect = {x: -size.w / 2, y: -size.h / 2, w: size.w, h: size.h};
  const side: [number, number] = [spec.z * 0.45, spec.z * 0.6];
  const flip = c.flipFrom ? {from: c.flipFrom, at: pageStart + 28} : undefined;
  const props = {
    id,
    ...rect,
    zoom: z,
    frame,
    state: c.state,
    flip,
    side,
    detail: c.detail,
    glow: c.glow,
    pointed: c.pointed,
    fillsOnly: c.fillsOnly,
    ...(c.props ?? {}),
    ...(c.dyn ? c.dyn(pageStart) : {}),
  };
  const ports = c.ports ? spec.ports(props) : null;
  return (
    <g transform={`translate(${fx(cx)} ${fx(cy)}) scale(${z})`}>
      {(c.context ?? []).filter((ctx) => !ctx.above).map((ctx, i) => {
        const cs = getIcon(ctx.type);
        const CC = cs.component;
        const sz = ctx.size ?? cs.size;
        return (
          <CC
            key={i}
            id={`${id}-ctx${i}`}
            x={rect.x + ctx.dx}
            y={rect.y + ctx.dy}
            w={sz.w}
            h={sz.h}
            zoom={z}
            frame={frame}
            side={[cs.z * 0.45, cs.z * 0.6]}
            detail={c.detail}
            fillsOnly={c.fillsOnly}
            state={ctx.state}
            glow={ctx.glow}
            {...(ctx.props ?? {})}
          />
        );
      })}
      <C {...props} />
      {(c.context ?? []).filter((ctx) => ctx.above).map((ctx, i) => {
        const cs = getIcon(ctx.type);
        const CC = cs.component;
        const sz = ctx.size ?? cs.size;
        return (
          <CC
            key={`a${i}`}
            id={`${id}-above${i}`}
            x={rect.x + ctx.dx}
            y={rect.y + ctx.dy}
            w={sz.w}
            h={sz.h}
            zoom={z}
            frame={frame}
            side={[cs.z * 0.45, cs.z * 0.6]}
            detail={0}
            fillsOnly={c.fillsOnly}
            state={ctx.state}
            glow={ctx.glow}
            {...(ctx.props ?? {})}
          />
        );
      })}
      {ports
        ? Object.entries(ports).map(([name, pt]) => (
            <path
              key={name}
              d={`M${fx(pt[0] - sw(6, z))} ${fx(pt[1])}H${fx(pt[0] + sw(6, z))}M${fx(pt[0])} ${fx(pt[1] - sw(6, z))}V${fx(pt[1] + sw(6, z))}`}
              stroke={COLOR.info}
              strokeWidth={sw(2, z)}
            />
          ))
        : null}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------------
 * World pages
 * ---------------------------------------------------------------------------------------------- */

const WorldView: React.FC<{cam: SheetCam; frame: number; parts?: SheetPart[]; idPrefix: string; fillsOnly?: boolean}> = ({cam, frame, parts, idPrefix, fillsOnly}) => {
  const z = cam.zoom;
  const tx = 960 - cam.center[0] * z;
  const ty = 540 - cam.center[1] * z;
  const list = parts ?? EP01_PARTS;
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${z})`}>
        {list.map((part) => {
          const spec = getIcon(part.type);
          const C = spec.component;
          return (
            <C
              key={part.id}
              id={`${idPrefix}-${part.id}`}
              {...part.rect}
              zoom={z}
              frame={frame}
              state={part.state}
              side={sideOffset(cam, part.rect, part.z)}
              detail={detailOf(Math.min(part.rect.w, part.rect.h) * z)}
              glow={part.glow}
              fillsOnly={fillsOnly}
              {...(part.props ?? {})}
            />
          );
        })}
        {!fillsOnly
          ? EP01_CHANNELS.map((c) => {
              const d = routePath(c.points, CHANNEL.bend);
              const spec = c.kind === 'main' ? CHANNEL.main : CHANNEL.standby;
              return (
                <g key={c.id}>
                  <path d={d} fill="none" stroke={COLOR.structure} strokeWidth={sw(spec.outer, z)} strokeLinecap="butt" />
                  <path d={d} fill="none" stroke={c.full ? COLOR.energyStandby : COLOR.board} strokeWidth={sw(spec.fill, z)} strokeLinecap="butt" />
                </g>
              );
            })
          : null}
        {!fillsOnly
          ? EP01_ROUTES.map((r) => (
              <path key={r.id} d={routePath(r.points, 8)} fill="none" stroke={COLOR.structure} strokeWidth={sw(STROKE.route, z)} strokeLinecap="round" strokeLinejoin="round" />
            ))
          : null}
      </g>
    </svg>
  );
};

const worldPage = (shot: keyof typeof SHOTS, note: string, patch?: Record<string, Record<string, unknown>>): React.FC<PageProps> => {
  const parts = patch ? EP01_PARTS.map((pt) => (patch[pt.id] ? {...pt, props: {...(pt.props ?? {}), ...patch[pt.id]}} : pt)) : undefined;
  const P: React.FC<PageProps> = ({frame}) => (
    <AbsoluteFill style={{backgroundColor: COLOR.field}}>
      <WorldView cam={SHOTS[shot]} frame={frame} idPrefix={`w-${shot}`} parts={parts} />
      <Caption text={`world · ${shot} ×${SHOTS[shot].zoom}`} sub={note} />
    </AbsoluteFill>
  );
  return P;
};

/* ------------------------------------------------------------------------------------------------
 * Grid pages: cells laid out in rows, each row on its own ground band
 * ---------------------------------------------------------------------------------------------- */

interface GridRow {
  title: string;
  ground: string;
  cells: CellSpec[];
}

const GridPage = (title: string, sub: string, rows: GridRow[], opts?: {cellH?: number; labelGap?: number}): React.FC<PageProps> => {
  const P: React.FC<PageProps> = ({frame, pageStart, index}) => {
    const top = 70;
    const avail = 1080 - top - 16;
    const rowH = opts?.cellH ?? Math.floor(avail / rows.length);
    return (
      <AbsoluteFill style={{backgroundColor: COLOR.field}}>
        <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
          {rows.map((row, ri) => {
            const y0 = top + ri * rowH;
            const n = row.cells.length;
            const x0 = 150;
            const cw = (1920 - x0 - 30) / Math.max(n, 1);
            return (
              <g key={ri}>
                <rect x={x0 - 6} y={y0 + 4} width={1920 - x0 - 24} height={rowH - 8} rx={12} fill={row.ground} />
                <text x={20} y={y0 + rowH / 2} fill={COLOR.textMuted} fontFamily={MONO} fontSize={17}>
                  {row.title.split('\n').map((t, i) => (
                    <tspan key={i} x={20} dy={i === 0 ? 0 : 21}>
                      {t}
                    </tspan>
                  ))}
                </text>
                {row.cells.map((c, ci) => {
                  const cx = x0 + cw * (ci + 0.5);
                  const cy = y0 + (rowH - (opts?.labelGap ?? 26)) / 2 + 4;
                  return (
                    <g key={ci}>
                      <IconCell c={c} cx={cx} cy={cy} frame={frame} pageStart={pageStart} id={`p${index}-r${ri}-c${ci}`} />
                      <Label x={cx} y={y0 + rowH - 14} text={c.label} />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
        <Caption text={title} sub={sub} />
      </AbsoluteFill>
    );
  };
  return P;
};

/** The state columns every stateful icon is shown in. */
const STATE_COLS: Array<{label: string; state: PartState; pointed?: number; glow?: boolean; flipFrom?: PartState}> = [
  {label: 'off', state: 'off'},
  {label: 'pointed', state: 'off', pointed: 1},
  {label: 'on', state: 'on'},
  {label: 'alwaysOn', state: 'alwaysOn'},
  {label: 'on + glow', state: 'alwaysOn', glow: true},
  {label: 'visited', state: 'visited'},
  {label: 'reset', state: 'reset'},
  {label: 'waiting', state: 'waiting'},
  {label: 'limit', state: 'limit'},
  {label: 'fault', state: 'fault'},
  {label: 'flip off→on', state: 'on', flipFrom: 'off'},
];

/** A state page: the STATE_COLS split into groups, each at detail 0 (board) and detail 1 (deck). */
const statePage = (type: IconType, label: string, opts: {zoom: number; groups?: number; props?: Record<string, unknown>; size?: {w: number; h: number}}): React.FC<PageProps> => {
  const groups = opts.groups ?? 2;
  const per = Math.ceil(STATE_COLS.length / groups);
  const rows: GridRow[] = [];
  for (let g = 0; g < groups; g++) {
    const cols = STATE_COLS.slice(g * per, (g + 1) * per);
    for (const [det, ground] of [
      [0, COLOR.board],
      [1, COLOR.deck],
    ] as const) {
      rows.push({
        title: `detail ${det}\n${ground === COLOR.board ? 'on board' : 'on deck'}`,
        ground,
        cells: cols.map((c) => ({
          type,
          label: c.label,
          state: c.state,
          pointed: c.pointed,
          glow: c.glow,
          flipFrom: c.flipFrom,
          detail: det,
          zoom: opts.zoom,
          props: opts.props,
          size: opts.size,
        })),
      });
    }
  }
  return GridPage(`states · ${label}`, `zoom ×${opts.zoom} · still at page start + 30 (breathing at its 0.7 low; flip 2 frames in)`, rows);
};

/* ------------------------------------------------------------------------------------------------
 * Passive and prop pages
 * ---------------------------------------------------------------------------------------------- */

const CHIP = {x: 640, y: 500, w: 260, h: 190};
const EP01_BLOCKS = [
  {key: 'lookout', shape: 'wide', rel: relOf(CHIP, {x: 660, y: 630, w: 72, h: 36}), state: 'alwaysOn', glow: true, pip: 'inside-top-right'},
  {key: 'q', shape: 'square', rel: relOf(CHIP, {x: 816, y: 516, w: 64, h: 64}), state: 'off', badge: 'q'},
];

const chipsetPage = GridPage('chipset · x-ray package and its blocks', 'the package outline never lights; blocks carry state', [
  {
    title: 'detail 0\non board',
    ground: COLOR.board,
    cells: [
      {type: 'chipset', label: 'xray 1 · Ep01 blocks', detail: 0, zoom: 1.15, props: {blocks: EP01_BLOCKS}},
      {type: 'chipset', label: 'xray 0.5', detail: 0, zoom: 1.15, props: {blocks: [], xray: 0.5}},
      {type: 'chipset', label: 'xray 0 · AMD plain', detail: 0, zoom: 1.15, props: {blocks: [], xray: 0}},
      {type: 'chipset', label: 'pointed', detail: 0, zoom: 1.15, pointed: 1, props: {blocks: EP01_BLOCKS}},
    ],
  },
  {
    title: 'detail 1\non deck',
    ground: COLOR.deck,
    cells: [
      {type: 'chipset', label: 'xray 1 · blocks d1', detail: 1, zoom: 1.15, props: {blocks: EP01_BLOCKS, blockDetail: 1}},
      {type: 'chipset', label: 'xray 0.5', detail: 1, zoom: 1.15, props: {blocks: [], xray: 0.5}},
      {type: 'chipset', label: 'xray 0', detail: 1, zoom: 1.15, props: {blocks: [], xray: 0}},
      {type: 'chipset', label: 'clock glyph (S11)', detail: 1, zoom: 1.15, props: {blocks: EP01_BLOCKS, clockGlyphAt: [0.155, 0.255]}},
    ],
  },
]);

const blockLensPage = GridPage('logicBlock · in a Lens (×4.4)', 'the lookout vs the "?": never one shape; detail is their silicon', [
  {
    title: 'Lens\nscale',
    ground: COLOR.deck,
    cells: [
      {type: 'logicBlock', label: 'lookout · alwaysOn + glow', detail: 1, zoom: 4.4, state: 'alwaysOn', glow: true, props: {shape: 'wide', pip: 'inside-top-right'}},
      {type: 'logicBlock', label: '"?" · off · lens badge', detail: 1, zoom: 4.4, state: 'off', size: {w: 64, h: 64}, props: {shape: 'square', badge: 'q', badgeSize: 'lens'}},
      {type: 'logicBlock', label: '"?" · on (preview)', detail: 1, zoom: 4.4, state: 'on', size: {w: 64, h: 64}, props: {shape: 'square'}},
    ],
  },
]);

const connectorsPage = GridPage('board connectors and small parts (passive)', 'base = pin fields, grooves, latches; detail = fine marks', [
  {
    title: 'detail 0\non board',
    ground: COLOR.board,
    cells: [
      {type: 'atx24', label: 'atx24', detail: 0, zoom: 2.4},
      {type: 'fpHeader', label: 'fpHeader', detail: 0, zoom: 3.2},
      {type: 'vrmStandby', label: 'vrmStandby', detail: 0, zoom: 3.6},
      {type: 'rj45', label: 'rj45', detail: 0, zoom: 3.4},
      {type: 'rearIo', label: 'rearIo', detail: 0, zoom: 1.05},
      {type: 'pcieSlot', label: 'pcieSlot', detail: 0, zoom: 0.62},
    ],
  },
  {
    title: 'detail 1\non deck',
    ground: COLOR.deck,
    cells: [
      {type: 'atx24', label: 'atx24', detail: 1, zoom: 2.4},
      {type: 'fpHeader', label: 'fpHeader', detail: 1, zoom: 3.2},
      {type: 'vrmStandby', label: 'vrmStandby', detail: 1, zoom: 3.6},
      {type: 'rj45', label: 'rj45', detail: 1, zoom: 3.4},
      {type: 'rearIo', label: 'rearIo', detail: 1, zoom: 1.05},
      {type: 'pcieSlot', label: 'pcieSlot', detail: 1, zoom: 0.62},
    ],
  },
  {
    title: 'pointed\n(d0)',
    ground: COLOR.board,
    cells: [
      {type: 'atx24', label: 'atx24', detail: 0, zoom: 2.4, pointed: 1},
      {type: 'fpHeader', label: 'fpHeader', detail: 0, zoom: 3.2, pointed: 1},
      {type: 'vrmStandby', label: 'vrmStandby', detail: 0, zoom: 3.6, pointed: 1},
      {type: 'rj45', label: 'rj45', detail: 0, zoom: 3.4, pointed: 1},
      {type: 'rearIo', label: 'rearIo', detail: 0, zoom: 1.05, pointed: 1},
      {type: 'pcieSlot', label: 'pcieSlot', detail: 0, zoom: 0.62, pointed: 1},
    ],
  },
]);

const PSU_CTX = (seated: number) => [{type: 'iecPlug' as IconType, dx: -54, dy: 18, props: {seated}}];
const powerPathPage = GridPage('power path · PSU rocker, plug, cord, socket', 'rocker I/O are base (S10); the pulled plug shows its sockets and the inlet pins', [
  {
    title: 'PSU\nd0',
    ground: COLOR.deck,
    cells: [
      {type: 'psu', label: 'rocker I · plug seated', detail: 0, zoom: 0.9, props: {rocker: 'I'}, context: PSU_CTX(1)},
      {type: 'psu', label: 'rocker O · plug seated', detail: 0, zoom: 0.9, props: {rocker: 'O'}, context: PSU_CTX(1)},
      {type: 'psu', label: 'rocker I · plug pulled', detail: 0, zoom: 0.9, props: {rocker: 'I'}, context: PSU_CTX(0)},
    ],
  },
  {
    title: 'PSU\nd1',
    ground: COLOR.deck,
    cells: [
      {type: 'psu', label: 'rocker flipping I→O (f+1)', detail: 1, zoom: 0.9, dyn: (s) => ({rocker: {from: 'I', to: 'O', at: s + 29}}), context: PSU_CTX(1)},
      {type: 'psu', label: 'plug half out', detail: 1, zoom: 0.9, props: {rocker: 'I'}, context: PSU_CTX(0.5)},
      {type: 'psu', label: 'pointed', detail: 1, zoom: 0.9, pointed: 1, props: {rocker: 'I'}, context: PSU_CTX(1)},
    ],
  },
  {
    title: 'plug\ncord\nsocket',
    ground: COLOR.deck,
    cells: [
      {type: 'iecPlug', label: 'plug seated 1', detail: 1, zoom: 3},
      {type: 'iecPlug', label: 'plug 0 (pulled)', detail: 1, zoom: 3, props: {seated: 0}},
      {type: 'cord', label: 'cord', detail: 1, zoom: 2.4, size: {w: 60, h: 30}, props: {points: [[-30, -6], [0, -6], [0, 10], [30, 10]]}},
      {type: 'wallSocket', label: 'socket plugged', detail: 1, zoom: 2.4},
      {type: 'wallSocket', label: 'socket bare (plugged false)', detail: 1, zoom: 2.4, props: {plugged: false}},
    ],
  },
]);

const frontPage = GridPage('front panel · power button · LED', 'press 0 → 1: the cap sinks 10 %, symbol and rim dim 20 %, a side ring appears', [
  {
    title: 'button',
    ground: COLOR.deck,
    cells: [
      {type: 'powerButton', label: 'press 0', detail: 1, zoom: 2.6},
      {type: 'powerButton', label: 'press 0.5', detail: 1, zoom: 2.6, props: {press: 0.5}},
      {type: 'powerButton', label: 'press 1', detail: 1, zoom: 2.6, props: {press: 1}},
      {type: 'powerButton', label: 'pointed', detail: 1, zoom: 2.6, pointed: 1},
      {type: 'powerButton', label: 'glow', detail: 1, zoom: 2.6, glow: true},
    ],
  },
  {
    title: 'front\npanel',
    ground: COLOR.deck,
    cells: [
      {type: 'frontPanel', label: 'panel · d0', detail: 0, zoom: 1.6},
      {type: 'frontPanel', label: 'panel · d1', detail: 1, zoom: 1.6},
      {type: 'led', label: 'LED off', detail: 1, zoom: 6, state: 'off'},
      {type: 'led', label: 'LED on', detail: 1, zoom: 6, state: 'on'},
      {type: 'led', label: 'LED on + glow', detail: 1, zoom: 6, state: 'on', glow: true},
    ],
  },
]);

const boardsPage = GridPage('boards, case, laptop board, scene props', "the case is the machine's ground: flat, no detail", [
  {
    title: 'boards',
    ground: COLOR.field,
    cells: [
      {type: 'board', label: 'board · d0', detail: 0, zoom: 0.4},
      {type: 'board', label: 'board · d1', detail: 1, zoom: 0.4},
      {type: 'case', label: 'case', detail: 0, zoom: 0.3},
      {type: 'laptopBoard', label: 'laptopBoard · d0', detail: 0, zoom: 0.48},
      {type: 'laptopBoard', label: 'laptopBoard · d1', detail: 1, zoom: 0.48},
    ],
  },
  {
    title: 'signIn\ncard',
    ground: COLOR.field,
    cells: [
      {type: 'signInCard', label: 'draw 0.35', detail: 1, zoom: 1.2, props: {draw: 0.35, content: 0}},
      {type: 'signInCard', label: 'draw 0.7', detail: 1, zoom: 1.2, props: {draw: 0.7, content: 0}},
      {type: 'signInCard', label: 'draw 1 · content 0.5', detail: 1, zoom: 1.2, props: {draw: 1, content: 0.5}},
      {type: 'signInCard', label: 'complete', detail: 1, zoom: 1.2, props: {draw: 1, content: 1}},
    ],
  },
]);

const LOOKOUT = (dx: number, dy: number) => ({type: 'logicBlock' as IconType, dx, dy, size: {w: 72, h: 36}, above: true, state: 'alwaysOn' as PartState, glow: true, props: {shape: 'wide', pip: 'inside-top-right'}});
const QBLOCK = (dx: number, dy: number) => ({type: 'logicBlock' as IconType, dx, dy, size: {w: 64, h: 64}, above: true, state: 'off' as PartState, props: {shape: 'square', badge: 'q'}});

const stopsPage = GridPage('S09 stops · end states (blocks at scale 1 in their slots)', 'AMD: both blocks in the I/O die · laptop: "?" in the SoC, lookout in the EC, battery', [
  {
    title: 'AMD\nd0 / d1',
    ground: COLOR.board,
    cells: [
      {type: 'amdPackage', label: 'AMD + blocks · d0', detail: 0, zoom: 1.1, context: [LOOKOUT(130, 150), QBLOCK(134, 76)]},
      {type: 'amdPackage', label: 'AMD + blocks · d1', detail: 1, zoom: 1.1, context: [LOOKOUT(130, 150), QBLOCK(134, 76)]},
      {type: 'chipset', label: 'AMD board chipset (xray 0)', detail: 1, zoom: 1.1, props: {blocks: [], xray: 0}},
    ],
  },
  {
    title: 'laptop\nd1',
    ground: COLOR.deck,
    cells: [
      {
        type: 'laptopBoard',
        label: 'laptop board + SoC ("?") + EC (lookout)',
        detail: 1,
        zoom: 1.05,
        context: [
          {type: 'socPackage', dx: 55, dy: 35, above: true, state: 'off'},
          {type: 'ecChip', dx: 348, dy: 84, above: true},
          QBLOCK(123, 78),
          LOOKOUT(364, 102),
        ],
      },
      {type: 'battery', label: 'battery', detail: 1, zoom: 1.05, state: 'off'},
    ],
  },
  {
    title: 'ecChip\nsocPackage',
    ground: COLOR.board,
    cells: [
      {type: 'ecChip', label: 'ecChip · d0', detail: 0, zoom: 1.8},
      {type: 'ecChip', label: 'ecChip · d1', detail: 1, zoom: 1.8},
      {type: 'ecChip', label: 'ecChip · pointed', detail: 0, zoom: 1.8, pointed: 1},
      {type: 'ecChip', label: 'ecChip + lookout', detail: 1, zoom: 1.8, context: [LOOKOUT(16, 18)]},
      {type: 'socPackage', label: 'SoC + "?"', detail: 1, zoom: 1.2, state: 'off', context: [QBLOCK(68, 43)]},
    ],
  },
]);

/** Hero close-ups (detail 1, large): the craft check for the parts the camera dwells on. */
const heroPageA = GridPage('hero close-ups · CPU, chipset with blocks, power button', 'detail 1 · zooms ×2.0–4.2 (Lens and plate scales)', [
  {
    title: 'hero',
    ground: COLOR.deck,
    cells: [
      {type: 'cpuLga', label: 'cpuLga ×2.1', detail: 1, zoom: 2.1, state: 'off'},
      {type: 'chipset', label: 'chipset ×2.1 (blocks d1)', detail: 1, zoom: 2.1, props: {blocks: EP01_BLOCKS, blockDetail: 1}},
      {type: 'powerButton', label: 'powerButton ×4.2', detail: 1, zoom: 4.2},
    ],
  },
]);
const heroPageB = GridPage('hero close-ups · power supply with plug, socket, monitor', 'detail 1 · zooms ×1.6–3', [
  {
    title: 'psu',
    ground: COLOR.deck,
    cells: [{type: 'psu', label: 'psu ×2.2 with the seated plug', detail: 1, zoom: 2.2, props: {rocker: 'I'}, context: PSU_CTX(1)}],
  },
  {
    title: 'room',
    ground: COLOR.field,
    cells: [
      {type: 'wallSocket', label: 'wallSocket ×3.4', detail: 1, zoom: 3.4},
      {type: 'iecPlug', label: 'iecPlug pulled ×3.4', detail: 1, zoom: 3.4, props: {seated: 0}},
      {type: 'monitor', label: 'monitor ×1.5', detail: 1, zoom: 1.5, state: 'off'},
      {type: 'frontPanel', label: 'frontPanel ×2', detail: 1, zoom: 2, context: [{type: 'powerButton', dx: 34, dy: 30, above: true}, {type: 'led', dx: 115, dy: 13, above: true, state: 'off'}]},
    ],
  },
]);

const heroPageC = GridPage('hero close-ups · board parts at Lens scale', 'detail 1 · M.2, DIMM (horizontal), 24-pin, regulators, flash, LAN, rear I/O', [
  {
    title: 'modules',
    ground: COLOR.board,
    cells: [
      {type: 'm2', label: 'm2 ×3', detail: 1, zoom: 3, state: 'off'},
      {type: 'dimm', label: 'dimm ×2.4 (horizontal)', detail: 1, zoom: 2.4, state: 'off', size: {w: 260, h: 14}},
    ],
  },
  {
    title: 'parts',
    ground: COLOR.board,
    cells: [
      {type: 'atx24', label: 'atx24 ×4', detail: 1, zoom: 4},
      {type: 'vrmStandby', label: 'vrmStandby ×5', detail: 1, zoom: 5},
      {type: 'spiFlash', label: 'spiFlash ×5', detail: 1, zoom: 5, state: 'off'},
      {type: 'lanChip', label: 'lanChip ×5', detail: 1, zoom: 5, state: 'off'},
      {type: 'fpHeader', label: 'fpHeader ×5', detail: 1, zoom: 5},
    ],
  },
  {
    title: 'rear I/O',
    ground: COLOR.board,
    cells: [
      {type: 'rearIo', label: 'rearIo ×1.25 (rotated view: see world pages)', detail: 1, zoom: 1.25},
      {type: 'rj45', label: 'rj45 ×5', detail: 1, zoom: 5},
      {type: 'pcieSlot', label: 'pcieSlot ×1.6', detail: 1, zoom: 1.6},
    ],
  },
]);

/* ------------------------------------------------------------------------------------------------
 * Glyph pages (screen px)
 * ---------------------------------------------------------------------------------------------- */

const GlyphPageA: React.FC<PageProps> = ({frame, pageStart: s}) => {
  const states: PartState[] = ['off', 'on', 'alwaysOn', 'visited', 'reset', 'waiting', 'limit', 'fault'];
  const f = frame;
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.field}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <rect x={30} y={70} width={1860} height={170} rx={12} fill={COLOR.board} />
        <Label x={120} y={110} text="StatePip 14" />
        {states.map((st, i) => (
          <g key={st}>
            <StatePip x={260 + i * 150} y={150} frame={f} state={st} />
            <Label x={260 + i * 150} y={210} text={st} />
          </g>
        ))}
        <StatePip x={1500} y={150} frame={f} state="on" flip={{from: 'off', at: s + 28}} />
        <Label x={1500} y={210} text="flip off→on f+2" />
        <StatePip x={1680} y={150} frame={f} state="off" flip={{from: 'on', at: s + 27}} />
        <Label x={1680} y={210} text="flip on→off f+3" />

        <rect x={30} y={256} width={1860} height={250} rx={12} fill={COLOR.board} />
        <Label x={120} y={300} text="QBadge" />
        <Label x={120} y={322} text="44/56/72" />
        <QBadge x={270} y={375} frame={f} />
        <Label x={270} y={470} text="44 unfilled" />
        <QBadge x={430} y={375} frame={f} fillAt={s + 28} />
        <Label x={430} y={470} text="44 filling f+2" />
        <QBadge x={590} y={375} frame={f} fillAt={s + 26} />
        <Label x={590} y={470} text="filling f+4" />
        <QBadge x={750} y={375} frame={f} fillAt={s} />
        <Label x={750} y={470} text="filled" />
        <QBadge x={920} y={375} frame={f} size="subject" accentAt={[s + 27]} />
        <Label x={920} y={470} text="56 accent f+3" />
        <QBadge x={1110} y={375} frame={f} size="subject" />
        <Label x={1110} y={470} text="56 subject" />
        <QBadge x={1320} y={375} frame={f} size="lens" />
        <Label x={1320} y={470} text="72 in a Lens" />
        <QBadge x={1530} y={375} frame={f} size="lens" fillAt={s} />
        <Label x={1530} y={470} text="72 filled" />
        <QBadge x={1720} y={375} frame={f} fillAt={s - 20} unfillAt={s + 27} />
        <Label x={1720} y={470} text="draining f+3" />

        <rect x={30} y={522} width={1860} height={250} rx={12} fill={COLOR.board} />
        <Label x={120} y={566} text="EyeBadge" />
        <Label x={120} y={588} text="+ ≈ chip" />
        {[
          {x: 360, w: 48, at: s + 26, lbl: 'w48 drawing f+4'},
          {x: 640, w: 72, at: s + 22, lbl: 'w72 drawing f+8'},
          {x: 930, w: 72, at: s, lbl: 'w72 drawn'},
          {x: 1250, w: 96, at: s, lbl: 'w96 (Lens)'},
          {x: 1600, w: 72, at: s - 40, lbl: 'exit f+4', out: s + 26},
        ].map((e, i) => (
          <g key={i}>
            <rect x={e.x - e.w / 0.9 / 2} y={700} width={e.w / 0.9} height={e.w / 0.9 / 2} rx={6} fill={COLOR.activeFill} stroke={COLOR.ink} strokeWidth={4} />
            <EyeBadge x={e.x} y={700} frame={f} drawAt={e.at} blockWidthPx={e.w / 0.9} outAt={e.out} lens={e.w === 96} />
            <Label x={e.x} y={765} text={e.lbl} />
          </g>
        ))}

        <rect x={30} y={788} width={1860} height={270} rx={12} fill={COLOR.board} />
        <Label x={120} y={830} text="≈ · visited" />
        <Label x={120} y={852} text="state badge" />
        <ApproxChip x={260} y={900} frame={f} />
        <Label x={260} y={960} text="≈ chip" />
        <ApproxChip x={380} y={900} frame={f} inAt={s + 28} />
        <Label x={380} y={960} text="≈ in f+2" />
        <rect x={500} y={860} width={200} height={110} rx={8} fill={COLOR.body} />
        <VisitedMark rect={{x: 500, y: 860, w: 200, h: 110}} frame={f} at={s + 26} />
        <Label x={600} y={1010} text="visited drawing f+4" />
        <rect x={780} y={860} width={200} height={110} rx={8} fill={COLOR.body} />
        <VisitedMark rect={{x: 780, y: 860, w: 200, h: 110}} frame={f} at={s} />
        <Label x={880} y={1010} text="visited" />
        {(['waiting', 'limit', 'fault'] as const).map((k, i) => (
          <g key={k}>
            <StateBadge x={1120 + i * 150} y={910} frame={f} kind={k} />
            <Label x={1120 + i * 150} y={970} text={k} />
          </g>
        ))}
        <StateBadge x={1600} y={910} frame={f} kind="limit" inAt={s + 28} />
        <Label x={1600} y={970} text="limit in f+2" />
      </svg>
      <Caption text="glyphs · pips, ? badge, eye, ≈, visited, state badges" sub="screen px, constant at every zoom" />
    </AbsoluteFill>
  );
};

const GlyphPageB: React.FC<PageProps> = ({frame, pageStart: s}) => {
  const f = frame;
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.field}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute'}}>
        <rect x={30} y={70} width={1860} height={250} rx={12} fill={COLOR.board} />
        <Label x={120} y={120} text="Brackets" />
        {[
          {x: 260, lock: s + 32, lbl: 'snap f-2'},
          {x: 520, lock: s + 31, lbl: 'snap f-1'},
          {x: 780, lock: s + 30, lbl: 'lock'},
          {x: 1040, lock: s, lbl: 'held'},
          {x: 1300, lock: s, lbl: 'ink (true colour)', ink: true},
          {x: 1560, lock: s - 20, lbl: 'fade f+3', fade: s + 27},
        ].map((e, i) => (
          <g key={i}>
            <circle cx={e.x + 80} cy={195} r={45} fill={COLOR.bodyLo} stroke={COLOR.structure} strokeWidth={3} />
            <Brackets box={{x: e.x + 35, y: 150, w: 90, h: 90}} frame={f} lockAt={e.lock} fadeAt={e.fade} ink={e.ink} />
            <Label x={e.x + 80} y={300} text={e.lbl} />
          </g>
        ))}

        <rect x={30} y={336} width={1860} height={210} rx={12} fill={COLOR.board} />
        <Label x={120} y={380} text="Ripple" />
        <Label x={120} y={402} text="EndTick" />
        {[0, 2, 4, 6, 8].map((k, i) => (
          <g key={k}>
            <rect x={260 + i * 150 - 12} y={430} width={24} height={24} rx={5} fill={COLOR.info} />
            <Ripple x={260 + i * 150} y={442} frame={f} at={s + 30 - k} />
            <Label x={260 + i * 150} y={525} text={`ripple f+${k}`} />
          </g>
        ))}
        {[
          {x: 1080, ang: 90, at: s + 28, lbl: 'tick drawing'},
          {x: 1240, ang: 90, at: s, lbl: 'tick ↓ wire'},
          {x: 1400, ang: 0, at: s, lbl: 'tick → wire'},
        ].map((e, i) => (
          <g key={i}>
            <path d={e.ang === 90 ? `M${e.x} 400V442` : `M${e.x - 42} 442H${e.x}`} stroke={COLOR.ink} strokeWidth={4} />
            <EndTick x={e.x} y={442} frame={f} at={e.at} angle={e.ang} />
            <Label x={e.x} y={525} text={e.lbl} />
          </g>
        ))}
        <ScaleChip x={1640} y={442} frame={f} text="×4" />
        <Label x={1640} y={525} text="scale chip" />
        <ScaleChip x={1790} y={442} frame={f} text="×8" inAt={s + 28} />
        <Label x={1790} y={525} text="in f+2" />

        <rect x={30} y={562} width={1860} height={230} rx={12} fill={COLOR.board} />
        <Label x={120} y={606} text="PowerSymbol" />
        <Label x={120} y={628} text="Restart" />
        {[0.15, 0.4, 0.7, 1].map((d, i) => (
          <g key={i}>
            <PowerSymbol x={260 + i * 120} y={680} size={56} stroke={3} color={COLOR.ink} draw={d} />
            <Label x={260 + i * 120} y={770} text={`draw ${d}`} />
          </g>
        ))}
        <PowerSymbol x={760} y={680} size={32} stroke={3} color={COLOR.structure} />
        <Label x={760} y={770} text="32 structure" />
        <PowerSymbol x={880} y={680} size={96} stroke={4} color={COLOR.ink} />
        <Label x={880} y={770} text="96" />
        {[0.3, 0.7, 1].map((d, i) => (
          <g key={`r${i}`}>
            <RestartGlyph x={1040 + i * 120} y={680} size={56} draw={d} />
            <Label x={1040 + i * 120} y={770} text={`restart ${d}`} />
          </g>
        ))}
        <RestartGlyph x={1400} y={680} size={32} />
        <Label x={1400} y={770} text="32" />
        <NetJackGlyph x={1560} y={680} frame={f} />
        <Label x={1560} y={770} text="net jack" />
        <ClockGlyph x={1700} y={680} frame={f} pointed={1} />
        <Label x={1700} y={770} text="clock · pointed" />
        <NetJackGlyph x={1830} y={680} frame={f} inAt={s + 27} />
        <Label x={1830} y={770} text="pop f+3" />

        <rect x={30} y={808} width={1860} height={250} rx={12} fill={COLOR.board} />
        <Label x={120} y={852} text="CommandChip" />
        <CommandChip x={420} y={920} frame={f} text="Restart" glyph="restart" land={s + 33} />
        <Label x={420} y={1010} text="landing (f-3)" />
        <CommandChip x={830} y={920} frame={f} text="Restart" glyph="restart" land={s} />
        <Label x={830} y={1010} text="Restart" />
        <CommandChip x={1260} y={920} frame={f} text="Shut down" glyph="power" land={s} />
        <Label x={1260} y={1010} text="Shut down" />
        <CommandChip x={1650} y={920} frame={f} text="Shut down" glyph="power" land={s - 20} exitAt={s + 27} />
        <Label x={1650} y={1010} text="exit f+3" />
      </svg>
      <Caption text="glyphs · brackets, ripple, end tick, scale chip, symbols, wake sources, command chip" sub="screen px" />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------------------------------------
 * Knockout (fillsOnly), ports, topic placeholders
 * ---------------------------------------------------------------------------------------------- */

const KnockoutPage: React.FC<PageProps> = ({frame}) => {
  const cam = SHOTS.open;
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.field}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 960, height: 1080, overflow: 'hidden'}}>
        <WorldView cam={cam} frame={frame} idPrefix="ko-full" />
      </div>
      <div style={{position: 'absolute', left: 960, top: 0, width: 960, height: 1080, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -960, top: 0, width: 1920, height: 1080}}>
          <WorldView cam={cam} frame={frame} idPrefix="ko-fills" fillsOnly />
        </div>
      </div>
      <div style={{position: 'absolute', left: 958, top: 0, width: 4, height: 1080, backgroundColor: COLOR.info}} />
      <Caption text="knockout · left: full · right: fillsOnly (sides + top-face fills)" sub="the label layer redraws this under text" />
    </AbsoluteFill>
  );
};

const portsPage = (): React.FC<PageProps> => {
  const items: Array<{type: IconType; zoom: number; props?: Record<string, unknown>; size?: {w: number; h: number}}> = [
    {type: 'cpuLga', zoom: 0.62},
    {type: 'chipset', zoom: 0.75, props: {blocks: EP01_BLOCKS}},
    {type: 'psu', zoom: 0.4},
    {type: 'powerButton', zoom: 1.8},
    {type: 'iecPlug', zoom: 3},
    {type: 'frontPanel', zoom: 1.1},
    {type: 'monitor', zoom: 0.5},
    {type: 'atx24', zoom: 1.2},
    {type: 'fpHeader', zoom: 2.6},
    {type: 'm2', zoom: 0.55},
    {type: 'amdPackage', zoom: 0.62},
    {type: 'socPackage', zoom: 1},
    {type: 'ecChip', zoom: 1.4},
    {type: 'rearIo', zoom: 0.62},
    {type: 'laptopBoard', zoom: 0.26},
    {type: 'logicBlock', zoom: 2},
  ];
  const rows: GridRow[] = [];
  for (let i = 0; i < items.length; i += 8) {
    rows.push({
      title: i === 0 ? 'ports\n(info ×)' : '',
      ground: COLOR.board,
      cells: items.slice(i, i + 8).map((it) => ({type: it.type, label: it.type, detail: 1, zoom: it.zoom, props: it.props, size: it.size, ports: true})),
    });
    rows.push({
      title: i === 0 ? 'fillsOnly' : '',
      ground: COLOR.deck,
      cells: items.slice(i, i + 8).map((it) => ({type: it.type, label: `${it.type} · fills`, detail: 1, zoom: it.zoom, props: it.props, size: it.size, fillsOnly: true})),
    });
  }
  return GridPage('ports and fillsOnly', 'every named anchor as a 6 px info cross; fills-only copies below', rows);
};

const topicsPage = (): React.FC<PageProps> => {
  const topics = ICON_TYPES.filter((t) => isPlaceholder(t));
  const rows: GridRow[] = [];
  for (let i = 0; i < topics.length; i += 8) {
    rows.push({
      title: i === 0 ? 'planned\ntopics' : '',
      ground: COLOR.board,
      cells: topics.slice(i, i + 8).map((t) => {
        const sz = getIcon(t).size;
        const zoom = Math.min(170 / sz.w, 120 / sz.h, 2);
        return {type: t, label: `${t}`, detail: 1, zoom, state: 'off' as PartState};
      }),
    });
  }
  return GridPage('§6 planned-topic icons', 'placeholders until a topic is scripted (ICONS.md §1); same contract, ports and states', rows);
};

/** Round 2: the seeded topic icons (Ep02 Wi-Fi, Ep03 AI) in their two states. */
const seededTopicsPage = (): React.FC<PageProps> => {
  const seeded: IconType[] = ['router', 'antenna', 'phone', 'rfChip', 'gpuPackage', 'hbmStack'];
  const row = (state: PartState, title: string): GridRow => ({
    title,
    ground: COLOR.board,
    cells: seeded.map((t) => {
      const sz = getIcon(t).size;
      const zoom = Math.min(200 / sz.w, 180 / sz.h, 2.4);
      return {type: t, label: `${t} · ${state}`, detail: 1, zoom, state};
    }),
  });
  return GridPage('§6 seeded topic icons (round 2)', 'Ep02 Wi-Fi: router, antenna, phone, rfChip · Ep03 AI: gpuPackage, hbmStack', [row('off', 'off'), row('on', 'on')]);
};

/* ------------------------------------------------------------------------------------------------
 * Page list
 * ---------------------------------------------------------------------------------------------- */

const PAGES: Array<{title: string; C: React.FC<PageProps>}> = [
  {title: 'world open', C: worldPage('open', 'f0 thumbnail rhyme: system-level sizes')},
  {title: 'world power', C: worldPage('power', 'S03: button, header, PSU, plug')},
  {title: 'world chip', C: worldPage('chip', 'S04: chipset and blocks')},
  {title: 'world column', C: worldPage('column', 'S10 band framing')},
  {title: 'world atlas', C: worldPage('atlas', 'S09 whole desktop ×0.92')},
  {title: 'world monitor', C: worldPage('monitor', 'S08 monitor')},
  {title: 'world dive', C: worldPage('dive', 'S12 ×2.0 detail')},
  {title: 'hero A', C: heroPageA},
  {title: 'hero B', C: heroPageB},
  {title: 'hero C', C: heroPageC},
  {title: 'what-if plug', C: worldPage('column', 'S10 left band: plug pulled (seated 0), cord follows', {plug: {seated: 0}, cord: {points: [[304, 836], [306, 852]]}})},
  {title: 'what-if rocker', C: worldPage('column', 'S10 right band: rear switch at O', {psu: {rocker: 'O'}})},
  {title: 'cpuLga', C: statePage('cpuLga', 'cpuLga (LGA1700)', {zoom: 0.62, groups: 2})},
  {title: 'lookout', C: statePage('logicBlock', 'logicBlock wide (lookout)', {zoom: 2.6, groups: 2, props: {shape: 'wide'}})},
  {title: 'q block', C: statePage('logicBlock', 'logicBlock square ("?")', {zoom: 2.2, groups: 2, size: {w: 64, h: 64}, props: {shape: 'square', badge: 'q'}})},
  {title: 'lens blocks', C: blockLensPage},
  {title: 'chipset', C: chipsetPage},
  {title: 'dimm', C: statePage('dimm', 'dimm', {zoom: 0.8, groups: 2})},
  {title: 'm2', C: statePage('m2', 'm2 (M.2 2280)', {zoom: 1.2, groups: 3})},
  {title: 'spiFlash', C: statePage('spiFlash', 'spiFlash (SOIC-8)', {zoom: 2.4, groups: 1})},
  {title: 'lanChip', C: statePage('lanChip', 'lanChip (QFN)', {zoom: 3, groups: 1})},
  {title: 'psu', C: statePage('psu', 'psu', {zoom: 0.62, groups: 3, props: {rocker: 'I'}})},
  {title: 'monitor', C: statePage('monitor', 'monitor', {zoom: 0.5, groups: 2})},
  {title: 'led', C: statePage('led', 'led', {zoom: 5, groups: 1, props: {pip: 'top-right'}})},
  {title: 'connectors', C: connectorsPage},
  {title: 'power path', C: powerPathPage},
  {title: 'front', C: frontPage},
  {title: 'amdPackage', C: statePage('amdPackage', 'amdPackage (AM5)', {zoom: 0.62, groups: 2})},
  {title: 'socPackage', C: statePage('socPackage', 'socPackage', {zoom: 0.95, groups: 2})},
  {title: 'stops', C: stopsPage},
  {title: 'battery', C: statePage('battery', 'battery', {zoom: 0.62, groups: 2})},
  {title: 'boards', C: boardsPage},
  {title: 'glyphs A', C: GlyphPageA},
  {title: 'glyphs B', C: GlyphPageB},
  {title: 'knockout', C: KnockoutPage},
  {title: 'ports', C: portsPage()},
  {title: 'seeded topics', C: seededTopicsPage()},
  {title: 'topics', C: topicsPage()},
];

export const ICON_SHEET_PAGES = PAGES.length;
export const ICON_SHEET_FRAMES = PAGES.length * PAGE_FRAMES;
export const ICON_SHEET_INDEX = PAGES.map((p, i) => `${i}: ${p.title} (f${i * PAGE_FRAMES + 30})`);

export const IconSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const page = Math.min(PAGES.length - 1, Math.floor(frame / PAGE_FRAMES));
  const P = PAGES[page];
  return <P.C frame={frame} pageStart={page * PAGE_FRAMES} index={page} />;
};
