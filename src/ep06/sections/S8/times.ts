// S8 word clock: every anchor comes from at() / P() (absolute frames). Plan: docs/ep06/plans/S8_plan.md.
import {SECTION} from '../../sections';
import {P, at} from '../../timing';

const S = SECTION('S8');
const w = (n: number, phrase: string, nth = 1) => at(n, phrase, nth).start;

export const T = {
  from: S.from,
  to: S.to,
  /* P18 */
  strange: w(18, 'strange'),
  ssdTends: w(18, 'The SSD tends'),
  destroy1: w(18, 'destroy'),
  resists: w(18, 'resists'),
  destroy2: w(18, 'destroy', 2),
  both: w(18, 'Both come'),
  fact: w(18, 'fact'),
  onSsd: w(18, 'On an SSD'),
  theDrive: w(18, 'the drive'),
  notWindows: w(18, 'not Windows'),
  decides: w(18, 'decides'),
  live: w(18, 'live'),
  /* P19 */
  so: w(19, 'So'),
  askDrive: w(19, 'ask the drive itself'),
  makers: w(19, 'Drive makers'),
  builtIn: w(19, 'built'),
  eraseCmd: w(19, 'erase command'),
  crucial: w(19, "Crucial's"),
  sanitizeFn: w(19, 'sanitize drive function'),
  nist: w(19, "NIST's"),
  dedicated: w(19, 'dedicated sanitize'),
  reachAll: w(19, 'reach all'),
  though: w(19, 'though you are trusting'),
  trusting: w(19, 'trusting'),
  correctly: w(19, 'correctly'),
  /* P20 */
  better: w(20, 'better move'),
  worksBefore: w(20, 'works before'),
  encryption: w(20, 'Encryption'),
  bitlocker: w(20, 'BitLocker'),
  editions: w(20, 'many editions'),
  encrypts: w(20, 'encrypts'),
  key1: w(20, 'key'),
  ifOn: w(20, 'If it was on'),
  saved: w(20, 'saved'),
  everyBlock: w(20, 'every block'),
  leftovers: w(20, 'including leftovers'),
  oldCopies: w(20, 'old copies'),
  shuffled: w(20, 'shuffled'),
  scrambled: w(20, 'scrambled'),
  someone: w(20, 'Someone'),
  pulls: w(20, 'pulls'),
  readsIt: w(20, 'reads it'),
  noise: w(20, 'noise'),
  thatsAlso: w(20, "That's also"),
  destroying: w(20, 'destroying'),
  key2: w(20, 'key', 3),
  underRight: w(20, 'under the right'),
  fastWay: w(20, 'fast way'),
  microsoft: w(20, 'Microsoft'),
  lost: w(20, 'lost'),
  stolen: w(20, 'stolen'),
  decommissioned: w(20, 'decommissioned'),
  devices: w(20, 'devices'),
  manyNewer: w(20, 'Many newer'),
  deviceEnc: w(20, 'device encryption'),
  checking: w(20, 'checking'),
  oneLimit: w(20, 'One limit'),
  oncePc: w(20, 'Once your PC'),
  started: w(20, 'started'),
  windowsReads: w(20, 'Windows reads'),
  normally: w(20, 'normally'),
  wontStop: w(20, "won't stop"),
  recoveryTool: w(20, 'recovery tool'),
  ownPc: w(20, 'own PC'),
} as const;

/* shot cuts (absolute) */
export const CUT = {
  coin: T.ssdTends - 10, // whip A → B (12 f)
  verdict: T.fact + 3, // FlashCut B → C on the chip
  dive: T.so - 8, // ZoomThrough C → D (16 f)
  key: P(20).start - 6, // whip D → E (12 f)
  save: T.ifOn, // FlashCut E → F
  pulled: T.someone - 1, // whip F → G (12 f)
  objects: T.microsoft - 6, // whip G → H (12 f)
  desk: T.manyNewer - 8, // whip H → I (12 f)
} as const;
