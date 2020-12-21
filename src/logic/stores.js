import { writable } from 'svelte/store';

export const grid = writable([[], []]);
export const gridDimensions = writable({
  x: 16,
  y: 9,
});
export const rovers = writable([]);
