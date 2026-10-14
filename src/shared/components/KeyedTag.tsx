/**
 * Keyed tag (brand spec §4.1, §4.4): a square anchor on the part, a thin leader (3 px annotation,
 * at most one elbow), a key bar in the role colour, a 44 px sans primary line and an optional 34 px mono
 * secondary line, on an invisible knockout plate (surface at 90%).
 *
 * Timing from t0 = `land` (the start frame of the word that names the thing):
 *   anchor pops t0−6 → t0−2, leader draws t0−5 → t0−1, text enters t0 → t0+5 (8 px slide, readable by t0+3),
 *   secondary from t0+4 (or `secondaryAt`). Exit (if `exitAt`): text fades, then the leader retracts (6 frames).
 * Hold: at least 30 + 9 x words frames and until the sentence ends + 15 frames (minTagExit() in timing.ts).
 *
 * Usage:
 *   <KeyedTag anchor={[880, 838]} elbow={[880, 760]} end={[960, 760]} text="Standby power"
 *             secondary="+5VSB · ATX" role="energy" land={WORD_CUES.standbyPower} exitAt={1690} />
 */
import React from 'react';
import {LABEL, TYPE, roleColor, withAlpha, type RoleName} from '../brand';
import {useKit, type KitBaseProps} from '../context';
import {MONO, SANS} from '../fonts';
import {polyPath, squarePath, type Pt} from '../geom';
import {kitWarn, tagTiming, type TagTiming} from '../motion';
import {countWords} from '../timing';

export interface KeyedTagProps extends KitBaseProps {
  /** The anchor square's centre, on the part. */
  anchor: Pt;
  /** Where the leader ends and the text block attaches (omit for a leaderless name inside a part). */
  end?: Pt;
  /** One optional elbow point (45° or 90°). */
  elbow?: Pt;
  /** Primary line: sentence case, 3 words or fewer. */
  text: string;
  /** Secondary line (mono 34 px): only a real technical name ("+5VSB · ATX"). */
  secondary?: string;
  /** Key bar colour by role: info (cyan), energy (amber), standby, part (ink), muted, emphasis, alert. */
  role?: RoleName;
  /** Explicit key colour (overrides role). */
  keyColor?: string;
  /** Block to the right of `end` (default when end.x >= anchor.x) or to the left (leader meets its right edge). */
  side?: 'right' | 'left';
  /** t0: start frame of the word that names the thing. */
  land: number;
  /** Exit start (absolute). Omit to hold. Warned if earlier than the hold rule. */
  exitAt?: number;
  /** End frame of the sentence the tag lands in (for the hold-rule check). */
  sentenceEnd?: number;
  /** Secondary line entrance (default land + 4). */
  secondaryAt?: number;
  /** Knockout plate: true (surface at 90%, default), false, or a colour (e.g. theme.panel on a panel). */
  plate?: boolean | string;
  /** Label of an inactive part: text in textMuted. */
  muted?: boolean;
  /** Primary size (default 44, never below 30). */
  size?: number;
  /** Replace the drawing; timing and geometry stay the kit's. */
  render?: (s: {timing: TagTiming; anchor: Pt; end: Pt; side: 'left' | 'right'; keyColor: string}) => React.ReactNode;
}

export const KeyedTag: React.FC<KeyedTagProps> = (p) => {
  const {theme, skin, frame} = useKit(p);
  const seed = p.seed ?? `tag:${p.text}`;
  const size = Math.max(TYPE.floor, p.size ?? TYPE.label);
  if ((p.size ?? TYPE.label) < TYPE.floor) kitWarn(`KeyedTag "${p.text}": size ${p.size} is under the 30 px floor (clamped)`);
  const words = countWords(p.text);
  if (words > TYPE.maxWordsPerLabel) kitWarn(`KeyedTag "${p.text}": ${words} words (brand max 3)`);
  if (p.text.length > TYPE.maxCharsPerLine) kitWarn(`KeyedTag "${p.text}": ${p.text.length} characters (brand max 22 per line)`);
  if (p.exitAt !== undefined) {
    const min = Math.max(p.land + LABEL.holdBase + LABEL.holdPerWord * words, p.sentenceEnd !== undefined ? p.sentenceEnd + LABEL.holdAfterSentence : -Infinity);
    if (p.exitAt < min) kitWarn(`KeyedTag "${p.text}": exitAt ${p.exitAt} is earlier than the hold rule (${min})`);
  }

  const t = tagTiming(frame, p.land, p.exitAt, p.secondaryAt);
  if (!t.visible) return null;
  const keyColor = p.keyColor ?? roleColor(theme, p.role ?? 'part');
  const end: Pt = p.end ?? p.anchor;
  const side: 'left' | 'right' = p.side ?? (end[0] >= p.anchor[0] ? 'right' : 'left');
  if (p.render) return <>{p.render({timing: t, anchor: p.anchor, end, side, keyColor})}</>;

  const leaderPts: Pt[] = p.end ? (p.elbow ? [p.anchor, p.elbow, p.end] : [p.anchor, p.end]) : [];
  let leaderLen = 0;
  for (let i = 1; i < leaderPts.length; i++) leaderLen += Math.hypot(leaderPts[i][0] - leaderPts[i - 1][0], leaderPts[i][1] - leaderPts[i - 1][1]);

  const pad = LABEL.platePad;
  const lineH = size * TYPE.lineHeight;
  const W = 1200;
  const H = 320;
  // right: the leader ends on the key bar (plate padding sits under the leader's last 10 px);
  // left: the leader ends on the plate's right edge, 10 px clear of the text.
  const foX = side === 'right' ? end[0] - pad : end[0] - W;
  const foY = end[1] - lineH / 2 - pad;
  const plateColor =
    p.plate === false ? 'transparent' : withAlpha(typeof p.plate === 'string' ? p.plate : theme.surface, LABEL.plateOpacity);
  const slide = side === 'right' ? -t.textX : t.textX;

  return (
    <g>
      {t.text > 0 ? (
        <foreignObject x={foX} y={foY} width={W} height={H} style={{overflow: 'visible'}}>
          <div
            style={{
              width: W,
              height: H,
              display: 'flex',
              justifyContent: side === 'right' ? 'flex-start' : 'flex-end',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                flexDirection: 'row',
                alignItems: 'stretch',
                padding: pad,
                borderRadius: LABEL.plateRadius,
                background: plateColor,
                opacity: t.text,
                transform: `translateX(${slide}px)`,
              }}
            >
              <div style={{width: LABEL.keyBar, background: keyColor, flex: 'none', marginRight: LABEL.keyGap}} />
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontWeight: 600,
                    fontSize: size,
                    lineHeight: TYPE.lineHeight,
                    color: p.muted ? theme.textMuted : theme.ink,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.text}
                </div>
                {p.secondary ? (
                  <div
                    style={{
                      fontFamily: MONO,
                      fontWeight: 500,
                      fontSize: TYPE.secondary,
                      lineHeight: TYPE.lineHeight,
                      color: theme.textMuted,
                      whiteSpace: 'nowrap',
                      opacity: t.secondary,
                    }}
                  >
                    {p.secondary}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </foreignObject>
      ) : null}
      {leaderPts.length > 1 && t.leader > 0
        ? skin.stroke({
            d: polyPath(leaderPts),
            color: theme.annotation,
            width: LABEL.leader,
            trim: [0, leaderLen * t.leader],
            role: 'leader',
            seed: `${seed}:leader`,
            frame,
            cap: 'butt',
            join: 'miter',
          })
        : null}
      {p.end && t.anchor > 0
        ? skin.fill({
            d: squarePath(p.anchor[0], p.anchor[1], LABEL.anchor * t.anchor, 1),
            color: keyColor,
            role: 'anchor',
            seed: `${seed}:anchor`,
            frame,
          })
        : null}
    </g>
  );
};
