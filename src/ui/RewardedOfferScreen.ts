import { Application, Container, Graphics, Text } from "pixi.js";

const TEXT_COLOR = 0xffe55f;

const TITLE_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: TEXT_COLOR,
  stroke: { color: 0x000000, width: 2 },
  fontSize: 30,
};

const BODY_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: TEXT_COLOR,
  stroke: { color: 0x000000, width: 1.5 },
  fontSize: 22,
  lineHeight: 28,
  align: "center" as const,
  wordWrap: true,
};

const BUTTON_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: TEXT_COLOR,
  stroke: { color: 0x000000, width: 2 },
  fontSize: 24,
};

export type RewardedBonusType = "change" | "bomb";

const BONUS_LABELS: Record<RewardedBonusType, string> = {
  change: "«Разворот»",
  bomb: "«Бомба»",
};

export class RewardedOfferScreen extends Container {
  private app: Application;

  constructor(app: Application) {
    super();
    this.app = app;
    this.visible = false;
  }

  public show(
    bonusType: RewardedBonusType,
    onWatch: () => void,
    onShop: () => void,
    onClose: () => void,
  ) {
    this.visible = true;
    this.removeChildren();

    const dimBg = new Graphics();
    dimBg.fill({ color: 0x000000, alpha: 0.82 });
    dimBg.rect(0, 0, this.app.screen.width, this.app.screen.height);
    dimBg.fill();
    dimBg.eventMode = "static";
    this.addChild(dimBg);

    const panelWidth = Math.min(this.app.screen.width * 0.86, 520);
    const panelHeight = 300;
    const panel = new Graphics();
    panel.fill({ color: 0x1a1a1a, alpha: 0.95 });
    panel.roundRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      20,
    );
    panel.fill();
    panel.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
    panel.eventMode = "static";
    this.addChild(panel);

    const title = new Text({
      text: "Нет зарядов",
      style: TITLE_STYLE,
    });
    title.anchor.set(0.5, 0);
    title.position.set(0, -panelHeight / 2 + 28);
    panel.addChild(title);

    const body = new Text({
      text:
        `Посмотри рекламу и получи +1 заряд ${BONUS_LABELS[bonusType]}.\n` +
        "Или открой магазин, чтобы купить апгрейд.",
      style: { ...BODY_STYLE, wordWrapWidth: panelWidth - 48 },
    });
    body.anchor.set(0.5, 0);
    body.position.set(0, -panelHeight / 2 + 78);
    panel.addChild(body);

    const watchButton = this.createActionButton(
      "Смотреть рекламу",
      -52,
      onWatch,
    );
    panel.addChild(watchButton);

    const shopButton = this.createActionButton("Магазин", 52, onShop);
    panel.addChild(shopButton);

    const closeButton = this.createActionButton(
      "Закрыть",
      panelHeight / 2 - 42,
      onClose,
      20,
    );
    closeButton.scale.set(0.85);
    panel.addChild(closeButton);
  }

  public hide() {
    this.visible = false;
    this.removeChildren();
  }

  public resize() {
    if (!this.visible) return;
  }

  private createActionButton(
    label: string,
    y: number,
    onClick: () => void,
    fontSize = 24,
  ) {
    const button = new Container();
    button.position.set(0, y);
    button.eventMode = "static";
    button.cursor = "pointer";

    const bg = new Graphics();
    bg.fill({ color: 0x333333, alpha: 1 });
    bg.roundRect(-150, -22, 300, 44, 14);
    bg.fill();
    button.addChild(bg);

    const text = new Text({
      text: label,
      style: { ...BUTTON_STYLE, fontSize },
    });
    text.anchor.set(0.5);
    button.addChild(text);

    button.on("pointerdown", onClick);
    return button;
  }
}
