/**
 * S9 shots 2–3 (P22 opening): back to our question. The 11 question tiles snap in on the spoken words (the Bit hops
 * tile to tile), then the answer is written one tile at a time and every new tile pulls glowing threads from ALL the
 * tiles before it (question and answer): each piece depends on the ones before it. "Made in order" lights the chain.
 */
import React, {useId} from 'react';
import {BitHead, EASE, KineticText, PAL, SANS, Stage, TAU, TokenTile, lerp, poseAt, prog, rgba, safeId, tileH, tileRowLayout, toScreen, useFontsReady, type CamKey} from '../../kit';
import {A} from './anchors';

const Q = ['Why', 'do', 'AI', 'answers', 'arrive', 'one', 'piece', 'at', 'a', 'time', '?'];
const ANS = ['Because', 'each', 'piece', 'depends', 'on', 'the', 'ones', 'before', 'it'];
const QS = 88;
const AS = 76;
const QC = {x: 960, y: 300};
const AC = {x: 960, y: 790};
const qSnap: number[] = [...A.qWords, A.qEnd - 3];
const aSnap: number[] = [A.aBecause, A.aEach, A.aPiece, A.aDepend, ...A.aOnTheOnes];

export const Q_CAM: CamKey[] = [
  {f: A.so - 14, x: 930, y: 300, zoom: 1.13, rot: -0.4},
  {f: A.qWords[0], x: 945, y: 298, zoom: 1.08, rot: -0.2, ease: 'inOut'},
  {f: A.qEnd, x: 985, y: 332, zoom: 1.05, rot: 0.2, ease: 'inOut'},
  {f: A.because - 2, x: 960, y: 336, zoom: 1.02, rot: 0, ease: 'inOut'},
  {f: A.aPiece + 6, x: 960, y: 566, zoom: 0.86, ease: 'inOut'},
  {f: A.soThe, x: 960, y: 600, zoom: 0.9, ease: 'inOut'},
  {f: A.made + 4, x: 960, y: 760, zoom: 1.06, ease: 'inOut'},
  {f: A.and + 40, x: 960, y: 772, zoom: 1.12, ease: 'inOut'},
];

type Lay = {xs: number[]; ys: number[]; ws: number[]};
const useLayouts = (): {q: Lay; a: Lay} => {
  useFontsReady();
  const lq = tileRowLayout(Q, QS, 18, undefined, 1700);
  const la = tileRowLayout(ANS, AS, 16, undefined, 1640);
  return {
    q: {xs: lq.xs.map((x) => QC.x + x), ys: lq.ys.map((y) => QC.y + y), ws: lq.ws},
    a: {xs: la.xs.map((x) => AC.x + x), ys: la.ys.map((y) => AC.y + y), ws: la.ws},
  };
};

/** World position of the newest answer tile (the lens dive opens over it). */
export const answerTileWorld = (i: number): {x: number; y: number} => {
  const la = tileRowLayout(ANS, AS, 16, undefined, 1640);
  return {x: AC.x + la.xs[i], y: AC.y + la.ys[i]};
};
export const answerTileScreen = (f: number, i = ANS.length - 1) => {
  const w = answerTileWorld(i);
  return toScreen(poseAt(f, Q_CAM), w.x, w.y);
};

/** The Bit hops to the newest snapped tile (arc hop over 8 frames). */
const Marker: React.FC<{frame: number; pts: Array<{x: number; y: number; at: number}>; size: number; until?: number; restFrom?: number}> = ({frame: f, pts, size, until, restFrom}) => {
  const gid = safeId(useId());
  let n = -1;
  pts.forEach((p, i) => {
    if (f >= p.at) n = i;
  });
  if (n < 0) {
    // waiting over the first slot: the Bit rises in from below and hovers
    if (restFrom === undefined || f < restFrom) return null;
    const r = prog(f, restFrom, 16, EASE.out);
    const bob0 = Math.sin((TAU * f) / 48) * 3;
    return (
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={Math.min(1, r * 2)}>
        <BitHead x={pts[0].x} y={pts[0].y + (1 - r) * 260 + bob0} size={size} gid={gid} />
      </svg>
    );
  }
  const op = until !== undefined ? 1 - prog(f, until, 8) : 1;
  if (op <= 0) return null;
  const cur = pts[n];
  const prev = pts[Math.max(0, n - 1)];
  const mv = n === 0 ? 1 : prog(f, cur.at + 1, 8, EASE.inOut);
  const x = lerp(prev.x, cur.x, mv);
  const y = lerp(prev.y, cur.y, mv) - Math.sin(Math.PI * mv) * size * 2.2;
  const bob = Math.sin((TAU * f) / 48) * 3;
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={op}>
      <BitHead x={x} y={y + bob} size={size} gid={gid} />
    </svg>
  );
};

/** Ghost slots: dashed outlines waiting for the question's tiles. The "?" slot carries the magenta accent. */
const Ghosts: React.FC<{frame: number; lay: Lay}> = ({frame: f, lay}) => {
  const H = tileH(QS);
  // a light sweep keeps crossing the empty slots until the first word lands
  const minX = Math.min(...lay.xs) - 260;
  const maxX = Math.max(...lay.xs) + 260;
  const sweepOn = 1 - prog(f, A.qWords[0] - 4, 10);
  const bandX = lerp(minX, maxX, (((f - A.so) % 28) + 28) % 28 / 28);
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      {Q.map((_, i) => {
        const inn = prog(f, A.so + 1 + i * 1.4, 8, EASE.out);
        const draw = prog(f, A.so + 1 + i * 1.4, 12, EASE.out);
        const out = 1 - prog(f, qSnap[i] + 2, 5);
        const op = inn * out;
        if (op <= 0.01) return null;
        const w = lay.ws[i];
        const isQ = i === Q.length - 1;
        const qa = isQ ? prog(f, A.question, 8, EASE.out) : 0;
        const pulse = isQ ? 0.6 + 0.4 * Math.sin((TAU * (f - A.question)) / 30) : 1;
        const near = sweepOn * Math.exp(-(((lay.xs[i] - bandX) / 150) ** 2));
        return (
          <g key={i} opacity={op}>
            <rect x={lay.xs[i] - w / 2} y={lay.ys[i] - H / 2} width={w} height={H} rx={QS * 0.24} fill={rgba(PAL.tile, 0.07 + 0.12 * near)} />
            <rect x={lay.xs[i] - w / 2} y={lay.ys[i] - H / 2} width={w} height={H} rx={QS * 0.24} fill="none" stroke={rgba(PAL.annotation, 0.7)} strokeWidth={3.5} strokeDasharray="12 10" opacity={draw} />
            {near > 0.02 ? <rect x={lay.xs[i] - w / 2} y={lay.ys[i] - H / 2} width={w} height={H} rx={QS * 0.24} fill="none" stroke={PAL.info} strokeWidth={4} opacity={0.85 * near} /> : null}
            {qa > 0 ? (
              <>
                <rect x={lay.xs[i] - w / 2 - 6} y={lay.ys[i] - H / 2 - 6} width={w + 12} height={H + 12} rx={QS * 0.3} fill="none" stroke={PAL.emphasis} strokeWidth={4} opacity={qa * pulse} />
                <text x={lay.xs[i]} y={lay.ys[i] + QS * 0.36} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={QS} fill={PAL.emphasis} opacity={qa * 0.85}>
                  ?
                </text>
              </>
            ) : null}
          </g>
        );
      })}
      {sweepOn > 0.01 && f >= A.so ? (
        <rect x={bandX - 90} y={Math.min(...lay.ys) - H} width={180} height={Math.max(...lay.ys) - Math.min(...lay.ys) + 2 * H} fill={PAL.info} opacity={0.07 * sweepOn} style={{filter: 'blur(30px)'}} />
      ) : null}
    </svg>
  );
};

/** Threads: each answer tile pulls a glowing thread from every tile before it. */
const Threads: React.FC<{frame: number; lay: {q: Lay; a: Lay}}> = ({frame: f, lay}) => {
  const id = safeId(useId());
  const Hq = tileH(QS);
  const Ha = tileH(AS);
  const base: React.ReactNode[] = [];
  const hot: React.ReactNode[] = [];
  const order = prog(f, A.made - 6, 30);
  aSnap.forEach((t, j) => {
    const draw = prog(f, t - 7, 10, EASE.out);
    if (draw <= 0) return;
    const T = {x: lay.a.xs[j], y: lay.a.ys[j] - Ha / 2 - 2};
    const age = f - t;
    const later = aSnap.filter((s) => s <= f).length - 1 - j;
    const settle = 0.2 * Math.pow(0.72, Math.max(0, later)) + 0.06;
    const glow = Math.exp(-Math.max(0, age) / 9) * (age >= -3 ? 1 : 0.6);
    const srcs: Array<{x: number; y: number; kind: 'q' | 'same' | 'up'}> = [];
    Q.forEach((_, i) => srcs.push({x: lay.q.xs[i], y: lay.q.ys[i] + Hq / 2 + 2, kind: 'q'}));
    for (let k = 0; k < j; k++) {
      const same = Math.abs(lay.a.ys[k] - lay.a.ys[j]) < 4;
      srcs.push(same ? {x: lay.a.xs[k], y: lay.a.ys[k] - Ha / 2 - 2, kind: 'same'} : {x: lay.a.xs[k], y: lay.a.ys[k] + Ha / 2 + 2, kind: 'up'});
    }
    srcs.forEach((s, i) => {
      let d: string;
      if (s.kind === 'same') {
        const h = 46 + 0.2 * Math.abs(T.x - s.x);
        d = `M ${s.x} ${s.y} C ${s.x} ${s.y - h}, ${T.x} ${T.y - h}, ${T.x} ${T.y}`;
      } else {
        const dy = T.y - s.y;
        d = `M ${s.x} ${s.y} C ${s.x} ${s.y + dy * 0.55}, ${T.x} ${T.y - dy * 0.6}, ${T.x} ${T.y}`;
      }
      const op = (settle + 0.5 * glow) * (s.kind === 'q' ? 1 - prog(f, A.soThe, 18, EASE.inOut) : 1);
      base.push(
        <path key={`b${j}-${i}`} d={d} fill="none" stroke={PAL.info} strokeOpacity={op} strokeWidth={2.2} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} strokeLinecap="round" />,
      );
      // the pulse: a bright dash running from the source into the new tile
      const pu = prog(f, t - 7 + (i % 5), 11, EASE.inOut);
      if (pu > 0 && pu < 1) hot.push(<path key={`h${j}-${i}`} d={d} fill="none" stroke={PAL.infoPale} strokeWidth={4} pathLength={1} strokeDasharray="0.12 2" strokeDashoffset={-(pu * 1.12) + 0.12} strokeLinecap="round" />);
      if (order > 0 && order < 1 && j === aSnap.length - 1) {
        // "made in order": one last sweep along the newest tile's threads
        hot.push(<path key={`o${i}`} d={d} fill="none" stroke={PAL.info} strokeOpacity={0.35 * Math.sin(Math.PI * order)} strokeWidth={3} />);
      }
    });
  });
  return (
    <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <filter id={`${id}-g`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation={4} />
        </filter>
      </defs>
      <g filter={`url(#${id}-g)`} opacity={0.9}>
        {hot}
      </g>
      {base}
      {hot}
    </svg>
  );
};

/** "In order": chevrons between consecutive answer tiles light left to right. */
const OrderLinks: React.FC<{frame: number; lay: Lay}> = ({frame: f, lay}) => {
  const Ha = tileH(AS);
  const items: React.ReactNode[] = [];
  for (let k = 0; k < ANS.length - 1; k++) {
    const same = Math.abs(lay.ys[k] - lay.ys[k + 1]) < 4;
    const lit = prog(f, A.inOrder - 8 + k * 2.5, 6, EASE.out);
    if (lit <= 0) continue;
    if (same) {
      const x = (lay.xs[k] + lay.ws[k] / 2 + lay.xs[k + 1] - lay.ws[k + 1] / 2) / 2;
      const y = lay.ys[k];
      const s = 9;
      items.push(<path key={k} d={`M ${x - s * 0.5} ${y - s} L ${x + s * 0.6} ${y} L ${x - s * 0.5} ${y + s}`} fill="none" stroke={PAL.info} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" opacity={lit} />);
    } else {
      // wrap to the next line: a return arrow from the end of one line to the start of the next
      const x0 = lay.xs[k] + lay.ws[k] / 2 + 14;
      const y0 = lay.ys[k];
      const x1 = lay.xs[k + 1] - lay.ws[k + 1] / 2 - 14;
      const y1 = lay.ys[k + 1];
      const d = `M ${x0} ${y0} C ${x0 + 60} ${y0}, ${x0 + 60} ${(y0 + y1) / 2}, ${(x0 + x1) / 2} ${(y0 + y1) / 2} S ${x1 - 60} ${y1}, ${x1} ${y1}`;
      items.push(<path key={k} d={d} fill="none" stroke={PAL.info} strokeWidth={3} strokeOpacity={0.7} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - lit} strokeLinecap="round" />);
      void Ha;
    }
  }
  return <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>{items}</svg>;
};

export const QuestionShot: React.FC<{frame: number}> = ({frame: f}) => {
  const lay = useLayouts();
  const Hq = tileH(QS);
  const Ha = tileH(AS);
  const qDim = 0.48 * prog(f, A.because, 16, EASE.inOut) + 0.24 * prog(f, A.soThe, 20, EASE.inOut);
  // each new answer tile makes every earlier tile flash (they all feed it)
  let feedAll = 0;
  aSnap.forEach((t) => {
    const age = f - t;
    if (age >= -4 && age < 22) feedAll = Math.max(feedAll, Math.exp(-Math.max(0, age) / 7) * 0.85);
  });
  const qNewest = (i: number) => {
    if (f >= A.because) return 0;
    let n = -1;
    qSnap.forEach((t, k) => {
      if (f >= t) n = k;
    });
    return i === n ? 1 : 0;
  };
  const aNewest = (j: number) => {
    let n = -1;
    aSnap.forEach((t, k) => {
      if (f >= t) n = k;
    });
    const wave = prog(f, A.inOrder - 8 + j * 2.5, 4) * (1 - prog(f, A.inOrder + j * 2.5, 10));
    return Math.max(j === n ? 1 : 0, wave, j < n ? feedAll * 0.7 : 0);
  };
  return (
    <Stage
      frame={f}
      env={{kind: 'chip', pulses: 0.7, dust: 46}}
      cam={Q_CAM}
      hud={<KineticText frame={f} at={A.made} text="Made in order" mode="slam" size={84} x={960} y={872} />}
    >
      <Ghosts frame={f} lay={lay.q} />
      <Threads frame={f} lay={lay} />
      <div style={{position: 'absolute', left: 0, top: 0, opacity: 1 - prog(f, A.soThe, 18, EASE.inOut)}}>
      {Q.map((t, i) => (
        <TokenTile key={`q${i}`} frame={f} text={t} x={lay.q.xs[i]} y={lay.q.ys[i]} size={QS} w={lay.q.ws[i]} snapAt={qSnap[i]} from={{dy: -120, rot: i % 2 ? 6 : -6}} newest={Math.max(qNewest(i), f >= A.because ? feedAll * 0.8 : 0)} dim={qDim} />
      ))}
      </div>
      {ANS.map((t, j) => (
        <TokenTile key={`a${j}`} frame={f} text={t} x={lay.a.xs[j]} y={lay.a.ys[j]} size={AS} w={lay.a.ws[j]} snapAt={aSnap[j]} from={{dy: -110, rot: j % 2 ? 5 : -5}} newest={aNewest(j)} />
      ))}
      <OrderLinks frame={f} lay={lay.a} />
      <Marker frame={f} size={QS * 0.34} until={A.because - 2} restFrom={A.back - 4} pts={Q.map((_, i) => ({x: lay.q.xs[i], y: lay.q.ys[i] - Hq / 2 - QS * 0.55, at: qSnap[i]}))} />
      <Marker frame={f} size={AS * 0.34} pts={ANS.map((_, j) => ({x: lay.a.xs[j], y: lay.a.ys[j] - Ha / 2 - AS * 0.55, at: aSnap[j]}))} />
    </Stage>
  );
};

