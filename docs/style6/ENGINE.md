# Signal Atlas engine: TypeScript signatures for `src/engine/`

**For:** the engine builder (writes `src/engine/**`) and the intro builder (writes `src/styles/style6/**` as data on top of it). **Rules:** `STYLE_BIBLE.md`. **Numbers:** `src/engine/tokens.ts` (already written; import it, never copy numbers). **Icons:** `src/icons/` per `ICONS.md` (the engine renders parts only through `getIcon(type)`).

Principles of the code:
- **Absolute frames everywhere.** `<Atlas>` reads `useCurrentFrame()` once and passes `frame` down. No `<Sequence>` offsets, no relative timing, no "previous scene ends + N".
- **Pure functions of `frame`.** Every state, camera, label and field value is computed from the script and the frame. No `Math.random`, no `Date`, no React state.
- **One world, many views.** The main view, plates, bands and Lenses all render the same `WorldSpec` (or a mini scene built from the same icons) through their own camera and state scope.
- **Episodes are data.** `src/styles/style6/ep01/{world,shots,script}.ts` + a 20-line `Intro.tsx`.
- **Checks print, never crash.** Dev checks call the kit's `kitWarn` (once per message) so `tools/stills.mjs` shows them as `browser warning: [kit] …`.
- **Ep01 scope first (critic change C10).** Build what the Ep01 storyboard uses, in the milestone order of §19. Marked *later* in this file: Lens x-ray, dive and surface; `StateBadge` states; chapter steps. Their types stay so long-form can add them without breaking the API.
- **Reuse the kit where it already works:** `bitRun` (wrap it as `atlasRun`), `routePath`, `flattenPath`/`makeTrack`, `breathe`, `ripple`, `minTagExit`, the timing module and `kitWarn`. Do not re-derive what `src/shared/` already computes.

---

## 0. Layout of `src/engine/`

```
src/engine/
  tokens.ts                 (exists)
  index.ts                  barrel
  core/
    types.ts                Pt, WRect, SRect, Vec, ViewScope, GroundName, AnchorRef
    ease.ts                 EASE6 functions built from tokens.EASE_BEZIER; prog(), between()
    math.ts                 lerp, clamp01, logLerp, rectCenter, unionRect, polygonContains
  timeline/
    words.ts                w(), wEnd(), pauseAfter(), sentence(), hold()
    track.ts                generic step/eased tracks: valueAt(), stepAt()
    script.ts               the Script type and its DSL builders (§11)
  camera/
    camera.ts               Shot, CameraKey, CameraTrack, cameraAt(), project(), projectLayer(), sideOffset()
    checks.ts               zoom-rate, pan-speed, caption-band checks
  world/
    types.ts                PartSpec, RouteSpec, ChannelSpec, DomainSpec, RegionSpec, WorldSpec, SceneSpec
    states.ts               StateEvent, PropEvent, stateAt(), propAt()
    WorldLayer.tsx          draws parts through the icon registry (z-order, detail opacity, side offsets, vias, fillsOnly)
  field/
    LivingField.tsx         L0–L2 layers and reactions (screen space)
    Vias.tsx                L3 board vias: the same reactions on the board, world space (critic change C5)
    deepCircuit.ts          seeded lattice generator (memoised)
    focus.ts                derived focus track (§6.1)
  view/
    View.tsx                renders a world (or scene) through a camera into a screen rect, with clipping
  signal/
    routes.ts               route geometry (kit routePath), RouteLayer (idle, lit-behind-Bit, pointed, end ticks)
    BitV2.tsx               the Bit with the pixel trail
    runs.ts                 atlasRun() (kit bitRun in world px) and screen-speed checks
  energy/
    ChannelV2.tsx           fill-front, shimmer v2, drain, pointed walls
    WashV2.tsx              powered-domain wash
  panels/
    Plate.tsx               plate frame grammar + content view
    peel.ts                 peel / return geometry
    row.ts                  plate rows: rail, bridges, ports (§10.6)
    tween.ts                tweenScene(): generic stop morphs (§10.5)
    Split.tsx               triptych and pairs
    TimeWindow.tsx          the "later" window (clip + double rule)
    Scrim.tsx
  lens/
    Lens2.tsx               open / settle (D24) / close / magnify (x-ray, dive, surface: later)
  labels/
    Tag2.tsx  Chip2.tsx  Pill2.tsx  Readout2.tsx  Caption2.tsx  LabelLayer.tsx
    Knockout.tsx            the world's flat fills clipped to a text box (bible §10.3)
    budget.ts               on-screen budget and hold-rule checks
  glyphs/
    GlyphLayer.tsx          places ICONS.md §5 glyphs at projected anchors
  cues/
    cues.ts                 deriveCues(), checkCues(), CuesDump
  checks/
    devChecks.ts            anchors, sync, proof of power, safe areas, budgets, speeds
  Atlas.tsx                 the composition shell
```

---

## 1. Core types (`core/types.ts`)

```ts
export type Pt = readonly [number, number];                 // world px unless named otherwise
export type Vec = readonly [number, number];
export interface WRect { x: number; y: number; w: number; h: number; r?: number }   // world px
export interface SRect { x: number; y: number; w: number; h: number; r?: number }   // screen px
export type GroundName = 'void' | 'field' | 'deck' | 'board' | 'bodyLo' | 'body' | 'bodyHi';

/** "partId.port" (a port from the icon's ports()) or a literal world point. */
export type AnchorRef = `${string}.${string}` | Pt;

/** Which copy of the world a state, tag or Bit belongs to. */
export type ViewScope =
  | 'world'                         // the main view (present, or the flash-forward inside the window)
  | {plate: string}                 // a plate's own preview / variant states
  | {band: 'left' | 'right'}        // a triptych what-if band
  | {lens: string}                  // a Lens (shares 'world' states unless overridden)
  | {row: string};                  // a plate row's rail (screen space): the S06 chain Bit (§10.6)
```

## 2. Easing (`core/ease.ts`)

```ts
import {EASE_BEZIER, type EaseName} from '../tokens';
export type EaseFn = (t: number) => number;
/** Functions for every token curve (Remotion Easing.bezier). */
export const EASE6: Record<EaseName, EaseFn>;
/** 0 → 1 over [at, at + dur] with an ease; dur <= 0 is a step. */
export const prog: (frame: number, at: number, dur: number, ease?: EaseName) => number;
/** 1 while at <= frame < to (optionally eased in/out over `fade` frames). */
export const between: (frame: number, at: number, to: number, fade?: number) => number;
export const logLerp: (a: number, b: number, t: number) => number;   // for zoom
```

---

## 3. Timeline from word IDs (`timeline/words.ts`, `timeline/track.ts`)

Frames always come from `public/data/ep01_words.json` through the kit (`src/shared/timing.ts`): frame = round(ms × 30 / 1000).

```ts
export type WordId = `W${number}` | `W${string}`;   // 'W0047'
export type SentenceId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05' | 'S06' | 'S07' | 'S08' | 'S09' | 'S10' | 'S11' | 'S12';

/** Start frame of a word, plus an offset. w('W0047') === 472. */
export const w: (id: WordId, offset?: number) => number;
/** End frame of a word (the kit's wordEnd), plus an offset. */
export const wEnd: (id: WordId, offset?: number) => number;
/** The silent span after a word: {from: first silent frame, to: next word's start}. Throws if < 250 ms. */
export const pauseAfter: (id: WordId) => {from: number; to: number};
/** Sentence span {start, end} from the kit's SENTENCES. */
export const sentence: (id: SentenceId) => {start: number; end: number};
/** The brand hold rule: max(land + 30 + 9 × words, sentenceEnd + 15). Same as the kit's minTagExit. */
export const hold: (land: number, text: string, sid?: SentenceId) => number;
/** The word playing at a frame (null in a pause). */
export const wordAt: (frame: number) => {id: WordId; text: string} | null;

/** Generic tracks. */
export interface Step<T> { at: number; value: T }
export const stepAt: <T>(frame: number, steps: ReadonlyArray<Step<T>>, initial: T) => {value: T; since: number; prev: T};
export interface Key<T> { at: number; dur: number; to: T; ease: EaseName }
export const keyedAt: (frame: number, start: number, keys: ReadonlyArray<Key<number>>) => number;
```

Event authoring in `script.ts` uses these, e.g. `land: w('W0050')`, `exitAt: 'hold'` (resolved with `hold()`), `at: pauseAfter('W0030').from`.

---

## 4. World model (`world/types.ts`, `world/states.ts`)

```ts
import type {IconType} from '../../icons/types';
import type {PartState} from '../tokens';

export interface PartSpec {
  id: string;                         // 'cpu', 'chipset', 'psu', 'plug'…
  type: IconType;
  rect: WRect;                        // top face, world px
  z?: number;                         // height class override (default: the icon's z)
  depth?: number;                     // parallax factor (default 1; room objects 0.9)
  order?: number;                     // draw order (default: by z, then array order)
  props?: Record<string, unknown>;    // icon-specific props (blocks, rocker, holes…)
  initial?: PartState;                // default 'off' (passive icons ignore it)
  ground?: GroundName;                // ground for knockout sampling over this part (default from material)
}
export interface RouteSpec {
  id: string;                         // 'pwrbtn'
  points: Pt[];                       // orthogonal / 45°, world px
  bend?: number;                      // default 8
  /** Segments that are cable (the lead) vs board trace: [startLen, endLen] in px along the path. */
  cable?: [number, number];
  endTickAt?: number;                 // path length where the wire truly ends (S03 tick)
  /** Not drawn until a 'draw' RouteEvent (S11 wake routes). */
  hidden?: boolean;
}
export interface ChannelSpec { id: string; points: Pt[]; kind: 'main' | 'standby'; initial: 'empty' | 'full' }
export interface DomainSpec { id: string; polygon: Pt[] }          // powered-domain wash shape
export interface RegionSpec { ground: GroundName; rect?: WRect; polygon?: Pt[] }

export interface WorldSpec {
  id: string;                         // 'ep01-intel-atx'
  seed: string;                       // deep-circuit seed
  bounds: WRect;                      // everything the camera may show
  parts: PartSpec[];
  routes: RouteSpec[];
  channels: ChannelSpec[];
  domains: DomainSpec[];
  /** Optional: grounds are derived from the parts (case → deck, board → board, parts → their material). */
  regions?: RegionSpec[];
  /** Proof of power (bible §7.7): while `subject` is visible and awake in scope 'world', `proof` must be visible above y 932. */
  proofOfPower?: {subject: AnchorRef; proof: AnchorRef};
}

/** A mini world for a recomposed plate (S06 stages, S09 stops). Same icons, local world px. */
export interface SceneSpec { id: string; bounds: WRect; parts: PartSpec[]; routes?: RouteSpec[]; channels?: ChannelSpec[] }

/** State changes (5-frame flips). `block` addresses a child block (chipset/amdPackage/ecChip). */
export interface StateEvent { part: string; block?: string; at: number; to: PartState; scope?: ViewScope }
/** Physical props over time: button press, plug seated, rocker, pointed outlines, opacity. (Stops use tweenScene, §10.5.) */
export interface PropEvent {
  part: string; prop: 'press' | 'seated' | 'rocker' | 'pointed' | 'opacity' | string;
  at: number; dur: number; from: number | string; to: number | string; ease?: EaseName; scope?: ViewScope;
}

export const stateAt: (frame: number, events: StateEvent[], part: string, block: string | undefined, scope: ViewScope, initial: PartState)
  => {state: PartState; flip?: {from: PartState; at: number}};
export const propAt: (frame: number, events: PropEvent[], part: string, prop: string, scope: ViewScope, initial: number | string) => number | string;
/** Resolve "partId.port" to a world point (through the icon registry's ports()). */
export const resolveAnchor: (world: WorldSpec | SceneSpec, a: AnchorRef) => Pt;
```

### 4.1 `WorldLayer` (`world/WorldLayer.tsx`)
```ts
export interface WorldLayerProps {
  world: WorldSpec | SceneSpec;
  frame: number;
  cam: Cam;                           // the view's camera (§5)
  scope: ViewScope;
  script: Pick<Script, 'states' | 'props'>;
  /** Parts to hide in this view (e.g. a part covered by its own peeled plate is NOT hidden: the world keeps its truth). */
  hide?: string[];
  /** Glow holder at this frame and its alpha (one part[.block] or null); computed by script.glowAt(). */
  glow?: {holder: string; alpha: number} | null;
  detailBias?: number;                // multiply on-screen size before computing `detail` (plates and Lens: DETAIL.plateBias)
  /** Knockout render: grounds and top-face fills only (no strokes, details, pips, routes, channels, vias, glyphs). */
  fillsOnly?: boolean;
  /** Board vias (field L3) for this view: the field's focus point and events, in this view's screen space. */
  vias?: {focus: Pt; events: FieldEvent[]} | null;
}
export const WorldLayer: React.FC<WorldLayerProps>;
```
Draw order: case → board → **vias** (on the board, under everything else; §6.2) → domains (wash, under the parts it covers) → parts sorted by `order`/z (each through `getIcon(type).component` with `zoom = cam.zoom × depthScale`, `side = sideOffset(...)`, `detail = detailOf(shorterSide × zoom, detailBias)`) → channels → routes → pips/badges (inside icons) → world glyphs. `detail` is a pure function of the current camera: no previous-frame state.

### 4.2 Knockout (`labels/Knockout.tsx`, replaces ground sampling)
```ts
/** The world's flat fills (field, case tray, board, part top faces and sides) at the view's camera, clipped to a rounded
 *  text box (r 8, LABEL2.platePad). Drawn under every tag, pill, chip and readout text. Exact, so never a card, and correct
 *  when a box straddles two grounds (the left rail at openLean spans field and case tray). */
export const Knockout: React.FC<{world: WorldSpec | SceneSpec; cam: Cam | ViewCam; frame: number; box: SRect; scrim?: number}>;
```
It renders `WorldLayer` with `fillsOnly` inside a clip (`scrim` re-applies the S06 scrim alpha when a label sits over a scrimmed world). The placement rules (16 px from routes and channels) mean the knockout only ever removes stray linework, never meaning.

---

## 5. Camera, parallax and 2.5D (`camera/camera.ts`)

```ts
export interface Shot { center: Pt; zoom: number }       // world point at the frame centre (960, 540); world → screen scale
export type ShotName = string;
export interface CameraKey {
  at: number;                       // absolute start frame
  dur: number;                      // frames (>= tokens DUR.cameraMin); 0 only for a cut in a pause
  to: ShotName | Shot;
  ease: EaseName;                   // 'carry' | 'glide' | 'move'
  /** World point that travels on a straight eased screen path while zoom interpolates in log space (default: to.center). */
  anchor?: Pt;
  /** Links the key to a Bit run for bitScreenSpeedReport. The DSL's default timing for a carry is at = run.depart −
   *  DUR.carryLead, dur = run frames + DUR.carryLead + DUR.carrySettle, but explicit `at`/`dur` in the script always
   *  win (Ep01 K10 is f1840 + 88, running past the last frame). */
  carry?: string;                   // BitSpec id
  note?: string;
}
export interface CameraTrack { start: ShotName | Shot; keys: CameraKey[]; shots: Record<ShotName, Shot>; reference: ShotName }
export interface Cam { center: Pt; zoom: number; moving: boolean; keyIndex: number; t: number }

/** Interpolation: s(t) = exp(lerp(ln zA, ln zB, e)); the anchor's screen point moves linearly in e; center = anchor − (P − S0)/s. */
export const cameraAt: (frame: number, track: CameraTrack) => Cam;

export const S0: Pt;                                       // [960, 540]
export const project: (cam: Cam, p: Pt) => Pt;             // deck (factor 1): S0 + zoom × (p − center)
export const unproject: (cam: Cam, s: Pt) => Pt;
/** Parallax layer or room object with factor f, matched to the deck at the reference shot. */
export const projectLayer: (cam: Cam, p: Pt, f: number, ref: Shot) => Pt;
export const layerZoom: (cam: Cam, f: number, ref: Shot) => number;  // ref.zoom × (cam.zoom / ref.zoom)^f
/** 2.5D side offset (WORLD px) of a raised part: z × [(EXTRUDE.obliqueX, obliqueY) + EXTRUDE.perspective × (centreScreen − S0) / 1000]. */
export const sideOffset: (cam: Cam, topRect: WRect, z: number) => Vec;
/** Screen-space bounds of a world rect / a part (for checks, labels, peels). */
export const screenRect: (cam: Cam, r: WRect, depth?: number) => SRect;

/** A camera for a sub-view: maps a world rect (or a shot) into a screen rect (plates, bands, Lens). */
export interface ViewCam extends Cam { viewport: SRect }
export const viewCam: (shot: Shot, viewport: SRect) => ViewCam;   // the shot's centre lands at the viewport centre
```

### 5.1 Camera checks (`camera/checks.ts`)
```ts
/** Peak zoom ratio per 12 frames for each key (sampled at 1/8 frame); warns above CAMERA.maxZoomPer12 (1.8). */
export const zoomRateReport: (track: CameraTrack) => Array<{key: number; peakPer12: number}>;
/** Peak pan speed of the frame centre's world point, screen px/frame; warns above CAMERA.maxPanPerFrame (48). */
export const panSpeedReport: (track: CameraTrack) => Array<{key: number; peakPx: number}>;
/** At hold frames (no key active), warns if any part TOP FACE (2.5D sides excluded), route, channel, Bit, label or plate
 *  projects below LAYOUT.meaningBottom (932). Grounds (field, case tray, board) and dark side faces may cross it. */
export const captionBandReport: (track: CameraTrack, world: WorldSpec, frames: number[]) => string[];
```
The critic computed every Ep01 shot and key with these formulas (scratch script, not shipped): all ten shots pass the caption-band rule after the `monitor` and `column` changes, and every key stays under the caps (STORYBOARD §2 lists the computed peaks). Room objects project with `projectLayer(…, 0.9, atlas)`.

---

## 6. The living field (`field/LivingField.tsx`, `field/deepCircuit.ts`)

```ts
export type FieldEvent =
  | {kind: 'press'; at: number; world: Pt}                    // ring from the button (FIELD.grid.pressRing)
  | {kind: 'land'; at: number; world: Pt}                     // pixel ripple (FIELD.grid.landRipple)
  | {kind: 'timeBreath'; at: number}                          // return to now
  | {kind: 'window'; at: number; state: 'contract' | 'expand'};

/** Optional overrides only: the focus track is DERIVED (§6.1). */
export interface FocusKey { at: number; target: AnchorRef | {bit: string} | {lens: string} | {screen: Pt} }

export interface LivingFieldProps {
  frame: number;
  cam: Cam;
  ref: Shot;                         // the reference shot for parallax
  focus: Pt;                         // SCREEN point from focusAt() (eased over 18 frames, 'arrive')
  events: FieldEvent[];              // press and land events are derived from the script automatically
  window?: {rect: SRect; t: number}; // the later window, t = 0..1 contracted (dims grid outside to 40%)
  seed: string;
  off?: boolean;                     // debug: render flat `field` only (for foreground still-run measurement)
}
export const LivingField: React.FC<LivingFieldProps>;

/** The far layer: an orthogonal lattice (FIELD.deep.pitch) with FIELD.deep.density of its edges drawn, 8 px bends.
 *  Generated once per seed over a 4x frame area, memoised. Drift in WHOLE pixels: offset = floor(frame / stepFrames). */
export const deepCircuitPaths: (seed: string, area: SRect) => string[];
/** Grid dot opacity at a screen point (base + light pool + active reactions). Exposed for tests; Vias reuses it with
 *  FIELD.vias gains. */
export const gridOpacity: (frame: number, p: Pt, focus: Pt, events: FieldEvent[], cam: Cam, gains?: typeof FIELD.vias) => number;
```
Rendering: L0 a flat rect; L1 one SVG `<path>` per 64 cells, stroke `deepTrace` 2 px, translated by the layer projection; L2 4 px dots as one SVG path per opacity bucket (quantise opacity to 0.02 steps so the dot field is ~25 paths, not 900 nodes). Drift is applied in **whole-pixel steps** (L2 1 px every 6 frames, L1 every 10): crisp squares, no anti-aliasing shimmer, and cheap for YouTube's encoder; during camera moves the parallax offsets are fractional as usual. No gradients, filters or blur.

### 6.1 Derived focus (`field/focus.ts`)
```ts
/** The focus point at a frame, in main-view screen px, before easing: the travelling Bit's head; else the Lens centre while
 *  a Lens is open; else the anchor of the newest tag, pill, caption or plate name for 45 frames after it lands; else the
 *  active plate's centre; else the frame centre. Script FocusKeys override for their span. Eased over DUR.poolFollow. */
export const focusAt: (frame: number, script: Script, world: WorldSpec) => Pt;
```
No authored focus track is needed for Ep01; the storyboard's "Field" lines describe what this rule produces.

### 6.2 Board vias (`field/Vias.tsx`, critic change C5)
At most framings the case tray and the board cover the frame's middle, so L2's pool and ripples would show only in the margins (a land ripple on the lookout never reaches past the case). The vias carry the same reactions where the viewer looks: 4 px squares on a 48-world-px lattice clipped to the board's top face, drawn under the parts, opacity `gridOpacity(…, FIELD.vias)` (base 0, pool 0.30, land +0.30, press +0.35). They never drift (parallax 1, part of the deck). One path per opacity bucket, like L2. Plates and bands do not draw vias.

---

## 7. Views (`view/View.tsx`)

```ts
export interface ViewProps {
  frame: number;
  cam: Cam | ViewCam;                // ViewCam for plates, bands, Lens
  clip?: SRect | {circle: Pt; r: number} | null;
  world: WorldSpec | SceneSpec;
  scope: ViewScope;
  script: Script;
  /** Draw signals and energy in this view (plates and bands: yes; Lens: yes). */
  layers?: {routes?: boolean; channels?: boolean; washes?: boolean; bits?: boolean; glyphs?: boolean};
  detailBias?: number;
  opacity?: number;
}
export const View: React.FC<ViewProps>;
```
A view is one `<svg>` sized to the frame, a clip, and a `<g transform="translate(...) scale(zoom)">` containing `WorldLayer`, `WashV2`, `ChannelV2`, `RouteLayer`, then a screen-space `<g>` for the Bit and world glyphs at projected points. Strokes are divided by the zoom inside the icons and layers (`sw(px, zoom)`).

---

## 8. Signals (`signal/routes.ts`, `signal/runs.ts`, `signal/BitV2.tsx`)

```ts
import type {BitRun} from '../../shared/motion';     // the kit's run type (depart, land, frames, speed, track, at(f))

/** The kit's bitRun profile on a world route (WORLD px): 4-frame ease-in, linear cruise, cubic ease-out over `decel` frames
 *  (default 5, the kit's BIT.decel; the S12 tail uses 2 so the carried Bit is still cruising at f1889). Same distance formula as
 *  the kit (L = v × (T − accel/2 − 2·decel/3)). Warns (kitWarn) on runs > 30 frames unless allowLong, hops < 10, speed > 36. */
export const atlasRun: (route: RouteSpec | Pt[], depart: number, land?: number, opts?: {reverse?: boolean; allowLong?: boolean; label?: string; decel?: number}) => BitRun;

export interface BitSpec {
  id: string;                          // 'ff', 's04', 'chain', 'real'
  scope: ViewScope;                    // 'world', or {row: 'chain'} for a plate row (hops then name rail stops: §10.6)
  hops: Array<{route: string | Pt[] | {row: string; from: number; to: number}; depart: number; land: number; allowLong?: boolean; decel?: number}>;
  park?: boolean;                      // DRIVING after the last landing (default false: absorbed)
  restFrom?: number;                   // visible and breathing on the first start point from this frame
  kind: 'real' | 'preview' | 'demo';   // sound gain and receiver reactions (demo/preview: ripple only unless an event says otherwise)
  fadeAt?: number;                     // fade the parked Bit (S06 return)
}

/** Where the Bit is and what it looks like at a frame, in SCREEN px for a view. */
export interface BitDraw {
  status: 'hidden' | 'resting' | 'moving' | 'waiting' | 'parked' | 'absorbed';
  head: {x: number; y: number; scale: number; opacity: number} | null;
  /** Pixel trail (BIT2.trail): 3 squares, nearest first, snapped to a 4 px grid. */
  trail: Array<{x: number; y: number; size: number; opacity: number}>;
  ripples: Array<{x: number; y: number; size: number; stroke: number; opacity: number}>;
  /** Route-light: the lit length window [s0, s1] along the current route (world px), for RouteLayer. */
  lit: {route: string; s0: number; s1: number; age: number} | null;
}
export const bitDraw: (frame: number, spec: BitSpec, runs: BitRun[], cam: Cam | ViewCam) => BitDraw;
export const BitV2: React.FC<{draw: BitDraw; color?: string}>;   // halo squares, head, trail, ripples (screen px)

/** Screen-speed check: the head's speed relative to the frame (camera motion included) <= BIT2.maxScreen. */
export const bitScreenSpeedReport: (spec: BitSpec, runs: BitRun[], track: CameraTrack) => Array<{hop: number; peak: number}>;

/** point: tone step to textMuted; ink: ink draw-on; hold: steady info; draw: a hidden route draws on (DUR.routeDraw) in
 *  textMuted; settle: back to idle structure grey. `range` limits ink/point to [s0, s1] px along the path (S03: the cable,
 *  RouteSpec.cable). `to` = the frame the effect ends (fades back over 6 frames). End ticks are GlyphEvents. */
export interface RouteEvent { route: string; kind: 'point' | 'ink' | 'hold' | 'draw' | 'settle'; at: number; to?: number; range?: [number, number] | 'cable'; scope?: ViewScope }
export interface RouteLayerProps { world: WorldSpec | SceneSpec; frame: number; cam: Cam | ViewCam; bits: BitDraw[]; events: RouteEvent[]; scope: ViewScope }
export const RouteLayer: React.FC<RouteLayerProps>;
```
Trail rule: square k sits `BIT2.trail.offsets[k]` px behind the head along the route (screen px), `Math.round(x / 4) * 4` snapped; over the first 4 frames of each hop the squares slide out from the head; after a landing they collapse into the head over 6 frames. Halo: two flat squares (40 px @ 18%, 64 px @ 9% of `info` over the ground). Gutter crossings in plate rows use the row's rail (§10.6): a hop `{row: 'chain', from: 0, to: 1}` runs from rail stop 0 to rail stop 1 in screen px, over the bridge, with the ports opened automatically.

---

## 9. Energy (`energy/ChannelV2.tsx`, `energy/WashV2.tsx`)

```ts
export type ChannelEvent =
  | {channel: string; kind: 'fill'; at: number; speed?: number; scope?: ViewScope}     // fill-front from the source end
  | {channel: string; kind: 'drain'; at: number; mode?: 'retreat' | 'fade'; scope?: ViewScope}
  | {channel: string; kind: 'shimmer'; at: number; to: number; scope?: ViewScope}      // only while the voice talks about flow
  | {channel: string; kind: 'point'; at: number; to: number; scope?: ViewScope};       // walls step to textMuted

export interface ChannelState { front: number /* 0..1 filled fraction */; draining: boolean; shimmer: number /* 0..1 fade */; pointed: number }
export const channelAt: (frame: number, ch: ChannelSpec, events: ChannelEvent[], scope: ViewScope) => ChannelState;
export const ChannelV2: React.FC<{spec: ChannelSpec; state: ChannelState; frame: number; zoom: number}>;
```
Drawing: two walls (2 px `structure`, or `textMuted` when pointed) and the fill (`energy` / `energyStandby`); the fill-front's leading 24 px is three 8 px steps at 66/33/10% (no gradient); shimmer = `strokeDasharray 48 48` of `standbyShimmer` (main: `energyShimmer`) along the centreline, `strokeDashoffset = −speed × (frame − at)`; widths are screen-constant (÷ zoom).

```ts
export interface WashEvent { domain: string; at: number; outAt?: number; scope?: ViewScope }
export const WashV2: React.FC<{domain: DomainSpec; event: WashEvent; frame: number; zoom: number; ground: string}>;
/** Shared-rules boundary test: on dark grounds the wash needs >= 1.3:1 and to be lighter, else a 3 px annotation boundary is drawn. */
export const washNeedsBoundary: (wash: string, ground: string) => boolean;
```

---

## 10. Panels, splits and time (`panels/*`)

### 10.1 Plates
```ts
/** The frame kind. "Active" is not a rule: it is a status layered on either kind (outer rule → PLATE.rim px `ink`). */
export type PlateRule = 'held' | 'notNow';
export type PlateContent =
  | {kind: 'world'; shot: Shot; scope?: ViewScope}         // the same world through another camera (S06 plates 1 and 3)
  | {kind: 'scene'; scene: SceneSpec; shot: Shot}          // a recomposed mini scene (S06 plates 2, 4–6)
  | {kind: 'tween'; from: SceneSpec; to: SceneSpec; shot: Shot | [Shot, Shot]; at: number; dur: number};  // S09 stops (§10.5)

export interface PlateSpec {
  id: string;
  /** Final screen rect (or a layout slot: tokens SPLIT.row6 index 0–5, SPLIT.pairRight index 0–1). */
  slot: SRect | {layout: 'row6' | 'pairRight'; index: number};
  /** Where it peels from: a part (its screen rect at the peel frame) or a world rect. */
  source: string | WRect;
  content: PlateContent;
  rule: PlateRule;                                         // 'notNow' for previews and what-ifs
  peelAt: number;                                          // lift starts (DUR.peel = 14)
  returnAt: number;                                        // fly back starts (DUR.plateReturn = 12)
  /** 'top' = inside the top-left at 24 px inset (S09 stops); 'name' = centred in the plate's name area (row6: two 44 px
   *  lines from SPLIT.row6.nameTop). Captions sit on the plate's flat deck ground: no knockout needed. */
  caption?: {text: string; at: number; place: 'top' | 'name'; exitAt: number | 'hold'};
  /** Active status steps: exactly one plate in a group is active at a time; `on: false` everywhere releases attention. */
  active?: Array<{at: number; on: boolean}>;
  /** Port gaps opened around gutter crossings (computed from the row's hops by buildScript). */
  ports?: Array<{side: 'left' | 'right'; y: number; open: number; close: number}>;
}

/** Geometry at a frame: lerp from source rect to slot along a gentle arc (control point 12% of the distance above the chord). */
export interface PeelState { phase: 'hidden' | 'lifting' | 'flying' | 'slot' | 'returning'; rect: SRect; lift: number /*0..1*/; opacity: number; contentT: number }
export const peelAt: (frame: number, spec: PlateSpec, sourceRect: SRect, slotRect: SRect) => PeelState;
export const Plate: React.FC<{spec: PlateSpec; frame: number; mainCam: Cam; world: WorldSpec; script: Script}>;
```
Plate drawing (screen px): flat shadow (`void` 60%, offset 0/14 × lift) → side thickness 6 × lift (`side`) → ground `deck` → `View` of its content clipped to the content area (r 12) → rule (held: 3 px `structure`; not-now: 3 + 2 px double `annotation` at 8 px inset; **active** status: the outer rule steps to 4 px `ink` over 4 frames, on either kind), with port gaps → caption (`Caption2`). A stage that has handed over control is shown by its PART's `visited` state (D24) inside the plate, not by the plate frame. Siblings stagger by `STAGGER.plates` (peel) and `STAGGER.platesReturn` (return), in narrative order.

**Content during the peel (was undefined):** frames 0–4 (lift) the plate shows a `world` view whose camera equals the main camera, so the part seems to rise off the board with no jump; frames 4–14 (flight) that view's camera log-interpolates to the plate's content shot, and `scene`/`tween` content cross-fades in over flight frames 6–12 while the world view fades out (two views for 6 frames only). The return runs the same in reverse, the preview states fading to the world's truth in its first 6 frames.

### 10.2 Scrim
```ts
export const Scrim: React.FC<{frame: number; at: number; outAt: number; rect?: SRect}>;   // flat void at ALPHA.scrim, 12-frame fades
```

### 10.3 Split (triptych)
```ts
export interface BandSpec {
  side: 'left' | 'right';
  caption: {text: string; at: number};                    // lands on its word (± 3)
  /** States and props for this band only (scope {band}). */
  states: StateEvent[]; props: PropEvent[]; channels: ChannelEvent[];
}
export interface SplitSpec {
  kind: 'triptych';
  at: number;                                             // centre band rules draw; side bands start sliding (12, 'move')
  foldAt: number;                                         // side bands slide back under the centre (12, 'move')
  bands: [BandSpec, BandSpec];                            // left, right; the centre is the present ('world')
}
export const splitAt: (frame: number, s: SplitSpec) => {t: number; center: SRect; left: SRect; right: SRect; phase: 'off' | 'opening' | 'open' | 'folding'};
export const Split: React.FC<{spec: SplitSpec; frame: number; mainCam: Cam; world: WorldSpec; script: Script}>;
```
Side bands are `View`s of the world with the **main camera, translated** so their content matches the centre band's (the copy slides out from under it). The centre keeps rendering the main view (no re-render); it gets a single 3 px `structure` rule; side bands get the not-now double rule and their caption at (band.x + 48, 164). **While the split is open the main view is clipped to the centre band** (the clip animates from the full frame to the band over the 12-frame open and back on the fold), so only the field shows in the gutters and margins; computed Ep01 luma of the open triptych ≈ 31.8. Everything a band's what-if needs (the pulled plug, the flipped rocker, the lookout and its pip) must lie inside the band: the critic's `column` shot (524, 760, ×1.22) leaves 14 px for the pulled plug and 26 px for the lookout, whose pip docks inside the block (ICONS.md §4.5).

### 10.4 The "later" window
```ts
/** Contract over DUR.windowContract ('move'), expand over DUR.windowExpand ('settle'); the double rule draws clockwise
 *  over DUR.plateFrameDraw from ruleAt (default at + 2). Ep01 uses ONE window: f2–f327 (S06 uses plates, not a window). */
export interface WindowSpec { at: number; expandAt: number; ruleAt?: number }
export const windowAt: (frame: number, specs: WindowSpec[]) => {t: number; rect: SRect};   // t = 1 fully contracted (WINDOW.rect)
export const TimeWindowClip: React.FC<{state: {t: number; rect: SRect}; children: React.ReactNode}>;  // clips the world views
export const TimeWindowFrame: React.FC<{state: {t: number; rect: SRect}; frame: number; drawAt: number}>; // double rule, drawn clockwise in 8 frames
```

### 10.5 Scene tweens (`panels/tween.ts`, critic change C6: replaces the icons' `morph` props)
```ts
/** A scene between `from` and `to` at t (0..1, eased 'move'): parts with the same id lerp their rect (and numeric props
 *  such as `xray`) and take `to`'s state at t >= 0.5; parts only in `from` fade out over t 0–0.5; parts only in `to`
 *  fade in over t 0.5–1 (same-rect swaps, e.g. cpuLga → amdPackage, therefore cross over at the midpoint). */
export const tweenScene: (from: SceneSpec, to: SceneSpec, t: number) => SceneSpec;
```
Any "stop" in any episode (vendor, form factor, generation) is two SceneSpecs, so the morph is data, not icon code. Moving blocks are standalone `logicBlock` parts in both scenes (ICONS.md §4.4). Ep01 uses it for the two S09 stops (STORYBOARD B21).

### 10.6 Plate rows and the rail (`panels/row.ts`)
```ts
export interface PlateRowSpec {
  id: string;                        // 'chain'
  plates: string[];                  // PlateSpec ids in narrative order (slots SPLIT.row6 index 0..5)
  /** Screen y of the rail (SPLIT.row6.railY) and each plate's rail stop x (its content's anchor). */
  rail: {y: number; stops: number[]};
}
```
The rail is drawn as 4 px `structure` segments inside each plate's content area plus a 4 px bridge across each 24 px gutter. A chain Bit in scope `{row}` hops between stops in screen px (speed rules as any run); `buildScript` derives the ports (open `PLATE.portOpenLead` frames before the Bit reaches a plate edge, close `PLATE.portCloseLag` after) and lights the bridge behind the Bit like any route.

---

## 11. The Lens (`lens/Lens2.tsx`)

```ts
export interface LensSpec {
  id: string;
  center: Pt | {screen: Pt};          // ring centre (screen point, or a world point projected at openAt)
  d: number;                          // 400 (300–420)
  mode: 'magnify' | 'xray';
  /** Magnification relative to the surrounding view (×4–×8). */
  k: number;
  focus: AnchorRef;                   // the world point shown at the ring centre
  target?: AnchorRef;                 // the 10 px target square the leader runs to (magnify)
  /** The leader draws from the ring position to the target over 8 frames from here, BEFORE the ring opens
   *  (Ep01: f188 and f600). Default openAt. */
  leaderAt?: number;
  openAt: number;                     // ring complete at openAt + 9
  settleAt?: number;                  // D24: ring and ticks fade to a 3 px grey rim over 6 frames
  closeAt: number;                    // 6-frame close
  chip?: string;                      // '×4'
  scope?: ViewScope;                  // default 'world'
}
export interface LensDraw { visible: boolean; r: number; draw: number; ticks: number; contentOpacity: number; ringColor: string; ringWidth: number; chip: number; leader: number; opacity: number }
export const lensAt: (frame: number, spec: LensSpec) => LensDraw;
export const Lens2: React.FC<{spec: LensSpec; frame: number; mainCam: Cam; world: WorldSpec; script: Script}>;
```
The view inside is `View` with `viewCam({center: focus, zoom: mainCam.zoom × k}, ringBounds)`, revealed by a wedge clip that follows the pen (`LENS2.wipeLead`), as 02's iris did. Screen-constant glyphs (the "?" badge, the eye badge) inside the Lens are drawn at the Lens's projection, so they appear once in the Lens and once in the world; inside the Lens the "?" badge is `GLYPH2.qBadgeLens` (72 px) and the eye badge 96 px. Ep01 builds `mode: 'magnify'` only; x-ray, dive and surface are *later*.

---

## 12. Labels v2 (`labels/*`)

```ts
import type {RoleName} from '../../shared/brand';

export interface TagSpec {
  id: string;
  text: string;                               // <= 3 words, <= 22 chars per line ('\n' allowed: 2 lines max)
  secondary?: string;                         // mono 34 px (Ep01: only '+5VSB · ATX')
  role: RoleName;                             // key-bar colour
  anchor: AnchorRef;                          // on the part's top face
  /** Text block origin (screen px) per shot; between shots it interpolates with the camera key's eased t. */
  slot: Pt | Record<ShotName, Pt>;
  side?: 'right' | 'left';                    // block side relative to the leader end
  elbow?: 'h' | 'v' | 'none';
  word: WordId;                               // the word that names it: land = w(word) (checked ± 3)
  land?: number;                              // override (rare)
  exitAt: number | 'hold';                    // 'hold' = hold(land, text, sentence)
  scope?: ViewScope;
  muted?: boolean;
  leaderless?: boolean;                       // a name inside its part (e.g. "Power supply" in the PSU body)
}
export interface TagDraw { anchor: Pt; leader: Pt[]; box: SRect; keyBar: SRect; plate: string; textReveal: number; leaderDraw: number; anchorScale: number; opacity: number; secondaryReveal: number }
export const tagAt: (frame: number, spec: TagSpec, cam: Cam, world: WorldSpec) => TagDraw | null;
export const Tag2: React.FC<{draw: TagDraw; spec: TagSpec}>;   // HTML text (absolute divs), SVG anchor/leader

export interface ChipStep { at: number; text: string; size: 'active' | 'rest'; underline: 'single' | 'double' }
export const chipAt: (frame: number, steps: ChipStep[]) => {current: ChipStep | null; prev: ChipStep | null; t: number};
export const Chip2: React.FC<{steps: ChipStep[]; frame: number}>;   // (144, 96); masked vertical roll; rule resizes in 6 frames

export interface PillSpec { id: string; part: string; dock: 'top-right' | 'inside' | {screen: Pt}; text: string; word: WordId; exitAt: number | 'hold'; flips?: Array<{at: number; text: string}>; scope?: ViewScope }
export const Pill2: React.FC<{spec: PillSpec; frame: number; cam: Cam; world: WorldSpec}>;

export interface ReadoutSpec { id: string; value: string; unit: string; slot: Pt; word: WordId; exitAt: number | 'hold' }
export const Readout2: React.FC<{spec: ReadoutSpec; frame: number}>;   // mono 64/38; types in over 5 frames

export interface CaptionSpec { text: string; at: number; exitAt?: number; place: SRect }
export const Caption2: React.FC<{spec: CaptionSpec; frame: number}>;

/** Every label-like element on screen at a frame, for budgets and collisions. */
export interface LabelBox { id: string; kind: 'tag' | 'pill' | 'chip' | 'readout' | 'caption' | 'name'; box: SRect; words: number; mustRead: boolean }
export const labelBoxesAt: (frame: number, script: Script, cam: Cam, world: WorldSpec) => LabelBox[];
export const budgetReport: (frames: number[], ...) => string[];   // tags <= 3, pills <= 2, words <= 12, safe areas, 24 px spacing, y <= 940
```
Text is HTML (absolutely positioned `div`s in a full-frame layer) so masks are CSS `clip-path` insets; anchors, leaders and key bars are SVG in the same layer. Fonts come from the kit (`SANS`, `MONO`). Under every tag, pill, chip and readout text box sits a `Knockout` (§4.2) that grows with the text reveal; plate names and band captions sit on their plate's flat ground and need none.

---

## 13. Glyph placement (`glyphs/GlyphLayer.tsx`)

```ts
export type GlyphEvent =
  | {kind: 'qFill'; part: string; block: string; at: number; outAt?: number; size?: 'default' | 'subject'; scope?: ViewScope}
  | {kind: 'qAccent'; part: string; block: string; at: number; scope?: ViewScope}
  | {kind: 'eye'; anchor: AnchorRef; block: string; drawAt: number; outAt: number; scope?: ViewScope}   // width = clamp(0.9 × block's on-screen width, 48, 96)
  | {kind: 'visited'; plate: string; at: number}
  | {kind: 'brackets'; part: string; port?: string; lockAt: number; fadeAt: number}
  | {kind: 'endTick'; route: string; at: number; outAt: number}
  | {kind: 'wake'; glyph: 'netJack' | 'clock'; anchor: AnchorRef; at: number; outAt?: number}
  | {kind: 'command'; text: 'Restart' | 'Shut down'; glyph: 'restart' | 'power'; screen: Pt; word: WordId; exitAt: number | 'hold'}
  /** S08. node/branches are ROOM-PLANE world px (parallax 0.9, like the monitor) so the fork rides with the monitor
   *  while it draws during the last frames of K7. Command chips (screen px) land after the camera has settled. */
  | {kind: 'fork'; from: AnchorRef; node: Pt; branches: Pt[]; drawAt: number[]; pulseAt?: number; outAt: number}
  /** Dashed ≈ analogy arc; its ≈ chip appears at the apex at chipAt (Ep01 f1014). */
  | {kind: 'arc'; from: AnchorRef; to: AnchorRef; drawAt: number; dur: number; chipAt?: number; outAt: number}
  /** signInCard: `rect` in ROOM-PLANE world px (it sits below the monitor and moves with it). */
  | {kind: 'card'; rect: WRect; drawAt: number; contentAt: number; outAt: number}
  | {kind: 'scopeLine'; rects: WRect[]; drawAt: number; dur: number; outAt: number};                             // S09 "typical desktop"
export const GlyphLayer: React.FC<{events: GlyphEvent[]; frame: number; cam: Cam | ViewCam; world: WorldSpec | SceneSpec; scope: ViewScope}>;
```

---

## 14. The script (`timeline/script.ts`): an episode is data

```ts
export interface Script {
  camera: CameraTrack;
  states: StateEvent[];
  props: PropEvent[];
  bits: BitSpec[];
  routes: RouteEvent[];
  channels: ChannelEvent[];
  washes: WashEvent[];
  tags: TagSpec[];
  pills: PillSpec[];
  readouts: ReadoutSpec[];
  chip: ChipStep[];
  glyphs: GlyphEvent[];
  lenses: LensSpec[];
  windows: WindowSpec[];
  scrims: Array<{at: number; outAt: number}>;
  plates: PlateSpec[];
  rows: PlateRowSpec[];                // S06: one row ('chain')
  splits: SplitSpec[];
  focus?: FocusKey[];                  // optional overrides; the track is derived (§6.1)
  field: FieldEvent[];                 // extra events; press/land are derived
  /** Who holds the faked glow (one part[.block] at a time); `swellAt` frames raise its alpha 0.20 → 0.35 → 0.20 over
   *  12 frames (S10: f1447 "lookout"). */
  glow: Array<{at: number; holder: string | null; swellAt?: number[]}>;
  cues?: {gainDb?: Record<string, number>};   // per-event overrides; the rest is derived (§15)
}

/** DSL helpers: each returns a fully-typed spec with frames resolved from word IDs. */
export const cam: (to: ShotName, o: {at: number; dur: number; ease: EaseName; anchor?: Pt; carry?: string}) => CameraKey;
export const bit: (id: string, o: Omit<BitSpec, 'id'>) => BitSpec;
export const tag: (id: string, text: string, o: Omit<TagSpec, 'id' | 'text'>) => TagSpec;
export const pill: (id: string, text: string, o: Omit<PillSpec, 'id' | 'text'>) => PillSpec;
export const flipTo: (part: string, to: PartState, at: number, o?: {block?: string; scope?: ViewScope}) => StateEvent;
export const prop: (part: string, p: PropEvent['prop'], at: number, dur: number, from: number | string, to: number | string, o?: {ease?: EaseName; scope?: ViewScope}) => PropEvent;
/** Validate and freeze a script: resolves 'hold' exits, derives ports for plate rows, derives field press/land events,
 *  sorts tracks, and runs every dev check once (camera rates, Bit speeds, budgets, anchors, proof of power). */
export const buildScript: (s: Script, world: WorldSpec) => Readonly<Script>;
```

---

## 15. Cues export (`cues/cues.ts`)

```ts
export type Note = 'A' | 'C' | 'D' | 'E' | 'G';
export type Cue =
  | {cue: 'button'; frame: number; gain_db?: number}
  | {cue: 'land'; frame: number; note: Note; gain_db?: number}
  | {cue: 'standby'; start: number; end: number}
  | {cue: 'lens_open' | 'lens_close' | 'dive' | 'lock' | 'energize' | 'alert'; frame: number; gain_db?: number};
export interface CueFile { style: 6; cues: Cue[] }

/** Derived from the script: button = 'press' prop events; land = Bit landings (notes stepped A-C-D-E-G along a parked chain,
 *  'A' for single runs; gain −4 dB for kind 'preview' | 'demo'); lens_open/close = Lens openAt/closeAt; lock = brackets lockAt;
 *  standby = the script's standby span (explicit). Sorted by frame; warns if two cues are closer than SOUND.minCueGapFrames. */
export const deriveCues: (script: Script, standby?: {start: number; end: number}) => CueFile;
/** Compares src/styles/style6/cues.json with the derived list; kitWarn for every difference (so they can never drift). */
export const checkCues: (file: CueFile, script: Script) => string[];
/** A 1-frame composition (register it in the style6 entry as 'SignalAtlasCues') that console.logs JSON.stringify(deriveCues(...), null, 2). */
export const CuesDump: React.FC<{script: Script}>;
```

---

## 16. Dev checks (`checks/devChecks.ts`)

```ts
export interface CheckReport { name: string; ok: boolean; lines: string[] }
/** Shared A4 anchors: f0 cap, chip by f8, Bit 33 → 59 (ripple only, absorbed), f91 CPU off, f294 "?" on, return complete by 346,
 *  441/472/498/519, 663–669 settle + 671 fill, chain 748/781/808/832/860 (park), 1194 + 48, 1798 lock, 1830 Now, 1837 press,
 *  Bit still moving at 1889 (lands 1891). */
export const checkAnchors: (script: Script) => CheckReport;
export const checkTagSync: (script: Script) => CheckReport;        // land within ±3 of word; exits >= hold rule
/** Counts only (tags ≤ 3, pills ≤ 2, words ≤ 12, one emphasis device, ≤ 3 Bits) plus box overlap and 24 px spacing. */
export const checkBudgets: (script: Script, world: WorldSpec, frames: number[]) => CheckReport;
/** Bible §7.7, as computed for Ep01: at holds, and on every frame where the lookout is the subject (a tag, pill, Lens,
 *  glow swell or Bit landing on it), the plug is visible above y 932. During a camera move the plug may leave up to
 *  CAMERA.proofOfPowerMoveGrace frames before the lookout does. Inside the later window, plates and bands: not applied. */
export const checkProofOfPower: (script: Script, world: WorldSpec, frames: number[]) => CheckReport;
export const checkSafeAreas: (script: Script, world: WorldSpec, frames: number[]) => CheckReport;      // text-safe, caption band (§5.1 rule), top-right keep-out
/** Replaces the per-frame primary/secondary classifier: lists gaps between scripted foreground events while the voice
 *  speaks (warn > BUDGET.maxForegroundStill), cue spacing (≥ 6) and any 30-frame window holding more than
 *  BUDGET.maxPrimaryPerSecond camera/panel/Lens moves. */
export const motionGapReport: (script: Script) => CheckReport;
export const runAllChecks: (script: Script, world: WorldSpec) => CheckReport[];   // called once by buildScript; prints with kitWarn
```

---

## 17. The shell (`Atlas.tsx`)

```ts
export interface AtlasDebug { fieldOff?: boolean; showPorts?: boolean; showSlots?: boolean; labelsOff?: boolean; checks?: boolean }
export interface AtlasProps { world: WorldSpec; script: Readonly<Script>; debug?: AtlasDebug }
export const Atlas: React.FC<AtlasProps>;
```
Render tree (bottom to top), all in one `AbsoluteFill` with `background: COLOR.field`:
1. `LivingField` (screen) — L0–L2, reactions, window dimming.
2. `TimeWindowClip` → main `View` (world: grounds, **vias**, wash, parts, channels, routes, Bit, world glyphs; clipped to the centre band while a split is open) → `Scrim` → `Split` side bands → `Plate`s (and the row rail and chain Bit above them).
3. `TimeWindowFrame` (double rule).
4. `Lens2` (above plates; never coexists with them in Ep01).
5. `LabelLayer` (knockouts, tags, pills, readouts, plate names, captions) → `Chip2`.
6. Screen glyphs that must sit on top: brackets.

Performance: geometry (paths, deep-circuit lattice, via lattice, route tracks) is memoised at module level from the world spec; per-frame work is transforms and opacities. Worst case is S06 (main view + six plate views, two more during each peel's 6-frame cross-fade); keep `tools/render.mjs` concurrency at 6.

---

## 18. Entry and wiring (for the intro builder)

```tsx
// src/styles/style6/Intro.tsx
import React from 'react';
import {Atlas} from '../../engine';
import {WORLD} from './ep01/world';
import {SCRIPT} from './ep01/script';
const Intro: React.FC = () => <Atlas world={WORLD} script={SCRIPT} />;
export default Intro;

// src/entries/style6.tsx registers ONLY 'SignalAtlas' (and the dev 'SignalAtlasCues'), via the kit's IntroComposition.
// tsconfig.style6.json: {"extends": "./tsconfig.json", "include": ["src/shared/**/*", "src/engine/**/*", "src/icons/**/*", "src/entries/style6.tsx", "src/styles/style6/**/*"]}
```
`npx tsc --noEmit -p tsconfig.style6.json` must pass before any render.

---

## 19. Build order, milestones and what to drop first (critic change C10)

Three builders work in parallel (engine, icons, intro). The plan fails if any of them waits on another, so the contract comes first and every milestone renders.

| Milestone | Engine builder | Icon builder | Intro builder |
|---|---|---|---|
| **M0 (≈ 40 min): contract + skeleton** | `core/`, `timeline/` (re-export the kit), `camera/`, `world/WorldLayer` with the registry, `Atlas` rendering field L0 + main view + labels; `buildScript` accepting the full `Script` type (unimplemented parts render nothing but type-check) | `types.ts` verbatim, `primitives.tsx`, `registry.ts` with a **placeholder for every IconType** (§1 of ICONS.md) | `ep01/world.ts`, `ep01/shots.ts`, the full `ep01/script.ts` written against this file's types; `tsc` passes; look-check stills at f0, f420, f1640 with placeholders |
| **M1 (≈ +60 min): the explanation** | Bits + routes, channels + wash, tags/chip/pill/readout + Knockout, Lens magnify, the later window, derived focus, checks | the P0 icons and glyphs | fix collisions from the stills; anchors and tag sync clean |
| **M2 (≈ +45 min): panels** | plates + peel + row + ports, tweenScene, Split, vias, deep layer | P1, then P2 icons | S06, S09 and S10 beats; luma pass on f700–f960, f1360–f1520, f1580–f1700 |
| **M3: polish** | performance, detail opacity, 2.5D sides | IconSheet review | repair cycles (≤ 3), final render and checks |

**If time runs short, drop in this order** (each keeps the explanation and every guardrail intact): (1) the deep-circuit layer L1; (2) the 2.5D perspective term (keep the oblique sides); (3) the detail fade (draw detail always at 1); (4) the arc's ≈ chip and the scope line's trace animation (draw them at once); (5) vias. **Never drop:** anchors, the window in S01–S02, both Lenses, the end tick, the chain row, the stop tweens, the triptych, the wake routes, proof of power, the luma floor, the caption-band rule.

**Interface ownership:** the engine builder owns `src/engine/**` except `tokens.ts` (a token change needs a matching `STYLE_BIBLE.md` change); the icon builder owns `src/icons/**`; the intro builder owns `src/styles/style6/**` and may stub a missing engine function locally behind the same signature, listing each stub in its return value, then delete the stub when the real one lands.

---

## 20. Changes made by the Ep01 intro build (10 October 2026)

All backward compatible (new optional fields; defaults keep the old behaviour unless noted). The intro (`src/styles/style6/`) uses each of them.

| Where | Change | Why |
|---|---|---|
| `labels/Pill2.tsx` | `PillSpec.dock` accepts `{world: Pt}`: the pill's top-left at a projected world point, so it rides with the camera. | "Main power: OFF" sits inside the PSU right of its fan through two camera moves (K3, K4); a `{screen}` dock floated off the PSU. |
| `energy/ChannelV2.tsx` | `drain` events take `speed` (px/frame, default `CHANNEL.drainSpeed`). | The S10 what-if drains take 7 frames (storyboard f1616–f1623), not 3. |
| `energy/WashV2.tsx`, `view/View.tsx` | `WashEvent.mode: 'over'` draws the domain as `energy` at `WASH_OVER_ALPHA` (0.16) over the parts (equal to `energyWash` on the board). Default `'under'`. | The Ep01 domain's top lies inside the chipset: under the parts only a sliver showed. |
| `glyphs/GlyphLayer.tsx` | `eye` is skipped in a view whose world lacks the anchor's part. | World-scope eye events were drawn at the scene centre in the S06 scene plates (and printed anchor warnings). |
| `glyphs/GlyphLayer.tsx` | `wake.settleAt`: the glyph steps from `textMuted` back to `structure` over 6 frames. | Wake sources settle with their routes and stay on the map. |
| `glyphs/GlyphLayer.tsx`, `glyphs/draw.tsx`, `checks/devChecks.ts` | `command.spinAt`: the restart glyph turns once (18 frames, `move`); the motion audit counts it. | "Restart can fix…": a verb that moves breaks a 46-frame still stretch. |
| `glyphs/GlyphLayer.tsx` | `arc.bend` (default 0.32 of the chord, upward; negative bows down). | The S07 ≈ arc ran behind "Hidden processor?". |
| `panels/row.ts`, `panels/Plate.tsx`, `panels/RowLayer.tsx` | `PlateRowSpec.rail.gaps` (half-width around each stop, px): the rail meets the icon's edges instead of crossing it; the rail light skips the gaps (`railSpans`, `minusGaps`). | The rail crossed the "?" badge and the CPU's heat spreader. |
| `panels/Split.tsx`, `Atlas.tsx` | Side bands are drawn after the main view and clipped out of the centre band; the main view's clip trails the band slide by 6 frames on opening and leads it on folding. `SplitSpec.captionY` (default 164). | The old order left the frame mostly field for ~6 frames (MP4 mean luma 27.0 at the fold). Band views are live worlds: Ep01 sets its captions under the PSU. |
| `panels/tween.ts` | Parts only in `from` fade out over t 0–0.6, parts only in `to` fade in over t 0.4–1 (was 0–0.5 / 0.5–1). | A swap never dips through an empty plate. |
| `tokens.ts` `FIELD` | vias pitch 48 → 24, land 0.30 → 0.55, press 0.35 → 0.65; grid land 0.25 → 0.45, press 0.35 → 0.55 (STYLE_BIBLE §5.1, §5.4 changed with them). | The field's reactions were invisible at full size. |

## 21. Round 1 changes (judges' review, 10 October 2026)

All backward compatible unless noted (new optional fields; old defaults kept where a rule did not change). STYLE_BIBLE §20 explains the reasons; each row names the judges' issue it answers.

| Where | Change | Issue |
|---|---|---|
| `panels/Split.tsx`, `Atlas.tsx`, `labels/budget.ts` | `SplitSpec.content: {scene, shot, glow?}`: every band (the centre too, scope `{band: 'center'}`) shows a recomposed scene at a band-sized framing; the centre cross-fades from the main view over opening frames 5–11 and back over the fold's first 6 (`splitMainOpacity`). `centerCaptions` (stacked lines) and `centerTags` (TagSpecs anchored in scene px) for the present. Band captions sit inside each band's top (`bandCaptionPlace`) and leave `CAPTION_LEAD` (6) frames before the fold. `ViewScope` band adds `'center'`. `SPLIT.triptych.y0` 140 → 184. | Triptych causes were 20 px marks at a band edge; the chip vanished; the fold clipped words. |
| `labels/Tag2.tsx`, `tokens.ts LABEL2` | Group entrance: anchor pop t0−3 → t0, leader t0−3 → t0+1 (was −6/−5). Exit: the whole group fades over 6 frames with a 12 px slide toward its key bar (`exitSlide`), no mask. `TagSpec.holdWaiver`: a documented early exit (the tag-sync check reports the reason, not a violation). | Leader stubs and lone anchors; "essor", "irst" half-words. |
| `labels/Pill2.tsx` | Exit is a fade (the mask only enters). | Clipped pill text on exit. |
| `labels/Chip2.tsx`, `tokens.ts TYPE` | Strict roll: old text out in 2 frames, new in from the next frame (5). Chip 44/34 → 52/44 px; readout unit 38 → 44. | Two chip labels readable together; phone legibility. |
| `signal/BitV2.tsx`, `signal/runs.ts`, `signal/routes.tsx`, `panels/RowLayer.tsx`, `view/View.tsx` | The Bit's halo is two radial falloffs (`BIT2.glow`, per-view gradient ids); trail 16/12/8 px. `BitHop.receiver: {part, block?}`: the receiver's outline ripples (`BIT2.receiverRipple`); every landing sheds the monogram burst (`BIT2.burst`). `BitDraw.afterglows`: every hop's travelled stretch stays lit at 30%, fading over 54 frames, plus a 3.2× underglow on the lit trail (`BIT2.afterglow`); rails too. `receiverRect(world, receiver)`. | Square halo read as a UI box; no payoff at the receiver; cyan appeared only while a Bit moved. |
| `field/LivingField.tsx`, `field/deepCircuit.ts`, `field/opacity.ts`, `tokens.ts FIELD/COLOR` | `deepChunkWalks`: the far layer keeps its walks; `deepPulses`: idle pulses per walk and event waves of pulses from every press and landing (`FIELD.deep.pulse`, `COLOR.fieldPulse`). Press ring adds an echo ring. Drift 1 px / 4 frames for L1 and L2; grid 30/80%, vias 45/70/80%; land 560 px / 24 f; press 1500 px / 34 f; `deepTrace` #202E4C. | The background still read as static (52–54% near-still frames). |
| `energy/ChannelV2.tsx`, `tokens.ts CHANNEL/COLOR` | A full standby channel always shimmers at `shimmerIdleStandby` (0.5); narrated shimmer raises it to 1; the dash phase is locked to f0. `standbyShimmer` #EEAA16 (ΔL* 16.6). | No sign of standby life during holds. |
| `energy/WashV2.tsx`, `world/types.ts` | `DomainSpec.blobs`: rounded rects; an `'over'` wash draws their union at 16% with two stepped outer bands (`WASH_SOFT`). | The domain wash read as a hard selection box. |
| `glyphs/draw.tsx`, `tokens.ts GLYPH2` | `QBadge2` fill = pointer: a 30% emphasis tint (`qFillTint`) and a dashed ring opening outside the badge (`qPointer`); badge 52/60/72 px. `Brackets2` default colour `ink`. `OffGlyph2` (IEC 5008 ring). `Journey2` ('loop' spins with `spinAt`; 'downUp'). Wake glyph 80 px. | Bright "?" fill in soft-off (red line 7); magenta brackets tied the button to the "?"; S08 drew no difference. |
| `glyphs/GlyphLayer.tsx` | `command.glyph: 'off'` and `command.journey: {kind, at}`; `pressWave` event (`PRESS_WAVE`: two ink rings off a part's outline). | S08; the invisible f0 press. |
| `lens/Lens2.tsx` | `LensSpec.tone`: `'emphasis'` (default) or `'ink'` (ring, ticks, leader, target). | Magenta Lens on the lookout. |
| `panels/Plate.tsx` | A part source on a room plane (the monitor) peels from where it is drawn (its depth and the reference shot). | S06 plate 6 peels from the monitor. |
| `panels/Scrim.tsx`, `timeline/script.ts` | Scrim `inDur` (default `DUR.scrimIn`). | A scrim ahead of sequential peels dipped to 27.7 luma. |
| `checks/devChecks.ts` | References accept parts and routes that live in plate scenes, tweens and a split's scene; the motion audit counts `pressWave`. | New recomposed scenes. |
| `timeline/words.ts` | `A4` re-exports the shared anchor table (the kit's `ANCHORS`). | Episode files read deadlines from one checked table, not typed frames. |
| `src/styles/style6/lint-times.mjs` | Rejects bare frame numbers in an episode's time fields (`at:`, `exitAt:`, `chip(…)`, `flipTo(…)`…). | Production: absolute frames in `script.ts`. |


## 22. Round 2 changes (judges' review of round 1, 10 October 2026)

All backward compatible unless noted (new optional fields; old defaults kept where a rule did not change). STYLE_BIBLE §21 explains the reasons; each row names the judges' issue it answers.

| Where | Change | Issue |
|---|---|---|
| `panels/Plate.tsx`, `tokens.ts DUR` | **Fade-through-ground** for scene plates: the lifted world view fades out over peel +1…+5 (`DUR.plateContentOut` 4), the plate flies as an empty opaque card, the scene fades in from +5 (`plateContentIn` 6); the return: scene out over 4 frames, then the world's truth in (`View` scope `'world'`) as it lands. World-content plates keep their state cross-fade. | Cross-dissolves double-exposed; two "?" over the desktop. |
| `panels/peel.ts`, `tokens.ts SPLIT` | `slot: {layout: 'pairWide', index}` (`SPLIT.pairWide`: 2 × 800 × 548 at x 148 / 972, y 222). `PlateSpec.tags?: TagSpec[]`: keyed tags inside a scene plate, anchored in scene px, screen slots (or `'auto'`), on a `deck` knockout; they fade with the plate. `caption.ghostAt`: the caption shows at 40% (`GHOST_OPACITY`) from then and steps to full ink on `at` (counts as must-read only from `at`). | S08 needed a two-way layout; S09's difference was unnamed; S06 reading load. |
| `panels/Split.tsx`, `Atlas.tsx`, `labels/LabelLayer.tsx` | **New triptych grammar** (same `SplitSpec` + `content.source?: WRect`): a scrim (`SPLIT_SCRIM`, 15%) and the centre band lifting as an opaque plate from `source` (12 frames), world out over +1…+4, scene in over +4…+10; side bands slide from behind it over +8…+20; the fold reverses (bands back in 10, scene out, truth in, card home over foldAt +10…+22 = `FOLD_END`). `splitClipAt` / `splitMainOpacity` stay for the API (null / 1); `splitScrimAlpha` feeds the label knockout; `SplitCenterRule` takes `mainCam`, `world`, `refShot`. | The world ghosted through a half-transparent centre band. |
| `panels/Scrim.tsx`, `timeline/script.ts` | Scrim `alpha?` (default `ALPHA.scrim`): S08's pair uses 0.15. | Luma floor with one plate over the world. |
| `signal/BitV2.tsx`, `signal/runs.ts`, `tokens.ts BIT2` | **The birth** (`BIT2.form`): at `restFrom` the monogram's three pixels fly in and merge into the head over 10 frames, then a square ripple. Burst 30/21/14 px at 1.5× offsets, 20 frames, drift 16, stagger 2; receiver ripple grows 52 px over 22 frames. `BitHop.quiet`: the soft glow fades out on landing and back on departure (`BitDraw.head.glow`). | No identity moment; the CPU glowed under the parked Bit (red line 1). |
| `signal/routes.tsx`, `panels/RowLayer.tsx`, `tokens.ts BIT2.afterglow` | A second halo step under the lit trail (`glow2Width` 7.5, `glow2Opacity` 0.08). A route's `cable` range draws as a two-wire lead (`CABLE`: 2.5 px wires 6 px apart) with a connector (`CablePlug`) at its end; the rest of the route is a 3 px trace; pointed and ink overlays follow the split. | Neon of the thumbnails; the lead and the trace read as one line (probe 4). |
| `field/LivingField.tsx`, `field/opacity.ts`, `field/Vias.tsx`, `tokens.ts FIELD/DUR` | `poolBreathAt(frame)` (± `FIELD.grid.poolBreath.amp` over `period`) scales the light pool (`opacityAt(…, poolK)`); pulses 3.5 px, 120 px tails, 7 px/frame, periods 80–150, 90%; event waves reach 1100 px at 40 px/frame; land ripple 1000 px / 96 px band / 0.75 / 30 frames; press band 112 px / 0.9; vias land 0.85, press 0.9. | "The background is very static". |
| `labels/reveal.tsx` (new), `labels/Tag2.tsx`, `labels/Caption2.tsx`, `labels/Pill2.tsx`, `labels/Readout2.tsx`, `tokens.ts LABEL2` | `RevealText` / `wordIn`: words fade in and rise 6 px over 4 frames, 1 frame apart, in reading order (`LABEL2.wordFrames/wordStagger/wordRise`); masks removed from text. `TagDraw.textAge`, `secondaryAge`. Pills: the capsule wipes, the words reveal. | Half-words in wipes. |
| `labels/Tag2.tsx` | `TagSpec.moreAnchors?: AnchorRef[]` (one extra leader per anchor from the key bar). `slot: 'auto'`: `labels/autoSlot.ts` `autoPlacement` picks, at the landing frame's camera (`tagAt(…, placeCam)`), the clearest of six positions round the anchor inside title-safe and returns an offset that rides with the anchor. | "Wake sources" pointed at a junction; production: slot tuning for every label. |
| `camera/frame.ts` (new) | `frameParts(world, ids | rects, {pad, area, minZoom, maxZoom})` → `Shot` fitting the parts' union in `MEANING_AREA` (x 144–1776, y 196–932). | Production: hand-placed shots. |
| `lens/Lens2.tsx` | The leader stays through the D24 settle and greys with the ring. | Lens #2's link to the lookout vanished. |
| `energy/WashV2.tsx`, `world/types.ts` | `DomainSpec.holes?` (rects the over-wash leaves untinted) and `outline?` (2 px dashed `energy` line along the polygon). | The lookout turned amber in S11; the domain was faint. |
| `glyphs/GlyphLayer.tsx`, `glyphs/draw.tsx`, `checks/devChecks.ts` | New events `loopArrow`, `powerRing`, `problem` (S08 signs; scoped to plates; the motion audit counts them). `wake` draws `WakeBadge2` (a badge). `card.approx?` (default false: no ≈). `ApproxChip2` scales with `GLYPH2.approxChip` (44 × 36). `PRESS_WAVE` grows 190 px over 24 frames. `GLYPH2.qFillTint` 0 (the soft-off pointer is the ring alone), `qPointer` 3 px / +10; brackets 5 px, serif 18, pad 18; `wakeGlyph` 96; `TYPE.chip` 36. | S08 glyphs; the clock as hardware; ≈ cryptic; the "?" read as lit; brackets small. |
| `src/entries/style6.tsx` | Dev composition `SignalAtlasTemplate` (the episode template, 240 frames). | Production: the template is proven to render. |


## 23. Round 3 changes (judges' review of round 2, 10 October 2026)

All backward compatible (new optional fields; old defaults kept unless a rule changed). STYLE_BIBLE §22 explains the reasons; each row names the judges' issue it answers.

| Where | Change | Issue |
|---|---|---|
| `signal/runs.ts`, `signal/BitV2.tsx`, `tokens.ts BIT2` | `BitSpec.birth?: 'plain' \| 'signature'`. **Signature birth** (`BIT2.signature`): at `restFrom` the B monogram's three pixels (56/44/32 px, the logo's diagonal, offsets (66, 40), (146, 84), (212, 120)) pop in magenta with their own neon (`glow` 1.35 × size at 42%), hold, and from `mergeAt` slide into the head one after another over `merge` frames, turning cyan; the head grows 0.3 → 1 as they arrive; a square ripple at the end (≈ restFrom + 18). `BitDraw.burst[]` takes `color` and `glow`. The Bit's glow gains a third step (`BIT2.glow.bloomR` 150 at 7%). | No brand moment at phone size; the thumbnails are glow-lit. |
| `field/LivingField.tsx`, `tokens.ts FIELD.deep.pulse`, `COLOR` | Pulses: a 4 px tail (`tailOpacity` 0.42) and a 6 × 26 px head (`headWidth`, `headLength`), 150 px long, 8 px/frame, periods 52–100; a long walk stretches its own period (`travel / duty`) instead of going dark. `deepTrace` #24345A (1.46:1 on field), `fieldPulse` #7C9FDA. `FIELD.grid.poolBreath` ±0.3 over 270 frames. | The field was invisible on a 390 px phone. |
| `energy/ChannelV2.tsx`, `tokens.ts CHANNEL`, `COLOR.standbyTrickle` | Shimmer event `style?: 'trickle'`: sparse pale dashes (`CHANNEL.trickleDash` 16/56, `trickleSpeed` 2.6 px/frame, `standbyTrickle` #FFD27A) run to the load inside the 6 px standby fill; `ChannelState.trickle` 0..1. | "A small trickle" showed no flow. |
| `labels/Chip2.tsx`, `tokens.ts TYPE.chipScope` | `ChipStep.scope?: string` (a muted 36 px line under the rule that reveals word by word and fades when cleared; it never replaces the time) and `ChipStep.dim?: boolean` (the chip steps to `CHIP_DIM` 0.4 over 8 frames). `chipBox` includes the scope line; `chipDimAt(frame, steps)`. | The chip mixed time and scope. |
| `labels/Tag2.tsx`, `labels/LabelLayer.tsx`, `labels/budget.ts` | `TagSpec.steps?: Array<{at, text, secondary?, role?}>`: later names of the same thing on one leader (the old text fades in 3 frames, the new one enters word by word; the key bar takes the step's role; the layout keeps the widest and tallest step, so the leader never moves). `TagSpec.card?: boolean`: a leaderless heading on its own deck card with a 2 px structure rule. `TagSpec.slot` is optional: omitted = `'auto'` (`isAutoSlot`). `roleKeyColor(role)`. | Two stacked tags on one block; "Why different?" sat on hardware; production. |
| `panels/peel.ts`, `panels/Plate.tsx`, `Atlas.tsx`, `view/View.tsx`, `world/WorldLayer.tsx`, `glyphs/GlyphLayer.tsx` | **The hero carry**: `PlateSpec.hero?: {scenePart, worldPart, block?}`. From the peel, the world's own part (or block, as a standalone `logicBlock` in the world's state) is drawn in the card at a rect interpolated from where the world draws it (relative to the card) to where the scene draws it (relative to the content area); the scene gathers round it from peel +8 over 5 frames; the hero hands over at +13. On the return it reappears as the scene leaves and rides home. `heroGhostAt` / `ghostsAt(frame, plates)`: while a hero plate is out, the main view draws its source as a **peeled socket** (`ghosts` on `View` → `WorldLayer`/`PartView`: the part at `GHOST_KEEP` 0.22 with a dashed annotation outline; chipset blocks via `ChipsetBlock.ghost`; the "?" badge fades with its block). | Plates flew as empty cards; two lookouts with two eyes; two monitors. |
| `panels/peel.ts`, `panels/Plate.tsx` | `PlateSpec.lift?: 'world' \| 'card'` ('card': no lifted world view: a plate that shows another machine leaves as an empty card). `PlateSpec.names?: Array<{text, at, scenePt, exitAt?}>`: muted part names (TYPE.partName 36, textMuted, word reveal) centred on scene points; supporting text (not must-read). | The AMD plate lifted a copy of the Intel board; unlabelled chipset and battery. |
| `panels/devices.ts` (new) | `sceneFrom(world, picks, {id, pad?, at?, extra?})`: a plate scene cut from the world (parts, or blocks lifted out as standalone `logicBlock`s, props/initial/scale overrides). `stageShot(scene, id, px, dy?)`. `chainRow({id, stages, peelAt, backAt, lands, restFrom, plateId?, hopFrames?, peelStagger?, backStagger?, rule?})` → `{plates, row, bit}`: a whole sequence (row6 slots, ghost names, the active rim, heroes, the rail with gaps, the parked chain Bit with quiet stages) from one call. `scenePartRect`, `row6Stop`. | Production: hand-composed scenes; a chain cost ~40 lines. |
| `panels/Split.tsx`, `labels/budget.ts` | **Fold v3** (`FOLD_END` 22 → 13): side bands back behind the centre (F…F+6), its scene out (F+2…F+6), the empty opaque card flies home (F+5…F+12) and, as it lands, the world's truth fades in on it (no ground of its own) while its fill, rule, side and shadow fade together (F+9…F+13). `BandSpec.outcome?: {text, at, scenePt}`: a caption centred on a scene point (`outcomePlace`), counted as must-read. `BAND_SLOTS`. | A large empty card with a stray stroke; a ghost outline over the next tag; the outcome was never named. |
| `glyphs/GlyphLayer.tsx`, `glyphs/draw.tsx`, `tokens.ts GLYPH2` | `eye.closeAt?` (the upper lid comes down onto the lower one over `eyeCloseFrames` 6, the pupil shrinks away, three lashes) and `eye.look?: Array<{at, to: AnchorRef \| null}>` (the pupil glances toward an anchor by up to `eyeLookMax` 0.2 × width over `eyeLookFrames` 6). The eye's ≈ is two unboxed waves (`GLYPH2.eyeApprox`; `approxWavesD`). New event `mark` (`MarkBadge2`: a capsule, Sora 700 34 px, `GLYPH2.mark`). `problem.hedgeAt?` (dashed and faint: it may be gone) and `doubtAt?` (a grey "?" on its corner: it may stay). `QBadge2.level`: `GLYPH2.qDim` 0.58 unless the block is powered, pointed at, accented or in a Lens (the GlyphLayer reads `states`). `scopeLine` draws as four corner brackets that grow along their edges together. | The ≈ chip was cryptic; the triptych's eyes; the hedge in S08; red line 7; the scope rule drew as an "L". |
| `checks/devChecks.ts` | The motion audit counts `mark`, eye `closeAt` / `look` steps and `problem` `hedgeAt` / `doubtAt`. | — |
| `labels/Caption2.tsx` | `GHOST_OPACITY` 0.4 → 0.56 (≈ 5.4:1 on the deck ground). | Dim chain names were low contrast at 390 px. |
| `tokens.ts` | `TYPE.pill` 40 → 44; `TYPE.chipScope` 36; `TYPE.partName` 36; `SPLIT.pairWide.y0` 222 → 198. | Pills 8 px on a phone; "Why different?" needs room under the pair. |


## 24. Round 4 changes (judges' review of round 3, 10 October 2026)

All backward compatible (new optional fields; old defaults kept unless a rule changed). STYLE_BIBLE §23 explains the reasons; each row names the judges' issue it answers.

| Where | Change | Issue |
|---|---|---|
| `panels/peel.ts`, `panels/Plate.tsx` | **The hero home.** `isHeroHome(spec)` (a scene plate with a `hero`, lift `world`, no sibling): at `returnAt` the scene fades out at the slot over `PLATE4.sceneOut` (4) frames, uncovering the hero view in the world's state (drawn under the scene, so a preview state eases back to the truth in place); the card (ground, side, shadow, rule, rail) dissolves over `PLATE4.cardFade` (4–8); the hero flies from its scene rect to its world screen rect over `PLATE4.heroFly` (4–16, `settle`, a 12 % arc up the screen), unclipped; `heroGhostAt` fills the socket over end−4…end−2 and the hero fades over the last 2 frames. `returnFrames(spec)` / `plateEnd(spec)` replace `returnAt + DUR.plateReturn` everywhere (17 for a hero home, 10 slide out, 8 into a sibling, else 12). | The fly-home crowded the CPU and DIMMs; a doubled "?". |
| `panels/peel.ts`, `panels/Plate.tsx` | `PlateSpec.lift: 'slide'`: another machine slides in from the frame's right edge over `PLATE4.slideIn` (14, `arrive`) and out over `slideOut` (10, `exit`), its scene drawn from the first frame to the last; its names and caption ride with the rect, its tags with a translate of the plate's offset from its slot. | The stops entered and left as blank cards; one crossed the CPU. |
| `panels/peel.ts`, `panels/Plate.tsx` | `PlateSpec.enterFrom?: string` / `returnInto?: string`: a sibling slides out from behind another plate's slot (`PLATE4.enter` 12, `move`) and back behind it (`into` 8), its drawing intact. Draw it before that plate. | Two monitor plates flew home stacked (S08). |
| `panels/peel.ts`, `panels/Plate.tsx`, `labels/budget.ts` | `PlateSpec.names[].tone?: 'muted' \| 'ink'` (an ink hedge caption); names are `TYPE.partName` (44) and count as must-read words in the budgets. | Answer text; S08's hedge. |
| `panels/devices.ts` | `chainRow({…, backOrder?: number[]})`: the stage indices in the order they fly home (default last first); `peelStagger` (Ep01: 6) and `backStagger` (3) as before. | Take-off and fly-home choreography. |
| `panels/Split.tsx`, `Atlas.tsx`, `world/WorldLayer.tsx` | **The carry.** `SplitContent.carry?: Array<{scenePart, worldPart, block?}>` and `carryChannels?: Array<{sceneChannel, worldChannel}>`: at the open (0–12) and the fold (from +4) the carried parts are one synthetic scene in a virtual space whose zoom eases from the world's to the band's (`carriedScene`), each part's rect (and a cord's `points`, a channel's ends) interpolated between its world screen rect and its band rect; a `psu` gets `length: c` (0 full → 1 short). The open first shows the lifted world (with the peeled sockets) fading round the carried parts; the band scene takes over at +12. `splitGhostsAt(frame, splits, into?)` gives the world's peeled sockets (merged in Atlas with the plates'). `SplitState` gains `carry`, `ghost`, `ground`, `bands` (the side bands fade as they fold). `FOLD_END` 13 → 20. Without `carry` the round-3 open and fold are unchanged. | Blank cards at the triptych's open and fold; three supplies overlapping. |
| `panels/Split.tsx`, `tokens.ts SPLIT.triptych.darkDim` | `BandSpec.marks?: Array<{kind: 'cross' \| 'ring', at, scenePt, size}>` (a coral cross; an ink ring that draws on), drawn over the band's view; a band with an `outcome` dims its drawing to `darkDim` (0.55) from the outcome over 8 frames (its ground stays opaque). | The causes were 3–5 px on a phone. |
| `field/focus.ts`, `field/opacity.ts`, `field/Vias.tsx`, `field/LivingField.tsx`, `view/View.tsx`, `world/WorldLayer.tsx`, `Atlas.tsx`, `tokens.ts FIELD.ping/vias` | **Focus pings.** `pingsAt(frame, script, world): FieldPing[]` (`{cx, cy, age}`, main-view screen px) from the derived focus segments (never a Bit, never the centre; first at +`delay`, then every `period` while held). `prepareReactions(frame, events, cam, pings?)` adds them as square rings (`which: 'ping'`, gain `FieldGains.ping`); `pingBandAt(p, reactions)` (the vias inside a band draw at `FIELD.vias.pingDot` 7 px). `FieldGains.plateau?` (the vias' pool holds its peak to `FIELD.vias.poolPlateau` 0.45 of its radius); `viaBreathAt(frame)` (±`FIELD.vias.breath.amp` over 60 frames, phase-locked to the lookout). The pings ride `field.pings` into the main view's vias and the LivingField. | The background lived in the margins. |
| `signal/runs.ts`, `signal/BitV2.tsx`, `tokens.ts BIT2.signature` | `BitSpec.trailSignature?: boolean`: the first hop's first `BIT2.signature.depart` (16) frames draw the trail as the logo's three magenta pixels popping in the signature layout and converging into the trail's places, shrinking and turning cyan. `BIT2.signature.offsets` → (68, 26), (148, 52), (214, 74). | The signature appeared once; the bookend. |
| `glyphs/GlyphLayer.tsx`, `glyphs/draw.tsx`, `tokens.ts GLYPH2` | `mark` gains `sub?: string` (a mono `TYPE.secondary` subline right-aligned under the capsule, on a deck plate) and `leader?: boolean` (a 3 px annotation leader with the 8 px anchor to the mark's anchor); `GLYPH2.mark` font 34 → 44. `problem`: 84 px (`GLYPH2.problemSize`); `hedgeAt` fades the "!" to a dashed outline inside a **dotted ring** (`GLYPH2.hedge`); `doubtAt` now draws the dotted ring round a solid "!" with two dotted echoes (`hedge.beat` 14) and a two-beat pulse (the grey "?" is gone). New `stage` event (`StageMark2`: `'code'` \| `'file'`, on `from`, a copy sliding into `to` at `moveAt`). `scopeLine` draws four separate L-brackets (`SCOPE_ARM` 76 px) and takes `pad?`. Wake badges settle to `GLYPH2.wakeDim` (0.56). `GlyphLayer` `main?: boolean`: a world-scoped view that is not the main view (a hero, a carried scene) never draws the main view's own glyphs (`View` passes `main` for id `main`). The world's "?" badge disappears while its block is peeled (`1 − ghost`). | "First" on an unnamed block; the S08 hedge; plates 4–5 alike; the scope rectangle; bright wake sources; doubled "?". |
| `labels/Chip2.tsx` | A change is a fade with a 10 px slide (old out over 3, new in from the old one's last frame over 4, `arrive`), no mask. | The roll clipped glyphs. |
| `labels/budget.ts` | Plate `names` count as must-read words while the plate is in its slot. | Answer text. |
| `icons/pc/logicBlock.tsx` | The wide block (the lookout) is drawn as a chip: lead pins on its top edge and between its bottom pads, a pin-1 dot (from 36 px on screen), two rows of square cells (from 50 px), its input pads; no bars, no macro. | It read as an ID card. |
| `icons/pc/psu.tsx` | `length?: 'full' \| 'short' \| number` (0…1 morphs: uniform scale from the height, the grommet and screws interpolated, the vents fading over the first half); `psuShorten()`. | The triptych's carry. |
| `icons/pc/monitor.tsx` | `sweep?: number` (0…1: a power-on sweep revealing the lit screen from the top behind a scan line). | S08 still through "starting again". |
| `tokens.ts` | `TYPE.secondary` 34 → 40, `chipScope` 36 → 40, `partName` 36 → 44, `chip` 36 → 40, `supportingMin` 40; `PHONE.supportingText` 40. | Secondary text 5–8 px on a phone. |
| `src/entries/style6.tsx` | `episodeIds(nn)` and the file-naming ids `SignalAtlasEp01`, `SignalAtlasEp01Cues`, `SignalAtlasEp01FieldOff` (same compositions as the old ids, which stay), and `SignalAtlasEpXX` for the template. | Style guide §13.8. |
| `tools/measure.py` (moved from `out/style6/r3/tools/`) | Adds a 0.5 % share, `--thr` (the per-pixel level threshold; the judges' figure is `--thr 4`) and `--ranges`. | Style guide §14.3. |
