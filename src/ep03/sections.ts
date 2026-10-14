import {P, TOTAL} from './timing';
// One section per builder. Boundaries are paragraph starts, so every cut sits on a paragraph break.
export const SECTIONS = [
  {id: 'S1', paras: [1, 2], title: 'Cold open: the race and the question'},
  {id: 'S2', paras: [3, 4], title: 'Tokens'},
  {id: 'S3', paras: [5, 6, 7], title: 'Scoring, the loop, streaming'},
  {id: 'S4', paras: [8, 9], title: 'Reading vs writing'},
  {id: 'S5', paras: [10, 11, 12], title: 'Weights and the bridge'},
  {id: 'S6', paras: [13, 14, 15], title: 'The experiment and bandwidth'},
  {id: 'S7', paras: [16, 17, 18], title: 'The three waits'},
  {id: 'S8', paras: [19, 20], title: 'The tricks'},
  {id: 'S9', paras: [21, 22], title: 'Close: the callback'},
].map((s) => ({...s, from: P(s.paras[0]).start, to: s.paras[s.paras.length - 1] === 22 ? TOTAL : P(s.paras[s.paras.length - 1] + 1).start}));
export const SECTION = (id: string) => {
  const s = SECTIONS.find((x) => x.id === id);
  if (!s) throw new Error(`no section ${id}`);
  return s;
};
