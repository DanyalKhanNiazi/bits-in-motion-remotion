# Finishing Episode 06 on your PC

The cloud session built the whole picture as code and reviewed it on half-scale preview renders (frames only: nobody watched playback or listened). The final 1080p render, the sound mix and the mux happen on your PC, with one script.

## Steps (Git Bash, in the project folder)

```
git fetch
git checkout claude/inspiring-faraday-vslyai
npm ci            # only if package-lock changed
bash tools/finish_ep06.sh
```

Before you start:
- **Close Codex, other Claude sessions and any heavy jobs.** The script renders at concurrency 6, which already runs the 13700K hot; anything else in parallel pushes it towards 100 °C and causes browser-setup timeouts.
- The voice must be at `F:/YouTube Channels/Bits in Motion/Videos/06 Why Deleting a File Doesn't Erase It/Voiceover/fullvoiceover.mp3`.
- Python needs numpy and scipy (the same environment that ran the Ep03 mixer). The first mix run builds the sound palette (it needs the Signal Atlas click kit in `audio_build/sfx/style6/`).
- **Expected time: about 1–1.5 h of rendering** at concurrency 6, then a few minutes for the join, checks, mix and mux.

## What the script does
1. Renders the nine sections at 1080p, one at a time, with `tools/queue.sh` (retries, skips files that already have the right frame count, durable TEMP in `../Claude Work/tmp`). Output: `../Claude Work/Episode 06 - File Deletion/render/final/S1.mp4 … S9.mp4`.
2. Joins them with the ffmpeg concat demuxer and checks the film has exactly **17,023 frames**.
3. Runs `python -I tools/static_check.py` on the film (frozen stretches, empty frames).
4. Runs `python -I audio_build/ep06/build_mix.py` (voice + licensed Ep03 music + synthesized cues from `src/ep06/sections/S*.cues.json`) into `../Claude Work/Episode 06 - File Deletion/audio/ep06_mix.wav`. Targets: −14 LUFS ±0.5, true peak ≤ −1 dBTP, music ≥ 18 LU under the voice, voice correlation ≥ 0.9999.
5. Muxes with `-af apad -shortest` (keeps the last video frame) into `../Claude Work/Episode 06 - File Deletion/exports/Bits_in_Motion_06_1080p.mp4`.
6. Prints the export's frame count and its loudness (ebur128 with true peak).

The script stops with `FINISH FAILED: …` at the first failed check.

## If you change any code later
Section renders are skipped when they already have the right frame count, so a stale render can survive. After any code change, run `FRESH=1 bash tools/finish_ep06.sh` (it deletes the section renders first), or delete just the changed sections' MP4s.

## Useful single commands
- One section only: `EP=ep06 CONCURRENCY=6 bash tools/queue.sh "../Claude Work/Episode 06 - File Deletion/render/final" S6:8404-9934`
- Studio preview: `npx remotion studio src/entries/ep06.tsx`
- Mixer dry run: `python -I audio_build/ep06/build_mix.py --check`
