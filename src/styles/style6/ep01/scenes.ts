/**
 * Recomposed plate scenes (STORYBOARD.md B13–B15, B18–B19, B21, B24): the S06 chain stages, the S08 "Restart" |
 * "Shut down" pair, the S09 stops and the S10 triptych path. Same icons, local world px; blocks are standalone
 * logicBlock parts at scale 1 so they keep their size. Round 3: scenes that show this machine are CUT FROM THE WORLD
 * (`sceneFrom`), so a world change carries into its plates; only other machines (the stops) and the recomposed
 * standby path are drawn by hand. The reasons behind each choice are in STORYBOARD.md §13–§16.
 */
import {amdGeometry, blockRectAt, ecGeometry, laptopBoardGeometry, socGeometry} from '../../../icons';
import {sceneFrom, type PartSpec, type SceneSpec, type Shot} from '../../../engine';
import {QUIET, WORLD} from './world';

const lookout = (x: number, y: number): PartSpec => ({
  id: 'lookout',
  type: 'logicBlock',
  rect: {x, y, w: 72, h: 36},
  initial: 'alwaysOn',
  order: 20,
  props: {shape: 'wide', pip: 'inside-top-right'},
});
const qBlock = (x: number, y: number): PartSpec => ({
  id: 'q',
  type: 'logicBlock',
  rect: {x, y, w: 64, h: 64},
  initial: 'off',
  order: 20,
  props: {shape: 'square', badge: 'q', pip: false},
});
const at = (r: {x: number; y: number}) => [r.x, r.y] as const;

/* ------------------------------------------------------------------------------------------------
 * S06 chain stages (row6 content: 268 × 264, the rail through its centre; shot centre = the rail stop)
 * ---------------------------------------------------------------------------------------------- */

/** p1 "Always-on logic": the lookout cut from the chipset, fed by its standby line into its in1 pad (its eye rides on
 *  it), at 173 px. */
export const LOOKOUT_SCENE = sceneFrom(WORLD, [{part: 'chipset', block: 'lookout', id: 'lookout'}], {
  id: 's06-lookout',
  at: [64, 70],
  pad: 64,
  extra: {channels: [{id: 'standby', points: [[80, 220], [80, 106]], kind: 'standby', initial: 'full'}]},
});
export const LOOKOUT_SHOT: Shot = {center: [100, 88], zoom: 2.4};

/** p2 "Main power": the supply centred on the rail (the Bit lands on it), its empty 18 px main-channel stub rising from
 *  the cable exit; the stub fills when the Bit lands. */
export const POWER_SCENE = sceneFrom(WORLD, ['psu'], {
  id: 's06-power',
  at: [0, 120],
  pad: 40,
  extra: {channels: [{id: 'main', points: [[262, 120], [262, -40]], kind: 'main', initial: 'empty'}]},
});
export const POWER_SHOT: Shot = {center: [227, 178], zoom: 0.44};

/** p3 "Smaller processor": the "?" block cut from the chipset; it wakes when the chain reaches it. Its bottom edge sits
 *  on the rail, so the Bit lands just under the "?" and its identity stays in view. */
export const Q_SCENE = sceneFrom(WORLD, [{part: 'chipset', block: 'q', id: 'q'}], {id: 's06-q', at: [48, 48], pad: 48});
export const Q_SHOT: Shot = {center: [80, 110], zoom: 1.6};

const cpu = (): PartSpec => ({id: 'cpu', type: 'cpuLga', rect: {x: 0, y: 0, w: 260, h: 260}, props: QUIET});
/** Plates 4–5: the CPU centred on the rail stop at 78 px, its stage's hero below it, drawn large. The Bit lands on the
 *  processor that runs the stage (storage holds code; processors run it) without its glow, never on the flash or SSD. */
export const CPU_SHOT: Shot = {center: [130, 130], zoom: 0.3};

/** p4 "Firmware on CPU": the SPI flash that holds the firmware (140 × 85 px) on its bus under the CPU; the bus holds a
 *  lit level while the stage is active. */
export const FIRMWARE_SCENE: SceneSpec = {
  id: 's06-firmware',
  bounds: {x: -110, y: 0, w: 480, h: 570},
  parts: [cpu(), {id: 'flash', type: 'spiFlash', rect: {x: -103, y: 290, w: 466, h: 283}, props: QUIET}],
  routes: [{id: 'spi', points: [[130, 260], [130, 290]]}],
};

/** p5 "Loader": the M.2 SSD that holds the boot loader (240 × 29 px) on its link under the CPU. Round 4: drawn at the
 *  world part's own proportions (280 × 34), so the hero carried out of the world is the same shape as its scene copy. */
export const LOADER_SCENE: SceneSpec = {
  id: 's06-loader',
  bounds: {x: -280, y: 0, w: 820, h: 440},
  parts: [cpu(), {id: 'm2', type: 'm2', rect: {x: -270, y: 330, w: 800, h: 97}, props: QUIET}],
  routes: [{id: 'nvme', points: [[130, 260], [130, 330]]}],
};

/** p6 "Windows": the monitor the plate peels from, dark until "Windows takes control", then lit with the generic
 *  sign-in silhouette (no logo, no captured UI). The Bit parks on the screen. */
export const WINDOWS_SCENE = sceneFrom(WORLD, [{part: 'monitor', initial: 'off', props: {lit: 0, contentIn: 0, content: 'signin'}}], {id: 's06-windows', at: [0, 0], pad: 40});
/** The bezel's centre on the rail stop; the monitor 224 px wide (the rail meets the bezel's edges: gap 116). */
export const WINDOWS_SHOT: Shot = {center: [140, 85], zoom: 0.8};

/* ------------------------------------------------------------------------------------------------
 * S08: "Restart" | "Shut down", twin plates (pairWide: 800 × 548, content 752 × 441 under the caption). The same
 * running PC in both (the world's monitor with a generic desktop); the commands act on it with their generic signs.
 * ---------------------------------------------------------------------------------------------- */

const runningPc = (id: string): SceneSpec => sceneFrom(WORLD, [{part: 'monitor', initial: 'on', props: {lit: 1, content: 'desktop'}}], {id, at: [0, 0], pad: 150});
export const RESTART_SCENE = runningPc('s08-restart');
export const SHUTDOWN_SCENE = runningPc('s08-shutdown');
/** The monitor (bezel 252 px) centred in the content; the command sign circles it (r CMD_RING px on screen). Round 4:
 *  ×1.07 → ×0.9, so the hedge caption ("Can fix", "Might not") fits under the sign inside the plate. */
export const CMD_SHOT: Shot = {center: [140, 118], zoom: 0.9};
/** The command sign's radius on screen. */
export const CMD_RING = 172;
/** Scene points: the sign's centre (the bezel's centre); the problem mark, on the screen's upper right (round 4: inside
 *  the sign, clear of its stroke with its dotted hedge ring: judges, the round-3 "?" collided with the power ring); the
 *  hedge caption, centred under the sign. */
export const CMD_CENTER = [140, 92] as const;
export const CMD_PROBLEM = [214, 52] as const;
export const CMD_HEDGE_AT = [140, 92 + (CMD_RING + 14 + 26) / 0.9] as const;

/* ------------------------------------------------------------------------------------------------
 * S10 triptych bands: the standby path, recomposed so cause and effect share one band
 * ---------------------------------------------------------------------------------------------- */

/** Wall socket → cord → the plug in the supply's inlet (the rocker below it) → the standby line → the lookout. Same
 *  icons and ids as the world (socket, cord, plug, psu; the standby channel), so the world's events (the trickle, the
 *  glow) reach every band; the band events (the plug pulled, the rocker flipped, the drain, the lookout dark, its eye
 *  closing) are scoped. A SHORT supply (a schematic shortening: rear face, fan and cable exit at true proportions)
 *  drawn ×1.29 taller, so the whole supply, plug and socket fit each band and the rocker is 81 px tall; the pulled plug
 *  drops down and away from the socket. The standby line leaves the cable exit straight up to the lookout (in the
 *  world it runs through the 24-pin and the regulator): the path is the same, only shorter. */
const PSU_BAND = {x: 150, y: 300, w: 230, h: 150};
/** The supply's cable exit (where the standby line leaves), from the icon's own geometry. */
const BAND_LINE_X = 328;
const PULL = [-18, 34] as const;
export const STANDBY_PATH_SCENE: SceneSpec = {
  id: 's10-standby-path',
  bounds: {x: -40, y: 140, w: 430, h: 320},
  parts: [
    {id: 'socket', type: 'wallSocket', rect: {x: -30, y: 300.6, w: 64, h: 104}},
    {id: 'cord', type: 'cord', rect: {x: 34, y: 342.6, w: 47, h: 8}, props: {points: [[34, 346.6], [81, 346.6]], seated: 1, pull: PULL}},
    {id: 'psu', type: 'psu', rect: PSU_BAND, props: {rocker: 'I', length: 'short', ...QUIET}},
    {id: 'plug', type: 'iecPlug', rect: {x: 80.7, y: 323.6, w: 46, h: 46}, props: {seated: 1, pull: PULL}},
    lookout(BAND_LINE_X - 36, 196),
  ],
  channels: [{id: 'standby', points: [[BAND_LINE_X, 300], [BAND_LINE_X, 232]], kind: 'standby', initial: 'full'}],
};
/** A band-sized framing (560 × 736): the whole scene at ×1.25 under the captions (rocker 42 × 81 px, plug 58 px,
 *  lookout 90 px with its eye), its outcome line above the eye. */
export const STANDBY_PATH_SHOT: Shot = {center: [175, 273], zoom: 1.25};
/** Where a band's outcome ("Dark") sits: centred above the lookout's eye. */
export const BAND_OUTCOME_AT = [BAND_LINE_X, 92] as const;
/** Round 4, the causes at band size: the gap the pulled plug leaves at the inlet (a coral cross), and the rocker's
 *  centre (an ink ring when it flips to O), from the supply's own geometry (inlet x 124–150, centre y 346.6; rocker
 *  33.6 × 64.7 at (116.4, 380.2)). */
export const BAND_GAP_AT = [114, 346.6] as const;
export const BAND_ROCKER_AT = [133.2, 412.5] as const;
/** The world region the triptych's centre band lifts from (socket → power supply → standby line → lookout). Round 4:
 *  wide enough to hold the whole supply (x 400–880), so every carried part starts inside the card. */
export const STANDBY_PATH_SOURCE = {x: 232, y: 612, w: 660, h: 312};

/* ------------------------------------------------------------------------------------------------
 * S09 stops (pairRight content ≈ 628 × 253 under the caption): each plate shows its machine's real layout from its
 * first frame; the difference is named inside the plate.
 * ---------------------------------------------------------------------------------------------- */

const PKG = {x: 10, y: 10, w: 260, h: 260};
const amd = amdGeometry(PKG);
const IOD_X = amd.iod.x + amd.iod.w / 2;

/** AMD: one package holding both blocks in its I/O die (the lookout above the "?", so its eye clears the "?"); the
 *  board keeps its own chipset, drawn as AMD's (a finned lid, no x-ray, no blocks: never the Intel drawing). */
const AMD_LOOKOUT = blockRectAt([IOD_X, amd.iod.y + 26], 'wide');
const AMD_Q = blockRectAt([IOD_X, amd.iod.y + 92], 'square');
export const AMD_SCENE: SceneSpec = {
  id: 's09-amd',
  bounds: {x: 0, y: 0, w: 600, h: 280},
  parts: [
    {id: 'amd', type: 'amdPackage', rect: PKG},
    {id: 'chipset', type: 'chipset', rect: {x: 470, y: 150, w: 128, h: 118}, props: {blocks: [], variant: 'amd'}},
    lookout(...at(AMD_LOOKOUT)),
    qBlock(...at(AMD_Q)),
  ],
};
export const AMD_SHOT: Shot = {center: [295, 140], zoom: 0.92};
/** "In the processor" leads to EACH block's right edge. */
export const AMD_TAG_ANCHOR = [AMD_LOOKOUT.x + AMD_LOOKOUT.w, AMD_LOOKOUT.y + AMD_LOOKOUT.h / 2] as const;
export const AMD_Q_ANCHOR = [AMD_Q.x + AMD_Q.w, AMD_Q.y + AMD_Q.h / 2] as const;
/** The finned chipset's muted name, in the gap left of it. */
export const AMD_CHIPSET_NAME_AT = [370, 236] as const;

const LB = {x: 0, y: 0, w: 600, h: 220};
const lb = laptopBoardGeometry(LB);
const SOC = {x: lb.X(130) - 75, y: lb.Y(110) - 75, w: 150, h: 150};
const EC = {x: lb.X(400) - 52, y: lb.Y(120) - 36, w: 104, h: 72};

/** Laptop: the "?" in the SoC package, the lookout in its own EC chip, a battery; no ATX PSU, no separate chipset. */
export const LAPTOP_SCENE: SceneSpec = {
  id: 's09-laptop',
  bounds: {x: 0, y: 0, w: 810, h: 220},
  parts: [
    {id: 'board', type: 'laptopBoard', rect: LB},
    {id: 'soc', type: 'socPackage', rect: SOC},
    {id: 'ec', type: 'ecChip', rect: EC},
    {id: 'battery', type: 'battery', rect: {x: 622, y: 58, w: 188, h: 104}, props: QUIET},
    lookout(...at(blockRectAt(ecGeometry(EC).slot, 'wide'))),
    qBlock(...at(blockRectAt(socGeometry(SOC).slotQ, 'square'))),
  ],
};
export const LAPTOP_SHOT: Shot = {center: [450, 100], zoom: 0.68};
/** The battery's muted name, under it. */
export const LAPTOP_BATTERY_NAME_AT = [716, 204] as const;
/** The EC's top-right corner (the "Lookout: own chip" leader's anchor). */
export const LAPTOP_TAG_ANCHOR = [EC.x + EC.w, EC.y + 10] as const;
