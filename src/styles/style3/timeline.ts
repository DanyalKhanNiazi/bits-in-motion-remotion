/**
 * Living Schematic: every frame constant of the intro, absolute (frame = round(ms x 30 / 1000) from the
 * word JSON, through the kit's timing helpers). No cumulative durations.
 *
 * Sound-cue frames are read from cues.json (the file the audio team mixes from), so the visuals that cause
 * a cue (presses, landings, Lens open/close, the lock) and the cue list cannot drift: each one is also
 * re-derived from its word here and checked at load (a mismatch prints a "[kit] style3 cue" warning).
 */
import {ANCHORS, SENTENCES, WORD_CUES, kitWarn, wordEnd, wordStart} from '../../shared';
import cuesFile from './cues.json';

interface Cue {
  cue: string;
  frame?: number;
  start?: number;
  end?: number;
  note?: string;
}
export const CUES: Cue[] = (cuesFile as {style: number; cues: Cue[]}).cues;

/** The n-th cue of a kind (0-based), as a frame. */
const cue = (kind: string, n = 0): number => {
  const c = CUES.filter((x) => x.cue === kind)[n];
  if (!c) throw new Error(`[style3] cues.json has no ${kind}[${n}]`);
  return (c.frame ?? c.start) as number;
};
const standbyCue = CUES.find((c) => c.cue === 'standby') as Cue;

/** S06 hop schedule: [depart, land] (landings are the shared chain anchors, from cues.json). */
const CH = [cue('land', 2), cue('land', 3), cue('land', 4), cue('land', 5), cue('land', 6)];

export const F = {
  /* S01 · W0001–W0012 · f0–f127 */
  press: cue('button', 0), // "Press": cap travels f0–f3 (contact f3), springs back f6–f11
  chipIn: 2, // "After the press" readable by f7 (A4: by f8)
  frameIn: 3, // dashed preview frame draws f3–f11
  powerButtonTag: WORD_CUES.powerButton, // f29 "power"
  ffRest: 30, // the Bit forms at the button's output
  ffDepart: ANCHORS.ffBitDepart, // f33
  ffLand: cue('land', 0), // f59 "and": ripple only, absorbed (no park)
  mainProcessorTag: WORD_CUES.mainProcessor, // f67 "main"
  notFirst: ANCHORS.notFirst, // f91: deliberately nothing on the CPU
  /* S02 · W0013–W0030 · f137–f326 */
  powerButtonExit: 142, // minTagExit(29, "Power button") = S01 end 127 + 15
  readout: wordStart('W0017'), // f163 "single"
  lens1Open: cue('lens_open', 0), // f191, in the pause after "instruction,": the Lens opens on the "?" block itself
  smaller: wordStart('W0020'), // f206: the "?" badge accent (on the map and inside the Lens)
  qWakes: ANCHORS.qWakes, // f294 "already": the "?" switches ON (preview state)
  /* Return · f327–f346 (complete by f346) */
  ret: ANCHORS.returnStart, // f327 first silent frame
  rewindLand: 345, // the Bit runs back to the button f327–f345 and is absorbed
  lens1Close: cue('lens_close', 0), // f331
  readoutExit: 333,
  mainProcExit: 335,
  softOff: 340, // header change: "Soft-off" readable by f344, complete by f346
  frameOut: 336, // the dashed frame un-draws f336–f346
  returnDoneBy: ANCHORS.returnDoneBy, // f346
  /* S03 · W0031–W0041 · f335–f427 */
  powerButtonTag2: wordStart('W0033'), // f344 "button"
  netTrace: 361, // grows f361–f365 beside the lead; end-tick on "doesn't" (f365)
  netTick: wordStart('W0036'), // f365
  signalOnlyTag: wordStart('W0037'), // f380 "actually"
  mainPowerPill: wordStart('W0040'), // f410 "power"
  s03Exit: Math.max(wordStart('W0033') + 48, SENTENCES.S03.end + 15), // f442
  /* S04 · W0042–W0060 · f436–f607 */
  whenPressed: ANCHORS.whenPressedIn, // f441 "sends"
  s04Rest: 468, // the Bit forms at the button's output (no cap travel, no click)
  s04Depart: ANCHORS.s04Depart, // f472 "signal"
  s04Land: cue('land', 1), // f498 "small": ripple only
  push: cue('land', 1), // arrival push f498–f524 starts on the landing
  whenPressedOut: ANCHORS.whenPressedOut, // f519 "that"
  awake: wordStart('W0054'), // f539
  softOff2: wordStart('W0060'), // f595 "off."
  /* S05 · W0061–W0069 · f617–f706 */
  lens2Open: cue('lens_open', 1), // f617 "That"
  eyeBadge: wordStart('W0065') - 8, // draws f642–f650, completing on "lookout"
  settle: ANCHORS.handOverSettle, // f663: ring + ticks fade to a grey rim (D24)
  handOver: ANCHORS.handOver, // f671 "not": the "?" fills
  lens2Close: cue('lens_close', 1), // f706
  pullBack: cue('lens_close', 1), // pull-back f706–f732, in the S05–S06 pause
  /* S06 · W0070–W0087 · f717–f899 */
  preview2: 717, // header change to "After the press": readable on "starts" (f722)
  frame2In: wordStart('W0071'), // f722: the dashed frame draws f722–f730
  platesIn: 724,
  tokenIn: 726,
  hops: [
    {depart: 731, land: CH[0]}, // "a" → "handoffs" f748
    {depart: 763, land: CH[1]}, // → "stage" f781
    {depart: 790, land: CH[2]}, // → "what" f808
    {depart: 819, land: CH[3]}, // → "needs," f832
    {depart: 844, land: CH[4]}, // → "Windows" f860 (parks)
  ],
  lift: 900, // f900–f912 the preview lifts
  /* S07 · W0088–W0103 · f914–f1057 */
  qHidden: wordStart('W0092'), // f950 "hidden": the badge fills
  qUnfill: 985,
  arc: wordStart('W0097'), // f999 "one"
  card: wordStart('W0101') - 8, // the card's dashed outline f1028–f1036
  signIn: wordStart('W0101'), // f1036 "sign"
  s07Exit: 1086, // hold rule (f1084) → the next pause (f1086–f1091)
  /* S08 · W0104–W0121 · f1068–f1236 */
  restart: wordStart('W0110'), // f1111
  shutDown: wordStart('W0115'), // f1166
  whyDifferent: ANCHORS.whyDifferent, // f1194 "starting"
  forkExit: Math.max(ANCHORS.whyDifferentHoldMin, SENTENCES.S08.end + 15), // f1251
  /* S09 · W0122–W0137 · f1247–f1424 */
  softOffLeave: 1247,
  scope: WORD_CUES.typicalDesktop, // f1269 "typical"
  intel: WORD_CUES.intel, // f1321
  amd: WORD_CUES.amd, // f1382
  laptops: WORD_CUES.laptops, // f1408
  stopsExit: ANCHORS.stopsExitFrom, // f1505
  /* S10 · W0138–W0161 · f1438–f1670 */
  standbyTag: standbyCue.start as number, // f1475 "standby"
  glide: ANCHORS.stopsExitFrom, // glide f1505–f1531, in the pause after "power,"
  shimmer: wordStart('W0145'), // f1519 "small"
  psuTag: WORD_CUES.powerSupply, // f1547
  mainRails: wordStart('W0150'), // f1565 "keeps"
  plugged: WORD_CUES.pluggedIn, // f1610
  rear: WORD_CUES.rearSwitchIsOn, // f1639
  s10Exit: SENTENCES.S10.end + 15, // f1685
  /* S11 · W0162–W0178 · f1681–f1817 */
  wash: WORD_CUES.justEnoughOfTheMotherboard, // f1695 "just"
  wake: wordStart('W0172'), // f1761 "reason"
  lock: cue('lock', 0), // f1798 "like"
  bracketsFade: 1824,
  standbyEnd: standbyCue.end as number, // f1817
  /* S12 · W0179–W0180 · f1830–f1850 + tail */
  now: ANCHORS.nowChip, // f1830
  s11Exit: SENTENCES.S11.end + 15, // f1832
  realPress: cue('button', 1), // f1837 "press.": cap travels f1837–f1840 (contact f1839)
  s12Depart: 1839, // the Bit departs one frame... at contact
  nextLand: ANCHORS.nextLand, // f1891 (outside the intro)
  ride: SENTENCES.S12.end, // f1850: the ride (T2 carry) starts as the voice ends
  last: ANCHORS.lastFrame, // f1889
};

/* ---------------------------------------------------------------- consistency checks (cue ↔ word) */
const expect: Array<[string, number, number]> = [
  ['button f0 ("Press")', F.press, ANCHORS.press],
  ['land A (flash-forward, "and")', F.ffLand, ANCHORS.ffBitLand],
  ['land A (S04, "small")', F.s04Land, ANCHORS.s04Land],
  ['land A ("handoffs")', CH[0], ANCHORS.chain1],
  ['land C ("stage")', CH[1], ANCHORS.chain2],
  ['land D ("what")', CH[2], ANCHORS.chain3],
  ['land E ("needs,")', CH[3], ANCHORS.chain4],
  ['land G ("Windows")', CH[4], ANCHORS.chain5],
  ['lock ("like")', F.lock, ANCHORS.lock],
  ['button f1837 ("press.")', F.realPress, ANCHORS.realPress],
  ['standby start ("standby")', F.standbyTag, WORD_CUES.standbyPower],
  ['lens_open #1 (end of "instruction," / start of the pause)', F.lens1Open, wordEnd('W0018')],
  ['lens_close #2 (pause after "processor.")', F.lens2Close, SENTENCES.S05.end],
  ['lens_open #2 ("That")', F.lens2Open, wordStart('W0061')],
  ['standby end (S11 end)', F.standbyEnd, SENTENCES.S11.end],
];
for (const [name, got, want] of expect) {
  if (got !== want) kitWarn(`style3 cue mismatch: ${name} is f${got} in cues.json, f${want} from the words`);
}
