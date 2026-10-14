/**
 * Ep06 UI kit: <KeyFixture>, the drive-encryption key (encryption-key_a: case, loose key, 8-tile data tray; the baked
 * cyan LEDs regraded to amber). The key is cut out of the render as its own layer, so it can slot in, pull out and
 * shatter into amber-edged shards.
 *
 *   <KeyFixture frame={f} x={960} y={560} w={900} slotAt={a} pullAt={b} shatterAt={c} glow={1} />
 *   <KeyFixture … part="key" />     // the key alone (e.g. sitting in the write path)
 *
 * slotTo (parent px) overrides the default slot (the long groove beside the tiles); the tiles glow amber once it is in.
 */
import React from 'react';
import {random} from 'remotion';
import {EASE, PAL} from '../look';
import {Prop, propPoint, propScale, type PropProps} from '../Prop';
import {assetBox, assetUrl, type AssetName} from '../assets';
import {lerp, prog, rgba, safeId, useImageReady} from '../util';
import {UI_REGIONS, quadRegion} from './regions';
import {REGRADE, Regrade} from './shared';

export type KeyFixtureProps = Omit<PropProps, 'src' | 'children'> & {
  imageSrc?: AssetName;
  part?: 'all' | 'key' | 'base';
  slotAt?: number;
  /** slot point for the key's blade tip, parent px */
  slotTo?: {x: number; y: number; rot?: number};
  pullAt?: number;
  shatterAt?: number;
  /** amber glow on the key, 0..1 */
  glow?: number;
};

const SRC: AssetName = 'encryption-key_a';
const R = UI_REGIONS;
const SLOT_DUR = 18;
const PULL_DUR = 16;

/** The key's move at a frame: translation (native px), rotation (deg, about the tip) and scale. */
const keyMove = (f: number, slotAt?: number, pullAt?: number, slot?: {x: number; y: number; rot: number}) => {
  const tip = R.keyTip;
  const target = slot ?? {x: R.keySlot[0], y: R.keySlot[1], rot: R.keySlotRot};
  const sIn = slotAt === undefined ? 0 : prog(f, slotAt, SLOT_DUR, EASE.inOut);
  const pOut = pullAt === undefined ? 0 : prog(f, pullAt, PULL_DUR, EASE.inOut);
  // slotted pose
  const sx = (target.x - tip[0]) * sIn;
  const sy = (target.y - tip[1]) * sIn;
  const lift = Math.sin(Math.PI * sIn) * -60;
  let dx = sx;
  let dy = sy + lift;
  let rot = target.rot * sIn;
  if (pullAt !== undefined && f >= pullAt) {
    // back out along the reverse path and up off the fixture
    dx = lerp(sx, 40, pOut);
    dy = lerp(sy, -150, pOut) + Math.sin(Math.PI * pOut) * -40;
    rot = lerp(target.rot * sIn, 6, pOut);
  }
  return {dx, dy, rot, moved: sIn > 0 || pOut > 0, slotted: sIn >= 1 && pOut <= 0};
};

/** Seeded shards over the key's box: a jittered grid split into triangles (native px). */
const SHARDS = (() => {
  const [x0, y0, x1, y1] = R.keyBox;
  const nx = 5;
  const ny = 4;
  const P: Array<Array<[number, number]>> = [];
  for (let j = 0; j <= ny; j++) {
    const row: Array<[number, number]> = [];
    for (let i = 0; i <= nx; i++) {
      const edge = i === 0 || j === 0 || i === nx || j === ny;
      const jx = edge ? 0 : (random(`ks-x-${i}-${j}`) - 0.5) * ((x1 - x0) / nx) * 0.7;
      const jy = edge ? 0 : (random(`ks-y-${i}-${j}`) - 0.5) * ((y1 - y0) / ny) * 0.7;
      row.push([x0 + ((x1 - x0) * i) / nx + jx, y0 + ((y1 - y0) * j) / ny + jy]);
    }
    P.push(row);
  }
  const tris: Array<Array<[number, number]>> = [];
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const a = P[j][i];
      const b = P[j][i + 1];
      const c = P[j + 1][i + 1];
      const d = P[j + 1][i];
      if (random(`ks-d-${i}-${j}`) > 0.5) tris.push([a, b, c], [a, c, d]);
      else tris.push([a, b, d], [b, c, d]);
    }
  return tris;
})();

export const KeyFixture: React.FC<KeyFixtureProps> = ({imageSrc = SRC, part = 'all', slotAt, slotTo, pullAt, shatterAt, glow = 0, ...pp}) => {
  const f = pp.frame;
  const uid = safeId(React.useId());
  const url = assetUrl(imageSrc);
  useImageReady(url);
  const b = assetBox(imageSrc);
  const k = propScale(imageSrc, pp);
  const slotNative = slotTo ? {x: b.cx + (slotTo.x - pp.x) / k, y: b.cy + (slotTo.y - pp.y) / k, rot: slotTo.rot ?? R.keySlotRot} : undefined;
  const mv = keyMove(f, slotAt, pullAt, slotNative);
  const shattered = shatterAt !== undefined && f >= shatterAt;
  const split = mv.moved || shattered || part !== 'all';
  const pt = (x: number, y: number) => propPoint(imageSrc, pp, x, y);
  const O = 4000;
  const keyPath = R.keyPoly.map(([x, y], i) => {
    const q = pt(x, y);
    return `${i ? 'L' : 'M'}${(q.x + O).toFixed(1)} ${(q.y + O).toFixed(1)}`;
  });
  const keyPoly = R.keyPoly.map(([x, y]) => {
    const q = pt(x, y);
    return `${(q.x + O).toFixed(1)}px ${(q.y + O).toFixed(1)}px`;
  });
  const tilesOn = slotAt !== undefined && mv.slotted ? prog(f, slotAt + SLOT_DUR - 2, 8) * (pullAt !== undefined && f >= pullAt ? 1 - prog(f, pullAt, 8) : 1) : 0;
  const regrade = <Regrade src={imageSrc} boxes={R.keyCyan} filter={REGRADE.amber} />;
  // base (case + tray), with the key cut out once the key moves
  const base =
    part === 'key' ? null : (
      <div style={{position: 'absolute', left: -O, top: -O, width: 3 * O, height: 3 * O, clipPath: split ? `path(evenodd, 'M0 0 H${3 * O} V${3 * O} H0 Z ${keyPath.join(' ')} Z')` : undefined}}>
        <div style={{position: 'absolute', left: O, top: O, width: 0, height: 0}}>
          <Prop {...pp} src={imageSrc} highlight={tilesOn > 0 ? [{region: quadRegion(R.keyTiles), at: (slotAt ?? 0) + SLOT_DUR - 2, color: PAL.drive, mode: 'glow', pulse: true}] : pp.highlight}>
            {regrade}
            {tilesOn > 0 ? (
              <svg width={b.w} height={b.h} style={{position: 'absolute', left: 0, top: 0}}>
                <polygon points={R.keyTiles.map((q) => q.join(',')).join(' ')} fill={rgba(PAL.drive, 0.12 * tilesOn)} />
              </svg>
            ) : null}
          </Prop>
        </div>
      </div>
    );
  if (!split) {
    return <Prop {...pp} src={imageSrc} rim={glow > 0 ? {color: PAL.drive, strength: glow * 0.6} : pp.rim}>{regrade}</Prop>;
  }
  // key layer pivot: the blade tip (parent px)
  const tipP = pt(R.keyTip[0], R.keyTip[1]);
  const keyLayer = (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: `${tipP.x}px ${tipP.y}px`, transform: `translate(${mv.dx * k}px, ${mv.dy * k}px) rotate(${mv.rot}deg)`}}>
      <div style={{position: 'absolute', left: -O, top: -O, width: 3 * O, height: 3 * O, clipPath: `polygon(${keyPoly.join(', ')})`}}>
        <div style={{position: 'absolute', left: O, top: O, width: 0, height: 0}}>
          <Prop {...pp} src={imageSrc} shadow={false} highlight={undefined} rim={glow > 0 ? {color: PAL.drive, strength: glow} : undefined}>
            {regrade}
          </Prop>
        </div>
      </div>
    </div>
  );
  // shards
  let shards: React.ReactNode = null;
  if (shattered && part !== 'base') {
    const t = f - (shatterAt ?? 0);
    const mvS = keyMove(shatterAt ?? 0, slotAt, pullAt, slotNative);
    const c = {x: (R.keyBox[0] + R.keyBox[2]) / 2, y: (R.keyBox[1] + R.keyBox[3]) / 2};
    const flash = t < 14 ? Math.exp(-t / 3.5) : 0;
    const fade = 1 - prog(t, 12, 16);
    const origin = pt(0, 0);
    shards = (
      <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, transformOrigin: `${tipP.x}px ${tipP.y}px`, transform: `translate(${mvS.dx * k}px, ${mvS.dy * k}px) rotate(${mvS.rot}deg)`}}>
        <svg
          width={b.w}
          height={b.h}
          viewBox={`0 0 ${b.w} ${b.h}`}
          style={{position: 'absolute', left: origin.x, top: origin.y, width: b.w * k, height: b.h * k, overflow: 'visible'}}
        >
          <defs>
            {SHARDS.map((tri, i) => (
              <clipPath key={i} id={`${uid}-s${i}`} clipPathUnits="userSpaceOnUse">
                <polygon points={tri.map((p) => p.join(',')).join(' ')} />
              </clipPath>
            ))}
            <radialGradient id={`${uid}-fl`}>
              <stop offset="0" stopColor="#FFF4D6" stopOpacity={0.9} />
              <stop offset="0.35" stopColor={PAL.driveHot} stopOpacity={0.45} />
              <stop offset="1" stopColor={PAL.drive} stopOpacity={0} />
            </radialGradient>
            <clipPath id={`${uid}-key`} clipPathUnits="userSpaceOnUse">
              <polygon points={R.keyPoly.map((p) => p.join(',')).join(' ')} />
            </clipPath>
          </defs>
          {fade > 0
            ? SHARDS.map((tri, i) => {
                const mx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3;
                const my = (tri[0][1] + tri[1][1] + tri[2][1]) / 3;
                const dx = mx - c.x;
                const dy = my - c.y;
                const dl = Math.hypot(dx, dy) || 1;
                const sp = 9 + 16 * random(`ks-v-${i}`);
                const tx = (dx / dl) * sp * t;
                const ty = (dy / dl) * sp * t * 0.7 + 0.9 * t * t - 14 * t * random(`ks-u-${i}`);
                const rot = (random(`ks-r-${i}`) - 0.5) * 22 * t;
                return (
                  <g key={i} transform={`translate(${tx} ${ty}) rotate(${rot} ${mx} ${my})`} opacity={fade} clipPath={`url(#${uid}-key)`}>
                    <g clipPath={`url(#${uid}-s${i})`}>
                      <image href={url} x={0} y={0} width={b.w} height={b.h} />
                    </g>
                    <polygon points={tri.map((p) => p.join(',')).join(' ')} fill="none" stroke={rgba(PAL.drive, 0.35 + 0.6 * flash)} strokeWidth={3 / k > 12 ? 12 : 3 / k} />
                  </g>
                );
              })
            : null}
          {flash > 0.01 ? <circle cx={c.x} cy={c.y} r={160 + 280 * (1 - flash)} fill={`url(#${uid}-fl)`} opacity={flash} /> : null}
        </svg>
      </div>
    );
  }
  return (
    <>
      {base}
      {part !== 'base' && !shattered ? keyLayer : null}
      {shards}
    </>
  );
};

/** Points of a placed key fixture (parent px): the key's bow and tip at rest, the default slot and the tiles' centre. */
export const keyFixtureAnchors = (p: {x: number; y: number; w?: number; h?: number; imageSrc?: AssetName}) => {
  const src = p.imageSrc ?? SRC;
  const pt = (x: number, y: number) => propPoint(src, p, x, y);
  const T = R.keyTiles;
  return {
    keyBow: pt(R.keyBow[0], R.keyBow[1]),
    keyTip: pt(R.keyTip[0], R.keyTip[1]),
    slot: pt(R.keySlot[0], R.keySlot[1]),
    tiles: pt((T[0][0] + T[1][0] + T[2][0] + T[3][0]) / 4, (T[0][1] + T[1][1] + T[2][1] + T[3][1]) / 4),
    scale: propScale(src, p),
  };
};
