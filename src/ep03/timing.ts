// Episode 03 word clock. All frames are ABSOLUTE film frames (30 fps) from the locked recording's transcript.
import timeline from '../../public/ep03/timeline.json';
export const FPS = 30;
export const TOTAL = 18367;
export type Word = {id: string; text: string; start: number; end: number};
export type Para = {id: string; n: number; start: number; end: number; text: string; words: Word[]};
export const PARAS: Para[] = (timeline as any).paragraphs.map((p: any, i: number) => ({
  id: p.id, n: i + 1, start: p.start, end: p.end, text: p.text,
  words: p.words.map((w: any) => ({id: w.id, text: w.text, start: w.start_frame, end: w.end_frame})),
}));
export const P = (n: number): Para => {
  const p = PARAS[n - 1];
  if (!p) throw new Error(`no paragraph ${n}`);
  return p;
};
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9']+/g, ' ').trim();
/** Start/end frames of the nth occurrence of `phrase` (whole words, case/punctuation-insensitive) in paragraph n. Throws if absent. */
export const at = (n: number, phrase: string, nth = 1): {start: number; end: number} => {
  const want = norm(phrase).split(' ').filter(Boolean);
  const ws = P(n).words.map((w) => ({...w, k: norm(w.text)})).filter((w) => w.k !== '');
  let hit = 0;
  for (let i = 0; i + want.length <= ws.length; i++) {
    let ok = true;
    for (let j = 0; j < want.length && ok; j++) ok = ws[i + j].k.replace(/ /g, '') === want[j];
    if (ok && ++hit === nth) return {start: ws[i].start, end: ws[i + want.length - 1].end};
  }
  throw new Error(`phrase not found in P${n}: "${phrase}" #${nth}`);
};
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
