/**
 * Living-field event and focus types (ENGINE.md §6).
 */
import type {AnchorRef, Pt} from '../core/types';

export type FieldEvent =
  /** Ring from the button (FIELD.grid.pressRing). `world` is a world point. */
  | {kind: 'press'; at: number; world: Pt}
  /** Pixel ripple (FIELD.grid.landRipple). `world` is a world point, or a SCREEN point when `space` is 'screen'
   *  (a landing on a plate row's rail). */
  | {kind: 'land'; at: number; world: Pt; space?: 'world' | 'screen'}
  /** Return to now: every dot dips and recovers. */
  | {kind: 'timeBreath'; at: number}
  | {kind: 'window'; at: number; state: 'contract' | 'expand'};

/** Optional overrides only: the focus track is DERIVED (§6.1). `to` ends the override (default at + 45). */
export interface FocusKey {
  at: number;
  target: AnchorRef | {bit: string} | {lens: string} | {screen: Pt};
  to?: number;
}
