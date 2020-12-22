import { render, fireEvent, waitFor } from '@testing-library/svelte';
import { gridDimensions } from '../src/logic/stores';
import App from '../src/App.svelte';

const roverGen = async (frame, name, x, y, d) => {
  const input = frame.getByLabelText('enter a command');
  const submit = frame.getByText('Send');
  fireEvent.input(input, {
    target: { value: `${name} land: ${x} ${y} ${d}` },
  });
  await fireEvent.click(submit);
  // find our test rover in what we expect to be the correct position
  const roverAlt = `${name}-${x}-${y}-${d}`;
  await waitFor(() => {
    expect(frame.getByTitle(roverAlt));
  });
};

const moveRover = async (
  frame,
  name,
  commands,
  expectedX,
  expectedY,
  expectedD
) => {
  const input = frame.getByLabelText('enter a command');
  const submit = frame.getByText('Send');
  fireEvent.input(input, {
    target: { value: `${name} instruct: ${commands}` },
  });
  await fireEvent.click(submit);
  const roverAlt = `${name}-${expectedX}-${expectedY}-${expectedD}`;
  await waitFor(() => {
    expect(frame.getByTitle(roverAlt));
  });
};

// to see if rover ends up in the right spot
describe('Rover Control', () => {
  test('Instantiate a rover at 5 0 s on a 16x9 grid, and move to 5 2 s ', async () => {
    const dims = {
      width: 16,
      height: 9,
    };
    await gridDimensions.update(() => dims);
    const frame = render(App);
    await roverGen(frame, 'testrover1', 5, 0, 's');
    await moveRover(frame, 'testrover1', 'lmlmlmlmm', 5, 2, 's');
  });

  test('Instantiate a rover at 7 14 e on a 20x20 grid, and move to 5 1 ', async () => {
    const dims = {
      width: 20,
      height: 20,
    };
    await gridDimensions.update(() => dims);
    const frame = render(App);
    await roverGen(frame, 'testrover2', 7, 14, 'e');
    await moveRover(frame, 'testrover2', 'mmrmmrmrrm', 9, 16, 'e');
  });

  test('Instantiate a rover at 0 0 w on a 5x5 grid, and move to 4 4', async () => {
    const dims = {
      width: 5,
      height: 5,
    };
    await gridDimensions.update(() => dims);
    const frame = render(App);
    await roverGen(frame, 'testrover3', 0, 0, 'w');
    await moveRover(frame, 'testrover3', 'lmmlmmrmmlmm', 4, 4, 'e');
  });
});
