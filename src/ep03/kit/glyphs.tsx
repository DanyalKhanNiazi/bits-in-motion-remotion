/**
 * Ep03 kit: vector glyphs for characters the latin font subsets do not carry (≈ → ✓ ✗ × ¾ ½ ¼), and <Rich>, which
 * renders a string with them swapped in. Use <Rich> for every on-screen string that may contain these characters.
 */
import React from 'react';

type GlyphProps = {color?: string; weight?: number};
const S: React.FC<{w: number; children: React.ReactNode; dy?: number}> = ({w, children, dy = -0.12}) => (
  <svg
    viewBox={`0 0 ${w} 100`}
    style={{display: 'inline-block', width: `${w / 100}em`, height: '1em', verticalAlign: `${dy}em`, overflow: 'visible'}}
  >
    {children}
  </svg>
);
const sw = (weight = 700) => (weight >= 700 ? 10 : weight >= 600 ? 8.6 : 7.4);

export const ApproxGlyph: React.FC<GlyphProps> = ({color = 'currentColor', weight}) => (
  <S w={64}>
    <g fill="none" stroke={color} strokeWidth={sw(weight)} strokeLinecap="round">
      <path d="M8 44 C 16 34, 26 34, 32 42 S 48 50, 56 40" />
      <path d="M8 66 C 16 56, 26 56, 32 64 S 48 72, 56 62" />
    </g>
  </S>
);
export const ArrowGlyph: React.FC<GlyphProps> = ({color = 'currentColor', weight}) => (
  <S w={96}>
    <g fill="none" stroke={color} strokeWidth={sw(weight)} strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 54 H 82" />
      <path d="M62 32 L 84 54 L 62 76" />
    </g>
  </S>
);
export const CheckGlyph: React.FC<GlyphProps> = ({color = 'currentColor', weight}) => (
  <S w={80}>
    <path d="M12 56 L 32 76 L 70 28" fill="none" stroke={color} strokeWidth={sw(weight) * 1.25} strokeLinecap="round" strokeLinejoin="round" />
  </S>
);
export const CrossGlyph: React.FC<GlyphProps> = ({color = 'currentColor', weight}) => (
  <S w={72}>
    <path d="M16 30 L 56 74 M 56 30 L 16 74" fill="none" stroke={color} strokeWidth={sw(weight) * 1.25} strokeLinecap="round" />
  </S>
);
export const TimesGlyph: React.FC<GlyphProps> = ({color = 'currentColor', weight}) => (
  <S w={62}>
    <path d="M14 34 L 48 70 M 48 34 L 14 70" fill="none" stroke={color} strokeWidth={sw(weight)} strokeLinecap="round" />
  </S>
);
const Frac: React.FC<{n: string; d: string}> = ({n, d}) => (
  <span style={{display: 'inline-block', position: 'relative', width: '0.9em', height: '1em', verticalAlign: '-0.12em'}}>
    <span style={{position: 'absolute', left: '0.02em', top: '0.02em', fontSize: '0.5em', lineHeight: 1}}>{n}</span>
    <svg viewBox="0 0 90 100" style={{position: 'absolute', left: 0, top: 0, width: '0.9em', height: '1em', overflow: 'visible'}}>
      <path d="M66 18 L 24 86" stroke="currentColor" strokeWidth={7} strokeLinecap="round" />
    </svg>
    <span style={{position: 'absolute', right: '0.02em', bottom: '0.06em', fontSize: '0.5em', lineHeight: 1}}>{d}</span>
  </span>
);

const MAP: Record<string, (p: GlyphProps) => React.ReactNode> = {
  '≈': (p) => <ApproxGlyph {...p} />,
  '→': (p) => <ArrowGlyph {...p} />,
  '✓': (p) => <CheckGlyph {...p} />,
  '✗': (p) => <CrossGlyph {...p} />,
  '×': (p) => <TimesGlyph {...p} />,
  '¾': () => <Frac n="3" d="4" />,
  '½': () => <Frac n="1" d="2" />,
  '¼': () => <Frac n="1" d="4" />,
};
const RE = /([≈→✓✗×¾½¼])/;

/** A string with vector glyphs swapped in for ≈ → ✓ ✗ × ¾ ½ ¼. */
export const Rich: React.FC<{text: string; weight?: number; color?: string}> = ({text, weight, color}) => {
  if (!RE.test(text)) return <>{text}</>;
  const parts = text.split(RE);
  return (
    <>
      {parts.map((p, i) => {
        const g = MAP[p];
        return g ? <React.Fragment key={i}>{g({weight, color})}</React.Fragment> : <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
};
