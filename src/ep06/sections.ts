import {P, TOTAL} from './timing';
// One section per builder. Boundaries are paragraph starts, so every cut sits on a paragraph break.
export const SECTIONS = [
  {id: 'S1', paras: [1, 2], title: 'Cold open: gone? and the promise'},
  {id: 'S2', paras: [3, 4, 5], title: 'The Recycle Bin, the boxes and the cards, NTFS clusters'},
  {id: 'S3', paras: [6, 7], title: 'The Master File Table, and what emptying the bin does'},
  {id: 'S4', paras: [8, 9], title: 'Why recovery tools work, and why they fail'},
  {id: 'S5', paras: [10, 11, 12], title: 'Turn to the SSD: flash, housekeeping, TRIM'},
  {id: 'S6', paras: [13, 14], title: 'The drive clears the boxes: the recovery race (mid-film hero)'},
  {id: 'S7', paras: [15, 16, 17], title: 'The twist: overwriting works on a hard drive, misses on an SSD'},
  {id: 'S8', paras: [18, 19, 20], title: 'The strange reversal, sanitize, encryption'},
  {id: 'S9', paras: [21, 22], title: 'Close: the passport callback and the advice'},
].map((s) => ({...s, from: P(s.paras[0]).start, to: s.paras[s.paras.length - 1] === 22 ? TOTAL : P(s.paras[s.paras.length - 1] + 1).start}));
export const SECTION = (id: string) => {
  const s = SECTIONS.find((x) => x.id === id);
  if (!s) throw new Error(`no section ${id}`);
  return s;
};
