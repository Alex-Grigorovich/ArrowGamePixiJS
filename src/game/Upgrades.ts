import { type MvpUpgradeId } from "./upgradeTexts";

export type UpgradeId = MvpUpgradeId;

interface UpgradeDef {
  id: UpgradeId;
  maxLevel: number;
  baseCost: number;
  growth: number;
}

const UPGRADE_DEFS: Record<UpgradeId, UpgradeDef> = {
  extraBomb: { id: "extraBomb", maxLevel: 3, baseCost: 120, growth: 1.8 },
  extraChange: { id: "extraChange", maxLevel: 3, baseCost: 100, growth: 1.8 },
  coinBoost: { id: "coinBoost", maxLevel: 5, baseCost: 150, growth: 1.6 },
};

const UPGRADE_IDS: UpgradeId[] = ["extraBomb", "extraChange", "coinBoost"];
const SAVE_KEY = "arrowpixi_save";

/**
 * Переключатель сброса прогресса.
 * true — при следующем запуске удалить сейв и начать с 1 уровня.
 * После проверки верни false, иначе сброс будет при каждом запуске.
 */
export const RESET_SAVE_ON_START = false;

export interface SaveData {
  currentLevel: number;
  bestStarsByLevel: Record<string, number>;
  settings: {
    soundEnabled: boolean;
  };
  wallet: number;
  upgrades: Record<UpgradeId, number>;
  shopTutorialSeen: boolean;
}

export const DEFAULT_SAVE: SaveData = {
  currentLevel: 1,
  bestStarsByLevel: {},
  settings: {
    soundEnabled: true,
  },
  wallet: 0,
  upgrades: {
    extraBomb: 0,
    extraChange: 0,
    coinBoost: 0,
  },
  shopTutorialSeen: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toObject(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object")
    return input as Record<string, unknown>;
  return {};
}

function parseBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function parseLevel(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value));
}

function parseWallet(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

function parseUpgradeLevel(id: UpgradeId, value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return clamp(Math.floor(value), 0, UPGRADE_DEFS[id].maxLevel);
}

function parseBestStarsMap(input: unknown): Record<string, number> {
  const raw = toObject(input);
  const result: Record<string, number> = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return;
    result[key] = clamp(Math.floor(value), 1, 3);
  });
  return result;
}

export function normalizeSaveData(raw: unknown): SaveData {
  const source = toObject(raw);
  const settings = toObject(source.settings);
  const upgrades = toObject(source.upgrades);

  return {
    currentLevel: parseLevel(source.currentLevel, DEFAULT_SAVE.currentLevel),
    bestStarsByLevel: parseBestStarsMap(source.bestStarsByLevel),
    settings: {
      soundEnabled: parseBool(
        settings.soundEnabled,
        DEFAULT_SAVE.settings.soundEnabled,
      ),
    },
    wallet: parseWallet(source.wallet, DEFAULT_SAVE.wallet),
    upgrades: {
      extraBomb: parseUpgradeLevel("extraBomb", upgrades.extraBomb),
      extraChange: parseUpgradeLevel("extraChange", upgrades.extraChange),
      coinBoost: parseUpgradeLevel("coinBoost", upgrades.coinBoost),
    },
    shopTutorialSeen: parseBool(
      source.shopTutorialSeen,
      DEFAULT_SAVE.shopTutorialSeen,
    ),
  };
}

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    return normalizeSaveData(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveSaveData(data: SaveData): void {
  localStorage.setItem(SAVE_KEY, JSON.stringify(normalizeSaveData(data)));
}

export function resetSaveData(): void {
  localStorage.removeItem(SAVE_KEY);
}

export class UpgradeManager {
  private wallet: number;
  private upgrades: Record<UpgradeId, number>;

  constructor(
    initialWallet: number,
    initialUpgrades: Record<UpgradeId, number>,
  ) {
    this.wallet = Math.max(0, Math.floor(initialWallet));
    this.upgrades = { ...initialUpgrades };
    UPGRADE_IDS.forEach((id) => {
      this.upgrades[id] = clamp(
        Math.floor(this.upgrades[id] ?? 0),
        0,
        UPGRADE_DEFS[id].maxLevel,
      );
    });
  }

  public getWallet(): number {
    return this.wallet;
  }

  public setWallet(value: number): void {
    this.wallet = Math.max(0, Math.floor(value));
  }

  public addCoins(amount: number): number {
    if (!Number.isFinite(amount)) return this.wallet;
    this.wallet = Math.max(0, Math.floor(this.wallet + amount));
    return this.wallet;
  }

  public getLevel(id: UpgradeId): number {
    return this.upgrades[id];
  }

  public getCost(id: UpgradeId): number {
    const def = UPGRADE_DEFS[id];
    const level = this.getLevel(id);
    return Math.round(def.baseCost * Math.pow(def.growth, level));
  }

  public isMaxed(id: UpgradeId): boolean {
    return this.getLevel(id) >= UPGRADE_DEFS[id].maxLevel;
  }

  public canBuy(id: UpgradeId): boolean {
    if (this.isMaxed(id)) return false;
    return this.wallet >= this.getCost(id);
  }

  public buy(id: UpgradeId): boolean {
    if (!this.canBuy(id)) return false;
    this.wallet -= this.getCost(id);
    this.upgrades[id] += 1;
    return true;
  }

  public getBonusBonus(): { change: number; bomb: number } {
    return {
      change: this.getLevel("extraChange"),
      bomb: this.getLevel("extraBomb"),
    };
  }

  public getCoinMultiplier(): number {
    return 1 + this.getLevel("coinBoost") * 0.2;
  }

  public snapshotUpgrades(): Record<UpgradeId, number> {
    return { ...this.upgrades };
  }
}
