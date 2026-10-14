# Signal Atlas: the Bits in Motion editing style (style6)

**Status:** the design to lock, written 10 October 2026 for the hybrid of tests 03, 02 and 05. Code IDs: composition `SignalAtlas`, folder `src/styles/style6/`, engine `src/engine/`, icons `src/icons/`. Every number here is mirrored in `src/engine/tokens.ts`; if the two ever disagree, fix the code to match this file.

**Companion documents:** `ICONS.md` (every part and glyph), `ENGINE.md` (TypeScript signatures), `STORYBOARD.md` (the Ep01 intro, beat by beat), `docs/prompts/06_signal_atlas_production_prompt.md` (the builder's prompt).

**Evidence used:** 1 fps sheets and 6 fps bursts of the 02, 03 and 05 finals (`remotion/out/style6/study/`), full-size key frames, `comparison_sheet.png`, the three storyboards, their code, the Quality Report (all of it), Stage A §3 and §6.2–6.5, the provisional brand spec, the brand asset audit, the accuracy guardrails, the planned topics, Part A and the kit. Palette contrast, luma and the world layout were computed and prototyped in code before this was written (frame-composition mock-ups at every named shot; mean luma 30.6–38.1 before labels).

---

## 1. Name and the viewing experience

**Signal Atlas.** An atlas is one world explored through plates and insets; the signal is what you follow through it.

**In one sentence:** you glide through one dark, living map of the real machine where only power and signals give off light, and whenever two states must be compared or a moment must be held, a lit plate lifts out of the map so you can see both, with the Bit carrying the cause across the gap.

---

## 2. What each test gives the hybrid (and what it must not bring)

| From | What makes it work, precisely | What we keep | What we drop or fix |
|---|---|---|---|
| **03 Living Schematic** (visuals) | One persistent model with **true topology** (the button's wire visibly ends at the header with an end tick); recognisable silhouettes (IHS with notches and pin-1 mark, DIMMs, M.2 with screw, PSU fan and vents, IEC inlet, rocker, wall socket, IEC power symbol); **constant on-screen line weights** at every zoom; one radius family; a quiet neutral palette so the three meaning colours pop; log-space zoom with Move easing and a rate cap; tags with role-coloured key bars in rails. | The one world, true topology, non-scaling strokes, CAD-grade silhouettes, log zoom, end tick, persistent state. | The light, generic surface (brand 6); parts 7–15 px on a phone at system view; empty side thirds; 72% of frames unchanged. |
| **02 Night Signal** (animation) | **Light as information**: only powered parts and travelling Bits emit, so you read state before words; the Bit's stepped halo and 10-frame route light make every journey legible; the iris wipe follows the pen; match moves carry facts (lookout → station 1; screen plate → monitor); log-space dollies with plane parallax; the final carry follows the Bit; tense through framing (letterbox = later). | Light-as-information, the lit Bit with route light, the pen-following Lens wipe, match moves, parallax, the closing carry, framing as tense. | Cuts that break the single view; idle outlines under 3:1 at 480p; per-chapter set and camera cost; the busy desk-to-tower dolly. |
| **05 Live Panels** (explanation) | **One idea per panel with a big actor**; the Bit physically crosses gutters through ports, so cause visibly travels between views; split-to-compare: identical copies slide out and diverge on the spoken words (the S10 three-state split answered probe 2 best of all five); the active rim follows the cause; the chain as a row of actor views; the shortest holds in the set (1.7 s). | Split-to-compare, gutter crossings with ports, a plate row for sequences, large actors, the moving active rim, short holds. | Split attention as the default; dot-sized parts on the home page; hard page changes (frame-difference jumps of 49 and 59); "Diagram" chips (UI feel); the largest code. |

---

## 3. Principles (binding)

1. **One world per topic, always the truth.** Ep01 is one Intel ATX desktop in soft-off, on screen from f0, never rebuilt. Views (camera, Lens, plates, bands) are windows onto that one model. Things return as the same object in a new state, never as a new icon.
2. **Light means power or information.** Only powered parts (ink outline, lit body), travelling or held information (cyan) and live energy (amber fill) are bright. Everything unpowered is dark gunmetal with a grey outline. A viewer can answer "what's awake?" with the sound off.
3. **The camera carries; it rarely cuts.** Moves follow a cause (the Bit), a scope change ("your PC", "a typical desktop") or a level change. The intro has **no cuts**.
4. **Panels lift out of the world only to compare or to hold time.** A plate is a view of the same world, peeled from where its subject sits, and it settles back afterwards. Single view is the default; panels are the exception.
5. **Cause, then effect, on the word.** Nothing changes state without a visible cause (a landing, a fill-front, a narrated verb). Anchored actions land within ±1 frame (shared anchors) or ±3 frames (tags).
6. **Big on a phone.** When the voice names a part, it is ≥ 80 px on its longer side and ≥ 40 px on its shorter side (16 × 8 px on a 390 px phone), or shown in a Lens or plate at ≥ 160 px, or it reads as a light: lit with the glow, or carrying the 44–56 px "?" badge. A cause shown by motion (the pulled plug) is exempt while it moves. Meaningful lines are ≥ 3 px at ≥ 5:1. (Critic: the original "≥ 80 px" was not met by the storyboard itself; the button was 69 px when named. The button is now r 36, and the rule states what the frames actually rely on.)
7. **Always alive, never busy.** The living field never stops (no frame is frozen), the foreground never holds still for more than 45 frames under speech, and at most one primary motion happens at a time.
8. **Real versus analogy is visible.** Real is solid; analogy is dashed with a ≈ chip and sits on the real part.
9. **The screen never outruns the voice.** No sentences, no unspoken numbers, no names before the script says them; hedges stay hedged. **One name per object** (round 4, the glossary rule): once an object is named, every tag, plate name, pill and caption uses that one name; a technical name may sit under it as a mono subline; a rename happens only as a `step` on the same leader when the narration renames it (§10.4).
10. **Episodes are data.** A world file, a shot list and a word-anchored script drive a shared engine; an episode adds data and at most a few new icons.

---

## 4. Palette (dark only), matched to the thumbnails

### 4.1 Tokens (`tokens.ts → COLOR`)

Contrast is WCAG 2.x against `board` unless stated; luma is Rec.709 0–255.

| Token | Hex | Luma | Role | Contrast |
|---|---|---:|---|---|
| `void` | `#070B15` | 10.9 | Outside the "later" window; scrims; shadows | — |
| `field` | `#0F1729` | 22.6 | Living-field base (beyond the world) | — |
| `deck` | `#15203A` | 31.5 | Case interior; plate and band ground | 1.09 vs board |
| `board` | `#1A2742` | 38.2 | PCB | — |
| `bodyLo` | `#1F2C48` | 43.3 | Plastic tops: slots, connectors, headers | 1.08 |
| `body` | `#26344F` | 51.0 | Package and box tops (unpowered) | 1.19 |
| `bodyHi` | `#2F3E5C` | 61.0 | Metal tops: IHS, button cap, bezel | 1.39 |
| `side` | `#0A101C` | 15.6 | 2.5D side faces | 1.28 (darker) |
| `deckEdge` | `#3A4866` | 71.2 | Case outline (no meaning) | 1.63 |
| `structure` | `#8F9CB5` | 155.0 | Inactive outlines, walls, idle routes | **5.37** (6.46 field, 4.50 body) |
| `textMuted` | `#AEB8CB` | 183.2 | Muted labels, mono lines, "pointed at" | **7.44** |
| `annotation` | `#C3CCDD` | 203.3 | Leaders, analogy dashes, ≈, visited, double rules | **9.20** |
| `ink` | `#F3F2EE` | 241.9 | Text, active outline | **13.27** (14.42 deck, 17.56 void) |
| `detail` | `#53648A` | 99.1 | Interior detail only (never meaning) | 2.11 vs body |
| `rim` | `#B4C5E0` at 30% | — | Rim light on raised parts | ≈ 2:1 vs body |
| `activeFill` | `#41537A` | 82.0 | Powered body | 1.63 vs body, 1.94 vs board |
| `info` | `#00E5FF` | 182.2 | The Bit, held signals | **9.66** |
| `infoWake` / `infoHalo1` / `infoHalo2` | `#0C90AA` / `#154964` / `#183853` | — | Route-light tail; halo steps (18%, 9%) | — |
| `energy` | `#FFB000` | 180.1 | Live main rails | **8.11** |
| `energyStandby` | `#B8800A` | 131.4 | Standby trickle | **4.34** |
| `standbyShimmer` | `#EEAA16` | 171 | Shimmer dash (round 1: was `#DC9805`, ΔL* 10.1) | ΔL* 16.6 vs standby |
| `energyWash` | `#3F3D37` | 61.0 | Powered domain (board + 16% energy) | 1.37, lighter: no boundary needed |
| `emphasis` | `#EA5FFC` | 135.9 | The "?" badge and its pointer; the Lens on the "?" (round 1: brackets and other Lens rings are `ink`) | **5.34** (6.42 field) |
| `alert` / `alertHatch` | `#FF5468` / `#B43D4D` | — | ! and × glyphs, hatch | 4.76 |
| `gridDot` | `#566A92` | 104.6 | Atlas grid dots (opacity varies) | 3.30 vs field at 100% |
| `deepTrace` | `#24345A` | 50 | Far-layer traces (round 1: `#1C2842` 1.22:1, lost at 480p; round 3: `#202E4C` → `#24345A`, the lattice reads on a phone) | 1.46 vs field |
| `fieldPulse` | `#7C9FDA` | 152 | "Current" pulses on the deep traces (round 1, §5.4; round 3: was `#6A8CC8`); steel blue, never cyan or amber | — |
| `standbyTrickle` | `#FFD27A` | 213 | Round 3: the narrated standby trickle's sparse dashes, inside the thin standby fill only (§8.3) | — |
| `screenBlack` | `#04060B` | 5.9 | A monitor that is off | — |

### 4.2 Roles (unchanged from the brand, restated)
- **Information is cyan and discrete.** It travels as the Bit on single-line routes; held levels are a lit route. Signals *about* power are cyan.
- **Energy is amber and continuous.** Double-walled channels, a fill-front, a slow shimmer while narrated. No marks, no arrowheads.
- **On or off is outline, fill and pip, never hue.** Off: `structure` 3 px, `body`, hollow pip. On: `ink` 4 px, `activeFill`, filled pip.
- **Emphasis is magenta and singular, and magenta belongs to the "?".** The "?" badge, its pointer fill and a Lens whose subject is the "?" are magenta; a Lens on anything else (Ep01: the lookout's) and the bracket lock-on are `ink` (round 1, §20: magenta brackets on the button tied it to the "?"). One emphasis device at a time.
- **No green "awake" state.** The ATX standby wire, when shown, is matte purple and labelled (not in the intro).

### 4.3 How it matches the thumbnails and banners
The thumbnail grounds measure `#000510`–`#02050A`, their headline cyan `#00EEFF`–`#20F6FF`, the B monogram's pixel trail `#EA5FFC`, headlines `#FEFEFE`, and their hardware is gunmetal with a lit top edge. Signal Atlas keeps that **logic**: navy-black depth (in `void`, `side` and the field), gunmetal bodies with a rim light, electric cyan for the signal, magenta for the lens and the "?", white type. The ground is lifted from `#05070F` to `#0F1729`/`#1A2742` for one reason: the brand floor of 28/255 mean luma. Near-black lives in shadows and side faces, so frames still read as dark (measured 30.6–38.1 in the layout mock-ups).

### 4.4 Colour vision
Cyan/amber ΔE ≥ 90 under every simulation (brand table); info vs emphasis 23.8 under deutan is separated by form (a moving square vs a ring/brackets); `ink` vs `info` is ΔL* 11.9 and separated by form (outline vs square).

### 4.5 True colours
RGB subpixels, LEDs and wire insulation keep their real colours; brand cyan, magenta and coral stay off them; the Lens and brackets turn `ink` over colour-physics visuals. A monitor that is off is `screenBlack` for the whole Ep01 intro.

---

## 5. The background system: the living field

The owner's note was "the background is very static". In all five tests 68–77% of frames were unchanged. The living field ends that, but it is **meaningful** (it shows depth, focus and causes) and **subtle** (it never competes with the explanation).

### 5.1 Layers (back to front)

| Layer | Content | Parallax | Opacity | Always-on motion |
|---|---|---:|---|---|
| L0 base | Flat `field` | — | 100% | none |
| L1 deep circuit | Seeded orthogonal trace lattice: 96 px cells, 22% of edges drawn, 2 px `deepTrace` lines, 8 px bends | 0.25 | 100% (1.33:1, round 1) | drift +0.25 layer px/frame (1 px every 4 frames, left → right); "current" pulses run along the traces (§5.4) |
| L2 atlas grid | 4 px square dots at 48 px pitch, `gridDot` | 0.60 | 30% base; up to 80% in the light pool (round 1: 22 / 62%) | drift +0.25 px/frame in whole-pixel steps (1 px every 4 frames) |
| Deck | The world itself (case tray, board, parts) | 1.00 | — | none (the deck never drifts) |
| L3 board vias (critic; build values) | 4 px square dots on a **24**-world-px lattice on the board's top face, under the parts, `gridDot` | 1.00 (part of the deck) | 0% at rest; up to 45% in the light pool; land **+85%**, press **+90%** (round 2; round 1: +70 / +80%) | none: they only light up |

The field fills the frame behind the world. It never covers the world. The deck holds still when the camera holds: there is **no idle camera drift** on the explanatory plane. **Why L3 exists:** at most framings the case tray and the board fill the middle of the frame, so L2's light pool and pixel ripples would show only in the margins (a landing ripple on the lookout never reaches past the case). The vias carry the same reactions on the board, where the viewer is looking, and stay invisible at rest so the board reads clean.

### 5.2 Motion speeds and limits
- L1 and L2 drift continuously (both about 7.5 px a second; round 1, was 3 and 5) in **whole-pixel steps** (1 px every 4 frames): squares stay crisp, there is no anti-aliasing shimmer, and YouTube's encoder keeps sharp, exactly-moving dots instead of smearing sub-pixel motion. Check: no run of identical frames longer than 6.
- No twinkle, no random particles, no gradients, no blur. Every reaction is a change of dot opacity on an expanding **square** ring (pixels, like the B monogram), on L2 and on the board vias, or a pulse running along a deep trace (round 1: the owner's "the background is very static" still applied, and the judges measured 52–54% near-static frames). Pulses are the field's own steel blue: cyan is information and travels only as the Bit; amber never marks the field.

### 5.3 Focus by light: the light pool
- The grid brightens around the current **focus point**: opacity = 0.22 + (0.62 − 0.22) × cos²(π/2 × d/560) for screen distance d < 560 px.
- The focus point is **derived** (`ENGINE.md §6.1`; no authored track): the Bit while it travels, else the Lens centre while open, else the anchor of the newest label for 45 frames, else the active plate, else the frame centre. It eases to each new point over 18 frames (`arrive`). The same pool lights the board vias (L3).
- Focus is never shown with blur, vignettes or dimming the world. Inside the world, focus is the label landing, the tone step of a "pointed at" outline (`structure` → `textMuted`), the one faked glow on the narrated powered part, or the Lens.

### 5.4 Reactions to events (each is one script event; on L2, and the pool, land and press reactions also on the L3 vias)

| Event | Field reaction | Frames |
|---|---|---|
| Button contact (f0, f1837) | A two-step pixel wave from the button that crosses the frame: radius 0 → 1500, ring **112** px, **+0.90** (vias +0.90), with an echo ring at 62% of the radius and half the gain (round 2; round 1: 96 px, +0.70 / +0.80). The button's own press wave (two `ink` rings) grows 190 px over 24 frames (round 2; was 96 / 18) | 34 |
| Bit landing | Pixel ripple from the landing point that crosses most of the frame: 0 → **1000**, ring **96** px, **+0.75** (vias +0.85) (round 2; round 1: 560, 64 px, +0.60 / +0.70) | **30** |
| Press and landing | A wave of "current" pulses runs outward along the deep traces within **1100** px: each trace fires from its nearer end when the wave front (**40** px/frame) reaches it, brighter nearer the event (round 2; round 1: 820 px, 34 px/frame) | ≈ 60 |
| Always | Each deep trace carries one idle pulse per seeded period (**52–100** frames; a long walk stretches its own period so none goes dark): a **150** px, **4** px tail at 42% and a **6 × 26** px head, **8** px/frame, `fieldPulse` at **90%** (round 3: the heads read at 390 px; round 2: 80–150, 120 px, 18 px head, 7 px/frame, 3.5 px), dimmed outside the "later" window like the grid | — |
| Always (round 2) | The light pool **breathes**: its gain swings **±30%** over **270** frames (9 s), a visible halftone swell at the focus (round 3; round 2: ±12% over 8 s), so a hold is never a frozen frame | — |
| Focus change, and every **60** frames while held (round 4) | A **focus ping**: a soft square ring leaves the subject (the newest label's anchor, an open Lens, the active plate; never a travelling Bit, never the frame centre) 4 frames after it takes the focus: radius 0 → **900** px over **54** frames, a **96** px band, **+0.55** on the vias (drawn **7** px inside the band, a pixel wave) and **+0.35** on the grid, fading as (1 − t)^0.45 | 54 |
| Always (round 4) | The vias' pool holds its peak to **45 %** of its radius (the subject covers the pool's centre, so the halftone shows on the bare board round it) and **breathes with the lookout** (±30 % relative over 60 frames, phase-locked to f0, brightest where the pip is) | — |
| Lens open | Dots under the Lens are covered (the Lens interior is opaque) | — |
| "Later" window contracts | Dots outside the window drop to 40% of their opacity | 10 |
| Return to now (f327, f914) | Every dot dips −0.20 and recovers ("time breath") | 10 |
| Plate lifted | Dots under the plate's flat shadow are covered | — |
| Focus change | Pool moves (5.3) | 18 |

Nothing else reacts. Energy never tints the field (amber must never form marks). **Round 4** (the owner's "very static"; judges: "the background lives mostly in the margins"): the pings and the vias' plateau and breath put the field's life on the board itself, round the thing the voice is about; labels stay fully clear (their knockouts never draw vias) and every frame keeps mean luma ≥ 28.

**Build change (10 October 2026, intro builder; mirrored in `tokens.ts → FIELD`):** at the critic's values (vias 48 px pitch, land +0.30, press +0.35; grid land +0.25, press +0.35) the press ring and the land ripples were invisible at full size in rendered stills: 4 px dots 55–86 px apart barely changed. With the vias at a 24-world-px pitch and the gains above, the press reads as a square pixel wave across the board and the light pool as a soft halftone round the focus; at rest the board is still clean (vias base 0) and every frame keeps mean luma ≥ 28.

### 5.5 Luma budget
- Every frame's mean luma ≥ **28** (whole frame, margins included); target 31–42. Mock-ups of every intro framing measured 30.6–38.1 before labels and the Bit (critic re-check, fills only, after the changes: shots 29.4–36.6, S06 30.6, the triptych 31.8; the lowest is the `monitor` hold).
- The world (deck + board + parts) covers at least 42% of every hold; the field may fill the rest. Framings dominated by field (the monitor, the Atlas view) keep part of the board in frame.
- The field adds 0.4–1.5 luma on top of flat `field`. Labels always sit on a ground-aware knockout plate (§10.3), so text contrast stays ≥ 7:1 whatever the field does.

---

## 6. World model and icon system

### 6.1 One world, one projection
- **Orthographic map of the real hardware in true topology**, drawn like a transit map: orthogonal and 45° routes, 8 px bends (channels 10 px), parallel routes ≥ 16 px apart, 6 px crossing gaps. Parts sit in true relative places; schematic liberties are allowed only to shorten routes (Ep01: the 24-pin on the board's bottom edge, the front panel under the board), never to change what connects to what.
- **World units:** world px = screen px at zoom 1. The Ep01 world is laid out in `STORYBOARD.md §1`.
- The case is a `deck` plate with a `deckEdge` outline; the wall socket and the monitor are room objects at parallax 0.9.

### 6.2 Icon style ("machined line")
Every hardware icon is: a **top face** (`body`, `bodyLo` or `bodyHi` by material) + a **2.5D side** (§6.4) + an **outline** (3 px `structure` off, 4 px `ink` on) + a **rim light** + optional **interior detail** (2 px `detail`, never meaningful) + a **state pip** docked 8 px outside the top-right corner. Corners: parts 10 world px, internal blocks 6, plates 12 screen px, the Bit 5. No stock icons, no faces, no text inside parts (labels are overlays), no photo textures. Full catalogue: `ICONS.md`.

### 6.3 Strokes (non-scaling: the engine divides by zoom)
| Line | Width | Colour |
|---|---:|---|
| Inactive outline | 3 | `structure` |
| Active outline | 4 | `ink` |
| Interior detail | 2 | `detail` |
| Signal route | 4 | `structure` idle; `info` behind the Bit (10-frame decay) |
| Leader | 3 | `annotation` |
| Analogy outline | 3, dash 12/8 | `annotation` |
| Main channel | 18 (2 + 14 + 2) | walls `structure`, fill `energy` |
| Standby channel | 10 (2 + 6 + 2) | walls `structure`, fill `energyStandby` |

### 6.4 2.5D: extrusion, planes and rim light
- **Height classes (world px):** flat/trace 0, pad 2, chip 4, connector 6, package 8, module 10, tall 14, box 22.
- **Side offset** of a raised part (world px) = z × [(0.45, 0.60) + 0.25 × (part centre − frame centre)/1000 px]. The constant term shows bottom-right sides (key light from top-left); the second term changes the sides gently as the camera moves, which is where the 2.5D parallax comes from. (Critic: at 0.5 the sides vanished at the left edge and doubled at the right during a pan, a swing that would read as busy; 0.25 keeps the depth cue and never flips a side.) The side is the hull of the top face and its offset copy, filled `side`; the top face is drawn over it. Labels, ports and the Bit use the top face, so they never move with the swing.
- **Rim light:** 2 px line on the top and left edges of each raised top face, `rim` at 30%. It is material, identical on and off; it never means power.
- **Planes:** deep circuit 0.25, atlas grid 0.6, deck 1.0, room objects 0.9, UI (labels, chips, Lens rings, plates) screen space.

### 6.5 Levels of detail
Every icon always draws its silhouette and identity features (the base); its interior detail is one group whose opacity rises from 0 to 1 as the icon's shorter on-screen side grows from 136 to 176 px (tokens `DETAIL`). No levels, hysteresis or crossfades: it is a pure function of the frame, so it fades smoothly during zooms. Anything a beginner must read (the rocker's I/O, the pulled plug's pins, the CPU's notches) is base, never detail. Lens and plate views use a 1.15 size bias.

**State pips on context parts (build):** parts whose state the episode never narrates may drop their pip (`pip: false`; Ep01: DIMMs, M.2, LAN chip, SPI flash, PSU, monitor, battery). A row of hollow squares over the DIMMs and stray squares beside small parts read as UI noise at system view. **Round 1:** the CPU and the "?" drop theirs too (judges: hollow squares that never change read as artefacts); the CPU's darkness is its grey outline and unlit body, the "?" carries its badge, and the lookout keeps its breathing pip, the one pip whose meaning the story uses.

### 6.6 States and emissive rules
| State | Outline | Body | Pip | Other |
|---|---|---|---|---|
| off | `structure` 3 | material tone | hollow 14 px | — |
| on | `ink` 4 | `activeFill` | filled `ink` | glow if narrated |
| alwaysOn | `ink` 4 | `activeFill` | filled, breathing 1.0 → 0.7 → 1.0 / 60 frames, phase-locked to f0 | the default glow holder in Ep01 |
| visited (D24) | `annotation` 3 | material tone | hollow `annotation` | — |
| pointed at | `textMuted` 3 (for its sentence) | unchanged | unchanged | not a state; a pointer |
| reset / waiting / limit / fault | per brand | | | badges and hatch |

**Emissive budget:** at most **two** things give off light per frame: the guide Bit's halo and **one** narrated powered part, faked as a second outline at 3× width and 20% `ink`. Energy fills are lit but never glow. Text, rim lights, plates and the field never glow. Ep01: the lookout holds the glow except f294–f327, when the narrated "?" (flash-forward) holds it.

### 6.7 Glyphs v2
State pip 14 px; "?" badge 52 px (60 px when it is the subject, 72 in a Lens; round 1: 44 / 56 were 9–11 px on a phone), radius 10, 3 px `emphasis`, Sora 700 glyph; **its "fill" is a pointer, never light** (round 1, red line 7 "the '?' stays dim in every soft-off scene"): **round 2: the dashed 3 px emphasis ring alone** (no tint: round 1's 30% tint still made the "?" the most saturated object on screen in soft-off), opening 6 → 16 px outside the badge over 6 frames — the D24 hand-over (f671) and S07's "hidden processor" use it; a powered "?" (the flash-forward) is shown by its block's state and glow only. Eye badge (analogy) 0.9 × its block's on-screen width, clamped to 48–96 px (96 inside a Lens), dashed `annotation` from its first frame, with a **44 × 36** ≈ chip (round 2; was 32 × 28); visited mark 3 px `annotation`; brackets **5 px with 18 px serifs, 18 px outside the part** (round 2; round 1: 4 / 14 / 8) in `ink`, snap 5 frames, ≤ 6% overshoot; end tick 3 × 14 px; scale chip mono **36** px; wake sources as **96 px badges** (round 2: a rounded-square chip on `deck` with a 3 px outline and the glyph inside, so a clock reads as a sign, not a part on the board; round 1: 80 px bare glyphs); the press wave: two `ink` rings leave the button's outline and grow **190** px over **24** frames, 5 → 1.5 px, the second 5 frames later (round 2; round 1: 96 / 18). Round 2 S08 signs: a big restart loop (`loopArrow`, 6 px `ink`, 310° with its head) and a big power symbol (`powerRing`) drawn round a plate's PC, and the problem mark (`problem`, a 64 px `alert` badge with "!": it clears with a ring, or pulses when it stays). Exact props: `ICONS.md §5`.

**Round 3 glyphs.** The "?" badge is drawn at **58%** (`GLYPH2.qDim`) whenever its block is unpowered and not pointed at, accented or inside a Lens (red line 7: judges saw the full-saturation "?" as one of the brightest marks in soft-off); it is full strength in the flash-forward, in chain plate 3 and under its pointer. The eye's **≈ is two unboxed waves** at its upper left (`GLYPH2.eyeApprox`), part of the one dashed badge (A6: "the dashed ≈ eye badge"; the boxed chip read as a second unknown icon). The eye **closes** when its lookout loses standby power (the upper lid comes down onto the lower one over 6 frames, the pupil shrinks away, three lashes: the S10 what-ifs) and its pupil can **glance** toward an anchor (up to 0.2 × its width over 6 frames: S11, the lookout watching its doors). An **order mark** (`mark`, "First": a capsule on `deck`, 3 px ink, Sora 700, **44** px since round 4) may sit on a non-CPU block on the word "first" (the CPU never carries one); **round 4:** it sits on a 3 px leader to its block, away from any other block, with the block's technical name as a mono subline ("always-on logic"), so it never lands on an unnamed block. **Round 4, the hedge mark:** S08's problem mark is **84** px; a **dotted ring** round it means "maybe": on "can fix" the "!" fades to a dashed, faint outline inside the ring (it may be gone); on "might not" the "!" stays and the ring sends two dotted echoes (it may stay). The grey "?" is retired: the "?" means the hidden processor across the series. The scope line draws as **four separate L-brackets** (76 px arms) that grow out of the corners together and hold (round 4: never joining into a rectangle, ≥ 24 px clear of the chip's scope line). **Round 4, stage marks** (`stage`): a chain stage shows what it hands on: the firmware's code (three short code lines on a chip) on the flash, the loader's file (a document with a folded corner) on the SSD; a copy slides into the processor as the Bit lands there. Wake badges step down to **56 %** once they have settled (settings-dependent sources stay dim; only the button is lit on "like that button").

---

## 7. Camera grammar

### 7.1 Shots
A **shot** is a world point held at the frame centre plus a zoom (world → screen scale). Episodes name their shots (Ep01: `STORYBOARD.md §2`). Zoom range in Ep01 0.85–2.4.

### 7.2 Moves and easing

| Move | Use | Ease (cubic-bezier) | Duration |
|---|---|---|---|
| **Carry** | Follow a Bit to its receiver | `carry` (0.45, 0, 0.15, 1) | run + 2 lead + 12 settle |
| **Glide** | Reframe in a pause or on a sentence's first word | `glide` (0.33, 0, 0.12, 1) | 24–36 |
| **Push / pull** | Scope change on its word ("your PC", "follow", "hidden") | `move` (0.65, 0, 0.35, 1) | 26–46 |
| **Lean** | The final carry into the next section | `carry` | runs past the last frame |
| **Dive / surface** | Level change through the Lens (long-form) | `move` | 16 / 14 |

Zoom interpolates in log space; the frame-centre world point and the zoom share one eased progress (a pure zoom keeps its anchor fixed on screen).

### 7.3 Parallax
Screen motion of a layer = factor × deck motion; its zoom = zoom^factor. Factors: deep circuit 0.25, grid 0.6, deck 1.0, room 0.9 (matched to the deck at the Atlas reference shot, so the monitor dollies slightly on push-ins). The 2.5D side swing (§6.4) adds parallax inside the deck.

### 7.4 Speed limits
- Zoom: ≤ ×1.8 per 12 frames at the easing's peak (stricter than the brand's ×2.2; 02's busy dolly broke the feel, not the rule).
- Pan: ≤ 48 screen px/frame at the frame centre.
- No move shorter than 16 frames. At most one move per clause and two per sentence (a carry counts). No roll, no tilt, no shake, no whip, no idle drift.
- A move starts on a landing, in a pause, or on the word that motivates it.

### 7.5 Focus is light, not blur
See §5.3. No depth of field, no live blur, no vignette.

### 7.6 Cut versus carry
- **Default: carry or glide within the one world.** Ep01 has zero cuts.
- **Cut** only in a narration pause, only between unrelated views of the same world, and only when a carry would cross more than two frame widths of unchanged geometry. Allowed at most once per minute in long-form; the new view's focal element moves within 6 frames.
- **Arrival cut** (cut on a landing frame to a closer view, ripple continuing across) is allowed in long-form for a subject that deserves its own shot.

### 7.7 Proof of power
Whenever the always-on block (Ep01: the lookout) is on screen and awake in the present-tense world **at a hold, or as the subject** (a tag, pill, Lens, glow swell or Bit landing on it), the plug seated in its inlet is on screen too, above y 932. During a camera move the plug may leave the frame up to 12 frames before the lookout does (computed for Ep01: K7 12 frames, K8 11; no viewer reads "unpowered" into a frame that is mid-pan). Inside a "later" window, a plate or a what-if band this does not apply (those are not the present). `checkProofOfPower` (`ENGINE.md §16`) applies exactly this rule.

---

## 8. Signals and energy

### 8.1 The Bit v2
- Head: 24 px rounded square (radius 5), `info`, with a soft round glow (round 1; judges: the stepped square halo read as a UI selection box): two pre-baked radial falloffs, r 44 px from 55% and r 92 px from 16% (SVG radial gradients on the Bit only: no filter, no blur; the thumbnails' neon reads as light, not a box).
- **Pixel trail (the B monogram echo):** three squares of 16, 12 and 8 px at 28, 50 and 68 px behind the head along the route (round 1: 14/10/6 were invisible on a phone), opacities 80/55/32%, snapped to a 4 px screen grid so they step like pixels. They shed from the head over the first 4 frames of a run and collapse into it over 6 frames after a landing.
- Route light: the route behind the head lights in `info` and decays over 10 frames, over a soft 3.2× underglow at 22% and (round 2, the thumbnails' neon) a second, 7.5× wide halo step at 8%; **afterglow** (round 1, the thumbnails' glowing paths): the stretch the Bit has travelled stays lit at 30% and fades over 54 frames after the landing (on rails too).
- **The signature landing** (round 1; round 2 sizes): when a hop names its `receiver`, the receiver's own outline ripples outward (grows **52** px, **4** → 1 px, **22** frames) and the Bit sheds its three pixels as the B monogram's burst — squares of **30, 21 and 14** px thrown down-right of the receiver's corner at **(36, 18), (72, 39), (102, 54)** px, drifting **16** px further while they fade over **20** frames (**2**-frame stagger). Round 2 (judges: the signature could not be identified at phone or sheet scale): everything 1.5× and longer. Every landing in every episode looks like this: the channel's mark without a logo. With no receiver, the square ripple (24 → 80 px) plays with the same burst.
- **The Bit's birth** (round 2, the identity moment the judges asked for): wherever a Bit appears at rest (`restFrom`: the hook's cap at f3, the S04 demonstration, the S06 chain), the B monogram's three pixels fly in from down-right (1.4× the burst offsets) and merge into the head over 10 frames while it grows from 30% to full size; a square ripple marks the assembly. The landing burst is the same three pixels thrown back out: the Bit is born from the monogram and returns to it.
- **The signature birth** (round 3; judges: the monogram's pixels were a few px, "nothing at phone size says Bits in Motion"): at an episode's first press (`birth: 'signature'`) the B monogram's three pixels appear at **3.5×** the trail size (56/44/32 px) in the logo's **magenta** with their own neon, laid out down-right of the head as in the logo; they hold, then slide into the head one after another over 8 frames, **turning cyan** as they merge (f3–f21 in Ep01): the logo's pixels become the signal. It is the only magenta outside the "?" (≤ 18 frames, while no "?" is pointed at). Every other birth stays plain. **Round 4:** the birth starts on the press itself (f0–f18; judges: "start the logo's pixels with the press"), its pixels laid out a little shallower ((68, 26), (148, 52), (214, 74) px), so they stay above the caption band now that the hook shows the whole system; and **the bookend**: at the episode's real press the departing Bit re-forms the three magenta pixels in the logo's layout behind it, and they converge into its ordinary trail, shrinking and turning cyan, over 16 frames (`trailSignature`; Ep01 f1838–f1854). The Bit's light gains a third, wide bloom step (r 150 at 7%): the thumbnails' neon, still the Bit's own halo (the glow budget is unchanged).
- **Quiet landings** (round 2; red line 1): a hop marked `quiet` lands without the Bit's soft glow (the crisp head and trail stay). Ep01: the chain's hops onto the processor in plates 4–5, so the CPU never reads as lit, even in the preview; the Bit parks on plate 6's screen, not on a processor.
- Speeds: kit `bitRun` in world px (cruise 24, max 36 px/frame; 4-frame ease-in, linear cruise, 5-frame ease-out; hop ≥ 10, run ≤ 30 frames). The on-screen speed relative to the frame also stays ≤ 36 px/frame (a carry lowers it).
- Landing: the signature landing above + the field's pixel ripple and pulse wave; the receiver reacts on the landing frame (for demonstrations and previews nothing changes but the ripple, the burst and a glow swell when the receiver holds the glow: no state or glyph change, A4).
- Parked (DRIVING): sits on the receiver's anchor, scale 1.00 → 1.10 → 1.00 over 48 frames. Not parked: absorbed into the ripple in 3 frames.
- A run that continues past the end of a section (Ep01 S12, landing two frames after the intro) is carried by the camera, may exceed 30 frames, and uses a 2-frame ease-out so it is visibly cruising on the section's last frame.
- At most 3 on screen; never energy; never decorative; only real routes. Over true-colour visuals it turns `ink`.

### 8.2 Routes
4 px `structure` while idle. "Pointed at" (narrated, not travelling): one tone step to `textMuted` or, for S03's "the wire ends here", `ink` draw-on plus an **end tick** (3 × 14 px) at the true end. Held logic levels (only if narrated): steady `info`.

**Cables (round 2; judges: the button's lead and the board trace read as one line with no end at the header, probe 4):** a route's `cable` range is drawn as a **two-wire lead** (two 2.5 px wires 6 px apart) ending in a small connector seated on the header (16 × 14 px, `bodyHi`), and the rest of the route as a thinner **3 px board trace**. Pointed and ink overlays follow the split; the Bit and its light ride the centre line. The lead visibly plugs into the board, and the board carries the signal on from there.

### 8.3 Energy v2
- **Fill-front:** 50 px/frame from source to load; a 3-step leading edge (8 px each at 66/33/10%), no gradient; ≤ 18 frames on screen, then steady.
- **Shimmer v2:** 48/48 px dashes of `standbyShimmer` over `energyStandby`, 1.5 px/frame toward the load (main rails: `#FFC94D` over `energy`, 3 px/frame). The tests' 90/90 dashes at ≤ 8% lightness were invisible at 390 px in all five. **Round 1:** ΔL* 16.6 (was 10.1), and a live standby channel always shimmers at half strength (it IS live in soft-off: the board's one sign of standby life during holds); while the voice talks about flow it rises to full. The dash phase is locked to f0, so a narrated shimmer never jumps.
- **The trickle** (round 3; judges: on "a small trickle" nothing visibly flowed): a narrated standby flow may run as sparse short dashes of `standbyTrickle` (16 px dash, 56 px gap, 2.6 px/frame toward the load) over the shimmer, inside the 6 px fill: the line never widens or brightens as a whole (red line 8, "thin and small").
- **Drain:** the fill retreats to its source at 50 px/frame (or fades in 8 frames). A drain always follows a visible cause.
- **Empty channel** (main rails in soft-off): walls only, with "Main power: OFF" said by a pill (round 4: one wording everywhere; "Main rails" is retired); on its word the walls step to `textMuted` for 24 frames (pointed at).

### 8.4 Powered-domain wash
`energyWash` fades in over 8 frames under the parts of the domain, clipped to a world polygon. **Over mode (build):** where the domain lies inside a package (Ep01: the lookout's corner of the chipset), the wash is laid over the parts instead, as `energy` at 16 % — exactly `energyWash` on the board — so the domain reads as one warm region (`WashEvent.mode: 'over'`). At 1.37:1 and lighter than the board it needs no boundary; the engine adds the 3 px `annotation` boundary automatically if a future ground breaks the rule. **Round 1 (judges: the stepped polygon read as a UI selection box):** a domain may list `blobs`, rounded rects that follow its parts (Ep01: the lookout, its standby line, the regulator); the wash is then their union at 16% with two stepped outer bands (+13 px at 6%, +26 px at 3.5%), all rounded: a soft warm region with no gradient and no blur. **Round 2:** a domain may list `holes` (world rects the wash leaves untinted: a lit part keeps its own look, so the lookout never "turns amber" in S11; judges: two looks for one awake block) and `outline: true` (a 2 px dashed `energy` line along its polygon, so the powered region reads at a glance and its label can point at the region's edge).

---

## 9. Panels and transitions

### 9.1 When to split (and when not to)
Split only for: **(a) a state comparison** (what if unplugged / switched off), **(b) a sequence of stages** (a chain), **(c) variants** (Intel / AMD / laptop), **(d) time** (a preview of "later"). Never to decorate, never for one idea, never two rows of plates, never more than 6 plates in a row or 3 otherwise.

### 9.2 Plate anatomy (screen px)
- Corner radius 12; ground `deck`; contents are a **view of the same world** (its own camera) or a recomposed mini-scene built from the same icons.
- Rules: **held** = one 3 px `structure` rule; **not now** (a later time or a what-if) = double rule: 3 px outer + 2 px inner at 8 px inset, `annotation`. **Active** is a status on either kind: the outer rule steps to 4 px `ink` over 4 frames (exactly one plate per group; an `annotation` rim on an `annotation` double rule was indistinguishable). A stage that has handed control on shows the D24 **visited** state on its part inside the plate, not on the frame.
- 2.5D: 6 px side thickness (`side`) and a flat shadow offset (0, 14) at 60% `void` while lifted; lift scale 1.02.
- Captions: 44 px Sora 600, ≤ 3 words, inside the top-left at 24 px inset (stops) or centred in the plate's own name area at its bottom (a row), always on the plate's flat ground. Never below the plate over the world. No chips, no "Diagram" labels, no icons in corners.

### 9.3 The peel (signature move)
A plate starts as the exact screen rectangle of its source part, lifts (shadow 0 → 14 px, scale → 1.02 over the first 4 frames) and flies to its slot along a gentle arc in 14 frames (`peel`). During the lift it shows the world exactly as the main camera does, so the part seems to rise off the board. **Round 2, fade-through-ground (judges: cross-dissolves between two drawings double-exposed; two "?" blocks over the desktop as the stops flew home):** the lifted view fades out over flight frames 1–5, the plate flies as an **empty, opaque card**, and its recomposed scene fades in over frames 5–11 on arrival; the return mirrors it (the scene out over 4 frames, the empty card, the world's truth in as it lands, so it vanishes into an exact copy of its source). Two drawings never overlap and no plate is ever translucent over the world. A plate's content never tweens from another machine's layout: the S09 stops show their own layout from their first frame (`ENGINE.md §10.1`). The world under a lifted plate keeps its truth.

**Round 3, the hero carry (judges: plates flew as empty cards; "02-style match moves would carry the subject"; two lookouts and two monitors on screen).** A plate may name its **hero**, the part it is about (`PlateSpec.hero`): from the peel, the world's own part (in the world's state) travels in the card from where the world draws it to where the scene draws it, growing on the way; the rest of the scene gathers round it on arrival (peel +8…+13), and the scene's copy takes over in the same place. While the plate is out, the world keeps a **peeled socket** (the part at 22% with a dashed outline) where the part was; the part rides home in the card and the socket fills as it lands. A plate that shows **another machine** (S09's stops) leaves the world as an **empty card** (`lift: 'card'`), never as a copy of this board.

**Round 4 (judges: plates flew home all at once over the CPU and DIMMs with a doubled "?"; the stops and the fold passed through blank navy cards):**
- **The hero home.** A hero plate does not fly home as a card. Its scene fades out at the slot (0–4), uncovering the hero in the world's state (a preview state eases back to the truth in place), the card dissolves round the hero (4–8), the hero flies home alone on a gentle arc (4–16, `settle`), its peeled socket fills (13–15) and it fades into the world's own part (15–17). While its block is peeled the world's "?" badge is gone, so a "?" is never doubled.
- **Another machine slides.** A plate that shows another machine (`lift: 'slide'`, S09's stops) slides in from the frame's right edge with its whole drawing (14 frames, `arrive`) and slides back out the same way (10 frames, `exit`); its captions, names and tags ride with it. It never crosses this board and is never empty.
- **A sibling copy** (`enterFrom`, `returnInto`): a plate showing the same scene as its twin slides out from **behind** it (12 frames) and back behind it at the end (8 frames), so only the twin carries the part home (S08: Shut down slides out from behind Restart).
- **Take-off:** siblings peel **6** frames apart in reading order (at most two visibly in flight), after the world has already stepped back (a light first scrim step before the first peel, the full scrim as the plates arrive: the plates' own ground keeps the frame above the luma floor). They fly home right to left, **3** frames apart, the subject of the next sentence last (Ep01: the "?" flies home on "hidden").

**Round 1 choreography (judges: six plates launched at once on crossing paths, three from the CPU, and flew home while the camera pushed):**
- every plate peels from **its own part** (Ep01: lookout, power supply, "?", SPI flash, M.2, monitor), never two from one source;
- siblings peel **in narrative order, 5 frames apart** (the peel's motion is mostly in its first 6 frames, so at most two plates visibly move at once), after a slow 36-frame scrim has started (the world steps back first; every frame stays ≥ 31 luma);
- they fly home **in reverse order, 3 frames apart** (12 frames each), and the camera's next move waits until the last plate is home: a return never overlaps a camera move;
- two plates whose sources overlap (S09's stops) return 3 frames apart.

### 9.4 Gutters and the Bit crossing
Gutters are 24 px everywhere. A route crossing a gutter is a 4 px bridge line; the plate rules open a 40 px **port** 4 frames before the Bit reaches the edge and close 6 frames after it leaves. The Bit keeps its speed, halo and pixel trail across the gutter (drawn over the field) and the bridge lights behind it like any route. The active rim moves to the receiving plate on the landing frame.

### 9.5 The Lens
Brand form (thin ring, four ticks, 9-frame open drawn clockwise from 12 o'clock with the view revealed by a wedge that follows the pen, 6-frame close, D24 settle to a 3 px grey rim). Diameter 400 (300–420). **Magnify** shows the same world at ×4–×8 **relative to the surrounding view**, with a 3 px `emphasis` leader at 70% to a 10 px target and a scale chip at 4:30; **x-ray** shows the hidden layer at the same scale. One at a time, at most twice a minute, held ≥ 45 frames. It is the device for enlarging inner blocks; the camera is the device for getting closer to whole parts.

### 9.6 The "later" window (time)
When the story looks ahead **and the world itself shows that later state** (Ep01: the S01–S02 flash-forward; round 4: also the S04 demonstration), the frame contracts in 10 frames (`move`) to a window x 48–1872, y 48–932, radius 16, with the not-now double rule drawn clockwise from the top-left in 8 frames. Outside it only the field shows (grid at 40%). The time chip carries a double underline. Returning to now: the rule fades and the window expands back to the full frame in 10 frames (`settle`), the field takes a time breath, and states revert in place, so the soft-off truth is complete within the pause. The bottom of the window (y 932) coincides with the caption band, which stays quiet. **When only plates preview the future and the world behind stays the present** (S06), there is no window: the plates' double rules and the chip say "not now". A window around a present-tense world contradicted the grammar (critic change C1). **Round 4** (judges: the window framed S01–S02 but not the S04 demonstration, which carries the same chip): a demonstration in the world itself (the S04 signal) is framed by the window too (f438–f519): every "After the press" stretch is either a window (the world shows it) or double-ruled plates (only plates show it).

### 9.7 Split to compare (the triptych)
**Round 2 grammar (judges: the round-1 open and fold were cross-dissolves, the world ghosting through a half-transparent centre band):** the world steps back under a light scrim (15%, 10 frames) while the **centre band lifts as an opaque plate** from the world region its scene stands for (`content.source`) and flies to the centre slot (12 frames, `move`): the lifted world fades out over frames 1–4, the scene fades in over frames 4–10. The side bands (opaque, already showing the scene, not-now double rule) then **slide out from behind it** (frames 8–20, `move`). The fold reverses it: the side bands slide back behind the centre (10 frames), the centre's scene fades out, the world's truth fades in on the empty card, and the card flies home onto its source as the scrim lifts, landing as an exact copy of the world. The main view is never clipped and never dissolved. Bands are 560 px wide with 24 px gutters (x 96–1824), y **184**–920 (round 1: the time chip stays on screen above them, so tense never disappears). The centre band is the present (single rule); the side bands are what-ifs (double rule). Each side band diverges only on its spoken word, with its caption landing on that word, its cause first (plug pulls out, rocker flips), then the drain, then the outcome. Folding back reverses the slide in 12 frames.

**Round 1, the bands show the cause and its effect at band size** (judges: in live copies of the main view the causes were 20 px marks at a band's edge, the wall socket was cropped out and the bands looked identical on a phone). A split may carry `content`: a recomposed scene of the cause-to-effect path (Ep01: wall socket → cord → plug in the inlet → rocker → the standby line → the lookout; same icons and ids as the world, so world events such as the shimmer and the glow reach it) at a band-sized framing (Ep01 ×2.1: the plug 76 px, the rocker 55 × 105, the lookout 151 px). Every band shows it; the centre band cross-fades from the main view to it over opening frames 5–11 and back over the fold's first 6. The centre band states the present's conditions as the voice says them (`centerCaptions`: "Plugged in", "Rear switch on", opposite each what-if's caption) and may carry tags (`centerTags`: "Standby power" continues on the band's standby line). Captions and tags leave 6 frames before the fold, so no moving band ever clips a word.

**Round 4, the carry (judges: the open and the fold passed through blank cards; three supplies overlapped at the fold; the causes were 3–5 px on a phone).** The band scene's parts that are the world's own (`content.carry`: the socket, the cord, the plug, the supply, the lookout, and the standby line between them) are the centre card's content from its first frame to its last. **Open:** the card appears over its source region as the world itself, the rest of the region fades out round the carried parts (1–5), and over 0–12 (`move`) the card grows to the centre slot while each part travels from its place in the world to its place in the band, the supply shortening as it goes (a continuous `length`); the world keeps peeled sockets for them; at +12 the band scene (the same drawing) takes over. **Fold:** the side bands slide back behind the centre **and fade** (0–6); from +4 the carried parts travel home with the card (4–16, `settle`), the card's ground, rule and shadow fade as it arrives (12–16), the sockets fill (16–18) and the parts fade into the world's own (18–20; `FOLD_END` 20). **Causes at band size:** a coral cross on the gap the pulled plug leaves, an ink ring round the rocker as it flips to O, and a band that goes dark dims its drawing to **55 %** (its "Dark", eye and cause marks stay full), so dark against alive reads at thumbnail size.

**Round 3 (judges: the outcome was never named; the bands cut the supply through its fan; the rocker's flip was ~5 px on a phone; the fold flew a large empty card and left a ghost outline over the next tag).** Every band shows the **whole** cause-to-effect path: a short power supply (a schematic shortening at true proportions: inlet, an 81 px rocker, fan, cable exit), a 58 px plug that drops down and away when pulled, and a 90 px lookout carrying **the eye**. In a what-if band the eye **closes** as its lookout goes dark and a one-word outcome, **"Dark"**, lands above it (the eye says which block; the word says what happened). The centre band keeps its eye open and states the present's conditions; it carries no tag (the line was named just before the split, and the budget stays at 12 words). **The fold:** the side bands slide back behind the centre (6 frames), its scene fades out, the empty opaque card flies home onto its source and, as it lands, the world's truth fades in on it while its fill, rule, side and shadow fade together (`FOLD_END` 13): it vanishes into the world itself, with no outline travelling alone. Labels of the next beat land after it (S11's wash on "enough", "Standby-powered" on "motherboard").

### 9.8 Layouts
- **row6:** six plates 268 × 392, gutters 24, x 96–1824, y 352–744; content in the top 264 px with the rail through its centre (y 484); names inside each plate (two 44 px lines from y 628, centred); the world behind under a 45% `void` scrim. Critic's mock-up: the original 248 × 260 row at a 55% scrim gave a mean luma of 26.4, under the floor. This layout gives 30.6.
- **pairRight:** two plates 676 × 360 at x 1100–1776, y 150–510 and 534–894, the world visible on the left. Round 2: each may carry keyed tags inside it (`PlateSpec.tags`, on the plate's flat ground) that name what differs ("In the processor", "Lookout: own chip"). Round 4: they slide in from the right edge and out again (§9.3), and their part names are 44 px answer text ("Chipset", "Battery").
- **pairWide** (round 2): two plates 800 × 548 side by side (x 148–948 and 972–1772, y **198–746**; round 3, was 222–770) over a light (15%) scrim, for a two-way comparison (Ep01 S08: "Restart" | "Shut down"), with the question centred under the gap between them on its own small card (round 3: it sat on the world's power supply and button). Round 4: each plate's outcome hedge is a 44 px caption under its PC on its words ("Can fix", "Might not"; `names` with `tone: 'ink'`), the PC drawn ×0.9 inside a 172 px command sign; the second plate slides out from behind the first and back (§9.3).
- **triptych:** as 9.7.
- **focus + inset:** one plate at 30–40% of the frame width docked beside its source (long-form).

### 9.9 Transition grammar (the complete set)
| # | Transition | Use | Ep01 |
|---|---|---|---|
| T1 | **Carry** (the camera follows the Bit or an analogy arc) | Cause travels to the next region | S01, S04, S07b, S12 |
| T2 | **Glide / push / pull** within the world | Scope or subject change on its word | S03, S04, S07, S08, S09, S10 |
| T3 | **Time window** (contract = later, expand = now) | Flash-forwards where the world itself shows the later state | S01–S02 (S06 previews in plates, no window) |
| T4 | **Peel / return** (match move from part to plate and back; round 2: fade-through-ground) | Sequences, variants and two-way comparisons | S06, S08, S09 |
| T5 | **Split / fold** (triptych; round 2: the centre band lifts as a plate, the side bands slide from behind it) | State comparisons | S10 |
| T6 | **Lens open / settle / close** | Inner blocks; D24 hand-over | S02, S05 |
| T7 | **Lens dive / surface** | Level change | long-form only |
| T8 | **Cut in a pause** | Unrelated view, rarely | none |

Never: dissolves between unrelated scenes, whip pans, glitches, flashes, page curls, zoom blur, logo stingers, wipes.

---

## 10. Typography and labels v2

### 10.1 Type (fonts from the kit: Sora 600/700, JetBrains Mono 500)
| Role | Size | Phone (390 px) | Notes |
|---|---:|---:|---|
| Tag primary / name in a plate / caption | 44 | 8.9 px | Must-read; sentence case; ≤ 3 words, ≤ 22 chars per line |
| State pill | 44 (round 3; was 40) | 8.9 px | Value in caps ("Main power: OFF") |
| Time / scope chip | 52 while it carries meaning, then 44 (round 1: 44 / 34) | 10.6 / 8.9 px | Header zone at (144, 96) only |
| Chip scope line (round 3) | **40** (round 4; was 36), `textMuted` | 8.1 px | Supporting: the scope under the time word ("Intel desktop"); never replaces it |
| Part name in a plate (round 3) | **44** (round 4, answer text; was 36), `textMuted` (or `ink` for a hedge caption) | 8.9 px | An unlabelled shape's name ("Chipset", "Battery"), or a plate's hedge ("Can fix", "Might not") |
| Mono secondary | **40** (round 4; was 34) | 8.1 px | A technical name under a beginner name ("always-on logic" under "Lookout" and "First"; "Intel" under "Main processor"). Round 2: "+5VSB · ATX" left the intro |
| Readout | 64 / 44 (round 1: unit 38) | 13 / 8.9 px | Only numbers the voice says ("0 instructions") |
| Scale chip | **40** (round 4; round 2: 36) | 8.1 px | Supporting only |
| Order mark ("First") | **44** Sora 700 (round 4; was 34) | 8.9 px | Answer text (probe 1) |
| ≈ (vector) | two unboxed waves, 22–34 px wide (round 3; round 2: a 44 × 36 boxed chip) | 4.5–7 px | On the analogy eye only (A6), part of its badge |
| "?" glyph | 0.77 × the badge | 8.1 / 9.4 px | Inside the 52 / 60 px badge (round 1: 44 / 56) |

Never below 30 px. No glow, outline or shadow on text. **Round 4 (style guide §12):** any text meant to be read is at least **40** px (8.1 px on a 390 px phone, `TYPE.supportingMin`), and **answer text is must-read**: text that carries an answer to a probe question is 44 px even when it is a part name inside a plate.

### 10.2 Tag anatomy
Brand keyed tag: 8 px square anchor on the part's top face, 3 px `annotation` leader (40–240 px, at most one 45° or 90° elbow), 4 px key bar in the role colour of the thing named (info cyan, energy amber, standby `energyStandby`, part `ink`), text on a knockout plate.

### 10.3 Knockout plates (ground-aware)
Under each text box the world's **flat fills** (field, case tray, board, part top faces and sides; no strokes, details, routes, vias or dots) are redrawn at the current camera, clipped to the box (radius 8, 10 px padding). It is exact on any ground, including a box that straddles two grounds (the left rail at `openLean` spans field and case tray, where a single sampled colour would read as a card), and it only removes stray linework. Plate names and band captions sit on their plate's flat ground and need none. (Critic change C8; it replaces region-map sampling.)

### 10.4 In and out (absolute frames, t0 = the word's start)
- The group enters as one unit (round 1; judges: a leader stub or a lone anchor showed for up to 6 frames before its text): anchor pops t0−3 → t0 (`arrive`); leader draws t0−3 → t0+1; the key bar grows to full height t0−1 → t0+3; **round 2, the text enters word by word** in reading order (left to right, line by line, also for right-aligned tags): each word fades in and rises 6 px over 4 frames, 1 frame apart, readable by t0+3 (judges: masks exposed half-words such as "Smalle / proce", "by power", "Rear switch c"). Captions, pills, plate names and readouts use the same reveal; no mask ever crosses a word.
- Exit (6 frames, `exit`), also as one unit (round 1): the whole group fades while its text slides 12 px toward the key bar and the leader retracts; nothing is masked, so no half-word ("essor", "irst") is ever readable. Exits happen in a pause or within 6 frames after the next sentence starts, never on a stressed word of their own sentence. Pills enter with their mask and exit with a fade.
- A tag may leave before the hold rule's minimum only with a documented `holdWaiver` (Ep01: the S10 tags when the triptych takes the frame, its centre band naming the standby line again; "Smaller processor" when the flash-forward's Lens closes at f331).
- **Round 3: one thing, one tag.** A tag may carry **steps**: later names of the same thing on the same leader; the old text fades in 3 frames and the new one enters word by word; the layout keeps the widest step, so the key bar and leader never move. **Round 4, one name per object (the glossary):** an object's name is the same in every tag, plate name, pill and caption, and a step renames only on the narration's own renaming word, pre-rolled 3 frames so it is readable on the word (Ep01: "Stays awake" over the subline "always-on logic" on "stays awake", then "Lookout" over the same subline on "lookout"; the subline never changes). Each episode keeps its names in `Videos/<NN Title>/glossary.md`. A leaderless heading may sit on its own small **card** (deck fill, 2 px structure rule) where the world under it is busy ("Why different?" under S08's pair). A tag with no `slot` is placed from intent.
- **Hold:** ≥ 30 + 9 × words frames and ≥ sentence end + 15 frames (`minTagExit`).
- Tags ride with their anchors during camera moves; their text slots interpolate with the move's easing. A tag whose anchor leaves the frame exits before the move.

### 10.5 Chips (time and scope)
One chip at (144, 96). A change is a masked vertical roll: old text out upward in 2 frames, new text in from below from the next frame in 5 (round 1: strictly one after the other; the old 3/5 overlap showed two half-readable labels); the 2 px rule resizes to the new width in 6 frames (`move`). "Later" chips ("After the press") carry a double underline; present-tense chips a single one. 52 px while the chip carries the meaning, then a 6-frame step to 44 px (round 1: 44 / 34 were 8.9 / 6.9 px on a phone). The chip stays on screen through a triptych (the bands start below it).

**Round 4 (judges: the roll clipped the glyphs mid-flip; "Now" read 5 frames late):** a change is a **fade with a short slide**, no mask: the old word fades out rising 10 px (3 frames), the new one fades in rising into place from the old one's last frame (4 frames, `arrive`, readable from its second frame); never two readable words, never a cut glyph. A change that must be readable ON its word starts 3 frames early (Ep01 "Now": f1827 for the word at f1830).

**Round 3 (judges: the chip mixed time and scope, "Intel desktop" replaced "Soft-off" for 6 s, and three phrasings named the press):** the chip says **time only**, from a fixed vocabulary: **After the press** (later: the flash-forward, the S04 demonstration, the chain preview; double underline), **Soft-off** (the present, before the press) and **Now** (the real press). "When pressed" is retired. A **scope** ("Windows desktop", "Intel desktop") is a muted 40 px (round 4; was 36) second line under the rule that never replaces the time word. A beat whose plates show a different time (S08: a later day) **dims** the chip to 40%.

### 10.6 Pills
Capsule, 40 px Sora 600, `deck` fill, 2 px `structure` border, docked 8 px outside the part's top-right corner (or inside the part's body when the outside is crowded, or under it); a value change is a 4-frame flip. Round 2: the capsule wipes in and its words enter one by one. A pill never sits on a route or a header the story depends on (Ep01: "Main power: OFF" right of the supply's vents in S03 and under the supply in S10; round 4: one wording, "Main rails" is retired).
Round 3: pills are 44 px (they were 8 px on a phone at 40).

### 10.7 Budgets (any frame)
≤ 3 tags, ≤ 2 pills, 1 chip, 1 readout, ≤ 12 must-read words (44 px text counts; a chip at 34 px, mono lines, scale chips, "?" and ≈ count 0), 1 emphasis device, ≤ 3 Bits. Plate names, band captions and names inside parts count as words, not as tags.

### 10.8 Placement
Tags sit beside their part on the side away from the motion, in the rails when dense; text boxes keep 16 px from routes and channels, 24 px from other labels, stay inside title-safe and above y 940, never cover the Bit's next 30 frames of path, never rotate. Pills dock top-right; chips live only in the header zone.

---

## 11. Animation principles

### 11.1 Easing presets (`tokens.ts → EASE_BEZIER`)
| Name | cubic-bezier | Use |
|---|---|---|
| arrive | (0.16, 1, 0.30, 1) | entrances, landings, settles |
| move | (0.65, 0, 0.35, 1) | symmetric camera moves, split slides, window contract |
| exit | (0.40, 0, 1, 1) | exits (4–6 frames) |
| carry | (0.45, 0, 0.15, 1) | camera following a Bit |
| glide | (0.33, 0, 0.12, 1) | pause glides |
| peel | (0.20, 0.9, 0.25, 1) | plate lift-and-fly |
| settle | (0.50, 0, 0.20, 1) | plate return, window expand, fold |
| snap | (0.30, 1.35, 0.55, 1) | brackets only (measured overshoot 4.1%) |
| roll | (0.25, 0.8, 0.30, 1) | chip rolls, label mask reveals |
| linear | — | the Bit's cruise, field drift, shimmer |

### 11.2 Durations (frames)
State flip 5 · pill flip 4 · tag in 6 (+3 pre-roll, round 1) · tag out 6 (a group fade) · chip change 3 + 4 (round 4: a fade with a 10 px slide; was a roll 2 + 5) · "?" fill 6 · eye draw 8 · route draw 10 · Lens 9/6/6 · peel 14 · return 12 (round 4: a hero home 17, a slide in 14 / out 10, a sibling out 12 / back 8) · morph 16 · split slide 12 · fold 20 (round 4, the carry) · window 10 · scrim 12 · bracket snap 5 / fade 6 · wash 8 · camera 16 minimum, 24–46 typical · field: pool 18, land ripple 24, press ring 34, pulse wave ≈ 60, time breath 10 (round 1).

### 11.3 Stagger
Plates 3 frames, plates returning 2–3, small sets 4; never more than 5, except a chain row's take-off (round 4: **6** frames, so each plate reads alone and at most two move at once; §9.3). Stagger runs in narrative order (the order the voice will use); a row flies home right to left, the next sentence's subject last.

### 11.4 Overshoot
Only the brackets (≤ 6%). No elastic or bouncy motion on hardware, plates, labels or the camera.

### 11.5 Secondary motion (follow-through, always caused)
A landing brings: the ripple, the field's pixel ripple, the receiver's flip, and at most one label. A peel brings: the lift shadow and the content re-compose. A press brings: the cap's spring-back (contact 3 frames, release frames 6–11) and the press ring. Nothing moves on its own.

### 11.6 Motion budget (per frame)
One **primary** motion (the thing the voice is about), at most two **secondary** motions, plus the living field. A camera move and a Bit run overlap only in a carry. No two cues within 6 frames. Measured with the field switched off (`debug.fieldOff`): the foreground never stays unchanged for more than 45 frames under speech (the tests reached 63–84).

### 11.7 Continuous life without distraction
The field drifts; the always-on part breathes (60 frames, phase-locked to f0); a parked Bit breathes (48 frames); narrated flow shimmers. That is all the idle motion there is: never on unpowered parts, never on labels, never on the camera.

---

## 12. Sound grammar
- **Sound marks causes, not edits.** No sound for camera moves, peels, splits, windows, rolls or the field.
- **Cues (A7 set):** `button` (f0 and f1837 only), `land` (notes A C D E G; a chain steps up the scale), `lens_open`, `lens_close`, `standby` (a span, S10–S11 only), `lock`; `energize`, `dive` and `alert` exist but are unused in the intro.
- **Previews and demonstrations play 4 dB quieter** (`gain_db: -4` in `cues.json`): f0 press, f59, f498 and the S06 chain. The real press at f1837 is the loudest effect (still ≥ 9 dB under the voice's peaks).
- **Timbre ("glass pixel"):** Land = a 70 ms sine bell whose attack adds the 3rd and 5th harmonics (a nod to sine-to-square), body 440–784 Hz so phone speakers carry it; Lens = a 220 ms airy filtered-noise swell and its reverse; Lock = a dry double click 40 ms apart; standby = 55 + 110 Hz sine at −26 dB with a 0.25 Hz ±1 dB swell, fading out within 1 s of the span's end; button = a plain-named library momentary click, plus a 90 Hz body at f1837 only.
- **Music:** one licence-clean bed (Pixabay or CC BY with credit, never Epidemic or the excluded packs), dark ambient pulse, A minor / C major, no melody under speech, 19.5 LU under the voice in the loudest-music sentence, steady (no ducking), no silent tail.
- **Loudness:** −14 LUFS integrated (±0.5), true peak ≤ −1 dBTP; effects under voice peaks; densest at one brand cue per sentence on average. Nobody on this pipeline can listen: the owner auditions.

---

## 13. Layout and phone legibility

### 13.1 Zones
Graphics-safe x 96–1824, y 54–1026; title-safe x 144–1776, y 96–940; header zone x 144–948, y 96–196 (the chip only); top-right keep-out x > 1560, y < 196; **caption band y 940–1080 at a hold: no label, Bit, route, channel, plate or part top face; only grounds (field, case tray, board) and the dark 2.5D side faces may enter it** (everything with meaning stays above y 932). Computed for all ten Ep01 shots. The stricter "only the field" is impossible in any close-up that includes the monitor, so the designer's own `monitor` shot broke it. This version protects what captions would cover.

### 13.2 Phone rules at 390 px wide (scale 0.2031)
| Item | Minimum at 1920 | On the phone |
|---|---:|---:|
| Must-read text | 44 px | 8.9 px |
| Supporting text (round 4; was 34) | 40 px | 8.1 px |
| Answer text (round 4: a probe's answer, even a part name in a plate) | 44 px | 8.9 px |
| A part the voice names or acts on | 80 px longer and 40 px shorter side; or ≥ 160 px in a Lens/plate; or lit/badged | 16 × 8 px / 32 px |
| Context parts | 30 px | 6 px |
| "?" badge | 44 px (56 when it is the subject) | 8.9 / 11.4 px |
| Eye badge | 48–96 px wide (96 in a Lens) | 9.8–19.5 px |
| The Bit / its halo | 24 / 64 px | 4.9 / 13 px |
| Meaningful line | 3 px at ≥ 5:1 | survives a 480p encode at ≥ 3:1 |
| Text on its plate | ≥ 7:1 | — |

### 13.3 How it is checked
Every sentence's key frame and every anchor are rendered with `tools/stills.mjs --phone --luma`, read at 390 px from the 1080p frames and from a local 480p encode, and the line contrast of idle outlines is sampled at 480p (target ≥ 3:1).

---

## 14. Time grammar (A4, staged the Signal Atlas way)

| Span | Frames | Truth on screen | Device |
|---|---|---|---|
| Flash-forward | f0–f326 | After a press: the lookout reacts, the "?" works, the CPU stays dark | "Later" window (contracts f2–f12) + chip **"After the press"** (44 px, double underline) by f8 |
| Return | f327–f346 | Soft-off: lookout ON breathing, "?" dim with its badge, CPU dark, main power OFF | Window expands f327–f337, states revert in place, chip rolls to **"Soft-off"** (52 px) by f340; complete by f346. Never "Before the press". |
| Demonstration | f436–f519 | A described signal: Bit button → lookout, no cap travel, no click, no state change | Chip **"After the press"** (double underline; round 3: "When pressed" retired, one word for every look ahead); round 4: the "later" window frames it (contracts f438, expands f519) |
| Present | f519–f716, f914–f1829 | Soft-off | Chip **"Soft-off"** (44 px at rest), dimmed to 40% while S08's plates show a later day (f1097–f1251); round 3: the scope is a muted second line under it, **"Windows desktop"** (f1279) then **"Intel desktop"** (f1321), cleared as the stops fly home (f1452); the chip stays on screen through the triptych |
| Preview | f712–f913 | The chain after a press, in plates; the world stays soft-off | Plates with the not-now double rule + chip **"After the press"** again (no window: the world behind is the present); names fade and plates return f914–f936 |
| The real press | f1830–f1889 | Now: cap travels at f1837, Bit departs f1838 (round 4: re-forming the logo's three pixels behind it), still travelling at f1889 | Chip **"Now"** (52 px), its change from f1827 so it is readable on "Now" (f1830) |

The cap moves only on f0 and f1837.

---

## 15. Long-form reuse: an episode is data

**Folder per episode** (`src/styles/style6/epNN/`): `world.ts` (parts from the icon registry with world rects, routes, channels, domains; grounds are derived from the parts), `shots.ts` (named framings), `script.ts` (events anchored to word IDs), `cues.json` (derived and checked), plus any new icons in `src/icons/`. `Intro.tsx` / `Chapter.tsx` is ~20 lines: `<Atlas world shots script />`.

**Authoring an event** is one line (`ENGINE.md §14`), e.g. `bit('s04', {scope: 'world', kind: 'demo', hops: [{route: 'pwrbtn', depart: w('W0047'), land: w('W0050')}]})`, `tag('lookoutTag', 'Always-on logic', {anchor: 'chipset.block:lookout.left', slot: {chip: [560, 400], board: [300, 540]}, role: 'part', word: 'W0050', exitAt: 'hold'})`, `cam('chip', {at: w('W0047', -2), dur: 40, ease: 'carry', carry: 's04'})`. The engine derives cue frames, label exits (hold rule), budgets and checks. **Round 1:** an episode's script never types a frame: every time is a word (`w`, `wEnd`), a sentence (`sentence`), a pause or a shared deadline (`A4`), plus a small offset; `node src/styles/style6/lint-times.mjs` fails on a bare frame in any time field. `src/styles/style6/epXX_template/` is the starting folder (world, shots, script, a 10-line chapter) and `ENGINE_NOTES.md` "Episode workflow" lists the steps.

**Round 2, intent instead of pixels (production):** `shots.ts` may say what a framing shows — `frameParts(WORLD, ['button', 'fpHeader', 'psu', 'plug'])` fits those parts in the meaning area (title-safe, under the chip, above the caption band) — and a tag may take `slot: 'auto'`: at its landing frame the engine tries six positions round its anchor, keeps those inside title-safe and away from the chip, picks the one covering the least part area, and the tag then rides with its anchor. The reusable devices are data: a two-way comparison is two `pairWide` plates with scene content and scoped glyphs (S08), variants are `pairRight` plates with inner tags (S09), a chain is a `row6` with ghost names (S06), a what-if is a triptych with a `source` region (S10). `epXX_template/` uses `frameParts` and `'auto'` and renders as the dev composition `SignalAtlasTemplate` with no check warnings.

**Round 3, devices as one call (production; judges: "every plate is a hand-composed scene", "time a real section from the template"):** `sceneFrom(WORLD, picks, {id})` cuts a plate scene from the world (parts, or blocks lifted out as standalone parts, with prop and state overrides), so a world change carries into its plates; `stageShot(scene, part, px)` frames a stage; `chainRow({stages, peelAt, backAt, lands, restFrom})` returns a whole sequence (row6 plates carrying their heroes, ghost names, the active rim, the rail and the parked chain Bit with its quiet stages). A tag with no `slot` is placed from intent. Ep01's chain is one call (it was ~40 lines); the template renders a three-stage chain cut from its world in ~15 lines. Measured cost: Ep01's 63 s of the densest part of the episode is 870 lines of data (script 542, scenes 188, world 83, shots 47, icons 10), about 14 lines per second of finished intro, most of it timing; a narrated chapter reuses its world and scenes. No Ep02 section could be timed: Ep02 has no recorded narration or word timings yet.

**Round 4, file naming (style guide §13.8):** an episode's code lives in `src/styles/style6/epNN/`; its compositions are `SignalAtlasEpNN` (intro), `SignalAtlasEpNNChK` (chapter K), `SignalAtlasEpNNCues` and `SignalAtlasEpNNFieldOff` (`episodeIds('NN')` in `src/entries/style6.tsx`; Ep01 also keeps its first ids, `SignalAtlas`…); working renders and QA go to `remotion/out/style6/epNN/` (`epNN_muted.mp4`, `qa/`, `phone/`, `bursts/`), the mix to `audio_build/mix/epNN_*`, the episode's notes and glossary to `Videos/<NN Title>/`. The measuring tool is `tools/measure.py` (moved from an output folder).

**Rhythm for 10–12 minutes:** return to the master shot of the world at least every 90 s; one Lens per 30 s at most; panels at most once per chapter section (≈ 2 min); one plate row per chapter; chapter boundaries use the brand's sine-to-square chapter step on a slim rail (long-form only); a carry or glide at least every 20 s so the camera never sits for a minute.

**New topics:** a new world per topic (router-room for Wi-Fi, GPU board for AI, CPU die for "30% and slow", NAND cell for SSDs) built from the icon registry; target ≤ 1.5 build-days per new world and ≤ 0.5 per chapter of script (Stage A estimated 2–3 per map without the engine). Icons needed for the planned topics are specified in `ICONS.md §6`; round 2 seeded the next two scripted episodes' core parts (Ep02 Wi-Fi: `router`, `antenna`, `phone`, `rfChip`; Ep03 AI: `gpuPackage`, `hbmStack`), shown on the icon gallery's "seeded topics" page.

---

## 16. Do and don't

**Do**
- Start every episode on the world in its true state, rhyming with the thumbnail (big dark processor, small lit block, the cyan path, a black screen).
- Let the light say who is awake before a label says it.
- Carry the camera with the cause; glide in pauses; hold while labels are read.
- Peel a plate from its real part, compare, and settle it back.
- Land every name on its word; keep three tags at most; give each object one name everywhere (a technical name only as a mono subline).
- Keep the plug in frame whenever the always-on block is shown awake.
- Keep the caption band to the field at holds.
- Make previews and what-ifs visibly "not now" (double rule).

**Don't**
- Cut between views of the same world; whip, shake, tilt or drift the camera.
- Add glow beyond the Bit and one narrated part; glow text; use gradients, vignettes, blur or particles.
- Use a panel for a single idea, two rows of plates, or UI chrome ("Diagram" chips, tab bars, consoles, corner brackets framing the screen, snake_case); fly a card with nothing in it.
- Move anything without a cause; animate unpowered parts; let the field react to energy.
- Light the CPU, name the "?", put wattage on screen, or label soft-off "Sleep" or "Standby mode".
- Show a logo, wordmark, channel name, title card or captured OS UI.
- Copy reference signatures (a drawing hand, red/black gloss labels, OS desktops and HUDs, stick-figure hosts, a push-in on every still).

---

## 17. Brand evolutions (A5) and their reasons
Each change keeps every role meaning; accuracy rules are untouched.

| Rule | Was | Now | Reason |
|---|---|---|---|
| Dark grounds | surface `#05070F`, panel `#0E121B`, board `#161C29` | field `#0F1729`, deck `#15203A`, board `#1A2742`, plus body tones | Luma floor 28 with a navy-black look; 05's stock grounds sat at 15–25 |
| Inactive outline | `#626C81` (3.23:1 on board) | `#8F9CB5` (5.37:1) | 02's outlines fell to 2.4–3.0:1 at 480p (clarity, phone) |
| Muted / annotation | `#8A93A6` / `#A9B4C9` | `#AEB8CB` / `#C3CCDD` | Keep ≥ 7:1 / 9:1 on the lifted grounds |
| Unpowered bodies | panel fill or none | gunmetal top faces + 2.5D sides + rim light | Phone legibility (filled silhouettes read at 390 px) and the thumbnails' hardware look |
| Glow budget | Bit + one active part | unchanged; plus a rim light that is material, not light | Premium 2.5D without implying power |
| Background | flat, no texture | the living field (§5) | Owner's note; 68–77% static frames in the tests |
| Camera | locked by default | carries and glides per §7; still no idle drift of the deck | Flow; 02's carry was its best move |
| Zoom cap | ×2.2 / 12 frames | ×1.8 / 12 frames | Calmer moves; 02's dolly read as busy |
| State pip | 12 px | 14 px | Phone |
| "?" badge | 36 px | 44 px (56 when subject) | "The '?' at true scale is tiny on a phone" (all tests) |
| Shimmer | 90/90 dashes, ≤ 8% lightness, 1 px/frame | 48/48, ΔL* 10, 1.5 px/frame | Invisible at 390 px in all five tests |
| Bit trail | 4 squares 18/14/11/8 every 30 px | 3 squares 14/10/6 at 26/46/62 px, 4 px snap | Brand: echoes the B monogram's pixel trail |
| Lens d | 360 | 400 | Room for the ×4 lookout with its feeds |
| Labels' plate | surface at 90% | the world's own flat fills, clipped to the text box (critic C8) | On a lifted dark world a surface plate reads as a card; a single sampled colour does too where a box straddles two grounds |
| Time device | per style | the "later" window (double rule) | One grammar for time and what-ifs (double rule = not now) |
| Previews' sound | same level | −4 dB | 05's rule: described and previewed events quieter than real ones |

---

## 18. How this reaches 9+ on each criterion (and the checks that prove it)

| Criterion | What earns it | Proof |
|---|---|---|
| Explanatory clarity | One world, light-as-state, the Lens on both blocks, the triptych for probe 2, the end tick for probe 4, AMD/laptop scene tweens at full block size for probe 5, plate names inside the plates | The five probes answered from stills at 390 px |
| Technical accuracy | Guardrails unchanged; CPU never lit (plates included); plug-in-frame rule; stops show only real differences (AMD keeps a plain chipset; the laptop's "?" moves into the SoC and never vanishes) | Red-line table checked on every anchor ±2 |
| Visual craftsmanship | Machined 2.5D icons, consistent lines, a living field that also lights the board, exact knockouts, nothing meaningful in the caption band | Full-size and 390 px stills; luma ≥ 28 every frame; 480p line contrast ≥ 3:1 |
| Timing | All anchors ±1, tags ±3, no foreground hold > 45 frames under speech | anchors check, label sync table, field-off still-run measurement |
| Brand recognition | Thumbnail palette and lens, Bit with the monogram's pixel trail, ownable moves (peel, triptych, later window, pixel ripples) | Side-by-side with the thumbnails |
| Long-form suitability | Persistent worlds, calm budgets, chapter rhythm (§15) | — |
| Repeatable production | Engine + icon registry + word-anchored script; intro folder mostly data | Line counts: engine and icons shared; style6 intro ≤ 1,200 lines including data |

---

## 19. Critic changes (10 October 2026)

A stress test of this design before anything is built. **How it was checked:** I read all four style6 documents, `tokens.ts`, the production prompt, the Quality Report (with what the judges penalised) and the comparison sheet. I looked at frames I extracted from the 02, 03 and 05 finals (02 f800, f1290, f1600; 03 f560, f1400, f1770; 05 f860, f1440, f1650). Then I **computed** the storyboard's geometry: every shot and camera key projected with the bible's formulas, including the 2.5D sides and the 0.9 room parallax; caption-band, proof-of-power and phone sizes; zoom and pan peaks; and mean luma from fills-only mock-ups of the key framings. Nothing of style6 has been rendered yet, nobody watched motion and nobody listened. The scripts and their output are in `remotion/out/style6/critic/` (run `python -I final_check.py` from that folder). The mock-ups draw fills, sides and outlines only, so their luma is a slight lower bound. They reproduce the designer's 30.6–38.1 range for the plain shots, which calibrates them.

### 19.1 Predicted scores (1–10)

"Realistic" means one strong builder agent in about 2–3 hours, with the engine and the icon library built in parallel by two other agents.

| Criterion (Stage A weight) | Before: perfect | Before: realistic | After: perfect | After: realistic |
|---|---:|---:|---:|---:|
| Explanatory clarity (×3) | 9 | 7 | 9 | 8 |
| Technical accuracy (×2) | 8 | 8 | 9 | 9 |
| Visual craftsmanship (×2) | 8 | 6 | 9 | 7 |
| Timing (×1) | 9 | 7 | 9 | 8 |
| Brand recognition (×1.5) | 8 | 7 | 9 | 8 |
| Long-form suitability (×1.5) | 9 | 7 | 9 | 8 |
| Repeatable production (×1.5) | 8 | 6 | 9 | 7 |
| **Plain mean / weighted** | **8.43 / 8.44** | **6.86 / 6.88** | **9.00 / 9.00** | **7.86 / 7.88** |

**Why "before, perfect" missed 9:**
- **Accuracy:** the AMD chipset faded away, which claims AMD boards have none. The laptop's "?" vanished, which claims laptops have no hidden processor.
- **Craft:**
  - S06 at the specified 55% scrim mocks at **26.4** mean luma, under the floor. The designer's fallback of 45% only reaches 28.1.
  - The `monitor` hold put the chipset and front-panel header in the caption band for 4.6 s.
  - The pills covered the PSU fan (03's penalised fault).
  - A single sampled knockout colour reads as a card wherever a label straddles two grounds, as every left-rail label does at `openLean`.
- **Brand:** the field's ownable reactions (pixel ripples, the light pool) sat behind the opaque case at most framings, so viewers would hardly see them.
- **Production:** the engine scope was too large for parallel 2–3 h builds: three-level LOD with hysteresis, morphs coded inside icons, region maps, an authored focus track and a per-frame motion classifier.

**Why "after, realistic" is still under 9:** nothing on paper removes the cost of polish and integration in one sprint. Reaching 9 needs the milestone build of `ENGINE.md §19` plus two repair cycles (about 5–6 agent-hours in all), then the owner's real-time watch and listen.

### 19.2 Changes made (all mirrored in `STORYBOARD.md`, `ENGINE.md`, `ICONS.md`, `tokens.ts` and prompt 06)

| # | Gap (how found) | Change |
|---|---|---|
| C1 | **S06 time grammar and luma** (read and computed). The "later" window framed a world that stays in the present. With 248 × 260 plates and the names below them over a scrimmed world, the frame mocks at 26.4. | No window in S06: the plates' double rules and the chip say "not now". Row6 is now 268 × 392 (x 96–1824, y 352–744), with the rail at y 484, names inside the plates and a 45% scrim. Mock: 30.6. Hops are 292 px at 33.7 px/frame. p1 is centred on the lookout and p3 is ×2.6 (the "?" at 166 px). |
| C2 | **`monitor` shot** (computed). Parts sat in the caption band for the whole hold, and K7 peaked at exactly the 48 px/frame cap. The fork was drawn in screen px while the camera moved. | `monitor` = (1560, 360, ×1.5). The SPI flash moved to (914, 470). K7 is f1066–f1118 (44 px/frame). The fork sits on the room plane so it rides with the monitor; the chips and "Why different?" were re-laid over the field. Mock luma: 29.4. |
| C3 | **Caption-band rule** (computed). "Only the field below y 940" is impossible in a monitor close-up, and the 2.5D sides crossed it at six shots. | At holds: no label, Bit, route, channel, plate or part top face below y 932. Grounds and dark side faces may enter. All ten shots pass. |
| C4 | **Proof of power** (computed). Mid-move, K7 and K8 show the lookout without the plug for 12 and 11 frames. | Applies at holds and on lookout-subject frames, with a 12-frame move grace (`CAMERA.proofOfPowerMoveGrace`). |
| C5 | **"The background is very static"** (computed). At most framings the case hides the field's pool and ripples. A landing ripple on the lookout never reaches past the case. | Board vias (L3): the same pool, land and press reactions on the board, invisible at rest. The field drifts in whole-pixel steps (crisp, encoder-friendly). Dots are now 4 px. The frozen-frame check is now "no identical run longer than 6". |
| C6 | **Stop accuracy and production** (read against the guardrails). The morphs were coded inside icons, the EC chip (56 × 44) could not hold the lookout (72 × 36), and the AMD blocks shrank to 0.7. | Generic `tweenScene` (two SceneSpecs per stop, reusable for any vendor or form-factor stop), with blocks at scale 1. AMD: blocks go into a 100 × 132 I/O die; the chipset stays as a plain package. Laptop: the lookout goes to a 104 × 72 EC and the "?" to the SoC; the separate chipset fades. |
| C7 | **Triptych legibility** (computed). At `column` ×1.30 the pulled plug fell 24 px outside its band, and the rocker's I/O marks were detail-level. | `column` = (524, 760, ×1.22): the plug clears the band by 14 px and the lookout by 26 px (its pip docks inside). The rocker is 26 × 50 with 3 px I/O marks in the base drawing. The main view is clipped to the centre band (luma 31.8). |
| C8 | **Label plates** (read). | The knockout redraws the world's flat fills, clipped to the text box. It is exact on any ground and never reads as a card. |
| C9 | **LOD complexity** (read). | One `detail` opacity (136 → 176 px), a pure function of the frame, with no levels, hysteresis or crossfades. Anything meaningful is base, never detail. |
| C10 | **Over-ambitious parallel build** (read). | `ENGINE.md §19` milestones M0–M3, a placeholder for every icon type, an icon build priority, an ordered drop list, interface ownership and kit reuse. Lens x-ray, dive and surface are deferred (types kept). Focus is derived, not authored. The motion classifier is replaced by `motionGapReport`. |
| C11 | **Storyboard elements with no API** (read and mapped). | Added `LensSpec.leaderAt`; the "?" badge at 72 px in a Lens; RouteEvent `range`/`draw`/`settle` and `RouteSpec.hidden`; `PlateRowSpec` and the `{row}` scope; the plate active status and part-level visited; content during the peel; Split clipping; `WindowSpec.ruleAt`; the glow `swellAt`; the arc's `chipAt`; the card's room-plane rect; precedence of explicit timing over the carry formula. `regions` is now optional. |
| C12 | **Smaller craft and phone fixes** (computed). | 2.5D perspective 0.5 → 0.25 (no side flips during pans). The power button is r 36 (83 px when named; it was 69). "Power / supply" is a two-line name right of the fan, and "Main rails: OFF" docks under the PSU. The active plate is a 4 px `ink` outer rule. Gutters are 24 px with bridges. The stop plates release the active rim at f1438. "Sign-in / screen" is two lines inside title-safe. Moves: one per clause, two per sentence. Phone rule restated to what the frames rely on: 80 × 40 px when named, or a Lens or plate, or lit or badged. |

### 19.3 Computed results after the changes

- **Mean luma (fills-only, before labels):**
  - shots 29.4–36.6;
  - S06 30.6;
  - triptych 31.8;
  - S09 pair 34.9.
- **Camera peaks (all under ×1.8 per 12 frames and 48 px/frame):**
  - K1 ×1.02 / 4 px;
  - K2 ×1.16 / 18;
  - K3 ×1.18 / 18;
  - K4 ×1.43 / 35;
  - K5 ×1.45 / 35;
  - K6 ×1.34 / 37;
  - K7 ×1.16 / 44;
  - K8 ×1.33 / 40;
  - K9 ×1.20 / 42;
  - K10 ×1.21 / 6.
- **f1889:** centre (611, 733), zoom 1.86, the plug in frame.
- **Phone, when named:**
  - the button is 16.8 px or more wide;
  - the lookout is 17 × 8 px in the wide shots (a lit block), 26 × 13 px at `chip` and 64 px in Lens #2 (317 px on the 1080p frame).

### 19.4 Risks that remain (no document can close them)

1. Nobody has watched the motion or heard the cues. The owner must judge the busyness of the field, vias, sides and peels, whether the standby shimmer reads (on a phone the channel is 2 px wide), and the sound.
2. YouTube's encoding of the dark field and of 30%-opacity vias is untested. Make a private test upload of the first render.
3. The lookout and the stops' blocks stay small in wide shots by design (about 14–17 px wide on a phone); the Lens, the plates and light carry them.
4. Parallel integration can still slip. Hold to the milestones and the drop order rather than cutting a probe device.
5. A dark tech look is common. Ownership rests on the pixel language (the Bit's trail, square ripples, stepped drift, vias) and on the palette staying identical across thumbnails, the intro and long-form.

---

## 20. Round 1 (judges' review, 10 October 2026)

Three judges scored the first build 8.29 (clarity 8.3, accuracy 8.8, craft 8.3, timing 8.3, brand 7.8, long-form 8.5, production 8.0). This section records what changed in response; the sections above now state the new rules, each marked "round 1". Nothing here changes A3 (the excerpt, 1,890 frames, no logo or title card), A4 (every anchor lands on its frame; `node tools/anchors.mjs` passes) or A6 (accuracy).

### 20.1 What changed, by issue

| Issue (judges) | Change | Sections |
|---|---|---|
| Triptych causes tiny and cropped; centre band never showed the present's conditions (all three) | Every band shows a recomposed cause-to-effect scene at ×2.1 (socket, cord, plug, rocker, the standby line, the lookout); the plug pulls out with a visible gap and the inlet's pins, the rocker flips I → O, the line drains, the lookout goes dark. The centre band says "Plugged in" and "Rear switch on" on the words that say them, opposite "Unplugged" and "Rear switch off", and keeps the "Standby power" tag on its line. | §9.7 |
| Plate fly-out and collapse tangled; returns during a camera push (all three) | Each plate peels from its own part, in chain order, 5 frames apart, after a slow scrim; they fly home in reverse order, 3 frames apart; the camera waits. | §9.3 |
| Background still static (all three) | Current pulses on the deep traces (idle, and a wave from every press and landing); faster whole-pixel drift; brighter grid, pool and vias; bigger, longer press and land rings; a live standby line that always shimmers. Measured on the round-1 MP4 against round 0: the longest run of frames with < 0.3% of pixels changing at 854 × 480 fell from 48 frames to 3; such frames fell from 53% to 41%; the median changed area per frame rose from 0.25% to 0.71%; minimum mean luma 29.4 (f921), no frame under 28. | §5, §8.3 |
| S08 a half-empty monitor shot; the difference not drawn (all three) | `promise` framing: the whole PC with its black screen; "Restart" draws a closed loop that spins on "fix"; "Shut down" (IEC "off" ring, not the button's symbol) steps down to "off" and, on "starting again", back up; "Why different?" heads both. | STORYBOARD B17–B19 |
| Brand generic; no signature (all three) | The signature landing: the receiver's outline ripples and the Bit sheds the B monogram's three pixels; the Bit glows (radial falloff); every path the Bit takes stays lit for 1.8 s (the thumbnails' glowing paths). | §8.1 |
| Stop plates into S10 (two) | They fly home on the first frame their captions' hold allows (f1439), 3 frames apart; the camera glides to the standby path after them and settles for "standby". | STORYBOARD B21–B22 |
| Chain icons identical; plate 3 unnamed; content seams (two) | Recomposed scenes on the plate ground; plates 4–6 make the differing part the hero (the SPI flash, the M.2, the dashed sign-in card that draws on at "takes control"); plate 3 is "Smaller processor" (S02's words). | STORYBOARD B13–B15 |
| Bright "?" fill in soft-off (accuracy) | The D24 fill (A4 f671) and the S07 pointer are a dim tint with a dashed ring: the "?" never becomes the brightest object while it is off (red line 7). | §6.7 |
| Magenta reused (accuracy) | Brackets and the lookout's Lens are `ink`; magenta is the "?"'s alone. | §4.2 |
| Hard-edged glows and washes | The Bit's halo and the domain wash are soft (radial falloff on the Bit; rounded blobs with stepped bands for the wash). | §8.1, §8.4 |
| "Smaller processor" never named (one) | A leaderless tag under the S02 Lens on "smaller". | STORYBOARD B04 |
| Orphans, leader stubs, clipped half-words; two chip labels at once | Tags enter and exit as one group, fading; pills fade out; the chip rolls strictly; band captions leave before the fold; the readout leaves with the S01 tags. | §10.4, §10.5 |
| Invisible hook press | Two ink rings leave the button on "Press", the Bit appears on the cap at f3, and the camera pushes ×1.04 about the button. | STORYBOARD B01 |
| No payoff at the receiver | The receiver's ripple and burst, and a glow swell, on f59 and f498 (A4's "ripple only": no state or glyph change). | §8.1 |
| Pips that never change read as artefacts | No pip on the CPU or the "?". | §6.5 |
| Phone legibility | Chip 52/44 px, readout unit 44, "?" badge 52/60, wake glyphs 80, Bit trail 16/12/8. | §6.7, §10.1 |
| Wake sources small, the clock inside the chipset | 80 px glyphs; the clock badge outside the chipset with its own route into the lookout; the lookout's eye returns on "notice". | STORYBOARD B26 |
| Absolute frames in the script (production) | Every time derives from the narration; `lint-times.mjs` enforces it; `epXX_template/` and ENGINE_NOTES "Episode workflow". | §15 |

### 20.2 Brand evolutions (A5) added in round 1

| Rule | Was | Now | Reason |
|---|---|---|---|
| Emphasis colour | Lens ring, brackets and "?" in magenta | magenta = the "?" (badge, pointer, the Lens on the "?"); brackets and other Lens rings `ink` | Magenta brackets on the button tied it to the "?" |
| "?" fill | solid emphasis | a dim tint and a dashed pointer ring | Red line 7: the "?" stays dim in soft-off |
| The Bit's halo | stepped squares 40/64 px | two radial falloffs (r 44 / 92) | Read as a selection box; the thumbnails' neon is soft light |
| Route light | 10-frame decay | plus a 54-frame dim afterglow and a soft underglow | The thumbnails' glowing paths; beginners keep the path in view |
| Background motion | drift + reactions only | plus current pulses on the far traces | "The background is very static" |
| Shimmer | only while narrated | half strength whenever the standby line is live | The one sign of standby life during holds |
| Time chip | 44 / 34 px | 52 / 44 px | Phone |

### 20.3 Deviations kept on purpose

- **Hold-rule waivers (A5 "holds until 0.5 s after its sentence"):** "Standby power" and "Power supply" leave at f1595 when the triptych takes the frame (the centre band names the standby line again until f1673); "Smaller processor" leaves with Lens #1 at f331. Each carries a `holdWaiver` the checks report.
- **"Stop: laptops"** reads 31 frames (f1408–f1439) before the plates fly home: it meets "0.5 s after its sentence" (f1439) but not the kit's 30 + 9 × words reading minimum (48). Keeping the stops into S10 cost more (two judges).
- **The triptych's standby line** leaves the power supply just behind its rear face (in the world it leaves at the cable exit and runs through the 24-pin and the regulator): a recomposed scene may shorten a route, never change what connects to what (§6.1).
- **Plate 6** shows the dashed sign-in card (an analogy, as in S07) under the CPU; no screen lights.

### 20.4 What remains (not fixable in this round, or not without breaking a rule)

- The margins stay navy (`field` #0F1729), not the thumbnails' near-black: darkening them drops the darkest frames under the 28 luma floor (round 1 minimum 29.4 at f921).
- A logo ident or end sting is ruled out by A3; the signature landing carries the channel's mark instead.
- At the strictest test (480 × 270, < 0.05% of pixels changing by > 12 levels) about half the frames (49%) still count as still: the field's motion is deliberately low-contrast, and the foreground holds while labels are read. The longest such run is now 44 frames (f213–f256, under Lens #1; was 51), inside the 45-frame rule; every run of 40+ frames sits under a Lens or the first held tags (f96–f137, f213–f256).
- Nobody has watched the motion in real time or listened; every check here is frame inspection and measurement.


---

## 21. Round 2 (judges' review of round 1, 10 October 2026)

Three judges scored round 1 at a mean of 8.33 (clarity 8.3, accuracy 8.7, craft 8.3, timing 8.3, brand 8.0, long-form 8.5, production 8.2). This section records what changed; the sections above state the new rules, each marked "round 2", and `tokens.ts` carries every new value. Nothing here changes A3 (the excerpt, 1,890 frames, no logo or title card), A4 (every anchor lands on its frame; `node tools/anchors.mjs` passes) or A6 (accuracy); `cues.json` is unchanged (the derived cue list still matches it).

### 21.1 What changed, by issue

| Issue (judges) | Change | Where |
|---|---|---|
| S08 was the weakest beat: tiny abstract glyphs beside a small PC, a 52-frame still (all three) | **Twin plates** "Restart" \| "Shut down" (`pairWide`, not-now) peel from the monitor, each with the same running PC (a monitor with a generic desktop) and a coral problem mark. Restart: a big loop sweeps round the PC (its screen blinks off and back) and on "fix" the problem clears. Shut down: a big power symbol draws round it, the PC goes dark on "down" and returns on "starting again", and on "might not" the problem is still there and pulses. "Why different?" sits under both. Only the outcome differs; no mechanism is shown (guardrails S08). | §9.8, STORYBOARD §15 |
| S09 stops: readable 0.7–1.5 s, unlabelled, the laptop plate born as a copy of the desktop (an ATX PSU and a chipset lookout under "Stop: laptops", a must-not) and dissolving into it (all three) | Each stop shows **its own machine from its first frame** (no tween): AMD = one package holding both blocks, with AMD's own chipset (a finned lid, never the Intel drawing); laptop = SoC with the "?", the lookout in its own EC chip, a battery. Both peel together on "stops" and hold until "lookout" (+5); each names its difference inside the plate ("In the processor", "Lookout: own chip") and carries the lookout's eye. | §9.8 |
| Cross-dissolves double-exposed (triptych open and fold, stop morphs, peel) (two) | **Fade-through-ground** for every plate; the triptych's centre band lifts as an opaque plate and the side bands slide from behind it; nothing is ever translucent over the world. | §9.3, §9.7 |
| "The background is very static" (the owner; J2) | Brighter, longer, more frequent current pulses; landings and presses send frame-crossing waves (bigger bands, higher gains); the light pool breathes ±12% over 8 s; the lit route has a second halo step. Measured: near-static frames (480 × 270, < 0.05% of pixels changing by > 12) 49.8% → 41.8%; the median changed area doubled. | §5.4, §8.1 |
| No ownable signature; f0 a wide generic blueprint (all three) | **The hook:** f0 opens ×1.6 tighter on the button and its lead (130 px), the plug seated at the left edge, the lit lookout above; the press sends a bigger ring; the **Bit is born** from the B monogram's three pixels on the cap (f3–f13); K1 glides out over the board as it leaves. Every landing's burst is 1.5× and longer. | §8.1, STORYBOARD §15 |
| The CPU glowed in the chain plates (red line 1) (two) | The chain's landings on the processor are **quiet** (no glow); plate 6 is the monitor it peels from, lit with the generic sign-in silhouette when "Windows takes control"; the Bit parks on the screen. | §8.1 |
| The Windows plate read as a missing graphic; the ≈ badge cryptic (two) | Plate 6 = the monitor; the ≈ chip is 44 × 36 and only on the eye (A6); the arc and the card are dashed only. | §10.1 |
| Six chain names in 3.7 s (one) | Every plate's name shows **dimmed (40%)** as its plate lands, so the chain can be read ahead; each brightens as the Bit lands on it. | STORYBOARD §15 |
| "Lookout" never on screen; the contrast with the "?" a 9 px tint (one) | On "lookout" a "Lookout" tag points at the eye; on "not the hidden processor" a "Hidden processor" tag points at the "?" with its pointer ring: both blocks carry their names side by side (probe 3). Lens #2 sits lower right, its leader a clear diagonal that stays through the D24 settle. | STORYBOARD §15 |
| The "?" read as lit in soft-off (red line 7) (one) | The soft-off pointer is the dashed ring alone; no tint. | §6.7, tokens `GLYPH2.qFillTint` |
| The button's lead and the board trace were one line with no end; "Signal only" left before the pulse (one) | The lead is a two-wire cable with a connector on the header and the trace beyond it is thinner; "Signal only" stays while the S04 Bit climbs the lead. | §8.2 |
| "+5VSB · ATX" jargon, 6 px on a phone (two) | Removed from the intro. | §10.1 |
| Pills on the header and the trace; "Power supply" over the edge (all three) | "Main rails: OFF" docks under the power supply (the `standby` shot moved down 68 world px to make room); "Main power: OFF" sits right of the vents; "Power supply" is one line inside the PSU's top face. | §10.6 |
| Half-words in wipes (one) | Word-by-word reveal everywhere. | §10.4 |
| Wake sources small, the clock a wall clock on the board, the leader to a junction (two) | 96 px **badges** (a rounded-square chip with the glyph); "Wake sources" sits above them with one leader to each badge. | §6.7 |
| The lookout "turned amber" in S11; the domain faint (one) | The wash leaves the lookout untinted (`holes`) and the region gets a dashed outline; "Standby-powered" points at its edge. | §8.4 |
| Socket, rocker and brackets hard to read (one) | A duplex wall outlet (one receptacle plugged, one showing its slots and ground hole); the rocker's pressed half dark and its raised half lit; brackets 18 px outside the button, 5 px. | ICONS.md |
| "Windows" spoken with no visual cue (one) | The scope chip reads "Windows desktop" on "Windows", then "Intel desktop" on "Intel". | STORYBOARD §15 |
| Production: hand-placed shots and slots; empty topic icons (two) | `frameParts(world, ids)` (shots from intent), `slot: 'auto'` (tags placed from intent at their landing frame, riding with the anchor), plate tags, `pairWide`, scrim `alpha`; six topic icons seeded (Ep02: router, antenna, phone, rfChip; Ep03: gpuPackage, hbmStack); the template renders as a dev composition with no warnings. | §15, ENGINE.md §20 |

### 21.2 Brand evolutions (A5) added in round 2

| Rule | Was | Now | Reason |
|---|---|---|---|
| Mono technical line | "+5VSB · ATX" under "Standby power" | none in the intro | Jargon the voice never says; 6 px on a phone |
| ≈ chip | 32 × 28, on the eye, the arc and the card | 44 × 36, on the eye only | Cryptic and tiny; A6 requires it on the eye |
| "?" pointer in soft-off | dim tint + dashed ring | dashed ring only | Red line 7 |
| Panel transitions | cross-fade inside plates; triptych clip + cross-fade | fade-through-ground; opaque lift for the triptych | Double exposure |
| The Bit | appears at rest | is born from the monogram's three pixels; lands quietly on a processor in a preview | Identity moment; red line 1 |
| Labels | mask reveal | word-by-word reveal | Half-words |
| Wake sources | glyphs on the board | badges | Read as hardware (red line 9) |

### 21.3 Deviations kept on purpose

- **Hold-rule waivers:** "Lookout" and "Hidden processor" leave at f712 when the chain peels from the lookout (the S07 tag names the "?" again at f950); "Lookout: own chip" leaves with its plate at f1455 (31 frames after its sentence's hold minimum would allow); the round-1 waivers stand.
- **The stops hold into S10** ("That lookout…") until f1452–f1455: their captions are read for 70 and 47 frames; the camera's glide to the standby path starts as they fly home.
- **K0 removed:** the hook holds still on the button while it is pressed and the Bit is born (the press, the window and the birth carry f0–f21); K1 glides out from f22 ("PC's"), not from f31, so the flash-forward Bit cruises at a calmer zoom (≤ 36 px/frame on screen).
- **No near-black vignette** in the margins (one judge's suggestion): A5 forbids vignettes, and darkening the field drops the darkest frames under the 28 floor.

### 21.4 What remains

- At the strictest still test about 42% of frames still count as near-static: holds between events, while labels are read. The longest run is 44 frames (f213–f256, under Lens #1), inside the 45-frame rule; every other run is ≤ 37 frames.
- The margins stay navy (see 20.4); the brand's neon now comes from the Bit's birth and landings, the lit routes' two-step halo and the thumbnail-like hook.
- Nobody has watched the motion in real time or listened; every check here is frame inspection and measurement.


---

## 22. Round 3 (judges' review of round 2, 10 October 2026)

Three judges scored round 2 at a mean of 8.46 (clarity 8.5, accuracy 8.8, craft 8.5, timing 8.5, brand 8.2, long-form 8.5, production 8.2). This section records what changed; the sections above state the new rules, each marked "round 3", and `tokens.ts` carries every new value. Nothing here changes A3 (the excerpt, 1,890 frames, no logo or title card), A4 (every anchor lands on its frame; `node tools/anchors.mjs` passes) or A6 (accuracy); `cues.json` is unchanged and the derived cue list still matches it.

### 22.1 What changed, by issue

| Issue (judges) | Change | Where |
|---|---|---|
| No brand moment; the monogram's pixels a few px; the thumbnails glow-lit (all three) | **The signature birth** at the first press: the logo's three magenta pixels at 3.5× with their own neon, laid out as in the B monogram, slide into the head and turn cyan (f3–f21). A third bloom step on the Bit. | §8.1 |
| The lookout a generic pill; Lens #2 magnified a blank rectangle (J2, J3) | The lookout is a **controller**: logic rows, a register macro and its **input pads**; in Lens #2 the standby line ends on its amber in1 pad and the button's trace (pointed at) on its in2 pad. | ICONS.md round 3 |
| Two tags on one block (J3) | One tag that **steps**: "Always-on logic" → "Lookout" over "always-on logic", on one leader. | §10.4 |
| Triptych: outcome unnamed, the supply cut through its fan, a 5 px rocker flip (all three) | A short supply (whole in every band), an 81 px rocker, a 58 px plug that drops away, the **eye** on every lookout, closing as it goes dark, and **"Dark"** above it. | §9.7 |
| The fold: an empty card with a stray stroke, a ghost outline over the next tag (all three) | Fold v3 (`FOLD_END` 13): the card lands as the world's truth while its frame fades; S11's labels land after it. | §9.7 |
| Plates flew as empty cards; two lookouts, two eyes, two monitors (J2, J3) | **The hero carry**: each chain plate (and S08's pair) carries its part out of the world into its scene; the world keeps a dashed **peeled socket**. The world's eye leaves as the lookout lifts. | §9.3 |
| The AMD plate lifted a copy of the Intel board; six text items; unlabelled shapes; "In the processor" at one block (J1, J2, J3) | Stops leave as **empty cards** and collapse in place on the way out; captions "AMD", "Laptops"; one leader to each block; muted names "Chipset", "Battery". | §9.3, §9.8 |
| The chip mixed time and scope; three phrasings for the press (J1) | **Time only** ("Soft-off", "After the press", "Now"); the scope a muted second line; dimmed during S08. | §10.5, §14 |
| S08 showed a certain outcome; the hedge must show (J3) | Restart's mark turns **dashed and faint** on "fix" (may be gone); Shut down's gets a grey **"?"** on "might" (may stay). "Why different?" on its own card between the plates. | §6.7, §9.8 |
| The "?" among the brightest marks in soft-off (J1, J2; red line 7) | Drawn at **58%** unless powered, pointed at, accented or in a Lens. | §6.7 |
| "Trickle" with no flow; f1493–f1595 held still (J2) | A **trickle** (sparse pale dashes inside the thin line) from "small" and a ×1.06 push toward the path. | §8.3 |
| The field invisible on a phone (J2, J3; the owner) | 6 px pulse heads, a brighter lattice, every walk pulsing, a ±30% pool breath. | §5 |
| The ≈ chip cryptic (J1) | Two unboxed waves, part of the eye's one dashed badge (A6). | §6.7 |
| f59 landing on a nameless block; probe 1 (J1) | A **"First"** mark on the lookout on "first", opposite "Not first". | §6.7 |
| Labels on hardware: "Hidden processor?" under the PCIe slot, "Why different?" on the supply (all three) | "Hidden processor?" 48 px below the slot on "processor," as the push settles; "Why different?" on a card. | STORYBOARD §16 |
| Wake sources: leaders too short to read as a fork (J1) | The tag set further left (one clear leader to each badge); the eye **glances** at each door, the button last. | §6.7 |
| The return stacked five changes in 10 frames (J3) | Ordered: window and Lens, then tags (+4), then the chip (+9). | STORYBOARD §16 |
| The scope rule drew as an "L" (J3) | Four corner brackets that grow together. | §6.7 |
| Dim chain names low contrast; "Power" read as the power button (J1) | Ghost names at 56% (≈ 5.4:1); "Main power". | STORYBOARD §16 |
| Pills 8 px on a phone (J2) | 44 px. | §10.1 |
| Production: hand-composed scenes, ~40 lines per chain, slots everywhere (all three) | `sceneFrom`, `stageShot`, `chainRow`; `slot` optional; the template renders a three-stage chain cut from its world with no warnings. | §15, ENGINE.md §23 |

### 22.2 Brand evolutions (A5) added in round 3

| Rule | Was | Now | Reason |
|---|---|---|---|
| Magenta | the "?" only | the "?", plus the monogram's pixels during the signature birth (≤ 18 frames at an episode's first press, while no "?" is pointed at) | The logo's pixels become the signal: the channel's mark without a logo (A3) |
| The "?" in soft-off | full strength | 58% unless powered, pointed at, accented or in a Lens | Red line 7 |
| ≈ | a 44 × 36 boxed chip | two unboxed waves on the eye | Read as a second unknown icon |
| Time chip | time or scope | time only; scope a muted second line; dim when plates show another time | Mixed grammar |
| Plates | fly as empty cards | carry their part (hero); a peeled socket in the world; another machine leaves and returns as an empty card | Match moves; one object at a time |
| Field pulses | 3.5 px, sparse | 6 px heads, every walk pulsing | Visible at 390 px |
| Narrated standby flow | shimmer only | a trickle of sparse pale dashes inside the thin line | "A small trickle" must flow |
| Pills | 40 px | 44 px | Phone |

### 22.3 Deviations kept on purpose

- **The ending.** One judge asked for the Bit's pixels to snap into the B mark at f1880–f1889. A3 forbids a logo or ident anywhere and A4 requires the Bit to be still travelling at f1889; the signature birth carries the mark at the first press instead.
- **Near-black margins.** Darkening `field` would drop the darkest frames under the 28 floor (the minimum is 28.8, at f1107, S08's scrimmed peel).
- **No "Network" / "Timer" labels** on the wake badges (a judge's suggestion): guardrails S11 say the other wake sources stay dim and unlabelled (they depend on settings).
- **"Dark", not "Lookout: dark"**: two-word outcomes in both what-if bands would take the triptych over the 12-word budget; the eye on each block already names the lookout.
- **The stops' timing** (f1363–f1455) is unchanged: holding longer would put the K9 glide on "Standby power" (f1475).
- **The stops' insets** were not zoomed ×1.4: the pairRight plates cannot grow without crossing the caption band; the parts are labelled instead.

### 22.4 Checks of the build (frame inspection and measurement only)

- `node tools/render.mjs` → `out/style6/style6_muted.mp4`: 1920 × 1080, 30 fps, **1,890 decoded frames**, H.264 High, yuv420p, BT.709, no audio.
- Every dev check silent (anchors, tag sync, budgets, proof of power, safe areas, motion gaps, references, cues); `node tools/anchors.mjs`: OK; `lint-times.mjs`: every time derived; `npx tsc --noEmit` passes for the whole project.
- Measured on the MP4 at 480 × 270 (`out/style6/r3/tools/measure.py`): mean luma 28.8–40.9 (mean 35.3), no frame under 28. Near-static frames (< 0.05% of pixels changing by more than 12 levels): **11.5%** (round 2: 40.6%), longest run 7 frames (was 44). Under 0.2%: 48.6% (was 55.6%); median changed area 0.221% per frame (was 0.106%).
- Inspected: a 1 fps sheet, bursts at every changed transition (hook, return, S05 step, chain peel and return, S08 peel and return, stops peel and collapse, triptych open, switch and fold, wake glances, the real press) and a 390 px phone sheet (`out/style6/r3/final_checks/`).

### 22.5 What remains

- About half the frames still change less than 0.2% of their pixels at 480p: holds while labels are read, when only the field moves (deliberately low contrast so it never competes).
- The empty card still flies for about 6 frames in the triptych's open and fold (fade-through-ground, so two drawings never overlap).
- No Ep02 section could be timed: Ep02 has no recorded narration or word timings yet.
- Nobody has watched the motion in real time or listened; every check here is frame inspection and measurement.


---

## 23. Round 4 (judges' review of round 3, 10 October 2026)

Three judges scored round 3 at a mean of 8.55 (clarity 8.5, accuracy 9.0, craft 8.5, timing 8.7, brand 8.3, long-form 8.7, production 8.2). This section records what changed; the sections above state the new rules, each marked "round 4", and `tokens.ts` carries every new value. Nothing here changes A3 (the excerpt, 1,890 frames, no logo or title card), A4 (every anchor lands on its frame; `node tools/anchors.mjs` passes) or A6 (accuracy). **`cues.json` is unchanged**: no cue frame moved, and the derived cue list still equals it.

### 23.1 What changed, by issue

| Issue (judges) | Change | Where |
|---|---|---|
| The hook: a supply slab and an empty chipset window, no processor, no monitor, the socket cropped (J2, J3) | The `hook` shot shows the real system at once: the big dark processor, the lit lookout (glowing), the "?", the button, the black monitor, the socket and the seated plug, all whole (995, 572, ×1.06); the supply ends 27 px above the window's rule | §8.1, STORYBOARD §17 |
| Blank cards at the stops, the triptych's open and its fold; three supplies overlapping (all three) | Other machines **slide** in from the right edge with their drawing and out again; the triptych **carries** its parts (socket, cord, plug, supply, lookout, standby line) between the world and the centre band at the open and the fold; the side bands fade as they fold. No card is ever empty | §9.3, §9.7 |
| Names drift: "Always-on logic" / "Lookout"; four labels for the "?"; "Main power" / "Main rails" (all three) | **One name per object:** "Lookout" (mono subline "always-on logic"), "Hidden processor" (every label, the chain plate, S07), "Main power: OFF" (both pills; chain plate "Main power"), "Main processor" (S01 and S09, with the mono subline "Intel"); "Stays awake" says what the voice says before the voice names the lookout | §3, §10.4, the Ep01 glossary |
| "First" on an unnamed block, beside the "?"'s Lens (J1) | "First" (44 px) sits on a leader left of the lookout, away from the "?", over the mono subline "always-on logic" | §6.7 |
| The chain's take-off busy over an undimmed world (J2, J3) | Plates peel 6 frames apart in reading order after a first scrim step; the full scrim arrives with them | §9.3 |
| The fly-home crowded the CPU and DIMMs; a doubled "?" (J1, J3) | **The hero home:** each card dissolves in its slot and its hero flies home alone, right to left, 3 frames apart, the "?" last; the world's "?" badge is gone while its block is peeled | §9.3 |
| The S08 hedge invisible on a phone; its grey "?" reused the series' "?" and hit the power ring (J1, J3) | 44 px captions under each PC on their words ("Can fix", "Might not"); the hedge mark is a dotted ring round an 84 px problem mark (the "!" fading inside it, or echoing twice), placed on the screen inside the sign | §6.7, §9.8 |
| Two monitor plates stacked on the way home; plates ghosting (J2) | Shut down slides out from behind Restart (the same running PC) and back behind it; only Restart carries the monitor home | §9.3 |
| About 1 s of nothing new under "By the end" (J1); the pair nearly still through "starting again… might not" (J3) | Restart peels on "end,"; the shut-down PC relights with a power-on sweep; the kept problem's mark echoes twice | STORYBOARD §17 |
| Secondary text 5–8 px on a phone (all three) | Mono sublines, the chip's scope line and the scale chip 40 px; "Chipset", "Battery" and the hedges 44 px (answer text); "First" 44 px | §10.1, §13.2 |
| The triptych's causes 3–5 px on a phone (J1) | A coral cross on the pulled plug's gap, an ink ring round the flipped rocker, dark bands dimmed to 55 % | §9.7 |
| The background lived only in the margins (J2; the owner) | Focus pings from the subject over the board vias and the grid (on each new subject, every 2 s while held), the vias' pool plateau and its breath with the lookout | §5.4 |
| The lookout read as an ID card; "Firmware on CPU" and "Loader" alike (J2, J3) | The lookout is drawn as a chip (lead pins, a pin-1 dot, two rows of square cells, its input pads); stage marks: the firmware's code on the flash, the loader's file on the SSD, each sliding into the processor as the Bit lands | ICONS (Round 4 changes), §6.7 |
| The scope line drew as a partial rectangle into the chip's scope line (J2) | Four separate L-brackets on the case's corners, 26 px under the scope line, above the caption band (`desk` y 489 → 469) | §6.7 |
| The "later" window framed S01–S02 only; the chip's roll clipped glyphs (J1) | The window also frames the S04 demonstration; the chip changes by a fade with a short slide | §9.6, §10.5 |
| "Now" readable 5 frames late; the "Lookout" step 6 frames late (J3) | Both start 3 frames early (readable on their words) | §10.4, §10.5 |
| Magenta at the press beside the "?" (J1); start the pixels with the press (J2) | The birth starts on the press (f0), its pixels laid out to the right, away from the chipset; the "?" stays at 58 % | §8.1 |
| The wake sources as bright as the button (J1) | They settle to 56 % | §6.7 |
| The signature only once (J1, J2) | The bookend: the real press's Bit departs re-forming the logo's three pixels behind it | §8.1 |
| Production (J3) | Reusable devices as data (`lift: 'slide'`, `enterFrom` / `returnInto`, the hero home, the split `carry`, band `marks`, plate `names` tones, chain `backOrder`); the file-naming ids; `tools/measure.py` | §15, ENGINE §24 |

### 23.2 Brand evolutions (A5) added in round 4

| Rule | Was | Now | Reason |
|---|---|---|---|
| Supporting text | 34–36 px | 40 px; answer text 44 | 6–8 px on a phone |
| Names | stepped per sentence | one name per object; technical names as mono sublines | Beginners counted four blocks |
| S08 hedge | a dashed "!" and a grey "?" | captions plus a dotted "maybe" ring | Invisible on a phone; the "?" belongs to the hidden processor |
| A plate's return | the card flies home | the card dissolves, the hero flies home alone | Crowded frames, a doubled "?" |
| Another machine | leaves and returns as an empty card | slides in and out with its drawing | Blank cards |
| Triptych open and fold | lifted world, empty card | the carry | Blank cards, three supplies |
| Time chip change | a masked roll | a fade with a short slide | Clipped glyphs |
| Magenta | the "?" and the first press | plus the real press's bookend (16 frames) | The signature appeared once |
| Living field | reactions in the margins | plus focus pings and breathing vias on the board | "Very static" |
| "Later" window | the flash-forward | plus the S04 demonstration | One grammar for "After the press" |

### 23.3 Deviations kept on purpose

- **No sound for peels and folds** (J2 suggested soft "lift" and "settle" cues): sound marks causes, not edits (§12), and `cues.json` stays as approved.
- **Near-black margins and cyan rims on lit parts** (J2): the luma floor (28) and the emissive budget (two lights) stand.
- **"Dim the world to 45 % at peel start"** (J2): the world steps back by 12 % before the first plate and reaches 45 % as the plates arrive. A 45 % scrim with no plates measured 22–27 mean luma, under the floor.
- **"Keep the scrim until the last plate docks"** (J3): the first step does; the deeper step lifts as the cards dissolve (the same luma reason).
- **The stops' inner texts** (J2: "the screen outruns the voice"): kept, now 44 px: they are probe 5's answer (style guide §12).
- **Names before the voice:** the "?"'s label under Lens #1 reads "Hidden processor" on "never heard of" (the voice: "a smaller processor you've probably never heard of"; it says "hidden processor" at f683 and f950), so the "?" has one name everywhere; the lookout shows "Stays awake" until the voice names it "lookout".
- **J2's target of under 25 % of frames below 0.5 % change:** not reached (38.1 % at their 4-level threshold, from 42.6 %); more motion would make the field busy.
- **Translucent moments:** a plate's card fades in its slot round its hero (4 frames), and the triptych's side bands fade as they slide behind the centre (6 frames, mostly hidden by it): both are grounds fading round content, never two drawings over each other.
- **No Ep02 section** could be built: Ep02 has no recorded narration or word timings.

### 23.4 Checks of the build (frame inspection and measurement only)

- `node tools/render.mjs` → `out/style6/style6_muted.mp4` (copied to `out/style6/ep01/ep01_muted.mp4`): 1920 × 1080, 30 fps, **1,890 decoded frames** (ffprobe), H.264 High, yuv420p, BT.709, no audio.
- `npx tsc --noEmit -p tsconfig.style6.json` passes; `lint-times.mjs`: every time derived; every dev check reports OK (anchors, tag sync, budgets, proof of power, safe areas, motion gaps, references; run in Node and silent in the bundle); `node tools/anchors.mjs`: OK; `cues.json` equals the derived list.
- Measured (`tools/measure.py`, 480 × 270): mean luma **28.3–41.3** (mean 35.2), no frame under 28. Near-static frames (pixels changing by more than 12 levels): under 0.05 %: **5.8 %** (round 3: 11.5 %); under 0.2 %: **38.5 %** (48.6 %), longest run 44 frames (50); under 0.5 %: 60.1 % (61.9 %); median changed area 0.300 % (0.221 %). At the judges' 4-level threshold (`--thr 4`): under 0.5 %: **38.1 %** (42.6 %); under 0.2 %: **18.7 %** (31.9 %).
- Inspected: 10 fps bursts over every changed range (`out/style6/ep01/bursts/`) and 390 px Lanczos sheets (`out/style6/ep01/phone/`).

### 23.5 What remains

- The near-static share is still above J2's target; the field stays deliberately low-contrast.
- The first step of the S06 scrim is light (12 %) because of the luma floor.
- Nobody has watched the motion in real time or listened; every check here is frame inspection and measurement.
