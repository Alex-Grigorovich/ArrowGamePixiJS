import { Container, Sprite, Text, Texture } from "pixi.js";

const LABEL_STYLE = {
  fontFamily: "Arial Black, Arial, sans-serif",
  fill: 0xffe55f,
  stroke: { color: 0x000000, width: 2 },
  fontSize: 16,
};

export class PauseButtonUI extends Container {
  private buttonSprite: Sprite;

  constructor(texture: Texture, onClick: () => void) {
    super();

    this.buttonSprite = new Sprite(texture);
    this.buttonSprite.anchor.set(0.5);
    this.addChild(this.buttonSprite);

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", onClick);

    const label = new Text({ text: "Пауза", style: LABEL_STYLE });
    label.anchor.set(0.5);
    this.addChild(label);
  }

  public setScale(scale: number) {
    this.buttonSprite.scale.set(scale);
  }
}
