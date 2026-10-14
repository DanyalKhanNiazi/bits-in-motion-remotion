# Style 3 · Living Schematic · Storyboard (Episode 01 intro)

Composition `LivingSchematic` · 1920×1080 · 30 fps · 1,890 frames (f0–f1889) · narration W0001–W0180 (0–61.66 s; audio out 62.000 s).
Every frame below is `round(ms × 30 / 1000)` from `public/data/ep01_words.json`, via the kit's timing helpers (`src/styles/style3/timeline.ts` holds every constant; sound-cue frames are read from `cues.json`).

## 0. The system and its rules

**One map.** A cool, light system map of one typical Intel ATX desktop, drawn like a transit map: every node is a real part drawn as a simplified hardware silhouette in its true relative place, every line a real power or signal route (orthogonal or 45°, 8 px bends). It is on screen from f0 in the true soft-off state and never "builds".

| Region (world px = screen px at System) | Contents |
|---|---|
| Board plate 548–1224 × 222–744 (white) | rear I/O stack on the left (rear) edge with the network jack (RJ45) and the LAN chip; CPU socket 616–876 × 256–490 (biggest node, dark heat spreader with LGA1700-style notches, pin-1 mark); four DIMMs right of the CPU; M.2 SSD below the DIMMs; chipset (PCH) 604–844 × 540–690 holding the **lookout** (always-on block, 620–694 × 614–648, wide and low, lower left) and the **"?"** (748–800 × 566–618, squarer, upper right, its magenta "?" badge docked ON the block); standby regulators; 24-pin on the bottom edge; front-panel header on the bottom edge |
| Below the board | ATX PSU 440–840 × 806–924 (fan, vents, cable exit on its top face), IEC inlet with the plug seated (solid ink), 6 px cord to a wall socket, rocker at "I" on its rear (left) face; front panel 900–1010 × 796–900 (momentary button with the IEC power symbol; power LED, off) |
| Outside | Monitor 1450–1740 × 236–446, screen black for the whole intro |
| Channels | Standby (10 px, live amber) PSU → 24-pin → regulators → lookout's underside, from f0. Main (18 px, empty) PSU → 24-pin, empty all intro |
| Routes | Press route (4 px structure): button → lead → front-panel header → board trace → lookout's underside, 448 px. Idle data links: CPU–memory, CPU–M.2, CPU–chipset (DMI) |

**State at f0 (= true soft-off):** lookout ON (4 px ink outline, white, breathing filled pip); "?" OFF (grey, hollow pip, unfilled magenta "?" badge on the block); CPU, DIMMs, M.2 OFF (hollow pips); standby live; main empty; LED off; monitor black; plug seated; rocker at "I".

**Framings (camera never cuts).** System ×1.0 · Power path ×1.6 (pure zoom about (193, 935): plug, PSU, both channels, chipset with both blocks, trace, header, button in one frame, left rail free for tags) · Chipset ×3.6 (entered by the S12 ride, reached after the intro). Zoom interpolates in log space with Move easing; rate ≤ ×2.2 per 12 frames (a 26-frame ×1.6 move peaks at ×1.86 per 12; the ride at ×1.42). Moves: push f498–524, pull-back f706–732, glide f1505–1531, ride f1850→(f1930). One move per sentence at most, each starting on a landing or in a pause.

**CAD rule.** Line weights are constant on screen at every zoom (non-scaling strokes); text, glyphs, badges and the Bit are screen-space and never scale; tags store a slot per framing and ride with their anchors during moves. A world-space dot grid (48 px pitch at System) shows the zoom.

**Where and when (header zone, x 144).** The time slot (below) and, under it, the style's own **breadcrumb** naming the zoom level in 30 px sans: "System" → "System › Power path" → "System › Power path › Chipset" (current level in ink, parents grey, vector chevrons; each segment appears as the zoom passes into its level). A text-free **key plan** (map silhouette + hatched live viewport) sits under the breadcrumb at the left of the header block (144–296 × 218–298) while zoomed. (Review fix: at the header zone's right end it landed on the CPU's corner at Power path and read as a hatched part on the processor.)

**Time grammar (one header slot at x 144, y 96).** "After the press" 44 px by f7 → "Soft-off" by f346 → "When pressed" f441–f519 → "Soft-off" f595 → "After the press" (S06 preview) f717–f906 → "Soft-off" 34 px → "Intel desktop" f1321–f1505 → "Soft-off" 34 px → "Now" f1830. A 6 px dashed ink **preview frame** (24/16, inset 24 px) surrounds the sheet whenever the map shows a time other than now; a 3 px grey **preview keyline** 6 px outside the "?" marks its preview-only ON state.

**Budget.** ≤ 3 tags, ≤ 2 pills, ≤ 12 must-read words (44 px headers count; 34 px headers, the mono line and chips are supporting). Tags land on their word (anchor t0−6, leader t0−5…t0−1, text t0…t0+5) and hold ≥ max(30 + 9×words, sentence end + 15).

**Sound cues (cues.json, style 3):** button f0 · land A f59 · lens_open f191 · lens_close f331 · land A f498 · lens_open f617 · lens_close f706 · land A f748 · C f781 · D f808 · E f832 · G f860 · standby f1475–f1817 · lock f1798 · button f1837.

---

## 1. Beat table

Each row: frames (s) · words · idea · composition / focal / layers / exact on-screen text · assets · actions anchored to words · camera, transition, hold, cue · end state → next · check.

### B01 · f0–f58 (0.00–1.93 s) · W0001–W0005 "Press your PC's power button,"
- **Idea:** this is a real PC drawn as a map; a press is about to send a signal into the board.
- **Composition:** System. Focal: the front-panel button (lower centre) and the route up to the board. Thumbnail rhyme: big dark CPU upper left, small lit block in the chipset below it, black monitor top right. Layers: grid < board/parts < standby channel < press route < header < preview frame.
- **Text:** "After the press" (header, 44 px); "Power button" (tag, right of the front panel, ink key bar).
- **Assets:** all code-drawn SVG (map silhouettes, IEC power symbol from primitives), kit TimeChip-style header (own HeaderSlot), own Tag (kit anatomy/timing).
- **Actions:** f0 "Press": cap sinks and scales to 90 % (f0–f3, out-cubic so it reads from f1, contact f3), springs back f6–f11. f2–f7 "After the press" enters (readable by f7 ≤ f8). f3–f11 the dashed preview frame draws clockwise from the top left. f23–f34 "Power button" tag (t0 = "power" f29). f30–f33 the Bit forms at the button's output; **f33** departs along lead → header → trace (448 px, 26 frames, cruise ≈ 21.7 px/frame), the route lighting cyan behind it and decaying over 10 frames.
- **Camera / cue:** locked; cue `button` f0.
- **End → next:** the Bit is near the lookout. **Check:** route ends at the lookout, never at the CPU, PSU or "?"; CPU dark; main channel empty; LED off; plug seated; no "controller/EC/TPM" text.

### B02 · f59–f136 (1.97–4.53 s) · W0006–W0012 "and your main processor doesn't go first."
- **Idea:** the big chip is the main processor and it stays dark; something small reacted first.
- **Composition:** System; the frame itself is the comparison (big grey CPU above, small lit block below it that the Bit reached).
- **Text:** "Main processor" (tag in the left rail, leader to the CPU's left edge); header and "Power button" hold.
- **Actions:** **f59 "and"**: the Bit lands on the lookout: square ripple 24 → 80 px (f59–f69), absorbed in 3 frames (no park); the lookout's glyph does not change (already breathing). f61–f72 "Main processor" (t0 = "main" f67). **f91 "doesn't go first"**: deliberately nothing on the CPU (outline and hollow pip hold).
- **Camera / cue:** locked; `land` A f59.
- **End → next:** stable flash-forward frame. **Check:** CPU visibly inactive on "doesn't go first"; no "1st" badge; lookout glyph unchanged on landing.

### B03 · f137–f199 (4.57–6.63 s) · W0013–W0018 "Before it runs a single instruction,"
- **Idea:** the main processor hasn't run anything yet.
- **Composition:** System; left rail: CPU tag + readout; in the pause the Lens opens right of the board, level with the "?" block.
- **Text:** readout "0 instructions" (mono, 64 px numeral + 38 px unit) under the CPU tag; header and "Main processor" hold.
- **Actions:** f142–f148 "Power button" exits (hold rule: S01 end + 15). **f163 "single"**: readout docks under the CPU tag. **f191** (pause after "instruction,"): Lens #1 opens (ring d 300 at (1392, 592), right of the board and level with the "?" block; 9 frames, ticks f197–f199), ×4 chip at 4:30, 3 px emphasis leader straight across the empty board to a 10 px target ON the "?" block's right edge. Inside: the same map drawn natively at ×4 (constant line weights, screen-constant pips and badges), centred on the "?" block from the opening. (Review fix: the target used to sit on the chipset's left edge, by the lookout, while the view panned to the "?" block at the other corner; its first frames showed only the lookout's outline as a white bar.)
- **Camera / cue:** locked; `lens_open` f191.
- **Check:** "0 instructions" literal-safe; magnified object = the "?" block (target on it); no CPU activity.

### B04 · f200–f286 (6.67–9.53 s) · W0019–W0026 "a smaller processor you've probably never heard of"
- **Idea:** inside the chipset, beside the lookout, is a second, smaller processor with no name.
- **Composition:** the Lens holds the "?" block (no pan); one frame holds the big unlit CPU and its "0 instructions" (left rail), the small "?" block in the chipset, and the magnified "?" block wearing its "?" badge (right), joined by the leader (the badge sits on the block, so the Lens shows it too).
- **Text:** "?" badge (0 words); header, CPU tag and readout hold.
- **Actions:** **f206 "smaller"**: the unfilled "?" badge does a 6-frame scale accent (1 → 1.12 → 1) on the map and inside the Lens at once; it does not fill (the Lens is the one emphasis device).
- **Check:** the "?" is inside the chipset, separate and differently shaped from the lookout; unnamed; not in the CPU.

### B05 · f287–f326 (9.57–10.87 s) · W0027–W0030 "is already at work."
- **Idea:** after the press, the "?" is working while the CPU still shows 0.
- **Actions:** **f294 "already"**: the "?" switches ON as a preview state (f294–f299): 4 px ink outline, white fill, filled pip, plus the 3 px grey preview keyline 6 px outside, on the map and inside the Lens at once. The lookout keeps breathing; the readout stays 0.
- **Check:** "?" active while the CPU shows nothing; not fed by the main channel (still empty); framed as a flash-forward (dashed frame + "After the press" 44 px + keyline).

### B06 · f327–f364 (10.90–12.13 s) · return + W0031–W0035 "And the button you pressed"
- **Idea:** that was later; back to now: the PC is off. Look at the button.
- **Composition:** the visible rewind on the same map (no cut).
- **Actions (reverse order, complete by f346):** f327–f332 the "?" flips back OFF and its keyline retracts (map and Lens). f327–f331 a reverse ripple on the lookout (80 → 24 px) as the Bit reappears **hollow**; f327–f345 it runs back along trace → header → lead to the button (448 px in 18 frames, cruise ≈ 35 px/frame ≤ 36), its trail **leading** it and the lit segment ahead of it retracting (time reversed); it reaches the button at f345 and is gone at f346. f331–f337 Lens closes. f333–f339 readout exits. f335–f341 "Main processor" exits. f340–f346 header changes to **"Soft-off"** (44 px). f336–f346 the dashed frame un-draws counter-clockwise. f338–f349 "Power button" tag (t0 = **"button" f344**).
- **Camera / cue:** locked; `lens_close` f331 (the rewind has no other cue).
- **End:** true soft-off by f346: lookout ON breathing, "?" OFF with its badge, CPU dark, main power empty, "Soft-off" in the slot. **Check:** never "Before the press"; the rewinding Bit is hollow and only runs while the preview frame is still un-drawing.

### B07 · f365–f435 (12.17–14.50 s) · W0036–W0041 "doesn't actually switch the power on."
- **Idea:** the button's wire only reaches the board; the thick channel from the PSU stays empty. The button signals; it doesn't carry power.
- **Composition:** System; form contrast on one map: thin lead ending at the header vs the 18 px double-walled main channel (empty), far apart.
- **Text:** "Signal only" (tag on the lead, cyan key bar); pill "Main power: OFF" (inside the PSU's top right); "Power button" and "Soft-off" hold.
- **Actions:** f361–f365 the **net trace** (3 px grey, 12 px beside the lead) grows from the button to the header, no moving head; its end-tick lands just below the header (10 px, clear of the connector's outline, which used to hide it) on **"doesn't" (f365)**; holds 30 frames, fades f395–f403. **f380 "actually"**: "Signal only". **f410 "power"**: "Main power: OFF". f400–f406 header steps to 34 px.
- **Check:** the lead ends at the header, never at the PSU, mains or rocker; no lightning or thick cables; no "not a switch".

### B08 · f436–f497 (14.53–16.57 s) · W0042–W0049 "It sends a split-second signal to a"
- **Idea:** what a press sends: one brief signal along that wire into the board.
- **Composition:** System; a described signal under **"When pressed"**.
- **Actions:** f441 header changes to "When pressed" (44 px). f442–f448 "Power button", "Signal only" and "Main power: OFF" exit (hold rule: S03 end + 15). f468–f471 the Bit forms at the button's output (no cap travel, no click). **f472 "signal"**: departs (448 px, 26 frames); the lit segment decays in 10 frames (a pulse, not a beam). f492–f497 anchor and leader of "Always-on logic".
- **Check:** brief; heads to the lookout only; plug seated; no press shown.

### B09 · f498–f550 (16.60–18.33 s) · W0050–W0054 "small circuit that stays awake"
- **Idea:** the signal stops at one small block inside the chipset, and that block is awake now.
- **Composition:** arrival push to Power path: chipset fills the centre (lookout 118×54 px, "?" 83×83), PSU below with plug and rocker, the live standby between them; key plan under the breadcrumb.
- **Text:** "Always-on" / "logic" (two-line tag, ink key bar; slot left of the lookout at both framings, rides with its anchor; at Power path a 45° leader with the plate clear of the board's edge, and during the push its x lags its y so the plate passes below the rear I/O stack).
- **Actions:** **f498 "small"**: the Bit lands: ripple only, no state change; tag text enters. f498–f524 arrival push System → Power path (26 frames). Key plan (text-free silhouette + hatched viewport, no number) fades in under the breadcrumb as the zoom passes ×1.2. f519–f525 "When pressed" exits. f539 "awake": the always-on pip is at a breathing peak (phase-locked to f0, period 60).
- **Camera / cue:** push starts on the landing; `land` A f498.
- **Check:** only a small block lit; "?" dim; plug in frame throughout the push.

### B10 · f551–f616 (18.37–20.53 s) · W0055–W0060 "even while your PC is off."
- **Idea:** the whole PC is off and this block isn't; the PC is still plugged in.
- **Actions:** **f595 "off."**: "Soft-off" (44 px) enters the header slot.
- **Check:** "off" is soft-off with AC present (plug seated); no "Sleep"/"Standby mode"; no coin cell.

### B11 · f617–f670 (20.57–22.33 s) · W0061–W0065 "That circuit is a lookout,"
- **Idea:** "lookout" is a way to think about the real block, not a new part.
- **Composition:** Power path; Lens #2 (d 300 at (1560, 480), ×4 chip, leader to the lookout's right edge) frames "that circuit": the lookout with its eye badge on the top edge and its two feeds entering from below (the amber standby channel and the button's trace); the ≈ eye badge sits ON the real block. (Review fix: the view used to hold only the block's top edge.)
- **Actions:** **f617 "That"**: Lens #2 opens (9 frames). f642–f650 the dashed ≈ eye badge (almond with pupil, annotation grey, ≈ chip) draws on the lookout, completing on **"lookout" (f650)**, on the map and in the Lens.
- **Cue:** `lens_open` f617. **Check:** the analogy is an overlay on the real always-on block, never on the "?" or the CPU; dashed with ≈.

### B12 · f671–f716 (22.37–23.87 s) · W0066–W0069 "not the hidden processor."
- **Idea:** the other block, the "?", is a different thing: still off, still unnamed.
- **Actions (D24 hand-over):** f663–f669 (pause after "lookout,") Lens #2's ring and ticks fade to a grey rim while the magnified view stays open; **f671 "not"**: the "?" badge fills with emphasis (f671–f677); the "?" block stays OFF. f706–f712 Lens #2 closes, badge unfills, "Soft-off" steps to 34 px.
- **Cue:** `lens_close` f706. **Check:** two separate, differently styled blocks; one emphasis device at a time (rim grey before the fill).

### B13 · f717–f764 (23.90–25.47 s) · W0070–W0075 "It starts a chain of handoffs,"
- **Idea:** the lookout is link 1 of a chain; this is a preview of what a press starts, and power is the first thing it arranges.
- **Composition:** pull-back to System (f706–f732); a second preview: "After the press" + dashed frame. Unnamed station plates appear beside the real nodes: a "Power" plate inside the PSU (with a short empty main-channel segment), a pip slot beside the "?" badge, three plates climbing the CPU's left side (left rail). Station 1 = the lookout itself ("Always-on logic" + eye badge kept).
- **Actions:** f706–f732 pull-back (tag rides back to its System slot; key plan fades out). f717–f723 header → "After the press" (readable on **"starts" f722**). f722–f730 dashed frame draws. f724–f736 plates pop in, unnamed (staggered 3 frames). f726–f729 the token (the Bit) forms on the lookout, breathing. f725 hop-1 path draws ahead; **f731 "a"** departs; **f748 "handoffs"**: lands on the Power plate: its amber segment fills (8 frames) and "Power" lands. The PSU's own main channel stays empty.
- **Cue:** `land` A f748. **Check:** hardware stays soft-off; "Power" is a power phase (amber), no code.

### B14 · f765–f852 (25.50–28.40 s) · W0076–W0083 "each stage preparing what the next one needs,"
- **Idea:** control moves on one stage at a time, in a fixed order; earlier stages keep their state.
- **Actions:** hop 2 f763 → **f781 "stage"** (Power → up from the PSU to just below the "?" block; the board trace takes a 6 px gap where the hop path crosses it): the "?" station pip (right of the block) fills (still running), badge accents, unfilled; the "?" block itself stays OFF. Hop 3 f790 → **f808 "what"** (through the corridor between the two blocks, out of the chipset's top, along under the CPU and up its left side): "Firmware" / "on CPU" lands, pip filled. Hop 4 f819 → **f832 "needs,"**: "Loader" lands; "Firmware on CPU" drops to visited (3 px annotation outline, hollow pip). Each hop path draws 6 frames ahead, lights behind the token, fades 10 frames after landing.
- **Cues:** `land` C f781, D f808, E f832. **Check:** order lookout → power → ? → firmware on CPU; no station on flash, SSD or GPU; "?" unnamed; CPU node dark.

### B15 · f853–f913 (28.43–30.43 s) · W0084–W0087 "until Windows takes control."
- **Idea:** Windows is the end of the chain, and the real screen is still dark (this was a preview).
- **Actions:** hop 5 f844 → **f860 "Windows"**: "Windows" lands, "Loader" drops to visited; the token parks and breathes (DRIVING). f900–f912 the preview lifts: plates and names fade (f900–f906), token fades (f900–f904), eye badge and "Always-on logic" exit (f900–f906), dashed frame un-draws (f902–f910), header → "Soft-off" 34 px (f906). The map is exactly as at f717.
- **Cue:** `land` G f860. **Check:** no Windows logo or UI; monitor black; 11 must-read words at f870.

### B16 · f914–f984 (30.47–32.80 s) · W0088–W0093 "So what is that hidden processor,"
- **Idea:** the "?" is the mystery the video will answer; it stays where it is, unnamed.
- **Actions:** **f950 "hidden"**: the badge fills (f950–f956), holds; f985–f991 unfills.
- **Check:** same place (chipset), never moved into the CPU; unnamed.

### B17 · f985–f1067 (32.83–35.57 s) · W0094–W0103 "and how does one tap become a sign-in screen?"
- **Idea:** the question spans the whole journey, from one tap to a sign-in screen.
- **Composition:** a dashed ≈ analogy arc from the button over the board's right side to a dashed generic sign-in card (1408–1648 × 456–568) below the black monitor (never on it).
- **Text:** "Sign-in screen" (tag hanging straight down from the card's bottom-left corner).
- **Actions:** **f999 "one"**: the arc draws (f999–f1015) with a ≈ chip at its apex. f1028–f1036 the card's dashed outline draws. **f1036 "sign"**: contents fade in (avatar circle, one field, one button; annotation grey, no text) and the tag lands. f1086–f1092 arc, card and tag exit (hold rule f1084 → next pause).
- **Check:** card outside the monitor; monitor black; no captured UI.

### B18 · f1068–f1158 (35.60–38.60 s) · W0104–W0113 "By the end, you'll know why restart can fix problems"
- **Idea:** a promise: there is a reason Restart can fix things.
- **Composition:** right column below the monitor: the brand fork (4 px structure stem splitting into two branches ending in identical command chips: 3 px ink outline, 40 px sans).
- **Actions:** f1105–f1111 stem and upper branch draw; **f1111 "restart"**: "Restart" chip pops (4 frames). Hold through "can fix problems" (no outcome mark: the hedge is kept).
- **Check:** generic chip, not a captured menu; nothing implies "always fixes".

### B19 · f1159–f1246 (38.63–41.53 s) · W0114–W0121 "that shutting down and starting again might not."
- **Idea:** the two look the same; why do they behave differently? The answer comes later.
- **Actions:** f1160–f1166 lower branch draws; **f1166 "shutting"**: "Shut down" chip pops (same size and style). **f1194 "starting"**: "Why different?" lands under the fork, its leader running up to the stem; holds to f1251 (≥ 48 frames, hold rule S08 end + 15), then fork, chips and tag exit (f1251–f1257).
- **Check:** a question, not a result; no mechanism.

### B20 · f1247–f1358 (41.57–45.27 s) · W0122–W0131 "We'll follow a typical Windows desktop with an Intel processor,"
- **Idea:** the machine on the map is the one the video follows: a typical Intel desktop.
- **Actions:** f1247–f1253 "Soft-off" leaves the slot. **f1269 "typical"**: a 3 px grey scope line traces once round the desktop (PSU, board, front panel, monitor; the wall socket stays outside) over f1269–f1299, holds, fades f1307–f1317. **f1321 "Intel"**: header "Intel desktop" (44 px).
- **Check:** text only, no logos; separate ATX PSU, LGA1700-era socket, separate chipset.

### B21 · f1359–f1437 (45.30–47.90 s) · W0132–W0137 "with stops for AMD and laptops."
- **Idea:** the video makes two stops, and each shows only what differs.
- **Composition:** two map callouts docked beside the parts they change (Part B fix 1): "Stop: AMD" in the left rail with a leader to the CPU (one processor package holding the cores and an I/O die with BOTH blocks: the wide always-on block and the "?"); "Stop: laptops" over the board's empty right side with a leader to the chipset (a laptop board with one processor package, its own small EC chip, and a battery; no ATX PSU, no rocker, no +5VSB). Plain unlit line art, no pips.
- **Actions:** f1376–f1388 AMD callout: frame draws, then contents; title lands on **"AMD" f1382**. f1402–f1414 laptop callout; title on **"laptops" f1408**. Both hold through S10a, to f1505.
- **Check:** Intel map never relabelled; AMD inset not a copy of the Intel layout; laptop with no ATX PSU/rocker/+5VSB.

### B22 · f1438–f1512 (47.93–50.40 s) · W0138–W0143 "That lookout runs on standby power,"
- **Idea:** the lookout is fed by a thin standby line from the power supply.
- **Text:** "Standby power" / "+5VSB · ATX" (two-line tag, standby key bar, mono secondary from f1479; the only mono line of the intro), anchored on the channel just below the regulators at the 24-pin end.
- **Actions:** **f1475 "standby"**: tag lands (standby tone starts). f1505–f1511 (pause) the callouts and "Intel desktop" exit; "Soft-off" (34 px) returns. f1505–f1531 glide System → Power path; the tag rides to its Power path slot; key plan returns.
- **Cue:** `standby` start f1475. **Check:** thin 10 px channel; no wattage; "+5VSB" at the 24-pin end, not at the chipset.

### B23 · f1513–f1588 (50.43–52.93 s) · W0144–W0151 "a small trickle the power supply keeps flowing"
- **Idea:** standby keeps flowing while the main power stays empty.
- **Text:** "Power supply" (tag, left of the PSU); "Main rails: OFF" (pill inside the PSU, bottom right); "Standby power" holds.
- **Actions:** **f1519 "small"**: slow shimmer on the standby channel only (90/90 dashes, 10 % black, 1 px/frame, PSU → lookout) until f1685. **f1547 "power"**: "Power supply". **f1565 "keeps"**: "Main rails: OFF".
- **Check:** main rails off (canonical wording); standby reaches only the regulators and the lookout.

### B24 · f1589–f1680 (52.97–56.00 s) · W0152–W0161 "whenever it's plugged in and its rear switch is on."
- **Idea:** two conditions keep the trickle alive: the plug and the rear switch.
- **Text:** "Plugged in" (tag, leader to the cord at the plug); "Rear switch: ON" (pill docked top-right of the rocker); "Standby power", "Power supply", "Main rails: OFF" hold (busiest frame: 3 tags, 2 pills, 12 must-read words).
- **Actions:** **f1610 "plugged"**: "Plugged in". **f1639 "rear"**: "Rear switch: ON". f1685–f1691 the three tags and "Rear switch: ON" exit (hold rule S10 end + 15).
- **Check:** both conditions visibly met; the rocker is a real switch; no coin cell.

### B25 · f1681–f1745 (56.03–58.17 s) · W0162–W0168 "It powers just enough of the motherboard"
- **Idea:** only a small region of the board is powered.
- **Actions:** **f1695 "just"**: the energy wash (#E5DED4, ΔL* ≈ 11 on the white board) fades in over 8 frames with a 3 px annotation boundary, covering only the standby domain (the regulators, the corridor from the 24-pin and a patch round the lookout); the "?" lies outside it. "Standby-powered" (tag, standby key bar) anchors on the regulators. "Main rails: OFF" holds.
- **Check:** CPU, RAM, SSD, monitor, LED unpowered; "?" not in the domain.

### B26 · f1746–f1797 (58.20–59.90 s) · W0169–W0175 "to notice a reason to wake up,"
- **Idea:** the lookout listens for several possible reasons to wake; the button is one of them.
- **Actions:** **f1761 "reason"**: two wake routes draw into the lookout (4 px structure, 8 frames each, staggered 4): network jack → LAN chip → lookout's left edge; and the chipset's clock (an RTC-alarm glyph, drawn on first use) → lookout. "Wake sources" (tag, cyan key bar) anchors on the network route.
- **Check:** button, network jack and clock (no graphics slot); the others stay grey and unlabelled.

### B27 · f1798–f1829 (59.93–60.97 s) · W0176–W0178 "like that button."
- **Idea:** that button, one of those inputs, is how the lookout gets woken.
- **Actions:** **f1798 "like"**: brackets (4 px emphasis, 14 px serifs) lock on the button (snap f1793–f1798, ≤ 6 % overshoot); the button's route stays grey. f1824–f1830 brackets fade.
- **Cue:** `lock` f1798. **Check:** emphasis on the button, not the standby wire; no steady cyan; no power through the button.

### B28 · f1830–f1850 (61.00–61.67 s) · W0179–W0180 "Now press."
- **Idea:** the real moment: from soft-off, the press.
- **Actions:** **f1830 "Now"**: header → "Now" (44 px). f1832–f1838 "Standby-powered" and "Wake sources" exit (hold rule S11 end + 15). **f1837 "press."**: the cap travels (f1837–f1839, contact f1839), springs back f1842–f1847. f1838–f1839 the Bit forms; **f1839** departs along lead → header → trace, the route lit behind it.
- **Cue:** `button` f1837. **Check:** soft-off intact at the press (wash on, lookout breathing, "?" OFF with badge, main empty, LED off, plug seated); the pulse heads for the header, never the "?" or the CPU.

### B29 · f1851–f1889 (61.70–62.97 s) · tail (audio ends f1860)
- **Idea:** the signal is on its way; the story continues without a break.
- **Actions:** f1850 the ride (T2 carry) begins: log-space zoom toward the Chipset framing (×3.6 at f1930), the lookout easing toward screen (900, 330); at **f1889** the scale is ≈ ×2.3, the plug still in frame above y 940, the "Main rails: OFF" pill faded (f1856–f1866, after the voice ends, instead of popping out as the PSU nears the caption zone), and the Bit on the trace's last vertical, decelerating, **still travelling**; it would land on "power" (W0184, f1891).
- **Check:** no main power, fans, LED or screen by f1889; the Bit has not landed and is not at the "?" or the CPU; the plug is in frame while the lookout is shown awake.

---

## 2. Deviations planned against the proposal (`style3_schematic_v2.md`)

1. **True-layout silhouettes (Part B).** Nodes are recognisable silhouettes (socketed CPU with notched heat spreader, DIMMs with chips and latches, M.2 stick, rear I/O stack, PSU with fan/vents/inlet/plug/rocker, front panel with the IEC power symbol, monitor with stand). The proposal's top-right graphics card is dropped (a GPU there would contradict the true layout; a typical Intel desktop can use integrated graphics); the 24-pin stays on the board's bottom edge (schematic liberty, needed so the button lead never crosses the PSU cable).
2. **Power path is ×1.6 about (193, 935), not ×1.8 about (480, 908)**, so the plug, PSU, both channels, chipset, trace and button share one frame with a left rail for tags.
3. **The press route is 448 px, not 669 px** (front panel and header placed closer), so the forward runs cruise at ≈ 21.7 px/frame (brand cruise 24) and the **rewind completes by f345** at ≤ 36 px/frame; the dashed frame and "Soft-off" are also complete by f346 (the proposal ran the rewind to f360).
4. **The rewinding Bit is drawn hollow** (the proposal's documented fallback) with its trail leading it.
5. **A second Lens in S05** (Part B / A4 require the D24 hand-over at f671): Lens #2 opens on the lookout on "That" (f617), settles to a grey rim f663–f669, closes f706. Two Lens uses in 63 s = the brand maximum.
6. **S09 stops are map callouts** (Part B fix 1): AMD docked beside the CPU in the left rail, laptops docked beside the chipset over the board's empty right side; both persist to f1505.
7. **Tag holds follow the brand hold rule** where the proposal exited early: "Power button" (S01) exits f142 not f137; S03 tags f442 not f430; "Power supply" holds to f1685 (proposal f1604); "Why different?" to f1251; S11 tags f1832.
8. **Key plan without a number; a named breadcrumb instead (Part B).** Part B asks for each zoom level to be named in the style's own small breadcrumb, so the levels are named under the time slot ("System › Power path › Chipset", 30 px, supporting text) and the key plan carries no scale chip (no unspoken running number). The breadcrumb is sentence-case sans with vector chevrons in the header zone: not AltRepo's bottom-bar "CHAPTER // SCREEN" breadcrumb or its top-right "NAME · size" chip.
9. **The "?" badge is docked on the "?" block** (the kit's centre dock) instead of a label slot outside the chipset with a leader, so the hidden processor reads as the same marked block at System, at Power path and inside the S02 Lens.
10. **S06 hop routes** avoid the badge: hop 2 lands just below the "?" block, hop 3 leaves through the corridor between the two blocks.
11. **Lens #1 sits right of the board, not in the left rail, and holds the "?" block without a pan** (review repair). From the left rail no straight leader reaches the "?" block without crossing the rear I/O, the LAN chip or the lookout's pip, and the proposal's target on the chipset's left edge pointed at the lookout while the view showed the "?". The CPU, its "0 instructions" and the magnified "?" still share one frame.
12. **The key plan sits under the breadcrumb**, not at the header zone's right end (review repair): at Power path that spot is the CPU's corner.
