import { Container, Text } from "pixi.js";

export function getDifficultyName(level: number): string {
  if (level <= 3) return "Легко";
  if (level <= 7) return "Нормально";
  if (level <= 12) return "Сложно";
  return "ЭКСПЕРТ";
}

export function getDifficultyColor(level: number): number {
  if (level <= 3) return 0x00ff00;
  if (level <= 7) return 0xffff00;
  if (level <= 12) return 0xff8800;
  return 0xff0000;
}

export class LevelUI extends Container {
  private levelText: Text;
  private difficultyText: Text; // ✅ Новая строка

  constructor(level: number = 1) {
    super();

    // Основной текст уровня
    this.levelText = new Text({
      text: `Уровень: ${level}`,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
        fontWeight: "bold",
      },
    });
    this.levelText.anchor.set(0.5);
    this.addChild(this.levelText);

    // ✅ Текст сложности (под уровнем)
    this.difficultyText = new Text({
      text: getDifficultyName(level),
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fill: 0xffd700, // Золотистый цвет
        stroke: { color: 0x000000, width: 1 },
        fontWeight: "bold",
      },
    });
    this.difficultyText.anchor.set(0.5);
    this.difficultyText.position.set(0, 30); // Сдвигаем вниз
    this.addChild(this.difficultyText);
  }

  public setLevel(level: number): void {
    this.levelText.text = `Уровень: ${level}`;
    this.difficultyText.text = getDifficultyName(level);
    this.difficultyText.style.fill = getDifficultyColor(level);
  }
}
