# Run brief: Episode 05, "Why Uploaded Video Loses Detail"
## Claude Console Managed Agent, sandbox run

**Paste this as the first session message:**
> Unzip the uploaded BitsInMotion_ep05_upload.zip into /workspace (keep its "Bits in Motion" folder). Then read "/workspace/Bits in Motion/remotion/docs/ep05/RUN_BRIEF_MANAGED.md" and execute it end to end. Work autonomously, make the creative and technical decisions yourself, and don't narrate.

You are in a cloud sandbox: Ubuntu 24.04, up to 8 GB RAM and 10 GB of disk, with Node, Python, ffmpeg and Playwright Chromium. The owner's PC is not reachable. Everything you need is in the zip, laid out exactly like the owner's channel folder. Call the folder `$ROOT = "/workspace/Bits in Motion"`.

## 1. Read first
1. `$ROOT/remotion/docs/PLAYBOOK.md` describes the process, the editing style, the checks, the rubric, the banger formula and the lessons from Ep03. Follow it.
2. `$ROOT/Claude Brief - Episode 05 production (API run).md` is not in the zip. Its content is §2–§4 below; use those sections instead.
3. Episode 03 is the reference implementation:
   - `remotion/src/ep03/`
   - `remotion/docs/ep03/` (start with DIRECTION.md, SECTION_BRIEF.md and KIT.md)
   - `remotion/audio_build/ep03/`
4. Paths in the playbook that start with `F:\` map to `$ROOT`.
   - `Claude Work\…` becomes `$ROOT/Claude Work/…`; create it.
   - `Codex Work\` is not present. Use `remotion/inputs/ep05/` instead.

## 2. Episode facts
| Item | Location / value |
|---|---|
| Voice | `$ROOT/Videos/05 Why Uploaded Video Loses Detail/Voiceover/fullvoiceover.mp3`. 633.678 s, which is **19,011 frames** at 30 fps. |
| Word timing | `…/Transcription/fullvoiceover.srt` (word-level `<u>` cues) |
| Script and guardrails | `…/script_voiceover.txt` and `…/script_editorial.md` |
| Codex's timeline | `remotion/inputs/ep05/codex_timeline.json` (cross-check only) |
| Asset prompts | `remotion/inputs/ep05/ASSET_PROMPTS.md` |
| Hero renders | `remotion/public/ep05/assets/`. The owner made them; there may be none, or only some. |
| Music (licensed, documented in `remotion/audio_build/CREDITS.md`) | `$ROOT/Motion Brand/stage_a_files/sound/music_candidates/` |
| Code to write | `remotion/src/ep05/`, `src/entries/ep05*.tsx`, `docs/ep05/`, `public/ep05/`, `audio_build/ep05/` |

If the hero renders are missing:
- build with code visuals;
- write `docs/ep05/ASSET_REQUEST.md` listing at most 8 P1 renders;
- keep `imageSrc` swap points in the kit.

## 3. Creative seeds (decide in Phase 1)
- **Hook (first 3 s):** a split screen of the beetle's shell. "Your edit" shows pits you can count; "after upload" shows smooth plastic. A wipe reveals the loss, and the line "Where did the detail go?" lands.
- **Contrast:** ≈1.5 billion bits per second against ≈8 million, so **≈200× less**. Show it physically.
- **Governing metaphor:** the script names it: "Think of it as a budget". Each frame has about 33 KB to spend, and the question is what's worth spending bytes on. Losses happen at a **rounding press** (quantization). Make it one kit component and reuse it everywhere.
- **Secondary motif:** "a full painting now and then, and directions in between", for I-frames versus P- and B-frames.
- **Signature image:** quantization rounds a fine pattern's 4 down to 0, and the shell's pits vanish as the step size grows. The step-10 example (43 → 4 → 40, and 4 → 0) must be crystal clear.
- **Mid-film hero and re-hook:** the quiz "Which falls apart first: the blurry background, or the shell?". Hold the question on screen, then reveal the shell breaking into blocks first.
- **Environments:**
  - the creator's edit suite;
  - a codec workshop (blocks, patterns, the press);
  - YouTube's processing "factory" (versions and generations);
  - the viewer's screen.
- **Callback ending:** the beetle again. Its budget ledger shows "the pits on the shell" as the most expensive line, and that line is rounded away.

## 4. Accuracy cautions (also check `script_editorial.md`)
- **Keep the hedges the voice uses:** "about", "YouTube recommends", "one study", "broadly". Never show a bitrate for YouTube's own versions, because the voice says "we won't guess".
- **Numbers appear exactly as spoken:**
  - about 1.5 billion bits; about 8 million; nearly 200× less;
  - about 33 KB per frame; about 6 MB uncompressed; about half of one percent;
  - blocks from 16×16 down to 4×4;
  - a new group of pictures every half second;
  - the made-up step-10 example;
  - up to 4 hours for a 60-minute 4K video;
  - 2021 and 2018;
  - AV1 more than 30% better than VP9 (according to the Chrome team);
  - 8 and 12 Mbps; 35–45 Mbps;
  - four times the pixels.
- **Codec names:** write H.264, VP9 and AV1 on screen.
- **The transform step throws nothing away.** Only quantization loses detail.

## 5. Sandbox-specific rules
- **Setup.**
  1. Run `cd "$ROOT/remotion" && npm ci`.
  2. Export `REMOTION_GL=swangle`; there is no GPU.
  3. If Remotion can't download its headless Chrome, point `browserExecutable` in `tools/_common.mjs` (and in the renderMedia, renderStill and openBrowser calls) at the Playwright Chromium under `/opt/pw-browsers/`.
  4. Fonts load from Google Fonts, so the network must be open.
- **The CPU is shared by every agent in this session.**
  - Keep at most 5 builders working at once. Start the rest when one finishes.
  - Run every clip render through a lock so only one runs at a time:

    ```
    flock /tmp/render.lock node tools/render.mjs … --scale 0.5 --concurrency 2
    ```

  - Stills use `--concurrency 2`.
- **Paths in the mixer.**
  - Copy `audio_build/ep03` to `audio_build/ep05`.
  - Set VOICE to this episode's voice. OUT_DIR is `$ROOT/Claude Work/Episode 05 - Video Compression/audio`.
  - In `music_plan.json`, replace `F:/YouTube Channels/Bits in Motion` with `$ROOT`.
- **Final render.**
  - Use `EP=ep05 CONCURRENCY=3 tools/queue.sh "$ROOT/Claude Work/Episode 05 - Video Compression/render/final" S1:a-b …` with `RENDER_TMP=/tmp`.
  - A downloaded file must be under 500 MB, so encode the final film at **CRF 20**. Re-encode the joined picture with `-c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p` before muxing.
  - If the file is still over 480 MB, also deliver it as two halves.
- **Disk is 10 GB.** Delete intermediate clips and half-scale previews once each phase passes.
- **Budget.** The session is billed per token, plus $0.08 per running hour.
  - Keep `docs/ep05/USAGE.md` up to date.
  - **Hard cap: 14M tokens.** At the cap, finish the current phase, export what exists, and report.
  - Do at most 2 fix rounds. Stop early once the rubric score is 85 or higher.

## 6. Outputs: write them to `/mnt/session/outputs/` so the owner can download them
1. `Bits_in_Motion_05_1080p.mp4`: 1080p30, the full 19,011 frames, −14 LUFS, true peak ≤ −1 dBTP. If it's over 480 MB, also deliver `…_part1.mp4` and `…_part2.mp4`.
2. `ep05_source.zip`: `remotion/src/ep05`, `src/entries/ep05*`, `docs/ep05`, `public/ep05` (without the PNGs the owner already has), `audio_build/ep05` (scripts, cues, plan), and any kit or tool changes.
3. `README.md`:
   - the rubric scores per version, stating that they come from frames only;
   - the remaining issues;
   - the credits (music from Pixabay, credit optional; sound effects synthesized or from the licence-checked kit);
   - how to rebuild locally.
4. `contact_sheet.png`: about 30 frames of the final film.
5. `thumbnail.png`: 1280×720, made from the signature image. Also put 3 title options in the README.

Final message: the score, the file names, the remaining issues, the tokens used and the session hours.
