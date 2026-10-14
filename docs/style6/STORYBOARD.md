# Signal Atlas: storyboard for the Ep01 intro (63 s, f0–f1889)

Composition `SignalAtlas` · 1920 × 1080 · 30 fps · 1,890 frames · narration W0001–W0180 (0–61.66 s, audio out 62.000 s). Every frame here is `round(ms × 30 / 1000)` from `public/data/ep01_words.json` (checked against the kit's `ANCHORS`, `WORD_CUES` and the full word list). Style: `STYLE_BIBLE.md`. Code contract: `ENGINE.md`. Parts: `ICONS.md`.

**How to read a beat:** frames (seconds) · word IDs and recorded words → **Idea** (what the viewer must understand) → **Composition** → **Camera** → **Panels** → **Actions** (each anchored to a word) → **Labels** (exact text) → **Field** (background reactions) → **Transition** → **Sound** → **End state** → **Check**.

Screen coordinates are 1920 × 1080 px; world coordinates are the world px of §1 (world px = screen px at zoom 1). Label slots are the text block's top-left (the key bar's left edge); tags interpolate their slots between shots with the camera's easing.

---

## 1. The world (`src/styles/style6/ep01/world.ts`)

One typical Intel ATX desktop in soft-off, plugged in, rear switch at "I". Orthographic map in true topology (schematic liberties: the 24-pin on the board's bottom edge and the front panel under the board, as in 03, to keep routes short). The layout was prototyped in code at every shot below (mean luma 30.6–38.1 before labels).

| Part id | Icon | World rect x, y, w, h | z | Initial | Notes |
|---|---|---|---|---|---|
| `case` | case | 330, 112, 1130, 816 | 0 | — | `deck` tray, `deckEdge` outline |
| `board` | board | 560, 150, 840, 610 | 2 | — | six ATX holes |
| `rearIo` | rearIo | 534, 250, 38, 230 | 10 | — | RJ45 cut-out at 540, 420, 26, 32 |
| `lan` | lanChip | 600, 428, 34, 26 | 4 | off | wake path (S11) |
| `cpu` | cpuLga | 650, 190, 260, 260 | 10 | off | never lit in the intro |
| `dimm1–4` | dimm | x 950 / 972 / 994 / 1016, y 190, 14 × 260 | 10 | off | |
| `m2` | m2 | 1080, 300, 280, 34 | 4 | off | |
| `pcie` | pcieSlot | 950, 560, 410, 20 | 6 | — | empty graphics slot |
| `chipset` | chipset | 640, 500, 260, 190 | 8 | — | x-ray; blocks below |
| ↳ `lookout` | logicBlock wide | 660, 630, 72, 36 | 3 | **alwaysOn** | the always-on logic; default glow holder |
| ↳ `q` | logicBlock square | 816, 516, 64, 64 | 3 | off | "?" badge docked on it |
| `flash` | spiFlash | **914, 470, 46, 28** | 4 | off | never a Bit target. Critic: moved from (930, 610) into the gap between the CPU, the DIMMs and the chipset; this clears the `monitor` shot's caption band and both Lens leaders (Lens #1's leader passes ≥ 30 px below it). |
| `vrm` | vrmStandby | 664, 700, 36, 26 | 6 | — | the standby channel passes through it |
| `atx24` | atx24 | 620, 734, 132, 26 | 8 | — | `pin9` x 676, `mainEntry` x 730 |
| `fpHeader` | fpHeader | 985, 736, 50, 24 | 6 | — | S03 end tick at its bottom (1010, 760) |
| `psu` | psu | 400, 800, 480, 116 | 22 | — | inlet (20 × 42) and rocker (26 × 50, 3 px I/O marks) on the left face; fan centre 480, 858 r 44; cable exit 640–736 on top |
| `plug` | iecPlug | 346, 818, 36, 36 | 8 | seated 1 | |
| `cord` | cord | points (304, 836) → (346, 836) | — | — | physical cable |
| `socket` | wallSocket | 240, 804, 64, 64 | 6 | — | outside the case |
| `front` | frontPanel | 940, 800, 140, 116 | 14 | — | |
| `button` | powerButton | centre 1010, 866, **r 36** | 6 | press 0 | IEC power symbol. Critic: r 30 made the protagonist 69 px at `open`/`ask` (14 px on a phone) when it is named; r 36 gives 83 px (17 px) and still fits the front panel |
| `led` | led | centre 1060, 818, r 5 | — | off | stays off |
| `monitor` | monitor | bezel 1490, 190, 280, 170; stand 1620, 360, 20, 60; foot 1570, 420, 120, 10 | 10 | screen black | room object, parallax 0.9 |
| (glyph) `card` | signInCard | **room plane 1490, 445, 213, 133** (below the foot; ≈ screen 1531–1770 × 393–543 at `ask`) | — | — | S07 analogy, never on the screen; rides with the monitor during K7 |

**Routes and channels**
- `pwrbtn` (signal, 4 px): (1010, 830) → (1010, 748) → (1010, 712) → (716, 712) → (716, 666). Length 458. Cable from the cap to the header's bottom (path 0–70, `endTickAt` 70), board trace from the header to the lookout's `in2`.
- `standby` (channel, 10 px, full): (676, 800) → (676, 666): PSU cable exit → 24-pin pin 9 → regulators → lookout `in1`.
- `main` (channel, 18 px, empty): (730, 800) → (730, 760): PSU → 24-pin; it stays empty all intro.
- `wakeNet` (signal, drawn on in S11): (566, 441) → (600, 441); `wakeNet2`: (617, 454) → (617, 648) → (660, 648).
- `wakeClock` (signal, drawn on in S11): (680, 566) → (680, 630). Clock glyph at (680, 548).

**Domain** `standbyDomain` (wash, S11): polygon (650, 620), (744, 620), (744, 678), (708, 678), (708, 762), (652, 762), (652, 678), (650, 678). The "?" lies outside it.

**Proof of power:** subject `chipset.block:lookout`, proof `plug.face` (bible §7.7).

---

## 2. Shots and the camera track (`ep01/shots.ts`)

| Shot | Centre (world) | Zoom | Used for | Phone sizes (lookout · "?" · CPU) |
|---|---|---:|---|---|
| `open` | 870, 590 | 1.15 | f0: the thumbnail rhyme (big dark CPU, lit lookout, button, the black monitor at the right edge) | 17 × 8 · 15 · 61 px |
| `openLean` | 830, 590 | 1.18 | S01 after the carry; S02 with Lens #1 | 17 × 9 · 15 · 62 |
| `power` | 780, 720 | 1.42 | S03: button, lead, header, PSU with its empty main channel, plug | 21 × 10 · 18 · — |
| `chip` | 640, 706 | 1.80 | S04 arrival; S07a "hidden processor" | 26 × 13 · **23** · — |
| `board` | 900, 566 | 1.10 | S04 end, S05 with Lens #2, S06 backdrop | 16 × 8 · 14 · 58 |
| `ask` | 980, 581 | 1.15 | S07b: "?", button, monitor and the sign-in card in one frame | 17 × 8 · 15 · 61 |
| `monitor` | **1560, 350** (built; was 360) | 1.50 | S08: the black monitor (screen ≈ 939–1339 × 288–531) with the fork below it over the field. Built at y 350 so the button's board trace (world y 712) falls below the frame instead of crossing the caption band at y 1068 for the whole hold | — |
| `atlas` | 1005, 525 | 0.92 | The parallax reference shot (room objects match the deck here) | 13 × 7 · 12 · 49 |
| `desk` (built, S09) | 1005, 489 | 0.85 | S09: the whole desktop. At `atlas` the case top put the scope line at y 145, through the "Intel desktop" chip's underline and into the header zone | 12 × 6 · 11 · 45 |
| `column` | **524, 760** | **1.22** | S10 and the triptych: plug, rocker, PSU, standby path, lookout, LAN, button | 18 × 9 · 16 · — |
| `wake` (built, added) | 720, 680 | 1.40 | S11 after the fold: the powered domain, the three wake sources (network jack, clock, button) and the plug, labels on the left | 20 × 10 · 18 · — |
| `dive` | 620, 730 | 2.00 | S12 carry target (reached at f1928, after the intro) | 29 × 15 · 26 · — |

**Critic's computed check (projections with the 2.5D sides and the 0.9 room parallax; scratch script, not shipped):**
- The designer's `monitor` (1520, 380) put the chipset and the front-panel header in the caption band for the whole 4.6 s hold, and with a 44-frame K7 its pan peaked at exactly the 48 px/frame cap. The new `monitor` plus the moved SPI flash leave no top face below y 932, with mean luma ≈ 29.4 before labels (fills-only mock).
- The designer's `column` (540, 760, ×1.30) clipped S10's what-if: the pulled plug's left edge fell 24 px outside the 560 px band. At (524, 760, ×1.22) the pulled plug clears the band edge by 14 px and the lookout by 26 px (its pip docks inside the block).
- With those two changes, every shot keeps every label, Bit, route, channel and part **top face** above y 932. Only grounds and the dark 2.5D side faces (the PSU's, up to 15 px) cross into the caption band (bible §13.1 as revised).
- Mean luma before labels (fills-only mock): 29.4–36.6 at every shot.
- Whenever the lookout is visible at a hold, the plug is in frame above y 932. During K7 (f1085–f1096) and K8 (f1274–f1284) the plug leaves 12 and 11 frames before the lookout does, inside the 12-frame move grace (bible §7.7).

| # | Key | Start → end | To | Ease | Why (word) | Peak zoom / 12 fr · peak pan |
|---|---|---|---|---|---|---|
| — | start | f0 | `open` | — | "Press" | — |
| K1 | carry `ff` | f31 → f71 | `openLean` | carry | follows the Bit (depart f33) | ×1.02 · 4 px/fr |
| K2 | glide | **f357 → f387** (built; was f346) | `power` | glide | "(you) pressed" (f356): after the return, not inside it (three moves started in f327–f346) | ×1.16 · 19 |
| K3 | carry `s04` | f470 → **f522** (built; was f510) | `chip` | carry | follows the Bit (depart f472); 52 frames keep the Bit at 35.4 px/frame on screen (40 gave 37.0, over the 36 cap) | ×1.15 · 14 |
| K4 | pull | f551 → f585 | `board` | move | "even while your PC is off" | ×1.43 · 35 |
| K5 | push | f920 → f952 | `chip` | move | "So what is that hidden…" | ×1.45 · 35 |
| K6 | pull | f985 → f1025 | `ask` | move | "and how does one tap…" | ×1.34 · 37 |
| K7 | push | **f1066 → f1118** | `monitor` | move | starts in the pause after "screen?" (f1058–f1067), carries "By the end" | ×1.16 · 44 |
| K8 | pull | f1254 → **f1302** | `desk` (built; was `atlas`) | move | "follow a typical Windows desktop" | ×1.39 · 37 |
| K9 | glide | f1506 → **f1548** | `column` | glide | pause after "power," (f1505–f1512) | ×1.27 · 43 |
| K9b (built, added) | glide | f1699 → f1735 | `wake` | glide | "just enough of the motherboard": onto the powered domain once the triptych has folded | ×1.10 · 24 |
| K10 | carry `real` | f1840 → (f1928) | `dive` | carry | follows the real press's Bit; mid-move at f1889 (built: zoom 1.90, centre ≈ (631, 725), from `wake`; the plug in frame at screen ≈ 430–520 × 715–785) | ×1.15 · 7 |

Caps: ×1.8 per 12 frames, 48 px/frame. As built, `zoomRateReport` / `panSpeedReport` give K1 ×1.02 · 4, K4 ×1.43 · 34, K5 ×1.45 · 37, K6 ×1.34 · 37, K7 ×1.16 · 45, K8 ×1.33 · 40 (the rows above give the changed keys). Peaks above were **computed** by the critic with the bible's interpolation (log zoom, the anchor on a straight eased screen path, sampled at 1/8 frame); `camera/checks.ts` stays the authority. S07 has two moves (K5, K6), one per clause, which bible §7.4 allows. Zero cuts. K10's explicit timing wins over the carry formula (`ENGINE.md §5`).

---

## 3. Time and the chip (`ep01/script.ts → chip`)

> **Round 3:** the chip below is the original plan. The chip as built (time only, a fixed vocabulary, "When pressed" retired, the scope as a second line, dimmed during S08) is in §16.

| From | Chip text | Size | Underline | Roll | Meaning |
|---|---|---|---|---|---|
| f2 | **After the press** | 44 | double | f2–f8 (readable f7) | flash-forward; the "later" window contracts f2–f12 |
| f137 | (same) | 34 | double | step f137–f143 | |
| f334 | **Soft-off** | 44 | single | f334–f340 | the present; window expanded f327–f337 |
| f404 | (same) | 34 | single | step | |
| f436 | **When pressed** | 44 | single | f436–f442 (readable on "sends" f441) | a described signal, no window |
| f519 | **Soft-off** | 34 | single | f519–f525 ("that") | |
| f592 | (same) | 44 | single | step f592–f598 (on "off." f595) | |
| f617 | (same) | 34 | single | step | |
| f716 | **After the press** | 44 | double | f716–f722 (readable on "starts" f722) | preview: the plates carry the not-now double rule; **no window** (the world behind stays the present) |
| f765 | (same) | 34 | double | step | |
| f914 | **Soft-off** | 34 | single | f914–f920 | plates fly home f914–f936; time breath |
| f1316 | **Intel desktop** | 44 | single | f1316–f1322 (on "Intel" f1321) | scope |
| f1382 | (same) | 34 | single | step | |
| f1505 | **Soft-off** | 34 | single | f1505–f1511 | |
| f1589 | (none: rolls out) | — | — | f1589–f1595 | built: the triptych's bands own the frame (y 140–920); the chip's rule touched the left band's top edge |
| f1691 | **Soft-off** | 34 | single | f1691–f1697 | built: back with the fold |
| f1825 | **Now** | 44 | single | f1825–f1831 (readable on "Now" f1830) | the real press |

---

## 4. Beat by beat

> **Round 1 (judges' review):** the beats below are the original plan. Where §14 differs (B01, B04, B12–B16, B18–B27, the chip, the camera), §14 wins; **round 2's §15 wins over both**, round 3's §16 over all three, and **round 4's §17 over every earlier section**: it is what `ep01/script.ts` builds.

### B01 · f0–f58 (0.00–1.97 s) · W0001–W0005 "Press your PC's power button,"
- **Idea:** this is a real PC, switched off but plugged in; a press is about to send a signal into the board, and we are looking a moment ahead.
- **Composition:** shot `open`. The thumbnail rhyme: the big dark CPU upper centre-left (299 px), the small lit lookout in the chipset below it (the brightest thing on screen, glowing), the button lower right, the plug seated at the lower left, the black monitor at the right edge. Layers: field < case < board < parts < standby channel (amber, live) < route < Bit < labels < chip < window rule.
- **Camera:** holds on `open` to f31, then K1 carry (f31–f71) toward the chipset as the Bit travels.
- **Panels:** the "later" window contracts f2–f12 (`move`) to x 48–1872, y 48–932, double rule drawn clockwise f4–f12.
- **Actions:** **f0 "Press"**: the cap travels (press 0 → 1 over f0–f2, contact f2, release f6–f11). **f2–f8**: chip "After the press" rolls in (readable by f7). **f23–f34 "power button" (W0004 f29)**: tag lands. **f12–f33** (built): the Bit forms on the cap's top edge and rests there, breathing (the press made it). **f33** (inside "power", A4): the Bit departs the button on `pwrbtn` (458 px in 26 frames, cruise ≈ 22.2 world px/frame), the route lighting cyan behind it (10-frame decay), its pixel trail shedding from the head over f33–f37.
- **Labels:** chip **After the press**; tag **Power button** (role part; anchor `button.right`; slot (1230, 806) at `open`, (1270, 815) at `openLean`; exit f142).
- **Field:** press ring from the button f0–f24; window dims the grid outside to 40% f2–f12; light pool on the button, then on the Bit (from f33).
- **Transition:** T3 window contract.
- **Sound:** `button` f0, gain −4 dB (a preview press).
- **End state:** the Bit is closing on the lookout; nothing else has changed.
- **Check:** chip readable by f8 (44 px); the cap moves only here and at f1837; the route ends at the lookout, never the CPU, PSU or "?"; CPU dark; main channel empty; LED off; plug seated and in frame; nothing below y 932.

### B02 · f59–f136 (1.97–4.53 s) · W0006–W0012 "and your main processor doesn't go first."
- **Idea:** the big chip is the main processor and it stays dark; a small block reacted first.
- **Composition:** `openLean`; the frame itself is the comparison: big dark CPU above, the small lit block the Bit just reached below it.
- **Camera:** K1 settles by f71, then holds.
- **Panels:** window.
- **Actions:** **f59 "and"**: the Bit lands on the lookout: square ripple 24 → 80 px (f59–f69), absorbed in 3 frames (no park, no glyph change; the lookout already breathes). **f61–f72 "main" (f67)**: the CPU's outline steps to `textMuted` (pointed at, not lit) until f127 and the tag lands. **f85–f96 "doesn't" (f91)**: "Not first" lands; the CPU stays exactly as it was.
- **Labels:** **Main processor** (role part; anchor `cpu.tagLeft2` (650, 325); slot (184, 206); exit f327); **Not first** (role part; anchor `cpu` left edge at 70% (650, 372); slot (362, 284); exit f327). Built: both are left-side tags (text right-aligned, key bars aligned at x 563, leaders run right to the CPU): with the key bar on the left, the leaders crossed their own text. Must-read at f100: 9 words (chip 3 + 2 + 2 + 2).
- **Field:** pixel ripple from the lookout f59–f75; light pool to the CPU at f67.
- **Sound:** `land` A f59, gain −4.
- **End state:** stable flash-forward frame. **Check:** CPU visibly inactive f91–f127 (no glow, no pip change, no "1st" badge); the lookout's glyph unchanged on the landing.

### B03 · f137–f199 (4.57–6.63 s) · W0013–W0018 "Before it runs a single instruction,"
- **Idea:** the main processor has run nothing yet.
- **Composition:** `openLean`; the left rail stacks the CPU's facts.
- **Actions:** f137–f143 chip steps 44 → 34. f142–f148 "Power button" exits (hold rule: S01 end + 15). **f157–f168 "single" (f163)**: readout **0** (mono 64) **instructions** (mono 38, `textMuted`) types in under "Not first". **f188–f196**: Lens #1's leader draws (`LensSpec.leaderAt` 188; 3 px emphasis at 70%) from the ring position toward a 10 px target on the "?" block's right edge (880, 548).
- **Labels:** readout **0 instructions** (built slot (237, 360), right-aligned under the rail's key bars; exit f341).
- **Field:** light pool on the readout (f163), then on the Lens position (f188).
- **Check:** the readout is literal-safe; nothing on the CPU moves.

### B04 · f200–f293 (6.67–9.77 s) · W0019–W0026 "a smaller processor you've probably never heard of"
- **Idea:** inside the chipset, beside the lookout, is a second, smaller processor with no name.
- **Composition:** `openLean` + Lens #1: ring d 400 centred at (1440, 430) over the DIMM/M.2 area (it covers no named part), magnify ×4 relative to the view (4.72 px per world px), focus the "?" block centre (848, 548): the block fills the ring at ≈ 300 px with its "?" badge at 72 px. One frame holds the big dark CPU with "0 instructions", the small "?" block in the chipset and its magnified view, joined by the leader.
- **Panels:** window; Lens.
- **Actions:** **f197–f206**: the ring draws clockwise from 12 o'clock with the view revealed by a wedge that follows the pen; ticks f203–f205; complete on **"smaller" (f206)**; scale chip **×4** at 4:30 (≈ (1591, 581)). **f206–f212**: the "?" badge accents (1 → 1.12 → 1) in the world and in the Lens. **f256–f262 ("never" f259)**: a second accent.
- **Labels:** none new ("?" counts 0 words).
- **Field:** dots under the Lens are covered; light pool on the Lens.
- **Sound:** `lens_open` f197.
- **Check:** the "?" sits inside the chipset, separate from and shaped differently from the lookout; unnamed; not in the CPU; one emphasis device (the ring).

### B05 · f294–f326 (9.80–10.87 s) · W0027–W0030 "is already at work."
- **Idea:** after the press, the "?" is working while the CPU still shows 0.
- **Actions:** **f294 "already"**: the "?" block flips ON over 5 frames (outline `ink` 4 px, `activeFill`, filled pip) in the world and in the Lens; the glow moves from the lookout to the "?" (glow track); the lookout keeps breathing; the readout stays 0.
- **Field:** light pool on the "?".
- **End state:** "?" active (flash-forward only), CPU dark. **Check:** no Bit reaches the "?"; main channel still empty; CPU unchanged; framed as later (window + chip with double underline).

### B06 · f327–f364 (10.90–12.13 s) · return + W0031–W0035 "And the button you pressed"
- **Idea:** that was later; this is now: the PC is off. Look at the button.
- **Composition:** the same world, full frame again.
- **Camera:** holds on `openLean` until K2 glide starts at f357 (built; → `power` by f387).
- **Panels:** the window expands f327–f337 (`settle`); its rule fades f327–f333.
- **Actions (all inside the f327–f335 pause, complete by f346):** f327–f332 the "?" flips OFF and the glow returns to the lookout; f327–f333 "Main processor" and "Not first" exit; f331–f337 Lens #1 closes (radius 100 → 85%, fade); f334–f340 chip rolls to **Soft-off** (44 px); f341–f346 the readout exits (its hold rule ends at f341). **f338–f349 "button" (f344)**: "Power button" re-lands.
- **Labels:** chip **Soft-off**; tag **Power button** (anchor `button.right`; slot (1270, 815) at `openLean` → (1400, 700) at `power`; exit f442).
- **Field:** time breath f327–f337; light pool to the button f344.
- **Sound:** `lens_close` f331.
- **End state at f346 (A4):** lookout ON and breathing, "?" dim with its badge, CPU dark, main power empty, "Soft-off" in the chip. Never "Before the press".
- **Check:** every state reverted in place by f346; no backwards-running Bit (03's ambiguity is avoided).

### B07 · f365–f435 (12.17–14.50 s) · W0036–W0041 "doesn't actually switch the power on."
- **Idea:** the button's wire only reaches the board; the power supply's thick main channel stays empty. The button signals; it carries no power.
- **Composition:** `power` (from f376): button and lead at right, header, PSU across the bottom with the empty 18 px main channel rising to the 24-pin, plug seated at the left, lookout lit above.
- **Actions:** **f365 "doesn't"**: the lead (cable part of `pwrbtn`, cap → header; RouteEvent `ink` with `range: 'cable'`) draws in `ink` over f365–f375 and an **end tick** lands at the header's bottom edge (1010, 760) f373–f377 — the wire ends here; the board trace beyond stays grey. **f374–f385 "actually" (f380)**: "Signal only" lands. **f404–f410**: chip steps to 34. **f404–f415 "power" (f410)**: pill "Main power: OFF" docks inside the PSU body; the main channel's walls step to `textMuted` (pointed at) f410–f434. **f428–f436** (pause): the lead fades back to `structure`, the end tick fades.
- **Labels:** **Signal only** (role info; anchor the lead at (1010, 798); slot (1400, 596); exit f442); pill **Main power: OFF** (inside the PSU body right of the fan, box ≈ (640–1010, 740–794) at `power`; exit f608). Built with a world-anchored dock (its top-left at world (555, 861)) so it rides with the PSU through K3 and K4. Must-read at f420: 7 (Soft-off 0 at 34 px; 2 + 2 + 3).
- **Field:** light pool on the lead (f365), then the PSU (f410).
- **Check:** the lead ends at the header, never at the PSU, mains or rocker; no thick cable, lightning or "not a switch" text; the rocker is drawn at "I" and treated as a real switch.

### B08 · f436–f497 (14.53–16.57 s) · W0042–W0049 "It sends a split-second signal to a"
- **Idea:** what a press sends: one brief signal along that wire into the board.
- **Composition:** `power`, then the carry.
- **Camera:** K3 carry f470–f522 (built; `power` → `chip`), anchored on the lookout so it grows on a straight eased screen path.
- **Actions:** f436–f442 chip rolls to **When pressed** (readable on "sends" f441). f442–f448 "Power button" and "Signal only" exit (hold rule: S03 end + 15). f468–f471 the Bit forms on the cap's top edge — **no cap travel, no click**. **f472 "signal"**: the Bit departs on `pwrbtn` (26 frames); the lit segment decays in 10 frames (a pulse, not a beam). f492–f497: anchor and leader of "Always-on logic".
- **Field:** light pool rides the Bit.
- **Check:** demonstration only (no press); the Bit heads for the lookout only; plug seated and in frame throughout the carry.

### B09 · f498–f550 (16.60–18.37 s) · W0050–W0054 "small circuit that stays awake"
- **Idea:** the signal stops at one small block inside the chipset, and that block is awake now.
- **Composition:** `chip` (from f510): the chipset fills the upper middle with the lookout 130 px wide and the "?" 115 px; plug, inlet and rocker at the lower left; the standby channel live between the PSU and the lookout.
- **Actions:** **f498 "small"**: the Bit lands (ripple only, no state change: a demonstration); "Always-on logic" text lands. f519–f525 chip rolls back to **Soft-off** (34). **f539 "awake"**: the lookout's pip is at a breathing peak (phase-locked to f0, period 60: peaks at f540).
- **Labels:** **Always-on logic** (two lines "Always-on" / "logic"; role part, left-side tag; anchor `chipset.block:lookout.left`; slot (528, 400) at `chip` (built; at 560 its key bar sat on the board's left edge), (300, 540) at `board`; exit f707).
- **Field:** pixel ripple from the lookout f498–f514; light pool on the lookout.
- **Sound:** `land` A f498, gain −4 (a described event).
- **Check:** only the small block is lit (never "the chipset glowing"); the "?" stays dim; no glyph change on the landing.

### B10 · f551–f616 (18.37–20.53 s) · W0055–W0060 "even while your PC is off."
- **Idea:** the whole PC is off and this block isn't; the PC is still plugged in.
- **Camera:** K4 pull f551–f585 to `board`: the whole machine dark (CPU, DIMMs, M.2, monitor black, main channel empty), the lookout the one lit block, the plug in.
- **Actions:** **f592–f598 "off." (f595)**: chip steps to 44 px. f600–f608: Lens #2's leader draws (from the ring's left edge toward a 10 px target on the lookout's right edge (732, 648)). f608–f614 pill "Main power: OFF" exits (pause).
- **Field:** light pool widens on the lookout.
- **Check:** "off" is soft-off with AC present (plug seated, rocker at "I"); no "Sleep" or "Standby mode"; no coin cell.

### B11 · f617–f670 (20.57–22.33 s) · W0061–W0065 "That circuit is a lookout,"
- **Idea:** "lookout" is a way to think about the real block, not a new part.
- **Composition:** `board` + Lens #2: ring d 380 centred at (1340, 640) (over the empty board right of the chipset), magnify ×4 (4.4 px per world px), focus the lookout centre (696, 648): the lookout ≈ 317 × 158 px with both feeds entering from below (the amber standby channel and the button's trace). The leader runs left from the ring to the lookout's right edge over empty board (the SPI flash now sits above the chipset, clear of it).
- **Actions:** **f608–f617**: the ring draws (wedge reveal), complete on **"That" (f617)**; ticks f614–f616; chip **×4** at 4:30. f617–f623 chip steps to 34. **f642–f650 "lookout" (f650)**: the dashed ≈ **eye badge** (almond with pupil, `annotation`, dashed from the first frame) draws on the lookout's top edge, in the world (71 px wide) and in the Lens (96 px), completing on "lookout".
- **Field:** light pool on the Lens.
- **Sound:** `lens_open` f608.
- **Check:** the analogy is an overlay on the real always-on block (never on the "?" or the CPU), dashed with ≈; the real block stays visible under it.

### B12 · f671–f716 (22.37–23.87 s) · W0066–W0069 "not the hidden processor."
- **Idea:** the other block, the "?", is a different thing: still off, still unnamed.
- **Actions (D24):** **f663–f669** (pause after "lookout,"): Lens #2's ring and ticks fade to a 3 px grey rim while the view stays open. **f671 "not"**: the "?" badge (subject size 56) fills with emphasis over 6 frames; the "?" block stays OFF. f706–f712: the Lens closes and the badge unfills. f707–f713: "Always-on logic" exits.
- **Field:** light pool to the "?" at f671.
- **Sound:** `lens_close` f706.
- **End state:** the world at `board`, soft-off, eye badge on the lookout. **Check:** one emphasis device at a time (grey rim before the fill); two separate, differently shaped blocks.

### B13 · f717–f764 (23.90–25.50 s) · W0070–W0075 "It starts a chain of handoffs,"
- **Idea:** the lookout is link 1 of a chain that a press starts; this is a preview of after the press, and power is the first thing it arranges.
- **Composition (critic change C1):** the world holds at `board` behind a **45%** `void` scrim, with **no "later" window**: the world behind is the present (soft-off) and only the plates are the preview, so only the plates carry the not-now double rule. Six plates in one row (`row6`: 268 × 392, x 96–1824, y 352–744, gutters 24), each peeled from the real part it shows; content in the top 264 px (y 352–616), the rail through its centre (y 484), the **name inside the plate** (two 44 px lines from y 628, centred), as in 05's chain, the most legible on a phone in the test set. One 4 px rail, bridged across the gutters.

  | Plate | Peels from (screen rect at `board`) | Content | Rail stop (screen) |
  |---|---|---|---|
  | p1 | lookout region (674, 577, 154, 110) | world view, shot (696, 648) ×2.4: the lookout (lit, breathing, 173 × 86 px) with its feeds and the eye badge (48 px) | (230, 484) |
  | p2 | PSU (410, 797, 528, 128) | scene: PSU (base drawing, 211 px) centred on the rail, its empty 18 px main-channel stub rising from the cable exit (built: a stub reaching down to the rail clipped the PSU's inlet and rocker at the plate edge) | (522, 484) |
  | p3 | "?" region (850, 467, 110, 110) | world view, shot (848, 548) **×2.6**: the "?" block (off, 166 px) with its badge | (814, 484) |
  | p4 | CPU (685, 126, 286, 286) | scene: CPU (143 px, off) + SPI flash (drawn 1.9× for legibility) on the bus below it | (1106, 484) |
  | p5 | CPU | scene: CPU + M.2 below it | (1398, 484) |
  | p6 | CPU | scene: CPU + two DIMMs right of it | (1690, 484) |

  Built: the rail stops at each icon's edges (gaps ±90, ±114, ±86, ±74 px around the stops) instead of crossing the icon, and its light behind the Bit skips the same gaps.
- **Panels:** scrim f720–f732 (built: from f714 the MP4 dipped to 28.3 mean luma at f722); plates peel f714 + 3k (k = 0…5), 14 frames each (in place by f743), not-now double rule on each plate; content during the peel per `ENGINE.md §10.1`. Luma (critic's fills-only mock of this layout): 30.6 at a 45% scrim; the designer's 55% scrim with 248 × 260 plates mocked at **26.4, under the floor**. If a frame still measures under 28, lower the scrim to 40% (31.4); never lighten the plates' grounds.
- **Actions:** f716–f722 chip rolls to **After the press** (readable on **"starts" f722**). **f722**: the chain Bit appears resting on p1's rail stop, breathing (DRIVING); p1 becomes active (outer rule 4 px `ink`); name "Always-on logic" lands. **f734 → f748 "handoffs"**: hop 1 (292 px, 14 frames, cruise 33.7 px/frame, under the 36 cap) crosses gutter 1 over its bridge through ports (opened 4 frames before the Bit reaches the plate edge, closed 6 frames after it leaves); lands on p2's stub; the stub's amber fill-front runs up it f748–f752; p2 active; name "Power" lands.
- **Labels (plate names, inside the plates):** **Always-on / logic** (f722), **Power** (f748). All names exit f914.
- **Field:** pixel ripple at p2's rail stop f748 (L2, visible in the gutters and margins).
- **Sound:** `land` A f748, gain −4.
- **Check:** the world behind stays soft-off (CPU dark, main empty); "Power" is an amber power phase (no code); the order starts lookout → power; no counter.

### B14 · f765–f852 (25.50–28.40 s) · W0076–W0083 "each stage preparing what the next one needs,"
- **Idea:** control moves on one stage at a time, in a fixed order; earlier stages keep their state.
- **Actions:** f765–f771 chip steps to 34. **Hop 2 f767 → f781 "stage"**: lands on p3; the "?" flips ON (preview) and keeps a running pip; badge accent; p3 active. **Hop 3 f794 → f808 "what"**: lands on p4's CPU centre (the CPU outline stays grey: the parked Bit means "has control"); name "Firmware on CPU" lands. **Hop 4 f818 → f832 "needs,"**: lands on p5's CPU; name "Loader" lands; p4's CPU drops to **visited** (the D24 part state inside the plate: 3 px `annotation` outline, hollow pip); the active status moves to p5. Every hop crosses one gutter over its bridge through ports (open 4 frames before, close 6 after), the bridge lighting cyan behind the Bit.
- **Labels:** **Firmware / on CPU** (f808), **Loader** (f832).
- **Sound:** `land` C f781, D f808, E f832 (each −4).
- **Check:** order lookout → power → ? → firmware on CPU → loader; no landing on the flash, the SSD or a DIMM (the Bit lands on the CPU package each time); the "?" unnamed; no CPU outline turns `ink`, in the plates or in the world.

### B15 · f853–f913 (28.43–30.43 s) · W0084–W0087 "until Windows takes control."
- **Idea:** Windows is the end of the chain; the real screen is still dark, because this was a preview.
- **Actions:** **hop 5 f846 → f860 "Windows"**: lands on p6's CPU and **parks** (breathing); name "Windows" lands; p5's CPU drops to visited; p6 active. Hold to f899 (the parked Bit breathes; the lookout in p1 breathes). f900–f913 (pause): nothing new — the hold rule keeps the names to f914.
- **Labels:** **Windows** (f860). Must-read at f870: 8 (chip 0 at 34 px; 2 + 1 + 3 + 1 + 1).
- **Sound:** `land` G f860, gain −4.
- **End state:** the row complete: breathing lookout, filled power, running "?", two visited, Windows driving. **Check:** "Windows" as text only, no logo or UI; the world's monitor stays black.

### B16 · f914–f984 (30.47–32.83 s) · W0088–W0093 "So what is that hidden processor,"
- **Idea:** back to now; the "?" is the mystery the video will answer, and it stays where it is, unnamed.
- **Composition:** `chip` (from f952): the "?" block large (115 px, 23 px on a phone) with its subject badge, the lookout lit below-left, the plug at the lower left.
- **Camera:** K5 push f920–f952.
- **Panels:** f914–f918 names fade; plates fly back to their sources f914 + 2k, 12 frames each (preview states fading to the world's truth in their first 6 frames), done by f936; the chain Bit fades f914–f918; scrim lifts f914–f926; chip rolls to **Soft-off** (34) f914–f920; the eye badge leaves the lookout f914–f920. (No window to expand: one fewer motion in this congested window.)
- **Actions:** **f950 "hidden"**: the "?" badge (56 px) fills with emphasis (6 frames) and the tag lands.
- **Labels:** **Hidden processor?** (two lines "Hidden" / "processor?"; role part; built anchor: the block's lower-right corner (876, 576); slot (1480, 330) at `chip`, (1056, 580) at `ask`; exit f1072). Built: at (1440, 210) its second line sat on the PCIe slot; at (1056, 600) the ≈ arc ran behind it.
- **Field:** time breath f914–f924 (the return to now); light pool to the "?".
- **Check:** the "?" is unnamed and still in the chipset (never moved into the CPU); the plates leave nothing behind; soft-off intact.

### B17 · f985–f1067 (32.83–35.57 s) · W0094–W0103 "and how does one tap become a sign-in screen?"
- **Idea:** the question spans the whole journey, from one tap to a sign-in screen.
- **Composition:** `ask` (from f1025): "?" and chipset centre-left, the button low centre, the black monitor top right with a dashed sign-in card below it (outside the screen): the card's rect is room-plane (1490, 445, 213, 133), ≈ screen (1531–1770, 393–543) at `ask`, just right of the case edge (x 1512), over the field.
- **Camera:** K6 pull f985–f1025; the tag rides with its anchor.
- **Actions:** f985–f991 the badge unfills. **f999 "one"**: tag "One tap" lands; a dashed ≈ analogy arc (3 px `annotation`, 12/8) draws from the button's top across the board's lower right and up to the card, f999–f1029, its ≈ chip at the apex from f1014 (built: bowed downward, `bend` −0.32, so it passes under "Hidden processor?"). f1028–f1036: the card's dashed outline draws. **f1036 "sign"**: the card's contents fade in (avatar circle, one field, one button; no text, no logo) and "Sign-in screen" lands.
- **Labels:** **One tap** (role info; anchor `button.right`; slot (1110, 846); exit f1072); **Sign-in / screen** (two lines, so it stays inside title-safe; role part; built anchor: the deck point under the card's bottom-left (1500, 583.6), so the leader drops straight onto the key bar instead of crossing the text; slot (1556, 566) at `ask`; exit f1084). Must-read at f1040: 6.
- **Field:** light pool follows the arc's head, then the card.
- **Check:** the card is outside the monitor; the monitor stays black; no captured UI.

### B18 · f1068–f1158 (35.60–38.63 s) · W0104–W0113 "By the end, you'll know why restart can fix problems"
- **Idea:** a promise: there is a reason Restart can fix things.
- **Composition:** `monitor` (1560, 360, ×1.5; from f1118): the black monitor centre (≈ 939–1339 × 274–517); the board's right part (DIMM ends, M.2, graphics slot) in the left 810 px, keeping the frame's luma up (≈ 29.4 before labels); the fork and the chips below the monitor over the field; no part top face below y 932.
- **Camera:** K7 push f1066–f1118 (52 frames: the designer's 44-frame K7 peaked at exactly the 48 px/frame cap; this one peaks at 44). It starts in the pause after "screen?", so the exits below fall in its slow first 12 frames, while the camera has moved under 6% of the way.
- **Actions:** f1072–f1078 "Hidden processor?" and "One tap" exit; f1084–f1090 the arc, the card and "Sign-in screen" exit (the card rides with the monitor). **f1100–f1106 ("know why")**: a 4 px `structure` fork stem draws down from the monitor's foot (room plane (1630, 430)) to a node (room plane (1630, 472) ≈ screen (1139, 676)). It draws while K7 settles, so it is defined in room-plane coordinates and rides with the monitor (`ENGINE.md §13`). f1106–f1112: the left branch draws to room plane (1504, 500). **f1111 "restart"**: command chip **Restart** pops (4 frames) with its circular-arrow glyph drawing on over 8 frames (verbs get motion).
- **Labels:** command chip **Restart** (built box (841–1077, 729–785), centred under the left branch's end; exit f1251). Built: its restart glyph turns once on "fix" (f1134, 18 frames): the 46-frame still stretch f1120–f1165 is broken by a verb that moves.
- **Check:** generic chip, never a captured menu; nothing implies "always fixes".

### B19 · f1159–f1246 (38.63–41.53 s) · W0114–W0121 "that shutting down and starting again might not."
- **Idea:** the two look alike; why do they behave differently? The answer comes later.
- **Actions:** f1160–f1166 the right branch draws to room plane (1756, 500). **f1166 "shutting"**: command chip **Shut down** pops, its IEC power glyph drawing on. **f1194 "starting"**: **Why different?** lands under the chips, centred on the node (a short leader up to it, between the two chips). **f1216–f1232 "might not"**: both branches step to `textMuted` and back (a comparison pulse; no outcome is shown). Hold to f1251.
- **Labels:** **Shut down** (built box (1166–1473, 729–785), centred under the right branch; exit f1251); **Why different?** (role part; built: a plumb leader from the fork's node (anchor at the deck point under it, (1679.5, 449.5)) down to the key bar at (1137, 825), text right of it; exit f1251 ≥ f1194 + 48 and into the pause).
- **Check:** a question, not a result; the hedge stays in the voice; no mechanism.

### B20 · f1247–f1358 (41.57–45.27 s) · W0122–W0131 "We'll follow a typical Windows desktop with an Intel processor,"
- **Idea:** the machine on the map is the one the video follows: a typical Intel desktop.
- **Composition:** `desk` (built; `atlas` in the plan): the whole desktop (case, board, PSU, button, wall socket, monitor).
- **Camera:** K8 pull f1254–f1302 to `desk` (the monitor, a room object at parallax 0.9, dollies slightly against the case; the scope line draws while the camera settles and is anchored in the world; at `desk` it runs at y 204–929, clear of the header zone).
- **Actions:** f1251–f1257 fork, chips and "Why different?" exit. **f1269 "typical"**: a 3 px `annotation` scope line traces once round the desktop (the case and the monitor; the wall socket stays outside) f1269–f1299, holds, fades f1330–f1338. **f1316–f1322 "Intel" (f1321)**: chip rolls to **Intel desktop**.
- **Labels:** chip **Intel desktop** (44 px).
- **Field:** light pool centred (wide, on the whole machine).
- **Check:** text only, no logos; separate ATX PSU, LGA1700 package, separate chipset; nothing in the caption band.

### B21 · f1359–f1437 (45.30–47.90 s) · W0132–W0137 "with stops for AMD and laptops."
- **Idea:** the video makes two stops, and each shows what really differs: on AMD both blocks live in the processor; on laptops the lookout is its own chip, with a battery and no power supply.
- **Composition:** `desk` (built) with the `pairRight` plates over the right side (x 1100–1776; y 150–510 and 534–894); the CPU, chipset, PSU and standby path stay visible on the left.
- **Panels:** **p-AMD** peels f1368–f1382 from the CPU + chipset (screen ≈ (624, 232)–(873, 692)); **p-laptop** peels f1394–f1408 from the chipset + PSU (≈ (403, 517)–(863, 900)). Rule: a single 3 px `structure` rule (these are other machines in the present, not another time or a what-if, so no double rule); the active status (outer rule 4 px `ink`) is on AMD from f1382, moves to laptops at f1408 and is **released at f1438** ("That", the next sentence) so the eye returns to the lookout.
- **Content (critic change C6):** each plate is a `tween` (`ENGINE.md §10.5`) between two SceneSpecs, with the content area below the caption (≈ 628 × 256 px). Blocks are standalone `logicBlock` parts at **scale 1** in both scenes, so they keep their Intel size (lookout ≈ 71 × 35 px, the "?" with its 44 px badge).
  - **p-AMD.** From: Intel CPU (260 × 260) left; chipset (260 × 190) right, with its two blocks. To: `amdPackage` on the CPU's rect (x-ray heat spreader, two CCDs, an I/O die 100 × 132) with both blocks in the I/O die; the chipset's x-ray window closes (`xray` 1 → 0), so it stays as a **plain package** with no blocks. AMD boards keep a chipset for extra I/O, but neither block lives there.
  - **p-laptop.** From: chipset with its blocks above the PSU. To: `laptopBoard` with `socPackage` (150 × 150), the `ecChip` (104 × 72) and `battery`. The PSU's rect tweens into the battery's. The lookout moves into the EC (still breathing). The "?" moves into the SoC package while the separate chipset fades (guardrails: no separate chipset on a laptop by default; CSME sits "within the PCH / SoC").
  - **End states:** AMD package with both blocks (lookout lit, "?" dim with badge) beside a plain chipset. Laptop: SoC with the dim "?", EC with the lit lookout, and a battery; no ATX power supply, no rocker, no +5VSB, no separate chipset, and the "?" never simply vanishes. Both hold through S10a.
- **Actions:** **f1382 "AMD"**: caption lands; tween f1382–f1398. **f1408 "laptops"**: caption lands; tween f1408–f1424.
- **Labels:** captions **Stop: AMD** and **Stop: laptops** (44 px, inside each plate's top-left; exit f1505). f1382–f1388 chip steps to 34. Must-read at f1420: 4.
- **Field:** light pool on each plate in turn (derived from the active plate).
- **Check (probe 5):** the AMD drawing is not a copy of the Intel layout and does not reuse the Intel x-ray chipset; the laptop has no ATX PSU, rocker, +5VSB or separate chipset; blocks at their Intel size; plates big (676 × 360) and on screen 4.1 s; no logos.

### B22 · f1438–f1512 (47.93–50.40 s) · W0138–W0143 "That lookout runs on standby power,"
- **Idea:** the lookout is fed by a thin standby line from the power supply.
- **Actions:** **f1438 "That"**: the stop plates' active status is released (both rules back to 3 px `structure`), handing attention back to the world. **f1447 "lookout"**: the lookout's glow swells 0.20 → 0.35 → 0.20 over 12 frames (`glow[].swellAt`, pointing at it). **f1469–f1480 "standby" (f1475)**: tag lands on the standby channel at the 24-pin end, its mono line at f1479. **f1505–f1517** (pause after "power,"): the stop plates fly back into the world (stagger 2, 12 frames), captions fade f1505–f1509; chip rolls to **Soft-off** (34) f1505–f1511.
- **Camera:** K9 glide f1506–f1548 to `column` (524, 760, ×1.22); the tag rides to its `column` slot.
- **Labels:** **Standby power** / **+5VSB · ATX** (role standby, left-side tag; anchor the standby channel at (676, 775); slot (170, 700) at `desk`, (712, 470) at `column` (built: at y 408 the leader's vertical ran along the amber channel); exit f1685). The only mono technical line of the intro.
- **Field:** light pool on the lookout (f1447), then the standby channel (f1475).
- **Sound:** `standby` span starts f1475.
- **Check:** the channel is thin (10 px) and dim amber; no wattage; "+5VSB" at the 24-pin end, never "5 V" at the chipset; stops gone by f1513.

### B23 · f1513–f1588 (50.43–52.97 s) · W0144–W0151 "a small trickle the power supply keeps flowing"
- **Idea:** standby keeps flowing while the main power stays empty.
- **Composition:** `column` (from f1544): the power column (plug, inlet, rocker, PSU's left half, standby path, regulators, lookout) in the frame's middle third (x 680–1240), the button and LAN chip in frame too, the wall socket at the left.
- **Actions:** **f1519 "small"**: shimmer v2 starts on the standby channel (48/48 dashes, ΔL* 10, 1.5 px/frame toward the lookout) and runs to f1817. **f1541–f1552 "power supply" (f1547)**: the name lands inside the PSU body (leaderless). **f1565 "keeps"**: pill "Main rails: OFF" docks **under** the PSU body; the main channel's walls are pointed at f1565–f1589.
- **Labels:** **Power / supply** (two-line name in the PSU right of the fan, box ≈ (985–1120, 598–699); exit f1685); pill **Main rails: OFF** (docked 14 px under the PSU, box ≈ (900–1235, 762–808), over the field; exit f1685). Critic: at `column` the fan spans x ≈ 852–960, so the designer's one-line name (from x 950) and pill (from x 900) covered the fan, the 03 fault the Quality Report flagged ("pills sit on the power supply and hide its fan"). Inside the 560 px centre band there is no room right of the fan for the 335 px pill. Must-read at f1570: 7.
- **Field:** light pool on the channel, then the PSU.
- **Check:** main rails off (canonical wording); standby reaches only the regulators and the lookout; the fan does not spin.

### B24 · f1589–f1680 (52.97–56.00 s) · W0152–W0161 "whenever it's plugged in and its rear switch is on."
- **Idea:** two conditions keep the trickle alive: the plug and the rear switch. Take either away and the lookout goes dark.
- **Composition:** the **triptych** (bible §9.7): the centre band x 680–1240 is the present (single rule); identical live copies slide out from under it to x 96–656 and 1264–1824 (not-now double rule), y 140–920. Labels stay in the centre band. The main view is clipped to the centre band while the split is open, so the field fills the gutters and margins (luma ≈ 31.8). At `column` (524, 760, ×1.22) everything a what-if needs lies inside a band: the pulled plug clears the band's left edge by 14 px and the lookout clears the right edge by 26 px (its pip docks inside the block). At the designer's ×1.30 the pulled plug was cut off by 24 px. The rocker (26 × 50 world, 3 px I/O marks) is 32 × 61 px on screen.
- **Panels:** split opens f1589–f1601 (centre rule draws f1589–f1597; side bands slide 12 frames, `move`). Built: the copies slide out from under the centre band OVER the present, which settles into the centre band over the last 6 frames (shrinking it first left the frame mostly field: 27.0 mean luma in the MP4 at the fold); the fold reverses it. The plug's cord follows the pulled plug (`cord.seated`); the drains retreat at 20 px/frame (7 frames).
- **Actions:** **f1610 "plugged"**: left band: caption "Unplugged" lands; the plug pulls out (seated 1 → 0, f1610–f1616, pins visible); the standby fill retreats into the PSU f1616–f1623; the lookout flips OFF f1624–f1629 (glow off). **f1639 "rear"**: right band: caption "Rear switch off" lands; the rocker flips to "O" f1639–f1642; the standby fill retreats f1644–f1651; the lookout flips OFF f1652–f1657. The centre band keeps breathing and shimmering. Hold to f1685.
- **Labels:** band captions **Unplugged** (built slot (144, 766)) and **Rear switch off** (built slot (1312, 766)), under the power supply over the field, in line with the centre band's "Main rails: OFF" pill (a band is a live view of the world: at y 164 "Rear switch off" sat on the rear I/O shield); both exit f1685. Must-read at f1660: 11 (2 + 2 + 3 + 1 + 3; mono supporting).
- **Field:** light pool on the left band's plug (f1610), then the right band's rocker (f1639), then back to the centre (f1660).
- **Sound:** none for the what-ifs (sound marks real causes).
- **Check (probe 2):** each copy goes dark only after a visible cause and a drain; the real band stays alive; the rocker is a real mains switch.

### B25 · f1681–f1745 (56.03–58.20 s) · W0162–W0168 "It powers just enough of the motherboard"
- **Idea:** only a small region of the board is powered.
- **Composition:** `column`, full frame again; built: K9b glides to `wake` (f1699–f1735) on "just enough of the motherboard".
- **Panels:** f1685–f1691 "Standby power", "Power supply", "Main rails: OFF" and the band captions exit; side bands slide back under the centre f1685–f1697; the centre rule fades f1691–f1697.
- **Actions:** **f1697–f1705 ("just" f1695)**: the powered-domain wash fades in over the standby domain only (built: laid OVER the parts as energy at 16 %, which equals `energyWash` on the board; under the parts only a sliver by the regulators showed, because the domain's top lies inside the chipset) (regulators, the corridor from the 24-pin and a patch round the lookout; the "?" outside it); "Standby-powered" lands with it.
- **Labels:** **Standby-powered** (role standby, left-side tag; anchor the domain's left edge at the regulators (652, 712); slot (650, 443) at `column`, (377, 560) at `wake`; exit f1832).
- **Field:** light pool on the wash.
- **Check:** CPU, RAM, SSD, monitor and LED unpowered; the "?" not in the domain; the wash 1.37:1 and lighter than the board.

### B26 · f1746–f1797 (58.20–59.93 s) · W0169–W0175 "to notice a reason to wake up,"
- **Idea:** the lookout listens for several possible reasons to wake; the button is one of them.
- **Actions:** **f1746 "notice"**: two wake routes draw into the lookout in `textMuted` (pointed at): network jack → LAN chip → lookout's left side (f1746–f1756) and the chipset's clock (RTC alarm) → lookout's top (f1750–f1760); the net-jack glyph (on the RJ45) and the clock glyph (56 px) pop in 6 frames; the button's own route steps to `textMuted` f1746–f1770. **f1755–f1766 "reason" (f1761)**: "Wake sources" lands. f1770–f1790: all three routes settle to `structure` grey (dim, unlabelled).
- **Labels:** **Wake sources** (role info, left-side tag; built anchor: the wake route's corner (617, 648) left of the lookout's input, so the leader never crosses the route; slot (433, 455) at `wake`; exit f1832). Built: the net-jack and clock glyphs settle to grey with their routes at f1776 and stay to the last frame (their routes need their sources). Must-read at f1770: 3. The two wake routes are `hidden` RouteSpecs revealed by `draw` RouteEvents and returned to grey by `settle` events (`ENGINE.md §8`).
- **Field:** light pool on the lookout.
- **Check:** button, network jack and clock (no graphics slot); the others stay grey and unlabelled (settings-dependent); no steady cyan anywhere.

### B27 · f1798–f1829 (59.93–60.97 s) · W0176–W0178 "like that button."
- **Idea:** that button, one of those inputs, is how the lookout gets woken.
- **Actions:** **f1798 "like"**: brackets (4 px emphasis, 14 px serifs) lock on the button (snap f1793–f1798, 4.1% overshoot); the button's route stays grey. f1818–f1824: brackets fade.
- **Field:** light pool on the button.
- **Sound:** `lock` f1798; the `standby` span ends f1817.
- **Check:** emphasis on the button, never on the standby wire; one emphasis device; no power through the button.

### B28 · f1830–f1850 (61.00–61.67 s) · W0179–W0180 "Now press."
- **Idea:** the real moment: from soft-off, the press.
- **Actions:** f1825–f1831 chip rolls to **Now** (44 px, readable on **"Now" f1830**). f1832–f1838 "Standby-powered" and "Wake sources" exit (hold rule: S11 end + 15). **f1837 "press."**: the cap travels (press 0 → 1 f1837–f1839, contact f1838), releases f1843–f1848; **f1838**: the Bit departs on `pwrbtn` (lands f1891: a 53-frame run, `allowLong`, carried by the camera, with a 2-frame ease-out (`decel: 2`) so it is still cruising at f1889; cruise 9.2 world px/frame).
- **Camera:** K10 carry starts f1840.
- **Field:** press ring from the button f1837–f1861; light pool rides the Bit.
- **Sound:** `button` f1837 (full level, the loudest effect).
- **Check:** soft-off intact at the press (wash on, lookout breathing, "?" OFF with badge, main empty, LED off, plug seated and in frame); the pulse heads for the header, never the "?" or the CPU.

### B29 · f1851–f1889 (61.70–63.00 s) · tail (audio ends at 62.000 s)
- **Idea:** the signal is on its way; the story continues without a break.
- **Actions:** the Bit climbs the lead, crosses the header and runs along the trace; the camera carries toward the lookout (at f1889 zoom ≈ 1.88, centre ≈ (611, 734); the PSU's bottom edge at y ≈ 882, the plug at ≈ (497, 731)); at **f1889** the Bit is on the final vertical into the lookout, ≈ 6 world px short, still at cruise (≈ 17 px/frame on screen) with its pixel trail extended and the route lit behind it; it would land on "power" (W0184, f1891).
- **Check:** no main power, fans, LED or screen by f1889; the Bit has not landed and is not at the "?" or the CPU; the plug is in frame above y 932.

---

## 5. Shared anchors (A4), as staged here

| Frame | A4 event | Here | Beat |
|---|---|---|---|
| f0 | cap pressed on "Press" | press 0 → 1 f0–f2 | B01 |
| by f8 | "After the press" 44 px | roll f2–f8 | B01 |
| f33 → f59 | flash-forward Bit, ripple only, no park | `ff` run 26 frames; absorbed | B01–B02 |
| f91 | CPU stays dark on "doesn't go first" | "Not first"; CPU unchanged | B02 |
| f294 | "?" wakes | flip ON + glow moves | B05 |
| f327–f346 | return to soft-off, "Soft-off" label | window expands, states revert, chip by f340 | B06 |
| f472 → f498 | S04 demonstration, no cap travel, no click | `s04` run; ripple only | B08–B09 |
| f671 | D24: rim grey f663–f669, "?" fills | Lens #2 settle, badge fill | B12 |
| f748, f781, f808, f832, f860 | chain landings, park on "Windows" | row6 hops | B13–B15 |
| f1194 | "Why different?" holds ≥ 48 frames, into the pause | lands f1194, exits f1251 | B19 |
| f1798 | brackets lock on the button | snap f1793–f1798 | B27 |
| f1830 | "Now" chip | roll f1825–f1831 | B28 |
| f1837 | real press: cap travels, Bit departs | cap f1837–f1839, Bit f1838 | B28 |
| f1889 | Bit still travelling (lands f1891) | `real` run, carried | B29 |

---

## 6. Every label (text, word, land, exit, hold rule)

Hold rule = max(land + 30 + 9 × words, sentence end + 15). Tags land on their word's start (± 3).

| Text | Kind | Word | Land | Exit start | Hold min | Role |
|---|---|---|---:|---:|---:|---|
| After the press | chip | — | by f8 | f334 | — | — |
| Power button | tag | W0004 power | 29 | 142 | 142 | part |
| Main processor | tag | W0008 main | 67 | 327 | 142 | part |
| Not first | tag | W0010 doesn't | 91 | 327 | 142 | part |
| 0 instructions | readout | W0017 single | 163 | 341 | 341 | — |
| Soft-off | chip | (return) | 340 | 436 | — | — |
| Power button | tag | W0033 button | 344 | 442 | 442 | part |
| Signal only | tag | W0037 actually | 380 | 442 | 442 | info |
| Main power: OFF | pill | W0040 power | 410 | 608 | 442 | — |
| When pressed | chip | W0043 sends | 441 | 519 | — | — |
| Always-on logic | tag (2 lines) | W0050 small | 498 | 707 | 622 | part |
| Always-on logic | plate name (inside) | W0071 starts | 722 | 914 | 914 | — |
| Power | plate name (inside) | W0075 handoffs | 748 | 914 | 914 | — |
| Firmware on CPU | plate name (inside) | W0079 what | 808 | 914 | 914 | — |
| Loader | plate name (inside) | W0083 needs | 832 | 914 | 914 | — |
| Windows | plate name (inside) | W0085 Windows | 860 | 914 | 914 | — |
| Hidden processor? | tag (2 lines) | W0092 hidden | 950 | 1072 | 1072 | part |
| One tap | tag | W0097 one | 999 | 1072 | 1072 | info |
| Sign-in / screen | tag (2 lines) | W0101 sign | 1036 | 1084 | 1084 | part |
| Restart | command chip | W0110 restart | 1111 | 1251 | 1251 | — |
| Shut down | command chip | W0115 shutting | 1166 | 1251 | 1251 | — |
| Why different? | tag | W0118 starting | 1194 | 1251 | 1251 (≥ 1242) | part |
| Intel desktop | chip | W0130 Intel | 1321 | 1505 | — | — |
| Stop: AMD | caption | W0135 AMD | 1382 | 1505 | 1439 | — |
| Stop: laptops | caption | W0137 laptops | 1408 | 1505 | 1456 | — |
| Standby power / +5VSB · ATX | tag | W0142 standby | 1475 (+4) | 1685 | 1685 | standby |
| Power / supply | name in part (2 lines) | W0148 power | 1547 | 1685 | 1685 | — |
| Main rails: OFF | pill (docked under the PSU) | W0150 keeps | 1565 | 1685 | 1685 | — |
| Unplugged | band caption | W0154 plugged | 1610 | 1685 | 1685 | — |
| Rear switch off | band caption | W0158 rear | 1639 | 1685 | 1685 | — |
| Standby-powered | tag | W0164 just | 1697 | 1832 | 1832 | standby |
| Wake sources | tag | W0172 reason | 1761 | 1832 | 1832 | info |
| Now | chip | W0179 Now | 1830 | — | — | — |

Notes: "Not first", "Always-on logic", "Main power: OFF" and "Main rails: OFF" are the canonical wordings (shared rules); "Rear switch off" and "Unplugged" caption the what-if bands (each ≤ 3 words, each landing with its cause); "+5VSB · ATX" is the only mono line. No label sits in the caption band; every text box is inside x 144–1776, y 96–940.

---

## 7. Sound cues (`src/styles/style6/cues.json`, derived and checked by `deriveCues`)

```json
{ "style": 6, "cues": [
  {"cue": "button", "frame": 0, "gain_db": -4},
  {"cue": "land", "frame": 59, "note": "A", "gain_db": -4},
  {"cue": "lens_open", "frame": 197},
  {"cue": "lens_close", "frame": 331},
  {"cue": "land", "frame": 498, "note": "A", "gain_db": -4},
  {"cue": "lens_open", "frame": 608},
  {"cue": "lens_close", "frame": 706},
  {"cue": "land", "frame": 748, "note": "A", "gain_db": -4},
  {"cue": "land", "frame": 781, "note": "C", "gain_db": -4},
  {"cue": "land", "frame": 808, "note": "D", "gain_db": -4},
  {"cue": "land", "frame": 832, "note": "E", "gain_db": -4},
  {"cue": "land", "frame": 860, "note": "G", "gain_db": -4},
  {"cue": "standby", "start": 1475, "end": 1817},
  {"cue": "lock", "frame": 1798},
  {"cue": "button", "frame": 1837}
]}
```
Minimum spacing 26 frames; no cue for the window, peels, split, camera or field.

---

## 8. Budgets at the busiest frames

| Frame | Tags | Pills | Must-read words | Emphasis | Bits | Glowing parts |
|---|---:|---:|---:|---|---:|---|
| f100 | 3 (Power button, Main processor, Not first) | 0 | 9 | none | 0 | lookout |
| f300 | 2 + readout | 0 | 6 | Lens ring | 0 | "?" |
| f420 | 2 | 1 | 7 | none | 0 | lookout |
| f660 | 1 | 0 | 2 | Lens ring | 0 | lookout |
| f870 | 0 (5 plate names) | 0 | 8 | none | 1 | none |
| f1040 | 3 | 0 | 6 | none | 0 | lookout |
| f1200 | 1 + 2 command chips | 0 | 5 | none | 0 | none |
| f1480 | 1 | 0 | 6 (chip 34 px) | none | 0 | lookout |
| f1660 | 1 + name + 2 captions | 1 | 11 | none | 0 | lookout (centre band only) |
| f1800 | 2 | 0 | 3 | brackets | 0 | lookout |

---

## 9. Motion audit (foreground events under speech; the living field always moves)

Longest gaps between foreground events (state, label, glyph, camera, Bit, panel, channel) while the voice speaks: f212–f256 (44 frames, between the two badge accents), f96–f137 (41), f510–f551 (41), f1119–f1160 (41), f1705–f1746 (41, the shimmer runs throughout). Every gap ≤ 45 frames (the five tests reached 63–84). Primary motions never overlap except camera + Bit in the three carries (K1, K3, K10) and camera + plates returning in f920–f936 (one primary, two secondary). After the critic changes the two congested windows each lose a primary motion: f706–f743 holds the Lens close, one tag exit, the scrim and the peel stagger (no window contraction), and f914–f952 holds the plates' return, the scrim and K5 (no window expansion). `motionGapReport` warns if any 30-frame window holds more than two camera, panel or Lens moves.

---

## 10. Known weaknesses of the five tests, and how this storyboard solves each

| Weakness (Quality Report) | Fix here | Where |
|---|---|---|
| 03: light, generic look (brand 6) | Dark thumbnail palette, 2.5D gunmetal parts, the Bit's pixel trail, the Lens, light-as-information | everywhere |
| 03: parts 7–15 px on a phone at system view | Most beats at `power`/`chip`/`column`; the "?" 23 px at `chip`; Lens views at 300 px; plates at 248 px | B04, B07, B09, B11, B16, B23 |
| 03: sterile, empty space | The world fills 42%+ of every frame; the living field fills the rest | — |
| 02: cuts break the single view | Zero cuts; carries, glides, peels and splits | §2 |
| 02: wide shots faint on phones (< 3:1 at 480p) | `structure` 5.37:1, filled bodies, rim light; the widest shot (`atlas`) used only for S09 | §1, B20 |
| 02: per-chapter set and camera cost | One world + shots + script data | `ENGINE.md` §14 |
| 02: busy dolly | Zoom cap ×1.8/12 fr, pan cap 48 px/fr, every move motivated | §2 |
| 05: split attention, dot-sized parts | Panels only for the chain, the stops and the triptych; big actors | B13–B15, B21, B24 |
| 05: hard page changes | Peel/return match moves, slides, window contract/expand | B13, B16, B21, B24 |
| 05: "Diagram" chips feel like UI | None: the double rule alone says "not now" | §3 |
| 05: largest code | Shared engine and icon registry; the intro is data | — |
| Probe 5 weak everywhere | Two large stop plates (676 × 360), on screen 4.1 s, with animated morphs showing the real difference | B21 |
| Artwork in the caption band | At holds no label, Bit, route, channel, plate or part top face below y 932 (computed for all ten shots); only grounds and dark 2.5D sides may enter | §2 |
| Wake routes barely visible | Routes drawn on in `textMuted`, 56 px glyphs, then settled grey | B26 |
| Standby shimmer barely visible | Shimmer v2: 48/48 dashes, ΔL* 10, 1.5 px/frame, from f1519 | B23–B27 |
| "?" tiny on a phone | Badge 44 px (56 as subject); Lens view ≈ 300 px; `chip` shot | B04, B12, B16 |
| Static backgrounds | The living field (drift, light pool, press rings, pixel ripples, time breath) **plus board vias that show the pool and ripples on the board itself** (critic: at most shots the case covered the field's reactions) | all |

**Gaps the critic found in this storyboard, now closed** (STYLE_BIBLE "Critic changes" has the full list):

| Gap (computed or read) | Fix | Where |
|---|---|---|
| S06 at a 55% scrim mocked at 26.4 mean luma, under the floor | Taller plates with the names inside; 45% scrim (30.6) | B13 |
| The S06 "later" window framed a present-tense world | No window in S06; the plates alone are "not now" | §3, B13, B16 |
| `monitor` put parts in the caption band for 4.6 s; K7 sat at the pan cap | New `monitor` shot, the flash moved, K7 52 frames, fork in room-plane coordinates | §1, §2, B18–B19 |
| The triptych cut off the pulled plug | `column` (524, 760, ×1.22) | §2, B24 |
| "Main rails: OFF" and "Power supply" covered the fan | Pill under the PSU, two-line name | B23 |
| The AMD chipset faded away (claims "no chipset"); the laptop's "?" vanished (claims "no hidden processor") | Plain AMD chipset stays; the laptop's "?" moves into the SoC | B21 |
| The stop plates kept the active rim while the voice moved on | Released at f1438 | B22 |
| Storyboard elements with no engine API (Lens leader before the ring, cable-only ink, drawn wake routes, the chain rail, the glow swell, the card position, "?" size in a Lens) | Added to `ENGINE.md` and tokens | B03, B07, B10, B13, B17, B22, B26 |

---

## 11. What a beginner should answer after one viewing (the probes)

1. **Who acts first; what stays dark?** "A small always-on block in the chipset gets the press; then a hidden '?' processor works; the big main processor stays dark (0 instructions)." (B01–B05)
2. **What is awake while off; what does it need?** "The always-on logic, on a thin standby line from the power supply; unplug it or flip the rear switch off and it goes dark." (B22–B24)
3. **Is the lookout the hidden processor?** "No: two different blocks; the lookout has the eye; the '?' is the other one." (B11–B12)
4. **Where does the signal go, and not go?** "Up a thin wire that ends at the motherboard's header, then to the always-on logic; never into the power supply, which stays off." (B07–B09)
5. **What changes on AMD and laptops?** "On AMD both blocks are inside the processor; on a laptop the lookout is its own chip, with a battery instead of a power supply." (B21)

---

## 12. Checks that prove the whole storyboard (run by the builder)

1. `node tools/anchors.mjs` passes; `checkAnchors` reports every row of §5 within ±1 frame.
2. `checkTagSync`: every label in §6 lands within ±3 frames of its word and exits no earlier than its hold minimum.
3. Stills at every beat start and end and every anchor ±2, at full size and `--phone`, plus a 480p encode: every must-read label reads at 390 px; idle outlines ≥ 3:1 at 480p.
4. `--luma` on all stills and a full per-frame luma pass on the final: every frame ≥ 28 (target 31–42). The critic's fills-only mock-ups give a lower bound to check against: shots 29.4–36.6, S06 at a 45% scrim 30.6, the open triptych 31.8, the S09 pair 34.9. The riskiest frames are the `monitor` hold f1118–f1254 and S06 f724–f914.
5. `checkProofOfPower` (holds and lookout-subject frames; a 12-frame move grace) and `checkSafeAreas` silent; at holds no label, Bit, route, channel, plate or part top face below y 932 (grounds and dark 2.5D sides may cross).
6. `zoomRateReport` ≤ ×1.8, `panSpeedReport` ≤ 48, `bitScreenSpeedReport` ≤ 36.
7. With `debug.fieldOff`, no foreground still run > 45 frames under speech; with the field on, no run of identical frames longer than 6 (the field drifts in whole-pixel steps every 6 and 10 frames).
8. `checkCues` silent (cues.json equals the derived list); spacing ≥ 6 frames.
9. The five probes of §11 answered from one still per beat at 390 px.
10. Accuracy red lines (guardrails §0) checked at every anchor ±2 and every plate/band frame: CPU never lit; the button's line ends at the header; lookout ≠ "?"; blocks in the right places on Intel, AMD and laptop; "?" unnamed; soft-off = plugged in with the switch on; standby thin with no wattage; metaphors as overlays; no logos or captured UI; the button is one of several wake reasons.


---

## 13. As built (10 October 2026): deviations from this storyboard and why

Every deviation is also written into the section it changes. Beats, words, anchors and the cue list are unchanged.

| Where | Storyboard | Built | Why (how found) |
|---|---|---|---|
| §2 `monitor` | (1560, 360) | (1560, 350) | The button's board trace (world y 712) crossed the caption band at y 1068 for the whole S08 hold (dev check). |
| §2 K2 | f346 | f357 ("pressed") | Window expand f327, Lens close f331 and K2 f346 were three primary moves in 30 frames (`motionGapReport`). |
| §2 K3 | 40 frames | 52 frames | The S04 Bit reached 37.0 px/frame on screen (cap 36); 52 frames give 35.4. |
| §2 S09 shot | `atlas` (1005, 525, ×0.92) | `desk` (1005, 489, ×0.85); `atlas` stays the parallax reference | At `atlas` the scope line ran at y 145, through the "Intel desktop" chip's underline (still f1321). Known: at `desk` the "Standby power" leader still clips the 24-pin's corner for its first 31 frames (as it did at `atlas`); clean at `column`. |
| §2 K9b, shot `wake` | none | glide f1699–f1735 to (720, 680, ×1.4) | After the fold, `column` left the left 38 % and the bottom third of the frame to the field for 4.8 s (stills). K10 now starts from `wake`; f1889 is zoom 1.90 at (631, 725). |
| §3 chip | "Soft-off" through S10 | rolls out at f1589, back at f1691 | Its rule touched the left band's top edge (still f1640). |
| B01 | Bit appears at f33 | rests on the cap from f12 | The press visibly makes the signal; 21 frames of rest. |
| B02–B03, B09, B22, B25–B26 | key bars on the left | left-side tags (right-aligned text, key bar toward the part) and the slots listed in each beat | Leaders crossed their own text (stills). |
| B07 pill | screen box | world-anchored dock (555, 861) | A screen-fixed pill floated off the PSU during K3/K4. |
| B13 | scrim f712 | scrim f720 | MP4 mean luma 28.3 at f722. |
| B13–B15 plates | rail through the icons; p2 stub down to the rail | rail meets the icons' edges; p2 PSU centred on the rail with its stub rising; p4 flash drawn 1.9× | The rail crossed the "?" badge (stills); the stub layout clipped the PSU's inlet and rocker. |
| B16–B17 "Hidden processor?" | anchor `q.right`, slots (1440, 210) / (1056, 600) | anchor (876, 576), slots (1480, 330) / (1056, 580) | Its second line sat on the PCIe slot; the ≈ arc ran behind it. |
| B17 arc | bows up | bows down (`bend` −0.32) | Same: it now passes under the label. |
| B17 "Sign-in screen" | anchor card bottom centre | deck point under the card's bottom-left | The leader crossed the text. |
| B18–B19 | chips at (819, 716) / (1179, 716) | (841, 729) / (1166, 729); restart glyph turns on "fix" | Chips centred under the branch ends at the new `monitor`; the f1120–f1165 still run was 46 frames. |
| B21 tweens | parts fade out t 0–0.5, in 0.5–1 | out 0–0.6, in 0.4–1 | The laptop plate showed only the two moving blocks for ~4 frames. |
| B24 | captions at y 164 | at y 766 | "Rear switch off" sat on the rear I/O shield (band views are live worlds). |
| B24 split | clip first, bands over the field | bands slide out over the present, clip trails 6 frames | MP4 luma 27.0 at the fold (f1692). |
| B24 band drains | 50 px/frame (3 frames) | 20 px/frame (7 frames) | The storyboard's f1616–f1623 timing. |
| B25 wash | under the parts | over the parts, energy 16 % | Under the chipset only a sliver showed (still f1800). |
| World | pips on every non-passive part | no pips on DIMMs, M.2, LAN, SPI flash, PSU, monitor (and their scene copies, the battery) | Rows of hollow squares read as UI noise; pips stay on the CPU, the lookout and the "?". |
| Field (bible §5) | vias 48 px pitch, land +0.30, press +0.35; grid land +0.25, press +0.35 | vias 24 px, land +0.55, press +0.65; grid land +0.45, press +0.55 | The press ring and land ripples were invisible at full size (stills). Tokens and STYLE_BIBLE §5 changed together. |

**Checks of the build (frame inspection and measurement only; nobody watched it in real time or listened):** every dev check silent (anchors, tag sync, budgets, proof of power, safe areas, camera rates, Bit speeds, motion gaps, cues); MP4 mean luma 28.8–40.7 on all 1,890 frames (decoded BT.709); longest identical run 6 frames; longest foreground still under speech 32 frames (field off; 42 counting breathing as still); idle outlines 3.6–5.7:1 on a 480p encode.


---

## 14. Round 1 (judges' review, 10 October 2026): what each beat now does

Every frame below is derived in `ep01/script.ts` from a word, a sentence, a pause or an A4 deadline (`lint-times.mjs` passes); the frame numbers are given for reading. A4 anchors are unchanged (`node tools/anchors.mjs`: OK) and `cues.json` is unchanged (the derived cue list matches it).

| Beat | Frames · words | Round 1 |
|---|---|---|
| B01 hook | f0–f58 · "Press your PC's power button," | On "Press" two `ink` press-wave rings leave the button (f0, the second at f5), the field sends a two-step pixel wave across the frame and current pulses outward along the deep traces; the camera pushes ×1.04 about the button (K0 f0–f22, the button fixed on screen); the Bit appears on the cap at f3 (`restFrom`). The "After the press" chip is in by f2 (52 px). |
| B02 | f59–f136 · "and your main processor doesn't go first." | The landing at f59 is the signature landing on the lookout (`receiver`): its outline ripples outward, the Bit sheds the monogram's three pixels, the lookout's glow swells (ripple only: no state or glyph change, A4). The route stays dimly lit until ~f113 (afterglow). No pip on the CPU. |
| B04 | f200–f293 · "a smaller processor…" | "Smaller / processor" lands leaderless under Lens #1 on "smaller" (f206) and leaves as the Lens closes (f331, `holdWaiver`). The "?" badge is 52 px. |
| B06 | f327–f364 | "0 instructions" leaves with the S01 tags at f327 (was f341). |
| B11–B12 | f600–f716 | Lens #2 (on the lookout) is `ink`; the D24 settle is unchanged (f663 grey rim); on "not" (f671) the "?" gets its pointer: a dim tint and a dashed magenta ring (no bright fill). |
| B13 | f707–f764 · "It starts a chain of handoffs," | Scrim from f708 over 36 frames; plates peel in chain order from their own parts, 5 frames apart: p1 lookout f712, p2 power supply f717, p3 "?" f722, p4 SPI flash f727, p5 M.2 f732, p6 monitor f737 (all home by f751). Each plate is a recomposed scene on its own ground: p1 the lookout with its standby line and eye; p3 the "?" alone; p4–p6 a 78 px CPU on the rail with the stage's hero below it (the flash, the M.2, the dashed sign-in card). |
| B14 | f765–f852 | While p4 and p5 are active their bus holds a lit level (flash → CPU, then SSD → CPU). Plate 3's caption is "Smaller / processor" (the words of S02). |
| B15 | f853–f913 · "until Windows takes control." | On "takes" (f875) the dashed sign-in card draws on in p6. |
| B16 | f914–f984 · "So what is that hidden processor," | Plates fly home in reverse order from f914, 3 frames apart (p6 first, p1 last, home by f941); the scrim lifts from f920; K5 to `chip` waits until f941. The S07 "?" pointer on "hidden" (f950). |
| B17 | f985–f1067 | Unchanged (K6 `ask`, arc, card, "Sign-in screen"). |
| B18–B19 | f1066–f1251 · "By the end, you'll know why restart can fix problems that shutting down and starting again might not." | K7 (f1066–f1106) to `promise`: the whole PC on the left, its black screen on the right. "Restart" (f1111) draws a closed loop beside its chip (f1115), loop and glyph spin once on "fix" (f1134). "Shut down" (f1166, IEC "off" ring) draws a step down to an "off" ring on "down" (f1177) and back up on "starting" (f1194). "Why different?" lands leaderless under both on "starting" (f1194, A4) and everything leaves at f1251 (the hold rule). The fork and the `monitor` close-up are gone. |
| B20 | f1247–f1358 · "We'll follow a typical Windows desktop with an Intel processor," | K8 to `desk` starts on "We'll" (f1247); on "Intel" (f1321) a gentle push to `deskIntel` (36 frames) while the CPU's outline is pointed at. |
| B21 | f1359–f1437 | Stops unchanged until they fly home at f1439 (AMD) and f1442 (laptops), the first frame their captions' hold allows; "Intel desktop" hands back to "Soft-off" at f1439. |
| B22 | f1438–f1512 · "That lookout runs on standby power," | K9 glides to `standby` (f1454–f1476) once the stops are home; "Standby power" lands on a settled frame (f1475); "Main rails: OFF" lands on "power," (f1489) inside the PSU's top. The standby line shimmers at half strength all along and at full strength from "small" (f1519). |
| B23 | f1513–f1588 | "Power supply" (f1547) as before. Every S10 label leaves at f1595 (`holdWaiver`: the triptych takes the frame). |
| B24 | f1597–f1697 · "whenever it's plugged in and its rear switch is on." | The triptych opens at f1597 (bands y 184–920, the chip stays above them). Every band shows the recomposed standby path at ×2.1. Left: on "plugged" (f1610) "Unplugged", the plug pulls out f1612–f1620 (gap, pins), the line drains from f1620, the lookout goes dark at f1624. Right: on "rear" (f1639) "Rear switch off", the rocker flips I → O on "switch" (f1646), drain f1651, dark f1655. Centre (the present): "Plugged in" (f1610), "Rear switch on" (f1639) and "Standby power / +5VSB · ATX" on its line (f1605). The band tag leaves from f1673 and the captions from f1679, all gone by the fold (f1685–f1697). |
| B25 | f1681–f1745 | The domain wash is soft and rounded (the lookout, its line, the regulator; f1697); K9b to `wake` (f1699). |
| B26 | f1746–f1797 · "to notice a reason to wake up," | The network jack and the clock badge are 80 px; the clock sits outside the chipset (its route enters the lookout's left side); the lookout's eye returns on "notice" (f1746) until "Now". |
| B27 | f1798–f1829 · "like that button." | The brackets lock on the button at f1798 in `ink`. |
| B28–B29 | f1830–f1889 · "Now press." | "Now" (52 px) on its word at f1830 (was f1825). The real press (f1837) sends the same press wave; the Bit departs at f1838 and is still travelling at f1889. |


---

## 15. Round 2 (judges' review of round 1, 10 October 2026): what each beat now does

Every frame below is derived in `ep01/script.ts` from a word, a sentence, a pause or an A4 deadline (`lint-times.mjs` passes); the frame numbers are given for reading. A4 anchors are unchanged (`node tools/anchors.mjs`: OK) and `cues.json` is unchanged (the derived cue list matches it). Where this section differs from §4 and §14, it wins.

| Beat | Frames · words | Round 2 |
|---|---|---|
| B01 hook | f0–f58 · "Press your PC's power button," | Opens on the new `hook` shot (820, 770, ×1.8): the button 130 px with its two-wire lead to the header, the power supply across the bottom, the plug seated at the left edge (proof of power), the lit lookout and the "?" above. On "Press" the press wave (two `ink` rings, 190 px) and the field's frame-crossing pixel wave; f3–f13 the **Bit is born** on the cap from the monogram's three pixels, with an assembly ripple; it breathes there until f33. No K0 push: K1 glides from f22 ("PC's") to `openLean` over 49 frames while the Bit travels (≤ 36 px/frame on screen). "Power button" lands at f29 at the hook's slot (1404, 664) and rides to its `openLean` slot. |
| B07 | f365–f435 · "doesn't actually switch the power on." | The lead is a two-wire cable plugged into the header (a connector) and the board trace beyond it is a thinner line; the `ink` draw-on and the end tick show the wire ending at the header. "Main power: OFF" sits right of the vents, inside the PSU. |
| B08 | f436–f497 | "Signal only" stays until the demonstration Bit has climbed the lead and crossed the header (f484), so the name and the pulse share the screen; its slot rides toward `chip`. |
| B11–B12 | f600–f716 · "That circuit is a lookout, not the hidden processor." | Lens #2 sits lower right at (1420, 720), its leader a clear diagonal to the lookout that stays (greying) through the D24 settle. On "lookout" (f650) a **"Lookout"** tag (`annotation`) points at the eye above "Always-on logic"; on "not" (f671) the "?" gets its dashed pointer ring (no tint) and a **"Hidden processor"** tag (magenta key bar): both blocks named side by side. Both tags leave as the chain peels (f712). |
| B13–B15 | f707–f913 · the chain | Plates lift, fly as empty cards and their scenes fade in on arrival (fade-through-ground). Each plate's name shows **dimmed** as it lands and brightens as the Bit lands on it. Hops onto plates 4–5's processor are **quiet** (no glow on the CPU). Plate 6 is the **monitor** it peels from: dark until the Bit lands on "Windows" (f860), then lit; the generic sign-in silhouette appears on "takes control" (f875). The Bit parks on the screen. The scrim lifts from f914. |
| B18–B19 | f1068–f1251 · "By the end, you'll know why restart can fix problems that shutting down and starting again might not." | No camera move (K7 removed): over a 15% scrim two not-now plates peel from the monitor: **"Restart"** (f1099, caption on "restart" f1111) and **"Shut down"** (f1159, caption on "shutting" f1166), each the same running PC (a desktop on its screen) with a problem mark. Restart: a big loop sweeps round it (f1111), the screen blinks off and back (f1115–f1129), the loop turns again on "fix" (f1134) and the problem clears (f1138). Shut down: a big power symbol draws round it (f1166), the PC goes dark on "down" (f1177) and returns on "starting again" (f1194–f1204); on "might" (f1216) the problem is still there and pulses. **"Why different?"** lands under both on "starting" (f1194, A4) and everything leaves at f1251 as the plates fly home into the monitor. |
| B20 | f1247–f1358 | The scope chip reads **"Windows desktop"** on "Windows" (f1279), then "Intel desktop" on "an Intel" (f1316). |
| B21–B22 | f1359–f1470 · "…with stops for AMD and laptops. That lookout…" | Both stops peel together on "stops" (f1363, f1368) and show **their own machines from their first frame**: AMD, one package with the lookout (its eye) above the "?" in the I/O die, and AMD's own finned chipset; laptop, the SoC with the "?", the EC with the lookout (its eye), a battery. Captions land on their words with an inner tag each: **"In the processor"** (f1385) and **"Lookout: own chip"** (f1411). They fly home on "lookout" +5 (f1452, f1455) and the chip returns to "Soft-off"; K9 glides to `standby` from f1458. |
| B22–B23 | f1475–f1595 | `standby` is now (716, 700, ×1.22). "Standby power" has no mono line. "Main rails: OFF" lands on "power," (f1489) **under** the power supply; "Power supply" is one line inside it, right of the vents. |
| B24 | f1597–f1697 · the triptych | The world steps back under a 15% scrim; the centre band **lifts as a plate** from the standby path (f1597–f1609) and its scene fades in; the side bands slide out from behind it (f1605–f1617). The fold: bands back (f1685–f1695), the centre's scene out, the world's truth in, the card home (f1695–f1707). No dissolve anywhere. |
| B25–B26 | f1681–f1797 | The domain wash leaves the lookout untinted and gets a dashed amber outline; "Standby-powered" points at its edge. The network jack and the clock are **96 px badges**; **"Wake sources"** sits above them with one leader to each. |
| B27 | f1798–f1829 | The brackets are 5 px with 18 px serifs, 18 px outside the button. |


---

## 16. Round 3 (judges' review of round 2, 10 October 2026): what each beat now does

Every frame below is derived in `ep01/script.ts` from a word, a sentence, a pause or an A4 deadline (`lint-times.mjs` passes); the frame numbers are given for reading. A4 anchors are unchanged (`node tools/anchors.mjs`: OK) and `cues.json` is unchanged (the derived cue list still matches it). Where this section differs from §3, §4, §14 and §15, it wins. The episode script now builds the S06 chain with one `chainRow` call and cuts the chain and S08 scenes from the world with `sceneFrom` (`ENGINE.md §23`).

**The time chip (§3, round 3).** Time only, from a fixed vocabulary: **After the press** (double underline; f2, f436 for the S04 demonstration, f716 for the chain), **Soft-off** (f336 on "And" +1, f519, f914…) and **Now** (f1830). "When pressed" is retired: the demonstration is "after the press" like the other previews. During S08 the chip dims to 40% (f1097–f1251: its plates show a later day, not this machine). In S09 the scope is a muted 36 px second line under "Soft-off": **Windows desktop** on "Windows" (f1279), **Intel desktop** on "Intel" (f1321), cleared as the stops fly home (f1452); the chip itself stays "Soft-off" through the triptych.

| Beat | Frames · words | Round 3 |
|---|---|---|
| B01 hook | f0–f58 · "Press your PC's power button," | **The signature birth:** f3–f8 the B monogram's three pixels (56/44/32 px) pop in magenta with their own neon, down-right of the cap as in the logo; f11–f21 they slide into the head one after another, turning cyan; a square ripple at f19. The Bit glows with a third, wide bloom step. |
| B02 | f59–f136 · "and your main processor doesn't go first." | On "first" (f112) a **"First"** mark pops beside the lookout, opposite "Not first" on the CPU (a non-CPU block may carry it); it leaves with the S01 tags (f331). |
| B05 | f294–f326 · "is already at work." | Inside Lens #1 the awake "?" works: its cache rows light one after another and its core blinks (dim, at Lens size only). |
| B06 return | f327–f346 | Ordered: window and Lens #1 first (f327–f337), the tags and readout at +4 (f331–f337), the chip on "And" +1 (f336–f342), "Power button" on "button" (f344). |
| B08–B10 | f436–f616 | Chip **After the press** for the demonstration (f436–f519). The pill text is 44 px. |
| B11–B12 | f600–f716 · "That circuit is a lookout, not the hidden processor." | The lookout is now a small **controller** (logic rows, a register macro, its input pads): inside Lens #2 the amber standby line ends on its in1 pad and the button's trace on its in2 pad, the trace pointed at (`textMuted`) from "That" (f617) to the D24 settle (f663). **One tag**: "Always-on logic" (f498) becomes **"Lookout"** over the mono subline "always-on logic" on "lookout" (f650), on the same leader; "Hidden processor" lands opposite on "not" (f671). The eye's ≈ is two unboxed waves. The "?" badge is drawn at 58% whenever its block is unpowered and not pointed at (red line 7). |
| B13–B15 chain | f707–f913 | **The hero carry:** each plate carries its part out of the world (the lookout, the supply, the "?", the flash, the M.2, the monitor), growing into its place in the scene, which gathers round it on arrival (peel +8…+13); the world keeps a dashed **peeled socket** where the part was until it flies home. The world's eye leaves at f712 (the plate carries it). Plate 2 is **"Main power"**; plate 3's "?" sits above the rail, so the Bit lands under it (its identity stays visible). Dim names are 56% (≈ 5.4:1). |
| B16 | f914–f984 | "Hidden processor?" lands on "processor," (f958) as the K5 push settles, 48 px below the PCIe slot; it stays below the slot through K6. |
| B18–B19 | f1068–f1251 | The plates (y 198–746) peel carrying the monitor (dark) out of the world; the running PC gathers round it. **The hedge:** on "fix" (f1138) Restart's problem mark turns dashed and faint (it may be gone); on "might" (f1216) Shut down's mark gets a grey "?" (it may stay). **"Why different?"** sits centred under the gap between the plates on its own card. The chip is dimmed. |
| B20 | f1247–f1358 | The scope line (corner brackets that grow along their edges together, never an "L") on "typical" (f1269); **"Intel processor"** names the CPU on "Intel" (f1321) with the outline tone step, leaving at f1376 (`holdWaiver`). |
| B21 | f1359–f1455 | The stops leave the world as **empty cards** (never a copy of this board). Captions **"AMD"** (f1382) and **"Laptops"** (f1408). "In the processor" leads to **both** blocks; muted names **"Chipset"** (AMD's finned chipset) and **"Battery"**. |
| B22–B23 | f1438–f1595 | On "small trickle" (f1519) the standby line runs a **trickle** (sparse pale dashes inside the thin fill) and the camera pushes ×1.06 toward the supply-to-lookout path (K9a f1519–f1575). The trickle continues through S11. |
| B24 triptych | f1597–f1697 | A **short power supply** (inlet, rocker 42 × 81 px, fan, cable exit: the whole supply in every band), the plug 58 px (pulled down and away from the socket), the lookout 90 px with **the eye** in every band. Left: the line drains and the lookout goes dark at f1624: its eye **closes** and **"Dark"** lands above it. Right: the rocker flips on "switch" (f1646), dark at f1655, the eye closes, "Dark". Centre: "Plugged in", "Rear switch on", the eye open (no tag: the line was named before the split). **The fold** (f1685–f1698): bands back behind the centre, its scene out, the empty card flies home and dissolves into the world's truth as it lands (its rule and shadow fade with it). |
| B25–B26 | f1681–f1797 | K9b starts after the fold (f1701). The wash lands on "enough" (f1708) and **"Standby-powered"** on "motherboard" (f1726), after the fold. **"Wake sources"** sits further left (one leader to each badge, a fork that reads at 390 px). The eye **glances** at each door: the network jack (f1752), the clock on "reason" (f1761), the button on "like" (f1794). |


---

## 17. Round 4 (judges' review of round 3, 10 October 2026): what each beat now does

Every frame below is derived in `ep01/script.ts` from a word, a sentence, a pause or an A4 deadline (`lint-times.mjs` passes); the frame numbers are given for reading. A4 anchors are unchanged (`node tools/anchors.mjs`: OK) and **`cues.json` is unchanged** (no cue frame moved; the derived cue list still equals it). Where this section differs from any earlier one (§3, §4, §6 and §13–§16), it wins. The reasons are in STYLE_BIBLE §23.

**One name per object** (style guide §7.6; the Ep01 glossary is `Videos/01 What Happens When You Press Power/glossary.md`):

| Object | On screen, everywhere | Technical subline (mono) | Before the voice names it |
|---|---|---|---|
| The always-on block | **Lookout** (tag step on "lookout", f647; chain plate 1; "Lookout: own chip" in the laptop stop) | always-on logic | "First" (f112) and "Stays awake" (f529), each over the same subline |
| The "?" block | **Hidden processor** (under Lens #1 on "never heard of", f259; on "not", f671; chain plate 3; S07 on "processor,", f958) | — | (the "?" badge alone until f259) |
| Main power | **Main power: OFF** (both pills, f410 and f1489); chain plate 2 "Main power" | — | — |
| The CPU | **Main processor** (f67 and, on "Intel", f1321) | Intel (at f1321) | — |

| Beat | Frames · words | Round 4 |
|---|---|---|
| B01 hook | f0–f58 · "Press your PC's power button," | Opens on the new `hook` (995, 572, ×1.06): the whole system at once, the thumbnail rhyme (the big dark processor, the lit lookout and the "?" below it, the button, the black monitor, the socket and the seated plug), the supply 27 px above the window's rule. The signature birth starts on the press (pixels pop f0–f2, merge f8–f18), laid out to the right of the cap, away from the "?". K1 glides to `openLean` from f22. |
| B02 | f59–f136 · "…doesn't go first." | On "first" (f112) the **"First"** mark (44 px) lands LEFT of the lookout on a leader to its left edge, over the mono subline "always-on logic", clear of the "?" and Lens #1's leader. |
| B04 | f200–f293 · "a smaller processor you've probably never heard of" | The leaderless label under Lens #1 reads **"Hidden processor"** and lands on "never" (f259). |
| B08–B09 | f436–f550 · "It sends a split-second signal to a small circuit that stays awake" | The demonstration is framed by the "later" window (contracts f438, rule f440, expands f519 with a time breath). The tag lands on "stays" (f529): **"Stays awake"** over "always-on logic" (40 px mono). |
| B11–B12 | f600–f716 · "That circuit is a lookout, not the hidden processor." | The step to **"Lookout"** starts 3 frames early (f647; readable on "lookout," f650); the subline stays. "Lookout" and "Hidden processor" leave in the pause (f707), before the chain peels. |
| B13 chain take-off | f702–f760 | The world steps back to 12 % from f702; plates peel **6 frames apart** (p1 f712 … p6 f742), the scrim deepening to 45 % as they arrive. Names: "Lookout", "Main power", "Hidden processor", "Firmware on CPU", "Loader", "Windows". |
| B14 | f765–f852 | Stage marks: the firmware's code on the flash in p4 and the loader's file on the M.2 in p5 (drawn at the world part's proportions); a copy of each slides into the processor as the Bit lands there (f808, f832). |
| B16 fly-home | f914–f946 · "So what is that hidden processor," | **The hero home**, right to left, 3 frames apart: p6 (the monitor) f914, p5 f917, p4 f920, p2 f923, p1 f926, the "?" (p3) last at f929. Each plate's scene fades in its slot (the hero reverting to the present), the card dissolves round it, the hero flies home alone and lands in its peeled socket; the world's "?" badge is gone while its block is out. The deeper scrim lifts from f914, the first step after the last hero (f938). K5 pushes to `chip` from f946. |
| B18–B19 S08 | f1078–f1274 | The scrim and the dimmed chip from "end," (f1078); **Restart** peels on f1082 carrying the monitor. "Can fix" (44 px) under its PC on "can" (f1124); on "fix" (f1138) its problem mark fades inside a dotted ring. **Shut down** slides out from behind Restart on "that" (f1159), the same running PC; on "starting again" the PC relights with a power-on sweep (f1196–f1208); on "might" (f1216) "Might not" lands under it and its mark's dotted ring echoes twice. The marks are 84 px on the screens, inside 172 px signs. At f1251 Shut down slides back behind Restart; Restart's card dissolves and the monitor flies home alone (f1259–f1276). |
| B20 | f1247–f1358 · "We'll follow a typical Windows desktop with an Intel processor," | K8 to `desk` (now y 469) on "follow" (f1254). The scope line is four L-brackets on the case's corners (f1269), gone before K8b (f1313–f1321). On "Intel" the CPU's tag reads **"Main processor"** over the mono subline "Intel". |
| B21 stops | f1363–f1465 | The stops **slide in from the right edge** with their machines drawn (AMD f1363, laptops f1368; 14 frames) and **slide back out** (f1452, f1455; 10 frames), captions, names and tags riding with them. "Chipset" and "Battery" are 44 px. |
| B22–B23 | f1475–f1590 | "Main power: OFF" (was "Main rails: OFF") under the supply; every S10 label leaves by f1596, before the centre card lifts. |
| B24 triptych | f1597–f1705 | **The carry:** the centre card appears over the path region as the world itself and grows to the centre slot while the socket, cord, plug, supply (shortening) and lookout travel to their band places with the standby line between them (f1597–f1609); the side bands slide out from behind it. Causes: a coral cross on the pulled plug's gap (f1620), an ink ring round the rocker as it flips (f1646); each dark band dims to 55 % under its "Dark". **The fold** (f1685–f1705): the side bands slide back and fade, the parts travel home with the card and fade into the world's own. K9b glides to `wake` from f1705. |
| B26–B27 | f1746–f1829 | The network-jack and clock badges settle to 56 % (f1776); only the button is bracketed on "like". The field pings from each new subject (and every 2 s while it holds) over the board vias. |
| B28 | f1827–f1889 · "Now press." | "Now" changes from f1827 (readable on "Now", f1830). **The bookend:** the real press's Bit departs (f1838) with the logo's three magenta pixels re-formed down-right of the cap, converging into its trail and turning cyan by f1854. |
