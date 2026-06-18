import * as PIXI from "pixi.js";
import { Arrow } from "./Arrow";
import { GridManager } from "./GridManager";
import type { Direction, CellConfig } from "../types/types";
import type { TextureSet } from "../assets/loadAssets";
import { ChangeButtonUI } from "../ui/ChangeButtonUI";
import { BombUI } from "../ui/BombUI";
import { TimerUI } from "../ui/TimerUI";
import { ParticleSystem } from "./ParticleSystem";
import { UpgradeManager } from "./Upgrades";

type ShapeCell = { row: number; col: number };
type ShapeDefinition = { id: string; difficulty: number; cells: ShapeCell[] };
type StarThresholdRule = {
  minLevel: number;
  maxLevel: number;
  threeStarsSec: number;
  twoStarsSec: number;
};

const rect = (
  rows: number,
  cols: number,
  rowOffset = 0,
  colOffset = 0,
): ShapeCell[] =>
  Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: rowOffset + r,
      col: colOffset + c,
    })),
  ).flat();

const SHAPES: ShapeDefinition[] = [
  // difficulty 1 (самые простые)
  { id: "mini-square", difficulty: 1, cells: rect(2, 2, 1, 1) },
  { id: "line-horizontal", difficulty: 1, cells: rect(1, 4, 1, 0) },
  { id: "line-vertical", difficulty: 1, cells: rect(4, 1, 0, 1) },
  {
    id: "corner-5",
    difficulty: 1,
    cells: [
      { row: 0, col: 0 },
      { row: 1, col: 0 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
  },
  {
    id: "zigzag-6",
    difficulty: 1,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
    ],
  },

  // difficulty 2 (простые)
  { id: "rect-2x3", difficulty: 2, cells: rect(2, 3, 1, 0) },
  { id: "rect-3x2", difficulty: 2, cells: rect(3, 2, 0, 1) },
  {
    id: "small-t",
    difficulty: 2,
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 3, col: 1 },
    ],
  },
  {
    id: "small-u",
    difficulty: 2,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
    ],
  },
  {
    id: "diag-step-7",
    difficulty: 2,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 3 },
    ],
  },

  // difficulty 3 (средние)
  { id: "square-3x3", difficulty: 3, cells: rect(3, 3, 0, 0) },
  {
    id: "plus-9",
    difficulty: 3,
    cells: [
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
      { row: 3, col: 1 },
      { row: 0, col: 2 },
    ],
  },
  {
    id: "thick-l-left",
    difficulty: 3,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ],
  },
  {
    id: "thick-l-right",
    difficulty: 3,
    cells: [
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ],
  },
  {
    id: "pyramid-up",
    difficulty: 3,
    cells: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
    ],
  },
  {
    id: "pyramid-down",
    difficulty: 3,
    cells: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
    ],
  },

  // difficulty 4 (сложные)
  {
    id: "thick-t",
    difficulty: 4,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
    ],
  },
  {
    id: "hexagon",
    difficulty: 4,
    cells: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
    ],
  },
  {
    id: "block-corner",
    difficulty: 4,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ],
  },
  {
    id: "spiral-12",
    difficulty: 4,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 3, col: 3 },
      { row: 3, col: 2 },
      { row: 3, col: 1 },
      { row: 3, col: 0 },
      { row: 2, col: 0 },
      { row: 1, col: 0 },
    ],
  },

  // difficulty 5 (очень сложные)
  {
    id: "trapezoid-bottom-wide",
    difficulty: 5,
    cells: [
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ],
  },
  {
    id: "trapezoid-top-wide",
    difficulty: 5,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
    ],
  },
  {
    id: "thick-stairs",
    difficulty: 5,
    cells: [
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
      { row: 3, col: 2 },
      { row: 3, col: 3 },
    ],
  },
  {
    id: "inverse-thick-l",
    difficulty: 5,
    cells: [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
      { row: 1, col: 0 },
      { row: 1, col: 1 },
      { row: 2, col: 0 },
      { row: 2, col: 1 },
      { row: 3, col: 0 },
      { row: 3, col: 1 },
    ],
  },

  // difficulty 6 (финальные)
  { id: "full-3x4", difficulty: 6, cells: rect(3, 4, 0, 0) },
  { id: "full-4x3", difficulty: 6, cells: rect(4, 3, 0, 0) },
  { id: "full-4x4", difficulty: 6, cells: rect(4, 4, 0, 0) },
];

const ORIGINAL_CONFIG: { direction: Direction; color: string }[][] = [
  [
    { direction: "left" as Direction, color: "green" },
    { direction: "down", color: "green" },
    { direction: "right", color: "red" },
    { direction: "up", color: "red" },
  ],
  [
    { direction: "left", color: "red" },
    { direction: "down", color: "red" },
    { direction: "down", color: "red" },
    { direction: "up", color: "red" },
  ],
  [
    { direction: "up", color: "purple" },
    { direction: "right", color: "purple" },
    { direction: "down", color: "purple" },
    { direction: "up", color: "purple" },
  ],
  [
    { direction: "right", color: "purple" },
    { direction: "down", color: "purple" },
    { direction: "right", color: "purple" },
    { direction: "up", color: "purple" },
  ],
];

// Пороговые значения времени для звезд по диапазонам уровней.
// Можно удобно балансить вручную, меняя только эту таблицу.
const STAR_THRESHOLDS_BY_LEVEL: StarThresholdRule[] = [
  { minLevel: 1, maxLevel: 2, threeStarsSec: 12, twoStarsSec: 22 },
  { minLevel: 3, maxLevel: 4, threeStarsSec: 15, twoStarsSec: 26 },
  { minLevel: 5, maxLevel: 6, threeStarsSec: 18, twoStarsSec: 30 },
  { minLevel: 7, maxLevel: 9, threeStarsSec: 22, twoStarsSec: 35 },
  { minLevel: 10, maxLevel: 12, threeStarsSec: 26, twoStarsSec: 41 },
  { minLevel: 13, maxLevel: 16, threeStarsSec: 30, twoStarsSec: 48 },
  {
    minLevel: 17,
    maxLevel: Number.MAX_SAFE_INTEGER,
    threeStarsSec: 36,
    twoStarsSec: 56,
  },
];

export type BonusTutorialInputState =
  | "free"
  | "change"
  | "change_select"
  | "bomb"
  | "bomb_select";

export interface GameAppBonusCallbacks {
  onChangeModeActivated?: () => void;
  onChangeUsed?: () => void;
  onBombModeActivated?: () => void;
  onBombUsed?: () => void;
  getTutorialInputState?: () => BonusTutorialInputState;
}

export class GameApp {
  public gridManager: GridManager;
  public currentLevel = 1;
  public timerUI: TimerUI;
  private particleSystem: ParticleSystem;
  private app: PIXI.Application;
  private arrowsContainer: PIXI.Container;
  private dotsContainer: PIXI.Container;
  private particlesLayer: PIXI.Container;
  private arrows: Arrow[] = [];
  private activeCells: { row: number; col: number }[] = []; // ✅ Храним форму уровня
  private onScoreUpdate: (score: number) => void;
  private onWin: (rating: number) => void;
  private onArrowAction?: () => void;
  private onChangeModeActivated?: () => void;
  private onChangeUsed?: () => void;
  private onBombModeActivated?: () => void;
  private onBombUsed?: () => void;
  private getTutorialInputStateFn?: () => BonusTutorialInputState;
  private changeButton: ChangeButtonUI;
  private bombButton: BombUI;
  private isChangeModeActive = false;
  private isBombModeActive = false;
  private textureSets: {
    std: TextureSet;
    orange: TextureSet;
    blue: TextureSet;
    green: TextureSet;
  };
  private lastShapeId: string | null = null;
  private isGameEnded = false;
  private isPaused = false;
  private gameScale = 1;
  private upgradeManager: UpgradeManager | null = null;

  constructor(
    app: PIXI.Application,
    textureSets: {
      std: TextureSet;
      orange: TextureSet;
      blue: TextureSet;
      green: TextureSet;
    },
    changeButton: ChangeButtonUI,
    bombButton: BombUI,
    timerUI: TimerUI,
    onScoreUpdate: (score: number) => void,
    onWin: (rating: number) => void,
    onArrowAction?: () => void,
    startLevel = 1,
    upgradeManager: UpgradeManager | null = null,
    bonusCallbacks: GameAppBonusCallbacks = {},
  ) {
    this.app = app;
    this.gridManager = new GridManager();
    this.textureSets = textureSets;
    this.changeButton = changeButton;
    this.bombButton = bombButton;
    this.timerUI = timerUI;
    this.onScoreUpdate = onScoreUpdate;
    this.onWin = onWin;
    this.onArrowAction = onArrowAction;
    this.onChangeModeActivated = bonusCallbacks.onChangeModeActivated;
    this.onChangeUsed = bonusCallbacks.onChangeUsed;
    this.onBombModeActivated = bonusCallbacks.onBombModeActivated;
    this.onBombUsed = bonusCallbacks.onBombUsed;
    this.getTutorialInputStateFn = bonusCallbacks.getTutorialInputState;
    this.currentLevel = Math.max(1, Math.floor(startLevel));
    this.upgradeManager = upgradeManager;

    this.arrowsContainer = new PIXI.Container();
    this.dotsContainer = new PIXI.Container();
    this.particlesLayer = new PIXI.Container();
    this.particleSystem = new ParticleSystem(
      this.particlesLayer,
      this.app.ticker,
    );

    const gameContainer = new PIXI.Container();
    gameContainer.addChild(this.dotsContainer);
    gameContainer.addChild(this.particlesLayer);
    gameContainer.addChild(this.arrowsContainer);
    this.app.stage.addChild(gameContainer);

    this.setupLevel();
  }

  private getShapeDifficultyRange(): { min: number; max: number } {
    if (this.currentLevel <= 2) return { min: 1, max: 2 };
    if (this.currentLevel <= 4) return { min: 1, max: 3 };
    if (this.currentLevel <= 6) return { min: 2, max: 3 };
    if (this.currentLevel <= 9) return { min: 2, max: 4 };
    if (this.currentLevel <= 12) return { min: 3, max: 5 };
    if (this.currentLevel <= 16) return { min: 4, max: 6 };
    return { min: 5, max: 6 };
  }

  // Выбор фигуры с гарантией: одна и та же фигура не идет 2 раза подряд.
  private pickShape(): ShapeCell[] {
    const range = this.getShapeDifficultyRange();

    let pool = SHAPES.filter(
      (shape) =>
        shape.difficulty >= range.min &&
        shape.difficulty <= range.max &&
        shape.id !== this.lastShapeId,
    );

    // Если после фильтрации выбор пустой, слегка расширяем окно сложности.
    if (pool.length === 0) {
      pool = SHAPES.filter(
        (shape) =>
          shape.difficulty >= Math.max(1, range.min - 1) &&
          shape.difficulty <= Math.min(6, range.max + 1) &&
          shape.id !== this.lastShapeId,
      );
    }

    // Защитный fallback (теоретически не должен сработать, но безопаснее оставить).
    if (pool.length === 0) {
      pool = SHAPES.filter((shape) => shape.id !== this.lastShapeId);
    }

    const picked = pool[Math.floor(Math.random() * pool.length)];
    this.lastShapeId = picked.id;
    return picked.cells;
  }

  private getBasePowerUpUses(): number {
    if (this.currentLevel <= 3) return 3;
    if (this.currentLevel <= 8) return 2;
    return 1; // На высоких уровнях только 1 шанс на ошибку
  }

  // ✅ ЛОГИКА СЛОЖНОСТИ: Скорость полета
  private getFlyDuration(): number {
    // Старт: 450мс. Минимум: 200мс. Уменьшается на 15мс за уровень.
    const base = 450;
    const decrease = (this.currentLevel - 1) * 15;
    return Math.max(200, base - decrease);
  }

  private setupLevel() {
    // ✅ Сохраняем активные клетки (форму)
    this.activeCells = this.pickShape();

    let cells = this.gridManager.generateRandomConfig(
      this.activeCells,
      ORIGINAL_CONFIG,
    );
    cells = this.injectOppositeArrows(cells);

    for (const cell of cells) {
      const { row, col, direction, color } = cell;
      const texSet = this.getTextureSet(color!);
      const normalTex = texSet.normal[direction];
      const boldTex = texSet.bold[direction];
      const pos = this.gridManager.getCellPosition(row, col);
      const baseWidth = this.gridManager.getBaseWidthForColor(color!);

      const arrow = new Arrow(
        normalTex,
        boldTex,
        direction,
        color!,
        row,
        col,
        pos.x,
        pos.y,
        baseWidth,
      );
      this.arrows.push(arrow);
      this.arrowsContainer.addChild(arrow);
      arrow.on("pointerdown", () =>
        this.handleArrowClick(arrow, this.getFlyDuration()),
      );
    }
  }

  public startLevel() {
    this.timerUI.start();
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.arrows.forEach((arrow) => {
      if (arrow.isFlying || arrow.isRemoving) return;
      arrow.eventMode = paused ? "none" : "static";
      arrow.cursor = paused ? "default" : "pointer";
    });
  }

  public getGameScale(): number {
    return this.gameScale;
  }

  public getTutorialArrowScreenPosition(): { x: number; y: number } | null {
    const arrow = this.pickTutorialArrow();
    if (!arrow) return null;
    return this.arrowsContainer.toGlobal({ x: arrow.x, y: arrow.y });
  }

  public getFieldArrowScreenPosition(): { x: number; y: number } | null {
    const arrow = this.arrows.find(
      (item) => !item.isFlying && !item.isRemoving,
    );
    if (!arrow) return null;
    return this.arrowsContainer.toGlobal({ x: arrow.x, y: arrow.y });
  }

  private pickTutorialArrow(): Arrow | null {
    const flyable = this.arrows.find(
      (arrow) => this.scanArrowPath(arrow).reachedEdge,
    );
    if (flyable) return flyable;

    const movable = this.arrows.find(
      (arrow) => this.scanArrowPath(arrow).freeSteps > 0,
    );
    if (movable) return movable;

    return this.arrows[0] ?? null;
  }

  private scanArrowPath(arrow: Arrow) {
    const delta = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    }[arrow.direction];
    let r = arrow.row + delta.y;
    let c = arrow.col + delta.x;
    let freeSteps = 0;
    let reachedEdge = false;

    while (true) {
      const inside =
        r >= 0 &&
        r < this.gridManager.gridSize &&
        c >= 0 &&
        c < this.gridManager.gridSize;
      if (!inside) {
        reachedEdge = true;
        break;
      }
      const occupied = this.arrows.find(
        (a) =>
          a !== arrow &&
          this.isArrowBlockingCell(a) &&
          a.row === r &&
          a.col === c,
      );
      if (occupied) break;
      freeSteps++;
      r += delta.y;
      c += delta.x;
    }

    return { delta, freeSteps, reachedEdge };
  }

  private getTutorialInputState(): BonusTutorialInputState {
    return this.getTutorialInputStateFn?.() ?? "free";
  }

  private shouldKeepBonusModeOpen(): boolean {
    const state = this.getTutorialInputState();
    return state === "change_select" || state === "bomb_select";
  }

  private handleArrowClick(arrow: Arrow, duration: number) {
    if (arrow.isFlying || arrow.isRemoving || this.isGameEnded || this.isPaused)
      return;

    const tutorialState = this.getTutorialInputState();
    // #region agent log
    fetch("http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "12c20f",
      },
      body: JSON.stringify({
        sessionId: "12c20f",
        runId: "pre-fix",
        hypothesisId: "H4",
        location: "src/game/GameApp.ts:handleArrowClick",
        message: "Arrow click received",
        data: {
          level: this.currentLevel,
          tutorialState,
          isBombModeActive: this.isBombModeActive,
          isChangeModeActive: this.isChangeModeActive,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (this.isBombModeActive) {
      if (tutorialState !== "free" && tutorialState !== "bomb_select") return;
      this.useBomb(arrow);
      this.isBombModeActive = false;
      this.app.stage.eventMode = "auto";
      this.app.stage.cursor = "default";
      this.arrows.forEach((a) => {
        if (!a.isFlying) a.cursor = "pointer";
      });
      return;
    }

    if (this.isChangeModeActive) {
      if (tutorialState !== "free" && tutorialState !== "change_select") return;
      this.changeArrowDirection(arrow);
      this.isChangeModeActive = false;
      this.app.stage.eventMode = "auto";
      this.onChangeUsed?.();
      return;
    }

    if (tutorialState !== "free") return;

    this.onArrowAction?.();

    const { delta, freeSteps, reachedEdge } = this.scanArrowPath(arrow);
    const stepSize = this.gridManager.tileSize + this.gridManager.spacing;

    // Свободный путь до края — стрелка уезжает за поле и очищается.
    if (reachedEdge) {
      this.createDot(arrow.x, arrow.y, arrow.color);
      const flyDistance = (freeSteps + 1) * stepSize;
      arrow.fly(
        delta,
        flyDistance,
        () => {
          this.animateArrowVanish(arrow, () => {
            this.onScoreUpdate(1);
            this.checkWin();
          });
        },
        duration,
      );
      return;
    }

    // Впереди препятствие вплотную — ход невозможен, стрелка дрожит.
    if (freeSteps === 0) {
      this.shakeArrow(arrow, arrow.direction);
      return;
    }

    // Иначе сдвигаем стрелку до последней свободной клетки перед препятствием.
    const newRow = arrow.row + delta.y * freeSteps;
    const newCol = arrow.col + delta.x * freeSteps;
    const slideDistance = freeSteps * stepSize;

    arrow.slide(
      delta,
      slideDistance,
      () => {
        arrow.row = newRow;
        arrow.col = newCol;
      },
      duration,
    );
  }

  private useBomb(arrow: Arrow) {
    this.onBombUsed?.();
    const neighbors = this.arrows.filter(
      (a) =>
        a !== arrow &&
        this.isArrowBlockingCell(a) &&
        Math.abs(a.row - arrow.row) + Math.abs(a.col - arrow.col) === 1,
    );
    const targetNeighbor = neighbors.length > 0 ? neighbors[0] : null;

    let removalsPending = targetNeighbor ? 2 : 1;
    const onRemoved = () => {
      removalsPending--;
      if (removalsPending <= 0) {
        this.checkWin();
      }
    };

    this.particleSystem.explode(
      arrow.x,
      arrow.y,
      this.getColorHex(arrow.color),
      1.5,
    );
    this.animateArrowVanish(arrow, onRemoved);

    if (targetNeighbor) {
      this.particleSystem.explode(
        targetNeighbor.x,
        targetNeighbor.y,
        this.getColorHex(targetNeighbor.color),
        1.5,
      );
      this.animateArrowVanish(targetNeighbor, onRemoved);
    }

    this.bombButton.useOne();
  }

  public activateBombMode() {
    if (this.isPaused) return;
    const tutorialState = this.getTutorialInputState();
    // #region agent log
    fetch("http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "12c20f",
      },
      body: JSON.stringify({
        sessionId: "12c20f",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "src/game/GameApp.ts:activateBombMode",
        message: "Activate bomb mode requested",
        data: {
          level: this.currentLevel,
          tutorialState,
          bombUses: this.bombButton.getRemainingUses(),
          isPaused: this.isPaused,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (tutorialState !== "free" && tutorialState !== "bomb") return;
    if (this.bombButton.getRemainingUses() > 0) {
      this.isBombModeActive = true;
      this.onBombModeActivated?.();
      this.app.stage.eventMode = "static";
      this.app.stage.cursor = "crosshair";
      this.arrows.forEach((a) => {
        if (!a.isFlying) {
          a.cursor = "pointer";
        }
      });

      if (!this.shouldKeepBonusModeOpen()) {
        setTimeout(() => {
          if (this.isBombModeActive) {
            this.isBombModeActive = false;
            this.app.stage.eventMode = "auto";
            this.app.stage.cursor = "default";
            this.arrows.forEach((a) => {
              if (!a.isFlying) a.cursor = "default";
            });
          }
        }, 5000);
      }
    }
  }

  private isArrowBlockingCell(arrow: Arrow): boolean {
    return !arrow.isFlying && !arrow.isRemoving;
  }

  private animateArrowVanish(arrow: Arrow, onComplete: () => void) {
    arrow.isRemoving = true;
    arrow.eventMode = "none";
    arrow.cursor = "default";
    const duration = 350;
    const startTime = performance.now();
    const startScale = arrow.scale.x;
    const startAlpha = arrow.alpha;
    const startRotation = arrow.rotation;
    const baseColor = this.getColorHex(arrow.color);

    const easeOutBack = (t: number): number => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    const tickHandler = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutBack(progress);

      arrow.scale.set(startScale * (1 - eased));
      arrow.alpha = startAlpha * (1 - progress);
      arrow.rotation = startRotation + eased * 0.3;

      if (progress >= 1) {
        this.app.ticker.remove(tickHandler);
        this.particleSystem.explode(arrow.x, arrow.y, baseColor, 1.0);
        arrow.alpha = 0;
        arrow.scale.set(0);
        this.removeArrow(arrow);
        onComplete();
      }
    };
    this.app.ticker.add(tickHandler);
  }

  private getColorHex(color: string): number {
    const map: Record<string, number> = {
      standard: 0xf87171,
      orange: 0xffa500,
      blue: 0x3b82f6,
      green: 0x22c55e,
      purple: 0x8b5cf6,
    };
    return map[color] || 0xffffff;
  }

  private checkWin() {
    if (this.isGameEnded) return;

    if (this.arrows.length === 0) {
      this.isGameEnded = true;
      const elapsedMs = this.timerUI.stop();
      const rating = this.getRatingByTime(elapsedMs);
      setTimeout(() => this.onWin(rating), 100);
    }
  }

  private getRatingByTime(elapsedMs: number): number {
    const elapsedSec = elapsedMs / 1000;
    const { threeStarsSec, twoStarsSec } = this.getStarThresholdsForLevel(
      this.currentLevel,
    );

    if (elapsedSec <= threeStarsSec) return 3;
    if (elapsedSec <= twoStarsSec) return 2;
    return 1;
  }

  private getStarThresholdsForLevel(level: number): {
    threeStarsSec: number;
    twoStarsSec: number;
  } {
    const rule = STAR_THRESHOLDS_BY_LEVEL.find(
      (item) => level >= item.minLevel && level <= item.maxLevel,
    );
    if (rule)
      return {
        threeStarsSec: rule.threeStarsSec,
        twoStarsSec: rule.twoStarsSec,
      };
    return { threeStarsSec: 36, twoStarsSec: 56 };
  }

  private removeArrow(arrow: Arrow) {
    if (arrow.parent) arrow.parent.removeChild(arrow);
    const idx = this.arrows.indexOf(arrow);
    if (idx !== -1) this.arrows.splice(idx, 1);
  }

  private changeArrowDirection(arrow: Arrow) {
    const opposite: Record<Direction, Direction> = {
      up: "down",
      down: "up",
      left: "right",
      right: "left",
    };
    const newDirection = opposite[arrow.direction];
    const texSet = this.getTextureSet(arrow.color);
    arrow.setDirection(
      newDirection,
      texSet.normal[newDirection],
      texSet.bold[newDirection],
    );
    this.changeButton.useOne();
    this.blinkArrow(arrow);
  }

  private shakeArrow(arrow: Arrow, direction: Direction) {
    const isVertical = direction === "up" || direction === "down";
    const orig = isVertical ? arrow.y : arrow.x;
    const steps = [5, -5, 5, -5];
    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps.length) {
        if (isVertical) arrow.y = orig;
        else arrow.x = orig;
        clearInterval(interval);
        return;
      }
      const offset = steps[i++];
      if (isVertical) arrow.y = orig + offset;
      else arrow.x = orig + offset;
    }, 50);
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
    if (this.isPaused) return;
    const tutorialState = this.getTutorialInputState();
    // #region agent log
    fetch("http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "12c20f",
      },
      body: JSON.stringify({
        sessionId: "12c20f",
        runId: "pre-fix",
        hypothesisId: "H5",
        location: "src/game/GameApp.ts:activateChangeMode",
        message: "Activate change mode requested",
        data: {
          level: this.currentLevel,
          tutorialState,
          changeUses: this.changeButton.getRemainingUses(),
          isPaused: this.isPaused,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (tutorialState !== "free" && tutorialState !== "change") return;
    if (this.changeButton.getRemainingUses() > 0) {
      this.isChangeModeActive = true;
      this.onChangeModeActivated?.();
      this.app.stage.eventMode = "static";
      this.app.stage.cursor = "cell";
      this.arrows.forEach((a) => {
        a.cursor = "pointer";
      });
      if (!this.shouldKeepBonusModeOpen()) {
        setTimeout(() => {
          if (this.isChangeModeActive) {
            this.isChangeModeActive = false;
            this.app.stage.eventMode = "auto";
            this.app.stage.cursor = "default";
          }
        }, 5000);
      }
    }
  }

  // ✅ ЛОГИКА СЛОЖНОСТИ: Препятствия
  // ✅ ЛОГИКА СЛОЖНОСТИ: Умные препятствия
  private injectOppositeArrows(cells: CellConfig[]): CellConfig[] {
    const newCells = [...cells];
    let pairsAdded = 0;
    let attempts = 0;

    // Более плавная прогрессия препятствий: ранние уровни почти без давления,
    // затем рост примерно раз в 3 уровня.
    let targetPairs = Math.min(7, Math.floor((this.currentLevel - 1) / 3));
    if (Math.random() < 0.35) targetPairs = Math.min(7, targetPairs + 1);
    if (this.currentLevel === 1) targetPairs = 0;
    if (this.currentLevel === 2 && Math.random() < 0.5) targetPairs = 0;

    // Перемешиваем индексы, чтобы препятствия не копились в одном углу (например, сверху слева)
    const indices = Array.from({ length: newCells.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (const randIdx of indices) {
      if (pairsAdded >= targetPairs) break;
      if (attempts > 100) break; // Защита от бесконечного цикла

      const cellA = newCells[randIdx];

      // Проверяем только реальных соседей внутри текущей фигуры (activeCells)
      const directions = [
        { dr: 0, dc: 1, dirA: "right" as Direction, dirB: "left" as Direction },
        { dr: 1, dc: 0, dirA: "down" as Direction, dirB: "up" as Direction },
      ];

      for (const { dr, dc, dirA, dirB } of directions) {
        const neighborCell = newCells.find(
          (c) => c.row === cellA.row + dr && c.col === cellA.col + dc,
        );

        if (neighborCell) {
          // ✅ КЛЮЧЕВОЕ УЛУЧШЕНИЕ: Создаем препятствие только если цвета РАЗНЫЕ.
          // Если цвета одинаковые, это не препятствие, а легкий матч, что снижает сложность.
          if (cellA.color !== neighborCell.color) {
            cellA.direction = dirA;
            neighborCell.direction = dirB;
            pairsAdded++;
            break; // Переходим к поиску следующей пары
          }
        }
      }
      attempts++;
    }
    return newCells;
  }

  private createDot(x: number, y: number, color: string) {
    const colorMap: Record<string, number> = {
      standard: 0xf87171,
      orange: 0xffa500,
      blue: 0x3b82f6,
      green: 0x22c55e,
    };
    const dot = new PIXI.Graphics();
    dot.fill(colorMap[color] || 0xffffff);
    dot.circle(0, 0, 8);
    dot.fill();
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
    if (!this.arrowsContainer || !this.dotsContainer || !this.particlesLayer)
      return;
    this.gameScale = gameScale;
    this.arrowsContainer.scale.set(gameScale);
    this.dotsContainer.scale.set(gameScale);
    this.particlesLayer.scale.set(gameScale);
    this.arrowsContainer.position.set(width / 2, height / 2);
    this.dotsContainer.position.set(width / 2, height / 2);
    this.particlesLayer.position.set(width / 2, height / 2);
  }

  private restartCurrentLevelState() {
    this.isGameEnded = false;
    this.timerUI.reset();
    this.particleSystem?.reset();
    this.arrowsContainer?.removeChildren();
    this.dotsContainer?.removeChildren();
    this.arrows = [];
    this.isChangeModeActive = false;
    this.isBombModeActive = false;

    const baseUses = this.getBasePowerUpUses();
    const bonus = this.upgradeManager?.getBonusBonus() ?? {
      change: 0,
      bomb: 0,
    };
    this.changeButton.reset(baseUses + bonus.change);
    this.bombButton.reset(baseUses + bonus.bomb);

    this.setupLevel();
    this.app.ticker.start();
  }

  public restartCurrentLevel() {
    this.restartCurrentLevelState();
  }

  public resetLevel() {
    this.currentLevel = 1;
    this.restartCurrentLevelState();
  }

  public nextLevel() {
    this.currentLevel++;
    this.restartCurrentLevelState();
  }
}
