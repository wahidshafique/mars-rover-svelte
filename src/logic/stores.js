import { writable } from 'svelte/store';

export const grid = writable([[], []]);
export const gridDimensions = writable({
  width: 10,
  height: 10,
});
