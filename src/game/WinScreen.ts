import { Container, Graphics, Sprite, Texture, Application } from "pixi.js";

export class WinScreen extends Container {
  private winSprite: Sprite | null = null;
  private dimBg: Graphics | null = null;
  private winTexture: Texture;
  private closeTexture: Texture;
  private starTexture: Texture;
  private app: Application;
  
  // Массив для хранения ссылок на звезды
  private stars: Sprite[] = [];
  // Базовая позиция Y для звезд (как было в коде: 70)
  private readonly BASE_STAR_Y = 70;

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
    this.stars = []; // Очищаем массив перед созданием новых

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

    // Звёзды
    const starSpacing = 280;
    const firstStarOffset = 10;
    const thirdStarOffset = 5; // Исправлено имя переменной
    const starScale = Math.min(2.5, 270 / this.starTexture.width);

    for (let i = 0; i < rating; i++) {
      const star = new Sprite(this.starTexture);
      star.anchor.set(0.5);
      let xPos = -starSpacing + (i * starSpacing);
      if (i === 0) xPos += firstStarOffset;
      if (i === 2) xPos += thirdStarOffset;

      // Устанавливаем начальную позицию
      star.position.set(xPos, this.BASE_STAR_Y);
      star.scale.set(starScale);

      this.stars.push(star); // Сохраняем ссылку на звезду
      this.winSprite.addChild(star);
    }

    // Кнопка закрытия
    const closeBtn = new Sprite(this.closeTexture);
    closeBtn.anchor.set(0.5);
    const closeBtnX = (this.winTexture.width / 2) - 160;
    const closeBtnY = (-this.winTexture.height / 2) + 180;
    closeBtn.position.set(closeBtnX, closeBtnY); // Исправлен синтаксис (убран пробел)
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";

    closeBtn.on("pointerdown", () => {
      this.hide();
      onClose();
    });
    this.winSprite.addChild(closeBtn);

    // Анимация появления панели
    const targetScale = Math.min(
      this.app.screen.width * 0.8 / this.winTexture.width,
      this.app.screen.height * 0.8 / this.winTexture.height,
      1.2
    );
    this.winSprite.scale.set(0);
    this.animateScale(this.winSprite, targetScale);

    // ✅ Запуск последовательной анимации прыжков звезд
    this.animateStarsSequentially();
  }

  // Метод для запуска прыжков звезд по очереди (слева направо)
  private animateStarsSequentially() {
    if (this.stars.length === 0) return;

    // Первая звезда начинает прыгать через 600мс (после того как окно появилось)
    let startDelay = 600; 

    for (let i = 0; i < this.stars.length; i++) {
      // Каждая следующая звезда прыгает через 350мс после предыдущей
      const delay = startDelay + (i * 350);

      setTimeout(() => {
        this.jumpStar(this.stars[i]);
      }, delay);
    }
  }

  // Анимация прыжка одной звезды (вверх на 30px и обратно)
  private jumpStar(star: Sprite) {
    const startY = this.BASE_STAR_Y;
    const jumpHeight = 30; // Высота прыжка 30 пикселей
    const duration = 500; // Длительность одного прыжка в мс
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Синусоида (0 -> 1 -> 0) обеспечивает плавный подъем и спуск
      // sin(0) = 0, sin(PI/2) = 1 (максимум), sin(PI) = 0
      const offset = Math.sin(progress * Math.PI) * jumpHeight;

      // Y уменьшается при движении вверх
      star.position.y = startY - offset;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Возвращаем точно на базу в конце анимации
        star.position.y = startY; 
      }
    };
    requestAnimationFrame(animate);
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
    this.stars = [];
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