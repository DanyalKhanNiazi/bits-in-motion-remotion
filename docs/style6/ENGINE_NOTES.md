# Signal Atlas engine: builder's notes (as built)

`src/engine/` implements `ENGINE.md`. Import everything from `src/engine` (the barrel). This page lists only what an
intro builder needs beyond `ENGINE.md`: wiring, the places where the built API differs or adds to it, and the
verification beds.

## Wiring

```ts
// src/styles/style6/ep01/icons.ts  (import it FIRST in world.ts, before any buildScript)
import {getIcon} from '../../../icons';
import {registerIcons} from '../../../engine';
registerIcons(getIcon);
```
`<Atlas world script icons={getIcon}/>` also works, but then the dev checks (run by `buildScript` at module load) resolve
anchors through the engine placeholders. Example: `src/entries/engineicons.register.ts`.

## Differences from ENGINE.md

| Where | As built |
|---|---|
| `signal/routes.ts` | `signal/routes.tsx` (it holds JSX). Same exports. |
| `LivingFieldProps.ref` | `refShot` (React reserves `ref`). `View`, `Plate`, `tagAt`, `WorldLayer` take an optional `refShot` too (room parallax). |
| `Cam` | adds optional `e` (eased key progress), `from`/`to` (shot names; tag slots use them) and `origin`. |
| `cam()` | `at`/`dur` may be omitted when `carry` is set: derived as depart − 2 and run + 2 + 12. |
| DSL | adds `press(part, at)` (contact 3 frames, release frames 6–11) and `point(part, at, to)`; `buildScript` also accepts a partial script (`ScriptInput`). |
| `Script` | adds `standby?` (the cue span) and `lastFrame?` (checks, focus). |
| `FieldEvent` | `land` takes `space: 'screen'` (row landings, derived). `FocusKey` takes `to`. |
| `LensSpec` | adds `diveAt` / `surfaceAt`; `buildScript` adds the matching camera cuts (dive: at `diveAt + 16`). |
| "?" badges | drawn only by the engine's GlyphLayer, in every view (44 / 56 subject / 72 in a Lens): blocks with `badge: 'q'` and standalone `logicBlock` parts with `props.badge: 'q'`. `WorldLayer` strips `badge` before calling an icon. Drive them with `qFill` / `qAccent`. |
| Brackets | `BracketsLayer`, drawn by `Atlas` above the labels. |
| Split | `SplitBands` (alias `Split`) draws before the main view, `SplitCenterRule` after it; the main view's clip shrinks to the centre band over the first 8 frames while the bands slide out from under it over 12; bands never draw inside the main clip. |
| Tags | `side: 'left'` mirrors the block (key bar on the right, text right-aligned, revealed leftward). Label boxes use measured Sora metrics (`labels/metrics.ts`), not the live font. |
| Captions | enter with the mask, exit with a 6-frame fade (no clipped half-words while a plate moves). |
| Peel | lift over frames 0–4; position follows the `peel` curve over 14 frames with a quadratic launch (no velocity jump). Content area: row6 = top 264 px; `caption.place: 'top'` = below the caption; `'name'` = above the name area. |
| Scrim | fades in with `move`: start it with the first peel. Starting it 4 frames earlier dipped mean luma to 25.6 in the demo. |
| Draw order | parts sort by `order`, else `z`. A part sitting on a taller part needs `order` (the button on the front panel: `order: 30`). |
| Knockout | takes optional `script` (lit fills, washes) and `within` (the window or split clip). |

## Checks you will see

`buildScript` prints `[kit]` lines (tools show them as `browser warning`). The caption-band check treats only
`case`, `board`, `laptopBoard` as grounds. On the Ep01 world at `monitor` (1560, 360, ×1.5) the `pwrbtn` trace at
y 712 projects to y 1068 in the bottom-left corner: expect that line unless the route or the shot moves.

## Verification beds (`src/entries/enginedemo.tsx`, `engineicons.tsx`)

`EngineDemo` (300 frames: carry, pull, tags, pill, chip, fill-front, shimmer, wash, ink + end tick, a 3-plate row with
the Bit crossing two gutters, Lens iris and dive), `EngineDemoFieldOff`, `EngineTestPanels` (window, triptych with band
divergence, AMD tween plate), `EngineTestGlyphs` (eye, "?" fill, brackets, wake routes and glyphs, readout, command
chips, fork, arc, card, scope line), `EngineDemoIcons` (the demo with the real icon library).
Type-check: `npx tsc --noEmit -p tsconfig.engine.json` (and `tsconfig.engineicons.json`).

## Episode workflow (round 1)

1. **Copy** `src/styles/style6/epXX_template/` to `epNN/` (world, shots, script, Intro: about 90 lines to start).
2. **World:** parts from the icon registry with world rects, routes as point lists (the same points draw the route and
   carry the Bit), channels from source to load, domains as rounded `blobs`. New hardware needs a new icon in `src/icons`.
3. **Shots:** name framings by what they show; the reference shot matches room objects to the deck.
4. **Script:** every time from the narration — `w('W0123', offset)`, `wEnd`, `sentence('S04').end`, `pauseAfter`, `A4.*`.
   Run `node src/styles/style6/lint-times.mjs` (it fails on any bare frame in a time field).
5. **Grammar for free:** a hop with `receiver` gets the signature landing (outline ripple, monogram burst, field pulse
   wave); plates in a row peel from their own parts in narrative order (`peelAt: PEEL + 5 × i`, `returnAt: BACK + 3 ×
   (n − 1 − i)`); a triptych with `content` shows a recomposed cause-to-effect scene in every band.
6. **Check:** `npx tsc --noEmit -p tsconfig.style6.json`; stills with `tools/stills.mjs` print every `[kit]` warning
   (anchors, tag sync, budgets, proof of power, safe areas, motion gaps, references, cues); fix them or give a tag a
   documented `holdWaiver`.
7. **Render** with `tools/render.mjs` and inspect a 1 fps sheet plus bursts over every transition (frames only).

Ep01's intro as data after round 1: `script.ts` 410 lines (94 of them comments or blank), `scenes.ts` 185, `world.ts`
79, `shots.ts` 45, for 63 s of the densest part of the episode, on the shared engine (8,909 lines) and icon library
(6,219); long-form chapters reuse the same world and scenes.

## Episode workflow (round 2 additions)

- **Shots from intent:** `frameParts(WORLD, ['button', 'psu', 'plug'], {pad, maxZoom})` returns the Shot that fits those parts
  in the meaning area (title-safe, under the chip, above the caption band). Hand-tuned shots still work; Ep01 keeps its
  tuned ones, the template uses `frameParts`.
- **Tags from intent:** `slot: 'auto'` places a tag at the clearest of six positions round its anchor at its landing
  frame and lets it ride with the anchor; `moreAnchors` adds a leader per extra anchor ("Wake sources" → two badges).
- **Comparison devices as data:** two-way = two `pairWide` plates with scene content and plate-scoped glyphs
  (`loopArrow`, `powerRing`, `problem`); variants = `pairRight` plates with `tags` inside; a chain = `row6` with
  `caption.ghostAt` (names read ahead, dimmed); a what-if = a triptych with `content.source` (the centre band lifts from
  that world region). Every plate uses fade-through-ground; nothing is ever translucent over the world.
- **The Bit's grammar for free:** `restFrom` gives the birth (the monogram's three pixels merge into the head), a hop's
  `receiver` the signature landing, `quiet: true` a landing without glow (a processor in a preview).
- **Proof:** `SignalAtlasTemplate` (in `src/entries/style6.tsx`) renders the template with no check warnings.
- **Icons:** `src/icons/topics/` is seeded for Ep02 (router, antenna, phone, rfChip) and Ep03 (gpuPackage, hbmStack);
  the gallery's "seeded topics" page shows them (`node tools/stills.mjs src/entries/icongallery.tsx IconGallery
  out/icons/topics 2190`).

Ep01's intro as data after round 2: `script.ts` 530 lines (about 150 of them comments or blank), `scenes.ts` 183,
`world.ts` 83, `shots.ts` 44, for 63 s of the densest part of the episode, on the shared engine (about 9,600 lines) and
icon library (about 6,700 lines, 6 topic icons included).

## Episode workflow (round 3 additions)

- **Devices are one call** (`src/engine/panels/devices.ts`, ENGINE.md §23): `sceneFrom(WORLD, ['monitor'], {id})` cuts a
  plate scene from the world (a block becomes its own part: `{part: 'chipset', block: 'q', id: 'q'}`), `stageShot(scene,
  id, px)` frames a stage, `chainRow({id, stages, peelAt, backAt, lands, restFrom})` returns `{plates, row, bit}` for a
  whole sequence. Give each stage a `hero` and the plate carries that part out of the world (a dashed socket stays).
- **Another machine** in a plate (a vendor or form-factor stop): `lift: 'card'`, and name unlabelled shapes with muted
  `names` (supporting text, not counted as must-read).
- **The chip says time only** ("Soft-off", "After the press", "Now"); put a scope in `ChipStep.scope`, and `dim` it
  while plates show a different time.
- **One thing, one tag:** rename it with `steps` instead of stacking a second tag; a heading over busy ground takes
  `card: true`; a tag with no `slot` is placed from intent.
- **The first press of an episode** gives its Bit `birth: 'signature'` (the brand moment); every other birth is plain.
- **Measure, don't guess:** `python -I out/style6/r3/tools/measure.py <video>` prints the frame count, mean-luma
  min/mean/max (and frames under 28), the share of near-static frames at 480 × 270 (< 0.05% and < 0.2% of pixels
  changing by more than 12 levels) and the longest near-static run.

Ep01's intro as data after round 3: `script.ts` 542 lines (the chain is one `chainRow` call; the S06 and S08 scenes
are cut from the world), `scenes.ts` 188, `world.ts` 83, `shots.ts` 47, `icons.ts` 10: 870 lines for 63 s, on the
shared engine and icon library. `SignalAtlasTemplate` renders a three-stage chain cut from its world in about 15 lines,
with no check warnings.

## Episode workflow (round 4 additions)

- **The glossary first.** Write `Videos/<NN Title>/glossary.md` before the labels: one name per object, a technical
  name only as a tag's `secondary` (40 px mono subline), a rename only as a `step` on the narration's renaming word
  (pre-roll it 3 frames so it is readable on the word). Plate `names` are 44 px and count as must-read words.
- **A hero plate returns as its hero** (nothing to set): the scene fades in the slot, the card dissolves round the hero,
  the hero flies home alone. Use `returnFrames(spec)` / `plateEnd(spec)`, never `returnAt + 12`. For a row, set
  `peelStagger`, `backStagger` and `backOrder` (right to left, the next sentence's subject last).
- **Another machine slides:** `lift: 'slide'` (in from the right edge, 14 frames; out 10). `lift: 'card'` is retired
  for new work. A twin plate showing the same scene takes `enterFrom` / `returnInto` and is listed before its sibling.
- **A triptych carries its parts:** `content.carry` (scene part ↔ world part, optional `block`) and `carryChannels`;
  `BandSpec.marks` ('cross' on a gap, 'ring' round a switch) make each cause read on a phone.
- **The closing real press** may give its Bit `trailSignature: true` (the bookend); the first press keeps
  `birth: 'signature'`.
- **Composition ids** come from `episodeIds('NN')` in `src/entries/style6.tsx`: `SignalAtlasEpNN`, `…ChK`, `…Cues`,
  `…FieldOff`. Ep01 registers both its first ids (`SignalAtlas…`, used by the tools) and the scheme's.
- **Measure:** `python -I tools/measure.py <video> [--thr 4] [--ranges a-b,c-d]` (moved from `out/style6/r3/tools/`);
  `--thr 4` reproduces the judges' near-static figure.

Ep01's intro as data after round 4: `script.ts` 632 lines, `scenes.ts` 201, `world.ts` 83, `shots.ts` 53, `icons.ts`
10: 979 lines for 63 s (the growth is the S08 and S09 grammar, the triptych's carry list and the comments that explain
each round-4 choice).
