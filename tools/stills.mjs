#!/usr/bin/env node
// Render stills of one composition, plus a labelled contact sheet.
//
//   node tools/stills.mjs <entryFile> <compositionId> <outDir> <frames...> [--phone] [--luma] [--picture y0:y1] [--concurrency n]
//
//   frames: a list and/or ranges, e.g.  0,8,33,59  100-200:10  1830-1889:3
//   --phone        also write 390 px-wide Lanczos copies (fNNNN_phone.png), the YouTube portrait player width
//   --luma         print the mean Rec.709 luma (0–255) of each still
//   --picture a:b  measure luma over rows a..b-1 only (e.g. 132:948 inside letterbox bars)
//   --concurrency  parallel stills (default 4)
//
// Writes <outDir>/fNNNN.png (true frame numbers) and <outDir>/sheet.png (contact sheet labelled with them).
// Example: node tools/stills.mjs src/entries/style2.tsx NightSignal out/style2/look 0,671,1500 --phone --luma --picture 132:948
import path from 'node:path';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {ROOT, bundleEntry, makeLogHandler, pad4, parseArgs, parseFrames} from './_common.mjs';

const USAGE =
  'usage: node tools/stills.mjs <entryFile> <compositionId> <outDir> <frames: list and/or a-b:step> [--phone] [--luma] [--picture y0:y1] [--concurrency n]';

const main = async () => {
  const {pos, flags} = parseArgs(process.argv.slice(2), ['picture', 'concurrency']);
  if (pos.length < 4 || flags.help) {
    console.log(USAGE);
    process.exit(pos.length < 4 ? 1 : 0);
  }
  const [entry, compId, outArg, ...frameTokens] = pos;
  const frames = parseFrames(frameTokens);
  if (frames.length === 0) throw new Error('no frames given');
  const outDir = path.resolve(ROOT, outArg);
  fs.mkdirSync(outDir, {recursive: true});
  if (flags.picture !== undefined && !/^\d+:\d+$/.test(String(flags.picture))) throw new Error('--picture expects y0:y1');
  const concurrency = Math.max(1, Number(flags.concurrency ?? 4));

  const serveUrl = await bundleEntry(entry);
  const onBrowserLog = makeLogHandler();
  const browser = await openBrowser('chrome', {chromiumOptions: {gl: process.env.REMOTION_GL || 'angle'}});
  try {
    const composition = await selectComposition({serveUrl, id: compId, inputProps: {}, puppeteerInstance: browser, onBrowserLog});
    const bad = frames.filter((f) => f < 0 || f >= composition.durationInFrames);
    if (bad.length) throw new Error(`frames out of range 0–${composition.durationInFrames - 1}: ${bad.join(', ')}`);
    console.log(`${compId}: ${composition.width}x${composition.height} @ ${composition.fps} fps, ${composition.durationInFrames} frames; rendering ${frames.length} stills → ${path.relative(ROOT, outDir) || outDir}`);
    const t0 = Date.now();
    let next = 0;
    let done = 0;
    const worker = async () => {
      while (next < frames.length) {
        const f = frames[next++];
        await renderStill({
          composition,
          serveUrl,
          frame: f,
          output: path.join(outDir, `f${pad4(f)}.png`),
          imageFormat: 'png',
          puppeteerInstance: browser,
          overwrite: true,
          onBrowserLog,
        });
        done++;
        if (done % 10 === 0 || done === frames.length) console.log(`  ${done}/${frames.length}`);
      }
    };
    await Promise.all(Array.from({length: Math.min(concurrency, frames.length)}, worker));
    console.log(`stills done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  } finally {
    await browser.close({silent: true}).catch(() => undefined);
  }

  // phone copies, luma and the contact sheet (Python + PIL)
  const args = ['-I', path.join(ROOT, 'tools', 'stills_post.py'), outDir, '--frames', frames.join(',')];
  if (flags.phone) args.push('--phone');
  if (flags.luma || flags.picture !== undefined) args.push('--luma');
  if (flags.picture !== undefined) args.push('--picture', String(flags.picture));
  const r = spawnSync('python', args, {stdio: 'inherit'});
  if (r.error || r.status !== 0) {
    console.error('post-processing failed (python -I tools/stills_post.py); the stills themselves are written.');
    process.exit(1);
  }
};

main().catch((e) => {
  // Remotion appends "\nundefined" when a webpack error has no details
  console.error(e instanceof Error ? String(e.message).replace(/\s*undefined\s*$/, '') : e);
  process.exit(1);
});
