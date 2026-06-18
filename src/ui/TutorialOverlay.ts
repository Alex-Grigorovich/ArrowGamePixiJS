import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

const TUTORIAL_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: 0xffffff,
  stroke: { color: 0x000000, width: 2 },
};

type TutorialTarget = { x: number; y: number };

export type TutorialStepContent = {
  title: string;
  body: string;
  target: TutorialTarget | null;
  showArrow?: boolean;
};

// В Arrow2.png наконечник в верхнем-левом углу; после поворота на 180° указывает на цель.
const ARROW2_TIP_ANCHOR = { x: 0.14, y: 0.14 };
const ARROW2_TIP_OFFSET = { x: 0, y: 0 };

export class TutorialOverlay extends Container {
  private readonly app: Application;
  private readonly arrowTexture: Texture;
  private dimBg: Graphics | null = null;
  private arrowSprite: Sprite | null = null;
  private titleText: Text | null = null;
  private bodyText: Text | null = null;
  private pulseTime = 0;
  private target: TutorialTarget | null = null;
  private hintScale = 0.7;
  private hintBaseX = 0;
  private hintBaseY = 0;

  constructor(app: Application, arrowTexture: Texture) {
    super();
    this.app = app;
    this.arrowTexture = arrowTexture;
    this.eventMode = "none";
    this.visible = false;
    this.app.ticker.add(this.tick);
  }

  public show(target: TutorialTarget | null, gameScale = 1): void {
    this.showStep(
      {
        title: "ТУТОРИАЛ",
        body: "Нажми на стрелку.\nОна скользит до препятствия\nили улетает за край.",
        target,
        showArrow: true,
      },
      gameScale,
    );
  }

  public showStep(content: TutorialStepContent, gameScale = 1): void {
    this.visible = true;
    this.removeChildren();
    this.pulseTime = 0;

    this.dimBg = new Graphics();
    this.dimBg.fill({ color: 0x000000, alpha: 0.28 });
    this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.dimBg.fill();
    this.addChild(this.dimBg);

    this.titleText = new Text({
      text: content.title,
      style: { ...TUTORIAL_STYLE, fontSize: 34, fill: 0xffe55f },
    });
    this.titleText.anchor.set(0.5);
    this.addChild(this.titleText);

    this.bodyText = new Text({
      text: content.body,
      style: { ...TUTORIAL_STYLE, fontSize: 26, align: "center" },
    });
    this.bodyText.anchor.set(0.5);
    this.addChild(this.bodyText);

    if (content.showArrow !== false) {
      this.arrowSprite = new Sprite(this.arrowTexture);
      this.arrowSprite.anchor.set(ARROW2_TIP_ANCHOR.x, ARROW2_TIP_ANCHOR.y);
      this.addChild(this.arrowSprite);
    } else {
      this.arrowSprite = null;
    }

    this.updateTarget(content.target, gameScale);
  }

  public updateTarget(target: TutorialTarget | null, gameScale = 1): void {
    this.target = target;
    this.hintScale = Math.max(0.45, Math.min(0.9, 0.65 * gameScale));
    this.layout();
  }

  public hide(): void {
    this.visible = false;
    this.removeChildren();
    this.dimBg = null;
    this.arrowSprite = null;
    this.titleText = null;
    this.bodyText = null;
    this.target = null;
  }

  public resize(): void {
    this.layout();
  }

  private layout(): void {
    if (!this.visible) return;

    if (this.dimBg) {
      this.dimBg.clear();
      this.dimBg.fill({ color: 0x000000, alpha: 0.28 });
      this.dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
      this.dimBg.fill();
    }

    const cx = this.app.screen.width / 2;
    this.titleText?.position.set(cx, 72);
    this.bodyText?.position.set(cx, 145);

    if (!this.arrowSprite) return;

    this.arrowSprite.scale.set(this.hintScale);
    this.arrowSprite.rotation = Math.PI;

    if (!this.target) {
      this.hintBaseX = cx;
      this.hintBaseY = this.app.screen.height / 2;
      this.arrowSprite.position.set(this.hintBaseX, this.hintBaseY);
      return;
    }

    this.hintBaseX = this.target.x + ARROW2_TIP_OFFSET.x;
    this.hintBaseY = this.target.y + ARROW2_TIP_OFFSET.y;
    this.arrowSprite.position.set(this.hintBaseX, this.hintBaseY);
  }

  private tick = (): void => {
    if (!this.visible || !this.arrowSprite) return;
    this.pulseTime += 0.08;
    const bob = Math.sin(this.pulseTime) * 4;
    this.arrowSprite.x = this.hintBaseX - bob;
    this.arrowSprite.y = this.hintBaseY - bob;
  };
}
