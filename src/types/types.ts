import type { Sprite } from "pixi.js";

export type Direction = "up" | "down" | "left" | "right";

export interface ArrowData {
  sprite: Sprite;
  direction: Direction;
  color: string;
  row: number;
  col: number;
  isFlying: boolean;
}

export interface CellConfig {
  row: number;
  col: number;
  direction: Direction;
  originalColor: string;
  color?: string;
}
