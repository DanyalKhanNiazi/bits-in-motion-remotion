/** S9 word anchors (absolute frames), all from the transcript clock. */
import {SECTION} from '../../sections';
import {at} from '../../timing';

const w = (p: number, s: string, n = 1) => at(p, s, n).start;
const S = SECTION('S9');

export const T = {
  from: S.from,
  to: S.to,
  /* P21 */
  so: w(21, 'So'),
  back: w(21, 'back to the passport'),
  passport: w(21, 'passport photo'),
  ifDeleted: w(21, 'If you deleted'),
  check: w(21, 'check'),
  recycle: w(21, 'recycle bin'),
  bin: w(21, 'bin'),
  backups: w(21, 'backups'),
  first: w(21, 'first'),
  notThere: w(21, "If it's not there"),
  stop: w(21, 'stop using'),
  recover: w(21, 'recover onto'),
  different: w(21, 'different drive'),
  because: w(21, 'because'),
  newWrite: w(21, 'new write'),
  land: w(21, 'land'),
  oldBoxes: w(21, 'old boxes'),
  onSsd: w(21, 'On an SSD'),
  trim: w(21, 'trim'),
  prepared: w(21, 'be prepared'),
  gone1: w(21, 'gone', 1),
  ifWant: w(21, 'If you want'),
  goneGood: w(21, 'gone for good'),
  hardDrive: w(21, 'hard drive'),
  overwrite: w(21, 'overwrite'),
  freeSpace: w(21, 'free space'),
  builtIn: w(21, 'built', 1),
  cipher: w(21, 'cypher'), // the SRT spells it "cypher"; on screen always "cipher"
  command: w(21, 'command'),
  slash: w(21, 'slash'),
  option: w(21, 'option'),
  does: w(21, 'does exactly'),
  exactlyThat: w(21, 'that', 2),
  before: w(21, 'Before you sell'),
  sell: w(21, 'sell'),
  microsoft: w(21, 'Microsoft'),
  reset: w(21, 'reset this PC'),
  clean: w(21, 'clean data'),
  turnedOn: w(21, 'turned on'),
  though: w(21, 'though'),
  isnt: w(21, "isn't built"),
  standards: w(21, 'standards'),
  wipe: w(21, 'wipe'),
  whole: w(21, 'whole SSD'),
  beforeHands: w(21, 'before it leaves'),
  hands: w(21, 'hands'),
  use: w(21, 'use the drive'),
  sanitize: w(21, 'sanitize'),
  tool: w(21, 'tool'),
  keep: w(21, 'keep encryption'),
  encryption: w(21, 'encryption'),
  dayOne: w(21, 'day one'),
  recoveryKey: w(21, 'recovery key'),
  saved: w(21, 'saved'),
  safe: w(21, 'safe'),
  /* P22 */
  del: w(22, 'Delete', 1),
  erase: w(22, 'erase'),
  del2: w(22, 'Delete crosses'),
  crosses: w(22, 'crosses'),
  indexCard: w(22, 'index card'),
  what: w(22, 'What happens'),
  depends: w(22, 'depends'),
  controls: w(22, 'controls'),
  onHard: w(22, 'On a hard drive'),
  nothing: w(22, 'nothing happens'),
  until: w(22, 'until'),
  written: w(22, 'written'),
  onSsd2: w(22, 'On an SSD'),
  decides: w(22, 'the drive decides'),
  schedule: w(22, 'own schedule'),
  ifNeed: w(22, 'If you need'),
  truly: w(22, 'truly gone'),
  dont: w(22, "don't leave"),
  either: w(22, 'either'),
  useCmd: w(22, 'Use a command'),
  cmd: w(22, 'command'),
  everyBox: w(22, 'every box'),
  or: w(22, 'or make sure'),
  boxes2: w(22, 'boxes', 2),
  unreadable: w(22, 'unreadable'),
  start: w(22, 'start'),
};

/** shot boundaries (the frame each transition starts) */
export const CUT = {
  zt1: T.check - 12, // fork → tip 1 (zoom-through at L1)
  wh2: T.notThere - 6, // tip 1 → tip 2
  wh3: T.onSsd - 8, // tip 2 → tip 3
  wh4: T.ifWant - 10, // tip 3 → fork (right road)
  zt4: T.hardDrive - 16, // fork → tip 4
  wh5: T.before - 8, // tip 4 → tip 5 (item 4 fully cleared before this)
  zt5: T.reset - 16, // desk Settings → archive wash
  wh6: T.wipe - 10, // tip 5 → tip 6
  wh7: T.keep - 8, // tip 6 → tip 7
  p22: T.del, // tip 7 → Delete ≠ Erase (flash cut on the word)
  split: T.what, // signature → SplitCompare (compress)
  zt10: T.useCmd - 16, // split → final pull-out
};
