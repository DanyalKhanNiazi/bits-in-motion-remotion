/**
 * World model (ENGINE.md §4): parts, routes, channels, domains; scenes for recomposed plates.
 */
import type {EaseName, PartState} from '../tokens';
import type {AnchorRef, GroundName, Pt, ViewScope, WRect} from '../core/types';
import type {IconType} from './icons';

export interface PartSpec {
  /** 'cpu', 'chipset', 'psu', 'plug'… (no dots: anchors split "partId.port" at the first dot). */
  id: string;
  type: IconType;
  /** Top face, world px. */
  rect: WRect;
  /** Height class override (default: the icon's z). */
  z?: number;
  /** Parallax factor (default 1; room objects 0.9, matched to the deck at the reference shot). */
  depth?: number;
  /** Draw order (default: by z, then array order). */
  order?: number;
  /** Icon-specific props (blocks, rocker, holes, points…). */
  props?: Record<string, unknown>;
  /** Default 'off' (passive icons ignore it). */
  initial?: PartState;
  /** Ground under this part, for the label checks (the knockout redraws the real fills). */
  ground?: GroundName;
}

export interface RouteSpec {
  id: string;
  /** Orthogonal / 45° points, world px. */
  points: Pt[];
  /** Bend radius (default 8). */
  bend?: number;
  /** Segments that are cable (the lead) vs board trace: [startLen, endLen] in px along the path. */
  cable?: [number, number];
  /** Path length where the wire truly ends (S03 end tick). */
  endTickAt?: number;
  /** Not drawn until a 'draw' RouteEvent (S11 wake routes). */
  hidden?: boolean;
}

export interface ChannelSpec {
  id: string;
  /** Centreline from the SOURCE end to the LOAD end, world px. */
  points: Pt[];
  kind: 'main' | 'standby';
  initial: 'empty' | 'full';
}

/** A powered-domain wash shape. */
export interface DomainSpec {
  id: string;
  polygon: Pt[];
  /** Round 1: the domain as the union of rounded rects (world px) that follow its parts. With `blobs`, an 'over' wash is
   *  drawn soft-edged (judges: a hard polygon read as a UI selection box): the union at full wash opacity plus two
   *  stepped outer bands (WASH_SOFT), all with rounded corners; no blur, no gradient. */
  blobs?: Array<{x: number; y: number; w: number; h: number; r?: number}>;
  /** Round 2: world rects the 'over' wash leaves untinted (a lit part inside the domain keeps its own look: the lookout
   *  never "turns amber" when the domain is shown). */
  holes?: Array<{x: number; y: number; w: number; h: number; r?: number}>;
  /** Round 2: a 2 px dashed `energy` outline along `polygon`, so the powered region reads at a glance. */
  outline?: boolean;
}

export interface RegionSpec {
  ground: GroundName;
  rect?: WRect;
  polygon?: Pt[];
}

export interface WorldSpec {
  /** 'ep01-intel-atx' */
  id: string;
  /** Deep-circuit seed. */
  seed: string;
  /** Everything the camera may show. */
  bounds: WRect;
  parts: PartSpec[];
  routes: RouteSpec[];
  channels: ChannelSpec[];
  domains: DomainSpec[];
  /** Optional: grounds are derived from the parts (case → deck, board → board, parts → their material). */
  regions?: RegionSpec[];
  /** Proof of power (bible §7.7): while `subject` is visible and awake in scope 'world', `proof` must be visible above y 932. */
  proofOfPower?: {subject: AnchorRef; proof: AnchorRef};
}

/** A mini world for a recomposed plate (S06 stages, S09 stops). Same icons, local world px. */
export interface SceneSpec {
  id: string;
  bounds: WRect;
  parts: PartSpec[];
  routes?: RouteSpec[];
  channels?: ChannelSpec[];
  /** Optional domains (washes) in a scene. */
  domains?: DomainSpec[];
}

/** State changes (5-frame flips). `block` addresses a child block (chipset/amdPackage/ecChip). */
export interface StateEvent {
  part: string;
  block?: string;
  at: number;
  to: PartState;
  scope?: ViewScope;
}

/** Physical props over time: button press, plug seated, rocker, pointed outlines, opacity. */
export interface PropEvent {
  part: string;
  prop: 'press' | 'seated' | 'rocker' | 'pointed' | 'opacity' | string;
  at: number;
  dur: number;
  from: number | string;
  to: number | string;
  ease?: EaseName;
  scope?: ViewScope;
}

export type AnyWorld = WorldSpec | SceneSpec;
