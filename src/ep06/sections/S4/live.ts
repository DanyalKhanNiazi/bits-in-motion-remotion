// The race schedule (the scanner copies the photo's boxes in order) and the live writes during "every write to that
// drive is a chance to lose it": ghost threats hover over still-lit boxes the scanner has not reached yet; the beam
// copies the box just in time and the write lands on the free box next door (coral ring, tally notch). Ghosts only,
// so the Archive state stays HDD_RACE_LOST for the S5 join.
import {isOther} from '../../kit';
import {T} from './t';

export const RACE_T0 = T.so + 14;
export const RACE_STEP = 14;
export const raceCopy = (i: number) => RACE_T0 + i * RACE_STEP;
const free = (ids: number[]) => ids.find((id) => !isOther(id)) ?? ids[0];
export const LIVE = [
  {appear: T.every - 2, land: raceCopy(6) + 4, target: 98, miss: 97},
  {appear: raceCopy(8) - 12, land: raceCopy(8) + 4, target: 100, miss: free([101, 84])},
];
