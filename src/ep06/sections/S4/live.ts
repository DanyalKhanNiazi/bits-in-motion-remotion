// Live writes during "every write to that drive is a chance to lose it": ghost writes land on free boxes just ahead
// of the scanner's beam (coral ring, tally notch). Ghosts, so the Archive state stays HDD_RACE_LOST for the S5 join.
import {PHOTO, isOther} from '../../kit';
import {T} from './t';

const freeBox = (ids: number[]) => ids.find((id) => !isOther(id) && !PHOTO.includes(id)) ?? ids[0];
export const LIVE = [
  {at: T.every + 12, id: freeBox([97, 81, 113, 82])},
  {at: T.every + 52, id: freeBox([101, 85, 117, 102])},
];
