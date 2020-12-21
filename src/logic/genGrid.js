import Tiles from '../assets';

const genGrid = (gridHeight, gridWidth) => {
  let tmpGrid = [];
  for (let j = 0; j < gridHeight; j++) {
    tmpGrid[j] = new Array(gridWidth);
  }

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      tmpGrid[x][y] = { url: Tiles.center };
    }
  }
  return tmpGrid;
};

export default genGrid;
