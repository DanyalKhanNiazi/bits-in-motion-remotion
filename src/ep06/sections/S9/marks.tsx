/**
 * S9 local marks (section-local props only; no wall, card, Bit, split screen or Windows UI is drawn here):
 * the collapsed-line tick + stub, the tip line, the raised palm, the rewind arc, a falling write, the safe,
 * the glyph save, the light wash and the sign-off lockup.
 */
import React from 'react';
import {EASE, KineticText, MONO, PAL, SANS, SPRING, TAU, clamp01, lerp, prog, rgba, springAt, textWidth, useFontsReady, useTextCheck} from '../../kit';
import {random} from 'remotion';

/* ---------------------------------------------------------------- a finished line: a tick + a grey stub (decor, no text) */
export const TickStub: React.FC<{frame: number; at: number; x: number; y: number; len?: number; exitAt?: number; scale?: number}> = ({frame: f, at, x, y, len = 150, exitAt, scale = 1}) => {
  if (f < at) return null;
  const s = clamp01(springAt(f, at, SPRING.snap));
  const draw = prog(f, at + 2, 8, EASE.out);
  const grow = prog(f, at + 4, 10, EASE.out);
  const ex = exitAt === undefined ? 0 : prog(f, exitAt, 8, EASE.inCubic);
  if (ex >= 1) return null;
  return (
    <svg width={(len + 70) * scale} height={40 * scale} viewBox={`0 0 ${len + 70} 40`} style={{position: 'absolute', left: x - 2, top: y - 20 * scale, overflow: 'visible', opacity: 1 - ex}}>
      <circle cx={18} cy={20} r={15 * s} fill={rgba('#070B15', 0.86)} stroke={PAL.ink} strokeWidth={2.4} />
      <path d="M10.5 20.5 L16 26 L26 14.5" fill="none" stroke={PAL.ink} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} />
      <rect x={42} y={16} width={Math.max(0, len * grow)} height={8} rx={4} fill={rgba(PAL.annotation, 0.55)} />
    </svg>
  );
};

/**
 * One must-read line of a tip (kit KineticText, plate backing). At `collapseAt` it exits and leaves a TickStub at its
 * left end, which stays until `exitAt`.
 */
export const TipLine: React.FC<{frame: number; at: number; text: string; x: number; y: number; size?: number; collapseAt?: number; exitAt?: number; mode?: 'pop' | 'rise' | 'slam'}> = ({
  frame: f,
  at,
  text,
  x,
  y,
  size = 76,
  collapseAt,
  exitAt,
  mode = 'pop',
}) => {
  const tw = textWidth(text, size, 700);
  const stubLen = Math.max(70, Math.min(220, tw * 0.16));
  return (
    <>
      <KineticText frame={f} at={at} text={text} x={x} y={y} size={size} align="left" mode={mode} backing="plate" stagger={2} exitAt={collapseAt ?? exitAt} />
      {collapseAt !== undefined ? <TickStub frame={f} at={collapseAt + 4} x={x - 14} y={y} len={stubLen} exitAt={exitAt} /> : null}
    </>
  );
};

/* ---------------------------------------------------------------- the raised palm ("stop"), line art */
export const PalmGlyph: React.FC<{frame: number; at: number; x: number; y: number; size?: number; exitAt?: number}> = ({frame: f, at, x, y, size = 180, exitAt}) => {
  if (f < at - 1) return null;
  const s = springAt(f, at, SPRING.pop);
  const ex = exitAt === undefined ? 0 : prog(f, exitAt, 9, EASE.inCubic);
  if (ex >= 1) return null;
  const ring = prog(f, at + 2, 20, EASE.out);
  const k = size / 100;
  // fingers: [x, top, height] in a 100-wide box, palm below
  const fingers: Array<[number, number, number]> = [
    [27, 14, 50],
    [41, 6, 58],
    [55, 8, 56],
    [69, 18, 46],
  ];
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(s * 2) * (1 - ex), transform: `scale(${0.6 + 0.4 * Math.min(1.08, s)}) translateY(${ex * -20}px)`}}>
      <svg width={size * 2} height={size * 2} viewBox="-50 -50 200 200" style={{position: 'absolute', left: -size, top: -size, overflow: 'visible'}}>
        <circle cx={50} cy={50} r={58 + 30 * ring} fill="none" stroke={PAL.ink} strokeWidth={2.5 / k} opacity={0.6 * (1 - ring)} />
        <circle cx={50} cy={50} r={62} fill={rgba('#070B15', 0.72)} stroke={rgba(PAL.ink, 0.35)} strokeWidth={1.5} />
        <g fill={rgba(PAL.ink, 0.12)} stroke={PAL.ink} strokeWidth={3.6} strokeLinejoin="round" strokeLinecap="round">
          {fingers.map(([fx, top, h], i) => (
            <rect key={i} x={fx - 5.5} y={top + 8} width={11} height={h} rx={5.5} />
          ))}
          <path d="M20 58 Q20 50 28 50 L72 50 Q80 50 80 60 L80 74 Q80 94 60 96 L42 96 Q30 96 24 86 L12 66 Q8 58 14 55 Q19 52 24 60 L26 63" />
        </g>
      </svg>
    </div>
  );
};

/* ---------------------------------------------------------------- rewind: a counter-clockwise arc with ◀◀ (no counter, no digits) */
export const RewindArc: React.FC<{frame: number; at: number; x: number; y: number; r: number; dur?: number}> = ({frame: f, at, x, y, r, dur = 26}) => {
  const t = f - at;
  if (t < 0 || t > dur + 12) return null;
  const u = prog(f, at, dur, EASE.inOut);
  const fade = 1 - prog(f, at + dur, 12);
  const a0 = -40;
  const a1 = a0 - 300 * u;
  const pt = (a: number) => ({x: x + r * Math.cos((a * Math.PI) / 180), y: y + r * Math.sin((a * Math.PI) / 180)});
  const p0 = pt(a0);
  const p1 = pt(a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const head = pt(a1);
  const tang = ((a1 - 90) * Math.PI) / 180;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: fade}}>
      <path d={`M${p0.x} ${p0.y} A${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`} fill="none" stroke={rgba(PAL.ink, 0.25)} strokeWidth={22} strokeLinecap="round" />
      <path d={`M${p0.x} ${p0.y} A${r} ${r} 0 ${large} 0 ${p1.x} ${p1.y}`} fill="none" stroke={PAL.ink} strokeWidth={6} strokeLinecap="round" />
      <path
        d={`M${head.x + Math.cos(tang) * 26} ${head.y + Math.sin(tang) * 26} L${head.x + Math.cos(tang + 2.4) * 22} ${head.y + Math.sin(tang + 2.4) * 22} L${head.x + Math.cos(tang - 2.4) * 22} ${head.y + Math.sin(tang - 2.4) * 22} Z`}
        fill={PAL.ink}
      />
      <g transform={`translate(${x + r * 0.95} ${y - r * 0.95}) scale(${0.9 + 0.1 * Math.sin(t * 0.9)})`} opacity={win3(t, dur)}>
        <path d="M0 -22 L-34 0 L0 22 Z M36 -22 L2 0 L36 22 Z" fill={PAL.ink} />
      </g>
    </svg>
  );
};
const win3 = (t: number, dur: number) => clamp01(t / 4) * (1 - clamp01((t - dur) / 10));

/* ---------------------------------------------------------------- a new write falling toward a box (world px); freezes mid-air */
export const WriteBlock: React.FC<{frame: number; at: number; x: number; y: number; freezeAt: number; fall?: number; seed: number}> = ({frame: f, at, x, y, freezeAt, fall = 260, seed}) => {
  if (f < at) return null;
  const tf = Math.min(f, freezeAt) - at;
  // a fall that eases toward its frozen height (it never lands)
  const u = clamp01(tf / Math.max(1, freezeAt - at));
  const yy = y - fall * (1 - EASE.out(u * 0.82)) + (f >= freezeAt ? 0.9 * Math.sin((f + seed * 13) / 9) : 0);
  const frozen = f >= freezeAt;
  const fz = frozen ? Math.exp(-(f - freezeAt) / 6) : 0;
  const streak = frozen ? 0 : 1;
  const iceA = frozen ? prog(f, freezeAt, 8) : 0;
  return (
    <g transform={`translate(${x} ${yy})`} opacity={prog(f, at, 6)}>
      {streak ? <rect x={-6} y={-150} width={12} height={130} rx={6} fill={`url(#s9-streak)`} opacity={0.75} /> : null}
      <rect x={-30} y={-20} width={60} height={38} rx={5} fill="#7D8797" />
      <rect x={-30} y={-20} width={60} height={9} rx={4} fill="#A6AFBD" />
      <rect x={-30} y={-20} width={60} height={38} rx={5} fill="none" stroke={PAL.loss} strokeWidth={3} />
      {[-15, 0, 15].map((bx) => (
        <rect key={bx} x={bx - 4} y={-2} width={8} height={8} rx={2} fill="#4D5666" />
      ))}
      {frozen ? (
        <>
          <rect x={-38} y={-28} width={76} height={54} rx={9} fill="none" stroke={PAL.ink} strokeWidth={2.5} strokeDasharray="7 6" opacity={0.85 * iceA} />
          <circle cx={0} cy={0} r={40 + 50 * (1 - fz)} fill="none" stroke={PAL.ink} strokeWidth={3} opacity={0.8 * fz} />
        </>
      ) : null}
    </g>
  );
};
/** gradient defs for WriteBlock (put once inside the svg) */
export const WriteDefs: React.FC = () => (
  <defs>
    <linearGradient id="s9-streak" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor={PAL.loss} stopOpacity={0} />
      <stop offset="1" stopColor={PAL.loss} stopOpacity={0.6} />
    </linearGradient>
  </defs>
);

/* ---------------------------------------------------------------- the safe (code; no dial numbers) */
export const Safe: React.FC<{frame: number; x: number; y: number; w: number; closeAt: number; enterAt: number}> = ({frame: f, x, y, w, closeAt, enterAt}) => {
  const h = w * 0.92;
  const ein = springAt(f, enterAt, SPRING.heavy);
  if (ein <= 0.001) return null;
  const close = prog(f, closeAt, 9, EASE.inCubic);
  const thunk = f >= closeAt + 9 ? Math.exp(-(f - closeAt - 9) / 4) : 0;
  const door = lerp(80, 0, close);
  const spin = f >= closeAt + 9 ? prog(f, closeAt + 10, 14, EASE.out) * 90 : 0;
  const dw = w * 0.78;
  const dh = h * 0.78;
  const glow = prog(f, closeAt + 8, 14) * (0.7 + 0.3 * Math.sin(f / 12));
  return (
    <div style={{position: 'absolute', left: x - w / 2, top: y - h / 2 + (1 - ein) * 60 + thunk * 4, width: w, height: h, opacity: clamp01(ein * 2)}}>
      {/* contact shadow */}
      <div style={{position: 'absolute', left: -w * 0.1, right: -w * 0.1, top: h - 20, height: 60, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))'}} />
      {/* body */}
      <div style={{position: 'absolute', inset: 0, borderRadius: w * 0.06, background: 'linear-gradient(160deg, #46566E 0%, #26324A 38%, #141B29 100%)', boxShadow: `inset 0 2px 0 rgba(220,230,245,0.45), inset 0 -6px 18px rgba(0,0,0,0.5), 0 30px 70px rgba(0,0,0,0.55)`}} />
      {/* the open interior */}
      <div style={{position: 'absolute', left: (w - dw) / 2, top: (h - dh) / 2, width: dw, height: dh, borderRadius: w * 0.03, background: 'linear-gradient(180deg, #05070C, #0C1220)', boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.9)'}}>
        <div style={{position: 'absolute', left: '10%', right: '10%', bottom: '18%', height: 4, borderRadius: 2, background: rgba(PAL.structure, 0.4)}} />
      </div>
      {/* the door, hinged on the right (it opens toward the viewer, away from the incoming key) */}
      <div style={{position: 'absolute', left: (w - dw) / 2, top: (h - dh) / 2, width: dw, height: dh, perspective: 1400, perspectiveOrigin: '100% 50%'}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '100% 50%',
            transform: `rotateY(${door}deg)`,
            borderRadius: w * 0.03,
            background: 'linear-gradient(150deg, #5A6B85 0%, #34425A 45%, #1D2638 100%)',
            boxShadow: `inset 0 2px 0 rgba(230,238,250,0.5), inset 0 0 0 2px rgba(0,0,0,0.35), 0 0 ${30 * thunk}px ${rgba(PAL.ink, 0.5 * thunk)}`,
            
          }}
        >
          {/* the handle wheel: a ring with spokes, no numbers */}
          <svg viewBox="-50 -50 100 100" style={{position: 'absolute', left: '50%', top: '50%', width: dw * 0.42, height: dw * 0.42, transform: `translate(-50%, -50%) rotate(${spin}deg)`}}>
            <circle r={40} fill="none" stroke="#C7CDD6" strokeWidth={6} />
            <circle r={40} fill="none" stroke="#0D1320" strokeWidth={1.5} strokeDasharray="2 10" />
            {[0, 60, 120].map((a) => (
              <line key={a} x1={-34 * Math.cos((a * Math.PI) / 180)} y1={-34 * Math.sin((a * Math.PI) / 180)} x2={34 * Math.cos((a * Math.PI) / 180)} y2={34 * Math.sin((a * Math.PI) / 180)} stroke="#AEB6C2" strokeWidth={5} strokeLinecap="round" />
            ))}
            <circle r={11} fill="#7E8796" stroke="#D8DEE6" strokeWidth={2} />
          </svg>
          {/* hinges */}
          {[0.18, 0.82].map((v) => (
            <div key={v} style={{position: 'absolute', right: -6, top: `${v * 100}%`, width: 14, height: dh * 0.12, transform: 'translateY(-50%)', borderRadius: 4, background: 'linear-gradient(90deg, #8E97A6, #3B4658)'}} />
          ))}
          {/* the lock lamp: amber once shut (the key's colour) */}
          <div style={{position: 'absolute', left: dw * 0.08, top: dh * 0.08, width: dw * 0.06, height: dw * 0.06, borderRadius: '50%', background: glow > 0.01 ? PAL.drive : '#2A3446', boxShadow: glow > 0.01 ? `0 0 ${18 * glow}px ${rgba(PAL.drive, 0.8 * glow)}` : undefined}} />
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- the hand-off box (item 6): an open shipping box, world px */
/**
 * x0..x1 is the front face's top edge (the mouth's front lip) at y0, the front face runs down to y1; the mouth recedes
 * `depth` px up and `inset` px in. `close` (0 open → 1 shut) folds the two side flaps over the mouth (pseudo-3D: the
 * free edge swings from leaning outward to flat), then a pale tape strip runs along the seam. Draw part 'back' under
 * the contents and 'front' over them.
 */
export const SHIP_BOX = {x0: 1400, x1: 1800, y0: 772, y1: 1010, depth: 64, inset: 26};
export const ShipBox: React.FC<{part: 'back' | 'front'; close: number; tape: number}> = ({part, close, tape}) => {
  const {x0, x1, y0, y1, depth, inset} = SHIP_BOX;
  const yb = y0 - depth;
  const mid = (x0 + x1) / 2;
  if (part === 'back')
    return (
      <g>
        <ellipse cx={mid} cy={y1 + 4} rx={(x1 - x0) * 0.62} ry={20} fill="#000" opacity={0.5} />
        {/* the mouth: back wall + dark interior */}
        <path d={`M${x0 + inset} ${yb}H${x1 - inset}L${x1} ${y0}H${x0}Z`} fill="#0A0F18" />
        <path d={`M${x0 + inset} ${yb}H${x1 - inset}`} stroke="#9FB0CC" strokeOpacity={0.35} strokeWidth={2} />
      </g>
    );
  // a flap hinged on one side edge of the mouth; θ: 150° (open, leaning out) → 0° (flat, reaching the seam)
  const th = (lerp(150, 0, EASE.inOut(clamp01(close))) * Math.PI) / 180;
  const flap = (side: -1 | 1) => {
    const L = (x1 - x0) / 2;
    const hx0 = side < 0 ? x0 : x1; // front hinge point
    const hx1 = side < 0 ? x0 + inset : x1 - inset; // back hinge point
    // the mouth is a trapezoid (narrower at the back): each closed flap is its half, so the back edge is shorter
    const ox0 = -side * L * Math.cos(th);
    const ox1 = -side * (L - inset) * Math.cos(th);
    const oy = -150 * Math.sin(th);
    const pts = [
      [hx0, y0],
      [hx1, yb],
      [hx1 + ox1, yb + oy],
      [hx0 + ox0, y0 + oy],
    ];
    const shade = 0.55 + 0.45 * Math.cos(th);
    return (
      <path
        key={side}
        d={`M${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`}
        fill={side < 0 ? '#2B3649' : '#253045'}
        fillOpacity={1}
        stroke="#9FB0CC"
        strokeOpacity={0.35 * shade}
        strokeWidth={2}
      />
    );
  };
  return (
    <g>
      <path d={`M${x0} ${y0}H${x1}L${x1 - 14} ${y1}H${x0 + 14}Z`} fill="url(#s9-box)" />
      <path d={`M${x0} ${y0 + 1}H${x1}`} stroke="#B7C6DF" strokeOpacity={0.55} strokeWidth={3} />
      <path d={`M${x1 - 1} ${y0}L${x1 - 15} ${y1}`} stroke="#9FB0CC" strokeOpacity={0.3} strokeWidth={2} />
      {/* a handling mark (an up-arrow pair, no text) */}
      <g transform={`translate(${mid} ${(y0 + y1) / 2 + 10})`} stroke="#6F7F9C" strokeOpacity={0.7} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M-26 22V-18M-40 -4L-26 -18L-12 -4M26 22V-18M12 -4L26 -18L40 -4" />
      </g>
      {flap(-1)}
      {flap(1)}
      {/* tape along the seam: over the top face, then down the front */}
      {tape > 0 ? <path d={`M${mid} ${yb + 2}L${mid} ${lerp(yb + 2, y0 + 46, clamp01(tape))}`} stroke={rgba(PAL.annotation, 0.85)} strokeWidth={22} /> : null}
    </g>
  );
};
export const ShipBoxDefs: React.FC = () => (
  <defs>
    <linearGradient id="s9-box" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#36445B" />
      <stop offset="1" stopColor="#1A2230" />
    </linearGradient>
  </defs>
);

/* ---------------------------------------------------------------- a new save that arrives as glyphs (world px); never cyan */
const GL = '#%&@$?*+=<>/{}[]~^ABDEFGHKMNPRSTVXYZ';
export const GlyphSave: React.FC<{frame: number; at: number; targets: ReadonlyArray<{x: number; y: number}>; dur?: number; height?: number; size?: number; ring?: number}> = ({
  frame: f,
  at,
  targets,
  dur = 22,
  height = 260,
  size = 26,
  ring = 0,
}) => {
  const t = f - at;
  if (t < 0 || t > dur + 14 + 14 * ring) return null;
  const items: React.ReactNode[] = [];
  const seedF = Math.floor(f / 3);
  targets.forEach((p, i) => {
    const run = Math.floor(i / 3);
    const t0 = run * 4 + (i % 3) * 2;
    for (let j = 0; j < 5; j++) {
      const tj = t - t0 - j * 2.2;
      const u = clamp01(tj / (dur * 0.55));
      if (u <= 0 || u >= 1) continue;
      const yy = p.y - height * (1 - u * u);
      const ch = GL[Math.floor(random(`s9g-${i}-${j}-${seedF}`) * GL.length)];
      items.push(
        <text key={`${i}-${j}`} x={p.x + ((j % 2 ? 9 : -9) * size) / 26} y={yy} opacity={0.9 * (1 - u * 0.3)}>
          {ch}
        </text>,
      );
    }
  });
  // landing ticks: a pale ring on each box as its glyphs arrive (ring > 0: wider, longer and brighter)
  const span = 7 + 7 * ring;
  const rings = targets.map((p, i) => {
    const run = Math.floor(i / 3);
    const land = at + run * 4 + (i % 3) * 2 + dur * 0.55 + 8;
    const w = clamp01(1 - Math.abs(f - land) / span);
    const g = 10 * (1 - w);
    return w > 0 ? <rect key={`r${i}`} x={p.x - 34 - g} y={p.y - 34 - g} width={68 + 2 * g} height={68 + 2 * g} rx={8} fill="none" stroke={PAL.ink} strokeWidth={2.5 + 2 * ring} opacity={w * (0.8 + 0.15 * ring)} /> : null;
  });
  return (
    <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g fontFamily={MONO} fontWeight={500} fontSize={size} fill={PAL.muted} textAnchor="middle">
        {items}
      </g>
      {rings}
    </svg>
  );
};
/** the frame the glyph save lands in box i (matches GlyphSave) */
export const glyphLand = (at: number, i: number, dur = 22) => at + Math.floor(i / 3) * 4 + (i % 3) * 2 + Math.round(dur * 0.55);

/* ---------------------------------------------------------------- a soft light wash crossing a region (world px; an HTML gradient, no filter) */
export const Wash: React.FC<{frame: number; at: number; dur: number; x0: number; x1: number; y0: number; y1: number; band?: number}> = ({frame: f, at, dur, x0, x1, y0, y1, band = 340}) => {
  const u = (f - at) / dur;
  if (u < -0.05 || u > 1.15) return null;
  const x = lerp(x0 - band, x1 + band * 0.3, EASE.inOut(clamp01(u)));
  const op = clamp01(u * 6) * (1 - clamp01((u - 1) / 0.15));
  return (
    <>
      <div style={{position: 'absolute', left: x - band, top: y0, width: band * 1.3, height: y1 - y0, opacity: op, background: `linear-gradient(90deg, rgba(255,255,255,0) 0%, ${rgba('#DCE8FF', 0.1)} 50%, ${rgba('#F4F8FF', 0.55)} 88%, ${rgba('#FFFFFF', 0.9)} 96%, rgba(255,255,255,0) 100%)`}} />
      <div style={{position: 'absolute', left: x0 - 40, top: y0, width: Math.max(0, x - band * 0.2 - x0 + 40), height: y1 - y0, opacity: 0.12 * op, background: '#DCE8FF'}} />
    </>
  );
};
/** world x of the wash front at a frame (matches Wash) */
export const washX = (f: number, at: number, dur: number, x0: number, x1: number, band = 340) => lerp(x0 - band, x1 + band * 0.3, EASE.inOut(clamp01((f - at) / dur))) + band * 0.25;

/* ---------------------------------------------------------------- the sign-off lockup (re-keyed: no cyan; white glow, magenta pixels) */
export const Lockup: React.FC<{frame: number; at: number}> = ({frame: f, at}) => {
  useFontsReady();
  const t = f - at;
  const bSize = 132;
  const wSize = 88;
  useTextCheck('keyword', wSize, false, 'Bits in Motion');
  if (t < -14) return null;
  const scrim = prog(f, at - 14, 28, EASE.inOut);
  const bW = textWidth('B', bSize, 700);
  const ww = textWidth('Bits in Motion', wSize, 600);
  const gap = 110;
  const total = bW + gap + ww;
  const x0 = 960 - total / 2;
  const cy = 820;
  const bIn = prog(f, at, 14, EASE.out);
  const breathe = 0.85 + 0.15 * Math.sin((TAU * t) / 70);
  const pix = [
    {s: 21, dx: 14, dy: 12},
    {s: 16, dx: 46, dy: 30},
    {s: 11, dx: 72, dy: 42},
  ];
  const bRight = x0 + bW;
  const bBase = cy + bSize * 0.36;
  const letters = 'Bits in Motion'.split('');
  let cx = 0;
  const lx = letters.map((ch) => {
    const x = cx;
    cx += textWidth(ch, wSize, 600);
    return x;
  });
  const line = prog(f, at + 6, 22, EASE.out);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 460, background: `linear-gradient(180deg, rgba(3,6,13,0) 0%, ${rgba('#03060D', 0.66 * scrim)} 42%, ${rgba('#02040A', 0.9 * scrim)} 100%)`}} />
      <div style={{position: 'absolute', left: 960 - 700, top: cy - 160, width: 1400, height: 320, borderRadius: '50%', background: `radial-gradient(closest-side, ${rgba('#02040A', 0.6 * scrim)}, rgba(2,4,10,0))`}} />
      <div style={{position: 'absolute', left: 960 - (total / 2) * line, top: cy + 60, width: total * line, height: 2, background: `linear-gradient(90deg, rgba(255,255,255,0), ${rgba(PAL.ink, 0.6)}, rgba(255,255,255,0))`}} />
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: cy,
          transform: `translateY(-50%) translateY(${(1 - bIn) * 24}px) scale(${0.94 + 0.06 * bIn})`,
          opacity: bIn,
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: bSize,
          lineHeight: 1,
          color: '#F2F6FB',
          textShadow: `0 0 14px ${rgba('#DCE8FF', 0.4 * breathe)}, 0 0 40px ${rgba('#9FB4D8', 0.25)}`,
        }}
      >
        B
      </div>
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        {pix.map((p, i) => {
          const u = prog(f, at + 4 + i * 2, 11, EASE.out);
          if (u <= 0) return null;
          const tx = bRight + p.dx;
          const ty = bBase + p.dy - bSize * 0.5;
          const x = lerp(tx + 140, tx, u);
          const y = lerp(ty + 84, ty, u);
          const col = u < 0.85 ? PAL.ink : PAL.emphasis;
          return (
            <g key={i}>
              <rect x={x - p.s * 1.4} y={y - p.s * 1.4} width={p.s * 2.8} height={p.s * 2.8} rx={p.s} fill={col} opacity={0.16 * u} />
              <rect x={x - p.s / 2} y={y - p.s / 2} width={p.s} height={p.s} rx={2} fill={col} opacity={u} />
            </g>
          );
        })}
      </svg>
      <div style={{position: 'absolute', left: x0 + bW + gap, top: cy, transform: 'translateY(-50%)', fontFamily: SANS, fontWeight: 600, fontSize: wSize, lineHeight: 1.15, color: PAL.ink, whiteSpace: 'pre', height: wSize * 1.2, width: ww + 10}}>
        {letters.map((ch, i) => {
          const e = prog(f, at + 10 + i * 1.2, 14, EASE.outExpo);
          return (
            <span key={i} style={{position: 'absolute', left: lx[i], top: 0, overflow: 'hidden', height: wSize * 1.25, display: 'inline-block'}}>
              <span style={{display: 'inline-block', transform: `translateY(${(1 - e) * 110}%)`, opacity: clamp01(e * 1.5)}}>{ch}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
};
