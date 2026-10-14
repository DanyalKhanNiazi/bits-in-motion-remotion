/**
 * Label budgets and placement checks (ENGINE.md §12, STYLE_BIBLE §10.7–10.8): every label-like element on screen at a
 * frame, and the per-frame counts (≤ 3 tags, ≤ 2 pills, ≤ 12 must-read words), title-safe, the 940 px floor and the
 * 24 px spacing between boxes.
 */
import {BUDGET, LAYOUT, TYPE} from '../tokens';
import {rectsOverlap} from '../core/math';
import type {SRect} from '../core/types';
import {cameraAt, project, referenceShot, viewCam} from '../camera/camera';
import type {WorldSpec} from '../world/types';
import type {Script} from '../timeline/script';
import {countLabelWords, textWidth} from './metrics';
import {isAutoSlot, tagAt, tagLand} from './Tag2';
import {pillBox} from './Pill2';
import {readoutBox} from './Readout2';
import {chipBox} from './Chip2';
import {contentRel, plateEnd, slotRect} from '../panels/peel';
import {captionReveal} from './Caption2';
import {BAND_SLOTS, bandCaptionPlace, CENTER_BAND, outcomePlace, splitAt} from '../panels/Split';

export interface LabelBox {
  id: string;
  kind: 'tag' | 'pill' | 'chip' | 'readout' | 'caption' | 'name';
  box: SRect;
  words: number;
  mustRead: boolean;
}

/** Every label-like element on screen at a frame, for budgets and collisions. */
export const labelBoxesAt = (frame: number, script: Readonly<Script>, cam = cameraAt(frame, script.camera), world?: WorldSpec): LabelBox[] => {
  const out: LabelBox[] = [];
  const ref = referenceShot(script.camera);
  if (world) {
    for (const t of script.tags) {
      if (t.scope && t.scope !== 'world') continue;
      const d = tagAt(frame, t, cam, world, ref, isAutoSlot(t) ? cameraAt(tagLand(t), script.camera) : undefined);
      if (d && d.textReveal > 0.5) out.push({id: t.id, kind: 'tag', box: d.box, words: countLabelWords(t.text), mustRead: true});
    }
    for (const p of script.pills) {
      const b = pillBox(frame, p, cam, world, ref);
      if (b) out.push({id: p.id, kind: 'pill', box: b, words: countLabelWords(p.text), mustRead: true});
    }
  }
  for (const r of script.readouts) {
    const b = readoutBox(frame, r);
    if (b) out.push({id: r.id, kind: 'readout', box: b, words: countLabelWords(`${r.value} ${r.unit}`), mustRead: true});
  }
  const cb = chipBox(frame, script.chip);
  if (cb) out.push({id: 'chip', kind: 'chip', box: cb.box, words: cb.size >= TYPE.chipActive - 0.5 ? countLabelWords(cb.text) : 0, mustRead: cb.size >= TYPE.chipActive - 0.5});
  for (const p of script.plates) {
    // round 2: tags inside a plate (anchored on its scene) count as tags while the plate sits in its slot
    if (p.tags && p.content.kind !== 'world' && frame >= p.peelAt + 14 && frame < p.returnAt) {
      const slot = slotRect(p.slot);
      const rel = contentRel(p, slot);
      const cr = {x: slot.x + rel.x * slot.w, y: slot.y + rel.y * slot.h, w: rel.w * slot.w, h: rel.h * slot.h};
      const c = p.content;
      const scene = c.kind === 'scene' ? c.scene : c.to;
      const shot = c.kind === 'scene' ? c.shot : Array.isArray(c.shot) ? c.shot[1] : c.shot;
      for (const t of p.tags) {
        const d = tagAt(frame, t, viewCam(shot, cr), scene);
        if (d && d.textReveal > 0.5) out.push({id: `${p.id}:${t.id}`, kind: 'tag', box: d.box, words: countLabelWords(t.text), mustRead: true});
      }
    }
    // round 4: names inside a plate ("Chipset", "Battery", the S08 hedges "Can fix" / "Might not") are must-read text
    if (p.names && p.content.kind !== 'world' && frame >= p.peelAt + 14 && frame < p.returnAt) {
      const slot = slotRect(p.slot);
      const rel = contentRel(p, slot);
      const cr = {x: slot.x + rel.x * slot.w, y: slot.y + rel.y * slot.h, w: rel.w * slot.w, h: rel.h * slot.h};
      const c = p.content;
      const shot = c.kind === 'scene' ? c.shot : Array.isArray(c.shot) ? c.shot[1] : c.shot;
      const scam = viewCam(shot, cr);
      for (const n of p.names) {
        if (frame < n.at || (n.exitAt !== undefined && frame >= n.exitAt + 6)) continue;
        const ctr = project(scam, n.scenePt);
        const w = textWidth(n.text, TYPE.partName, 600);
        const h = TYPE.partName * TYPE.lineHeight;
        out.push({id: `${p.id}:name:${n.text}`, kind: 'name', box: {x: ctr[0] - w / 2, y: ctr[1] - h / 2, w, h}, words: countLabelWords(n.text), mustRead: true});
      }
    }
    if (!p.caption) continue;
    const exitAt = typeof p.caption.exitAt === 'number' ? p.caption.exitAt : undefined;
    if (captionReveal(frame, {text: p.caption.text, at: p.caption.at, exitAt, place: slotRect(p.slot), ghostAt: p.caption.ghostAt}) <= 0.5) continue;
    if (frame >= plateEnd(p)) continue;
    const r = slotRect(p.slot);
    // a pre-shown ("ghost") name is supporting text until its word
    const mustRead = frame >= p.caption.at;
    out.push({id: `${p.id}:caption`, kind: p.caption.place === 'name' ? 'name' : 'caption', box: r, words: countLabelWords(p.caption.text), mustRead});
  }
  for (const s of script.splits) {
    const st = splitAt(frame, s);
    for (const b of s.bands) {
      if (frame < b.caption.at || frame >= s.foldAt + 6) continue;
      const band = b.side === 'left' ? st.left : st.right;
      const box = s.content || s.captionY === undefined ? bandCaptionPlace(band, 0) : {x: band.x + 48, y: s.captionY, w: 400, h: 51};
      out.push({id: `band:${b.side}`, kind: 'caption', box, words: countLabelWords(b.caption.text), mustRead: true});
      // round 3: the band's outcome ("Dark")
      if (b.outcome && s.content && frame >= b.outcome.at) {
        out.push({id: `band:${b.side}:outcome`, kind: 'caption', box: outcomePlace(b.outcome, s.content, band, BAND_SLOTS[b.side]), words: countLabelWords(b.outcome.text), mustRead: true});
      }
    }
    (s.centerCaptions ?? []).forEach((c, i) => {
      if (frame < c.at || frame >= s.foldAt + 6) return;
      out.push({id: `band:center:${i}`, kind: 'caption', box: bandCaptionPlace(CENTER_BAND, i), words: countLabelWords(c.text), mustRead: true});
    });
    if (s.content) {
      for (const t of s.centerTags ?? []) {
        const d = tagAt(frame, t, viewCam(s.content.shot, CENTER_BAND), s.content.scene);
        if (d && d.textReveal > 0.5) out.push({id: `band:tag:${t.id}`, kind: 'tag', box: d.box, words: countLabelWords(t.text), mustRead: true});
      }
    }
  }
  return out;
};

/** Budget and placement problems at the given frames (one line each). */
export const budgetReport = (frames: ReadonlyArray<number>, script: Readonly<Script>, world: WorldSpec): string[] => {
  const lines: string[] = [];
  const seen = new Set<string>();
  const add = (m: string) => {
    if (!seen.has(m)) {
      seen.add(m);
      lines.push(m);
    }
  };
  for (const f of frames) {
    const boxes = labelBoxesAt(f, script, cameraAt(f, script.camera), world);
    const tags = boxes.filter((b) => b.kind === 'tag').length;
    const pills = boxes.filter((b) => b.kind === 'pill').length;
    const words = boxes.filter((b) => b.mustRead).reduce((a, b) => a + b.words, 0);
    if (tags > BUDGET.tags) add(`f${f}: ${tags} tags (max ${BUDGET.tags})`);
    if (pills > BUDGET.pills) add(`f${f}: ${pills} pills (max ${BUDGET.pills})`);
    if (words > BUDGET.mustReadWords) add(`f${f}: ${words} must-read words (max ${BUDGET.mustReadWords})`);
    for (const b of boxes) {
      if (b.kind === 'caption' || b.kind === 'name') continue;
      const s = LAYOUT.textSafe;
      if (b.box.x < s.x0 - 0.5 || b.box.x + b.box.w > s.x1 + 0.5 || b.box.y < s.y0 - 0.5 || b.box.y + b.box.h > s.y1 + 0.5)
        add(`f${f}: ${b.kind} "${b.id}" leaves title-safe (${Math.round(b.box.x)}, ${Math.round(b.box.y)}, ${Math.round(b.box.w)} × ${Math.round(b.box.h)})`);
      const k = LAYOUT.topRightKeepOut;
      if (rectsOverlap(b.box, {x: k.x0, y: k.y0, w: k.x1 - k.x0, h: k.y1 - k.y0})) add(`f${f}: ${b.kind} "${b.id}" enters the top-right keep-out`);
    }
    const flat = boxes.filter((b) => b.kind !== 'caption' && b.kind !== 'name');
    for (let i = 0; i < flat.length; i++)
      for (let j = i + 1; j < flat.length; j++)
        if (rectsOverlap(flat[i].box, flat[j].box, 24)) add(`f${f}: "${flat[i].id}" and "${flat[j].id}" are closer than 24 px`);
  }
  return lines;
};
