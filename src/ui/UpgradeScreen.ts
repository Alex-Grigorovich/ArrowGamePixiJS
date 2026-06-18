import {
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import {
  MVP_UPGRADE_TEXTS,
  formatShopCardText,
  SHOP_BUTTON_BUY,
  SHOP_BUTTON_MAX,
  type MvpUpgradeId,
} from "../game/upgradeTexts";
import { UpgradeManager } from "../game/Upgrades";

const PRICE_COLOR = 0xffe55f;
const TEXT_COLOR = 0xffe55f;
const ORDER: MvpUpgradeId[] = ["extraBomb", "extraChange", "coinBoost"];

const TITLE_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: TEXT_COLOR,
  stroke: { color: 0x000000, width: 2 },
  fontSize: 36,
};

const DESC_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: TEXT_COLOR,
  stroke: { color: 0x000000, width: 1.5 },
  fontSize: 18,
  lineHeight: 20,
  wordWrap: true,
};

const PRICE_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: PRICE_COLOR,
  stroke: { color: 0x000000, width: 2 },
  fontSize: 46,
};

const WALLET_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: TEXT_COLOR,
  stroke: { color: 0x000000, width: 1.5 },
  fontSize: 22,
};

export class UpgradeScreen extends Container {
  private app: Application;
  private windowTexture: Texture;
  private closeTexture: Texture;
  private buttonTextures: Record<MvpUpgradeId, Texture>;
  private onClose: () => void;
  private dimBg: Graphics | null = null;
  private windowSprite: Sprite | null = null;
  private closeButton: Sprite | null = null;
  private introOverlay: Container | null = null;
  private upgradeManager: UpgradeManager;
  private onStateChanged: () => void;
  private onUiClick: () => void;

  constructor(
    app: Application,
    windowTexture: Texture,
    closeTexture: Texture,
    buttonTextures: Record<MvpUpgradeId, Texture>,
    upgradeManager: UpgradeManager,
    onStateChanged: () => void,
    onUiClick: () => void,
    onClose: () => void,
  ) {
    super();
    this.app = app;
    this.windowTexture = windowTexture;
    this.closeTexture = closeTexture;
    this.buttonTextures = buttonTextures;
    this.upgradeManager = upgradeManager;
    this.onStateChanged = onStateChanged;
    this.onUiClick = onUiClick;
    this.onClose = onClose;
    this.visible = false;
  }

  public show(showIntro = false) {
    this.visible = true;
    this.build(true);
    if (showIntro) {
      this.showIntroOverlay();
    }
  }

  public hide() {
    this.visible = false;
    this.removeChildren();
  }

  public resize() {
    if (!this.visible) return;
    this.build(false);
  }

  private build(animateOpen = false) {
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
      (this.app.screen.width * 0.92) / this.windowTexture.width,
      (this.app.screen.height * 0.9) / this.windowTexture.height,
      1.15,
    );
    this.windowSprite.scale.set(animateOpen ? 0 : targetScale);
    if (animateOpen) {
      this.animateScale(this.windowSprite, targetScale);
    }

    this.buildContent();

    this.closeButton = new Sprite(this.closeTexture);
    this.closeButton.anchor.set(0.5);
    this.closeButton.eventMode = "static";
    this.closeButton.cursor = "pointer";
    this.closeButton.scale.set(0.62);
    this.closeButton.on("pointerdown", () => {
      this.onUiClick();
      this.hide();
      this.onClose();
    });
    this.windowSprite.addChild(this.closeButton);
    this.positionCloseButton();
  }

  private positionCloseButton() {
    if (!this.windowSprite || !this.closeButton) return;
    this.closeButton.position.set(
      this.windowTexture.width / 2 - 115,
      -this.windowTexture.height / 2 + 0,
    );
  }

  private buildContent() {
    if (!this.windowSprite) return;

    const title = new Text({ text: "Магазин", style: TITLE_STYLE });
    title.anchor.set(0.5, 0);
    title.position.set(0, -this.windowTexture.height / 2 + 22);
    this.windowSprite.addChild(title);

    const walletText = new Text({
      text: `Монеты: ${this.upgradeManager.getWallet()}`,
      style: WALLET_STYLE,
    });
    walletText.anchor.set(0.5, 0);
    walletText.position.set(0, -this.windowTexture.height / 2 + 62);
    this.windowSprite.addChild(walletText);

    const contentTop = -this.windowTexture.height / 2 + 112;
    const contentBottom = this.windowTexture.height / 2 - 52;
    const rowHeight = (contentBottom - contentTop) / ORDER.length;
    const buttonScale = 0.66;
    const priceX = -this.windowTexture.width / 2 + 162;
    const buttonX = -this.windowTexture.width / 2 + 294;
    const textX = -this.windowTexture.width / 2 + 428;
    const descWidth = this.windowTexture.width / 2 - textX - 28;

    ORDER.forEach((id, idx) => {
      const y = contentTop + rowHeight * (idx + 0.5);
      const def = MVP_UPGRADE_TEXTS[id];
      const level = this.upgradeManager.getLevel(id);
      const cost = this.upgradeManager.getCost(id);
      const canBuy = this.canBuy(id);
      const rowButtonY = y;

      const priceText = new Text({ text: `${cost}`, style: PRICE_STYLE });
      priceText.anchor.set(0.5);
      priceText.position.set(priceX, rowButtonY);
      this.windowSprite!.addChild(priceText);

      const buyButton = new Sprite(this.buttonTextures[id]);
      buyButton.anchor.set(0.5);
      buyButton.position.set(buttonX, rowButtonY);
      buyButton.scale.set(buttonScale);
      buyButton.eventMode = "static";
      buyButton.cursor = canBuy ? "pointer" : "default";
      buyButton.alpha = canBuy ? 1 : 0.65;
      buyButton.on("pointerdown", () => {
        this.onUiClick();
        if (!this.buy(id)) return;
        this.build();
        this.onStateChanged();
      });
      this.windowSprite!.addChild(buyButton);

      const buttonLabel = new Text({
        text: level >= def.maxLevel ? SHOP_BUTTON_MAX : SHOP_BUTTON_BUY,
        style: {
          ...DESC_STYLE,
          fontSize: 16,
          stroke: { color: 0x000000, width: 2 },
        },
      });
      buttonLabel.anchor.set(0.5);
      buttonLabel.position.set(buttonX, rowButtonY + 2);
      this.windowSprite!.addChild(buttonLabel);

      const description = new Text({
        text: formatShopCardText(id, level),
        style: { ...DESC_STYLE, wordWrapWidth: descWidth },
      });
      description.anchor.set(0, 0.5);
      description.position.set(textX, rowButtonY);
      this.windowSprite!.addChild(description);
    });
  }

  private showIntroOverlay() {
    if (!this.windowSprite) return;
    if (this.introOverlay) {
      this.introOverlay.destroy({ children: true });
      this.introOverlay = null;
    }

    const overlay = new Container();
    overlay.eventMode = "static";
    overlay.cursor = "pointer";

    const panel = new Graphics();
    panel.fill({ color: 0x000000, alpha: 0.82 });
    panel.roundRect(
      -this.windowTexture.width / 2 + 30,
      -this.windowTexture.height / 2 + 70,
      this.windowTexture.width - 60,
      this.windowTexture.height - 120,
      22,
    );
    panel.fill();
    overlay.addChild(panel);

    const title = new Text({
      text: "Туториал магазина",
      style: {
        ...TITLE_STYLE,
        fontSize: 34,
      },
    });
    title.anchor.set(0.5, 0);
    title.position.set(0, -this.windowTexture.height / 2 + 102);
    overlay.addChild(title);

    const body = new Text({
      text:
        "Слева — цена апгрейда.\n" +
        "В центре — кнопка покупки.\n" +
        "Справа — описание эффекта.\n\n" +
        "После покупки цена растет.",
      style: {
        ...DESC_STYLE,
        fontSize: 26,
        lineHeight: 32,
        align: "left",
        wordWrap: true,
        wordWrapWidth: this.windowTexture.width - 220,
      },
    });
    body.anchor.set(0.5, 0);
    body.position.set(0, -this.windowTexture.height / 2 + 172);
    overlay.addChild(body);

    const tapHint = new Text({
      text: "Нажми, чтобы продолжить",
      style: {
        ...DESC_STYLE,
        fontSize: 22,
        lineHeight: 28,
      },
    });
    tapHint.anchor.set(0.5, 1);
    tapHint.position.set(0, this.windowTexture.height / 2 - 46);
    overlay.addChild(tapHint);

    overlay.on("pointerdown", () => {
      this.onUiClick();
      overlay.destroy({ children: true });
      this.introOverlay = null;
    });

    this.introOverlay = overlay;
    this.windowSprite.addChild(overlay);
  }

  private canBuy(id: MvpUpgradeId): boolean {
    return this.upgradeManager.canBuy(id);
  }

  private buy(id: MvpUpgradeId): boolean {
    return this.upgradeManager.buy(id);
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
