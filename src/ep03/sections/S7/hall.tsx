/**
 * S7: the night hall of three doors (matches S6's ending): coral number badges, the active door swings ajar with a
 * light spill, then the camera pushes through it into the light (the light tunnel is drawn by the caller).
 */
import React from 'react';
import {EASE, PAL, SANS, Stage, clamp01, osc, prog, rgba, springAt, SPRING, type CamKey} from '../../kit';
import {Badge} from './lib';

export const DOORS = [
  {x: 520, label: 'Before the first word'},
  {x: 960, label: 'As a chat gets long'},
  {x: 1400, label: "When it's busy"},
] as const;
const OW = 290;
const OT = 300;
const OB = 750;
export const DOOR_CY = (OT + OB) / 2;

const Door: React.FC<{frame: number; i: number; open: number; state: 'done' | 'active' | 'idle'; showLabel: boolean; appear: number}> = ({frame: f, i, open, state, showLabel, appear}) => {
  const d = DOORS[i];
  const x0 = d.x - OW / 2;
  const dim = state === 'done' ? 0.62 : state === 'idle' ? 0.2 : 0;
  const leak = state === 'active' ? 0.35 + 0.65 * open : 0.18;
  const flick = 0.92 + 0.08 * osc(f, 23, i * 0.3);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, opacity: appear}}>
      {/* floor glow and light spill */}
      <svg width={1920} height={1200} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
        <defs>
          <linearGradient id={`hall-spill-${i}`} x1="0" y1={OB} x2="0" y2={1180} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#CFFBFF" stopOpacity={0.55 * open * flick} />
            <stop offset="0.35" stopColor={PAL.info} stopOpacity={0.22 * open * flick} />
            <stop offset="1" stopColor={PAL.info} stopOpacity={0} />
          </linearGradient>
          <radialGradient id={`hall-pool-${i}`}>
            <stop offset="0" stopColor={state === 'active' ? '#BFF8FF' : '#6F8FCB'} stopOpacity={0.5 * leak} />
            <stop offset="1" stopColor={PAL.info} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={d.x} cy={OB + 14} rx={280} ry={46} fill={`url(#hall-pool-${i})`} />
        {open > 0.01 ? <polygon points={`${x0},${OB} ${x0 + OW},${OB} ${d.x + 470},1180 ${d.x - 470},1180`} fill={`url(#hall-spill-${i})`} /> : null}
      </svg>
      {/* frame */}
      <div
        style={{
          position: 'absolute',
          left: x0 - 24,
          top: OT - 24,
          width: OW + 48,
          height: OB - OT + 30,
          borderRadius: '18px 18px 6px 6px',
          background: 'linear-gradient(180deg, #3A4866 0%, #26344F 55%, #1A2742 100%)',
          boxShadow: `inset 0 2px 0 ${rgba('#C7CDD6', 0.35)}, 0 30px 60px rgba(0,0,0,0.55)${state === 'active' ? `, 0 0 ${60 * open + 14}px ${rgba(PAL.info, 0.25 + 0.3 * open)}` : ''}`,
          filter: dim > 0 ? `brightness(${1 - 0.5 * dim})` : undefined,
        }}
      />
      {/* the opening: light behind the door */}
      <div
        style={{
          position: 'absolute',
          left: x0,
          top: OT,
          width: OW,
          height: OB - OT,
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden',
          background: state === 'active' ? `radial-gradient(ellipse 70% 60% at 50% 48%, ${rgba('#FFFFFF', 0.4 + 0.6 * open)}, ${rgba('#8FF1FF', 0.3 + 0.5 * open)} 38%, ${rgba('#0A4E63', 0.6)} 100%)` : '#0A1222',
        }}
      >
        {state === 'active'
          ? Array.from({length: 9}, (_, k) => (
              <div
                key={k}
                style={{
                  position: 'absolute',
                  left: `${8 + k * 10.5}%`,
                  top: '-10%',
                  width: 10,
                  height: '120%',
                  background: `linear-gradient(180deg, rgba(255,255,255,0), ${rgba('#FFFFFF', 0.35 * open * (0.6 + 0.4 * osc(f, 31 + k * 7, k * 0.17)))}, rgba(255,255,255,0))`,
                  transform: `skewX(${-8 + k * 2}deg)`,
                  filter: 'blur(4px)',
                }}
              />
            ))
          : null}
      </div>
      {/* the door panel (hinged on the left) */}
      <div style={{position: 'absolute', left: x0, top: OT, width: OW, height: OB - OT, perspective: 1300}}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: '0% 50%',
            transform: `rotateY(${-80 * open}deg)`,
            borderRadius: '8px 8px 0 0',
            background: 'linear-gradient(180deg, #1F2D4C 0%, #16223D 60%, #111A30 100%)',
            border: `2px solid ${rgba(PAL.structure, 0.35)}`,
            boxShadow: `inset 0 0 0 10px ${rgba('#0A1222', 0.5)}, inset 0 0 0 12px ${rgba(PAL.structure, 0.18)}, 0 0 ${10 + 30 * leak}px ${rgba(state === 'active' ? '#BFF8FF' : '#6F8FCB', 0.45 * leak)}`,
            filter: dim > 0 ? `brightness(${1 - 0.45 * dim})` : `brightness(${1 - 0.25 * open})`,
          }}
        >
          <div style={{position: 'absolute', left: 34, right: 34, top: 230, height: 2, background: rgba(PAL.structure, 0.25)}} />
          <div style={{position: 'absolute', left: 34, right: 34, top: 330, height: 2, background: rgba(PAL.structure, 0.25)}} />
          <div style={{position: 'absolute', right: 22, top: 250, width: 10, height: 64, borderRadius: 5, background: 'linear-gradient(90deg, #7E8796, #C7CDD6)'}} />
          <div style={{position: 'absolute', left: OW / 2, top: 128}}>
            <Badge n={i + 1} r={58} dim={dim} glow={state === 'active' ? 1.4 : 0.7} />
          </div>
        </div>
      </div>
      {showLabel ? (
        <div
          style={{
            position: 'absolute',
            left: d.x,
            top: OB + 30,
            width: 400,
            textAlign: 'center',
            lineHeight: 1.06,
            transform: 'translate(-50%, 0)',
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 58,
            color: state === 'done' ? rgba(PAL.muted, 0.6) : PAL.annotation,
            textShadow: '0 2px 12px rgba(0,0,0,0.8)',
          }}
        >
          {d.label}
        </div>
      ) : null}
    </div>
  );
};

/** The hall as a full Stage. `active` door index (0-based), opening on `openAt`, camera keys from the caller. */
export const Hall: React.FC<{frame: number; active: number; openAt: number; cam: CamKey[]; inAt: number}> = ({frame: f, active, openAt, cam, inAt}) => {
  const open = clamp01(springAt(f, openAt, SPRING.soft) * 0.45 + prog(f, openAt, 26, EASE.out) * 0.55);
  return (
    <Stage frame={f} env={{kind: 'night', grid: true, dust: 60}} cam={cam}>
      {DOORS.map((_, i) => (
        <Door
          key={i}
          frame={f}
          i={i}
          open={i === active ? open : 0}
          state={i < active ? 'done' : i === active ? 'active' : 'idle'}
          showLabel={i !== active}
          appear={clamp01(prog(f, inAt + i * 3, 10, EASE.out))}
        />
      ))}
    </Stage>
  );
};
