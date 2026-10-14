/**
 * Ep01 world (STORYBOARD.md §1): one typical Intel ATX desktop in soft-off, plugged in, rear switch at "I".
 * Orthographic map in true topology; world px = screen px at zoom 1. Parts render only through the icon registry.
 */
import './icons';
import type {WorldSpec} from '../../../engine';

/** Context parts whose state the intro never narrates carry no pip (deviation: a row of hollow squares over the DIMMs
 *  and stray squares beside the M.2, LAN chip, flash, PSU and monitor read as UI noise; state pips stay on the CPU,
 *  the lookout and the "?", whose states the story is about). */
export const QUIET = {pip: false} as const;

export const WORLD: WorldSpec = {
  id: 'ep01-intel-atx',
  seed: 'bits-in-motion-ep01',
  bounds: {x: 200, y: 100, w: 1600, h: 860},
  parts: [
    {id: 'case', type: 'case', rect: {x: 330, y: 112, w: 1130, h: 816}},
    {id: 'board', type: 'board', rect: {x: 560, y: 150, w: 840, h: 610}},
    {id: 'rearIo', type: 'rearIo', rect: {x: 534, y: 250, w: 38, h: 230}},
    {id: 'lan', type: 'lanChip', rect: {x: 600, y: 428, w: 34, h: 26}, props: QUIET},
    // round 1: no pip on the CPU or the "?" (judges: hollow squares that never change read as artefacts; the CPU's
    // darkness is its grey outline and unlit body, the "?" carries its badge, the lookout keeps its breathing pip)
    {id: 'cpu', type: 'cpuLga', rect: {x: 650, y: 190, w: 260, h: 260}, props: QUIET},
    ...[950, 972, 994, 1016].map((x, i) => ({id: `dimm${i + 1}`, type: 'dimm' as const, rect: {x, y: 190, w: 14, h: 260}, props: QUIET})),
    {id: 'm2', type: 'm2', rect: {x: 1080, y: 300, w: 280, h: 34}, props: QUIET},
    {id: 'pcie', type: 'pcieSlot', rect: {x: 950, y: 560, w: 410, h: 20}},
    {
      id: 'chipset',
      type: 'chipset',
      rect: {x: 640, y: 500, w: 260, h: 190},
      props: {
        blocks: [
          {key: 'lookout', shape: 'wide', rel: {x: 20, y: 130, w: 72, h: 36}, state: 'alwaysOn', pip: 'inside-top-right'},
          {key: 'q', shape: 'square', rel: {x: 176, y: 16, w: 64, h: 64}, state: 'off', badge: 'q', pip: false},
        ],
      },
    },
    {id: 'flash', type: 'spiFlash', rect: {x: 914, y: 470, w: 46, h: 28}, props: QUIET},
    {id: 'vrm', type: 'vrmStandby', rect: {x: 664, y: 700, w: 36, h: 26}},
    {id: 'atx24', type: 'atx24', rect: {x: 620, y: 734, w: 132, h: 26}},
    {id: 'fpHeader', type: 'fpHeader', rect: {x: 985, y: 736, w: 50, h: 24}},
    {id: 'psu', type: 'psu', rect: {x: 400, y: 800, w: 480, h: 116}, props: {rocker: 'I', ...QUIET}},
    {id: 'plug', type: 'iecPlug', rect: {x: 346, y: 818, w: 36, h: 36}, props: {seated: 1}},
    {id: 'cord', type: 'cord', rect: {x: 304, y: 832, w: 42, h: 8}, props: {points: [[304, 836], [346, 836]], seated: 1}},
    {id: 'socket', type: 'wallSocket', rect: {x: 240, y: 790, w: 64, h: 104}},
    {id: 'front', type: 'frontPanel', rect: {x: 940, y: 800, w: 140, h: 116}},
    {id: 'button', type: 'powerButton', rect: {x: 974, y: 830, w: 72, h: 72}, order: 30},
    {id: 'led', type: 'led', rect: {x: 1055, y: 813, w: 10, h: 10}, order: 31},
    {id: 'monitor', type: 'monitor', rect: {x: 1490, y: 190, w: 280, h: 170}, depth: 0.9, props: QUIET},
  ],
  routes: [
    // the button's lead (cable, 0–70: cap → header bottom, end tick at 70), then the board trace to the lookout's in2
    {id: 'pwrbtn', points: [[1010, 830], [1010, 748], [1010, 712], [716, 712], [716, 666]], cable: [0, 70], endTickAt: 70},
    // S11 wake routes (hidden until drawn): network jack → LAN chip → lookout; RTC clock → lookout
    {id: 'wakeNet', points: [[566, 441], [600, 441]], hidden: true},
    {id: 'wakeNet2', points: [[617, 454], [617, 648], [660, 648]], hidden: true},
    // round 1: the clock badge sits outside the chipset (judges: inside it, drawn bigger than the lookout, it read as a
    // new part); its route enters the lookout's left side 12 px below the network's
    {id: 'wakeClock', points: [[580, 549], [580, 660], [660, 660]], hidden: true},
  ],
  channels: [
    {id: 'standby', points: [[676, 800], [676, 666]], kind: 'standby', initial: 'full'},
    {id: 'main', points: [[730, 800], [730, 760]], kind: 'main', initial: 'empty'},
  ],
  domains: [
    {
      id: 'standbyDomain',
      polygon: [[650, 620], [744, 620], [744, 678], [708, 678], [708, 762], [652, 762], [652, 678], [650, 678]],
      // round 1: the soft wash follows the standby-powered parts (the lookout, its standby line, the regulator)
      blobs: [
        {x: 650, y: 620, w: 92, h: 56, r: 14},
        {x: 663, y: 660, w: 26, h: 104, r: 12},
        {x: 654, y: 692, w: 56, h: 42, r: 12},
      ],
      // round 2 (judges: the lookout "turned amber" in S11, a second look for the same awake block): the wash leaves the
      // lookout untinted, and the region gets its own dashed outline
      holes: [{x: 656, y: 626, w: 80, h: 44, r: 8}],
      outline: true,
    },
  ],
  proofOfPower: {subject: 'chipset.block:lookout.center', proof: 'plug.face'},
};
