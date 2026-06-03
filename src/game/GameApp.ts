import * as PIXI from "pixi.js";
import { Arrow } from "./Arrow";
import { GridManager } from "./GridManager";
import type { Direction, CellConfig } from "../types/types";
import type { TextureSet } from "../assets/loadAssets";
import { ChangeButtonUI } from "../ui/ChangeButtonUI";
import { BombUI } from "../ui/BombUI";
import { LivesUI } from "../ui/LivesUI";
import { ParticleSystem } from "./ParticleSystem";

const SHAPES: { row: number; col: number }[][] = [
  Array.from({ length: 4 }, (_, r) => Array.from({ length: 4 }, (_, c) => ({ row: r, col: c }))).flat(),
  Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => ({ row: r, col: c }))).flat(),
  [{ row: 0, col: 0 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
  [{ row: 0, col: 1 }, { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 3 }, { row: 2, col: 0 }, { row: 2, col: 3 }, { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 1 }],
  [{ row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 1, col: 0 }, { row: 1, col: 2 }, { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 3, col: 1 }, { row: 3, col: 2 }]
];

const ORIGINAL_CONFIG = [
  [{ direction: "left" as Direction, color: "green" }, { direction: "down", color: "green" }, { direction: "right", color: "red" }, { direction: "up", color: "red" }],
  [{ direction: "left", color: "red" }, { direction: "down", color: "red" }, { direction: "down", color: "red" }, { direction: "up", color: "red" }],
  [{ direction: "up", color: "purple" }, { direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "up", color: "purple" }],
  [{ direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "right", color: "purple" }, { direction: "up", color: "purple" }]
];

export class GameApp {
  public gridManager: GridManager;
  public currentLevel = 1;
  public livesUI: LivesUI;
  private particleSystem: ParticleSystem;
  private app: PIXI.Application;
  private arrowsContainer: PIXI.Container;
  private dotsContainer: PIXI.Container;
  private particlesLayer: PIXI.Container;
  private comboContainer: PIXI.Container;
  private arrows: Arrow[] = [];
  private onScoreUpdate: (score: number) => void;
  private onWin: (rating: number) => void;
  private onGameOver: () => void;
  private changeButton: ChangeButtonUI;
  private bombButton: BombUI;
  private isChangeModeActive = false;
  private isBombModeActive = false;
  private textureSets: { std: TextureSet; orange: TextureSet; blue: TextureSet; green: TextureSet };
  private lastShapeIndex = -1;
  private comboTextures: { blue: PIXI.Texture; green: PIXI.Texture; yellow: PIXI.Texture };

  constructor(
    app: PIXI.Application,
    textureSets: { std: TextureSet; orange: TextureSet; blue: TextureSet; green: TextureSet },
    changeButton: ChangeButtonUI,
    bombButton: BombUI,
    livesUI: LivesUI,
    onScoreUpdate: (score: number) => void,
    onWin: (rating: number) => void,
    onGameOver: () => void,
    comboTextures: { blue: PIXI.Texture; green: PIXI.Texture; yellow: PIXI.Texture }
  ) {
    this.app = app;
    this.gridManager = new GridManager();
    this.textureSets = textureSets;
    this.changeButton = changeButton;
    this.bombButton = bombButton;
    this.livesUI = livesUI;
    this.onScoreUpdate = onScoreUpdate;
    this.onWin = onWin;
    this.onGameOver = onGameOver;
    this.comboTextures = comboTextures;

    this.arrowsContainer = new PIXI.Container();
    this.dotsContainer = new PIXI.Container();
    this.particlesLayer = new PIXI.Container();
    this.particleSystem = new ParticleSystem(this.particlesLayer, this.app.ticker);

    const gameContainer = new PIXI.Container();
    gameContainer.addChild(this.dotsContainer);
    gameContainer.addChild(this.particlesLayer);
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

    if (this.isBombModeActive) {
      this.useBomb(arrow);
      this.isBombModeActive = false;
      this.app.stage.eventMode = "auto";
      this.app.stage.cursor = "default";
      this.arrows.forEach(a => { if (!a.isFlying) a.cursor = "pointer"; });
      return;
    }

    if (this.isChangeModeActive) {
      this.changeArrowDirection(arrow);
      this.isChangeModeActive = false;
      this.app.stage.eventMode = "auto";
      return;
    }

    const delta = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } }[arrow.direction];
    const arrowsToClear: Arrow[] = [];
    let r = arrow.row + delta.y;
    let c = arrow.col + delta.x;
    let hitObstacle = false;

    while (r >= 0 && r < this.gridManager.gridSize && c >= 0 && c < this.gridManager.gridSize) {
      const target = this.arrows.find(a => a.row === r && a.col === c && !a.isFlying && a !== arrow);
      if (target) {
        if (target.direction === arrow.direction) {
          arrowsToClear.push(target);
        } else {
          hitObstacle = true;
          break;
        }
      }
      r += delta.y;
      c += delta.x;
    }

    const stepSize = this.gridManager.tileSize + this.gridManager.spacing;
    if (hitObstacle) {
      this.shakeArrow(arrow);
      if (this.livesUI) {
        const allLost = this.livesUI.loseLife();
        if (allLost) setTimeout(() => this.onGameOver(), 300);
      }
      return;
    }

    const flyDistance = arrowsToClear.length > 0 ? arrowsToClear.length * stepSize : stepSize;
    this.createDot(arrow.x, arrow.y, arrow.color);

    if (arrowsToClear.length > 0) {
      this.showCombo(arrow.x, arrow.y, 1 + arrowsToClear.length);
    }

    arrow.fly(delta, flyDistance, () => {
      let pendingRemovals = 1 + arrowsToClear.length;
      const onAllRemoved = () => {
        pendingRemovals--;
        if (pendingRemovals === 0) {
          this.onScoreUpdate(1 + arrowsToClear.length);
          this.checkWin();
        }
      };
      this.animateArrowVanish(arrow, onAllRemoved);
      arrowsToClear.forEach(target => {
        this.createDot(target.x, target.y, target.color);
        this.animateArrowVanish(target, onAllRemoved);
      });
    });
  }

  private useBomb(arrow: Arrow) {
    const neighbors = this.arrows.filter(a => 
      a !== arrow && 
      !a.isFlying &&
      (Math.abs(a.row - arrow.row) + Math.abs(a.col - arrow.col) === 1)
    );

    const targetNeighbor = neighbors.length > 0 ? neighbors[0] : null;

    let removalsPending = targetNeighbor ? 2 : 1;
    const onRemoved = () => {
      removalsPending--;
      if (removalsPending <= 0) {
        this.checkWin();
      }
    };

    this.particleSystem.explode(arrow.x, arrow.y, this.getColorHex(arrow.color), 1.5);
    this.animateArrowVanish(arrow, onRemoved);

    if (targetNeighbor) {
      this.particleSystem.explode(targetNeighbor.x, targetNeighbor.y, this.getColorHex(targetNeighbor.color), 1.5);
      this.animateArrowVanish(targetNeighbor, onRemoved);
    }

    this.bombButton.useOne();
  }

  public activateBombMode() {
    if (this.bombButton.getRemainingUses() > 0) {
      this.isBombModeActive = true;
      this.app.stage.eventMode = "static";
      this.app.stage.cursor = "crosshair";
      
      this.arrows.forEach(a => { 
        if (!a.isFlying) {
          a.cursor = "pointer"; 
        }
      });

      setTimeout(() => {
        if (this.isBombModeActive) {
          this.isBombModeActive = false;
          this.app.stage.eventMode = "auto";
          this.app.stage.cursor = "default";
          this.arrows.forEach(a => { if (!a.isFlying) a.cursor = "default"; });
        }
      }, 5000);
    }
  }

  private showCombo(x: number, y: number, count: number) {
    if (count < 2) return;
    let tex = this.comboTextures.yellow;
    if (count === 3) tex = this.comboTextures.green;
    if (count >= 4) tex = this.comboTextures.blue;
    const sprite = new PIXI.Sprite(tex);
    sprite.anchor.set(0.5);
    sprite.position.set(x, y - 40);
    sprite.scale.set(0.2);
    sprite.alpha = 0;
    this.arrowsContainer.addChild(sprite);

    const scaleDuration = 200;
    const scaleStart = performance.now();
    const animateScale = (now: number) => {
      const elapsed = now - scaleStart;
      const progress = Math.min(elapsed / scaleDuration, 1);
      const c1 = 1.70158;
      const c3 = c1 + 1;
      const ease = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);

      sprite.scale.set(ease);
      sprite.alpha = progress;

      if (progress < 1) requestAnimationFrame(animateScale);
    };
    requestAnimationFrame(animateScale);

    setTimeout(() => {
      if (!sprite.parent) return;
      const fadeStart = performance.now();
      const fadeDuration = 150;
      const animateFade = (now: number) => {
        const elapsed = now - fadeStart;
        const p = Math.min(elapsed / fadeDuration, 1);
        sprite.alpha = 1 - p;
        if (p < 1) requestAnimationFrame(animateFade);
        else {
          sprite.parent?.removeChild(sprite);
          sprite.destroy();
        }
      };
      requestAnimationFrame(animateFade);
    }, 350);
  }

  private animateArrowVanish(arrow: Arrow, onComplete: () => void) {
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

        this.particleSystem.explode(
          arrow.x,
          arrow.y,
          baseColor,
          1.0
        );

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
      standard: 0xf87171, orange: 0xffa500, blue: 0x3b82f6, green: 0x22c55e, purple: 0x8b5cf6
    };
    return map[color] || 0xffffff;
  }

  private checkWin() {
    if (this.arrows.length === 0) {
      const rating = this.livesUI ? this.livesUI.getRemainingLives() : 3;
      setTimeout(() => this.onWin(rating), 100);
    }
  }

  private removeArrow(arrow: Arrow) {
    if (arrow.parent) arrow.parent.removeChild(arrow);
    const idx = this.arrows.indexOf(arrow);
    if (idx !== -1) this.arrows.splice(idx, 1);
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

  private createDot(x: number, y: number, color: string) {
    const colorMap: Record<string, number> = {
      standard: 0xf87171,
      orange: 0xffa500,
      blue: 0x3b82f6,
      green: 0x22c55e
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
    if (!this.arrowsContainer || !this.dotsContainer || !this.particlesLayer) return;
    this.arrowsContainer.scale.set(gameScale);
    this.dotsContainer.scale.set(gameScale);
    this.particlesLayer.scale.set(gameScale);
    this.arrowsContainer.position.set(width / 2, height / 2);
    this.dotsContainer.position.set(width / 2, height / 2);
    this.particlesLayer.position.set(width / 2, height / 2);
  }

  public resetLevel() {
    this.currentLevel = 1;
    this.particleSystem?.reset();
    this.arrowsContainer?.removeChildren();
    this.dotsContainer?.removeChildren();
    this.arrows = [];
    this.isChangeModeActive = false;
    this.isBombModeActive = false;
    this.changeButton.reset();
    this.bombButton.reset(3);
    if (this.livesUI) this.livesUI.reset();
    this.initGame();
    this.app.ticker.start();
  }

  public nextLevel() {
    this.currentLevel++;
    this.particleSystem?.reset();
    this.arrowsContainer?.removeChildren();
    this.dotsContainer?.removeChildren();
    this.arrows = [];
    this.isChangeModeActive = false;
    this.isBombModeActive = false;
    this.changeButton.reset();
    this.bombButton.reset(3);
    if (this.livesUI) this.livesUI.reset();
    this.initGame();
    this.app.ticker.start();
  }
}