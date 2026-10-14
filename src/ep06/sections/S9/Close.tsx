/**
 * S9 P22: "Delete ≠ Erase", the passport sinking into its boxes and the crossed-out card; SplitCompare one last time;
 * the final continuous pull-out (sanitize pulse, then a save that is unreadable from its first frame) and the lockup.
 */
import React from 'react';
import {
  Archive,
  ClockGlyph,
  EASE,
  Footnote,
  KineticText,
  PAL,
  PHOTO,
  N_BOXES,
  PassportCard,
  PhotoBits,
  SPLIT,
  SplitCompare,
  Stage,
  VerdictChip,
  archiveAnchors,
  archiveCam,
  boxC,
  clamp01,
  lerp,
  passportAnchors,
  prog,
  rgba,
  type ArchiveEvent,
  type CamKey,
  type Content,
  type Pose,
} from '../../kit';
import {CUT, T} from './t';
import {GlyphSave, GlyphTiles, Lockup, glyphLand} from './marks';

/* ================================================================ P22a: Delete ≠ Erase; the passport sinks into its boxes; the strike */
const PASS = {x: 1180, y: 500, w: 380, variant: 'screen' as const};
const DISSOLVE = T.erase + 4;
const SINK = DISSOLVE + 18;
const LAND = SINK + 18;
const SIG_END = {x: 1200, y: 236, zoom: 1.0};
/**
 * The card stays down in the drawer while "Delete ≠ Erase" is up (it exits at T.del2 − 2 over 9 f); it lifts once the
 * title is all but gone and lands on "index card", with the camera rising to the signature framing alongside it.
 */
const LIFT0 = T.del2 + 6;
const LIFT1 = T.indexCard + 1;
const P22_CAM: CamKey[] = [
  // framed ~50 px higher in the world than the wall's centre: the drawer card's top stays ≥ 40 px under the title's baseline
  {f: CUT.p22, x: 900, y: 446, zoom: 1.05},
  {f: T.erase + 8, x: 930, y: 452, zoom: 1.0},
  {f: LIFT1 + 3, ...archiveCam('signature'), dur: LIFT1 + 3 - LIFT0},
  {f: CUT.split, ...SIG_END},
];
const P22_EVENTS: ArchiveEvent[] = [
  {at: LAND, op: 'pour', target: 'photo', dur: 6},
  {at: LAND + 2, op: 'threads', dur: 14},
  {at: T.crosses + 1, op: 'strike'},
  {at: T.indexCard + 1, op: 'flag'},
  {at: T.indexCard + 8, op: 'mapFlip', target: 'photo', dur: 14},
];
const passRect = (() => {
  const q = passportAnchors(PASS).photo;
  const xs = q.map((p) => p[0]);
  const ys = q.map((p) => p[1]);
  return {x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys)};
})();

export const DeleteShot: React.FC<{f: number}> = ({f}) => {
  const A = {frame: f, state: 'HDD_SAVED' as const, light: 'cool' as const, events: P22_EVENTS, lift: [[LIFT0, 0], [LIFT1, 1]] as const};
  const an = archiveAnchors(A, f);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'cool', dust: 18}}
      cam={P22_CAM}
      drift={0.5}
      shake={[
        {at: T.del + 2, strength: 0.6},
        {at: T.crosses + 2, strength: 0.45},
      ]}
      hud={<KineticText frame={f} at={T.del + 2} text="Delete ≠ Erase" x={960} y={170} size={176} mode="slam" exitAt={T.del2 - 2} />}
    >
      <Archive {...A} />
      <PassportCard frame={f} {...PASS} float={4} tiltY={-6} rim={{color: PAL.ink, strength: 0.45}} sweep={{at: [CUT.p22 + 2], dur: 18}} dissolveAt={DISSOLVE} dissolveDur={12} shadow={false} />
      <PhotoBits frame={f} at={DISSOLVE} dur={18} mode="dissolve" from={passRect} grid={[12, 14]} />
      <PhotoBits frame={f} at={SINK} dur={28} mode="sink" from={passRect} to={an.photo} grid={[12, 14]} />
    </Stage>
  );
};

/* ================================================================ P22b: SplitCompare one last time */
const LEFT_CAM: CamKey[] = [{f: CUT.split, ...SIG_END}, {f: CUT.split + 30, ...archiveCam('split')}];
const GhostWrite: React.FC<{f: number}> = ({f}) => {
  const a = T.nothing;
  if (f < a - 2) return null;
  const c = boxC(PHOTO[4]);
  const op = prog(f, a, 10) * (1 - prog(f, CUT.zt10, 6));
  const bob = 6 * Math.sin(f / 14);
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={op}>
      <rect x={c.x - 60} y={c.y - 230 + bob} width={120} height={76} rx={10} fill={rgba(PAL.ink, 0.1)} stroke={PAL.ink} strokeWidth={6} strokeDasharray="16 12" />
      <line x1={c.x} y1={c.y - 144 + bob} x2={c.x} y2={c.y - 62} stroke={rgba(PAL.ink, 0.6)} strokeWidth={5} strokeDasharray="8 10" />
      <path d={`M${c.x - 16} ${c.y - 74} L${c.x} ${c.y - 52} L${c.x + 16} ${c.y - 74}`} fill="none" stroke={rgba(PAL.ink, 0.6)} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
const PanelFocus: React.FC<{f: number; side: 'left' | 'right'; from: number; to: number}> = ({f, side, from, to}) => {
  const P = SPLIT[side];
  const v = prog(f, from, 8) * (1 - prog(f, to, 10));
  if (v <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: P.x0 - 10,
        top: SPLIT.content.y0 - 10,
        width: P.x1 - P.x0 + 20,
        height: SPLIT.content.y1 - SPLIT.content.y0 + 20,
        borderRadius: 20,
        border: `3px solid ${rgba(PAL.ink, 0.75 * v)}`,
        boxShadow: `0 0 28px ${rgba('#DCE8FF', 0.28 * v)}`,
      }}
    />
  );
};
export const SplitShot: React.FC<{f: number}> = ({f}) => {
  const dim = prog(f, T.dont, 18, EASE.inOut);
  return (
    <SplitCompare
      frame={f}
      at={CUT.split}
      enter="compress"
      left={{
        cam: LEFT_CAM,
        light: 'cool',
        render: (fr) => (
          <>
            <Archive frame={fr} state="HDD_DELETED" lift={1} />
            <GhostWrite f={fr} />
          </>
        ),
      }}
      right={{
        cam: archiveCam('split'),
        light: 'ssd',
        render: (fr) => <Archive frame={fr} state="SSD_TRIMMED" lift={1} events={[{at: T.schedule - 6, op: 'sweep', target: 'photo', dur: 40}]} />,
      }}
      leftChip={<VerdictChip frame={f} at={T.until} text="Until something new is written" tone="kept" x={0} y={0} exitAt={T.truly} />}
      rightChip={<VerdictChip frame={f} at={T.decides + 4} text="The drive decides" tone="neutral" x={0} y={0} exitAt={T.truly} />}
      hud={
        <>
          <PanelFocus f={f} side="left" from={T.onHard} to={T.onSsd2 - 4} />
          <PanelFocus f={f} side="right" from={T.onSsd2} to={T.ifNeed} />
          <ClockGlyph frame={f} x={1790} y={300} size={72} at={T.decides} exitAt={T.dont + 6} />
          <Footnote frame={f} at={T.schedule - 6} exitAt={T.dont + 10} text="Illustrative timing" x={1004} y={862} />
          {dim > 0
            ? (['left', 'right'] as const).map((s) => (
                <div key={s} style={{position: 'absolute', left: SPLIT[s].x0, top: SPLIT.content.y0, width: SPLIT[s].x1 - SPLIT[s].x0, height: SPLIT.content.y1 - SPLIT.content.y0, borderRadius: 12, background: rgba('#03060D', 0.55 * dim)}} />
              ))
            : null}
        </>
      }
    />
  );
};

/* ================================================================ P22d: one continuous pull-out to the wide, and the lockup */
const PB = archiveCam('photoBoxes');
const FIN = {a: T.useCmd, end: T.to + 30};
const FIN_END: Pose = {x: 985, y: 585, zoom: 0.86, rot: 0};
const SAN = T.cmd + 1;
const SAVE = T.or + 2;
/**
 * The pull-out never stops, but it breathes: a fast first leg (the sanitize pulse reaching every box) to about halfway
 * (zoom ≈ 1.27, the 9 photo boxes still large), a slow drift while the glyph save lands in them (the film's last idea
 * gets its own beat), then the rest of the way out under the lockup, decaying into a drift. Speed profile:
 * a raised-cosine bump (leg A) + a fast-rise / slow-decay bump (leg B) + a small constant drift, integrated per frame
 * so the camera's velocity stays continuous.
 */
const HOLD0 = SAVE - 4;
const HOLD1 = SAVE + 38;
const S_HOLD = 0.5;
const finS: Float64Array = (() => {
  const n = FIN.end - FIN.a;
  const drift = 0.04 / (HOLD1 - HOLD0);
  const dA = HOLD0 - FIN.a + 4;
  const vA = (t: number) => (t >= 0 && t <= dA ? 0.5 - 0.5 * Math.cos((2 * Math.PI * t) / dA) : 0);
  const vB = (t: number) => (t > 0 ? (1 - Math.exp(-t / 6)) * Math.exp(-t / 26) : 0);
  // areas: leg A brings s to S_HOLD by HOLD0 (with the drift), leg B takes it the rest of the way by FIN.end
  let aA = 0;
  let aB = 0;
  for (let i = 0; i < n; i++) {
    aA += vA(i + 0.5);
    aB += vB(i + 0.5 - (HOLD1 - FIN.a));
  }
  const wA = (S_HOLD - drift * (HOLD0 - FIN.a)) / aA;
  const wB = (1 - drift * n - wA * aA) / aB;
  const out = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) out[i + 1] = out[i] + drift + wA * vA(i + 0.5) + wB * vB(i + 0.5 - (HOLD1 - FIN.a));
  return out;
})();
const finSAt = (f: number) => {
  const x = clamp01((f - FIN.a) / (FIN.end - FIN.a)) * (FIN.end - FIN.a);
  const i = Math.min(finS.length - 2, Math.floor(x));
  return lerp(finS[i], finS[i + 1], x - i);
};
const finCam = (f: number): Pose => {
  if (f <= FIN.a) {
    const u = prog(f, CUT.zt10, FIN.a - CUT.zt10);
    return {x: PB.x, y: PB.y, zoom: PB.zoom * lerp(1.06, 1.0, u), rot: 0};
  }
  const g = finSAt(f);
  const lz = lerp(Math.log(PB.zoom), Math.log(FIN_END.zoom), g);
  return {x: lerp(PB.x, FIN_END.x, g), y: lerp(PB.y, FIN_END.y, g), zoom: Math.exp(lz), rot: 0};
};
const XF0 = SAVE + 8;
const XF1 = SAVE + 22;
export const FinalShot: React.FC<{f: number}> = ({f}) => {
  const targets = PHOTO.map((id) => boxC(id));
  const boxesB: Record<number, Content> = {};
  for (let id = 1; id <= N_BOXES; id++) boxesB[id] = 'erased';
  PHOTO.forEach((id, i) => {
    if (f >= glyphLand(SAVE, i)) boxesB[id] = 'photo';
  });
  const bOp = prog(f, XF0, XF1 - XF0, EASE.inOut);
  const endDim = prog(f, T.to - 30, 30, EASE.inOut);
  return (
    <Stage
      frame={f}
      env={{kind: 'archive', light: 'ssd'}}
      cam={finCam}
      drift={0.6}
      hud={
        <>
          {endDim > 0 ? <div style={{position: 'absolute', inset: 0, background: rgba('#02040A', 0.3 * endDim)}} /> : null}
          <Lockup frame={f} at={T.unreadable + 2} />
        </>
      }
    >
      {f < XF1 ? <Archive frame={f} state="SSD_ERASED" events={[{at: SAN, op: 'sanitize', dur: 40}]} /> : null}
      {f >= XF0 ? (
        <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: bOp}}>
          <Archive frame={f} state="SSD_DELETED" boxes={boxesB} events={[{at: -100000, op: 'scramble', target: 'photo'}]} />
        </div>
      ) : null}
      <GlyphSave frame={f} at={SAVE} targets={targets} size={40} ring={1} />
      <GlyphTiles frame={f} at={SAVE} targets={targets} />
    </Stage>
  );
};
