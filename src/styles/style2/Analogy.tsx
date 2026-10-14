/**
 * S07: "how does one tap become a sign-in screen?" The link is only imagined, so it is drawn as analogy:
 * a dashed 3 px annotation arc (12/8) rising from the button to a dashed generic sign-in card beside the
 * monitor, OUTSIDE its screen (the monitor stays black), with the ≈ chip at the arc's apex and on the card.
 */
import React from 'react';
import {AnalogyFrame, ApproxChip, circlePath, rectPath, EASE, progress, STROKE, type Pt} from '../../shared';
import {T} from './tones';

export const CARD = {x: 1494, y: 326, w: 92, h: 96};

const qPt = (a: Pt, c: Pt, b: Pt, t: number): Pt => [
  (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0],
  (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1],
];

export const AnalogyArc: React.FC<{f: number; from: Pt; arcIn: number; cardIn: number; out: number}> = ({f, from, arcIn, cardIn, out}) => {
  if (f < arcIn) return null;
  const op = 1 - progress(f, out, 6, EASE.exit);
  if (op <= 0) return null;
  // the arc rises along the front wall and turns into the card's left side (its tag hangs from the card's foot)
  const to: Pt = [CARD.x - 4, CARD.y + CARD.h / 2];
  const c: Pt = [from[0] - 4, to[1] + 10];
  // sample the arc so the draw-on can trim it while keeping the 12/8 dash
  const N = 40;
  const p = progress(f, arcIn, 30, EASE.move);
  const pts: Pt[] = [];
  for (let i = 0; i <= Math.ceil(N * p); i++) pts.push(qPt(from, c, to, Math.min(p, i / N)));
  const d = pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('');
  const apex = qPt(from, c, to, 0.5);
  const chipIn = progress(f, arcIn + 14, 5, EASE.arrive);
  const cardDraw = f >= cardIn ? progress(f, cardIn, 8, EASE.arrive) : 0;
  const cx = CARD.x + CARD.w / 2;
  return (
    <g opacity={op}>
      <path d={d} fill="none" stroke={T.annotation} strokeWidth={STROKE.analogy} strokeDasharray={STROKE.analogyDash.join(' ')} strokeLinecap="butt" />
      {chipIn > 0 ? <ApproxChip x={apex[0] + 28} y={apex[1] + 6} opacity={chipIn} /> : null}
      {f >= cardIn ? (
        <g>
          <AnalogyFrame x={CARD.x} y={CARD.y} w={CARD.w} h={CARD.h} inAt={cardIn} frame={f} />
          <g opacity={cardDraw} fill="none" stroke={T.annotation} strokeWidth={2.5}>
            {/* generic sign-in card: avatar circle, one field, one button; no text, no logo */}
            <path d={circlePath(cx, CARD.y + 30, 13)} />
            <path d={rectPath(CARD.x + 16, CARD.y + 54, CARD.w - 32, 12, 4)} />
            <path d={rectPath(cx - 18, CARD.y + 74, 36, 11, 4)} fill={T.annotation} fillOpacity={0.35} />
          </g>
        </g>
      ) : null}
    </g>
  );
};
