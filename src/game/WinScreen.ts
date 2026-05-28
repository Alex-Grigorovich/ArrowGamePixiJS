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

    // 1. Затемнение фона
    this.dimBg = new Graphics();
    this.dimBg.beginFill(0x000000, 0.7);
    this.dimBg.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.endFill();
    this.dimBg.eventMode = "static";
    this.addChild(this.dimBg);

    // 2. Главный спрайт (панель победы)
    this.winSprite = new Sprite(this.winTexture);
    this.winSprite.anchor.set(0.5);
    this.winSprite.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    this.addChild(this.winSprite);

    // 3. 🔽 НАСТРОЙКИ ЗВЁЗД (Значения сохранены согласно вашим настройкам)
    const starY = 70;
    const starSpacing = 280; // Расстояние между слотами
    const firstStarOffset = 10;  // Отступ 1-й звезды
    const thirdStarOffset = 5;   // Отступ 3-й звезды
    
    // Масштаб звёзд
    const starScale = Math.min(2.5, 270 / this.starTexture.width);

    for (let i = 0; i < rating; i++) {
      const star = new Sprite(this.starTexture);
      star.anchor.set(0.5);
      
      // Базовая позиция слотов
      let xPos = -starSpacing + (i * starSpacing);
      
      // Применяем ваши отступы
      if (i === 0) {
        xPos += firstStarOffset;
      }
      if (i === 2) {
        xPos += thirdStarOffset;
      }
      
      star.position.set(xPos, starY);
      star.scale.set(starScale);
      this.winSprite.addChild(star);
    }

    // 4. Кнопка закрытия (Справа и Вверху)
    const closeBtn = new Sprite(this.closeTexture);
    closeBtn.anchor.set(0.5);

    // 📍 НАСТРОЙКА ПОЗИЦИИ КНОПКИ:
    // Используем размеры текстуры панели для расчёта координат относительно центра (0,0)
    const closeBtnX = (this.winTexture.width / 2) - 160;  // 👈 60px от правого края (увеличьте, чтобы сдвинуть левее)
    const closeBtnY = (-this.winTexture.height / 2) + 180; // 👈 40px от верхнего края (уменьшите, чтобы сдвинуть выше)
    
    closeBtn.position.set(closeBtnX, closeBtnY);
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    
    closeBtn.on("pointerdown", () => {
      this.hide();
      onClose();
    });
    this.winSprite.addChild(closeBtn);

    // 5. Анимация появления
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