/**
 * Text metrics without a live font: Sora advance widths (units per 1000 em) at weights 600 and 700, measured from
 * the exact latin woff2 the kit loads (fonts.gstatic.com/s/sora/v17, wght axis 600/700) with FreeType. Kerning is not
 * applied (the browser's kerning differs by about ±1%; boxes carry the 10 px plate pad). JetBrains Mono is exact
 * (0.6 em). Deterministic: label boxes, knockouts and the budget checks never depend on when the font loaded.
 */
import {MONO_ADVANCE} from '../../shared/fonts';

const CHARS = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~·×’–—é…≈";
const W600 = [216, 310, 473, 712, 651, 877, 717, 266, 387, 387, 569, 594, 269, 507, 269, 386, 756, 425, 627, 626, 662, 637, 678, 596, 657, 678, 269, 269, 594, 590, 594, 559, 1126, 773, 688, 799, 785, 596, 560, 832, 801, 326, 642, 728, 553, 954, 867, 865, 658, 865, 720, 674, 610, 780, 729, 1062, 713, 655, 650, 387, 386, 387, 602, 585, 300, 588, 699, 610, 699, 620, 381, 683, 648, 325, 332, 617, 305, 978, 648, 679, 699, 699, 417, 549, 431, 639, 584, 897, 587, 562, 497, 387, 375, 387, 527, 269, 594, 261, 521, 909, 620, 839, 864];
const W700 = [210, 317, 495, 722, 651, 891, 731, 268, 393, 393, 570, 596, 273, 509, 273, 407, 763, 428, 632, 632, 672, 644, 687, 607, 667, 687, 273, 273, 596, 590, 596, 563, 1127, 782, 692, 800, 781, 594, 560, 833, 800, 332, 643, 752, 558, 971, 876, 864, 667, 864, 730, 667, 618, 776, 740, 1071, 722, 657, 647, 393, 407, 393, 617, 590, 300, 594, 703, 611, 703, 624, 382, 686, 652, 334, 339, 639, 315, 983, 652, 681, 703, 703, 421, 556, 434, 645, 597, 922, 601, 570, 502, 393, 376, 393, 543, 273, 596, 270, 526, 914, 624, 856, 867];

const IDX = new Map<string, number>([...CHARS].map((c, i) => [c, i]));

/** Width in px of one line of Sora text at `size` (weight 600 or 700), with optional tracking in em. */
export const textWidth = (text: string, size: number, weight: 600 | 700 = 600, trackingEm = 0): number => {
  const table = weight === 700 ? W700 : W600;
  let u = 0;
  let n = 0;
  for (const ch of text) {
    const i = IDX.get(ch);
    u += i === undefined ? 600 : table[i];
    n++;
  }
  return (u / 1000) * size + trackingEm * size * Math.max(0, n);
};

/** Width of a mono line (exact: 0.6 em per glyph). */
export const monoTextWidth = (text: string, size: number): number => [...text].length * size * MONO_ADVANCE;

/** Lines of a label ("\n" allowed, 2 lines max by the rules). */
export const linesOf = (text: string): string[] => text.split('\n');

/** The widest line. */
export const blockWidth = (text: string, size: number, weight: 600 | 700 = 600, trackingEm = 0): number =>
  Math.max(0, ...linesOf(text).map((l) => textWidth(l, size, weight, trackingEm)));

export const countLabelWords = (text: string): number => text.replace(/\n/g, ' ').trim().split(/\s+/).filter(Boolean).length;
