/**
 * Ep06 kit: <Archive> story state. A named preset (ARCHIVE_STATES) plus every event with `at ≤ frame` gives the state
 * at a frame; this file turns (preset, events, frame) into per-box records the renderer draws. Pure.
 *
 * Gating: `pour`, `build` and `threads` events HIDE their result until their `at` (so HDD_SAVED + a pour at f shows
 * empty photo boxes before f). Every other op only acts once `at ≤ frame`.
 */
import {COLS, GEOM, HEADER, KEEP_EMPTY, N_BOXES, PHOTO, PITCH, RUNS, boxC, colOf, groupIds, isOther, rowOf} from './geom';
import type {ArchiveLight} from '../envs';

export type Content = 'empty' | 'photo' | 'other' | 'old' | 'erased';
export type ArchiveOp =
  | 'build'
  | 'pour'
  | 'threads'
  | 'strike'
  | 'flag'
  | 'reuse'
  | 'mapFlip'
  | 'readPulse'
  | 'scan'
  | 'copyOut'
  | 'overwrite'
  | 'trim'
  | 'tag'
  | 'sweep'
  | 'refuse'
  | 'splitLayers'
  | 'remap'
  | 'sanitize'
  | 'scramble'
  | 'unscramble'
  | 'boundary';
/** 'photo' · 'free' (boxes Windows calls free: empty or flagged available) · 'all' · 'others' · 'run1'..'run3' · box id(s);
 *  build also takes 'wall' · 'drawer' · 'map' · 'card' */
export type ArchiveTarget = 'photo' | 'free' | 'all' | 'others' | 'run1' | 'run2' | 'run3' | 'wall' | 'drawer' | 'map' | 'card' | number | readonly number[];
export type ArchiveEvent = {
  at: number;
  op: ArchiveOp;
  target?: ArchiveTarget;
  dur?: number;
  /** copyOut: where the copied Bits fly (world px; default above the wall's top-right). trim: where the note stops. */
  to?: {x: number; y: number};
};
export type ArchiveMode = 'hdd' | 'ssd';
export type ArchiveLayers = 'single' | 'split';
export type PresetName =
  | 'HDD_SAVED'
  | 'HDD_DELETED'
  | 'HDD_REUSED'
  | 'HDD_RACE_LOST'
  | 'HDD_WIPED'
  | 'SSD_SAVED'
  | 'SSD_DELETED'
  | 'SSD_TRIMMED'
  | 'SSD_ERASED'
  | 'SSD_STALE'
  | 'SSD_SANITIZED'
  | 'SSD_ENCRYPTED';
export type Preset = {mode: ArchiveMode; layers: ArchiveLayers; light: ArchiveLight; events: readonly ArchiveEvent[]; note: string};

/* ---------------------------------------------------------------- presets (DIRECTION §2.3) */
const T0 = -100000;
const E = (op: ArchiveOp, target?: ArchiveTarget): ArchiveEvent => ({at: T0, op, target, dur: 1});
const DELETED = [E('strike'), E('flag'), E('mapFlip', 'photo')];
export const ARCHIVE_STATES: Record<PresetName, Preset> = {
  HDD_SAVED: {mode: 'hdd', layers: 'single', light: 'warm', events: [], note: 'card active, threads solid, 9 boxes cyan'},
  HDD_DELETED: {mode: 'hdd', layers: 'single', light: 'cool', events: DELETED, note: 'card struck + unused tab, threads dashed, map cells hollow, boxes available, Bits lit'},
  HDD_REUSED: {mode: 'hdd', layers: 'single', light: 'cool', events: [...DELETED, E('reuse')], note: 'card reused, no threads, Bits lit'},
  HDD_RACE_LOST: {mode: 'hdd', layers: 'single', light: 'scan', events: [...DELETED, E('reuse'), E('overwrite', [22, 59, 99])], note: '022, 059, 099 overwritten'},
  HDD_WIPED: {mode: 'hdd', layers: 'single', light: 'cool', events: [...DELETED, E('overwrite', 'free')], note: 'every free box overwritten, no cyan'},
  SSD_SAVED: {mode: 'ssd', layers: 'single', light: 'ssd', events: [], note: 'as HDD_SAVED, ssd mode'},
  SSD_DELETED: {mode: 'ssd', layers: 'single', light: 'ssd', events: DELETED, note: 'as HDD_DELETED, ssd mode'},
  SSD_TRIMMED: {mode: 'ssd', layers: 'single', light: 'ssd', events: [...DELETED, E('tag', 'photo')], note: 'photo boxes tagged disposable'},
  SSD_ERASED: {mode: 'ssd', layers: 'single', light: 'ssd', events: [...DELETED, E('tag', 'photo'), E('sweep', 'photo')], note: 'photo boxes erased'},
  SSD_STALE: {mode: 'ssd', layers: 'split', light: 'ssd', events: [...DELETED, E('remap', 'photo')], note: 'layers split; labels remapped to fresh grey spots; 9 old spots still cyan (2 in spare)'},
  SSD_SANITIZED: {mode: 'ssd', layers: 'split', light: 'ssd', events: [...DELETED, E('remap', 'photo'), E('sanitize')], note: 'everything erased, spare included'},
  SSD_ENCRYPTED: {mode: 'ssd', layers: 'split', light: 'ssd', events: [...DELETED, E('remap', 'photo'), E('scramble', 'all')], note: 'the stale layout as glyphs from the save on'},
};
export const PRESET_NAMES = Object.keys(ARCHIVE_STATES) as PresetName[];

/* ---------------------------------------------------------------- resolved records */
export const NEVER = 1e9;
export type Fx = {k: 'refuse' | 'scan' | 'read' | 'copy' | 'hopIn' | 'hopOut' | 'flash'; at: number; dur: number; from?: number};
export type Lab = {
  id: number;
  c: Content;
  prev: Content;
  /** frame the current content arrived, and how */
  cAt: number;
  how: 'pour' | 'overwrite' | 'erase' | 'hop' | 'remap' | 'sanitize' | 'move' | 'none';
  /** available flag (dashed outline + hollow dot; map cell hollow): on at `avail`, off at `availOff` */
  avail: number;
  availOff: number;
  /** disposable amber tag */
  tag: number;
  tagOff: number;
  /** SSD: when this label was pointed at a fresh spot; what the old spot still holds (stale) */
  remapAt: number;
  stale: Content;
  staleOff: number;
  /** scrambled glyphs on/off */
  scr: number;
  scrOff: number;
  /** box assembles at this frame (−NEVER = built; NEVER = not built yet) */
  build: number;
  fx: Fx[];
};
/** one housekeeping pass: a full-height amber band travelling x0 → x1 over [at, at + dur]; `kept` = untargeted photo boxes it passes over */
export type SweepFx = {at: number; dur: number; x0: number; x1: number; kept: number[]};
export type Resolved = {
  mode: ArchiveMode;
  layers: ArchiveLayers;
  light: ArchiveLight;
  labs: Lab[]; // index = id (0 unused)
  card: {strike: number; flag: number; reuse: number; threads: number; threadsDur: number; build: number};
  drawerBuild: number;
  mapBuild: number;
  wallBuild: number;
  reads: Array<{at: number; dur: number}>;
  scans: Array<{at: number; dur: number; ids: number[]}>;
  copies: Array<{at: number; dur: number; ids: number[]; to: {x: number; y: number}}>;
  sweeps: SweepFx[];
  sanitize: {at: number; dur: number} | null;
  trim: {at: number; dur: number; to: {x: number; y: number}} | null;
  boundary: number;
  split: {at: number; dur: number} | null;
  scrAll: {on: number; off: number};
  /** the drive actor is busy (sweep / sanitize / remap) around these windows */
  actorBusy: Array<{at: number; dur: number}>;
};

const ALL_IDS = Array.from({length: N_BOXES}, (_, i) => i + 1);
const isFreeNow = (l: Lab, f: number): boolean => l.c === 'empty' || l.c === 'erased' || (l.avail <= f && l.availOff > f);

export const resolveTarget = (t: ArchiveTarget | undefined, labs: Lab[], f: number, dflt: 'photo' | 'all' = 'photo'): number[] => {
  const tt = t ?? dflt;
  if (typeof tt === 'number') return [tt];
  if (Array.isArray(tt)) return [...tt];
  switch (tt) {
    case 'photo':
      return [...PHOTO];
    case 'all':
    case 'wall':
      return [...ALL_IDS];
    case 'others':
      return ALL_IDS.filter((id) => labs[id].c === 'other');
    case 'free':
      return ALL_IDS.filter((id) => isFreeNow(labs[id], f));
    case 'run1':
      return [...RUNS[0]];
    case 'run2':
      return [...RUNS[1]];
    case 'run3':
      return [...RUNS[2]];
    default:
      return [];
  }
};
/** start frame of item i of n spread over [at, at + dur − len] */
const stag = (at: number, dur: number, i: number, n: number, len: number): number => (n <= 1 ? at : at + Math.round((i * Math.max(0, dur - len)) / (n - 1)));
const waveOrder = (ids: number[]): number[] => [...ids].sort((a, b) => colOf(a) - colOf(b) || rowOf(a) - rowOf(b));

export const DUR: Record<ArchiveOp, number> = {
  build: 40,
  pour: 36,
  threads: 18,
  strike: 10,
  flag: 10,
  reuse: 14,
  mapFlip: 16,
  readPulse: 30,
  scan: 45,
  copyOut: 30,
  overwrite: 12,
  trim: 30,
  tag: 12,
  sweep: 36,
  refuse: 20,
  splitLayers: 36,
  remap: 18,
  sanitize: 40,
  scramble: 8,
  unscramble: 8,
  boundary: 16,
};

export const resolveArchive = (
  p: {state?: PresetName; mode?: ArchiveMode; layers?: ArchiveLayers; light?: ArchiveLight; events?: readonly ArchiveEvent[]; boxes?: Readonly<Record<number, Content>>},
  frame: number,
): Resolved => {
  const pre = ARCHIVE_STATES[p.state ?? 'HDD_SAVED'];
  const mode = p.mode ?? pre.mode;
  const labs: Lab[] = [];
  for (let id = 0; id <= N_BOXES; id++) {
    const c: Content = id === 0 ? 'empty' : PHOTO.includes(id) ? 'photo' : isOther(id) ? 'other' : 'empty';
    labs.push({id, c: p.boxes?.[id] ?? c, prev: 'empty', cAt: -NEVER, how: 'none', avail: NEVER, availOff: NEVER, tag: NEVER, tagOff: NEVER, remapAt: NEVER, stale: 'empty', staleOff: NEVER, scr: NEVER, scrOff: NEVER, build: -NEVER, fx: []});
  }
  const R: Resolved = {
    mode,
    layers: p.layers ?? pre.layers,
    light: p.light ?? (mode !== pre.mode ? (mode === 'ssd' ? 'ssd' : 'warm') : pre.light),
    labs,
    card: {strike: NEVER, flag: NEVER, reuse: NEVER, threads: -NEVER, threadsDur: 18, build: -NEVER},
    drawerBuild: -NEVER,
    mapBuild: -NEVER,
    wallBuild: -NEVER,
    reads: [],
    scans: [],
    copies: [],
    sweeps: [],
    sanitize: null,
    trim: null,
    boundary: NEVER,
    split: R0split(p.layers ?? pre.layers),
    scrAll: {on: NEVER, off: NEVER},
    actorBusy: [],
  };
  const user = [...(p.events ?? [])].sort((a, b) => a.at - b.at);
  // gating: pour / build / threads hide their result until their at
  for (const ev of user) {
    const dur = ev.dur ?? DUR[ev.op];
    if (ev.op === 'pour') {
      const ids = resolveTarget(ev.target, labs, frame);
      for (const id of ids) {
        labs[id].c = 'empty';
        labs[id].cAt = -NEVER;
      }
    } else if (ev.op === 'build') {
      const t = ev.target ?? 'all';
      if (t === 'drawer' || t === 'all') R.drawerBuild = ev.at;
      if (t === 'map' || t === 'all') R.mapBuild = ev.at + (t === 'all' ? Math.round(dur * 0.5) : 0);
      if (t === 'card' || t === 'all' || t === 'drawer') R.card.build = ev.at + (t === 'card' ? 0 : Math.round(dur * 0.6));
      if (t !== 'drawer' && t !== 'map' && t !== 'card') {
        const ids = resolveTarget(t === 'all' ? 'wall' : t, labs, frame);
        R.wallBuild = ev.at;
        // rows thunk in from the top, each row left → right
        ids.forEach((id) => {
          labs[id].build = ev.at + Math.round(((rowOf(id) * 0.62 + colOf(id) * 0.08) / (8 * 0.62 + 15 * 0.08)) * Math.max(0, dur - 10));
        });
      }
    } else if (ev.op === 'threads') {
      R.card.threads = ev.at;
      R.card.threadsDur = dur;
    }
  }
  const events = [...pre.events, ...user.filter((e) => e.at <= frame)];
  for (const ev of events) applyEvent(R, ev, frame, mode);
  return R;
};
function R0split(layers: ArchiveLayers): {at: number; dur: number} | null {
  return layers === 'split' ? {at: -NEVER, dur: 1} : null;
}

const setContent = (l: Lab, c: Content, at: number, how: Lab['how']) => {
  l.prev = l.c;
  l.c = c;
  l.cAt = at;
  l.how = how;
};

const applyEvent = (R: Resolved, ev: ArchiveEvent, frame: number, mode: ArchiveMode) => {
  const labs = R.labs;
  const dur = ev.dur ?? DUR[ev.op];
  const at = ev.at;
  switch (ev.op) {
    case 'pour': {
      // run by run, each box 3 f after the last
      const ids = resolveTarget(ev.target, labs, frame);
      ids.forEach((id, i) => {
        const run = RUNS.findIndex((r) => r.includes(id));
        const k = run >= 0 ? run * Math.round(dur / 3) + RUNS[run].indexOf(id) * 3 : stag(at, dur, i, ids.length, 12) - at;
        setContent(labs[id], 'photo', at + k, 'pour');
      });
      break;
    }
    case 'build':
    case 'threads':
      break; // handled by gating
    case 'strike':
      R.card.strike = at;
      break;
    case 'flag':
      R.card.flag = at;
      break;
    case 'reuse':
      R.card.reuse = at;
      break;
    case 'mapFlip': {
      const ids = resolveTarget(ev.target, labs, frame);
      ids.forEach((id, i) => {
        labs[id].avail = stag(at, dur, i, ids.length, 8);
        labs[id].availOff = NEVER;
      });
      break;
    }
    case 'readPulse':
      R.reads.push({at, dur});
      break;
    case 'scan':
      R.scans.push({at, dur, ids: resolveTarget(ev.target, labs, frame, 'all')});
      break;
    case 'copyOut':
      R.copies.push({at, dur, ids: resolveTarget(ev.target, labs, frame), to: ev.to ?? {x: GEOM.wall.x + GEOM.wall.w + 40, y: GEOM.wall.y - 160}});
      break;
    case 'overwrite':
    case 'remap': {
      const ids0 = resolveTarget(ev.target, labs, frame);
      const ids = ev.target === 'free' ? waveOrder(ids0) : ids0;
      const len = ev.op === 'overwrite' ? 12 : 16;
      ids.forEach((id, i) => {
        const l = labs[id];
        const t = stag(at, dur, i, ids.length, len);
        const ssd = mode === 'ssd';
        if (ev.op === 'overwrite' && !ssd) {
          setContent(l, 'old', t, 'overwrite');
        } else if (l.c === 'other' && ev.op === 'remap') {
          // housekeeping moves another file's data to a fresh spot (the label follows; Windows sees no change)
          l.remapAt = t;
          l.stale = 'empty';
          l.how = 'move';
        } else {
          // SSD: the write is accepted but lands in a fresh spot; the old spot keeps what it held (stale)
          l.stale = l.c === 'erased' ? 'erased' : l.c;
          l.staleOff = NEVER;
          l.remapAt = t;
          setContent(l, 'old', t, ev.op === 'overwrite' ? 'overwrite' : 'remap');
        }
        l.availOff = Math.min(l.availOff, t + 6);
        l.tagOff = Math.min(l.tagOff, t);
      });
      if (mode === 'ssd') R.actorBusy.push({at, dur});
      break;
    }
    case 'trim':
      R.trim = {at, dur, to: ev.to ?? {x: boxC(PHOTO[0]).x - 70, y: boxC(PHOTO[0]).y - 10}};
      break;
    case 'tag': {
      const ids = resolveTarget(ev.target, labs, frame);
      ids.forEach((id, i) => {
        labs[id].tag = stag(at, dur, i, ids.length, 8);
        labs[id].tagOff = NEVER;
      });
      break;
    }
    case 'sweep': {
      // ONE continuous amber band crosses the wall from the drive's side (left) over `dur`; each targeted erase group
      // clears as the band reaches it (still-wanted white Bits hop to a fresh box just before); untargeted groups
      // holding the photo survive the pass
      const tgt = resolveTarget(ev.target, labs, frame);
      const groups: number[][] = [];
      const seen = new Set<string>();
      for (const id of [...tgt].sort((x, y) => x - y)) {
        const g = groupIds(id);
        const key = g.join(',');
        if (!seen.has(key)) {
          seen.add(key);
          groups.push(g);
        }
      }
      const inSwept = new Set(groups.flat());
      const x0 = GEOM.wall.x - 90;
      const x1 = GEOM.wall.x + COLS * PITCH + 90;
      const tAtX = (x: number) => at + Math.round((dur * (x - x0)) / (x1 - x0));
      const kept: number[] = [];
      for (const g of groups) {
        const hasPhoto = g.some((id) => labs[id].c === 'photo');
        const photoTargeted = g.some((id) => labs[id].c === 'photo' && tgt.includes(id));
        if (hasPhoto && !photoTargeted) {
          kept.push(...g.filter((id) => labs[id].c === 'photo'));
          continue;
        }
        const tg = tAtX(boxC(g[0]).x);
        let hopT = Math.max(at, tg - 16);
        let lastHop = -NEVER;
        for (const id of g) {
          if (labs[id].c !== 'other') continue;
          const dest = nearestEmpty(labs, id, inSwept);
          if (dest > 0) {
            setContent(labs[dest], 'other', hopT + 12, 'hop');
            labs[dest].fx.push({k: 'hopIn', at: hopT, dur: 12, from: id});
            labs[id].fx.push({k: 'hopOut', at: hopT, dur: 12});
            lastHop = hopT + 13;
            hopT += 2;
          }
        }
        for (const id of g) {
          const te = Math.max(tAtX(boxC(id).x), lastHop);
          setContent(labs[id], 'erased', te, 'erase');
          labs[id].tagOff = Math.min(labs[id].tagOff, te);
        }
      }
      // photo boxes in untargeted groups the band passes over: kept (they shimmer)
      for (const id of PHOTO) if (!inSwept.has(id) && labs[id].c === 'photo' && !kept.includes(id)) kept.push(id);
      R.sweeps.push({at, dur, x0, x1, kept});
      R.actorBusy.push({at: at - 6, dur: dur + 24});
      break;
    }
    case 'refuse': {
      for (const id of resolveTarget(ev.target, labs, frame)) labs[id].fx.push({k: 'refuse', at, dur});
      break;
    }
    case 'splitLayers':
      R.split = {at, dur};
      R.layers = 'split';
      break;
    case 'sanitize': {
      R.sanitize = {at, dur};
      R.actorBusy.push({at, dur});
      for (let id = 1; id <= N_BOXES; id++) {
        const l = labs[id];
        const c = boxC(id);
        const d = Math.hypot(c.x - GEOM.actor.x, c.y - GEOM.actor.y);
        const t = at + Math.round((d / 1500) * dur);
        setContent(l, 'erased', t, 'sanitize');
        l.staleOff = Math.min(l.staleOff, t);
        l.tagOff = Math.min(l.tagOff, t);
        l.scrOff = Math.min(l.scrOff, t);
      }
      break;
    }
    case 'scramble': {
      const t = ev.target ?? 'all';
      const ids = resolveTarget(t, labs, frame, 'all');
      for (const id of ids) {
        labs[id].scr = at;
        labs[id].scrOff = NEVER;
      }
      if (t === 'all') R.scrAll = {on: at, off: NEVER};
      break;
    }
    case 'unscramble': {
      const t = ev.target ?? 'all';
      const ids = resolveTarget(t, labs, frame, 'all');
      for (const id of ids) labs[id].scrOff = at;
      if (t === 'all') R.scrAll.off = at;
      break;
    }
    case 'boundary':
      R.boundary = at;
      break;
  }
};

/** nearest empty box outside the swept groups (deterministic) for a hop */
const nearestEmpty = (labs: Lab[], from: number, avoid: Set<number>): number => {
  const a = boxC(from);
  let best = -1;
  let bd = Infinity;
  for (let id = 1; id <= N_BOXES; id++) {
    if (avoid.has(id) || labs[id].c !== 'empty' || PHOTO.includes(id) || KEEP_EMPTY.includes(id) || id === HEADER) continue;
    const b = boxC(id);
    const d = Math.hypot(b.x - a.x, (b.y - a.y) * 1.4);
    if (d < bd) {
      bd = d;
      best = id;
    }
  }
  return best;
};
