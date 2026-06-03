import { Application, Assets, Sprite, Graphics } from "pixi.js";
import {
  loadArrowTextures,
  loadBackground,
  loadWinAssets,
  loadChangeButtonTexture,
  loadLivesTextures,
  loadGameOverTextures,
  loadComboTextures,
  loadBombTexture 
} from "./assets/loadAssets";
import { ScoreUI } from "./ui/ScoreUI";
import { LivesUI } from "./ui/LivesUI";
import { LevelUI } from "./ui/LevelUI";
import { GameApp } from "./game/GameApp";
import { WinScreen } from "./game/WinScreen";
import { GameOverScreen } from "./game/GameOverScreen";
import { ChangeButtonUI } from "./ui/ChangeButtonUI";
import { BombUI } from "./ui/BombUI"; 

console.log("LOAD ASSETS FILE LOADED");

(async () => {
  console.log("MAIN START");
  const app = new Application();
  await app.init({ resizeTo: window, backgroundColor: 0x000000 });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  const [bgTexture, arrowTextures, winAssets, uiMoneyTexture, changeTexture, livesTextures, gameOverTextures, comboTextures, bombTexture] = await Promise.all([
    loadBackground(app),
    loadArrowTextures(app),
    loadWinAssets(app),
    Assets.load("/assets/UiMoney.png").catch(() => {
      const g = new Graphics().fill({ color: 0x3399ff }).roundRect(0, 0, 120, 50, 25).fill();
      return app.renderer.generateTexture(g);
    }),
    loadChangeButtonTexture(app),
    loadLivesTextures(app),
    loadGameOverTextures(app),
    loadComboTextures(app),
    loadBombTexture(app) 
  ]);

  const bgSprite = new Sprite(bgTexture);
  bgSprite.anchor.set(0.5);
  app.stage.addChildAt(bgSprite, 0);

  const levelUI = new LevelUI(1);
  const scoreUI = new ScoreUI(uiMoneyTexture);
  const livesUI = new LivesUI(livesTextures.life, livesTextures.blank, 3);
  
  const winScreen = new WinScreen(app, winAssets.winTexture, winAssets.closeTexture, winAssets.starTexture);
  const gameOverScreen = new GameOverScreen(app, gameOverTextures.lose, gameOverTextures.repeat);

  const changeButton = new ChangeButtonUI(changeTexture, 3, () => {
    if (game) game.activateChangeMode();
  }, -83, 40);

  const bombButton = new BombUI(bombTexture, 3, () => {
    if (game) game.activateBombMode();
  });

  const game = new GameApp(
    app,
    arrowTextures,
    changeButton,
    bombButton, 
    livesUI,
    (points) => scoreUI.addPoints(points),
    (rating: number) => {
      winScreen.show(rating, () => {
        winScreen.hide();
        setTimeout(() => { game.nextLevel(); levelUI.setLevel(game.currentLevel); }, 80);
      });
    },
    () => {
      gameOverScreen.show(() => {
        gameOverScreen.hide();
        setTimeout(() => { game.resetLevel(); levelUI.setLevel(1); }, 80);
      });
    },
    comboTextures
  );

  // Z-Order
  app.stage.addChild(scoreUI);
  app.stage.addChild(livesUI);
  app.stage.addChild(levelUI);
  app.stage.addChild(changeButton);
  app.stage.addChild(bombButton); 
  app.stage.addChild(winScreen);
  app.stage.addChild(gameOverScreen);

  const resizeHandler = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    
    bgSprite.scale.set(Math.max(width / bgTexture.width, height / bgTexture.height));
    bgSprite.position.set(width / 2, height / 2);

    const gameWidth = game.gridManager.gameWidth;
    const gameHeight = game.gridManager.gameHeight;
    
    // ✅ Настройки отступов
    const paddingPortrait = 60;
    const paddingLandscape = 40;
    const padding = isLandscape ? paddingLandscape : paddingPortrait;
    
    const scaleX = (width - padding) / gameWidth;
    const scaleY = (height - padding) / gameHeight;
    let gameScale = Math.min(scaleX, scaleY, 1.0);

    // ✅ Если rotate (ландшафт на мобильном), ограничиваем масштаб, чтобы освободить место сверху
    const isMobileRotate = isLandscape && width < 1100;
    if (isMobileRotate) {
      gameScale = Math.min(gameScale, 0.9); // Уменьшаем поле до 90% максимума
    }

    game.resize(width, height, gameScale);

    const gridCenterX = width / 2;
    const gridCenterY = height / 2;
    const gridRight = gridCenterX + (gameWidth * gameScale) / 2;
    const gridBottom = gridCenterY + (gameHeight * gameScale) / 2;
    const gridTop = gridCenterY - (gameHeight * gameScale) / 2;

    // ✅ Позиция уровня
    if (isMobileRotate) {
      // В rotate опускаем уровень чуть ниже и по центру
      levelUI.position.set(gridCenterX, gridTop - 15); 
    } else {
      levelUI.position.set(gridCenterX, gridTop - 30);
    }

    scoreUI.position.set(20, 20);
    livesUI.position.set(20, 95);

    const marginPortraitBottom = 120;
    const marginLandscapeRight = 100; // ✅ Уменьшили отступ справа для кнопок
    const buttonGap = 140; 

    if (isMobileRotate) {
      // Landscape: Кнопки справа, друг под другом
      // Сдвигаем кнопки ближе к правому краю, так как поле стало меньше
      let btnX = gridRight + marginLandscapeRight;
      // Ограничиваем, чтобы не улетали за экран
      btnX = Math.min(btnX, width - 80); 
      
      changeButton.position.set(btnX, gridCenterY - buttonGap / 2);
      bombButton.position.set(btnX, gridCenterY + buttonGap / 2);
      
    } else {
      // Portrait: Кнопки снизу, рядом
      let btnY = gridBottom + marginPortraitBottom;
      btnY = Math.min(btnY, height - 60);
      
      changeButton.position.set(gridCenterX - buttonGap / 2, btnY);
      bombButton.position.set(gridCenterX + buttonGap / 2, btnY);
    }

    winScreen.resize();
    gameOverScreen.resize();
  };

  window.addEventListener("resize", resizeHandler);
  resizeHandler();
})();