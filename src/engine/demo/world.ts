/**
 * EngineDemo world: the Ep01 desktop layout (STORYBOARD.md §1) drawn with the engine's placeholder icons (the icon
 * library is built in parallel). A test bed, not the intro: it exists to exercise and inspect the engine.
 */
import type {Shot} from '../camera/camera';
import type {SceneSpec, WorldSpec} from '../world/types';

export const DEMO_WORLD: WorldSpec = {
  id: 'demo-intel-atx',
  seed: 'signal-atlas-demo',
  bounds: {x: 200, y: 100, w: 1600, h: 860},
  parts: [
    {id: 'case', type: 'case', rect: {x: 330, y: 112, w: 1130, h: 816}},
    {id: 'board', type: 'board', rect: {x: 560, y: 150, w: 840, h: 610}},
    {id: 'rearIo', type: 'rearIo', rect: {x: 534, y: 250, w: 38, h: 230}},
    {id: 'lan', type: 'lanChip', rect: {x: 600, y: 428, w: 34, h: 26}},
    {id: 'cpu', type: 'cpuLga', rect: {x: 650, y: 190, w: 260, h: 260}},
    {id: 'dimm1', type: 'dimm', rect: {x: 950, y: 190, w: 14, h: 260}},
    {id: 'dimm2', type: 'dimm', rect: {x: 972, y: 190, w: 14, h: 260}},
    {id: 'dimm3', type: 'dimm', rect: {x: 994, y: 190, w: 14, h: 260}},
    {id: 'dimm4', type: 'dimm', rect: {x: 1016, y: 190, w: 14, h: 260}},
    {id: 'm2', type: 'm2', rect: {x: 1080, y: 300, w: 280, h: 34}},
    {id: 'pcie', type: 'pcieSlot', rect: {x: 950, y: 560, w: 410, h: 20}},
    {
      id: 'chipset',
      type: 'chipset',
      rect: {x: 640, y: 500, w: 260, h: 190},
      props: {
        blocks: [
          {key: 'lookout', shape: 'wide', rel: {x: 20, y: 130, w: 72, h: 36}, state: 'alwaysOn', pip: 'inside-top-right'},
          {key: 'q', shape: 'square', rel: {x: 176, y: 16, w: 64, h: 64}, state: 'off', badge: 'q'},
        ],
      },
    },
    {id: 'flash', type: 'spiFlash', rect: {x: 914, y: 470, w: 46, h: 28}},
    {id: 'vrm', type: 'vrmStandby', rect: {x: 664, y: 700, w: 36, h: 26}},
    {id: 'atx24', type: 'atx24', rect: {x: 620, y: 734, w: 132, h: 26}},
    {id: 'fpHeader', type: 'fpHeader', rect: {x: 985, y: 736, w: 50, h: 24}},
    {id: 'psu', type: 'psu', rect: {x: 400, y: 800, w: 480, h: 116}, props: {rocker: 'I'}},
    {id: 'plug', type: 'iecPlug', rect: {x: 346, y: 818, w: 36, h: 36}, props: {seated: 1}},
    {id: 'cord', type: 'cord', rect: {x: 250, y: 832, w: 96, h: 8}, props: {points: [[272, 836], [346, 836]]}},
    {id: 'socket', type: 'wallSocket', rect: {x: 240, y: 790, w: 64, h: 104}},
    {id: 'front', type: 'frontPanel', rect: {x: 940, y: 800, w: 140, h: 116}},
    {id: 'button', type: 'powerButton', rect: {x: 974, y: 830, w: 72, h: 72}, order: 30},
    {id: 'led', type: 'led', rect: {x: 1055, y: 813, w: 10, h: 10}, order: 31},
    {id: 'monitor', type: 'monitor', rect: {x: 1490, y: 190, w: 280, h: 170}, depth: 0.9},
  ],
  routes: [
    {
      id: 'pwrbtn',
      points: [
        [1010, 830],
        [1010, 748],
        [1010, 712],
        [716, 712],
        [716, 666],
      ],
      cable: [0, 70],
      endTickAt: 70,
    },
  ],
  channels: [
    {id: 'standby', points: [[676, 800], [676, 666]], kind: 'standby', initial: 'empty'},
    {id: 'main', points: [[730, 800], [730, 760]], kind: 'main', initial: 'empty'},
  ],
  domains: [
    {
      id: 'standbyDomain',
      polygon: [
        [650, 620],
        [744, 620],
        [744, 678],
        [708, 678],
        [708, 762],
        [652, 762],
        [652, 678],
        [650, 678],
      ],
    },
  ],
  proofOfPower: {subject: 'chipset.block:lookout.center', proof: 'plug.face'},
};

export const DEMO_SHOTS: Record<string, Shot> = {
  board: {center: [900, 566], zoom: 1.1},
  power: {center: [780, 720], zoom: 1.42},
  atlas: {center: [1005, 525], zoom: 0.92},
};

/** A recomposed mini scene for plate 3: the CPU with its firmware flash, at the same icon sizes. */
export const CPU_SCENE: SceneSpec = {
  id: 'cpu-scene',
  bounds: {x: 0, y: 0, w: 400, h: 300},
  parts: [
    {id: 'cpu', type: 'cpuLga', rect: {x: 40, y: 20, w: 260, h: 260}},
    {id: 'flash', type: 'spiFlash', rect: {x: 330, y: 136, w: 46, h: 28}},
  ],
  routes: [{id: 'spi', points: [[300, 150], [330, 150]]}],
};
