import { Container, Graphics, Sprite, Texture, Application } from "pixi.js";

export class WinScreen extends Container {
  private winSprite: Sprite | null = null;
  private dimBg: Graphics | null = null;
  private winTexture: Texture;
  private closeTexture: Texture;
  private starTexture: Texture;
  private app: Application;

  constructor(app: Application, winTexture: Texture, closeTexture: Texture, starTexture: Texture) {
    super();
    this.app = app;
    this.winTexture = winTexture;
    this.closeTexture = closeTexture;
    this.starTexture = starTexture;
    this.visible = false; // изначально скрыт
  }

  public show(onClose: () => void) {
    this.visible = true;
    this.removeChildren(); // очищаем

    // Затемнение
    this.dimBg = new Graphics();
    this.dimBg.beginFill(0x000000, 0.7);
    this.dimBg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.endFill();
    this.dimBg.eventMode = "static";
    this.addChild(this.dimBg);

    // Главный спрайт победы
    this.winSprite = new Sprite(this.winTexture);
    this.winSprite.anchor.set(0.5);
    this.winSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.addChild(this.winSprite);

    // Звёзды
    const starY = 70;
    const starX = [-270, 0, 285];
    const targetStarWidth = 270;
    for (let i = 0; i < 3; i++) {
      const star = new Sprite(this.starTexture);
      star.anchor.set(0.5);
      star.position.set(starX[i], starY);
      const scale = targetStarWidth / this.starTexture.width;
      star.scale.set(scale);
      if (i >= 3) star.alpha = 0.3;
      this.winSprite.addChild(star);
    }

    // Кнопка закрытия
    const closeBtn = new Sprite(this.closeTexture);
    closeBtn.anchor.set(0.5);
    closeBtn.position.set(this.winSprite.width / 2 - 160, -this.winSprite.height / 2 + 190);
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.on("pointerdown", () => {
      this.hide();
      onClose();
    });
    this.winSprite.addChild(closeBtn);

    // Анимация появления
    const targetScale = Math.min(
      this.app.screen.width * 0.8 / this.winTexture.width,
      this.app.screen.height * 0.8 / this.winTexture.height,
      1.5
    );
    this.winSprite.scale.set(0);
    this.animateScale(this.winSprite, targetScale);
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
  }

  public resize() {
    if (this.dimBg) {
      this.dimBg.clear();
      this.dimBg.beginFill(0x000000, 0.7);
      this.dimBg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      this.dimBg.endFill();
    }
    if (this.winSprite) {
      this.winSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    }
  }
}