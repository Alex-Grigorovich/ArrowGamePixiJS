import { Container, Sprite, Graphics, Text, Texture } from "pixi.js";

export class BombUI extends Container {
  private buttonInteractive: Sprite | Graphics;
  private countText: Text;
  private remainingUses: number;
  private onClickCallback: () => void;
  private onEmptyClickCallback: () => void;

  constructor(
    buttonTexture: Texture,
    initialUses: number = 2,
    onClick: () => void,
    onEmptyClick: () => void = () => {},
  ) {
    super();
    this.remainingUses = initialUses;
    this.onClickCallback = onClick;
    this.onEmptyClickCallback = onEmptyClick;

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
      } else {
        this.onEmptyClickCallback();
        this.buttonInteractive.tint = 0x666666;
        setTimeout(() => {
          this.buttonInteractive.tint = 0x888888;
        }, 200);
      }
    });
    this.addChild(this.buttonInteractive);

    this.countText = new Text({
      text: `${this.remainingUses}`,
      style: {
        fontFamily: "Arial",
        fontSize: 20,
        fill: 0x000000,
        fontWeight: "bold",
      },
    });
    this.countText.anchor.set(0.5);
    this.countText.position.set(-76, 55);
    this.addChild(this.countText);
  }

  public useOne(): void {
    if (this.remainingUses > 0) {
      this.remainingUses--;
      this.countText.text = `${this.remainingUses}`;
      this.buttonInteractive.tint = 0xcccccc;
      setTimeout(() => {
        this.buttonInteractive.tint = 0xffffff;
      }, 150);
    }
    if (this.remainingUses === 0) {
      this.buttonInteractive.tint = 0x888888;
    }
  }

  public getRemainingUses(): number {
    return this.remainingUses;
  }

  public reset(uses: number = 2): void {
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
