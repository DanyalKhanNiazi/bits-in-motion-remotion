/**
 * Signal Score: the lane heads. The f0-f142 stage strip (hardware only, in score order), the fold
 * into the seats, and the seated parts with their two literal links: the button's two-wire lead to the
 * front-panel header (then a short trace into the lookout) and the standby link from the supply.
 */
import React from 'react';
import {Bit, LandingRipple} from '../../shared/components';
import {routePath, rectPath, type Pt} from '../../shared/geom';
import {bitRun, EASE, progress} from '../../shared/motion';
import {mixColor} from '../../shared/brand';
import {GROUND, SEAT, STRIP, T, WASH, X, Y} from './layout';
import {F} from './timeline';
import {bump, CaseFront, Chipset, Cord, Cpu, Fold, HeaderBlock, Monitor, Psu, foldT} from './parts';
import {LitBehind, fadeIn, fadeOut, lookoutPulse} from './score';
import {playheadBaseX} from './timemap';
import {MAP} from './layout';

/* ------------------------------------------------------------------------------------------------
 * Strip-space geometry (the strip is the seat layout per group, scaled about its centre)
 * ---------------------------------------------------------------------------------------------- */

const SC = {row1: [228, 252], cpu: [240, 396], chipset: [240, 614], psu: [240, 844]} as const;
const ts = (g: keyof typeof SC, p: readonly [number, number]): Pt => {
  const st = STRIP[g];
  return [st.cx + (p[0] - SC[g][0]) * st.s, st.cy + (p[1] - SC[g][1]) * st.s];
};

const BTN = SEAT.button;
const stripButton = ts('row1', [BTN.cx, BTN.cy]);
const stripCaseLeft = ts('row1', [SEAT.caseFront.x, BTN.cy])[0];
const stripCpuLeft = ts('cpu', [SEAT.cpu.x, SEAT.cpu.y])[0];
const stripHeader = ts('chipset', [SEAT.header.x, SEAT.header.y + SEAT.header.h / 2]);
const stripLookout = ts('chipset', [SEAT.lookout.x + SEAT.lookout.w / 2, SEAT.lookout.y + SEAT.lookout.h / 2]);
const stripMargin = Math.min(stripCpuLeft - 26, stripHeader[0] - 10);
const ch1 = stripCaseLeft - stripMargin; // 45-degree chamfer from the case front to the margin
const ch2 = stripHeader[0] - stripMargin;

/** The flash-forward route in the strip: out of the button, past the processor, to the header, into the lookout. */
export const STRIP_LEAD: Pt[] = [
  stripButton,
  [stripCaseLeft, stripButton[1]],
  [stripMargin, stripButton[1] + ch1],
  [stripMargin, stripLookout[1] - ch2],
  [stripHeader[0], stripLookout[1]],
  stripLookout,
];
const STRIP_LEAD_D = routePath(STRIP_LEAD);
export const FF_RUN = bitRun({path: STRIP_LEAD_D, depart: F.ffDepart, land: F.ffLand, label: 'flash-forward (strip)'});

/** Strip standby link: from the supply's top edge up into the lookout's underside. */
const stripSbTop = ts('chipset', [226, SEAT.chipset.y + SEAT.chipset.h]);
const stripSbBottom: Pt = [stripSbTop[0], ts('psu', [226, SEAT.psu.y])[1]];

/* Seat geometry ---------------------------------------------------------------------------------- */
const SEAT_LEAD_D = routePath([
  [BTN.cx, BTN.cy],
  [X.margin, BTN.cy],
  [X.margin, Y.LK],
  [SEAT.header.x, Y.LK],
]);
const SEAT_TRACE_D = `M${SEAT.header.x + SEAT.header.w} ${Y.LK}H${SEAT.lookout.x}`;
const SB_X = 226;

/* ------------------------------------------------------------------------------------------------
 * Small parts of the head layer
 * ---------------------------------------------------------------------------------------------- */

/** A thin standby channel (10 px: 2 px walls + 6 px amber) between two points on a vertical. */
const StandbyLink: React.FC<{x: number; y0: number; y1: number; opacity: number; shimmer?: number; f: number}> = ({x, y0, y1, opacity, shimmer = 0, f}) => {
  if (opacity <= 0) return null;
  const top = Math.min(y0, y1);
  const bot = Math.max(y0, y1);
  return (
    <g opacity={opacity}>
      <path d={`M${x} ${bot}V${top}`} stroke={T.energyStandby} strokeWidth={6} />
      {shimmer > 0 ? (
        <path d={`M${x} ${bot}V${top}`} stroke="#FFFFFF" strokeOpacity={0.16 * shimmer} strokeWidth={6} strokeDasharray="30 30" strokeDashoffset={-(f - F.trickle)} />
      ) : null}
      <path d={`M${x - 4} ${bot}V${top}M${x + 4} ${bot}V${top}`} stroke={T.structure} strokeWidth={2} />
    </g>
  );
};

/** The "typical" accent cascades down the lane heads in depth order (f1269 +3 per lane). */
const typicalAccent = (f: number, lane: number) => bump(f, F.typical + 3 * lane, 6);

export const HeadsLayer: React.FC<{f: number}> = ({f}) => {
  const t = foldT(f);
  const seated = f >= F.foldEnd;
  // strip links fade out at the start of the fold; seat links redraw at the seats
  const stripLinks = fadeOut(f, F.foldStart, 6);
  const seatLinks = f >= F.foldEnd - 6 ? fadeIn(f, F.foldEnd - 6, 6) : 0;
  // states
  const qOn = Math.min(progress(f, F.qWakes, 5, EASE.arrive), 1 - progress(f, rewindQ(), 5, EASE.exit));
  const qFill = Math.max(
    Math.min(progress(f, F.qFill, 6, EASE.arrive), 1 - progress(f, F.qUnfill, 6, EASE.exit)),
    Math.min(progress(f, F.qFill2, 6, EASE.arrive), 1 - progress(f, F.qUnfill2, 6, EASE.exit)),
  );
  const qBadgeScale = 1 + 0.12 * bump(f, F.qTrackIn, 6);
  const endTick = progress(f, F.doesnt, 6) * (1 - progress(f, F.powerButton2Out, 6));
  const sbShimmer = Math.min(progress(f, F.trickle, 8), 1 - progress(f, F.lockOut + 22, 8));
  const psuAccent = Math.max(bump(f, F.psuAccent, 6), typicalAccent(f, 3));
  const plugAcc = progress(f, F.plugged, 6) * fadeOut(f, F.s10TagsOut, 6);
  const rearAcc = progress(f, F.rear, 6) * fadeOut(f, F.rearOut, 6);
  const wash = fadeIn(f, F.wash, 8) * fadeOut(f, F.realPress + 13, 8);
  const ffRouteVisible = f < F.foldStart + 6;

  return (
    <g>
      {/* ---------- strip-space links (f0-f148) ---------- */}
      {stripLinks > 0 ? (
        <g opacity={stripLinks}>
          <path d={STRIP_LEAD_D} fill="none" stroke={T.structure} strokeWidth={3} strokeLinejoin="round" />
          <StandbyLink x={stripSbTop[0]} y0={stripSbBottom[1]} y1={stripSbTop[1]} opacity={1} f={f} />
        </g>
      ) : null}
      {ffRouteVisible ? <LitBehind f={f} runs={[FF_RUN]} /> : null}

      {/* S11 wash in the heads: the standby link between the supply and the lookout (inside the parts: see Chipset / Psu) */}
      {wash > 0 ? (
        <path
          d={rectPath(SB_X - 13, SEAT.chipset.y + SEAT.chipset.h + 2, 26, SEAT.psu.y - SEAT.chipset.y - SEAT.chipset.h - 4, 4)}
          fill={WASH}
          stroke={T.annotation}
          strokeOpacity={0.55}
          strokeWidth={2}
          opacity={wash}
        />
      ) : null}

      {/* ---------- seat-space links (from f166) ---------- */}
      {seatLinks > 0 ? (
        <g opacity={seatLinks}>
          <path d={SEAT_LEAD_D} fill="none" stroke={T.structure} strokeWidth={3} strokeLinejoin="round" />
          <path d={SEAT_TRACE_D} fill="none" stroke={T.structure} strokeWidth={3} />
          <StandbyLink x={SB_X} y0={SEAT.psu.y} y1={SEAT.chipset.y + SEAT.chipset.h} opacity={1} shimmer={sbShimmer} f={f} />
        </g>
      ) : null}

      {/* ---------- the parts ---------- */}
      <Fold g="psu" f={f}>
        {(s) => (
          <g>
            <Cord s={s} />
            <Psu s={s} accent={psuAccent} wash={wash} sbX={SB_X} />
            {plugAcc > 0 ? <PlugAccent a={plugAcc} s={s} /> : null}
            {rearAcc > 0 ? <RockerAccent a={rearAcc} s={s} /> : null}
          </g>
        )}
      </Fold>
      <Fold g="chipset" f={f}>
        {(s) => (
          <g>
            <HeaderBlock s={s} endTick={endTick} />
            <Chipset f={f} s={s} st={{qOn, qFill, qBadgeScale, lookoutPulse: lookoutPulse(f), accent: typicalAccent(f, 2), lkStub: progress(f, F.foldEnd, 4, EASE.arrive), qStub: f >= F.qTrackIn ? 1 : 0, wash}} />
          </g>
        )}
      </Fold>
      <Fold g="cpu" f={f}>
        {(s) => <Cpu s={s} accent={typicalAccent(f, 1)} />}
      </Fold>
      <Fold g="row1" f={f}>
        {(s) => (
          <g>
            <Monitor s={s} accent={typicalAccent(f, 0)} />
            <CaseFront f={f} s={s} accent={typicalAccent(f, 0)} />
          </g>
        )}
      </Fold>

      {/* the flash-forward Bit (strip): absorbed into the landing ripple, no park, no glyph change */}
      {f >= F.ffDepart && f < F.ffLand + 12 ? <Bit runs={FF_RUN} /> : null}
      {/* S04: the demonstration lands on the lookout in the head too (ripple only) */}
      {seated ? (
        <LandingRipple x={SEAT.lookout.x + SEAT.lookout.w / 2} y={SEAT.lookout.y + SEAT.lookout.h / 2} at={F.s04Land} />
      ) : null}
      {t < 0 ? null : null}
    </g>
  );
};

/** When the rewinding playhead passes the start of the "?" block (it flips OFF in the head then). */
const rewindQ = (): number => {
  for (let f = F.returnStart; f <= F.returnEnd; f++) if (playheadBaseX(f) <= MAP.M1.ffArrive) return f;
  return F.returnEnd;
};

const PlugAccent: React.FC<{a: number; s: number}> = ({a, s}) => {
  const inl = SEAT.inlet;
  const x = inl.x + inl.w / 2;
  const y0 = inl.y + inl.h;
  return (
    <g opacity={a}>
      <path d={rectPath(inl.x + 5, inl.y + 7, inl.w - 10, inl.h - 9, 3)} fill="none" stroke={T.ink} strokeWidth={3 / s} />
      <path d={`M${x} ${y0}V${y0 + 30}`} stroke={T.ink} strokeWidth={4 / s} />
    </g>
  );
};

const RockerAccent: React.FC<{a: number; s: number}> = ({a, s}) => {
  const rk = SEAT.rocker;
  return (
    <g opacity={a}>
      <path d={rectPath(rk.x - 1, rk.y - 1, rk.w + 2, rk.h + 2, 5)} fill="none" stroke={T.ink} strokeWidth={3 / s} />
    </g>
  );
};

export {mixColor, GROUND};
