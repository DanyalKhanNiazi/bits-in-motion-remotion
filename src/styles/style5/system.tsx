/**
 * The system page: B (board, inside), P (power supply, inside) and O (case front + monitor, outside).
 * Carries S01–S05 (pages P1–P2), S07 (P4), S11–S12 (P8–P9); it is also the S06 thumbnail (through a view) and
 * the start of the S08 glide (B and P fold, O moves).
 */
import React from 'react';
import {AnalogyFrame, Bit, Brackets, EyeBadge, SignalRoute, StateGlyph, StatePill, kitWarn, mixColor, type BitRun, type Pt} from '../../shared';
import {LEAD_RUNS, RUN_FF, RUN_S04, RUN_S12} from './runs';
import {D, L, TONE, W, ID, compose, vp, vpts, vbox, poly, type Box, type View} from './look';
import {Caption, DrawOn, PanelClip, Plate, Rules, Stk, type Port} from './panel';
import {BoardArt, OutsideArt, PsuArt} from './hw';
import {Channel5, Lens5} from './devices';
import {Header5, Readout, Tag5} from './labels';
import * as G from './geo';
import {F} from './T';
import {EASE, clamp01, progress} from '../../shared';

/* ------------------------------------------------------------------------------------------ Bit runs */

const RUNS = LEAD_RUNS;

/** arc length where the route crosses x (on the y 839 run toward B) */
const sAtX = (run: BitRun, x: number): number => {
  const tr = run.track;
  for (let i = 1; i < tr.pts.length; i++) {
    const a = tr.pts[i - 1];
    const b = tr.pts[i];
    if (Math.abs(a[1] - G.PORT_Y_LEAD) < 1 && Math.abs(b[1] - G.PORT_Y_LEAD) < 1 && a[0] >= x && b[0] <= x) {
      return tr.cum[i - 1] + (a[0] - x);
    }
  }
  return 0;
};
const passFrame = (run: BitRun, s: number): number => {
  for (let f = run.depart; f <= run.land + 60; f++) if (run.sAt(f) >= s) return f;
  return run.land;
};
const S_OPORT = sAtX(RUN_FF, G.PO.x);
const S_BPORT = sAtX(RUN_FF, G.PB.x + G.PB.w);
/** Frames at which each Bit enters B (the active rim moves O → B). */
export const ENTER_B = RUNS.map((r) => passFrame(r, S_BPORT));

/** Port open level around a Bit's crossing at arc length sp: opens 4 frames before the halo arrives, closes 6 after. */
const portOpen = (frame: number, sp: number): number => {
  let o = 0;
  for (const r of RUNS) {
    if (frame < r.depart - 6 || frame > r.land + 20) continue;
    const fa = passFrame(r, sp - 36);
    const fb = passFrame(r, sp + 36);
    const a = progress(frame, fa - 4, 4, EASE.arrive);
    const b = 1 - progress(frame, fb + 6, 4, EASE.exit);
    o = Math.max(o, Math.min(a, b));
  }
  return o;
};

/* ------------------------------------------------------------------------------------------ state */

type PanelId = 'B' | 'P' | 'O' | 'L' | 'none';
/** Exactly one active panel; the rim moves in 6 frames when the narration's subject moves. */
const ACTIVE: Array<[number, PanelId]> = [
  [0, 'O'],
  [ENTER_B[0], 'B'],
  [F.smaller, 'L'],
  [F.lens1Close, 'O'],
  [F.mainPowerOff - 6, 'P'],
  [436, 'O'],
  [ENTER_B[1], 'B'],
  [F.even, 'O'],
  [F.lens2Open + 9, 'L'],
  [F.stepBack, 'none'],
  [F.hidden - 6, 'B'],
  [985, 'O'],
  [F.glide, 'none'],
  [F.cutS11, 'B'],
  [F.lock, 'O'],
  [ENTER_B[2], 'B'],
];
export const activeLevel = (frame: number, id: PanelId): number => {
  let cur = 0;
  for (let i = 0; i < ACTIVE.length; i++) if (ACTIVE[i][0] <= frame) cur = i;
  const [at, who] = ACTIVE[cur];
  const prev = cur > 0 ? ACTIVE[cur - 1][1] : 'none';
  const t = cur === 0 ? 1 : progress(frame, at, 6, EASE.arrive);
  if (who === id) return prev === id ? 1 : t;
  if (prev === id) return 1 - t;
  return 0;
};

/** "?" ON level: only inside the flash-forward (f294 on "already" → off at the return f327). */
export const qLevel = (frame: number): number =>
  Math.min(progress(frame, F.qOn, 5, EASE.arrive), 1 - progress(frame, F.ret, 5, EASE.exit));

/** Double rule (another time): f2–f8 in, collapses f327–f335. */
const doubleLevel = (frame: number): number =>
  Math.min(progress(frame, F.ruleDouble, 6, EASE.arrive), 1 - progress(frame, F.ret, 8, EASE.move));

/** Lens open (the B-level pips and badge of the two blocks hide; they appear once, in the inset). After the S05
 *  inset they stay hidden until the S06 step-back, where the thumbnail fades its pips in (review fix: they used to
 *  fade back in f705–f708 and then pop at the f709 page change). */
const lensCover = (frame: number): number =>
  Math.max(
    Math.min(progress(frame, F.lens1Open, 6), 1 - progress(frame, F.lens1Close, 6)),
    frame < F.stepBack ? progress(frame, F.lens2Open, 6) : 0,
  );

/** Thumbnail mode (S06): the pips fade in with the step-back; the "?" badge (retracted while the page is held small)
 *  fades back in during the grow-back, so it is whole when the full page returns at f926. */
const thumbPips = (frame: number): number => progress(frame, F.stepBack, 6, EASE.arrive);
const thumbBadge = (frame: number): number => progress(frame, F.s06Out + 8, 6, EASE.arrive);

/** Fingertip and cap: two spoken presses only (f0, f1837). */
const press = (frame: number): {cap: number; finger: {show: number; dy: number} | null} => {
  if (frame <= 60) {
    if (frame === 0) return {cap: 0.5, finger: {show: 1, dy: 6}};
    if (frame < F.capUp0) return {cap: 1, finger: {show: 1, dy: 12}};
    const rel = progress(frame, F.capUp0, 4, EASE.outCubic); // 36–40 cap springs back
    const lift = progress(frame, F.fingerOut0, 8, EASE.inCubic); // 40–48 lift out
    return {cap: 1 - rel, finger: lift >= 1 ? null : {show: 1, dy: 12 * (1 - rel) - 240 * lift}};
  }
  if (frame >= F.now) {
    const enter = progress(frame, F.now, 6, EASE.outCubic); // 1830–1836
    const down = progress(frame, F.contact1 - 1, 2, EASE.linear); // contact on f1837 (50%, like f0), full f1838
    const rel = progress(frame, F.capUp1, 3, EASE.outCubic); // 1846–1849
    const lift = progress(frame, F.fingerOut1, 8, EASE.inCubic); // 1850–1858
    const dy = -220 * (1 - enter) + 12 * down * (1 - rel) - 240 * lift;
    return {cap: down * (1 - rel), finger: lift >= 1 ? null : {show: 1, dy}};
  }
  return {cap: 0, finger: null};
};

/* ------------------------------------------------------------------------------------------ the page */

export interface SystemProps {
  frame: number;
  /** page view (identity at ×1; the S06 thumbnail) */
  view?: View;
  /** thumbnail mode: quiet (no labels, no Bit, no Lens) */
  thumb?: boolean;
  /** S08: B and P fold (0..1), O glides to this box */
  fold?: number;
  oBox?: Box;
  /** fade the whole page's contents in (frame-first open after a cut) */
  contentIn?: number;
  /** show labels (tags, pills, header) */
  labels?: boolean;
  /** S08: O is drawn by the pair page */
  hideO?: boolean;
  opacity?: number;
}


export const SystemPage: React.FC<SystemProps> = ({frame, view = ID, thumb = false, fold = 0, oBox, contentIn = 1, labels = true, hideO = false, opacity = 1}) => {
  const v = view;
  const q = qLevel(frame);
  const dbl = thumb ? 0 : doubleLevel(frame);
  const act = (id: PanelId) => (thumb ? 0 : activeLevel(frame, id));
  const pr = thumb ? {cap: 0, finger: null} : press(frame);
  const lc = thumb ? 0 : lensCover(frame);
  const leadPort = thumb
    ? 0
    : Math.max(
        portOpen(frame, S_OPORT),
        portOpen(frame, S_BPORT),
        Math.min(progress(frame, F.inkRoute - 3, 4), 1 - progress(frame, F.inkRouteOut + 2, 4)),
      );
  const portO = thumb ? 0 : Math.max(portOpen(frame, S_OPORT), Math.min(progress(frame, F.inkRoute - 3, 4), 1 - progress(frame, F.inkRouteOut + 2, 4)));
  const portB = thumb ? 0 : Math.max(portOpen(frame, S_BPORT), Math.min(progress(frame, F.inkRoute - 3, 4), 1 - progress(frame, F.inkRouteOut + 2, 4)));
  void leadPort;

  // boxes (folding B and P toward their left edges; O gliding)
  const bB0 = vbox(v, G.PB);
  const bP0 = vbox(v, G.PP);
  const bO0 = vbox(v, G.PO);
  const foldK = 1 - fold;
  const bB: Box = {...bB0, w: bB0.w * foldK};
  const bP: Box = {...bP0, w: bP0.w * foldK};
  const bO: Box = oBox ?? bO0;
  const vO: View = oBox ? compose({s: 1, tx: oBox.x - G.PO.x, ty: oBox.y - G.PO.y}, ID) : v;
  const showBP = fold < 0.999;
  const crossOp = 1 - clamp01(fold * 3);

  // S11 wash, wake routes
  const wash = progress(frame, F.just, 8, EASE.arrive) * (frame >= F.cutS11 ? 1 : 0);
  const shimmer = thumb
    ? 0
    : Math.max(
        Math.min(progress(frame, F.cutS11, 8), 1 - progress(frame, F.shimmerEnd, 10)),
        0,
      );

  // channel scale (thumbnail)
  const s = v.s;
  const mainPts = vpts(v, G.MAIN_PTS);
  const stbyPts = vpts(v, G.STBY_PTS);
  const leadIdle = poly(vpts(v, G.LEAD_IDLE_PTS));

  const oHeld = 1 - act('O');
  const plateO = oHeld <= 0 ? TONE.plateOut : oHeld >= 1 ? TONE.plateOutHeld : mixColor(TONE.plateOut, TONE.plateOutHeld, oHeld);

  return (
    <g opacity={opacity}>
      {/* ---------------- plates and contents */}
      {showBP ? (
        <>
          <Plate box={bB} polarity="in" />
          <PanelClip box={bB} opacity={contentIn}>
            <BoardArt v={v} q={q} qGlow={q} wash={wash} />
          </PanelClip>
          <Plate box={bP} polarity="in" />
          <PanelClip box={bP} opacity={contentIn}>
            <PsuArt v={v} />
          </PanelClip>
        </>
      ) : null}
      {!hideO ? (
        <>
          <Plate box={bO} polarity="out" color={plateO} />
          <PanelClip box={bO} opacity={contentIn}>
            <OutsideArt v={vO} cap={pr.cap} finger={pr.finger} />
          </PanelClip>
        </>
      ) : null}

      {/* ---------------- energy channels (P → gutter → B) and the button's lead (O → gutter → B) */}
      {showBP ? (
        <g opacity={crossOp * contentIn}>
          <Channel5 pts={mainPts} kind="main" s={s} front={0} frame={frame} />
          <Channel5 pts={stbyPts} kind="standby" s={s} front={1} shimmer={shimmer} frame={frame} />
          <path d={leadIdle} fill="none" stroke={D.structure} strokeWidth={W.route} strokeLinejoin="round" />
          {!thumb ? <WakeRoutes frame={frame} /> : null}
          {!thumb ? <InkRoute frame={frame} /> : null}
        </g>
      ) : null}

      {/* ---------------- rules (frame grammar) with ports */}
      {showBP ? (
        <>
          <Rules
            box={bB}
            plate={TONE.plateIn}
            polarity="in"
            active={act('B')}
            double={dbl}
            ports={[
              {side: 'right', at: vp(v, [0, G.PORT_Y_MAIN])[1], open: 1, len: 34},
              {side: 'right', at: vp(v, [0, G.PORT_Y_STBY])[1], open: 1, len: 26},
              {side: 'right', at: vp(v, [0, G.PORT_Y_LEAD])[1], open: portB},
            ]}
          />
          <Rules
            box={bP}
            plate={TONE.plateIn}
            polarity="in"
            active={act('P')}
            double={dbl}
            ports={[
              {side: 'left', at: vp(v, [0, G.PORT_Y_MAIN])[1], open: 1, len: 34},
              {side: 'left', at: vp(v, [0, G.PORT_Y_STBY])[1], open: 1, len: 26},
            ]}
          />
        </>
      ) : null}
      {!hideO ? (
        <Rules box={bO} plate={plateO} polarity="out" active={act('O')} double={dbl} ports={[{side: 'left', at: vp(v, [0, G.PORT_Y_LEAD])[1], open: portO} as Port]} />
      ) : null}

      {/* ---------------- wash boundary (S11) */}
      {wash > 0 && showBP ? <path d={poly(vpts(v, G.DOMAIN_PTS), true)} fill="none" stroke={D.annotation} strokeWidth={3} strokeLinejoin="round" opacity={wash} /> : null}

      {/* ---------------- the Bit (halo kept on dark ground) and its lit trail */}
      {!thumb && fold === 0 ? <Bits frame={frame} /> : null}

      {/* ---------------- state pips and the "?" badge (page size, at mapped corners) */}
      {showBP ? (
        <g opacity={contentIn * (1 - clamp01(fold * 3))}>
          <Pips frame={frame} v={v} hideBlocks={thumb ? 1 - thumbPips(frame) : lc} badge={thumb ? thumbBadge(frame) : 1} />
        </g>
      ) : null}

      {/* ---------------- labels */}
      {labels ? <SystemLabels frame={frame} plateO={plateO} fold={fold} oBox={bO} vO={vO} /> : null}

      {/* ---------------- the Lens insets (S02, S05) */}
      {!thumb ? <Lenses frame={frame} /> : null}

      {/* ---------------- brackets (S11 "like that button") */}
      {!thumb && frame >= F.lock - 6 && frame < F.bracketsFade + 8 ? (
        <Brackets theme={D} box={{x: G.BUTTON_C[0] - G.BUTTON_R, y: G.BUTTON_C[1] - G.BUTTON_R, w: 2 * G.BUTTON_R, h: 2 * G.BUTTON_R}} lockAt={F.lock} fadeAt={F.bracketsFade} />
      ) : null}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------ pieces */


const Bits: React.FC<{frame: number}> = ({frame}) => {
  const clip = 'url(#s5-darkground)';
  return (
    <g>
      <defs>
        <clipPath id="s5-darkground">
          <rect x={0} y={0} width={G.PO.x} height={1080} />
          <rect x={G.CASE_FRONT.x} y={G.CASE_FRONT.y} width={G.CASE_FRONT.w} height={1080 - G.CASE_FRONT.y} />
        </clipPath>
      </defs>
      <SignalRoute path={G.BUTTON_D} runs={RUNS} idle={false} />
      <g clipPath={clip}>
        <Bit runs={RUN_FF} />
        <Bit runs={RUN_S04} />
        <Bit runs={RUN_S12} />
      </g>
    </g>
  );
};

const Pips: React.FC<{frame: number; v: View; hideBlocks: number; badge?: number}> = ({frame, v, hideBlocks, badge: badgeOp = 1}) => {
  const cpu = vp(v, [G.CPU.x + G.CPU.w, G.CPU.y]);
  const lk = vp(v, [G.LOOK.x + G.LOOK.w, G.LOOK.y]);
  const qb = vp(v, [G.QBLOCK.x + G.QBLOCK.w, G.QBLOCK.y]);
  const badge = vp(v, G.QBADGE_1);
  const show = 1 - hideBlocks;
  return (
    <g>
      <StateGlyph x={cpu[0]} y={cpu[1]} state="OFF" />
      {show > 0 ? (
        <g opacity={show}>
          <StateGlyph x={lk[0]} y={lk[1]} state="ALWAYS_ON" />
          <StateGlyph
            x={qb[0]}
            y={qb[1]}
            timeline={[
              {at: -1, state: 'OFF'},
              {at: F.qOn, state: 'ON'},
              {at: F.ret, state: 'OFF'},
            ]}
          />
          {badgeOp > 0 ? (
            <g opacity={badgeOp}>
              <StateGlyph x={badge[0]} y={badge[1]} dock="center" state="UNNAMED" fillAt={F.hidden} unfillAt={F.qUnfill} />
            </g>
          ) : null}
        </g>
      ) : null}
    </g>
  );
};

const InkRoute: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.inkRoute || frame > F.inkRouteOut + 10) return null;
  const t = progress(frame, F.inkRoute, 15, EASE.arrive);
  const out = progress(frame, F.inkRouteOut, 8, EASE.exit);
  const tick = progress(frame, F.inkRoute + 14, 4, EASE.arrive);
  const [ex, ey] = G.END_TICK;
  return (
    <g opacity={1 - out}>
      <DrawOn d={G.INK_D} c={D.ink} w={W.route} t={t} cap="butt" />
      {tick > 0 ? <Stk d={poly([[ex, ey - 8 * tick], [ex, ey + 8 * tick]])} c={D.ink} w={3} cap="butt" /> : null}
    </g>
  );
};

const WakeRoutes: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.notice) return null;
  const a = progress(frame, F.notice, 8, EASE.arrive);
  const b = progress(frame, F.notice + 3, 8, EASE.arrive);
  const c = progress(frame, F.notice + 6, 8, EASE.arrive);
  return (
    <g>
      <DrawOn d={poly(G.WAKE_LAN_PTS)} c={D.structure} w={W.route} t={a} />
      <DrawOn d={poly(G.WAKE_LAN2_PTS)} c={D.structure} w={W.route} t={b} />
      <DrawOn d={poly(G.WAKE_RTC_PTS)} c={D.structure} w={W.route} t={c} />
    </g>
  );
};

/* ------------------------------------------------------------------------------------------ Lens insets */

/** ×4 inset view: the chipset centre (892, 686) maps to the Lens centre (670, 700). */
export const LENS_C: Pt = [670, 700];
export const V4: View = {s: 4, tx: LENS_C[0] - 4 * 892, ty: LENS_C[1] - 4 * 686};
const TARGET: Pt = [G.CHIPSET.x, 686];

const InsetContent: React.FC<{frame: number; eye?: boolean}> = ({frame, eye}) => {
  const q = qLevel(frame);
  const lk = vp(V4, [G.LOOK.x + G.LOOK.w, G.LOOK.y]);
  const qb = vp(V4, [G.QBLOCK.x + G.QBLOCK.w, G.QBLOCK.y]);
  const qc = vp(V4, [G.QBLOCK.x + G.QBLOCK.w / 2, G.QBLOCK.y + G.QBLOCK.h / 2]);
  const lc = vp(V4, G.LOOK_C);
  return (
    <g>
      <BoardArt v={V4} q={q} qGlow={q} />
      <Channel5 pts={vpts(V4, G.STBY_PTS)} kind="standby" s={1} front={1} frame={frame} />
      <path d={poly(vpts(V4, G.LEAD_IDLE_PTS))} fill="none" stroke={D.structure} strokeWidth={W.route} strokeLinejoin="round" />
      <StateGlyph x={lk[0]} y={lk[1]} state="ALWAYS_ON" />
      <StateGlyph
        x={qb[0]}
        y={qb[1]}
        timeline={[
          {at: -1, state: 'OFF'},
          {at: F.qOn, state: 'ON'},
          {at: F.ret, state: 'OFF'},
        ]}
      />
      <StateGlyph x={qc[0]} y={qc[1]} dock="center" state="UNNAMED" fillAt={eye ? F.qFill : undefined} unfillAt={eye ? F.s05Out : undefined} />
      {eye ? <EyeBadge x={lc[0]} y={lc[1]} width={66} variant="analogy" inAt={F.eye} outAt={F.s05Out} /> : null}
    </g>
  );
};

/** Both Lens uses. Also drawn by the S06 step-back page (through its view) so the S05 inset finishes its close
 *  (f705–f711) instead of vanishing at the f709 page change. */
export const Lenses: React.FC<{frame: number}> = ({frame}) => (
  <>
    {frame >= F.lens1Leader && frame < F.lens1Close + 8 ? (
      <Lens5 frame={frame} cx={LENS_C[0]} cy={LENS_C[1]} d={300} leaderAt={F.lens1Leader} openAt={F.lens1Open} closeAt={F.lens1Close} target={TARGET}>
        <InsetContent frame={frame} />
      </Lens5>
    ) : null}
    {frame >= F.lens2Leader && frame < F.s05Out + 8 ? (
      <Lens5 frame={frame} cx={LENS_C[0]} cy={LENS_C[1]} d={300} leaderAt={F.lens2Leader} openAt={F.lens2Open} settleAt={F.settle} closeAt={F.s05Out} target={TARGET}>
        <InsetContent frame={frame} eye />
      </Lens5>
    ) : null}
  </>
);

/* ------------------------------------------------------------------------------------------ labels */

const SystemLabels: React.FC<{frame: number; plateO: string; fold: number; oBox: Box; vO: View}> = ({frame, plateO, fold, vO}) => {
  const [bx, by] = G.BUTTON_C;
  const pbAnchor: Pt = [bx + 15, by];
  const pbEnd: Pt = [1372, by];
  const pbSplit = G.CASE_FRONT.x + G.CASE_FRONT.w - pbAnchor[0];
  const cf = vp(vO, [G.CASE_FRONT.x + G.CASE_FRONT.w, G.CASE_FRONT.y]);
  const bFade = 1 - clamp01(fold * 3);
  return (
    <g>
      {/* time headers */}
      <Header5 frame={frame} text="After the press" inAt={F.afterIn} shrinkAt={F.afterShrink} outAt={F.ret} double />
      <Header5 frame={frame} text="When pressed" inAt={F.whenIn} outAt={F.whenOut} />
      <Header5 frame={frame} text="Now" inAt={F.now} />

      {/* S01 */}
      <Tag5 frame={frame} anchor={pbAnchor} end={pbEnd} text="Power button" land={F.powerButtonTag} exitAt={F.s01Exit} ground="light" anchorGround="dark" leaderSplit={pbSplit} plate={plateO} />
      <Tag5 frame={frame} anchor={[707, 362]} end={[528, 362]} side="left" text="Main processor" land={F.mainProcessor} exitAt={F.s01Exit} ground="dark" plate={TONE.plateIn} />
      <Tag5 frame={frame} anchor={[707, 416]} end={[528, 416]} side="left" text="Not first" land={F.notFirst} exitAt={F.ret} ground="dark" plate={TONE.plateIn} />
      {/* S02 */}
      <Readout frame={frame} x={170} y={474} value="0" unit="instructions" inAt={F.zeroInstr} outAt={F.ret} />

      {/* return: the present state */}
      <g opacity={fold > 0 ? 1 - clamp01(fold * 4) : 1}>
        <StatePill theme="light" x={cf[0]} y={cf[1]} label="Soft-off" inAt={F.softOffIn} outAt={F.stepBack} />
        <StatePill theme="light" x={cf[0]} y={cf[1]} label="Soft-off" inAt={F.s06Out + 10} outAt={F.softOffOut} />
        <StatePill theme="light" x={cf[0]} y={cf[1]} label="Soft-off" inAt={F.cutS11} />
      </g>

      {/* S03 */}
      <Tag5 frame={frame} anchor={pbAnchor} end={pbEnd} text="Power button" land={F.powerButtonTag2} exitAt={F.s03TagExit} ground="light" anchorGround="dark" leaderSplit={pbSplit} plate={plateO} />
      <StatePill theme={D} x={1150} y={334} dock="none" label="Main power: OFF" inAt={F.mainPowerOff} outAt={F.mainPowerOut} />

      {/* S04 */}
      <Tag5 frame={frame} anchor={[898, 707]} end={[884, 900]} elbow={[884, 721]} side="left" text="Always-on logic" land={F.alwaysOnTag} exitAt={F.alwaysOnExit} ground="dark" plate={TONE.plateIn} />

      {/* S07 */}
      <g opacity={bFade}>
        {/* text in zone F below the board (like "Always-on logic"), so its plate no longer cuts the board's edge */}
        <Tag5 frame={frame} anchor={[812, 672]} end={[812, 900]} side="left" text="Hidden processor?" land={F.hidden} exitAt={F.hiddenExit} ground="dark" plate={TONE.plateIn} />
      </g>
      <SignInArc frame={frame} />

      {/* S11 */}
      <Tag5 frame={frame} anchor={[1004, 854]} end={[1004, 900]} side="left" text="Standby-powered" land={F.just} exitAt={F.standbyPoweredExit} ground="dark" plate={TONE.plateIn} />
      <Tag5 frame={frame} anchor={pbAnchor} end={pbEnd} text="Power button" land={F.lock} exitAt={F.powerButtonExit} ground="light" anchorGround="dark" leaderSplit={pbSplit} plate={plateO} />
    </g>
  );
};

/** S07: a dashed analogy arc from the button to a dashed generic sign-in card ABOVE the monitor, never on it. */
const SignInArc: React.FC<{frame: number}> = ({frame}) => {
  if (frame < F.oneTap || frame > F.arcOut + 8) return null;
  const t = progress(frame, F.oneTap, F.signIn - 6 - F.oneTap, EASE.arrive);
  const out = progress(frame, F.arcOut, 6, EASE.exit);
  // leaves the button's lower-right edge and passes ≥ 10 px under the front ports and jacks, ≥ 28 px above the bay
  // covers and the monitor (review fix: it used to run through the lower USB port)
  const a: Pt = [G.BUTTON_C[0] + 12, G.BUTTON_C[1] + 12];
  const card = {x: 1604, y: 566, w: 196, h: 134};
  const b: Pt = [card.x - 6, card.y + card.h / 2 + 10];
  const c1: Pt = [1290, 708];
  const c2: Pt = [1470, 712];
  const d = `M${a[0]} ${a[1]}C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${b[0]} ${b[1]}`;
  const cardIn = progress(frame, F.signIn, 6, EASE.arrive);
  // pathLength for a cubic: approximate via the kit's flattening
  return (
    <g opacity={1 - out}>
      <DashedDraw d={d} t={t} />
      {cardIn > 0 ? (
        <g opacity={cardIn}>
          <AnalogyFrame theme="light" x={card.x} y={card.y} w={card.w} h={card.h} r={12} />
          <circle cx={card.x + card.w / 2} cy={card.y + 50} r={20} fill="none" stroke={L.annotation} strokeWidth={3} />
          <path d={poly([[card.x + 40, card.y + 98], [card.x + card.w - 40, card.y + 98]])} stroke={L.annotation} strokeWidth={3} strokeLinecap="round" />
        </g>
      ) : null}
    </g>
  );
};

/** A dashed analogy line (12 on / 8 off, 3 px, light-set annotation) drawn on along its length. */
const DashedDraw: React.FC<{d: string; t: number}> = ({d, t}) => {
  if (t <= 0) return null;
  const id = `dd-${Math.round(t * 1000)}`;
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
          <path d={d} fill="none" stroke="#fff" strokeWidth={8} pathLength={1} strokeDasharray={`${t} 2`} />
        </mask>
      </defs>
      <path d={d} fill="none" stroke={L.annotation} strokeWidth={3} strokeDasharray="12 8" strokeLinecap="butt" mask={`url(#${id})`} />
    </g>
  );
};

if (RUN_FF.speed > 36 || RUN_S04.speed > 36) kitWarn('style5: a button run exceeds 36 px/frame');
