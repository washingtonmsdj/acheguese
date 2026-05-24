/**
 * LastTerritoryStore
 *
 * Lightweight singleton that stores the last resolved territorial context.
 * It is fed by TerritorialLayout and consumed by header/sidebar URL helpers.
 */

const STORAGE_KEY = "achegue:last_territory";

export interface LastTerritory {
  name: string;
  baseUrl: string;
}

class LastTerritoryStoreClass {
  private current: LastTerritory | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed: LastTerritory = JSON.parse(raw);
      if (parsed.baseUrl && !parsed.baseUrl.startsWith("/br/") && !parsed.baseUrl.startsWith("/local/")) {
        this.current = parsed;
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage failures and keep in-memory state only.
    }
  }

  get(): LastTerritory | null {
    return this.current;
  }

  set(territory: LastTerritory): void {
    if (this.current?.baseUrl === territory.baseUrl && this.current?.name === territory.name) return;

    this.current = territory;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(territory));
    } catch {
      // Ignore storage failures and keep in-memory state only.
    }

    this.listeners.forEach((listener) => listener());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const lastTerritoryStore = new LastTerritoryStoreClass();
