import { gridDimensions, rovers } from '../logic/stores';

const COMMAND_PHASES = [
  {
    text: 'Enter one of: plateau:, {rover} land:, {rover} instruct:',
  },
  {
    qualifier: 'PLATEAU:',
    regexTest: /^\d+(?:\s+\d+)$/,
    text: 'Enter the size of the PLATEAU as: X Y ',
    commitFn: ([x, y]) => {
      console.log(x, y);
      gridDimensions.update(() => ({
        x,
        y,
      }));
    },
  },
  {
    qualifier: 'LAND:',
    regexTest: /^\w+(?:\s+\d+){2}$/,
    text: 'Where the rover will land as: X Y Direction',
    commitFn: ([name, x, y]) => {
      console.log(111, name, x, y);
      // update global rovers object with an object holding the rovers position
      rovers.update((r) => [
        ...r,
        {
          name,
          x: parseInt(x, 10),
          y: parseInt(y, 10),
        },
      ]);
    },
  },
];

export default COMMAND_PHASES;
