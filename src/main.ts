import { Application, Assets, Sprite, Texture, Container, Graphics, Text } from "pixi.js";

type Direction = "up" | "down" | "left" | "right";

interface ArrowData {
  sprite: Sprite;
  direction: Direction;
  color: string;
  row: number;
  col: number;
  isFlying: boolean;
}

(async () => {
  const app = new Application();
  await app.init({
    resizeTo: window,
    backgroundColor: 0x000000,
  });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // --- UI (очки) ---
  const uiContainer = new Container();
  app.stage.addChild(uiContainer);

  let uiMoneyTexture: Texture;
  try {
    uiMoneyTexture = await Assets.load("/assets/UiMoney.png");
  } catch (e) {
    const graphics = new Graphics();
    graphics.beginFill(0x3399ff);
    graphics.drawRoundedRect(0, 0, 120, 50, 25);
    graphics.endFill();
    uiMoneyTexture = app.renderer.generateTexture(graphics);
  }

  const uiMoneySprite = new Sprite(uiMoneyTexture);
  uiContainer.addChild(uiMoneySprite);

  let score = 0;
  const scoreText = new Text(`${score}`, {
    fontFamily: 'Arial',
    fontSize: 28,
    fill: 0xffffff,
    stroke: 0x000000,
    strokeThickness: 3,
    fontWeight: 'bold',
  });

  scoreText.anchor.set(0.5);
  scoreText.position.set(uiMoneySprite.width / 2, uiMoneySprite.height / 2 - 5);
  uiMoneySprite.addChild(scoreText);

  const updateScoreUI = () => { scoreText.text = `${score}`; };
  const addScore = (points: number) => { score += points; updateScoreUI(); };

  // --- ФОН ---
  const bgTexture = await Assets.load("/assets/background.png");
  const bgSprite = new Sprite(bgTexture);
  bgSprite.anchor.set(0.5);
  app.stage.addChildAt(bgSprite, 0);

  // --- ИГРОВОЙ КОНТЕЙНЕР ---
  const gameContainer = new Container();
  app.stage.addChild(gameContainer);

  // ✅ ИСПРАВЛЕНИЕ СЛОЕВ: Сначала точки, потом стрелки.
  // Так как PixiJS рендерит дочерние элементы по порядку добавления,
  // arrowsContainer (добавлен вторым) будет отрисовываться ПОВЕРХ dotsContainer.
  const dotsContainer = new Container();
  gameContainer.addChild(dotsContainer);
  
  const arrowsContainer = new Container();
  gameContainer.addChild(arrowsContainer);

  const gridSize = 4;
  const tileSize = 80;
  const spacing = 10;
  const gameWidth = gridSize * (tileSize + spacing) - spacing;
  const gameHeight = gridSize * (tileSize + spacing) - spacing;
  const MAX_GAME_SCALE = 1.1;
  const arrows: ArrowData[] = [];

  const directions: Record<Direction, { x: number; y: number }> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  // --- ЗАГРУЗКА ТЕКСТУР СТРЕЛОК ---
  const loadTextureSet = async (names: Record<Direction, string>, boldNames: Record<Direction, string>) => {
    const normal: Record<Direction, Texture> = {} as any;
    const bold: Record<Direction, Texture> = {} as any;
    for (const dir of Object.keys(names) as Direction[]) {
      try { normal[dir] = await Assets.load(names[dir]); }
      catch (e) {
        const g = new Graphics(); g.beginFill(0x888888); g.drawCircle(0, 0, 10); g.endFill();
        normal[dir] = app.renderer.generateTexture(g);
      }
      try { bold[dir] = await Assets.load(boldNames[dir]); }
      catch (e) { bold[dir] = normal[dir]; }
    }
    return { normal, bold };
  };

  const [stdTex, orangeTex, blueTex, greenTex] = await Promise.all([
    loadTextureSet(
      { up: "/assets/ArrowUp.png", down: "/assets/ArrowDown.png", left: "/assets/arrowLeft.png", right: "/assets/ArrowRight.png" },
      { up: "/assets/ArrowUp_Bold.png", down: "/assets/ArrowDown_Bold.png", left: "/assets/ArrowLeft_Bold.png", right: "/assets/ArrowRight_Bold.png" }
    ),
    loadTextureSet(
      { up: "/assets/ArrowUpOrange.png", down: "/assets/ArrowDownOrange.png", left: "/assets/ArrowLeftOrange.png", right: "/assets/ArrowRightOrange.png" },
      { up: "/assets/ArrowUpOrange_Bold.png", down: "/assets/ArrowDownOrange_Bold.png", left: "/assets/ArrowLeftOrange_Bold.png", right: "/assets/ArrowRightOrange_Bold.png" }
    ),
    loadTextureSet(
      { up: "/assets/ArrowUpBlue.png", down: "/assets/ArrowDownBlue.png", left: "/assets/ArrowLeftBlue.png", right: "/assets/ArrowRightBlue.png" },
      { up: "/assets/ArrowUpBlue_Bold.png", down: "/assets/ArrowDownBlue_Bold.png", left: "/assets/ArrowLeftBlue_Bold.png", right: "/assets/ArrowRightBlue_Bold.png" }
    ),
    loadTextureSet(
      { up: "/assets/ArrowUpGreen.png", down: "/assets/ArrowDownGreen.png", left: "/assets/ArrowLeftGreen.png", right: "/assets/ArrowRightGreen.png" },
      { up: "/assets/ArrowUpGreen_Bold.png", down: "/assets/ArrowDownGreen_Bold.png", left: "/assets/ArrowLeftGreen_Bold.png", right: "/assets/ArrowRightGreen_Bold.png" }
    )
  ]);

  // --- ЗАГРУЗКА WIN, CLOSE И STAR ---
  let winTexture: Texture;
  try { winTexture = await Assets.load("/assets/Win.png"); }
  catch (e) {
    const g = new Graphics(); g.beginFill(0xffcc00); g.drawRoundedRect(0, 0, 400, 200, 20); g.endFill();
    winTexture = app.renderer.generateTexture(g);
  }

  let closeTexture: Texture;
  try { closeTexture = await Assets.load("/assets/Close.png"); }
  catch (e) {
    const g = new Graphics(); g.beginFill(0xff0000); g.drawCircle(0, 0, 15); g.endFill();
    closeTexture = app.renderer.generateTexture(g);
  }

  let starTexture: Texture;
  try { starTexture = await Assets.load("/assets/Star.png"); }
  catch (e) {
    const g = new Graphics(); g.beginFill(0xffd700); g.drawPolygon([0,-30, 10,-10, 30,-10, 15,5, 20,25, 0,15, -20,25, -15,5, -30,-10, -10,-10]); g.endFill();
    starTexture = app.renderer.generateTexture(g);
  }

  // ⭐ Рейтинг
  const WIN_RATING = 3;

  // --- КОНФИГУРАЦИЯ УРОВНЯ ---
  const originalConfig: { direction: Direction; color: string }[][] = [
    [{ direction: "left", color: "green" }, { direction: "down", color: "green" }, { direction: "right", color: "red" }, { direction: "up", color: "red" }],
    [{ direction: "left", color: "red" }, { direction: "down", color: "red" }, { direction: "down", color: "red" }, { direction: "up", color: "red" }],
    [{ direction: "up", color: "purple" }, { direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "up", color: "purple" }],
    [{ direction: "right", color: "purple" }, { direction: "down", color: "purple" }, { direction: "right", color: "purple" }, { direction: "up", color: "purple" }]
  ];

  const cells: { row: number; col: number; direction: Direction; originalColor: string; color?: string }[] = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      cells.push({ row, col, direction: originalConfig[row][col].direction, originalColor: originalConfig[row][col].color });
    }
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  const colors = ["standard", "orange", "blue", "green"];
  const colorCounts: Record<string, number> = { standard: 4, orange: 4, blue: 4, green: 4 };
  const colorPool: string[] = [];
  for (const [color, count] of Object.entries(colorCounts)) {
    for (let i = 0; i < count; i++) colorPool.push(color);
  }
  for (let i = colorPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [colorPool[i], colorPool[j]] = [colorPool[j], colorPool[i]];
  }

  for (let i = 0; i < cells.length; i++) {
    cells[i].color = colorPool[i];
  }

  const levelConfig: { direction: Direction; color: string }[][] = Array(gridSize).fill(null).map(() => Array(gridSize));
  for (const cell of cells) {
    levelConfig[cell.row][cell.col] = { direction: cell.direction, color: cell.color! };
  }

  // --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
  const createDot = (x: number, y: number, color: string) => {
    const dot = new Graphics();
    const colorMap: Record<string, number> = { standard: 0xf87171, orange: 0xffa500, blue: 0x3b82f6, green: 0x22c55e };
    dot.beginFill(colorMap[color] || 0xffffff);
    dot.drawCircle(0, 0, 8);
    dot.endFill();
    dot.position.set(x, y);
    dotsContainer.addChild(dot);
  };

  const hasObstacle = (startRow: number, startCol: number, dir: Direction, currentArrows: ArrowData[]): boolean => {
    const delta = directions[dir];
    let checkRow = startRow + delta.y;
    let checkCol = startCol + delta.x;
    while (checkRow >= 0 && checkRow < gridSize && checkCol >= 0 && checkCol < gridSize) {
      const obstacle = currentArrows.find(a => a.row === checkRow && a.col === checkCol && !a.isFlying);
      if (obstacle) return true;
      checkRow += delta.y;
      checkCol += delta.x;
    }
    return false;
  };

  const startX = -gameWidth / 2 + tileSize / 2;
  const startY = -gameHeight / 2 + tileSize / 2;
  const BASE_WIDTH = tileSize * 0.7;

  // --- ЭКРАН ПОБЕДЫ ---
  let winOverlay: Container | null = null;
  let winSprite: Sprite | null = null;
  let dimBackground: Graphics | null = null;

  const showWinScreen = () => {
    gameContainer.interactiveChildren = false;
    gameContainer.eventMode = "none";

    dimBackground = new Graphics();
    dimBackground.beginFill(0x000000, 0.7);
    dimBackground.drawRect(0, 0, app.screen.width, app.screen.height);
    dimBackground.endFill();
    dimBackground.eventMode = "static";
    app.stage.addChild(dimBackground);

    winOverlay = new Container();
    winSprite = new Sprite(winTexture);
    winSprite.anchor.set(0.5);
    winOverlay.addChild(winSprite);

    // --- НАСТРОЙКИ ПОЛОЖЕНИЯ ЗВЕЗД (сохранены) ---
    const starY = 70;
    const starLeftOffset = -270; 
    const starRightOffset = 285; 
    const targetStarWidth = 270; // Размер звезд

    const starXPositions = [starLeftOffset, 0, starRightOffset];

    for (let i = 0; i < 3; i++) {
      const star = new Sprite(starTexture);
      star.anchor.set(0.5);
      star.position.set(starXPositions[i], starY);
      
      const starScale = targetStarWidth / starTexture.width;
      star.scale.set(starScale);
      star.alpha = 1;
      star.tint = 0xffffff;
      
      if (i >= WIN_RATING) {
        star.alpha = 0.3;
        star.tint = 0x888888;
      }
      winSprite.addChild(star);
    }

    // --- КНОПКА ЗАКРЫТИЯ (сохранены отступы) ---
    const closeBtn = new Sprite(closeTexture);
    closeBtn.anchor.set(0.5);
    const closeMarginX = 160; // Отступ справа
    const closeMarginY = 190; // Отступ сверху
    
    closeBtn.position.set(winSprite.width / 2 - closeMarginX, -winSprite.height / 2 + closeMarginY);
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.on("pointerdown", () => {
      if (winOverlay) winOverlay.visible = false;
      if (dimBackground) dimBackground.visible = false;
      gameContainer.interactiveChildren = true;
      gameContainer.eventMode = "auto";
    });
    winSprite.addChild(closeBtn);

    app.stage.addChild(winOverlay);

    const scale = Math.min(app.screen.width * 0.8 / winTexture.width, app.screen.height * 0.8 / winTexture.height, 1.5);
    winSprite.scale.set(scale);
    winOverlay.position.set(app.screen.width / 2, app.screen.height / 2);

    winSprite.scale.set(0);
    let startTime = performance.now();
    const duration = 600;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      if (winSprite) winSprite.scale.set(scale * easeProgress);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  };

  // --- СОЗДАНИЕ СТРЕЛОК ---
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const config = levelConfig[row][col];
      const direction = config.direction;
      const color = config.color;

      const texSet = color === "orange" ? orangeTex : color === "blue" ? blueTex : color === "green" ? greenTex : stdTex;
      const normalTex = texSet.normal[direction];
      const boldTex = texSet.bold[direction];

      const arrow = new Sprite(normalTex);
      const x = startX + col * (tileSize + spacing);
      const y = startY + row * (tileSize + spacing);

      let targetNormalWidth = BASE_WIDTH;
      let targetBoldWidth = BASE_WIDTH;
      if (color === "blue") {
        targetNormalWidth = BASE_WIDTH * 1.2;
        targetBoldWidth = BASE_WIDTH * 1.2;
      }

      const baseScaleNormal = targetNormalWidth / normalTex.width;
      const baseScaleBold = targetBoldWidth / boldTex.width;

      arrow.scale.set(baseScaleNormal);
      arrow.anchor.set(0.5);
      arrow.position.set(x, y);
      arrow.eventMode = "static";
      arrow.cursor = "pointer";

      const arrowData: ArrowData = { sprite: arrow, direction, color, row, col, isFlying: false };

      arrow.on("pointerover", () => {
        if (arrowData.isFlying) return;
        arrow.texture = boldTex;
        arrow.scale.set(baseScaleBold * 1.2);
      });
      arrow.on("pointerleave", () => {
        if (arrowData.isFlying) return;
        arrow.texture = normalTex;
        arrow.scale.set(baseScaleNormal);
      });

      arrow.on("pointerdown", () => {
        if (arrowData.isFlying) return;
        if (hasObstacle(row, col, direction, arrows)) {
          arrow.x += 5;
          setTimeout(() => { arrow.x -= 5; }, 50);
          setTimeout(() => { arrow.x += 5; }, 100);
          setTimeout(() => { arrow.x -= 5; }, 150);
          return;
        }

        arrowData.isFlying = true;
        arrow.texture = boldTex;
        arrow.scale.set(baseScaleBold);
        createDot(x, y, color);

        const delta = directions[direction];
        const flightDistance = 300;
        const duration = 500;
        const startTime = Date.now();
        const startX_pos = arrow.x;
        const startY_pos = arrow.y;

        const animateFlight = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          arrow.x = startX_pos + delta.x * flightDistance * easeProgress;
          arrow.y = startY_pos + delta.y * flightDistance * easeProgress;
          arrow.alpha = 1 - progress * 0.5;

          if (progress < 1) {
            requestAnimationFrame(animateFlight);
          } else {
            addScore(1);
            arrowsContainer.removeChild(arrow);
            const idx = arrows.indexOf(arrowData);
            if (idx > -1) arrows.splice(idx, 1);
            if (arrows.length === 0) {
              setTimeout(() => showWinScreen(), 100);
            }
          }
        };
        animateFlight();
      });

      arrowsContainer.addChild(arrow);
      arrows.push(arrowData);
    }
  }

  // --- АДАПТАЦИЯ ---
  const resizeGame = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const bgScale = Math.max(width / bgTexture.width, height / bgTexture.height);
    bgSprite.scale.set(bgScale);
    bgSprite.position.set(width / 2, height / 2);

    const padding = 40;
    const scaleX = (width - padding) / gameWidth;
    const scaleY = (height - padding) / gameHeight;
    const gameScale = Math.min(scaleX, scaleY, MAX_GAME_SCALE);

    gameContainer.scale.set(gameScale);
    gameContainer.position.set(width / 2, height / 2);
    uiContainer.position.set(20, 20);

    if (winOverlay && winSprite) {
      winOverlay.position.set(app.screen.width / 2, app.screen.height / 2);
      if (dimBackground) {
        dimBackground.clear();
        dimBackground.beginFill(0x000000, 0.7);
        dimBackground.drawRect(0, 0, app.screen.width, app.screen.height);
        dimBackground.endFill();
      }
    }
  };

  window.addEventListener("resize", resizeGame);
  window.addEventListener("orientationchange", () => setTimeout(resizeGame, 100));
  resizeGame();
})();