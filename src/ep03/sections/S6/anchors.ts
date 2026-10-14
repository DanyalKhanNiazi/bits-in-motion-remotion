/** S6 word anchors (absolute frames), all from the locked word clock. */
import {P, at} from '../../timing';

const s = (n: number, phrase: string, nth = 1) => at(n, phrase, nth).start;

export const A = {
  from: P(13).start, // 9507
  to: P(16).start, // 11907
  // P13
  experiment: s(13, 'experiment'), // 9521
  ifWriting: s(13, 'If writing'), // 9552
  waitingBridge: s(13, 'waiting on the bridge'), // 9586
  slowing: s(13, 'slowing'), // 9629
  shouldnt: s(13, "shouldn't"), // 9652
  researchers: s(13, 'Researchers'), // 9695
  bigOpen: s(13, 'big open models'), // 9719
  gpu8: s(13, '8 GPU'), // 9766
  packed: s(13, 'packed'), // 9813
  hold: s(13, 'hold'), // 9868
  then: s(13, 'Then'), // 9878
  capped: s(13, 'capped'), // 9910
  everyGpu: s(13, 'every GPU'), // 9918
  half: s(13, 'half power'), // 9955
  lessPower: s(13, 'less power'), // 9992
  slowerMath: s(13, 'slower math'), // 10021
  reading: s(13, 'Reading prompts'), // 10058
  slowed: s(13, 'slowed down'), // 10077
  substantially: s(13, 'substantially'), // 10101
  writing: s(13, 'Writing answers'), // 10142
  barely: s(13, 'barely'), // 10163
  changed: s(13, 'changed'), // 10177
  whenReads: s(13, 'When the model reads'), // 10208
  reads: s(13, 'reads'), // 10224
  crosses: s(13, 'crosses the bridge'), // 10280
  all: s(13, 'all of the'), // 10328
  mathBusy: s(13, 'the math stays busy'), // 10399
  whenWrites: s(13, 'When it writes'), // 10444
  writes: s(13, 'writes'), // 10454
  oneNew: s(13, 'one new token'), // 10506
  packedServer: s(13, 'a packed server'), // 10584
  holds: s(13, 'holds so many'), // 10624
  verdict: s(13, 'Writing was waiting'), // 10684
  wWas: s(13, 'was'), // 10708
  wWaiting: s(13, 'waiting on memory'), // 10716
  wOn: s(13, 'on memory'), // 10725
  memory: s(13, 'memory'), // 10731
  notMath: s(13, 'not math'), // 10754
  wMath: s(13, 'not math') + 6, // 10760 ("math.")
  // P14
  p14: P(14).start, // 10789
  bandwidth: s(14, 'bandwidthhow'), // 10845
  gigabytes: s(14, 'gigabytes'), // 10881
  crossBridge: s(14, 'cross that bridge'), // 10919
  matters: s(14, 'matters'), // 10954
  atLeast: s(14, 'at least'), // 10963
  itsMath: s(14, 'its math'), // 10999
  nvidia: s(14, "NVIDIA's"), // 11029
  rtx: s(14, 'RTX'), // 11046
  topGaming: s(14, 'top gaming card'), // 11100
  littleOver: s(14, 'a little over half'), // 11141
  h100: s(14, "H100's"), // 11178
  theory: s(14, 'In theory'), // 11228
  sameModel: s(14, 'the same model'), // 11251
  roughlyHalf: s(14, 'roughly half'), // 11293
  plenty: s(14, 'plenty'), // 11361
  home: s(14, 'home'), // 11401
  // P15
  p15: P(15).start, // 11420
  oneGpu: s(15, 'one GPU'), // 11458
  onePerson: s(15, 'one person'), // 11506
  outruns: s(15, 'outruns'), // 11528
  yourReading: s(15, 'your reading'), // 11552
  why: s(15, 'Why'), // 11565
  waiting: s(15, 'waiting'), // 11665
  three: s(15, 'three waits'), // 11699
  /** "before" sits inside the transcript token "felt—before" (11738–11770); its onset is ≈ 14 frames in. */
  before: s(15, 'feltbefore') + 14, // ≈11752
  asChat: s(15, 'as a chat'), // 11804
  whenBusy: s(15, 'when a service'), // 11858
  busyEnd: at(15, 'busy').end, // 11896
};

/** Cut points (absolute). */
export const CUT = {
  intoBridge: A.experiment + 23, // 9544 zoom through the dial
  intoServer: A.researchers - 9, // 9686 whip
  intoLanes: A.reading - 14, // 10044 whip
  intoReading: A.whenReads - 8, // 10200 zoom through the top lane
  intoWriting: A.whenWrites - 6, // 10438 whip
  intoVerdict: A.verdict - 1, // 10683 flash back to the split
  outVerdict: A.p14 - 3, // 10786 zoom through the writing lane into the bridge
  intoCard: A.nvidia - 13, // 11016 whip
  intoDesk: A.plenty - 15, // 11346 zoom through the lower pane
  intoDoors: A.three - 18, // 11681 zoom through the screen
};
