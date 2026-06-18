import { type SaveData, normalizeSaveData } from "../game/Upgrades";

declare global {
  interface Window {
    YaGames?: {
      init: () => Promise<YaGamesSdk>;
    };
  }
}

const SAVE_KEY = "arrowpixi_save";
const SDK_URL = "https://yandex.ru/games/sdk/v2";
const INTERSTITIAL_COOLDOWN_MS = 60_000;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      if (existing.dataset.loaded === "1") resolve();
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("SDK load error")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "1";
      resolve();
    };
    script.onerror = () => reject(new Error("SDK load error"));
    document.head.appendChild(script);
  });
}

interface YaGamesSdk {
  getPlayer?: () => Promise<YaGamesPlayer>;
  adv?: {
    showFullscreenAdv?: (options: {
      callbacks: {
        onOpen: () => void;
        onClose: () => void;
        onError: () => void;
        onOffline: () => void;
      };
    }) => void;
    showRewardedVideo?: (options: {
      callbacks: {
        onOpen: () => void;
        onRewarded: () => void;
        onClose: () => void;
        onError: () => void;
      };
    }) => void;
  };
  features?: { LoadingAPI?: { ready?: () => void } };
}

interface YaGamesPlayer {
  getData?: () => Promise<unknown>;
  setData?: (data: unknown) => Promise<void>;
}

export class YandexGamesService {
  private sdk: YaGamesSdk | null = null;
  private player: YaGamesPlayer | null = null;
  private lastInterstitialAt = 0;

  public get isReady(): boolean {
    return Boolean(this.sdk);
  }

  public async init(): Promise<void> {
    try {
      if (!window.YaGames) {
        await loadScript(SDK_URL);
      }
      if (!window.YaGames) return;

      this.sdk = await window.YaGames.init();
      this.player = (await this.sdk.getPlayer?.()) ?? null;
    } catch {
      this.sdk = null;
      this.player = null;
    }
  }

  public markLoadingReady(): void {
    try {
      this.sdk?.features?.LoadingAPI?.ready?.();
    } catch {
      // noop
    }
  }

  public async loadSave(): Promise<SaveData | null> {
    if (!this.player?.getData) return null;
    try {
      const raw = await this.player.getData();
      if (!raw || typeof raw !== "object") return null;
      const fromKey = (raw as Record<string, unknown>)[SAVE_KEY];
      return normalizeSaveData(fromKey ?? raw);
    } catch {
      return null;
    }
  }

  public async clearSave(): Promise<void> {
    await this.saveSave(normalizeSaveData({}));
  }

  public async saveSave(data: SaveData): Promise<void> {
    if (!this.player?.setData) return;
    try {
      await this.player.setData({ [SAVE_KEY]: data });
    } catch {
      try {
        await this.player.setData(data);
      } catch {
        // noop
      }
    }
  }

  public async showInterstitial(): Promise<void> {
    const now = Date.now();
    if (now - this.lastInterstitialAt < INTERSTITIAL_COOLDOWN_MS) return;
    const adv = this.sdk?.adv;
    const showFullscreenAdv = adv?.showFullscreenAdv;
    if (!showFullscreenAdv) return;

    this.lastInterstitialAt = now;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      try {
        showFullscreenAdv({
          callbacks: {
            onOpen: () => {},
            onClose: finish,
            onError: finish,
            onOffline: finish,
          },
        });
      } catch {
        finish();
      }

      setTimeout(finish, 4000);
    });
  }

  public async showRewarded(onRewarded: () => void): Promise<boolean> {
    const adv = this.sdk?.adv;
    const showRewardedVideo = adv?.showRewardedVideo;
    if (!showRewardedVideo) return false;

    let rewarded = false;
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      try {
        showRewardedVideo({
          callbacks: {
            onOpen: () => {},
            onRewarded: () => {
              rewarded = true;
              onRewarded();
            },
            onClose: finish,
            onError: finish,
          },
        });
      } catch {
        finish();
      }
    });
    return rewarded;
  }
}
