# Ep06 core kit

`src/ep06/kit` (import from `'../kit'`). UI and props (Windows UI, KeyCap, VerdictCard/Chip, QuoteStrip, ScannerProp,
TrimNote, ClockGlyph, WriteTally, KeyFixture, ScrambleField, PassportCard): **docs/ep06/KIT_UI.md**. Look sheet:
`docs/ep06/kit_sheet.png`. Demo: `src/entries/ep06kit.tsx` (`KitDemo` 40 s, `ArchiveStates` = the 12 presets, one per 10 f; debug: `KitReg` render
registration at 55 %, `KitCards` IndexCard variants, `KitNodes` node counts, `KitPerf` part costs).
Typecheck `nice -n 10 npx tsc --noEmit -p tsconfig.ep06.json`. Every component takes the ABSOLUTE frame; events in
absolute frames from `at()`. Seeded randomness only.

## 1. The Archive: the Wall and the Drawer (`archive/`)
```tsx
const A = {frame: f, state: 'HDD_SAVED', events: [{at: a, op: 'pour'}, {at: a + 40, op: 'threads'}]} as const;
const cam = [{f: a, ...archiveCam('wide')}, {f: b, ...archiveCam('drawer')}];
const pose = poseAt(f, cam);
const an = archiveAnchors(A, f, pose);            // world points; pass pose for exact card parallax + pxPerBox
const p = toScreen(pose, an.drawer.x, an.drawer.y); // → hud
<Stage frame={f} env={{kind: 'archive', light: 'warm'}} cam={cam} hud={<Label … to={p} />}><Archive {...A} /></Stage>
```
**Props.** `state` (preset) · `events` · `tilt {x, y, perspective}` (optional 2.5D, deg, tracks ok; default flat) · `mode 'hdd'|'ssd'` · `layers 'single'|'split'` · `light` · `lift` (0..1 or track:
the photo's card rises out of the drawer to its spot above the wall's top-left; the drawer and map slide away) ·
`orbit` (deg, P18 coin flip; past 90° face 2 shows unmirrored, `an.face`) · `flip {at, dur}` (the wall flips from the
other mode into `mode`, P10) · `cardFields {name, size, dates, directions}` (frames each field lights) · `renders {wall,
card}` (opacity of the registered renders, for render→code swaps under a flash) · `boxes {id: 'old'|'other'|…}`
(content overrides, e.g. P11 old grey Bits) · `show {drawer, map, card, threads, ghost, actor, platter, wall}` (0..1 / tracks).
**Events** `{at, op, target?, dur?, to?}`; state at a frame = preset + every event with `at ≤ frame`. `pour`, `build`,
`threads` HIDE their result until `at`. Targets: `'photo'` (default) · `'free'` · `'all'` · `'others'` · `'run1..3'` · id
or ids; `build` also `'wall'|'drawer'|'map'|'card'`.

| op (default dur) | what you see |
|---|---|
| build (40) | boxes thunk in row by row / drawer slides out / map / card pops |
| pour (36) | cyan Bits fall into the 3 runs, one box at a time, and settle |
| threads (18) | cyan threads draw from the card's 3 sockets to each run (fan to 3 boxes) |
| strike (10) · flag (10) · reuse (14) | coral scratch over the name (threads go dashed) · coral tab on the top edge · grey scribble, threads snap and fade |
| mapFlip (16) | map cells flip to hollow white; boxes get dashed outline + hollow corner dot (Bits stay lit) |
| readPulse (30) | white pulse card → threads → boxes flash |
| scan (45) | the scanner's white band sweeps the wall; target boxes flash; 021's header glyph lights |
| copyOut (30) `to` | copies of the Bits arc out to `to` (the scanner tray) |
| overwrite (12) | grey block slams in, coral ring (6 f), grey Bits. `'free'` = wave over every free box (HDD_WIPED). SSD: lands in a fresh spot (= remap) |
| tag (12) | amber dashed disposable tag drops onto the corner and swings |
| sweep (30) | per erase group: still-wanted white Bits hop to a fresh box first, then a 14 f amber edge sweep → dark clean box + fading ember. Groups holding untargeted photo Bits are visibly skipped |
| refuse (20) | a white Bit flies at the box and bounces off with a coral ring |
| trim (30) `to` | the TRIM note (white, magenta tab, tiny box numbers) travels through the boundary slot |
| boundary (16) | the partition between Windows' side and the drive's side, with the slot |
| splitLayers (36) | SSD: label sheet lifts forward, spot sheet + spare columns behind, orbit −56°, threads label→spot, Windows' cone |
| remap (18) | photo labels → fresh grey spots; old spots stay cyan (stale). `MOVERS` (other files): data hops to spare |
| sanitize (40) | amber pulse from the chip reaches every box, spare included → erased |
| scramble / unscramble (8) | MONO glyphs (muted, reseeded every 3 f, never cyan) ⇄ Bits |

**Presets (`ARCHIVE_STATES`)**: HDD_SAVED · HDD_DELETED (struck + tab, dashed threads, map hollow, boxes available) ·
HDD_REUSED · HDD_RACE_LOST (= reused + 022/059/099 overwritten) · HDD_WIPED (deleted + every free box grey) · SSD_SAVED ·
SSD_DELETED · SSD_TRIMMED (+ tags) · SSD_ERASED (+ swept) · SSD_STALE (split, remapped, 9 cyan stale spots, 2 in spare) ·
SSD_SANITIZED · SSD_ENCRYPTED (stale layout as glyphs; add `{op: 'unscramble'}`). Each has a `light`; pass the same to the env.

**Framings (`archiveCam(name, {run, lift, box})`)**: `wide` drawer+map+wall, zoom 1 · `wall` 16×9 fills · `drawer` drawer
+ raised card · `card` card ≈ 70 % (`{lift: 1}` = lifted card) · `photoBoxes` the 9 photo boxes · `run` one run close
(`{run: 0..2}`) · `header` box 021 + notch (`{box}`) · `map` · `boundary` Windows' side | drive's side + slot · `layers` the
split sheets (needs `layers='split'`/splitLayers) · `split` lifted card + wall, no drawer (SplitCompare panels; use
keep `lift` 0: panels hide drawer + map, the card stands alone; photo boxes ≥ 40 px) · `signature` lifted card huge, threads down to the lit wall (`lift={1}`) · `pullout` wider than wide.

**Anchors (`archiveAnchors(props, frame, pose?)`)**: `card`, `field.{name,size,dates,directions}`, `flag`, `plugs[3]`,
`drawer`, `box(id)` (split: the label), `spot(id)` (where its data physically is), `photo[9]`, `runs[3]`, `stale[9]`,
`header`, `map`, `mapCell(id)`, `slot`, `actor`, `spare`, `platter`, `pxPerBox`, `lift`, `face`.

**Constants (`geom.ts`, frozen)**: wall 16×9, pitch 72 (box 64 + gap 8), box 001 top-left at (712, 236), ids row-major;
drawer (96, 236) 552×352; map 16×9 cells pitch 28 at (136, 624); card rest centre (372, 318) w 360, lifted (1010, −40)
w 720; boundary x 680, slot y 400; actor (806, 952); spare cols 17–18 at x 1864. `PHOTO` 021–023 · 058–060 · 098–100
(`RUNS`), `HEADER` 21, `KEEP_EMPTY` 24/57/97, `HITS {download: 59, update: 99, temporary: 22}`, `OTHERS` (seed
`ep06-wall`, 51 boxes ≈ 39 %), `SSD_MAP`/`REMAP` (060 and 098 sit in spare), `MOVERS`. `CARD` = mft-record_b native px
(fields, sockets, plugs, tab). `wallRenderRect()` / `WALL_REG`: cluster-wall_b's 6×5 bins on code cols 4–9 × rows 1–5.

**`<IndexCard frame x y w variant state … />`**: the same card anywhere (world or hud). `variant 'photo'|'blank'|'tiny'`
(tiny = grey Bits on the card, P06), `state 'active'|'struck'|'free'|'reused'` or `strikeAt/flagAt/reuseAt`, `fields`,
`plugs`. A canyon of nameless cards = many `variant="blank"`.

## 2. SplitCompare + SPLIT (`SplitCompare.tsx`)
```tsx
<SplitCompare frame={f} at={472} enter="compress"   // 'compress' (full frame → left panel, SSD slides in) | 'slide' | 'none'
  left={{cam: archiveCam('split'), light: 'cool', render: (fr) => <Archive frame={fr} state="HDD_DELETED" />}}
  right={{cam: archiveCam('split'), light: 'ssd', render: (fr) => <Archive frame={fr} state="SSD_TRIMMED" events={…} />}}
  leftChip={<VerdictChip frame={f} at={a} text="Unlisted" tone="kept" x={0} y={0} />} rightChip={…}
  verdict={<VerdictCard frame={f} at={b} text="…" x={0} y={0} />} hud={<Footnote …/>} />
```
`SPLIT`: panels x 64–936 | 984–1856, divider 960, headers y 96–160 (Sora 700 56, icons hard-drive_b | ssd-board_b),
chips at (500, 190) | (1420, 190), content y 230–770 (world 1920×1080 at scale 0.5, cover), verdict at (960, 855),
slide-in 14 f. Chip/verdict nodes are drawn around (0, 0) of their slot. Panel `light`: archive light | 'flash' | 'stage'.
Hud points over a panel: `splitToScreen(side, f, {cam, at, enter}, wx, wy)`. One Stage; panel scale is in the context.

## 3. PhotoBits, DriveDive
- `<PhotoBits frame at dur mode from={{x,y,w,h}} to={an.photo} image grid />`: `dissolve` (the image breaks into a
  diagonal wave of cyan Bits that lift), `sink` (that cloud flies into `to` and lands with flashes; chain after dissolve
  with the same `from`), `pour` (3 falling streams into the targets). Draws in its parent's px.
- `<DriveDive frame at a b from drive explode target />` (42 f): `a` pushes into `from`, the render grows on the dark
  stage, (`explode`: flash swap to `_d`), dives into `target` (`DIVE_POINTS`), `b` grows out of it. P01: hard-drive_a;
  P05: `drive="hard-drive_a" explode="hard-drive_d"` + an Archive `build` at the same frame; P11: `drive="ssd-board_a"
  explode="ssd-board_d"`, b in `env: 'flash'`.

## 4. Stage, envs, grade (one grade everywhere)
`<Stage frame env cam drift shake hud>` (Ep03 API). `env`: `'night'` · `'stage'`/`{kind:'stage', spot, floor, warm}`
(hardware stage) · `'archive'`/`{kind:'archive', light: 'warm'|'cool'|'scan'|'ssd'}` · `'flash'`/`{kind:'flash', amber,
pulses}` (graphite cells, white + amber traces; `'chip'` = alias) · `{kind:'photo', plate:'reader-desk', kb, children}` ·
`'void'`. **Desk**: `DESK.screen` (plate px, rect 320,98 → 1352,645), `DESK.slotW/H` 1032×547, `DESK.kbMonitor`
{s 1.55, y 176} (screen + bezel), `DESK.kbScreen` {s 1.72, y 196} (screen fills the frame: the S1→S2 handoff),
`deskSlotScale(f, kb)` (screen px per slot px ≈ 1.148 × s), `deskScreenRect(f, kb)`. Children go in plate px.
Camera: `onWord`, `poseAt`, `toScreen`, `frameRect`; drift on by default; `CameraContext` carries zoom × panel scale.
Grade: vignette, grain, bloom keyed on cyan (one blur, radius 14; Ep03 used two, measured no visible gain for the cost).

## 5. Text roles (DIRECTION §5)
`TEXT_ROLES`: hero 160–320 · keyword 64–120 · label ≥ 40 · chip ≥ 40 · footnote 30–36 · decor ≤ 24. KineticText (`role`,
default from size), Label (`role` 'label'|'chip'), Footnote, QuestionCard and the UI kit compute size × camera zoom ×
panel scale and log `[kit] text below floor: …` / `[kit] world text without screen: …` (a must-read text inside a
zoomed world or panel without `screen`). Any `[kit]` line in a render log is a defect. Use `checkText` / `useTextCheck`
in your own text. `<Rich>` draws ≈ ≠ → ✓ ✗ × ¾ ½ ¼ as vectors ("Delete ≠ Erase"). AtlasOpener: `word`, `sub` (64 px), auto-fit
≤ 1,600 px, no index.

## 6. Colour roles (`PAL`, all Ep03 keys kept)
`photo` cyan #00E5FF = the photo's Bits and its threads ONLY · `drive` amber (sweep, tags, chip, sanitize, clock, key) ·
`loss` coral (strike, unused tab, writes on the photo, refusals, tally) · `emphasis` magenta (TRIM tab, "?", one verdict
word) · `otherBit` / `oldBit` · materials `steel* bin* plate* graphite* drawer* paper*` (sampled from the renders) ·
`winBody #161D2B`, `winBar #1E2738`. Inherited cyan defaults are re-keyed to `structure`/`ink` (Label/KineticText
accents, caret, QuestionCard underline, Prop highlight, Whip/ZoomThrough/Rewind, Night dust, AtlasOpener stations).
Renders with baked cyan: regrade with KIT_UI's `Regrade` (Prop children), or the Archive's own patch (mft-record LEDs).

## 7. Performance (measured, `--scale 0.5 --concurrency 3`, angle, shared 4-vCPU VM)
| Range (KitDemo) | What | s/frame/tab |
|---|---|---|
| f0–599 / f600–1199 (whole demo) | all shots, transitions | **0.34 / 0.36** |
| f60–219 | DriveDive (2 Stages) → rocket back → Archive wide + opener | 0.48* |
| f510–599 | SplitCompare: 2 panels × (Archive + env), chips, verdict | 0.49* |
| f900–1049 | split layers + remap + sanitize | 0.37* |

\* includes browser start (≈ 3 s per run). SVG nodes per Archive: 555 (HDD wide) – 1,386 (SSD split + sanitize),
defs included. Cost driver: under the Stage's bloom filter every separate SVG paint op is re-rasterised each frame, so the
kit merges repeated shapes into single paths (other files' Bits, map markers, ghost rings) and avoids big translucent SVG
overlays. Do the same in section code (one `<path>` for many marks; HTML divs for large soft gradients).

## 8. Do / don't
- Do put must-read words in the Stage `hud` at `toScreen(pose, anchor)`; never inside `<Archive>` or a panel.
- Do pass the preset's `light` to the env (`ARCHIVE_STATES[s].light`); switch light on a cut or a fast move.
- Do keep one Stage per frame; transitions (Whip, FlashCut, ZoomThrough, DriveDive) are the ≤ 18 f exceptions.
- Do hide render→code swaps (`renders`) inside a fast move or a FlashCut; never scale a render past 1.3× native.
- Don't draw your own wall, card, Bit, split screen or Windows UI. Don't add filters inside `<Archive>`.
- Don't use cyan for anything but the photo's data. Don't show digits other than decor box numbers.

## 9. Known gaps / decisions
- Split layers are an orthographic orbit (affine sheets, no perspective); footnote "Schematic, not to scale".
- In single SSD view the wall shows labels at their grid places (the shuffle only shows when split).
- The drive actor and map are code; `renders` covers cluster-wall_b and mft-record_b only (see ASSET_REQUEST.md).
- `light` does not crossfade: change it on a cut or inside a camera move.

## 10. Changes after the gate (look only; API frozen)
1. Figure–ground: photo boxes are emissive (cyan-lit interior, plate tint, halo from a shared gradient) with Bits ≈ 70 %
   of the box; other files' Bits are small neutral grey (`#8E949E`, old `#5A606A`); box numbers at 45 % ink; rails,
   bins and plates darkened. Stale spots in split layers get the same treatment. The header notch sits on 021's top edge.
2. `split` framing → card + the 3 runs (pose 880, 470, zoom 1.25): every photo box ≥ 40 px in a panel. Inside a
   SplitCompare panel the drawer and map default to hidden (`show` overrides) and the card stands alone at rest.
3. Strike: one bold coral scratch fully across the name (24 card px ≈ 14 px on screen at `signature`, 25 at `card`),
   10 f with sparks at its head; the name stays half-legible. Struck threads keep their dashes.
4. 2.5D: optional `tilt {x, y, perspective}` (CSS perspective on the wall layers; anchors and threads follow) and a
   soft contact shadow from the lifted card onto the wall. Default stays flat.
Re-measured after these: KitDemo f420–719 (signature, SplitCompare, SSD DriveDive, flash + tilt) 0.42 s/frame/tab.
5. Robustness: every image the kit draws is awaited. PhotoBits' wiping photo is a Remotion `<Img>` clipped with a CSS
   `path()` (plus a decode guard); the Archive's registered renders (cluster-wall_b, mft-record_b) are `<Img>` layers in
   the same frames. No SVG `<image>` remains in the core kit. Checked: dissolve start f20–26 and KitReg render whole.
6. SwapVariant's flash re-keyed to white/structure. Kit-wide grep: cyan now appears only in the photo's Bits (Bit,
   BitHead, PhotoBits, Archive photo boxes, stale spots, copies), its threads and plug lights, and the AtlasOpener's Bit.

