import { Assets, Texture } from "pixi.js";
import type { Direction } from "../types/types";

export interface TextureSet {
  normal: Record<Direction, Texture>;
  bold: Record<Direction, Texture>;
}

const ASSETS = {
  background: "/assets/background.png",
  arrow2: "/assets/Arrow2.png",
  uiMoney: "/assets/UiMoney.png",
  change: "/assets/Change.png",
  bomb: "/assets/Bomb.png",
  settings: "/assets/Settings.png",
  cart: "/assets/Cart.png",
  cartBomb: "/assets/CartBomb.png",
  cartChange: "/assets/CartChange.png",
  cartCoin: "/assets/CartCoin.png",
  settingsWindow: "/assets/SettingsWindow.png",
  soundNo: "/assets/SoundNo.png",
  soundCheck: "/assets/soundCheck.png",
  pause: "/assets/Pause.png",
  pauseCenter: "/assets/PauseCenter.png",
  win: "/assets/Win.png",
  close: "/assets/Close.png",
  star: "/assets/Star.png",
  arrows: {
    std: {
      up: "/assets/ArrowUp.png",
      down: "/assets/ArrowDown.png",
      left: "/assets/arrowLeft.png",
      right: "/assets/ArrowRight.png",
    },
    stdBold: {
      up: "/assets/ArrowUp_Bold.png",
      down: "/assets/ArrowDown_Bold.png",
      left: "/assets/ArrowLeft_Bold.png",
      right: "/assets/ArrowRight_Bold.png",
    },
    orange: {
      up: "/assets/ArrowUpOrange.png",
      down: "/assets/ArrowDownOrange.png",
      left: "/assets/ArrowLeftOrange.png",
      right: "/assets/ArrowRightOrange.png",
    },
    orangeBold: {
      up: "/assets/ArrowUpOrange_Bold.png",
      down: "/assets/ArrowDownOrange_Bold.png",
      left: "/assets/ArrowLeftOrange_Bold.png",
      right: "/assets/ArrowRightOrange_Bold.png",
    },
    blue: {
      up: "/assets/ArrowUpBlue.png",
      down: "/assets/ArrowDownBlue.png",
      left: "/assets/ArrowLeftBlue.png",
      right: "/assets/ArrowRightBlue.png",
    },
    blueBold: {
      up: "/assets/ArrowUpBlue_Bold.png",
      down: "/assets/ArrowDownBlue_Bold.png",
      left: "/assets/ArrowLeftBlue_Bold.png",
      right: "/assets/ArrowRightBlue_Bold.png",
    },
    green: {
      up: "/assets/ArrowUpGreen.png",
      down: "/assets/ArrowDownGreen.png",
      left: "/assets/ArrowLeftGreen.png",
      right: "/assets/ArrowRightGreen.png",
    },
    greenBold: {
      up: "/assets/ArrowUpGreen_Bold.png",
      down: "/assets/ArrowDownGreen_Bold.png",
      left: "/assets/ArrowLeftGreen_Bold.png",
      right: "/assets/ArrowRightGreen_Bold.png",
    },
  },
} as const;

export const REQUIRED_ASSET_URLS = [
  ASSETS.background,
  ASSETS.arrow2,
  ASSETS.uiMoney,
  ASSETS.change,
  ASSETS.bomb,
  ASSETS.settings,
  ASSETS.cart,
  ASSETS.cartBomb,
  ASSETS.cartChange,
  ASSETS.cartCoin,
  ASSETS.settingsWindow,
  ASSETS.soundNo,
  ASSETS.soundCheck,
  ASSETS.pause,
  ASSETS.pauseCenter,
  ASSETS.win,
  ASSETS.close,
  ASSETS.star,
  ...Object.values(ASSETS.arrows.std),
  ...Object.values(ASSETS.arrows.stdBold),
  ...Object.values(ASSETS.arrows.orange),
  ...Object.values(ASSETS.arrows.orangeBold),
  ...Object.values(ASSETS.arrows.blue),
  ...Object.values(ASSETS.arrows.blueBold),
  ...Object.values(ASSETS.arrows.green),
  ...Object.values(ASSETS.arrows.greenBold),
];

async function loadTexture(url: string): Promise<Texture> {
  return Assets.load(url);
}

async function loadSet(
  names: Record<Direction, string>,
  boldNames: Record<Direction, string>,
): Promise<TextureSet> {
  const directions = Object.keys(names) as Direction[];
  const normal = {} as Record<Direction, Texture>;
  const bold = {} as Record<Direction, Texture>;

  await Promise.all(
    directions.map(async (dir) => {
      normal[dir] = await loadTexture(names[dir]);
      bold[dir] = await loadTexture(boldNames[dir]);
    }),
  );

  return { normal, bold };
}

export async function loadArrowTextures(): Promise<{
  std: TextureSet;
  orange: TextureSet;
  blue: TextureSet;
  green: TextureSet;
}> {
  const [std, orange, blue, green] = await Promise.all([
    loadSet(ASSETS.arrows.std, ASSETS.arrows.stdBold),
    loadSet(ASSETS.arrows.orange, ASSETS.arrows.orangeBold),
    loadSet(ASSETS.arrows.blue, ASSETS.arrows.blueBold),
    loadSet(ASSETS.arrows.green, ASSETS.arrows.greenBold),
  ]);

  return { std, orange, blue, green };
}

export function loadBackground(): Promise<Texture> {
  return loadTexture(ASSETS.background);
}

export async function loadWinAssets() {
  const [winTexture, closeTexture, starTexture] = await Promise.all([
    loadTexture(ASSETS.win),
    loadTexture(ASSETS.close),
    loadTexture(ASSETS.star),
  ]);

  return { winTexture, closeTexture, starTexture };
}

export function loadChangeButtonTexture(): Promise<Texture> {
  return loadTexture(ASSETS.change);
}

export function loadBombTexture(): Promise<Texture> {
  return loadTexture(ASSETS.bomb);
}

export function loadArrow2Texture(): Promise<Texture> {
  return loadTexture(ASSETS.arrow2);
}

export function loadUiMoneyTexture(): Promise<Texture> {
  return loadTexture(ASSETS.uiMoney);
}

export function loadSettingsTexture(): Promise<Texture> {
  return loadTexture(ASSETS.settings);
}

export function loadCartTexture(): Promise<Texture> {
  return loadTexture(ASSETS.cart);
}

export function loadCartBombTexture(): Promise<Texture> {
  return loadTexture(ASSETS.cartBomb);
}

export function loadCartChangeTexture(): Promise<Texture> {
  return loadTexture(ASSETS.cartChange);
}

export function loadCartCoinTexture(): Promise<Texture> {
  return loadTexture(ASSETS.cartCoin);
}

export function loadSettingsWindowTexture(): Promise<Texture> {
  return loadTexture(ASSETS.settingsWindow);
}

export function loadSoundNoTexture(): Promise<Texture> {
  return loadTexture(ASSETS.soundNo);
}

export function loadSoundCheckTexture(): Promise<Texture> {
  return loadTexture(ASSETS.soundCheck);
}

export function loadPauseTexture(): Promise<Texture> {
  return loadTexture(ASSETS.pause);
}

export function loadPauseCenterTexture(): Promise<Texture> {
  return loadTexture(ASSETS.pauseCenter);
}
