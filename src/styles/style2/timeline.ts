/**
 * Night Signal: every frame constant of the intro, derived from the word JSON (kit ANCHORS / WORD_CUES /
 * wordStart). Absolute frames only. cues.json is generated from CUES below (tools: see REPORT.md) and the
 * visuals import the same constants, so sound and picture cannot drift.
 */
import {ANCHORS, WORD_CUES, wordStart, wordEnd, SENTENCES} from '../../shared';

export const F = {
  // ---- S01 (W, letterboxed) ----
  press: ANCHORS.press, // 0: cap travel #1
  capInEnd: 3,
  capOutStart: 6,
  capOutEnd: 10,
  chipIn: 2, // "After the press" readable by f7 (< f8)
  powerButtonTag: WORD_CUES.powerButton, // 29
  powerButtonTagOut: 128, // pause f128–f136 (exits before the cut)
  ffDepart: ANCHORS.ffBitDepart, // 33
  ffLand: ANCHORS.ffBitLand, // 59
  mainProcTag: WORD_CUES.mainProcessor, // 67
  notFirstTag: ANCHORS.notFirst, // 91
  // ---- S02a: C insert (letterboxed) ----
  cutC: 136, // inside pause f128–f136
  readoutIn: wordStart('W0017'), // 163 "single"
  notFirstOut: wordEnd('W0018') + 1, // 192: first silent frame after "instruction,"
  // ---- S02b/c: W + iris (letterboxed) ----
  cutW1: 197, // inside pause f192–f199
  iris1Open: 197, // complete f206 "smaller"
  smallerTag: WORD_CUES.smallerProcessor, // 206
  qWakes: ANCHORS.qWakes, // 294
  // ---- return + S03 ----
  returnStart: ANCHORS.returnStart, // 327: bars start to retract, slate rolls
  barsFrames: 8, // bars clear on f335
  relight: ANCHORS.returnPauseEnd, // 335
  returnTagsOut: ANCHORS.returnStart, // readout + "Main processor" exit f327
  iris1Close: 341, // with "Smaller processor" (hold rule: >= 341)
  powerButtonTag2: WORD_CUES.buttonYouPressed, // 344
  pointOn: WORD_CUES.doesntSwitchPowerOn, // 365 "doesn't": the lead is pointed at
  endTick: wordStart('W0037'), // 380 "actually"
  slateSmall1: wordStart('W0037'), // 380: Soft-off steps to 34 px
  mainPowerPill: wordStart('W0040'), // 410 "power"
  pointOff: 428, // pause f428–f435
  // ---- S04 ----
  powerButtonTag2Out: 442, // >= max(344+48, 427+15) = 442
  whenPressedIn: ANCHORS.whenPressedIn, // 441
  // Header rolls that carry a word start 5 frames early so the word is readable ON its anchor (review fix):
  // the roll is old-out 3 frames, new-in from the next frame over 5.
  whenPressedRoll: ANCHORS.whenPressedIn - 5, // 436: readable on "sends" (f441)
  s04Depart: ANCHORS.s04Depart, // 472
  s04Land: ANCHORS.s04Land, // 498
  iris2Open: ANCHORS.s04Land + 1, // 499, complete f508 "circuit"
  alwaysOnTag: wordStart('W0051'), // 508 "circuit"
  whenPressedOut: ANCHORS.whenPressedOut, // 519
  slateBig1: wordStart('W0055'), // 551 "even": Soft-off carries the meaning (44 px)
  slateSmall2: wordStart('W0061'), // 617
  // ---- S05 ----
  eyeIn: WORD_CUES.lookout - 8, // 642, complete f650 "lookout"
  settle: ANCHORS.handOverSettle, // 663
  qFill: ANCHORS.handOver, // 671 "not"
  mainPowerPillOut: 707, // pause f707–f716
  // ---- S06: P, the relay (letterboxed) ----
  cutP: 714, // match cut inside pause f707–f716
  pMoveEnd: 740,
  alwaysOnReenter: 741,
  hop1Depart: 737,
  chain1: ANCHORS.chain1, // 748
  hop2Depart: 766,
  chain2: ANCHORS.chain2, // 781
  hop3Depart: 794,
  chain3: ANCHORS.chain3, // 808
  hop4Depart: 818,
  chain4: ANCHORS.chain4, // 832
  hop5Depart: 846,
  chain5: ANCHORS.chain5, // 860 (parks)
  // ---- S07: W full frame ----
  cutW2: 913, // match cut inside pause f900–f913 (last silent frame)
  hiddenTag: WORD_CUES.hiddenProcessor, // 950
  slateSmall3: WORD_CUES.hiddenProcessor, // 950
  qUnfill: wordStart('W0094'), // 985 "and"
  oneTapTag: WORD_CUES.oneTap, // 999
  arcIn: WORD_CUES.oneTap, // 999–1029
  cardIn: 1028,
  signInTag: WORD_CUES.signInScreen, // 1036
  s07TagsOut: 1072, // max(950+48, 1057+15) = 1072 (within 6 frames of S08's start f1068)
  signInOut: 1084, // max(1036+48, 1072)
  // ---- S08: M ----
  cutM: 1090, // inside pause f1086–f1091
  forkIn: 1105,
  restartChip: WORD_CUES.restart, // 1111
  shutDownChip: WORD_CUES.shuttingDown, // 1166
  whyDifferent: ANCHORS.whyDifferent, // 1194
  mOut: 1251, // max(1194+48, 1236+15) = 1251 (within 6 frames of S09's start f1247)
  // ---- S09: M -> E ----
  pullME: wordStart('W0123'), // 1254 "follow"
  pullMEFrames: 72,
  intelHeader: WORD_CUES.intel, // 1321
  intelRoll: WORD_CUES.intel - 5, // 1316: "Intel desktop" readable on "Intel"
  stopAMDReveal: WORD_CUES.amd - 8, // 1374
  stopAMD: WORD_CUES.amd, // 1382
  stopLaptopReveal: WORD_CUES.laptops - 8, // 1400
  stopLaptop: WORD_CUES.laptops, // 1408
  slateSmall4: SENTENCES.S10.start, // 1438: "Intel desktop" steps to 34 px
  // ---- S10: E, then K ----
  standbyTag: WORD_CUES.standbyPower, // 1475
  stopsOut: ANCHORS.stopsExitFrom, // 1505
  slateSoftOff2: ANCHORS.stopsExitFrom, // 1505
  cutK: 1512, // last silent frame of pause f1505–f1512
  shimmerOn: WORD_CUES.smallTrickle, // 1519
  psuName: WORD_CUES.powerSupply, // 1547
  mainRailsPill: wordStart('W0150'), // 1565 "keeps"
  pluggedTag: WORD_CUES.pluggedIn, // 1610
  rearTag: WORD_CUES.rearSwitchIsOn, // 1639
  kTagsOut: 1685, // S10 ends f1670 (+15)
  rearOut: 1687, // max(1639+48, 1685)
  // ---- S11: K -> W ----
  pullKW: SENTENCES.S11.start, // 1681 "It"
  pullKWFrames: 40,
  wash: WORD_CUES.justEnoughOfTheMotherboard, // 1695
  railsPillBack: 1722,
  standbyPoweredTag: wordStart('W0168'), // 1726 "motherboard"
  wakeBadges: WORD_CUES.noticeAReason, // 1746
  wakeTag: wordStart('W0172'), // 1761 "reason"
  lock: ANCHORS.lock, // 1798 (snap f1793–f1798)
  bracketsFade: 1818, // pause f1818–f1829
  s11TagsOut: 1832, // S11 ends f1817 (+15); within 6 frames of S12's start
  // ---- S12 ----
  now: ANCHORS.nowChip, // 1830
  nowRoll: ANCHORS.nowChip - 5, // 1825 (inside the f1818–f1829 pause): "Now" readable on f1830
  realPress: ANCHORS.realPress, // 1837: cap travel #2
  realCapInEnd: 1840,
  realCapOutStart: 1846,
  realCapOutEnd: 1850,
  realDepart: ANCHORS.realPress + 2, // 1839
  pushStart: 1842,
  pushEnd: 1895, // continues past the last frame
  nextLand: ANCHORS.nextLand, // 1891 (outside the intro)
  last: ANCHORS.lastFrame, // 1889
} as const;

/** Cue list (Part A §A7). Written to cues.json; the picture uses the same F constants. */
export const CUES = [
  {cue: 'button', frame: F.press},
  {cue: 'land', frame: F.ffLand, note: 'A'},
  {cue: 'lens_open', frame: F.iris1Open},
  {cue: 'lens_close', frame: F.iris1Close},
  {cue: 'land', frame: F.s04Land, note: 'A'},
  // the iris opens f499–f508; its cue sits as the ring completes, 6 frames after the f498 landing (no stacked cues)
  {cue: 'lens_open', frame: F.iris2Open + 5},
  {cue: 'land', frame: F.chain1, note: 'A'},
  {cue: 'land', frame: F.chain2, note: 'C'},
  {cue: 'land', frame: F.chain3, note: 'D'},
  {cue: 'land', frame: F.chain4, note: 'E'},
  {cue: 'land', frame: F.chain5, note: 'G'},
  {cue: 'standby', start: F.standbyTag, end: SENTENCES.S11.end},
  {cue: 'lock', frame: F.lock},
  {cue: 'button', frame: F.realPress},
] as const;

/** Shots (camera setups on the one set). */
export type ShotId = 'W' | 'C' | 'P' | 'M' | 'E' | 'K';
export const SHOTS: ReadonlyArray<{id: ShotId; from: number; to: number; letterbox: boolean}> = [
  {id: 'W', from: 0, to: F.cutC - 1, letterbox: true},
  {id: 'C', from: F.cutC, to: F.cutW1 - 1, letterbox: true},
  {id: 'W', from: F.cutW1, to: F.cutP - 1, letterbox: true}, // bars open f327–f334
  {id: 'P', from: F.cutP, to: F.cutW2 - 1, letterbox: true},
  {id: 'W', from: F.cutW2, to: F.cutM - 1, letterbox: false},
  {id: 'M', from: F.cutM, to: F.pullME - 1, letterbox: false},
  {id: 'E', from: F.pullME, to: F.cutK - 1, letterbox: false}, // M -> E pull-back f1254–f1326
  {id: 'K', from: F.cutK, to: F.pullKW - 1, letterbox: false},
  {id: 'W', from: F.pullKW, to: F.last, letterbox: false}, // K -> W pull-back f1681–f1721
];

export const shotAt = (frame: number) => {
  let s = SHOTS[0];
  for (const x of SHOTS) if (x.from <= frame) s = x;
  return s;
};
