/**
 * Fonts, loaded once through @remotion/google-fonts (latin subset only).
 *
 * - Sora 600 (labels, pills, headers) and 700 (hero words, the "?" glyph).
 * - JetBrains Mono 500 (the one technical line "+5VSB · ATX", readouts, scale chips).
 *
 * loadFont() registers a delayRender handle, so a frame is not captured before the fonts are ready.
 * Importing anything from the kit imports this module, so fonts are always loaded in every entry.
 *
 * Adding a style's own display face (hero words only; never labels, numbers or the intro's tags):
 *
 *   // src/styles/styleN/display.ts
 *   import * as Fraunces from '@remotion/google-fonts/Fraunces';
 *   import {loadDisplayFont} from '../../shared/fonts';
 *   export const DISPLAY = loadDisplayFont(Fraunces, ['700']); // CSS font-family string
 *
 * Call it at module top level (not inside a component), with only the weights you use.
 * No marker-lettering faces (brand spec §7.2). The latin subset has no "≈" (U+2248): the kit draws ≈ as a vector.
 */
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadJetBrainsMono} from '@remotion/google-fonts/JetBrainsMono';

const sora = loadSora('normal', {weights: ['600', '700'], subsets: ['latin']});
const mono = loadJetBrainsMono('normal', {weights: ['500'], subsets: ['latin']});

/** Bare family names as registered with the browser. */
export const SANS_FAMILY: string = sora.fontFamily;
export const MONO_FAMILY: string = mono.fontFamily;

/** CSS font-family strings with fallbacks. Use these in style objects and SVG <text>. */
export const SANS = `"${SANS_FAMILY}", "Segoe UI", Arial, sans-serif`;
export const MONO = `"${MONO_FAMILY}", Consolas, "Courier New", monospace`;

/** JetBrains Mono advance width is 0.6 em, so mono text widths are exact: chars x size x 0.6. */
export const MONO_ADVANCE = 0.6;
export const monoWidth = (text: string, size: number): number => [...text].length * size * MONO_ADVANCE;

export const FONT = {
  sans: SANS,
  mono: MONO,
  sansFamily: SANS_FAMILY,
  monoFamily: MONO_FAMILY,
  /** Weights actually loaded. Using any other weight makes the browser synthesise it. */
  sansWeights: [600, 700] as const,
  monoWeights: [500] as const,
} as const;

/** Ready-made CSS for the brand text roles (sizes from brand.ts TYPE). */
export const TEXT = {
  label: {fontFamily: SANS, fontWeight: 600, fontSize: 44, lineHeight: 1.15},
  secondary: {fontFamily: MONO, fontWeight: 500, fontSize: 34, lineHeight: 1.15},
  pill: {fontFamily: SANS, fontWeight: 600, fontSize: 40, lineHeight: 1.15},
  header: {fontFamily: SANS, fontWeight: 600, fontSize: 34, lineHeight: 1.15, letterSpacing: '0.02em'},
  headerActive: {fontFamily: SANS, fontWeight: 600, fontSize: 44, lineHeight: 1.15, letterSpacing: '0.02em'},
  hero: {fontFamily: SANS, fontWeight: 700, fontSize: 96, lineHeight: 1.15},
  readout: {fontFamily: MONO, fontWeight: 500, fontSize: 64, lineHeight: 1.15},
  unit: {fontFamily: MONO, fontWeight: 500, fontSize: 38, lineHeight: 1.15},
  chip: {fontFamily: MONO, fontWeight: 500, fontSize: 30, lineHeight: 1.15},
} as const;

/** Minimal shape of an @remotion/google-fonts module (import * as Face from '@remotion/google-fonts/Face'). */
export interface GoogleFontModule {
  // The per-font option types differ; the kit only passes weights and the latin subset.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  loadFont: (style?: any, options?: any) => {fontFamily: string};
}

/**
 * Load one display face for hero words and return a CSS font-family string (with the kit sans as fallback).
 * Call at module top level, e.g. `export const DISPLAY = loadDisplayFont(Fraunces, ['700']);`.
 */
export const loadDisplayFont = (mod: GoogleFontModule, weights: string[] = ['700'], style: string = 'normal'): string => {
  const r = mod.loadFont(style, {weights, subsets: ['latin']});
  return `"${r.fontFamily}", ${SANS}`;
};
