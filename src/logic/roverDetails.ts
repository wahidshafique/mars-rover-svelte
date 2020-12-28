import { RoverAngle, RoverDirection, RoverOrientationsMap } from './types';

export const getRoverAngle = (direction: RoverDirection) => {
  return RoverOrientationsMap[direction];
};

export const getRoverDirection = (angle: RoverAngle): RoverDirection => {
  return RoverOrientationsMap[angle.toString()];
};
