import { gridDimensions, rovers, grid } from '../logic/stores';
import { get } from 'svelte/store';
import { rotateRover } from './controlRover';
import getRoverOrientation from './getRoverOrientation';

const COMMAND_PHASES = [
  {
    text: 'Enter one of: plateau:, {rover} land:, {rover} instruct:',
  },
  {
    qualifier: 'plateau:',
    regexTest: /^\d+(?:\s+\d+)$/,
    text: 'Enter the size of the plateau as: X Y ',
    commitFn: ([x, y]) => {
      gridDimensions.update(() => ({
        width: x,
        height: y,
      }));
    },
    errorMsg: 'Invalid, try something like: plateau: 7 7',
  },
  {
    qualifier: 'land:',
    // only a string, followed by x y, and then cardinal dir are allowed
    regexTest: /^\w+(?:\s+\d+){2}\s[nesw]$/,
    text: 'Where the rover will land as: X Y Direction(nesw)',
    commitFn: ([name, x, y, dir]) => {
      // update global rovers object with an object holding the rovers position
      rovers.update((r) => [
        ...r,
        {
          name,
          x: parseInt(x, 10),
          y: parseInt(y, 10),
          orientation: getRoverOrientation(dir),
        },
      ]);
    },
    errorMsg: 'Invalid, try something like: bobTheRover land: 2 2 n',
  },
  {
    qualifier: 'instruct:',
    regexTest: /^\w+\s+[lrm]+$/,
    text: 'Where to move the rover, one of only: l r m',
    commitFn: ([name, commandSequence]) => {
      console.log('name', name);
      console.log('command', commandSequence);
      //split commands into array
      const commandsArray = commandSequence.split('');
      // find the name in our rover data struct and update it
      rovers.update((allRovers) => {
        let foundRover = false;
        const newRovers = allRovers.map((rover) => {
          const tmpRover = { ...rover };
          if (tmpRover.name === name) {
            foundRover = true;
            //   bingo, we found a match, and the command will propagate to all rovers of same name
            commandsArray.reduce((acc, currCommand) => {
              const currentOrientation = getRoverOrientation(acc.dir);
              if (currCommand === 'l' || currCommand === 'r') {
                acc.orientation = rotateRover(currCommand, currentOrientation);
              } else if (currCommand === 'm') {
                const { width, height } = get(gridDimensions);
                debugger;
                const { newX, newY } = moveRoverOneStep(
                  currentOrientation,
                  width,
                  height
                );
                acc.x = newX;
                acc.y = newY;
              }
            }, tmpRover);
          }
          return tmpRover;
        });
        if (!foundRover) {
          throw new Error(`No rover by the name of "${name}"`);
        }
        return newRovers;
      });
    },
    errorMsg: 'Invalid, try something like: instruct: mrml',
  },
];

export default COMMAND_PHASES;
