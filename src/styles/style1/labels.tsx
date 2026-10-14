/**
 * The annotation layer: keyed tags, state pills and headers, typeset over the ink (crisp, never
 * jittered). Budgets per frame: ≤ 3 tags, ≤ 2 pills, ≤ 1 header, ≤ 12 must-read words.
 * Each tag lands on its word (anchor t0−6, leader t0−5, text t0 → t0+5) and holds by the brand rule.
 */
import React from 'react';
import {EASE, Header, KeyedTag, SANS, SENTENCES, StatePill, TimeChip, progress, polyPath, type Pt} from '../../shared';
import {F} from './frames';
import * as L from './layout';
import {approxChipMarks, TH} from './parts';
import {Marks, nibSkin} from './nib';

const WHITE = '#FFFFFF';

/** The analogy tag "≈ Lookout": pencil (dashed) plate, the ≈ chip, a dashed leader to the eye. */
const PencilTag: React.FC<{frame: number; anchor: Pt; elbow: Pt; end: Pt; text: string; land: number; exitAt: number}> = ({
  frame,
  anchor,
  elbow,
  end,
  text,
  land,
  exitAt,
}) => {
  if (frame < land - 6 || frame >= exitAt + 6) return null;
  const leader = progress(frame, land - 5, 4, EASE.arrive) * (1 - progress(frame, exitAt + 2, 4, EASE.exit));
  const txt = progress(frame, land, 5, EASE.arrive) * (1 - progress(frame, exitAt, 4, EASE.exit));
  const slide = (1 - progress(frame, land, 5, EASE.arrive)) * 8;
  const pts = [anchor, elbow, end];
  const len = Math.hypot(elbow[0] - anchor[0], elbow[1] - anchor[1]) + Math.hypot(end[0] - elbow[0], end[1] - elbow[1]);
  const W = 600;
  const H = 72;
  return (
    <g>
      {leader > 0 ? (
        <path
          d={polyPath(pts)}
          fill="none"
          stroke={TH.annotation}
          strokeWidth={3}
          strokeDasharray={`${len * leader} ${len}`}
          strokeLinejoin="round"
        />
      ) : null}
      {leader > 0 ? <rect x={anchor[0] - 4} y={anchor[1] - 4} width={8} height={8} fill={TH.annotation} opacity={leader} /> : null}
      {txt > 0 ? (
        <foreignObject x={end[0] - W} y={end[1] - H / 2} width={W} height={H} style={{overflow: 'visible'}}>
          <div style={{width: W, height: H, display: 'flex', justifyContent: 'flex-end', alignItems: 'center'}}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 12,
                padding: '6px 14px 6px 10px',
                borderRadius: 8,
                border: `3px dashed ${TH.annotation}`,
                background: 'rgba(255,255,255,0.92)',
                opacity: txt,
                transform: `translateX(${slide}px)`,
              }}
            >
              <svg width={32} height={28} viewBox="0 0 32 28" style={{flex: 'none'}}>
                <Marks marks={approxChipMarks(16, 14, 1)} seed="chiptag" frame={frame} />
              </svg>
              <div style={{fontFamily: SANS, fontWeight: 600, fontSize: 44, lineHeight: 1.15, color: TH.ink, whiteSpace: 'nowrap'}}>{text}</div>
            </div>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
};

export const Labels: React.FC<{frame: number}> = ({frame}) => (
  <g>
    {/* S01 (flash-forward): the tab "After the press" is on the sheet (sheet.tsx) */}
    <KeyedTag anchor={[1274, 620]} end={[1322, 620]} text="Power button" role="part" land={F.tagPowerButton} exitAt={F.tagPowerButtonOut} sentenceEnd={SENTENCES.S01.end} />
    <StatePill x={L.SOCKET.x + L.SOCKET.w} y={L.SOCKET.y} label="Not first" inAt={F.notFirst} outAt={F.notFirstOut} />
    {/* S03: the present */}
    <StatePill x={L.FRONT_INNER_X} y={L.CASE.y} dock="inside-top-right" label="Soft-off" inAt={F.softOff} />
    <KeyedTag anchor={[1212, 680]} end={[1322, 680]} text="Signal only" role="info" land={F.tagSignalOnly} exitAt={F.tagSignalOnlyOut} sentenceEnd={SENTENCES.S03.end} />
    <StatePill x={L.PSU.x + L.PSU.w} y={L.PSU.y} label="Main power: OFF" inAt={F.pillMainPower} outAt={F.s05Out} />
    {/* S04 */}
    <TimeChip label="When pressed" inAt={F.whenPressedIn} outAt={F.whenPressedOut} />
    <KeyedTag
      anchor={[L.LOOK.x, 832]}
      end={[776, 832]}
      side="left"
      text="Always-on logic"
      role="part"
      land={F.tagAlwaysOn}
      exitAt={F.s05Out}
      sentenceEnd={SENTENCES.S04.end}
      plate={WHITE}
    />
    {/* S05 */}
    <PencilTag frame={frame} anchor={[889, 866]} elbow={[855, 900]} end={[776, 900]} text="Lookout" land={F.tagLookout} exitAt={F.s05Out} />
    {/* S07 */}
    <KeyedTag
      anchor={[L.QB.x, 770]}
      end={[776, 770]}
      side="left"
      text="Hidden processor?"
      role="muted"
      land={F.qFill2}
      exitAt={F.s07Out}
      sentenceEnd={SENTENCES.S07.end}
      plate={WHITE}
    />
    <KeyedTag anchor={[1274, 620]} end={[1322, 620]} text="One tap" role="info" land={F.tagOneTap} exitAt={F.s07Out} sentenceEnd={SENTENCES.S07.end} />
    <KeyedTag anchor={[L.SIGNIN.x + 16, L.SIGNIN.y + L.SIGNIN.h]} end={[L.SIGNIN.x + 16, 540]} text="Sign-in screen" role="annotation" land={F.tagSignIn} exitAt={F.s07Out} sentenceEnd={SENTENCES.S07.end} />
    {/* S09 */}
    <Header label="Intel desktop" inAt={F.intel} outAt={F.stopsFile} />
    {/* S10 */}
    <KeyedTag
      anchor={[1180, 462]}
      end={[1322, 462]}
      text="Standby power"
      secondary="+5VSB · ATX"
      role="standby"
      land={F.tagStandby}
      exitAt={F.s10Out}
      sentenceEnd={SENTENCES.S10.end}
    />
    <StatePill x={L.PSU.x + L.PSU.w} y={L.PSU.y} label="Main rails: OFF" inAt={F.pillMainRails} />
    <KeyedTag anchor={[317, 290]} elbow={[317, 216]} end={[344, 216]} text="Rear switch" role="part" land={F.tagRear} exitAt={F.s10Out} sentenceEnd={SENTENCES.S10.end} />
    {/* S12 */}
    <TimeChip label="Now" inAt={F.now} />
  </g>
);

export {nibSkin};
