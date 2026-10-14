/**
 * Ep01 intro script (STORYBOARD.md §3–§7, beats B01–B29). Every frame here is DERIVED: a word's start or end (w, wEnd),
 * a sentence's span (sentence), or a shared A4 deadline (A4.*), plus a small offset in frames; there are no hand-set
 * absolute frames (checked by `node src/styles/style6/lint-times.mjs`). buildScript resolves holds, ports and field
 * events, and runs every dev check once (printed as `[kit] …` by the tools). Comments say what a line is for; why it
 * changed in each review round is in STORYBOARD.md §13–§16.
 */
import {
  A4,
  buildScript,
  bit,
  cam,
  chainRow,
  flipTo,
  pill,
  point,
  press,
  sentence,
  tag,
  w,
  type ChipStep,
  type GlyphEvent,
  type PlateSpec,
  type PropEvent,
  type ScriptInput,
  type StateEvent,
  FOLD_END,
  PLATE4,
} from '../../../engine';
import {WORLD} from './world';
import {SHOTS} from './shots';
import {
  AMD_CHIPSET_NAME_AT,
  AMD_Q_ANCHOR,
  AMD_SCENE,
  AMD_SHOT,
  AMD_TAG_ANCHOR,
  BAND_GAP_AT,
  BAND_OUTCOME_AT,
  BAND_ROCKER_AT,
  CMD_CENTER,
  CMD_HEDGE_AT,
  CMD_PROBLEM,
  CMD_RING,
  CMD_SHOT,
  CPU_SHOT,
  FIRMWARE_SCENE,
  LAPTOP_BATTERY_NAME_AT,
  LAPTOP_SCENE,
  LAPTOP_SHOT,
  LAPTOP_TAG_ANCHOR,
  LOADER_SCENE,
  LOOKOUT_SCENE,
  LOOKOUT_SHOT,
  POWER_SCENE,
  POWER_SHOT,
  Q_SCENE,
  Q_SHOT,
  RESTART_SCENE,
  SHUTDOWN_SCENE,
  STANDBY_PATH_SCENE,
  STANDBY_PATH_SHOT,
  STANDBY_PATH_SOURCE,
  WINDOWS_SCENE,
  WINDOWS_SHOT,
} from './scenes';

/* ------------------------------------------------------------------------------------------------
 * Derived times used in more than one place
 * ---------------------------------------------------------------------------------------------- */

/** The return to the present (A4 f327: the first silent frame after "work."). */
const RETURN = A4.returnStart;
/** Lens #1 closes as the flash-forward ends; Lens #2 opens in the pause after "off." and closes at the end of S05. */
const L1_CLOSE = RETURN + 4;
const L2_OPEN = sentence('S04').end + 1;
const L2_CLOSE = sentence('S05').end;
/** The end of each sentence + 15 frames: the brand's hold rule (tags leave at or after it). */
const held = (s: Parameters<typeof sentence>[0]): number => sentence(s).end + 15;
/** S08's plates, question and signs leave on the hold rule's first frame. */
const S08_OUT = held('S08');
/** The stops peel together on "stops" and fly home on "lookout" +5, once their names have been read. */
const STOPS_PEEL = w('W0133');
const STOPS_BACK = w('W0139', 5);
/** The triptych opens 6 frames before "it's" so its bands are open for "plugged"; it folds on "powers". */
const SPLIT_AT = w('W0153', -6);
const FOLD_AT = w('W0163');
/** The what-if outcomes: each band's lookout goes dark (and its eye closes) once its line has drained. */
const UNPLUG_DARK = w('W0154', 14);
const SWITCH_DARK = w('W0159', 9);
/** The S11 wake sources draw on "notice" and settle back to grey on "wake". */
const NOTICE = w('W0170');
const WAKE_SETTLE = w('W0174', 2);

/* ------------------------------------------------------------------------------------------------
 * Time and the chip (§3): TIME only, from a fixed vocabulary; a scope is a muted second line; S08 dims it
 * ---------------------------------------------------------------------------------------------- */

const LATER = 'After the press';
const NOW = 'Soft-off';
const chip = (at: number, text: string, size: ChipStep['size'], underline: ChipStep['underline'] = 'single', o: {scope?: string; dim?: boolean} = {}): ChipStep => ({
  at,
  text,
  size,
  underline,
  ...o,
});

const CHIP: ChipStep[] = [
  chip(w('W0001', 2), LATER, 'active', 'double'),
  chip(w('W0013'), LATER, 'rest', 'double'),
  // the return: window and Lens first (f327), the tags at +4, the chip on "And" +1 (f336); complete before f346 (A4)
  chip(w('W0031', 1), NOW, 'active'),
  chip(w('W0039'), NOW, 'rest'),
  // the S04 demonstration is "after the press" too
  chip(w('W0042'), LATER, 'active', 'double'),
  chip(w('W0052'), NOW, 'rest'),
  chip(w('W0060', -3), NOW, 'active'),
  chip(w('W0061'), NOW, 'rest'),
  chip(w('W0070', -1), LATER, 'active', 'double'),
  chip(w('W0076'), LATER, 'rest', 'double'),
  chip(w('W0088'), NOW, 'rest'),
  // S08's plates show a later day (a running PC), not this soft-off machine: the chip steps back while they are up
  chip(w('W0106'), NOW, 'rest', 'single', {dim: true}),
  chip(S08_OUT, NOW, 'rest'),
  // S09: the scope under "Soft-off" ("Windows desktop" on "Windows", "Intel desktop" on "Intel"), cleared as the stops
  // fly home; "Soft-off" stays through the triptych
  chip(w('W0126'), NOW, 'rest', 'single', {scope: 'Windows desktop'}),
  chip(w('W0130'), NOW, 'rest', 'single', {scope: 'Intel desktop'}),
  chip(STOPS_BACK, NOW, 'rest'),
  // round 4 (judges: "Now" read 5 frames after its word): the change starts 3 frames early so the word is readable on
  // "Now" itself (the fade-and-slide change is readable from its third frame)
  chip(A4.nowChip - 3, 'Now', 'active'),
];

/* ------------------------------------------------------------------------------------------------
 * S06: the chain (B13–B15) as ONE device: each plate peels from its own part in chain order carrying that part (its
 * hero), names show dimmed as the plates land and brighten as the Bit lands, the Bit lands without its glow on the
 * processor stages (red line 1) and parks on the screen
 * ---------------------------------------------------------------------------------------------- */

/** The first peel: 5 frames before "It" (the pause after "processor."; Lens #2 has closed). */
const PEEL = w('W0070', -5);
const BACK = w('W0088');
/** Round 4 (judges: the take-off and the fly-home were the busiest moments): the plates peel 6 frames apart in reading
 *  order over a world that has already stepped back, and fly home 3 frames apart, right to left, each as its hero alone
 *  (the card dissolves in its slot); the "?" flies home last, the subject of "So what is that hidden processor". */
const PEEL_STAGGER = 6;
const BACK_STAGGER = 3;
const BACK_ORDER = [5, 4, 3, 1, 0, 2];
/** The chain's five landings are the A4 anchors: "handoffs", "stage", "what", "needs,", "Windows". */
const LAND = [A4.chain1, A4.chain2, A4.chain3, A4.chain4, A4.chain5];
const CHAIN = chainRow({
  id: 'chain',
  plateId: (i) => `p${i + 1}`,
  peelAt: PEEL,
  backAt: BACK,
  lands: LAND,
  restFrom: w('W0071'),
  peelStagger: PEEL_STAGGER,
  backStagger: BACK_STAGGER,
  backOrder: BACK_ORDER,
  // round 4, one name per object (style guide §7.6): the lookout is "Lookout" from S05 on, the "?" is "Hidden processor"
  stages: [
    {source: {x: 640, y: 600, w: 140, h: 100}, scene: LOOKOUT_SCENE, shot: LOOKOUT_SHOT, name: 'Lookout', hero: {scenePart: 'lookout', worldPart: 'chipset', block: 'lookout'}, gap: 90},
    {source: 'psu', scene: POWER_SCENE, shot: POWER_SHOT, name: 'Main\npower', hero: {scenePart: 'psu', worldPart: 'psu'}, gap: 114},
    {source: {x: 800, y: 500, w: 100, h: 100}, scene: Q_SCENE, shot: Q_SHOT, name: 'Hidden\nprocessor', hero: {scenePart: 'q', worldPart: 'chipset', block: 'q'}, gap: 74},
    {source: 'flash', scene: FIRMWARE_SCENE, shot: CPU_SHOT, name: 'Firmware\non CPU', hero: {scenePart: 'flash', worldPart: 'flash'}, quiet: true, gap: 42},
    {source: 'm2', scene: LOADER_SCENE, shot: CPU_SHOT, name: 'Loader', hero: {scenePart: 'm2', worldPart: 'm2'}, quiet: true, gap: 42},
    {source: 'monitor', scene: WINDOWS_SCENE, shot: WINDOWS_SHOT, name: 'Windows', hero: {scenePart: 'monitor', worldPart: 'monitor'}, gap: 116},
  ],
});
/** All six plates are home (the last hero leaves at BACK + 15 and is home 17 frames later). */
const CHAIN_HOME = BACK + BACK_STAGGER * (BACK_ORDER.length - 1) + PLATE4.heroHome;

/* ------------------------------------------------------------------------------------------------
 * S08: "Restart" | "Shut down", twin not-now plates carrying the monitor out of the world: the same running PC in both
 * with a problem mark. Restart's loop sweeps round it and, on "can fix", its mark turns dashed and faint (it may clear);
 * Shut down's power sign draws, the PC goes dark on "down" and returns on "starting again", and on "might not" its mark
 * gets a grey "?" (it may stay). "Why different?" stays a question; no mechanism is shown.
 * Round 4 (judges: the hedge was 3–6 px on a phone and its grey "?" reused the series' "?"; two monitor plates flew home
 * stacked; about 1 s showed nothing new under "By the end"): the hedge is said in 44 px captions under each PC on its
 * words ("Can fix", "Might not") and marked by its own symbol, a dotted ring round the problem mark; Restart peels on
 * "end,"; Shut down slides out from behind Restart (the same running PC, a copy that diverges on its words) and slides
 * back behind it at the end, so only Restart carries the monitor home.
 * ---------------------------------------------------------------------------------------------- */

const RESTART = w('W0110');
const CAN = w('W0111');
const FIX = w('W0112');
const SHUT = w('W0115');
const DOWN = w('W0116');
const AGAIN = w('W0118');
const MIGHT = w('W0120');

/** Restart peels on "end," as the S07 labels leave; it returns once Shut down has slid back behind it. */
const S08_PEEL = w('W0106', 4);
const S08_HOME = S08_OUT + PLATE4.into;
const hedge = (text: string, at: number) => ({text, at, scenePt: CMD_HEDGE_AT as unknown as readonly [number, number], exitAt: S08_OUT, tone: 'ink' as const});
const S08_PLATES: PlateSpec[] = [
  // drawn first, so it slides out from UNDER Restart
  {
    id: 'pShut',
    slot: {layout: 'pairWide', index: 1},
    source: 'monitor',
    content: {kind: 'scene', scene: SHUTDOWN_SCENE, shot: CMD_SHOT},
    rule: 'notNow',
    enterFrom: 'pRestart',
    returnInto: 'pRestart',
    peelAt: w('W0114'),
    returnAt: S08_OUT,
    caption: {text: 'Shut down', at: SHUT, place: 'top', exitAt: S08_OUT},
    names: [hedge('Might not', MIGHT)],
  },
  {
    id: 'pRestart',
    slot: {layout: 'pairWide', index: 0},
    source: 'monitor',
    content: {kind: 'scene', scene: RESTART_SCENE, shot: CMD_SHOT},
    hero: {scenePart: 'monitor', worldPart: 'monitor'},
    rule: 'notNow',
    peelAt: S08_PEEL,
    returnAt: S08_HOME,
    caption: {text: 'Restart', at: RESTART, place: 'top', exitAt: S08_OUT},
    names: [hedge('Can fix', CAN)],
  },
];
const inRestart = {plate: 'pRestart'} as const;
const inShut = {plate: 'pShut'} as const;
const S08_GLYPHS: GlyphEvent[] = [
  {kind: 'problem', anchor: CMD_PROBLEM, at: w('W0110', 3), hedgeAt: w('W0112', 4), outAt: S08_OUT, scope: inRestart},
  {kind: 'loopArrow', anchor: CMD_CENTER, r: CMD_RING, drawAt: RESTART, dur: 16, spinAt: FIX, outAt: S08_OUT, scope: inRestart},
  {kind: 'problem', anchor: CMD_PROBLEM, at: w('W0115', 6), doubtAt: MIGHT, outAt: S08_OUT, scope: inShut},
  {kind: 'powerRing', anchor: CMD_CENTER, r: CMD_RING, drawAt: SHUT, dur: 16, offAt: DOWN, onAt: AGAIN, outAt: S08_OUT, scope: inShut},
];
const screen = (scope: {plate: string}, at: number, dur: number, from: number, to: number): PropEvent => ({part: 'monitor', prop: 'lit', at, dur, from, to, ease: 'arrive', scope});
const S08_PROPS: PropEvent[] = [
  // Restart: the screen blinks off and back while the loop sweeps round; Shut down: dark on "down", back on "again"
  screen(inRestart, w('W0110', 4), 4, 1, 0),
  screen(inRestart, w('W0110', 12), 6, 0, 1),
  screen(inShut, DOWN, 6, 1, 0),
  screen(inShut, w('W0118', 2), 8, 0, 1),
  // round 4 (judges: the pair sat nearly still through "and starting again"): the restart of the shut-down PC is a
  // visible power-on sweep down its screen
  {part: 'monitor', prop: 'sweep', at: w('W0118', 2), dur: 12, from: 0, to: 1, ease: 'move', scope: inShut},
];
const S08_STATES: StateEvent[] = [
  flipTo('monitor', 'off', w('W0110', 4), {scope: inRestart}),
  flipTo('monitor', 'on', w('W0110', 12), {scope: inRestart}),
  flipTo('monitor', 'off', DOWN, {scope: inShut}),
  flipTo('monitor', 'on', w('W0118', 2), {scope: inShut}),
];

/* ------------------------------------------------------------------------------------------------
 * S09: the two stops (B21), pairRight, held rule: each shows its own machine from its first frame and names its
 * difference inside the plate. Round 4 (judges: the stops entered and left as blank navy cards, one crossing the CPU
 * while "Intel processor" pointed at it): other machines SLIDE in from the frame's right edge with their drawing, and
 * slide back out the same way; they never cross this board and are never empty
 * ---------------------------------------------------------------------------------------------- */

const AMD = w('W0135');
const LAPTOPS = w('W0137');

const STOP_PLATES: PlateSpec[] = [
  {
    id: 'pAmd',
    slot: {layout: 'pairRight', index: 0},
    source: {x: 640, y: 190, w: 270, h: 500},
    content: {kind: 'scene', scene: AMD_SCENE, shot: AMD_SHOT},
    rule: 'held',
    lift: 'slide',
    peelAt: STOPS_PEEL,
    returnAt: STOPS_BACK,
    caption: {text: 'AMD', at: AMD, place: 'top', exitAt: STOPS_BACK},
    active: [{at: AMD, on: true}, {at: LAPTOPS, on: false}],
    // one leader to each block: both are in the processor
    tags: [tag('amdIn', 'In the\nprocessor', {role: 'part', anchor: AMD_TAG_ANCHOR, moreAnchors: [AMD_Q_ANCHOR], slot: [1474, 248], word: 'W0135', land: AMD + 3, exitAt: STOPS_BACK})],
    names: [{text: 'Chipset', at: AMD + 6, scenePt: AMD_CHIPSET_NAME_AT, exitAt: STOPS_BACK}],
  },
  {
    id: 'pLaptop',
    slot: {layout: 'pairRight', index: 1},
    source: {x: 400, y: 500, w: 500, h: 416},
    content: {kind: 'scene', scene: LAPTOP_SCENE, shot: LAPTOP_SHOT},
    rule: 'held',
    lift: 'slide',
    peelAt: STOPS_PEEL + 5,
    // slides out 3 frames after the AMD plate
    returnAt: STOPS_BACK + 3,
    caption: {text: 'Laptops', at: LAPTOPS, place: 'top', exitAt: STOPS_BACK},
    names: [{text: 'Battery', at: LAPTOPS + 6, scenePt: LAPTOP_BATTERY_NAME_AT, exitAt: STOPS_BACK}],
    active: [{at: LAPTOPS, on: true}, {at: w('W0138'), on: false}],
    tags: [
      tag('ecIn', 'Lookout:\nown chip', {
        role: 'part',
        anchor: LAPTOP_TAG_ANCHOR,
        slot: [1450, 598],
        word: 'W0137',
        land: LAPTOPS + 3,
        exitAt: STOPS_BACK,
        holdWaiver: 'the stops fly home on "lookout" so the voice and the frame return to the desktop together',
      }),
    ],
  },
];

/* ------------------------------------------------------------------------------------------------
 * Glyphs: badges, marks, the eye, the end tick, S07 devices, S11 wake sources, the brackets, the triptych's eyes
 * ---------------------------------------------------------------------------------------------- */

const Q = {part: 'chipset', block: 'q'} as const;
/** The Bit's receiver at f59 and f498: the lookout's outline ripples outward (ripple only: no state change, A4). */
const LOOKOUT = {part: 'chipset', block: 'lookout'};
const GLYPHS: GlyphEvent[] = [
  // both presses send a visible wave off the button (the hook on "Press", the real press on "press.")
  {kind: 'pressWave', part: 'button', at: w('W0001')},
  {kind: 'pressWave', part: 'button', at: w('W0180')},
  {kind: 'qAccent', ...Q, at: w('W0020')},
  {kind: 'qAccent', ...Q, at: w('W0024', -3)},
  // on "first", the lookout's "First" mark (a non-CPU block may carry it; the CPU never does), opposite "Not first".
  // Round 4 (judges: "First" landed on a block nobody had named, beside the "?"'s Lens): left of the lookout, away from
  // the "?", on a leader, with the block's technical name as a mono subline, so it is never the "smaller processor"
  {kind: 'mark', anchor: 'chipset.block:lookout.left', text: 'First', at: w('W0012'), outAt: RETURN + 4, dx: -266, dy: -31, sub: 'always-on logic', leader: true},
  {kind: 'endTick', route: 'pwrbtn', at: w('W0036', 8), outAt: sentence('S03').end + 1},
  // the analogy's eye on the lookout, until its plate lifts it into the chain (the plate carries it on)
  {kind: 'eye', anchor: 'chipset.block:lookout.top', block: 'lookout', drawAt: w('W0065', -8), outAt: PEEL},
  // D24 (A4 f671): the "?" gets its dashed pointer ring on "not"
  {kind: 'qFill', ...Q, at: A4.handOver, outAt: L2_CLOSE, size: 'subject'},
  {kind: 'qAccent', part: 'q', block: 'q', at: LAND[1], scope: {plate: 'p3'}},
  // round 4 (judges: plates 4 and 5 were a CPU stacked on a part and read alike): each stage's mark on its part, and a
  // copy slides into the processor as the Bit lands there: the firmware's code, the loader's file
  {kind: 'stage', mark: 'code', from: 'flash.center', to: 'cpu.center', w: 64, at: PEEL + 3 * PEEL_STAGGER + 12, moveAt: LAND[2], outAt: BACK, scope: {plate: 'p4'}},
  {kind: 'stage', mark: 'file', from: 'm2.center', to: 'cpu.center', w: 34, at: PEEL + 4 * PEEL_STAGGER + 12, moveAt: LAND[3], outAt: BACK, scope: {plate: 'p5'}},
  {kind: 'eye', anchor: 'lookout.top', block: 'lookout', drawAt: PEEL + 8, outAt: BACK, scope: {plate: 'p1'}},
  {kind: 'qFill', ...Q, at: w('W0092'), outAt: w('W0094'), size: 'subject'},
  // the dashed analogy arc bows under the board's right half (bend < 0), clear of "Hidden processor?"
  {kind: 'arc', from: 'button.top', to: [1476, 518], drawAt: w('W0097'), dur: 30, outAt: w('W0106', 6), bend: -0.32},
  {kind: 'card', rect: {x: 1490, y: 445, w: 213, h: 133}, drawAt: w('W0100', -2), contentAt: w('W0101'), outAt: w('W0106', 6)},
  ...S08_GLYPHS,
  {kind: 'scopeLine', rects: [{x: 330, y: 112, w: 1130, h: 816}, {x: 1490, y: 190, w: 280, h: 240}], drawAt: w('W0125'), dur: 30, outAt: w('W0130', -8), pad: 0},
  // the stops carry the lookout's eye (the main map's rhyme)
  {kind: 'eye', anchor: 'lookout.top', block: 'lookout', drawAt: AMD + 8, outAt: STOPS_BACK, scope: {plate: 'pAmd'}},
  {kind: 'eye', anchor: 'lookout.top', block: 'lookout', drawAt: LAPTOPS + 8, outAt: STOPS_BACK, scope: {plate: 'pLaptop'}},
  // the triptych: every band's lookout carries the eye; it closes when that band's lookout goes dark
  {kind: 'eye', anchor: 'lookout.top', block: 'lookout', drawAt: SPLIT_AT + 10, outAt: FOLD_AT - 6, scope: {band: 'center'}},
  {kind: 'eye', anchor: 'lookout.top', block: 'lookout', drawAt: SPLIT_AT + 10, outAt: FOLD_AT - 6, scope: {band: 'left'}, closeAt: UNPLUG_DARK},
  {kind: 'eye', anchor: 'lookout.top', block: 'lookout', drawAt: SPLIT_AT + 10, outAt: FOLD_AT - 6, scope: {band: 'right'}, closeAt: SWITCH_DARK},
  // the wake sources (badges) stay, grey, once drawn: their routes need their sources on the map
  {kind: 'wake', glyph: 'netJack', anchor: 'rearIo.rj45', at: NOTICE, pointed: true, settleAt: WAKE_SETTLE},
  {kind: 'wake', glyph: 'clock', anchor: [580, 520], at: NOTICE + 4, pointed: true, settleAt: WAKE_SETTLE},
  // the eye returns on "notice" (a lookout watching several doors) and glances at each door in turn: the network jack,
  // the clock on "reason", the button on "like that button"
  {
    kind: 'eye',
    anchor: 'chipset.block:lookout.top',
    block: 'lookout',
    drawAt: NOTICE,
    outAt: A4.nowChip,
    look: [
      {at: NOTICE + 6, to: 'rearIo.rj45'},
      {at: w('W0172'), to: [580, 520]},
      {at: w('W0176', -4), to: 'button.center'},
    ],
  },
  {kind: 'brackets', part: 'button', lockAt: A4.lock, fadeAt: sentence('S11').end + 1},
];

/* ------------------------------------------------------------------------------------------------
 * The script
 * ---------------------------------------------------------------------------------------------- */

const input: ScriptInput = {
  camera: {
    start: 'hook',
    reference: 'atlas',
    shots: SHOTS,
    keys: [
      // the hook holds on the button while it is pressed and the Bit is born on its cap (f0–f21); K1 then glides out
      cam('openLean', {at: w('W0003', 6), dur: 49, ease: 'glide', carry: 'ff', note: 'K1 glides out over the board with the flash-forward Bit'}),
      cam('power', {at: w('W0035', 1), dur: 30, ease: 'glide', note: 'K2 "(you) pressed": after the return, not inside it'}),
      cam('chip', {at: A4.s04Depart - 2, dur: 52, ease: 'carry', carry: 's04', anchor: [696, 648], note: 'K3 follows the S04 Bit'}),
      cam('board', {at: w('W0055'), dur: 34, ease: 'move', note: 'K4 "even while your PC is off"'}),
      cam('chip', {at: CHAIN_HOME, dur: 30, ease: 'move', note: 'K5 "…that hidden processor": once every plate is home'}),
      cam('ask', {at: w('W0094'), dur: 40, ease: 'move', note: 'K6 "and how does one tap…"'}),
      cam('desk', {at: w('W0123'), dur: 44, ease: 'move', note: 'K8 "follow a typical Windows desktop" (round 4: on "follow", once Shut down is behind Restart)'}),
      cam('deskIntel', {at: w('W0130'), dur: 36, ease: 'move', note: 'K8b "an Intel processor": a gentle push onto the CPU and chipset'}),
      cam('standby', {at: STOPS_BACK + 6, dur: 24, ease: 'glide', note: 'K9 once the stops are flying home: onto the standby path'}),
      cam('trickle', {at: w('W0145'), dur: 56, ease: 'move', note: 'K9a "a small trickle": ×1.06 toward the standby path'}),
      cam('wake', {at: FOLD_AT + FOLD_END, dur: 34, ease: 'glide', note: 'K9b "just enough of the motherboard": onto the powered domain, once the fold has carried its parts home'}),
      cam('dive', {at: A4.realPress + 3, dur: 88, ease: 'carry', carry: 'real', note: 'K10 follows the real press (past f1889)'}),
    ],
  },
  windows: [
    {at: w('W0001', 2), expandAt: RETURN, ruleAt: w('W0001', 4)},
    // round 4 (judges: the "later" window framed only S01–S02, not the S04 demonstration that carries the same chip):
    // the world shows the described signal, so it is framed as later too, from "sends" to "that"
    {at: w('W0043', -3), expandAt: w('W0052'), ruleAt: w('W0043', -1)},
  ],
  chip: CHIP,
  states: [
    flipTo('chipset', 'on', A4.qWakes, {block: 'q'}),
    flipTo('chipset', 'off', RETURN, {block: 'q'}),
    flipTo('q', 'on', LAND[1], {scope: {plate: 'p3'}}),
    flipTo('cpu', 'visited', LAND[3], {scope: {plate: 'p4'}}),
    flipTo('cpu', 'visited', LAND[4], {scope: {plate: 'p5'}}),
    // plate 6's screen lights when "Windows" takes control
    flipTo('monitor', 'on', LAND[4], {scope: {plate: 'p6'}}),
    ...S08_STATES,
  ],
  props: [
    ...press('button', A4.press),
    ...point('cpu', w('W0008'), sentence('S01').end),
    // "an Intel processor" points at the CPU (an outline tone step, never light)
    ...point('cpu', w('W0130'), w('W0132')),
    // plate 6: the screen lights as the Bit lands on "Windows"; the sign-in appears on "takes control"
    {part: 'monitor', prop: 'lit', at: LAND[4], dur: 8, from: 0, to: 1, ease: 'arrive', scope: {plate: 'p6'}},
    {part: 'monitor', prop: 'contentIn', at: w('W0086'), dur: 10, from: 0, to: 1, ease: 'arrive', scope: {plate: 'p6'}},
    ...S08_PROPS,
    ...press('button', A4.realPress),
  ],
  // the receiver reacts to each landing with a glow swell (ripple only: no state or glyph change, A4)
  glow: [
    {at: A4.press, holder: 'chipset.lookout', swellAt: [A4.ffBitLand]},
    {at: A4.qWakes, holder: 'chipset.q'},
    {at: RETURN, holder: 'chipset.lookout', swellAt: [A4.s04Land, w('W0139')]},
  ],
  bits: [
    // the episode's first press gives the Bit its SIGNATURE birth (the logo's three magenta pixels, 3.5×)
    // round 4 (judges: start the logo's pixels with the press): the signature birth starts on the press itself
    bit('ff', {scope: 'world', kind: 'preview', restFrom: A4.press, birth: 'signature', hops: [{route: 'pwrbtn', depart: A4.ffBitDepart, land: A4.ffBitLand, receiver: LOOKOUT}]}),
    bit('s04', {scope: 'world', kind: 'demo', restFrom: A4.s04Depart - 4, hops: [{route: 'pwrbtn', depart: A4.s04Depart, land: A4.s04Land, receiver: LOOKOUT}]}),
    CHAIN.bit,
    // round 4, the bookend: the real press's Bit departs with the logo's three pixels re-formed behind it
    bit('real', {scope: 'world', kind: 'real', trailSignature: true, hops: [{route: 'pwrbtn', depart: A4.realPress + 1, land: A4.nextLand, allowLong: true, decel: 2}]}),
  ],
  routes: [
    // the stage's own link holds a lit level while that stage is active (code from the flash, then the loader)
    {route: 'spi', kind: 'hold', at: LAND[2], to: LAND[3], scope: {plate: 'p4'}},
    {route: 'nvme', kind: 'hold', at: LAND[3], to: LAND[4], scope: {plate: 'p5'}},
    {route: 'pwrbtn', kind: 'ink', at: w('W0036'), to: sentence('S03').end + 1, range: 'cable'},
    // while Lens #2 opens on the lookout, the line it watches is pointed at: the button's trace ends on its pad
    {route: 'pwrbtn', kind: 'point', at: w('W0061'), to: A4.handOverSettle},
    {route: 'wakeNet', kind: 'draw', at: NOTICE},
    {route: 'wakeNet2', kind: 'draw', at: NOTICE + 2},
    {route: 'wakeClock', kind: 'draw', at: NOTICE + 4},
    {route: 'pwrbtn', kind: 'point', at: NOTICE, to: WAKE_SETTLE},
    ...(['wakeNet', 'wakeNet2', 'wakeClock'] as const).map((route) => ({route, kind: 'settle' as const, at: WAKE_SETTLE})),
  ],
  channels: [
    {channel: 'main', kind: 'point', at: w('W0040'), to: w('W0042', -2)},
    {channel: 'main', kind: 'fill', at: LAND[0], speed: 25, scope: {plate: 'p2'}},
    // the narrated flow runs as a trickle (sparse pale dashes inside the thin line)
    {channel: 'standby', kind: 'shimmer', at: w('W0145'), to: sentence('S11').end, style: 'trickle'},
    {channel: 'main', kind: 'point', at: w('W0143'), to: SPLIT_AT - 2},
  ],
  // laid over the parts (the domain's top lies inside the chipset), on "enough", once the fold has finished
  washes: [{domain: 'standbyDomain', at: w('W0165'), mode: 'over'}],
  tags: [
    // S01–S02 (left rail: key bars aligned at x 563, leaders run right to the CPU)
    tag('button1', 'Power button', {role: 'part', anchor: 'button.right', slot: {hook: [1404, 664], openLean: [1270, 815]}, word: 'W0004', exitAt: held('S01')}),
    tag('mainCpu', 'Main processor', {role: 'part', anchor: 'cpu.tagLeft2', slot: [184, 206], side: 'left', word: 'W0008', exitAt: RETURN + 4}),
    tag('notFirst', 'Not first', {role: 'part', anchor: [650, 372], slot: [362, 284], side: 'left', word: 'W0010', exitAt: RETURN + 4}),
    // the Lens's subject, leaderless under the ring, on "smaller"; it leaves as the Lens closes
    // round 4, one name per object: the "?" block is the "Hidden processor" everywhere; here it lands on "never heard of"
    tag('smaller', 'Hidden\nprocessor', {role: 'part', anchor: 'chipset.block:q.center', slot: [1300, 652], leaderless: true, word: 'W0024', exitAt: L1_CLOSE, holdWaiver: 'the flash-forward and its Lens end at f327-f331'}),
    // S03
    tag('button2', 'Power button', {role: 'part', anchor: 'button.right', slot: {openLean: [1270, 815], power: [1400, 700]}, word: 'W0033', exitAt: held('S03')}),
    // stays while the S04 demonstration Bit climbs the lead and crosses the header
    tag('signal', 'Signal only', {role: 'info', anchor: [1010, 798], slot: {power: [1400, 596], chip: [1440, 560]}, word: 'W0037', exitAt: A4.s04Depart + 12}),
    // S04–S05: ONE tag on one leader. Round 4, one name per object: the block's NAME is "Lookout" (on "lookout"); before
    // the voice names it, the tag says what the voice says, "Stays awake", over the block's technical name in mono
    // ("always-on logic", the same subline the "First" mark carried); the step keeps the subline
    tag('lookout', 'Stays awake', {
      role: 'part',
      anchor: 'chipset.block:lookout.left',
      slot: {chip: [528, 400], board: [250, 540]},
      side: 'left',
      word: 'W0053',
      secondary: 'always-on logic',
      steps: [{at: w('W0065', -3), text: 'Lookout', secondary: 'always-on logic', role: 'annotation'}],
      exitAt: PEEL - 5,
      holdWaiver: 'the chain peels from the lookout at f712 (its plate carries the eye on); round 4: gone in the pause before it',
    }),
    tag('hiddenName', 'Hidden processor', {
      role: 'emphasis',
      anchor: [880, 552],
      slot: [1060, 474],
      word: 'W0066',
      exitAt: PEEL - 5,
      holdWaiver: 'the chain peels at f712; S07 names it again ("Hidden processor") at f958',
    }),
    // S07: on "processor," as the push settles, a clear 48 px below the PCIe slot at both framings
    tag('hidden', 'Hidden\nprocessor', {role: 'part', anchor: [876, 576], slot: {chip: [1480, 362], ask: [1056, 590]}, word: 'W0093', exitAt: held('S07')}),
    tag('oneTap', 'One tap', {role: 'info', anchor: 'button.right', slot: [1110, 846], word: 'W0097', exitAt: held('S07')}),
    tag('signIn', 'Sign-in\nscreen', {role: 'part', anchor: [1500, 583.6], slot: [1556, 566], word: 'W0101', exitAt: w('W0106', 6)}),
    // S08: the question heads both plates, centred under the gap between them, on its own small card
    tag('why', 'Why different?', {role: 'part', anchor: 'monitor.bottom', slot: [802, 776], leaderless: true, card: true, word: 'W0118', exitAt: S08_OUT}),
    // S09: "an Intel processor" names the CPU (with the outline tone step, never light)
    // round 4, one name per object: the CPU is the "Main processor" everywhere; "Intel" is its mono subline here
    tag('intelCpu', 'Main processor', {
      role: 'part',
      secondary: 'Intel',
      anchor: 'cpu.tagLeft2',
      slot: {desk: [200, 330], deskIntel: [184, 330]},
      side: 'left',
      word: 'W0130',
      exitAt: w('W0135', -6),
      holdWaiver: 'the stops take the right of the frame on "AMD"; the chip\'s scope line keeps "Intel desktop" on screen',
    }),
    // S10: every S10 label leaves before the triptych opens (its bands carry their own captions)
    tag('standby', 'Standby power', {role: 'standby', anchor: [676, 775], slot: {standby: [372, 600]}, side: 'left', word: 'W0142', exitAt: SPLIT_AT - 7, holdWaiver: 'the triptych takes the frame; every band shows the same line, live or drained'}),
    tag('psuName', 'Power supply', {role: 'part', anchor: 'psu.center', slot: {standby: [836, 708]}, leaderless: true, word: 'W0148', exitAt: SPLIT_AT - 7, holdWaiver: 'the triptych takes the frame (held 43 frames; round 4: every S10 label is gone before the centre card lifts)'}),
    // S11: the domain's own outline, on "motherboard" once the camera has settled on it
    tag('domain', 'Standby-powered', {role: 'standby', anchor: [652, 712], slot: {column: [650, 443], wake: [377, 560]}, side: 'left', word: 'W0168', exitAt: held('S11')}),
    // left of both source badges, one leader to each badge's left edge (a fork that reads at 390 px)
    tag('wake', 'Wake sources', {role: 'info', anchor: [546, 520], moreAnchors: [[519, 436]], slot: [196, 300], side: 'left', word: 'W0172', exitAt: held('S11')}),
  ],
  pills: [
    // right of the vents, inside the supply's body
    pill('mainPower', 'Main power: OFF', {part: 'psu', dock: {world: [600, 861]}, word: 'W0040', exitAt: sentence('S04').end + 1}),
    // under the supply, centred on its main-rail exit (clear of the button's trace and the header)
    // round 4, one name per concept: "Main power: OFF" everywhere (never "Main rails")
    pill('mainRails', 'Main power: OFF', {part: 'psu', dock: {world: [579, 926]}, word: 'W0143', exitAt: SPLIT_AT - 7}),
  ],
  // the readout leaves with the S01 tags as the return starts
  readouts: [{id: 'zero', value: '0', unit: 'instructions', slot: [237, 360], word: 'W0017', exitAt: RETURN + 4}],
  glyphs: GLYPHS,
  lenses: [
    {
      id: 'L1',
      center: {screen: [1440, 430]},
      d: 400,
      mode: 'magnify',
      k: 4,
      focus: 'chipset.block:q.center',
      target: 'chipset.block:q.right',
      leaderAt: w('W0019', -12),
      openAt: w('W0019', -3),
      closeAt: L1_CLOSE,
      chip: '×4',
    },
    {
      id: 'L2',
      // lower right of the lookout, so its leader is a clear diagonal and the "?"'s name fits above it; ink (magenta is
      // the "?"'s)
      center: {screen: [1420, 720]},
      d: 380,
      mode: 'magnify',
      k: 4,
      focus: 'chipset.block:lookout.center',
      target: 'chipset.block:lookout.right',
      tone: 'ink',
      leaderAt: L2_OPEN - 8,
      openAt: L2_OPEN,
      settleAt: A4.handOverSettle,
      closeAt: L2_CLOSE,
      chip: '×4',
    },
  ],
  // S06 and S08: the world steps back before the first peel and comes forward as the plates fly home
  scrims: [
    // round 4 (judges: the plates took off over a world that had not been dimmed): the world steps back BEFORE the first
    // peel (to 12 %, in the pause after "processor."), then to the full 45 % as the plates arrive (the plates' own ground
    // keeps every frame above the luma floor); it lifts once the last hero is home
    // (round 4 measured: the plates' own ground keeps the frame above the luma floor, so the deeper step lifts as the
    // cards dissolve on the way home, and the first step lifts once the last hero is home)
    {at: PEEL - 10, outAt: CHAIN_HOME - 8, inDur: 12, alpha: 0.12},
    {at: PEEL + 4, outAt: BACK, inDur: 30, alpha: 0.375},
    {at: w('W0106'), outAt: S08_HOME + 4, inDur: 14, alpha: 0.15},
  ],
  plates: [...CHAIN.plates, ...S08_PLATES, ...STOP_PLATES],
  rows: [CHAIN.row],
  splits: [
    {
      kind: 'triptych',
      at: SPLIT_AT,
      foldAt: FOLD_AT,
      // every band shows the standby path recomposed at band size; the centre band lifts from that world region
      content: {
        scene: STANDBY_PATH_SCENE,
        shot: STANDBY_PATH_SHOT,
        glow: {'chipset.lookout': 'lookout'},
        source: STANDBY_PATH_SOURCE,
        // round 4 (judges: blank cards at the open and the fold, three supplies overlapping): the band's parts ARE the
        // world's; they travel between the world and the centre band, so the card is never empty
        carry: [
          {scenePart: 'socket', worldPart: 'socket'},
          {scenePart: 'cord', worldPart: 'cord'},
          {scenePart: 'plug', worldPart: 'plug'},
          {scenePart: 'psu', worldPart: 'psu'},
          {scenePart: 'lookout', worldPart: 'chipset', block: 'lookout'},
        ],
        carryChannels: [{sceneChannel: 'standby', worldChannel: 'standby'}],
      },
      // the present's conditions, said by the voice, in the centre band (opposite each what-if's caption)
      centerCaptions: [
        {text: 'Plugged in', at: w('W0154')},
        {text: 'Rear switch on', at: w('W0158')},
      ],
      bands: [
        {
          side: 'left',
          caption: {text: 'Unplugged', at: w('W0154')},
          outcome: {text: 'Dark', at: UNPLUG_DARK, scenePt: BAND_OUTCOME_AT},
          // round 4 (judges: the cause was 3–5 px on a phone): a coral cross on the gap the pulled plug leaves
          marks: [{kind: 'cross', at: w('W0154', 10), scenePt: BAND_GAP_AT as unknown as readonly [number, number], size: 34}],
          props: [
            {part: 'plug', prop: 'seated', at: w('W0154', 2), dur: 8, from: 1, to: 0, ease: 'move'},
            {part: 'cord', prop: 'seated', at: w('W0154', 2), dur: 8, from: 1, to: 0, ease: 'move'},
          ],
          channels: [{channel: 'standby', kind: 'drain', at: w('W0154', 10), speed: 9}],
          states: [flipTo('lookout', 'off', UNPLUG_DARK)],
        },
        {
          side: 'right',
          caption: {text: 'Rear switch off', at: w('W0158')},
          outcome: {text: 'Dark', at: SWITCH_DARK, scenePt: BAND_OUTCOME_AT},
          // round 4: an ink ring round the rocker as it flips to O
          marks: [{kind: 'ring', at: w('W0159'), scenePt: BAND_ROCKER_AT as unknown as readonly [number, number], size: 84}],
          props: [{part: 'psu', prop: 'rocker', at: w('W0159'), dur: 3, from: 'I', to: 'O'}],
          channels: [{channel: 'standby', kind: 'drain', at: w('W0159', 5), speed: 9}],
          states: [flipTo('lookout', 'off', SWITCH_DARK)],
        },
      ],
    },
  ],
  field: [{kind: 'timeBreath', at: BACK}],
  standby: {start: w('W0142'), end: sentence('S11').end},
  lastFrame: A4.lastFrame,
};

export const SCRIPT = buildScript(input, WORLD);
