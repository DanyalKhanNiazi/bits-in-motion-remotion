/**
 * Dev checks (ENGINE.md §16): run once by buildScript; every problem prints through kitWarn (shown by the tools as
 * "browser warning: [kit] …"). Checks print, never crash.
 */
import {BIT2, BUDGET, CAMERA, DUR, LAYOUT, type PartState} from '../tokens';
import {kitWarn} from '../../shared/motion';
import {ANCHORS} from '../../shared/timing';
import {isPt, scopeKey} from '../core/types';
import {cameraAt, keySpans, layerCam, project, referenceShot} from '../camera/camera';
import {captionBandReport, panSpeedReport, zoomRateReport} from '../camera/checks';
import {anchorPart, partById, resolveAnchor, splitAnchor, stateAt} from '../world/states';
import type {WorldSpec} from '../world/types';
import {bitScreenSpeedReport, hopsFor} from '../signal/runs';
import {bitDraw} from '../signal/BitV2';
import {tagExit, tagLand} from '../labels/Tag2';
import {budgetReport} from '../labels/budget';
import {chipAt} from '../labels/Chip2';
import {windowAt} from '../panels/TimeWindow';
import {splitAt} from '../panels/Split';
import {plateEnd} from '../panels/peel';
import {hold, sentenceOfWord, speakingAt, w} from '../timeline/words';
import {deriveCues} from '../cues/cues';
import type {Script} from '../timeline/script';

export interface CheckReport {
  name: string;
  ok: boolean;
  lines: string[];
}

const report = (name: string, lines: string[]): CheckReport => ({name, ok: lines.length === 0, lines});
const LIT: ReadonlySet<PartState> = new Set<PartState>(['on', 'alwaysOn', 'reset', 'waiting', 'limit', 'fault']);

/** Frames worth checking: every 3rd frame plus every event frame ±1. */
export const checkFrames = (script: Readonly<Script>): number[] => {
  const last = script.lastFrame ?? 1889;
  const set = new Set<number>();
  for (let f = 0; f <= last; f += 3) set.add(f);
  const add = (v: number | undefined) => {
    if (typeof v !== 'number' || !isFinite(v)) return;
    for (const d of [-1, 0, 1]) if (v + d >= 0 && v + d <= last) set.add(Math.round(v + d));
  };
  script.tags.forEach((t) => add(tagLand(t)));
  script.bits.forEach((b) => b.hops.forEach((h) => (add(h.depart), add(h.land))));
  script.camera.keys.forEach((k) => (add(k.at), add(k.at + k.dur)));
  return [...set].sort((a, b) => a - b);
};

/* ------------------------------------------------------------------------------------------------
 * Ep01 shared anchors (A4)
 * ---------------------------------------------------------------------------------------------- */

/** Shared A4 anchors (Ep01 worlds only; other worlds pass). ±1 frame. */
export const checkAnchors = (script: Readonly<Script>, world?: WorldSpec): CheckReport => {
  const lines: string[] = [];
  if (world && !world.id.startsWith('ep01')) return report('anchors', lines);
  const near = (a: number, b: number) => Math.abs(a - b) <= 1;
  const pressAt = (f: number) => script.props.some((e) => e.prop === 'press' && typeof e.to === 'number' && e.to > (e.from as number) && near(e.at, f));
  if (!pressAt(ANCHORS.press)) lines.push(`f${ANCHORS.press}: no button press`);
  if (!pressAt(ANCHORS.realPress)) lines.push(`f${ANCHORS.realPress}: no real press`);
  const chipText = (f: number) => chipAt(f, script.chip).current?.text ?? '';
  if (chipText(ANCHORS.afterPressChipBy - 3) !== 'After the press') lines.push(`"After the press" is not in (readable) by f${ANCHORS.afterPressChipBy}`);
  if (chipText(ANCHORS.returnDoneBy) !== 'Soft-off') lines.push(`chip is not "Soft-off" at f${ANCHORS.returnDoneBy}`);
  if (chipText(ANCHORS.nowChip) !== 'Now') lines.push(`chip is not "Now" at f${ANCHORS.nowChip}`);
  const hop = (d: number, l: number) => script.bits.some((b) => b.hops.some((h) => near(h.depart, d) && near(h.land, l)));
  if (!hop(ANCHORS.ffBitDepart, ANCHORS.ffBitLand)) lines.push(`no Bit ${ANCHORS.ffBitDepart} → ${ANCHORS.ffBitLand}`);
  if (!hop(ANCHORS.s04Depart, ANCHORS.s04Land)) lines.push(`no Bit ${ANCHORS.s04Depart} → ${ANCHORS.s04Land}`);
  const ff = script.bits.find((b) => b.hops.some((h) => near(h.land, ANCHORS.ffBitLand)));
  if (ff?.park) lines.push(`the f${ANCHORS.ffBitLand} Bit parks (it must be absorbed)`);
  if (world) {
    if (stateAt(ANCHORS.notFirst, script.states, 'cpu', undefined, 'world', 'off').state !== 'off') lines.push(`f${ANCHORS.notFirst}: the CPU is not off`);
    if (stateAt(ANCHORS.qWakes + 5, script.states, 'chipset', 'q', 'world', 'off').state !== 'on') lines.push(`f${ANCHORS.qWakes}: the "?" does not wake`);
    if (stateAt(ANCHORS.returnDoneBy, script.states, 'chipset', 'q', 'world', 'off').state !== 'off') lines.push(`f${ANCHORS.returnDoneBy}: the "?" is not back off`);
    if (windowAt(ANCHORS.returnDoneBy, script.windows).t > 0) lines.push(`f${ANCHORS.returnDoneBy}: the later window is still contracted`);
  }
  if (!script.lenses.some((l) => l.settleAt !== undefined && near(l.settleAt, ANCHORS.handOverSettle))) lines.push(`no Lens settles at f${ANCHORS.handOverSettle}`);
  if (!script.glyphs.some((g) => g.kind === 'qFill' && near(g.at, ANCHORS.handOver))) lines.push(`no "?" fill at f${ANCHORS.handOver}`);
  const chain = [ANCHORS.chain1, ANCHORS.chain2, ANCHORS.chain3, ANCHORS.chain4, ANCHORS.chain5];
  const cb = script.bits.find((b) => b.hops.length === chain.length && b.hops.every((h, i) => near(h.land, chain[i])));
  if (!cb) lines.push(`no chain Bit landing on ${chain.join('/')}`);
  else if (!cb.park) lines.push('the chain Bit does not park');
  const why = script.tags.find((t) => near(tagLand(t), ANCHORS.whyDifferent));
  const whyCmd = script.glyphs.find((g) => g.kind === 'command' && near(g.land ?? w(g.word), ANCHORS.whyDifferent));
  if (!why && !whyCmd) lines.push(`nothing lands at f${ANCHORS.whyDifferent} ("Why different?")`);
  if (why && tagExit(why) < ANCHORS.whyDifferentHoldMin) lines.push(`"Why different?" exits before f${ANCHORS.whyDifferentHoldMin}`);
  if (!script.glyphs.some((g) => g.kind === 'brackets' && near(g.lockAt, ANCHORS.lock))) lines.push(`no brackets lock at f${ANCHORS.lock}`);
  const last = script.bits.find((b) => b.hops.some((h) => h.depart <= ANCHORS.lastFrame && h.land > ANCHORS.lastFrame));
  if (!last) lines.push(`no Bit still travelling at f${ANCHORS.lastFrame}`);
  for (const l of lines) kitWarn(`anchors: ${l}`);
  return report('anchors', lines);
};

/* ------------------------------------------------------------------------------------------------
 * Labels
 * ---------------------------------------------------------------------------------------------- */

export const checkTagSync = (script: Readonly<Script>): CheckReport => {
  const lines: string[] = [];
  for (const t of script.tags) {
    const land = tagLand(t);
    const word = w(t.word);
    if (Math.abs(land - word) > 3) lines.push(`tag "${t.text.replace(/\n/g, ' ')}": lands f${land}, ${land - word} frames from its word ${t.word} (f${word}); max ±3`);
    const min = hold(land, t.text, sentenceOfWord(t.word));
    const exit = tagExit(t);
    if (exit < min && !t.holdWaiver) lines.push(`tag "${t.text.replace(/\n/g, ' ')}": exits f${exit}, before its hold minimum f${min}`);
    const words = t.text.replace(/\n/g, ' ').trim().split(/\s+/).length;
    if (words > 3) lines.push(`tag "${t.text}": ${words} words (max 3)`);
    for (const line of t.text.split('\n')) if (line.length > 22) lines.push(`tag "${line}": ${line.length} characters on a line (max 22)`);
  }
  for (const l of lines) kitWarn(l);
  return report('tagSync', lines);
};

export const checkBudgets = (script: Readonly<Script>, world: WorldSpec, frames: ReadonlyArray<number>): CheckReport => {
  const lines = budgetReport(frames, script, world);
  const rails = script.rows.map((r) => ({id: r.id, rail: r.rail}));
  for (const f of frames) {
    // Bits on screen
    let bits = 0;
    for (const b of script.bits) {
      const hops = hopsFor(b, world, rails);
      const d = bitDraw(f, b, hops.map((h) => h.run), cameraAt(f, script.camera));
      if (d.head && d.head.opacity > 0.05) bits++;
    }
    if (bits > BIT2.maxOnScreen) lines.push(`f${f}: ${bits} Bits on screen (max ${BIT2.maxOnScreen})`);
    // emphasis devices: an un-settled Lens ring, brackets, a filled "?"
    let emph = 0;
    for (const l of script.lenses) if (f >= l.openAt && f < l.closeAt && (l.settleAt === undefined || f < l.settleAt) && (l.diveAt === undefined || f < l.diveAt)) emph++;
    for (const g of script.glyphs) {
      if (g.kind === 'brackets' && f >= g.lockAt - 5 && f < g.fadeAt) emph++;
      if (g.kind === 'qFill' && f >= g.at && (g.outAt === undefined || f < g.outAt)) emph++;
    }
    if (emph > BUDGET.emphasisDevices) lines.push(`f${f}: ${emph} emphasis devices on screen (max ${BUDGET.emphasisDevices})`);
  }
  const uniq = [...new Set(lines)];
  for (const l of uniq) kitWarn(`budget: ${l}`);
  return report('budgets', uniq);
};

/* ------------------------------------------------------------------------------------------------
 * Proof of power (bible §7.7) and safe areas
 * ---------------------------------------------------------------------------------------------- */

const panelsOn = (f: number, script: Readonly<Script>): boolean =>
  windowAt(f, script.windows).t > 0 ||
  script.plates.some((p) => f >= p.peelAt && f < plateEnd(p)) ||
  script.splits.some((s) => splitAt(f, s).phase !== 'off');

export const checkProofOfPower = (script: Readonly<Script>, world: WorldSpec, frames: ReadonlyArray<number>): CheckReport => {
  const lines: string[] = [];
  const pp = world.proofOfPower;
  if (!pp) return report('proofOfPower', lines);
  const subjPart = anchorPart(world, pp.subject);
  const subjBlock = !isPt(pp.subject) ? splitAnchor(pp.subject as string).port.match(/^block:([^.]+)/)?.[1] : undefined;
  const subjInit = (subjPart?.props?.blocks as Array<{key: string; state?: PartState}> | undefined)?.find((b) => b.key === subjBlock)?.state ?? subjPart?.initial ?? 'off';
  const ref = referenceShot(script.camera);
  const proofPart = anchorPart(world, pp.proof);
  const inFrame = (s: readonly [number, number]) => s[0] >= 0 && s[0] <= 1920 && s[1] >= 0 && s[1] <= LAYOUT.meaningBottom;
  let missingSince: number | null = null;
  const last = script.lastFrame ?? 1889;
  for (let f = 0; f <= last; f++) {
    if (panelsOn(f, script)) {
      missingSince = null;
      continue;
    }
    const cam = cameraAt(f, script.camera);
    const subj = project(cam, resolveAnchor(world, pp.subject));
    const awake = subjPart ? LIT.has(stateAt(f, script.states, subjPart.id, subjBlock, 'world', subjInit).state) : false;
    if (!awake || !(subj[0] >= 0 && subj[0] <= 1920 && subj[1] >= 0 && subj[1] <= 1080)) {
      missingSince = null;
      continue;
    }
    const proofW = resolveAnchor(world, pp.proof);
    const proofS = project(proofPart && (proofPart.depth ?? 1) !== 1 ? layerCam(cam, proofPart.depth ?? 1, ref) : cam, proofW);
    if (inFrame(proofS)) {
      missingSince = null;
      continue;
    }
    if (missingSince === null) missingSince = f;
    const grace = cam.moving ? CAMERA.proofOfPowerMoveGrace : 0;
    if (f - missingSince >= grace) lines.push(`f${f}: the subject is shown awake but the proof (${typeof pp.proof === 'string' ? pp.proof : 'point'}) is out of frame`);
  }
  const compact = compactFrames(lines);
  for (const l of compact) kitWarn(`proof of power: ${l}`);
  return report('proofOfPower', compact);
};

/** Collapse "fN: msg" lines into ranges. */
const compactFrames = (lines: string[]): string[] => {
  const by = new Map<string, number[]>();
  for (const l of lines) {
    const m = l.match(/^f(\d+): (.*)$/);
    if (!m) continue;
    const arr = by.get(m[2]) ?? [];
    arr.push(Number(m[1]));
    by.set(m[2], arr);
  }
  const out: string[] = [];
  for (const [msg, fs] of by) {
    let a = fs[0];
    let b = fs[0];
    for (let i = 1; i <= fs.length; i++) {
      if (i < fs.length && fs[i] === b + 1) {
        b = fs[i];
        continue;
      }
      out.push(`f${a}${b > a ? `–f${b}` : ''}: ${msg}`);
      if (i < fs.length) a = b = fs[i];
    }
  }
  return out;
};

export const checkSafeAreas = (script: Readonly<Script>, world: WorldSpec, frames: ReadonlyArray<number>): CheckReport => {
  const lines: string[] = [...captionBandReport(script.camera, world, frames)];
  const rails = script.rows.map((r) => ({id: r.id, rail: r.rail}));
  for (const f of frames) {
    const cam = cameraAt(f, script.camera);
    if (cam.moving) continue;
    for (const b of script.bits) {
      if (scopeKey(b.scope) !== 'world') continue;
      const d = bitDraw(f, b, hopsFor(b, world, rails).map((h) => h.run), cam);
      if (d.head && d.head.y > LAYOUT.meaningBottom) lines.push(`f${f}: Bit "${b.id}" below y ${LAYOUT.meaningBottom} at a hold`);
    }
  }
  const out = compactFrames(lines.filter((l) => l.startsWith('f'))).concat(lines.filter((l) => !l.startsWith('f')));
  for (const l of out) if (l.startsWith('f')) kitWarn(`safe areas: ${l}`);
  return report('safeAreas', out);
};

/* ------------------------------------------------------------------------------------------------
 * Motion audit
 * ---------------------------------------------------------------------------------------------- */

/**
 * Gaps between scripted foreground events while the voice speaks (warn > BUDGET.maxForegroundStill), cue spacing
 * (>= 6), and any 30-frame window holding more than BUDGET.maxPrimaryPerSecond camera/panel/Lens moves.
 */
export const motionGapReport = (script: Readonly<Script>): CheckReport => {
  const last = script.lastFrame ?? 1889;
  const active = new Uint8Array(last + 2);
  const mark = (a: number, b: number) => {
    for (let f = Math.max(0, Math.floor(a)); f <= Math.min(last, Math.ceil(b)); f++) active[f] = 1;
  };
  for (const k of keySpans(script.camera)) mark(k.at, k.end);
  for (const b of script.bits) for (const h of b.hops) mark(h.depart, h.land + 10);
  for (const s of script.states) mark(s.at, s.at + DUR.stateFlip);
  for (const p of script.props) mark(p.at, p.at + Math.max(1, p.dur));
  for (const t of script.tags) {
    const l = tagLand(t);
    mark(l - 6, l + 5);
    const e = tagExit(t);
    mark(e, e + 6);
  }
  for (const p of script.pills) {
    const l = p.land ?? w(p.word);
    mark(l, l + 5);
    if (typeof p.exitAt === 'number') mark(p.exitAt, p.exitAt + 6);
  }
  for (const c of script.chip) mark(c.at, c.at + 6);
  for (const r of script.routes) mark(r.at, r.at + 10);
  for (const c of script.channels) mark(c.at, c.at + 8);
  for (const wsh of script.washes) mark(wsh.at, wsh.at + 8);
  for (const l of script.lenses) {
    mark(l.leaderAt ?? l.openAt, l.openAt + 9);
    mark(l.closeAt, l.closeAt + 6);
    if (l.settleAt !== undefined) mark(l.settleAt, l.settleAt + 6);
    if (l.diveAt !== undefined) mark(l.diveAt, l.diveAt + 16);
  }
  for (const p of script.plates) {
    mark(p.peelAt, p.peelAt + DUR.peel);
    mark(p.returnAt, plateEnd(p));
    if (p.caption) mark(p.caption.at, p.caption.at + 5);
  }
  for (const s of script.splits) {
    mark(s.at, s.at + 12);
    mark(s.foldAt, s.foldAt + 12);
    for (const b of s.bands) mark(b.caption.at, b.caption.at + 5);
  }
  for (const wn of script.windows) {
    mark(wn.at, wn.at + 10);
    mark(wn.expandAt, wn.expandAt + 10);
  }
  for (const g of script.glyphs) {
    let at: number | undefined;
    switch (g.kind) {
      case 'qFill':
      case 'qAccent':
      case 'visited':
      case 'endTick':
      case 'wake':
      case 'pressWave':
        at = g.at;
        break;
      case 'eye':
      case 'arc':
      case 'card':
      case 'scopeLine':
        at = g.drawAt;
        break;
      case 'fork':
        at = g.drawAt[0];
        break;
      case 'brackets':
        at = g.lockAt - 5;
        break;
      case 'command':
        at = g.land ?? w(g.word);
        break;
      case 'loopArrow':
      case 'powerRing':
        at = g.drawAt;
        break;
      case 'problem':
      case 'mark':
      case 'stage':
        at = g.at;
        break;
    }
    if (at !== undefined) mark(at, at + 8);
    // round 3: an eye that closes or glances, and the S08 hedge marks, are foreground motion too
    if (g.kind === 'eye') {
      if (g.closeAt !== undefined) mark(g.closeAt, g.closeAt + 6);
      for (const l of g.look ?? []) mark(l.at, l.at + 6);
    }
    if (g.kind === 'problem') for (const t of [g.hedgeAt, g.doubtAt]) if (t !== undefined) mark(t, t + 8);
    if (g.kind === 'command' && g.spinAt !== undefined) mark(g.spinAt, g.spinAt + 18);
    if (g.kind === 'loopArrow' && g.spinAt !== undefined) mark(g.spinAt, g.spinAt + 20);
    if (g.kind === 'powerRing') for (const t of [g.offAt, g.onAt]) if (t !== undefined) mark(t, t + 6);
    if (g.kind === 'problem') for (const t of [g.clearAt, g.pulseAt]) if (t !== undefined) mark(t, t + 12);
    if (g.kind === 'stage' && g.moveAt !== undefined) mark(g.moveAt, g.moveAt + 16);
  }
  const lines: string[] = [];
  let run = 0;
  let start = 0;
  for (let f = 0; f <= last; f++) {
    if (active[f] || !speakingAt(f)) {
      if (run > BUDGET.maxForegroundStill) lines.push(`f${start}–f${f - 1}: the foreground holds still for ${run} frames under speech (max ${BUDGET.maxForegroundStill})`);
      run = 0;
      continue;
    }
    if (run === 0) start = f;
    run++;
  }
  if (run > BUDGET.maxForegroundStill) lines.push(`f${start}–f${last}: the foreground holds still for ${run} frames under speech (max ${BUDGET.maxForegroundStill})`);
  // primary moves per 30 frames: camera keys, plate groups, Lens open/close/dive, splits, windows
  const moves: number[] = [];
  keySpans(script.camera).forEach((k) => k.end > k.at && moves.push(k.at));
  const groupStarts = (xs: number[]) => xs.sort((a, b) => a - b).filter((x, i, arr) => i === 0 || x - arr[i - 1] > 20);
  moves.push(...groupStarts(script.plates.map((p) => p.peelAt)), ...groupStarts(script.plates.map((p) => p.returnAt)));
  for (const l of script.lenses) moves.push(l.openAt, l.closeAt, ...(l.diveAt !== undefined ? [l.diveAt] : []));
  for (const s of script.splits) moves.push(s.at, s.foldAt);
  for (const wn of script.windows) moves.push(wn.at, wn.expandAt);
  moves.sort((a, b) => a - b);
  for (let i = 0; i < moves.length; i++) {
    const n = moves.filter((m) => m >= moves[i] && m < moves[i] + 30).length;
    if (n > BUDGET.maxPrimaryPerSecond) {
      lines.push(`f${moves[i]}: ${n} camera/panel/Lens moves start within 30 frames (max ${BUDGET.maxPrimaryPerSecond})`);
    }
  }
  deriveCues(script);
  const uniq = [...new Set(lines)];
  for (const l of uniq) kitWarn(`motion: ${l}`);
  return report('motionGaps', uniq);
};

/* ------------------------------------------------------------------------------------------------
 * All
 * ---------------------------------------------------------------------------------------------- */

/** Called once by buildScript; prints with kitWarn. */
export const runAllChecks = (script: Readonly<Script>, world: WorldSpec): CheckReport[] => {
  const out: CheckReport[] = [];
  const safe = (name: string, fn: () => CheckReport) => {
    try {
      out.push(fn());
    } catch (e) {
      kitWarn(`check ${name} failed to run: ${String(e)}`);
    }
  };
  const frames = checkFrames(script);
  safe('camera', () => {
    zoomRateReport(script.camera);
    panSpeedReport(script.camera);
    return report('camera', []);
  });
  safe('bitSpeed', () => {
    const lines: string[] = [];
    const rails = script.rows.map((r) => ({id: r.id, rail: r.rail}));
    for (const b of script.bits) bitScreenSpeedReport(b, hopsFor(b, world, rails).map((h) => h.run), script.camera);
    return report('bitSpeed', lines);
  });
  safe('anchors', () => checkAnchors(script, world));
  safe('tagSync', () => checkTagSync(script));
  safe('budgets', () => checkBudgets(script, world, frames));
  safe('proofOfPower', () => checkProofOfPower(script, world, frames));
  safe('safeAreas', () => checkSafeAreas(script, world, frames));
  safe('motionGaps', () => motionGapReport(script));
  // unknown parts referenced by events
  safe('references', () => {
    const lines: string[] = [];
    // parts may live in a recomposed scene (plates, tweens, a split's band scene): round 1
    const sceneParts = new Set<string>();
    for (const p of script.plates) {
      const scenes = p.content.kind === 'scene' ? [p.content.scene] : p.content.kind === 'tween' ? [p.content.from, p.content.to] : [];
      for (const sc of scenes) for (const part of sc.parts) sceneParts.add(part.id);
    }
    for (const sp of script.splits) for (const part of sp.content?.scene.parts ?? []) sceneParts.add(part.id);
    const known = (id: string) => !!partById(world, id) || sceneParts.has(id);
    for (const e of script.states) if (!known(e.part)) lines.push(`state event names unknown part "${e.part}"`);
    for (const e of script.props) if (!known(e.part)) lines.push(`prop event names unknown part "${e.part}"`);
    // routes may live in a plate's recomposed scene (round 1: the S06 stages' buses)
    const sceneRoutes = new Set(
      script.plates.flatMap((p) => (p.content.kind === 'scene' ? (p.content.scene.routes ?? []).map((r) => r.id) : p.content.kind === 'tween' ? [...(p.content.from.routes ?? []), ...(p.content.to.routes ?? [])].map((r) => r.id) : [])),
    );
    for (const r of script.routes) if (!world.routes.some((x) => x.id === r.route) && !sceneRoutes.has(r.route)) lines.push(`route event names unknown route "${r.route}"`);
    for (const c of script.channels) if (!world.channels.some((x) => x.id === c.channel)) lines.push(`channel event names unknown channel "${c.channel}"`);
    const uniq = [...new Set(lines)];
    for (const l of uniq) kitWarn(`references: ${l}`);
    return report('references', uniq);
  });
  // record (for tools): lens screen bounds inside the frame
  for (const l of script.lenses) {
    if (!isPt(l.center) && 'screen' in (l.center as object)) {
      const c = (l.center as {screen: readonly [number, number]}).screen;
      if (c[0] - l.d / 2 < 0 || c[0] + l.d / 2 > 1920 || c[1] - l.d / 2 < 0 || c[1] + l.d / 2 > LAYOUT.meaningBottom) kitWarn(`lens ${l.id}: the ring leaves the frame or enters the caption band`);
    }
  }
  return out;
};
