/**
 * EngineDemo script (300 frames, the first ten seconds of the Ep01 narration's timing): every frame comes from word
 * IDs or from frames derived from them. It exercises the living field through a carry and a pull (parallax), keyed
 * tags in and out, a pill, the chip, the standby fill-front, shimmer and wash, the cable ink and end tick, a plate row
 * peeled from its parts with the Bit crossing two gutters through ports, the Lens iris and a Lens dive.
 */
import {buildScript, cam, bit, flipTo, point, press, tag, pill, type ScriptInput} from '../timeline/script';
import {w} from '../timeline/words';
import {SPLIT} from '../tokens';
import type {SRect} from '../core/types';
import {CPU_SCENE, DEMO_SHOTS, DEMO_WORLD} from './world';

export const DEMO_FRAMES = 300;

/** Three plates in a row: 452 × 392, gutters 24, centred; content in the top 264 px, the rail through its centre. */
const PW = 452;
const PG = SPLIT.row6.gutter;
const PX0 = Math.round((1920 - (3 * PW + 2 * PG)) / 2);
const PY = 300;
const slot = (i: number): SRect => ({x: PX0 + i * (PW + PG), y: PY, w: PW, h: 392});
const RAIL_Y = PY + 132;
const STOPS = [0, 1, 2].map((i) => PX0 + i * (PW + PG) + PW / 2);

const PEEL = 150;
const RETURN = 228;

const input: ScriptInput = {
  camera: {
    start: 'board',
    reference: 'atlas',
    shots: DEMO_SHOTS,
    keys: [
      // K1: carry with the Bit (timing derived from its run: depart − 2, run + 2 + 12)
      cam('power', {ease: 'carry', carry: 'ff', anchor: [716, 680]}),
      // K2: pull back for the plates and the Lens
      cam('board', {at: 146, dur: 32, ease: 'move'}),
    ],
  },
  states: [flipTo('chipset', 'on', 284, {block: 'q'})],
  props: [...press('button', w('W0001')), ...point('cpu', w('W0008'), 127)],
  bits: [
    bit('ff', {scope: 'world', kind: 'preview', hops: [{route: 'pwrbtn', depart: 33, land: w('W0006')}]}),
    bit('chain', {
      scope: {row: 'chain'},
      kind: 'preview',
      restFrom: 172,
      park: true,
      fadeAt: RETURN,
      hops: [
        {route: {row: 'chain', from: 0, to: 1}, depart: 178, land: 197},
        {route: {row: 'chain', from: 1, to: 2}, depart: 205, land: 224},
      ],
    }),
  ],
  routes: [{route: 'pwrbtn', kind: 'ink', at: 100, to: 138, range: 'cable'}],
  channels: [
    {channel: 'standby', kind: 'fill', at: 62, speed: 20},
    {channel: 'standby', kind: 'shimmer', at: 70, to: 236},
    {channel: 'main', kind: 'point', at: w('W0010'), to: 138},
  ],
  washes: [{domain: 'standbyDomain', at: 104, outAt: 236}],
  tags: [
    tag('powerButton', 'Power button', {
      role: 'part',
      anchor: 'button.right',
      slot: {board: [1220, 760], power: [1440, 640]},
      word: 'W0004',
      exitAt: 'hold',
    }),
    tag('lookout', 'Always-on\nlogic', {
      role: 'part',
      anchor: 'chipset.block:lookout.left',
      slot: {board: [330, 520], power: [300, 330]},
      side: 'left',
      word: 'W0006',
      exitAt: 'hold',
    }),
    tag('hidden', 'Hidden\nprocessor?', {
      role: 'part',
      anchor: 'chipset.block:q.right',
      slot: [1240, 420],
      word: 'W0027',
      exitAt: 'hold',
    }),
    tag('standby', 'Standby power', {
      role: 'standby',
      secondary: '+5VSB · ATX',
      anchor: [676, 776],
      slot: {board: [860, 640], power: [900, 556]},
      word: 'W0008',
      exitAt: 'hold',
    }),
  ],
  pills: [pill('mainOff', 'Main rails: OFF', {part: 'psu', dock: {screen: [700, 834]}, word: 'W0010', exitAt: 'hold'})],
  chip: [
    {at: 2, text: 'After the press', size: 'active', underline: 'double'},
    {at: 137, text: 'After the press', size: 'rest', underline: 'double'},
    {at: RETURN, text: 'Soft-off', size: 'rest', underline: 'single'},
  ],
  glyphs: [
    {kind: 'endTick', route: 'pwrbtn', at: 106, outAt: 138},
    {kind: 'qAccent', part: 'chipset', block: 'q', at: 255},
    {kind: 'qAccent', part: 'chipset', block: 'q', at: 284},
  ],
  lenses: [
    {
      id: 'L1',
      center: {screen: [1440, 430]},
      d: 400,
      mode: 'magnify',
      k: 4,
      focus: 'chipset.block:q.center',
      target: 'chipset.block:q.right',
      leaderAt: 238,
      openAt: 246,
      closeAt: 600,
      chip: '×4',
      diveAt: 264,
    },
  ],
  scrims: [{at: PEEL, outAt: RETURN}],
  plates: [
    {
      id: 'p1',
      slot: slot(0),
      source: {x: 650, y: 612, w: 140, h: 76},
      content: {kind: 'world', shot: {center: [696, 648], zoom: 2.4}},
      rule: 'notNow',
      peelAt: PEEL,
      returnAt: RETURN,
      caption: {text: 'Always-on', at: 172, place: 'name', exitAt: RETURN},
      active: [
        {at: 172, on: true},
        {at: 197, on: false},
      ],
    },
    {
      id: 'p2',
      slot: slot(1),
      source: 'psu',
      content: {kind: 'world', shot: {center: [640, 790], zoom: 0.88}},
      rule: 'notNow',
      peelAt: PEEL + 3,
      returnAt: RETURN + 2,
      caption: {text: 'Power', at: 197, place: 'name', exitAt: RETURN},
      active: [
        {at: 197, on: true},
        {at: 224, on: false},
      ],
    },
    {
      id: 'p3',
      slot: slot(2),
      source: 'cpu',
      content: {kind: 'scene', scene: CPU_SCENE, shot: {center: [208, 150], zoom: 0.82}},
      rule: 'notNow',
      peelAt: PEEL + 6,
      returnAt: RETURN + 4,
      caption: {text: 'Main CPU', at: 224, place: 'name', exitAt: RETURN},
      active: [{at: 224, on: true}],
    },
  ],
  rows: [{id: 'chain', plates: ['p1', 'p2', 'p3'], rail: {y: RAIL_Y, stops: STOPS}}],
  glow: [
    {at: 0, holder: 'chipset.lookout'},
    {at: 284, holder: 'chipset.q'},
  ],
  lastFrame: DEMO_FRAMES - 1,
};

export const DEMO_SCRIPT = buildScript(input, DEMO_WORLD);
