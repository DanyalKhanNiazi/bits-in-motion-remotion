# Ep06 UI and props kit (`src/ep06/kit/ui`)

Imported through the kit barrel (`import {ExplorerWindow, RecycleBin, …} from '../kit'`). Demo: `src/entries/ep06kitui.tsx`
(`KitUI`, 30 s; measured 0.56 s/frame/tab at `--scale 0.5 --concurrency 3`, 900 f in 169 s); sheet: `docs/ep06/kit_ui_sheet.png`. Every component takes the ABSOLUTE `frame`; event props are absolute
frames. Render-based props wrap `<Prop>` (pass `float tiltX tiltY rim sweep shadow enter exit`) and take `imageSrc` to swap a
future render in (keep the framing, or the measured regions stop matching). Colours: Windows UI dark (`WIN`), selection
`PAL.structure`; cyan only for the photo's Bits (the scanner's copy stream); amber = the drive (clock, key); coral = loss
(tally, missing bands, "lost" chip); magenta = the one accent (verdict word, TRIM tab, `/w`).

## Windows UI (one generic dark chrome; LOCAL px, scales with its parent)
On the desk monitor put it in `<ScreenSlot rect={REGIONS.deskScreen}>` (a **1032 × 547 slot**) in the photo env's `children`.
**Slot → screen = `deskSlotScale(frame, kb)`** = 1.1483 × kb.s: wide drift ≈ 1.2, `DESK.kbMonitor` ≈ 1.78, `DESK.kbScreen` ≈ 1.98.
Defaults are sized so must-read text clears 40 px at ≈ 1.2 (file name 36 slot px → 43 px). Pass `scale={deskSlotScale(f, kb)}`
to get `[kit] text below floor` warnings.
```tsx
const BIN = {x: 872, y: 300, w: 236};                       // slot px
<ScreenSlot rect={REGIONS.deskScreen}><WinDesktop frame={f} w={1032} h={547}>
  <RecycleBin frame={f} {...BIN} holdsPhoto={d + 19} restoreAt={r} />
  <ExplorerWindow frame={f} x={34} y={30} w={640} h={452} selectAt={s} scale={deskSlotScale(f, kb)}
    actions={[{at: d, kind: 'delete'}, {at: r, kind: 'restore'}]} flyTo={binFlyTo(BIN)} cursor={[{f: s - 9, x: 600, y: 440}, {f: s, x: 300, y: 218, click: true}]} />
</WinDesktop></ScreenSlot>
```
- `ExplorerWindow {x y w h fontSize=36 selectAt actions[{at, kind: delete|shiftDelete|restore}] flyTo flyDur=18 cursor rows enterAt exitAt scale}`:
  "Pictures" title, "This PC › Pictures", `passport.jpg` + blank rows. delete = the file arcs to `flyTo` (18 f); shiftDelete =
  white flash and crumble, no bin; restore = flies back from `flyTo`. **Hook:** `explorerFlight(props, frame)` → `{x, y, s, u, kind}`
  (parent px) while in flight, to attach Bits. `binFlyTo(binPlacement, thumbH = 62 × fontSize/36)` lands it on the bin's card.
- `PhotoViewer {x y w h openAt exitAt imageSrc='fictional-passport_b' name='passport.jpg' s}`.
- `WinDesktop {w h taskbar}`: the plain dark desktop (no wallpaper, taskbar without clock). `WinFrame`, `Cursor {keys[{f,x,y,click}]}`.
- `SettingsToggle {x y w title sub state: on|off|unknown flipAt flipTo at exitAt size=44 icon: lock|reset|none magnifier{at,until} scale}`
  (centre at x, y). `unknown` = dashed track, "?" knob, no On/Off word.
  `<SettingsToggle frame={f} x={960} y={250} w={1080} title="Device encryption" state="unknown" at={a} magnifier={{at: a + 14}} />`
- `CommandWindow {x y w h text='cipher /w:C:\' typeAt rate=0.5 chars/f prompt='C:\>' highlight='/w' highlightAt fontSize=40 enterAt exitAt scale}`.

## Props (render-based, through `<Prop>`)
- `RecycleBin {…Prop, holdsPhoto flushAt restoreAt emptyHoverAt emptyUntil menuText='Empty Recycle Bin' menuSize=44 screen}`:
  `recycle-folder_a`; the passport photo is composited into the card window (an empty bin shows the blank card). The menu is a chip
  (`screen` in a zoomed Stage; inside the desk slot pass `screen={deskSlotScale(f, kb)}`). `recycleBinPoint(p, 'window'|'mouth'|'menu')`.
- `ScannerProp {…Prop, beam{at,until} scan{at,dur=36,every,until} beamTo{x,y,rx,ry} tray: none|unknown|photo|empty|partial trayAt fillDur=40 missing[{at,y0,y1}] copyBits}`:
  white beam lens → plate (or `beamTo`, parent px), sweep line, tray card standing in the tray (a separate unit, LED blinks while
  copying), cyan copy Bits plate → tray. `scannerAnchors(p)` → `lens beamOrigin plate tray trayCard trayCardTop scale`.
  `<ScannerProp frame={f} x={900} y={520} w={960} beam={{at: a}} scan={{at: a + 4, every: 40}} tray="photo" trayAt={a + 20} />`
- `TrimNote {variant: render|envelope, x y w, at exitAt (envelope) | enter exit (render), path{pts, at, dur, stopAt} slot{x,y,h} numbers numberSize=20}`:
  `trim-notice_b` (cyan stripe → magenta) or a code sleeve with a magenta tab; decor box numbers 021–023 · 058–060 · 098–100 (≤ 24 px).
  `stopAt` (0..1 of the path) halts it with a recoil (the multi-drive-array beat). `trimNotePos(p, f)` → `{x, y, vx, vy, stopped, hit}`.
- `KeyFixture {…Prop, part: all|key|base, slotAt slotTo{x,y,rot} pullAt shatterAt glow}`: `encryption-key_a` (LEDs → amber); the key
  is cut out as its own layer once it moves: slots into the groove beside the tiles (tiles glow amber), pulls out, shatters into
  amber-edged shards (24 seeded triangles). `keyFixtureAnchors(p)` → `keyBow keyTip slot tiles scale`.
- `PassportCard {…Prop, variant: desk|screen, dissolveAt dissolveDur=12 sinkTo{x,y,at,dur,scale}}`: `fictional-passport_a` / `_b`.
  `passportAnchors(p)` → `card photo` quads + `photoCenter` (where PhotoBits starts). `<FictionalNote frame at />` = "Fictional example".

## Text pieces (counter-scale with `screen` in zoomed stages)
- `VerdictCard {at text accentWord exitAt y=855 x=960 size=72 chip{text,tone} screen}`: keyword ≥ 64 px, ≤ 12 words; the accent word is magenta.
- `VerdictChip {at text tone: kept|lost|neutral x y align exitAt size=44 screen}`: kept = ink/white dot, lost = coral, neutral = grey edge.
- `QuoteStrip {at exitAt source quote | reported x y=928 (bottom edge) align maxWidth size=46 screen}`: quote = curly quotes + "— source"
  (32 px); reported = "Source: text", never quotation marks; body ≤ 12 words; it is a strip, never a full-frame card.
  `<QuoteStrip frame={f} at={a} source="NIST, the US standards agency" quote="Overwriting typically hinders the recovery of data" />`
- `KeyCap {keys at pressAt hold=8 stagger=4 exitAt size=52 flash screen}`: `['Shift', 'Delete']` presses Shift first, holds, then Delete.

## Glyphs
- `ClockGlyph {x y size=140 at exitAt period=75}`: amber ring, 12 ticks, a sweeping hand and wedge; no numerals.
- `WriteTally {x y hits[] size=64 at exitAt}`: coral notches in fives (four + slash), each slams on its hit frame; no digits.
- `ScrambleField {rect{x,y,w,h} at dur exitAt seed size=22 every=3 fill}`: MONO glyphs (letters and symbols, no digits) in muted ink,
  one `<text>` per row, reseeded every 3 f. `ScrambleRows` = the same inside an existing `<svg>`.

## Measured regions (`UI_REGIONS`, native px of the 1254² renders; quads TL, TR, BR, BL)
| render | region |
|---|---|
| recycle-folder_a | card 302,308 · 600,234 · 705,598 · 398,580; window 330,323 · 587,260 · 660,513 · 403,576 (≈ 265 px square); front-wall clip |
| recovery-scanner_a | lens ellipse 530,365 r 140×46; beam origin 528,436; plate 400,550 · 718,632 · 593,762 · 275,680; tray rim 955,645 · 1230,715 · 1000,1050 · 695,950; tray card 842,520 · 1072,602 · 1072,912 · 842,830; cyan knobs ×4 → white |
| trim-notice_b | cyan stripe 90,455–119,624 → magenta; magenta tab 830,1068–988,1092; front card face 222,384–1030,512 |
| encryption-key_a | key polygon (22 pts, bbox 765,372–1222,684); tip 784,648; bow 1120,470; slot 900,960 (−7°); tiles 470,698 · 1010,835 · 760,1020 · 318,810; cyan LEDs ×2 → amber |
| fictional-passport_a / _b | card + photo quads (`passA_*`, `passB_*`); _b card 434,209–1048,1113, photo 523,277–958,725 |

## Do / don't
- Do put must-read text in the Stage `hud`, or pass `screen` (chips, verdicts, strips, key caps, the bin's menu) when it sits in the world.
- Do keep one strip, one verdict and ≤ 12 must-read words on screen; the strip runs while the mechanism plays underneath.
- Don't put sizes, dates, user names, clocks or extra file names in the Windows UI; the only file is `passport.jpg`.
- Don't use cyan for UI or props; the scanner's copy Bits are cyan because they ARE the photo's bytes.
- Don't scale a render past 1.3× native; don't swap `imageSrc` to a render with a different framing without new regions.
- Local wrappers (not kit edits): text checks reuse `useTextCheck`/`kitWarn` from `text.tsx`; nothing in look/Prop/text was changed.
