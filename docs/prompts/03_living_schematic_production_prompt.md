# Production prompt 03: Living Schematic (Style 3, mechanism-first explainer)

- **Composition ID:** `LivingSchematic`.
- **Folder:** `src\styles\style3\`. Wherever Part A says `styleN`, read `style3`, with N = 3 in `cues.json`.
- **Final file**, assembled by the audio and export step: `F:\YouTube Channels\Bits in Motion\Intro Tests\03 Living Schematic\03_mechanism_explainer_intro_1080p.mp4`.

## Part B: the style

**Binding proposal and beat table:** `F:\YouTube Channels\Bits in Motion\Motion Brand\stage_a_files\styles\style3_schematic_v2.md`. Stage A §4.3 has the condensed version. This is the leading candidate, but give it exactly the same process as the others.

**The viewing experience.** For the whole video you stay on one cool, light map of a real PC, drawn like a transit map: every node is a real part and every line is a real power or signal route. A camera that never cuts moves between three named zoom levels, and everything that changes stays changed.

**Identity rules:**
- **Surface.** Cool light, with precise CAD-weight lines and transit-map routing (45° and 90° bends, consistent line weights by role), using the light tokens.
- **The map is on screen from frame 0** in the true soft-off state: off, but plugged in. Parts never "build"; they exist and change state.
- **Camera.** It never cuts. It glides between three named zoom levels.
  - Zoom is capped at ×2.2 per 12 frames.
  - At most one move per sentence, starting in a pause or on a landing.
  - Each level is named in your own small breadcrumb, not AltRepo's.
- **Time device.** "After the press" is the same map inside a dashed preview frame, with states switched where they stand. The return is a visible rewind: the Bit runs back along its own route as states revert, and "Soft-off" is in the header by f346.
- **Signature moves:**
  - persistent state;
  - the pull-back recap;
  - the net trace: a 3 px grey line grown beside a wire to an end tick, showing where a wire ends without pretending a signal moves.

**Fixes and rulings you must apply:**
1. **S09.** Dock the AMD and laptop insets as map callouts beside the parts they change, not as a stacked right-hand column. The real differences:
   - AMD: one package holding both blocks;
   - laptops: a separate EC chip and a battery, and no ATX power supply.
   They stay through the first half of S10, to f1505.
2. **D24:**
   - the S05 hand-over: the ring and its ticks fade to a grey rim, then the "?" fills at f671;
   - the visited mark;
   - the almond eye badge;
   - "+5VSB · ATX" as the only mono line;
   - no park at f59.

**Main risk: it feels like a diagram *about* a PC rather than *your* PC, and tiny parts at full view.**
- Draw the nodes as recognisable simplified hardware silhouettes in their true layout, not abstract boxes.
- Make the zoom levels earn legibility.
- Check every sentence's still at 390 px.

## Part A: shared rules (identical in all five prompts)

### A1. Goal

Build one finished, verified 63-second intro for Episode 01, "What Happens When You Press Power", in the style named in Part B. Build it in Remotion, in code, from the locked narration.

- **It is the real opening of the episode**, not a trailer or a logo sting. Within the same 63 s it must deliver five things:
  - the hook (S01–S02);
  - the reveal: the button sends a signal, and the lookout is not the hidden processor (S03–S05);
  - a real explanation: the chain of handoffs, and standby power (S06, S10–S11);
  - the promise and scope (S07–S09);
  - the hand-off: "Now press." (S12).
- **The quality bar:** the explanation becomes easier to understand *because of* the motion design, and the result feels like an original Bits in Motion episode.

### A2. Inputs (read them; never modify them)

| What | Path |
|---|---|
| Narration master (locked) | `F:\YouTube Channels\Bits in Motion\Videos\01 What Happens When You Press Power\Voiceover\Full Voiceover.mp3` |
| Word timings (normalized working copy, ms) | `F:\YouTube Channels\Bits in Motion\remotion\public\data\ep01_words.json` (the same as `Motion Brand\stage_a_files\ep01_words_normalized.json`) |
| Locked script and claim ledger | `F:\YouTube Channels\Bits in Motion\Videos\01 What Happens When You Press Power\script_voiceover.txt`, `script_editorial.md` |
| Stage A creative direction | `F:\YouTube Channels\Bits in Motion\Motion Brand\Stage A - Creative Direction.md`. Read §3 (brand, including §3.8 terms), §5.7 (fixes and rulings, including the D24 shared-kit details), §6.2–6.5 (excerpt, beat sheet, fairness, judging) and §7 (decision log). |
| Binding shared rules | `…\Motion Brand\stage_a_files\cd_shared_rules_for_the_tests.md` |
| Full brand spec | `…\Motion Brand\stage_a_files\brand_direction_provisional.md` |
| Accuracy guardrails | `…\Motion Brand\stage_a_files\ep01_intro_accuracy_guardrails.md` |
| Final distinctness fix list | `…\Motion Brand\stage_a_files\reviews\distinct_final.md` (§8) |
| Your style's full proposal, with the binding beat table | Named in Part B |
| Shared Remotion kit | `F:\YouTube Channels\Bits in Motion\remotion\docs\KIT.md` (its API) and `remotion\src\shared\` |

**Precedence when sources disagree:**
1. this prompt (Part B, then Part A);
2. Stage A §5.7 and D24;
3. the shared rules file;
4. your style proposal;
5. the brand spec.

The accuracy guardrails override any visual idea.

### A3. Locked audio and the excerpt

- **Words:** W0001–W0180, from "Press your PC's power button…" to "…Now press."
- **Audio:** 0.000–62.000 s, with a 20 ms fade-out.
- **Video:** exactly 63.000 s = 1,890 frames (f0–f1889), 30 fps, 1920 × 1080.
- **Frame 0 is the narration start.** No pre-roll, logo, wordmark, channel name, watermark or title card anywhere.
- **Never** regenerate, re-time, reorder, speed-change, trim or duplicate the narration.
- **All timing is absolute:** frame = round(ms × 30 / 1000) from the word JSON, using the kit's timing helpers. No cumulative durations; no "previous scene ends + N".

**Beat sheet:**

| Beat | Words | Seconds | Frames |
|---|---|---|---|
| S01 | W0001–W0012 | 0.00–4.22 | 0–127 |
| S02 | W0013–W0030 | 4.58–10.86 | 137–326 |
| S03 | W0031–W0041 | 11.18–14.24 | 335–427 |
| S04 | W0042–W0060 | 14.54–20.24 | 436–607 |
| S05 | W0061–W0069 | 20.56–23.52 | 617–706 |
| S06 | W0070–W0087 | 23.90–29.96 | 717–899 |
| S07 | W0088–W0103 | 30.46–35.24 | 914–1057 |
| S08 | W0104–W0121 | 35.60–41.20 | 1068–1236 |
| S09 | W0122–W0137 | 41.58–47.46 | 1247–1424 |
| S10 | W0138–W0161 | 47.94–55.68 | 1438–1670 |
| S11 | W0162–W0178 | 56.02–60.58 | 1681–1817 |
| S12 | W0179–W0180 | 61.00–61.66 | 1830–1850 |

### A4. Shared anchors (each lands within ±1 frame)

| Frame | Event |
|---|---|
| f0 | The button cap is pressed on "Press". The cap travels only here and at f1837. |
| by f8 | The "After the press" time chip (44 px) is in. |
| f33 → about f59 | The flash-forward Bit departs the button on "power button" and lands on the lookout around "and", ripple only. No glyph change on the lookout, and no park. |
| f91 | "doesn't go first": the main processor stays dark. |
| f294 | The "?" wakes on "already at work", still inside the flash-forward. The CPU never shows activity. |
| f327–f346 | The return to the present happens in the f327–f335 pause and is complete by f346: lookout ON (breathing), "?" dim with its badge, CPU dark, main power OFF, under a **"Soft-off"** label. Never "Before the press". |
| f472 → f498 | The S04 demonstration ("When pressed"): the Bit leaves the button on "signal" and lands on the lookout on "small". No cap travel and no click. |
| f671 | The S05 hand-over (D24): the Lens ring and ticks fade to a grey rim, then the "?" fills. |
| f748, f781, f808, f832, f860 | The S06 chain landings, parking on "Windows" at f860. |
| f1194 | "Why different?" lands on "starting" and holds at least 48 frames, into the f1236–f1247 pause or later. It is a question, not a result. |
| f1798 | The brackets lock on the button, on "like". |
| f1830 | The "Now" chip. |
| f1837 | The real press: the cap travels and the Bit departs. |
| f1889 | The last frame: the Bit is still travelling and would land on "power" at f1891. |

Check every anchor against the word JSON before you build. If a frame in this prompt disagrees with the JSON, trust the JSON and log it.

### A5. Brand rules (a summary; the brand spec has the detail)

**Colour roles.** Use the dark values on dark surfaces and the light values on light ones.

| Role | Dark | Light |
|---|---|---|
| Information (travels, as the Bit, on single-line routes) | cyan `#00E5FF` | `#00728C` |
| Energy (fills double-walled channels, never travels as marks) | amber `#FFB000` | `#AD6000` |
| Standby energy | `#A07006` | `#AD6000` |
| Active part outline | `#F3F2EE`, filled pip | ink `#131A2A`, filled pip |
| Inactive part | `#626C81`, hollow pip | `#737C8E` |
| Emphasis (only the Lens ring, the bracket lock-on and the "?" badge, one at a time) | magenta `#EA5FFC` | `#8F1FC2` |
| Problem glyphs (rare) | coral `#FF5468` | `#C01F45` |

There is no green "awake" state. The real ATX standby wire stays purple, shown matte and labelled.

**The Bit.**
- A 24 px rounded square.
- Cruise speed 24 px/frame, maximum 36. A 4-frame ease-in, a linear cruise and a 5-frame ease-out.
- Each hop is at least 10 frames, and each run at most 30.
- It travels only real routes. It lands with a square ripple (24 → 80 px), and the receiver reacts.
- At most 3 on screen. Never decorative.

**The Lens.**
- A thin ring with 4 ticks, opening over 9 frames.
- Inside it the same scene shows its hidden layer, or its real geometry ×4–×8 with a scale chip.
- One at a time, at most twice a minute.

**Keyed tags.**
- A square anchor, a thin leader, a key bar in the role colour, and text.
- Primary line 44 px, sans, sentence case; an optional secondary line 34 px, mono, for a real technical name only.
- A 30 px floor; at most 3 words per label.
- A tag lands on its word (±3 frames) and holds until at least 0.5 s after its sentence ends.

**On screen at once:** at most 3 tags, 2 state pills and 12 must-read words.
**Mono technical line:** only "+5VSB · ATX" (under "Standby power"), plus mono numerals in readouts.

**State glyphs**, docked top-right of a part:
- OFF: hollow square;
- ON: filled;
- ALWAYS-ON: breathing;
- WAITING: ‖;
- LIMIT: !;
- FAULT: ×;
- "?" badge.

**D24 shared-kit details:**
- one "visited" mark: a 3 px annotation-grey outline with a hollow pip;
- one eye badge: an almond with a pupil, dashed ≈ for analogy;
- the S05 hand-over rule;
- one mono line;
- no Bit park at f59.

**Layout.**
- Keep the bottom 140 px clear for captions, and respect the title-safe area.
- Every sentence's still must read at 390 px wide, the YouTube portrait player.

**Dark styles:** the mean luma of the picture area stays at or above about 28/255.

**Never:**
- dissolves between unrelated scenes, whip pans, glitches, flashes, page curls, logo stingers or live blur;
- glow beyond a strict budget;
- decorative icons, mascots or faces on hardware;
- sentences on screen;
- a number the voice doesn't say;
- vendor logos or captured Windows UI.

**Reference signatures you must not use:**
- WhiteboardDoodles: a drawing or erasing hand, red-term/black-gloss labels, a handwritten "N. Title";
- AltRepo: desktop-OS, dock or app-window chrome, a HUD with tab nav or tick ruler, a console pill, snake_case names, corner brackets framing the screen;
- Zanroo: a round-head host, gold number cards, a push-in on every still.

### A6. Accuracy (from the guardrails file)

- The button sends a brief signal; it doesn't switch power on.
- Standby power (+5VSB) is present while the PC is plugged in and the rear switch is on.
- "Lookout" is an analogy: mark it with the dashed ≈ eye badge.
- The "hidden processor" is not named in the intro: keep the "?".
- The main processor stays dark until the chain reaches it.
- Show a typical Intel desktop; AMD and laptops are only "stops", as small unlit outlines with their real difference:
  - AMD: one package holding both blocks;
  - laptops: a separate EC chip and a battery, and no ATX power supply.
- Never show the screen lighting before the narration earns it.
- Don't let a visual imply that every PC follows an identical path.

### A7. Implementation rules

- **Project:** `F:\YouTube Channels\Bits in Motion\remotion`, Remotion 4.0.534, React 18.3.1, TypeScript.
- **Where you work:**
  - Work only inside `src\styles\styleN\`, your own folder. Your entry `src\entries\styleN.tsx` and the composition registration already exist.
  - Do not edit `src\shared\`, other styles, `Root.tsx`, `package.json` or the tools. If you need a kit variant, copy it into your own folder.
  - Your composition component is the default export of `src\styles\styleN\Intro.tsx`.
- **Deterministic:** no `Math.random` and no `Date`; use Remotion's `random(seed)`. Every value comes from `useCurrentFrame()` and absolute frame constants.
- **Art:** all of it original, built in code as SVG, vector or procedural shapes. No competitor frames, stock footage, generated images or downloaded art. Fonts only through the kit.
- **Text:** keep it all as real, editable text elements.
- **Sound:** you don't mix audio. Write `src\styles\styleN\cues.json` in this exact form:

  ```json
  { "style": N, "cues": [
    {"cue": "button", "frame": 0},
    {"cue": "land", "frame": 59, "note": "A"},
    {"cue": "standby", "start": 1475, "end": 1817},
    {"cue": "lens_open", "frame": 191},
    {"cue": "lens_close", "frame": 331},
    {"cue": "lock", "frame": 1798},
    {"cue": "button", "frame": 1837}
  ]}
  ```

  - **Allowed cues:** `button` (only f0 and f1837), `land` (note A, C, D, E or G; the S06 chain steps A-C-D-E-G), `energize`, `standby` (a span; S10–S11 only), `lens_open`, `lens_close`, `dive`, `lock`, `alert`.
  - Sound marks causes, not edits: no cue for a cut or a camera move.
  - Drive the visuals and the cue list from the same frame constants, for example by importing `cues.json` in your code, so they can't drift.
  - The audio team mixes from this file. Your final render is **muted**. For previews you may play `staticFile('audio/voice_intro.wav')`, which may not exist yet.

### A8. Process (bounded; keep moving and decide for yourself)

1. **Plan.** Read the inputs. Turn your style's beat table into exact frames, applying Part B's fixes, D24 and the shared rules. Write `src\styles\styleN\STORYBOARD.md`, a deliverable with one row per beat or meaningful visual action. Each row gives:
   - start and end frames and seconds, word IDs and the recorded words;
   - the idea the viewer must understand;
   - the composition, focal point, layers and exact on-screen text;
   - the assets and how they are made;
   - the actions, each anchored to its word;
   - camera, transition, reading hold and sound cue;
   - the final state and how it connects to the next beat;
   - the check that proves it works.
2. **Build.** Render stills with `node tools/stills.mjs` (see KIT.md) and look at the PNGs yourself.
3. **Look check first, the same for all five.** Check frame 0, your S05 key frame (about f671) and your S10 key frame (about f1500), each at full size and at 390 px wide. Fix the style's base look before building everything else.
4. **Repair cycles, at most three.** In each cycle:
   - render stills at every beat start and end, and at each anchor ±2 frames;
   - inspect them at full size and at 390 px;
   - fix what you find.
   Measure mean luma if your style is dark.
5. **Final render.** Render the full video muted with `node tools/render.mjs` to `remotion\out\styleN\styleN_muted.mp4`. Then:
   - verify 1920 × 1080, 30 fps and exactly 1,890 frames with ffprobe;
   - extract a 1 fps contact sheet, plus 6 fps bursts over f0–f60, f460–f510, f640–f700, f740–f870 and f1780–f1889;
   - inspect them;
   - if you change anything, re-render and re-check the changed range.
6. **Write `src\styles\styleN\REPORT.md`:**
   - what was built;
   - every deviation from the proposal, with its reason;
   - the checks performed. Say plainly that they were frame inspection and technical file checks only: you cannot play video in real time or hear audio.
   - known issues, with severity.

### A9. Acceptance checks (each must pass, or be reported honestly)

- All anchors land within ±1 frame, and tags land on their words within ±3 frames.
- **Text:**
  - no overlaps or clipping;
  - everything inside title-safe, and nothing in the bottom 140 px;
  - nothing under 30 px;
  - within the reading budget;
  - nothing on screen that the narration doesn't say.
- At 390 px every must-read label is readable, and the key parts and states are distinguishable.
- Accuracy follows A6, and the time grammar ("After the press" → "Soft-off" → "When pressed" → "Now") is unambiguous.
- **Brand:** colour roles, the Bit and Lens rules, the tag anatomy and D24.
- The style is clearly itself, per Part B, and carries no reference signature.
- **Motion carries meaning:**
  - whenever the voice names an action, something performs it within the clause;
  - no long static stretches while motion is narrated;
  - nothing moves without a reason.
- **The file:** 1920 × 1080, 30 fps, exactly 1,890 frames, muted, H.264 yuv420p.
