/**
 * A plate row's bridges and its chain Bit (ENGINE.md §10.6), above the plates in screen px: 4 px `structure` bridges
 * across the 24 px gutters while both neighbours sit in their slots, the Bit (v2, with its pixel trail) crossing the
 * gutters through the ports, and the rail lighting cyan behind it (10-frame stepped decay).
 */
import React from 'react';
import {BIT2, COLOR, DUR, STROKE} from '../tokens';
import {prog} from '../core/ease';
import {SCREEN_CAM} from '../camera/camera';
import {bitDraw, BitV2} from '../signal/BitV2';
import {hopsFor} from '../signal/runs';
import {scopeKey} from '../core/types';
import type {AnyWorld} from '../world/types';
import type {Script} from '../timeline/script';
import {slotRect, type PlateSpec} from './peel';
import {minusGaps, type PlateRowSpec} from './row';

const inSlot = (frame: number, p: PlateSpec): number =>
  frame < p.peelAt + DUR.peel || frame >= p.returnAt ? 0 : Math.min(prog(frame, p.peelAt + DUR.peel, 4, 'arrive'), 1);

export const RowLayer: React.FC<{row: PlateRowSpec; frame: number; script: Readonly<Script>; world: AnyWorld}> = ({row, frame, script, world}) => {
  const plates = row.plates.map((id) => script.plates.find((p) => p.id === id)).filter((p): p is PlateSpec => !!p);
  const out: React.ReactNode[] = [];
  const y = row.rail.y;
  for (let i = 0; i + 1 < plates.length; i++) {
    const a = plates[i];
    const b = plates[i + 1];
    const op = Math.min(inSlot(frame, a), inSlot(frame, b));
    if (op <= 0) continue;
    const ra = slotRect(a.slot);
    const rb = slotRect(b.slot);
    out.push(<rect key={`br${i}`} x={ra.x + ra.w} y={y - STROKE.route / 2} width={rb.x - (ra.x + ra.w)} height={STROKE.route} fill={COLOR.structure} opacity={op} />);
  }
  const rails = script.rows.map((r) => ({id: r.id, rail: r.rail}));
  for (const spec of script.bits) {
    if (scopeKey(spec.scope) !== `row:${row.id}`) continue;
    const hops = hopsFor(spec, world, rails);
    const d = bitDraw(frame, spec, hops.map((h) => h.run), SCREEN_CAM);
    // the rail's afterglow (round 1): every hop's travelled stretch stays dimly lit, fading after its landing
    for (const ag of d.afterglows) {
      const run = hops[ag.hop].run;
      const dir = run.end[0] >= run.start[0] ? 1 : -1;
      minusGaps(row, run.start[0] + dir * ag.s0, run.start[0] + dir * ag.s1).forEach(([a, b], j) =>
        out.push(<rect key={`ag-${spec.id}-${ag.hop}-${j}`} x={a} y={y - STROKE.route / 2} width={b - a} height={STROKE.route} fill={COLOR.info} fillOpacity={ag.opacity} />),
      );
    }
    // rail light behind the Bit (screen px along the hop), with its soft underglow
    if (d.litTrail && d.hop !== undefined) {
      const run = hops[d.hop].run;
      const dir = run.end[0] >= run.start[0] ? 1 : -1;
      const gw = STROKE.route * BIT2.afterglow.glowWidth;
      d.litTrail.forEach((s, k) => {
        const x0 = run.start[0] + dir * s.s0;
        const x1 = run.start[0] + dir * s.s1;
        minusGaps(row, x0, x1).forEach(([a, b], j) => {
          const gw2 = STROKE.route * BIT2.afterglow.glow2Width;
          out.push(
            <rect key={`litg2-${spec.id}-${k}-${j}`} x={a} y={y - gw2 / 2} width={b - a + 0.6} height={gw2} rx={gw2 / 2} fill={COLOR.info} fillOpacity={BIT2.afterglow.glow2Opacity * s.opacity} />,
          );
          out.push(
            <rect key={`litg-${spec.id}-${k}-${j}`} x={a} y={y - gw / 2} width={b - a + 0.6} height={gw} fill={COLOR.info} fillOpacity={BIT2.afterglow.glowOpacity * s.opacity} />,
          );
          out.push(
            <rect key={`lit-${spec.id}-${k}-${j}`} x={a} y={y - STROKE.route / 2} width={b - a + 0.6} height={STROKE.route} fill={COLOR.info} fillOpacity={s.opacity} />,
          );
        });
      });
    }
    out.push(<BitV2 key={`bit-${spec.id}`} draw={d} gid={`row-${row.id}-${spec.id}`} />);
  }
  return (
    <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
      {out}
    </svg>
  );
};
