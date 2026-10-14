# Section builder brief (Episode 06, cloud build)

You build one section of the film from scratch, end to end, to a premium standard: top-tier explainer motion design, in the same visual language as the other eight sections.

The project root is `/home/user/bits-in-motion-remotion` (a cloud VM: Ubuntu, 4 vCPUs shared by everyone, 16 GB RAM, no GPU). The owner's PC is not reachable; you never hear or play the voice. All review is from rendered frames.

## Read first, in this order
1. `docs/ep06/DIRECTION.md`: the rules, the spine (the Wall and the Drawer), motifs, colour roles, environments, assets, and the story for your section. These are hard rules.
2. `docs/ep06/KIT.md` and `docs/ep06/KIT_UI.md`: the shared kit API (`src/ep06/kit`, imported from `'../kit'`) and its look sheets, `docs/ep06/kit_sheet.png` and `docs/ep06/kit_ui_sheet.png` (view both). Build with it so every section looks like one film. **The governing metaphor is `<Archive>` from the kit: never draw your own wall, drawer, card, Bit, split screen or Windows UI.**
3. `docs/ep06/ASSET_MAP.md` for the canonical render names (view `docs/ep06/review/assets_canonical.png`).
4. **Your paragraphs** in `docs/ep06/TRANSCRIPT.md` (word@absoluteFrame). Take the matching notes from `docs/ep06/script_editorial.md`: search it for your paragraph numbers (§D "P0N", the key visual beats V1–V11, and the claim ledger rows for your paragraphs). Don't read the whole file.
5. Your bounds in `src/ep06/sections.ts`. Glance at the neighbouring sections' plans in `docs/ep06/plans/` (if present) for your first and last shot, so the boundaries match.

## Ownership
- You may edit only `src/ep06/sections/S#.tsx`, a folder `src/ep06/sections/S#/` for your sub-components, `src/ep06/sections/S#.cues.json`, `docs/ep06/plans/S#_plan.md`, and preview output under `out/ep06/S#/`.
- Do not edit the kit. If you need a variant, compose or wrap it in your own folder. If the kit has a real bug or is missing something every section would need, say so in your final message (one line), and work around it locally.
- Never edit other sections, `src/engine`, `src/shared`, `tools/`, or anything outside your files. Do not commit or push (the main session does).

## Steps
1. **Plan** (`docs/ep06/plans/S#_plan.md`, ≤ 60 lines). Write a shot list with absolute frame anchors from `at(paragraph, 'phrase')`. For each shot give:
   - the environment, assets, camera move, exact on-screen strings and transition;
   - the hero beat and the re-hook;
   - the sound cues.

   Make sure that:
   - a meaningful visual change happens every 3–6 s;
   - no shot lasts more than about 8 s without a new development;
   - each spoken key idea has a concrete image;
   - every on-screen word and number is checked against your paragraphs and the claim ledger.
2. **Build** `src/ep06/sections/S#.tsx`, which exports `S#: React.FC<{frame:number}>` with an absolute frame.
   - Derive every timing from `at()` and `P()` in `../timing`, never from hard-coded seconds or frames.
   - Render valid, non-empty frames for [from−30, to+30]. Open with motion; the last 20 frames move into an exit (a push, a whip or a zoom) so the cut to the next section feels driven.
   - Deterministic only: no `Math.random`, no `Date`.
3. **Review** (at most 3 rounds). Every render command **must** be prefixed with the shared lock, and `REMOTION_GL=angle` must be set (on this VM it falls back to software rendering, is about 2× faster than `swangle`, and matches the owner's final-render backend):
   - `export REMOTION_GL=angle`
   - Lock with `flock -w 480 /tmp/ep06-render.lock …` (on timeout, do other work and retry), or run the command with the Bash tool's `run_in_background: true` and wait for its completion notification; never poll with sleep. One locked command renders at most **900 frames** (clip) or **48 stills**, never a whole long section at once.
   - **Round 1 = a full-res stills sheet only** (every 60 f). Rounds 2–3 = half-scale clips of the changed ranges plus dense sheets at transitions and hero beats. The whole-section clip (in ≤ 900-frame chunks, `static_check` on each with its `--offset`) runs once, in your last round.
   - Grep every render log for `[kit]` warnings: any text-size warning is a defect to fix.
   - Sheet roughly every 2 s across your range (stills render at full 1080p): `flock -w 480 /tmp/ep06-render.lock node tools/stills.mjs src/entries/ep06s#.tsx S# out/ep06/S#/r1 <from>-<to−1>:60 --luma --concurrency 3`. Add `--phone` on about 6 text-heavy frames to check legibility at 390 px.
   - Half-scale clips (≤ 900 frames each): `flock -w 480 /tmp/ep06-render.lock node tools/render.mjs src/entries/ep06s#.tsx S# out/ep06/S#/clipA.mp4 --frames a-b --scale 0.5 --concurrency 3`.
   - `python3 -I tools/static_check.py out/ep06/S#/clipA.mp4 --offset a`. Fix every FROZEN stretch and every EMPTY frame it reports.
   - A dense sheet around each transition and hero beat: `python3 -I tools/sheet.py out/ep06/S#/clipA.mp4 out/ep06/S#/dense.png --ranges a-b:2` (frames in that tool are clip-relative: subtract the clip's first frame).
   - Check sync: on-screen events land within ±3 frames of their spoken words.
   - Check honesty: every number shown is spoken in your paragraphs, in the same form; no jargon outside the voice; footnotes on simplifications.
4. **Cues:** write `src/ep06/sections/S#.cues.json` as `[{"frame":N,"kind":"whoosh|tick|pop|impact|riser|swell|dial|crate|sting|glitch|rewind|type","strength":0..1}]`, absolute frames, one entry per real visual event. Stay tasteful: about 6–14 cues per minute, risers before reveals, impacts only on hero beats.
5. **Typecheck:** `nice -n 10 npx tsc --noEmit -p tsconfig.ep06.json 2>&1 | grep -E "sections/S#(\.|/)"` must print nothing (other builders' in-progress files may show errors; ignore those).

## Screen-space text (the Ep03 trap; hard rule)
- Measure text in **screen pixels at 1080p**, not font sizes in code. A camera zoom of 0.5 halves your 60 px label to 30 px. Use the kit's `screen` prop on `Label`, `KineticText` and `Footnote` whenever the Stage camera zooms, so sizes are counter-scaled.
- Must-read ≥ 40 px on screen; keywords 64–120 px; hero words 160–320 px. ≤ 6 words per label; ≤ 12 must-read words on screen at once.
- Half-scale previews show everything at half size: 40 px at 1080p is 20 px in a half-scale clip. Judge legibility on the full-res stills and their 390 px phone copies, never on the half-scale clip.
- 64 px safe margin; the bottom 140 px stays free of must-read text.

## Quality bar
- Every frame should be something a viewer would screenshot.
- Strong figure–ground contrast, one clear focal point at a time.
- Motion is physical: overshoot, settle, follow-through, parallax and motion blur on fast moves. Things click, thunk, pour, slide and slam.
- Real renders as heroes, lit and alive (rim light, sweeps, float, contact shadow, a/b/c/d swaps hidden by a whip or flash), never flat stickers.
- No slide feel: no title-over-box layouts, no dense text panels, no bullet lists.

## Economy
The cloud credits are prepaid and limited.
- Read only what you need. Look at sheets rather than many single stills (≤ 14 images per round).
- At most 3 review rounds. Don't narrate.
- Your final message (≤ 120 words): what you built, its frame range, the static-check result, the cue count, and any known gaps or kit requests.
