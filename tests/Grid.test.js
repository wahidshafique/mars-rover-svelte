import { render } from '@testing-library/svelte';
import { gridDimensions } from '../src/logic/stores';
import Grid from '../src/components/Grid.svelte';

export const gridGen = (dims) => {
  gridDimensions.update(() => dims);
  const { getByAltText } = render(Grid);
  // verify each grid cell has the correct position ala its alt-text
  for (let y = 0; y < dims.height; y++) {
    for (let x = 0; x < dims.width; x++) {
      expect(getByAltText(`tile-${x}-${y}`));
    }
  }
};

describe('Grid', () => {
  test('must match snapshot', () => {
    const { container } = render(Grid);

    expect(container).toMatchSnapshot();
  });

  test('must render a 2x2 grid', () => {
    const dims = {
      width: 2,
      height: 2,
    };
    gridGen(dims);
  });

  test('must render a 40x27 grid', () => {
    const dims = {
      width: 40,
      height: 27,
    };
    gridGen(dims);
  });

  test('must render a 0x0 grid', () => {
    const dims = {
      width: 0,
      height: 0,
    };
    gridGen(dims);
  });
});
