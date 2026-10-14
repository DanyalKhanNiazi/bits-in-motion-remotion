# Ep06 asset map

Phase 0 mapping for the 77 owner-generated transparent PNGs in `public/ep06/assets/`, checked against the 60 prompts BIM313–BIM372 in `inputs/ep06/ASSET_PROMPTS.md` (15 subjects × variants a/b/c/d). Each file was matched by looking at the image, not by its descriptive filename. Contact sheets on #182132 are in `docs/ep06/review/assets_sheet_1..5.png`, numbered in the original-filename sort order.

Every original was **copied** (not renamed) to a lowercase canonical name: `<subject>_<variant>.png`. Where several files fit one slot, the best fit is canonical and the others are `_alt1`, `_alt2`, and so on. Files that belong to no Ep06 prompt are named `extra-<slug>.png`. Code should reference only the canonical names.

Measurements were made with PIL/numpy. Alpha bbox is `x0,y0–x1,y1` (pixels with alpha > 8), and T is the fraction of fully transparent pixels.

**Global findings (apply to every file):**

- All 77 files are RGBA with real transparency (T = 34–79%). The border pixels are transparent in all of them, and none has a checkerboard, a baked background, a floor plate, or readable text or numbers.
- Opaque subject pixels sit at alpha 252–254, not 255, so the subjects are about 1% see-through. This is invisible on the navy background, but it can show if a bright element passes behind an asset.
- Resolution is 1254×1254 for 73 files and 1536×1024 for 4 files. None is at the prompt-preferred 2048 px, so full-frame 4K use will soften. At 1080p, half-frame use is fine.
- Few files keep the requested 12% safety margin; most have a 2–8% margin. `ftl-map_d_alt1` touches the right edge.
- Faint background specks (alpha ≤ 3) appear in a few files (noted per row). They are invisible in practice.

## Map

| Original file | Canonical name | BIM id | Subject | Variant | Size (WxH) | Alpha bbox | Notes |
|---|---|---|---|---|---|---|---|
| Fictional photo card in clear sleeve.png | `fictional-passport_a.png` | BIM313 | fictional-passport | a (three-quarter) | 1254×1254 | 66,107–1203,1190 | T 52%. Three-quarter card on clear sleeve. Best framing, and the card/sleeve layout matches b and d. Sleeve opaque in alpha. |
| Fictional passport photo card(2).png | `fictional-passport_a_alt1.png` | BIM313 | fictional-passport | a (three-quarter) alt | 1254×1254 | 67,91–1227,1192 | T 49%. Three-quarter card on sleeve, card offset up-right. Close to fictional-passport_a. |
| Fictional passport photo card.png | `fictional-passport_a_alt2.png` | BIM313 | fictional-passport | a (three-quarter) alt | 1536×1024 | 243,34–1259,978 | T 62%. Three-quarter card on sleeve, smaller in frame. 1536x1024. |
| Fictional passport photo card(1).png | `fictional-passport_b.png` | BIM314 | fictional-passport | b (frontal) | 1254×1254 | 208,82–1052,1170 | T 43%. Straight-on: portrait card over clear sleeve, blank lower border. Sleeve opaque in alpha (baked translucency). |
| Exploded fictional passport card.png | `fictional-passport_d.png` | BIM316 | fictional-passport | d (exploded) | 1254×1254 | 90,120–1218,1107 | T 50%. Sleeve, portrait insert and card separated. Clear sleeve is opaque in alpha (translucency baked as light grey). |
| Open recycle folder with photo card.png | `recycle-folder_a.png` | BIM317 | recycle-folder | a (three-quarter) | 1254×1254 | 108,115–1160,1180 | T 50%. Three-quarter open folder with photo card. Clean. |
| Retained Photo Card Close Detail.png | `recycle-folder_a_alt1.png` | BIM317 | recycle-folder | a (three-quarter) alt | 1254×1254 | 78,71–1204,1227 | T 43%. Named as a close detail, but it shows the whole folder (tighter framing). Bottom margin about 2%. |
| Open navy folder with photo card.png | `recycle-folder_b.png` | BIM318 | recycle-folder | b (frontal) | 1254×1254 | 109,122–1147,1124 | T 34%. Straight-on open folder, lid up, card inside. Stray alpha specks (alpha <=2, invisible). |
| Isolated blank photo card.png | `recycle-folder_c.png` | BIM319 | recycle-folder | c (close detail) | 1254×1254 | 137,95–1156,1189 | T 46%. Polaroid-style blank card on a small navy stand. It matches the folder's card, not the passport card (no portrait). Clean. |
| Exploded recycle folder with photo card.png | `recycle-folder_d.png` | BIM320 | recycle-folder | d (exploded) | 1254×1254 | 147,59–1130,1219 | T 54%. Folder body, photo card above it, lid lifted. Clean. |
| Opened hard drive with actuator arm.png | `hard-drive_a.png` | BIM321 | hard-drive | a (three-quarter) | 1254×1254 | 64,79–1196,1181 | T 53%. Three-quarter opened HDD. Clean. |
| Opened hard-drive platter assembly.png | `hard-drive_b.png` | BIM322 | hard-drive | b (frontal) | 1254×1254 | 170,63–1084,1200 | T 35%. Top-down opened HDD. Clean. |
| Hard drive platter and actuator detail.png | `hard-drive_c.png` | BIM323 | hard-drive | c (close detail) | 1254×1254 | 63,169–1209,1105 | T 57%. Platter stack and actuator head with minimal base. Clean. |
| Exploded hard-drive platter assembly.png | `hard-drive_d.png` | BIM324 | hard-drive | d (exploded) | 1254×1254 | 108,32–1221,1238 | T 50%. Cover lifted, platter stack with spindle, actuator, base. Clean. |
| M.2 SSD controller and NAND board.png | `ssd-board_a.png` | BIM325 | ssd-board | a (three-quarter) | 1254×1254 | 50,296–1235,1055 | T 79%. Three-quarter M.2 board. Clean. |
| SSD Controller and NAND Close-Up.png | `ssd-board_a_alt1.png` | BIM325 | ssd-board | a (three-quarter) alt | 1254×1254 | 50,291–1237,1060 | T 78%. Named close-up, but it is a near-duplicate of ssd-board_a (whole board, same angle). |
| M.2 SSD controller and NAND board(1).png | `ssd-board_b.png` | BIM326 | ssd-board | b (frontal) | 1254×1254 | 51,521–1223,829 | T 77%. Flat straight-on M.2 board: controller plus 4 NAND. Clean. |
| Silver controller beside graphite NAND.png | `ssd-board_c.png` | BIM327 | ssd-board | c (close detail) | 1254×1254 | 74,260–1221,1093 | T 67%. Close-up of controller beside a NAND package on a board section. Clean. |
| Exploded M.2 SSD controller and NAND board.png | `ssd-board_d.png` | BIM328 | ssd-board | d (exploded) | 1254×1254 | 49,233–1243,1143 | T 68%. PCB with controller and 4 NAND packages lifted above their footprints. Clean. |
| Modular storage cluster wall.png | `cluster-wall_a.png` | BIM329 | cluster-wall | a (three-quarter) | 1254×1254 | 67,131–1204,1170 | T 36%. Three-quarter 6x5 wall. Clean. |
| Modular storage cluster wall(1).png | `cluster-wall_b.png` | BIM330 | cluster-wall | b (frontal) | 1254×1254 | 57,170–1199,1124 | T 34%. Straight-on 6x5 wall of bins with blank inserts. Clean. |
| Isolated data compartment detail.png | `cluster-wall_c.png` | BIM331 | cluster-wall | c (close detail) | 1254×1254 | 68,200–1187,1056 | T 52%. One bin in a frame segment with mounting post. Clean. |
| Exploded 6×5 storage wall.png | `cluster-wall_d.png` | BIM332 | cluster-wall | d (exploded) | 1254×1254 | 38,120–1226,1098 | T 43%. Frame with 6x5 bins pulled forward in staggered rows. Clear, consistent with a/b. Front plates stay attached; no separate allocation markers. |
| Exploded storage cluster wall.png | `cluster-wall_d_alt1.png` | BIM332 | cluster-wall | d (exploded) alt | 1254×1254 | 58,67–1193,1145 | T 42%. Frame, lifted top rails, bins and detached front plates. Busier than cluster-wall_d; plates float out of register. |
| Selected Record in Graphite Drawer.png | `index-drawer_a.png` | BIM333 | index-drawer | a (three-quarter) | 1254×1254 | 82,144–1197,1142 | T 52%. Three-quarter drawer with selected card raised. Clean. |
| Graphite drawer with selected card.png | `index-drawer_b.png` | BIM334 | index-drawer | b (frontal) | 1254×1254 | 193,128–1066,1125 | T 48%. Straight-on drawer, selected card raised at front. Stray alpha specks (alpha <=2, invisible). |
| Selected index card record detail.png | `index-drawer_c.png` | BIM335 | index-drawer | c (close detail) | 1254×1254 | 39,244–1225,1098 | T 54%. Card block with selected ruled card. Clean. |
| Exploded index-card drawer, selected record.png | `index-drawer_d.png` | BIM336 | index-drawer | d (exploded) | 1254×1254 | 58,72–1204,1204 | T 51%. Cabinet, pulled drawer, card block and selected card lifted. Clean. |
| NTFS master file table record.png | `mft-record_a.png` | BIM337 | mft-record | a (three-quarter) | 1254×1254 | 74,205–1201,1133 | T 49%. Three-quarter record card. Same baked pictograms as b/d, no text. |
| Master File Table Record Card.png | `mft-record_b.png` | BIM338 | mft-record | b (frontal) | 1254×1254 | 62,257–1206,1014 | T 47%. Straight-on record card: 4 field recesses, 3 reference inserts. Baked pictograms (document/square/calendar/clock), no text. |
| NTFS Data-Reference Compartment Detail.png | `mft-record_c.png` | BIM339 | mft-record | c (close detail) | 1254×1254 | 209,103–1136,1168 | T 47%. Data-reference column (3 inserts) with side latch. Clean. |
| Exploded master file record.png | `mft-record_d.png` | BIM340 | mft-record | d (exploded) | 1254×1254 | 64,216–1210,1083 | T 55%. Record card with 3 reference inserts pulled out. Baked pictograms (document/calendar/clock), no text. |
| Allocation matrix with occupancy markers.png | `allocation-map_a.png` | BIM341 | allocation-map | a (three-quarter) | 1254×1254 | 61,192–1228,1091 | T 63%. Three-quarter matrix, raised metadata-card mount, 6 loose markers. Clean. |
| Allocation Matrix with Metadata Mount.png | `allocation-map_b.png` | BIM342 | allocation-map | b (frontal) | 1254×1254 | 56,204–1221,1097 | T 41%. Top-down matrix (7x6 grid) with card mount at right and 8 loose markers (cyan/magenta accents). Clean. |
| Occupancy marker macro detail.png | `allocation-map_c.png` | BIM343 | allocation-map | c (close detail) | 1254×1254 | 88,219–1172,1137 | T 69%. A single marker in its grid cell. Clean. |
| Exploded allocation bitmap assembly.png | `allocation-map_d.png` | BIM344 | allocation-map | d (exploded) | 1254×1254 | 87,84–1176,1179 | T 61%. Weak d: almost identical to a. Mount slightly raised and framing slightly larger; markers loose as in a. |
| Index card inspection scanner and tray.png | `recovery-scanner_a.png` | BIM345 | recovery-scanner | a (three-quarter) | 1254×1254 | 22,121–1236,1171 | T 56%. Three-quarter: lens column over a blank record holder, slotted destination tray. Clean. |
| Recovery scanner with inspection frame and tray.png | `recovery-scanner_a_alt1.png` | BIM345 | recovery-scanner | a (three-quarter) alt | 1254×1254 | 42,130–1216,1092 | T 61%. Three-quarter scanner, but the holder carries a hard-drive platter instead of a blank record (off-prompt). |
| Recovery scanner with blank record and tray.png | `recovery-scanner_b.png` | BIM346 | recovery-scanner | b (frontal) | 1254×1254 | 27,120–1229,1140 | T 47%. Straight-on scanner, blank record, tray at right. Clean. |
| Inspection frame and destination tray.png | `recovery-scanner_c.png` | BIM347 | recovery-scanner | c (close detail) | 1254×1254 | 18,70–1240,1241 | T 54%. Partial c: enlarged, and the base plate is dropped (the record holder frame, lens column and destination tray remain), but most of the fixture is still shown because the focus feature (inspection position + separate destination) spans it. Bottom margin about 1%. |
| Exploded recovery scanner and destination tray.png | `recovery-scanner_d.png` | BIM348 | recovery-scanner | d (exploded) | 1254×1254 | 26,74–1236,1229 | T 53%. Lens column, record holder lifted off base, destination tray. Clean. |
| Single-slot overwrite storage fixture.png | `overwrite-slot_a.png` | BIM349 | overwrite-slot | a (three-quarter) | 1254×1254 | 54,253–1216,1033 | T 64%. Three-quarter bay with old insert and replacement insert. Clean. |
| Storage bay_ old and replacement inserts.png | `overwrite-slot_a_alt1.png` | BIM349 | overwrite-slot | a (three-quarter) alt | 1254×1254 | 47,184–1209,1089 | T 56%. Realistic server hot-swap drive cage with HDD caddies. Off-family style (not the navy single-slot bay). |
| Storage bay with old and replacement inserts.png | `overwrite-slot_b.png` | BIM350 | overwrite-slot | b (frontal) | 1536×1024 | 186,130–1352,893 | T 45%. Straight-on bay and replacement insert, about 12% margins. 1536x1024. |
| Single-slot holder with silver inserts.png | `overwrite-slot_b_alt1.png` | BIM350 | overwrite-slot | b (frontal) alt | 1254×1254 | 8,228–1246,1028 | T 37%. Straight-on bay and replacement insert. Spans nearly full width (8 px margins); alpha specks <=3 over about 5% of the background. |
| Replacement insert in occupied storage bay.png | `overwrite-slot_c.png` | BIM351 | overwrite-slot | c (close detail) | 1254×1254 | 74,202–1232,1144 | T 52%. Weak c: the whole subject (occupied bay plus replacement insert) at closer framing, nearly the same view as overwrite-slot_a. The named focus feature is the whole subject, so nothing is omitted. Clean. |
| Exploded storage bay with insert swap.png | `overwrite-slot_d.png` | BIM352 | overwrite-slot | d (exploded) | 1254×1254 | 64,151–1221,1165 | T 53%. Bay, old insert half out, replacement insert. Clean. |
| TRIM range-card notification envelope.png | `trim-notice_a.png` | BIM353 | trim-notice | a (three-quarter) | 1254×1254 | 88,133–1225,1116 | T 55%. Three-quarter sleeve with cards beside M.2 landmark. Clean. |
| TRIM envelope with range cards.png | `trim-notice_b.png` | BIM354 | trim-notice | b (frontal) | 1254×1254 | 96,163–1188,1109 | T 40%. Straight-on sleeve with cards, M.2 controller landmark in front. Clean. |
| Isolated TRIM range-card insert.png | `trim-notice_c.png` | BIM355 | trim-notice | c (close detail) | 1254×1254 | 51,51–1241,1216 | T 38%. Sleeve holding 4 blank range cards, no controller. Clean. |
| Blank white range-card stack.png | `trim-notice_c_alt1.png` | BIM355 | trim-notice | c (close detail) alt | 1536×1024 | 76,44–1484,992 | T 41%. Four blank range cards only, no sleeve or mounting. 1536x1024. Alt to the c slot. |
| Exploded trim envelope with range cards.png | `trim-notice_d.png` | BIM356 | trim-notice | d (exploded) | 1254×1254 | 159,47–1225,1240 | T 50%. Lid flap and cards lifted from sleeve, M.2 controller landmark. Clean. |
| SSD erase-block tray.png | `erase-block-tray_a.png` | BIM357 | erase-block-tray | a (three-quarter) | 1254×1254 | 68,97–1219,1189 | T 59%. Three-quarter tray with 4 page inserts, spare page and fresh frame. Clean. |
| Exploded SSD erase-block tray.png | `erase-block-tray_a_alt1.png` | BIM357 | erase-block-tray | a (three-quarter) alt | 1254×1254 | 67,60–1227,1213 | T 57%. Named exploded, but it is a near-duplicate of erase-block-tray_a (same 3-part layout, slightly closer framing). Nothing is lifted apart. |
| SSD erase-block tray(1).png | `erase-block-tray_b.png` | BIM358 | erase-block-tray | b (frontal) | 1254×1254 | 60,150–1194,1135 | T 44%. Straight-on: 4-page tray, single page, fresh frame. Stray alpha specks (alpha <=1). |
| Isolated SSD erase-block frame.png | `erase-block-tray_c.png` | BIM359 | erase-block-tray | c (close detail) | 1254×1254 | 22,192–1237,1151 | T 71%. Empty block frame with 4 page bays. Clean. |
| Exploded navy erase-block tray.png | `erase-block-tray_d.png` | BIM360 | erase-block-tray | d (exploded) | 1254×1254 | 44,28–1217,1228 | T 58%. Page inserts lifted above block frame, separate fresh frame. Clean. |
| Logical-to-physical SSD mapping fixture.png | `ftl-map_a.png` | BIM361 | ftl-map | a (three-quarter) | 1254×1254 | 21,209–1237,1109 | T 60%. Three-quarter: 8 logical keys, 6 link arms, rear physical field, spare insert. Clean. |
| Logical-to-physical storage mapping fixture.png | `ftl-map_b.png` | BIM362 | ftl-map | b (frontal) | 1254×1254 | 52,243–1221,1088 | T 47%. Straight-on: 8 keys, 6 links, physical field, spare insert. Clean. |
| Macro SSD Mapping Link.png | `ftl-map_c.png` | BIM363 | ftl-map | c (close detail) | 1254×1254 | 48,40–1225,1239 | T 74%. One link arm between a logical key and a physical cell. Clean. |
| Exploded dual-deck mapping assembly.png | `ftl-map_d.png` | BIM364 | ftl-map | d (exploded) | 1254×1254 | 43,120–1225,1186 | T 60%. Logical deck (7 keys), 5 lifted link arms, rear physical field, spare insert. Clean. |
| Exploded logical-to-physical SSD mapping.png | `ftl-map_d_alt1.png` | BIM364 | ftl-map | d (exploded) alt | 1254×1254 | 8,92–1254,1194 | T 57%. Near-duplicate of ftl-map_d. Subject touches the right edge (0 px margin, clipped). |
| SSD Board with Reserved Compartment.png | `spare-flash_a.png` | BIM365 | spare-flash | a (three-quarter) | 1254×1254 | 36,200–1217,1028 | T 65%. Three-quarter: SSD, reserve compartment, boundary panel. Clean. |
| SSD Board with Reserved Compartment(1).png | `spare-flash_b.png` | BIM366 | spare-flash | b (frontal) | 1254×1254 | 99,316–1162,1007 | T 57%. Straight-on: compartment, SSD below, boundary panel edge-on at right. Clean. |
| Reserved compartment close-up.png | `spare-flash_c.png` | BIM367 | spare-flash | c (close detail) | 1254×1254 | 68,74–1209,1215 | T 47%. Reserve compartment with boundary frame, no SSD. Clean. |
| Exploded SSD reserve compartment.png | `spare-flash_d.png` | BIM368 | spare-flash | d (exploded) | 1254×1254 | 18,125–1230,1057 | T 58%. SSD stick, compartment carrier pulled out of housing, boundary panel separated. Clean. |
| Drive encryption key fixture.png | `encryption-key_a.png` | BIM369 | encryption-key | a (three-quarter) | 1254×1254 | 65,71–1210,1190 | T 56%. Three-quarter: open key case with key-shaped recess, key, 8-tile data tray. Clean. |
| Top-down navy encryption kit with eight tiles.png | `encryption-key_b.png` | BIM370 | encryption-key | b (frontal) | 1536×1024 | 250,28–1318,989 | T 47%. Top-down holder, key and 8-tile tray (matches a/d). 1536x1024. |
| Encryption Key, Data Tray, Holder.png | `encryption-key_b_alt1.png` | BIM370 | encryption-key | b (frontal) alt | 1254×1254 | 172,42–1208,1200 | T 39%. Top-down view, but the tray has 6 tiles while a/c/d have 8. Component count mismatch, so used as alt. |
| Isolated encryption key holder detail.png | `encryption-key_c.png` | BIM371 | encryption-key | c (close detail) | 1254×1254 | 20,53–1243,1250 | T 35%. Close-up of key seated in the open holder. Bottom margin 3 px. |
| Exploded encryption key fixture.png | `encryption-key_d.png` | BIM372 | encryption-key | d (exploded) | 1254×1254 | 123,68–1125,1233 | T 65%. Holder, key and 8-tile tray separated diagonally. Clean. |
| Matte navy compute cube on aluminum base.png | `extra-compute-cube.png` | — | — | — | 1254×1254 | 156,178–1121,1141 | T 50%. Not an Ep06 prompt. Navy cube on aluminium base. |
| Single navy compute module product cutout-3.png | `extra-compute-cube_alt1.png` | — | — | — | 1254×1254 | 183,220–1080,1132 | T 62%. Not an Ep06 prompt. Navy compute module with cyan dot on a base. |
| Precision 10×10×10 compute cube-1.png | `extra-compute-lattice.png` | — | — | — | 1254×1254 | 163,189–1092,1129 | T 58%. Not an Ep06 prompt. 10x10x10 cube lattice on a base. |
| Industrial GPU Accelerator Card Render.png | `extra-gpu-card.png` | — | — | — | 1254×1254 | 19,169–1235,1102 | T 60%. Not an Ep06 prompt. Industrial GPU accelerator card. |
| Precision hourglass with coral sand-2.png | `extra-hourglass.png` | — | — | — | 1254×1254 | 344,66–912,1192 | T 69%. Not an Ep06 prompt. Hourglass with real translucent glass alpha. |
| Premium hourglass with coral sand.png | `extra-hourglass_alt1.png` | — | — | — | 1254×1254 | 383,133–874,1123 | T 74%. Not an Ep06 prompt. Hourglass; glass reads milky (less translucent). |

## Coverage

✓ = canonical file present (`<subject>_<variant>.png`). Weak fits are flagged in the Notes column above.

| Subject (BIM) | a (three-quarter) | b (frontal) | c (close detail) | d (exploded) | alts |
|---|---|---|---|---|---|
| fictional-passport — Fictional passport-photo card (313–316) | ✓ | ✓ | **MISSING** | ✓ | `fictional-passport_a_alt1.png`, `fictional-passport_a_alt2.png` |
| recycle-folder — Recycle holding folder (317–320) | ✓ | ✓ | ✓ | ✓ | `recycle-folder_a_alt1.png` |
| hard-drive — Hard-drive platter assembly (321–324) | ✓ | ✓ | ✓ | ✓ | — |
| ssd-board — SSD controller and NAND board (325–328) | ✓ | ✓ | ✓ | ✓ | `ssd-board_a_alt1.png` |
| cluster-wall — Storage cluster wall (329–332) | ✓ | ✓ | ✓ | ✓ | `cluster-wall_d_alt1.png` |
| index-drawer — Index-card drawer (333–336) | ✓ | ✓ | ✓ | ✓ | — |
| mft-record — Master File Table record (337–340) | ✓ | ✓ | ✓ | ✓ | — |
| allocation-map — Allocation bitmap support (341–344) | ✓ | ✓ | ✓ | ✓ (weak) | — |
| recovery-scanner — Recovery scanner and copy tray (345–348) | ✓ | ✓ | ✓ (partial) | ✓ | `recovery-scanner_a_alt1.png` |
| overwrite-slot — Overwrite data-slot fixture (349–352) | ✓ | ✓ | ✓ (weak) | ✓ | `overwrite-slot_a_alt1.png`, `overwrite-slot_b_alt1.png` |
| trim-notice — TRIM notification envelope (353–356) | ✓ | ✓ | ✓ | ✓ | `trim-notice_c_alt1.png` |
| erase-block-tray — SSD housekeeping erase-block tray (357–360) | ✓ | ✓ | ✓ | ✓ | `erase-block-tray_a_alt1.png` |
| ftl-map — Logical-to-physical mapping fixture (361–364) | ✓ | ✓ | ✓ | ✓ | `ftl-map_d_alt1.png` |
| spare-flash — Reserved spare-flash compartment (365–368) | ✓ | ✓ | ✓ | ✓ | — |
| encryption-key — Drive-encryption key fixture (369–372) | ✓ | ✓ | ✓ | ✓ | `encryption-key_b_alt1.png` |

Filled: 59/60 slots. Missing: fictional-passport_c.

- `fictional-passport_c` (BIM315, close detail of the photo card and its blank metadata border): no file isolates it. All five passport renders (a, a_alt1, a_alt2, b, d) show the whole card with its sleeve. A crop of `fictional-passport_b` (card, lower border) is the nearest stand-in. `Isolated blank photo card.png` is the recycle-folder card (polaroid-style, no portrait), not this one.
- `recovery-scanner_c` is only partly isolated: the base plate is dropped, but the lens column, record holder and destination tray all remain.
- `overwrite-slot_c` is the whole subject at closer framing, nearly the same view as `overwrite-slot_a`.
- `allocation-map_d` is barely separated and nearly identical to `allocation-map_a`.
- Component-count drift within a family: `ftl-map` (a/b have 8 keys and 6 links, d has 7 keys and 5 links), `encryption-key` (8 tiles in a/b/d, 6 tiles in `encryption-key_b_alt1`), `allocation-map` (b has 8 loose markers, a and d have 6) and `trim-notice` (d holds 5 range cards, a/b/c hold 4).

## Unrelated extras

These files are not Ep06 prompts. They appear to come from other episodes, are kept only under `extra-` names, and are not part of the Ep06 coverage.

- `extra-compute-cube.png` ← Matte navy compute cube on aluminum base.png (1254×1254). Navy cube on aluminium base.
- `extra-compute-cube_alt1.png` ← Single navy compute module product cutout-3.png (1254×1254). Navy compute module with cyan dot on a base.
- `extra-compute-lattice.png` ← Precision 10×10×10 compute cube-1.png (1254×1254). 10x10x10 cube lattice on a base.
- `extra-gpu-card.png` ← Industrial GPU Accelerator Card Render.png (1254×1254). Industrial GPU accelerator card.
- `extra-hourglass.png` ← Precision hourglass with coral sand-2.png (1254×1254). Hourglass with real translucent glass alpha.
- `extra-hourglass_alt1.png` ← Premium hourglass with coral sand.png (1254×1254). Hourglass; glass reads milky (less translucent).

## Second-pass verification

Every canonical slot and alt was checked against the four BIM prompts of its subject, on one labelled sheet per subject. All 77 originals are in the table exactly once, every canonical copy is byte-identical to its listed original, and every size, alpha bbox and T value was re-measured and matches. No file was moved, re-copied or removed: every subject, variant letter, canonical-versus-alt choice and extra- file was confirmed. The six extra- files (compute cubes, lattice, GPU card, hourglasses) match none of the 15 subjects. `fictional-passport_c` is still missing. These corrections were made to the text:

1. `recovery-scanner_c`: the note said "same full fixture at tighter framing". The base plate is in fact dropped. The note and grid now say "partial".
2. `overwrite-slot_c`: it was not flagged, but it is the whole subject at closer framing. The note and grid now say "weak".
3. `fictional-passport_c` note: there are five passport renders, not four.
4. Component-count drift: `allocation-map` (8 vs 6 loose markers) and `trim-notice` (5 vs 4 range cards) were added.

The grid of all canonical a–d files (15 rows × 4 columns) is in `docs/ep06/review/assets_canonical.png`.

Verified by a second pass: 4 corrections.
