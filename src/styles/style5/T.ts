/**
 * Style 5 (Live Panels): every frame constant of the intro, in absolute frames (f0–f1889).
 *
 * Rule: frame = round(ms x 30 / 1000) from the word JSON (kit wordStart / wordEnd / ANCHORS). No cumulative
 * durations. Sound-cue frames are read from cues.json, so the cue list and the visuals cannot drift; each cue
 * frame is checked against the kit's anchor at module load (console "[kit] style5 …" warning on a mismatch).
 */
import cuesFile from './cues.json';
import {ANCHORS, SENTENCES, minTagExit, wordEnd, wordStart} from '../../shared/timing';
import {kitWarn} from '../../shared/motion';

type Cue = {cue: string; frame?: number; start?: number; end?: number; note?: string};
const CUES: Cue[] = (cuesFile as {cues: Cue[]}).cues;
const cueAt = (name: string, nth = 0): number => {
  const list = CUES.filter((c) => c.cue === name && c.frame !== undefined);
  const c = list[nth];
  if (!c || c.frame === undefined) throw new Error(`style5 cues.json: no "${name}" cue #${nth}`);
  return c.frame;
};
const span = (name: string): {start: number; end: number} => {
  const c = CUES.find((x) => x.cue === name && x.start !== undefined);
  if (!c || c.start === undefined || c.end === undefined) throw new Error(`style5 cues.json: no "${name}" span`);
  return {start: c.start, end: c.end};
};

/* ---------------------------------------------------------------- cue-driven anchors */
export const PRESS0 = cueAt('button', 0); // f0  "Press"
export const PRESS1 = cueAt('button', 1); // f1837 "press."
export const FF_LAND = cueAt('land', 0); // f59 "and"
export const LENS1_OPEN = cueAt('lens_open', 0); // f197
export const S04_LAND = cueAt('land', 1); // f498 "small"
export const LENS2_OPEN = cueAt('lens_open', 1); // f608
export const CHAIN = [cueAt('land', 2), cueAt('land', 3), cueAt('land', 4), cueAt('land', 5), cueAt('land', 6)] as const; // 748 781 808 832 860
export const STANDBY_SPAN = span('standby'); // 1475–1817
export const LOCK = cueAt('lock', 0); // f1798 "like"

const check = (name: string, got: number, want: number) => {
  if (got !== want) kitWarn(`style5 cue ${name}: cues.json has f${got}, the anchor is f${want}`);
};
check('button#0', PRESS0, ANCHORS.press);
check('button#1', PRESS1, ANCHORS.realPress);
check('land ff', FF_LAND, ANCHORS.ffBitLand);
check('land s04', S04_LAND, ANCHORS.s04Land);
check('chain1', CHAIN[0], ANCHORS.chain1);
check('chain2', CHAIN[1], ANCHORS.chain2);
check('chain3', CHAIN[2], ANCHORS.chain3);
check('chain4', CHAIN[3], ANCHORS.chain4);
check('chain5', CHAIN[4], ANCHORS.chain5);
check('lock', LOCK, ANCHORS.lock);
check('lens_open#0 (leader f188, ring 197→206 "smaller")', LENS1_OPEN, wordStart('W0020') - 9);
check('lens_open#1 (ring 608→617 "That")', LENS2_OPEN, wordStart('W0061') - 9);
check('standby start ("standby")', STANDBY_SPAN.start, wordStart('W0142'));
check('standby end (S11 end)', STANDBY_SPAN.end, SENTENCES.S11.end);

/* ---------------------------------------------------------------- S01 */
export const F = {
  /** fingertip contact on "Press"; cap fully down f1; contact holds to f36 (Bit leaves a closed contact) */
  press0: PRESS0,
  capDown0: PRESS0 + 1,
  capUp0: 36,
  fingerOut0: 40, // lift f40–f48
  /** every rule doubles f2–f8; header "After the press" readable by f7 */
  ruleDouble: 2,
  afterIn: 3,
  /** "power" (W0004) */
  powerButtonTag: wordStart('W0004'),
  ffDepart: ANCHORS.ffBitDepart, // 33
  ffLand: FF_LAND, // 59
  mainProcessor: wordStart('W0008'), // 67
  notFirst: wordStart('W0010'), // 91
  s01Exit: minTagExit(wordStart('W0004'), 'Power button'), // 142

  /* S02 */
  afterShrink: SENTENCES.S02.start, // 137
  zeroInstr: wordStart('W0017'), // 163 "single"
  lens1Leader: LENS1_OPEN - 9, // 188
  lens1Open: LENS1_OPEN, // 197 → 206 "smaller"
  smaller: wordStart('W0020'), // 206
  qOn: ANCHORS.qWakes, // 294 "already"

  /* return f327–f335 */
  ret: ANCHORS.returnStart, // 327
  retEnd: ANCHORS.returnPauseEnd, // 335
  lens1Close: ANCHORS.returnStart + 2, // 329 → 335
  softOffIn: ANCHORS.returnStart + 2, // 329

  /* S03 */
  powerButtonTag2: wordStart('W0033'), // 344 "button"
  inkRoute: wordStart('W0036'), // 365 "doesn't"
  mainPowerOff: wordStart('W0040'), // 410 "power"
  inkRouteOut: wordEnd('W0041') + 1, // 428
  s03TagExit: minTagExit(wordStart('W0033'), 'Power button'), // 442

  /* S04 */
  whenIn: ANCHORS.whenPressedIn, // 441 "sends"
  whenOut: ANCHORS.whenPressedOut, // 519 "that"
  s04Depart: ANCHORS.s04Depart, // 472 "signal"
  s04Land: S04_LAND, // 498 "small"
  alwaysOnTag: S04_LAND, // 498
  alwaysOnExit: minTagExit(S04_LAND, 'Always-on logic'), // 622
  even: wordStart('W0055'), // 551 "even"
  mainPowerOut: wordEnd('W0060') + 1, // 608 (first frame of the S04/S05 pause)

  /* S05 */
  lens2Leader: LENS2_OPEN - 4, // 604
  lens2Open: LENS2_OPEN, // 608 → 617 "That"
  eye: wordStart('W0065'), // 650 "lookout"
  settle: ANCHORS.handOverSettle, // 663
  settleEnd: ANCHORS.handOverSettleEnd, // 669
  qFill: ANCHORS.handOver, // 671 "not"
  s05Out: wordEnd('W0069') - 1, // 705: badge unfills, inset closes (f705–f711)

  /* S06 */
  stepBack: wordEnd('W0069') + 3, // 709 → 721 (12 frames, Move); the S05 inset finishes closing on it (705–711)
  /** T frames draw (frame-first) f713–f721, contents f717–f723. T sits BENEATH the stepping-back page, which carries
   *  an opaque page-tone backing, so the receding page uncovers the row (review fix: T used to draw on top of the
   *  still-shrinking page, f713–f718) */
  tOpen: wordEnd('W0069') + 7, // 713
  afterIn2: SENTENCES.S06.start, // 717 "It"
  starts: wordStart('W0071'), // 722 "starts"
  afterShrink2: wordStart('W0076'), // 765 "each"
  hopDepart: [wordStart('W0073'), 763, 793, 817, 845] as const, // "chain" 736, then 18/15/15/15-frame hops
  chain: CHAIN,
  s06Out: 912, // names + header exit, T folds, page grows back (S06/S07 pause f900–f913)

  /* S07 */
  hidden: wordStart('W0092'), // 950
  qUnfill: wordStart('W0093') + 17, // 975
  hiddenExit: minTagExit(wordStart('W0092'), 'Hidden processor?'), // 1072
  oneTap: wordStart('W0097'), // 999 "one"
  signIn: wordStart('W0101'), // 1036 "sign"
  arcOut: wordEnd('W0103') + 1, // 1058

  /* S08 */
  softOffOut: 1062,
  glide: minTagExit(wordStart('W0092'), 'Hidden processor?'), // 1072 → 1086 (after "Hidden processor?" leaves)
  restart: wordStart('W0110'), // 1111
  dup: wordStart('W0115') - 12, // 1154 → 1166
  shutDown: wordStart('W0115'), // 1166 "shutting"
  why: ANCHORS.whyDifferent, // 1194 "starting"
  cutTower: ANCHORS.whyDifferentHoldMin + 1, // 1243 (T1 cut inside the f1237–f1246 pause)

  /* S09 */
  pullBack: wordStart('W0124'), // 1262 "a typical" → 1278
  intel: wordStart('W0130'), // 1321
  amdFrame: wordStart('W0135') - 8, // 1374
  amd: wordStart('W0135'), // 1382
  laptopFrame: wordStart('W0137') - 8, // 1400
  laptops: wordStart('W0137'), // 1408

  /* S10 */
  thatLookout: wordStart('W0139'), // 1447
  standby: STANDBY_SPAN.start, // 1475 "standby"
  stopsOut: ANCHORS.stopsExitFrom, // 1505 → 1511
  cutStandby: ANCHORS.stopsExitTo - 1, // 1512 (T1 cut, last silent frame; "a" starts f1513)
  small: wordStart('W0145'), // 1519
  powerSupply: wordStart('W0148'), // 1547
  whenever: wordStart('W0152'), // 1589
  plugged: wordStart('W0154'), // 1610
  rear: wordStart('W0158'), // 1639
  cutS11: SENTENCES.S11.start - 1, // 1680 (T1 cut, last silent frame of the f1671–f1680 pause)

  /* S11 */
  just: wordStart('W0164'), // 1695
  standbyPoweredExit: minTagExit(wordStart('W0164'), 'Standby-powered'), // 1832
  notice: wordStart('W0170'), // 1746
  shimmerEnd: wordStart('W0170'), // shimmer while "It powers just enough of the motherboard"
  lock: LOCK, // 1798
  bracketsFade: SENTENCES.S11.end, // 1817
  standbyEnd: STANDBY_SPAN.end, // 1817

  /* S12 */
  now: ANCHORS.nowChip, // 1830
  press1: PRESS1, // 1837 "press."
  /** contact lands ON the anchor frame, as at f0 (50% at f1837, full at f1838); review fix: it began at f1838 */
  contact1: PRESS1, // 1837
  capUp1: 1846,
  fingerOut1: 1850,
  s12Depart: ANCHORS.realPress + 3, // 1840
  nextLand: ANCHORS.nextLand, // 1891 (outside the intro)
  powerButtonExit: Math.max(minTagExit(LOCK, 'Power button'), SENTENCES.S12.end), // 1850
} as const;
