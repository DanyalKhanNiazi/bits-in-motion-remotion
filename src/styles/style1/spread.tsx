/**
 * The open spread: warm paper with a fixed fibre grain (screen-fixed, never resampled), the left page
 * plain, the right page ruled every 64 px, and the fold, a flat 24 px band with its fold line (no
 * gradient, no page curl), in frame for all 1,890 frames. Plus the witness screen on the right page.
 */
import React from 'react';
import {AbsoluteFill} from 'remotion';
import grain from './grain.png';
import * as L from './layout';
import {Marks, S, Fl} from './nib';
import {TH} from './parts';
import {rectPath} from '../../shared';

export const Spread: React.FC = () => {
  const rules: number[] = [];
  for (let y = L.RULE.y0; y < 1080; y += L.RULE.pitch) rules.push(y);
  return (
    <AbsoluteFill style={{backgroundColor: L.PAPER, backgroundImage: `url(${grain})`, backgroundSize: '512px 512px', backgroundRepeat: 'repeat'}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{position: 'absolute', left: 0, top: 0}}>
        {rules.map((y) => (
          <rect key={y} x={L.SPREAD.rightX0} y={y - L.RULE.w / 2} width={1920 - L.SPREAD.rightX0} height={L.RULE.w} fill={L.RULE.color} />
        ))}
        <rect x={L.SPREAD.foldX0} y={0} width={L.SPREAD.foldX1 - L.SPREAD.foldX0} height={1080} fill={L.FOLD_BAND} />
        <rect x={L.SPREAD.foldLine - 1.5} y={0} width={3} height={1080} fill={L.FOLD_LINE} />
      </svg>
    </AbsoluteFill>
  );
};

/** The witness screen: what you would see. Solid black for the whole intro. */
export const WitnessScreen: React.FC<{frame: number}> = ({frame}) => {
  const s = L.SCREEN;
  const n = L.SCREEN_NECK;
  const ft = L.SCREEN_FOOT;
  return (
    <Marks
      seed="screen"
      frame={frame}
      marks={[
        Fl(rectPath(n.x, n.y, n.w, n.h, 0), '#FFFFFF', {clean: true}),
        S(rectPath(n.x, n.y, n.w, n.h, 0), TH.structure, 2.5, {seed: 'neck'}),
        Fl(rectPath(ft.x, ft.y, ft.w, ft.h, 4), '#FFFFFF', {clean: true}),
        S(rectPath(ft.x, ft.y, ft.w, ft.h, 4), TH.structure, 2.5, {seed: 'foot'}),
        Fl(rectPath(s.x - 8, s.y - 8, s.w + 16, s.h + 16, 8), '#FFFFFF', {clean: true}),
        S(rectPath(s.x - 8, s.y - 8, s.w + 16, s.h + 16, 8), TH.ink, 3.5, {seed: 'bezel'}),
        Fl(rectPath(s.x, s.y, s.w, s.h, 3), TH.ink, {clean: true}),
      ]}
    />
  );
};
