/**
 * S06: "It starts a chain of handoffs…" run as a numbered list on a second tracing sheet titled
 * "After the press", laid over the notes column. Slots arrive unnamed; each name lands with its Bit
 * (f731, f748, f781, f808, f832, f860). The left page stays in soft-off underneath.
 *
 * States: slot 1 always on (breathing, ≈ eye); Power = an amber energy segment that fills (no code);
 * the "?" keeps a still-running pip; Firmware on CPU and Loader dry back to the D24 visited mark;
 * Windows wicks on and the Bit parks there. The current step carries the markerInfo tint.
 */
import React from 'react';
import {Bit, EASE, SANS, MONO, bitRun, breathe, clamp01, lerp, progress, rectPath, routePath, squarePath, type BitRun} from '../../shared';
import {F} from './frames';
import * as L from './layout';
import {Marks, S, Fl, T, WickMask, nibSkin, wickP, type Mark} from './nib';
import {TH, eyeMarks, qBadgeMarks} from './parts';
import {TracingSheet} from './sheet';

const SX = L.LIST_SLOT_X;
const SZ = 36;
const CX = SX + SZ / 2; // 1346
const rowY = L.LIST_ROWS;
const slotPath = (i: number): string => rectPath(SX, rowY[i] - SZ / 2, SZ, SZ, 6);
const slotLen = 4 * (SZ - 12) + 2 * Math.PI * 6;
const topCause = (SZ - 12) / 2; // wick from the top edge's centre, where the connector arrives

export const LIST_HOPS: BitRun[] = F.hops.map((h, i) =>
  bitRun({path: routePath([[CX, rowY[i]], [CX, rowY[i + 1]]]), depart: h.depart, land: h.land, label: `S06 hop ${i + 1}`}),
);

interface SlotTimes {
  on?: number; // wick ON (ink outline, white fill, filled pip)
  visited?: number; // dry back to the D24 visited mark
  always?: boolean; // slot 1: breathing from the lay-down
}
const SLOTS: SlotTimes[] = [
  {always: true},
  {on: F.hops[0].land},
  {on: F.hops[1].land},
  {on: F.hops[2].land, visited: F.hops[3].land},
  {on: F.hops[3].land, visited: F.hops[4].land},
  {on: F.hops[4].land},
];

const NAMES: Array<{at: number; text?: string}> = [
  {at: F.listName1, text: 'Always-on logic'},
  {at: F.hops[0].land, text: 'Power'},
  {at: F.hops[1].land}, // the "?" badge is its name
  {at: F.hops[2].land, text: 'Firmware on CPU'},
  {at: F.hops[3].land, text: 'Loader'},
  {at: F.hops[4].land, text: 'Windows'},
];

const Slot: React.FC<{i: number; frame: number}> = ({i, frame}) => {
  const s = SLOTS[i];
  const y = rowY[i];
  const d = slotPath(i);
  const numeral: Mark = T(CX, y + 10.5, String(i + 1), 30, TH.textMuted, MONO, {anchor: 'middle', weight: 500});
  const pipX = SX + SZ + 13;
  const pipY = y - SZ / 2 - 6;
  if (s.always) {
    return (
      <Marks
        seed={`slot${i}`}
        frame={frame}
        marks={[
          Fl(d, '#FFFFFF', {clean: true}),
          S(d, TH.ink, 4.5, {seed: `slot${i}:ink`}),
          numeral,
          Fl(squarePath(pipX, pipY, 12, 1.5), TH.ink, {clean: true, o: breathe(frame)}),
        ]}
      />
    );
  }
  const onP = s.on !== undefined ? wickP(frame, s.on, 5) : 0;
  const dry = s.visited !== undefined ? clamp01((frame - s.visited) / 6) : 0;
  const inkP = onP * (1 - dry);
  const fillP = (s.on !== undefined ? progress(frame, s.on + 3, 2) : 0) * (1 - progress(frame, s.visited ?? 1e9, 6, EASE.exit));
  const pipOn = (s.on !== undefined ? progress(frame, s.on + 5, 2) : 0) * (1 - progress(frame, s.visited ?? 1e9, 4, EASE.exit));
  const visited = dry > 0;
  const base: Mark[] = [
    fillP > 0 ? Fl(d, '#FFFFFF', {clean: true, o: fillP}) : null,
    S(d, visited ? TH.annotation : TH.structure, 3, {seed: `slot${i}:base`}),
    numeral,
  ].filter(Boolean) as Mark[];
  const pip: Mark[] =
    pipOn > 0.02
      ? [Fl(squarePath(pipX, pipY, 12, 1.5), TH.ink, {clean: true, o: pipOn})]
      : [S(squarePath(pipX, pipY, 10, 1.5), visited ? TH.annotation : TH.structure, 2, {clean: true})];
  return (
    <g>
      <Marks marks={base} seed={`slot${i}`} frame={frame} />
      {inkP > 0 ? (
        <WickMask d={d} cause={visited ? topCause : topCause} p={inkP} width={4.5} seed={`slotwick${i}`}>
          <Marks marks={[S(d, TH.ink, 4.5, {seed: `slot${i}:ink`})]} seed={`slot${i}ink`} frame={frame} />
        </WickMask>
      ) : null}
      <Marks marks={pip} seed={`slotpip${i}`} frame={frame} />
    </g>
  );
};

const Name: React.FC<{i: number; frame: number}> = ({i, frame}) => {
  const n = NAMES[i];
  const p = progress(frame, n.at, 5, EASE.arrive);
  if (p <= 0) return null;
  const y = rowY[i];
  const dx = (1 - p) * -8;
  if (!n.text) return <Marks marks={qBadgeMarks(L.LIST_NAME_X + 18 + dx, y, 1, 0)} seed="listq" frame={frame} opacity={p} />;
  return <Marks marks={[T(L.LIST_NAME_X + dx, y + 15, n.text, 44, TH.ink, SANS, {o: p})]} seed={`name${i}`} frame={frame} />;
};

/** Row 2's power phase: an empty double-walled segment that fills amber when its Bit lands. */
const PowerSegment: React.FC<{frame: number}> = ({frame}) => {
  const appear = progress(frame, F.hops[0].land - 4, 4, EASE.arrive);
  if (appear <= 0) return null;
  const y = rowY[1];
  const x0 = 1548;
  const x1 = 1748;
  const front = clamp01((frame - F.hops[0].land) / 4);
  return (
    <g opacity={appear}>
      {front > 0 ? <rect x={x0} y={y - 7} width={(x1 - x0) * front} height={14} fill={TH.energy} /> : null}
      <Marks
        seed="seg"
        frame={frame}
        marks={[S(`M${x0} ${y - 8}L${x1} ${y - 8}`, TH.structure, 2, {seed: 'segA'}), S(`M${x0} ${y + 8}L${x1} ${y + 8}`, TH.structure, 2, {seed: 'segB'})]}
      />
    </g>
  );
};

/** The current-step tint (markerInfo), under the row where the Bit is; it moves with the Bit. */
const Tint: React.FC<{frame: number}> = ({frame}) => {
  const on = progress(frame, F.listName1, 4, EASE.arrive);
  if (on <= 0) return null;
  let y = rowY[0];
  for (let i = 0; i < LIST_HOPS.length; i++) {
    const h = LIST_HOPS[i];
    if (frame >= h.depart) y = h.at(Math.min(frame, h.land)).y;
  }
  return (
    <rect x={1312} y={y - 26} width={432} height={52} rx={6} fill={TH.markerInfo} opacity={on} style={{mixBlendMode: 'multiply'}} />
  );
};

export const ChainList: React.FC<{frame: number; ghost: React.ReactNode}> = ({frame, ghost}) => {
  if (frame < F.listIn) return null;
  const pop = EASE.arrive(clamp01((frame - F.listName1) / 4));
  const eye = progress(frame, F.listName1, 6, EASE.arrive);
  const connectors: Mark[] = [];
  for (let i = 0; i < 5; i++) connectors.push(S(`M${CX} ${rowY[i] + SZ / 2}L${CX} ${rowY[i + 1] - SZ / 2}`, TH.structure, 3, {role: 'route', seed: `conn${i}`}));
  return (
    <TracingSheet frame={frame} box={L.LIST} inAt={F.listIn} outAt={F.listOut} out={{dx: 660, dy: 0}} ghost={ghost} regs="right">
      <foreignObject x={L.LIST.x + 20} y={L.LIST.y + 14} width={460} height={90} style={{overflow: 'visible'}}>
        <div
          style={{
            display: 'inline-block',
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: 44,
            lineHeight: 1.15,
            letterSpacing: '0.02em',
            color: TH.ink,
            whiteSpace: 'nowrap',
            paddingBottom: 6,
            borderBottom: `2px solid ${TH.annotation}`,
          }}
        >
          After the press
        </div>
      </foreignObject>
      <Tint frame={frame} />
      <Marks marks={connectors} seed="connectors" frame={frame} />
      {rowY.map((_, i) => (
        <Slot key={i} i={i} frame={frame} />
      ))}
      <PowerSegment frame={frame} />
      {rowY.map((_, i) => (
        <Name key={i} i={i} frame={frame} />
      ))}
      {eye > 0 ? <Marks marks={eyeMarks(SX + 4, rowY[0] + 16, 26, 0.8, false)} seed="listeye" frame={frame} opacity={eye} /> : null}
      {frame >= F.listName1 ? (
        <g transform={`translate(${CX} ${rowY[0]}) scale(${frame < F.hops[0].depart ? lerp(0.0001, 1, pop) : 1}) translate(${-CX} ${-rowY[0]})`}>
          <Bit runs={LIST_HOPS} park restFrom={F.listName1} skin={nibSkin} theme={TH} />
        </g>
      ) : null}
    </TracingSheet>
  );
};
