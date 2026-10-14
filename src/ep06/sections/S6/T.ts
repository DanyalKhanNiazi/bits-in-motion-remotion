// S6 word clock: every beat from at() (absolute frames). P13–P14.
import {at, P} from '../../timing';

const s13 = (p: string, n = 1) => at(13, p, n).start;
const s14 = (p: string, n = 1) => at(14, p, n).start;

export const T = {
  from: P(13).start, // 8404
  to: P(15).start, // 9935
  // P13
  so: s13('So'),
  think: s13('think'),
  note: s13('note'),
  knows: s13('knows'),
  disposable: s13('disposable'),
  prefers: s13('prefers'),
  clear: s13('clear space'),
  ahead: s13('ahead of time'),
  when: s13('When it finds'),
  convenient: s13('convenient'),
  housekeeping: s13('housekeeping'),
  erases: s13('erases them'),
  once: s13('And once that happens'),
  unlisted: s13('unlisted'),
  gone: s13('gone'),
  nothing: s13('nothing'),
  find: s13('find'),
  // P14
  howFast: s14('How fast'),
  fast: s14('fast'),
  completely: s14('completely'),
  depends: s14('that depends'),
  drive1: s14('drive'), // "depends on the drive"
  study: s14('study'),
  y2011: s14('2011'),
  carnegie: s14('Carnegie'),
  sixteen: s14('16'),
  ssds: s14('SSDs'),
  trimOff: s14('trim off'),
  nearlyAll: s14('nearly all'),
  recovered: s14('recovered'),
  trimOn: s14('trim on'),
  on: at(14, 'trim on').end - 8,
  atMost: s14('at most'),
  survived: s14('survived'),
  depending: s14('depending'),
  chip: s14('chip'),
  runsDrive: s14('runs the drive'),
  drivesChanged: s14('Drives have changed'),
  soTreat: s14('so treat'),
  snapshot: s14('snapshot'),
  rule: s14('rule'),
  andTrim: s14('And trim'),
  trim2: s14("trim doesn't"),
  who: s14('who made'),
  made: s14('made the chip'),
  someSetups: s14('Some setups'),
  certain: s14('certain'),
  never: s14('never'),
  passItOn: s14('pass it on'),
};
/** inclusive render range of the section incl. 30 f handles */
export const RANGE = {from: T.from - 30, to: T.to + 30};
