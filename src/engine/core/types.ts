/**
 * Core types shared by every engine module (ENGINE.md §1).
 * World px unless a name says screen ("S"); screen px are the 1920x1080 frame.
 */

export type Pt = readonly [number, number];
export type Vec = readonly [number, number];

/** A rectangle in WORLD px (the top face of a part, a region). */
export interface WRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
}

/** A rectangle in SCREEN px (plates, label boxes, viewports). */
export interface SRect {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
}

export type GroundName = 'void' | 'field' | 'deck' | 'board' | 'bodyLo' | 'body' | 'bodyHi';

/** "partId.port" (a port from the icon's ports()) or a literal world point. */
export type AnchorRef = `${string}.${string}` | Pt;

/** Which copy of the world a state, tag or Bit belongs to. */
export type ViewScope =
  | 'world' // the main view (present, or the flash-forward inside the window)
  | {plate: string} // a plate's own preview / variant states
  | {band: 'left' | 'right' | 'center'} // a triptych band (left/right what-ifs; centre = the present, round 1)
  | {lens: string} // a Lens (shares 'world' states unless overridden)
  | {row: string}; // a plate row's rail (screen space): the S06 chain Bit (§10.6)

/** A stable string for a scope: 'world', 'plate:p1', 'band:left', 'lens:L1', 'row:chain'. */
export const scopeKey = (s: ViewScope | undefined): string => {
  if (s === undefined || s === 'world') return 'world';
  if ('plate' in s) return `plate:${s.plate}`;
  if ('band' in s) return `band:${s.band}`;
  if ('lens' in s) return `lens:${s.lens}`;
  return `row:${s.row}`;
};

export const sameScope = (a: ViewScope | undefined, b: ViewScope | undefined): boolean => scopeKey(a) === scopeKey(b);

/**
 * Scopes that start from the world's truth and override it with their own events (plates, bands, Lenses).
 * A row is a screen-space rail and has no world of its own.
 */
export const inheritsWorld = (s: ViewScope | undefined): boolean => {
  if (s === undefined || s === 'world') return false;
  return !('row' in s);
};

export const isPt = (a: unknown): a is Pt =>
  Array.isArray(a) && a.length === 2 && typeof a[0] === 'number' && typeof a[1] === 'number';
