import Tiles from '../assets';

const genGrid = (gridx, gridy, rovers) => {
  let tmpGrid = [];
  for (let y = 0; y < gridy; y++) {
    tmpGrid[y] = [];
    for (let x = 0; x < gridx; x++) {
      tmpGrid[y][x] = { url: Tiles.center };
      if (rovers.length > 0) {
        console.log('rovers', rovers);
        const roverAtPosition = rovers.find((r) => r.x === x && r.y === y);
        if (roverAtPosition) {
          tmpGrid[y][x].rover = { ...roverAtPosition };
        }
      }
    }
  }
  console.log(111, tmpGrid);
  return tmpGrid;
};

export default genGrid;
