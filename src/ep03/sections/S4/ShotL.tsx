/**
 * S4 shots L–M, the payoff, built on the owner's R5 renders: "Reading it took roughly a thousand times the math of
 * writing one token, yet only about four times the wait. So the math isn't the slow part."
 * A two-row table over a dimmed macro plate. Columns: Math | Wait. Rows: Reading the prompt | Writing 1 token.
 *   "thousand"        the monumental cube drops into the Reading row and lands with weight (×1 → ×1000)
 *   "writing one…"    the Writing row fills: one block (×1), one hourglass flips in (×1)
 *   "four times…"     four hourglasses flip in one by one, each on its count (×4)
 *   "So the math…"    the verdict slams; the cube goes dark, the hourglasses glow
 * Exit: the last hourglass lifts off and becomes the ghost "?" tile S5 opens on.
 */
import React from 'react';
import {EASE, KineticText, PAL, SPRING, Stage, TokenTile, clamp01, lerp, mixHex, poseAt, prog, rgba, rnd, smooth, springAt, toScreen, type CamKey} from '../../kit';
import {T, TO, X} from './T';
import {blip} from './parts';
import {Hero, heroH} from './hero';

const smooth01 = (t: number) => smooth(clamp01(t));
/* each row reads like an equation: [title] [math item] ×n [wait items] ×n */
const MATH_X = 640;
const MULT_MATH_X = 872;
const MULT_WAIT_X = 1662;
const ROW1_Y = 270;
const ROW2_Y = 730;
const CUBE_W = 400;
const BLOCK_W = 170;
const GLASS_W = 88;
const FLOOR = ROW2_Y + heroH('cube', CUBE_W) / 2;
const GLASS2_Y = FLOOR - heroH('glass', GLASS_W) / 2;
const GLASS2_X = [1240, 1354, 1468, 1582] as const;
const WAIT_X = (GLASS2_X[0] + GLASS2_X[3]) / 2;

const CUBE1 = T.thousand2 + 2;
const CUBE0 = CUBE1 - 10;
const BLOCK1 = T.writingOne + 2;
const GLASS1 = T.writingOne + 25;
const GLASS2 = [T.fourTimes - 24, T.fourTimes - 16, T.fourTimes - 8, T.fourTimes] as const;
const VERDICT = T.mathVerdict - 3;
const TABLE_OUT = T.soVerdict - 4;

export const CAM_L: CamKey[] = [
  {f: X.whip3, x: 960, y: 540, zoom: 1.03},
  {f: CUBE0, x: 960, y: 548, zoom: 1.04, ease: 'inOut'},
  {f: VERDICT, x: 966, y: 540, zoom: 1.08, ease: 'inOut'},
  {f: X.exitAt, x: 968, y: 540, zoom: 1.09, ease: 'inOut'},
  {f: TO - 2, x: 1380, y: 780, zoom: 1.5, dur: TO - 2 - X.exitAt, ease: 'inCubic'},
];

/** an item dropping onto the floor: y offset and landing squash */
const drop = (f: number, land: number, from: number, dur = 10) => {
  if (f < land - dur) return null;
  if (f < land) return {dy: -from * (1 - EASE.inCubic((f - (land - dur)) / dur)), sy: 1.04, sx: 0.98};
  const t = f - land;
  const k = Math.exp(-t / 4) * Math.cos(t * 0.8);
  return {dy: 0, sy: 1 - 0.1 * k, sx: 1 + 0.05 * k};
};
/** an hourglass flipping in: half a turn, settling upright with a spring */
const flip = (f: number, at: number) => {
  if (f < at - 6) return null;
  const sp = springAt(f, at - 6, SPRING.snap);
  return {rot: 180 * (1 - sp), dy: -40 * (1 - Math.min(1, sp)), op: clamp01((f - (at - 6)) / 3)};
};

const ShotL: React.FC<{f: number}> = ({f}) => {
  const pose = poseAt(f, CAM_L, 1);
  const verdict = prog(f, VERDICT, 14, EASE.inOut);
  const cube = drop(f, CUBE1, 1000, 10);
  const cubeHit = blip(f, CUBE1, 1, 8);
  const block = drop(f, BLOCK1, 260, 7);
  const g1 = flip(f, GLASS1);
  const g2 = GLASS2.map((t) => flip(f, t));
  const tick = Math.max(blip(f, GLASS1, 1, 8), ...GLASS2.map((t) => blip(f, t, 1, 8)));
  const glow = (0.35 + 0.65 * verdict) * (0.7 + 0.3 * Math.sin(f / 7));
  const sweepT = f > CUBE1 + 10 ? ((f - CUBE1 - 10) % 46) / 30 : undefined;
  const slamFlash = blip(f, VERDICT + 3, 1, 6);
  // exit: the last hourglass lifts off and becomes the ghost "?" tile S5 opens on (same place, size and style)
  const M0 = X.exitAt + 4;
  const M1 = TO - 2;
  const m = EASE.inOut(prog(f, M0, M1 - M0));
  const src = toScreen(pose, GLASS2_X[3], GLASS2_Y);
  const sw = GLASS_W * pose.zoom;
  const sh = heroH('glass', GLASS_W) * pose.zoom;
  const Q = {x: 947, y: 392, w: 201, h: 200};
  const coralOp = 1 - smooth01((m - 0.45) / 0.4);
  const ghostOp = smooth01((m - 0.45) / 0.45);
  const dark = prog(f, M0, TO - M0, EASE.inOut);
  return (
    <Stage
      frame={f}
      env={{kind: 'photo', plate: 'gpu-macro', blur: 10, dim: 0.62, tint: 0.45, floor: 0.5}}
      cam={CAM_L}
      shake={[{at: CUBE1, strength: 1.0}, {at: BLOCK1, strength: 0.2}, ...GLASS2.map((t) => ({at: t, strength: 0.18})), {at: VERDICT + 3, strength: 0.7}]}
      hud={
        <>
          <KineticText frame={f} at={X.whip3 + 6} exitAt={TABLE_OUT} text="Math" mode="pop" x={MATH_X} y={104} size={64} color="#BFD3F5" />
          <KineticText frame={f} at={X.whip3 + 6} exitAt={TABLE_OUT} text="Wait" mode="pop" x={WAIT_X} y={104} size={64} color={mixHex(PAL.wait, '#FFFFFF', 0.35)} />
          <KineticText frame={f} at={T.reading9b} exitAt={TABLE_OUT} text="Reading" mode="pop" x={96} y={ROW2_Y - 34} size={64} align="left" />
          <KineticText frame={f} at={T.reading9b + 3} exitAt={TABLE_OUT} text="the prompt" mode="pop" stagger={0} x={96} y={ROW2_Y + 34} size={56} align="left" color={PAL.muted} />
          <KineticText frame={f} at={T.writingOne} exitAt={TABLE_OUT} text="Writing" mode="pop" x={96} y={ROW1_Y - 34} size={64} align="left" />
          <KineticText frame={f} at={T.writingOne + 3} exitAt={TABLE_OUT} text="1 token" mode="pop" stagger={0} x={96} y={ROW1_Y + 34} size={56} align="left" color={PAL.muted} />
          <KineticText frame={f} at={CUBE1 - 2} exitAt={X.exitAt} text="" mode="count" count={{from: 1, to: 1000, dur: 16, prefix: '×', sep: false}} x={MULT_MATH_X} y={ROW2_Y} size={96} align="left" backing="scrim" />
          <KineticText frame={f} at={BLOCK1 + 3} exitAt={TABLE_OUT} text="×1" mode="pop" x={MULT_MATH_X} y={ROW1_Y} size={84} align="left" />
          <KineticText frame={f} at={GLASS1 + 3} exitAt={TABLE_OUT} text="×1" mode="pop" x={MULT_WAIT_X} y={ROW1_Y} size={84} align="left" color={mixHex(PAL.wait, '#FFFFFF', 0.25)} />
          <KineticText frame={f} at={GLASS2[3] + 1} exitAt={X.exitAt} text="×4" mode="slam" x={MULT_WAIT_X} y={GLASS2_Y} size={88} align="left" color={mixHex(PAL.wait, '#FFFFFF', 0.25)} accent={PAL.wait} />
          <KineticText frame={f} at={VERDICT} exitAt={TO - 5} text="The math isn't the slow part." mode="slam" x={960} y={112} size={104} accent={PAL.wait} />
          {slamFlash > 0.02 ? <div style={{position: 'absolute', inset: 0, background: rgba('#FFE8E2', 0.26 * slamFlash), mixBlendMode: 'screen'}} /> : null}
          {dark > 0 ? <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at ${Q.x}px ${Q.y}px, rgba(3,6,13,${0.25 * dark}) 0%, rgba(3,6,13,${0.7 * dark}) 70%)`}} /> : null}
          {m > 0 && coralOp > 0 ? (
            <div
              style={{
                position: 'absolute',
                left: lerp(src.x, Q.x, m) - lerp(sw, Q.w, m) / 2,
                top: lerp(src.y, Q.y, m) - lerp(sh, Q.h, m) / 2,
                width: lerp(sw, Q.w, m),
                height: lerp(sh, Q.h, m),
                borderRadius: lerp(10, 32, m),
                background: `linear-gradient(180deg, ${mixHex(PAL.wait, '#FFFFFF', 0.28)}, ${PAL.wait})`,
                boxShadow: `0 0 ${40 * m}px ${rgba(PAL.wait, 0.6)}`,
                opacity: coralOp * clamp01(m * 6),
              }}
            />
          ) : null}
          {ghostOp > 0 ? (
            <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: ghostOp, transform: `scale(${lerp(0.8, 1, ghostOp)})`, transformOrigin: `${Q.x}px ${Q.y}px`}}>
              <TokenTile frame={f} text="?" x={Q.x} y={Q.y} size={133} ghost />
            </div>
          ) : null}
        </>
      }
    >
      {/* the table: two row bands */}
      {[
        {y0: ROW1_Y - 112, y1: ROW1_Y + 112, at: T.writingOne - 4},
        {y0: ROW2_Y - 262, y1: FLOOR + 28, at: T.reading9b - 4},
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 70,
            top: b.y0,
            width: 1780,
            height: b.y1 - b.y0,
            borderRadius: 28,
            background: `linear-gradient(90deg, ${rgba('#0A1426', 0.72)}, ${rgba('#0A1426', 0.42)})`,
            border: `2px solid ${rgba(PAL.structure, 0.22)}`,
            opacity: prog(f, b.at, 10) * (1 - 0.5 * verdict),
          }}
        />
      ))}
      {/* the floor shockwave when the cube lands */}
      {f >= CUBE1 && f < CUBE1 + 24 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {[0, 1].map((i) => {
            const u = clamp01((f - CUBE1 - i * 4) / 20);
            return u > 0 && u < 1 ? <ellipse key={i} cx={MATH_X} cy={FLOOR - 10} rx={240 + 420 * EASE.out(u)} ry={34 + 50 * EASE.out(u)} fill="none" stroke={PAL.infoPale} strokeWidth={4} opacity={0.8 * (1 - u)} /> : null;
          })}
          {Array.from({length: 22}, (_, i) => {
            const u = clamp01((f - CUBE1) / 18);
            const a = Math.PI + (i / 21) * Math.PI;
            const r = lerp(60, 340 + 120 * rnd(`s4l-d${i}`), EASE.out(u));
            return <circle key={`d${i}`} cx={MATH_X + Math.cos(a) * r * 1.2} cy={FLOOR - 16 + Math.sin(a) * r * 0.32} r={3 + 3 * (1 - u)} fill={PAL.infoPale} opacity={0.85 * (1 - u)} />;
          })}
        </svg>
      ) : null}
      {/* MATH, reading: the monumental cube lands with weight */}
      {cube ? (
        <Hero
          name="cube"
          x={MATH_X}
          y={ROW2_Y + cube.dy}
          w={CUBE_W}
          sx={cube.sx}
          sy={cube.sy}
          rim={{color: PAL.info, strength: (0.45 + 0.9 * cubeHit) * (1 - 0.8 * verdict)}}
          bright={1 + 0.5 * cubeHit - 0.45 * verdict}
          sweep={verdict < 1 ? sweepT : undefined}
          shadow={0.8}
        />
      ) : null}
      {/* MATH, writing one token: one block */}
      {block ? <Hero name="block" x={MATH_X} y={ROW1_Y + block.dy} w={BLOCK_W} sx={block.sx} sy={block.sy} rim={{color: PAL.info, strength: 0.4}} bright={1 - 0.3 * verdict} shadow={0.7} /> : null}
      {/* WAIT, writing one token: one hourglass */}
      {g1 ? <Hero name="glass" x={GLASS2_X[0]} y={ROW1_Y + g1.dy} w={GLASS_W} rot={g1.rot} opacity={g1.op} rim={{color: PAL.wait, strength: 0.3 + 0.5 * glow}} shadow={0.6} /> : null}
      {/* WAIT, reading: four hourglasses, each on its count */}
      {g2.map((g, i) =>
        g ? (
          <Hero
            key={i}
            name="glass"
            x={GLASS2_X[i]}
            y={GLASS2_Y + g.dy}
            w={GLASS_W}
            rot={g.rot}
            opacity={g.op * (i === 3 ? 1 - clamp01(m * 6) : 1)}
            rim={{color: PAL.wait, strength: 0.3 + 0.5 * glow + 0.6 * blip(f, GLASS2[i], 1, 8)}}
            shadow={0.6}
          />
        ) : null,
      )}
      {/* a coral pulse under each hourglass as it lands */}
      {tick > 0.02 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {[{x: GLASS2_X[0], y: ROW1_Y + 80, at: GLASS1}, ...GLASS2.map((t, i) => ({x: GLASS2_X[i], y: FLOOR - 6, at: t}))].map((p, i) => {
            const u = (f - p.at) / 14;
            return u >= 0 && u < 1 ? <ellipse key={i} cx={p.x} cy={p.y} rx={40 + 60 * EASE.out(u)} ry={10 + 14 * EASE.out(u)} fill="none" stroke={PAL.wait} strokeWidth={3} opacity={1 - u} /> : null;
          })}
        </svg>
      ) : null}
    </Stage>
  );
};

export const shotL = (f: number): React.ReactNode => <ShotL f={f} />;
