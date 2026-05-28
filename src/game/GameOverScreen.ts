import { Container, Graphics, Sprite, Texture, Application } from "pixi.js";

export class GameOverScreen extends Container {
  private loseSprite: Sprite | null = null;
  private dimBg: Graphics | null = null;
  private loseTexture: Texture;
  private repeatTexture: Texture;
  private app: Application;

  constructor(
    app: Application,
    loseTexture: Texture,
    repeatTexture: Texture
  ) {
    super();
    this.app = app;
    this.loseTexture = loseTexture;
    this.repeatTexture = repeatTexture;
    this.visible = false;
  }

  public show(onRepeat: () => void) {
    this.visible = true;
    this.removeChildren();

    // 1. Затемнение фона
    this.dimBg = new Graphics();
    this.dimBg.beginFill(0x000000, 0.7);
    this.dimBg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.endFill();
    this.dimBg.eventMode = "static";
    this.addChild(this.dimBg);

    // 2. Главный спрайт "Lose"
    this.loseSprite = new Sprite(this.loseTexture);
    this.loseSprite.anchor.set(0.5);
    this.loseSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.addChild(this.loseSprite);

    // 3. Кнопка "Заново" (Lose_repeat)
    const repeatBtn = new Sprite(this.repeatTexture);
    repeatBtn.anchor.set(0.5);
    const repeatY = 30; // Позиция чуть выше центра панели
    repeatBtn.position.set(0, repeatY);
    repeatBtn.eventMode = "static";
    repeatBtn.cursor = "pointer";
    this.loseSprite.addChild(repeatBtn);

    // Обработчик нажатия
    repeatBtn.on("pointerdown", () => {
      this.hide();
      onRepeat();
    });

    // Эффекты при наведении
    repeatBtn.on("pointerover", () => repeatBtn.scale.set(1.1));
    repeatBtn.on("pointerleave", () => repeatBtn.scale.set(1.0));

    // 4. Анимация появления
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
  }

  public resize() {
    if (this.dimBg) {
      this.dimBg.clear();
      this.dimBg.beginFill(0x000000, 0.7);
      this.dimBg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
      this.dimBg.endFill();
    }
    if (this.loseSprite) {
      this.loseSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
      // Фиксируем позицию единственной кнопки при изменении размера окна
      if (this.loseSprite.scale.x > 0.1) {
        const repeatY = 30;
        (this.loseSprite.children[0] as Sprite).position.set(0, repeatY);
      }
    }
  }
}