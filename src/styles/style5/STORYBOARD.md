# Style 5 · Live Panels — storyboard (ep01 intro, 63 s, f0–f1889)

Composition `LivePanels`, entry `src/entries/style5.tsx`, code in this folder. All frames are absolute, from the word JSON (`round(ms × 30 / 1000)`, kit `wordStart` / `ANCHORS`); every constant lives in `T.ts`, and sound-cue frames are read from `cues.json`, so the cue list and the picture share one source. Seconds = frame ÷ 30.

**The page.** A dark page (`surface` #05070F) shows only in margins and gutters. Outside views ("what you see") sit on light plates (#FFFFFF active, #F6F2EA held) and use the light set; the case front, monitor and power-supply rear are spot black (#131A2A) and count as dark ground. Inside hardware views sit on `panel` #0E121B with the board in `board` #161C29; schematic views sit on `board` with a "Diagram" chip. Clear line: 3 px `structure` for inactive outlines, 4 px `ink` for active ones, 2 px for detail, flat fills, one dark shadow tone (#080A12) offset under raised parts. Strokes never scale with a panel's camera; text, pips, badges and the Bit stay at brand size.

**Frame grammar (frozen after the look check; chips are kept inside title-safe, x ≤ 1776).** Held panel: one 3 px `structure` rule on the page side. Active panel (exactly one): a 4 px `annotation` rim; light plates step from #F6F2EA to #FFFFFF. Another time: a double rule (a second 3 px rule 8 px inside, with a plate-coloured mat between), slid in over 6 frames, collapsed over 8. Unvisited stop: frame only, no plate. Ports: 40 px gaps in the rules where a literal route crosses a gutter, opened 4 frames before the Bit, closed 6 after; channel ports stay open. Port gutters 72 px, ordinary gutters 24 px. Corners 8 px.

**Panels (page px).** System page: **B** board (inside) x 96–1070, y 212–1026; **P** power supply (inside) x 1142–1824, y 212–500; **O** case front + monitor (outside) x 1142–1824, y 524–1026; port gutter x 1070–1142; the O|P gutter y 500–524 carries nothing, ever. Lens point (670, 700), Ø 300, ×4.

**Routes.** The button's lead: button (1238, 652) → down the spot-black case front → left through O's port (1142, 839) → across the gutter at a right angle → B's port (1070, 839) → the front-panel header (950–980, 830–846) → PWRBTN# trace up and 45° to the lookout (905, 699). About 655 px. Channels: main 18 px (walls only, never filled) PSU → 24-pin at y 410; standby 10 px amber PSU → 24-pin at y 450 → regulator → the lookout's side of the chipset. They cross the gutter 389 px above the lead; no segment of the lead meets a channel.

---

## Rows

Each row: **frames / seconds · words** — idea — composition and text — actions on words — camera, transition, hold, sound — end state → next — check.

### R1 · S01a · f0–f28 (0.00–0.93 s) · W0001–W0003 "Press your PC's"
- **Idea:** this is the PC as you see it and as it is inside, a moment after a press.
- **Composition:** system page on screen from f0 (no build-on). Focal point: the fingertip on the button in O (the only light panel). B: big dark CPU under its cooler footprint (hollow OFF pip), DIMMs, rear I/O, network jack, LAN chip, expansion slots, chipset under its heatsink footprint with two blocks: the **lookout** (16×16 px, r 5, 4 px ink, breathing ALWAYS-ON pip) and the **"?"** (26×18 px, r 2, 3 px structure, hollow pip, magenta outline "?" badge in its label slot left of the heatsink); front-panel header; 24-pin; standby channel live (amber); main channel empty; idle lead (4 px structure) from O's port into B. P: power supply in side elevation, plug in its inlet, cord leaving right, rocker at "I" with an "I" chip. O: spot-black case front (button with its LED, off, beside it; two USB, two jacks, two bay covers, intake), black monitor.
- **Text:** header **After the press** (44 px, double underline) from f3.
- **Actions:** f0 "Press": the fingertip (one flat #737C8E path from O's top edge) is in contact and the cap's inner disc compresses (50% at f0, full at f1; −12%). Contact holds to f36. f2–f8 every rule doubles (inner rule slides in, 6 frames); f3–f8 the header lands (readable by f7).
- **Camera / sound:** locked. Cue `button` f0 (the mixer plays the f0 press quieter: a preview).
- **End → next:** O active; the press is held while the next word names it.
- **Check:** cap travels only at f0 and f1837; header readable by f8; CPU OFF; monitor black; LED off; cord in inlet and rocker at "I" visible above y 940.

### R2 · S01b · f29–f58 (0.97–1.93 s) · W0004–W0005 "power button,"
- **Idea:** the press goes into the board, to a small block in the chipset, not to the big chip.
- **Text:** tag **Power button** (land f29; anchor on the button on spot black in dark-set ink; leader dark-set grey over the case front, light-set grey over the plate; light-set text on the light plate).
- **Actions:** f33 (inside "power") the Bit departs the button with the contact still closed, runs in its dark rendering down the case front (lit trail, 10-frame decay), O's port opens f40–f44, the Bit crosses the 72 px gutter at a right angle, B's port opens, the rim moves O → B at f47 as it enters B, then along the board's bottom edge, through the header and up the PWRBTN# trace. f36–f40 the cap springs back; f40–f48 the fingertip lifts out. 26-frame run, cruise ≈ 31 px/frame (≤ 36).
- **Sound:** cue `land` A at f59, `gain_db −4` (a preview).
- **End → next:** the Bit is about to land on the lookout.
- **Check:** the lead never meets a channel; the Bit's halo is clipped to dark ground; it ends at the lookout, never the CPU, PSU or "?".

### R3 · S01c · f59–f136 (1.97–4.53 s) · W0006–W0012 "and your main processor doesn't go first."
- **Idea:** the big chip, the main processor, stays dark: it is not first.
- **Text:** **Main processor** (f67 "main"), **Not first** (f91 "doesn't"), both in zone L left of the board with horizontal leaders to the CPU package. Must-read at f110: 9 words (header 3 + 2 + 2 + 2), 3 tags.
- **Actions:** f59 "and": ripple only (24 → 80 px, 10 frames); the Bit is absorbed into the ripple (no park); the lookout keeps its glyph. CPU never changes.
- **Hold:** f106–f136. **Exit:** "Power button" and "Main processor" at f142 (hold rule: sentence end + 15).
- **Check:** CPU visibly inactive f91–f127; no "1st" badge; no main power, fans or screen.

### R4 · S02a · f137–f199 (4.57–6.63 s) · W0013–W0018 "Before it runs a single instruction,"
- **Idea:** the CPU has run nothing yet.
- **Text:** header steps 44 → 34 px at f137. Readout **0 instructions** types in at f163 "single" (mono "0" 64 px, unit 38 px muted) under "Not first".
- **Check:** literal-safe readout; CPU dark.

### R5 · S02b · f188–f293 (6.27–9.77 s) · W0019–W0026 "a smaller processor you've probably never heard of"
- **Idea:** inside the chipset, beside the lookout, sits a second, separate block.
- **Composition:** the brand Lens opens a round ×4 inset over B's empty lower left (centre 670, 700; Ø 300; 6 px page-colour knockout border). Inside, the chipset at ×4 on the shared model: the lookout (64×64 px at ×4, ON, breathing pip) lower right and the "?" (104×72 px, OFF, hollow pip, its badge inside the block) upper left; standby channel and PWRBTN# trace entering the lookout. Strokes stay 3/4 px; pips and badge at page size and shown once (in the inset) while it is open.
- **Actions:** f188–f196 the leader (3 px, emphasis 70%) draws from the ring's edge to a 10 px target on the chipset; f197–f206 the ring opens (clockwise from 12 o'clock, radius 70→100%, content f200–f206, ticks f203–f205), complete on "smaller" (f206); "×4" chip at 4:30. Rim → the inset.
- **Sound:** cue `lens_open` f197, `gain_db −4` (preview).
- **Check:** the "?" is its own block inside the chipset; different size, proportion and corners; unnamed; honest scale chip; the ring covers no part of the CPU.

### R6 · S02c · f294–f326 (9.80–10.87 s) · W0027–W0030 "is already at work."
- **Idea:** after the press, that hidden block is working while the CPU has done nothing.
- **Actions:** f294 "already": the "?" flips ON in the inset and in B in the same frame (3 px structure → 4 px ink, active fill, filled pip, 5 frames), with the glow budget's one active-part glow (3× width at 20%).
- **Check:** the "?" is ON only inside this double-ruled flash-forward; no hop from the lookout to the "?"; CPU dark; main channel empty.

### R7 · Return · f327–f335 (10.90–11.17 s, the pause) — no words
- **Actions:** every double rule collapses to single (8 frames); the header leaves (f327–f333); the "?" flips OFF (f327–f332); "Not first" and "0 instructions" leave; the Lens closes f329–f335 (radius 100→85%, fade) and the pips and badge return to B; **Soft-off** (40 px pill, light set) docks on the case front's top-right corner f329–f335; the rim moves to O.
- **Sound:** none (the return is silent).
- **Check:** by f335 (inside the f346 limit): lookout ON and breathing, "?" dim with its badge, CPU dark, main power OFF, "Soft-off". Never "Before the press".

### R8 · S03 · f335–f435 (11.17–14.50 s) · W0031–W0041 "And the button you pressed doesn't actually switch the power on."
- **Idea:** back to now, PC off. The button is wired only into the board; the power supply's main output is off; nothing connects the button to it.
- **Text:** **Power button** re-lands f344 "button" (exit f442); pill **Main power: OFF** docks above P's empty main channel f410 "power" (exit f608). Must-read: 6 words, 1 tag, 2 pills.
- **Actions:** f365 "doesn't": the lead brightens in ink from the button to the header (draw-on f365–f380), through open ports, and ends in a 3 px end-tick at the header (f379–f383); the PWRBTN# trace beyond stays grey. f404–f410 the rim moves to P. f428–f436 the ink fades back to grey.
- **Hold:** f418–f427. **Check:** no wire to the PSU, mains or rocker; no thick cable or lightning; "Main power: OFF" over an empty channel; the O|P gutter empty.

### R9 · S04a · f436–f528 (14.53–17.60 s) · W0042–W0051 "It sends a split-second signal to a small circuit"
- **Idea:** when pressed, the button only sends a short signal, to a small always-on block.
- **Text:** header **When pressed** (44 px, single underline) f441 "sends" → out f519 "that". Tag **Always-on logic** f498 "small" in zone F below the board (exit f622).
- **Actions:** rim P → O at f436. f472 "signal": the Bit departs the button — **no fingertip, no cap travel, no click** — and runs the same route in 26 frames (ports open around it; rim O → B as it enters B); f498 "small": it lands with a ripple only; nothing changes state.
- **Sound:** cue `land` A f498, `gain_db −4` (a described event).
- **Check:** anchor f472 → f498; one brief Bit; ends at the lookout; only the small block is lit.

### R10 · S04b · f529–f616 (17.63–20.53 s) · W0052–W0060 "that stays awake even while your PC is off."
- **Actions:** the lookout keeps breathing (phase-locked to f0; a peak at f540 on "awake"; nothing new happens to it). f551 "even": the rim moves B → O (dark case front, LED off, black screen, "Soft-off"), with "Main power: OFF" still up in P. "Main power: OFF" exits f608 (the pause).
- **Hold:** f570–f607. **Check:** cord in and rocker at "I" visible while the lookout is awake; no "Sleep"/"Standby mode".

### R11 · S05 · f604–f716 (20.13–23.87 s) · W0061–W0069 "That circuit is a lookout, not the hidden processor."
- **Idea:** the awake block is a lookout (an analogy); the "?" beside it is a different block, still off.
- **Actions:** f604–f608 leader; f608–f617 the Lens reopens at the same place, complete on "That" (f617); rim → inset. f650 "lookout": the dashed ≈ eye badge (almond with pupil, 3 px annotation, ≈ chip) draws onto the lookout in the inset; the real block stays visible under it. **f663–f669 (D24): the ring and ticks settle to a plain 3 px grey rim**; the view stays open. **f671 "not": the "?" badge fills with emphasis** (6 frames) while its block stays OFF. f705–f711 the badge unfills and the inset closes.
- **Sound:** cue `lens_open` f608 (now level). The settle is silent.
- **Check:** one emphasis device at a time (ring until f669, filled "?" from f671); the eye only on the lookout; the "?" unnamed and dim.

### R12 · S06a · f709–f764 (23.63–25.47 s) · W0070–W0075 "It starts a chain of handoffs,"
- **Idea:** after a press comes a chain in which each stage hands control to the next; this is a preview — the PC itself stays off.
- **Composition (P3):** the present page (B, P, O, single rules) steps back to a held ×0.38 thumbnail (x 632–1288, y 212–521): labels and badges retract, pips stay at page size, the lookout keeps breathing. **T** opens beneath (x 120–1790, y 545–940; the first view 300 px wide, the others 250 px, so every name sits inside title-safe): six schematic views (board plate, double rule, "Diagram" chip), 24 px gutters, one 4 px route at y 676 crossing every gutter at a right angle through ports. Each view holds its actor, present and unnamed from the start: (1) the lit lookout in a chipset outline wearing the ≈ eye; (2) a power-supply outline with an empty energy segment; (3) the "?" block, OFF; (4) a flash chip feeding a CPU package; (5) an M.2 drive feeding the CPU package; (6) the CPU package beside a memory stick.
- **Actions:** f709–f721 the step-back (12 frames, Move); the S05 inset finishes its close (f705–f711) riding the step-back's view, and the thumbnail's pips fade in (f709–f715; the "?" badge stays retracted); f713–f721 T's frames draw (frame-first) beneath the receding page (the page is a sheet above the row, with an opaque page-tone backing, so the two layouts never cut each other), contents f717–f723; f717 header **After the press** (44 px, double underline). f722 "starts": the Bit appears resting on view 1 (DRIVING, breathing), name **Always-on logic** lands. f736 "chain": hop 1 departs; f748 "handoffs": lands on the power-supply input (ripple), the segment fills (f748–f752), **Power** lands; the Bit rests there without breathing (power never "has control"). Rim follows the chain.
- **Sound:** `land` A f748, `gain_db −4`. **Check:** the thumbnail PC never lights; no counter; the T row is a diagram.

### R13 · S06b · f765–f913 (25.50–30.43 s) · W0076–W0087 "each stage preparing what the next one needs, until Windows takes control."
- **Actions:** header 44 → 34 px at f765. Hops (each crosses one gutter through opened ports, 15–18 frames, ≤ 32 px/frame): f763 → **f781 "stage"** onto the "?" (flips ON, keeps a still-running pip; its badge lands in the name slot); f793 → **f808 "what"** onto the CPU package of view 4, **Firmware / on CPU** lands; f817 → **f832 "needs,"** onto view 5's CPU, **Loader** lands, view 4 drops to visited (the D24 mark: 3 px annotation outline with a hollow pip); f845 → **f860 "Windows"** onto view 6's CPU, **Windows** lands, the Bit **parks** (DRIVING), view 5 → visited.
- **Hold:** f875–f911 (the row reads at once: breathing lookout, filled power, running "?", two visited, Windows driving). **f912–f926:** names, Bit and drawings vanish (f912–f916) and the header leaves, T folds (f912–f920), the page grows back (f912–f926) and the B-level "?" badge fades back in (f920–f926).
- **Sound:** `land` C f781, D f808, E f832, G f860, each `gain_db −4`.
- **Check:** order lookout → power → "?" → firmware on CPU → loader → Windows; the CPU drawings never inked ON; the Bit never lands on the flash chip, drive or memory; no "BIOS", no logo.

### R14 · S07a · f914–f984 (30.47–32.80 s) · W0088–W0093 "So what is that hidden processor,"
- **Actions:** page back at ×1 by f926; "Soft-off" re-docks f922. f944 rim → B. **f950 "hidden":** the "?" badge in B fills (6 frames) and **Hidden processor?** lands in zone F (text centred on y 900, below the board's edge) with its leader up to the badge (exit f1072). f975 the badge unfills.
- **Check:** unnamed; same place (in the chipset); one emphasis device.

### R15 · S07b · f985–f1071 (32.83–35.70 s) · W0094–W0103 "and how does one tap become a sign-in screen?"
- **Actions:** f985 rim → O. **f999 "one":** a dashed analogy arc (3 px light-set annotation, 12/8) draws from the button's lower edge, passing ≥ 10 px under the front ports and above the bay covers, under the "Soft-off" pill, to the zone above the monitor (f999–f1030). **f1036 "sign":** a dashed generic card (≈ chip, avatar circle, one field line) fades in **above the monitor, outside it**; the screen stays black. f1058 arc and card leave.
- **Sound:** none (analogy is silent). **Check:** the card never sits on the screen; no captured UI or logo.

### R16 · S08a · f1062–f1165 (35.40–38.83 s) · W0104–W0113 "By the end, you'll know why restart can fix problems"
- **Composition (P5):** f1062–f1068 "Soft-off" fades (S08 is not about the present state). f1072–f1080 B and P fold; f1072–f1086 O glides at ×1 to the centre, x 619–1301, y 289–791, and holds there while alone. **f1111 "restart":** caption **Restart** (44 px) in O's inner top corner. f1154–f1166 the split: an identical copy **O′** slides out from under O to x 1142–1824 while O moves to x 96–778.
- **Check:** no mechanism; nothing claims an outcome; no captured menu.

### R17 · S08b · f1166–f1242 (38.87–41.40 s) · W0114–W0121 "that shutting down and starting again might not."
- **Actions:** **f1166 "shutting":** **Shut down** on O′ (rim moves to O′). **f1194 "starting":** **Why different?** lands unboxed at the top of the 364 px relationship gutter, two lines, two short 3 px leaders to the captions; held to the T1 cut at **f1243** (49 frames ≥ 48, into the f1237–f1246 pause).
- **Check:** a question, not a result; the hedge holds because the panels claim nothing.

### R18 · S09a · f1243–f1358 (41.43–45.27 s) · W0122–W0131 "We'll follow a typical Windows desktop with an Intel processor,"
- **Idea:** the main example is an ordinary Intel desktop: a tower, its board and a separate power supply.
- **Composition (P6):** T1 cut at f1243. **F** (outside, light) x 96–520: the same tower's front (spot black: button, LED off, ports, bay covers, intake). **M** (inside) x 544–1240: the same tower in side elevation, aligned with F like an orthographic drawing: case shell and tray, the board you know, the power supply in the basement with its IEC inlet and cord at the rear, the standby channel up the front to the 24-pin and on to the lookout, the empty main channel, drive cage.
- **Actions:** f1243 contents fade in (frame-first); f1246–f1262 M's camera pulls back ×0.78 → ×0.68 (the cut's focal motion) to the whole tower. f1262 "a typical…": rim → F (the desktop as you see it). f1304 "with an Intel processor": rim → M; **f1321 "Intel": caption Intel desktop** on M.
- **Check:** ATX tower, separate PSU with IEC inlet, board with socket and separate chipset; "Intel" as text; the cord in its inlet above y 940 whenever the lookout is shown.

### R19 · S09b · f1359–f1437 (45.30–47.90 s) · W0132–W0137 "with stops for AMD and laptops."
- **Actions:** f1374–f1382 A's frame draws (frame only, no plate), contents fade in: one processor package holding two core dies and an I/O die with the lookout's and the "?"'s shapes inside; no chipset. **f1382 "AMD": Stop: AMD**, rim → A. f1400–f1408 L's frame draws: a laptop board with a processor package, a separate small EC chip (the lookout's shape inside) and a battery; no power supply, no rocker. **f1408 "laptops": Stop: laptops**, rim → L.
- **Check:** unlit, unlabelled line art, no pips (unvisited ≠ off); no logos.

### R20 · S10a · f1438–f1511 (47.93–50.37 s) · W0138–W0143 "That lookout runs on standby power,"
- **Actions:** f1447 "lookout": rim → M. **f1475 "standby": tag Standby power / +5VSB · ATX** (mono secondary) lands on M's standby channel at the power-supply end, text in the gap between the board and the PSU. **f1505–f1511:** A and L fold (stops gone by f1513). T1 cut at **f1512**.
- **Sound:** cue `standby` span starts f1475 (to f1817).
- **Check:** "+5VSB" only at the PSU end; "+5VSB · ATX" the only mono technical line; no wattage.

### R21 · S10b · f1512–f1588 (50.40–52.97 s) · W0144–W0151 "a small trickle the power supply keeps flowing"
- **Composition (P7):** the real standby path as a dedicated 1:1 row (y 410–700): **outside** (light, x 96–656): the power supply's rear in front elevation — the plug in its IEC inlet, the cord, the rocker pressed to "I", fan grille — joined across a 72 px port gutter by the mains energy (18 px channel) to the **inside** schematic (board plate, "Diagram"; x 728–1824): power supply → empty main channel to a 24-pin stub; thin standby channel through a regulator to a chipset outline holding the lookout (48×40 px, ON, breathing).
- **Actions:** f1512 cut, contents fade in; the tag re-lands at S's power-supply end (f1513). **f1519 "small":** slow standby shimmer (1 px/frame). **f1547 "power": Main rails: OFF** pill over the empty main channel (x 956–1288, y 422–480: right of the power supply, above the channel, which leaves the supply at y0 + 100).
- **Check:** main rails off; standby feeds only the lookout; schematic marked "Diagram".

### R22 · S10c · f1589–f1679 (52.97–55.97 s) · W0152–W0161 "whenever it's plugged in and its rear switch is on."
- **Actions:** **f1589 "whenever":** two identical live copies slide out from under the real row (12 frames, Move), one up (y 96–386) and one down (y 724–1014), opening two 24 px gutters; captions **If unplugged** (f1596) and **If rear switch OFF** (f1600) land as they settle (top-left of the outside views, text from x 144, ≥ 420 px bands). **f1610 "plugged":** row A's plug pulls out of the inlet (pins visible), its mains energy drains (f1612–f1620), standby drains (f1616–f1624), its lookout flips OFF (f1624). **f1639 "rear":** row C's rocker flips to "O" (3 frames), mains drains (f1641), standby drains (f1644), lookout OFF (f1652). Rim follows the causes (row A's outside f1604, row C's outside f1633), then back to the real row (f1660). Hold f1657–f1679: only the middle row breathes and shimmers. T1 cut at **f1680**.
- **Sound:** standby tone continues; the what-if actions are silent.
- **Check:** real row in the middle (approved); each copy goes dark only after a visible cause and a drain; must-read 11 words.

### R23 · S11a · f1680–f1745 (56.00–58.20 s) · W0162–W0168 "It powers just enough of the motherboard"
- **Actions:** T1 cut at f1680 back to the system page; "Soft-off" re-docks; the standby shimmer runs (P → gutter → B) as the focal motion until f1746. **f1695 "just":** the powered-domain wash (board + 16% energy, #3B3422, fading in over 8 frames, drawn under the parts) with a 3 px annotation boundary: the 24-pin entry, regulator, the lookout corner and the header with its trace. CPU, DIMMs, LAN chip and the "?" stay outside; the boundary passes between the lookout and the "?". Tag **Standby-powered** in zone F (exit f1832).
- **Check:** only a small region lit; nothing beyond the standby domain powered.

### R24 · S11b · f1746–f1829 (58.20–60.97 s) · W0169–W0178 "to notice a reason to wake up, like that button."
- **Actions:** **f1746 "notice":** two more wake routes draw in toward the lookout (4 px structure, 8 frames, staggered 3): from the network jack through the LAN chip, and from the clock crystal; the button's own route arrives through the B|O port. All grey, unlabelled. **f1798 "like":** brackets snap onto the button (f1793–f1798), rim B → O, **Power button** lands (exit f1850); the button's route stays grey. f1817–f1823 brackets fade.
- **Sound:** cue `lock` f1798; standby span ends f1817.
- **Check:** button, network jack, clock; others dim and unlabelled; no steady cyan anywhere.

### R25 · S12 · f1830–f1859 (61.00–61.97 s) · W0179–W0180 "Now press."
- **Actions:** **f1830 "Now":** header **Now** (44 px, single underline); the fingertip enters from O's top edge (f1830–f1836). **f1837 "press.":** it presses 12 px, the cap compresses (contact f1837 at 50%, as at f0; full f1838, held to f1846, springs back f1846–f1849); **the Bit departs at f1840** and runs the same route (ports open around it, rim O → B as it enters B). f1850 "Power button" exits; f1850–f1858 the fingertip lifts out. Soft-off holds everywhere.
- **Sound:** cue `button` f1837.
- **Check:** cap travel only at f0 and f1837; soft-off intact; the pulse heads for the lookout.

### R26 · Tail · f1860–f1889 (62.00–63.00 s) — no words (audio ends at 62.000 s)
- **Actions:** the Bit climbs the PWRBTN# trace; **f1889: it is in its final ease-out just below the lookout, still travelling, trail behind it** — it would land at f1891 on "power". No landing, no ripple inside the intro.
- **Check:** last frame f1889, Bit not landed; nothing powers up.

---

## Cue list (`cues.json`)

`button` f0 · `land` A f59 (−4 dB) · `lens_open` f197 (−4 dB) · `land` A f498 (−4 dB) · `lens_open` f608 · `land` A f748, C f781, D f808, E f832, G f860 (−4 dB each) · `standby` f1475–f1817 · `lock` f1798 · `button` f1837. `gain_db` is the mixer's optional trim (audio_build README); it carries the style's rule that previews and described events play 4 dB under events happening now. No cue for cuts, re-layouts, the return, the Lens close or the settle.
