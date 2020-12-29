import { RoverAngle, RoverDirection, RoverOrientationsMap } from './types';

export const getRoverAngle = (direction: RoverDirection) => {
  return RoverOrientationsMap[direction];
};

export const getRoverDirection = (
  angle: RoverAngle | number
): RoverDirection => {
  return RoverOrientationsMap[angle.toString()];
};
