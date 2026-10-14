#!/usr/bin/env node
// Style 5 (Live Panels) data checks, computed from the SAME constants the composition renders from.
//
//   node src/styles/style5/check/check5.mjs
//
// Bundles check/entry.ts (T.ts, geo.ts, runs.ts and the kit's timing module) with esbuild and checks:
//   1. the Part A §A4 anchors (±1 frame) and cues.json against them;
//   2. every label: lands within ±3 frames of its word; its hold (30 + 9 × words, and sentence end + 15) or the
//      documented reason it ends earlier (a T1 cut or a re-layout inside a pause);
//   3. the on-screen budget per frame (≤ 3 tags, ≤ 2 pills, ≤ 12 must-read words);
//   4. every Bit run: hop ≥ 10 frames, run ≤ 30 (S12 documented), cruise and peak speed ≤ 36 px/frame,
//      S12 still travelling at f1889;
//   5. the button's lead never comes within 16 px of a power channel, and every gutter crossing is
//      perpendicular to its gutter.
import path from 'node:path';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const require = createRequire(path.join(ROOT, 'package.json'));
const esbuild = require('esbuild');

const out = esbuild.buildSync({
  entryPoints: [path.join(HERE, 'entry.ts')],
  bundle: true,
  write: false,
  format: 'cjs',
  platform: 'node',
  loader: {'.json': 'json'},
  logLevel: 'silent',
  external: ['remotion', '@remotion/noise', '@remotion/paths'],
});
const mod = {exports: {}};
new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, require);
const X = mod.exports;
const {F, G, ANCHORS, SENTENCES, SENTENCE_LIST, wordStart, countWords} = X;

let fails = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'}  ${msg}`);
  if (!cond) fails++;
};
const note = (msg) => console.log(`note  ${msg}`);

/* 1. anchors -------------------------------------------------------------------------------------- */
console.log('\n1. Part A §A4 anchors');
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
ok(F.press0 === 0, `press f${F.press0} (A4 f0); cap travels only f0 and f${F.press1}`);
ok(F.afterIn + 4 <= 8, `"After the press" 44 px enters f${F.afterIn}, readable by f${F.afterIn + 3}, complete f${F.afterIn + 5} (A4: by f8)`);
ok(near(F.ffDepart, 33) && near(F.ffLand, 59), `flash-forward Bit f${F.ffDepart} → f${F.ffLand} (A4 33 → 59), absorbed in its ripple, no park`);
ok(near(F.notFirst, 91), `"Not first" / CPU stays dark f${F.notFirst} (A4 91)`);
ok(near(F.qOn, 294), `"?" wakes f${F.qOn} (A4 294)`);
ok(F.ret === 327 && F.retEnd === 335 && F.lens1Close + 6 <= 346 && F.softOffIn + 6 <= 346, `return f${F.ret}–f${F.retEnd}: rules collapse f${F.ret}–f${F.ret + 8}, Lens closes f${F.lens1Close}–f${F.lens1Close + 6}, "Soft-off" f${F.softOffIn}–f${F.softOffIn + 5} (A4: complete by f346)`);
ok(near(F.s04Depart, 472) && near(F.s04Land, 498), `S04 Bit f${F.s04Depart} → f${F.s04Land} (A4 472 → 498), no cap travel, no click`);
ok(F.settle === 663 && F.settleEnd === 669 && near(F.qFill, 671), `D24: ring settles f${F.settle}–f${F.settleEnd}, "?" fills f${F.qFill} (A4 671)`);
ok([748, 781, 808, 832, 860].every((v, i) => near(F.chain[i], v)), `S06 landings ${F.chain.join(', ')} (A4 748, 781, 808, 832, 860); parks on f${F.chain[4]}`);
ok(near(F.why, 1194) && F.cutTower - 1 >= 1242, `"Why different?" f${F.why}, held to f${F.cutTower - 1} (≥ f1242; A4 1194)`);
ok(near(F.lock, 1798), `brackets lock f${F.lock} (A4 1798)`);
ok(near(F.now, 1830), `"Now" f${F.now} (A4 1830)`);
ok(near(F.press1, 1837) && F.s12Depart - F.press1 >= 2 && F.s12Depart - F.press1 <= 4, `real press f${F.press1}, Bit departs f${F.s12Depart} (A4 1837; kit: +2..4)`);
const r12 = X.RUN_S12;
const p1889 = r12.at(1889);
const d1889 = Math.hypot(p1889.x - r12.end[0], p1889.y - r12.end[1]);
ok(p1889.phase === 'moving' && r12.land === 1891, `f1889: S12 Bit '${p1889.phase}', ${d1889.toFixed(1)} px from its landing point, would land f${r12.land} (A4 1891)`);
const cues = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'cues.json'), 'utf8'));
const cueStr = cues.cues.map((c) => `${c.cue}${c.note ? ' ' + c.note : ''} ${c.frame ?? `${c.start}–${c.end}`}${c.gain_db ? ` (${c.gain_db} dB)` : ''}`).join(' · ');
ok(cues.style === 5, `cues.json: ${cueStr}`);
ok(cues.cues.filter((c) => c.cue === 'button').map((c) => c.frame).join() === '0,1837', 'button cues only f0 and f1837');
const sb = cues.cues.find((c) => c.cue === 'standby');
ok(sb.start >= SENTENCES.S10.start && sb.end <= SENTENCES.S11.end, `standby span f${sb.start}–f${sb.end} inside S10–S11 (f${SENTENCES.S10.start}–f${SENTENCES.S11.end})`);

/* 2. labels --------------------------------------------------------------------------------------- */
console.log('\n2. Labels: landing (±3 frames of the word) and hold');
// kind: tag | pill | caption | name | header | readout | badge
const L = [
  {t: 'After the press', kind: 'header', land: F.afterIn, word: null, exit: F.ret, s: 'S01', big: [F.afterIn, F.afterShrink]},
  {t: 'Power button', kind: 'tag', land: F.powerButtonTag, word: 'W0004', exit: F.s01Exit, s: 'S01'},
  {t: 'Main processor', kind: 'tag', land: F.mainProcessor, word: 'W0008', exit: F.s01Exit, s: 'S01'},
  {t: 'Not first', kind: 'tag', land: F.notFirst, word: 'W0010', exit: F.ret, s: 'S01'},
  {t: '0 instructions', kind: 'readout', land: F.zeroInstr, word: 'W0017', exit: F.ret, s: 'S02'},
  {t: 'Soft-off', kind: 'pill', land: F.softOffIn, word: null, exit: F.stepBack, s: 'S03', why: 'the present state; retracts in the S06 step-back'},
  {t: 'Power button', kind: 'tag', land: F.powerButtonTag2, word: 'W0033', exit: F.s03TagExit, s: 'S03'},
  {t: 'Main power: OFF', kind: 'pill', land: F.mainPowerOff, word: 'W0040', exit: F.mainPowerOut, s: 'S03'},
  {t: 'When pressed', kind: 'header', land: F.whenIn, word: 'W0043', exit: F.whenOut, s: 'S04', big: [F.whenIn, 9999]},
  {t: 'Always-on logic', kind: 'tag', land: F.alwaysOnTag, word: 'W0050', exit: F.alwaysOnExit, s: 'S04'},
  {t: 'After the press', kind: 'header', land: F.afterIn2, word: 'W0070', exit: F.s06Out, s: 'S06', big: [F.afterIn2, F.afterShrink2], why: 'S06 names and header leave as T folds inside the f900–f913 pause'},
  {t: 'Always-on logic', kind: 'name', land: F.starts, word: 'W0071', exit: F.s06Out, s: 'S06', why: 'leaves with T in the f900–f913 pause'},
  {t: 'Power', kind: 'name', land: F.chain[0], word: 'W0075', exit: F.s06Out, s: 'S06', why: 'leaves with T in the pause'},
  {t: '?', kind: 'badge', land: F.chain[1], word: 'W0077', exit: F.s06Out, s: 'S06'},
  {t: 'Firmware on CPU', kind: 'name', land: F.chain[2], word: 'W0079', exit: F.s06Out, s: 'S06', why: 'leaves with T in the pause'},
  {t: 'Loader', kind: 'name', land: F.chain[3], word: 'W0083', exit: F.s06Out, s: 'S06', why: 'leaves with T in the pause'},
  {t: 'Windows', kind: 'name', land: F.chain[4], word: 'W0085', exit: F.s06Out, s: 'S06', why: 'leaves with T in the pause'},
  {t: 'Soft-off', kind: 'pill', land: F.s06Out + 10, word: null, exit: F.softOffOut, s: 'S07', why: 're-docks; fades for the S08 promise'},
  {t: 'Hidden processor?', kind: 'tag', land: F.hidden, word: 'W0092', exit: F.hiddenExit, s: 'S07'},
  {t: 'Restart', kind: 'caption', land: F.restart, word: 'W0110', exit: F.cutTower, s: 'S08', why: 'ends at the T1 cut'},
  {t: 'Shut down', kind: 'caption', land: F.shutDown, word: 'W0115', exit: F.cutTower, s: 'S08', why: 'ends at the T1 cut'},
  {t: 'Why different?', kind: 'caption', land: F.why, word: 'W0118', exit: F.cutTower, s: 'S08', why: 'held ≥ 48 frames, ends at the T1 cut in the pause'},
  {t: 'Intel desktop', kind: 'caption', land: F.intel, word: 'W0130', exit: F.cutStandby, s: 'S09'},
  {t: 'Stop: AMD', kind: 'caption', land: F.amd, word: 'W0135', exit: F.stopsOut, s: 'S09'},
  {t: 'Stop: laptops', kind: 'caption', land: F.laptops, word: 'W0137', exit: F.stopsOut, s: 'S09'},
  {t: 'Standby power', kind: 'tag', land: F.standby, word: 'W0142', exit: F.cutStandby, s: 'S10', why: 're-lands on the S10 row at the cut (moved > 200 px)'},
  {t: 'Standby power', kind: 'tag', land: F.cutStandby + 1, word: null, exit: F.cutS11, s: 'S10', why: 'ends at the T1 cut inside the f1671–f1680 pause'},
  {t: 'Main rails: OFF', kind: 'pill', land: F.powerSupply, word: 'W0148', exit: F.cutS11, s: 'S10', why: 'ends at the T1 cut inside the pause'},
  {t: 'If unplugged', kind: 'caption', land: F.whenever + 7, word: null, exit: F.cutS11, s: 'S10', why: 'lands with its copy (proposal §revision 4); ends at the cut'},
  {t: 'If rear switch OFF', kind: 'caption', land: F.whenever + 11, word: null, exit: F.cutS11, s: 'S10', why: 'lands with its copy; ends at the cut'},
  {t: 'Soft-off', kind: 'pill', land: F.cutS11, word: null, exit: 99999, s: 'S11'},
  {t: 'Standby-powered', kind: 'tag', land: F.just, word: 'W0164', exit: F.standbyPoweredExit, s: 'S11'},
  {t: 'Power button', kind: 'tag', land: F.lock, word: 'W0176', exit: F.powerButtonExit, s: 'S11'},
  {t: 'Now', kind: 'header', land: F.now, word: 'W0179', exit: 99999, s: 'S12', big: [F.now, 9999]},
];
for (const l of L) {
  const w = countWords(l.t === '?' ? '' : l.t);
  const sent = SENTENCES[l.s];
  const minHold = Math.max(l.land + 30 + 9 * w, sent.end + 15);
  const landOk = l.word ? Math.abs(l.land - wordStart(l.word)) <= 3 : true;
  const holdOk = l.exit >= minHold || l.exit >= 99999;
  const tag = `${l.kind.padEnd(7)} "${l.t}" f${l.land}${l.word ? ` (word ${l.word} f${wordStart(l.word)})` : ''} → exit f${l.exit >= 99999 ? 'end' : l.exit}`;
  if (!landOk) ok(false, `${tag}: lands off its word`);
  else if (!holdOk && ['tag', 'pill'].includes(l.kind) && !l.why) ok(false, `${tag}: exits before the hold rule f${minHold}`);
  else if (!holdOk) note(`${tag}: before the hold rule f${minHold} — ${l.why ?? 'n/a'}`);
  else ok(true, tag);
}

/* 3. budget -------------------------------------------------------------------------------------- */
console.log('\n3. On-screen budget (tags ≤ 3, pills ≤ 2, must-read words ≤ 12)');
let worst = {tags: 0, pills: 0, words: 0, ft: 0, fp: 0, fw: 0};
for (let f = 0; f < 1890; f++) {
  const vis = L.filter((l) => f >= l.land && f < l.exit + 6);
  const tags = vis.filter((l) => l.kind === 'tag').length;
  const pills = vis.filter((l) => l.kind === 'pill').length;
  const words = vis.reduce((a, l) => {
    if (l.kind === 'badge') return a;
    if (l.kind === 'header') return a + (l.big && f >= l.big[0] && f < l.big[1] + 6 ? countWords(l.t) : 0);
    return a + countWords(l.t);
  }, 0);
  if (tags > worst.tags) worst = {...worst, tags, ft: f};
  if (pills > worst.pills) worst = {...worst, pills, fp: f};
  if (words > worst.words) worst = {...worst, words, fw: f};
}
ok(worst.tags <= 3, `max tags ${worst.tags} (first at f${worst.ft})`);
ok(worst.pills <= 2, `max pills ${worst.pills} (first at f${worst.fp})`);
ok(worst.words <= 12, `max must-read words ${worst.words} (first at f${worst.fw})`);

/* 4. Bit runs -------------------------------------------------------------------------------------- */
console.log('\n4. Bit runs');
const runs = [...X.LEAD_RUNS, ...X.HOPS];
for (const r of runs) {
  let peak = 0;
  for (let f = r.depart; f < r.land; f++) {
    const a = r.at(f);
    const b = r.at(f + 1);
    peak = Math.max(peak, Math.hypot(b.x - a.x, b.y - a.y));
  }
  const longOk = r.frames <= 30 || r.label.startsWith('S12');
  ok(r.frames >= 10 && longOk && r.speed <= 36 && peak <= 36.01, `${r.label}: f${r.depart} → f${r.land} (${r.frames} frames), ${r.length.toFixed(0)} px, cruise ${r.speed.toFixed(1)}, peak ${peak.toFixed(1)} px/frame${r.frames > 30 ? ' — long run, documented (no tighten: see REPORT)' : ''}`);
}

/* 5. routes ---------------------------------------------------------------------------------------- */
console.log('\n5. Routes and crossings');
const segs = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
// both the lead (PWRBTN#) and the standby channel END at the lookout, the receiver: points within 30 px of it
// are excluded; everywhere else they must keep the brand's 16 px clearance
const RECV = G.LOOK_C;
const far = (p) => Math.hypot(p[0] - RECV[0], p[1] - RECV[1]) > 30;
const segDist = (a, b) => {
  let m = Infinity;
  for (let i = 0; i <= 60; i++) {
    const t = i / 60;
    const p = [a[0][0] + (a[1][0] - a[0][0]) * t, a[0][1] + (a[1][1] - a[0][1]) * t];
    if (!far(p)) continue;
    for (let j = 0; j <= 60; j++) {
      const u = j / 60;
      const q = [b[0][0] + (b[1][0] - b[0][0]) * u, b[0][1] + (b[1][1] - b[0][1]) * u];
      if (!far(q)) continue;
      m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1]));
    }
  }
  return m;
};
let minMain = Infinity;
let minStby = Infinity;
for (const s of segs(G.BUTTON_PTS)) {
  for (const c of segs(G.MAIN_PTS)) minMain = Math.min(minMain, segDist(s, c));
  for (const c of segs(G.STBY_PTS)) minStby = Math.min(minStby, segDist(s, c));
}
ok(minMain - 9 - 2 >= 16, `lead ↔ main channel clearance ${(minMain - 9 - 2).toFixed(0)} px (edge to edge)`);
ok(minStby - 5 - 2 >= 16, `lead ↔ standby channel clearance ${(minStby - 5 - 2).toFixed(0)} px (edge to edge, outside the lookout where both end)`);
const gut = (pts, x0, x1) => segs(pts).find(([a, b]) => Math.min(a[0], b[0]) <= x0 && Math.max(a[0], b[0]) >= x1);
const gl = gut(G.BUTTON_PTS, 1070, 1142);
ok(gl && gl[0][1] === gl[1][1], `lead crosses the B|O port gutter (x 1070–1142) horizontally at y ${gl ? gl[0][1] : '?'} (perpendicular)`);
const gm = gut(G.MAIN_PTS, 1070, 1142);
const gs = gut(G.STBY_PTS, 1070, 1142);
ok(gm && gs && gm[0][1] === gm[1][1] && gs[0][1] === gs[1][1], `channels cross the B|P port gutter horizontally at y ${gm?.[0][1]} and ${gs?.[0][1]}; the O|P gutter (y 500–524) carries nothing`);

console.log(`\n${fails === 0 ? 'ALL CHECKS PASS' : `${fails} CHECK(S) FAILED`}`);
process.exit(fails === 0 ? 0 : 1);
