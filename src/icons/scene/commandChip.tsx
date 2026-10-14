/**
 * CommandChip (ICONS.md §5.11): a generic command chip (never a captured OS menu). Capsule with a 3 px `ink` outline on
 * `deck`, a 32 px glyph (RestartGlyph or PowerSymbol, 3 px ink) and 40 px Sora 600 text. It lands over 6 frames
 * (`arrive`, 12 px rise) completing on `land`; the glyph draws on over `drawGlyphFrames` as it lands; it exits over 6
 * frames (`exit`) from `exitAt`. SCREEN px, centred on (x, y).
 */
import React from 'react';
import {COLOR, DUR, TYPE} from '../../engine/tokens';
import {SANS} from '../../shared/fonts';
import {fx, lerp, prog, rectD} from '../primitives';
import {PowerSymbol} from '../glyphs/powerSymbol';
import {RestartGlyph} from '../glyphs/restartGlyph';

export interface CommandChipProps {
  x: number;
  y: number;
  frame: number;
  text: 'Restart' | 'Shut down' | string;
  glyph: 'restart' | 'power';
  /** Frame the chip is fully landed (readable). */
  land: number;
  exitAt?: number;
  drawGlyphFrames?: number;
}

/** Sora 600 at 40 px, measured in the render browser (canvas measureText). */
const TEXT_W: Record<string, number> = {Restart: 150.24, 'Shut down': 220.76};
const FONT = 40;
const H = 72;
const PAD_L = 22;
const GLYPH = 32;
const GAP = 14;
const PAD_R = 28;

export const commandChipSize = (text: string) => {
  const tw = TEXT_W[text] ?? text.length * FONT * 0.56;
  return {w: PAD_L + GLYPH + GAP + tw + PAD_R, h: H, textW: tw};
};

export const CommandChip: React.FC<CommandChipProps> = ({x, y, frame, text, glyph, land, exitAt, drawGlyphFrames = DUR.eyeDraw}) => {
  const tin = prog(frame, land - 6, 6, 'arrive');
  const tout = exitAt === undefined ? 0 : prog(frame, exitAt, 6, 'exit');
  const o = tin * (1 - tout);
  if (o <= 0) return null;
  const {w, h, textW} = commandChipSize(text);
  const rise = lerp(12, 0, tin);
  const sc = lerp(1, 0.96, tout);
  const draw = prog(frame, land - 4, drawGlyphFrames, 'arrive');
  const gx = -w / 2 + PAD_L + GLYPH / 2;
  const tx = -w / 2 + PAD_L + GLYPH + GAP;
  return (
    <g transform={`translate(${fx(x)} ${fx(y + rise)}) scale(${fx(sc)})`} opacity={o < 1 ? o : undefined}>
      <path d={rectD({x: -w / 2 + 1.5, y: -h / 2 + 1.5, w: w - 3, h: h - 3}, h / 2)} fill={COLOR.deck} stroke={COLOR.ink} strokeWidth={3} />
      {glyph === 'restart' ? (
        <RestartGlyph x={gx} y={0} size={GLYPH} stroke={3} color={COLOR.ink} draw={draw} />
      ) : (
        <PowerSymbol x={gx} y={0} size={GLYPH} stroke={3} color={COLOR.ink} draw={draw} />
      )}
      <text
        x={tx}
        y={1}
        fill={COLOR.ink}
        fontFamily={SANS}
        fontWeight={TYPE.weight.label}
        fontSize={FONT}
        dominantBaseline="central"
        textLength={textW}
        lengthAdjust="spacingAndGlyphs"
      >
        {text}
      </text>
    </g>
  );
};
