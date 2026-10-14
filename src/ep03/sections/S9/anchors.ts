/**
 * S9 word anchors (absolute frames), all derived from the word clock. Nothing here is hard-coded seconds.
 */
import {P, at} from '../../timing';

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
/** Start frames of every word inside the nth match of `phrase` in paragraph n. */
export const wordsOf = (n: number, phrase: string, nth = 1): number[] => {
  const r = at(n, phrase, nth);
  return P(n)
    .words.filter((w) => w.start >= r.start && w.start <= r.end && norm(w.text) !== '')
    .map((w) => w.start);
};

const s = (n: number, p: string, nth = 1) => at(n, p, nth).start;
const e = (n: number, p: string, nth = 1) => at(n, p, nth).end;

export const A = {
  from: P(21).start,
  to: P(22).end,
  // ---- P21
  every: s(21, 'every'),
  tricks: s(21, 'tricks'),
  changes: s(21, 'changes'),
  howLong: s(21, 'how long'),
  takesEnd: e(21, 'takes'),
  howMany: s(21, 'how many'),
  pieces21: s(21, 'pieces'),
  deliverEnd: e(21, 'deliver'),
  none: s(21, 'none'),
  removes: s(21, 'removes'),
  oneAfter: s(21, 'one after another'),
  loop: s(21, 'loop'),
  loopEnd: e(21, 'loop'),
  // ---- P22
  so: s(22, 'so'),
  back: s(22, 'back'),
  question: s(22, 'question'),
  questionEnd: e(22, 'question'),
  /** the spoken question, one start frame per word (10 words) */
  qWords: wordsOf(22, 'why do ai answers arrive one piece at a time'),
  qEnd: e(22, 'time'),
  because: s(22, 'because'),
  /** "Because each piece … depend on the ones before it" */
  aBecause: s(22, 'because'),
  aEach: s(22, 'each'),
  aPiece: s(22, 'piece', 2),
  aReally: s(22, 'really'),
  aDepend: s(22, 'depend'),
  aOnTheOnes: wordsOf(22, 'on the ones before it'),
  itEnd: e(22, 'before it'),
  soThe: s(22, 'so the pieces'),
  pieces22: s(22, 'pieces'),
  made: s(22, 'made'),
  inOrder: s(22, 'in order'),
  orderEnd: e(22, 'order'),
  and: s(22, 'and for a single'),
  single: s(22, 'single'),
  gpu: s(22, 'gpu'),
  gpuEnd: e(22, 'gpu'),
  most: s(22, 'most'),
  wait: s(22, 'wait'),
  between: s(22, 'between'),
  isnt: s(22, "isn't"),
  math: s(22, 'math'),
  mathEnd: e(22, 'math'),
  itsTheTrip: s(22, "it's the trip"),
  trip: s(22, 'trip'),
  tripEnd: e(22, 'trip'),
  our: s(22, 'our question went'),
  went: s(22, 'went'),
  almost: s(22, 'almost'),
  allAtOnce: s(22, 'all at once'),
  onceEnd: e(22, 'once'),
  itsAnswer: s(22, 'and its answer'),
  comesOut: s(22, 'comes out'),
  exactly: s(22, 'exactly'),
  describes: s(22, 'describes'),
  describesEnd: e(22, 'describes'),
  soNext: s(22, 'so next time'),
  trickles: s(22, 'trickles'),
  screen: s(22, 'screen'),
  youreNot: s(22, "you're not just"),
  machine: s(22, 'machine'),
  type: s(22, 'type'),
  youreWatching: s(22, "you're watching"),
  gigabytes: s(22, 'gigabytes'),
  numbers: s(22, 'numbers'),
  cross: s(22, 'cross'),
  bridge: s(22, 'bridge'),
  /** "again and again, piece after piece" (6 words) */
  finale: wordsOf(22, 'again and again piece after piece'),
  lastEnd: e(22, 'piece after piece'),
} as const;
