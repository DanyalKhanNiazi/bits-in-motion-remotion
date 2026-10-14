/**
 * The cues export (ENGINE.md §15, STYLE_BIBLE §12): sound marks causes, not edits. Derived from the script:
 *   button     = rising 'press' prop events (−4 dB when a preview/demo Bit departs within 40 frames after it)
 *   land       = Bit landings (single runs 'A'; a multi-hop chain steps A-C-D-E-G; −4 dB for preview/demo Bits)
 *   lens_open  = Lens openAt; lens_close = closeAt; dive = diveAt
 *   lock       = brackets lockAt
 *   standby    = the script's explicit standby span
 * Sorted by frame; cues closer than SOUND.minCueGapFrames are reported. `script.cues.gainDb` overrides by "cue@frame".
 */
import React from 'react';
import {SOUND} from '../tokens';
import {kitWarn} from '../../shared/motion';
import type {Script} from '../timeline/script';

export type Note = 'A' | 'C' | 'D' | 'E' | 'G';
export type Cue =
  | {cue: 'button'; frame: number; gain_db?: number}
  | {cue: 'land'; frame: number; note: Note; gain_db?: number}
  | {cue: 'standby'; start: number; end: number}
  | {cue: 'lens_open' | 'lens_close' | 'dive' | 'lock' | 'energize' | 'alert'; frame: number; gain_db?: number};

export interface CueFile {
  style: 6;
  cues: Cue[];
}

const cueFrame = (c: Cue): number => (c.cue === 'standby' ? c.start : c.frame);

export const deriveCues = (script: Readonly<Script>, standby?: {start: number; end: number}): CueFile => {
  const cues: Cue[] = [];
  const over = script.cues?.gainDb ?? {};
  const gain = (name: string, frame: number, dflt?: number): number | undefined => {
    const k = `${name}@${frame}`;
    return k in over ? over[k] : dflt;
  };
  for (const e of script.props) {
    if (e.prop !== 'press' || typeof e.from !== 'number' || typeof e.to !== 'number' || e.to <= e.from) continue;
    if (e.scope && e.scope !== 'world') continue;
    const preview = script.bits.some((b) => b.kind !== 'real' && b.hops.length > 0 && b.hops[0].depart >= e.at && b.hops[0].depart <= e.at + 40);
    const g = gain('button', e.at, preview ? SOUND.previewGainDb : undefined);
    cues.push(g === undefined ? {cue: 'button', frame: e.at} : {cue: 'button', frame: e.at, gain_db: g});
  }
  for (const b of script.bits) {
    const quiet = b.kind === 'preview' || b.kind === 'demo';
    b.hops.forEach((h, i) => {
      const note: Note = b.hops.length > 1 ? SOUND.landNotes[Math.min(i, SOUND.landNotes.length - 1)] : 'A';
      const g = gain('land', h.land, quiet ? SOUND.previewGainDb : undefined);
      // a run past the last frame never lands inside the piece
      if (script.lastFrame !== undefined && h.land > script.lastFrame) return;
      cues.push(g === undefined ? {cue: 'land', frame: h.land, note} : {cue: 'land', frame: h.land, note, gain_db: g});
    });
  }
  for (const l of script.lenses) {
    cues.push({cue: 'lens_open', frame: l.openAt});
    if (l.diveAt !== undefined) cues.push({cue: 'dive', frame: l.diveAt});
    if (l.diveAt === undefined || l.closeAt < l.diveAt) cues.push({cue: 'lens_close', frame: l.closeAt});
  }
  for (const g of script.glyphs) if (g.kind === 'brackets') cues.push({cue: 'lock', frame: g.lockAt});
  const sb = standby ?? script.standby;
  if (sb) cues.push({cue: 'standby', start: sb.start, end: sb.end});
  cues.sort((a, b) => cueFrame(a) - cueFrame(b));
  const point = cues.filter((c) => c.cue !== 'standby');
  for (let i = 1; i < point.length; i++) {
    const d = cueFrame(point[i]) - cueFrame(point[i - 1]);
    if (d < SOUND.minCueGapFrames) kitWarn(`cues: ${point[i - 1].cue}@${cueFrame(point[i - 1])} and ${point[i].cue}@${cueFrame(point[i])} are ${d} frames apart (min ${SOUND.minCueGapFrames})`);
  }
  return {style: 6, cues};
};

const key = (c: Cue): string => JSON.stringify(c, Object.keys(c).sort());

/** Compares a cues.json with the derived list; kitWarn for every difference (so they can never drift). */
export const checkCues = (file: CueFile, script: Readonly<Script>): string[] => {
  const derived = deriveCues(script);
  const a = new Set(file.cues.map(key));
  const b = new Set(derived.cues.map(key));
  const lines: string[] = [];
  for (const c of file.cues) if (!b.has(key(c))) lines.push(`cues.json has ${key(c)} but the script derives no such cue`);
  for (const c of derived.cues) if (!a.has(key(c))) lines.push(`the script derives ${key(c)} but cues.json lacks it`);
  for (const l of lines) kitWarn(`cues: ${l}`);
  return lines;
};

/** A 1-frame composition body that logs the derived cue list as JSON (register it as e.g. 'SignalAtlasCues'). */
export const CuesDump: React.FC<{script: Readonly<Script>}> = ({script}) => {
  const json = JSON.stringify(deriveCues(script), null, 2);
  // eslint-disable-next-line no-console
  console.log(`[kit] cues ${json}`);
  return React.createElement('pre', {style: {color: '#F3F2EE', fontSize: 18, padding: 40, background: '#0F1729', width: 1920, height: 1080, margin: 0}}, json);
};
