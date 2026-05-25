import { Container, Text } from "pixi.js";

export class LevelUI extends Container {
  private levelText: Text;
  private currentLevel: number;

  constructor(level: number) {
    super();
    this.currentLevel = level;
    this.levelText = new Text({
      text: `Level ${level}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 2,
        fontWeight: 'bold'
      }
    });
    this.levelText.anchor.set(0.5);
    this.addChild(this.levelText);
  }

  public setLevel(level: number) {
    this.currentLevel = level;
    this.levelText.text = `Level ${level}`;
  }
}