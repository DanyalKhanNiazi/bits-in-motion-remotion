// S2 word clock: every timing in the section derives from these spoken words (absolute frames).
import {P, at} from '../../timing';

const s = (n: number, phrase: string, nth = 1) => at(n, phrase, nth).start;

export const T = {
  from: P(3).start,
  to: P(6).start,
  // P03
  click: s(3, 'click'),
  own: s(3, "On your PC's own drive"),
  pressing: s(3, 'pressing'),
  del: s(3, 'delete'),
  remove: s(3, 'remove anything'),
  moves: s(3, 'moves'),
  recycleBin: s(3, 'recycle bin'),
  binWord: s(3, 'bin'),
  holding: s(3, 'holding folder'),
  every: s(3, 'every byte'),
  intact: s(3, 'intact'),
  thats: s(3, "That's why"),
  restore: s(3, 'restore'),
  real: s(3, 'The real question'),
  empty: s(3, 'empty the bin'),
  skip: s(3, 'or skip'),
  shift: s(3, 'shift'),
  del2: s(3, 'delete', 2),
  // P04
  p4: P(4).start,
  picture: s(4, 'picture'),
  how: s(4, 'how Windows'),
  imagine: s(4, 'Imagine'),
  huge: s(4, 'huge'),
  wall: s(4, 'wall'),
  same: s(4, 'all the same size'),
  next: s(4, 'Next to it'),
  drawer: s(4, 'drawer'),
  boxesHold: s(4, 'boxes hold'),
  cardsSay: s(4, 'cards say'),
  whichBoxes: s(4, 'which boxes'),
  belong: s(4, 'belong'),
  // P05
  p5: P(5).start,
  whole: s(5, 'whole arrangement'),
  fileSystem: s(5, 'file system'),
  rules: s(5, 'rules'),
  organize: s(5, 'organize'),
  modern: s(5, 'modern Windows'),
  ntfs: s(5, 'NTFS'),
  boxesReal: s(5, 'The storage boxes are real'),
  realWord: s(5, 'real'),
  divides: s(5, 'divides'),
  equal: s(5, 'equal sized blocks'),
  clusters: s(5, 'clusters'),
  yourPhoto: s(5, 'Your photo'),
  oneBox: s(5, 'one box'),
  soIts: s(5, 'so its bytes'),
  spread: s(5, 'spread'),
  clusters2: s(5, 'clusters', 2),
};

// shot boundaries and section events (all derived from the words above)
const FLY = 18;
export const K = {
  flyDur: FLY,
  // A: Delete is pressed and NOTHING leaves ("doesn't remove anything"); on "moves" the photo slides to the bin and
  // lands on "bin" (a slow move, Bits attached)
  delAct: T.moves + 1,
  fly1: T.binWord - (T.moves + 1) - 1,
  landed: T.binWord,
  zt1: T.binWord + 5, // ZoomThrough: the bin on the monitor → the bin on the hardware stage ("a holding folder")
  // B → rewind (the only rewind: "restore") → the screen (the photo flies back to its row)
  rw1: T.thats + 3,
  rwCut: T.thats + 9,
  rw1Dur: T.restore + 12 - (T.thats + 3),
  restoreAct: T.thats + 9,
  // "The real question": delete again, the bin's "Empty Recycle Bin" menu, hover
  del3Press: T.real + 2,
  del3Act: T.real + 3,
  landed3: T.real + 4 + FLY,
  zt5: T.real + 4 + FLY - 4, // ZoomThrough into the bin again as the photo lands (the bin on the stage: its menu fits)
  emptyHover: T.empty - 8,
  // "or skip it": a whip back to the folder (the other path: the file is still in its row, the bin empty), Shift + Delete
  whip: T.skip,
  whipDur: 12,
  shiftDelAct: T.del2 + 1,
  // pull back, the opener, push into the screen
  opener: T.picture - 20,
  zt2: T.imagine - 18,
  // C → D → E
  zt3: T.boxesReal - 4,
  swap: T.divides,
  zt4: T.equal - 15,
  pourE: T.soIts + 27,
};
