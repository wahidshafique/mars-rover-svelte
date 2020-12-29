export interface Rover {
  x: number;
  y: number;
  name: string;
  angle: number;
}

export interface GridDims {
  width: number;
  height: number;
}

export interface CommandPhase {
  text: string;
  qualifier?: string;
  regexTest?: RegExp;
  commitFn?: (inputItems: Array<string>) => void;
  errorMsg?: string;
}

export enum RoverOrientationsMap {
  n = 180,
  e = -90,
  w = 90,
  s = 0,
}

export type RoverDirection = keyof typeof RoverOrientationsMap;
export type RoverAngle = Record<RoverOrientationsMap, number>;
