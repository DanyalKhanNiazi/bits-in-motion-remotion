# Signal Atlas icons: the hardware and glyph library (style6)

**For:** the icon builder (`src/icons/`) and the engine builder, who consume these components. **Style rules:** `STYLE_BIBLE.md §6`. **Numbers:** `src/engine/tokens.ts` (import from it; never hard-code a colour or stroke). Ep01 needs every icon in §4 and every glyph in §5; §6 specifies the icons the planned topics will need, so the library is designed once.

The old tests drew rectangles with a pip. These icons are **machined line art**: precise silhouettes with true identity features, gunmetal top faces, 2.5D sides, a rim light, and states that read on a phone.

---

## 1. Files and ownership

```
src/icons/
  types.ts          the contract (§2, verbatim)
  primitives.tsx    Raised, Outline, Pip, Glow, Detail, StrokeScale helpers (§3.6)
  registry.ts       ICONS: Record<IconType, IconSpec>; getIcon(type)
  index.ts          barrel
  pc/               board, case, cpuLga, chipset, logicBlock, dimm, m2, pcieSlot, spiFlash, vrmStandby,
                    atx24, fpHeader, rearIo, rj45, lanChip, psu, iecPlug, cord, wallSocket, frontPanel,
                    powerButton, led, monitor
  variants/         amdPackage, laptopBoard, socPackage, ecChip, battery
  scene/            signInCard (analogy), commandChip
  glyphs/           statePip, qBadge, eyeBadge, approxChip, visitedMark, stateBadge, brackets, ripple,
                    endTick, scaleChip, powerSymbol, restartGlyph, netJackGlyph, clockGlyph
  topics/           §6 (built when a topic needs them; Ep01 does not)
  IconSheet.tsx     a review composition: every icon at glyph/system/detail in every state (§7)
```

Icons import only `react`, `../engine/tokens` and the kit's path helpers (`../shared/geom`: `rectPath`, `circlePath`, `routePath`, `polyPath`). They never read `useCurrentFrame()`: the frame arrives as a prop, so a plate, a Lens and the main view can draw the same icon at different frames or states. No `Math.random`, no text nodes inside hardware (labels are engine overlays), no filters, no gradients, no blur.

**Build priority (critic change C10; build in this order, ship placeholders for anything not reached):**
- **P0, in almost every frame (first 60 min):** `types.ts`, `primitives.tsx`, `registry.ts` with a placeholder (rounded rect + outline + pip) registered for EVERY `IconType`, then real `board`, `case`, `cpuLga`, `chipset` + `logicBlock`, `psu`, `iecPlug`, `cord`, `wallSocket`, `frontPanel`, `powerButton`, `atx24`, `fpHeader`, `vrmStandby`, `monitor`; glyphs `StatePip`, `QBadge`, `EyeBadge`, `ApproxChip`, `Ripple`, `EndTick`, `ScaleChip`, `PowerSymbol`.
- **P1:** `dimm`, `m2`, `pcieSlot`, `spiFlash`, `rearIo`, `lanChip`, `led`, `signInCard`; glyphs `Brackets`, `CommandChip`, `RestartGlyph`, `NetJackGlyph`, `ClockGlyph`, `VisitedMark`.
- **P2 (S09 only):** `amdPackage`, `socPackage`, `ecChip`, `battery`, `laptopBoard`.
- **Not used in Ep01 (skip):** `rj45` (the RJ45 is a cut-out in `rearIo`), `StateBadge`, every §6 icon.
The registry placeholder means the engine and intro builders are never blocked by a missing icon.

---

## 2. The contract (`src/icons/types.ts`, create it verbatim)

```ts
import type React from 'react';
import type {PartState} from '../engine/tokens';

export type Pt = readonly [number, number];

/** Props every hardware icon accepts. Geometry in WORLD px; the parent <g> applies the camera transform. */
export interface IconBaseProps {
  /** Stable id (unique per view) for clip-path ids. */
  id: string;
  /** Top-face footprint, world px. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** World → screen scale of the view drawing it. Every stroke token is divided by this (non-scaling lines). */
  zoom: number;
  /** Absolute frame (breathing, flips). */
  frame: number;
  /** State now; default 'off'. Passive parts ignore it. */
  state?: PartState;
  /** A state change in progress: the previous state and the frame the 5-frame flip began. */
  flip?: {from: PartState; at: number};
  /** 0..1 opacity of the interior detail group (tokens DETAIL; the view computes it from the on-screen size).
   *  Default 1. The base (silhouette + identity features) is always drawn. */
  detail?: number;
  /** Knockout mode (STYLE_BIBLE §10.3): draw only the side and top-face FILLS (no outline, rim, detail, pip, glow).
   *  The label layer redraws the world this way, clipped to each text box, so labels never read as cards. */
  fillsOnly?: boolean;
  /** 2.5D side offset of the base, world px (the view computes it from EXTRUDE and the camera). [0, 0] = flat. */
  side?: readonly [number, number];
  /** 0..1 tone step of the outline structure → textMuted: "pointed at" (not a state). */
  pointed?: number;
  /** The faked glow: second outline at 3x width in ink. true = ALPHA.glow (0.2); a number = that alpha (the S10
   *  "lookout" swell peaks at 0.35). Only the ONE narrated powered part. */
  glow?: boolean | number;
  /** Pip dock; default 'top-right' (8 px outside). false = no pip (passive parts). */
  pip?: 'top-right' | 'top-left' | 'inside-top-right' | 'inside-top-left' | false;
  /** Whole-icon opacity 0..1 (plates fading back, morphs). Default 1. */
  opacity?: number;
}

/** Named connection and anchor points, world px, computed from the same props. */
export type Ports = Record<string, Pt>;

export type IconType =
  // Ep01: the PC
  | 'board' | 'case' | 'cpuLga' | 'chipset' | 'logicBlock' | 'dimm' | 'm2' | 'pcieSlot' | 'spiFlash'
  | 'vrmStandby' | 'atx24' | 'fpHeader' | 'rearIo' | 'rj45' | 'lanChip' | 'psu' | 'iecPlug' | 'cord'
  | 'wallSocket' | 'frontPanel' | 'powerButton' | 'led' | 'monitor'
  // Ep01: variants and scene props
  | 'amdPackage' | 'laptopBoard' | 'socPackage' | 'ecChip' | 'battery' | 'signInCard'
  // Planned topics (§6)
  | 'router' | 'antenna' | 'phone' | 'laptopOpen' | 'wallSection' | 'rfChip' | 'accessPoint'
  | 'gpuPackage' | 'hbmStack' | 'gpuCard' | 'serverTray'
  | 'cpuDie' | 'core' | 'cacheBlock'
  | 'videoFrame' | 'codecSlab' | 'hdd' | 'ssd25' | 'nandPackage' | 'nandCell' | 'sataPower'
  | 'displayPanel' | 'subpixelTriad';

export interface IconSpec<P extends IconBaseProps = IconBaseProps> {
  type: IconType;
  component: React.FC<P>;
  /** Default footprint, world px. */
  size: {w: number; h: number};
  /** Height class (tokens EXTRUDE.z) used for the 2.5D side. */
  z: number;
  /** Passive parts (connectors, regulators, cords) have no state and no pip. */
  passive: boolean;
  ports: (p: P) => Ports;
}
```

---

## 3. Construction rules (every hardware icon)

### 3.1 Draw order inside one icon
1. **Side** (the 2.5D hull): if `side` ≠ [0, 0], the convex hull of the top-face outline and its copy translated by `side`, filled `COLOR.side`. For rounded rectangles use `raisedHullPath(rect, r, side)` (§3.6). Plates and Lens views pass their own `side`.
2. **Top face**: the silhouette path, filled by material: `body` (packages, boxes), `bodyLo` (plastic), `bodyHi` (metal), `board` (PCBs). State `on`/`alwaysOn` replaces the fill with `activeFill` for the part's *active region* only (e.g. the lookout block, never its whole chipset).
3. **Interior detail** (one group at opacity `detail`, §3.3): 2 px `detail` lines and small fills. Never carries meaning: anything a beginner must see (the rocker's I/O, the pulled plug's pins, the CPU's notches) belongs to the base.
4. **Rim light**: 2 px `rim` at 30% along the top and left edges of the top face (raised parts only; inset 1 px so it never leaves the silhouette).
5. **Outline**: 3 px `structure` (off), 4 px `ink` (on), 3 px `annotation` (visited); `pointed` mixes `structure` → `textMuted`. Width = token / `zoom`.
6. **Glow** (only if `glow`): the outline again at 3× width, `ink` at 20% (or at the given alpha), drawn *under* step 5.
8. **`fillsOnly`**: steps 1–2 only (side and top-face fills). Used by the label knockout (STYLE_BIBLE §10.3).
7. **Pip** (non-passive parts): 14 px square in screen px (`GLYPH2.pip / zoom` world), docked 8 px outside the top-right corner: hollow 2 px `structure` (off), filled `ink` (on), filled and breathing 1.0 → 0.7 → 1.0 over 60 frames phase-locked to f0 (alwaysOn), hollow `annotation` (visited), filled with a 2 px reset bar overhanging 6 px (reset).

### 3.2 States and flips
`state` changes animate over 5 frames from `flip.at` (`arrive`): outline colour and width first (frames 0–3), fill (1–4), pip last (2–5). Breathing never changes on a landing. `opacity` multiplies everything (used by plates and morphs).

### 3.3 Detail (replaces the three LOD levels; critic change C9)
Every icon draws its **base** always: the silhouette plus the identity features listed under "glyph" and "system" in §4 (notches, pin-1, fan ring, inlet, rocker, power symbol…). Its **detail** list (the "detail" entries in §4) is one `<g>` drawn at opacity `detail` = clamp01((shorter on-screen side − 136) / 40) (tokens `DETAIL`; plates and Lens views multiply the size by 1.15). No hysteresis, no crossfade state, no previous-frame camera: detail fades smoothly as the camera zooms. Detail never moves a port or the silhouette, so labels and Bits stay put. Where §4 still says "LOD: glyph = …; system = …; detail = …", read: base = glyph + system, detail group = detail.

### 3.4 Sizes and stroke
Default sizes below are the Ep01 world sizes (world px = screen px at zoom 1). Corner radii: parts 10, internal blocks 6 (square blocks 2), slots and connectors 3; the PCB 14. All strokes in screen px divided by `zoom`: outline 3/4, detail 2, rim 2. At zoom 2.2 a 3 px outline is still 3 px on screen.

### 3.5 Emissive rules
Only these give off light: an `on`/`alwaysOn` active region (activeFill + ink outline), the `glow` outline (one part per frame), a lit LED (neutral white `ink`, not in Ep01), a lit screen (true colour, not in Ep01). Energy fills belong to channels, not icons. Rim light is material and identical on and off.

### 3.6 Primitives (`src/icons/primitives.tsx`)

```ts
export const sw: (px: number, zoom: number) => number;                 // stroke width in world units
export const raisedHullPath: (r: {x: number; y: number; w: number; h: number}, radius: number, side: readonly [number, number]) => string;
export const Raised: React.FC<{d: string; side?: readonly [number, number]; hull?: string}>;   // side fill under the top face
export const TopFace: React.FC<{d: string; fill: string}>;
export const RimLight: React.FC<{rect: {x: number; y: number; w: number; h: number}; radius: number; zoom: number}>;
export const Outline: React.FC<{d: string; state: PartState; zoom: number; pointed?: number; flip?: {from: PartState; at: number}; frame: number}>;
export const Glow: React.FC<{d: string; zoom: number; on: boolean}>;
export const Pip: React.FC<{rect: {x: number; y: number; w: number; h: number}; dock: IconBaseProps['pip']; state: PartState; zoom: number; frame: number; flip?: {from: PartState; at: number}}>;
export const Detail: React.FC<{d: string; zoom: number; fill?: boolean; opacity?: number}>;
export const detailOf: (minSidePx: number, bias?: number) => number;   // tokens DETAIL; 0..1
```
`Glow` takes `alpha: number` (0 = off). In `fillsOnly` mode every primitive except `Raised` and `TopFace` returns null.

---

## 4. Ep01 catalogue (the PC, its variants and scene props)

Notation: **Size** = default world px (Ep01 world, `STORYBOARD.md §1`). **z** = height class. **Ports** are world points derived from `x, y, w, h` (fractions given where useful). Every icon also has `center`, `topLeft`, `topRight`, `bottomLeft`, `bottomRight`, `top`, `bottom`, `left`, `right` (edge midpoints) and, if not passive, `pip`.

### 4.1 `board`: motherboard PCB
- **Size** 840 × 610 · **z** 2 (pad) · passive (a carrier; never lit).
- **Look:** `board` fill, 3 px `structure` outline at r 14; mounting holes as `side` discs (r 6) with a 2 px `detail` ring at the standard ATX positions (6 holes: corners and two along the long edges).
- **LOD:** glyph = plate; system = + holes; detail = + holes and a 2 px `detail` keep-out ring around the CPU socket.
- **Props:** `holes?: Pt[]` (relative 0..1; default ATX six).
- **Ports:** `edgeBottom(xFrac)`, `edgeLeft(yFrac)` via `boardEdge(p, side, frac)` helper.

### 4.2 `case`: tower interior (deck)
- **Size** 1130 × 816 · **z** 0 · passive.
- **Look:** `deck` fill, 2 px `deckEdge` outline, r 18; no detail (it is the ground of the machine).
- **Props:** none beyond the base.

### 4.3 `cpuLga`: desktop processor in an LGA1700 socket (the "big dark CPU")
- **Size** 260 × 260 (socket frame) · **z** 10 (module).
- **Look:** socket frame (`bodyLo`, r 8); package substrate 200 × 240 centred (`body`; the real 37.5 × 45 mm ratio); heat spreader 176 × 204 (`bodyHi`, r 6) with **two side notches per long side** (10 × 24) — the LGA1700 silhouette; **pin-1 triangle** (14 px, `detail` fill) at the substrate's bottom-left.
- **LOD:** glyph = frame + IHS rectangle; system = + substrate, notches, pin-1; detail = + rows of SMD capacitors on the substrate's short edges (6 × 4 px `detail` rects, 8 px pitch), the retention lever on the right edge (a 2 px `detail` bar with a 10 px hook) and four load-plate screws (r 5 `detail` rings).
- **States:** `off` for the whole Ep01 intro, including inside plates (a parked Bit means "has control", the outline never turns `ink`). `on`, `reset` exist for later chapters.
- **Ports:** `dmiOut` (bottom centre), `memRight` (right edge, 30% down), `tagLeft` (left edge, 22% down), `tagLeft2` (left edge, 52% down), `bitAnchor` (centre).
- **Props:** `ihs?: boolean` (default true), `cooler?: 'none' | 'ghost'` (default 'none': the map shows the bare package).

### 4.4 `chipset`: the PCH package, drawn x-ray so its inner blocks show
- **Size** 260 × 190 · **z** 8 (package).
- **Look:** substrate `body` r 10; a **die window** inset 18 px (2 px `detail` outline, fill `board`), inside which `blocks` are drawn as `logicBlock` children; small SMD caps along the bottom edge (detail).
- **The package outline never lights.** Only a child block can be `on`.
- **LOD:** glyph = package + blocks as flat rectangles; system = + die window; detail = + caps.
- **Props:**
  ```ts
  interface ChipsetProps extends IconBaseProps {
    blocks: Array<{key: string; shape: 'wide' | 'square'; rel: {x: number; y: number; w: number; h: number}; state: PartState;
                   flip?: {from: PartState; at: number}; badge?: 'q' | null; glow?: boolean | number}>;
    xray?: number;             // 0..1, default 1: the die window's opacity (0 = a plain closed package; tweenable)
    clockGlyphAt?: Pt | null;  // RTC wake glyph position (relative), drawn from S11
  }
  ```
- **In tween scenes** (S09 stops, `ENGINE.md §10.5`) the blocks are authored as standalone `logicBlock` parts drawn above their package (same size, same states), so they can move from one package to another; the package is then drawn with `blocks: []`.
- **Ports:** `block:<key>.center|top|bottom|left|right|in1|in2`, `dmiIn` (top centre), `standbyIn` (bottom edge under the first wide block), `pwrbtnIn` (bottom edge under the wide block's right third).

### 4.5 `logicBlock`: a block inside a package (the lookout, the "?")
- **Size** wide 72 × 36 (lookout), square 64 × 64 ("?") · **z** 3 (inside the package; its 2.5D side is part of the detail group).
- **Look:** wide = r 6, low and long (the always-on logic); square = r 2, squarer and taller (the hidden processor). They must never share a shape (guardrail S05).
- **States:** `alwaysOn` (lookout: `activeFill`, 4 px `ink`, breathing pip, the default glow holder); `off` ("?": `body`, `structure`, hollow pip); `on` ("?" only inside the flash-forward and the S06 preview); `visited` (plates).
- **Badge:** `badge: 'q'` docks the "?" badge (§5.2) **on** the block's centre, screen-constant, so it reads at every zoom and inside the Lens.
- **Pip:** the lookout's pip docks `inside-top-right` (it sits in a package window, and at `column` an outside pip would cross the triptych band edge); the "?" keeps the default outside dock.
- **Ports:** `center`, `top` (eye-badge dock), `in1` (bottom, 22% from left: standby), `in2` (bottom, 78%: PWRBTN#), `left` (wake inputs), `bitAnchor`.

### 4.6 `dimm`: one memory slot with its module
- **Size** 14 × 260 · **z** 10.
- **Look:** slot `bodyLo` r 3 with latches (14 × 10) at both ends; the module's edge on top (`board`) with 8 DRAM packages (`body`, 10 × 22) at detail; key notch 40% from the bottom.
- **LOD:** glyph/system = slot + latches; detail = + chips.
- **States:** `off` (Ep01). **Ports:** `top`, `bottom`, `center`.

### 4.7 `m2`: M.2 2280 SSD
- **Size** 280 × 34 · **z** 4.
- **Look:** PCB `board`, connector edge on the left with a key notch, controller (`body`, 34 × 26), two NAND packages (`body`, 64 × 26), a half-moon screw notch at the right end.
- **States:** `off`. **Ports:** `connector` (left end), `center`, `bitAnchor` (controller centre).

### 4.8 `pcieSlot`: x16 graphics slot (empty)
- **Size** 410 × 20 · **z** 6 · passive.
- **Look:** `bodyLo` r 3, the key break at 22% from the left, a latch at the right end. Context only (no wake source).

### 4.9 `spiFlash`: firmware flash (SOIC-8)
- **Size** 46 × 28 · **z** 4.
- **Look:** body `body` r 3, four legs per long side (2 × 6 `detail`), pin-1 dot.
- **States:** `off` (Ep01). The Bit never lands on it (guardrail S06). **Ports:** `left`, `right`, `center`.

### 4.10 `vrmStandby`: standby regulators (5VSB → 3.3 V / 1.8 V)
- **Size** 36 × 26 · **z** 6 · passive (its "powered" truth is the amber channel through it and the S11 wash).
- **Look:** an inductor (rounded square 20 × 20, `bodyHi`, with a 2 px `detail` ring) and two FETs (8 × 6, `body`).
- **Ports:** `in` (bottom centre), `out` (top centre).

### 4.11 `atx24`: 24-pin ATX connector on the board
- **Size** 132 × 26 · **z** 8 · passive.
- **Look:** housing `bodyLo` r 3; 2 × 12 square pins (6 × 6 `detail`) at detail; latch tab on the top edge.
- **Ports:** `pin9` (x = the standby channel), `mainEntry` (x = the main channel), `top`, `bottom`.

### 4.12 `fpHeader`: front-panel header (2 × 5)
- **Size** 50 × 24 · **z** 6 · passive.
- **Look:** housing `bodyLo`; 2 × 5 pins (detail), one missing (the key).
- **Ports:** `pwrSw` (pins 6/8 midpoint), `top`, `bottom`. S03's **end tick** is drawn at `bottom`.

### 4.13 `rearIo`, `rj45`, `lanChip`
- `rearIo`: 38 × 230, z 10, passive; cut-outs at detail: two USB-A (`side` rects 22 × 10), one RJ45, three audio rings. Port `rj45` (the RJ45 cut-out centre).
- `rj45`: 26 × 32, z 12, passive; the latch notch and 8 contacts (detail). Ports `face` (centre), `in` (right edge).
- `lanChip`: 34 × 26, z 4; QFN with pin ticks; state `off` (Ep01: unlabelled). Ports `in` (left), `out` (right), `center`.

### 4.14 `psu`: ATX power supply (side elevation, rear face on the left)
- **Size** 480 × 116 · **z** 22 (box).
- **Look:** box `body` r 10; **rear face** on the left end: IEC C14 **inlet** (20 × 42, `bodyLo`, three pin slots) above a **rocker** (26 × 50, two halves with an `I` bar and an `O` ring as **3 px `annotation`** paths so the state reads in a 560 px triptych band; the pressed half is drawn 3 px lower and its mark steps to `textMuted`; critic change C7); **fan** centred 80 px from the left (circle r 44, `bodyLo`, a 2 px `detail` ring and seven curved blades with a hub r 10; the fan never spins in Ep01); five vent slots (6 × 40) right of the fan; **cable exit** grommet on the top face (96 × 10, `bodyLo`), where the two channels leave.
- **LOD:** glyph = box + inlet + rocker **with its I/O marks** (the rocker's state is meaning in S10, so its marks are base, never detail); system = + fan ring, cable exit; detail = + blades, vents, pin slots.
- **State:** the PSU outline stays `off` in soft-off (main rails OFF are said by a pill; standby is said by the amber channel). Props carry the physical states:
  ```ts
  interface PsuProps extends IconBaseProps {
    rocker: 'I' | 'O' | {from: 'I' | 'O'; to: 'I' | 'O'; at: number};   // 3-frame flip
    fanSpin?: 0;              // reserved: a spinning fan comes with main power (after the intro)
  }
  ```
- **Ports:** `inlet` (centre of the inlet), `rocker`, `standbyOut` (cable exit, left third), `mainOut` (cable exit, right third), `fan`, `nameSlot` (rect right of the fan for a leaderless name), `pillSlot` (rect in the body's lower right).

### 4.15 `iecPlug` and `cord`
- `iecPlug`: C13 connector body 36 × 36 (`bodyLo`, r 6), cord exit on the left. **Prop** `seated: number` (1 = fully in the inlet; 0 = pulled out 40 px left and 16 px down with its three pin sockets and the inlet's three pins visible as **base** features in 2 px `structure`: at 1.22 zoom the plug's shorter side is 44 px, where `detail` is 0, and the pulled plug is the cause in S10's left band). Passive. Ports `cord`, `face`.
- `cord`: a cable path (props `points: Pt[]`, 8 px world, `side` fill with 2 px `structure` edges, 10 px bends). Physical cable, not an energy channel. Passive.

### 4.16 `wallSocket`
- **Size** 64 × 104 (round 2; was 64 × 64) · **z** 6 · passive; a duplex outlet: plate `body` r 8, the upper receptacle holding the PC's plug, the lower one showing two slots and the D-shaped ground hole (`side` fills). Ports `face` (the cord's exit, 46/104 of the height).

### 4.17 `frontPanel`, `powerButton`, `led`
- `frontPanel`: 140 × 116, z 14, passive; the case front strip with two USB-A slots (detail) and docking points for the button and LED.
- `powerButton`: **size** r 36 (72 × 72; was r 30, 14 px on a phone when named), z 6. Bezel ring `bodyLo`; cap `bodyHi` r 27 with the **IEC 60417-5009 power symbol** (§5.13) in 3 px `structure`. **Prop** `press: number` (0..1): the cap scales 1 → 0.9, its symbol and rim light dim 20%, and a 2 px inner `side` ring appears; the engine drives contact in 3 frames and release over frames 6–11. **Ports** `center`, `leadOut` (top edge), `bracketBox` (the rect the brackets lock on: the bezel + 8 px).
- `led`: r 5; `off` = 2 px `structure` ring (the power LED is off for the whole intro). `on` = `ink` fill (later chapters).

### 4.18 `monitor`
- **Size** 280 × 170 (bezel) + stand 20 × 60 + foot 120 × 10 · **z** 10 · room plane (parallax 0.9).
- **Look:** bezel `bodyHi` r 10; screen inset 12, fill `screenBlack` (it never lights in Ep01); stand and foot `body`.
- **Props:** `screen: 'black'` (Ep01) | `'lit'` (later: true colours only).
- **Ports:** `foot` (bottom centre of the foot), `screenRect`, `left`, `right`, `top`.

### 4.19 `amdPackage` (S09 stop)
- **Size** 260 × 260 (the Intel socket footprint, so the swap reads as "same place, different package") · **z** 10.
- **Look:** substrate `body`; the heat spreader drawn **x-ray** (2 px `detail` outline only, so the dies show through it); **two core dies (CCDs)** 56 × 84 (`bodyHi`, r 2) on the left; **one I/O die** 100 × 132 (`bodyHi`, r 4) on the right, large enough to hold the lookout block (72 × 36) and the "?" block (64 × 64) **at scale 1** (critic change C6: blocks keep their size; only their home changes). On Ryzen both live in the processor package (guardrails §4, line "FCH … the logical southbridge within the SOC"; PSP "on-die").
- **No `morph` prop.** The change from the Intel CPU is a scene tween (`ENGINE.md §10.5`): `cpuLga` fades out while `amdPackage` fades in on the same rect, and the two standalone `logicBlock` parts move from the chipset into the I/O die.
- **States:** both blocks keep their Ep01 states (lookout `alwaysOn`, "?" `off` with badge). Unlit otherwise. Never a copy of the Intel layout.
- **Ports:** `iod`, `iodSlot:lookout`, `iodSlot:q` (the blocks' destination rects), `center`.
- **The AMD board's chipset stays** in the stop as a plain closed package (`chipset` with `xray` tweened 1 → 0 and no blocks): AMD boards still carry a chipset for extra I/O, but neither block lives there. Fading it away would claim "AMD boards have no chipset"; keeping its Intel x-ray window would reuse the Intel chipset drawing (guardrails: "never reuse the Intel chipset drawing in an AMD lane").

### 4.20 `laptopBoard`, `socPackage`, `ecChip`, `battery` (S09 stop)
- `laptopBoard`: 600 × 220, z 2, passive; a wide low PCB with docking slots for its parts.
- `socPackage`: 150 × 150, z 8; one processor package with a die window (like the chipset's) large enough for the "?" block at scale 1. No separate chipset is drawn on a laptop (guardrails: "Don't draw a separate chipset chip on a laptop by default"; CSME sits "within the PCH / SoC"), so **the "?" lives in this package**, dim with its badge. `off`.
- `ecChip`: **104 × 72** (was 56 × 44, too small to hold the 72 × 36 lookout block), z 4; a small QFP with legs; it **holds the lookout** at scale 1 (`alwaysOn`, breathing). Ports `slot:lookout`, `center`.
- `battery`: 220 × 120, z 10; a pack with three cell divisions (2 px `detail`), a terminal tab; `off` look (as a supply it is energy; Ep01 does not fill it).
- **No `morph` prop.** The laptop stop is a scene tween (`ENGINE.md §10.5`, critic change C6): the PSU's rect tweens into the battery's; the lookout block moves out of the chipset into the EC; the "?" block moves into the SoC package as the chipset fades; `laptopBoard`, `socPackage` and `ecChip` fade in. End state: battery, SoC with the dim "?", EC with the lit lookout; no ATX PSU, no rocker, no +5VSB, no separate chipset. The "?" must not simply vanish: a beginner would read "laptops have no hidden processor".

### 4.21 `signInCard` (S07 analogy, not hardware)
- **Size** 240 × 150 · flat · passive.
- **Look:** dashed 3 px `annotation` (12/8) outline r 12, an avatar circle (r 22), one field line (120 × 4), one button (80 × 24); all `annotation`, dashed outlines; a ≈ chip (§5.4) at its top-left corner. **Never** placed on the monitor's screen.
- **Props:** `draw: number` (outline 0..1, clockwise from the top-left), `content: number` (0..1 fade).

---

## 5. Glyphs v2 (screen space: constant size at every zoom)

Glyphs are drawn by the engine in screen px at projected world points. Each takes `frame` and its own timing props; each is a pure function of them.

| # | Glyph | Size (screen px) | Props (beyond `x, y, frame`) | Notes |
|---|---|---|---|---|
| 5.1 | `StatePip` | 14 | `state`, `flip?`, `breathe?` | Used by icons through `Pip`; also standalone in plates |
| 5.2 | `QBadge` | 44 / subject 56 / **72 inside a Lens** (`GLYPH2.qBadgeLens`), r 10, 3 px `emphasis` | `size: 'default' \| 'subject' \| 'lens'`, `fillAt?`, `unfillAt?`, `accentAt?: number[]`, `fillFrames = 6` | Glyph "?" Sora 700 at 0.77 × the badge size; fill = `emphasis` body with a `void` glyph; accent = scale 1 → 1.12 → 1 over 6 frames |
| 5.3 | `EyeBadge` | width = clamp(0.9 × the block's on-screen width, 48, 96) (96 inside a Lens); aspect 0.56 | `drawAt`, `drawFrames = 8`, `outAt?`, `blockWidthPx` | Almond with a pupil (r 0.27 of height), dashed 3 px `annotation`, ≈ chip at its left; docks on the lookout's `top` port; draws dashed from the start (02's solid-then-dashed glitch must not recur) |
| 5.4 | `ApproxChip` | 32 × 28, r 6 | `inAt?` | Vector ≈ (two 2 px sine strokes); the font subset has no U+2248 |
| 5.5 | `VisitedMark` | outline of a rect + hollow pip | `rect`, `at`, `outAt?` | 3 px `annotation`, draws on over 8 frames |
| 5.6 | `StateBadge` | 28, r 6 | `kind: 'waiting' \| 'limit' \| 'fault'`, `inAt` | ‖ in `ink`; ! and × in `alert` with `AlertHatch` on the part |
| 5.7 | `Brackets` | box + pad 8, 4 px, serifs 14 | `box`, `lockAt` (snap completes), `fadeAt?` | Snap from 24 px outside over 5 frames with `snap` (4.1% overshoot); `neutral` → `ink` over colour visuals |
| 5.8 | `Ripple` | square 24 → 80, stroke 3 → 1.5, 0.9 → 0 | `at`, `color = info` | Also emits a field `landRipple` event |
| 5.9 | `EndTick` | 3 × 14 | `at`, `angle` | Marks where a wire truly ends (S03: the header) |
| 5.10 | `ScaleChip` | mono 30 px, pad 10 | `text: '×4'`, `inAt`, `outAt?` | `deck` fill, 2 px `structure` border |
| 5.11 | `CommandChip` | capsule, 40 px Sora 600 text + 32 px glyph | `text: 'Restart' \| 'Shut down'`, `glyph: 'restart' \| 'power'`, `land`, `exitAt`, `drawGlyphFrames = 8` | Generic command chip (never a captured menu): 3 px `ink` outline, `deck` fill; the glyph draws on as the chip lands |
| 5.12 | `RestartGlyph` | 32 | `draw: 0..1` | A 300° arc with an arrowhead, 3 px `ink` |
| 5.13 | `PowerSymbol` | any | `size`, `stroke`, `color`, `draw?: 0..1` | IEC 60417-5009: a 300° arc open at 12 o'clock + a vertical bar through the gap |
| 5.14 | `NetJackGlyph` | 56 | `inAt`, `pointed?` | Wake source: RJ45 face (square with the latch notch and 4 contact ticks), 3 px `structure` |
| 5.15 | `ClockGlyph` | 56 | `inAt`, `pointed?` | Wake source (RTC alarm): a circle with two hands at 10:10, 3 px `structure` |

---

## 6. Planned-topic catalogue (specified now, built when the topic is scripted)

Same contract, construction rules and states. Sizes are defaults for a 1920-wide atlas at zoom 1. "Ports" lists the connection points the topic's routes need.

| Topic | Icon | Size · z | LOD content (glyph / system / detail) | States | Ports | Extra props |
|---|---|---|---|---|---|---|
| Wi-Fi | `router` | 320 × 90 · 14 | box / + 3 antennas, status LEDs (off/on white) / + vents, ports | off, on | `antenna[i]`, `wanIn`, `lanOut` | `antennas: 2–4`, `ledState` |
| Wi-Fi | `antenna` | 16 × 120 · 6 | stick / + hinge / + band rings | off, on | `tip`, `base` | `angle` |
| Wi-Fi | `phone` | 110 × 220 · 6 | slab / + screen (`screenBlack` or true colour), camera dot / + radio module x-ray | off, on | `antenna`, `screenRect` | `screen: 'black' \| 'lit'` |
| Wi-Fi | `laptopOpen` | 360 × 240 · 6 | lid + base / + screen, keyboard band / + hinge, radio card | off, on | `antenna`, `screenRect` | `screen` |
| Wi-Fi | `wallSection` | 80 × 400 · 0 | slab / + hatch (2 px at 45°, 10 px pitch) / + layer lines (drywall, studs) | — (passive) | `face` | `material: 'drywall' \| 'brick' \| 'concrete'` |
| Wi-Fi | `rfChip` | 56 × 56 · 4 | package / + shield can / + inner blocks (mixer, amplifier as `logicBlock`) | off, on | `ant`, `bb` | `blocks` |
| Wi-Fi | `accessPoint` | 200 × 200 · 8 | disc / + LED ring / + mounting | off, on | `antenna` | — |
| AI / GPU | `gpuPackage` | 420 × 320 · 8 | substrate / + main die, 6 `hbmStack`s on an interposer / + die's SM grid (detail lines) | off, on, limit | `hbm[i]`, `die`, `pcie` | `stacks: 4–8` |
| AI / GPU | `hbmStack` | 60 × 90 · 10 | block / + 8 layer lines / + TSV dots | off, on | `bus` | `layers` |
| AI / GPU | `gpuCard` | 640 × 160 · 14 | board + shroud / + fans (static), bracket / + power connector | off, on | `pcie`, `power` | — |
| AI / GPU | `serverTray` | 900 × 120 · 14 | tray / + GPU bays / + fans | off, on | `bay[i]` | `bays` |
| CPU | `cpuDie` | 400 × 300 · 4 | die / + core grid (P and E cores as `core`), cache strip / + ring bus | off, on | `core[i]`, `cache` | `pCores`, `eCores` |
| CPU | `core` | 60 × 60 · 3 | block / + pipeline marks / + register file | off, on, waiting, limit | `in`, `out` | `kind: 'P' \| 'E'` |
| CPU | `cacheBlock` | 120 × 40 · 3 | block / + way lines / + tag array | off, on | `in`, `out` | `level: 1 \| 2 \| 3` |
| Compression | `videoFrame` | 480 × 270 · 2 | frame / + specimen image slot / + macroblock grid overlay (2 px `detail`, 16 or 64 px) | — | `in`, `out` | `specimen` (a real frame inside, true colours) |
| Compression | `codecSlab` | 120 × 300 · 14 | slab / + stage slots / + inner blocks | off, on | `in`, `out` | `stages` |
| Storage | `hdd` | 300 × 220 · 10 | case / + platter (circle), arm, head / + spindle, actuator magnet | off, on | `head`, `sata` | `armAngle` |
| Storage | `ssd25` | 300 × 200 · 8 | case / + label-free top, SATA connector / + x-ray: controller, NAND, DRAM | off, on | `sataData`, `sataPower` | `xray` |
| Storage | `nandPackage` | 80 × 60 · 4 | package / + die outline / + die stack lines | off, on | `bus` | — |
| Storage | `nandCell` | 360 × 240 · 0 (cross-section) | layer stack / + control gate, charge-trap layer, tunnel oxide, channel / + labels' anchor slots per layer | — | `gate`, `trap`, `channel` | `charge: number` (cyan dots drawn by the engine as information grains) |
| Storage | `sataPower` | 200 × 40 · 6 | connector / + 5 true-colour wires (matte, labelled) / + pins | — (true colours) | `pin[i]` | `wires: true` |
| Displays | `displayPanel` | 480 × 300 · 0 (cross-section) | stack / + backlight, polarisers, liquid crystal, colour filter / + per-layer hatch | — | `layer[i]` | `layers` |
| Displays | `subpixelTriad` | 90 × 90 · 2 | three stripes / + true RGB fills (never brand hues) / + black matrix | on (true colour) | `r`, `g`, `b` | `levels: [r, g, b]` |

Rules that carry over to every topic: information stays cyan Bits or grains; energy stays amber channels; true colours (RGB, wire insulation, specimens) are never recoloured and the Lens and brackets turn `ink` over them; no logos, no captured UI; an alternate (vendor, form factor) is a stop that morphs only what differs.

---

## 7. Review sheet and acceptance

- **`IconSheet` composition** (registered by the icon builder in its own entry, e.g. `src/entries/icons6.tsx`, id `IconSheet6`, 1920 × 1080, a few frames): every Ep01 icon at zoom 0.9, 1.3 and 2.2 (so `detail` is 0, partial and 1), in every state it uses, on `board` and on `deck`, with ports drawn as 6 px `info` crosses; one row in `fillsOnly` mode; the glyphs of §5 at their sizes. Render it with `tools/stills.mjs … --phone` and read it at full size and at 390 px.
- **Checks:** every silhouette is recognisable with `detail` 0 at 390 px (the CPU's notches, the PSU's fan and inlet, the rocker's I/O, the button's power symbol, the plug's pins when pulled); the lookout and the "?" differ in shape at every size; no stroke under 2 px on screen; no meaningful line under 5:1 against its ground; states differ by outline, fill and pip (not hue); `npx tsc --noEmit` passes for `src/icons/**` and `src/engine/tokens.ts`.

---

## 8. As built (icon library, 10 October 2026)

**Where:** `src/icons/` per §1 (one file per icon in `pc/`, `variants/`, `scene/`, `glyphs/`; `topics/` holds the empty `BUILT_TOPICS` map). The review sheet is `src/icons/IconSheet.tsx`, registered as **`IconGallery`** in `src/entries/icongallery.tsx` (36 pages of 60 frames; take stills at page × 60 + 30). Plug the library into the engine with `registerIcons(getIcon)` or `<Atlas icons={getIcon} />`. `tokens.ts` is unchanged.

**API notes**
- Rect-valued ports are point pairs: `nameSlot`/`nameSlotEnd`, `pillSlot`/`pillSlotEnd` (psu), `screenRect`/`screenRectEnd` (monitor), `bracketBox`/`bracketBoxEnd` (powerButton: the bezel; `Brackets` adds its own 8 px pad). Slot ports (`iodSlot:lookout`, `iodSlot:q`, `slot:q`, `slot:lookout`, `slot:soc`, `slot:ec`) are CENTRES: `blockRectAt(port, 'wide' | 'square')` returns the block's rect for a scene tween.
- `chipset.blocks[].rel` accepts fractions of the package or world-px offsets from its top-left (as the engine's `blockRect`). Blocks also take `pip`, `glow`, `pointed` and the badge timing props; `blockDetail` overrides their detail (default: from each block's own on-screen size).
- `iecPlug` draws the inlet's three pins under its own body at the seated face, so they are hidden while `seated` is 1 and revealed as it leaves (40 px left, 16 down at 0). Its `cord` and `face` ports move with `seated`: end the `cord` part's `points` at `plug.cord`.
- `psu.rocker`: `'I' | 'O' | {from, to, at}` (3-frame flip). The inlet (20 × 42) and the rocker (26 × 50) protrude LEFT of the box footprint, so the storyboard's seated plug (346–382) meets the inlet face at x 380.
- `logicBlock`: `shape`, `badge: 'q'` with `badgeSize`, `badgeFillAt`, `badgeUnfillAt`, `badgeAccentAt` (the engine may instead draw the badge in its GlyphLayer and pass `badge: null`).
- The §6 placeholders already expose the §6 table's named ports (indexed ones as `name[i]`, e.g. `router.antenna[0]`), so a topic world can be laid out before its art; the real icons must keep those names.
- Glyphs are in `src/icons/glyphs/` with the §5 props; (x, y) is the glyph's centre, except `EyeBadge` (the dock point: the lookout's `top`), `VisitedMark` and `Brackets` (a rect). `CommandChip` uses the measured Sora 600 widths of "Restart" and "Shut down".

**Deviations from §3–§5 (and why)**
1. `chipset` and `ecChip` are passive (no pip, outline never lights): the blocks they hold carry state. `powerButton` is passive (a momentary switch; `press` animates it). `led` defaults to `pip: false` (its lens shows the state).
2. Where a part's shorter side keeps `detail` at 0 at every Ep01 zoom, its identity features are base, not detail: the PSU's fan blades; the atx24 and front-panel-header pin fields; every rearIo port cut-out (incl. the RJ45, the S11 wake source); the front panel's USB ports; the SOIC legs and the inductor ring. Detail keeps the fine marks.
3. `wallSocket` has `plugged` (default true: the PC's 5-15P plug sits in the outlet and the cord leaves at `face`, continuous with the `cord` part); `plugged: false` is the bare receptacle of §4.16.
4. The rim light sits just inside the outline (3 px; 2 px inside 2 px inner edges), not 1 px, or the outline would cover it.
5. Inner raised elements (heat spreader, dies, inlet, rocker, fan hub, cap) get their own small 2.5D lips (the part's `side` × 0.2–0.6): one light direction everywhere. Recesses (vents, ports, slots, the fan) show a dark wall top-left and a floor shifted bottom-right.
6. The "?" badge fills by rising from the bottom (6 frames, `arrive`); the glyph turns `void` where covered, so there is no low-contrast midpoint. Glyph text (QBadge, ScaleChip, CommandChip) imports the kit fonts.
7. `pin9`/`mainEntry` (atx24) and `standbyOut`/`mainOut` (psu) sit at the storyboard's channel x (props `pin9Frac`, `mainFrac`); the pin field is evenly spaced.
8. M.2 keeps the spec's 280 × 34 footprint (a real 2280 is 80 × 22 mm); its parts are laid out to the given rect.
9. Placeholders (the §6 types) are marked with a thin cross, not dashes (dashes mean analogy in this style).

**Changes made by the Ep01 intro build (10 October 2026)**
- `cord` takes `seated` (default 1): its last point moves with `plugOffset(seated)`, so animating it with the same PropEvent as the plug's `seated` keeps the cable attached to the pulled plug (S10 left band). New export `cordPoints`.
- `psu` rocker marks: the pressed half's mark (the switch's state) is drawn in `ink` and the other in `structure` (was `annotation` / `textMuted`, which differed too little to read as the cause in a 560 px band).
- Any non-passive icon already accepts `pip: false`; Ep01 uses it on context parts whose state is never narrated (STYLE_BIBLE §6.5 note).

## Round 1 changes (judges' review, 10 October 2026)

- **"?" badge** (`QBadge2`, engine glyph): 52 px (60 subject, 72 in a Lens). Its fill is a pointer, never light: a 30% emphasis tint plus a dashed 2.5 px emphasis ring opening 6 → 14 px outside the badge (STYLE_BIBLE §6.7, red line 7).
- **Brackets** draw in `ink` (magenta is the "?"'s alone).
- **Wake-source glyphs** (network jack, clock): 80 px (were 56). In Ep01 the clock badge sits outside the chipset with its own route into the lookout.
- **New glyphs:** `OffGlyph2` (IEC 60417-5008 "off", a ring like the rocker's O: the S08 "Shut down" chip, distinct from the button's power symbol); `Journey2` (`loop`: a closed loop with an arrowhead that spins with the chip's `spinAt`; `downUp`: a step down to an "off" ring and back up); the press wave (two `ink` rings off a part's outline, `pressWave` event).
- **Pips:** Ep01 drops the CPU's and the "?" block's pips (`pip: false`): pips that never change read as artefacts; the lookout keeps its breathing pip.
- **`signInCard`** animates in a scene through its `draw` and `content` props (S06 plate 6: it draws on at "takes control").
- **Recomposed scenes reuse the icons at new sizes:** the SPI flash at 466 × 283 local px (140 × 85 px on screen) and the M.2 at 800 × 120 (240 × 36) as the heroes of S06 plates 4–5; the S10 band scene (socket, cord, plug, PSU, lookout) at ×2.1. Icons scale by their rects; nothing was redrawn for it.


## Round 2 changes (judges' review of round 1, 10 October 2026)

| Icon | Change | Why (judges) |
|---|---|---|
| `wallSocket` (§4.16) | A **duplex** NEMA 5-15 outlet, design space 64 × 104 (default size 64 × 104): the upper receptacle holds the PC's plug (its cord leaves at 46/104 of the height, port `face`), the lower one is empty and shows its two slots and the D-shaped ground hole as base identity. Ep01: world rect (240, 790, 64, 104); the triptych scene's socket (0, 286, 64, 104). | "A generic concentric-square port that does not read as a wall outlet." |
| `psu` (§4.14) | The rocker's pressed half sinks to `mix(body, side, 0.85)` and the raised half is lit (`mix(bodyHi, rim, 0.28)`): a dark/light paddle that reads at band size; the pressed half's mark stays `ink`. | "On and off differ only by a slightly brighter O." |
| `monitor` (§4.18) | `lit?: number` (0..1: screen fill `screenBlack` → `activeFill`) and `content?: 'desktop' \| 'signin'` (a stylised generic screen in `ink` lines: two window outlines and a taskbar, or an avatar, one field and one button; the centre band is kept clear), `contentIn?: number` (the content's own entrance). Preview plates only; the world's monitor stays black in Ep01. | The Windows plate read as a missing graphic; S08 needed a running PC. |
| `chipset` (§4.4) | `variant?: 'pch' \| 'amd'`: 'amd' is the AMD board's own chipset, closed under a finned lid (seven ridges), no x-ray window, no blocks. | "Never reuse the Intel chipset drawing in an AMD lane" (guardrails §4). |
| Glyphs (§5) | Wake sources as **badges** (`WakeBadge2`: a rounded-square chip on `deck`, 3 px outline, glyph inside, 96 px); the ≈ chip 44 × 36 and only on the eye; S08's `LoopArrow2`, `PowerRing2` and `ProblemBadge2` (a 64 px `alert` badge with "!"). | The clock read as a wall clock on the board (red line 9); ≈ cryptic; S08 glyphs were tiny and abstract. |
| Topics (§6) | **Seeded**: `router` (320 × 90: shell, three rear antennas, light strip; ports `ant0`–`ant2`, `rf`, `front`), `antenna` (16 × 120; `tip`, `base`), `phone` (110 × 220, `lit` 0..1; `screenCenter`, `antenna`), `rfChip` (56 × 56 QFN; `feed`), `gpuPackage` (420 × 320: substrate, interposer, die, four memory stacks; `die`, `hbm0`–`hbm3`, `phy0`–`phy3`), `hbmStack` (60 × 90; `phy`). Same construction as the PC parts; off / on shown on the gallery's "seeded topics" page. | "src/icons/topics is empty, so every non-PC topic needs new icons." |


## Round 3 changes (judges' review of round 2, 10 October 2026)

| Icon | Change | Why (judges) |
|---|---|---|
| `logicBlock` wide, the lookout (§4.5) | Drawn as a small **controller** in its BASE: three rows of standard-cell bars and a register macro in a `cell` tone (`mix(activeFill, ink, 0.34)` when powered; they fade in from 50 to 90 px of block width, so at system view they never become noise), a row of small I/O pins, and its **input pads**: in1 on the bottom edge at 22% (the standby feed: an `energyStandby` pad while powered), in2 at 78% (the button's line: a dark pad with a ringed outline) and two wake-input pads on the left edge (at 18 and 29 of 36). The standby line and the button trace end visibly on their pads (Lens #2 shows them at ×4). The old interior detail group is no longer drawn. | "The lookout, the main actor, is a generic pill with a corner square"; "Lens #2 magnifies a blank rectangle". |
| `logicBlock` square, the "?" (§4.5) | While powered (the flash-forward, chain plate 3) its cache rows light one after another (2 frames each) and its core blinks (4 frames): a dim, frame-locked sequence drawn only at Lens size, so "already at work" moves. | Lens #1 held still under speech. |
| `chipset` (§4.4) | `ChipsetBlock.ghost?: 0..1`: a peeled socket while the block's plate is out (the block at 22%, a dashed annotation outline). | Two lookouts on screen as the chain peeled. |
| `psu` (§4.14) | `length?: 'full' \| 'short'`: 'short' scales its features uniformly from the height (inlet, rocker, fan, cable exit at true proportions) and cuts the plain body short (no vents; the cable exit at u 118–158; screws at the cut end). A schematic shortening, used where the whole supply must fit a 560 px band. | Every triptych band cut the supply through its fan. |
| `iecPlug`, `cord` (§4.15) | `pull?: Pt`: where a fully pulled plug ends up (default [-40, 16]); the cord's end follows the same offset. The S10 band drops the plug down and away from the socket ([-18, 34]). | The compact band scene. |
| Glyphs (§5) | **Eye v3**: the ≈ is two unboxed waves at its upper left (no chip box); `close` 0..1 brings the upper lid down onto the lower one, the pupil shrinks away, three lashes appear (a closed eye); `look` moves the pupil toward a direction (up to 0.2 × the width). **`MarkBadge2`**: an order mark ("First"), a capsule on `deck` with a 3 px ink outline, Sora 700 34 px. **`ProblemBadge2`**: `hedge` (dashed, faint: may be gone) and `doubt` (a grey "?" docked on its corner: may stay). **`QBadge2.level`** (0.58 in soft-off, unless powered, pointed at, accented or in a Lens). | The ≈ chip read as a second unknown icon; the triptych's outcome; probe 1 at f59–f120; S08's hedge; red line 7. |
| Any part | `WorldLayer`/`PartView` `ghosts`: a part whose plate carries it (the hero) is drawn at 22% with a dashed outline in the world until it lands back. | Two monitors on screen during S06. |


## Round 4 changes (judges' review of round 3, 10 October 2026)

STYLE_BIBLE §23 gives the reasons; ENGINE §24 lists the engine side (plates, the triptych carry, the field).

| Icon | Change | Why (judges) |
|---|---|---|
| `logicBlock` wide, the lookout (§4.5) | Drawn as a **chip** in its base (`WideBase`): six lead pins on its top edge and three between its bottom pads, a pin-1 dot (pins and dot from 36 px of block width on screen), two rows of square logic cells (fading in from 50 to 90 px); the input pads stay (in1 amber while powered, in2 ringed, two wake pads on the left edge). No bars and no register macro; the wide block has no detail group. | The lit block with bars and a corner macro read as an ID or sign-in card, close to the S07 card. |
| `psu` (§4.14) | `length?: 'full' \| 'short' \| number`: a number 0…1 morphs between the full box and 'short' (`psuShorten(length)`): uniform scale from the height, the grommet and the screws interpolated, the vents fading over the first half. | The triptych's carry: the world's supply shortens into the band's in one motion. |
| `monitor` (§4.18) | `sweep?: number` (0…1): a power-on sweep: the lit screen is revealed from the top down behind a bright scan line instead of fading in (undefined or 1 = no sweep). | S08's pair was still through "starting again". |
| Glyphs (§5) | `MarkBadge2` ("First"): 44 px text (`GLYPH2.mark`), `sub` (a mono `TYPE.secondary` subline right-aligned under the capsule on a deck plate: "always-on logic"), `leaderTo` (a 3 px annotation leader with the tags' 8 px anchor square). | 7 px on a phone; on a block not yet named; beside the "?"'s Lens. |
| Glyphs (§5) | `ProblemBadge2`: 84 px (`GLYPH2.problemSize`); the **hedge mark** is a dotted ring round it (`GLYPH2.hedge`: 7 px dots 16 px apart, 14 px outside the mark): `hedge` ("can fix") fades the "!" to a dashed outline inside the ring; `doubt` ("might not") keeps a solid "!" and `echo` sends two dotted rings out (44 px per 14-frame beat). The grey "?" is gone. | The "?" means the hidden processor; both hedges were 3–6 px on a phone. |
| Glyphs (§5) | New `StageMark2`: `'code'` (three short ink lines on a deck chip: the firmware, on the flash) and `'file'` (a document with a folded corner: the boot loader, on the SSD); `w` is its width in screen px. | Chain plates 4 and 5 read alike at 390 px. |
| Glyphs (§5) | Wake badges settle to `GLYPH2.wakeDim` (0.56) after they land; the scope line's brackets are four separate L-brackets (76 px arms). | The wake sources were as bright as the button; the scope line drew as a partial rectangle. |
