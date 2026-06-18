import { Application, Sprite } from "pixi.js";
import {
  loadArrowTextures,
  loadBackground,
  loadWinAssets,
  loadChangeButtonTexture,
  loadBombTexture,
  loadArrow2Texture,
  loadUiMoneyTexture,
  loadSettingsTexture,
  loadCartTexture,
  loadCartBombTexture,
  loadCartChangeTexture,
  loadCartCoinTexture,
  loadSettingsWindowTexture,
  loadSoundNoTexture,
  loadSoundCheckTexture,
  loadPauseTexture,
  loadPauseCenterTexture,
} from "./assets/loadAssets";
import { ScoreUI } from "./ui/ScoreUI";
import { TimerUI } from "./ui/TimerUI";
import { LevelUI } from "./ui/LevelUI";
import { GameApp, type BonusTutorialInputState } from "./game/GameApp";
import { WinScreen } from "./game/WinScreen";
import { ChangeButtonUI } from "./ui/ChangeButtonUI";
import { BombUI } from "./ui/BombUI";
import { SettingsScreen } from "./ui/SettingsScreen";
import { TutorialOverlay } from "./ui/TutorialOverlay";
import { UpgradeScreen } from "./ui/UpgradeScreen";
import { PauseScreen } from "./ui/PauseScreen";
import { PauseButtonUI } from "./ui/PauseButtonUI";
import {
  RewardedOfferScreen,
  type RewardedBonusType,
} from "./ui/RewardedOfferScreen";
import {
  DEFAULT_SAVE,
  loadSaveData,
  RESET_SAVE_ON_START,
  resetSaveData,
  saveSaveData,
  type SaveData,
  UpgradeManager,
} from "./game/Upgrades";
import { YandexGamesService } from "./platform/YandexGames";

(async () => {
  const app = new Application();
  await app.init({ resizeTo: window, backgroundColor: 0x000000 });
  document.getElementById("pixi-container")!.appendChild(app.canvas);
  const yandex = new YandexGamesService();
  await yandex.init();

  let saveData: SaveData;
  if (RESET_SAVE_ON_START) {
    resetSaveData();
    await yandex.clearSave();
    saveData = { ...DEFAULT_SAVE };
    saveSaveData(saveData);
    await yandex.saveSave(saveData);
  } else {
    const localSave: SaveData = loadSaveData();
    const remoteSave = await yandex.loadSave();
    saveData = remoteSave ?? localSave;
    if (!remoteSave) {
      await yandex.saveSave(saveData);
    }
  }
  const upgradeManager = new UpgradeManager(saveData.wallet, saveData.upgrades);

  const [
    bgTexture,
    arrowTextures,
    winAssets,
    uiMoneyTexture,
    changeTexture,
    bombTexture,
    arrow2Texture,
    settingsTexture,
    cartTexture,
    cartBombTexture,
    cartChangeTexture,
    cartCoinTexture,
    settingsWindowTexture,
    soundNoTexture,
    soundCheckTexture,
    pauseTexture,
    pauseCenterTexture,
  ] = await Promise.all([
    loadBackground(),
    loadArrowTextures(),
    loadWinAssets(),
    loadUiMoneyTexture(),
    loadChangeButtonTexture(),
    loadBombTexture(),
    loadArrow2Texture(),
    loadSettingsTexture(),
    loadCartTexture(),
    loadCartBombTexture(),
    loadCartChangeTexture(),
    loadCartCoinTexture(),
    loadSettingsWindowTexture(),
    loadSoundNoTexture(),
    loadSoundCheckTexture(),
    loadPauseTexture(),
    loadPauseCenterTexture(),
  ]);

  const bgSprite = new Sprite(bgTexture);
  bgSprite.anchor.set(0.5);
  app.stage.addChildAt(bgSprite, 0);

  const levelUI = new LevelUI(saveData.currentLevel);
  const scoreUI = new ScoreUI(uiMoneyTexture);
  scoreUI.setScore(0);
  const timerUI = new TimerUI();

  const winScreen = new WinScreen(
    app,
    winAssets.winTexture,
    winAssets.closeTexture,
    winAssets.starTexture,
  );
  const tutorialOverlay = new TutorialOverlay(app, arrow2Texture);
  const rewardedOfferScreen = new RewardedOfferScreen(app);
  let tutorialFinished = false;
  type BonusTutorialStep =
    | "change"
    | "change_select"
    | "bomb"
    | "bomb_select"
    | "done";
  let bonusTutorialStep: BonusTutorialStep | "pending" =
    saveData.currentLevel > 2 ? "done" : "pending";
  let shopTutorialSeen = saveData.shopTutorialSeen;

  let soundEnabled = saveData.settings.soundEnabled;
  let isPaused = false;

  const bgMusic = new Audio("/assets/sounds/NeonLights.mp3");
  bgMusic.loop = true;
  bgMusic.preload = "auto";
  bgMusic.volume = 0.35;
  const clickSfx = new Audio("/assets/sounds/Click.mp3");
  clickSfx.preload = "auto";
  clickSfx.volume = 0.6;
  const reverseSfx = new Audio("/assets/sounds/Reverse.mp3");
  reverseSfx.preload = "auto";
  reverseSfx.volume = 0.6;
  const bombSfx = new Audio("/assets/sounds/Bomb.mp3");
  bombSfx.preload = "auto";
  bombSfx.volume = 0.6;
  const winSfx = new Audio("/assets/sounds/Win.mp3");
  winSfx.preload = "auto";
  winSfx.volume = 0.6;
  const starSfx = new Audio("/assets/sounds/Star.mp3");
  starSfx.preload = "auto";
  starSfx.volume = 0.6;

  const tryPlayMusic = async () => {
    try {
      await bgMusic.play();
    } catch {
      // Autoplay can be blocked until first user interaction.
    }
  };

  const applySoundState = () => {
    bgMusic.muted = !soundEnabled;
    clickSfx.muted = !soundEnabled;
    reverseSfx.muted = !soundEnabled;
    bombSfx.muted = !soundEnabled;
    winSfx.muted = !soundEnabled;
    starSfx.muted = !soundEnabled;
    if (soundEnabled) {
      void tryPlayMusic();
    }
  };

  const playClick = () => {
    if (!soundEnabled) return;
    try {
      clickSfx.currentTime = 0;
      void clickSfx.play();
    } catch {
      // Ignore click sound failures on restricted environments.
    }
  };

  const playReverse = () => {
    if (!soundEnabled) return;
    try {
      reverseSfx.currentTime = 0;
      void reverseSfx.play();
    } catch {
      // Ignore reverse sound failures on restricted environments.
    }
  };

  const playBomb = () => {
    if (!soundEnabled) return;
    try {
      bombSfx.currentTime = 0;
      void bombSfx.play();
    } catch {
      // Ignore bomb sound failures on restricted environments.
    }
  };

  const playWin = () => {
    if (!soundEnabled) return;
    try {
      winSfx.currentTime = 0;
      void winSfx.play();
    } catch {
      // Ignore win sound failures on restricted environments.
    }
  };

  const playStar = () => {
    if (!soundEnabled) return;
    try {
      const sfx = starSfx.cloneNode() as HTMLAudioElement;
      sfx.volume = starSfx.volume;
      sfx.muted = starSfx.muted;
      void sfx.play();
    } catch {
      // Ignore star sound failures on restricted environments.
    }
  };

  applySoundState();
  window.addEventListener(
    "pointerdown",
    () => {
      if (soundEnabled) {
        void tryPlayMusic();
      }
    },
    { once: true },
  );

  const syncGameplayTimer = () => {
    const shouldRun =
      !isPaused &&
      !isGameplayTutorialActive() &&
      !settingsScreen.visible &&
      !upgradeScreen.visible;

    if (shouldRun) {
      timerUI.resume();
      return;
    }
    timerUI.pause();
  };

  const persist = () => {
    saveData.wallet = upgradeManager.getWallet();
    saveData.upgrades = upgradeManager.snapshotUpgrades();
    saveData.currentLevel = game?.currentLevel ?? saveData.currentLevel;
    saveData.settings.soundEnabled = soundEnabled;
    saveData.shopTutorialSeen = shopTutorialSeen;
    saveSaveData(saveData);
    void yandex.saveSave(saveData);
  };

  const isLevel1TutorialActive = () =>
    !tutorialFinished &&
    tutorialOverlay.visible &&
    game &&
    game.currentLevel === 1;

  const isBonusTutorialActive = () =>
    Boolean(
      game &&
      game.currentLevel === 2 &&
      bonusTutorialStep !== "pending" &&
      bonusTutorialStep !== "done",
    );

  const isGameplayTutorialActive = () =>
    isLevel1TutorialActive() || isBonusTutorialActive();

  const getBonusTutorialInputState = (): BonusTutorialInputState => {
    if (!game || game.currentLevel !== 2) return "free";
    if (bonusTutorialStep === "pending" || bonusTutorialStep === "done")
      return "free";
    return bonusTutorialStep;
  };

  const updateBonusTutorialControls = () => {
    // #region agent log
    fetch("http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "12c20f",
      },
      body: JSON.stringify({
        sessionId: "12c20f",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "src/main.ts:updateBonusTutorialControls",
        message: "Sync bonus tutorial controls",
        data: {
          level: game?.currentLevel ?? null,
          bonusTutorialStep,
          overlayVisible: tutorialOverlay.visible,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    if (!isBonusTutorialActive()) {
      changeButton.setInteractive(true);
      bombButton.setInteractive(true);
      return;
    }

    changeButton.setInteractive(bonusTutorialStep === "change");
    bombButton.setInteractive(bonusTutorialStep === "bomb");
  };

  const getHudTarget = (
    sprite: Sprite | { getGlobalPosition: () => { x: number; y: number } },
  ) => {
    const pos = sprite.getGlobalPosition();
    return { x: pos.x, y: pos.y };
  };

  const showBonusTutorialStep = () => {
    if (
      !game ||
      bonusTutorialStep === "pending" ||
      bonusTutorialStep === "done"
    )
      return;

    const scale = game.getGameScale();
    if (bonusTutorialStep === "change") {
      tutorialOverlay.showStep(
        {
          title: "БОНУС: РАЗВОРОТ",
          body: "Нажми «Разворот»,\nзатем выбери стрелку на поле.",
          target: getHudTarget(changeButton),
          showArrow: true,
        },
        scale,
      );
      return;
    }

    if (bonusTutorialStep === "change_select") {
      tutorialOverlay.showStep(
        {
          title: "БОНУС: РАЗВОРОТ",
          body: "Выбери стрелку на поле —\nона развернётся в другую сторону.",
          target: game.getFieldArrowScreenPosition(),
          showArrow: true,
        },
        scale,
      );
      return;
    }

    if (bonusTutorialStep === "bomb") {
      tutorialOverlay.showStep(
        {
          title: "БОНУС: БОМБА",
          body: "Нажми «Бомбу»,\nзатем выбери стрелку на поле.",
          target: getHudTarget(bombButton),
          showArrow: true,
        },
        scale,
      );
      return;
    }

    if (bonusTutorialStep === "bomb_select") {
      tutorialOverlay.showStep(
        {
          title: "БОНУС: БОМБА",
          body: "Выбери стрелку — она и сосед\nисчезнут с поля.",
          target: game.getFieldArrowScreenPosition(),
          showArrow: true,
        },
        scale,
      );
    }
  };

  const ensureBonusTutorialOnLevel2 = () => {
    if (!game || game.currentLevel !== 2) return;
    if (bonusTutorialStep === "pending") {
      bonusTutorialStep = "change";
    }
  };

  const unpause = () => {
    if (!isPaused) return;
    isPaused = false;
    pauseScreen.hide();
    game.setPaused(false);
    restorePauseButtonZOrder();
    syncGameplayTimer();
  };

  const bringPauseButtonToFront = () => {
    app.stage.addChild(pauseButton);
  };

  const restorePauseButtonZOrder = () => {
    const winIndex = app.stage.getChildIndex(winScreen);
    app.stage.addChildAt(pauseButton, winIndex);
  };

  const updateHudMenuInteractivity = () => {
    const menuBlocked = isGameplayTutorialActive() || winScreen.visible;
    settingsButton.eventMode = menuBlocked ? "none" : "static";
    shopButton.eventMode = menuBlocked ? "none" : "static";
    pauseButton.eventMode = menuBlocked ? "none" : "static";
    settingsButton.alpha = menuBlocked ? 0.65 : 1;
    shopButton.alpha = menuBlocked ? 0.65 : 1;
    pauseButton.alpha = menuBlocked ? 0.65 : 1;
    updateBonusTutorialControls();
    syncGameplayTimer();
  };

  const openUpgradeScreen = () => {
    if (isGameplayTutorialActive() || winScreen.visible) return;
    const shouldShowTutorial = !shopTutorialSeen;
    if (shouldShowTutorial) {
      shopTutorialSeen = true;
      persist();
    }
    upgradeScreen.show(shouldShowTutorial);
    syncGameplayTimer();
  };

  const grantRewardedCharge = (bonusType: RewardedBonusType) => {
    if (bonusType === "change") {
      changeButton.addCharge(1);
      return;
    }
    bombButton.addCharge(1);
  };

  const showRewardedOffer = (bonusType: RewardedBonusType) => {
    if (isGameplayTutorialActive()) return;
    rewardedOfferScreen.show(
      bonusType,
      () => {
        void (async () => {
          const rewarded = await yandex.showRewarded(() => {
            grantRewardedCharge(bonusType);
          });
          rewardedOfferScreen.hide();
          if (rewarded) {
            persist();
            return;
          }
          openUpgradeScreen();
        })();
      },
      () => {
        rewardedOfferScreen.hide();
        openUpgradeScreen();
      },
      () => {
        playClick();
        rewardedOfferScreen.hide();
      },
    );
  };

  const changeButton = new ChangeButtonUI(
    changeTexture,
    3,
    () => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "12c20f",
          },
          body: JSON.stringify({
            sessionId: "12c20f",
            runId: "pre-fix",
            hypothesisId: "H2",
            location: "src/main.ts:changeButtonPointerdown",
            message: "Change button pressed",
            data: {
              level: game?.currentLevel ?? null,
              isBonus: isBonusTutorialActive(),
              bonusTutorialStep,
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion

      if (isBonusTutorialActive() && bonusTutorialStep !== "change") return;
      playReverse();
      if (game) game.activateChangeMode();
    },
    -83,
    40,
    () => {
      showRewardedOffer("change");
    },
  );

  const bombButton = new BombUI(
    bombTexture,
    3,
    () => {
      // #region agent log
      fetch(
        "http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "12c20f",
          },
          body: JSON.stringify({
            sessionId: "12c20f",
            runId: "pre-fix",
            hypothesisId: "H2",
            location: "src/main.ts:bombButtonPointerdown",
            message: "Bomb button pressed",
            data: {
              level: game?.currentLevel ?? null,
              isBonus: isBonusTutorialActive(),
              bonusTutorialStep,
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion

      if (isBonusTutorialActive() && bonusTutorialStep !== "bomb") return;
      playBomb();
      if (game) game.activateBombMode();
    },
    () => {
      showRewardedOffer("bomb");
    },
  );

  const settingsButton = new Sprite(settingsTexture);
  settingsButton.anchor.set(0.5);
  settingsButton.eventMode = "static";
  settingsButton.cursor = "pointer";
  settingsButton.on("pointerdown", () => {
    if (isGameplayTutorialActive() || winScreen.visible) return;
    playClick();
    settingsScreen.show();
    syncGameplayTimer();
  });

  const shopButton = new Sprite(cartTexture);
  shopButton.anchor.set(0.5);
  shopButton.eventMode = "static";
  shopButton.cursor = "pointer";
  shopButton.on("pointerdown", () => {
    playClick();
    openUpgradeScreen();
  });

  const pauseScreen = new PauseScreen(app, pauseCenterTexture);
  const pauseButton = new PauseButtonUI(pauseTexture, () => {
    if (isGameplayTutorialActive() || winScreen.visible) return;
    playClick();
    if (!isPaused) {
      isPaused = true;
      pauseScreen.show();
      bringPauseButtonToFront();
      game.setPaused(true);
      syncGameplayTimer();
      return;
    }
    unpause();
  });

  const maybeShowTutorial = () => {
    ensureBonusTutorialOnLevel2();

    if (!tutorialFinished && game.currentLevel === 1) {
      tutorialOverlay.show(
        game.getTutorialArrowScreenPosition(),
        game.getGameScale(),
      );
      updateHudMenuInteractivity();
      return;
    }

    if (isBonusTutorialActive()) {
      showBonusTutorialStep();
      updateHudMenuInteractivity();
      return;
    }

    tutorialOverlay.hide();
    updateHudMenuInteractivity();
  };

  const settingsScreen = new SettingsScreen(
    app,
    settingsWindowTexture,
    winAssets.closeTexture,
    soundNoTexture,
    soundCheckTexture,
    () => {
      unpause();
      game.restartCurrentLevel();
      levelUI.setLevel(game.currentLevel);
      game.startLevel();
      maybeShowTutorial();
      persist();
    },
    soundEnabled,
    (enabled) => {
      soundEnabled = enabled;
      applySoundState();
      persist();
    },
    () => {
      syncGameplayTimer();
    },
    () => {
      playClick();
    },
  );

  const upgradeScreen = new UpgradeScreen(
    app,
    settingsWindowTexture,
    winAssets.closeTexture,
    {
      extraBomb: cartBombTexture,
      extraChange: cartChangeTexture,
      coinBoost: cartCoinTexture,
    },
    upgradeManager,
    () => {
      persist();
    },
    () => {
      playClick();
    },
    () => {
      syncGameplayTimer();
    },
  );

  const game = new GameApp(
    app,
    arrowTextures,
    changeButton,
    bombButton,
    timerUI,
    (points) => scoreUI.addPoints(points),
    (rating: number) => {
      const levelKey = String(game.currentLevel);
      const prevBest = saveData.bestStarsByLevel[levelKey] ?? 0;
      if (rating > prevBest) {
        saveData.bestStarsByLevel[levelKey] = rating;
      }

      const runScore = scoreUI.getScore();
      const earnedCoins = Math.round(
        runScore * upgradeManager.getCoinMultiplier(),
      );
      upgradeManager.addCoins(earnedCoins);
      persist();

      unpause();

      playWin();
      winScreen.show(
        rating,
        () => {
          playClick();
          updateHudMenuInteractivity();
          setTimeout(() => {
            void (async () => {
              await yandex.showInterstitial();
              game.nextLevel();
              levelUI.setLevel(game.currentLevel);
              game.startLevel();
              maybeShowTutorial();
              persist();
            })();
          }, 80);
        },
        playStar,
      );
      updateHudMenuInteractivity();
    },
    () => {
      playClick();
      if (tutorialFinished) return;
      tutorialFinished = true;
      tutorialOverlay.hide();
      updateHudMenuInteractivity();
    },
    saveData.currentLevel,
    upgradeManager,
    {
      getTutorialInputState: getBonusTutorialInputState,
      onChangeModeActivated: () => {
        // #region agent log
        fetch(
          "http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "12c20f",
            },
            body: JSON.stringify({
              sessionId: "12c20f",
              runId: "pre-fix",
              hypothesisId: "H3",
              location: "src/main.ts:onChangeModeActivated",
              message: "Change mode activated callback",
              data: {
                level: game.currentLevel,
                bonusTutorialStepBefore: bonusTutorialStep,
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion

        if (bonusTutorialStep !== "change") return;
        bonusTutorialStep = "change_select";
        showBonusTutorialStep();
        updateHudMenuInteractivity();
      },
      onChangeUsed: () => {
        // #region agent log
        fetch(
          "http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "12c20f",
            },
            body: JSON.stringify({
              sessionId: "12c20f",
              runId: "pre-fix",
              hypothesisId: "H3",
              location: "src/main.ts:onChangeUsed",
              message: "Change used callback",
              data: {
                level: game.currentLevel,
                bonusTutorialStepBefore: bonusTutorialStep,
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion

        playReverse();
        if (bonusTutorialStep !== "change_select") return;
        bonusTutorialStep = "bomb";
        showBonusTutorialStep();
        updateHudMenuInteractivity();
      },
      onBombModeActivated: () => {
        // #region agent log
        fetch(
          "http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "12c20f",
            },
            body: JSON.stringify({
              sessionId: "12c20f",
              runId: "pre-fix",
              hypothesisId: "H3",
              location: "src/main.ts:onBombModeActivated",
              message: "Bomb mode activated callback",
              data: {
                level: game.currentLevel,
                bonusTutorialStepBefore: bonusTutorialStep,
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion

        if (bonusTutorialStep !== "bomb") return;
        bonusTutorialStep = "bomb_select";
        showBonusTutorialStep();
        updateHudMenuInteractivity();
      },
      onBombUsed: () => {
        // #region agent log
        fetch(
          "http://127.0.0.1:7659/ingest/31afac71-db2f-4e5d-86fe-df135e493d13",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Debug-Session-Id": "12c20f",
            },
            body: JSON.stringify({
              sessionId: "12c20f",
              runId: "pre-fix",
              hypothesisId: "H3",
              location: "src/main.ts:onBombUsed",
              message: "Bomb used callback",
              data: {
                level: game.currentLevel,
                bonusTutorialStepBefore: bonusTutorialStep,
              },
              timestamp: Date.now(),
            }),
          },
        ).catch(() => {});
        // #endregion

        playBomb();
        if (bonusTutorialStep !== "bomb_select") return;
        bonusTutorialStep = "done";
        tutorialOverlay.hide();
        updateHudMenuInteractivity();
      },
    },
  );
  persist();

  // Z-Order: HUD buttons below overlay screens (win / settings menu)
  app.stage.addChild(scoreUI);
  app.stage.addChild(timerUI);
  app.stage.addChild(levelUI);
  app.stage.addChild(changeButton);
  app.stage.addChild(bombButton);
  app.stage.addChild(settingsButton);
  app.stage.addChild(shopButton);
  app.stage.addChild(pauseButton);
  app.stage.addChild(winScreen);
  app.stage.addChild(settingsScreen);
  app.stage.addChild(upgradeScreen);
  app.stage.addChild(rewardedOfferScreen);
  app.stage.addChild(tutorialOverlay);
  app.stage.addChild(pauseScreen);

  const resizeHandler = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    bgSprite.scale.set(
      Math.max(width / bgTexture.width, height / bgTexture.height),
    );
    bgSprite.position.set(width / 2, height / 2);

    const gameWidth = game.gridManager.gameWidth;
    const gameHeight = game.gridManager.gameHeight;
    const padding = isLandscape ? 40 : 60;
    const scaleX = (width - padding) / gameWidth;
    const scaleY = (height - padding) / gameHeight;
    let gameScale = Math.min(scaleX, scaleY, 1.0);

    const isMobileRotate = isLandscape && width < 1100;

    // ✅ Логика масштаба игры
    const hudBtnScale = isMobileRotate ? 0.45 : 0.7;
    const hudBtnX = width - 60;
    const hudBtnTopY = 60;
    const hudBtnGap = 14;

    settingsButton.scale.set(hudBtnScale);
    shopButton.scale.set(hudBtnScale);
    pauseButton.setScale(hudBtnScale);
    settingsButton.position.set(
      hudBtnX,
      hudBtnTopY + (settingsTexture.height * hudBtnScale) / 2,
    );
    shopButton.position.set(
      hudBtnX,
      settingsButton.y +
        (settingsTexture.height * hudBtnScale) / 2 +
        hudBtnGap +
        (cartTexture.height * hudBtnScale) / 2,
    );
    pauseButton.position.set(
      hudBtnX,
      shopButton.y +
        (cartTexture.height * hudBtnScale) / 2 +
        hudBtnGap +
        (pauseTexture.height * hudBtnScale) / 2,
    );

    if (isMobileRotate) {
      gameScale = Math.min(gameScale, 0.85);
      levelUI.position.set(
        width / 2,
        Math.max(20, height / 2 - (gameHeight * gameScale) / 2 - 50),
      );
    } else {
      levelUI.position.set(
        width / 2,
        height / 2 - (gameHeight * gameScale) / 2 - 80,
      );
    }

    game.resize(width, height, gameScale);

    const gridCenterX = width / 2;
    const gridCenterY = height / 2;
    const gridRight = gridCenterX + (gameWidth * gameScale) / 2;
    const gridBottom = gridCenterY + (gameHeight * gameScale) / 2;

    scoreUI.position.set(20, 20);
    timerUI.position.set(40, 95);

    const marginPortraitBottom = 120;
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
    settingsScreen.resize();
    upgradeScreen.resize();
    pauseScreen.resize();
    if (tutorialOverlay.visible) {
      if (isLevel1TutorialActive()) {
        tutorialOverlay.updateTarget(
          game.getTutorialArrowScreenPosition(),
          game.getGameScale(),
        );
      } else if (isBonusTutorialActive()) {
        showBonusTutorialStep();
      } else {
        tutorialOverlay.resize();
      }
    } else {
      tutorialOverlay.resize();
    }
  };

  window.addEventListener("resize", resizeHandler);
  resizeHandler();
  yandex.markLoadingReady();
  game.startLevel();
  maybeShowTutorial();
})();
