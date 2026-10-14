/**
 * Frames from word IDs (ENGINE.md §3). Everything comes from public/data/ep01_words.json through the kit's timing
 * module (src/shared/timing.ts): frame = round(ms × 30 / 1000). Absolute frames only.
 */
import {
  SENTENCES,
  WORDS,
  minTagExit,
  wordAt as kitWordAt,
  wordEnd,
  wordStart,
  type SentenceId as KitSentenceId,
} from '../../shared/timing';

export type WordId = `W${number}` | `W${string}`;

/** The shared A4 anchors (the Ep01 kit), re-exported so an episode reads every deadline that is not a word start (f8,
 *  f33, f327, f346, f663…) from one checked table instead of typing frame numbers. */
export {ANCHORS as A4} from '../../shared/timing';
export type SentenceId = KitSentenceId;

const INDEX = new Map<string, number>(WORDS.map((x, i) => [x.id, i]));

const need = (id: string): number => {
  const i = INDEX.get(id);
  if (i === undefined) throw new Error(`[engine] unknown word id "${id}"`);
  return i;
};

/** Start frame of a word, plus an offset. w('W0047') === 472. */
export const w = (id: WordId, offset = 0): number => wordStart(id) + offset;

/** End frame of a word (the kit's wordEnd), plus an offset. */
export const wEnd = (id: WordId, offset = 0): number => wordEnd(id) + offset;

/** The text of a word as recorded (punctuation attached). */
export const wText = (id: WordId): string => WORDS[need(id)].text;

/** The silent span after a word: {from: first silent frame, to: next word's start}. Throws if the gap is < 250 ms. */
export const pauseAfter = (id: WordId): {from: number; to: number} => {
  const i = need(id);
  const a = WORDS[i];
  const b = WORDS[i + 1];
  if (!b) return {from: wordEnd(id) + 1, to: Number.POSITIVE_INFINITY};
  const gap = b.start_ms - a.end_ms;
  if (gap < 250) throw new Error(`[engine] pauseAfter(${id}): only ${gap} ms of silence before ${b.id} (needs >= 250 ms)`);
  return {from: wordEnd(id) + 1, to: wordStart(b.id)};
};

/** Sentence span {start, end} from the kit's SENTENCES. */
export const sentence = (id: SentenceId): {start: number; end: number} => ({start: SENTENCES[id].start, end: SENTENCES[id].end});

/** The sentence a word belongs to (intro sentences S01–S12 only), or undefined. */
export const sentenceOfWord = (id: WordId): SentenceId | undefined => {
  const i = need(id);
  for (const s of Object.values(SENTENCES)) {
    if (i >= need(s.first) && i <= need(s.last)) return s.id;
  }
  return undefined;
};

/** The brand hold rule: max(land + 30 + 9 × words, sentenceEnd + 15). Same as the kit's minTagExit. */
export const hold = (land: number, text: string, sid?: SentenceId): number => minTagExit(land, text.replace(/\n/g, ' '), sid);

/** The word playing at a frame (null in a pause). */
export const wordAt = (frame: number): {id: WordId; text: string} | null => {
  const x = kitWordAt(frame);
  return x ? {id: x.id as WordId, text: x.text} : null;
};

/** Is the voice speaking at this frame (inside a word, or inside a gap shorter than 250 ms between two words)? */
export const speakingAt = (frame: number): boolean => {
  for (const s of Object.values(SENTENCES)) {
    if (frame >= s.start && frame <= s.end) return true;
  }
  return false;
};
