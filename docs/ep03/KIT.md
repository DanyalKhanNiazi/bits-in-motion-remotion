# Ep03 visual kit

`src/ep03/kit` (import from `'../kit'` in a section). Look sheet: `docs/ep03/kit_sheet.png`. Demo: `src/entries/ep03kit.tsx`
(`node tools/stills.mjs src/entries/ep03kit.tsx KitDemo out/ep03/kit/x 310,388 --phone`). Typecheck: `npx tsc --noEmit -p tsconfig.ep03.json`.

**Contract.** Every component takes the ABSOLUTE film `frame` as a prop and event frames (`at`, `exitAt`, keys) in absolute
frames, so everything is a pure function of frame. Get event frames from `at(p, 'phrase').start`. Seeded randomness only.
Text components print `[kit]` console warnings for rule breaks (size < floor, > 6 words on a label or footnote).

## 1. Look (`look.ts`)
- `PAL`: grounds `void field deck board body`, text `ink muted annotation structure`; roles **`info` (cyan, data; the only
  thing that travels)**, `energy` (amber, power), `wait` (coral, problem/wait), `emphasis` (magenta, sparingly); materials
  `tile silver gold computeBlue`. `ROLE` maps meaning to colour.
- `TS`: `footnote 32`, `label 44` (floor 40), `keyword 96` (64–120), `question 100`, `hero 220` (160–320).
- `SAFE`: 64 px margins, must-read text above y 940. `EASE`: engine curves + `cam inOut out outExpo inExpo outBack whip`.
  `SPRING`: `pop snap heavy soft bounce slam`. `GRADE`: vignette 0.62, grain 0.075, bloom 0.75 (on cyan only).
- Helpers (`util.ts`): `prog(f, at, dur, ease)`, `win(f, at, until)`, `springAt(f, at, SPRING.pop)`, `track(f, [[f0, v0], [f1, v1, ease]])`
  (any `Num` prop accepts a number or such a track), `rr/rnd/nz` (seeded), `rgba mixHex`, `quadMatrix(w, h, quad)`.
- `<Rich text>` draws ≈ → ✓ ✗ × ¾ ½ ¼ as vectors (the latin font subsets lack them). All kit text uses it.

## 2. Stage (`Stage.tsx`, `camera.ts`, `envs.tsx`, `grade.tsx`)
`<Stage frame env cam drift shake grade motionBlur hud>{world}</Stage>`: env (parallax) → world (camera) → `hud`
(screen-space text) → grade. One Stage per shot; transitions compose Stages.
- `env`: `'night'` | `'chip'` | `'void'` | `'none'` | `{kind:'night', grid, dust, warm}` | `{kind:'chip', pulses, dust}` |
  `{kind:'photo', plate, kb, blur, dim, tint, floor, children}` (`children` in PLATE px, moves with Ken Burns). Omit `kb`
  for an endless slow drift; `kb: {from:{s,x,y}, to:{s,x,y}, start, end}` (s multiplies the cover fit ×1.1483).
- `cam`: keys `{f, x, y, zoom, rot, dur, ease}`; (x, y) = world point at frame centre; the move into a key ends at `f`.
  `onWord(at(11,'picture'), {zoom: 1.4}, {dur: 24, align: 'end'})` builds a key that lands on the word. `frameRect(x0,y0,x1,y1)`.
- Always-on drift (`drift`, default 1 ≈ 0.3 px/frame circle + zoom breath); `shake: [{at, strength}]` for impacts; fast moves
  get directional blur automatically. `poseAt(frame, cam)` + `toScreen(pose, wx, wy)` aim hud leaders at world points.
```tsx
<Stage frame={frame} env="night" cam={[{f: a, zoom: 1}, onWord(at(11, 'memory'), {zoom: 1.25, x: 1100})]} hud={<KineticText …/>}>
  <Prop …/>
</Stage>
```

## 3. Prop (`Prop.tsx`)
`<Prop frame src x y w|h …>`: (x, y) = centre of the VISIBLE content (alpha box), `w`/`h` = visible width/height in px.
`rot tiltX tiltY scale blur brightness opacity` (numbers or tracks); `enter {kind: rise|pop|slide|drop|fade|zoom, at, dur, from, dist}`;
`exit {kind: sink|pop|slide|lift|fade|zoom, at, dur, to}`; `shadow` (opacity or `{opacity, dy, w}`); `sweep {every|at[], dur, color, strength}`
(specular band masked to the PNG alpha); `rim` colour or `{color, strength}`; `float` px; `highlight [{region, at, until, color, mode: glow|outline}]`;
`spotlight {region, at, dim}` (dims the rest, region stays lit); `children` in NATIVE asset px (e.g. `<ScreenSlot>`).
Helpers: `propPoint(src, {x,y,w}, ax, ay)`, `propRect`, `propScale`, `regionCenter(region)`.
```tsx
<Prop frame={f} src="BIM129_T03_datacenter-gpu_a" x={960} y={570} w={900} enter={{kind: 'drop', at: a}} tiltX={4} rim={PAL.info}
      sweep={{every: 90}} float={5} highlight={[{region: REGIONS.gpuA_hbm, at: at(11, 'memory').start}]} />
<SwapVariant frame={f} srcs={[A, B]} swaps={[f1]} via="flash" x={960} y={570} w={900} spotlight={{region: REGIONS.gpuB_die, at: f1 + 6}} />
```
`SwapVariant` (`via: 'flash' | 'whip'`, `dir`) takes every Prop prop; highlights are in the shown variant's native px, so end them before a swap.

## 4. Text (`text.tsx`)
- `<KineticText frame at text x y size mode align color font backing exitAt>`; `mode`: `slam` (scale-in, squash, light burst),
  `pop` (per word, spring), `rise` (masked per word), `type` (caret), `count` (`count={{from, to, dur, decimals, prefix, suffix}}`).
  `backing`: `scrim` (default soft dark pool), `plate` (knockout), `none`.
- `<Label frame at text x y to={{x, y}} side exitAt sub>`: leader + anchor ring to `to`; box attaches at (x, y). ≤ 6 words, 44 px.
- **`screen`** (on `KineticText`, `Label`, `Footnote`): `screen` (true) counter-scales by the Stage camera zoom, so `size` is
  the ON-SCREEN px size even inside a zoomed world (Label's leader and anchor too); `screen={k}` also undoes a parent scale `k`
  (a Prop's `propScale`, a LensDive inner scale). Default off (unchanged). Use it for every must-read label placed in the world.
- `<Footnote frame at text exitAt>`: 32 px bottom-left at y 912 (≤ 6 words). `<QuestionCard frame at text exitAt y accent>`: scrim,
  words rise, magenta "?", underline, slow push. `<Counter frame at dur from to x y size decimals prefix suffix caption>`: odometer.
```tsx
<KineticText frame={f} at={at(1, 'two hundred').start} text="×200" mode="slam" x={1400} y={420} size={240} />
<Label frame={f} at={w.start} exitAt={w.end + 45} text="The card's own memory" x={1290} y={190} to={hbmScreen} />
<Counter frame={f} at={a} dur={60} to={6.5} decimals={1} suffix=" s" x={1580} y={850} size={120} />
```

## 5. Signals (`signals.tsx`, `ChatScreen.tsx`)
- `<Bit frame path from to ease route="lit|full|none" size loop progress land>`: the cyan pellet with streak + 3-pixel trail;
  `progress` drives it directly (with `loop` for THE LOOP). `BitHead` draws a resting Bit.
- `<TokenTile frame text id x y size snapAt from flipAt flipBackAt newest ghost exitAt>`: white physical tile; snaps with
  overshoot and a click ring; flips to a navy back with the cyan ID. `<TileRow frame tokens ids x y size gap wrap maxWidth snapAt flipAt marker ghosts>`:
  measured layout (`tileRowLayout`), schedules as arrays or `{start, every}`; the Bit hops to the newest tile.
- `<ChatScreen frame w h prompt promptAt promptMode="pop|slam" promptSize answer times|answerAt+rate fontSize fog>`: answer streams
  per token (newest flashes cyan, the Bit is the caret); unwritten tokens hold their places as ghost fog (no reflow).
  `tokenize(text)`, `streamTimes(n, start, rate)`. `promptMode="slam"` + small `promptSize` = the wall-of-text prompt.
- Placement: `<ScreenSlot rect={REGIONS.monitorScreen}>` as a child of `<Prop src="BIM150_T03_reader-monitor_b">` (give ChatScreen
  `w={1260} h={615}`), or `<ScreenSlot rect={REGIONS.deskScreen}>` in the photo env's `children` (`w={1032} h={547}`). Chat font
  sizes are in slot px: stage size = fontSize × prop scale (monitor at w 1240 → ×0.94; desk → ×1.15 × kb s).
```tsx
<Stage frame={f} env={{kind: 'photo', plate: 'reader-desk', kb: {to: {s: 1.55, y: 176}, start: a, end: a + 120},
  children: <ScreenSlot rect={REGIONS.deskScreen}><ChatScreen frame={f} w={1032} h={547} prompt={Q} promptAt={a} answer={A} answerAt={a + 20} rate={7} /></ScreenSlot>}} />
```

## 6. Bridge (`bridge/Bridge.tsx`): the governing metaphor
S5's real-asset look on true 3D geometry: the memory tower's faces and lid are textured from the HBM-stack render (BIM139,
12 DRAM layers, gold TSVs, brushed lid), the die block's face is the compute-cache render (BIM142: silver frame, blue compute
tiles, gold cache), the deck is glass and steel with emissive lanes; far banks of blurred renders in the haze, god rays
(`rays`, 0..1, default 0.4). It draws its own world: put it in `<Stage env="none" drift={0}>`. `SET`, `deckY`, the deck width
(`lerp(1, 3.4, bandwidth)`), `bridgeCam`/`basis`/`project` and the presets are unchanged, so section overlays still line up.
- Props: `view: 'side' | 'threeQuarter'`; `framing: 'wide' | 'crates' | 'die' | 'tower'` or a `Cam3`; animated
  `cam={[{f, cam: 'wide'}, {f: f + 50, cam: 'crates', view: 'threeQuarter', dur: 50}]}` (orbit + push between presets).
- `bandwidth` (0..1, track ok): deck width 1–3.4, 1–3 lanes, glow. `crateRate` (/s), `travel` (frames to cross, 30 = fast),
  `crateScale` (quantised crates: 0.5, 0.25), `crateLabel` ("≈16 GB": a tag over the deck in wide shots, stamped on crate fronts in close-ups).
- `mathActivity` (tiles flicker; every arrival sends a wave across the grid), `powerCap` (shows the amber meter and floor conduit;
  lower = dimmer, visibly slower math), `idle` (tiles dim, coral breathing frame, pause mark), `highlight`
  (`tower | bridge | die | crates | cache | power`), `build {at, dur}` (the set assembles itself; crates start at the end),
  `heroCrate {at, dur, scale, label}` (one huge stamped crate thunders across; pair with `flowUntil`), `flowFrom/flowUntil`, `dof`.
- `bridgeAnchors(props, frame)` → screen points `towerTop tower dock bridge bridgeDeck die dieTop cache power` and `pxPerUnit`, for Labels.
  `power` is now the amber gauge on the plinth under the die; `die`/`cache` follow the render's tiles.
- `<Crate b={basis} x z y s h op label hero variant drawn imageSrc glowFilter tint>` (SVG, inside an `<svg>`): the Bridge draws every
  crate with it. Default: the owner's renders (`public/ep03/assets/new/N01_weight-crate_b` side view when the camera yaw is
  under ~12°, `_a` three-quarter, mirrored to the camera side, for larger yaw and for `hero`; cross-faded over 12–20°), fitted to
  the drawn crate's footprint (bottom-centre on the deck, long side along +x), graded (a touch darker, cool rim, scene fog, cyan
  base line) with `label` set in dark ink on the blank plate (perspective-corrected on `_a`). `variant: 'a' | 'b'` forces one;
  `drawn` (or the Bridge's `drawnCrates`) restores the old vector crate. Plates: b rect (664,507)–(1387,748); a quad (1006,1008)
  (1569,908) (1565,1152) (1006,1268). S1's monument crate and S5's `Crate3D` are section drawings, not this component.
```tsx
const B = {view: 'side', build: {at: a, dur: 54}, cam: [{f: a, cam: 'wide'}, {f: b, cam: 'crates', view: 'threeQuarter', dur: 52}],
           bandwidth: 0.75, crateRate: 3, crateLabel: '≈16 GB', mathActivity: 0.85} as const;
const an = bridgeAnchors(B, f);
<Stage frame={f} env="none" drift={0} hud={<Label frame={f} at={a + 60} text="Memory" x={an.towerTop.x + 60} y={an.towerTop.y - 110} to={an.towerTop} />}>
  <Bridge frame={f} {...B} />
</Stage>
```
P12 narrow bridge: `bandwidth={0.2}`; experiment: `powerCap={track}`; P13 "writing waits": `idle` + low `crateRate`.

## 7. Openers, lens, transitions, dial
- `<AtlasOpener frame at word index dur y>` (54 frames): picture dims, route + stations, the Bit runs, the word slams, all clears.
- `<LensDive frame at cx cy r open hold dive outer={(f) => …} inner={(f) => …}>`: lens opens over (cx, cy), holds, dives through.
- `<Whip frame at dur dir a b>`, `<ZoomThrough frame at dur cx cy a b>`, `<FlashCut frame at a b>`, `<Rewind frame at dur from to render after>`
  (render gets the scene frame running backwards). `a`/`b`/`render` are `(frame) => node`, usually full `<Stage>`s.
- `<PowerDial frame x y w value enter exit>`: BIM191 with an amber arc that drains to `value` and the % on its window.
```tsx
<Whip frame={f} at={cut - 6} dur={12} dir="left" a={shotA} b={shotB} />
<PowerDial frame={f} x={720} y={560} w={540} value={[[w0, 1], [w0 + 40, 0.5]]} enter={{kind: 'slide', at: w0 - 20}} />
```

## 8. Measured coordinates (native asset px; `REGIONS` in `assets.ts`)
| Key | Asset | Shape |
|---|---|---|
| `monitorScreen` | BIM150 reader-monitor_b | rect 138,91 → 1398,706 (flat, front-on; glass 120–1416 × 74–712) |
| `deskScreen` | reader-desk plate | rect 320,98 → 1352,645 (plate px; glass 314–1356 × 92–647) |
| `gpuA_die` | BIM129 (3/4) | quad (662,219) (1063,360) (916,656) (467,496) |
| `gpuA_hbm[0..7]` | BIM129 | 8 HBM top faces (quads), clockwise from top-left |
| `gpuB_die`, `gpuB_dieFrame` | BIM130 (top) | rect 520,301 → 1004,673; frame 467,242 → 1069,738 |
| `gpuB_hbm[0..7]` | BIM130 | rects: 457–725 & 809–1078 × 78–185 (top), 1138–1266 × 251–451 / 510–715 (right), 809–1079 & 457–725 × 762–883 (bottom), 269–397 × 251–451 / 513–716 (left) |
| `hbmA_stack`, `hbmA_stackTop`, `hbmA_die` | BIM137 | tower silhouette poly; lid quad (210,305) (502,151) (927,236) (679,431); die top quad (866,644) (1052,487) (1347,555) (1152,721) |
| `dialKnob`, `dialWindow` | BIM191 | knob ellipse c(915,819) r(169,211); window quad (562,336) (1022,290) (1020,472) (560,536) |
| Bridge textures | BIM139 / BIM142 | HBM layer faces (72,494)(700,726)(700,1018)(72,782) and (700,726)(1190,492)(1190,772)(700,1018); lid (80,460)(703,690)(1184,384)(525,214); die (159,58)–(1381,963), compute tiles (331,183)–(987,774) 6×5, cache (1028,408)–(1187,691) |

`ASSET_INFO[name] = [w, h, alphaX0, alphaY0, alphaX1, alphaY1]` for all 64 assets (sizes vary: 1536×1024, 1254², 1774×887, …).

## 9. Good crops
- **reader-desk**: the screen fills the frame at `kb {s: 1.55, y: 176}`; the warm lamp sits top-right (keep text off it or use a scrim).
- **server-room**: aisle vanishing point ≈ plate (560, 420); the rack face ≈ x 1000–1500 with status lights at x ≈ 1300–1340, y 130–700.
- **gpu-macro**: die centre ≈ plate (830, 390); HBM stacks left x 220–520, right x 1060–1400. Push `s 1.4` on the die.
- **home-gpu**: card centre ≈ (840, 470); fans at (620, 420) and (1090, 300).
- **BIM129** reads best at w 900–1100 with `tiltX 4–8`; **BIM130** for the HBM count; **BIM191** at w 500–600; **BIM150** at w ≥ 1200 when
  its chat must be read; token tiles at `size ≥ 72` (use `wrap` for 11 tiles).

## 10. Do / don't
- Do pass `frame` down; keep must-read text in `hud`, ≥ 40 px, above y 940, ≤ 12 must-read words on screen.
- Do land text on words (`at(...)`) and hold it ≥ 15 frames past the sentence; exit with `exitAt` (never cut text mid-word).
- Do vary environments per DIRECTION.md and move every hold (drift is on by default; Bridge/Bit/env all animate).
- Do hide asset swaps under `SwapVariant`, `FlashCut` or `Whip`; transitions are motivated, never dissolves to empty.
- Don't nest a Stage inside a Stage (double grade) outside a transition. Don't use `Math.random` or `useCurrentFrame` in kit callers.
- Don't paint large flat cyan areas: the grade blooms cyan. Amber only for power, coral only for waiting/problems.
- Don't write "≈", "→", "×" in plain spans outside kit text: use `<Rich>`.
- Cost: Rewind (displacement filter) and ZoomThrough/LensDive (two scenes) are the heavy frames; keep them short.

## 11. Known gaps
- The Bridge's die render stands upright on a plinth (its face reads in side view); S5 lays its die flat. Same materials, different pose.
- Bridge `highlight` outlines a part; it does not dim the rest. three.js is not used (SVG projection renders faster and deterministically).
- Text widths (TileRow, AtlasOpener) are measured after fonts load (held by delayRender).
