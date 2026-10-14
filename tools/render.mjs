#!/usr/bin/env node
// Render a composition to a muted H.264 MP4 and verify it with ffprobe.
//
//   node tools/render.mjs <entryFile> <compositionId> <out.mp4> [--frames a-b] [--scale s] [--concurrency n]
//
//   H.264, CRF 16, yuv420p, BT.709, PNG frames, NO audio track. Default concurrency 6.
//   --frames a-b   render only frames a..b (inclusive)
//   --scale s      e.g. 0.5 for a 960x540 preview
// Ends by printing ffprobe's width, height, fps and the exact (decoded) frame count.
// Example: node tools/render.mjs src/entries/style3.tsx LivingSchematic out/style3/style3_muted.mp4
import path from 'node:path';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {ROOT, bundleEntry, makeLogHandler, parseArgs} from './_common.mjs';

const USAGE = 'usage: node tools/render.mjs <entryFile> <compositionId> <out.mp4> [--frames a-b] [--scale s] [--concurrency n]';

export const probe = (file) => {
  const r = spawnSync(
    'ffprobe',
    [
      '-v', 'error',
      '-count_frames',
      '-show_entries', 'stream=index,codec_type,codec_name,profile,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_read_frames,color_space,color_primaries,color_transfer',
      '-show_entries', 'format=duration',
      '-of', 'json',
      file,
    ],
    {encoding: 'utf8'},
  );
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr}`);
  return JSON.parse(r.stdout);
};

const main = async () => {
  const {pos, flags} = parseArgs(process.argv.slice(2), ['frames', 'scale', 'concurrency']);
  if (pos.length < 3 || flags.help) {
    console.log(USAGE);
    process.exit(pos.length < 3 ? 1 : 0);
  }
  const [entry, compId, outArg] = pos;
  const out = path.resolve(ROOT, outArg);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  let frameRange = null;
  if (flags.frames !== undefined) {
    const m = String(flags.frames).match(/^(\d+)-(\d+)$/);
    if (!m) throw new Error('--frames expects a-b');
    frameRange = [Number(m[1]), Number(m[2])];
  }
  const scale = flags.scale !== undefined ? Number(flags.scale) : 1;
  const concurrency = flags.concurrency !== undefined ? Number(flags.concurrency) : 6;

  const serveUrl = await bundleEntry(entry);
  const onBrowserLog = makeLogHandler();
  const composition = await selectComposition({serveUrl, id: compId, inputProps: {}, onBrowserLog, timeoutInMilliseconds: 180000, chromiumOptions: {gl: process.env.REMOTION_GL || 'angle'}});
  if (frameRange && (frameRange[0] < 0 || frameRange[1] >= composition.durationInFrames || frameRange[1] < frameRange[0])) {
    throw new Error(`--frames out of range 0–${composition.durationInFrames - 1}`);
  }
  const expected = frameRange ? frameRange[1] - frameRange[0] + 1 : composition.durationInFrames;
  console.log(
    `${compId}: ${composition.width}x${composition.height} @ ${composition.fps} fps; rendering ${expected} frames` +
      `${frameRange ? ` (f${frameRange[0]}–f${frameRange[1]})` : ''} at scale ${scale}, concurrency ${concurrency} → ${path.relative(ROOT, out)}`,
  );
  const t0 = Date.now();
  let lastPct = -1;
  await renderMedia({ timeoutInMilliseconds: 180000, chromiumOptions: {gl: process.env.REMOTION_GL || 'angle'},
    composition,
    serveUrl,
    codec: 'h264',
    outputLocation: out,
    crf: 16,
    pixelFormat: 'yuv420p',
    colorSpace: 'bt709',
    imageFormat: 'png',
    muted: true,
    enforceAudioTrack: false,
    concurrency,
    frameRange,
    scale,
    overwrite: true,
    onBrowserLog,
    onProgress: ({progress}) => {
      const pct = Math.floor(progress * 10) * 10;
      if (pct !== lastPct) {
        lastPct = pct;
        console.log(`  ${pct}%`);
      }
    },
  });
  console.log(`rendered in ${((Date.now() - t0) / 1000).toFixed(1)} s`);

  const info = probe(out);
  const v = info.streams.find((s) => s.codec_type === 'video');
  const audio = info.streams.filter((s) => s.codec_type === 'audio').length;
  const [num, den] = String(v.r_frame_rate).split('/').map(Number);
  const fps = den ? num / den : num;
  const frames = Number(v.nb_read_frames);
  console.log(
    `ffprobe: ${v.width}x${v.height}, ${v.r_frame_rate} fps (${fps}), ${frames} frames (decoded), ` +
      `${v.codec_name} ${v.profile ?? ''} ${v.pix_fmt}, color ${v.color_space ?? '?'}, audio streams: ${audio}, duration ${Number(info.format.duration).toFixed(3)} s`,
  );
  const wantW = Math.round(composition.width * scale);
  const wantH = Math.round(composition.height * scale);
  const problems = [];
  if (v.width !== wantW || v.height !== wantH) problems.push(`size ${v.width}x${v.height} ≠ ${wantW}x${wantH}`);
  if (Math.abs(fps - composition.fps) > 1e-6) problems.push(`fps ${fps} ≠ ${composition.fps}`);
  if (frames !== expected) problems.push(`frames ${frames} ≠ ${expected}`);
  if (audio !== 0) problems.push(`${audio} audio stream(s); expected muted`);
  if (v.pix_fmt !== 'yuv420p') problems.push(`pix_fmt ${v.pix_fmt}`);
  if (problems.length) {
    console.error(`CHECK FAILED: ${problems.join('; ')}`);
    process.exit(2);
  }
  console.log('check: OK');
};

main().catch((e) => {
  // Remotion appends "\nundefined" when a webpack error has no details
  console.error(e instanceof Error ? String(e.message).replace(/\s*undefined\s*$/, '') : e);
  process.exit(1);
});
