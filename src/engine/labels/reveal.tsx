/**
 * Word reveal (round 2; STYLE_BIBLE §10.2): every label's text enters WORD BY WORD in reading order (left to right,
 * line by line), each word fading in and rising LABEL2.wordRise px over LABEL2.wordFrames frames, LABEL2.wordStagger
 * frames apart. No mask ever crosses a word, so no frame shows a half-word ("Smalle / proce", "by power", "Rear
 * switch c" in the round-1 review). Exits stay a whole-group fade.
 */
import React from 'react';
import {LABEL2} from '../tokens';
import {EASE6} from '../core/ease';
import {clamp01, f2} from '../core/math';

/** One word's entrance at `age` frames after the label's text starts (word `index` in reading order). */
export const wordIn = (age: number, index: number): {opacity: number; dy: number} => {
  const t = clamp01((age - index * LABEL2.wordStagger) / LABEL2.wordFrames);
  const e = EASE6.arrive(t);
  return {opacity: e, dy: LABEL2.wordRise * (1 - e)};
};

/** Frames until the last of `words` words is fully in. */
export const revealFrames = (words: number): number => Math.max(0, words - 1) * LABEL2.wordStagger + LABEL2.wordFrames;

/** Text (lines split on "\n") rendered word by word. Put it inside an element with `white-space: pre`. */
export const RevealText: React.FC<{text: string; age: number}> = ({text, age}) => {
  if (age >= revealFrames(text.split(/\s+/).length) + 1) return <>{text}</>;
  let k = 0;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((ln, li) => (
        <React.Fragment key={li}>
          {li ? '\n' : null}
          {ln.split(' ').map((wd, wi) => {
            const r = wordIn(age, k++);
            return (
              <React.Fragment key={wi}>
                {wi ? ' ' : null}
                <span style={{display: 'inline-block', opacity: Math.round(r.opacity * 100) / 100, transform: r.dy > 0.01 ? `translateY(${f2(r.dy)}px)` : undefined}}>{wd}</span>
              </React.Fragment>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};
