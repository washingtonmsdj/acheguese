import type * as MapLibreRuntime from "maplibre-gl";

let runtimePromise: Promise<typeof MapLibreRuntime> | null = null;
let workersPrewarmed = false;

/**
 * Owner canônico do runtime MapLibre.
 *
 * Centraliza engine, CSS e worker atrás de import dinâmico. Consumidores que
 * precisam da API imperativa de MapLibre devem usar este loader em vez de
 * importar `maplibre-gl` diretamente.
 */
export function loadMapLibreRuntime(): Promise<typeof MapLibreRuntime> {
  if (!runtimePromise) {
    runtimePromise = Promise.all([
      import("maplibre-gl"),
      import("../config/maplibreWorkerRuntime"),
      import("./maplibreRuntimeCss"),
    ])
      .then(([runtime, { ensureMapLibreWorkerConfigured }]) => {
        ensureMapLibreWorkerConfigured(runtime.setWorkerUrl);
        return runtime;
      })
      .catch((error) => {
        runtimePromise = null;
        throw error;
      });
  }

  return runtimePromise;
}

export function preloadMapLibreRuntime(): Promise<void> {
  return loadMapLibreRuntime().then(() => undefined);
}

/**
 * Aquece o pool compartilhado de workers depois que o worker URL canônico já
 * foi configurado. É opt-in: use apenas quando um mapa será montado
 * imediatamente, para não manter workers vivos em rotas que talvez nunca usem
 * mapa.
 *
 * O prewarm é uma otimização, não uma dependência funcional. Falha ao importar
 * a engine continua rejeitando normalmente; uma exceção síncrona do prewarm
 * não pode impedir que o mapa tente montar com criação lazy de workers.
 */
export function prewarmMapLibreWorkers(): Promise<void> {
  return loadMapLibreRuntime().then((runtime) => {
    if (workersPrewarmed) return;

    try {
      runtime.prewarm();
      workersPrewarmed = true;
    } catch {
      // Best-effort only. Keep false so a later map may retry the optimization.
    }
  });
}