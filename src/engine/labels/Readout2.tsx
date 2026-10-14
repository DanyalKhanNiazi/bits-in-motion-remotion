/**
 * Readouts v2 (STYLE_BIBLE §10.1): only numbers the voice says ("0 instructions"). Mono 64 px numeral + 38 px unit
 * in `textMuted`; the characters type in over 5 frames; a 6-frame exit. Sits on a knockout (LabelLayer).
 */
import React from 'react';
import {COLOR, LABEL2, TYPE} from '../tokens';
import {MONO} from '../../shared/fonts';
import {prog} from '../core/ease';
import type {Pt, SRect} from '../core/types';
import {hold, sentenceOfWord, w, type WordId} from '../timeline/words';
import {monoTextWidth} from './metrics';
import {wordIn} from './reveal';

export interface ReadoutSpec {
  id: string;
  value: string;
  unit: string;
  slot: Pt;
  word: WordId;
  exitAt: number | 'hold';
  land?: number;
}

export const readoutLand = (r: ReadoutSpec): number => r.land ?? w(r.word);
export const readoutExit = (r: ReadoutSpec): number =>
  typeof r.exitAt === 'number' ? r.exitAt : hold(readoutLand(r), `${r.value} ${r.unit}`, sentenceOfWord(r.word));

export const readoutBox = (frame: number, r: ReadoutSpec): SRect | null => {
  const land = readoutLand(r);
  if (frame < land || frame >= readoutExit(r) + LABEL2.exitFrames) return null;
  const wv = monoTextWidth(r.value, TYPE.readout);
  const wu = monoTextWidth(r.unit, TYPE.unit);
  return {x: r.slot[0], y: r.slot[1], w: wv + 14 + wu, h: TYPE.readout * TYPE.lineHeight};
};

export const Readout2: React.FC<{spec: ReadoutSpec; frame: number}> = ({spec, frame}) => {
  const box = readoutBox(frame, spec);
  if (!box) return null;
  const land = readoutLand(spec);
  const exit = readoutExit(spec);
  // round 2: the numeral, then the unit, each as a whole word (typing exposed half-words such as "instr")
  const vIn = wordIn(frame - land, 0);
  const uIn = wordIn(frame - land, 2);
  const shownV = spec.value;
  const shownU = spec.unit;
  const op = 1 - prog(frame, exit, LABEL2.exitFrames, 'exit');
  const wv = monoTextWidth(spec.value, TYPE.readout);
  return (
    <div style={{position: 'absolute', left: box.x, top: box.y, opacity: op, whiteSpace: 'pre'}}>
      <span style={{position: 'absolute', left: 0, top: vIn.dy, opacity: vIn.opacity, fontFamily: MONO, fontWeight: 500, fontSize: TYPE.readout, lineHeight: TYPE.lineHeight, color: COLOR.ink}}>
        {shownV}
      </span>
      <span
        style={{
          position: 'absolute',
          left: wv + 14,
          top: TYPE.readout * TYPE.lineHeight - TYPE.unit * TYPE.lineHeight - 4 + uIn.dy,
          opacity: uIn.opacity,
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: TYPE.unit,
          lineHeight: TYPE.lineHeight,
          color: COLOR.textMuted,
        }}
      >
        {shownU}
      </span>
    </div>
  );
};
