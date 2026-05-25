import { Application, Assets, Sprite, Graphics } from "pixi.js";
import { loadArrowTextures, loadBackground, loadWinAssets, loadChangeButtonTexture } from "./assets/loadAssets";
import { ScoreUI } from "./ui/ScoreUI";
import { GameApp } from "./game/GameApp";
import { WinScreen } from "./game/WinScreen";
import { ChangeButtonUI } from "./ui/ChangeButtonUI";
import { LevelUI } from "./ui/LevelUI";

(async () => {
  const app = new Application();
  await app.init({ resizeTo: window, backgroundColor: 0x000000 });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // ✅ Гарантированная загрузка. Никаких null!
  const [bgTexture, arrowTextures, winAssets, uiMoneyTexture, changeTexture] = await Promise.all([
    loadBackground(app),
    loadArrowTextures(app),
    loadWinAssets(app),
    Assets.load("/assets/UiMoney.png").catch(() => {
      const g = new Graphics().beginFill(0x3399ff).drawRoundedRect(0, 0, 120, 50, 25).endFill();
      return app.renderer.generateTexture(g);
    }),
    loadChangeButtonTexture(app) // ← Функция уже содержит fallback
  ]);

  const bgSprite = new Sprite(bgTexture);
  bgSprite.anchor.set(0.5);
  app.stage.addChildAt(bgSprite, 0);

  const levelUI = new LevelUI(1);
  const scoreUI = new ScoreUI(uiMoneyTexture);
  const winScreen = new WinScreen(app, winAssets.winTexture, winAssets.closeTexture, winAssets.starTexture);


  const changeButton = new ChangeButtonUI(changeTexture, 3, () => {
  if (game) game.activateChangeMode();
}, -83, 40); // x=0, y=-10 (над кнопкой)

  const game = new GameApp(app, arrowTextures, changeButton, (points) => scoreUI.addPoints(points), () => {
    winScreen.show(() => {});
  });

  // 🔝 UI добавляем ПОСЛЕ игры → они будут СВЕРХУ (Z-Order)
  app.stage.addChild(winScreen);
  app.stage.addChild(changeButton);
  app.stage.addChild(scoreUI);
  app.stage.addChild(levelUI);

  const resizeHandler = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    bgSprite.scale.set(Math.max(width / bgTexture.width, height / bgTexture.height));
    bgSprite.position.set(width / 2, height / 2);

    const gameWidth = game.gridManager.gameWidth;
    const gameHeight = game.gridManager.gameHeight;
    const padding = isLandscape ? 20 : 40;
    const scaleX = (width - padding) / gameWidth;
    const scaleY = (height - padding) / gameHeight;
    const gameScale = Math.min(scaleX, scaleY, 1.2);
    game.resize(width, height, gameScale);

    const gameBottom = (height / 2) + (gameHeight * gameScale) / 2;


    const topOffset = isLandscape ? 40 : 60; // Чуть ниже прежнего
    levelUI.position.set(width / 2, topOffset);
    scoreUI.position.set(topOffset, topOffset);

    // Кнопка: под полем, но не уходит за низ экрана
    let buttonY = gameBottom + 100;
    buttonY = Math.min(buttonY, height - 40);
    changeButton.position.set(width / 2, buttonY);

    winScreen.resize();
  };

  window.addEventListener("resize", resizeHandler);
  resizeHandler();
})();