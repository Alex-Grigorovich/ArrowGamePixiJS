import { Container, Sprite, Graphics, Text, Texture } from "pixi.js";

export class ChangeButtonUI extends Container {
  private buttonInteractive: Sprite | Graphics;
  private countText: Text;
  private remainingUses: number;
  private onClickCallback: () => void;
  private onEmptyClickCallback: () => void;
  private offsetX: number;
  private offsetY: number;

  constructor(
    buttonTexture: Texture,
    initialUses: number = 3,
    onClick: () => void,
    offsetX = -48,
    offsetY = 12,
    onEmptyClick: () => void = () => {},
  ) {
    super();
    this.remainingUses = initialUses;
    this.onClickCallback = onClick;
    this.onEmptyClickCallback = onEmptyClick;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    if (buttonTexture) {
      this.buttonInteractive = new Sprite(buttonTexture);
      this.buttonInteractive.anchor.set(0.5);
    } else {
      const g = new Graphics();
      g.fill({ color: 0x44aa44 });
      g.roundRect(-60, -25, 120, 50, 15);
      g.fill();
      this.buttonInteractive = g;
    }

    this.buttonInteractive.eventMode = "static";
    this.buttonInteractive.cursor = "pointer";
    this.buttonInteractive.on("pointerdown", () => {
      if (this.remainingUses > 0) {
        this.onClickCallback();
      } else {
        this.onEmptyClickCallback();
        this.buttonInteractive.tint = 0x888888;
        setTimeout(() => {
          this.buttonInteractive.tint = 0x666666;
        }, 200);
      }
    });
    this.addChild(this.buttonInteractive);

    this.countText = new Text({
      text: `${this.remainingUses}`,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0x000000,
        fontWeight: "bold",
      },
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
      this.buttonInteractive.tint = 0xaaffaa;
      setTimeout(() => {
        this.buttonInteractive.tint = 0xffffff;
      }, 150);
    }
    if (this.remainingUses === 0) {
      this.buttonInteractive.tint = 0x666666;
    }
  }

  public getRemainingUses(): number {
    return this.remainingUses;
  }

  public reset(uses: number = 3): void {
    this.remainingUses = uses;
    this.countText.text = `${this.remainingUses}`;
    this.buttonInteractive.tint = 0xffffff;
    this.buttonInteractive.eventMode = "static";
  }

  public addCharge(amount = 1): void {
    this.remainingUses += Math.max(1, Math.floor(amount));
    this.countText.text = `${this.remainingUses}`;
    this.buttonInteractive.tint = 0xffffff;
    this.buttonInteractive.eventMode = "static";
  }

  public setInteractive(enabled: boolean): void {
    this.buttonInteractive.eventMode = enabled ? "static" : "none";
    this.alpha = enabled ? 1 : 0.65;
  }
}
