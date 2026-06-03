import { Container, Sprite, Graphics, Text, Texture } from "pixi.js";

export class BombUI extends Container {
  private buttonInteractive: Sprite | Graphics;
  private countText: Text;
  private remainingUses: number;
  private onClickCallback: () => void;

  constructor(buttonTexture: Texture, initialUses: number = 2, onClick: () => void) {
    super();
    this.remainingUses = initialUses;
    this.onClickCallback = onClick;

    if (buttonTexture) {
      this.buttonInteractive = new Sprite(buttonTexture);
      this.buttonInteractive.anchor.set(0.5);
      // ✅ УБРАНО: this.buttonInteractive.scale.set(BUTTON_SCALE);
      // Теперь масштаб управляется только через main.ts
    } else {
      const g = new Graphics();
      g.fill({ color: 0xff0000 });
      g.rect(-50, -25, 100, 50);
      g.fill();
      this.buttonInteractive = g;
    }

    this.buttonInteractive.eventMode = "static";
    this.buttonInteractive.cursor = "pointer";
    this.buttonInteractive.on("pointerdown", () => {
      if (this.remainingUses > 0) {
        this.onClickCallback();
      }
    });
    this.addChild(this.buttonInteractive);

    this.countText = new Text({
      text: `${this.remainingUses}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 20,
        fill: 0x000000,
        fontWeight: 'bold'
      }
    });
    this.countText.anchor.set(0.5);
    this.countText.position.set(-76, 55);
    this.addChild(this.countText);
  }

  public useOne(): void {
    if (this.remainingUses > 0) {
      this.remainingUses--;
      this.countText.text = `${this.remainingUses}`;
      (this.buttonInteractive as any).tint = 0xcccccc;
      setTimeout(() => { (this.buttonInteractive as any).tint = 0xffffff; }, 150);
    }
    if (this.remainingUses === 0) {
      (this.buttonInteractive as any).tint = 0x888888;
      this.buttonInteractive.eventMode = "none";
    }
  }

  public getRemainingUses(): number {
    return this.remainingUses;
  }

  public reset(uses: number = 2): void {
    this.remainingUses = uses;
    this.countText.text = `${this.remainingUses}`;
    (this.buttonInteractive as any).tint = 0xffffff;
    this.buttonInteractive.eventMode = "static";
  }
}