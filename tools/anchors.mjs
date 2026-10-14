#!/usr/bin/env node
// Print the kit's computed timing and check it against the printed tables.
//
//   node tools/anchors.mjs [--md]
//
// Bundles src/shared/timing.ts with esbuild (the same code the compositions run), then checks:
//   - ANCHORS against the A4 table in docs/prompts/_shared_part_A.md
//   - SENTENCES against the A3 beat sheet
//   - WORD_CUES against the brand spec §6.5
//   - every intro word's sentence number in the JSON against the S01–S12 spans
// Exit code 1 if an A4 anchor or a beat-sheet span differs.
import path from 'node:path';
import {createRequire} from 'node:module';
import esbuild from 'esbuild';
import {ROOT} from './_common.mjs';

const md = process.argv.includes('--md');
const out = esbuild.buildSync({
  entryPoints: [path.join(ROOT, 'src/shared/timing.ts')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  loader: {'.json': 'json'},
  logLevel: 'silent',
});
const mod = {exports: {}};
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, createRequire(import.meta.url));
const T = mod.exports;

const A3 = {
  S01: [0, 127], S02: [137, 326], S03: [335, 427], S04: [436, 607], S05: [617, 706], S06: [717, 899],
  S07: [914, 1057], S08: [1068, 1236], S09: [1247, 1424], S10: [1438, 1670], S11: [1681, 1817], S12: [1830, 1850],
};

let bad = 0;
const line = (cells) => (md ? `| ${cells.join(' | ')} |` : cells.map((c, i) => String(c).padEnd([20, 7, 7, 26, 12, 46][i] ?? 10)).join(' '));

console.log(md ? '\n### Anchors (A4)\n' : '\nANCHORS (A4 table vs computed)');
console.log(line(['key', 'frame', 'A4', 'from', 'words', 'event']));
if (md) console.log('|---|---|---|---|---|---|');
for (const r of T.ANCHOR_TABLE) {
  const ok = r.table === null || r.table === r.frame;
  if (!ok) bad++;
  console.log(line([r.key, r.frame, r.table === null ? '—' : ok ? `${r.table} ✓` : `${r.table} ✗`, r.source, r.words, r.event]));
}

console.log(md ? '\n### Sentences (A3)\n' : '\nSENTENCES (A3 beat sheet vs computed)');
console.log(md ? '| beat | words | frames | A3 | text |\n|---|---|---|---|---|' : '');
for (const s of T.SENTENCE_LIST) {
  const [a, b] = A3[s.id];
  const ok = a === s.start && b === s.end;
  if (!ok) bad++;
  const text = s.text.length > 60 ? s.text.slice(0, 57) + '…' : s.text;
  console.log(md ? `| ${s.id} | ${s.first}–${s.last} | ${s.start}–${s.end} | ${ok ? '✓' : `✗ ${a}–${b}`} | ${text} |` : `${s.id} ${s.first}-${s.last}  f${s.start}-f${s.end}  ${ok ? 'ok' : `MISMATCH A3 ${a}-${b}`}  ${text}`);
}

console.log(md ? '\n### Word cues (brand spec §6.5)\n' : '\nWORD_CUES (brand §6.5 vs computed)');
const notes = [];
for (const [k, v] of Object.entries(T.WORD_CUES)) {
  const spec = T.WORD_CUES_SPEC[k];
  if (spec !== undefined && spec !== v) notes.push(`${k}: computed ${v}, §6.5 says ${spec}`);
}
console.log(Object.entries(T.WORD_CUES).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log(notes.length ? `differences: ${notes.join('; ')}` : 'all match');

let sentErr = 0;
for (const s of T.SENTENCE_LIST) {
  for (const w of T.wordsBetween(s.first, s.last)) if (w.sentence !== Number(s.id.slice(1))) sentErr++;
}
console.log(`\nword JSON sentence numbers vs spans: ${sentErr === 0 ? 'consistent' : `${sentErr} words disagree`}`);
console.log(`pauses ≥ 250 ms: ${T.PAUSES.map((p) => `f${p.from}–${p.to - 1} (${p.ms} ms)`).join(', ')}`);
console.log(`\n${bad === 0 ? 'OK: every tabled anchor and beat matches the word JSON' : `${bad} MISMATCH(ES)`}`);
process.exit(bad === 0 ? 0 : 1);
