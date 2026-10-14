/**
 * S2 text widths, measured once in the render browser (canvas measureText, Sora, after fonts load). Layout uses these
 * fixed numbers, so a frame captured before the font-ready re-render can never lay the words out differently.
 */
import {textWidth} from '../../kit';

const W: Record<string, number> = {
  "72|600|": 0,
  "72|600| ": 15.55,
  "72|600|Why": 163.3,
  "72|600|Why ": 178.85,
  "72|600|Why do": 278.06,
  "72|600|Why do ": 293.62,
  "72|600|Why do AI": 372.74,
  "72|600|Why do AI ": 388.3,
  "72|600|Why do AI answers": 694.37,
  "72|600|Why do AI answers ": 709.92,
  "72|600|Why do AI answers arrive": 921.53,
  "72|600|Why do AI answers arrive ": 937.08,
  "72|600|Why do AI answers arrive one": 1077.26,
  "72|600|Why do AI answers arrive one ": 1092.82,
  "72|600|Why do AI answers arrive one piece": 1299.74,
  "72|600|Why do AI answers arrive one piece ": 1315.3,
  "72|600|Why do AI answers arrive one piece at": 1388.66,
  "72|600|Why do AI answers arrive one piece at ": 1404.22,
  "72|600|Why do AI answers arrive one piece at a": 1446.55,
  "72|600|Why do AI answers arrive one piece at a ": 1462.1,
  "72|600|Why do AI answers arrive one piece at a time": 1631.59,
  "72|600|Why do AI answers arrive one piece at a time ": 1647.14,
  "72|600|Why do AI answers arrive one piece at a time?": 1670.76,
  "72|600|Why do AI answers arrive one piece at a time? ": 1686.31,
  "72|600|do": 99.22,
  "72|600|AI": 79.13,
  "72|600|answers": 306.07,
  "72|600|arrive": 211.61,
  "72|600|one": 140.18,
  "72|600|piece": 206.93,
  "72|600|at": 73.37,
  "72|600|a": 42.34,
  "72|600|time": 169.49,
  "72|600|?": 40.25,
  "112|600|Photosynthesis": 892.42,
  "112|600|Photos": 407.79,
  "112|600|ynthesis": 485.18,
  "112|600|Photo": 346.3,
  "112|600|s": 61.49,
  "76|700|English": 287.96,
  "76|600|Tokenizer": 375.59,
  "76|600|The fixed list": 493.62,
  "86|700|10 words": 401.45,
  "86|700|+ ?": 117.73,
  "110|700|numbers": 504.24,
};

/** Width of `text` at `size` px and `weight`: the measured value when known, else a live measurement. */
export const tw = (text: string, size: number, weight = 600): number => W[`${size}|${weight}|${text}`] ?? textWidth(text, size, weight);

/** The kit TokenTile width rule (signals.tileW), on the measured widths. */
export const tileWidth = (text: string, size: number, id?: string | number, idScale = 0.8): number =>
  Math.max(size * 1.3, tw(text.trim(), size, 600) + size * 0.95, id !== undefined ? String(id).length * size * idScale * 0.6 + size * 0.9 : 0);

/** The kit tileRowLayout rule (greedy wrap, centred lines, tileH × 1.55 apart), on the measured widths. */
export const rowLayout = (tokens: readonly string[], size: number, gap: number, ids: ReadonlyArray<string | number>, maxWidth: number, idScale = 0.8) => {
  const ws = tokens.map((t, i) => tileWidth(t, size, ids[i], idScale));
  const lines: number[][] = [];
  let cur: number[] = [];
  let curW = 0;
  ws.forEach((w, i) => {
    const add = (cur.length ? gap : 0) + w;
    if (cur.length && curW + add > maxWidth) {
      lines.push(cur);
      cur = [i];
      curW = w;
    } else {
      cur.push(i);
      curW += add;
    }
  });
  if (cur.length) lines.push(cur);
  const lh = size * 1.5 * 1.55;
  const xs: number[] = new Array(ws.length).fill(0);
  const ys: number[] = new Array(ws.length).fill(0);
  lines.forEach((ln, li) => {
    const total = ln.reduce((a, i) => a + ws[i], 0) + gap * (ln.length - 1);
    let cx = -total / 2;
    ln.forEach((i) => {
      xs[i] = cx + ws[i] / 2;
      ys[i] = (li - (lines.length - 1) / 2) * lh;
      cx += ws[i] + gap;
    });
  });
  return {ws, xs, ys};
};
