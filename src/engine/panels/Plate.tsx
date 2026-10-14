/**
 * A plate (ENGINE.md §10.1, STYLE_BIBLE §9.2): flat shadow → side thickness → `deck` ground → a view of its content
 * (the same world through another camera, or a recomposed scene, or a scene tween) → rule (held: 3 px `structure`;
 * not now: 3 + 2 px `annotation` double rule at 8 px inset; active: the outer rule steps to 4 px `ink` over 4 frames),
 * with port gaps where a row's Bit crosses → the rail (rows) → caption.
 * During the lift the plate shows the world exactly as the main camera does; during the flight that camera
 * re-composes to the plate's shot and scene content cross-fades in (flight frames 6–12); the return reverses it,
 * fading preview states back to the world's truth in its first 6 frames.
 */
import React from 'react';
import {COLOR, DUR, PLATE, STROKE, TYPE} from '../tokens';
import {SANS} from '../../shared/fonts';
import {textWidth} from '../labels/metrics';
import {RevealText} from '../labels/reveal';
import {rectPath} from '../../shared/geom';
import {mixColor} from '../../shared/brand';
import {prog} from '../core/ease';
import {clamp01, lerp, lerpRect, rectCenter} from '../core/math';
import type {SRect, ViewScope, WRect} from '../core/types';
import {lerpShot, project, screenRect, unproject, viewCam, type Cam, type Shot} from '../camera/camera';
import {partById, partRect, stateAt} from '../world/states';
import type {PartSpec, SceneSpec, WorldSpec} from '../world/types';
import {blockRect, type BlockProp} from '../world/placeholder';
import type {PartState} from '../tokens';
import {View} from '../view/View';
import {Caption2} from '../labels/Caption2';
import {Tag2, tagAt, type TagDraw, type TagSpec} from '../labels/Tag2';
import {VisitedMark2} from '../glyphs/draw';
import {stepAt} from '../timeline/track';
import {hold} from '../timeline/words';
import type {Script} from '../timeline/script';
import {contentRel, isHeroHome, PLATE4, peelAt, plateEnd, slotRect, type PlateSpec} from './peel';
import {tweenScene} from './tween';
import {railSpans} from './row';

/** Arc-length position of a point on the left/right edge of a rounded rect path (rectPath: clockwise from (x + r, y)). */
const edgeS = (r: SRect, rad: number, side: 'left' | 'right', y: number): number => {
  const top = r.w - 2 * rad;
  const vert = r.h - 2 * rad;
  const arc = (Math.PI * rad) / 2;
  if (side === 'right') return top + arc + (y - (r.y + rad));
  return 2 * top + vert + 3 * arc + (r.y + r.h - rad - y);
};

/** A rounded-rect rule with gaps (ports) as a dash array. */
const RuleWithGaps: React.FC<{r: SRect; rad: number; width: number; color: string; gaps: Array<{s: number; len: number}>; opacity?: number}> = ({
  r,
  rad,
  width,
  color,
  gaps,
  opacity = 1,
}) => {
  const per = 2 * (r.w + r.h - 4 * rad) + 2 * Math.PI * rad;
  const g = gaps.filter((x) => x.len > 0.5).sort((a, b) => a.s - b.s);
  let dash: string | undefined;
  if (g.length) {
    const arr: number[] = [];
    let pos = 0;
    for (const x of g) {
      const a = Math.max(pos, x.s - x.len / 2);
      arr.push(Math.max(0, a - pos), x.len);
      pos = a + x.len;
    }
    arr.push(Math.max(0, per - pos) + 1, 0);
    dash = arr.map((v) => v.toFixed(2)).join(' ');
  }
  return <path d={rectPath(r.x, r.y, r.w, r.h, rad)} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dash} opacity={opacity} />;
};

/** Round 3: hero-carry timing (frames from the peel / return). */
const HERO = {sceneIn: 8, sceneInDur: 5, out: 13, outDur: 2} as const;

/** The hero's world rect, depth and a one-part world that draws it in the world's state at this frame. */
const heroSource = (frame: number, spec: PlateSpec, world: WorldSpec, script: Readonly<Script>): {rect: WRect; depth: number; mini: SceneSpec} | null => {
  const h = spec.hero;
  if (!h) return null;
  const part = partById(world, h.worldPart);
  if (!part) return null;
  if (!h.block) return {rect: part.rect, depth: part.depth ?? 1, mini: {id: `hero-${spec.id}`, bounds: part.rect, parts: [part]}};
  const blk = (part.props?.blocks as BlockProp[] | undefined)?.find((b) => b.key === h.block);
  if (!blk) return null;
  const r = blockRect(part.rect, blk.rel);
  const st = stateAt(frame, script.states, part.id, h.block, 'world', (blk.state as PartState | undefined) ?? 'off').state;
  const synth: PartSpec = {
    id: `${part.id}-${h.block}-hero`,
    type: 'logicBlock',
    rect: r,
    initial: st,
    order: 20,
    props: {shape: blk.shape, pip: blk.pip ?? false, ...(blk.badge === 'q' ? {badge: 'q'} : {})},
  };
  return {rect: r, depth: 1, mini: {id: `hero-${spec.id}`, bounds: r, parts: [synth]}};
};

const relIn = (r: SRect, o: SRect) => ({x: (r.x - o.x) / o.w, y: (r.y - o.y) / o.h, w: r.w / o.w, h: r.h / o.h});
const absIn = (f: {x: number; y: number; w: number; h: number}, o: SRect): SRect => ({x: o.x + f.x * o.w, y: o.y + f.y * o.h, w: f.w * o.w, h: f.h * o.h});

/** The hero's view at a frame (null when it is not shown). */
const heroView = (
  frame: number,
  spec: PlateSpec,
  world: WorldSpec,
  script: Readonly<Script>,
  mainCam: Cam,
  refShot: Shot | undefined,
  rect: SRect,
  cr: SRect,
  slot: SRect,
  k: number,
  phase: string,
): React.ReactNode => {
  const hs = heroSource(frame, spec, world, script);
  const c = spec.content;
  if (!hs || c.kind !== 'scene' || !spec.hero) return null;
  const sp = c.scene.parts.find((p) => p.id === spec.hero!.scenePart);
  if (!sp) return null;
  let t: number;
  const home = phase === 'returning' && isHeroHome(spec);
  if (home) t = 1 - prog(frame, plateEnd(spec) - 2, 2, 'linear');
  else if (phase === 'returning') t = prog(frame, spec.returnAt, 2, 'linear');
  else t = 1 - prog(frame, spec.peelAt + HERO.out, HERO.outDur, 'linear');
  if (t <= 0.001) return null;
  // start: the part where the world draws it, relative to the card at the source; end: where the scene draws it,
  // relative to the content area at the slot
  const srcW = typeof spec.source === 'string' ? partRect(world, spec.source) : spec.source;
  if (!srcW) return null;
  const srcDepth = typeof spec.source === 'string' ? (partById(world, spec.source)?.depth ?? 1) : 1;
  const src = screenRect(mainCam, srcW, srcDepth, refShot);
  const h0 = screenRect(mainCam, hs.rect, hs.depth, refShot);
  const rel = contentRel(spec, slot);
  const W0 = rel.w * slot.w;
  const H0 = rel.h * slot.h;
  const Z = c.shot.zoom;
  const f1 = {
    x: 0.5 + ((sp.rect.x - c.shot.center[0]) * Z) / W0,
    y: 0.5 + ((sp.rect.y - c.shot.center[1]) * Z) / H0,
    w: (sp.rect.w * Z) / W0,
    h: (sp.rect.h * Z) / H0,
  };
  const a = absIn(relIn(h0, src), rect);
  const b = absIn(f1, cr);
  let hr = lerpRect(a, b, clamp01(k));
  if (home) {
    // round 4, the hero home: from where its scene shows it (the card stays in its slot and dissolves) straight to its
    // place in the world, on a gentle arc (12 % of the chord, up the screen), the card never flying
    const u = prog(frame, spec.returnAt + PLATE4.heroFly[0], PLATE4.heroFly[1], 'settle');
    const lin = lerpRect(b, h0, u);
    const dx = h0.x + h0.w / 2 - (b.x + b.w / 2);
    const dy = h0.y + h0.h / 2 - (b.y + b.h / 2);
    const d = Math.hypot(dx, dy);
    let nx = -dy / (d || 1);
    let ny = dx / (d || 1);
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    const bow = 4 * u * (1 - u) * 0.12 * d;
    hr = {...lin, x: lin.x + nx * bow, y: lin.y + ny * bow};
  }
  // the world part drawn into that rect (uniform zoom by width, centred)
  const z = hr.w / Math.max(1e-6, hs.rect.w);
  const cam = viewCam({center: [hs.rect.x + hs.rect.w / 2, hs.rect.y + hs.rect.h / 2], zoom: z}, hr);
  return (
    <View
      key="hero"
      frame={frame}
      cam={cam}
      clip={home ? null : {...rect, r: PLATE.radius}}
      world={hs.mini}
      scope="world"
      script={script}
      id={`plate-${spec.id}-hero`}
      opacity={t}
      glow={false}
      layers={{routes: false, channels: false, washes: false, bits: false}}
    />
  );
};

export interface PlateProps {
  spec: PlateSpec;
  frame: number;
  mainCam: Cam;
  world: WorldSpec;
  script: Readonly<Script>;
  refShot?: Shot;
}

export const Plate: React.FC<PlateProps> = ({spec, frame, mainCam, world, script, refShot}) => {
  const slot = slotRect(spec.slot);
  const srcW = typeof spec.source === 'string' ? partRect(world, spec.source) : spec.source;
  if (!srcW) return null;
  // a room object (the monitor, parallax 0.9) peels from where it is drawn, on its own plane
  const srcDepth = typeof spec.source === 'string' ? (partById(world, spec.source)?.depth ?? 1) : 1;
  const src = screenRect(mainCam, srcW, srcDepth, refShot);
  // round 4: a sibling plate (S08: "Shut down" slides out from behind "Restart" and back)
  const sibId = spec.enterFrom ?? spec.returnInto;
  const sib = sibId ? script.plates.find((p) => p.id === sibId) : undefined;
  const sibSlot = sib ? slotRect(sib.slot) : undefined;
  const st = peelAt(frame, spec, src, slot, sibSlot);
  if (st.phase === 'hidden') return null;
  // round 4: plates whose drawing travels whole with them (another machine sliding in and out; a sibling sliding out
  // from behind its twin and back): content from the first frame to the last, labels riding with the plate
  const whole = spec.lift === 'slide' || !!spec.enterFrom || !!spec.returnInto;
  const home = st.phase === 'returning' && isHeroHome(spec);
  const rect = st.rect;
  const k = st.contentT;
  const rel = contentRel(spec, slot);
  const cr: SRect = {
    x: rect.x + lerp(0, rel.x, k) * rect.w,
    y: rect.y + lerp(0, rel.y, k) * rect.h,
    w: lerp(1, rel.w, k) * rect.w,
    h: lerp(1, rel.h, k) * rect.h,
    r: PLATE.radius,
  };
  const slotContentW = rel.w * slot.w;
  const lift = st.lift;
  const decor = home ? st.lift : whole ? 1 : st.phase === 'returning' ? 1 - prog(frame, plateEnd(spec) - 4, 4, 'exit') : 1;
  const scope: ViewScope = spec.content.kind === 'world' && spec.content.scope ? spec.content.scope : {plate: spec.id};

  // the world view: lift shot (the main camera over the source) → the content's framing
  const liftShot: Shot = {center: unproject(mainCam, rectCenter(src)), zoom: mainCam.zoom};
  let worldTarget: Shot;
  if (spec.content.kind === 'world') worldTarget = {center: spec.content.shot.center, zoom: spec.content.shot.zoom * (cr.w / Math.max(1, slotContentW))};
  else worldTarget = {center: liftShot.center, zoom: mainCam.zoom * Math.min(cr.w / Math.max(1, src.w), cr.h / Math.max(1, src.h)) * 0.8};
  const wShot = lerpShot(liftShot, worldTarget, k);

  // Round 2, fade-through-ground (judges: dissolves between two drawings double-exposed, two "?" over the desktop):
  // a scene plate's lifted world view fades out first, the plate flies as an empty card, and the scene fades in on
  // arrival; the return mirrors it (scene out, empty card, the world's truth in as it lands). Never two drawings.
  const isScene = spec.content.kind !== 'world';
  let sceneT = 0;
  let worldT = 1;
  let truthT = 0;
  if (isScene && whole) {
    // round 4: the whole drawing travels with the plate (never an empty card)
    sceneT = 1;
    worldT = 0;
  } else if (isScene && home) {
    // round 4, the hero home: the scene fades out round its hero (the hero, in the world's state, is drawn under it, so
    // a preview state eases back to the truth in place); then the card dissolves and the hero flies home alone
    sceneT = 1 - prog(frame, spec.returnAt, PLATE4.sceneOut, 'linear');
    worldT = 0;
  } else if (isScene) {
    if (st.phase === 'returning') {
      sceneT = 1 - prog(frame, spec.returnAt, DUR.plateContentOut, 'linear');
      worldT = 0;
      // a collapsing 'card' plate never lands on the world, so it never shows the world's truth
      truthT = spec.lift === 'card' ? 0 : prog(frame, spec.returnAt + DUR.plateContentOut + 1, DUR.plateReturn - DUR.plateContentOut - 3, 'arrive');
    } else if (spec.hero) {
      // round 3, the hero carry: the lifted world gives way to the hero alone (it is drawn on top, in the same place), the
      // hero flies and grows in the card, and the scene gathers round it on arrival
      worldT = 1 - prog(frame, spec.peelAt + 1, 3, 'linear');
      sceneT = prog(frame, spec.peelAt + HERO.sceneIn, HERO.sceneInDur, 'arrive');
    } else {
      // round 3: a plate that shows another machine leaves as an empty card (never a copy of this board)
      worldT = spec.lift === 'card' ? 0 : 1 - prog(frame, spec.peelAt + 1, DUR.plateContentOut, 'linear');
      sceneT = prog(frame, spec.peelAt + 1 + DUR.plateContentOut, DUR.plateContentIn, 'arrive');
    }
  } else if (st.phase === 'returning') {
    // a world plate keeps its drawing; only its preview states fade back to the truth
    truthT = prog(frame, spec.returnAt, 6, 'linear');
    worldT = 1 - truthT;
  }

  const views: React.ReactNode[] = [];
  const clipR = {...cr, r: PLATE.radius};
  if (worldT > 0.001)
    views.push(
      <View key="w" frame={frame} cam={viewCam(wShot, cr)} clip={clipR} world={world} scope={scope} script={script} id={`plate-${spec.id}`} refShot={refShot} opacity={worldT} background={COLOR.deck} />,
    );
  if (truthT > 0.001)
    views.push(
      <View key="t" frame={frame} cam={viewCam(wShot, cr)} clip={clipR} world={world} scope="world" script={script} id={`plate-${spec.id}-truth`} refShot={refShot} opacity={truthT} glow={false} background={COLOR.deck} />,
    );
  // round 3, the hero carry: the part itself travels in the card (the world's own part, in the world's state), from
  // its place in the world to its place in the scene; the scene's copy takes over once the scene is in
  const heroEl = spec.hero && isScene ? heroView(frame, spec, world, script, mainCam, refShot, rect, cr, slot, k, st.phase) : null;
  if (heroEl) views.push(heroEl);
  let tagLayer: React.ReactNode = null;
  let namesLayer: React.ReactNode = null;
  if (sceneT > 0 && spec.content.kind !== 'world') {
    const c = spec.content;
    let scene = c.kind === 'scene' ? c.scene : c.from;
    let shot: Shot = c.kind === 'scene' ? c.shot : Array.isArray(c.shot) ? c.shot[0] : c.shot;
    if (c.kind === 'tween') {
      const u = clamp01((frame - c.at) / Math.max(1, c.dur));
      scene = tweenScene(c.from, c.to, u);
      if (Array.isArray(c.shot)) shot = lerpShot(c.shot[0], c.shot[1], u);
    }
    const sc: Shot = {center: shot.center, zoom: shot.zoom * (cr.w / Math.max(1, slotContentW))};
    const scam = viewCam(sc, cr);
    views.push(
      <View key="s" frame={frame} cam={scam} clip={clipR} world={scene} scope={{plate: spec.id}} script={script} id={`plate-${spec.id}-scene`} opacity={sceneT} background={COLOR.deck} />,
    );
    // round 3: part names inside the plate (round 4: 44 px, the answer-text rule; `tone` 'ink' for a hedge caption)
    if (spec.names && spec.names.length && (st.phase === 'slot' || whole)) {
      const nm = spec.names
        .map((n, i) => {
          if (frame < n.at) return null;
          const out = n.exitAt === undefined ? 1 : 1 - prog(frame, n.exitAt, 6, 'exit');
          if (out <= 0) return null;
          const c = project(scam, n.scenePt);
          const w = textWidth(n.text, TYPE.partName, 600) + 8;
          return (
            <div
              key={`nm${i}`}
              style={{
                position: 'absolute',
                left: c[0] - w / 2,
                top: c[1] - (TYPE.partName * TYPE.lineHeight) / 2,
                width: w,
                textAlign: 'center',
                fontFamily: SANS,
                fontWeight: 600,
                fontSize: TYPE.partName,
                lineHeight: TYPE.lineHeight,
                color: n.tone === 'ink' ? COLOR.ink : COLOR.textMuted,
                whiteSpace: 'pre',
                opacity: out * decor * sceneT,
              }}
            >
              <RevealText text={n.text} age={frame - n.at} />
            </div>
          );
        })
        .filter(Boolean);
      if (nm.length) namesLayer = <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>{nm}</div>;
    }
    // round 2: keyed tags inside the plate (anchored on the scene), each on a flat `deck` knockout (the plate's ground)
    if (spec.tags && spec.tags.length && (st.phase === 'slot' || whole)) {
      const draws = spec.tags.map((t) => ({t, d: tagAt(frame, t, scam, scene)})).filter((x): x is {t: TagSpec; d: TagDraw} => x.d !== null);
      // round 4: tags have screen slots; while a whole plate travels they ride with it (its offset from its slot)
      const ox = rect.x - slot.x;
      const oy = rect.y - slot.y;
      const ride = whole && (Math.abs(ox) > 0.01 || Math.abs(oy) > 0.01) ? `translate(${ox.toFixed(2)}px, ${oy.toFixed(2)}px)` : undefined;
      if (draws.length)
        tagLayer = (
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: decor * sceneT < 1 ? decor * sceneT : undefined, transform: ride}}>
            <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
              {draws.map(({t, d}) =>
                d.textReveal > 0 || d.keyGrow > 0 ? (
                  <path key={`ko-${t.id}`} d={rectPath(d.knockout.x, d.knockout.y, d.knockout.w, d.knockout.h, 8)} fill={COLOR.deck} opacity={d.opacity} />
                ) : null,
              )}
            </svg>
            {draws.map(({t, d}) => (
              <Tag2 key={t.id} draw={d} spec={t} />
            ))}
          </div>
        );
    }
  }

  // rules, ports, active status
  const activeOn = spec.active ? stepAt(frame, spec.active.map((a) => ({at: a.at, value: a.on})), false) : null;
  const act = activeOn ? (activeOn.value ? prog(frame, activeOn.since, 4, 'arrive') : 1 - prog(frame, activeOn.since, 4, 'arrive')) : 0;
  const outerW = lerp(PLATE.rule, PLATE.rim, act);
  const baseColor = spec.rule === 'notNow' ? COLOR.annotation : COLOR.structure;
  const outerColor = act > 0 ? mixColor(baseColor, COLOR.ink, act) : baseColor;
  const gaps = (r: SRect, rad: number) =>
    (spec.ports ?? []).map((p) => {
      const open = prog(frame, p.open, 3, 'arrive') * (1 - prog(frame, p.close, 3, 'exit'));
      return {s: edgeS(r, rad, p.side, p.y), len: PLATE.portLength * open};
    });
  const rad = PLATE.radius;
  const inner: SRect = {x: rect.x + PLATE.doubleInset, y: rect.y + PLATE.doubleInset, w: rect.w - 2 * PLATE.doubleInset, h: rect.h - 2 * PLATE.doubleInset};
  const ruleOp = Math.min(1, lift * 1.5) * decor;

  // row rail through the content
  const row = script.rows.find((r) => r.plates.includes(spec.id));
  const railOp = row ? (st.phase === 'slot' ? prog(frame, spec.peelAt + DUR.peel, 4, 'arrive') : st.phase === 'returning' ? 1 - prog(frame, spec.returnAt, 3, 'exit') : 0) : 0;

  // visited glyph events on this plate
  const visited = script.glyphs.filter((g) => g.kind === 'visited' && g.plate === spec.id) as Array<{kind: 'visited'; plate: string; at: number}>;

  // caption
  let caption: React.ReactNode = null;
  if (spec.caption) {
    const cap = spec.caption;
    const exitAt = typeof cap.exitAt === 'number' ? cap.exitAt : hold(cap.at, cap.text);
    const place: SRect =
      cap.place === 'top'
        ? {x: rect.x + PLATE.captionInset, y: rect.y + PLATE.captionInset - 6, w: rect.w - 2 * PLATE.captionInset, h: 60}
        : {x: rect.x, y: cr.y + cr.h + 14, w: rect.w, h: rect.y + rect.h - (cr.y + cr.h)};
    caption = <Caption2 spec={{text: cap.text, at: cap.at, exitAt, place, align: cap.place === 'name' ? 'center' : 'left', ghostAt: cap.ghostAt}} frame={frame} opacity={decor} />;
  }

  return (
    <>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        <path d={rectPath(rect.x, rect.y + PLATE.shadowOffset[1] * lift, rect.w, rect.h, rad)} fill={COLOR.void} fillOpacity={0.6 * lift * decor} />
        <path d={rectPath(rect.x, rect.y + PLATE.thickness * lift, rect.w, rect.h, rad)} fill={COLOR.side} opacity={decor} />
        <path d={rectPath(rect.x, rect.y, rect.w, rect.h, rad)} fill={COLOR.deck} opacity={decor} />
      </svg>
      {views}
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        {row && railOp > 0
          ? railSpans(row, spec.id, rect.x, rect.x + rect.w).map(([a, b], i) => (
              <rect key={`rail${i}`} x={a} y={row.rail.y - STROKE.route / 2} width={b - a} height={STROKE.route} fill={COLOR.structure} opacity={railOp} />
            ))
          : null}
        {visited.map((v, i) =>
          frame >= v.at ? <VisitedMark2 key={i} rect={{x: cr.x + 10, y: cr.y + 10, w: cr.w - 20, h: cr.h - 20}} draw={prog(frame, v.at, 8, 'arrive')} opacity={decor} /> : null,
        )}
        <RuleWithGaps r={rect} rad={rad} width={outerW} color={outerColor} gaps={gaps(rect, rad)} opacity={ruleOp} />
        {spec.rule === 'notNow' ? (
          <RuleWithGaps r={inner} rad={Math.max(2, rad - PLATE.doubleInset / 2)} width={PLATE.doubleInner} color={COLOR.annotation} gaps={gaps(inner, Math.max(2, rad - PLATE.doubleInset / 2))} opacity={ruleOp} />
        ) : null}
      </svg>
      {caption}
      {namesLayer}
      {tagLayer}
    </>
  );
};
