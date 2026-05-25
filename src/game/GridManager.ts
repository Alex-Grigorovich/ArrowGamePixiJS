import type { Direction, CellConfig } from "../types/types";

export class GridManager {
  public gridSize = 4;
  public tileSize = 80;
  public spacing = 10;
  public gameWidth: number;
  public gameHeight: number;

  constructor() {
    this.gameWidth = this.gridSize * (this.tileSize + this.spacing) - this.spacing;
    this.gameHeight = this.gridSize * (this.tileSize + this.spacing) - this.spacing;
  }

  public generateRandomConfig(originalConfig: { direction: Direction; color: string }[][]): CellConfig[] {
    const cells: CellConfig[] = [];
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        cells.push({
          row, col,
          direction: originalConfig[row][col].direction,
          originalColor: originalConfig[row][col].color,
        });
      }
    }
    // перемешиваем клетки
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // распределяем цвета
    const colorPool = this.buildColorPool();
    for (let i = 0; i < cells.length; i++) {
      cells[i].color = colorPool[i];
    }
    return cells;
  }

  private buildColorPool(): string[] {
    const colorCounts = { standard: 4, orange: 4, blue: 4, green: 4 };
    const pool: string[] = [];
    for (const [color, count] of Object.entries(colorCounts)) {
      for (let i = 0; i < count; i++) pool.push(color);
    }
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
  }

  public getCellPosition(row: number, col: number): { x: number; y: number } {
    const startX = -this.gameWidth / 2 + this.tileSize / 2;
    const startY = -this.gameHeight / 2 + this.tileSize / 2;
    return {
      x: startX + col * (this.tileSize + this.spacing),
      y: startY + row * (this.tileSize + this.spacing)
    };
  }

  public getBaseWidthForColor(color: string): number {
    const BASE_WIDTH = this.tileSize * 0.7;
    return color === "blue" ? BASE_WIDTH * 1.2 : BASE_WIDTH;
  }
}