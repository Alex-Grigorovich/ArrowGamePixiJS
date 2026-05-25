import { Sprite } from "pixi.js";
import type { Direction } from "../types/types";

export class Arrow extends Sprite {
  public direction: Direction;
  public color: string;
  public row: number;
  public col: number;
  public isFlying = false;

  private normalTex: Sprite["texture"];  // Texture
  private boldTex: Sprite["texture"];
  private baseScaleNormal: number;
  private baseScaleBold: number;

  constructor(
    normalTex: Sprite["texture"],
    boldTex: Sprite["texture"],
    direction: Direction,
    color: string,
    row: number,
    col: number,
    x: number,
    y: number,
    baseWidth: number
  ) {
    super(normalTex);
    this.normalTex = normalTex;
    this.boldTex = boldTex;
    this.direction = direction;
    this.color = color;
    this.row = row;
    this.col = col;

    this.anchor.set(0.5);
    this.position.set(x, y);
    this.eventMode = "static";
    this.cursor = "pointer";

    this.baseScaleNormal = baseWidth / normalTex.width;
    this.baseScaleBold = baseWidth / boldTex.width;
    this.scale.set(this.baseScaleNormal);

    this.setupEvents();
  }

  private setupEvents() {
    this.on("pointerover", () => {
      if (this.isFlying) return;
      this.texture = this.boldTex;
      this.scale.set(this.baseScaleBold * 1.2);
    });
    this.on("pointerleave", () => {
      if (this.isFlying) return;
      this.texture = this.normalTex;
      this.scale.set(this.baseScaleNormal);
    });
  }

  public setDirection(
    newDirection: Direction,
    newNormalTex: Sprite["texture"],
    newBoldTex: Sprite["texture"]
  ) {
    this.direction = newDirection;
    this.normalTex = newNormalTex;
    this.boldTex = newBoldTex;

    // Обновляем текстуру, если не в полёте
    if (!this.isFlying) {
      this.texture = this.normalTex;
      this.scale.set(this.baseScaleNormal);
    }
  }

  public fly(delta: { x: number; y: number }, onComplete: () => void) {
    this.isFlying = true;
    this.texture = this.boldTex;
    this.scale.set(this.baseScaleBold);
    const startX = this.x;
    const startY = this.y;
    const startTime = performance.now();
    const duration = 500;
    const distance = 300;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      this.x = startX + delta.x * distance * ease;
      this.y = startY + delta.y * distance * ease;
      this.alpha = 1 - progress * 0.5;
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };
    requestAnimationFrame(animate);
  }
}