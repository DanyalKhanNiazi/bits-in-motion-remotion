/**
 * Ep03 kit: <Crate>, a crate of weights, drawn in a scene's 3D projection (an SVG component: use it inside an <svg>).
 *
 * By default it shows the owner's renders (public/ep03/assets/new): N01_weight-crate_b (side view) while the camera looks
 * at the deck side-on, N01_weight-crate_a (three-quarter view, mirrored to match the camera side) at three-quarter angles
 * and for the hero crate, cross-fading between them over a few degrees of camera yaw. The label is set on the crate's
 * blank plate (perspective-corrected on the three-quarter view). It is graded into the scene: slightly darker, a cool
 * rim light, the scene's fog, and a cyan data line along its base. `drawn` restores the vector crate (the old look).
 *
 *   <svg width={1920} height={1080}><Crate b={b} x={0} z={0} y={SET.deckY} s={0.72} h={0.56} label="≈16 GB" /></svg>
 *
 * Footprint and anchor are those of the drawn crate: centred on (x, z), standing on y, s wide; the image crate is
 * fitted to that footprint (its long side runs along the deck, +x).
 */
import React from 'react';
import {staticFile} from 'remotion';
import {PAL, SANS} from '../look';
import {clamp01, hex2rgb, quadToQuadMatrix, rgba, shadeHex, smooth, textWidth, useFontsReady, useImageReady, type Quad} from '../util';
import {faceQuad, lightOf, polyD, polyPts, project, pxPerUnit, visibleFaces, type Basis, type Box, type V3} from './geom';

/* ---------------------------------------------------------------- the renders (native px) */
type Q4 = [[number, number], [number, number], [number, number], [number, number]];
export const CRATE_RENDERS = {
  /** three-quarter view: short face left, long face (with the plate) right; foot = the front-bottom corner */
  a: {src: 'ep03/assets/new/N01_weight-crate_a.png', w: 2048, h: 2048, x0: 251, x1: 1800, foot: [681, 1601] as [number, number], plate: [[1006, 1008], [1569, 908], [1565, 1152], [1006, 1268]] as Q4},
  /** side view: the long face, plate centred; foot = the bottom-centre */
  b: {src: 'ep03/assets/new/N01_weight-crate_b.png', w: 2048, h: 1152, x0: 252, x1: 1796, foot: [1024, 975] as [number, number], plate: [[664, 507], [1387, 507], [1387, 748], [664, 748]] as Q4},
} as const;
/** The image crate's box relative to the footprint s: long side along the deck, depth, height. */
const LONG = 1.3;
const DEEP = 0.92;
const TALL = 0.62;

export type CrateProps = {
  /** the scene's projection basis */
  b: Basis;
  /** footprint centre (world units) and the surface it stands on */
  x: number;
  z: number;
  y?: number;
  /** footprint size and height (world units); defaults are the Bridge's crate */
  s?: number;
  h?: number;
  op?: number;
  /** set on the crate's plate (image crates) or stamped on its front (drawn crates) */
  label?: string;
  labelColor?: string;
  /** the hero crate: always the three-quarter render */
  hero?: boolean;
  /** which render: 'auto' (by camera yaw), 'a' (three-quarter) or 'b' (side) */
  variant?: 'auto' | 'a' | 'b';
  /** the old vector crate (fallback) */
  drawn?: boolean;
  /** a different crate image (replaces the renders; fitted like render a) */
  imageSrc?: string;
  /** id of a blur filter in the same <svg> used for the cyan glow */
  glowFilter?: string;
  /** colour transform for atmospheric depth (the Bridge passes its fog) */
  tint?: (c: string) => string;
};

const ident = (c: string) => c;
/** "≈" as a path (the latin font subset has no ≈), in a 100-unit em box. */
const APPROX_D = 'M8 44 C 16 34, 26 34, 32 42 S 48 50, 56 40 M8 66 C 16 56, 26 56, 32 64 S 48 72, 56 62';
const lum = (hex: string) => {
  const [r, g, bl] = hex2rgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * bl) / 255;
};

/** The label as SVG in a w×h box (≈ drawn as a path). */
const LabelSvg: React.FC<{text: string; w: number; h: number; color: string; size: number}> = ({text, w, h, color, size}) => {
  const approx = text.startsWith('≈');
  const rest = approx ? text.slice(1) : text;
  const gw = approx ? size * 0.66 : 0;
  const tw = textWidth(rest, size, 700, SANS);
  const x0 = w / 2 - (gw + tw) / 2;
  return (
    <>
      {approx ? <path d={APPROX_D} transform={`translate(${x0} ${h / 2 - size * 0.56}) scale(${size / 100})`} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" /> : null}
      <text x={x0 + gw} y={h / 2} dominantBaseline="central" fontFamily={SANS} fontWeight={700} fontSize={size} fill={color}>
        {rest}
      </text>
    </>
  );
};

/** The old vector crate (fallback). */
const DrawnCrate: React.FC<Required<Pick<CrateProps, 'b' | 'x' | 'z' | 'y' | 's' | 'h' | 'labelColor' | 'tint'>> & Pick<CrateProps, 'label' | 'glowFilter'>> = ({b, x, z, y, s, h, label, labelColor, glowFilter, tint}) => {
  const bx: Box = {x0: x - s / 2, x1: x + s / 2, y0: y, y1: y + h, z0: z - s / 2, z1: z + s / 2};
  const D = (pts: readonly V3[]) => polyD(b, pts);
  const nodes: React.ReactNode[] = [];
  let k = 0;
  const faces = visibleFaces(b, bx);
  for (const fc of faces) {
    if (fc.key === 'ny') continue;
    const lit = lightOf(fc.n);
    if (fc.key === 'py') {
      nodes.push(<path key={k++} d={D(fc.pts)} fill={tint(shadeHex('#16233E', lit))} />);
      const n = 3;
      const cw = s / n;
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++) {
          const q: V3[] = [
            [bx.x0 + i * cw + cw * 0.12, bx.y1 + 0.004, bx.z1 - j * cw - cw * 0.12],
            [bx.x0 + (i + 1) * cw - cw * 0.12, bx.y1 + 0.004, bx.z1 - j * cw - cw * 0.12],
            [bx.x0 + (i + 1) * cw - cw * 0.12, bx.y1 + 0.004, bx.z1 - (j + 1) * cw + cw * 0.12],
            [bx.x0 + i * cw + cw * 0.12, bx.y1 + 0.004, bx.z1 - (j + 1) * cw + cw * 0.12],
          ];
          nodes.push(<path key={k++} d={D(q)} fill={tint((i + j) % 2 ? '#DCE2EA' : '#C9D1DC')} />);
        }
      continue;
    }
    nodes.push(<path key={k++} d={D(fc.pts)} fill={tint(shadeHex('#1C2B4A', lit))} />);
    const slab = (h - 0.08 * (h / 0.4)) / 3;
    for (let i = 0; i < 3; i++) {
      const v0 = 0.08 * (h / 0.4) + i * slab + slab * 0.12;
      nodes.push(<path key={k++} d={D(faceQuad(fc, s * 0.06, v0, s * 0.94, v0 + slab * 0.78, 0.004))} fill={tint(shadeHex(i === 2 ? '#E4E9F0' : '#BAC4D2', lit))} />);
    }
    const d = D(faceQuad(fc, 0, 0, s, 0.035 * (h / 0.4), 0.006));
    nodes.push(<path key={k++} d={d} fill={PAL.info} />);
    if (glowFilter) nodes.push(<path key={k++} d={d} fill={PAL.info} opacity={0.9} filter={`url(#${glowFilter})`} style={{mixBlendMode: 'screen'}} />);
  }
  const front = faces.find((fc) => fc.key === 'pz');
  if (front && label) {
    const p = polyPts(b, faceQuad(front, s * 0.08, h * 0.18, s * 0.92, h * 0.86, 0.01));
    if (p.length === 4) {
      const wpx = Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1]);
      if (wpx > 110) {
        const BW = 440;
        const BH = 220;
        const [bl, br, , tl] = p;
        const m = [(br[0] - bl[0]) / BW, (br[1] - bl[1]) / BW, (bl[0] - tl[0]) / BH, (bl[1] - tl[1]) / BH, tl[0], tl[1]];
        nodes.push(
          <g key={k++} transform={`matrix(${m.map((v) => v.toFixed(5)).join(' ')})`} opacity={Math.min(1, (wpx - 110) / 30)}>
            <rect x={0} y={0} width={BW} height={BH} rx={18} fill="rgba(8,14,28,0.88)" stroke={rgba(labelColor, 0.9)} strokeWidth={5} />
            <LabelSvg text={label} w={BW} h={BH} color={labelColor} size={104} />
          </g>,
        );
      }
    }
  }
  return <>{nodes}</>;
};

/** One render placed on the footprint (mirror = the camera is on the crate's right). */
const RenderCrate: React.FC<{
  b: Basis;
  x: number;
  z: number;
  y: number;
  s: number;
  which: 'a' | 'b';
  src?: string;
  mirror: boolean;
  op: number;
  label?: string;
  bright: number;
  glowFilter?: string;
}> = ({b, x, z, y, s, which, src, mirror, op, label, bright, glowFilter}) => {
  const R = CRATE_RENDERS[which];
  const url = src ?? staticFile(R.src);
  useImageReady(url);
  const L = s * LONG;
  const Dp = s * DEEP;
  // anchor: the render's foot on the matching point of the footprint (front-bottom centre, or the near corner)
  const footW: V3 = which === 'b' ? [x, y, z + Dp / 2] : [x + (mirror ? L / 2 : -L / 2), y, z + Dp / 2];
  const foot = project(b, footW);
  if (!foot) return null;
  // scale: the render's crate width ↔ the projected width of the crate's box (long side along x)
  let wpx = 0;
  if (which === 'b') {
    const p0 = project(b, [x - L / 2, y, z + Dp / 2]);
    const p1 = project(b, [x + L / 2, y, z + Dp / 2]);
    if (!p0 || !p1) return null;
    wpx = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  } else {
    const xs: number[] = [];
    for (const cx of [x - L / 2, x + L / 2])
      for (const cz of [z - Dp / 2, z + Dp / 2])
        for (const cy of [y, y + s * TALL]) {
          const q = project(b, [cx, cy, cz]);
          if (!q) return null;
          xs.push(q[0]);
        }
    wpx = Math.max(...xs) - Math.min(...xs);
  }
  if (wpx < 3) return null;
  const k = wpx / (R.x1 - R.x0);
  const fx = mirror ? R.w - R.foot[0] : R.foot[0];
  const left = foot[0] - fx * k;
  const top = foot[1] - R.foot[1] * k;
  // the plate on screen (TL, TR, BR, BL), mirrored when the render is
  const P = R.plate.map(([px, py]) => [left + (mirror ? R.w - px : px) * k, top + py * k] as [number, number]);
  const plate: Q4 = mirror ? [P[1], P[0], P[3], P[2]] : [P[0], P[1], P[2], P[3]];
  const plateW = Math.hypot(plate[1][0] - plate[0][0], plate[1][1] - plate[0][1]);
  const LW = 600;
  const LH = 200;
  const rim = 'drop-shadow(0 0 1.6px rgba(168,224,255,0.75)) drop-shadow(0 0 9px rgba(0,229,255,0.22))';
  const base0 = project(b, [x - L / 2, y + 0.01, z + Dp / 2]);
  const base1 = project(b, [x + L / 2, y + 0.01, z + Dp / 2]);
  const lineW = Math.max(1.5, pxPerUnit(b, footW) * 0.03);
  return (
    <g opacity={op}>
      {base0 && base1 && glowFilter ? (
        <line x1={base0[0]} y1={base0[1]} x2={base1[0]} y2={base1[1]} stroke={PAL.info} strokeWidth={lineW * 3} strokeLinecap="round" opacity={0.85} filter={`url(#${glowFilter})`} style={{mixBlendMode: 'screen'}} />
      ) : null}
      <g transform={mirror ? `translate(${2 * left + R.w * k} 0) scale(-1 1)` : undefined}>
        <image href={url} x={left} y={top} width={R.w * k} height={R.h * k} style={{filter: `brightness(${bright.toFixed(3)}) saturate(0.9) ${rim}`}} />
      </g>
      {base0 && base1 ? <line x1={base0[0]} y1={base0[1]} x2={base1[0]} y2={base1[1]} stroke={PAL.infoPale} strokeWidth={lineW} strokeLinecap="round" opacity={0.9} /> : null}
      {label && plateW > 34 ? (
        which === 'b' ? (
          <g transform={`translate(${plate[0][0]} ${plate[0][1]}) scale(${(plate[1][0] - plate[0][0]) / LW} ${(plate[3][1] - plate[0][1]) / LH})`} opacity={clamp01((plateW - 34) / 30)}>
            <LabelSvg text={label} w={LW} h={LH} color="#0E1A33" size={112} />
          </g>
        ) : (
          <foreignObject x={0} y={0} width={1920} height={1080} opacity={clamp01((plateW - 34) / 30)} style={{overflow: 'visible', pointerEvents: 'none'}}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: LW,
                height: LH,
                transformOrigin: '0 0',
                transform: quadToQuadMatrix(
                  [
                    [0, 0],
                    [LW, 0],
                    [LW, LH],
                    [0, LH],
                  ] as unknown as Quad,
                  plate as unknown as Quad,
                ),
              }}
            >
              <svg width={LW} height={LH} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
                <LabelSvg text={label} w={LW} h={LH} color="#0E1A33" size={112} />
              </svg>
            </div>
          </foreignObject>
        )
      ) : null}
    </g>
  );
};

export const Crate: React.FC<CrateProps> = ({b, x, z, y = 2.75, s = 0.72, h = 0.56, op = 1, label, labelColor = PAL.info, hero = false, variant = 'auto', drawn = false, imageSrc, glowFilter, tint = ident}) => {
  useFontsReady();
  if (op <= 0.001 || s <= 0.001) return null;
  if (drawn) return <g opacity={op}><DrawnCrate b={b} x={x} z={z} y={y} s={s} h={h} label={label} labelColor={labelColor} glowFilter={glowFilter} tint={tint} /></g>;
  // camera yaw from the projector (all crates in a shot share it, so the choice never flickers between crates)
  const yaw = (Math.atan2(-b.f[0], -b.f[2]) * 180) / Math.PI;
  const wa = hero || variant === 'a' || imageSrc ? 1 : variant === 'b' ? 0 : smooth((Math.abs(yaw) - 12) / 8);
  const mirror = yaw > 0;
  // grade: a touch darker than the hero props, with the scene's fog (read off the tint function)
  const bright = 0.86 * (0.35 + 0.65 * Math.min(1, lum(tint('#FFFFFF'))));
  return (
    <>
      {wa < 0.999 ? <RenderCrate b={b} x={x} z={z} y={y} s={s} which="b" mirror={false} op={op * (1 - wa)} label={label} bright={bright} glowFilter={glowFilter} /> : null}
      {wa > 0.001 ? <RenderCrate b={b} x={x} z={z} y={y} s={s} which="a" src={imageSrc} mirror={mirror} op={op * wa} label={label} bright={bright} glowFilter={glowFilter} /> : null}
    </>
  );
};
