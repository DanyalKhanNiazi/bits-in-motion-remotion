/**
 * Style 1 (Bench Notebook): every frame constant of the intro, absolute (f0–f1889).
 *
 * Word-anchored values come from the kit (ANCHORS / WORD_CUES / wordStart / minTagExit, all
 * round(ms × 30 / 1000) from the locked word JSON). Every frame that carries a sound cue is read
 * from cues.json, and checked against the kit anchors at load time, so the picture and the cue list
 * the audio team mixes from cannot drift apart.
 */
import cuesFile from './cues.json';
import {ANCHORS, WORD_CUES, minTagExit, wordEnd, wordStart} from '../../shared';

interface CueRow {
  cue: string;
  frame?: number;
  start?: number;
  end?: number;
  note?: string;
}
const CUES: CueRow[] = (cuesFile as {style: number; cues: CueRow[]}).cues;
const cueFrames = (name: string): number[] => CUES.filter((c) => c.cue === name).map((c) => c.frame as number);
const sync = (ok: boolean, what: string): void => {
  if (!ok) throw new Error(`[style1] cues.json is out of sync with the kit anchors: ${what}`);
};

const BUTTON = cueFrames('button');
const LANDS = cueFrames('land');
const LENS_OPEN = cueFrames('lens_open');
const LENS_CLOSE = cueFrames('lens_close');
const LOCK = cueFrames('lock');
const STANDBY = CUES.find((c) => c.cue === 'standby') as CueRow;

sync(BUTTON.length === 2 && BUTTON[0] === ANCHORS.press && BUTTON[1] === ANCHORS.realPress, 'button cues must be f0 and f1837');
sync(
  LANDS.join(',') ===
    [ANCHORS.ffBitLand, ANCHORS.s04Land, ANCHORS.chain1, ANCHORS.chain2, ANCHORS.chain3, ANCHORS.chain4, ANCHORS.chain5].join(','),
  'land cues must be the flash-forward, S04 and S06 landings',
);
sync(LOCK.length === 1 && LOCK[0] === ANCHORS.lock, 'lock cue must be f1798');
sync(LENS_OPEN.length === 2 && LENS_CLOSE.length === 2, 'two Lens uses (S02 and S05)');
sync(!!STANDBY && STANDBY.start === WORD_CUES.standbyPower, 'standby span starts on "standby"');

/** Absolute frames. Comments give the word (and its id) each value hangs on. */
export const F = {
  /* S01: flash-forward under "After the press" */
  press1: BUTTON[0], // "Press" W0001: cap travel #1 (f0–f2), contacts close f2
  capReturn1: 6, // spring return f6–f10
  sheetIn: 2, // tracing sheet lays down f2–f8 (tab readable by f7)
  sheetMarks: 6, // ⊕ registration marks snap f6–f8
  tagPowerButton: WORD_CUES.powerButton, // "power" W0004 (f29)
  tagPowerButtonOut: minTagExit(WORD_CUES.powerButton, 'Power button'), // 142
  ffDepart: ANCHORS.ffBitDepart, // f33, inside "power"
  ffLand: LANDS[0], // "and" W0006 (f59): ripple only, absorbed
  cpuNameIn: WORD_CUES.mainProcessor - 6, // name inks f61–f67, readable on "main" W0008 (f67)
  cpuName: WORD_CUES.mainProcessor,
  notFirst: ANCHORS.notFirst, // "doesn't" W0010 (f91)
  notFirstOut: minTagExit(ANCHORS.notFirst, 'Not first'), // 142
  readout: wordStart('W0017'), // "single" (f163): 0 instructions, 4-frame flip
  /* S02 */
  lens1Open: LENS_OPEN[0], // f197 → complete on "smaller" W0020 (f206)
  qWake: ANCHORS.qWakes, // "already" W0028 (f294): "?" wicks ON (sheet + Lens)
  lens1Close: LENS_CLOSE[0], // f327 (pause)
  /* S03: the return, then the present */
  sheetOut: ANCHORS.returnStart, // sheet slides off f327–f337
  softOff: ANCHORS.returnStart + 6, // "Soft-off" pill lands f333–f338 (complete by f346)
  endTick: WORD_CUES.doesntSwitchPowerOn, // "doesn't" W0036 (f365): end-tick inks f365–f369
  leadInk: WORD_CUES.buttonYouPressed, // "button" W0033 (f344): the switch's lead inks on (6 frames), named
  leadDry: wordEnd('W0041') + 15, // dries back after S03's hold (f442)
  tagSignalOnly: WORD_CUES.doesntSwitchPowerOn,
  // held through the S04 demonstration, then leaves with "When pressed" on "that" (f519): the hold rule
  // needs f442, and the S05 Lens's ×4 chip (from f535) would otherwise sit on its leader, 11 px from the anchor
  tagSignalOnlyOut: ANCHORS.whenPressedOut,
  pillMainPower: wordStart('W0040'), // "power" (f410)
  n1: 428, // note 1 blooms in the f428–f435 pause
  /* S04: the demonstration */
  whenPressedIn: ANCHORS.whenPressedIn, // "sends" W0043 (f441)
  whenPressedOut: ANCHORS.whenPressedOut, // "that" W0052 (f519)
  s04Depart: ANCHORS.s04Depart, // "signal" W0047 (f472), no cap travel
  s04Land: LANDS[1], // "small" W0050 (f498): ripple only
  tagAlwaysOn: wordStart('W0051'), // "circuit" (f508)
  lens2Open: LENS_OPEN[1], // "stays" W0053 (f529) → complete f538, breathing peak f540 on "awake"
  /* S05 */
  eye1: WORD_CUES.lookout - 5, // pencil eye draws on f645–f653 ("lookout," W0065 f650)
  tagLookout: WORD_CUES.lookout, // f650
  settle: ANCHORS.handOverSettle, // D24: ring + ticks → grey rim f663–f669
  qFill1: ANCHORS.handOver, // "not" W0066 (f671): the "?" badge fills
  s05Out: minTagExit(WORD_CUES.lookout, 'Lookout'), // 721: S05 labels, eye, badge fill and "Main power: OFF" leave
  lens2Close: LENS_CLOSE[1], // f709 (pause f707–f716)
  /* S06: the list sheet over the notes column */
  listIn: 709, // lays down f709–f717
  listName1: wordStart('W0072'), // "a" (f731): "Always-on logic", Bit pops onto slot 1
  hops: [
    {depart: wordStart('W0073'), land: LANDS[2]}, // "chain" f736 → "handoffs" f748
    {depart: 769, land: LANDS[3]}, // → "stage" f781
    {depart: 796, land: LANDS[4]}, // → "what" f808
    {depart: 820, land: LANDS[5]}, // → "needs," f832
    {depart: 848, land: LANDS[6]}, // → "Windows" f860 (parks)
  ],
  listOut: 902, // slides off to the right f902–f912 (pause f900–f913)
  n2: 904, // chain stub blooms f904–f912
  /* S07 */
  qFill2: WORD_CUES.hiddenProcessor, // "hidden" W0092 (f950)
  tagOneTap: WORD_CUES.oneTap, // "one" W0097 (f999)
  arc: wordStart('W0099'), // "become" (f1021): pencil arc f1021–f1033
  signCard: wordStart('W0100'), // sign-in sketch blooms f1030–f1036
  tagSignIn: WORD_CUES.signInScreen, // "sign" W0101 (f1036)
  s07Out: minTagExit(WORD_CUES.signInScreen, 'Sign-in screen'), // 1084: the last S07 tag's hold ("Sign-in screen", f1036 + 48)
  /* S08: the promise card */
  card8In: wordStart('W0105') , // slides in f1072–f1084, lands on "end," (W0106 f1078 → settled f1084)
  fork: 1085, // fork blooms in the f1086–f1091 pause
  restart: WORD_CUES.restart, // "restart" W0110 (f1111)
  shutDown: WORD_CUES.shuttingDown, // "shutting" W0115 (f1166)
  whyDifferent: ANCHORS.whyDifferent, // "starting" W0118 (f1194), held ≥ 48 frames
  card8File: ANCHORS.whyDifferentHoldMin, // filed f1242–f1254 → note 3
  /* S09 */
  intel: WORD_CUES.intel, // "Intel" W0130 (f1321)
  cardAIn: WORD_CUES.amd - 12, // f1370 → lands on "AMD" W0135 (f1382)
  cardA: WORD_CUES.amd,
  cardLIn: WORD_CUES.laptops - 12, // f1396 → lands on "laptops" W0137 (f1408)
  cardL: WORD_CUES.laptops,
  stopsFile: ANCHORS.stopsExitFrom, // filed f1505–f1513 → note 4; "Intel desktop" exits
  /* S10 */
  tagStandby: WORD_CUES.standbyPower, // "standby" W0142 (f1475)
  shimmerFrom: WORD_CUES.smallTrickle, // "small" W0145 (f1519)
  shimmerTo: STANDBY.end as number, // f1817 (end of S11)
  psuNameIn: WORD_CUES.powerSupply - 6, // f1541–f1547, readable on "power" W0148 (f1547)
  pillMainRails: wordStart('W0149'), // "supply" (f1555)
  tick1: WORD_CUES.pluggedIn - 5, // tick by the plug f1605–f1610 ("plugged" W0154)
  tagRear: WORD_CUES.rearSwitchIsOn, // "rear" W0158 (f1639)
  tick2: wordStart('W0161') - 5, // tick by the rocker f1657–f1662 ("on." W0161)
  n5: 1671, // f1671–f1679 (pause f1671–f1680)
  s10Out: minTagExit(WORD_CUES.rearSwitchIsOn, 'Rear switch'), // 1687 (≥ "Standby power"'s 1685)
  /* S11 */
  swipe: WORD_CUES.justEnoughOfTheMotherboard, // "just" W0164 (f1695): swipe f1695–f1703
  eye2: WORD_CUES.noticeAReason - 4, // pencil eye returns f1742–f1750 ("notice" W0170 f1746)
  wakeLan: WORD_CUES.noticeAReason, // network-jack route blooms f1746–f1754
  wakeClock: wordStart('W0171'), // "a" (f1754): clock blooms f1754–f1762 ("reason" f1761)
  lock: LOCK[0], // "like" W0176 (f1798): brackets snap f1793–f1798
  lockOut: 1818, // brackets fade, eye leaves (pause f1818–f1829)
  n6: 1819, // wake-inputs note blooms f1819–f1827
  /* S12 + tail */
  now: ANCHORS.nowChip, // "Now" W0179 (f1830)
  press2: BUTTON[1], // "press." W0180 (f1837): cap travel #2 f1837–f1839
  capReturn2: 1846, // spring return f1846–f1850
  s12Depart: ANCHORS.realPress + 2, // f1839 (contacts closed)
  s12Land: ANCHORS.nextLand, // f1891: outside the intro; still travelling at f1889
} as const;

/** Every sound cue, as the audio team will read it (for the report and the checks). */
export const CUE_LIST = CUES;
