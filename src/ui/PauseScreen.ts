import { Application, Container, Graphics, Sprite, Texture } from "pixi.js";

export class PauseScreen extends Container {
  private app: Application;
  private centerTexture: Texture;
  private dimBg: Graphics | null = null;
  private centerSprite: Sprite | null = null;

  constructor(app: Application, centerTexture: Texture) {
    super();
    this.app = app;
    this.centerTexture = centerTexture;
    this.visible = false;
  }

  public show() {
    this.visible = true;
    this.build();
  }

  public hide() {
    this.visible = false;
    this.removeChildren();
    this.dimBg = null;
    this.centerSprite = null;
  }

  public resize() {
    if (!this.visible) return;
    this.build();
  }

  private build() {
    this.removeChildren();

    this.dimBg = new Graphics();
    this.dimBg.fill({ color: 0x000000, alpha: 0.82 });
    this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.fill();
    this.dimBg.eventMode = "static";
    this.addChild(this.dimBg);

    this.centerSprite = new Sprite(this.centerTexture);
    this.centerSprite.anchor.set(0.5);
    this.centerSprite.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
    );
    const targetScale = Math.min(
      (this.app.screen.width * 0.55) / this.centerTexture.width,
      (this.app.screen.height * 0.45) / this.centerTexture.height,
      1.2,
    );
    this.centerSprite.scale.set(targetScale);
    this.addChild(this.centerSprite);
  }
}
