import { Container, Sprite, Texture } from "pixi.js";

export class LivesUI extends Container {
  private sprites: Sprite[] = [];
  private lifeTexture: Texture;
  private blankTexture: Texture;
  private lives: number;

  constructor(lifeTexture: Texture, blankTexture: Texture, initialLives: number = 3) {
    super();
    this.lifeTexture = lifeTexture;
    this.blankTexture = blankTexture;
    this.lives = initialLives;

    const spacing = 44; // Расстояние между иконками
    for (let i = 0; i < 3; i++) {
      const sprite = new Sprite(i < this.lives ? this.lifeTexture : this.blankTexture);
      sprite.anchor.set(0);
      sprite.scale.set(0.5); // Размер спрайта
      sprite.position.set(i * spacing, 0);
      this.sprites.push(sprite);
      this.addChild(sprite);
    }
  }

  public loseLife(): boolean {
    if (this.lives <= 0) return false;
    this.lives--;
    this.sprites[this.lives].texture = this.blankTexture;
    return this.lives === 0;
  }

  public reset(): void {
    this.lives = 3;
    this.sprites.forEach((s) => { s.texture = this.lifeTexture; });
  }

  public getRemainingLives(): number { return this.lives; }
}