/**
 * Signal Score (Style 4): every frame constant of the intro, in absolute frames (30 fps).
 *
 * Rule: a frame that belongs to a word comes from the word JSON through the kit (wordStart / wordEnd);
 * fixed frames (deadlines, pause positions, move windows) are written as numbers with their reason.
 * Sound cues come from cues.json, and the visuals read their frames from that same file, so the
 * picture and the cue list cannot drift. A mismatch is printed as a [kit] warning by the tools.
 */
import cuesFile from './cues.json';
import {ANCHORS, wordEnd, wordStart} from '../../shared/timing';
import {kitWarn} from '../../shared/motion';

const W = wordStart;

/* ------------------------------------------------------------------------------------------------
 * Cues (single source of truth for the cue frames)
 * ---------------------------------------------------------------------------------------------- */

interface CueRow {
  cue: string;
  frame?: number;
  start?: number;
  end?: number;
  note?: string;
}
export const CUES: readonly CueRow[] = (cuesFile as {style: number; cues: CueRow[]}).cues;

const cueFrames = (name: string): number[] => CUES.filter((c) => c.cue === name).map((c) => c.frame as number);
const LANDS = CUES.filter((c) => c.cue === 'land');
const landAt = (i: number): number => LANDS[i].frame as number;
const STANDBY_CUE = CUES.find((c) => c.cue === 'standby');

export const CUE = {
  press: cueFrames('button')[0],
  realPress: cueFrames('button')[1],
  ffLand: landAt(0),
  lensOpen: cueFrames('lens_open')[0],
  s04Land: landAt(1),
  lensClose: cueFrames('lens_close')[0],
  chain: [landAt(2), landAt(3), landAt(4), landAt(5), landAt(6)] as const,
  chainNotes: LANDS.slice(2).map((c) => c.note),
  standbyFrom: STANDBY_CUE?.start ?? 1475,
  standbyTo: STANDBY_CUE?.end ?? 1817,
  lock: cueFrames('lock')[0],
};

/* ------------------------------------------------------------------------------------------------
 * The beat plan (STORYBOARD.md has the same rows in prose)
 * ---------------------------------------------------------------------------------------------- */

export const F = {
  // ---- S01: the hook in hardware (stage strip, no score) ----
  press: CUE.press, // f0 "Press": cap travel #1
  chipIn: 2, // "After the press" header, readable by f7 (A4: by f8)
  tagPowerButton: W('W0004'), // 29 "power"
  ffDepart: ANCHORS.ffBitDepart, // 33 (inside "power button")
  ffLand: CUE.ffLand, // 59 "and": ripple only, absorbed, no park
  tagMainProcessor: W('W0008'), // 67 "main"
  tagNotFirst: W('W0010'), // 91 "doesn't"
  s01TagsOut: 142, // S01 ends f127; hold rule = sentence end + 15 = 142

  // ---- the fold (strip -> seats) and the score arriving as a record ----
  foldStart: 142,
  foldEnd: 172,
  pressMarkerIn: 156,
  playheadIn: 160,
  trackDraw: 156, // fill-front 50 px/frame from x 344
  mainProcName: 172, // "Main processor" re-enters at 34 px in lane 2's left slot
  readoutIn: W('W0018'), // 173 "instruction,"
  axisNoteIn: 180,
  qTrackIn: W('W0020'), // 206 "smaller": the "?" track tunes in
  qWakes: ANCHORS.qWakes, // 294 "already": the playhead writes the "?" block; the "?" head turns ON
  ffWriteEnd: wordEnd('W0030'), // 326 end of "work."

  // ---- S03: the rewind to the present ----
  returnStart: ANCHORS.returnStart, // 327 first silent frame
  returnEnd: 345, // playhead home (A4: complete by 346)
  softOffIn: W('W0031') + 2, // 337 ("And" f335 +2): the pill appears on the moving playhead once it has cleared the PRESS flag
  tagPowerButton2: W('W0033'), // 344 "button"
  pressedTick: W('W0035'), // 356 "pressed": annotation end-tick under the ghost press
  doesnt: W('W0036'), // 365 "doesn't": the lead's end at the header brightens
  mainRailsDraw: W('W0038'), // 395 "switch": track 4b tunes in, empty, stopping at PRESS
  mainPowerPill: W('W0040'), // 410 "power": "Main power: OFF"
  powerButton2Out: 442, // S03 ends f427: hold rule = 427 + 15 = 442 (6 frames into S04, allowed)

  // ---- S04: the Time Lens demonstration ----
  whenPressedIn: ANCHORS.whenPressedIn, // 441 "sends"
  whenPressedOut: ANCHORS.whenPressedOut, // 519 "that"
  lensOpen: CUE.lensOpen, // 453 "split"
  s04Depart: ANCHORS.s04Depart, // 472 "signal"
  s04Land: CUE.s04Land, // 498 "small"
  nameAlwaysOn: W('W0051'), // 508 "circuit"
  awake: W('W0054'), // 539
  offRestamp: W('W0060'), // 595 "off."

  // ---- S05 ----
  alwaysOnSettle: 622, // S04 end 607 + 15
  eyeIn: W('W0065') - 6, // 644: completes on "lookout" (650)
  lensSettle: ANCHORS.handOverSettle, // 663: D24 ring + ticks -> grey rim (6 frames)
  qFill: ANCHORS.handOver, // 671 "not": the "?" badge fills
  nameHidden: W('W0068'), // 683 "hidden"
  qUnfill: wordEnd('W0069') + 1, // 707 first silent frame after "processor."
  mainPowerOut: wordEnd('W0069') + 1, // 707
  lensClose: CUE.lensClose, // 707 (grey rim closes in the pause)

  // ---- S06: the look-ahead ----
  lookAheadIn: W('W0071'), // 722 "starts": header + slots + the press written in the preview
  chainBitIn: W('W0071') + 3, // 725: the Bit fades in on station 1 once the T1 re-spacing has settled
  hop1Depart: W('W0072'), // 731 "a"
  hop2Depart: W('W0076'), // 765 "each"
  hop3Depart: W('W0078'), // 794 "preparing"
  hop4Depart: W('W0080'), // 815 "the"
  hop5Depart: wordEnd('W0083') + 2, // 846 (pause after "needs,")
  chain: CUE.chain, // 748 781 808 832 860
  lookAheadOut: 914, // S06 ends f899: names hold to 899 + 15 = 914, then exit with the fold back
  foldBackEnd: 926,

  // ---- S07 ----
  qFill2: W('W0092'), // 950 "hidden"
  qUnfill2: wordEnd('W0093') + 1, // 974 pause after "processor,"
  oneTap: W('W0097'), // 999 "one"
  arc: W('W0099'), // 1021 "become"
  card: W('W0099') + 9, // 1030 card draws, readable at "sign"
  signIn: W('W0101'), // 1036 "sign"
  s07Out: wordEnd('W0106'), // 1085 card, arc and S07 tags exit into the f1086-f1091 pause
  hiddenSettle2: W('W0104'), // 1068 "By"

  // ---- S08 ----
  forkStem: W('W0109'), // 1104 "why"
  restart: W('W0110'), // 1111 "restart"
  shutDown: W('W0115'), // 1166 "shutting"
  whyDifferent: ANCHORS.whyDifferent, // 1194 "starting"
  forkOut: 1251, // S08 ends 1236: hold = 1236 + 15 = 1251 (>= 1194 + 48)

  // ---- S09 ----
  typical: W('W0125'), // 1269 "typical": outline accent down the lane heads
  intel: W('W0130'), // 1321 "Intel": header
  amdDraw: W('W0135') - 8, // 1374
  amd: W('W0135'), // 1382 "AMD"
  laptopDraw: W('W0137') - 8, // 1400
  laptops: W('W0137'), // 1408 "laptops."
  intelShrink: W('W0138') + 1, // 1439

  // ---- S10 ----
  lookoutPulse: W('W0139'), // 1447 "lookout"
  standbyTag: W('W0142'), // 1475 "standby"
  stopsOut: ANCHORS.stopsExitFrom, // 1505
  trickle: W('W0145'), // 1519 "small trickle": shimmer
  psuAccent: W('W0148'), // 1547 "power supply"
  mainRailsPill: W('W0150'), // 1565 "keeps"
  plugged: W('W0154'), // 1610 "plugged"
  rear: W('W0158'), // 1639 "rear"
  s10TagsOut: 1685, // S10 ends 1670 + 15
  rearOut: 1687, // "Rear switch" 1639 + 30 + 18

  // ---- S11 ----
  wash: W('W0164'), // 1695 "just"
  notice: W('W0170'), // 1746 "notice": the wake join
  reason: W('W0172'), // 1761 "reason": "Wake sources"
  lock: CUE.lock, // 1798 "like": brackets lock (snap 1793-1798)
  lockOut: wordEnd('W0178') + 1, // 1818 brackets and join fade in the pause
  wakeTagOut: 1832, // S11 ends 1817 + 15

  // ---- S12 ----
  approach: wordEnd('W0178'), // 1817: the playhead steps onto PRESS
  intelOut: 1824,
  now: ANCHORS.nowChip, // 1830 "Now"
  realPress: CUE.realPress, // 1837 "press.": cap travel #2
  s12Depart: ANCHORS.realPress + 2, // 1839: the Bit leaves the written pulse
  softOffOut: wordEnd('W0180'), // 1850 speech ends
  stretch: 1844, // the moments after PRESS stretch (M4)
  nextLand: ANCHORS.nextLand, // 1891 (outside the intro)
  last: ANCHORS.lastFrame, // 1889
} as const;

/* ------------------------------------------------------------------------------------------------
 * Cross-checks: the cue file must agree with the word JSON (printed as [kit] warnings by the tools).
 * ---------------------------------------------------------------------------------------------- */

const expect = (what: string, got: number | undefined, want: number) => {
  if (got !== want) kitWarn(`style4 cues.json: ${what} is ${got}, the word JSON says ${want}`);
};
expect('button #1', CUE.press, ANCHORS.press);
expect('button #2', CUE.realPress, ANCHORS.realPress);
expect('land (flash-forward)', CUE.ffLand, ANCHORS.ffBitLand);
expect('lens_open ("split")', CUE.lensOpen, wordStart('W0045'));
expect('land (S04)', CUE.s04Land, ANCHORS.s04Land);
expect('lens_close (pause after "processor.")', CUE.lensClose, wordEnd('W0069') + 1);
expect('land chain 1', CUE.chain[0], ANCHORS.chain1);
expect('land chain 2', CUE.chain[1], ANCHORS.chain2);
expect('land chain 3', CUE.chain[2], ANCHORS.chain3);
expect('land chain 4', CUE.chain[3], ANCHORS.chain4);
expect('land chain 5', CUE.chain[4], ANCHORS.chain5);
expect('standby start ("standby")', CUE.standbyFrom, wordStart('W0142'));
expect('standby end (S11 end)', CUE.standbyTo, wordEnd('W0178'));
expect('lock', CUE.lock, ANCHORS.lock);
if (CUE.chainNotes.join('') !== 'ACDEG') kitWarn(`style4 cues.json: chain notes are ${CUE.chainNotes.join('')}, expected ACDEG`);
