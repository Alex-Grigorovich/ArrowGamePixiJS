import * as PIXI from "pixi.js";
import { Arrow } from "./Arrow";
import { GridManager } from "./GridManager";
import type { Direction, CellConfig } from "../types/types";
import type { TextureSet } from "../assets/loadAssets";
import { ChangeButtonUI } from "../ui/ChangeButtonUI";
import { LivesUI } from "../ui/LivesUI";

// 📐 Массив фигур (координаты активных ячеек)
const SHAPES: { row: number; col: number }[][] = [
  // 0: Квадрат (16)
  Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => ({ row: r, col: c }))).flat(),
  // 1: Прямоугольник (12)
  Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => ({ row: r, col: c }))).flat(),
  // 2: Треугольник (10)
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
  // 3: Ромб (8)
  [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }],
  // 4: Параллелограмм (8)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
  // 5: Трапеция (11)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 3 }, { row: 2, col: 0 }, { row: 2, col: 3 }, { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
  // 6: Пятиугольник (9)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 1 }],
  // 7: Шестиугольник (10)
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 1 }, { row: 3, col: 2 }]
];

// Базовая конфигурация 4x4 (цвета и направления для генерации)
const ORIGINAL_CONFIG = [
  [{ direction: "left" as Direction, color: "green" }, { direction: "down", color: "green" }, { direction: "right", color: "red" }, { direction: "up", color: "red" }],
  [{ direction: "left", color: "red" }, { direction: "down", color: "red" }, { direction: "down", color: "red" }, { direction: "up", color: "red" }],
  [{ direction: "up", color: "purple" }, { direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "up", color: "purple" }],
  [{ direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "right", color: "purple" }, { direction: "up", color: "purple" }]
];

export class GameApp {
  public gridManager: GridManager;
  public currentLevel = 1;
  public livesUI: LivesUI; // 👈 Сделали публичным, чтобы main мог читать жизни если нужно
  
  private app: PIXI.Application;
  private arrowsContainer: PIXI.Container;
  private dotsContainer: PIXI.Container;
  private arrows: Arrow[] = [];
  
  // 👈 Обновленный тип: теперь принимает рейтинг (число)
  private onWin: (rating: number) => void;
  private onScoreUpdate: (score: number) => void;
  private onGameOver: () => void;
  
  private changeButton: ChangeButtonUI;
  private isChangeModeActive = false;
  private textureSets: { std: TextureSet; orange: TextureSet; blue: TextureSet; green: TextureSet };
  private lastShapeIndex = -1;

  constructor(
    app: PIXI.Application,
    textureSets: { std: TextureSet; orange: TextureSet; blue: TextureSet; green: TextureSet },
    changeButton: ChangeButtonUI,
    livesUI: LivesUI,
    onScoreUpdate: (score: number) => void,
    onWin: (rating: number) => void, // 👈 Новый тип
    onGameOver: () => void
  ) {
    this.app = app;
    this.gridManager = new GridManager();
    this.textureSets = textureSets;
    this.changeButton = changeButton;
    this.livesUI = livesUI;
    this.onScoreUpdate = onScoreUpdate;
    this.onWin = onWin;
    this.onGameOver = onGameOver;

    this.arrowsContainer = new PIXI.Container();
    this.dotsContainer = new PIXI.Container();
    const gameContainer = new PIXI.Container();
    gameContainer.addChild(this.dotsContainer);
    gameContainer.addChild(this.arrowsContainer);
    this.app.stage.addChild(gameContainer);

    this.initGame();
  }

  private pickShape() {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * SHAPES.length);
    } while (idx === this.lastShapeIndex && SHAPES.length > 1);
    this.lastShapeIndex = idx;
    return SHAPES[idx];
  }

  private initGame() {
    const activeCells = this.pickShape();
    let cells = this.gridManager.generateRandomConfig(activeCells, ORIGINAL_CONFIG);
    cells = this.injectOppositeArrows(cells);

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
      arrow.on("pointerdown", () => this.handleArrowClick(arrow));
    }
  }

  private handleArrowClick(arrow: Arrow) {
    if (arrow.isFlying) return;
    if (this.isChangeModeActive) {
      this.changeArrowDirection(arrow);
      this.isChangeModeActive = false;
      this.app.stage.eventMode = "auto";
      return;
    }

    if (this.hasObstacle(arrow.row, arrow.col, arrow.direction)) {
      this.shakeArrow(arrow);
      const allLost = this.livesUI.loseLife();
      if (allLost) {
        setTimeout(() => this.onGameOver(), 300);
      }
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
        // 👈 Рассчитываем рейтинг на основе оставшихся жизней
        const rating = this.livesUI.getRemainingLives(); 
        setTimeout(() => this.onWin(rating), 100);
      }
    });
  }

  private changeArrowDirection(arrow: Arrow) {
    const opposite: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
    const newDirection = opposite[arrow.direction];
    const texSet = this.getTextureSet(arrow.color);
    arrow.setDirection(newDirection, texSet.normal[newDirection], texSet.bold[newDirection]);
    this.changeButton.useOne();
    this.blinkArrow(arrow);
  }

  private blinkArrow(arrow: Arrow) {
    const originalAlpha = arrow.alpha;
    let count = 0;
    const interval = setInterval(() => {
      arrow.alpha = arrow.alpha === 1 ? 0.5 : 1;
      count++;
      if (count >= 4) { clearInterval(interval); arrow.alpha = originalAlpha; }
    }, 100);
  }

  public activateChangeMode() {
    if (this.changeButton.getRemainingUses() > 0) {
      this.isChangeModeActive = true;
      this.app.stage.eventMode = "static";
      this.app.stage.cursor = "cell";
      this.arrows.forEach(a => { a.cursor = "pointer"; });
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
    const newCells = [...cells];
    let attempts = 0, pairsAdded = 0;
    while (pairsAdded < (Math.random() < 0.5 ? 1 : 2) && attempts < 50) {
      const randIdx = Math.floor(Math.random() * newCells.length);
      const cellA = newCells[randIdx];
      let neighbor: CellConfig | null = null;
      if (cellA.col + 1 < this.gridManager.gridSize) {
        neighbor = newCells.find(c => c.row === cellA.row && c.col === cellA.col + 1);
        if (neighbor) { cellA.direction = "right"; neighbor.direction = "left"; }
      } else if (cellA.row + 1 < this.gridManager.gridSize) {
        neighbor = newCells.find(c => c.row === cellA.row + 1 && c.col === cellA.col);
        if (neighbor) { cellA.direction = "down"; neighbor.direction = "up"; }
      }
      if (neighbor) pairsAdded++;
      attempts++;
    }
    return newCells;
  }

  private hasObstacle(startRow: number, startCol: number, dir: Direction): boolean {
    const delta = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[dir];
    let r = startRow + delta.y, c = startCol + delta.x;
    while (r >= 0 && r < this.gridManager.gridSize && c >= 0 && c < this.gridManager.gridSize) {
      if (this.arrows.some(a => a.row === r && a.col === c && !a.isFlying)) return true;
      r += delta.y; c += delta.x;
    }
    return false;
  }

  private shakeArrow(arrow: Arrow) {
    const origX = arrow.x;
    const steps = [5, -5, 5, -5];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps.length) { arrow.x = origX; clearInterval(interval); return; }
      arrow.x = origX + steps[i++];
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

  public resize(width: number, height: number, gameScale: number) {
    this.arrowsContainer.scale.set(gameScale);
    this.dotsContainer.scale.set(gameScale);
    this.arrowsContainer.position.set(width / 2, height / 2);
    this.dotsContainer.position.set(width / 2, height / 2);
  }

  public resetLevel() {
    this.currentLevel = 1;
    this.arrowsContainer.removeChildren();
    this.dotsContainer.removeChildren();
    this.arrows = [];
    this.isChangeModeActive = false;
    this.changeButton.reset();
    this.livesUI.reset();
    this.initGame();
  }

  public nextLevel() {
    this.currentLevel++;
    this.arrowsContainer.removeChildren();
    this.dotsContainer.removeChildren();
    this.arrows = [];
    this.isChangeModeActive = false;
    this.changeButton.reset();
    this.livesUI.reset();
    this.initGame();
  }
}