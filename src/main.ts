import { Application, Assets, Sprite, Graphics } from "pixi.js";
import {
  loadArrowTextures,
  loadBackground,
  loadWinAssets,
  loadChangeButtonTexture,
  loadLivesTextures,
  loadGameOverTextures,
  loadComboTextures,
  loadBombTexture,
  loadSettingsTexture 
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

  const [bgTexture, arrowTextures, winAssets, uiMoneyTexture, changeTexture, livesTextures, gameOverTextures, comboTextures, bombTexture, settingsTexture] = await Promise.all([
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
    loadBombTexture(app),
    loadSettingsTexture(app) 
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

  // ✅ Создаем кнопку Settings
  const settingsButton = new Sprite(settingsTexture);
  settingsButton.anchor.set(0.5);
  settingsButton.scale.set(0.7); 
  settingsButton.eventMode = "static";
  settingsButton.cursor = "pointer";
  settingsButton.on("pointerdown", () => {
    console.log("Settings clicked!");
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
  app.stage.addChild(settingsButton); 

  const resizeHandler = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    
    bgSprite.scale.set(Math.max(width / bgTexture.width, height / bgTexture.height));
    bgSprite.position.set(width / 2, height / 2);

    const gameWidth = game.gridManager.gameWidth;
    const gameHeight = game.gridManager.gameHeight;
    const padding = isLandscape ? 40 : 60;
    const scaleX = (width - padding) / gameWidth;
    const scaleY = (height - padding) / gameHeight;
    let gameScale = Math.min(scaleX, scaleY, 1.0);

    const isMobileRotate = isLandscape && width < 1100;

    // ✅ Логика масштаба игры
    if (isMobileRotate) {
      gameScale = Math.min(gameScale, 0.85); 
      settingsButton.scale.set(0.45);
      levelUI.position.set(width / 2, Math.max(20, (height / 2 - (gameHeight * gameScale) / 2) - 20));
    } else {
      settingsButton.scale.set(0.7);
      levelUI.position.set(width / 2, (height / 2 - (gameHeight * gameScale) / 2) - 30);
    }

    game.resize(width, height, gameScale);

    const gridCenterX = width / 2;
    const gridCenterY = height / 2;
    const gridRight = gridCenterX + (gameWidth * gameScale) / 2;
    const gridBottom = gridCenterY + (gameHeight * gameScale) / 2;

    scoreUI.position.set(20, 20);
    livesUI.position.set(20, 95);
    settingsButton.position.set(width - 60, 60);

    const marginPortraitBottom = 120;
    const marginLandscapeRight = 100; 
    const buttonGap = 140;

    if (isMobileRotate) {
      // ✅ Rotate-режим (без изменений, как ты просил)
      changeButton.scale.set(0.6);
      bombButton.scale.set(0.6);
      
      let btnX = gridRight + 60; 
      btnX = Math.min(btnX, width - 50);
      
      changeButton.position.set(btnX, gridCenterY - buttonGap / 2);
      bombButton.position.set(btnX, gridCenterY + buttonGap / 2);
      
    } else {
      // ✅ Обычный (портретный) режим: кнопки уменьшены наполовину
      
      // 1. Уменьшаем кнопки до 0.5
      changeButton.scale.set(0.8);
      bombButton.scale.set(0.8);

      // 2. Увеличиваем отступ между ними, чтобы они не слипались
      const portraitButtonGap = 160; 

      let btnY = gridBottom + marginPortraitBottom;
      btnY = Math.min(btnY, height - 60);
      
      // Центрируем пару кнопок
      changeButton.position.set(gridCenterX - portraitButtonGap / 2, btnY);
      bombButton.position.set(gridCenterX + portraitButtonGap / 2, btnY);
    }

    winScreen.resize();
    gameOverScreen.resize();
  };

  window.addEventListener("resize", resizeHandler);
  resizeHandler();
})();