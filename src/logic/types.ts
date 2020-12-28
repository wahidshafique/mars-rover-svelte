export interface Rover {
  x: number;
  y: number;
}

export interface GridDims {
  width: number;
  height: number;
}

export enum RoverOrientationsMap {
  n = 180,
  e = -90,
  w = 90,
  s = 0,
}

export type RoverDirection = keyof typeof RoverOrientationsMap;
export type RoverAngle = Record<RoverOrientationsMap, number>;
