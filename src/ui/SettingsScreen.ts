import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

const MENU_TEXT_COLOR = 0xffe55f;

const SETTINGS_TEXT_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: MENU_TEXT_COLOR,
  stroke: { color: 0x000000, width: 2 },
};

export class SettingsScreen extends Container {
  private dimBg: Graphics | null = null;
  private windowSprite: Sprite | null = null;
  private closeButton: Sprite | null = null;
  private app: Application;
  private windowTexture: Texture;
  private closeTexture: Texture;
  private soundNoTexture: Texture;
  private soundCheckTexture: Texture;
  private onRestart: () => void;
  private onClose: () => void;
  private onUiClick: () => void;
  private onSoundChanged: (enabled: boolean) => void;
  private soundEnabled = true;

  constructor(
    app: Application,
    windowTexture: Texture,
    closeTexture: Texture,
    soundNoTexture: Texture,
    soundCheckTexture: Texture,
    onRestart: () => void,
    initialSoundEnabled = true,
    onSoundChanged: (enabled: boolean) => void = () => {},
    onClose: () => void = () => {},
    onUiClick: () => void = () => {},
  ) {
    super();
    this.app = app;
    this.windowTexture = windowTexture;
    this.closeTexture = closeTexture;
    this.soundNoTexture = soundNoTexture;
    this.soundCheckTexture = soundCheckTexture;
    this.onRestart = onRestart;
    this.onClose = onClose;
    this.onUiClick = onUiClick;
    this.soundEnabled = initialSoundEnabled;
    this.onSoundChanged = onSoundChanged;
    this.visible = false;
  }

  public show() {
    this.visible = true;
    this.removeChildren();

    this.dimBg = new Graphics();
    this.dimBg.fill({ color: 0x000000, alpha: 0.75 });
    this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.fill();
    this.dimBg.eventMode = "static";
    this.addChild(this.dimBg);

    this.windowSprite = new Sprite(this.windowTexture);
    this.windowSprite.anchor.set(0.5);
    this.windowSprite.position.set(
      this.app.screen.width / 2,
      this.app.screen.height / 2,
    );
    this.addChild(this.windowSprite);

    const targetScale = Math.min(
      (this.app.screen.width * 0.85) / this.windowTexture.width,
      (this.app.screen.height * 0.85) / this.windowTexture.height,
      1.2,
    );
    this.windowSprite.scale.set(0);
    this.animateScale(this.windowSprite, targetScale);

    this.buildWindowContent();

    this.closeButton = new Sprite(this.closeTexture);
    this.closeButton.anchor.set(0.5);
    this.closeButton.eventMode = "static";
    this.closeButton.cursor = "pointer";
    this.closeButton.on("pointerdown", () => {
      this.onUiClick();
      this.hide();
    });
    this.windowSprite.addChild(this.closeButton);
    this.positionCloseButton();
  }

  private buildWindowContent() {
    if (!this.windowSprite) return;

    const title = new Text({
      text: "Настройка",
      style: { ...SETTINGS_TEXT_STYLE, fontSize: 42 },
    });
    title.anchor.set(0.5);
    title.position.set(0, -this.windowTexture.height / 2 + 90);
    this.windowSprite.addChild(title);

    const soundRow = new Container();
    const soundLabel = new Text({
      text: "Звук",
      style: { ...SETTINGS_TEXT_STYLE, fontSize: 32 },
    });
    soundLabel.anchor.set(0, 0.5);

    const soundToggle = new Container();
    soundToggle.position.set(soundLabel.width + 20, 0);

    const soundNo = new Sprite(this.soundNoTexture);
    soundNo.anchor.set(0, 0.5);
    soundNo.scale.set(0.45);
    soundNo.eventMode = "static";
    soundNo.cursor = "pointer";

    const soundCheck = new Sprite(this.soundCheckTexture);
    soundCheck.anchor.set(0, 0.5);
    soundCheck.scale.set(0.45);
    soundCheck.position.set(8, -5);
    soundCheck.visible = this.soundEnabled;

    soundNo.on("pointerdown", () => {
      this.soundEnabled = !this.soundEnabled;
      soundCheck.visible = this.soundEnabled;
      this.onSoundChanged(this.soundEnabled);
    });

    soundToggle.addChild(soundNo, soundCheck);
    soundRow.addChild(soundLabel, soundToggle);
    soundRow.position.set(-110, -20);
    this.windowSprite.addChild(soundRow);

    const restartText = new Text({
      text: "Заново",
      style: { ...SETTINGS_TEXT_STYLE, fontSize: 32 },
    });
    restartText.anchor.set(0.5);
    restartText.position.set(0, 120);
    restartText.eventMode = "static";
    restartText.cursor = "pointer";

    const underline = new Graphics();
    underline.visible = false;
    this.windowSprite.addChild(restartText, underline);

    const updateUnderline = () => {
      underline.clear();
      underline.stroke({ color: MENU_TEXT_COLOR, width: 2 });
      const textWidth = restartText.width;
      const x = restartText.x - textWidth / 2;
      const y = restartText.y + restartText.height / 2 + 4;
      underline.moveTo(x, y);
      underline.lineTo(x + textWidth, y);
      underline.stroke();
    };

    restartText.on("pointerover", () => {
      underline.visible = true;
      updateUnderline();
    });
    restartText.on("pointerleave", () => {
      underline.visible = false;
    });
    restartText.on("pointerdown", () => {
      this.hide();
      this.onRestart();
    });
  }

  public hide() {
    this.visible = false;
    this.removeChildren();
    this.dimBg = null;
    this.windowSprite = null;
    this.closeButton = null;
    this.onClose();
  }

  public getSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public resize() {
    if (this.dimBg) {
      this.dimBg.clear();
      this.dimBg.fill({ color: 0x000000, alpha: 0.75 });
      this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
      this.dimBg.fill();
    }

    if (this.windowSprite) {
      this.windowSprite.position.set(
        this.app.screen.width / 2,
        this.app.screen.height / 2,
      );
    }

    this.positionCloseButton();
  }

  private positionCloseButton() {
    if (!this.closeButton || !this.windowSprite) return;

    const offsetX = 110;
    const offsetY = 5;
    const localX = this.windowTexture.width / 2 - offsetX;
    const localY = -this.windowTexture.height / 2 + offsetY;

    this.closeButton.position.set(localX, localY);
    this.closeButton.scale.set(0.55);
  }

  private animateScale(sprite: Sprite, targetScale: number) {
    const start = performance.now();
    const duration = 400;
    const animate = (now: number) => {
      if (!sprite.parent) return;
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      sprite.scale.set(targetScale * ease);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }
}
