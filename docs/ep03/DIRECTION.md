# Episode 03 rebuild: creative direction (read this first)

**Film:** "Why AI Answers Arrive One Piece at a Time". 612.2 s, 18,367 frames at 30 fps, 1920×1080.

**Brief:** rebuild the whole picture from scratch, in the channel's **Signal Atlas** style. The previous cut, made by another AI, scored 59/100. Its failures:
- slideshow holds (over 25% of frames frozen) and dips to empty stage;
- "ledger-speak" labels in small type ("TTFT", "TP1", "~15.01 GB nominal read");
- flat, primitive 3D;
- the governing metaphor (the bridge) was never built;
- the opening contrast was shown as text panels;
- one navy room for ten minutes, with no re-hooks;
- spoken and on-screen numbers that disagree.

We must be in a different league: premium and cinematic, with constant purposeful motion, a hook that grabs in 3 seconds, and images people remember.

## Locked, never change
- **The narration.** No edits, reordering, speed changes or pause removal. The truth for wording and sync is `docs/ep03/TRANSCRIPT.md` (word@absoluteFrame).
- **Word clock helpers** in `src/ep03/timing.ts`:
  - `at(paragraph, 'phrase', nth?)` returns `{start, end}` in absolute frames;
  - `P(n)` returns a paragraph;
  - `TOTAL` is the frame count.
- **Transcription errors:** P18–P19 say "waits" where the voice means **weights**. On screen, always write "weights".
- **Accuracy guardrails:** `docs/ep03/script_editorial_recorded.md`. On-screen numbers must be the spoken ones (for example ≈16 GB, ×200, 0.03 s, 6.5 s, 3 TB/s, ×300, 1 s → 5 min, 150 tokens/s, ×60, ×3, 40%, ×2–3). If a visual simplifies something, add a footnote of 6 words or fewer.

## The film's spine (recurring motifs; keep them identical everywhere)
1. **The question as 11 token tiles:** "Why do AI answers arrive one piece at a time?" (10 words and "?"). White physical tiles, matching the token-bench assets.
2. **The answer stream:** tiles or words appear one at a time on the reader's screen. The newest piece is marked by **the Bit**, the channel's cyan glowing pellet, the only thing that travels.
3. **The Bridge**, introduced at P11 "here's the picture we'll use from now on":
   - an HBM memory tower (left) joined to the compute die's math units (right) by a luminous bridge;
   - **crates of weights** (≈16 GB per token) cross it for every token;
   - bandwidth is the bridge's width;
   - it recurs at P12, P13, P14, P16–P20 and the close.
4. **Colour roles:**
   - cyan `#00E5FF` = information and data;
   - amber = energy and power (the power-cap dial);
   - coral = problem or wait;
   - magenta = emphasis only, sparingly.
   - Ground: the Signal Atlas navy family (`src/engine/tokens.ts` COLOR).

## Environments (vary them; never one room for ten minutes)
- **(a) Reader world:** `reader-desk.png` photo plate or monitor assets with a chat UI. Warm key light, shallow depth of field.
- **(b) Hardware stage:** dark studio, rim-lit hero PNG assets, light sweeps, soft contact shadows, haze.
- **(c) Inside the package:** a macro world of the die and HBM. Emissive data, glowing traces, depth.
- **(d) Data center:** `server-room.png` plate with parallax and blinking lights. Cool.

Share one grade across all of them: deep blacks, gentle vignette, very light film grain, subtle bloom on emissive cyan.

## Motion rules (hard)
- **Never static.**
  - No stretch of more than **45 frames** without visible motion. Every hold carries a camera drift (0.3–0.8 px/frame or a slow push) plus secondary motion (particles, flowing data, breathing glow).
  - No empty or near-empty frame for more than **6 frames**.
- **Pacing.**
  - A **meaningful visual change every 3–6 s**.
  - A **re-hook every 45–75 s**: a question card, a cliffhanger, a reveal or a scale jump.
- **Physical easing:** overshoot and settle on pops (spring), ease-in-out on camera, follow-through on stops. Use motion blur on fast moves.
- **Sync:** events land on their spoken word within ±3 frames, and labels stay until at least 15 frames after their sentence.
- **Transitions are motivated:** whip pans, zoom-throughs (lens dive), match cuts and object-to-diagram morphs. No cross-dissolve to empty.
- **Determinism:** no `Math.random`. Use `random(seed)` from remotion. Everything is a pure function of the frame.

## Text rules (hard)
- **Minimum sizes at 1080p:** must-read labels at least **40 px**; keywords 64–120 px; hero numbers 160–320 px.
- **Word limits:** at most 6 words per label and at most 12 must-read words on screen at once.
- **Plain viewer words.** No jargon the voice doesn't say. Numbers appear exactly as spoken.
- **Keyword captions** echo the voice (they are not full subtitles), and they slam or pop in on the word.
- **Fonts:** the project fonts (`src/shared/fonts.ts`: SANS = Sora, MONO). Sora is bold for numbers.
- **No overlaps:** text never collides. Keep a 64 px safe margin, and keep the bottom 140 px clear of must-read text (YouTube UI).

## Assets: `public/ep03/assets/` (load them with `staticFile('ep03/assets/<file>')`)
These are premium transparent 1536×1024 product renders, consistent in look. Use them as **hero props**, with 2.5D life: parallax, perspective tilt, light sweeps, shadows, explode swaps between the a–d variants (hide each swap with a whip or flash).

| Files | Subject |
|---|---|
| `BIM129–132_T03_datacenter-gpu_{a,b,c,d}` | Datacenter GPU module: big die plus 6 HBM. a = 3/4 view, b = top, c = die lifted beside one HBM, d = exploded. |
| `BIM133–136_T03_home-graphics-card_{a..d}` | Gaming card. a = 3/4, b = front, c = shroud lifted, d = exploded. |
| `BIM137–140_T03_hbm-stack_{a..d}` | HBM stack beside a compute die (a, b), the stack alone (c), exploded layers (d). |
| `BIM141–144_T03_compute-cache_{a..d}` | Die macro: blue compute tiles plus a small gold on-chip cache. a = 3/4, b = top, c = frameless, d = lid lifted. |
| `BIM145–148_T03_eight-gpu-server_{a..d}` | 8-GPU rack. a = 3/4, b = front, c = one 1U drawer, d = doors open. |
| `BIM149–152_T03_reader-monitor_{a..d}` | Monitor. a = 3/4, b = front (flat screen for a UI overlay), c = ultrawide, d = exploded. |
| `BIM153–156_T03_token-bench_{a..d}` | White token tiles in a rail with a stylus, plus a single-slot holder (c). |
| `BIM157–160_T03_vocabulary-drawer_{a..d}` | Card-file drawer of white cards (the vocabulary). |
| `BIM161–164_T03_weight-field_{a..d}` | Tray grid of square weight tiles, a single big weight (c), tiles lifting (d). |
| `BIM165–168_T03_bf16-holder_{a..d}` | 8-slot rails (bits of one number). |
| `BIM169–172_T03_logical-layer_{a..d}` | Layer shelves with disc stacks (model layers). |
| `BIM173–176_T03_kv-tray_{a..d}` | Tray of cyan and magenta note cards (the "running notes"). |
| `BIM177–180_T03_batch-station_{a..d}` | Grid tray feeding 3 bins (batching). |
| `BIM181–184_T03_quantized-weight_{a..d}` | Grids of 4×4, 4×3 and 4×2 cells (fewer bits); a single frame (183). |
| `BIM185–188_T03_draft-target_{a..d}` | Small draft tiles feeding a target holder (speculative decoding). |
| `BIM189–192_T03_gpu-power-limit_{a..d}` | Triple-fan card with a power dial module; the dial alone (191). |

The photo plates (about 1672×941, cover-scale) are `gpu-macro.png` (dark blue-lit GPU package), `home-gpu.png`, `reader-desk.png` (monitor on a desk at night, warm lamp) and `server-room.png` (data-center aisle).

A labelled montage is at `public/ep03/assets/_montage.jpg`. Exact filenames: `ls public/ep03/assets`.

## The story, section by section

Builders expand their own section into shots. Frames are absolute; get exact word frames from TRANSCRIPT.md.

**S1, P01–P02 (0–1582), the HOOK.** The first 3 s must stop the scroll.
1. The reader's screen: a ~750-word prompt lands *all at once* (a wall of text, then a flash) under a stopwatch that freezes at **0.03 s**. "Less time than a blink" gets a literal eye-blink wipe.
2. The answer then *trickles* out piece by piece while the stopwatch crawls to **6.5 s**.
3. **×200** slams in. The READ bar collapses to a sliver against the WRITE bar.
4. "Each piece depends on the ones before it": tiles chain together.
5. A dive through the screen into the GPU: a gigantic crate stamped **≈16 GB** thunders across toward the die, and out pops… one tiny token tile. "Almost 16 gigabytes! For one piece!" is the contrast image of the film. Do it twice with escalating punch.
6. P02: the question assembles as 11 tiles and becomes the title moment (Atlas opener).
7. The experiment tease: a power dial (BIM191) drops to half and amber drains. Two lanes appear: one slows, one doesn't. **Which is which stays hidden** ("?" on both).

**S2, P03–P04, Tokens.**
- The question is chopped into tiles that click into the token bench, and each tile flips to show an ID number.
- The vocabulary drawer is "the fixed list".
- A counter hits "11 numbers". "Meta's Llama: same 11 pieces".
- P04: "Photosynthesis" splits into "photos" + "ynthesis" (the second piece loses its first letter, as spoken).
- A ruler shows "≈4 characters ≈ ¾ word".

**S3, P05–P07, Scoring, the loop and streaming.**
- P05: zoom out across a vast field of candidate tiles to show the scale of **200,000 options**. Probability bars rise, and a weighted spin picks one ("a dash of randomness"). The same question twice gives two different answers.
- P06: the chosen tile is tacked onto the end, and the model runs again. **THE LOOP** is a circular route with the Bit. The hidden end token is shown ghosted. A counter runs **100 tokens = 100 runs**. A teaser glimpse: "a trick that bends the rule" (later).
- P07: the chat streams. Show "streaming vs not" finishing at the same 10 s. You can read the first half while the second is written. The tail of the answer doesn't exist yet (dashed fog).

**S4, P08–P09, Reading vs writing.**
- P08: a literal **rewind** (time scrubs backwards). The writing chain shows that piece 5 waits for piece 4. The prompt's tiles all light up **side by side** in one run (parallel lanes), chunk by chunk if long. "Writing: one token per run, in order."
- P09 re-hook question card: "So why is each run so slow?" Then the balance:
  - 1,000 prompt tokens ≈ the wait of 4 written tokens;
  - **math ×1000 vs wait ×4**;
  - verdict: "The math isn't the slow part."

**S5, P10–P12, Weights and THE BRIDGE** (the film's centrepiece).
- P10: weights are billions of numbers (the weight field; zoom into a tile and see a number). Three big chatbots' sizes are "?" (names in plain text, no logos). Llama 3.1 has 8 B weights. The BF16 holder: 16 bits = 2 bytes. **8 B × 2 bytes ≈ 16 GB** resolves, with a callback flash to the opening crate.
- P11: the GPU module. The HBM stacks light up as "the card's own memory (VRAM)". The tiny gold on-chip cache is "far too small". **Bridge reveal:** the set builds itself and the crates begin to cross. 32 layers: the token passes through 32 layer shelves. "Almost all 16 GB, every token."
- P12: H100. The bridge is fast (**3 TB/s**, speed streaks), yet narrow next to the math units (a huge highway beside a narrow bridge). **≈300×**: two clocks, **1 s vs 5 min**. The math units sit idle, waiting. A gauge reads **150 tokens/s ≈ ¾ of the limit**.

**S6, P13–P15, The experiment (mid-film hero) and bandwidth.**
- P13: the 8-GPU server, packed. The dial turns to **half power** on all 8 (amber drains). Then a full-frame **split screen**:
  - "Reading prompts": the math slows a lot.
  - "Writing answers": barely changed, because it is bridge-bound.
  - The why: one crate's numbers feed *all* the prompt's tiles at once, versus one tile per conversation.
  - The verdict card: **"Writing waits on memory, not math."**
- P14: bandwidth = how wide the bridge is. The RTX 5090 (home card) has a bridge a bit over half as wide, so it writes at about half the speed, "still plenty for one person".
- P15: one GPU outruns your reading (a race). Re-hook: "So why do chatbots keep you waiting?" Three doors: **before the first word · as a chat gets long · when it's busy**.

**S7, P16–P18, The three waits.**
- Wait 1 (the data center plate):
  - the question travels there and queues;
  - hidden reasoning tokens come first;
  - big models have bigger crates;
  - they're split across tens of chips, with many bridges plus chip-to-chip passing.
- Wait 2 (the KV tray "running notes"):
  - notes save math, not travel;
  - the whole conversation is the prompt;
  - **≈1 GB per 8,000 tokens**, one set per conversation;
  - the haul grows as the chat grows.
- Wait 3 (the batch station):
  - one trip yields the next token for every conversation in the batch;
  - 200 requests give **×60 tokens/s overall** but your tokens are **×3 further apart**;
  - the tradeoff.

**S8, P19–P20, The tricks.**
- The two kinds: fewer bytes per token, and more tokens per trip.
- Quantised weights shrink 16 → 8 → 4 bits, the crates shrink, and too far costs accuracy. 8-bit is **40% faster, not ×2**.
- Speculative decoding (draft-target assets):
  - draft tiles race ahead;
  - the big model checks them all in one trip: ✓✓✓✗;
  - it keeps the good ones and adds its own;
  - **×2–3 faster** with the same answers.

**S9, P21–P22, Close.**
- None of the tricks removes the loop.
- Back to the question tiles. Each piece depends on the ones before. "Most of the wait isn't the math, it's the trip": the bridge hero.
- The question goes in all at once and the answer trickles out (a callback to the opening).
- Final shot: a long pull-back from crates crossing the bridge, again and again, out through the reader's screen as the answer streams "piece after piece". End on a clean, confident hold (with motion) and a channel sign-off frame.

## Technical contract
- **Project:** `F:\YouTube Channels\Bits in Motion\remotion\`. Remotion 4.0.534, React 18; three, @react-three/fiber and @remotion/three are available.
- **Ownership:** work only in your owned files.
  - Sections: `src/ep03/sections/S#.tsx` plus `src/ep03/sections/S#/**`.
  - Kit: `src/ep03/kit/**`.
  - Never edit another builder's files, `src/engine`, `src/shared` or anything outside `src/ep03`, `docs/ep03` and `public/ep03`. **Never write anything under `Codex Work\`.**
- **Section component:** `export const S#: React.FC<{frame:number}>`, where `frame` is the absolute film frame. It must render any frame in [from−30, to+30]; clamp internally. Bounds come from `src/ep03/sections.ts`.
- **Previews:**
  - Stills: `node tools/stills.mjs src/entries/ep03s#.tsx S# <outDir> <frames: a-b:step or list> [--phone] [--luma]`. Frames are absolute.
  - Clips: `node tools/render.mjs --help`.
  - Sheets from video: `python -I tools/sheet.py <video> <out.png> --every N`.
  - Keep preview output in `out/ep03/<you>/` (not in docs).
- **Sound cue list:** each section writes `src/ep03/sections/S#.cues.json`, an array of `{frame, kind, strength}`. Kinds: `whoosh` | `tick` | `pop` | `impact` | `riser` | `swell` | `dial` | `crate` | `sting` | `glitch` | `rewind` | `type`; strength is 0..1. The sound designer uses it later.
- **Economy:** the owner's usage budget is limited.
  - Look at sheets, not dozens of single stills.
  - Make at most 3 render-review rounds per section.
  - Don't narrate.
  - Keep your final message to 120 words or fewer.
