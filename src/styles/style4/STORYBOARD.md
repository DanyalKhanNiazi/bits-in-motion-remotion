# Signal Score (Style 4) — Episode 01 intro storyboard

Composition `SignalScore`, 1920×1080, 30 fps, f0–f1889 (63.000 s), muted. Every frame below is absolute and comes from the word JSON through the kit (`frame = round(ms × 30 / 1000)`), or is a fixed deadline / move window written in `timeline.ts` with its reason. Sound cues live in `cues.json`; the code reads its frames from that file (`timeline.ts → CUE`), so picture and cue list cannot drift.

**The instrument face.** One flat graphite ground (`board` #161C29) edge to edge. Four lanes ordered by depth, six tracks: L1 *What you see* (y 300), L2 *Main processor* (464), lane 3 *Chipset* with Q, the "?" (568) and LK, the lookout (664), lane 4 *Power supply* with SB standby (800, 10 px channel) and MR main rails (904, 18 px channel). Lane heads (x 112–344) are the real parts with unpowered parts as dark solid bodies; braces (x 345–358) join each package's two tracks; the axis break "//" (x 362–382) means "earlier, compressed"; the score field runs x 384–1824, text ≤ 1776, nothing below y 940 but the cord.

**Grammar.** Ink = happening now or happened. Grey (`structure`) = off or not yet; ghosts (the future) are the same shapes in grey outline, never dashed. Cyan = a signal travelling (the Bit, a written pulse, the lit route behind a Bit). Amber only inside double walls. `annotation` grey = pointers at ghosts, leaders, the D24 visited mark, analogy dashes. Marks: track off (3 px grey), track on (4 px ink ending at the playhead in a breathing 12 px write-head), pulse (16×34 cyan step), tick (16×24 ink step), block (32 px rounded, ink + `activeFill`), visited block, channel, link (3 px, hops of r 14 with a gap in the crossed track, 8 px terminal), brace.

**Time devices.** PRESS marker (3 px annotation rule + a 32 px button-glyph flag on the time rail). Playhead (4 px ink rule + 20 px head on the rail, "Soft-off" pill docked on its left). TimeMap (`timemap.ts`): M1 PRESS 1180 / home 1000 (flash-forward arrival 1260, writes to 1380); T1 f713–f725 → M2a PRESS 920 / home 870 (look-ahead layout); pack f926–f946 (ghost V into PRESS…+300); T3 f1257–f1277 → M3 PRESS 1400 / home 1300; S12 approach f1817–f1837; M4 stretch from f1844 (after-PRESS region ×1 → ×6 in log space). Invariants checked on every frame at load (≥ 100 px of history; playhead before PRESS f345–f1836; nothing moves faster than 36 px/frame; order kept) and printed as `[kit]` lines by the tools.

**Budget per frame:** ≤ 3 tags, ≤ 2 pills, 1 header, ≤ 12 must-read words (names settled to 34 px, "?", ≈ and chips count 0).

---

## Rows

Format: **frames (seconds) · words** → idea · composition / focal point / layers / exact text · assets · actions on words · camera, transition, hold, cue · end state → next · check.

### B01 — f0–f28 (0.00–0.93 s) · W0001–W0003 "Press your PC's"
- **Idea:** a PC; you press its button; what follows is *after the press*.
- **Composition:** no score. The stage strip in score order, top to bottom: case front + monitor (×1.0), the main processor (×1.8, the dominant dark shape, x 663–1037), the chipset (×1.0) with the lit lookout block lower left and the "?" block upper right (badge above), the power supply rear view (×1.0) with the cord seated and the rocker at "I". Links: the button's two-wire lead runs down a margin 26 px left of the processor to the front-panel header, then a trace into the lookout; a thin amber standby link rises from the supply into the lookout's underside. Focal point: the button, then the big dark processor.
- **Text:** header **After the press** (44 px).
- **Assets:** all vector, in code (`parts.tsx`): case front (button with the IEC power symbol, LED off, vents), monitor (black `surface` screen), LGA-style package with notched heat spreader, chipset package with two blocks, header block with pins, PSU rear (fan grille, rocker I/O, IEC inlet with plug), cord (its curl ends by y ≈ 1010, inside the proposal's "graphics may reach 1026" allowance for the caption reserve).
- **Actions:** f0 "Press": the cap travels (scales to 0.88 and darkens, contact f0–f1, spring-back f6–f11). Header in f2–f7 (readable by f7; A4 by f8).
- **Camera / cue:** locked. Cue `button` f0.
- **End state:** soft-off parts, header on → B02.
- **Check:** f0/f8 stills: cap pressed, header readable by f8; lookout breathing, "?" off, CPU dark, monitor black, LED off, cord seated.

### B02 — f29–f58 (0.97–1.93 s) · W0004–W0005 "power button,"
- **Idea:** the press sends a signal along the button's own wire, past the processor, to a small block in the chipset.
- **Text:** tag **Power button** (anchor on the button, leader over the monitor, f23 anchor → f29 text).
- **Actions:** f33: the Bit departs the button and runs the lead (691 px, 26-frame run, cruise ≈ 33 px/frame, brand ease-in/out), the route lighting cyan behind it and decaying over 10 frames; it passes the processor 26 px to its left.
- **Cue:** none until the landing. **End:** the Bit arriving → B03.
- **Check:** burst f30–f60: route lit behind the Bit, never touching the CPU, the "?" or the supply.

### B03 — f59–f141 (1.97–4.70 s) · W0006–W0012 "and your main processor doesn't go first."
- **Idea:** the small block reacted first; the big processor did nothing.
- **Text:** tags **Main processor** (f67), **Not first** (f91) on the processor's right edge. (3 tags + header = 9 words.)
- **Actions:** f59 "and": the Bit lands on the lookout: square ripple only, absorbed in 3 frames (no park, D24); the lookout's breathing pip is unchanged. The processor keeps its grey outline and hollow pip throughout.
- **Hold:** f96–f141. **Cue:** `land` A f59.
- **End:** all three tags hold to f142 (S01 end f127 + 15) → the fold.
- **Check:** f59 ripple on the lookout, no glyph change; f91–f141 CPU dark.

### B04 — f142–f199 (4.73–6.63 s) · W0013–W0018 "Before it runs a single instruction,"
- **Idea:** the same moment again as a score, one lane per part; the processor has run nothing.
- **Actions:** f142–f148 S01 tags exit, strip links fade. **f142–f172 the fold:** every part slides (and the processor shrinks ×1.8 → ×1) straight into its lane-head seat (trapezoid, 6-frame ramps, ≤ 26 px/frame). f156: tracks draw out of the moving parts at 50 px/frame (they start at each part's current right edge); the lookout's line arrives in ink and standby in amber — lines that were already running; f156–f162 PRESS marker + flag at x 1180; f160–f166 the playhead at x 1260, already past PRESS. f173: as the draw front passes PRESS, **the S01 event is already written**: the cyan pulse on L1, its ink link from the leading edge hopping L2, the ink tick on the lookout's track at 1224. f166–f172 lead, trace and standby link redraw at the seats; f172–f176 the lookout's ink line draws out of its own block through the chipset package; f172 axis break; f172–f178 **Main processor** re-enters at 34 px in lane 2's left slot. f173 "instruction": readout **0 instructions** (mono 64/38) docks right of the playhead in lane 2's rail.
- **Hold:** f178–f199. **Cue:** none (the fold is not a cause).
- **Check:** dense run f140–f200: parts never cross, tracks emerge from parts, the written event appears only after the draw front passes PRESS.

### B05 — f200–f286 (6.67–9.53 s) · W0019–W0026 "a smaller processor you've probably never heard of"
- **Idea:** a second, smaller processor inside the chipset, with its own track, separate from the lookout's.
- **Actions:** f206 "smaller": the Q track tunes in from the "?" block's right edge (50 px/frame, grey: it was there, off); the "?" badge scale accent (1.0 → 1.12 → 1.0, f206–f212); as Q passes PRESS (f224) the press link gains its second hop (r 0 → 14 over 4 frames); the lane-3 brace draws (f208–f214).
- **Text:** none new (the badge is the label). Header, readout, name.
- **Check:** the press link hops Q; the "?" never receives the press.

### B06 — f287–f326 (9.57–10.87 s) · W0027–W0030 "is already at work."
- **Idea:** after the press, the hidden processor works while the main processor still shows 0.
- **Actions:** f294 "already": the playhead advances 1260 → 1380 (f294–f326), **writing a block** on Q as it goes; in the lane head the "?" block flips ON (ink outline, `activeFill`, filled pip, f294–f299); the readout rides with the playhead. Lane 2 stays grey, the readout stays 0.
- **Check:** f294 ±2: "?" ON in head and track together; CPU dark.

### B07 — f327–f364 (10.90–12.13 s) · W0031–W0035 "And the button you pressed" (return pause f327–f334)
- **Idea:** that was later; now we are back in the present and the PC is off ("Soft-off").
- **Actions:** f327 header and readout exit in place. **f327–f345 the rewind:** the playhead sweeps back 1380 → 1000 (trapezoid, ≤ 25 px/frame); everything it passes reverts to ghost in passing order: the "?" block un-writes with the playhead (head "?" flips OFF ≈ f331), the tick (≈ f336), the link, the pulse. f337 ("And" f335 + 2, once the playhead has cleared the PRESS flag): **Soft-off** pill appears docked on the moving playhead and rides in (home by f345, A4 complete by f346). f344 "button": tag **Power button** re-lands (anchor on the button, leader over the monitor). f356 "pressed": an annotation end-tick draws under the ghost pulse at PRESS (a pointer, not a landing; nothing is sent).
- **Cue:** none (the rewind is not a cause).
- **Check:** dense run f325–f350: reverts in passing order; by f345 lookout ON, "?" dim with its badge, CPU dark, no main power; never "Before the press".

### B08 — f365–f435 (12.17–14.50 s) · W0036–W0041 "doesn't actually switch the power on."
- **Idea:** the button only signals the lookout; main power stays off and nothing connects the button to it.
- **Actions:** f365 "doesn't": the lead's end-tick at the front-panel header brightens to ink; an annotation end-tick under the ghost link's terminal: *it ends here*. f395 "switch": track MR tunes in, an **empty** 18 px double-walled channel drawn from the supply to PRESS at 50 px/frame, ending in a cap at PRESS; f397–f403 lane-4 brace. f410 "power": pill **Main power: OFF** docks at "now" in the MR row.
- **Hold:** f415–f441. **Text:** pill Soft-off, tag Power button, pill Main power: OFF (1/2/0, 6 words).
- **Check:** no link from lane 1 to lane 4; no thick cable or lightning; rocker drawn at "I" (a real switch).

### B09 — f436–f518 (14.53–17.27 s) · W0042–W0051 "It sends a split-second signal to a small circuit"
- **Idea:** what a press *would* do: one brief signal to one small always-on block. A demonstration; the PC stays off.
- **Actions:** f441 "sends": header **When pressed**. f442 Power button exits (hold rule 427 + 15). f453 "split": the **Time Lens** (brand ring, magenta, 4 ticks, d 420, centre 1222/466, time mode) opens over the PRESS moment (9 frames); inside, the same lanes on a darker interior, and the press instant stretches open: the ghost pulse widens 16 → 60 px (f456–f465). Chip **Not to scale** (mono 30) outside the ring at 1:30, lifted above L1 (the rail's axis note steps aside). f472 "signal": the Bit leaves the stretched pulse's leading edge and drops at PRESS, hopping L2 and Q, then 45° to the lookout's tick. f498 "small": ripple only, on the track inside the ring and on the lookout block in the lane head in the same frame; the ghost tick stays a ghost; the Bit is absorbed. (The landing sits at the ring's 6 o'clock, so the four brand ticks are drawn inside the clipped view under the Bit, and this one ripple is drawn above the ring, unclipped.) f508 "circuit": name **Always-on logic** lands in the lookout's left slot (44 px, ink key bar).
- **Cues:** `lens_open` f453, `land` A f498.
- **Check:** no cap travel, no click, no state change at f498; the Bit never reaches the CPU, the supply or the "?".

### B10 — f519–f616 (17.30–20.53 s) · W0052–W0060 "that stays awake even while your PC is off."
- **Idea:** that small block is awake right now although the PC is off: its line has run since long before the film and ends at "now", breathing.
- **Actions:** f519–f525 header exits. The Lens stays open (D24 needs it for the S05 hand-over). The lookout's pip in the head and the write-head at the end of its ink line breathe in phase (kit breathing, peak f540, 1 frame after "awake" f539). f595 "off.": the Soft-off pill re-stamps (4-frame flip).
- **Hold:** f535–f616.
- **Check:** only the lookout's line is ink; cord seated and rocker at "I" whenever the lookout is shown awake.

### B11 — f617–f670 (20.57–22.33 s) · W0061–W0065 "That circuit is a lookout," (pause f660–f670)
- **Idea:** "lookout" is a way to picture the real always-on block.
- **Actions:** f622 Always-on logic settles to 34 px (S04 end + 15). f644–f652: the D24 **eye badge** (dashed almond with pupil, ≈ chip) draws under the lookout block at the package's lower-left corner (centre 174/730; the ≈ chip clears the package outline), outside the chipset package, completing on "lookout" (f650). The word "Lookout" is never printed. **D24 hand-over:** f663–f669 the Lens ring and its ticks fade to a grey rim (the magnified view stays open, still captioned "Not to scale": the chip stays, its text stepping down to muted, until the Lens closes).
- **Check:** the eye never on the "?" or the CPU; one emphasis device at a time.

### B12 — f671–f716 (22.37–23.87 s) · W0066–W0069 "not the hidden processor." (pause f707–f716)
- **Idea:** the "?" next door is a different block on a different track, and it is off.
- **Actions:** f671 "not": the **"?" badge fills** with emphasis (6 frames); the "?" block and Q stay off. Inside the grey-rimmed Lens the press link visibly hops Q and ends on the lookout's track. f683 "hidden": name **Hidden processor?** lands in Q's left slot (44 px; settles to 34 at f731 = 683 + 48). f707: badge unfills; Main power: OFF retires; the Lens closes (6 frames). **f713–f725 T1:** PRESS 1180 → 920, playhead 1000 → 870 with Soft-off riding (130 px), the ghost "?" block re-spaces; order kept, ≤ 33 px/frame.
- **Cue:** `lens_close` f707.
- **Check:** two differently shaped blocks on two tracks of one braced chipset; f671 ±2.

### B13 — f717–f764 (23.90–25.47 s) · W0070–W0075 "It starts a chain of handoffs,"
- **Idea:** a press starts a chain; each stage hands control to the next. A look-ahead: the PC itself stays off.
- **Composition:** M2a. Header **After the press** (44). The playhead stays home with Soft-off; the lane heads stay in soft-off. Right of PRESS, unnamed ghost slots: the lookout's tick, the MR Power segment (walls extended past PRESS), the "?" block (1048–1082), three ghost blocks on lane 2 (1098–1325, 1349–1522, 1546–1776).
- **Actions:** f722 "starts": header in; the press is written in the preview (pulse cyan f722, link ink f724, tick f727); ghost slots fade up (f725–f731); the Bit fades in at f725, parked on station 1 (the lookout's tick), once the T1 re-spacing has settled. f727→ what never stops is written through the look-ahead: the lookout's ink line and standby's amber run on from "now" to the right edge at 50 px/frame. f731 "a": hop 1 drops from the lookout's tick, hopping standby, and lands on the Power control anchor at f748 "handoffs"; the MR Power segment fills amber from x 1020 to the right edge (50 px/frame); name **Power** (amber key bar) lands.
- **Cue:** `land` A f748 (the lowest note on the lowest lane). No energize (a preview).
- **Check:** the hardware never lights; Power drawn as energy; names land with their Bits.

### B14 — f765–f852 (25.50–28.40 s) · W0076–W0083 "each stage preparing what the next one needs,"
- **Actions:** hop 2 departs f765 "each", rises hopping standby and the lookout's track, lands f781 "stage" on the "?" block, which inks (ink + `activeFill`). Hop 3 departs f794 "preparing", along Q and up to lane 2: f808 "what": the Bit parks on the first lane-2 ghost; name **Firmware / on CPU** (two lines) lands; behind the Bit the "?" track continues as an ink line to the right edge with a still-running pip (f794–f810). Hop 4 departs f815 "the", along lane 2; f832 "needs,": parks on the second ghost, name **Loader**; Firmware turns **visited** (D24: annotation outline + hollow pip). Hops 4 and 5 run along the processor's own track, so they leave no resting line: only the cyan lit trail while the Bit travels. Lane 2 is never inked (its stations are traced: ghost → parked Bit → visited). Hold f844–f852.
- **Cues:** `land` C f781, D f808, E f832 (rising with the lanes).
- **Check:** order lookout → power → ? → firmware → loader; lane 2 never inked (ghost, parked Bit, visited only); every hop 14–17 frames, ≤ 36 px/frame.

### B15 — f853–f913 (28.43–30.43 s) · W0084–W0087 "until Windows takes control." (pause f900–f913)
- **Actions:** hop 5 departs f846 (pause); f860 "Windows": parks on the third ghost, name **Windows** (text only, no logo); Loader turns visited. **Hold f865–f913 on the whole V** (48 frames).
- **Cue:** `land` G f860.
- **End:** station names hold to f914 (S06 end + 15) → B16.
- **Check:** Windows parks at f860 ±1; "Is the PC on yet?" → no (heads dark, Soft-off at home).

### B16 — f914–f984 (30.47–32.80 s) · W0088–W0093 "So what is that hidden processor," (pause f974–f984)
- **Actions:** f914: names, header and eye badge exit (6 frames); **fold back f914–f926:** the look-ahead's ink and amber revert to ghosts right to left, visited stations return to ghosts, the Bit fades, the always-on lines retract to "now". **f926–f946 the pack:** the ghost V re-spaces into x 920–1220 (≤ 33 px/frame), leaving x 1240–1776 as "later". f950 "hidden": the "?" badge fills again and **Hidden processor?** grows 34 → 44 px; f974 badge unfills.
- **Check:** packed ghosts keep their order; "?" unnamed and in the chipset.

### B17 — f985–f1067 (32.83–35.57 s) · W0094–W0103 "and how does one tap become a sign-in screen?" (pause f1058–f1067)
- **Actions:** f999 "one": annotation end-tick under the ghost pulse; rail label **One tap** right of the PRESS flag. f1021 "become": a dashed analogy arc (≈ chip at its apex) draws from the ghost press over lane 1 to a dashed generic **sign-in card** (avatar circle + one field bar, no text or logo) at the right of lane 1 (f1030–f1038). f1036 "sign": tag **Sign-in screen** on the rail with a leader down to the card; the axis note steps aside; lane 1's name **What you see** (34 px) appears.
- **Hold:** card, arc and both labels to f1085 (Sign-in screen 1036 + 48 = 1084), exit in the f1086–f1091 pause.
- **Check:** the card stays outside the monitor, which stays black.

### B18 — f1068–f1165 (35.60–38.87 s) · W0104–W0113 "By the end, you'll know why restart can fix problems"
- **Actions:** f1068 Hidden processor? settles to 34 px. f1085 S07 items exit. f1104 "why": a fork stem draws along lane 1 (y 258) from x 1250 to a split at 1320. f1105–f1111: the upper branch rises to the rail; f1111 "restart": chip **Restart** (generic, 40 px, ink outline).
- **Check:** generic chips, no OS menu, no mechanism.

### B19 — f1166–f1246 (38.90–41.53 s) · W0114–W0121 "that shutting down and starting again might not." (pause f1237–f1246)
- **Actions:** f1160–f1166 lower branch; f1166 "shutting": chip **Shut down**. f1194 "starting": a plain ink "?" (Sora 700, not the magenta badge) appears in the fork's crotch and **Why different?** lands on the rail above the stem. Holds to f1251 (S08 end + 15; ≥ 48 frames), then exits with the fork and chips.
- **Check:** f1194 ±1; held ≥ 48 frames; a question, not a result.

### B20 — f1247–f1358 (41.57–45.27 s) · W0122–W0131 "We'll follow a typical Windows desktop with an Intel processor," (pause f1349–f1358)
- **Actions:** f1251 Soft-off fades (it may not ride a 430 px move). **f1257–f1277 T3:** PRESS 920 → 1400, playhead 870 → 1300 (≤ 28 px/frame); the written always-on lines lengthen with "now"; the packed V moves with PRESS. f1269 "typical": a 6-frame outline accent runs down the four lane heads in depth order (+3 frames per lane): *this* machine. f1277 Soft-off re-enters at the new home. f1321 "Intel": header **Intel desktop** (settles to 34 px at f1439).
- **Check:** no logo; ATX tower parts (separate PSU with inlet and rocker, separate chipset).

### B21 — f1359–f1437 (45.30–47.90 s) · W0132–W0137 "with stops for AMD and laptops."
- **Actions:** f1374–f1382 the **AMD stop** draws in lane 2's rail: one processor-package outline holding a small square block and a wider block (no chipset); f1382 "AMD": tag **Stop: AMD**. f1400–f1408 the **laptop stop** draws between Q and LK: a slim board with its own small EC chip and a battery (no ATX supply, rocker or +5VSB); f1408 "laptops": tag **Stop: laptops**. Unlit, no pips. Every lane keeps its name.
- **Check:** the stops stay through S10a and exit in the f1505–f1512 pause.

### B22 — f1438–f1512 (47.93–50.40 s) · W0138–W0143 "That lookout runs on standby power," (pause f1505–f1512)
- **Actions:** f1447 "lookout": the lookout's pip and the write-head pulse together (scale 1 → 1.3 → 1, 8 frames). f1475 "standby": tag **Standby power** with the mono line **+5VSB · ATX** (f1479) docked at "now" on the thin standby channel (amber key bar). f1505 stops exit.
- **Cue:** `standby` span starts f1475.
- **Check:** "+5VSB" on the supply's standby track, never at the chipset, no wattage.

### B23 — f1513–f1588 (50.43–52.97 s) · W0144–W0151 "a small trickle the power supply keeps flowing"
- **Actions:** f1519 "small trickle": shimmer (90/90 dashes, 1 px/frame) in the score's standby channel and the lane heads' standby link. f1547 "power supply": the supply's outline accent (6 frames). f1565 "keeps": pill **Main rails: OFF** docks at "now" in the MR row.
- **Check:** main rails empty; standby feeds only the lookout.

### B24 — f1589–f1680 (52.97–56.00 s) · W0152–W0161 "whenever it's plugged in and its rear switch is on." (pause f1671–f1680)
- **Actions:** f1610 "plugged": the plug and the cord's first 30 px turn ink; tag **Plugged in** (anchor on the plug). f1639 "rear": the rocker's outline turns ink (it shows "I"); tag **Rear switch** (anchor on the rocker). The lane-4 brace takes a small gap where the Plugged in leader crosses it.
- **Hold:** f1657–f1680 (3 tags, 2 pills, 34 px header: 12 words).
- **Check:** both conditions named on the real parts; axis break, "now", Soft-off and PRESS in frame (never a route diagram).

### B25 — f1681–f1745 (56.03–58.17 s) · W0162–W0168 "It powers just enough of the motherboard"
- **Actions:** f1685 Standby power and Plugged in exit (S10 end + 15), f1687 Rear switch (1639 + 48). f1695 "just": the powered-domain wash (energy 16% over the board, 1.38:1 and lighter than the ground) fades in over 8 frames as **two thin bands**, behind the lookout's line and the standby channel only (axis break → now), plus the lookout block, the standby link and the supply's standby output in the heads; each with a 2 px annotation boundary. The "?", the CPU, the monitor and the main rails stay outside.
- **Check:** the "?" track is outside both bands.

### B26 — f1746–f1797 (58.20–59.93 s) · W0169–W0175 "to notice a reason to wake up,"
- **Actions:** f1746 "notice": the **wake join**: a network-jack glyph and a clock glyph (28 px, grey, unlabelled) draw either side of the PRESS flag, each dropping a 45° branch into the same instant (the marker's top). f1761 "reason": tag **Wake sources** in lane 1 right of PRESS, leader up to the join.
- **Check:** button, network and clock (not the graphics slot); the other two dim; nothing is sent.

### B27 — f1798–f1829 (59.93–60.97 s) · W0176–W0178 "like that button." (pause f1818–f1829)
- **Actions:** f1793–f1798 the **bracket lock-on** snaps around the power button in lane 1's head (lock completes on "like"); the button's lead stays grey. f1818 brackets fade; the join retracts and fades. f1832 Wake sources exits (S11 end + 15).
- **Cue:** `lock` f1798; `standby` span ends f1817.
- **Check:** brackets used once; no steady cyan on the button's route.

### B28 — f1830–f1859 (61.00–61.97 s) · W0179–W0180 "Now press." (speech ends f1850)
- **Actions:** f1817–f1837 the playhead steps onto PRESS (1300 → 1400, ≤ 6 px/frame), writing as it goes: the lookout's line and standby extend; Soft-off rides with it until its right edge is 6 px short of the PRESS flag (from about f1832), and waits there (it never covers the flag). f1824 Intel desktop exits; f1830 "Now": header **Now**. f1837 "press.": the playhead reaches PRESS; the cap in the lane head travels (contact f1837–f1838, spring-back f1846–f1851); f1838 the ghost pulse is written in cyan at its instant width. f1839: **the Bit departs** the pulse's leading edge and drops at PRESS, hopping L2 and Q. f1850 Soft-off fades (the press has happened, though every state is still soft-off's).
- **Cue:** `button` f1837.
- **Check:** soft-off intact at the press (lookout breathing, "?" dim, CPU dark, rails empty, LED off, screen black); f1837 ±1.

### B29 — f1860–f1889 (62.00–62.97 s) · tail (audio cut f1860)
- **Idea:** the signal is on its way to the lookout; the story zooms into the moments after the press.
- **Actions:** from f1844 only the region after PRESS stretches ×1 → ×6 (log space, eased); everything before PRESS stays put; the packed ghost V fades (f1844–f1852). The drop reaches the corner at f1862, then the Bit crawls the stretched link toward the receding reception tick (1444 → 1664) while the playhead rides with it, the link written in ink behind it and lit cyan near it. At f1889 the Bit is ≈ 18 px short of the tick, still travelling; it would land on "power" at f1891.
- **Check:** f1889: Bit not landed; nothing powers up; the pulse keeps its instant width.

---

## Cue list (`cues.json`)

button f0 · land A f59 · lens_open f453 · land A f498 · lens_close f707 · land A/C/D/E/G f748/f781/f808/f832/f860 · standby f1475–f1817 · lock f1798 · button f1837. No cue on the fold, rewind, re-spacings, fold back, pack or stretch.
