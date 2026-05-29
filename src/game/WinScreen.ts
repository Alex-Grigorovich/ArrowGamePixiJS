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
    this.visible = false;
  }

  public show(rating: number, onClose: () => void) {
    this.visible = true;
    this.removeChildren();

    // Затемнение фона
    this.dimBg = new Graphics();
    this.dimBg.fill({ color: 0x000000, alpha: 0.75 });
    this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.fill();
    this.dimBg.eventMode = "static";
    this.addChild(this.dimBg);

    // Главная панель
    this.winSprite = new Sprite(this.winTexture);
    this.winSprite.anchor.set(0.5);
    this.winSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.addChild(this.winSprite);

    // Звёзды (оставляем как было)
    const starY = 70;
    const starSpacing = 280;
    const firstStarOffset = 10;
    const thirdStarOffset = 5;
    const starScale = Math.min(2.5, 270 / this.starTexture.width);

    for (let i = 0; i < rating; i++) {
      const star = new Sprite(this.starTexture);
      star.anchor.set(0.5);
      let xPos = -starSpacing + (i * starSpacing);
      if (i === 0) xPos += firstStarOffset;
      if (i === 2) xPos += thirdStarOffset;
      star.position.set(xPos, starY);
      star.scale.set(starScale);
      this.winSprite.addChild(star);
    }

    // Кнопка закрытия
    const closeBtn = new Sprite(this.closeTexture);
    closeBtn.anchor.set(0.5);
    const closeBtnX = (this.winTexture.width / 2) - 160;
    const closeBtnY = (-this.winTexture.height / 2) + 180;
    closeBtn.position.set(closeBtnX, closeBtnY);
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
      1.2
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
  this.removeChildren();
  this.dimBg = null;
  this.winSprite = null;
}

  public resize() {
    if (this.dimBg) {
      this.dimBg.clear();
      this.dimBg.fill({ color: 0x000000, alpha: 0.75 });
      this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
      this.dimBg.fill();
    }
    if (this.winSprite) {
      this.winSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    }
  }
}