# Episode 06 mixer: "Why Deleting a File Doesn't Erase It"

Ported from the Episode 03 mixer (`audio_build/ep03/`). Same DSP, palette synthesis, limiter and `measure.json`; new voice, timings, cues and output path. Nobody has listened to it: the voice and music live only on the owner's PC, so this has been parse-checked here, never mixed.

## What changed vs Ep03
- **Voice:** `F:/YouTube Channels/Bits in Motion/Videos/06 Why Deleting a File Doesn't Erase It/Voiceover/fullvoiceover.mp3` (`--voice` overrides).
- **Length:** 17,023 frames = 567.432 s (was 18,367 / 612.2 s). The duration check is now `duration_567.432s_within_1_frame`.
- **Sections:** `SECTION_FRAMES` in `build_mix.py` (S1 0-1409, S2 -3167, S3 -5104, S4 -6649, S5 -8404, S6 -9935, S7 -11976, S8 -14747, S9 -17023). The 22 paragraph starts are embedded and checked against `public/ep06/timeline.json` on every run (mismatch = exit 2).
- **Cues:** read at run time from `src/ep06/sections/S1..S9.cues.json` (127 cues across the nine sections; nothing is baked in). A missing file is a warning in the log and in `measure.json`.
- **Music:** same two Pixabay tracks, same paths. `music_plan.json` is re-timed: hook lift with its drop on P02 "So, is it gone?" (24.8 s); main bed from S2 (46.97 s); lifts at P11 (SSD board reveal), P13 (mid-film hero, entered through the track's bar-16 fill) and P22 (callback); darker bed under the dense paragraphs (P14, P16-P18, P20); louder gap offsets in S1/S5/S6/S9; tonic-pad resolve from 553.2 s landing at 567.2 s.
- **New:** `--check` (parse-only dry run) and a `voice_correlation_ge_0.9999` check (Ep03 only reported the correlation).
- **Tools:** `make_test_cues.py` now builds Ep06 test cues (`test/`, gitignored). Palette files only had their title changed.

## Run
From the project folder (Git Bash on Windows): `python -I audio_build/ep06/build_mix.py`
- `--check`: no voice or music needed; validates timings, the nine cue files and `music_plan.json`.
- `--out PATH`, `--voice PATH`, `--cues a.json b.json`, `--plan music_plan.json` (use a frozen plan; normal runs regenerate it from the live cues), `--no-sfx`, `--no-music`, `--stems DIR`, `--target-lufs`.
- The first run builds `palette/*.wav` (gitignored) with `build_palette.py`; it needs `audio_build/sfx/style6/button_press_f0.wav`. Copying `ep03/palette/*.wav` also works (same synthesis).

## Inputs and outputs
- In: the voice above; `Motion Brand/stage_a_files/sound/music_candidates/` "Style 3 - primary - Minimal Idm Ambient Works - Loop.mp3" and "Style 1 - primary - Engineering Graphics.mp3" (sibling of the project folder); cue files.
- Out (default): `../Claude Work/Episode 06 - File Deletion/audio/ep06_mix.wav` plus `measure.json`, `CREDITS.md`, `music_plan.json` beside it. `audio_build/ep06/music_plan.json` is rewritten each run; caches go to `audio_build/ep06/work/` (gitignored).
- Exit 0 = all checks pass, 1 = a check failed (files still written), 2 = bad input, 3 = crash.

## Checks (in `measure.json`)
-14 LUFS +/-0.5 integrated; true peak <= -1 dBTP; music >= 18 LU under the voice (phrases, 3 s, 1 s, 0.4 s windows, plus a shifted grid); voice lag 0 and correlation >= 0.9999 (fixed gain alone vs an independent soxr decode); narration untouched except gain and limiter; length = narration samples and within one frame of 567.432 s; 48 kHz stereo; at most 3 sounds within 100 ms.
- Music and SFX sources are limited to what `audio_build/CREDITS.md` documents; the never-use list in `docs/PLAYBOOK.md` 1.4 applies.
