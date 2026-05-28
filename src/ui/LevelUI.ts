import { Container, Text } from "pixi.js";

export class LevelUI extends Container {
  private levelText: Text;
  private currentLevel: number;

  constructor(level: number = 1) {
    super();
    this.currentLevel = level;
    this.levelText = new Text({
      text: `Уровень: ${level}`,
      style: {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
        fontWeight: 'bold'
      }
    });
    this.levelText.anchor.set(0.5);
    this.addChild(this.levelText);
  }

  public setLevel(level: number): void {
    this.currentLevel = level;
    this.levelText.text = `Уровень: ${level}`;
  }
}