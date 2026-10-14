/**
 * Living Schematic (Style 3): theme and drawing constants.
 * The brand's cool light set only (THEMES.lightCool) with the Style 3 ink tint (#1B2A44, the brand limit).
 * Fills are mixes of brand tokens; no new hue is introduced.
 */
import {THEMES, mixColor, type Theme} from '../../shared';

export const T: Theme = {...THEMES.lightCool, ink: '#1B2A44'};

/** Fills (mixes of brand tokens: panel white and structure grey). */
export const FILL = {
  /** The motherboard plate and the PSU / front-panel bodies. */
  plate: T.panel,
  /** Board outline (a quiet structure tone). */
  plateEdge: mixColor(T.panel, T.structure, 0.42),
  /** Unlit package material (chips, sticks, connectors). */
  body: mixColor(T.panel, T.structure, 0.12),
  /** Darker unlit material (the CPU's heat spreader, connector shells): the "big dark CPU". */
  bodyDark: mixColor(T.panel, T.structure, 0.3),
  /** The CPU's heat spreader: the big dark (unlit) processor of the thumbnail rhyme. */
  cpuDark: mixColor(T.panel, T.structure, 0.46),
  /** Small printed details (chip packages on sticks). */
  detail: mixColor(T.panel, T.structure, 0.36),
  /** Drafting dot grid (structure at 12% on the ground). */
  grid: mixColor(T.surface, T.structure, 0.3),
  /** Monitor screen: black for the whole intro (ink). */
  screen: T.ink,
} as const;

/** Stroke weights (CAD rule: constant on screen at every zoom). */
export const W = {
  inactive: 3,
  active: 4,
  route: 4,
  thin: 2,
  hair: 1.5,
  cord: 6,
} as const;
