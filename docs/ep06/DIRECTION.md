# Episode 06: creative direction (read this first)

**Film:** "Why Deleting a File Doesn't Erase It". 567.432 s, **17,023 frames** at 30 fps, 1920×1080.

**Brief:** build the whole picture as code, in the channel's **Signal Atlas** style, to the standard of the Ep03 rebuild (83.6 on the rubric) or better. The failures we must never repeat: slideshow holds, dips to an empty stage, small "ledger-speak" labels, flat sticker props, one navy room for ten minutes, a metaphor that is never built, numbers that disagree with the voice.

## Locked, never change
- **The narration.** The truth for wording and sync is `docs/ep06/TRANSCRIPT.md` (word@absoluteFrame). Clock helpers in `src/ep06/timing.ts`: `at(paragraph, 'phrase', nth?)` → `{start, end}` absolute frames; `P(n)`; `TOTAL = 17023`.
- **Transcription quirk:** the SRT writes "cypher" (P21); on screen always write **cipher**. The SRT writes "2011" and "16" as digits; that is fine on screen.
- **Accuracy guardrails:** `docs/ep06/script_editorial.md` (claim ledger §E, key visual beats §D, scope and the term budget §A). **This topic is accuracy-sensitive.**
  - Every number on screen is spoken, in the same form: **2011**, **16 SSDs**, **"at most about a quarter"** (write "at most about ¼", never "27%"), **Shift + Delete**, **cipher /w** (spoken "slash W").
  - Box numbers on the wall are identifiers (the voice says "numbered" boxes); keep them small and decorative, never a must-read claim. File-card fields show *field names* ("size", "dates"), never invented values. The only file name is `passport.jpg`.
  - No jargon the voice doesn't say. **Never on screen:** garbage collection, wear levelling, over-provisioning, FTL / flash translation layer, controller, RAID, cryptographic erase, 27%, bitmap, MFT (write "Master File Table" only after P06 names it). Use the voice's words: "housekeeping", "spreads the wear", "spare space", "labels", "the chip that runs the drive", "multi-drive arrays", "destroying the key", "the map of taken boxes".
  - A simplification gets a footnote of 6 words or fewer (e.g. "Simplified: flash erases whole blocks", "Simplified: real cards list runs", "Illustrative timing", "Boxes are logical, not physical").
  - **Safety:** the passport is fictional (indistinct silhouette, blank fields, no number, no seal, no real name). Footnote it once in the hook: "Fictional example". On-screen advice matches the guardrails in meaning, word for word where possible. Never suggest wiping a whole drive, except the P21 line the voice says ("To wipe a whole SSD before it leaves your hands, use the drive maker's sanitize tool"), scoped exactly like that.
  - Quotes from Microsoft and NIST are shown as short attributed quote cards (≤ 12 words, their wording as the voice gives it), **no logos**, no product screenshots. Crucial's tool is named in plain text only ("Crucial Storage Executive → Sanitize Drive"), no logo. Windows UI is a **recreated, generic** dark file window and desktop (no Microsoft logos, no real wallpaper, no real icons).

## The spine

### The governing metaphor: **the Wall and the Drawer** (one kit component: `<Archive>`)
The voice builds it in P04: "a huge wall of numbered storage boxes, all the same size. Next to it sits a drawer of index cards. The boxes hold the data. The cards say which boxes belong to which file." This is the run brief's "library catalogue" seed, improved to use exactly the voice's words: the **drawer of index cards is the catalogue**, the **wall of boxes is the shelving**.
- **Introduced explicitly** at P04 "we need a picture …" with an on-screen naming beat: **"The picture: boxes and cards"** (Atlas opener style), then labelled only when the voice names the parts: "file system · NTFS" (P05), "clusters" (P05), "Master File Table" (P06), "the map of taken boxes" (P07).
- **The same component** draws every state of the story, so it looks identical everywhere (HDD, recovery, SSD, overwrite, sanitize, encryption, the callback). Its states per box: *empty*, *photo bytes* (cyan Bits), *other file* (white/grey bits), *free-but-still-holding* (cyan Bits under an "available" mark), *overwritten* (grey bits replacing cyan, a coral flash), *erased* (dark and clean after an amber sweep), *scrambled* (glyph noise). States per card: *active*, *crossed out / unused* (coral strike + "unused" flag; the card stays in the drawer), *reused* (a new name written over it).
- **HDD mode:** the wall sits in front of a slowly spinning platter glow (the hard drive's world); writes land "in place".
- **SSD mode:** the wall splits into a **front layer of numbered labels** (what Windows sees) and a **back layer of physical flash spots**, plus a shaded **spare space** region Windows can't see; the chip that runs the drive (amber) moves data between spots. Erasing happens in whole groups of boxes (erase-block tray look).
- Its limit is spoken in P06 (a tiny file can live on its card): show it once with a small card that carries its own bits.

### Recurring motifs (identical everywhere)
1. **The passport photo** (fictional photo card, `fictional-passport` renders) and its file `passport.jpg`. It opens the film, dissolves into its bytes, and returns in P21–P22.
2. **The Bit:** the photo's bytes are **cyan Bits** in their boxes, the only thing that is "the photo". Cyan threads run from the photo's card to its boxes ("directions").
3. **The crossed-out card:** a coral strike-through on the photo's index card. It is the film's key image and its title line: "Delete crosses out the index card."
4. **The split compare:** **left = hard drive, right = SSD**, always in that order, with the same header style. It appears in the hook (P01), the mid-film hero (P13), the reversal (P18) and the callback (P22).
5. **"On its own schedule":** the SSD's housekeeping is an **amber sweep** with a small clock glyph; it always comes *later*, never on the click.

### Colour roles
- **Cyan `#00E5FF`:** the photo's data (the Bit) and the card→box directions. Nothing else is cyan.
- **Amber:** energy and the drive's own action: the housekeeping sweep, the chip that runs the drive, the sanitize pulse, the encryption key.
- **Coral:** loss and danger: the strike-through, new writes landing on the photo's boxes, "nothing left", the race timer.
- **Magenta:** emphasis only, sparingly: the TRIM note's tab, the one word to remember on a verdict card.
- **Grounds:** the Signal Atlas navy family (`src/engine/tokens.ts` COLOR) via the kit `PAL`. Paper white for cards and Windows UI.

## Environments (vary them; never one room for ten minutes)
- **(a) The reader's world:** the `reader-desk` photo plate (reused from `public/ep03/assets/reader-desk.png`) with a recreated dark Windows-style desktop and file window on the monitor; key caps for Delete and Shift + Delete. Warm lamp, shallow depth of field.
- **(b) The hardware stage:** a dark studio with rim-lit hero renders: the hard drive (platter and actuator), the M.2 SSD board, the recovery scanner, the encryption-key fixture, the overwrite slot. Light sweeps, contact shadows, haze, a/b/c/d swaps hidden by whips or flashes.
- **(c) The archive:** the Wall and the Drawer, a dark map with depth and a 2.5D camera that pushes between the drawer and the wall rather than cutting away.
- **(d) Inside the flash:** a macro world of emissive cells and blocks (P11, P17): the SSD's back layer seen up close, the spare-space vault.
- **(e) The split compare:** a full-frame two-panel stage (HDD | SSD) with a verdict card.

One grade across all of them: deep blacks, a gentle vignette, very light grain, a little bloom on emissive cyan.

## Motion rules (hard)
- **Never static:** no stretch of more than **45 frames** without visible motion (every hold drifts 0.3–0.8 px/frame or pushes, plus secondary motion: breathing glow, a scanning line, dust in the light); no empty or near-empty frame for more than **6 frames**.
- **Pacing:** a meaningful visual change every **3–6 s**; a **re-hook every 45–75 s** (see the story).
- **Physical motion:** cards slide and *click* into the drawer, boxes *thunk* shut, bits *pour* and *settle*, the strike-through *scratches* across, the TRIM note *slides* through a slot, the scanner beam *sweeps*, overwrites *slam*. Overshoot and settle on pops, ease-in-out on the camera, follow-through on stops, motion blur on fast moves.
- **Sync:** events land within ±3 frames of their word; labels hold until at least 15 frames after their sentence ends.
- **Transitions are motivated:** whip pans, zoom-throughs / lens dives (through the monitor into the drive, through the drive into the wall), match cuts (photo card → index card; HDD wall → SSD wall), object-to-diagram morphs (hard-drive render → the wall), a literal **rewind** for "Restore" (P03). Never a cross-dissolve to empty.
- **Determinism:** no `Math.random`; use `random(seed)` from remotion. Everything is a pure function of the frame.

## Text rules (hard)
- Minimum sizes **measured on screen at 1080p**: must-read labels ≥ **40 px**, keywords 64–120 px, hero words/numbers 160–320 px. Use the kit's `screen` prop on Label, KineticText and Footnote so camera zoom can't shrink them.
- ≤ 6 words per label, ≤ 12 must-read words on screen at once. Keyword captions echo the voice and slam in on the word; they are not subtitles.
- Fonts: Sora (`SANS`), bold for numbers and keywords; `MONO` for box numbers, file names and the command line.
- No overlaps; 64 px safe margin; keep the bottom 140 px free of must-read text.

## Assets
The owner's renders are in `public/ep06/assets/`, mapped in **`docs/ep06/ASSET_MAP.md`** (use only the canonical names, `<subject>_<variant>.png`; variants: a = three-quarter, b = frontal, c = close detail, d = exploded). Load through the kit asset table. What each subject is for:

| Subject | Use |
|---|---|
| `fictional-passport` | The passport photo card: hook, dissolve into Bits, the P21–P22 callback. |
| `recycle-folder` | The Recycle Bin as a physical holding folder (P01, P03); the photo card rides in it. |
| `hard-drive` | HDD hero (P01 dive, P02 route, P05 "the storage boxes are real", P16). d = exploded for a scale reveal. |
| `ssd-board` | SSD hero (P10–P11 turn, P17, P19); c = controller close-up for "the chip that runs the drive". |
| `cluster-wall` | The look reference and establishing hero for the Wall (P04–P05); d = exploded wall for the reveal. |
| `index-drawer` | The Drawer's establishing hero (P04, P06); c = the selected card. |
| `mft-record` | The photo's card up close (P06–P07): name, size, dates, directions. |
| `allocation-map` | "A separate map that tracks which boxes are taken" (P07). |
| `recovery-scanner` | The recovery tool (P02 tease, P08, the P13 race, P21). |
| `overwrite-slot` | Overwriting in place on a hard drive (P09, P16). |
| `trim-notice` | The TRIM note (P12), passing from Windows' side to the drive. |
| `erase-block-tray` | Flash erases before it writes; housekeeping clears whole groups (P11, P13). |
| `ftl-map` | "The box numbers Windows sees are really just labels" (P17). |
| `spare-flash` | "Spare space that Windows can't see or address" (P17, P19). |
| `encryption-key` | BitLocker's key (P20): slot in, pull out, destroy. |

Missing renders are drawn in code with the same materials, and listed in `docs/ep06/ASSET_REQUEST.md`; kit props take `imageSrc` so they can be swapped in later.

## The story, section by section
Builders expand their own section into shots. Frames are absolute; get exact word frames from TRANSCRIPT.md. Sections are in `src/ep06/sections.ts`.

**S1, P01–P02 (0–1409), the HOOK.** Open on the payoff, mid-action.
1. f0: the reader's monitor, the fictional passport photo open as `passport.jpg`. "You delete" (f6): a Delete key cap slams, the photo flies into the Recycle Bin folder. "You empty the recycle bin" (f73): the bin flushes. **"GONE."** slams on "gone" (f187). Footnote: "Fictional example".
2. "But on a hard drive" (f209): lens dive through the screen into the hard drive (render), and into the Wall: **every cyan Bit of the photo still sits in its boxes**, untouched (f251–352).
3. "Windows only crossed out the note" (f375–455): above the wall, the photo's index card gets the coral **strike-through**. **SIGNATURE IMAGE** (hold ~3 s with motion): a full-frame split. Left: Windows says **"Gone"** over the crossed-out card. Right: the passport's bytes glowing on the platter. Give it scale, slam and sound.
4. "On an SSD" (f472): the SSD panel slides in beside it; the Bits are still lit … "not because Windows erased it" … "The drive cleans up later, on its own schedule" (f655–715): an amber housekeeping sweep with a clock glyph clears the SSD side *a beat later*.
5. P02 re-hook: **"Gone?"** question card. "On a hard drive? Not yet." / "On an SSD? Probably, but not certainly." as two verdict chips on the split. "Let's follow that one photo's bytes": one Bit travels a route HDD → SSD on a Windows PC. Then the three promises as three doors (≤ 5 words each): **"Why recovery works" · "Why it sometimes fails" · "What actually erases"**, with a teased glimpse of the recovery race (two scanner beams, outcome hidden behind "?"). Exit with a push into the PC.

**S2, P03–P05 (1409–3167): the bin, the picture, NTFS.**
- P03: the recreated file window. Delete: the photo slides into the Recycle Bin *with its Bits attached* ("every byte intact"). "That's why you can restore it": a literal **rewind** pops it back. "Shift + Delete": key caps, and the photo skips the bin. Re-hook line: "The real question starts when you empty the bin" (hold on the full bin, a finger over "Empty").
- P04: **"The picture: boxes and cards"** naming beat. The Wall assembles (cluster-wall render → the code Wall), box by box with numbers; then "a drawer of index cards" slides out beside it. "The boxes hold the data" (Bits glow in boxes); "the cards say which boxes belong to which file" (a card's cyan threads snap to its boxes).
- P05: "file system" label, then **NTFS** stamps on the drawer front; "The storage boxes are real": the hard drive's platter morphs into the Wall; **"clusters"** labels the boxes ("equal-sized blocks"); "your photo is far too big for one box": the photo's Bits pour and spread across many scattered boxes.

**S3, P06–P07 (3167–5104): the card, and what emptying the bin does.**
- P06: **"Master File Table"** labels the drawer ("at least one entry for every file": cards fan by). Push into the photo's card (mft-record look): **name `passport.jpg` · size · dates · directions** (field names light as spoken), cyan threads to its boxes. "To open the photo, Windows reads the card, then goes to those boxes": a read pulse runs card → boxes → the photo reassembles on the monitor. The limit: a tiny file lives entirely on its card (footnote "Small files can live on cards"); "Your photo isn't that small."
- P07: "Now empty the Recycle Bin" (re-hook, a riser). On "marks your photo's card as free": the coral strike and an **"unused"** flag; the card stays in the drawer. "in a separate map that tracks which boxes are taken": the allocation-map fixture flips the photo's boxes to **"available"**. **"And that's it. Nothing opens the boxes."** The boxes stay shut, the Bits stay lit (a slow push in, held breath). "Updating a couple of records is quick" (two quick ticks) vs "Rewriting every box … far longer" (a long crawling sweep, stopped). "That space can simply be written over later": a ghost of a future write hovers over the boxes.

**S4, P08–P09 (5104–6649): why recovery works, why it fails.**
- P08: Atlas opener **"Recovery"**. "That's exactly why recovery tools work." Quote card (Microsoft): "marked as free … can still exist and be recovered". The recovery scanner (render) sweeps the drawer, reads the *unused* card, follows its threads, and copies the Bits out into its tray: the photo rebuilds. Then the card is reused (a new name scrawled over it): the scanner sweeps the boxes themselves for the **header** glyph that "marks the start of a photo" and finds it.
- P09: "It's also why they fail. Free means free." New files (labelled **download · update · temp file**, white/grey bits) drop into the photo's free boxes; each hit is a coral flash and that box stops glowing cyan. Quote card (Microsoft): "any use of your computer can … overwrite that space". **"Recovery is a race"**: a coral race timer; every write is a chance to lose it.

**S5, P10–P12 (6649–8404): the turn to the SSD.**
- P10: verdict card **"Deleted means unlisted, not erased"** (hard drive). Then the turn (re-hook): "You might expect an SSD to behave the same way": match cut, the same drawer and the same cards over an SSD … "But underneath, the storage wall works very differently": the wall flips and reveals flash underneath. Atlas opener **"The SSD"**.
- P11: SSD board hero (a → d explode), dive into the flash. "It can't simply write over old data": a box with old bits *refuses* a new bit (bounces, coral) until it is cleared. "If the drive did that erasing only at the moment you saved something, writes would slow down": a save stalls (coral clock). "So the drive does its housekeeping in the background": the amber sweep clears groups of boxes ahead of time (erase-block tray). Footnote: "Simplified: flash erases whole blocks".
- P12: "But there's a catch. The SSD doesn't read the index cards": a boundary line between Windows' side (drawer) and the drive's side (wall); the drive's view shows the photo's boxes as **"still full"**. "So Windows sends it a short note, called **TRIM**": the trim-notice envelope slides through the boundary slot with the photo's box numbers on it. Caption: "On by default · NTFS · drives that support it".

**S6, P13–P14 (8404–9935): the MID-FILM HERO, the recovery race.**
- P13: a **prediction beat**: "So think about what the drive does with that note" → question card **"What will the drive do?"** (hold with motion). The photo's boxes get a "disposable" tag; "When it finds a convenient moment" (clock glyph) the amber housekeeping **erases them**: the Bits go dark. "It's gone": then the hero, **a full-frame split race**: the *same* recovery scanner runs on both drives. Left (hard drive, before any overwrite): it follows the card and rebuilds the photo, **"Recovered"**. Right (SSD after TRIM and housekeeping): it finds clean, empty boxes, **"Nothing left"**. Verdict card. Scale, slam, sound.
- P14: "How fast, and how completely? That depends on the drive." Study card: **"Carnegie Mellon · 2011 · 16 SSDs"**. A row of 16 small drives. **TRIM off:** almost all Bits survive ("nearly all"). **TRIM on:** a sparse scatter that differs by drive, under a ceiling line **"at most about ¼"**; tint the drives by "who made the chip that runs the drive". Footnote: "Illustrative spread, not per-drive data". Stamp: **"A snapshot, not a rule"**. "TRIM doesn't always get through": a multi-drive array bounces the note.

**S7, P15–P17 (9935–11976): the twist.**
- P15: re-hook: "the better shredder" (the SSD wears a shredder badge, the HDD doesn't) … **"Here's the twist."** "Try to erase something on purpose, and the SSD gets in your way": a write stream is deflected.
- P16: Atlas opener **"Erasing on purpose"**. Hard drive: the overwrite-slot fixture replaces the old insert *in place*; every free box is rewritten, the old Bits are gone. Quote card (NIST, "the US standards agency"): "overwriting typically hinders recovery".
- P17: **prediction beat** "So what happens if you try the hard-drive method on an SSD?" (question card). The SSD wall splits: **front = labels** Windows sees, **back = physical spots**; the chip that runs the drive (amber) "keeps moving data around" ("spreads the wear"); the **spare space** vault Windows can't see. The overwrite stream aimed at the photo's labels lands in *fresh* spots; the photo's old Bits stay lit in spots nobody points to. Quote card (NIST): "a user can't reach every place old data was stored". Footnote: "Schematic, not to scale".

**S8, P18–P20 (11976–14747): the reversal, and what actually erases.**
- P18: **"The strange reversal"** as a mirrored split: the SSD *destroys what you want back* / *resists when you destroy it*. "Both come from the same fact": the amber chip takes the wheel; Windows' card points only at labels. Verdict: **"The drive, not Windows, decides."**
- P19: Atlas opener **"What actually erases"**. "Ask the drive itself": a built-in erase command; the **sanitize pulse** (amber) radiates from the chip and reaches *every* box, including the spare space. Text: "Crucial Storage Executive → Sanitize Drive" (one example, no logo). Quote card (NIST): sanitize commands "reach all storage areas" + the caveat chip **"You trust the maker"**.
- P20: "There's an even better move … encryption": the encryption key (render) slots in; **BitLocker** labels it. "If it was on when your photo was saved": every block, *including* the spare-space leftovers, turns to scrambled glyphs. "Someone who pulls the drive out" without the key gets **noise**. "destroying the key": the key shatters (fast sanitize, "under the right conditions"). Quote: Microsoft "lost, stolen, or decommissioned devices". "Device encryption … check Settings": a recreated generic Settings toggle. The limit: "once your PC has started": the key slots in, Windows reads normally, a recovery tool on your own PC still works (footnote "Encryption guards the drive at rest").

**S9, P21–P22 (14747–17023): the callback.**
- P21: **"Back to the passport photo"**: the passport card returns on the reader's desk. The advice, one beat at a time, each as a short checklist line with its own small visual (no wall of text; ≤ 6 words per line, ≤ 3 lines visible):
  1. "Check the Recycle Bin and backups" 2. "Stop using that drive" → "Recover onto a different drive" (every new write can land on the old boxes) 3. "SSD with TRIM: expect it gone" 4. Hard drive, gone for good: "Overwrite the free space" → `cipher /w` typed in a recreated command window 5. Selling a PC: "Reset this PC · Clean data on" + chip "Not built to government standards" 6. "Whole SSD: the maker's sanitize tool" (scoped to "before it leaves your hands") 7. "Encryption on from day one" + "Save the recovery key".
- P22: **the callback ending**. "Delete doesn't erase. Delete crosses out the index card": the passport card dissolves into Bits that sink into the Wall, and the crossed-out card returns, now understood. "What happens to the boxes depends on who controls them": the split one last time: left, the hard-drive boxes still glowing ("nothing happens until something new is written"); right, the amber sweep, "on its own schedule". "Use a command that reaches every box" (the sanitize pulse) "or make sure the boxes were unreadable from the start" (scramble + key). Pull all the way out on the Wall and the Drawer; title **"Delete ≠ Erase"**; a calm hold that still moves; a clean "Bits in Motion" sign-off.

## Re-hook map (every 45–75 s)
P02 "Gone?" + three doors (≈25 s) · P03 "the real question starts when you empty the bin" (≈63 s) · P04 the picture (≈66 s) · P07 "Now empty the Recycle Bin" (≈135 s) · P08 "That's exactly why recovery tools work" (≈170 s) · P09 "Recovery is a race" (≈205 s) · P10 the SSD turn (≈222 s) · P12 "But there's a catch" (≈259 s) · P13 prediction + race (≈280 s) · P14 "How fast?" (≈300 s) · P15 "Here's the twist" (≈331 s) · P17 prediction (≈358 s) · P18 "the strange reversal" (≈399 s) · P20 "an even better move" (≈439 s) · P21 "back to the passport photo" (≈492 s).

## Banger formula check (on paper)
1. First 3 s = the payoff in motion (delete → bin → "GONE."), not a logo. ✓
2. By 30 s: "Gone?" + the promise of recovery/fail/erase, with the race teased and its outcome hidden. ✓
3. Signature image: "Gone" over a crossed-out card | every byte still on the platter. ✓
4. One metaphor (the Wall and the Drawer), named on screen at P04, reused in every section, called back at P22. ✓
5. Mid-film hero: the recovery race, HDD "Recovered" vs SSD "Nothing left", full-frame split + verdict (P13). ✓
6. Re-hooks every 45–75 s (map above). ✓
7. Variety: desk, hardware stage, archive, inside the flash, split stage; scale ladder PC → drive → wall → box → flash cell. ✓
8. Tactile: click, thunk, pour, scratch, slide, slam. ✓  9. Sound vocabulary below. ✓  10. Callback ending on the crossed-out card, pull-out on the metaphor, calm moving hold, sign-off. ✓

## Technical contract
- **Ownership:** sections `src/ep06/sections/S#.tsx` + `src/ep06/sections/S#/**` + `S#.cues.json` + `docs/ep06/plans/S#_plan.md`; kit `src/ep06/kit/**`. Never edit another builder's files, `src/engine`, `src/shared`, or anything outside `src/ep06`, `src/entries/ep06*`, `docs/ep06`, `public/ep06`.
- **Section component:** `export const S#: React.FC<{frame:number}>` (absolute frame); renders any frame in [from−30, to+30], clamped.
- **Cloud render rules:** `export REMOTION_GL=angle` (software fallback on this VM; ~2× faster than swangle and the same backend as the owner's final render). Previews at half scale. **Every render or stills command must hold the shared lock:** prefix it with `flock /tmp/ep06-render.lock` (4 vCPUs are shared by everyone). Stills: `flock /tmp/ep06-render.lock node tools/stills.mjs src/entries/ep06s#.tsx S# out/ep06/S#/r1 <frames> --concurrency 2`. Clips: `flock /tmp/ep06-render.lock node tools/render.mjs src/entries/ep06s#.tsx S# out/ep06/S#/clip.mp4 --frames a-b --scale 0.5 --concurrency 3`.
- **Performance budget:** a frame must render in well under a second at half scale on this 4-vCPU VM with software WebGL. Prefer SVG/CSS 2.5D (as Ep03's Bridge did) over three.js; no per-frame image decoding of huge PNGs beyond what the kit's Prop already caches.
- **Sound cues:** `src/ep06/sections/S#.cues.json`, `[{frame, kind, strength}]`, kinds `whoosh | tick | pop | impact | riser | swell | dial | crate | sting | glitch | rewind | type` (crate = a box thunk / heavy shelf hit, dial = a card flip or drawer slide, glitch = scramble, rewind = restore, type = keyboard). About 6–14 per minute; impacts only on hero beats.
- **Economy:** sheets, not dozens of single stills; at most 3 review rounds per section; no narration; final message ≤ 120 words.
