/**
 * LastTerritoryStore
 *
 * Singleton leve que persiste o último território visitado pelo usuário.
 * Alimentado pelo TerritorialLayout quando resolve qualquer território (bairro ou grupo).
 * Lido pelo useModuleUrls para exibir o chip no header mesmo fora de rotas territoriais.
 *
 * Não usa React state — é um store externo com subscribe, compatível com useSyncExternalStore.
 * Persiste em sessionStorage para sobreviver a navegações internas mas não entre sessões.
 */

const STORAGE_KEY = 'achegue:last_territory';

export interface LastTerritory {
  name: string;
  baseUrl: string;
}

class LastTerritoryStoreClass {
  private current: LastTerritory | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Restaura do sessionStorage na inicialização
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: LastTerritory = JSON.parse(raw);
        // Valida que o baseUrl é uma URL pública válida (sem /br, sem /local, sem /area como prefixo)
        if (parsed.baseUrl && !parsed.baseUrl.startsWith('/br/') && !parsed.baseUrl.startsWith('/local/')) {
          this.current = parsed;
        } else {
          sessionStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // sessionStorage indisponível — sem problema
    }
  }

  get(): LastTerritory | null {
    return this.current;
  }

  set(territory: LastTerritory): void {
    // Só notifica se mudou de fato
    if (
      this.current?.baseUrl === territory.baseUrl &&
      this.current?.name === territory.name
    ) return;

    this.current = territory;

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(territory));
    } catch {
      // sessionStorage indisponível — continua sem persistência
    }

    this.listeners.forEach((fn) => fn());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const lastTerritoryStore = new LastTerritoryStoreClass();
