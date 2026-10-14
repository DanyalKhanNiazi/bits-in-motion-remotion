/**
 * S2 data: the tokens, their IDs and every word anchor (absolute frames). All timing comes from at() / P().
 */
import {at, P} from '../../timing';

/** o200k_base pieces of the title question (leading spaces trimmed on the tiles, as the kit does). */
export const TOKENS = ['Why', 'do', 'AI', 'answers', 'arrive', 'one', 'piece', 'at', 'a', 'time', '?'] as const;
/** o200k_base IDs (verified with tiktoken 0.9.0). */
export const IDS = [13903, 621, 20837, 14716, 18338, 1001, 9047, 540, 261, 1058, 30] as const;
/** Real o200k_base entries near "Why" (13903): plain English ones only, spaces trimmed (verified with tiktoken 0.9.0). */
export const RIFFLE: ReadonlyArray<[number, string]> = [
  [13890, 'destroy'],
  [13891, 'employee'],
  [13897, 'fish'],
  [13898, 'served'],
  [13899, 'Timer'],
  [13901, 'second'],
  [13902, 'game'],
  [13903, 'Why'],
];

const s = (p: number, w: string, n = 1) => at(p, w, n).start;
const e = (p: number, w: string, n = 1) => at(p, w, n).end;

export const FROM = P(3).start; // 1582
export const TO = P(5).start; // 2811

export const A = {
  first: s(3, 'first'),
  read: s(3, 'read'),
  words: s(3, 'words'),
  wayYouDo: s(3, 'the way you do'),
  youDoEnd: e(3, 'the way you do'),
  tokenizer: s(3, 'tokenizer'),
  aTok: s(3, 'a tokenizer'),
  chops: s(3, 'chops'),
  pieces: s(3, 'pieces'),
  tokens: s(3, 'tokens'),
  tokensEnd: e(3, 'tokens'),
  swaps: s(3, 'swaps'),
  id: s(3, 'id'),
  number: s(3, 'number'),
  numberEnd: e(3, 'number'),
  from: s(3, 'from'),
  fixed: s(3, 'fixed'),
  models: s(3, "model's"),
  vocabulary: s(3, 'vocabulary'),
  vocabularyEnd: e(3, 'vocabulary'),
  with: s(3, 'with'),
  openai: s(3, "openai's"),
  tokenizer2End: e(3, 'tokenizer', 2),
  our: s(3, 'our'),
  ten: s(3, '10'),
  questionMark: s(3, 'question mark'),
  come: s(3, 'come out as'),
  eleven: s(3, '11'),
  numbers: s(3, 'numbers'),
  numbersEnd: e(3, 'numbers'),
  metas: s(3, "meta's"),
  llama: s(3, 'llamathe'),
  cuts: s(3, 'latercuts'),
  them: s(3, 'them'),
  same: s(3, 'same'),
  piecesEnd: e(3, 'pieces', 2),
  // P04
  here: s(4, 'here'),
  everyWord: s(4, 'every word'),
  word: s(4, 'word'),
  pieceEnd: e(4, 'piece'),
  but: s(4, 'but'),
  isnt: s(4, "isn't"),
  rule: s(4, 'rule'),
  photosynthesis: s(4, 'photosynthesis'),
  becomes: s(4, 'becomes'),
  two: s(4, 'two'),
  photos: s(4, 'photos'),
  synthesis: s(4, 'synthesis'),
  without: s(4, 'without'),
  first4: s(4, 'first'),
  letter: s(4, 'letter'),
  forEnglish: s(4, 'for english'),
  english: s(4, 'english'),
  openai4: s(4, "openai's"),
  thumb: s(4, 'thumb'),
  four: s(4, 'four'),
  characters: s(4, 'characters'),
  per: s(4, 'per'),
  token: s(4, 'token'),
  roughly: s(4, 'roughly'),
  three: s(4, 'three quarters'),
  aWord: s(4, 'a word'),
  wordEnd: e(4, 'a word'),
};
