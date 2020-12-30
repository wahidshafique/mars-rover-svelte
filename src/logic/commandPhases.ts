import { gridDimensions, rovers } from './stores';
import { get } from 'svelte/store';
import { rotateRover, moveRoverOneStep } from './controlRover';
import { getRoverAngle, getRoverDirection } from './roverDetails';
import type { Rover, CommandPhase, RoverDirection, GridDims } from './types';

const COMMAND_PHASES: Array<CommandPhase> = [
  {
    text: 'Enter one of: plateau:, {rover} land:, {rover} instruct:',
  },
  {
    qualifier: 'plateau:',
    regexTest: /^\d+(?:\s+\d+)$/,
    text: 'Enter the size of the plateau as: X Y ',
    commitFn: ([x, y]) => {
      gridDimensions.update(
        (): GridDims => ({
          width: parseInt(x, 10),
          height: parseInt(y, 10),
        })
      );
    },
    errorMsg: 'Invalid, try something like: plateau: 7 7',
  },
  {
    qualifier: 'land:',
    // only a string, followed by x y, and then cardinal dir are allowed
    regexTest: /^\w+(?:\s+\d+){2}\s[nesw]$/,
    text: 'Where the rover will land as: X Y Direction(nesw)',
    commitFn: ([name, x, y, dir]) => {
      const { width, height } = get(gridDimensions);
      const intX = parseInt(x, 10);
      const intY = parseInt(y, 10);
      if (intX > width - 1 || intX < 0 || intY < 0 || intY > height - 1) {
        throw new Error(`Please enter values below: ${width} ${height} `);
      }
      const randomHexColor = `#${Math.floor(Math.random() * 16777215).toString(
        16
      )}`;
      // update global rovers object with an object holding the rovers position
      rovers.update(
        (r): Array<Rover> => [
          ...r,
          {
            name,
            x: intX,
            y: intY,
            angle: getRoverAngle(dir as RoverDirection),
            color: randomHexColor,
          },
        ]
      );
    },
    errorMsg: 'Invalid, try something like: bobTheRover land: 2 2 n',
  },
  {
    qualifier: 'instruct:',
    regexTest: /^\w+\s+[lrm]+$/,
    text: 'Where to move the rover, one of only: l r m',
    commitFn: ([name, commandSequence]) => {
      //split commands into array
      const commandsArray = commandSequence.split('');
      // find the name in our rover data struct and update it
      rovers.update(
        (allRovers): Array<Rover> => {
          let foundRover = false;
          const newRovers = allRovers.map((rover) => {
            const tmpRover = { ...rover };
            if (tmpRover.name === name) {
              foundRover = true;
              //   bingo, we found a match, and the command will propagate to all rovers of same name
              commandsArray.reduce((acc, currCommand) => {
                if (currCommand === 'l' || currCommand === 'r') {
                  acc.angle = rotateRover(currCommand, acc.angle);
                } else if (currCommand === 'm') {
                  const { width, height } = get(gridDimensions);
                  const { newX, newY } = moveRoverOneStep(
                    getRoverDirection(acc.angle),
                    width,
                    height,
                    acc.x,
                    acc.y
                  );
                  acc.x = newX;
                  acc.y = newY;
                }
                return acc;
              }, tmpRover);
            }
            return tmpRover;
          });
          if (!foundRover) {
            throw new Error(`No rover by the name of "${name}"`);
          }
          return newRovers;
        }
      );
    },
    errorMsg: 'Invalid, try something like: instruct: mrml',
  },
];

export default COMMAND_PHASES;
