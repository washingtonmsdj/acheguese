import type * as MapLibreRuntime from "maplibre-gl";

let runtimePromise: Promise<typeof MapLibreRuntime> | null = null;

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
