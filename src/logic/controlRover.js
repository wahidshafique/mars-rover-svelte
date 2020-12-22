// const moveRover = ({commands, gridWidth, gridHeight, roverX, roverY, roverOrientation}) => {

// };

export const rotateRover = (command, currentOrientation) => {
  if (command === 'l') {
    return currentOrientation - 90;
  } else if (command === 'r') {
    return currentOrientation + 90;
  }
};

export const moveRoverOneStep = (currentOrientation, gridWidth, gridHeight) => {
  // based on our orientation, move the rover accordingly
};

// export default moveRover;
