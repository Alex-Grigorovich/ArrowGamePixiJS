export type MvpUpgradeId = "extraChange" | "extraBomb" | "coinBoost";

export interface UpgradeTextDef {
  id: MvpUpgradeId;
  title: string;
  description: string;
  /** Короткий текст для карточки магазина (с переносами строк) */
  shopDescription: string;
  /** Статическая подпись эффекта на карточке */
  effectSummary: string;
  maxLevel: number;
  formatCurrentEffect: (level: number) => string;
  formatNextEffect: (nextLevel: number) => string;
}

export const SHOP_SCREEN_TITLE = "Магазин";

export const SHOP_BUTTON_BUY = "Купить";
export const SHOP_BUTTON_MAX = "Максимум";

function pluralCharges(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} заряд`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return `${n} заряда`;
  return `${n} зарядов`;
}

export const MVP_UPGRADE_TEXTS: Record<MvpUpgradeId, UpgradeTextDef> = {
  extraChange: {
    id: "extraChange",
    title: "Заряды «Разворот»",
    description:
      "Дополнительные заряды бонуса «Разворот» в начале каждого уровня. Разверни стрелку, если путь в другую сторону выгоднее.",
    shopDescription:
      "Дополнительные заряды бонуса «Разворот»\nв начале каждого уровня.\nРазверни стрелку, если путь\nв другую сторону выгоднее.",
    effectSummary: "+1 заряд «Разворот» за уровень улучшения (макс. +3)",
    maxLevel: 3,
    formatCurrentEffect: (level) =>
      level === 0
        ? "Сейчас: базовый запас"
        : `Сейчас: +${pluralCharges(level)} к запасу «Разворот»`,
    formatNextEffect: (nextLevel) =>
      `После покупки: +${pluralCharges(nextLevel)} на старте уровня`,
  },
  extraBomb: {
    id: "extraBomb",
    title: "Заряды «Бомба»",
    description:
      "Больше бомб на старте уровня. Убирай лишние стрелки одним взрывом и расчищай поле быстрее.",
    shopDescription:
      "Больше бомб на старте уровня.\nУбирай лишние стрелки одним\nвзрывом и расчищай поле быстрее.",
    effectSummary: "+1 заряд «Бомба» за уровень улучшения (макс. +3)",
    maxLevel: 3,
    formatCurrentEffect: (level) =>
      level === 0
        ? "Сейчас: базовый запас"
        : `Сейчас: +${pluralCharges(level)} к запасу «Бомба»`,
    formatNextEffect: (nextLevel) =>
      `После покупки: +${pluralCharges(nextLevel)} на старте уровня`,
  },
  coinBoost: {
    id: "coinBoost",
    title: "Жадность",
    description:
      "После победы на уровне в кошелёк попадает больше монет. Копи быстрее и открывай остальные улучшения.",
    shopDescription:
      "После победы на уровне в кошелёк\nпопадает больше монет. Копи быстрее\nи открывай остальные улучшения.",
    effectSummary: "+20% к монетам за уровень (макс. +100%)",
    maxLevel: 5,
    formatCurrentEffect: (level) => {
      const multiplier = 1 + level * 0.2;
      return level === 0
        ? "Сейчас: ×1.0 к доходу"
        : `Сейчас: ×${multiplier.toFixed(1)} к доходу`;
    },
    formatNextEffect: (nextLevel) => {
      const multiplier = 1 + nextLevel * 0.2;
      return `После покупки: ×${multiplier.toFixed(1)} к доходу`;
    },
  },
};

export const MVP_UPGRADE_ORDER: MvpUpgradeId[] = [
  "extraChange",
  "extraBomb",
  "coinBoost",
];

/** Подпись уровня на карточке: «2 / 3» */
export function formatUpgradeLevelLabel(
  id: MvpUpgradeId,
  level: number,
): string {
  const max = MVP_UPGRADE_TEXTS[id].maxLevel;
  return `${level} / ${max}`;
}

function shopEffectLine(id: MvpUpgradeId, level: number): string {
  const def = MVP_UPGRADE_TEXTS[id];
  if (id === "coinBoost") {
    const multiplier =
      level >= def.maxLevel ? 1 + level * 0.2 : 1 + (level + 1) * 0.2;
    return `×${multiplier.toFixed(1)} к доходу`;
  }
  if (id === "extraBomb") {
    return "+1 заряд «Бомба» (макс. +3)";
  }
  return "+1 заряд «Разворот» (макс. +3)";
}

/** Компактный текст для карточки магазина */
export function formatShopCardText(id: MvpUpgradeId, level: number): string {
  const def = MVP_UPGRADE_TEXTS[id];
  return `${def.shopDescription}\n${shopEffectLine(id, level)}`;
}
