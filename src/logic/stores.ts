import { writable } from 'svelte/store';
import type { Rover, GridDims } from './types';

export const gridDimensions = writable<GridDims>({
  width: 16,
  height: 9,
});
// TODO: remove after
export const rovers = writable<Array<Rover>>([]);
