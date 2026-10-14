/**
 * A view (ENGINE.md §7): renders a world (or a scene) through a camera into the frame, with an optional clip.
 * One <svg> sized to the frame: a clip → a <g> with the camera transform (WorldLayer with vias and washes, channels,
 * routes) → a screen-space <g> (glyphs, Bits). Strokes are divided by the zoom inside the icons and layers.
 */
import React from 'react';
import {DETAIL, type PartState} from '../tokens';
import {circlePath, rectPath} from '../../shared/geom';
import {camTransform, type Cam, type Shot, type ViewCam} from '../camera/camera';
import {scopeKey, type Pt, type SRect, type ViewScope, type WRect} from '../core/types';
import type {FieldEvent} from '../field/types';
import type {FieldPing} from '../field/opacity';
import {WorldLayer} from '../world/WorldLayer';
import {glowsAt, partById, stateAt} from '../world/states';
import {blockRect, type BlockProp} from '../world/placeholder';
import type {AnyWorld} from '../world/types';
import {channelAt, ChannelV2} from '../energy/ChannelV2';
import {WashV2} from '../energy/WashV2';
import {RouteLayer} from '../signal/routes';
import {bitDraw, BitV2, type BitDraw} from '../signal/BitV2';
import {hopsFor} from '../signal/runs';
import {GlyphLayer} from '../glyphs/GlyphLayer';
import type {Script} from '../timeline/script';

export type ViewClip = SRect | {circle: Pt; r: number} | {path: string} | null;

export interface ViewProps {
  frame: number;
  /** ViewCam for plates, bands, Lens. */
  cam: Cam | ViewCam;
  clip?: ViewClip;
  world: AnyWorld;
  scope: ViewScope;
  script: Readonly<Script>;
  /** Draw signals and energy in this view (default all on). */
  layers?: {routes?: boolean; channels?: boolean; washes?: boolean; bits?: boolean; glyphs?: boolean};
  detailBias?: number;
  opacity?: number;
  /** Unique id per view (clip-path ids). Default: the scope key. */
  id?: string;
  /** Parallax reference shot (room objects). */
  refShot?: Shot;
  /** Board vias: the field's focus and events in this view's screen space (main view only). */
  field?: {focus: Pt; events: ReadonlyArray<FieldEvent>; pings?: ReadonlyArray<FieldPing>} | null;
  hide?: string[];
  /** Flat fill drawn inside the clip under the world (a Lens interior is opaque). */
  background?: string;
  /** Glyph sizes for a Lens: 1 = badge 72, eye 96; 0 = normal (a dive blends). */
  inLens?: number;
  /** Allow the faked glow in this view (default: world, Lens and bands; never plates). */
  glow?: boolean;
  /** Extra screen-space children drawn on top inside the clip. */
  children?: React.ReactNode;
  /** A screen rect this view must NOT draw into (a split's side band stays outside the main view's clip). */
  clipOut?: SRect | null;
  /** Round 3: peeled sockets ('part' / 'part.block' → 0..1) while their hero plates are out (main view). */
  ghosts?: ReadonlyMap<string, number> | null;
}

const LIT: ReadonlySet<PartState> = new Set<PartState>(['on', 'alwaysOn', 'reset', 'waiting', 'limit', 'fault']);

const clipEl = (id: string, clip: ViewClip | undefined): React.ReactNode => {
  if (!clip) return null;
  let d: string;
  if ('circle' in clip) d = circlePath(clip.circle[0], clip.circle[1], Math.max(0, clip.r));
  else if ('path' in clip) d = clip.path;
  else d = rectPath(clip.x, clip.y, Math.max(0, clip.w), Math.max(0, clip.h), clip.r ?? 0);
  return (
    <clipPath id={id}>
      <path d={d} />
    </clipPath>
  );
};

/** The world rect of a hop's receiver (a part, or one of its blocks), or null. */
export const receiverRect = (world: AnyWorld, rec: {part: string; block?: string} | undefined): (WRect & {r?: number}) | null => {
  if (!rec) return null;
  const part = partById(world, rec.part);
  if (!part) return null;
  if (!rec.block) return {...part.rect, r: 10};
  const blk = (part.props?.blocks as BlockProp[] | undefined)?.find((b) => b.key === rec.block);
  if (!blk) return null;
  return {...blockRect(part.rect, blk.rel), r: 6};
};

/** Bits that belong in a view: the exact scope; world Bits also show inside a Lens. */
export const bitsInView = (script: Readonly<Script>, scope: ViewScope) => {
  const vk = scopeKey(scope);
  return script.bits.filter((b) => {
    const bk = scopeKey(b.scope);
    if (bk.startsWith('row:')) return false;
    return bk === vk || (bk === 'world' && vk.startsWith('lens:'));
  });
};

export const View: React.FC<ViewProps> = ({
  frame,
  cam,
  clip,
  world,
  scope,
  script,
  layers,
  detailBias,
  opacity = 1,
  id,
  refShot,
  field,
  hide,
  background,
  inLens,
  glow,
  children,
  clipOut,
  ghosts,
}) => {
  if (opacity <= 0) return null;
  const vid = (id ?? scopeKey(scope)).replace(/[^a-zA-Z0-9_-]/g, '_');
  const clipId = `clip-${vid}`;
  const L = {routes: true, channels: true, washes: true, bits: true, glyphs: true, ...(layers ?? {})};
  const z = cam.zoom;
  const sk = scopeKey(scope);
  const allowGlow = glow ?? !sk.startsWith('plate:');

  // glow: only while its holder is lit in this scope
  const glows = allowGlow
    ? glowsAt(frame, script.glow).filter((g) => {
        const [pid, blk] = g.holder.split('.', 2);
        const part = partById(world, pid);
        if (!part) return false;
        const init: PartState = blk ? (((part.props?.blocks as Array<{key: string; state?: PartState}> | undefined)?.find((b) => b.key === blk)?.state) ?? 'off') : part.initial ?? 'off';
        return LIT.has(stateAt(frame, script.states, pid, blk, scope, init).state);
      })
    : [];

  // Bits in this view (world px → this camera)
  const draws: BitDraw[] = [];
  if (L.bits || L.routes) {
    for (const b of bitsInView(script, scope)) {
      const hops = hopsFor(b, world, script.rows.map((r) => ({id: r.id, rail: r.rail})));
      draws.push(
        bitDraw(
          frame,
          b,
          hops.map((h) => h.run),
          cam,
          hops.map((h) => h.routeId),
          b.hops.map((h) => receiverRect(world, h.receiver)),
        ),
      );
    }
  }

  const domains = world.domains ?? [];
  const washEls = (over: boolean) =>
    L.washes && domains.length
      ? script.washes
          .filter((e) => (e.mode === 'over') === over)
          .filter((e) => scopeKey(e.scope) === sk || (scopeKey(e.scope) === 'world' && sk !== 'world' && !sk.startsWith('row:')))
          .map((e, i) => {
            const d = domains.find((x) => x.id === e.domain);
            return d ? <WashV2 key={`wash${over ? 'o' : 'u'}${i}`} domain={d} event={e} frame={frame} zoom={z} /> : null;
          })
      : null;
  const washes = washEls(false);
  const washesOver = washEls(true);

  const channels = L.channels
    ? (world.channels ?? []).map((ch) => <ChannelV2 key={`ch-${ch.id}`} spec={ch} state={channelAt(frame, ch, script.channels, scope)} frame={frame} zoom={z} />)
    : null;

  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0, opacity, overflow: 'hidden'}}>
      <defs>
        {clipEl(clipId, clip)}
        {clipOut ? (
          <clipPath id={`${clipId}-out`}>
            <path d={`M-10 -10H1930V1090H-10Z${rectPath(clipOut.x, clipOut.y, Math.max(0, clipOut.w), Math.max(0, clipOut.h), clipOut.r ?? 0)}`} clipRule="evenodd" />
          </clipPath>
        ) : null}
      </defs>
      <g clipPath={clip ? `url(#${clipId})` : undefined}>
      <g clipPath={clipOut ? `url(#${clipId}-out)` : undefined}>
        {background ? <rect x={0} y={0} width={1920} height={1080} fill={background} /> : null}
        <g transform={camTransform(cam)}>
          <WorldLayer
            world={world}
            frame={frame}
            cam={cam}
            scope={scope}
            script={script}
            hide={hide}
            glow={glows}
            detailBias={detailBias ?? (sk === 'world' ? 1 : DETAIL.plateBias)}
            vias={field ?? null}
            refShot={refShot}
            idPrefix={vid}
            under={washes}
            ghosts={ghosts}
          />
          {washesOver}
          {channels}
          {L.routes ? <RouteLayer world={world} frame={frame} cam={cam} bits={draws} events={script.routes} scope={scope} /> : null}
        </g>
        {L.glyphs ? (
          <GlyphLayer
            events={script.glyphs}
            frame={frame}
            cam={cam}
            world={world}
            scope={scope}
            refShot={refShot}
            idPrefix={vid}
            inLens={inLens}
            hide={hide}
            states={script.states}
            ghosts={ghosts}
            main={sk !== 'world' || vid === 'main'}
          />
        ) : null}
        {L.bits ? draws.map((d, i) => <BitV2 key={`bit${i}`} draw={d} gid={`${vid}-bit${i}`} />) : null}
        {children}
      </g>
      </g>
    </svg>
  );
};
