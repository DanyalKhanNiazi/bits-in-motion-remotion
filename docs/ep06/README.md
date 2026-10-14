# Episode 06: "Why Deleting a File Doesn't Erase It" (cloud build)

Built end to end in a Claude Code cloud session on 14 October 2026 from `docs/ep06/RUN_BRIEF_CLOUD.md`, following
`docs/PLAYBOOK.md`. The whole picture is code (Remotion, React/SVG). The owner renders the 1080p film, mixes the sound
and muxes on the PC with one script: see **`docs/ep06/FINISH.md`** (`bash tools/finish_ep06.sh`).

## What was done
- **Phase 0, setup.** The word timeline `public/ep06/timeline.json` comes from the owner's word-level SRT: 99.3 % of the
  script's words are aligned, and the 22 paragraph starts match Codex's timeline exactly. Generators are in
  `docs/ep06/gen/`. Also: `docs/ep06/TRANSCRIPT.md` (word@frame), the clock (`src/ep06/timing.ts`, 17,023 frames), nine
  sections of 47–92 s (`src/ep06/sections.ts`) and the entries `src/entries/ep06*.tsx`.
  - The 77 owner renders are mapped to canonical names (`docs/ep06/ASSET_MAP.md`): 59 of the 60 prompt slots are filled,
    and only `fictional-passport_c` is missing.
- **Phase 1, direction.** `docs/ep06/DIRECTION.md` was written, then revised after three independent critiques
  (accuracy, engagement, production). They caught overclaims in the race and encryption beats, misquotes, and an
  under-specified metaphor.
  - The governing metaphor is **the Wall and the Drawer**, in the voice's own words: a wall of numbered storage boxes
    and a drawer of index cards. It is one kit component, `<Archive>`, with frozen geometry: the photo always lives in
    boxes 021–023, 058–060 and 098–100.
- **Phase 2, kit.** Two kit agents built it.
  - `src/ep06/kit/` holds the Archive, its 12 story presets, 14 camera framings, SplitCompare, PhotoBits, DriveDive, the
    environments, and text roles with on-screen size warnings.
  - `src/ep06/kit/ui/` holds the generic dark Windows UI, key caps, verdicts, quote strips, scanner, TRIM note, key and
    scramble.
  - Docs: `KIT.md`, `KIT_UI.md` and the two kit sheets.
- **Phase 3, sections.** Nine builders worked in parallel, one section each (`src/ep06/sections/S1…S9`, plus plans in
  `docs/ep06/plans/` and sound cues in `S#.cues.json`).
- **Phases 4–5, review and fix.** Each version was a half-scale preview (960×540) of the whole film. Three range
  reviewers scored each version with the playbook rubric, and two fix rounds followed (kit first, then sections).
  Reviews are in `docs/ep06/fixes/S#_v1|v2|v3.json` and `range_*_v*.md`.
- **Phase 6, hand-off.**
  - `tools/finish_ep06.sh` and `docs/ep06/FINISH.md`.
  - The mixer ported to `audio_build/ep06/`; it parses and validates, but was never run here.
  - Packaging (`docs/ep06/PACKAGING.md`) and a 1280×720 thumbnail candidate, `docs/ep06/thumbnail_1280.png`, built from
    `src/entries/ep06thumb.tsx`.

## Scores (rubric, PLAYBOOK §6)
**From decoded frames of half-scale previews only.** Nobody watched real-time playback or heard any audio: the voice and
music never left the owner's PC. Overall = the mean of the three range reviewers.

| Version | S1–S3 | S4–S6 | S7–S9 | **Overall** |
|---|---:|---:|---:|---:|
| v1 (first assembly) | 81.7 | 78.5 | 79.7 | **80.0** |
| v2 (after fix round 1) | 84.8 | 84.4 | 85.2 | **84.8** |
| v3 (after fix round 2) | 86.6 | 86.8 | 86.1 | **86.5** |

v3 per section: S1 87.5 · S2 85.8 · S3 86.8 · S4 86.5 · S5 85.5 · S6 88.5 · S7 86.75 · S8 83.5 · S9 88.75.
Criterion means (0–10): clarity 8.56 · accuracy 9.33 · craft 8.39 · timing 8.72 · brand 8.56 · engagement 8.5 ·
production 8.67. For calibration, Ep03 reached 83.6 on the same rubric.

Measured on the v3 film: **17,023 frames**; `static_check` found 0 frozen stretches and 0 empty frames; 0 `[kit]`
text-size warnings in the render logs; typecheck clean.

## Remaining issues (v3 review; details in `docs/ep06/fixes/S#_v3.json`)
- **Medium.**
  - S6 f8536–8556: the amber "disposable" tags land 8–12 frames after "disposable".
  - S8 f13493–13720: the encryption payoff (every block, leftovers included, written as glyphs) is hard to see once the
    glyphs land on the wall.
- **Low (selection).**
  - S1: the micro-preview tags wobble as they pop in.
  - S2: a 44-frame quiet hold on the monitor before "Imagine"; the Shift + Delete branch reads as a jump.
  - S3: the "Nothing opens the boxes" pull-back stops short of edge-to-edge; the "Free" stamp covers two of the card's
    sockets; a few whips have no whoosh cue.
  - S4: the scanner's base runs off the bottom edge.
  - S5: the TRIM chips are at the size floor and sit on the drawer face.
  - S6: the 16-drive row starts unlit; one push crops the top row.
  - S7: Windows' "view cone" is missing in P17.
  - S8: several labels land 5–7 frames late or exit early; the hand prop is still simple.
  - S9: the 12-word cap is exceeded for about 15 frames at f15723.
  - Kit: the AtlasOpener's route line is drawn in cyan, where only the travelling Bit should be.
- **Not verifiable here.** Sound: the 127 cues fit the vocabulary and budget on paper (13.4 per minute, 1–2 impacts per section),
  but the mix has never been heard. Exact final-render timing on the PC.

## Decisions that differ from the brief
- **Previews used `REMOTION_GL=angle`, not `swangle`.** On this VM it falls back to software rendering, it is about 2×
  faster, and its output was checked against swangle. It is also the backend the owner's final render uses
  (`tools/render.mjs` defaults to `angle`).
- **Shared tools were changed, because the cloud run needed it:**
  - Concurrency defaults are capped at the core count (`remotion.config.ts`, `render.mjs`, `stills.mjs`, `queue.sh`);
    defaults on the PC are unchanged.
  - `queue.sh` has an optional `SCALE` env var.
  - `_common.mjs` deletes each 360 MB temp bundle when the render exits; it used to fill the disk.
  - `static_check.py` keeps frames as uint8; a full film needed 8.8 GB and was killed.
- A cloud **SessionStart hook** (`.claude/hooks/session-start.sh`) makes headless Chrome trust the sandbox's egress
  CAs, so Google Fonts load in cloud sessions. It does nothing on the PC.

## Credits
- **Narration:** the channel's own recording (locked; only gain and a true-peak limiter in the mix).
- **Music** (Pixabay Content License; credit optional):
  - "Minimal Idm Ambient Works – Loop" by Musinova;
  - "Engineering Graphics" by bearstockmusic.
  - See `audio_build/CREDITS.md`.
- **Sound effects:** synthesized by the mixer's palette, plus the licence-checked Signal Atlas click
  (`audio_build/sfx/style6/`).
- **Fonts:** Sora and JetBrains Mono (SIL Open Font License, via Google Fonts).
- **Images:** the owner's generated renders (`public/ep06/assets/`) and the Ep03 `reader-desk` photo plate. Everything
  else is code. The passport is fictional. The Windows UI is a generic recreation with no logos.
- **Facts:** as sourced in `docs/ep06/script_editorial.md` §E: Microsoft Learn and Support, the Sleuth Kit wiki,
  Kingston, King & Vidas (2011), NIST SP 800-88 Rev. 2 and Crucial.

## How to rebuild
- **Final film, mix and export:** `bash tools/finish_ep06.sh` (see `docs/ep06/FINISH.md`; about 1–1.5 h on the 13700K).
- **One section preview:** `node tools/render.mjs src/entries/ep06s3.tsx S3 out/ep06/S3.mp4 --frames 3167-5103 --scale 0.5`.
- **Studio:** `npx remotion studio src/entries/ep06.tsx`.
- **Regenerate the timeline and transcript:** `python -I docs/ep06/gen/build_timeline.py`, then
  `python -I docs/ep06/gen/build_transcript.py`.
- **Thumbnail:** `node tools/stills.mjs src/entries/ep06thumb.tsx Thumb out/ep06/thumb 60`, then downscale to 1280×720.
- **Renders still wanted:** `docs/ep06/ASSET_REQUEST.md`. They swap in through kit props with no section changes.
- **Token use:** `docs/ep06/USAGE.md`.
