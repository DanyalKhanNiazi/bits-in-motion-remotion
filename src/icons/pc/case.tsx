/**
 * `case` (ICONS.md §4.2): the tower interior, the ground of the machine. Passive, flat (z 0): `deck` fill, 2 px
 * `deckEdge` outline, r 18. No detail, no rim (it is not raised).
 */
import React from 'react';
import {COLOR, STROKE} from '../../engine/tokens';
import {Outline, Shell, TopFace, basePorts, rectD, resolveBase} from '../primitives';
import type {IconBaseProps, IconSpec} from '../types';

export const CaseTray: React.FC<IconBaseProps> = (p) => {
  const b = resolveBase(p, true);
  const r = Math.min(18, b.w / 4, b.h / 4);
  const d = rectD(b.rect, r);
  return (
    <Shell b={b}>
      <TopFace d={d} fill={COLOR.deck} />
      <Outline d={d} state="off" frame={b.frame} zoom={b.zoom} color={COLOR.deckEdge} width={STROKE.detail} />
    </Shell>
  );
};

export const caseSpec: IconSpec<IconBaseProps> = {
  type: 'case',
  component: CaseTray,
  size: {w: 1130, h: 816},
  z: 0,
  passive: true,
  ports: (p) => basePorts(p, true),
};
