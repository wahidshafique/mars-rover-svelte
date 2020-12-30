import type { RoverDirection } from './types';

export const rotateRover = (command: 'l' | 'r', currentAngle: number) => {
  if (command === 'l') {
    if (currentAngle <= -90) {
      return 180;
    }
    return currentAngle - 90;
  } else if (command === 'r') {
    if (currentAngle > 90) {
      return -90;
    }
    return currentAngle + 90;
  }
};

export const moveRoverOneStep = (
  currentDir: string | RoverDirection,
  gridWidth: number,
  gridHeight: number,
  roverX: number,
  roverY: number
) => {
  const directionMap = {
    n: { newX: roverX, newY: roverY - 1 },
    e: { newX: roverX + 1, newY: roverY },
    s: { newX: roverX, newY: roverY + 1 },
    w: { newX: roverX - 1, newY: roverY },
  };
  // based on our angle, move the rover accordingly
  const { newX, newY }: { newX: number; newY: number } = directionMap[
    currentDir
  ];

  if (newX > gridWidth - 1 || newX < 0 || newY > gridHeight - 1 || newY < 0) {
    console.log('cannot move any more in this direction ', roverX, roverY);
    // set it to what it already is
    return { newX: roverX, newY: roverY };
  }

  return { ...directionMap[currentDir] };
};
