/**
 * Placeholder intro used by src/styles/styleN/Intro.tsx until a builder replaces it.
 * Shows "Style N placeholder", the composition id, the frame, the current beat and the word being spoken.
 */
import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {LAYOUT, resolveTheme, type ThemeLike} from './brand';
import {MONO, SANS} from './fonts';
import {beatAt, sentenceAt, wordAt, FPS} from './timing';
import {KitLayer} from './context';
import {TimeChip} from './components/TimeChip';

export const Placeholder: React.FC<{n: number; id: string; theme?: ThemeLike}> = ({n, id, theme}) => {
  const frame = useCurrentFrame();
  const t = resolveTheme(theme);
  const beat = beatAt(frame);
  const speaking = sentenceAt(frame);
  const w = wordAt(frame);
  return (
    <AbsoluteFill style={{background: t.surface}}>
      <KitLayer>
        <TimeChip label={`Style ${n} placeholder`} inAt={-6} size={44} theme={t} />
      </KitLayer>
      <div
        style={{
          position: 'absolute',
          left: LAYOUT.textSafe.left,
          top: 300,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 96,
          lineHeight: 1.15,
          color: t.ink,
        }}
      >
        {beat.id}
      </div>
      <div style={{position: 'absolute', left: LAYOUT.textSafe.left, top: 430, fontFamily: SANS, fontWeight: 600, fontSize: 44, color: t.ink}}>
        {id} · {speaking ? 'speaking' : 'pause'} · {w ? `“${w.text}”` : '—'}
      </div>
      <div style={{position: 'absolute', left: LAYOUT.textSafe.left, top: 520, fontFamily: MONO, fontWeight: 500, fontSize: 34, color: t.textMuted}}>
        f{String(frame).padStart(4, '0')} · {(frame / FPS).toFixed(2)} s · {beat.id} f{beat.start}–f{beat.end}
      </div>
    </AbsoluteFill>
  );
};
