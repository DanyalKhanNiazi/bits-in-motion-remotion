# Section builder brief (Episode 03 rebuild)

You build one section of the film from scratch, end to end, to a premium standard: top-tier explainer motion design, in the same visual language as the other eight sections.

The project root is `F:\YouTube Channels\Bits in Motion\remotion\`.

## Read first, in this order
1. `docs/ep03/DIRECTION.md`: the rules, motifs, environments, assets, and the story for your section. These are hard rules.
2. `docs/ep03/KIT.md`: the shared kit API (`src/ep03/kit`, imported from `'../kit'`) and its look sheet, `docs/ep03/kit_sheet.png`. Build with it so every section looks like one film.
3. **Your paragraphs** in `docs/ep03/TRANSCRIPT.md` (word@absoluteFrame). Take the matching notes from `docs/ep03/script_editorial_recorded.md`: search it for your paragraph's key phrases, and don't read the whole file.
4. Your bounds in `src/ep03/sections.ts`.

## Ownership
- You may edit only `src/ep03/sections/S#.tsx`, a folder `src/ep03/sections/S#/` for your sub-components, `src/ep03/sections/S#.cues.json`, `docs/ep03/plans/S#_plan.md`, and preview output under `out/ep03/S#/`.
- Do not edit the kit. If you need a variant, compose or wrap it in your own folder.
- Never edit other sections, `src/engine`, `src/shared` or anything under `Codex Work\`.

## Steps
1. **Plan** (`docs/ep03/plans/S#_plan.md`, ≤ 60 lines). Write a shot list with absolute frame anchors from `at(paragraph, 'phrase')`. For each shot give:
   - the environment, assets, camera move, exact on-screen strings and transition;
   - the hero beat and the re-hook;
   - the sound cues.

   Make sure that:
   - a meaningful visual change happens every 3–6 s;
   - no shot lasts more than about 8 s without a new development;
   - each spoken key idea has a concrete image.
2. **Build** `src/ep03/sections/S#.tsx`, which exports `S#: React.FC<{frame:number}>` with an absolute frame.
   - Derive every timing from `at()` and `P()` in `../timing`, never from hard-coded seconds.
   - Render valid, non-empty frames for [from−30, to+30]. Open with motion; the last 20 frames move into an exit (a push, a whip or a zoom) so the cut to the next section feels driven.
3. **Review** (at most 3 rounds).
   - Render a sheet roughly every 2 s across your range: `node tools/stills.mjs src/entries/ep03s#.tsx S# out/ep03/S#/r1 <from>-<to>:60 --luma`. Add `--phone` on about 6 text-heavy frames to check legibility at 390 px.
   - Render a half-scale clip of your whole range: `node tools/render.mjs src/entries/ep03s#.tsx S# out/ep03/S#/clip.mp4 --frames <from>-<to> --scale 0.5 --concurrency 4`.
   - Run `python -I tools/static_check.py out/ep03/S#/clip.mp4 --offset <from>`. Fix every FROZEN stretch and every EMPTY frame it reports.
   - Look at a dense sheet around each transition and hero beat (`python -I tools/sheet.py out/ep03/S#/clip.mp4 out/ep03/S#/dense.png --ranges a-b:2`; frames in that tool are clip-relative).
   - Check sync: on-screen events land within ±3 frames of their spoken words.
   - Check honesty: every number shown is spoken in your paragraphs, and no text overlaps or goes below 40 px if it must be read.
4. **Cues:** write `src/ep03/sections/S#.cues.json` as `[{"frame":N,"kind":"whoosh|tick|pop|impact|riser|swell|dial|crate|sting|glitch|rewind|type","strength":0..1}]`, with one entry per real visual event. Stay tasteful: about 6–14 cues per minute, risers before reveals, and impacts only on hero beats.
5. **Typecheck:** run `npx tsc --noEmit -p tsconfig.ep03.json`, if it exists; otherwise check your files with an equivalent small config of your own under `out/ep03/S#/`.

## Quality bar
- Every frame should be something a viewer would screenshot.
- Hold strong figure–ground contrast, with one clear focal point at a time.
- Motion should be physical: overshoot, settle, follow-through, parallax and motion blur on fast moves.
- Use real assets as heroes, lit and alive, never as flat stickers.
- No slide feel: no title-over-box layouts and no dense text panels.

## Economy
The owner's usage budget is limited.
- Read only what you need.
- Look at sheets rather than many single stills.
- Make at most 3 review rounds.
- Don't narrate.
- Your final message (≤ 120 words): what you built, its frame range, the static-check result, and any known gaps.
