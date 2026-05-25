import * as PIXI from "pixi.js";
import { Arrow } from "./Arrow";
import { GridManager } from "./GridManager";
import type { Direction, CellConfig } from "../types/types";
import type { TextureSet } from "../assets/loadAssets";
import { ChangeButtonUI } from "../ui/ChangeButtonUI";

export class GameApp {
  public gridManager: GridManager; // сделано публичным для доступа из main
  private app: PIXI.Application;
  private arrowsContainer: PIXI.Container;
  private dotsContainer: PIXI.Container;
  private arrows: Arrow[] = [];
  private onScoreUpdate: (score: number) => void;
  private onWin: () => void;

  private changeButton: ChangeButtonUI;
  private isChangeModeActive = false;
  private textureSets: { std: TextureSet; orange: TextureSet; blue: TextureSet; green: TextureSet };

  constructor(
    app: PIXI.Application,
    textureSets: { std: TextureSet; orange: TextureSet; blue: TextureSet; green: TextureSet },
    changeButton: ChangeButtonUI,
    onScoreUpdate: (score: number) => void,
    onWin: () => void
  ) {
    this.app = app;
    this.gridManager = new GridManager();
    this.textureSets = textureSets;
    this.changeButton = changeButton;
    this.onScoreUpdate = onScoreUpdate;
    this.onWin = onWin;

    this.arrowsContainer = new PIXI.Container();
    this.dotsContainer = new PIXI.Container();
    const gameContainer = new PIXI.Container();
    gameContainer.addChild(this.dotsContainer);
    gameContainer.addChild(this.arrowsContainer);
    this.app.stage.addChild(gameContainer);

    this.initGame();
  }

  private initGame() {
    const originalConfig = this.getOriginalConfig();
    let cells = this.gridManager.generateRandomConfig(originalConfig);
    // Добавляем 1-2 пары противоположных стрелок
    cells = this.injectOppositeArrows(cells);

    const directionsDelta = {
      up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
    };

    for (const cell of cells) {
      const { row, col, direction, color } = cell;
      const texSet = this.getTextureSet(color!);
      const normalTex = texSet.normal[direction];
      const boldTex = texSet.bold[direction];
      const pos = this.gridManager.getCellPosition(row, col);
      const baseWidth = this.gridManager.getBaseWidthForColor(color!);

      const arrow = new Arrow(normalTex, boldTex, direction, color!, row, col, pos.x, pos.y, baseWidth);
      this.arrows.push(arrow);
      this.arrowsContainer.addChild(arrow);

      // Обработчик клика – единая точка входа
      arrow.on("pointerdown", () => this.handleArrowClick(arrow));
    }
  }

  private handleArrowClick(arrow: Arrow) {
    if (arrow.isFlying) return;

    if (this.isChangeModeActive) {
      // Режим смены направления
      this.changeArrowDirection(arrow);
      this.isChangeModeActive = false;
      // Сбросить курсор (опционально)
      this.app.stage.eventMode = "auto";
      return;
    }

    // Обычный режим: полёт
    if (this.hasObstacle(arrow.row, arrow.col, arrow.direction)) {
      this.shakeArrow(arrow);
      return;
    }

    const delta = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[arrow.direction];
    this.createDot(arrow.x, arrow.y, arrow.color);
    arrow.fly(delta, () => {
      this.onScoreUpdate(1);
      this.arrowsContainer.removeChild(arrow);
      const idx = this.arrows.indexOf(arrow);
      if (idx !== -1) this.arrows.splice(idx, 1);
      if (this.arrows.length === 0) {
        setTimeout(() => this.onWin(), 100);
      }
    });
  }

  private changeArrowDirection(arrow: Arrow) {
  // Противоположные направления
  const opposite: Record<Direction, Direction> = {
    up: "down",
    down: "up",
    left: "right",
    right: "left"
  };
  const newDirection = opposite[arrow.direction];

  // Получаем текстуры для нового направления (из того же цветового набора)
  const texSet = this.getTextureSet(arrow.color);
  const newNormal = texSet.normal[newDirection];
  const newBold = texSet.bold[newDirection];

  arrow.setDirection(newDirection, newNormal, newBold);

  // Уменьшаем счётчик использований
  this.changeButton.useOne();

  // Визуальный отклик
  this.blinkArrow(arrow);
}

  private blinkArrow(arrow: Arrow) {
    const originalAlpha = arrow.alpha;
    let count = 0;
    const interval = setInterval(() => {
      arrow.alpha = arrow.alpha === 1 ? 0.5 : 1;
      count++;
      if (count >= 4) {
        clearInterval(interval);
        arrow.alpha = originalAlpha;
      }
    }, 100);
  }

  public activateChangeMode() {
    if (this.changeButton.getRemainingUses() > 0) {
      this.isChangeModeActive = true;
      // Визуальный фидбек: изменить курсор на всей сцене
      this.app.stage.eventMode = "static";
      this.app.stage.cursor = "cell";
      // Можно добавить подсветку всех стрелок
      this.arrows.forEach(arrow => {
        arrow.cursor = "pointer";
        // например, добавить обводку
      });
      // Через 5 секунд автоматически деактивировать, если не выбрана стрелка
      setTimeout(() => {
        if (this.isChangeModeActive) {
          this.isChangeModeActive = false;
          this.app.stage.eventMode = "auto";
          this.app.stage.cursor = "default";
        }
      }, 5000);
    }
  }

  private injectOppositeArrows(cells: CellConfig[]): CellConfig[] {
    const oppositePairs: [Direction, Direction][] = [
      ["left", "right"],
      ["right", "left"],
      ["up", "down"],
      ["down", "up"]
    ];
    // Выбираем случайное количество пар (1 или 2)
    const numPairs = Math.random() < 0.5 ? 1 : 2;
    // Создаём копию массива клеток, чтобы не повредить оригинал
    let newCells = [...cells];
    let attempts = 0;
    let pairsAdded = 0;

    while (pairsAdded < numPairs && attempts < 50) {
      // Выбираем две соседние клетки (по горизонтали или вертикали)
      const randIdx = Math.floor(Math.random() * newCells.length);
      const cellA = newCells[randIdx];
      // Ищем соседа справа или снизу
      let neighbor: CellConfig | null = null;
      if (cellA.col + 1 < this.gridManager.gridSize) {
        neighbor = newCells.find(c => c.row === cellA.row && c.col === cellA.col + 1);
        if (neighbor) {
          // Устанавливаем направления: левая стрелка вправо, правая влево
          cellA.direction = "right";
          neighbor.direction = "left";
        }
      } else if (cellA.row + 1 < this.gridManager.gridSize) {
        neighbor = newCells.find(c => c.row === cellA.row + 1 && c.col === cellA.col);
        if (neighbor) {
          cellA.direction = "down";
          neighbor.direction = "up";
        }
      }
      if (neighbor) {
        pairsAdded++;
      }
      attempts++;
    }
    return newCells;
  }

  private hasObstacle(startRow: number, startCol: number, dir: Direction): boolean {
    const delta = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[dir];
    let r = startRow + delta.y;
    let c = startCol + delta.x;
    while (r >= 0 && r < this.gridManager.gridSize && c >= 0 && c < this.gridManager.gridSize) {
      if (this.arrows.some(a => a.row === r && a.col === c && !a.isFlying)) return true;
      r += delta.y;
      c += delta.x;
    }
    return false;
  }

  private shakeArrow(arrow: Arrow) {
    const origX = arrow.x;
    const steps = [5, -5, 5, -5];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps.length) {
        arrow.x = origX;
        clearInterval(interval);
        return;
      }
      arrow.x = origX + steps[i];
      i++;
    }, 50);
  }

  private createDot(x: number, y: number, color: string) {
    const colorMap: Record<string, number> = { standard: 0xf87171, orange: 0xffa500, blue: 0x3b82f6, green: 0x22c55e };
    const dot = new PIXI.Graphics();
    dot.beginFill(colorMap[color] || 0xffffff);
    dot.drawCircle(0, 0, 8);
    dot.endFill();
    dot.position.set(x, y);
    this.dotsContainer.addChild(dot);
  }

  private getTextureSet(color: string) {
    if (color === "orange") return this.textureSets.orange;
    if (color === "blue") return this.textureSets.blue;
    if (color === "green") return this.textureSets.green;
    return this.textureSets.std;
  }

  private getOriginalConfig() {
    return [
      [{ direction: "left" as Direction, color: "green" }, { direction: "down", color: "green" }, { direction: "right", color: "red" }, { direction: "up", color: "red" }],
      [{ direction: "left", color: "red" }, { direction: "down", color: "red" }, { direction: "down", color: "red" }, { direction: "up", color: "red" }],
      [{ direction: "up", color: "purple" }, { direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "up", color: "purple" }],
      [{ direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "right", color: "purple" }, { direction: "up", color: "purple" }]
    ];
  }

  public resize(width: number, height: number, gameScale: number) {
    this.arrowsContainer.scale.set(gameScale);
    this.dotsContainer.scale.set(gameScale);
    this.arrowsContainer.position.set(width / 2, height / 2);
    this.dotsContainer.position.set(width / 2, height / 2);
  }

  // Добавить, если нужно сбросить игру (опционально)
  public reset() {
    // очистка контейнеров
    this.arrowsContainer.removeChildren();
    this.dotsContainer.removeChildren();
    this.arrows = [];
    this.isChangeModeActive = false;
    this.changeButton.reset();
    this.initGame();
  }
}