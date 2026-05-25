import { Assets, Graphics, Texture, Application } from "pixi.js";
import type { Direction } from "../types/types";

export interface TextureSet {
  normal: Record<Direction, Texture>;
  bold: Record<Direction, Texture>;
}

export async function loadArrowTextures(app: Application): Promise<{
  std: TextureSet;
  orange: TextureSet;
  blue: TextureSet;
  green: TextureSet;
}> {
  const loadSet = async (names: Record<Direction, string>, boldNames: Record<Direction, string>) => {
    const normal: Record<Direction, Texture> = {} as any;
    const bold: Record<Direction, Texture> = {} as any;

    for (const dir of Object.keys(names) as Direction[]) {
      try {
        normal[dir] = await Assets.load(names[dir]);
      } catch {
        const g = new Graphics();
        g.beginFill(0x888888).drawCircle(0, 0, 10).endFill();
        normal[dir] = app.renderer.generateTexture(g);
      }
      try {
        bold[dir] = await Assets.load(boldNames[dir]);
      } catch {
        bold[dir] = normal[dir];
      }
    }
    return { normal, bold };
  };

  // 👇 Убраны пробелы в конце путей! Они ломали загрузку.
  const [std, orange, blue, green] = await Promise.all([
    loadSet(
      { up: "/assets/ArrowUp.png", down: "/assets/ArrowDown.png", left: "/assets/arrowLeft.png", right: "/assets/ArrowRight.png" },
      { up: "/assets/ArrowUp_Bold.png", down: "/assets/ArrowDown_Bold.png", left: "/assets/ArrowLeft_Bold.png", right: "/assets/ArrowRight_Bold.png" }
    ),
    loadSet(
      { up: "/assets/ArrowUpOrange.png", down: "/assets/ArrowDownOrange.png", left: "/assets/ArrowLeftOrange.png", right: "/assets/ArrowRightOrange.png" },
      { up: "/assets/ArrowUpOrange_Bold.png", down: "/assets/ArrowDownOrange_Bold.png", left: "/assets/ArrowLeftOrange_Bold.png", right: "/assets/ArrowRightOrange_Bold.png" }
    ),
    loadSet(
      { up: "/assets/ArrowUpBlue.png", down: "/assets/ArrowDownBlue.png", left: "/assets/ArrowLeftBlue.png", right: "/assets/ArrowRightBlue.png" },
      { up: "/assets/ArrowUpBlue_Bold.png", down: "/assets/ArrowDownBlue_Bold.png", left: "/assets/ArrowLeftBlue_Bold.png", right: "/assets/ArrowRightBlue_Bold.png" }
    ),
    loadSet(
      { up: "/assets/ArrowUpGreen.png", down: "/assets/ArrowDownGreen.png", left: "/assets/ArrowLeftGreen.png", right: "/assets/ArrowRightGreen.png" },
      { up: "/assets/ArrowUpGreen_Bold.png", down: "/assets/ArrowDownGreen_Bold.png", left: "/assets/ArrowLeftGreen_Bold.png", right: "/assets/ArrowRightGreen_Bold.png" }
    )
  ]);

  return { std, orange, blue, green };
}

export async function loadBackground(app: Application): Promise<Texture> {
  try {
    return await Assets.load("/assets/background.png");
  } catch {
    const g = new Graphics().beginFill(0x000000).drawRect(0, 0, 100, 100).endFill();
    return app.renderer.generateTexture(g);
  }
}

export async function loadWinAssets(app: Application) {
  const winTexture = await loadTextureOrDefault(app, "/assets/Win.png", () => {
    const g = new Graphics().beginFill(0xffcc00).drawRoundedRect(0, 0, 400, 200, 20).endFill();
    return app.renderer.generateTexture(g);
  });
  const closeTexture = await loadTextureOrDefault(app, "/assets/Close.png", () => {
    const g = new Graphics().beginFill(0xff0000).drawCircle(0, 0, 15).endFill();
    return app.renderer.generateTexture(g);
  });
  const starTexture = await loadTextureOrDefault(app, "/assets/Star.png", () => {
    const g = new Graphics().beginFill(0xffd700).drawPolygon([0,-30,10,-10,30,-10,15,5,20,25,0,15,-20,25,-15,5,-30,-10,-10,-10]).endFill();
    return app.renderer.generateTexture(g);
  });
  return { winTexture, closeTexture, starTexture };
}

async function loadTextureOrDefault(app: Application, url: string, fallback: () => Texture) {
  try {
    return await Assets.load(url);
  } catch {
    return fallback();
  }
}

export async function loadChangeButtonTexture(app: Application): Promise<Texture> {
  try {
    return await Assets.load("/assets/Change.png");
  } catch {
    const g = new Graphics();
    g.beginFill(0x44aa44);
    g.drawRoundedRect(0, 0, 100, 50, 10);
    g.endFill();
    return app.renderer.generateTexture(g);
  }
}