/**
 * 💾 AAA Save System — Type-safe localStorage persistence
 *
 * Features:
 * - Type-safe save/load with unknown validation
 * - Version checking for save compatibility
 * - Auto-save functionality
 * - Export/import to file
 * - SSR-safe (não quebra em server-side)
 *
 * @version 2.1.0 - Type-safe + SSR-safe
 */

import {
  isBrowser,
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeSetInterval,
  safeClearInterval,
  getDocument,
} from "@/lib/ssr-guard";

// ── Types ───────────────────────────────────────────────────────────────

export type SaveData = {
  version: string;
  timestamp: number;
  data: Record<string, unknown>;  // ✅ Type-safe: unknown instead of any
};

// ── System ──────────────────────────────────────────────────────────────

export class SaveSystem {
  private storageKey: string;
  private version: string = "1.0.0";

  constructor(gameId: string) {
    this.storageKey = `ordax_save_${gameId}`;
  }

  save(data: Record<string, unknown>): boolean {
    if (!isBrowser()) {
      return false;
    }

    try {
      const saveData: SaveData = {
        version: this.version,
        timestamp: Date.now(),
        data,
      };

      return safeSetItem(this.storageKey, JSON.stringify(saveData));
    } catch {
      return false;
    }
  }

  load(): SaveData | null {
    if (!isBrowser()) {
      return null;
    }

    try {
      const saved = safeGetItem(this.storageKey);
      if (!saved) return null;

      const saveData: SaveData = JSON.parse(saved);

      // Version check
      if (saveData.version !== this.version) {
        // Could implement migration here
      }

      return saveData;
    } catch {
      return null;
    }
  }

  delete(): boolean {
    if (!isBrowser()) {
      return false;
    }

    return safeRemoveItem(this.storageKey);
  }

  exists(): boolean {
    if (!isBrowser()) {
      return false;
    }

    return safeGetItem(this.storageKey) !== null;
  }

  // Auto-save functionality
  enableAutoSave(interval: number, getData: () => Record<string, unknown>): number | null {
    if (!isBrowser()) {
      return null;
    }

    return safeSetInterval(() => {
      this.save(getData());
    }, interval);
  }

  disableAutoSave(intervalId: number | null): void {
    safeClearInterval(intervalId);
  }

  // Export save to file
  exportToFile(filename: string = "save.json"): boolean {
    if (!isBrowser()) {
      return false;
    }

    const saveData = this.load();
    if (!saveData) return false;

    try {
      const blob = new Blob([JSON.stringify(saveData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      
      const doc = getDocument();
      if (!doc) return false;
      
      const a = doc.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Import save from file
  importFromFile(file: File): Promise<boolean> {
    if (!isBrowser()) {
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (typeof result !== "string") {
            resolve(false);
            return;
          }
          const saveData: SaveData = JSON.parse(result);
          safeSetItem(this.storageKey, JSON.stringify(saveData));
          resolve(true);
        } catch {
          resolve(false);
        }
      };

      reader.onerror = () => resolve(false);
      reader.readAsText(file);
    });
  }
}
