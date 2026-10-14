# Run brief: Episode 06 "Why Deleting a File Doesn't Erase It" (Claude Code cloud session)

**Paste this to start the cloud session:**
> Read docs/ep06/RUN_BRIEF_CLOUD.md and execute it end to end. Work autonomously, make the creative and technical decisions yourself, don't narrate, and keep at most 10 agents running at once.

You are running in a cloud VM: Ubuntu, about 4 vCPUs, 16 GB RAM. You have a clone of the owner's Remotion project, and the owner's PC is not reachable. You build the whole episode here as code, review it on half-scale preview renders, and push the result. The owner then renders the final 1080p film and mixes the sound locally, using a script you write (§6).

## 1. Read first
1. `docs/PLAYBOOK.md`: the process, editing style, checks, rubric, banger formula, and lessons from Ep03. Follow it, except where this brief changes something for the cloud.
2. The reference implementation is Episode 03:
   - `src/ep03/`, including `src/ep03/kit`
   - `docs/ep03/`: read DIRECTION.md, SECTION_BRIEF.md and KIT.md
   - `audio_build/ep03/build_mix.py`
3. Ignore any path in the playbook that starts with `F:\`, `Videos\`, `Claude Work\` or `Codex Work\`. Their cloud equivalents are in §2.

## 2. Episode facts (cloud paths)
| Item | Value |
|---|---|
| Spoken script | `inputs/ep06/script_voiceover.txt` |
| Guardrails | `inputs/ep06/script_editorial.md`. **This topic is accuracy-sensitive; follow it exactly.** |
| Word timing | `inputs/ep06/fullvoiceover.srt`. Use only the word-level `<u>` cues. |
| Codex's timeline | `inputs/ep06/codex_timeline.json`, for cross-checking only |
| Voice duration | 567.432 s, so **17,023 frames** at 30 fps. The voice file itself stays on the owner's PC. |
| Asset prompts | `inputs/ep06/ASSET_PROMPTS.md` (BIM313 onward) |
| Hero renders | The owner generates them into `public/ep06/assets/` using the exact "Save as" filenames. |
| Your code | `src/ep06/`, `src/entries/ep06*.tsx`, `docs/ep06/`, `public/ep06/`, `audio_build/ep06/`, `tools/finish_ep06.sh` |

If `public/ep06/assets/` is empty or incomplete:
- Build with code visuals.
- List the 6–8 P1 renders that would help most in `docs/ep06/ASSET_REQUEST.md`.
- Keep the code ready to swap them in through kit props (`imageSrc`).

## 3. Creative seeds (decide in Phase 1, and improve on them)
- **Hook (first 3 s):** "You delete a photo of your passport…". Show a fictional passport photo deleted and the Recycle Bin emptied: "gone". Then cut to the platter, where every byte of it is still there. Only "the note that said where to find it" was crossed out.
- **Governing metaphor:** the file system is a **library catalogue**.
  - The file record (the MFT record) is an index card.
  - The bytes are the books on the shelves (clusters).
  - "Deleting" crosses out the card and marks the shelf space free; the books stay.
  - Build it as one kit component, and reuse it for the HDD, SSD, recovery and overwrite beats.
- **Signature image:** a split screen. On one side, Windows says "gone" over a crossed-out card. On the other, the passport's bytes sit untouched on the platter.
- **Mid-film hero:** a recovery tool scans the shelves and rebuilds the photo on the HDD. Then the same scan on the SSD after TRIM and cleanup finds empty blocks. Run it as a race or a split screen with a verdict card.
- **SSD beats** (the asset list holds props for each):
  - TRIM is a notice to the drive;
  - the drive erases whole blocks later, "on its own schedule";
  - the FTL map remaps addresses;
  - spare flash holds copies you can't reach;
  - an encryption key turns everything into noise when it's destroyed.
- **Re-hooks:**
  - "So is it gone? On a hard drive, not yet. On an SSD, probably, but not certainly."
  - "Why recovery tools work, why they sometimes fail, and what actually erases a file."
- **Callback ending:** the passport card again, now understood: a crossed-out note, a cleanup schedule, and what truly erases.
- **Safety:** the passport is **fictional**. Never show real personal data. On-screen advice must match the guardrails word for word in meaning. Never suggest wiping a whole drive unless the voice says exactly that.

## 4. Cloud-specific rules
- **Environment.** If `ffmpeg` or Chrome dependencies are missing, install them first:

  ```
  apt-get install -y ffmpeg libnss3 libdbus-1-3 libatk1.0-0 libgbm1 libasound2t64 libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2
  ```

  Then run `npm ci`. Remotion downloads its own headless Chrome the first time it renders.
- **Text and environment variables.**
  - Set `REMOTION_GL=swangle` for software WebGL; the VM has no GPU.
  - Fonts: the project loads Sora through `@remotion/google-fonts`, so it needs network access.
- **Rendering.** Previews only: `--scale 0.5`, concurrency 3. Sections render one at a time:

  ```
  EP=ep06 CONCURRENCY=3 tools/queue.sh out/ep06/vK S1:a-b …
  ```

  Remember that legibility on a half-scale preview corresponds to double the size at 1080p.
- **Commit and push after every phase** to your session branch. Idle VMs can be reclaimed.
  - Commit code, docs, JSON and small PNG contact sheets (under `docs/ep06/review/`).
  - **Never commit MP4, WAV or MP3 files.** `.gitignore` already blocks them.
- **No voice or music here.** Write `audio_build/ep06/` by copying the Ep03 mixer, with:
  - the voice path set to `F:/YouTube Channels/Bits in Motion/Videos/06 Why Deleting a File Doesn't Erase It/Voiceover/fullvoiceover.mp3`;
  - the music paths unchanged from Ep03.

  You can't run the mixer here. Check that it parses and that the cue files exist.
- **Budget.** These cloud credits are prepaid, and when they run out the owner's plan usage is charged.
  - Keep `docs/ep06/USAGE.md`, adding up each agent's reported tokens.
  - **Hard cap: 14M tokens.** If you reach it, finish the current phase, push, and write the final report.
  - At most 2 fix rounds. Stop early at 85 or above on the rubric.

## 5. Phases
Follow PLAYBOOK §3, Phases 0–5. Use the half-scale previews for all reviews, and run 3 range reviewers with the rubric in §6 of the playbook.

## 6. Hand-off to the owner's PC
Write `tools/finish_ep06.sh` (bash, run from Git Bash in the project folder). It must:
1. Render every section at full resolution:

   ```
   EP=ep06 CONCURRENCY=6 tools/queue.sh "../Claude Work/Episode 06 - File Deletion/render/final" S1:a-b …
   ```

2. Concatenate the sections with the ffmpeg concat demuxer and verify there are 17,023 frames.
3. Run `python -I tools/static_check.py`.
4. Run `python -I audio_build/ep06/build_mix.py`, writing to `../Claude Work/Episode 06 - File Deletion/audio/ep06_mix.wav`.
5. Mux with `-af apad -shortest` into `../Claude Work/Episode 06 - File Deletion/exports/Bits_in_Motion_06_1080p.mp4`.
6. Print the loudness (ebur128 with true peak) and the frame count.

Also write `docs/ep06/FINISH.md`, with the exact steps for the owner:

```
git fetch
git checkout <branch>
npm ci            # only if package-lock changed
bash tools/finish_ep06.sh
```

Include the expected render time on their PC (about 1–1.5 h at concurrency 6) and a note to close Codex and other heavy jobs first, because of CPU heat.

## 7. Final report (your last message)
- the rubric score from the half-scale review, stating that it comes from frames only;
- the remaining issues;
- the branch name;
- the tokens used;
- the list of assets the owner still needs to generate;
- the one command the owner runs.
