/**
 * `chipset` (ICONS.md §4.4): the PCH package drawn x-ray so its inner blocks show.
 * Base: substrate (body, r 10) with its 2.5D side; the die: closed (bodyHi lid) at xray 0, an x-ray die window
 * (board fill, 2 px detail outline) at xray 1; the child `logicBlock`s. The package outline NEVER lights (passive:
 * only a child block can be on).
 * Detail: the die's I/O pad ring inside the window, SMD capacitors along the bottom edge, the pin-1 dot.
 */
import React from 'react';
import {COLOR, STROKE, type PartState} from '../../engine/tokens';
import {
  AtScreen,
  DetailGroup,
  Detail,
  Lines,
  Outline,
  Raised,
  RimLight,
  Shell,
  Stroke,
  TopFace,
  basePorts,
  clamp01,
  detailOf,
  discD,
  raisedHullPath,
  rectD,
  resolveBase,
  type Rect,
} from '../primitives';
import {ClockGlyph} from '../glyphs/clockGlyph';
import {LogicBlock, blockPorts, type BlockShape} from './logicBlock';
import type {IconBaseProps, IconSpec, Ports, Pt} from '../types';

export interface ChipsetBlock {
  key: string;
  shape: BlockShape;
  /** The block's rect inside the package: fractions (0..1) of the package rect, or, when any value is above 1,
   *  world-px offsets from the package's top-left (both forms are accepted, as the engine's blockRect does). */
  rel: {x: number; y: number; w: number; h: number};
  state: PartState;
  flip?: {from: PartState; at: number};
  badge?: 'q' | null;
  glow?: boolean | number;
  /** Pip dock for this block (the lookout docks 'inside-top-right'). */
  pip?: IconBaseProps['pip'];
  pointed?: number;
  badgeSize?: 'default' | 'subject' | 'lens';
  badgeFillAt?: number;
  badgeUnfillAt?: number;
  badgeAccentAt?: number[];
  /** Round 3: 0..1, the block's plate is out (a peeled socket): the block dims and a dashed outline keeps its place. */
  ghost?: number;
}

export interface ChipsetProps extends IconBaseProps {
  blocks?: ChipsetBlock[];
  /** 0..1, default 1: the die window's opacity (0 = a plain closed package; tweenable). */
  xray?: number;
  /** RTC wake glyph position (relative 0..1), drawn from S11. */
  clockGlyphAt?: Pt | null;
  /** Frame the clock glyph pops in (6 frames). */
  clockInAt?: number;
  /** Detail opacity for the child blocks (default: from each block's on-screen size). */
  blockDetail?: number;
  /** Round 2 (guardrails §4: never reuse the Intel chipset drawing in an AMD lane): 'amd' draws the AMD board's
   *  chipset as its own package: closed, under a finned heatsink lid, no x-ray window, no blocks. */
  variant?: 'pch' | 'amd';
}

/** rel rect for a block given the package and the block's world rect. */
export const relOf = (pkg: Rect, block: Rect) => ({x: (block.x - pkg.x) / pkg.w, y: (block.y - pkg.y) / pkg.h, w: block.w / pkg.w, h: block.h / pkg.h});
/** A block's world rect: `rel` as fractions of the package (all values <= 1) or as world-px offsets from its top-left. */
export const chipsetBlockRect = (pkg: Rect, rel: ChipsetBlock['rel']): Rect => {
  const frac = rel.x <= 1.0001 && rel.y <= 1.0001 && rel.w <= 1.0001 && rel.h <= 1.0001;
  return frac
    ? {x: pkg.x + rel.x * pkg.w, y: pkg.y + rel.y * pkg.h, w: rel.w * pkg.w, h: rel.h * pkg.h}
    : {x: pkg.x + rel.x, y: pkg.y + rel.y, w: rel.w, h: rel.h};
};
const blockRect = chipsetBlockRect;

export const Chipset: React.FC<ChipsetProps> = (p) => {
  const b = resolveBase(p, true);
  const k = Math.min(b.w / 260, b.h / 190);
  const r = Math.min(10, b.w / 4, b.h / 4);
  const d = rectD(b.rect, r);
  const amd = p.variant === 'amd';
  const xray = amd ? 0 : clamp01(p.xray ?? 1);
  const inset = 18 * k;
  const win: Rect = {x: b.x + inset, y: b.y + inset, w: b.w - 2 * inset, h: b.h - 2 * inset};
  const winD = rectD(win, 4 * k);
  const blocks = p.blocks ?? [];

  // die seal ring just inside the window, with corner fiducials (detail)
  const seal: Rect = {x: win.x + 6 * k, y: win.y + 6 * k, w: win.w - 12 * k, h: win.h - 12 * k};
  const fid = 3 * k;
  const fiducials = [
    [seal.x + 7 * k, seal.y + 7 * k],
    [seal.x + seal.w - 7 * k, seal.y + seal.h - 7 * k],
  ]
    .map(([fx0, fy0]) => rectD({x: fx0 - fid / 2, y: fy0 - fid / 2, w: fid, h: fid}, 0.4))
    .join('');
  // SMD capacitors along the bottom margin: clusters of three (vertical 4 × 7)
  let caps = '';
  for (const cx of [0.22, 0.4, 0.6, 0.78]) {
    for (let j = -1; j <= 1; j++) {
      const x = b.x + b.w * cx + j * 8 * k;
      caps += rectD({x: x - 2 * k, y: b.y + b.h - 13 * k, w: 4 * k, h: 7 * k}, 0.6);
    }
  }

  return (
    <Shell b={b}>
      <Raised d={d} hull={raisedHullPath(b.rect, r, b.side)} />
      <TopFace d={d} fill={COLOR.body} />
      {/* the die: closed lid (bodyHi) fading to the x-ray window (board) */}
      {xray < 1 ? (
        <g opacity={1 - xray < 1 ? 1 - xray : undefined}>
          <Raised d={winD} hull={raisedHullPath(win, 4 * k, b.sideK(0.3))} />
          <TopFace d={winD} fill={COLOR.bodyHi} />
        </g>
      ) : null}
      {xray > 0 ? (
        <g opacity={xray < 1 ? xray : undefined}>
          <TopFace d={winD} fill={COLOR.board} />
        </g>
      ) : null}
      <DetailGroup b={b}>
        {xray > 0 ? <Detail d={rectD(seal, 2 * k)} zoom={b.zoom} opacity={0.75 * xray} /> : null}
        {xray > 0 ? <Detail d={fiducials} zoom={b.zoom} fill opacity={xray} /> : null}
        <Detail d={caps} zoom={b.zoom} fill />
        <Detail d={discD(b.x + 9 * k, b.y + 9 * k, 2.6 * k)} zoom={b.zoom} fill />
      </DetailGroup>
      <Lines>
        {xray > 0 ? <Stroke d={winD} zoom={b.zoom} color={COLOR.detail} width={STROKE.detail} opacity={xray} /> : null}
        {xray < 1 ? <Stroke d={winD} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} opacity={1 - xray} /> : null}
      </Lines>
      <RimLight rect={b.rect} radius={r} zoom={b.zoom} />
      {xray < 1 ? <RimLight rect={win} radius={4 * k} zoom={b.zoom} opacity={1 - xray} inset={b.s(2)} /> : null}
      {amd ? (
        <Lines>
          {/* the heatsink's fins: horizontal ridges across the closed lid */}
          {Array.from({length: 7}, (_, i) => {
            const yy = win.y + (win.h * (i + 1)) / 8;
            return <Stroke key={i} d={`M${win.x + 8 * k} ${yy}H${win.x + win.w - 8 * k}`} zoom={b.zoom} color={COLOR.structure} width={STROKE.detail} />;
          })}
        </Lines>
      ) : null}
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} pointed={b.pointed} />
      {/* child blocks */}
      {blocks.map((blk) => {
        const br = blockRect(b.rect, blk.rel);
        const gh = clamp01(blk.ghost ?? 0);
        const el = (
          <LogicBlock
            key={blk.key}
            id={`${b.id}-${blk.key}`}
            {...br}
            zoom={b.zoom}
            frame={b.frame}
            state={blk.state}
            flip={blk.flip}
            shape={blk.shape}
            badge={blk.badge}
            glow={blk.glow}
            pip={blk.pip}
            pointed={blk.pointed}
            side={b.sideK(3 / 8)}
            detail={p.blockDetail ?? detailOf(Math.min(br.w, br.h) * b.zoom)}
            fillsOnly={b.fo}
            badgeSize={blk.badgeSize}
            badgeFillAt={blk.badgeFillAt}
            badgeUnfillAt={blk.badgeUnfillAt}
            badgeAccentAt={blk.badgeAccentAt}
            opacity={1 - 0.78 * gh}
          />
        );
        if (gh <= 0.001 || b.fo) return el;
        return (
          <g key={blk.key}>
            {el}
            <Stroke d={rectD(br, 6)} zoom={b.zoom} color={COLOR.annotation} width={2.5} opacity={0.85 * gh} dash={[10, 7]} />
          </g>
        );
      })}
      {p.clockGlyphAt && !b.fo ? (
        <AtScreen x={b.x + p.clockGlyphAt[0] * b.w} y={b.y + p.clockGlyphAt[1] * b.h} zoom={b.zoom}>
          <ClockGlyph x={0} y={0} frame={b.frame} inAt={p.clockInAt} />
        </AtScreen>
      ) : null}
    </Shell>
  );
};

export const chipsetPorts = (p: ChipsetProps): Ports => {
  const ports: Ports = {...basePorts(p, true), dmiIn: [p.x + p.w / 2, p.y]};
  const rect: Rect = {x: p.x, y: p.y, w: p.w, h: p.h};
  const blocks = p.blocks ?? [];
  for (const blk of blocks) {
    const br = blockRect(rect, blk.rel);
    for (const [name, pt] of Object.entries(blockPorts(br))) ports[`block:${blk.key}.${name}`] = pt;
  }
  const wide = blocks.find((x) => x.shape === 'wide');
  if (wide) {
    const br = blockRect(rect, wide.rel);
    ports.standbyIn = [br.x + br.w * 0.22, p.y + p.h];
    ports.pwrbtnIn = [br.x + br.w * 0.78, p.y + p.h];
  } else {
    ports.standbyIn = [p.x + p.w * 0.2, p.y + p.h];
    ports.pwrbtnIn = [p.x + p.w * 0.35, p.y + p.h];
  }
  return ports;
};

export const chipsetSpec: IconSpec<ChipsetProps> = {
  type: 'chipset',
  component: Chipset,
  size: {w: 260, h: 190},
  z: 8,
  passive: true,
  ports: chipsetPorts,
};
