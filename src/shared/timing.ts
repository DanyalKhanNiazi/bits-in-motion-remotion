/**
 * Bits in Motion ep01 intro: absolute timing from the locked narration.
 *
 * Rule (Part A §A3): frame = Math.round(ms * 30 / 1000) from the word JSON. All timing is absolute:
 * no cumulative durations, no "previous scene ends + N". Frame 0 is the narration start.
 */
import rawWords from '../../public/data/ep01_words.json';

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
/** 63.000 s = 1890 frames, f0–f1889. */
export const DURATION = 1890;
export const LAST_FRAME = DURATION - 1;

/* ------------------------------------------------------------------------------------------------
 * Words
 * ---------------------------------------------------------------------------------------------- */

export interface Word {
  /** "W0001" … "W1799". The intro is W0001–W0180. */
  id: string;
  /** The recorded word as transcribed (punctuation attached). */
  text: string;
  start_ms: number;
  end_ms: number;
  line: number;
  /** Episode-wide sentence number (the intro is sentences 1–12). */
  sentence: number;
}

export interface WordsMeta {
  source_audio: string;
  source_srt: string;
  note: string;
  audio_duration_ms: number;
  word_count: number;
  sentences: number;
  intro_excerpt: {
    first_word: string;
    last_word: string;
    speech_start_ms: number;
    speech_end_ms: number;
    audio_out_ms: number;
    fade_out_ms: number;
    video_duration_frames_30fps: number;
  };
  [k: string]: unknown;
}

interface WordsFile {
  meta: WordsMeta;
  words: Word[];
}

const FILE = rawWords as unknown as WordsFile;

/** Every word of the episode (ms times), in order. */
export const WORDS: readonly Word[] = FILE.words;
export const WORDS_META: WordsMeta = FILE.meta;

const INDEX = new Map<string, number>(WORDS.map((w, i) => [w.id, i]));

export const INTRO_FIRST_WORD = 'W0001';
export const INTRO_LAST_WORD = 'W0180';
/** The 180 words of the intro excerpt. */
export const INTRO_WORDS: readonly Word[] = WORDS.slice(0, (INDEX.get(INTRO_LAST_WORD) ?? 179) + 1);

export const msToFrame = (ms: number): number => Math.round((ms * FPS) / 1000);
export const frameToMs = (frame: number): number => (frame * 1000) / FPS;
export const secondsToFrame = (s: number): number => Math.round(s * FPS);

/** The word with this id (throws on an unknown id, so a typo fails loudly). */
export const word = (id: string): Word => {
  const i = INDEX.get(id);
  if (i === undefined) throw new Error(`[kit] unknown word id "${id}"`);
  return WORDS[i];
};

/** Start frame of a word: Math.round(start_ms * 30 / 1000). */
export const wordStart = (id: string): number => msToFrame(word(id).start_ms);
/** End frame of a word: Math.round(end_ms * 30 / 1000). */
export const wordEnd = (id: string): number => msToFrame(word(id).end_ms);
export const wordText = (id: string): string => word(id).text;

/** Words a..b inclusive. */
export const wordsBetween = (a: string, b: string): Word[] => {
  const ia = INDEX.get(a);
  const ib = INDEX.get(b);
  if (ia === undefined || ib === undefined) throw new Error(`[kit] unknown word range ${a}–${b}`);
  return WORDS.slice(Math.min(ia, ib), Math.max(ia, ib) + 1) as Word[];
};
export const textBetween = (a: string, b: string): string =>
  wordsBetween(a, b)
    .map((w) => w.text)
    .join(' ')
    .replace(/ -/g, '-');

const norm = (s: string): string => s.toLowerCase().replace(/[^a-z0-9'-]/g, '');

/**
 * Find a word id by its text inside the intro (case- and punctuation-insensitive).
 * `after` starts the search after that id; `nth` picks the n-th match (1-based).
 * Example: findWord('signal') === 'W0047'.
 */
export const findWord = (text: string, opts: {after?: string; nth?: number; inIntro?: boolean} = {}): string => {
  const pool = opts.inIntro === false ? WORDS : INTRO_WORDS;
  const from = opts.after ? (INDEX.get(opts.after) ?? -1) + 1 : 0;
  let n = opts.nth ?? 1;
  const target = norm(text);
  for (let i = from; i < pool.length; i++) {
    if (norm(pool[i].text) === target) {
      n--;
      if (n === 0) return pool[i].id;
    }
  }
  throw new Error(`[kit] word "${text}" not found`);
};

/** The intro word being spoken at this frame (start <= frame < end), or null in a pause. */
export const wordAt = (frame: number): Word | null => {
  for (const w of INTRO_WORDS) {
    const s = msToFrame(w.start_ms);
    const e = msToFrame(w.end_ms);
    if (frame >= s && frame < e) return w;
    if (s > frame) break;
  }
  return null;
};

/** The last intro word that started at or before this frame. */
export const lastWordAt = (frame: number): Word | null => {
  let found: Word | null = null;
  for (const w of INTRO_WORDS) {
    if (msToFrame(w.start_ms) <= frame) found = w;
    else break;
  }
  return found;
};

/* ------------------------------------------------------------------------------------------------
 * Sentences S01–S12 (Part A §A3 beat sheet). start = wordStart(first), end = wordEnd(last).
 * ---------------------------------------------------------------------------------------------- */

export type SentenceId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'S10' | 'S11' | 'S12';

export interface Sentence {
  id: SentenceId;
  first: string;
  last: string;
  /** Start frame (first word's start). */
  start: number;
  /** End frame (last word's end), inclusive in the beat sheet. */
  end: number;
  startMs: number;
  endMs: number;
  text: string;
}

const SENTENCE_DEF: ReadonlyArray<readonly [SentenceId, string, string]> = [
  ['S01', 'W0001', 'W0012'],
  ['S02', 'W0013', 'W0030'],
  ['S03', 'W0031', 'W0041'],
  ['S04', 'W0042', 'W0060'],
  ['S05', 'W0061', 'W0069'],
  ['S06', 'W0070', 'W0087'],
  ['S07', 'W0088', 'W0103'],
  ['S08', 'W0104', 'W0121'],
  ['S09', 'W0122', 'W0137'],
  ['S10', 'W0138', 'W0161'],
  ['S11', 'W0162', 'W0178'],
  ['S12', 'W0179', 'W0180'],
];

export const SENTENCE_LIST: readonly Sentence[] = SENTENCE_DEF.map(([id, first, last]) => ({
  id,
  first,
  last,
  start: wordStart(first),
  end: wordEnd(last),
  startMs: word(first).start_ms,
  endMs: word(last).end_ms,
  text: textBetween(first, last),
}));

export const SENTENCES = Object.fromEntries(SENTENCE_LIST.map((s) => [s.id, s])) as Record<SentenceId, Sentence>;

/** The sentence being spoken at this frame (start <= frame <= end), or null in a pause or the tail. */
export const sentenceAt = (frame: number): Sentence | null =>
  SENTENCE_LIST.find((s) => frame >= s.start && frame <= s.end) ?? null;

/** The current beat: the latest sentence that has started by this frame (S01 for f0, S12 in the tail). */
export const beatAt = (frame: number): Sentence => {
  let b = SENTENCE_LIST[0];
  for (const s of SENTENCE_LIST) if (s.start <= frame) b = s;
  return b;
};

/* ------------------------------------------------------------------------------------------------
 * Pauses (for cuts on a pause, label exits, the D24 settle)
 * ---------------------------------------------------------------------------------------------- */

export interface Pause {
  /** The word before and after the pause. */
  after: string;
  before: string;
  /** First silent frame (= wordEnd(after) + 1) and the next word's start frame. */
  from: number;
  to: number;
  ms: number;
}

/** Gaps of 250 ms or more between intro words, plus the tail after "press.". */
export const PAUSES: readonly Pause[] = INTRO_WORDS.slice(0, -1)
  .map((w, i) => ({w, n: INTRO_WORDS[i + 1]}))
  .filter(({w, n}) => n.start_ms - w.end_ms >= 250)
  .map(({w, n}) => ({
    after: w.id,
    before: n.id,
    from: msToFrame(w.end_ms) + 1,
    to: msToFrame(n.start_ms),
    ms: n.start_ms - w.end_ms,
  }));

/* ------------------------------------------------------------------------------------------------
 * Shared anchors (Part A §A4), each computed from its word and checked against the A4 table.
 * ---------------------------------------------------------------------------------------------- */

export const ANCHORS = {
  /** f0: the cap is pressed on "Press" (cap travel #1 of 2). */
  press: wordStart('W0001'),
  /** "After the press" time chip (44 px) in by this frame. Not a word: a fixed deadline. */
  afterPressChipBy: 8,
  /** Flash-forward Bit departs the button "on 'power button'". A4 says f33: inside "power" (W0004, f29–f40).
   *  33 = land 59 − 26 (the same 26-frame run as S04). Not a word start; kept at 33. */
  ffBitDepart: 33,
  /** …and lands on the lookout on "and": ripple only, no glyph change, no park. */
  ffBitLand: wordStart('W0006'),
  /** "doesn't go first": the main processor stays dark. */
  notFirst: wordStart('W0010'),
  /** The "?" wakes on "already at work" (inside the flash-forward). The CPU never shows activity. */
  qWakes: wordStart('W0028'),
  /** Return to the present starts in the pause after "work." (first silent frame). */
  returnStart: wordEnd('W0030') + 1,
  /** S03 starts ("And"): the end of the return pause. */
  returnPauseEnd: wordStart('W0031'),
  /** Return complete by this frame: lookout ON (breathing), "?" dim with badge, CPU dark, main power OFF,
   *  "Soft-off" label. Not a word: a fixed deadline (11.53 s; "button" W0033 starts f344). */
  returnDoneBy: 346,
  /** Optional shared "When pressed" chip, f441–f519 (shared rules §1): on "sends" … "that". */
  whenPressedIn: wordStart('W0043'),
  whenPressedOut: wordStart('W0052'),
  /** S04 demonstration: Bit leaves the button on "signal" (no cap travel, no click)… */
  s04Depart: wordStart('W0047'),
  /** …and lands on the lookout on "small": ripple only, no state change. */
  s04Land: wordStart('W0050'),
  /** D24 hand-over: ring + ticks fade to a grey rim in the pause after "lookout," (f659–f670)… */
  handOverSettle: wordStart('W0066') - 8,
  handOverSettleEnd: wordStart('W0066') - 2,
  /** …then the "?" fills on "not". */
  handOver: wordStart('W0066'),
  /** S06 chain landings: "handoffs", "stage", "what", "needs", "Windows" (parks on "Windows"). */
  chain1: wordStart('W0075'),
  chain2: wordStart('W0077'),
  chain3: wordStart('W0079'),
  chain4: wordStart('W0083'),
  chain5: wordStart('W0085'),
  /** "Why different?" lands on "starting"… */
  whyDifferent: wordStart('W0118'),
  /** …and holds at least 48 frames (to this frame or later), into the f1237–f1246 pause. */
  whyDifferentHoldMin: wordStart('W0118') + 48,
  /** S09 stops exit in the pause after "power," (S10a): f1505–f1512 (shared rules: f1505–f1513). */
  stopsExitFrom: wordEnd('W0143') + 1,
  stopsExitTo: wordStart('W0144'),
  /** Brackets lock on the button on "like". */
  lock: wordStart('W0176'),
  /** "Now" chip. */
  nowChip: wordStart('W0179'),
  /** The real press: cap travel #2 and the Bit departs (about +2..4 frames). */
  realPress: wordStart('W0180'),
  /** Last frame: the Bit is still travelling. */
  lastFrame: LAST_FRAME,
  /** In the full episode the Bit would land on "power" (W0184), outside the intro. */
  nextLand: wordStart('W0184'),
};

export type AnchorKey = keyof typeof ANCHORS;

export interface AnchorRow {
  key: AnchorKey;
  frame: number;
  /** The frame printed in the A4 table (or the shared-rules file), or null when not tabled. */
  table: number | null;
  /** How it is computed. */
  source: string;
  /** The recorded words. */
  words: string;
  event: string;
}

const row = (key: AnchorKey, table: number | null, source: string, words: string, event: string): AnchorRow => ({
  key,
  frame: ANCHORS[key],
  table,
  source,
  words,
  event,
});

/** The A4 table, recomputed. `table` is what _shared_part_A.md prints. */
export const ANCHOR_TABLE: readonly AnchorRow[] = [
  row('press', 0, 'start W0001', 'Press', 'Cap pressed (travel #1)'),
  row('afterPressChipBy', 8, 'fixed', '—', '"After the press" chip in (44 px)'),
  row('ffBitDepart', 33, 'fixed (inside W0004 f29–40)', 'power button', 'Flash-forward Bit departs the button'),
  row('ffBitLand', 59, 'start W0006', 'and', 'Flash-forward Bit lands on lookout (ripple only)'),
  row('notFirst', 91, 'start W0010', "doesn't", 'Main processor stays dark'),
  row('qWakes', 294, 'start W0028', 'already', '"?" wakes (flash-forward)'),
  row('returnStart', 327, 'end W0030 + 1', '(pause)', 'Return to the present starts'),
  row('returnPauseEnd', 335, 'start W0031', 'And', 'Return pause ends (S03)'),
  row('returnDoneBy', 346, 'fixed', '—', 'Return complete ("Soft-off")'),
  row('whenPressedIn', 441, 'start W0043', 'sends', '"When pressed" chip in (optional)'),
  row('s04Depart', 472, 'start W0047', 'signal', 'S04 Bit departs (no cap travel)'),
  row('s04Land', 498, 'start W0050', 'small', 'S04 Bit lands on lookout (ripple only)'),
  row('whenPressedOut', 519, 'start W0052', 'that', '"When pressed" chip out'),
  row('handOverSettle', null, 'start W0066 − 8', '(pause)', 'D24: ring + ticks start fading to grey rim'),
  row('handOverSettleEnd', null, 'start W0066 − 2', '(pause)', 'D24: grey rim complete'),
  row('handOver', 671, 'start W0066', 'not', 'D24: "?" fills'),
  row('chain1', 748, 'start W0075', 'handoffs', 'S06 landing 1'),
  row('chain2', 781, 'start W0077', 'stage', 'S06 landing 2'),
  row('chain3', 808, 'start W0079', 'what', 'S06 landing 3'),
  row('chain4', 832, 'start W0083', 'needs,', 'S06 landing 4'),
  row('chain5', 860, 'start W0085', 'Windows', 'S06 landing 5; Bit parks'),
  row('whyDifferent', 1194, 'start W0118', 'starting', '"Why different?" lands'),
  row('whyDifferentHoldMin', 1242, 'start W0118 + 48', '—', '"Why different?" earliest exit'),
  row('stopsExitFrom', 1505, 'end W0143 + 1', '(pause)', 'S09 stops may exit from here'),
  row('stopsExitTo', 1513, 'start W0144', 'a', '…and must be gone by here'),
  row('lock', 1798, 'start W0176', 'like', 'Brackets lock on the button'),
  row('nowChip', 1830, 'start W0179', 'Now', '"Now" chip'),
  row('realPress', 1837, 'start W0180', 'press.', 'Real press (travel #2), Bit departs'),
  row('lastFrame', 1889, 'DURATION − 1', '—', 'Last frame: Bit still travelling'),
  row('nextLand', 1891, 'start W0184', 'power', 'Where the Bit would land (outside the intro)'),
];

/** Rows whose computed frame differs from the printed table (expected: none). */
export const ANCHOR_MISMATCHES: readonly AnchorRow[] = ANCHOR_TABLE.filter(
  (r) => r.table !== null && r.table !== r.frame,
);

/* ------------------------------------------------------------------------------------------------
 * Word cues used by the brand anchors (brand spec §6.5). Tags land on these (±3 frames).
 * ---------------------------------------------------------------------------------------------- */

export const WORD_CUES = {
  // S01
  press: wordStart('W0001'),
  powerButton: wordStart('W0004'),
  mainProcessor: wordStart('W0008'),
  doesntGoFirst: wordStart('W0010'),
  // S02
  smallerProcessor: wordStart('W0020'),
  alreadyAtWork: wordStart('W0028'),
  // S03
  buttonYouPressed: wordStart('W0033'),
  doesntSwitchPowerOn: wordStart('W0036'),
  // S04
  splitSecondSignal: wordStart('W0045'),
  signal: wordStart('W0047'),
  smallCircuit: wordStart('W0050'),
  staysAwake: wordStart('W0053'),
  evenWhileOff: wordStart('W0055'),
  // S05
  lookout: wordStart('W0065'),
  notTheHiddenProcessor: wordStart('W0066'),
  // S06
  chainOfHandoffs: wordStart('W0073'),
  untilWindows: wordStart('W0084'),
  windows: wordStart('W0085'),
  // S07
  hiddenProcessor: wordStart('W0092'),
  oneTap: wordStart('W0097'),
  signInScreen: wordStart('W0101'),
  // S08
  restart: wordStart('W0110'),
  shuttingDown: wordStart('W0115'),
  startingAgain: wordStart('W0118'),
  mightNot: wordStart('W0120'),
  // S09
  /** "typical" (W0125). Brand §6.5 prints 1262, which is the preceding "a" (W0124). */
  typicalDesktop: wordStart('W0125'),
  desktop: wordStart('W0127'),
  intel: wordStart('W0130'),
  amd: wordStart('W0135'),
  laptops: wordStart('W0137'),
  // S10
  thatLookout: wordStart('W0139'),
  standbyPower: wordStart('W0142'),
  smallTrickle: wordStart('W0145'),
  powerSupply: wordStart('W0148'),
  pluggedIn: wordStart('W0154'),
  rearSwitchIsOn: wordStart('W0158'),
  // S11
  justEnoughOfTheMotherboard: wordStart('W0164'),
  noticeAReason: wordStart('W0170'),
  likeThatButton: wordStart('W0176'),
  // S12
  now: wordStart('W0179'),
  pressReal: wordStart('W0180'),
};

/** Brand spec §6.5 values for WORD_CUES, for the check in tools/anchors.mjs. */
export const WORD_CUES_SPEC: Partial<Record<keyof typeof WORD_CUES, number>> = {
  press: 0,
  powerButton: 29,
  mainProcessor: 67,
  doesntGoFirst: 91,
  smallerProcessor: 206,
  alreadyAtWork: 294,
  doesntSwitchPowerOn: 365,
  splitSecondSignal: 453,
  signal: 472,
  smallCircuit: 498,
  staysAwake: 529,
  evenWhileOff: 551,
  lookout: 650,
  notTheHiddenProcessor: 671,
  chainOfHandoffs: 736,
  untilWindows: 853,
  windows: 860,
  hiddenProcessor: 950,
  oneTap: 999,
  signInScreen: 1036,
  restart: 1111,
  shuttingDown: 1166,
  startingAgain: 1194,
  mightNot: 1216,
  typicalDesktop: 1262,
  amd: 1382,
  laptops: 1408,
  standbyPower: 1475,
  smallTrickle: 1519,
  powerSupply: 1547,
  pluggedIn: 1610,
  rearSwitchIsOn: 1639,
  justEnoughOfTheMotherboard: 1695,
  noticeAReason: 1746,
  likeThatButton: 1798,
  now: 1830,
  pressReal: 1837,
};

/* ------------------------------------------------------------------------------------------------
 * Label timing helpers (brand spec §4.4)
 * ---------------------------------------------------------------------------------------------- */

export const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;

/**
 * Earliest frame a tag that lands at `land` may start its exit:
 * at least 30 + 9 x words frames after landing, and at least 15 frames after its sentence ends.
 * The sentence defaults to the beat in which the tag lands.
 */
export const minTagExit = (land: number, text: string, sentence?: SentenceId): number => {
  const s = sentence ? SENTENCES[sentence] : beatAt(land);
  return Math.max(land + 30 + 9 * countWords(text), s.end + 15);
};

/** Frames of a span in seconds, for display. */
export const fmtFrame = (f: number): string => `f${f} (${(f / FPS).toFixed(2)} s)`;
