import type { Direction, CellConfig } from "../types/types";

export class GridManager {
  public gridSize = 4;
  public tileSize = 80;
  public spacing = 10;
  public gameWidth: number;
  public gameHeight: number;

  constructor() {
    this.gameWidth =
      this.gridSize * (this.tileSize + this.spacing) - this.spacing;
    this.gameHeight =
      this.gridSize * (this.tileSize + this.spacing) - this.spacing;
  }

  // 👇 Теперь принимает массив активных ячеек (фигуру) и базовую конфигурацию
  public generateRandomConfig(
    activeCells: { row: number; col: number }[],
    originalConfig: { direction: Direction; color: string }[][],
  ): CellConfig[] {
    const cells: CellConfig[] = activeCells.map((c) => {
      const base = originalConfig[c.row][c.col];
      return {
        ...c,
        direction: base.direction,
        originalColor: base.color,
      };
    });

    // Перемешиваем клетки
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    // Распределяем цвета и направления
    const colorPool = this.buildColorPool(cells.length);
    for (let i = 0; i < cells.length; i++) {
      cells[i].color = colorPool[i];
      cells[i].direction = originalConfig[cells[i].row][cells[i].col].direction;
    }

    return cells;
  }

  private buildColorPool(count: number): string[] {
    const colors = ["standard", "orange", "blue", "green"];
    const pool: string[] = [];
    while (pool.length < count) pool.push(...colors);
    // Перемешиваем
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  }

  public getCellPosition(row: number, col: number): { x: number; y: number } {
    const startX = -this.gameWidth / 2 + this.tileSize / 2;
    const startY = -this.gameHeight / 2 + this.tileSize / 2;
    return {
      x: startX + col * (this.tileSize + this.spacing),
      y: startY + row * (this.tileSize + this.spacing),
    };
  }

  public getBaseWidthForColor(color: string): number {
    const BASE_WIDTH = this.tileSize * 0.7;
    return color === "blue" ? BASE_WIDTH * 1.2 : BASE_WIDTH;
  }
}
