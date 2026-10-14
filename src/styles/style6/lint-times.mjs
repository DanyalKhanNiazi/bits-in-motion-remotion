#!/usr/bin/env node
// Signal Atlas episode lint (round 1): an episode's script must DERIVE every time from the narration — a word's start
// or end (w, wEnd), a sentence span (sentence), a shared A4 deadline (A4.*) — plus small offsets. A bare frame number
// in a time field is a hand-tuned value that breaks the moment the narration is re-cut, so it is reported here.
//
//   node src/styles/style6/lint-times.mjs            (checks every src/styles/style6/ep*/script.ts)
//   node src/styles/style6/lint-times.mjs path.ts    (checks one file)
//
// Exit code 1 when something is found. Durations (`dur`), offsets inside w()/wEnd() and coordinates are not times and
// are never reported.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TIME_KEYS = [
  'at', 'to', 'exitAt', 'outAt', 'drawAt', 'depart', 'land', 'peelAt', 'returnAt', 'restFrom', 'fadeAt', 'settleAt',
  'chipAt', 'contentAt', 'leaderAt', 'openAt', 'closeAt', 'foldAt', 'expandAt', 'ruleAt', 'lockAt', 'spinAt', 'start',
  'end', 'lastFrame', 'pulseAt', 'diveAt', 'surfaceAt', 'swellAt',
  // round 2
  'clearAt', 'offAt', 'onAt', 'ghostAt', 'secondaryAt',
];
// a time key followed by a bare number (an array only for swellAt: `to: [1476, 518]` is an arc's anchor, not a time)
const KEY_RE = new RegExp(`\\b(${TIME_KEYS.join('|')})\\s*:\\s*(\\d{2,})\\b|\\b(swellAt)\\s*:\\s*\\[\\s*(\\d{2,})\\b`, 'g');
const CALL_RE = /\b(chip|flipTo|press|point)\s*\(([^)]*)\)/g;

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : fs
      .readdirSync(HERE, {withFileTypes: true})
      .filter((d) => d.isDirectory() && /^ep\d+/.test(d.name))
      .map((d) => path.join(HERE, d.name, 'script.ts'))
      .filter((f) => fs.existsSync(f));

let problems = 0;
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((raw, i) => {
    const line = raw.replace(/\/\/.*$/, '');
    if (/^\s*\*/.test(raw) || /^\s*\/\*/.test(raw)) return;
    for (const m of line.matchAll(KEY_RE)) {
      problems++;
      console.log(`${path.relative(process.cwd(), file)}:${i + 1}: "${m[1] ?? m[3]}: ${m[2] ?? m[4]}" is a bare frame; derive it (w('W…'), sentence(…), A4.…)`);
    }
    for (const m of line.matchAll(CALL_RE)) {
      // the time argument: chip(at, …), flipTo(part, to, at, …), press(part, at), point(part, at, to)
      const args = m[2].split(',').map((x) => x.trim());
      const timeArgs = m[1] === 'chip' ? [args[0]] : m[1] === 'flipTo' ? [args[2]] : m[1] === 'press' ? [args[1]] : [args[1], args[2]];
      for (const a of timeArgs) {
        if (a && /^\d{2,}$/.test(a)) {
          problems++;
          console.log(`${path.relative(process.cwd(), file)}:${i + 1}: ${m[1]}(…${a}…) uses a bare frame; derive it`);
        }
      }
    }
  });
}
if (problems) {
  console.log(`${problems} bare frame${problems === 1 ? '' : 's'} found`);
  process.exit(1);
}
console.log(`lint-times: ${files.length} script${files.length === 1 ? '' : 's'} checked, every time is derived from the narration`);
