/**
 * `signInCard` (ICONS.md §4.21): the S07 analogy, not hardware. 240 × 150, flat, passive. Everything `annotation` and
 * dashed 12/8 (analogy), drawn dashed from its first frame: the card outline (3 px, r 12) draws clockwise from the
 * top-left over `draw` 0..1; the content (avatar r 22, one field line 120 × 4, one button 80 × 24) fades with
 * `content`; the ≈ chip sits on its top-left corner. Never placed on the monitor's screen.
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {AtScreen, Shell, basePorts, clamp01, discD, rectD, resolveBase, sw, useIconEnv} from '../primitives';
import {ApproxChip} from '../glyphs/approxChip';
import {dashedReveal, lengthOf} from '../glyphs/common';
import type {IconBaseProps, IconSpec} from '../types';

export interface SignInCardProps extends IconBaseProps {
  /** Outline draw-on 0..1, clockwise from the top-left (default 1). */
  draw?: number;
  /** Content fade 0..1 (default 1). */
  content?: number;
  /** Show the ≈ chip (default true; it pops when the outline is half drawn). */
  chip?: boolean;
}

const CardLines: React.FC<{p: SignInCardProps; zoom: number}> = ({p, zoom}) => {
  const {fillsOnly} = useIconEnv();
  if (fillsOnly) return null;
  const k = Math.min(p.w / 240, p.h / 150);
  const X = (u: number) => p.x + u * (p.w / 240);
  const Y = (v: number) => p.y + v * (p.h / 150);
  const draw = clamp01(p.draw ?? 1);
  const content = clamp01(p.content ?? 1);
  const outline = rectD({x: p.x, y: p.y, w: p.w, h: p.h}, 12 * k);
  const L = lengthOf(outline);
  const dash = STROKE.analogyDash.map((v) => sw(v, zoom)) as unknown as [number, number];
  const w3 = sw(STROKE.analogy, zoom);
  const avatar = discD(X(120), Y(44), 22 * k);
  const button = rectD({x: X(80), y: Y(104), w: 80 * k, h: 24 * k}, 12 * k);
  const La = lengthOf(avatar);
  const Lb = lengthOf(button);
  return (
    <>
      {draw > 0 ? (
        <path d={outline} fill="none" stroke={COLOR.annotation} strokeWidth={w3} strokeDasharray={dashedReveal(L, dash, draw)} strokeLinejoin="round" />
      ) : null}
      {content > 0 ? (
        <g opacity={content < 1 ? content : undefined}>
          <path d={avatar} fill="none" stroke={COLOR.annotation} strokeWidth={w3} strokeDasharray={dashedReveal(La, dash, 1)} />
          {/* head-and-shoulders silhouette inside the avatar (solid, small) */}
          <path d={discD(X(120), Y(38), 7 * k)} fill={COLOR.annotation} opacity={0.85} />
          <path
            d={`M${X(107)} ${Y(58)}A${13 * k} ${11 * k} 0 0 1 ${X(133)} ${Y(58)}Z`}
            fill={COLOR.annotation}
            opacity={0.85}
          />
          <path d={rectD({x: X(60), y: Y(84), w: 120 * k, h: 4 * k}, 2 * k)} fill={COLOR.annotation} />
          <path d={button} fill="none" stroke={COLOR.annotation} strokeWidth={w3} strokeDasharray={dashedReveal(Lb, dash, 1)} />
        </g>
      ) : null}
    </>
  );
};

export const SignInCard: React.FC<SignInCardProps> = (p) => {
  const b = resolveBase(p, true);
  const chipIn = p.chip === false ? 0 : clamp01(((p.draw ?? 1) - 0.4) / 0.2);
  return (
    <Shell b={b}>
      <CardLines p={p} zoom={b.zoom} />
      {chipIn > 0 && !b.fo ? (
        <AtScreen x={b.x + b.s(4)} y={b.y + b.s(2)} zoom={b.zoom}>
          <ApproxChip x={0} y={0} frame={b.frame} opacity={chipIn} />
        </AtScreen>
      ) : null}
    </Shell>
  );
};

export const signInCardSpec: IconSpec<SignInCardProps> = {
  type: 'signInCard',
  component: SignInCard,
  size: {w: 240, h: 150},
  z: 0,
  passive: true,
  ports: (p) => basePorts(p, true),
};
