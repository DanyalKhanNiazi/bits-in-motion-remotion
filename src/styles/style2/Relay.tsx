/**
 * P, the relay: a preview of after the press, letterboxed under "After the press". Six stations rise on an
 * arc from lower left (deep, small) to upper right (near, large), threaded by one signal route.
 *   1 the always-on block (lit, breathing, eye badge), fed by thin standby from a plug-and-cord silhouette;
 *   2 Power: an 18 px double-walled energy segment (it runs no code) that fills on its landing;
 *   3 the "?" block; 4 a plain firmware plate; 5 a loader plate; 6 a 16:9 screen plate on exactly the
 *   monitor's rectangle in W, so the f913 match cut turns it into the real, black monitor.
 * Opened by a match cut (station 1 = the magnified lookout, same place and size) and a camera reveal.
 */
import React from 'react';
import {bitRun, routePath, squarePath, rectPath, EnergyChannel, StateGlyph, EyeBadge, breathe, progress, EASE, clamp01, type BitRun, type Pt} from '../../shared';
import {F} from './timeline';
import {ROOM} from './set';
import {LitPart, Part, type SRect} from './draw';
import {CamBit, CamRouteLight} from './BitLayer';
import {PartName, Tag} from './Tag';
import {TONE, T} from './tones';
import type {Cam} from './camera';

/* ---------------------------------------------------------------- end layout (relay coordinates = screen at f740) */

export const ST1 = {cx: 560, cy: 790, s: 84};
const st1Box: SRect = {x: ST1.cx - ST1.s / 2, y: ST1.cy - ST1.s / 2, w: ST1.s, h: ST1.s};
const POWER: Pt[] = [
  [652, 760],
  [802, 760],
];
const Q: SRect = {x: 860, y: 659, w: 88, h: 62};
const FW: SRect = {x: 1062, y: 440, w: 245, h: 133};
const LD: SRect = {x: 1366, y: 360, w: 190, h: 82};
const SCR: SRect = {x: ROOM.monitorScreen.x, y: ROOM.monitorScreen.y, w: ROOM.monitorScreen.w, h: ROOM.monitorScreen.h};
const PLUG: SRect = {x: 300, y: 890, w: 46, h: 32};

/** "Always-on logic" in relay coordinates: the W2 tag (anchor (960.4, 715.2), elbow (930, 685.2), end (890, 685.2)
 *  on screen at f713) divided through the f714 relay camera (k 92/84, T (389.1, -150.0)). */
const ALWAYS_ON_TAG: {anchor: Pt; elbow: Pt; end: Pt} = {
  anchor: [ST1.cx - ST1.s / 2 + 3.65, ST1.cy],
  elbow: [493.9, 762.6],
  end: [457.4, 762.6],
};

/** The standby feed: plug -> station 1's left side. */
const FEED: Pt[] = [
  [PLUG.x + PLUG.w, 906],
  [ST1.cx, 906],
  [ST1.cx, ST1.cy + ST1.s / 2],
];

const HOP1: Pt[] = [
  [ST1.cx + ST1.s / 2, 790],
  [622, 790],
  [622, 760],
  [POWER[0][0], 760],
];
const HOP2: Pt[] = [
  [POWER[0][0], 760],
  [POWER[0][0], 734],
  [836, 734],
  [836, Q.y + Q.h / 2],
  [Q.x, Q.y + Q.h / 2],
];
const HOP3: Pt[] = [
  [Q.x + Q.w, Q.y + Q.h / 2],
  [1028, Q.y + Q.h / 2],
  [1028, FW.y + FW.h / 2],
  [FW.x, FW.y + FW.h / 2],
];
const HOP4: Pt[] = [
  [FW.x + FW.w, FW.y + FW.h / 2],
  [1336, FW.y + FW.h / 2],
  [1336, LD.y + LD.h / 2],
  [LD.x, LD.y + LD.h / 2],
];
const HOP5: Pt[] = [
  [LD.x + LD.w, LD.y + LD.h / 2],
  [1598, LD.y + LD.h / 2],
  [1598, SCR.y + 30],
  [SCR.x, SCR.y + 30],
];

const R = (pts: Pt[]) => routePath(pts, 8);
const HOPS = [
  {d: R(HOP1), depart: F.hop1Depart, land: F.chain1},
  {d: R(HOP2), depart: F.hop2Depart, land: F.chain2},
  {d: R(HOP3), depart: F.hop3Depart, land: F.chain3},
  {d: R(HOP4), depart: F.hop4Depart, land: F.chain4},
  {d: R(HOP5), depart: F.hop5Depart, land: F.chain5},
];
export const RELAY_RUNS: BitRun[] = HOPS.map((h, i) => bitRun({path: h.d, depart: h.depart, land: h.land, label: `relay${i + 1}`}));

/* ---------------------------------------------------------------- the reveal: a pull-back (x1.1 -> x1) with a pan */

/** Station 1's centre at the cut = the magnified lookout's centre in the iris (set by the caller). */
export const relayCam = (frame: number, lookoutAtCut: Pt, lookoutSizeAtCut: number): Cam => {
  const s0 = lookoutSizeAtCut / ST1.s;
  const T0: Pt = [lookoutAtCut[0] - s0 * ST1.cx, lookoutAtCut[1] - s0 * ST1.cy];
  const e = EASE.move(clamp01((frame - F.cutP) / (F.pMoveEnd - F.cutP)));
  // log-space zoom with a fixed point
  const k = Math.exp(Math.log(s0) * (1 - e));
  if (Math.abs(s0 - 1) < 1e-6) return {k: 1, T: [T0[0] * (1 - e), T0[1] * (1 - e)]};
  const Z: Pt = [-T0[0] / (s0 - 1), -T0[1] / (s0 - 1)]; // T0 + s0 Z = Z
  return {k, T: [Z[0] - k * Z[0], Z[1] - k * Z[1]]};
};

const map = (c: Cam, p: Pt): Pt => [c.T[0] + c.k * p[0], c.T[1] + c.k * p[1]];
const mapR = (c: Cam, r: SRect): SRect => ({x: c.T[0] + c.k * r.x, y: c.T[1] + c.k * r.y, w: r.w * c.k, h: r.h * c.k});
const mapPts = (c: Cam, pts: Pt[]) => pts.map((p) => map(c, p));

/* ---------------------------------------------------------------- the shot */

export const Relay: React.FC<{frame: number; cam: Cam}> = ({frame: f, cam}) => {
  const st1 = mapR(cam, st1Box);
  const q = mapR(cam, Q);
  const fw = mapR(cam, FW);
  const ld = mapR(cam, LD);
  const scr = mapR(cam, SCR);
  const plug = mapR(cam, PLUG);
  const flip = (at: number) => progress(f, at, 6, EASE.arrive);
  // focal light: the station the Bit is on carries the one faked glow
  const focus = f < F.chain1 ? 1 : f < F.chain2 ? 2 : f < F.chain3 ? 3 : f < F.chain4 ? 4 : f < F.chain5 ? 5 : 6;
  const visited = (at: number) => progress(f, at, 8, EASE.arrive);
  const readied = (at: number) => (f >= at ? 1 : 0);
  return (
    <g>
      {/* plug-and-cord silhouette feeding station 1 with standby (the lookout is never awake without supply) */}
      <path d={`M${plug.x - 200 * cam.k} ${plug.y + plug.h * 0.5 + 14 * cam.k}C${plug.x - 120 * cam.k} ${plug.y + plug.h * 0.5 + 14 * cam.k} ${plug.x - 70 * cam.k} ${plug.y + plug.h * 0.5} ${plug.x} ${plug.y + plug.h * 0.5}`} fill="none" stroke={T.structure} strokeWidth={10} strokeLinecap="round" />
      <path d={`M${plug.x - 200 * cam.k} ${plug.y + plug.h * 0.5 + 14 * cam.k}C${plug.x - 120 * cam.k} ${plug.y + plug.h * 0.5 + 14 * cam.k} ${plug.x - 70 * cam.k} ${plug.y + plug.h * 0.5} ${plug.x} ${plug.y + plug.h * 0.5}`} fill="none" stroke={TONE.mass} strokeWidth={5} strokeLinecap="round" />
      <Part r={plug} radius={6} />
      <EnergyChannel kind="standby" path={R(mapPts(cam, FEED))} full frame={f} />

      {/* the signal route through the stations (structure; lit only behind the Bit) */}
      {HOPS.map((h, i) => (
        <path key={i} d={R(mapPts(cam, [HOP1, HOP2, HOP3, HOP4, HOP5][i]))} fill="none" stroke={T.structure} strokeWidth={4} strokeLinejoin="round" />
      ))}

      {/* 2: Power, an energy segment; fills on its landing and holds steady */}
      <EnergyChannel kind="main" path={R(mapPts(cam, POWER))} fillFrom={F.chain1} fillTo={F.chain1 + 4} emptyColor={TONE.far} frame={f} />

      {/* 3: the "?" block: dark, outlined badge; lights on its landing and keeps a running pip */}
      <LitPart r={q} radius={6} light={flip(F.chain2)} glow={focus === 3 ? flip(F.chain2) : 0} />
      {f < F.chain2 ? <path d={rectPath(q.x + 1.5, q.y + 1.5, q.w - 3, q.h - 3, 5)} fill="none" stroke={T.textMuted} strokeWidth={3} strokeOpacity={readied(F.chain1 + 4)} /> : null}
      <StateGlyph x={q.x + q.w * 0.35} y={q.y - 30} dock="center" state="UNNAMED" frame={f} />
      {f >= F.chain3 ? <StateGlyph x={q.x + q.w} y={q.y} state="ON" frame={f} inAt={F.chain3} /> : null}

      {/* 4: firmware plate (abstract, not a processor package) */}
      <Station r={fw} f={f} at={F.chain3} focus={focus === 4} visitedAt={F.chain4} readyAt={F.chain2 + 6} visited={visited(F.chain4)} />
      <PartName frame={f} cx={fw.x + fw.w / 2} cy={fw.y + fw.h / 2} lines={['Firmware', 'on CPU']} land={F.chain3} color={f >= F.chain4 + 4 ? T.textMuted : undefined} />
      {/* 5: loader plate */}
      <Station r={ld} f={f} at={F.chain4} focus={focus === 5} visitedAt={F.chain5} readyAt={F.chain3 + 6} visited={visited(F.chain5)} />
      <PartName frame={f} cx={ld.x + ld.w / 2} cy={ld.y + ld.h / 2} lines={['Loader']} land={F.chain4} color={f >= F.chain5 + 4 ? T.textMuted : undefined} />
      {/* 6: the screen plate, on the monitor's rectangle */}
      <Station r={scr} f={f} at={F.chain5} focus={focus === 6} readyAt={F.chain4 + 6} visited={0} screen />
      {/* the screen plate sits on the monitor's rectangle at the frame's right edge, so its name hangs to the
          left inside title-safe (x <= 1776) instead of inside the plate */}
      <Tag frame={f} anchor={map(cam, [SCR.x + 36, SCR.y + SCR.h - 4])} elbow={map(cam, [SCR.x + 36, 522])} end={map(cam, [SCR.x + 16, 522])} side="left" lines={['Windows']} land={F.chain5} plate={TONE.room} />

      {/* 1: the always-on block: lit, breathing, glow while it is the focus; eye badge carried over */}
      <LitPart r={st1} radius={8} light={1} glow={focus === 1 ? 1 : 0} breath={breathe(f)} />
      {/* its breathing ALWAYS-ON pip, docked inside top-right exactly as on the magnified lookout in the iris, so
          the f714 match cut keeps it in place */}
      <StateGlyph x={st1.x + st1.w} y={st1.y} dock="inside" state="ALWAYS_ON" frame={f} />
      <EyeBadge x={st1.x + st1.w * 0.5} y={st1.y + st1.h * 0.42} width={56 * Math.min(1.2, cam.k)} frame={f} />

      {/* route light + the Bit (parked on station 1 until "chain", parks on Windows) */}
      <CamRouteLight frame={f} cam={cam} runs={RELAY_RUNS} />
      <CamBit frame={f} cam={cam} runs={RELAY_RUNS} park restFrom={F.cutP + 14} />

      {/* tags: "Always-on logic" is carried over the f714 match cut (no blink): its relay geometry is the W tag
          (anchor on the magnified lookout's left edge, elbow 30 px up, end 40 px left) mapped back through the
          cut's camera, so at f714 it sits exactly where it was in W, then rides station 1 through the reveal.
          "Power" lands with its Bit. */}
      <Tag frame={f} anchor={map(cam, ALWAYS_ON_TAG.anchor)} elbow={map(cam, ALWAYS_ON_TAG.elbow)} end={map(cam, ALWAYS_ON_TAG.end)} side="left" lines={['Always-on', 'logic']} land={F.cutP} instant plate={TONE.room} />
      <Tag frame={f} anchor={map(cam, [727, 769])} end={map(cam, [727, 830])} lines={['Power']} role="energy" land={F.chain1} plate={TONE.room} />
    </g>
  );
};

const Station: React.FC<{r: SRect; f: number; at: number; focus: boolean; visitedAt?: number; readyAt: number; visited: number; screen?: boolean}> = ({r, f, at, focus, readyAt, visited, screen}) => {
  const lit = progress(f, at, 6, EASE.arrive);
  const ready = f >= readyAt && f < at ? 1 : 0;
  if (visited > 0) {
    // visited: body at 40% lit, 3 px annotation outline, hollow pip (D24)
    return (
      <g>
        <path d={rectPath(r.x, r.y, r.w, r.h, 8)} fill={TONE.mass} />
        <path d={rectPath(r.x, r.y, r.w, r.h, 8)} fill={TONE.lit} fillOpacity={0.4 + 0.6 * (1 - visited)} />
        <path d={rectPath(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, 7)} fill="none" stroke={T.annotation} strokeWidth={3} strokeOpacity={visited} />
        <path d={rectPath(r.x + 2, r.y + 2, r.w - 4, r.h - 4, 7)} fill="none" stroke={T.ink} strokeWidth={4} strokeOpacity={1 - visited} />
        <path d={squarePath(r.x + r.w + 8 + 6, r.y - 8 - 6, 10, 1)} fill="none" stroke={T.annotation} strokeWidth={2} strokeOpacity={visited} />
      </g>
    );
  }
  return (
    <g>
      <LitPart r={r} radius={screen ? 4 : 8} light={lit} glow={focus ? lit : 0} />
      {ready ? <path d={rectPath(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3, 7)} fill="none" stroke={T.textMuted} strokeWidth={3} /> : null}
    </g>
  );
};

/** The screen plate's rect at a frame (for the match cut check). */
export const relayScreenRect = (cam: Cam): SRect => mapR(cam, SCR);
