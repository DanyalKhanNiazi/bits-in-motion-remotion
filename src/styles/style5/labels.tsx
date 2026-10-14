/**
 * Page-space labels for Live Panels. Tags keep the kit's anatomy and timing (anchor t0−6→t0−2, leader t0−5→t0−1,
 * text t0→t0+5 with an 8 px slide, secondary from t0+4) but take the polarity of the ground they sit on:
 * light-set ink and plate on an outside (light) panel, dark set on inside panels and on spot blacks.
 */
import React from 'react';
import {LABEL, MONO, SANS, TYPE, countWords, kitWarn, polyPath, roleColor, squarePath, tagTiming, withAlpha, EASE, progress, lerp, type Pt, type RoleName} from '../../shared';
import {D, L} from './look';

export type Ground = 'dark' | 'light';
const th = (g: Ground) => (g === 'light' ? L : D);

export interface Tag5Props {
  anchor: Pt;
  end?: Pt;
  elbow?: Pt;
  text: string;
  secondary?: string;
  role?: RoleName;
  side?: 'right' | 'left';
  land: number;
  exitAt?: number;
  sentenceEnd?: number;
  /** ground under the text block */
  ground: Ground;
  /** plate colour (the panel plate it sits on) */
  plate: string;
  /** ground under the anchor (default = ground) */
  anchorGround?: Ground;
  /** leader drawn in the anchor ground's colour up to this arc length, then in the text ground's colour */
  leaderSplit?: number;
  frame: number;
  /** extra opacity (e.g. with a panel fold) */
  opacity?: number;
}

export const Tag5: React.FC<Tag5Props> = (p) => {
  const words = countWords(p.text);
  if (words > TYPE.maxWordsPerLabel) kitWarn(`style5 tag "${p.text}": ${words} words`);
  if (p.exitAt !== undefined && p.sentenceEnd !== undefined) {
    const min = Math.max(p.land + LABEL.holdBase + LABEL.holdPerWord * words, p.sentenceEnd + LABEL.holdAfterSentence);
    if (p.exitAt < min) kitWarn(`style5 tag "${p.text}": exitAt ${p.exitAt} < hold rule ${min}`);
  }
  const t = tagTiming(p.frame, p.land, p.exitAt);
  if (!t.visible) return null;
  const tg = th(p.ground);
  const ta = th(p.anchorGround ?? p.ground);
  const key = roleColor(tg, p.role ?? 'part');
  const keyA = roleColor(ta, p.role ?? 'part');
  const end: Pt = p.end ?? p.anchor;
  const side = p.side ?? (end[0] >= p.anchor[0] ? 'right' : 'left');
  const pts: Pt[] = p.end ? (p.elbow ? [p.anchor, p.elbow, p.end] : [p.anchor, p.end]) : [];
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const pad = LABEL.platePad;
  const lineH = TYPE.label * TYPE.lineHeight;
  const Wd = 1200;
  const foX = side === 'right' ? end[0] - pad : end[0] - Wd;
  const foY = end[1] - lineH / 2 - pad;
  const slide = side === 'right' ? -t.textX : t.textX;
  const drawn = len * t.leader;
  const split = p.leaderSplit ?? (p.anchorGround && p.anchorGround !== p.ground ? 0 : len);
  const dash = (a: number, b: number) => `0 ${a} ${Math.max(0.001, b - a)} ${len + 20}`;
  const d = pts.length > 1 ? polyPath(pts) : '';
  return (
    <g opacity={p.opacity ?? 1}>
      {t.text > 0 ? (
        <foreignObject x={foX} y={foY} width={Wd} height={320} style={{overflow: 'visible'}}>
          <div style={{width: Wd, height: 320, display: 'flex', justifyContent: side === 'right' ? 'flex-start' : 'flex-end', alignItems: 'flex-start'}}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'stretch',
                padding: pad,
                borderRadius: LABEL.plateRadius,
                background: withAlpha(p.plate, LABEL.plateOpacity),
                opacity: t.text,
                transform: `translateX(${slide}px)`,
              }}
            >
              <div style={{width: LABEL.keyBar, background: key, flex: 'none', marginRight: LABEL.keyGap}} />
              <div style={{display: 'flex', flexDirection: 'column'}}>
                <div style={{fontFamily: SANS, fontWeight: 600, fontSize: TYPE.label, lineHeight: TYPE.lineHeight, color: tg.ink, whiteSpace: 'nowrap'}}>{p.text}</div>
                {p.secondary ? (
                  <div style={{fontFamily: MONO, fontWeight: 500, fontSize: TYPE.secondary, lineHeight: TYPE.lineHeight, color: tg.textMuted, whiteSpace: 'nowrap', opacity: t.secondary}}>
                    {p.secondary}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </foreignObject>
      ) : null}
      {pts.length > 1 && drawn > 0 ? (
        <>
          {Math.min(split, drawn) > 0 ? (
            <path d={d} fill="none" stroke={ta.annotation} strokeWidth={LABEL.leader} strokeDasharray={dash(0, Math.min(split, drawn))} />
          ) : null}
          {drawn > split ? <path d={d} fill="none" stroke={tg.annotation} strokeWidth={LABEL.leader} strokeDasharray={dash(split, drawn)} /> : null}
        </>
      ) : null}
      {p.end && t.anchor > 0 ? <path d={squarePath(p.anchor[0], p.anchor[1], LABEL.anchor * t.anchor, 1)} fill={keyA} /> : null}
    </g>
  );
};

/**
 * Time header in the header zone (x 144, y 96): sans 600, +2% tracking, 44 px while it carries the meaning, then
 * 34 px. "Other time" headers ("After the press") carry a DOUBLE underline matching the double-ruled panels;
 * "When pressed" and "Now" a single one.
 */
export const Header5: React.FC<{
  frame: number;
  text: string;
  inAt: number;
  outAt?: number;
  shrinkAt?: number;
  double?: boolean;
  /** double underline collapses to single from this frame (6 frames) */
}> = ({frame, text, inAt, outAt, shrinkAt, double}) => {
  if (frame < inAt) return null;
  const tin = progress(frame, inAt, 5, EASE.arrive);
  const tout = outAt !== undefined ? progress(frame, outAt, 6, EASE.exit) : 0;
  const op = Math.min(tin, 1 - tout);
  if (op <= 0) return null;
  const size = shrinkAt !== undefined ? lerp(TYPE.headerActive, TYPE.header, progress(frame, shrinkAt, 6, EASE.move)) : TYPE.headerActive;
  return (
    <foreignObject x={144} y={96} width={1000} height={140} style={{overflow: 'visible'}}>
      <div style={{display: 'inline-block', opacity: op, transform: `translateX(${-(1 - tin) * 8}px)`}}>
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 600,
            fontSize: size,
            lineHeight: TYPE.lineHeight,
            letterSpacing: TYPE.headerTracking,
            color: D.ink,
            whiteSpace: 'nowrap',
            paddingBottom: 6,
          }}
        >
          {text}
        </div>
        <div style={{height: 2, background: D.annotation}} />
        {double ? <div style={{height: 2, marginTop: 4, background: D.annotation}} /> : null}
      </div>
    </foreignObject>
  );
};

/** Mono readout: numeral 64 px + unit 38 px in textMuted ("0 instructions"). Types in over 5 frames. */
export const Readout: React.FC<{frame: number; x: number; y: number; value: string; unit: string; inAt: number; outAt?: number}> = ({frame, x, y, value, unit, inAt, outAt}) => {
  if (frame < inAt) return null;
  const tout = outAt !== undefined ? progress(frame, outAt, 6, EASE.exit) : 0;
  if (tout >= 1) return null;
  const full = `${value} ${unit}`;
  const n = Math.min(full.length, Math.floor(((frame - inAt + 1) / 5) * full.length));
  const shown = full.slice(0, Math.max(1, n));
  const v = shown.slice(0, value.length);
  const u = shown.slice(value.length);
  return (
    <foreignObject x={x} y={y} width={700} height={100} style={{overflow: 'visible'}}>
      <div style={{display: 'inline-flex', alignItems: 'baseline', opacity: 1 - tout, background: withAlpha(D.panel, 0.9), borderRadius: 8, padding: '2px 10px'}}>
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: TYPE.readout, lineHeight: 1.1, color: D.ink}}>{v}</span>
        <span style={{fontFamily: MONO, fontWeight: 500, fontSize: TYPE.unit, lineHeight: 1.1, color: D.textMuted, whiteSpace: 'pre'}}>{u}</span>
      </div>
    </foreignObject>
  );
};

/** Unboxed two-line relationship label set on the page (S08 "Why different?"), with short leaders. */
export const RelLabel: React.FC<{frame: number; cx: number; y: number; lines: string[]; inAt: number; leaders?: Array<[Pt, Pt]>}> = ({frame, cx, y, lines, inAt, leaders}) => {
  if (frame < inAt - 5) return null;
  const tl = progress(frame, inAt - 5, 4, EASE.arrive);
  const tt = progress(frame, inAt, 5, EASE.arrive);
  return (
    <g>
      {(leaders ?? []).map(([a, b], i) => {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        return <path key={i} d={polyPath([a, b])} stroke={D.annotation} strokeWidth={3} fill="none" strokeDasharray={`${len * tl} ${len + 10}`} />;
      })}
      <foreignObject x={cx - 300} y={y} width={600} height={140} style={{overflow: 'visible'}}>
        <div style={{width: 600, textAlign: 'center', opacity: tt, transform: `translateY(${(1 - tt) * 8}px)`}}>
          {lines.map((l) => (
            <div key={l} style={{fontFamily: SANS, fontWeight: 600, fontSize: TYPE.label, lineHeight: TYPE.lineHeight, color: D.ink, whiteSpace: 'nowrap'}}>
              {l}
            </div>
          ))}
        </div>
      </foreignObject>
    </g>
  );
};

/** A centred station name under a drawing (S06): 44 px, up to two lines. */
export const StationName: React.FC<{frame: number; cx: number; y: number; lines: string[]; inAt: number; outAt?: number}> = ({frame, cx, y, lines, inAt, outAt}) => {
  if (frame < inAt) return null;
  const tin = progress(frame, inAt, 5, EASE.arrive);
  const tout = outAt !== undefined ? progress(frame, outAt, 6, EASE.exit) : 0;
  const op = Math.min(tin, 1 - tout);
  if (op <= 0) return null;
  return (
    <foreignObject x={cx - 150} y={y} width={300} height={130} style={{overflow: 'visible'}}>
      <div style={{width: 300, textAlign: 'center', opacity: op, transform: `translateY(${(1 - tin) * 8}px)`}}>
        {lines.map((l) => (
          <div key={l} style={{fontFamily: SANS, fontWeight: 600, fontSize: TYPE.label, lineHeight: TYPE.lineHeight, color: D.ink, whiteSpace: 'nowrap'}}>
            {l}
          </div>
        ))}
      </div>
    </foreignObject>
  );
};

export {roleColor};
