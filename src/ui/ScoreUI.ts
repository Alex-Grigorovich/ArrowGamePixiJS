import { Container, Sprite, Text, Texture } from "pixi.js";

export class ScoreUI extends Container {
  private scoreText: Text;
  private currentScore = 0;

  constructor(iconTexture: Texture) {
    super();
    const bg = new Sprite(iconTexture);
    bg.anchor.set(0, 0);
    this.addChild(bg);

    this.scoreText = new Text({
      text: "0",
      style: {
        fontFamily: 'Arial',
        fontSize: 28,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 3 }, // ✅ v8 синтаксис
        fontWeight: 'bold'
      }
    });
    this.scoreText.anchor.set(0.5);
    this.scoreText.position.set(bg.width / 2, bg.height / 2 - 5);
    bg.addChild(this.scoreText);
  }

  public addPoints(points: number): void {
    this.currentScore += points;
    this.scoreText.text = `${this.currentScore}`;
  }

  public reset(): void {
    this.currentScore = 0;
    this.scoreText.text = "0";
  }
}