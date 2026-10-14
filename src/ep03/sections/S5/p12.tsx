/**
 * S5 · P12 shots: the H100, a fast bridge (3 TB/s) that is narrow next to the math (a huge highway beside it),
 * ≈300× as 1 s vs 5 min, the math units waiting, and 150 tokens/s ≈ ¾ of the bridge's limit.
 */
import React, {useId} from 'react';
import {Img, staticFile} from 'remotion';
import {
  Bridge,
  EASE,
  Footnote,
  KineticText,
  Label,
  MONO,
  PAL,
  Prop,
  REGIONS,
  Rich,
  SANS,
  SPRING,
  Stage,
  TAU,
  basis,
  bridgeAnchors,
  bridgeCam,
  clamp,
  clamp01,
  lerp,
  poseAt,
  project,
  propPoint,
  prog,
  regionCenter,
  rgba,
  rnd,
  safeId,
  seg,
  springAt,
  toScreen,
  track,
  type BridgeProps,
  type CamKey,
  type V3,
} from '../../kit';
import {C} from './anchors';
import {FastForwardGlyph, SpeedStreaks, SyncWords} from './parts';

/* ================================================================ SH13 · the H100 from the test */
const H_SRC = 'BIM130_T03_datacenter-gpu_b' as const;
const H = {x: 960, y: 575, w: 900};
const hbm0 = regionCenter(REGIONS.gpuB_hbm[0]);
const hDie = regionCenter(REGIONS.gpuB_die);
const beamA = propPoint(H_SRC, H, hbm0.x, 185);
const beamB = propPoint(H_SRC, H, 690, 301);
export const H_BEAM_MID = {x: (beamA.x + beamB.x) / 2, y: (beamA.y + beamB.y) / 2};
export const camH100 = (): CamKey[] => [
  {f: C.on - 8, x: 960, y: 560, zoom: 1.0},
  {f: C.test, x: 940, y: 540, zoom: 1.08, dur: 60},
  {f: C.bridge + 4, x: H_BEAM_MID.x, y: H_BEAM_MID.y, zoom: 2.0, dur: C.bridge + 4 - C.test, ease: 'inExpo'},
];

export const shH100 = (f: number) => {
  const cam = camH100();
  const pose = poseAt(f, cam);
  const dieTop = propPoint(H_SRC, H, hDie.x + 160, 300);
  const to = toScreen(pose, dieTop.x, dieTop.y);
  const beam = prog(f, C.test - 4, 10);
  const BL = Math.hypot(beamB.x - beamA.x, beamB.y - beamA.y);
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 60}}
      cam={cam}
      hud={
        <>
          <Label frame={f} at={C.nvidia} text="NVIDIA H100" size={64} screen x={1290} y={196} to={to} />
          <Footnote frame={f} at={C.test} text="H100 SXM, as in the test" size={40} />
        </>
      }
    >
      <Prop
        frame={f}
        src={H_SRC}
        {...H}
        tiltX={16}
        rot={[
          [C.on - 10, -5],
          [C.bridge + 10, 2],
        ]}
        rim={{color: PAL.info, strength: 0.4}}
        sweep={{at: [C.on + 2, C.test - 2], dur: 26}}
        shadow={0.6}
        float={3}
        highlight={[{region: REGIONS.gpuB_hbm[0], at: C.test - 6}]}
      />
      {beam > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <line x1={beamA.x} y1={beamA.y} x2={lerp(beamA.x, beamB.x, beam)} y2={lerp(beamA.y, beamB.y, beam)} stroke={PAL.info} strokeWidth={18} strokeLinecap="round" opacity={0.35} />
          <line
            x1={beamA.x}
            y1={beamA.y}
            x2={lerp(beamA.x, beamB.x, beam)}
            y2={lerp(beamA.y, beamB.y, beam)}
            stroke={PAL.infoPale}
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray="14 10"
            strokeDashoffset={-f * 6}
          />
          {void BL}
        </svg>
      ) : null}
    </Stage>
  );
};

/* ================================================================ SH14–15 · fast (3 TB/s), but narrow next to the math */
const NARROW_AT = C.narrow;
export const fastProps = (): Omit<BridgeProps, 'frame'> => ({
  view: 'threeQuarter',
  cam: [
    {f: C.bridge - 6, cam: {tx: -1.2, ty: 3.0, tz: 0.5, yaw: 34, pitch: 12, dist: 8.0, fov: 33}},
    {f: C.only, cam: {tx: 0.4, ty: 3.0, tz: 0.5, yaw: 45, pitch: 15, dist: 9.2, fov: 32}, dur: C.only - C.bridge + 6, ease: EASE.inOut},
    {f: C.which + 4, cam: {tx: 0.8, ty: 1.5, tz: 5.6, yaw: 19, pitch: 30, dist: 37, fov: 30}, dur: C.which + 4 - C.only, ease: EASE.inOut},
    {f: C.onPaper + 10, cam: {tx: 0.6, ty: 1.5, tz: 5.8, yaw: 15, pitch: 31, dist: 38.5, fov: 30}, dur: 50},
  ],
  bandwidth: [
    [NARROW_AT - 4, 0.75],
    [NARROW_AT + 14, 0.2, EASE.inOut],
  ],
  crateRate: 6,
  travel: 14,
  crateScale: 1.15,
  mathActivity: [
    [C.mathUnits - 10, 0.85],
    [C.faster, 1],
  ],
  rays: 0.5,
});

/** The math units' speed: a huge highway of light on the floor in front of the narrow bridge (same camera). */
const HWZ = {z0: 3.4, z1: 14.4, x0: -64, x1: 46, y: 0.03};
const Highway: React.FC<{frame: number; props: Omit<BridgeProps, 'frame'>}> = ({frame: f, props}) => {
  const uid = safeId(useId());
  const on = prog(f, C.next - 4, 22, EASE.out);
  if (on <= 0) return null;
  const b = basis(bridgeCam(props, f));
  const xL = lerp(6, HWZ.x0, on);
  const xR = lerp(6, HWZ.x1, on);
  const lanes = 10;
  const poly = (pts: V3[]) => {
    const q = pts.map((v) => project(b, v));
    if (q.some((v) => !v)) return '';
    return `M${q.map((v) => `${v![0].toFixed(1)} ${v![1].toFixed(1)}`).join(' L')} Z`;
  };
  const items: React.ReactNode[] = [];
  const glow: React.ReactNode[] = [];
  let k = 0;
  items.push(<path key={k++} d={poly([[xL, HWZ.y, HWZ.z0], [xR, HWZ.y, HWZ.z0], [xR, HWZ.y, HWZ.z1], [xL, HWZ.y, HWZ.z1]])} fill={rgba('#0F4A66', 0.62 * on)} />);
  items.push(<path key={k++} d={poly([[xL, HWZ.y, lerp(HWZ.z0, HWZ.z1, 0.3)], [xR, HWZ.y, lerp(HWZ.z0, HWZ.z1, 0.3)], [xR, HWZ.y, lerp(HWZ.z0, HWZ.z1, 0.7)], [xL, HWZ.y, lerp(HWZ.z0, HWZ.z1, 0.7)]])} fill={rgba(PAL.info, 0.1 * on)} />);
  for (let l = 0; l <= lanes; l++) {
    const z = lerp(HWZ.z0, HWZ.z1, l / lanes);
    const sg = seg(b, [xL, HWZ.y, z], [xR, HWZ.y, z]);
    if (!sg) continue;
    const edge = l === 0 || l === lanes;
    items.push(<line key={k++} x1={sg[0]} y1={sg[1]} x2={sg[2]} y2={sg[3]} stroke={edge ? '#E4FDFF' : PAL.info} strokeOpacity={(edge ? 0.95 : 0.4) * on} strokeWidth={edge ? 4 : 2.5} strokeDasharray={edge ? undefined : '22 16'} strokeDashoffset={-f * 9} />);
    if (edge) glow.push(<line key={k++} x1={sg[0]} y1={sg[1]} x2={sg[2]} y2={sg[3]} stroke={PAL.info} strokeWidth={16} opacity={0.75 * on} />);
  }
  const span = xR - xL;
  for (let l = 0; l < lanes; l++) {
    const z = lerp(HWZ.z0, HWZ.z1, (l + 0.5) / lanes);
    for (let j = 0; j < 10; j++) {
      const ph = rnd(`hw3-${l}-${j}`);
      const spd = 1.3 + 0.6 * rnd(`hw3s-${l}-${j}`);
      const x0 = xL + ((((f * spd + ph * 300 + j * 11.3) % (span + 6)) + span + 6) % (span + 6)) - 3;
      const sg = seg(b, [x0 - 2.6, HWZ.y + 0.02, z], [x0, HWZ.y + 0.02, z]);
      if (!sg) continue;
      const o = (0.45 + 0.5 * ph) * on;
      items.push(<line key={k++} x1={sg[0]} y1={sg[1]} x2={sg[2]} y2={sg[3]} stroke="#EAFDFF" strokeOpacity={o} strokeWidth={3.5} strokeLinecap="round" />);
      glow.push(<line key={k++} x1={sg[0]} y1={sg[1]} x2={sg[2]} y2={sg[3]} stroke={PAL.info} strokeOpacity={o} strokeWidth={11} strokeLinecap="round" />);
    }
  }
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <filter id={`${uid}-g`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
      </defs>
      {items}
      <g filter={`url(#${uid}-g)`} style={{mixBlendMode: 'screen'}}>
        {glow}
      </g>
    </svg>
  );
};
const highwayPoint = (props: Omit<BridgeProps, 'frame'>, f: number) => {
  const q = project(basis(bridgeCam(props, f)), [-4, HWZ.y, 9.4]);
  return q ? {x: q[0], y: q[1]} : {x: 960, y: 800};
};

export const shFast = (f: number) => {
  const P = fastProps();
  const an = bridgeAnchors(P, f);
  const hw = highwayPoint(P, f);
  const dir = {x: an.die.x - an.dock.x, y: an.die.y - an.dock.y};
  const m = Math.hypot(dir.x, dir.y) || 1;
  const streak = prog(f, C.bridge - 4, 10) * (1 - prog(f, C.only, 24));
  const labY = clamp(hw.y + 150, 300, 850);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      hud={
        <>
          <SpeedStreaks frame={f} dx={dir.x / m} dy={dir.y / m} amount={streak} />
          <KineticText frame={f} at={C.fast} exitAt={C.over - 4} text="Fast" mode="slam" x={960} y={170} size={120} />
          <KineticText frame={f} at={C.over} exitAt={C.only + 2} text="over" mode="pop" x={820} y={226} size={72} color={PAL.ink} align="right" />
          <KineticText frame={f} at={C.three} exitAt={C.only + 2} text="3 TB/s" mode="slam" x={1200} y={190} size={200} color={PAL.info} />
          <Label frame={f} at={C.narrow} exitAt={C.onPaper - 6} text="Narrow bridge" size={64} screen x={clamp(an.bridgeDeck.x + 60, 300, 1300)} y={clamp(an.bridgeDeck.y - 190, 200, 840)} to={an.bridgeDeck} />
          <Label frame={f} at={C.mathUnits} exitAt={C.onPaper - 6} text="Math units" size={64} screen x={clamp(hw.x - 40, 500, 1700)} y={labY} to={hw} side="left" />
          <KineticText frame={f} at={C.faster} exitAt={C.onPaper - 4} text="faster still" mode="pop" x={clamp(hw.x + 30, 300, 1370)} y={labY} size={72} color={PAL.info} align="left" backing="plate" />
        </>
      }
    >
      <Bridge frame={f} {...P} />
      <Highway frame={f} props={P} />
    </Stage>
  );
};

/* ================================================================ SH16 · ≈300×: 1 s of math vs 5 min of delivery */
const MATH_C = {x: 560, y: 600, r: 160};
const DEL_C = {x: 1350, y: 600, r: 205};

const polar = (cx: number, cy: number, r: number, deg: number) => ({x: cx + r * Math.sin((deg * Math.PI) / 180), y: cy - r * Math.cos((deg * Math.PI) / 180)});
const wedge = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  if (a1 - a0 >= 359.9) return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy} Z`;
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, a1);
  return `M ${cx} ${cy} L ${p0.x} ${p0.y} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y} Z`;
};
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p0 = polar(cx, cy, r, a0);
  const p1 = polar(cx, cy, r, Math.min(a1, a0 + 359.9));
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y}`;
};

/** The owner's stopwatch render (N08): dial centre (1024, 1193) and tick radius 475 in native px; hands drawn in code. */
const SW = {src: 'ep03/assets/new/N08_stopwatch_a.png', cx: 1024, cy: 1193, r: 475, bezel: 590};
const Dial: React.FC<{
  frame: number;
  cx: number;
  cy: number;
  r: number;
  sweep: number;
  color: string;
  hand: number;
  hand2?: number;
  sliver?: number;
  wait?: number;
  enter: number;
  glints?: readonly number[];
  handOpacity?: number;
}> = ({frame: f, cx, cy, r, sweep, color, hand, hand2, sliver = 0, wait = 0, enter, glints = [], handOpacity = 1}) => {
  const uid = safeId(useId());
  const e = springAt(f, enter, SPRING.pop);
  if (e <= 0.001) return null;
  const k = r / SW.r;
  const h1 = polar(cx, cy, r * 0.88, hand);
  const h1b = polar(cx, cy, r * 0.16, hand + 180);
  const h2 = hand2 !== undefined ? polar(cx, cy, r * 0.58, hand2) : null;
  const pulse = 0.5 + 0.5 * Math.sin((TAU * f) / 40);
  const rb = SW.bezel * k;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${cx}px ${cy}px`, transform: `scale(${Math.max(0, e)})`, opacity: clamp01(e * 2)}}>
      <div style={{position: 'absolute', left: cx - r * 0.95, top: cy + rb + 4, width: r * 1.9, height: r * 0.24, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.6), rgba(0,0,0,0))', filter: 'blur(6px)'}} />
      <Img src={staticFile(SW.src)} style={{position: 'absolute', left: cx - SW.cx * k, top: cy - SW.cy * k, width: 2048 * k, height: 2048 * k}} />
      {(() => {
        const g = glints.map((a) => (f - a) / 22).find((t) => t >= 0 && t <= 1);
        if (g === undefined) return null;
        const url = staticFile(SW.src);
        return (
          <div
            style={{
              position: 'absolute',
              left: cx - SW.cx * k,
              top: cy - SW.cy * k,
              width: 2048 * k,
              height: 2048 * k,
              background: `linear-gradient(115deg, rgba(255,255,255,0) ${lerp(-20, 110, g) - 12}%, rgba(255,255,255,${0.55 * Math.sin(Math.PI * g)}) ${lerp(-20, 110, g)}%, rgba(255,255,255,0) ${lerp(-20, 110, g) + 12}%)`,
              WebkitMaskImage: `url(${url})`,
              maskImage: `url(${url})`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              mixBlendMode: 'screen',
            }}
          />
        );
      })()}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id={`${uid}-gl`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={9} />
          </filter>
        </defs>
        {sweep > 0.001 ? (
          <>
            <path d={wedge(cx, cy, r * 0.97, 0, 360 * sweep)} fill={rgba(color, 0.24)} />
            <path d={arc(cx, cy, r * 1.0, 0, 360 * sweep)} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" />
            <path d={arc(cx, cy, r * 1.0, 0, 360 * sweep)} fill="none" stroke={color} strokeWidth={20} opacity={0.6} filter={`url(#${uid}-gl)`} />
          </>
        ) : null}
        {sliver > 0.001 ? (
          <>
            <path d={wedge(cx, cy, r, -0.6, 0.6 + 0.6 * sliver)} fill={PAL.info} opacity={sliver} />
            <path d={wedge(cx, cy, r, -0.6, 0.6 + 0.6 * sliver)} fill={PAL.info} opacity={sliver} filter={`url(#${uid}-gl)`} />
            <line x1={cx} y1={cy} x2={cx} y2={cy - r * 1.04} stroke={PAL.infoPale} strokeWidth={4} strokeLinecap="round" opacity={sliver} />
          </>
        ) : null}
        {wait > 0.01 ? (
          <>
            <circle cx={cx} cy={cy} r={rb + 16} fill="none" stroke={PAL.wait} strokeWidth={9} opacity={wait * (0.5 + 0.4 * pulse)} />
            <rect x={cx + rb * 0.78} y={cy - rb - 64} width={16} height={46} rx={4} fill={PAL.wait} opacity={wait} />
            <rect x={cx + rb * 0.78 + 26} y={cy - rb - 64} width={16} height={46} rx={4} fill={PAL.wait} opacity={wait} />
          </>
        ) : null}
        <g opacity={handOpacity}>
          {h2 ? <line x1={cx} y1={cy} x2={h2.x} y2={h2.y} stroke={PAL.ink} strokeWidth={12} strokeLinecap="round" /> : null}
          <line x1={h1b.x} y1={h1b.y} x2={h1.x} y2={h1.y} stroke={color === PAL.info ? PAL.infoPale : '#FFD9CF'} strokeWidth={6} strokeLinecap="round" />
        </g>
        <circle cx={cx} cy={cy} r={Math.max(10, r * 0.07)} fill="#E8ECF2" />
        <circle cx={cx} cy={cy} r={Math.max(4, r * 0.03)} fill={color} />
      </svg>
    </div>
  );
};

export const shClocks = (f: number) => {
  const mathSweep = prog(f, C.oneSecond, 13, EASE.inOut);
  const delStart = C.wouldTake - 4;
  const delEnd = C.five + 6;
  const del = prog(f, delStart, delEnd - delStart, (t) => t);
  const sliver = prog(f, C.delivery, 8) * (1 - prog(f, delEnd + 10, 12));
  const wait = prog(f, C.oneSecondEnd + 10, 16);
  const shakeAmp = del > 0 && del < 1 ? 1 : 0;
  const jx = shakeAmp * 3 * Math.sin(f * 2.7);
  const jy = shakeAmp * 2 * Math.cos(f * 3.3);
  const ff = del > 0 && del < 1 ? 0.6 + 0.4 * Math.sin(f * 1.4) : 0;
  const handFade = 1 - 0.85 * prog(f, delEnd, 10);
  const cam: CamKey[] = [
    {f: C.onPaper - 8, x: 960, y: 560, zoom: 0.96},
    {f: C.n300 + 6, x: 960, y: 552, zoom: 1.04, dur: C.n300 + 6 - C.onPaper},
    {f: C.ifMath, x: 770, y: 560, zoom: 1.12, dur: C.ifMath - C.longer, ease: 'inOut'},
    {f: C.oneSecondEnd + 4, x: 735, y: 566, zoom: 1.17, dur: C.oneSecondEnd + 4 - C.ifMath},
    {f: C.wouldTake + 6, x: 1180, y: 560, zoom: 1.12, dur: C.wouldTake + 6 - C.delivery + 4, ease: 'inOut'},
    {f: C.so + 6, x: 1050, y: 552, zoom: 1.03, dur: C.so + 6 - delEnd},
  ];
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 50}}
      cam={cam}
      hud={
        <>
          <Footnote frame={f} at={C.onPaper} exitAt={C.thanMath - 14} text="On paper: peak spec rates" size={44} />
          <KineticText frame={f} at={C.n300} exitAt={C.delivery - 8} text="≈300×" mode="slam" x={960} y={128} size={176} accent={PAL.wait} />
          <KineticText frame={f} at={C.longer} exitAt={C.delivery - 8} text="longer" mode="pop" x={960} y={238} size={56} color={PAL.muted} backing="none" />
        </>
      }
    >
      <Dial frame={f} cx={MATH_C.x} cy={MATH_C.y} r={MATH_C.r} sweep={mathSweep} color={PAL.info} hand={360 * mathSweep} wait={wait} enter={C.onPaper + 6} glints={[C.onPaper + 24, C.thanMath, C.oneSecond + 14]} />
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${jx}px, ${jy}px)`}}>
        <Dial
          frame={f}
          cx={DEL_C.x}
          cy={DEL_C.y}
          r={DEL_C.r}
          sweep={del}
          color={PAL.wait}
          hand={360 * 5 * del}
          hand2={360 * del}
          handOpacity={handFade}
          sliver={sliver}
          enter={C.onPaper - 4}
          glints={[C.onPaper + 10, C.n300 + 4, C.delivery]}
        />
      </div>
      <KineticText frame={f} at={C.oneSecond + 2} text="1 s" mode="slam" x={MATH_C.x} y={MATH_C.y + MATH_C.r * 0.5} size={78} color={PAL.info} backing="none" />
      <KineticText frame={f} at={C.five + 2} text="5 min" mode="slam" x={DEL_C.x} y={DEL_C.y + DEL_C.r * 0.48} size={100} color={PAL.wait} backing="none" accent={PAL.wait} />
      {ff > 0 ? (
        <div style={{position: 'absolute', left: DEL_C.x + DEL_C.r + 40, top: DEL_C.y - 30, opacity: ff}}>
          <FastForwardGlyph size={50} color={PAL.wait} />
        </div>
      ) : null}
      {[
        {t: 'Math', x: MATH_C.x, y: MATH_C.y + MATH_C.r * 1.24 + 52, at: C.thanMath - 4},
        {t: 'Delivery', x: DEL_C.x, y: Math.min(902, DEL_C.y + DEL_C.r * 1.24 + 50), at: C.delivering},
      ].map((l) => {
        const e = prog(f, l.at, 10, EASE.out);
        return e > 0 ? (
          <div key={l.t} style={{position: 'absolute', left: l.x, top: l.y, transform: `translate(-50%, -50%) translateY(${(1 - e) * 16}px)`, opacity: e, fontFamily: SANS, fontWeight: 600, fontSize: 58, color: PAL.ink}}>
            {l.t}
          </div>
        ) : null;
      })}
    </Stage>
  );
};

/* ================================================================ SH17–18 · waiting; 150 tokens/s ≈ ¾ of the limit */
const GAUGE_AT = C.nvidias;
export const waitProps = (): Omit<BridgeProps, 'frame'> => ({
  view: 'threeQuarter',
  cam: [
    {f: C.so - 4, cam: {tx: 6.1, ty: 2.7, tz: 1.8, yaw: 22, pitch: 9, dist: 10.5, fov: 30}},
    {f: GAUGE_AT - 2, cam: {tx: 6.1, ty: 2.85, tz: 1.8, yaw: 18, pitch: 10, dist: 8.6, fov: 30}, dur: GAUGE_AT - C.so},
    {f: GAUGE_AT + 40, cam: {tx: 0.8, ty: 2.6, tz: 0, yaw: 30, pitch: 19, dist: 19, fov: 30}, dur: 42, ease: EASE.inOut},
    {f: C.limitEnd + 40, cam: {tx: 0.5, ty: 2.6, tz: 0, yaw: 38, pitch: 19, dist: 18, fov: 30}, dur: C.limitEnd - GAUGE_AT},
  ],
  bandwidth: 0.2,
  crateRate: 1,
  travel: 30,
  flowFrom: C.limitWord - 30 - 30 * 13,
  mathActivity: 0.55,
  idle: [
    [C.oneUser - 6, 0.15],
    [C.spend, 0.6],
    [C.waiting, 1],
  ],
  rays: 0.35,
});

const GR = {src: 'ep03/assets/new/N10_gauge_a.png', cx: 1024, cy: 1000, r: 448};
const G = {x: 1130, y: 446, r: 198};
const gK = G.r / GR.r;
const gAng = (v: number) => 225 - 270 * v;
const gPt = (v: number, r = G.r) => ({x: G.x + r * Math.cos((gAng(v) * Math.PI) / 180), y: G.y - r * Math.sin((gAng(v) * Math.PI) / 180)});
const gArc = (v0: number, v1: number, r = G.r) => {
  const p0 = gPt(v0, r);
  const p1 = gPt(v1, r);
  const large = (v1 - v0) * 270 > 180 ? 1 : 0;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${large} 1 ${p1.x} ${p1.y}`;
};
const NEEDLE_V = 0.733;
const READ_V = 0.026;
const TRACK = 1.13;

const Gauge: React.FC<{frame: number}> = ({frame: f}) => {
  const uid = safeId(useId());
  const e = springAt(f, GAUGE_AT + 6, SPRING.soft);
  if (e <= 0.001) return null;
  const needleT = springAt(f, C.n150, {damping: 9, stiffness: 90, mass: 0.9});
  const v = NEEDLE_V * needleT + 0.004 * Math.sin(f / 5) * clamp01(needleT);
  const vFill = Math.max(0, Math.min(v, 1));
  const q = prog(f, C.threeQ - 2, 14, EASE.out);
  const lim = prog(f, C.limit - 2, 10, EASE.out);
  const rd = prog(f, C.fasterRead - 2, 10, EASE.out);
  const rt = G.r * TRACK;
  const np = gPt(clamp(v, 0, 1), G.r * 0.86);
  const nb = gPt(clamp(v, 0, 1) + 0.5 > 1 ? clamp(v, 0, 1) - 0.5 : clamp(v, 0, 1) + 0.5, G.r * 0.12);
  const lp0 = gPt(1, G.r * 0.92);
  const lp1 = gPt(1, rt + 18);
  const rp0 = gPt(READ_V, G.r * 0.92);
  const rp1 = gPt(READ_V, rt + 10);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `translateY(${(1 - Math.min(1, e)) * 160}px)`, opacity: clamp01(e * 1.6)}}>
      <Img src={staticFile(GR.src)} style={{position: 'absolute', left: G.x - GR.cx * gK, top: G.y - GR.cy * gK, width: 2048 * gK, height: 2048 * gK}} />
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <filter id={`${uid}-gl`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={9} />
          </filter>
        </defs>
        {vFill > 0.002 ? (
          <>
            <path d={gArc(0, vFill, rt)} fill="none" stroke={PAL.info} strokeWidth={16} strokeLinecap="round" />
            <path d={gArc(0, vFill, rt)} fill="none" stroke={PAL.info} strokeWidth={30} strokeLinecap="round" opacity={0.45 + 0.4 * q} filter={`url(#${uid}-gl)`} />
          </>
        ) : null}
        <path d={gArc(0.985, 1, rt)} fill="none" stroke={PAL.wait} strokeWidth={22} opacity={0.9} />
        <line x1={lp0.x} y1={lp0.y} x2={lp1.x} y2={lp1.y} stroke={PAL.ink} strokeWidth={10} strokeLinecap="round" />
        {lim > 0 ? <line x1={lp0.x} y1={lp0.y} x2={lp1.x} y2={lp1.y} stroke={PAL.ink} strokeWidth={20} opacity={0.5 * lim * (0.6 + 0.4 * Math.sin(f / 5))} filter={`url(#${uid}-gl)`} /> : null}
        <line x1={rp0.x} y1={rp0.y} x2={rp1.x} y2={rp1.y} stroke="#FFFFFF" strokeWidth={6} strokeLinecap="round" opacity={0.4 + 0.6 * rd} />
        <line x1={nb.x} y1={nb.y} x2={np.x} y2={np.y} stroke="#F4F6F9" strokeWidth={8} strokeLinecap="round" />
        <circle cx={G.x} cy={G.y} r={22} fill="#C9D0DA" stroke="#7E8796" strokeWidth={3} />
        <circle cx={G.x} cy={G.y} r={8} fill={PAL.info} />
      </svg>
    </div>
  );
};

export const shWait = (f: number) => {
  const P = waitProps();
  const an = bridgeAnchors(P, f);
  const rp = gPt(READ_V, G.r * TRACK + 10);
  const lp = gPt(1, G.r * TRACK + 18);
  const blur = track(f, [
    [GAUGE_AT, 0],
    [GAUGE_AT + 32, 6],
    [C.bridges - 6, 6],
    [C.bridges + 10, 1.2],
  ]);
  const dim = track(f, [
    [GAUGE_AT, 1],
    [GAUGE_AT + 32, 0.55],
    [C.bridges - 6, 0.55],
    [C.bridges + 10, 0.8],
  ]);
  const push = 1 + 0.06 * prog(f, C.threeQ - 4, 22, EASE.inOut);
  return (
    <Stage
      frame={f}
      env="none"
      drift={0}
      hud={
        <>
          <KineticText frame={f} at={C.oneUser} exitAt={GAUGE_AT + 8} text="One user" mode="pop" x={110} y={150} size={80} align="left" />
          <KineticText frame={f} at={C.waiting} exitAt={GAUGE_AT + 6} text="Waiting" mode="slam" x={clamp(an.dieTop.x, 500, 1500)} y={clamp(an.dieTop.y - 120, 150, 700)} size={88} color={PAL.wait} accent={PAL.wait} backing="plate" />
          <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transformOrigin: `${G.x}px ${G.y}px`, transform: `scale(${push})`}}>
            <Gauge frame={f} />
            {f >= C.n150 - 2 ? <KineticText frame={f} at={C.n150} text="" mode="count" count={{from: 0, to: 150, dur: 26}} x={G.x} y={G.y + 104} size={112} backing="none" /> : null}
            <KineticText frame={f} at={C.tokens} text="tokens/s" mode="rise" x={G.x} y={G.y + 176} size={44} color={PAL.muted} backing="none" />
          </div>
          <Label frame={f} at={C.fasterRead} text="Your reading speed" size={64} screen x={Math.min(rp.x - 120, 800)} y={rp.y + 140} to={rp} side="left" />
          <KineticText frame={f} at={C.threeQ} text="≈¾ of the limit" mode="slam" x={G.x} y={858} size={72} color={PAL.info} />
          <Label frame={f} at={C.bridges} text="Bridge limit" size={64} screen x={1360} y={lp.y + 128} to={lp} />
        </>
      }
    >
      <div style={{position: 'absolute', inset: -60, filter: blur > 0.05 ? `blur(${blur}px) brightness(${dim})` : undefined}}>
        <div style={{position: 'absolute', left: 60, top: 60, width: 1920, height: 1080}}>
          <Bridge frame={f} {...P} />
        </div>
      </div>
    </Stage>
  );
};

/* ================================================================ exit plate (frames past the section end) */
export const shExit = (f: number) => <Stage frame={f} env={{kind: 'night', grid: true, dust: 60}} cam={[{f: 9490, zoom: 1.1}, {f: 9540, zoom: 1.0}]} />;

export {Rich, lerp, track, clamp01};
