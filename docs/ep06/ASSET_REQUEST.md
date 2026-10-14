# Ep06 asset request (kit, P1)

Seven renders that would lift the film most. Each reuses its prompt in `inputs/ep06/ASSET_PROMPTS.md` (same BIM id, same
"Save as" name, same materials: navy/graphite steel, silver inserts, paper cards, transparent PNG). Please render at
**2048 px** where noted (all current files are 1254 px). Until they arrive, the kit draws the part in code or regrades
the existing render; when a file lands, it swaps in through the prop named below with no section changes.

| # | Save as | Why it matters | Swaps into |
|---|---|---|---|
| 1 | `BIM315_T06_fictional-passport_c.png` | **Missing.** The close detail of the photo card and its blank lower border is the hook's first image (P01) and the callback (P21–P22). Today a crop of `_b` stands in, which softens past 1.3× in close-ups. | `PassportCard imageSrc` (KIT_UI) and `PhotoBits image` (the dissolve source) |
| 2 | `BIM338_T06_mft-record_b.png` (2048 px, LEDs neutral white, no cyan, latch not magenta) | The P06 flash swap render → vector card. The current file bakes cyan LEDs (cyan is reserved for the photo's Bits); the kit paints over them. A clean 2048 render also survives the `card` framing (≈ 1.2× today). | `<Archive renders={{card}}>` (registered 1:1 to the vector card, `ARCHIVE.CARD`) |
| 3 | `BIM330_T06_cluster-wall_b.png` (2048 px) | P04 starts tight on one numbered box and rockets back; the tight start runs the render at ≈ 1.8× native. At 2048 px it stays sharp until the render→code swap. | `<Archive renders={{wall}}>` (registered to code cols 4–9 × rows 1–5, `wallRenderRect()`) |
| 4 | `BIM354_T06_trim-notice_b.png` (tab magenta, no cyan stripe) | P12's note must carry a magenta tab and no cyan; the current render has a cyan stripe that UI-kit crops regrade with a CSS filter. A clean render removes the patch. | `TrimNote imageSrc` (KIT_UI); the in-Archive note stays code |
| 5 | `BIM351_T06_overwrite-slot_c.png` | The current `_c` is nearly the same view as `_a`. P16 "Replaced in place" needs a real close detail: the old insert half out, the new one entering the same slot. | `<Prop src>` / `SwapVariant srcs` on the hardware stage (P09, P16) |
| 6 | `BIM347_T06_recovery-scanner_c.png` | Only partly isolated today (base dropped, everything else kept). P16's "lab lens probes the overwritten boxes" wants the lens and record holder alone, close. | `ScannerProp imageSrc` (KIT_UI) |
| 7 | `BIM362_T06_ftl-map_b.png` (keys white/amber, no cyan) | P17's split layers quote this look; the render's cyan keys would read as "the photo". A clean render can sit on the stage beside the code layers. | `<Prop src>` on the stage; the Archive's split layers stay code |

Not requested: the drive actor (the chip under the wall) and the 16-drive row are code by design (§12); the allocation
map is P2 and the Archive's map is code.
