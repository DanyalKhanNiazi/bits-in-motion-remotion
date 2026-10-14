# Style 1, Bench Notebook: storyboard (Episode 01 intro, f0–f1889)

Composition `BenchNotebook` (entry `src/entries/style1.tsx`), 1920 × 1080, 30 fps, 1,890 frames, muted. Every frame below is absolute and comes from the locked word JSON through the kit (`ANCHORS`, `WORD_CUES`, `wordStart`, `minTagExit`; frame = round(ms × 30 / 1000)) or from `cues.json`; the code lives in `frames.ts`, which refuses to load if `cues.json` and the kit anchors disagree.

**The viewing experience.** An engineer's bench notebook open at a two-page spread that runs. The left page is the real machine in nib ink, the present, soft-off and never wiped. The right page holds the black screen and a column of small numbered, wordless result notes that becomes the intro's summary. Tracing paper is *when*: the flash-forward and the S06 preview are sheets laid over the unchanged present and slid away. Ink is the machine, marker is what flows, pencil is what it is like, cards are alternatives, notes are what we now know.

## Constants for every row

- **Camera:** locked at scale 1.0 for all 1,890 frames. No cuts, no moves, no wipes. The fold (24 px band x 1276–1300, 3 px fold line at x 1288) is in frame in every frame.
- **Page truth (the present, soft-off):** lookout inked, breathing from f0 (pip 70 ↔ 100 % over 60 frames, peaks at f0, f60 … f540); "?" grey with its outlined badge; CPU grey with a hollow pip; standby a thin amber channel PSU → 24-pin → regulator → lookout; main channel empty walls; screen solid black; power LED hollow; plug seated, rocker at "I". Only tracing paper ever shows another state.
- **Route:** contacts (1212, 624) → lead down the front → along the case bottom (y 920) → end-tick (y 909) → front-panel header → board trace → lookout. ≈ 638 px. S01 and S04 runs: 26 frames, 4-frame ease-in, linear cruise ≈ 31 px/frame, 5-frame ease-out (under the 36 cap). Ripple 24 → 80 px, 10 frames; the Bit is absorbed (no park, no glyph change).
- **Labels:** keyed tags land on their word (anchor t0−6 → t0−2, leader t0−5 → t0−1, text t0 → t0+5) and hold until max(t0 + 30 + 9 × words, sentence end + 15). Budgets per frame: ≤ 3 tags, ≤ 2 pills, ≤ 1 header, ≤ 12 must-read words. Nothing under 30 px, no text below y 940.
- **Sound:** cues are written to `cues.json` (Land A f59, Lens open/close f197/f327, Land A f498, Lens open/close f529/f709, Lands A-C-D-E-G f748/781/808/832/860, standby f1475–f1817, Lock f1798, button f0 and f1837). Sheets, cards, filing, notes, wicks and blooms are silent.

## Layout (Frame S, as built)

| Element | Box (px) | Notes |
|---|---|---|
| Header zone | x 144–948, y 96–196 | Time chips and headers ("When pressed", "Intel desktop", "Now"); the flash-forward's tab reaches into it |
| Case (context) | 392–1252 × 236–936 | front panel 1244–1252 (a part) |
| PSU (top-rear) | 408–648 × 252–396 | "Power / supply" written inside at S10 |
| PSU rear face (fold-out flap) | 160–392 × 252–396 | C14 inlet + seated C13 plug (182–250), rocker at "I" (298–336), grille; solid hinge with two score ticks |
| Cord, wall socket | cord x 216 → y 736; socket 128–196 × 700–772 | all above y 940 |
| Board | 416–1024 × 404–908 | white, 3 px structure |
| CPU (LGA1700 frame, lever, lid) | frame 472–784 × 444–704; lid 488–768 × 462–686 | grey, hollow pip docked inside the lid's top-right corner (745–755 × 475–485; outside the socket it sat on DIMM 1's latch); name + readout only on the flash-forward sheet |
| DIMMs, PCIe x16, rear I/O + RJ45 | 798/824 × 444–704; 460–748 × 712–732; 420–460 × 428–624 | idle structure |
| 24-pin (2 × 12), standby regulator | 984–1016 × 456–568; 984–1016 × 600–640 | regulator inked (standby-powered) |
| Chipset package, lid strip, window | 784–968 × 716–884; strip 788–818; window 818–956 × 726–876 | the lid's blank back folded up, 4 px hard shadow, solid score line |
| "?" block | 828–904 × 738–790 | grey outline, 36 px badge at (851, 764) |
| Lookout | 906–950 × 820–864 | ink, white, breathing pip inside its top-right corner |
| Front-panel header | 972–1016 × 890–904 | end-tick under it at y 909 |
| Switch (section) | housing 1196–1244 × 588–652; cap 1252–1274 × 598–642 | hatched cut faces, spring, contacts; cap travels 8 px only at f0 and f1837 |
| Lens (both uses) | centre (1000, 520), d 380, ×4 | covers 810–1190 × 330–710: never the CPU, never the window; chip "×4" at 4:30 (1141–1197 × 661–704) clear of the lead |
| Witness screen | 1404–1704 × 212–384, stand to 412 | solid ink black for 63 s |
| Right-page label band | x 1322–1776, y 417–715 | front-side tags; leaders cross the fold |
| Notes | 3 rows × 2 cols, 220 × 56: rows y 728/796/864, cols x 1320/1556 | numbered, wordless, never leave |
| Slot A (left of the chipset) | right-aligned at x 776; rows centred y 770 / 832 / 900 | "Hidden processor?", "Always-on logic", "≈ Lookout" |
| Flash-forward sheet | 128–1276 × 220–932, tab 144–516 × 136–222 | ⊕ marks top-right and bottom-left |
| S06 list sheet | 1304–1792 × 424–932 | six rows centred y 552 … 882; slot boxes 1318–1354; names from x 1386 |
| Cards | S08 412–904 × 416–706; AMD 412–912 × 416–552; laptops 432–932 × 564–700 | the chipset, PSU, flap and plug stay uncovered |

## Rows

Each row: **frames (s) · words** → idea; composition and exact text; assets; actions on their words; camera, hold and cue; end state; the check.

### B01 · f0–f58 (0.00–1.93 s) · W0001–W0005 "Press your PC's power button,"
- **Idea:** you pressed; everything that follows is *after* the press.
- **Composition:** Frame S. Focal point: the switch, then the lead. Layers: paper → page machine → flash-forward sheet (traced set crisp, the rest of the page ghosted to 35 %) → tag.
- **Text:** tab **After the press** (44 px, on the sheet); tag **Power button** (right-page band, anchor on the cap face, leader 48 px across the fold).
- **Assets:** code-drawn nib-ink machine (`parts.tsx`), tracing sheet (`sheet.tsx`), kit Bit and SignalRoute with the nib skin.
- **Actions:** f0 "Press": cap already 70 % in (travel f−1 → f2), contacts close f2, spring return f6–f10. f2–f8: the sheet lays down in register (shadow 14 → 6 px, untraced parts ghost to 35 %), tab readable by f7; ⊕ marks snap f6–f8. f29 "power": tag lands (anchor f23, leader f24, text f29–f34). f33: the Bit leaves the contacts *on the sheet*; the route lights cyan behind it and decays over 10 frames.
- **Camera/hold/cue:** locked; Button cue f0 (switch click pair is the audio team's).
- **End state:** the Bit on the lead heading for the board.
- **Check:** cap travel only at f0; "After the press" readable by f8 (A4); main channel untraced (empty); LED hollow; plug visible.

### B02 · f59–f136 (1.97–4.53 s) · W0006–W0012 "and your main processor doesn't go first."
- **Idea:** a small block reacts first; the big main processor does not go first and stays dark.
- **Composition:** as B01. Focal: the lookout, then the CPU.
- **Text:** name **Main / processor** inside the CPU (on the sheet); pill **Not first** at the CPU's top-right; tag **Power button**; tab.
- **Actions:** f59 "and": the Bit lands on the lookout, square ripple f59–f69, absorbed f59–f62; **no glyph change** (it has breathed since f0), no park. f61–f67: "Main / processor" inks inside the CPU, readable on "main" (f67). f91 "doesn't": "Not first" docks (fade-in 5 frames). f142: "Power button" and "Not first" exit (hold rule: S01 end 127 + 15).
- **Camera/hold/cue:** locked; hold f96–f127 on the big grey CPU beside the small block that reacted. **Land A f59.**
- **End state:** CPU named and grey; lookout breathing.
- **Check:** A4 f33 → f59 ±1 (depart 33, land 59); f91 CPU dark; no "1st" mark; the only thing that reacted is a small non-CPU block.

### B03 · f137–f199 (4.57–6.63 s) · W0013–W0018 "Before it runs a single instruction,"
- **Idea:** even after the press, the main processor has run nothing.
- **Text:** readout **0** (mono 64) over **instructions** (mono 34, muted) in the CPU's lower half, on the sheet.
- **Actions:** f163 "single": readout flips in over 4 frames, readable by f166.
- **Hold:** f167–f196. **Cue:** none.
- **Check:** literal-safe readout (guardrails S02); no CPU activity; text ≥ 30 px inside the lid.

### B04 · f200–f286 (6.67–9.53 s) · W0019–W0026 "a smaller processor you've probably never heard of"
- **Idea:** a second, smaller processor sits inside the chipset, beside the small block, and has no name.
- **Composition:** the inked Lens over the sheet, centre (1000, 520), d 380, magnifying the "?" block ×4 (304 × 208 px, badge 144 px), leader ≈ 88 px to a 10 px target on the "?"; "×4" chip at 4:30. At true scale the lookout sits just below-right of the "?" in the window ("beside").
- **Actions:** f197–f206: ring inks clockwise from 12 o'clock, content from f200, ticks f203–f205, complete on "smaller" (f206). f259 "never heard of": no name; the badge is the label.
- **Hold:** f206–f327 (121 frames). **Cue: Lens open f197.**
- **Check:** "?" in the chipset (PCH), not the CPU, not its own chip; differently shaped (wide, grey, rounded) from the lookout (small, square, inked); honest ×4 chip; one emphasis device.

### B05 · f287–f326 (9.57–10.87 s) · W0027–W0030 "is already at work."
- **Idea:** after the press the hidden processor goes to work while the main processor still shows 0.
- **Actions:** f294 "already": the "?" flips ON by ink wick on the sheet, in the window and in the Lens at once: ink spreads both ways from its top-left corner and meets at f299; white fill f297–f299; pip f299–f301. Badge stays outlined; readout stays 0.
- **Hold:** f301–f326.
- **Check:** A4 f294; "?" active while the CPU shows nothing; it does not receive the press; not fed by the main rails (untraced).

### B06 · f327–f435 (10.90–14.50 s) · W0031–W0041 "And the button you pressed doesn't actually switch the power on."
- **Idea:** back to the present. The button is not a power switch: its thin lead stops at the board, nowhere near the power cable, and main power stays off.
- **Text:** pill **Soft-off** (inside the case's top-right corner, to the end); tag **Signal only** (band, anchor on the lead, 110 px leader); pill **Main power: OFF** (PSU top-right).
- **Actions:** f327–f333: Lens closes. f327–f335: the sheet slides off downward (10 frames, Move; its last frames fade f331–f335), taking the tab (its text fades f329–f333, before it reaches the caption band), the CPU's name and readout and the ON "?": the unchanged page is underneath. f333–f338: "Soft-off" lands. f344–f350 "button": the switch's lead is named, so it inks on (a 6-frame wick from the switch down the front, along the case bottom, into the header). f365 "doesn't": the end-tick (4 px ink, 26 px) blooms across the lead's end at the header (f365–f369) where the ink arrived; "Signal only" lands. f442–f448: the lead dries back to grey before the S04 demonstration. f410 "power": "Main power: OFF" lands. f428–f436: **note 1** blooms (row 1 left): a mini push button (the cap with its inner line, on a small grey housing, so it never reads as "10" beside the numeral) whose thin line ends in an end-tick, beside an empty double-walled stub.
- **Hold:** f414–f427 on the lead stopping at the board beside the empty main channel. **Cue: Lens close f327.**
- **End state:** soft-off, labelled; note 1 filed.
- **Check:** A4 return f327–f335, complete by f337 (≤ f346); never "Before the press"; lead ≥ 60 px from the bundle (closest ≈ 90 px); main power OFF; no "not a switch" text; the rocker drawn as a real switch at "I".

### B07 · f436–f518 (14.53–17.27 s) · W0042–W0051 "It sends a split-second signal to a small circuit"
- **Idea:** when pressed, the button sends only a brief signal along that lead, to one small block in the chipset. A demonstration, not a press.
- **Text:** header **When pressed** (44 px); tags **Signal only**, **Always-on logic** (slot A, anchor on the lookout's left edge, 130 px leader under the "?"); pills Soft-off, Main power: OFF. (2 tags, 2 pills, 1 header, 10 words.)
- **Actions:** f441 "sends": header enters. f472 "signal": the Bit leaves the contacts, **no cap travel, no click**; runs lead → end-tick → header → trace → lookout (26 frames, short trail: a pulse, not a beam). f498 "small": lands on the lookout, **ripple only** (f498–f508), absorbed, no state change. f508 "circuit": "Always-on logic" lands. f519–f525: "When pressed" exits, and "Signal only" with it (the demonstration is over; its hold rule needs f442).
- **Cue: Land A f498.**
- **Check:** A4 f472 → f498 ±1; the pulse ends at the lookout in the chipset, never the CPU, PSU or "?"; brief.

### B08 · f519–f616 (17.30–20.53 s) · W0052–W0060 "that stays awake even while your PC is off."
- **Idea:** that small block is powered and awake even though the PC is "off".
- **Composition:** the Lens's second use: centre (1000, 520), ×4 on the lookout (176 px), its breathing pip 48 px, the amber standby channel and the board trace arriving at its right side; leader ≈ 140 px to the lookout; "×4" chip.
- **Actions:** f529 "stays": Lens opens (complete f538); the pip's breathing peak lands at f540 on "awake". f551 "even": no new mark: the eye rests on the magnified, breathing block; Soft-off and Main power: OFF name the state. ("Signal only" already left at f519, so the Lens's ×4 chip at 4:30, 1141–1197 × 661–704, never sits on its leader.)
- **Cue: Lens open f529.**
- **Check:** "off" is soft-off: plug in and rocker at "I" visible on the flap; no "Sleep"/"Standby mode"; the chipset does not light as a whole; no coin cell drawn.

### B09 · f617–f716 (20.57–23.87 s) · W0061–W0069 "That circuit is a lookout, not the hidden processor."
- **Idea:** the awake block is *like* a lookout (pencil = analogy), and it is a different thing from the hidden "?" processor.
- **Text:** tags **Always-on logic**, **≈ Lookout** (pencil tag: dashed plate, ≈ chip, dashed leader to the eye, slot A row 3, within 200 px of the window); pills Soft-off, Main power: OFF (8 words).
- **Actions:** f645–f653: the pencil eye badge (D24 almond with a pupil, dashed) draws on at the lookout's lower-left corner; in the Lens it appears at ×4 with its ≈ chip. f650 "lookout": "≈ Lookout" lands. **D24 hand-over:** f663–f669 (pause) the Lens ring and ticks fade to a grey rim while the magnified view stays open; f671 "not": the "?" badge fills with emphasis (f671–f677); its block stays grey. f709–f715: Lens closes (pause). f721–f727: S05 tags, eye, badge fill and "Main power: OFF" leave (hold rule: S05 end 706 + 15).
- **Cues: Lens close f709.**
- **Check:** A4 f671 ±1, ring grey before the fill (one emphasis at a time); two visibly different blocks; the eye only on the lookout, over the real block, whose tag remains; "?" unnamed.

### B10 · f709–f764 (23.63–25.47 s) · W0070–W0075 "It starts a chain of handoffs,"
- **Idea:** the lookout starts a sequence in which each stage hands control to the next: a preview of after the press.
- **Composition:** list sheet over the notes column (1304–1792 × 424–932): title **After the press** (44 px) over its rule; six numbered rows (slot boxes with mono 30 px numerals, 3 px connectors). Only the ruled lines show through it. The left page stays in soft-off.
- **Actions:** f709–f717: the sheet lays down, slots unnamed, slot 1 already awake (ink, breathing pip). f731 "a": **Always-on logic** lands on row 1, a small pencil eye docks on slot 1, the Bit pops onto slot 1 (scale 0 → 1, f731–f735) with the markerInfo tint under the row. f736 "chain": the Bit departs. f748 "handoffs": lands on slot 2; **Power** lands; slot 2 wicks ON; the empty double-walled segment beside it fills amber f748–f752 (a power phase, no code). Slot 1 keeps breathing.
- **Cue: Land A f748.**
- **Check:** A4 f748 ±1; hops 12 frames (≥ 10), ≈ 10 px/frame; preview framed by its own 44 px title.

### B11 · f765–f852 (25.50–28.40 s) · W0076–W0083 "each stage preparing what the next one needs,"
- **Idea:** each stage gets the next one ready before passing control on.
- **Actions:** f769 → f781 "stage": lands on slot 3; the **"?" badge** lands as its name; slot 3 wicks ON; the tint moves with the Bit. f796 → f808 "what": slot 4, **Firmware on CPU**, wicks ON; slot 3 keeps its filled pip (still running). f820 → f832 "needs,": slot 5, **Loader**, wicks ON; slot 4 dries back to the D24 visited mark (3 px annotation outline, hollow pip) f832–f838.
- **Cues: Land C f781, D f808, E f832.**
- **Check:** A4 f781, f808, f832 (= "needs,", W0083) ±1; order lookout → power → ? → firmware on CPU → loader → Windows; no "BIOS"; the real "?" and CPU stay grey on the left page.

### B12 · f853–f913 (28.43–30.43 s) · W0084–W0087 "until Windows takes control."
- **Idea:** the chain ends when Windows is in control; the lookout and the "?" keep running underneath.
- **Actions:** f848 → f860 "Windows": slot 6, **Windows**, wicks ON; the Bit **parks** there (breathing 1.00 → 1.10); slot 5 dries back to visited. f866–f899: hold on the finished list (12 must-read words at f860 with the Soft-off pill). f902–f912: the list sheet slides off to the right. f904–f912: **note 2** blooms (row 1 right): the chain stub, six tiny slots, only slot 1 awake, slot 2 an empty power segment, slot 3 the outlined "?", slots 4–6 hollow: the present truth.
- **Cue: Land G f860.**
- **Check:** A4 f860 ±1, parks; "Windows" is text only; nothing lit in the hardware view; present restored by f912.

### B13 · f914–f984 (30.47–32.83 s) · W0088–W0093 "So what is that hidden processor,"
- **Idea:** the open question: what is the "?". It stays unnamed.
- **Actions:** f950 "hidden": the "?" badge fills with emphasis (f950–f956); tag **Hidden processor?** lands in slot A row 1 (muted key bar, 52 px leader to the "?" block's left edge).
- **Check:** unnamed; same place (chipset window); one emphasis device.

### B14 · f985–f1067 (32.83–35.60 s) · W0094–W0103 "and how does one tap become a sign-in screen?"
- **Idea:** one short tap somehow ends with a sign-in screen. That journey is the video.
- **Text:** tags **Hidden processor?**, **One tap** (band, on the cap), **Sign-in screen** (under the pencil card); pill Soft-off (7 words, 3 tags).
- **Actions:** f999 "one": "One tap" lands. f1021 "become": a dashed pencil arc (12/8, 3 px annotation + a second graphite tone) draws from the cap across the fold to below the screen (f1021–f1033); ≈ chip at its midpoint f1027. f1030–f1036: pencil sketch of a generic sign-in card (dashed outline, avatar circle, one field bar; no text, no logo) blooms **below and outside** the black screen. f1036 "sign": "Sign-in screen" lands. f1084–f1090: S07 tags, arc and card leave; the badge unfills (hold rule: "Sign-in screen" f1036 + 48).
- **Check:** the screen stays black; the card is only the destination of a dashed analogy; no captured UI or logo.

### B15 · f1068–f1165 (35.60–38.83 s) · W0104–W0113 "By the end, you'll know why restart can fix problems"
- **Idea:** a promise: the video will explain why Restart can fix problems.
- **Composition:** a white cutout card over the CPU region (412–904 × 416–706); chipset, lookout, button, PSU, flap and plug stay visible.
- **Actions:** f1072–f1084: the card slides in from the left (12 frames, Move), its hard contact shadow growing 2 → 4 px over f1081–f1084. f1085–f1092 (pause): a fork blooms on it: stem, a plain ink "?" (44 px, not the badge), two branches. f1105–f1111 "restart": a generic **Restart** button (circular-arrow glyph, name inside) inks at the upper branch.
- **Hold:** f1112–f1165.
- **Check:** stylised generic buttons, not the Windows power menu; no mechanism.

### B16 · f1166–f1246 (38.87–41.53 s) · W0114–W0121 "that shutting down and starting again might not."
- **Idea:** shutting down and starting again is a different path that might not fix the same problems.
- **Actions:** f1160–f1166 "shutting": a generic **Shut down** button (IEC power glyph) inks at the lower branch. f1194 "starting": **Why different?** lands as the card's caption (held f1199–f1242, 48 frames). f1242–f1254: the card is **filed**: it slides to notes row 2 (left) while shrinking to note size; its words fade in the first 4 frames. It lands as **note 3** (the fork with its two glyph buttons).
- **Check:** A4 f1194 ±1, held ≥ 48 frames into the f1237–f1246 pause; the hedge stays in the voice; no Windows UI.

### B17 · f1247–f1358 (41.57–45.27 s) · W0122–W0131 "We'll follow a typical Windows desktop with an Intel processor,"
- **Idea:** the video follows one typical machine: a Windows desktop with an Intel processor.
- **Actions:** f1254: the whole machine is uncovered. f1321 "Intel": header **Intel desktop** (44 px) enters.
- **Hold:** breathing carries f1254–f1321.
- **Check:** ATX tower, separate PSU with IEC inlet and rocker, LGA1700-style socket, separate chipset; "Intel" plain text.

### B18 · f1359–f1437 (45.30–47.90 s) · W0132–W0137 "with stops for AMD and laptops."
- **Idea:** two other kinds of PC will be visited later, and their lookout and "?" live in different places.
- **Actions:** f1370–f1382 "AMD": card **Stop: AMD** slides in and lands: an unlit outline of one processor package holding a small always-on block and the "?" block (grey "?"), with an empty chipset outline next to it. f1396–f1408 "laptops": card **Stop: laptops** lands below it: a slim laptop board with the EC as its own small chip and a battery; no PSU, rocker or +5VSB. Both hold through S10a.
- **Check:** AMD: both blocks in the package; laptop: EC its own chip, no ATX supply; unlit outlines, no pips, no logos.

### B19 · f1438–f1512 (47.93–50.40 s) · W0138–W0143 "That lookout runs on standby power,"
- **Idea:** the lookout is powered by its own thin supply, called standby power.
- **Text:** header Intel desktop; cards Stop: AMD, Stop: laptops; tag **Standby power** / mono **+5VSB · ATX** (amber key bar; anchor on the standby down-run, 142 px leader across the fold); pill Soft-off (11 words).
- **Actions:** f1475 "standby": tag lands. f1505–f1513 (pause): both cards are filed into **note 4** (row 2 right); their words fade by f1509; "Intel desktop" exits.
- **Cue: standby span starts f1475.**
- **Check:** stops visible through S10a and gone by f1513; the only mono line is "+5VSB · ATX", at the PSU/24-pin end, never "5 V" at the chipset; no wattage.

### B20 · f1513–f1588 (50.43–52.93 s) · W0144–W0151 "a small trickle the power supply keeps flowing"
- **Idea:** the supply keeps a small trickle flowing, separate from the main power, which stays empty.
- **Actions:** f1519 "small": shimmer starts in the standby channel only (90/90, 1 px/frame source → load, to f1817), drawn by the style as soft paper-light glints on the amber fill (three nested dashes, 90/60/30 px, 0.24/0.22/0.20), because the kit's 10% black shimmer could not be seen on the 6 px light-theme line; the main channel stays empty paper between its walls. f1541–f1547: **Power / supply** inks inside the PSU, readable on "power" (f1547). f1555 "supply": pill **Main rails: OFF** lands.
- **Hold:** f1560–f1588.
- **Check:** main rails empty, no fan motion; standby routes only to the chipset (no CPU, RAM, GPU, SSD, no EPS cable).

### B21 · f1589–f1680 (52.97–56.00 s) · W0152–W0161 "whenever it's plugged in and its rear switch is on."
- **Idea:** standby exists only while the PC is plugged in and its rear switch is on.
- **Text:** tags Standby power / +5VSB · ATX, **Rear switch** (above the flap, leader to the rocker); name Power supply; pills Soft-off, Main rails: OFF (12 words at the peak).
- **Actions:** f1605–f1610 "plugged": an ink tick lands beside the plug on the flap. f1639 "rear": "Rear switch" lands. f1657–f1662 "on.": a second tick beside the rocker. f1671–f1679 (pause): **note 5** blooms (row 3 left: a mini plug and a mini rocker, each ticked). f1687: "Standby power" and "Rear switch" exit (hold rule).
- **Check:** both conditions visibly met, face-on, above y 410; the front button never controls standby.

### B22 · f1681–f1745 (56.03–58.20 s) · W0162–W0168 "It powers just enough of the motherboard"
- **Idea:** standby keeps only a small part of the board alive.
- **Actions:** f1695–f1703 "just": three broad chisel marker strokes (markerEnergy, multiplied under the ink) lay a swipe over the standby domain only: the 24-pin's standby end, the regulator, the on-board standby channel and the lookout; f1699–f1705 its 3 px annotation boundary line blooms. The boundary passes 16 px below the "?", which stays outside.
- **Check:** only a small bounded region; CPU, RAM, GPU slot and "?" outside it.

### B23 · f1746–f1797 (58.20–59.93 s) · W0169–W0175 "to notice a reason to wake up,"
- **Idea:** the lookout watches for several possible reasons to wake; the button is one of them.
- **Actions:** f1742–f1750 "notice": the pencil eye returns on the lookout. f1746–f1754: a wake route blooms from the RJ45 jack on the rear I/O, down the board's left side and along its bottom, up into the lookout. f1754–f1762 "a reason": a small clock (the chipset's RTC alarm) blooms in the window's bottom-left with a short route into the lookout. Both idle grey and unlabelled; with the button's route, three inputs converge.
- **Check:** wake sources button + network jack + clock, not the graphics slot; dim, unlabelled (settings-dependent); no coin cell.

### B24 · f1798–f1829 (59.93–60.97 s) · W0176–W0178 "like that button."
- **Idea:** the power button is one of those reasons: the one we are about to use.
- **Actions:** f1793–f1798 "like": the bracket lock-on snaps around the switch and its cap (emphasis, 4 px, 14 px serifs, 24 → 8 px). The button's route stays structure grey. f1818–f1824 (pause): brackets fade, the eye leaves; the swipe and wake routes stay. f1819–f1827: **note 6** blooms (row 3 right: three tiny inputs converging on a tiny lookout; the optional fix 2).
- **Cue: Lock f1798. Standby span ends f1817.**
- **Check:** A4 f1798 ±1; emphasis used once; no held level.

### B25 · f1830–f1853 (61.00–61.77 s) · W0179–W0180 "Now press."
- **Idea:** this is the real press, from soft-off. Everything that follows comes from it.
- **Text:** header **Now** (44 px); name Power supply; pills Soft-off, Main rails: OFF (7 words).
- **Actions:** f1830 "Now": header enters, closing the time grammar "After the press" → "Soft-off" → "When pressed" → "Now". f1837 "press.": the cap travels in (f1836 → f1839), contacts close f1839; the Bit departs f1839; the cap springs back f1846–f1850.
- **Cue: button f1837.**
- **Check:** A4 f1830, f1837 ±1; soft-off intact at the press (lookout breathing, "?" grey, CPU grey, main empty, screen black, LED hollow, plug in, rocker at "I"); cap moved only at f0 and f1837.

### B26 · f1854–f1889 (61.80–63.00 s) · tail (no words)
- **Idea:** the press is on its way to the lookout; the next section continues from here.
- **Actions:** the Bit cruises at ≈ 12.3 px/frame (the documented exception to the 30-frame run limit: a 4-frame ease-in then a linear cruise that would reach the lookout at f1891, W0184 "power"; its ease-out and ripple belong to the next section). At f1889 it is still on the board trace, ≈ 25 px short of the lookout's edge, trail behind it. Nothing changes state.
- **Check:** A4 f1889: still travelling, no ripple, no Land inside the intro; the pulse heads for the lookout, never the "?" or CPU.

## Notes column at f1889 (the visual summary)

1 the button's line stops at the board (S03) · 2 the chain, only its first link awake now (S06) · 3 Restart vs Shut down (S08) · 4 the AMD and laptop stops (S09) · 5 plugged in + rear switch on (S10) · 6 three wake inputs into the lookout (S11).
