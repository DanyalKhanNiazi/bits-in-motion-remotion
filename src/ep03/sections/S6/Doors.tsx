/**
 * S6 P15 close: three doors, one per wait you've felt. Each swings ajar with light on its phrase; the shot exits by
 * pushing through door 1 into the next section (wait 1).
 */
import React, {useId} from 'react';
import {EASE, KineticText, PAL, SANS, SPRING, Stage, TAU, clamp01, lerp, poseAt, prog, rgba, rr, safeId, springAt, toScreen, type CamKey} from '../../kit';
import {A, CUT} from './anchors';

const DOORS = [
  {x: 440, at: A.before, label: ['Before the', 'first word']},
  {x: 960, at: A.asChat, label: ['As a chat', 'gets long']},
  {x: 1480, at: A.whenBusy, label: ["When it's", 'busy']},
];
const DW = 300;
const DH = 500;
const FLOOR = 770;
const TOP = FLOOR - DH;

/** The exit push through door 1 starts here and reaches a white-coral bloom on the cut (A.to). */
const EXIT = A.busyEnd - 11; // 11885
export const DOORS_CAM: CamKey[] = [
  {f: CUT.intoDoors, zoom: 0.965, x: 960, y: 560},
  {f: EXIT, zoom: 1.02, x: 960, y: 552},
  {f: A.to, zoom: 4.4, x: DOORS[0].x, y: TOP + DH * 0.55, dur: A.to - EXIT, ease: 'inCubic'},
  {f: A.to + 30, zoom: 9, x: DOORS[0].x, y: TOP + DH * 0.55, dur: 30, ease: (t: number) => t},
];

const doorPath = (x: number, w: number, top: number, h: number, r: number) => {
  const l = x - w / 2;
  const rr2 = x + w / 2;
  const b = top + h;
  return `M${l} ${b} V${top + r} Q${l} ${top} ${l + r} ${top} H${rr2 - r} Q${rr2} ${top} ${rr2} ${top + r} V${b}`;
};

const Door: React.FC<{frame: number; i: number}> = ({frame: f, i}) => {
  const d = DOORS[i];
  const drawAt = CUT.intoDoors + 2 + i * 5;
  const draw = prog(f, drawAt, 16, EASE.out);
  if (draw <= 0) return null;
  const open = springAt(f, d.at, {damping: 13, stiffness: 70, mass: 1.1});
  const lit = clamp01(open * 1.4);
  const flick = 0.92 + 0.08 * Math.sin((TAU * f) / 23 + i);
  const badge = springAt(f, A.three + i * 4, SPRING.pop);
  const lab = springAt(f, d.at + 2, SPRING.snap);
  const leaf = Math.min(1.15, open) * 0.62; // fraction of the leaf turned away
  const l = d.x - DW / 2;
  const glowId = `${safeId(useId())}d${i}`;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1920, height: 1080}}>
      {/* light spill on the floor */}
      {lit > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: d.x - 330,
            top: FLOOR - 6,
            width: 660,
            height: 250,
            background: `radial-gradient(ellipse 50% 60% at 50% 0%, ${rgba('#FFF4EC', 0.42 * lit * flick)}, ${rgba(PAL.wait, 0.16 * lit)} 45%, rgba(0,0,0,0) 80%)`,
            clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(6px)',
          }}
        />
      ) : null}
      <svg
        width={1920}
        height={1080}
        style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', transform: `perspective(1500px) rotateY(${[22, 0, -22][i]}deg)`, transformOrigin: `${d.x}px ${TOP + DH / 2}px`}}
      >
        <defs>
          <radialGradient id={`${glowId}-in`} cx={d.x} cy={TOP + DH * 0.55} r={DH * 0.7} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.98 * lit} />
            <stop offset="0.35" stopColor="#FFE3D8" stopOpacity={0.85 * lit} />
            <stop offset="0.75" stopColor={PAL.wait} stopOpacity={0.45 * lit} />
            <stop offset="1" stopColor={PAL.waitDeep} stopOpacity={0.3 * lit} />
          </radialGradient>
          <filter id={`${glowId}-b`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={26} />
          </filter>
          <linearGradient id={`${glowId}-leaf`} x1={l} y1={0} x2={l + DW} y2={0} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1B2A48" />
            <stop offset="1" stopColor="#0E1830" />
          </linearGradient>
          <clipPath id={`${glowId}-c`}>
            <path d={`${doorPath(d.x, DW - 20, TOP + 10, DH - 10, 20)} Z`} />
          </clipPath>
        </defs>
        {/* depth side and dark interior */}
        <path d={`${doorPath(d.x + 14, DW, TOP + 8, DH - 8, 26)} Z`} fill="#050912" opacity={draw} />
        <path d={`${doorPath(d.x, DW - 20, TOP + 10, DH - 10, 20)} Z`} fill="#070D1A" opacity={draw} />
        {/* the light behind the door */}
        {lit > 0 ? (
          <g clipPath={`url(#${glowId}-c)`}>
            <rect x={l} y={TOP} width={DW} height={DH} fill={`url(#${glowId}-in)`} opacity={flick} />
            {Array.from({length: 7}, (_, k) => {
              const yy = TOP + 60 + k * 62 + ((f * (1.2 + 0.3 * k)) % 62);
              return <rect key={k} x={l + 30 + rr(`dr${i}${k}`, 0, 140)} y={yy} width={rr(`dw${i}${k}`, 40, 120)} height={3} fill="#FFFFFF" opacity={0.35 * lit} />;
            })}
          </g>
        ) : null}
        {/* the leaf: hinged on the left, turning away (foreshortened) */}
        <g clipPath={`url(#${glowId}-c)`} opacity={draw}>
          <path
            d={`M${l + 10} ${TOP + 10} L${l + 10 + (DW - 20) * (1 - leaf)} ${TOP + 10 + 34 * leaf} L${l + 10 + (DW - 20) * (1 - leaf)} ${FLOOR - 34 * leaf} L${l + 10} ${FLOOR} Z`}
            fill={`url(#${glowId}-leaf)`}
          />
          <circle cx={l + 10 + (DW - 20) * (1 - leaf) - 26 * (1 - leaf)} cy={TOP + DH * 0.55} r={9} fill={PAL.silver} opacity={0.8} />
        </g>
        {/* frame (draws in) */}
        <path d={doorPath(d.x, DW, TOP, DH, 26)} fill="none" stroke={lit > 0 ? '#FFE9DF' : PAL.structure} strokeWidth={12} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - draw} opacity={0.4 + 0.6 * draw} />
        {lit > 0 ? <path d={doorPath(d.x, DW, TOP, DH, 26)} fill="none" stroke={PAL.wait} strokeWidth={22} opacity={0.5 * lit * flick} filter={`url(#${glowId}-b)`} /> : null}
        <line x1={d.x - DW / 2 - 40} y1={FLOOR} x2={d.x + DW / 2 + 40} y2={FLOOR} stroke={rgba(PAL.structure, 0.6)} strokeWidth={3} opacity={draw} />
        {/* number badge */}
        {badge > 0 ? (
          <g transform={`translate(${d.x} ${TOP - 62}) scale(${Math.max(0, badge)})`}>
            <circle r={44} fill={lit > 0 ? PAL.wait : '#2A1416'} stroke={PAL.wait} strokeWidth={4} />
            <text y={18} textAnchor="middle" fontFamily={SANS} fontWeight={700} fontSize={52} fill={lit > 0 ? '#1A0B0C' : PAL.wait}>
              {i + 1}
            </text>
          </g>
        ) : null}
      </svg>
      {/* label */}
      {f >= d.at + 2 ? (
        <div
          style={{
            position: 'absolute',
            left: d.x,
            top: FLOOR + 74,
            transform: `translate(-50%, -50%) translateY(${(1 - Math.min(1, lab)) * 18}px)`,
            opacity: clamp01(lab * 2),
            width: 500,
            textAlign: 'center',
            whiteSpace: 'pre-line',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 72,
            lineHeight: 1.05,
            color: PAL.ink,
            textShadow: '0 4px 18px rgba(0,0,0,0.8)',
          }}
        >
          {d.label[0]}
          <br />
          {d.label[1]}
        </div>
      ) : null}
    </div>
  );
};

export const DoorsScene: React.FC<{frame: number}> = ({frame: f}) => {
  const tunnel = prog(f, EXIT, A.to - EXIT, EASE.inCubic);
  const door1 = toScreen(poseAt(f, DOORS_CAM), DOORS[0].x, TOP + DH * 0.55);
  const bloom = prog(f, EXIT + 8, A.to - EXIT - 8, EASE.inCubic);
  return (
    <Stage
      frame={f}
      env={{kind: 'night', grid: true, dust: 70}}
      cam={DOORS_CAM}
      hud={
        <>
          <KineticText frame={f} at={A.three} text="Three waits" x={960} y={100} size={104} mode="slam" accent={PAL.wait} exitAt={A.before - 8} />
          {bloom > 0 ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at ${door1.x}px ${door1.y}px, ${rgba('#FFFFFF', 0.96 * bloom)} 0px, ${rgba('#FFE6DC', 0.9 * bloom)} ${lerp(40, 520, bloom)}px, ${rgba(PAL.wait, 0.7 * bloom)} ${lerp(120, 1250, bloom)}px, ${rgba(PAL.waitDeep, 0.5 * bloom)} ${lerp(200, 1700, bloom)}px)`,
              }}
            />
          ) : null}
        </>
      }
    >
      {DOORS.map((_, i) => (
        <Door key={i} frame={f} i={i} />
      ))}
      {/* exit: light streaks inside door 1 as we push through */}
      {tunnel > 0 ? (
        <svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
          {Array.from({length: 28}, (_, k) => {
            const a = (k / 28) * TAU + rr(`tn-a${k}`, -0.1, 0.1);
            const cx = DOORS[0].x;
            const cy = TOP + DH * 0.52;
            const r0 = 10 + ((((f - EXIT) * 2.6 + rr(`tn-r${k}`, 0, 70)) % 70) + 70) % 70;
            const r1 = r0 + lerp(8, 46, tunnel);
            return (
              <line
                key={k}
                x1={cx + r0 * Math.cos(a)}
                y1={cy + r0 * Math.sin(a) * 1.4}
                x2={cx + r1 * Math.cos(a)}
                y2={cy + r1 * Math.sin(a) * 1.4}
                stroke={k % 3 ? '#FFFFFF' : PAL.info}
                strokeWidth={1.6}
                opacity={0.8 * tunnel}
              />
            );
          })}
        </svg>
      ) : null}
    </Stage>
  );
};
