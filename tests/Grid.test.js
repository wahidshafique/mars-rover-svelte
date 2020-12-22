import { render } from '@testing-library/svelte';
import { gridDimensions } from '../src/logic/stores';
import Grid from '../src/components/Grid.svelte';

const gridGen = (dims) => {
  gridDimensions.update(() => dims);
  const { getByAltText } = render(Grid);
  // verify each grid cell has the correct position ala its alt-text
  for (let y = 0; y < dims.y; y++) {
    for (let x = 0; x < dims.x; x++) {
      expect(getByAltText(`tile-${x}-${y}`));
    }
  }
};

describe('App', () => {
  test('must match snapshot', () => {
    const { container } = render(Grid);

    expect(container).toMatchSnapshot();
  });

  test('must render a 2x2 grid', () => {
    const dims = {
      x: 2,
      y: 2,
    };
    gridGen(dims);
  });

  test('must render a 40x27 grid', () => {
    const dims = {
      x: 40,
      y: 27,
    };
    gridGen(dims);
  });

  test('must render a 0x0 grid', () => {
    const dims = {
      x: 0,
      y: 0,
    };
    gridGen(dims);
  });
});
