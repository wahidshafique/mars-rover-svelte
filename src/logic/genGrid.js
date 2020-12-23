import Tiles from '../assets';

const tileDecider = (x, y, gridWidth, gridHeight) => {
  let tile = Tiles.center;

  if (x === gridWidth - 1 && y === 0) {
    tile = Tiles.topRight;
  } else if (x === 0 && y === 0) {
    tile = Tiles.topLeft;
  } else if (y === gridHeight - 1 && x === 0) {
    tile = Tiles.bottomLeft;
  } else if (y === gridHeight - 1 && x === gridWidth - 1) {
    tile = Tiles.bottomRight;
  } else if (y === 0) {
    tile = Tiles.topCenter;
  } else if (x === 0) {
    tile = Tiles.left;
  } else if (x === gridWidth - 1) {
    tile = Tiles.right;
  } else if (y === gridHeight - 1) {
    tile = Tiles.bottomCenter;
  }
  return { url: tile };
};

const genGrid = (gridWidth, gridHeight, rovers) => {
  let tmpGrid = [];
  for (let y = 0; y < gridHeight; y++) {
    tmpGrid[y] = [];
    for (let x = 0; x < gridWidth; x++) {
      tmpGrid[y][x] = tileDecider(x, y, gridWidth, gridHeight);
      if (rovers.length > 0) {
        const roverAtPosition = rovers.find((r) => r.x === x && r.y === y);
        if (roverAtPosition) {
          tmpGrid[y][x].rover = { ...roverAtPosition };
        }
      }
    }
  }
  return tmpGrid;
};

export default genGrid;
