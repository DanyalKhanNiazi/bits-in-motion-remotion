// S4 word clock: every beat frame derived from the transcript (P08–P09).
import {at, P} from '../../timing';

const s = (n: number, ph: string, nth?: number) => at(n, ph, nth).start;
const e = (n: number, ph: string, nth?: number) => at(n, ph, nth).end;

export const T = {
  from: P(8).start,
  to: P(10).start,
  // P08
  recovery: s(8, 'recovery tools work'),
  microsoft: s(8, "Microsoft's"),
  recPage: s(8, 'Recovery page'),
  plainly: s(8, 'plainly'),
  theSpace: s(8, 'The space used'),
  deleted: s(8, 'deleted file'),
  marked: s(8, 'marked as free'),
  but: s(8, 'but the file data'),
  fileData: s(8, 'the file data'),
  still: s(8, 'still exist'),
  recoveredEnd: e(8, 'be recovered'),
  aTool: s(8, 'A tool can read'),
  read: s(8, 'read the cards'),
  flagged: s(8, 'flagged as unused'),
  follow: s(8, 'follow their directions'),
  copy: s(8, 'copy the bytes'),
  outEnd: e(8, 'back out'),
  ifACard: s(8, 'If a card'),
  reused: s(8, 'reused'),
  someTools: s(8, 'some tools scan'),
  scan: s(8, 'scan the boxes'),
  themselves: s(8, 'themselves'),
  looking: s(8, 'looking for'),
  header: s(8, 'header'),
  documentEnd: e(8, 'or document'),
  // P09
  p9: P(9).start,
  fail: s(9, 'fail'),
  free1: s(9, 'Free means free'),
  means: s(9, 'means'),
  free2: s(9, 'free', 2),
  freeEnd: e(9, 'free', 2),
  next: s(9, 'The next time'),
  download: s(9, 'download'),
  update: s(9, 'update'),
  temp: s(9, 'temporary file'),
  write: s(9, 'write straight'),
  boxesEnd: e(9, 'those boxes'),
  ms: s(9, 'Microsoft warns'),
  warns: s(9, 'warns'),
  anyUse: s(9, 'any use'),
  create: s(9, 'create files'),
  overwrite: s(9, 'overwrite'),
  anyTime: s(9, 'any time'),
  timeEnd: e(9, 'any time'),
  so: s(9, 'So recovery'),
  race: s(9, 'recovery is a race'),
  isW: s(9, 'is a race'),
  aW: s(9, 'a race'),
  raceW: s(9, 'race'),
  every: s(9, 'every write'),
  loseEnd: e(9, 'lose it'),
};

/** shot cuts */
export const CUT = {
  /** archive opener → stage hero (whip, 12 f) */
  whip1: T.microsoft - 15,
  /** stage plate card → archive (zoom-through, 16 f) */
  zt: T.but - 8,
  /** archive hits → overwrite slot stage (whip, 12 f) */
  whip2: T.boxesEnd + 14,
  /** stage → archive race (whip, 12 f) */
  whip3: T.so - 6,
};
