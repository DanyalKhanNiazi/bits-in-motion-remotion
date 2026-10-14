/**
 * S9 shot 0 + the fork (section-local). The reader's desk, the fictional passport on it; the card lifts and a lit
 * route forks out of it: left road "Want it back" (3 stations), right road "Want it gone" (4 stations). Finished
 * stations carry a tick + a grey stub (decor). The photo's Bit (cyan: it is the photo's data) runs the lit road.
 */
import React from 'react';
import {
  DESK,
  KeyFixture,
  PhotoViewer,
  ScannerProp,
  KineticText,
  PAL,
  PassportCard,
  REGIONS,
  ScreenSlot,
  Stage,
  WinDesktop,
  clamp01,
  lerp,
  plateToStage,
  poseAt,
  prog,
  rgba,
  EASE,
  type KenBurns,
} from '../../kit';
import {T, CUT} from './t';

/* ---------------------------------------------------------------- desk camera (plate Ken Burns, keyed) */
type KB = {s: number; x: number; y: number};
type KbKey = {f: number} & KB;
const kbKeys = (visit: 1 | 2): KbKey[] =>
  visit === 1
    ? [
        {f: T.from - 30, s: 1.2, x: -80, y: -60},
        {f: T.back - 4, s: 1.06, x: -24, y: -6},
        {f: T.ifDeleted - 4, s: 1.6, x: -640, y: -238},
        {f: CUT.zt1 + 20, s: 1.7, x: -690, y: -262},
      ]
    : [
        {f: CUT.wh4, s: 1.62, x: -650, y: -244},
        {f: CUT.zt4 + 20, s: 1.74, x: -700, y: -270},
      ];
const kbAt = (f: number, visit: 1 | 2): KB => {
  const ks = kbKeys(visit);
  if (f <= ks[0].f) return ks[0];
  for (let i = 1; i < ks.length; i++) {
    if (f < ks[i].f) {
      const a = ks[i - 1];
      const b = ks[i];
      const e = (visit === 1 && i === 1 ? EASE.out : EASE.cam)(clamp01((f - a.f) / (b.f - a.f)));
      return {s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), e)), x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e)};
    }
  }
  return ks[ks.length - 1];
};
const kbOf = (f: number, visit: 1 | 2): KenBurns => {
  const k = kbAt(f, visit);
  return {from: k, to: k, start: 0, end: 1};
};

/* ---------------------------------------------------------------- fork geometry (screen px, relative to the lifted card) */
type P = {x: number; y: number};
const bez = (p0: P, p1: P, p2: P, p3: P, t: number): P => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};
const FORK = {
  trunk0: {x: 0, y: -150},
  j: {x: 0, y: -262},
  left: [
    {x: 0, y: -262},
    {x: 0, y: -380},
    {x: -250, y: -470},
    {x: -560, y: -500},
  ],
  right: [
    {x: 0, y: -262},
    {x: 0, y: -380},
    {x: 260, y: -470},
    {x: 600, y: -512},
  ],
  lt: [0.34, 0.62, 0.9],
  rt: [0.27, 0.49, 0.71, 0.93],
};
const branchPts = (side: 'left' | 'right', o: P, n = 36): P[] => {
  const c = FORK[side].map((p) => ({x: o.x + p.x, y: o.y + p.y}));
  return Array.from({length: n + 1}, (_, i) => bez(c[0], c[1], c[2], c[3], i / n));
};
const stationPt = (side: 'left' | 'right', o: P, i: number): P => {
  const c = FORK[side].map((p) => ({x: o.x + p.x, y: o.y + p.y}));
  const t = (side === 'left' ? FORK.lt : FORK.rt)[i];
  return bez(c[0], c[1], c[2], c[3], t);
};
const polyLen = (pts: P[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
const along = (pts: P[], d: number): P => {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (acc + l >= d) {
      const u = (d - acc) / Math.max(1e-6, l);
      return {x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u)};
    }
    acc += l;
  }
  return pts[pts.length - 1];
};
const dOf = (pts: P[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('');

/** the card's world point on the desk plate (plate px) */
const CARD_PLATE = {x: 1190, y: 748, w: 220};
/** lift of the card (0 on the desk → 1 floating at the fork base) */
const liftOf = (f: number, visit: 1 | 2) => (visit === 2 ? 1 : prog(f, T.ifDeleted - 10, 22, EASE.inOut));

/** where the card (lifted) sits on screen; the fork grows out of it */
export const forkOrigin = (f: number, visit: 1 | 2): P => {
  const kb = kbOf(f, visit);
  const pose = poseAt(f);
  const p = plateToStage(f, kb, CARD_PLATE.x, CARD_PLATE.y, pose);
  const u = liftOf(f, visit);
  return {x: p.x, y: p.y - 70 * u};
};
/** the screen point of a station (for the zoom-through) */
export const forkStation = (f: number, visit: 1 | 2, side: 'left' | 'right', i: number): P => stationPt(side, forkOrigin(f, visit), i);

/* ---------------------------------------------------------------- the fork drawing */
const Road: React.FC<{pts: P[]; lit: number; dim: number; draw: number}> = ({pts, lit, dim, draw}) => {
  const L = polyLen(pts);
  const d = dOf(pts);
  return (
    <>
      <path d={d} fill="none" stroke={rgba(PAL.structure, 0.55 * dim)} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${L * draw} ${L}`} />
      <path d={d} fill="none" stroke={rgba(PAL.annotation, 0.5 * dim)} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="10 12" opacity={draw >= 1 ? 1 : 0} />
      {lit > 0 ? (
        <>
          <path d={d} fill="none" stroke={rgba('#DCE8FF', 0.2)} strokeWidth={38} strokeLinecap="round" strokeDasharray={`${L * lit} ${L}`} />
          <path d={d} fill="none" stroke={PAL.ink} strokeWidth={9} strokeLinecap="round" strokeDasharray={`${L * lit} ${L}`} />
        </>
      ) : null}
    </>
  );
};

const Station: React.FC<{p: P; f: number; lit: number; done: number; active: number}> = ({p, f, lit, done, active}) => {
  const pulse = active > 0 ? ((f % 36) / 36) : 0;
  return (
    <g transform={`translate(${p.x} ${p.y})`}>
      {active > 0 ? <circle r={20 + 26 * pulse} fill="none" stroke={PAL.ink} strokeWidth={3} opacity={0.6 * (1 - pulse) * active} /> : null}
      <circle r={20} fill="#070B15" stroke={lit > 0 ? PAL.ink : rgba(PAL.structure, 0.8)} strokeWidth={lit > 0 ? 4 : 3} />
      {done > 0 ? (
        <>
          <circle r={20 * done} fill={PAL.ink} />
          <path d="M-8 0.5 L-2.5 6 L8.5 -6" fill="none" stroke="#070B15" strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" opacity={done} />
          <rect x={26} y={-4} width={56 * done} height={8} rx={4} fill={rgba(PAL.annotation, 0.55)} />
        </>
      ) : lit > 0 ? (
        <circle r={6} fill={PAL.ink} opacity={lit} />
      ) : null}
    </g>
  );
};

/** the photo's Bit running the road (from the trunk base to station i) */
const BitRun: React.FC<{pts: P[]; u: number}> = ({pts, u}) => {
  if (u <= 0 || u >= 1.02) return null;
  const L = polyLen(pts);
  const marks = [0, 0.03, 0.06, 0.09].map((lag, i) => {
    const q = along(pts, L * clamp01(u - lag));
    const s = 22 - i * 4;
    return <rect key={i} x={q.x - s / 2} y={q.y - s / 2} width={s} height={s} rx={s * 0.24} fill={PAL.photo} opacity={i === 0 ? 1 : 0.45 - i * 0.1} />;
  });
  return <g>{marks}</g>;
};

/** route points from the trunk base up to station i on a side */
const routeTo = (o: P, side: 'left' | 'right', i: number): P[] => {
  const trunk = [{x: o.x + FORK.trunk0.x, y: o.y + FORK.trunk0.y}, {x: o.x, y: o.y + FORK.j.y}];
  const c = FORK[side].map((p) => ({x: o.x + p.x, y: o.y + p.y}));
  const t1 = (side === 'left' ? FORK.lt : FORK.rt)[i];
  const n = 28;
  const br = Array.from({length: n + 1}, (_, k) => bez(c[0], c[1], c[2], c[3], (k / n) * t1));
  return [...trunk, ...br.slice(1)];
};

const ForkDrawing: React.FC<{f: number; visit: 1 | 2; o: P}> = ({f, visit, o}) => {
  const appear = visit === 1 ? prog(f, T.ifDeleted - 12, 16, EASE.out) : 1;
  const leftLit = visit === 1 ? prog(f, T.ifDeleted, 16, EASE.inOut) : 1;
  const rightLit = visit === 2 ? prog(f, T.ifWant, 16, EASE.inOut) : 0;
  const L = branchPts('left', o);
  const R = branchPts('right', o);
  const trunk = [{x: o.x + FORK.trunk0.x, y: o.y + FORK.trunk0.y}, {x: o.x, y: o.y + FORK.j.y}];
  const trunkLit = visit === 1 ? prog(f, T.ifDeleted - 6, 8) : 1;
  const run = visit === 1 ? prog(f, T.ifDeleted + 16, CUT.zt1 - T.ifDeleted - 12, EASE.inOut) : prog(f, T.ifWant + 6, CUT.zt4 - T.ifWant - 6, EASE.inOut);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {/* a faint pool of light under the card */}
      <ellipse cx={o.x} cy={o.y + 150} rx={300} ry={60} fill={rgba('#DCE8FF', 0.06 * appear)} />
      <Road pts={trunk} lit={trunkLit} dim={appear} draw={appear} />
      <Road pts={L} lit={leftLit} dim={appear} draw={appear} />
      <Road pts={R} lit={rightLit} dim={appear} draw={appear} />
      <circle cx={o.x} cy={o.y + FORK.j.y} r={11} fill={PAL.ink} opacity={appear} />
      {FORK.lt.map((_, i) => {
        const p = stationPt('left', o, i);
        const done = visit === 2 ? 1 : 0;
        const active = visit === 1 && i === 0 ? prog(f, T.ifDeleted + 10, 8) : 0;
        return appear > 0.2 ? <Station key={`l${i}`} p={p} f={f} lit={leftLit > (FORK.lt[i] - 0.05) ? 1 : 0} done={done} active={active} /> : null;
      })}
      {FORK.rt.map((_, i) => {
        const p = stationPt('right', o, i);
        const active = visit === 2 && i === 0 ? prog(f, T.ifWant + 10, 8) : 0;
        return appear > 0.2 ? <Station key={`r${i}`} p={p} f={f} lit={rightLit > FORK.rt[i] - 0.05 ? 1 : 0} done={0} active={active} /> : null;
      })}
      <BitRun pts={routeTo(o, visit === 1 ? 'left' : 'right', 0)} u={run} />
    </svg>
  );
};

/* ---------------------------------------------------------------- the shot */
export const ForkShot: React.FC<{f: number; visit: 1 | 2}> = ({f, visit}) => {
  const kb = kbOf(f, visit);
  const forkOn = visit === 2 ? 1 : prog(f, T.ifDeleted - 14, 18, EASE.inOut);
  const pose = poseAt(f);
  const cardP = plateToStage(f, kb, CARD_PLATE.x, CARD_PLATE.y, pose);
  const u = liftOf(f, visit);
  const o = forkOrigin(f, visit);
  const leftLbl = stationPt('left', o, 2);
  const rightLbl = stationPt('right', o, 3);
  return (
    <Stage
      frame={f}
      env={{
        kind: 'photo',
        plate: 'reader-desk',
        kb,
        blur: 9 * forkOn,
        dim: lerp(0.12, 0.64, forkOn),
        children: (
          <>
            {/* S8's last frame continues: the photo open on the monitor, the scanner's copy done; the key slotted on the desk */}
            <ScreenSlot rect={REGIONS.deskScreen}>
              <WinDesktop frame={f} w={DESK.slotW} h={DESK.slotH}>
                <PhotoViewer frame={f} x={528} y={34} w={474} h={430} openAt={T.from - 400} />
                {visit === 1 && f < T.back + 20 ? (
                  <ScannerProp frame={f} x={262} y={268} w={440} tray="photo" trayAt={T.from - 200} fillDur={40} shadow={0.5} exit={{kind: 'sink', at: T.from + 10, dur: 16}} />
                ) : null}
              </WinDesktop>
            </ScreenSlot>
            <KeyFixture frame={f} x={1500} y={842} w={300} slotAt={T.from - 300} glow={0.5} shadow={0.6} float={1} />
          </>
        ),
      }}
      hud={
        <>
          {visit === 1 ? <KineticText frame={f} at={T.back} exitAt={T.ifDeleted - 10} text="Back to the passport photo" x={960} y={190} size={92} mode="rise" /> : null}
          <KineticText frame={f} at={visit === 1 ? T.ifDeleted + 2 : T.ifWant - 30} text="Want it back" x={leftLbl.x + 40} y={leftLbl.y - 92} size={84} mode={visit === 1 ? 'pop' : 'pop'} />
          {visit === 2 ? <KineticText frame={f} at={T.ifWant + 2} text="Want it gone" x={rightLbl.x - 60} y={rightLbl.y - 92} size={84} mode="pop" /> : null}
        </>
      }
    >
      {forkOn > 0 ? <div style={{position: 'absolute', inset: 0, opacity: forkOn}}><ForkDrawing f={f} visit={visit} o={o} /></div> : null}
      <PassportCard
        frame={f}
        variant="desk"
        x={cardP.x}
        y={cardP.y}
        w={CARD_PLATE.w * cardP.scale * lerp(1, 0.82, u)}
        rot={lerp(-12, -3, u)}
        tiltX={lerp(44, 10, u)}
        float={2 * u}
        shadow={{opacity: lerp(0.6, 0.1, u), dy: lerp(-10, 24, u)}}
        rim={u > 0 ? {color: PAL.ink, strength: 0.5 * u} : undefined}
        sweep={{at: [T.passport - 4, T.ifDeleted + 6], dur: 18}}
        nudge={{dy: -70 * u}}
      />
    </Stage>
  );
};
