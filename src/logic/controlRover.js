export const rotateRover = (command, currentOrientation) => {
  if (command === 'l') {
    if (currentOrientation <= -90) {
      return 180;
    }
    return currentOrientation - 90;
  } else if (command === 'r') {
    if (currentOrientation > 90) {
      return -90;
    }
    return currentOrientation + 90;
  }
};

export const moveRoverOneStep = (
  currentDir,
  gridWidth,
  gridHeight,
  roverX,
  roverY
) => {
  const directionMap = {
    n: { newX: roverX, newY: roverY - 1 },
    e: { newX: roverX + 1, newY: roverY },
    s: { newX: roverX, newY: roverY + 1 },
    w: { newX: roverX - 1, newY: roverY },
  };
  // based on our orientation, move the rover accordingly
  const { newX, newY } = directionMap[currentDir];

  if (newX > gridWidth - 1 || newX < 0 || newY > gridHeight - 1 || newY < 0) {
    console.log('cannot move any more in this direction ', roverX, roverY);
    // set it to what it already is
    return { newX: roverX, newY: roverY };
  }

  return { ...directionMap[currentDir] };
};
