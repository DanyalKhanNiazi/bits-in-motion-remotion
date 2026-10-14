/**
 * S4 word anchors (absolute frames), all from the word clock. Nothing here is hard-coded in seconds.
 */
import {at} from '../../timing';
import {SECTION} from '../../sections';

const S = SECTION('S4');
export const FROM = S.from;
export const TO = S.to;

const s = (p: number, phrase: string, nth = 1) => at(p, phrase, nth).start;
const e = (p: number, phrase: string, nth = 1) => at(p, phrase, nth).end;

export const T = {
  // P08
  now: s(8, 'now'),
  rewind: s(8, 'rewind'),
  hit: s(8, 'hit'),
  enter: s(8, 'enter'),
  enterEnd: e(8, 'enter'),
  reading: s(8, 'reading'),
  skips: s(8, 'skips'),
  oneAtATime: s(8, 'one at a time'),
  loopEnd: e(8, 'one at a time loop'),
  when: s(8, 'when the model writes'),
  five: s(8, '5'),
  picked: s(8, 'picked'),
  four: s(8, '4'),
  fourEnd: e(8, '4'),
  yourPrompt: s(8, 'your prompt'),
  noSuchWait: s(8, 'no such wait'),
  already: s(8, 'already'),
  thereEnd: e(8, 'already there'),
  so8: s(8, 'so'),
  read: s(8, 'read'),
  sideBySide: s(8, 'side by side'),
  singleRun: s(8, 'single run'),
  orChunk: s(8, 'or chunk'),
  chunk1: s(8, 'chunk'),
  chunk2: s(8, 'chunk', 2),
  prompt2: s(8, 'prompt', 2),
  veryLong: s(8, 'very long'),
  longEnd: e(8, 'very long'),
  sameRun: s(8, 'same run'),
  picks: s(8, 'picks'),
  firstPiece: s(8, 'first piece'),
  answer8End: e(8, 'first piece of the answer'),
  writing8: s(8, 'writing'),
  tokenPerRun: s(8, 'token per run'),
  inOrder: s(8, 'in order'),
  orderEnd: e(8, 'in order'),
  // P09
  so9: s(9, 'so'),
  order9: s(9, 'order'),
  manyRuns: s(9, 'many runs'),
  runsEnd: e(9, 'many runs'),
  butWhy: s(9, 'but why'),
  whyCard: s(9, 'why is each'),
  slowQEnd: e(9, 'so slow'),
  sameTest: s(9, 'in that same test'),
  test: s(9, 'test'),
  reading9: s(9, 'reading'),
  thousand1: s(9, 'thousand'),
  took: s(9, 'took'),
  writingFour: s(9, 'writing four tokens'),
  four9: s(9, 'four'),
  answer9: s(9, 'answer'),
  answer9End: e(9, 'answer'),
  reading9b: s(9, 'reading', 2),
  thousand2: s(9, 'thousand', 2),
  times1: s(9, 'times'),
  writingOne: s(9, 'writing one token'),
  fourTimes: s(9, 'four times'),
  wait9: s(9, 'wait'),
  waitEnd: e(9, 'wait'),
  soVerdict: s(9, 'so the math'),
  mathVerdict: s(9, 'math', 2),
  slowPart: s(9, 'slow part'),
  slowPartEnd: e(9, 'slow part'),
};

/* Shot boundaries (transitions), derived from the anchors. */
export const X = {
  /** tape-stop: the forward stream slows to a halt on "rewind" */
  stopFrom: T.rewind - 12,
  /** the kit Rewind runs from "rewind" until "hit" (lands at 00:00) */
  rwAt: T.rewind,
  rwDur: T.hit - T.rewind,
  /** Enter is pressed on "enter"; the dive into the model follows */
  press: T.enter + 1,
  diveAt: T.enter + 5,
  diveDur: 16,
  /** zoom through the LOOP ring into the writing rail */
  ringAt: T.when - 6,
  ringDur: 16,
  /** whip from the rail up to the prompt */
  whip1: T.yourPrompt - 12,
  /** whip into the race */
  whip2: T.test - 6,
  /** whip into the blocks */
  whip3: T.answer9End + 3,
  /** exit push (last 20 frames) */
  exitAt: TO - 20,
};

export const QUESTION = ['Why', ' do', ' AI', ' answers', ' arrive', ' one', ' piece', ' at', ' a', ' time', '?'] as const;
/** the film's answer text (the same words S3 streams), one token per word */
export const ANSWER =
  'Because the model writes one token at a time. Each new token depends on every token before it, so the model has to run once for every single piece, in order, in a loop.';
