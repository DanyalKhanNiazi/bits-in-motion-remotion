# Production prompt 06: Signal Atlas (style6, the hybrid of 03, 02 and 05; the channel's permanent style)

- **Composition ID:** `SignalAtlas` (plus a dev composition `SignalAtlasCues` that prints the derived cue list).
- **Folders:** `src\styles\style6\` (this intro: `Intro.tsx` + `ep01\world.ts`, `ep01\shots.ts`, `ep01\script.ts`, `cues.json`), on top of the shared engine `src\engine\` and the icon library `src\icons\`. Wherever Part A says `styleN`, read `style6`, with N = 6 in `cues.json`.
- **Entry:** `src\entries\style6.tsx` registers only `SignalAtlas` and `SignalAtlasCues` through the kit's `IntroComposition`; `tsconfig.style6.json` includes `src/shared/**/*`, `src/engine/**/*`, `src/icons/**/*`, `src/entries/style6.tsx`, `src/styles/style6/**/*`. Create them if they don't exist.
- **Final file**, assembled by the audio and export step: `F:\YouTube Channels\Bits in Motion\Intro Tests\06 Signal Atlas\06_signal_atlas_intro_1080p.mp4`. Your muted render: `remotion\out\style6\style6_muted.mp4`.

## Part B: the style

**Binding documents (read all four before writing code):**
1. `remotion\docs\style6\STYLE_BIBLE.md`: the locked style. Every rule and number.
2. `remotion\docs\style6\STORYBOARD.md`: the binding beat table for this intro: the world layout, the shots and camera keys, the chip track, 29 beats with exact frames, every label with its word, land and exit, the cue list, budgets, the motion audit and the checks.
3. `remotion\docs\style6\ENGINE.md`: the engine API you author against (an episode is data: `world.ts`, `shots.ts`, `script.ts`).
4. `remotion\docs\style6\ICONS.md`: the hardware icons and glyphs (render parts only through the icon registry).

Numbers live in `src\engine\tokens.ts`; import them, never copy them.

**The viewing experience.** You glide through one dark, living map of the real machine where only power and signals give off light, and whenever two states must be compared or a moment must be held, a lit plate lifts out of the map so you can see both, with the Bit carrying the cause across the gap.

**Identity rules:**
- **One world, always the truth.** The Intel ATX desktop of `STORYBOARD.md §1`, on screen from f0 in its true soft-off state, never rebuilt. Views (camera, Lens, plates, bands) are windows onto it.
- **Dark, matched to the thumbnails.** Navy-black field, gunmetal parts with 2.5D sides and a rim light, cyan information, amber energy, magenta emphasis, white type (bible §4). Mean luma ≥ 28 on every frame.
- **Light means power or information.** Only the powered part (the lookout), the Bit and live energy are bright; one faked glow at a time.
- **The camera carries; it never cuts.** Ten keyed moves (carries, glides, pushes, pulls), each motivated by a word, a landing or a pause; zoom ≤ ×1.8 per 12 frames; pan ≤ 48 px/frame; no idle drift of the deck.
- **Panels only to compare or to hold time:** the "later" window (S01–S02 only), the six-plate chain peeled from its real parts (S06; the plates alone carry "not now", no window), the AMD and laptop stop plates with scene tweens (S09), the triptych what-if split (S10).
- **The living field** never stops (deep circuit and atlas grid drifting, the light pool on the focus, press rings, pixel ripples, time breaths) and never competes.
- **Signature moves:** the peel, the triptych, the later window, the Bit's pixel trail, the pixel ripple.

**It must not look like any reference or any of the five tests:** no HUD, consoles, OS windows, tab bars, "Diagram" chips, corner brackets framing the screen, snake_case or mono micro-labels beyond "+5VSB · ATX"; no drawing hand; no presenter; no push-in on every still; no light schematic surface; no hard page changes.

**What the owner asked for (verbatim):** "I think we can create someting of a mix and try to get its score above 9. we can use 03 Living Schematic 02 Night Signal 05 Live Panels all otherther, mix and perfect the style, we need to fix and improve icons. i like the animations in 2 and 5. 5 has good clear explanation. 3 has good visuals. branding needs to be considered too. the background it very static. I want you to improve and now create an intro that will have 90+ score. that will decide our editing style. imrpove everyting. keep things flowing. animations need to be improved. i want you to create masterpiece of an editing stlye. that we can use over and over for our channel and one that I can be proud of and is better than all the other on internet."

**The target.** Independent judges score 1–10 on: explanatory clarity, technical accuracy, visual craftsmanship, timing, brand recognition, long-form suitability and repeatable production effort. The target is **9 or more on every criterion** (the best of the five tests was 7.86). `STYLE_BIBLE.md §18` maps each criterion to what earns it; `STORYBOARD.md §10` maps every known weakness of the five tests to its fix. Build to those.

**Fixes and rulings you must keep (they are why this style exists):**
1. Parts big on a phone: when named, a part is ≥ 80 px on its longer side and ≥ 40 px on its shorter side (16 × 8 px at 390), or ≥ 160 px in a Lens or plate, or it reads as a light (lit with the glow, or badged); the "?" badge 44 px (56 as subject, 72 in a Lens); the power button r 36.
2. At a hold, no label, Bit, route, channel, plate or part top face below y 932; only grounds and the dark 2.5D side faces may enter the caption band (bible §13.1, computed for all ten shots).
3. Proof of power: at holds, and whenever the lookout is the subject, the plug seated in its inlet is visible too; during a camera move it may leave up to 12 frames before the lookout does (bible §7.7).
4. Probe 5: the two stop plates are 676 × 360, on screen 4.1 s, and their scene tweens show the real difference at full block size. AMD: both blocks move into the processor package, and a plain chipset stays. Laptops: the lookout moves into its own EC chip and the "?" into the SoC package; a battery, no ATX power supply, no separate chipset.
5. Wake sources must read at 390 px (their 56 px glyphs and the tag; storyboard B26). The standby shimmer must be visible on the full-size frame (bible §8.3, B23–B27). At 390 px the 10 px channel is only 2 px wide, so there the amber line and the "Standby power" tag carry it; do not spend repair cycles trying to make the dashes read on a phone (critic).
6. D24: the S05 hand-over (rim grey f663–f669, "?" fills f671), the visited mark, the almond eye badge (dashed from its first frame), "+5VSB · ATX" as the only mono line, no park at f59.
7. **Critic changes (binding; STYLE_BIBLE "Critic changes"):** S06 has no window, a 45% scrim and the taller row with the names inside (the designer's layout mocked at 26.4 luma). The `monitor` and `column` shots, the moved SPI flash and the r 36 button are as in STORYBOARD §1–2. K7 is f1066–f1118, K8 f1254–f1302, K9 f1506–f1548. The "Main rails: OFF" pill docks under the PSU, and "Power / supply" is a two-line name right of the fan (both used to cover the fan). Labels sit on the flat-fill knockout. Board vias carry the field's reactions.

**Main risks and how to beat them:**
- **Too much motion.** Hold the motion budget (bible §11.6): one primary motion, ≤ 2 secondary, plus the field. Measure foreground still runs with `debug.fieldOff` (≤ 45 frames under speech) and look at the 6 fps bursts for busyness.
- **Small or faint on a phone.** Check every beat at 390 px from the 1080p stills and from a 480p encode; idle outlines ≥ 3:1 at 480p.
- **Congested transitions** at f706–f743 (Lens close, scrim, peels), f914–f952 (returns, scrim, push) and f1685–f1705 (exits, fold, wash). The S06 window was removed to thin the first two. Stagger exactly as the storyboard says; never let two labels be readable in the same slot; `motionGapReport` flags any 30-frame window with more than two camera, panel or Lens moves.
- **Render cost** of several views of one world per frame. Memoise geometry; render at concurrency ≤ 6.
- **Integration with the engine and icons** built by other builders. Follow the milestones of `ENGINE.md §19`: write the full data at M0 against the documented types, render with the registry's placeholder icons, and stub a missing engine function locally behind its documented signature (list every stub). If the engine or icons block you, fix them in place with the smallest change and list every such change in your return value. If time runs short, drop features in the §19 order, never an anchor, guardrail, probe device, the luma floor or the caption-band rule. Never change a value in `tokens.ts` without changing `STYLE_BIBLE.md` to match and saying so.

---

## Part A: shared rules (updated for Signal Atlas where the bible evolves the brand; A3, A4 and A6 unchanged)

### A1. Goal

Build one finished, verified 63-second intro for Episode 01, "What Happens When You Press Power", in the Signal Atlas style. Build it in Remotion, in code, from the locked narration, as data on the shared engine.

- **It is the real opening of the episode**, not a trailer or a logo sting. Within the same 63 s it must deliver five things:
  - the hook (S01–S02);
  - the reveal: the button sends a signal, and the lookout is not the hidden processor (S03–S05);
  - a real explanation: the chain of handoffs, and standby power (S06, S10–S11);
  - the promise and scope (S07–S09);
  - the hand-off: "Now press." (S12).
- **The quality bar:** the explanation becomes easier to understand *because of* the motion design; it scores 9+ on every criterion; it is the template the channel will reuse for every episode.

### A2. Inputs (read them; never modify them unless a rule below allows it)

| What | Path |
|---|---|
| Narration master (locked) | `F:\YouTube Channels\Bits in Motion\Videos\01 What Happens When You Press Power\Voiceover\Full Voiceover.mp3` |
| Word timings (normalized working copy, ms) | `F:\YouTube Channels\Bits in Motion\remotion\public\data\ep01_words.json` (the same as `Motion Brand\stage_a_files\ep01_words_normalized.json`) |
| Locked script and claim ledger | `F:\YouTube Channels\Bits in Motion\Videos\01 What Happens When You Press Power\script_voiceover.txt`, `script_editorial.md` |
| **The style (binding)** | `remotion\docs\style6\STYLE_BIBLE.md`, `STORYBOARD.md`, `ENGINE.md`, `ICONS.md`; `remotion\src\engine\tokens.ts` |
| The engine and the icons | `remotion\src\engine\`, `remotion\src\icons\` |
| Stage A creative direction | `F:\YouTube Channels\Bits in Motion\Motion Brand\Stage A - Creative Direction.md` §3, §5.7, §6.2–6.5, §7 |
| Binding shared rules | `…\Motion Brand\stage_a_files\cd_shared_rules_for_the_tests.md` |
| Full brand spec (provisional; evolved by the bible §17) | `…\Motion Brand\stage_a_files\brand_direction_provisional.md` |
| Accuracy guardrails | `…\Motion Brand\stage_a_files\ep01_intro_accuracy_guardrails.md` |
| The five tests and their assessment | `F:\YouTube Channels\Bits in Motion\Intro Tests\` (videos, storyboards, `Quality Report and Comparison.md`) |
| Shared Remotion kit | `remotion\docs\KIT.md` and `remotion\src\shared\` |

**Precedence when sources disagree:**
1. the accuracy guardrails (they override any visual idea);
2. this prompt (Part B, then Part A);
3. `STYLE_BIBLE.md`, then `STORYBOARD.md`, `ENGINE.md`, `ICONS.md`;
4. Stage A §5.7 and D24;
5. the shared rules file;
6. the brand spec.

### A3. Locked audio and the excerpt

- **Words:** W0001–W0180, from "Press your PC's power button…" to "…Now press."
- **Audio:** 0.000–62.000 s, with a 20 ms fade-out.
- **Video:** exactly 63.000 s = 1,890 frames (f0–f1889), 30 fps, 1920 × 1080.
- **Frame 0 is the narration start.** No pre-roll, logo, wordmark, channel name, watermark or title card anywhere.
- **Never** regenerate, re-time, reorder, speed-change, trim or duplicate the narration.
- **All timing is absolute:** frame = round(ms × 30 / 1000) from the word JSON, using the engine's `w()` / the kit's timing helpers. No cumulative durations; no "previous scene ends + N".

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

Check every anchor against the word JSON before you build (`node tools/anchors.mjs`). If a frame here disagrees with the JSON, trust the JSON and report it.

### A5. Brand rules (Signal Atlas values; the bible has the detail and §17 lists every change from the provisional brand with its reason)

**Colour roles (dark only; `tokens.ts → COLOR`):**

| Role | Value |
|---|---|
| Grounds | field `#0F1729`, deck `#15203A`, board `#1A2742`; bodies `#1F2C48` / `#26344F` / `#2F3E5C`; sides `#0A101C`; void `#070B15` |
| Information (travels as the Bit; held signal levels) | cyan `#00E5FF` |
| Energy (fills double-walled channels, never travels as marks) | amber `#FFB000`; standby `#B8800A` (thin); shimmer `#DC9805` |
| Active part | outline `#F3F2EE` 4 px, body `#41537A`, filled pip |
| Inactive part | outline `#8F9CB5` 3 px (5.37:1 on board), material body, hollow pip |
| Emphasis (only the Lens ring, the bracket lock-on and the "?" badge, one at a time) | magenta `#EA5FFC` |
| Problem glyphs (rare) | coral `#FF5468` |
| Text | ink `#F3F2EE`; muted `#AEB8CB`; annotation `#C3CCDD` |

There is no green "awake" state. The real ATX standby wire, if shown, stays purple, matte and labelled.

**The Bit (v2):** a 24 px rounded square (radius 5) with stepped halo squares (40 px at 18%, 64 px at 9%) and a **three-square pixel trail** (14/10/6 px at 26/46/62 px behind the head, 4 px snap) that echoes the B monogram. Cruise 24 px/frame, maximum 36 (world and on screen); a 4-frame ease-in, a linear cruise and a 5-frame ease-out (the S12 carried run: 2); each hop ≥ 10 frames, each run ≤ 30 (S12 is the documented exception, carried by the camera). It travels only real routes, lands with a square ripple (24 → 80 px), and the receiver reacts. At most 3 on screen. Never decorative.

**The Lens:** a thin ring (4 px, d 400) with 4 ticks, opening over 9 frames with the view revealed by a wedge that follows the pen. Inside it the same world shows its hidden layer, or its real geometry ×4–×8 relative to the view, with a scale chip at 4:30. One at a time, at most twice a minute, held ≥ 45 frames.

**Keyed tags:** a square anchor, a thin leader, a key bar in the role colour, and text on a ground-aware knockout plate (invisible on its own ground). Primary line 44 px Sora 600, sentence case; an optional secondary line 34 px mono, for a real technical name only. A 30 px floor; at most 3 words per label. A tag lands on its word (±3 frames), with its text revealed by a mask from the key bar, and holds until at least 0.5 s after its sentence ends and at least 30 + 9 × words frames.

**On screen at once:** at most 3 tags, 2 state pills, 1 chip, 1 readout, 12 must-read words, 1 emphasis device, 1 glowing part.
**Mono technical line:** only "+5VSB · ATX" (under "Standby power"), plus mono numerals in readouts.

**State glyphs**, docked top-right of a part (14 px pips): OFF hollow; ON filled; ALWAYS-ON breathing; WAITING ‖; LIMIT !; FAULT ×; the "?" badge (44 px; 56 as subject).

**D24 shared-kit details:** one "visited" mark (3 px annotation outline, hollow pip); one eye badge (almond with a pupil, dashed with ≈ for analogy); the S05 hand-over rule; one mono line; no Bit park at f59.

**Layout.** Title-safe x 144–1776, y 96–940; the header zone (the chip only) x 144–948, y 96–196; the top-right corner (x > 1560, y < 196) free of text; **only the living field in the bottom 140 px at a hold**. Every sentence's still must read at 390 px wide.

**Brightness:** mean luma ≥ 28/255 on every frame (target 31–42).

**Camera:** carries and glides per the bible §7; zoom ≤ ×1.8 per 12 frames; pan ≤ 48 px/frame; no cuts in this intro; no idle drift of the deck; no tilt, roll or shake.

**Never:**
- dissolves between unrelated scenes, whip pans, glitches, flashes, page curls, logo stingers, gradients, vignettes or live blur;
- glow beyond the Bit and one narrated powered part;
- decorative icons, mascots or faces on hardware;
- sentences on screen;
- a number the voice doesn't say;
- vendor logos or captured Windows UI.

**Reference signatures you must not use:**
- WhiteboardDoodles: a drawing or erasing hand, red-term/black-gloss labels, a handwritten "N. Title";
- AltRepo: desktop-OS, dock or app-window chrome, a HUD with tab nav or tick ruler, a console pill, snake_case names, corner brackets framing the screen;
- Zanroo: a round-head host, gold number cards, a push-in on every still.

### A6. Accuracy (from the guardrails file; never relaxed)

- The button sends a brief signal; it doesn't switch power on.
- Standby power (+5VSB) is present while the PC is plugged in and the rear switch is on.
- "Lookout" is an analogy: mark it with the dashed ≈ eye badge.
- The "hidden processor" is not named in the intro: keep the "?".
- The main processor stays dark until the chain reaches it (in the intro: always dark, including inside plates).
- Show a typical Intel desktop; AMD and laptops are only "stops", as small unlit outlines with their real difference:
  - AMD: one package holding both blocks;
  - laptops: a separate EC chip and a battery, and no ATX power supply.
- Never show the screen lighting before the narration earns it.
- Don't let a visual imply that every PC follows an identical path.

### A7. Implementation rules

- **Project:** `F:\YouTube Channels\Bits in Motion\remotion`, Remotion 4.0.534, React 18.3.1, TypeScript. Never run `npm install`.
- **Where you work:**
  - Your folder: `src\styles\style6\` (the composition component is the default export of `src\styles\style6\Intro.tsx`), `src\entries\style6.tsx`, `tsconfig.style6.json`, outputs under `out\style6\`.
  - The engine (`src\engine\`) and icons (`src\icons\`) are shared code built by other builders: use them; fix them only when they block you, minimally, and list each change in your return value. `tokens.ts` values change only together with `STYLE_BIBLE.md`.
  - Do not edit `src\shared\`, other styles, `Root.tsx`, `package.json` or the tools.
- **Deterministic:** no `Math.random` and no `Date`; use seeded helpers. Every value comes from the absolute frame and the script.
- **Art:** all of it original, built in code as SVG, vector or procedural shapes. No competitor frames, stock footage, generated images or downloaded art. Fonts only through the kit (Sora 600/700, JetBrains Mono 500).
- **Text:** keep it all as real, editable text elements.
- **Sound:** you don't mix audio. `src\styles\style6\cues.json` must equal `STORYBOARD.md §7` and the engine's `deriveCues(script)` (check with `checkCues`; print the derived list with the `SignalAtlasCues` composition). Allowed cues: `button` (only f0 and f1837), `land` (note A, C, D, E or G; the S06 chain steps A-C-D-E-G), `energize`, `standby` (a span; S10–S11 only), `lens_open`, `lens_close`, `dive`, `lock`, `alert`. An optional `gain_db` of −4 marks previews and demonstrations. Sound marks causes, not edits: no cue for a cut, a camera move, a peel, a split or the window. Your final render is **muted**.

### A8. Process (bounded; keep moving and decide for yourself)

1. **Read.** Part B's four documents, then `tokens.ts`, the engine and icon code as it exists. Run `npx tsc --noEmit -p tsconfig.style6.json` and `node tools/anchors.mjs`.
2. **Author the data.** `ep01\world.ts` exactly as `STORYBOARD.md §1`, `ep01\shots.ts` as §2, `ep01\script.ts` beat by beat (B01–B29) with every frame from `w()` / the tables. The storyboard is binding; you may adjust a label slot, a plate content shot or a route point to fix a collision or a legibility failure, and you must list each adjustment with its reason. Do not re-plan beats.
3. **Look check first** (before building everything): render f0, f300, f671, f800, f1140, f1420, f1640 and f1800 at full size and with `--phone --luma` (`node tools/stills.mjs src/entries/style6.tsx SignalAtlas out/style6/look 0,300,671,800,1140,1420,1640,1800 --phone --luma`). Read every still yourself, at full size and at 390 px. f800 (S06) and f1140 (`monitor`) are the luma-risk frames, and their mock-ups gave 30.6 and 29.4. Fix the base look (palette, icons, field, line weights, knockouts) before continuing.
4. **Build all beats**, then render stills at every beat start and end and at each anchor ±2 frames; read them at full size and at 390 px; read the dev-check output (`browser warning: [kit] …`) and fix every warning.
5. **Repair cycles, at most three.** Each cycle: stills + bursts of the changed ranges; full size and 390 px; luma; fix.
6. **Final render.** `node tools/render.mjs src/entries/style6.tsx SignalAtlas out/style6/style6_muted.mp4`. Then:
   - verify 1920 × 1080, 30 fps and exactly 1,890 frames with ffprobe;
   - a 1 fps contact sheet (`python -I tools/sheet.py … --every 30`) and 6 fps bursts over f0–f60, f300–f360, f460–f510, f640–f700, f740–f870, f1240–f1320, f1500–f1680 and f1780–f1889;
   - a per-frame luma pass over all 1,890 frames (every frame ≥ 28) and a 480p test encode read at 390 px;
   - inspect them; if you change anything, re-render and re-check the changed range.
7. **Report in your return value** (the harness blocks report `.md` files): what was built; every deviation from the storyboard with its reason; every engine or icon change; the checks performed, stated plainly as frame inspection and technical file checks only (nobody can play video in real time or hear audio here); known issues with severity.

### A9. Acceptance checks (each must pass, or be reported honestly)

- All A4 anchors within ±1 frame (`checkAnchors`); every label in `STORYBOARD.md §6` lands within ±3 frames of its word and exits no earlier than its hold minimum (`checkTagSync`).
- **Text:** no overlaps or clipping; everything inside title-safe; nothing below y 940; nothing under 30 px; within the budgets (`checkBudgets`); nothing on screen that the narration doesn't support.
- **Phone:** at 390 px every must-read label reads; named subjects are ≥ 16 px (or shown in a Lens or plate); idle outlines ≥ 3:1 on a 480p encode.
- **Brightness:** every one of the 1,890 frames has mean luma ≥ 28.
- **Caption band and proof of power:** at holds, no label, Bit, route, channel, plate or part top face below y 932 (grounds and dark 2.5D sides may cross); the plug in frame at holds and whenever the lookout is the subject, with the 12-frame move grace (`checkSafeAreas`, `checkProofOfPower`).
- **Motion:** zoom ≤ ×1.8 / 12 frames, pan ≤ 48 px/frame, Bit ≤ 36 px/frame on screen (`zoomRateReport`, `panSpeedReport`, `bitScreenSpeedReport`); with `debug.fieldOff` no foreground still run longer than 45 frames under speech; with the field on, no run of identical frames longer than 6; one primary motion at a time (`motionGapReport`); no cuts.
- **Accuracy** follows A6 and every guardrail red line at every anchor ±2 and on every plate and band frame; the time grammar ("After the press" → "Soft-off" → "When pressed" → "Soft-off" → "After the press" → "Soft-off" → "Intel desktop" → "Soft-off" → "Now") is unambiguous.
- **Brand:** colour roles, the Bit v2 and Lens rules, the tag anatomy, D24, the living field, and no reference signature.
- **Sound:** `cues.json` equals the derived list; spacing ≥ 6 frames.
- **Code:** `npx tsc --noEmit -p tsconfig.style6.json` passes; the intro folder is data on the engine (target ≤ 1,200 lines including data).
- **The file:** 1920 × 1080, 30 fps, exactly 1,890 frames, muted, H.264 yuv420p.
