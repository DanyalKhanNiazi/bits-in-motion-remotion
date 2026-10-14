# Bits in Motion shared kit (`src/shared/`)

The shared foundation for the five ep01 intro tests. Everything is in px at 1920×1080 and in **absolute frames** at 30 fps (f0–f1889). Import from `src/shared` (the barrel) or from the individual files:

```ts
import {ANCHORS, WORD_CUES, wordStart, SENTENCES, THEMES, bitRun, routePath,
        KitProvider, KitLayer, Bit, SignalRoute, KeyedTag, TimeChip, inkSkin} from '../../shared';
```

**Rules for builders:** don't edit `src/shared/`, `Root.tsx`, the entries, the tools or `package.json`; copy a kit file into `src/styles/styleN/` if you need a variant. Never run `npm install`. Write your outputs under `out/styleN/`.

| File | What it gives you |
|---|---|
| `timing.ts` | FPS/WIDTH/HEIGHT/DURATION, the typed word list, `wordStart/wordEnd`, sentences S01–S12, `ANCHORS`, `WORD_CUES`, `PAUSES`, `minTagExit` |
| `brand.ts` | `THEMES` (dark, light, lightCool), type scale, layout, strokes, channels, Bit, Lens, label, glyph and bracket constants, colour helpers |
| `fonts.ts` | Sora 600/700 + JetBrains Mono 500 (latin), `SANS`, `MONO`, `TEXT` presets, `loadDisplayFont` |
| `motion.ts` | `EASE`, fades, flips, `breathe`, `ripple`, deterministic jitter, `bitRun` (speed rules), `tagTiming` |
| `geom.ts` | path builders (`routePath`, `rectPath`, `circlePath`…), flattening, tracks, offsets |
| `skin.tsx` | `Skin` interface + `cleanSkin`, `clearLineSkin`, `inkSkin()`, `litSkin()` |
| `context.tsx` | `KitProvider`, `KitLayer`, `useKit`, `KitBaseProps` |
| `components/` | `Bit`, `SignalRoute`, `LensRing`, `KeyedTag`, `TimeChip`/`Header`, `StatePill`, `StateGlyph`, `AlertHatch`, `EyeBadge`, `ApproxChip`, `AnalogyFrame`, `VisitedMark`, `EnergyChannel`, `PoweredWash`, `Brackets` |

---

## 1. Quick start

```tsx
// src/styles/style3/Intro.tsx
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ANCHORS, WORD_CUES, SENTENCES, THEMES, minTagExit, bitRun, routePath, clearLineSkin,
        KitProvider, KitLayer, Bit, SignalRoute, KeyedTag, TimeChip, StateGlyph} from '../../shared';

const theme = THEMES.lightCool;
const BUTTON_TO_LOOKOUT = routePath([[300, 506], [480, 506], [480, 590], [775, 590]]); // 8 px bends
const FF_RUN = bitRun({path: BUTTON_TO_LOOKOUT, depart: ANCHORS.ffBitDepart, land: ANCHORS.ffBitLand, label: 'ff'});
const S04_RUN = bitRun({path: BUTTON_TO_LOOKOUT, depart: ANCHORS.s04Depart, land: ANCHORS.s04Land, label: 'S04'});

const Intro: React.FC = () => (
  <AbsoluteFill style={{background: theme.surface}}>
    <KitProvider theme={theme} skin={clearLineSkin}>
      <KitLayer>
        {/* …your own hardware drawing (use skin.stroke/skin.fill or <SkinStroke> to share the line quality)… */}
        <SignalRoute path={BUTTON_TO_LOOKOUT} runs={[FF_RUN, S04_RUN]} />
        <Bit runs={FF_RUN} />                      {/* ripple only, absorbed: no park at f59 */}
        <Bit runs={S04_RUN} />
        <StateGlyph x={830} y={560} state="ALWAYS_ON" />   {/* never changes glyph on a landing */}
        <KeyedTag anchor={[240, 470]} elbow={[240, 420]} end={[290, 420]} text="Power button" role="part"
                  land={WORD_CUES.powerButton} exitAt={minTagExit(WORD_CUES.powerButton, 'Power button')} />
        <TimeChip timeline={[{at: 2, label: 'After the press'}, {at: ANCHORS.returnStart, label: 'Soft-off'}]}
                  shrinkAt={150} />
      </KitLayer>
    </KitProvider>
  </AbsoluteFill>
);
export default Intro;
```

Kit components are **SVG fragments**: put them inside an `<svg viewBox="0 0 1920 1080">` of your own, or inside `<KitLayer>` (a full-frame absolute SVG). Stack several layers to interleave with your drawing (brand z-order: surface < panel/board < hardware < energy fills < routes < Bits < pips/badges < analogy overlays < tags/pills/headers < Lens < brackets). Text (tags, chips, pills) is real HTML text inside `foreignObject`, so plates size themselves.

Every component accepts `KitBaseProps`: `theme` (`'dark' | 'light' | 'lightCool'` or a Theme object), `skin`, `seed` (for jittering skins) and `frame` (absolute-frame override). Props win over `KitProvider`; the default is dark + clean.

---

## 2. Timing (`timing.ts`)

- `FPS = 30`, `WIDTH = 1920`, `HEIGHT = 1080`, `DURATION = 1890`, `LAST_FRAME = 1889`.
- `WORDS` (all 1799, ms), `INTRO_WORDS` (W0001–W0180), `word(id)`, `wordStart(id)` / `wordEnd(id)` = `Math.round(ms * 30 / 1000)`, `wordText`, `wordsBetween(a, b)`, `textBetween`, `findWord('signal') === 'W0047'`, `wordAt(frame)`, `lastWordAt(frame)`, `msToFrame`.
- `SENTENCES.S04 = {first: 'W0042', last: 'W0060', start: 436, end: 607, text, …}`, `SENTENCE_LIST`, `sentenceAt(frame)` (null in pauses), `beatAt(frame)` (latest started beat).
- `PAUSES`: gaps ≥ 250 ms, `{after, before, from, to, ms}` (`from` = first silent frame, `to` = next word's start).
- `minTagExit(land, text, sentence?)` = max(land + 30 + 9 × words, sentence end + 15).
- `WORD_CUES`: the brand-spec §6.5 tag words, e.g. `mainProcessor 67`, `smallerProcessor 206`, `standbyPower 1475`, `powerSupply 1547`, `justEnoughOfTheMotherboard 1695` (full list: `node tools/anchors.mjs`).

### Computed anchor table (all checked against Part A §A4; `node tools/anchors.mjs` re-checks)

| key | frame | A4 | from | words | event |
|---|---|---|---|---|---|
| press | 0 | 0 ✓ | start W0001 | Press | Cap pressed (travel #1) |
| afterPressChipBy | 8 | 8 ✓ | fixed | — | "After the press" chip in (44 px) |
| ffBitDepart | 33 | 33 ✓ | fixed (inside W0004 f29–40) | power button | Flash-forward Bit departs the button |
| ffBitLand | 59 | 59 ✓ | start W0006 | and | Flash-forward Bit lands on lookout (ripple only) |
| notFirst | 91 | 91 ✓ | start W0010 | doesn't | Main processor stays dark |
| qWakes | 294 | 294 ✓ | start W0028 | already | "?" wakes (flash-forward) |
| returnStart | 327 | 327 ✓ | end W0030 + 1 | (pause) | Return to the present starts |
| returnPauseEnd | 335 | 335 ✓ | start W0031 | And | Return pause ends (S03) |
| returnDoneBy | 346 | 346 ✓ | fixed | — | Return complete ("Soft-off") |
| whenPressedIn | 441 | 441 ✓ | start W0043 | sends | "When pressed" chip in (optional) |
| s04Depart | 472 | 472 ✓ | start W0047 | signal | S04 Bit departs (no cap travel) |
| s04Land | 498 | 498 ✓ | start W0050 | small | S04 Bit lands on lookout (ripple only) |
| whenPressedOut | 519 | 519 ✓ | start W0052 | that | "When pressed" chip out |
| handOverSettle | 663 | — | start W0066 − 8 | (pause) | D24: ring + ticks start fading to grey rim |
| handOverSettleEnd | 669 | — | start W0066 − 2 | (pause) | D24: grey rim complete |
| handOver | 671 | 671 ✓ | start W0066 | not | D24: "?" fills |
| chain1 | 748 | 748 ✓ | start W0075 | handoffs | S06 landing 1 |
| chain2 | 781 | 781 ✓ | start W0077 | stage | S06 landing 2 |
| chain3 | 808 | 808 ✓ | start W0079 | what | S06 landing 3 |
| chain4 | 832 | 832 ✓ | start W0083 | needs, | S06 landing 4 |
| chain5 | 860 | 860 ✓ | start W0085 | Windows | S06 landing 5; Bit parks |
| whyDifferent | 1194 | 1194 ✓ | start W0118 | starting | "Why different?" lands |
| whyDifferentHoldMin | 1242 | 1242 ✓ | start W0118 + 48 | — | "Why different?" earliest exit |
| stopsExitFrom | 1505 | 1505 ✓ | end W0143 + 1 | (pause) | S09 stops may exit from here |
| stopsExitTo | 1513 | 1513 ✓ | start W0144 | a | …and must be gone by here |
| lock | 1798 | 1798 ✓ | start W0176 | like | Brackets lock on the button |
| nowChip | 1830 | 1830 ✓ | start W0179 | Now | "Now" chip |
| realPress | 1837 | 1837 ✓ | start W0180 | press. | Real press (travel #2), Bit departs |
| lastFrame | 1889 | 1889 ✓ | DURATION − 1 | — | Last frame: Bit still travelling |
| nextLand | 1891 | 1891 ✓ | start W0184 | power | Where the Bit would land (outside the intro) |

The A3 beat sheet (S01 0–127 … S12 1830–1850) matches exactly, and every intro word's sentence number in the JSON agrees with the spans.

**Mismatches and clarifications (no A4 frame disagrees with the JSON):**
- **f832 is "needs," (W0083), not "one".** "one" (W0082) starts at f826; mapping f832 to "one" puts the landing 6 frames early.
- **f33 is not a word start.** It sits inside "power" (W0004, f29–f40): 33 = 59 − 26, the same 26-frame run as S04. The tag word "power button" is f29.
- **f8 and f346 are deadlines, not words.** "button" (W0033) starts at f344.
- **f327** is the first silent frame after "work." (W0030 ends at 10 860 ms → f326).
- **Brand spec §6.5 prints "typical Windows desktop → 1262"**: that is the start of "a" (W0124). "typical" (W0125) is f1269 (`WORD_CUES.typicalDesktop`), "desktop" f1292.
- **Shared rules' "f1505–f1513 pause"**: the silent frames are f1505–f1512; f1513 is the start of "a" (W0144).
- **D24 settle f663–f669** lies in the pause after "lookout," (silent f660–f670), then the "?" fills on "not" (f671).

Pauses ≥ 250 ms: f51–58, f128–136, f192–199, f327–334, f428–435, f608–616, f660–670, f707–716, f845–852, f900–913, f974–984, f1058–1067, f1237–1246, f1349–1358, f1425–1437, f1505–1512, f1671–1680, f1818–1829.

---

## 3. Brand (`brand.ts`)

- **Themes:** `THEMES.dark`, `THEMES.light` (warm paper, Style 1), `THEMES.lightCool` (Style 3). Roles: `surface, panel, board, structure, textMuted, annotation, ink, activeFill, info, infoWake, infoHalo, energy, energyStandby, energyWash, emphasis, alert, alertHatch` (+ `markerInfo`, `markerEnergy` on light). Light `board` tones are derived (surface + 10% structure: `#E9E6E1`, `#E2E6ED`); the spec has none. Style 3 may tint ink: `{...THEMES.lightCool, ink: '#1B2A44'}` (`STYLE3_INK_LIMIT`).
- **TYPE:** label 44, secondary (mono) 34, pill 40, header 34, headerActive 44, floor 30, hero 96–120, readout 64, unit 38, chip 30, lineHeight 1.15.
- **LAYOUT:** `textSafe {left 144, right 1776, top 96, bottom 940}`, `captionReserve {top 940, height 140}`, `header {144, 96, 948, 196}`, `topRightKeepOut` (x > 1560, y < 196), `core`, `railLeft/railRight`, `grid`; `colX(k)`, `snap8(v)`.
- **BIT:** size 24, radius 5, cruise 24, maxSpeed 36, accel 4, decel 5, minHop 10, maxRun 30, ripple 24 → 80 over 10 frames, breathe 48, trail sizes/opacities, halo.
- **LENS:** d 360 (300–420), stroke 4, 4 ticks 14×4, open 9 (radius 70→100%, content 3–9, ticks 6–8), close 6, dive 16, surface 14, minHold 45, settle 6, scale-chip angle 4:30.
- **LABEL / GLYPH / BRACKETS / STROKE / CHANNEL:** every number from brand spec §4–6 (anchor 8, leader 3, key bar 4, plate pad 10 at 90%; pip 12, badge 24, "?" badge 36; brackets 4 px, 14 px serif ticks, pad 8, from 24, 5-frame snap; main channel 18 = 2+14+2, standby 10 = 2+6+2).
- **Helpers:** `roleColor(theme, 'info' | 'energy' | 'standby' | 'part' | 'muted' | 'emphasis' | 'alert' | 'annotation')`, `withAlpha(hex, a)`, `mixColor(a, b, t)`, `contrastRatio`, `lightnessL`, `washNeedsBoundary(theme, wash, ground)`, `LUMA_FLOOR = 28`.

## 4. Fonts (`fonts.ts`)

`SANS` (Sora, weights 600 and 700) and `MONO` (JetBrains Mono 500) are CSS font-family strings; `SANS_FAMILY`, `MONO_FAMILY` are the bare names. `TEXT.label | secondary | pill | header | headerActive | hero | readout | unit | chip` are ready CSS objects. `monoWidth(text, size)` is exact (0.6 em advance).

**A style's own display face** (hero words only), at module top level in your folder:

```ts
import * as Fraunces from '@remotion/google-fonts/Fraunces';
import {loadDisplayFont} from '../../shared/fonts';
export const DISPLAY = loadDisplayFont(Fraunces, ['700']); // '"Fraunces", <kit sans fallbacks>'
```

## 5. Motion (`motion.ts`)

- `EASE.arrive | move | exit | snap | outCubic | inCubic | inOutCubic | linear` (brand curves; `snap` overshoots 5.7%).
- `progress(frame, start, frames, ease)`, `fadeIn`, `fadeOut`, `fade(frame, inAt, outAt?)`, `flip(frame, at, frames = 5)`, `drawOn`, `within`, `clamp`, `lerp`.
- `breathe(frame)`: ALWAYS-ON opacity 1.0 → 0.7 → 1.0 over 60 frames, phase-locked to f0. `breatheScale(frame, since)`: parked Bit 1.00 → 1.10 over 48 frames.
- `ripple(frame, at)` → `{size, stroke, opacity}` or null (size eases out; opacity falls linearly).
- Jitter: `jitter(seed, x, y, amp)` (`@remotion/noise`), `jitterPt`, `rand(seed)`, `randRange`, `boilPhase(frame, every)`.
- **`bitRun({path, depart, land?, speed?, allowLong?, reverse?, label?})`**: path is an SVG path string or polyline points (8 px bends). With `land`, the cruise speed is solved to land exactly there; without it, the speed defaults to 24 px/frame and `land` is computed. Profile: 4-frame ease-in, linear cruise, 5-frame cubic ease-out (distance = v × (T − 5.33)). It warns (`[kit] …`, printed by the tools) when a run is longer than 30 frames (unless `allowLong`), shorter than 10, or faster than 36 px/frame. Returns `{depart, land, frames, speed, length, start, end, track, sAt(f), at(f)}`.
- `bitChain(hops)`: one run per hop. `tagTiming(frame, land, exitAt?)`: the keyed-tag schedule. `kitWarn(msg)`: once per message.

## 6. Geometry (`geom.ts`)

`rectPath(x, y, w, h, r)`, `squarePath(cx, cy, size, r)`, `circlePath(cx, cy, r)` (starts at 12 o'clock, clockwise), `polyPath(pts, closed)`, `linePath(a, b)`, `routePath(pts, r = 8)` (rounded bends; use the same string for the route and the run), `almondPath`, `flattenPath(d)` (cached), `makeTrack(path)`, `resample`, `slicePolyline`, `offsetPolyline`, `pathLength`.

## 7. Skins (`skin.tsx`)

A skin draws strokes and fills; components pass it geometry only, so changing the skin never moves anything.

```ts
interface Skin { name: string; stroke(a: SkinStrokeArgs): ReactNode; fill(a: SkinFillArgs): ReactNode }
// SkinStrokeArgs: {d, color, width, opacity?, dash?, dashOffset?, trim?: [s0, s1], cap?, join?, role, seed, frame}
```

- `cleanSkin` (default), `clearLineSkin` (round joins/caps), `inkSkin({amp = 1.1, wavelength = 70, weightVar = 0.25, minWidth = 2, boilEvery = 0, salt})` (static nib jitter with ±25% weight, drawn as filled outlines; the Bit, halo, trail, ripples and plates stay clean), `litSkin({glowRoles = ['active']})` (the brand's one fake glow: a second outline at 3× width, 20%, only on role `'active'`).
- Roles tell a skin what it is drawing: `part, active, route, info, energy, wall, leader, anchor, emphasis, rim, tick, annotation, glyph, alert, bit, halo, trail, ripple, plate, other`.
- Draw your own hardware through the same skin: `skin.stroke({...})` inside a component, or `<SkinStroke skin={skin} d={...} color={theme.ink} width={4} role="active" seed="cpu" frame={frame} />`.
- Create a skin once at module level (`const INK = inkSkin({salt: 'style1'})`). Text is never skinned.

## 8. Components

Every component also has a `render` prop (or `renderRing` on LensRing) that receives the kit's computed geometry and timing, for a full redraw in a style's own language.

### Bit
`<Bit runs={run | [hop1, hop2…]} trail? ripple? park? restFrom? halo? color? size? render? />`
24 px rounded square in `info`; dark: stepped halo squares 40/64 px; light: 2 px surface keyline. Trail of 4 squares every 30 px, collapsing in 6 frames after landing. Each landing gets a square ripple (24 → 80 px, 10 frames). After the last landing it is **absorbed** into the ripple (3 frames) unless `park` (DRIVING: stays and breathes). Between hops it waits, breathing. `restFrom`: visible at the start point from that frame until departure. Also `LandingRipple {x, y, at}` and `bitState()`.

### SignalRoute
`<SignalRoute path={d} runs={run} held={{from, to}}? drawAt? idle? />`: a 4 px structure line; behind a travelling Bit the route lights in `info` and decays over 10 frames. `held` = a narrated held level (steady info). Use the same `d` as the run.

### LensRing
`<LensRing cx cy d? openAt | surfaceAt  settleAt? settleFrames? diveAt? closeAt? mode? chip? target? zoom? interior? neutral? rimColor?>{children}</LensRing>`
Opens over 9 frames, clips children to the ring. `chip` ("×4", or "Not to scale" for Signal Score's time mode) sits outside at 4:30. `target` (magnify) draws the 70% emphasis leader to a 10 px target square. `zoom={{k: 4, at: [x, y]}}` scales the children about `at` into the ring (strokes scale too: draw natively for crisp detail). **D24:** `settleAt={ANCHORS.handOverSettle}` fades ring and ticks to a grey rim (`structure`) over 6 frames while the view stays open; then fill the "?" with `StateGlyph state="UNNAMED" fillAt={ANCHORS.handOver}`. `neutral` = ink ring over colour-physics visuals.

### KeyedTag
`<KeyedTag anchor end? elbow? text secondary? role? keyColor? side? land exitAt? sentenceEnd? secondaryAt? plate? muted? size? />`
Anchor pops t0−6 → t0−2, leader draws t0−5 → t0−1, text t0 → t0+5 (8 px slide; readable by t0+3), secondary from t0+4. `land` = the word's start frame. It holds until `exitAt` (no automatic exit; use `minTagExit`, and pass `sentenceEnd` to get a console warning if you exit early). Right-side blocks: the leader ends on the key bar. Left-side blocks (`side="left"`): the leader meets the plate's right edge. Warns on >3 words, >22 characters or <30 px. Omit `end` for a leaderless name inside a part.

```tsx
<KeyedTag anchor={[880, 838]} elbow={[880, 770]} end={[930, 770]} text="Standby power" secondary="+5VSB · ATX"
          role="energy" land={WORD_CUES.standbyPower} exitAt={1690} sentenceEnd={SENTENCES.S10.end} plate={theme.board} />
```

### TimeChip / Header
`<TimeChip label | timeline inAt? outAt? shrinkAt? size? x? y? variant? plate? />`: sans 600 with +2% tracking and a 2 px rule, in the header zone (144, 96). 44 px while it carries meaning, `shrinkAt` steps to 34 px over 6 frames. A `timeline` change is 6 frames (old out over 2, new in from the next frame over 5; never two readable labels, never a blank frame). `TIME_LABELS = {afterPress, softOff, whenPressed, now}`. `variant="pill"` renders it as a state pill. `Header` is the same component for scope headers ("Intel desktop", "Stop: AMD").

```tsx
<TimeChip timeline={[{at: 2, label: 'After the press'}, {at: ANCHORS.returnStart, label: 'Soft-off'}]} shrinkAt={150} />
<TimeChip label="When pressed" inAt={ANCHORS.whenPressedIn} outAt={ANCHORS.whenPressedOut} />
<TimeChip label="Now" inAt={ANCHORS.nowChip} />
```

### StatePill
`<StatePill x y dock? label | timeline inAt? outAt? />`: capsule, sans 600 40 px, panel fill, 2 px structure border; a value change is a 4-frame flip. `dock`: `'top-right'` (default, 8 px outside the part's top-right corner), `'top-left'`, `'inside-top-right'`, `'inside-top-left'`, `'none'` (x, y = top-left). E.g. `label="Main power: OFF"`, `"Main rails: OFF"`, `"Soft-off"`.

### StateGlyph (+ AlertHatch)
`<StateGlyph x y dock? state | timeline flipFrames? fillAt? unfillAt? inAt? outAt? scale? />`
States `OFF | ON | ALWAYS_ON | RESET | WAITING | LIMIT | FAULT | UNNAMED`. (x, y) is the part's top-right corner; `dock='outside'` (default) puts the glyph 8 px outside it, `'inside'` 8 px inside, `'center'` uses (x, y) as the centre. `timeline={[{at: 0, state: 'OFF'}, {at: 294, state: 'ON'}, {at: 330, state: 'OFF'}]}` flips in 5 frames. UNNAMED is the 36 px "?" badge; `fillAt` fills it with emphasis over 6 frames. `AlertHatch {x, y, w, h}` draws the 45° alert hatch.

### EyeBadge, ApproxChip, AnalogyFrame
`<EyeBadge x y width? variant="analogy" | "solid" inAt? outAt? />`: the D24 almond with a pupil; the analogy variant is dashed annotation grey with the ≈ chip (sit it ON the lookout). `<ApproxChip x y />`: the ≈ chip alone (a vector: the font subset has no "≈"). `<AnalogyFrame x y w h inAt? />`: dashed analogy outline + ≈ chip (e.g. the S07 sign-in card outside the monitor).

### VisitedMark
`<VisitedMark x y w h r? outset? at? outAt? pip? />`: the D24 visited mark, a 3 px annotation-grey outline with a hollow pip, drawing on over 8 frames from `at` ("Firmware on CPU", "Loader" after their hand-off).

### EnergyChannel
`<EnergyChannel path kind="main" | "standby" fillFrom? fillTo? full? drainFrom? shimmer? walls? inAt? />`: two structure walls and an amber fill (standby: `energyStandby`, thin). The fill-front runs from the path start (source) to its end (load) with a stepped 24 px soft edge, default 50 px/frame. `full` = live from the start. `shimmer={{from, to}}` = slow 90/90 dashes (1 px/frame standby, 2 main) while the voice talks about flow. Energy never travels as marks.

### PoweredWash
`<PoweredWash box | d at outAt? color? ground? boundary? />`: the S11 powered-domain tint, fading in over 8 frames. `boundary="auto"` (default) adds the shared-rules 3 px annotation boundary when the wash is not ≥ 1.3:1 and lighter than its `ground` (dark), or ΔL* < 10 (light). With the stock tokens the boundary is always needed: the dark wash is about 1.1:1 against the surface and darker than the board. A lighter wash: `color={mixColor(theme.board, theme.energy, 0.16)}`.

### Brackets
`<Brackets box={{x, y, w, h}} lockAt fadeAt? pad? neutral? />`: two square brackets, each with two 14 px serif ticks. **`lockAt` is when the snap completes** (the anchor and the Lock cue); the 5-frame snap starts 5 frames earlier. For f1798: `lockAt={ANCHORS.lock}` (snap f1793–f1798).

---

## 9. Recipes for the shared anchors

- **Flash-forward Bit:** `bitRun({path, depart: ANCHORS.ffBitDepart, land: ANCHORS.ffBitLand})`, default (absorbed) `<Bit>`; the lookout keeps `ALWAYS_ON`.
- **S04 demonstration:** `depart: ANCHORS.s04Depart, land: ANCHORS.s04Land`; no cap travel; no state change on landing (ripple only).
- **D24 hand-over:** `LensRing settleAt={ANCHORS.handOverSettle}` + `StateGlyph state="UNNAMED" fillAt={ANCHORS.handOver}`. One emphasis device at a time: the kit does not police this.
- **S06 chain:** five `bitRun`s landing on `ANCHORS.chain1…chain5` (each ≥ 10 and ≤ 30 frames), `<Bit runs={[...]} park restFrom={WORD_CUES.chainOfHandoffs} />`.
- **S12:** depart 2–4 frames after `ANCHORS.realPress`, `land: ANCHORS.nextLand` (1891) → about 52 frames: pass `allowLong: true` (Style 1's documented exception) or carry with the camera; at f1889 it is still travelling.
- **Brackets:** `lockAt={ANCHORS.lock}`. **"Now" chip:** `inAt={ANCHORS.nowChip}`.

## 10. Tools

```
node tools/stills.mjs <entryFile> <compositionId> <outDir> <frames: list and/or a-b:step> [--phone] [--luma] [--picture y0:y1] [--concurrency n]
node tools/render.mjs <entryFile> <compositionId> <out.mp4> [--frames a-b] [--scale s] [--concurrency n]
python -I tools/sheet.py <video> <outPng> [--every 30] [--ranges a-b:step,...] [--width 384] [--cols 6]
node tools/anchors.mjs [--md]
npx tsc --noEmit -p tsconfig.styleN.json
```

- **stills.mjs** bundles once, selects the composition and renders `<outDir>/fNNNN.png` (true frame numbers), plus `<outDir>/sheet.png`, a labelled contact sheet. `--phone` writes 390 px-wide Lanczos copies `fNNNN_phone.png`; `--luma` prints mean Rec.709 luma (0–255), `--picture 132:948` over those rows only (letterbox). Example: `node tools/stills.mjs src/entries/style2.tsx NightSignal out/style2/look 0,671,1500 --phone --luma --picture 132:948`.
- **render.mjs**: H.264, CRF 16, yuv420p, BT.709, PNG frames, **muted (no audio track)**, concurrency 6. It ends by printing ffprobe's width, height, fps and the decoded frame count, and fails if any differ. Final: `node tools/render.mjs src/entries/styleN.tsx <Id> out/styleN/styleN_muted.mp4`.
- **sheet.py** selects frames by decoded index (`select=eq(n,…)`, never an fps filter) and cross-checks each label against its timestamp. 1 fps: `--every 30`. Bursts: `--ranges 0-60:5,460-510:5,640-700:5,740-870:5,1780-1889:5`.
- **anchors.mjs** re-derives every anchor and beat from the word JSON and compares them with the printed tables.
- Entries: `src/entries/style1.tsx … style5.tsx` (BenchNotebook, NightSignal, LivingSchematic, SignalScore, LivePanels) each register only their own composition; `src/entries/kitdemo.tsx` registers `KitDemo`; `src/index.ts` (`npm run studio`) registers all of them.

## 11. Gotchas

1. **Absolute frames.** Kit components read `useCurrentFrame()`. Inside `<Sequence from={N}>` that frame is relative: don't offset Sequences around kit components, or pass `frame={absoluteFrame}`.
2. **SVG only.** Kit components must sit inside an `<svg>` whose user space is the 1920×1080 frame (or `<KitLayer>`). A camera move = a transform on a wrapping `<g>`/div; strokes then scale (divide widths by the scale if they must stay constant).
3. **Plates.** The tag plate defaults to the surface colour at 90%; on a board or panel pass `plate={theme.board}` / `{theme.panel}` (or `false`), otherwise a darker or lighter card shows.
4. **Fonts.** Only Sora 600/700 and JetBrains Mono 500 are loaded (other weights are synthesised). The latin subset has "·" and "×" but no "≈": use `ApproxChip`. Use `SANS`/`MONO` strings, never bare names.
5. **Warnings** from `bitRun` and `KeyedTag` appear in the tool output as `browser warning: [kit] …`. Read them.
6. **Same path** for a route and its run (`routePath(points)` once, reuse the string), or the Bit leaves the line.
7. **Brackets `lockAt`** is the completion frame; **KeyedTag** never exits on its own; **TimeChip** "After the press" by f8 means `inAt <= 3`.
8. **Deterministic:** no `Math.random`, no `Date`. Use `rand(seed)` / `jitter`. `inkSkin` is static unless you set `boilEvery`.
9. **Bundles:** the first bundle of an entry takes about 20 s (its own webpack cache), later ones about 3 s. Five builders share 24 CPUs: keep render concurrency at 6 or below.
10. **Luma:** dark styles measure with `--luma`; a sparse dark frame sits near 18–20 (KitDemo's dark segments do), so carry the mechanism on panel and board tones.
11. **`staticFile('audio/voice_intro.wav')`** may not exist yet; final renders are muted anyway.

## 12. How the kit was verified (frame inspection and technical checks only)

- `npx tsc --noEmit` passes for the whole project and for each `tsconfig.styleN.json` / `tsconfig.kit.json`.
- `node tools/anchors.mjs`: every A4 anchor and A3 span matches the word JSON (after correcting chain4 to "needs,").
- KitDemo stills (`out/kitdemo/final/` with 390 px copies; bursts in `out/kitdemo/burst/` and `out/kitdemo/burst_ink/`) inspected at full size and 390 px across five segments: dark/clean, light/clean, light/ink, lightCool/clear-line, dark/lit. Checked: Lens open (clockwise draw, ticks at 6–8, chip), D24 settle and "?" fill, Bit trail, landing ripple and absorption, lit route decay, tag entrance and left/right leaders, time-chip swaps, pill flip, glyph flip, bracket snap, channel fill-front and shimmer, wash boundary.
- Each placeholder entry rendered through `stills.mjs` (`out/placeholder/styleN/`). Isolation: with style 2's Intro deliberately broken, style 2's bundle failed while style 1 rendered; the style-1 entry does not contain NightSignal.
- `render.mjs` 60-frame test (`out/kitdemo/test60.mp4`): ffprobe 1920×1080, 30 fps, 60 decoded frames, H.264 High yuv420p, no audio. `sheet.py` labels verified against timestamps.
- Nobody can play video in real time or hear audio here; all checks are stills, measurements and file probes.
