/**
 * S1 word anchors (absolute frames), all from the locked word clock. Nothing here is a hard-coded second.
 * Two transcript tokens are merged by an em dash ("blink—under", "seconds—over"); they are looked up as one word.
 */
import {at, P} from '../../timing';

const s = (p: number, phrase: string, nth = 1) => at(p, phrase, nth).start;
const e = (p: number, phrase: string, nth = 1) => at(p, phrase, nth).end;

export const A = {
  // P01
  in: s(1, 'In'),
  nvidia: s(1, "NVIDIA's"),
  tests: s(1, 'tests'),
  small: s(1, 'small'),
  model: s(1, 'model'),
  single: s(1, 'single'),
  gpu: s(1, 'GPU'),
  read: s(1, 'read'),
  prompt: s(1, 'prompt'),
  n750: s(1, '750'),
  wordsEnd: e(1, 'long'),
  less: s(1, 'less'),
  blink: s(1, 'blinkunder'),
  three: s(1, 'three'),
  hundredths: s(1, 'hundredths'),
  second: s(1, 'second'),
  secondEnd: e(1, 'second'),
  then: s(1, 'Then'),
  wrote: s(1, 'wrote'),
  length: s(1, 'length'),
  that: s(1, 'That'),
  six: s(1, 'six'),
  half: s(1, 'half'),
  over: s(1, 'secondsover'),
  two: s(1, 'two'),
  hundred: s(1, 'hundred'),
  longer: s(1, 'longer'),
  longerEnd: e(1, 'longer'),
  when: s(1, 'When'),
  trickles: s(1, 'trickles'),
  isnt: s(1, "isn't"),
  typing: s(1, 'typing'),
  effectEnd: e(1, 'effect'),
  each: s(1, 'Each'),
  piece: s(1, 'piece'),
  depends: s(1, 'depends'),
  before: s(1, 'before'),
  itEnd: e(1, 'before it'),
  write: s(1, 'write'),
  eachPiece: s(1, 'each piece', 2),
  thatModel: s(1, 'that model'),
  hauls: s(1, 'hauls'),
  almost: s(1, 'almost'),
  sixteen: s(1, '16'),
  gigabytes: s(1, 'gigabytes'),
  numbers: s(1, 'numbers'),
  where: s(1, 'where'),
  math: s(1, 'math'),
  happens: s(1, 'happens'),
  happensEnd: e(1, 'happens'),
  almost2: s(1, 'almost', 2),
  sixteen2: s(1, '16', 2),
  gigabytes2: s(1, 'gigabytes', 2),
  for: s(1, 'For'),
  one: s(1, 'one piece'),
  pieceBang: s(1, 'piece', 3),
  pieceBangEnd: e(1, 'piece', 3),
  // P02
  lets: s(2, "Let's"),
  follow: s(2, 'follow'),
  oneQuestion: s(2, 'one question'),
  question: s(2, 'question'),
  all: e(2, 'all'),
  q: [s(2, 'Why'), s(2, 'do'), s(2, 'AI'), s(2, 'answers'), s(2, 'arrive'), s(2, 'one', 2), s(2, 'piece'), s(2, 'at'), s(2, 'a'), s(2, 'time')],
  qEnd: e(2, 'time'),
  and: s(2, 'And'),
  along: s(2, 'along'),
  way: s(2, 'way'),
  experiment: s(2, 'experiment'),
  researchers: s(2, 'researchers'),
  capped: s(2, 'capped'),
  halfP: s(2, 'half'),
  power: s(2, 'power'),
  powerEnd: e(2, 'power'),
  onePart: s(2, 'One part'),
  clearly: s(2, 'clearly'),
  slowed: s(2, 'slowed'),
  down: s(2, 'down'),
  other: s(2, 'the other'),
  barely: s(2, 'barely'),
  noticed: s(2, 'noticed'),
  noticedEnd: e(2, 'noticed'),
  end: P(3).start,
} as const;

/** Transition frames (each derived from a spoken word). */
export const T = {
  /** whip from the test stage to the desk, landing on "read" */
  toDesk: A.read - 11,
  /** the frame itself blinks: closed on the word "blink" */
  blinkClose: A.blink - 6,
  blinkShut: A.blink + 2,
  blinkOpen: A.blink + 12,
  /** whip up to the race, landing on "over" */
  toRace: A.over - 6,
  /** whip down back to the screen, landing on "When" */
  toStream: A.when - 6,
  /** words become tiles */
  tiles: A.typing,
  /** lens dive into the next (ghost) tile; the dive completes on "hauls" */
  dive: A.thatModel - 14,
  /** hard cut (flash) to the monument on the second "Almost" */
  toMonument: A.almost2,
  /** whip up to the question on "Let's" */
  toQuestion: A.lets - 6,
  /** exit: push into the "?" */
  exit: A.end - 16,
} as const;
