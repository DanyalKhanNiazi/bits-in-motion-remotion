/**
 * Ep01 shots (STORYBOARD.md §2): a world point held at the frame centre plus a zoom. `atlas` is the parallax
 * reference (room objects at 0.9 match the deck there).
 */
import type {Shot} from '../../../engine';

export const SHOTS: Record<string, Shot> = {
  /** Round 4, the hook (judges: round 2's tight hook showed a supply slab and an empty chipset window, no processor and
   *  no monitor, and cropped the socket): the real system at once, the thumbnail rhyme. The big dark processor upper
   *  left (276 px), the lit lookout below it (76 px, glowing), the button lower right (76 px), the black monitor at the
   *  right edge, the socket and the seated plug whole at the lower left; the supply ends 27 px above the "later"
   *  window's bottom rule (y 932). The signature birth on the cap carries the identity. */
  hook: {center: [995, 572], zoom: 1.06},
  /** Round 2's hook (kept as a reference): ×1.6 tighter than `open`, on the button and its lead. */
  hookTight: {center: [820, 770], zoom: 1.8},
  /** Round 1's f0 framing (kept as a reference): big dark CPU, lit lookout, button, the black monitor at the edge. */
  open: {center: [870, 590], zoom: 1.15},
  /** S01 after the carry; S02 with Lens #1. */
  openLean: {center: [830, 590], zoom: 1.18},
  /** S03: button, lead, header, PSU with its empty main channel, plug. */
  power: {center: [780, 720], zoom: 1.42},
  /** S04 arrival; S07a "hidden processor". */
  chip: {center: [640, 706], zoom: 1.8},
  /** S04 end, S05 with Lens #2, S06 backdrop. */
  board: {center: [900, 566], zoom: 1.1},
  /** S07b: "?", button, monitor and the sign-in card in one frame. */
  ask: {center: [980, 581], zoom: 1.15},
  /** The whole desktop: the parallax reference (room objects match the deck here). */
  atlas: {center: [1005, 525], zoom: 0.92},
  /** S09 (deviation): the whole desktop a little smaller and lower than `atlas`, so the scope line clears the header zone
   *  (at `atlas` it ran at y 145, into the "Intel desktop" chip's underline). Round 4 (judges: the scope's top-left
   *  bracket still ran into the chip's scope line): centre y 489 → 469, so the scope's corner brackets (on the case's own
   *  corners) start at y 237, 26 px under the 40 px scope line, and end at y 930, above the caption band. */
  desk: {center: [1005, 469], zoom: 0.85},
  /** S09 (round 1): a gentle push from `desk` on "Intel processor" (the widest framing no longer holds 2 s); the stops
   *  peel from here. */
  deskIntel: {center: [960, 515], zoom: 0.94},
  /** S10–S11: plug, rocker, PSU, standby path, lookout, LAN, button. */
  column: {center: [524, 760], zoom: 1.22},
  /** S10 (round 1): reached by a glide as the stops fly home, settled for "standby" (f1475): the plug, the power
   *  supply, the standby line and the lookout, with the board above them. Round 2: centre y 632 → 700, so the
   *  "Main rails: OFF" pill docks under the power supply (it sat on the button's trace and the header). */
  standby: {center: [716, 700], zoom: 1.22},
  /** Round 3 (judges: f1493–f1595 held still while "a small trickle" showed no flow): ×1.06 closer than `standby`,
   *  toward the supply-to-lookout path, reached by a slow push through the flow's sentence. */
  trickle: {center: [700, 704], zoom: 1.293},
  /** S11 (deviation, added): after the triptych folds, `column` leaves the left 38 % and the bottom third of the frame to
   *  the field for 4.8 s. This frames the powered domain, the three wake sources (network jack, clock, button) and the
   *  plug at ×1.4 (the lookout 101 px instead of 88), with the labels on the left. */
  wake: {center: [720, 680], zoom: 1.4},
  /** S12 carry target (reached after the intro). */
  dive: {center: [620, 730], zoom: 2},
};
