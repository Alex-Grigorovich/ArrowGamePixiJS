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

  const [bgTexture, arrowTextures, winAssets, uiMoneyTexture, changeTexture] = await Promise.all([
    loadBackground(app),
    loadArrowTextures(app),
    loadWinAssets(app),
    Assets.load("/assets/UiMoney.png").catch(() => {
      const g = new Graphics().beginFill(0x3399ff).drawRoundedRect(0, 0, 120, 50, 25).endFill();
      return app.renderer.generateTexture(g);
    }),
    loadChangeButtonTexture(app)
  ]);

  const bgSprite = new Sprite(bgTexture);
  bgSprite.anchor.set(0.5);
  app.stage.addChildAt(bgSprite, 0);

  const levelUI = new LevelUI(1);
  const scoreUI = new ScoreUI(uiMoneyTexture);
  const winScreen = new WinScreen(app, winAssets.winTexture, winAssets.closeTexture, winAssets.starTexture);
  const changeButton = new ChangeButtonUI(changeTexture, 3, () => {
    if (game) game.activateChangeMode();
  }, -83, 40);

  const game = new GameApp(app, arrowTextures, changeButton, (points) => scoreUI.addPoints(points), () => {
    winScreen.show(() => {});
  });

  // 🔝 Z-Order: WinScreen последним → всегда поверх
  app.stage.addChild(scoreUI);
  app.stage.addChild(levelUI);
  app.stage.addChild(changeButton);
  app.stage.addChild(winScreen);

  const resizeHandler = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    bgSprite.scale.set(Math.max(width / bgTexture.width, height / bgTexture.height));
    bgSprite.position.set(width / 2, height / 2);

    const gameWidth = game.gridManager.gameWidth;
    const gameHeight = game.gridManager.gameHeight;

    // 🔽 УМЕНЬШЕНИЕ ПОЛЯ В ЛАНДШАФТЕ: увеличиваем вертикальный отступ,
    // чтобы сетка стала компактнее по высоте и освободилось место для текста "Уровень"
    const horizontalPadding = isLandscape ? 40 : 60;
    const verticalPadding = isLandscape ? 120 : 60; // 👈 Дополнительный запас для LevelUI

    const scaleX = (width - horizontalPadding) / gameWidth;
    const scaleY = (height - verticalPadding) / gameHeight;
    const gameScale = Math.min(scaleX, scaleY, 1.0);
    game.resize(width, height, gameScale);

    // Границы игрового поля
    const gridCenterX = width / 2;
    const gridCenterY = height / 2;
    const gridRight = gridCenterX + (gameWidth * gameScale) / 2;
    const gridBottom = gridCenterY + (gameHeight * gameScale) / 2;
    const gridTop = gridCenterY - (gameHeight * gameScale) / 2;

    levelUI.position.set(gridCenterX, gridTop - 30);
    scoreUI.position.set(20, 20);

    // 🔘 ОТСТУПЫ (сохранены без изменений)
    const marginPortraitBottom = 120;
    const marginLandscapeRight  = 180;

    // 🔍 КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: порог увеличен до 1100px, чтобы охватывать телефоны с шириной 915-1080px
    const isMobileRotate = isLandscape && width < 1100;

    if (isMobileRotate) {
      // 📱 Rotate (мобильные): справа от поля, по вертикальному центру
      let btnX = gridRight + marginLandscapeRight;
      btnX = Math.min(btnX, width - 60); // Защита от выхода за правый край
      changeButton.position.set(btnX, gridCenterY);
    } else {
      // 🖥️ Desktop / Portrait: снизу по центру
      let btnY = gridBottom + marginPortraitBottom;
      btnY = Math.min(btnY, height - 60); // Защита от выхода за нижний край
      changeButton.position.set(gridCenterX, btnY);
    }

    winScreen.resize();
  };

  window.addEventListener("resize", resizeHandler);
  resizeHandler();
})();