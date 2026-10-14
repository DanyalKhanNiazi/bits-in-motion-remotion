/**
 * Signal Score: every piece of text. Brand keyed tags in four fixed kinds of place:
 *   lane and track names in the left slot of their rail (x 396), settling 44 -> 34 px after their hold;
 *   state tags and pills docked to "now" (right edge at now - 18);
 *   event names above their event, left-aligned to it;
 *   labels that belong to a moment on the time rail, left of x 1560.
 * Budget per frame: <= 3 tags, <= 2 pills, 1 header, <= 12 must-read words.
 */
import React from 'react';
import {KeyedTag, StatePill, TimeChip} from '../../shared/components';
import {MONO, SANS} from '../../shared/fonts';
import {EASE, lerp, progress, tagTiming} from '../../shared/motion';
import {withAlpha} from '../../shared/brand';
import {GROUND, MAP, SEAT, STRIP, T, Y} from './layout';
import {F} from './timeline';
import {fadeIn, fadeOut, playheadX, scoreState} from './score';
import {pressX} from './timemap';

const SLOT_X = 396; // key-bar x of the left slot (the plate starts at 386, clear of the axis break)
// LK sits 6 px higher than the other rails' rhythm so its settled (34 px) plate clears the S11 wash band (top y 649)
const NAME_Y = {L1: 262, L2: 424, Q: 524, LK: 614, SB: 752, MR: 852} as const;

/** A leaderless name: key bar + one or more lines (sentence case), entering like a keyed tag. */
export const Name: React.FC<{
  f: number;
  x: number;
  y: number;
  lines: string[];
  size?: number;
  keyColor: string;
  land: number;
  exitAt?: number;
  color?: string;
  align?: 'left' | 'right';
}> = ({f, x, y, lines, size = 44, keyColor, land, exitAt, color, align = 'left'}) => {
  const t = tagTiming(f, land, exitAt);
  if (!t.visible || t.text <= 0) return null;
  const lineH = size * 1.15;
  const pad = 10;
  const W = 900;
  const top = y - lineH / 2 - pad;
  return (
    <foreignObject x={align === 'left' ? x - pad : x - W + pad} y={top} width={W} height={lineH * lines.length + 2 * pad + 4} style={{overflow: 'visible'}}>
      <div style={{width: W, display: 'flex', justifyContent: align === 'left' ? 'flex-start' : 'flex-end'}}>
        <div
          style={{
            display: 'inline-flex',
            padding: pad,
            borderRadius: 8,
            background: withAlpha(GROUND, 0.9),
            opacity: t.text,
            transform: `translateX(${align === 'left' ? -t.textX : t.textX}px)`,
          }}
        >
          <div style={{width: 4, background: keyColor, flex: 'none', marginRight: 12}} />
          <div style={{display: 'flex', flexDirection: 'column'}}>
            {lines.map((l, i) => (
              <div key={i} style={{fontFamily: SANS, fontWeight: 600, fontSize: size, lineHeight: 1.15, color: color ?? T.ink, whiteSpace: 'nowrap'}}>
                {l}
              </div>
            ))}
          </div>
        </div>
      </div>
    </foreignObject>
  );
};

/** 44 -> 34 px settle (6 frames, Move easing) from `at`; optional regrow at `growAt` and resettle at `settle2`. */
const settled = (f: number, at: number, growAt?: number, settle2?: number): number => {
  let s = lerp(44, 34, progress(f, at, 6, EASE.move));
  if (growAt !== undefined) s = lerp(s, 44, progress(f, growAt, 6, EASE.move));
  if (settle2 !== undefined) s = lerp(s, 34, progress(f, settle2, 6, EASE.move));
  return s;
};

/** Strip-space anchor helpers for the S01 tags. */
const SC = {row1: [228, 252], cpu: [240, 396]} as const;
const ts = (g: 'row1' | 'cpu', p: readonly [number, number]): [number, number] => {
  const st = STRIP[g];
  return [st.cx + (p[0] - SC[g][0]) * st.s, st.cy + (p[1] - SC[g][1]) * st.s];
};
const S1_BTN = ts('row1', [SEAT.button.cx + SEAT.button.r * 0.6, SEAT.button.cy]);
const S1_MON_R = ts('row1', [SEAT.monitor.x + SEAT.monitor.w, SEAT.monitor.y]);
const S1_CPU_R = ts('cpu', [SEAT.cpu.x + SEAT.cpu.w, SEAT.cpu.y]);
const S1_CPU_B = ts('cpu', [SEAT.cpu.x + SEAT.cpu.w, SEAT.cpu.y + SEAT.cpu.h]);

export const LabelsLayer: React.FC<{f: number}> = ({f}) => {
  const s = scoreState(f);
  const H = playheadX(f);
  const P = pressX(f);
  const nowDock = Math.min(H, MAP.M3.press); // pills docked at "now" stay at PRESS once M4 begins
  // "Soft-off" docks on the playhead's left (pill right edge = x - 8); the PRESS flag's rim is at P - 17.5
  const softDock = Math.min(H - 2, P - 16);
  const cpuTagX = S1_CPU_R[0] + 48;
  const plate = GROUND;
  const axisNote =
    f >= F.axisNoteIn
      ? fadeIn(f, F.axisNoteIn, 6) *
        Math.max(fadeOut(f, F.lensOpen - 6, 6), fadeIn(f, F.lensClose + 6, 6)) *
        Math.max(fadeOut(f, F.card, 6), fadeIn(f, F.s07Out + 6, 6)) *
        Math.max(fadeOut(f, F.forkStem, 6), fadeIn(f, F.forkOut + 6, 6))
      : 0;

  return (
    <g>
      {/* ================= headers (one at a time, header zone) ================= */}
      <TimeChip label="After the press" inAt={F.chipIn} outAt={F.returnStart} />
      <TimeChip label="When pressed" inAt={F.whenPressedIn} outAt={F.whenPressedOut} />
      <TimeChip label="After the press" inAt={F.lookAheadIn} outAt={F.lookAheadOut} />
      <TimeChip label="Intel desktop" inAt={F.intel} shrinkAt={F.intelShrink} outAt={F.intelOut} />
      <TimeChip label="Now" inAt={F.now} />

      {/* ================= S01: tags on the hardware strip ================= */}
      <KeyedTag anchor={S1_BTN} end={[S1_MON_R[0] + 18, S1_BTN[1]]} text="Power button" role="part" land={F.tagPowerButton} exitAt={F.s01TagsOut} plate={plate} />
      <KeyedTag
        anchor={[S1_CPU_R[0] - 4, S1_CPU_R[1] + 100]}
        end={[cpuTagX, S1_CPU_R[1] + 100]}
        text="Main processor"
        role="muted"
        land={F.tagMainProcessor}
        exitAt={F.s01TagsOut}
        plate={plate}
      />
      <KeyedTag
        anchor={[S1_CPU_R[0] - 4, S1_CPU_R[1] + 188]}
        end={[cpuTagX, S1_CPU_R[1] + 188]}
        text="Not first"
        role="muted"
        land={F.tagNotFirst}
        exitAt={F.s01TagsOut}
        plate={plate}
      />

      {/* ================= lane and track names (left slots) ================= */}
      <Name f={f} x={SLOT_X} y={NAME_Y.L2} lines={['Main processor']} size={34} keyColor={T.structure} land={F.mainProcName} />
      <Name f={f} x={SLOT_X} y={NAME_Y.LK} lines={['Always-on logic']} size={settled(f, F.alwaysOnSettle)} keyColor={T.ink} land={F.nameAlwaysOn} />
      <Name
        f={f}
        x={SLOT_X}
        y={NAME_Y.Q}
        lines={['Hidden processor?']}
        size={settled(f, 731, F.qFill2, F.hiddenSettle2)}
        keyColor={T.structure}
        land={F.nameHidden}
      />
      <Name f={f} x={SLOT_X} y={NAME_Y.L1} lines={['What you see']} size={34} keyColor={T.structure} land={F.signIn} />

      {/* readout on the processor's rail, docked right of the playhead (flash-forward only) */}
      {f >= F.readoutIn - 1 && f < F.returnStart + 8 ? <Readout f={f} x={H + 22} /> : null}

      {/* ================= S03 ================= */}
      <KeyedTag
        anchor={[SEAT.button.cx + 8, SEAT.button.cy]}
        elbow={[SEAT.button.cx + 18, 234]}
        end={[372, 234]}
        text="Power button"
        role="part"
        land={F.tagPowerButton2}
        exitAt={F.powerButton2Out}
        plate={plate}
      />

      {/* ================= S04-S05: the lookout's name ================= */}

      {/* ================= S06: station names land with their Bits ================= */}
      <Name f={f} x={MAP.M2.press + 122} y={NAME_Y.MR} lines={['Power']} keyColor={T.energy} land={F.chain[0]} exitAt={F.lookAheadOut} />
      <Name f={f} x={MAP.M2.press + 178} y={346} lines={['Firmware', 'on CPU']} keyColor={T.annotation} land={F.chain[2]} exitAt={F.lookAheadOut} />
      <Name f={f} x={MAP.M2.press + 429} y={396} lines={['Loader']} keyColor={T.annotation} land={F.chain[3]} exitAt={F.lookAheadOut} />
      <Name f={f} x={MAP.M2.press + 626} y={396} lines={['Windows']} keyColor={T.annotation} land={F.chain[4]} exitAt={F.lookAheadOut} />

      {/* ================= S07: moments on the time rail ================= */}
      <Name f={f} x={MAP.M2.press + 34} y={154} lines={['One tap']} keyColor={T.annotation} land={F.oneTap} exitAt={F.s07Out} />
      <KeyedTag anchor={[1566, 217]} end={[1566, 154]} side="left" text="Sign-in screen" role="annotation" land={F.signIn} exitAt={F.s07Out} plate={plate} />

      {/* ================= S08 ================= */}
      <Name f={f} x={MAP.M2.press + 38} y={154} lines={['Why different?']} keyColor={T.ink} land={F.whyDifferent} exitAt={F.forkOut} />

      {/* ================= S09: stops ================= */}
      <KeyedTag anchor={[864, 392]} end={[904, 392]} text="Stop: AMD" role="muted" land={F.amd} exitAt={F.stopsOut} plate={plate} />
      <KeyedTag anchor={[864, 616]} end={[904, 616]} text="Stop: laptops" role="muted" land={F.laptops} exitAt={F.stopsOut} plate={plate} />

      {/* ================= S10: standby, and the two conditions on the real parts ================= */}
      <KeyedTag
        anchor={[MAP.M3.home - 28, Y.SB - 7]}
        end={[MAP.M3.home - 28, 714]}
        side="left"
        text="Standby power"
        secondary="+5VSB · ATX"
        role="standby"
        land={F.standbyTag}
        exitAt={F.s10TagsOut}
        plate={plate}
      />
      <KeyedTag
        anchor={[SEAT.rocker.x + SEAT.rocker.w / 2, SEAT.rocker.y + 2]}
        elbow={[SEAT.rocker.x + SEAT.rocker.w / 2, NAME_Y.SB]}
        end={[SLOT_X, NAME_Y.SB]}
        text="Rear switch"
        role="part"
        land={F.rear}
        exitAt={F.rearOut}
        plate={plate}
      />
      {/* where the "Plugged in" leader crosses the lane-4 brace, the brace (lower layer) takes a gap */}
      {f >= F.plugged - 5 && f < F.s10TagsOut + 6 ? (
        <rect x={343} y={SEAT.inlet.y + SEAT.inlet.h / 2 - 6} width={16} height={12} fill={GROUND} />
      ) : null}
      <KeyedTag
        anchor={[SEAT.inlet.x + SEAT.inlet.w - 4, SEAT.inlet.y + SEAT.inlet.h / 2]}
        elbow={[362, SEAT.inlet.y + SEAT.inlet.h / 2]}
        end={[SLOT_X, NAME_Y.MR]}
        text="Plugged in"
        role="part"
        land={F.plugged}
        exitAt={F.s10TagsOut}
        plate={plate}
      />

      {/* ================= S11 ================= */}
      <KeyedTag anchor={[MAP.M3.press + 4, Y.rail + 4]} end={[MAP.M3.press + 38, 240]} text="Wake sources" role="part" land={F.reason} exitAt={F.wakeTagOut} plate={plate} />

      {/* ================= pills ================= */}
      {/* "Soft-off" rides the playhead (docked on its left, on the time rail); fades for the long M2b -> M3 move.
          It never runs into the PRESS flag: on the S12 approach it stops 6 px short of the flag's rim. */}
      <StatePill x={softDock} y={Y.rail - 4} dock="top-left" timeline={[{at: F.softOffIn, label: 'Soft-off'}, {at: F.offRestamp, label: 'Soft-off'}]} inAt={F.softOffIn} outAt={F.forkOut} />
      <StatePill x={softDock} y={Y.rail - 4} dock="top-left" label="Soft-off" inAt={1277} outAt={F.softOffOut} />
      <StatePill x={nowDock - 10} y={NAME_Y.MR + 37} dock="top-left" label="Main power: OFF" inAt={F.mainPowerPill} outAt={F.mainPowerOut} />
      <StatePill x={nowDock - 10} y={NAME_Y.MR + 37} dock="top-left" label="Main rails: OFF" inAt={F.mainRailsPill} />

      {/* ================= the axis note ================= */}
      {axisNote > 0 ? (
        <text x={1560} y={146} dominantBaseline="central" style={{fontFamily: SANS, fontWeight: 600, fontSize: 30}} fill={T.textMuted} opacity={axisNote}>
          Not to scale
        </text>
      ) : null}
      {s && P ? null : null}
    </g>
  );
};

/** "0 instructions": mono readout (0 at 64 px, unit at 38 px), only a number the narration says. */
const Readout: React.FC<{f: number; x: number}> = ({f, x}) => {
  const t = tagTiming(f, F.readoutIn, F.returnStart);
  if (!t.visible || t.text <= 0) return null;
  return (
    <foreignObject x={x - 10} y={NAME_Y.L2 - 52} width={600} height={100} style={{overflow: 'visible'}}>
      <div style={{display: 'inline-flex', alignItems: 'baseline', padding: '0 10px', opacity: t.text, transform: `translateX(${-t.textX}px)`, background: withAlpha(GROUND, 0.9), borderRadius: 8}}>
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 64, lineHeight: 1.15, color: T.ink}}>0</span>
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: 38, lineHeight: 1.15, color: T.textMuted, marginLeft: 14}}>instructions</span>
      </div>
    </foreignObject>
  );
};
