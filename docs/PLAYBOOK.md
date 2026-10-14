# Bits in Motion: long-form episode production playbook

This is for a Claude Code session that produces one full episode end to end.

It was proven on Episode 03, "Why AI Answers Arrive One Piece at a Time". Scores on the rubric in §6, all from frame-based review:

| Version | Score |
|---|---|
| Codex | 59 |
| Our v1 | 76 |
| Our v2 | 79.4 |
| Our v3 | 83.6 |

The Ep03 implementation is the reference. Read its code and documents when you need a concrete example:
- `remotion/src/ep03/` (the kit and sections S1–S9)
- `remotion/docs/ep03/` (DIRECTION, SECTION_BRIEF, KIT, TRANSCRIPT, plans, fixes)
- `remotion/audio_build/ep03/` (sound palette and mixer)

---

## 1. Non-negotiable rules

1. **The narration is locked.** It is the owner's recording, `Videos/0N …/Voiceover/fullvoiceover.mp3`.
   - Don't edit it, reorder it, change its speed, remove pauses, regenerate it or replace the voice.
   - Only a fixed gain and a true-peak limiter are allowed.
   - It starts at t = 0.
   - Verify it is sample-aligned against the source: correlation of at least 0.9999 after gain.
2. **The transcript is truth and is never regenerated.** Use the owner's word-level SRT, `Transcription/fullvoiceover.srt`.
   - Use only the single-word cues (the cues where one word is wrapped in `<u>…</u>`). Ignore the cumulative sentence cues.
   - Watch for homophone errors in the SRT. Ep03 had "waits" where the voice says "weights". On screen, always write the intended word.
3. **Accuracy.**
   - Follow the guardrails in `script_editorial.md`.
   - Every number on screen is a number the voice says, in the same form (≈, "about", units).
   - A visual simplification gets a footnote of 6 words or fewer.
   - No jargon the voice doesn't say.
4. **Licensed media only.**
   - Music: only tracks whose licence is documented in `remotion/audio_build/CREDITS.md` (the Pixabay tracks; credit is optional).
   - Sound effects: synthesize them, or use the licence-checked Signal Atlas kit `remotion/audio_build/sfx/style6/`.
   - **Never use** Ocular Sounds, BOOM Library or The Chris Alan 8-Bit SFX. They show up with UCS-style names: DSGNDron_, DSGNRise_, COMCam_, MAGShim_, "B00M".
   - **Also never use** Muctau, CSFX, files starting "AM - ", or anything from Epidemic Sound.
   - Don't assume public footage is reusable, and don't use other channels' scenes.
5. **Never write anything under `Codex Work\`.** Treat it as read-only reference. Don't make purchases, upload publicly or expose private files.
6. **Honesty.**
   - All reviews are made from decoded frames only. Nobody can watch real-time playback or listen, so say exactly that.
   - Never claim a kind of review you didn't perform.
   - Report scores exactly as measured.
7. **Untrusted downloads** go in their own folders. Run Python with `-I`.

## 2. Inputs for an episode

| Input | Where |
|---|---|
| Spoken script | `Videos/0N <title>/script_voiceover.txt` (paragraphs = the story beats) |
| Guardrails and research | `Videos/0N <title>/script_editorial.md` |
| Voice | `Videos/0N <title>/Voiceover/fullvoiceover.mp3` (ignore the other ElevenLabs takes) |
| Word timing | `Videos/0N <title>/Transcription/fullvoiceover.srt` |
| Hero renders | `remotion/public/ep0N/assets/`. These are transparent PNGs the owner generates from `Codex Work/Asset Prompt Library - 8 Topics - Final/0N …/PROMPTS.md`. Keep the filenames from that file. |
| Codex's timeline (optional cross-check) | `Codex Work/remotion/public/episodes/0N/timeline.json` (read-only) |

**Total frames** = ceil(voice duration in seconds × 30). Ep03: 612.2057 s gives 18,367 frames.

## 3. The pipeline

Work in phases, and check each phase before starting the next.

### Phase 0: Setup (main session, about 15 min)
- **Kit.** Copy `src/ep03/kit` to `src/ep0N/kit`, so Ep03 stays reproducible.
- **Timeline.** Build `public/ep0N/timeline.json` from the SRT:
  - paragraphs come from `script_voiceover.txt`, matched word by word;
  - for each word, frame = round(ms × 30 / 1000);
  - write it as `paragraphs[{id, start, end, text, words[{id, text, start_frame, end_frame}]}]`;
  - cross-check it against Codex's timeline if one exists.
- **Clock and sections.**
  - Copy `src/ep03/timing.ts`; the `at(paragraph, 'phrase')` helper returns absolute frames.
  - Copy `src/ep03/sections.ts`, re-cut into 8–9 sections of 40–110 s each, split at paragraph breaks.
  - Write `src/ep0N/Film.tsx`.
- **Entries.** Each `src/entries/ep0Ns#.tsx` registers a composition that spans the whole film, so preview frame numbers are absolute. The full-film entry is `src/entries/ep0N.tsx`.
- **Docs.**
  - Write `docs/ep0N/TRANSCRIPT.md`: every word as `word@frame`, grouped by section and paragraph. Ep03 has a 20-line Python generator in its history; rewrite it.
  - Copy the guardrails into `docs/ep0N/`.

### Phase 1: Direction (main session; this is the creative core)
Write `docs/ep0N/DIRECTION.md`, modelled on `docs/ep03/DIRECTION.md`. It must contain:
- the locked rules;
- **the spine**: ONE governing metaphor, introduced on screen explicitly ("here's the picture we'll use") and reused until the callback, plus 3–5 recurring motifs and the colour roles;
- 3 or more environments;
- the motion rules and the text rules (both in §4);
- an asset catalogue saying what each render is for;
- the story, section by section: the hook, the signature image, the mid-film hero, the re-hooks and the callback ending.

Check the direction against the banger formula (§7) on paper before anything gets built.

### Phase 2: Kit (1 agent, about 60 min)
- Adapt the kit to this episode's metaphor and props, keeping the API style of the Ep03 kit.
- The governing metaphor must be **one kit component** that every section uses. In Ep03, letting S5 build its own Bridge caused a continuity break that cost a fix round.
- Deliverables:
  - a `KitDemo` composition;
  - a contact sheet;
  - `docs/ep0N/KIT.md`, 250 lines or fewer.
- **Quality gate:** the main session views the sheet. Reject anything that reads as slides, or as flat stickers rather than lit, living props.

### Phase 3: Sections (up to 9 agents in parallel, in the background)
- Each builder owns `src/ep0N/sections/S#.tsx`, the folder `S#/`, `S#.cues.json` and `docs/ep0N/plans/S#_plan.md`.
- Give every builder the same `docs/ep0N/SECTION_BRIEF.md`. Copy `docs/ep03/SECTION_BRIEF.md` and add the screen-space text rule from §8.
- Each builder works in this order: plan, build, self-review (at most 3 rounds), then cues.

### Phase 4: Assemble (main session)
1. **Render one section at a time**, at concurrency 6 or less. The 13700K hits 100 °C at concurrency 12.
   - Use `render/queue.sh` (copied from `Claude Work/Episode 03 - AI Answers/render/queue.sh`). It retries, skips valid files and sets a durable TEMP/TMP.
   - Before joining, confirm each MP4 is newer than the last edit to its section and to the kit.
2. **Join** with ffmpeg's concat demuxer (`-c copy`), verify the frame count equals the total, and run `python -I tools/static_check.py <film>`.
3. **Mix.**
   - Copy `audio_build/ep03/` to `audio_build/ep0N/` and point it at this episode's voice, cues and output.
   - Targets: −14 LUFS ±0.5 integrated, true peak −1 dBTP or lower, music at least 18 LU under the voice, and the voice correlation check passing.
4. **Mux** with `-af apad -shortest`, so the last video frame is kept. Export `exports/…_v1_preview_1080p.mp4`.

### Phase 5: Review, fix, re-review
- **Review.** Use 3 range reviewers with the rubric (§6), working from frames only. Each returns per-section JSON: a score, plus issues with frames, severity, what's wrong and the fix. Save them as `docs/ep0N/fixes/S#_vK.json`.
- **Fix.**
  - Send kit-level bugs to the kit agent **first**.
  - Then resume **the same builders** with SendMessage. They keep their context, so a fix round costs about 90k tokens per builder.
  - Re-render only the sections that changed, and delete stale renders.
- **Re-review.** Stop at 85 or above, or after 2 fix rounds, whichever comes first.

### Phase 6: Deliver
- `exports/Bits_in_Motion_0N_1080p.mp4`
- A README containing:
  - what was done;
  - the scores, with the frames-only caveat;
  - the remaining issues;
  - the credits;
  - how to rebuild.
- **Packaging:**
  - 3 title options;
  - 3 thumbnail concepts;
  - a 1280×720 thumbnail candidate, rendered as a still from the signature image with a 3–4 word overlay.

## 4. The editing style: Signal Atlas, long-form

- **Colour roles.**
  - Cyan `#00E5FF` means information and data. It is "the Bit", the only thing that travels.
  - Amber means energy and power.
  - Coral means problems and waits.
  - Magenta is emphasis only, used sparingly.
  - Grounds use the navy family from `src/engine/tokens.ts` (COLOR).
- **Grade:** deep blacks, a gentle vignette, very light grain, a little bloom on emissive cyan. Keep one grade across every environment.
- **Environments:**
  - photo plates with Ken Burns moves and depth blur;
  - a dark hardware stage with rim-lit hero renders, light sweeps and contact shadows;
  - a macro "inside" world of emissive traces;
  - the reader's world (desk or monitor with a chat or UI).

  Vary them; never stay in one room.
- **Hero renders are props, not stickers.** Give them 2.5D life: parallax, perspective tilt, specular light sweeps, a float, depth of field, and a/b/c/d variant swaps hidden by a whip or flash.
- **Type.**
  - Use Sora, with Sora Bold for numbers.
  - Must-read labels are **at least 40 px on screen**. Keywords are 64–120 px. Hero numbers are 160–320 px.
  - A label has 6 words or fewer, and no more than 12 must-read words may be on screen at once.
  - Keep a 64 px safe margin, and keep the bottom 140 px free of must-read text.
  - Keyword captions echo the voice and slam in on the word. They are not subtitles.
- **Motion.**
  - Never static: no stretch of 45 frames without visible motion, and no near-empty frame longer than 6 frames.
  - A meaningful visual change every 3–6 s.
  - A re-hook every 45–75 s: a question card, a cliffhanger, a reveal or a jump in scale.
  - Physical easing: overshoot and settle on pops, ease-in-out on the camera, follow-through, and motion blur on fast moves.
- **Transitions** must be motivated: whip pans, zoom-throughs or lens dives, match cuts, object-to-diagram morphs, a literal rewind where the script says "rewind". Never a cross-dissolve to empty.
- **Sync:** an event lands within ±3 frames of its spoken word, and a label holds until at least 15 frames after its sentence ends.
- **Sound vocabulary** (cues as `{frame, kind, strength}`): whoosh, tick (a token or unit commits), pop, impact (hero beats only), riser (before reveals), swell, dial, crate, sting (verdicts), glitch, rewind, type. Aim for about 6–14 per minute.

## 5. Checks (run them; don't assume)

| Check | Tool | Pass |
|---|---|---|
| Frame count | `ffprobe -count_frames` | Equals the total frames |
| Frozen and empty | `tools/static_check.py` | 0 frozen stretches; empty frames only where deliberate (for example, a blink) |
| Loudness | mixer `measure.json`, plus ebur128 on the export | −14 ±0.5 LUFS; TP ≤ −1 dBTP; music at least 18 LU under the voice |
| Voice alignment | mixer cross-correlation | Lag 0, correlation ≥ 0.9999 |
| Legibility | 390 px phone copies of every text-heavy frame | Every must-read word readable; measure on output frames, not font sizes in code |
| Collisions and safe area | Dense contact sheets at transitions | No overlaps, nothing clipped, 64 px margins |
| Sync | Contact sheets against `TRANSCRIPT.md` | Within ±3 frames |
| Numbers | Every on-screen number against the transcript | All spoken, same form |
| Continuity | Dense sheets at section boundaries | No jumps or repeated beats; the governing metaphor looks identical everywhere |

## 6. Scoring rubric (frame-based; honest; no inflation)

| Criterion | Weight | What 9/10 looks like |
|---|---:|---|
| Explanatory clarity | 25% | Every idea is a concrete image you understand without reading |
| Technical accuracy | 15% | Numbers and claims match the voice and the guardrails, with scoped footnotes |
| Visual craftsmanship (3D, design, type) | 20% | Premium lit heroes, clear figure–ground, perfect type, no collisions |
| Timing and choreography | 15% | Word-locked events, physical motion, motivated transitions, nothing static |
| Brand recognition | 5% | Signal Atlas colour roles, the Bit, Atlas chapter openers, a consistent grade |
| Long-form engagement | 15% | A 3 s hook, re-hooks every 45–75 s, a signature image, a mid-film hero, a callback |
| Repeatable production | 5% | Deterministic code, documented, rebuildable with one queue |

Overall = Σ(score × weight) × 10. Run 3 range reviewers in parallel and average them.

For calibration: Codex's Ep03 scored 59, and ours reached 83.6 in its third version.

## 7. The banger formula (check this in Phase 1 and in every review)

1. **The first 3 seconds open on the payoff**: the contrast or the "wait, what?", never a logo, a title card or a product beauty shot. Ep03's v1 lost points for opening on a turning GPU.
2. **Within 30 seconds the viewer has a question they need answered**, and the episode promises to answer it, plus a teased experiment or reveal whose outcome stays hidden.
3. **One signature image**: an absurd, visual contrast people would screenshot and share. Ep03 used a giant "≈16 GB" crate that delivers one tiny token: "For ONE piece!". Give it scale, slam, shake and sound.
4. **One governing metaphor**, named on screen, reused everywhere, called back at the end. Ep03's was the bridge between memory and math.
5. **A mid-film hero:** the experiment's payoff as a full-frame split screen with a verdict card.
6. **A re-hook every 45–75 s:** a question card, a cliffhanger, a "here's a prediction to make" quiz, or a jump in scale.
7. **Variety:** at least 3 environments, scale ladders (data centre, then board, then chip, then a macro) and changes in camera language.
8. **Satisfying physical motion:** things click, snap, slam, pour and stack. Every beat feels tactile.
9. **Sound design** that makes the motion land: ticks for commits, whooshes on moves, impacts only on hero beats, risers before reveals.
10. **The ending calls back to the opening image**, now understood, and pulls out on the governing metaphor, ending on a calm hold that still moves and a clean "Bits in Motion" sign-off.

**What not to do** (the failures in Codex's cuts):
- slideshow holds;
- title-over-box layouts;
- dense "ledger-speak" labels;
- tiny type;
- flat, primitive 3D;
- one navy room throughout;
- numbers that disagree with the voice;
- dips to an empty stage between scenes.

## 8. Lessons from Ep03 (avoid these traps)

- **Measure text in screen pixels.** A camera zoom shrank labels that builders had set to 60 px down to 14–30 px on screen.
  - Use the kit's `screen` prop on Label, KineticText and Footnote.
  - Check legibility on 390 px copies of the actual output.
- **%TEMP% gets wiped on this machine mid-render.** Set TEMP and TMP to `Claude Work\tmp`; `queue.sh` does this.
- **Parallel renders cause browser-setup timeouts and push the CPU to 100 °C.** `tools/render.mjs` already sets a 180 s timeout. Render one section at a time at concurrency 6 or less, and don't overlap with other heavy jobs (Codex renders, other sessions).
- **Stale renders:** a queue that skips "valid" files will happily keep an old render. Check timestamps against the code.
- **Kit changes affect every section.** Make kit fixes first, then section fixes, then render.
- **Builders' reports aren't proof.** Reviewers must measure on the output frames.
- **Use the owner's renders for hero objects.** They lifted craft more than any code. When an object is still drawn in code and matters (a crate, a stopwatch, a gauge), ask the owner for at most 4–8 specific renders, then swap them in through kit props such as `imageSrc`.
- **Accuracy beats spectacle.** In Ep03, a PCIe card render was rejected because the test GPU was the SXM part (over 3 TB/s).

## 9. Orchestration and budget

- **Agents.**
  - Use the Agent tool, in the background, for the kit and the builders. They can be resumed with SendMessage.
  - Use a Workflow for the parallel reviews, if available.
  - Never run more than 10 agents at once.
  - Use the default model for the creative work and Sonnet for sound and measurement.
- **Agent messages:**
  - A final message is 120 words or fewer.
  - Contact sheets rather than many single stills; no more than 12–14 images per review agent.
  - No narration.
- **Measured usage on Ep03** (tokens as reported by the agents; mostly cached input):

  | Work | Tokens |
  |---|---|
  | Kit (including later upgrades) | ~0.7M |
  | 9 builders (including 2 fix rounds) | ~6M |
  | Sound | ~0.7M |
  | 4 review passes | ~1.3M |
  | Main session | ~1–2M |
  | **Total** | **~10–12M** |

- **Budget guard.** Keep `docs/ep0N/USAGE.md` and add each agent's reported tokens to it. If the total passes the cap in your run brief, finish the current phase, export what exists, and stop with a report.
