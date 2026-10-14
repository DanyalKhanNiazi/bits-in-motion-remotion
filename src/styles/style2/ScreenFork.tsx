/**
 * M, the screen: the monitor large and black. A fork grows from its right bezel: a generic Restart chip on
 * "restart", a generic Shut down chip on "shutting", and "Why different?" on "starting" (a question, held
 * past the f1237–f1246 pause). No mechanism, no Windows UI; the hedge stays in the voice.
 */
import React from 'react';
import {routePath, rectPath, circlePath, SANS, EASE, progress, type Pt} from '../../shared';
import {F} from './timeline';
import {Tag} from './Tag';
import {TONE, T} from './tones';

const draw = (f: number, at: number, frames: number) => progress(f, at, frames, EASE.arrive);

const Chip: React.FC<{x: number; y: number; w: number; label: string; glyph: 'restart' | 'power'; f: number; at: number; out: number}> = ({x, y, w, label, glyph, f, at, out}) => {
  const a = draw(f, at, 5) * (1 - progress(f, out, 6, EASE.exit));
  if (a <= 0) return null;
  const h = 76;
  const gx = x + 40;
  const gy = y + h / 2;
  const r = 15;
  return (
    <g opacity={a} transform={`translate(${(1 - draw(f, at, 5)) * -8} 0)`}>
      <path d={rectPath(x, y, w, h, 12)} fill={TONE.mass} />
      <path d={rectPath(x + 1.5, y + 1.5, w - 3, h - 3, 11)} fill="none" stroke={T.ink} strokeWidth={3} />
      {glyph === 'restart' ? (
        <g fill="none" stroke={T.ink} strokeWidth={3.5} strokeLinecap="round">
          {/* circular arrow */}
          <path d={`M${gx + r * Math.cos(-0.9)} ${gy + r * Math.sin(-0.9)}A${r} ${r} 0 1 1 ${gx + r * Math.cos(-1.9)} ${gy + r * Math.sin(-1.9)}`} />
          <path d={`M${gx + r * Math.cos(-0.9) - 9} ${gy + r * Math.sin(-0.9) - 2}L${gx + r * Math.cos(-0.9)} ${gy + r * Math.sin(-0.9)}L${gx + r * Math.cos(-0.9) + 1} ${gy + r * Math.sin(-0.9) - 10}`} strokeLinejoin="round" />
        </g>
      ) : (
        <g fill="none" stroke={T.ink} strokeWidth={3.5} strokeLinecap="round">
          {/* IEC power symbol */}
          <path d={`M${gx + r * Math.cos(-1.1)} ${gy + r * Math.sin(-1.1)}A${r} ${r} 0 1 1 ${gx + r * Math.cos(-2.04)} ${gy + r * Math.sin(-2.04)}`} />
          <path d={`M${gx} ${gy - r - 3}V${gy - 2}`} />
        </g>
      )}
      <text x={x + 74} y={gy + 1} dominantBaseline="central" style={{fontFamily: SANS, fontWeight: 600, fontSize: 44}} fill={T.ink}>
        {label}
      </text>
    </g>
  );
};

export const ScreenFork: React.FC<{f: number; bezelRight: number; cy: number}> = ({f, bezelRight, cy}) => {
  const node: Pt = [bezelRight + 26, cy];
  const B = 110;
  const up: Pt[] = [node, [node[0], cy - B], [node[0] + 64, cy - B]];
  const dn: Pt[] = [node, [node[0], cy + B], [node[0] + 64, cy + B]];
  const out = F.mOut;
  const fade = 1 - progress(f, out, 6, EASE.exit);
  const L = B + 64;
  const nodeIn = draw(f, F.forkIn, 6);
  const upP = draw(f, F.restartChip - 6, 6);
  const dnP = draw(f, F.shutDownChip - 6, 6);
  return (
    <g>
      <g opacity={fade}>
        {upP > 0 ? <path d={routePath(up, 8)} fill="none" stroke={T.annotation} strokeWidth={3} strokeDasharray={`${L * upP} ${L + 10}`} /> : null}
        {dnP > 0 ? <path d={routePath(dn, 8)} fill="none" stroke={T.annotation} strokeWidth={3} strokeDasharray={`${L * dnP} ${L + 10}`} /> : null}
        {nodeIn > 0 ? <path d={circlePath(node[0], node[1], 8 * nodeIn)} fill={T.annotation} /> : null}
      </g>
      <Chip x={node[0] + 64} y={cy - B - 38} w={268} label="Restart" glyph="restart" f={f} at={F.restartChip} out={out} />
      <Chip x={node[0] + 64} y={cy + B - 38} w={330} label="Shut down" glyph="power" f={f} at={F.shutDownChip} out={out} />
      <Tag frame={f} anchor={node} end={[node[0] + 70, cy]} lines={['Why different?']} role="annotation" land={F.whyDifferent} exitAt={out} plate={TONE.room} />
    </g>
  );
};
