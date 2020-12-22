import { writable } from 'svelte/store';

export const grid = writable([[], []]);
export const gridDimensions = writable({
  width: 16,
  height: 9,
});
// TODO: remove after
export const rovers = writable([
  {
    name: 'bob',
    x: 4,
    y: 4,
    orientation: 0,
  },
]);
