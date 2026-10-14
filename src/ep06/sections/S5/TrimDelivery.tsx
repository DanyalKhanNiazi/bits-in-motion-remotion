/**
 * S5 local overlay (world px, drawn over the <Archive>): the TRIM note on its delivery, as the kit's paper envelope at a
 * guaranteed on-screen width (`wOnScreen`). It rides EXACTLY on the Archive's own `trim` note (same path, same squeeze
 * through the slot, mirrored from Archive.tsx) and covers it, so the note through the slot reads as a note.
 * HANDOFF: S6 repeats the same `trim` event; drawing <TrimDelivery at={TRIM_AT} dur={TRIM_DUR} /> over its Archive keeps
 * the look continuous across the cut.
 */
import React from 'react';
import {EASE, GEOM, PHOTO, TrimNote, boxC, cardPlugs, clamp01, lerp, prog} from '../../kit';

/** the Archive's trim note position + vertical squeeze at a frame (mirror of Archive.tsx, default `to`) */
export const archiveTrimPos = (f: number, at: number, dur: number): {x: number; y: number; sy: number} => {
  const t = (f - at) / dur;
  const start = cardPlugs(GEOM.card.x, GEOM.card.y, GEOM.card.w)[1];
  const slot = {x: GEOM.boundary.x, y: GEOM.boundary.slotY};
  const to = {x: boxC(PHOTO[0]).x - 70, y: boxC(PHOTO[0]).y - 10};
  if (t < 0.45) {
    const u = EASE.inOut(clamp01(t / 0.45));
    return {x: lerp(start.x - 20, slot.x - 40, u), y: lerp(start.y, slot.y, u) - Math.sin(Math.PI * u) * 40, sy: 1};
  }
  if (t < 0.6) {
    const u = (t - 0.45) / 0.15;
    return {x: lerp(slot.x - 40, slot.x + 40, u), y: slot.y, sy: 1 - 0.35 * Math.sin(Math.PI * u)};
  }
  const u = EASE.out(clamp01((t - 0.6) / 0.4));
  return {x: lerp(slot.x + 40, to.x, u), y: lerp(slot.y, to.y, u), sy: 1};
};

/** on-screen width of the delivered envelope (px): ≥ 98 world px at the `boundary` framing, so it hides the Archive's card + tab */
export const DELIVERY_W = 160;

export const TrimDelivery: React.FC<{frame: number; at: number; dur: number; w?: number}> = ({frame: f, at, dur, w = DELIVERY_W}) => {
  if (f < at) return null;
  const op = 1 - prog(f, at + dur + 50, 12);
  if (op <= 0) return null;
  const p = archiveTrimPos(f, at, dur);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: op, transformOrigin: `${p.x}px ${p.y}px`, transform: p.sy !== 1 ? `scale(1, ${p.sy})` : undefined}}>
      <TrimNote frame={f} variant="envelope" x={p.x} y={p.y - 4} w={w} wOnScreen numberSize={10} float={0} />
    </div>
  );
};
