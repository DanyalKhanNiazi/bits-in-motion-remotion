/**
 * S1 shots 8–9: the question (title moment) and the experiment tease.
 * "Let's follow one question": the Bit rises in, 11 empty slots draw, and each tile snaps in on its spoken word. When
 * "?" lands, a light sweep crosses the tiles and the Atlas route lights under them. "Along the way" the camera
 * travels that route to the experiment: the power dial drains to half; two work lanes appear, both tagged "?". One
 * clearly slows, the other barely notices. Which is which stays hidden. Exit: a push into the "?".
 */
import React from 'react';
import {Bit, KineticText, PAL, PowerDial, SANS, Stage, TileRow, TokenTile, tileH, tileRowLayout, type CamKey} from '../../kit';
import {EASE, TAU, clamp01, lerp, mixHex, pathAt, prog, rgba, samplePath, springAt, SPRING, useFontsReady} from '../../kit';
import {A, T} from './anchors';
import {NEXT_WORD} from './SceneMacro';

const Q = ['Why', ' do', ' AI', ' answers', ' arrive', ' one', ' piece', ' at', ' a', ' time', '?'];
const QS = 84;
const QGAP = 18;
const QW = 1540;
const QX = 960;
const QY = 470;
const SNAP = [...A.q.map((w) => w - 4), A.qEnd - 4];
const TITLE = SNAP[10] + 6;
/** the tease lives one frame-width to the right */
const OX = 1920;
const DIAL = {x: OX + 470, y: 560, w: 470};
const LX0 = OX + 900;
const LX1 = OX + 1760;
const LY = [420, 690];
const BADGE_X = LX0 - 70;

/** the rail the Bit draws under the empty slots: up from below, under row 1, back to row 2, under row 2 */
const RAIL0 = T.toQuestion + 16;
/** the tile from the crate shot flies up into frame and turns into the Bit at the rail's start */
const TILE_IN = T.toQuestion;
const RAIL1 = A.all - 2;
const railOf = (L: ReturnType<typeof tileRowLayout>) => {
  const H = tileH(QS);
  const rows = Array.from(new Set(L.ys)).sort((p, q) => p - q);
  const seg = rows.map((ry) => {
    const idx = L.ys.map((y, i) => (y === ry ? i : -1)).filter((i) => i >= 0);
    return {y: QY + ry + H / 2 + 30, xa: QX + L.xs[idx[0]] - L.ws[idx[0]] / 2 - 30, xb: QX + L.xs[idx[idx.length - 1]] + L.ws[idx[idx.length - 1]] / 2 + 30};
  });
  const x0 = seg[0].xa;
  let d = `M ${x0} 900 L ${x0} ${seg[0].y} L ${seg[0].xb} ${seg[0].y}`;
  // carriage return: swoop under the next row (never across the slots), then run along it
  for (let r = 1; r < seg.length; r++)
    d += ` C ${seg[r - 1].xb + 220} ${seg[r].y + 230} ${seg[r].xa - 220} ${seg[r].y + 230} ${seg[r].xa} ${seg[r].y} L ${seg[r].xb} ${seg[r].y}`;
  const S = samplePath(d);
  // when the Bit passes under each slot (constant speed between RAIL0 and RAIL1)
  const pass = L.xs.map((x, i) => {
    const ty = QY + L.ys[i] + H / 2 + 30;
    let best = 0;
    let bd = 1e9;
    for (let k = 0; k <= 400; k++) {
      const P = pathAt(S, (S.total * k) / 400);
      const dd = Math.hypot(P.x - (QX + x), P.y - ty);
      if (dd < bd) {
        bd = dd;
        best = k / 400;
      }
    }
    return Math.round(RAIL0 + best * (RAIL1 - RAIL0));
  });
  return {d, pass, xe: seg[seg.length - 1].xb, ye: seg[seg.length - 1].y, x0};
};

const cam: CamKey[] = [
  {f: T.toQuestion, x: 960, y: 560, zoom: 1.0},
  {f: TITLE - 6, x: 960, y: 548, zoom: 1.02, dur: TITLE - 6 - A.question},
  {f: A.along + 2, x: 960, y: 552, zoom: 1.09, dur: A.along + 8 - TITLE, ease: 'out'},
  {f: A.along + 22, x: OX + 960, y: 540, zoom: 1.0, dur: 22, ease: 'whip'},
  {f: T.exit, x: OX + 980, y: 545, zoom: 1.05},
  {f: A.end + 4, x: BADGE_X + 6, y: LY[1], zoom: 3.6, dur: A.end + 4 - T.exit, ease: 'inCubic'},
];

/** Work items flowing along a lane; distance is the integral of the lane's speed (pure, summed per frame). */
const dist = (f: number, slow: boolean) => {
  const f0 = A.experiment - 40;
  let d = 0;
  for (let g = f0; g < f; g++) {
    const k = slow ? 1 - 0.76 * prog(g, A.slowed - 2, 16, EASE.inOut) : 1 - 0.05 * prog(g, A.barely - 10, 20, EASE.inOut);
    d += 8.5 * k;
  }
  return d;
};

const Lane: React.FC<{frame: number; y: number; slow: boolean; on: number; badgeAt: number}> = ({frame: f, y, slow, on, badgeAt}) => {
  const d = dist(f, slow);
  const gap = 118;
  const n = Math.ceil((LX1 - LX0) / gap) + 2;
  const slowK = slow ? prog(f, A.slowed - 2, 16, EASE.inOut) : 0;
  const col = mixHex(PAL.info, PAL.wait, slowK);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = LX0 + (((d + i * gap) % (n * gap)) - gap);
    if (x < LX0 - 10 || x > LX1 + 10) continue;
    const edge = clamp01((x - LX0) / 60) * clamp01((LX1 - x) / 60);
    items.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x - 17,
          top: y - 24,
          width: 34,
          height: 48,
          borderRadius: 8,
          background: 'linear-gradient(180deg, #FFFFFF, #DDE3EC)',
          boxShadow: `0 5px 0 ${PAL.tileEdge}, 0 0 18px ${rgba(col, 0.7)}`,
          opacity: edge * on,
        }}
      />,
    );
  }
  const bp = springAt(f, badgeAt, SPRING.pop);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: LX0 - 30,
          top: y - 46,
          width: LX1 - LX0 + 60,
          height: 92,
          borderRadius: 46,
          background: `linear-gradient(180deg, ${rgba('#0E1830', 0.94)}, ${rgba('#060A14', 0.94)})`,
          border: `2px solid ${rgba(col, 0.25 + 0.35 * on)}`,
          boxShadow: `0 0 ${30}px ${rgba(col, 0.18 * on)}, 0 20px 50px rgba(0,0,0,0.5)`,
          opacity: on,
        }}
      />
      {/* direction chevrons on the track */}
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={0.35 * on}>
        {Array.from({length: 7}, (_, i) => {
          const x = LX0 + 60 + i * 120;
          return <path key={i} d={`M ${x} ${y - 10} L ${x + 10} ${y} L ${x} ${y + 10}`} fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" />;
        })}
      </svg>
      {items}
      {/* the hidden identity */}
      {f >= badgeAt ? (
        <div
          style={{
            position: 'absolute',
            left: BADGE_X - 46,
            top: y - 46,
            width: 92,
            height: 92,
            borderRadius: 24,
            transform: `scale(${Math.max(0, bp)})`,
            background: 'linear-gradient(180deg, #1C2C4C, #111B30)',
            border: `3px solid ${rgba(PAL.emphasis, 0.9)}`,
            boxShadow: `0 0 26px ${rgba(PAL.emphasis, 0.45)}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 70,
            color: PAL.ink,
          }}
        >
          ?
        </div>
      ) : null}
    </>
  );
};

export const SceneQuestion: React.FC<{frame: number}> = ({frame: f}) => {
  useFontsReady();
  const L = tileRowLayout(Q, QS, QGAP, undefined, QW);
  const lastY = QY + Math.max(...L.ys);
  const firstY = QY + Math.min(...L.ys);
  const rail = railOf(L);
  const hopD = `M ${rail.xe} ${rail.ye} Q ${(rail.xe + QX + L.xs[0]) / 2} ${firstY - tileH(QS) / 2 - 260} ${QX + L.xs[0]} ${firstY - tileH(QS) / 2 - 40}`;
  // the Atlas route: under the tiles, then on along the way to the experiment
  const yb = lastY + tileH(QS) / 2 + 70;
  const route = `M -120 ${yb} H ${QX + 640} Q ${QX + 700} ${yb} ${QX + 740} ${yb - 40} L ${QX + 880} ${yb - 180} Q ${QX + 920} ${yb - 220} ${QX + 980} ${yb - 220} H ${DIAL.x - 330}`;
  const RS = samplePath(route);
  const runA = TITLE;
  const runB = A.along + 24;
  const runU = prog(f, runA, runB - runA, EASE.inOut);
  const stations = [0.18, 0.36, 0.55, 0.78];
  const sweep = prog(f, TITLE - 2, 22, EASE.inOut);
  const qGlow = f >= TITLE ? 0.55 + 0.45 * Math.sin((TAU * (f - TITLE)) / 40) : 0;
  const ghostAt = (i: number) => T.toQuestion + 8 + i * 2;
  // tease
  const laneOn = prog(f, A.along + 16, 16, EASE.out);
  const cap = f >= A.capped ? prog(f, A.capped, A.power + 4 - A.capped, EASE.inOut) : 0;
  const amber = 1 - 0.55 * cap;
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 70}}
      cam={cam}
      hud={
        <>
          <KineticText frame={f} at={A.halfP} exitAt={A.end - 8} text="Half power" mode="slam" x={520} y={190} size={96} color={PAL.energy} accent={PAL.energy} backing="scrim" />
          <KineticText frame={f} at={A.clearly} stagger={A.slowed - A.clearly} text="Clearly slowed" mode="pop" x={1330} y={292} size={84} color={PAL.wait} backing="scrim" exitAt={A.end - 8} />
          <KineticText frame={f} at={A.barely} stagger={A.noticed - A.barely} text="Barely noticed" mode="pop" x={1330} y={818} size={84} color={PAL.ink} backing="scrim" exitAt={A.end - 8} />
        </>
      }
    >
      {/* the route (drawn as the Bit runs it) */}
      <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <path d={route} fill="none" stroke={PAL.structure} strokeOpacity={0.45 * prog(f, TITLE - 6, 10)} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        {stations.map((p, i) => {
          const P = pathAt(RS, p * RS.total);
          const lit = runU >= p ? springAt(f, runA + Math.round(p * (runB - runA)), SPRING.pop) : 0;
          const sz = 22 + 8 * Math.min(1.2, lit);
          return (
            <g key={i} opacity={prog(f, TITLE - 6, 10)}>
              {lit > 0 ? <circle cx={P.x} cy={P.y} r={34 * lit} fill={rgba(PAL.info, 0.18)} /> : null}
              <rect x={P.x - sz / 2} y={P.y - sz / 2} width={sz} height={sz} rx={5} fill={lit > 0 ? PAL.info : PAL.deck} stroke={lit > 0 ? PAL.infoPale : PAL.structure} strokeWidth={3} />
            </g>
          );
        })}
      </svg>
      {f >= runA - 2 ? <Bit frame={f} path={route} from={runA} to={runB} route="lit" routeWidth={5} size={26} land={false} /> : null}
      {/* "Let's follow one question": the piece from the crate rises in as the Bit and draws the rail; each empty
          slot pops up as the Bit passes under it, then the Bit hops onto the first slot */}
      {f >= TILE_IN && f < RAIL0 + 4 ? (
        <div
          style={{
            position: 'absolute',
            left: rail.x0,
            top: lerp(1190, 900, prog(f, TILE_IN, RAIL0 - TILE_IN, EASE.out)),
            width: 0,
            height: 0,
            transform: `scale(${lerp(1, 0.32, prog(f, TILE_IN + 4, RAIL0 - TILE_IN - 2, EASE.inOut))})`,
            opacity: 1 - prog(f, RAIL0 - 2, 6),
          }}
        >
          <TokenTile frame={f} text={NEXT_WORD} x={0} y={0} size={80} newest={1} />
        </div>
      ) : null}
      {f < SNAP[0] + 6 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={1 - prog(f, SNAP[0] - 2, 8)}>
          <Bit frame={f} path={rail.d} from={RAIL0} to={RAIL1} ease={(t) => t} route="lit" routeWidth={5} size={28} land={false} />
        </svg>
      ) : null}
      {f >= RAIL1 && f < SNAP[0] + 6 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          <Bit frame={f} path={hopD} from={RAIL1} to={RAIL1 + 10} route="none" size={28} land />
        </svg>
      ) : null}
      {/* empty slots */}
      {Q.map((t, i) => {
        const a = rail.pass[i];
        if (f < T.toQuestion || f >= SNAP[i] + 7) return null;
        const pre = f < a;
        const sp = pre ? 1 : springAt(f, a, SPRING.pop);
        const fl = pre ? 0 : Math.exp(-(f - a) / 5);
        const H = tileH(QS);
        return (
          <div
            key={`g${i}`}
            style={{
              position: 'absolute',
              left: QX + L.xs[i] - L.ws[i] / 2,
              top: QY + L.ys[i] - H / 2,
              width: L.ws[i],
              height: H,
              borderRadius: QS * 0.24,
              border: `3px dashed ${rgba(pre ? PAL.annotation : PAL.info, pre ? 0.28 : 0.5 + 0.4 * fl)}`,
              background: rgba(PAL.info, pre ? 0.02 : 0.05 + 0.18 * fl),
              boxShadow: `0 0 ${10 + 30 * fl}px ${rgba(PAL.info, 0.25 + 0.4 * fl)}`,
              transform: `scale(${Math.max(0, sp)})`,
            }}
          />
        );
      })}
      {/* title light: a soft pool of light behind the question once it is complete */}
      <div
        style={{
          position: 'absolute',
          left: QX - 1000,
          top: (firstY + lastY) / 2 - 420,
          width: 2000,
          height: 840,
          borderRadius: '50%',
          background: `radial-gradient(closest-side, ${rgba('#2A6FB0', (0.2 * prog(f, T.toQuestion + 6, 20) + 0.24 * prog(f, TITLE - 4, 16, EASE.out)) * (0.9 + 0.1 * Math.sin((TAU * f) / 60)))}, ${rgba('#14305A', 0.1 + 0.1 * prog(f, TITLE - 4, 16))} 55%, rgba(0,0,0,0))`,
        }}
      />
      <TileRow frame={f} tokens={Q} x={QX} y={QY} size={QS} gap={QGAP} wrap maxWidth={QW} snapAt={SNAP} from={{dy: -170, rot: -6}} />
      {/* title glow on the "?" tile, and the sweep across all tiles */}
      {qGlow > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: QX + L.xs[10] - L.ws[10] / 2 - 10,
            top: QY + L.ys[10] - tileH(QS) / 2 - 10,
            width: L.ws[10] + 20,
            height: tileH(QS) + 20,
            borderRadius: QS * 0.3,
            border: `4px solid ${rgba(PAL.emphasis, 0.5 + 0.4 * qGlow)}`,
            boxShadow: `0 0 ${30 + 20 * qGlow}px ${rgba(PAL.emphasis, 0.5)}`,
          }}
        />
      ) : null}
      {sweep > 0 && sweep < 1 ? (
        <div
          style={{
            position: 'absolute',
            left: lerp(-200, 2100, sweep) - 150,
            top: firstY - 160,
            width: 300,
            height: lastY - firstY + 320,
            transform: 'skewX(-16deg)',
            background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.32), rgba(255,255,255,0))',
            mixBlendMode: 'screen',
            opacity: Math.sin(Math.PI * sweep),
          }}
        />
      ) : null}
      {/* title lock-up: the channel mark under the question, held until "along the way" */}
      {f >= TITLE - 8 ? (
        <div
          style={{
            position: 'absolute',
            left: QX,
            top: yb + 96,
            transform: `translate(-50%, -50%) translateY(${(1 - prog(f, TITLE - 8, 14, EASE.outExpo)) * 24}px) scale(${1 + 0.04 * prog(f, TITLE, 40)})`,
            opacity: prog(f, TITLE - 8, 10),
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            whiteSpace: 'nowrap',
          }}
        >
          <svg width={52} height={52} viewBox="0 0 30 30" style={{overflow: 'visible'}}>
            <rect x={3} y={3} width={24} height={24} rx={6} fill={PAL.info} style={{filter: `drop-shadow(0 0 10px ${PAL.info})`}} />
            <rect x={10} y={10} width={10} height={10} rx={2.5} fill="#E9FDFF" />
          </svg>
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: 84, letterSpacing: '0.1em', color: PAL.ink, textTransform: 'uppercase', textShadow: `0 0 24px ${rgba(PAL.info, 0.35)}`}}>Bits in Motion</span>
        </div>
      ) : null}
      {/* ---- the tease ---- */}
      <svg width={1} height={1} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} opacity={laneOn}>
        {LY.map((y, i) => {
          const d = `M ${DIAL.x + 150} ${DIAL.y + (i ? 40 : -40)} C ${DIAL.x + 300} ${DIAL.y + (i ? 40 : -40)} ${LX0 - 260} ${y} ${BADGE_X - 50} ${y}`;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={PAL.energyDeep} strokeOpacity={0.5} strokeWidth={10} strokeLinecap="round" />
              <path d={d} fill="none" stroke={PAL.energy} strokeOpacity={0.9 * amber} strokeWidth={4} strokeLinecap="round" strokeDasharray="18 22" strokeDashoffset={-f * 3 * amber} />
            </g>
          );
        })}
      </svg>
      {f >= A.along + 10 ? (
        <PowerDial
          frame={f}
          x={DIAL.x}
          y={DIAL.y}
          w={DIAL.w}
          value={[
            [A.capped, 1],
            [A.power + 4, 0.5],
          ]}
          enter={{kind: 'rise', at: A.along + 10, dur: 24}}
        />
      ) : null}
      <Lane frame={f} y={LY[0]} slow on={laneOn} badgeAt={A.onePart} />
      <Lane frame={f} y={LY[1]} slow={false} on={laneOn} badgeAt={A.onePart + 6} />
    </Stage>
  );
};
