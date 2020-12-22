import { gridDimensions, rovers } from '../logic/stores';

const COMMAND_PHASES = [
  {
    text: 'Enter one of: plateau:, {rover} land:, {rover} instruct:',
  },
  {
    qualifier: 'plateau:',
    regexTest: /^\d+(?:\s+\d+)$/,
    text: 'Enter the size of the plateau as: X Y ',
    commitFn: ([x, y]) => {
      console.log(x, y);
      gridDimensions.update(() => ({
        x,
        y,
      }));
    },
  },
  {
    qualifier: 'land:',
    regexTest: /^\w+(?:\s+\d+){2}$/,
    text: 'Where the rover will land as: X Y Direction',
    commitFn: ([name, x, y]) => {
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
