import { Container, Sprite, Graphics, Text, Texture } from "pixi.js";

export class ChangeButtonUI extends Container {
  private buttonInteractive: Sprite | Graphics;
  private countText: Text;
  private remainingUses: number;
  private onClickCallback: () => void;
  private offsetX: number;
  private offsetY: number;

  constructor(buttonTexture: Texture, initialUses: number = 3, onClick: () => void, offsetX = -48, offsetY = 12) {
    super();
    this.remainingUses = initialUses;
    this.onClickCallback = onClick;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    if (buttonTexture) {
      this.buttonInteractive = new Sprite(buttonTexture);
      this.buttonInteractive.anchor.set(0.5);
    } else {
      const g = new Graphics();
      g.fill({ color: 0x44aa44 });
      g.rect(-60, -25, 120, 50, 15);
      g.fill();
      this.buttonInteractive = g;
    }

    this.buttonInteractive.eventMode = "static";
    this.buttonInteractive.cursor = "pointer";
    this.buttonInteractive.on("pointerdown", () => {
      if (this.remainingUses > 0) {
        this.onClickCallback();
      } else {
        (this.buttonInteractive as any).tint = 0x888888;
        setTimeout(() => { (this.buttonInteractive as any).tint = 0xffffff; }, 200);
      }
    });
    this.addChild(this.buttonInteractive);

    this.countText = new Text({
      text: `${this.remainingUses}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0x000000,
        fontWeight: 'bold'
      }
    });
    this.countText.anchor.set(0, 0);
    this.countText.position.set(this.offsetX, this.offsetY);
    this.addChild(this.countText);

    // ✅ УБРАНО: this.scale.set(2 / 3);
    // Теперь масштаб управляется только через main.ts
  }

  public useOne(): void {
    if (this.remainingUses > 0) {
      this.remainingUses--;
      this.countText.text = `${this.remainingUses}`;
      (this.buttonInteractive as any).tint = 0xaaffaa;
      setTimeout(() => { (this.buttonInteractive as any).tint = 0xffffff; }, 150);
    }
    if (this.remainingUses === 0) {
      (this.buttonInteractive as any).tint = 0x666666;
      this.buttonInteractive.eventMode = "none";
    }
  }

  public getRemainingUses(): number {
    return this.remainingUses;
  }

  public reset(uses: number = 3): void {
    this.remainingUses = uses;
    this.countText.text = `${this.remainingUses}`;
    (this.buttonInteractive as any).tint = 0xffffff;
    this.buttonInteractive.eventMode = "static";
  }
}