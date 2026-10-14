/**
 * Engine test compositions (verification beds, not the intro):
 *   EngineTestPanels  the "later" window (contract, double rule, dimmed grid, time breath), the triptych what-if split
 *                     with band-scoped divergence (plug pulled, rocker flipped, drains, the lookout going dark), and a
 *                     pairRight stop plate whose content is a scene tween (Intel → AMD-style package).
 *   EngineTestGlyphs  eye badge, "?" fill (subject), brackets, hidden wake routes drawn and settled, wake glyphs,
 *                     command chips, the fork (room plane), the ≈ arc, the sign-in card (room plane), the scope line.
 */
import React from 'react';
import {Atlas} from '../Atlas';
import {buildScript, cam, point, prop, flipTo} from '../timeline/script';
import type {SceneSpec, WorldSpec} from '../world/types';
import {DEMO_SHOTS, DEMO_WORLD} from './world';

const SHOTS = {...DEMO_SHOTS, column: {center: [524, 760] as const, zoom: 1.22}, ask: {center: [980, 581] as const, zoom: 1.15}, monitor: {center: [1560, 360] as const, zoom: 1.5}};

/** The demo world with standby live from the start, and two hidden wake routes. */
export const TEST_WORLD: WorldSpec = {
  ...DEMO_WORLD,
  id: 'test-intel-atx',
  channels: DEMO_WORLD.channels.map((c) => (c.id === 'standby' ? {...c, initial: 'full' as const} : c)),
  routes: [
    ...DEMO_WORLD.routes,
    {id: 'wakeNet', points: [[617, 454], [617, 648], [660, 648]], hidden: true},
    {id: 'wakeClock', points: [[680, 566], [680, 630]], hidden: true},
  ],
};

/* ------------------------------------------------------------------------------------------------
 * Panels: window, triptych, tween plate
 * ---------------------------------------------------------------------------------------------- */

const INTEL: SceneSpec = {
  id: 'intel',
  bounds: {x: 0, y: 0, w: 600, h: 280},
  parts: [
    {id: 'pkg', type: 'cpuLga', rect: {x: 10, y: 10, w: 260, h: 260}},
    {id: 'chipset', type: 'chipset', rect: {x: 320, y: 45, w: 260, h: 190}},
    {id: 'lookout', type: 'logicBlock', rect: {x: 340, y: 175, w: 72, h: 36}, initial: 'alwaysOn', order: 20},
    {id: 'q', type: 'logicBlock', rect: {x: 496, y: 61, w: 64, h: 64}, initial: 'off', props: {shape: 'square', badge: 'q'}, order: 20},
  ],
};
const AMD: SceneSpec = {
  id: 'amd',
  bounds: {x: 0, y: 0, w: 600, h: 280},
  parts: [
    {id: 'pkg2', type: 'amdPackage', rect: {x: 10, y: 10, w: 260, h: 260}},
    {id: 'chipset', type: 'chipset', rect: {x: 320, y: 45, w: 260, h: 190}, props: {xray: 0}},
    {id: 'lookout', type: 'logicBlock', rect: {x: 150, y: 50, w: 72, h: 36}, initial: 'alwaysOn', order: 20},
    {id: 'q', type: 'logicBlock', rect: {x: 154, y: 150, w: 64, h: 64}, initial: 'off', props: {shape: 'square', badge: 'q'}, order: 20},
  ],
};

export const PANELS_FRAMES = 240;

const PANELS_SCRIPT = buildScript(
  {
    camera: {
      start: 'board',
      reference: 'atlas',
      shots: SHOTS,
      keys: [cam('column', {at: 42, dur: 36, ease: 'glide'}), cam('atlas', {at: 146, dur: 44, ease: 'move'})],
    },
    windows: [{at: 2, expandAt: 40}],
    chip: [
      {at: 2, text: 'After the press', size: 'active', underline: 'double'},
      {at: 40, text: 'Soft-off', size: 'active', underline: 'single'},
      {at: 80, text: 'Soft-off', size: 'rest', underline: 'single'},
      {at: 180, text: 'Intel desktop', size: 'active', underline: 'single'},
    ],
    states: [flipTo('chipset', 'on', 10, {block: 'q'}), flipTo('chipset', 'off', 40, {block: 'q'})],
    splits: [
      {
        kind: 'triptych',
        at: 80,
        foldAt: 140,
        bands: [
          {
            side: 'left',
            caption: {text: 'Unplugged', at: 94},
            props: [prop('plug', 'seated', 94, 6, 1, 0, {ease: 'move'})],
            channels: [{channel: 'standby', kind: 'drain', at: 100}],
            states: [flipTo('chipset', 'off', 108, {block: 'lookout'})],
          },
          {
            side: 'right',
            caption: {text: 'Rear switch off', at: 112},
            props: [prop('psu', 'rocker', 112, 3, 'I', 'O')],
            channels: [{channel: 'standby', kind: 'drain', at: 116}],
            states: [flipTo('chipset', 'off', 124, {block: 'lookout'})],
          },
        ],
      },
    ],
    channels: [{channel: 'standby', kind: 'shimmer', at: 84, to: 140}],
    plates: [
      {
        id: 'amd',
        slot: {layout: 'pairRight', index: 0},
        source: 'cpu',
        content: {kind: 'tween', from: INTEL, to: AMD, shot: {center: [295, 140], zoom: 0.95}, at: 196, dur: 16},
        rule: 'held',
        peelAt: 178,
        returnAt: 226,
        caption: {text: 'Stop: AMD', at: 194, place: 'top', exitAt: 222},
        active: [{at: 194, on: true}],
      },
    ],
    glow: [{at: 0, holder: 'chipset.lookout'}],
    lastFrame: PANELS_FRAMES - 1,
  },
  TEST_WORLD,
);

export const EngineTestPanels: React.FC = () => <Atlas world={TEST_WORLD} script={PANELS_SCRIPT} />;

/* ------------------------------------------------------------------------------------------------
 * Glyphs
 * ---------------------------------------------------------------------------------------------- */

export const GLYPHS_FRAMES = 210;

const GLYPHS_SCRIPT = buildScript(
  {
    camera: {
      start: 'board',
      reference: 'atlas',
      shots: SHOTS,
      keys: [cam('ask', {at: 86, dur: 34, ease: 'move'}), cam('monitor', {at: 148, dur: 52, ease: 'move'})],
    },
    glyphs: [
      {kind: 'eye', anchor: 'chipset.block:lookout.top', block: 'lookout', drawAt: 6, outAt: 80},
      {kind: 'qFill', part: 'chipset', block: 'q', at: 20, outAt: 38, size: 'subject'},
      {kind: 'brackets', part: 'button', lockAt: 50, fadeAt: 72},
      {kind: 'wake', glyph: 'netJack', anchor: 'rearIo.rj45', at: 60, outAt: 110, pointed: true},
      {kind: 'wake', glyph: 'clock', anchor: [680, 548], at: 64, outAt: 110, pointed: true},
      {kind: 'command', text: 'Restart', glyph: 'restart', screen: [820, 760], word: 'W0010', land: 196, exitAt: 209},
      {kind: 'command', text: 'Shut down', glyph: 'power', screen: [1180, 760], word: 'W0010', land: 200, exitAt: 209},
      {kind: 'fork', from: 'monitor.foot', node: [1630, 472], branches: [[1504, 500], [1756, 500]], drawAt: [186, 192, 196], outAt: 209},
      {kind: 'arc', from: 'button.top', to: [1520, 470], drawAt: 122, dur: 24, chipAt: 134, outAt: 150},
      {kind: 'card', rect: {x: 1490, y: 445, w: 213, h: 133}, drawAt: 130, contentAt: 138, outAt: 150},
      {kind: 'scopeLine', rects: [{x: 330, y: 112, w: 1130, h: 816}], drawAt: 92, dur: 24, outAt: 120},
    ],
    routes: [
      {route: 'wakeNet', kind: 'draw', at: 60},
      {route: 'wakeClock', kind: 'draw', at: 64},
      {route: 'pwrbtn', kind: 'point', at: 60, to: 84},
      {route: 'wakeNet', kind: 'settle', at: 84},
      {route: 'wakeClock', kind: 'settle', at: 84},
    ],
    props: [...point('cpu', 30, 60)],
    readouts: [{id: 'zero', value: '0', unit: 'instructions', slot: [180, 360], word: 'W0017', exitAt: 209}],
    glow: [{at: 0, holder: 'chipset.lookout'}],
    lastFrame: GLYPHS_FRAMES - 1,
  },
  TEST_WORLD,
);

export const EngineTestGlyphs: React.FC = () => <Atlas world={TEST_WORLD} script={GLYPHS_SCRIPT} />;
