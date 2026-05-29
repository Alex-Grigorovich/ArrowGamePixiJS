import { Container, Graphics, Sprite, Texture, Application } from "pixi.js";

export class GameOverScreen extends Container {
  private loseSprite: Sprite | null = null;
  private dimBg: Graphics | null = null;
  private loseTexture: Texture;
  private repeatTexture: Texture;
  private app: Application;

  constructor(app: Application, loseTexture: Texture, repeatTexture: Texture) {
    super();
    this.app = app;
    this.loseTexture = loseTexture;
    this.repeatTexture = repeatTexture;
    this.visible = false;
  }

  public show(onRepeat: () => void) {
    this.visible = true;
    this.removeChildren();

    this.dimBg = new Graphics();
    this.dimBg.fill({ color: 0x000000, alpha: 0.75 });
    this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.fill();
    this.dimBg.eventMode = "static";
    this.addChild(this.dimBg);

    this.loseSprite = new Sprite(this.loseTexture);
    this.loseSprite.anchor.set(0.5);
    this.loseSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.addChild(this.loseSprite);

    const restartButtonYOffset = 90;
    const repeatBtn = new Sprite(this.repeatTexture);
    repeatBtn.anchor.set(0.5);
    repeatBtn.position.set(0, restartButtonYOffset);
    repeatBtn.eventMode = "static";
    repeatBtn.cursor = "pointer";
    this.loseSprite.addChild(repeatBtn);

    repeatBtn.on("pointerdown", () => {
      this.hide();
      onRepeat();
    });

    repeatBtn.on("pointerover", () => repeatBtn.scale.set(1.1));
    repeatBtn.on("pointerleave", () => repeatBtn.scale.set(1.0));

    const targetScale = Math.min(
      this.app.screen.width * 0.8 / this.loseTexture.width,
      this.app.screen.height * 0.8 / this.loseTexture.height,
      1.5
    );

    this.loseSprite.scale.set(0);
    this.animateScale(this.loseSprite, targetScale);
  }

  private animateScale(sprite: Sprite, targetScale: number) {
    const start = performance.now();
    const duration = 600;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      sprite.scale.set(targetScale * ease);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  public hide() {
  this.visible = false;
  this.removeChildren();
  this.dimBg = null;
  this.loseSprite = null;
}

  public resize() {
    if (this.dimBg) {
      this.dimBg.clear();
      this.dimBg.fill({ color: 0x000000, alpha: 0.75 });
      this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
      this.dimBg.fill();
    }
    if (this.loseSprite) {
      this.loseSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    }
  }
}