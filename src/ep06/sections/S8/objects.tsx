/**
 * S8 P20 "lost, stolen, or decommissioned devices": three quick objects on the hardware stage, one laptop's story.
 * A closed laptop left alone on a seat ("lost"), a hand lifts it out of frame ("stolen"), it drops into an e-waste crate
 * ("decommissioned"). Code-drawn with the kit's materials (no render exists for these); no logos, no screens.
 */
import React from 'react';
import {EASE, PAL, QuoteStrip, Stage, clamp01, lerp, prog, rgba, springAt, type CamKey} from '../../kit';
import {CUT, T} from './times';

const SEAT = {x0: 230, x1: 1110, top: 560, back: 300};
const CRATE = {x0: 1380, x1: 1860, y0: 600, y1: 900};
const LAP_W = 420;
const LIFT = T.stolen + 2; // the hand closes on the laptop
const DROP = T.decommissioned - 2; // the laptop appears above the crate and falls in
const DROP_DUR = 12;

const CAM_H: CamKey[] = [
  {f: CUT.objects, x: 700, y: 560, zoom: 1.32},
  {f: T.lost - 2, x: 680, y: 566, zoom: 1.4},
  {f: T.lost + 14, x: 820, y: 560, zoom: 0.98, ease: 'outExpo'},
  {f: DROP - 1, x: 860, y: 540, zoom: 1.0},
  {f: DROP + 14, x: 1560, y: 640, zoom: 1.22, ease: 'outExpo'},
  {f: CUT.desk + 12, x: 1580, y: 660, zoom: 1.3},
];

/** a closed laptop, slightly from above: lid top, hinge edge, front edge (centre x, y = the top face's centre) */
const Laptop: React.FC<{x: number; y: number; rot?: number; s?: number; op?: number; f: number}> = ({x, y, rot = 0, s = 1, op = 1, f}) => {
  const w = LAP_W;
  const sheen = ((f % 150) / 150) * 1.6 - 0.3;
  const d = 64; // apparent depth of the top face
  const t = 16; // thickness
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={op}>
      <ellipse cx={0} cy={d / 2 + t + 6} rx={w * 0.62} ry={20} fill="url(#s8-cshadow)" />
      <path d={`M${-w / 2 + 18} ${-d / 2}H${w / 2 - 18}L${w / 2} ${d / 2}H${-w / 2}Z`} fill="url(#s8-lid)" />
      <path d={`M${-w / 2} ${d / 2}H${w / 2}V${d / 2 + t - 4}Q${w / 2} ${d / 2 + t} ${w / 2 - 4} ${d / 2 + t}H${-w / 2 + 4}Q${-w / 2} ${d / 2 + t} ${-w / 2} ${d / 2 + t - 4}Z`} fill="#3A414D" />
      <path d={`M${-w / 2} ${d / 2 + 0.5}H${w / 2}`} stroke="#C9D1DC" strokeOpacity={0.75} strokeWidth={1.6} />
      <path d={`M${-w / 2 + 18} ${-d / 2 + 0.5}H${w / 2 - 18}`} stroke="#E6ECF4" strokeOpacity={0.5} strokeWidth={1.4} />
      <clipPath id="s8-lidclip">
        <path d={`M${-w / 2 + 18} ${-d / 2}H${w / 2 - 18}L${w / 2} ${d / 2}H${-w / 2}Z`} />
      </clipPath>
      <g clipPath="url(#s8-lidclip)">
        <path d={`M${lerp(-w, w, sheen) - 40} ${-d}l60 0l-90 ${2 * d}l-60 0Z`} fill="#FFFFFF" opacity={0.16} />
      </g>
      <path d={`M${-w * 0.12} ${d / 2 + 4}H${w * 0.12}`} stroke="#22272F" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

/** a gloved hand reaching down from the top; fingers curl over the laptop's far edge (grip 0..1) */
const Hand: React.FC<{x: number; y: number; grip: number}> = ({x, y, grip}) => {
  const curl = 10 * grip;
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* sleeve */}
      <path d="M-70 -900L70 -900L62 -150Q60 -120 30 -116H-34Q-62 -120 -64 -150Z" fill="url(#s8-sleeve)" />
      <path d="M62 -900L60 -150" stroke="#7E8CA6" strokeOpacity={0.5} strokeWidth={2} />
      {/* palm (back of the glove) */}
      <path d="M-58 -120Q-66 -60 -52 -18Q-30 6 0 6Q34 4 54 -20Q66 -60 58 -120Z" fill="url(#s8-glove)" />
      {/* fingers over the edge */}
      {[-40, -14, 12, 36].map((fx, i) => (
        <rect key={i} x={fx - 11} y={-10 + curl * 0.4} width={22} height={46 + curl - (i === 0 || i === 3 ? 8 : 0)} rx={11} fill="url(#s8-glove)" stroke="#0B0F17" strokeOpacity={0.6} strokeWidth={1.5} />
      ))}
      {/* thumb */}
      <path d="M-56 -70Q-92 -40 -84 4Q-80 20 -66 14Q-58 -14 -40 -40Z" fill="url(#s8-glove)" />
      {/* rim light */}
      <path d="M58 -120Q66 -60 54 -20Q40 -2 22 4" fill="none" stroke="#AFC1DD" strokeOpacity={0.55} strokeWidth={2.4} />
    </g>
  );
};

const Seat: React.FC<{f: number}> = () => {
  const {x0, x1, top, back} = SEAT;
  return (
    <g>
      <ellipse cx={(x0 + x1) / 2} cy={900} rx={(x1 - x0) * 0.62} ry={40} fill="url(#s8-cshadow)" />
      {/* frame and legs */}
      <path d={`M${x0 + 80} 700V896M${x1 - 80} 700V896`} stroke="#4B566A" strokeWidth={14} strokeLinecap="round" />
      <path d={`M${x0 + 60} 892H${x0 + 140}M${x1 - 140} 892H${x1 - 60}`} stroke="#5E6A80" strokeWidth={8} strokeLinecap="round" />
      {/* backrest */}
      <rect x={x0 + 20} y={back} width={x1 - x0 - 40} height={top - back + 10} rx={36} fill="url(#s8-fabric)" />
      <rect x={x0 + 20} y={back} width={x1 - x0 - 40} height={top - back + 10} rx={36} fill="none" stroke="#8FA2C2" strokeOpacity={0.28} strokeWidth={2} />
      <path d={`M${x0 + 60} ${back + 2}H${x1 - 60}`} stroke="#B7C6DF" strokeOpacity={0.4} strokeWidth={2.5} strokeLinecap="round" />
      {[0.33, 0.66].map((k) => (
        <path key={k} d={`M${lerp(x0, x1, k)} ${back + 30}V${top - 10}`} stroke="#0A0F18" strokeOpacity={0.5} strokeWidth={3} />
      ))}
      <ellipse cx={640} cy={top - 110} rx={360} ry={170} fill="url(#s8-pool)" />
      {/* cushion: top face + front */}
      <path d={`M${x0 + 30} ${top}H${x1 - 30}L${x1} ${top + 70}H${x0}Z`} fill="url(#s8-cushion)" />
      <rect x={x0} y={top + 66} width={x1 - x0} height={60} rx={16} fill="#121A29" />
      <path d={`M${x0 + 30} ${top + 1}H${x1 - 30}`} stroke="#A8B8D4" strokeOpacity={0.35} strokeWidth={2} />
    </g>
  );
};

const Crate: React.FC<{part: 'back' | 'front'}> = ({part}) => {
  const {x0, x1, y0, y1} = CRATE;
  if (part === 'back')
    return (
      <g>
        <ellipse cx={(x0 + x1) / 2} cy={y1 + 6} rx={(x1 - x0) * 0.66} ry={34} fill="url(#s8-cshadow)" />
        <path d={`M${x0 + 30} ${y0 - 70}H${x1 - 30}L${x1} ${y0}H${x0}Z`} fill="#0E141E" />
        {/* contents: an old phone slab and a cable loop */}
        <rect x={x0 + 70} y={y0 - 70} width={70} height={130} rx={10} fill="#262C36" transform={`rotate(-18 ${x0 + 105} ${y0 - 5})`} />
        <rect x={x0 + 76} y={y0 - 62} width={58} height={110} rx={6} fill="#10151D" transform={`rotate(-18 ${x0 + 105} ${y0 - 5})`} />
        <path d={`M${x1 - 160} ${y0 - 10}q40 -80 90 -40q30 30 -10 50`} fill="none" stroke="#4B5566" strokeWidth={7} strokeLinecap="round" />
      </g>
    );
  const slats = [0.22, 0.42, 0.62, 0.82];
  return (
    <g>
      <path d={`M${x0} ${y0}H${x1}L${x1 - 26} ${y1}H${x0 + 26}Z`} fill="url(#s8-crate)" />
      {slats.map((k, i) => {
        const y = lerp(y0, y1, k);
        const inset = 26 * k + 40;
        return <rect key={i} x={x0 + inset} y={y - 14} width={x1 - x0 - inset * 2} height={22} rx={11} fill="#0A0E15" opacity={0.85} />;
      })}
      <rect x={(x0 + x1) / 2 - 60} y={y0 + 22} width={120} height={26} rx={13} fill="#070A10" />
      <path d={`M${x0} ${y0 + 1}H${x1}`} stroke="#9FB0CC" strokeOpacity={0.5} strokeWidth={3} />
      <rect x={x0 - 6} y={y0 - 8} width={x1 - x0 + 12} height={16} rx={8} fill="#3A4659" />
    </g>
  );
};

/** a specular band sweeping across a clipped shape (u: 0..1 across, outside = hidden) */
const Sweep: React.FC<{clip: string; x0: number; x1: number; y0: number; y1: number; u: number; op?: number}> = ({clip, x0, x1, y0, y1, u, op = 0.22}) => {
  if (u <= 0 || u >= 1) return null;
  const x = lerp(x0 - 260, x1 + 120, EASE.inOut(u));
  return (
    <g clipPath={`url(#${clip})`}>
      <path d={`M${x} ${y0 - 20}h110l-150 ${y1 - y0 + 40}h-110Z`} fill="url(#s8-spec)" opacity={op / 0.22} />
    </g>
  );
};
const RIM = '#C9DAF7';
const rimFilter = (k: number, blur: number) =>
  `drop-shadow(0 0 1.5px ${rgba(RIM, 0.85 * k)}) drop-shadow(0 0 16px ${rgba(RIM, 0.3 * k)})${blur > 0.2 ? ` blur(${blur.toFixed(2)}px)` : ''}`;

const Defs: React.FC = () => (
  <defs>
    <linearGradient id="s8-lid" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#B4BCC8" />
      <stop offset="0.55" stopColor="#7C8593" />
      <stop offset="1" stopColor="#59616E" />
    </linearGradient>
    <linearGradient id="s8-fabric" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stopColor="#2C3B58" />
      <stop offset="0.5" stopColor="#1C273C" />
      <stop offset="1" stopColor="#111827" />
    </linearGradient>
    <linearGradient id="s8-cushion" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#384A6A" />
      <stop offset="1" stopColor="#1A2335" />
    </linearGradient>
    <radialGradient id="s8-pool" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#9DB4DA" stopOpacity={0.24} />
      <stop offset="1" stopColor="#9DB4DA" stopOpacity={0} />
    </radialGradient>
    <radialGradient id="s8-cshadow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stopColor="#000" stopOpacity={0.75} />
      <stop offset="0.6" stopColor="#000" stopOpacity={0.3} />
      <stop offset="1" stopColor="#000" stopOpacity={0} />
    </radialGradient>
    <linearGradient id="s8-spec" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
      <stop offset="0.5" stopColor="#EAF2FF" stopOpacity={0.22} />
      <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
    </linearGradient>
    <linearGradient id="s8-crate" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stopColor="#3E4D66" />
      <stop offset="0.45" stopColor="#283447" />
      <stop offset="1" stopColor="#161D2A" />
    </linearGradient>
    <linearGradient id="s8-sleeve" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#141B2A" />
      <stop offset="0.7" stopColor="#222D42" />
      <stop offset="1" stopColor="#33425F" />
    </linearGradient>
    <linearGradient id="s8-glove" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#454E5E" />
      <stop offset="1" stopColor="#1C222C" />
    </linearGradient>
    <clipPath id="s8-backclip">
      <rect x={SEAT.x0 + 20} y={SEAT.back} width={SEAT.x1 - SEAT.x0 - 40} height={SEAT.top - SEAT.back + 10} rx={36} />
    </clipPath>
    <clipPath id="s8-crateclip">
      <path d={`M${CRATE.x0} ${CRATE.y0}H${CRATE.x1}L${CRATE.x1 - 26} ${CRATE.y1}H${CRATE.x0 + 26}Z`} />
    </clipPath>
  </defs>
);
const layer = (filter: string, children: React.ReactNode) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, filter}}>
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <Defs />
      {children}
    </svg>
  </div>
);

export const ShotH: React.FC<{f: number}> = ({f}) => {
  // laptop: on the seat → lifted out of frame by the hand → falls into the crate
  const seatPos = {x: 640, y: SEAT.top + 22};
  const handIn = prog(f, LIFT - 12, 12, EASE.out);
  const lift = prog(f, LIFT + 3, 14, EASE.inCubic);
  const onSeat = f < DROP;
  const u = clamp01((f - DROP) / DROP_DUR);
  const bounce = f >= DROP + DROP_DUR ? Math.exp(-(f - DROP - DROP_DUR) / 4) * Math.sin((f - DROP - DROP_DUR) * 1.3) * 14 : 0;
  const lapSeat = onSeat ? <Laptop f={f} x={seatPos.x} y={seatPos.y - lift * 900} rot={-2 * lift} /> : null;
  const lapCrate = !onSeat ? <Laptop f={f} x={(CRATE.x0 + CRATE.x1) / 2 + 10} y={lerp(CRATE.y0 - 760, CRATE.y0 - 40, u * u) - bounce} rot={lerp(-14, 9, u)} s={0.86} /> : null;
  const handY = lerp(-300, seatPos.y - 34, handIn) - lift * 900;
  const showHand = f >= LIFT - 12 && f < DROP;
  const lostDim = prog(f, T.lost - 2, 16, EASE.out);
  // depth of field: focus on the seat, then racks to the crate as the laptop drops in
  const focus = prog(f, DROP - 6, 12, EASE.inOut);
  const seatBlur = 6 * focus;
  const crateBlur = 6 * (1 - focus);
  const sweepSeat = Math.max(prog(f, CUT.objects + 6, 40), 0) < 1 ? prog(f, CUT.objects + 6, 40) : prog(f, T.lost + 4, 34);
  const sweepCrate = prog(f, DROP + DROP_DUR + 2, 30);
  const lap0 = 0.8 + 0.2 * Math.sin(f / 20);
  return (
    <Stage
      frame={f}
      env={{kind: 'stage', spot: f < DROP ? 700 : 1600, floor: 860, warm: 0.25}}
      cam={CAM_H}
      shake={[{at: DROP + DROP_DUR, strength: 0.6}]}
      hud={<QuoteStrip frame={f} at={T.microsoft + 14} source="Microsoft" quote="lost, stolen, or … decommissioned devices" />}
    >
      {/* the crate (behind: focus racks to it on the drop) */}
      {layer(
        rimFilter(0.55 + 0.35 * focus, crateBlur),
        <>
          <Crate part="back" />
          {lapCrate}
          <Crate part="front" />
          <Sweep clip="s8-crateclip" x0={CRATE.x0} x1={CRATE.x1} y0={CRATE.y0} y1={CRATE.y1} u={sweepCrate} />
        </>,
      )}
      {/* the seat, the laptop on it and the hand */}
      {layer(
        rimFilter(0.75 * lap0 * (1 - 0.4 * focus), seatBlur),
        <>
          <Seat f={f} />
          <Sweep clip="s8-backclip" x0={SEAT.x0} x1={SEAT.x1} y0={SEAT.back} y1={SEAT.top} u={sweepSeat} />
          {lapSeat}
          {showHand ? <Hand x={seatPos.x + 10} y={handY} grip={prog(f, LIFT - 2, 6)} /> : null}
        </>,
      )}
      {/* "lost": the lights narrow onto the lonely laptop */}
      <div
        style={{
          position: 'absolute',
          left: -1500,
          top: -1500,
          width: 4920,
          height: 4080,
          background: `radial-gradient(circle at ${1500 + seatPos.x}px ${1500 + seatPos.y}px, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 260px, ${rgba('#02040A', 0.55 * lostDim * (onSeat ? 1 : 0))} 640px)`,
          pointerEvents: 'none',
        }}
      />
      {/* the drop's dust puff */}
      {f >= DROP + DROP_DUR && f < DROP + DROP_DUR + 16 ? (
        <div
          style={{
            position: 'absolute',
            left: (CRATE.x0 + CRATE.x1) / 2 - 260,
            top: CRATE.y0 - 90,
            width: 520,
            height: 140,
            borderRadius: '50%',
            background: `radial-gradient(closest-side, ${rgba(PAL.annotation, 0.3 * (1 - springAt(f, DROP + DROP_DUR, {damping: 20, stiffness: 90})))}, rgba(0,0,0,0))`,
          }}
        />
      ) : null}
    </Stage>
  );
};
