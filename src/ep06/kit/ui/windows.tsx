/**
 * Ep06 UI kit: the recreated Windows UI, one generic dark chrome (DIRECTION §1.4, §2.5). No logos, wallpaper, real
 * icons, account, clock, sizes or dates. Everything is drawn in LOCAL px (e.g. the 1032×547 desk-monitor slot) and
 * scales with its parent; pass `scale` (local→screen px) to get [kit] floor warnings for must-read text.
 *
 *   <ScreenSlot rect={REGIONS.deskScreen}>
 *     <WinDesktop frame={f} w={1032} h={547}>
 *       <ExplorerWindow frame={f} x={30} y={28} w={640} h={452} selectAt={a} actions={[{at: d, kind: 'delete'}]} flyTo={binPt} />
 *       <RecycleBin frame={f} x={862} y={300} w={230} holdsPhoto={d + 20} />
 *     </WinDesktop>
 *   </ScreenSlot>
 */
import React from 'react';
import {Img, random} from 'remotion';
import {EASE, MONO, PAL, SANS, SPRING} from '../look';
import {assetBox, assetUrl, type AssetName} from '../assets';
import {clamp01, lerp, prog, rgba, springAt} from '../util';
import {Crop, Cursor, PASS_CARD_ASPECT, PASS_CARD_BOX, WIN, floorCheck, type CursorKey} from './shared';

/* ---------------------------------------------------------------- chrome */
const Controls: React.FC<{s: number; h: number}> = ({s, h}) => {
  const c = rgba(PAL.muted, 0.8);
  const bw = 52 * s;
  const g = 11 * s;
  return (
    <div style={{position: 'absolute', right: 0, top: 0, height: h, display: 'flex'}}>
      {[0, 1, 2].map((i) => (
        <svg key={i} width={bw} height={h} viewBox={`0 0 ${bw} ${h}`}>
          {i === 0 ? <line x1={bw / 2 - g / 2} y1={h / 2} x2={bw / 2 + g / 2} y2={h / 2} stroke={c} strokeWidth={1.6 * s} /> : null}
          {i === 1 ? <rect x={bw / 2 - g / 2} y={h / 2 - g / 2} width={g} height={g} rx={1.5 * s} fill="none" stroke={c} strokeWidth={1.6 * s} /> : null}
          {i === 2 ? (
            <path d={`M${bw / 2 - g / 2} ${h / 2 - g / 2} L${bw / 2 + g / 2} ${h / 2 + g / 2} M${bw / 2 + g / 2} ${h / 2 - g / 2} L${bw / 2 - g / 2} ${h / 2 + g / 2}`} stroke={c} strokeWidth={1.6 * s} />
          ) : null}
        </svg>
      ))}
    </div>
  );
};

/** Generic folder glyph (not a Windows icon): a simple two-tone tab folder. */
export const FolderGlyph: React.FC<{size: number; color?: string}> = ({size, color = '#C9B37A'}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 30 24" style={{display: 'block'}}>
    <path d="M1 4 Q1 2 3 2 L11 2 L14 5 L27 5 Q29 5 29 7 L29 21 Q29 23 27 23 L3 23 Q1 23 1 21 Z" fill={color} opacity={0.75} />
    <path d="M1 9 Q1 7.5 3 7.5 L27 7.5 Q29 7.5 29 9 L29 21 Q29 23 27 23 L3 23 Q1 23 1 21 Z" fill={color} />
  </svg>
);

const Chevron: React.FC<{size: number; color: string; dir?: 'right' | 'left' | 'up'}> = ({size, color, dir = 'right'}) => (
  <svg width={size} height={size} viewBox="0 0 10 10" style={{display: 'block', transform: dir === 'left' ? 'scaleX(-1)' : dir === 'up' ? 'rotate(-90deg)' : undefined}}>
    <path d="M3.5 1.8 L6.7 5 L3.5 8.2" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** A dark window frame with a generic title bar. s = size factor (1 at the 1032×547 desk slot). */
export const WinFrame: React.FC<{w: number; h: number; s?: number; title?: React.ReactNode; body?: string; children?: React.ReactNode; style?: React.CSSProperties}> = ({
  w,
  h,
  s = 1,
  title,
  body = WIN.body,
  children,
  style,
}) => {
  const th = 50 * s;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        height: h,
        borderRadius: 12 * s,
        background: body,
        border: `${1.5 * s}px solid ${WIN.lineHi}`,
        boxShadow: `0 ${26 * s}px ${70 * s}px rgba(0,0,0,0.55), 0 ${4 * s}px ${12 * s}px rgba(0,0,0,0.35)`,
        overflow: 'hidden',
        fontFamily: SANS,
        ...style,
      }}
    >
      <div style={{position: 'absolute', left: 0, top: 0, right: 0, height: th, background: WIN.title, borderBottom: `1px solid ${WIN.line}`}}>
        <div style={{position: 'absolute', left: 18 * s, top: 0, height: th, display: 'flex', alignItems: 'center', gap: 12 * s, color: WIN.muted, fontSize: 23 * s, fontWeight: 600}}>
          {title}
        </div>
        <Controls s={s} h={th} />
      </div>
      <div style={{position: 'absolute', left: 0, top: th, right: 0, bottom: 0}}>{children}</div>
    </div>
  );
};

/** The dark desktop the windows sit on: no wallpaper, a plain taskbar with no clock. */
export const WinDesktop: React.FC<{frame: number; w: number; h: number; taskbar?: boolean; children?: React.ReactNode}> = ({frame, w, h, taskbar = true, children}) => {
  const tb = Math.round(h * 0.068);
  const glow = 0.5 + 0.5 * Math.sin(frame / 70);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: w, height: h, overflow: 'hidden', background: `radial-gradient(ellipse 85% 90% at 30% 20%, ${WIN.deskHi}, ${WIN.desk} 70%)`}}>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 50% 40% at 78% 70%, ${rgba('#2A3E66', 0.18 + 0.04 * glow)}, rgba(0,0,0,0))`}} />
      {children}
      {taskbar ? (
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: tb, background: rgba('#0E1522', 0.94), borderTop: `1px solid ${WIN.line}`}}>
          <div style={{position: 'absolute', left: '50%', top: tb * 0.2, height: tb * 0.6, transform: 'translateX(-50%)', display: 'flex', gap: tb * 0.35}}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{width: tb * 0.6, height: tb * 0.6, borderRadius: tb * 0.14, background: rgba(PAL.structure, i === 1 ? 0.34 : 0.18)}} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

/** The passport file's thumbnail: a crop of the fictional card (no readable data). */
export const PassportThumb: React.FC<{h: number; glow?: number}> = ({h, glow = 0}) => {
  const w = h * PASS_CARD_ASPECT;
  return (
    <div style={{position: 'absolute', left: -w / 2, top: -h / 2, width: w, height: h, borderRadius: h * 0.05, overflow: 'hidden', boxShadow: `0 ${h * 0.08}px ${h * 0.22}px rgba(0,0,0,0.5)${glow > 0 ? `, 0 0 ${h * 0.5 * glow}px ${rgba(PAL.ink, 0.6 * glow)}` : ''}`}}>
      <Crop src="fictional-passport_b" box={PASS_CARD_BOX} w={w} h={h} />
    </div>
  );
};

/* ---------------------------------------------------------------- ExplorerWindow */
export type ExplorerAction = {at: number; kind: 'delete' | 'shiftDelete' | 'restore'};
export type ExplorerProps = {
  frame: number;
  /** window top-left in parent px */
  x?: number;
  y?: number;
  w: number;
  h: number;
  /** the file name's size in local px (default 36; the rest of the chrome scales with it) */
  fontSize?: number;
  selectAt?: number;
  actions?: readonly ExplorerAction[];
  /** where a deleted file flies to, in parent px (e.g. recycleBinPoint(...)); s = its scale on landing */
  flyTo?: {x: number; y: number; s?: number};
  flyDur?: number;
  /** cursor keys in parent px */
  cursor?: readonly CursorKey[];
  enterAt?: number;
  exitAt?: number;
  /** number of blank rows under the file */
  rows?: number;
  /** local → screen px, for floor warnings (desk slot: deskSlotScale(frame, kb)) */
  scale?: number;
};

const exGeom = (p: ExplorerProps) => {
  const s = (p.fontSize ?? 36) / 36;
  const th = 50 * s;
  const ah = 78 * s;
  const top = th + ah + 16 * s;
  const rowH = 84 * s;
  const pad = 20 * s;
  const thumbH = 62 * s;
  const ox = p.x ?? 0;
  const oy = p.y ?? 0;
  return {s, th, ah, top, rowH, pad, thumbH, thumb: {x: ox + pad + 26 * s, y: oy + top + rowH / 2}};
};

/** Where the flying file is at a frame (parent px), so a section can attach Bits; null when nothing is in flight. */
export const explorerFlight = (p: ExplorerProps, f: number): {x: number; y: number; s: number; u: number; kind: 'delete' | 'restore'} | null => {
  const g = exGeom(p);
  const to = p.flyTo ?? {x: (p.x ?? 0) + p.w + 140 * g.s, y: (p.y ?? 0) + p.h - 40 * g.s, s: 0.8};
  const dur = p.flyDur ?? 18;
  const last = [...(p.actions ?? [])].filter((a) => a.at <= f).sort((a, b) => b.at - a.at)[0];
  if (!last || last.kind === 'shiftDelete') return null;
  const u = prog(f, last.at + 1, dur, EASE.inOut);
  if (u <= 0 || u >= 1) return null;
  const [a, b] = last.kind === 'delete' ? [g.thumb, to] : [to, g.thumb];
  const v = u;
  const lift = Math.hypot(b.x - a.x, b.y - a.y) * 0.12 * Math.sin(Math.PI * v);
  const sA = last.kind === 'delete' ? 1 : (to.s ?? 1);
  const sB = last.kind === 'delete' ? (to.s ?? 1) : 1;
  return {x: lerp(a.x, b.x, v), y: lerp(a.y, b.y, v) - lift, s: lerp(sA, sB, v) * (1 + 0.25 * Math.sin(Math.PI * v)), u: v, kind: last.kind};
};

/** Is the file in its row at a frame (and how visible: 0..1)? */
const presence = (p: ExplorerProps, f: number): {op: number; vanish: number; flash: number} => {
  const acts = [...(p.actions ?? [])].filter((a) => a.at <= f).sort((a, b) => b.at - a.at);
  const last = acts[0];
  const dur = p.flyDur ?? 18;
  if (!last) return {op: 1, vanish: 0, flash: 0};
  const t = f - last.at;
  if (last.kind === 'delete') return {op: 1 - prog(t, 0, 4), vanish: 0, flash: 0};
  if (last.kind === 'shiftDelete') return {op: 1 - prog(t, 3, 9, EASE.inCubic), vanish: prog(t, 0, 12, EASE.out), flash: t < 12 ? Math.exp(-t / 3.5) : 0};
  return {op: prog(t, dur - 1, 6), vanish: 0, flash: 0};
};

export const ExplorerWindow: React.FC<ExplorerProps> = (p) => {
  const {frame: f, w, h, selectAt, cursor, enterAt, exitAt, scale} = p;
  const g = exGeom(p);
  const {s, th, ah, top, rowH, pad, thumbH} = g;
  const fs = p.fontSize ?? 36;
  floorCheck('ExplorerWindow "passport.jpg"', fs, scale);
  const ein = enterAt === undefined ? 1 : springAt(f, enterAt, SPRING.snap);
  const eout = exitAt === undefined ? 0 : prog(f, exitAt, 9, EASE.inCubic);
  if (ein <= 0.001 || eout >= 1) return null;
  const pr = presence(p, f);
  const sel = selectAt === undefined ? 0 : prog(f, selectAt, 4) * pr.op;
  const nRows = p.rows ?? Math.max(0, Math.floor((h - top - 10 * s) / rowH) - 1);
  const fl = explorerFlight(p, f);
  const ox = p.x ?? 0;
  const oy = p.y ?? 0;
  const crumbFs = 33 * s;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: ox,
          top: oy,
          width: w,
          height: h,
          opacity: clamp01(ein * 3) * (1 - eout),
          transform: `scale(${0.94 + 0.06 * Math.min(1.02, ein)}) translateY(${eout * 20}px)`,
          transformOrigin: '50% 60%',
        }}
      >
        <WinFrame
          w={w}
          h={h}
          s={s}
          title={
            <>
              <FolderGlyph size={26 * s} />
              <span>Pictures</span>
            </>
          }
        >
          {/* address bar */}
          <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: ah, display: 'flex', alignItems: 'center', gap: 12 * s, padding: `0 ${pad}px`, borderBottom: `1px solid ${WIN.line}`}}>
            <Chevron size={22 * s} color={WIN.dim} dir="left" />
            <Chevron size={22 * s} color={WIN.dim} />
            <Chevron size={22 * s} color={WIN.dim} dir="up" />
            <div
              style={{
                flex: 1,
                height: ah * 0.68,
                borderRadius: 8 * s,
                background: WIN.field,
                border: `1px solid ${WIN.line}`,
                display: 'flex',
                alignItems: 'center',
                gap: 12 * s,
                padding: `0 ${14 * s}px`,
                color: WIN.text,
                fontSize: crumbFs,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <span>This PC</span>
              <Chevron size={crumbFs * 0.7} color={WIN.muted} />
              <span>Pictures</span>
            </div>
          </div>
          {/* rows */}
          <div style={{position: 'absolute', left: 0, right: 0, top: top - th, bottom: 0}}>
            <div
              style={{
                position: 'absolute',
                left: pad * 0.5,
                right: pad * 0.5,
                top: 0,
                height: rowH,
                borderRadius: 8 * s,
                background: rgba(WIN.select, 0.2 * sel),
                border: `${1.5 * s}px solid ${rgba(WIN.select, 0.55 * sel)}`,
              }}
            >
              <div style={{position: 'absolute', left: 0, top: rowH * 0.2, bottom: rowH * 0.2, width: 4 * s, borderRadius: 2 * s, background: rgba(WIN.select, sel)}} />
            </div>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                width: w,
                height: rowH,
                opacity: pr.op,
                transform: pr.vanish > 0 ? `scaleX(${1 - 0.6 * pr.vanish}) scaleY(${1 + 0.15 * pr.vanish})` : undefined,
                transformOrigin: `${pad + 26 * s}px 50%`,
                filter: pr.flash > 0.02 ? `brightness(${1 + 2.2 * pr.flash})` : undefined,
              }}
            >
              {!fl ? (
                <div style={{position: 'absolute', left: pad + 26 * s, top: rowH / 2}}>
                  <PassportThumb h={thumbH} />
                </div>
              ) : null}
              <div style={{position: 'absolute', left: pad + 74 * s, top: 0, height: rowH, display: 'flex', alignItems: 'center', fontFamily: MONO, fontWeight: 500, fontSize: fs, color: WIN.text, letterSpacing: '-0.01em'}}>
                passport.jpg
              </div>
            </div>
            {pr.flash > 0.02 ? (
              <div style={{position: 'absolute', left: 0, top: 0, width: w, height: rowH}}>
                {Array.from({length: 14}, (_, i) => {
                  const t = 1 - pr.flash;
                  const a = random(`ex-v-${i}`) * Math.PI * 2;
                  const d = (30 + 120 * random(`ex-d-${i}`)) * s * (0.2 + t);
                  const sz = (4 + 6 * random(`ex-s-${i}`)) * s;
                  return (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: pad + (40 + 260 * random(`ex-x-${i}`)) * s + Math.cos(a) * d,
                        top: rowH / 2 + Math.sin(a) * d * 0.5,
                        width: sz,
                        height: sz,
                        borderRadius: sz * 0.2,
                        background: PAL.ink,
                        opacity: pr.flash,
                      }}
                    />
                  );
                })}
              </div>
            ) : null}
            {Array.from({length: nRows}, (_, i) => {
              const yy = (i + 1) * rowH;
              const bw = (150 + 190 * random(`ex-row-${i}`)) * s;
              return (
                <div key={i} style={{position: 'absolute', left: pad + 6 * s, top: yy + rowH * 0.28, height: rowH * 0.44, display: 'flex', alignItems: 'center', gap: 22 * s, opacity: 0.85 - i * 0.12}}>
                  <div style={{width: 40 * s, height: rowH * 0.44, borderRadius: 5 * s, background: WIN.blank}} />
                  <div style={{width: bw, height: 14 * s, borderRadius: 7 * s, background: WIN.blank}} />
                </div>
              );
            })}
          </div>
        </WinFrame>
      </div>
      {fl ? (
        <div style={{position: 'absolute', left: fl.x, top: fl.y, width: 0, height: 0, transform: `scale(${fl.s}) rotate(${(fl.kind === 'delete' ? 1 : -1) * 10 * Math.sin(Math.PI * fl.u)}deg)`}}>
          <PassportThumb h={thumbH} glow={Math.sin(Math.PI * fl.u)} />
        </div>
      ) : null}
      {cursor ? <Cursor frame={f} keys={cursor} size={34 * s} /> : null}
    </>
  );
};

/* ---------------------------------------------------------------- PhotoViewer */
export const PhotoViewer: React.FC<{
  frame: number;
  x?: number;
  y?: number;
  w: number;
  h: number;
  openAt?: number;
  exitAt?: number;
  /** the image shown (default the on-screen passport render) */
  imageSrc?: AssetName;
  name?: string;
  /** title-bar size factor (1 at the 1032×547 desk slot) */
  s?: number;
}> = ({frame: f, x = 0, y = 0, w, h, openAt, exitAt, imageSrc = 'fictional-passport_b', name = 'passport.jpg', s = 1}) => {
  const ein = openAt === undefined ? 1 : springAt(f, openAt, SPRING.snap);
  const eout = exitAt === undefined ? 0 : prog(f, exitAt, 9, EASE.inCubic);
  if (ein <= 0.001 || eout >= 1) return null;
  const b = assetBox(imageSrc);
  const bodyH = h - 50 * s;
  const ih = bodyH * 0.9;
  const k = ih / b.ch;
  const zoom = 1 + 0.03 * clamp01((f - (openAt ?? 0)) / 240);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: clamp01(ein * 3) * (1 - eout), transform: `scale(${0.9 + 0.1 * Math.min(1.03, ein)})`, transformOrigin: '50% 55%'}}>
      <WinFrame w={w} h={h} s={s} body="#0C111B" title={<span style={{fontFamily: MONO, fontWeight: 500, color: WIN.text}}>{name}</span>}>
        <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 70% at 50% 45%, #1A2335, #0C111B 75%)`}} />
        <div style={{position: 'absolute', left: w / 2, top: bodyH / 2, width: 0, height: 0, transform: `scale(${zoom})`}}>
          <Img
            src={assetUrl(imageSrc)}
            style={{position: 'absolute', left: -b.cx * k, top: -b.cy * k, width: b.w * k, height: b.h * k, filter: `drop-shadow(0 ${14 * s}px ${22 * s}px rgba(0,0,0,0.55))`}}
          />
        </div>
      </WinFrame>
    </div>
  );
};

/* ---------------------------------------------------------------- SettingsToggle */
export type ToggleState = 'on' | 'off' | 'unknown';

const ToggleSwitch: React.FC<{size: number; state: ToggleState; on: number}> = ({size, state, on}) => {
  const tw = size * 2.1;
  const thh = size * 1.04;
  const kd = size * 0.66;
  const unknown = state === 'unknown';
  const kx = unknown ? tw / 2 - kd / 2 : lerp(thh / 2 - kd / 2, tw - thh / 2 - kd / 2, on);
  return (
    <div style={{position: 'relative', width: tw, height: thh}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: thh / 2,
          border: `${size * 0.06}px ${unknown ? 'dashed' : 'solid'} ${unknown ? PAL.structure : mixA(on)}`,
          background: unknown ? rgba(PAL.structure, 0.08) : rgba(PAL.ink, on),
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: kx,
          top: thh / 2 - kd / 2,
          width: kd,
          height: kd,
          borderRadius: '50%',
          background: unknown ? 'rgba(0,0,0,0)' : on > 0.5 ? WIN.body : PAL.muted,
          border: unknown ? `${size * 0.06}px solid ${PAL.annotation}` : undefined,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: kd * 0.78,
          lineHeight: 1,
          color: PAL.ink,
          boxSizing: 'border-box',
        }}
      >
        {unknown ? '?' : null}
      </div>
    </div>
  );
};
const mixA = (on: number) => (on > 0.5 ? PAL.ink : PAL.muted);

const LockGlyph: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <rect x={4.5} y={10.5} width={15} height={11} rx={2.4} fill="none" stroke={PAL.annotation} strokeWidth={1.8} />
    <path d="M8 10.5 V7.4 a4 4 0 0 1 8 0 V10.5" fill="none" stroke={PAL.annotation} strokeWidth={1.8} />
    <circle cx={12} cy={15.6} r={1.5} fill={PAL.annotation} />
  </svg>
);
const ResetGlyph: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{display: 'block'}}>
    <path d="M19 12 a7 7 0 1 1 -2.05 -4.95" fill="none" stroke={PAL.annotation} strokeWidth={1.8} strokeLinecap="round" />
    <path d="M17.6 3.6 L17.3 7.4 L13.5 7.1" fill="none" stroke={PAL.annotation} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type SettingsToggleProps = {
  frame: number;
  /** row centre in parent px */
  x: number;
  y: number;
  w?: number;
  title: string;
  sub?: string;
  state: ToggleState;
  /** animate an on/off flip at this frame (to `flipTo`, default the opposite state) */
  flipAt?: number;
  flipTo?: 'on' | 'off';
  at?: number;
  exitAt?: number;
  /** title size in local px (default 44) */
  size?: number;
  icon?: 'lock' | 'reset' | 'none';
  /** a magnifier glides over the toggle */
  magnifier?: {at: number; until?: number};
  /** local → screen px (floor warnings) */
  scale?: number;
};

export const SettingsToggle: React.FC<SettingsToggleProps> = ({frame: f, x, y, w = 1000, title, sub, state, flipAt, flipTo, at, exitAt, size = 44, icon = 'lock', magnifier, scale}) => {
  floorCheck(`SettingsToggle "${title}"`, size, scale);
  const ein = at === undefined ? 1 : springAt(f, at, SPRING.snap);
  const eout = exitAt === undefined ? 0 : prog(f, exitAt, 9, EASE.inCubic);
  if (ein <= 0.001 || eout >= 1) return null;
  const base = state === 'on' ? 1 : 0;
  const target = flipTo ? (flipTo === 'on' ? 1 : 0) : 1 - base;
  const on = flipAt === undefined || state === 'unknown' ? base : lerp(base, target, springAt(f, flipAt, SPRING.snap));
  const flipFlash = flipAt !== undefined && f >= flipAt && f < flipAt + 14 ? Math.exp(-(f - flipAt) / 4) : 0;
  const rh = size * (sub ? 2.9 : 2.3);
  const toggleX = w / 2 - size * 0.7 - size * 2.1;
  const word = state === 'unknown' ? null : on > 0.5 ? 'On' : 'Off';
  const sw = <ToggleSwitch size={size} state={state} on={on} />;
  // magnifier
  let mag: React.ReactNode = null;
  if (magnifier) {
    const mi = prog(f, magnifier.at, 22, EASE.outExpo);
    const mo = magnifier.until === undefined ? 0 : prog(f, magnifier.until, 10, EASE.inCubic);
    if (mi > 0 && mo < 1) {
      const R = size * 1.95;
      const cx = toggleX + size * 1.05 + (1 - mi) * size * 3 + Math.sin(f / 23) * size * 0.06;
      const cy = (1 - mi) * size * 2.5 + Math.cos(f / 29) * size * 0.05;
      const M = 1.6;
      mag = (
        <div style={{position: 'absolute', left: cx, top: cy, width: 0, height: 0, opacity: mi * (1 - mo)}}>
          <div style={{position: 'absolute', left: R * 0.62, top: R * 0.62, width: R * 1.1, height: size * 0.36, borderRadius: size * 0.18, background: 'linear-gradient(180deg, #9AA3B2, #4A5263)', transform: 'rotate(45deg)', transformOrigin: '0 50%'}} />
          <div style={{position: 'absolute', left: -R, top: -R, width: 2 * R, height: 2 * R, borderRadius: '50%', overflow: 'hidden', background: WIN.body, boxShadow: `0 ${size * 0.3}px ${size * 0.8}px rgba(0,0,0,0.55)`}}>
            <div style={{position: 'absolute', left: R + (toggleX - cx) * M, top: R + (-size * 0.52 - cy) * M, transform: `scale(${M})`, transformOrigin: '0 0'}}>{sw}</div>
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 32% 28%, rgba(255,255,255,0.22), rgba(255,255,255,0) 45%)'}} />
          </div>
          <div style={{position: 'absolute', left: -R, top: -R, width: 2 * R, height: 2 * R, borderRadius: '50%', border: `${size * 0.14}px solid #B9C1CE`, boxSizing: 'border-box', boxShadow: 'inset 0 0 0 2px rgba(0,0,0,0.35)'}} />
        </div>
      );
    }
  }
  return (
    <div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, opacity: clamp01(ein * 3) * (1 - eout), transform: `scale(${0.92 + 0.08 * Math.min(1.03, ein)})`}}>
      <div
        style={{
          position: 'absolute',
          left: -w / 2,
          top: -rh / 2,
          width: w,
          height: rh,
          borderRadius: size * 0.3,
          background: WIN.body,
          border: `2px solid ${WIN.lineHi}`,
          boxShadow: `0 ${size * 0.5}px ${size * 1.3}px rgba(0,0,0,0.5)${flipFlash > 0 ? `, 0 0 ${size * flipFlash}px ${rgba(PAL.ink, 0.5 * flipFlash)}` : ''}`,
          fontFamily: SANS,
        }}
      >
        <div style={{position: 'absolute', left: size * 0.6, top: 0, height: rh, display: 'flex', alignItems: 'center', gap: size * 0.5}}>
          {icon === 'lock' ? <LockGlyph size={size * 1.1} /> : icon === 'reset' ? <ResetGlyph size={size * 1.1} /> : null}
          <div>
            <div style={{fontWeight: 600, fontSize: size, color: PAL.ink, lineHeight: 1.15, whiteSpace: 'nowrap'}}>{title}</div>
            {sub ? <div style={{fontWeight: 600, fontSize: size * 0.72, color: PAL.muted, lineHeight: 1.2, whiteSpace: 'nowrap'}}>{sub}</div> : null}
          </div>
        </div>
        {word ? (
          <div style={{position: 'absolute', right: size * 0.7 + size * 2.1 + size * 0.4, top: 0, height: rh, display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: size * 0.8, color: PAL.muted}}>
            {word}
          </div>
        ) : null}
        <div style={{position: 'absolute', right: size * 0.7, top: rh / 2 - size * 0.52}}>{sw}</div>
      </div>
      {mag}
    </div>
  );
};

/* ---------------------------------------------------------------- CommandWindow */
export type CommandWindowProps = {
  frame: number;
  x?: number;
  y?: number;
  w: number;
  h: number;
  /** the typed command (after the prompt) */
  text?: string;
  typeAt: number;
  /** characters per frame (default 0.5 ≈ 15 chars/s) */
  rate?: number;
  prompt?: string;
  /** a span of the command to highlight (e.g. "/w") */
  highlight?: string;
  highlightAt?: number;
  fontSize?: number;
  enterAt?: number;
  exitAt?: number;
  scale?: number;
};

export const CommandWindow: React.FC<CommandWindowProps> = ({
  frame: f,
  x = 0,
  y = 0,
  w,
  h,
  text = 'cipher /w:C:\\',
  typeAt,
  rate = 0.5,
  prompt = 'C:\\>',
  highlight,
  highlightAt,
  fontSize = 40,
  enterAt,
  exitAt,
  scale,
}) => {
  floorCheck('CommandWindow text', fontSize, scale);
  const ein = enterAt === undefined ? 1 : springAt(f, enterAt, SPRING.snap);
  const eout = exitAt === undefined ? 0 : prog(f, exitAt, 9, EASE.inCubic);
  if (ein <= 0.001 || eout >= 1) return null;
  const s = fontSize / 40;
  const n = Math.max(0, Math.min(text.length, Math.floor((f - typeAt) * rate)));
  const typed = text.slice(0, n);
  const done = n >= text.length;
  const doneAt = typeAt + Math.ceil(text.length / rate);
  const caretOn = !done || Math.floor((f - doneAt) / 15) % 2 === 0;
  const hi = highlight ? text.indexOf(highlight) : -1;
  const hAt = highlightAt ?? doneAt + 6;
  const hv = hi >= 0 && n >= hi + (highlight?.length ?? 0) ? springAt(f, hAt, SPRING.pop) : 0;
  const parts: React.ReactNode[] = [];
  if (hi >= 0 && hv > 0) {
    parts.push(<span key="a">{typed.slice(0, hi)}</span>);
    parts.push(
      <span
        key="b"
        style={{
          display: 'inline-block',
          color: '#FFFFFF',
          background: rgba(PAL.emphasis, 0.2 * clamp01(hv)),
          outline: `${2.5 * s}px solid ${rgba(PAL.emphasis, clamp01(hv))}`,
          outlineOffset: 3 * s,
          borderRadius: 4 * s,
          boxShadow: `0 0 ${24 * s}px ${rgba(PAL.emphasis, 0.55 * clamp01(hv))}`,
          transform: `scale(${0.9 + 0.1 * hv})`,
        }}
      >
        {typed.slice(hi, hi + (highlight?.length ?? 0))}
      </span>,
    );
    parts.push(<span key="c">{typed.slice(hi + (highlight?.length ?? 0))}</span>);
  } else parts.push(<span key="a">{typed}</span>);
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: h, opacity: clamp01(ein * 3) * (1 - eout), transform: `scale(${0.94 + 0.06 * Math.min(1.02, ein)})`, transformOrigin: '50% 60%'}}>
      <WinFrame w={w} h={h} s={s} body={WIN.console} title={<span style={{fontFamily: MONO, fontWeight: 500, fontSize: 23 * s}}>{prompt}</span>}>
        <div style={{position: 'absolute', left: 28 * s, top: 30 * s, right: 28 * s, fontFamily: MONO, fontWeight: 500, fontSize, lineHeight: 1.3, color: PAL.ink, whiteSpace: 'pre'}}>
          <span style={{color: PAL.muted}}>{prompt}</span>
          {parts}
          <span style={{display: 'inline-block', width: '0.6em', height: '1.05em', verticalAlign: '-0.2em', marginLeft: 2 * s, background: PAL.ink, opacity: caretOn ? 0.9 : 0.12}} />
        </div>
      </WinFrame>
    </div>
  );
};
